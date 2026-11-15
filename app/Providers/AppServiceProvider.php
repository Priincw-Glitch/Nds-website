<?php

namespace App\Providers;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if (
            ! app()->runningInConsole() &&
            Schema::getConnection()->getDriverName() === 'mysql'
        ) {
            if (! Schema::hasColumn('services', 'layout_size')) {
                try {
                    Schema::table('services', function ($table) {
                        $table->string('layout_size', 50)
                            ->nullable()
                            ->after('sort_order')
                            ->comment('Card size for home page display: large, wide, tall, small');
                    });
                } catch (\Exception $e) {
                    // Column might already exist or another error occurred.
                }
            }
        }
    }
}
