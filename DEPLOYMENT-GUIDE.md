# PANDUAN DEPLOYMENT LARAVEL NDS KE VPS — STEP BY STEP

> Project: **Nusantara Digital Solution (NDS)** — Laravel 12 · Inertia 3 · React 19 · Tailwind 4 · Vite 6 · MySQL · Laravel Reverb · Tawk.to · SMTP
> Dokumen ini dibuat **dari hasil audit aktual project** (`D:\laragon\www\NDS-WEBSITE`), bukan template generik.

## SKENARIO UTAMA (yang dipilih untuk panduan ini)

| Keputusan | Nilai | Alasan |
|---|---|---|
| OS | Ubuntu 22.04 / 24.04 | Paling umum, apt |
| Web server | **Nginx + PHP-FPM** | Konfigurasi explicit, ringan; Apache ditulis terpisah di Bagian 14, bukan dicampur |
| Path aplikasi | `YOUR_PROJECT_PATH` = `/var/www/nds` | Source di luar doc root, doc root → `public/` saja |
| Build frontend | **Di Windows, upload `public/build`** | Tidak perlu Node di server produksi (attack surface lebih kecil, build reproducible dari lockfile) |
| Database | MySQL/MariaDB di VPS, data diimpor dari lokal | Konten layanan/promo/artikel/admin sudah terisi di lokal |
| Reverb | systemd service + reverse proxy HTTPS | Port internal 8081 → hanya localhost, client pakai `wss://<domain>` |

### Placeholder yang Anda ganti (masuk sekali, berlaku di seluruh dokumen)

| Placeholder | Arti | Contoh |
|---|---|---|
| `YOUR_DOMAIN` | domain produksi tanpa `https://` | `ndsdigital.id` |
| `YOUR_VPS_IP` | IP publik VPS | `103.xxx.xxx.xxx` |
| `YOUR_PROJECT_PATH` | direktori aplikasi di VPS | `/var/www/nds` |
| `DB_NAME` / `DB_USER` / `DB_PASS` | database & user produksi yang dibuat | — |
| `SSH_USER` | user login VPS | `root` atau user sudo |
| `<nilai dari .env>` | nilai yang SAMA dengan project lokal | lihat tabel Bagian 5 |

⚠ `APP_KEY`, password email, dan Tawk secret terdapat di `.env` lokal Anda. Panduan ini **sengaja tidak mencetaknya** — Anda menyalin sendiri dari `D:\laragon\www\NDS-WEBSITE\.env` (buka pakai editor), dan tidak menempelkannya di tempat lain selain `.env` di VPS.

---

# BAGIAN 1 — PERSIAPAN DI WINDOWS (terminal: PowerShell, di `D:\laragon\www\NDS-WEBSITE`)

### Langkah 1 — Verifikasi project lolos build production

**Tujuan:** Memastikan aplikasi building-bersih sebelum dipindahkan.

**Lokasi:** PowerShell, `D:\laragon\www\NDS-WEBSITE`

**Command:**
```powershell
php artisan about          # status runtime Laravel lokal
npm.cmd run build          # build Vite production (pakai npm.cmd, bukan npm — npm.ps1 diblokir PowerShell policy)
```

**Penjelasan:** `artisan about` menampilkan environment & status cache. `npm.cmd run build` membentuk file statis ke `public/build/`.

**Hasil yang diharapkan:** `✓ built in ...` tanpa error; file `public\build\manifest.json` ada.

**Jika gagal:** baca error Vite. Biasanya lupa `npm.cmd install` — jalankan `npm.cmd install` lalu kembali `npm.cmd run build`.

---

### Langkah 2 — Build frontend dengan nilai production Reverb (PENTING)

**Tujuan:** Nilai WebSocket `VITE_REVERB_*` **ditanam di dalam bundle saat build** — setelah production tidak bisa diubah tanpa rebuild. Build harus punya host/protocol/scheme domain utama, bukan `127.0.0.1` fallback yang bisa menyebabkan koneksi WebSocket gagal (CSP akan menolak warn `ws://127.0.0.1`).

**Lokasi:** PowerShell, `D:\laragon\www\NDS-WEBSITE`

**Command:**
```powershell
$env:VITE_REVERB_HOST  = "YOUR_DOMAIN"   # domain produksi tanpa https://
$env:VITE_REVERB_SCHEME = "https"        # client pakai wss:// di production
$env:VITE_REVERB_PORT   = "443"          # port 443 karena wss memakai HTTPS
$env:VITE_REVERB_APP_KEY = "SALIN-DARI-.env-LOKAL"   # nilai REVERB_APP_KEY di .env lokal
npm.cmd run build
```

**File yang perlu dibuat/diedit:** tidak ada file dikode; ini override **process env**, yang di Vite menang dibanding isi `.env` root (yang berisi `127.0.0.1:8081` untuk lokal).

**Penjelasan:** `resources/js/echo.ts` membaca `import.meta.env.VITE_REVERB_*` saat Vite build; nilai process environment yang di-set di PowerShell **menang atas** isi file `.env` di root project (yang berisi `127.0.0.1:8081` untuk development), sehingga bundle production memuat `wss://YOUR_DOMAIN:443`.

**Hasil yang diharapkan:** `npm.cmd run build` selesai; lalu verifikasi bundle:
```powershell
Select-String -Path public\build\assets\*.js -Pattern "YOUR_DOMAIN" -SimpleMatch | Select-Object -First 1
Select-String -Path public\build\assets\*.js -Pattern "https" -Quiet
```
Jika keduanya menemukan kecocokan, build sudah berisi domain produksi.

**Jika gagal:** pastikan 4 baris `$env:` dijalankan di sesi PowerShell yang sama persis sebelum `npm.cmd run build`; cek typo pada `YOUR_DOMAIN`.

---

### Langkah 3 — Dump database lokal

**Tujuan:** Menyiapkan snapshot konten (layanan, promo, artikel, settings, user admin, messages) untuk diimpor ke VPS.

**Lokasi:** PowerShell, `D:\laragon\www\NDS-WEBSITE` (mysqldump adalah bagian dari Laragon; biasanya sudah di PATH. Jika tidak: gunakan full path `C:\laragon\bin\mysql\<versi>\bin\mysqldump.exe`)

