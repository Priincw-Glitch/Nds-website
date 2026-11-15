<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreArticleRequest;
use App\Models\Article;
use App\Models\ArticleCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ArticleAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Article::with('category');

        if ($request->filled('q')) {
            $q = $request->input('q');
            $query->where(fn ($b) => $b->where('title', 'like', "%{$q}%")->orWhere('slug', 'like', "%{$q}%"));
        }

        if ($request->filled('category')) {
            $query->where('article_category_id', $request->input('category'));
        }

        $articles = $query->orderByDesc('published_at')->paginate(10)->withQueryString();

        return Inertia::render('Admin/Articles/Index', [
            'articles' => $articles,
            'categories' => ArticleCategory::orderBy('name')->get(),
            'filters' => $request->only(['q', 'category']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Articles/Form', [
            'article' => null,
            'categories' => ArticleCategory::orderBy('name')->get(),
        ]);
    }

    public function store(StoreArticleRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['is_published'] = $request->boolean('is_published');

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('articles', 'public');
        }

        Article::create($data);
        Cache::forget('home_data');
        return redirect()->route('admin.articles.index')->with('success', 'Artikel berhasil ditambahkan.');
    }

    public function edit(Article $article): Response
    {
        return Inertia::render('Admin/Articles/Form', [
            'article' => $article,
            'categories' => ArticleCategory::orderBy('name')->get(),
        ]);
    }

    public function update(StoreArticleRequest $request, Article $article): RedirectResponse
    {
        $data = $request->validated();
        $data['is_published'] = $request->boolean('is_published');

        if ($request->hasFile('image')) {
            if ($article->image) Storage::disk('public')->delete($article->image);
            $data['image'] = $request->file('image')->store('articles', 'public');
        }

        $article->update($data);
        Cache::forget('home_data');
        return redirect()->route('admin.articles.index')->with('success', 'Artikel berhasil diperbarui.');
    }

    public function destroy(Article $article): RedirectResponse
    {
        if ($article->image) Storage::disk('public')->delete($article->image);
        $article->delete();
        Cache::forget('home_data');
        return redirect()->route('admin.articles.index')->with('success', 'Artikel berhasil dihapus.');
    }
}
