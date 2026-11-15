import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { router } from "@inertiajs/react";

gsap.registerPlugin(ScrollTrigger);

export function useLenis() {
    useEffect(() => {
        // Hormati prefers-reduced-motion
        if (typeof window === "undefined") return;
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion) return;

        const lenis = new Lenis({
            duration: 1.0,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            touchMultiplier: 1.5,
        });

        // Sinkronisasi Lenis dengan GSAP ScrollTrigger
        lenis.on("scroll", ScrollTrigger.update);

        const updateTicker = (time: number) => {
            lenis.raf(time * 1000);
        };

        gsap.ticker.add(updateTicker);
        gsap.ticker.lagSmoothing(0);

        // Reset scroll ke atas saat navigasi Inertia terjadi tanpa mengganggu navigasi
        const removeNavigateListener = router.on("navigate", () => {
            lenis.scrollTo(0, { immediate: true });
            setTimeout(() => {
                ScrollTrigger.refresh();
            }, 100);
        });

        return () => {
            removeNavigateListener();
            gsap.ticker.remove(updateTicker);
            lenis.destroy();
        };
    }, []);
}
