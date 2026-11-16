import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import { ArrowUpRight, Clock, Tag } from "lucide-react";
import { waNumber } from "@/utils/waLink";
import { storageUrl } from "@/utils/assets";
import type { PromoItem } from "@/types";

/**
 * Format tanggal ke format lokal Indonesia (contoh: 31 Des 2026)
 */
export function formatDate(date?: string | null): string {
    if (!date) return "";
    return new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

/**
 * Format angka ke format mata uang Rupiah (contoh: Rp176.000)
 */
export function formatRupiah(value?: number | null): string {
    if (value === undefined || value === null || isNaN(value)) return "";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

// Resolusi src gambar promo: blob/dataURI/http tetap apa adanya, path storage
// dipetakan lewat helper terpusat agar tetap benar di root maupun subfolder.
export function getPromoImageSrc(promo: PromoItem): string | undefined {
    if (!promo.image) return undefined;
    return storageUrl(promo.image);
}

/**
 * Resolusi nama kategori promo: kategori tersemat dari Admin (kategori layanan),
 * atau inferensi teks untuk promo yang belum diberi kategori.
 */
export function getPromoCategory(promo: PromoItem): string {
    if (promo.category?.name) {
        return promo.category.name;
    }
    const text = `${promo.title} ${promo.description || ""}`.toLowerCase();
    const applicationKeywords = ["web", "website", "aplikasi", "software", "sistem", "app"];
    if (applicationKeywords.some((keyword) => text.includes(keyword))) {
        return "Application";
    }
    return "Solution";
}

/**
 * Struktur data harga & penghematan terpadu
 */
export interface PromoPricingInfo {
    hasPricing: boolean;
    finalPrice: number | null;
    originalPrice: number | null;
    savingsAmount: number | null;
    discountPercentage: number | null;
    combinedBadge: string | null;
    headerBadge: string | null;
}

/**
 * Kalkulasi harga normal, harga promo, persentase diskon, dan nominal penghematan
 */
export function getPromoPricingInfo(promo: PromoItem): PromoPricingInfo {
    const orig =
        typeof promo.original_price === "number" && !isNaN(promo.original_price) && promo.original_price > 0
            ? promo.original_price
            : null;

    let final =
        typeof promo.final_price === "number" && !isNaN(promo.final_price) && promo.final_price >= 0
            ? promo.final_price
            : null;

    // Kalkulasi otomatis jika final_price belum terisi tetapi tipe diskon & harga normal ada
    if (final === null && orig !== null) {
        if (promo.discount_type === "percentage" && promo.discount_percentage && promo.discount_percentage > 0) {
            final = Math.max(0, Math.round(orig * (1 - promo.discount_percentage / 100)));
        } else if (promo.discount_type === "fixed" && promo.discount_amount && promo.discount_amount > 0) {
            final = Math.max(0, orig - promo.discount_amount);
        }
    }

    const hasPricing = final !== null || orig !== null;

    let savingsAmount: number | null = null;
    let discountPercentage: number | null = null;

    if (orig !== null && final !== null && orig > final) {
        savingsAmount = orig - final;
        discountPercentage = Math.round((savingsAmount / orig) * 100);
    } else if (promo.discount_type === "percentage" && promo.discount_percentage && promo.discount_percentage > 0) {
        discountPercentage = Math.round(promo.discount_percentage);
    } else if (promo.discount_type === "fixed" && promo.discount_amount && promo.discount_amount > 0) {
        savingsAmount = promo.discount_amount;
    }

    // Badge ringkas untuk header promo (kanan atas)
    let headerBadge: string | null = null;
    if (discountPercentage !== null && discountPercentage > 0) {
        headerBadge = `DISKON ${discountPercentage}%`;
    } else if (savingsAmount !== null && savingsAmount > 0) {
        headerBadge = `HEMAT ${formatRupiah(savingsAmount)}`;
    } else if (promo.discount_type === "special_price") {
        headerBadge = "HARGA SPESIAL";
    } else {
        const text = `${promo.title} ${promo.description || ""}`.toLowerCase();
        if (text.includes("gratis") || text.includes("tanpa biaya") || text.includes("free") || text.includes("100%")) {
            headerBadge = "DISKON 100%";
        } else {
            const match = promo.title.match(/(\d+%\s*(?:OFF|diskon)?|\b\d+%\b)/i);
            if (match) headerBadge = match[0].toUpperCase();
        }
    }

    // Combined Badge: DISKON X% · Hemat Rp...
    let combinedBadge: string | null = null;
    if (discountPercentage !== null && discountPercentage > 0 && savingsAmount !== null && savingsAmount > 0) {
        combinedBadge = `DISKON ${discountPercentage}% · Hemat ${formatRupiah(savingsAmount)}`;
    } else if (discountPercentage !== null && discountPercentage > 0) {
        combinedBadge = `DISKON ${discountPercentage}%`;
    } else if (savingsAmount !== null && savingsAmount > 0) {
        combinedBadge = `Hemat ${formatRupiah(savingsAmount)}`;
    }

    return {
        hasPricing,
        finalPrice: final,
        originalPrice: orig,
        savingsAmount,
        discountPercentage,
        combinedBadge,
        headerBadge,
    };
}

/**
 * Backward compatibility helper untuk badge diskon
 */
export function getPromoDiscountBadge(promo: PromoItem): string | null {
    return getPromoPricingInfo(promo).headerBadge;
}

/**
 * Backward compatibility helper untuk sisa hari
 */
export function getRemainingDays(endDate?: string | null): number | null {
    if (!endDate) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endParts = endDate.split("T")[0].split("-");
    const end = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]));
    const diff = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : null;
}

