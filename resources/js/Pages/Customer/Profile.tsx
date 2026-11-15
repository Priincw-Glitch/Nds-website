import { Head, Link, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { AlertCircle, Save, KeyRound, ImageUp, UserCircle } from 'lucide-react';
import { useRef } from 'react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { storageUrl } from '@/utils/assets';

interface CustomerProfileInfo {
    address: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
}

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        avatar: string | null;
        status: string;
        created_at: string;
        customer_profile: (CustomerProfileInfo & { customer_code?: string | null }) | null;
    };
}

const statusBadge: Record<string, string> = {
    active: 'badge badge-success',
    pending: 'badge badge-warning',
    suspended: 'badge badge-danger',
    inactive: 'badge badge-neutral',
};

export default function Profile({ user }: Props) {
    // Customer ID disimpan di database (bukan dihitung dari id akun).
    const customerId = user.customer_profile?.customer_code ?? `USER${String(user.id).padStart(3, '0')}`;

    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        phone: user.phone ?? '',
        address: user.customer_profile?.address ?? '',
        city: user.customer_profile?.city ?? '',
        province: user.customer_profile?.province ?? '',
        postal_code: user.customer_profile?.postal_code ?? '',
    });

    const { data: passwordData, setData: setPasswordData, put: putPassword, processing: passwordProcessing, errors: passwordErrors } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const fileRef = useRef<HTMLInputElement>(null);

    const submitProfile = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('customer.profile.update'), { preserveScroll: true });
    };

    const submitPassword = (e: React.FormEvent) => {
        e.preventDefault();
        putPassword(route('customer.profile.password'), {
            preserveScroll: true,
            onSuccess: () => {
                setPasswordData('current_password', '');
                setPasswordData('password', '');
                setPasswordData('password_confirmation', '');
            },
        });
    };

    const submitAvatar = (e: React.FormEvent) => {
        e.preventDefault();
        const file = fileRef.current?.files?.[0];
        if (!file) return;
        router.post(
            route('customer.profile.avatar'),
            { avatar: file },
            { forceFormData: true, preserveScroll: true, onFinish: () => window.location.reload() },
        );
    };

    return (
        <CustomerLayout title="My Profile">
            <Head title="My Profile | NDS Customer Portal" />

            {Object.keys(errors).length > 0 && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50/90 p-4 text-sm text-red-900">
                    <div className="flex items-start gap-2.5">
                        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                        <div>
                            {Object.entries(errors).map(([key, message]) => (
                                <p key={key}>{message}</p>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {Object.keys(passwordErrors).length > 0 && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50/90 p-4 text-sm text-red-900">
                    <div className="flex items-start gap-2.5">
                        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                        <div>
                            {Object.entries(passwordErrors).map(([key, message]) => (
                                <p key={key}>{message}</p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Kartu identitas: email, status akun, dan customer ID dikelola admin = read-only */}
            <div className="mb-6 flex flex-wrap items-center gap-5 rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-electric-light">
                    {user.avatar ? (
                        <img src={storageUrl(user.avatar)} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <UserCircle className="h-10 w-10 text-tech-blue" />
                    )}
                </div>
                <div className="min-w-0">
                    <h1 className="text-lg font-bold text-navy sm:text-xl">{user.name}</h1>
                    <p className="truncate text-xs text-body-text">{user.email}</p>                        <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span>
                            Customer ID: <span className="font-mono font-semibold text-navy">{customerId}</span>
                        </span>
                        <span className={statusBadge[user.status] || statusBadge.inactive}>
                            {user.status === 'active' ? 'Akun Aktif' : `Status: ${user.status}`}
                        </span>
                    </div>
                </div>

                {/* Ganti foto profil (fitur upload tersedia di backend) */}
                <form onSubmit={submitAvatar} className="ml-auto">
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        className="sr-only"
                        aria-label="Pilih foto profil"
                    />
                    <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-xs">
                        <ImageUp className="h-3.5 w-3.5" />
                        <span>Ganti Foto</span>
                    </button>
                    <p className="mt-1.5 text-[11px] text-body-text/70">JPG / PNG, maksimal 2 MB</p>
                </form>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Edit profil */}
                <form onSubmit={submitProfile} className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                    <h2 className="mb-5 border-b border-border-soft pb-3 text-sm font-bold text-navy">Edit Profil</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="label">
                                Nama Lengkap *
                            </label>
                            <input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="input"
                                required
                            />
                            {errors.name && <p className="form-error">{errors.name}</p>}
                        </div>
                        <div>
                            <label htmlFor="phone" className="label">
                                Nomor Telepon *
                            </label>
                            <input
                                id="phone"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                className="input"
                                required
                            />
                            {errors.phone && <p className="form-error">{errors.phone}</p>}
                        </div>
                        <div>
                            <label htmlFor="address" className="label">
                                Alamat
                            </label>
                            <textarea
                                id="address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                className="input min-h-20"
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                                <label htmlFor="city" className="label">
                                    Kota
                                </label>
                                <input
                                    id="city"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label htmlFor="province" className="label">
                                    Provinsi
                                </label>
                                <input
                                    id="province"
                                    value={data.province}
                                    onChange={(e) => setData('province', e.target.value)}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label htmlFor="postal_code" className="label">
                                    Kode Pos
                                </label>
                                <input
                                    id="postal_code"
                                    value={data.postal_code}
                                    onChange={(e) => setData('postal_code', e.target.value)}
                                    className="input"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input value={user.email} className="input bg-light-gray/60" disabled aria-describedby="email-hint" />
                            <p id="email-hint" className="form-hint">
                                Email login tidak dapat diubah. Hubungi admin NDS untuk perubahan email login.
                            </p>
                        </div>
                        <button type="submit" disabled={processing} className="btn-primary text-xs">
                            <Save className="h-3.5 w-3.5" />
                            <span>{processing ? 'Menyimpan...' : 'Simpan Profil'}</span>
                        </button>
                    </div>
                </form>

                {/* Ganti password + layanan milik akun */}
                <div className="space-y-6">
                    <form onSubmit={submitPassword} className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <h2 className="mb-3 flex items-center gap-2 border-b border-border-soft pb-3 text-sm font-bold text-navy">
                            <KeyRound className="h-4 w-4 text-tech-blue" />
                            Ganti Password
                        </h2>
                        <div className="space-y-4 pt-2">
                            <div>
                                <label htmlFor="current_password" className="label">
                                    Password Saat Ini *
                                </label>
                                <input
                                    id="current_password"
                                    type="password"
                                    value={passwordData.current_password}
                                    onChange={(e) => setPasswordData('current_password', e.target.value)}
                                    className="input"
                                    required
                                />
                                {passwordErrors.current_password && (
                                    <p className="form-error">{passwordErrors.current_password}</p>
                                )}
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="password" className="label">
                                        Password Baru *
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={passwordData.password}
                                        onChange={(e) => setPasswordData('password', e.target.value)}
                                        className="input"
                                        placeholder="Minimal 8 karakter"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password_confirmation" className="label">
                                        Ulangi Password *
                                    </label>
                                    <input
                                        id="password_confirmation"
                                        type="password"
                                        value={passwordData.password_confirmation}
                                        onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                                        className="input"
                                        required
                                    />
                                </div>
                            </div>
                            {passwordErrors.password && <p className="form-error">{passwordErrors.password}</p>}
                            <button type="submit" disabled={passwordProcessing} className="btn-primary text-xs">
                                <Save className="h-3.5 w-3.5" />
                                <span>{passwordProcessing ? 'Menyimpan...' : 'Simpan Password Baru'}</span>
                            </button>
                        </div>
                    </form>

                    <section className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <h2 className="border-b border-border-soft pb-3 text-sm font-bold text-navy">Info Akun</h2>
                        <ul className="mt-3 space-y-2 text-xs text-body-text">
                            <li className="flex justify-between gap-3">
                                <span>Akun dibuat</span>
                                <span className="shrink-0 font-semibold text-navy">
                                    {new Date(user.created_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </span>
                            </li>
                            <li className="flex justify-between gap-3">
                                <span>Customer ID</span>
                                <span className="shrink-0 font-mono font-semibold text-navy">{customerId}</span>
                            </li>
                        </ul>
                        <p className="mt-3 text-[11px] text-body-text/70">
                            Customer ID, role, dan status akun dikelola admin NDS — tidak dapat diubah dari sini.
                        </p>
                        <Link href={route('customer.promos.index')} className="btn-secondary mt-4 w-full text-xs">
                            Lihat My Promo
                        </Link>
                    </section>
                </div>
            </div>
        </CustomerLayout>
    );
}
