import { Head, Link, router, useForm } from "@inertiajs/react";
import { route } from "ziggy-js";
import { useEffect, useState } from "react";
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    Eye,
    Filter,
    Inbox,
    MessageSquare,
    Phone,
    Search,
} from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";
import SupportChat from "@/Components/support/SupportChat";
import { ConversationList } from "@/Components/support/ConversationList";
import type { ChatMessage, ConversationSummary } from "@/Components/support/types";
import { useTicketRealtime, useTicketPresence } from "@/Components/support/useTicketRealtime";
import { Pagination } from "@/Components/admin/Pagination";
import { DeleteButton } from "@/Components/admin/DeleteButton";
import type { ContactMessageItem, Paginated } from "@/types";

/* ---------- Tipe ---------- */

interface TicketRow {
    id: number;
    ticket_number: string;
    title: string;
    status_label: string;
    status_color: string;
    priority_label: string;
    priority_color: string;
    created_at: string;
    user?: { id: number; name: string } | null;
    latest_message?: { message: string; created_at: string } | null;
}

interface SelectedTicket {
    id: number;
    ticket_number: string;
    title: string;
    category_label: string;
    status: string;
    status_label: string;
    status_color: string;
    priority: string;
    priority_label: string;
    priority_color: string;
    assigned_to: number | null;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        customer_profile?: { customer_code?: string | null; address: string | null; city: string | null; province: string | null } | null;
    } | null;
    customer_service?: { id: number; service_name: string; package_type: string | null } | null;
    assignedTo?: { id: number; name: string } | null;
    messages: ChatMessage[];
}

interface Props {
    // Mode percakapan (dashboard utama)
    tickets?: { data: TicketRow[]; current_page: number; last_page: number; links: unknown[] };
    selected?: SelectedTicket | null;
    admins?: Array<{ id: number; name: string }>;
    unreadCounts?: Record<number, number>;
    // Mode tab Formulir Kontak (inbox ContactMessage); `q`/`status` hanya
    // dipakai oleh tab inbox, sisa tombol filter dipakai kedua mode.
    messages?: Paginated<ContactMessageItem>;
    filters?: { filter?: string; search?: string; assigned_to?: string; ticket?: string; q?: string; status?: string };
}

const statusBadge: Record<string, string> = {
    success: "badge badge-success",
    warning: "badge badge-warning",
    danger: "badge badge-danger",
    info: "badge badge-secondary",
    secondary: "badge badge-neutral",
};

const makeClientKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const conversationFilters = [
    { value: "all", label: "Semua" },
    { value: "unread", label: "Belum Dibaca" },
    { value: "open", label: "Menunggu" },
    { value: "in_progress", label: "Sedang Ditangani" },
    { value: "resolved", label: "Selesai" },
];

