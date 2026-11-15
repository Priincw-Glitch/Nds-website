<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel referensi wilayah administratif Indonesia (kode Kemendagri):
 * provinsi (2 digit) → kota/kabupaten (4 digit) → kecamatan (6 digit).
 * Data diisi oleh IndonesiaRegionSeeder; dipakai dropdown bersambung
 * Cakupan Wilayah dan validasi relasi wilayah di backend.
 *
 * service_coverages ditambah kolom kode (nullable) agar data lama yang
 * hanya menyimpan nama tetap valid dan tidak perlu migrasi data.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('indonesia_provinces', function (Blueprint $table) {
            $table->char('code', 2)->primary();
            $table->string('name', 100);
        });

        Schema::create('indonesia_regencies', function (Blueprint $table) {
            $table->char('code', 4)->primary();
            $table->char('province_code', 2);
            $table->string('name', 150);

            $table->foreign('province_code')
                ->references('code')->on('indonesia_provinces')
                ->cascadeOnUpdate()->restrictOnDelete();
            $table->index('province_code');
        });

        Schema::create('indonesia_districts', function (Blueprint $table) {
            $table->char('code', 6)->primary();
            $table->char('regency_code', 4);
            $table->string('name', 150);

            $table->foreign('regency_code')
                ->references('code')->on('indonesia_regencies')
                ->cascadeOnUpdate()->restrictOnDelete();
            $table->index('regency_code');
        });

        Schema::table('service_coverages', function (Blueprint $table) {
            $table->char('province_code', 2)->nullable()->after('province');
            $table->char('regency_code', 4)->nullable()->after('city');
            $table->char('district_code', 6)->nullable()->after('district');
            $table->index(['province_code', 'regency_code', 'district_code']);
        });
    }

    public function down(): void
    {
        Schema::table('service_coverages', function (Blueprint $table) {
            $table->dropIndex(['province_code', 'regency_code', 'district_code']);
            $table->dropColumn(['province_code', 'regency_code', 'district_code']);
        });

        Schema::dropIfExists('indonesia_districts');
        Schema::dropIfExists('indonesia_regencies');
        Schema::dropIfExists('indonesia_provinces');
    }
};
