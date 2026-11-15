import { Head, Link, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { useState } from "react";
import { Plus, Search, Pencil, Newspaper, Filter, CalendarDays, Tags } from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Pagination } from "@/Components/admin/Pagination";
import { DeleteButton } from "@/Components/admin/DeleteButton";
import type { ArticleItem, Paginated } from "@/types";

interface Props {
    articles: Paginated<ArticleItem>;
    categories: Array<{ id: number; name: string; slug: string }>;
    filters: { q?: string; category?: string };
}

export default function ArticlesIndex({ articles, categories, filters }: Props) {
    const [q, setQ] = useState(filters.q || "");

    const search = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route("admin.articles.index"), { q, category: filters.category }, { preserveState: true });
    };

    return (
        <AdminLayout title="Kelola Artikel">
            <Head title="Kelola Artikel | NDS Admin" />

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-navy sm:text-2xl">Artikel & Wawasan</h1>
                    <p className="mt-1 text-xs text-body-text">
                        Publikasikan tulisan teknologi, panduan praktis, dan berita perkembangan Nusantara Digital Solution.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link href={route("admin.article-categories.index")} className="btn-secondary py-2.5">
                        <Tags className="h-4 w-4" />
                        <span>Kategori</span>
                    </Link>
                    <Link href={route("admin.articles.create")} className="btn-primary py-2.5">
                        <Plus className="h-4 w-4" />
                        <span>Tulis Artikel Baru</span>
                    </Link>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 rounded-2xl border border-border-soft bg-white p-4 shadow-subtle">
                <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-body-text/60" />
                        <label htmlFor="article-search" className="sr-only">
                            Cari artikel
                        </label>
                        <input
                            id="article-search"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Cari berdasarkan judul artikel..."
                            className="input pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2 sm:w-64">
                        <Filter className="h-4 w-4 text-body-text shrink-0 hidden sm:block" />
                        <select
                            value={filters.category || ""}
                            onChange={(e) =>
                                router.get(
                                    route("admin.articles.index"),
                                    { q: filters.q, category: e.target.value || undefined },
                                    { preserveState: true }
                                )
                            }
                            className="input"
                        >
                            <option value="">Semua Kategori</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="btn-secondary py-2 text-xs">
                        Terapkan
                    </button>
                </form>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="table-modern">
                    <thead>
                        <tr>
                            <th className="w-2/5">Judul Artikel</th>
                            <th>Kategori</th>
                            <th>Tanggal Tayang</th>
                            <th>Status</th>
                            <th className="text-right">Tindakan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {articles.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-light-gray text-body-text">
                                            <Newspaper className="h-6 w-6" />
                                        </div>
                                        <p className="mt-3 text-sm font-semibold text-navy">Belum ada artikel ditemukan</p>
                                        <p className="mt-1 text-xs text-body-text">
                                            Coba ubah kata kunci pencarian atau buat artikel baru.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            articles.data.map((a) => (
                                <tr key={a.id}>
                                    <td>
                                        <p className="font-semibold text-navy line-clamp-1">{a.title}</p>
                                        <p className="text-xs text-body-text font-mono">/{a.slug}</p>
                                    </td>
                                    <td>
                                        <span className="badge badge-neutral">
                                            {a.category?.name || "Umum"}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="inline-flex items-center gap-1.5 text-xs text-body-text">
                                            <CalendarDays className="h-3.5 w-3.5 text-body-text/60" />
                                            {a.published_at
                                                ? new Date(a.published_at).toLocaleDateString("id-ID", {
                                                      day: "numeric",
                                                      month: "short",
                                                      year: "numeric",
                                                  })
                                                : "Belum dijadwalkan"}
                                        </span>
                                    </td>
                                    <td>
                                        {a.is_published ? (
                                            <span className="badge badge-success">
                                                Published
                                            </span>
                                        ) : (
                                            <span className="badge badge-neutral">
                                                Draf
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={route("admin.articles.edit", a.id)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-border-soft bg-white px-2.5 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5 transition-colors"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                <span>Edit</span>
                                            </Link>
                                            <DeleteButton
                                                action={route("admin.articles.destroy", a.id)}
                                                label={a.title}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination meta={articles} />
        </AdminLayout>
    );
}
