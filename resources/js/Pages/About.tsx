import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Seo } from "@/Components/Seo";
import { ServiceIcon } from "@/Components/ServiceIcon";
import { storageUrl, assetUrl } from "@/utils/assets";
import { Button } from "@/Components/ui/button";
import { Spotlight } from "@/Components/ui/Spotlight";
import { useHeroAnimation } from "@/hooks/useGsap";
import { withFrontendLayout } from "@/utils/layout";
import type { CompanySettings, ServiceItem } from "@/types";

gsap.registerPlugin(ScrollTrigger);

const values = [
    {
        title: "Integritas & Transparansi",
        description:
            "Kami mengutamakan kejujuran teknis, kejelasan ruang lingkup kerja, dan komunikasi terbuka di setiap tahapan kolaborasi.",
    },
    {
        title: "Profesionalisme Terukur",
        description:
            "Standar pengerjaan tinggi dengan metodologi yang disiplin untuk memastikan hasil implementasi stabil dan teruji.",
    },
    {
        title: "Inovasi Tepat Guna",
        description:
            "Mengadopsi teknologi modern yang benar-benar memberikan efisiensi bisnis, bukan sekadar mengikuti tren sesaat.",
    },
];

const vision =
    "Menjadi mitra teknologi yang membuat setiap organisasi di Indonesia beroperasi di atas infrastruktur digital yang stabil, aman, dan siap mengikuti pertumbuhannya.";

// Misi disusun dari pendekatan kerja yang sudah dijalankan NDS, bukan dari
// klaim atau target baru.
const missions = [
    "Memetakan arsitektur dan kebutuhan nyata bisnis sebelum merancang solusi.",
    "Menyusun solusi terpadu yang selaras dengan kapasitas dan prioritas anggaran organisasi.",
    "Mengimplementasikan secara bertahap dengan monitoring ketat dan pengujian menyeluruh.",
    "Menyerahkan dokumentasi lengkap dan transfer wawasan kepada tim internal klien.",
    "Mendampingi klien setelah implementasi melalui dukungan dan konsultasi lanjutan.",
];

const reasons = [
    {
        title: "Solusi mengikuti kebutuhan",
        description:
            "Ruang lingkup disusun dari hasil konsultasi awal, bukan dari paket yang sudah jadi. Organisasi hanya mengadopsi yang benar-benar dipakai.",
    },
    {
        title: "Kualitas implementasi",
        description:
            "Pengerjaan bertahap dengan pengujian di setiap tahap, sehingga perubahan dapat diverifikasi sebelum masuk ke lingkungan produksi.",
    },
    {
        title: "Pendampingan setelah implementasi",
        description:
            "Dokumentasi, transfer wawasan ke tim internal, dan konsultasi lanjutan saat kebutuhan teknologi berubah.",
    },
    {
        title: "Satu ekosistem, bukan proyek terpisah",
        description:
            "Aplikasi, jaringan, server, dan keamanan fisik dirancang agar saling terhubung dan mudah dirawat dalam jangka panjang.",
    },
];

const fallbackParagraphs = [
    "Nusantara Digital Solution lahir dari komitmen untuk membantu pelaku usaha dan institusi di Indonesia mengoptimalkan operasional melalui pemanfaatan teknologi yang tepat dan efisien.",
    "Layanan kami mencakup pengembangan website dan aplikasi bisnis, penataan infrastruktur jaringan dan server, konsultasi arsitektur IT, hingga keamanan fisik terintegrasi CCTV.",
    "Kami percaya bahwa teknologi terbaik adalah teknologi yang relevan dan memberikan dampak langsung pada stabilitas dan pertumbuhan organisasi Anda.",
];

interface PageContent {
    slug: string;
    title: string;
    hero_title?: string | null;
    hero_description?: string | null;
    content?: string | null;
    image?: string | null;
}

interface AboutProps {
    settings?: CompanySettings;
    page?: PageContent | null;
    services?: ServiceItem[];
}

/**
 * Animasi halaman dibatasi ke elemen di dalam root halaman Tentang Kami agar
 * tidak bertabrakan dengan reveal global di FrontendLayout. Elemen tetap
 * terlihat bila JavaScript mati atau pengguna meminta gerak minimal.
 */
