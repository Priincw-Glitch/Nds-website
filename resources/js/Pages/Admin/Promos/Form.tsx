import { Head, Link, useForm, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { useState, useMemo } from "react";
import {
    ArrowLeft,
    Upload,
    X,
    Layers,
    Eye,
    Percent,
    Tag,
    Calendar,
    RefreshCw,
} from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";
import { PromoCard, formatRupiah } from "@/Components/PromoCard";
import { storageUrl } from "@/utils/assets";
import type { PromoItem } from "@/types";

interface PromoFormProps {
    promo: PromoItem | null;
    categories: Array<{ id: number; name: string; slug: string }>;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export default function PromoForm({ promo, categories }: PromoFormProps) {
    const isEdit = !!promo;

    const { data, setData, post, processing, errors, isDirty, transform } = useForm({
        title: promo?.title || "",
        slug: promo?.slug || "",
        service_category_id: promo?.service_category_id ? String(promo.service_category_id) : "",
        description: promo?.description || "",
        discount_type: (promo?.discount_type || "none") as "none" | "percentage" | "fixed" | "special_price",
        original_price: promo?.original_price !== null && promo?.original_price !== undefined ? String(promo.original_price) : "",
        discount_percentage: promo?.discount_percentage !== null && promo?.discount_percentage !== undefined ? String(promo.discount_percentage) : "",
        discount_amount: promo?.discount_amount !== null && promo?.discount_amount !== undefined ? String(promo.discount_amount) : "",
        final_price: promo?.final_price !== null && promo?.final_price !== undefined ? String(promo.final_price) : "",
        start_date: promo?.start_date ? String(promo.start_date).slice(0, 10) : "",
        end_date: promo?.end_date ? String(promo.end_date).slice(0, 10) : "",
        cta_text: promo?.cta_text || "",
        cta_url: promo?.cta_url || "",
        is_active: promo?.is_active ?? true,
        show_on_home: promo?.show_on_home ?? true,
        is_featured: promo?.is_featured ?? false,
        sort_order: promo?.sort_order ?? 0,
        image: null as File | null,
        remove_image: false,
    });

    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | undefined>(
        promo?.image ? storageUrl(promo.image) : undefined
    );
    const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
    const [showCancelModal, setShowCancelModal] = useState(false);

    const originalPriceNum = data.original_price ? parseFloat(data.original_price) : null;
    const discountPercentNum = data.discount_percentage ? parseFloat(data.discount_percentage) : null;
    const discountAmountNum = data.discount_amount ? parseFloat(data.discount_amount) : null;
    const finalPriceNum = data.final_price ? parseFloat(data.final_price) : null;

    const calculatedFinalPrice = useMemo(() => {
        if (data.discount_type === "percentage") {
            if (originalPriceNum && discountPercentNum) {
                return Math.max(0, Math.round(originalPriceNum * (1 - discountPercentNum / 100)));
            }
            return null;
        }
        if (data.discount_type === "fixed") {
            if (originalPriceNum && discountAmountNum) {
                return Math.max(0, originalPriceNum - discountAmountNum);
            }
            return null;
        }
        if (data.discount_type === "special_price") {
            return finalPriceNum;
        }
        if (data.discount_type === "none") {
            return originalPriceNum;
        }
        return null;
    }, [data.discount_type, originalPriceNum, discountPercentNum, discountAmountNum, finalPriceNum]);

    const calculatedSavings = useMemo(() => {
        if (originalPriceNum && calculatedFinalPrice !== null && originalPriceNum > calculatedFinalPrice) {
            return originalPriceNum - calculatedFinalPrice;
        }
        return null;
    }, [originalPriceNum, calculatedFinalPrice]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setData((prev) => ({
            ...prev,
            title: val,
            slug: !isEdit && (!prev.slug || prev.slug === slugify(prev.title)) ? slugify(val) : prev.slug,
        }));
    };

    const handleGenerateSlug = () => {
        if (data.title) {
            setData("slug", slugify(data.title));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData("image", file);
        setData("remove_image", false);
        if (file) {
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setData("image", null);
        setData("remove_image", true);
        setImagePreviewUrl(undefined);
    };

    const handleCancel = (e: React.MouseEvent) => {
        if (isDirty) {
            e.preventDefault();
            setShowCancelModal(true);
        }
    };

    const leaveForm = () => {
        setShowCancelModal(false);
        router.get(route("admin.promos.index"));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const local: Record<string, string> = {};

        if (data.discount_type === "percentage") {
            if (!discountPercentNum || discountPercentNum <= 0 || discountPercentNum > 100) {
                local.discount_percentage = "Persentase diskon harus 1% - 100%.";
            }
        } else if (data.discount_type === "fixed") {
            if (!discountAmountNum || discountAmountNum <= 0) {
                local.discount_amount = "Nominal potongan harus lebih dari 0.";
            } else if (originalPriceNum && discountAmountNum > originalPriceNum) {
                local.discount_amount = "Potongan tidak boleh melebihi harga normal.";
            }
        } else if (data.discount_type === "special_price") {
            if (finalPriceNum === null || finalPriceNum < 0) {
                local.final_price = "Harga promo khusus harus diisi.";
            } else if (originalPriceNum && finalPriceNum >= originalPriceNum) {
                local.final_price = "Harga promo harus lebih murah daripada harga normal.";
            }
        }

        if (data.start_date && data.end_date && new Date(data.end_date) < new Date(data.start_date)) {
            local.end_date = "Tanggal berakhir tidak boleh mendahului tanggal mulai.";
        }

        if (Object.keys(local).length > 0) {
            setLocalErrors(local);
            return;
        }
        setLocalErrors({});

        if (isEdit) {
            transform((currentData) => ({
                ...currentData,
                title: currentData.title?.trim() || promo.title,
                slug: currentData.slug?.trim() || promo.slug,
                _method: "put",
            }));
            post(route("admin.promos.update", promo.id), {
                forceFormData: true,
                preserveScroll: true,
            });
        } else {
            transform((currentData) => ({
                ...currentData,
                _method: undefined,
            }));
            post(route("admin.promos.store"), { forceFormData: true });
        }
    };

    const previewPromoItem: PromoItem = {
        id: promo?.id || 0,
        title: data.title || "Nama Promo",
        slug: data.slug || "nama-promo",
        description: data.description || "Deskripsi singkat promo.",
        image: imagePreviewUrl,
        service_category_id: data.service_category_id ? Number(data.service_category_id) : null,
        category: categories.find((c) => String(c.id) === String(data.service_category_id)) || null,
        discount_type: data.discount_type,
        original_price: originalPriceNum,
        discount_percentage: discountPercentNum,
        discount_amount: discountAmountNum,
        final_price: calculatedFinalPrice,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        cta_text: data.cta_text || "Hubungi Kami",
        cta_url: data.cta_url || route("contact"),
        is_active: data.is_active,
        show_on_home: data.show_on_home,
        is_featured: data.is_featured,
        sort_order: Number(data.sort_order),
    };

    return (
        <AdminLayout title={isEdit ? "Edit Promo" : "Tambah Promo"}>
            <Head title={`${isEdit ? "Edit" : "Tambah"} Promo | NDS Admin`} />

            {/* Back link & Header */}
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        href={route("admin.promos.index")}
                        onClick={handleCancel}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-tech-blue hover:underline mb-1"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Kembali
                    </Link>
                    <h1 className="text-xl font-bold text-navy sm:text-2xl">
                        {isEdit ? "Edit Promo" : "Tambah Promo"}
                    </h1>
                </div>
            </div>

            {/* MAIN FORM GRID WITH STICKY PREVIEW */}
            <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-12">
                {/* LEFT: FORM SECTIONS */}
                <div className="space-y-5 lg:col-span-7 xl:col-span-8">
                    {/* SECTION 1: INFORMASI PROMO */}
                    <div className="rounded-2xl border border-border-soft bg-white p-4 shadow-subtle sm:p-5">
                        <div className="flex items-center gap-2 border-b border-border-soft pb-2.5">
                            <Tag className="h-4 w-4 text-tech-blue" />
                            <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
                                Informasi Promo
                            </h2>
                        </div>

                        <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
                            {/* Title */}
                            <div className="sm:col-span-2">
                                <label className="label text-xs">
                                    Nama Promo {isEdit ? <span className="font-normal text-body-text/70 text-[11px]">(Biarkan jika tidak diubah)</span> : "*"}
                                </label>
                                <input
                                    value={data.title}
                                    onChange={handleTitleChange}
                                    placeholder={promo?.title || "Nama promo"}
                                    className="input text-xs sm:text-sm font-semibold"
                                    required={!isEdit}
                                />
                                {errors.title && <p className="mt-1 text-xs text-crimson">{errors.title}</p>}
                            </div>

                            {/* Slug */}
                            <div className="sm:col-span-2">
                                <div className="flex items-center justify-between">
                                    <label className="label text-xs">
                                        Slug URL {isEdit ? <span className="font-normal text-body-text/70 text-[11px]">(Biarkan jika tidak diubah)</span> : "*"}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleGenerateSlug}
                                        className="inline-flex items-center gap-1 text-[11px] text-tech-blue hover:underline"
                                    >
                                        <RefreshCw className="h-2.5 w-2.5" />
                                        Otomatis
                                    </button>
                                </div>
                                <input
                                    value={data.slug}
                                    onChange={(e) => setData("slug", slugify(e.target.value))}
                                    placeholder={promo?.slug || "slug-promo"}
                                    className="input text-xs font-mono"
                                    required={!isEdit}
                                />
                                {errors.slug && <p className="mt-1 text-xs text-crimson">{errors.slug}</p>}
                            </div>

                            {/* Category Select */}
                            <div>
                                <label className="label text-xs">Kategori Layanan</label>
                                <select
                                    value={data.service_category_id}
                                    onChange={(e) => setData("service_category_id", e.target.value)}
                                    className="input text-xs"
                                >
                                    <option value="">Tanpa Kategori</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-[11px] text-body-text">
                                    Kategori mengikuti daftar layanan website.
                                </p>
                            </div>

                            {/* CTA Text */}
                            <div>
                                <label className="label text-xs">Teks Tombol CTA</label>
                                <input
                                    value={data.cta_text}
                                    onChange={(e) => setData("cta_text", e.target.value)}
                                    placeholder="Hubungi Kami"
                                    className="input text-xs"
                                />
                                {errors.cta_text && <p className="mt-1 text-xs text-crimson">{errors.cta_text}</p>}
                            </div>

                            {/* CTA URL */}
                            <div className="sm:col-span-2">
                                <label className="label text-xs">URL Tujuan / Kontak WhatsApp CTA</label>
                                <input
                                    value={data.cta_url}
                                    onChange={(e) => setData("cta_url", e.target.value)}
                                    placeholder="https://... atau 08123456789 (opsional)"
                                    className="input text-xs font-mono"
                                />
                                <p className="mt-1 text-[11px] text-body-text/60">
                                    Bisa diisi link website, link WhatsApp, atau nomor telepon (08...). Kosongkan untuk mengarahkan ke halaman Kontak NDS.
                                </p>
                                {errors.cta_url && <p className="mt-1 text-xs text-crimson">{errors.cta_url}</p>}
                            </div>

                            {/* Short Description */}
                            <div className="sm:col-span-2">
                                <label className="label text-xs">Deskripsi Singkat</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData("description", e.target.value)}
                                    rows={2}
                                    placeholder="Ringkasan penawaran..."
                                    className="input text-xs"
                                />
                                {errors.description && <p className="mt-1 text-xs text-crimson">{errors.description}</p>}
                            </div>

                            {/* Image Upload */}
                            <div className="sm:col-span-2">
                                <label className="label text-xs">Gambar Banner (16:10)</label>
                                <div className="mt-1 flex items-center gap-3">
                                    {imagePreviewUrl ? (
                                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border-soft bg-navy">
                                            <img
                                                src={imagePreviewUrl}
                                                alt="Preview"
                                                className="h-full w-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute right-1 top-1 rounded-full bg-white/15 p-0.5 text-white border border-white/50 backdrop-blur-sm hover:bg-white/30 hover:border-white"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-border-soft bg-light-gray text-body-text/50">
                                            <Upload className="h-5 w-5" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.webp"
                                            onChange={handleImageChange}
                                            className="input text-xs file:mr-2 file:rounded file:border-0 file:bg-navy file:px-2.5 file:py-1 file:text-xs file:text-white cursor-pointer"
                                        />
                                        <span className="text-[11px] text-body-text">Maksimal 2MB (JPG, PNG, WEBP).</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: PENAWARAN & DISKON */}
                    <div className="rounded-2xl border border-border-soft bg-white p-4 shadow-subtle sm:p-5">
                        <div className="flex items-center gap-2 border-b border-border-soft pb-2.5">
                            <Percent className="h-4 w-4 text-tech-blue" />
                            <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
                                Penawaran &amp; Diskon
                            </h2>
                        </div>

                        {/* Pilihan Jenis Penawaran */}
                        <div className="mt-3.5">
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {[
                                    { id: "none" as const, label: "Tanpa Diskon" },
                                    { id: "percentage" as const, label: "Diskon %" },
                                    { id: "fixed" as const, label: "Potongan Rp" },
                                    { id: "special_price" as const, label: "Harga Khusus" },
                                ].map((type) => {
                                    const isSelected = data.discount_type === type.id;
                                    return (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setData("discount_type", type.id)}
                                            className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-xs font-bold transition-all ${
                                                isSelected
                                                    ? "border-tech-blue bg-tech-blue/5 text-tech-blue ring-1 ring-tech-blue"
                                                    : "border-border-soft bg-white text-navy hover:border-tech-blue/30"
                                            }`}
                                        >
                                            {type.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Dynamic Inputs */}
                        <div className="mt-3.5 rounded-lg border border-border-soft bg-light-gray/30 p-3.5">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="label text-xs">Harga Normal (Rp)</label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-body-text">
                                            Rp
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={data.original_price}
                                            onChange={(e) => setData("original_price", e.target.value)}
                                            placeholder="500000"
                                            className="input pl-8.5! text-xs font-semibold"
                                        />
                                    </div>
                                </div>

                                {data.discount_type === "percentage" && (
                                    <div>
                                        <label className="label text-xs">Persentase Diskon (%) *</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={data.discount_percentage}
                                                onChange={(e) => setData("discount_percentage", e.target.value)}
                                                placeholder="25"
                                                className="input pr-7! text-xs font-bold text-crimson"
                                                required
                                            />
                                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-crimson">
                                                %
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {localErrors.discount_percentage && (
                                    <p className="form-error mt-1">{localErrors.discount_percentage}</p>
                                )}

                                {data.discount_type === "fixed" && (
                                    <div>
                                        <label className="label text-xs">Nominal Potongan (Rp) *</label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-body-text">
                                                Rp
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={data.discount_amount}
                                                onChange={(e) => setData("discount_amount", e.target.value)}
                                                placeholder="100000"
                                                className="input pl-8.5! text-xs font-bold text-crimson"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                                {localErrors.discount_amount && (
                                    <p className="form-error mt-1">{localErrors.discount_amount}</p>
                                )}

                                {data.discount_type === "special_price" && (
                                    <div>
                                        <label className="label text-xs">Harga Promo (Rp) *</label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-body-text">
                                                Rp
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={data.final_price}
                                                onChange={(e) => setData("final_price", e.target.value)}
                                                placeholder="350000"
                                                className="input pl-8.5! text-xs font-bold text-tech-blue"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                                {localErrors.final_price && (
                                    <p className="form-error mt-1">{localErrors.final_price}</p>
                                )}
                            </div>

                            {/* Ringkasan Harga Singkat */}
                            {calculatedFinalPrice !== null && (
                                <div className="mt-3 flex items-center justify-between rounded-md border border-border-soft bg-white px-3 py-2 text-xs">
                                    <div>
                                        <span className="text-body-text">Harga Promo: </span>
                                        <strong className="font-extrabold text-navy">
                                            {formatRupiah(calculatedFinalPrice)}
                                        </strong>
                                    </div>
                                    {calculatedSavings !== null && (
                                        <span className="font-bold text-success">
                                            Hemat {formatRupiah(calculatedSavings)}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 3: PERIODE & STATUS */}
                    <div className="rounded-2xl border border-border-soft bg-white p-4 shadow-subtle sm:p-5">
                        <div className="flex items-center gap-2 border-b border-border-soft pb-2.5">
                            <Calendar className="h-4 w-4 text-tech-blue" />
                            <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
                                Periode &amp; Status
                            </h2>
                        </div>

                        <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
                            <div>
                                <label className="label text-xs">Tanggal Mulai</label>
                                <input
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) => setData("start_date", e.target.value)}
                                    className="input text-xs"
                                />
                            </div>

                            <div>
                                <label className="label text-xs">Tanggal Berakhir</label>
                                <input
                                    type="date"
                                    value={data.end_date}
                                    onChange={(e) => setData("end_date", e.target.value)}
                                    className="input text-xs"
                                />
                                {localErrors.end_date && (
                                    <p className="form-error mt-1">{localErrors.end_date}</p>
                                )}
                            </div>

                            <div className="sm:col-span-2 pt-1">
                                <label className="flex items-center gap-2 text-xs font-semibold text-navy cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData("is_active", e.target.checked)}
                                        className="h-4 w-4 rounded text-tech-blue"
                                    />
                                    <span>Aktifkan Promo (Publikasi)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: PENGATURAN TAMPILAN */}
                    <div className="rounded-2xl border border-border-soft bg-white p-4 shadow-subtle sm:p-5">
                        <div className="flex items-center gap-2 border-b border-border-soft pb-2.5">
                            <Layers className="h-4 w-4 text-tech-blue" />
                            <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
                                Pengaturan Tampilan
                            </h2>
                        </div>

                        <div className="mt-3.5 grid gap-3 sm:grid-cols-3">
                            <div className="flex items-center">
                                <label className="flex items-center gap-2 text-xs font-semibold text-navy cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.show_on_home}
                                        onChange={(e) => setData("show_on_home", e.target.checked)}
                                        className="h-4 w-4 rounded text-tech-blue"
                                    />
                                    <span>Tampil di Beranda</span>
                                </label>
                            </div>

                            <div className="flex items-center">
                                <label className="flex items-center gap-2 text-xs font-semibold text-navy cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.is_featured}
                                        onChange={(e) => setData("is_featured", e.target.checked)}
                                        className="h-4 w-4 rounded text-tech-blue"
                                    />
                                    <span>Tandai Unggulan</span>
                                </label>
                            </div>

                            <div>
                                <label className="label text-xs">Urutan</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.sort_order}
                                    onChange={(e) => setData("sort_order", Number(e.target.value))}
                                    className="input w-24! text-xs font-semibold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-1">
                        <Link
                            href={route("admin.promos.index")}
                            onClick={handleCancel}
                            className="btn-secondary py-2! px-4! text-xs"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-primary py-2! px-5! text-xs font-semibold"
                        >
                            {processing ? "..." : isEdit ? "Perbarui Promo" : "Simpan Promo"}
                        </button>
                    </div>
                </div>

                {/* RIGHT: COMPACT STICKY LIVE PREVIEW */}
                <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
                    <div className="rounded-2xl border border-border-soft bg-white p-4 shadow-subtle">
                        <div className="flex items-center justify-between border-b border-border-soft pb-2.5">
                            <div className="flex items-center gap-1.5">
                                <Eye className="h-3.5 w-3.5 text-tech-blue" />
                                <h3 className="text-xs font-bold text-navy">Pratinjau Card</h3>
                            </div>
                            <span className={`badge ${data.is_active ? "badge-success" : "badge-neutral"}`}>
                                {data.is_active ? "Aktif" : "Draft"}
                            </span>
                        </div>

                        <div className="mt-3.5">
                            {/* Varian "light": sama dengan kartu yang tayang di
                                halaman Promo publik dan Beranda. */}
                            <PromoCard
                                promo={previewPromoItem}
                                isFeatured={data.is_featured}
                                isPreview={true}
                                variant="light"
                            />
                        </div>
                    </div>
                </div>
            </form>

            {/* MODAL KELUAR TANPA MENYIMPAN */}
            {showCancelModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl text-xs">
                        <h3 className="text-sm font-bold text-navy">Tinggalkan halaman ini?</h3>
                        <p className="mt-2 text-body-text">Ada perubahan yang belum disimpan.</p>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowCancelModal(false)}
                                className="btn-secondary py-1! text-xs!"
                            >
                                Lanjut Mengedit
                            </button>
                            <button type="button" onClick={leaveForm} className="btn-primary py-1! text-xs!">
                                Tinggalkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
