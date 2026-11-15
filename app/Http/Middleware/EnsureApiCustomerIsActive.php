<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Versi API dari EnsureCustomerIsActive: akun customer harus aktif.
 * Membalas JSON agar aplikasi mobile dapat menangani sesi berakhir.
 */
class EnsureApiCustomerIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Sesi tidak valid. Silakan login kembali.'], 401);
        }

        if (! $user->isCustomer()) {
            return response()->json(['message' => 'Akses ditolak. Halaman ini hanya untuk pelanggan.'], 403);
        }

        if (! $user->isActive()) {
            return response()->json([
                'message' => 'Akun Anda belum aktif atau telah ditangguhkan. Silakan hubungi admin.',
            ], 403);
        }

        return $next($request);
    }
}
