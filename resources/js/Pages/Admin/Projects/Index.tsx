import { Head, Link, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { useState } from "react";
import { Plus, Search, Pencil, FolderKanban, Image as ImageIcon } from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Pagination } from "@/Components/admin/Pagination";
import { DeleteButton } from "@/Components/admin/DeleteButton";
import { storageUrl } from "@/utils/assets";
import type { Paginated, ProjectItem } from "@/types";

interface Props {
    projects: Paginated<ProjectItem>;
    filters: { q?: string };
}

export default function ProjectsIndex({ projects, filters }: Props) {
    const [q, setQ] = useState(filters.q || "");

    const search = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route("admin.projects.index"), { q }, { preserveState: true });
    };

    return (
        <AdminLayout title="Kelola Portofolio">
            <Head title="Kelola Portofolio | NDS Admin" />

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-navy sm:text-2xl">Portofolio Proyek</h1>
                    <p className="mt-1 text-xs text-body-text">
                        Kumpulan studi kasus, proyek implementasi IT, dan bukti rekam jejak solusi digital NDS.
                    </p>
                </div>
                <Link href={route("admin.projects.create")} className="btn-primary py-2.5">
                    <Plus className="h-4 w-4" />
                    <span>Tambah Proyek Baru</span>
                </Link>
            </div>

            {/* Search Bar */}
            <div className="mb-6 rounded-2xl border border-border-soft bg-white p-4 shadow-subtle">
                <form onSubmit={search} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-body-text/60" />
                        <label htmlFor="project-search" className="sr-only">
                            Cari proyek
                        </label>
                        <input
                            id="project-search"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Cari berdasarkan judul atau nama proyek..."
                            className="input pl-10"
                        />
                    </div>
                    <button type="submit" className="btn-secondary py-2 text-xs">
                        Cari
                    </button>
                </form>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="table-modern">
                    <thead>
                        <tr>
                            <th className="w-2/5">Proyek & Klien</th>
                            <th>Kategori</th>
                            <th>Urutan</th>
                            <th>Status</th>
                            <th className="text-right">Tindakan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-light-gray text-body-text">
                                            <FolderKanban className="h-6 w-6" />
                                        </div>
                                        <p className="mt-3 text-sm font-semibold text-navy">Belum ada portofolio proyek</p>
                                        <p className="mt-1 text-xs text-body-text">
                                            Tambahkan proyek yang telah sukses dikerjakan oleh tim NDS.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            projects.data.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg bg-light-gray border border-border-soft overflow-hidden">
                                                {p.thumbnail ? (
                                                    <img
                                                        src={storageUrl(p.thumbnail)}
                                                        alt={p.title}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <ImageIcon className="h-4 w-4 text-body-text/40" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-navy truncate">{p.title}</p>
                                                <p className="text-xs text-body-text">
                                                    {p.client ? `Klien: ${p.client}` : `/${p.slug}`}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-neutral">
                                            {p.category || "General"}
                                        </span>
                                    </td>
                                    <td className="font-mono text-xs text-body-text">
                                        {p.sort_order ?? 0}
                                    </td>
                                    <td>
                                        {p.is_published ? (
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
                                                href={route("admin.projects.edit", p.id)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-border-soft bg-white px-2.5 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5 transition-colors"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                <span>Edit</span>
                                            </Link>
                                            <DeleteButton
                                                action={route("admin.projects.destroy", p.id)}
                                                label={p.title}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination meta={projects} />
        </AdminLayout>
    );
}
