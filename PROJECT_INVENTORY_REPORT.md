# PROJECT INVENTORY REPORT — NDS WEBSITE

**Generated:** 2026-11-06  
**Project Path:** `D:\laragon\www\NDS-WEBSITE`  
**Project Type:** Laravel 12 + React 19 + Inertia.js SPA (Single Page Application)

---

## 1. RINGKASAN PROJECT

**NDS Website** adalah website perusahaan **Nusantara Digital Solution (NDS)** yang dibangun dengan **Laravel 12** (backend) dan **React 19 + TypeScript** (frontend) menggunakan **Inertia.js** sebagai bridge tanpa API terpisah. Project ini adalah **full-stack monorepo** dengan arsitektur modern yang mencakup:

| Aspek | Detail |
|-------|--------|
| **Framework Backend** | Laravel 12.x (PHP ^8.2) |
| **Framework Frontend** | React 19.3.1 + TypeScript 7.0.2 |
| **Bridge** | Inertia.js 3.9.1 (@inertiajs/react) |
| **Styling** | Tailwind CSS 4.0 (via @tailwindcss/vite) |
| **UI Components** | Radix UI primitives + custom components |
| **Animasi** | GSAP 3.15 + Lenis 1.3.27 + Framer Motion 14.8 |
| **Real-time** | Laravel Reverb 1.12 + Pusher JS 8.6 (WebSocket) |
| **Database** | SQLite (development) / MySQL/PostgreSQL ready |
| **Build Tool** | Vite 6.0.11 + laravel-vite-plugin |
| **Package Manager** | npm (Node.js) + Composer (PHP) |

### Fungsi Utama Website
1. **Public Website** — Homepage, Services, Blog, Promo, Coverage Check, Contact
2. **Admin Panel** — CRUD untuk Services, Promos, Articles, Projects, Settings, Customer Management, Support Tickets
3. **Customer Portal** — Dashboard, Profile, My Promos, Support Chat (Real-time), Notifications
4. **Real-time Features** — Support chat, typing indicators, presence, notifications via Reverb
5. **Integrasi Eksternal** — Tawk.to webhook, Email (SMTP), File upload

---

## 2. TEKNOLOGI DAN VERSI

### Backend (composer.json)
| Package | Versi | Kategori |
|---------|-------|----------|
| php | ^8.2 | Runtime |
| laravel/framework | ^12.0 | Core Framework |
| inertiajs/inertia-laravel | ^3.5 | Inertia Bridge |
| laravel/reverb | ^1.12 | WebSocket Server |
| laravel/tinker | ^2.10.1 | REPL |
| tightenco/ziggy | ^2.6 | Route Helper JS |
| fakerphp/faker | ^1.23 | Dev: Test Data |
| laravel/pail | ^1.2.2 | Dev: Log Viewer |
| laravel/pint | ^1.13 | Dev: Code Style |
| laravel/sail | ^1.41 | Dev: Docker |
| mockery/mockery | ^1.6 | Dev: Mocking |
| nunomaduro/collision | ^8.6 | Dev: Error Handling |
| phpunit/phpunit | ^11.5.3 | Dev: Testing |

### Frontend (package.json)
| Package | Versi | Kategori |
|---------|-------|----------|
| react | ^19.3.1 | Core UI |
| react-dom | ^19.3.1 | Core UI |
| @inertiajs/react | ^3.9.1 | Inertia Client |
| @radix-ui/react-* | various | Headless UI Primitives |
| tailwindcss | ^4.0.0 | Styling |
| @tailwindcss/vite | ^4.0.0 | Vite Plugin |
| gsap | ^3.15.0 | Animation |
| lenis | ^1.3.27 | Smooth Scroll |
| motion | ^14.8.0 | Framer Motion |
| swiper | ^14.3.0 | Carousel/Slider |
| lucide-react | ^1.60.0 | Icons |
| @icons-pack/react-simple-icons | ^13.15.1 | Brand Icons |
| laravel-echo | ^2.6.1 | WebSocket Client |
| pusher-js | ^8.6.0 | WebSocket Transport |
| ziggy-js | ^2.6.5 | Route Helper |
| class-variance-authority | ^0.7.1 | Utility |
| clsx | ^2.1.1 | Utility |
| tailwind-merge | ^3.7.0 | Utility |
| typescript | ^7.0.2 | Type Checking |
| vite | ^6.0.11 | Build Tool |
| @vitejs/plugin-react | ^4.3.4 | React Plugin |
| laravel-vite-plugin | ^1.2.0 | Laravel Integration |
| axios | ^1.7.4 | HTTP Client |

### Konfigurasi Build
- **vite.config.ts**: Alias `@` → `resources/js`, input `resources/js/app.tsx`, Tailwind Vite plugin
- **tsconfig.json**: Strict mode, bundler module resolution, JSX react-jsx, path alias `@/*`
- **.editorconfig**: Standard formatting

---

## 3. STRUKTUR FOLDER LENGKAP

```
NDS-WEBSITE/
├── .agents/                    # Agent configurations (opencode)
├── .opencode/                  # OpenCode session data
├── anti-slop/                  # Anti-slop configuration
├── app/                        # Laravel Application Code
│   ├── Console/
│   │   └── Commands/
│   │       └── TawkSync.php    # Sync Tawk.to conversations
│   ├── Events/
│   │   ├── SettingsUpdated.php
│   │   ├── TawkChatReceived.php
│   │   ├── TicketConversationUpdated.php
│   │   ├── TicketMessageSent.php
│   │   ├── TicketMessagesRead.php
│   │   └── TicketTyping.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/          # 14 Admin Controllers
│   │   │   ├── Customer/       # 7 Customer Controllers
│   │   │   ├── AuthController.php
│   │   │   ├── BlogController.php
│   │   │   ├── ContactController.php
│   │   │   ├── Controller.php
│   │   │   ├── CoverageController.php
│   │   │   ├── HomeController.php
│   │   │   ├── PasswordResetController.php
│   │   │   ├── PromoController.php
│   │   │   ├── ServiceController.php
│   │   │   └── TawkWebhookController.php
│   │   ├── Middleware/
│   │   │   ├── Authenticate.php
│   │   │   ├── EnsureCustomerIsActive.php
│   │   │   ├── EnsureUserIsAdmin.php
│   │   │   ├── HandleInertiaRequests.php
│   │   │   └── SecurityHeaders.php
│   │   └── Requests/           # 7 Form Requests
│   ├── Models/                 # 20 Eloquent Models
│   ├── Providers/
│   │   └── AppServiceProvider.php
│   └── Services/
│       └── TawkService.php
├── bootstrap/
│   ├── app.php
│   ├── cache/
│   └── providers.php
├── config/                     # 12 Laravel Config Files
│   ├── app.php
│   ├── auth.php
│   ├── broadcasting.php
│   ├── cache.php
│   ├── database.php
│   ├── filesystems.php
│   ├── logging.php
│   ├── mail.php
│   ├── queue.php
│   ├── reverb.php
│   ├── services.php
│   ├── session.php
│   └── tawk.php
├── database/
│   ├── factories/
│   │   └── UserFactory.php
│   ├── migrations/             # 30 Migration Files
│   ├── seeders/
│   │   ├── AdminUserSeeder.php
│   │   └── DatabaseSeeder.php
│   ├── database.sqlite         # SQLite DB (86 MB)
│   ├── nds_website.sql         # SQL Dump (78 MB)
│   └── setup_layout_size_column.php
├── lang/
│   └── id/                     # Indonesian translations
│       ├── auth.php
│       ├── passwords.php
│       └── validation.php
├── node_modules/               # npm dependencies (excluded from analysis)
├── public/
│   ├── build/                  # Vite build output
│   │   ├── assets/             # 100+ JS/CSS chunks
│   │   └── manifest.json
│   ├── images/
│   │   ├── services/           # 7 service images
│   │   ├── hero-bg.jpg
│   │   ├── logo.png
│   │   └── logo-scrolled.png
│   ├── storage -> ../storage/app/public (symlink)
│   ├── .htaccess
│   ├── favicon.ico
│   ├── index.php
│   └── robots.txt
├── public images/              # Additional images folder
├── resources/
│   ├── css/
│   │   └── app.css             # Main styles (25 KB)
│   ├── js/
│   │   ├── Components/
│   │   │   ├── admin/          # 2 components
│   │   │   ├── customer/       # 1 component
│   │   │   ├── support/        # 4 components
│   │   │   ├── ui/             # 14 UI primitives
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── CoverageCheckSection.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── PromoCard.tsx
│   │   │   ├── PromoDetailModal.tsx
│   │   │   ├── PromoImageCard.tsx
│   │   │   ├── SectionHeading.tsx
│   │   │   ├── Seo.tsx
│   │   │   ├── ServiceCard.tsx
│   │   │   ├── ServiceIcon.tsx
│   │   │   ├── ServiceImageCard.tsx
│   │   │   ├── ServicesSection.tsx
│   │   │   └── ServiceTargetsSection.tsx
│   │   ├── hooks/
│   │   │   ├── useGsap.ts
│   │   │   ├── useLenis.ts
│   │   │   ├── useSettingsListener.ts
│   │   │   └── useTawkMessagesListener.ts
│   │   ├── Layouts/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── CustomerLayout.tsx
│   │   │   └── FrontendLayout.tsx
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── Pages/
│   │   │   ├── Admin/          # 13 sections, 30+ pages
│   │   │   ├── Auth/           # 2 pages
│   │   │   ├── Customer/       # 8 pages + 2 sub-sections
│   │   │   ├── About.tsx
│   │   │   ├── Blog.tsx
│   │   │   ├── BlogDetail.tsx
│   │   │   ├── Contact.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── NotFound.tsx
│   │   │   ├── Privacy.tsx
│   │   │   ├── Promo.tsx
│   │   │   ├── ServiceDetail.tsx
│   │   │   └── ServicesIndex.tsx
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   └── ziggy.d.ts
│   │   ├── utils/
│   │   │   └── layout.tsx
│   │   ├── app.tsx             # Inertia bootstrap
│   │   └── echo.ts             # Laravel Echo / Reverb setup
│   └── views/
│       ├── app.blade.php       # Root blade template
│       └── welcome.blade.php   # Default Laravel welcome
├── routes/
│   ├── channels.php            # Broadcasting channels
│   ├── console.php
│   └── web.php                 # Main routes (180 lines)
├── storage/
│   ├── app/
│   ├── framework/
│   ├── inertia-devtools/
│   └── logs/
├── tests/                      # PHPUnit tests (empty)
├── tools/
│   ├── analyze_css.ps1
│   └── analyze_css2.ps1
├── vendor/                     # Composer dependencies (excluded from analysis)
├── .editorconfig
├── .env                        # Environment config (1.9 KB)
├── .env.backup-chat-20261103   # Backup env
├── .env.example                # Environment template (122 lines)
├── .gitattributes
├── .gitignore
├── .phpunit.result.cache
├── AGENTS.md                   # Agent instructions
├── all_responsiveness_report.json
├── antislop.md                 # Anti-slop rules
⚠️ audit_results.json           # Audit results
⚠️ audit_routes.php             # Route audit script
⚠️ check_data.php               # Data check script
├── composer.json
├── composer.lock               # 351 KB - locked dependencies
├── cookies.txt
├── CUSTOMER_PORTAL_COMPLETE.md
├── CUSTOMER_PORTAL_GUIDE.md
├── DESIGN.md
├── findstr                     # Empty file
├── fix-mail-password.php
├── GEMINI.md
├── login-debug.html
├── NAVBAR-IMPLEMENTATION.md
├── npm                         # Empty file
├── package-lock.json           # 195 KB - locked npm deps
├── package.json
├── phpunit.xml
├── README.md                   # Default Laravel README
⚠️ responsiveness_results.json  # Test results
├── skills-lock.json
├── TAWK_AI_PROMPT.md
├── test-mail.php
├── test_all_responsiveness.cjs
├── test_quick_fix.cjs
⚠️ test_responsiveness.cjs
⚠️ test_runner_full.cjs
├── tsconfig.json
└── vite.config.ts
```

