<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\CustomerProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules;

/**
 * Profil pelanggan via API mobile — aturan sama dengan
 * CustomerProfileController web.
 */
class ProfileController extends Controller
{
    public function show(Request $request): UserResource
    {
        return new UserResource($request->user()->load('customerProfile'));
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:10',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();

        $user->update([
            'name' => $request->name,
            'phone' => $request->phone,
        ]);

        CustomerProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'address' => $request->address,
                'city' => $request->city,
                'province' => $request->province,
                'postal_code' => $request->postal_code,
                'notes' => $request->notes,
            ]
        );

        ActivityLog::log('profile_update', 'Customer updated profile via mobile', $user);

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'data' => new UserResource($user->fresh()->load('customerProfile')),
        ]);
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        ActivityLog::log('avatar_update', 'Customer updated avatar via mobile', $user);

        return response()->json([
            'message' => 'Foto profil berhasil diperbarui.',
            'data' => new UserResource($user->fresh()),
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Password saat ini tidak sesuai.',
                'errors' => ['current_password' => ['Password saat ini tidak sesuai.']],
            ], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        ActivityLog::log('password_change', 'Customer changed password via mobile', $user);

        return response()->json(['message' => 'Password berhasil diperbarui.']);
    }
}
