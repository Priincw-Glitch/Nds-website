import type { ReactNode } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { useEffect, useRef, useState } from "react";
import { logoUrl } from "@/utils/assets";
import {
    LayoutDashboard,
    Server,
    Megaphone,
    Newspaper,
    Inbox,
    FileText,
    FolderKanban,
    Settings,
    LogOut,
    Menu,
    X,
    MapPin,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    User,
    Users,
    Wrench,
    ChevronRight,
    PanelLeftClose,
    PanelLeftOpen,
    PanelBottom,
} from "lucide-react";

interface NavGroup {
    title: string;
    items: Array<{
        label: string;
        href: string;
        icon: React.ComponentType<{ className?: string }>;
    }>;
}

export default function AdminLayout({ children, title }: { children: ReactNode; title?: string }) {
    const { auth, flash, settings, unreadMessages } = usePage().props as unknown as {
        auth?: { user: { id: number; name: string; email: string } | null };
        flash?: { success?: string; error?: string };
        settings?: { logo_path?: string | null; company_name?: string };
        unreadMessages?: number;
    };
    const SIDEBAR_STATE_KEY = "nds_admin_sidebar_collapsed";
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === "undefined") return false;
        try {
            return window.localStorage.getItem(SIDEBAR_STATE_KEY) === "collapsed";
        } catch {
            return false;
        }
    });
    const [profileOpen, setProfileOpen] = useState(false);
    const [dismissFlash, setDismissFlash] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const currentUrl = typeof window !== "undefined" ? window.location.pathname : "";

    // Preferensi sidebar dipertahankan antar halaman karena AdminLayout
    // di-remount setiap kali Inertia berpindah komponen halaman.
    const toggleCollapsed = () => {
        setCollapsed((v) => {
            try {
                window.localStorage.setItem(SIDEBAR_STATE_KEY, v ? "expanded" : "collapsed");
            } catch {
                // localStorage bisa gagal (mode privat); toggle tetap berjalan.
            }
            return !v;
        });
    };

    // Tutup menu profil dan drawer mobile saat klik di luar atau tekan Escape
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (profileOpen && profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            if (profileOpen) {
                setProfileOpen(false);
            }
            if (sidebarOpen) {
                setSidebarOpen(false);
            }
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [profileOpen, sidebarOpen]);

    const navGroups: NavGroup[] = [
        {
            title: "Menu Utama",
            items: [
                { label: "Dashboard", href: route("admin.dashboard"), icon: LayoutDashboard },
            ],
        },
        {
            title: "Layanan & Penawaran",
            items: [
                { label: "Layanan", href: route("admin.services.index"), icon: Server },
                { label: "Cakupan Wilayah", href: route("admin.coverages.index"), icon: MapPin },
                { label: "Promo & Diskon", href: route("admin.promos.index"), icon: Megaphone },
            ],
        },
        {
            title: "Konten & Pesan",
            items: [
                { label: "Artikel Blog", href: route("admin.articles.index"), icon: Newspaper },
                { label: "Halaman Statis", href: route("admin.pages.index"), icon: FileText },
                { label: "Portofolio Proyek", href: route("admin.projects.index"), icon: FolderKanban },
                { label: "Pesan Masuk", href: route("admin.messages.index"), icon: Inbox },
            ],
        },
        {
            title: "Pelanggan & Portal",
            items: [
                { label: "Data Pelanggan", href: route("admin.customers.index"), icon: Users },
                { label: "Layanan Pelanggan", href: route("admin.customer-services.index"), icon: Wrench },
            ],
        },
        {
            title: "Konfigurasi",
            items: [
                { label: "Pengaturan Situs", href: route("admin.settings.edit"), icon: Settings },
                { label: "Pengaturan Footer", href: route("admin.footer-settings.edit"), icon: PanelBottom },
            ],
        },
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
                className={`fixed inset-y-0 left-0 z-50 flex w-68 flex-col border-r border-border-soft bg-navy text-white transition-[width,transform] duration-300 ease-out lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } ${collapsed ? "lg:w-20" : ""}`}
            >
                {/* Brand Header */}
                <div className={`flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6 ${collapsed ? "lg:px-4" : ""}`}>
                    <Link href={route("admin.dashboard")} className="flex items-center gap-2.5" aria-label="NDS Admin Panel">
                        <img
                            src={logoUrl(settings?.logo_path)}
                            alt={settings?.company_name || "NDS"}
                            className={`h-8 w-auto shrink-0 brightness-0 invert ${collapsed ? "lg:mx-auto" : ""}`}
                        />
                        <span
                            className={`rounded bg-tech-blue/20 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-electric-light uppercase ${collapsed ? "lg:hidden" : ""}`}
                        >
                            Admin
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden touch-target"
                        aria-label="Tutup menu sidebar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation Menu */}
                <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-5 space-y-6">
                    {navGroups.map((group) => (
                        <div key={group.title}>
                            <div aria-hidden="true" className={`mx-1 border-t border-white/10 ${collapsed ? "hidden lg:block" : "hidden"}`} />
                            <p className={`px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40 ${collapsed ? "lg:hidden" : ""}`}>
                                {group.title}
                            </p>
                            <nav className="mt-2 space-y-1">
                                {group.items.map((item) => {
                                    const active =
                                        currentUrl.startsWith(item.href) ||
                                        (item.href === route("admin.dashboard") && currentUrl === "/admin");
                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            title={collapsed ? item.label : undefined}
                                            className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                                active
                                                    ? "bg-tech-blue text-white font-semibold shadow-xs"
                                                    : "text-white/75 hover:bg-white/8 hover:text-white"
                                            } ${collapsed ? "lg:justify-center" : ""}`}
                                        >
                                            <item.icon
                                                className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-white/60"}`}
                                            />
                                            <span className={`${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
                                            {/* Badge jumlah pesan menunggu dibalas; hanya pada Pesan Masuk karena
                                                props unreadMessages dihitung dari contact messages, bukan tiket. */}
                                            {item.label === "Pesan Masuk" && (unreadMessages ?? 0) > 0 && (
                                                <>
                                                    <span
                                                        className={`ml-auto rounded-full bg-crimson px-2 py-0.5 text-[10px] font-bold text-white ${collapsed ? "lg:hidden" : ""}`}
                                                    >
                                                        {unreadMessages}
                                                    </span>
                                                    <span
                                                        className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-crimson ${collapsed ? "hidden lg:block" : "hidden"}`}
                                                    />
                                                </>
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>

                {/* User Profile & Logout Footer */}
                <div className="shrink-0 border-t border-white/10 p-4">
                    <div
                        className={`flex items-center gap-3 rounded-lg bg-white/5 p-2.5 ${collapsed ? "lg:justify-center lg:px-1" : ""}`}
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tech-blue text-white">
                            <User className="h-4 w-4" />
                        </div>
                        <div className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
                            <p className="truncate text-xs font-semibold text-white">{auth?.user?.name || "Administrator"}</p>
                            <p className="truncate text-[11px] text-white/50">{auth?.user?.email || "-"}</p>
                        </div>
                        <form onSubmit={logout} className={collapsed ? "lg:hidden" : ""}>
                            <button
                                type="submit"
                                title="Keluar dari Admin"
                                aria-label="Keluar dari Admin"
                                className="rounded-md p-1.5 text-white/60 hover:bg-crimson/20 hover:text-crimson transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </aside>

            {/* Main Content Container */}
            <div
                className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-out ${collapsed ? "lg:pl-20" : "lg:pl-68"}`}
            >
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
                        <button
                            type="button"
                            onClick={toggleCollapsed}
                            className="hidden rounded-lg border border-border-soft p-2 text-body-text hover:bg-navy/5 hover:text-navy lg:inline-flex"
                            aria-label={collapsed ? "Bentangkan sidebar" : "Ciutkan sidebar"}
                        >
                            {collapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
                        </button>
                        <div className="flex items-center gap-1.5 text-xs text-body-text">
                            <span>Admin</span>
                            <ChevronRight className="h-3 w-3 text-border-strong" />
                            <span className="font-semibold text-navy">{title || "Dashboard"}</span>
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

                        {/* Menu profil administrator */}
                        <div ref={profileRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setProfileOpen((v) => !v)}
                                aria-haspopup="menu"
                                aria-expanded={profileOpen}
                                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border-soft bg-white px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-navy/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tech-blue"
                            >
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">
                                    {(auth?.user?.name || "A").slice(0, 1).toUpperCase()}
                                </span>
                                <span className="hidden max-w-32 truncate sm:block">{auth?.user?.name || "Administrator"}</span>
                            </button>

                            {profileOpen && (
                                <div
                                    role="menu"
                                    className="absolute right-0 top-full z-40 mt-2 w-60 rounded-lg border border-border-soft bg-white p-2 shadow-lg"
                                >
                                    <div className="border-b border-border-soft px-2 pb-2">
                                        <p className="truncate text-xs font-semibold text-navy">{auth?.user?.name || "Administrator"}</p>
                                        <p className="truncate text-[11px] text-body-text">{auth?.user?.email || "-"}</p>
                                    </div>
                                    <Link
                                        href={route("admin.profile.edit")}
                                        onClick={() => setProfileOpen(false)}
                                        role="menuitem"
                                        className="mt-1 flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-navy transition-colors hover:bg-navy/5"
                                    >
                                        <User className="h-4 w-4 text-body-text" />
                                        <span>Profil Saya</span>
                                    </Link>
                                    <form onSubmit={logout}>
                                        <button
                                            type="submit"
                                            role="menuitem"
                                            className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm text-navy transition-colors hover:bg-navy/5"
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
                                aria-label="Tutup notifikasi"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {children}
                </main>
            </div>
        </div>
    );
}
