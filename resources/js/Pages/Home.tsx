import { Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import { ArrowRight, Phone, Compass, ChevronRight } from "lucide-react";
import { Seo } from "@/Components/Seo";
import { ServicesSection } from "@/Components/ServicesSection";
import { PromoCard } from "@/Components/PromoCard";
import { ArticleCard } from "@/Components/ArticleCard";
import { CoverageCheckSection } from "@/Components/CoverageCheckSection";
import { assetUrl } from "@/utils/assets";
import ProjectsSection from "@/Components/ProjectsSection";
import { ServiceTargetsSection } from "@/Components/ServiceTargetsSection";
import { BlogCardGrid } from "@/Components/ui/BlogCardGrid";
import { Spotlight } from "@/Components/ui/Spotlight";
import { SectionHeading } from "@/Components/SectionHeading";
import { Button } from "@/Components/ui/button";
import { useGsapReveal, useHeroAnimation } from "@/hooks/useGsap";
import { withFrontendLayout } from "@/utils/layout";
import type { ArticleItem, CompanySettings, ProjectItem, PromoItem, ServiceItem } from "@/types";

interface HomeProps {
    services: ServiceItem[];
    promos: PromoItem[];
    articles: ArticleItem[];
    projects?: ProjectItem[];
    coverageServices?: string[];
    settings?: CompanySettings;
}

function formatDate(date?: string | null) {
    if (!date) return "";
    return new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function Home({ services, promos, articles, projects = [], coverageServices = [], settings }: HomeProps) {
    useHeroAnimation();
    useGsapReveal();

    const heroBg = assetUrl(settings?.hero_bg_image || "images/hero-bg.jpg");
    const heroTitle = settings?.hero_title || "Membangun Masa Depan";
    const heroSubtitle = settings?.hero_subtitle || "Lewat Keandalan Teknologi.";
    const heroDesc = settings?.hero_description || "Solusi teknologi terpadu dari infrastruktur jaringan berkecepatan tinggi, integrasi sistem server, hingga pengembangan aplikasi bisnis modern.";
    const heroCtaText = settings?.hero_cta_text || "Konsultasi Sekarang";
    const heroCtaUrl = settings?.hero_cta_url || route("contact");
    const heroSecondaryCtaText = settings?.hero_secondary_cta_text || "Jelajahi Layanan";
    const heroSecondaryCtaUrl = settings?.hero_secondary_cta_url || "#services";

    // Visibilitas Section dari Pengaturan Admin
    const showCoverage = settings?.show_coverage_section !== "0";
    const showServices = settings?.show_services_section !== "0";
    const showTargets = settings?.show_targets_section !== "0";
    const showPromos = promos.length > 0 && settings?.show_promos_section !== "0";
    const showArticles = articles.length > 0 && settings?.show_articles_section !== "0";
    const showProjects = projects.length > 0;
    const showCta = settings?.show_cta_section !== "0";

    return (
        <>
            {/* Judul & deskripsi memakai metadata SEO default dari Admin Panel */}
            <Seo title={null} />

            {/* 1. HERO SECTION — satu layar penuh (small viewport height) */}
            <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-navy">
                {/* Background image & scrim: foto penuh warna dan tajam,
                    scrim navy secukupnya agar teks putih tetap terbaca */}
                <img
                    data-hero="bg"
                    src={heroBg}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-navy/50" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-navy to-transparent" />

                {/* Subtle Ambient Spotlight from Aceternity UI */}
                <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#4da6f8" />

                {/* Konten hero: tepat di tengah secara horizontal dan vertikal */}
                <div className="container-nds relative z-10 flex flex-col items-center py-12 md:py-16 lg:py-20 text-center">
                    <div className="w-full max-w-3xl">
                        <h1 className="hero-title text-white tracking-tight leading-tight">
                            <span data-hero="title" className="block opacity-0">
                                {heroTitle}
                            </span>
                            {heroSubtitle && (
                                <span data-hero="title" className="block opacity-0">
                                    {heroSubtitle}
                                </span>
                            )}
                        </h1>

                        <p data-hero="desc" className="mx-auto mt-5 max-w-2xl text-base text-white/85 leading-relaxed opacity-0 md:text-lg">
                            {heroDesc}
                        </p>

                        <div data-hero="actions" className="mt-8 flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md mx-auto">
                            <Button asChild variant="primaryOnDark" size="lg" className="font-bold">
                                {heroCtaUrl.startsWith("http") ? (
                                    <a href={heroCtaUrl} target="_blank" rel="noopener noreferrer">
                                        <Phone className="h-4 w-4" />
                                        <span>{heroCtaText}</span>
                                    </a>
                                ) : heroCtaUrl.startsWith("#") ? (
                                    <a href={heroCtaUrl}>
                                        <Phone className="h-4 w-4" />
                                        <span>{heroCtaText}</span>
                                    </a>
                                ) : (
                                    <Link href={heroCtaUrl}>
                                        <Phone className="h-4 w-4" />
                                        <span>{heroCtaText}</span>
                                    </Link>
                                )}
                            </Button>
                            <Button asChild variant="outlineLight" size="lg" className="font-semibold">
                                {heroSecondaryCtaUrl.startsWith("http") ? (
                                    <a href={heroSecondaryCtaUrl} target="_blank" rel="noopener noreferrer">
                                        <Compass className="h-4 w-4 text-electric-light" />
                                        <span>{heroSecondaryCtaText}</span>
                                    </a>
                                ) : heroSecondaryCtaUrl.startsWith("#") ? (
                                    <a href={heroSecondaryCtaUrl}>
                                        <Compass className="h-4 w-4 text-electric-light" />
                                        <span>{heroSecondaryCtaText}</span>
                                    </a>
                                ) : (
                                    <Link href={heroSecondaryCtaUrl}>
                                        <Compass className="h-4 w-4 text-electric-light" />
                                        <span>{heroSecondaryCtaText}</span>
                                    </Link>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. SECTION: CEK JANGKAUAN LAYANAN NDS */}
            {showCoverage && <CoverageCheckSection settings={settings} coverageServices={coverageServices} />}

            {/* 3. LAYANAN KAMI */}
            {showServices && <ServicesSection services={services} />}

            {/* 4. SECTION: TARGET LAYANAN KAMI */}
            {showTargets && <ServiceTargetsSection />}

            {/* 5. PROMO PILIHAN: grid kartu yang sama dengan halaman Promo, maksimal 4 promo */}
            {showPromos && (
                <section className="bg-off-white py-20 lg:py-28 border-b border-border-soft overflow-hidden">
                    <div className="container-nds">
                        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
                            <SectionHeading
                                title="Penawaran Terbaru dari NDS"
                                description="Akselerasi digitalisasi bisnis Anda dengan penawaran spesial dan paket bundling efisiensi anggaran terbaik."
                            />
                            <Button asChild variant="secondary" className="gsap-reveal shrink-0">
                                <Link href={route("promo")} className="group">
                                    <span>Lihat Semua Promo</span>
                                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </div>

                        {/* Grid kartu promo: desain sama dengan halaman Promo. Seluruh kartu
                            adalah tautan ke /promo/{slug}; detail promo terbuka di sana sebagai
                            modal sehingga URL bisa dibagikan langsung. Jumlah kolom mengikuti
                            jumlah promo agar tidak ada slot kosong; satu promo tetap digambar
                            setengah lebar, bukan melebar penuh jadi kartu raksasa. */}
                        <div
                            className={`mt-10 grid grid-cols-1 gap-5 lg:gap-6 ${
                                promos.length >= 4
                                    ? "sm:grid-cols-2 lg:grid-cols-4"
                                    : promos.length === 3
                                      ? "sm:grid-cols-2 lg:grid-cols-3"
                                      : promos.length === 1
                                        ? "sm:max-w-sm sm:mx-auto"
                                        : "sm:grid-cols-2"
                            }`}
                        >
                            {promos.slice(0, 4).map((promo) => (
                                <PromoCard key={promo.id} promo={promo} variant="light" />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 6. PORTOFOLIO PROYEK: hasil kerja tayang di beranda, tanpa halaman terpisah */}
            {showProjects && <ProjectsSection projects={projects} />}

            {/* 7. BLOG & PUBLIKASI */}
            {showArticles && (
                <section className="bg-white py-20 lg:py-28">
                    <div className="container-nds">
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                            <SectionHeading
                                title="Artikel Teknologi & Kabar Terbaru"
                                description="Informasi praktis seputar arsitektur IT, efisiensi jaringan, dan tren transformasi digital."
                            />
                            <Button asChild variant="secondary" className="gsap-reveal shrink-0">
                                <Link href={route("blog")}>
                                    <span>Lihat Semua Artikel</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>

                        {/* Static Grid: Blog articles on homepage without carousel */}
                        <div className="mt-10">
                            <BlogCardGrid
                                items={articles}
                                getItemKey={(article) => article.id}
                                columns={3}
                                gap={24}
                                renderItem={(article, idx) => (
                                    <ArticleCard article={article} isActive={false} />
                                )}
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* 8. CTA PENUTUP */}
            {showCta && (
                <section className="relative overflow-hidden bg-navy py-20 lg:py-28 border-t border-white/10">
                    <Spotlight className="-top-20 right-0 md:right-40" fill="#4da6f8" />
                    <div className="container-nds relative z-10 text-center max-w-3xl">
                        <h2 className="gsap-reveal mt-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl tracking-tight">
                            Siap Membangun Solusi Digital Terintegrasi?
                        </h2>
                        <p className="gsap-reveal mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                            Konsultasikan kebutuhan infrastruktur, aplikasi bisnis, dan keamanan jaringan Anda bersama konsultan teknologi Nusantara Digital Solution.
                        </p>
                        {/* Satu ajakan penutup. Tombol "Jelajahi Layanan" dihapus
                            karena menduplikasi tombol sekunder pada hero. */}
                        <div className="gsap-reveal mt-8 flex justify-center">
                            <Button asChild variant="primaryOnDark" size="lg" className="px-8 font-bold">
                                <Link href={route("contact")}>
                                    <Phone className="h-4 w-4" />
                                    <span>Konsultasi Sekarang</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}

export default withFrontendLayout(Home);