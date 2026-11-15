<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    /**
     * Get the user
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mark as read
     */
    public function markAsRead()
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    /**
     * Get icon based on type
     */
    public function getIconAttribute(): string
    {
        return match($this->type) {
            'account_activated' => 'check-circle',
            'service_activated' => 'zap',
            'service_status_changed' => 'info',
            'ticket_reply' => 'message-square',
            'ticket_status_changed' => 'file-text',
            'promo_assigned' => 'badge-percent',
            'promo_status_changed' => 'tag',
            'announcement' => 'megaphone',
            default => 'bell',
        };
    }

    /**
     * Get color based on type
     */
    public function getColorAttribute(): string
    {
        return match($this->type) {
            'account_activated' => 'success',
            'service_activated' => 'success',
            'service_status_changed' => 'info',
            'ticket_reply' => 'primary',
            'ticket_status_changed' => 'warning',
            'promo_assigned' => 'success',
            'promo_status_changed' => 'info',
            'announcement' => 'info',
            default => 'secondary',
        };
    }
}
