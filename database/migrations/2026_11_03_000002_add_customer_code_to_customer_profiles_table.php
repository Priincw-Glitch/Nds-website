<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Customer ID unik (USER001, USER002, ...) yang disimpan di database,
     * tidak dihitung di frontend, sehingga tidak mungkin duplikat.
     */
    public function up(): void
    {
        Schema::table('customer_profiles', function (Blueprint $table) {
            $table->string('customer_code')->nullable()->unique()->after('user_id');
        });

        // Backfill akun pelanggan yang sudah ada mengikuti urutan id akun.
        $profiles = DB::table('customer_profiles')
            ->join('users', 'users.id', '=', 'customer_profiles.user_id')
            ->where('users.role', 'customer')
            ->orderBy('users.id')
            ->pluck('customer_profiles.id');

        foreach ($profiles as $index => $profileId) {
            DB::table('customer_profiles')
                ->where('id', $profileId)
                ->update(['customer_code' => 'USER' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT)]);
        }
    }

    public function down(): void
    {
        Schema::table('customer_profiles', function (Blueprint $table) {
            $table->dropColumn('customer_code');
        });
    }
};