**Command:**
```powershell
mysqldump --single-transaction --routines --triggers -u root -p nds_website > ..\nds_website.sql
```
⚠ Sesuai `.env` lokal, `DB_DATABASE=nds_website`, `DB_USERNAME=root`, password kosong. Jika password lokal Anda terisi, isinya di atas `-p`.

**Penjelasan:** `--single-transaction` bagus di InnoDB agar dump konsisten tanpa mengunci table. File `nds_website.sql` berukuran kecil (ratusan KB).

**Hasil yang diharapkan:** file `D:\laragon\www\nds_website.sql` terbentuk > 0 KB; `SELECT` pertama membaca `CREATE TABLE`.

**Jika gagal:** check error `'mysqldump' is not recognized` → pakai full path Laragon; error access denied → sesuaikan credentials MySQL lokal.

---

### Langkah 4 — Membuat ZIP deployment

**Tujuan:** Bundel KODE aplikasi + `public/build` (hasil build production) + `storage/app` (file upload), TANPA `vendor/`, `node_modules/`, `.env`, dan `.git`.

**Lokasi:** PowerShell, `D:\laragon\www\NDS-WEBSITE`

**Command:**
```powershell
# 1. Stage folder produksi murni: masukkan semua kecuali vendor, node_modules, .git, dan .env
$stage = "..\nds-deploy-stage"
robocopy . $stage /E /XD node_modules vendor .git /XF .env

# 2. Bersihkan log & cache lokal dari staging (JANGAN upload)
Get-ChildItem "$stage\storage\logs" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Remove-Item "$stage\storage\framework\views\*.php" -Force -ErrorAction SilentlyContinue
Remove-Item "$stage\storage\framework\cache\data\*" -Force -ErrorAction SilentlyContinue
Remove-Item "$stage\storage\framework\sessions\*" -Force -ErrorAction SilentlyContinue

# 3. ZIP
Compress-Archive -Path $stage\* -DestinationPath ..\nds-deploy.zip -Force
Get-Item ..\nds-deploy.zip    # cek ukuran (biasanya < 20 MB)
```
Catatan: isi `storage\app\public` **sengaja ikut terbawa** — file itu adalah gambar upload yang direferensikan oleh database di dump. Jangan dihapus.

**Penjelasan:**
- `vendor/` dibuat ulang di VPS via `composer install` (platform PHP harus cocok).
- `node_modules/` tidak perlu, frontend sudah dibuild.
- `.env` lokal JANGAN ikut (berisi password DB lokal dan konfigurasi development; di produksi dibuat file baru).
- `storage\framework/*` dan `storage/logs` adalah cache runtime.

**Hasil yang diharapkan:** `..\nds-deploy.zip` terbentuk. Jika > 50 MB, kemungkinan log/cache besar terbawa — cek staging folder.

**Jika gagal:** robocopy error code 1–7 masih "berhasil" (code < 8 aman). Compress-Archive gagal di path > 260 karakter → gunakan path singkat.

---

# BAGIAN 2 — PERSIAPAN VPS (terminal: SSH di VPS Ubuntu)

> Akses: `ssh SSH_USER@YOUR_VPS_IP`. Command dijalankan urut di `/root` atau $HOME user login.

### Langkah 5 — Update sistem & packages dasar

**Tujuan:** VPS pakai file package terbaru.

**Lokasi:** SSH VPS (as root / sudo)

**Command:**
```bash
apt update && apt upgrade -y
apt install -y unzip git curl software-properties-common nano
```

**Penjelasan:** `unzip` untuk ekstrak zip project; `software-properties-common` untuk menambahkan PPA PHP.

**Hasil yang diharapkan:** tidak ada error apt; perintah berjalan langsung.

**Jika gagal:** baca baris error apt; biasanya disk penuh → `df -h /`.

---

### Langkah 6 — PHP 8.2-FPM + extensions Laravel

**Tujuan:** Runtime aplikasi. Laravel 12 butuh PHP ≥ 8.2 (composer.json `"php": "^8.2"`).

**Lokasi:** SSH VPS

**Command (Ubuntu 22.04):**
```bash
add-apt-repository -y ppa:ondrej/php
apt update
apt install -y php8.2-fpm php8.2-cli php8.2-mysql php8.2-curl php8.2-gd \
  php8.2-mbstring php8.2-xml php8.2-zip php8.2-bcmath php8.2-opcache php8.2-intl
php -v            # harus PHP 8.2.x
php -m | tr ' ' '\n' | grep -cE 'bcmath|ctype|curl|dom|fileinfo|gd|json|mbstring|openssl|pcre|pdo_mysql|tokenizer|xml|zip'
```

**Penjelasan:** daftar ini adalah lingkungan aktual project (audit `php -m` lokal). `opcache` penting untuk performance.

**File yang perlu dibuat/diedit:** `/etc/php/8.2/fpm/php.ini`
```ini
upload_max_filesize = 20M    # upload attachment/support hingga 5 MB + margin
post_max_size = 24M
memory_limit = 256M
max_execution_time = 120
expose_php = Off
```
Lalu reload:
```bash
systemctl reload php8.2-fpm
```

**Hasil yang diharapkan:** `php -v` 8.2; daftar extensinya tidak ada anggap 0.

**Jika gagal:** `systemctl status php8.2-fpm` untuk mendiagnos; file yang dengan salah variatif → `journalctl -u php8.2-fpm -n 30`.

---

### Langkah 7 — Composer

**Tujuan:** Menginstall Composer untuk `composer install` di project.

**Lokasi:** SSH VPS

**Command:**
```bash
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
composer -V
```

**Penjelasan:** installer resmi; hasilnya satu biner `/usr/local/bin/composer`.

**Hasil yang diharapkan:** `Composer version 2.x` mencetuur.

**Jika gagal:** user login PHP CLI salah → `php -v` dua kali; jangan install via apt composer (versi tua).

---

### Langkah 8 — MySQL/MariaDB

**Tujuan:** Database produksi. **Jika TAHAP 2 tempat server ML sudah memasang MySQL** (mis. default CyberPanel/CWP), lewati install — langsung ke pembuatan DB di Langkah 9.

**Lokasi:** SSH VPS

**Command:**
```bash
apt install -y mariadb-server
mysql_secure_installation     # jawab: set password root (CATAT!), Remove anonymous = Y,
                              # Disallow root remote = Y, Remove test db = Y
systemctl enable --now mariadb
mysql --version
```

