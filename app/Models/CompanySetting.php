<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class CompanySetting extends Model
{
    use HasFactory;

    public const KEYS = [
        'logo_path',
        'company_name', 'company_tagline', 'company_description',
        'contact_email', 'contact_phone', 'contact_address', 'contact_whatsapp',
        'footer_description', 'seo_title', 'seo_description',
        'instagram', 'linkedin', 'youtube', 'facebook',
        // Susunan footer publik (JSON): navigasi dan urutan layanan terpilih.
        // Logo, kontak, dan URL sosmed tidak ikut di sini: semuanya tetap
        // dikelola lewat Pengaturan Situs agar tidak ada pengelola ganda.
        'footer_nav_links', 'footer_service_ids',
        // Pengaturan Konten Beranda (Homepage)
        'hero_eyebrow', 'hero_title', 'hero_subtitle', 'hero_description',
        'hero_cta_text', 'hero_cta_url', 'hero_secondary_cta_text', 'hero_secondary_cta_url',
        'hero_tagline', 'hero_bg_image',
        // Background Halaman Detail Layanan (per kategori)
        'service_bg_application', 'service_bg_solution',
        // Visibilitas Section Beranda
        'show_coverage_section', 'show_services_section', 'show_targets_section',
        'show_promos_section', 'show_articles_section', 'show_cta_section',
        // Integrasi Live Chat Tawk.to (widget dimuat dari sisi frontend)
        'tawk_enabled', 'tawk_property_id', 'tawk_widget_id',
    ];

    protected $fillable = ['key', 'value', 'type'];

    /** Key yang menyimpan path file di disk "public" dengan prefix "/storage/". */
    private const STORAGE_FILE_KEYS = ['logo_path', 'hero_bg_image', 'service_bg_application', 'service_bg_solution'];

    public static function allSettings(): array
    {
        $settings = [];
        foreach (self::KEYS as $key) {
            $settings[$key] = static::resolveFileKey($key, static::get($key));
        }
        return $settings;
    }

    public static function get(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        return $setting ? static::resolveFileKey($key, $setting->value) : $default;
    }

    public static function set(string $key, $value, string $type = 'text'): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value, 'type' => $type]);
    }

    /** Path file yang sudah tidak ada di disk dikosongkan agar fallback frontend
     * (mis. images/logo.png) dipakai, bukan img rusak. */
    private static function resolveFileKey(string $key, ?string $value): ?string
    {
        if (!$value || !in_array($key, self::STORAGE_FILE_KEYS, true) || !str_starts_with($value, '/storage/')) {
            return $value;
        }
        $diskPath = substr($value, strlen('/storage/'));
        return Storage::disk('public')->exists($diskPath) ? $value : null;
    }
}
