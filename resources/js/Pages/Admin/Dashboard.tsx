import { Head, Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import {
    Server,
    Megaphone,
    Newspaper,
    Inbox,
    Plus,
    ArrowUpRight,
    Mail,
    Clock,
    MapPin,
    History,
    Settings,
} from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";

interface DashboardProps {
    stats: {
        services: number;
        services_published: number;
        promos: number;
        promos_active: number;
        articles: number;
        articles_published: number;
        coverages: number;
        coverages_available: number;
        unread_messages: number;
        total_messages: number;
    };
    recentUpdates: Array<{
        id: number;
        title: string;
        type: string;
        updated_at: string;
        url: string;
    }>;
    recentMessages: Array<{
        id: number;
        name: string;
        email: string;
        subject?: string | null;
        status: string;
        created_at: string;
    }>;
    systemInfo: {
        php_version: string;
        laravel_version: string;
        environment: string;
        database: string;
        server_time: string;
    };
}

function formatDate(isoDate?: string | null) {
    if (!isoDate) return "";
    return new Date(isoDate).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AdminDashboard({
    stats,
    recentUpdates,
    recentMessages,
    systemInfo,
}: DashboardProps) {
    const cards = [
        {
            label: "Katalog Layanan",
            value: stats.services,
            subtext: `${stats.services_published} layanan tayang aktif`,
            href: route("admin.services.index"),
            icon: Server,
            iconBg: "bg-tech-blue/10 text-tech-blue",
        },
        {
            label: "Promo & Diskon",
            value: stats.promos,
            subtext: `${stats.promos_active} promo periode aktif`,
            href: route("admin.promos.index"),
            icon: Megaphone,
            iconBg: "bg-tech-blue/10 text-tech-blue",
        },
        {
            label: "Artikel Blog",
            value: stats.articles,
            subtext: `${stats.articles_published} artikel dipublikasikan`,
            href: route("admin.articles.index"),
            icon: Newspaper,
            iconBg: "bg-tech-blue/10 text-tech-blue",
        },
        {
            label: "Cakupan Wilayah",
            value: stats.coverages,
            subtext: `${stats.coverages_available} titik siap layani`,
            href: route("admin.coverages.index"),
            icon: MapPin,
            iconBg: "bg-tech-blue/10 text-tech-blue",
        },
        {
            label: "Pesan Masuk",
            value: stats.unread_messages,
            subtext: `Dari total ${stats.total_messages} pesan`,
            href: route("admin.messages.index"),
            icon: Inbox,
            iconBg: stats.unread_messages > 0 ? "bg-crimson/10 text-crimson" : "bg-tech-blue/10 text-tech-blue",
        },
    ];

    return (
        <AdminLayout title="Dashboard">
            <Head title="Dashboard | NDS Admin" />

            {/* Welcome & Quick Action Header */}
            <div className="mb-8 rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-navy sm:text-2xl">Dashboard</h1>
                        <p className="mt-1 text-xs text-body-text">
                            Ringkasan konten website dan pesan konsultasi yang masuk.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link href={route("admin.promos.create")} className="btn-secondary py-2 text-xs">
                            <Plus className="h-3.5 w-3.5" />
                            <span>Promo Baru</span>
                        </Link>
                        <Link href={route("admin.articles.create")} className="btn-secondary py-2 text-xs">
                            <Plus className="h-3.5 w-3.5" />
                            <span>Tulis Artikel</span>
                        </Link>
                        <Link
                            href={route("admin.settings.edit", { tab: "homepage" })}
                            className="btn-navy py-2 text-xs"
                        >
                            <Settings className="h-3.5 w-3.5" />
                            <span>Kelola Beranda</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {cards.map((card) => (
                    <Link
                        key={card.label}
                        href={card.href}
                        className="group relative rounded-2xl border border-border-soft bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-tech-blue/40 hover:shadow-card-hover"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-body-text">{card.label}</p>
                                <p className="mt-2 text-3xl font-extrabold tracking-tight text-navy">
                                    {card.value}
                                </p>
                                <p className="mt-1 text-xs text-body-text">{card.subtext}</p>
                            </div>
                            <span className={`flex h-11 w-11 items-center justify-center rounded-lg shadow-subtle ${card.iconBg}`}>
                                <card.icon className="h-5 w-5" />
                            </span>
                        </div>
                        <div className="mt-4 flex items-center justify-end gap-1 text-[11px] font-semibold text-tech-blue group-hover:underline">
                            <span>Buka Pengelolaan</span>
                            <ArrowUpRight className="h-3 w-3" />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Content & Messages Columns */}
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
                {/* Kolom 1: Pesan Masuk Terbaru */}
                <div className="rounded-2xl border border-border-soft bg-white shadow-subtle">
                    <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
                        <div className="flex items-center gap-2">
                            <Inbox className="h-4 w-4 text-tech-blue" />
                            <h2 className="text-sm font-bold text-navy">Pesan Konsultasi Terbaru</h2>
                        </div>
                        <Link
                            href={route("admin.messages.index")}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-tech-blue hover:underline"
                        >
                            <span>Semua Pesan</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    {recentMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-light-gray text-body-text">
                                <Mail className="h-5 w-5" />
                            </div>
                            <p className="mt-2.5 text-xs font-semibold text-navy">Belum ada pesan masuk</p>
                            <p className="text-[11px] text-body-text">
                                Pesan dari formulir kontak website akan otomatis tampil di sini.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border-soft">
                            {recentMessages.map((msg) => (
                                <Link
                                    key={msg.id}
                                    href={route("admin.messages.contacts.show", msg.id)}
                                    className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-navy/5"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/5 text-xs font-bold text-navy uppercase">
                                            {msg.name.slice(0, 2)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate text-xs font-semibold text-navy">{msg.name}</p>
                                                {msg.status === "unread" && (
                                                    <span className="badge badge-danger">
                                                        Baru
                                                    </span>
                                                )}
                                            </div>
                                            <p className="truncate text-[11px] text-body-text">
                                                {msg.subject || msg.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex shrink-0 items-center gap-1 text-[11px] text-body-text">
                                        <Clock className="h-3 w-3 text-body-text/60" />
                                        <span>
                                            {new Date(msg.created_at).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "short",
                                            })}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Kolom 2: Konten Terakhir Diperbarui */}
                <div className="rounded-2xl border border-border-soft bg-white shadow-subtle">
                    <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
                        <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-tech-blue" />
                            <h2 className="text-sm font-bold text-navy">Konten Terakhir Diperbarui</h2>
                        </div>
                        <span className="text-[11px] font-medium text-body-text">Aktivitas Database</span>
                    </div>

                    {recentUpdates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                            <p className="text-xs text-body-text">Belum ada riwayat pembaruan konten.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border-soft">
                            {recentUpdates.map((item, idx) => (
                                <Link
                                    key={idx}
                                    href={item.url}
                                    className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-navy/5"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="rounded bg-light-gray border border-border-soft px-1.5 py-0.5 text-[10px] font-semibold text-navy">
                                                {item.type}
                                            </span>
                                            <p className="truncate text-xs font-semibold text-navy">{item.title}</p>
                                        </div>
                                    </div>
                                    <div className="ml-4 shrink-0 text-right">
                                        <p className="text-[11px] text-body-text">{formatDate(item.updated_at)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* System Info Bar */}
            <div className="mt-8 rounded-2xl border border-border-soft bg-white p-5 shadow-subtle">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-body-text">
                    <span className="font-medium text-navy">Info Sistem</span>
                    <div className="flex flex-wrap gap-4 text-[11px]">
                        <span>PHP: <strong className="text-navy">{systemInfo.php_version}</strong></span>
                        <span>Laravel: <strong className="text-navy">{systemInfo.laravel_version}</strong></span>
                        <span>Env: <strong className="text-navy uppercase">{systemInfo.environment}</strong></span>
                        <span>Waktu Server: <strong className="text-navy">{systemInfo.server_time}</strong></span>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
