<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Mencegah MIME-type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Membatasi informasi yang dikirim ke situs lain melalui header Referer
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Mencegah clickjacking (frame-ancestors via CSP, dan X-Frame-Options sebagai fallback)
        $response->headers->set('X-Frame-Options', 'DENY');

        $isDev = app()->environment('local', 'development');

        // Alamat Vite dev server yang diizinkan (hanya development, IPv4 only)
        if ($isDev) {
            $viteHttp = [
                'http://127.0.0.1:5173',
            ];
            $viteWs = [
                'ws://127.0.0.1:5173',
            ];
        } else {
            $viteHttp = [];
            $viteWs = [];
        }

        // Reverb WebSocket host dari konfigurasi .env. Klien memakai nilai
        // VITE_REVERB_* hasil build, yang bisa berbeda scheme/port dari
        // REVERB_* di server; izinkan keduanya agar koneksi tidak diblokir CSP.
        $reverbHost = config('services.reverb.host', '127.0.0.1');
        $reverbPorts = array_unique([
            (string) config('services.reverb.port', 8080),
            (string) env('VITE_REVERB_PORT', config('services.reverb.port', 8080)),
        ]);
        $reverbOrigins = [];
        foreach ($reverbPorts as $port) {
            $reverbOrigins[] = "ws://{$reverbHost}:{$port}";
            $reverbOrigins[] = "wss://{$reverbHost}:{$port}";
            $reverbOrigins[] = "http://{$reverbHost}:{$port}";
            $reverbOrigins[] = "https://{$reverbHost}:{$port}";
        }

        // Susun setiap directive CSP secara terpisah, kemudian gabungkan dengan titik koma
        $cspParts = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' " . implode(' ', array_merge([
                'https://embed.tawk.to',
                'https://cdn.tawk.to',
                'https://*.tawk.to',
                'https://cdn.jsdelivr.net',
                'https://fonts.googleapis.com',
                'https://fonts.bunny.net',
            ], $viteHttp)),
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.bunny.net https://*.tawk.to",
            "img-src 'self' data: https: blob:",
            "font-src 'self' https://fonts.gstatic.com https://fonts.bunny.net https://embed.tawk.to",
            "connect-src 'self' " . implode(' ', array_merge([
                'https://embed.tawk.to',
                'https://cdn.tawk.to',
                'https://va.tawk.to',
                'wss://*.tawk.to',
                'https://*.tawk.to',
                'https://fonts.googleapis.com',
                'https://fonts.bunny.net',
            ], $viteHttp, $viteWs, $reverbOrigins)),
            "frame-src https://embed.tawk.to https://cdn.tawk.to https://*.tawk.to",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ];

        $response->headers->set('Content-Security-Policy', implode('; ', $cspParts));

        // Hanya aktifkan HSTS jika menggunakan HTTPS (production)
        if ($request->secure() || str_contains($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '', 'https')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        // Permissions-Policy: batasi fitur browser yang tidak dibutuhkan
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

        return $response;
    }
}
