import { ArrowRight } from "lucide-react";
import { Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import type { ServiceItem } from "@/types";
import { ServiceIcon } from "./ServiceIcon";

// Kartu layanan untuk grid "Layanan Kami" di Beranda: ikon per jenis layanan
// dari data Admin (service.icon), nama, dan deskripsi singkat. Seluruh kartu
// satu tautan ke halaman detail layanan; gambar layanan tetap hidup di halaman
// Daftar dan Detail Layanan yang dipakai komponen ServiceCard.
interface ServiceIconCardProps {
    service: ServiceItem;
}

export function ServiceIconCard({ service }: ServiceIconCardProps) {
    const hasDescription = (service.short_description ?? "").trim() !== "";

    return (
        <Link
            href={route("services.show", service.slug)}
            aria-label={`Lihat detail layanan ${service.name}`}
            className="group flex h-full flex-col rounded-xl border border-border-soft bg-white p-6 shadow-subtle transition-all duration-300 hover:-translate-y-1 hover:border-tech-blue/40 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
            <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-tech-blue/20 bg-tech-blue/10 text-tech-blue transition-colors duration-300 group-hover:border-tech-blue/40">
                <ServiceIcon name={service.icon} className="h-6 w-6" />
            </span>

            <h3 className="mt-5 text-lg font-bold tracking-tight text-navy">{service.name}</h3>
            {hasDescription && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-body-text">
                    {service.short_description}
                </p>
            )}

            <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-tech-blue">
                Lihat Detail
                <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                />
            </span>
        </Link>
    );
}
