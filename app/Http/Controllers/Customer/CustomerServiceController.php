<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\CustomerService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerServiceController extends Controller
{
    /**
     * Display customer services
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $services = CustomerService::where('user_id', $user->id)
            ->with('service.category')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Customer/Services/Index', [
            'services' => $services,
        ]);
    }

    /**
     * Show service detail
     */
    public function show(Request $request, CustomerService $customerService)
    {
        // Ensure user can only view their own service
        if ($customerService->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized access.');
        }

        $customerService->load(['service.category', 'supportTickets' => function($query) {
            $query->orderBy('created_at', 'desc')->limit(10);
        }]);

        return Inertia::render('Customer/Services/Show', [
            'customerService' => $customerService,
        ]);
    }
}