**Penjelasan:** MariaDB drop-in MySQL compatible dengan Laravel; `mysql_secure_installation` bagian hardening awal.

**Hasil yang diharapkan:** service active; `mysql -u root -p` masuk.

**Jika gagal:** `systemctl status mariadb`; log `journalctl -u mariadb -n 50`.

---

### Langkah 9 — Nginx + Certbot

**Tujuan:** Web server + SSL. Nginx dipilih sebagai skenario utama.

**Lokasi:** SSH VPS

**Command:**
```bash
apt install -y nginx certbot python3-certbot-nginx
systemctl enable --now nginx
nginx -v
```

**Penjelasan:** `python3-certbot-nginx` agar certbot bisa memodifikasi server block otomatis saat penerbitan sertifikat.

**Hasil yang diharapkan:** browser `http://YOUR_VPS_IP` memuat "Welcome to nginx".

**Jika gagal:** port 80 tertutup provider/firewall → cek panel provider; `systemctl status nginx`.

---

# BAGIAN 3 — UPLOAD & PENEMPATAN PROJECT

### Langkah 10 — Konfigurasi DNS domain

**Lokasi:** Dashboard registrar Anda (bukan terminal)

**Command:** Tambah **A record**: `@` → `YOUR_VPS_IP`, dan `www` → `YOUR_VPS_IP` (TTL 300).

**Penjelasan:** Sebelum SSL diterbitkan (Langkah 17), DNS harus sudah resolve. Else certbot akan gagal.

**Hasil yang diharapkan:** dari komputer Windows:
```powershell
nslookup YOUR_DOMAIN        # harus menampilkan YOUR_VPS_IP
```
Jika belum, tunggu sesuai TTL.

---

### Langkah 11 — Upload ZIP ke VPS

**Lokasi:** PowerShell Windows

**Command (scp; OpenSSH ada bawaan Windows 10/11):**
```powershell
scp D:\laragon\www\nds-deploy.zip SSH_USER@YOUR_VPS_IP:/root/
scp D:\laragon\www\nds_website.sql SSH_USER@YOUR_VPS_IP:/root/
```
Alternatif file manager panel: upload `nds-deploy.zip` + `nds_website.sql` ke `/root` atau home dir user.

**Penjelasan:** SCP memindah file via SSH — selalu ens phase.

**Hasil yang diharapkan:** transfer 100%; di VPS `ls -lh /root/nds-deploy.zip /root/nds_website.sql` ukuran sesuai.

**Jika gagal:** cek firewall port 22; timeout DNS → cek IP benar.

---

### Langkah 12 — Ekstrak project ke `YOUR_PROJECT_PATH`

**Lokasi:** SSH VPS

**Command:**
```bash
mkdir -p /var/www/nds
cd /var/www/nds
unzip -o /root/nds-deploy.zip
ls -la /var/www/nds
ls -la /var/www/nds/public          # harus berada index.php, .htaccess, build/
ls -la /var/www/nds/artisan         # file artisan HARUS di sini
```

**Penjelasan:** Struktur final ini adalah paten package production:
```
/var/www/nds/                  ← YOUR_PROJECT_PATH (root aplikasi)
├── artisan                    ← CLI Laravel
├── composer.json / composer.lock
├── app/ config/ database/ routes/ resources/ public/
├── public/                    ← SATU-SATUNYA yang diakses internet (doc root Nginx)
│   ├── index.php
│   ├── build/                 ← asset frontend hasil build Langkah 2
│   └── storage → ../storage/app/public   (dibuat Langkah 15)
├── storage/                   ← file runtime + upload (tanpa eksekusi PHP)
│   ├── logs/, framework/, cache/
│   └── app/public/            ← file upload admin
├── bootstrap/cache/           ← cache config/routes
└── .env                       ← dibuat Langkah 13 (TIDAK terekspos web)
```
Hanya `public/` yang terpapar internet sebagai domain root (document root); `.env`,
`storage/logs`, dan `vendor/` tidak dapat diakses browser. Lapisan kedua dipegang
oleh CSP hardening yang berasal dari middleware aplikasi (`SecurityHeaders.php`).

**Hasil yang diharapkan:** semua folder aplikasi lengkap (app, config, database, routes, resources, storage, bootstrap); `public/build/manifest.json` hadir; TIDAK ada `.env` karena dibuat manual di Langkah 13.

**Jika gagal:** `unzip: cannot find zipfile` → path salah; jika file bertabrakan saat ekstrak, gunakan `unzip -q -o ZIP -d /var/www/nds`.

---

# BAGIAN 4 — KONFIGURASI FILE LARAVEL (bagian paling penting)

### Langkah 13 — Membuat `.env` production

**Tujuan:** Konfigurasi produksi dedicated — TIDAK memakai `.env` development secaralin.

**Lokasi:** SSH VPS, tiá `YOUR_PROJECT_PATH`

**File yang perlu dibuat (baru):** `/var/www/nds/.env` — buat via `nano /var/www/nds/.env`

**Isi konfigurasi lengkap (siap salin — bagian dengan `📦` = SALIN nilai dari `.env` lokal tanpa diubah; bagian ${} = ganti):**

