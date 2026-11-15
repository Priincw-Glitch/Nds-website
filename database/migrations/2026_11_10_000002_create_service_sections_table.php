<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_sections', function (Blueprint $table) {
            $table->id();
            // Struktur section milik tiap layanan; terhapus bersama layanan
            // (cascade) sama seperti kolom konten lama pada tabel services.
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            // Tredikat layout: text, image_text, feature_grid, benefit_list,
            // process_timeline, image_showcase, faq, cta_banner.
            $table->string('type', 40);
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            // Variasi komposisi, mis. image_left | image_right | numbered.
            $table->string('layout_variant', 40)->nullable();
            // Isi bebas sesuai tredikat: items, steps, faq, cta, kolom, dsb.
            $table->json('payload')->nullable();
            $table->string('image')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->index(['service_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_sections');
    }
};
