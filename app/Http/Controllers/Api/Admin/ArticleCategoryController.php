<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleCategoryResource;
use App\Models\ActivityLog;
use App\Models\ArticleCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ArticleCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = ArticleCategory::query()
            ->withCount('articles')
            ->when($request->filled('q'), fn ($q) => $q->where('name', 'like', '%' . trim($request->input('q')) . '%'))
            ->orderBy('name')
            ->get();

        return response()->json(['data' => ArticleCategoryResource::collection($categories)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $data['slug'] = $this->uniqueSlug($data['name']);

        $category = ArticleCategory::create($data);

        ActivityLog::log('article_category_created', "Admin created article category via mobile: {$category->name}", $category);

        return response()->json([
            'message' => 'Kategori artikel berhasil ditambahkan.',
            'data' => new ArticleCategoryResource($category),
        ], 201);
    }

    public function update(Request $request, ArticleCategory $category): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $category->update($data);

        ActivityLog::log('article_category_updated', "Admin updated article category via mobile: {$category->name}", $category);

        return response()->json([
            'message' => 'Kategori artikel berhasil diperbarui.',
            'data' => new ArticleCategoryResource($category),
        ]);
    }

    public function destroy(ArticleCategory $category): JsonResponse
    {
        if ($category->articles()->exists()) {
            return response()->json([
                'message' => 'Kategori masih dipakai oleh artikel. Pindahkan artikelnya terlebih dahulu sebelum menghapus.',
            ], 422);
        }

        ActivityLog::log('article_category_deleted', "Admin deleted article category via mobile: {$category->name}", $category);
        $category->delete();

        return response()->json(['message' => 'Kategori artikel berhasil dihapus.']);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'kategori-artikel';
        $slug = $base;
        $suffix = 2;

        while (ArticleCategory::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
