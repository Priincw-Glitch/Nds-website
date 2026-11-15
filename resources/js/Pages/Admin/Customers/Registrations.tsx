import { Head, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import { UserCheck, UserX, X, Inbox } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

interface RegistrationRow {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
    notes: string | null;
    status: string;
    rejection_reason: string | null;
    created_at: string;
    service?: { id: number; name: string } | null;
}

interface Props {
    registrations: {
        data: RegistrationRow[];
        current_page: number;
        last_page: number;
        links: unknown[];
    };
    filters: { status?: string };
}

const statusBadge: Record<string, string> = {
    pending: 'badge badge-warning',
    approved: 'badge badge-success',
    rejected: 'badge badge-danger',
};

const statusLabel: Record<string, string> = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
};

export default function Registrations({ registrations, filters }: Props) {
    const [rejectTarget, setRejectTarget] = useState<RegistrationRow | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);

    // Satu form digunakan untuk alasan penolakan; approve tidak butuh form.
    const rejectForm = useForm({ rejection_reason: '' });

    const filterByStatus = (status: string) => {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        router.get(
            `${route('admin.customers.registrations')}${params.toString() ? '?' + params.toString() : ''}`,
            {},
            { preserveState: true },
        );
    };

    const approve = (registration: RegistrationRow) => {
        setBusyId(registration.id);
        router.post(
            route('admin.customers.registrations.approve', registration.id),
            {},
            { preserveScroll: true, onFinish: () => setBusyId(null) },
        );
    };

    const submitReject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectTarget) return;
        rejectForm.post(route('admin.customers.registrations.reject', rejectTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                setRejectTarget(null);
                rejectForm.reset();
            },
        });
    };

    return (
        <AdminLayout title="Pendaftaran Baru">
            <Head title="Pendaftaran Baru | NDS Admin" />

            <div className="mb-6">
                <h1 className="text-xl font-bold text-navy sm:text-2xl">Pendaftaran Pelanggan</h1>
                <p className="mt-1 text-xs text-body-text">
                    Permintaan pendaftaran yang masuk. Menyetujui pendaftaran membuat akun pelanggan aktif dengan password
                    sementara.
                </p>
            </div>

            {/* Filter status */}
            <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter status pendaftaran">
                {[
                    { value: '', label: 'Semua' },
                    { value: 'pending', label: 'Menunggu' },
                    { value: 'approved', label: 'Disetujui' },
                    { value: 'rejected', label: 'Ditolak' },
                ].map((f) => (
                    <button
                        key={f.label}
                        type="button"
                        onClick={() => filterByStatus(f.value)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                            (filters.status ?? '') === f.value
                                ? 'bg-navy text-white'
                                : 'border border-border-soft bg-white text-navy hover:bg-navy/5'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="rounded-2xl border border-border-soft bg-white shadow-subtle">
                {registrations.data.length > 0 ? (
                    <ul className="divide-y divide-border-soft">
                        {registrations.data.map((registration) => (
                            <li key={registration.id} className="px-5 py-4">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold text-navy">{registration.name}</p>
                                            <span className={statusBadge[registration.status] || 'badge badge-neutral'}>
                                                {statusLabel[registration.status] ?? registration.status}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-body-text">
                                            {registration.email} · {registration.phone}
                                            {registration.service ? ` · ${registration.service.name}` : ''}
                                        </p>
                                        {(registration.address || registration.city) && (
                                            <p className="mt-0.5 text-xs text-body-text/70">
                                                {[registration.address, registration.city, registration.province]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                            </p>
                                        )}
                                        {registration.notes && (
                                            <p className="mt-1 rounded-md bg-light-gray/60 px-2.5 py-1.5 text-xs text-body-dark">
                                                {registration.notes}
                                            </p>
                                        )}
                                        {registration.status === 'rejected' && registration.rejection_reason && (
                                            <p className="mt-1 rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-900">
                                                Alasan penolakan: {registration.rejection_reason}
                                            </p>
                                        )}
                                        <p className="mt-1 text-[11px] text-body-text/60">
                                            Diajukan{' '}
                                            {new Date(registration.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>

                                    {registration.status === 'pending' && (
                                        <div className="flex shrink-0 items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => approve(registration)}
                                                disabled={busyId === registration.id}
                                                className="btn-primary text-xs"
                                            >
                                                <UserCheck className="h-3.5 w-3.5" />
                                                <span>{busyId === registration.id ? 'Memproses...' : 'Setujui'}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setRejectTarget(registration);
                                                    rejectForm.reset();
                                                }}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-500/10"
                                            >
                                                <UserX className="h-3.5 w-3.5" />
                                                <span>Tolak</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="px-6 py-16 text-center">
                        <Inbox className="mx-auto mb-3 h-10 w-10 text-body-text/30" />
                        <p className="text-sm font-semibold text-navy">
                            {filters.status ? 'Tidak ada pendaftaran dengan status ini.' : 'Belum ada pendaftaran masuk.'}
                        </p>
                        <p className="mt-1 text-xs text-body-text">
                            Pendaftaran melalui halaman website akan muncul di sini.
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {registrations.last_page > 1 && (
                <nav className="mt-4 flex flex-wrap items-center gap-1.5" aria-label="Halaman">
                    <span className="mr-2 text-xs text-body-text">
                        Halaman {registrations.current_page} dari {registrations.last_page}
                    </span>
                    {(registrations.links as Array<{ url: string | null; label: string; active: boolean }>)
                        .filter((l) => l.url)
                        .map((l, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => window.location.assign(l.url as string)}
                                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    l.active
                                        ? 'border-navy bg-navy text-white'
                                        : 'border-border-soft bg-white text-navy hover:bg-navy/5'
                                }`}
                                dangerouslySetInnerHTML={{ __html: l.label }}
                            />
                        ))}
                </nav>
            )}

            {/* Modal alasan penolakan */}
            {rejectTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-navy/60 p-4 backdrop-blur-xs sm:items-center"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reject-title"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setRejectTarget(null);
                    }}
                >
                    <form
                        onSubmit={submitReject}
                        className="w-full max-w-md rounded-2xl border border-border-soft bg-white p-6 shadow-lg"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 id="reject-title" className="text-sm font-bold text-navy">
                                Tolak Pendaftaran {rejectTarget.name}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setRejectTarget(null)}
                                className="rounded-md p-1.5 text-body-text hover:bg-navy/5"
                                aria-label="Tutup dialog"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <label htmlFor="rejection_reason" className="label">
                            Alasan Penolakan *
                        </label>
                        <textarea
                            id="rejection_reason"
                            value={rejectForm.data.rejection_reason}
                            onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                            className="input min-h-24"
                            placeholder="Dikirim ke pemohon sebagai penjelasan"
                            required
                        />
                        {rejectForm.errors.rejection_reason && (
                            <p className="form-error">{rejectForm.errors.rejection_reason}</p>
                        )}
                        <div className="mt-5 flex gap-2">
                            <button type="submit" disabled={rejectForm.processing} className="btn-danger flex-1 text-xs">
                                {rejectForm.processing ? 'Menyimpan...' : 'Tolak Pendaftaran'}
                            </button>
                            <button type="button" onClick={() => setRejectTarget(null)} className="btn-secondary flex-1 text-xs">
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}
