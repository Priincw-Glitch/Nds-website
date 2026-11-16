<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PromoResource;
use App\Http\Resources\ServiceCategoryResource;
use App\Models\ActivityLog;
use App\Models\Promo;
use App\Models\ServiceCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Manajemen promo via API mobile. Filter status, statistik, duplikasi,
 * dan penanganan gambar mengikuti PromoAdminController web.
 */
class PromoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Promo::with('category');

        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $query->where(function ($builder) use ($q) {
                $builder->where('title', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhere('slug', 'like', "%{$q}%");
            });
        }

        if ($request->filled('category')) {
            $cat = $request->input('category');
            if (is_numeric($cat)) {
                $query->where('service_category_id', (int) $cat);
            } else {
                $query->whereHas('category', fn ($q) => $q->where('slug', $cat));
            }
        }

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

        $promos = $query->orderBy('sort_order')->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15) ?: 15);

        $today = now()->toDateString();
        $stats = [
            'total' => Promo::count(),
            'active' => Promo::active()->count(),
            'scheduled' => Promo::where('is_active', true)->where('start_date', '>', $today)->count(),
            'expired' => Promo::where('is_active', true)->where('end_date', '<', $today)->count(),
            'inactive' => Promo::where('is_active', false)->count(),
        ];

        return response()->json([
            'data' => PromoResource::collection($promos->items()),
            'stats' => $stats,
            'categories' => ServiceCategoryResource::collection(
                ServiceCategory::withCount('promos')->orderBy('sort_order')->orderBy('name')->get()
            ),
            'meta' => [
                'current_page' => $promos->currentPage(),
                'last_page' => $promos->lastPage(),
                'per_page' => $promos->perPage(),
                'total' => $promos->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $data['slug'] = $this->uniqueSlug($data['title']);
        $data['is_active'] = $request->boolean('is_active');
        $data['show_on_home'] = $request->boolean('show_on_home', true);
        $data['is_featured'] = $request->boolean('is_featured');
        $data['sort_order'] = (int) ($data['sort_order'] ?? 0);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('promos', 'public');
        }

        $promo = Promo::create($data);
        Cache::forget('home_data');

        ActivityLog::log('promo_created', "Admin created promo via mobile: {$promo->title}", $promo);

        return response()->json([
            'message' => 'Promo berhasil ditambahkan.',
            'data' => new PromoResource($promo->load('category')),
        ], 201);
    }

    public function show(Promo $promo): JsonResponse
    {
        return response()->json(['data' => new PromoResource($promo->load('category'))]);
    }

    public function update(Request $request, Promo $promo): JsonResponse
    {
        $data = $this->validated($request);

        // Checkbox: pertahankan nilai lama jika tidak dikirim dalam request.
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

        if ($request->hasFile('image')) {
            $newPath = $request->file('image')->store('promos', 'public');

            if ($newPath) {
                if ($promo->image && $promo->image !== $newPath) {
                    Storage::disk('public')->delete($promo->image);
                }
                $data['image'] = $newPath;
            } else {
                unset($data['image']);
            }
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

        ActivityLog::log('promo_updated', "Admin updated promo via mobile: {$promo->title}", $promo);

        return response()->json([
            'message' => 'Promo berhasil diperbarui.',
            'data' => new PromoResource($promo->load('category')),
        ]);
    }

    public function destroy(Promo $promo): JsonResponse
    {
        if ($promo->image) {
            Storage::disk('public')->delete($promo->image);
        }

        ActivityLog::log('promo_deleted', "Admin deleted promo via mobile: {$promo->title}", $promo);
        $promo->delete();
        Cache::forget('home_data');

        return response()->json(['message' => 'Promo berhasil dihapus.']);
    }

    public function duplicate(Promo $promo): JsonResponse
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
        // Set sebagai nonaktif/draft agar admin bisa memeriksa dulu.
        $copy->is_active = false;
        $copy->save();

        Cache::forget('home_data');

        return response()->json([
            'message' => 'Promo berhasil diduplikasi. Silakan tinjau dan sesuaikan data promo salinan.',
            'data' => new PromoResource($copy->load('category')),
        ], 201);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'service_category_id' => ['nullable', 'integer', 'exists:service_categories,id'],
            'discount_type' => ['required', 'in:none,percentage,fixed,special_price'],
            'original_price' => ['nullable', 'numeric', 'min:0'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'final_price' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'cta_text' => ['nullable', 'string', 'max:255'],
            'cta_url' => ['nullable', 'string', 'max:255'],
        ]);
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'promo';
        $slug = $base;
        $suffix = 2;

        while (Promo::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
