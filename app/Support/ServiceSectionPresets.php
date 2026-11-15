<?php

namespace App\Support;

use App\Models\Service;

/**
 * Sumber section standar untuk halaman layanan.
 *
 * Dipakai oleh (1) migrasi data untuk mengisi service_sections dari konten
 * lama pada tabel services, dan (2) DatabaseSeeder untuk instalasi baru,
 * agar keduanya menghasilkan halaman yang sama.
 */
class ServiceSectionPresets
{
    /**
     * Section standar satu layanan. Bila layanan ber-slug web-development,
     * isi diambil dari halaman bespoke yang lama menjadi kode; layanan lain
     * diambil dari kolom konten lama (content/benefits/scope/workflow/faq).
     *
     * @return array<int, array<string, mixed>>
     */
    public static function forService(Service $service): array
    {
        return $service->slug === 'web-development'
            ? self::webDevelopment($service)
            : self::fromLegacyFields($service);
    }

    /**
     * Komposisi Web Development: transkrip halaman bespoke siap-siap menampung
     * Konten admin ke database, tidak membuat konten baru di luar yang sudah ada.
     *
     * @return array<int, array<string, mixed>>
     */
    private static function webDevelopment(Service $service): array
    {
        return [
            [
                'type' => 'image_text',
                'title' => 'Website yang Dirancang untuk Mengembangkan Bisnis Anda.',
                'description' => "Setiap bisnis membutuhkan kehadiran digital yang mampu merepresentasikan identitas, menjangkau pelanggan, dan mendukung aktivitas operasional.\n\nNDS menghadirkan solusi pengembangan website yang disesuaikan dengan kebutuhan dan tujuan bisnis, mulai dari website perusahaan hingga aplikasi berbasis web.",
                'layout_variant' => 'image_right',
                'payload' => ['show_image' => true],
                'image' => null, // pakai gambar layanan
                'sort_order' => 10,
            ],
            [
                'type' => 'feature_grid',
                'title' => 'Satu Layanan, Beragam Solusi Digital.',
                'description' => 'Jenis website dan web application yang dapat kami kembangkan.',
                'layout_variant' => 'numbered_rows',
                'payload' => [
                    'style' => 'rows',
                    'items' => [
                        ['title' => 'Website Perusahaan', 'description' => 'Website company profile profesional untuk memperkenalkan identitas, layanan, dan informasi bisnis.'],
                        ['title' => 'Landing Page', 'description' => 'Halaman digital untuk memperkenalkan produk, kampanye, promosi, dan meningkatkan peluang konversi.'],
                        ['title' => 'Web Application', 'description' => 'Aplikasi berbasis web untuk membantu pengelolaan data dan proses operasional bisnis.'],
                        ['title' => 'Portal dan Sistem Informasi', 'description' => 'Platform terpusat untuk pengelolaan informasi, pengguna, dan kebutuhan organisasi.'],
                        ['title' => 'Integrasi Sistem', 'description' => 'Integrasi API, layanan pihak ketiga, dan pengembangan fitur sesuai kebutuhan bisnis.'],
                    ],
                ],
                'sort_order' => 20,
            ],
            [
                'type' => 'feature_grid',
                'title' => 'Dibangun dengan Standar Pengembangan Modern.',
                'description' => null,
                'layout_variant' => 'columns',
                'payload' => [
                    'style' => 'columns',
                    'columns' => 5,
                    'items' => [
                        ['title' => 'Responsive Design', 'description' => 'Tampilan optimal di berbagai perangkat.', 'icon' => 'MonitorSmartphone'],
                        ['title' => 'High Performance', 'description' => 'Optimasi kecepatan dan efisiensi akses.', 'icon' => 'Gauge'],
                        ['title' => 'Security', 'description' => 'Memperhatikan keamanan aplikasi dan data.', 'icon' => 'ShieldCheck'],
                        ['title' => 'SEO-Friendly', 'description' => 'Struktur website yang mendukung mesin pencari.', 'icon' => 'Search'],
                        ['title' => 'Scalable Architecture', 'description' => 'Sistem yang siap dikembangkan mengikuti kebutuhan bisnis.', 'icon' => 'Layers'],
                    ],
                ],
                'sort_order' => 30,
            ],
            [
                'type' => 'process_timeline',
                'title' => 'Bagaimana Kami Mewujudkan Proyek Anda?',
                'description' => 'Lima tahap yang kami jalankan dari konsultasi awal sampai dukungan setelah website diluncurkan.',
                'layout_variant' => 'horizontal',
                'payload' => [
                    'orientation' => 'horizontal',
                    'steps' => [
                        ['title' => 'Konsultasi dan Analisis', 'description' => 'Memahami kebutuhan, tujuan, dan ruang lingkup proyek.'],
                        ['title' => 'Perencanaan dan Desain', 'description' => 'Menyusun struktur halaman, wireframe, dan desain antarmuka.'],
                        ['title' => 'Pengembangan', 'description' => 'Membangun front-end, back-end, database, serta integrasi sistem.'],
                        ['title' => 'Testing dan Quality Assurance', 'description' => 'Memastikan fungsi, responsivitas, keamanan, dan kualitas website.'],
                        ['title' => 'Peluncuran dan Dukungan', 'description' => 'Melakukan deployment, monitoring, dan dukungan teknis sesuai kesepakatan.'],
                    ],
                ],
                'sort_order' => 40,
            ],
            [
                'type' => 'benefit_list',
                'title' => 'Lebih dari Sekadar Website.',
                'description' => null,
                'layout_variant' => 'numbered_rows',
                'payload' => [
                    'style' => 'numbered_rows',
                    'items' => [
                        ['title' => 'Identitas Digital Profesional', 'description' => 'Memperkuat citra dan kredibilitas perusahaan melalui kehadiran digital yang terstruktur.'],
                        ['title' => 'Operasional Lebih Efisien', 'description' => 'Mendukung aktivitas bisnis melalui sistem digital yang sesuai kebutuhan.'],
                        ['title' => 'Siap Berkembang', 'description' => 'Fondasi website dan aplikasi yang dapat dikembangkan mengikuti pertumbuhan bisnis.'],
                    ],
                ],
                'sort_order' => 50,
            ],
            // FAQ diambil dari kolom faq layanan; jawaban masih kosong tampil di
            // admin untuk dilengkapi, tidak tampil di halaman publik.
            ...self::legacyFaqSection($service, 60),
            [
                'type' => 'cta_banner',
                'title' => 'Siap membangun website untuk bisnis Anda?',
                'description' => 'Diskusikan kebutuhan website Anda bersama konsultan NDS.',
                'layout_variant' => 'dark',
                'payload' => [
                    'cta_text' => 'Jadwalkan Diskusi',
                    'cta_url' => '/contact',
                    'secondary_cta_text' => 'Lihat Layanan Lain',
                    'secondary_cta_url' => '/services',
                ],
                'sort_order' => 70,
            ],
        ];
    }

