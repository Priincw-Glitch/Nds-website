import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

export interface ToastOptions {
    title: string;
    description?: string;
    variant?: ToastVariant;
    /** Milidetik sebelum toast menutup sendiri. Default 6,5 detik (error 9 detik). */
    duration?: number;
}

interface ToastRecord {
    id: number;
    title: string;
    description?: string;
    variant: ToastVariant;
    duration: number;
}

interface ToastApi {
    show: (options: ToastOptions) => number;
    dismiss: (id: number) => void;
}

const MAX_VISIBLE = 3;

// Kurva masuk/keluar yang sama dengan transisi komponen lain di situs ini.
const TOAST_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Ikon dan warna mengikuti status yang dibawa pesan: hijau untuk berhasil,
// merah crimson untuk gagal, biru tech untuk informasi netral.
const VARIANTS: Record<
    ToastVariant,
    { icon: typeof CheckCircle2; iconClass: string; iconWrapClass: string }
> = {
    success: {
        icon: CheckCircle2,
        iconClass: "text-success",
        iconWrapClass: "bg-success/10",
    },
    error: {
        icon: AlertCircle,
        iconClass: "text-crimson",
        iconWrapClass: "bg-crimson/10",
    },
    info: {
        icon: Info,
        iconClass: "text-tech-blue",
        iconWrapClass: "bg-tech-blue/10",
    },
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast harus dipakai di dalam ToastProvider.");
    }
    return context;
}

function ToastCard({
    toast,
    onDismiss,
}: {
    toast: ToastRecord;
    onDismiss: (id: number) => void;
}) {
    const [paused, setPaused] = useState(false);
    const { icon: Icon, iconClass, iconWrapClass } = VARIANTS[toast.variant];

    // Timer berhenti selama kursor atau fokus keyboard berada di dalam toast,
    // supaya pesan tidak hilang sebelum sempat dibaca.
    useEffect(() => {
        if (paused) return;
        const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration);
        return () => window.clearTimeout(timer);
    }, [paused, toast.id, toast.duration, onDismiss]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: TOAST_EASE }}
            role={toast.variant === "error" ? "alert" : "status"}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border-soft bg-white p-4 shadow-[0_20px_45px_-28px_rgba(16,38,74,0.55)]"
        >
            <span
                className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    iconWrapClass,
                )}
            >
                <Icon className={cn("h-[18px] w-[18px]", iconClass)} aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy">{toast.title}</p>
                {toast.description && (
                    <p className="mt-0.5 text-sm leading-relaxed text-body-text break-words">
                        {toast.description}
                    </p>
                )}
            </div>

            <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Tutup notifikasi"
                className="relative -mr-1 -mt-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-body-text/70 transition-colors after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] hover:bg-light-gray hover:text-navy focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:ring-offset-2 focus-visible:outline-none"
            >
                <X className="h-4 w-4" aria-hidden="true" />
            </button>
        </motion.div>
    );
}

function ToastViewport({
    toasts,
    onDismiss,
}: {
    toasts: ToastRecord[];
    onDismiss: (id: number) => void;
}) {
    // Di mobile toast turun ke bawah header (64px) agar tidak menutupi tombol
    // menu; di desktop menetap di kanan atas, di bawah navbar.
    return (
        <div className="pointer-events-none fixed inset-x-4 top-[4.75rem] z-[90] flex flex-col gap-2.5 sm:inset-x-auto sm:right-6 sm:top-24 sm:w-[22.5rem]">
            <AnimatePresence initial={false}>
                {toasts.map((toast) => (
                    <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
                ))}
            </AnimatePresence>
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastRecord[]>([]);
    const nextId = useRef(0);

    const dismiss = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const show = useCallback((options: ToastOptions) => {
        nextId.current += 1;
        const variant = options.variant ?? "info";
        const record: ToastRecord = {
            id: nextId.current,
            title: options.title,
            description: options.description,
            variant,
            duration: options.duration ?? (variant === "error" ? 9000 : 6500),
        };

        setToasts((current) => [...current, record].slice(-MAX_VISIBLE));
        return record.id;
    }, []);

    const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            {createPortal(
                <ToastViewport toasts={toasts} onDismiss={dismiss} />,
                document.body,
            )}
        </ToastContext.Provider>
    );
}
