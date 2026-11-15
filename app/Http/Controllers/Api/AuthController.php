<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Autentikasi API mobile (Sanctum): satu titik login untuk admin dan
 * pelanggan. Role dan status akun divalidasi di sisi Laravel, bukan di
 * aplikasi. Logika pembatasan mengikuti AuthController web.
 */
class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        // Akun tanpa role yang dikenal (mis. akun sistem) tidak boleh masuk aplikasi mobile.
        if (! in_array($user->role, ['admin', 'customer'], true)) {
            throw ValidationException::withMessages([
                'email' => ['Akun ini tidak memiliki akses ke aplikasi mobile.'],
            ]);
        }

        // Paritas dengan EnsureCustomerIsActive di web: pelanggan harus aktif.
        if ($user->isCustomer() && ! $user->isActive()) {
            throw ValidationException::withMessages([
                'email' => ['Akun Anda belum aktif atau telah ditangguhkan. Silakan hubungi admin.'],
            ]);
        }

        $token = $user->createToken($request->input('device_name', 'nds-mobile'));

        $user->load('customerProfile');

        return response()->json([
            'token' => $token->plainTextToken,
            'user' => new UserResource($user),
        ]);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->load('customerProfile'));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logout berhasil.']);
    }
}
