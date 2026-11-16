<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StorageServeTest extends TestCase
{
    /**
     * File yang ada di disk "public" disajikan oleh route fallback dengan
     * konten utuh (dipakai server yang public/storage-nya direktori nyata).
     */
    public function test_serves_existing_file_from_public_disk(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put(
            'promos/banner-uji.png',
            UploadedFile::fake()->image('banner-uji.png')->getContent()
        );

        $response = $this->get('/storage/promos/banner-uji.png');

        $response->assertOk();
        $this->assertStringContainsString('image/', (string) $response->headers->get('Content-Type'));
        $this->assertStringContainsString('max-age=86400', (string) $response->headers->get('Cache-Control'));
    }

    /** File yang tidak ada pada disk menghasilkan 404, bukan halaman error. */
    public function test_returns_404_for_missing_file(): void
    {
        Storage::fake('public');

        $this->get('/storage/promos/tidak-ada.png')->assertNotFound();
    }

    /** Path traversal tidak boleh keluar dari akar disk "public". */
    public function test_blocks_path_traversal(): void
    {
        $this->get('/storage/../../.env')->assertNotFound();
        $this->get('/storage/promos/../../.env')->assertNotFound();
    }

    /** Permintaan direktori, bukan file, juga ditolak. */
    public function test_returns_404_for_directory_path(): void
    {
        Storage::fake('public');
        Storage::disk('public')->makeDirectory('promos');

        $this->get('/storage/promos')->assertNotFound();
    }
}
