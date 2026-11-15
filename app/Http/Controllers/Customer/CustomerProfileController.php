<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\CustomerProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class CustomerProfileController extends Controller
{
    /**
     * Show profile page
     */
    public function show(Request $request)
    {
        $user = $request->user()->load('customerProfile');

        return Inertia::render('Customer/Profile', [
            'user' => $user,
        ]);
    }

    /**
     * Update profile
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:10',
            'notes' => 'nullable|string',
        ]);

        // Update user basic info
        $user->update([
            'name' => $request->name,
            'phone' => $request->phone,
        ]);

        // Update or create customer profile
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

        // Log activity
        ActivityLog::log('profile_update', 'Customer updated profile information', $user);

        return back()->with('success', 'Profil berhasil diperbarui.');
    }

    /**
     * Update avatar
     */
    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $user = $request->user();

        // Delete old avatar
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        // Store new avatar
        $path = $request->file('avatar')->store('avatars', 'public');

        $user->update(['avatar' => $path]);

        // Log activity
        ActivityLog::log('avatar_update', 'Customer updated avatar', $user);

        return back()->with('success', 'Foto profil berhasil diperbarui.');
    }

    /**
     * Update password
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = $request->user();

        // Check current password
        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors([
                'current_password' => 'Password saat ini tidak sesuai.',
            ]);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Log activity
        ActivityLog::log('password_change', 'Customer changed password', $user);

        return back()->with('success', 'Password berhasil diperbarui.');
    }
}
