<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\TicketMessage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerDashboardController extends Controller
{
    /**
     * Overview pelanggan: sapaan, Customer ID, promo yang dimiliki,
     * pesan Support belum dibaca, dan notifikasi terbaru.
     */
    public function index(Request $request)
    {
        $user = $request->user()->load('customerProfile');

        // Promo yang ditetapkan Admin (untuk kartu ringkasan)
        $promoPurchases = $user->promoPurchases()
            ->with(['promo.category'])
            ->orderByDesc('purchase_date')
            ->orderByDesc('created_at')
            ->get();

        // Persamaan topik percakapan support + pesan belum dibaca
        $recentTickets = $user->supportTickets()
            ->with('latestMessage')
            ->orderByDesc('created_at')
            ->limit(4)
            ->get();

        $openTicketsCount = $user->supportTickets()
            ->whereIn('status', ['open', 'in_progress', 'waiting_customer'])
            ->count();

        $unreadSupportMessages = TicketMessage::where('is_read', false)
            ->where('is_internal', false)
            ->whereHas('ticket', fn ($q) => $q->where('user_id', $user->id))
            ->whereHas('user', fn ($q) => $q->where('role', 'admin'))
            ->count();

        // Get recent notifications
        $recentNotifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $unreadNotificationsCount = $user->unreadNotificationsCount();

        return Inertia::render('Customer/Dashboard', [
            'promoPurchases' => $promoPurchases,
            'recentTickets' => $recentTickets,
            'openTicketsCount' => $openTicketsCount,
            'unreadSupportMessages' => $unreadSupportMessages,
            'recentNotifications' => $recentNotifications,
            'unreadNotificationsCount' => $unreadNotificationsCount,
            'user' => $user,
        ]);
    }
}
