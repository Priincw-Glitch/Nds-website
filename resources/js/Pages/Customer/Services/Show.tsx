import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { ArrowLeft, Calendar, CheckCircle, Clock, AlertTriangle, AlertCircle, Package, MessageSquare } from 'lucide-react';
import CustomerLayout from '@/Layouts/CustomerLayout';

interface RelatedTicket {
    id: number;
    ticket_number: string;
    title: string;
    status: string;
    status_label: string;
    status_color: string;
    created_at: string;
}

interface CustomerServiceDetail {
    id: number;
    service_name: string;
    package_type: string | null;
    status: string;
    status_label: string;
    status_color: string;
    activated_at: string | null;
    expired_at: string | null;
    notes: string | null;
    service: {
        id: number;
        name: string;
        description: string | null;
        category?: { id: number; name: string } | null;
    };
    support_tickets?: RelatedTicket[];
}

interface Props {
    customerService: CustomerServiceDetail;
}

const statusBadge: Record<string, string> = {
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    danger: 'badge badge-danger',
    info: 'badge badge-secondary',
    secondary: 'badge badge-neutral',
};

export default function ServiceShow({ customerService }: Props) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const tickets = customerService.support_tickets ?? [];

    return (
        <CustomerLayout title="Detail Layanan">
            <Head title={`${customerService.service_name} | NDS Customer Portal`} />

            <div className="mb-6">
                <Link
                    href={route('customer.services.index')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-tech-blue hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Layanan Saya
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Informasi utama */}
                <div className="space-y-6 lg:col-span-2">
                    <section className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle sm:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-soft pb-5">
                            <div>
                                <p className="text-xs text-body-text">
                                    {customerService.service.category
                                        ? customerService.service.category.name
                                        : 'Layanan'}
                                </p>
                                <h1 className="mt-1 text-xl font-bold text-navy sm:text-2xl">
                                    {customerService.service_name}
                                </h1>
                                {customerService.package_type && (
                                    <p className="mt-1 text-xs text-body-text">
                                        Paket: <span className="font-semibold text-navy">{customerService.package_type}</span>
                                    </p>
                                )}
                            </div>
                            <span className={statusBadge[customerService.status_color] || statusBadge.secondary}>
                                {customerService.status === 'active' && <CheckCircle className="h-3 w-3" />}
                                {customerService.status === 'maintenance' && <AlertTriangle className="h-3 w-3" />}
                                {(customerService.status === 'suspended' || customerService.status === 'expired') && (
                                    <AlertCircle className="h-3 w-3" />
                                )}
                                {customerService.status_label}
                            </span>
                        </div>

                        {customerService.service.description && (
                            <div className="mt-5">
                                <p className="text-xs font-medium text-body-text">Deskripsi</p>
                                <p className="mt-1 text-sm leading-relaxed text-body-dark">{customerService.service.description}</p>
                            </div>
                        )}

                        {customerService.notes && (
                            <div className="mt-5 rounded-xl border border-border-soft bg-light-gray/70 p-4">
                                <p className="text-xs font-medium text-body-text">Catatan Layanan</p>
                                <p className="mt-1 whitespace-pre-line text-sm text-body-dark">{customerService.notes}</p>
                            </div>
                        )}

                        {/* Jadwal */}
                        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-border-soft pt-5 sm:grid-cols-2">
                            <div>
                                <dt className="flex items-center gap-1.5 text-xs text-body-text">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Tanggal Mulai
                                </dt>
                                <dd className="mt-1 text-sm font-semibold text-navy">{formatDate(customerService.activated_at)}</dd>
                            </div>
                            <div>
                                <dt className="flex items-center gap-1.5 text-xs text-body-text">
                                    <Clock className="h-3.5 w-3.5" />
                                    Berlaku Hingga
                                </dt>
                                <dd className="mt-1 text-sm font-semibold text-navy">{formatDate(customerService.expired_at)}</dd>
                            </div>
                        </dl>
                    </section>

                    {/* Tiket terkait layanan ini */}
                    <section className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <div className="mb-5 flex items-center justify-between border-b border-border-soft pb-4">
                            <h2 className="text-sm font-bold text-navy uppercase tracking-wide">Pesan Terkait Layanan Ini</h2>
                            <Link
                                href={route('customer.support.index', { new: 1 })}
                                className="text-xs font-semibold text-tech-blue hover:underline"
                            >
                                Kirim pesan baru
                            </Link>
                        </div>
                        {tickets.length > 0 ? (
                            <ul className="space-y-3">
                                {tickets.map((ticket) => (
                                    <li key={ticket.id}>
                                        <Link
                                            href={route('customer.support.show', ticket.id)}
                                            className="flex items-center justify-between gap-3 rounded-lg border border-border-soft px-4 py-3 transition-colors hover:border-tech-blue/40 hover:bg-electric-light/20"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-navy">{ticket.title}</p>
                                                <p className="font-mono text-xs text-body-text">{ticket.ticket_number}</p>
                                            </div>
                                            <span className={statusBadge[ticket.status_color] || statusBadge.secondary}>
                                                {ticket.status_label}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="py-6 text-center text-xs text-body-text/70">
                                Belum ada pesan terkait layanan ini.
                            </p>
                        )}
                    </section>
                </div>

                {/* Panel samping */}
                <aside className="space-y-6">
                    <section className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <h3 className="border-b border-border-soft pb-3 text-sm font-bold text-navy">Perlu Bantuan?</h3>
                        <p className="mt-3 text-xs text-body-text">
                            Untuk pertanyaan teknis, perubahan, atau gangguan pada layanan ini, kirim pesan ke tim NDS melalui
                            menu Pesan.
                        </p>
                        <Link
                            href={route('customer.support.index', { new: 1 })}
                            className="btn-primary mt-4 w-full text-xs"
                        >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Kirim Pesan</span>
                        </Link>
                    </section>

                    <section className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <h3 className="border-b border-border-soft pb-3 text-sm font-bold text-navy">Status Akun Layanan</h3>
                        <p className="mt-3 flex items-start gap-2 text-xs text-body-text">
                            <Package className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>
                                Status dan konfigurasi layanan dikelola oleh admin NDS. Perubahan paket atau penghapusan layanan
                                dilakukan melalui tim NDS.
                            </span>
                        </p>
                    </section>
                </aside>
            </div>
        </CustomerLayout>
    );
}
