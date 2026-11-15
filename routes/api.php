<?php

use App\Http\Controllers\Api\Admin\ArticleCategoryController;
use App\Http\Controllers\Api\Admin\ArticleController;
use App\Http\Controllers\Api\Admin\ConsultationController as AdminConsultationController;
use App\Http\Controllers\Api\Admin\CoverageController;
use App\Http\Controllers\Api\Admin\CustomerController;
use App\Http\Controllers\Api\Admin\CustomerServiceController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\MessageController;
use App\Http\Controllers\Api\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Api\Admin\ProjectController;
use App\Http\Controllers\Api\Admin\PromoController as AdminPromoController;
use App\Http\Controllers\Api\Admin\ServiceCategoryController;
use App\Http\Controllers\Api\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Customer\ConsultationController as CustomerConsultationController;
use App\Http\Controllers\Api\Customer\DashboardController as CustomerDashboardController;
use App\Http\Controllers\Api\Customer\NotificationController;
use App\Http\Controllers\Api\Customer\ProfileController as CustomerProfileController;
use App\Http\Controllers\Api\Customer\PromoController as CustomerPromoController;
use App\Http\Controllers\Api\ServiceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API NDS Mobile (Sanctum)
|--------------------------------------------------------------------------
| REST API untuk aplikasi mobile NDS. Memakai controller terpisah dari
| website; seluruh aturan bisnis, validasi, dan otorisasi tetap di
| Laravel. Endpoint admin dilindungi auth:sanctum + api.admin; endpoint
| pelanggan dilindungi auth:sanctum + api.customer.active.
*/

Route::get('/ping', fn () => response()->json(['ok' => true, 'service' => 'nds-api', 'time' => now()->toIso8601String()]));

// Autentikasi: satu titik login admin & pelanggan.
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Katalog layanan tayang: bisa dibaca admin maupun pelanggan.
    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/services/{slug}', [ServiceController::class, 'show']);
});

