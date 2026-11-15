<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\CustomerRegistration;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CustomerAuthController extends Controller
{
    /**
     * Show registration form
     */
    public function showRegister()
    {
        $services = Service::published()->orderBy('name')->get();

        return Inertia::render('Customer/Register', [
            'services' => $services,
        ]);
    }

    /**
     * Handle registration
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:customer_registrations|unique:users',
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'city' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'postal_code' => 'nullable|string|max:10',
            'service_id' => 'required|exists:services,id',
            'service_details' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $registration = CustomerRegistration::create($request->all());

        // Log activity (without user_id since not logged in)
        ActivityLog::create([
            'action' => 'customer_registration',
            'model_type' => CustomerRegistration::class,
            'model_id' => $registration->id,
            'description' => "New customer registration: {$request->name}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()->route('customer.register.success');
    }

    /**
     * Show registration success
     */
    public function registrationSuccess()
    {
        return Inertia::render('Customer/RegisterSuccess');
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        // Log activity before logout
        ActivityLog::log('logout', 'Customer logged out');

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
