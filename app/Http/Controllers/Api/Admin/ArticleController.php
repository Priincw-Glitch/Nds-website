<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleResource;
use App\Models\ActivityLog;
use App\Models\Article;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Manajemen artikel blog via API mobile. Aturan sama dengan
 * ArticleAdminController web: slug dibuat dari judul saat baru dan
 * tidak berubah saat update.
 */
class ArticleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Article::with('category');

        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $query->where(fn ($builder) => $builder
                ->where('title', 'like', "%{$q}%")
                ->orWhere('slug', 'like', "%{$q}%"));
        }

        if ($request->filled('category')) {
            $query->where('article_category_id', (int) $request->input('category'));
        }

        if ($request->filled('status')) {
            if ($request->input('status') === 'published') {
                $query->where('is_published', true);
            } elseif ($request->input('status') === 'draft') {
                $query->where('is_published', false);
            }
        }

        $articles = $query->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15) ?: 15);

        return response()->json([
            'data' => ArticleResource::collection($articles->items()),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $data['slug'] = $this->uniqueSlug($data['title']);
        $data['is_published'] = $request->boolean('is_published');
        $data['published_at'] = $data['published_at'] ?? ($data['is_published'] ? now() : null);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('articles', 'public');
        }

        $article = Article::create($data);

        ActivityLog::log('article_created', "Admin created article via mobile: {$article->title}", $article);

        return response()->json([
            'message' => 'Artikel berhasil ditambahkan.',
            'data' => new ArticleResource($article->load('category')),
        ], 201);
    }

    public function show(Article $article): JsonResponse
    {
        return response()->json(['data' => new ArticleResource($article->load('category'))]);
    }

    public function update(Request $request, Article $article): JsonResponse
    {
        $data = $this->validated($request);

        $wasPublished = $article->is_published;
        $data['is_published'] = $request->boolean('is_published');

        // Artikel yang tayang untuk pertama kali mendapatkan tanggal terbit.
        if ($data['is_published'] && ! $wasPublished && ! $article->published_at) {
            $data['published_at'] = now();
        }

        if ($request->hasFile('image')) {
            if ($article->image) {
                Storage::disk('public')->delete($article->image);
            }
            $data['image'] = $request->file('image')->store('articles', 'public');
        } elseif ($request->boolean('remove_image')) {
            if ($article->image) {
                Storage::disk('public')->delete($article->image);
            }
            $data['image'] = null;
        } else {
            unset($data['image']);
        }

        unset($data['remove_image']);

        $article->update($data);

        ActivityLog::log('article_updated', "Admin updated article via mobile: {$article->title}", $article);

        return response()->json([
            'message' => 'Artikel berhasil diperbarui.',
            'data' => new ArticleResource($article->load('category')),
        ]);
    }

    public function destroy(Article $article): JsonResponse
    {
        if ($article->image) {
            Storage::disk('public')->delete($article->image);
        }

        ActivityLog::log('article_deleted', "Admin deleted article via mobile: {$article->title}", $article);
        $article->delete();

        return response()->json(['message' => 'Artikel berhasil dihapus.']);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'article_category_id' => ['nullable', 'integer', 'exists:article_categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['nullable', 'string'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'author' => ['nullable', 'string', 'max:255'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'published_at' => ['nullable', 'date'],
        ]);
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'artikel';
        $slug = $base;
        $suffix = 2;

        while (Article::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
