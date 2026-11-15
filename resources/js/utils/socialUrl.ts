/**
 * URL media sosial dari Pengaturan Situs sering diisi tanpa skema
 * (mis. "linkedin.com/company/nds"). Tanpa normalisasi, browser membacanya
 * sebagai path relatif halaman sehingga tautan membuka alamat yang salah.
 */
export function normalizeSocialUrl(value?: string | null): string | null {
    const raw = value?.trim();
    if (!raw) return null;

    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("//")) return `https:${raw}`;

    // Skema selain web (mailto:, tel:, javascript:) bukan tautan media sosial.
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return null;

    return `https://${raw.replace(/^\/+/, "")}`;
}
