<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$routes = app('router')->getRoutes();
$list = [];
foreach ($routes as $r) {
    $uri = $r->uri();
    if (str_starts_with($uri, '_inertia') || str_starts_with($uri, 'storage') || $uri === 'up') continue;
    $list[] = [
        'uri' => $uri,
        'methods' => array_values(array_filter($r->methods(), fn($m) => $m !== 'HEAD')),
        'name' => $r->getName(),
        'action' => $r->getActionName(),
        'middleware' => $r->middleware()
    ];
}

// Group routes
$groups = [
    'public' => [],
    'auth' => [],
    'customer' => [],
    'admin' => [],
    'api_webhook' => []
];

foreach ($list as $item) {
    $uri = $item['uri'];
    if (str_starts_with($uri, 'admin')) {
        $groups['admin'][] = $item;
    } elseif (str_starts_with($uri, 'customer')) {
        $groups['customer'][] = $item;
    } elseif (in_array($uri, ['login', 'logout', 'forgot-password', 'reset-password/{token}', 'reset-password'])) {
        $groups['auth'][] = $item;
    } elseif (str_starts_with($uri, 'webhooks') || $uri === 'coverage/check') {
        $groups['api_webhook'][] = $item;
    } else {
        $groups['public'][] = $item;
    }
}

echo "=== SUMMARY ROUTE INVENTORY ===\n";
echo "Public Routes: " . count($groups['public']) . "\n";
echo "Auth Routes: " . count($groups['auth']) . "\n";
echo "Customer Routes: " . count($groups['customer']) . "\n";
echo "Admin Routes: " . count($groups['admin']) . "\n";
echo "API/Webhook Routes: " . count($groups['api_webhook']) . "\n";
echo "Total Application Routes: " . count($list) . "\n\n";

foreach ($groups as $groupName => $items) {
    echo "--- GROUP: " . strtoupper($groupName) . " (" . count($items) . ") ---\n";
    foreach ($items as $it) {
        $methods = implode('|', $it['methods']);
        echo sprintf("  [%-6s] /%-35s -> %-30s (%s)\n", $methods, $it['uri'], $it['name'] ?? 'NO_NAME', $it['action']);
    }
    echo "\n";
}
