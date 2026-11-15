<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_id' => $this->ticket_id,
            'user_id' => $this->user_id,
            'message' => $this->message,
            'is_internal' => $this->is_internal,
            'is_read' => $this->is_read,
            'delivered_at' => $this->delivered_at?->toIso8601String(),
            'read_at' => $this->read_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'role' => $this->user->role,
                'avatar_url' => \App\Support\ApiAsset::url($request, $this->user->avatar),
            ] : null),
            'attachments' => $this->whenLoaded('attachments', fn () => TicketAttachmentResource::collection($this->attachments)),
        ];
    }
}
