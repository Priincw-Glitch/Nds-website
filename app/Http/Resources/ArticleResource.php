<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'article_category_id' => $this->article_category_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'image' => $this->image,
            'image_url' => \App\Support\ApiAsset::url($request, $this->image),
            'author' => $this->author,
            'is_published' => $this->is_published,
            'published_at' => $this->published_at?->toIso8601String(),
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'category' => $this->whenLoaded('category', fn () => new ArticleCategoryResource($this->category)),
        ];
    }
}
