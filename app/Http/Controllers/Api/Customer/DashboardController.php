<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\PromoResource;
use App\Http\Resources\UserResource;
use App\Models\Promo;
use App\Models\SupportTicket;
use App\Models\TicketMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Ringkasan dashboard pelanggan: data miliknya sendiri saja, dari tabel
 * yang sama dengan portal pelanggan web.
 */
class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->load(['customerProfile', 'customerServices.service', 'promoPurchases.promo.category']);

        $services = $user->customerServices->map(fn ($s) => [
            'id' => $s->id,
            'service_name' => $s->service_name,
            'package_type' => $s->package_type,
            'status' => $s->status,
            'expired_at' => $s->expired_at?->toDateString(),
            'service_slug' => $s->service?->slug,
        ])->values();

        $purchases = $user->promoPurchases->map(fn ($p) => [
            'id' => $p->id,
            'status' => $p->status,
            'purchase_date' => $p->purchase_date?->toDateString(),
            'promo' => $p->promo ? new PromoResource($p->promo) : null,
        ])->values();

        return response()->json([
            'user' => new UserResource($user),
            'stats' => [
                'services_total' => $services->count(),
                'services_active' => $services->where('status', 'active')->count(),
                'promos_owned' => $purchases->count(),
                'tickets_open' => SupportTicket::where('user_id', $user->id)
                    ->whereIn('status', ['open', 'in_progress', 'waiting_customer'])
                    ->count(),
                'unread_notifications' => $user->unreadNotificationsCount(),
                'unread_support_messages' => TicketMessage::where('is_read', false)
                    ->where('is_internal', false)
                    ->whereHas('ticket', fn ($q) => $q->where('user_id', $user->id))
                    ->whereHas('user', fn ($q) => $q->where('role', 'admin'))
                    ->count(),
            ],
            'services' => $services,
            'purchases' => $purchases,
            'featured_promos' => PromoResource::collection(
                Promo::active()->featured()->orderBy('sort_order')->limit(3)->get()
            ),
        ]);
    }
}