/** Tab Pesan Masuk: Percakapan (utama) & Formulir Kontak (arsip). */
function MessageTabs({ active }: { active: "conversations" | "contacts" }) {
    const tab = (label: string, href: string, key: "conversations" | "contacts") => (
        <Link
            href={href}
            aria-current={active === key ? "page" : undefined}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                active === key ? "bg-navy text-white" : "text-body-text hover:bg-navy/5 hover:text-navy"
            }`}
        >
            {label}
        </Link>
    );
    return (
        <div className="mb-4 flex w-fit items-center gap-1 rounded-xl border border-border-soft bg-white p-1 shadow-subtle">
            {tab("Percakapan", route("admin.messages.index"), "conversations")}
            {tab("Formulir Kontak", route("admin.messages.contacts.index"), "contacts")}
        </div>
    );
}

/* ---------- Mode 1: dashboard percakapan pelanggan ---------- */

function ConversationsDashboard({
    tickets,
    selected,
    admins,
    unreadCounts,
    filters,
}: NonNullable<Props> & { filters: { filter?: string; search?: string; assigned_to?: string; ticket?: string } }) {
    const { messages, opponentTyping, sendTypingSignal, prependMessages } = useTicketRealtime({
        ticketId: selected?.id ?? 0,
        myRole: "admin",
        initialMessages: selected?.messages ?? [],
        onReconnect: () => router.reload({ only: ["tickets", "unreadCounts", "selected"] }),
    });
    const { opponentOnline } = useTicketPresence(selected?.id ?? 0, "admin");

    const [listSearch, setListSearch] = useState("");
    const [hasOlder, setHasOlder] = useState((selected?.messages?.length ?? 0) >= 50);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [showManage, setShowManage] = useState(false);

    // Daftar percakapan diperbarui realtime: badge, preview, dan status
    // disegarkan ketika channel admin.support memancarkan perubahan.
    useEffect(() => {
        const echoInstance = window.Echo;
        if (!echoInstance) return;
        echoInstance.private("admin.support").listen(".TicketConversationUpdated", () => {
            router.reload({ only: ["tickets", "unreadCounts", "selected"] });
        });
        return () => {
            echoInstance.leave("admin.support");
        };
    }, []);

    const loadOlder = () => {
        if (!selected || loadingOlder || messages.length === 0) return;
        setLoadingOlder(true);
        const beforeId = messages[0]?.id ?? 0;
        fetch(route("admin.messages.thread", { ticket: selected.id, before_id: beforeId }), {
            headers: { Accept: "application/json" },
        })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error("gagal memuat"))))
            .then((data: { messages: ChatMessage[] }) => {
                prependMessages(data.messages ?? []);
                setHasOlder((data.messages ?? []).length >= 30);
            })
            .catch(() => {})
            .finally(() => setLoadingOlder(false));
    };

    // Balasan tetap memakai endpoint reply; client_key dipertahankan pada
    // retry agar kirim ulang tidak tercatat sebagai pesan baru.
    const replyForm = useForm({ message: "", is_internal: false, attachments: [] as File[], client_key: "" });
    const [lastPayload, setLastPayload] = useState<{ message: string; is_internal: boolean; attachments: File[]; clientKey: string } | null>(null);

    const submitReply = (payload: { message: string; is_internal: boolean; attachments: File[] }, existingKey?: string) => {
        if (!selected) return;
        const clientKey = existingKey ?? makeClientKey();
        setLastPayload({ ...payload, clientKey });
        replyForm.transform(() => ({ ...payload, client_key: clientKey }));
        replyForm.post(route("admin.messages.reply", selected.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setLastPayload(null);
                replyForm.reset("is_internal");
                replyForm.setData("attachments", []);
            },
        });
    };

    const retryLast = () => {
        if (!lastPayload) return;
        submitReply(
            { message: lastPayload.message, is_internal: lastPayload.is_internal, attachments: lastPayload.attachments },
            lastPayload.clientKey,
        );
    };

    const statusForm = useForm({ status: selected?.status ?? "open" });
    const priorityForm = useForm({ priority: selected?.priority ?? "medium" });
    const assignForm = useForm({ assigned_to: selected?.assigned_to ? String(selected.assigned_to) : "" });

    const conversations: ConversationSummary[] = tickets!.data.map((t) => ({
        id: t.id,
        ticket_number: t.ticket_number,
        title: t.user?.name ?? t.title,
        status_label: t.status_label,
        status_color: t.status_color,
        last_message_preview: t.latest_message?.message ?? null,
        last_message_at: t.latest_message?.created_at ?? null,
        last_actor_role: null,
        unread_count: unreadCounts?.[t.id] ?? 0,
        href: route("admin.messages.index", { ticket: t.id }),
    }));

    const activeHref = selected ? route("admin.messages.index", { ticket: selected.id }) : undefined;
    const closed = selected ? selected.status === "closed" || selected.status === "resolved" : false;
    const currentFilter = filters.filter ?? "all";

    const setFilter = (value: string) => {
        router.get(
            route("admin.messages.index"),
            { filter: value === "all" ? undefined : value, ticket: selected?.id },
            { preserveState: true },
        );
    };

    return (
        <>
            <MessageTabs active="conversations" />

            <div className="grid h-[38rem] max-h-[calc(100dvh-9rem)] gap-4 lg:grid-cols-[22rem_1fr]">
                {/* Panel daftar; di mobile digantikan ruang chat saat percakapan terbuka. */}
                <div className={`${selected ? "hidden lg:flex" : "flex"} min-h-0 flex-col gap-3`}>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter percakapan">
                        {conversationFilters.map((f) => (
                            <button
                                key={f.value}
                                type="button"
                                onClick={() => setFilter(f.value)}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                    currentFilter === f.value
                                        ? "bg-navy text-white"
                                        : "border border-border-soft bg-white text-navy hover:bg-navy/5"
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
                        emptyText="Belum ada percakapan pelanggan."
                    />

                    {tickets!.last_page > 1 && (
                        <nav className="flex flex-wrap items-center gap-1.5" aria-label="Halaman daftar percakapan">
                            <span className="mr-1 text-[11px] text-body-text">
                                {tickets!.current_page}/{tickets!.last_page}
                            </span>
                            {(tickets!.links as Array<{ url: string | null; label: string; active: boolean }>)
                                .filter((l) => l.url)
                                .map((l, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => window.location.assign(l.url as string)}
                                        className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                            l.active
                                                ? "border-navy bg-navy text-white"
                                                : "border-border-soft bg-white text-navy hover:bg-navy/5"
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: l.label }}
                                    />
                                ))}
                        </nav>
                    )}
                </div>

                {/* Ruang percakapan + panel kelola */}
                <div className={`${selected ? "flex" : "hidden lg:flex"} min-h-0 flex-col`}>
                    {selected ? (
                        <div className="flex min-h-0 flex-1 flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <button
                                    type="button"
                                    onClick={() => router.get(route("admin.messages.index", { filter: currentFilter === "all" ? undefined : currentFilter }))}
                                    className="inline-flex items-center gap-1 rounded-md border border-border-soft px-2 py-1 font-semibold text-navy hover:bg-navy/5 lg:hidden"
                                    aria-label="Kembali ke daftar percakapan"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Daftar
                                </button>
                                <span className="font-mono text-body-text/80">{selected.ticket_number}</span>
                                <span className={statusBadge[selected.status_color] || statusBadge.secondary}>{selected.status_label}</span>
                                <span className={statusBadge[selected.priority_color] || statusBadge.secondary}>{selected.priority_label}</span>
                                {selected.user?.customer_profile?.customer_code && (
                                    <span className="rounded-full bg-electric-light px-2 py-0.5 text-[10px] font-bold text-navy">
                                        {selected.user.customer_profile.customer_code}
                                    </span>
                                )}
                                {selected.assignedTo && (
                                    <span className="text-body-text/70">Ditangani {selected.assignedTo.name}</span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowManage((v) => !v)}
                                    className="ml-auto rounded-md border border-border-soft px-2.5 py-1 text-[11px] font-semibold text-navy hover:bg-navy/5"
                                >
                                    {showManage ? "Sembunyikan kelola" : "Kelola"}
                                </button>
                            </div>

                            <div className="min-h-0 flex-1">
                                <SupportChat
                                    messages={messages}
                                    myRole="admin"
                                    opponent={selected.user ? { id: selected.user.id, name: selected.user.name } : null}
                                    opponentOnline={opponentOnline}
                                    opponentTyping={opponentTyping}
                                    closed={closed}
                                    canSendInternal
                                    onSend={(p) => submitReply(p)}
                                    onTyping={sendTypingSignal}
                                    sending={replyForm.processing}
                                    sendError={
                                        Object.keys(replyForm.errors).length > 0
                                            ? "Balasan gagal terkirim. Periksa isi pesan lalu coba kirim ulang."
                                            : null
                                    }
                                    onRetry={lastPayload ? retryLast : undefined}
                                    hasOlder={hasOlder}
                                    loadingOlder={loadingOlder}
                                    onLoadOlder={loadOlder}
                                />
                            </div>

                            {/* Panel kelola: tersembunyi default agar chat tenang. */}
                            {showManage && (
                                <div className="grid gap-4 rounded-2xl border border-border-soft bg-white p-5 shadow-subtle sm:grid-cols-2 lg:grid-cols-3">
                                    <ManageForm
                                        label="Status"
                                        disabled={statusForm.processing || statusForm.data.status === selected.status}
                                        error={statusForm.errors.status}
                                        onSet={() => statusForm.patch(route("admin.messages.update-status", selected.id), { preserveScroll: true })}
                                    >
                                        <select
                                            value={statusForm.data.status}
                                            onChange={(e) => statusForm.setData("status", e.target.value)}
                                            className="input text-xs"
                                            aria-label="Status percakapan"
                                        >
                                            <option value="open">Terbuka</option>
                                            <option value="in_progress">Sedang Ditangani</option>
                                            <option value="waiting_customer">Menunggu Pelanggan</option>
                                            <option value="resolved">Selesai</option>
                                            <option value="closed">Ditutup</option>
                                        </select>
                                    </ManageForm>

                                    <ManageForm
                                        label="Prioritas"
                                        disabled={priorityForm.processing || priorityForm.data.priority === selected.priority}
                                        error={priorityForm.errors.priority}
                                        onSet={() => priorityForm.patch(route("admin.messages.update-priority", selected.id), { preserveScroll: true })}
                                    >
                                        <select
                                            value={priorityForm.data.priority}
                                            onChange={(e) => priorityForm.setData("priority", e.target.value)}
                                            className="input text-xs"
                                            aria-label="Prioritas percakapan"
                                        >
                                            <option value="low">Rendah</option>
                                            <option value="medium">Sedang</option>
                                            <option value="high">Tinggi</option>
                                            <option value="urgent">Mendesak</option>
                                        </select>
                                    </ManageForm>

                                    <ManageForm
                                        label="Penanggung Jawab"
                                        disabled={assignForm.processing}
                                        error={assignForm.errors.assigned_to}
                                        onSet={() => assignForm.patch(route("admin.messages.assign", selected.id), { preserveScroll: true })}
                                    >
                                        <select
                                            value={assignForm.data.assigned_to}
                                            onChange={(e) => assignForm.setData("assigned_to", e.target.value)}
                                            className="input text-xs"
                                            aria-label="Penanggung jawab percakapan"
                                        >
                                            <option value="">Belum ditugaskan</option>
                                            {(admins ?? []).map((a) => (
                                                <option key={a.id} value={String(a.id)}>
                                                    {a.name}
                                                </option>
                                            ))}
                                        </select>
                                    </ManageForm>

                                    {/* Identitas pelanggan: hanya kontak yang admin miliki */}
                                    {selected.user && (
                                        <div className="border-t border-border-soft pt-3 text-xs text-body-text sm:col-span-2 lg:col-span-3">
                                            <Link href={route("admin.customers.show", selected.user.id)} className="font-semibold text-navy hover:text-tech-blue">
                                                {selected.user.name}
                                            </Link>
                                            <span className="mx-2 text-border-strong">|</span>
                                            {selected.user.email}
                                            {selected.user.phone && (
                                                <span className="ml-2 inline-flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {selected.user.phone}
                                                </span>
                                            )}
                                            {selected.user.customer_profile &&
                                                (selected.user.customer_profile.city || selected.user.customer_profile.address) && (
                                                    <span className="ml-2 inline-flex items-start gap-1">
                                                        <Building2 className="mt-0.5 h-3 w-3 shrink-0" />
                                                        {[selected.user.customer_profile.address, selected.user.customer_profile.city, selected.user.customer_profile.province]
                                                            .filter(Boolean)
                                                            .join(", ")}
                                                    </span>
                                                )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <section className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-border-soft bg-white shadow-subtle">
                            <div className="px-8 py-16 text-center">
                                <MessageSquare className="mx-auto mb-3 h-10 w-10 text-body-text/30" />
                                <p className="text-sm font-semibold text-navy">Pilih percakapan di kiri</p>
                                <p className="mt-1 text-xs text-body-text">
                                    Percakapan dengan pesan belum dibaca ditandai badge merah.
                                </p>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}

/** Satu baris select + tombol Set untuk panel kelola percakapan. */
function ManageForm({
    label,
    children,
    onSet,
    disabled,
    error,
}: {
    label: string;
    children: React.ReactNode;
    onSet: () => void;
    disabled?: boolean;
    error?: string;
}) {
    return (
        <div>
            <p className="text-xs font-bold text-navy">{label}</p>
            <div className="mt-2 flex gap-2">
                {children}
                <button type="button" disabled={disabled} onClick={onSet} className="btn-primary shrink-0 text-xs">
                    Set
                </button>
            </div>
            {error && <p className="form-error">{error}</p>}
        </div>
    );
}

/* ---------- Mode 2: arsip formulir kontak ---------- */

function ContactsInbox({ messages, filters }: { messages: Paginated<ContactMessageItem>; filters: { q?: string; status?: string } }) {
    const [q, setQ] = useState(filters.q || "");

    // Live chat Tawk.to masuk ke arsip ini; daftar disegarkan realtime.
    useEffect(() => {
        if (!window.Echo) return;
        const channel = window.Echo.channel("admin.messages");
        channel.listen(".TawkChatReceived", () => {
            router.reload({ only: ["messages"] });
        });
        return () => {
            channel.stopListening(".TawkChatReceived");
            window.Echo.leave("admin.messages");
        };
    }, []);

    const search = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route("admin.messages.contacts.index"), { q, status: filters.status }, { preserveState: true });
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case "unread":
                return <span className="badge badge-danger">Belum Dibaca</span>;
            case "read":
                return <span className="badge badge-warning">Sudah Dibaca</span>;
            case "replied":
                return <span className="badge badge-success">Sudah Dibalas</span>;
            default:
                return <span className="badge badge-neutral">{status}</span>;
        }
    };

    return (
        <>
            <MessageTabs active="contacts" />

            <div className="mb-6 rounded-2xl border border-border-soft bg-white p-4 shadow-subtle">
                <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-body-text/60" />
                        <label htmlFor="message-search" className="sr-only">
                            Cari pesan
                        </label>
                        <input
                            id="message-search"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Cari pengirim, email, atau isi pesan..."
                            className="input pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2 sm:w-56">
                        <Filter className="hidden h-4 w-4 shrink-0 text-body-text sm:block" />
                        <select
                            value={filters.status || ""}
                            onChange={(e) =>
                                router.get(
                                    route("admin.messages.contacts.index"),
                                    { q: filters.q, status: e.target.value || undefined },
                                    { preserveState: true },
                                )
                            }
                            className="input"
                        >
                            <option value="">Semua Status</option>
                            <option value="unread">Belum Dibaca</option>
                            <option value="read">Sudah Dibaca</option>
                            <option value="replied">Sudah Dibalas</option>
                        </select>
                    </div>
                    <button type="submit" className="btn-secondary py-2 text-xs">
                        Terapkan
                    </button>
                </form>
            </div>

            <div className="table-wrapper">
                <table className="table-modern">
                    <thead>
                        <tr>
                            <th className="w-1/3">Pengirim</th>
                            <th>Subjek / Topik</th>
                            <th>Status</th>
                            <th>Waktu Masuk</th>
                            <th className="text-right">Tindakan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {messages.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-light-gray text-body-text">
                                            <Inbox className="h-6 w-6" />
                                        </div>
                                        <p className="mt-3 text-sm font-semibold text-navy">Tidak ada pesan ditemukan</p>
                                        <p className="mt-1 text-xs text-body-text">
                                            Kotak pesan Anda saat ini kosong atau tidak sesuai kriteria pencarian.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            messages.data.map((m) => (
                                <tr key={m.id} className={m.status === "unread" ? "bg-crimson/5" : ""}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase ${
                                                    m.status === "unread" ? "bg-crimson/10 font-extrabold text-crimson" : "bg-navy/5 text-navy"
                                                }`}
                                            >
                                                {m.name.slice(0, 2)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`truncate text-sm ${m.status === "unread" ? "font-bold text-navy" : "font-medium text-body-dark"}`}>
                                                    {m.name}
                                                </p>
                                                <p className="truncate text-xs text-body-text">{m.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="max-w-xs truncate text-sm text-body-dark">{m.subject || "(Tanpa Subjek)"}</div>
                                        {m.source === "tawk" && (
                                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-tech-blue">
                                                <MessageSquare className="h-3 w-3" />
                                                Live Chat
                                            </span>
                                        )}
                                    </td>
                                    <td>{renderStatusBadge(m.status)}</td>
                                    <td>
                                        <span className="inline-flex items-center gap-1.5 text-xs text-body-text">
                                            <CalendarDays className="h-3.5 w-3.5 text-body-text/60" />
                                            {new Date(m.created_at).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={route("admin.messages.contacts.show", m.id)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-border-soft bg-white px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-navy/5"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                <span>Buka</span>
                                            </Link>
                                            <DeleteButton action={route("admin.messages.contacts.destroy", m.id)} label={`pesan dari ${m.name}`} />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination meta={messages} />
        </>
    );
}

/* ---------- Halaman ---------- */

export default function MessagesIndex(props: Props) {
    const isContactsMode = props.messages !== undefined;

    return (
        <AdminLayout title="Pesan Masuk">
            <Head title="Pesan Masuk | NDS Admin" />
            {isContactsMode ? (
                <ContactsInbox messages={props.messages!} filters={{ q: props.filters?.q, status: props.filters?.status }} />
            ) : (
                <ConversationsDashboard
                    {...(props as Required<Pick<Props, "tickets" | "admins" | "unreadCounts">>)}
                    filters={props.filters ?? {}}
                />
            )}
        </AdminLayout>
    );
}
