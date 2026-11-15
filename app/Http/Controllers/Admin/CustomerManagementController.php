<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\CustomerProfile;
use App\Models\CustomerRegistration;
use App\Models\Notification;
use App\Models\PromoPurchase;
use App\Models\User;
use App\Support\PasswordResetLink;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CustomerManagementController extends Controller
{
    /**
     * Display customer list
     */
    public function index(Request $request)
    {
        $query = User::where('role', 'customer')
            ->with('customerProfile');

        // Search
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $customers = $query->orderBy('created_at', 'desc')->paginate(15);

        return Inertia::render('Admin/Customers/Index', [
            'customers' => $customers,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show customer detail
     */
    public function show(User $customer)
    {
        $customer->load([
            'customerProfile',
            'promoPurchases.promo.category',
            'customerServices.service',
            'supportTickets' => function($query) {
                $query->orderBy('created_at', 'desc')->limit(10);
            },
            'activityLogs' => function($query) {
                $query->orderBy('created_at', 'desc')->limit(20);
            }
        ]);

        return Inertia::render('Admin/Customers/Show', [
            'customer' => $customer,
            'purchases' => $this->purchasesFor($customer),
        ]);
    }

    /**
     * Promo yang dibeli customer, dipetakan ke bentuk yang dipakai UI.
     */
    protected function purchasesFor(User $customer): array
    {
        return $customer->promoPurchases
            ->map(fn ($p) => [
                'id' => $p->id,
                'promo' => $p->promo ? [
                    'id' => $p->promo->id,
                    'title' => $p->promo->title,
                    'image' => $p->promo->image,
                    'description' => $p->promo->description,
                    'category' => $p->promo->category ? ['id' => $p->promo->category->id, 'name' => $p->promo->category->name] : null,
                    'discount_type' => $p->promo->discount_type,
                    'original_price' => $p->promo->original_price,
                    'discount_percentage' => $p->promo->discount_percentage,
                    'discount_amount' => $p->promo->discount_amount,
                    'final_price' => $p->promo->final_price,
                ] : null,
                'purchase_date' => $p->purchase_date?->toDateString(),
                'status' => $p->status,
                'notes' => $p->notes,
            ])
            ->all();
    }

    /**
     * Daftar promo aktif untuk pemilihan di form pembuatan Customer.
     * Sumber data sama dengan halaman Promo & Diskon (tabel promos).
     */
    public function create()
    {
        $promos = \App\Models\Promo::active()
            ->with('category')
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get(['id', 'title', 'service_category_id', 'discount_type', 'original_price', 'discount_percentage', 'discount_amount', 'final_price', 'is_active', 'start_date', 'end_date']);

        return Inertia::render('Admin/Customers/Create', [
            'promos' => $promos,
            'nextCustomerCode' => $this->nextCustomerCode(),
        ]);
    }

    /**
     * Create customer account manually
     */
    public function store(Request $request)
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

            // Create customer profile with unique customer code
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

            // Promo yang dipilih Admin saat pembuatan akun
            if ($request->filled('promo_id')) {
                PromoPurchase::create([
                    'user_id' => $user->id,
                    'promo_id' => $request->promo_id,
                    'purchase_date' => $request->purchase_date,
                    'status' => $request->purchase_status,
                    'notes' => $request->purchase_notes,
                ]);
            }

            // Notifikasi tanpa kredensial: pelanggan membuat kata sandi sendiri.
            Notification::create([
                'user_id' => $user->id,
                'type' => 'account_activated',
                'title' => 'Akun Anda Telah Dibuat',
                'message' => 'Akun pelanggan Anda telah dibuat oleh admin. Buka tautan pembuatan kata sandi yang kami kirim ke email Anda untuk membuat kata sandi sendiri.',
            ]);

            // Log activity
            ActivityLog::log('customer_created', "Admin created customer account: {$user->name}", $user);

            DB::commit();

            $invited = $this->sendPasswordSetupLink($user);

            return redirect()->route('admin.customers.show', $user)->with(
                $invited ? 'success' : 'error',
                $invited
                    ? "Akun pelanggan berhasil dibuat. Tautan pembuatan kata sandi telah dikirim ke {$user->email}."
                    : 'Akun pelanggan berhasil dibuat, tetapi email tautan kata sandi gagal dikirim. Periksa konfigurasi email lalu gunakan tombol "Kirim Tautan Kata Sandi" di halaman pelanggan.'
            );

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Terjadi kesalahan saat membuat akun pelanggan.');
        }
    }

    /**
     * Update customer
     */
    public function update(Request $request, User $customer)
    {
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

        // Log activity
        ActivityLog::log('customer_updated', "Admin updated customer: {$customer->name}", $customer);

        return back()->with('success', 'Data pelanggan berhasil diperbarui.');
    }

    /**
     * Delete customer
     */
    public function destroy(User $customer)
    {
        $name = $customer->name;
        
        // Log before delete
        ActivityLog::log('customer_deleted', "Admin deleted customer: {$name}", $customer);

        $customer->delete();

        return redirect()->route('admin.customers.index')
            ->with('success', 'Pelanggan berhasil dihapus.');
    }

    /**
     * Kirim ulang tautan pembuatan kata sandi dari halaman detail pelanggan.
     */
    public function sendPasswordLink(User $customer)
    {
        if ($customer->role !== 'customer') {
            abort(404);
        }

        $sent = $this->sendPasswordSetupLink($customer);

        ActivityLog::log('password_link_sent', "Admin mengirim tautan pembuatan kata sandi: {$customer->name}", $customer);

        return $sent
            ? back()->with('success', "Tautan pembuatan kata sandi dikirim ke {$customer->email}.")
            : back()->with('error', 'Tautan gagal dikirim. Periksa konfigurasi email (SMTP) lalu coba lagi.');
    }

    /**
     * Tautan reset sekali pakai dengan masa berlaku dari password broker
     * (default 60 menit). Kata sandi tidak pernah dibuat, dikirim, atau disimpan
     * dalam bentuk terbaca.
     */
    protected function sendPasswordSetupLink(User $user): bool
    {
        // Jalur pengiriman dipinjam dari helper lupa password agar perilaku
        // SMTP dan pembersihan token identik di kedua alur.
        $status = PasswordResetLink::send($user->email);

        // Throttled berarti tautan sebelumnya masih berlaku.
        return $status !== null
            && in_array($status, [Password::RESET_LINK_SENT, Password::RESET_THROTTLED], true);
    }

    /**
     * Customer ID berikutnya (USER001, USER002, ...) dihitung di database
     * dalam transaksi yang sama dengan pembuatan akun, jadi tidak mungkin duplikat.
     */
    protected function nextCustomerCode(): string
    {
        $maxSeq = (int) (\App\Models\CustomerProfile::where('customer_code', 'like', 'USER%')
            ->selectRaw("MAX(CAST(SUBSTRING(customer_code, 5) AS UNSIGNED)) as max_seq")
            ->value('max_seq') ?? 0);

        return 'USER' . str_pad((string) ($maxSeq + 1), 3, '0', STR_PAD_LEFT);
    }

    /**
     * Display customer registrations
     */
    public function registrations(Request $request)
    {
        $query = CustomerRegistration::with('service');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $registrations = $query->orderBy('created_at', 'desc')->paginate(15);

        return Inertia::render('Admin/Customers/Registrations', [
            'registrations' => $registrations,
            'filters' => $request->only(['status']),
        ]);
    }

    /**
     * Approve registration
     */
    public function approveRegistration(Request $request, CustomerRegistration $registration)
    {
        if ($registration->status !== 'pending') {
            return back()->with('error', 'Pendaftaran ini sudah diproses.');
        }

        DB::beginTransaction();

        try {
            // Kata sandi acak tanpa pernah ditampilkan; pelanggan memakai tautan reset.
            $user = User::create([
                'name' => $registration->name,
                'email' => $registration->email,
                'phone' => $registration->phone,
                'password' => Hash::make(Str::random(40)),
                'role' => 'customer',
                'status' => 'active',
            ]);

            // Create customer profile
            CustomerProfile::create([
                'user_id' => $user->id,
                'address' => $registration->address,
                'city' => $registration->city,
                'province' => $registration->province,
                'postal_code' => $registration->postal_code,
                'notes' => $registration->notes,
            ]);

            // Update registration status
            $registration->update([
                'status' => 'approved',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

            // Create notification for customer
            Notification::create([
                'user_id' => $user->id,
                'type' => 'account_activated',
                'title' => 'Akun Anda Telah Diaktifkan',
                'message' => 'Selamat! Pendaftaran Anda telah disetujui. Buka tautan pembuatan kata sandi yang kami kirim ke email Anda untuk mulai masuk ke portal pelanggan.',
            ]);

            // Log activity
            ActivityLog::log('registration_approved', "Admin approved registration: {$registration->name}", $registration);

            DB::commit();

            $invited = $this->sendPasswordSetupLink($user);

            return back()->with(
                $invited ? 'success' : 'error',
                $invited
                    ? "Pendaftaran berhasil disetujui. Tautan pembuatan kata sandi telah dikirim ke {$user->email}."
                    : 'Pendaftaran disetujui, tetapi email tautan kata sandi gagal dikirim. Periksa konfigurasi email lalu kirim ulang dari halaman pelanggan.'
            );

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Terjadi kesalahan saat menyetujui pendaftaran.');
        }
    }

    /**
     * Reject registration
     */
    public function rejectRegistration(Request $request, CustomerRegistration $registration)
    {
        $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        if ($registration->status !== 'pending') {
            return back()->with('error', 'Pendaftaran ini sudah diproses.');
        }

        $registration->update([
            'status' => 'rejected',
            'rejection_reason' => $request->rejection_reason,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        // Log activity
        ActivityLog::log('registration_rejected', "Admin rejected registration: {$registration->name}", $registration);

        // Note: In production, send email notification
        return back()->with('success', 'Pendaftaran berhasil ditolak.');
    }
}
