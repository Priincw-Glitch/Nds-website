import { Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import { Home, MessageSquare, ArrowLeft } from "lucide-react";
import { Seo } from "@/Components/Seo";
import { Button } from "@/Components/ui/button";
import { withFrontendLayout } from "@/utils/layout";

function NotFound() {
    return (
        <>
            <Seo title="404 — Halaman Tidak Ditemukan" description="Halaman yang Anda tuju tidak tersedia atau telah dipindahkan." noindex />

            <section className="flex min-h-[72vh] items-center justify-center bg-light-gray py-24">
                <div className="container-nds max-w-xl text-center">
                    <div className="rounded-2xl border border-border-soft bg-white p-8 sm:p-12 shadow-subtle">
                        <h1 className="text-2xl font-bold text-navy sm:text-3xl tracking-tight">
                            Halaman Tidak Ditemukan
                        </h1>
                        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-body-text">
                            Tautan yang Anda tuju mungkin salah ketik, telah diperbarui, atau halaman sudah tidak aktif di sistem kami.
                        </p>

                        <div className="mt-8 flex flex-wrap justify-center gap-3.5">
                            <Button asChild variant="primary" size="default" className="font-bold">
                                <Link href={route("home")}>
                                    <Home className="h-4 w-4" />
                                    <span>Kembali ke Beranda</span>
                                </Link>
                            </Button>
                            <Button asChild variant="secondary" size="default" className="font-semibold">
                                <Link href={route("contact")}>
                                    <MessageSquare className="h-4 w-4" />
                                    <span>Pusat Bantuan & Kontak</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default withFrontendLayout(NotFound);
