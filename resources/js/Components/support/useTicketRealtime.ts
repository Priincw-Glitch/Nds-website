import { useCallback, useEffect, useRef, useState } from "react";
import { usePage } from "@inertiajs/react";
import type { ChatMessage } from "./types";

type EchoPrivateChannel = {
    listen: (event: string, cb: (payload: unknown) => void) => unknown;
    leave: (name: string) => void;
};

type EchoPresenceChannel = {
    here: (cb: (users: Array<{ id: number }>) => void) => unknown;
    joining: (cb: (u: { id: number }) => void) => unknown;
    leaving: (cb: (u: { id: number }) => void) => unknown;
    leave: (name: string) => void;
};

type EchoLike = {
    private: (name: string) => EchoPrivateChannel;
    join: (name: string) => EchoPresenceChannel;
    leave: (name: string) => void;
    connector?: { pusher?: { connection?: { bind: (event: string, cb: (state: { current: string }) => void) => void } } };
};

const getEcho = (): EchoLike | undefined =>
    (window as unknown as { Echo?: EchoLike }).Echo;

const routeFn =
    (window as unknown as { route?: (name: string, id: number) => string }).route;

const csrfToken = () =>
    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? "";

/**
 * Koneksi realtime satu percakapan (channel private `support.{id}`) via
 * Laravel Echo + Reverb. Pesan realtime ditambahkan di state lokal; server
 * tetap sumber kebenaran melalui props saat halaman dimuat.
 */
export function useTicketRealtime(opts: {
    ticketId: number;
    myRole: "customer" | "admin";
    initialMessages: ChatMessage[];
    /** Dipanggil sekali saat koneksi Reverb pulih setelah terputus. */
    onReconnect?: () => void;
}) {
    const { ticketId, myRole, initialMessages, onReconnect } = opts;

    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [opponentTyping, setOpponentTyping] = useState(false);
    const typingHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSignalSentAt = useRef(0);
    const lastDeliveredAckAt = useRef(0);
    const onReconnectRef = useRef(onReconnect);
    onReconnectRef.current = onReconnect;

    // Sinkron ulang hanya ketika data awal benar-benar berubah (tiket ganti
    // / reload Inertia mengantarkan pesan baru), bukan pada setiap render.
    const messagesKey = initialMessages.map((m) => m.id).join(",");
    useEffect(() => {
        setMessages(initialMessages);
        // initialMessages dibaca hanya saat kuncinya berganti.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticketId, messagesKey]);

    useEffect(() => {
        const Echo = getEcho();
        // Tanpa tiket (tampilan memulai percakapan) tidak ada channel yang
        // perlu dilanggan.
        if (!Echo || !ticketId) return;

        const channel = Echo.private(`support.${ticketId}`);

        const onNewMessage = (payload: unknown) => {
            const message = (payload as { message?: ChatMessage }).message;
            if (!message || message.is_internal) return;
            setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));

            // Terima pesan = bukti Delivered: konfirmasi ke server (throttle
            // 5 detik; satu panggilan menandai semua pesan yang belum dikonfirmasi).
            const now = Date.now();
            if (now - lastDeliveredAckAt.current > 5000) {
                lastDeliveredAckAt.current = now;
                const url =
                    myRole === "admin"
                        ? routeFn?.("admin.messages.delivered", ticketId)
                        : routeFn?.("customer.support.delivered", ticketId);
                if (url) {
                    fetch(url, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken(), Accept: "application/json" },
                        body: JSON.stringify({}),
                    }).catch(() => {});
                }
            }
        };

        const onDelivered = (payload: unknown) => {
            const p = payload as { delivered_ids?: number[] };
            if (!Array.isArray(p?.delivered_ids)) return;
            setMessages((prev) =>
                prev.map((m) =>
                    p.delivered_ids!.includes(m.id) ? { ...m, delivered_at: m.delivered_at ?? new Date().toISOString() } : m,
                ),
            );
        };

        const onTyping = (payload: unknown) => {
            const p = payload as { role?: string };
            if (typeof p?.role !== "string") return;
            if (p.role === myRole) return;
            setOpponentTyping(true);
            if (typingHideTimer.current) clearTimeout(typingHideTimer.current);
            typingHideTimer.current = setTimeout(() => setOpponentTyping(false), 4000);
        };

        const onRead = (payload: unknown) => {
            const p = payload as { read_by_role?: string };
            if (typeof p?.read_by_role !== "string") return;
            if (p.read_by_role === myRole) return;
            // Pihak lain membuka percakapan: centang Read pada pesan saya.
            setMessages((prev) =>
                prev.map((m) => (m.user && m.user.role === myRole ? { ...m, is_read: true, read_at: m.read_at ?? new Date().toISOString() } : m)),
            );
        };

        channel.listen(".TicketMessageSent", onNewMessage);
        channel.listen(".TicketMessagesDelivered", onDelivered);
        channel.listen(".TicketTyping", onTyping);
        channel.listen(".TicketMessagesRead", onRead);

        // Reconnect: pesan yang terlewat saat koneksi putus diambil lewat
        // reload properti percakapan sekali per koneksi pulih. Handler
        // di-unbind saat unmount agar tidak menumpuk antar navigasi Inertia.
        let previousState = "";
        const connection = Echo.connector?.pusher?.connection;
        const onStateChange = (state: { current: string }) => {
            if (state.current === "connected" && (previousState === "unavailable" || previousState === "disconnected" || previousState === "failed")) {
                onReconnectRef.current?.();
            }
            previousState = state.current;
        };
        connection?.bind("state_change", onStateChange);

        return () => {
            // Variasi driver mendeklarasikan unbind berbeda; lepas bila tersedia.
            (
                connection as
                    | { unbind?: (event: string, callback: (state: { current: string }) => void) => void }
                    | undefined
            )?.unbind?.("state_change", onStateChange);
            Echo.leave(`support.${ticketId}`);
            if (typingHideTimer.current) clearTimeout(typingHideTimer.current);
        };
    }, [ticketId, myRole]);

    /**
     * Sinyal "sedang mengetik" → backend → Reverb. Dibatasi satu POST per
     * 2 detik agar tidak broadcast pada setiap ketikan.
     */
    const sendTypingSignal = useCallback(() => {
        const now = Date.now();
        if (now - lastSignalSentAt.current < 2000) return;
        lastSignalSentAt.current = now;

        const url =
            myRole === "admin"
                ? routeFn?.("admin.messages.typing", ticketId)
                : routeFn?.("customer.support.typing", ticketId);
        if (!url) return;
        // Sinyal best-effort: gagal jaringan tidak memengaruhi chat.
        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrfToken(),
                Accept: "application/json",
            },
            body: JSON.stringify({}),
        }).catch(() => {});
    }, [myRole, ticketId]);

    /**
     * Sisipkan riwayat pesan lebih lama (lazy loading) tanpa duplikat.
     */
    const prependMessages = useCallback((older: ChatMessage[]) => {
        setMessages((prev) => {
            const known = new Set(prev.map((m) => m.id));
            return [...older.filter((m) => !known.has(m.id)), ...prev];
        });
    }, []);

    return { messages, opponentTyping, sendTypingSignal, prependMessages };
}

