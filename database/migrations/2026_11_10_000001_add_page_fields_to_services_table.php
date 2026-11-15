<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            // Hero halaman layanan. Bila hero_title/hero_description kosong,
            // halaman publik memakai short_description agar data lama tetap tampil.
            $table->string('hero_title')->nullable()->after('icon');
            $table->text('hero_description')->nullable()->after('hero_title');
            $table->string('hero_layout', 20)->nullable()->default('full')->after('hero_description');
            $table->string('hero_cta_text')->nullable()->after('hero_layout');
            $table->string('hero_cta_url')->nullable()->after('hero_cta_text');
            $table->string('hero_secondary_cta_text')->nullable()->after('hero_cta_url');
            $table->string('hero_secondary_cta_url')->nullable()->after('hero_secondary_cta_text');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $columns = [
                'hero_title', 'hero_description', 'hero_layout',
                'hero_cta_text', 'hero_cta_url',
                'hero_secondary_cta_text', 'hero_secondary_cta_url',
            ];
            foreach ($columns as $column) {
                if (Schema::hasColumn('services', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
