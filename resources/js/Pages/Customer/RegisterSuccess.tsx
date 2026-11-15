import { Head, Link } from '@inertiajs/react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/Components/ui/button';

export default function RegisterSuccess() {
    return (
        <>
            <Head title="Registrasi Berhasil" />
            
            <div className="min-h-screen bg-gradient-to-br from-navy via-navy to-tech-blue flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-lg">
                    {/* Card */}
                    <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                        {/* Success Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl font-bold text-navy mb-4">
                            Registrasi Berhasil!
                        </h1>

                        {/* Message */}
                        <div className="space-y-4 text-body-text mb-8">
                            <p className="text-lg">
                                Terima kasih telah mendaftar di <strong className="text-navy">Nusantara Digital Solution</strong>.
                            </p>
                            <p>
                                Pendaftaran Anda telah kami terima dan sedang dalam proses peninjauan oleh tim kami.
                            </p>
                        </div>

                        {/* Info Box */}
                        <div className="bg-electric-light/40 border border-tech-blue/30 rounded-xl p-6 mb-8 text-left">
                            <h3 className="font-bold text-navy mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-tech-blue rounded-full"></span>
                                Langkah Selanjutnya:
                            </h3>
                            <ol className="space-y-3 text-sm text-body-text">
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-tech-blue text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        1
                                    </span>
                                    <span>
                                        Tim kami akan meninjau pendaftaran Anda dalam <strong>1-2 hari kerja</strong>
                                    </span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-tech-blue text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        2
                                    </span>
                                    <span>
                                        Anda akan menerima <strong>email konfirmasi</strong> setelah akun Anda disetujui
                                    </span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-tech-blue text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        3
                                    </span>
                                    <span>
                                        Setelah disetujui, Anda dapat <strong>login</strong> menggunakan email dan password yang dikirimkan
                                    </span>
                                </li>
                            </ol>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button asChild variant="secondary" size="lg" className="flex-1">
                                <Link href={route('home')}>
                                    Kembali ke Beranda
                                </Link>
                            </Button>
                            <Button asChild variant="primary" size="lg" className="flex-1 font-bold">
                                <Link href={route('login')}>
                                    Halaman Login
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </Button>
                        </div>

                        {/* Contact Info */}
                        <div className="mt-8 pt-6 border-t border-border-soft">
                            <p className="text-sm text-body-text">
                                Jika Anda memiliki pertanyaan, silakan hubungi kami di{' '}
                                <Link href={route('contact')} className="font-semibold text-tech-blue hover:text-tech-blue-hover">
                                    halaman kontak
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-white/60 mt-6">
                        © 2026 Nusantara Digital Solution. All rights reserved.
                    </p>
                </div>
            </div>
        </>
    );
}
