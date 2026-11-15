import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useForm, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";
import {
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    Clock,
    ExternalLink,
    Loader2,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Send,
    ShieldCheck,
} from "lucide-react";
import { Seo } from "@/Components/Seo";
import { Button } from "@/Components/ui/button";
import { useToast } from "@/Components/ui/toast";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import { Spotlight } from "@/Components/ui/Spotlight";
import { useGsapReveal, useHeroAnimation } from "@/hooks/useGsap";
import { withFrontendLayout } from "@/utils/layout";
import { waMeLink } from "@/utils/waLink";
import type { CompanySettings, ServiceItem, SharedPageProps } from "@/types";

interface ContactProps {
    settings?: CompanySettings;
    /** Nama layanan dari ?service=slug pada CTA detail layanan. */
    selectedService?: string | null;
}

const FIELD_CLASS = "rounded-md";

function ContactRow({
    icon: Icon,
    label,
    children,
}: {
    icon: typeof Mail;
    label: string;
    children: ReactNode;
}) {
    return (
        <li className="border-b border-border-strong/60 py-4">
            <p className="flex items-center gap-2 text-xs font-medium text-body-text">
                <Icon className="h-3.5 w-3.5 text-tech-blue" aria-hidden="true" />
                {label}
            </p>
            <div className="mt-1.5 text-sm font-semibold leading-relaxed text-navy">{children}</div>
        </li>
    );
}

