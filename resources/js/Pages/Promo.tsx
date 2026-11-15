import { useState, useRef } from "react";
import { Link, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { Search, X, ChevronLeft, ChevronRight, Tag, RotateCcw } from "lucide-react";
import { Seo } from "@/Components/Seo";
import { PromoCard } from "@/Components/PromoCard";
import { PromoDetailModal } from "@/Components/PromoDetailModal";
import { Button } from "@/Components/ui/button";
import { Spotlight } from "@/Components/ui/Spotlight";
import { useGsapReveal, useHeroAnimation } from "@/hooks/useGsap";
import { withFrontendLayout } from "@/utils/layout";
import type { Paginated, PromoItem } from "@/types";

interface PromoProps {
    promos: Paginated<PromoItem>;
    categories?: Array<{ id: number; name: string; slug: string; promos_count?: number }>;
    filters?: { category?: string; q?: string };
    /** Promo dari URL /promo/{slug}: modal detail terbuka otomatis untuk promo ini. */
    promo?: PromoItem | null;
}

function Promo({ promos, categories = [], filters, promo }: PromoProps) {
    useHeroAnimation();
    useGsapReveal();

    const categoryTabs = [
        { id: "all", name: "Semua Promo", slug: "" },
        ...categories.map((c) => ({
            id: String(c.id),
            name: c.name,
            slug: c.slug,
        })),
        { id: "terbatas", name: "Promo Terbatas", slug: "promo-terbatas" },
    ];

    const [search, setSearch] = useState(filters?.q || "");
    const tabsRef = useRef<HTMLDivElement>(null);

    const activeCategory = filters?.category || "";
    const activeSearch = filters?.q || "";
    const isFiltered = Boolean(activeCategory || activeSearch);

    // Modal detail promo dipandu URL: kartu membuka /promo/{slug} dan modal
    // menutup dengan kembali ke /promo, sehingga tombol back browser dan
    // pembagian URL selalu konsisten dengan promo yang tampil.
    const closePromo = () => {
        const params: Record<string, string> = {};
        if (activeCategory) params.category = activeCategory;
        if (activeSearch) params.q = activeSearch;

        router.get(route("promo"), params, {
            preserveScroll: true,
            replace: true,
        });
    };

    const applyFilter = (key: "category" | "q", value?: string) => {
        const params: Record<string, string | undefined> = {
            category: filters?.category || undefined,
            q: filters?.q || undefined,
        };

        if (key === "category") {
            params.category = value || undefined;
        } else if (key === "q") {
            params.q = value || undefined;
        }

        if (!params.category) delete params.category;
        if (!params.q) delete params.q;

        router.get(route("promo"), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter("q", search.trim());
    };

    const handleClearSearch = () => {
        setSearch("");
        applyFilter("q", "");
    };

    const handleResetAll = () => {
        setSearch("");
        router.get(route("promo"), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const scrollTabs = (direction: "left" | "right") => {
        if (tabsRef.current) {
            const offset = direction === "left" ? -220 : 220;
            tabsRef.current.scrollBy({ left: offset, behavior: "smooth" });
        }
    };

    return (
        <>
            <Seo
                title="Promo & Penawaran"
                description="Temukan penawaran spesial, diskon layanan TI, dan paket solusi bisnis terbaru dari Nusantara Digital Solution."
            />

            {/* Hero: judul di tengah, aksen garis cahaya biru */}
            <section className="relative overflow-hidden bg-navy pt-24 pb-10 sm:pt-28 lg:pt-32 lg:pb-12">
                <Spotlight className="-top-24 left-1/2 -translate-x-1/2" fill="#2563EB" />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                    <span className="absolute -left-32 top-16 h-px w-[42rem] rotate-[16deg] bg-gradient-to-r from-transparent via-tech-blue/50 to-transparent" />
                    <span className="absolute -right-32 top-28 h-px w-[38rem] -rotate-[14deg] bg-gradient-to-r from-transparent via-tech-blue/35 to-transparent" />
                </div>

                <div className="container-nds relative z-10 text-center">
                    <h1
                        className="heading-1 mx-auto max-w-3xl text-3xl! text-white! tracking-tight opacity-0 sm:text-4xl! lg:text-5xl!"
                        data-hero="title"
                    >
                        Promo & Penawaran Terbaik
                    </h1>
                    <p
                        className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/75 opacity-0 sm:text-base"
                        data-hero="desc"
                    >
                        Temukan efisiensi anggaran dengan paket layanan teknologi terpadu dan potongan harga spesial dari
                        Nusantara Digital Solution.
                    </p>

                    {/* Garis dekoratif horizontal dengan titik cahaya */}
                    <div aria-hidden="true" className="mx-auto mt-12 flex max-w-xl items-center gap-3">
                        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-tech-blue/50" />
                        <span className="flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-tech-blue/60" />
                            <span className="h-1.5 w-1.5 rounded-full bg-tech-blue shadow-[0_0_12px_rgba(37,99,235,0.9)]" />
                            <span className="h-1 w-1 rounded-full bg-tech-blue/60" />
                        </span>
                        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-tech-blue/50" />
                    </div>
                </div>
            </section>

            {/* Katalog promo: filter dan search dalam satu baris di desktop */}
            <section className="bg-white pt-8 pb-20 sm:pt-9 lg:pt-14 lg:pb-24">
                <div className="container-nds">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative flex min-w-0 flex-1 items-center">
                            <button
                                type="button"
                                onClick={() => scrollTabs("left")}
                                className="mr-2 hidden h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-soft bg-white text-navy/75 transition-colors hover:border-tech-blue/50 hover:text-navy focus-visible:outline-2 focus-visible:outline-tech-blue lg:flex"
                                aria-label="Geser kategori ke kiri"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            <div
                                ref={tabsRef}
                                role="tablist"
                                aria-label="Kategori promo"
                                className="no-scrollbar flex w-full items-center gap-2 overflow-x-auto px-0.5 py-1 scroll-smooth"
                            >
                                {categoryTabs.map((cat) => {
                                    const isActive = cat.slug === "" ? !activeCategory : activeCategory === cat.slug;

                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={isActive}
                                            onClick={() => applyFilter("category", cat.slug)}
                                            className={`inline-flex h-11 shrink-0 cursor-pointer items-center rounded-xl border px-4 text-xs font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tech-blue ${
                                                isActive
                                                    ? "border-tech-blue bg-tech-blue text-white"
                                                    : "border-border-soft bg-white text-navy/70 hover:border-tech-blue/50 hover:text-navy"
                                            }`}
                                        >
                                            {cat.name}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={() => scrollTabs("right")}
                                className="ml-2 hidden h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-soft bg-white text-navy/75 transition-colors hover:border-tech-blue/50 hover:text-navy focus-visible:outline-2 focus-visible:outline-tech-blue lg:flex"
                                aria-label="Geser kategori ke kanan"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSearchSubmit} className="relative w-full shrink-0 lg:w-72 xl:w-80">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari promo..."
                                className="h-11 w-full rounded-xl border border-border-soft bg-white pl-10 pr-10 text-sm text-navy placeholder:text-slate-500 focus:border-tech-blue focus:outline-none focus:ring-2 focus:ring-tech-blue/30"
                                aria-label="Cari promo"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-slate-500 transition-colors hover:text-navy focus-visible:outline-2 focus-visible:outline-tech-blue"
                                    aria-label="Hapus kata kunci pencarian"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </form>
                    </div>

                    {isFiltered && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-4 text-xs text-body-text">
                            <div className="flex flex-wrap items-center gap-2">
                                <span>Filter aktif:</span>
                                {activeCategory && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-tech-blue/10 px-2 py-1 font-semibold text-navy">
                                        Kategori:{" "}
                                        {categoryTabs.find((c) => c.slug === activeCategory)?.name || activeCategory}
                                        <button
                                            type="button"
                                            onClick={() => applyFilter("category", "")}
                                            className="ml-0.5 cursor-pointer text-tech-blue hover:text-navy"
                                            aria-label="Hapus filter kategori"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {activeSearch && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-tech-blue/10 px-2 py-1 font-semibold text-navy">
                                        Cari: "{activeSearch}"
                                        <button
                                            type="button"
                                            onClick={handleClearSearch}
                                            className="ml-0.5 cursor-pointer text-tech-blue hover:text-navy"
                                            aria-label="Hapus filter pencarian"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                <span className="text-body-text">({promos.total} penawaran)</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="inline-flex cursor-pointer items-center gap-1 font-semibold text-navy underline underline-offset-4 hover:text-tech-blue"
                            >
                                <RotateCcw className="h-3 w-3" />
                                Reset Semua Filter
                            </button>
                        </div>
                    )}

                    <div className="mt-8">
                        {promos.data.length === 0 ? (
                            <div className="mx-auto max-w-lg rounded-xl border border-border-soft bg-white p-8 text-center sm:p-12">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-tech-blue/30 text-tech-blue">
                                    <Tag className="h-6 w-6" aria-hidden="true" />
                                </div>
                                <h2 className="mt-5 text-lg font-bold text-navy sm:text-xl">Tidak ada promo ditemukan</h2>
                                <p className="mt-2 text-sm leading-relaxed text-body-text">
                                    {isFiltered
                                        ? "Tidak ada penawaran aktif yang cocok dengan filter saat ini. Coba kata kunci lain atau reset filter."
                                        : "Saat ini belum ada promo aktif. Silakan hubungi tim kami untuk konsultasi penawaran kustom."}
                                </p>
                                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                    {isFiltered && (
                                        <Button type="button" variant="secondary" onClick={handleResetAll}>
                                            Lihat Semua Promo
                                        </Button>
                                    )}
                                    <Button asChild variant="primary">
                                        <Link href={route("contact")}>
                                            <span>Konsultasi Penawaran</span>
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Jumlah kolom mengikuti jumlah promo agar tidak ada slot kosong;
                                    satu promo dipusatkan dengan lebar wajarnya */}
                                <div
                                    className={`grid grid-cols-1 gap-5 lg:gap-6 ${
                                        promos.data.length >= 4
                                            ? "sm:grid-cols-2 lg:grid-cols-4"
                                            : promos.data.length === 3
                                              ? "sm:grid-cols-2 lg:grid-cols-3"
                                              : promos.data.length === 1
                                                ? "sm:max-w-sm sm:mx-auto"
                                                : "sm:grid-cols-2"
                                    }`}
                                >
                                    {promos.data.map((promo) => (
                                        <PromoCard key={promo.id} promo={promo} variant="light" />
                                    ))}
                                </div>

                                {promos.last_page > 1 && (
                                    <nav aria-label="Navigasi halaman promo" className="mt-12 flex items-center justify-center gap-2">
                                        {promos.current_page > 1 ? (
                                            <Link
                                                href={route("promo", {
                                                    ...filters,
                                                    page: promos.current_page - 1,
                                                })}
                                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-soft bg-white text-navy/75 transition-colors hover:border-tech-blue/50 hover:text-navy focus-visible:outline-2 focus-visible:outline-tech-blue"
                                                aria-label="Halaman sebelumnya"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Link>
                                        ) : (
                                            <span className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl border border-border-soft text-slate-300">
                                                <ChevronLeft className="h-4 w-4" />
                                            </span>
                                        )}

                                        {Array.from({ length: promos.last_page }, (_, i) => i + 1).map((page) => (
                                            <Link
                                                key={page}
                                                href={route("promo", {
                                                    ...filters,
                                                    page,
                                                })}
                                                aria-current={page === promos.current_page ? "page" : undefined}
                                                className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-tech-blue ${
                                                    page === promos.current_page
                                                        ? "bg-tech-blue text-white"
                                                        : "border border-border-soft bg-white text-navy/70 hover:border-tech-blue/50 hover:text-navy"
                                                }`}
                                            >
                                                {page}
                                            </Link>
                                        ))}

                                        {promos.current_page < promos.last_page ? (
                                            <Link
                                                href={route("promo", {
                                                    ...filters,
                                                    page: promos.current_page + 1,
                                                })}
                                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-soft bg-white text-navy/75 transition-colors hover:border-tech-blue/50 hover:text-navy focus-visible:outline-2 focus-visible:outline-tech-blue"
                                                aria-label="Halaman berikutnya"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        ) : (
                                            <span className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl border border-border-soft text-slate-300">
                                                <ChevronRight className="h-4 w-4" />
                                            </span>
                                        )}
                                    </nav>
                                )}
                            </>
                        )}
                    </div>

                </div>
            </section>

            <PromoDetailModal promo={promo ?? null} onClose={closePromo} />
        </>
    );
}

export default withFrontendLayout(Promo);