/**
 * Status masa berlaku dinamis & badge urgensi yang fleksibel
 */
export interface PromoValidityStatus {
    dateLabel: string;
    urgencyBadge?: {
        label: string;
        className: string;
        iconClassName: string;
    } | null;
}

export function getPromoValidityStatus(promo: PromoItem): PromoValidityStatus {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let dateLabel = "Waktu terbatas";
    if (promo.end_date) {
        dateLabel = `Berlaku s/d ${formatDate(promo.end_date)}`;
    } else if (promo.start_date) {
        dateLabel = `Mulai ${formatDate(promo.start_date)}`;
    }

    if (!promo.end_date) {
        return { dateLabel, urgencyBadge: null };
    }

    const endParts = promo.end_date.split("T")[0].split("-");
    const endDate = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]));
    const diffDays = Math.round((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return {
            dateLabel,
            urgencyBadge: {
                label: "Telah Berakhir",
                className: "bg-surface-muted text-body-text border border-border-soft",
                iconClassName: "text-body-text/70",
            },
        };
    }

    // Sistem tema biru konsisten untuk masa berlaku (7 hari lagi, 3 hari lagi, besok berakhir, berakhir hari ini)
    const blueBadge = {
        className: "bg-tech-blue/10 text-navy border border-tech-blue/30 font-semibold",
        iconClassName: "text-tech-blue",
    };

    if (diffDays === 0) {
        return {
            dateLabel,
            urgencyBadge: {
                label: "Berakhir hari ini",
                className: "bg-tech-blue/10 text-navy border border-tech-blue/50 font-bold",
                iconClassName: "text-tech-blue",
            },
        };
    }

    if (diffDays === 1) {
        return {
            dateLabel,
            urgencyBadge: {
                label: "Besok berakhir",
                ...blueBadge,
            },
        };
    }

    if (diffDays <= 30) {
        return {
            dateLabel,
            urgencyBadge: {
                label: `${diffDays} hari lagi`,
                ...blueBadge,
            },
        };
    }

    return { dateLabel, urgencyBadge: null };
}

/**
 * Resolusi tujuan tombol CTA (Mendukung URL eksternal, WhatsApp, internal link, & fallback kontak)
 */
export interface ResolvedCta {
    text: string;
    href: string;
    isExternal: boolean;
    isWhatsApp: boolean;
}

