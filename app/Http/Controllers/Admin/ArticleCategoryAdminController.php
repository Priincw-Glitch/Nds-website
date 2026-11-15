<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Models\ArticleCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ArticleCategoryAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $categories = ArticleCategory::withCount('articles')->orderBy('name')->paginate(10)->withQueryString();
        return Inertia::render('Admin/ArticleCategories/Index', [
            'categories' => $categories,
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $data = $request->safe()->only(['name', 'slug', 'description']);
        $data['slug'] = $data['slug'] ?: Str::slug($data['name']);
        ArticleCategory::create($data);
        // Nama kategori juga tampil pada kartu artikel beranda yang di-cache.
        Cache::forget('home_data');
        return redirect()->route('admin.article-categories.index')->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function update(StoreCategoryRequest $request, ArticleCategory $category): RedirectResponse
    {
        $data = $request->safe()->only(['name', 'slug', 'description']);
        $data['slug'] = $data['slug'] ?: Str::slug($data['name']);
        $category->update($data);
        Cache::forget('home_data');
        return redirect()->route('admin.article-categories.index')->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(ArticleCategory $category): RedirectResponse
    {
        $category->delete();
        Cache::forget('home_data');
        return redirect()->route('admin.article-categories.index')->with('success', 'Kategori berhasil dihapus.');
    }
}
