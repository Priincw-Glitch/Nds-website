<?php

namespace App\Http\Controllers;

use App\Models\CompanySetting;

abstract class Controller
{
    protected function settings(): array
    {
        return CompanySetting::allSettings();
    }
}
