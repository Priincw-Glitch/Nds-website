<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SupportTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_number',
        'user_id',
        'customer_service_id',
        'title',
        'category',
        'status',
        'priority',
        'assigned_to',
        'resolved_at',
        'closed_at',
        'last_message_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
        'last_message_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($ticket) {
            if (!$ticket->ticket_number) {
                $ticket->ticket_number = 'TKT-' . strtoupper(Str::random(8));
            }
        });
    }

    /**
     * Get the customer
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the related customer service
     */
    public function customerService()
    {
        return $this->belongsTo(CustomerService::class);
    }

    /**
     * Get the assigned admin
     */
    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get ticket messages
     */
    public function messages()
    {
        return $this->hasMany(TicketMessage::class, 'ticket_id')->orderBy('created_at', 'asc');
    }

    /**
     * Get the latest message
     */
    public function latestMessage()
    {
        return $this->hasOne(TicketMessage::class, 'ticket_id')->latestOfMany();
    }

    /**
     * Get unread messages count for user
     */
    public function unreadMessagesCount($userId): int
    {
        return $this->messages()
            ->where('user_id', '!=', $userId)
            ->where('is_read', false)
            ->count();
    }

    /**
     * Pesan customer yang belum dibaca admin (untuk daftar percakapan admin)
     */
    public function unreadSentByCustomersCount(): int
    {
        return $this->messages()
            ->where('is_read', false)
            ->whereHas('user', fn ($q) => $q->where('role', 'customer'))
            ->count();
    }

    /**
     * Pesan admin (non-internal) yang belum dibaca customer
     */
    public function unreadSentByAdminsCount(): int
    {
        return $this->messages()
            ->where('is_read', false)
            ->where('is_internal', false)
            ->whereHas('user', fn ($q) => $q->where('role', 'admin'))
            ->count();
    }

    /**
     * Check if ticket is open
     */
    public function isOpen(): bool
    {
        return $this->status === 'open';
    }

    /**
     * Check if ticket is closed
     */
    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    /**
     * Get category label
     */
    public function getCategoryLabelAttribute(): string
    {
        return match($this->category) {
            'general_inquiry' => 'Pertanyaan Umum',
            'technical_support' => 'Bantuan Teknis',
            'service_disruption' => 'Gangguan Layanan',
            'change_request' => 'Permintaan Perubahan',
            'maintenance_request' => 'Permintaan Pemeliharaan',
            'billing_admin' => 'Tagihan/Administrasi',
            'other' => 'Lainnya',
            default => ucfirst($this->category),
        };
    }

    /**
     * Get status label
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'open' => 'Terbuka',
            'in_progress' => 'Dalam Proses',
            'waiting_customer' => 'Menunggu Pelanggan',
            'resolved' => 'Selesai',
            'closed' => 'Ditutup',
            default => ucfirst($this->status),
        };
    }

    /**
     * Get status color
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'open' => 'warning',
            'in_progress' => 'info',
            'waiting_customer' => 'secondary',
            'resolved' => 'success',
            'closed' => 'secondary',
            default => 'secondary',
        };
    }

    /**
     * Get priority label
     */
    public function getPriorityLabelAttribute(): string
    {
        return match($this->priority) {
            'low' => 'Rendah',
            'medium' => 'Sedang',
            'high' => 'Tinggi',
            'urgent' => 'Mendesak',
            default => ucfirst($this->priority),
        };
    }

    /**
     * Get priority color
     */
    public function getPriorityColorAttribute(): string
    {
        return match($this->priority) {
            'low' => 'secondary',
            'medium' => 'info',
            'high' => 'warning',
            'urgent' => 'danger',
            default => 'secondary',
        };
    }
}
