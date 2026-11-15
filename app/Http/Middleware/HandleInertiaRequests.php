<?php

namespace App\Http\Middleware;

use App\Models\CompanySetting;
use App\Models\ContactMessage;
use App\Models\Service;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'settings' => CompanySetting::allSettings(),
            // Menu layanan pada navbar mengikuti data Admin Panel (hanya yang tayang),
            // supaya tautan tidak pernah menunjuk layanan yang sudah dihapus/dinonaktifkan.
            'navServices' => fn () => Service::published()
                ->with('category:id,name,slug,sort_order')
                ->orderBy('sort_order')
                ->get(['id', 'name', 'slug', 'icon', 'service_category_id']),
            // Jumlah pesan belum dibaca, hanya untuk sesi administrator
            'unreadMessages' => $user ? ContactMessage::where('status', 'unread')->count() : 0,
        ];
    }
}
