<?php

namespace App\Events;

use App\Models\SupportTicket;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Sinyal "sedang mengetik" pada percakapan support.
 * Channel private `support.{ticket}`, direlay via Reverb; client
 * membatasi frekuensi kiriman agar tidak broadcast setiap ketikan.
 */
class TicketTyping implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public SupportTicket $ticket,
        public int $userId,
        public string $role,
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('support.' . $this->ticket->id)];
    }

    public function broadcastAs(): string
    {
        return 'TicketTyping';
    }

    public function broadcastWith(): array
    {
        return [
            'ticket_id' => $this->ticket->id,
            'user_id'   => $this->userId,
            'role'      => $this->role,
        ];
    }
}
