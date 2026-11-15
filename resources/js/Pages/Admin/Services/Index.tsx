import { Head, Link, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { useState } from "react";
import { Search, Pencil, Server } from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Pagination } from "@/Components/admin/Pagination";
import { DeleteButton } from "@/Components/admin/DeleteButton";
import { ServiceIcon } from "@/Components/ServiceIcon";
import { storageUrl } from "@/utils/assets";
import type { Paginated, ServiceItem } from "@/types";

interface Props {
    services: Paginated<ServiceItem>;
    filters: { q?: string };
}

export default function ServicesIndex({ services, filters }: Props) {
    const [q, setQ] = useState(filters.q || "");

    const search = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route("admin.services.index"), q ? { q } : {}, { preserveState: true });
    };

    return (
        <AdminLayout title="Kelola Layanan">
            <Head title="Kelola Layanan | NDS Admin" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-navy sm:text-2xl">Layanan</h1>
                    <p className="mt-1 text-xs leading-relaxed text-body-text">
                        Data dasar layanan yang tampil di website publik. Isi halaman detail dikelola
                        developer, dan layanan baru ditambahkan developer.
                    </p>
                </div>
            </div>

            <div className="mb-6 rounded-2xl border border-border-soft bg-white p-4 shadow-subtle">
                <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-body-text/60" />
                        <label htmlFor="service-search" className="sr-only">
                            Cari layanan
                        </label>
                        <input
                            id="service-search"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Cari nama layanan atau slug"
                            className="input pl-10"
                        />
                    </div>
                    <button type="submit" className="btn-secondary py-2 text-xs">
                        Cari
                    </button>
                </form>
            </div>

            <div className="table-wrapper">
                <table className="table-modern">
                    <thead>
                        <tr>
                            <th className="w-20">Thumbnail</th>
                            <th>Nama Layanan</th>
                            <th className="hidden md:table-cell">Deskripsi Singkat</th>
                            <th className="w-32">Status</th>
                            <th className="w-20">Urutan</th>
                            <th className="text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-light-gray text-body-text">
                                            <Server className="h-6 w-6" aria-hidden="true" />
                                        </div>
                                        <p className="mt-3 text-sm font-semibold text-navy">
                                            {filters.q ? "Tidak ada layanan yang cocok" : "Belum ada layanan"}
                                        </p>
                                        <p className="mt-1 text-xs text-body-text">
                                            {filters.q
                                                ? "Coba kata kunci lain."
                                                : "Data layanan akan tampil di sini."}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            services.data.map((s) => (
                                <tr key={s.id}>
                                    <td>
                                        {s.image ? (
                                            <img
                                                src={storageUrl(s.image)}
                                                alt={`Thumbnail ${s.name}`}
                                                className="h-10 w-14 rounded-lg border border-border-soft object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-border-soft bg-navy/10 text-navy">
                                                <ServiceIcon name={s.icon} className="h-5 w-5" />
                                            </div>
                                        )}
                                    </td>

                                    <td>
                                        <p className="font-semibold text-navy">{s.name}</p>
                                        <p className="font-mono text-xs text-body-text">/{s.slug}</p>
                                    </td>

                                    <td className="hidden md:table-cell">
                                        <p className="line-clamp-2 max-w-md text-xs leading-relaxed text-body-text">
                                            {s.short_description || "Belum ada deskripsi."}
                                        </p>
                                    </td>

                                    <td>
                                        {s.is_published ? (
                                            <span className="badge badge-success">Aktif</span>
                                        ) : (
                                            <span className="badge badge-neutral">Nonaktif</span>
                                        )}
                                    </td>

                                    <td>
                                        <span className="font-mono text-sm text-body-text">{s.sort_order ?? 0}</span>
                                    </td>

                                    <td className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={route("admin.services.edit", s.id)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-border-soft bg-white px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-navy/5"
                                                aria-label={`Edit ${s.name}`}
                                            >
                                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                                <span>Edit</span>
                                            </Link>
                                            <DeleteButton action={route("admin.services.destroy", s.id)} label={s.name} />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination meta={services} />
        </AdminLayout>
    );
}
