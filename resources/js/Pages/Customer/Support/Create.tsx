import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { SupportComposer, type ComposerService } from '@/Components/customer/SupportComposer';

interface Props {
    services: ComposerService[];
}

export default function SupportCreate({ services }: Props) {
    return (
        <CustomerLayout title="Pesan Baru">
            <Head title="Pesan Baru | NDS Customer Portal" />

            <div className="mb-6">
                <Link
                    href={route('customer.support.index')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-tech-blue hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Pesan
                </Link>
            </div>

            <section className="max-w-2xl rounded-2xl border border-border-soft bg-white p-5 shadow-subtle sm:p-6">
                <div className="mb-4 flex items-center gap-2.5 border-b border-border-soft pb-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-electric-light">
                        <MessageCircle className="h-4 w-4 text-tech-blue" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-navy">Hubungi Tim NDS</h2>
                        <p className="text-xs text-body-text">Subjek tiket otomatis dari kalimat pertama pesan Anda.</p>
                    </div>
                </div>
                <SupportComposer services={services} />
            </section>
        </CustomerLayout>
    );
}
