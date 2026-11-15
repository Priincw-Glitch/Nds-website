<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\CompanySetting;

class TawkService
{
    private string $propertyId;
    private string $secretKey;

    public function __construct()
    {
        // Widget live chat membaca ID properti dari Pengaturan Situs (DB);
        // polling API memakai nilai yang sama, .env hanya fallback agar
        // instalasi yang belum mengisi pengaturan tetap jalan.
        $this->propertyId = (string) (CompanySetting::get('tawk_property_id') ?: config('tawk.property_id', ''));
        $this->secretKey = (string) config('tawk.secret_key', '');
    }

    public function isConfigured(): bool
    {
        return !empty($this->propertyId) && !empty($this->secretKey);
    }

    /**
     * Ambil daftar chat dari Tawk.to API
     */
    public function getChats(int $limit = 20): array
    {
        if (!$this->isConfigured()) {
            return [];
        }

        try {
            $response = Http::withHeaders([
                'X-Api-Key' => $this->secretKey,
            ])->timeout(15)->get('https://api.tawk.to/v1/chat/chats', [
                'propertyId' => $this->propertyId,
                'limit' => $limit,
                'sortDirection' => -1,
            ]);

            if ($response->failed()) {
                Log::warning('Tawk API error: ' . $response->status() . ' ' . $response->body());
                return [];
            }

            $data = $response->json();
            return $data['data'] ?? $data['chats'] ?? $data ?? [];
        } catch (\Throwable $e) {
            Log::warning('Tawk API exception: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Ambil pesan dalam satu chat
     */
    public function getChatMessages(string $chatId): array
    {
        if (!$this->isConfigured()) {
            return [];
        }

        try {
            $response = Http::withHeaders([
                'X-Api-Key' => $this->secretKey,
            ])->timeout(15)->get("https://api.tawk.to/v1/chat/chats/{$chatId}", [
                'propertyId' => $this->propertyId,
            ]);

            if ($response->failed()) {
                return [];
            }

            $data = $response->json();
            return $data['messages'] ?? $data['data']['messages'] ?? [];
        } catch (\Throwable $e) {
            return [];
        }
    }
}
