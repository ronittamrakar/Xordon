/**
 * QR Code API
 * Generate QR codes for various use cases
 */

import { api } from '@/lib/api';

// ============================================
// TYPES
// ============================================

export type QRCodeType =
    | 'booking_page'
    | 'review_request'
    | 'payment_link'
    | 'contact_card'
    | 'website'
    | 'form'
    | 'custom_url'
    | 'phone'
    | 'sms'
    | 'email'
    | 'wifi';

export interface QRCode {
    id: string;
    workspace_id: string;
    type: QRCodeType;
    name: string;
    url: string;
    short_url?: string;

    // Customization
    style: QRCodeStyle;

    // Linked entity
    entity_id?: string;
    entity_type?: string;

    // Analytics
    scan_count: number;
    last_scanned_at?: string;

    // Output
    image_url: string;
    svg_url: string;

    created_at: string;
    updated_at: string;
}

export interface QRCodeStyle {
    size: number;
    margin: number;
    format: 'png' | 'svg' | 'pdf';

    // Colors
    foreground_color: string;
    background_color: string;

    // Logo
    logo_url?: string;
    logo_size?: number;
    logo_margin?: number;

    // Style variations
    dot_style: 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded';
    corner_style: 'square' | 'extra-rounded';
    corner_dot_style: 'dot' | 'square';

    // Frame
    frame?: {
        style: 'bottom' | 'top' | 'left' | 'right' | 'box';
        text: string;
        font?: string;
        text_color?: string;
    };
}

export interface QRCodeScan {
    id: string;
    qr_code_id: string;
    scanned_at: string;
    device_type?: 'mobile' | 'tablet' | 'desktop';
    os?: string;
    browser?: string;
    location?: {
        city?: string;
        country?: string;
    };
    referrer?: string;
}

export interface QRCodeAnalytics {
    qr_code_id: string;
    total_scans: number;
    unique_scans: number;
    scans_by_date: { date: string; count: number }[];
    scans_by_device: { device: string; count: number }[];
    scans_by_location: { location: string; count: number }[];
}

// ============================================
// QR CODE CRUD
// ============================================

/**
 * Generate a new QR code
 */
export async function generateQRCode(data: {
    type: QRCodeType;
    name: string;
    url?: string; // for custom_url type
    entity_id?: string; // for other types
    style?: Partial<QRCodeStyle>;
    // Type-specific data
    data?: {
        // For phone/sms
        phone_number?: string;
        sms_body?: string;
        // For email
        email?: string;
        subject?: string;
        body?: string;
        // For wifi
        ssid?: string;
        password?: string;
        encryption?: 'WPA' | 'WEP' | 'nopass';
        // For contact_card (vCard)
        vcard?: {
            first_name: string;
            last_name: string;
            phone?: string;
            email?: string;
            company?: string;
            title?: string;
            website?: string;
            address?: string;
        };
    };
}): Promise<QRCode> {
    const response = await api.post('/qr-codes', data);
    return response;
}

/**
 * List all QR codes
 */
