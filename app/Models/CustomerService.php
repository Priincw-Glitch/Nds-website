<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerService extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'service_id',
        'service_name',
        'package_type',
        'status',
        'activated_at',
        'expired_at',
        'technical_info',
        'notes',
    ];

    protected $casts = [
        'activated_at' => 'date',
        'expired_at' => 'date',
        'technical_info' => 'array',
    ];

    /**
     * Get the customer
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the service
     */
    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Get support tickets for this service
     */
    public function supportTickets()
    {
        return $this->hasMany(SupportTicket::class);
    }

    /**
     * Check if service is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if service is waiting activation
     */
    public function isWaitingActivation(): bool
    {
        return $this->status === 'waiting_activation';
    }

    /**
     * Check if service is expired
     */
    public function isExpired(): bool
    {
        return $this->status === 'expired' || ($this->expired_at && $this->expired_at->isPast());
    }

    /**
     * Get status badge color
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'active' => 'success',
            'waiting_activation' => 'warning',
            'maintenance' => 'info',
            'suspended' => 'danger',
            'expired' => 'secondary',
            default => 'secondary',
        };
    }

    /**
     * Get status label
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'waiting_activation' => 'Menunggu Aktivasi',
            'active' => 'Aktif',
            'maintenance' => 'Dalam Pemeliharaan',
            'suspended' => 'Ditangguhkan',
            'expired' => 'Berakhir',
            default => ucfirst($this->status),
        };
    }
}
