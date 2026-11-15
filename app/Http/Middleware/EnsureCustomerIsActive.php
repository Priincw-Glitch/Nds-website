<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCustomerIsActive
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Check if user is logged in
        if (!$user) {
            return redirect()->route('login');
        }

        // Check if user is customer
        if (!$user->isCustomer()) {
            abort(403, 'Unauthorized access.');
        }

        // Check if account is active
        if (!$user->isActive()) {
            auth()->logout();
            return redirect()->route('login')
                ->with('error', 'Akun Anda belum aktif atau telah ditangguhkan. Silakan hubungi admin.');
        }

        return $next($request);
    }
}
