import { Head, Link, useForm } from "@inertiajs/react";
import { route } from "ziggy-js";
import { ArrowLeft, Save, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { storageUrl } from "@/utils/assets";
import type { ServiceItem } from "@/types";

interface Props {
    service: ServiceItem;
}

const MAX_IMAGE_SIZE = 2048 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function ServiceForm({ service }: Props) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);

    const { data, setData, put, processing, errors } = useForm({
        name: service.name || "",
        short_description: service.short_description || "",
        is_published: service.is_published ?? true,
        sort_order: service.sort_order ?? 0,
        image: null as File | null,
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_IMAGE_SIZE) {
            setFileError("Ukuran gambar maksimal 2MB.");
            e.target.value = "";
            return;
        }
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setFileError("Format gambar harus JPG, PNG, atau WebP.");
            e.target.value = "";
            return;
        }

        setFileError(null);
        setData("image", file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route("admin.services.update", service.id), { forceFormData: true });
    };

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const currentImage = service.image ? storageUrl(service.image) : null;
    const shownImage = previewUrl || currentImage;

    return (
        <AdminLayout title="Edit Layanan">
            <Head title="Edit Layanan | NDS Admin" />

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <Link
                    href={route("admin.services.index")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-tech-blue hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Kembali ke Daftar Layanan</span>
                </Link>
                {service.is_published && (
                    <a
                        href={route("services.show", service.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-body-text hover:text-navy"
                    >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Lihat halaman publik</span>
                    </a>
                )}
            </div>

            <form onSubmit={submit} className="max-w-3xl space-y-5">
                <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                    <h1 className="text-lg font-bold text-navy">Informasi Layanan</h1>
                    <p className="mt-1 text-xs leading-relaxed text-body-text">
                        Isi data dasar layanan. Isi halaman detail (hero, fitur, alur kerja, FAQ) dikelola
                        developer dan tidak berubah dari form ini.
                    </p>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label htmlFor="service-name" className="label">
                                Nama Layanan <span className="text-red-600">*</span>
                            </label>
                            <input
                                id="service-name"
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                className="input"
                                required
                                aria-invalid={!!errors.name}
                                aria-describedby={errors.name ? "service-name-error" : undefined}
                            />
                            {errors.name ? (
                                <p id="service-name-error" className="form-error">
                                    {errors.name}
                                </p>
                            ) : (
                                <p className="form-hint">Alamat halaman: /services/{service.slug}</p>
                            )}
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="service-description" className="label">
                                Deskripsi Singkat
                            </label>
                            <textarea
                                id="service-description"
                                value={data.short_description}
                                onChange={(e) => setData("short_description", e.target.value)}
                                className="input"
                                rows={3}
                                maxLength={1000}
                                placeholder="Satu sampai dua kalimat yang tampil di kartu layanan."
                                aria-invalid={!!errors.short_description}
                            />
                            {errors.short_description ? (
                                <p className="form-error">{errors.short_description}</p>
                            ) : (
                                <p className="form-hint">Maksimal 1000 karakter.</p>
                            )}
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="service-image" className="label">
                                Thumbnail
                            </label>
                            {shownImage && (
                                <img
                                    src={shownImage}
                                    alt={previewUrl ? "Pratinjau gambar baru" : `Thumbnail ${service.name}`}
                                    className="mb-3 h-28 w-full max-w-xs rounded-xl border border-border-soft object-cover"
                                />
                            )}
                            <input
                                id="service-image"
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleImageChange}
                                className="input text-xs"
                                aria-describedby="service-image-hint"
                            />
                            <p id="service-image-hint" className="form-hint">
                                JPG, PNG, atau WebP, maksimal 2MB.
                                {currentImage ? " Unggah gambar baru untuk menggantinya." : ""}
                            </p>
                            {(fileError || errors.image) && (
                                <p className="form-error">{fileError || errors.image}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="service-order" className="label">
                                Urutan Tampil
                            </label>
                            <input
                                id="service-order"
                                type="number"
                                min={0}
                                value={data.sort_order}
                                onChange={(e) => setData("sort_order", Number(e.target.value))}
                                className="input"
                                aria-invalid={!!errors.sort_order}
                            />
                            {errors.sort_order ? (
                                <p className="form-error">{errors.sort_order}</p>
                            ) : (
                                <p className="form-hint">Angka kecil tampil lebih dulu.</p>
                            )}
                        </div>

                        <div>
                            <span className="label">Status</span>
                            <div className="flex flex-col gap-2 pt-1">
                                <label className="flex cursor-pointer items-center gap-2.5 py-2.5 text-sm text-navy">
                                    <input
                                        type="checkbox"
                                        checked={data.is_published}
                                        onChange={(e) => setData("is_published", e.target.checked)}
                                        className="h-4 w-4 rounded text-tech-blue focus:ring-tech-blue"
                                    />
                                    <span>Tampilkan di website publik</span>
                                </label>
                                <p className="text-xs text-body-text">
                                    Jika dimatikan, layanan hilang dari daftar layanan, dropdown navbar, dan
                                    halaman detailnya tidak dapat dibuka.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button type="submit" disabled={processing} className="btn-primary py-2.5">
                        <Save className="h-4 w-4" aria-hidden="true" />
                        <span>{processing ? "Menyimpan..." : "Simpan Perubahan"}</span>
                    </button>
                    <Link href={route("admin.services.index")} className="btn-secondary py-2.5">
                        Batal
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}
