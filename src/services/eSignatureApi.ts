/**
 * E-Signature API
 * Digital signatures for proposals, estimates, and contracts
 */

import { api } from '@/lib/api';

// ============================================
// TYPES
// ============================================

export type DocumentType = 'proposal' | 'estimate' | 'contract' | 'agreement' | 'invoice';
export type SignatureStatus = 'pending' | 'viewed' | 'signed' | 'declined' | 'expired' | 'voided';

export interface SignatureRequest {
    id: string;
    workspace_id: string;
    document_type: DocumentType;
    document_id: string;
    document_title: string;
    status: SignatureStatus;

    // Sender
    created_by: string;
    created_by_name: string;

    // Recipients
    signers: Signer[];

    // Options
    expires_at?: string;
    reminder_frequency?: 'daily' | 'weekly' | 'none';
    last_reminder_sent_at?: string;

    // Completion
    completed_at?: string;
    signed_document_url?: string;

    // Tracking
    created_at: string;
    updated_at: string;
}

export interface Signer {
    id: string;
    email: string;
    name: string;
    role: string; // e.g., "Client", "Contractor", "Witness"
    order: number; // signing order
    status: 'pending' | 'sent' | 'viewed' | 'signed' | 'declined';
    signature_type: 'draw' | 'type' | 'upload' | 'any';

    // Signature data (after signing)
    signed_at?: string;
    signature_image_url?: string;
    ip_address?: string;
    user_agent?: string;

    // Access
    access_code?: string; // optional PIN protection
    phone_verification?: boolean;
}

export interface SignatureField {
    id: string;
    type: 'signature' | 'initials' | 'date' | 'text' | 'checkbox';
    signer_id: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    required: boolean;
    label?: string;
    placeholder?: string;
    value?: string;
}

export interface SigningSession {
    id: string;
    signature_request_id: string;
    signer_id: string;
    signer: Signer;
    document_url: string;
    fields: SignatureField[];
    expires_at: string;
    completed: boolean;
}

export interface SignatureTemplate {
    id: string;
    workspace_id: string;
    name: string;
    description?: string;
    document_type: DocumentType;
    default_signers: {
        role: string;
        order: number;
        signature_type: 'draw' | 'type' | 'upload' | 'any';
    }[];
    fields: Omit<SignatureField, 'id' | 'signer_id' | 'value'>[];
    created_at: string;
    updated_at: string;
}

export interface AuditTrailEntry {
    id: string;
    signature_request_id: string;
    action: string;
    actor: string;
    actor_email?: string;
    ip_address?: string;
    details?: Record<string, any>;
    timestamp: string;
}

// ============================================
// SIGNATURE REQUESTS
// ============================================

/**
 * Create a new signature request
 */
export async function createSignatureRequest(data: {
    document_type: DocumentType;
    document_id: string;
    signers: {
        email: string;
        name: string;
        role: string;
        order?: number;
        signature_type?: 'draw' | 'type' | 'upload' | 'any';
        access_code?: string;
    }[];
    message?: string;
    expires_in_days?: number;
    reminder_frequency?: 'daily' | 'weekly' | 'none';
    send_immediately?: boolean;
}): Promise<SignatureRequest> {
    const response = await api.post('/e-signature/requests', data);
    return response;
}

/**
 * List all signature requests
 */
export async function listSignatureRequests(params?: {
    status?: SignatureStatus;
    document_type?: DocumentType;
    page?: number;
    limit?: number;
}): Promise<{ data: SignatureRequest[]; total: number; page: number }> {
    const response = await api.get('/e-signature/requests', { params });
    return response;
}

/**
 * Get a specific signature request
 */
export async function getSignatureRequest(id: string): Promise<SignatureRequest> {
    const response = await api.get(`/e-signature/requests/${id}`);
    return response;
}

/**
 * Send/resend signature request to signers
 */
export async function sendSignatureRequest(
    id: string,
    signerIds?: string[]
): Promise<{ sent_to: string[] }> {
    const response = await api.post(`/e-signature/requests/${id}/send`, {
        signer_ids: signerIds,
    });
    return response;
}

/**
 * Send reminder to pending signers
 */
export async function sendReminder(
    id: string,
    signerIds?: string[]
): Promise<{ sent_to: string[] }> {
    const response = await api.post(`/e-signature/requests/${id}/remind`, {
        signer_ids: signerIds,
    });
    return response;
}

/**
 * Void a signature request
 */
export async function voidSignatureRequest(
    id: string,
    reason?: string
): Promise<SignatureRequest> {
    const response = await api.post(`/e-signature/requests/${id}/void`, { reason });
    return response;
}

/**
 * Delete a signature request (only if not signed)
 */
export async function deleteSignatureRequest(id: string): Promise<void> {
    await api.delete(`/e-signature/requests/${id}`);
}

/**
 * Download signed document
 */
export async function downloadSignedDocument(
    id: string
): Promise<{ download_url: string; expires_at: string }> {
    const response = await api.get(`/e-signature/requests/${id}/download`);
    return response;
}

/**
 * Get audit trail for a signature request
 */
export async function getAuditTrail(id: string): Promise<AuditTrailEntry[]> {
    const response = await api.get(`/e-signature/requests/${id}/audit-trail`);
    return response;
}

// ============================================
// SIGNING SESSION (for signers)
// ============================================

