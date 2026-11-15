import { useEffect } from "react";
import { usePage } from "@inertiajs/react";

const SCRIPT_ID = "nds-tawk-widget";
// ID Tawk.to dipakai menyusun URL embed; batasi ke karakter yang aman.
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

/**
 * Memuat widget Tawk.to hanya pada halaman yang merender komponen ini
 * (website publik dan portal pelanggan). Area admin tidak memuatnya.
 */
export function TawkWidget() {
    const settings = (usePage().props as unknown as { settings?: Record<string, string | null> }).settings;
    const enabled = settings?.tawk_enabled === "1";
    const propertyId = (settings?.tawk_property_id ?? "").trim();
    const widgetId = (settings?.tawk_widget_id ?? "").trim();
    const configured =
        enabled && SAFE_ID.test(propertyId) && SAFE_ID.test(widgetId);

    useEffect(() => {
        if (!configured) return;

        if (!document.getElementById(SCRIPT_ID)) {
            const script = document.createElement("script");
            script.id = SCRIPT_ID;
            script.async = true;
            script.charset = "UTF-8";
            script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
            script.setAttribute("crossorigin", "*");
            document.body.appendChild(script);
        }

        return () => {
            // SPA: lepaskan lagi saat pindah ke area lain (mis. admin).
            const tawk = (window as unknown as { Tawk_API?: { hideWidget?: () => void } }).Tawk_API;
            try {
                tawk?.hideWidget?.();
            } catch {
                // Widget belum selesai dimuat; tidak perlu tindakan.
            }
            document.getElementById(SCRIPT_ID)?.remove();
        };
    }, [configured, propertyId, widgetId]);

    return null;
}
