import { Link, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { useState } from "react";
import { Search, CalendarDays, User, BookOpen, ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Seo } from "@/Components/Seo";
import { Button } from "@/Components/ui/button";
import { Spotlight } from "@/Components/ui/Spotlight";
import { storageUrl } from "@/utils/assets";
import { ArticleCarousel } from "@/Components/ui/ArticleCarousel";
import { useGsapReveal, useHeroAnimation } from "@/hooks/useGsap";
import { withFrontendLayout } from "@/utils/layout";
import type { ArticleCategory, ArticleItem, Paginated } from "@/types";

interface BlogProps {
    articles: Paginated<ArticleItem>;
    categories: ArticleCategory[];
    filters: { category?: string; q?: string };
}

function formatDate(date?: string | null) {
    if (!date) return "";
    return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function Blog({ articles, categories, filters }: BlogProps) {
    useHeroAnimation();
    useGsapReveal();

    const [search, setSearch] = useState(filters.q || "");

    const applyFilter = (key: string, value?: string) => {
        const params: Record<string, string | undefined> = { ...filters, [key]: value || undefined };
        if (key !== "q") params.q = search || undefined;
        router.get(route("blog"), params, { preserveState: true, replace: true });
    };

    return (
        <>
            <Seo
                title="Wawasan & Artikel Teknologi"
                description="Artikel mendalam, panduan praktis, kabar perkembangan, dan tren IT dari tim konsultan Nusantara Digital Solution."
            />

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-navy pt-24 pb-12 sm:pt-28 lg:pt-28 lg:pb-16 xl:pt-32 xl:pb-20">
                <Spotlight className="-top-24 left-1/3" fill="#4da6f8" />
                <div className="container-nds relative z-10">
                    <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
                        <div>
                            <h1 className="heading-1 text-white! opacity-0 tracking-tight" data-hero="title">
                                Wawasan & Edukasi Teknologi
                            </h1>
                        </div>
                        <div>
                            <p className="max-w-md text-base leading-relaxed text-white/80 opacity-0 sm:text-lg" data-hero="desc">
                                Temukan analisis tren arsitektur digital, strategi keamanan jaringan, panduan implementasi cloud server, dan kabar terbaru dari NDS.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Listing Section */}
            <section className="bg-light-gray py-10 lg:py-16 xl:py-20">
                <div className="container-nds">
                    {/* Filter and Search Bar */}
                    <div className="gsap-reveal flex flex-col gap-4 rounded-2xl border border-border-soft bg-white p-4 shadow-subtle sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        {/* Category filter pills */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => applyFilter("category", undefined)}
                                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                                    !filters.category
                                        ? "bg-navy text-white shadow-xs"
                                        : "border border-border-soft bg-white text-navy/70 hover:bg-navy/5 hover:text-navy"
                                }`}
                            >
                                Semua Kategori
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => applyFilter("category", cat.slug)}
                                    className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                                        filters.category === cat.slug
                                            ? "bg-navy text-white shadow-xs"
                                            : "border border-border-soft bg-white text-navy/70 hover:bg-navy/5 hover:text-navy"
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                applyFilter("q", search);
                            }}
                            className="relative w-full sm:w-72"
                        >
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-body-text/60" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari topik artikel..."
                                className="h-11 min-h-11 w-full rounded-xl border border-border-soft bg-white pl-10 pr-9 text-xs sm:text-sm text-navy placeholder:text-body-text/50 focus:border-tech-blue focus:outline-none focus:ring-2 focus:ring-tech-blue/20"
                                aria-label="Cari artikel"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        applyFilter("q", "");
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-body-text/60 hover:text-navy p-1.5 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Articles Grid */}
                    {articles.data.length === 0 ? (
                        <div className="gsap-reveal mt-12 rounded-2xl border border-border-soft bg-white p-12 text-center shadow-subtle">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-light-gray text-body-text">
                                <BookOpen className="h-6 w-6 text-tech-blue" />
                            </div>
                            <h2 className="mt-4 text-base font-bold text-navy sm:text-lg">Tidak ada artikel ditemukan</h2>
                            <p className="mt-1.5 text-xs text-body-text sm:text-sm">
                                Silakan gunakan kata kunci lain atau pilih kategori yang berbeda.
                            </p>
                            <div className="mt-6">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setSearch("");
                                        router.get(route("blog"));
                                    }}
                                >
                                    Reset Semua Filter
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Slider Carousel: Blog page with navigation but no infinite loop */}
                            <div className="mt-8">
                                <ArticleCarousel
                                    key={`${filters.category ?? "semua"}-${filters.q ?? ""}-${articles.current_page}`}
                                    items={articles.data}
                                    getItemKey={(article) => article.id}
                                    ariaLabel="Koleksi artikel dan publikasi NDS"
                                    renderItem={(article) => (
                                        <div className="h-full">
                                            <Link
                                                href={route("blog.show", article.slug)}
                                                draggable={false}
                                                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border-soft bg-white transition-all duration-300 hover:border-tech-blue/40 hover:shadow-card-hover"
                                            >
                                                <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-light-gray">
                                                    {article.image ? (
                                                        <img
                                                            src={storageUrl(article.image)}
                                                            alt={article.title}
                                                            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                                            loading="lazy"
                                                            draggable={false}
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy via-navy to-tech-blue p-6 text-center">
                                                            <span className="text-xs font-bold uppercase tracking-widest text-white/80">
                                                                {article.category?.name || "NDS Insight"}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {article.category && (
                                                        <span className="absolute left-3 top-3 rounded-full bg-navy/85 px-3 py-1 text-[11px] font-bold text-white shadow-xs backdrop-blur-xs border border-white/20">
                                                            {article.category.name}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-1 flex-col p-5">
                                                    <div className="flex items-center gap-2 text-xs text-body-text/80">
                                                        <CalendarDays className="h-3.5 w-3.5 text-tech-blue" />
                                                        <span>{formatDate(article.published_at)}</span>
                                                    </div>

                                                    <h2 className="mt-3 line-clamp-2 text-base font-bold text-navy transition-colors group-hover:text-tech-blue sm:text-lg">
                                                        {article.title}
                                                    </h2>

                                                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-body-text sm:text-sm">
                                                        {article.excerpt}
                                                    </p>

                                                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-border-soft/60 pt-4 text-xs">
                                                        <span className="min-w-0 truncate font-semibold text-body-text">
                                                            {article.author || "Tim NDS"}
                                                        </span>
                                                        <span className="inline-flex shrink-0 items-center gap-1 font-bold text-tech-blue group-hover:text-tech-blue-hover">
                                                            <span>Baca Artikel</span>
                                                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    )}
                                />
                            </div>

                            {/* Pagination */}
                            {articles.last_page > 1 && (
                                <nav aria-label="Navigasi halaman artikel" className="gsap-reveal mt-12 flex items-center justify-center gap-2">
                                    {articles.current_page > 1 ? (
                                        <Link
                                            href={route("blog", { page: articles.current_page - 1, category: filters.category, q: filters.q })}
                                            className="btn-secondary touch-target h-11 w-11 rounded-xl"
                                            aria-label="Halaman sebelumnya"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Link>
                                    ) : (
                                        <span className="flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-xl border border-border-soft/60 bg-white/50 text-body-text/40">
                                            <ChevronLeft className="h-4 w-4" />
                                        </span>
                                    )}

                                    {Array.from({ length: articles.last_page }, (_, i) => i + 1).map((page) => (
                                        <Link
                                            key={page}
                                            href={route("blog", { page, category: filters.category, q: filters.q })}
                                            aria-current={page === articles.current_page ? "page" : undefined}
                                            className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-tech-blue ${
                                                page === articles.current_page
                                                    ? "bg-navy text-white shadow-xs"
                                                    : "border border-border-soft bg-white text-navy hover:bg-navy/5"
                                            }`}
                                        >
                                            {page}
                                        </Link>
                                    ))}

                                    {articles.current_page < articles.last_page ? (
                                        <Link
                                            href={route("blog", { page: articles.current_page + 1, category: filters.category, q: filters.q })}
                                            className="btn-secondary touch-target h-11 w-11 rounded-xl"
                                            aria-label="Halaman berikutnya"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    ) : (
                                        <span className="flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-xl border border-border-soft/60 bg-white/50 text-body-text/40">
                                            <ChevronRight className="h-4 w-4" />
                                        </span>
                                    )}
                                </nav>
                            )}
                        </>
                    )}
                </div>
            </section>
        </>
    );
}

export default withFrontendLayout(Blog);