function useAboutMotion(rootRef: RefObject<HTMLElement | null>) {
    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const media = gsap.matchMedia();

        const context = gsap.context(() => {
            root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => {
                gsap.from(element, {
                    opacity: 0,
                    y: 28,
                    duration: 0.85,
                    ease: "power3.out",
                    scrollTrigger: { trigger: element, start: "top 88%", once: true },
                });
            });

            root.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach((group) => {
                gsap.from(Array.from(group.children), {
                    opacity: 0,
                    y: 24,
                    duration: 0.7,
                    stagger: 0.09,
                    ease: "power2.out",
                    scrollTrigger: { trigger: group, start: "top 85%", once: true },
                });
            });

            root.querySelectorAll<HTMLElement>("[data-mask]").forEach((frame) => {
                const image = frame.querySelector<HTMLElement>("img");
                const timeline = gsap.timeline({
                    scrollTrigger: { trigger: frame, start: "top 85%", once: true },
                });

                timeline.fromTo(
                    frame,
                    { clipPath: "inset(0% 0% 100% 0%)" },
                    { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power3.inOut" }
                );

                if (image) {
                    timeline.from(image, { scale: 1.08, duration: 1.4, ease: "power2.out" }, 0);
                }
            });

            media.add("(min-width: 1024px)", () => {
                const frame = root.querySelector<HTMLElement>("[data-parallax]");
                const image = frame?.querySelector<HTMLElement>("img");
                if (!frame || !image) return;

                gsap.fromTo(
                    image,
                    { yPercent: -3.5 },
                    {
                        yPercent: 3.5,
                        ease: "none",
                        scrollTrigger: {
                            trigger: frame,
                            start: "top bottom",
                            end: "bottom top",
                            scrub: 0.6,
                        },
                    }
                );
            });
        }, root);

        return () => {
            context.revert();
            media.kill();
        };
    }, [rootRef]);
}

