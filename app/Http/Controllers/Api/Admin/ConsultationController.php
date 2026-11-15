<?php

namespace App\Http\Controllers\Api\Admin;

use App\Events\TicketConversationUpdated;
use App\Events\TicketMessageSent;
use App\Events\TicketMessagesRead;
use App\Http\Controllers\Controller;
use App\Http\Resources\SupportTicketResource;
use App\Http\Resources\TicketMessageResource;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\SupportTicket;
use App\Models\TicketMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Kotak masuk konsultasi (support tickets) untuk aplikasi mobile admin.
 * Aturan pembalasan, perubahan status, dan notifikasi pelanggan mengikuti
 * SupportTicketManagementController web.
 */
class ConsultationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SupportTicket::with(['user', 'customerService', 'latestMessage.user', 'assignedTo']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $query->where(function ($builder) use ($q) {
                $builder->where('ticket_number', 'like', "%{$q}%")
                    ->orWhere('title', 'like', "%{$q}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%"));
            });
        }

        $tickets = $query->orderByDesc('last_message_at')->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15) ?: 15);

        return response()->json([
            'data' => SupportTicketResource::collection($tickets->items()),
            'meta' => [
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
            ],
        ]);
    }

    public function statistics(): JsonResponse
    {
        $statistics = [
            'total' => SupportTicket::count(),
            'open' => SupportTicket::where('status', 'open')->count(),
            'in_progress' => SupportTicket::where('status', 'in_progress')->count(),
            'waiting_customer' => SupportTicket::where('status', 'waiting_customer')->count(),
            'resolved' => SupportTicket::where('status', 'resolved')->count(),
            'closed' => SupportTicket::where('status', 'closed')->count(),
            'urgent' => SupportTicket::whereIn('status', ['open', 'in_progress'])->where('priority', 'urgent')->count(),
            'unread_messages' => TicketMessage::where('is_read', false)
                ->where('is_internal', false)
                ->whereHas('user', fn ($q) => $q->where('role', 'customer'))
                ->count(),
        ];

        return response()->json(['data' => $statistics]);
    }

    public function show(Request $request, SupportTicket $ticket): JsonResponse
    {
        // Riwayat awal: 50 pesan terbaru (asc); pesan lebih lama dimuat lewat
        // endpoint messages(). Pesan internal admin juga ditampilkan di sisi admin.
        $messages = TicketMessage::where('ticket_id', $ticket->id)
            ->with(['user', 'attachments'])
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->reverse()
            ->values();

        return response()->json([
            'data' => new SupportTicketResource($ticket->load(['user', 'customerService', 'assignedTo'])),
            'messages' => TicketMessageResource::collection($messages),
        ]);
    }

    public function messages(Request $request, SupportTicket $ticket): JsonResponse
    {
        $beforeId = (int) $request->query('before_id', 0);

        $query = TicketMessage::where('ticket_id', $ticket->id)
            ->with(['user', 'attachments'])
            ->orderByDesc('id')
            ->limit(30);

        if ($beforeId > 0) {
            $query->where('id', '<', $beforeId);
        }

        $total = TicketMessage::where('ticket_id', $ticket->id)->count();

        return response()->json([
            'messages' => TicketMessageResource::collection($query->get()->reverse()->values()),
            'has_more' => $beforeId > 0
                ? TicketMessage::where('ticket_id', $ticket->id)->where('id', '<', $beforeId)->count() > 30
                : $total > 30,
        ]);
    }

    public function reply(Request $request, SupportTicket $ticket): JsonResponse
    {
        $request->validate([
            'message' => ['required', 'string', 'max:5000'],
            'attachments.*' => ['nullable', 'file', 'mimes:jpeg,png,jpg,pdf,doc,docx', 'max:5120'],
            'client_key' => ['nullable', 'string', 'max:64'],
        ]);

        // Retry/klik ganda dengan client_key yang sama dianggap sudah terkirim.
        if ($request->filled('client_key')) {
            $duplicate = TicketMessage::where('client_key', $request->client_key)->first();
            if ($duplicate) {
                return response()->json([
                    'message' => 'Pesan Anda sudah terkirim sebelumnya.',
                    'data' => new TicketMessageResource($duplicate->load(['user', 'attachments'])),
                ]);
            }
        }

        $message = TicketMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'message' => trim($request->input('message')),
            'client_key' => $request->input('client_key'),
        ]);

        $this->storeAttachments($request, $message);

        // Pesan pelanggan yang belum dibaca menjadi terbaca setelah admin membalas.
        TicketMessage::where('ticket_id', $ticket->id)
            ->where('user_id', '!=', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now(), 'delivered_at' => now()]);

        TicketMessagesRead::dispatch($ticket, $request->user()->id, 'admin');

        if ($ticket->status === 'open') {
            $ticket->update(['status' => 'in_progress']);
        }

        $ticket->update(['last_message_at' => now()]);

        ActivityLog::log('ticket_reply', "Admin replied to ticket via mobile: {$ticket->ticket_number}", $ticket);

        $this->broadcastMessage($ticket->fresh(), $message);

        return response()->json([
            'message' => 'Balasan berhasil dikirim.',
            'data' => new TicketMessageResource($message->load(['user', 'attachments'])),
        ], 201);
    }

    public function markDelivered(Request $request, SupportTicket $ticket): JsonResponse
    {
        $ids = TicketMessage::where('ticket_id', $ticket->id)
            ->where('user_id', '!=', $request->user()->id)
            ->where('is_internal', false)
            ->whereNull('delivered_at')
            ->pluck('id');

        if ($ids->isNotEmpty()) {
            TicketMessage::whereIn('id', $ids)->update(['delivered_at' => now()]);
        }

        return response()->noContent();
    }

    public function updateStatus(Request $request, SupportTicket $ticket): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:open,in_progress,waiting_customer,resolved,closed'],
        ]);

        $newStatus = $request->input('status');

        $updates = ['status' => $newStatus];
        if ($newStatus === 'resolved') {
            $updates['resolved_at'] = now();
        }
        if ($newStatus === 'closed') {
            $updates['closed_at'] = now();
        }

        $ticket->update($updates);

        Notification::create([
            'user_id' => $ticket->user_id,
            'type' => 'ticket_status_changed',
            'title' => 'Status Konsultasi Diperbarui',
            'message' => "Permintaan konsultasi {$ticket->ticket_number} kini berstatus \"{$newStatus}\".",
            'data' => ['ticket_id' => $ticket->id, 'status' => $newStatus],
        ]);

        ActivityLog::log('ticket_status_changed', "Admin changed ticket status via mobile: {$ticket->ticket_number} → {$newStatus}", $ticket);

        $this->broadcastConversation($ticket->fresh());

        return response()->json([
            'message' => 'Status konsultasi berhasil diperbarui.',
            'data' => new SupportTicketResource($ticket->fresh()),
        ]);
    }

    public function updatePriority(Request $request, SupportTicket $ticket): JsonResponse
    {
        $request->validate([
            'priority' => ['required', 'in:low,medium,high,urgent'],
        ]);

        $ticket->update(['priority' => $request->input('priority')]);

        ActivityLog::log('ticket_priority_changed', "Admin changed ticket priority via mobile: {$ticket->ticket_number} → {$ticket->priority}", $ticket);

        return response()->json([
            'message' => 'Prioritas berhasil diperbarui.',
            'data' => new SupportTicketResource($ticket->fresh()),
        ]);
    }

    public function assign(Request $request, SupportTicket $ticket): JsonResponse
    {
        $request->validate([
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $assignee = $request->filled('assigned_to')
            ? User::where('id', $request->input('assigned_to'))->where('role', 'admin')->first()
            : null;

        if ($request->filled('assigned_to') && ! $assignee) {
            return response()->json(['message' => 'Admin tujuan tidak ditemukan.'], 422);
        }

        $ticket->update(['assigned_to' => $assignee?->id]);

        ActivityLog::log('ticket_assigned', $assignee
            ? "Admin assigned ticket via mobile: {$ticket->ticket_number} → {$assignee->name}"
            : "Admin unassigned ticket via mobile: {$ticket->ticket_number}", $ticket);

        return response()->json([
            'message' => $assignee ? "Tiket ditugaskan ke {$assignee->name}." : 'Penugasan tiket dihapus.',
            'data' => new SupportTicketResource($ticket->fresh()->load('assignedTo')),
        ]);
    }

    /**
     * Daftar admin untuk dropdown penugasan.
     */
    public function admins(): JsonResponse
    {
        return response()->json([
            'data' => User::where('role', 'admin')->orderBy('name')->get(['id', 'name', 'email']),
        ]);
    }

    protected function storeAttachments(Request $request, TicketMessage $message): void
    {
        if (! $request->hasFile('attachments')) {
            return;
        }

        foreach ($request->file('attachments') as $file) {
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('ticket-attachments', $filename, 'public');

            \App\Models\TicketAttachment::create([
                'ticket_message_id' => $message->id,
                'filename' => $filename,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'path' => $path,
            ]);
        }
    }

    protected function broadcastMessage(SupportTicket $ticket, TicketMessage $message): void
    {
        try {
            TicketMessageSent::dispatch($ticket, $message);
            $this->broadcastConversation($ticket);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    protected function broadcastConversation(SupportTicket $ticket): void
    {
        try {
            TicketConversationUpdated::dispatch(
                $ticket,
                unreadForCustomer: $ticket->unreadSentByAdminsCount(),
                unreadForAdmin: $ticket->unreadSentByCustomersCount(),
            );
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
