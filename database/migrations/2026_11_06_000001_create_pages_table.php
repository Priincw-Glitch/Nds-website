<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Halaman statis yang isinya dikelola admin (Tentang Kami & Kebijakan Privasi).
     * Baris awal diisi dengan materi yang sebelumnya ditulis langsung di komponen React,
     * sehingga isi halaman tidak berubah setelah migrasi.
     */
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('hero_title')->nullable();
            $table->text('hero_description')->nullable();
            $table->longText('content')->nullable();
            $table->string('image')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        $now = now();

        DB::table('pages')->insert([
            [
                'slug' => 'about',
                'title' => 'Tentang Kami',
                'hero_title' => 'Mitra Teknologi untuk Pertumbuhan Bisnis Anda',
                'hero_description' => null,
                'content' => '<p>Nusantara Digital Solution lahir dari komitmen untuk membantu pelaku usaha dan institusi di Indonesia mengoptimalkan operasional melalui pemanfaatan teknologi yang tepat dan efisien.</p>'
                    . '<p>Layanan kami mencakup pengembangan website dan aplikasi bisnis, penataan infrastruktur jaringan dan server, konsultasi arsitektur IT, hingga keamanan fisik terintegrasi CCTV.</p>'
                    . '<p>Kami percaya bahwa teknologi terbaik adalah teknologi yang relevan dan memberikan dampak langsung pada stabilitas dan pertumbuhan organisasi Anda.</p>',
                'image' => null,
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'privacy',
                'title' => 'Kebijakan Privasi',
                'hero_title' => 'Kebijakan Privasi',
                'hero_description' => 'Nusantara Digital Solution menghargai dan berkomitmen menjaga kerahasiaan informasi yang Anda percayakan kepada kami saat menggunakan layanan dan situs web ini.',
                'content' => '<h2>1. Informasi yang Kami Kumpulkan</h2><p>Kami mengumpulkan informasi yang Anda berikan secara sukarela saat mengisi formulir konsultasi atau komunikasi di website ini, seperti nama lengkap, alamat email, nomor telepon, dan uraian kebutuhan proyek.</p><hr>'
                    . '<h2>2. Pemanfaatan Data</h2><p>Informasi yang dikumpulkan hanya digunakan untuk merespons permintaan konsultasi, memberikan estimasi solusi teknologi, dan meningkatkan mutu layanan Nusantara Digital Solution. Kami tidak memperjualbelikan atau mendistribusikan data kontak kepada pihak ketiga untuk kepentingan komersial tanpa persetujuan Anda.</p><hr>'
                    . '<h2>3. Keamanan &amp; Penyimpanan</h2><p>Data pesan dan korespondensi disimpan di infrastruktur server yang aman dan hanya dapat diakses oleh personel yang berwenang demi menjaga integritas dan kerahasiaan informasi Anda.</p><hr>'
                    . '<h2>4. Penggunaan Cookie &amp; Analitik</h2><p>Website kami dapat menggunakan cookie esensial dan metrik anonim semata-mata untuk mengoptimalkan navigasi, kecepatan muat halaman, dan fungsionalitas teknis antarmuka pengguna.</p><hr>'
                    . '<h2>5. Hak Pengguna atas Data</h2><p>Anda berhak sewaktu-waktu meminta konfirmasi mengenai data yang tersimpan atau meminta pembaruan serta penghapusan riwayat data Anda dengan menghubungi tim kami melalui kanal Hubungi Kami.</p><hr>'
                    . '<h2>6. Pembaruan Kebijakan Privasi</h2><p>Kebijakan privasi ini dapat disesuaikan secara berkala untuk mencerminkan kepatuhan regulasi atau perubahan layanan. Perubahan akan segera ditampilkan pada halaman ini.</p>',
                'image' => null,
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
