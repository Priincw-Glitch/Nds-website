<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Koreksi nama resmi perusahaan pada data yang sudah tersimpan.
 *
 * Nama resmi: Nusantara Digital Solution (bentuk singular). Baris yang masih
 * memakai bentuk jamak "Nusantara Digital Solutions" di perbaiki in-place;
 * tabel dan kolom lain tidak disentuh.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Tabel settings lama (LEGACY, tidak dipakai aplikasi) tetap ikut
        // diperbaiki agar tidak ada salinan nama lama yang tersisa di database.
        if (Schema::hasTable('settings') && Schema::hasColumn('settings', 'site_name')) {
            DB::table('settings')
                ->where('site_name', 'Nusantara Digital Solutions')
                ->update(['site_name' => 'Nusantara Digital Solution']);
        }

        // Konten halaman statis (Tentang, Kebijakan Privasi) yang dibuat
        // dari default migrasi 2026_11_06_000001_create_pages_table.
        if (Schema::hasTable('pages')) {
            $columns = ['hero_description', 'content', 'body', 'description'];
            foreach (Schema::getColumnListing('pages') as $column) {
                if (! in_array($column, $columns, true)) {
                    continue;
                }

                DB::table('pages')
                    ->where($column, 'like', '%Nusantara Digital Solutions%')
                    ->get([$column, 'id'])
                    ->each(function ($row) use ($column): void {
                        DB::table('pages')->where('id', $row->id)->update([
                            $column => str_replace(
                                'Nusantara Digital Solutions',
                                'Nusantara Digital Solution',
                                (string) $row->{$column},
                            ),
                        ]);
                    });
            }
        }
    }

    public function down(): void
    {
        // Perbaikan teks identitas tidak dibalik.
    }
};
