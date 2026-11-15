import { Head, useForm } from "@inertiajs/react";
import { route } from "ziggy-js";
import { logoUrl, assetUrl } from "@/utils/assets";
import { useState } from "react";
import {
    Settings,
    Image as ImageIcon,
    Save,
    Building,
    Upload,
    Home,
    Phone,
    Share2,
    Search,
    Eye,
    MessageSquare,
    CheckCircle2,
} from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";

interface Props {
    fields: Record<string, { label: string; type: string; group?: string }>;
    values: Record<string, string>;
    activeTab?: string;
}

// Konfigurasi background halaman detail layanan per kategori
const serviceBgFields = [
    {
        fileKey: "application_bg_image",
        settingKey: "service_bg_application",
        title: "Layanan Aplikasi Bisnis",
        hint: "Web Development, Software Application, Management Network.",
    },
    {
        fileKey: "solution_bg_image",
        settingKey: "service_bg_solution",
        title: "Layanan Infrastruktur & Solusi",
        hint: "IT Consultant, Server Management, CCTV.",
    },
] as const;

type ServiceBgFileKey = (typeof serviceBgFields)[number]["fileKey"];

export default function SettingsEdit({ fields, values, activeTab = "company" }: Props) {
    const [currentTab, setCurrentTab] = useState<string>(activeTab);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [heroPreview, setHeroPreview] = useState<string | null>(null);
    const [serviceBgPreviews, setServiceBgPreviews] = useState<Partial<Record<ServiceBgFileKey, string>>>({});

    const { data, setData, post, processing, errors } = useForm<Record<string, string | File | null>>({
        ...values,
        logo: null,
        hero_image: null,
        application_bg_image: null,
        solution_bg_image: null,
        _method: "put",
        _tab: currentTab,
    });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData("logo", file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData("hero_image", file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setHeroPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleServiceBgChange = (fileKey: ServiceBgFileKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData(fileKey, file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setServiceBgPreviews((prev) => ({ ...prev, [fileKey]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTabChange = (tabId: string) => {
        setCurrentTab(tabId);
        setData("_tab", tabId);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("admin.settings.update"), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setLogoPreview(null);
                setHeroPreview(null);
                setServiceBgPreviews({});
            },
        });
    };

    const tabs = [
        { id: "company", label: "Profil Perusahaan", icon: Building },
        { id: "homepage", label: "Konten Beranda", icon: Home },
        { id: "media", label: "Background Layanan", icon: ImageIcon },
        { id: "contact", label: "Kontak & Alamat", icon: Phone },
        { id: "social", label: "Media Sosial", icon: Share2 },
        { id: "seo", label: "SEO Default", icon: Search },
        { id: "integration", label: "Integrasi", icon: MessageSquare },
    ];

    const companyFields = Object.entries(fields).filter(([_, m]) => m.group === "company");
    const homepageFields = Object.entries(fields).filter(([_, m]) => m.group === "homepage" && m.type !== "checkbox");
    const homepageCheckboxes = Object.entries(fields).filter(([_, m]) => m.group === "homepage" && m.type === "checkbox");
    const contactFields = Object.entries(fields).filter(([_, m]) => m.group === "contact");
    const socialFields = Object.entries(fields).filter(([_, m]) => m.group === "social");
    const seoFields = Object.entries(fields).filter(([_, m]) => m.group === "seo");
    const integrationFields = Object.entries(fields).filter(([_, m]) => m.group === "integration");

    // Pratinjau URL embed Tawk.to dari ID yang diisi admin.
    const tawkPropertyId = ((data.tawk_property_id as string) || "").trim();
    const tawkWidgetId = ((data.tawk_widget_id as string) || "").trim();
    const tawkPreviewUrl =
        tawkPropertyId && tawkWidgetId
            ? `https://embed.tawk.to/${tawkPropertyId}/${tawkWidgetId}`
            : "";

    return (
        <AdminLayout title="Pengaturan Situs">
            <Head title="Pengaturan Situs | NDS Admin" />

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-bold text-navy sm:text-2xl">Pengaturan Website & Integrasi Konten</h1>
                <p className="mt-1 text-xs text-body-text">
                    Kelola profil korporat, konten beranda dinamis, visibilitas section, kontak resmi, dan metadata SEO.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-6 flex flex-wrap gap-2 border-b border-border-soft pb-3">
                {tabs.map((tab) => {
                    const active = currentTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
                                active
                                    ? "bg-navy text-white shadow-xs"
                                    : "bg-white text-body-text border border-border-soft hover:bg-navy/5 hover:text-navy"
                            }`}
                        >
                            <Icon className={`h-4 w-4 ${active ? "text-electric-light" : "text-body-text/70"}`} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            <form onSubmit={submit} className="max-w-4xl space-y-6">
                {/* 1. TAB: PROFIL PERUSAHAAN */}
                {currentTab === "company" && (
                    <div className="space-y-6">
                        {/* Logo Upload Card */}
                        <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                            <div className="flex items-center gap-2 border-b border-border-soft pb-4 mb-5">
                                <ImageIcon className="h-4 w-4 text-tech-blue" />
                                <h2 className="text-sm font-bold text-navy">Logo Resmi Website</h2>
                            </div>

                            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                                <div className="flex h-24 w-40 items-center justify-center rounded-xl border border-dashed border-border-strong bg-light-gray p-3">
                                    <img
                                        src={logoPreview || logoUrl(values.logo_path)}
                                        alt="Logo Preview"
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>

                                <div className="flex-1 space-y-2">
                                    <p className="text-xs text-body-text">
                                        Format file yang diterima: <span className="font-semibold text-navy">PNG, JPG, JPEG, WEBP</span> (maks. 2MB). Disarankan menggunakan file berlatar transparan.
                                    </p>
                                    <div>
                                        <input
                                            type="file"
                                            id="logo"
                                            accept="image/png,image/jpeg,image/jpg,image/webp"
                                            onChange={handleLogoChange}
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="logo"
                                            className="btn-secondary inline-flex items-center gap-1.5 cursor-pointer py-2 text-xs"
                                        >
                                            <Upload className="h-3.5 w-3.5" />
                                            <span>Unggah Logo Baru</span>
                                        </label>
                                        {errors.logo && <p className="form-error mt-2">{errors.logo}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profil Fields */}
                        <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                            <div className="flex items-center gap-2 border-b border-border-soft pb-4 mb-5">
                                <Building className="h-4 w-4 text-tech-blue" />
                                <h2 className="text-sm font-bold text-navy">Informasi Korporat</h2>
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                {companyFields.map(([key, meta]) => (
                                    <div key={key} className={meta.type === "textarea" ? "sm:col-span-2" : ""}>
                                        <label className="label">{meta.label}</label>
                                        {meta.type === "textarea" ? (
                                            <textarea
                                                value={(data[key] as string) || ""}
                                                onChange={(e) => setData(key, e.target.value)}
                                                className="input"
                                                rows={3}
                                            />
                                        ) : (
                                            <input
                                                value={(data[key] as string) || ""}
                                                onChange={(e) => setData(key, e.target.value)}
                                                className="input"
                                            />
                                        )}
                                        {errors[key] && <p className="form-error">{errors[key]}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. TAB: KONTEN BERANDA (HOMEPAGE) */}
                {currentTab === "homepage" && (
                    <div className="space-y-6">
                        {/* Hero Background Image */}
                        <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                            <div className="flex items-center gap-2 border-b border-border-soft pb-4 mb-5">
                                <ImageIcon className="h-4 w-4 text-tech-blue" />
                                <h2 className="text-sm font-bold text-navy">Gambar Latar Hero (Hero Background)</h2>
                            </div>

                            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                                <div className="relative h-28 w-48 overflow-hidden rounded-xl border border-border-soft bg-navy">
                                    <img
                                        src={heroPreview || assetUrl(values.hero_bg_image || "images/hero-bg.jpg")}
                                        alt="Hero Background Preview"
                                        className="h-full w-full object-cover opacity-60"
                                    />
                                    <span className="absolute bottom-1 right-2 text-[10px] font-bold text-white/80 bg-black/50 px-1.5 py-0.5 rounded">
                                        Preview
                                    </span>
                                </div>

                                <div className="flex-1 space-y-2">
                                    <p className="text-xs text-body-text">
                                        Gambar latar hero website. Format: <span className="font-semibold text-navy">PNG, JPG, WEBP</span> (maks. 4MB, rekomendasi resolusi minimal 1920x1080px).
                                    </p>
                                    <div>
                                        <input
                                            type="file"
                                            id="hero_image"
                                            accept="image/png,image/jpeg,image/jpg,image/webp"
                                            onChange={handleHeroImageChange}
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="hero_image"
                                            className="btn-secondary inline-flex items-center gap-1.5 cursor-pointer py-2 text-xs"
                                        >
                                            <Upload className="h-3.5 w-3.5" />
                                            <span>Unggah Gambar Latar Hero</span>
                                        </label>
                                        {errors.hero_image && <p className="form-error mt-2">{errors.hero_image}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Hero Text Fields */}
                        <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                            <div className="flex items-center gap-2 border-b border-border-soft pb-4 mb-5">
                                <Home className="h-4 w-4 text-tech-blue" />
                                <h2 className="text-sm font-bold text-navy">Teks & Panggilan Aksi (Hero Section)</h2>
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                {homepageFields.map(([key, meta]) => (
                                    <div key={key} className={meta.type === "textarea" ? "sm:col-span-2" : ""}>
                                        <label className="label">{meta.label}</label>
                                        {meta.type === "textarea" ? (
                                            <textarea
                                                value={(data[key] as string) || ""}
                                                onChange={(e) => setData(key, e.target.value)}
                                                className="input"
                                                rows={3}
                                            />
                                        ) : (
                                            <input
                                                value={(data[key] as string) || ""}
                                                onChange={(e) => setData(key, e.target.value)}
                                                className="input"
                                            />
                                        )}
                                        {errors[key] && <p className="form-error">{errors[key]}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section Visibility Switches */}
                        <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                            <div className="flex items-center gap-2 border-b border-border-soft pb-4 mb-5">
                                <Eye className="h-4 w-4 text-tech-blue" />
                                <h2 className="text-sm font-bold text-navy">Pengaturan Tampilan Section Beranda</h2>
                            </div>
                            <p className="text-xs text-body-text mb-4">
                                Hanya section yang diaktifkan yang tampil di halaman beranda publik.
                            </p>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {homepageCheckboxes.map(([key, meta]) => {
                                    const isChecked = data[key] === "1";
                                    return (
                                        <label
                                            key={key}
                                            className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${
                                                isChecked
                                                    ? "border-tech-blue/30 bg-tech-blue/5"
                                                    : "border-border-soft bg-light-gray"
                                            }`}
                                        >
                                            <span className="text-xs font-semibold text-navy">{meta.label}</span>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => setData(key, e.target.checked ? "1" : "0")}
                                                className="h-4 w-4 rounded border-border-strong text-tech-blue focus:ring-tech-blue"
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. TAB: BACKGROUND LAYANAN */}
                {currentTab === "media" && (
                    <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <div className="flex items-center gap-2 border-b border-border-soft pb-4 mb-5">
                            <ImageIcon className="h-4 w-4 text-tech-blue" />
                            <h2 className="text-sm font-bold text-navy">Background Gambar Halaman Layanan</h2>
                        </div>
                        <p className="text-xs text-body-text mb-5">
                            Latar belakang hero halaman detail layanan. Isi background default per kategori di
                            bawah; gambar masing-masing layanan dikelola di menu Layanan.
                        </p>

                        <div className="space-y-5">

                            <div className="rounded-xl border border-border-soft bg-white p-4">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-body-text">
                                    Background Default Per Kategori <span className="font-medium normal-case text-body-text">(dipakai jika menu layanan tidak punya gambar sendiri)</span>
                                </p>
                            </div>
                            {serviceBgFields.map((field) => {
                                const currentSrc =
                                    serviceBgPreviews[field.fileKey] || (values[field.settingKey] as string) || "";
                                return (
                                    <div key={field.fileKey} className="rounded-xl border border-border-soft bg-light-gray p-5">
                                        <h3 className="text-xs font-bold text-navy">{field.title}</h3>
                                        <p className="mt-0.5 text-[11px] text-body-text">{field.hint}</p>

                                        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
                                            <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-xl border border-border-soft bg-navy">
                                                {currentSrc ? (
                                                    <img
                                                        src={currentSrc}
                                                        alt={`Background ${field.title}`}
                                                        className="h-full w-full object-cover opacity-60"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-electric-light/70">
                                                        <ImageIcon className="h-5 w-5" />
                                                        <span className="text-[10px] font-semibold">Belum ada gambar</span>
                                                    </div>
                                                )}
                                                {currentSrc && (
                                                    <span className="absolute bottom-1 right-2 text-[10px] font-bold text-white/80 bg-black/50 px-1.5 py-0.5 rounded">
                                                        Preview
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex-1 space-y-2">
                                                <p className="text-xs text-body-text">
                                                    Format: <span className="font-semibold text-navy">PNG, JPG, WEBP</span> (maks. 4MB, rekomendasi resolusi minimal 1920x1080px). Dikosongkan = hero berwarna navy polos.
                                                </p>
                                                <div>
                                                    <input
                                                        type="file"
                                                        id={field.fileKey}
                                                        accept="image/png,image/jpeg,image/jpg,image/webp"
                                                        onChange={handleServiceBgChange(field.fileKey)}
                                                        className="hidden"
                                                    />
                                                    <label
                                                        htmlFor={field.fileKey}
                                                        className="btn-secondary inline-flex items-center gap-1.5 cursor-pointer py-2 text-xs"
                                                    >
                                                        <Upload className="h-3.5 w-3.5" />
                                                        <span>Unggah Gambar</span>
                                                    </label>
                                                    {errors[field.fileKey] && (
                                                        <p className="form-error mt-2">{errors[field.fileKey]}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 4. TAB: KONTAK & ALAMAT */}
                {currentTab === "contact" && (
                    <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <div className="flex items-center gap-2 border-b border-border-soft pb-4 mb-5">
                            <Phone className="h-4 w-4 text-tech-blue" />
                            <h2 className="text-sm font-bold text-navy">Informasi Kontak & Jam Kerja</h2>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            {contactFields.map(([key, meta]) => (
                                <div key={key} className={meta.type === "textarea" ? "sm:col-span-2" : ""}>
                                    <label className="label">{meta.label}</label>
                                    {meta.type === "textarea" ? (
                                        <textarea
                                            value={(data[key] as string) || ""}
                                            onChange={(e) => setData(key, e.target.value)}
                                            className="input"
                                            rows={3}
                                        />
                                    ) : (
                                        <input
                                            value={(data[key] as string) || ""}
                                            onChange={(e) => setData(key, e.target.value)}
                                            className="input"
                                        />
                                    )}
                                    {errors[key] && <p className="form-error">{errors[key]}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. TAB: MEDIA SOSIAL */}
                {currentTab === "social" && (
                    <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <div className="flex items-center gap-2 border-b border-border-soft pb-4 mb-5">
                            <Share2 className="h-4 w-4 text-tech-blue" />
                            <h2 className="text-sm font-bold text-navy">Tautan Media Sosial Resmi</h2>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            {socialFields.map(([key, meta]) => (
                                <div key={key}>
                                    <label className="label">{meta.label}</label>
                                    <input
                                        value={(data[key] as string) || ""}
                                        onChange={(e) => setData(key, e.target.value)}
                                        className="input"
                                        placeholder="https://..."
                                    />
                                    {errors[key] && <p className="form-error">{errors[key]}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 6. TAB: SEO DEFAULT */}
                {currentTab === "seo" && (
                    <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <div className="flex items-center gap-2 border-b border-border-soft pb-4 mb-5">
                            <Search className="h-4 w-4 text-tech-blue" />
                            <h2 className="text-sm font-bold text-navy">Metadata SEO Default Website</h2>
                        </div>

                        <div className="grid gap-5">
                            {seoFields.map(([key, meta]) => (
                                <div key={key}>
                                    <label className="label">{meta.label}</label>
                                    {meta.type === "textarea" ? (
                                        <textarea
                                            value={(data[key] as string) || ""}
                                            onChange={(e) => setData(key, e.target.value)}
                                            className="input"
                                            rows={3}
                                        />
                                    ) : (
                                        <input
                                            value={(data[key] as string) || ""}
                                            onChange={(e) => setData(key, e.target.value)}
                                            className="input"
                                        />
                                    )}
                                    {errors[key] && <p className="form-error">{errors[key]}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 7. TAB: INTEGRASI */}
                {currentTab === "integration" && (
                    <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <div className="flex items-center gap-2 border-b border-border-soft pb-4 mb-5">
                            <MessageSquare className="h-4 w-4 text-tech-blue" />
                            <h2 className="text-sm font-bold text-navy">Live Chat Tawk.to</h2>
                        </div>
                        <p className="text-xs text-body-text mb-5">
                            Widget live chat dimuat di website publik dan portal pelanggan, tidak di halaman admin.
                            Isi Property ID dan Widget ID dari dashboard Tawk.to. Bila salah satu kosong atau
                            sakelar dimatikan, widget tidak dimuat dan website tetap berjalan normal.
                        </p>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {integrationFields
                                .filter(([, meta]) => meta.type === "checkbox")
                                .map(([key, meta]) => {
                                    const isChecked = data[key] === "1";
                                    return (
                                        <label
                                            key={key}
                                            className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${
                                                isChecked
                                                    ? "border-tech-blue/30 bg-tech-blue/5"
                                                    : "border-border-soft bg-light-gray"
                                            }`}
                                        >
                                            <span className="text-xs font-semibold text-navy">{meta.label}</span>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => setData(key, e.target.checked ? "1" : "0")}
                                                className="h-4 w-4 rounded border-border-strong text-tech-blue focus:ring-tech-blue"
                                            />
                                        </label>
                                    );
                                })}
                        </div>

                        <div className="mt-5 grid gap-5 sm:grid-cols-2">
                            {integrationFields
                                .filter(([, meta]) => meta.type !== "checkbox")
                                .map(([key, meta]) => (
                                    <div key={key}>
                                        <label className="label">{meta.label}</label>
                                        <input
                                            value={(data[key] as string) || ""}
                                            onChange={(e) => setData(key, e.target.value)}
                                            className="input"
                                            placeholder="contoh: 6ad87b3937d69234b56b64ab"
                                            autoComplete="off"
                                        />
                                        {errors[key] && <p className="form-error">{errors[key]}</p>}
                                    </div>
                                ))}
                        </div>

                        <div className="mt-5 rounded-lg border border-border-soft bg-light-gray p-4">
                            <p className="text-[11px] font-semibold text-navy">URL widget yang akan dimuat</p>
                            <p className="mt-1 break-all font-mono text-[11px] text-body-text">
                                {tawkPreviewUrl || "Belum lengkap — widget tidak akan dimuat."}
                            </p>
                        </div>
                    </div>
                )}

                {/* Submit button bar */}
                <div className="flex items-center justify-between rounded-2xl border border-border-soft bg-white p-4 shadow-subtle">
                    <p className="text-xs text-body-text">
                        Pastikan seluruh data yang diubah telah diverifikasi sebelum disimpan.
                    </p>
                    <button type="submit" disabled={processing} className="btn-primary py-2.5">
                        <Save className="h-4 w-4" />
                        <span>{processing ? "Menyimpan pengaturan..." : "Simpan Perubahan Pengaturan"}</span>
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}
