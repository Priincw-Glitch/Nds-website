<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PromoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'image' => $this->image,
            'image_url' => \App\Support\ApiAsset::url($request, $this->image),
            'service_category_id' => $this->service_category_id,
            'discount_type' => $this->discount_type,
            'original_price' => $this->original_price,
            'discount_percentage' => $this->discount_percentage,
            'discount_amount' => $this->discount_amount,
            'final_price' => $this->final_price,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'cta_text' => $this->cta_text,
            'cta_url' => $this->cta_url,
            'is_active' => $this->is_active,
            'show_on_home' => $this->show_on_home,
            'is_featured' => $this->is_featured,
            'sort_order' => $this->sort_order,
            'computed_status' => $this->when(isset($this->computed_status), fn () => $this->computed_status),
            'category' => $this->whenLoaded('category', fn () => $this->category ? new ServiceCategoryResource($this->category) : null),
        ];
    }
}
