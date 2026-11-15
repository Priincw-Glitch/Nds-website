/**
 * Tipe bersama untuk permukaan chat Support (Admin & Customer).
 */
export interface ChatAttachment {
    id: number;
    original_filename: string;
    file_size: number;
    path: string;
}

export interface ChatMessage {
    id: number;
    message: string;
    is_internal: boolean;
    is_read: boolean;
    delivered_at: string | null;
    read_at: string | null;
    created_at: string;
    user: { id: number; name: string; role: string } | null;
    attachments: ChatAttachment[];
}

export interface OpponentProfile {
    id: number;
    name: string;
}

/**
 * Ringkasan satu percakapan untuk panel kiri gaya WhatsApp:
 * dipakai bersama oleh Admin (channel admin.support) dan Customer.
 */
export interface ConversationSummary {
    id: number;
    ticket_number: string;
    title: string;
    status_label: string;
    status_color: string;
    last_message_preview: string | null;
    last_message_at: string | null;
    last_actor_role: string | null;
    unread_count: number;
    href: string;
}
