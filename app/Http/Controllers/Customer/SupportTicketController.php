<?php

namespace App\Http\Controllers\Customer;

use App\Events\TicketConversationUpdated;
use App\Events\TicketMessageSent;
use App\Events\TicketMessagesDelivered;
use App\Events\TicketMessagesRead;
use App\Events\TicketTyping;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\CustomerService;
use App\Models\SupportTicket;
use App\Models\TicketAttachment;
use App\Models\TicketMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SupportTicketController extends Controller
{
    /**
     * Halaman chat Support pelanggan: daftar percakapan miliknya plus
     * percakapan terpilih (query `?ticket=`, atau percakapan aktif terbaru).
     * Pesan dimuat + dibaca di titik yang sama sehingga status baca
     * ter-update sekali di satu tempat.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = SupportTicket::where('user_id', $user->id)
            ->with(['customerService.service', 'latestMessage', 'assignedTo']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', '%' . $search . '%')
                  ->orWhere('title', 'like', '%' . $search . '%');
            });
        }

        // Daftar terurut aktivitas pesan terakhir, seperti daftar chat.
        $tickets = $query
            ->orderByDesc('last_message_at')
            ->orderByDesc('created_at')
            ->paginate(15);

        $selected = null;
        if ($request->filled('ticket')) {
            $selected = SupportTicket::where('user_id', $user->id)
                ->where('id', (int) $request->query('ticket'))
                ->first();
        } elseif (! $request->filled('new')) {
            // Percakapan aktif terbaru terbuka otomatis agar chat langsung siap;
            // `?new=1` memaksa tampilan memulai percakapan baru.
            $selected = SupportTicket::where('user_id', $user->id)
                ->whereNotIn('status', ['resolved', 'closed'])
                ->orderByDesc('last_message_at')
                ->orderByDesc('created_at')
                ->first();
        }

        if ($selected) {
            // Riwayat awal: 50 pesan terbaru (asc); pesan lebih lama dimuat
            // lewat endpoint `support.thread` saat dibutuhkan.
            $this->markConversationRead($selected, $user->id);

            // Relasi disetel SETELAH penandaan baca (tanpa refresh()) agar
            // user & attachments selalu termuat pada setiap pesan.
            $selected->setRelation(
                'messages',
                TicketMessage::where('ticket_id', $selected->id)
                    ->with(['user', 'attachments'])
                    ->where('is_internal', false)
                    ->orderByDesc('id')
                    ->limit(50)
                    ->get()
                    ->reverse()
                    ->values()
            );
        }

        return Inertia::render('Customer/Support/Index', [
            'tickets' => $tickets,
            'selected' => $selected,
            'unreadCounts' => $tickets->getCollection()->mapWithKeys(
                fn ($t) => [$t->id => $t->unreadSentByAdminsCount()]
            )->all(),
            'filters' => $request->only(['status', 'search', 'ticket', 'new']),
            'services' => CustomerService::where('user_id', $user->id)
                ->where('status', 'active')
                ->orderBy('service_name')
                ->get(['id', 'service_name', 'package_type'])
                ->toArray(),
        ]);
    }

    /**
     * Menyimpan pesan pelanggan ke percakapan aktif yang sudah ada —
     * tiket baru hanya dibuat bila belum ada percakapan yang berjalan
     * atau percakapan terakhir sudah selesai. Transaksi + lockForUpdate
     * mencegah dua request bersamaan membuat dua percakapan.
     */
    public function store(Request $request)
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
                abort(403, 'Unauthorized access.');
            }
        }

        // Retry/klik ganda dengan client_key yang sama dianggap sudah terkirim.
        if ($request->filled('client_key')) {
            $duplicate = TicketMessage::where('client_key', $request->client_key)->first();
            if ($duplicate) {
                return redirect()->route('customer.support.index', ['ticket' => $duplicate->ticket_id])
                    ->with('success', 'Pesan Anda sudah terkirim sebelumnya.');
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
                ($isNew ? 'Created ticket: ' : 'Message in ticket: ') . $ticket->ticket_number,
                $ticket
            );

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Terjadi kesalahan saat mengirim pesan.');
        }

        $this->broadcastMessage($ticket->fresh(), $message);

        return redirect()->route('customer.support.index', ['ticket' => $ticket->id])
            ->with('success', $isNew ? 'Percakapan baru berhasil dibuat.' : 'Pesan berhasil dikirim.');
    }

    /**
     * Riwayat pesan lebih lama (lazy loading): 30 pesan sebelum `before_id`.
     */
    public function messages(Request $request, SupportTicket $ticket)
    {
        if ($ticket->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized access.');
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

        return response()->json([
            'messages' => $query->get()->reverse()->values(),
            'has_more' => $beforeId > 0
                ? TicketMessage::where('ticket_id', $ticket->id)->where('is_internal', false)->where('id', '<', $beforeId)->count() > 30
                : TicketMessage::where('ticket_id', $ticket->id)->where('is_internal', false)->count() > 30,
        ]);
    }

    /**
     * Klien pelanggan mengonfirmasi pesan admin sudah diterima perangkatnya
     * (Delivered). Endpoint ringan, dipanggil dari listener realtime.
     */
    public function markDelivered(Request $request, SupportTicket $ticket)
    {
        if ($ticket->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized access.');
        }

        $ids = TicketMessage::where('ticket_id', $ticket->id)
            ->where('user_id', '!=', $request->user()->id)
            ->where('is_internal', false)
            ->whereNull('delivered_at')
            ->pluck('id');

        if ($ids->isNotEmpty()) {
            TicketMessage::whereIn('id', $ids)->update(['delivered_at' => now()]);
            TicketMessagesDelivered::dispatch($ticket, $ids->all(), $request->user()->id);
        }

        return response()->noContent();
    }

    /**
     * Percakapan Support adalah satu halaman chat; tiket terpilih lewat
     * query `?ticket=`; tidak ada UI chat duplikat.
     */
    public function show(Request $request, SupportTicket $ticket)
    {
        if ($ticket->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized access.');
        }

        return redirect()->route('customer.support.index', ['ticket' => $ticket->id]);
    }

    /**
     * Marker menandai percakapan terpilih pada halaman chat (read receipt):
     * pesan admin menjadi is_read + read_at, lalu pengirim diberi tahu
     * secara realtime.
     */
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

    /**
     * Jumlah pesan admin yang belum dibaca pelanggan (badge Chat Support).
     */
    public function unreadCount(Request $request)
    {
        $user = $request->user();

        $count = TicketMessage::where('is_read', false)
            ->where('is_internal', false)
            ->whereHas('ticket', fn ($q) => $q->where('user_id', $user->id))
            ->whereHas('user', fn ($q) => $q->where('role', 'admin'))
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Sinyal "sedang mengetik" customer dikirim ke admin melalui Reverb.
     */
    public function typing(Request $request, SupportTicket $ticket)
    {
        if ($ticket->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized access.');
        }

        TicketTyping::dispatch($ticket, $request->user()->id, 'customer');

        return response()->noContent();
    }

    /**
     * Balasan pelanggan pada percakapan yang terbuka.
     */
    public function reply(Request $request, SupportTicket $ticket)
    {
        if ($ticket->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized access.');
        }

        $request->validate([
            'message' => 'required|string|max:5000',
            'attachments.*' => 'nullable|file|mimes:jpeg,png,jpg,pdf,doc,docx|max:5120',
            'client_key' => 'nullable|string|max:64',
        ]);

        if ($request->filled('client_key')) {
            $duplicate = TicketMessage::where('client_key', $request->client_key)->first();
            if ($duplicate) {
                return back()->with('success', 'Pesan Anda sudah terkirim sebelumnya.');
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

            ActivityLog::log('ticket_reply', "Replied to ticket: {$ticket->ticket_number}", $ticket);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Terjadi kesalahan saat mengirim balasan.');
        }

        $this->broadcastMessage($ticket->fresh(), $message);

        return back()->with('success', 'Balasan berhasil dikirim.');
    }

    /**
     * Tutup percakapan dari sisi pelanggan; perubahan status disiarkan agar
     * daftar percakapan admin ikut termutakhirkan.
     */
    public function close(Request $request, SupportTicket $ticket)
    {
        if ($ticket->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized access.');
        }

        $ticket->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        ActivityLog::log('ticket_closed', "Closed ticket: {$ticket->ticket_number}", $ticket);

        $fresh = $ticket->fresh();
        $this->broadcastConversation($fresh);

        return back()->with('success', 'Tiket berhasil ditutup.');
    }

    /**
     * Lampiran pesan: satu tempat untuk store dan reply.
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

    /**
     * Broadcast pesan baru ke channel tiket + ringkasan percakapan kedua
     * sisi. Dipanggil SETELAH commit sehingga penerima hanya menerima data
     * yang benar-benar tersimpan (Sent). Gagal broadcast tidak menggagalkan
     * pesan yang sudah tersimpan.
     */
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
