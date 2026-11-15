<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

use function Laravel\Prompts\password;

/**
 * Bootstrap akun administrator secara eksplisit. Aman dijalankan berulang:
 * akun yang sudah ada diperbaiki role dan statusnya, bukan dibuat ulang.
 * Password tidak pernah ditampilkan di output kecuali dibuat acak dan hanya
 * sekali, langsung setelah pembuatan.
 */
class BootstrapAdmin extends Command
{
    protected $signature = 'admin:bootstrap
        {--email= : Email akun admin (default admin@ndsdigital.id)}
        {--name= : Nama tampilan akun admin}
        {--password= : Password baru; kosongkan untuk memakai password yang sudah tersimpan}';

    protected $description = 'Memastikan akun admin memiliki role admin dan status aktif, dengan password opsional';

    public function handle(): int
    {
        $email = $this->option('email') ?: 'admin@ndsdigital.id';
        $name = $this->option('name') ?: 'Admin NDS';

        $user = User::where('email', $email)->first();

        if ($user && $user->role !== 'admin') {
            $this->warn("Akun {$email} ber-role '{$user->role}'. Role akan diubah menjadi admin.");
        }

        $newPassword = $this->option('password');

        if (!$user && !$newPassword) {
            if ($this->input->isInteractive()) {
                $newPassword = password('Password admin (minimal 8 karakter)', required: true, min: 8, validate: fn (string $value) => strlen($value) < 8 ? 'Password minimal 8 karakter.' : null);
            } else {
                $this->error('Akun admin belum ada. Jalankan ulang dengan --password=... untuk menetapkan password awal.');

                return self::FAILURE;
            }
        }

        $attributes = [
            'name' => $name,
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
        ];

        if ($newPassword !== null && $newPassword !== '') {
            if (strlen($newPassword) < 8) {
                $this->error('Password minimal 8 karakter.');

                return self::FAILURE;
            }
            $attributes['password'] = Hash::make($newPassword);
        }

        $user = User::updateOrCreate(['email' => $email], $attributes);

        $this->info("Akun admin siap: {$user->email}");
        $this->line('Role: admin | Status: active');
        $this->line($newPassword !== null
            ? 'Password telah diperbarui melalui opsi --password.'
            : 'Password tidak diubah: gunakan yang sudah tersimpan, atau jalankan ulang dengan --password.');

        return self::SUCCESS;
    }
}
