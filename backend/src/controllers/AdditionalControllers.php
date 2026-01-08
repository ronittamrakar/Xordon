<?php
namespace Xordon\Controllers;

use Xordon\Database;
use Exception;

/**
 * Webinar Controller Extension
 * Adds registration and session management to existing WebinarController
 */
class WebinarExtensions {
    
    /**
     * Get webinar registrations
     */
    public function getRegistrations($webinarId) {
        $sql = "SELECT r.*, c.name as contact_name
                FROM webinar_registrations r
                LEFT JOIN contacts c ON r.contact_id = c.id
                WHERE r.webinar_id = ?
                ORDER BY r.registered_at DESC";
        
        $registrations = Database::select($sql, [$webinarId]);
        
        foreach ($registrations as &$reg) {
            $reg['custom_fields'] = json_decode($reg['custom_fields'] ?? '{}', true);
        }
        
        return ['registrations' => $registrations];
    }
    
    /**
     * Register for webinar
     */
    public function register($webinarId) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO webinar_registrations (
            webinar_id, contact_id, email, first_name, last_name,
            phone, company, custom_fields
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        try {
            Database::execute($sql, [
                $webinarId,
                $data['contact_id'] ?? null,
                $data['email'],
                $data['first_name'] ?? null,
                $data['last_name'] ?? null,
                $data['phone'] ?? null,
                $data['company'] ?? null,
                json_encode($data['custom_fields'] ?? [])
            ]);
            
            $id = Database::conn()->lastInsertId();
            
            // TODO: Send confirmation email
            
            return ['success' => true, 'registration_id' => $id];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Mark attendance
     */
    public function markAttendance($registrationId) {
        try {
            Database::execute(
                "UPDATE webinar_registrations SET attended = 1, attended_at = NOW() WHERE id = ?",
                [$registrationId]
            );
            
            return ['success' => true];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
}

/**
 * Loyalty Program Controller
 */
class LoyaltyController {
    
    /**
     * Get loyalty members
     */
    public function getMembers() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $sql = "SELECT m.*, c.name as contact_name, c.email, c.phone,
                p.name as program_name
                FROM loyalty_members m
                INNER JOIN loyalty_programs p ON m.program_id = p.id
                LEFT JOIN contacts c ON m.contact_id = c.id
                WHERE p.workspace_id = ?
                ORDER BY m.points_balance DESC
                LIMIT 1000";
        
        $members = Database::select($sql, [$workspaceId]);
        
        return ['members' => $members];
    }
    
    /**
     * Enroll member
     */
    public function enrollMember() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Generate member number
        $memberNumber = 'LM-' . strtoupper(substr(md5(uniqid()), 0, 8));
        
        $sql = "INSERT INTO loyalty_members (
            program_id, contact_id, member_number, tier
        ) VALUES (?, ?, ?, ?)";
        
        try {
            Database::execute($sql, [
                $data['program_id'],
                $data['contact_id'],
                $memberNumber,
                $data['tier'] ?? 'bronze'
            ]);
            
            $id = Database::conn()->lastInsertId();
            return ['success' => true, 'id' => $id, 'member_number' => $memberNumber];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Award points
     */
    public function awardPoints($memberId) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        try {
            // Get current balance
            $member = Database::first("SELECT points_balance FROM loyalty_members WHERE id = ?", [$memberId]);
            $newBalance = $member['points_balance'] + $data['points'];
            
            // Create transaction
            Database::execute(
                "INSERT INTO loyalty_transactions (
                    member_id, transaction_type, points, description,
                    reference_type, reference_id, balance_after
                ) VALUES (?, 'earn', ?, ?, ?, ?, ?)",
                [
                    $memberId,
                    $data['points'],
                    $data['description'] ?? 'Points awarded',
                    $data['reference_type'] ?? null,
                    $data['reference_id'] ?? null,
                    $newBalance
                ]
            );
            
            // Update member balance
            Database::execute(
                "UPDATE loyalty_members SET 
                 points_balance = ?,
                 lifetime_points_earned = lifetime_points_earned + ?,
                 last_activity_at = NOW()
                 WHERE id = ?",
                [$newBalance, $data['points'], $memberId]
            );
            
            return ['success' => true, 'new_balance' => $newBalance];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Redeem reward
     */
    public function redeemReward() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        try {
            // Get reward and member
            $reward = Database::first("SELECT * FROM loyalty_rewards WHERE id = ?", [$data['reward_id']]);
            $member = Database::first("SELECT * FROM loyalty_members WHERE id = ?", [$data['member_id']]);
            
            if ($member['points_balance'] < $reward['points_required']) {
                return ['error' => 'Insufficient points'];
            }
            
            $newBalance = $member['points_balance'] - $reward['points_required'];
            
            // Create redemption
            Database::execute(
                "INSERT INTO loyalty_redemptions (
                    member_id, reward_id, points_spent, status
                ) VALUES (?, ?, ?, 'pending')",
                [$data['member_id'], $data['reward_id'], $reward['points_required']]
            );
            
            // Create transaction
            Database::execute(
                "INSERT INTO loyalty_transactions (
                    member_id, transaction_type, points, description, balance_after
                ) VALUES (?, 'redeem', ?, ?, ?)",
                [$data['member_id'], -$reward['points_required'], 'Redeemed: ' . $reward['name'], $newBalance]
            );
            
            // Update member balance
            Database::execute(
                "UPDATE loyalty_members SET 
                 points_balance = ?,
                 lifetime_points_redeemed = lifetime_points_redeemed + ?
                 WHERE id = ?",
                [$newBalance, $reward['points_required'], $data['member_id']]
            );
            
            return ['success' => true, 'new_balance' => $newBalance];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Get rewards
     */
    public function getRewards($programId) {
        $sql = "SELECT * FROM loyalty_rewards WHERE program_id = ? AND is_active = 1 ORDER BY points_required";
        $rewards = Database::select($sql, [$programId]);
        
        return ['rewards' => $rewards];
    }
}

/**
 * Social Media Controller
 */
class SocialMediaController {
    
    /**
     * Get social accounts
     */
    public function getAccounts() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $sql = "SELECT * FROM social_accounts WHERE workspace_id = ? ORDER BY platform, account_name";
        $accounts = Database::select($sql, [$workspaceId]);
        
        return ['accounts' => $accounts];
    }
    
    /**
     * Get scheduled posts
     */
    public function getPosts() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $sql = "SELECT p.*, a.platform, a.account_name
                FROM social_posts p
                INNER JOIN social_accounts a ON p.account_id = a.id
                WHERE p.workspace_id = ?
                ORDER BY p.scheduled_at DESC
                LIMIT 100";
        
        $posts = Database::select($sql, [$workspaceId]);
        
        foreach ($posts as &$post) {
            $post['media_urls'] = json_decode($post['media_urls'] ?? '[]', true);
            $post['hashtags'] = json_decode($post['hashtags'] ?? '[]', true);
        }
        
        return ['posts' => $posts];
    }
    
