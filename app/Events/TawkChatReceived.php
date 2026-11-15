<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TawkChatReceived implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $chat;

    public function __construct(array $chat)
    {
        $this->chat = $chat;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('admin.messages');
    }

    public function broadcastAs(): string
    {
        return 'TawkChatReceived';
    }

    public function broadcastWith(): array
    {
        return [
            'chat_id' => $this->chat['tawk_chat_id'] ?? null,
            'name' => $this->chat['name'] ?? 'Visitor',
            'created_at' => $this->chat['created_at'] ?? now()->toIso8601String(),
        ];
    }
}
