import { Head, useForm } from "@inertiajs/react";
import { route } from "ziggy-js";
import { User, Mail, Lock, Save } from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
        created_at: string;
    };
}

export default function ProfileEdit({ user }: Props) {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: user.name,
        email: user.email,
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route("admin.profile.update"), {
            preserveScroll: true,
            onSuccess: () => {
                reset("current_password", "new_password", "new_password_confirmation");
            },
        });
    };

    return (
        <AdminLayout title="Profil Pengguna">
            <Head title="Profil Administrator | NDS Admin" />

            <div className="mb-6">
                <h1 className="text-xl font-bold text-navy sm:text-2xl">Profil & Keamanan Akun</h1>
                <p className="mt-1 text-xs text-body-text">
                    Kelola nama administrator, alamat email login, serta pembaruan kata sandi autentikasi.
                </p>
            </div>

            <form onSubmit={submit} className="max-w-2xl space-y-6">
                {/* Data Profil */}
                <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                    <div className="flex items-center gap-2 border-b border-border-soft pb-4 mb-5">
                        <User className="h-4 w-4 text-tech-blue" />
                        <h2 className="text-sm font-bold text-navy">Informasi Akun</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="label">Nama Lengkap Administrator *</label>
                            <input
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                className="input"
                                placeholder="Nama Administrator"
                                required
                            />
                            {errors.name && <p className="form-error">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="label">Alamat Email Login *</label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                                className="input"
                                placeholder="admin@ndsdigital.id"
                                required
                            />
                            {errors.email && <p className="form-error">{errors.email}</p>}
                        </div>
                    </div>
                </div>

                {/* Pembaruan Kata Sandi */}
                <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                    <div className="flex items-center gap-2 border-b border-border-soft pb-4 mb-2">
                        <Lock className="h-4 w-4 text-tech-blue" />
                        <h2 className="text-sm font-bold text-navy">Ganti Kata Sandi</h2>
                    </div>
                    <p className="text-xs text-body-text mb-5">
                        Kosongkan bagian ini jika Anda tidak ingin mengubah kata sandi akun saat ini.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="label">Kata Sandi Saat Ini</label>
                            <input
                                type="password"
                                value={data.current_password}
                                onChange={(e) => setData("current_password", e.target.value)}
                                className="input"
                                placeholder="Masukkan kata sandi saat ini"
                            />
                            {errors.current_password && <p className="form-error">{errors.current_password}</p>}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="label">Kata Sandi Baru</label>
                                <input
                                    type="password"
                                    value={data.new_password}
                                    onChange={(e) => setData("new_password", e.target.value)}
                                    className="input"
                                    placeholder="Minimal 8 karakter"
                                />
                                {errors.new_password && <p className="form-error">{errors.new_password}</p>}
                            </div>

                            <div>
                                <label className="label">Ulangi Kata Sandi Baru</label>
                                <input
                                    type="password"
                                    value={data.new_password_confirmation}
                                    onChange={(e) => setData("new_password_confirmation", e.target.value)}
                                    className="input"
                                    placeholder="Konfirmasi kata sandi"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end rounded-2xl border border-border-soft bg-white p-4 shadow-subtle">
                    <button type="submit" disabled={processing} className="btn-primary py-2.5">
                        <Save className="h-4 w-4" />
                        <span>{processing ? "Menyimpan profil..." : "Simpan Perubahan Profil"}</span>
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}
