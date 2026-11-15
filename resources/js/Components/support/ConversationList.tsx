/**
 * Panel daftar percakapan Support (WhatsApp Web): avatar inisial, preview
 * pesan terakhir, waktu, badge belum dibaca. Data ringkasan dibangun dari
 * payload daftar tiket; badge menampilkan hitungan backend yang nyata.
 */
import { Link } from "@inertiajs/react";
import { Search, Inbox } from "lucide-react";
import type { ConversationSummary } from "./types";

const dotColor: Record<string, string> = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    info: "bg-tech-blue",
    secondary: "bg-body-text/40",
};

/** Jam ringkas: hari ini → jam, bukan → tanggal singkat. */
const formatListTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

export function ConversationList({
    conversations,
    activeHref,
    searchValue,
    onSearch,
    emptyText = "Belum ada percakapan.",
}: {
    conversations: ConversationSummary[];
    activeHref?: string;
    searchValue: string;
    onSearch: (value: string) => void;
    emptyText?: string;
}) {
    const q = searchValue.trim().toLowerCase();
    const filtered = q
        ? conversations.filter(
              (c) =>
                  c.title.toLowerCase().includes(q) ||
                  c.ticket_number.toLowerCase().includes(q) ||
                  (c.last_message_preview ?? "").toLowerCase().includes(q),
          )
        : conversations;

    return (
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border-soft bg-white shadow-subtle">
            <div className="shrink-0 border-b border-border-soft p-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body-text" />
                    <input
                        type="search"
                        value={searchValue}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder="Cari percakapan"
                        aria-label="Cari percakapan"
                        className="input py-2 pl-9 text-xs"
                    />
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                        {q ? (
                            <Search className="mx-auto mb-3 h-8 w-8 text-body-text/30" />
                        ) : (
                            <Inbox className="mx-auto mb-3 h-8 w-8 text-body-text/30" />
                        )}
                        <p className="text-xs font-semibold text-navy">{q ? "Tidak cocok." : emptyText}</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-border-soft">
                        {filtered.map((c) => {
                            const active = c.href === activeHref;
                            return (
                                <li key={c.id}>
                                    <Link
                                        href={c.href}
                                        className={`block px-3 py-3 transition-colors ${
                                            active ? "bg-electric-light/40" : "hover:bg-light-blue/50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                                    active ? "bg-tech-blue text-white" : "bg-navy text-white"
                                                }`}
                                                aria-hidden="true"
                                            >
                                                {c.title.slice(0, 1).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <p className="truncate text-xs font-bold text-navy">{c.title}</p>
                                                    {c.last_message_at && (
                                                        <span className="shrink-0 text-[10px] text-body-text/60">
                                                            {formatListTime(c.last_message_at)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 truncate text-[11px] text-body-text">
                                                    {c.last_message_preview ?? "—"}
                                                </p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${dotColor[c.status_color] ?? dotColor.secondary}`}
                                                        aria-hidden="true"
                                                    />
                                                    <span className="font-mono text-[10px] text-body-text/60">
                                                        {c.ticket_number}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Badge hanya saat ada pesan lawan yang belum dibaca */}
                                            {c.unread_count > 0 && (
                                                <span className="shrink-0 rounded-full bg-crimson px-2 py-0.5 text-[10px] font-bold text-white">
                                                    {c.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </section>
    );
}
