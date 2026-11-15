<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SettingsUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $logoPath;

    public function __construct(string $logoPath)
    {
        $this->logoPath = $logoPath;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('settings');
    }

    public function broadcastAs(): string
    {
        return 'SettingsUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'logo_path' => $this->logoPath,
        ];
    }
}
