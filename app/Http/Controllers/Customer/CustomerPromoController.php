<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerPromoController extends Controller
{
    /**
     * Promo yang ditetapkan Admin ke customer ini. Data promo diambil dari
     * sumber yang sama dengan halaman Promo & Diskon (tabel promos);
     * customer tidak dapat mengubah apa pun dari halaman ini.
     */
    public function index(Request $request): Response
    {
        $purchases = $request->user()
            ->promoPurchases()
            ->with(['promo.category'])
            ->orderByDesc('purchase_date')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Customer/MyPromo', [
            'purchases' => $purchases,
        ]);
    }
}
