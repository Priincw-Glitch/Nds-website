import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import { Bell, BellOff, CheckCheck, Megaphone, Wrench, Info } from 'lucide-react';
import CustomerLayout from '@/Layouts/CustomerLayout';

interface NotificationItem {
    id: number;
    type: string;
    title: string;
    message: string;
    data: Record<string, unknown> | null;
    is_read: boolean;
    created_at: string;
}

interface ServiceInMaintenance {
    id: number;
    service_name: string;
    status_label: string;
}

interface Props {
    notifications: {
        data: NotificationItem[];
        current_page: number;
        last_page: number;
    };
}

// Ikon per tipe mengikuti nilai `type` yang dibuat backend, tanpa iklan dekoratif.
const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
    account_activated: CheckCheck,
    service_activated: Wrench,
    service_status_changed: Wrench,
    ticket_reply: Megaphone,
    ticket_status_changed: Info,
    announcement: Megaphone,
    default: Bell,
};

const typeLabel: Record<string, string> = {
    service_activated: 'Aktivasi layanan',
    service_status_changed: 'Perubahan status layanan',
    ticket_reply: 'Pesan baru dari admin',
    ticket_status_changed: 'Pembaruan tiket',
    account_activated: 'Aktivasi akun',
    announcement: 'Pengumuman',
};

export default function Notifications({ notifications }: Props) {
    const items = notifications.data;
    const unread = items.filter((n) => !n.is_read).length;
    const [busy, setBusy] = useState(false);

    const markAsRead = (id: number) => {
        setBusy(true);
        router.patch(route('customer.notifications.read', id), {}, { preserveScroll: true, onFinish: () => setBusy(false) });
    };

    const markAllAsRead = () => {
        setBusy(true);
        router.post(
            route('customer.notifications.read-all'),
            {},
            { preserveScroll: true, onFinish: () => setBusy(false) },
        );
    };

    // Pembaruan daftar cukup saat halaman dibuka atau Inertia melakukan navigasi;
    // tidak ada polling tambahan karena daftar sudah dibaca saat dibuka.

    return (
        <CustomerLayout title="Maintenance & Notifikasi">
            <Head title="Maintenance & Notifikasi | NDS Customer Portal" />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-navy sm:text-2xl">Maintenance & Notifikasi</h1>
                    <p className="mt-1 text-xs text-body-text">
                        Pengumuman layanan dan pembaruan status yang dikirim admin NDS ke akun Anda.
                    </p>
                </div>
                {unread > 0 && (
                    <button type="button" onClick={markAllAsRead} disabled={busy} className="btn-secondary text-xs">
                        <CheckCheck className="h-3.5 w-3.5" />
                        <span>Tandai Semua Dibaca ({unread})</span>
                    </button>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Daftar notifikasi */}
                <div className="lg:col-span-2">
                    <div className="rounded-2xl border border-border-soft bg-white shadow-subtle">
                        {items.length > 0 ? (
                            <ul className="divide-y divide-border-soft">
                                {items.map((n) => {
                                    const Icon = typeIcon[n.type] ?? typeIcon.default;
                                    return (
                                        <li
                                            key={n.id}
                                            className={`px-5 py-4 ${n.is_read ? '' : 'bg-electric-light/20'}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                                        n.is_read ? 'bg-light-gray' : 'bg-electric-light'
                                                    }`}
                                                >
                                                    <Icon className={`h-4 w-4 ${n.is_read ? 'text-body-text' : 'text-tech-blue'}`} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className={`text-sm ${n.is_read ? 'font-medium text-navy' : 'font-semibold text-navy'}`}>
                                                            {n.title}
                                                        </p>
                                                        <span className="text-[11px] text-body-text/70">
                                                            {typeLabel[n.type] ?? 'Notifikasi'}
                                                        </span>
                                                        {!n.is_read && <span className="badge badge-secondary">Belum Dibaca</span>}
                                                    </div>
                                                    <p className="mt-1 text-xs leading-relaxed text-body-text">{n.message}</p>
                                                    <p className="mt-1 text-[11px] text-body-text/60">
                                                        {new Date(n.created_at).toLocaleString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                    {!n.is_read && (
                                                        <button
                                                            type="button"
                                                            onClick={() => markAsRead(n.id)}
                                                            disabled={busy}
                                                            className="mt-2 text-xs font-semibold text-tech-blue hover:underline"
                                                        >
                                                            Tandai sudah dibaca
                                                        </button>
                                                    )}
                                                    {n.data?.ticket_id != null && (
                                                        <Link
                                                            href={route('customer.support.show', Number(n.data.ticket_id))}
                                                            className="ml-3 text-xs font-semibold text-tech-blue hover:underline"
                                                        >
                                                            Lihat percakapan
                                                        </Link>
                                                    )}
                                                    {n.data?.customer_service_id != null && (
                                                        <span className="ml-3 text-xs text-body-text/70">
                                                            Layanan terkait pemeliharaan ini dikelola admin NDS.
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="px-6 py-16 text-center">
                                <BellOff className="mx-auto mb-3 h-10 w-10 text-body-text/30" />
                                <p className="text-sm font-semibold text-navy">Belum ada notifikasi.</p>
                                <p className="mt-1 text-xs text-body-text">
                                    Pengumuman layanan dan balasan admin akan muncul di sini.
                                </p>
                            </div>
                        )}
                    </div>

                    {notifications.last_page > 1 && (
                        <nav className="mt-4 flex flex-wrap items-center gap-1.5" aria-label="Halaman notifikasi">
                            <span className="mr-2 text-xs text-body-text">
                                Halaman {notifications.current_page} dari {notifications.last_page}
                            </span>
                        </nav>
                    )}
                </div>

                {/* Panel samping: status pemeliharaan layanan */}
                <aside>
                    <section className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <h2 className="flex items-center gap-2 border-b border-border-soft pb-3 text-sm font-bold text-navy">
                            <Wrench className="h-4 w-4 text-tech-blue" />
                            Pemeliharaan Layanan
                        </h2>
                        <p className="mt-3 flex items-start gap-2 text-xs text-body-text">
                            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>
                                Pembaruan status layanan dan jadwal pemeliharaan akan dikirim sebagai notifikasi di halaman ini.
                            </span>
                        </p>
                    </section>
                </aside>
            </div>
        </CustomerLayout>
    );
}