function Contact({ settings, selectedService }: ContactProps) {
    useHeroAnimation();
    useGsapReveal();

    // Pilihan layanan mengikuti data Admin Panel (navServices), sama seperti navbar.
    const { navServices, flash } = usePage().props as {
        navServices?: ServiceItem[];
    } & SharedPageProps;
    const serviceOptions = navServices ?? [];
    const { show } = useToast();

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        service: selectedService ?? "",
        custom_service: "",
        message: "",
    });

    const isCustomService = data.service === "custom";

    // Konfirmasi sukses tampil sebagai panel di dalam formulir, bukan alert.
    const [sent, setSent] = useState(false);
    const successRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!selectedService) return;
        setData("service", selectedService);
    }, [selectedService]);

    useEffect(() => {
        if (!flash?.success) return;
        setSent(true);
        const timer = window.setTimeout(() => successRef.current?.focus(), 80);
        return () => window.clearTimeout(timer);
    }, [flash?.success]);

    // Kunci sinkron mencegah dua permintaan terkirim saat tombol ditekan
    // berulang sebelum state processing React sempat diperbarui.
    const submitting = useRef(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (processing || submitting.current) return;
        submitting.current = true;

        post(route("contact.store"), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (validationErrors) => {
                const [firstField, firstMessage] = Object.entries(validationErrors)[0] ?? [];

                if (firstField) {
                    document.getElementById(firstField)?.focus();
                }

                show({
                    variant: "error",
                    title: "Periksa kembali formulir",
                    description:
                        firstMessage ?? "Masih ada informasi yang wajib diisi.",
                });
            },
            onHttpException: () => {
                show({
                    variant: "error",
                    title: "Gagal mengirim",
                    description:
                        "Permintaan konsultasi belum berhasil dikirim. Silakan coba kembali.",
                });
                // Jangan tinggalkan halaman atau buka dialog error bawaan.
                return false;
            },
            onNetworkError: () => {
                show({
                    variant: "error",
                    title: "Koneksi terputus",
                    description:
                        "Tidak dapat terhubung ke server. Periksa koneksi Anda lalu kirim ulang.",
                });
                return false;
            },
            onFinish: () => {
                submitting.current = false;
            },
        });
    };

    const whatsappUrl = waMeLink(settings?.contact_whatsapp);

    return (
        <>
            <Seo
                title="Hubungi Kami"
                description="Hubungi tim konsultan Nusantara Digital Solution untuk konsultasi kebutuhan teknologi, jaringan, aplikasi, dan transformasi digital bisnis Anda."
            />

            {/* A. HERO — papan judul, bukan kumpulan tombol. */}
            <section className="relative overflow-hidden bg-navy pt-28 pb-14 sm:pt-32 lg:pt-36 lg:pb-20">
                {/* Garis blueprint samar: bahasa visual infrastruktur, bukan hiasan. */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
                        backgroundSize: "72px 72px",
                    }}
                />
                <Spotlight className="-top-24 left-1/3" fill="#4da6f8" />

                <div className="container-nds relative z-10">
                    <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
                        <div className="lg:col-span-8">
                            <p
                                data-hero="title"
                                className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-electric-light opacity-0"
                            >
                                CONTACT US
                            </p>
                            <h1
                                data-hero="title"
                                className="mt-5 text-[2.5rem] font-bold leading-[1.03] tracking-[-0.03em] text-white opacity-0 sm:text-[3.25rem] lg:text-[4rem]"
                            >
                                Let's Build Something Great Together.
                            </h1>
                        </div>

                        <div className="lg:col-span-4">
                            <p
                                data-hero="desc"
                                className="border-t border-white/15 pt-5 text-base leading-relaxed text-white/75 opacity-0"
                            >
                                Ceritakan kondisi infrastruktur atau target digitalisasi organisasi Anda.
                                Tim NDS meninjau setiap permintaan dan menyusun langkah yang paling masuk akal.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* B + C. KANAL KOMUNIKASI & FORMULIR KONSULTASI */}
            <section id="formulir" className="scroll-mt-24 bg-off-white py-16 lg:py-24">
                <div className="container-nds grid gap-12 lg:grid-cols-12 lg:gap-10">
                    <aside className="gsap-reveal lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
                        <h2 className="text-xl font-bold tracking-[-0.02em] text-navy sm:text-2xl">
                            Kanal komunikasi
                        </h2>
                        <p className="mt-2 max-w-xs text-sm leading-relaxed text-body-text">
                            Pilih kanal yang paling nyaman. Untuk kebutuhan yang lebih rinci,
                            gunakan formulir di samping.
                        </p>

                        <ul className="mt-8 border-t border-border-strong/60">
                            {settings?.contact_email && (
                                <ContactRow icon={Mail} label="Email">
                                    <a
                                        href={`mailto:${settings.contact_email}`}
                                        className="break-all underline decoration-tech-blue/30 underline-offset-4 transition-colors hover:text-tech-blue hover:decoration-tech-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:ring-offset-2"
                                    >
                                        {settings.contact_email}
                                    </a>
                                </ContactRow>
                            )}

                            {whatsappUrl && (
                                <ContactRow icon={MessageCircle} label="WhatsApp">
                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline decoration-tech-blue/30 underline-offset-4 transition-colors hover:text-tech-blue hover:decoration-tech-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:ring-offset-2"
                                    >
                                        {settings?.contact_whatsapp}
                                    </a>
                                </ContactRow>
                            )}

                            {settings?.contact_phone && (
                                <ContactRow icon={Phone} label="Telepon">
                                    <a
                                        href={`tel:${settings.contact_phone}`}
                                        className="transition-colors hover:text-tech-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:ring-offset-2"
                                    >
                                        {settings.contact_phone}
                                    </a>
                                </ContactRow>
                            )}

                            {settings?.contact_address && (
                                <ContactRow icon={MapPin} label="Alamat kantor">
                                    <span className="whitespace-pre-line font-medium text-body-dark">
                                        {settings.contact_address}
                                    </span>
                                    <a
                                        href={`https://www.google.com/maps?q=${encodeURIComponent(settings.contact_address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-tech-blue transition-colors hover:text-tech-blue-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:ring-offset-2"
                                    >
                                        <span>Buka di Google Maps</span>
                                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                    </a>
                                </ContactRow>
                            )}

                            <ContactRow icon={Clock} label="Jam operasional">
                                <span className="font-medium text-body-dark">
                                    Senin - Jumat, 08.00 - 17.00 WIB
                                </span>
                            </ContactRow>
                        </ul>

                        <Link
                            href={route("home")}
                            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-navy transition-colors hover:text-tech-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:ring-offset-2"
                        >
                            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                            Kembali ke beranda
                        </Link>
                    </aside>

                    <div className="min-w-0 lg:col-span-7 lg:col-start-6">
                        <div className="border border-border-soft bg-white">
                            <div className="border-b border-border-soft px-5 py-6 sm:px-8">
                                <h2 className="text-xl font-bold tracking-[-0.02em] text-navy sm:text-2xl">
                                    Formulir konsultasi
                                </h2>
                                <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-body-text">
                                    Isi rincian singkat kebutuhan Anda. Kolom bertanda{" "}
                                    <span className="font-semibold text-crimson">*</span> wajib dilengkapi.
                                </p>
                            </div>

                            {sent ? (
                                <div
                                    ref={successRef}
                                    tabIndex={-1}
                                    role="status"
                                    className="px-5 py-12 sm:px-8 focus-visible:outline-none"
                                >
                                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success/10">
                                        <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
                                    </span>
                                    <h3 className="mt-5 text-lg font-bold text-navy">
                                        Permintaan konsultasi terkirim
                                    </h3>
                                    <p className="mt-2 max-w-md text-sm leading-relaxed text-body-text">
                                        {flash?.success ??
                                            "Terima kasih. Tim NDS akan meninjau kebutuhan Anda dan menghubungi melalui email atau nomor yang Anda berikan."}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setSent(false)}
                                        className="mt-6 text-sm font-semibold text-tech-blue underline underline-offset-4 transition-colors hover:text-tech-blue-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:ring-offset-2"
                                    >
                                        Kirim permintaan lain
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={submit} noValidate aria-busy={processing}>
                                    <div className="grid gap-x-5 gap-y-5 px-5 py-6 sm:grid-cols-2 sm:px-8">
                                        <div>
                                            <Label htmlFor="name">
                                                Nama lengkap{" "}
                                                <span className="text-crimson" aria-hidden="true">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData("name", e.target.value)}
                                                placeholder="Nama lengkap Anda"
                                                autoComplete="name"
                                                required
                                                aria-invalid={!!errors.name}
                                                aria-describedby={errors.name ? "name-error" : undefined}
                                                className={FIELD_CLASS}
                                            />
                                            {errors.name && (
                                                <p id="name-error" className="form-error" role="alert">
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="company">Nama perusahaan</Label>
                                            <Input
                                                id="company"
                                                type="text"
                                                value={data.company}
                                                onChange={(e) => setData("company", e.target.value)}
                                                placeholder="Opsional"
                                                autoComplete="organization"
                                                className={FIELD_CLASS}
                                            />
                                            {errors.company && (
                                                <p id="company-error" className="form-error" role="alert">
                                                    {errors.company}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="email">
                                                Email{" "}
                                                <span className="text-crimson" aria-hidden="true">*</span>
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData("email", e.target.value)}
                                                placeholder="nama@perusahaan.co.id"
                                                autoComplete="email"
                                                inputMode="email"
                                                required
                                                aria-invalid={!!errors.email}
                                                aria-describedby={errors.email ? "email-error" : undefined}
                                                className={FIELD_CLASS}
                                            />
                                            {errors.email && (
                                                <p id="email-error" className="form-error" role="alert">
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="phone">
                                                Nomor WhatsApp atau telepon{" "}
                                                <span className="text-crimson" aria-hidden="true">*</span>
                                            </Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={data.phone}
                                                onChange={(e) => setData("phone", e.target.value)}
                                                placeholder="0812-XXXX-XXXX"
                                                autoComplete="tel"
                                                inputMode="tel"
                                                required
                                                aria-invalid={!!errors.phone}
                                                aria-describedby={errors.phone ? "phone-error" : undefined}
                                                className={FIELD_CLASS}
                                            />
                                            {errors.phone && (
                                                <p id="phone-error" className="form-error" role="alert">
                                                    {errors.phone}
                                                </p>
                                            )}
                                        </div>

                                        <div className="sm:col-span-2">
                                            <Label htmlFor="service">
                                                Bidang layanan{" "}
                                                <span className="text-crimson" aria-hidden="true">*</span>
                                            </Label>
                                            <div className="relative">
                                                <select
                                                    id="service"
                                                    required
                                                    value={data.service}
                                                    onChange={(e) => setData("service", e.target.value)}
                                                    aria-invalid={!!errors.service}
                                                    aria-describedby={errors.service ? "service-error" : undefined}
                                                    className="box-border h-12 min-h-12 w-full touch-target appearance-none rounded-md border border-border-soft bg-white px-4 py-3 pr-11 text-sm text-navy shadow-xs transition-colors placeholder:text-body-text/50 focus-visible:border-tech-blue focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="" disabled>
                                                        Pilih layanan kebutuhan Anda
                                                    </option>
                                                    {serviceOptions.map((service) => (
                                                        <option key={service.id} value={service.name}>
                                                            {service.name}
                                                        </option>
                                                    ))}
                                                    <option value="custom">Lainnya / Custom</option>
                                                </select>
                                                <ChevronDown
                                                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-body-text/60"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            {errors.service && (
                                                <p id="service-error" className="form-error" role="alert">
                                                    {errors.service}
                                                </p>
                                            )}
                                        </div>

                                        {/* Input ini hanya muncul bila pilihan layanan adalah "Lainnya". */}
                                        {isCustomService && (
                                            <div className="sm:col-span-2">
                                                <Label htmlFor="custom_service">
                                                    Layanan yang Anda butuhkan{" "}
                                                    <span className="text-crimson" aria-hidden="true">*</span>
                                                </Label>
                                                <Input
                                                    id="custom_service"
                                                    type="text"
                                                    value={data.custom_service}
                                                    onChange={(e) => setData("custom_service", e.target.value)}
                                                    placeholder="Tuliskan jenis layanan atau kebutuhan Anda"
                                                    required
                                                    aria-invalid={!!errors.custom_service}
                                                    aria-describedby={errors.custom_service ? "custom-service-error" : undefined}
                                                    className={FIELD_CLASS}
                                                />
                                                {errors.custom_service && (
                                                    <p id="custom-service-error" className="form-error" role="alert">
                                                        {errors.custom_service}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="sm:col-span-2">
                                            <Label htmlFor="message">
                                                Pesan{" "}
                                                <span className="text-crimson" aria-hidden="true">*</span>
                                            </Label>
                                            <Textarea
                                                id="message"
                                                rows={5}
                                                value={data.message}
                                                onChange={(e) => setData("message", e.target.value)}
                                                placeholder="Ceritakan sistem yang berjalan saat ini, kendala yang dihadapi, atau target yang ingin dicapai."
                                                required
                                                aria-invalid={!!errors.message}
                                                aria-describedby={errors.message ? "message-error" : undefined}
                                                className={FIELD_CLASS}
                                            />
                                            {errors.message && (
                                                <p id="message-error" className="form-error" role="alert">
                                                    {errors.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 border-t border-border-soft px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                                        <p className="flex max-w-[17rem] items-start gap-2 text-xs leading-relaxed text-body-text">
                                            <ShieldCheck className="h-4 w-4 shrink-0 text-tech-blue" aria-hidden="true" />
                                            <span>
                                                Data hanya dipakai untuk menindaklanjuti permintaan ini dan
                                                tidak dibagikan ke pihak lain.
                                            </span>
                                        </p>
                                        <Button
                                            type="submit"
                                            size="lg"
                                            disabled={processing}
                                            className="w-full font-bold sm:w-auto"
                                        >
                                            {processing ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                                    <span>Mengirim...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Kirim Permintaan</span>
                                                    <Send className="h-4 w-4" aria-hidden="true" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default withFrontendLayout(Contact);
