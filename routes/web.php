<?php

use App\Http\Controllers\Admin\ArticleAdminController;
use App\Http\Controllers\Admin\ArticleCategoryAdminController;
use App\Http\Controllers\Admin\CoverageAdminController;
use App\Http\Controllers\Admin\CustomerManagementController;
use App\Http\Controllers\Admin\CustomerServiceManagementController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\FooterSettingController;
use App\Http\Controllers\Admin\MessageAdminController;
use App\Http\Controllers\Admin\PageAdminController;
use App\Http\Controllers\Admin\ProfileAdminController;
use App\Http\Controllers\Admin\PromoAdminController;
use App\Http\Controllers\Admin\ProjectAdminController;
use App\Http\Controllers\Admin\ServiceAdminController;
use App\Http\Controllers\Admin\SettingAdminController;
use App\Http\Controllers\Admin\SupportTicketManagementController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\CoverageController;
use App\Http\Controllers\Customer\CustomerDashboardController;
use App\Http\Controllers\Customer\CustomerNotificationController;
use App\Http\Controllers\Customer\CustomerProfileController;
use App\Http\Controllers\Customer\CustomerPromoController;
use App\Http\Controllers\Customer\CustomerServiceController;
use App\Http\Controllers\Customer\SupportTicketController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\PromoController;
use App\Http\Controllers\ServiceController;
use App\Models\SupportTicket;
use App\Http\Controllers\TawkWebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/about', [HomeController::class, 'about'])->name('about');
Route::get('/privacy', [HomeController::class, 'privacy'])->name('privacy');

// Detail layanan. Tidak ada halaman daftar semua layanan: card di Beranda dan
// tautan di footer langsung menuju halaman detail masing-masing.
Route::get('/services/{slug}', [ServiceController::class, 'show'])->name('services.show');

Route::post('/coverage/check', [CoverageController::class, 'check'])->name('coverage.check');
Route::get('/coverage/suggestions', [CoverageController::class, 'suggestions'])
    ->middleware('throttle:60,1')
    ->name('coverage.suggestions');

Route::get('/promo', [PromoController::class, 'index'])->name('promo');

// Data satu promo aktif untuk popup otomatis di situs publik.
Route::get('/promo-popup', [PromoController::class, 'popup'])->name('promo.popup');

// Detail promo per slug: kartu promo membuka URL ini dan modal detail
// terbuka otomatis di atas katalog, sehingga URL bisa dibagikan langsung.
Route::get('/promo/{slug}', [PromoController::class, 'show'])
    ->where('slug', '[a-z0-9-]+')
    ->name('promo.show');

Route::get('/blog', [BlogController::class, 'index'])->name('blog');
Route::get('/blog/{slug}', [BlogController::class, 'show'])->name('blog.show');

