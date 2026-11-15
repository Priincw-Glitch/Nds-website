<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Katalog layanan untuk aplikasi mobile: hanya layanan yang tayang di
 * website. Sumber data dan aturan tayang sama dengan ServiceController web.
 */
class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Service::published()->with('category');

        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $query->where(fn ($builder) => $builder
                ->where('name', 'like', "%{$q}%")
                ->orWhere('short_description', 'like', "%{$q}%"));
        }

        if ($request->filled('category')) {
            $query->where('service_category_id', (int) $request->input('category'));
        }

        if ($request->boolean('featured')) {
            $query->featured();
        }

        $services = $query->orderBy('sort_order')->orderBy('name')
            ->paginate($request->integer('per_page', 15) ?: 15);

        return response()->json([
            'data' => ServiceResource::collection($services->items()),
            'meta' => [
                'current_page' => $services->currentPage(),
                'last_page' => $services->lastPage(),
                'per_page' => $services->perPage(),
                'total' => $services->total(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $service = Service::published()
            ->with(['category', 'sections' => fn ($q) => $q->where('is_visible', true)->orderBy('sort_order')])
            ->where('slug', $slug)
            ->first();

        if (! $service) {
            return response()->json(['message' => 'Layanan tidak ditemukan.'], 404);
        }

        return response()->json(['data' => new ServiceResource($service)]);
    }
}
