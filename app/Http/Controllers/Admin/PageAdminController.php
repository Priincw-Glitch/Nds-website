<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Support\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PageAdminController extends Controller
{
    /**
     * Daftar halaman yang isinya bisa dikelola admin.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/Pages/Index', [
            'pages' => Page::orderBy('title')
                ->get(['id', 'slug', 'title', 'is_published', 'updated_at']),
        ]);
    }

    public function edit(Page $page): Response
    {
        return Inertia::render('Admin/Pages/Edit', [
            'page' => $page->only([
                'id', 'slug', 'title', 'hero_title', 'hero_description',
                'content', 'image', 'is_published', 'updated_at',
            ]),
        ]);
    }

    public function update(Request $request, Page $page): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'hero_title' => ['nullable', 'string', 'max:255'],
            'hero_description' => ['nullable', 'string', 'max:2000'],
            'content' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:4096'],
            'is_published' => ['nullable', 'boolean'],
        ], [
            'title.required' => 'Judul halaman wajib diisi.',
        ]);

        $page->title = $data['title'];
        $page->hero_title = $data['hero_title'] ?? null;
        $page->hero_description = $data['hero_description'] ?? null;
        // Konten disimpan sudah bersih: hanya tag allowlist editor yang lolos.
        $page->content = HtmlSanitizer::clean($data['content'] ?? null);
        $page->is_published = $request->boolean('is_published');

        if ($request->hasFile('image')) {
            if ($page->image) {
                Storage::disk('public')->delete($page->image);
            }

            $page->image = $request->file('image')->store('pages', 'public');
        } elseif ($request->boolean('remove_image') && $page->image) {
            Storage::disk('public')->delete($page->image);
            $page->image = null;
        }

        $page->save();

        return redirect()
            ->route('admin.pages.edit', $page)
            ->with('success', 'Halaman berhasil diperbarui.');
    }
}
