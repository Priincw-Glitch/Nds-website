// Nomor WhatsApp baik datang sebagai "08..", "62..", "8..", atau dengan
// pemisah. Ikon wa.me dibangun dari satu sumber (Pengaturan Situs) via
// helper ini, dipakai footer publik dan pratinjau admin agar identik.
export function waNumber(raw: string | null | undefined): string {
    const digits = (raw ?? "").replace(/\D/g, "");
    if (digits === "") return "";
    if (digits.startsWith("62")) return digits;
    if (digits.startsWith("0")) return `62${digits.slice(1)}`;
    if (digits.startsWith("8")) return `62${digits}`;
    return digits;
}

export function waMeLink(raw: string | null | undefined): string {
    const digits = waNumber(raw);
    return digits === "" ? "" : `https://wa.me/${digits}`;
}
