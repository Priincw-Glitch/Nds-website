
<?php

use App\Http\Controllers\StorageFileController;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        then: function () {
            // Fallback penyajian file disk "public" untuk server yang tidak
            // memakai symlink public/storage (deployment di subfolder /portal).
            // File yang ada di public/storage dilayani langsung oleh web
            // server; file yang belum tersalin di sana jatuh ke route ini.
            // Tanpa middleware web agar tidak ada overhead session/Inertia.
            Route::get('storage/{path}', [StorageFileController::class, 'show'])
                ->where('path', '.*')
                ->name('storage.serve');
        },
    )
    ->withMiddleware(function (Middleware $middleware) {

        // Trust proxy headers for Ngrok access
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR |
                     Request::HEADER_X_FORWARDED_HOST |
                     Request::HEADER_X_FORWARDED_PORT |
                     Request::HEADER_X_FORWARDED_PROTO
        );

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'webhooks/*',
        ]);

        $middleware->alias([
            'auth' => \App\Http\Middleware\Authenticate::class,
            'customer.active' => \App\Http\Middleware\EnsureCustomerIsActive::class,
            'admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
            'api.admin' => \App\Http\Middleware\EnsureApiUserIsAdmin::class,
            'api.customer.active' => \App\Http\Middleware\EnsureApiCustomerIsActive::class,
        ]);

        $middleware->redirectGuestsTo(fn () => route('login'));

        $middleware->redirectUsersTo(function (Request $request) {
            $user = $request->user();

            if ($user?->isAdmin()) {
                return route('admin.dashboard');
            }

            if ($user?->isCustomer()) {
                return route('customer.dashboard');
            }

            return route('home');
        });
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->renderable(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Not Found'], 404);
            }

            return Inertia::render('NotFound', ['status' => 404])
                ->toResponse($request)
                ->setStatusCode(404);
        });
    })->create();