// ---------------------------------------------------------------------------
// Panel Admin
// ---------------------------------------------------------------------------
Route::prefix('admin')
    ->middleware(['auth:sanctum', 'api.admin'])
    // Prefix nama route: nama apiResource (services.show, articles.index, dst)
    // tanpa prefix ini bentrok dengan route website publik yang bernama sama,
    // dan Ziggy di frontend bisa salah membuat URL layanan.
    ->name('api.admin.')
    ->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);

        // Layanan
        Route::apiResource('services', AdminServiceController::class);

        // Kategori layanan
        Route::get('service-categories', [ServiceCategoryController::class, 'index']);
        Route::post('service-categories', [ServiceCategoryController::class, 'store']);
        Route::put('service-categories/{category}', [ServiceCategoryController::class, 'update']);
        Route::delete('service-categories/{category}', [ServiceCategoryController::class, 'destroy']);

        // Cakupan wilayah + referensi wilayah Indonesia
        Route::get('coverages/regions/provinces', [CoverageController::class, 'provinces']);
        Route::get('coverages/regions/regencies/{provinceCode}', [CoverageController::class, 'regencies']);
        Route::get('coverages/regions/districts/{regencyCode}', [CoverageController::class, 'districts']);
        Route::apiResource('coverages', CoverageController::class);

        // Portofolio proyek
        Route::apiResource('projects', ProjectController::class);

        // Artikel blog + kategori
        Route::apiResource('articles', ArticleController::class);
        Route::get('article-categories', [ArticleCategoryController::class, 'index']);
        Route::post('article-categories', [ArticleCategoryController::class, 'store']);
        Route::put('article-categories/{category}', [ArticleCategoryController::class, 'update']);
        Route::delete('article-categories/{category}', [ArticleCategoryController::class, 'destroy']);

        // Promo + kategori
        Route::post('promos/{promo}/duplicate', [AdminPromoController::class, 'duplicate']);
        Route::apiResource('promos', AdminPromoController::class)->except(['show']);
        Route::get('promos/{promo}', [AdminPromoController::class, 'show']);

        // Pesan masuk (form kontak + Tawk.to)
        Route::get('messages', [MessageController::class, 'index']);
        Route::get('messages/{message}', [MessageController::class, 'show']);
        Route::put('messages/{message}/status', [MessageController::class, 'updateStatus']);
        Route::delete('messages/{message}', [MessageController::class, 'destroy']);

        // Konsultasi pelanggan (support tickets)
        Route::get('consultations', [AdminConsultationController::class, 'index']);
        Route::get('consultations/statistics', [AdminConsultationController::class, 'statistics']);
        Route::get('consultations/admins', [AdminConsultationController::class, 'admins']);
        Route::get('consultations/{ticket}', [AdminConsultationController::class, 'show']);
        Route::get('consultations/{ticket}/messages', [AdminConsultationController::class, 'messages']);
        Route::post('consultations/{ticket}/reply', [AdminConsultationController::class, 'reply']);
        Route::post('consultations/{ticket}/delivered', [AdminConsultationController::class, 'markDelivered']);
        Route::put('consultations/{ticket}/status', [AdminConsultationController::class, 'updateStatus']);
        Route::put('consultations/{ticket}/priority', [AdminConsultationController::class, 'updatePriority']);
        Route::put('consultations/{ticket}/assign', [AdminConsultationController::class, 'assign']);

        // Pelanggan + pendaftaran
        Route::get('customers', [CustomerController::class, 'index']);
        Route::post('customers', [CustomerController::class, 'store']);
        Route::get('customers/{customer}', [CustomerController::class, 'show']);
        Route::put('customers/{customer}', [CustomerController::class, 'update']);
        Route::delete('customers/{customer}', [CustomerController::class, 'destroy']);
        Route::post('customers/{customer}/password-link', [CustomerController::class, 'sendPasswordLink']);
        Route::get('registrations', [CustomerController::class, 'registrations']);
        Route::post('registrations/{registration}/approve', [CustomerController::class, 'approveRegistration']);
        Route::post('registrations/{registration}/reject', [CustomerController::class, 'rejectRegistration']);

        // Layanan pelanggan (langganan)
        Route::get('customer-services', [CustomerServiceController::class, 'index']);
        Route::post('customer-services', [CustomerServiceController::class, 'store']);
        Route::put('customer-services/{customerService}', [CustomerServiceController::class, 'update']);
        Route::delete('customer-services/{customerService}', [CustomerServiceController::class, 'destroy']);
        Route::post('customer-services/bulk-update-status', [CustomerServiceController::class, 'bulkUpdateStatus']);

        // Profil admin
        Route::get('profile', [AdminProfileController::class, 'show']);
        Route::post('profile', [AdminProfileController::class, 'update']);
        Route::put('profile/password', [AdminProfileController::class, 'updatePassword']);
    });

// ---------------------------------------------------------------------------
// Panel Customer
// ---------------------------------------------------------------------------
Route::prefix('customer')
    ->middleware(['auth:sanctum', 'api.customer.active'])
    ->name('api.customer.')
    ->group(function () {
        Route::get('/dashboard', [CustomerDashboardController::class, 'index']);

        // Promo
        Route::get('/promos', [CustomerPromoController::class, 'index']);
        Route::get('/promos/mine', [CustomerPromoController::class, 'mine']);
        Route::get('/promos/{promo}', [CustomerPromoController::class, 'show']);

        // Konsultasi (support tickets milik pelanggan)
        Route::get('/consultations', [CustomerConsultationController::class, 'index']);
        Route::get('/consultations/unread-count', [CustomerConsultationController::class, 'unreadCount']);
        Route::get('/consultations/my-services', [CustomerConsultationController::class, 'myServices']);
        Route::post('/consultations', [CustomerConsultationController::class, 'store']);
        Route::get('/consultations/{ticket}', [CustomerConsultationController::class, 'show']);
        Route::post('/consultations/{ticket}/reply', [CustomerConsultationController::class, 'reply']);
        Route::get('/consultations/{ticket}/messages', [CustomerConsultationController::class, 'messages']);
        Route::patch('/consultations/{ticket}/close', [CustomerConsultationController::class, 'close']);

        // Notifikasi
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

        // Profil
        Route::get('/profile', [CustomerProfileController::class, 'show']);
        Route::put('/profile', [CustomerProfileController::class, 'update']);
        Route::post('/profile/avatar', [CustomerProfileController::class, 'updateAvatar']);
        Route::put('/profile/password', [CustomerProfileController::class, 'updatePassword']);
    });
