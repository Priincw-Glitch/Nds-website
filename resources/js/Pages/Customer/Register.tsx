import { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { User, Mail, Phone, MapPin, FileText, AlertCircle } from 'lucide-react';

interface Service {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    services: Service[];
}

export default function Register({ services }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        province: '',
        postal_code: '',
        service_id: '',
        service_details: '',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('customer.register'));
    };

    return (
        <>
            <Head title="Registrasi Pelanggan" />
            
            <div className="min-h-screen bg-light-gray py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-navy mb-2">Registrasi Pelanggan</h1>
                        <p className="text-body-text">Daftarkan diri Anda untuk menggunakan layanan NDS</p>
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-2xl shadow-card p-8">
                        {/* Errors */}
                        {Object.keys(errors).length > 0 && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-semibold text-red-700 text-sm mb-1">Terdapat kesalahan:</p>
                                    {Object.entries(errors).map(([key, message]) => (
                                        <p key={key} className="text-sm text-red-600">• {message}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-6">
                            {/* Personal Information */}
                            <div>
                                <h3 className="text-lg font-bold text-navy mb-4">Informasi Pribadi</h3>
                                <div className="space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-navy mb-2">
                                            Nama Lengkap <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-body-text/50" />
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-tech-blue"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Email & Phone */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-navy mb-2">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-body-text/50" />
                                                <input
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-tech-blue"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-navy mb-2">
                                                No. Telepon <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-body-text/50" />
                                                <input
                                                    type="tel"
                                                    value={data.phone}
                                                    onChange={(e) => setData('phone', e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-tech-blue"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Address Information */}
                            <div>
                                <h3 className="text-lg font-bold text-navy mb-4">Alamat</h3>
                                <div className="space-y-4">
                                    {/* Address */}
                                    <div>
                                        <label className="block text-sm font-semibold text-navy mb-2">
                                            Alamat Lengkap <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2.5 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-tech-blue resize-none"
                                            required
                                        />
                                    </div>

                                    {/* City, Province, Postal Code */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-navy mb-2">
                                                Kota/Kabupaten <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.city}
                                                onChange={(e) => setData('city', e.target.value)}
                                                className="w-full px-4 py-2.5 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-tech-blue"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-navy mb-2">
                                                Provinsi <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.province}
                                                onChange={(e) => setData('province', e.target.value)}
                                                className="w-full px-4 py-2.5 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-tech-blue"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-navy mb-2">
                                                Kode Pos
                                            </label>
                                            <input
                                                type="text"
                                                value={data.postal_code}
                                                onChange={(e) => setData('postal_code', e.target.value)}
                                                className="w-full px-4 py-2.5 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-tech-blue"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Service Information */}
                            <div>
                                <h3 className="text-lg font-bold text-navy mb-4">Layanan yang Diinginkan</h3>
                                <div className="space-y-4">
                                    {/* Service Selection */}
                                    <div>
                                        <label className="block text-sm font-semibold text-navy mb-2">
                                            Pilih Layanan <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.service_id}
                                            onChange={(e) => setData('service_id', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-tech-blue"
                                            required
                                        >
                                            <option value="">-- Pilih Layanan --</option>
                                            {services.map((service) => (
                                                <option key={service.id} value={service.id}>
                                                    {service.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Service Details */}
                                    <div>
                                        <label className="block text-sm font-semibold text-navy mb-2">
                                            Detail Kebutuhan Layanan
                                        </label>
                                        <textarea
                                            value={data.service_details}
                                            onChange={(e) => setData('service_details', e.target.value)}
                                            rows={3}
                                            placeholder="Jelaskan kebutuhan Anda secara detail..."
                                            className="w-full px-4 py-2.5 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-tech-blue resize-none"
                                        />
                                    </div>

                                    {/* Additional Notes */}
                                    <div>
                                        <label className="block text-sm font-semibold text-navy mb-2">
                                            Catatan Tambahan
                                        </label>
                                        <textarea
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            rows={2}
                                            placeholder="Catatan atau informasi tambahan..."
                                            className="w-full px-4 py-2.5 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-tech-blue resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="bg-electric-light/30 border border-tech-blue/30 rounded-lg p-4">
                                <p className="text-sm text-navy">
                                    <strong>Catatan:</strong> Setelah pendaftaran, data Anda akan ditinjau oleh tim kami. 
                                    Anda akan menerima email konfirmasi ketika akun Anda telah diaktifkan.
                                </p>
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-4">
                                <Button
                                    asChild
                                    variant="secondary"
                                    size="lg"
                                    className="flex-1"
                                >
                                    <Link href={route('login')}>Kembali</Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="primary"
                                    size="lg"
                                    className="flex-1 font-bold"
                                    disabled={processing}
                                >
                                    <button type="submit" disabled={processing}>
                                        {processing ? 'Mendaftar...' : 'Daftar Sekarang'}
                                    </button>
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Login Link */}
                    <p className="text-center text-sm text-body-text mt-6">
                        Sudah punya akun?{' '}
                        <Link
                            href={route('login')}
                            className="font-semibold text-tech-blue hover:text-tech-blue-hover"
                        >
                            Login di sini
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}