Route::get('/contact', [ContactController::class, 'create'])->name('contact');
Route::post('/contact', [ContactController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('contact.store');

// Tawk.to webhook - tanpa auth (verifikasi via HMAC signature)
Route::post('/webhooks/tawk', [TawkWebhookController::class, 'handle'])
    ->middleware('throttle:60,1')
    ->name('webhooks.tawk');

// Unified Login Route
Route::get('/login', [AuthController::class, 'showLogin'])->name('login')->middleware('guest');
Route::post('/login', [AuthController::class, 'login'])->middleware('guest')->name('login.post');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

// Password Reset (Laravel Password broker)
Route::get('/forgot-password', [PasswordResetController::class, 'requestForm'])
    ->middleware('guest')->name('password.request');
Route::post('/forgot-password', [PasswordResetController::class, 'sendLink'])
    ->middleware(['guest', 'throttle:3,1'])->name('password.email');
Route::get('/reset-password/{token}', [PasswordResetController::class, 'resetForm'])
    ->middleware('guest')->name('password.reset');
Route::post('/reset-password', [PasswordResetController::class, 'reset'])
    ->middleware(['guest', 'throttle:3,1'])->name('password.update');

Route::prefix('admin')->name('admin.')->group(function () {
    Route::middleware(['auth', 'admin'])->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

        // Admin hanya mengelola informasi dasar layanan. Konten detail halaman
        // (service_sections, hero, FAQ) dikelola developer lewat preset.
        // Layanan baru tidak lagi dibuat dari Admin: hanya edit data yang ada.
        Route::resource('services', ServiceAdminController::class)->parameters(['services' => 'service'])
            ->only(['index', 'edit', 'update', 'destroy']);
        // Referensi wilayah Indonesia untuk dropdown bersambung Cakupan Wilayah.
        Route::get('coverages/regions/provinces', [CoverageAdminController::class, 'provinces'])->name('coverages.regions.provinces');
        Route::get('coverages/regions/regencies/{provinceCode}', [CoverageAdminController::class, 'regencies'])
            ->name('coverages.regions.regencies')->whereNumber('provinceCode')->where('provinceCode', '[0-9]{2}');
        Route::get('coverages/regions/districts/{regencyCode}', [CoverageAdminController::class, 'districts'])
            ->name('coverages.regions.districts')->where('regencyCode', '[0-9]{4}');

        Route::resource('coverages', CoverageAdminController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['coverages' => 'coverage']);

        Route::post('promos/{promo}/duplicate', [PromoAdminController::class, 'duplicate'])->name('promos.duplicate');
        Route::resource('promos', PromoAdminController::class)->parameters(['promos' => 'promo'])->except(['show']);

        // Portofolio proyek: tayang di beranda (ProjectsSection), tanpa halaman
        // publik terpisah sehingga show tidak disediakan.
        Route::resource('projects', ProjectAdminController::class)
            ->parameters(['projects' => 'project'])
            ->except(['show']);

        Route::resource('articles', ArticleAdminController::class)->parameters(['articles' => 'article'])->except(['show']);
        Route::resource('article-categories', ArticleCategoryAdminController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['article-categories' => 'category']);

        // Pesan Masuk: pusat percakapan pelanggan (SupportTicket) + arsip
        // formulir kontak publik (ContactMessage) sebagai tab sekunder.
        Route::prefix('messages')->name('messages.')->group(function () {
            Route::get('contacts', [MessageAdminController::class, 'index'])->name('contacts.index');
            Route::get('contacts/{message}', [MessageAdminController::class, 'show'])->name('contacts.show');
            Route::patch('contacts/{message}', [MessageAdminController::class, 'update'])->name('contacts.update');
            Route::delete('contacts/{message}', [MessageAdminController::class, 'destroy'])->name('contacts.destroy');

            Route::get('/', [SupportTicketManagementController::class, 'index'])->name('index');
            Route::get('statistics', [SupportTicketManagementController::class, 'statistics'])->name('statistics');
            Route::get('{ticket}/thread', [SupportTicketManagementController::class, 'messages'])->name('thread')->whereNumber('ticket');
            Route::post('{ticket}/delivered', [SupportTicketManagementController::class, 'markDelivered'])->name('delivered')->whereNumber('ticket');
            Route::post('{ticket}/reply', [SupportTicketManagementController::class, 'reply'])->name('reply')->whereNumber('ticket');
            Route::post('{ticket}/typing', [SupportTicketManagementController::class, 'typing'])->name('typing')->whereNumber('ticket');
            Route::patch('{ticket}/status', [SupportTicketManagementController::class, 'updateStatus'])->name('update-status')->whereNumber('ticket');
            Route::patch('{ticket}/priority', [SupportTicketManagementController::class, 'updatePriority'])->name('update-priority')->whereNumber('ticket');
            Route::patch('{ticket}/assign', [SupportTicketManagementController::class, 'assign'])->name('assign')->whereNumber('ticket');
        });

        // Route lama pusat Support dialihkan ke Pesan Masuk supaya bookmark
        // lama tetap membuka percakapan yang sama (ID tiket dipertahankan).
        Route::get('support', function (Request $request) {
            return redirect()->route(
                'admin.messages.index',
                $request->filled('ticket') ? ['ticket' => $request->ticket] : [],
            );
        })->name('support.index');
        Route::get('support/{ticket}', function (SupportTicket $ticket) {
            return redirect()->route('admin.messages.index', ['ticket' => $ticket->id]);
        })->name('support.show')->whereNumber('ticket');

        // Catatan: grup route legacy admin/support.* telah dibuang karena seluruh
        // endpointnya digantikan oleh admin/messages.* dengan controller yang sama.

        // Halaman statis (Tentang Kami, Kebijakan Privasi)
        Route::get('pages', [PageAdminController::class, 'index'])->name('pages.index');
        Route::get('pages/{page}/edit', [PageAdminController::class, 'edit'])->name('pages.edit');
        Route::put('pages/{page}', [PageAdminController::class, 'update'])->name('pages.update');

        Route::get('settings', [SettingAdminController::class, 'edit'])->name('settings.edit');
        Route::put('settings', [SettingAdminController::class, 'update'])->name('settings.update');

        Route::get('footer-settings', [FooterSettingController::class, 'edit'])->name('footer-settings.edit');
        Route::put('footer-settings', [FooterSettingController::class, 'update'])->name('footer-settings.update');

        Route::get('profile', [ProfileAdminController::class, 'edit'])->name('profile.edit');
        Route::put('profile', [ProfileAdminController::class, 'update'])->name('profile.update');

        // Customer Management
        Route::prefix('customers')->name('customers.')->group(function () {
            Route::get('/', [CustomerManagementController::class, 'index'])->name('index');
            Route::get('create', [CustomerManagementController::class, 'create'])->name('create');
            Route::post('/', [CustomerManagementController::class, 'store'])->name('store');
            Route::get('registrations', [CustomerManagementController::class, 'registrations'])->name('registrations');
            Route::post('registrations/{registration}/approve', [CustomerManagementController::class, 'approveRegistration'])->name('registrations.approve');
            Route::post('registrations/{registration}/reject', [CustomerManagementController::class, 'rejectRegistration'])->name('registrations.reject');
            Route::get('{customer}', [CustomerManagementController::class, 'show'])->name('show');
            Route::put('{customer}', [CustomerManagementController::class, 'update'])->name('update');
            Route::delete('{customer}', [CustomerManagementController::class, 'destroy'])->name('destroy');
            Route::post('{customer}/password-link', [CustomerManagementController::class, 'sendPasswordLink'])
                ->middleware('throttle:6,1')
                ->name('password-link');
        });

        // Customer Service Management
        Route::prefix('customer-services')->name('customer-services.')->group(function () {
            Route::get('/', [CustomerServiceManagementController::class, 'index'])->name('index');
            Route::get('create', [CustomerServiceManagementController::class, 'create'])->name('create');
            Route::post('/', [CustomerServiceManagementController::class, 'store'])->name('store');
            Route::get('{customerService}/edit', [CustomerServiceManagementController::class, 'edit'])->name('edit');
            Route::put('{customerService}', [CustomerServiceManagementController::class, 'update'])->name('update');
            Route::delete('{customerService}', [CustomerServiceManagementController::class, 'destroy'])->name('destroy');
            Route::post('bulk-update-status', [CustomerServiceManagementController::class, 'bulkUpdateStatus'])->name('bulk-update-status');
        });

    });
});

