export interface ServiceItem {
    id: number;
    name: string;
    slug: string;
    icon?: string | null;
    image?: string | null;
    short_description?: string | null;
    content?: string | null;
    benefits?: string | null;
    scope?: string | null;
    workflow?: string | null;
    faq?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    is_featured?: boolean;
    is_published?: boolean;
    sort_order?: number;
    layout_size?: 'large' | 'wide' | 'tall' | 'small' | null;
    // Hero halaman layanan (dikelola developer lewat preset/service_sections).
    hero_title?: string | null;
    hero_description?: string | null;
    hero_layout?: 'full' | 'split' | null;
    hero_cta_text?: string | null;
    hero_cta_url?: string | null;
    hero_secondary_cta_text?: string | null;
    hero_secondary_cta_url?: string | null;
    sections?: ServiceSectionData[];
    service_category_id?: number;
    category?: { id: number; name: string; slug: string };
    created_at?: string;
    updated_at?: string;
}

export type ServiceSectionStyle =
    | 'cards'
    | 'columns'
    | 'rows'
    | 'compact_cards'
    | 'numbered_rows'
    | 'numbered_columns'
    | 'numbered';

export type ServiceSectionEntry = {
    title?: string | null;
    description?: string | null;
    icon?: string | null;
    question?: string | null;
    answer?: string | null;
};

export type ServiceSectionStep = {
    title: string;
    description?: string | null;
};

export type ServiceSectionPayload = {
    paragraphs?: string[];
    items?: ServiceSectionEntry[];
    steps?: ServiceSectionStep[];
    columns?: number;
    style?: ServiceSectionStyle;
    orientation?: 'horizontal' | 'vertical';
    show_image?: boolean;
    caption?: string | null;
    cta_text?: string | null;
    cta_url?: string | null;
    secondary_cta_text?: string | null;
    secondary_cta_url?: string | null;
};

// Type alias (bukan interface) agar muat ke payload Inertia router.put/post.
export type ServiceSectionData = {
    id: number;
    type: string;
    title?: string | null;
    description?: string | null;
    layout_variant?: string | null;
    payload?: ServiceSectionPayload | null;
    image?: string | null;
    sort_order?: number;
    is_visible?: boolean;
};

export interface PromoItem {
    id: number;
    title: string;
    slug: string;
    description?: string | null;
    image?: string | null;
    service_category_id?: number | null;
    category?: { id: number; name: string; slug: string } | null;
    discount_type?: "none" | "percentage" | "fixed" | "special_price";
    original_price?: number | null;
    discount_percentage?: number | null;
    discount_amount?: number | null;
    final_price?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    cta_text?: string | null;
    cta_url?: string | null;
    is_active?: boolean;
    show_on_home?: boolean;
    is_featured?: boolean;
    sort_order?: number;
    computed_status?: "active" | "scheduled" | "expired" | "inactive";
    created_at?: string;
    updated_at?: string;
}

export interface ArticleCategory {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    articles_count?: number;
}

export interface ArticleItem {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    content?: string | null;
    image?: string | null;
    author?: string | null;
    is_published?: boolean;
    published_at?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    article_category_id?: number | null;
    category?: ArticleCategory | null;
}

export interface ProjectItem {
    id: number;
    title: string;
    slug: string;
    category?: string | null;
    description?: string | null;
    thumbnail?: string | null;
    client?: string | null;
    sort_order?: number;
    is_published?: boolean;
}

export interface ContactMessageItem {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    subject?: string | null;
    message: string;
    status: "unread" | "read" | "replied";
    source?: string;
    tawk_chat_id?: string | null;
    created_at: string;
}

export interface CompanySettings {
    company_name?: string | null;
    company_tagline?: string | null;
    company_description?: string | null;
    footer_description?: string | null;
    logo_path?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    contact_whatsapp?: string | null;
    contact_address?: string | null;
    facebook?: string | null;
    instagram?: string | null;
    linkedin?: string | null;
    youtube?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
    // Konten Beranda (Homepage)
    hero_eyebrow?: string | null;
    hero_title?: string | null;
    hero_subtitle?: string | null;
    hero_description?: string | null;
    hero_cta_text?: string | null;
    hero_cta_url?: string | null;
    hero_secondary_cta_text?: string | null;
    hero_secondary_cta_url?: string | null;
    hero_tagline?: string | null;
    hero_bg_image?: string | null;
    // Background Halaman Detail Layanan (per kategori)
    service_bg_application?: string | null;
    service_bg_solution?: string | null;
    // Visibilitas Section
    show_coverage_section?: string | null;
    show_services_section?: string | null;
    show_targets_section?: string | null;
    show_promos_section?: string | null;
    show_articles_section?: string | null;
    show_cta_section?: string | null;
    // Susunan footer publik (tersimpan di database sebagai string JSON)
    footer_nav_links?: string | null;
    footer_service_ids?: string | null;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface SharedPageProps {
    auth?: { user: { id: number; name: string; email: string } | null };
    settings?: CompanySettings;
    flash?: { success?: string; error?: string };
}
