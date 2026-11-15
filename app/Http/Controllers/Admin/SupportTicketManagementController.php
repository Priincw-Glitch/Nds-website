<?php

namespace App\Http\Controllers\Admin;

use App\Events\TicketConversationUpdated;
use App\Events\TicketMessageSent;
use App\Events\TicketMessagesDelivered;
use App\Events\TicketMessagesRead;
use App\Events\TicketTyping;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\SupportTicket;
use App\Models\TicketAttachment;
use App\Models\TicketMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SupportTicketManagementController extends Controller
{
    /**
     * Dashboard percakapan pelanggan (halaman Pesan Masuk): daftar
     * percakapan terurut aktivitas terbaru + percakapan terpilih via
     * query `?ticket=`. Membuka percakapan menandai pesan pelanggan
     * sebagai terbaca dan memberi tahu pengirimnya secara realtime.
     */
    public function index(Request $request)
    {
        $query = SupportTicket::with(['user', 'assignedTo', 'latestMessage']);

        // Filter: semua | unread | open | in_progress | resolved (Selesai
        // mencakup resolved + closed). Filter hanya menyaring tampilan,
        // tidak pernah mengubah status percakapan.
        $filter = $request->input('filter', 'all');
        if ($filter === 'unread') {
            $query->whereHas('messages', fn ($q) => $q
                ->where('is_read', false)
                ->whereHas('user', fn ($u) => $u->where('role', 'customer')));
        } elseif ($filter === 'resolved') {
            $query->whereIn('status', ['resolved', 'closed']);
        } elseif (in_array($filter, ['open', 'in_progress'])) {
            $query->where('status', $filter);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', '%' . $search . '%')
                  ->orWhere('title', 'like', '%' . $search . '%')
                  ->orWhereHas('user', fn ($u) => $u->where('name', 'like', '%' . $search . '%'))
                  ->orWhereHas('messages', fn ($m) => $m->where('message', 'like', '%' . $search . '%'));
            });
        }

        $tickets = $query
            ->orderByDesc('last_message_at')
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $unreadCounts = $tickets->getCollection()->mapWithKeys(
            fn ($t) => [$t->id => $t->unreadSentByCustomersCount()]
        )->all();

        $selected = null;
        if ($request->filled('ticket')) {
            $selected = SupportTicket::with(['user.customerProfile', 'customerService.service', 'assignedTo'])
                ->find((int) $request->query('ticket'));
        }

        if ($selected) {
            // Riwayat awal: 50 pesan terbaru; lebih lama via `admin.messages.thread`.
            $unreadCount = TicketMessage::where('ticket_id', $selected->id)
                ->where('user_id', '!=', $request->user()->id)
                ->where('is_read', false)
                ->count();

            if ($unreadCount > 0) {
                TicketMessage::where('ticket_id', $selected->id)
                    ->where('user_id', '!=', $request->user()->id)
                    ->update(['is_read' => true, 'read_at' => now(), 'delivered_at' => now()]);

                TicketMessagesRead::dispatch($selected, $request->user()->id, 'admin');
            }

            // Relasi disetel SETELAH penandaan baca (tanpa refresh()) agar
            // user & attachments selalu termuat pada setiap pesan.
            $selected->setRelation(
                'messages',
                TicketMessage::where('ticket_id', $selected->id)
                    ->with(['user', 'attachments'])
                    ->orderByDesc('id')
                    ->limit(50)
                    ->get()
                    ->reverse()
                    ->values()
            );
        }

        $admins = User::where('role', 'admin')->orderBy('name')->get();

        return Inertia::render('Admin/Messages/Index', [
            'tickets' => $tickets,
            'selected' => $selected,
            'admins' => $admins,
            'unreadCounts' => $unreadCounts,
            'filters' => $request->only(['filter', 'search', 'assigned_to', 'ticket']),
        ]);
    }

    /**
     * Percakapan lama diarahkan ke dashboard Pesan Masuk agar bookmark
     * tetap membuka percakapan yang sama.
     */
    public function show(Request $request, SupportTicket $ticket)
    {
        return redirect()->route('admin.messages.index', ['ticket' => $ticket->id]);
    }

    /**
     * Riwayat pesan lebih lama (lazy loading): 30 pesan sebelum `before_id`.
     */
    public function messages(Request $request, SupportTicket $ticket)
    {
        $beforeId = (int) $request->query('before_id', 0);

        $query = TicketMessage::where('ticket_id', $ticket->id)
            ->with(['user', 'attachments'])
            ->orderByDesc('id')
            ->limit(30);

        if ($beforeId > 0) {
            $query->where('id', '<', $beforeId);
        }

        return response()->json([
            'messages' => $query->get()->reverse()->values(),
        ]);
    }

    /**
     * Klien admin mengonfirmasi pesan pelanggan sudah sampai (Delivered).
     */
    public function markDelivered(Request $request, SupportTicket $ticket)
    {
        $ids = TicketMessage::where('ticket_id', $ticket->id)
            ->where('user_id', '!=', $request->user()->id)
            ->whereNull('delivered_at')
            ->pluck('id');

        if ($ids->isNotEmpty()) {
            TicketMessage::whereIn('id', $ids)->update(['delivered_at' => now()]);
            TicketMessagesDelivered::dispatch($ticket, $ids->all(), $request->user()->id);
        }

        return response()->noContent();
    }

    /**
     * Sinyal "sedang mengetik" dipantau pelanggan via Reverb (channel private).
     */
    public function typing(Request $request, SupportTicket $ticket)
    {
        TicketTyping::dispatch($ticket, $request->user()->id, 'admin');

        return response()->noContent();
    }

    /**
     * Balasan admin. Tersimpan dalam transaksi bersama pembaruan
     * percakapan; broadcast dikirim setelah commit.
     */
    public function reply(Request $request, SupportTicket $ticket)
    {
        $request->validate([
            'message' => 'required|string|max:5000',
            'is_internal' => 'boolean',
            'attachments.*' => 'nullable|file|mimes:jpeg,png,jpg,pdf,doc,docx|max:5120',
            'client_key' => 'nullable|string|max:64',
        ]);

        if ($request->filled('client_key')) {
            $duplicate = TicketMessage::where('client_key', $request->client_key)->first();
            if ($duplicate) {
                return back()->with('success', 'Balasan sudah terkirim sebelumnya.');
            }
        }

        DB::beginTransaction();

        try {
            $message = TicketMessage::create([
                'ticket_id' => $ticket->id,
                'user_id' => $request->user()->id,
                'message' => trim($request->message),
                'is_internal' => $request->boolean('is_internal'),
                'client_key' => $request->client_key,
            ]);

            $this->storeAttachments($request, $message);

            $ticket->update(['last_message_at' => now()]);

            ActivityLog::log('ticket_reply', "Admin replied to ticket: {$ticket->ticket_number}", $ticket);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Terjadi kesalahan saat mengirim balasan.');
        }

        try {
            if (! $request->boolean('is_internal')) {
                Notification::create([
                    'user_id' => $ticket->user_id,
                    'type' => 'ticket_reply',
                    'title' => 'Balasan Baru pada Tiket',
                    'message' => "Ada balasan baru dari admin untuk tiket #{$ticket->ticket_number}.",
                    'data' => ['ticket_id' => $ticket->id],
                ]);
            }

            TicketMessageSent::dispatch($ticket->fresh(), $message);
            $fresh = $ticket->fresh();
            TicketConversationUpdated::dispatch(
                $fresh,
                unreadForCustomer: $fresh->unreadSentByAdminsCount(),
                unreadForAdmin: $fresh->unreadSentByCustomersCount(),
            );
        } catch (\Throwable $e) {
            report($e);
        }

        return back()->with('success', 'Balasan berhasil dikirim.');
    }

    /**
     * Ubah status percakapan; perubahan disiarkan ke kedua sisi.
     */
    public function updateStatus(Request $request, SupportTicket $ticket)
    {
        $request->validate([
            'status' => 'required|in:open,in_progress,waiting_customer,resolved,closed',
        ]);

        $oldStatus = $ticket->status;

        $updateData = ['status' => $request->status];

        if ($request->status === 'resolved') {
            $updateData['resolved_at'] = now();
        }

        if ($request->status === 'closed') {
            $updateData['closed_at'] = now();
        }

        $ticket->update($updateData);

        Notification::create([
            'user_id' => $ticket->user_id,
            'type' => 'ticket_status_changed',
            'title' => 'Status Tiket Berubah',
            'message' => "Status tiket #{$ticket->ticket_number} telah diubah menjadi {$ticket->status_label}.",
            'data' => json_encode([
                'ticket_id' => $ticket->id,
                'old_status' => $oldStatus,
                'new_status' => $request->status,
            ]),
        ]);

        ActivityLog::log('ticket_status_changed', "Admin changed ticket status: {$ticket->ticket_number} to {$request->status}", $ticket);

        $fresh = $ticket->fresh();
        $this->broadcastConversation($fresh);

        return back()->with('success', 'Status percakapan berhasil diperbarui.');
    }

    /**
     * Ubah prioritas percakapan.
     */
    public function updatePriority(Request $request, SupportTicket $ticket)
    {
        $request->validate([
            'priority' => 'required|in:low,medium,high,urgent',
        ]);

        $ticket->update(['priority' => $request->priority]);

        ActivityLog::log('ticket_priority_changed', "Admin changed ticket priority: {$ticket->ticket_number}", $ticket);

        $fresh = $ticket->fresh();
        $this->broadcastConversation($fresh);

        return back()->with('success', 'Prioritas berhasil diperbarui.');
    }

    /**
     * Tugaskan / ambil alih percakapan ke admin tertentu; pelanggan melihat
     * petugas penanggung jawab baru secara realtime lewat siaran percakapan.
     */
    public function assign(Request $request, SupportTicket $ticket)
    {
        $request->validate([
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $ticket->update(['assigned_to' => $request->assigned_to]);

        if ($ticket->status === 'open' && $request->assigned_to) {
            $ticket->update(['status' => 'in_progress']);
        }

        if ($request->assigned_to) {
            $assignedUser = User::find($request->assigned_to);
            ActivityLog::log('ticket_assigned', "Admin assigned ticket {$ticket->ticket_number} to {$assignedUser->name}", $ticket);
        } else {
            ActivityLog::log('ticket_unassigned', "Admin unassigned ticket {$ticket->ticket_number}", $ticket);
        }

        $fresh = $ticket->fresh();
        $this->broadcastConversation($fresh);

        return back()->with('success', 'Penugasan percakapan diperbarui.');
    }

    /**
     * Statistik percakapan (JSON, dipakai dashboard).
     */
    public function statistics()
    {
        $stats = [
            'total' => SupportTicket::count(),
            'open' => SupportTicket::where('status', 'open')->count(),
            'in_progress' => SupportTicket::where('status', 'in_progress')->count(),
            'waiting_customer' => SupportTicket::where('status', 'waiting_customer')->count(),
            'resolved' => SupportTicket::where('status', 'resolved')->count(),
            'closed' => SupportTicket::where('status', 'closed')->count(),
            'by_category' => SupportTicket::select('category', DB::raw('count(*) as count'))
                ->groupBy('category')
                ->get(),
            'by_priority' => SupportTicket::select('priority', DB::raw('count(*) as count'))
                ->groupBy('priority')
                ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Lampiran pesan balasan.
     */
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