/**
 * Status Online lawan bicara dari presence channel Reverb. Null berarti
 * presence tidak tersedia, dan UI tidak menunjukkan status online apa pun
 * daripada menampilkan status palsu.
 */
export function useTicketPresence(ticketId: number, myRole: "customer" | "admin") {
    const [opponentOnline, setOpponentOnline] = useState<boolean | null>(null);
    // usePage (React 19 `use(Context)`) wajib dipanggil di body render hook,
    // bukan di dalam effect.
    const { auth } = usePage().props as unknown as {
        auth?: { user?: { id?: number } | null };
    };
    const myId = auth?.user?.id ?? -1;

    useEffect(() => {
        const Echo = getEcho();
        if (!Echo || !ticketId) return;

        const channel = Echo.join(`presence-support.${ticketId}`);
        const onlineIds = new Set<number>();

        const refresh = () => {
            // Lawan bicara dianggap online jika ada pengguna lain selain saya.
            setOpponentOnline([...onlineIds].some((id) => id !== myId));
        };

        channel.here((users) => {
            onlineIds.clear();
            users.forEach((u) => onlineIds.add(u.id));
            refresh();
        });
        channel.joining((u) => {
            onlineIds.add(u.id);
            refresh();
        });
        channel.leaving((u) => {
            onlineIds.delete(u.id);
            refresh();
        });

        return () => {
            Echo.leave(`presence-support.${ticketId}`);
        };
    }, [ticketId, myId]);

    return { opponentOnline };
}
