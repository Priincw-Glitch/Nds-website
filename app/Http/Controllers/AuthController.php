<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Show the login page
     */
    public function showLogin(Request $request): Response|RedirectResponse
    {
        // If user is already logged in, redirect to appropriate dashboard
        if ($request->user()) {
            return $this->redirectByUserRole($request->user());
        }

        return Inertia::render('Login', [
            'status' => session('status'),
        ]);
    }

    /**
     * Handle login request
     */
    public function login(Request $request): RedirectResponse
    {
        $key = 'login:' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            return back()->withErrors([
                'email' => 'Terlalu banyak percobaan login. Silakan coba lagi dalam ' . RateLimiter::availableIn($key) . ' detik.',
            ]);
        }

        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();
            RateLimiter::clear($key);

            $user = $request->user();
            Log::info('Login berhasil', ['email' => $user->email, 'role' => $user->role]);
            return $this->redirectByUserRole($user);
        }

        RateLimiter::hit($key, 300);

        // Bedakan "kredensial salah" dari "akun ada tapi tidak bisa dipakai"
        // supaya diagnosa (password vs role vs status) tidak membingungkan.
        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            Log::warning('Login gagal: kredensial salah', ['email' => $credentials['email']]);
            return back()->withErrors([
                'email' => 'Email atau password salah.',
            ])->onlyInput('email');
        }

        if ($user->status !== 'active') {
            Log::warning('Login gagal: akun tidak aktif', ['email' => $user->email, 'status' => $user->status]);
            return back()->withErrors([
                'email' => "Password benar, tetapi akun ini berstatus \"{$user->status}\". Silakan hubungi administrator untuk mengaktifkannya.",
            ])->onlyInput('email');
        }

        Log::warning('Login gagal: role tidak dikenali', ['email' => $user->email, 'role' => $user->role]);
        return back()->withErrors([
            'email' => 'Password benar, tetapi akun ini belum memiliki hak akses yang valid. Silakan hubungi administrator.',
        ])->onlyInput('email');
    }

    /**
     * Handle logout
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        
        return redirect()->route('login');
    }

    /**
     * Redirect user based on their role
     */
    protected function redirectByUserRole($user): RedirectResponse
    {
        if ($user->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        if ($user->isCustomer()) {
            if (!$user->isActive()) {
                Auth::logout();
                return redirect()->route('login')->with(
                    'error',
                    "Akun Anda berstatus \"{$user->status}\". Silakan hubungi admin untuk pengaktifan akun.",
                );
            }
            return redirect()->route('customer.dashboard');
        }

        // Unknown role - logout
        Auth::logout();
        return redirect()->route('login')->with('error', 'Anda tidak memiliki akses ke sistem.');
    }
}