<?php

namespace App\Events;

use App\Models\SupportTicket;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Klien penerima mengonfirmasi pesan sudah sampai perangkatnya —
 * pengirim memperbarui indikator Sent menjadi Delivered secara realtime.
 */
class TicketMessagesDelivered implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public SupportTicket $ticket,
        public array $deliveredIds,
        public int $deliveredByUserId,
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('support.' . $this->ticket->id)];
    }

    public function broadcastAs(): string
    {
        return 'TicketMessagesDelivered';
    }

    public function broadcastWith(): array
    {
        return [
            'ticket_id' => $this->ticket->id,
            'delivered_ids' => $this->deliveredIds,
            'delivered_by_user_id' => $this->deliveredByUserId,
        ];
    }
}
