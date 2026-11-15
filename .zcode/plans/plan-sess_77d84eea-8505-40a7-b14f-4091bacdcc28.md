# Rencana: Redesign Halaman Login NDS (split-screen, sesuai HTML referensi)

## Context
Halaman login saat ini (`resources/js/Pages/Login.tsx`) berupa card putih di tengah background navy penuh. Anda ingin menggantinya dengan desain split-screen dari HTML referensi: panel kiri branding putih dengan micro-grid + ilustrasi 3D teknologi biru, panel kanan form login minimalis dalam card putih — diwarnai ulang dengan identitas NDS (navy `#10264A`, electric blue `#2563EB`, putih, abu netral) dan terintegrasi penuh dengan auth Laravel/Inertia yang sudah ada.

## Temuan Eksplorasi (yang dipakai, tidak diubah)
- **Backend sudah lengkap & role-aware**: `app/Http/Controllers/AuthController.php` — validasi `email` (required, format email) + `password`, `remember` boolean, rate limit 5x/300s, redirect by role (`redirectByUserRole`: admin → `admin.dashboard`, customer → `customer.dashboard`, customer non-aktif → logout + flash `error`). Tidak perlu disentuh.
- Route: GET/POST `/login`, forgot password **ada** → `route('password.request')` (link "Lupa Password?" punya tujuan nyata).
- Shared props (`HandleInertiaRequests`): `auth.user`, `flash.error/success`, `settings` (`logo_path`, `company_name`).
- Design token siap pakai di `resources/css/app.css` `@theme`: `navy`, `navy-dark`, `tech-blue/electric-blue` (+hover `#1D4ED8`), `electric-light #EAF1FF`, `border-soft #E2E8F0`, `border-strong`, `body-text`, shadow token (`shadow-card` dll). Font project: **Inter** (dimuat di `app.blade.php`; Geist tidak terpasang → pakai Inter). Ikon: **lucide-react** (bahasa ikon project, pengganti Material Symbols referensi).
- Logo asli: wordmark "NDS" (biru/merah) dipakai mentah via `settings?.logo_path || "/images/logo.png"` (pola yang sama di navbar `Components/Navbar.tsx`). Navbar login saat ini tidak dipakai (Login render standalone, tanpa layout) — tetap begitu.

## Keputusan Desain (design read + alasan per keputusan)
Reading: halaman login portal B2B (ISP/solusi digital) untuk admin & pelanggan, bahasa visual minimalis putih-navy khas NDS. **Dial ENERGY 1 / RHYTHM 1 / MOTION 1** (hover/fokus saja).

Mapping referensi → NDS:
- Split 48/46% kiri vs 52/54% kanan, `flex-col lg:flex-row` (stack di bawah lg, persis referensi).
- Micro-grid: SVG pattern stroke `#E2E8F0` (= `border-soft`), opacity-40 — permintaan eksplisit Anda, konsisten token.
- Aksen radial kanan: blob `electric-light` blur-3xl — satu depth cue lembut, bukan glow.
- CTA "Masuk": `bg-navy` hover `navy-dark` (referensi `slate-900` → navy utama NDS), ikon `ArrowRight` bergerak tipis saat hover.
- Electric blue **hanya** untuk: focus ring input, link "Lupa Password?", ikon aksen, checkbox accent — satu keluarga aksen, dosis terbatas.
- Elemen referensi yang **dibuang** (sesuai larangan Anda + aturan honesty antislop R-36): chip "IDN-NODE • LIVE" (status palsu), badge "Sovereign Tier" & "AES-256", klaim SSL/ISO di footer, versi `v4.8.2-prod`, copy buzzword "infrastruktur komputasi cerdas…enterprise".
- **Label form: "Email" (bukan "Email atau Username")** — backend memvalidasi format email, tabel users tidak punya kolom username, dan Anda melarang mengubah mekanisme autentikasi. Placeholder `nama@email.com`.
- Headline kiri: "Akses Sistem Terpusat" + satu kalimat jujur sesuai bisnis nyata NDS: "Kelola layanan internet dan solusi digital bisnis Anda dari satu tempat."
- Ilustrasi: file SVG lokal baru (lihat di bawah), komposisi isometrik abstrak (layer kubus/node jaringan) navy + electric blue, sebagai pengganti URL gambar eksternal referensi. Koneksi produk: perusahaan infrastruktur jaringan.

