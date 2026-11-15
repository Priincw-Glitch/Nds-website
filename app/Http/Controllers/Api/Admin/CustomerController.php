<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\CustomerProfile;
use App\Models\CustomerRegistration;
use App\Models\Notification;
use App\Models\PromoPurchase;
use App\Models\User;
use App\Support\PasswordResetLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/**
 * Manajemen pelanggan via aplikasi mobile admin. Alur pembuatan akun
 * (tanpa kata sandi, tautan sekali pakai via email) identik dengan
 * CustomerManagementController web.
 */
class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'customer')->with('customerProfile');

        if ($request->filled('q')) {
            $q = trim($request->input('q'));
            $query->where(function ($builder) use ($q) {
                $builder->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $customers = $query->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15) ?: 15);

        return response()->json([
            'data' => CustomerResource::collection($customers->items()),
            'meta' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
            ],
        ]);
    }

    public function show(User $customer): JsonResponse
    {
        if ($customer->role !== 'customer') {
            return response()->json(['message' => 'Data pelanggan tidak ditemukan.'], 404);
        }

        $customer->load([
            'customerProfile',
            'promoPurchases.promo.category',
            'customerServices.service',
            'supportTickets' => fn ($query) => $query->orderByDesc('created_at')->limit(10),
            'activityLogs' => fn ($query) => $query->orderByDesc('created_at')->limit(20),
        ]);

        return response()->json(['data' => new CustomerResource($customer)]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:10',
            'status' => 'required|in:active,pending,suspended,inactive',
            'promo_id' => 'nullable|exists:promos,id',
            'purchase_date' => 'nullable|required_with:promo_id|date',
            'purchase_status' => 'nullable|required_with:promo_id|in:pending,paid,cancelled',
            'purchase_notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // Kata sandi awal acak yang tidak pernah ditampilkan ke siapa pun;
            // pelanggan membuat sendiri lewat tautan reset sekali pakai.
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make(Str::random(40)),
                'role' => 'customer',
                'status' => $request->status,
            ]);

            $code = CustomerProfile::where('customer_code', 'like', 'USER%')
                ->selectRaw("MAX(CAST(SUBSTRING(customer_code, 5) AS UNSIGNED)) as max_seq")
                ->value('max_seq');
            $customerCode = 'USER' . str_pad((string) ((int) ($code ?? 0) + 1), 3, '0', STR_PAD_LEFT);

            CustomerProfile::create([
                'user_id' => $user->id,
                'customer_code' => $customerCode,
                'address' => $request->address,
                'city' => $request->city,
                'province' => $request->province,
                'postal_code' => $request->postal_code,
            ]);

            if ($request->filled('promo_id')) {
                PromoPurchase::create([
                    'user_id' => $user->id,
                    'promo_id' => $request->promo_id,
                    'purchase_date' => $request->purchase_date,
                    'status' => $request->purchase_status,
                    'notes' => $request->purchase_notes,
                ]);
            }

            Notification::create([
                'user_id' => $user->id,
                'type' => 'account_activated',
                'title' => 'Akun Anda Telah Dibuat',
                'message' => 'Akun pelanggan Anda telah dibuat oleh admin. Buka tautan pembuatan kata sandi yang kami kirim ke email Anda untuk membuat kata sandi sendiri.',
            ]);

            ActivityLog::log('customer_created', "Admin created customer account via mobile: {$user->name}", $user);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Terjadi kesalahan saat membuat akun pelanggan.'], 500);
        }

        $invited = $this->sendPasswordSetupLink($user);

        return response()->json([
            'message' => $invited
                ? "Akun pelanggan berhasil dibuat. Tautan pembuatan kata sandi telah dikirim ke {$user->email}."
                : 'Akun pelanggan berhasil dibuat, tetapi email tautan kata sandi gagal dikirim. Periksa konfigurasi email lalu gunakan tombol kirim tautan kata sandi.',
            'email_sent' => $invited,
            'data' => new CustomerResource($user->load('customerProfile')),
        ], 201);
    }

    public function update(Request $request, User $customer): JsonResponse
    {
        if ($customer->role !== 'customer') {
            return response()->json(['message' => 'Data pelanggan tidak ditemukan.'], 404);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'status' => 'required|in:active,pending,suspended,inactive',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:10',
        ]);

        $customer->update([
            'name' => $request->name,
            'phone' => $request->phone,
            'status' => $request->status,
        ]);

        CustomerProfile::updateOrCreate(
            ['user_id' => $customer->id],
            [
                'address' => $request->address,
                'city' => $request->city,
                'province' => $request->province,
                'postal_code' => $request->postal_code,
            ]
        );

        ActivityLog::log('customer_updated', "Admin updated customer via mobile: {$customer->name}", $customer);

        return response()->json([
            'message' => 'Data pelanggan berhasil diperbarui.',
            'data' => new CustomerResource($customer->load('customerProfile')),
        ]);
    }

    public function destroy(User $customer): JsonResponse
    {
        if ($customer->role !== 'customer') {
            return response()->json(['message' => 'Data pelanggan tidak ditemukan.'], 404);
        }

        ActivityLog::log('customer_deleted', "Admin deleted customer via mobile: {$customer->name}", $customer);
        $customer->delete();

        return response()->json(['message' => 'Pelanggan berhasil dihapus.']);
    }

    public function sendPasswordLink(User $customer): JsonResponse
    {
        if ($customer->role !== 'customer') {
            return response()->json(['message' => 'Data pelanggan tidak ditemukan.'], 404);
        }

        $sent = $this->sendPasswordSetupLink($customer);

        ActivityLog::log('password_link_sent', "Admin mengirim tautan pembuatan kata sandi via mobile: {$customer->name}", $customer);

        return response()->json([
            'message' => $sent
                ? "Tautan pembuatan kata sandi dikirim ke {$customer->email}."
                : 'Tautan gagal dikirim. Periksa konfigurasi email (SMTP) lalu coba lagi.',
            'email_sent' => $sent,
        ]);
    }

    /**
     * Pendaftaran mandiri dari website yang menunggu persetujuan admin.
     */
    public function registrations(Request $request): JsonResponse
    {
        $query = CustomerRegistration::with('service');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $registrations = $query->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15) ?: 15);

        return response()->json([
            'data' => $registrations->through(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'email' => $r->email,
                'phone' => $r->phone,
                'address' => $r->address,
                'city' => $r->city,
                'province' => $r->province,
                'postal_code' => $r->postal_code,
                'service' => $r->service ? ['id' => $r->service->id, 'name' => $r->service->name] : null,
                'service_details' => $r->service_details,
                'notes' => $r->notes,
                'status' => $r->status,
                'rejection_reason' => $r->rejection_reason,
                'created_at' => $r->created_at?->toIso8601String(),
            ])->toArray(),
            'meta' => [
                'current_page' => $registrations->currentPage(),
                'last_page' => $registrations->lastPage(),
                'per_page' => $registrations->perPage(),
                'total' => $registrations->total(),
            ],
        ]);
    }

    public function approveRegistration(Request $request, CustomerRegistration $registration): JsonResponse
    {
        if ($registration->status !== 'pending') {
            return response()->json(['message' => 'Pendaftaran ini sudah diproses.'], 422);
        }

        DB::beginTransaction();

        try {
            $user = User::create([
                'name' => $registration->name,
                'email' => $registration->email,
                'phone' => $registration->phone,
                'password' => Hash::make(Str::random(40)),
                'role' => 'customer',
                'status' => 'active',
            ]);

            CustomerProfile::create([
                'user_id' => $user->id,
                'address' => $registration->address,
                'city' => $registration->city,
                'province' => $registration->province,
                'postal_code' => $registration->postal_code,
                'notes' => $registration->notes,
            ]);

            $registration->update([
                'status' => 'approved',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

            Notification::create([
                'user_id' => $user->id,
                'type' => 'account_activated',
                'title' => 'Akun Anda Telah Diaktifkan',
                'message' => 'Selamat! Pendaftaran Anda telah disetujui. Buka tautan pembuatan kata sandi yang kami kirim ke email Anda untuk mulai masuk ke portal pelanggan.',
            ]);

            ActivityLog::log('registration_approved', "Admin approved registration via mobile: {$registration->name}", $registration);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Terjadi kesalahan saat menyetujui pendaftaran.'], 500);
        }

        $invited = $this->sendPasswordSetupLink($user);

        return response()->json([
            'message' => $invited
                ? "Pendaftaran berhasil disetujui. Tautan pembuatan kata sandi telah dikirim ke {$user->email}."
                : 'Pendaftaran disetujui, tetapi email tautan kata sandi gagal dikirim. Periksa konfigurasi email lalu kirim ulang dari halaman pelanggan.',
            'email_sent' => $invited,
        ]);
    }

    public function rejectRegistration(Request $request, CustomerRegistration $registration): JsonResponse
    {
        $request->validate(['rejection_reason' => 'required|string']);

        if ($registration->status !== 'pending') {
            return response()->json(['message' => 'Pendaftaran ini sudah diproses.'], 422);
        }

        $registration->update([
            'status' => 'rejected',
            'rejection_reason' => $request->rejection_reason,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        ActivityLog::log('registration_rejected', "Admin rejected registration via mobile: {$registration->name}", $registration);

        return response()->json(['message' => 'Pendaftaran berhasil ditolak.']);
    }

    /**
     * Tautan reset sekali pakai dengan masa berlaku dari password broker.
     * Jalur pengiriman dipinjam dari helper lupa password agar perilaku
     * SMTP dan pembersihan token identik di kedua alur.
     */
    protected function sendPasswordSetupLink(User $user): bool
    {
        $status = PasswordResetLink::send($user->email);

        return $status !== null
            && in_array($status, [Password::RESET_LINK_SENT, Password::RESET_THROTTLED], true);
    }
}
