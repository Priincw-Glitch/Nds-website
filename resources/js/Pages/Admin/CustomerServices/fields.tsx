import { Plus, Trash2 } from 'lucide-react';

export interface CustomerServiceFormData {
    user_id: string;
    service_id: string;
    package_type: string;
    status: string;
    activated_at: string;
    expired_at: string;
    technical_info: Array<{ key: string; value: string }>;
    notes: string;
}

export const SERVICE_STATUSES = [
    { value: 'waiting_activation', label: 'Menunggu Aktivasi' },
    { value: 'active', label: 'Aktif' },
    { value: 'maintenance', label: 'Pemeliharaan' },
    { value: 'suspended', label: 'Ditangguhkan' },
    { value: 'expired', label: 'Kedaluwarsa' },
];

/**
 * Ubah daftar baris key/value menjadi objek tunggal yang diharapkan backend
 * (validasi `technical_info` bertipe array asosiatif).
 */
export function flattenTechnicalInfo(rows: Array<{ key: string; value: string }>) {
    const result: Record<string, string> = {};
    rows.forEach((row) => {
        if (row.key.trim()) result[row.key.trim()] = row.value.trim();
    });
    return result;
}

/** Field reformulasi layanan pelanggan; taxatan user/service opsional (read-only di Edit). */
export function CustomerServiceFields({
    data,
    setData,
    errors,
    customers,
    services,
    lockIdentity = false,
    identityInfo,
}: {
    data: CustomerServiceFormData;
    setData: (key: keyof CustomerServiceFormData, value: unknown) => void;
    errors: Record<string, string>;
    customers: Array<{ id: number; name: string; email: string }>;
    services: Array<{ id: number; name: string }>;
    lockIdentity?: boolean;
    identityInfo?: { customer: string; service: string };
}) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                {lockIdentity ? (
                    <>
                        <div>
                            <label className="label">Pelanggan</label>
                            <input value={identityInfo?.customer ?? ''} className="input bg-light-gray/60" disabled />
                            <p className="form-hint">Pelanggan tidak diubah dari halaman edit.</p>
                        </div>
                        <div>
                            <label className="label">Layanan Katalog</label>
                            <input value={identityInfo?.service ?? ''} className="input bg-light-gray/60" disabled />
                            <p className="form-hint">Layanan katalog tidak diubah dari halaman edit.</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <label className="label" htmlFor="user_id">
                                Pelanggan *
                            </label>
                            <select
                                id="user_id"
                                value={data.user_id}
                                onChange={(e) => setData('user_id', e.target.value)}
                                className="input"
                                required
                            >
                                <option value="">Pilih pelanggan</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={String(c.id)}>
                                        {c.name} ({c.email})
                                    </option>
                                ))}
                            </select>
                            {errors.user_id && <p className="form-error">{errors.user_id}</p>}
                            {customers.length === 0 && (
                                <p className="form-hint">Belum ada pelanggan aktif. Buat akun pelanggan terlebih dahulu.</p>
                            )}
                        </div>
                        <div>
                            <label className="label" htmlFor="service_id">
                                Layanan Katalog *
                            </label>
                            <select
                                id="service_id"
                                value={data.service_id}
                                onChange={(e) => setData('service_id', e.target.value)}
                                className="input"
                                required
                            >
                                <option value="">Pilih layanan</option>
                                {services.map((s) => (
                                    <option key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            {errors.service_id && <p className="form-error">{errors.service_id}</p>}
                        </div>
                    </>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div>
                    <label className="label" htmlFor="package_type">
                        Tipe / Nama Paket
                    </label>
                    <input
                        id="package_type"
                        value={data.package_type}
                        onChange={(e) => setData('package_type', e.target.value)}
                        className="input"
                        placeholder="mis. Paket Bisnis 10 Mbps"
                    />
                    {errors.package_type && <p className="form-error">{errors.package_type}</p>}
                </div>
                <div>
                    <label className="label" htmlFor="status">
                        Status Layanan *
                    </label>
                    <select
                        id="status"
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                        className="input"
                        required
                    >
                        {SERVICE_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                    {errors.status && <p className="form-error">{errors.status}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:col-span-1 sm:grid-cols-1 sm:gap-4">
                    <div>
                        <label className="label" htmlFor="activated_at">
                            Tanggal Mulai
                        </label>
                        <input
                            id="activated_at"
                            type="date"
                            value={data.activated_at}
                            onChange={(e) => setData('activated_at', e.target.value)}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="label" htmlFor="expired_at">
                            Berlaku Hingga
                        </label>
                        <input
                            id="expired_at"
                            type="date"
                            value={data.expired_at}
                            onChange={(e) => setData('expired_at', e.target.value)}
                            className="input"
                        />
                        {errors.expired_at && <p className="form-error">{errors.expired_at}</p>}
                        <p className="form-hint">Harus setelah tanggal mulai.</p>
                    </div>
                </div>
            </div>

            {/* Informasi teknis: pasangan label-nilai, aman untuk ditampilkan ke pelanggan */}
            <div>
                <p className="label">Informasi Tambahan untuk Pelanggan</p>
                <p className="form-hint mb-2">
                    Informasi ini tampil di Layanan Saya milik pelanggan. Jangan menaruh password server, API key, atau credential
                    rahasia.
                </p>
                {data.technical_info.length === 0 ? (
                    <p className="rounded-md border border-border-soft bg-light-gray/50 px-3 py-2 text-xs text-body-text">
                        Belum ada baris informasi.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {data.technical_info.map((row, i) => (
                            <li key={i} className="flex items-center gap-2">
                                <input
                                    value={row.key}
                                    onChange={(e) => {
                                        const next = [...data.technical_info];
                                        next[i] = { ...next[i], key: e.target.value };
                                        setData('technical_info', next);
                                    }}
                                    className="input text-xs"
                                    placeholder="Label, mis. Bandwidth"
                                    aria-label={`Label baris ${i + 1}`}
                                />
                                <input
                                    value={row.value}
                                    onChange={(e) => {
                                        const next = [...data.technical_info];
                                        next[i] = { ...next[i], value: e.target.value };
                                        setData('technical_info', next);
                                    }}
                                    className="input text-xs"
                                    placeholder="Nilai, mis. 10 Mbps"
                                    aria-label={`Nilai baris ${i + 1}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setData('technical_info', data.technical_info.filter((_, j) => j !== i))}
                                    className="rounded-md p-2 text-red-600 hover:bg-red-500/10"
                                    aria-label={`Hapus baris ${i + 1}`}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <button
                    type="button"
                    onClick={() => setData('technical_info', [...data.technical_info, { key: '', value: '' }])}
                    className="btn-secondary mt-2 text-xs"
                >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Baris</span>
                </button>
                {errors.technical_info && <p className="form-error">{errors.technical_info}</p>}
            </div>

            <div>
                <label className="label" htmlFor="notes">
                    Catatan Internal
                </label>
                <textarea
                    id="notes"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    className="input min-h-20"
                    placeholder="Catatan yang juga terlihat pelanggan di halaman detail layanan"
                />
                {errors.notes && <p className="form-error">{errors.notes}</p>}
            </div>
        </div>
    );
}
