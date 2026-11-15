<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceCategoryResource;
use App\Models\ActivityLog;
use App\Models\ServiceCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ServiceCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = ServiceCategory::query()
            ->withCount('services')
            ->when($request->filled('q'), fn ($q) => $q->where('name', 'like', '%' . trim($request->input('q')) . '%'))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => ServiceCategoryResource::collection($categories)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $data['slug'] = $this->uniqueSlug($data['name']);
        $data['sort_order'] = $data['sort_order'] ?? 0;

        $category = ServiceCategory::create($data);

        ActivityLog::log('service_category_created', "Admin created service category via mobile: {$category->name}", $category);

        return response()->json([
            'message' => 'Kategori layanan berhasil ditambahkan.',
            'data' => new ServiceCategoryResource($category),
        ], 201);
    }

    public function update(Request $request, ServiceCategory $category): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $category->update($data);

        ActivityLog::log('service_category_updated', "Admin updated service category via mobile: {$category->name}", $category);

        return response()->json([
            'message' => 'Kategori layanan berhasil diperbarui.',
            'data' => new ServiceCategoryResource($category),
        ]);
    }

    public function destroy(ServiceCategory $category): JsonResponse
    {
        if ($category->services()->exists()) {
            return response()->json([
                'message' => 'Kategori masih dipakai oleh layanan. Pindahkan layanannya terlebih dahulu sebelum menghapus.',
            ], 422);
        }

        ActivityLog::log('service_category_deleted', "Admin deleted service category via mobile: {$category->name}", $category);
        $category->delete();

        return response()->json(['message' => 'Kategori layanan berhasil dihapus.']);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'kategori';
        $slug = $base;
        $suffix = 2;

        while (ServiceCategory::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
