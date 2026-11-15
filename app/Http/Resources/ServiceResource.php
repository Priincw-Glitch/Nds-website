<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service_category_id' => $this->service_category_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'icon' => $this->icon,
            'image' => $this->image,
            'image_url' => \App\Support\ApiAsset::url($request, $this->image),
            'short_description' => $this->short_description,
            'content' => $this->content,
            'benefits' => $this->benefits,
            'scope' => $this->scope,
            'workflow' => $this->workflow,
            'faq' => $this->faq,
            'is_featured' => $this->is_featured,
            'is_published' => $this->is_published,
            'sort_order' => $this->sort_order,
            'category' => $this->whenLoaded('category', fn () => new ServiceCategoryResource($this->category)),
            'sections' => $this->whenLoaded('sections', fn () => ServiceSectionResource::collection($this->sections)),
        ];
    }
}
