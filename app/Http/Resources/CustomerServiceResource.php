<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'service_id' => $this->service_id,
            'service_name' => $this->service_name,
            'package_type' => $this->package_type,
            'status' => $this->status,
            'activated_at' => $this->activated_at?->toDateString(),
            'expired_at' => $this->expired_at?->toDateString(),
            'technical_info' => $this->technical_info,
            'notes' => $this->notes,
            'service' => $this->whenLoaded('service', fn () => $this->service ? [
                'id' => $this->service->id,
                'name' => $this->service->name,
                'slug' => $this->service->slug,
            ] : null),
            'customer' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'customer_code' => $this->user->customerProfile?->customer_code,
            ] : null),
        ];
    }
}
