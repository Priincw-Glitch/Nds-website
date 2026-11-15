import type { ReactNode } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { useEffect, useRef, useState } from "react";
import { TawkWidget } from "@/Components/TawkWidget";
import { logoUrl, storageUrl } from "@/utils/assets";
import {
    LayoutDashboard,
    Package,
    MessageSquare,
    Bell,
    User,
    LogOut,
    Menu,
    X,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Wrench,
} from "lucide-react";

/**
 * Badge jumlah pesan Support yang belum dibaca. Dikeo dari endpoint ringan
 * yang sama dengan badge notifikasi agar nav tetap sinkron dengan chat.
 */
function useUnreadSupport() {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let alive = true;
        const fetchCount = async () => {
            try {
                const res = await fetch(route("customer.support.unread"), {
                    headers: { Accept: "application/json" },
                });
                if (res.ok && alive) {
                    const json = (await res.json()) as { count?: number };
                    setCount(json.count ?? 0);
                }
            } catch {
                // Badge diam saja saat offline; chat tetap berfungsi.
            }
        };
        fetchCount();
        const interval = setInterval(fetchCount, 60000);
        return () => {
            alive = false;
            clearInterval(interval);
        };
    }, []);
    return count;
}

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

export default function CustomerLayout({ children, title }: { children: ReactNode; title?: string }) {
    const { auth, flash, settings } = usePage().props as unknown as {
        auth?: { user: { id: number; name: string; email: string; avatar?: string | null } | null };
        flash?: { success?: string; error?: string };
        settings?: { logo_path?: string | null; company_name?: string };
    };
    const user = auth?.user;

    // Jumlah notifikasi belum dibaca. Sumbernya endpoint JSON asli, agar badge
    // muncul di semua halaman panel tanpa prop tambahan dari tiap controller.
    const [unreadNotifs, setUnreadNotifs] = useState(0);
    const unreadSupport = useUnreadSupport();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [dismissFlash, setDismissFlash] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const currentUrl = typeof window !== "undefined" ? window.location.pathname : "";

    useEffect(() => {
        let alive = true;
        const fetchBadgeCount = async () => {
            try {
                const res = await fetch(route("customer.notifications.unread-count"), {
                    headers: { Accept: "application/json" },
                });
                if (res.ok && alive) {
                    const json = (await res.json()) as { count?: number };
                    setUnreadNotifs(json.count ?? 0);
                }
            } catch {
                // Network/CSR error: badge tetap tersembunyi, halaman tidak berdampak.
            }
        };
        fetchBadgeCount();
        const interval = setInterval(fetchBadgeCount, 60000);
        return () => {
            alive = false;
            clearInterval(interval);
        };
    }, []);

    // Tutup menu profil dan drawer mobile saat klik di luar atau tekan Escape
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (profileOpen && profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            if (profileOpen) setProfileOpen(false);
            if (sidebarOpen) setSidebarOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [profileOpen, sidebarOpen]);

    const navItems: NavItem[] = [
        { label: "Overview", href: route("customer.dashboard"), icon: LayoutDashboard },
        { label: "My Promo", href: route("customer.promos.index"), icon: Package },
        { label: "Layanan Saya", href: route("customer.services.index"), icon: Wrench },
        { label: "Support Chat", href: route("customer.support.index"), icon: MessageSquare },
        { label: "Notifications", href: route("customer.notifications.index"), icon: Bell },
        { label: "My Profile", href: route("customer.profile"), icon: User },
    ];

    const logout = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route("logout"));
    };

    return (
        <div className="min-h-screen bg-light-gray flex flex-col">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-navy/60 backdrop-blur-xs transition-opacity lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-68 flex-col border-r border-border-soft bg-navy text-white transition-transform duration-300 ease-out lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Brand Header */}
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6">
                    <Link href={route("customer.dashboard")} className="flex items-center gap-2.5" aria-label="NDS Customer Portal">
                        <img
                            src={logoUrl(settings?.logo_path)}
                            alt={settings?.company_name || "NDS"}
                            className="h-8 w-auto shrink-0 brightness-0 invert"
                        />
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-white/80 uppercase">
                            Pelanggan
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
                        aria-label="Tutup menu sidebar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation Menu */}
                <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-5">
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">Portal Pelanggan</p>
                    <nav className="mt-2 space-y-1">
                        {navItems.map((item) => {
                            const active =
                                currentUrl.startsWith(item.href) ||
                                (item.href === route("customer.dashboard") && currentUrl === "/customer/dashboard");
                            const badge =
                                item.label === "Notifications" ? unreadNotifs : item.label === "Support Chat" ? unreadSupport : 0;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                        active
                                            ? "bg-tech-blue text-white font-semibold shadow-xs"
                                            : "text-white/75 hover:bg-white/8 hover:text-white"
                                    }`}
                                >
                                    <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-white/60"}`} />
                                    <span className="truncate">{item.label}</span>
                                    {badge > 0 && (
                                        <span className="ml-auto rounded-full bg-crimson px-2 py-0.5 text-[10px] font-bold text-white">
                                            {badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* User Profile & Logout Footer */}
                <div className="shrink-0 border-t border-white/10 p-4">
                    <div className="flex items-center gap-3 rounded-lg bg-white/5 p-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-tech-blue text-white">
                            {user?.avatar ? (
                                <img src={storageUrl(user.avatar)} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold">{(user?.name || "C").slice(0, 1).toUpperCase()}</span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-white">{user?.name || "Pelanggan"}</p>
                            <p className="truncate text-[11px] text-white/50">{user?.email || "-"}</p>
                        </div>
                        <form onSubmit={logout}>
                            <button
                                type="submit"
                                title="Keluar"
                                aria-label="Keluar dari Portal Pelanggan"
                                className="rounded-md p-1.5 text-white/60 transition-colors hover:bg-crimson/20 hover:text-crimson"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </aside>

            {/* Main Content Container */}
            <div className="flex min-w-0 flex-1 flex-col lg:pl-68">
                {/* Topbar Header */}
                <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border-soft bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="rounded-lg border border-border-soft p-2 text-navy hover:bg-navy/5 lg:hidden"
                            aria-label="Buka menu navigasi"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-1.5 text-xs text-body-text">
                            <span>Portal Pelanggan /</span>
                            <span className="font-semibold text-navy">{title || "Overview"}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href={route("home")}
                            target="_blank"
                            className="hidden items-center gap-1.5 rounded-lg border border-border-soft bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5 transition-colors sm:inline-flex"
                        >
                            <span>Lihat Website</span>
                            <ExternalLink className="h-3.5 w-3.5 text-body-text" />
                        </Link>

                        {/* Menu profil pelanggan */}
                        <div ref={profileRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setProfileOpen((v) => !v)}
                                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border-soft bg-white px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-navy/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tech-blue"
                                aria-haspopup="menu"
                                aria-expanded={profileOpen}
                            >
                                <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-navy text-[10px] font-bold text-white">
                                    {user?.avatar ? (
                                        <img src={storageUrl(user.avatar)} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        (user?.name || "C").slice(0, 1).toUpperCase()
                                    )}
                                </span>
                                <span className="hidden max-w-32 truncate sm:block">{user?.name || "Pelanggan"}</span>
                            </button>

                            {profileOpen && (
                                <div
                                    role="menu"
                                    className="absolute right-0 top-full z-40 mt-2 w-56 rounded-lg border border-border-soft bg-white p-2 shadow-lg"
                                >
                                    <div className="border-b border-border-soft px-2 pb-2">
                                        <p className="truncate text-xs font-semibold text-navy">{user?.name || "Pelanggan"}</p>
                                        <p className="truncate text-[11px] text-body-text">{user?.email || "-"}</p>
                                    </div>
                                    <Link
                                        href={route("customer.profile")}
                                        onClick={() => setProfileOpen(false)}
                                        role="menuitem"
                                        className="mt-1 flex items-center gap-2 rounded-md px-2 py-2 text-sm text-navy transition-colors hover:bg-navy/5"
                                    >
                                        <User className="h-4 w-4 text-body-text" />
                                        <span>Profil Saya</span>
                                    </Link>
                                    <form onSubmit={logout}>
                                        <button
                                            type="submit"
                                            role="menuitem"
                                            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-navy transition-colors hover:bg-navy/5"
                                        >
                                            <LogOut className="h-4 w-4 text-body-text" />
                                            <span>Keluar</span>
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Main Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {flash?.success && !dismissFlash && (
                        <div className="mb-6 flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-900 shadow-xs">
                            <div className="flex items-center gap-2.5">
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                                <p className="text-sm font-medium">{flash.success}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDismissFlash(true)}
                                className="text-emerald-700 hover:text-emerald-900"
                                aria-label="Tutup notifikasi"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                    {flash?.error && !dismissFlash && (
                        <div className="mb-6 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50/90 p-4 text-red-900 shadow-xs">
                            <div className="flex items-center gap-2.5">
                                <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                                <p className="text-sm font-medium">{flash.error}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDismissFlash(true)}
                                className="text-red-700 hover:text-red-900"
                                aria-label="Tutup peringatan"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {children}
                </main>
            </div>
            <TawkWidget />
        </div>
    );
}
