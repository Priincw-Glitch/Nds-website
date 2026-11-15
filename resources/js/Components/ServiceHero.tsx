import { useState } from "react";
import { Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Spotlight } from "@/Components/ui/Spotlight";
import type { ServiceItem } from "@/types";

/*
 * Header detail layanan dipakai bersama oleh semua layanan, termasuk
 * Web Development, agar tinggi, overlay, tipografi, dan tombolnya identik.
 * Judul, deskripsi, dan CTA bisa datang dari kolom hero_* layanan; bila
 * kosong, komponen memakai fallback bawaan agar data lama tetap tampil.
 */
export function ServiceHero({
    service,
    backgroundImage,
    description,
    secondaryHref,
    breadcrumbLabel,
    breadcrumbHref,
    layout = "full",
    ctaLabel,
    ctaHref,
    secondaryLabel,
}: {
    service: ServiceItem;
    backgroundImage?: string | null;
    description?: string | null;
    secondaryHref: string;
    breadcrumbLabel?: string;
    breadcrumbHref?: string;
    /** `full` = gambar selebar layar; `split` = teks di kiri, panel gambar kanan. */
    layout?: "full" | "split";
    ctaLabel?: string | null;
    ctaHref?: string | null;
    secondaryLabel?: string | null;
}) {
    const [imageFailed, setImageFailed] = useState(false);
    const categoryLabel = breadcrumbLabel || service.category?.name || "Layanan";
    const split = layout === "split" && !imageFailed && !!backgroundImage;

    const actions = (
        <div data-hero="actions" className="mt-8 flex flex-wrap gap-3.5">
            <Button asChild variant="primaryOnDark" size="lg" className="font-bold">
                {ctaHref && ctaHref.startsWith("/") ? (
                    <Link href={ctaHref}>
                        <span>{ctaLabel || "Konsultasi Solusi Ini"}</span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                ) : (
                    // Tanpa URL khusus dari admin, CTA membawa slug layanan agar
                    // pilihan "Bidang layanan" pada formulir sudah terisi.
                    <a href={ctaHref || route("contact", { service: service.slug })}>
                        <span>{ctaLabel || "Konsultasi Solusi Ini"}</span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                )}
            </Button>
            <Button asChild variant="outlineLight" size="lg">
                <a href={secondaryHref}>
                    <span>{secondaryLabel || "Lihat Cakupan & Alur"}</span>
                </a>
            </Button>
        </div>
    );

    return (
        <section className="relative overflow-hidden bg-navy pt-24 pb-20 lg:pt-28 lg:pb-28">
            {backgroundImage && !imageFailed && !split && (
                <>
                    <img
                        src={backgroundImage}
                        alt=""
                        aria-hidden="true"
                        onError={() => setImageFailed(true)}
                        className="absolute inset-0 h-full w-full object-cover object-center opacity-70"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-deep-navy via-navy/85 to-navy/50" />
                </>
            )}
            <Spotlight className="-top-24 left-1/3" fill="#4da6f8" />

            <div className="container-nds relative z-10">
                <nav
                    aria-label="Navigasi Breadcrumb"
                    className="mb-8 flex items-center gap-2 text-xs text-white/60"
                >
                    <Link href={route("home")} className="transition-colors hover:text-white">
                        Beranda
                    </Link>
                    <ChevronRight className="h-3 w-3 text-white/40" aria-hidden="true" />
                    {breadcrumbHref ? (
                        <Link href={breadcrumbHref} className="text-white/80 transition-colors hover:text-white">
                            {categoryLabel}
                        </Link>
                    ) : (
                        <span className="text-white/80">{categoryLabel}</span>
                    )}
                    <ChevronRight className="h-3 w-3 text-white/40" aria-hidden="true" />
                    <span className="font-semibold text-electric-light">{service.name}</span>
                </nav>

                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    <div>
                        <h1 data-hero="title" className="heading-1 text-white! opacity-0 tracking-tight">
                            {service.name}
                        </h1>
                        {split && (
                            <>
                                <p
                                    data-hero="desc"
                                    className="mt-6 max-w-md text-base leading-relaxed text-white/80 opacity-0 sm:text-lg"
                                >
                                    {description}
                                </p>
                                {actions}
                            </>
                        )}
                    </div>

                    {split && backgroundImage && (
                        <div className="relative hidden aspect-[4/3] overflow-hidden rounded-xl border border-white/10 lg:block">
                            <img
                                src={backgroundImage}
                                alt={`Ilustrasi layanan ${service.name}`}
                                onError={() => setImageFailed(true)}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    )}

                    {!split && (
                        <div>
                            <p data-hero="desc" className="max-w-md text-base leading-relaxed text-white/80 opacity-0 sm:text-lg">
                                {description}
                            </p>
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
