<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('site_name')->default('Nusantara Digital Solution');
            $table->text('company_description')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->text('contact_address')->nullable();
            $table->timestamps();
        });

        // Insert default settings
        DB::table('settings')->insert([
            'site_name' => 'Nusantara Digital Solution',
            'company_description' => 'Mitra solusi teknologi terpercaya untuk mengembangkan bisnis Anda melalui teknologi yang tepat.',
            'logo_path' => '/images/logo.png',
            'contact_email' => 'admin@ndsdigital.id',
            'contact_phone' => '+62 XXX XXXX XXXX',
            'contact_address' => 'Jakarta, Indonesia',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
