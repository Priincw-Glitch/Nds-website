<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Admin tidak lagi mengelola kategori layanan, sehingga layanan baru boleh
 * dibuat tanpa kategori. Nilai kategori yang sudah tersimpan tidak diubah.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->unsignedBigInteger('service_category_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->unsignedBigInteger('service_category_id')->nullable(false)->change();
        });
    }
};