```ini
APP_NAME="NDS - Nusantara Digital Solution"
VITE_APP_NAME="NDS"

# ---- DASAR (WAJIB BERBEDA dari lokal) ----
APP_ENV=production
APP_DEBUG=false
APP_URL=https://YOUR_DOMAIN
APP_TIMEZONE=Asia/Jakarta

# ---- KUNCI APP_KEY (📦 SALIN nilai APP_KEY asli dari .env lokal) ----
APP_KEY=base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ---- LOG ----
LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=error

# ---- DATABASE (nilai dari Langkah 9/14) ----
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=DB_NAME
DB_USERNAME=DB_USER
DB_PASSWORD=DB_PASS

# --- SESSION & CACHE (project audit → database, no Redis needed) ---
SESSION_DRIVER=database
SESSION_ENCRYPT=true
SESSION_PATH=/
SESSION_DOMAIN=YOUR_DOMAIN      # atau null jika tanpa sub.domain; isi domain baik
SESSION_SECURE_COOKIE=true      # WAJIB true karena HTTPS
SESSION_SAME_SITE=lax
SESSION_LIFETIME=60

BROADCAST_CONNECTION=reverb
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
CACHE_STORE=database

# ---- SMTP (📦 SALIN MAIL_USERNAME, MAIL_FROM_ADDRESS dari .env lokal) ----
MAIL_MAILER=failover
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=📦
MAIL_PASSWORD=📦            # app-password Gmail yang sama, salin dari .env lokal
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=📦
MAIL_FROM_NAME="${APP_NAME}"

# ---- LARAVEL REVERB (📦 APP_ID/APP_KEY/APP_SECRET salin dari .env lokal) ----
REVERB_APP_ID=📦
REVERB_APP_KEY=📦
REVERB_APP_SECRET=📦

# Klien browser mengakses via HTTPS proxy (lihat Blockfuture Nginx /app/):
REVERB_HOST=YOUR_DOMAIN
REVERB_PORT=443
REVERB_SCHEME=https

# Server internal Reverb (listen di localhost, TIDAK terekspos):
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8081

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="YOUR_DOMAIN"
VITE_REVERB_PORT="443"
VITE_REVERB_SCHEME="https"

# ---- TAWK.TO (📦 SALIN PROPERTY_ID & SECRET_KEY dari .env lokal) ----
TAWK_PROPERTY_ID=📦
TAWK_SECRET_KEY=📦
TAWK_WEBHOOK_SECRET=ISI-SECRET-BARU-BUAAT-WEBHOOK   # lihat Langkah 21

# ---- AKUN ADMIN PERTAMA (hanya dipakai jika memilih jalur migrate + seed) ----
ADMIN_PASSWORD=ISI-PASSWORD-ADMIN-PRODUCTION-BARU   # jangan sama dengan lokal; min 8 karakter
```

**Penjelasan per kunci penting:**
- `APP_KEY` — dipertahankan dari lokal: data yang terenkripsi (session terenkripsi, dsb.) tetap bisa dibaca. **JANGAN** menjalankan `php artisan key:generate` kecuali project belum ada APP_KEY.
- `REVERB_HOST/PORT/SCHEME` → `services/reverb` config membaca ini untuk menentukan CSP `connect-src`. Dengan `https://YOUR_DOMAIN:443`, CSP memastikan browser boleh `wss://YOUR_DOMAIN`; sekaligus server Laravel mengirim event broadcast ke `https://YOUR_DOMAIN/apps/{id}/events` → diteruskan Nginx ke Reverb internal (Langkah 16).
- `REVERB_SERVER_PORT=8081` — port **listening** internal; dibanding `8080` default agar cocok dengan layout broadcast dalam project.
- `TAWK_WEBHOOK_SECRET` — webhook `/webhooks/tawk` memverifikasi tanda HMAC; **sebab lokal kosong, dipaksa kosong. Jadi INPUT nilai,** ia harus disetel ke Tawk dashboard (Langkah 21).
- `QUEUE_CONNECTION=database` — sesuai audit: tidak ada queue job regular di aplikasi (`ShouldBroadcastNow` tidak lewat queue); tetap dibutuhkan untuk failover antar application env.
- Simpan: `CTRL+O`, `CTRL+X`.

**Setelah simpan, langsung kunci file:**
```bash
cd /var/www/nds
chmod 640 .env
chown root:www-data .env
```

**Hasil yang diharapkan:** `php -r "require 'vendor/autoload.php'..."` — lebih simples: `php artisan about` nanti menampilkan "APP_ENV production & APP_DEBUG off".

**Jika gagal:** `APP_KEY` harus dipindahkan persis — perbaiki dengan membuka kembali `.env` lokal. Semua data terenkripsi (session, dsb.) terikat pada `APP_KEY`; jika key berbeda, tabel `sessions`/cache dengan data terenkripsi lama tidak bisa didekripsi pembacanya. Pastikan salin lengkap termasuk prefix `base64:` dan tidak terpotong.

---

### Langkah 14 — Database produksi: buat DB & user, lalu import

**Tujuan:** Menyiapkan Database + user dedikasi (root tidak dipakai aplikasi) & memuat data lokal.

**Lokasi:** SSH VPS

**Command:**
```bash
mysql -u root -p <<'SQL'
CREATE DATABASE DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'DB_USER'@'localhost' IDENTIFIED BY 'DB_PASS';
GRANT ALL PRIVILEGES ON DB_NAME.* TO 'DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL
# Import dump dari Langkah 3:
mysql -u root -p DB_NAME < /root/nds_website.sql
# Verifikasi:
mysql -u DB_USER -pDB_PASS DB_NAME -e "SHOW TABLES;"
mysql -u DB_USER -pDB_PASS DB_NAME -e "SELECT COUNT(*) AS tabel_dari_migrations FROM migrations;"
```

**Penjelasan:** database baru dibuat `utf8mb4` sesuai default project (`config/database.php`). Dump diimpor **penuh** — termasuk tabel `migrations`, jadi Laravel tidak perlu menjalankan migration lagi (versi schema identik dengan lokal).

**Hasil yang diharapkan:** `SHOW TABLES` menampilkan ±32 tabel (`users, sessions, cache, jobs, services, promos, articles, company_settings, customer_profiles, support_tickets, ticket_messages, notifications, pages, ...`); tabel `migrations` terisi daftar migrasi sama seperti project lokal.

**Jika gagal:** `ERROR 1049` nama DB salah; `MySQL server has gone away` → dump yang lazim atau parameter low memory → `max_allowed_packet`; **jangan memulai DROP** — cukup buat DB nama baru.

---

### Langkah 15 — Install dependencies + finalisasi Laravel

**Lokasi:** SSH VPS, `cd /var/www/nds`

**Command:**
```bash
cd /var/www/nds
composer install --no-dev --optimize-autoloader     # sesuai composer.lock, tanpa dev

php artisan storage:link                            # symlink public/storage → storage/app/public
chown -R www-data:www-data /var/www/nds/storage /var/www/nds/bootstrap/cache
chmod -R ug+rX /var/www/nds/storage /var/www/nds/bootstrap/cache
find /var/www/nds/storage -type d -exec chmod 775 {} \;
find /var/www/nds/storage -type f -exec chmod 664 {} \;

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan about
php artisan tawk:sync            # uji manual — harus jalan tanpa fatal error
```

