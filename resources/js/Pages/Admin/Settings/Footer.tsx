import { Head, usePage, useForm } from "@inertiajs/react";
import { route } from "ziggy-js";
import { ChevronDown, ChevronUp, Save } from "lucide-react";
import {
    SiFacebook,
    SiInstagram,
    SiWhatsapp,
    SiYoutube,
} from "@icons-pack/react-simple-icons";
import AdminLayout from "@/Layouts/AdminLayout";
import { logoUrl } from "@/utils/assets";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { waMeLink } from "@/utils/waLink";
import type { CompanySettings } from "@/types";

interface NavLinkRow {
    key: string;
    label: string;
    enabled: boolean;
}

interface FooterProps {
    nav: NavLinkRow[];
    serviceIds: number[];
    services: Array<{ id: number; name: string; slug: string }>;
}

interface FooterFormData {
    nav: NavLinkRow[];
    service_ids: number[];
}

// LinkedIn sudah dihapus dari Simple Icons (aset resmi mereka), sehingga
// glyph-nya ditulis manual dengan path resmi LinkedIn: kotak penuh dengan
// huruf "in" tembus putih.
const SiLinkedin = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    instagram: SiInstagram,
    facebook: SiFacebook,
    linkedin: SiLinkedin,
    youtube: SiYoutube,
    whatsapp: SiWhatsapp,
};

function navKeyHint(key: string): string {
    const hints: Record<string, string> = {
        home: "Halaman Beranda",
        about: "Halaman Tentang Kami",
        promo: "Halaman Promo",
        blog: "Halaman Blog",
        contact: "Halaman Hubungi Kami",
    };
    return hints[key] ?? key;
}

// Pindahkan satu elemen ke atas/bawah dalam urutan (untuk nav dan layanan).
function moveItem<T>(arr: T[], index: number, direction: -1 | 1): T[] {
    const target = index + direction;
    if (target < 0 || target >= arr.length) return arr;
    const next = [...arr];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
}

function Section({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-xl border border-border-soft bg-white p-5 sm:p-6">
            <h2 className="text-sm font-bold text-navy">{title}</h2>
            {description && <p className="mt-1 text-xs leading-relaxed text-body-text">{description}</p>}
            <div className="mt-4">{children}</div>
        </section>
    );
}

function OrderButtons({
    index,
    length,
    onMove,
}: {
    index: number;
    length: number;
    onMove: (direction: -1 | 1) => void;
}) {
    return (
        <span className="flex shrink-0 items-center gap-0.5">
            <button
                type="button"
                onClick={() => onMove(-1)}
                disabled={index === 0}
                aria-label="Naikkan urutan"
                className="cursor-pointer rounded-md border border-border-soft p-1.5 text-body-text transition-colors hover:bg-navy/5 hover:text-navy disabled:cursor-not-allowed disabled:opacity-40"
            >
                <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
                type="button"
                onClick={() => onMove(1)}
                disabled={index === length - 1}
                aria-label="Turunkan urutan"
                className="cursor-pointer rounded-md border border-border-soft p-1.5 text-body-text transition-colors hover:bg-navy/5 hover:text-navy disabled:cursor-not-allowed disabled:opacity-40"
            >
                <ChevronDown className="h-3.5 w-3.5" />
            </button>
        </span>
    );
}

function Toggle({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={onChange}
            className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                checked ? "bg-tech-blue" : "bg-gray-300"
            }`}
        >
            <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-all ${
                    checked ? "left-[22px]" : "left-0.5"
                }`}
            />
        </button>
    );
}

// Ikon kontak kecil untuk pratinjau, dibuat sebagai path manual agar pratinjau
// tidak menarik pustaka ikon tambahan.
const MapPinIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1116 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
);
const MailIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);
const PhoneIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

