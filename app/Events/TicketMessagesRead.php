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
 * Pihak lain telah membuka dan membaca percakapan —
 * status centang pesan (Read) diperbarui realtime.
 */
class TicketMessagesRead implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public SupportTicket $ticket, public int $readById, public string $readByRole)
    {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('support.' . $this->ticket->id)];
    }

    public function broadcastAs(): string
    {
        return 'TicketMessagesRead';
    }

    public function broadcastWith(): array
    {
        return [
            'ticket_id'   => $this->ticket->id,
            'read_by_id'  => $this->readById,
            'read_by_role' => $this->readByRole,
        ];
    }
}
