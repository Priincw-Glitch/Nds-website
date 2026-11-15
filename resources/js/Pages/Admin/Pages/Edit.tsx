import { Head, Link, useForm } from "@inertiajs/react";
import { route } from "ziggy-js";
import { ArrowLeft, ExternalLink, FileText, Save } from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";
import RichTextEditor from "@/Components/admin/RichTextEditor";
import { storageUrl } from "@/utils/assets";

interface PageContent {
    id: number;
    slug: string;
    title: string;
    hero_title: string | null;
    hero_description: string | null;
    content: string | null;
    image: string | null;
    is_published: boolean;
}

function previewUrl(slug: string): string | null {
    if (slug === "about") return route("about");
    if (slug === "privacy") return route("privacy");
    return null;
}

export default function PageEdit({ page }: { page: PageContent }) {
    const { data, setData, put, processing, errors } = useForm({
        title: page.title,
        hero_title: page.hero_title || "",
        hero_description: page.hero_description || "",
        content: page.content || "",
        is_published: page.is_published,
        remove_image: false,
        image: null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route("admin.pages.update", page.id), { forceFormData: true, preserveScroll: true });
    };

    const url = previewUrl(page.slug);

    return (
        <AdminLayout title={`Halaman: ${page.title}`}>
            <Head title={`Edit ${page.title} | NDS Admin`} />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <Link
                    href={route("admin.pages.index")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-tech-blue hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Halaman Statis
                </Link>
                {url && (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border-soft bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Lihat Halaman
                    </a>
                )}
            </div>

            <form onSubmit={submit} className="max-w-4xl space-y-6">
                <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                    <div className="mb-5 flex items-center gap-2 border-b border-border-soft pb-4">
                        <FileText className="h-4 w-4 text-tech-blue" />
                        <h2 className="text-sm font-bold text-navy">Judul & Pembuka Halaman</h2>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label className="label">Judul Halaman *</label>
                            <input
                                value={data.title}
                                onChange={(e) => setData("title", e.target.value)}
                                className="input font-medium"
                                required
                            />
                            {errors.title && <p className="form-error">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="label">Judul pada Hero</label>
                            <input
                                value={data.hero_title}
                                onChange={(e) => setData("hero_title", e.target.value)}
                                className="input"
                                placeholder="Kosongkan untuk memakai judul halaman"
                            />
                            {errors.hero_title && <p className="form-error">{errors.hero_title}</p>}
                        </div>

                        <div className="sm:col-span-2">
                            <label className="label">Deskripsi Pembuka (Hero)</label>
                            <textarea
                                value={data.hero_description}
                                onChange={(e) => setData("hero_description", e.target.value)}
                                className="input"
                                rows={3}
                            />
                            {errors.hero_description && <p className="form-error">{errors.hero_description}</p>}
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                    <div className="mb-5 flex items-center gap-2 border-b border-border-soft pb-4">
                        <FileText className="h-4 w-4 text-tech-blue" />
                        <h2 className="text-sm font-bold text-navy">Isi Halaman</h2>
                    </div>

                    <label className="label">Konten</label>
                    <RichTextEditor
                        value={data.content}
                        onChange={(html) => setData("content", html)}
                    />
                    <p className="mt-2 text-[11px] leading-relaxed text-body-text">
                        Tulis langsung dengan tombol di atas: paragraf, sub-judul, daftar, dan garis
                        pemisah. Pada halaman Kebijakan Privasi, setiap garis pemisah memisahkan isi
                        menjadi panel tersendiri di website.
                    </p>
                    {errors.content && <p className="form-error">{errors.content}</p>}

                    <div className="mt-6 grid gap-5 border-t border-border-soft pt-5 sm:grid-cols-2">
                        <div>
                            <label className="label">Gambar Halaman (opsional)</label>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                onChange={(e) => setData("image", e.target.files?.[0] || null)}
                                className="input text-xs"
                            />
                            {errors.image && <p className="form-error">{errors.image}</p>}

                            {page.image && (
                                <div className="mt-3 space-y-2">
                                    <img
                                        src={storageUrl(page.image)}
                                        alt={page.title}
                                        className="h-24 w-full rounded-lg border border-border-soft object-cover sm:h-28"
                                    />
                                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-navy">
                                        <input
                                            type="checkbox"
                                            checked={data.remove_image}
                                            onChange={(e) => setData("remove_image", e.target.checked)}
                                            className="h-4 w-4 rounded text-tech-blue focus:ring-tech-blue"
                                        />
                                        <span>Hapus gambar saat menyimpan</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="label">Status Publikasi</label>
                            <label
                                className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                                    data.is_published
                                        ? "border-tech-blue/30 bg-tech-blue/5"
                                        : "border-border-soft bg-light-gray"
                                }`}
                            >
                                <span className="text-xs font-semibold text-navy">
                                    {data.is_published ? "Tayang di website" : "Disembunyikan (404)"}
                                </span>
                                <input
                                    type="checkbox"
                                    checked={data.is_published}
                                    onChange={(e) => setData("is_published", e.target.checked)}
                                    className="h-4 w-4 rounded text-tech-blue focus:ring-tech-blue"
                                />
                            </label>
                            <p className="mt-2 text-[11px] leading-relaxed text-body-text">
                                Bila dimatikan, halaman tidak dapat diakses publik meski tautan footer tetap ada.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button type="submit" disabled={processing} className="btn-primary py-2.5">
                        <Save className="h-4 w-4" />
                        <span>{processing ? "Menyimpan halaman..." : "Simpan Halaman"}</span>
                    </button>
                    <Link href={route("admin.pages.index")} className="btn-secondary py-2.5">
                        Batal
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}
