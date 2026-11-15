<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MessageAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $query = ContactMessage::query();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('q')) {
            $q = $request->input('q');
            $query->where(fn ($b) => $b->where('name', 'like', "%{$q}%")
                ->orWhere('email', 'like', "%{$q}%")
                ->orWhere('subject', 'like', "%{$q}%"));
        }

        $messages = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Admin/Messages/Index', [
            'messages' => $messages,
            'filters' => $request->only(['q', 'status']),
        ]);
    }

    public function show(ContactMessage $message): Response
    {
        if ($message->status === 'unread') {
            $message->update(['status' => 'read']);
        }

        return Inertia::render('Admin/Messages/Show', [
            'message' => $message,
        ]);
    }

    public function update(Request $request, ContactMessage $message): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:unread,read,replied'],
        ]);

        $message->update($data);
        return back()->with('success', 'Status pesan diperbarui.');
    }

    public function destroy(ContactMessage $message): RedirectResponse
    {
        $message->delete();
        return redirect()->route('admin.messages.index')->with('success', 'Pesan dihapus.');
    }
}
