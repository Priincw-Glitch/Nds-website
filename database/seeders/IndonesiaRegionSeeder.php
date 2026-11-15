<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

/**
 * Mengimpor seluruh wilayah administratif Indonesia (38 provinsi, 514
 * kota/kabupaten, ±7.266 kecamatan) dari dataset statis emsifa/
 * api-wilayah-indonesia (sumber BPS + Kemendagri) ke tabel referensi lokal.
 *
 * Internet hanya dibutuhkan SAAT seeding; setelah itu dropdown bekerja
 * penuh dari database. Aman dijalankan berulang: baris di-upsert berdasarkan
 * kode, tidak pernah menghasilkan duplikat.
 *
 * Jalankan: php artisan db:seed --class=IndonesiaRegionSeeder
 */
class IndonesiaRegionSeeder extends Seeder
{
    private const BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia/v2';

    public function run(): void
    {
        $this->command->info('Mengunduh data provinsi...');
        $provinces = $this->fetchJson('provinces.json');

        $provinceRows = [];
        foreach ($provinces as $province) {
            $provinceRows[] = [
                'code' => $this->normalizeCode($province['id']),
                'name' => $province['name'],
            ];
        }
        $this->upsertChunked('indonesia_provinces', $provinceRows, ['code'], ['name']);
        $this->command->info("Provinsi diimpor: " . count($provinceRows));

        $regencyRows = [];
        $regencySourceIds = []; // kode tersimpan → id asli bertitik, dipakai untuk URL unduhan
        foreach ($provinces as $province) {
            $provinceCode = $this->normalizeCode($province['id']);
            $this->command->getOutput()->write("\rMengunduh kota/kabupaten provinsi {$province['name']}...");
            $regencies = $this->fetchJson("regencies/{$provinceCode}.json");

            foreach ($regencies as $regency) {
                $normalizedCode = $this->normalizeCode($regency['id']);
                $regencySourceIds[$normalizedCode] = $regency['id'];
                $regencyRows[] = [
                    'code' => $normalizedCode,
                    'province_code' => $provinceCode,
                    'name' => $regency['name'],
                ];
            }
        }
        $this->command->line('');
        $this->upsertChunked('indonesia_regencies', $regencyRows, ['code'], ['province_code', 'name']);
        $this->command->info('Kota/Kabupaten diimpor: ' . count($regencyRows));

        $districtRows = [];
        $skippedRegencies = [];
        $regencyTotal = count($regencyRows);
        foreach ($regencyRows as $index => $regency) {
            if ($index % 25 === 0) {
                $this->command->getOutput()->write("\rMengunduh kecamatan " . ($index + 1) . "/{$regencyTotal} ({$regency['name']})...");
            }
            // URL unduhan memakai id asli bertitik ("11.01"); kode tersimpan
            // tanpa titik ("1101").
            $districts = $this->fetchJson(
                "districts/{$regencySourceIds[$regency['code']]}.json",
                tolerantNotFound: true
            );

            if ($districts === null) {
                // File dataset kecamatan kota/kabupaten ini tidak tersedia di
                // sumber — lewati dan laporkan, jangan gagalkan seluruh impor.
                $skippedRegencies[] = "{$regency['code']} {$regency['name']}";
                continue;
            }

            foreach ($districts as $district) {
                $districtRows[] = [
                    'code' => $this->normalizeCode($district['id']),
                    'regency_code' => $regency['code'],
                    'name' => $district['name'],
                ];
            }

            // Penghematan memori: sisipkan bertahap saat kumpulan sudah besar.
            if (count($districtRows) >= 1000) {
                $this->upsertChunked('indonesia_districts', $districtRows, ['code'], ['regency_code', 'name']);
                $districtRows = [];
            }
        }
        if (!empty($districtRows)) {
            $this->upsertChunked('indonesia_districts', $districtRows, ['code'], ['regency_code', 'name']);
        }

        if (!empty($skippedRegencies)) {
            $this->command->warn('Kota/Kabupaten dilewati (file kecamatan 404 di sumber): ' . implode(', ', $skippedRegencies));
        }
        $this->command->info('Selesai. Kecamatan diimpor: ' . DB::table('indonesia_districts')->count());
    }

    /**
     * @throws \RuntimeException bila sumber gagal (kecuali 404 yang ditoleransi).
     */
    private function fetchJson(string $path, bool $tolerantNotFound = false): ?array
    {
        try {
            $response = Http::retry(3, 500)->timeout(30)->get(self::BASE_URL . '/' . $path);
        } catch (\Illuminate\Http\Client\RequestException $e) {
            if ($tolerantNotFound && $e->response?->status() === 404) {
                return null;
            }
            throw new \RuntimeException(
                "Gagal mengunduh dataset wilayah ({$path}): HTTP {$e->response?->status()}. " .
                'Periksa koneksi internet lalu jalankan seeder lagi — data yang sudah terimpor tidak duplikat.',
                0,
                $e
            );
        }

        if ($response->failed()) {
            if ($tolerantNotFound && $response->status() === 404) {
                return null;
            }
            throw new \RuntimeException(
                "Gagal mengunduh dataset wilayah ({$path}): HTTP {$response->status()}. " .
                'Periksa koneksi internet lalu jalankan seeder lagi — data yang sudah terimpor tidak duplikat.'
            );
        }

        // Respons API berbentuk {"data": [...], "meta": {...}} — ambil daftarnya.
        $json = $response->json();

        return $json['data'] ?? $json;
    }

    /** Kode sumber memakai titik ("11.01.01") — disimpan tanpa titik ("110101"). */
    private function normalizeCode(string $code): string
    {
        return str_replace('.', '', $code);
    }

    private function upsertChunked(string $table, array $rows, array $uniqueBy, array $updateColumns): void
    {
        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table($table)->upsert($chunk, $uniqueBy, $updateColumns);
        }
    }
}
