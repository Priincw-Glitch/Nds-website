<?php

namespace App\Http\Controllers;

use App\Models\IndonesiaProvince;
use App\Models\IndonesiaRegency;
use App\Models\ServiceCoverage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CoverageController extends Controller
{
    /**
     * Pengecekan cakupan jangkauan layanan NDS berbasis data wilayah terverifikasi.
     */
    public function check(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location' => 'required|string|min:2|max:100',
            'service'  => 'nullable|string|max:100',
        ]);

        $queryTerm = trim($validated['location']);
        $serviceTerm = trim($validated['service'] ?? '');

        // Cari data cakupan yang aktif dan cocok dengan nama area, kecamatan, atau kota
        $coverageQuery = ServiceCoverage::active()->searchLocation($queryTerm);

        // Jika ada layanan spesifik, utamakan yang sesuai layanan tersebut atau berlaku umum
        if (!empty($serviceTerm)) {
            $matched = (clone $coverageQuery)
                ->where(function ($q) use ($serviceTerm) {
                    $q->where('service_name', 'LIKE', "%{$serviceTerm}%")
                      ->orWhereNull('service_name')
                      ->orWhere('service_name', 'LIKE', '%Semua%');
                })
                ->first();

            if ($matched) {
                return $this->formatResult($matched, true);
            }
        }

        // Cari kecocokan umum wilayah jika tidak ada kecocokan spesifik layanan
        $coverage = $coverageQuery->first();

        if ($coverage) {
            return $this->formatResult($coverage, true);
        }

        // Bila tidak ada dalam database terverifikasi, jangan tampilkan data palsu
        return response()->json([
            'found'       => false,
            'status'      => 'unverified',
            'location'    => $queryTerm,
            'service'     => $serviceTerm ?: 'Layanan NDS',
            'title'       => 'Perlu Konfirmasi Teknis',
            'message'     => "Wilayah \"{$queryTerm}\" belum tersedia dalam daftar cakupan layanan NDS. Silakan hubungi tim kami untuk mendapatkan informasi lebih lanjut mengenai ketersediaan layanan di lokasi Anda.",
            'is_verified' => false,
        ]);
    }

    /**
     * Saran lokasi untuk autocomplete search bar kota. Sumbernya dua data yang
     * sudah ada di project: cakupan terverifikasi (diprioritaskan, dengan
     * statusnya) dan referensi wilayah Indonesia (indonesia_regencies).
     * Tidak ada daftar kota buatan di frontend.
     */
    public function suggestions(Request $request): JsonResponse
    {
        $query = trim((string) $request->query('q', ''));

        if (mb_strlen($query) < 2) {
            return response()->json(['suggestions' => []]);
        }

        $query = mb_substr($query, 0, 60);

        // 1) Cakupan aktif yang cocok dengan kota, kecamatan, atau area.
        $coverageHits = ServiceCoverage::active()
            ->where(function ($builder) use ($query) {
                $builder->where('city', 'like', "%{$query}%")
                    ->orWhere('district', 'like', "%{$query}%")
                    ->orWhere('area_name', 'like', "%{$query}%");
            })
            ->orderBy('city')
            ->orderBy('area_name')
            ->limit(4)
            ->get(['city', 'district', 'province', 'status']);

        $items = [];
        $seenCities = [];

        foreach ($coverageHits as $coverage) {
            $seenCities[$coverage->city] = true;
            $items[] = [
                'label'    => $coverage->city,
                'district' => $coverage->district,
                'province' => $coverage->province,
                'covered'  => $coverage->status,
            ];
        }

        // 2) Lengkapi dengan nama kota/kabupaten dari referensi Indonesia,
        //    mendukung kecocokan bukan hanya di awal kata (LIKE %q%). Kecocokan
        //    paling relevan didahulukan: awal nama, lalu awal kata setelah
        //    spasi ("Kota Medan" untuk "med"), baru kecocokan tengah kata.
        $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $query);
        $regencies = IndonesiaRegency::where('name', 'like', "%{$escaped}%")
            ->orderByRaw(
                "CASE
                    WHEN name LIKE ? THEN 0
                    WHEN name LIKE ? THEN 1
                    ELSE 2
                END, name",
                [$escaped . '%', '% ' . $escaped . '%']
            )
            ->limit(10)
            ->get(['name', 'province_code']);

        $provinceNames = IndonesiaProvince::whereIn(
            'code',
            $regencies->pluck('province_code')->unique()
        )->pluck('name', 'code');

        foreach ($regencies as $regency) {
            if (isset($seenCities[$regency->name]) || count($items) >= 8) {
                continue;
            }

            $seenCities[$regency->name] = true;
            $items[] = [
                'label'    => $regency->name,
                'district' => null,
                'province' => $provinceNames[$regency->province_code] ?? null,
                'covered'  => null,
            ];
        }

        return response()->json(['suggestions' => array_slice($items, 0, 8)]);
    }

    /**
     * Format respon hasil pengecekan cakupan yang terverifikasi
     */
    private function formatResult(ServiceCoverage $coverage, bool $isVerified): JsonResponse
    {
        $statusLabels = [
            'available'   => 'Layanan Tersedia',
            'development' => 'Dalam Tahap Pengembangan',
            'unavailable' => 'Belum Tersedia',
        ];

        $statusMessages = [
            'available'   => "Layanan NDS siap dipasang dan dihubungkan di area {$coverage->area_name}, {$coverage->city}.",
            'development' => "Area {$coverage->area_name}, {$coverage->city} saat ini sedang dalam proses perluasan infrastruktur jaringan NDS.",
            'unavailable' => "Area {$coverage->area_name}, {$coverage->city} saat ini belum terjangkau jalur utama kabel/infrastruktur reguler kami.",
        ];

        return response()->json([
            'found'        => true,
            'status'       => $coverage->status,
            'status_label' => $statusLabels[$coverage->status] ?? 'Terkonfirmasi',
            'title'        => $statusLabels[$coverage->status] ?? 'Status Cakupan',
            'area_name'    => $coverage->area_name,
            'city'         => $coverage->city,
            'district'     => $coverage->district,
            'province'     => $coverage->province,
            'service_name' => $coverage->service_name ?: 'Semua Layanan NDS',
            'notes'        => $coverage->notes,
            'message'      => $statusMessages[$coverage->status] ?? '',
            'is_verified'  => $isVerified,
        ]);
    }
}
