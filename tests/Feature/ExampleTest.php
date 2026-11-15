<?php

namespace Tests\Feature;

// phpunit.xml memaksa sqlite :memory: untuk semua test — halaman depan
// membaca tabel (services, settings, ...) jadi schema harus diberikan
// via migrasi in-memory (RefreshDatabase), bukan DB lokal/produksi.
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
