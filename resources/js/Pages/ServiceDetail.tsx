import { Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import {
    ChevronRight,
    ListChecks,
    Workflow,
    CheckCircle2,
    HelpCircle,
} from "lucide-react";
import { Seo } from "@/Components/Seo";
import { storageUrl } from "@/utils/assets";
import { SectionHeading } from "@/Components/SectionHeading";
import { ServiceHero } from "@/Components/ServiceHero";
import { ServiceSectionRenderer } from "@/Components/service/ServiceSections";
import { ServiceIcon } from "@/Components/ServiceIcon";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/Components/ui/accordion";
import { useGsapReveal, useHeroAnimation } from "@/hooks/useGsap";
import { withFrontendLayout } from "@/utils/layout";
import type { CompanySettings, ServiceItem } from "@/types";

interface ServiceDetailProps {
    service: ServiceItem;
    related: ServiceItem[];
    settings?: CompanySettings;
}

// Path relatif adalah lampiran storage; path slash/http dipakai adanya.
function resolveImage(value?: string | null): string | undefined {
    const path = value?.trim();
    if (!path) return undefined;
    if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
    return storageUrl(path);
}

function ServiceDetailView({ service, related, settings }: ServiceDetailProps) {
    useHeroAnimation();
    useGsapReveal();

    // Hero: gambar layanan > gambar latar kategori (Pengaturan Situs).
    const heroBgImage =
        resolveImage(service.image) ||
        (service.category?.slug === "application"
            ? settings?.service_bg_application
            : settings?.service_bg_solution) ||
        null;

    const visibleSections = (service.sections ?? []).filter(
        (section) => section.is_visible !== false,
    );
    const view = visibleSections.length > 0
        ? <SectionedView service={service} related={related} heroBgImage={heroBgImage} />
        : <LegacyDetailView service={service} related={related} settings={settings} heroBgImage={heroBgImage} />;

    return (
        <>
            <Seo
                title={service.meta_title || `${service.name} | Solusi NDS`}
                description={service.meta_description || service.short_description || undefined}
            />
            {view}
        </>
    );
}

/** Halaman dari data section (service_sections) yang dikelola admin. */
function SectionedView({
    service,
    related,
    heroBgImage,
}: Pick<ServiceDetailProps, "service" | "related"> & { heroBgImage: string | null }) {
    const sections = (service.sections ?? []).filter(
        (section) => section.is_visible !== false,
    );
    const heroLayout = service.hero_layout === "split" ? "split" : "full";
    const fallbackImage = resolveImage(service.image) ?? null;

    return (
        <>
            <ServiceHero
                service={service}
                backgroundImage={heroBgImage}
                description={service.hero_description || service.short_description}
                layout={heroLayout}
                ctaLabel={service.hero_cta_text}
                ctaHref={service.hero_cta_url}
                secondaryLabel={service.hero_secondary_cta_text}
                secondaryHref={service.hero_secondary_cta_url || "#rincian"}
            />
            <div id="rincian" className="scroll-mt-24">
                {sections.map((section, index) => (
                    <ServiceSectionRenderer
                        key={section.id}
                        section={section}
                        index={index}
                        fallbackImage={fallbackImage}
                        serviceName={service.name}
                    />
                ))}
            </div>
            <RelatedRail related={related} />
        </>
    );
}

/** Jalur aman untuk layanan yang belum punya section sama sekali. */
function LegacyDetailView({
    service,
    related,
    settings,
    heroBgImage,
}: ServiceDetailProps & { heroBgImage: string | null }) {
    function toLines(text?: string | null): string[] {
        if (!text) return [];
        return text
            .split("\n")
            .map((l) => l.replace(/^[-•\d.\s]+/, "").trim())
            .filter(Boolean);
    }

    const benefits = toLines(service.benefits);
    const scope = toLines(service.scope);
    const workflow = toLines(service.workflow);
    const faq = (service.faq || "")
        .split("\n")
        .map((l) => l.replace(/^[-•\d.\s]+/, "").trim())
        .filter(Boolean)
        .map((line) => {
            const sep = line.indexOf("||");
            return {
                question: (sep === -1 ? line : line.slice(0, sep)).trim(),
                answer: sep === -1 ? "" : line.slice(sep + 2).trim(),
            };
        })
        .filter((f) => f.question && f.answer);
    const contentParas = (service.content || "").split("\n").filter((p) => p.trim());

    return (
        <>
            <ServiceHero
                service={service}
                backgroundImage={heroBgImage}
                description={service.hero_description || service.short_description}
                secondaryHref="#details"
                secondaryLabel={service.hero_secondary_cta_text}
                ctaLabel={service.hero_cta_text}
                ctaHref={service.hero_cta_url}
            />

            <section id="details" className="bg-white py-20 lg:py-28">
                <div className="container-nds grid gap-14 lg:grid-cols-3 items-start">
                    <div className="lg:col-span-2 space-y-12">
                        <div>
                            <SectionHeading title={`Pendekatan Kami untuk ${service.name}`} />
                            <div className="gsap-reveal mt-6 space-y-4 text-sm leading-relaxed text-body-text sm:text-base">
                                {contentParas.length > 0 ? (
                                    contentParas.map((para, i) => <p key={i}>{para}</p>)
                                ) : (
                                    <p>{service.short_description}</p>
                                )}
                            </div>
                        </div>

                        {benefits.length > 0 && (
                            <div className="gsap-reveal rounded-2xl border border-border-soft bg-light-gray/60 p-6 sm:p-8 shadow-subtle">
                                <h3 className="flex items-center gap-2.5 text-base font-bold text-navy sm:text-lg">
                                    <CheckCircle2 className="h-5 w-5 text-tech-blue" />
                                    <span>Manfaat Utama bagi Operasional Anda</span>
                                </h3>
                                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                                    {benefits.map((b) => (
                                        <li
                                            key={b}
                                            className="flex items-start gap-3 rounded-xl border border-border-soft bg-white p-4 text-xs sm:text-sm text-body-dark shadow-2xs"
                                        >
                                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-tech-blue" />
                                            <span>{b}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {scope.length > 0 && (
                            <div className="gsap-reveal">
                                <h3 className="flex items-center gap-2.5 text-base font-bold text-navy sm:text-lg">
                                    <ListChecks className="h-5 w-5 text-tech-blue" />
                                    <span>Ruang Lingkup Pekerjaan</span>
                                </h3>
                                <div className="mt-5 divide-y divide-border-soft rounded-2xl border border-border-soft bg-white shadow-subtle overflow-hidden">
                                    {scope.map((s, idx) => (
                                        <div key={s} className="flex items-start gap-3.5 p-4 text-xs sm:text-sm text-body-dark hover:bg-navy/5 transition-colors">
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-tech-blue/10 text-[11px] font-bold text-tech-blue">
                                                {idx + 1}
                                            </span>
                                            <span className="pt-0.5">{s}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {workflow.length > 0 && (
                            <div className="gsap-reveal">
                                <h3 className="flex items-center gap-2.5 text-base font-bold text-navy sm:text-lg">
                                    <Workflow className="h-5 w-5 text-tech-blue" />
                                    <span>Tahapan Pelaksanaan Proyek</span>
                                </h3>
                                <div className="mt-6 space-y-3.5">
                                    {workflow.map((step, i) => (
                                        <div
                                            key={step}
                                            className="flex items-start gap-4 rounded-xl border border-border-soft bg-white p-4 shadow-subtle hover:border-tech-blue/30 transition-colors"
                                        >
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy text-xs font-bold text-white shadow-xs">
                                                {i + 1}
                                            </span>
                                            <div className="min-w-0 pt-1">
                                                <p className="text-sm font-semibold text-body-dark">{step}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {faq.length > 0 && (
                            <div className="gsap-reveal">
                                <h3 className="flex items-center gap-2.5 text-base font-bold text-navy sm:text-lg mb-5">
                                    <HelpCircle className="h-5 w-5 text-tech-blue" />
                                    <span>Pertanyaan yang Sering Diajukan (FAQ)</span>
                                </h3>
                                <Accordion type="single" collapsible className="w-full">
                                    {faq.map((f, idx) => (
                                        <AccordionItem key={idx} value={`item-${idx}`}>
                                            <AccordionTrigger>{f.question}</AccordionTrigger>
                                            <AccordionContent>{f.answer}</AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        )}
                    </div>

                    {/* CTA konsultasi sudah ada di hero, jadi rail ini hanya memuat
                        layanan terkait tanpa mengulang ajakan yang sama. */}
                    <aside className="lg:col-span-1 lg:sticky lg:top-24">
                        <RelatedCard related={related} />
                    </aside>
                </div>
            </section>
        </>
    );
}

function RelatedCard({ related }: { related: ServiceItem[] }) {
    return (
        <div className="gsap-reveal rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
            <h4 className="text-xs font-bold uppercase tracking-wider text-body-text border-b border-border-soft pb-3">
                Layanan Terkait Lainnya
            </h4>
            <div className="mt-4 divide-y divide-border-soft">
                {related.map((r) => (
                    <RelatedLink key={r.id} service={r} />
                ))}
            </div>
        </div>
    );
}

/** Rail layanan terkait untuk halaman berbasis section. */
function RelatedRail({ related }: { related: ServiceItem[] }) {
    if (related.length === 0) return null;
    return (
        <section className="bg-light-gray py-16 lg:py-20">
            <div className="container-nds">
                <h2 className="heading-2">Layanan Terkait Lainnya</h2>
                <div className="gsap-reveal mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {related.map((r) => (
                        <Link
                            key={r.id}
                            href={route("services.show", r.slug)}
                            className="group rounded-2xl border border-border-soft bg-white p-5 shadow-subtle transition-shadow hover:shadow-md"
                        >
                            <div className="flex items-center gap-2.5">
                                <ServiceIcon name={r.icon} className="h-4 w-4 text-tech-blue" />
                                <span className="text-sm font-bold text-navy">{r.name}</span>
                            </div>
                            {r.short_description && (
                                <p className="mt-2 text-xs leading-relaxed text-body-text">{r.short_description}</p>
                            )}
                            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-tech-blue">
                                Selengkapnya
                                <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

function RelatedLink({ service }: { service: ServiceItem }) {
    return (
        <Link
            href={route("services.show", service.slug)}
            className="group flex items-center justify-between py-3 text-xs font-semibold text-navy hover:text-tech-blue transition-colors"
        >
            <div className="flex items-center gap-2.5">
                <ServiceIcon name={service.icon} className="h-4 w-4 text-tech-blue" />
                <span>{service.name}</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-body-text/60 transition-transform group-hover:translate-x-0.5 group-hover:text-tech-blue" />
        </Link>
    );
}

// Inertia memakai ulang komponen yang sama saat berpindah antar layanan, sehingga
// effect animasi (mount-only) tidak berjalan lagi. Key per slug memaksa hero dan
// reveal dijalankan ulang untuk layanan yang baru dibuka.
function ServiceDetail(props: ServiceDetailProps) {
    return <ServiceDetailView key={props.service.slug} {...props} />;
}

export default withFrontendLayout(ServiceDetail);
