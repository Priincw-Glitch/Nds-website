import { Head, Link, useForm } from "@inertiajs/react";
import { route } from "ziggy-js";
import { ArrowLeft, Save, FolderKanban, Image as ImageIcon } from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";
import { storageUrl } from "@/utils/assets";
import type { ProjectItem } from "@/types";

export default function ProjectForm({ project }: { project: ProjectItem | null }) {
    const isEdit = !!project;

    const { data, setData, post, put, processing, errors } = useForm({
        title: project?.title || "",
        slug: project?.slug || "",
        category: project?.category || "",
        description: project?.description || "",
        client: project?.client || "",
        sort_order: project?.sort_order || 0,
        is_published: project?.is_published ?? true,
        thumbnail: null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(route("admin.projects.update", project.id), { forceFormData: true });
        } else {
            post(route("admin.projects.store"), { forceFormData: true });
        }
    };

    return (
        <AdminLayout title={isEdit ? "Edit Proyek" : "Tambah Proyek"}>
            <Head title={`${isEdit ? "Edit" : "Tambah"} Proyek | NDS Admin`} />

            {/* Back link */}
            <div className="mb-6 flex items-center justify-between">
                <Link
                    href={route("admin.projects.index")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-tech-blue hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Kembali ke Daftar Portofolio</span>
                </Link>
            </div>

            <form onSubmit={submit} className="space-y-6 max-w-3xl">
                <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                    <div className="flex items-center gap-2 border-b border-border-soft pb-4 mb-5">
                        <FolderKanban className="h-4 w-4 text-tech-blue" />
                        <h2 className="text-sm font-bold text-navy">Informasi Proyek</h2>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label className="label">Judul Proyek *</label>
                            <input
                                value={data.title}
                                onChange={(e) => setData("title", e.target.value)}
                                className="input"
                                placeholder="cth: Implementasi Jaringan Fiber Optic"
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
                                placeholder="cth: implementasi-jaringan-fiber-optic"
                                required
                            />
                            {errors.slug && <p className="form-error">{errors.slug}</p>}
                        </div>

                        <div>
                            <label className="label">Kategori Proyek</label>
                            <input
                                value={data.category || ""}
                                onChange={(e) => setData("category", e.target.value)}
                                className="input"
                                placeholder="cth: Network Infrastructure"
                            />
                        </div>

                        <div>
                            <label className="label">Nama Klien / Perusahaan</label>
                            <input
                                value={data.client || ""}
                                onChange={(e) => setData("client", e.target.value)}
                                className="input"
                                placeholder="cth: PT Multi Bangun Solusi"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="label">Deskripsi Proyek</label>
                            <textarea
                                value={data.description || ""}
                                onChange={(e) => setData("description", e.target.value)}
                                className="input"
                                rows={4}
                                placeholder="Jelaskan tantangan, solusi yang diterapkan NDS, dan hasil yang dicapai..."
                            />
                        </div>

                        <div>
                            <label className="label">Foto Thumbnail (jpg, png, webp)</label>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                onChange={(e) => setData("thumbnail", e.target.files?.[0] || null)}
                                className="input text-xs"
                            />
                            {isEdit && project?.thumbnail && (
                                <div className="mt-3 flex items-center gap-3">
                                    <img
                                        src={storageUrl(project.thumbnail)}
                                        alt={project.title}
                                        className="h-16 w-24 rounded-lg object-cover border border-border-soft"
                                    />
                                    <span className="text-xs text-body-text">Thumbnail aktif</span>
                                </div>
                            )}
                            {errors.thumbnail && <p className="form-error">{errors.thumbnail}</p>}
                        </div>

                        <div>
                            <label className="label">Urutan Tampil (Sort Order)</label>
                            <input
                                type="number"
                                value={data.sort_order}
                                onChange={(e) => setData("sort_order", Number(e.target.value))}
                                className="input"
                            />
                        </div>

                        <div className="sm:col-span-2 pt-2 border-t border-border-soft">
                            <label className="flex items-center gap-2.5 text-sm font-medium text-navy cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.is_published}
                                    onChange={(e) => setData("is_published", e.target.checked)}
                                    className="h-4 w-4 rounded text-tech-blue focus:ring-tech-blue"
                                />
                                <span>Tampilkan di halaman website (Published)</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button type="submit" disabled={processing} className="btn-primary py-2.5">
                        <Save className="h-4 w-4" />
                        <span>{processing ? "Menyimpan data..." : isEdit ? "Perbarui Proyek" : "Simpan Proyek"}</span>
                    </button>
                    <Link href={route("admin.projects.index")} className="btn-secondary py-2.5">
                        Batal
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}
