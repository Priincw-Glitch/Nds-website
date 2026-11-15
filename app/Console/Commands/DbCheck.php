<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Pemeriksa koneksi database sebelum operasi penting (migration, backup,
 * deployment). Mencetak database aktif agar salah sasaran seperti menjalankan
 * perintah di database lokal terdeteksi sejak awal.
 */
class DbCheck extends Command
{
    protected $signature = 'db:check';

    protected $description = 'Menguji koneksi database dan mencetak database aktif';

    public function handle(): int
    {
        $database = config('database.connections.' . config('database.default') . '.database');

        try {
            $version = DB::selectOne('select version() as version')->version;
        } catch (\Throwable $e) {
            $this->error('Koneksi database GAGAL: ' . $e->getMessage());

            return self::FAILURE;
        }

        $this->info('Koneksi database OK.');
        $this->line('Database: ' . $database);
        $this->line('Server  : ' . $version);
        $this->line('Driver  : ' . config('database.default'));

        if (app()->environment('production') && $database === 'nds_website') {
            $this->warn('Perhatian: ini database produksi. Jangan jalankan migrate:fresh atau seeder massal.');
        }

        return self::SUCCESS;
    }
}
