# Deployment Toolkit NDS Portal

Skrip deploy untuk server produksi Linux + Apache (PHP-FPM 8.3), aplikasi Laravel 12 + Inertia yang berjalan di subfolder `/portal/` dengan Reverb di internal port 8081.

## Struktur

```
deploy/
  backup.sh                     Dump DB + storage/ + .env, simpan 7 backup terakhir
  deploy.sh                     Deploy utama, 14 step fail-fast
  rollback.sh                   Pulihkan DB/storage/.env dari backup
  health-check.sh               Tabel PASS/FAIL pasca-deploy
  apache/nds-portal.conf        Contoh konfigurasi Apache 2.4
  systemd/reverb.service        Unit systemd Reverb
  .env.production.example       Template .env produksi
  backups/                      Hasil backup (dibuat otomatis)
  logs/                         Log per rilis deploy (dibuat otomatis)
```

## Kebutuhan server

- PHP 8.3 (CLI `/usr/bin/php8.3`, sama dengan PHP-FPM) dan composer
- Node 22 via nvm (`~/.nvm`), npm
- `mysqldump`, `mysql`, `tar`, `gzip`, `curl`
- Jalankan sebagai root atau via `sudo` (butuh `systemctl restart reverb` dan uji izin `www-data`)

## Urutan operasi

```bash
# 1. Deploy lengkap (backup dijalankan otomatis sebagai step 1)
sudo bash deploy/deploy.sh

# 2. Verifikasi pasca-deploy
bash deploy/health-check.sh
```

Step di `deploy.sh` berjalan berurutan: backup, cek `.env`, cek DB, `migrate --force`, composer install, build Node, verifikasi manifest Vite, `storage:link` + izin tulis, rebuild cache, cek HTTP `/portal/up` dan `/portal`, cek login (opsional), cek WebSocket Reverb, restart Reverb, ringkasan PASS/FAIL.

Setiap step bisa dilewati lewat flag env, contoh:

```bash
sudo SKIP_MIGRATE=1 SKIP_LOGIN_CHECK=1 bash deploy/deploy.sh
```

Flag yang tersedia: `SKIP_BACKUP`, `SKIP_ENV_CHECK`, `SKIP_DB_CHECK`, `SKIP_MIGRATE`, `SKIP_COMPOSER`, `SKIP_BUILD`, `SKIP_MANIFEST_CHECK`, `SKIP_STORAGE_LINK`, `SKIP_CACHE`, `SKIP_HTTP_CHECK`, `SKIP_LOGIN_CHECK`, `SKIP_WS_CHECK`, `SKIP_REVERB_RESTART`.

Cek login membutuhkan `ADMIN_EMAIL` dan `ADMIN_TEST_PASSWORD` (tanpa keduanya step itu otomatis SKIP):

```bash
sudo ADMIN_EMAIL=admin@example.com ADMIN_TEST_PASSWORD='...' bash deploy/deploy.sh
```

Override yang lain: `PHP_BIN`, `NODE_VERSION`, `WEB_USER`, `BASE_URL`, `NVM_DIR`.

## Rollback

```bash
bash deploy/rollback.sh                 # backup terbaru, ada konfirmasi
bash deploy/rollback.sh 2026-11-14_153000
bash deploy/rollback.sh --force         # tanpa konfirmasi (untuk otomasi)
```

Rollback menimpa database, `storage/`, dan `.env` dari backup terpilih (kondisi lama dipindah ke `*.pre-rollback-*`), lalu rebuild cache. Kode aplikasi dari rilis sebelumnya harus dipulihkan manual (git checkout atau arsip lama); skrip mencetak langkah manualnya di akhir.

## Daftar larangan

1. **Tidak pernah `migrate:fresh` atau `db:seed` di produksi.** Hanya `php artisan migrate --force`.
2. **Tidak pernah menimpa `.env` saat deploy.** `.env` di server hanya berubah lewat rollback atau suntingan manual.
3. **Rotasi `REVERB_APP_SECRET`** sebelum deploy pertama dengan toolkit ini: nilai lama pernah tampil di output terminal sehingga dianggap bocor.
4. **`php artisan storage:link` dijalankan di server** (step 8 deploy), bukan diasumsikan dari hasil build lokal.
5. **Konfigurasi Apache domain lain tidak boleh disentuh.** Semua arahan portal dibatasi pada `Alias /portal` dan `<Directory>` publik (lihat `deploy/apache/nds-portal.conf`).

## Catatan

- Sintaks skrip ini perlu diuji dengan `bash -n deploy/*.sh` langsung di server (Windows lokal tidak punya bash yang dijamin).
- Reverb diaktifkan permanen dengan: `systemctl enable reverb`.
