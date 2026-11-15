<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_category_id', 'name', 'slug', 'icon', 'image',
        'short_description', 'content', 'benefits', 'scope',
        'workflow', 'faq', 'meta_title', 'meta_description',
        'is_featured', 'is_published', 'sort_order', 'layout_size',
        'hero_title', 'hero_description', 'hero_layout',
        'hero_cta_text', 'hero_cta_url',
        'hero_secondary_cta_text', 'hero_secondary_cta_url',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'is_published' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    /**
     * Section konten halaman layanan, terurut sesuai urutan tampil.
     */
    public function sections(): HasMany
    {
        return $this->hasMany(ServiceSection::class)->orderBy('sort_order');
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Get customer services
     */
    public function customerServices()
    {
        return $this->hasMany(CustomerService::class);
    }

    /**
     * Get customer registrations
     */
    public function customerRegistrations()
    {
        return $this->hasMany(CustomerRegistration::class);
    }
}
