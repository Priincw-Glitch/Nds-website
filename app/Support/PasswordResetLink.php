<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;

/**
 * Pengirim tautan reset password bersama, dipakai dua alur: lupa password
 * publik dan kirim-ulang tautan pembuatan sandi oleh admin.
 *
 * Pengiriman harus gagal jelas saat SMTP menolak pesan: driver log dalam
 * rantai mailer menyamarkan kegagalan sebagai sukses tanpa pengiriman.
 */
class PasswordResetLink
{
    /**
     * @return string Status Password::... saat permintaan diterima (termasuk
     *                 RESET_THROTTLED), atau null saat pengiriman gagal;
     *                 token sisa ikut dibersihkan agar tidak menggantung.
     */
    public static function send(string $email): ?string
    {
        config(['mail.default' => 'smtp']);

        try {
            return Password::sendResetLink(['email' => $email]);
        } catch (\Throwable $e) {
            Log::error('SMTP/Mail delivery failure during password reset: ' . $e->getMessage(), [
                'email' => $email,
                'exception' => $e,
            ]);

            // Bersihkan token yang sempat tersimpan jika pengiriman email gagal
            if ($user = Password::broker()->getUser(['email' => $email])) {
                Password::broker()->getRepository()->delete($user);
            }

            return null;
        }
    }
}
