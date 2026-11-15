import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useGsapReveal() {
    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            document.querySelectorAll<HTMLElement>(".gsap-reveal").forEach((el) => {
                el.style.opacity = "1";
                el.style.transform = "none";
            });
            return;
        }

        const ctx = gsap.context(() => {
            document.querySelectorAll<HTMLElement>(".gsap-reveal").forEach((el) => {
                gsap.fromTo(
                    el,
                    { opacity: 0, y: 32 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.7,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: el,
                            start: "top 88%",
                            once: true,
                        },
                    }
                );
            });
        });

        return () => ctx.revert();
    }, []);
}

export function useHeroAnimation() {
    useEffect(() => {
        // Halaman tanpa hero (mis. Services, Blog) tidak menganimasikan apa pun;
        // tanpa guard ini GSAP memuntahkan puluhan warning "target not found".
        const targets = document.querySelectorAll<HTMLElement>("[data-hero]");
        if (targets.length === 0) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            targets.forEach((el) => {
                el.style.opacity = "1";
                el.style.transform = "none";
            });
            return;
        }

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            if (document.querySelector("[data-hero='title']")) {
                tl.fromTo("[data-hero='title']", { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.15 });
            }
            if (document.querySelector("[data-hero='desc']")) {
                tl.fromTo("[data-hero='desc']", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, tl.duration() > 0 ? "-=0.35" : undefined);
            }
            if (document.querySelector("[data-hero='actions']")) {
                tl.fromTo("[data-hero='actions'] > *", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, tl.duration() > 0 ? "-=0.3" : undefined);
            }
            if (document.querySelector("[data-hero='tagline']")) {
                tl.fromTo("[data-hero='tagline']", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7 }, tl.duration() > 0 ? "-=1.0" : undefined);
            }

            const bg = document.querySelector<HTMLElement>("[data-hero='bg']");
            if (bg && bg.parentElement) {
                gsap.fromTo(
                    bg,
                    { yPercent: -3 },
                    {
                        yPercent: 3,
                        ease: "none",
                        scrollTrigger: {
                            trigger: bg.parentElement,
                            start: "top top",
                            end: "bottom top",
                            scrub: 0.8,
                        },
                    }
                );
            }
        });

        return () => ctx.revert();
    }, []);
}
