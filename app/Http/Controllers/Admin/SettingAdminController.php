<?php

namespace App\Http\Controllers\Admin;

use App\Events\SettingsUpdated;
use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SettingAdminController extends Controller
{
    private array $settings = [
        // Profil Perusahaan
        'company_name' => ['label' => 'Nama Perusahaan', 'type' => 'text', 'group' => 'company'],
        'company_tagline' => ['label' => 'Tagline Perusahaan', 'type' => 'text', 'group' => 'company'],
        'company_description' => ['label' => 'Deskripsi Singkat', 'type' => 'textarea', 'group' => 'company'],
        'footer_description' => ['label' => 'Deskripsi Footer', 'type' => 'textarea', 'group' => 'company'],

        // Konten Beranda (Homepage)
        'hero_eyebrow' => ['label' => 'Badge / Label Hero', 'type' => 'text', 'group' => 'homepage'],
        'hero_title' => ['label' => 'Judul Utama Hero (H1)', 'type' => 'text', 'group' => 'homepage'],
        'hero_subtitle' => ['label' => 'Teks Sorot Judul Hero', 'type' => 'text', 'group' => 'homepage'],
        'hero_description' => ['label' => 'Deskripsi Hero', 'type' => 'textarea', 'group' => 'homepage'],
        'hero_cta_text' => ['label' => 'Teks Tombol CTA Utama', 'type' => 'text', 'group' => 'homepage'],
        'hero_cta_url' => ['label' => 'Tujuan Tombol CTA Utama (URL)', 'type' => 'text', 'group' => 'homepage'],
        'hero_secondary_cta_text' => ['label' => 'Teks Tombol CTA Sekunder', 'type' => 'text', 'group' => 'homepage'],
        'hero_secondary_cta_url' => ['label' => 'Tujuan Tombol CTA Sekunder (URL)', 'type' => 'text', 'group' => 'homepage'],
        'hero_tagline' => ['label' => 'Tagline Pojok Hero', 'type' => 'text', 'group' => 'homepage'],

        // Sakelar Visibilitas Section Beranda
        'show_coverage_section' => ['label' => 'Tampilkan Section Cek Jangkauan', 'type' => 'checkbox', 'group' => 'homepage'],
        'show_services_section' => ['label' => 'Tampilkan Section Layanan Unggulan', 'type' => 'checkbox', 'group' => 'homepage'],
        'show_targets_section' => ['label' => 'Tampilkan Section Target Klien & Segmen', 'type' => 'checkbox', 'group' => 'homepage'],
        'show_promos_section' => ['label' => 'Tampilkan Section Promo & Paket', 'type' => 'checkbox', 'group' => 'homepage'],
        'show_articles_section' => ['label' => 'Tampilkan Section Artikel & Publikasi', 'type' => 'checkbox', 'group' => 'homepage'],
        'show_cta_section' => ['label' => 'Tampilkan Section Penutup (CTA)', 'type' => 'checkbox', 'group' => 'homepage'],

        // Kontak & Alamat
        'contact_email' => ['label' => 'Email Kontak Resmi', 'type' => 'text', 'group' => 'contact'],
        'contact_phone' => ['label' => 'Nomor Telepon Kantor', 'type' => 'text', 'group' => 'contact'],
        'contact_whatsapp' => ['label' => 'Nomor WhatsApp Resmi', 'type' => 'text', 'group' => 'contact'],
        'contact_address' => ['label' => 'Alamat Lengkap Kantor', 'type' => 'textarea', 'group' => 'contact'],

        // Media Sosial
        'facebook' => ['label' => 'URL Facebook Resmi', 'type' => 'text', 'group' => 'social'],
        'instagram' => ['label' => 'URL Instagram Resmi', 'type' => 'text', 'group' => 'social'],
        'linkedin' => ['label' => 'URL LinkedIn Resmi', 'type' => 'text', 'group' => 'social'],
        'youtube' => ['label' => 'URL YouTube Resmi', 'type' => 'text', 'group' => 'social'],

        // Optimasi Mesin Pencari (SEO)
        'seo_title' => ['label' => 'Meta Title Default', 'type' => 'text', 'group' => 'seo'],
        'seo_description' => ['label' => 'Meta Description Default', 'type' => 'textarea', 'group' => 'seo'],

        // Integrasi Live Chat Tawk.to. Widget hanya dimuat di website publik dan
        // portal pelanggan, tidak di area admin.
        'tawk_enabled' => ['label' => 'Aktifkan Widget Live Chat Tawk.to', 'type' => 'checkbox', 'group' => 'integration', 'default' => '0'],
        'tawk_property_id' => ['label' => 'Tawk.to Property ID', 'type' => 'text', 'group' => 'integration'],
        'tawk_widget_id' => ['label' => 'Tawk.to Widget ID', 'type' => 'text', 'group' => 'integration'],
    ];

    public function edit(Request $request): Response
    {
        $values = [];
        foreach ($this->settings as $key => $meta) {
            $default = $meta['default'] ?? ($meta['type'] === 'checkbox' ? '1' : '');
            $values[$key] = CompanySetting::get($key, $default);
        }

        $values['logo_path'] = CompanySetting::get('logo_path', '/images/logo.png');
        $values['hero_bg_image'] = CompanySetting::get('hero_bg_image', '/images/hero-bg.jpg');
        $values['service_bg_application'] = CompanySetting::get('service_bg_application', '');
        $values['service_bg_solution'] = CompanySetting::get('service_bg_solution', '');

        return Inertia::render('Admin/Settings/Edit', [
            'fields' => $this->settings,
            'values' => $values,
            'activeTab' => $request->query('tab', 'company'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $keys = array_keys($this->settings);
        $rules = [];
        foreach ($keys as $key) {
            $meta = $this->settings[$key];
            if ($meta['type'] === 'checkbox') {
                $rules[$key] = ['nullable', 'string', 'in:0,1'];
            } elseif (str_starts_with($key, 'tawk_')) {
                // ID Tawk.to dipakai menyusun URL embed, jadi dibatasi ke karakter aman.
                $rules[$key] = ['nullable', 'string', 'max:100', 'regex:/^[A-Za-z0-9_-]*$/'];
            } else {
                $rules[$key] = ['nullable', 'string', 'max:5000'];
            }
        }

        $data = $request->validate($rules);

        // Validasi upload file gambar
        $request->validate([
            'logo' => 'nullable|image|mimes:png,jpg,jpeg,webp|max:2048',
            'hero_image' => 'nullable|image|mimes:png,jpg,jpeg,webp|max:4096',
            'application_bg_image' => 'nullable|image|mimes:png,jpg,jpeg,webp|max:4096',
            'solution_bg_image' => 'nullable|image|mimes:png,jpg,jpeg,webp|max:4096',
        ]);

        // Upload Logo Perusahaan
        if ($request->hasFile('logo')) {
            $oldLogo = CompanySetting::get('logo_path');
            if ($oldLogo && $oldLogo !== '/images/logo.png' && str_starts_with($oldLogo, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $oldLogo);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('logo')->store('logos', 'public');
            CompanySetting::set('logo_path', '/storage/' . $path, 'text');
        }

        // Upload Gambar Latar Hero
        if ($request->hasFile('hero_image')) {
            $oldHero = CompanySetting::get('hero_bg_image');
            if ($oldHero && $oldHero !== '/images/hero-bg.jpg' && str_starts_with($oldHero, '/storage/')) {
                $oldHeroPath = str_replace('/storage/', '', $oldHero);
                Storage::disk('public')->delete($oldHeroPath);
            }

            $heroPath = $request->file('hero_image')->store('hero', 'public');
            CompanySetting::set('hero_bg_image', '/storage/' . $heroPath, 'text');
        }

        // Upload Background Halaman Layanan per Kategori (Aplikasi & Solusi)
        foreach ([
            'application_bg_image' => 'service_bg_application',
            'solution_bg_image' => 'service_bg_solution',
        ] as $fileKey => $settingKey) {
            if ($request->hasFile($fileKey)) {
                $old = CompanySetting::get($settingKey);
                if ($old && str_starts_with($old, '/storage/')) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $old));
                }

                $bgPath = $request->file($fileKey)->store('services-bg', 'public');
                CompanySetting::set($settingKey, '/storage/' . $bgPath, 'text');
            }
        }

        // Simpan nilai pengaturan
        foreach ($this->settings as $key => $meta) {
            if ($meta['type'] === 'checkbox') {
                $val = $request->has($key) ? ($request->input($key) === '0' ? '0' : '1') : '0';
                CompanySetting::set($key, $val, 'text');
            } else {
                $val = $data[$key] ?? '';
                CompanySetting::set($key, $val, $meta['type']);
            }
        }

        // Bersihkan cache beranda publik agar perubahan langsung tercermin
        Cache::forget('home_data');

        // Broadcast settings update event jika Reverb aktif
        $logoPath = CompanySetting::get('logo_path', '/images/logo.png');
        try {
            event(new SettingsUpdated($logoPath));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Broadcast gagal (Reverb mungkin mati): ' . $e->getMessage());
        }

        $tab = $request->input('_tab', 'company');

        return redirect()->route('admin.settings.edit', ['tab' => $tab])->with('success', 'Pengaturan berhasil disimpan.');
    }
}
