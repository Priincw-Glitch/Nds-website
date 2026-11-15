<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\PasswordResetLink;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetController extends Controller
{
    /**
     * Show the forgot password page
     */
    public function requestForm(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Send the reset link to the registered active email
     */
    public function sendLink(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        // Password reset harus gagal jelas saat SMTP menolak pesan; lihat
        // App\Support\PasswordResetLink.
        $status = PasswordResetLink::send($request->input('email'));

        if ($status === null) {
            return back()->withErrors([
                'email' => 'Terjadi kendala saat mengirim email reset kata sandi. Silakan coba beberapa saat lagi.',
            ]);
        }

        if ($status === Password::RESET_THROTTLED) {
            return back()->withErrors([
                'email' => __('passwords.throttled') ?: 'Silakan tunggu sebelum mencoba lagi.',
            ]);
        }

        // Pesan respons sengaja netral: tidak membuka siapa yang terdaftar.
        return back()->with('status', 'Jika email tersebut terdaftar, tautan reset password telah dikirim. Silakan periksa inbox atau folder spam.');
    }

    /**
     * Show the reset password page
     */
    public function resetForm(Request $request, string $token): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => $request->query('email', ''),
        ]);
    }

    /**
     * Finish the password reset
     */
    public function reset(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', \Illuminate\Validation\Rules\Password::defaults()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => \Illuminate\Support\Facades\Hash::make($password),
                ])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return redirect()->route('login')->with('status', 'Kata sandi berhasil direset. Silakan login dengan kata sandi baru Anda.');
        }

        return back()->withErrors(['email' => __($status)]);
    }
}
