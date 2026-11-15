<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceCoverage extends Model
{
    use HasFactory;

    protected $fillable = [
        'area_name',
        'city',
        'district',
        'province',
        'service_id',
        'service_name',
        'status',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSearchLocation($query, string $term)
    {
        $term = trim($term);
        return $query->where(function ($q) use ($term) {
            $q->where('area_name', 'LIKE', "%{$term}%")
              ->orWhere('city', 'LIKE', "%{$term}%")
              ->orWhere('district', 'LIKE', "%{$term}%")
              ->orWhere('province', 'LIKE', "%{$term}%");
        });
    }
}
