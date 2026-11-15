import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

type BoundaryProps = { children: ReactNode };
type BoundaryState = { error: Error | null };

/**
 * Jaring pengaman tingkat render: menangkap error saat React merender
 * subtree Inertia lalu menampilkan fallback bertema NDS, bukan layar putih.
 * Error yang muncul di luar fase render (mis. dari useEffect) bisa melepas
 * seluruh root sehingga boundary ikut terlepas; kasus itu ditangani
 * recoverFromUncaughtError yang dipasang pada opsi root di app.tsx.
 */
export class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
    state: BoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): BoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("[NDS] Error render ditangkap ErrorBoundary:", error, info.componentStack);
    }

    render() {
        if (!this.state.error) {
            return this.props.children;
        }
        return <ErrorFallback message={this.state.error.message} />;
    }
}

function ErrorFallback({ message }: { message: string }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-light-gray p-6">
            <div className="w-full max-w-md rounded-2xl border border-border-soft bg-white p-8 text-center shadow-card">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                    <AlertCircle className="h-6 w-6 text-crimson" />
                </div>
                <h1 className="text-lg font-bold text-navy">Terjadi kesalahan pada halaman ini</h1>
                <p className="mt-2 text-sm text-body-text">
                    Tampilan gagal dimuat sepenuhnya. Muat ulang halaman untuk mencoba lagi, atau kembali ke Beranda.
                </p>
                {import.meta.env.DEV && (
                    <details className="mt-4 rounded-lg border border-border-soft bg-light-gray/60 p-3 text-left">
                        <summary className="cursor-pointer text-xs font-semibold text-navy">
                            Detail error (development)
                        </summary>
                        <pre className="mt-2 overflow-x-auto text-[11px] leading-relaxed text-body-text">{message}</pre>
                    </details>
                )}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <button type="button" onClick={() => window.location.reload()} className="btn-primary text-sm">
                        Muat ulang halaman
                    </button>
                    <a
                        href="/"
                        className="rounded-lg border border-border-soft bg-white px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy/5"
                    >
                        Ke Beranda
                    </a>
                </div>
            </div>
        </div>
    );
}

/**
 * Lapis terakhir untuk error yang membuat React 19 melepas seluruh root
 * (boundary ikut terlepas sehingga tidak ada React yang bisa merender).
 * Panel pemulihan dipasang langsung lewat DOM agar pengguna tidak pernah
 * berhadapan dengan layar putih kosong.
 */
export function recoverFromUncaughtError(error: unknown): void {
    console.error("[NDS] Error tidak tertangkap, root dilepas React:", error);

    const container = document.getElementById("app");
    if (!container || container.childElementCount > 0 || container.querySelector("[data-nds-recovery]")) {
        // UI masih ada (error hanya tercatat) atau panel pemulihan sudah terpasang.
        return;
    }

    const overlay = document.createElement("div");
    overlay.className = "flex min-h-screen items-center justify-center bg-light-gray p-6";
    overlay.setAttribute("data-nds-recovery", "");

    const card = document.createElement("div");
    card.className = "w-full max-w-md rounded-2xl border border-border-soft bg-white p-8 text-center shadow-card";

    const title = document.createElement("h1");
    title.className = "text-lg font-bold text-navy";
    title.textContent = "Halaman ini mengalami kesalahan tak terduga";

    const text = document.createElement("p");
    text.className = "mt-2 text-sm text-body-text";
    text.textContent = "Muat ulang halaman untuk melanjutkan, atau kembali ke Beranda.";

    const actions = document.createElement("div");
    actions.className = "mt-6 flex flex-wrap items-center justify-center gap-2";

    const reload = document.createElement("button");
    reload.type = "button";
    reload.className = "btn-primary text-sm";
    reload.textContent = "Muat ulang halaman";
    reload.addEventListener("click", () => window.location.reload());

    const home = document.createElement("a");
    home.href = "/";
    home.className =
        "rounded-lg border border-border-soft bg-white px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy/5";
    home.textContent = "Ke Beranda";

    if (import.meta.env.DEV && error instanceof Error) {
        const details = document.createElement("details");
        details.className = "mt-4 rounded-lg border border-border-soft bg-light-gray/60 p-3 text-left";
        const summary = document.createElement("summary");
        summary.className = "cursor-pointer text-xs font-semibold text-navy";
        summary.textContent = "Detail error (development)";
        const pre = document.createElement("pre");
        pre.className = "mt-2 overflow-x-auto text-[11px] leading-relaxed text-body-text";
        pre.textContent = error.stack || error.message;
        details.append(summary, pre);
        card.append(details);
    }

    actions.append(reload, home);
    card.append(title, text, actions);
    overlay.append(card);
    container.append(overlay);
}
