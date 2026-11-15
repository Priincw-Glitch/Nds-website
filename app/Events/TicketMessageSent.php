<?php

namespace App\Events;

use App\Models\SupportTicket;
use App\Models\TicketMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Pesan baru terkirim pada percakapan support.
 * Channel private `support.{ticket}` — hanya pemilik tiket atau admin.
 */
class TicketMessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public SupportTicket $ticket, public TicketMessage $message)
    {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('support.' . $this->ticket->id)];
    }

    public function broadcastAs(): string
    {
        return 'TicketMessageSent';
    }

    /**
     * Data pesan lengkap supaya penerima bisa menambahkan bubble
     * tanpa mem-muat ulang halaman.
     */
    public function broadcastWith(): array
    {
        $message = $this->message->loadMissing('user', 'attachments');

        return [
            'ticket_id'   => $this->ticket->id,
            'id'          => $message->id,
            'message'     => $message->message,
            'is_internal' => (bool) $message->is_internal,
            'is_read'     => false,
            'created_at'  => $message->created_at?->toISOString(),
            'user'        => [
                'id'   => $message->user->id,
                'name' => $message->user->name,
                'role' => $message->user->role,
            ],
            'attachments' => $message->attachments->map(fn ($a) => [
                'id'                => $a->id,
                'url'               => asset('storage/' . $a->path),
                'original_filename' => $a->original_filename,
                'file_size'         => $a->file_size,
            ])->values()->all(),
        ];
    }
}
