<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'phone' => $this->phone,
            'avatar' => $this->avatar,
            'avatar_url' => \App\Support\ApiAsset::url($request, $this->avatar),
            'status' => $this->status,
            'customer_profile' => $this->whenLoaded('customerProfile', fn () => $this->customerProfile ? [
                'id' => $this->customerProfile->id,
                'customer_code' => $this->customerProfile->customer_code,
                'address' => $this->customerProfile->address,
                'city' => $this->customerProfile->city,
                'province' => $this->customerProfile->province,
                'postal_code' => $this->customerProfile->postal_code,
                'notes' => $this->customerProfile->notes,
            ] : null),
            'unread_notifications_count' => $this->when(
                isset($this->unread_notifications_count),
                fn () => $this->unread_notifications_count
            ),
        ];
    }
}
