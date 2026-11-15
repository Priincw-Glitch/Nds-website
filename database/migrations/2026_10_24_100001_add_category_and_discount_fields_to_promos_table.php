<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promos', function (Blueprint $table) {
            $table->foreignId('promo_category_id')->nullable()->after('slug')->constrained('promo_categories')->nullOnDelete();
            $table->string('discount_type', 30)->default('none')->after('description'); // none, percentage, fixed, special_price
            $table->decimal('original_price', 14, 2)->nullable()->after('discount_type');
            $table->decimal('discount_percentage', 5, 2)->nullable()->after('original_price');
            $table->decimal('discount_amount', 14, 2)->nullable()->after('discount_percentage');
            $table->decimal('final_price', 14, 2)->nullable()->after('discount_amount');
            $table->boolean('show_on_home')->default(true)->after('is_active');
            $table->boolean('is_featured')->default(false)->after('show_on_home');
            $table->integer('sort_order')->default(0)->after('is_featured');
        });
    }

    public function down(): void
    {
        Schema::table('promos', function (Blueprint $table) {
            $table->dropForeign(['promo_category_id']);
            $table->dropColumn([
                'promo_category_id',
                'discount_type',
                'original_price',
                'discount_percentage',
                'discount_amount',
                'final_price',
                'show_on_home',
                'is_featured',
                'sort_order',
            ]);
        });
    }
};
