<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\ContactMessage;
use App\Models\Promo;
use App\Models\Service;
use App\Models\ServiceCoverage;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Statistik dashboard admin untuk aplikasi mobile. Angka dihitung dari
 * database yang sama dengan dashboard web (DashboardController web).
 */
class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
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
            'customers' => User::where('role', 'customer')->count(),
            'active_customers' => User::where('role', 'customer')->where('status', 'active')->count(),
            'open_tickets' => SupportTicket::whereIn('status', ['open', 'in_progress', 'waiting_customer'])->count(),
        ];

        $recentUpdates = collect([
            Service::latest('updated_at')->limit(3)->get(['id', 'name as title', 'updated_at'])->map(fn ($i) => [
                'id' => $i->id, 'title' => $i->title, 'type' => 'Layanan', 'updated_at' => $i->updated_at?->toIso8601String(),
            ]),
            Promo::latest('updated_at')->limit(3)->get(['id', 'title', 'updated_at'])->map(fn ($i) => [
                'id' => $i->id, 'title' => $i->title, 'type' => 'Promo', 'updated_at' => $i->updated_at?->toIso8601String(),
            ]),
            Article::latest('updated_at')->limit(3)->get(['id', 'title', 'updated_at'])->map(fn ($i) => [
                'id' => $i->id, 'title' => $i->title, 'type' => 'Artikel Blog', 'updated_at' => $i->updated_at?->toIso8601String(),
            ]),
        ])->flatten(1)->sortByDesc('updated_at')->values()->take(5);

        $recentMessages = ContactMessage::latest()->limit(5)->get(['id', 'name', 'email', 'subject', 'status', 'created_at'])
            ->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'email' => $m->email,
                'subject' => $m->subject,
                'status' => $m->status,
                'created_at' => $m->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'stats' => $stats,
            'recent_updates' => $recentUpdates,
            'recent_messages' => $recentMessages,
        ]);
    }
}
