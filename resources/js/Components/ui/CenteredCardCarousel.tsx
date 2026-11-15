import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CenteredCardCarouselProps<T> {
    items: T[];
    renderItem: (item: T, index: number, isActive: boolean) => React.ReactNode;
    getItemKey?: (item: T, index: number) => string | number;
    slideWidthClassName?: string;
    autoplayDelay?: number;
    showArrows?: boolean;
    showDots?: boolean;
    className?: string;
    spaceBetween?: number;
    onActiveChange?: (index: number) => void;
    ariaLabel?: string;
    /** Enable infinite loop (default: true). When false, carousel stops at first/last item. */
    loop?: boolean;
    /** Enable autoplay (default: true). When false, no automatic sliding. */
    autoplay?: boolean;
}

/**
 * Static balanced layout for sections with fewer than 3 cards.
 * Renders cards in a centered horizontal row with even spacing.
 */
function StaticCardLayout<T>({
    items,
    renderItem,
    getItemKey,
    spaceBetween = 20,
    className,
}: Omit<CenteredCardCarouselProps<T>, "autoplayDelay" | "showArrows" | "showDots" | "onActiveChange" | "ariaLabel" | "loop" | "autoplay">) {
    return (
        <div className={cn("centered-carousel-container w-full select-none", className)}>
            <div
                className="flex flex-wrap items-center justify-center"
                style={{ gap: spaceBetween }}
                role="list"
                aria-label="Kumpulan kartu statis"
            >
                {items.map((item, index) => {
                    const key = getItemKey ? getItemKey(item, index) : `item-${index}`;
                    return (
                        <div key={key} className="flex-shrink-0 max-w-full" role="listitem">
                            {renderItem(item, index, false)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const TRACK_MS = 600;
const TRACK_EASING = "cubic-bezier(0.25, 1, 0.5, 1)";
const DRAG_CLICK_THRESHOLD = 8;
const REENTER_FADE_MS = 450;

const mod = (n: number, m: number) => ((n % m) + m) % m;

interface Gesture {
    pointerId: number;
    startClientX: number;
    startTxRaw: number;
    moved: boolean;
}

/**
 * CenteredCardCarousel - Dual-mode carousel component.
 * 
 * Mode 1 (loop=true, default): Continuous conveyor carousel with infinite loop.
 *   - Cards rotate when they exit viewport
 *   - Autoplay enabled by default
 *   - Dots navigation
 * 
 * Mode 2 (loop=false): Simple slider carousel without infinite loop.
 *   - Stops at first/last item
 *   - No card rotation/duplication
 *   - Prev/Next buttons disable at boundaries
 *   - Autoplay disabled by default
 *   - Smooth slide transitions
 */
export function CenteredCardCarousel<T>({
    items,
    renderItem,
    getItemKey,
    slideWidthClassName = "w-[82vw] max-w-[325px] sm:w-[340px] lg:w-[370px]",
    autoplayDelay = 4000,
    showArrows = true,
    showDots = true,
    className,
    spaceBetween = 20,
    onActiveChange,
    ariaLabel = "Kumpulan konten interaktif",
    loop = true,
    autoplay = true,
}: CenteredCardCarouselProps<T>) {
    const totalItems = items.length;
    const isLoopMode = loop && totalItems >= 3;
    const isSliderMode = !isLoopMode && totalItems >= 3;

    /* Shared state */
    const [activeIdx, setActiveIdx] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [reenterId, setReenterId] = useState<number | null>(null);
    const [uiGap, setUiGap] = useState(spaceBetween);

    const viewportRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const phaseRef = useRef<"idle" | "moving" | "dragging">("idle");
    const txRef = useRef(0);
    const geoRef = useRef({ cardWidth: 300, step: 320, center: 0, rightNeed: 2, backNeed: 2 });
    const gestureRef = useRef<Gesture | null>(null);
    const hoverRef = useRef(false);
    const reducedRef = useRef(false);
    const dragMovedRef = useRef(false);
    const autoplayTimer = useRef<number | undefined>(undefined);
    const settleTimer = useRef<number | undefined>(undefined);
    const reenterTimer = useRef<number | undefined>(undefined);
    const settleRef = useRef<() => void>(() => {});
    const stepForwardRef = useRef<() => void>(() => {});
    const stepBackwardRef = useRef<() => void>(() => {});
    const onActiveChangeRef = useRef(onActiveChange);

    // Loop mode specific state
    const [order, setOrder] = useState<number[]>(() => items.map((_, i) => i));
    const orderRef = useRef<number[]>(order);
    const activeSlotRef = useRef(0);

    useEffect(() => {
        onActiveChangeRef.current = onActiveChange;
    }, [onActiveChange]);

    /* ---------- geometri & posisi ---------- */

    const anchorX = useCallback((slot: number) => {
        const g = geoRef.current;
        return g.center - (slot * g.step + g.cardWidth / 2);
    }, []);

    const applyTransform = useCallback((tx: number, animate: boolean) => {
        const el = trackRef.current;
        if (!el) return;
        el.style.transition = animate && !reducedRef.current ? `transform ${TRACK_MS}ms ${TRACK_EASING}` : "none";
        el.style.transform = `translate3d(${Math.round(tx * 100) / 100}px, 0, 0)`;
        txRef.current = tx;
    }, []);

    const measure = useCallback(() => {
        const vp = viewportRef.current;
        const track = trackRef.current;
        if (!vp || !track) return;
        const slides = track.children;
        const first = slides[0] as HTMLElement | undefined;
        const second = slides[1] as HTMLElement | undefined;
        if (!first) return;
        const cardWidth = first.offsetWidth;
        const step = second ? second.offsetLeft - first.offsetLeft : cardWidth + 20;
        const width = vp.clientWidth;
        if (!cardWidth || !step || !width) return;
        const measuredGap = step - cardWidth;
        setUiGap((prev) => (prev === measuredGap ? prev : measuredGap));
        geoRef.current = {
            cardWidth,
            step,
            center: width / 2,
            rightNeed: Math.ceil(width / 2 / step) + 1,
            backNeed: Math.ceil((width / 2 + cardWidth) / step) + 1,
        };
    }, []);

    /* ---------- LOOP MODE: rotasi track ---------- */

    /** Kartu di flex-slot 0 sepenuhnya di luar sisi kiri viewport? */
    const headOffLeft = useCallback(() => txRef.current + geoRef.current.cardWidth <= 0, []);

    /** Kartu di flex-slot terakhir sepenuhnya di luar sisi kanan viewport? */
    const tailOffRight = useCallback(() => {
        const g = geoRef.current;
        const width = viewportRef.current?.clientWidth ?? g.center * 2;
        return txRef.current + (orderRef.current.length - 1) * g.step >= width;
    }, []);

    /** Daur ulang ke kanan benar-benar tak terlihat */
    const rotateForwardSilent = useCallback(() => {
        const g = geoRef.current;
        const width = viewportRef.current?.clientWidth ?? g.center * 2;
        return txRef.current + g.cardWidth <= 0 && txRef.current + orderRef.current.length * g.step >= width;
    }, []);

    /** Kebalikan `rotateForwardSilent` untuk daur ulang ke kiri. */
    const rotateBackwardSilent = useCallback(() => {
        const g = geoRef.current;
        const width = viewportRef.current?.clientWidth ?? g.center * 2;
        return (
            txRef.current + (orderRef.current.length - 1) * g.step >= width && txRef.current - g.step + g.cardWidth <= 0
        );
    }, []);

    const rotate = useCallback((dir: 1 | -1, forced: boolean) => {
        const arr = orderRef.current.slice();
        let movedId: number;
        if (dir === 1) {
            movedId = arr.shift() as number;
            arr.push(movedId);
            activeSlotRef.current -= 1;
            txRef.current += geoRef.current.step;
        } else {
            movedId = arr.pop() as number;
            arr.unshift(movedId);
            activeSlotRef.current += 1;
            txRef.current -= geoRef.current.step;
        }
        orderRef.current = arr;
        setOrder(arr);
        const el = trackRef.current;
        if (el) {
            el.style.transition = "none";
            el.style.transform = `translate3d(${Math.round(txRef.current * 100) / 100}px, 0, 0)`;
        }
        if (forced) {
            setReenterId(movedId);
            window.clearTimeout(reenterTimer.current);
            reenterTimer.current = window.setTimeout(() => setReenterId(null), REENTER_FADE_MS);
        }
    }, []);

    const materializeForward = useCallback(
        (count: number) => {
            let guard = totalItems * 3;
            while (activeSlotRef.current + count > totalItems - 1 && guard-- > 0) {
                rotate(1, !rotateForwardSilent());
            }
        },
        [rotate, rotateForwardSilent, totalItems]
    );

    const materializeBackward = useCallback(
        (count: number) => {
            let guard = totalItems * 3;
            while (activeSlotRef.current - count < 0 && guard-- > 0) {
                rotate(-1, !rotateBackwardSilent());
            }
        },
        [rotate, rotateBackwardSilent, totalItems]
    );

    /* ---------- SLIDER MODE (non-loop): simple slide navigation ---------- */

    const getMaxSlideIndex = useCallback(() => {
        if (!isSliderMode) return totalItems - 1;
        const g = geoRef.current;
        const width = viewportRef.current?.clientWidth ?? g.center * 2;
        // Maximum index where the last card is still fully visible
        const maxIndex = Math.max(0, totalItems - Math.floor(width / g.step));
        return Math.min(maxIndex, totalItems - 1);
    }, [isSliderMode, totalItems]);

    const canGoNext = useCallback(() => {
        if (isLoopMode) return true;
        return activeSlotRef.current < getMaxSlideIndex();
    }, [isLoopMode, getMaxSlideIndex]);

    const canGoPrev = useCallback(() => {
        if (isLoopMode) return true;
        return activeSlotRef.current > 0;
    }, [isLoopMode]);

    /* ---------- animasi & penyelesaian ---------- */

    const clearSettleTimer = useCallback(() => {
        window.clearTimeout(settleTimer.current);
        settleTimer.current = undefined;
    }, []);

    const scheduleAutoplay = useCallback(
        (delayMs = autoplayDelay) => {
            if (!autoplay) return;
            window.clearTimeout(autoplayTimer.current);
            autoplayTimer.current = window.setTimeout(function tick() {
                if (phaseRef.current === "idle" && !hoverRef.current && !document.hidden) {
                    stepForwardRef.current();
                } else if (phaseRef.current === "idle") {
                    scheduleAutoplay(Math.min(1000, autoplayDelay));
                }
            }, delayMs);
        },
        [autoplay, autoplayDelay]
    );

    const settle = useCallback(() => {
        if (phaseRef.current === "dragging") return;
        phaseRef.current = "idle";
        clearSettleTimer();
        
        if (isLoopMode) {
            // Loop mode: recycle cards that are fully off-screen
            let guard = totalItems * 2;
            while (rotateForwardSilent() && guard-- > 0) rotate(1, false);
            materializeForward(geoRef.current.rightNeed);
        }
        // Slider mode: no materialization needed, just reset phase
        scheduleAutoplay();
    }, [clearSettleTimer, isLoopMode, rotateForwardSilent, rotate, materializeForward, totalItems, scheduleAutoplay]);
    settleRef.current = settle;

    const animateTo = useCallback(
        (slot: number, snapSettleMs = TRACK_MS + 60) => {
            if (isLoopMode) {
                const targetId = orderRef.current[slot];
                if (targetId === undefined) return;
                activeSlotRef.current = slot;
                phaseRef.current = "moving";
                setActiveIdx(targetId);
                onActiveChangeRef.current?.(targetId);
            } else {
                // Slider mode: clamp to valid range
                const clampedSlot = Math.max(0, Math.min(slot, getMaxSlideIndex()));
                activeSlotRef.current = clampedSlot;
                phaseRef.current = "moving";
                setActiveIdx(clampedSlot);
                onActiveChangeRef.current?.(clampedSlot);
            }
            applyTransform(anchorX(activeSlotRef.current), true);
            clearSettleTimer();
            settleTimer.current = window.setTimeout(() => settleRef.current(), snapSettleMs);
        },
        [applyTransform, anchorX, clearSettleTimer, isLoopMode, getMaxSlideIndex]
    );

    const stepForward = useCallback(() => {
        if (phaseRef.current !== "idle") return;
        if (!canGoNext()) return;
        
        if (isLoopMode) {
            materializeForward(1 + geoRef.current.rightNeed);
        }
        animateTo(activeSlotRef.current + 1);
    }, [isLoopMode, materializeForward, animateTo, canGoNext]);
    stepForwardRef.current = stepForward;

    const stepBackward = useCallback(() => {
        if (phaseRef.current !== "idle") return;
        if (!canGoPrev()) return;
        
        if (isLoopMode) {
            materializeBackward(1 + geoRef.current.backNeed);
        }
        animateTo(activeSlotRef.current - 1);
    }, [isLoopMode, materializeBackward, animateTo, canGoPrev]);
    stepBackwardRef.current = stepBackward;

    const goTo = useCallback(
        (cardId: number) => {
            if (phaseRef.current !== "idle") return;
            
            if (isLoopMode) {
                const a = activeSlotRef.current;
                const head = orderRef.current[a] ?? 0;
                const d = mod(cardId - head, totalItems);
                if (d === 0) return;
                materializeForward(d + geoRef.current.rightNeed);
                animateTo(activeSlotRef.current + d, TRACK_MS * 1.5 + 80);
            } else {
                // Slider mode: direct navigation
                const clampedId = Math.max(0, Math.min(cardId, getMaxSlideIndex()));
                if (clampedId === activeSlotRef.current) return;
                animateTo(clampedId);
            }
        },
        [animateTo, isLoopMode, materializeForward, totalItems, getMaxSlideIndex]
    );

    /* ---------- drag / swipe ---------- */

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            window.clearTimeout(autoplayTimer.current);
            if (phaseRef.current === "moving") {
                const g0 = geoRef.current;
                const nearest = Math.round((g0.center - g0.cardWidth / 2 - txRef.current) / g0.step);
                applyTransform(anchorX(nearest), false);
                activeSlotRef.current = isLoopMode ? nearest : Math.max(0, Math.min(nearest, getMaxSlideIndex()));
                setActiveIdx(isLoopMode ? orderRef.current[nearest] : activeSlotRef.current);
                phaseRef.current = "idle";
                clearSettleTimer();
            }
            gestureRef.current = {
                pointerId: e.pointerId,
                startClientX: e.clientX,
                startTxRaw: txRef.current,
                moved: false,
            };
            dragMovedRef.current = false;
            phaseRef.current = "dragging";
            setIsDragging(true);
            e.currentTarget.setPointerCapture?.(e.pointerId);
        },
        [applyTransform, anchorX, clearSettleTimer, isLoopMode, getMaxSlideIndex]
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const g = gestureRef.current;
            if (!g || phaseRef.current !== "dragging" || e.pointerId !== g.pointerId) return;
            const dx = e.clientX - g.startClientX;
            if (Math.abs(dx) > DRAG_CLICK_THRESHOLD) {
                g.moved = true;
                dragMovedRef.current = true;
            }
            
            if (isLoopMode) {
                // Loop mode: recycle cards during drag
                let guard = totalItems * 3;
                while (headOffLeft() && guard-- > 0) {
                    rotate(1, !rotateForwardSilent());
                    g.startTxRaw += geoRef.current.step;
                }
                guard = totalItems * 3;
                while (tailOffRight() && guard-- > 0) {
                    rotate(-1, !rotateBackwardSilent());
                    g.startTxRaw -= geoRef.current.step;
                }
            } else {
                // Slider mode: constrain drag to boundaries
                const maxTx = anchorX(0); // Leftmost position (first card centered)
                const minTx = anchorX(getMaxSlideIndex()); // Rightmost position (last card centered)
                const proposedTx = g.startTxRaw + dx;
                const constrainedTx = Math.max(minTx, Math.min(maxTx, proposedTx));
                applyTransform(constrainedTx, false);
                return;
            }
            applyTransform(g.startTxRaw + dx, false);
        },
        [applyTransform, isLoopMode, rotate, headOffLeft, tailOffRight, rotateForwardSilent, rotateBackwardSilent, totalItems, getMaxSlideIndex]
    );

    const endDrag = useCallback(() => {
        const g = geoRef.current;
        const a0 = activeSlotRef.current;
        const targetSlot = Math.round((g.center - g.cardWidth / 2 - txRef.current) / g.step);
        
        if (isLoopMode) {
            if (targetSlot > a0) materializeForward(targetSlot - a0 + g.rightNeed);
            else if (targetSlot < a0) materializeBackward(a0 - targetSlot + g.backNeed);
        }
        animateTo(targetSlot, TRACK_MS * 1.5 + 80);
    }, [materializeForward, materializeBackward, animateTo, isLoopMode]);

    const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const g = gestureRef.current;
        if (!g || phaseRef.current !== "dragging" || e.pointerId !== g.pointerId) return;
        gestureRef.current = null;
        setIsDragging(false);
        endDrag();
    }, [endDrag]);

    const onPointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const g = gestureRef.current;
        if (!g || e.pointerId !== g.pointerId) return;
        gestureRef.current = null;
        setIsDragging(false);
        const dx = e.clientX - g.startClientX;
        endDrag();
        if (Math.abs(dx) > DRAG_CLICK_THRESHOLD) dragMovedRef.current = true;
    }, [endDrag]);

    useEffect(() => {
        if (totalItems < 3) return;
        const vp = viewportRef.current;
        if (!vp) return;
        const onClick = (e: MouseEvent) => {
            if (gestureRef.current || !dragMovedRef.current) return;
            dragMovedRef.current = false;
            e.preventDefault();
            e.stopPropagation();
        };
        vp.addEventListener("click", onClick, true);
        return () => vp.removeEventListener("click", onClick, true);
    }, [totalItems]);

    /* Trackpad horizontal */
    useEffect(() => {
        if (totalItems < 3) return;
        const vp = viewportRef.current;
        if (!vp) return;
        let accumulated = 0;
        let resetTimer: number | undefined;
        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
            e.preventDefault();
            window.clearTimeout(autoplayTimer.current);
            window.clearTimeout(resetTimer);
            resetTimer = window.setTimeout(() => {
                accumulated = 0;
                if (phaseRef.current === "idle") scheduleAutoplay();
            }, 200);
            accumulated += e.deltaX;
            if (Math.abs(accumulated) < 40 || phaseRef.current !== "idle") return;
            const delta = accumulated;
            accumulated = 0;
            window.setTimeout(() => (delta > 0 ? stepForwardRef.current() : stepBackwardRef.current()), 0);
        };
        vp.addEventListener("wheel", onWheel, { passive: false });
        return () => {
            vp.removeEventListener("wheel", onWheel);
            window.clearTimeout(resetTimer);
        };
    }, [totalItems, scheduleAutoplay]);

    /* ---------- autoplay, resize, reduced-motion, siklus hidup ---------- */

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const sync = () => {
            reducedRef.current = mq.matches;
        };
        sync();
        mq.addEventListener("change", sync);
        return () => mq.removeEventListener("change", sync);
    }, []);

    useEffect(() => {
        const onVisibility = () => {
            if (document.hidden) {
                window.clearTimeout(autoplayTimer.current);
            } else {
                settleRef.current();
            }
        };
        document.addEventListener("visibilitychange", onVisibility);
        return () => document.removeEventListener("visibilitychange", onVisibility);
    }, []);

    /* Inisialisasi & pengukuran ulang */
    const reflow = useCallback(
        (animate = false) => {
            measure();
            applyTransform(anchorX(activeSlotRef.current), animate);
            if (isLoopMode) {
                materializeForward(geoRef.current.rightNeed);
                materializeBackward(geoRef.current.backNeed);
            }
        },
        [measure, applyTransform, anchorX, isLoopMode, materializeForward, materializeBackward]
    );

    useLayoutEffect(() => {
        reflow(false);
        settleRef.current();
        let observer: ResizeObserver | undefined;
        let resizeTimer: number | undefined;
        const onBounds = () => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => reflow(false), 120);
        };
        try {
            observer = new ResizeObserver(onBounds);
            if (viewportRef.current) observer.observe(viewportRef.current);
        } catch {
            /* Fallback ke window resize */
        }
        window.addEventListener("resize", onBounds);
        return () => {
            window.clearTimeout(resizeTimer);
            observer?.disconnect();
            window.removeEventListener("resize", onBounds);
        };
    }, [reflow]);

    /* Data berubah */
    useEffect(() => {
        if (totalItems < 3) return;
        const nextOrder = items.map((_, i) => i);
        const keepId = mod(activeIdx, totalItems);
        const slot = Math.max(0, nextOrder.indexOf(keepId));
        orderRef.current = nextOrder;
        activeSlotRef.current = slot;
        setOrder(nextOrder);
        setActiveIdx(keepId);
        requestAnimationFrame(() => {
            measure();
            applyTransform(anchorX(slot), false);
            if (isLoopMode) {
                materializeForward(geoRef.current.rightNeed);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalItems]);

    useEffect(() => {
        const cleanup = () => {
            window.clearTimeout(autoplayTimer.current);
            window.clearTimeout(settleTimer.current);
            window.clearTimeout(reenterTimer.current);
            autoplayTimer.current = undefined;
            settleTimer.current = undefined;
        };
        return cleanup;
    }, []);

    /* ---------- render ---------- */

    if (totalItems === 0) {
        return null;
    }

    if (totalItems < 3) {
        return (
            <StaticCardLayout
                items={items}
                renderItem={renderItem}
                getItemKey={getItemKey}
                spaceBetween={spaceBetween}
                className={className}
            />
        );
    }

    return (
        <div
            className={cn("centered-carousel-container w-full select-none", isDragging ? "is-dragging" : "is-idle", className)}
            ref={viewportRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onPointerEnter={(e) => {
                if (e.pointerType === "touch") return;
                hoverRef.current = true;
                window.clearTimeout(autoplayTimer.current);
            }}
            onPointerLeave={(e) => {
                if (e.pointerType === "touch") return;
                hoverRef.current = false;
                if (phaseRef.current === "idle") {
                    scheduleAutoplay(Math.min(1000, autoplayDelay));
                }
            }}
            aria-label={ariaLabel}
        >
            <div className="centered-carousel-swiper py-4">
                <div className="centered-carousel-track" style={{ gap: uiGap }} role="list" ref={trackRef}>
                    {isLoopMode ? (
                        order.map((cardId) => {
                            const item = items[cardId];
                            if (!item) return null;
                            const key = getItemKey ? getItemKey(item, cardId) : `item-${cardId}`;
                            const isCurrentActive = cardId === activeIdx;
                            return (
                                <div
                                    key={key}
                                    role="listitem"
                                    className={cn(
                                        "centered-carousel-slide",
                                        slideWidthClassName,
                                        isCurrentActive && "swiper-slide-active",
                                        reenterId === cardId && "slot-reenter"
                                    )}
                                >
                                    <div className="centered-carousel-card">
                                        {renderItem(item, cardId, isCurrentActive)}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        // Slider mode: render all items in fixed order
                        items.map((item, index) => {
                            const key = getItemKey ? getItemKey(item, index) : `item-${index}`;
                            const isCurrentActive = index === activeIdx;
                            return (
                                <div
                                    key={key}
                                    role="listitem"
                                    className={cn(
                                        "centered-carousel-slide",
                                        slideWidthClassName,
                                        isCurrentActive && "swiper-slide-active"
                                    )}
                                >
                                    <div className="centered-carousel-card">
                                        {renderItem(item, index, isCurrentActive)}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Navigation Controls */}
            {(showDots || showArrows) && totalItems > 1 && (
                <div className="mt-6 flex items-center justify-center gap-4">
                    {showArrows && (
                        <button
                            type="button"
                            onClick={stepBackward}
                            disabled={!canGoPrev()}
                            aria-label="Slide sebelumnya"
                            aria-disabled={!canGoPrev()}
                            className={cn(
                                "hidden sm:flex h-9 w-9 items-center justify-center rounded-full border bg-white text-navy shadow-xs transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue",
                                canGoPrev()
                                    ? "border-border-soft hover:border-navy hover:bg-navy hover:text-white"
                                    : "border-border-soft/40 text-navy/40 cursor-not-allowed opacity-50"
                            )}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    )}

                    {showDots && (
                        <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label="Indikator slide">
                            {isLoopMode ? (
                                items.map((_, i) => (
                                    <button
                                        key={`dot-${i}`}
                                        type="button"
                                        role="tab"
                                        aria-selected={activeIdx === i}
                                        onClick={() => goTo(i)}
                                        aria-label={`Pindah ke slide ${i + 1}`}
                                        className={cn(
                                            "h-2 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:ring-offset-1",
                                            activeIdx === i ? "w-6 bg-tech-blue" : "w-2 bg-navy/20 hover:bg-navy/40"
                                        )}
                                    />
                                ))
                            ) : (
                                // Slider mode: dots represent slide positions
                                Array.from({ length: getMaxSlideIndex() + 1 }, (_, i) => (
                                    <button
                                        key={`dot-${i}`}
                                        type="button"
                                        role="tab"
                                        aria-selected={activeSlotRef.current === i}
                                        onClick={() => goTo(i)}
                                        aria-label={`Pindah ke slide ${i + 1}`}
                                        className={cn(
                                            "h-2 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:ring-offset-1",
                                            activeSlotRef.current === i ? "w-6 bg-tech-blue" : "w-2 bg-navy/20 hover:bg-navy/40"
                                        )}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {showArrows && (
                        <button
                            type="button"
                            onClick={stepForward}
                            disabled={!canGoNext()}
                            aria-label="Slide berikutnya"
                            aria-disabled={!canGoNext()}
                            className={cn(
                                "hidden sm:flex h-9 w-9 items-center justify-center rounded-full border bg-white text-navy shadow-xs transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue",
                                canGoNext()
                                    ? "border-border-soft hover:border-navy hover:bg-navy hover:text-white"
                                    : "border-border-soft/40 text-navy/40 cursor-not-allowed opacity-50"
                            )}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}