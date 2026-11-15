import { Head, Link, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import SupportChat from '@/Components/support/SupportChat';
import type { ChatMessage } from '@/Components/support/types';
import { useTicketRealtime, useTicketPresence } from '@/Components/support/useTicketRealtime';

interface TicketThread {
    id: number;
    ticket_number: string;
    title: string;
    category_label: string;
    status: string;
    status_label: string;
    status_color: string;
    priority_label: string;
    priority_color: string;
    created_at: string;
    customer_service?: { id: number; service_name: string; package_type: string | null } | null;
    messages: ChatMessage[];
}

interface Props {
    ticket: TicketThread;
}

const statusBadge: Record<string, string> = {
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    danger: 'badge badge-danger',
    info: 'badge badge-secondary',
    secondary: 'badge badge-neutral',
};

export default function SupportShow({ ticket }: Props) {
    const closed = ticket.status === 'closed' || ticket.status === 'resolved';

    // Realtime via Reverb: balasan admin, typing admin, dan Read muncul
    // tanpa refresh halaman.
    const { messages, opponentTyping, sendTypingSignal } = useTicketRealtime({
        ticketId: ticket.id,
        myRole: 'customer',
        initialMessages: ticket.messages,
    });
    const { opponentOnline } = useTicketPresence(ticket.id, 'customer');

    // Pelanggan hanya melihat balasan admin; catatan internal admin
    // tidak pernah ditampilkan di sini.
    const visibleMessages = messages.filter((m) => !m.is_internal);

    // Balasan memakai endpoint customer.support.reply yang sudah ada:
    // lampiran multipart + validasi tetap di backend.
    const replyForm = useForm({ message: '', attachments: [] as File[] });
    const [lastPayload, setLastPayload] = useState<{ message: string; attachments: File[] } | null>(null);

    const submitReply = (payload: { message: string; attachments: File[] }) => {
        setLastPayload({ message: payload.message, attachments: payload.attachments });
        replyForm.transform(() => ({ message: payload.message, attachments: payload.attachments }));
        replyForm.post(route('customer.support.reply', ticket.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setLastPayload(null);
                replyForm.setData('attachments', []);
            },
        });
    };

    const retryLast = () => {
        if (!lastPayload) return;
        submitReply({ message: lastPayload.message, attachments: lastPayload.attachments });
    };

    const closeTicket = () => {
        router.patch(
            route('customer.support.close', ticket.id),
            {},
            { preserveScroll: true },
        );
    };

    // Nama lawan bicara pada percakapan: petugas admin NDS pertama yang
    // membalas, atau label generik saat belum ada balasan.
    const adminMessage = [...visibleMessages].reverse().find((m) => m.user?.role === 'admin');
    const opponentName = adminMessage?.user?.name ?? 'Tim NDS';

    return (
        <CustomerLayout title="Support Chat">
            <Head title={`Support Chat | NDS Customer Portal`} />

            <div className="mb-4">
                <Link
                    href={route('customer.support.index')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-tech-blue hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Daftar Percakapan
                </Link>
            </div>

            <div className="flex h-[38rem] flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono text-body-text/80">{ticket.ticket_number}</span>
                    <span className={statusBadge[ticket.status_color] || statusBadge.secondary}>
                        {ticket.status_label}
                    </span>
                    {ticket.customer_service && (
                        <span className="text-body-text">· {ticket.customer_service.service_name}</span>
                    )}
                    {!closed && (
                        <button
                            type="button"
                            onClick={closeTicket}
                            className="ml-auto rounded-md border border-border-soft px-2.5 py-1 text-[11px] font-semibold text-red-900 hover:bg-red-50"
                        >
                            Tutup percakapan
                        </button>
                    )}
                </div>

                <SupportChat
                    messages={visibleMessages}
                    myRole="customer"
                    opponent={{ id: adminMessage?.user?.id ?? 0, name: opponentName }}
                    opponentOnline={opponentOnline}
                    opponentTyping={opponentTyping}
                    closed={closed}
                    onSend={(p) => submitReply({ message: p.message, attachments: p.attachments })}
                    onTyping={sendTypingSignal}
                    sending={replyForm.processing}
                    sendError={
                        Object.keys(replyForm.errors).length > 0
                            ? 'Pesan gagal terkirim. Periksa isi pesan lalu coba kirim ulang.'
                            : null
                    }
                    onRetry={lastPayload ? retryLast : undefined}
                />
            </div>
        </CustomerLayout>
    );
}
