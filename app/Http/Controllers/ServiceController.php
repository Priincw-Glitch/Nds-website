<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\CompanySetting;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function show(string $slug): Response
    {
        $service = Service::published()
            ->where('slug', $slug)
            ->with([
                'category',
                // Section yang tersembunyi tidak ikut ke halaman publik.
                'sections' => fn ($query) => $query->where('is_visible', true)->orderBy('sort_order'),
            ])
            ->firstOrFail();

        // Layanan terkait mengikuti kategori yang sama, lalu urutan tampil admin.
        $related = Service::published()
            ->where('id', '!=', $service->id)
            ->when(
                $service->service_category_id,
                fn ($query) => $query->where('service_category_id', $service->service_category_id),
            )
            ->orderBy('sort_order')
            ->limit(3)
            ->get(['id', 'name', 'slug', 'icon', 'short_description']);

        if ($related->count() < 3) {
            $more = Service::published()
                ->where('id', '!=', $service->id)
                ->whereNotIn('id', $related->pluck('id'))
                ->orderBy('sort_order')
                ->limit(3 - $related->count())
                ->get(['id', 'name', 'slug', 'icon', 'short_description']);
            $related = $related->merge($more);
        }

        return Inertia::render('ServiceDetail', [
            'service' => $service,
            'related' => $related,
            'settings' => CompanySetting::allSettings(),
        ]);
    }
}
