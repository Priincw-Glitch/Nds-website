<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Peningkatan sistem percakapan support:
 * - Status pesan berbasis kejadian nyata: delivered_at (klien penerima
 *   menerima pesan) dan read_at (percakapan dibuka penerima).
 * - client_key unik sebagai pengaman duplikat akibat retry/klik ganda.
 * - last_message_at pada tiket agar daftar percakapan terurut aktivitas.
 *
 * Semua perubahan aditif; riwayat pesan lama tidak disentuh isinya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_messages', function (Blueprint $table) {
            $table->timestamp('delivered_at')->nullable()->after('is_read');
            $table->timestamp('read_at')->nullable()->after('delivered_at');
            $table->string('client_key')->nullable()->after('read_at');
            $table->unique('client_key');
        });

        Schema::table('support_tickets', function (Blueprint $table) {
            $table->timestamp('last_message_at')->nullable()->index()->after('updated_at');
        });

        // Backfill: pesan lama yang sudah dibaca dianggap terkirim & dibaca
        // pada saat penandaannya; aktivitas percakapan diambil dari pesan
        // terakhirnya masing-masing. SQLite (dipakai test) tidak menerima
        // alias tabel pada UPDATE, MySQL menerima — masing-masing pakai
        // bentuk yang valid.
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement(
                'UPDATE support_tickets
                 SET last_message_at = (SELECT MAX(tm.created_at) FROM ticket_messages tm WHERE tm.ticket_id = support_tickets.id)'
            );
        } else {
            DB::statement(
                'UPDATE support_tickets st
                 SET st.last_message_at = (SELECT MAX(tm.created_at) FROM ticket_messages tm WHERE tm.ticket_id = st.id)'
            );
        }
        DB::statement(
            'UPDATE ticket_messages SET delivered_at = updated_at, read_at = updated_at WHERE is_read = 1'
        );
    }

    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropIndex(['last_message_at']);
            $table->dropColumn('last_message_at');
        });

        Schema::table('ticket_messages', function (Blueprint $table) {
            $table->dropUnique(['client_key']);
            $table->dropColumn(['client_key', 'read_at', 'delivered_at']);
        });
    }
};
