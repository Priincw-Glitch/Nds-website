<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * URL aset untuk respons API mobile: memakai host yang benar-benar dipakai
 * klien saat memanggil API (mis. http://10.0.2.2:8000 dari emulator), bukan
 * APP_URL website, agar gambar tetap termuat di perangkat.
 */
class ApiAsset
{
    public static function url(?Request $request, ?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        $base = $request?->getSchemeAndHttpHost() ?: rtrim(config('app.url'), '/');

        return rtrim($base, '/') . '/storage/' . ltrim($path, '/');
    }
}
