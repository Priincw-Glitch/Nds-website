import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { storageUrl } from "@/utils/assets";
import {
    Check,
    CheckCheck,
    Clock,
    Paperclip,
    Send,
    Loader2,
    AlertCircle,
    X,
    FileText,
    Download,
    ArrowDown,
} from "lucide-react";
import type { ChatMessage, OpponentProfile } from "./types";

const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

const formatDay = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (d >= startOfToday) return "Hari ini";
    const yesterday = new Date(startOfToday);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d >= yesterday) return "Kemarin";
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

const sameDay = (a: string, b: string) =>
    new Date(a).toDateString() === new Date(b).toDateString();

const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

/** Tiga titik yang bergerak bergantian; berhenti total saat tidak ada sinyal. */
function TypingDots({ label }: { label: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-[75%] rounded-xl border border-border-soft bg-white px-4 py-3 shadow-subtle"
            aria-live="polite"
        >
            <div className="flex items-center gap-2 text-xs text-body-text">
                <span className="flex gap-1" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-body-text/60"
                            animate={{ opacity: [0.25, 1, 0.25] }}
                            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.22 }}
                        />
                    ))}
                </span>
                <span>{label} sedang mengetik&hellip;</span>
            </div>
        </motion.div>
    );
}

export interface SupportChatProps {
    /** Pesan dari server (halaman awal / reload Inertia). */
    messages: ChatMessage[];
    myRole: "customer" | "admin";
    opponent: OpponentProfile | null;
    /** Lawan bicara terhubung (presence Reverb); null bila tidak tersedia. */
    opponentOnline: boolean | null;
    opponentTyping: boolean;
    /** Percakapan ditutup: komposer disembunyikan. */
    closed: boolean;
    /** Catatan internal hanya tersedia bagi admin. */
    canSendInternal?: boolean;
    onSend: (payload: { message: string; is_internal: boolean; attachments: File[] }) => void;
    onTyping: () => void;
    /** Status pengiriman terakhir; untuk indikator Sending/Gagal + retry. */
    sending: boolean;
    sendError?: string | null;
    onRetry?: () => void;
    /** Riwayat lebih lama: tombol muat di atas bubble (lazy loading). */
    hasOlder?: boolean;
    loadingOlder?: boolean;
    onLoadOlder?: () => void;
}

/**
 * Area chat ala WhatsApp Web: deretan bubble + komposer. Pesan saya di kanan
 * (electric), lawan bicara di kiri. Animasi hanya pada bubble yang baru
 * muncul; key dari ID pesan agar bubble lama tidak dianimasikan ulang.
 */
