/* eslint-disable @typescript-eslint/no-explicit-any */
import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: any;
    }
}

window.Pusher = Pusher;

/**
 * Reverb lokal berjalan di HTTP (ws). Transports diikat ke scheme yang dikonfigurasi
 * agar klien tidak pernah mencoba wss:// ke server HTTP lokal (CSP menolaknya),
 * dan disableStats menonaktifkan beacon stats.pusher.com yang tak terpakai.
 */
const isSecure = (import.meta.env.VITE_REVERB_SCHEME ?? "http") === "https";
const reverbPort = Number(import.meta.env.VITE_REVERB_PORT ?? 8080);
const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;

// Tanpa app key (mis. build tanpa env Reverb) Echo tidak bisa dibuat dan
// pusher-js akan melempar error. Lewati inisialisasi agar halaman tetap jalan
// tanpa realtime, bukan gagal render.
if (reverbKey) {
    try {
        window.Echo = new Echo({
            broadcaster: "reverb",
            key: reverbKey,
            wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
            wsPort: reverbPort,
            wssPort: reverbPort,
            forceTLS: isSecure,
            enabledTransports: [isSecure ? "wss" : "ws"],
            disableStats: true,
        });
    } catch (error) {
        console.warn("[Echo] Gagal menginisialisasi koneksi realtime.", error);
    }
}
