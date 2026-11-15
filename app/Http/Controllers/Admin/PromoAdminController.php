<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePromoRequest;
use App\Http\Requests\UpdatePromoRequest;
use App\Models\Promo;
use App\Models\ServiceCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PromoAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Promo::with('category');

        // Pencarian judul / deskripsi
        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $query->where(function ($builder) use ($q) {
                $builder->where('title', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhere('slug', 'like', "%{$q}%");
            });
        }

        // Filter Kategori (ID atau slug)
        if ($request->filled('category')) {
            $cat = $request->input('category');
            if (is_numeric($cat)) {
                $query->where('service_category_id', $cat);
            } else {
                $query->whereHas('category', fn ($q) => $q->where('slug', $cat));
            }
        }

        // Filter Status
        if ($request->filled('status')) {
            $status = $request->input('status');
            $today = now()->toDateString();

            if ($status === 'active') {
                $query->active();
            } elseif ($status === 'scheduled') {
                $query->where('is_active', true)->where('start_date', '>', $today);
            } elseif ($status === 'expired') {
                $query->where('is_active', true)->where('end_date', '<', $today);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            } elseif ($status === 'featured') {
                $query->where('is_featured', true);
            } elseif ($status === 'home') {
                $query->where('show_on_home', true);
            }
        }

        $promos = $query->orderBy('sort_order', 'asc')
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        // Statistik Status
        $today = now()->toDateString();
        $stats = [
            'total' => Promo::count(),
            'active' => Promo::active()->count(),
            'scheduled' => Promo::where('is_active', true)->where('start_date', '>', $today)->count(),
            'expired' => Promo::where('is_active', true)->where('end_date', '<', $today)->count(),
            'inactive' => Promo::where('is_active', false)->count(),
        ];

        // Daftar kategori layanan untuk tab / filter
        $categories = ServiceCategory::withCount('promos')
            ->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('Admin/Promos/Index', [
            'promos' => $promos,
            'categories' => $categories,
            'stats' => $stats,
            'filters' => $request->only(['q', 'category', 'status']),
        ]);
    }

    public function create(): Response
    {
        $categories = ServiceCategory::orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('Admin/Promos/Form', [
            'promo' => null,
            'categories' => $categories,
        ]);
    }

    public function store(StorePromoRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['is_active'] = $request->boolean('is_active');
        $data['show_on_home'] = $request->boolean('show_on_home', true);
        $data['is_featured'] = $request->boolean('is_featured');
        $data['sort_order'] = (int) ($data['sort_order'] ?? 0);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('promos', 'public');
            Log::info('Upload gambar promo', ['promo' => $data['slug'] ?? $data['title'] ?? null, 'path' => $data['image']]);
        }

        Promo::create($data);
        Cache::forget('home_data');

        return redirect()->route('admin.promos.index')->with('success', 'Promo berhasil ditambahkan.');
    }

    public function edit(Promo $promo): Response
    {
        $categories = ServiceCategory::orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('Admin/Promos/Form', [
            'promo' => $promo->load('category'),
            'categories' => $categories,
        ]);
    }

    public function update(UpdatePromoRequest $request, Promo $promo): RedirectResponse
    {
        $data = $request->validated();

        // Checkbox & status: pertahankan nilai lama jika tidak dikirim dalam request
        if ($request->has('is_active')) {
            $data['is_active'] = $request->boolean('is_active');
        } else {
            unset($data['is_active']);
        }

        if ($request->has('show_on_home')) {
            $data['show_on_home'] = $request->boolean('show_on_home');
        } else {
            unset($data['show_on_home']);
        }

        if ($request->has('is_featured')) {
            $data['is_featured'] = $request->boolean('is_featured');
        } else {
            unset($data['is_featured']);
        }

        if ($request->has('sort_order')) {
            $data['sort_order'] = (int) $data['sort_order'];
        } else {
            unset($data['sort_order']);
        }

        // Gambar: jika tidak diganti dan tidak diminta dihapus, pertahankan gambar lama
        if ($request->hasFile('image')) {
            if ($promo->image) {
                Storage::disk('public')->delete($promo->image);
            }
            $data['image'] = $request->file('image')->store('promos', 'public');
            Log::info('Ganti gambar promo', ['promo' => $promo->slug, 'path' => $data['image']]);
        } elseif ($request->boolean('remove_image')) {
            if ($promo->image) {
                Storage::disk('public')->delete($promo->image);
            }
            $data['image'] = null;
        } else {
            unset($data['image']);
        }

        unset($data['remove_image']);

        $promo->update($data);
        Cache::forget('home_data');

        return redirect()->route('admin.promos.index')->with('success', 'Promo berhasil diperbarui.');
    }

    public function destroy(Promo $promo): RedirectResponse
    {
        if ($promo->image) {
            Storage::disk('public')->delete($promo->image);
        }

        $promo->delete();
        Cache::forget('home_data');

        return redirect()->route('admin.promos.index')->with('success', 'Promo berhasil dihapus.');
    }

    public function duplicate(Promo $promo): RedirectResponse
    {
        $copy = $promo->replicate();
        $copy->title = $promo->title . ' (Salinan)';
        $baseSlug = Str::slug($promo->title . '-salinan');
        $slug = $baseSlug;
        $counter = 1;
        while (Promo::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }
        $copy->slug = $slug;
        $copy->is_active = false; // Set sebagai nonaktif/draft agar admin bisa memeriksa dulu
        $copy->save();

        Cache::forget('home_data');

        return redirect()->route('admin.promos.edit', $copy->id)->with('success', 'Promo berhasil diduplikasi. Silakan tinjau dan sesuaikan data promo salinan.');
    }
}
