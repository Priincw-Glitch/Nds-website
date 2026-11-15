<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\PromoResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Promo untuk pelanggan: daftar promo aktif publik + promo yang ditetapkan
 * Admin ke pelanggan ini (promo_purchases). Customer tidak dapat mengubah
 * apa pun dari daftar ini — sama dengan portal web.
 */
class PromoController extends Controller
{
    /**
     * Promo aktif yang tayang saat ini.
     */
    public function index(Request $request): JsonResponse
    {
        $query = \App\Models\Promo::active()->with('category');

        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $query->where(fn ($builder) => $builder
                ->where('title', 'like', "%{$q}%")
                ->orWhere('description', 'like', "%{$q}%"));
        }

        $promos = $query->orderBy('sort_order')->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15) ?: 15);

        return response()->json([
            'data' => PromoResource::collection($promos->items()),
            'meta' => [
                'current_page' => $promos->currentPage(),
                'last_page' => $promos->lastPage(),
                'per_page' => $promos->perPage(),
                'total' => $promos->total(),
            ],
        ]);
    }

    public function show(\App\Models\Promo $promo): JsonResponse
    {
        if (! $promo->is_active) {
            return response()->json(['message' => 'Promo tidak ditemukan.'], 404);
        }

        return response()->json(['data' => new PromoResource($promo->load('category'))]);
    }

    /**
     * Promo milik pelanggan ini (ditetapkan Admin, dari promo_purchases).
     */
    public function mine(Request $request): JsonResponse
    {
        $purchases = $request->user()
            ->promoPurchases()
            ->with(['promo.category'])
            ->orderByDesc('purchase_date')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $purchases->map(fn ($p) => [
                'id' => $p->id,
                'promo' => $p->promo ? new PromoResource($p->promo) : null,
                'purchase_date' => $p->purchase_date?->toDateString(),
                'status' => $p->status,
                'notes' => $p->notes,
            ]),
        ]);
    }
}