function About({ settings, page, services = [] }: AboutProps) {
    useHeroAnimation();

    const pageRef = useRef<HTMLDivElement>(null);
    useAboutMotion(pageRef);

    const [activeServiceId, setActiveServiceId] = useState<number | null>(services[0]?.id ?? null);
    const activeService = services.find((service) => service.id === activeServiceId) ?? services[0];
    const previewImage = services.find((service) => service.id === activeService?.id && service.image);

    const networkFallback = services.find((service) => service.slug === "management-network")?.image;
    const aboutImage = page?.image
        ? storageUrl(page.image)
        : networkFallback
          ? storageUrl(networkFallback)
          : assetUrl("images/hero-bg.jpg");

    const aboutImageAlt = page?.image
        ? page.title
        : "Port jaringan pada perangkat server, bagian dari layanan infrastruktur NDS";

    return (
        <>
            <Seo
                title={page?.title || "Tentang Kami"}
                description={
                    page?.hero_description ||
                    settings?.company_description ||
                    "Kenali Nusantara Digital Solution, mitra terpercaya untuk transformasi teknologi dan infrastruktur bisnis Anda."
                }
            />

            {/* Hero Section — layout, background, dan animasi dipertahankan. */}
            <section className="relative overflow-hidden bg-navy pt-24 pb-12 sm:pt-28 lg:pt-28 lg:pb-16 xl:pt-32 xl:pb-20">
                <Spotlight className="-top-24 left-1/4" fill="#4da6f8" />
                <div className="container-nds relative z-10">
                    <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
                        <div>
                            <h1 className="heading-1 text-white! opacity-0 tracking-tight" data-hero="title">
                                {page?.hero_title || "Mitra Teknologi untuk Pertumbuhan Bisnis Anda"}
                            </h1>
                        </div>
                        <div>
                            <p className="max-w-md text-base leading-relaxed text-white/80 opacity-0 sm:text-lg" data-hero="desc">
                                {page?.hero_description ||
                                    "Nusantara Digital Solution menghadirkan solusi teknologi terintegrasi untuk membantu bisnis berkembang."}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div ref={pageRef}>
                {/* A. WHO WE ARE */}
                <section className="bg-white py-20 sm:py-24 lg:py-32">
                    <div className="container-nds">
                        <div className="grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-8">
                            <div className="lg:col-span-6">
                                <div data-reveal>
                                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-tech-blue">
                                        WHO WE ARE
                                    </p>
                                    <h2 className="mt-5 text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] text-navy sm:text-[2.5rem] lg:text-[2.9rem]">
                                        Membangun solusi digital berkelanjutan
                                    </h2>
                                </div>

                                {page?.content ? (
                                    <div
                                        data-reveal
                                        className="about-copy mt-7 max-w-xl"
                                        dangerouslySetInnerHTML={{ __html: page.content }}
                                    />
                                ) : (
                                    <div data-reveal className="about-copy mt-7 max-w-xl">
                                        {fallbackParagraphs.map((paragraph) => (
                                            <p key={paragraph}>{paragraph}</p>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <figure
                                data-mask
                                data-parallax
                                className="relative aspect-[4/3] overflow-hidden bg-light-gray lg:col-span-5 lg:col-start-8 lg:aspect-[4/5]"
                            >
                                <img
                                    src={aboutImage}
                                    alt={aboutImageAlt}
                                    loading="lazy"
                                    className="absolute left-0 top-[-6%] h-[112%] w-full object-cover"
                                />
                            </figure>
                        </div>
                    </div>
                </section>

                {/* B. OUR EXPERTISE */}
                <section className="border-t border-border-soft bg-off-white py-20 sm:py-24 lg:py-28">
                    <div className="container-nds">
                        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
                            <div className="lg:col-span-5">
                                <div data-reveal>
                                    <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] text-navy sm:text-[2.5rem]">
                                        Our Expertise
                                    </h2>
                                    <p className="mt-4 max-w-md text-base leading-relaxed text-body-text sm:text-[1.0625rem]">
                                        We provide integrated technology solutions to support your business needs.
                                    </p>
                                </div>

                                {/* Pratinjau mengikuti baris yang sedang disorot. Disembunyikan
                                    di layar sempit karena informasi yang sama sudah tampil di daftar. */}
                                <div data-reveal className="mt-10 hidden lg:block" aria-hidden="true">
                                    <div className="relative aspect-[4/3] overflow-hidden border border-border-soft bg-white">
                                        {services.map((service) =>
                                            service.image ? (
                                                <img
                                                    key={service.id}
                                                    src={storageUrl(service.image)}
                                                    alt=""
                                                    loading={service.id === services[0]?.id ? "eager" : "lazy"}
                                                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                                                        activeService?.id === service.id ? "opacity-100" : "opacity-0"
                                                    }`}
                                                />
                                            ) : null
                                        )}

                                        {!previewImage && activeService && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-navy text-white">
                                                <ServiceIcon name={activeService.icon} className="h-10 w-10" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-3 text-xs font-medium text-body-text">
                                        {activeService?.name ?? "Layanan NDS"}
                                    </p>
                                </div>
                            </div>

                            <div className="lg:col-span-6 lg:col-start-7">
                                {services.length > 0 ? (
                                    <ul data-reveal-group className="border-t border-border-soft">
                                        {services.map((service, index) => (
                                            <li key={service.id} className="border-b border-border-soft">
                                                <Link
                                                    href={route("services.show", service.slug)}
                                                    onMouseEnter={() => setActiveServiceId(service.id)}
                                                    onFocus={() => setActiveServiceId(service.id)}
                                                    className="group flex items-start gap-4 py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:ring-offset-2 sm:gap-6 sm:py-7"
                                                >
                                                    <span className="w-7 shrink-0 pt-1.5 text-xs font-semibold tabular-nums text-body-text transition-colors duration-300 group-hover:text-tech-blue">
                                                        {String(index + 1).padStart(2, "0")}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-lg font-semibold tracking-[-0.01em] text-navy transition-colors duration-300 group-hover:text-tech-blue sm:text-xl">
                                                            {service.name}
                                                        </span>
                                                        {service.short_description && (
                                                            <span className="mt-1.5 block max-w-lg text-sm leading-relaxed text-body-text">
                                                                {service.short_description}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border-strong/60 text-navy transition-colors duration-300 group-hover:border-tech-blue group-hover:bg-tech-blue group-hover:text-white">
                                                        <ServiceIcon name={service.icon} className="h-5 w-5" />
                                                    </span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="border-t border-border-soft pt-6 text-sm leading-relaxed text-body-text">
                                        Daftar layanan belum tersedia. Silakan hubungi tim NDS untuk informasi terbaru.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* C. VISION & MISSION */}
                <section className="border-y border-white/10 bg-deep-navy py-20 sm:py-24 lg:py-32">
                    <div className="container-nds">
                        <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
                            <div className="lg:col-span-7">
                                <h2 data-reveal className="text-sm font-semibold text-electric-light">
                                    Our Vision
                                </h2>
                                <p
                                    data-reveal
                                    className="mt-6 max-w-[24ch] text-[1.75rem] font-semibold leading-[1.28] tracking-[-0.02em] text-white sm:max-w-[30ch] sm:text-[2.1rem] lg:text-[2.6rem]"
                                >
                                    {vision}
                                </p>
                            </div>

                            <div className="lg:col-span-4 lg:col-start-9">
                                <h3 data-reveal className="text-sm font-semibold text-white/60">
                                    Misi kami
                                </h3>
                                <ol data-reveal-group className="mt-5 border-t border-white/15">
                                    {missions.map((mission, index) => (
                                        <li
                                            key={mission}
                                            className="flex gap-5 border-b border-white/10 py-4 last:border-b-0"
                                        >
                                            <span className="pt-0.5 text-xs font-semibold tabular-nums text-electric-light">
                                                {String(index + 1).padStart(2, "0")}
                                            </span>
                                            <span className="text-sm leading-[1.7] text-white/75">{mission}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                </section>

                {/* D. OUR VALUES */}
                <section className="bg-white py-20 sm:py-24 lg:py-32">
                    <div className="container-nds">
                        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
                            <h2
                                data-reveal
                                className="text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] text-navy sm:text-[2.5rem] lg:col-span-6"
                            >
                                Nilai yang menuntun setiap kolaborasi
                            </h2>
                            <p
                                data-reveal
                                className="max-w-md text-base leading-relaxed text-body-text lg:col-span-5 lg:col-start-8"
                            >
                                Komitmen moral dan profesional yang kami jaga dalam melayani setiap klien dan mitra
                                kerja.
                            </p>
                        </div>

                        <div data-reveal-group className="mt-12 border-t border-navy/15 sm:mt-14">
                            {values.map((value) => (
                                <div
                                    key={value.title}
                                    className="group grid gap-3 border-b border-navy/10 py-8 sm:grid-cols-[minmax(0,18rem)_1fr] sm:gap-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:py-10"
                                >
                                    <h3 className="text-xl font-semibold tracking-[-0.01em] text-navy transition-colors duration-300 group-hover:text-tech-blue sm:text-2xl">
                                        {value.title}
                                    </h3>
                                    <p className="max-w-2xl text-sm leading-[1.8] text-body-text sm:text-base">
                                        {value.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* E. WHY CHOOSE NDS */}
                <section className="border-t border-border-soft bg-off-white py-20 sm:py-24 lg:py-28">
                    <div className="container-nds grid gap-12 lg:grid-cols-12 lg:gap-8">
                        <div className="lg:col-span-5">
                            <h2
                                data-reveal
                                className="text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] text-navy sm:text-[2.5rem]"
                            >
                                Mengapa memilih NDS
                            </h2>
                            <p data-reveal className="mt-5 max-w-md text-base leading-relaxed text-body-text">
                                Setiap penugasan dimulai dari pemetaan kebutuhan, bukan dari daftar produk yang harus
                                dijual.
                            </p>
                            <div data-reveal className="mt-7">
                                <Link
                                    href={route("contact")}
                                    className="inline-flex items-center text-sm font-semibold text-navy underline decoration-border-strong underline-offset-4 transition-colors hover:text-tech-blue hover:decoration-tech-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:ring-offset-2"
                                >
                                    Diskusikan kebutuhan Anda
                                </Link>
                            </div>
                        </div>

                        <div className="lg:col-span-6 lg:col-start-7">
                            <div
                                data-reveal-group
                                className="grid border-t border-l border-border-soft sm:grid-cols-2"
                            >
                                {reasons.map((reason) => (
                                    <div
                                        key={reason.title}
                                        className="border-b border-r border-border-soft bg-white/70 p-6 sm:p-7"
                                    >
                                        <h3 className="text-base font-semibold text-navy">{reason.title}</h3>
                                        <p className="mt-2.5 text-sm leading-relaxed text-body-text">
                                            {reason.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* G. CTA KONSULTASI: section terang yang berdiri sendiri tepat
                    sebelum footer gelap, sehingga batas keduanya tegas. */}                                <section className="border-t border-border-soft bg-white py-20 sm:py-24 lg:py-28">
                    <div className="container-nds grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
                        <div className="lg:col-span-7">
                            <h2
                                data-reveal
                                className="text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] text-navy sm:text-[2.5rem] lg:text-[2.9rem]"
                            >
                                Mari petakan kebutuhan teknologi bisnis Anda
                            </h2>
                            <p data-reveal className="mt-5 max-w-xl text-base leading-relaxed text-body-text">
                                Ceritakan kondisi infrastruktur dan target yang ingin dicapai. Tim NDS akan membantu
                                menyusun langkah yang paling masuk akal untuk organisasi Anda.
                            </p>
                        </div>

                        {/* Email dan kontak umum sudah menjadi tugas footer, jadi CTA ini
                            hanya membawa satu tindakan: membuka formulir konsultasi. */}
                        <div
                            data-reveal
                            className="border-t border-border-soft pt-6 lg:col-span-4 lg:col-start-9 lg:border-l lg:border-t-0 lg:pb-1 lg:pl-8 lg:pt-0"
                        >
                            <Button asChild size="lg" className="w-full font-bold sm:w-auto">
                                <Link href={route("contact")}>
                                    <span>Buka Formulir Konsultasi</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

export default withFrontendLayout(About);
