<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupportTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_number' => $this->ticket_number,
            'user_id' => $this->user_id,
            'customer_service_id' => $this->customer_service_id,
            'title' => $this->title,
            'category' => $this->category,
            'status' => $this->status,
            'priority' => $this->priority,
            'assigned_to' => $this->assigned_to,
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'closed_at' => $this->closed_at?->toIso8601String(),
            'last_message_at' => $this->last_message_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'avatar_url' => \App\Support\ApiAsset::url($request, $this->user->avatar),
            ] : null),
            'assigned_admin' => $this->whenLoaded('assignedTo', fn () => $this->assignedTo ? [
                'id' => $this->assignedTo->id,
                'name' => $this->assignedTo->name,
            ] : null),
            'customer_service' => $this->whenLoaded('customerService', fn () => $this->customerService ? [
                'id' => $this->customerService->id,
                'service_name' => $this->customerService->service_name,
                'package_type' => $this->customerService->package_type,
            ] : null),
            'latest_message' => $this->whenLoaded('latestMessage', fn () => $this->latestMessage ? [
                'id' => $this->latestMessage->id,
                'message' => $this->latestMessage->message,
                'created_at' => $this->latestMessage->created_at?->toIso8601String(),
                'sender_role' => $this->latestMessage->user?->role,
            ] : null),
            'messages' => $this->whenLoaded('messages', fn () => TicketMessageResource::collection($this->messages)),
        ];
    }
}
