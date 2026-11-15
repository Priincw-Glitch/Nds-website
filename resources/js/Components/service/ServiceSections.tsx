import { Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import { useState } from "react";
import { storageUrl } from "@/utils/assets";
import {
    ArrowRight,
    Gauge,
    Layers,
    MonitorSmartphone,
    Search,
    ShieldCheck,
    HelpCircle,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/Components/ui/accordion";
import type { ServiceSectionData, ServiceSectionEntry, ServiceSectionStep } from "@/types";

/*
 * Renderer section halaman layanan.
 *
 * Komposisi tiap section dikendalikan data (type, layout_variant, payload)
 * dari tabel service_sections, sehingga tiap layanan memakai urutan dan
 * tatanan berbeda alih-alih satu template yang seragam.
 */

const ICONS = {
    MonitorSmartphone,
    Gauge,
    ShieldCheck,
    Search,
    Layers,
} as const;

type IconName = keyof typeof ICONS;

function stepNumber(index: number): string {
    return String(index + 1).padStart(2, "0");
}

function paragraphs(description?: string | null): string[] {
    if (!description) return [];
    return description
        .split(/\r?\n/)
        .map((p) => p.trim())
        .filter(Boolean);
}

// Path relatif adalah lampiran storage; path dengan awalan slash/http dipakai adanya.
function resolveImage(value?: string | null): string | undefined {
    const path = value?.trim();
    if (!path) return undefined;
    if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
    return storageUrl(path);
}

/** Panel gambar yang turun ke blok navy ketika gambar gagal dimuat. */
function ImagePanel({ src, alt, ratio }: { src: string; alt: string; ratio: string }) {
    const [failed, setFailed] = useState(false);
    return (
        <div className={`relative ${ratio} overflow-hidden bg-deep-navy`}>
            {!failed && (
                <img
                    src={src}
                    alt={alt}
                    onError={() => setFailed(true)}
                    className="h-full w-full object-cover"
                />
            )}
        </div>
    );
}

function SectionHeadingBlock({
    title,
    description,
}: {
    title?: string | null;
    description?: string | null;
}) {
    if (!title && !description) return null;
    return (
        <div>
            {title && <h2 className="heading-2 text-balance">{title}</h2>}
            {description && (
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-body-text sm:text-base">
                    {description}
                </p>
            )}
        </div>
    );
}

function TextSection({ section }: { section: ServiceSectionData }) {
    const paras = section.payload?.paragraphs ?? paragraphs(section.description);
    if (paras.length === 0 && !section.title) return null;
    return (
        <div className="container-nds">
            {section.title && <h2 className="heading-2 text-balance">{section.title}</h2>}
            <div className="gsap-reveal mt-6 max-w-2xl space-y-4 text-sm leading-relaxed text-body-text sm:text-base">
                {paras.map((para, i) => (
                    <p key={i}>{para}</p>
                ))}
            </div>
        </div>
    );
}

function ImageTextSection({
    section,
    fallbackImage,
    serviceName,
}: {
    section: ServiceSectionData;
    fallbackImage: string | null;
    serviceName: string;
}) {
    const imageLeft = section.layout_variant === "image_left";
    const paras = section.payload?.paragraphs ?? paragraphs(section.description);
    const src = resolveImage(section.image) ?? fallbackImage;
    const showImage = section.payload?.show_image !== false && src !== null;

    return (
        <div className="container-nds">
            {paras.length > 0 && (
                <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                    <h2 className={`heading-2 text-balance lg:col-span-5 ${imageLeft ? "lg:order-2" : ""}`}>
                        {section.title}
                    </h2>
                    <div
                        className={`space-y-5 text-base leading-relaxed text-body-text lg:col-span-6 lg:col-start-7 lg:pt-2 ${
                            imageLeft ? "lg:order-1" : ""
                        }`}
                    >
                        {paras.map((para, i) => (
                            <p key={i}>{para}</p>
                        ))}
                    </div>
                </div>
            )}

            {showImage && src && (
                <div className="gsap-reveal mt-12 lg:mt-16">
                    <ImagePanel
                        src={src}
                        alt={`Ilustrasi layanan ${serviceName}`}
                        ratio="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]"
                    />
                    {section.payload?.caption && (
                        <p className="mt-3 text-xs text-body-text/70">{section.payload.caption}</p>
                    )}
                </div>
            )}
        </div>
    );
}

function NumberedRowsHeadingList({ section, items }: { section: ServiceSectionData; items: ServiceSectionEntry[] }) {
    return (
        <div className="container-nds grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-28">
                    <SectionHeadingBlock title={section.title} description={section.description} />
                </div>
            </div>
            <div className="lg:col-span-8">
                <ol className="gsap-reveal border-t border-border-strong">
                    {items.map((item, index) => (
                        <li key={item.title ?? index} className="border-b border-border-soft py-6 sm:py-7">
                            <div className="flex gap-5 sm:gap-8">
                                <span className="w-6 shrink-0 pt-1 text-xs font-semibold tabular-nums text-tech-blue">
                                    {stepNumber(index)}
                                </span>
                                <div className="min-w-0">
                                    <h3
                                        className={`font-bold tracking-tight text-navy ${
                                            index === 0 ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
                                        }`}
                                    >
                                        {item.title}
                                    </h3>
                                    {item.description && (
                                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-body-text sm:text-[15px]">
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}

function NumberedColumnsList({ section, items }: { section: ServiceSectionData; items: ServiceSectionEntry[] }) {
    return (
        <div className="container-nds">
            <SectionHeadingBlock title={section.title} description={section.description} />
            <ol className="gsap-reveal mt-10 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {items.map((item, index) => (
                    <li key={item.title ?? index} className="border-b border-border-soft py-5">
                        <div className="flex gap-5">
                            <span className="pt-0.5 text-xs font-semibold tabular-nums text-tech-blue">
                                {stepNumber(index)}
                            </span>
                            <div className="min-w-0">
                                <h3 className="text-base font-bold leading-snug text-navy sm:text-lg">{item.title}</h3>
                                {item.description && (
                                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-body-text">{item.description}</p>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}

/**
 * feature_grid: solusi dan keunggulan. Style `rows` menyusun daftar bernomor
 * memanjang, `columns` menyusun kartu dalam grid, `numbered_columns` daftar
 * bernomor dua kolom (geser kiri-kanan secara berpasangan).
 */
function FeatureGridSection({ section }: { section: ServiceSectionData }) {
    const items = section.payload?.items ?? [];
    if (items.length === 0) return null;

    const style =
        section.payload?.style ??
        (section.layout_variant === "columns"
            ? "cards"
            : section.layout_variant === "numbered_columns"
              ? "numbered_columns"
              : "rows");

    if (style === "numbered_columns") {
        return <NumberedColumnsList section={section} items={items} />;
    }
    return <NumberedRowsHeadingList section={section} items={items} />;
}

/**
 * benefit_list: manfaat bagi bisnis dalam bentuk daftar bernomor (heading kiri),
 * kartu ikon kolom, atau kartu ringkas dua kolom.
 */
function BenefitListSection({ section }: { section: ServiceSectionData }) {
    const items = section.payload?.items ?? [];
    if (items.length === 0) return null;

    const style = section.payload?.style ?? "compact_cards";

    if (style === "numbered_rows") {
        return (
            <div className="container-nds grid gap-10 lg:grid-cols-12 lg:gap-16">
                <h2 className="heading-2 text-balance lg:col-span-5">{section.title}</h2>
                <ol className="gsap-reveal border-t border-border-strong lg:col-span-7">
                    {items.map((item, index) => (
                        <li key={item.title ?? index} className="grid grid-cols-[auto_1fr] gap-5 border-b border-border-soft py-7 sm:gap-8">
                            <span className="pt-0.5 text-xs font-semibold tabular-nums text-tech-blue">
                                {stepNumber(index)}
                            </span>
                            <div className="min-w-0">
                                <h3 className="text-lg font-bold leading-snug text-navy sm:text-xl">{item.title}</h3>
                                {item.description && (
                                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-body-text sm:text-base">
                                        {item.description}
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        );
    }

    if (style === "columns") {
        return (
            <div className="container-nds">
                <SectionHeadingBlock title={section.title} description={section.description} />
                <ul className="gsap-reveal mt-12 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-5">
                    {items.map((item, index) => {
                        const Icon = item.icon && item.icon in ICONS ? ICONS[item.icon as IconName] : null;
                        return (
                            <li
                                key={item.title ?? index}
                                className="border-t border-border-strong pt-5 pb-8 lg:pb-0"
                            >
                                {Icon ? <Icon className="h-5 w-5 text-tech-blue" aria-hidden="true" /> : null}
                                <h3 className={`text-[15px] font-bold leading-snug text-navy ${Icon ? "mt-4" : ""}`}>
                                    {item.title}
                                </h3>
                                {item.description && (
                                    <p className="mt-2 text-[13px] leading-relaxed text-body-text">{item.description}</p>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }

    return (
        <div className="container-nds">
            {section.title && <h2 className="text-base font-bold text-navy sm:text-lg">{section.title}</h2>}
            <ul className={`gsap-reveal grid gap-3 sm:grid-cols-2 ${section.title ? "mt-5" : ""}`}>
                {items.map((item, index) => (
                    <li
                        key={item.title ?? index}
                        className="flex items-start gap-3 rounded-xl border border-border-soft bg-white p-4 text-xs text-body-dark shadow-2xs sm:text-sm"
                    >
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-tech-blue" />
                        <span>
                            {item.title}
                            {item.description && <span className="mt-1 block text-body-text">{item.description}</span>}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

const TIMELINE_COLS = ["lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4", "lg:grid-cols-5", "lg:grid-cols-6"];

/** process_timeline: alur kerja yang memang benar-benar berurutan. */
function ProcessTimelineSection({ section }: { section: ServiceSectionData }) {
    const steps = section.payload?.steps ?? [];
    if (steps.length === 0) return null;
    const horizontal = (section.payload?.orientation ?? section.layout_variant) === "horizontal";

    if (horizontal) {
        const cols = TIMELINE_COLS[Math.min(steps.length, TIMELINE_COLS.length) - 1];
        return (
            <div className="container-nds">
                <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-12">
                    <h2 className="heading-2 text-balance lg:col-span-7">{section.title}</h2>
                    {section.description && (
                        <p className="text-sm leading-relaxed text-body-text sm:text-base lg:col-span-5">
                            {section.description}
                        </p>
                    )}
                </div>
                <ol className={`gsap-reveal relative mt-12 lg:mt-16 lg:grid ${cols} lg:gap-6`}>
                    <span
                        aria-hidden="true"
                        className="absolute top-2 bottom-2 left-[3px] w-px bg-border-strong lg:top-0 lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-auto"
                    />
                    {steps.map((step, index) => (
                        <li key={step.title} className="relative pb-9 pl-7 last:pb-0 lg:pt-8 lg:pb-0 lg:pl-0">
                            <span
                                aria-hidden="true"
                                className="absolute top-1.5 left-0 h-[7px] w-[7px] -translate-x-[3px] rounded-full bg-tech-blue lg:top-0 lg:-translate-y-[3px] lg:translate-x-0"
                            />
                            <span className="text-xs font-semibold tabular-nums text-tech-blue">{stepNumber(index)}</span>
                            <h3 className="mt-2 text-base font-bold leading-snug text-navy">{step.title}</h3>
                            {step.description && <p className="mt-2 text-sm leading-relaxed text-body-text">{step.description}</p>}
                        </li>
                    ))}
                </ol>
            </div>
        );
    }

    return (
        <div className="container-nds">
            <SectionHeadingBlock title={section.title} description={section.description} />
            <div className="gsap-reveal mt-8 space-y-3.5">
                {steps.map((step, index) => (
                    <div
                        key={step.title}
                        className="flex items-start gap-4 rounded-xl border border-border-soft bg-white p-4 shadow-subtle transition-colors hover:border-tech-blue/30"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy text-xs font-bold text-white shadow-xs">
                            {index + 1}
                        </span>
                        <div className="min-w-0 pt-1">
                            <p className="text-sm font-semibold text-body-dark">{step.title}</p>
                            {step.description && <p className="mt-1 text-xs text-body-text sm:text-sm">{step.description}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ImageShowcaseSection({
    section,
    fallbackImage,
    serviceName,
}: {
    section: ServiceSectionData;
    fallbackImage: string | null;
    serviceName: string;
}) {
    const src = resolveImage(section.image) ?? fallbackImage;
    if (!src) return null;

    return (
        <div className="container-nds">
            <SectionHeadingBlock title={section.title} description={section.description} />
            <ImagePanel src={src} alt={`Galeri layanan ${serviceName}`} ratio="aspect-[4/3] sm:aspect-[16/9]" />
            {section.payload?.caption && <p className="mt-3 text-xs text-body-text/70">{section.payload.caption}</p>}
        </div>
    );
}

function FaqSection({ section }: { section: ServiceSectionData }) {
    // Jawaban yang belum diisi admin tidak tampil di halaman publik.
    const items = (section.payload?.items ?? []).filter(
        (item) => item.question && item.answer,
    );
    if (items.length === 0) return null;

    return (
        <div className="container-nds max-w-3xl">
            <h2 className="heading-2 flex items-center gap-3">
                <HelpCircle className="h-7 w-7 text-tech-blue" aria-hidden="true" />
                <span>{section.title ?? "Pertanyaan yang Sering Diajukan"}</span>
            </h2>
            <Accordion type="single" collapsible className="gsap-reveal mt-8 w-full">
                {items.map((item, index) => (
                    <AccordionItem key={index} value={`faq-${section.id}-${index}`}>
                        <AccordionTrigger>{item.question}</AccordionTrigger>
                        <AccordionContent>{item.answer}</AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}

function CtaBannerSection({ section }: { section: ServiceSectionData }) {
    const ctaHref = section.payload?.cta_url || route("contact");
    const ctaLabel = section.payload?.cta_text || "Jadwalkan Diskusi";
    const secondaryHref = section.payload?.secondary_cta_url;
    const secondaryLabel = section.payload?.secondary_cta_text;

    return (
        <div className="container-nds">
            <div className="rounded-2xl bg-navy px-6 py-12 sm:px-12 lg:px-16">
                <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                    <div className="lg:col-span-8">
                        <h2 className="heading-2 text-balance text-white">{section.title}</h2>
                        {section.description && (
                            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
                                {section.description}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3.5 lg:col-span-4 lg:justify-end">
                        <Button asChild variant="primaryOnDark" size="lg" className="font-bold">
                            {ctaHref.startsWith("/") ? (
                                <Link href={ctaHref}>
                                    <span>{ctaLabel}</span>
                                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                </Link>
                            ) : (
                                <a href={ctaHref}>
                                    <span>{ctaLabel}</span>
                                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                </a>
                            )}
                        </Button>
                        {secondaryHref && secondaryLabel && (
                            <Button asChild variant="outlineLight" size="lg">
                                <Link href={secondaryHref}>
                                    <span>{secondaryLabel}</span>
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Latar tiap section diselang otomatis sesuai posisi urutan di halaman. */
export const isSpecialSection = (type: string): boolean => type === "cta_banner" || type === "faq";

export function ServiceSectionRenderer({
    section,
    index,
    fallbackImage,
    serviceName,
}: {
    section: ServiceSectionData;
    index: number;
    fallbackImage: string | null;
    serviceName: string;
}) {
    if (section.is_visible === false) return null;

    const tone = index % 2 === 0 ? "bg-white" : "bg-light-gray";
    const wrapper = isSpecialSection(section.type)
        ? section.type === "cta_banner"
            ? "bg-white py-4 pb-20 lg:pb-24"
            : "bg-white py-20 lg:py-24"
        : `${tone} py-16 lg:py-24`;

    let content: React.ReactNode = null;
    switch (section.type) {
        case "text":
            content = <TextSection section={section} />;
            break;
        case "image_text":
            content = <ImageTextSection section={section} fallbackImage={fallbackImage} serviceName={serviceName} />;
            break;
        case "feature_grid":
            content = <FeatureGridSection section={section} />;
            break;
        case "benefit_list":
            content = <BenefitListSection section={section} />;
            break;
        case "process_timeline":
            content = <ProcessTimelineSection section={section} />;
            break;
        case "image_showcase":
            content = <ImageShowcaseSection section={section} fallbackImage={fallbackImage} serviceName={serviceName} />;
            break;
        case "faq":
            content = <FaqSection section={section} />;
            break;
        case "cta_banner":
            content = <CtaBannerSection section={section} />;
            break;
        default:
            content = <TextSection section={section} />;
    }

    if (!content) return null;

    return (
        <section className={wrapper}>
            {content}
        </section>
    );
}