**Penjelasan:**
- `--no-dev` menghapus dev tools seperti Pint/PHPUnit COS — produksi purifikasi.
- `classic -R ug+rX` **bukan 777** — folder writable cukup untuk `www-data` (web) & user deploy.
- `storage:link` wajib karena semua upload project menyimpan ke disk `public` (audit).
- `config:cache` dsb. mengetuskan projetsolah. NF route:cache aman karena route project tidak memakai closure seminimal-audit; jika ada error, gunakan `php artisan route:clear` dan feedback.
- `tawk:sync` sekali untuk memverifikasi koneksi Tawk API.

**Hasil yang diharapkan:** `composer install` cukup; `php artisan about` menampilkan `APP_ENV production`, `CACHE file|database ✓ cached`, Route cache ✓.

**Jika gagal:** "APP_KEY... missing" → periksa `.env` Langkah 13; `Inoo connection refused` → kredensial DB Projek salah, cek Langkah 14; `class not found` → `composer dump-autoload`.

---

### Langkah 16 — Migrasi vs import: kapan pakai yang mana (referensi)

**Apa yang sudah terjadi di Langkah 14:** path utama = **import dump penuh** (data + schema + tabel `migrations`), sehingga `php artisan migrate` TIDAK perlu dijalankan.

Gunakan `php artisan migrate --force` **hanya jika**:
- Database produksi sudah hidup dan tidak boleh dihancurkan — `--force` menjalankan migration yang PENDING sahaja (tidak memodifikasi tabel hidup). Setelah itu jalankan `php artisan migrate --pretend` dulu untuk mengunduh SQL-nya — Jika ada yang memakai DROP atau tamper data ada, **stop dan mintControl persetujuan owner**.
- Use `php artisan db:seed --force` **hanya untuk skenario DB KOSONG + migrate** (akuna). Perlu `ADMIN_PASSWORD` ter-set di `.env` (audit: seeder menolak jalan tan pawnya, minimal 8 karakter) karena seeder menciptakan akun admin pertama.

**DILARANG SELALU:**
```bash
php artisan migrate:fresh    # = drop semua tabel
php artisan db:wipe          # = kosong database
DROP DATABASE ...
```

---

# BAGIAN 5 — DOMAIN, SSL, WEB SERVER

### Langkah 17 — Nginx server block

**Tujuan:** Doc root → `public/` saja, re-censored, deny files sensitif, dan reverse proxy Reverb.

**Lokasi:** SSH VPS

**File yang perlu dibuat (baru):** `/etc/nginx/sites-available/nds`

**Isi lengkap:**
```nginx
# HTTP → HTTPS
server {
    listen 80;
    server_name YOUR_DOMAIN www.YOUR_DOMAIN;
    return 301 https://YOUR_DOMAIN$request_uri;
}

server {
    listen 443 ssl http2;
    server_name YOUR_DOMAIN;

    # === SEMENTARA: sertifikat placeholder; diganti Certbot (Langkah 18) ===
    # ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;   # ganti setelah certbot
    # ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;

    root /var/www/nds/public;          # ← document root KE public SAJJA
    index index.php;

    # --- Proteksi: file tidak boleh diakses internet ---
    location ~ /\.(?!well-known) { deny all; }             # .env, .git, .htaccess
    location ~* \.(sql|zip|tar|gz|log|md|yml|yaml|json|env)$ { deny all; }

    # --- Upload & storage: HANYA file statis, TIDAK ADA eksekusi PHP ---
    location ^~ /storage { try_files $uri =404; }
    location ^~ /build   { try_files $uri =404; }

    # --- Laravel routing standar ---
    location / { try_files $uri $uri/ /index.php?$query_string; }

    # --- PHP-FPM ---
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_read_timeout 120;
    }

    # --- Reverb reverse proxy: WebSocket client (/app/*) + API server (/apps/*) ---
    location /app/  {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
    location /apps/ {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    client_max_body_size 24M;
}
```

**Penjelasan bagian kunci:**
- `root ... /public` + deny `.env/.sql/.zip/log` — dua lapis protection (system config + file-level deny).
- `/storage` & `/build` disajikan sebagai file statis tanpa `\.php$` handler → meski file upload ternodai script PHP, ia tidak dieksekusi.
- `/app/` (path WebSocket per key, butuh Upgrade header) + `/apps/` (HTTP API yang dipakai backend Laravel mengirim event broadcast) — keduanya diproksikan ke Reverb internal 8081, yang TIDAK terekspos publik.
- `proxy_http_version 1.1` + `Upgrade` header — wajib untuk WebSocket.
- Rule `deny json` tidak memengaruhi `manifest.json` Vite: `location ^~ /build` diproses lebih dulu (longest prefix match menang atas regex deny), sehingga asset frontend tetap aman.

**Aktivasi:**
```bash
ln -s /etc/nginx/sites-available/nds /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default       # menghapus site default (opsional disarankan)
nginx -t
systemctl reload nginx
```

**Hasil yang diharapkan:** `nginx: configuration file ... test is successful`; HTTP 302 ke https di `curl -I http://YOUR_VPS_IP`.

**Jika gagal:** `nginx: [emerg]` → salah path/typo; masisi unik `location merging` conflict → periksa komentar jar.

---

### Langkah 18 — SSL / HTTPS dengan Certbot

**Lokasi:** SSH VPS (prasyarat: DNS Langkah 10 sudah resolve, Nginx aktif, Radiusnya 443 bit)

**Command:**
```bash
# Tanggalkan comment 2 baris ssl_certificate sementara? Sebelum Lisa, test dimenbumah:
ufw allow 'Nginx Full'
ufw status

certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
```
Setelah selesai, akan otomatis tembakan server block memakai `/etc/letsencrypt/...` + redirect 80→443 (kalu di Langkah 17 sudah redirect manual, cotbot hanya menambah ssl).

Uji:
```bash
curl -I https://YOUR_DOMAIN            # HTTP 200 + Strict-Transport-Security
certbot certificates
```

**Penjelasan:** Let's Encrypt certificate — auto-renewal dibuat oleh certbot systemd timer (`systemctl list-timers | grep certbot`).

**Hasil yang diharapkan:** `Successfully received certificate`; curl HTTPS 200.

