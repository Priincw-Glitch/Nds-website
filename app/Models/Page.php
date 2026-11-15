<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    public const SLUG_ABOUT = 'about';
    public const SLUG_PRIVACY = 'privacy';

    protected $fillable = [
        'slug',
        'title',
        'hero_title',
        'hero_description',
        'content',
        'image',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];

    /**
     * Halaman publik berdasarkan slug. Mengembalikan null bila baris belum ada
     * atau migrasi tabel `pages` belum dijalankan, sehingga halaman tetap
     * memakai konten bawaan di komponen dan tidak error.
     */
    public static function findBySlug(string $slug): ?self
    {
        try {
            return static::where('slug', $slug)->first();
        } catch (\Throwable $e) {
            return null;
        }
    }
}
