<?php

use App\Models\SupportTicket;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Daftar percakapan untuk admin (pusat support)
Broadcast::channel('admin.support', function ($user) {
    return $user->isAdmin();
});

// Percakapan support: hanya pemilik tiket atau admin — private
Broadcast::channel('support.{ticket}', function ($user, $ticketId) {
    $ticket = SupportTicket::find($ticketId);

    if (! $ticket) {
        return false;
    }

    if ($user->isAdmin()) {
        return true;
    }

    return $user->isCustomer() && (int) $ticket->user_id === (int) $user->id;
});

// Status "sedang aktif membuka percakapan ini" — presence
Broadcast::channel('presence-support.{ticket}', function ($user, $ticketId) {
    $ticket = SupportTicket::find($ticketId);

    if (! $ticket) {
        return false;
    }

    if ($user->isAdmin()) {
        return ['id' => $user->id, 'name' => $user->name, 'role' => $user->role];
    }

    return $user->isCustomer() && (int) $ticket->user_id === (int) $user->id
        ? ['id' => $user->id, 'name' => $user->name, 'role' => $user->role]
        : false;
});
