import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
    plugins: [
        laravel({
            input: "resources/js/app.tsx",
            refresh: true,
        }),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "resources/js"),
        },
    },
    build: {
        rollupOptions: {
            onwarn(warning, warn) {
                if (
                    warning.code === "MODULE_LEVEL_DIRECTIVE" &&
                    warning.message.includes('"use client"')
                ) {
                    return;
                }
                warn(warning);
            },
        },
    },
});
