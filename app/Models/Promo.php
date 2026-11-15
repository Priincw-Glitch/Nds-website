<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Promo extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'image',
        'service_category_id',
        'discount_type',
        'original_price',
        'discount_percentage',
        'discount_amount',
        'final_price',
        'start_date',
        'end_date',
        'cta_text',
        'cta_url',
        'is_active',
        'show_on_home',
        'is_featured',
        'sort_order',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
        'show_on_home' => 'boolean',
        'is_featured' => 'boolean',
        'original_price' => 'float',
        'discount_percentage' => 'float',
        'discount_amount' => 'float',
        'final_price' => 'float',
        'sort_order' => 'integer',
    ];

    protected $appends = [
        'computed_status',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', now()->toDateString());
            })
            ->where(function ($q) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', now()->toDateString());
            });
    }

    public function scopeShowOnHome($query)
    {
        return $query->where('show_on_home', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function getComputedStatusAttribute(): string
    {
        if (! $this->is_active) {
            return 'inactive';
        }

        $today = now()->startOfDay();

        if ($this->start_date && $this->start_date->startOfDay()->isFuture()) {
            return 'scheduled';
        }

        if ($this->end_date && $this->end_date->endOfDay()->isPast()) {
            return 'expired';
        }

        return 'active';
    }
}
