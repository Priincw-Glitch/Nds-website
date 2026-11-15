<?php

namespace App\Http\Requests;

use App\Models\Promo;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdatePromoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Dapatkan model Promo yang sedang diperbarui.
     */
    protected function getTargetPromo(): ?Promo
    {
        $promo = $this->route('promo');

        if ($promo instanceof Promo) {
            return $promo;
        }

        if (is_numeric($promo) || is_string($promo)) {
            return Promo::find($promo);
        }

        return null;
    }

    protected function prepareForValidation(): void
    {
        $targetPromo = $this->getTargetPromo();

        // 1. Partial fallback untuk Judul Promo:
        // Jika tidak diisi atau kosong di request, pertahankan nilai tersimpan di database
        if ((!$this->has('title') || trim((string) $this->input('title')) === '') && $targetPromo) {
            $this->merge(['title' => $targetPromo->title]);
        }

        // 2. Partial fallback untuk Slug Promo:
        // Jika tidak diisi atau kosong di request, pertahankan slug lama agar tidak berubah tanpa sengaja
        if ((!$this->has('slug') || trim((string) $this->input('slug')) === '') && $targetPromo) {
            $this->merge(['slug' => $targetPromo->slug]);
        }

        // 3. Fallback untuk Kategori: jika tidak dikirim dalam request, pertahankan nilai lama
        if (!$this->has('service_category_id') && $targetPromo) {
            $this->merge(['service_category_id' => $targetPromo->service_category_id]);
        }

        // 4. Fallback untuk Deskripsi: jika tidak dikirim dalam request, pertahankan nilai lama
        if (!$this->has('description') && $targetPromo) {
            $this->merge(['description' => $targetPromo->description]);
        }

        // 5. Normalisasi & Kalkulasi Diskon / Harga
        $discountType = $this->input('discount_type', $targetPromo?->discount_type ?? 'none');

        $originalPrice = $this->has('original_price')
            ? ($this->filled('original_price') ? (float) $this->input('original_price') : null)
            : ($targetPromo?->original_price !== null ? (float) $targetPromo->original_price : null);

        $discountPercentage = $this->has('discount_percentage')
            ? ($this->filled('discount_percentage') ? (float) $this->input('discount_percentage') : null)
            : ($targetPromo?->discount_percentage !== null ? (float) $targetPromo->discount_percentage : null);

        $discountAmount = $this->has('discount_amount')
            ? ($this->filled('discount_amount') ? (float) $this->input('discount_amount') : null)
            : ($targetPromo?->discount_amount !== null ? (float) $targetPromo->discount_amount : null);

        $finalPrice = $this->has('final_price')
            ? ($this->filled('final_price') ? (float) $this->input('final_price') : null)
            : ($targetPromo?->final_price !== null ? (float) $targetPromo->final_price : null);

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

    public function rules(): array
    {
        $targetPromo = $this->getTargetPromo();
        $id = $targetPromo?->id ?? $this->route('promo');

        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('promos', 'slug')->ignore($id),
            ],
            'service_category_id' => ['nullable', 'exists:service_categories,id'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_image' => ['nullable', 'boolean'],

            // Diskon & Penawaran
            'discount_type' => ['sometimes', 'required', 'in:none,percentage,fixed,special_price'],
            'original_price' => ['nullable', 'numeric', 'min:0'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0.01', 'max:100'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'final_price' => ['nullable', 'numeric', 'min:0'],

            // Periode & Status
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
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
            'image.max' => 'Ukuran file gambar maksimal 2 MB.',
            'image.mimes' => 'Format gambar harus berupa JPG, JPEG, PNG, atau WEBP.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $targetPromo = $this->getTargetPromo();

            // Validasi tanggal mulai & berakhir
            $startDate = $this->filled('start_date')
                ? $this->input('start_date')
                : ($targetPromo?->start_date ? date('Y-m-d', strtotime($targetPromo->start_date)) : null);

            $endDate = $this->filled('end_date')
                ? $this->input('end_date')
                : ($targetPromo?->end_date ? date('Y-m-d', strtotime($targetPromo->end_date)) : null);

            if ($startDate && $endDate && $endDate < $startDate) {
                $validator->errors()->add('end_date', 'Tanggal berakhir tidak boleh mendahului tanggal mulai.');
            }

            // Validasi aturan diskon
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

            // Validasi CTA
            $ctaUrl = $this->input('cta_url');
            if (!empty($ctaUrl)) {
                $rawCta = trim((string) $ctaUrl);
                $cleanedDigits = preg_replace('/[^0-9+]/', '', $rawCta);
                $isPhone = preg_match('/^(\+?62|08)[0-9]{8,15}$/', $cleanedDigits) && strlen($cleanedDigits) >= 9;
                $isUrl = (bool) filter_var($rawCta, FILTER_VALIDATE_URL);
                $isRelative = str_starts_with($rawCta, '/');
                $isWa = str_starts_with($rawCta, 'wa.me/') || str_starts_with($rawCta, 'tel:') || str_starts_with($rawCta, 'mailto:');

                if (!$isPhone && !$isUrl && !$isRelative && !$isWa) {
                    $validator->errors()->add('cta_url', 'Format CTA harus berupa URL valid (https://...), nomor WhatsApp (08... / +62...), link wa.me, atau path relatif (/...).');
                }
            }
        });
    }
}
