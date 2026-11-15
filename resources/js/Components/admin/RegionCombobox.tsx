import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, MapPin, Search } from "lucide-react";

export interface RegionOption {
    code: string;
    name: string;
    /** Hanya diisi pada level kota/kabupaten. */
    type?: "kota" | "kabupaten";
}

interface RegionComboboxProps {
    label: string;
    placeholder: string;
    /** Teks trigger saat disabled (mis. "Pilih provinsi dulu"). */
    disabledPlaceholder?: string;
    /** null = daftar belum dimuat; [] = dimuat tapi kosong. */
    options: RegionOption[] | null;
    loading: boolean;
    error?: string;
    disabled?: boolean;
    requiredMark?: boolean;
    value: RegionOption | null;
    onSelect: (option: RegionOption) => void;
}

/**
 * Combobox wilayah yang bisa dicari, konsisten dengan gaya form Admin Panel
 * NDS (trigger .input, popover putih rounded + shadow-dropdown, aksen
 * tech-blue). Pencarian difilter klien-side; daftar per level hanya puluhan
 * sampai ratusan baris sehingga instan. Keyboard: ↑ ↓ Enter Escape.
 */
export default function RegionCombobox({
    label,
    placeholder,
    disabledPlaceholder,
    options,
    loading,
    error,
    disabled = false,
    requiredMark = false,
    value,
    onSelect,
}: RegionComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlight, setHighlight] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const filtered = useMemo(() => {
        if (!options) return [];
        const q = search.trim().toLowerCase();
        if (!q) return options;
        return options.filter((o) => o.name.toLowerCase().includes(q));
    }, [options, search]);

    // Tutup saat klik di luar atau tekan Escape di luar input.
    useEffect(() => {
        if (!open) return;
        const onPointerDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    useEffect(() => {
        if (open) {
            setSearch("");
            setHighlight(() => {
                const index = filtered.findIndex((o) => o.code === value?.code);
                return index >= 0 ? index : 0;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        setHighlight(0);
    }, [search]);

    // Item ter-highlight selalu terlihat saat navigasi keyboard.
    useEffect(() => {
        listRef.current
            ?.querySelector(`[data-index="${highlight}"]`)
            ?.scrollIntoView({ block: "nearest" });
    }, [highlight]);

    const pick = (option: RegionOption) => {
        onSelect(option);
        setOpen(false);
    };

    const onInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const option = filtered[highlight];
            if (option) pick(option);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    const triggerText = disabled
        ? disabledPlaceholder ?? "Pilih wilayah di atas dulu"
        : value?.name ?? placeholder;

    return (
        <div ref={containerRef} className="relative">
            <label className="label">
                {label} {requiredMark && <span className="text-crimson">*</span>}
            </label>
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup="listbox"
                className={`input flex items-center justify-between gap-2 text-left text-sm ${
                    disabled ? "cursor-not-allowed bg-light-gray/60 text-body-text/50" : "cursor-pointer"
                }`}
            >
                <span className={`truncate ${!disabled && !value ? "text-body-text/60" : ""}`}>
                    {triggerText}
                </span>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-body-text transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-border-soft bg-white shadow-dropdown">
                    <div className="border-b border-border-soft p-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-body-text/60" />
                            <input
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={onInputKeyDown}
                                placeholder="Cari nama wilayah..."
                                aria-label={`Cari ${label.toLowerCase()}`}
                                className="input py-1.5 pl-9 text-xs"
                            />
                        </div>
                    </div>

                    <ul ref={listRef} role="listbox" aria-label={label} className="max-h-56 overflow-y-auto p-1.5">
                        {loading && (
                            <li className="flex items-center gap-2 px-3 py-3 text-xs text-body-text">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Memuat data wilayah...
                            </li>
                        )}

                        {!loading && filtered.length === 0 && (
                            <li className="flex items-center gap-2 px-3 py-3 text-xs text-body-text/70">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                Tidak ditemukan.
                            </li>
                        )}

                        {!loading &&
                            filtered.map((option, index) => {
                                const selected = option.code === value?.code;
                                return (
                                    <li
                                        key={option.code}
                                        data-index={index}
                                        role="option"
                                        aria-selected={selected}
                                        onMouseEnter={() => setHighlight(index)}
                                        onClick={() => pick(option)}
                                        className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                                            index === highlight ? "bg-navy/5" : ""
                                        } ${selected ? "font-semibold text-navy" : "text-body-dark"}`}
                                    >
                                        <span className="min-w-0 flex-1 truncate">{option.name}</span>
                                        {option.type && (
                                            <span className="shrink-0 rounded-full bg-electric-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">
                                                {option.type}
                                            </span>
                                        )}
                                        {selected && <Check className="h-3.5 w-3.5 shrink-0 text-tech-blue" />}
                                    </li>
                                );
                            })}
                    </ul>
                </div>
            )}

            {error && <p className="form-error">{error}</p>}
        </div>
    );
}
