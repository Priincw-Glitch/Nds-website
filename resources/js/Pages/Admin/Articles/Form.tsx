import { Head, Link, useForm } from "@inertiajs/react";
import { route } from "ziggy-js";
import { ArrowLeft, Save, FileText, Globe } from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";
import { storageUrl } from "@/utils/assets";
import type { ArticleItem } from "@/types";

interface Props {
    article: ArticleItem | null;
    categories: Array<{ id: number; name: string; slug: string }>;
}

export default function ArticleForm({ article, categories }: Props) {
    const isEdit = !!article;

    const { data, setData, post, put, processing, errors } = useForm({
        article_category_id: article?.article_category_id || "",
        title: article?.title || "",
        slug: article?.slug || "",
        excerpt: article?.excerpt || "",
        content: article?.content || "",
        author: article?.author || "",
        published_at: article?.published_at
            ? String(article.published_at).slice(0, 10)
            : new Date().toISOString().slice(0, 10),
        meta_title: article?.meta_title || "",
        meta_description: article?.meta_description || "",
        is_published: article?.is_published ?? false,
        image: null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(route("admin.articles.update", article.id), { forceFormData: true });
        } else {
            post(route("admin.articles.store"), { forceFormData: true });
        }
    };

    return (
        <AdminLayout title={isEdit ? "Edit Artikel" : "Tambah Artikel"}>
            <Head title={`${isEdit ? "Edit" : "Tambah"} Artikel | NDS Admin`} />

            {/* Back link */}
            <div className="mb-6 flex items-center justify-between">
                <Link
                    href={route("admin.articles.index")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-tech-blue hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Kembali ke Daftar Artikel</span>
                </Link>
            </div>

            <form onSubmit={submit} className="space-y-6 max-w-4xl">
                {/* Panel 1: Konten Utama */}
                <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                    <div className="flex items-center gap-2 border-b border-border-soft pb-4 mb-5">
                        <FileText className="h-4 w-4 text-tech-blue" />
                        <h2 className="text-sm font-bold text-navy">Informasi & Konten Artikel</h2>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="label">Judul Artikel *</label>
                            <input
                                value={data.title}
                                onChange={(e) => setData("title", e.target.value)}
                                className="input font-medium"
                                placeholder="cth: Mengapa Arsitektur Cloud Penting untuk Skala Bisnis"
                                required
                            />
                            {errors.title && <p className="form-error">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="label">Slug URL *</label>
                            <input
                                value={data.slug}
                                onChange={(e) => setData("slug", e.target.value)}
                                className="input font-mono"
                                placeholder="cth: arsitektur-cloud-skala-bisnis"
                                required
                            />
                            {errors.slug && <p className="form-error">{errors.slug}</p>}
                        </div>

                        <div>
                            <label className="label">Kategori</label>
                            <select
                                value={data.article_category_id || ""}
                                onChange={(e) =>
                                    setData("article_category_id", e.target.value ? Number(e.target.value) : "")
                                }
                                className="input"
                            >
                                <option value="">(Tanpa Kategori)</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="label">Nama Penulis</label>
                            <input
                                value={data.author || ""}
                                onChange={(e) => setData("author", e.target.value)}
                                className="input"
                                placeholder="cth: Tim Teknis NDS"
                            />
                        </div>

                        <div>
                            <label className="label">Tanggal Publikasi</label>
                            <input
                                type="date"
                                value={data.published_at || ""}
                                onChange={(e) => setData("published_at", e.target.value)}
                                className="input"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="label">Ringkasan / Excerpt</label>
                            <textarea
                                value={data.excerpt || ""}
                                onChange={(e) => setData("excerpt", e.target.value)}
                                className="input"
                                rows={2}
                                placeholder="Ringkasan singkat 1-2 kalimat untuk preview di halaman blog..."
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="label">Konten Lengkap</label>
                            <textarea
                                value={data.content || ""}
                                onChange={(e) => setData("content", e.target.value)}
                                className="input"
                                rows={10}
                                placeholder="Tulis isi artikel di sini. Pisahkan antar paragraf dengan tombol Enter..."
                            />
                        </div>
                    </div>
                </div>

                {/* Panel 2: Media & SEO */}
                <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                    <div className="flex items-center gap-2 border-b border-border-soft pb-4 mb-5">
                        <Globe className="h-4 w-4 text-tech-blue" />
                        <h2 className="text-sm font-bold text-navy">Media Ilustrasi & Optimasi SEO</h2>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label className="label">Gambar Header / Thumbnail</label>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                onChange={(e) => setData("image", e.target.files?.[0] || null)}
                                className="input text-xs"
                            />
                            {isEdit && article?.image && (
                                <div className="mt-3 flex items-center gap-3">
                                    <img
                                        src={storageUrl(article.image)}
                                        alt={article.title}
                                        className="h-16 w-24 rounded-lg object-cover border border-border-soft"
                                    />
                                    <span className="text-xs text-body-text">Gambar aktif saat ini</span>
                                </div>
                            )}
                            {errors.image && <p className="form-error">{errors.image}</p>}
                        </div>

                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2.5 text-sm font-medium text-navy cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.is_published}
                                    onChange={(e) => setData("is_published", e.target.checked)}
                                    className="h-4 w-4 rounded text-tech-blue focus:ring-tech-blue"
                                />
                                <span>Publikasikan artikel (dapat dibaca publik)</span>
                            </label>
                        </div>

                        <div>
                            <label className="label">Meta Title (SEO)</label>
                            <input
                                value={data.meta_title || ""}
                                onChange={(e) => setData("meta_title", e.target.value)}
                                className="input"
                                placeholder="Judul optimasi SEO..."
                            />
                        </div>

                        <div>
                            <label className="label">Meta Description (SEO)</label>
                            <input
                                value={data.meta_description || ""}
                                onChange={(e) => setData("meta_description", e.target.value)}
                                className="input"
                                placeholder="Deskripsi ringkas untuk Google..."
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                    <button type="submit" disabled={processing} className="btn-primary py-2.5">
                        <Save className="h-4 w-4" />
                        <span>{processing ? "Menyimpan data..." : isEdit ? "Perbarui Artikel" : "Simpan Artikel"}</span>
                    </button>
                    <Link href={route("admin.articles.index")} className="btn-secondary py-2.5">
                        Batal
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}
