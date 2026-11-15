import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import { Calendar, ExternalLink, MessageSquare, X } from "lucide-react";
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

// Popup promo otomatis satu per sesi kunjungan. Data diambil dari endpoint
// /promo-popup yang membaca promo aktif di Admin Panel; tanpa promo aktif,
// popup tidak pernah dirender.
const DISMISS_KEY = "nds:promo-popup-dismissed";
const SHOW_DELAY_MS = 2500;

function isDismissed(): boolean {
    try {
        return window.sessionStorage.getItem(DISMISS_KEY) !== null;
    } catch {
        return false;
    }
}

function rememberDismissed(): void {
    try {
        window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
        // Penyimpanan sesi diblokir browser: popup tetap bisa ditutup.
    }
}

export function PromoPopup() {
    const [promo, setPromo] = useState<PromoItem | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined" || isDismissed()) return;

        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            fetch(route("promo.popup"), {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
                signal: controller.signal,
            })
                .then((response) => (response.ok ? response.json() : null))
                .then((data: { promo?: PromoItem | null } | null) => {
                    const next = data?.promo ?? null;
                    // Bisa saja pengunjung menutup popup lain di tab yang sama
                    // selama permintaan berjalan, jadi status sesi dicek ulang.
                    if (!next || isDismissed()) return;
                    // Pengunjung sedang melihat dialog lain (mis. detail promo
                    // yang baru dibuka): jangan menutupinya dengan popup.
                    if (document.querySelector("[role='dialog']")) return;
                    setPromo(next);
                    setOpen(true);
                })
                .catch(() => {
                    // Gagal mengambil promo: popup tidak ditampilkan.
                });
        }, SHOW_DELAY_MS);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, []);

    const dismiss = () => {
        rememberDismissed();
        setOpen(false);
    };

    if (!promo) return null;

    const pricing = getPromoPricingInfo(promo);
    const validity = getPromoValidityStatus(promo);
    const cta = resolvePromoCta(promo);
    const imageSrc = getPromoImageSrc(promo);
    const badge = getPromoBadge(promo);
    const category = getPromoCategory(promo);
    const hasDates = Boolean(promo.start_date || promo.end_date);

    return (
        <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
            <DialogContent className="promo-popup-content z-[70] max-h-[90svh] w-[92vw] max-w-3xl overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-[0_30px_80px_-32px_rgba(16,38,74,0.55)] [&>button:last-child]:hidden">
                <DialogClose asChild>
                    <button
                        type="button"
                        aria-label="Tutup popup promo"
                        className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-border-soft bg-white text-navy shadow-sm transition-colors hover:bg-light-gray focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tech-blue"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </DialogClose>

                <div className="max-h-[90svh] overflow-y-auto overscroll-contain">
                    <div className="grid md:grid-cols-[44%_56%]">
                        <div className="relative h-44 overflow-hidden bg-navy sm:h-52 md:h-auto md:min-h-[360px]">
                            {imageSrc ? (
                                <img
                                    src={imageSrc}
                                    alt={promo.title}
                                    className="absolute inset-0 h-full w-full object-cover object-center"
                                />
                            ) : (
                                <span aria-hidden="true" className="absolute inset-0 block bg-navy" />
                            )}

                            {badge && (
                                <span
                                    className={`absolute bottom-3 left-3 inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white ${
                                        badge.tone === "discount" ? "bg-crimson-dark" : "bg-navy"
                                    }`}
                                >
                                    {badge.label}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col p-6 sm:p-8 md:justify-center md:py-9 md:pl-8 md:pr-10">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-tech-blue">
                                {category}
                            </p>

                            <DialogTitle className="mt-2 pr-8 text-xl font-bold leading-tight tracking-tight text-navy sm:text-2xl">
                                {promo.title}
                            </DialogTitle>

                            <DialogDescription
                                className={
                                    promo.description
                                        ? "mt-3 text-sm leading-relaxed text-body-text"
                                        : "sr-only"
                                }
                            >
                                {promo.description || `Detail promo ${promo.title}`}
                            </DialogDescription>

                            {pricing.hasPricing && (
                                <div className="mt-5">
                                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                        <span className="text-2xl font-bold tracking-tight text-navy">
                                            {formatRupiah(pricing.finalPrice ?? pricing.originalPrice)}
                                        </span>
                                        {pricing.originalPrice !== null &&
                                            pricing.finalPrice !== null &&
                                            pricing.originalPrice > pricing.finalPrice && (
                                                <span className="text-sm font-medium text-body-text/70 line-through">
                                                    {formatRupiah(pricing.originalPrice)}
                                                </span>
                                            )}
                                    </div>

                                    {pricing.savingsAmount !== null && pricing.savingsAmount > 0 && (
                                        <p className="mt-1 text-xs font-semibold text-crimson-dark">
                                            Hemat {formatRupiah(pricing.savingsAmount)}
                                        </p>
                                    )}
                                </div>
                            )}

                            {hasDates && (
                                <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-body-text">
                                    <Calendar className="h-3.5 w-3.5 shrink-0 text-tech-blue" aria-hidden="true" />
                                    <span>{validity.dateLabel}</span>
                                </p>
                            )}

                            <div className="mt-6 md:mt-7">
                                {cta.isExternal ? (
                                    <Button asChild size="lg" className="w-full font-bold" onClick={dismiss}>
                                        <a href={cta.href} target="_blank" rel="noopener noreferrer">
                                            <span>{cta.text}</span>
                                            {cta.isWhatsApp ? (
                                                <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
                                            ) : (
                                                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                                            )}
                                        </a>
                                    </Button>
                                ) : (
                                    <Button asChild size="lg" className="w-full font-bold" onClick={dismiss}>
                                        <Link href={cta.href || route("contact")}>
                                            <span>{cta.text}</span>
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
