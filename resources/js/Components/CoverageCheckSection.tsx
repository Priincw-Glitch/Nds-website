import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import axios from "axios";
import {
    MapPin,
    Search,
    Clock,
    AlertCircle,
    CheckCircle2,
    Wifi,
    Server,
    Video,
    Cpu,
    Loader2,
    RefreshCw,
    Send,
} from "lucide-react";import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Button } from "@/Components/ui/button";
import { waNumber } from "@/utils/waLink";
import type { CompanySettings } from "@/types";

interface CoverageCheckSectionProps {
    settings?: CompanySettings;
    coverageServices?: string[];
}

interface CoverageResult {
    found: boolean;
    status: "available" | "development" | "unavailable" | "unverified";
    status_label?: string;
    title: string;
    area_name?: string;
    city?: string;
    district?: string;
    province?: string;
    service_name?: string;
    notes?: string;
    message: string;
    is_verified: boolean;
    location?: string;
}

// Satu baris saran lokasi dari /coverage/suggestions. `covered` berisi status
// cakupan terverifikasi bila lokasi ada di data Cakupan Wilayah Admin.
interface LocationSuggestion {
    label: string;
    district?: string | null;
    province?: string | null;
    covered?: "available" | "development" | "unavailable" | null;
}

// Posisi dropdown dihitung terhadap viewport, bukan terhadap search bar,
// karena dropdown dirender lewat portal di luar section.
interface DropdownPlacement {
    top: number;
    left: number;
    width: number;
    maxHeight: number;
}

const DROPDOWN_EDGE_GAP = 8;
const DROPDOWN_MAX_HEIGHT = 288;

// Ikon hanya penanda jenis layanan, dipilih dari kata kunci nama layanan yang
// dikelola Admin, supaya opsi tetap terbaca saat daftar layanan berubah.
function serviceIconFor(label: string) {
    const text = label.toLowerCase();
    if (text.includes("cctv") || text.includes("kamera")) return Video;
    if (text.includes("server")) return Server;
    if (text.includes("jaringan") || text.includes("network") || text.includes("internet") || text.includes("wifi")) return Wifi;
    return Cpu;
}

const globeDots: CSSProperties = {
    backgroundImage: "radial-gradient(rgba(77,166,248,0.28) 1.5px, transparent 1.6px)",
    backgroundSize: "16px 16px",
    WebkitMaskImage: "radial-gradient(circle closest-side, #000 76%, transparent 100%)",
    maskImage: "radial-gradient(circle closest-side, #000 76%, transparent 100%)",
};

