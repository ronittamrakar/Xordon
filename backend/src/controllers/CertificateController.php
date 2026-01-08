<?php
namespace Xordon\Controllers;

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';
require_once __DIR__ . '/../services/CertificateService.php';

use Xordon\Services\CertificateService;
use Auth;
use TenantContext;

class CertificateController {
    
    /**
     * Get user's certificates
     * GET /api/certificates
     */
    public static function getUserCertificates(): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $userId = $ctx->userId;
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        $certificates = CertificateService::getUserCertificates($userId);
        
        http_response_code(200);
        echo json_encode($certificates);
    }
    
    /**
     * Get a specific certificate
     * GET /api/certificates/{id}
     */
    public static function show(int $id): void {
        $certificate = CertificateService::getCertificate($id);
        
        if (!$certificate) {
            http_response_code(404);
            echo json_encode(['error' => 'Certificate not found']);
            return;
        }
        
        http_response_code(200);
        echo json_encode($certificate);
    }
    
    /**
     * Verify a certificate
     * GET /api/certificates/verify/{code}
     */
    public static function verify(string $code): void {
        $certificate = CertificateService::verifyCertificate($code);
        
        if (!$certificate) {
            http_response_code(404);
            echo json_encode([
                'valid' => false,
                'error' => 'Certificate not found'
            ]);
            return;
        }
        
        http_response_code(200);
        echo json_encode([
            'valid' => true,
            'certificate' => $certificate
        ]);
    }
    
    /**
     * Get course certificates (for instructors/admins)
     * GET /api/courses/{courseId}/certificates
     */
    public static function getCourseCertificates(int $courseId): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $userId = $ctx->userId;
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        $certificates = CertificateService::getCourseCertificates($courseId);
        
        http_response_code(200);
        echo json_encode($certificates);
    }
    
    /**
     * Generate certificate manually (for admins)
     * POST /api/enrollments/{enrollmentId}/certificate
     */
    public static function generate(int $enrollmentId): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $userId = $ctx->userId;
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        $certificateId = CertificateService::generateCertificate($enrollmentId);
        
        if ($certificateId) {
            $certificate = CertificateService::getCertificate($certificateId);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Certificate generated successfully',
                'data' => $certificate
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to generate certificate']);
        }
    }
    
    /**
     * Download certificate PDF
     * GET /api/certificates/{id}/download
     */
    public static function download(int $id): void {
        $certificate = CertificateService::getCertificate($id);
        
        if (!$certificate) {
            http_response_code(404);
            echo json_encode(['error' => 'Certificate not found']);
            return;
        }
        
        // If PDF already exists, redirect to it
        if ($certificate['pdf_url']) {
            header('Location: ' . $certificate['pdf_url']);
            return;
        }
        
        // Otherwise, generate PDF on-the-fly
        $data = CertificateService::getCertificateData($id);
        
        if (!$data) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to get certificate data']);
            return;
        }
        
        // TODO: Generate PDF using a library like TCPDF or mPDF
        // For now, return the data
        http_response_code(200);
        echo json_encode([
            'message' => 'PDF generation not yet implemented',
            'data' => $data
        ]);
    }
}
