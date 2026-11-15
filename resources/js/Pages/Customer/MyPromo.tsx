import { Head } from '@inertiajs/react';
import { Tag, ReceiptText, Clock, CheckCircle2, XCircle, CircleDashed } from 'lucide-react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { storageUrl } from '@/utils/assets';
import { formatDate, formatRupiah, getPromoPricingInfo } from '@/Components/PromoCard';
import type { PromoItem } from '@/types';

/** Satu pembelian promo yang ditetapkan Admin ke customer ini. */
export interface PurchaseItem {
    id: number;
    promo: PromoItem | null;
    purchase_date: string | null;
    status: 'pending' | 'paid' | 'cancelled';
    notes: string | null;
}

const statusPill: Record<PurchaseItem['status'], { label: string; className: string; icon: React.ReactNode }> = {
    pending: { label: 'Menunggu Pembayaran', className: 'badge badge-warning', icon: <CircleDashed className="h-3 w-3" /> },
    paid: { label: 'Terbayar', className: 'badge badge-success', icon: <CheckCircle2 className="h-3 w-3" /> },
    cancelled: { label: 'Dibatalkan', className: 'badge badge-neutral', icon: <XCircle className="h-3 w-3" /> },
};

export default function MyPromo({ purchases }: { purchases: PurchaseItem[] }) {
    return (
        <CustomerLayout title="My Promo">
            <Head title="My Promo | NDS Customer Portal" />

            <div className="mb-6">
                <h1 className="text-xl font-bold text-navy sm:text-2xl">My Promo</h1>
                <p className="mt-1 text-xs text-body-text">
                    Promo yang ditetapkan oleh tim NDS ke akun Anda. Informasi bersifat baca-saja.
                </p>
            </div>

            {purchases.length === 0 ? (
                <div className="rounded-2xl border border-border-soft bg-white px-6 py-16 text-center shadow-subtle">
                    <Tag className="mx-auto mb-3 h-10 w-10 text-body-text/30" />
                    <p className="text-sm font-semibold text-navy">Belum ada promo.</p>
                    <p className="mt-1 text-xs text-body-text">
                        Promo yang ditetapkan untuk Anda akan tampil di halaman ini.
                    </p>
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {purchases.map((purchase) => {
                        const promo = purchase.promo;
                        const pill = statusPill[purchase.status] || statusPill.pending;
                        const pricing = promo ? getPromoPricingInfo(promo) : null;
                        return (
                            <article
                                key={purchase.id}
                                className="flex flex-col overflow-hidden rounded-2xl border border-border-soft bg-white shadow-subtle"
                            >
                                {promo?.image && (
                                    <img
                                        src={storageUrl(promo.image)}
                                        alt={promo.title}
                                        className="h-40 w-full shrink-0 border-b border-border-soft object-cover"
                                        loading="lazy"
                                    />
                                )}
                                <div className="flex min-h-0 flex-1 flex-col p-5">
                                    <div className="flex items-start justify-between gap-2">
                                        <h2 className="text-sm font-bold text-navy">
                                            {promo?.title ?? 'Promo'}
                                        </h2>
                                        <span className={pill.className}>
                                            {pill.icon}
                                            <span className="ml-1">{pill.label}</span>
                                        </span>
                                    </div>

                                    {promo?.category && (
                                        <p className="mt-0.5 text-xs text-body-text">{promo.category.name}</p>
                                    )}
                                    {promo?.description && (
                                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-body-text">
                                            {promo.description}
                                        </p>
                                    )}

                                    {/* Harga: hanya angka yang dikonfirmasi sistem promo */}
                                    {pricing?.hasPricing && (
                                        <div className="mt-3 flex flex-wrap items-baseline gap-2">
                                            {pricing.finalPrice !== null && (
                                                <span className="text-lg font-bold text-navy">
                                                    {formatRupiah(pricing.finalPrice)}
                                                </span>
                                            )}
                                            {pricing.originalPrice !== null &&
                                                pricing.finalPrice !== null &&
                                                pricing.originalPrice > pricing.finalPrice && (
                                                    <span className="text-xs text-body-text/70 line-through">
                                                        {formatRupiah(pricing.originalPrice)}
                                                    </span>
                                                )}
                                            {pricing.combinedBadge && (
                                                <span className="rounded-full bg-electric-light px-2 py-0.5 text-[10px] font-bold text-navy">
                                                    {pricing.combinedBadge}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-auto space-y-1.5 border-t border-border-soft pt-3 text-[11px] text-body-text">
                                        <p className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 shrink-0" />
                                            Dibeli {purchase.purchase_date ? formatDate(purchase.purchase_date) : '—'}
                                        </p>
                                        {purchase.notes && (
                                            <p className="flex items-start gap-1.5">
                                                <ReceiptText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                <span className=" whitespace-pre-line">{purchase.notes}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </article>
                                        );
                                    })}
                </div>
            )}
        </CustomerLayout>
    );
}
