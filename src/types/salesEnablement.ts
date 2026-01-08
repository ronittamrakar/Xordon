export type ContentType =
    | 'document'
    | 'presentation'
    | 'video'
    | 'case_study'
    | 'one_pager'
    | 'battle_card'
    | 'template'
    | 'other';

export interface SalesContent {
    id: number;
    title: string;
    description?: string;
    content_type: ContentType;
    file_path?: string;
    file_size?: number;
    mime_type?: string;
    external_url?: string;
    thumbnail_path?: string;
    buyer_personas?: string[];
    sales_stages?: string[];
    industries?: string[];
    products?: string[];
    tags?: string[];
    version: number;
    analytics?: {
        views: number;
        downloads: number;
        shares: number;
    };
    created_at: string;
    updated_at: string;
}

export interface SalesPlaybook {
    id: number;
    name: string;
    description?: string;
    category?: string;
    target_persona?: string[];
    applicable_stages?: string[];
    is_published: boolean;
    section_count?: number;
    sections?: PlaybookSection[];
    resources?: PlaybookResource[];
    created_at: string;
    updated_at: string;
}

export type SectionType =
    | 'overview'
    | 'process'
    | 'discovery'
    | 'objections'
    | 'scripts'
    | 'resources'
    | 'metrics'
    | 'custom';

export interface PlaybookSection {
    id: number;
    playbook_id: number;
    section_type: SectionType;
    title: string;
    content?: string;
    order_index: number;
}

export interface PlaybookResource {
    id: number;
    playbook_id: number;
    section_id?: number;
    resource_type: 'content' | 'template' | 'automation' | 'link';
    resource_id?: number;
    resource_url?: string;
    title: string;
}

export type SnippetType = 'email' | 'sms' | 'call_script' | 'meeting_agenda' | 'follow_up';

export interface SalesSnippet {
    id: number;
    snippet_type: SnippetType;
    name: string;
    shortcut?: string;
    content: string;
    variables?: string[];
    category?: string;
    use_count: number;
    created_at: string;
    updated_at: string;
}

export interface BattleCard {
    id: number;
    competitor_name: string;
    competitor_logo?: string;
    competitor_website?: string;
    overview?: string;
    strengths?: string[];
    weaknesses?: string[];
    pricing_info?: string;
    feature_comparison?: Array<{ feature: string; us: string; them: string }>;
    objection_handlers?: Array<{ objection: string; response: string }>;
    win_strategies?: string;
    tags?: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface EnablementAnalytics {
    period: number;
    content: {
        total: number;
        views: number;
        downloads: number;
        shares: number;
    };
    top_content: Array<{
        id: number;
        title: string;
        content_type: ContentType;
        engagement_count: number;
    }>;
    playbooks: {
        total: number;
        published: number;
    };
    snippets: {
        total: number;
        total_uses: number;
    };
    battle_cards: {
        total: number;
    };
}