**Jika gagal:** DNS belum communicate → `dig +short YOUR_DOMAIN`; port 80 blocked; ganti CAA record → paste error lengkap agency verify.

---

# BAGIAN 6 — LARAVEL REVERB & WEBSOCKET

### Langkah 19 — systemd service untuk Reverb

**File yang perlu dibuat (baru):** `/etc/systemd/system/reverb-nds.service`

**Isi lengkap:**
```ini
[Unit]
Description=Laravel Reverb WebSocket — NDS
After=network-online.target mariadb.service
Wants=network-online.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/nds
ExecStart=/usr/bin/php /var/www/nds/artisan reverb:start --host=0.0.0.0 --port=8081
Restart=always
RestartSec=3

StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Aktivasi:**
```bash
systemctl daemon-reload
systemctl enable --now reverb-nds
systemctl status reverb-nds --no-pager
ss -tlnp | grep 8081      # harus mendengarkan 0.0.0.0:8081 (proxy internal)
```

**Penjelasan:**
- Reverb adalah **proses PHP ReactPHP slogan altar** — wajib berjalan sebagai daemon; ini menulis log journal.
- Port 8081 TIDAK dibuka di firewall. Browser mengakses `wss://YOUR_Domain` yang di-proxy Nginx (Langkah 17).
- CSP yang dibentuk `app/Http/Middleware/SecurityHeaders.php` memakai `REVERB_SCHEME/HOST/PORT` — sudah set `https/YOUR_DOMAIN/443` di Langkah 13, sesuai proxy.
- `_uptime & kubectl service` automatis ketika VPS reboot.

**Hasil yang diharapkan:** `Active: active (running)`; `ss` melihat port 8081 listening.

**Jika gagal:** `journalctl -u reverb-nds -n 50`. Error umum: `.env` belum config cache terupdate → `php artisan config:cache` ulang setelah menghint `.env`.

---

### Langkah 20 — Uji realtime end-to-end

**Tujuan:** Membuktikan chat support/kamera behavior bekerja.

**Lokasi:** 2 browser berbeda (bias mode/private): browser medes + fleet admin; browser lain login customer.

**Cara:** Admin → `/admin/support/<ticket>`, customer → `/customer/support/<ticket>`; ketik di kedua sisi:
- Pesan muncul **tanpa reload** di sisi sati hingga lain.
- Indicator "sedang mengetik" muncul real-time.
- badge unread menghitung naik.

**Teknis di Network browser:**_ws://...` atau `wss://YOUR_DOMAIN/app/...` status **101**; tanpa error kamazaban CSP.

**Jika gagal:** `journalctl -u reverb-nds`; kabar CSP bloom → cocok lagi equalizer 13 (REVERB_* 443/https) dan assessment 2 (build Vite); bash `curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: x3JJHMBoBuXvMIqNQ==" -H "Sec-WebSocket-Version: 13" https://YOUR_DOMAIN/app/<REVERB_APP_KEY>` → balasan **HTTP 101** open.

---

# BAGIAN 7 — SMTP & TAWK.TO

### Langkah 21 — SMTP, Tawk.to, dan Webhook

**Tujuan:** Menyiapkan 3 integrasi yang dibaca `.env`.

**A. SMTP email (login admin, reset password, dsb.):**
Sudah diset di `.env` Langkah 13 (salin dari lokal). Uji dari SSH:
```bash
cd /var/www/nds
php artisan tinker <<< 'use Illuminate\Support\Facades\Mail; Mail::raw("test deploy", function($m){ $m->to("EMAIL_ANDA@contoh.com")->subject("SMTP NDS"); });'
```
(tanpa menampilkan password di output). Email harus masuk ke inbox anda.

**B. Tawk.to chat widget:**
1. Widget chat Tawk.to di frontend sudah hidup lewat property ID di `.env` (sudah ditangani oleh aplikasi; tidak perlu menambah script manual).
2. **Webhook**: buka dashboard `https://dashboard.tawk.to` → Administration → Webhooks, dilengkapi URL: `https://YOUR_DOMAIN/webhooks/tawk` dengan **secret** yang sama persis dengan `TAWK_WEBHOOK_SECRET` di `.env` (Langkah 13). Backend timezone menangani verifikasi HMAC signature (audit project), Laravel CSRF dikecualikan untuk path `webhooks/*`.
3. Isi tingginya di `.env` setelah dashboard

**C. Calendar cron Tawk:**
Silakan via Langkah bagian 8 di bawah; `tawk:sync` setiap menit menarik chat Tawk terbaru ke tabel `contact_messages` + broadcast realtime `TawkChatReceived`.

**Jika gagal:** SMTP 535 → app-password Gmail salah/kurang lengkap tanpa spasi; webhook Tawk rejected → secret tidak match (kalau di dashboard vs `.env`).

---

# BAGIAN 8 — SCHEDULER & QUEUE

### Langkah 22 — Cron Laravel Scheduler (WAJIB untuk project ini)

**Tujuan:** Audit menemukan `routes/console.php` memvalid `tawk:sync` setiap menit dengan `withoutOverlapping()` → cron `schedule:run` **wajib**; menghapusnya mematikan integrasi Tawk.

**Lokasi:** SSH VPS

**Command:**
```bash
crontab -e -u www-data
```
Tambah baris:
```cron
* * * * * cd /var/www/nds && /usr/bin/php artisan schedule:run >> /dev/null 2>&1
```
Verifikasi:
```bash
crontab -l -u www-data
sudo -u www-data php artisan schedule:list   # harus terlihat tawk:sync
```

**Queue worker: TIDAK DIBUTUHKANLAYANAN**
Audit menunjukkan **tidak ada** job ShouldQueue/job listener biasa di project — semua broadcasting memakai `ShouldBroadcastNow` (dikirim langsung in-request), `QUEUE_CONNECTION=database` dipake value default saja + fail-safety. Jadi **jangan** membuat Supervisor/systemd queue worker; jika di masa depan tampil fitur queue, barulah tambahkan:
```ini
# /etc/systemd/system/queue-nds.service  (HANYA jika kebutuhan bermula)
ExecStart=/usr/bin/php /var/www/nds/artisan queue:work --sleep=3 --tries=3
```

