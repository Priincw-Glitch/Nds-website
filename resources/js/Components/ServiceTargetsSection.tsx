import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// SLA Kecepatan: banner horizontal tanpa kartu, menyatu dengan background halaman.
// Angka 59 dan label dirender sekali sebagai elemen tetap, di luar semua transisi.
// Pergantian satuan, judul, dan deskripsi memakai Motion (AnimatePresence mode "wait")
// supaya teks lama pergi sebelum teks baru masuk, tanpa tumpang tindih.
// Tiap slot teks punya bayangan tak terlihat dari variasi terpanjang sebagai pengunci
// tinggi, jadi pergantian konten tidak menggeser layout.
// Reveal section tetap memakai GSAP + ScrollTrigger yang sudah dipakai di project.
const slaVariations = [
    {
        unit: "Detik",
        title: "Maksimal Respon Chat",
        description: "Respons cepat melalui layanan chat NDS.",
    },
    {
        unit: "Detik",
        title: "Maksimal Respon Telp",
        description: "Respons cepat melalui layanan telepon NDS.",
    },
    {
        unit: "Menit",
        title: "Maksimal Respon Tiket",
        description: "Penanganan laporan melalui sistem tiket NDS.",
    },
    {
        unit: "Menit",
        title: "Maksimal Ganti Hardware",
        description:
            "Tindakan cepat penggantian perangkat keras jaringan bila terjadi kerusakan fatal.",
    },
];

const tallestVariation = slaVariations.reduce((tallest, current) =>
    current.description.length > tallest.description.length ? current : tallest
);

// Siklus 1,9 detik: transisi keluar 0,25 s + masuk 0,3 s, sisanya jeda baca.
// Jeda pendek ini menjaga ritme tetap hidup tanpa terasa terburu-buru.
const ROTATE_INTERVAL_MS = 1900;
const PREMIUM_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Perpindahan hanya fade + slide vertikal tipis. Filter blur sengaja tidak
// dipakai: animasi filter berat di GPU dan justru menahan persepsi kecepatan,
// terutama di mobile. Keadaan diam tidak pernah berubah baik apapun permulaannya.
const contentVariants = {
    enter: { opacity: 0, y: 8 },
    center: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: PREMIUM_EASE },
    },
    exit: {
        opacity: 0,
        y: -6,
        transition: { duration: 0.25, ease: PREMIUM_EASE },
    },
};

// Tanpa props dan di-memo: pergantian konten tidak pernah menyentuh subtree angka.
const StaticSlaNumber = memo(function StaticSlaNumber() {
    return (
        <span className="text-7xl font-extrabold leading-none tracking-tight text-navy tabular-nums sm:text-8xl lg:text-[7.5rem] xl:text-[8rem]">
            59
        </span>
    );
});

