<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\CustomerService;
use App\Models\Notification;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CustomerServiceManagementController extends Controller
{
    /**
     * Display customer services list
     */
    public function index(Request $request)
    {
        $query = CustomerService::with(['user', 'service']);

        // Filter by customer
        if ($request->filled('customer_id')) {
            $query->where('user_id', $request->customer_id);
        }

        // Filter by service
        if ($request->filled('service_id')) {
            $query->where('service_id', $request->service_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Search
        if ($request->filled('search')) {
            $query->whereHas('user', function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $customerServices = $query->orderBy('created_at', 'desc')->paginate(15);

        // Get filters data
        $customers = User::where('role', 'customer')->orderBy('name')->get();
        $services = Service::published()->orderBy('name')->get();

        return Inertia::render('Admin/CustomerServices/Index', [
            'customerServices' => $customerServices,
            'customers' => $customers,
            'services' => $services,
            'filters' => $request->only(['customer_id', 'service_id', 'status', 'search']),
        ]);
    }

    /**
     * Show create form
     */
    public function create()
    {
        $customers = User::where('role', 'customer')
            ->where('status', 'active')
            ->orderBy('name')
            ->get();
        
        $services = Service::published()->orderBy('name')->get();

        return Inertia::render('Admin/CustomerServices/Create', [
            'customers' => $customers,
            'services' => $services,
        ]);
    }

    /**
     * Store new customer service
     */
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'service_id' => 'required|exists:services,id',
            'package_type' => 'nullable|string|max:255',
            'status' => 'required|in:waiting_activation,active,maintenance,suspended,expired',
            'activated_at' => 'nullable|date',
            'expired_at' => 'nullable|date|after:activated_at',
            'technical_info' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $service = Service::findOrFail($request->service_id);

            $customerService = CustomerService::create([
                'user_id' => $request->user_id,
                'service_id' => $request->service_id,
                'service_name' => $service->name,
                'package_type' => $request->package_type,
                'status' => $request->status,
                'activated_at' => $request->activated_at,
                'expired_at' => $request->expired_at,
                'technical_info' => $request->technical_info,
                'notes' => $request->notes,
            ]);

            // Create notification for customer
            if ($request->status === 'active') {
                Notification::create([
                    'user_id' => $request->user_id,
                    'type' => 'service_activated',
                    'title' => 'Layanan Baru Diaktifkan',
                    'message' => "Layanan {$service->name} telah diaktifkan untuk akun Anda.",
                    'data' => json_encode(['customer_service_id' => $customerService->id]),
                ]);
            }

            // Log activity
            ActivityLog::log('customer_service_created', "Admin created customer service: {$service->name}", $customerService);

            DB::commit();

            return redirect()->route('admin.customer-services.index')
                ->with('success', 'Layanan pelanggan berhasil ditambahkan.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Terjadi kesalahan saat menambahkan layanan.');
        }
    }

    /**
     * Show edit form
     */
    public function edit(CustomerService $customerService)
    {
        $customerService->load(['user', 'service']);

        $customers = User::where('role', 'customer')->orderBy('name')->get();
        $services = Service::published()->orderBy('name')->get();

        return Inertia::render('Admin/CustomerServices/Edit', [
            'customerService' => $customerService,
            'customers' => $customers,
            'services' => $services,
        ]);
    }

    /**
     * Update customer service
     */
    public function update(Request $request, CustomerService $customerService)
    {
        $request->validate([
            'package_type' => 'nullable|string|max:255',
            'status' => 'required|in:waiting_activation,active,maintenance,suspended,expired',
            'activated_at' => 'nullable|date',
            'expired_at' => 'nullable|date|after:activated_at',
            'technical_info' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $oldStatus = $customerService->status;

        $customerService->update([
            'package_type' => $request->package_type,
            'status' => $request->status,
            'activated_at' => $request->activated_at,
            'expired_at' => $request->expired_at,
            'technical_info' => $request->technical_info,
            'notes' => $request->notes,
        ]);

        // Create notification if status changed
        if ($oldStatus !== $request->status) {
            Notification::create([
                'user_id' => $customerService->user_id,
                'type' => 'service_status_changed',
                'title' => 'Status Layanan Berubah',
                'message' => "Status layanan {$customerService->service_name} telah diubah menjadi {$customerService->status_label}.",
                'data' => json_encode([
                    'customer_service_id' => $customerService->id,
                    'old_status' => $oldStatus,
                    'new_status' => $request->status,
                ]),
            ]);
        }

        // Log activity
        ActivityLog::log('customer_service_updated', "Admin updated customer service: {$customerService->service_name}", $customerService);

        return back()->with('success', 'Layanan pelanggan berhasil diperbarui.');
    }

    /**
     * Delete customer service
     */
    public function destroy(CustomerService $customerService)
    {
        $serviceName = $customerService->service_name;
        
        // Log before delete
        ActivityLog::log('customer_service_deleted', "Admin deleted customer service: {$serviceName}", $customerService);

        $customerService->delete();

        return redirect()->route('admin.customer-services.index')
            ->with('success', 'Layanan pelanggan berhasil dihapus.');
    }

    /**
     * Bulk update status
     */
    public function bulkUpdateStatus(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:customer_services,id',
            'status' => 'required|in:waiting_activation,active,maintenance,suspended,expired',
        ]);

        $count = CustomerService::whereIn('id', $request->ids)->update([
            'status' => $request->status,
        ]);

        // Create notifications
        $customerServices = CustomerService::whereIn('id', $request->ids)->get();
        foreach ($customerServices as $cs) {
            Notification::create([
                'user_id' => $cs->user_id,
                'type' => 'service_status_changed',
                'title' => 'Status Layanan Berubah',
                'message' => "Status layanan {$cs->service_name} telah diubah menjadi {$cs->status_label}.",
                'data' => json_encode(['customer_service_id' => $cs->id]),
            ]);
        }

        // Log activity
        ActivityLog::log('customer_services_bulk_update', "Admin bulk updated {$count} customer services to status: {$request->status}");

        return back()->with('success', "{$count} layanan berhasil diperbarui.");
    }
}
