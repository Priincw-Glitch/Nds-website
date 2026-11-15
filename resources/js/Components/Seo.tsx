import { Head, usePage } from "@inertiajs/react";
import type { CompanySettings } from "@/types";

interface SeoProps {
    title?: string | null;
    description?: string | null;
    url?: string;
    image?: string | null;
    type?: string;
    noindex?: boolean;
}

export function Seo({ title, description, url, image, type = "website", noindex }: SeoProps) {
    // Nama situs dan metadata default dibaca dari Pengaturan Situs (Admin Panel),
    // jadi perubahan admin langsung terpakai di semua halaman publik.
    const { settings } = usePage().props as { settings?: CompanySettings };
    const siteName = settings?.company_name?.trim() || "Nusantara Digital Solution";
    const defaultTitle = settings?.seo_title?.trim() || siteName;
    const fullTitle = title ? `${title} | ${siteName}` : defaultTitle;
    const desc =
        description ||
        settings?.seo_description?.trim() ||
        "Solusi teknologi terintegrasi: web development, software application, management network, IT consultant, server management, dan CCTV.";

    return (
        <Head>
            <title>{fullTitle}</title>
            <meta name="description" content={desc} />
            {noindex && <meta name="robots" content="noindex, nofollow" />}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={desc} />
            <meta property="og:site_name" content={siteName} />
            {url && <meta property="og:url" content={url} />}
            {image && <meta property="og:image" content={image} />}
            <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={desc} />
            <link rel="canonical" href={url || (typeof window !== "undefined" ? window.location.href : undefined)} />
        </Head>
    );
}