    /**
     * Schedule post
     */
    public function schedulePost() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO social_posts (
            workspace_id, account_id, content, media_urls, hashtags,
            scheduled_at, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        try {
            Database::execute($sql, [
                $workspaceId,
                $data['account_id'],
                $data['content'],
                json_encode($data['media_urls'] ?? []),
                json_encode($data['hashtags'] ?? []),
                $data['scheduled_at'],
                'scheduled',
                $_SESSION['user_id'] ?? null
            ]);
            
            $id = Database::conn()->lastInsertId();
            return ['success' => true, 'id' => $id];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
}

/**
 * Consumer Financing Controller
 */
class FinancingController {
    
    /**
     * Get financing applications
     */
    public function getApplications() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $sql = "SELECT * FROM financing_applications 
                WHERE workspace_id = ? 
                ORDER BY applied_at DESC";
        
        $applications = Database::select($sql, [$workspaceId]);
        
        return ['applications' => $applications];
    }
    
    /**
     * Submit financing application
     */
    public function submitApplication() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO financing_applications (
            workspace_id, contact_id, invoice_id, applicant_name,
            applicant_email, applicant_phone, requested_amount,
            purpose, employment_status, annual_income, provider
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try {
            Database::execute($sql, [
                $workspaceId,
                $data['contact_id'] ?? null,
                $data['invoice_id'] ?? null,
                $data['applicant_name'],
                $data['applicant_email'],
                $data['applicant_phone'] ?? null,
                $data['requested_amount'],
                $data['purpose'] ?? null,
                $data['employment_status'] ?? null,
                $data['annual_income'] ?? null,
                $data['provider'] ?? 'internal'
            ]);
            
            $id = Database::conn()->lastInsertId();
            return ['success' => true, 'application_id' => $id];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
}

/**
 * E-Signature Controller
 */
class ESignatureController {
    
    /**
     * Get signature documents
     */
    public function getDocuments() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $sql = "SELECT * FROM signature_documents 
                WHERE workspace_id = ? 
                ORDER BY created_at DESC";
        
        $documents = Database::select($sql, [$workspaceId]);
        
        return ['documents' => $documents];
    }
    
    /**
     * Create signature document
     */
    public function createDocument() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO signature_documents (
            workspace_id, document_type, reference_id, title,
            document_url, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try {
            Database::execute($sql, [
                $workspaceId,
                $data['document_type'] ?? null,
                $data['reference_id'] ?? null,
                $data['title'],
                $data['document_url'],
                'draft',
                $_SESSION['user_id'] ?? null
            ]);
            
            $docId = Database::conn()->lastInsertId();
            
            // Add recipients
            if (!empty($data['recipients'])) {
                foreach ($data['recipients'] as $recipient) {
                    Database::execute(
                        "INSERT INTO signature_recipients (
                            document_id, contact_id, email, name, role, signing_order
                        ) VALUES (?, ?, ?, ?, ?, ?)",
                        [
                            $docId,
                            $recipient['contact_id'] ?? null,
                            $recipient['email'],
                            $recipient['name'],
                            $recipient['role'] ?? 'signer',
                            $recipient['signing_order'] ?? 1
                        ]
                    );
                }
            }
            
            return ['success' => true, 'document_id' => $docId];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Send document for signature
     */
    public function sendDocument($documentId) {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        try {
            Database::execute(
                "UPDATE signature_documents SET status = 'sent', sent_at = NOW() 
                 WHERE id = ? AND workspace_id = ?",
                [$documentId, $workspaceId]
            );
            
            // TODO: Send emails to recipients
            
            return ['success' => true];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
}
