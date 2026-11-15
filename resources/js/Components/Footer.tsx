import { Link, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";
import { ChevronDown, Mail, MapPin, Phone } from "lucide-react";
import {
    SiFacebook,
    SiInstagram,
    SiWhatsapp,
    SiYoutube,
} from "@icons-pack/react-simple-icons";
import { useState } from "react";
import { logoUrl } from "@/utils/assets";
import { waMeLink } from "@/utils/waLink";
import { normalizeSocialUrl } from "@/utils/socialUrl";
import type { CompanySettings, ServiceItem } from "@/types";

// LinkedIn sudah dihapus dari Simple Icons (aset resmi mereka), sehingga
// glyph-nya ditulis manual dengan path resmi LinkedIn: kotak penuh dengan
// huruf "in" tembus putih.
const SiLinkedin = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

interface FooterNavLink {
    key: string;
    label: string;
    enabled: boolean;
}

// JSON pengaturan tersimpan sebagai string; parsing dilindungi supaya footer
// tetap tampil dengan data bawaan bila isinya rusak.
function parseJsonArray(raw: string | null | undefined): unknown[] | null {
    if (!raw) return null;
    try {
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

// Kunci navigasi ditutup: setiap kunci dipetakan ke satu halaman bawaan,
// jadi tautan footer tidak pernah menunjuk halaman yang tidak ada.
function resolveNavRoutes(): Record<string, string> {
    return {
        home: route("home"),
        about: route("about"),
        promo: route("promo"),
        blog: route("blog"),
        contact: route("contact"),
    };
}

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    instagram: SiInstagram,
    facebook: SiFacebook,
    linkedin: SiLinkedin,
    youtube: SiYoutube,
    whatsapp: SiWhatsapp,
};

export function Footer() {
    const { settings, navServices } = usePage().props as {
        settings?: CompanySettings;
        navServices?: ServiceItem[];
    };
    const year = new Date().getFullYear();

    // Pengaturan navigasi footer (Pengaturan Footer di Admin Panel); bila belum
    // pernah disimpan, pakai susunan bawaan halaman publik yang sudah ada.
    const navRoutes = resolveNavRoutes();
    const rawNav = parseJsonArray(settings?.footer_nav_links) as FooterNavLink[] | null;
    const navLinks = rawNav
        ? rawNav
            .filter((link) => link.enabled && navRoutes[link.key])
            .map((link) => ({ label: link.label, href: navRoutes[link.key], key: link.key }))
        : ([
            { key: "home", label: "Beranda", href: navRoutes.home },
            { key: "about", label: "Tentang Kami", href: navRoutes.about },
            { key: "promo", label: "Promo", href: navRoutes.promo },
            { key: "blog", label: "Blog", href: navRoutes.blog },
            { key: "contact", label: "Hubungi Kami", href: navRoutes.contact },
        ]);

    // Urutan layanan footer mengikuti Admin Panel footer_service_ids; id yang
    // tidak lagi tayang dilewati otomatis. Bila belum diatur, tampilkan semua.
    const rawIds = parseJsonArray(settings?.footer_service_ids) as number[] | null;
    const allServices = navServices ?? [];
    const services =
        rawIds === null
            ? allServices
            : rawIds
                .map((id) => allServices.find((service) => service.id === id))
                .filter((service): service is ServiceItem => Boolean(service));
    const hasServices = services.length > 0;

    // Ikon media sosial langsung dari Pengaturan Situs (satu sumber data):
    // Instagram, Facebook, LinkedIn, YouTube, lalu WhatsApp yang dibangun
    // otomatis dari nomor WhatsApp resmi. URL kosong berarti ikon tidak tampil.
    const socialEntries: Array<{ name: string; url: string; platform: string }> = [
        { platform: "instagram", name: "Instagram", url: settings?.instagram ?? "" },
        { platform: "facebook", name: "Facebook", url: settings?.facebook ?? "" },
        { platform: "linkedin", name: "LinkedIn", url: settings?.linkedin ?? "" },
        { platform: "youtube", name: "YouTube", url: settings?.youtube ?? "" },
        { platform: "whatsapp", name: "WhatsApp", url: waMeLink(settings?.contact_whatsapp) },
    ].flatMap((entry) => {
        const url = normalizeSocialUrl(entry.url);
        return url ? [{ ...entry, url }] : [];
    });

    const socialLinks = socialEntries.map((entry) => ({
        ...entry,
        icon: socialIcons[entry.platform],
    }));

    const hasContact =
        settings?.contact_email || settings?.contact_phone || settings?.contact_address;

    // Accordion mobile: seluruh bagian tertutup saat halaman pertama dibuka.
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
    const toggleSection = (key: string) =>
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

    // Lingkaran 44px transparan, satu baris rata tengah di bawah logo; hover
    // memberi latar Electric Blue, ikon tetap putih sesuai spesifikasi.
    const socialRow = socialLinks.length > 0 && (
        <div className="flex items-center justify-center gap-1.5">
            {socialLinks.map((social) => (
                <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-tech-blue hover:text-white"
                >
                    <social.icon className="h-5 w-5" aria-hidden="true" />
                </a>
            ))}
        </div>
    );

    return (
        <footer className="bg-deep-navy text-white">
            {/* ============ DESKTOP (>= lg): empat kolom ============ */}
            <div className="hidden lg:block">
                <div className="container-nds grid grid-cols-12 gap-x-10 gap-y-10 py-14">
                    {/* Identitas: logo tengah di atas ikon media sosial, tanpa deskripsi tambahan */}
                    <div className={`min-w-0 ${hasServices ? "lg:col-span-3" : "lg:col-span-4"}`}>
                        <Link
                            href={route("home")}
                            className="mx-auto block w-fit"
                            aria-label="Ke beranda"
                        >
                            <img
                                src={logoUrl(settings?.logo_path)}
                                alt="NDS - Nusantara Digital Solution"
                                className="h-10 w-auto brightness-0 invert"
                            />
                        </Link>

                        {socialRow && <div className="mt-5">{socialRow}</div>}
                    </div>

                    {/* Navigasi, urutan dan label dari Pengaturan Footer */}
                    <nav aria-label="Navigasi footer" className={`min-w-0 ${hasServices ? "lg:col-span-2" : "lg:col-span-4"}`}>
                        <h3 className="mb-5 text-sm font-semibold text-white">Navigasi</h3>
                        <ul className="space-y-0.5">
                            {navLinks.map((item) => (
                                <li key={item.key}>
                                    <Link
                                        href={item.href}
                                        className="block py-2.5 text-sm leading-6 text-white/70 transition-colors hover:text-electric-light"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Layanan, hanya tampil bila Admin punya layanan tayang */}
                    {hasServices && (
                        <nav aria-label="Layanan" className="min-w-0 lg:col-span-4">
                            <h3 className="mb-5 text-sm font-semibold text-white">Layanan Kami</h3>
                            <ul className="space-y-0.5">
                                {services.map((service) => (
                                    <li key={service.id}>
                                        <Link
                                            href={route("services.show", service.slug)}
                                            className="block truncate py-2.5 text-sm leading-6 text-white/70 transition-colors hover:text-electric-light"
                                        >
                                            {service.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}

                    {/* Kontak: data persis dari Pengaturan Situs, tanpa informasi tambahan */}
                    {hasContact && (
                        <div className={`min-w-0 ${hasServices ? "lg:col-span-3" : "lg:col-span-4"}`}>
                            <h3 className="mb-5 text-sm font-semibold text-white">Hubungi Kami</h3>
                            <ul className="space-y-0.5 text-sm leading-6">
                                {settings?.contact_email && (
                                    <li>
                                        <a
                                            href={`mailto:${settings.contact_email}`}
                                            className="group flex min-h-[44px] items-center gap-3 text-white/70 transition-colors hover:text-electric-light"
                                        >
                                            <Mail className="h-4 w-4 shrink-0 text-white/50 transition-colors group-hover:text-electric-light" aria-hidden="true" />
                                            <span className="break-all">{settings.contact_email}</span>
                                        </a>
                                    </li>
                                )}
                                {settings?.contact_phone && (
                                    <li>
                                        <a
                                            href={`tel:${settings.contact_phone}`}
                                            className="group flex min-h-[44px] items-center gap-3 text-white/70 transition-colors hover:text-electric-light"
                                        >
                                            <Phone className="h-4 w-4 shrink-0 text-white/50 transition-colors group-hover:text-electric-light" aria-hidden="true" />
                                            <span>{settings.contact_phone}</span>
                                        </a>
                                    </li>
                                )}
                                {settings?.contact_address && (
                                    <li>
                                        <span className="flex items-start gap-3 py-2.5 text-white/70">
                                            <MapPin className="mt-1 h-4 w-4 shrink-0 text-white/50" aria-hidden="true" />
                                            <span className="break-words">{settings.contact_address}</span>
                                        </span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* ============ TABLET & MOBILE (< lg): ringkas + accordion ============ */}
            <div className="lg:hidden">
                <div className="container-nds py-8">
                    {/* Identitas: logo proporsional dan media sosial satu baris
                        rata tengah, selalu terlihat */}
                    <Link
                        href={route("home")}
                        className="mx-auto block w-fit"
                        aria-label="Ke beranda"
                    >
                        <img
                            src={logoUrl(settings?.logo_path)}
                            alt="NDS - Nusantara Digital Solution"
                            className="h-8 w-auto brightness-0 invert"
                        />
                    </Link>

                    {socialRow && <div className="mt-4 flex items-center justify-center gap-1.5 border-b border-white/10 pb-3">{socialRow}</div>}

                    {/* Accordion: Navigasi / Layanan Kami / Hubungi Kami.
                        Animasi grid-rows membuat buka-tutup tetap mulus
                        berapapun tinggi isinya. */}
                    <nav aria-label="Accordion footer mobile">
                        {/* Navigasi */}
                        <section className="border-b border-white/10">
                            <h3>
                                <button
                                    type="button"
                                    id="footer-acc-nav"
                                    onClick={() => toggleSection("nav")}
                                    aria-expanded={!!openSections.nav}
                                    aria-controls="footer-acc-nav-panel"
                                    className={`flex w-full items-center justify-between gap-3 py-3.5 text-left text-sm font-semibold transition-colors hover:text-white ${openSections.nav ? "text-white" : "text-white/85"}`}
                                >
                                    Navigasi
                                    <ChevronDown
                                        className={`h-4 w-4 shrink-0 text-white/50 transition-transform duration-200 ${openSections.nav ? "rotate-180" : ""}`}
                                        aria-hidden="true"
                                    />
                                </button>
                            </h3>
                            <div
                                id="footer-acc-nav-panel"
                                className={`grid transition-[grid-template-rows] duration-200 ${openSections.nav ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                            >
                                <div className="min-h-0 overflow-hidden">
                                    <ul className="pb-2">
                                        {navLinks.map((item) => (
                                            <li key={item.key}>
                                                <Link
                                                    href={item.href}
                                                    className="flex min-h-[44px] items-center text-sm leading-5 text-white/70 transition-colors hover:text-electric-light"
                                                >
                                                    {item.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Layanan, hanya bila Admin punya layanan tayang */}
                        {hasServices && (
                            <section className="border-b border-white/10">
                                <h3>
                                    <button
                                        type="button"
                                        id="footer-acc-services"
                                        onClick={() => toggleSection("services")}
                                        aria-expanded={!!openSections.services}
                                        aria-controls="footer-acc-services-panel"
                                        className={`flex w-full items-center justify-between gap-3 py-3.5 text-left text-sm font-semibold transition-colors hover:text-white ${openSections.services ? "text-white" : "text-white/85"}`}
                                    >
                                        Layanan Kami
                                        <ChevronDown
                                            className={`h-4 w-4 shrink-0 text-white/50 transition-transform duration-200 ${openSections.services ? "rotate-180" : ""}`}
                                            aria-hidden="true"
                                        />
                                    </button>
                                </h3>
                                <div
                                    id="footer-acc-services-panel"
                                    className={`grid transition-[grid-template-rows] duration-200 ${openSections.services ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                                >
                                    <div className="min-h-0 overflow-hidden">
                                        <ul className="pb-2">
                                            {services.map((service) => (
                                                <li key={service.id}>
                                                    <Link
                                                        href={route("services.show", service.slug)}
                                                        className="block truncate py-2.5 text-sm leading-5 text-white/70 transition-colors hover:text-electric-light"
                                                    >
                                                        {service.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Kontak: data persis dari Pengaturan Situs */}
                        {hasContact && (
                            <section className="border-b border-white/10">
                                <h3>
                                    <button
                                        type="button"
                                        id="footer-acc-contact"
                                        onClick={() => toggleSection("contact")}
                                        aria-expanded={!!openSections.contact}
                                        aria-controls="footer-acc-contact-panel"
                                        className={`flex w-full items-center justify-between gap-3 py-3.5 text-left text-sm font-semibold transition-colors hover:text-white ${openSections.contact ? "text-white" : "text-white/85"}`}
                                    >
                                        Hubungi Kami
                                        <ChevronDown
                                            className={`h-4 w-4 shrink-0 text-white/50 transition-transform duration-200 ${openSections.contact ? "rotate-180" : ""}`}
                                            aria-hidden="true"
                                        />
                                    </button>
                                </h3>
                                <div
                                    id="footer-acc-contact-panel"
                                    className={`grid transition-[grid-template-rows] duration-200 ${openSections.contact ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                                >
                                    <div className="min-h-0 overflow-hidden">
                                        <ul className="pb-2 text-sm leading-5">
                                            {settings?.contact_email && (
                                                <li>
                                                    <a
                                                        href={`mailto:${settings.contact_email}`}
                                                        className="group flex min-h-[44px] items-center gap-3 text-white/70 transition-colors hover:text-electric-light"
                                                    >
                                                        <Mail className="h-4 w-4 shrink-0 text-white/50 transition-colors group-hover:text-electric-light" aria-hidden="true" />
                                                        <span className="break-all">{settings.contact_email}</span>
                                                    </a>
                                                </li>
                                            )}
                                            {settings?.contact_phone && (
                                                <li>
                                                    <a
                                                        href={`tel:${settings.contact_phone}`}
                                                        className="group flex min-h-[44px] items-center gap-3 text-white/70 transition-colors hover:text-electric-light"
                                                    >
                                                        <Phone className="h-4 w-4 shrink-0 text-white/50 transition-colors group-hover:text-electric-light" aria-hidden="true" />
                                                        <span>{settings.contact_phone}</span>
                                                    </a>
                                                </li>
                                            )}
                                            {settings?.contact_address && (
                                                <li>
                                                    <span className="flex items-start gap-3 py-2.5 text-white/70">
                                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/50" aria-hidden="true" />
                                                        <span className="break-words">{settings.contact_address}</span>
                                                    </span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </section>
                        )}
                    </nav>
                </div>
            </div>

            {/* Copyright dengan garis pemisah tipis, tampil di semua ukuran layar.
                Padding mobile lebih rapat; sm ke atas tidak berubah. */}
            <div className="border-t border-white/10">
                <div className="container-nds flex flex-col items-start gap-1 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-5">
                    <p className="leading-relaxed text-white/55">
                        &copy; {year}{" "}
                        <span className="font-medium text-white/80">
                            {settings?.company_name || "Nusantara Digital Solution"}.
                        </span>{" "}
                        Hak Cipta Dilindungi.
                    </p>
                    <Link
                        href={route("privacy")}
                        className="text-white/55 transition-colors hover:text-electric-light"
                    >
                        Kebijakan Privasi
                    </Link>
                </div>
            </div>
        </footer>
    );
}
