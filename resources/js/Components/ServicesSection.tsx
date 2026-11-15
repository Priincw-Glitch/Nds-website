import { ServiceIconCard } from "./ServiceIconCard";
import type { ServiceItem } from "@/types";

interface ServicesSectionProps {
    services: ServiceItem[];
}

export function ServicesSection({ services }: ServicesSectionProps) {
    // Enam layanan pertama sesuai sort_order dari Admin Panel; teks kartu
    // langsung dari data (icon, short_description) — bukan konten dummy.
    const displayServices = services.slice(0, 6);

    return (
        <section id="services" className="relative overflow-hidden bg-off-white py-20 lg:py-28">
            <div className="container-nds">
                {/* Header: label, judul, dan satu kalimat deskripsi — kiri */}
                <div className="gsap-reveal max-w-2xl">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-tech-blue">
                        Layanan Kami
                    </p>
                    <h2 className="heading-2 mt-4 text-balance">
                        Solusi Teknologi untuk Kebutuhan Bisnis Anda
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-body-text sm:text-lg">
                        Dari website dan aplikasi bisnis hingga jaringan, server, dan keamanan —
                        layanan inti NDS menjaga teknologi Anda tetap berjalan dan siap tumbuh.
                    </p>
                </div>

                {/* Grid 1 → 2 → 3 kolom mengikuti lebar layar. Grid ini menjadi
                    penutup section: jarak bawah mengikuti padding section. */}
                <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-6">
                    {displayServices.map((service) => (
                        <ServiceIconCard key={service.id} service={service} />
                    ))}
                </div>
            </div>
        </section>
    );
}
