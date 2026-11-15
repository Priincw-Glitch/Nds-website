import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { ArrowLeft, Save } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { DeleteButton } from '@/Components/admin/DeleteButton';
import { CustomerServiceFields, flattenTechnicalInfo, type CustomerServiceFormData } from './fields';

interface Props {
    customerService: {
        id: number;
        user_id: number;
        service_id: number;
        service_name: string;
        package_type: string | null;
        status: string;
        activated_at: string | null;
        expired_at: string | null;
        technical_info: Record<string, string> | null;
        notes: string | null;
        user?: { id: number; name: string; email: string } | null;
        service?: { id: number; name: string } | null;
    };
    customers: Array<{ id: number; name: string; email: string }>;
    services: Array<{ id: number; name: string }>;
}

export default function CustomerServicesEdit({ customerService, customers, services }: Props) {
    // Backend hanya menerima paket/status/tanggal/informasi/catan saat update;
    // relasi pelanggan & layanan katalog ditampilkan sebagai read-only.
    const technicalInfoRows = Object.entries(customerService.technical_info ?? {}).map(([key, value]) => ({
        key,
        value: String(value),
    }));

    const { data, setData, put, transform, processing, errors } = useForm({
        user_id: String(customerService.user_id),
        service_id: String(customerService.service_id),
        package_type: customerService.package_type ?? '',
        status: customerService.status,
        activated_at: customerService.activated_at ?? '',
        expired_at: customerService.expired_at ?? '',
        technical_info: technicalInfoRows,
        notes: customerService.notes ?? '',
    } satisfies CustomerServiceFormData);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((currentData) => ({
            ...currentData,
            technical_info: flattenTechnicalInfo(currentData.technical_info),
        }));
        put(route('admin.customer-services.update', customerService.id), {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout title={`Edit Layanan: ${customerService.service_name}`}>
            <Head title={`Edit Layanan Pelanggan | NDS Admin`} />

            <div className="mb-6">
                <Link
                    href={route('admin.customer-services.index')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-tech-blue hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Layanan Pelanggan
                </Link>
                <h1 className="mt-2 text-xl font-bold text-navy sm:text-2xl">{customerService.service_name}</h1>
                <p className="mt-1 text-xs text-body-text">
                    Perubahan status dikirim sebagai notifikasi ke akun pelanggan.
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
                        lockIdentity
                        identityInfo={{
                            customer: customerService.user ? `${customerService.user.name} (${customerService.user.email})` : `#${customerService.user_id}`,
                            service: customerService.service?.name ?? customerService.service_name,
                        }}
                    />
                </section>

                <div className="flex items-center gap-3">
                    <button type="submit" disabled={processing} className="btn-primary">
                        <Save className="h-4 w-4" />
                        <span>{processing ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                    </button>
                    <DeleteButton
                        action={route('admin.customer-services.destroy', customerService.id)}
                        label={`layanan ${customerService.service_name}`}
                    />
                </div>
            </form>
        </AdminLayout>
    );
}