---

## 4. DAFTAR SELURUH FILE SOURCE CODE

| No | Lokasi File | Nama File | Ekstensi | Kategori | Fungsi |
|---|---|---|---|---|---|
| 1 | app/Console/Commands/ | TawkSync.php | .php | Console Command | Sinkronisasi percakapan Tawk.to ke database |
| 2 | app/Events/ | SettingsUpdated.php | .php | Event | Broadcast saat pengaturan admin diupdate |
| 3 | app/Events/ | TawkChatReceived.php | .php | Event | Broadcast saat chat Tawk.to diterima |
| 4 | app/Events/ | TicketConversationUpdated.php | .php | Event | Broadcast update percakapan support |
| 5 | app/Events/ | TicketMessageSent.php | .php | Event | Broadcast pesan support baru |
| 6 | app/Events/ | TicketMessagesRead.php | .php | Event | Broadcast pesan dibaca |
| 7 | app/Events/ | TicketTyping.php | .php | Event | Broadcast indicator mengetik |
| 8 | app/Http/Controllers/ | AuthController.php | .php | Controller | Unified login/logout untuk admin & customer |
| 9 | app/Http/Controllers/ | BlogController.php | .php | Controller | Blog listing & detail (public) |
| 10 | app/Http/Controllers/ | ContactController.php | .php | Controller | Form kontak publik dengan throttle |
| 11 | app/Http/Controllers/ | Controller.php | .php | Base Controller | Base controller class |
| 12 | app/Http/Controllers/ | CoverageController.php | .php | Controller | Cek cakupan layanan by lokasi |
| 13 | app/Http/Controllers/ | HomeController.php | .php | Controller | Homepage data (services, projects, promos, articles) |
| 14 | app/Http/Controllers/ | PasswordResetController.php | .php | Controller | Laravel password reset broker |
| 15 | app/Http/Controllers/ | PromoController.php | .php | Controller | Promo listing public |
| 16 | app/Http/Controllers/ | ServiceController.php | .php | Controller | Service listing & detail public |
| 17 | app/Http/Controllers/ | TawkWebhookController.php | .php | Controller | Handle webhook Tawk.to (HMAC verified) |
| 18 | app/Http/Controllers/Admin/ | ArticleAdminController.php | .php | Admin Controller | CRUD Artikel (Index, Form) |
| 19 | app/Http/Controllers/Admin/ | ArticleCategoryAdminController.php | .php | Admin Controller | CRUD Kategori Artikel |
| 20 | app/Http/Controllers/Admin/ | CoverageAdminController.php | .php | Admin Controller | CRUD Cakupan Wilayah |
| 21 | app/Http/Controllers/Admin/ | CustomerManagementController.php | .php | Admin Controller | Kelola Customer & Registrasi (13 KB) |
| 22 | app/Http/Controllers/Admin/ | CustomerServiceManagementController.php | .php | Admin Controller | Kelola Layanan Customer (8.7 KB) |
| 23 | app/Http/Controllers/Admin/ | DashboardController.php | .php | Admin Controller | Dashboard admin statistics |
| 24 | app/Http/Controllers/Admin/ | MessageAdminController.php | .php | Admin Controller | Kelola Pesan Kontak (Index, Show, Update, Delete) |
| 25 | app/Http/Controllers/Admin/ | ProfileAdminController.php | .php | Admin Controller | Profil Admin (Edit) |
| 26 | app/Http/Controllers/Admin/ | ProjectAdminController.php | .php | Admin Controller | CRUD Project/Portofolio |
| 27 | app/Http/Controllers/Admin/ | PromoAdminController.php | .php | Admin Controller | CRUD Promo + Duplicate (7.4 KB) |
| 28 | app/Http/Controllers/Admin/ | PromoCategoryAdminController.php | .php | Admin Controller | CRUD Kategori Promo |
| 27 | app/Http/Controllers/Admin/ | ServiceAdminController.php | .php | Admin Controller | CRUD Service + Image upload (4.7 KB) |
| 28 | app/Http/Controllers/Admin/ | ServiceCategoryAdminController.php | .php | Admin Controller | CRUD Kategori Service |
| 29 | app/Http/Controllers/Admin/ | SettingAdminController.php | .php | Admin Controller | Pengaturan Website (8.9 KB) |
| 30 | app/Http/Controllers/Admin/ | SupportTicketManagementController.php | .php | Admin Controller | Kelola Tiket Support + Chat Realtime (11 KB) |
| 31 | app/Http/Controllers/Customer/ | CustomerAuthController.php | .php | Customer Controller | Auth khusus customer (jika dipisah) |
| 32 | app/Http/Controllers/Customer/ | CustomerDashboardController.php | .php | Customer Controller | Dashboard customer |
| 33 | app/Http/Controllers/Customer/ | CustomerNotificationController.php | .php | Customer Controller | Notifikasi customer |
| 34 | app/Http/Controllers/Customer/ | CustomerProfileController.php | .php | Customer Controller | Profil customer (avatar, password) |
| 35 | app/Http/Controllers/Customer/ | CustomerPromoController.php | .php | Customer Controller | Promo yang ditetapkan admin |
| 36 | app/Http/Controllers/Customer/ | CustomerServiceController.php | .php | Customer Controller | Layanan customer |
| 37 | app/Http/Controllers/Customer/ | SupportTicketController.php | .php | Customer Controller | Support chat realtime (11.6 KB) |
| 38 | app/Http/Middleware/ | Authenticate.php | .php | Middleware | Redirect unauthenticated ke login |
| 39 | app/Http/Middleware/ | EnsureCustomerIsActive.php | .php | Middleware | Cek role customer + status active |
| 40 | app/Http/Middleware/ | EnsureUserIsAdmin.php | .php | Middleware | Cek role admin |
| 41 | app/Http/Middleware/ | HandleInertiaRequests.php | .php | Middleware | Share data global ke Inertia (auth, settings, unread) |
| 42 | app/Http/Middleware/ | SecurityHeaders.php | .php | Middleware | Security headers (CSP, HSTS, etc) |
| 43 | app/Http/Requests/ | StoreArticleRequest.php | .php | Form Request | Validasi artikel |
| 44 | app/Http/Requests/ | StoreCategoryRequest.php | .php | Form Request | Validasi kategori |
| 45 | app/Http/Requests/ | StoreContactRequest.php | .php | Form Request | Validasi kontak |
| 46 | app/Http/Requests/ | StoreProjectRequest.php | .php | Form Request | Validasi project |
| 47 | app/Http/Requests/ | StorePromoRequest.php | .php | Form Request | Validasi promo (7.7 KB) |
| 48 | app/Http/Requests/ | StoreServiceRequest.php | .php | Form Request | Validasi service |
| 49 | app/Http/Requests/ | UpdatePromoRequest.php | .php | Form Request | Validasi update promo (10 KB) |
| 50 | app/Models/ | ActivityLog.php | .php | Model | Log aktivitas user |
| 51 | app/Models/ | Article.php | .php | Model | Artikel/blog post |
| 52 | app/Models/ | ArticleCategory.php | .php | Model | Kategori artikel |
| 53 | app/Models/ | CompanySetting.php | .php | Model | Key-value settings website (30+ keys) |
| 54 | app/Models/ | ContactMessage.php | .php | Model | Pesan kontak dari form publik |
| 55 | app/Models/ | CustomerProfile.php | .php | Model | Profil tambahan customer |
| 56 | app/Models/ | CustomerRegistration.php | .php | Model | Registrasi customer (pending approval) |
| 57 | app/Models/ | CustomerService.php | .php | Model | Layanan yang dimiliki customer |
| 58 | app/Models/ | Notification.php | .php | Model | Notifikasi in-app |
| 59 | app/Models/ | Project.php | .php | Model | Project/portofolio |
| 60 | app/Models/ | Promo.php | .php | Model | Promo/diskon (scopes: active, featured, home) |
| 61 | app/Models/ | PromoCategory.php | .php | Model | Kategori promo |
| 62 | app/Models/ | PromoPurchase.php | .php | Model | Promo yang dibeli/ditetapkan ke customer |
| 63 | app/Models/ | Service.php | .php | Model | Layanan (scopes: published, featured) |
| 64 | app/Models/ | ServiceCategory.php | .php | Model | Kategori layanan |
| 65 | app/Models/ | ServiceCoverage.php | .php | Model | Cakupan wilayah per layanan |
| 66 | app/Models/ | Settings.php | .php | Model | Settings lama (legacy?) |
| 67 | app/Models/ | SupportTicket.php | .php | Model | Tiket support (206 lines, relasi lengkap) |
| 68 | app/Models/ | TicketAttachment.php | .php | Model | Lampiran tiket |
| 69 | app/Models/ | TicketMessage.php | .php | Model | Pesan dalam tiket |
| 70 | app/Models/ | User.php | .php | Model | User (admin & customer), role-based |
| 71 | app/Providers/ | AppServiceProvider.php | .php | Provider | Register services, macros, etc |
| 72 | app/Services/ | TawkService.php | .php | Service | Tawk.to API integration |
| 73 | bootstrap/ | app.php | .php | Bootstrap | Application bootstrap |
| 74 | bootstrap/ | providers.php | .php | Bootstrap | Service providers list |
| 75 | config/ | app.php | .php | Config | App configuration |
| 76 | config/ | auth.php | .php | Config | Authentication config |
| 77 | config/ | broadcasting.php | .php | Config | Broadcasting (Reverb/Pusher) |
| 78 | config/ | cache.php | .php | Config | Cache stores |
| 79 | config/ | database.php | .php | Config | Database connections |
| 80 | config/ | filesystems.php | .php | Config | Filesystem disks |
| 81 | config/ | logging.php | .php | Config | Logging channels |
| 82 | config/ | mail.php | .php | Config | Mail configuration |
| 83 | config/ | queue.php | .php | Config | Queue connections |
| 84 | config/ | reverb.php | .php | Config | Reverb WebSocket config |
| 85 | config/ | services.php | .php | Config | Third-party services |
| 86 | config/ | session.php | .php | Config | Session configuration |
| 87 | config/ | tawk.php | .php | Config | Tawk.to integration config |
| 88 | database/migrations/ | 0001_01_01_000000_create_users_table.php | .php | Migration | Users table (Laravel default) |
| 89 | database/migrations/ | 0001_01_01_000001_create_cache_table.php | .php | Migration | Cache table |
| 90 | database/migrations/ | 0001_01_01_000002_create_jobs_table.php | .php | Migration | Jobs table |
| 91 | database/migrations/ | 2026_10_21_000001_create_service_categories_table.php | .php | Migration | Service categories |
| 92 | database/migrations/ | 2026_10_21_000002_create_services_table.php | .php | Migration | Services |
| 93 | database/migrations/ | 2026_10_21_000003_create_promos_table.php | .php | Migration | Promos |
| 94 | database/migrations/ | 2026_10_21_000004_create_article_categories_table.php | .php | Migration | Article categories |
| 95 | database/migrations/ | 2026_10_21_000005_create_articles_table.php | .php | Migration | Articles |
| 96 | database/migrations/ | 2026_10_21_000006_create_projects_table.php | .php | Migration | Projects |
| 97 | database/migrations/ | 2026_10_21_000007_create_contact_messages_table.php | .php | Migration | Contact messages |
| 98 | database/migrations/ | 2026_10_21_000008_create_company_settings_table.php | .php | Migration | Company settings |
| 99 | database/migrations/ | 2026_10_21_095323_create_settings_table.php | .php | Migration | Settings (legacy?) |
| 100 | database/migrations/ | 2026_10_21_124155_add_tawk_fields_to_contact_messages_table.php | .php | Migration | Tawk fields on contact |
| 101 | database/migrations/ | 2026_10_21_125500_make_email_nullable_in_contact_messages_table.php | .php | Migration | Email nullable on contact |
| 102 | database/migrations/ | 2026_10_24_100000_create_promo_categories_table.php | .php | Migration | Promo categories |
| 103 | database/migrations/ | 2026_10_24_100001_add_category_and_discount_fields_to_promos_table.php | .php | Migration | Category & discount on promos |
| 104 | database/migrations/ | 2026_10_30_100000_create_service_coverages_table.php | .php | Migration | Service coverages |
| 105 | database/migrations/ | 2026_11_02_000000_add_layout_size_to_services_table.php | .php | Migration | Layout size on services |
| 106 | database/migrations/ | 2026_11_02_070000_add_role_to_users_table.php | .php | Migration | Role column on users |
| 107 | database/migrations/ | 2026_11_02_070001_create_customer_profiles_table.php | .php | Migration | Customer profiles |
| 108 | database/migrations/ | 2026_11_02_070002_create_customer_registrations_table.php | .php | Migration | Customer registrations |
| 109 | database/migrations/ | 2026_11_02_070003_create_customer_services_table.php | .php | Migration | Customer services |
| 110 | database/migrations/ | 2026_11_02_070004_create_support_tickets_table.php | .php | Migration | Support tickets |
| 111 | database/migrations/ | 2026_11_02_070005_create_ticket_messages_table.php | .php | Migration | Ticket messages |
| 112 | database/migrations/ | 2026_11_02_070006_create_ticket_attachments_table.php | .php | Migration | Ticket attachments |
| 113 | database/migrations/ | 2026_11_02_070007_create_notifications_table.php | .php | Migration | Notifications |
| 114 | database/migrations/ | 2026_11_02_070008_create_activity_logs_table.php | .php | Migration | Activity logs |
| 115 | database/migrations/ | 2026_11_03_000001_create_promo_purchases_table.php | .php | Migration | Promo purchases |
| 116 | database/migrations/ | 2026_11_03_000002_add_customer_code_to_customer_profiles_table.php | .php | Migration | Customer code on profiles |
| 117 | database/factories/ | UserFactory.php | .php | Factory | User factory |
| 118 | database/seeders/ | AdminUserSeeder.php | .php | Seeder | Admin user seeder |
| 119 | database/seeders/ | DatabaseSeeder.php | .php | Seeder | Main seeder (280 lines, comprehensive) |
| 120 | resources/js/Components/ | ArticleCard.tsx | .tsx | Component | Card artikel untuk listing |
| 121 | resources/js/Components/ | CoverageCheckSection.tsx | .tsx | Component | Form cek cakupan wilayah (13.7 KB) |
| 122 | resources/js/Components/ | Footer.tsx | .tsx | Component | Footer website (29.5 KB) |
| 123 | resources/js/Components/ | Navbar.tsx | .tsx | Component | Navigation bar (29.5 KB) |
| 124 | resources/js/Components/ | PromoCard.tsx | .tsx | Component | Card promo (22.4 KB) |
| 125 | resources/js/Components/ | PromoDetailModal.tsx | .tsx | Component | Modal detail promo (8.9 KB) |
| 126 | resources/js/Components/ | PromoImageCard.tsx | .tsx | Component | Card gambar promo (2 KB) |
| 127 | resources/js/Components/ | SectionHeading.tsx | .tsx | Component | Heading section reusable |
| 128 | resources/js/Components/ | Seo.tsx | .tsx | Component | SEO meta tags |
| 129 | resources/js/Components/ | ServiceCard.tsx | .tsx | Component | Card layanan (7 KB) |
| 130 | resources/js/Components/ | ServiceIcon.tsx | .tsx | Component | Icon layanan |
| 131 | resources/js/Components/ | ServiceImageCard.tsx | .tsx | Component | Card gambar service (2 KB) |
| 132 | resources/js/Components/ | ServicesSection.tsx | .tsx | Component | Section daftar layanan (3.4 KB) |
| 133 | resources/js/Components/ | ServiceTargetsSection.tsx | .tsx | Component | Section target layanan (14.2 KB) |
| 134 | resources/js/Components/admin/ | DeleteButton.tsx | .tsx | Admin Component | Tombol hapus konfirmasi |
| 135 | resources/js/Components/admin/ | Pagination.tsx | .tsx | Admin Component | Pagination component |
| 136 | resources/js/Components/customer/ | SupportComposer.tsx | .tsx | Customer Component | Composer chat support (8.5 KB) |
| 137 | resources/js/Components/support/ | ConversationList.tsx | .tsx | Support Component | Daftar percakapan (6.8 KB) |
| 138 | resources/js/Components/support/ | SupportChat.tsx | .tsx | Support Component | UI Chat realtime (21 KB) |
| 139 | resources/js/Components/support/ | types.ts | .ts | Support Types | Type definitions |
| 140 | resources/js/Components/support/ | useTicketRealtime.ts | .ts | Support Hook | Hook realtime tiket (6.2 KB) |
| 141 | resources/js/Components/ui/ | accordion.tsx | .tsx | UI Primitive | Radix Accordion wrapper |
| 142 | resources/js/Components/ui/ | button.tsx | .tsx | UI Primitive | Button dengan variants |
| 143 | resources/js/Components/ui/ | card.tsx | .tsx | UI Primitive | Card component |
| 144 | resources/js/Components/ui/ | CenteredCardCarousel.tsx | .tsx | UI Component | Carousel card centered (28.7 KB) |
| 145 | resources/js/Components/ui/ | ContentSlider.tsx | .tsx | UI Component | Content slider (4.2 KB) |
| 146 | resources/js/Components/ui/ | dialog.tsx | .tsx | UI Primitive | Radix Dialog wrapper |
| 147 | resources/js/Components/ui/ | dropdown-menu.tsx | .tsx | UI Primitive | Radix Dropdown wrapper |
| 148 | resources/js/Components/ui/ | input.tsx | .tsx | UI Primitive | Input component |
| 149 | resources/js/Components/ui/ | label.tsx | .tsx | UI Primitive | Label component |
| 150 | resources/js/Components/ui/ | select.tsx | .tsx | UI Primitive | Radix Select wrapper |
| 151 | resources/js/Components/ui/ | Spotlight.tsx | .tsx | UI Component | Spotlight effect (1.8 KB) |
| 152 | resources/js/Components/ui/ | tabs.tsx | .tsx | UI Primitive | Radix Tabs wrapper |
| 153 | resources/js/Components/ui/ | textarea.tsx | .tsx | UI Primitive | Textarea component |
| 154 | resources/js/Components/ui/ | tooltip.tsx | .tsx | UI Primitive | Radix Tooltip wrapper |
| 155 | resources/js/Layouts/ | AdminLayout.tsx | .tsx | Layout | Layout admin panel (20.5 KB) |
| 156 | resources/js/Layouts/ | CustomerLayout.tsx | .tsx | Layout | Layout customer portal (17.9 KB) |
| 157 | resources/js/Layouts/ | FrontendLayout.tsx | .tsx | Layout | Layout public website (1.9 KB) |
| 158 | resources/js/Pages/ | About.tsx | .tsx | Page | Halaman Tentang Kami (10 KB) |
| 159 | resources/js/Pages/ | Blog.tsx | .tsx | Page | Listing blog (20 KB) |
| 160 | resources/js/Pages/ | BlogDetail.tsx | .tsx | Page | Detail blog (9 KB) |
| 161 | resources/js/Pages/ | Contact.tsx | .tsx | Page | Form kontak (15 KB) |
| 162 | resources/js/Pages/ | Home.tsx | .tsx | Page | Homepage (14 KB) |
| 163 | resources/js/Pages/ | Login.tsx | .tsx | Page | Unified login (9.7 KB) |
| 164 | resources/js/Pages/ | NotFound.tsx | .tsx | Page | 404 page (2 KB) |
| 165 | resources/js/Pages/ | Privacy.tsx | .tsx | Page | Privacy policy (4.7 KB) |
| 166 | resources/js/Pages/ | Promo.tsx | .tsx | Page | Listing promo (21.7 KB) |
| 167 | resources/js/Pages/ | ServiceDetail.tsx | .tsx | Page | Detail layanan (14.9 KB) |
| 168 | resources/js/Pages/ | ServicesIndex.tsx | .tsx | Page | Listing layanan (7.9 KB) |
| 169 | resources/js/Pages/Admin/ | Dashboard.tsx | .tsx | Admin Page | Dashboard admin (14.8 KB) |
| 170 | resources/js/Pages/Admin/Articles/ | Form.tsx | .tsx | Admin Page | Form artikel (11 KB) |
| 171 | resources/js/Pages/Admin/Articles/ | Index.tsx | .tsx | Admin Page | Listing artikel (9 KB) |
| 172 | resources/js/Pages/Admin/ArticleCategories/ | Index.tsx | .tsx | Admin Page | Listing kategori artikel (9.8 KB) |
| 173 | resources/js/Pages/Admin/Coverages/ | Index.tsx | .tsx | Admin Page | Cakupan wilayah (21.6 KB) |
| 174 | resources/js/Pages/Admin/Customers/ | Create.tsx | .tsx | Admin Page | Tambah customer (16.6 KB) |
| 175 | resources/js/Pages/Admin/Customers/ | Index.tsx | .tsx | Admin Page | Listing customer (14.5 KB) |
| 176 | resources/js/Pages/Admin/Customers/ | Registrations.tsx | .tsx | Admin Page | Registrasi pending (14 KB) |
| 177 | resources/js/Pages/Admin/Customers/ | Show.tsx | .tsx | Admin Page | Detail customer (19.4 KB) |
| 178 | resources/js/Pages/Admin/CustomerServices/ | Create.tsx | .tsx | Admin Page | Tambah layanan customer (3 KB) |
| 179 | resources/js/Pages/Admin/CustomerServices/ | Edit.tsx | .tsx | Admin Page | Edit layanan customer (4.5 KB) |
| 180 | resources/js/Pages/Admin/CustomerServices/ | fields.tsx | .tsx | Admin Page | Field definitions (11.6 KB) |
| 181 | resources/js/Pages/Admin/CustomerServices/ | Index.tsx | .tsx | Admin Page | Listing layanan customer (12 KB) |
| 182 | resources/js/Pages/Admin/Messages/ | Index.tsx | .tsx | Admin Page | Listing pesan (10.9 KB) |
| 183 | resources/js/Pages/Admin/Messages/ | Show.tsx | .tsx | Admin Page | Detail pesan (9 KB) |
| 184 | resources/js/Pages/Admin/Profile/ | Edit.tsx | .tsx | Admin Page | Edit profil admin (6.4 KB) |
| 185 | resources/js/Pages/Admin/Projects/ | Form.tsx | .tsx | Admin Page | Form project (8 KB) |
| 186 | resources/js/Pages/Admin/Projects/ | Index.tsx | .tsx | Admin Page | Listing project (8.4 KB) |
| 187 | resources/js/Pages/Admin/Promos/ | Form.tsx | .tsx | Admin Page | Form promo (36.7 KB) |
| 188 | resources/js/Pages/Admin/Promos/ | Index.tsx | .tsx | Admin Page | Listing promo (40.9 KB) |
| 189 | resources/js/Pages/Admin/ServiceCategories/ | Index.tsx | .tsx | Admin Page | Listing kategori service (10.6 KB) |
| 190 | resources/js/Pages/Admin/Services/ | Form.tsx | .tsx | Admin Page | Form service (20.6 KB) |
| 191 | resources/js/Pages/Admin/Services/ | Index.tsx | .tsx | Admin Page | Listing service (12 KB) |
| 192 | resources/js/Pages/Admin/Settings/ | Edit.tsx | .tsx | Admin Page | Pengaturan website (35 KB) |
| 193 | resources/js/Pages/Admin/Support/ | Index.tsx | .tsx | Admin Page | Listing tiket support (14.4 KB) |
| 194 | resources/js/Pages/Admin/Support/ | Show.tsx | .tsx | Admin Page | Detail tiket + chat (17 KB) |
| 195 | resources/js/Pages/Auth/ | ForgotPassword.tsx | .tsx | Auth Page | Lupa password (4.7 KB) |
| 196 | resources/js/Pages/Auth/ | ResetPassword.tsx | .tsx | Auth Page | Reset password (8 KB) |
| 197 | resources/js/Pages/Customer/ | Dashboard.tsx | .tsx | Customer Page | Dashboard customer (17.6 KB) |
| 198 | resources/js/Pages/Customer/ | MyPromo.tsx | .tsx | Customer Page | Promo saya (7.2 KB) |
| 199 | resources/js/Pages/Customer/ | Notifications.tsx | .tsx | Customer Page | Notifikasi (10.5 KB) |
| 200 | resources/js/Pages/Customer/ | Profile.tsx | .tsx | Customer Page | Profil customer (16.4 KB) |
| 201 | resources/js/Pages/Customer/ | Register.tsx | .tsx | Customer Page | Registrasi (16.3 KB) |
| 202 | resources/js/Pages/Customer/ | RegisterSuccess.tsx | .tsx | Customer Page | Sukses registrasi (5.5 KB) |
| 203 | resources/js/Pages/Customer/Services/ | Index.tsx | .tsx | Customer Page | Layanan saya (11.7 KB) |
| 204 | resources/js/Pages/Customer/Services/ | Show.tsx | .tsx | Customer Page | Detail layanan saya (10.4 KB) |
| 205 | resources/js/Pages/Customer/Support/ | Create.tsx | .tsx | Customer Page | Buat tiket (1.7 KB) |
| 206 | resources/js/Pages/Customer/Support/ | Index.tsx | .tsx | Customer Page | Daftar tiket (12.8 KB) |
| 207 | resources/js/Pages/Customer/Support/ | Show.tsx | .tsx | Customer Page | Detail tiket + chat (5.8 KB) |
| 208 | resources/js/hooks/ | useGsap.ts | .ts | Hook | GSAP animation hooks |
| 209 | resources/js/hooks/ | useLenis.ts | .ts | Hook | Lenis smooth scroll |
| 210 | resources/js/hooks/ | useSettingsListener.ts | .ts | Hook | Listen settings update |
| 211 | resources/js/hooks/ | useTawkMessagesListener.ts | .ts | Hook | Listen Tawk messages |
| 212 | resources/js/lib/ | utils.ts | .ts | Utility | Classnames helper (clsx + tailwind-merge) |
| 213 | resources/js/types/ | index.ts | .ts | Types | TypeScript interfaces (4.5 KB) |
| 214 | resources/js/types/ | ziggy.d.ts | .ts | Types | Ziggy route helper types |
| 215 | resources/js/utils/ | layout.tsx | .tsx | Utility | Layout wrapper HOC |
| 216 | resources/js/ | app.tsx | .tsx | Entry Point | Inertia app bootstrap |
| 217 | resources/js/ | echo.ts | .ts | Entry Point | Laravel Echo / Reverb setup |
| 218 | resources/css/ | app.css | .css | Styles | Global styles + Tailwind (25 KB) |
| 219 | resources/views/ | app.blade.php | .php | Blade | Root template |
| 220 | resources/views/ | welcome.blade.php | .php | Blade | Default welcome (82 KB - large) |
| 221 | routes/ | web.php | .php | Routes | Main web routes (180 lines) |
| 222 | routes/ | channels.php | .php | Routes | Broadcasting channels |
| 223 | routes/ | console.php | .php | Routes | Console commands |
| 224 | lang/id/ | auth.php | .php | Translation | Auth messages Indonesian |
| 225 | lang/id/ | passwords.php | .php | Translation | Password reset messages |
| 226 | lang/id/ | validation.php | .php | Translation | Validation messages Indonesian |

