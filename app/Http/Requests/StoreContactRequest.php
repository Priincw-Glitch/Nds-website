<?php

namespace App\Http\Requests;

use App\Models\Service;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Pilihan layanan harus benar-benar tayang di Admin Panel,
        // atau bernilai "custom" untuk kebutuhan di luar daftar layanan.
        $serviceOptions = array_merge(
            Service::published()->pluck('name')->all(),
            ['custom'],
        );

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => [
                'required',
                'string',
                'max:30',
                'regex:/^[0-9+()\\-.\\s]{7,25}$/',
            ],
            'company' => ['nullable', 'string', 'max:255'],
            'service' => ['required', 'string', 'max:255', Rule::in($serviceOptions)],
            'custom_service' => ['nullable', 'required_if:service,custom', 'string', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => 'Nomor telepon wajib diisi agar tim kami dapat menghubungi Anda.',
            'phone.regex' => 'Format nomor telepon tidak valid.',
            'service.required' => 'Silakan pilih kebutuhan layanan Anda.',
            'service.in' => 'Kebutuhan layanan yang dipilih tidak tersedia.',
            'custom_service.required_if' => 'Kebutuhan layanan lainnya wajib diisi.',
        ];
    }
}
