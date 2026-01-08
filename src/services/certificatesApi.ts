import api from '@/lib/api';

export interface Certificate {
    id: number;
    course_id: number;
    enrollment_id: number;
    user_id: number;
    certificate_number: string;
    issued_at: string;
    pdf_url: string | null;
    verification_code: string;
    created_at: string;
    // Joined fields
    course_title?: string;
    user_name?: string;
    user_email?: string;
    thumbnail_url?: string;
}

export interface CertificateVerification {
    valid: boolean;
    certificate?: Certificate & {
        workspace_id: number;
    };
    error?: string;
}

export const certificatesApi = {
    // Get user's certificates
    getUserCertificates: async (): Promise<Certificate[]> => {
        const response = await api.get('/certificates');
        return response.data;
    },

    // Get specific certificate
    getCertificate: async (id: number): Promise<Certificate> => {
        const response = await api.get(`/certificates/${id}`);
        return response.data;
    },

    // Verify certificate by code
    verifyCertificate: async (code: string): Promise<CertificateVerification> => {
        const response = await api.get(`/certificates/verify/${code}`);
        return response.data;
    },

    // Get course certificates (for instructors/admins)
    getCourseCertificates: async (courseId: number): Promise<Certificate[]> => {
        const response = await api.get(`/courses/${courseId}/certificates`);
        return response.data;
    },

    // Generate certificate manually
    generateCertificate: async (enrollmentId: number): Promise<Certificate> => {
        const response = await api.post(`/enrollments/${enrollmentId}/certificate`);
        return response.data.data;
    },

    // Download certificate PDF
    downloadCertificate: async (id: number): Promise<string> => {
        const response = await api.get(`/certificates/${id}/download`);
        return response.data.pdf_url || response.data.data?.pdf_url;
    },
};
