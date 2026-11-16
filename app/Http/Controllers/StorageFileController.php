<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Fallback penyajian file disk "public" melalui Laravel.
 *
 * Server produksi mengekspos website pada subfolder /portal dengan
 * public/storage sebagai direktori nyata, bukan symbolic link. File yang
 * sudah tersalin ke sana dilayani langsung oleh web server, sedangkan
 * file yang belum (hasil upload terbaru di storage/app/public) jatuh ke
 * route ini lewat fallback rewrite, sehingga URL /storage/{path} tetap
 * valid tanpa memindahkan atau menggandakan file apa pun.
 */
class StorageFileController extends Controller
{
    public function show(string $path): StreamedResponse|Response
    {
        $path = ltrim(str_replace('\\', '/', $path), '/');

        // Blokir traversal: tanpa ini, ../ bisa keluar dari disk public.
        if ($path === '' || str_contains($path, '..')) {
            abort(404);
        }

        $disk = Storage::disk('public');

        if (! $disk->fileExists($path)) {
            abort(404);
        }

        // Nama file dari store() selalu unik (hash acak) dan tidak pernah
        // ditimpa, jadi respons boleh di-cache peramban.
        return $disk->response($path, null, [
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
