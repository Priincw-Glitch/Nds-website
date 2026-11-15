<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('customer_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('service_id')->constrained()->onDelete('cascade');
            $table->string('service_name'); // Snapshot nama layanan
            $table->string('package_type')->nullable(); // Basic, Professional, Enterprise, etc
            $table->enum('status', ['waiting_activation', 'active', 'maintenance', 'suspended', 'expired'])->default('waiting_activation');
            $table->date('activated_at')->nullable();
            $table->date('expired_at')->nullable();
            $table->text('technical_info')->nullable(); // JSON untuk info teknis
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_services');
    }
};