**Hasil yang diharapkan:** `schedule:list` menampilkan command `tawk:sync` next run ± 1 menit; setelah beberapa menit, `storage/logs/laravel.log` tidak memuat berisikan tawk secrete.

**Jika gagal:** cron tidak jalan → `service cron status`; pesan php tidak masuk cron → karena `-u www-data` user; pastikan path `/usr/bin/php` dari `which php`.

---

# BAGIAN 9 — SECURITY PRODUCTION

### Langkah 23 — Firewall & SSH

**Lokasi:** SSH VPS

**Command:**
```bash
# Firewall: hanya SSH, HTTP & HTTPS. Port internal TIDAK dibuka.
apt install -y ufw
ufw default deny incoming
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status

# SSH hardening (kunci SSH wajib; jangan matikan password AKTIF sebenartsama kunci diuji!)
ssh-keygen -t ed25519                      # di Windows PowerShell (bukan di VPS)
ssh SSH_USER@YOUR_VPS_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys" < "$env:USERPROFILE\.ssh\id_ed25519.pub"
# Setelah login via key BERHASIL, baru edit:
nano /etc/ssh/sshd_config
#    PasswordAuthentication no
#    PermitRootLogin prohibit-password
systemctl restart ssh
```

**Penjelasan:** database (3306) + Reverb (8081) **tetap tertutup** dari internet; akses DB hanya via SSH. `prohibit-password` pukul password login root tanpa MODAL MANA karena key sudah aktif.

**Hasil yang diharapkan:** `ufw status` → hanya 22/80/443; login SSH key works normal; password deny conse.

**Jika gagal:** kamu shutdown SSH password sebelum key diuji → gunakan console recovery provider. Ufw EIP — check `ufw show added`; Rollback: `ufw disable`.

---

### Langkah 24 — Checklist hardening aplikasi

**File yang perlu diedit:** tidak ada (semua dilakukan via perintah + config yang sudah audit-secure).

**Command:**
```bash
cd /var/www/nds
# 1. Pastikan APP_DEBUG off & ENV production
grep -E "^APP_DEBUG|^APP_ENV" .env                       # false, production

# 2. Permission file yang benar (bukan 777)
chmod 640 .env; chown root:www-data .env
find storage bootstrap/cache -type d -exec chmod 775 {} \;
find storage bootstrap/cache -type f -exec chmod 664 {} \;
chown -R www-data:www-data /var/www/nds                  # code read-only untuk www-data
chmod 750 /var/www/nds

# 3. Tidak ada file SQL/ZIP/backup di doc root (folder public)
ls /var/www/nds/public/*.zip /var/www/nds/public/*.sql 2>/dev/null   # harus kosong

# 4. Debug/testing file tidak terbawa
rm -f public/phpinfo.php public/info.php public/test.php 2>/dev/null
grep -rl "dd(" app/ | head    # bersihkan debug dd() yang tersisa di file fungsional — sebelum deploy hapus manual

# 5. Web app hardening di PHP-FPM
sudo sed -i 's/;cgi.fix_pathinfo=1/cgi.fix_pathinfo=0/' /etc/php/8.2/fpm/php.ini
systemctl reload php8.2-fpm
```

**Penjelasan:**
- `.env` 640 root:www-data — hanya www-data (proses PHP) yang dapat baca; internet besar tidak.
- `security_headers` middleware aplikasi sudah membawa: CSP incl. wss & tawk, HSTS, `X-Frame-Options DENY`, nosniff, Permissions-Policy. Anda ⚠ **menghadapi catatan deploy**: `trustProxies'*` di `bootstrap/app.php` dipakai asal-developmen. Dengan Nginx di server yang sama ini ACCEPTABLE tapi lebih aman set `at: '127.0.0.1'` — **perubahan 1 baris kode, minta persetujuan agent sebelum diuhag**.
- Backup ARMA ke `/root` atau `/home/backup/` — BUKAN di doc root.

