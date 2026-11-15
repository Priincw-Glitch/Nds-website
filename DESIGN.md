# DESIGN.md — Design Direction for Nusantara Digital Solution (NDS)

> **Catatan (Agent-Generated Direction):**
> Dokumen ini disusun oleh agen berdasarkan codebase yang ada (`NDS-WEBSITE` / `app.css` / komponen). Arah desain dari AI cenderung merefleksikan rasa default yang netral. Anda disarankan meninjau dan memperbarui nilai atau dial di bawah ini agar benar-benar mencerminkan identitas dan karakter otentik brand Anda.

---

## 1. Identitas & Produk
- **Nama Brand:** Nusantara Digital Solution (NDS)
- **Produk / Layanan:** Solusi teknologi terintegrasi, konsultasi IT, pengembangan web/aplikasi, arsitektur sistem, dan transformasi digital B2B.
- **Audiens:** Pemilik bisnis, manajer operasional, instansi, dan enterprise yang membutuhkan mitra teknologi terpercaya, terukur, dan berjangka panjang.
- **Tone & Mood:** Profesional, konsultatif, terpercaya, tenang, berintegritas. Menghindari bahasa bombastis, hype AI, atau janji-janji statistik fiktif.

---

## 2. Dials (Tiga Parameter Desain)
```text
Dial: ENERGY 2 / RHYTHM 2 / MOTION 2
```
- **ENERGY: 2 (Balanced)** — Tenang dan kredibel layaknya enterprise B2B tech solution, tegas tanpa agresif.
- **RHYTHM: 2 (Consistent with breaks)** — Tata letak terstruktur dengan variasi komposisi antar section (tidak seragam semua 3-kolom kartu).
- **MOTION: 2 (Subtle & purposeful)** — Animasi transisi halus (GSAP reveal) untuk memandu fokus mata, tanpa bouncing berlebihan atau animasi tanpa fungsi.

---

## 3. Palet Warna (Color System)
Berdasarkan `resources/css/app.css`:
- **Identity / Primary:**
  - `Navy`: `#0b1f44` (Hero background, dark navbar, footer, primary text heading)
  - `Deep Navy`: `#07162f` (Permukaan paling gelap, kontras tinggi)
- **Interactive / Accent:**
  - `Tech Blue`: `#1677d2` (Link interaktif, hover state, ikon, eyebrow underline)
  - `Electric Light`: `#4da6f8` (Highlight teks / link di atas latar belakang Navy gelap)
- **Limited Accent (CTA / Alert Only):**
  - `Crimson`: `#e52532` (Hanya untuk tombol aksi utama, badge promo aktif, error)
  - `Crimson Dark`: `#c41e29` (Hover state untuk tombol crimson)
- **Surfaces & Neutrals:**
  - `White`: `#ffffff` (Latar belakang konten utama)
  - `Light Gray`: `#f3f6fa` (Latar belakang alternatif section sekunder)
  - `Border Soft`: `#e2e8f0` (Border kartu, pemisah section)
  - `Body Text`: `#52627a` (Teks paragraf utama dengan kontras nyaman)

---

## 4. Tipografi
- **Font Family:** `Inter`, ui-sans-serif, system-ui, sans-serif
- **Headings:**
  - H1: `2.25rem` – `3.75rem`, `font-bold (700)`, `tracking: -0.02em`, `line-height: 1.15`
  - H2: `1.875rem` – `2.25rem`, `font-bold (700)`, `tracking: -0.02em`, `line-height: 1.2`
  - H3: `1.5rem`, `font-bold (700)`, `line-height: 1.3`
- **Eyebrow:** `0.75rem`, `font-semibold (600)`, `tracking: 0.2em`, uppercase, beraksen garis `Tech Blue`.
- **Body:** `1rem` (`text-base`), `leading-relaxed`, color: `--color-body-text`.

---

## 5. Pedoman Komponen & Anti-Slop
- **Tombol & CTA:** Teks tombol harus spesifik tindakan ("Hubungi Tim Konsultan", "Lihat Rincian Layanan", "Jadwalkan Diskusi") — hindari kata generik seperti "Click Here", "Learn More", atau "Get Started" tanpa konteks.
- **Ikonografi:** Ikon harus relevan secara semantik dengan poin yang dibahas, bukan ikon centang (`CheckCircle2`) yang diulang tanpa arti.
- **Section Layout:** Variasikan susunan layout (misal: split 2-kolom teks + panel untuk solusi, grid asimetris untuk fitur utama, tabel komparasi sederhana) untuk mencegah template statis.
- **Aksesibilitas (Human):** Pastikan rasio kontras teks terhadap latar belakang memenuhi standar WCAG AA (minimal 4.5:1 untuk body text, 3:1 untuk large text/UI borders).
