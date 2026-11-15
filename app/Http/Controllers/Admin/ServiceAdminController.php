<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceRequest;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Manajemen Layanan: admin mengelola informasi dasar layanan saja.
 *
 * Konten detail halaman (hero, section, FAQ, benefits, proses) berasal dari
 * service_sections dan preset developer, sehingga tidak ada field konten
 * yang disentuh dari sini. Update hanya mengubah kolom yang dikirim form.
 */
class ServiceAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Service::query();

        if ($request->filled('q')) {
            $q = $request->input('q');
            $query->where(fn ($builder) => $builder->where('name', 'like', "%{$q}%")->orWhere('slug', 'like', "%{$q}%"));
        }

        $services = $query->orderBy('sort_order')->orderBy('name')->paginate(10)->withQueryString();

        return Inertia::render('Admin/Services/Index', [
            'services' => $services,
            'filters' => $request->only(['q']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Services/Form', ['service' => null]);
    }

    public function store(StoreServiceRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $data['slug'] = $this->uniqueSlug($data['name']);
        $data['is_published'] = $request->boolean('is_published');
        $data['sort_order'] = $data['sort_order'] ?? 0;

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('services', 'public');
        }

        Service::create($data);
        Cache::forget('home_data');

        return redirect()->route('admin.services.index')->with('success', 'Layanan berhasil ditambahkan.');
    }

    public function edit(Service $service): Response
    {
        return Inertia::render('Admin/Services/Form', ['service' => $service]);
    }

    public function update(StoreServiceRequest $request, Service $service): RedirectResponse
    {
        $data = $request->validated();

        // Slug tidak ikut berubah agar URL halaman layanan tetap stabil.
        $data['is_published'] = $request->boolean('is_published');
        $data['sort_order'] = $data['sort_order'] ?? $service->sort_order;

        if ($request->hasFile('image')) {
            if ($service->image) {
                Storage::disk('public')->delete($service->image);
            }
            $data['image'] = $request->file('image')->store('services', 'public');
        }

        $service->update($data);
        Cache::forget('home_data');

        return redirect()->route('admin.services.index')->with('success', 'Layanan berhasil diperbarui.');
    }

    public function destroy(Service $service): RedirectResponse
    {
        // Relasi layanan pelanggan memakai cascade di database: menghapus layanan
        // akan ikut menghapus data langganan pelanggan. Tolak sebelum terjadi.
        if ($service->customerServices()->exists() || $service->customerRegistrations()->exists()) {
            return redirect()->route('admin.services.index')
                ->with('error', 'Layanan ini masih terhubung dengan data layanan pelanggan atau pendaftaran. Lepaskan relasinya terlebih dahulu sebelum menghapus.');
        }

        if ($service->image) {
            Storage::disk('public')->delete($service->image);
        }
        $service->delete();
        Cache::forget('home_data');

        return redirect()->route('admin.services.index')->with('success', 'Layanan berhasil dihapus.');
    }

    /**
     * Slug unik dari nama layanan; dipakai saat membuat layanan baru.
     */
    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'layanan';
        $slug = $base;
        $suffix = 2;

        while (Service::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
