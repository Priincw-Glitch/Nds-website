import { FormEventHandler, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, AlertCircle, Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react';

/**
 * Halaman izin reset password: customer menetapkan password baru melalui
 * tautan aman dari email. Token sekali pakai dengan masa berlaku menurut
 * mekanisme password reset Laravel di backend.
 */
export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email?: string;
}) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        token,
        email: email ?? '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.update'));
    };

    return (
        <>
            <Head title="Reset Password | NDS Portal" />

            <main className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-navy px-4 py-8 sm:py-12">
                <div className="w-full max-w-[480px]">
                    <div className="rounded-2xl border border-white/15 bg-white p-6 shadow-subtle sm:p-8">
                        <header className="mb-6">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-electric-light">
                                <KeyRound className="h-4 w-4 text-tech-blue" />
                            </div>
                            <h1 className="mt-3 text-xl font-bold text-navy sm:text-2xl">Buat Password Baru</h1>
                            <p className="mt-1.5 text-sm text-body-text">
                                Password baru untuk email di bawah. Token reset hanya berlaku terbatas dan sekali pakai.
                            </p>
                        </header>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-navy">
                                    Email Aktif
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body-text" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full rounded-lg border border-border-soft bg-white px-4 py-2.5 pl-10 pr-4 text-sm text-navy placeholder:text-body-text/60 focus:border-tech-blue focus:outline-none focus:ring-1 focus:ring-tech-blue"
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                                {errors.email && <p className="form-error mt-1.5">{errors.email}</p>}
                            </div>

                            <div>
                                <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-navy">
                                    Password Baru
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body-text" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full rounded-lg border border-border-soft bg-white px-4 py-2.5 pl-10 pr-12 text-sm text-navy placeholder:text-body-text/60 focus:border-tech-blue focus:outline-none focus:ring-1 focus:ring-tech-blue"
                                        placeholder="Minimal 8 karakter"
                                        autoComplete="new-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-body-text hover:bg-navy/5 hover:text-navy"
                                        aria-label={showPassword ? 'Sembunyikan password baru' : 'Tampilkan password baru'}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-red-700">
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password_confirmation" className="mb-1.5 block text-xs font-semibold text-navy">
                                    Ulangi Password Baru
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body-text" />
                                    <input
                                        id="password_confirmation"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="w-full rounded-lg border border-border-soft bg-white px-4 py-2.5 pl-10 pr-4 text-sm text-navy placeholder:text-body-text/60 focus:border-tech-blue focus:outline-none focus:ring-1 focus:ring-tech-blue"
                                        autoComplete="new-password"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-lg bg-tech-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-tech-blue/90 focus:outline-none focus:ring-2 focus:ring-tech-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Password Baru'}
                            </button>
                        </form>

                        <div className="mt-6 border-t border-border-soft pt-4 text-center">
                            <Link
                                href={route('login')}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-tech-blue hover:underline"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Kembali ke Login
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
