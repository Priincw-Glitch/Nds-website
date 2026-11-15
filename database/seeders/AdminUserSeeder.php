<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Akun admin dibuat dengan role dan status yang benar. Password tidak
     * pernah di-hardcode atau dicetak ke output: nilai pertama diambil dari
     * ADMIN_PASSWORD, dan bila kosong admin menetapkannya sendiri lewat
     * `php artisan admin:bootstrap`.
     */
    public function run(): void
    {
        $email = 'admin@ndsdigital.id';
        $adminPassword = config('app.admin_password');

        $attributes = [
            'name' => 'Admin NDS',
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
        ];

        if (!empty($adminPassword)) {
            if (strlen($adminPassword) < 8) {
                $this->command->warn('ADMIN_PASSWORD kurang dari 8 karakter; password tidak diubah.');

                return;
            }
            $attributes['password'] = Hash::make($adminPassword);
        }

        $user = User::updateOrCreate(['email' => $email], $attributes);

        $this->command->info("Admin siap: {$user->email} (role=admin, status=active).");
        if (empty($adminPassword)) {
            $this->command->warn('Password belum ditetapkan seeder. Jalankan: php artisan admin:bootstrap --password=...');
        }
    }
}
