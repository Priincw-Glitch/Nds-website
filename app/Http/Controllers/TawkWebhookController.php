<?php

namespace App\Http\Controllers;

use App\Events\TawkChatReceived;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TawkWebhookController extends Controller
{
    /**
     * Terima webhook dari Tawk.to (chat:start, chat:end, chat:transcript)
     */
    public function handle(Request $request): JsonResponse
    {
        $secret = config('tawk.webhook_secret');
        $signature = $request->header('X-Tawk-Signature');

        // Verifikasi HMAC-SHA1 signature sesuai dokumentasi resmi Tawk.to
        // (developer.tawk.to/webhooks): digest = hash_hmac('sha1', raw_body, secret),
        // dikirim lewat header X-Tawk-Signature.
        //
        // Fail-closed: tanpa secret terkonfigurasi ATAU tanpa header signature,
        // request tidak dapat diverifikasi dan wajib ditolak (audit B2).
        if (empty($secret)) {
            Log::warning('Tawk webhook: TAWK_WEBHOOK_SECRET tidak terkonfigurasi');
            return response()->json(['ok' => false, 'error' => 'unauthorized'], 401);
        }

        if (empty($signature)) {
            Log::warning('Tawk webhook: header X-Tawk-Signature hilang');
            return response()->json(['ok' => false, 'error' => 'invalid_signature'], 401);
        }

        $expected = hash_hmac('sha1', $request->getContent(), $secret);
        if (!is_string($signature) || !hash_equals($expected, strtolower($signature))) {
            Log::warning('Tawk webhook: signature tidak valid');
            return response()->json(['ok' => false, 'error' => 'invalid_signature'], 401);
        }

        $payload = $request->all();
        $event = $payload['event'] ?? '';
        $chatId = $payload['chatId'] ?? null;

        if (!$chatId) {
            return response()->json(['ok' => true]);
        }

        match ($event) {
            'chat:start' => $this->handleChatStart($payload, $chatId),
            'chat:end' => $this->handleChatEnd($payload, $chatId),
            'chat:transcript' => $this->handleTranscript($payload, $chatId),
            default => null,
        };

        return response()->json(['ok' => true]);
    }

    private function handleChatStart(array $payload, string $chatId): void
    {
        // Simpan chat baru (belum ada pesan)
        $exists = ContactMessage::where('tawk_chat_id', $chatId)->exists();
        if ($exists) return;

        $message = $payload['message'] ?? [];
        $text = $message['text'] ?? '(Chat dimulai)';

        $contactMessage = ContactMessage::create([
            'name' => 'Live Chat Visitor',
            'email' => null,
            'phone' => null,
            'subject' => 'Live Chat (Tawk.to)',
            'message' => $text,
            'status' => 'unread',
            'source' => 'tawk',
            'tawk_chat_id' => $chatId,
        ]);

        $this->broadcast($contactMessage);
    }

    private function handleChatEnd(array $payload, string $chatId): void
    {
        $contactMessage = ContactMessage::where('tawk_chat_id', $chatId)->first();
        if (!$contactMessage) {
            // Belum ada record, buat baru
            $visitor = $payload['visitor'] ?? [];
            $contactMessage = ContactMessage::create([
                'name' => $visitor['name'] ?? 'Live Chat Visitor',
                'email' => $visitor['email'] ?? null,
                'phone' => null,
                'subject' => 'Live Chat (Tawk.to) — Selesai',
                'message' => '(Chat selesai tanpa transcript)',
                'status' => 'unread',
                'source' => 'tawk',
                'tawk_chat_id' => $chatId,
            ]);
            $this->broadcast($contactMessage);
        }
    }

    private function handleTranscript(array $payload, string $chatId): void
    {
        $messages = $payload['messages'] ?? [];
        $visitor = $payload['visitor'] ?? [];

        // Kumpulkan pesan visitor
        $visitorMessages = [];
        $agentMessages = [];
        foreach ($messages as $msg) {
            $type = $msg['type'] ?? '';
            $text = $msg['text'] ?? '';
            if ($type === 'visitor') {
                $visitorMessages[] = $text;
            } elseif ($type === 'agent') {
                $agentMessages[] = "[Agent] " . $text;
            }
        }

        $combined = implode("\n", array_merge($visitorMessages, $agentMessages));
        if (empty($combined)) {
            $combined = '(Transcript kosong)';
        }

        $contactMessage = ContactMessage::where('tawk_chat_id', $chatId)->first();

        if ($contactMessage) {
            // Update dengan transcript lengkap
            $contactMessage->update([
                'name' => $visitor['name'] ?? $contactMessage->name,
                'email' => $visitor['email'] ?? $contactMessage->email,
                'message' => $combined,
            ]);
        } else {
            $contactMessage = ContactMessage::create([
                'name' => $visitor['name'] ?? 'Live Chat Visitor',
                'email' => $visitor['email'] ?? null,
                'phone' => null,
                'subject' => 'Live Chat (Tawk.to)',
                'message' => $combined,
                'status' => 'unread',
                'source' => 'tawk',
                'tawk_chat_id' => $chatId,
            ]);
            $this->broadcast($contactMessage);
        }
    }

    private function broadcast(ContactMessage $message): void
    {
        try {
            event(new TawkChatReceived([
                'tawk_chat_id' => $message->tawk_chat_id,
                'name' => $message->name,
                'created_at' => $message->created_at->toIso8601String(),
            ]));
        } catch (\Throwable $e) {
            Log::warning('Tawk broadcast gagal: ' . $e->getMessage());
        }
    }
}
