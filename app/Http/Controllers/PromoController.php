<?php

namespace App\Http\Controllers;

use App\Models\Promo;
use App\Models\ServiceCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PromoController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Promo', $this->catalog($request));
    }

    /**
     * Detail satu promo aktif berdasarkan slug. Halaman katalog yang sama
     * dirender dengan prop `promo`, sehingga modal detail terbuka untuk promo
     * yang diklik dan URL-nya bisa dibuka atau dibagikan langsung.
     */
    public function show(Request $request, string $slug): Response
    {
        // Promo non-aktif / berakhir tidak tayang publik, termasuk lewat URL langsung.
        $promo = Promo::active()
            ->with('category')
            ->where('slug', $slug)
            ->firstOrFail();

        return Inertia::render('Promo', $this->catalog($request) + [
            'promo' => $promo,
        ]);
    }

    /**
     * Data katalog promo (daftar + kategori + filter) yang dipakai index maupun show.
     */
    private function catalog(Request $request): array
    {
        $query = Promo::active()->with('category');

        // Pencarian judul / deskripsi
        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $query->where(function ($builder) use ($q) {
                $builder->where('title', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%");
            });
        }

        // Filter Kategori
        if ($request->filled('category')) {
            $category = $request->input('category');
            if ($category === 'promo-terbatas' || $category === 'terbatas') {
                $query->whereNotNull('end_date');
            } elseif ($category === 'diskon') {
                $query->where(function ($b) {
                    $b->where('discount_type', '!=', 'none')
                        ->orWhere('discount_percentage', '>', 0)
                        ->orWhere('discount_amount', '>', 0)
                        ->orWhere('title', 'like', '%diskon%')
                        ->orWhere('title', 'like', '%gratis%');
                });
            } else {
                // Filter berdasarkan slug kategori di database
                $query->whereHas('category', fn ($q) => $q->where('slug', $category));
            }
        }

        $promos = $query->orderBy('sort_order', 'asc')
            ->orderByDesc('start_date')
            ->paginate(9)
            ->withQueryString();

        $categories = ServiceCategory::withCount(['promos' => fn ($q) => $q->active()])
            ->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return [
            'promos' => $promos,
            'categories' => $categories,
            'filters' => $request->only(['category', 'q']),
        ];
    }

    /**
     * Satu promo aktif untuk popup otomatis di situs publik. Promo unggulan
     * didahulukan, lalu urutan tampil. Hasil null berarti tidak ada promo yang
     * sedang berlaku, sehingga popup tidak ditampilkan.
     */
    public function popup(): JsonResponse
    {
        // Tanpa cache: permintaan ini hanya sekali per sesi kunjungan, dan
        // perubahan promo di Admin Panel harus langsung terlihat.
        $promo = Promo::active()
            ->with('category:id,name,slug')
            ->orderByDesc('is_featured')
            ->orderBy('sort_order', 'asc')
            ->orderByDesc('start_date')
            ->first([
                'id', 'title', 'slug', 'description', 'image', 'service_category_id',
                'discount_type', 'original_price', 'discount_percentage',
                'discount_amount', 'final_price', 'start_date', 'end_date',
                'cta_text', 'cta_url', 'is_featured', 'sort_order',
            ]);

        return response()->json(['promo' => $promo]);
    }
}
