import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Package, Calendar, AlertCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import CustomerLayout from '@/Layouts/CustomerLayout';

interface Service {
    id: number;
    name: string;
}

interface CustomerService {
    id: number;
    service_id: number;
    service_name: string;
    package_type: string | null;
    status: string;
    status_label: string;
    status_color: string;
    activated_at: string | null;
    expired_at: string | null;
    created_at: string;
    service: Service;
}

interface Props {
    services: CustomerService[];
}

export default function ServicesIndex({ services }: Props) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircle className="w-5 h-5" />;
            case 'waiting_activation':
                return <Clock className="w-5 h-5" />;
            case 'maintenance':
                return <AlertTriangle className="w-5 h-5" />;
            case 'suspended':
            case 'expired':
                return <AlertCircle className="w-5 h-5" />;
            default:
                return <Package className="w-5 h-5" />;
        }
    };

    const getStatusBadgeClass = (color: string) => {
        const colors = {
            success: 'bg-green-100 text-green-700 border-green-200',
            warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            danger: 'bg-red-100 text-red-700 border-red-200',
            info: 'bg-blue-100 text-blue-700 border-blue-200',
            secondary: 'bg-gray-100 text-gray-700 border-gray-200',
        };
        return colors[color as keyof typeof colors] || colors.secondary;
    };

    const activeServices = services.filter((s) => s.status === 'active');
    const inactiveServices = services.filter((s) => s.status !== 'active');

    return (
        <CustomerLayout title="Layanan Saya">
            <Head title="Layanan Saya | NDS Customer Portal" />

            <div className="container-nds">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl border border-border-soft p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-navy">{activeServices.length}</p>
                                <p className="text-sm text-body-text">Layanan Aktif</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-border-soft p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-navy">{services.length}</p>
                                <p className="text-sm text-body-text">Total Layanan</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-border-soft p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-navy">{inactiveServices.length}</p>
                                <p className="text-sm text-body-text">Tidak Aktif</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Services */}
                {activeServices.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-navy mb-4">Layanan Aktif</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeServices.map((service) => (
                                <Link
                                    key={service.id}
                                    href={route('customer.services.show', service.id)}
                                    className="group bg-white rounded-xl border border-border-soft p-6 hover:border-tech-blue/40 hover:shadow-card transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-tech-blue/10 rounded-lg flex items-center justify-center group-hover:bg-tech-blue/20 transition-colors">
                                            <Package className="w-6 h-6 text-tech-blue" />
                                        </div>
                                        <span
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(service.status_color)}`}
                                        >
                                            {getStatusIcon(service.status)}
                                            {service.status_label}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-navy mb-2 group-hover:text-tech-blue transition-colors">
                                        {service.service_name}
                                    </h3>

                                    {service.package_type && (
                                        <p className="text-sm text-body-text mb-3">
                                            Paket: <span className="font-semibold">{service.package_type}</span>
                                        </p>
                                    )}

                                    <div className="space-y-2 text-sm text-body-text">
                                        {service.activated_at && (
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>Aktif sejak {formatDate(service.activated_at)}</span>
                                            </div>
                                        )}
                                        {service.expired_at && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                <span>Berlaku hingga {formatDate(service.expired_at)}</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Inactive Services */}
                {inactiveServices.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold text-navy mb-4">Layanan Lainnya</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {inactiveServices.map((service) => (
                                <Link
                                    key={service.id}
                                    href={route('customer.services.show', service.id)}
                                    className="group bg-white rounded-xl border border-border-soft p-6 hover:border-tech-blue/40 hover:shadow-card transition-all opacity-75 hover:opacity-100"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <Package className="w-6 h-6 text-gray-600" />
                                        </div>
                                        <span
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(service.status_color)}`}
                                        >
                                            {getStatusIcon(service.status)}
                                            {service.status_label}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-navy mb-2 group-hover:text-tech-blue transition-colors">
                                        {service.service_name}
                                    </h3>

                                    {service.package_type && (
                                        <p className="text-sm text-body-text mb-3">
                                            Paket: <span className="font-semibold">{service.package_type}</span>
                                        </p>
                                    )}

                                    <div className="space-y-2 text-sm text-body-text">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>Dibuat {formatDate(service.created_at)}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {services.length === 0 && (
                    <div className="bg-white rounded-xl border border-border-soft p-12 text-center">
                        <Package className="w-16 h-16 text-body-text/30 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-navy mb-2">Belum Ada Layanan</h3>
                        <p className="text-body-text mb-6">
                            Anda belum memiliki layanan yang terdaftar. Hubungi admin untuk menambahkan layanan.
                        </p>
                        <Button asChild variant="primary">
                            <Link href={route('contact')}>Hubungi Kami</Link>
                        </Button>
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}
