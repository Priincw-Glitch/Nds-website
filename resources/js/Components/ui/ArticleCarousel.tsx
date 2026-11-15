import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import "swiper/css";
import "swiper/css/a11y";

export interface ArticleCarouselProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => ReactNode;
    getItemKey?: (item: T, index: number) => string | number;
    ariaLabel?: string;
    className?: string;
}

interface NavigationState {
    isBeginning: boolean;
    isEnd: boolean;
}

const baseButtonClass =
    "flex h-11 w-11 items-center justify-center rounded-xl border bg-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tech-blue";

/**
 * Card carousel for the Blog listing. Follows the Promo card grid rhythm:
 * 1 card on mobile, 2 on tablet, 4 on desktop, with the same gaps. No loop,
 * no autoplay, and arrows stop at the first and last article.
 */
export function ArticleCarousel<T>({
    items,
    renderItem,
    getItemKey,
    ariaLabel = "Kumpulan artikel",
    className,
}: ArticleCarouselProps<T>) {
    const [swiper, setSwiper] = useState<SwiperClass | null>(null);
    const [navigation, setNavigation] = useState<NavigationState>({ isBeginning: true, isEnd: true });

    const syncNavigation = useCallback((instance: SwiperClass) => {
        setNavigation({ isBeginning: instance.isBeginning, isEnd: instance.isEnd });
    }, []);

    if (items.length === 0) return null;

    const canGoPrev = Boolean(swiper) && !navigation.isBeginning;
    const canGoNext = Boolean(swiper) && !navigation.isEnd;

    return (
        <div className={cn("w-full select-none", className)}>
            <Swiper
                modules={[A11y]}
                slidesPerView={1}
                spaceBetween={20}
                breakpoints={{
                    640: { slidesPerView: 2, spaceBetween: 20 },
                    1024: { slidesPerView: 4, spaceBetween: 24 },
                }}
                loop={false}
                autoplay={false}
                grabCursor
                watchOverflow
                aria-label={ariaLabel}
                onSwiper={(instance) => {
                    setSwiper(instance);
                    syncNavigation(instance);
                }}
                onAfterInit={syncNavigation}
                onSlideChange={syncNavigation}
                onReachBeginning={syncNavigation}
                onReachEnd={syncNavigation}
                onFromEdge={syncNavigation}
                onResize={syncNavigation}
                onBreakpoint={syncNavigation}
                className="article-carousel"
            >
                {items.map((item, index) => (
                    <SwiperSlide key={getItemKey ? getItemKey(item, index) : index} className="h-auto">
                        {renderItem(item, index)}
                    </SwiperSlide>
                ))}
            </Swiper>

            <div className="mt-6 flex items-center justify-center gap-2.5">
                <button
                    type="button"
                    onClick={() => swiper?.slidePrev()}
                    disabled={!canGoPrev}
                    aria-label="Artikel sebelumnya"
                    className={cn(
                        baseButtonClass,
                        canGoPrev
                            ? "cursor-pointer border-border-soft text-navy hover:border-tech-blue/50 hover:text-tech-blue"
                            : "cursor-not-allowed border-border-soft/60 text-navy/30"
                    )}
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => swiper?.slideNext()}
                    disabled={!canGoNext}
                    aria-label="Artikel berikutnya"
                    className={cn(
                        baseButtonClass,
                        canGoNext
                            ? "cursor-pointer border-border-soft text-navy hover:border-tech-blue/50 hover:text-tech-blue"
                            : "cursor-not-allowed border-border-soft/60 text-navy/30"
                    )}
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
