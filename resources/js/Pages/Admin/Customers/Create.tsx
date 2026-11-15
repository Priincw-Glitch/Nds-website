import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useMemo, useState } from 'react';
import { UserPlus, Tag, Check } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

interface PromoOption {
    id: number;
    title: string;
    service_category_id: number | null;
    category?: { id: number; name: string } | null;
    discount_type: string;
    original_price: number | null;
    discount_percentage: number | null;
    discount_amount: number | null;
    final_price: number | null;
}

interface Props {
    promos: PromoOption[];
    nextCustomerCode: string;
}

const formatRupiah = (value?: number | null): string => {
    if (value === undefined || value === null || isNaN(value)) return '';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

/** Ringkasan harga promo untuk daftar pilihan, konsisten dengan PromoCard. */
const priceLabel = (promo: PromoOption): string | null => {
    const orig = promo.original_price ?? null;
    const promoPrice =
        promo.final_price ??
        (promo.discount_type === 'percentage' && promo.discount_percentage && orig
            ? Math.round(orig * (1 - promo.discount_percentage / 100))
            : promo.discount_type === 'fixed' && promo.discount_amount && orig
              ? orig - promo.discount_amount
              : null);
    if (promoPrice !== null && orig !== null) {
        return `${formatRupiah(promoPrice)} ${orig > promoPrice ? ` (normal ${formatRupiah(orig)})` : ''}`;
    }
    return promoPrice !== null ? formatRupiah(promoPrice) : null;
};

export default function CustomerCreate({ promos, nextCustomerCode }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        province: '',
        postal_code: '',
        status: 'active',
        // Informasi pembelian promo (opsional)
        promo_id: '' as string,
        purchase_date: new Date().toISOString().slice(0, 10),
        purchase_status: 'pending',
        purchase_notes: '',
    });

    const selectedPromo = useMemo(
        () => promos.find((p) => String(p.id) === data.promo_id) ?? null,
        [promos, data.promo_id],
    );

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.customers.store'));
    };

    return (
        <AdminLayout title="Buat Customer Baru">
            <Head title="Buat Customer Baru | NDS Admin" />

            <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
                {/* Informasi Customer */}
                <section className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                    <h2 className="text-sm font-bold text-navy">Informasi Customer</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="label" htmlFor="c-name">Nama Lengkap</label>
                            <input
                                id="c-name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="input text-sm"
                                required
                                autoComplete="off"
                            />
                            {errors.name && <p className="form-error">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="label" htmlFor="c-email">Email Aktif</label>
                            <input
                                id="c-email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="input text-sm"
                                required
                                autoComplete="off"
                            />
                            {errors.email && <p className="form-error">{errors.email}</p>}
                            <p className="form-hint">Email reset password & notifikasi dikirim ke sini.</p>
                        </div>
                        <div>
                            <label className="label" htmlFor="c-phone">Nomor Telepon</label>
                            <input
                                id="c-phone"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                className="input text-sm"
                                required
                                autoComplete="off"
                            />
                            {errors.phone && <p className="form-error">{errors.phone}</p>}
                        </div>
                        <div className="sm:col-span-2">
                            <label className="label" htmlFor="c-address">Alamat Lengkap</label>
                            <textarea
                                id="c-address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                className="input min-h-20 text-sm"
                                rows={3}
                            />
                            {errors.address && <p className="form-error">{errors.address}</p>}
                        </div>
                        <div>
                            <label className="label" htmlFor="c-city">Kota</label>
                            <input
                                id="c-city"
                                value={data.city}
                                onChange={(e) => setData('city', e.target.value)}
                                className="input text-sm"
                            />
                        </div>
                        <div>
                            <label className="label" htmlFor="c-province">Provinsi</label>
                            <input
                                id="c-province"
                                value={data.province}
                                onChange={(e) => setData('province', e.target.value)}
                                className="input text-sm"
                            />
                        </div>
                        <div>
                            <label className="label" htmlFor="c-postal">Kode Pos</label>
                            <input
                                id="c-postal"
                                value={data.postal_code}
                                onChange={(e) => setData('postal_code', e.target.value)}
                                className="input text-sm"
                            />
                        </div>
                        <div>
                            <label className="label" htmlFor="c-status">Status Akun</label>
                            <select
                                id="c-status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="input text-sm"
                            >
                                <option value="active">Aktif</option>
                                <option value="pending">Menunggu</option>
                                <option value="inactive">Tidak Aktif</option>
                                <option value="suspended">Ditangguhkan</option>
                            </select>
                            {errors.status && <p className="form-error">{errors.status}</p>}
                        </div>

                        {/* Customer ID otomatis dari server — tidak dapat diedit */}
                        <div>
                            <label className="label">Customer ID Otomatis</label>
                            <p className="rounded-lg border border-border-soft bg-light-gray px-3 py-2 font-mono text-sm font-bold text-navy">
                                {nextCustomerCode}
                            </p>
                            <p className="form-hint">ID ini sudah dipasti unik oleh server.</p>
                        </div>
                        <div>
                            <label className="label">Password Awal</label>
                            <p className="rounded-lg border border-border-soft bg-light-gray px-3 py-2 text-xs text-body-text">
                                Dibuat otomatis & tampil sekali setelah akun dibuat.
                            </p>
                            <p className="form-hint">.getPassword tidak pernah ditampilkan lagi; customer bisa reset lewat email.</p>
                        </div>
                    </div>
                </section>

                {/* Informasi Pembelian Promo */}
                <section className="space-y-6">
                    <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <h2 className="text-sm font-bold text-navy">Informasi Pembelian Promo</h2>
                        <p className="mt-1 text-xs text-body-text">
                            Daftar di bawah adalah promo yang sedang dipublikasikan di halaman Promo & Diskon.
                        </p>

                        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1" role="radiogroup" aria-label="Pilih promo">
                            <label
                                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                                    data.promo_id === '' ? 'border-tech-blue bg-electric-light/30' : 'border-border-soft hover:bg-navy/5'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="promo_id"
                                    value=""
                                    checked={data.promo_id === ''}
                                    onChange={() => setData('promo_id', '')}
                                    className="h-3.5 w-3.5 accent-tech-blue"
                                />
                                <span className="text-sm text-navy">Tanpa promo</span>
                            </label>
                            {promos.map((promo) => (
                                <label
                                    key={promo.id}
                                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                                        data.promo_id === String(promo.id)
                                            ? 'border-tech-blue bg-electric-light/30'
                                            : 'border-border-soft hover:bg-navy/5'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="promo_id"
                                        value={promo.id}
                                        checked={data.promo_id === String(promo.id)}
                                        onChange={() => setData('promo_id', String(promo.id))}
                                        className="mt-1 h-3.5 w-3.5 accent-tech-blue"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-navy">{promo.title}</p>
                                        <p className="text-[11px] text-body-text">
                                            {promo.category?.name ?? 'Tanpa kategori'}
                                            {priceLabel(promo) ? ` · ${priceLabel(promo)}` : ''}
                                        </p>
                                    </div>
                                    {data.promo_id === String(promo.id) && (
                                        <Check className="h-4 w-4 shrink-0 text-tech-blue" />
                                    )}
                                </label>
                            ))}
                        </div>

                        {errors.promo_id && <p className="form-error mt-2">{errors.promo_id}</p>}

                        {data.promo_id && selectedPromo && (
                            <div className="mt-4 grid gap-4 border-t border-border-soft pt-4 sm:grid-cols-2">
                                <div>
                                    <label className="label" htmlFor="p-date">Tanggal Pembelian</label>
                                    <input
                                        id="p-date"
                                        type="date"
                                        value={data.purchase_date}
                                        onChange={(e) => setData('purchase_date', e.target.value)}
                                        className="input text-sm"
                                        required
                                    />
                                    {errors.purchase_date && <p className="form-error">{errors.purchase_date}</p>}
                                </div>
                                <div>
                                    <label className="label" htmlFor="p-status">Status Pembelian</label>
                                    <select
                                        id="p-status"
                                        value={data.purchase_status}
                                        onChange={(e) => setData('purchase_status', e.target.value)}
                                        className="input text-sm"
                                    >
                                        <option value="pending">Menunggu Pembayaran</option>
                                        <option value="paid">Terbayar</option>
                                        <option value="cancelled">Dibatalkan</option>
                                    </select>
                                    {errors.purchase_status && <p className="form-error">{errors.purchase_status}</p>}
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="label" htmlFor="p-notes">Informasi Tambahan</label>
                                    <textarea
                                        id="p-notes"
                                        value={data.purchase_notes}
                                        onChange={(e) => setData('purchase_notes', e.target.value)}
                                        className="input min-h-16 text-sm"
                                        rows={2}
                                        placeholder="Catatan pembelian sesuai kebutuhan promo"
                                    />
                                    {errors.purchase_notes && <p className="form-error">{errors.purchase_notes}</p>}
                                </div>
                                <p className="sm:col-span-2 flex items-start gap-2 text-[11px] text-body-text/80">
                                    <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    Pemilihan promo bukan bukti pembayaran; status pembelian diatur manual di atas.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <p className="text-xs text-body-text">
                            <UserPlus className="mr-1 inline h-3.5 w-3.5" />
                            Customer hanya bisa login dengan email aktif di atas.
                        </p>
                        <button type="submit" disabled={processing} className="btn-primary text-xs">
                            {processing ? 'Menyimpan...' : 'Buat Customer'}
                        </button>
                    </div>
                </section>
            </form>
        </AdminLayout>
    );
}
