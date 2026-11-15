<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$counts = [
    'services' => \App\Models\Service::count(),
    'service_categories' => \App\Models\ServiceCategory::count(),
    'promos' => \App\Models\Promo::count(),
    'promo_categories' => \App\Models\PromoCategory::count(),
    'articles' => \App\Models\Article::count(),
    'article_categories' => \App\Models\ArticleCategory::count(),
    'coverages' => \App\Models\ServiceCoverage::count(),
    'projects' => \App\Models\Project::count(),
    'messages' => \App\Models\ContactMessage::count(),
    'settings' => \App\Models\CompanySetting::count(),
    'users' => \App\Models\User::count(),
];

echo json_encode($counts, JSON_PRETTY_PRINT);
