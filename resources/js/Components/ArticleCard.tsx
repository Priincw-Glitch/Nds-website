import { Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import { Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { storageUrl } from "@/utils/assets";
import type { ArticleItem } from "@/types";

interface ArticleCardProps {
    article: ArticleItem;
    isActive?: boolean;
    className?: string;
}

function formatDate(date?: string | null) {
    if (!date) return "";
    return new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export function ArticleCard({ article, isActive = false, className }: ArticleCardProps) {
    return (
        <Link
            href={route("blog.show", article.slug)}
            className={cn(
                "group flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300",
                isActive
                    ? "border-tech-blue/50 shadow-xl shadow-navy/10 ring-1 ring-tech-blue/20"
                    : "border-border-soft shadow-subtle hover:border-tech-blue/40 hover:shadow-card-hover",
                className
            )}
        >
            <div className="h-44 sm:h-48 overflow-hidden bg-light-gray relative shrink-0">
                {article.image ? (
                    <img
                        src={storageUrl(article.image)}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-light-gray to-tech-blue/10">
                        <span className="text-xs font-bold uppercase tracking-wider text-navy/70">
                            {article.category?.name || "Artikel TI"}
                        </span>
                    </div>
                )}
                {article.category && (
                    <span className="absolute top-3 left-3 rounded-full bg-navy/80 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-xs">
                        {article.category.name}
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex items-center gap-2 text-xs text-body-text/80 mb-2">
                    <Calendar className="h-3.5 w-3.5 text-tech-blue" />
                    <span>{formatDate(article.published_at)}</span>
                </div>

                <h3 className="line-clamp-2 text-base font-bold text-navy transition-colors group-hover:text-tech-blue sm:text-lg">
                    {article.title}
                </h3>

                <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-body-text">
                    {article.excerpt}
                </p>

                <div className="mt-auto pt-4 border-t border-border-soft/60 flex items-center justify-between text-xs font-bold text-tech-blue group-hover:text-tech-blue-hover">
                    <span>Baca Selengkapnya</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
            </div>
        </Link>
    );
}