/**
 * Get signing session by access token (public endpoint)
 */
export async function getSigningSession(token: string): Promise<SigningSession> {
    const response = await api.get(`/e-signature/sign/${token}`);
    return response;
}

/**
 * Verify access code for protected signing
 */
export async function verifyAccessCode(
    token: string,
    code: string
): Promise<{ valid: boolean; session?: SigningSession }> {
    const response = await api.post(`/e-signature/sign/${token}/verify`, { code });
    return response;
}

/**
 * Submit signature for a field
 */
export async function submitFieldValue(
    token: string,
    fieldId: string,
    value: string | boolean,
    signatureImageData?: string // base64 for signature/initials
): Promise<{ success: boolean }> {
    const response = await api.post(`/e-signature/sign/${token}/fields/${fieldId}`, {
        value,
        signature_image_data: signatureImageData,
    });
    return response;
}

/**
 * Complete signing session
 */
export async function completeSigning(token: string): Promise<{
    success: boolean;
    message: string;
    redirect_url?: string;
}> {
    const response = await api.post(`/e-signature/sign/${token}/complete`);
    return response;
}

/**
 * Decline to sign
 */
export async function declineSigning(
    token: string,
    reason?: string
): Promise<{ success: boolean }> {
    const response = await api.post(`/e-signature/sign/${token}/decline`, { reason });
    return response;
}

// ============================================
// TEMPLATES
// ============================================

/**
 * Create a signature template
 */
export async function createTemplate(data: {
    name: string;
    description?: string;
    document_type: DocumentType;
    default_signers: {
        role: string;
        order: number;
        signature_type?: 'draw' | 'type' | 'upload' | 'any';
    }[];
    fields: Omit<SignatureField, 'id' | 'signer_id' | 'value'>[];
}): Promise<SignatureTemplate> {
    const response = await api.post('/e-signature/templates', data);
    return response;
}

/**
 * List signature templates
 */
export async function listTemplates(params?: {
    document_type?: DocumentType;
}): Promise<SignatureTemplate[]> {
    const response = await api.get('/e-signature/templates', { params });
    return response;
}

/**
 * Get a template
 */
export async function getTemplate(id: string): Promise<SignatureTemplate> {
    const response = await api.get(`/e-signature/templates/${id}`);
    return response;
}

/**
 * Update a template
 */
export async function updateTemplate(
    id: string,
    data: Partial<Omit<SignatureTemplate, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>
): Promise<SignatureTemplate> {
    const response = await api.put(`/e-signature/templates/${id}`, data);
    return response;
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string): Promise<void> {
    await api.delete(`/e-signature/templates/${id}`);
}

/**
 * Apply template to a new signature request
 */
export async function applyTemplate(
    templateId: string,
    data: {
        document_type: DocumentType;
        document_id: string;
        signers: { email: string; name: string; role: string }[];
    }
): Promise<SignatureRequest> {
    const response = await api.post(`/e-signature/templates/${templateId}/apply`, data);
    return response;
}

// ============================================
// QUICK SIGN (inline signature capture)
// ============================================

/**
 * Create a quick signature request (for simple document acceptance)
 */
export async function createQuickSign(data: {
    document_type: DocumentType;
    document_id: string;
    signer_email: string;
    signer_name: string;
    acceptance_text?: string; // e.g., "I accept the terms of this estimate"
}): Promise<{
    signature_request_id: string;
    signing_url: string;
    expires_at: string;
}> {
    const response = await api.post('/e-signature/quick-sign', data);
    return response;
}

/**
 * Check if a document is signed
 */
export async function checkDocumentSigned(
    documentType: DocumentType,
    documentId: string
): Promise<{
    signed: boolean;
    signature_request_id?: string;
    signed_at?: string;
    signer_name?: string;
}> {
    const response = await api.get(
        `/e-signature/check/${documentType}/${documentId}`
    );
    return response;
}

// ============================================
// SETTINGS
// ============================================

export interface ESignatureSettings {
    enabled: boolean;
    company_name: string;
    logo_url?: string;
    brand_color?: string;
    default_expiration_days: number;
    default_reminder_frequency: 'daily' | 'weekly' | 'none';
    email_templates: {
        request_email: string;
        reminder_email: string;
        completed_email: string;
    };
    terms_text?: string;
    redirect_url_after_signing?: string;
}

/**
 * Get e-signature settings
 */
export async function getSettings(): Promise<ESignatureSettings> {
    const response = await api.get('/e-signature/settings');
    return response;
}

/**
 * Update e-signature settings
 */
export async function updateSettings(
    settings: Partial<ESignatureSettings>
): Promise<ESignatureSettings> {
    const response = await api.put('/e-signature/settings', settings);
    return response;
}

export default {
    // Requests
    createSignatureRequest,
    listSignatureRequests,
    getSignatureRequest,
    sendSignatureRequest,
    sendReminder,
    voidSignatureRequest,
    deleteSignatureRequest,
    downloadSignedDocument,
    getAuditTrail,

    // Signing Session
    getSigningSession,
    verifyAccessCode,
    submitFieldValue,
    completeSigning,
    declineSigning,

    // Templates
    createTemplate,
    listTemplates,
    getTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,

    // Quick Sign
    createQuickSign,
    checkDocumentSigned,

    // Settings
    getSettings,
    updateSettings,
};
