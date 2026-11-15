import { router, usePage } from "@inertiajs/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ meta }: { meta: { current_page: number; last_page: number; total?: number; from?: number; to?: number } }) {
    const { url } = usePage();

    if (meta.last_page <= 1) return null;

    const go = (page: number) => {
        if (page < 1 || page > meta.last_page || page === meta.current_page) return;
        const u = new URL(url, window.location.origin);
        u.searchParams.set("page", String(page));
        router.get(u.pathname + u.search, {}, { preserveState: true, preserveScroll: true });
    };

    // Calculate smart window of pages
    const current = meta.current_page;
    const last = meta.last_page;
    const delta = 2;
    const left = current - delta;
    const right = current + delta + 1;
    const range: number[] = [];
    const pagesWithDots: Array<number | string> = [];
    let l: number | undefined;

    for (let i = 1; i <= last; i++) {
        if (i === 1 || i === last || (i >= left && i < right)) {
            range.push(i);
        }
    }

    for (const i of range) {
        if (l) {
            if (i - l === 2) {
                pagesWithDots.push(l + 1);
            } else if (i - l !== 1) {
                pagesWithDots.push("...");
            }
        }
        pagesWithDots.push(i);
        l = i;
    }

    return (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            {meta.total !== undefined && meta.from !== undefined && meta.to !== undefined && (
                <p className="text-xs text-body-text">
                    Menampilkan <span className="font-semibold text-navy">{meta.from}</span> -{" "}
                    <span className="font-semibold text-navy">{meta.to}</span> dari{" "}
                    <span className="font-semibold text-navy">{meta.total}</span> data
                </p>
            )}

            <nav aria-label="Navigasi Halaman" className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => go(meta.current_page - 1)}
                    disabled={meta.current_page === 1}
                    aria-label="Halaman sebelumnya"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-soft bg-white text-navy transition-colors hover:bg-tech-blue/8 disabled:opacity-40 disabled:pointer-events-none"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {pagesWithDots.map((page, idx) => {
                    if (page === "...") {
                        return (
                            <span key={`dots-${idx}`} className="flex h-9 w-7 items-center justify-center text-xs text-body-text">
                                ...
                            </span>
                        );
                    }
                    const num = page as number;
                    const isActive = num === meta.current_page;
                    return (
                        <button
                            key={num}
                            type="button"
                            onClick={() => go(num)}
                            aria-current={isActive ? "page" : undefined}
                            className={`flex h-9 min-w-9 px-2 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                                isActive ? "bg-tech-blue text-white shadow-xs" : "border border-border-soft bg-white text-navy hover:bg-tech-blue/8"
                            }`}
                        >
                            {num}
                        </button>
                    );
                })}

                <button
                    type="button"
                    onClick={() => go(meta.current_page + 1)}
                    disabled={meta.current_page === meta.last_page}
                    aria-label="Halaman berikutnya"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-soft bg-white text-navy transition-colors hover:bg-tech-blue/8 disabled:opacity-40 disabled:pointer-events-none"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </nav>
        </div>
    );
}
