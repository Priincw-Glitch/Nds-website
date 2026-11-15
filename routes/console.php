<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('tawk:sync')
    ->everyMinute()
    ->withoutOverlapping()
    // Bila TAWK_WEBHOOK_SECRET terisi berarti webhook adalah jalur masuk
    // tunggal; cron polling dimatikan agar chat tidak tercatat ganda.
    ->when(fn () => config('tawk.webhook_secret') === null);