export function resolvePromoCta(promo: PromoItem, isPreview = false): ResolvedCta {
    if (isPreview) {
        return {
            text: promo.cta_text?.trim() || "Hubungi Kami",
            href: "#",
            isExternal: false,
            isWhatsApp: false,
        };
    }

    const defaultText = "Hubungi Kami";
    let text = promo.cta_text?.trim() || defaultText;
    const rawUrl = promo.cta_url?.trim() || "";

    // Cek apakah cta_text sendiri berupa nomor telepon
    const textDigits = text.replace(/[^0-9+]/g, "");
    const isTextPhone = /^(\+?62|08)[0-9]{8,15}$/.test(textDigits);

    // Cek apakah cta_url berupa nomor telepon atau tautan WA
    const urlDigits = rawUrl.replace(/[^0-9+]/g, "");
    const isUrlPhone = /^(\+?62|08)[0-9]{8,15}$/.test(urlDigits);
    const isWaLink = rawUrl.includes("wa.me") || rawUrl.includes("whatsapp.com");

    const message = encodeURIComponent(`Halo NDS, saya tertarik dengan promo "${promo.title}". Mohon informasinya.`);

    if (isUrlPhone || isWaLink) {
        const phone = waNumber(urlDigits);
        const href =
            isWaLink && rawUrl.startsWith("http")
                ? rawUrl.includes("?")
                    ? `${rawUrl}&text=${message}`
                    : `${rawUrl}?text=${message}`
                : `https://wa.me/${phone}?text=${message}`;
        return {
            text: isTextPhone ? "Hubungi via WhatsApp" : text,
            href,
            isExternal: true,
            isWhatsApp: true,
        };
    }

    if (!rawUrl && isTextPhone) {
        return {
            text: "Hubungi via WhatsApp",
            href: `https://wa.me/${waNumber(textDigits)}?text=${message}`,
            isExternal: true,
            isWhatsApp: true,
        };
    }

    if (rawUrl) {
        if (rawUrl.startsWith("tel:") || rawUrl.startsWith("mailto:")) {
            return { text, href: rawUrl, isExternal: true, isWhatsApp: false };
        }
        if (/^https?:\/\//i.test(rawUrl)) {
            const isExt = typeof window !== "undefined" ? !rawUrl.includes(window.location.hostname) : true;
            return { text, href: rawUrl, isExternal: isExt, isWhatsApp: false };
        }
        return { text, href: rawUrl, isExternal: false, isWhatsApp: false };
    }

    // Default fallback ke halaman Kontak NDS
    return {
        text,
        href: route("contact"),
        isExternal: false,
        isWhatsApp: false,
    };
}

/**
 * Badge singkat di sudut gambar: merah untuk potongan harga, biru untuk
 * penawaran khusus (gratis instalasi, harga spesial) yang bukan nominal diskon.
 */
export interface PromoBadge {
    label: string;
    tone: "discount" | "special";
}

export function getPromoBadge(promo: PromoItem): PromoBadge | null {
    const pricing = getPromoPricingInfo(promo);
    const text = `${promo.title} ${promo.description || ""}`.toLowerCase();

    if (pricing.discountPercentage === 100) {
        return { label: text.includes("instalasi") ? "Gratis Instalasi" : "Gratis", tone: "special" };
    }
    if (pricing.discountPercentage !== null && pricing.discountPercentage > 0) {
        return { label: `Diskon ${pricing.discountPercentage}%`, tone: "discount" };
    }
    if (pricing.savingsAmount !== null && pricing.savingsAmount > 0) {
        return { label: `Hemat ${formatRupiah(pricing.savingsAmount)}`, tone: "discount" };
    }
    if (promo.discount_type === "special_price") {
        return { label: "Harga Spesial", tone: "special" };
    }
    if (text.includes("gratis") || text.includes("free")) {
        return { label: text.includes("instalasi") ? "Gratis Instalasi" : "Gratis", tone: "special" };
    }
    return null;
}

