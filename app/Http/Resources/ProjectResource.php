<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'category' => $this->category,
            'description' => $this->description,
            'thumbnail' => $this->thumbnail,
            'thumbnail_url' => \App\Support\ApiAsset::url($request, $this->thumbnail),
            'client' => $this->client,
            'is_published' => $this->is_published,
            'sort_order' => $this->sort_order,
        ];
    }
}