// Pratinjau live: meniru komposisi footer publik. Data logo, kontak, dan
// media sosial diambil dari Pengaturan Situs (props `settings` bersama
// Inertia) sehingga pratinjau selalu mencerminkan satu sumber data.
function FooterPreview({
    nav,
    selectedServices,
    settings,
}: {
    nav: NavLinkRow[];
    selectedServices: Array<{ id: number; name: string; slug: string }>;
    settings: CompanySettings | undefined;
}) {
    const enabledNav = nav.filter((link) => link.enabled);

    const socialEntries = [
        { platform: "instagram", url: settings?.instagram ?? "" },
        { platform: "facebook", url: settings?.facebook ?? "" },
        { platform: "linkedin", url: settings?.linkedin ?? "" },
        { platform: "youtube", url: settings?.youtube ?? "" },
        { platform: "whatsapp", url: waMeLink(settings?.contact_whatsapp) },
    ].filter((entry) => entry.url !== "");

    const contactLines: Array<{ icon: React.ComponentType<{ className?: string }>; text: string }> = [];
    if (settings?.contact_address) contactLines.push({ icon: MapPinIcon, text: settings.contact_address });
    if (settings?.contact_email) contactLines.push({ icon: MailIcon, text: settings.contact_email });
    if (settings?.contact_phone) contactLines.push({ icon: PhoneIcon, text: settings.contact_phone });

    return (
        <div className="overflow-hidden rounded-xl bg-deep-navy text-white">
            <div className="grid gap-6 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="min-w-0">
                    <img
                        src={logoUrl(settings?.logo_path)}
                        alt="Pratinjau logo"
                        className="h-9 w-auto brightness-0 invert"
                    />
                    {socialEntries.length > 0 && (
                        <div className="mt-4 flex items-center gap-2">
                            {socialEntries.map((entry) => {
                                const Icon = socialIcons[entry.platform];
                                return (
                                    <span key={entry.platform} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                                        {Icon && <Icon className="h-3.5 w-3.5 text-white" />}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-semibold">Navigasi</p>
                    <ul className="mt-2 space-y-1">
                        {enabledNav.map((link) => (
                            <li key={link.key} className="text-[11px] leading-5 text-white/70">
                                {link.label}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-semibold">Layanan</p>
                    <ul className="mt-2 space-y-1">
                        {selectedServices.slice(0, 6).map((service) => (
                            <li key={service.id} className="truncate text-[11px] leading-5 text-white/70">
                                {service.name}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-semibold">Hubungi Kami</p>
                    <ul className="mt-2 space-y-1">
                        {contactLines.map((line) => (
                            <li key={line.text} className="flex items-start gap-1.5 text-[11px] leading-5 text-white/70">
                                <line.icon className="mt-0.5 h-3 w-3 shrink-0 text-white/50" />
                                <span className="break-words">{line.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <p className="border-t border-white/10 px-5 py-2.5 text-[10px] text-white/55">
                &copy; {new Date().getFullYear()} Nusantara Digital Solution. Hak Cipta Dilindungi.
            </p>
        </div>
    );
}

export default function FooterSettings({ nav, serviceIds, services }: FooterProps) {
    const { settings } = usePage().props as { settings?: CompanySettings };

    const { data, setData, put, processing, errors } = useForm<FooterFormData>({
        nav,
        service_ids: serviceIds,
    });

    const selectedServices = data.service_ids
        .map((id) => services.find((service) => service.id === id))
        .filter((service): service is { id: number; name: string; slug: string } => Boolean(service));

    const toggleService = (id: number) => {
        setData("service_ids", data.service_ids.includes(id)
            ? data.service_ids.filter((selected) => selected !== id)
            : [...data.service_ids, id]);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route("admin.footer-settings.update"), {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout title="Pengaturan Footer">
            <Head title="Pengaturan Footer | NDS Admin" />
            <form onSubmit={submit} className="max-w-4xl">
                <p className="mb-6 max-w-2xl text-sm leading-relaxed text-body-text">
                    Halaman ini hanya mengelola dua hal khusus footer: tautan navigasi dan urutan
                    layanan. Logo, kontak, dan media sosial dikelola di Pengaturan Situs; nama
                    layanan dikelola di menu Layanan.
                </p>

                <div className="grid gap-5">
                    {/* Pratinjau live di paling atas agar tidak perlu menggulir untuk memeriksa */}
                    <Section
                        title="Pratinjau Footer"
                        description="Tampilan menurut isi form ini ditambah data terkini dari Pengaturan Situs. Simpan perubahan agar ikut tayang di website publik."
                    >
                        <FooterPreview
                            nav={data.nav}
                            selectedServices={selectedServices}
                            settings={settings}
                        />
                        {errors.nav && <p className="form-error mt-3">{errors.nav}</p>}
                        {errors.service_ids && <p className="form-error mt-3">{errors.service_ids}</p>}
                    </Section>

                    {/* Navigasi */}
                    <Section
                        title="Navigasi"
                        description="Aktifkan tautan yang tampil di footer dan ubah urutannya. Tujuan halaman mengikuti halaman bawaan website."
                    >
                        <ul className="divide-y divide-border-soft">
                            {data.nav.map((link, index) => (
                                <li key={link.key} className="flex items-center gap-3 py-3">
                                    <span className="w-40 shrink-0 text-xs font-semibold text-body-text sm:w-48">
                                        {navKeyHint(link.key)}
                                    </span>
                                    <Input
                                        type="text"
                                        value={link.label}
                                        onChange={(e) =>
                                            setData("nav", data.nav.map((row, i) =>
                                                i === index ? { ...row, label: e.target.value } : row,
                                            ))
                                        }
                                        disabled={!link.enabled}
                                        aria-label={`Label tautan ${link.key}`}
                                        className="h-10 min-h-10 py-2 text-xs"
                                    />
                                    <Toggle
                                        checked={link.enabled}
                                        onChange={() =>
                                            setData("nav", data.nav.map((row, i) =>
                                                i === index ? { ...row, enabled: !row.enabled } : row,
                                            ))
                                        }
                                        label={`Aktifkan tautan ${link.key}`}
                                    />
                                    <OrderButtons
                                        index={index}
                                        length={data.nav.length}
                                        onMove={(direction) => setData("nav", moveItem(data.nav, index, direction))}
                                    />
                                </li>
                            ))}
                        </ul>
                        {errors["nav.0.label"] && <p className="form-error mt-2">{errors["nav.0.label"]}</p>}
                    </Section>

                    {/* Layanan */}
                    <Section
                        title="Layanan"
                        description="Pilih layanan yang tampil di footer dan atur urutannya. Daftar diambil dari menu Layanan; mengubah nama layanan dilakukan di sana."
                    >
                        {selectedServices.length > 0 ? (
                            <div>
                                <p className="mb-2 text-xs font-semibold text-navy">Urutan tampil di footer</p>
                                <ul className="divide-y divide-border-soft">
                                    {selectedServices.map((service, index) => (
                                        <li key={service.id} className="flex items-center gap-3 py-2.5">
                                            <span className="min-w-0 flex-1 truncate text-xs font-bold text-navy">
                                                {service.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => toggleService(service.id)}
                                                className="shrink-0 cursor-pointer text-[11px] font-semibold text-crimson transition-colors hover:text-red-900"
                                                aria-label={`Hapus ${service.name} dari footer`}
                                            >
                                                Hapus
                                            </button>
                                            <OrderButtons
                                                index={index}
                                                length={selectedServices.length}
                                                onMove={(direction) =>
                                                    setData("service_ids", moveItem(data.service_ids, index, direction))
                                                }
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="rounded-lg bg-light-gray px-4 py-3 text-xs text-body-text">
                                Belum ada layanan dipilih. Centang layanan di daftar bawah untuk menampilkannya.
                            </p>
                        )}
                        <div className="mt-4">
                            <p className="mb-2 text-xs font-semibold text-navy">Tambah layanan</p>
                            <ul className="grid gap-2 sm:grid-cols-2">
                                {services.map((service) => {
                                    const checked = data.service_ids.includes(service.id);
                                    return (
                                        <li key={service.id}>
                                            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-border-soft px-3 text-xs transition-colors hover:bg-navy/5">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleService(service.id)}
                                                    className="h-4 w-4 accent-[#2563eb]"
                                                />
                                                <span className="truncate font-semibold text-navy">{service.name}</span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                            {errors["service_ids.0"] && <p className="form-error mt-2">{errors["service_ids.0"]}</p>}
                        </div>
                    </Section>

                    {/* Simpan */}
                    <div className="flex items-center justify-end gap-3 border-t border-border-soft pt-5">
                        <Button type="submit" size="lg" disabled={processing} className="font-bold">
                            {processing ? (
                                "Menyimpan..."
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    <span>Simpan Pengaturan Footer</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
