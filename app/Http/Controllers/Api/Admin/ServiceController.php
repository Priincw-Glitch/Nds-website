<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\ActivityLog;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Manajemen layanan via API mobile. Aturan bisnis sama dengan
 * ServiceAdminController web: admin hanya mengelola informasi dasar,
 * slug tidak berubah saat update, dan hapus ditolak bila masih dipakai
 * data pelanggan.
 */
class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Service::with('category');

        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $query->where(fn ($builder) => $builder
                ->where('name', 'like', "%{$q}%")
                ->orWhere('slug', 'like', "%{$q}%"));
        }

        if ($request->filled('category')) {
            $query->where('service_category_id', (int) $request->input('category'));
        }

        $services = $query->orderBy('sort_order')->orderBy('name')
            ->paginate($request->integer('per_page', 15) ?: 15);

        return response()->json([
            'data' => ServiceResource::collection($services->items()),
            'meta' => [
                'current_page' => $services->currentPage(),
                'last_page' => $services->lastPage(),
                'per_page' => $services->perPage(),
                'total' => $services->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'service_category_id' => ['nullable', 'integer', 'exists:service_categories,id'],
            'short_description' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_published' => ['nullable', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $data['slug'] = $this->uniqueSlug($data['name']);
        $data['is_published'] = $request->boolean('is_published');
        $data['is_featured'] = $request->boolean('is_featured');
        $data['sort_order'] = $data['sort_order'] ?? 0;

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('services', 'public');
        }

        $service = Service::create($data);
        Cache::forget('home_data');

        ActivityLog::log('service_created', "Admin created service via mobile: {$service->name}", $service);

        return response()->json([
            'message' => 'Layanan berhasil ditambahkan.',
            'data' => new ServiceResource($service->load('category')),
        ], 201);
    }

    public function show(Service $service): JsonResponse
    {
        return response()->json(['data' => new ServiceResource($service->load(['category', 'sections']))]);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'service_category_id' => ['nullable', 'integer', 'exists:service_categories,id'],
            'short_description' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_published' => ['nullable', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        // Slug tidak ikut berubah agar URL halaman layanan tetap stabil.
        $data['is_published'] = $request->boolean('is_published');
        $data['is_featured'] = $request->boolean('is_featured');
        $data['sort_order'] = $data['sort_order'] ?? $service->sort_order;

        if ($request->hasFile('image')) {
            if ($service->image) {
                Storage::disk('public')->delete($service->image);
            }
            $data['image'] = $request->file('image')->store('services', 'public');
        }

        $service->update($data);
        Cache::forget('home_data');

        ActivityLog::log('service_updated', "Admin updated service via mobile: {$service->name}", $service);

        return response()->json([
            'message' => 'Layanan berhasil diperbarui.',
            'data' => new ServiceResource($service->load('category')),
        ]);
    }

    public function destroy(Service $service): JsonResponse
    {
        // Relasi layanan pelanggan memakai cascade di database: menghapus layanan
        // akan ikut menghapus data langganan pelanggan. Tolak sebelum terjadi.
        if ($service->customerServices()->exists() || $service->customerRegistrations()->exists()) {
            return response()->json([
                'message' => 'Layanan ini masih terhubung dengan data layanan pelanggan atau pendaftaran. Lepaskan relasinya terlebih dahulu sebelum menghapus.',
            ], 422);
        }

        if ($service->image) {
            Storage::disk('public')->delete($service->image);
        }

        ActivityLog::log('service_deleted', "Admin deleted service via mobile: {$service->name}", $service);
        $service->delete();
        Cache::forget('home_data');

        return response()->json(['message' => 'Layanan berhasil dihapus.']);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'layanan';
        $slug = $base;
        $suffix = 2;

        while (Service::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
