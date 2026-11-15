import { Head, Link, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { ArrowLeft, Mail, Phone, CalendarDays, CheckCircle, Clock, MessageSquare, AlertCircle } from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";
import { DeleteButton } from "@/Components/admin/DeleteButton";
import type { ContactMessageItem } from "@/types";

export default function MessageShow({ message }: { message: ContactMessageItem }) {
    const setStatus = (status: string) => {
        router.patch(route("admin.messages.contacts.update", message.id), { status }, { preserveScroll: true });
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case "unread":
                return <span className="badge badge-danger">Belum Dibaca</span>;
            case "read":
                return <span className="badge badge-warning">Sudah Dibaca</span>;
            case "replied":
                return <span className="badge badge-success">Sudah Dibalas</span>;
            default:
                return <span className="badge badge-neutral">{status}</span>;
        }
    };

    return (
        <AdminLayout title="Detail Pesan">
            <Head title={`Pesan dari ${message.name} | NDS Admin`} />

            <div className="mb-6 flex items-center justify-between">
                <Link
                    href={route("admin.messages.contacts.index")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-tech-blue hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Kembali ke Kotak Masuk</span>
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Message Content */}
                <div className="rounded-2xl border border-border-soft bg-white p-6 sm:p-8 lg:col-span-2 shadow-subtle">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-soft pb-5">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-body-text">Subjek</span>
                                {message.source === "tawk" && (
                                    <span className="badge badge-secondary text-[11px]">
                                        <MessageSquare className="h-3 w-3" />
                                        Live Chat Tawk.to
                                    </span>
                                )}
                            </div>
                            <h2 className="mt-1 text-xl font-bold text-navy sm:text-2xl">
                                {message.subject || "(Tanpa Subjek)"}
                            </h2>
                        </div>
                        <div>{renderStatusBadge(message.status)}</div>
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy/5 text-sm font-bold text-navy uppercase">
                            {message.name.slice(0, 2)}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-navy">{message.name}</p>
                            <p className="text-xs text-body-text">
                                <a href={`mailto:${message.email}`} className="text-tech-blue hover:underline">
                                    {message.email}
                                </a>
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 rounded-xl border border-border-soft bg-light-gray/70 p-5 sm:p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-body-text/70 mb-3">Isi Pesan:</p>
                        <div className="whitespace-pre-line text-sm leading-relaxed text-body-dark font-normal">
                            {message.message}
                        </div>
                    </div>

                    {/* Quick Response Actions */}
                    <div className="mt-6 flex flex-wrap gap-2.5">
                        <a
                            href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject || "Konsultasi Layanan NDS")}`}
                            className="btn-primary py-2 text-xs"
                        >
                            <Mail className="h-3.5 w-3.5" />
                            <span>Balas via Email</span>
                        </a>
                        {message.phone && (
                            <a href={`tel:${message.phone}`} className="btn-secondary py-2 text-xs">
                                <Phone className="h-3.5 w-3.5" />
                                <span>Hubungi Telepon ({message.phone})</span>
                            </a>
                        )}
                    </div>
                </div>

                {/* Sender & Status Sidebar */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <h3 className="text-sm font-bold text-navy border-b border-border-soft pb-3">Informasi Kontak</h3>
                        <dl className="mt-4 space-y-3.5 text-xs">
                            <div>
                                <dt className="text-body-text font-medium">Nama Lengkap</dt>
                                <dd className="mt-0.5 text-sm font-semibold text-navy">{message.name}</dd>
                            </div>
                            <div>
                                <dt className="text-body-text font-medium">Alamat Email</dt>
                                <dd className="mt-0.5 font-medium text-navy break-all">{message.email}</dd>
                            </div>
                            <div>
                                <dt className="text-body-text font-medium">Nomor Telepon</dt>
                                <dd className="mt-0.5 font-medium text-navy">{message.phone || "Tidak dicantumkan"}</dd>
                            </div>
                            <div>
                                <dt className="text-body-text font-medium">Waktu Dikirim</dt>
                                <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-navy">
                                    <CalendarDays className="h-3.5 w-3.5 text-body-text/60" />
                                    <span>{new Date(message.created_at).toLocaleString("id-ID")}</span>
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <h3 className="text-sm font-bold text-navy border-b border-border-soft pb-3">Ubah Status Tindak Lanjut</h3>
                        <div className="mt-4 flex flex-col gap-2">
                            {(["unread", "read", "replied"] as const).map((s) => {
                                const active = message.status === s;
                                return (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setStatus(s)}
                                        className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-all ${
                                            active
                                                ? "bg-navy text-white shadow-xs"
                                                : "border border-border-soft bg-white text-navy hover:bg-navy/5"
                                        }`}
                                    >
                                        <span>
                                            {s === "unread" ? "Tandai Belum Dibaca" : s === "read" ? "Tandai Sudah Dibaca" : "Tandai Sudah Dibalas"}
                                        </span>
                                        {active && <CheckCircle className="h-4 w-4" />}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-6 border-t border-border-soft pt-4">
                            <DeleteButton
                                action={route("admin.messages.contacts.destroy", message.id)}
                                label={`pesan dari ${message.name}`}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
