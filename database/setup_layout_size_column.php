<?php

/**
 * This script adds the layout_size column to the services table.
 * Run this file via: php artisan tinker --execute="require 'database/setup_layout_size_column.php'"
 * Or embed in a route/controller to auto-run on first access.
 */

use Illuminate\Support\Facades\Schema;

if (!Schema::hasColumn('services', 'layout_size')) {
    Schema::table('services', function ($table) {
        $table->string('layout_size', 50)->nullable()->after('sort_order')
            ->comment('Card size for home page display: large, wide, tall, small');
    });
    
    echo "Column 'layout_size' added successfully to 'services' table.\n";
} else {
    echo "Column 'layout_size' already exists in 'services' table.\n";
}