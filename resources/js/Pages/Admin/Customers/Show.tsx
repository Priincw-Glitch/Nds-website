import { Head, Link, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { ArrowLeft, Save, Wrench, Activity, User, Tag, UserPlus, KeyRound } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { DeleteButton } from '@/Components/admin/DeleteButton';
import { formatRupiah } from '@/Components/PromoCard';
import { storageUrl } from '@/utils/assets';

interface CustomerProfileInfo {
    address: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
    notes: string | null;
}

interface PurchaseRow {
    id: number;
    promo: {
        id: number;
        title: string;
        image: string | null;
        description: string | null;
        category: { id: number; name: string } | null;
        discount_type: string;
        original_price: number | null;
        discount_percentage: number | null;
        discount_amount: number | null;
        final_price: number | null;
    } | null;
    purchase_date: string | null;
    status: 'pending' | 'paid' | 'cancelled';
    notes: string | null;
}

interface Props {
    customer: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        role: string;
        status: string;
        created_at: string;
        customer_profile?: (CustomerProfileInfo & { customer_code?: string | null }) | null;
        customer_services?: Array<{
            id: number;
            service_name: string;
            package_type: string | null;
            status: string;
            status_label: string;
            status_color: string;
        }>;
        activity_logs?: Array<{
            id: number;
            action: string;
            description: string;
            created_at: string;
        }>;
    };
    purchases: PurchaseRow[];
}

const statusBadge: Record<string, string> = {
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    danger: 'badge badge-danger',
    info: 'badge badge-secondary',
    secondary: 'badge badge-neutral',
};

const accountStatusBadge: Record<string, string> = {
    active: 'badge badge-success',
    pending: 'badge badge-warning',
    suspended: 'badge badge-danger',
    inactive: 'badge badge-neutral',
};

