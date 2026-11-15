<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

/**
 * Test verifikasi signature webhook Tawk.to (audit B2).
 *
 * Bukan secret asli — fixture khusus testing.
 * Database: sqlite in-memory (phpunit.xml), tidak menyentuh DB lokal/produksi.
 */
class TawkWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const TEST_SECRET = 'unit-test-webhook-secret';

    private function signed(string $body): string
    {
        return hash_hmac('sha1', $body, self::TEST_SECRET);
    }

    public function test_rejects_when_secret_not_configured(): void
    {
        config()->set('tawk.webhook_secret', null);

        $response = $this->postJson('/webhooks/tawk', ['event' => 'chat:start']);

        $response->assertStatus(401)
            ->assertJson(['ok' => false, 'error' => 'unauthorized']);

        $this->assertDatabaseCount('contact_messages', 0);
    }

    public function test_rejects_when_signature_header_missing(): void
    {
        config()->set('tawk.webhook_secret', self::TEST_SECRET);

        $response = $this->postJson('/webhooks/tawk', ['event' => 'chat:start']);

        $response->assertStatus(401)
            ->assertJson(['ok' => false, 'error' => 'invalid_signature']);

        $this->assertDatabaseCount('contact_messages', 0);
    }

    public function test_rejects_invalid_signature(): void
    {
        config()->set('tawk.webhook_secret', self::TEST_SECRET);

        $payload = [
            'event' => 'chat:start',
            'chatId' => 'chat-invalid-sig',
            'message' => ['text' => 'halo', 'type' => 'msg'],
        ];

        $body = json_encode($payload);

        // Panjanghex 40 tapi salah — mensimulasikan signature yang tidak cocok
        $badSignature = str_repeat('0', 40);

        $response = $this->postJson(
            '/webhooks/tawk',
            $payload,
            ['X-Tawk-Signature' => $badSignature],
        );

        $response->assertStatus(401)
            ->assertJson(['ok' => false, 'error' => 'invalid_signature']);

        $this->assertDatabaseCount('contact_messages', 0);
    }

    public function test_accepts_valid_signature_and_stores_message(): void
    {
        config()->set('tawk.webhook_secret', self::TEST_SECRET);
        Event::fake(); // broadcast tidak boleh keluar jaringan saat test

        $payload = [
            'event' => 'chat:start',
            'chatId' => 'chat-valid-sig-001',
            'message' => ['text' => 'Halo, saya mau tanya layanan NDS.', 'type' => 'msg'],
        ];

        $signature = $this->signed(json_encode($payload));

        $response = $this->postJson(
            '/webhooks/tawk',
            $payload,
            ['X-Tawk-Signature' => $signature],
        );

        $response->assertStatus(200)->assertJson(['ok' => true]);

        $this->assertDatabaseHas('contact_messages', [
            'source' => 'tawk',
            'tawk_chat_id' => 'chat-valid-sig-001',
            'status' => 'unread',
        ]);
    }

    public function test_accepts_uppercase_signature(): void
    {
        config()->set('tawk.webhook_secret', self::TEST_SECRET);
        Event::fake();

        $payload = [
            'event' => 'chat:start',
            'chatId' => 'chat-valid-sig-002',
            'message' => ['text' => 'test uppercase', 'type' => 'msg'],
        ];

        $signature = strtoupper($this->signed(json_encode($payload)));

        $response = $this->postJson(
            '/webhooks/tawk',
            $payload,
            ['X-Tawk-Signature' => $signature],
        );

        $response->assertStatus(200)->assertJson(['ok' => true]);
    }
}
