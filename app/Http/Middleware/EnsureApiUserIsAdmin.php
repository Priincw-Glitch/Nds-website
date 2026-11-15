<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Versi API dari EnsureUserIsAdmin: membalas JSON 401/403, bukan redirect
 * ke halaman login, karena dikonsumsi aplikasi mobile.
 */
class EnsureApiUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Sesi tidak valid. Silakan login kembali.'], 401);
        }

        if (! $user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak. Halaman ini hanya untuk admin.'], 403);
        }

        return $next($request);
    }
}
