<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validasi Manajemen Layanan oleh admin.
 *
 * Admin hanya mengelola informasi dasar: nama, deskripsi singkat, gambar,
 * status tayang, dan urutan. Konten detail halaman (hero, section, FAQ,
 * benefits) dikelola developer lewat preset, sehingga request ini tidak
 * menerima dan tidak pernah menimpa field tersebut.
 */
class StoreServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'short_description' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_published' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
