<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Kategori promo diganti kategori layanan yang sudah ada (service_categories),
 * sehingga promo, layanan, dan filter kategori memakai satu daftar yang sama.
 * Data kategori lama dipindahkan ke padanan layanannya; promo_categories tidak
 * lagi dipakai.
 */
return new class extends Migration
{
    /** slug kategori promo lama => slug layanan yang mewakilinya. */
    private const CATEGORY_MAP = [
        'internet-rumah' => 'management-network',
        'internet-bisnis' => 'management-network',
        'instalasi-cctv' => 'cctv',
        'solusi-ti' => 'it-consultant',
    ];

    public function up(): void
    {
        if (!Schema::hasColumn('promos', 'service_category_id')) {
            Schema::table('promos', function (Blueprint $table) {
                $table->unsignedBigInteger('service_category_id')->nullable()->after('image');
            });
        }

        if (Schema::hasTable('promo_categories')) {
            foreach (self::CATEGORY_MAP as $promoSlug => $serviceSlug) {
                $serviceCategoryId = DB::table('services')
                    ->where('slug', $serviceSlug)
                    ->value('service_category_id');
                $promoCategory = DB::table('promo_categories')->where('slug', $promoSlug)->first();

                if ($serviceCategoryId && $promoCategory) {
                    DB::table('promos')
                        ->where('promo_category_id', $promoCategory->id)
                        ->whereNull('service_category_id')
                        ->update(['service_category_id' => $serviceCategoryId]);
                }
            }
            // Kategori tanpa padanan (mis. Promo Musiman) dibiarkan tanpa kategori.
        }

        // Lepas FK lama sebelum kolomnya dihapus. SQLite (dipakai test) tidak
        // mendukung drop FK berdasarkan nama; drop per kolomnya diolah lewat
        // pembuatan ulang tabel oleh grammar SQLite. MySQL memakai nama FK.
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        foreach (Schema::getForeignKeys('promos') as $foreignKey) {
            if (in_array('promo_category_id', $foreignKey['columns'], true)) {
                Schema::table('promos', function (Blueprint $table) use ($foreignKey, $isSqlite) {
                    $isSqlite
                        ? $table->dropForeign($foreignKey['columns'])
                        : $table->dropForeign($foreignKey['name']);
                });
            }
        }

        if (Schema::hasColumn('promos', 'promo_category_id')) {
            Schema::table('promos', function (Blueprint $table) {
                $table->dropColumn('promo_category_id');
            });
        }

        $hasServiceCategoryForeignKey = collect(Schema::getForeignKeys('promos'))
            ->contains(fn ($foreignKey) => in_array('service_category_id', $foreignKey['columns'], true));
        if (!$hasServiceCategoryForeignKey) {
            Schema::table('promos', function (Blueprint $table) {
                $table->foreign('service_category_id')
                    ->references('id')->on('service_categories')
                    ->nullOnDelete();
            });
        }

        Schema::dropIfExists('promo_categories');
    }

    public function down(): void
    {
        if (!Schema::hasTable('promo_categories')) {
            Schema::create('promo_categories', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }

        if (!Schema::hasColumn('promos', 'promo_category_id')) {
            Schema::table('promos', function (Blueprint $table) {
                $table->foreignId('promo_category_id')->nullable()->after('image')
                    ->constrained('promo_categories')->nullOnDelete();
            });
        }

        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        foreach (Schema::getForeignKeys('promos') as $foreignKey) {
            if (in_array('service_category_id', $foreignKey['columns'], true)) {
                Schema::table('promos', function (Blueprint $table) use ($foreignKey, $isSqlite) {
                    $isSqlite
                        ? $table->dropForeign($foreignKey['columns'])
                        : $table->dropForeign($foreignKey['name']);
                });
            }
        }

        if (Schema::hasColumn('promos', 'service_category_id')) {
            Schema::table('promos', function (Blueprint $table) {
                $table->dropColumn('service_category_id');
            });
        }
    }
};
