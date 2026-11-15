import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { ArrowLeft, Save } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { CustomerServiceFields, flattenTechnicalInfo, type CustomerServiceFormData } from './fields';

interface CustomerRow {
    id: number;
    name: string;
    email: string;
}

interface ServiceRow {
    id: number;
    name: string;
}

interface Props {
    customers: CustomerRow[];
    services: ServiceRow[];
}

export default function CustomerServicesCreate({ customers, services }: Props) {
    const { data, setData, post, transform, processing, errors } = useForm({
        user_id: '',
        service_id: '',
        package_type: '',
        status: 'waiting_activation',
        activated_at: '',
        expired_at: '',
        technical_info: [] as Array<{ key: string; value: string }>,
        notes: '',
    } satisfies CustomerServiceFormData);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((currentData) => ({
            ...currentData,
            technical_info: flattenTechnicalInfo(currentData.technical_info),
        }));
        post(route('admin.customer-services.store'));
    };

    return (
        <AdminLayout title="Tetapkan Layanan">
            <Head title="Tetapkan Layanan Pelanggan | NDS Admin" />

            <div className="mb-6">
                <Link
                    href={route('admin.customer-services.index')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-tech-blue hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Layanan Pelanggan
                </Link>
                <h1 className="mt-2 text-xl font-bold text-navy sm:text-2xl">Tetapkan Layanan ke Pelanggan</h1>
                <p className="mt-1 text-xs text-body-text">
                    Layanan yang ditetapkan langsung terlihat pada panel pelanggan setelah statusnya aktif.
                </p>
            </div>

            <form onSubmit={submit} className="max-w-3xl space-y-6">
                <section className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                    <CustomerServiceFields
                        data={data}
                        setData={(key, value) => setData(key, value as never)}
                        errors={errors}
                        customers={customers}
                        services={services}
                    />
                </section>

                <div className="flex items-center gap-3">
                    <button type="submit" disabled={processing} className="btn-primary">
                        <Save className="h-4 w-4" />
                        <span>{processing ? 'Menyimpan...' : 'Simpan Layanan'}</span>
                    </button>
                    <Link href={route('admin.customer-services.index')} className="btn-ghost">
                        Batal
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}