export async function listQRCodes(params?: {
    type?: QRCodeType;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<{ data: QRCode[]; total: number; page: number }> {
    const response = await api.get('/qr-codes', { params });
    return response;
}

/**
 * Get a specific QR code
 */
export async function getQRCode(id: string): Promise<QRCode> {
    const response = await api.get(`/qr-codes/${id}`);
    return response;
}

/**
 * Update QR code (name and style only - URL cannot be changed)
 */
export async function updateQRCode(
    id: string,
    data: { name?: string; style?: Partial<QRCodeStyle> }
): Promise<QRCode> {
    const response = await api.put(`/qr-codes/${id}`, data);
    return response;
}

/**
 * Delete a QR code
 */
export async function deleteQRCode(id: string): Promise<void> {
    await api.delete(`/qr-codes/${id}`);
}

/**
 * Regenerate QR code image with new style
 */
export async function regenerateImage(
    id: string,
    style?: Partial<QRCodeStyle>
): Promise<QRCode> {
    const response = await api.post(`/qr-codes/${id}/regenerate`, { style });
    return response;
}

// ============================================
// QUICK GENERATE (no persistence)
// ============================================

/**
 * Generate a QR code image without saving
 */
export async function quickGenerate(data: {
    content: string;
    style?: Partial<QRCodeStyle>;
    format?: 'png' | 'svg' | 'base64';
}): Promise<{
    image_data: string; // URL or base64
    format: string;
}> {
    const response = await api.post('/qr-codes/quick', data);
    return response;
}

// ============================================
// ENTITY-SPECIFIC GENERATORS
// ============================================

/**
 * Generate QR code for a booking page
 */
export async function generateForBookingPage(
    bookingPageId: string,
    name?: string,
    style?: Partial<QRCodeStyle>
): Promise<QRCode> {
    const response = await api.post('/qr-codes/booking-page', {
        booking_page_id: bookingPageId,
        name,
        style,
    });
    return response;
}

/**
 * Generate QR code for a review request
 */
export async function generateForReviewRequest(
    platform?: 'google' | 'facebook' | 'yelp',
    name?: string,
    style?: Partial<QRCodeStyle>
): Promise<QRCode> {
    const response = await api.post('/qr-codes/review', {
        platform,
        name,
        style,
    });
    return response;
}

/**
 * Generate QR code for a form
 */
export async function generateForForm(
    formId: string,
    name?: string,
    style?: Partial<QRCodeStyle>
): Promise<QRCode> {
    const response = await api.post('/qr-codes/form', {
        form_id: formId,
        name,
        style,
    });
    return response;
}

/**
 * Generate QR code for a payment link
 */
export async function generateForPaymentLink(
    paymentLinkId: string,
    name?: string,
    style?: Partial<QRCodeStyle>
): Promise<QRCode> {
    const response = await api.post('/qr-codes/payment', {
        payment_link_id: paymentLinkId,
        name,
        style,
    });
    return response;
}

/**
 * Generate QR code for a website
 */
export async function generateForWebsite(
    websiteId: string,
    name?: string,
    style?: Partial<QRCodeStyle>
): Promise<QRCode> {
    const response = await api.post('/qr-codes/website', {
        website_id: websiteId,
        name,
        style,
    });
    return response;
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Get QR code analytics
 */
export async function getAnalytics(
    id: string,
    params?: { date_from?: string; date_to?: string }
): Promise<QRCodeAnalytics> {
    const response = await api.get(`/qr-codes/${id}/analytics`, { params });
    return response;
}

/**
 * Get scan history
 */
export async function getScanHistory(
    id: string,
    params?: { page?: number; limit?: number }
): Promise<{ data: QRCodeScan[]; total: number }> {
    const response = await api.get(`/qr-codes/${id}/scans`, { params });
    return response;
}

/**
 * Get aggregated analytics for all QR codes
 */
export async function getOverallAnalytics(params?: {
    date_from?: string;
    date_to?: string;
}): Promise<{
    total_qr_codes: number;
    total_scans: number;
    scans_by_type: { type: QRCodeType; count: number }[];
    top_performing: { id: string; name: string; scans: number }[];
    scans_trend: { date: string; count: number }[];
}> {
    const response = await api.get('/qr-codes/analytics/overview', { params });
    return response;
}

// ============================================
// DOWNLOAD
// ============================================

/**
 * Download QR code in specific format
 */
export async function downloadQRCode(
    id: string,
    format: 'png' | 'svg' | 'pdf',
    size?: number
): Promise<{ download_url: string }> {
    const response = await api.get(`/qr-codes/${id}/download`, {
        params: { format, size },
    });
    return response;
}

/**
 * Download QR code as print-ready file
 */
export async function downloadPrintReady(
    id: string,
    options?: {
        format?: 'pdf' | 'png';
        size_cm?: number;
        dpi?: number;
        include_guide?: boolean;
    }
): Promise<{ download_url: string }> {
    const response = await api.get(`/qr-codes/${id}/print`, { params: options });
    return response;
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Bulk generate QR codes
 */
export async function bulkGenerate(
    items: {
        type: QRCodeType;
        name: string;
        url?: string;
        entity_id?: string;
    }[],
    style?: Partial<QRCodeStyle>
): Promise<{ created: QRCode[]; errors: { index: number; error: string }[] }> {
    const response = await api.post('/qr-codes/bulk', { items, style });
    return response;
}

/**
 * Bulk download QR codes as ZIP
 */
export async function bulkDownload(
    ids: string[],
    format: 'png' | 'svg' | 'pdf'
): Promise<{ download_url: string }> {
    const response = await api.post('/qr-codes/bulk/download', { ids, format });
    return response;
}

export default {
    // CRUD
    generateQRCode,
    listQRCodes,
    getQRCode,
    updateQRCode,
    deleteQRCode,
    regenerateImage,

    // Quick Generate
    quickGenerate,

    // Entity-Specific
    generateForBookingPage,
    generateForReviewRequest,
    generateForForm,
    generateForPaymentLink,
    generateForWebsite,

    // Analytics
    getAnalytics,
    getScanHistory,
    getOverallAnalytics,

    // Download
    downloadQRCode,
    downloadPrintReady,

    // Bulk
    bulkGenerate,
    bulkDownload,
};
