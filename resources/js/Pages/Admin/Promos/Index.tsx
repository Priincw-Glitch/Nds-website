import { Head, Link, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { storageUrl } from "@/utils/assets";
import { useState } from "react";
import {
    Plus,
    Search,
    Pencil,
    Clock,
    Copy,
    X,
    RotateCcw,
    Tag,
    Layers,
    AlertTriangle,
    Megaphone,
} from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Pagination } from "@/Components/admin/Pagination";
import { DeleteButton } from "@/Components/admin/DeleteButton";
import { formatRupiah, formatDate } from "@/Components/PromoCard";
import type { Paginated, PromoItem } from "@/types";

interface PromoCategoryRef {
    id: number;
    name: string;
    slug: string;
    promos_count?: number;
}

interface Props {
    promos: Paginated<PromoItem>;
    categories: PromoCategoryRef[];
    stats: {
        total: number;
        active: number;
        scheduled: number;
        expired: number;
        inactive: number;
    };
    filters: {
        q?: string;
        category?: string;
        status?: string;
    };
}

export default function PromosIndex({ promos, categories, stats, filters }: Props) {
    const [q, setQ] = useState(filters.q || "");
    const [statusFilter, setStatusFilter] = useState(filters.status || "");
    const [categoryFilter, setCategoryFilter] = useState(filters.category || "");
    const [duplicatingId, setDuplicatingId] = useState<number | null>(null);
    const [duplicateTarget, setDuplicateTarget] = useState<PromoItem | null>(null);

    const applyFilters = (newParams?: Partial<typeof filters>) => {
        const params: Record<string, string | undefined> = {
            q: q || undefined,
            status: statusFilter || undefined,
            category: categoryFilter || undefined,
            ...newParams,
        };

        Object.keys(params).forEach((key) => {
            if (!params[key]) delete params[key];
        });

        router.get(route("admin.promos.index"), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ q });
    };

    const handleResetFilters = () => {
        setQ("");
        setStatusFilter("");
        setCategoryFilter("");
        router.get(route("admin.promos.index"), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleDuplicate = (promo: PromoItem) => {
        setDuplicateTarget(promo);
    };

    const confirmDuplicate = () => {
        if (!duplicateTarget) return;
        setDuplicatingId(duplicateTarget.id);
        router.post(route("admin.promos.duplicate", duplicateTarget.id), {}, {
            onFinish: () => setDuplicatingId(null),
            preserveScroll: true,
        });
        setDuplicateTarget(null);
    };

    const isFiltered = Boolean(filters.q || filters.status || filters.category);

    return (
        <AdminLayout title="Kelola Promo">
            <Head title="Promo | NDS Admin" />

            {/* HEADER */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-navy sm:text-2xl">Kelola Promo</h1>
                    <p className="text-xs text-body-text">Daftar promo dan penawaran aktif.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route("admin.promos.create")}
                        className="btn-primary inline-flex items-center gap-1.5 py-2! text-xs font-semibold"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tambah Promo</span>
                    </Link>
                </div>
            </div>

            {/* STATS OVERVIEW CARDS (CLEAN & MINIMALIST) */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <button
                    type="button"
                    onClick={() => {
                        setStatusFilter("");
                        applyFilters({ status: undefined });
                    }}
                    className={`cursor-pointer rounded-2xl border p-4 text-left transition-all ${
                        !filters.status
                            ? "border-navy bg-navy text-white shadow-sm"
                            : "border-border-soft bg-white hover:border-tech-blue/40"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${!filters.status ? "text-white/75" : "text-body-text"}`}>
                            Total Promo
                        </span>
                        <Layers className={`h-4 w-4 ${!filters.status ? "text-electric-light" : "text-tech-blue"}`} />
                    </div>
                    <p className={`mt-2 text-2xl font-extrabold sm:text-3xl ${!filters.status ? "text-white" : "text-navy"}`}>
                        {stats.total}
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setStatusFilter("active");
                        applyFilters({ status: "active" });
                    }}
                    className={`cursor-pointer rounded-2xl border p-4 text-left transition-all ${
                        filters.status === "active"
                            ? "border-navy bg-navy text-white shadow-sm"
                            : "border-border-soft bg-white hover:border-tech-blue/40"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${filters.status === "active" ? "text-white/75" : "text-body-text"}`}>
                            Aktif
                        </span>
                        <span className="flex h-2 w-2 rounded-full bg-success" />
                    </div>
                    <p className={`mt-2 text-2xl font-extrabold sm:text-3xl ${filters.status === "active" ? "text-white" : "text-navy"}`}>
                        {stats.active}
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setStatusFilter("scheduled");
                        applyFilters({ status: "scheduled" });
                    }}
                    className={`cursor-pointer rounded-2xl border p-4 text-left transition-all ${
                        filters.status === "scheduled"
                            ? "border-navy bg-navy text-white shadow-sm"
                            : "border-border-soft bg-white hover:border-tech-blue/40"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${filters.status === "scheduled" ? "text-white/75" : "text-body-text"}`}>
                            Terjadwal
                        </span>
                        <Clock className={`h-4 w-4 ${filters.status === "scheduled" ? "text-electric-light" : "text-tech-blue"}`} />
                    </div>
                    <p className={`mt-2 text-2xl font-extrabold sm:text-3xl ${filters.status === "scheduled" ? "text-white" : "text-navy"}`}>
                        {stats.scheduled}
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setStatusFilter("expired");
                        applyFilters({ status: "expired" });
                    }}
                    className={`cursor-pointer rounded-2xl border p-4 text-left transition-all ${
                        filters.status === "expired"
                            ? "border-crimson bg-crimson/10 text-crimson"
                            : "border-border-soft bg-white hover:border-crimson"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${filters.status === "expired" ? "text-crimson-dark" : "text-body-text"}`}>
                            Berakhir
                        </span>
                        <AlertTriangle className="h-4 w-4 text-crimson" />
                    </div>
                    <p className="mt-2 text-2xl font-extrabold sm:text-3xl text-crimson">
                        {stats.expired}
                    </p>
                </button>
            </div>

            {/* TOOLBAR */}
            <div className="mt-5 rounded-2xl border border-border-soft bg-white p-3.5 shadow-subtle">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-body-text/60" />
                        <input
                            type="search"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Cari promo..."
                            className="input pl-8.5! text-xs"
                        />
                        {q && (
                            <button
                                type="button"
                                onClick={() => {
                                    setQ("");
                                    applyFilters({ q: undefined });
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-body-text hover:text-navy"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </form>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                applyFilters({ status: e.target.value });
                            }}
                            className="input w-auto text-xs"
                        >
                            <option value="">Semua Status</option>
                            <option value="active">Aktif</option>
                            <option value="scheduled">Terjadwal</option>
                            <option value="expired">Berakhir</option>
                            <option value="inactive">Nonaktif</option>
                            <option value="featured">Unggulan</option>
                            <option value="home">Beranda</option>
                        </select>

                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                applyFilters({ category: e.target.value });
                            }}
                            className="input w-auto text-xs"
                        >
                            <option value="">Semua Kategori</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.slug}>
                                    {c.name}
                                </option>
                            ))}
                        </select>

                        {isFiltered && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1 rounded-md border border-border-soft px-2.5 py-1.5 text-xs text-crimson hover:bg-crimson/10"
                            >
                                <RotateCcw className="h-3 w-3" />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {categories.length > 0 && (
                    <div className="no-scrollbar mt-3 flex items-center gap-1.5 overflow-x-auto border-t border-border-soft/60 pt-2.5">
                        <button
                            type="button"
                            onClick={() => {
                                setCategoryFilter("");
                                applyFilters({ category: undefined });
                            }}
                            className={`cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs transition-colors ${
                                !categoryFilter
                                    ? "bg-navy text-white font-semibold"
                                    : "bg-light-gray text-body-text hover:text-navy"
                            }`}
                        >
                            Semua
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                    const val = categoryFilter === cat.slug ? "" : cat.slug;
                                    setCategoryFilter(val);
                                    applyFilters({ category: val || undefined });
                                }}
                                className={`cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs transition-colors ${
                                    categoryFilter === cat.slug
                                        ? "bg-navy text-white font-semibold"
                                        : "bg-light-gray text-body-text hover:text-navy"
                                }`}
                            >
                                {cat.name} ({cat.promos_count ?? 0})
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* TABEL PROMO */}
            <div className="mt-5 overflow-hidden rounded-2xl border border-border-soft bg-white shadow-subtle">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-border-soft bg-light-gray font-semibold uppercase tracking-wider text-body-text">
                            <tr>
                                <th className="px-4 py-3">Promo</th>
                                <th className="px-4 py-3">Kategori</th>
                                <th className="px-4 py-3">Penawaran</th>
                                <th className="px-4 py-3">Periode</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-soft">
                            {promos.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12">
                                        <div className="flex flex-col items-center text-center">
                                            <Megaphone className="h-8 w-8 text-border-strong" />
                                            <p className="mt-2.5 text-xs font-semibold text-navy">
                                                {isFiltered ? "Tidak ada promo yang cocok dengan filter." : "Belum ada promo."}
                                            </p>
                                            {!isFiltered && (
                                                <Link href={route("admin.promos.create")} className="btn-primary mt-3 py-1.5! text-xs!">
                                                    <Plus className="h-3.5 w-3.5" />
                                                    <span>Tambah Promo Pertama</span>
                                                </Link>
                                            )}
                                            {isFiltered && (
                                                <button
                                                    type="button"
                                                    onClick={handleResetFilters}
                                                    className="btn-secondary mt-3 py-1.5! text-xs!"
                                                >
                                                    Reset Filter
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                promos.data.map((p) => {
                                    const status = p.computed_status || "inactive";

                                    return (
                                        <tr key={p.id} className="transition-colors hover:bg-navy/5">
                                            {/* Promo Info */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md border border-border-soft bg-navy">
                                                        {p.image ? (
                                                            <img
                                                                src={storageUrl(p.image)}
                                                                alt={p.title}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy to-tech-blue text-white/50">
                                                                <Tag className="h-3.5 w-3.5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-bold text-navy line-clamp-1">{p.title}</p>
                                                            {p.is_featured && (
                                                                <span className="rounded bg-navy px-1 py-0.5 text-[9px] font-bold text-white">
                                                                    Unggulan
                                                                </span>
                                                            )}
                                                            {p.show_on_home && (
                                                                <span className="rounded bg-tech-blue/10 px-1 py-0.5 text-[9px] font-semibold text-tech-blue">
                                                                    Beranda
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-body-text font-mono">/{p.slug}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="px-4 py-3 text-navy">
                                                {p.category ? p.category.name : <span className="text-body-text/50">-</span>}
                                            </td>

                                            {/* Discount */}
                                            <td className="px-4 py-3">
                                                {p.discount_type === "percentage" && p.discount_percentage ? (
                                                    <span className="rounded bg-crimson/10 px-1.5 py-0.5 font-bold text-crimson">
                                                        {Math.round(p.discount_percentage)}% OFF
                                                    </span>
                                                ) : p.discount_type === "fixed" && p.discount_amount ? (
                                                    <span className="rounded bg-crimson/10 px-1.5 py-0.5 font-bold text-crimson">
                                                        Hemat {formatRupiah(p.discount_amount)}
                                                    </span>
                                                ) : p.discount_type === "special_price" && p.final_price ? (
                                                    <span className="font-bold text-navy">
                                                        {formatRupiah(p.final_price)}
                                                    </span>
                                                ) : (
                                                    <span className="text-body-text">Reguler</span>
                                                )}
                                            </td>

                                            {/* Period */}
                                            <td className="px-4 py-3 text-body-text">
                                                {p.end_date ? formatDate(p.end_date) : "Tanpa Batas"}
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                                        status === "active"
                                                            ? "bg-success/10 text-success"
                                                            : status === "scheduled"
                                                            ? "bg-tech-blue/10 text-tech-blue"
                                                            : status === "expired"
                                                            ? "bg-danger/10 text-danger"
                                                            : "bg-light-gray text-body-text"
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${
                                                            status === "active"
                                                                ? "bg-success"
                                                                : status === "scheduled"
                                                                ? "bg-tech-blue"
                                                                : status === "expired"
                                                                ? "bg-danger"
                                                                : "bg-body-text/40"
                                                        }`}
                                                    />
                                                    {status === "active"
                                                        ? "Aktif"
                                                        : status === "scheduled"
                                                        ? "Terjadwal"
                                                        : status === "expired"
                                                        ? "Berakhir"
                                                        : "Nonaktif"}
                                                </span>
                                            </td>

                                            {/* Action Buttons */}
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link
                                                        href={route("admin.promos.edit", p.id)}
                                                        className="inline-flex items-center gap-1 rounded border border-border-soft px-2 py-1 text-navy hover:bg-navy/5"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-3 w-3 text-tech-blue" />
                                                        <span>Edit</span>
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDuplicate(p)}
                                                        disabled={duplicatingId === p.id}
                                                        className="inline-flex items-center gap-1 rounded border border-border-soft px-2 py-1 text-navy hover:bg-navy/5 disabled:opacity-50"
                                                        title="Duplikat"
                                                    >
                                                        <Copy className="h-3 w-3 text-body-text" />
                                                        <span>Salin</span>
                                                    </button>

                                                    <DeleteButton
                                                        action={route("admin.promos.destroy", p.id)}
                                                        label={`promo "${p.title}"`}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-3 border-t border-border-soft bg-white">
                    <Pagination meta={promos} />
                </div>
            </div>

            {/* CONFIRM DUPLICATE PROMO */}
            {duplicateTarget && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl text-xs">
                        <h3 className="text-sm font-bold text-navy">Duplikat promo ini?</h3>
                        <p className="mt-2 text-body-text">
                            Salinan baru dari "{duplicateTarget.title}" akan dibuat dengan status nonaktif.
                        </p>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDuplicateTarget(null)}
                                className="btn-secondary py-1! text-xs!"
                            >
                                Batal
                            </button>
                            <button type="button" onClick={confirmDuplicate} className="btn-primary py-1! text-xs!">
                                Duplikat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
