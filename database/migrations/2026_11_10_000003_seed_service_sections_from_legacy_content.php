<?php

use App\Models\Service;
use App\Support\ServiceSectionPresets;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Mengisi service_sections dari konten lama pada tabel services.
 *
 * Konten kolom lama (content/benefits/scope/workflow/faq) tidak dihapus;
 * kolom itu dibiarkan utuh sebagai arsip dan tetap dipakai renderer fallback.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('service_sections') || ! Schema::hasTable('services')) {
            return;
        }

        Service::query()->chunkById(50, function ($services): void {
            foreach ($services as $service) {
                if ($service->sections()->exists()) {
                    continue;
                }

                foreach (ServiceSectionPresets::forService($service) as $section) {
                    $service->sections()->create([
                        'type' => $section['type'],
                        'title' => $section['title'] ?? null,
                        'description' => $section['description'] ?? null,
                        'layout_variant' => $section['layout_variant'] ?? null,
                        'payload' => $section['payload'] ?? null,
                        'image' => $section['image'] ?? null,
                        'sort_order' => $section['sort_order'] ?? 0,
                        'is_visible' => true,
                    ]);
                }
            }
        });
    }

    public function down(): void
    {
        // Data section adalah hasil konversi konten lama; membalik migrasi
        // berarti menghapus halaman yang telah diedit admin. Data lama tetap
        // utuh di tabel services, jadi migrasi ini tidak dibalik.
    }
};
