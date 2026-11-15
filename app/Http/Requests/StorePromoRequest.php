<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Validator;

class StorePromoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $id = $this->route('promo')?->id ?? $this->route('promo');

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:promos,slug,' . ($id ?? 'NULL')],
            'service_category_id' => ['nullable', 'exists:service_categories,id'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],

            // Diskon & Penawaran
            'discount_type' => ['required', 'in:none,percentage,fixed,special_price'],
            'original_price' => ['nullable', 'numeric', 'min:0'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0.01', 'max:100'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'final_price' => ['nullable', 'numeric', 'min:0'],

            // Periode & Status
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'cta_text' => ['nullable', 'string', 'max:100'],
            'cta_url' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],

            // Pengaturan Tampilan
            'show_on_home' => ['nullable', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Nama promo wajib diisi.',
            'slug.required' => 'Slug promo wajib diisi.',
            'slug.unique' => 'Slug promo sudah digunakan, gunakan slug lain.',
            'service_category_id.exists' => 'Kategori layanan yang dipilih tidak valid.',
            'discount_type.required' => 'Pilih jenis penawaran promo.',
            'discount_type.in' => 'Jenis penawaran tidak valid.',
            'original_price.min' => 'Harga normal tidak boleh bernilai negatif.',
            'discount_percentage.min' => 'Persentase diskon harus lebih dari 0%.',
            'discount_percentage.max' => 'Persentase diskon tidak boleh melebihi 100%.',
            'discount_amount.min' => 'Potongan nominal tidak boleh bernilai negatif.',
            'final_price.min' => 'Harga promo tidak boleh bernilai negatif.',
            'end_date.after_or_equal' => 'Tanggal berakhir tidak boleh mendahului tanggal mulai.',
            'image.max' => 'Ukuran file gambar maksimal 2 MB.',
            'image.mimes' => 'Format gambar harus berupa JPG, JPEG, PNG, atau WEBP.',
            'cta_url.url' => 'Format URL CTA tidak valid (harus diawali http:// atau https://).',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('title') && !$this->filled('slug')) {
            $this->merge(['slug' => Str::slug($this->input('title'))]);
        }

        // Normalisasi format desimal / string ke float
        $originalPrice = $this->filled('original_price') ? (float) $this->input('original_price') : null;
        $discountPercentage = $this->filled('discount_percentage') ? (float) $this->input('discount_percentage') : null;
        $discountAmount = $this->filled('discount_amount') ? (float) $this->input('discount_amount') : null;
        $finalPrice = $this->filled('final_price') ? (float) $this->input('final_price') : null;

        $discountType = $this->input('discount_type', 'none');

        // Otomatisasi kalkulasi berdasarkan jenis diskon
        if ($discountType === 'percentage' && $discountPercentage !== null && $originalPrice !== null) {
            $finalPrice = round($originalPrice * (1 - ($discountPercentage / 100)), 2);
            $discountAmount = round($originalPrice - $finalPrice, 2);
        } elseif ($discountType === 'fixed' && $discountAmount !== null && $originalPrice !== null) {
            $finalPrice = max(0, round($originalPrice - $discountAmount, 2));
        } elseif ($discountType === 'special_price' && $finalPrice !== null && $originalPrice !== null) {
            $discountAmount = max(0, round($originalPrice - $finalPrice, 2));
            if ($originalPrice > 0) {
                $discountPercentage = round(($discountAmount / $originalPrice) * 100, 2);
            }
        } elseif ($discountType === 'none') {
            $discountPercentage = null;
            $discountAmount = null;
            $finalPrice = $originalPrice;
        }

        $this->merge([
            'discount_type' => $discountType,
            'original_price' => $originalPrice,
            'discount_percentage' => $discountPercentage,
            'discount_amount' => $discountAmount,
            'final_price' => $finalPrice,
        ]);
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $type = $this->input('discount_type');
            $originalPrice = $this->input('original_price');
            $discountPercentage = $this->input('discount_percentage');
            $discountAmount = $this->input('discount_amount');
            $finalPrice = $this->input('final_price');

            if ($type === 'percentage') {
                if ($discountPercentage === null || $discountPercentage <= 0) {
                    $validator->errors()->add('discount_percentage', 'Persentase diskon wajib diisi dan harus lebih dari 0%.');
                }
            } elseif ($type === 'fixed') {
                if ($discountAmount === null || $discountAmount <= 0) {
                    $validator->errors()->add('discount_amount', 'Nominal potongan rupiah wajib diisi dan harus lebih dari 0.');
                }
                if ($originalPrice !== null && $discountAmount !== null && $discountAmount > $originalPrice) {
                    $validator->errors()->add('discount_amount', 'Nominal potongan tidak boleh melebihi harga normal.');
                }
            } elseif ($type === 'special_price') {
                if ($finalPrice === null) {
                    $validator->errors()->add('final_price', 'Harga khusus promo wajib diisi.');
                }
                if ($originalPrice !== null && $finalPrice !== null && $finalPrice >= $originalPrice) {
                    $validator->errors()->add('final_price', 'Harga khusus promo harus lebih murah daripada harga normal.');
                }
            }

            // Validasi tujuan CTA (URL, nomor WhatsApp, atau tautan internal)
            $data = $validator->getData();
            if (! empty($data['cta_url'])) {
                $rawCta = trim((string) $data['cta_url']);
                $cleanedDigits = preg_replace('/[^0-9+]/', '', $rawCta);
                $isPhone = preg_match('/^(\+?62|08)[0-9]{8,15}$/', $cleanedDigits) && strlen($cleanedDigits) >= 9;
                $isUrl = (bool) filter_var($rawCta, FILTER_VALIDATE_URL);
                $isRelative = str_starts_with($rawCta, '/');
                $isWa = str_starts_with($rawCta, 'wa.me/') || str_starts_with($rawCta, 'tel:') || str_starts_with($rawCta, 'mailto:');

                if (! $isPhone && ! $isUrl && ! $isRelative && ! $isWa) {
                    $validator->errors()->add('cta_url', 'Format CTA harus berupa URL valid (https://...), nomor WhatsApp (08... / +62...), link wa.me, atau path relatif (/...).');
                }
            }
        });
    }
}