## Perubahan File (2 file)
1. **Baru**: `public/images/login-visual.svg` — ilustrasi 3D-tech abstrak biru buatan lokal (SVG vektor, bukan aset eksternal).
2. **Rewrite**: `resources/js/Pages/Login.tsx` — satu-satunya file kode yang diubah.

Struktur `Login.tsx` baru:
- **Panel kiri**: header logo wordmark (`settings.logo_path || "/images/logo.png"`, object-contain h-9/10, tanpa filter) + sublabel kecil `company_name`; tengah: `<img src="/images/login-visual.svg">` (drop-shadow, hover scale halus, hidden di mobile) + h1 "Akses Sistem Terpusat" (`text-navy`) + satu kalimat deskripsi; footer: `© {tahun} {company_name} • Hak Cipta Dilindungi`.
- **Panel kanan**: card `max-w-[430px] bg-white border-border-soft rounded-2xl shadow-card p-8 sm:p-10`, berisi: baris ikon `KeyRound` dalam kotak `electric-light` + label "PORTAL LOGIN" (permintaan eksplisit Anda); judul "Login" `text-2xl font-bold text-navy`; subjudul "Masuk ke akun Anda"; input Email (ikon `User` trailing); input Password dengan tombol `Eye`/`EyeOff` fungsional (aria-label, area sentuh ≥44px); baris checkbox "Ingat Saya" (`accent-tech-blue`) + link "Lupa Password?" → `route('password.request')`; tombol "Masuk" navy dengan state `processing` nyata dari `useForm` (Loader2 berputar + "Memproses…", disabled).
- **State nyata (bukan simulasi)**: tetap `useForm({ email, password, remember })` + `post(route('login'))`; banner error Inertia (`errors`, merah) + banner `status` (hijau) dipertahankan; **plus** banner `flash.error` (pesan "Akun Anda belum aktif…" dari backend yang selama ini tidak tampil di login).
- **A11y**: label terasosiasi (`htmlFor`), focus ring terlihat (`focus:ring-tech-blue/20` + `focus-visible`), tab order natural, kontras token sudah AA (navy/body-text di atas putih).
- **Responsive**: lg+ split-screen; tablet/mobile stack — kiri jadi blok ringkas (logo + headline, ilustrasi disembunyikan di <sm), form tetap fokus; `min-h-dvh`, tanpa horizontal overflow.

## Yang TIDAK diubah
Routes/controller/middleware/role/DB, dashboard admin & customer, halaman publik, navbar/footer, `app.css`/tema global, halaman forgot/reset password, komponen lama lain.

## Verifikasi
Catatan: shell Bash di sesi ini sedang error (`spawn EFTYPE`) — akan dicoba ulang; jika tetap mati, saya akan minta Anda menjalankan `npm run build` / `npm run dev`.
1. `npm run build` lolos (TypeScript + Vite).
2. Buka `/login` via browser automation (skill browser-use) di 1440px / 768px / 390px: screenshot desktop-tablet-mobile, cek tidak ada overflow horizontal.
3. Click-through nyata: toggle password bekerja (ikon & type berubah), submit kosong → error validasi backend tampil, kredensial salah → banner "Email atau password salah.", tombol disabled + spinner saat `processing`, console bersih.
4. Login sukses (redirect admin/customer) membutuhkan kredensial nyata — akan saya minta Anda mengujinya, atau jika shell hidup kembali saya buat user uji sementara via tinker (dengan persetujuan Anda).
5. Delivery Gate antislop: laporan PASS/FAIL per aturan (R-02, R-03, R-25, R-26, R-27, R-32, R-35, R-36, dsb.) disertakan dengan deliverable.