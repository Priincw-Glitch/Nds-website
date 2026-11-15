<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\ArticleCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Article::published()->with('category');

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->input('category')));
        }

        if ($request->filled('q')) {
            $q = $request->input('q');
            $query->where(function ($builder) use ($q) {
                $builder->where('title', 'like', "%{$q}%")
                    ->orWhere('excerpt', 'like', "%{$q}%");
            });
        }

        $articles = $query->orderByDesc('published_at')->paginate(9)->withQueryString();

        $categories = ArticleCategory::withCount('articles')->orderBy('name')->get(['id', 'name', 'slug']);

        return Inertia::render('Blog', [
            'articles' => $articles,
            'categories' => $categories,
            'filters' => $request->only(['category', 'q']),
        ]);
    }

    public function show(string $slug): Response
    {
        $article = Article::published()
            ->with('category')
            ->where('slug', $slug)
            ->firstOrFail();

        $related = Article::published()
            ->where('id', '!=', $article->id)
            ->when($article->article_category_id, fn ($q) => $q->where('article_category_id', $article->article_category_id))
            ->limit(3)
            ->get();

        if ($related->count() < 3) {
            $more = Article::published()
                ->where('id', '!=', $article->id)
                ->whereNotIn('id', $related->pluck('id'))
                ->limit(3 - $related->count())
                ->get();
            $related = $related->merge($more);
        }

        return Inertia::render('BlogDetail', [
            'article' => $article,
            'related' => $related,
        ]);
    }
}
