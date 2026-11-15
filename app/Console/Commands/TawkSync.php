<?php

namespace App\Console\Commands;

use App\Events\TawkChatReceived;
use App\Models\ContactMessage;
use App\Services\TawkService;
use Illuminate\Console\Command;

class TawkSync extends Command
{
    protected $signature = 'tawk:sync';
    protected $description = 'Sinkronkan chat Tawk.to ke Pesan Admin';

    public function handle(TawkService $tawk): int
    {
        if (!$tawk->isConfigured()) {
            $this->warn('Tawk.to belum dikonfigurasi. Set TAWK_PROPERTY_ID dan TAWK_SECRET_KEY di .env');
            return self::SUCCESS;
        }

        $chats = $tawk->getChats(20);
        $this->info('Menerima ' . count($chats) . ' chat dari Tawk.to API');

        $newCount = 0;

        foreach ($chats as $chat) {
            $chatId = $chat['chatId'] ?? $chat['_id'] ?? null;
            if (!$chatId) continue;

            // Skip jika sudah ada
            $exists = ContactMessage::where('tawk_chat_id', $chatId)->exists();
            if ($exists) continue;

            $visitor = $chat['visitor'] ?? [];
            $name = $visitor['name'] ?? $chat['name'] ?? 'Tawk Visitor';
            $email = $visitor['email'] ?? null;

            // Ambil pesan terakhir
            $messages = $chat['messages'] ?? [];
            $lastMessage = '';
            if (!empty($messages)) {
                $last = end($messages);
                $lastMessage = is_array($last) ? ($last['text'] ?? $last['message'] ?? json_encode($last)) : (string) $last;
            }

            // Format semua pesan visitor
            $visitorMessages = [];
            foreach ($messages as $msg) {
                if (is_array($msg) && (($msg['source'] ?? '') === 'visitor' || ($msg['type'] ?? '') === 'visitor')) {
                    $visitorMessages[] = $msg['text'] ?? $msg['message'] ?? '';
                }
            }
            $messageText = !empty($visitorMessages)
                ? implode("\n", array_filter($visitorMessages))
                : $lastMessage;

            $contactMessage = ContactMessage::create([
                'name' => $name,
                'email' => $email,
                'phone' => null,
                'subject' => 'Live Chat (Tawk.to)',
                'message' => $messageText ?: '(Chat tanpa pesan teks)',
                'status' => 'unread',
                'source' => 'tawk',
                'tawk_chat_id' => $chatId,
            ]);

            $newCount++;

            // Broadcast real-time ke admin
            try {
                event(new TawkChatReceived([
                    'tawk_chat_id' => $chatId,
                    'name' => $name,
                    'created_at' => $contactMessage->created_at->toIso8601String(),
                ]));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Tawk broadcast gagal: ' . $e->getMessage());
            }
        }

        $this->info("Selesai. {$newCount} chat baru tersimpan.");
        return self::SUCCESS;
    }
}
