/**
 * URL aset terpusat. Aplikasi bisa dipasang di root domain maupun subfolder
 * (mis. /portal/), jadi tidak ada bolehnya path asset di-hardcode dari root
 * domain. Base aplikasi diinjeksi Laravel lewat <meta name="app-base"> di
 * app.blade.php; url('/') mengikuti lokasi request, sehingga benar di kedua
 * skenario deployment.
 */
let cachedBase: string | null = null;

export function appBase(): string {
    if (cachedBase !== null) return cachedBase;
    if (typeof document === "undefined") {
        cachedBase = "";
        return cachedBase;
    }
    const meta = document.querySelector('meta[name="app-base"]');
    cachedBase = (meta?.getAttribute("content") ?? "").replace(/\/+$/, "");
    return cachedBase;
}

/** File statis di folder public/ (images/, build/, dll). */
export function assetUrl(path?: string | null): string | undefined {
    if (!path) return undefined;
    if (/^(blob:|data:|https?:\/\/|\/\/)/.test(path)) return path;
    return `${appBase()}/${path.replace(/^\/+/, "")}`;
}

/** File dari disk "public" (uploads). Path di DB boleh "promos/x.jpg",
 * "storage/promos/x.jpg", atau "/storage/promos/x.jpg". */
export function storageUrl(path?: string | null): string | undefined {
    if (!path) return undefined;
    if (/^(blob:|data:|https?:\/\/|\/\/)/.test(path)) return path;
    const p = path.replace(/^\/+/, "").replace(/^storage\//, "");
    return `${appBase()}/storage/${p}`;
}

/** logo_path bisa berisi "/storage/logos/x.png", "/images/logo.png", atau kosong. */
export function logoUrl(path?: string | null): string {
    if (!path) return assetUrl("images/logo.png")!;
    if (/^(blob:|data:|https?:\/\/|\/\/)/.test(path)) return path;
    return path.replace(/^\/+/, "").startsWith("storage/")
        ? storageUrl(path)!
        : assetUrl(path)!;
}
