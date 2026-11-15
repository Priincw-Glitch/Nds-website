<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\ArticleCategory;
use App\Models\CompanySetting;
use App\Models\ContactMessage;
use App\Models\Project;
use App\Models\Promo;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Support\ServiceSectionPresets;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Password admin diambil dari konfigurasi (bukan hardcoded).
        // Dibaca via config() agar tetap valid setelah `php artisan config:cache`
        // — memanggil env() langsung di runtime tidak disarankan Laravel.
        // Seeder menolak berjalan jika variabel ini tidak diset.
        $adminPassword = config('app.admin_password');
        if (empty($adminPassword)) {
            throw new \RuntimeException(
                'ADMIN_PASSWORD tidak diset di .env. Definisikan password admin terlebih dahulu sebelum menjalankan seeder.'
            );
        }
        if (strlen($adminPassword) < 8) {
            throw new \RuntimeException('ADMIN_PASSWORD harus minimal 8 karakter.');
        }

        User::updateOrCreate(
            ['email' => 'admin@ndsdigital.id'],
            [
                'name' => 'Admin NDS',
                'password' => Hash::make($adminPassword),
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        $settings = [
            'company_name' => 'Nusantara Digital Solution',
            'company_tagline' => 'Technology • Connectivity • Digital Solutions',
            'company_description' => 'Nusantara Digital Solution (NDS) adalah perusahaan teknologi yang menyediakan solusi digital terintegrasi untuk kebutuhan bisnis, mulai dari pengembangan web dan aplikasi hingga infrastruktur jaringan dan keamanan.',
            'footer_description' => 'Mitra solusi teknologi terpercaya untuk mengembangkan bisnis Anda melalui teknologi yang tepat.',
            'contact_email' => 'info@ndsdigital.id',
            'contact_phone' => '',
            'contact_whatsapp' => '',
            'contact_address' => '',
            'facebook' => '',
            'instagram' => '',
            'linkedin' => '',
            'youtube' => '',
            'seo_title' => 'NDS - Nusantara Digital Solution',
            'seo_description' => 'Solusi teknologi terintegrasi: web development, software application, management network, IT consultant, server management, dan CCTV.',
        ];

        foreach ($settings as $key => $value) {
            CompanySetting::set($key, $value);
        }

        $appCat = ServiceCategory::updateOrCreate(
            ['slug' => 'application'],
            ['name' => 'Application', 'description' => 'Solusi aplikasi dan sistem informasi untuk mendukung operasional bisnis.', 'sort_order' => 1]
        );

        $solCat = ServiceCategory::updateOrCreate(
            ['slug' => 'solution'],
            ['name' => 'Solution', 'description' => 'Layanan solusi TI menyeluruh untuk infrastruktur dan keamanan bisnis Anda.', 'sort_order' => 2]
        );

        $services = [
            [
                'service_category_id' => $appCat->id,
                'name' => 'Web Development',
                'slug' => 'web-development',
                'icon' => 'Code2',
                'short_description' => 'Website profesional untuk bisnis Anda.',
                'content' => "Layanan Web Development NDS membantu bisnis Anda memiliki kehadiran digital yang kuat. Kami membangun website perusahaan, landing page, portal, dan web aplikasi dengan fokus pada performa, keamanan, dan pengalaman pengguna.\n\nSetiap proyek dikerjakan dengan pendekatan modern: arsitektur yang bersih, desain responsif, dan optimasi agar cepat diakses dari berbagai perangkat.",
                'benefits' => "- Desain responsif dan modern\n- Performa loading yang optimal\n- Struktur SEO-friendly\n- Mudah dikelola dan dikembangkan\n- Dukungan teknis pasca peluncuran",
                'scope' => "- Website korporat dan company profile\n- Landing page dan microsite\n- Portal dan web aplikasi\n- Integrasi API dan layanan pihak ketiga\n- Maintenance dan update berkala",
                'workflow' => "1. Konsultasi dan analisis kebutuhan\n2. wireframe dan desain antarmuka\n3. Pengembangan front-end dan back-end\n4. Testing dan quality assurance\n5. Peluncuran dan monitoring",
                'faq' => "Berapa lama pengerjaan website? || Estimasi diberikan setelah konsultasi awal dan menyesuaikan skala proyek.\n- Apakah website bisa dikelola sendiri? || Bisa. Struktur konten halaman dibuat agar mudah diperbarui, dan panel pengelolaan dapat ditambahkan sesuai kebutuhan.\n- Apakah termasuk domain dan hosting? || Domain dan hosting diatur terpisah; kami membantu memilih dan menyiapkan keduanya.",
                'is_featured' => true,
                'is_published' => true,
                'sort_order' => 1,
                'layout_size' => 'large',
            ],
            [
                'service_category_id' => $appCat->id,
                'name' => 'Software Application',
                'slug' => 'software-application',
                'icon' => 'AppWindow',
                'short_description' => 'Aplikasi kustom untuk efisiensi bisnis.',
                'content' => "Software Application NDS dirancang untuk menjawab kebutuhan spesifik bisnis Anda. Kami mengembangkan aplikasi desktop dan web application yang terintegrasi dengan sistem yang sudah ada, sehingga operasional menjadi lebih efisien.\n\nDari sistem informasi manajemen hingga aplikasi internal tim, kami memastikan solusi mudah digunakan dan siap berkembang seiring pertumbuhan bisnis.",
                'benefits' => "- Solusi disesuaikan dengan proses bisnis\n- Otomasi tugas manual\n- Integrasi dengan sistem yang ada\n- Antarmuka yang intuitif\n- Dukungan pengembangan berkelanjutan",
                'scope' => "- Aplikasi web custom\n- Sistem informasi manajemen\n- Aplikasi internal perusahaan\n- Integrasi database dan API\n- Training dan dokumentasi",
                'workflow' => "1. Analisis kebutuhan bisnis\n2. Perancangan sistem dan UI\n3. Pengembangan iteratif\n4. Uji coba bersama pengguna\n5. Implementasi dan pendampingan",
                'is_featured' => true,
                'is_published' => true,
                'sort_order' => 2,
                'layout_size' => 'tall',
            ],
            [
                'service_category_id' => $appCat->id,
                'name' => 'Management Network',
                'slug' => 'management-network',
                'icon' => 'Network',
                'short_description' => 'Jaringan stabil, aman, dan terkelola.',
                'content' => "Management Network NDS mencakup perancangan topologi jaringan, konfigurasi perangkat, monitoring, dan pemeliharaan agar konektivitas bisnis Anda tetap stabil dan aman.\n\nKami menangani jaringan kantor, multi-site, hingga segmentasi VLAN sesuai kebutuhan organisasi.",
                'benefits' => "- Konektivitas yang stabil\n- Keamanan jaringan yang terukur\n- Monitoring dan pemeliharaan rutin\n- Dokumentasi topologi yang jelas\n- Skalabel untuk pertumbuhan bisnis",
                'scope' => "- Perancangan topologi jaringan\n- Konfigurasi router, switch, dan firewall\n- Segmentasi VLAN dan VPN\n- Monitoring jaringan\n- Troubleshooting dan maintenance",
                'workflow' => "1. Survey dan analisis kebutuhan\n2. Perancangan arsitektur jaringan\n3. Implementasi dan konfigurasi\n4. Testing dan dokumentasi\n5. Monitoring dan maintenance berkala",
                'is_featured' => true,
                'is_published' => true,
                'sort_order' => 3,
                'layout_size' => 'small',
            ],
            [
                'service_category_id' => $solCat->id,
                'name' => 'IT Consultant',
                'slug' => 'it-consultant',
                'icon' => 'Users',
                'short_description' => 'Konsultasi TI untuk solusi terbaik.',
                'content' => "Layanan IT Consultant NDS membantu perusahaan menyusun strategi teknologi yang selaras dengan tujuan bisnis. Kami menganalisis kondisi TI yang ada, mengidentifikasi celah, dan merekomendasikan solusi yang tepat guna.\n\nMulai dari audit sistem, perencanaan infrastruktur, hingga pendampingan implementasi, kami menjadi mitra strategis tim TI Anda.",
                'benefits' => "- Rekomendasi solusi berbasis analisis\n- Efisiensi biaya TI jangka panjang\n- Pendampingan implementasi\n- Peningkatan keamanan dan tata kelola\n- Dokumentasi dan knowledge transfer",
                'scope' => "- Audit dan asesmen TI\n- Perencanaan infrastruktur\n- Seleksi dan implementasi teknologi\n- Tata kelola TI dan keamanan\n- Pendampingan transformasi digital",
                'workflow' => "1. Discovery dan asesmen\n2. Analisis kebutuhan dan gap\n3. Rekomendasi dan roadmap\n4. Pendampingan implementasi\n5. Evaluasi dan perbaikan berkelanjutan",
                'is_featured' => true,
                'is_published' => true,
                'sort_order' => 4,
                'layout_size' => 'small',
            ],
            [
                'service_category_id' => $solCat->id,
                'name' => 'Server Management',
                'slug' => 'server-management',
                'icon' => 'Server',
                'short_description' => 'Pengelolaan server yang andal.',
                'content' => "Server Management NDS mencakup instalasi, konfigurasi, hardening, monitoring, dan maintenance server fisik maupun virtual. Kami memastikan server Anda berjalan optimal dan aman dari ancaman umum.\n\nLayanan ini cocok untuk perusahaan yang membutuhkan pengelolaan server profesional tanpa harus membangun tim in-house sepenuhnya.",
                'benefits' => "- Performa server yang terjaga\n- Hardening dan patch keamanan rutin\n- Backup dan recovery planning\n- Monitoring proaktif\n- Dokumentasi konfigurasi",
                'scope' => "- Instalasi dan konfigurasi server\n- Hardening keamanan server\n- Monitoring dan alerting\n- Backup dan disaster recovery\n- Migrasi dan upgrade server",
                'workflow' => "1. Audit kondisi server\n2. Perencanaan pengelolaan\n3. Implementasi konfigurasi\n4. Monitoring berkelanjutan\n5. Laporan dan rekomendasi berkala",
                'is_featured' => true,
                'is_published' => true,
                'sort_order' => 5,
                'layout_size' => 'wide',
            ],
            [
                'service_category_id' => $solCat->id,
                'name' => 'CCTV',
                'slug' => 'cctv',
                'icon' => 'Camera',
                'short_description' => 'Keamanan lebih terjaga.',
                'content' => "Layanan CCTV NDS mencakup perancangan, instalasi, dan konfigurasi sistem kamera pengawas untuk kantor, gudang, dan fasilitas bisnis lainnya. Kami membantu memilih perangkat yang sesuai dengan area dan kebutuhan pemantauan.\n\nSistem yang kami pasang mudah dipantau melalui perangkat desktop maupun mobile, sehingga aset bisnis Anda tetap terpantau kapan pun.",
                'benefits' => "- Pemantauan aset secara real-time\n- Rekaman berkualitas dan terorganisir\n- Akses remote yang aman\n- Integrasi dengan sistem keamanan lain\n- Dukungan teknis instalasi",
                'scope' => "- Survey lokasi dan perancangan\n- Instalasi kamera dan perangkat perekam\n- Konfigurasi akses mobile dan remote\n- Integrasi dengan jaringan yang ada\n- Maintenance dan perbaikan",
                'workflow' => "1. Survey lokasi\n2. Perancangan sistem CCTV\n3. Instalasi perangkat\n4. Konfigurasi dan testing\n5. Training penggunaan dan maintenance",
                'is_featured' => true,
                'is_published' => true,
                'sort_order' => 6,
                'layout_size' => 'small',
            ],
        ];

        foreach ($services as $service) {
            /** @var Service $created */
            $created = Service::updateOrCreate(['slug' => $service['slug']], $service);

            // Section halaman mengikuti preset yang dipakai migrasi data
            // agar instalasi baru dan data yang lama menghasilkan halaman sama.
            if ($created->sections()->count() === 0) {
                foreach (ServiceSectionPresets::forService($created) as $section) {
                    $created->sections()->create([
                        ...$section,
                        'is_visible' => true,
                    ]);
                }
            }
        }

        // Contoh promo: kategorinya kategori layanan yang sudah ada (Solution).
        Promo::updateOrCreate(
            ['slug' => 'gratis-konsultasi-it'],
            [
                'title' => 'Gratis Konsultasi IT Awal',
                'description' => 'Dapatkan sesi konsultasi awal bersama tim NDS untuk menganalisis kebutuhan teknologi bisnis Anda tanpa biaya.',
                'service_category_id' => $solCat->id,
                'discount_type' => 'percentage',
                'discount_percentage' => 100,
                'start_date' => now()->subDay(),
                'end_date' => now()->addMonths(3),
                'cta_text' => 'Hubungi Kami',
                'cta_url' => route('contact'),
                'is_active' => true,
                'show_on_home' => true,
                'is_featured' => true,
                'sort_order' => 1,
            ]
        );

        $catTech = ArticleCategory::updateOrCreate(['slug' => 'teknologi'], ['name' => 'Teknologi', 'description' => 'Wawasan dan berita seputar teknologi.']);
        $catTips = ArticleCategory::updateOrCreate(['slug' => 'tips'], ['name' => 'Tips & Tutorial', 'description' => 'Panduan praktis seputar IT dan digital.']);
        $catNews = ArticleCategory::updateOrCreate(['slug' => 'berita'], ['name' => 'Berita Perusahaan', 'description' => 'Kabar terbaru dari NDS.']);

        $articles = [
            [
                'article_category_id' => $catTech->id,
                'title' => 'Memilih Teknologi yang Tepat untuk Bisnis Anda',
                'slug' => 'memilih-teknologi-yang-tepat-untuk-bisnis-anda',
                'excerpt' => 'Setiap bisnis memiliki kebutuhan teknologi yang berbeda. Pelajari cara memilih solusi yang sesuai dengan skala dan tujuan organisasi Anda.',
                'content' => "Memilih teknologi bukan sekadar mengikuti tren. Yang terpenting adalah memastikan solusi yang dipilih benar-benar menjawab masalah operasional dan mendukung pertumbuhan bisnis.\n\nMulailah dari identifikasi masalah: proses apa yang paling memakan waktu? Di mana titik kelemahan sistem saat ini? Dari analisis tersebut, barulah kita bisa menentukan apakah yang dibutuhkan adalah website, aplikasi custom, perbaikan jaringan, atau penguatan keamanan server.\n\nNDS membantu Anda melewati proses ini dengan pendekatan konsultatif, sehingga investasi teknologi yang Anda keluarkan memberikan dampak nyata bagi bisnis.",
                'author' => 'Tim NDS',
                'is_published' => true,
                'published_at' => now()->subDays(7),
            ],
            [
                'article_category_id' => $catTips->id,
                'title' => '5 Praktik Keamanan Dasar untuk Jaringan Kantor',
                'slug' => '5-praktik-keamanan-dasar-untuk-jaringan-kantor',
                'excerpt' => 'Jaringan kantor yang aman dimulai dari langkah-langkah dasar yang sering diabaikan. Berikut lima praktik yang bisa diterapkan segera.',
                'content' => "Keamanan jaringan bukan hanya urusan perangkat mahal, tetapi juga konsistensi tata kelola.\n\n1. Pisahkan jaringan tamu dan jaringan internal.\n2. Perbarui firmware perangkat jaringan secara berkala.\n3. Gunakan kredensial yang kuat dan ganti secara berkala.\n4. Aktifkan logging dan monitoring dasar.\n5. Lakukan backup konfigurasi perangkat secara rutin.\n\nDengan menerapkan praktik-praktik ini, risiko gangguan dan kebocoran dapat ditekan secara signifikan.",
                'author' => 'Tim NDS',
                'is_published' => true,
                'published_at' => now()->subDays(3),
            ],
            [
                'article_category_id' => $catNews->id,
                'title' => 'Selamat Datang di Website Resmi NDS',
                'slug' => 'selamat-datang-di-website-resmi-nds',
                'excerpt' => 'Kami dengan bangga memperkenalkan website resmi Nusantara Digital Solution sebagai pusat informasi layanan dan wawasan digital kami.',
                'content' => "Melalui website ini, kami hadir lebih dekat dengan Anda. Temukan informasi lengkap mengenai layanan NDS, promo terbaru, serta artikel bermanfaat seputar teknologi dan digitalisasi bisnis.\n\nKami berkomitmen menjadi mitra teknologi yang dapat diandalkan bagi pertumbuhan bisnis di Indonesia.",
                'author' => 'Tim NDS',
                'is_published' => true,
                'published_at' => now()->subDay(),
            ],
        ];

        foreach ($articles as $article) {
            Article::updateOrCreate(['slug' => $article['slug']], $article);
        }

        $projects = [
            [
                'title' => 'Website Company Profile (Placeholder)',
                'slug' => 'website-company-profile-placeholder',
                'category' => 'Web Development',
                'description' => 'Contoh item portofolio. Ganti dengan proyek nyata setelah diverifikasi.',
                'client' => '-',
                // Placeholder: tidak dipublikasikan sampai diganti proyek nyata (audit B3).
                'is_published' => false,
                'sort_order' => 1,
            ],
            [
                'title' => 'Sistem Jaringan Kantor (Placeholder)',
                'slug' => 'sistem-jaringan-kantor-placeholder',
                'category' => 'Management Network',
                'description' => 'Contoh item portofolio. Ganti dengan proyek nyata setelah diverifikasi.',
                'client' => '-',
                // Placeholder: tidak dipublikasikan sampai diganti proyek nyata (audit B3).
                'is_published' => false,
                'sort_order' => 2,
            ],
            [
                'title' => 'Instalasi CCTV Fasilitas (Placeholder)',
                'slug' => 'instalasi-cctv-fasilitas-placeholder',
                'category' => 'CCTV',
                'description' => 'Contoh item portofolio. Ganti dengan proyek nyata setelah diverifikasi.',
                'client' => '-',
                // Placeholder: tidak dipublikasikan sampai diganti proyek nyata (audit B3).
                'is_published' => false,
                'sort_order' => 3,
            ],
        ];

        foreach ($projects as $project) {
            Project::updateOrCreate(['slug' => $project['slug']], $project);
        }
    }
}
