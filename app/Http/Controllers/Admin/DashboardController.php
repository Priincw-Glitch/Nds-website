<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\ContactMessage;
use App\Models\Promo;
use App\Models\Service;
use App\Models\ServiceCoverage;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $today = now()->toDateString();

        // Statistik murni dari database
        $stats = [
            'services' => Service::count(),
            'services_published' => Service::where('is_published', true)->count(),
            'promos' => Promo::count(),
            'promos_active' => Promo::active()->count(),
            'articles' => Article::count(),
            'articles_published' => Article::where('is_published', true)->count(),
            'coverages' => ServiceCoverage::count(),
            'coverages_available' => ServiceCoverage::where('status', 'available')->count(),
            'unread_messages' => ContactMessage::where('status', 'unread')->count(),
            'total_messages' => ContactMessage::count(),
        ];

        // Konten yang terakhir diperbarui di sistem
        $recentServices = Service::latest('updated_at')->limit(3)->get(['id', 'name as title', 'updated_at'])->map(fn ($item) => [
            'id' => $item->id,
            'title' => $item->title,
            'type' => 'Layanan',
            'updated_at' => $item->updated_at?->toIso8601String(),
            'url' => route('admin.services.edit', $item->id),
        ]);

        $recentPromos = Promo::latest('updated_at')->limit(3)->get(['id', 'title', 'updated_at'])->map(fn ($item) => [
            'id' => $item->id,
            'title' => $item->title,
            'type' => 'Promo',
            'updated_at' => $item->updated_at?->toIso8601String(),
            'url' => route('admin.promos.edit', $item->id),
        ]);

        $recentArticles = Article::latest('updated_at')->limit(3)->get(['id', 'title', 'updated_at'])->map(fn ($item) => [
            'id' => $item->id,
            'title' => $item->title,
            'type' => 'Artikel Blog',
            'updated_at' => $item->updated_at?->toIso8601String(),
            'url' => route('admin.articles.edit', $item->id),
        ]);

        $recentUpdates = collect()
            ->merge($recentServices)
            ->merge($recentPromos)
            ->merge($recentArticles)
            ->sortByDesc('updated_at')
            ->values()
            ->take(5);

        // Pesan masuk terbaru
        $recentMessages = ContactMessage::latest()->limit(5)->get(['id', 'name', 'email', 'subject', 'status', 'created_at']);

        // Info sistem teknis
        $systemInfo = [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'environment' => config('app.env'),
            'database' => config('database.default'),
            'server_time' => now()->translatedFormat('d F Y, H:i:s T'),
        ];

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recentUpdates' => $recentUpdates,
            'recentMessages' => $recentMessages,
            'systemInfo' => $systemInfo,
        ]);
    }
}