export default function CustomerShow({ customer, purchases = [] }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: customer.name,
        phone: customer.phone ?? '',
        status: customer.status,
        address: customer.customer_profile?.address ?? '',
        city: customer.customer_profile?.city ?? '',
        province: customer.customer_profile?.province ?? '',
        postal_code: customer.customer_profile?.postal_code ?? '',
    });

    const customerId = `USER${String(customer.id).padStart(3, '0')}`;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.customers.update', customer.id), { preserveScroll: true });
    };

    return (
        <AdminLayout title={`Pelanggan: ${customer.name}`}>
            <Head title={`Pelanggan ${customerId} | NDS Admin`} />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <Link
                    href={route('admin.customers.index')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-tech-blue hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Data Pelanggan
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Tautan reset sekali pakai: kata sandi tidak pernah ditampilkan ke admin. */}
                    <button
                        type="button"
                        onClick={() => router.post(route('admin.customers.password-link', customer.id), {}, { preserveScroll: true })}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border-soft bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5"
                    >
                        <KeyRound className="h-3.5 w-3.5" />
                        Kirim Tautan Kata Sandi
                    </button>
                    <Link
                        href={route('admin.customers.create')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border-soft bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5"
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        Buat Customer Baru
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Identitas + edit */}
                <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle sm:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-soft pb-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-electric-light">
                                    <User className="h-5 w-5 text-tech-blue" />
                                </div>
                                <div>
                                    <p className="font-mono text-xs font-semibold text-navy">{customer.customer_profile?.customer_code ?? customerId}</p>
                                    <h1 className="text-xl font-bold text-navy sm:text-2xl">{customer.name}</h1>
                                    <p className="text-xs text-body-text">{customer.email}</p>
                                </div>
                            </div>
                            <span className={accountStatusBadge[customer.status] || accountStatusBadge.inactive}>
                                {customer.status}
                            </span>
                        </div>

                        <form onSubmit={submit} className="mt-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="label">Nama Lengkap *</label>
                                    <input
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="input"
                                        required
                                    />
                                    {errors.name && <p className="form-error">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="label">Nomor Telepon *</label>
                                    <input
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="input"
                                        required
                                    />
                                    {errors.phone && <p className="form-error">{errors.phone}</p>}
                                </div>
                                <div>
                                    <label className="label">Status Akun *</label>
                                    <select value={data.status} onChange={(e) => setData('status', e.target.value)} className="input">
                                        <option value="active">Aktif</option>
                                        <option value="pending">Menunggu Persetujuan</option>
                                        <option value="suspended">Ditangguhkan</option>
                                        <option value="inactive">Nonaktif</option>
                                    </select>
                                    {errors.status && <p className="form-error">{errors.status}</p>}
                                    <p className="form-hint">
                                        Akun non-aktif ditolak saat login pelanggan dengan pesan dari sistem.
                                    </p>
                                </div>
                                <div>
                                    <label className="label">Email (terkelola)</label>
                                    <input value={customer.email} className="input bg-light-gray/60" disabled />
                                    <p className="form-hint">Email login tidak diubah dari panel ini.</p>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="label">Kota</label>
                                    <input value={data.city} onChange={(e) => setData('city', e.target.value)} className="input" />
                                </div>
                                <div>
                                    <label className="label">Provinsi</label>
                                    <input
                                        value={data.province}
                                        onChange={(e) => setData('province', e.target.value)}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">Kode Pos</label>
                                    <input
                                        value={data.postal_code}
                                        onChange={(e) => setData('postal_code', e.target.value)}
                                        className="input"
                                    />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="label">Alamat Lengkap</label>
                                <textarea
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    className="input min-h-20"
                                />
                            </div>

                            <button type="submit" disabled={processing} className="btn-primary mt-5 text-xs">
                                <Save className="h-3.5 w-3.5" />
                                <span>{processing ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                            </button>
                        </form>
                    </div>

                    {/* Promo yang dibeli pelanggan (ditetapkan Admin) */}
                    <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <h2 className="mb-4 flex items-center gap-2 border-b border-border-soft pb-3 text-sm font-bold uppercase tracking-wide text-navy">
                            <Tag className="h-4 w-4 text-tech-blue" />
                            Promo yang Dibeli
                        </h2>
                        {purchases.length === 0 ? (
                            <p className="py-6 text-center text-xs text-body-text/70">
                                Belum ada pembelian promo untuk pelanggan ini.
                            </p>
                        ) : (
                            <ul className="divide-y divide-border-soft">
                                {purchases.map((purchase) => (
                                    <li key={purchase.id} className="flex flex-wrap items-start gap-3 py-3">
                                        {purchase.promo?.image && (
                                            <img
                                                src={storageUrl(purchase.promo.image)}
                                                alt=""
                                                className="h-12 w-16 shrink-0 rounded-lg border border-border-soft object-cover"
                                                loading="lazy"
                                            />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-navy">
                                                {purchase.promo?.title ?? 'Promo'}
                                            </p>
                                            <p className="text-xs text-body-text">
                                                {purchase.promo?.category?.name ?? 'Tanpa kategori'}
                                                {' · '}
                                                dibeli {purchase.purchase_date ?? '—'}
                                            </p>
                                            {purchase.notes && (
                                                <p className="mt-1 text-[11px] text-body-text/80">{purchase.notes}</p>
                                            )}
                                        </div>
                                        <div className="shrink-0 text-right">
                                            {purchase.promo && (
                                                <p className="text-sm font-bold text-navy">
                                                    {purchase.promo.final_price !== null
                                                        ? formatRupiah(purchase.promo.final_price)
                                                        : ''}
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
                                                      ? 'Menunggu Pembayaran'
                                                      : 'Dibatalkan'}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Layanan milik pelanggan */}
                    <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border-soft pb-4">
                            <h2 className="flex items-center gap-2 text-sm font-bold text-navy uppercase tracking-wide">
                                <Wrench className="h-4 w-4 text-tech-blue" />
                                Layanan Pelanggan
                            </h2>
                            <Link
                                href={`${route('admin.customer-services.index')}?customer_id=${customer.id}`}
                                className="text-xs font-semibold text-tech-blue hover:underline"
                            >
                                Kelola di Layanan Pelanggan
                            </Link>
                        </div>
                        {(customer.customer_services ?? []).length > 0 ? (
                            <ul className="divide-y divide-border-soft">
                                {(customer.customer_services ?? []).map((cs) => (
                                    <li key={cs.id} className="flex items-center justify-between gap-3 py-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-navy">{cs.service_name}</p>
                                            {cs.package_type && <p className="text-xs text-body-text">{cs.package_type}</p>}
                                        </div>
                                        <span className={statusBadge[cs.status_color] || statusBadge.secondary}>
                                            {cs.status_label}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="py-6 text-center text-xs text-body-text/70">
                                Belum ada layanan yang ditetapkan untuk pelanggan ini.
                            </p>
                        )}
                    </div>
                </div>

                {/* Log aktivitas + aksi berbahaya */}
                <aside className="space-y-6">
                    <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <h3 className="flex items-center gap-2 border-b border-border-soft pb-3 text-sm font-bold text-navy">
                            <Activity className="h-4 w-4 text-tech-blue" />
                            Riwayat Aktivitas
                        </h3>
                        {(customer.activity_logs ?? []).length > 0 ? (
                            <ol className="mt-4 space-y-3">
                                {(customer.activity_logs ?? []).map((log) => (
                                    <li key={log.id} className="border-l-2 border-border-soft pl-3">
                                        <p className="text-xs font-semibold text-navy">{log.description}</p>
                                        <p className="mt-0.5 text-[11px] text-body-text/70">
                                            {log.action} ·{' '}
                                            {new Date(log.created_at).toLocaleString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="mt-3 text-xs text-body-text/70">Belum ada aktivitas tercatat.</p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <h3 className="border-b border-border-soft pb-3 text-sm font-bold text-navy">Zona Berbahaya</h3>
                        <p className="mt-3 text-xs text-body-text">
                            Menghapus pelanggan juga menghapus profil dan relasi layanannya dari sistem.
                        </p>
                        <div className="mt-4">
                            <DeleteButton action={route('admin.customers.destroy', customer.id)} label={`pelanggan ${customer.name}`} />
                        </div>
                    </div>
                </aside>
            </div>
        </AdminLayout>
    );
}