export function ServiceTargetsSection() {
    const rootRef = useRef<HTMLElement | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const prefersReducedMotion = useReducedMotion();

    const activeVariation = slaVariations[activeIndex];

    useEffect(() => {
        const node = rootRef.current;
        if (!node) return;

        // Rotasi dan sweep hanya hidup saat section terlihat di viewport.
        // Threshold 0,2 agar rotasi sudah berdimulai begitu section masuk layar,
        // bukan menunggu setengah section penuh terlebih dahulu.
        const observer = new IntersectionObserver(
            ([entry]) => setIsInView(entry.isIntersecting),
            { threshold: 0.2 }
        );
        observer.observe(node);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (prefersReducedMotion || isHovered || !isInView) return;

        const timer = window.setInterval(() => {
            setActiveIndex((current) => (current + 1) % slaVariations.length);
        }, ROTATE_INTERVAL_MS);

        return () => window.clearInterval(timer);
    }, [prefersReducedMotion, isHovered, isInView]);

    useLayoutEffect(() => {
        // Reduced motion: konten tampil statis penuh, tanpa timeline.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                defaults: { ease: "power3.out" },
                scrollTrigger: {
                    trigger: rootRef.current,
                    start: "top 82%",
                    once: true,
                },
            });

            tl.fromTo(
                "[data-sla='header']",
                { autoAlpha: 0, y: 18 },
                { autoAlpha: 1, y: 0, duration: 0.6 }
            )
                .fromTo(
                    "[data-sla='line']",
                    { scaleX: 0 },
                    { scaleX: 1, duration: 0.8, ease: "power2.inOut" },
                    "-=0.3"
                )
                .fromTo(
                    "[data-sla='figure']",
                    { autoAlpha: 0, y: 24 },
                    { autoAlpha: 1, y: 0, duration: 0.65 },
                    "-=0.55"
                )
                .fromTo(
                    "[data-sla='copy']",
                    { autoAlpha: 0, y: 24 },
                    { autoAlpha: 1, y: 0, duration: 0.65 },
                    "<0.1"
                );
        }, rootRef);

        return () => ctx.revert();
    }, []);

    const sweepIsActive = !prefersReducedMotion && isInView;

    return (
        <section
            ref={rootRef}
            aria-label="SLA Kecepatan"
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
            className="group/panel relative overflow-hidden bg-white py-14 lg:py-20"
        >
            {/* Cahaya biru sangat lembut di sisi kanan, memberi kedalaman tanpa mengganggu teks */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-full bg-[radial-gradient(55%_55%_at_100%_45%,rgba(37,99,235,0.08),transparent_70%)] opacity-80 transition-opacity duration-700 group-hover/panel:opacity-100 lg:w-2/3"
            />

            {/* Tekstur grid teknis sangat tipis, konteks infrastruktur/SLA */}
            <div
                aria-hidden="true"
                className="tech-grid-pattern pointer-events-none absolute inset-0 opacity-70"
            />

            <div className="container-nds relative">
                <div data-sla="header">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-tech-blue">
                        SLA Kecepatan
                    </h2>
                </div>

                {/* Garis aksen Electric Blue dengan light sweep pelan, bukan neon */}
                <div
                    data-sla="line"
                    aria-hidden="true"
                    className="relative mt-4 h-px w-full origin-left overflow-hidden bg-gradient-to-r from-tech-blue via-tech-blue/60 to-transparent"
                >
                    <motion.div
                        className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-electric-light to-transparent opacity-60"
                        initial={false}
                        animate={sweepIsActive ? { x: ["-120%", "320%"] } : { x: "-120%" }}
                        transition={
                            sweepIsActive
                                ? {
                                      duration: 9,
                                      repeat: Infinity,
                                      repeatDelay: 3,
                                      ease: "easeInOut",
                                  }
                                : { duration: 0.4 }
                        }
                    />
                </div>

                <div className="relative mt-9 flex flex-col gap-6 lg:mt-11 lg:flex-row lg:items-center lg:gap-10">
                    {/* Topologi jaringan minimalis: pelengkap visual di sisi kanan banner */}
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 160 96"
                        fill="none"
                        className="pointer-events-none absolute right-0 top-1/2 hidden h-24 w-40 -translate-y-1/2 text-tech-blue/35 xl:block"
                    >
                        <path
                            d="M6 78 58 42 96 62 154 14"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeDasharray="2 5"
                        />
                        <path
                            d="M58 42 54 8"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeDasharray="2 5"
                        />
                        <circle cx="6" cy="78" r="2.5" fill="currentColor" />
                        <circle cx="58" cy="42" r="3" fill="currentColor" />
                        <circle cx="96" cy="62" r="2.5" fill="currentColor" />
                        <circle cx="154" cy="14" r="3" fill="currentColor" />
                        <circle cx="54" cy="8" r="2" fill="currentColor" />
                    </svg>

                    {/* Elemen tetap: angka 59 tidak ikut transisi konten */}
                    <div data-sla="figure" className="flex shrink-0 items-baseline gap-3">
                        <StaticSlaNumber />
                        <span className="grid">
                            {/* Pengunci lebar: kata terpanjang menentukan lebar satuan */}
                            {["Detik", "Menit"].map((unit) => (
                                <span
                                    key={unit}
                                    aria-hidden="true"
                                    className="invisible col-start-1 row-start-1 text-base font-bold uppercase tracking-wider sm:text-lg lg:text-xl"
                                >
                                    {unit}
                                </span>
                            ))}

                            <AnimatePresence mode="wait" initial={false}>
                                <motion.span
                                    key={activeVariation.unit}
                                    variants={contentVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    className="col-start-1 row-start-1 text-base font-bold uppercase tracking-wider text-tech-blue sm:text-lg lg:text-xl"
                                >
                                    {activeVariation.unit}
                                </motion.span>
                            </AnimatePresence>
                        </span>
                    </div>

                    <div
                        aria-hidden="true"
                        className="hidden h-24 w-px shrink-0 self-center bg-border-soft lg:block"
                    />

                    <div data-sla="copy" className="min-w-0 lg:flex-1">
                        <div className="grid">
                            {/* Pengunci tinggi: variasi terpanjang menjaga blok tidak bergeser */}
                            <div
                                aria-hidden="true"
                                className="invisible col-start-1 row-start-1 select-none"
                            >
                                <h3 className="text-2xl font-semibold leading-[1.15] tracking-tight sm:text-3xl lg:text-[2rem] xl:text-[2.25rem]">
                                    {tallestVariation.title}
                                </h3>
                                <p className="mt-2.5 max-w-2xl text-base leading-relaxed sm:text-lg xl:text-xl">
                                    {tallestVariation.description}
                                </p>
                            </div>

                            <div className="col-start-1 row-start-1">
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                        key={activeVariation.title}
                                        variants={contentVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                    >
                                        <h3 className="text-2xl font-semibold leading-[1.15] tracking-tight text-navy sm:text-3xl lg:text-[2rem] xl:text-[2.25rem]">
                                            {activeVariation.title}
                                        </h3>
                                        <p className="mt-2.5 max-w-2xl text-base leading-relaxed text-body-text sm:text-lg xl:text-xl">
                                            {activeVariation.description}
                                        </p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Indikator urutan SLA: penanda visual, bukan navigasi.
                            Panjang semua garis sama dan tidak ikut beranimasi ukuran,
                            jadi posisinya tetap saat konten berganti. */}
                        <div aria-hidden="true" className="mt-6 ml-2 flex items-center gap-2">
                            {slaVariations.map((variation, idx) => (
                                <span
                                    key={variation.title}
                                    className={[
                                        "h-[3px] w-8 rounded-full transition-colors duration-300 ease-out",
                                        idx === activeIndex ? "bg-tech-blue" : "bg-body-text/25",
                                    ].join(" ")}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
