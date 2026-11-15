import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import { Plus, Search, Wrench } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { DeleteButton } from '@/Components/admin/DeleteButton';

interface CustomerRow {
    id: number;
    name: string;
    email: string;
}

interface ServiceRow {
    id: number;
    name: string;
}

interface CustomerServiceRow {
    id: number;
    user_id: number;
    service_id: number;
    service_name: string;
    package_type: string | null;
    status: string;
    status_label: string;
    status_color: string;
    activated_at: string | null;
    expired_at: string | null;
    user?: CustomerRow | null;
}

interface Props {
    customerServices: {
        data: CustomerServiceRow[];
        current_page: number;
        last_page: number;
        links: unknown[];
    };
    customers: CustomerRow[];
    services: ServiceRow[];
    filters: { customer_id?: string; service_id?: string; status?: string; search?: string };
}

const statusBadge: Record<string, string> = {
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    danger: 'badge badge-danger',
    info: 'badge badge-secondary',
    secondary: 'badge badge-neutral',
};

const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'waiting_activation', label: 'Menunggu Aktivasi' },
    { value: 'active', label: 'Aktif' },
    { value: 'maintenance', label: 'Pemeliharaan' },
    { value: 'suspended', label: 'Ditangguhkan' },
    { value: 'expired', label: 'Kedaluwarsa' },
];

export default function CustomerServicesIndex({ customerServices, customers, services, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilter = (key: string, value: string) => {
        const params = new URLSearchParams();
        const merged: Record<string, string> = {
            ...filters,
            [key]: value,
            search: key === 'search' ? value : search,
        };
        Object.entries(merged).forEach(([k, v]) => {
            if (k === 'search') v = search;
            if (v) params.set(k, v);
        });
        router.get(
            `${route('admin.customer-services.index')}${params.toString() ? '?' + params.toString() : ''}`,
            {},
            { preserveState: true },
        );
    };

    const formatDate = (d: string | null) =>
        d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

    return (
        <AdminLayout title="Layanan Pelanggan">
            <Head title="Layanan Pelanggan | NDS Admin" />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-navy sm:text-2xl">Layanan Pelanggan</h1>
                    <p className="mt-1 text-xs text-body-text">
                        Menetapkan layanan NDS ke akun pelanggan beserta statusnya; pelanggan melihat informasi ini di panel
                        mereka.
                    </p>
                </div>
                <Link href={route('admin.customer-services.create')} className="btn-primary text-xs">
                    <Plus className="h-4 w-4" />
                    <span>Tetapkan Layanan</span>
                </Link>
            </div>

            {/* Filter bar */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    applyFilter('search', search);
                }}
                className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
                role="search"
            >
                <div>
                    <label className="sr-only" htmlFor="filter-customer">
                        Filter pelanggan
                    </label>
                    <select
                        id="filter-customer"
                        value={filters.customer_id ?? ''}
                        onChange={(e) => applyFilter('customer_id', e.target.value)}
                        className="input text-xs"
                    >
                        <option value="">Semua Pelanggan</option>
                        {customers.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="sr-only" htmlFor="filter-service">
                        Filter layanan katalog
                    </label>
                    <select
                        id="filter-service"
                        value={filters.service_id ?? ''}
                        onChange={(e) => applyFilter('service_id', e.target.value)}
                        className="input text-xs"
                    >
                        <option value="">Semua Layanan</option>
                        {services.map((s) => (
                            <option key={s.id} value={String(s.id)}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="sr-only" htmlFor="filter-status">
                        Filter status
                    </label>
                    <select
                        id="filter-status"
                        value={filters.status ?? ''}
                        onChange={(e) => applyFilter('status', e.target.value)}
                        className="input text-xs"
                    >
                        {statusOptions.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body-text" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari pelanggan"
                            aria-label="Cari berdasarkan pelanggan"
                            className="input pl-9 text-xs"
                        />
                    </div>
                    <button type="submit" className="btn-secondary shrink-0 text-xs">
                        Cari
                    </button>
                </div>
            </form>

            {/* Tabel */}
            <div className="table-wrapper">
                <table className="table-modern">
                    <thead>
                        <tr>
                            <th>Pelanggan</th>
                            <th>Layanan</th>
                            <th>Paket</th>
                            <th>Status</th>
                            <th>Aktif s.d. Kedaluwarsa</th>
                            <th className="text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customerServices.data.length > 0 ? (
                            customerServices.data.map((cs) => (
                                <tr key={cs.id}>
                                    <td>
                                        <Link
                                            href={route('admin.customers.show', cs.user_id)}
                                            className="font-semibold text-navy hover:text-tech-blue"
                                        >
                                            {cs.user?.name ?? `Pelanggan #${cs.user_id}`}
                                        </Link>
                                        {cs.user && <p className="text-xs text-body-text">{cs.user.email}</p>}
                                    </td>
                                    <td className="font-medium text-navy">{cs.service_name}</td>
                                    <td className="text-xs text-body-text">{cs.package_type || '-'}</td>
                                    <td>
                                        <span className={statusBadge[cs.status_color] || statusBadge.secondary}>
                                            {cs.status_label}
                                        </span>
                                    </td>
                                    <td className="text-xs text-body-text">
                                        {formatDate(cs.activated_at)} s.d. {formatDate(cs.expired_at)}
                                    </td>
                                    <td className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={route('admin.customer-services.edit', cs.id)}
                                                className="text-xs font-semibold text-tech-blue hover:underline"
                                            >
                                                Edit
                                            </Link>
                                            <DeleteButton action={route('admin.customer-services.destroy', cs.id)} label={`layanan ${cs.service_name}`} />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6}>
                                    <div className="py-14 text-center">
                                        <Wrench className="mx-auto mb-3 h-10 w-10 text-body-text/30" />
                                        <p className="text-sm font-semibold text-navy">Belum ada layanan pelanggan.</p>
                                        <p className="mt-1 text-xs text-body-text">
                                            Tetapkan layanan kepada pelanggan melalui tombol di atas.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {customerServices.last_page > 1 && (
                <nav className="mt-4 flex flex-wrap items-center gap-1.5" aria-label="Halaman">
                    <span className="mr-2 text-xs text-body-text">
                        Halaman {customerServices.current_page} dari {customerServices.last_page}
                    </span>
                    {(customerServices.links as Array<{ url: string | null; label: string; active: boolean }>)
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
        </AdminLayout>
    );
}
