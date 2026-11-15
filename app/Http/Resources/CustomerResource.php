<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Pelanggan untuk panel admin: profil, langganan layanan, promo yang
 * dipegang, tiket terakhir, dan aktivitas. Struktur mengikuti bentuk
 * yang dipakai halaman web (CustomerManagementController@purchasesFor).
 */
class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role,
            'status' => $this->status,
            'avatar_url' => \App\Support\ApiAsset::url($request, $this->avatar),
            'created_at' => $this->created_at?->toIso8601String(),
            'customer_profile' => $this->whenLoaded('customerProfile', fn () => $this->customerProfile ? [
                'customer_code' => $this->customerProfile->customer_code,
                'address' => $this->customerProfile->address,
                'city' => $this->customerProfile->city,
                'province' => $this->customerProfile->province,
                'postal_code' => $this->customerProfile->postal_code,
                'notes' => $this->customerProfile->notes,
            ] : null),
            'purchases' => $this->whenLoaded('promoPurchases', fn () => $this->promoPurchases->map(fn ($p) => [
                'id' => $p->id,
                'promo' => $p->promo ? [
                    'id' => $p->promo->id,
                    'title' => $p->promo->title,
                    'image' => $p->promo->image,
                    'image_url' => \App\Support\ApiAsset::url($request, $p->promo->image),
                    'description' => $p->promo->description,
                    'category' => $p->promo->category ? ['id' => $p->promo->category->id, 'name' => $p->promo->category->name] : null,
                    'discount_type' => $p->promo->discount_type,
                    'original_price' => $p->promo->original_price,
                    'discount_percentage' => $p->promo->discount_percentage,
                    'discount_amount' => $p->promo->discount_amount,
                    'final_price' => $p->promo->final_price,
                ] : null,
                'purchase_date' => $p->purchase_date?->toDateString(),
                'status' => $p->status,
                'notes' => $p->notes,
            ])),
            'customer_services' => $this->whenLoaded('customerServices', fn () => CustomerServiceResource::collection($this->customerServices)),
            'support_tickets' => $this->whenLoaded('supportTickets', fn () => SupportTicketResource::collection($this->supportTickets)),
            'activity_logs' => $this->whenLoaded('activityLogs', fn () => $this->activityLogs->map(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'description' => $log->description,
                'created_at' => $log->created_at?->toIso8601String(),
            ])),
        ];
    }
}
