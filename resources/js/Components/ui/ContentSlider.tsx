import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentSliderProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    slidesPerView?: number | "auto";
    spaceBetween?: number;
    autoplay?: boolean;
    autoplayDelay?: number;
    showNavigation?: boolean;
    showPagination?: boolean;
    className?: string;
    breakpoints?: Record<number, { slidesPerView: number; spaceBetween?: number }>;
}

export function ContentSlider<T>({
    items,
    renderItem,
    slidesPerView = 1,
    spaceBetween = 24,
    autoplay = false,
    autoplayDelay = 5000,
    showNavigation = true,
    showPagination = true,
    className,
    breakpoints = {
        640: { slidesPerView: 2, spaceBetween: 20 },
        1024: { slidesPerView: 3, spaceBetween: 24 },
    },
}: ContentSliderProps<T>) {
    const prevRef = React.useRef<HTMLButtonElement>(null);
    const nextRef = React.useRef<HTMLButtonElement>(null);
    const [isReady, setIsReady] = React.useState(false);

    return (
        <div className={cn("relative group/slider", className)}>
            <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={spaceBetween}
                slidesPerView={slidesPerView}
                breakpoints={breakpoints}
                autoplay={
                    autoplay
                        ? {
                              delay: autoplayDelay,
                              disableOnInteraction: false,
                              pauseOnMouseEnter: true,
                          }
                        : false
                }
                pagination={
                    showPagination
                        ? {
                              clickable: true,
                              dynamicBullets: true,
                          }
                        : false
                }
                navigation={{
                    prevEl: prevRef.current,
                    nextEl: nextRef.current,
                }}
                onBeforeInit={(swiper) => {
                    if (typeof swiper.params.navigation !== "boolean" && swiper.params.navigation) {
                        swiper.params.navigation.prevEl = prevRef.current;
                        swiper.params.navigation.nextEl = nextRef.current;
                    }
                }}
                onInit={() => setIsReady(true)}
                className="pb-12!"
            >
                {items.map((item, idx) => (
                    <SwiperSlide key={idx} className="h-auto">
                        {renderItem(item, idx)}
                    </SwiperSlide>
                ))}
            </Swiper>

            {showNavigation && (
                <>
                    <button
                        ref={prevRef}
                        type="button"
                        aria-label="Slide sebelumnya"
                        className="absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border-soft bg-white p-2.5 text-navy shadow-md transition-all duration-200 hover:bg-navy hover:text-white hover:border-navy group-hover/slider:flex disabled:opacity-0 cursor-pointer"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        ref={nextRef}
                        type="button"
                        aria-label="Slide berikutnya"
                        className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border-soft bg-white p-2.5 text-navy shadow-md transition-all duration-200 hover:bg-navy hover:text-white hover:border-navy group-hover/slider:flex disabled:opacity-0 cursor-pointer"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </>
            )}
        </div>
    );
}