// Customer Portal Routes
// Registrasi publik tidak ada: akun customer hanya dibuat oleh Admin.
Route::prefix('customer')->name('customer.')->group(function () {
    Route::middleware(['auth', 'customer.active'])->group(function () {
        // Dashboard
        Route::get('dashboard', [CustomerDashboardController::class, 'index'])->name('dashboard');

        // My Promo: promo yang ditetapkan Admin
        Route::get('promos', [CustomerPromoController::class, 'index'])->name('promos.index');

        // Layanan pelanggan yang dikelola Admin (menu Layanan Pelanggan)
        Route::get('services', [CustomerServiceController::class, 'index'])->name('services.index');
        Route::get('services/{customerService}', [CustomerServiceController::class, 'show'])->name('services.show');

        // Profile
        Route::get('profile', [CustomerProfileController::class, 'show'])->name('profile');
        Route::put('profile', [CustomerProfileController::class, 'update'])->name('profile.update');
        Route::post('profile/avatar', [CustomerProfileController::class, 'updateAvatar'])->name('profile.avatar');
        Route::put('profile/password', [CustomerProfileController::class, 'updatePassword'])->name('profile.password');

        // Support Chat
        Route::get('support', [SupportTicketController::class, 'index'])->name('support.index');
        Route::post('support', [SupportTicketController::class, 'store'])->name('support.store');
        Route::get('support/{ticket}', [SupportTicketController::class, 'show'])->name('support.show');
        Route::post('support/{ticket}/reply', [SupportTicketController::class, 'reply'])->name('support.reply');
        Route::post('support/{ticket}/typing', [SupportTicketController::class, 'typing'])->name('support.typing');
        Route::get('support-unread', [SupportTicketController::class, 'unreadCount'])->name('support.unread');
        Route::patch('support/{ticket}/close', [SupportTicketController::class, 'close'])->name('support.close');
        Route::get('support/{ticket}/thread', [SupportTicketController::class, 'messages'])->name('support.thread')->whereNumber('ticket');
        Route::post('support/{ticket}/delivered', [SupportTicketController::class, 'markDelivered'])->name('support.delivered')->whereNumber('ticket');

        // Notifications
        Route::get('notifications', [CustomerNotificationController::class, 'index'])->name('notifications.index');
        Route::patch('notifications/{notification}/read', [CustomerNotificationController::class, 'markAsRead'])->name('notifications.read');
        Route::post('notifications/read-all', [CustomerNotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
        Route::get('notifications/unread-count', [CustomerNotificationController::class, 'unreadCount'])->name('notifications.unread-count');
    });
});
