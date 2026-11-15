import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { usePage } from "@inertiajs/react";
import { Navbar } from "@/Components/Navbar";
import { ToastProvider, useToast } from "@/Components/ui/toast";
import { Footer } from "@/Components/Footer";
import { TawkWidget } from "@/Components/TawkWidget";
import { PromoPopup } from "@/Components/PromoPopup";
import { useGsapReveal } from "@/hooks/useGsap";
import { useLenis } from "@/hooks/useLenis";
import { useSettingsListener } from "@/hooks/useSettingsListener";

// Pesan flash dari backend tampil sebagai toast. Toast hanya muncul setelah
// server benar-benar menyimpan data dan mengirim flash pada respons redirect.
function FlashToasts() {
    const { flash } = usePage().props as {
        flash?: { success?: string | null; error?: string | null };
    };
    const { show } = useToast();
    const lastShown = useRef("");

    useEffect(() => {
        const success = flash?.success?.trim();
        const error = flash?.error?.trim();

        if (!success && !error) {
            lastShown.current = "";
            return;
        }

        const signature = `${success ?? ""}|${error ?? ""}`;
        if (signature === lastShown.current) return;
        lastShown.current = signature;

        if (success) {
            show({ variant: "success", title: "Permintaan terkirim", description: success });
        }
        if (error) {
            show({ variant: "error", title: "Terjadi kesalahan", description: error });
        }
    }, [flash?.success, flash?.error, show]);

    return null;
}

export default function FrontendLayout({ children }: { children: ReactNode }) {
    useLenis();
    useGsapReveal();
    useSettingsListener();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }, []);

    // Scrollbar halaman disembunyikan di situs publik: tepi kanan section
    // gelap tampil bersih tanpa track terang. Class dilepas saat pindah ke
    // panel admin/customer agar di sana scrollbar tetap terlihat.
    useEffect(() => {
        document.documentElement.classList.add("hide-page-scrollbar");
        return () => {
            document.documentElement.classList.remove("hide-page-scrollbar");
        };
    }, []);

    return (
        <ToastProvider>
            <div className="flex min-h-screen flex-col bg-white text-body-text antialiased selection:bg-navy selection:text-white">
                <Navbar />
                <FlashToasts />
                {/* Navbar fixed overlay; konten hero mulai dari y=0 agar
                    navbar transparan selalu berada di atas background hero. */}
                <main className="flex-1">{children}</main>
                <Footer />
                <TawkWidget />
                {/* Satu popup promo otomatis; layout bertahan saat navigasi Inertia,
                    jadi popup tidak pernah dipasang ulang per halaman. */}
                <PromoPopup />
            </div>
        </ToastProvider>
    );
}
