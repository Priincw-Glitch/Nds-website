import { FormEventHandler, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { logoUrl, assetUrl } from '@/utils/assets';
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    User,
} from 'lucide-react';

interface CompanySettings {
    logo_path?: string | null;
    company_name?: string;
}

export default function Login({ status }: { status?: string }) {
    // Redirect pengguna yang sudah login ditangani middleware `guest` dan
    // AuthController di backend; tidak diduplikasi di React.
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const { settings, flash } = usePage().props as {
        settings?: CompanySettings;
        flash?: { success?: string | null; error?: string | null };
    };

    const companyName = settings?.company_name || 'Nusantara Digital Solution';
    const logoPath = logoUrl(settings?.logo_path);
    const errorList = Object.entries(errors);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <>
            <Head title="Login" />

            <div className="flex min-h-dvh w-full flex-col overflow-hidden bg-white lg:flex-row">
                {/* Panel kiri: branding */}
                <section className="relative flex w-full flex-col justify-between overflow-hidden border-b border-border-soft bg-white p-6 sm:p-10 lg:w-[48%] lg:border-b-0 lg:border-r lg:p-12 xl:w-[46%] xl:p-14">
                    <svg
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <pattern id="login-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.75" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#login-grid)" />
                    </svg>
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-electric-light blur-3xl"
                    />

                    <header className="relative z-10">
                        <Link
                            href={route('home')}
                            aria-label={`Kembali ke beranda ${companyName}`}
                            className="inline-flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue"
                        >
                            <img src={logoPath} alt={companyName} className="h-9 w-auto object-contain lg:h-10" />
                        </Link>
                    </header>

                    <div className="relative z-10 my-auto flex flex-col items-center py-10 text-center sm:py-12">
                        <img
                            src={assetUrl("images/login-visual.svg")}
                            alt="Ilustrasi inti jaringan berlapis"
                            className="mb-8 hidden h-44 w-44 select-none drop-shadow-xl transition-transform duration-700 hover:scale-105 sm:block sm:h-52 sm:w-52 lg:h-60 lg:w-60"
                        />
                        <h1 className="max-w-sm text-2xl font-bold tracking-tight text-navy sm:text-3xl">
                            Akses Sistem Terpusat
                        </h1>
                        <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-body-text">
                            Kelola layanan internet dan solusi digital bisnis Anda dari satu tempat.
                        </p>
                    </div>

                    <footer className="relative z-10 flex justify-center lg:justify-start">
                        <p className="text-[11px] text-body-text">
                            © {new Date().getFullYear()} {companyName}. Hak Cipta Dilindungi.
                        </p>
                    </footer>
                </section>

                {/* Panel kanan: form login */}
                <section className="relative flex w-full flex-col items-center justify-center bg-white p-6 sm:p-10 lg:w-[52%] lg:p-16 xl:w-[54%]">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-electric-light/70 blur-3xl"
                    />

                    <div className="relative z-10 w-full max-w-[430px]">
                        <div className="rounded-2xl border border-border-soft bg-white p-8 shadow-card sm:p-10">
                            <div className="mb-8 flex flex-col">
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-tech-blue/20 bg-electric-light text-tech-blue">
                                        <KeyRound className="h-[18px] w-[18px]" />
                                    </span>
                                    <span className="text-[11px] font-semibold uppercase tracking-widest text-body-text">
                                        Portal Login
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight text-navy">Login</h2>
                                <p className="mt-1 text-sm text-body-text">Masuk ke akun Anda</p>
                            </div>

                            {status && (
                                <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                    <span>{status}</span>
                                </div>
                            )}

                            {(flash?.error || errorList.length > 0) && (
                                <div
                                    role="alert"
                                    className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
                                >
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                                    <div className="space-y-1 text-sm text-red-700">
                                        {flash?.error && <p>{flash.error}</p>}
                                        {errorList.map(([key, message]) => (
                                            <p key={key}>{message}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="block text-xs font-semibold tracking-wide text-navy">
                                        Email
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="w-full rounded-lg border border-border-strong bg-white py-2.5 pl-3.5 pr-10 text-sm text-navy transition-colors placeholder:text-body-text/60 focus:border-tech-blue focus:outline-none focus:ring-2 focus:ring-tech-blue/20"
                                            placeholder="nama@email.com"
                                            autoComplete="username"
                                            required
                                        />
                                        <span className="pointer-events-none absolute right-3 flex items-center text-body-text/70">
                                            <User className="h-[18px] w-[18px]" />
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-1">
                                    <label htmlFor="password" className="block text-xs font-semibold tracking-wide text-navy">
                                        Password
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="w-full rounded-lg border border-border-strong bg-white py-2.5 pl-3.5 pr-12 text-sm text-navy transition-colors placeholder:text-body-text/60 focus:border-tech-blue focus:outline-none focus:ring-2 focus:ring-tech-blue/20"
                                            placeholder="Masukkan kata sandi"
                                            autoComplete="current-password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                            aria-pressed={showPassword}
                                            className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-body-text/70 transition-colors hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-[19px] w-[19px]" />
                                            ) : (
                                                <Eye className="h-[19px] w-[19px]" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <label
                                        htmlFor="remember"
                                        className="group flex cursor-pointer select-none items-center gap-2.5 py-1"
                                    >
                                        <input
                                            id="remember"
                                            type="checkbox"
                                            checked={data.remember}
                                            onChange={(e) => setData('remember', e.target.checked)}
                                            className="h-4 w-4 cursor-pointer rounded border-border-strong accent-tech-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:ring-offset-2"
                                        />
                                        <span className="text-xs font-medium text-body-text transition-colors group-hover:text-navy">
                                            Ingat Saya
                                        </span>
                                    </label>
                                    <Link
                                        href={route('password.request')}
                                        className="rounded py-1 text-xs font-medium text-tech-blue transition-colors hover:text-tech-blue-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue"
                                    >
                                        Lupa Password?
                                    </Link>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="group flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 text-sm font-semibold tracking-wide text-white shadow-sm transition-all duration-200 hover:bg-navy-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-80"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Memproses...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Masuk</span>
                                            <ArrowRight className="h-4 w-4 text-white/80 transition-transform group-hover:translate-x-0.5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
