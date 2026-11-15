<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceSectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'description' => $this->description,
            'layout_variant' => $this->layout_variant,
            'payload' => $this->payload,
            'image' => $this->image,
            'image_url' => \App\Support\ApiAsset::url($request, $this->image),
            'sort_order' => $this->sort_order,
            'is_visible' => $this->is_visible,
        ];
    }
}
