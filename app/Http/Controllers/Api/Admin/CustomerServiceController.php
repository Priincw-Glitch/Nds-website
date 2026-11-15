<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerServiceResource;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Langganan layanan per pelanggan (customer_services) untuk aplikasi
 * mobile admin. Perubahan status mengirim notifikasi ke pelanggan,
 * mengikuti perilaku CustomerServiceManagementController web.
 */
class CustomerServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CustomerService::with(['service', 'user.customerProfile']);

        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->input('user_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $query->where(function ($builder) use ($q) {
                $builder->where('service_name', 'like', "%{$q}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%"));
            });
        }

        $services = $query->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15) ?: 15);

        return response()->json([
            'data' => CustomerServiceResource::collection($services->items()),
            'meta' => [
                'current_page' => $services->currentPage(),
                'last_page' => $services->lastPage(),
                'per_page' => $services->perPage(),
                'total' => $services->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $customerService = CustomerService::create($data);

        ActivityLog::log('customer_service_created', "Admin assigned service via mobile: {$customerService->service_name}", $customerService);

        return response()->json([
            'message' => 'Layanan pelanggan berhasil ditambahkan.',
            'data' => new CustomerServiceResource($customerService->load('service')),
        ], 201);
    }

    public function update(Request $request, CustomerService $customerService): JsonResponse
    {
        $data = $this->validated($request);

        $oldStatus = $customerService->status;
        $customerService->update($data);

        if ($customerService->status !== $oldStatus) {
            Notification::create([
                'user_id' => $customerService->user_id,
                'type' => $customerService->status === 'active' ? 'service_activated' : 'service_status_changed',
                'title' => $customerService->status === 'active' ? 'Layanan Anda Aktif' : 'Status Layanan Diperbarui',
                'message' => $customerService->status === 'active'
                    ? "Layanan {$customerService->service_name} telah diaktifkan."
                    : "Status layanan {$customerService->service_name} kini \"{$customerService->status}\".",
                'data' => ['customer_service_id' => $customerService->id, 'status' => $customerService->status],
            ]);
        }

        ActivityLog::log('customer_service_updated', "Admin updated customer service via mobile: {$customerService->service_name}", $customerService);

        return response()->json([
            'message' => 'Layanan pelanggan berhasil diperbarui.',
            'data' => new CustomerServiceResource($customerService->load('service')),
        ]);
    }

    public function destroy(CustomerService $customerService): JsonResponse
    {
        ActivityLog::log('customer_service_deleted', "Admin deleted customer service via mobile: {$customerService->service_name}", $customerService);
        $customerService->delete();

        return response()->json(['message' => 'Layanan pelanggan berhasil dihapus.']);
    }

    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:customer_services,id'],
            'status' => ['required', 'in:waiting_activation,active,maintenance,suspended,expired'],
        ]);

        $services = CustomerService::whereIn('id', $request->input('ids'))->get();

        foreach ($services as $service) {
            $oldStatus = $service->status;
            $service->update(['status' => $request->input('status')]);

            if ($service->status !== $oldStatus) {
                Notification::create([
                    'user_id' => $service->user_id,
                    'type' => $service->status === 'active' ? 'service_activated' : 'service_status_changed',
                    'title' => $service->status === 'active' ? 'Layanan Anda Aktif' : 'Status Layanan Diperbarui',
                    'message' => $service->status === 'active'
                        ? "Layanan {$service->service_name} telah diaktifkan."
                        : "Status layanan {$service->service_name} kini \"{$service->status}\".",
                    'data' => ['customer_service_id' => $service->id, 'status' => $service->status],
                ]);
            }
        }

        ActivityLog::log('customer_service_bulk_status', 'Admin bulk-updated status of ' . $services->count() . ' customer services via mobile');

        return response()->json([
            'message' => 'Status ' . $services->count() . ' layanan pelanggan berhasil diperbarui.',
        ]);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'service_name' => ['required', 'string', 'max:255'],
            'package_type' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:waiting_activation,active,maintenance,suspended,expired'],
            'activated_at' => ['nullable', 'date'],
            'expired_at' => ['nullable', 'date'],
            'technical_info' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
