import { Head, Link, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Plus, Search, X, Eye, Users, UserPlus } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { DeleteButton } from '@/Components/admin/DeleteButton';

interface CustomerRow {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    created_at: string;
    customer_profile?: { city: string | null; province: string | null } | null;
}

interface Props {
    customers: {
        data: CustomerRow[];
        current_page: number;
        last_page: number;
        links: unknown[];
    };
    filters: { search?: string; status?: string };
}

const statusBadge: Record<string, string> = {
    active: 'badge badge-success',
    pending: 'badge badge-warning',
    suspended: 'badge badge-danger',
    inactive: 'badge badge-neutral',
};

export default function CustomersIndex({ customers, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [showCreate, setShowCreate] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        status: 'active',
        address: '',
        city: '',
        province: '',
        postal_code: '',
    });

    const applyFilter = (newSearch: string) => {
        const params = new URLSearchParams();
        if (newSearch) params.set('search', newSearch);
        if (filters.status) params.set('status', filters.status);
        router.get(
            `${route('admin.customers.index')}${params.toString() ? '?' + params.toString() : ''}`,
            {},
            { preserveState: true },
        );
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.customers.store'), {
            onSuccess: () => {
                setShowCreate(false);
                setData('name', '');
                setData('email', '');
                setData('phone', '');
                setData('address', '');
                setData('city', '');
                setData('province', '');
                setData('postal_code', '');
            },
        });
    };

    return (
        <AdminLayout title="Data Pelanggan">
            <Head title="Data Pelanggan | NDS Admin" />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-navy sm:text-2xl">Data Pelanggan</h1>
                    <p className="mt-1 text-xs text-body-text">
                        Akun pelanggan dibuat dan dikelola dari Admin Panel; pelanggan login melalui portal NDS.
                    </p>
                </div>
                <button type="button" onClick={() => setShowCreate((v) => !v)} className="btn-secondary text-xs">
                    <Plus className="h-4 w-4" />
                    <span>Akun Tanpa Promo</span>
                </button>
                <Link href={route('admin.customers.create')} className="btn-primary text-xs">
                    <UserPlus className="h-4 w-4" />
                    <span>Buat Akun + Promo</span>
                </Link>
            </div>

            {/* Form pembuatan akun */}
            {showCreate && (
                <form onSubmit={submitCreate} className="mb-6 rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                    <div className="mb-5 flex items-center justify-between border-b border-border-soft pb-4">
                        <h2 className="text-sm font-bold text-navy uppercase tracking-wide">Akun Pelanggan Baru</h2>
                        <button
                            type="button"
                            onClick={() => setShowCreate(false)}
                            className="rounded-md p-1.5 text-body-text hover:bg-navy/5"
                            aria-label="Tutup form"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="label">Nama Lengkap *</label>
                            <input value={data.name} onChange={(e) => setData('name', e.target.value)} className="input" required />
                            {errors.name && <p className="form-error">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="label">Email Aktif *</label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="input"
                                required
                            />
                            {errors.email && <p className="form-error">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="label">Nomor Telepon *</label>
                            <input value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="input" required />
                            {errors.phone && <p className="form-error">{errors.phone}</p>}
                        </div>
                        <div>
                            <label className="label">Status Akun *</label>
                            <select value={data.status} onChange={(e) => setData('status', e.target.value)} className="input">
                                <option value="active">Aktif (bisa langsung login)</option>
                                <option value="pending">Menunggu Persetujuan</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="label">Alamat Lengkap</label>
                            <textarea value={data.address} onChange={(e) => setData('address', e.target.value)} className="input min-h-20" />
                        </div>
                        <div>
                            <label className="label">Kota</label>
                            <input value={data.city} onChange={(e) => setData('city', e.target.value)} className="input" />
                        </div>
                        <div>
                            <label className="label">Provinsi</label>
                            <input value={data.province} onChange={(e) => setData('province', e.target.value)} className="input" />
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-body-text">
                        Pelanggan membuat kata sandinya sendiri lewat tautan reset sekali pakai yang dikirim ke email
                        setelah akun tersimpan.
                    </p>
                    <div className="mt-4 flex gap-2">
                        <button type="submit" disabled={processing} className="btn-primary text-xs">
                            Simpan Akun
                        </button>
                        <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost">
                            Batal
                        </button>
                    </div>
                </form>
            )}

            {/* Filter pencarian */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    applyFilter(search);
                }}
                className="mb-4 flex gap-2"
                role="search"
            >
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body-text" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama, email, atau telepon"
                        aria-label="Cari pelanggan"
                        className="input w-64 pl-9 py-2 text-xs"
                    />
                </div>
                <button type="submit" className="btn-secondary text-xs">
                    Cari
                </button>
            </form>

            {/* Tabel pelanggan */}
            <div className="table-wrapper">
                <table className="table-modern">
                    <thead>
                        <tr>
                            <th>Customer ID</th>
                            <th>Nama & Email</th>
                            <th>Telepon</th>
                            <th>Domisili</th>
                            <th>Status</th>
                            <th className="text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.data.length > 0 ? (
                            customers.data.map((customer) => (
                                <tr key={customer.id}>
                                    <td className="font-mono text-xs font-semibold text-navy">
                                        {`USER${String(customer.id).padStart(3, '0')}`}
                                    </td>
                                    <td>
                                        <p className="font-semibold text-navy">{customer.name}</p>
                                        <p className="text-xs text-body-text">{customer.email}</p>
                                    </td>
                                    <td>{customer.phone || '-'}</td>
                                    <td>
                                        {customer.customer_profile
                                            ? [customer.customer_profile.city, customer.customer_profile.province]
                                                  .filter(Boolean)
                                                  .join(', ') || '-'
                                            : '-'}
                                    </td>
                                    <td>
                                        <span className={statusBadge[customer.status] || statusBadge.inactive}>{customer.status}</span>
                                    </td>
                                    <td className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={route('admin.customers.show', customer.id)}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-tech-blue hover:underline"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                Detail
                                            </Link>
                                            <DeleteButton
                                                action={route('admin.customers.destroy', customer.id)}
                                                label={`pelanggan ${customer.name}`}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6}>
                                    <div className="py-14 text-center">
                                        {filters.search ? (
                                            <>
                                                <Search className="mx-auto mb-3 h-10 w-10 text-body-text/30" />
                                                <p className="text-sm font-semibold text-navy">Tidak ada pelanggan yang cocok.</p>
                                                <p className="mt-1 text-xs text-body-text">Coba kata kunci lain.</p>
                                            </>
                                        ) : (
                                            <>
                                                <Users className="mx-auto mb-3 h-10 w-10 text-body-text/30" />
                                                <p className="text-sm font-semibold text-navy">Belum ada pelanggan.</p>
                                                <p className="mt-1 text-xs text-body-text">
                                                    Buat akun pelanggan pertama melalui tombol di atas.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {customers.last_page > 1 && (
                <nav className="mt-4 flex flex-wrap items-center gap-1.5" aria-label="Halaman">
                    <span className="mr-2 text-xs text-body-text">
                        Halaman {customers.current_page} dari {customers.last_page}
                    </span>
                    {(customers.links as Array<{ url: string | null; label: string; active: boolean }>)
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