export default function SupportChat({
    messages,
    myRole,
    opponent,
    opponentOnline,
    opponentTyping,
    closed,
    canSendInternal = false,
    onSend,
    onTyping,
    sending,
    sendError,
    onRetry,
    hasOlder = false,
    loadingOlder = false,
    onLoadOlder,
}: SupportChatProps) {
    const [draft, setDraft] = useState("");
    const [internal, setInternal] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [atBottom, setAtBottom] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = (smooth = true) => {
        bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
    };

    // Scroll otomatis hanya jika pembaca sedang melihat bagian bawah.
    useEffect(() => {
        if (atBottom) scrollToBottom();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, opponentTyping]);

    const onScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
    };

    const notifyTyping = () => {
        if (draft.trim()) onTyping();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = draft.trim();
        if (!text || sending) return;
        onSend({ message: text, is_internal: internal, attachments });
        setDraft("");
        setAttachments([]);
        if (fileRef.current) fileRef.current.value = "";
        setAtBottom(true);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit(e as unknown as React.FormEvent);
        }
    };

    const lastMine = [...messages].reverse().find((m) => m.user?.role === myRole);

    return (
        <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border-soft bg-white shadow-subtle">
            {/* Header percakapan */}
            <header className="flex shrink-0 items-center gap-3 border-b border-border-soft px-4 py-3 sm:px-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                    {(opponent?.name || "N").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-navy">{opponent?.name ?? "Support"}</p>
                    <div className="flex items-center gap-1.5 text-xs text-body-text">
                        {opponentTyping ? (
                            <span className="text-tech-blue">sedang mengetik&hellip;</span>
                        ) : opponentOnline === null ? null : (
                            <motion.span
                                key={opponentOnline ? "on" : "off"}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`inline-flex items-center gap-1.5 ${opponentOnline ? "text-emerald-700" : "text-body-text/60"}`}
                            >
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${opponentOnline ? "bg-success" : "bg-body-text/30"}`}
                                    aria-hidden="true"
                                />
                                {opponentOnline ? "Online" : "Offline"}
                            </motion.span>
                        )}
                    </div>
                </div>
            </header>

            {/* Bubble */}
            <div
                ref={scrollRef}
                onScroll={onScroll}
                className="min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-light-blue/40 px-3 py-4 sm:px-5"
                aria-live="polite"
            >
                {hasOlder && onLoadOlder && (
                    <div className="flex justify-center pb-2">
                        <button
                            type="button"
                            onClick={onLoadOlder}
                            disabled={loadingOlder}
                            className="rounded-full border border-border-soft bg-white px-3 py-1.5 text-[11px] font-semibold text-navy transition-colors hover:bg-navy/5 disabled:opacity-50"
                        >
                            {loadingOlder ? "Memuat..." : "Muat pesan lama"}
                        </button>
                    </div>
                )}

                {messages.length === 0 && (
                    <p className="py-16 text-center text-xs text-body-text/70">
                        Belum ada pesan. Mulai percakapan di bawah.
                    </p>
                )}

                {messages.map((message, i) => {
                    const fromMe = message.user?.role === myRole;
                    // Payload lama/edge case tanpa kunci attachments tidak boleh
                    // merobohkan render.
                    const files = message.attachments ?? [];
                    const showDay = i === 0 || !sameDay(messages[i - 1].created_at, message.created_at);
                    return (
                        <div key={message.id}>
                            {showDay && (
                                <div className="my-3 flex justify-center">
                                    <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-body-text">
                                        {formatDay(message.created_at)}
                                    </span>
                                </div>
                            )}
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.22, ease: "easeOut" }}
                                className={`my-1.5 flex ${fromMe ? "justify-end" : "justify-start"}`}
                            >
                                <div className="max-w-[85%] sm:max-w-[72%]">
                                    <div
                                        className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                                            message.is_internal
                                                ? "rounded-br-sm border border-border-strong bg-light-gray text-body-dark"
                                                : fromMe
                                                  ? "rounded-br-sm bg-tech-blue text-white"
                                                  : "rounded-bl-sm border border-border-soft bg-white text-body-dark shadow-subtle"
                                        }`}
                                    >
                                        <p className="whitespace-pre-line break-words">{message.message}</p>
                                        {files.length > 0 && (
                                            <ul
                                                className={`mt-2 space-y-1.5 border-t pt-2 ${
                                                    fromMe && !message.is_internal
                                                        ? "border-white/25"
                                                        : "border-border-soft"
                                                }`}
                                            >
                                                {files.map((file) => (
                                                    <li key={file.id}>
                                                        <a
                                                            href={storageUrl(file.path)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`flex items-center gap-1.5 text-xs font-medium hover:underline ${
                                                                fromMe && !message.is_internal
                                                                    ? "text-white"
                                                                    : "text-tech-blue"
                                                            }`}
                                                        >
                                                            <FileText className="h-3.5 w-3.5 shrink-0" />
                                                            <span className="truncate">{file.original_filename}</span>
                                                            <span className="opacity-70">{formatSize(file.file_size)}</span>
                                                            <Download className="h-3 w-3 shrink-0" />
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <div
                                            className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${
                                                fromMe && !message.is_internal ? "text-white/70" : "text-body-text/60"
                                            }`}
                                        >
                                            <span className="ml-auto">{formatTime(message.created_at)}</span>
                                            {/* Status berbasis kejadian nyata: Check = tersimpan,
                                                CheckCheck redup = sampai perangkat penerima,
                                                CheckCheck terang = sudah dibaca. */}
                                            {fromMe &&
                                                !message.is_internal &&
                                                (message.is_read ? (
                                                    <CheckCheck className="h-3.5 w-3.5 text-white" aria-label="Dibaca" />
                                                ) : message.delivered_at ? (
                                                    <CheckCheck className="h-3.5 w-3.5 text-white/60" aria-label="Sampai ke penerima" />
                                                ) : lastMine?.id === message.id && sending ? (
                                                    <Clock className="h-3 w-3 animate-pulse text-white/70" aria-label="Mengirim" />
                                                ) : (
                                                    <Check className="h-3.5 w-3.5 text-white/70" aria-label="Terkirim" />
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    );
                })}

                <AnimatePresence>
                    {opponentTyping && (
                        <TypingDots label={opponent?.name ?? (myRole === "admin" ? "Pelanggan" : "Admin")} />
                    )}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            {/* Pintasan ke pesan terbaru saat pembaca membaca pesan lama */}
            {!atBottom && (
                <button
                    type="button"
                    onClick={() => scrollToBottom()}
                    className="absolute right-5 bottom-24 z-10 flex items-center gap-1.5 rounded-full bg-navy px-3 py-2 text-[11px] font-semibold text-white shadow-md transition hover:bg-navy/90"
                >
                    <ArrowDown className="h-3.5 w-3.5" />
                    Pesan baru
                </button>
            )}

            {/* Komposer */}
            <div className="shrink-0 border-t border-border-soft bg-white p-3 sm:p-4">
                {sendError && (
                    <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50/90 p-2.5 text-xs text-red-900">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                            <span>{sendError}</span>
                        </div>
                        {onRetry && (
                            <button type="button" onClick={onRetry} className="shrink-0 font-semibold text-red-900 underline">
                                Kirim ulang
                            </button>
                        )}
                    </div>
                )}
                {closed ? (
                    <p className="py-2 text-center text-xs text-body-text">
                        Percakapan ini ditutup. Buka pesan baru jika Anda masih membutuhkan bantuan.
                    </p>
                ) : (
                    <form onSubmit={submit} className="space-y-2">
                        <div className="relative flex items-end gap-2">
                            <textarea
                                value={draft}
                                onChange={(e) => {
                                    setDraft(e.target.value);
                                    notifyTyping();
                                }}
                                onKeyDown={onKeyDown}
                                placeholder={
                                    canSendInternal && internal
                                        ? "Tulis catatan internal (tidak terlihat pelanggan)"
                                        : myRole === "admin"
                                          ? "Tulis balasan untuk pelanggan"
                                          : "Tulis pesan untuk tim NDS"
                                }
                                aria-label="Tulis pesan"
                                rows={2}
                                className="input max-h-40 min-h-12 flex-1 resize-none py-3 pr-10 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="absolute bottom-3 right-3 rounded-md p-1.5 text-body-text transition-colors hover:bg-navy/5 hover:text-navy"
                                aria-label="Tambah lampiran"
                                title="Tambah lampiran (JPG, PNG, PDF, DOC, DOCX, maks 5 MB)"
                            >
                                <Paperclip className="h-4 w-4" />
                            </button>
                            <input
                                ref={fileRef}
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/jpg,application/pdf,.doc,.docx"
                                onChange={(e) => setAttachments([...attachments, ...Array.from(e.target.files ?? [])])}
                                className="sr-only"
                                aria-label="Pilih berkas lampiran"
                            />
                            <button
                                type="submit"
                                disabled={sending || !draft.trim()}
                                className="btn-primary h-12 shrink-0 self-end disabled:opacity-50"
                                aria-label="Kirim pesan"
                            >
                                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                <span className="hidden sm:inline">{sending ? "Mengirim" : "Kirim"}</span>
                            </button>
                        </div>

                        {attachments.length > 0 && (
                            <ul className="flex flex-wrap items-center gap-2">
                                {attachments.map((file, i) => (
                                    <li
                                        key={`${file.name}-${i}`}
                                        className="flex items-center gap-2 rounded-md border border-border-soft bg-white px-2.5 py-1 text-xs text-navy"
                                    >
                                        <span className="max-w-40 truncate">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}
                                            className="text-red-700 hover:text-red-900"
                                            aria-label={`Hapus ${file.name}`}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-body-text/70">
                            <span>
                                {sending ? (
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3 animate-pulse" /> Mengirim&hellip;
                                    </span>
                                ) : (
                                    <>Enter kirim &middot; Shift+Enter baris baru</>
                                )}
                            </span>
                            {canSendInternal && (
                                <label className="flex cursor-pointer items-center gap-2 font-medium text-navy">
                                    <input
                                        type="checkbox"
                                        checked={internal}
                                        onChange={(e) => setInternal(e.target.checked)}
                                        className="h-3.5 w-3.5 rounded border-border-strong text-tech-blue focus:ring-tech-blue"
                                    />
                                    Catatan internal
                                </label>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </section>
    );
}
