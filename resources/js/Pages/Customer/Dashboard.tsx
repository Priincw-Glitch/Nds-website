import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Package, MessageSquare, Bell, Tag } from 'lucide-react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { formatDate as fetchFormatDate, formatRupiah as fetchFormatRupiah } from '@/Components/PromoCard';

interface PromoSummary {
    id: number;
    title: string;
    image: string | null;
    category?: { id: number; name: string } | null;
    discount_type: string;
    original_price: number | null;
    discount_percentage: number | null;
    discount_amount: number | null;
    final_price: number | null;
}

interface PromoPurchaseRow {
    id: number;
    promo: PromoSummary | null;
    purchase_date: string | null;
    status: 'pending' | 'paid' | 'cancelled';
    notes: string | null;
}

interface SupportTicket {
    id: number;
    ticket_number: string;
    title: string;
    status: string;
    status_label: string;
    status_color: string;
    created_at: string;
    latest_message?: { message: string; created_at: string } | null;
}

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
        avatar: string | null;
        customerProfile?: { customer_code?: string | null } | null;
    };
    promoPurchases: PromoPurchaseRow[];
    recentTickets: SupportTicket[];
    openTicketsCount: number;
    unreadSupportMessages: number;
    recentNotifications: Notification[];
    unreadNotificationsCount: number;
}

const statusBadge: Record<string, string> = {
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    danger: 'badge badge-danger',
    info: 'badge badge-secondary',
    secondary: 'badge badge-neutral',
};