/**
 * Hitung sisa waktu promo dari end_date. Tanggal tanpa jam dihitung sampai
 * akhir hari tersebut, sesuai cara Admin mengisi masa berlaku.
 */
export function getPromoCountdown(promo: PromoItem, now: number = Date.now()): string | null {
    if (!promo.end_date) return null;
    const parts = promo.end_date.split("T")[0].split("-");
    const end = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 23, 59, 59);
    if (isNaN(end.getTime())) return null;

    const diff = end.getTime() - now;
    if (diff <= 0) return "Promo berakhir";

    const hours = diff / (1000 * 60 * 60);
    if (hours < 1) return "Kurang dari 1 jam lagi";
    if (hours < 24) {
        const h = Math.floor(hours);
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return m > 0 ? `Sisa ${h} jam ${m} menit` : `Sisa ${h} jam`;
    }

    const days = Math.floor(hours / 24);
    return days <= 1 ? "Sisa 1 hari" : `Sisa ${days} hari`;
}

// Satu timer per kartu, cukup presisi menit. Timer membersihkan diri saat kartu
// dilepas (pindah halaman / pagination).
function usePromoNow(): number {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 60000);
        return () => window.clearInterval(timer);
    }, []);
    return now;
}

interface PromoCardProps {
    promo: PromoItem;
    isFeatured?: boolean;
    isPreview?: boolean;
    className?: string;
    /** "light" dipakai halaman Promo, "dark" tetap untuk Beranda. */
    variant?: "dark" | "light";
}

const CARD_TONES = {
    dark: {
        surface: "border-tech-blue/20 bg-navy shadow-[0_14px_32px_-24px_rgba(2,10,25,0.55)]",
        hover: "hover:border-tech-blue/50 hover:shadow-[0_26px_50px_-24px_rgba(2,10,25,0.75)]",
        media: "bg-[#0d1e3a]",
        mediaIcon: "border-tech-blue/35 text-tech-blue",
        mediaLabel: "text-white/65",
        category: "text-blue-200/75",
        title: "text-white",
        description: "text-white/60",
        divider: "border-white/10",
        price: "text-white",
        originalPrice: "text-white/60",
        validity: "text-blue-200",
    },
    light: {
        surface: "border-border-soft bg-white shadow-[0_4px_20px_-2px_rgba(11,31,68,0.08)]",
        hover: "hover:border-tech-blue/50 hover:shadow-[0_16px_36px_-6px_rgba(11,31,68,0.14)]",
        media: "bg-light-blue",
        mediaIcon: "border-tech-blue/35 text-tech-blue",
        mediaLabel: "text-navy/75",
        category: "text-tech-blue",
        title: "text-navy",
        description: "text-body-text",
        divider: "border-border-soft",
        price: "text-navy",
        originalPrice: "text-slate-400",
        validity: "text-slate-500",
    },
} as const;

// Media kartu promo: gambar dengan fallback rapi ketika file gagal dimuat
// (mis. server belum dapat menjangkau file upload) — peramban tidak
// menampilkan ikon gambar rusak karena elemen img digantikan placeholder.
function PromoMedia({
    src,
    alt,
    category,
    tone,
}: {
    src: string | undefined;
    alt: string;
    category: string;
    tone: (typeof CARD_TONES)[keyof typeof CARD_TONES];
}) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
                <span className={`flex h-11 w-11 items-center justify-center rounded-full border ${tone.mediaIcon}`}>
                    <Tag className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className={`line-clamp-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${tone.mediaLabel}`}>
                    {category}
                </span>
            </div>
        );
    }

    return (
        <>
            <img
                src={src}
                alt={alt}
                loading="lazy"
                onError={() => setFailed(true)}
                className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
            {/* Scrim tipis di kaki gambar: menjaga badge dan tepi kartu tetap terbaca */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-navy/80 to-transparent"
            />
        </>
    );
}

