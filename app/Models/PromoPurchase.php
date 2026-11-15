<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromoPurchase extends Model
{
    protected $fillable = [
        'user_id',
        'promo_id',
        'purchase_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'purchase_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function promo(): BelongsTo
    {
        return $this->belongsTo(Promo::class);
    }
}