export default function Dashboard({
    user,
    promoPurchases,
    recentTickets,
    openTicketsCount,
    unreadSupportMessages,
    recentNotifications,
    unreadNotificationsCount = 0,
}: Props) {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Selamat Pagi';
        if (hour < 18) return 'Selamat Siang';
        return 'Selamat Malam';
    };

    const customerId = user.customerProfile?.customer_code ?? `USER${String(user.id).padStart(3, '0')}`;

    return (
        <CustomerLayout title="Overview">
            <Head title="Overview | NDS Customer Portal" />

            {/* Sapaan + Customer ID dari database */}
            <div className="mb-6">
                <h1 className="text-xl font-bold text-navy sm:text-2xl">
                    {getGreeting()}, {user.name.split(' ')[0]}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-body-text">
                    <span>
                        Customer ID: <span className="font-mono font-semibold text-navy">{customerId}</span>
                    </span>
                    <span>
                        {promoPurchases.filter((p) => p.status === 'paid').length} promo terbayar dari{' '}
                        {promoPurchases.length} pembelian
                    </span>
                </div>
            </div>

            {/* Tiga angka inti promo-support */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
                <Link
                    href={route('customer.promos.index')}
                    className="card-tile flex items-center gap-4 p-5 hover:border-tech-blue/40"
                >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-electric-light">
                        <Tag className="h-5 w-5 text-tech-blue" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold leading-tight text-navy">{promoPurchases.length}</p>
                        <p className="text-xs text-body-text">Promo Dimiliki</p>
                    </div>
                </Link>

                <Link
                    href={route('customer.support.index')}
                    className="card-tile flex items-center gap-4 p-5 hover:border-tech-blue/40"
                >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-electric-light">
                        <MessageSquare className="h-5 w-5 text-tech-blue" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold leading-tight text-navy">{unreadSupportMessages}</p>
                        <p className="text-xs text-body-text">Pesan Support Belum Dibaca</p>
                    </div>
                </Link>

                <Link
                    href={route('customer.notifications.index')}
                    className="card-tile flex items-center gap-4 p-5 hover:border-tech-blue/40"
                >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-electric-light">
                        <Bell className="h-5 w-5 text-tech-blue" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold leading-tight text-navy">{unreadNotificationsCount}</p>
                        <p className="text-xs text-body-text">Notifikasi Belum Dibaca</p>
                    </div>
                </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Kolom utama */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Ringkasan promo */}
                    <section className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <div className="mb-5 flex items-center justify-between border-b border-border-soft pb-4">
                            <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Ringkasan Promo</h2>
                            <Link
                                href={route('customer.promos.index')}
                                className="text-xs font-semibold text-tech-blue hover:underline"
                            >
                                Lihat My Promo
                            </Link>
                        </div>

                        {promoPurchases.length > 0 ? (
                            <ul className="space-y-3">
                                {promoPurchases.slice(0, 5).map((purchase) => (
                                    <li key={purchase.id}>
                                        <Link
                                            href={route('customer.promos.index')}
                                            className="flex items-center justify-between gap-3 rounded-lg border border-border-soft px-4 py-3 transition-colors hover:border-tech-blue/40 hover:bg-electric-light/20"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-navy">
                                                    {purchase.promo?.title ?? 'Promo'}
                                                </p>
                                                <p className="text-xs text-body-text">
                                                    {purchase.promo?.category?.name ?? 'Tanpa kategori'}
                                                    {purchase.purchase_date ? ` · dibeli ${fetchFormatDate(purchase.purchase_date)}` : ''}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                {purchase.promo?.final_price !== null &&
                                                    purchase.promo?.final_price !== undefined && (
                                                        <p className="text-sm font-bold text-navy">
                                                            {fetchFormatRupiah(purchase.promo.final_price)}
                                                        </p>
                                                    )}
                                                <span
                                                    className={
                                                        purchase.status === 'paid'
                                                            ? 'badge badge-success'
                                                            : purchase.status === 'pending'
                                                              ? 'badge badge-warning'
                                                              : 'badge badge-neutral'
                                                    }
                                                >
                                                    {purchase.status === 'paid'
                                                        ? 'Terbayar'
                                                        : purchase.status === 'pending'
                                                          ? 'Menunggu'
                                                          : 'Dibatalkan'}
                                                </span>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="py-10 text-center">
                                <Package className="mx-auto mb-3 h-10 w-10 text-body-text/30" />
                                <p className="text-sm text-body-text">Belum ada promo di akun Anda.</p>
                                <p className="mt-1 text-xs text-body-text/70">
                                    Promo ditetapkan oleh admin NDS setelah pembelian.
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Percakapan support terbaru */}
                    <section className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <div className="mb-5 flex items-center justify-between border-b border-border-soft pb-4">
                            <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Support Chat Terbaru</h2>
                            <Link
                                href={route('customer.support.index')}
                                className="text-xs font-semibold text-tech-blue hover:underline"
                            >
                                Semua percakapan
                            </Link>
                        </div>

                        {recentTickets.length > 0 ? (
                            <ul className="space-y-3">
                                {recentTickets.map((ticket) => (
                                    <li key={ticket.id}>
                                        <Link
                                            href={route('customer.support.show', ticket.id)}
                                            className="flex items-center justify-between gap-3 rounded-lg border border-border-soft px-4 py-3 transition-colors hover:border-tech-blue/40 hover:bg-electric-light/20"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-navy">{ticket.title}</p>
                                                <p className="truncate text-xs text-body-text">
                                                    {ticket.latest_message?.message ?? ticket.ticket_number}
                                                </p>
                                            </div>
                                            <span className="flex items-center gap-2">
                                                <span className="text-xs text-body-text">
                                                    {fetchFormatDate(ticket.created_at)}
                                                </span>
                                                <span className={statusBadge[ticket.status_color] || statusBadge.secondary}>
                                                    {ticket.status_label}
                                                </span>
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="py-10 text-center">
                                <MessageSquare className="mx-auto mb-3 h-10 w-10 text-body-text/30" />
                                <p className="text-sm text-body-text">Belum ada percakapan.</p>
                                <Link
                                    href={route('customer.support.index')}
                                    className="mt-3 inline-flex text-xs font-semibold text-tech-blue hover:underline"
                                >
                                    Mulai percakapan pertama
                                </Link>
                            </div>
                        )}
                    </section>
                </div>

                {/* Kolom samping: aktivitas & notifikasi */}
                <div className="space-y-6">
                    <section className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <div className="mb-4 border-b border-border-soft pb-4">
                            <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Aktivitas Terbaru</h2>
                        </div>
                        <ol className="space-y-3 text-xs">
                            {promoPurchases.slice(0, 3).map((purchase) => (
                                <li key={`promo-${purchase.id}`} className="border-l-2 border-border-soft pl-3">
                                    <p className="font-semibold text-navy">
                                        Promo ditetapkan: {purchase.promo?.title ?? 'Promo'}
                                    </p>
                                    <p className="mt-0.5 text-body-text/70">
                                        {purchase.purchase_date ? fetchFormatDate(purchase.purchase_date) : '—'}
                                    </p>
                                </li>
                            ))}
                            {recentTickets.slice(0, 2).map((ticket) => (
                                <li key={`ticket-${ticket.id}`} className="border-l-2 border-border-soft pl-3">
                                    <p className="font-semibold text-navy">Percakapan update: {ticket.title}</p>
                                    <p className="mt-0.5 text-body-text/70">{fetchFormatDate(ticket.created_at)}</p>
                                </li>
                            ))}
                            {promoPurchases.length === 0 && recentTickets.length === 0 && (
                                <li className="text-body-text/70">Belum ada aktivitas.</li>
                            )}
                        </ol>
                    </section>

                    <section className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <div className="mb-5 flex items-center justify-between border-b border-border-soft pb-4">
                            <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Notifikasi Terbaru</h2>
                            <Link
                                href={route('customer.notifications.index')}
                                className="text-xs font-semibold text-tech-blue hover:underline"
                            >
                                Semua
                            </Link>
                        </div>
                        {recentNotifications.length > 0 ? (
                            <ul className="space-y-3">
                                {recentNotifications.slice(0, 4).map((notification) => (
                                    <li
                                        key={notification.id}
                                        className={`rounded-lg border p-3 ${
                                            notification.is_read
                                                ? 'border-border-soft bg-white'
                                                : 'border-tech-blue/30 bg-electric-light/30'
                                        }`}
                                    >
                                        <p className="mb-1 text-xs font-semibold text-navy">{notification.title}</p>
                                        <p className="line-clamp-2 text-xs text-body-text">{notification.message}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="py-6 text-center text-xs text-body-text/70">Belum ada notifikasi.</p>
                        )}
                    </section>
                </div>
            </div>
        </CustomerLayout>
    );
}
