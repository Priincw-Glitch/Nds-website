<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContactMessageResource;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Arsip pesan masuk (form kontak + chat Tawk.to) untuk aplikasi mobile.
 * Status dan penanganan mengikuti MessageAdminController web.
 */
class MessageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ContactMessage::query();

        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $query->where(fn ($builder) => $builder
                ->where('name', 'like', "%{$q}%")
                ->orWhere('email', 'like', "%{$q}%")
                ->orWhere('subject', 'like', "%{$q}%")
                ->orWhere('message', 'like', "%{$q}%"));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('source')) {
            $query->where('source', $request->input('source'));
        }

        $messages = $query->latest()
            ->paginate($request->integer('per_page', 15) ?: 15);

        return response()->json([
            'data' => ContactMessageResource::collection($messages->items()),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ]);
    }

    public function show(ContactMessage $message): JsonResponse
    {
        // Pesan yang dibuka dari aplikasi langsung berstatus terbaca,
        // seperti perilaku halaman detail web.
        if ($message->status === 'unread') {
            $message->update(['status' => 'read']);
        }

        return response()->json(['data' => new ContactMessageResource($message)]);
    }

    public function updateStatus(Request $request, ContactMessage $message): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:unread,read,replied'],
        ]);

        $message->update(['status' => $request->input('status')]);

        return response()->json([
            'message' => 'Status pesan berhasil diperbarui.',
            'data' => new ContactMessageResource($message),
        ]);
    }

    public function destroy(ContactMessage $message): JsonResponse
    {
        $message->delete();

        return response()->json(['message' => 'Pesan berhasil dihapus.']);
    }
}
