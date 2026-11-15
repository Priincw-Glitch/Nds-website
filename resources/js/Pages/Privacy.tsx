import { Seo } from "@/Components/Seo";
import { withFrontendLayout } from "@/utils/layout";
import { Calendar } from "lucide-react";
import { Spotlight } from "@/Components/ui/Spotlight";
import { storageUrl, assetUrl } from "@/utils/assets";

interface PageContent {
    slug: string;
    title: string;
    hero_title?: string | null;
    hero_description?: string | null;
    content?: string | null;
    image?: string | null;
    updated_at?: string | null;
}

// Dipakai bila halaman belum tersedia di database (mis. migrasi belum dijalankan).
const fallbackSections = [
    {
        title: "1. Informasi yang Kami Kumpulkan",
        body: "Kami mengumpulkan informasi yang Anda berikan secara sukarela saat mengisi formulir konsultasi atau komunikasi di website ini, seperti nama lengkap, alamat email, nomor telepon, dan uraian kebutuhan proyek.",
    },
    {
        title: "2. Pemanfaatan Data",
        body: "Informasi yang dikumpulkan hanya digunakan untuk merespons permintaan konsultasi, memberikan estimasi solusi teknologi, dan meningkatkan mutu layanan Nusantara Digital Solution. Kami tidak memperjualbelikan atau mendistribusikan data kontak kepada pihak ketiga untuk kepentingan komersial tanpa persetujuan Anda.",
    },
    {
        title: "3. Keamanan & Penyimpanan",
        body: "Data pesan dan korespondensi disimpan di infrastruktur server yang aman dan hanya dapat diakses oleh personel yang berwenang demi menjaga integritas dan kerahasiaan informasi Anda.",
    },
    {
        title: "4. Penggunaan Cookie & Analitik",
        body: "Website kami dapat menggunakan cookie esensial dan metrik anonim semata-mata untuk mengoptimalkan navigasi, kecepatan muat halaman, dan fungsionalitas teknis antarmuka pengguna.",
    },
    {
        title: "5. Hak Pengguna atas Data",
        body: "Anda berhak sewaktu-waktu meminta konfirmasi mengenai data yang tersimpan atau meminta pembaruan serta penghapusan riwayat data Anda dengan menghubungi tim kami melalui kanal Hubungi Kami.",
    },
    {
        title: "6. Pembaruan Kebijakan Privasi",
        body: "Kebijakan privasi ini dapat disesuaikan secara berkala untuk mencerminkan kepatuhan regulasi atau perubahan layanan. Perubahan akan segera ditampilkan pada halaman ini.",
    },
];

function splitSections(html: string): string[] {
    return html
        .split(/<hr\s*\/?>/i)
        .map((part) => part.trim())
        .filter(Boolean);
}

function reviewedLabel(updatedAt?: string | null): string {
    if (!updatedAt) return "Oktober 2026";
    const date = new Date(updatedAt);
    if (Number.isNaN(date.getTime())) return "Oktober 2026";
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function Privacy({ page }: { page?: PageContent | null }) {
    const sections = page?.content
        ? splitSections(page.content)
        : fallbackSections.map((s) => `<h2>${s.title}</h2><p>${s.body}</p>`);

    return (
        <>
            <Seo
                title={page?.title || "Kebijakan Privasi"}
                description={
                    page?.hero_description ||
                    "Kebijakan privasi dan standar perlindungan data pengguna di website resmi Nusantara Digital Solution."
                }
            />

            {/* Hero */}
            <section className="relative overflow-hidden bg-navy pt-24 pb-18 sm:pt-28 sm:pb-20 lg:pt-28 lg:pb-28">
                <Spotlight className="-top-24 left-1/3" fill="#4da6f8" />
                <div className="container-nds relative z-10">
                    <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
                        <div>
                            <h1 className="heading-1 text-white! tracking-tight">
                                {page?.hero_title || page?.title || "Kebijakan Privasi"}
                            </h1>
                        </div>
                        <div>
                            <p className="max-w-md text-base leading-relaxed text-white/80 sm:text-lg">
                                {page?.hero_description ||
                                    "Nusantara Digital Solution menghargai dan berkomitmen menjaga kerahasiaan informasi yang Anda percayakan kepada kami saat menggunakan layanan dan situs web ini."}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Articles */}
            <section className="bg-light-gray py-16 lg:py-24">
                <div className="container-nds max-w-4xl">
                    {page?.image && (
                        <div className="mb-6 overflow-hidden rounded-2xl border border-border-soft bg-white">
                            <img
                                src={storageUrl(page.image)}
                                alt={page.title}
                                className="h-56 w-full object-cover sm:h-72"
                                loading="lazy"
                            />
                        </div>
                    )}

                    <div className="space-y-6">
                        {sections.map((section, index) => (
                            <div
                                key={index}
                                className="rounded-2xl border border-border-soft bg-white p-6 sm:p-8 shadow-subtle"
                            >
                                <div
                                    className="[&>h2]:text-base [&>h2]:font-bold [&>h2]:text-navy sm:[&>h2]:text-lg [&>p]:mt-3 [&>p]:text-sm [&>p]:leading-relaxed [&>p]:text-body-text sm:[&>p]:text-base"
                                    dangerouslySetInnerHTML={{ __html: section }}
                                />
                            </div>
                        ))}

                        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border-soft pt-6 text-xs text-body-text">
                            <span className="flex items-center gap-1.5 font-medium">
                                <Calendar className="h-3.5 w-3.5 text-tech-blue" />
                                <span>Terakhir ditinjau dan diperbarui: {reviewedLabel(page?.updated_at)}</span>
                            </span>
                            <span className="font-semibold text-navy">Nusantara Digital Solution</span>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default withFrontendLayout(Privacy);
