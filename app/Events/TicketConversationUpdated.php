<?php

namespace App\Events;

use App\Models\SupportTicket;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Ringkasan percakapan diperbarui: untuk daftar percakapan Customer
 * (channel private milik user) dan daftar percakapan Admin
 * (channel private `admin.support`), tanpa harus subscribe ke
 * setiap tiket satu per satu.
 */
class TicketConversationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  int|null  $unreadForCustomer  jumlah pesan admin yang belum dibaca customer
     * @param  int|null  $unreadForAdmin     jumlah pesan customer yang belum dibaca admin
     */
    public function __construct(
        public SupportTicket $ticket,
        public ?int $unreadForCustomer = null,
        public ?int $unreadForAdmin = null,
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            static::customerChannel($this->ticket),
            static::adminChannel(),
        ];
    }

    /**
     * Channel milik customer tiket ini.
     */
    public static function customerChannel(SupportTicket $ticket): PrivateChannel
    {
        return new PrivateChannel('App.Models.User.' . $ticket->user_id);
    }

    /**
     * Channel shared untuk semua admin.
     */
    public static function adminChannel(): PrivateChannel
    {
        return new PrivateChannel('admin.support');
    }

    public function broadcastAs(): string
    {
        return 'TicketConversationUpdated';
    }

    public function broadcastWith(): array
    {
        $ticket = $this->ticket->loadMissing(['latestMessage.user', 'assignedTo']);
        $last = $ticket->latestMessage;

        return [
            'ticket_id'     => $ticket->id,
            'ticket_number' => $ticket->ticket_number,
            'status'        => $ticket->status,
            'last_message'  => $last ? \Illuminate\Support\Str::limit($last->message, 120) : null,
            'last_message_at' => $ticket->last_message_at?->toISOString() ?? $last?->created_at?->toISOString(),
            'last_actor_role' => $last?->user?->role,
            'last_actor_name' => $last?->user?->name,
            'last_is_internal' => (bool) ($last?->is_internal ?? false),
            'assigned_to_id'   => $ticket->assigned_to,
            'assigned_to_name' => $ticket->assignedTo?->name,
            'unread_for_customer' => $this->unreadForCustomer,
            'unread_for_admin'    => $this->unreadForAdmin,
        ];
    }
}
