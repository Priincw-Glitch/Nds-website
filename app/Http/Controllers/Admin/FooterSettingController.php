<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class FooterSettingController extends Controller
{
    // Kunci navigasi footer ditutup agar hanya menunjuk halaman yang benar-benar ada;
    // label boleh diubah admin, tujuan halaman tidak.
    private const NAV_LINKS = [
        'home' => 'Beranda',
        'about' => 'Tentang Kami',
        'promo' => 'Promo',
        'blog' => 'Blog',
        'contact' => 'Hubungi Kami',
    ];

    public function edit(): Response
    {
        // Susunan navigasi: JSON tersimpan dipakai apa adanya; kalau belum pernah
        // disimpan, pakai bawaan agar footer publik tetap normal sebelum diedit.
        $nav = $this->decodeSetting('footer_nav_links');
        if (!is_array($nav)) {
            $nav = array_map(
                fn ($key, $label) => ['key' => $key, 'label' => $label, 'enabled' => true],
                array_keys(self::NAV_LINKS),
                self::NAV_LINKS,
            );
        }

        // Urutan layanan terpilih: array id. Kalau belum diatur, tampilkan semua layanan tayang.
        $serviceIds = $this->decodeSetting('footer_service_ids');
        if (!is_array($serviceIds)) {
            $serviceIds = Service::published()->orderBy('sort_order')->pluck('id')->all();
        }

        return Inertia::render('Admin/Settings/Footer', [
            'nav' => $nav,
            'serviceIds' => $serviceIds,
            // Daftar layanan dari tabel layanan utama: satu sumber data, bukan salinan.
            'services' => Service::published()->orderBy('sort_order')->get(['id', 'name', 'slug']),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        // Hanya dua pengaturan yang benar-benar khusus footer: navigasi dan
        // urutan layanan. Logo, kontak, dan URL sosmed tetap milik Pengaturan Situs.
        $validator = Validator::make($request->all(), [
            'nav' => ['required', 'array', 'size:' . count(self::NAV_LINKS)],
            'nav.*.key' => ['required', 'string', 'in:' . implode(',', array_keys(self::NAV_LINKS))],
            'nav.*.label' => ['required', 'string', 'max:100'],
            'nav.*.enabled' => ['required', 'boolean'],

            'service_ids' => ['present', 'array', 'max:12'],
            'service_ids.*' => ['integer'],
        ]);

        $validator->after(function (\Illuminate\Validation\Validator $validator) use ($request) {
            $nav = $request->input('nav', []);
            $navKeys = array_column($nav, 'key');
            if (count($navKeys) !== count(array_unique($navKeys))) {
                $validator->errors()->add('nav', 'Setiap tautan navigasi hanya boleh muncul satu kali.');
            }

            $serviceIds = array_map('intval', (array) $request->input('service_ids', []));
            if (count($serviceIds) !== count(array_unique($serviceIds))) {
                $validator->errors()->add('service_ids', 'Setiap layanan hanya boleh dipilih satu kali.');
            }
            if ($serviceIds !== [] && Service::whereIn('id', $serviceIds)->count() !== count($serviceIds)) {
                $validator->errors()->add('service_ids', 'Ada layanan yang tidak ditemukan.');
            }
        });

        $data = $validator->validate();

        CompanySetting::set(
            'footer_nav_links',
            json_encode($data['nav'], JSON_UNESCAPED_UNICODE),
            'text',
        );
        CompanySetting::set(
            'footer_service_ids',
            json_encode(array_values(array_map('intval', $data['service_ids']))),
            'text',
        );

        // Bersihkan cache beranda publik agar perubahan langsung tercermin.
        Cache::forget('home_data');

        return redirect()
            ->route('admin.footer-settings.edit')
            ->with('success', 'Pengaturan footer berhasil disimpan.');
    }

    private function decodeSetting(string $key): mixed
    {
        $raw = CompanySetting::get($key);
        if (!is_string($raw) || $raw === '') {
            return null;
        }

        try {
            return json_decode($raw, true, 3, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }
    }
}
