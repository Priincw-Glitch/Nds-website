import { useEffect, useState } from "react";
import { Calendar, Clock, ExternalLink, MessageSquare, X } from "lucide-react";
import { Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import {
    formatRupiah,
    getPromoBadge,
    getPromoCategory,
    getPromoImageSrc,
    getPromoPricingInfo,
    getPromoValidityStatus,
    resolvePromoCta,
} from "@/Components/PromoCard";
import type { PromoItem } from "@/types";

// Modal detail promo untuk Beranda: seluruh isian dibaca dari data promo yang
// dipilih (Admin Panel), tanpa nilai buatan. Kolom opsional (harga, diskon,
// masa berlaku, CTA khusus) hanya muncul bila datanya tersedia. Data promo
// terakhir dipertahankan selama animasi penutup agar modal tidak tiba-tiba kosong.
interface PromoDetailModalProps {
    promo: PromoItem | null;
    onClose: () => void;
}

export function PromoDetailModal({ promo, onClose }: PromoDetailModalProps) {
    const [shownPromo, setShownPromo] = useState<PromoItem | null>(promo);
    // Tutup secara optimistik: dialog hilang seketika saat pengguna menutup,
    // tanpa menunggu navigasi kembali ke /promo selesai (di koneksi lambat
    // respons bisa terlambat). State ini direset saat promo baru dibuka.
    const [suppress, setSuppress] = useState(false);

    useEffect(() => {
        if (promo) setSuppress(false);
        if (promo) setShownPromo(promo);
    }, [promo]);

    if (!shownPromo) return null;

    const pricing = getPromoPricingInfo(shownPromo);
    const validity = getPromoValidityStatus(shownPromo);
    const cta = resolvePromoCta(shownPromo);
    const imageSrc = getPromoImageSrc(shownPromo);
    const badge = getPromoBadge(shownPromo);
    const category = getPromoCategory(shownPromo);
    const hasDates = Boolean(shownPromo.start_date || shownPromo.end_date);

    return (
        <Dialog
            open={!!promo && !suppress}
            onOpenChange={(open) => { if (!open) { setSuppress(true); onClose(); } }}
        >
            <DialogContent className="z-[60] flex max-h-[90svh] w-[92vw] max-w-xl flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_30px_80px_-32px_rgba(16,38,74,0.55)] [&>button:last-child]:hidden">
                <DialogClose asChild>
                    <button
                        type="button"
                        aria-label="Tutup detail promo"
                        className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-border-soft bg-white text-navy shadow-sm transition-colors hover:bg-light-gray focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tech-blue"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </DialogClose>

                {/* Panel atas: gambar promo terpilih dengan rasio thumbnail yang sama */}
                <div className="relative aspect-[16/10] w-full shrink-0 bg-surface-muted sm:aspect-[16/8]">
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            alt=""
                            aria-hidden="true"
                            className="h-full w-full object-cover object-center"
                        />
                    ) : (
                        // Tanpa gambar dari Admin: panel navy polos, tanpa teks.
                        <span aria-hidden="true" className="block h-full w-full bg-navy" />
                    )}

                    {badge && (
                        <span
                            className={`absolute left-4 top-4 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm ${
                                badge.tone === "discount" ? "bg-crimson" : "bg-tech-blue"
                            }`}
                        >
                            {badge.label}
                        </span>
                    )}
                </div>

                {/* Informasi promo: judul, deskripsi, harga, diskon, masa berlaku */}
                <div className="flex flex-1 flex-col overflow-y-auto p-5 text-left sm:p-7">
                    <span className="mb-1.5 line-clamp-1 text-[10px] font-bold uppercase tracking-[0.14em] text-tech-blue">
                        {category}
                    </span>
                    <DialogTitle className="text-xl font-bold tracking-tight text-navy line-clamp-2 sm:text-2xl">
                        {shownPromo.title}
                    </DialogTitle>

                    <DialogDescription
                        className={
                            shownPromo.description
                                ? "mt-3 text-sm leading-relaxed text-body-text sm:text-[15px]"
                                : "sr-only"
                        }
                    >
                        {shownPromo.description || `Detail promo ${shownPromo.title}`}
                    </DialogDescription>

                    {pricing.hasPricing && (
                        <div className="mt-5 rounded-xl border border-border-soft bg-light-gray p-4">
                            <dl className="space-y-2.5 text-sm">
                                {pricing.originalPrice !== null && (
                                    <div className="flex items-center justify-between gap-3">
                                        <dt className="text-body-text">Harga Normal</dt>
                                        <dd
                                            className={
                                                pricing.finalPrice !== null && pricing.finalPrice < pricing.originalPrice
                                                    ? "font-medium text-body-text/60 line-through"
                                                    : "font-semibold text-navy"
                                            }
                                        >
                                            {formatRupiah(pricing.originalPrice)}
                                        </dd>
                                    </div>
                                )}

                                {pricing.combinedBadge && (
                                    <div className="flex items-center justify-between gap-3">
                                        <dt className="text-body-text">Diskon</dt>
                                        <dd className="inline-flex items-center rounded-md bg-crimson/10 px-2 py-0.5 text-xs font-bold text-crimson-dark">
                                            {pricing.combinedBadge}
                                        </dd>
                                    </div>
                                )}

                                {pricing.finalPrice !== null && (
                                    <div className="flex items-center justify-between gap-3 border-t border-dashed border-border-soft pt-2.5">
                                        <dt className="font-semibold text-navy">Harga Promo</dt>
                                        <dd className="text-lg font-bold tracking-tight text-navy">
                                            {formatRupiah(pricing.finalPrice)}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    )}

                    {hasDates && (
                        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-body-text">
                            <span className="inline-flex items-center gap-1.5 font-medium">
                                <Calendar className="h-4 w-4 shrink-0 text-tech-blue" aria-hidden="true" />
                                <span>{validity.dateLabel}</span>
                            </span>

                            {validity.urgencyBadge && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-tech-blue/30 bg-tech-blue/10 px-2.5 py-1 text-[11px] font-semibold text-navy">
                                    <Clock className="h-3 w-3 shrink-0 text-tech-blue" aria-hidden="true" />
                                    <span>{validity.urgencyBadge.label}</span>
                                </span>
                            )}
                        </div>
                    )}

                    {/* CTA mengikuti tautan promo di Admin; bila kosong, jatuh ke halaman kontak */}
                    <div className="mt-7">
                        {cta.isExternal ? (
                            <Button asChild className="w-full">
                                <a href={cta.href} target="_blank" rel="noopener noreferrer">
                                    <span>{cta.text}</span>
                                    {cta.isWhatsApp ? (
                                        <MessageSquare className="h-4 w-4 shrink-0" />
                                    ) : (
                                        <ExternalLink className="h-4 w-4 shrink-0" />
                                    )}
                                </a>
                            </Button>
                        ) : (
                            <Button asChild className="w-full">
                                <Link href={cta.href || route("contact")}>
                                    <span>{cta.text}</span>
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}