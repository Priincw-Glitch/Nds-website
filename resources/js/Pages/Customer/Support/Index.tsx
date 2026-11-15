import { Head, router, useForm, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, ShieldCheck } from 'lucide-react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import SupportChat from '@/Components/support/SupportChat';
import { ConversationList } from '@/Components/support/ConversationList';
import type { ChatMessage, ConversationSummary } from '@/Components/support/types';
import { useTicketRealtime, useTicketPresence } from '@/Components/support/useTicketRealtime';
import { SupportComposer, type ComposerService } from '@/Components/customer/SupportComposer';

interface TicketRow {
    id: number;
    ticket_number: string;
    title: string;
    status_label: string;
    status_color: string;
    created_at: string;
    customer_service?: { id: number; service_name: string } | null;
    latest_message?: { message: string; created_at: string; user?: { role: string } | null } | null;
}

interface SelectedTicket {
    id: number;
    ticket_number: string;
    title: string;
    category_label: string;
    status: string;
    status_label: string;
    status_color: string;
    created_at: string;
    assignedTo?: { id: number; name: string } | null;
    customer_service?: { id: number; service_name: string; package_type: string | null } | null;
    messages: ChatMessage[];
}

interface Props {
    tickets: {
        data: TicketRow[];
        links: unknown[];
        current_page: number;
        last_page: number;
    };
    selected: SelectedTicket | null;
    unreadCounts: Record<number, number>;
    services?: ComposerService[];
    filters: { status?: string; search?: string; ticket?: string; new?: string };
}

const statusBadge: Record<string, string> = {
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    danger: 'badge badge-danger',
    info: 'badge badge-secondary',
    secondary: 'badge badge-neutral',
};

/** Pengenal unik pesan untuk pengaman duplikat di backend; crypto.randomUUID
    tidak tersedia di semua konteks HTTP lokal, jadi pakai kombinasi sederhana. */
const makeClientKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export default function SupportIndex({ tickets, selected, unreadCounts, services, filters }: Props) {
    // usePage (React 19 `use(Context)`) hanya boleh dipanggil saat render;
    // memanggilnya di dalam useEffect memicu React error #308.
    const { auth } = usePage().props as unknown as { auth?: { user?: { id?: number } } };
    const userId = auth?.user?.id;

    // Pencarian daftar bersifat klien (halaman dimuat), filter status
    // server-side seperti halaman sebelumnya.
    const [listSearch, setListSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');

    // Realtime percakapan terpilih; tanpa percakapan (tampilan memulai baru)
    // hook tetap dipanggil tanpa syarat dan melompati langganan sendiri.
    const { messages, opponentTyping, sendTypingSignal, prependMessages } = useTicketRealtime({
        ticketId: selected?.id ?? 0,
        myRole: 'customer',
        initialMessages: selected?.messages ?? [],
        onReconnect: () => router.reload({ only: ['selected', 'tickets', 'unreadCounts'] }),
    });
    const { opponentOnline } = useTicketPresence(selected?.id ?? 0, 'customer');

    const [hasOlder, setHasOlder] = useState((selected?.messages?.length ?? 0) >= 50);
    const [loadingOlder, setLoadingOlder] = useState(false);

    // Daftar percakapan segera tampil balasan baru: channel private milik
    // user ini memancarkan ringkasan percakapan dari Reverb.
    useEffect(() => {
        const echoInstance = window.Echo;
        if (!echoInstance || !userId) return;
        const channel = echoInstance.private(`App.Models.User.${userId}`);
        channel.listen('.TicketConversationUpdated', () => {
            router.reload({ only: ['tickets', 'unreadCounts', 'selected'] });
        });
        return () => {
            echoInstance.leave(`App.Models.User.${userId}`);
        };
    }, [userId]);

    const loadOlder = () => {
        if (!selected || loadingOlder || messages.length === 0) return;
        setLoadingOlder(true);
        const beforeId = messages[0]?.id ?? 0;
        fetch(route('customer.support.thread', { ticket: selected.id, before_id: beforeId }), {
            headers: { Accept: 'application/json' },
        })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error('gagal memuat'))))
            .then((data: { messages: ChatMessage[]; has_more?: boolean }) => {
                prependMessages(data.messages ?? []);
                setHasOlder(Boolean(data.has_more));
            })
            .catch(() => {
                // Biarkan tombol tetap; pengguna bisa mencoba lagi.
            })
            .finally(() => setLoadingOlder(false));
    };

    // Balasan memakai endpoint customer.support.reply yang sudah ada:
    // lampiran multipart + validasi tetap di backend. client_key dipertahankan
    // pada retry agar kirim ulang tidak tercatat sebagai pesan baru.
    const replyForm = useForm({ message: '', attachments: [] as File[], client_key: '' });
    const [lastPayload, setLastPayload] = useState<{ message: string; attachments: File[]; clientKey: string } | null>(null);

    const submitReply = (payload: { message: string; attachments: File[] }, existingKey?: string) => {
        if (!selected) return;
        const clientKey = existingKey ?? makeClientKey();
        setLastPayload({ message: payload.message, attachments: payload.attachments, clientKey });
        replyForm.transform(() => ({
            message: payload.message,
            attachments: payload.attachments,
            client_key: clientKey,
        }));
        replyForm.post(route('customer.support.reply', selected.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setLastPayload(null);
                replyForm.setData('attachments', []);
            },
        });
    };

    const retryLast = () => {
        if (!lastPayload) return;
        submitReply(
            { message: lastPayload.message, attachments: lastPayload.attachments },
            lastPayload.clientKey,
        );
    };

    const closeTicket = () => {
        if (!selected) return;
        router.patch(route('customer.support.close', selected.id), {}, { preserveScroll: true });
    };

    const startNew = () => {
        router.get(route('customer.support.index', { new: 1 }));
    };

    const conversations: ConversationSummary[] = tickets.data.map((t) => ({
        id: t.id,
        ticket_number: t.ticket_number,
        title: t.title,
        status_label: t.status_label,
        status_color: t.status_color,
        last_message_preview: t.latest_message?.message ?? null,
        last_message_at: t.latest_message?.created_at ?? null,
        last_actor_role: t.latest_message?.user?.role ?? null,
        unread_count: unreadCounts[t.id] ?? 0,
        href: route('customer.support.index', { ticket: t.id }),
    }));

    const activeHref = selected ? route('customer.support.index', { ticket: selected.id }) : undefined;
    const closed = selected ? selected.status === 'closed' || selected.status === 'resolved' : false;
    const showStartView = !selected;

    // Nama petugas: penanggung jawab percakapan, atau admin terakhir yang
    // membalas, atau label generik saat belum ada balasan.
    const adminMessage = [...messages].reverse().find((m) => m.user?.role === 'admin');
    const opponentName = selected?.assignedTo?.name ?? adminMessage?.user?.name ?? 'Tim NDS';

    return (
        <CustomerLayout title="Support Chat">
            <Head title="Support Chat | NDS Customer Portal" />

            <div className="grid h-[38rem] max-h-[calc(100dvh-9rem)] gap-4 lg:grid-cols-[22rem_1fr]">
                {/* Panel daftar percakapan; di mobile digantikan ruang chat saat
                    percakapan terbuka, kembali lewat tombol di header chat. */}
                <div className={`${selected ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col gap-3`}>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter status">
                        {[
                            { value: '', label: 'Semua' },
                            { value: 'open', label: 'Terbuka' },
                            { value: 'in_progress', label: 'Dalam Proses' },
                            { value: 'waiting_customer', label: 'Menunggu Anda' },
                            { value: 'resolved', label: 'Selesai' },
                            { value: 'closed', label: 'Ditutup' },
                        ].map((f) => (
                            <button
                                key={f.label}
                                type="button"
                                onClick={() => {
                                    setStatusFilter(f.value);
                                    router.get(
                                        route('customer.support.index', { status: f.value || undefined }),
                                        {},
                                        { preserveState: true },
                                    );
                                }}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                    statusFilter === f.value
                                        ? 'bg-navy text-white'
                                        : 'border border-border-soft bg-white text-navy hover:bg-navy/5'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <ConversationList
                        conversations={conversations}
                        activeHref={activeHref}
                        searchValue={listSearch}
                        onSearch={setListSearch}
                        emptyText="Belum ada percakapan. Mulai dari panel kanan."
                    />

                    {tickets.last_page > 1 && (
                        <nav className="flex flex-wrap items-center gap-1.5" aria-label="Halaman daftar percakapan">
                            <span className="mr-1 text-[11px] text-body-text">
                                {tickets.current_page}/{tickets.last_page}
                            </span>
                            {(tickets.links as Array<{ url: string | null; label: string; active: boolean }>)
                                .filter((l) => l.url)
                                .map((l, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => window.location.assign(l.url as string)}
                                        className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                            l.active
                                                ? 'border-navy bg-navy text-white'
                                                : 'border-border-soft bg-white text-navy hover:bg-navy/5'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: l.label }}
                                    />
                                ))}
                        </nav>
                    )}

                    <button
                        type="button"
                        onClick={startNew}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border-soft bg-white px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy/5"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Percakapan baru
                    </button>
                </div>

                {/* Ruang percakapan */}
                <div className={`${selected ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col`}>
                    {showStartView ? (
                        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border-soft bg-white shadow-subtle">
                            <header className="shrink-0 border-b border-border-soft px-5 py-4">
                                <h1 className="text-sm font-bold text-navy">Hubungi Tim NDS</h1>
                                <p className="mt-0.5 text-xs text-body-text">
                                    Satu percakapan berjalan sampai selesai; riwayatnya selalu tersedia di sini.
                                </p>
                            </header>
                            <div className="min-h-0 flex-1 overflow-y-auto p-5">
                                <SupportComposer services={services} collapsibleServices />
                                <p className="mt-4 flex items-center gap-1.5 text-[11px] text-body-text/70">
                                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />
                                    Percakapan hanya dapat dibaca Anda dan petugas NDS.
                                </p>
                            </div>
                        </section>
                    ) : (
                        <div className="flex min-h-0 flex-1 flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <button
                                    type="button"
                                    onClick={() => router.get(route('customer.support.index'))}
                                    className="inline-flex items-center gap-1 rounded-md border border-border-soft px-2 py-1 font-semibold text-navy hover:bg-navy/5 lg:hidden"
                                    aria-label="Kembali ke daftar percakapan"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Daftar
                                </button>
                                <span className="font-mono text-body-text/80">{selected!.ticket_number}</span>
                                <span className={statusBadge[selected!.status_color] || statusBadge.secondary}>
                                    {selected!.status_label}
                                </span>
                                {selected!.assignedTo && (
                                    <span className="text-body-text/70">Ditangani {selected!.assignedTo.name}</span>
                                )}
                                {!closed && (
                                    <button
                                        type="button"
                                        onClick={closeTicket}
                                        className="ml-auto rounded-md border border-border-soft px-2.5 py-1 text-[11px] font-semibold text-red-900 hover:bg-red-50"
                                    >
                                        Tutup percakapan
                                    </button>
                                )}
                                {closed && (
                                    <button
                                        type="button"
                                        onClick={startNew}
                                        className="ml-auto inline-flex items-center gap-1 rounded-md bg-navy px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-navy/90"
                                    >
                                        <Plus className="h-3 w-3" />
                                        Percakapan baru
                                    </button>
                                )}
                            </div>

                            <div className="min-h-0 flex-1">
                                <SupportChat
                                    messages={messages}
                                    myRole="customer"
                                    opponent={{ id: selected!.assignedTo?.id ?? adminMessage?.user?.id ?? 0, name: opponentName }}
                                    opponentOnline={opponentOnline}
                                    opponentTyping={opponentTyping}
                                    closed={closed}
                                    onSend={(p) => submitReply({ message: p.message, attachments: p.attachments })}
                                    onTyping={sendTypingSignal}
                                    sending={replyForm.processing}
                                    sendError={
                                        Object.keys(replyForm.errors).length > 0
                                            ? 'Pesan gagal terkirim. Periksa isi pesan lalu coba kirim ulang.'
                                            : null
                                    }
                                    onRetry={lastPayload ? retryLast : undefined}
                                    hasOlder={hasOlder}
                                    loadingOlder={loadingOlder}
                                    onLoadOlder={loadOlder}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </CustomerLayout>
    );
}
