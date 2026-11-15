import { Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import { ServiceIcon } from "./ServiceIcon";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { storageUrl, assetUrl } from "@/utils/assets";
import type { ServiceItem } from "@/types";

type LayoutSize = 'large' | 'wide' | 'tall' | 'small';

interface ServiceCardProps {
    service: ServiceItem;
    layoutSize?: LayoutSize;
    className?: string;
}

// Gambar cadangan per jenis layanan di public/images/services/ (bukan pengganti
// upload admin; hanya dipakai kalau gambar upload gagal dimuat atau kosong).
export const PLACEHOLDER_IMAGES: Record<string, string | undefined> = {
    'web-development': assetUrl("images/services/web-development.jpg"),
    'software-application': assetUrl("images/services/software-application.jpg"),
    'management-network': assetUrl("images/services/management-network.jpg"),
    'it-consultant': assetUrl("images/services/it-consultant.jpg"),
    'server-management': assetUrl("images/services/server-management.jpg"),
    'cctv': assetUrl("images/services/cctv.jpg"),
    'default': assetUrl("images/services/default.jpg"),
};

// Skala teks, padding, dan ikon per ukuran kartu agar proporsional di setiap slot.
const VARIANTS: Record<LayoutSize, {
    root: string;
    pad: string;
    title: string;
    desc: string;
    iconCircle: string;
    iconGlyph: string;
    arrowCircle: string;
}> = {
    large: {
        root: 'min-h-[260px]',
        pad: 'p-5 lg:p-7',
        title: 'text-xl lg:text-2xl',
        desc: 'text-sm lg:text-base line-clamp-4',
        iconCircle: 'h-12 w-12 lg:h-14 lg:w-14',
        iconGlyph: 'h-6 w-6',
        arrowCircle: 'h-11 w-11',
    },
    wide: {
        root: 'min-h-[240px]',
        pad: 'p-5 lg:p-6',
        title: 'text-lg lg:text-xl',
        desc: 'text-xs lg:text-sm line-clamp-3',
        iconCircle: 'h-11 w-11',
        iconGlyph: 'h-5 w-5',
        arrowCircle: 'h-10 w-10',
    },
    tall: {
        root: 'min-h-[300px]',
        pad: 'p-5',
        title: 'text-lg lg:text-xl',
        desc: 'text-xs lg:text-sm line-clamp-5',
        iconCircle: 'h-11 w-11',
        iconGlyph: 'h-5 w-5',
        arrowCircle: 'h-10 w-10',
    },
    small: {
        root: 'min-h-[220px]',
        pad: 'p-4 lg:p-5',
        title: 'text-base lg:text-lg',
        desc: 'text-xs lg:text-sm line-clamp-2',
        iconCircle: 'h-10 w-10',
        iconGlyph: 'h-5 w-5',
        arrowCircle: 'h-9 w-9',
    },
};

// Alias gambar berdasarkan slug/nama layanan.
export function getPlaceholderKey(service: ServiceItem): string {
    const slug = (service.slug || '').toLowerCase();
    const name = (service.name || '').toLowerCase();

    if (slug.includes('web-development') || name.includes('web development')) return 'web-development';
    if (slug.includes('software-application') || name.includes('software application')) return 'software-application';
    if (slug.includes('management-network') || name.includes('management network')) return 'management-network';
    if (slug.includes('it-consultant') || name.includes('it consultant')) return 'it-consultant';
    if (slug.includes('server-management') || name.includes('server management')) return 'server-management';
    if (slug.includes('cctv') || name.includes('cctv')) return 'cctv';
    return 'default';
}

export function ServiceCard({ service, layoutSize = 'small', className = '' }: ServiceCardProps) {
    const [useFallback, setUseFallback] = useState(false);
    const variant = VARIANTS[layoutSize];

    // Rantai fallback: gambar upload admin -> gambar per jenis layanan -> default.
    const uploadedUrl = (() => {
        const image = service.image?.trim();
        if (!image) return null;
        if (/^https?:\/\//i.test(image) || image.startsWith('/')) return image;
        return storageUrl(image);
    })();
    const placeholder = PLACEHOLDER_IMAGES[getPlaceholderKey(service)];

    const src = useFallback
        ? PLACEHOLDER_IMAGES.default
        : (uploadedUrl ?? placeholder);

    const handleImageError = () => {
        // Gambar utama gagal dimuat -> jatuh ke gambar default.
        setUseFallback(true);
    };

    return (
        <Link
            href={route("services.show", service.slug)}
            className={`group relative flex h-full flex-col justify-end overflow-hidden rounded-[18px] border border-navy/10 bg-navy shadow-card transition-shadow duration-300 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white ${variant.root} ${className}`}
            aria-label={`Lihat detail layanan ${service.name}`}
        >
            {/* Gambar memenuhi seluruh area kartu */}
            <img
                src={src}
                alt=""
                aria-hidden="true"
                loading="lazy"
                onError={handleImageError}
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
            />

            {/* Overlay navy dari bawah ke atas agar teks selalu terbaca */}
            <div className="absolute inset-0 bg-gradient-to-t from-deep-navy/95 via-navy/55 to-transparent opacity-95 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Ikon layanan di kanan atas dalam lingkaran glass */}
            <div className={`absolute right-3 top-3 z-10 flex items-center justify-center rounded-full border border-white/40 bg-white/85 shadow-md backdrop-blur-sm transition-transform duration-300 group-hover:scale-105 ${variant.iconCircle}`}>
                <ServiceIcon name={service.icon || "Code2"} className={variant.iconGlyph + " text-navy"} />
            </div>

            {/* Nama, deskripsi, dan tombol panah menempel di bagian bawah kartu */}
            <div className={`relative z-10 flex w-full items-end justify-between gap-3 ${variant.pad}`}>
                <div className="min-w-0">
                    <h3 className={`${variant.title} font-bold text-white`}>
                        {service.name}
                    </h3>
                    {(service.short_description || "").trim() !== "" && (
                        <p className={`${variant.desc} mt-1.5 leading-relaxed text-white/85`}>
                            {service.short_description}
                        </p>
                    )}
                </div>

                {/* Panah: penunjuk arah ke halaman detail, bukan tombol
                    terpisah, jadi seluruh kartu tetap satu kontrol yang benar. */}
                <span
                    aria-hidden="true"
                    className={`flex shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/90 text-electric-blue shadow-md backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-white ${variant.arrowCircle}`}
                >
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
            </div>
        </Link>
    );
}
