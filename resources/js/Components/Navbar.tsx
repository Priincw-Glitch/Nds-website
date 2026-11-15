import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";
import { Menu, X, ChevronDown, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/Components/ui/button";
import { ServiceIcon } from "@/Components/ServiceIcon";
import { logoUrl, assetUrl } from "@/utils/assets";

interface NavService {
    id: number;
    name: string;
    slug: string;
    icon?: string | null;
    category?: { id: number; name: string; slug: string } | null;
}

interface NavServiceGroup {
    slug: string;
    name: string;
    items: NavService[];
}

// Menu layanan hanya memuat layanan yang dipublikasikan, dikelompokkan
// menurut kategori data layanan (dikelola developer).
function groupServices(services: NavService[]): NavServiceGroup[] {
    const groups: NavServiceGroup[] = [];

    services.forEach((service) => {
        const slug = service.category?.slug || "lainnya";
        const name = service.category?.name || "Layanan";
        let group = groups.find((item) => item.slug === slug);

        if (!group) {
            group = { slug, name, items: [] };
            groups.push(group);
        }

        group.items.push(service);
    });

    return groups;
}

// Shared transition config for navbar and logo - keeps them perfectly in sync
const TRANSITION_CONFIG = {
    duration: 0.5,
    ease: [0.25, 0.46, 0.45, 0.94] as const, // ease-out-cubic equivalent
};

// CSS transition string that matches Framer Motion config exactly
const NAVBAR_TRANSITION = "all 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)";

// Scroll thresholds with hysteresis to prevent flickering near boundary
const SCROLL_DOWN_THRESHOLD = 100;
const SCROLL_UP_THRESHOLD = 50;

export function Navbar() {
    const page = usePage();
    const url = page.url;
    const settings = (page.props as any).settings || {};
    const auth = (page.props as any).auth;
    const navServices = ((page.props as any).navServices || []) as NavService[];
    const serviceGroups = useMemo(() => groupServices(navServices), [navServices]);
    const user = auth?.user;
    const userHref = user ? (user.role === 'admin' ? route('admin.dashboard') : route('customer.dashboard')) : route('login');
    const userLabel = user ? (user.role === 'admin' ? 'Dashboard Admin' : 'Dashboard Pelanggan') : 'Login';
    const [isScrolled, setIsScrolled] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const [servicesOpen, setServicesOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
    const aboutRef = useRef<HTMLDivElement>(null);
    const servicesRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    // Debounced scroll handler with hysteresis for stable transitions
    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    // Hysteresis: different thresholds for entering vs leaving scrolled state
                    if (isScrolled) {
                        setIsScrolled(scrollY > SCROLL_UP_THRESHOLD);
                    } else {
                        setIsScrolled(scrollY > SCROLL_DOWN_THRESHOLD);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [isScrolled]);

    // Hook to detect prefers-reduced-motion
    function useReducedMotion() {
        const [prefersReduced, setPrefersReduced] = useState(false);
        useEffect(() => {
            const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
            setPrefersReduced(mediaQuery.matches);
            const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
            mediaQuery.addEventListener("change", handler);
            return () => mediaQuery.removeEventListener("change", handler);
        }, []);
        return prefersReduced;
    }

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setAboutOpen(false);
                setServicesOpen(false);
                setMobileOpen(false);
            }
        };
        const onClick = (e: MouseEvent) => {
            if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) {
                setAboutOpen(false);
            }
            if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
                setServicesOpen(false);
            }
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onClick);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onClick);
        };
    }, []);

    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileOpen]);

    const isActive = useCallback(
        (href: string) => url === href || url.startsWith(href + "/"),
        [url]
    );

    const isServicesActive = url.startsWith("/services/");
    const isAboutActive = url.startsWith("/about");

    const darkTopUrls = ["/", "/about", "/services", "/promo", "/blog", "/contact", "/privacy"];
    const isDarkPage = darkTopUrls.some((p) => (p === "/" ? url === "/" : url.startsWith(p)));
    const onDark = (isDarkPage && !isScrolled) || isScrolled;

    const logoTransparent = logoUrl(settings?.logo_path);
    const logoScrolled = assetUrl("images/logo-scrolled.png");

    const navLinkClass = (active: boolean) =>
        onDark
            ? `relative px-3 py-2.5 text-sm font-semibold transition-all duration-300 rounded-lg select-none cursor-pointer touch-target ${
                  active ? "font-bold text-white bg-white/10" : "text-white/90 hover:text-white hover:bg-white/10"
              }`
            : `relative px-3 py-2.5 text-sm font-semibold transition-all duration-300 rounded-lg select-none cursor-pointer touch-target ${
                  active ? "text-tech-blue bg-tech-blue/8 font-bold" : "text-navy/80 hover:text-navy hover:bg-navy/5"
              }`;

    // Logo component using motion for smooth crossfade with scale transform (desktop only)
    const Logo = () => {
        const logoTransition = prefersReducedMotion ? { duration: 0 } : TRANSITION_CONFIG;

        return (
            <Link
                href={route("home")}
                className="relative flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue shrink-0"
                aria-label="NDS Beranda"
            >
                <div className="relative h-10 w-auto">
                    {/* Invisible base image maintains layout width/height - both logos sized identically */}
                    <img src={logoTransparent} alt="" className="invisible h-10 w-auto" />
                    <motion.img
                        src={logoTransparent}
                        alt=""
                        className="absolute left-0 top-1/2 h-10 w-auto -translate-y-1/2 object-contain"
                        initial={false}
                        animate={{
                            opacity: isScrolled ? 0 : 1,
                            scale: isScrolled ? 0.95 : 1,
                        }}
                        transition={logoTransition}
                        style={{ transformOrigin: "center center" }}
                    />
                    <motion.img
                        src={logoScrolled}
                        alt=""
                        className="absolute left-0 top-1/2 h-10 w-auto -translate-y-1/2 object-contain"
                        initial={false}
                        animate={{
                            opacity: isScrolled ? 1 : 0,
                            scale: isScrolled ? 1 : 0.95,
                        }}
                        transition={logoTransition}
                        style={{ transformOrigin: "center center" }}
                    />
                </div>
            </Link>
        );
    };

    // Mobile-only logo (simplified, no scroll animation) - uses light version for dark navbar
    const MobileLogo = () => (
        <Link
            href={route("home")}
            className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue shrink-0"
            aria-label="NDS Beranda"
        >
            <img
                src={logoScrolled}
                alt=""
                className="h-9 w-auto object-contain"
            />
        </Link>
    );

    return (
        <>
            {/* Desktop Header - Full featured with scroll animations */}
            <header className="hidden lg:block fixed top-0 left-0 right-0 z-50">
                <div
                    className={`${isScrolled ? "py-3" : "py-0"}`}
                    style={{
                        transition: NAVBAR_TRANSITION,
                    }}
                >
                    <div
                        className={`${isScrolled ? "max-w-[1200px] mx-auto px-6 rounded-[18px] bg-navy-glass border border-white-15 shadow-lg backdrop-blur-md" : "w-full px-8"}`}
                        style={{
                            transition: NAVBAR_TRANSITION,
                        }}
                    >
                        <div className="flex items-center w-full h-16">
                            {/* Logo on left */}
                            <Logo />

                            {/* Centered Menu */}
                            <nav className="flex-1 hidden lg:flex items-center justify-center gap-8" aria-label="Navigasi utama">
                                <Link href={route("home")} className={navLinkClass(url === "/")}>
                                    Beranda
                                </Link>

                                {/* Layanan - Mega Dropdown */}
                                <div ref={servicesRef} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setServicesOpen((v) => !v)}
                                        aria-expanded={servicesOpen}
                                        aria-haspopup="true"
                                        className={`${navLinkClass(isServicesActive)} flex items-center gap-1.5`}
                                    >
                                        <span>Layanan</span>
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${onDark ? "text-white/60" : "text-body-text/60"} ${servicesOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    <AnimatePresence>
                                        {servicesOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, x: "-50%" }}
                                                animate={{ opacity: 1, y: 0, x: "-50%" }}
                                                exit={{ opacity: 0, y: 10, x: "-50%" }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute left-1/2 top-full z-50 mt-2 w-[560px] rounded-xl border border-border-soft bg-white p-5 shadow-dropdown"
                                            >
                                                {serviceGroups.length > 0 ? (
                                                    <div className="grid grid-cols-2 gap-x-6">
                                                        {serviceGroups.map((group, groupIndex) => (
                                                            <div
                                                                key={group.slug}
                                                                className={groupIndex > 0 ? "border-l border-border-soft pl-6" : ""}
                                                            >
                                                                <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-tech-blue">
                                                                    {group.name}
                                                                </p>
                                                                <ul className="space-y-0.5">
                                                                    {group.items.map((item) => (
                                                                        <li key={item.id}>
                                                                            <Link
                                                                                href={route("services.show", item.slug)}
                                                                                onClick={() => setServicesOpen(false)}
                                                                                className="group flex items-center gap-2.5 rounded-lg p-2 transition-all hover:bg-navy/5"
                                                                            >
                                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tech-blue/10 text-tech-blue transition-colors group-hover:bg-navy group-hover:text-white">
                                                                                    <ServiceIcon name={item.icon} className="h-4 w-4" />
                                                                                </div>
                                                                                <p className="text-sm font-bold text-navy group-hover:text-tech-blue">
                                                                                    {item.name}
                                                                                </p>
                                                                            </Link>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="px-2 py-1 text-sm text-body-text">
                                                        Belum ada layanan yang ditayangkan.
                                                    </p>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Tentang Kami - Direct Link */}
                                <Link href={route("about")} className={navLinkClass(isAboutActive)}>
                                    Tentang Kami
                                </Link>

                                <Link href={route("promo")} className={navLinkClass(isActive("/promo"))}>
                                    Promo
                                </Link>
                                <Link href={route("blog")} className={navLinkClass(isActive("/blog"))}>
                                    Blog
                                </Link>
                                <Link href={route("contact")} className={navLinkClass(isActive("/contact"))}>
                                    Hubungi Kami
                                </Link>
                            </nav>

                            {/* Login on right */}
                            <div className="flex items-center shrink-0 ml-auto">
                                <Link
                                    href={userHref}
                                    className={`flex items-center justify-center h-9 w-9 rounded-lg border transition-colors ${onDark ? "border-white/25 bg-white/10 text-white hover:bg-white/20" : "border-border-soft bg-white text-navy hover:bg-navy/5"}`}
                                    aria-label={userLabel}
                                    title={userLabel}
                                >
                                    <User className="h-5 w-5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
                </header>

            {/* Mobile Header - Simple fixed navbar with only logo and hamburger (NDS brand colors) */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-navy border-b border-white/10">
                <div className="flex items-center justify-between h-full px-4">
                    {/* Logo on left */}
                    <MobileLogo />

                    {/* Hamburger on right */}
                    <button
                        type="button"
                        onClick={() => setMobileOpen((v) => !v)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue touch-target hover:bg-white/10"
                        aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </header>

            {/* Mobile Navigation Panel */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-sm lg:hidden"
                        />

                        {/* Slide-in Panel - Dark theme matching desktop scrolled navbar */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="fixed right-0 top-16 bottom-0 z-50 w-full max-w-sm bg-navy border-l border-white/10 shadow-2xl overflow-y-auto lg:hidden"
                        >
                            <div className="p-6 flex flex-col h-full">
                                <nav className="flex flex-col gap-1.5" aria-label="Navigasi mobile">
                                    <Link
                                        href={route("home")}
                                        onClick={() => setMobileOpen(false)}
                                        className={`rounded-xl px-4 py-3 text-base font-bold transition-colors ${url === "/" ? "bg-tech-blue/20 text-white" : "text-white/90 hover:bg-white/10 hover:text-white"}`}
                                    >
                                        Beranda
                                    </Link>

                                    {/* Layanan - Expandable on Mobile */}
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => setMobileServicesOpen((v) => !v)}
                                            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-bold transition-colors ${isServicesActive ? "bg-tech-blue/20 text-white" : "text-white/90 hover:bg-white/10 hover:text-white"}`}
                                        >
                                            <span>Layanan</span>
                                            <ChevronDown className={`h-5 w-5 transition-transform text-white/70 ${mobileServicesOpen ? "rotate-180" : ""}`} />
                                        </button>
                                        <AnimatePresence>
                                            {mobileServicesOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="ml-4 border-l-2 border-tech-blue/40 pl-3 my-2 space-y-1">
                                                        {serviceGroups.length > 0 ? (
                                                            serviceGroups.map((group) => (
                                                                <div key={group.slug}>
                                                                    <p className="mt-3 px-3 py-1 text-[11px] font-bold uppercase text-tech-blue">
                                                                        {group.name}
                                                                    </p>
                                                                    {group.items.map((item) => (
                                                                        <Link
                                                                            key={item.id}
                                                                            href={route("services.show", item.slug)}
                                                                            onClick={() => setMobileOpen(false)}
                                                                            className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                                                                        >
                                                                            {item.name}
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="px-3 py-2 text-sm text-white/70">
                                                                Belum ada layanan yang ditayangkan.
                                                            </p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Tentang Kami - Direct Link */}
                                    <Link
                                        href={route("about")}
                                        onClick={() => setMobileOpen(false)}
                                        className={`rounded-xl px-4 py-3 text-base font-bold transition-colors ${isAboutActive ? "bg-tech-blue/20 text-white" : "text-white/90 hover:bg-white/10 hover:text-white"}`}
                                    >
                                        Tentang Kami
                                    </Link>

                                    <Link
                                        href={route("promo")}
                                        onClick={() => setMobileOpen(false)}
                                        className={`rounded-xl px-4 py-3 text-base font-bold transition-colors ${isActive("/promo") ? "bg-tech-blue/20 text-white" : "text-white/90 hover:bg-white/10 hover:text-white"}`}
                                    >
                                        Promo
                                    </Link>
                                    <Link
                                        href={route("blog")}
                                        onClick={() => setMobileOpen(false)}
                                        className={`rounded-xl px-4 py-3 text-base font-bold transition-colors ${isActive("/blog") ? "bg-tech-blue/20 text-white" : "text-white/90 hover:bg-white/10 hover:text-white"}`}
                                    >
                                        Blog
                                    </Link>
                                    <Link
                                        href={route("contact")}
                                        onClick={() => setMobileOpen(false)}
                                        className={`rounded-xl px-4 py-3 text-base font-bold transition-colors ${isActive("/contact") ? "bg-tech-blue/20 text-white" : "text-white/90 hover:bg-white/10 hover:text-white"}`}
                                    >
                                        Hubungi Kami
                                    </Link>
                                </nav>

                                {/* Login / Dashboard Button at bottom */}
                                <div className="mt-auto border-t border-white/10 pt-6 space-y-3">
                                    <Button asChild variant="primary" size="lg" className="w-full font-bold">
                                        <Link href={userHref} onClick={() => setMobileOpen(false)}>
                                            <User className="h-4 w-4" />
                                            <span>{user ? "Dashboard" : "Login"}</span>
                                        </Link>
                                    </Button>
                                    <p className="text-center text-xs text-white/60">
                                        {user ? "Buka dashboard akun Anda." : "Masuk ke akun Anda untuk mengakses layanan."}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}