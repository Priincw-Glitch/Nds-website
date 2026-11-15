<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceSection extends Model
{
    protected $fillable = [
        'service_id', 'type', 'title', 'description',
        'layout_variant', 'payload', 'image', 'sort_order', 'is_visible',
    ];

    protected $casts = [
        'payload' => 'array',
        'is_visible' => 'boolean',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