    /**
     * Layanan selain Web Development: komposisi dan variasi variant dibuat
     * berbeda per layanan, sementara kontennya murni diambil dari kolom lama.
     *
     * @return array<int, array<string, mixed>>
     */
    private static function fromLegacyFields(Service $service): array
    {
        $benefits = self::listLines($service->benefits);
        $scope = self::listLines($service->scope);
        $workflow = self::listLines($service->workflow);
        $benefitItems = array_map(
            fn (string $line) => ['title' => $line],
            $benefits,
        );
        $scopeItems = array_map(
            fn (string $line) => ['title' => $line],
            $scope,
        );
        $workflowSteps = array_map(
            fn (string $line) => ['title' => $line],
            $workflow,
        );

        // Tiap layanan memakai urutan dan variant komposisi yang berbeda;
        // kontennya tetap identik dengan kolom content/benefits/scope/workflow.
        $plans = [
            'software-application' => [
                'image_variant' => 'image_right',
                'benefit_style' => 'columns',
                'benefit_variant' => 'columns',
                'scope_variant' => 'numbered_rows',
            ],
            'management-network' => [
                'image_variant' => 'image_left',
                'benefit_style' => 'compact_cards',
                'benefit_variant' => 'compact_cards',
                'scope_variant' => 'numbered_columns',
            ],
            'it-consultant' => [
                'image_variant' => 'image_right',
                'benefit_style' => 'numbered_rows',
                'benefit_variant' => 'numbered_rows',
                'scope_variant' => 'numbered_columns',
            ],
            'server-management' => [
                'image_variant' => 'image_left',
                'benefit_style' => 'compact_cards',
                'benefit_variant' => 'compact_cards',
                'scope_variant' => 'numbered_rows',
            ],
            'cctv' => [
                'image_variant' => 'image_right',
                'benefit_style' => 'columns',
                'benefit_variant' => 'columns',
                'scope_variant' => 'numbered_rows',
            ],
        ];

        $plan = $plans[$service->slug] ?? [
            'image_variant' => 'image_right',
            'benefit_style' => 'compact_cards',
            'benefit_variant' => 'compact_cards',
            'scope_variant' => 'numbered_rows',
        ];

        $order = 10;
        $sections = [];

        if (trim((string) $service->content) !== '') {
            $sections[] = [
                'type' => 'image_text',
                'title' => 'Pendekatan Kami untuk ' . $service->name,
                'description' => $service->content,
                'layout_variant' => $plan['image_variant'],
                'payload' => ['show_image' => true],
                'image' => null,
                'sort_order' => $order,
            ];
            $order += 10;
        }

        if ($scope !== []) {
            $sections[] = [
                'type' => 'feature_grid',
                'title' => 'Ruang Lingkup Layanan',
                'description' => null,
                'layout_variant' => $plan['scope_variant'],
                'payload' => ['style' => 'numbered', 'items' => $scopeItems],
                'sort_order' => $order,
            ];
            $order += 10;
        }

        if ($workflowSteps !== []) {
            $sections[] = [
                'type' => 'process_timeline',
                'title' => 'Tahapan Pelaksanaan Proyek',
                'description' => null,
                'layout_variant' => 'vertical',
                'payload' => ['orientation' => 'vertical', 'steps' => $workflowSteps],
                'sort_order' => $order,
            ];
            $order += 10;
        }

        if ($benefits !== []) {
            $sections[] = [
                'type' => 'benefit_list',
                'title' => 'Manfaat Utama bagi Operasional Anda',
                'description' => null,
                'layout_variant' => $plan['benefit_variant'],
                'payload' => ['style' => $plan['benefit_style'], 'items' => $benefitItems],
                'sort_order' => $order,
            ];
            $order += 10;
        }

        return [
            ...$sections,
            ...self::legacyFaqSection($service, $order),
            [
                'type' => 'cta_banner',
                'title' => 'Butuh solusi ' . $service->name . ' untuk bisnis Anda?',
                'description' => 'Konsultasikan kebutuhan dan estimasi penerapan bersama konsultan NDS.',
                'layout_variant' => 'dark',
                'payload' => [
                    'cta_text' => 'Jadwalkan Diskusi',
                    'cta_url' => '/contact',
                    'secondary_cta_text' => 'Lihat Layanan Lain',
                    'secondary_cta_url' => '/services',
                ],
                'sort_order' => $order + 10,
            ],
        ];
    }

