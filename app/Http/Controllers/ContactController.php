<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactRequest;
use App\Models\ContactMessage;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function create(Request $request): Response
    {
        // CTA pada halaman detail layanan membawa ?service=slug. Slug hanya
        // dipakai bila layanan benar-benar tayang, lalu diubah menjadi nama
        // layanan agar cocok dengan pilihan pada formulir.
        $slug = $request->query('service');

        $selectedService = is_string($slug) && $slug !== ''
            ? Service::published()->where('slug', $slug)->value('name')
            : null;

        return Inertia::render('Contact', [
            'settings' => $this->settings(),
            'selectedService' => $selectedService,
        ]);
    }

    public function store(StoreContactRequest $request): RedirectResponse
    {
        $key = 'contact:' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            return back()->withErrors([
                'email' => 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
            ])->onlyInput('email');
        }

        RateLimiter::hit($key, 300);

        $validated = $request->validated();

        // Layanan dipilih dari daftar Admin Panel; "custom" ditandai beserta
        // teks kebutuhannya. Semua identitas pesan disisipkan di awal isi
        // pesan agar langsung terbaca di halaman detail Pesan Masuk admin.
        $serviceLabel = $validated['service'] === 'custom'
            ? 'Lainnya / Custom: ' . $validated['custom_service']
            : $validated['service'];

        $header = array_filter([
            'Kebutuhan Layanan: ' . $serviceLabel,
            $validated['company'] !== null && $validated['company'] !== ''
                ? 'Nama Perusahaan: ' . $validated['company']
                : null,
        ]);

        ContactMessage::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            // Subjek tidak lagi ditanyakan di formulir; nilainya diturunkan dari
            // layanan yang dipilih agar daftar Pesan Masuk tetap terbaca.
            'subject' => ($validated['subject'] ?? '') !== ''
                ? $validated['subject']
                : ($validated['service'] === 'custom' ? 'Lainnya / Custom' : $validated['service']),
            'message' => implode("\n", array_merge($header, ['', $validated['message']])),
        ]);

        // Flash dikirim pada respons redirect yang tetap berada di halaman
        // formulir, lalu ditampilkan frontend sebagai toast in-app.
        return back()->with(
            'success',
            'Permintaan konsultasi berhasil dikirim. Tim kami akan segera menghubungi Anda.',
        );
    }
}
