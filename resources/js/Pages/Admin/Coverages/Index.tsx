import { Head, useForm, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, MapPin, X, Check, Search, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";
import { DeleteButton } from "@/Components/admin/DeleteButton";
import { Pagination } from "@/Components/admin/Pagination";
import RegionCombobox, { type RegionOption } from "@/Components/admin/RegionCombobox";

interface CoverageItem {
    id: number;
    area_name: string;
    city: string;
    district?: string | null;
    province?: string | null;
    province_code?: string | null;
    regency_code?: string | null;
    district_code?: string | null;
    service_id?: number | null;
    service_name?: string | null;
    status: "available" | "development" | "unavailable";
    notes?: string | null;
    is_active: boolean;
    service?: { id: number; name: string } | null;
}

interface ServiceOption {
    id: number;
    name: string;
}

interface PageProps {
    coverages: {
        data: CoverageItem[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        from?: number;
        to?: number;
    };
    services: ServiceOption[];
    filters: {
        q?: string;
        status?: string;
    };
}

export default function CoveragesIndex({ coverages, services, filters }: PageProps) {
    const [editing, setEditing] = useState<CoverageItem | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters.q || "");

    // Referensi wilayah: provinsi dimuat sekali saat halaman dibuka; kota &
    // kecamatan diambil per tingkat mengikuti pilihan induknya.
    const [provinceOptions, setProvinceOptions] = useState<RegionOption[] | null>(null);
    const [regencyOptions, setRegencyOptions] = useState<RegionOption[] | null>(null);
    const [districtOptions, setDistrictOptions] = useState<RegionOption[] | null>(null);
    const [loadingRegencies, setLoadingRegencies] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [provinceValue, setProvinceValue] = useState<RegionOption | null>(null);
    const [regencyValue, setRegencyValue] = useState<RegionOption | null>(null);
    const [districtValue, setDistrictValue] = useState<RegionOption | null>(null);
    const regencyCache = useRef<Map<string, RegionOption[]>>(new Map());
    const districtCache = useRef<Map<string, RegionOption[]>>(new Map());
    const legacyMatch = useRef<CoverageItem | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        area_name: "",
        province_code: "",
        regency_code: "",
        district_code: "",
        service_id: "" as number | string,
        service_name: "",
        status: "available" as "available" | "development" | "unavailable",
        notes: "",
        is_active: true,
    });

    // Daftar provinsi untuk seluruh Indonesia dimuat saat halaman dibuka.
    useEffect(() => {
        let alive = true;
        fetch(route("admin.coverages.regions.provinces"), { headers: { Accept: "application/json" } })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error("gagal memuat"))))
            .then((list) => alive && setProvinceOptions(list))
            .catch(() => alive && setProvinceOptions([]));
        return () => {
            alive = false;
        };
    }, []);

    // Daftar kota/kabupaten mengikuti provinsi terpilih (cache per kode).
    useEffect(() => {
        if (!data.province_code) return;
        const cached = regencyCache.current.get(data.province_code);
        if (cached) {
            setRegencyOptions(cached);
            return;
        }
        let alive = true;
        setLoadingRegencies(true);
        setRegencyOptions(null);
        fetch(route("admin.coverages.regions.regencies", data.province_code), {
            headers: { Accept: "application/json" },
        })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error("gagal memuat"))))
            .then((list) => {
                regencyCache.current.set(data.province_code, list);
                if (alive) setRegencyOptions(list);
            })
            .catch(() => alive && setRegencyOptions([]))
            .finally(() => alive && setLoadingRegencies(false));
        return () => {
            alive = false;
        };
    }, [data.province_code]);

    // Daftar kecamatan mengikuti kota/kabupaten terpilih (cache per kode).
    useEffect(() => {
        if (!data.regency_code) return;
        const cached = districtCache.current.get(data.regency_code);
        if (cached) {
            setDistrictOptions(cached);
            return;
        }
        let alive = true;
        setLoadingDistricts(true);
        setDistrictOptions(null);
        fetch(route("admin.coverages.regions.districts", data.regency_code), {
            headers: { Accept: "application/json" },
        })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error("gagal memuat"))))
            .then((list) => {
                districtCache.current.set(data.regency_code, list);
                if (alive) setDistrictOptions(list);
            })
            .catch(() => alive && setDistrictOptions([]))
            .finally(() => alive && setLoadingDistricts(false));
        return () => {
            alive = false;
        };
    }, [data.regency_code]);

    const changeProvince = (option: RegionOption) => {
        setProvinceValue(option);
        setData("province_code", option.code);
        // Reset tingkat di bawahnya agar tidak ada kombinasi lintas wilayah.
        setRegencyValue(null);
        setDistrictValue(null);
        setData("regency_code", "");
        setData("district_code", "");
    };

    const changeRegency = (option: RegionOption) => {
        setRegencyValue(option);
        setData("regency_code", option.code);
        setDistrictValue(null);
        setData("district_code", "");
    };

    const changeDistrict = (option: RegionOption) => {
        setDistrictValue(option);
        setData("district_code", option.code);
    };

    const clearRegionValues = () => {
        setProvinceValue(null);
        setRegencyValue(null);
        setDistrictValue(null);
        setRegencyOptions(null);
        setDistrictOptions(null);
    };

    const openEdit = (item: CoverageItem) => {
        setEditing(item);
        setData({
            area_name: item.area_name,
            province_code: item.province_code || "",
            regency_code: item.regency_code || "",
            district_code: item.district_code || "",
            service_id: item.service_id || "",
            service_name: item.service_name || "",
            status: item.status,
            notes: item.notes || "",
            is_active: item.is_active,
        });

        // Prefill: data baru punya kode — tampilkan langsung; data lama tanpa
        // kode dicocokkan by-name terhadap daftar provinsi (best-effort),
        // kota & kecamatan diminta dipilih ulang bila tidak cocok.
        setProvinceValue(item.province_code ? { code: item.province_code, name: item.province || "" } : null);
        setRegencyValue(item.regency_code ? { code: item.regency_code, name: item.city || "" } : null);
        setDistrictValue(item.district_code ? { code: item.district_code, name: item.district || "" } : null);
        legacyMatch.current = item.province_code ? null : item;
    };

    // Best-effort matching nama provinsi untuk data lama tanpa kode.
    useEffect(() => {
        if (!legacyMatch.current || !provinceOptions) return;
        const item = legacyMatch.current;
        legacyMatch.current = null;
        const term = (item.province || "").trim().toLowerCase();
        const found = provinceOptions.find((o) => o.name.toLowerCase() === term);
        if (found) {
            setProvinceValue(found);
            setData("province_code", found.code);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provinceOptions]);

    const cancelEdit = () => {
        setEditing(null);
        clearRegionValues();
        reset();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            put(route("admin.coverages.update", editing.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setEditing(null);
                    clearRegionValues();
                    reset();
                },
            });
        } else {
            post(route("admin.coverages.store"), {
                preserveScroll: true,
                onSuccess: () => {
                    clearRegionValues();
                    reset();
                },
            });
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route("admin.coverages.index"),
            { q: searchQuery, status: filters.status },
            { preserveState: true, replace: true }
        );
    };

    const handleFilterStatus = (status: string) => {
        router.get(
            route("admin.coverages.index"),
            { q: searchQuery, status: status || undefined },
            { preserveState: true, replace: true }
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "available":
                return (
                    <span className="badge badge-success">
                        <ShieldCheck className="h-3 w-3" />
                        Tersedia
                    </span>
                );
            case "development":
                return (
                    <span className="badge badge-warning">
                        <Clock className="h-3 w-3" />
                        Pengembangan
                    </span>
                );
            case "unavailable":
                return (
                    <span className="badge badge-danger">
                        <AlertTriangle className="h-3 w-3" />
                        Belum Tersedia
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <AdminLayout title="Cakupan Wilayah Layanan">
            <Head title="Cakupan Wilayah | NDS Admin" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-navy sm:text-2xl">Cakupan Wilayah Layanan</h1>
                    <p className="mt-1 text-xs text-body-text">
                        Kelola data verifikasi ketersediaan jaringan dan jangkauan layanan NDS untuk fitur Cek Jangkauan.
                    </p>
                </div>
            </div>

            {/* Filter & Pencarian */}
            <div className="mb-6 rounded-2xl border border-border-soft bg-white p-4 shadow-subtle">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <form onSubmit={handleSearch} className="relative w-full sm:max-w-md">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-body-text/60" />
                        <label htmlFor="coverage-search" className="sr-only">
                            Cari nama area, kota, atau kecamatan
                        </label>
                        <input
                            id="coverage-search"
                            type="search"
                            placeholder="Cari nama area, kota, atau kecamatan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-10"
                        />
                    </form>

                    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter status ketersediaan">
                        <button
                            type="button"
                            onClick={() => handleFilterStatus("")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                                !filters.status ? "bg-navy text-white" : "bg-white text-navy border border-border-soft hover:bg-navy/5"
                            }`}
                        >
                            Semua Status
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterStatus("available")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                                filters.status === "available" ? "bg-navy text-white" : "bg-white text-navy border border-border-soft hover:bg-navy/5"
                            }`}
                        >
                            Tersedia
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterStatus("development")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                                filters.status === "development" ? "bg-navy text-white" : "bg-white text-navy border border-border-soft hover:bg-navy/5"
                            }`}
                        >
                            Pengembangan
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterStatus("unavailable")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                                filters.status === "unavailable" ? "bg-navy text-white" : "bg-white text-navy border border-border-soft hover:bg-navy/5"
                            }`}
                        >
                            Belum Tersedia
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Table Section */}
                <div className="lg:col-span-2">
                    <div className="table-wrapper">
                        <table className="table-modern">
                            <thead>
                                <tr>
                                    <th>Wilayah & Kota</th>
                                    <th>Layanan Terverifikasi</th>
                                    <th>Status</th>
                                    <th className="text-right">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coverages.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-body-text">
                                            <div className="flex flex-col items-center justify-center">
                                                <MapPin className="h-6 w-6 text-body-text/60" />
                                                <p className="mt-2 text-sm font-semibold text-navy">Belum ada data cakupan wilayah</p>
                                                <p className="text-xs text-body-text">Tambahkan data melalui formulir di samping.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    coverages.data.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <p className="font-semibold text-navy">{item.area_name}</p>
                                                <p className="text-xs text-body-text">
                                                    {item.district ? `${item.district}, ` : ""}
                                                    <span className="font-medium text-navy/90">{item.city}</span>
                                                    {item.province ? ` (${item.province})` : ""}
                                                </p>
                                                {item.notes && (
                                                    <p className="mt-1 text-xs text-body-text/80 line-clamp-1 italic">
                                                        "{item.notes}"
                                                    </p>
                                                )}
                                            </td>
                                            <td>
                                                <span className="text-xs font-medium text-navy">
                                                    {item.service?.name || item.service_name || "Semua Layanan NDS"}
                                                </span>
                                            </td>
                                            <td>
                                                {getStatusBadge(item.status)}
                                                {!item.is_active && (
                                                    <span className="ml-1.5 inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-body-text">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(item)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-border-soft bg-white px-2.5 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5 transition-colors"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        <span>Edit</span>
                                                    </button>
                                                    <DeleteButton
                                                        action={route("admin.coverages.destroy", item.id)}
                                                        label={`cakupan wilayah "${item.area_name}"`}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4">
                        <Pagination
                            meta={{
                                current_page: coverages.current_page,
                                last_page: coverages.last_page,
                                total: coverages.total,
                                from: coverages.from,
                                to: coverages.to,
                            }}
                        />
                    </div>
                </div>

                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-subtle">
                        <div className="mb-5 flex items-center justify-between border-b border-border-soft pb-4">
                            <h2 className="text-sm font-bold text-navy">
                                {editing ? "Edit Cakupan Wilayah" : "Tambah Cakupan Wilayah"}
                            </h2>
                            {editing && (
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="inline-flex items-center gap-1 text-xs text-body-text hover:text-navy"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    <span>Batal</span>
                                </button>
                            )}
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="label">
                                    Nama Area / Kawasan <span className="text-crimson">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: SCBD & Sudirman / Kawasan Industri MM2100"
                                    value={data.area_name}
                                    onChange={(e) => setData("area_name", e.target.value)}
                                    className="input text-sm"
                                />
                                {errors.area_name && <p className="form-error">{errors.area_name}</p>}
                            </div>

                            <RegionCombobox
                                label="Provinsi"
                                placeholder="Pilih provinsi"
                                options={provinceOptions}
                                loading={provinceOptions === null}
                                error={errors.province_code}
                                requiredMark
                                value={provinceValue}
                                onSelect={changeProvince}
                            />

                            <RegionCombobox
                                label="Kota / Kabupaten"
                                placeholder="Pilih kota/kabupaten"
                                disabledPlaceholder="Pilih provinsi dulu"
                                options={regencyOptions}
                                loading={loadingRegencies}
                                error={errors.regency_code}
                                disabled={!data.province_code}
                                requiredMark
                                value={regencyValue}
                                onSelect={changeRegency}
                            />

                            <RegionCombobox
                                label="Kecamatan"
                                placeholder="Pilih kecamatan"
                                disabledPlaceholder="Pilih kota/kabupaten dulu"
                                options={districtOptions}
                                loading={loadingDistricts}
                                error={errors.district_code}
                                disabled={!data.regency_code}
                                requiredMark
                                value={districtValue}
                                onSelect={changeDistrict}
                            />

                            <div>
                                <label className="label">Layanan Terkait</label>
                                <select
                                    value={data.service_id}
                                    onChange={(e) => {
                                        const selectedId = e.target.value;
                                        setData("service_id", selectedId);
                                        const found = services.find((s) => String(s.id) === selectedId);
                                        if (found) {
                                            setData("service_name", found.name);
                                        }
                                    }}
                                    className="input text-sm"
                                >
                                    <option value="">Semua Layanan NDS</option>
                                    {services.map((svc) => (
                                        <option key={svc.id} value={svc.id}>
                                            {svc.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label">
                                    Status Ketersediaan <span className="text-crimson">*</span>
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData("status", e.target.value as any)}
                                    className="input text-sm font-semibold"
                                >
                                    <option value="available">Tersedia (Ready for deployment)</option>
                                    <option value="development">Dalam Pengembangan (Under expansion)</option>
                                    <option value="unavailable">Belum Tersedia (Requires special survey)</option>
                                </select>
                                {errors.status && <p className="form-error">{errors.status}</p>}
                            </div>

                            <div>
                                <label className="label">Catatan Teknis / Informasi Cakupan</label>
                                <textarea
                                    rows={3}
                                    placeholder="Contoh: Jalur fiber optic siap sambung, dukungan teknis onsite 24 jam."
                                    value={data.notes}
                                    onChange={(e) => setData("notes", e.target.value)}
                                    className="input text-sm"
                                />
                            </div>

                            <label className="flex items-center gap-2 text-xs font-semibold text-navy cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData("is_active", e.target.checked)}
                                    className="h-4 w-4 rounded text-tech-blue focus:ring-tech-blue"
                                />
                                <span>Aktif (dipakai pada Cek Jangkauan di Beranda)</span>
                            </label>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing || !data.province_code || !data.regency_code || !data.district_code}
                                    className="btn-primary w-full justify-center text-sm py-2.5"
                                >
                                    {editing ? (
                                        <>
                                            <Check className="h-4 w-4 mr-1.5" />
                                            Simpan Perubahan
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-1.5" />
                                            Tambah Wilayah
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
