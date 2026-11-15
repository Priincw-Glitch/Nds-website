import { Head, useForm } from "@inertiajs/react";
import { route } from "ziggy-js";
import { useState } from "react";
import { Pencil, Tags, X, Check, BookOpen } from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";
import { DeleteButton } from "@/Components/admin/DeleteButton";

interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    articles_count?: number;
}

export default function ArticleCategoriesIndex({ categories }: { categories: { data: Category[] } }) {
    const [editing, setEditing] = useState<Category | null>(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: "",
        slug: "",
        description: "",
    });

    const openEdit = (cat: Category) => {
        setEditing(cat);
        setData({
            name: cat.name,
            slug: cat.slug,
            description: cat.description || "",
        });
    };

    const cancelEdit = () => {
        setEditing(null);
        reset();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            put(route("admin.article-categories.update", editing.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setEditing(null);
                    reset();
                },
            });
        } else {
            post(route("admin.article-categories.store"), {
                preserveScroll: true,
                onSuccess: () => reset(),
            });
        }
    };

    return (
        <AdminLayout title="Kategori Artikel">
            <Head title="Kategori Artikel | NDS Admin" />

            <div className="mb-6">
                <h1 className="text-xl font-bold text-navy sm:text-2xl">Kategori Artikel Blog</h1>
                <p className="mt-1 text-xs text-body-text">
                    Kelola topik dan klasifikasi artikel untuk mempermudah pembaca menemukan topik teknologi yang relevan.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Table Section */}
                <div className="lg:col-span-2">
                    <div className="table-wrapper">
                        <table className="table-modern">
                            <thead>
                                <tr>
                                    <th>Nama Kategori</th>
                                    <th>Jumlah Artikel</th>
                                    <th className="text-right">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-12 text-center text-body-text">
                                            <div className="flex flex-col items-center justify-center">
                                                <Tags className="h-6 w-6 text-body-text/60" />
                                                <p className="mt-2 text-sm font-semibold text-navy">Belum ada kategori artikel</p>
                                                <p className="text-xs text-body-text">Buat kategori pertama Anda melalui formulir di samping.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    categories.data.map((cat) => (
                                        <tr key={cat.id}>
                                            <td>
                                                <p className="font-semibold text-navy">{cat.name}</p>
                                                <p className="text-xs text-body-text font-mono">/{cat.slug}</p>
                                                {cat.description && (
                                                    <p className="mt-1 text-xs text-body-text truncate max-w-xs">{cat.description}</p>
                                                )}
                                            </td>
                                            <td>
                                                <span className="badge badge-neutral">
                                                    {cat.articles_count ?? 0} Artikel
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(cat)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-border-soft bg-white px-2.5 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5 transition-colors"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        <span>Edit</span>
                                                    </button>
                                                    <DeleteButton
                                                        action={route("admin.article-categories.destroy", cat.id)}
                                                        label={cat.name}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Form Section */}
                <div>
                    <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <div className="flex items-center justify-between border-b border-border-soft pb-4 mb-5">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-tech-blue" />
                                <h2 className="text-sm font-bold text-navy">
                                    {editing ? `Edit: ${editing.name}` : "Tambah Kategori Baru"}
                                </h2>
                            </div>
                            {editing && (
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="text-xs text-body-text hover:text-navy inline-flex items-center gap-1"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    <span>Batal</span>
                                </button>
                            )}
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="label">Nama Kategori *</label>
                                <input
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    className="input"
                                    placeholder="cth: Tutorial & Tips"
                                    required
                                />
                                {errors.name && <p className="form-error">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="label">Slug URL *</label>
                                <input
                                    value={data.slug}
                                    onChange={(e) => setData("slug", e.target.value)}
                                    className="input font-mono"
                                    placeholder="cth: tutorial-tips"
                                    required
                                />
                                {errors.slug && <p className="form-error">{errors.slug}</p>}
                            </div>

                            <div>
                                <label className="label">Deskripsi</label>
                                <textarea
                                    value={data.description || ""}
                                    onChange={(e) => setData("description", e.target.value)}
                                    className="input"
                                    rows={3}
                                    placeholder="Deskripsi singkat topik artikel..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="btn-primary w-full py-2.5"
                            >
                                <Check className="h-4 w-4" />
                                <span>{processing ? "Menyimpan..." : editing ? "Perbarui Kategori" : "Simpan Kategori"}</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
