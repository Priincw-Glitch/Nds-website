import { Head, Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import { ExternalLink, FileText, Pencil } from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";

interface PageRow {
    id: number;
    slug: string;
    title: string;
    is_published: boolean;
    updated_at: string | null;
}

// URL publik tiap halaman (nama route Ziggy dipanggil literal agar tetap type-safe).
function publicUrl(slug: string): string | null {
    if (slug === "about") return route("about");
    if (slug === "privacy") return route("privacy");
    return null;
}

function formatDate(value: string | null) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function PagesIndex({ pages }: { pages: PageRow[] }) {
    return (
        <AdminLayout title="Halaman Statis">
            <Head title="Halaman Statis | NDS Admin" />

            <div className="mb-6">
                <h1 className="text-xl font-bold text-navy sm:text-2xl">Halaman Statis</h1>
                <p className="mt-1 text-xs text-body-text">
                    Kelola isi halaman Tentang Kami dan Kebijakan Privasi. Perubahan langsung tampil di website.
                </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border-soft bg-white shadow-subtle">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-border-soft bg-light-gray/60 text-[11px] uppercase tracking-wider text-body-text">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Halaman</th>
                            <th className="hidden px-4 py-3 font-semibold sm:table-cell">URL</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="hidden px-4 py-3 font-semibold md:table-cell">Diperbarui</th>
                            <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                        {pages.map((page) => {
                            const url = publicUrl(page.slug);
                            return (
                                <tr key={page.id} className="hover:bg-navy/5">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2.5">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-tech-blue/10 text-tech-blue">
                                                <FileText className="h-4 w-4" />
                                            </span>
                                            <div>
                                                <p className="font-semibold text-navy">{page.title}</p>
                                                <p className="text-[11px] text-body-text">{page.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden px-4 py-4 text-xs text-body-text sm:table-cell">
                                        {url ? (
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex max-w-[220px] items-center gap-1 break-all font-medium text-tech-blue hover:underline"
                                            >
                                                {url}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span
                                            className={
                                                page.is_published
                                                    ? "badge badge-success"
                                                    : "badge badge-neutral"
                                            }
                                        >
                                            {page.is_published ? "Tayang" : "Draft"}
                                        </span>
                                    </td>
                                    <td className="hidden px-4 py-4 text-xs text-body-text md:table-cell">
                                        {formatDate(page.updated_at)}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <Link
                                            href={route("admin.pages.edit", page.id)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-border-soft px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-navy/5"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                        {pages.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-xs text-body-text">
                                    Belum ada halaman yang bisa dikelola.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
