<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CoverageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'area_name' => $this->area_name,
            'city' => $this->city,
            'district' => $this->district,
            'province' => $this->province,
            'service_id' => $this->service_id,
            'service_name' => $this->service_name,
            'status' => $this->status,
            'notes' => $this->notes,
            'is_active' => $this->is_active,
            'service' => $this->whenLoaded('service', fn () => $this->service ? [
                'id' => $this->service->id,
                'name' => $this->service->name,
            ] : null),
        ];
    }
}
