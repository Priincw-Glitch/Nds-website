import { useState } from "react";
import { router } from "@inertiajs/react";
import { Trash2, AlertTriangle, X } from "lucide-react";

export function DeleteButton({
    action,
    label = "item ini",
}: {
    action: string;
    label?: string;
}) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const confirm = () => {
        setIsDeleting(true);
        router.delete(action, {
            onSuccess: () => {
                setOpen(false);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
            preserveScroll: true,
        });
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/10 hover:border-red-300"
                title={`Hapus ${label}`}
            >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Hapus</span>
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-xs"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-dialog-title"
                >
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-border-soft">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h3 id="delete-dialog-title" className="text-base font-bold text-navy">
                                    Konfirmasi Hapus
                                </h3>
                                <p className="mt-1 text-sm text-body-text">
                                    Apakah Anda yakin ingin menghapus <strong className="text-navy">{label}</strong>? Tindakan ini tidak dapat dibatalkan.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => !isDeleting && setOpen(false)}
                                className="text-body-text hover:text-navy rounded-md p-1"
                                aria-label="Tutup dialog"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-6 flex justify-end gap-2.5">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setOpen(false)}
                                className="btn-secondary py-2 text-xs"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={confirm}
                                className="btn-danger py-2 text-xs"
                            >
                                {isDeleting ? "Menghapus..." : "Ya, Hapus Sekarang"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