export function CoverageCheckSection({ settings, coverageServices = [] }: CoverageCheckSectionProps) {
    const serviceOptions = useMemo(() => {
        const managed = coverageServices.filter((name) => Boolean(name && name.trim()));
        return ["Semua Layanan NDS", ...managed];
    }, [coverageServices]);

    const [location, setLocation] = useState("");
    const [selectedService, setSelectedService] = useState(serviceOptions[0]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CoverageResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    // Respons axios bisa datang setelah pengunjung pindah halaman; jangan
    // sentuh state komponen yang sudah lepas.
    const aliveRef = useRef(true);
    useEffect(() => {
        aliveRef.current = true;
        return () => {
            aliveRef.current = false;
        };
    }, []);

    // Autocomplete lokasi: debounce 250ms, request lama dibatalkan lewat
    // AbortController supaya tidak menimpa hasil ketikan yang lebih baru.
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [suggestOpen, setSuggestOpen] = useState(false);
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const suggestBoxRef = useRef<HTMLDivElement>(null);
    const suggestListRef = useRef<HTMLDivElement>(null);
    const suggestAbortRef = useRef<AbortController | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    // Setelah kota dipilih, `location` berubah dan effect pencarian saran akan
    // berjalan lagi. Tanpa penanda ini, dropdown terbuka kembali menutupi
    // kartu hasil yang baru saja dimuat.
    const skipSuggestFetchRef = useRef(false);

    // Dropdown tetap ter-mount sebentar setelah ditutup supaya animasi keluar
    // sempat berjalan, lalu dilepas dari DOM.
    const [suggestMounted, setSuggestMounted] = useState(false);
    const [suggestPlacement, setSuggestPlacement] = useState<DropdownPlacement | null>(null);

    useEffect(() => {
        if (suggestOpen) {
            setSuggestMounted(true);
            return;
        }
        const timer = window.setTimeout(() => setSuggestMounted(false), 140);
        return () => window.clearTimeout(timer);
    }, [suggestOpen]);

    useEffect(() => {
        const query = location.trim();

        if (skipSuggestFetchRef.current) {
            skipSuggestFetchRef.current = false;
            setSuggestions([]);
            setSuggestOpen(false);
            setSuggestLoading(false);
            return;
        }

        if (query.length < 2) {
            setSuggestions([]);
            setSuggestOpen(false);
            setSuggestLoading(false);
            return;
        }

        setSuggestLoading(true);
        const timer = window.setTimeout(() => {
            suggestAbortRef.current?.abort();
            const controller = new AbortController();
            suggestAbortRef.current = controller;

            axios
                .get("/coverage/suggestions", { params: { q: query }, signal: controller.signal })
                .then((response) => {
                    if (controller.signal.aborted) return;
                    setSuggestions(response.data.suggestions ?? []);
                    setActiveIndex(-1);
                    setSuggestOpen(true);
                    setSuggestLoading(false);
                })
                .catch(() => {
                    if (controller.signal.aborted) return;
                    // Gagal mengambil saran: dropdown ditutup, pengecekan manual tetap jalan.
                    setSuggestions([]);
                    setSuggestOpen(false);
                    setSuggestLoading(false);
                });
        }, 250);

        return () => window.clearTimeout(timer);
    }, [location]);

    useEffect(() => {
        return () => {
            suggestAbortRef.current?.abort();
        };
    }, []);

    // Dropdown menutup saat klik di luar kotak pencarian, di luar dropdown, atau
    // saat menekan Escape. Dropdown berada di portal, jadi pemeriksaannya
    // mencakup dua node, bukan hanya pembungkus input.
    useEffect(() => {
        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Node;
            const insideInput = suggestBoxRef.current?.contains(target);
            const insideDropdown = suggestListRef.current?.contains(target);
            if (!insideInput && !insideDropdown) setSuggestOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape" || !suggestOpen) return;
            setSuggestOpen(false);
            if (suggestListRef.current?.contains(document.activeElement)) {
                inputRef.current?.focus();
            }
        };
        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [suggestOpen]);

    // Posisi dropdown dihitung dari kotak input: tepat di bawahnya, selebar
    // search bar, dan tingginya dibatasi ruang yang masih terlihat. Saat
    // keyboard mobile terbuka, visualViewport menyusut sehingga batas tinggi
    // ikut mengecil dan dropdown tidak tenggelam di balik keyboard.
    const updateSuggestPlacement = useCallback(() => {
        const anchor = suggestBoxRef.current;
        if (!anchor) return;

        const rect = anchor.getBoundingClientRect();
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
        const viewportWidth = document.documentElement.clientWidth;
        const width = Math.min(rect.width, viewportWidth - DROPDOWN_EDGE_GAP * 2);
        const left = Math.min(
            Math.max(rect.left, DROPDOWN_EDGE_GAP),
            Math.max(viewportWidth - width - DROPDOWN_EDGE_GAP, DROPDOWN_EDGE_GAP)
        );
        const roomBelow = viewportHeight - rect.bottom - DROPDOWN_EDGE_GAP * 2;

        setSuggestPlacement({
            top: rect.bottom + DROPDOWN_EDGE_GAP,
            left,
            width,
            maxHeight: Math.round(
                Math.max(96, Math.min(DROPDOWN_MAX_HEIGHT, roomBelow))
            ),
        });
    }, []);

    useLayoutEffect(() => {
        if (!suggestOpen) return;
        updateSuggestPlacement();
    }, [suggestOpen, suggestions, updateSuggestPlacement]);

    // Ikuti scroll halaman dan perubahan ukuran viewport/keyboard selama
    // dropdown terbuka, dengan rAF agar pengukuran tidak menumpuk.
    useEffect(() => {
        if (!suggestOpen) return;

        let frame = 0;
        const schedule = () => {
            if (frame) return;
            frame = window.requestAnimationFrame(() => {
                frame = 0;
                updateSuggestPlacement();
            });
        };

        window.addEventListener("scroll", schedule, true);
        window.addEventListener("resize", schedule);
        window.visualViewport?.addEventListener("resize", schedule);
        window.visualViewport?.addEventListener("scroll", schedule);

        return () => {
            if (frame) window.cancelAnimationFrame(frame);
            window.removeEventListener("scroll", schedule, true);
            window.removeEventListener("resize", schedule);
            window.visualViewport?.removeEventListener("resize", schedule);
            window.visualViewport?.removeEventListener("scroll", schedule);
        };
    }, [suggestOpen, updateSuggestPlacement]);

    // Opsi yang digerakkan dengan panah keyboard ikut digulir ke area terlihat.
    useEffect(() => {
        if (!suggestOpen || activeIndex < 0) return;
        document
            .getElementById(`coverage-suggestion-${activeIndex}`)
            ?.scrollIntoView({ block: "nearest" });
    }, [activeIndex, suggestOpen]);

    const runCheck = async (rawLocation: string, service: string) => {
        const trimmed = rawLocation.trim();
        if (!trimmed || trimmed.length < 2) {
            setError("Silakan masukkan nama kota, kecamatan, atau area lokasi Anda.");
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const response = await axios.post("/coverage/check", {
                location: trimmed,
                service,
            });
            if (aliveRef.current) setResult(response.data);
        } catch (err: any) {
            if (aliveRef.current) setResult({
                found: false,
                status: "unverified",
                title: "Konfirmasi Langsung Bersama Tim Teknis",
                message:
                    "Pengecekan otomatis belum terindeks untuk query ini. Tim kami siap mengonfirmasi ketersediaan di lokasi Anda secara langsung.",
                is_verified: false,
            });
        } finally {
            if (aliveRef.current) setLoading(false);
        }
    };

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        await runCheck(location, selectedService);
    };

    // Memilih saran mengisi input dengan nama kota dan langsung menjalankan
    // pengecekan jangkauan untuk kota tersebut.
    const selectSuggestion = (item: LocationSuggestion) => {
        skipSuggestFetchRef.current = true;
        setSuggestOpen(false);
        setLocation(item.label);
        setSuggestions([]);
        setActiveIndex(-1);
        void runCheck(item.label, selectedService);
    };

    const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!suggestOpen || suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, -1));
        } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            selectSuggestion(suggestions[activeIndex]);
        }
    };

    const handleReset = () => {
        setResult(null);
        setError(null);
        setLocation("");
    };

    const hasWhatsApp = waNumber(settings?.contact_whatsapp || settings?.contact_phone) !== "";

    const getWhatsAppUrl = () => {
        const phone = settings?.contact_whatsapp || settings?.contact_phone || "";
        const number = waNumber(phone);

        if (number) {
            const textMessage = encodeURIComponent(
                `Halo Tim NDS, saya ingin konsultasi mengenai ketersediaan ${selectedService} di wilayah "${location.trim()}". Mohon informasi jangkauan dan spesifikasi teknisnya.`
            );
            return `https://wa.me/${number}?text=${textMessage}`;
        }
        return route("contact");
    };

    return (
        <section id="coverage" className="relative bg-navy text-white overflow-hidden">
            {/* Ambient Tech Light Ornaments */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                    style={globeDots}
                    className="absolute -top-72 left-1/2 h-[860px] w-[860px] -translate-x-[32%] rounded-full"
                />
                <div
                    style={globeDots}
                    className="absolute -bottom-44 -left-40 h-[440px] w-[440px] rounded-full opacity-70"
                />
            </div>

            <div className="container-nds relative z-10 pt-20 pb-16 lg:pt-24">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="gsap-reveal text-3xl font-extrabold leading-tight tracking-[-0.02em] text-white sm:text-4xl lg:text-[3.25rem]">
                        Cek Jangkauan Layanan NDS di Wilayah Anda
                    </h2>
                </div>

                <form onSubmit={handleCheck} className="gsap-reveal mx-auto mt-10 flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Search Input Lokasi + Autocomplete */}
                    <div
                        ref={suggestBoxRef}
                        className="relative flex h-12 w-full min-w-0 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 transition-colors focus-within:border-electric-light focus-within:bg-white/15 focus-within:ring-2 focus-within:ring-electric-light/30 hover:border-white/35 sm:w-auto sm:flex-1 sm:gap-2.5 sm:px-4"
                    >
                        <Search className="h-5 w-5 shrink-0 text-electric-light" aria-hidden="true" />
                        <label htmlFor="coverage-location" className="sr-only">
                            Masukkan alamat atau nama wilayah
                        </label>
                        <input
                            id="coverage-location"
                            type="text"
                            value={location}
                            onChange={(e) => {
                                setLocation(e.target.value);
                                if (error) setError(null);
                            }}
                            onFocus={() => {
                                if (suggestions.length > 0) setSuggestOpen(true);
                            }}
                            onKeyDown={onInputKeyDown}
                            ref={inputRef}
                            role="combobox"
                            aria-expanded={suggestOpen}
                            aria-controls="coverage-suggestions"
                            aria-autocomplete="list"
                            aria-activedescendant={suggestOpen && activeIndex >= 0 ? `coverage-suggestion-${activeIndex}` : undefined}
                            autoComplete="off"
                            enterKeyHint="search"
                            placeholder="Contoh: SCBD Jakarta, Cikarang, Bandung, Surabaya..."
                            className="w-full min-w-0 bg-transparent text-base leading-6 text-white placeholder:text-white/60 focus:outline-none sm:text-sm"
                            disabled={loading}
                        />
                        {suggestLoading && (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-electric-light" aria-hidden="true" />
                        )}
                    </div>

                    {/* Dropdown saran kota dirender lewat portal ke <body>.
                        Section pembungkus memakai `overflow-hidden` dan form
                        mendapat `transform` dari animasi GSAP; keduanya membuat
                        dropdown ber-z-index tinggi tetap terpotong atau kalah
                        dari kartu hasil di bawahnya bila dirender di tempat.
                        Portal melepaskannya dari stacking context tersebut,
                        lalu posisinya dihitung dari kotak input. */}
                    {suggestMounted &&
                        suggestPlacement &&
                        createPortal(
                            <div
                                id="coverage-suggestions"
                                ref={suggestListRef}
                                role="listbox"
                                aria-label="Saran lokasi"
                                style={{
                                    position: "fixed",
                                    top: suggestPlacement.top,
                                    left: suggestPlacement.left,
                                    width: suggestPlacement.width,
                                    zIndex: "var(--layer-dropdown, 60)",
                                }}
                                className={`overflow-hidden rounded-xl border border-border-soft bg-white text-navy shadow-dropdown ${
                                    suggestOpen ? "nds-dropdown" : "nds-dropdown-out"
                                }`}
                            >
                                <ul
                                    className="overflow-y-auto overscroll-contain p-1.5"
                                    style={{ maxHeight: suggestPlacement.maxHeight }}
                                >
                                    {suggestions.length === 0 && !suggestLoading && (
                                        <li className="px-3 py-3 text-sm text-body-text" aria-live="polite">
                                            Tidak ada kota yang cocok dengan &ldquo;{location.trim()}&rdquo;.
                                        </li>
                                    )}
                                    {suggestions.map((item, index) => {
                                        const isActive = index === activeIndex;
                                        const subLabel = [item.district, item.province].filter(Boolean).join(", ");

                                        return (
                                            <li
                                                key={`${item.label}-${item.district ?? ""}-${index}`}
                                                id={`coverage-suggestion-${index}`}
                                                role="option"
                                                aria-selected={isActive}
                                            >
                                                <button
                                                    type="button"
                                                    tabIndex={-1}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => selectSuggestion(item)}
                                                    onMouseEnter={() => setActiveIndex(index)}
                                                    className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                                                        isActive ? "bg-light-blue" : "hover:bg-light-gray"
                                                    }`}
                                                >
                                                    <span className="flex min-w-0 items-center gap-2.5">
                                                        <MapPin className="h-4 w-4 shrink-0 text-tech-blue" aria-hidden="true" />
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-sm font-semibold text-navy">
                                                                {item.label}
                                                            </span>
                                                            {subLabel && (
                                                                <span className="block truncate text-xs text-body-text">
                                                                    {subLabel}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </span>
                                                    {item.covered && (
                                                        <span
                                                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                                                item.covered === "available"
                                                                    ? "bg-success/10 text-success"
                                                                    : item.covered === "development"
                                                                      ? "bg-warning/15 text-navy"
                                                                      : "bg-light-gray text-body-text"
                                                            }`}
                                                        >
                                                            {item.covered === "available"
                                                                ? "Tersedia"
                                                                : item.covered === "development"
                                                                  ? "Pengembangan"
                                                                  : "Belum"}
                                                        </span>
                                                    )}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>,
                            document.body
                        )}

                    {/* shadcn/ui Select for Services */}
                    <div className="w-full sm:w-64">
                        <Select value={selectedService} onValueChange={(val) => setSelectedService(val)}>
                            <SelectTrigger className="h-12 w-full select-none border-white/20 bg-white/10 text-white hover:border-white/35 hover:bg-white/15 focus:ring-electric-light">
                                <SelectValue placeholder="Pilih Jenis Layanan" />
                            </SelectTrigger>
                            {/* Panel mengikuti lebar konten — perilaku kini berasal
                                dari ui/select.tsx secara global. */}
                            <SelectContent>
                                {serviceOptions.map((label) => {
                                    const Icon = serviceIconFor(label);
                                    return (
                                        <SelectItem key={label} value={label}>
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4 text-tech-blue shrink-0" />
                                                <span>{label}</span>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tombol Aksi Utama */}
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={loading}
                        className="h-12 w-full flex-none px-7 sm:w-auto font-bold"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                <span>Memeriksa...</span>
                            </>
                        ) : (
                            <span>Cek Ketersediaan</span>
                        )}
                    </Button>
                </form>

                {error && (
                    <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-300">
                        <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{error}</span>
                    </p>
                )}

                {/* Area Hasil Pengecekan */}
                {result && (
                    <div className="mx-auto mt-8 max-w-4xl">
                        <div className="flex items-center justify-between gap-4 mb-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-white/90">
                                Hasil Analisis Jangkauan:
                            </p>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-electric-light hover:underline cursor-pointer"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Periksa Wilayah Lain</span>
                            </button>
                        </div>

                        <div className="rounded-2xl border border-white/20 bg-white/95 p-6 sm:p-8 text-navy shadow-2xl backdrop-blur-md">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-soft">
                                <div className="flex items-center gap-3.5">
                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                                            result.status === "available"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : result.status === "development"
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-tech-blue/10 text-tech-blue"
                                        }`}
                                    >
                                        {result.status === "available" ? (
                                            <CheckCircle2 className="h-6 w-6" />
                                        ) : result.status === "development" ? (
                                            <Clock className="h-6 w-6" />
                                        ) : (
                                            <MapPin className="h-6 w-6" />
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-tech-blue">
                                            {selectedService}
                                        </span>
                                        <h3 className="text-lg font-bold text-navy sm:text-xl">
                                            {result.title}
                                        </h3>
                                    </div>
                                </div>

                                <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                                        result.status === "available"
                                            ? "badge-success"
                                            : result.status === "development"
                                            ? "badge-warning"
                                            : "badge-secondary"
                                    }`}
                                >
                                    {result.status_label || (result.status === "available" ? "Tersedia" : "Dalam Verifikasi")}
                                </span>
                            </div>

                            <p className="mt-5 text-sm sm:text-base leading-relaxed text-body-text">
                                {result.message}
                            </p>

                            {/* Satu tindak lanjut saja. Bila nomor WhatsApp tersedia,
                                tombol membuka chat; bila tidak, tombol menuju formulir. */}
                            <div className="mt-6 border-t border-border-soft pt-4">
                                {hasWhatsApp ? (
                                    <a
                                        href={getWhatsAppUrl()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold"
                                    >
                                        <Send className="h-4 w-4" />
                                        <span>Konsultasikan via WhatsApp</span>
                                    </a>
                                ) : (
                                    <Link
                                        href={route("contact")}
                                        className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold"
                                    >
                                        <span>Konsultasikan Wilayah Ini</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