**Hasil yang diharapkan:** `curl https://YOUR_DOMAIN` semuanya 200/301; `curl https://YOUR_DOMAIN/.env` → **403**; `curl https://YOUR_DOMAIN/storage/...` file gambar OK; /storage/*.php → **403/404**.

**Jika gagal:** 403 unexpected → `tail -f /var/log/nginx/error.log`; permission app error → check `storage/logs/laravel.log`.

---

# BAGIAN 10 — TESTING SETELAH DEPLOYMENT

### Langkah 25 — Checklist fungsional

**Lokasi:** browser (publik URL) + SSH cmd status

Fungsional (osilasi Anda memakai domain):
| Target | URL | Harus |
|---|---|---|
| Homepage | `https://YOUR_DOMAIN/` | 200 tampil lengkap |
| Health route | `https://YOUR_DOMAIN/up` | 200 "OK" |
| Tentang Kami | `/about` | 200 |
| Daftar Layanan | `/services` | 200, 6 layanan + ikon |
| Detail Layanan | `/services/web-development` | 200, konten |
| Cakupan + cek area | `/about` widget → POST `/coverage/check` | 200, hasil wilayah |
| Promo | `/promo` | 200,礁 promo |
| Blog | `/blog`, `/blog/<slug>` | 200 |
| Hubungi Kami | `/contact` (submit kosong → validasi muncul) | 200 |
| Kebijakan Privasi | `/privacy` | 200 |
| Login | `/login` | halaman login |
| Login admin | gunakan kredensial dari SQL localexport | masuk → redirect `/admin` dashboard |
| CRUD admin | services → edit service → simpan umum | data tersimpan, upload gambar DB |
| CRUD promo/artikel | simpan → tampil, urutan sesuai sort_order | — |
| Pesan masuk | admin → `/admin/messages` | terlihat pesan contact+Tawk |
| Login customer | admin membuat customer dari panel lalu login | dashboard |
| Logout | POST `/logout` | redirect /login |

Tech commands (di SSH):
```bash
systemctl status nginx php8.2-fpm mariadb reverb-nds --no-pager | grep -E "Active:|●"
curl -s -o /dev/null -w "%{http_code}\n" https://YOUR_DOMAIN                # 200
curl -s -o /dev/null -w "%{http_code}\n" https://YOUR_DOMAIN/up             # 200
curl -s -o /dev/null -w "%{http_code}\n" https://YOUR_DOMAIN/.env           # 403
curl -s -o /dev/null -w "%{http_code}\n" https://YOUR_DOMAIN/storage/nonexistent  # 404
curl -sI https://YOUR_DOMAIN | grep -i strict-transport-security            # HSTS header
tail -n 30 /var/www/nds/storage/logs/laravel.log    # tidak menumpuk error baru
tail -n 20 /var/log/nginx/error.log                                  # tanpa fatal
journalctl -u reverb-nds -n 20                                       # tanpa restart loop
```

**Hasil yang diharapkan:** semua 200 / 301 sesuai target; log tidak memcontain error baru; 4.xx-50x 0.

**Jika gagal:** general case → cek `storage/logs/laravel.log` (Laravel tujuan pertama), lalu `nginx error.log`. Error `manifest.json` idealnya `.env` APP_ENV salah → nginx membuang snakt nimliği? — pastikan Permission/public/build 644 readable.

### Mobile check
Buka homepage di HP (atau Chrome DevTools device mode 390px): slider, menu, form login, chat — semua terbaca & tanpa horizontal scroll.

---

# BAGIAN 11 — MONITORING & ROLLBACK

### Langkah 26 — Monitoring harian

```bash
df -h / && free -m                       # disk & RAM
journalctl -u reverb-nds -n 50
tail -n 100 /var/www/nds/storage/logs/laravel.log | grep -i error
tail -n 100 /var/log/nginx/error.log
php artisan queue:failed                 # jika suatau suaktu queue; harus 0 rows
```
Laravel `schedule:run` + `tawk:sync` check → `storage/logs` job status tim.

### Langkah 27 — Rollback deployment

**Urutan yang aman (tanpa kehilangan data):**
1. **Website normal**: doc root mengarah ke `YOUR_PROJECT_PATH` sama — tidak ada website lama yang dihapus.
2. Bahaya: kemudahan memakai variasi место release like `/var/www/nds.bak` — gua fot Let's path change:
```bash
# taruh release baru sebagai direktori terpisah lalu:
mv /var/www/nds /var/www/nds-failed
mv /var/www/nds.bak /var/www/nds
nginx -t && systemctl reload nginx
```
3. `.env` lama: selalu `cp .env /root/env-<label>/backup.env` (chmod 600) **sebelum** mengedit.
4. Database rollback: **selalu dump DB terbaru DULU** (data baru tidak boleh hilang):
```bash
mysqldump --single-transaction -u root -p DB_NAME > /root/db-before-rollback-$(date +%F).sql
# SETELAH dump: bila memang perlu restore, dari backup Langkah 4.
mysql -u root -p DB_NAME < /root/db_backup.sql
```

---

# BAGIAN 12 — ALTERNATIF SKENARIO (TERPISAH)

### A. Apache (ganti Nginx)
- `apt install -y apache2 libapache2-mod-php8.2` (skip Nginx)
- Laravel sudah menyertakan `public/.htaccess` (urat dan teruji) — **tidak perlu edit**.
- VirtualHost `/etc/apache2/sites-available/nds.conf`:
```apache
<VirtualHost *:80>
    ServerName YOUR_DOMAIN
    DocumentRoot /var/www/nds/public
    <Directory /var/www/nds/public>
        AllowOverride All       # wajib agar .htaccess mod_rewrite Laravel aktif
        Require all granted
    </Directory>
    ErrorLog ${APACHE_LOG_DIR}/nds-error.log
    CustomLog ${APACHE_LOG_DIR}/nds-access.log combined
</VirtualHost>
```
- `a2enmod rewrite ssl headers proxy_wstunnel && a2enmod nds.conf && apachectl -t && systemctl reload apache2`
- Reverb proxy (Apache): `<Location /app/> ProxyPass ws://127.0.0.1:8081 </Location>` + `ProxyPassMatch /apps/ http://127.0.0.1:8081`
- SSL: `certbot --apache -d YOUR_DOMAIN -d www.YOUR_DOMAIN`
- Proteksi file: `public/.htaccess` plus, karena `public_html` scenario — tambahkan `.htaccess` deny file:
```apache
<FilesMatch "\.(env|sql|zip|log|md)$"> Require all denied </FilesMatch>
```

### B. Control panel dengan `public_html` (CyberPanel/CWP/cPanel)
Struktur:
```
/home/<panel-user>/
├── public_html/               ← doc root panel (tetap di sini)
│   ├── index.php              ← DIEDIT: 2 path diarahkan ke ../<blog>/B
│   ├── .htaccess              ← copy dari <bandítő>/public/htaccess
│   ├── build/                 ← copy dari <project>/public/build
│   └── storage → ../<bidi>/storage/app/public   (sylnk)
└── storage-called/            ← full source code
```
Edit `public_html/index.php`:
```php
require __DIR__.'/../nds-app/vendor/autoload.php';   // garsi sekali
$app = require_once __DIR__.'/../nds-app/bootstrap/app.php';
```
Folder source (`nds-app` nama apa saja) TIDAK terekspose; `.env` tetap aman di dalamnya.
- PHP version pilih 8.2 di panel; set `upload_max_filesize=20M, post_max_size=24M` di panel.
- Cron panel → letakkan command schedule:run anuation (Langkah 22).
- Reverb service tetap dibuat via systemd (Langkah 19), hanya `WorkingDirectory` sesuai path source.
- Proxy WebSocket di panel (OpenLiteSpeed vHost): gunakan ExternalApp / proxy context `/app/` → `127.0.0.1:8081`. Jika panel tidak mau proxy WebSocket, alternatif: aktifkan port Reverb di firewall (8081), lalu di `.env` set `REVERB_SCHEME=https REVERB_PORT=443` tetap → deployed `wss://YOUR_DOMAIN:8081` (chmod sertifikat Let's Encrypt domain). Ini tanpa CSP berubah.

---

### Ringkasan urutan pengerjaan (quick checklist)
1. Windows: build → dump → zip (Langkah 1–4)
2. VPS: apt/PHP/Composer/DB/Nginx (5–9)
3. DNS A → server, upload, extract (10–12)
4. `.env` → DB import → composer + permissions + caches (13–15)
5. Nginx block → HTTPS certbot (17–18)
6. Reverb service → cron → Mail/Tawk webhook (19–22)
7. Security (23–24) → Testing (25) → Monitoring (26)
