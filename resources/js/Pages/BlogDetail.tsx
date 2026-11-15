import { Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import { ArrowLeft, CalendarDays, User, ArrowRight, Share2, Phone } from "lucide-react";
import { Seo } from "@/Components/Seo";
import { SectionHeading } from "@/Components/SectionHeading";
import { Button } from "@/Components/ui/button";
import { Spotlight } from "@/Components/ui/Spotlight";
import { useGsapReveal } from "@/hooks/useGsap";
import { storageUrl } from "@/utils/assets";
import { withFrontendLayout } from "@/utils/layout";
import type { ArticleItem } from "@/types";

function formatDate(date?: string | null) {
    if (!date) return "";
    return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function BlogDetail({ article, related }: { article: ArticleItem; related: ArticleItem[] }) {
    useGsapReveal();

    const paragraphs = (article.content || "").split("\n").filter((p) => p.trim());

    return (
        <>
            <Seo
                title={article.meta_title || article.title}
                description={article.meta_description || article.excerpt || undefined}
                type="article"
            />

            <article className="bg-white">
                {/* Article Header */}
                <header className="relative overflow-hidden bg-navy pt-24 pb-12 sm:pt-28 lg:pt-28 lg:pb-16 xl:pt-32 xl:pb-20">
                    <Spotlight className="-top-24 left-1/3" fill="#4da6f8" />
                    <div className="container-nds relative z-10 max-w-4xl">
                        <Link
                            href={route("blog")}
                            className="mb-6 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white/70 transition-colors hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Kembali ke Blog & Publikasi</span>
                        </Link>
                        <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl xl:text-5xl tracking-tight">
                            {article.title}
                        </h1>
                        <div className="mt-6 flex flex-wrap items-center gap-5 text-xs sm:text-sm text-white/70">
                            {article.author && (
                                <span className="inline-flex items-center gap-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-electric-light">
                                        <User className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-white/90 font-medium">{article.author}</span>
                                </span>
                            )}
                            <span className="inline-flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-electric-light">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                </div>
                                <span>{formatDate(article.published_at)}</span>
                            </span>
                        </div>
                    </div>
                </header>

                {/* Article Content */}
                <div className="container-nds max-w-3xl py-10 lg:py-14 xl:py-18">
                    {article.image && (
                        <div className="gsap-reveal mb-8 overflow-hidden rounded-2xl border border-border-soft shadow-subtle">
                            <img
                                src={storageUrl(article.image)}
                                alt={article.title}
                                className="w-full object-cover max-h-[460px]"
                                loading="lazy"
                            />
                        </div>
                    )}

                    <div className="gsap-reveal space-y-6 text-base leading-relaxed text-body-text sm:text-lg">
                        {article.excerpt && (
                            <p className="text-lg font-semibold text-navy leading-relaxed sm:text-xl border-l-4 border-tech-blue pl-4">
                                {article.excerpt}
                            </p>
                        )}
                        {paragraphs.map((para, i) => (
                            <p key={i} className="leading-relaxed text-body-dark">
                                {para}
                            </p>
                        ))}
                    </div>

                    {/* Consultation Callout */}
                    <div className="gsap-reveal mt-10 rounded-2xl border border-border-soft bg-light-gray p-6 sm:p-8 shadow-subtle">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                            <div>
                                <h3 className="text-lg font-bold text-navy">
                                    Tertarik Menerapkan Solusi Serupa?
                                </h3>
                                <p className="mt-1 text-xs sm:text-sm text-body-text max-w-md leading-relaxed">
                                    Konsultasikan kebutuhan infrastruktur dan transformasi digital organisasi Anda bersama konsultan NDS.
                                </p>
                            </div>
                            <Button asChild variant="primary" size="default" className="shrink-0 font-bold">
                                <Link href={route("contact")}>
                                    <Phone className="h-4 w-4" />
                                    <span>Konsultasi Sekarang</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </article>

            {/* Related Articles */}
            {related.length > 0 && (
                <section className="bg-light-gray py-12 lg:py-16 xl:py-20 border-t border-border-soft">
                    <div className="container-nds">
                        <SectionHeading title="Artikel Rekomendasi Lainnya" />
                        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {related.map((item) => (
                                <Link
                                    key={item.id}
                                    href={route("blog.show", item.slug)}
                                    className="gsap-reveal group flex h-full flex-col overflow-hidden rounded-2xl border border-border-soft bg-white shadow-subtle transition-all duration-300 hover:-translate-y-1 hover:border-tech-blue/40 hover:shadow-card-hover"
                                >
                                    <div className="h-40 sm:h-44 overflow-hidden bg-light-gray relative">
                                        {item.image ? (
                                            <img
                                                src={storageUrl(item.image)}
                                                alt={item.title}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-light-gray to-tech-blue/10">
                                                <span className="text-xs font-bold uppercase tracking-wider text-navy/70">
                                                    {item.category?.name || "Artikel"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col p-5 sm:p-6 pt-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-tech-blue">
                                            {item.category?.name || "Artikel"}
                                        </p>
                                        <h3 className="mt-2 line-clamp-2 font-bold text-navy transition-colors group-hover:text-tech-blue text-base">
                                            {item.title}
                                        </h3>
                                        <p className="mt-auto pt-4 text-xs font-medium text-body-text/70">
                                            {formatDate(item.published_at)}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}

export default withFrontendLayout(BlogDetail);
