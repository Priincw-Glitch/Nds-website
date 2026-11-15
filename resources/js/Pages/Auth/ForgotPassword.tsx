import { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from 'lucide-react';

/**
 * Halaman Lupa Password: customer memasukkan email aktif dan sistem
 * mengirim tautan reset. Respons selalu netral — tidak membuka
 * email mana yang terdaftar.
 */
export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (processing) return;
        post(route('password.email'));
    };

    return (
        <>
            <Head title="Lupa Password | NDS Portal" />

            <main className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-navy px-4 py-8 sm:py-12">
                <div className="w-full max-w-[480px]">
                    <div className="rounded-2xl border border-white/15 bg-white p-6 shadow-subtle sm:p-8">
                        {status && !errors.email && (
                            <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                <span>{status}</span>
                            </div>
                        )}

                        <header className="mb-6">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-electric-light">
                                <KeyRound className="h-4 w-4 text-tech-blue" />
                            </div>
                            <h1 className="mt-3 text-xl font-bold text-navy sm:text-2xl">Lupa Password</h1>
                            <p className="mt-1.5 text-sm text-body-text">
                                Masukkan email aktif Anda. Jika email tersebut terdaftar, tautan reset password akan dikirim.
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
                                        placeholder="nama@email.com"
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                                {errors.email && <p className="form-error mt-1.5">{errors.email}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-lg bg-tech-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-tech-blue/90 focus:outline-none focus:ring-2 focus:ring-tech-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? 'Mengirim...' : 'Kirim Tautan Reset'}
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
