import "../css/app.css";
import "./echo";
import type { ComponentType } from "react";
import { createInertiaApp, type ResolvedComponent } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { ErrorBoundary, recoverFromUncaughtError } from "@/Components/ErrorBoundary";

const appName = import.meta.env.VITE_APP_NAME || "NDS";

createInertiaApp({
    title: (title) => (title ? `${title} | ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent<ResolvedComponent>(
            `./Pages/${name}.tsx`,
            import.meta.glob<ResolvedComponent>("./Pages/**/*.tsx"),
        ),
    setup({ el, App, props }: { el: HTMLElement | null; App: ComponentType<any>; props: any }) {
        // onUncaughtError ada di runtime React 19; @types masih v18 sehingga
        // opsi root di-cast ke tanda tangan createRoot.
        createRoot(el!, {
            onUncaughtError: (error: unknown) => recoverFromUncaughtError(error),
        } as Parameters<typeof createRoot>[1]).render(
            <ErrorBoundary>
                <App {...props} />
            </ErrorBoundary>,
        );
    },
    progress: {
        color: "#1677d2",
        showSpinner: false,
    },
});
