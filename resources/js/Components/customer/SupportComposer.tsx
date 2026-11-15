import { useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useRef, useState } from 'react';
import { Paperclip, Send, AlertCircle, X } from 'lucide-react';

export interface ComposerService {
    id: number;
    service_name: string;
    package_type: string | null;
}

/**
 * Error internal (mis. validasi `title` yang tidak punya field di UI ini) tidak
 * disebut langsung ke pelanggan, tetapi diganti dengan pesan yang bisa
 * dia pahami cara mengatasinya.
 */
const friendlyError = (key: string, message: string): string => {
    if (key === 'title') {
        return 'Pesan gagal terkirim. Segarkan halaman (atau tutup dan buka lagi) lalu kirim ulang pesan Anda.';
    }
    return message;
};

const topics = [
    { value: 'general_inquiry', label: 'Pertanyaan Umum' },
    { value: 'technical_support', label: 'Bantuan Teknis' },
    { value: 'service_disruption', label: 'Gangguan Layanan' },
    { value: 'maintenance_request', label: 'Perawatan' },
    { value: 'change_request', label: 'Perubahan' },
    { value: 'billing_admin', label: 'Tagihan' },
    { value: 'other', label: 'Lainnya' },
];

/**
 * Kotak tulis pesan tunggal untuk menghubungi tim NDS. Subjek tiket diambil
 * otomatis dari kalimat pertama agar pelanggan tidak perlu mengisi dua field.
 */
export function SupportComposer({
    services = [],
    collapsibleServices = false,
}: {
    services?: ComposerService[];
    collapsibleServices?: boolean;
}) {
    const { data, setData, post, transform, processing, errors, reset } = useForm({
        message: '',
        category: 'general_inquiry',
        customer_service_id: '',
        attachments: [] as File[],
    });
    const fileRef = useRef<HTMLInputElement>(null);
    const [showDetails, setShowDetails] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = data.message.trim();
        if (!trimmed) return;

        // Pengenal unik per upaya kirim; retry/klik ganda dengan kunci yang
        // sama tidak menciptakan pesan kedua di backend.
        const clientKey = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

        transform((currentData) => ({
            ...currentData,
            title: trimmed.split('\n')[0].slice(0, 80),
            message: trimmed,
            client_key: clientKey,
        }));

        post(route('customer.support.store'), {
            forceFormData: true,
            onSuccess: () => {
                setData('message', '');
                setData('attachments', []);
                if (fileRef.current) fileRef.current.value = '';
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-3">
            {Object.keys(errors).length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/90 p-3 text-xs text-red-900">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <div>
                        {Object.entries(errors).map(([key, message]) => (
                            <p key={key}>{friendlyError(key, message)}</p>
                        ))}
                    </div>
                </div>
            )}

            <textarea
                value={data.message}
                onChange={(e) => setData('message', e.target.value)}
                placeholder="Tulis pesan Anda untuk tim NDS..."
                aria-label="Tulis pesan"
                className="input min-h-24 resize-y text-sm"
                required
            />

            {data.attachments.length > 0 && (
                <ul className="flex flex-wrap items-center gap-2">
                    {data.attachments.map((file, i) => (
                        <li
                            key={`${file.name}-${i}`}
                            className="flex items-center gap-2 rounded-md border border-border-soft bg-white px-2.5 py-1 text-xs text-navy"
                        >
                            <span className="max-w-40 truncate">{file.name}</span>
                            <button
                                type="button"
                                onClick={() => setData('attachments', data.attachments.filter((_, j) => j !== i))}
                                className="text-red-700 hover:text-red-900"
                                aria-label={`Hapus ${file.name}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="submit"
                    disabled={processing || !data.message.trim()}
                    className="btn-primary text-xs"
                >
                    <Send className="h-3.5 w-3.5" />
                    <span>{processing ? 'Mengirim...' : 'Kirim'}</span>
                </button>

                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-soft bg-white px-2.5 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy/5"
                >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>Lampiran</span>
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/jpg,application/pdf,.doc,.docx"
                    onChange={(e) => setData('attachments', [...data.attachments, ...Array.from(e.target.files ?? [])])}
                    className="sr-only"
                    aria-label="Pilih berkas lampiran"
                />

                {collapsibleServices ? (
                    <button
                        type="button"
                        onClick={() => setShowDetails((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-body-text transition-colors hover:text-navy"
                        aria-expanded={showDetails}
                    >
                        {showDetails ? 'Sembunyikan detail' : 'Topik & layanan terkait'}
                    </button>
                ) : (
                    <p className="text-[11px] text-body-text/70">JPG, PNG, PDF, DOC, DOCX · maksimal 5 MB per berkas</p>
                )}
            </div>

            {showDetails && (
                <div className="grid gap-3 rounded-lg border border-border-soft bg-white p-3 sm:grid-cols-2">
                    <label className="text-xs">
                        <span className="mb-1 block font-semibold text-navy">Topik</span>
                        <select
                            value={data.category}
                            onChange={(e) => setData('category', e.target.value)}
                            className="input text-xs"
                        >
                            {topics.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="text-xs">
                        <span className="mb-1 block font-semibold text-navy">Layanan terkait</span>
                        {services.length > 0 ? (
                            <select
                                value={data.customer_service_id}
                                onChange={(e) => setData('customer_service_id', e.target.value)}
                                className="input text-xs"
                            >
                                <option value="">Tidak terkait layanan tertentu</option>
                                {services.map((s) => (
                                    <option key={s.id} value={String(s.id)}>
                                        {s.service_name}
                                        {s.package_type ? ` (${s.package_type})` : ''}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p className="rounded-md border border-border-soft bg-light-gray/50 px-3 py-2 text-body-text">
                                Belum ada layanan di akun Anda.
                            </p>
                        )}
                    </label>
                </div>
            )}
        </form>
    );
}