    private static function legacyFaqSection(Service $service, int $order): array
    {
        if (trim((string) $service->faq) === '') {
            return [];
        }

        $items = [];
        foreach (self::listLines($service->faq) as $line) {
            $separator = mb_strpos($line, '||');
            $items[] = $separator === false
                ? ['question' => $line, 'answer' => null]
                : ['question' => trim(mb_substr($line, 0, $separator)), 'answer' => trim(mb_substr($line, $separator + 2))];
        }

        if ($items === []) {
            return [];
        }

        return [[
            'type' => 'faq',
            'title' => 'Pertanyaan yang Sering Diajukan',
            'description' => null,
            'layout_variant' => null,
            'payload' => ['items' => $items],
            'sort_order' => $order,
        ]];
    }

    /**
     * Parser baris konten lama: satu item per baris, strik awal "-"/"•"/angka
     * mengikuti konvensi yang dipakai halaman lama.
     *
     * @return list<string>
     */
    private static function listLines(?string $text): array
    {
        if ($text === null) {
            return [];
        }

        $lines = [];
        foreach (preg_split('/\r\n|\r|\n/', $text) ?: [] as $line) {
            $line = trim(preg_replace('/^[-•\d.\s]+/', '', trim($line)) ?? '');
            if ($line !== '') {
                $lines[] = $line;
            }
        }

        return $lines;
    }
}