---

## 5. PENJELASAN FUNGSI FILE SOURCE CODE UTAMA

### Backend Controllers

| File | Fungsi Utama |
|------|--------------|
| **AuthController.php** | Unified login untuk admin & customer. Redirect ke dashboard masing-masing berdasarkan role. Logout terpusat. |
| **HomeController.php** | Homepage data: services (published), projects, promos (active, featured, show_on_home), articles (latest 3). Menggunakan cache 5 menit. |
| **ServiceController.php** | Public: index (semua published), show (by slug dengan content lengkap). |
| **PromoController.php** | Public: index promo aktif. |
| **BlogController.php** | Public: index artikel published, show by slug. |
| **ContactController.php** | Create form + store dengan throttle 5/menit. |
| **CoverageController.php** | POST `/coverage/check` - cari ServiceCoverage by lokasi (area/city/district/province). |
| **TawkWebhookController.php** | Receive webhook Tawk.to, verifikasi HMAC-SHA1, simpan ke ContactMessage, broadcast event. |
| **PasswordResetController.php** | Laravel password broker: request form, send link, reset form, reset password. |
| **Admin/*AdminController.php** | 14 controller untuk CRUD penuh: Services, Categories, Coverages, Promos, Promo Categories, Articles, Article Categories, Projects, Messages, Settings, Profile, Customers, Customer Services, Support Tickets. |
| **Customer/*Controller.php** | 7 controller untuk portal customer: Dashboard, Profile, Promo, Services, Support (realtime chat), Notifications. |

### Middleware

| File | Fungsi |
|------|--------|
| **Authenticate.php** | Extend Laravel default, redirect ke `/login` untuk web. |
| **EnsureUserIsAdmin.php** | Guard route admin: cek `user->isAdmin()` (role === 'admin'). |
| **EnsureCustomerIsActive.php** | Guard route customer: cek role customer + status active. Auto logout jika tidak aktif. |
| **HandleInertiaRequests.php** | Share global ke frontend: `auth.user`, `flash`, `settings` (semua CompanySetting), `unreadMessages` (admin only). |
| **SecurityHeaders.php** | Set security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. |

### Models & Relasi

| Model | Tabel | Relasi Utama |
|-------|-------|--------------|
| **User** | users | `hasOne(CustomerProfile)`, `hasMany(CustomerService)`, `hasMany(PromoPurchase)`, `hasMany(SupportTicket)`, `hasMany(TicketMessage)`, `hasMany(Notification)`, `hasMany(ActivityLog)`, `isAdmin()`, `isCustomer()`, `isActive()` |
| **Service** | services | `belongsTo(ServiceCategory)`, `hasMany(CustomerService)`, `hasMany(CustomerRegistration)`, `hasMany(ServiceCoverage)`, scopes: `published()`, `featured()` |
| **ServiceCategory** | service_categories | `hasMany(Service)` |
| **ServiceCoverage** | service_coverages | `belongsTo(Service)`, scope: `active()`, `searchLocation()` |
| **Promo** | promos | `belongsTo(PromoCategory)`, scopes: `active()`, `showOnHome()`, `featured()`, accessor `computed_status` |
| **PromoCategory** | promo_categories | `hasMany(Promo)` |
| **PromoPurchase** | promo_purchases | `belongsTo(User)`, `belongsTo(Promo)` - promo yang ditetapkan admin ke customer |
| **Article** | articles | `belongsTo(ArticleCategory)`, scope: `published()` |
| **ArticleCategory** | article_categories | `hasMany(Article)` |
| **Project** | projects | `belongsTo` (category string), scope: `published()` |
| **ContactMessage** | contact_messages | `belongsTo(User)` nullable, fields tawk_* untuk integrasi |
| **CustomerProfile** | customer_profiles | `belongsTo(User)`, `customer_code` unique |
| **CustomerRegistration** | customer_registrations | `belongsTo(Service)`, `status` (pending/approved/rejected) |
| **CustomerService** | customer_services | `belongsTo(User)`, `belongsTo(Service)`, `status` (active/inactive/pending) |
| **SupportTicket** | support_tickets | `belongsTo(User)`, `belongsTo(CustomerService)`, `belongsTo(User assigned_to)`, `hasMany(TicketMessage)`, `hasOne(TicketMessage latestMessage)`, methods: `unreadMessagesCount()`, status/priority labels |
| **TicketMessage** | ticket_messages | `belongsTo(SupportTicket)`, `belongsTo(User)`, `is_internal`, `is_read` |
| **TicketAttachment** | ticket_attachments | `belongsTo(TicketMessage)` |
| **Notification** | notifications | `belongsTo(User)`, `type`, `data` JSON, `is_read` |
| **ActivityLog** | activity_logs | `belongsTo(User)`, `action`, `description`, `properties` JSON |
| **CompanySetting** | company_settings | Key-value store (30+ keys), static `get()`, `set()`, `allSettings()` |
| **Settings** | settings | Legacy? (hanya key, value, group) |

### Events (Broadcasting)

| Event | Channel | Payload |
|-------|---------|---------|
| **SettingsUpdated** | `admin.support` | Settings data |
| **TawkChatReceived** | `admin.support` | Chat data |
| **TicketConversationUpdated** | `admin.support`, `support.{ticket}` | Ticket data |
| **TicketMessageSent** | `support.{ticket}`, `presence-support.{ticket}` | Message data |
| **TicketMessagesRead** | `support.{ticket}` | Read info |
| **TicketTyping** | `presence-support.{ticket}` | Typing user |

### Broadcasting Channels (routes/channels.php)

| Channel | Authorization |
|---------|---------------|
| `App.Models.User.{id}` | User ID match |
| `admin.support` | `user->isAdmin()` |
| `support.{ticket}` | Admin OR ticket owner (customer) |
| `presence-support.{ticket}` | Presence channel untuk typing indicator |

### Frontend Layouts

| Layout | Fungsi |
|--------|--------|
| **FrontendLayout.tsx** | Public website: Navbar + children + Footer |
| **AdminLayout.tsx** | Admin panel: Sidebar collapsible, nav groups (Services, Promos, Articles, Projects, Messages, Settings, Profile, Customers, Customer Services, Support), user menu, flash messages, unread messages badge |
| **CustomerLayout.tsx** | Customer portal: Sidebar nav (Dashboard, Layanan Saya, Promo Saya, Support, Notifikasi, Profil), user avatar, logout |

### Frontend Pages (Utama)

| Page | Fungsi |
|------|--------|
| **Home.tsx** | Hero (GSAP animated), CoverageCheck, ServicesSection, ServiceTargetsSection, Promo carousel, Articles, CTA. Visibility controlled by admin settings. |
| **ServicesIndex.tsx** | Grid layanan dengan filter kategori |
| **ServiceDetail.tsx** | Detail layanan: content, benefits, scope, workflow, FAQ, CTA |
| **Promo.tsx** | Listing promo dengan filter kategori, modal detail |
| **Blog.tsx** | Listing artikel dengan pagination |
| **BlogDetail.tsx** | Detail artikel dengan SEO |
| **Contact.tsx** | Form kontak dengan validasi client-side |
| **About.tsx** | Tentang kami dengan settings dynamic |
| **Login.tsx** | Unified login form (email + password) |
| **ForgotPassword/ResetPassword.tsx** | Password reset flow |

### Admin Pages (Per Modul)

| Modul | Pages |
|-------|-------|
| **Dashboard** | Dashboard.tsx - statistik ringkasan |
| **Services** | Index.tsx (list + filter), Form.tsx (create/edit + image upload) |
| **Service Categories** | Index.tsx (CRUD inline) |
| **Coverages** | Index.tsx (CRUD + search location) |
| **Promos** | Index.tsx (list + filter), Form.tsx (kompleks: discount types, dates, CTA, image) |
| **Promo Categories** | Index.tsx (CRUD inline) |
| **Articles** | Index.tsx, Form.tsx (rich content) |
| **Article Categories** | Index.tsx |
| **Projects** | Index.tsx, Form.tsx (thumbnail, category) |
| **Messages** | Index.tsx, Show.tsx |
| **Settings** | Edit.tsx (35 KB - comprehensive: company info, SEO, hero, social, section visibility, service backgrounds) |
| **Profile** | Edit.tsx |
| **Customers** | Index.tsx, Create.tsx, Show.tsx, Registrations.tsx |
| **Customer Services** | Index.tsx, Create.tsx, Edit.tsx, fields.tsx |
| **Support** | Index.tsx (list + stats), Show.tsx (realtime chat interface) |

### Customer Pages

| Page | Fungsi |
|------|--------|
| **Dashboard.tsx** | Ringkasan: layanan aktif, promo, tiket support, notifikasi |
| **MyPromo.tsx** | Promo yang ditetapkan admin ke customer ini |
| **Profile.tsx** | Profil, avatar upload, ganti password |
| **Notifications.tsx** | Daftar notifikasi, mark read, mark all read |
| **Services/Index.tsx** | Layanan yang dimiliki customer |
| **Services/Show.tsx** | Detail layanan customer |
| **Support/Index.tsx** | Daftar tiket, buat baru |
| **Support/Show.tsx** | Chat realtime dengan admin |
| **Support/Create.tsx** | Form buat tiket baru |

### Components Kunci

| Component | Fungsi |
|-----------|--------|
| **Navbar.tsx** | Responsive nav, mobile drawer, logo scrolled effect, auth links |
| **Footer.tsx** | Footer lengkap: company info, links, social, newsletter, copyright |
| **CoverageCheckSection.tsx** | Form cek cakupan: input lokasi → cari ServiceCoverage → tampilkan hasil |
| **ServicesSection.tsx** | Grid layanan dari props, panggil ServiceCard |
| **ServiceCard.tsx** | Card layanan dengan layout_size (large/tall/small/wide), icon Lucide |
| **ServiceTargetsSection.tsx** | Target audiens layanan (accordion per kategori) |
| **PromoCard.tsx** | Card promo dengan badge status, discount display, CTA |
| **PromoDetailModal.tsx** | Modal detail promo (trigger dari card gambar di Home) |
| **CenteredCardCarousel.tsx** | Carousel hero/featured dengan snap center (Swiper) |
| **SupportChat.tsx** | UI chat realtime: message list, composer, typing indicator, presence |
| **useTicketRealtime.ts** | Hook: subscribe channels, handle events (message, typing, read, presence) |
| **Seo.tsx** | Meta tags dynamic dari props + settings |

### Hooks

| Hook | Fungsi |
|------|--------|
| **useGsap.ts** | `useHeroAnimation()`, `useGsapReveal()` - animasi scroll/entrance |
| **useLenis.ts** | Inisialisasi Lenis smooth scroll |
| **useSettingsListener.ts** | Listen `SettingsUpdated` event via Echo, update props Inertia |
| **useTawkMessagesListener.ts** | Listen Tawk chat events |

---

## 6. PEMETAAN MODUL DAN FITUR WEBSITE

### Modul Public (Frontend)

| Modul | Fitur | Route | Controller |
|-------|-------|-------|------------|
| **Homepage** | Hero animated, coverage check, services grid, targets, promo carousel, latest articles, CTA | `/` | HomeController@index |
| **Tentang Kami** | Company info dynamic dari settings | `/about` | HomeController@about |
| **Layanan** | Listing semua layanan published, filter kategori | `/services` | ServiceController@index |
| **Detail Layanan** | Full content: benefits, scope, workflow, FAQ, CTA | `/services/{slug}` | ServiceController@show |
| **Cek Cakupan** | Form input lokasi → cari ServiceCoverage | POST `/coverage/check` | CoverageController@check |
| **Promo** | Listing promo aktif, filter kategori, modal detail | `/promo` | PromoController@index |
| **Blog** | Listing artikel published, pagination | `/blog` | BlogController@index |
| **Detail Blog** | Full artikel dengan SEO | `/blog/{slug}` | BlogController@show |
| **Kontak** | Form kontak + validasi, throttle | `/contact` | ContactController@create/store |
| **Privacy Policy** | Static page | `/privacy` | HomeController@privacy |
| **Login Unified** | Email/password → redirect by role | `/login` | AuthController |
| **Password Reset** | Laravel broker flow | `/forgot-password`, `/reset-password/{token}` | PasswordResetController |

### Modul Admin Panel

| Modul | Fitur | Route Prefix | Controller |
|-------|-------|--------------|------------|
| **Dashboard** | Statistik: users, services, promos, articles, tickets, messages | `/admin` | DashboardController |
| **Layanan (Services)** | CRUD + image upload, layout_size, featured, published, sort_order | `/admin/services` | ServiceAdminController |
| **Kategori Layanan** | CRUD inline | `/admin/service-categories` | ServiceCategoryAdminController |
| **Cakupan Wilayah** | CRUD + search location per service | `/admin/coverages` | CoverageAdminController |
| **Promo** | CRUD kompleks: discount type (%, amount), dates, CTA, category, featured, home, duplicate | `/admin/promos` | PromoAdminController |
| **Kategori Promo** | CRUD inline | `/admin/promo-categories` | PromoCategoryAdminController |
| **Artikel** | CRUD + category, published_at, featured | `/admin/articles` | ArticleAdminController |
| **Kategori Artikel** | CRUD inline | `/admin/article-categories` | ArticleCategoryAdminController |
| **Project/Portofolio** | CRUD + thumbnail, category, published | `/admin/projects` | ProjectAdminController |
| **Pesan Masuk** | List, show, update status, delete | `/admin/messages` | MessageAdminController |
| **Pengaturan Website** | 30+ settings: company, SEO, hero, social, section visibility, service backgrounds | `/admin/settings` | SettingAdminController |
| **Profil Admin** | Edit nama, email, password, avatar | `/admin/profile` | ProfileAdminController |
| **Manajemen Customer** | List, create, show, update, delete, registrations (approve/reject) | `/admin/customers` | CustomerManagementController |
| **Layanan Customer** | CRUD + bulk update status, field definitions per service | `/admin/customer-services` | CustomerServiceManagementController |
| **Support Ticket** | List + statistics, show (chat realtime), reply, typing, status, priority, assign | `/admin/support` | SupportTicketManagementController |

### Modul Customer Portal

| Modul | Fitur | Route | Controller |
|-------|-------|-------|------------|
| **Dashboard** | Ringkasan layanan, promo, tiket, notifikasi | `/customer/dashboard` | CustomerDashboardController |
| **Promo Saya** | Promo yang ditetapkan admin (PromoPurchase) | `/customer/promos` | CustomerPromoController |
| **Profil** | Info, avatar upload, ganti password | `/customer/profile` | CustomerProfileController |
| **Notifikasi** | List, mark read, mark all read, unread count | `/customer/notifications` | CustomerNotificationController |
| **Layanan Saya** | List layanan customer (CustomerService) | `/customer/services` | CustomerServiceController |
| **Detail Layanan** | Detail layanan yang dimiliki | `/customer/services/{id}` | CustomerServiceController |
| **Support Chat** | List tiket, buat baru, chat realtime, typing, close | `/customer/support` | SupportTicketController |

### Integrasi Eksternal

| Integrasi | Konfigurasi | Fungsi |
|-----------|-------------|--------|
| **Tawk.to** | `TAWK_PROPERTY_ID`, `TAWK_SECRET_KEY`, `TAWK_WEBHOOK_SECRET` | Chat widget di website, webhook ke ContactMessage, sync command |
| **Email (SMTP)** | `MAIL_MAILER=smtp`, Gmail App Password | Password reset, notifikasi (configured di .env.example) |
| **Laravel Reverb** | `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET` | WebSocket server untuk real-time (support chat, notifications) |
| **Pusher JS** | Client-side WebSocket client | Fallback/alternative ke Reverb |

### Scheduled Commands

| Command | Schedule | Fungsi |
|---------|----------|--------|
| **tawk:sync** | Manual / Scheduler | Sync percakapan Tawk.to ke database |

---

## 7. STRUKTUR DATABASE

### Tabel Utama (30 Migrations)

| No | Tabel | Migration | Deskripsi |
|----|-------|-----------|-----------|
| 1 | users | 0001_01_01_000000 | User admin & customer (name, email, password, role, phone, avatar, status) |
| 2 | cache | 0001_01_01_000001 | Cache database store |
| 3 | jobs | 0001_01_01_000002 | Queue jobs |
| 4 | service_categories | 2026_10_21_000001 | Kategori layanan (Application, Solution) |
| 5 | services | 2026_10_21_000002 | Layanan (category_id, name, slug, icon, image, content, benefits, scope, workflow, faq, layout_size) |
| 6 | promos | 2026_10_21_000003 | Promo (title, slug, description, image, category_id, discount_type, prices, dates, cta, flags) |
| 7 | article_categories | 2026_10_21_000004 | Kategori artikel (Teknologi, Tips, Berita) |
| 8 | articles | 2026_10_21_000005 | Artikel (category_id, title, slug, excerpt, content, author, published_at) |
| 9 | projects | 2026_10_21_000006 | Project/portofolio (title, slug, category, description, client, thumbnail) |
| 10 | contact_messages | 2026_10_21_000007 | Pesan kontak (name, email, phone, subject, message, status, tawk_* fields) |
| 11 | company_settings | 2026_10_21_000008 | Key-value settings (30+ keys) |
| 12 | settings | 2026_10_21_095323 | Legacy settings (key, value, group) |
| 13 | promo_categories | 2026_10_24_100000 | Kategori promo (Internet Rumah, Bisnis, Instalasi, Solusi TI, Musiman) |
| 14 | promos (alter) | 2026_10_24_100001 | Add category_id, discount fields |
| 15 | service_coverages | 2026_10_30_100000 | Cakupan wilayah per service (area, city, district, province, status) |
| 16 | services (alter) | 2026_11_02_000000 | Add layout_size column |
| 17 | users (alter) | 2026_11_02_070000 | Add role column (admin/customer) |
| 18 | customer_profiles | 2026_11_02_070001 | Profil customer (user_id, company, address, phone, customer_code) |
| 19 | customer_registrations | 2026_11_02_070002 | Registrasi pending (user_id, service_id, status, notes) |
| 20 | customer_services | 2026_11_02_070003 | Layanan customer (user_id, service_id, status, start_date, end_date, config JSON) |
| 21 | support_tickets | 2026_11_02_070004 | Tiket support (ticket_number, user_id, customer_service_id, title, category, status, priority, assigned_to) |
| 22 | ticket_messages | 2026_11_02_070005 | Pesan tiket (ticket_id, user_id, message, is_internal, is_read) |
| 23 | ticket_attachments | 2026_11_02_070006 | Lampiran (ticket_message_id, path, name, size, mime) |
| 24 | notifications | 2026_11_02_070007 | Notifikasi in-app (user_id, type, data JSON, is_read) |
| 25 | activity_logs | 2026_11_02_070008 | Log aktivitas (user_id, action, description, properties JSON) |
| 26 | promo_purchases | 2026_11_03_000001 | Promo customer (user_id, promo_id, status, valid_until) |
| 27 | customer_profiles (alter) | 2026_11_03_000002 | Add customer_code |

### Relasi Antar Entitas (Ringkas)

```
User (1) ─────< (1) CustomerProfile
User (1) ─────< (N) CustomerService >──── (1) Service
User (1) ─────< (N) CustomerRegistration >──── (1) Service
User (1) ─────< (N) PromoPurchase >──── (1) Promo
User (1) ─────< (N) SupportTicket
User (1) ─────< (N) TicketMessage
User (1) ─────< (N) Notification
User (1) ─────< (N) ActivityLog

ServiceCategory (1) ─────< (N) Service
Service (1) ─────< (N) ServiceCoverage

PromoCategory (1) ─────< (N) Promo

ArticleCategory (1) ─────< (N) Article

SupportTicket (1) ─────< (N) TicketMessage
SupportTicket (1) ─────< (1) CustomerService (nullable)
SupportTicket (N) ─────> (1) User (customer)
SupportTicket (N) ─────> (1) User (assigned_to admin)
TicketMessage (1) ─────< (N) TicketAttachment
```

### Database Files
- **database.sqlite** (86 MB) — SQLite development database
- **nds_website.sql** (78 MB) — SQL dump untuk migrasi ke MySQL/PostgreSQL

---

## 8. DAFTAR DEPENDENCY

### Production Dependencies (composer.json - require)
```
php ^8.2
inertiajs/inertia-laravel ^3.5
laravel/framework ^12.0
laravel/reverb ^1.12
laravel/tinker ^2.10.1
tightenco/ziggy ^2.6
```

### Development Dependencies (composer.json - require-dev)
```
fakerphp/faker ^1.23
laravel/pail ^1.2.2
laravel/pint ^1.13
laravel/sail ^1.41
mockery/mockery ^1.6
nunomaduro/collision ^8.6
phpunit/phpunit ^11.5.3
```

### Frontend Dependencies (package.json - dependencies)
```
@icons-pack/react-simple-icons ^13.15.1
@inertiajs/react ^3.9.1
@radix-ui/react-accordion ^1.3.1
@radix-ui/react-dialog ^1.3.1
@radix-ui/react-dropdown-menu ^2.2.1
@radix-ui/react-popover ^1.3.1
@radix-ui/react-select ^2.4.1
@radix-ui/react-slot ^1.5.0
@radix-ui/react-tabs ^1.2.1
@radix-ui/react-tooltip ^1.4.1
class-variance-authority ^0.7.1
clsx ^2.1.1
gsap ^3.15.0
laravel-echo ^2.6.1
lenis ^1.3.27
lucide-react ^1.60.0
motion ^14.8.0
pusher-js ^8.6.0
react ^19.3.1
react-dom ^19.3.1
swiper ^14.3.0
tailwind-merge ^3.7.0
ziggy-js ^2.6.5
```

### Frontend Dev Dependencies (package.json - devDependencies)
```
@tailwindcss/vite ^4.0.0
@types/node ^26.6.5
@types/react ^18.3.31
@types/react-dom ^18.3.7
@vitejs/plugin-react ^4.3.4
axios ^1.7.4
concurrently ^9.0.1
laravel-vite-plugin ^1.2.0
tailwindcss ^4.0.0
typescript ^7.0.2
vite ^6.0.11
```

---

## 9. DAFTAR ASET

### Images (public/images/)

| File | Ukuran | Kegunaan |
|------|--------|----------|
| hero-bg.jpg | 217 KB | Hero background homepage |
| logo.png | 112 KB | Logo utama (light) |
| logo-scrolled.png | 81 KB | Logo saat scroll (dark/alternate) |

### Service Images (public/images/services/)

| File | Ukuran | Layanan |
|------|--------|---------|
| cctv.jpg | 12.8 KB | CCTV |
| default.jpg | 13.4 KB | Fallback/default |
| it-consultant.jpg | 12.9 KB | IT Consultant |
| management-network.jpg | 12.9 KB | Management Network |
| server-management.jpg | 13.2 KB | Server Management |
| service-landscape.jpg | 6.5 KB | Landscape/placeholder |
| software-application.jpg | 13.1 KB | Software Application |
| web-development.jpg | 12.9 KB | Web Development |

### Build Assets (public/build/assets/)
- **100+ file chunks** (JS/CSS) dari Vite build
- **manifest.json** (55 KB) — mapping entry points ke file hash
- Main bundles: `app-D3sHYTpc.js` (463 KB), `app-DCo6PFvJ.css` (128 KB)
- Layout chunk: `layout-BPd7peg-.js` (168 KB)
- React vendor: `react-RnK1tuUe.js` (143 KB)

### Fonts & Icons
- **Lucide React** — 100+ SVG icons sebagai React components
- **@icons-pack/react-simple-icons** — Brand icons (GitHub, Twitter, etc)
- **Tailwind CSS** — Utility-first, no external font files (system fonts)

---

## 10. KONFIGURASI DAN INTEGRASI

### Environment Variables (.env.example)

| Kategori | Variables |
|----------|-----------|
| **App** | APP_NAME, APP_ENV, APP_KEY, APP_DEBUG, APP_URL, APP_LOCALE, APP_MAINTENANCE_DRIVER |
| **Database** | DB_CONNECTION=sqlite (default), DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD |
| **Session** | SESSION_DRIVER=database, SESSION_LIFETIME=120, SESSION_SECURE_COOKIE, SESSION_SAME_SITE=lax |
| **Broadcasting** | BROADCAST_CONNECTION=log (default), REVERB_* config |
| **Cache** | CACHE_STORE=database |
| **Queue** | QUEUE_CONNECTION=database |
| **Mail** | MAIL_MAILER=log (default), SMTP Gmail config commented dengan petunjuk App Password |
| **AWS** | AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION, AWS_BUCKET |
| **Reverb (WebSocket)** | REVERB_APP_ID, REVERB_APP_KEY, REVERB_APP_SECRET, REVERB_HOST, REVERB_PORT, REVERB_SCHEME |
| **Frontend Reverb** | VITE_REVERB_APP_KEY, VITE_REVERB_HOST, VITE_REVERB_PORT, VITE_REVERB_SCHEME |
| **Tawk.to** | TAWK_PROPERTY_ID, TAWK_SECRET_KEY, TAWK_WEBHOOK_SECRET |
| **Admin Seeder** | ADMIN_PASSWORD (required for db:seed) |

### Config Files Penting

| File | Fungsi |
|------|--------|
| **config/app.php** | App settings, timezone, locale, providers, aliases |
| **config/auth.php** | Guards: web (session), provider: users table |
| **config/broadcasting.php** | Connections: pusher (Reverb), log, null |
| **config/database.php** | Connections: sqlite (default), mysql, pgsql, sqlsrv |
| **config/filesystems.php** | Disks: local, public, s3 |
| **config/mail.php** | Mailers: smtp, ses, mailgun, postmark, log, array |
| **config/queue.php** | Connections: sync, database, beanstalkd, sqs, redis |
| **config/reverb.php** | Reverb server config: host, port, scheme, app credentials |
| **config/services.php** | Third-party: tawk, github, google, etc |
| **config/session.php** | Session config: driver, lifetime, encryption, cookie settings |
| **config/tawk.php** | Tawk.to integration settings |

### Vite & TypeScript
- **vite.config.ts**: Laravel plugin + Tailwind, alias `@` → `resources/js`, suppress "use client" warning
- **tsconfig.json**: Strict, bundler resolution, JSX react-jsx, path alias, include resources/js

---

## 11. TEMUAN FILE DUPLIKAT / TIDAK TERPAKAI / PERLU PERHATIAN

### File Duplikat / Potensial Duplikat

| File | Masalah |
|------|---------|
| **app/Models/Settings.php** vs **app/Models/CompanySetting.php** | Keduanya key-value settings. `Settings` hanya punya `key, value, group` (legacy?), `CompanySetting` lebih lengkap dengan static methods `KEYS` array. Perlu audit mana yang dipakai. |
| **database/migrations/2026_10_21_095323_create_settings_table.php** | Membuat tabel `settings` (legacy) - mungkin tidak dipakai jika sudah pakai `company_settings`. |
| **resources/views/welcome.blade.php** (82 KB) | Default Laravel welcome page, sangat besar (82 KB). Tidak dipakai (root route pakai Inertia Home.tsx). Bisa dihapus. |

### File Tidak Terpakai / Legacy

| File | Alasan |
|------|--------|
| **resources/views/welcome.blade.php** | Default Laravel, tidak dirujuk route mana pun |
| **app/Models/Settings.php** | Kemungkinan legacy, digantikan CompanySetting |
| **database/migrations/2026_10_21_095323_create_settings_table.php** | Tabel `settings` legacy |
| **database/setup_layout_size_column.php** | Script manual, seharusnya migration |
| **public images/** | Folder duplikat dari `public/images/`? Perlu cek isi. |

### File Sementara / Hasil Build / Test

| File | Kategori |
|------|----------|
| **public/build/** | Build output (bisa di-generate ulang) |
| **node_modules/** | Dependency (exclude dari repo) |
| **vendor/** | Composer dependency (exclude dari repo) |
| **storage/framework/** | Cache, sessions, views (exclude) |
| **storage/logs/** | Log files |
| **bootstrap/cache/** | Framework cache |
| **.phpunit.result.cache** | Test cache |
| **all_responsiveness_report.json** | Test artifact |
| **audit_results.json** | Audit artifact |
| **audit_routes.php** | Audit script |
| **check_data.php** | Check script |
| **login-debug.html** | Debug artifact |
| **responsiveness_results.json** | Test artifact |
| **test_*.cjs** | Test scripts (4 files) |
| **fix-mail-password.php** | Fix script |
| **test-mail.php** | Test script |
| **cookies.txt** | Cookie jar |
| **findstr**, **npm** | Empty files (0 bytes) |
| **skills-lock.json** | Skill lock file |

### File Berukuran Besar (>100 KB)

| File | Ukuran | Kategori |
|------|--------|----------|
| **database/database.sqlite** | 86 MB | Database |
| **database/nds_website.sql** | 78 MB | SQL Dump |
| **composer.lock** | 351 KB | Lock file |
| **package-lock.json** | 195 KB | Lock file |
| **resources/views/welcome.blade.php** | 82 KB | Blade (unused) |
| **public/build/assets/app-D3sHYTpc.js** | 463 KB | JS Bundle |
| **public/build/assets/app-DCo6PFvJ.css** | 128 KB | CSS Bundle |
| **public/build/assets/layout-BPd7peg-.js** | 168 KB | JS Layout |
| **public/build/assets/react-RnK1tuUe.js** | 143 KB | React Vendor |

### Dependency Potensial Tidak Terpakai

| Package | Alasan Curiga |
|---------|---------------|
| **motion (framer-motion)** | Dipakai? Cek import di components. Jika hanya GSAP + Lenis, bisa dihapus. |
| **@icons-pack/react-simple-icons** | Hanya untuk brand icons sedikit. Lucide sudah cukup untuk UI icons. |
| **axios** | Inertia sudah handle request. Dipakai manual di mana? |
| **concurrently** | Hanya untuk script `composer dev`. Bisa dipindah ke devDependencies only. |

---

## 12. TEMUAN KEAMANAN DASAR

### ✅ Sudah Baik
- **Middleware proteksi role**: `EnsureUserIsAdmin`, `EnsureCustomerIsActive` di route admin & customer
- **Throttle** pada route sensitif: login, contact, password reset, webhook
- **HMAC verification** pada Tawk.to webhook (`TawkWebhookController`)
- **SecurityHeaders middleware** mengatur CSP, HSTS, X-Frame-Options, dll
- **Password hashing** via Laravel casts (`password` => `hashed`)
- **Mass assignment protection** via `$fillable` di semua Model
- **CSRF protection** via Inertia (built-in)
- **SQL Injection protection** via Eloquent ORM
- **File upload validation** di Request classes

### ⚠️ Perlu Perhatian / Review

| Temuan | Lokasi | Risiko | Rekomendasi |
|--------|--------|--------|-------------|
| **APP_DEBUG=false di .env.example tapi .env mungkin true** | `.env` | Information disclosure di production | Pastikan `APP_DEBUG=false` di production |
| **APP_KEY kosong di .env.example** | `.env.example` | Harus di-generate via `php artisan key:generate` | Dokumentasikan |
| **SESSION_ENCRYPT=false** | `.env.example` | Session data tidak terenkripsi di database | Set `true` di production |
| **CSP di SecurityHeaders.php** | `app/Http/Middleware/SecurityHeaders.php` | Perlu audit policy untuk Inertia + Vite + Reverb | Test CSP di staging |
| **File upload (Service image, avatar, ticket attachment)** | `StorePromoRequest`, `CustomerProfileController`, `TicketMessage` | Validasi mime/size? Perlu cek Request rules | Pastikan `mimes`, `max` validation |
| **Tawk webhook secret di .env** | `.env` | Jika terekspos, bisa inject pesan palsu | Rotasi berkala, simpan di vault |
| **Reverb credentials di .env** | `.env` | WebSocket hijacking | Rotasi, batasi host |
| **Admin password di seeder dari config** | `DatabaseSeeder.php` | `config('app.admin_password')` dari env - OK | Pastikan `ADMIN_PASSWORD` strong |
| **SQLite di production?** | `.env.example` default `DB_CONNECTION=sqlite` | Tidak cocok production high traffic | Ubah ke MySQL/PostgreSQL |
| **welcome.blade.php accessible?** | `public/` via symlink? | Information disclosure | Pastikan route tidak expose |

### File Sensitif Yang Harus Dilindungi
- `.env` — **JANGAN commit ke repo** (sudah di .gitignore)
- `database/database.sqlite` — **JANGAN commit** (sudah di .gitignore)
- `storage/logs/*.log` — Bisa berisi data sensitif
- `config/tawk.php` — Referensi env, tidak hardcode secret

---

## 13. KESIMPULAN KONDISI PROJECT

### ✅ Kelebihan Project

1. **Arsitektur Modern & Terstruktur** — Laravel 12 + React 19 + Inertia.js, TypeScript strict, Tailwind 4
2. **Full-Featured** — Public website + Admin panel + Customer portal + Real-time support chat
3. **Code Quality** — Form Requests untuk validasi, Events untuk broadcasting, Policies/Scopes di Model, Middleware role-based
4. **Database Design** — Migration lengkap (30), relasi jelas, seeder komprehensif dengan data realistis
5. **UI/UX** — Animasi GSAP/Lenis, Radix UI accessible components, Responsive design, Dark mode ready
6. **Real-time** — Laravel Reverb + Pusher JS, Presence channel untuk typing indicator, Event-driven updates
7. **Integrasi** — Tawk.to webhook, Email (SMTP ready), File upload, SEO dynamic
8. **Admin Settings** — 30+ key-value settings untuk konten website tanpa code change
7. **Documentation** — Multiple .md files (DESIGN.md, CUSTOMER_PORTAL_GUIDE, NAVBAR-IMPLEMENTATION, etc)

### ⚠️ Area Perbaikan / Technical Debt

1. **Legacy Settings Model** — `Settings` model & `settings` table kemungkinan tidak dipakai, perlu cleanup
2. **welcome.blade.php** — 82 KB file unused, harus dihapus
3. **public images/** folder duplikat — Perlu konsolidasi ke `public/images/`
4. **Test files di root** — 4 file `test_*.cjs`, `audit_*.json`, `login-debug.html` dll pollute root directory
5. **Motion (Framer Motion)** — Import tapi mungkin tidak dipakai (GSAP + Lenis sudah ada)
6. **Axios** — Dependency tapi Inertia handle request, cek apakah benar-benar dipakai
7. **SQLite default** — Production harus ganti ke MySQL/PostgreSQL
8. **CSP Policy** — Perlu audit ketat untuk Inertia + Vite HMR + Reverb WebSocket
9. **File size** — Beberapa component >20 KB (PromoAdmin Form 36 KB, Settings Edit 35 KB), pertimbangkan split
10. **TypeScript types** — `ziggy.d.ts` manual, seharusnya auto-generated via `php artisan ziggy:generate`

### 📋 Checklist Production Readiness

| Item | Status | Catatan |
|------|--------|---------|
| APP_KEY generated | ❓ | Cek .env |
| APP_DEBUG=false | ❓ | Cek .env |
| DB MySQL/PostgreSQL | ❌ | Masih SQLite default |
| SESSION_ENCRYPT=true | ❌ | Default false |
| HTTPS enforced | ❓ | Perlu setup server |
| CSP tested | ❌ | Perlu audit |
| File upload validation | ⚠️ | Perlu review Request rules |
| Rate limiting sufficient | ✅ | Throttle di route sensitif |
| Reverb credentials rotated | ❓ | Perlu rotasi berkala |
| Tawk secret rotated | ❓ | Perlu rotasi berkala |
| Backup strategy | ❓ | Perlu setup |
| Monitoring/Logging | ⚠️ | Pail installed, perlu konfigurasi |

### 🎯 Rekomendasi Prioritas

1. **HIGH** — Ganti database ke MySQL/PostgreSQL, set `APP_DEBUG=false`, `SESSION_ENCRYPT=true`
2. **HIGH** — Hapus `welcome.blade.php`, konsolidasi `public images/`, bersihkan file test di root
3. **MEDIUM** — Audit CSP policy, validasi file upload di Request classes
4. **MEDIUM** — Review `Settings` vs `CompanySetting` legacy cleanup
5. **LOW** — Split large components, remove unused deps (motion, axios, simple-icons), auto-generate Ziggy types

---

## CATATAN TAMBAHAN

> **File laporan ini di-generate otomatis** berdasarkan pemeriksaan menyeluruh struktur project pada 2026-11-06. Semua path file, ukuran, dan analisis didasarkan pada kondisi filesystem saat pemeriksaan. Tidak ada file yang dimodifikasi selama proses inventarisasi ini.

> **File JSON terpisah** (`PROJECT_FILE_INVENTORY.json`) berisi inventaris file dalam format terstruktur untuk parsing programatik.