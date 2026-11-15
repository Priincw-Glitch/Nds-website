<?php

namespace App\Http\Controllers\Api\Customer;

use App\Events\TicketConversationUpdated;
use App\Events\TicketMessageSent;
use App\Events\TicketMessagesDelivered;
use App\Events\TicketMessagesRead;
use App\Http\Controllers\Controller;
use App\Http\Resources\SupportTicketResource;
use App\Http\Resources\TicketMessageResource;
use App\Models\ActivityLog;
use App\Models\CustomerService;
use App\Models\SupportTicket;
use App\Models\TicketAttachment;
use App\Models\TicketMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Konsultasi pelanggan via API mobile: sistem support ticket yang sama
 * dengan portal pelanggan web. Semua query dibatasi user_id pemilik;
 * percakapan berlanjut di tiket terbuka yang sama, tiket baru hanya
 * dibuat bila belum ada percakapan berjalan.
 */
class ConsultationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = SupportTicket::where('user_id', $user->id)
            ->with(['customerService.service', 'latestMessage.user', 'assignedTo']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $query->where(function ($builder) use ($q) {
                $builder->where('ticket_number', 'like', "%{$q}%")
                    ->orWhere('title', 'like', "%{$q}%");
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

    public function show(Request $request, SupportTicket $ticket): JsonResponse
    {
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        // Pesan admin menjadi terbaca saat percakapan dibuka pelanggan.
        $this->markConversationRead($ticket, $request->user()->id);

        $messages = TicketMessage::where('ticket_id', $ticket->id)
            ->with(['user', 'attachments'])
            ->where('is_internal', false)
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->reverse()
            ->values();

        return response()->json([
            'data' => new SupportTicketResource($ticket->load(['customerService.service', 'assignedTo'])),
            'messages' => TicketMessageResource::collection($messages),
        ]);
    }

    /**
     * Kirim pesan konsultasi. Tiket baru dibuat bila belum ada percakapan
     * yang berjalan; selain itu pesan masuk ke percakapan terbuka terakhir.
     * Transaksi + lockForUpdate mencegah dua request bersamaan membuat
     * dua percakapan — sama dengan alur web.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'customer_service_id' => 'nullable|exists:customer_services,id',
            'title' => 'nullable|string|max:255',
            'category' => 'required|in:general_inquiry,technical_support,service_disruption,change_request,maintenance_request,billing_admin,other',
            'message' => 'required|string|max:5000',
            'attachments.*' => 'nullable|file|mimes:jpeg,png,jpg,pdf,doc,docx|max:5120',
            'client_key' => 'nullable|string|max:64',
        ]);

        $user = $request->user();

        if ($request->customer_service_id) {
            $customerService = CustomerService::find($request->customer_service_id);
            if (! $customerService || $customerService->user_id !== $user->id) {
                return response()->json(['message' => 'Akses ditolak.'], 403);
            }
        }

        // Retry/klik ganda dengan client_key yang sama dianggap sudah terkirim.
        if ($request->filled('client_key')) {
            $duplicate = TicketMessage::where('client_key', $request->client_key)->first();
            if ($duplicate) {
                $ticket = SupportTicket::where('id', $duplicate->ticket_id)
                    ->where('user_id', $user->id)->first();

                return response()->json([
                    'message' => 'Pesan Anda sudah terkirim sebelumnya.',
                    'data' => $ticket ? new SupportTicketResource($ticket) : null,
                    'duplicate' => true,
                ]);
            }
        }

        DB::beginTransaction();

        try {
            $ticket = SupportTicket::where('user_id', $user->id)
                ->whereNotIn('status', ['resolved', 'closed'])
                ->orderByDesc('last_message_at')
                ->orderByDesc('created_at')
                ->lockForUpdate()
                ->first();

            $isNew = false;
            if (! $ticket) {
                $ticket = SupportTicket::create([
                    'user_id' => $user->id,
                    'customer_service_id' => $request->customer_service_id,
                    'title' => $request->filled('title')
                        ? $request->title
                        : \Illuminate\Support\Str::limit(trim($request->message), 80, ''),
                    'category' => $request->category,
                    'status' => 'open',
                    'priority' => 'medium',
                ]);
                $isNew = true;
            }

            $message = TicketMessage::create([
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'message' => trim($request->message),
                'client_key' => $request->client_key,
            ]);

            $this->storeAttachments($request, $message);

            $ticket->update(['last_message_at' => now()]);

            ActivityLog::log(
                $isNew ? 'ticket_created' : 'ticket_message',
                ($isNew ? 'Created ticket via mobile: ' : 'Message in ticket via mobile: ') . $ticket->ticket_number,
                $ticket
            );

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Terjadi kesalahan saat mengirim pesan.'], 500);
        }

        $this->broadcastMessage($ticket->fresh(), $message);

        return response()->json([
            'message' => $isNew ? 'Permintaan konsultasi berhasil dikirim.' : 'Pesan berhasil dikirim.',
            'data' => new SupportTicketResource($ticket->fresh()->load(['customerService.service', 'assignedTo'])),
            'is_new' => $isNew,
        ], 201);
    }

    /**
     * Balasan pelanggan pada konsultasi yang masih terbuka.
     */
    public function reply(Request $request, SupportTicket $ticket): JsonResponse
    {
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $request->validate([
            'message' => 'required|string|max:5000',
            'attachments.*' => 'nullable|file|mimes:jpeg,png,jpg,pdf,doc,docx|max:5120',
            'client_key' => 'nullable|string|max:64',
        ]);

        if ($request->filled('client_key')) {
            $duplicate = TicketMessage::where('client_key', $request->client_key)->first();
            if ($duplicate) {
                return response()->json([
                    'message' => 'Pesan Anda sudah terkirim sebelumnya.',
                    'data' => new TicketMessageResource($duplicate->load(['user', 'attachments'])),
                    'duplicate' => true,
                ]);
            }
        }

        DB::beginTransaction();

        try {
            $message = TicketMessage::create([
                'ticket_id' => $ticket->id,
                'user_id' => $request->user()->id,
                'message' => trim($request->message),
                'client_key' => $request->client_key,
            ]);

            $this->storeAttachments($request, $message);

            if ($ticket->status === 'waiting_customer') {
                $ticket->update(['status' => 'in_progress']);
            }

            $ticket->update(['last_message_at' => now()]);

            ActivityLog::log('ticket_reply', "Replied to ticket via mobile: {$ticket->ticket_number}", $ticket);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Terjadi kesalahan saat mengirim balasan.'], 500);
        }

        $this->broadcastMessage($ticket->fresh(), $message);

        return response()->json([
            'message' => 'Balasan berhasil dikirim.',
            'data' => new TicketMessageResource($message->load(['user', 'attachments'])),
        ], 201);
    }

    /**
     * Riwayat pesan lebih lama (lazy loading): 30 pesan sebelum `before_id`.
     */
    public function messages(Request $request, SupportTicket $ticket): JsonResponse
    {
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $beforeId = (int) $request->query('before_id', 0);

        $query = TicketMessage::where('ticket_id', $ticket->id)
            ->with(['user', 'attachments'])
            ->where('is_internal', false)
            ->orderByDesc('id')
            ->limit(30);

        if ($beforeId > 0) {
            $query->where('id', '<', $beforeId);
        }

        $base = TicketMessage::where('ticket_id', $ticket->id)->where('is_internal', false);

        return response()->json([
            'messages' => TicketMessageResource::collection($query->get()->reverse()->values()),
            'has_more' => $beforeId > 0
                ? (clone $base)->where('id', '<', $beforeId)->count() > 30
                : $base->count() > 30,
        ]);
    }

    /**
     * Tutup konsultasi dari sisi pelanggan.
     */
    public function close(Request $request, SupportTicket $ticket): JsonResponse
    {
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $ticket->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        ActivityLog::log('ticket_closed', "Closed ticket via mobile: {$ticket->ticket_number}", $ticket);

        $this->broadcastConversation($ticket->fresh());

        return response()->json([
            'message' => 'Konsultasi berhasil ditutup.',
            'data' => new SupportTicketResource($ticket->fresh()),
        ]);
    }

    /**
     * Layanan aktif milik pelanggan untuk pilihan pada form konsultasi.
     */
    public function myServices(Request $request): JsonResponse
    {
        $services = CustomerService::where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->orderBy('service_name')
            ->get(['id', 'service_name', 'package_type']);

        return response()->json(['data' => $services]);
    }

    /**
     * Jumlah pesan admin yang belum dibaca pelanggan (badge konsultasi).
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = TicketMessage::where('is_read', false)
            ->where('is_internal', false)
            ->whereHas('ticket', fn ($q) => $q->where('user_id', $request->user()->id))
            ->whereHas('user', fn ($q) => $q->where('role', 'admin'))
            ->count();

        return response()->json(['count' => $count]);
    }

    protected function markConversationRead(SupportTicket $ticket, int $userId): void
    {
        $unread = TicketMessage::where('ticket_id', $ticket->id)
            ->where('user_id', '!=', $userId)
            ->where('is_read', false)
            ->count();

        if ($unread === 0) {
            return;
        }

        TicketMessage::where('ticket_id', $ticket->id)
            ->where('user_id', '!=', $userId)
            ->update(['is_read' => true, 'read_at' => now(), 'delivered_at' => now()]);

        TicketMessagesRead::dispatch($ticket, $userId, 'customer');
    }

    protected function storeAttachments(Request $request, TicketMessage $message): void
    {
        if (! $request->hasFile('attachments')) {
            return;
        }

        foreach ($request->file('attachments') as $file) {
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('ticket-attachments', $filename, 'public');

            TicketAttachment::create([
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