export function PromoCard({
    promo,
    isFeatured = false,
    isPreview = false,
    className = "",
    variant = "dark",
}: PromoCardProps) {
    const tone = CARD_TONES[variant];
    const category = getPromoCategory(promo);
    const pricing = getPromoPricingInfo(promo);
    const validity = getPromoValidityStatus(promo);
    const badge = getPromoBadge(promo);
    const imageSrc = getPromoImageSrc(promo);
    const now = usePromoNow();
    const countdown = getPromoCountdown(promo, now);

    const clickable = !isPreview;
    // Seluruh permukaan kartu menjadi satu tautan ke halaman detail promo
    // (URL /promo/{slug}); modal detail terbuka otomatis di sana. Mode
    // preview di Admin Panel tidak bisa diklik.
    const surfaceClass = `group relative flex h-full w-full flex-col overflow-hidden rounded-xl border transition-all duration-300 ${tone.surface} ${
        clickable ? `cursor-pointer hover:-translate-y-1 ${tone.hover} focus-visible:-translate-y-1` : ""
    } ${isFeatured ? "ring-1 ring-tech-blue/40" : ""} ${className}`;

    const body = (
        <>
            <div className={`relative aspect-[16/10] w-full shrink-0 overflow-hidden ${tone.media}`}>
                {/* key memaksa remount saat src berganti (ganti gambar di preview), agar status gagal direset */}
                <PromoMedia key={imageSrc ?? "tanpa-gambar"} src={imageSrc} alt={promo.title} category={category} tone={tone} />

                {badge && (
                    <span
                        className={`absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm ${
                            badge.tone === "discount" ? "bg-crimson" : "bg-tech-blue"
                        }`}
                    >
                        {badge.label}
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col p-4 sm:p-5">
                <span className={`line-clamp-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tone.category}`}>
                    {category}
                </span>
                <h3 className={`mt-1.5 line-clamp-2 text-base font-bold leading-snug sm:text-[17px] ${tone.title}`}>
                    {promo.title}
                </h3>
                {promo.description && (
                    <p className={`mt-2 line-clamp-2 text-[13px] leading-relaxed ${tone.description}`}>{promo.description}</p>
                )}

                <div className={`mt-auto flex items-end justify-between gap-3 border-t pt-3.5 ${tone.divider}`}>
                    <div className="min-w-0">
                        {pricing.hasPricing && (
                            <div className="flex flex-wrap items-baseline gap-1.5">
                                <span className={`text-[15px] font-bold tracking-tight ${tone.price}`}>
                                    {formatRupiah(pricing.finalPrice ?? pricing.originalPrice)}
                                </span>
                                {pricing.originalPrice !== null &&
                                    pricing.finalPrice !== null &&
                                    pricing.originalPrice > pricing.finalPrice && (
                                        <span className={`text-[11px] font-medium line-through ${tone.originalPrice}`}>
                                            {formatRupiah(pricing.originalPrice)}
                                        </span>
                                    )}
                            </div>
                        )}
                        <div
                            className={`flex items-center gap-1.5 text-[11px] font-medium sm:text-xs ${tone.validity} ${
                                pricing.hasPricing ? "mt-1" : ""
                            }`}
                        >
                            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">{countdown ?? validity.dateLabel}</span>
                        </div>
                    </div>

                    <span
                        aria-hidden="true"
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tech-blue text-white transition-all duration-300 ${
                            clickable ? "group-hover:bg-tech-blue-hover group-hover:translate-x-0.5" : ""
                        }`}
                    >
                        <ArrowUpRight className="h-4 w-4" />
                    </span>
                </div>
            </div>
        </>
    );

    if (clickable) {
        return (
            <Link
                href={route("promo.show", promo.slug)}
                data-promo-id={promo.id}
                aria-label={`Lihat detail promo ${promo.title}`}
                className={surfaceClass + " focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-tech-blue"}
            >
                {body}
            </Link>
        );
    }

    return (
        <article data-promo-id={promo.id} className={surfaceClass}>
            {body}
        </article>
    );
}