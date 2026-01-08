<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class ProposalSettingsController {
    
    public static function get(): void {
        $user = Auth::user();
        if (!$user) {
            Response::json(['error' => 'Unauthorized'], 401);
            return;
        }
        
        $db = Database::conn();
        $stmt = $db->prepare("SELECT * FROM proposal_settings WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $settings = $stmt->fetch();
        
        if (!$settings) {
            // Return default settings
            $settings = [
                'user_id' => $user['id'],
                'company_name' => '',
                'company_logo' => '',
                'company_address' => '',
                'company_phone' => '',
                'company_email' => $user['email'] ?? '',
                'company_website' => '',
                'default_currency' => 'USD',
                'default_validity_days' => 30,
                'default_payment_terms' => 'Payment due within 30 days of acceptance.',
                'default_terms_conditions' => '',
                'email_notifications' => true,
                'require_signature' => true,
                'allow_comments' => true,
                'show_pricing' => true,
                'branding' => [
                    'primary_color' => '#3b82f6',
                    'secondary_color' => '#64748b',
                    'font_family' => 'Inter, sans-serif',
                    'header_style' => 'modern',
                    'footer_text' => ''
                ]
            ];
        } else {
            $settings['branding'] = json_decode($settings['branding'] ?? '{}', true);
            $settings['email_notifications'] = (bool)$settings['email_notifications'];
            $settings['require_signature'] = (bool)$settings['require_signature'];
            $settings['allow_comments'] = (bool)$settings['allow_comments'];
            $settings['show_pricing'] = (bool)$settings['show_pricing'];
        }
        
        Response::json($settings);
    }
    
    public static function update(): void {
        $user = Auth::user();
        if (!$user) {
            Response::json(['error' => 'Unauthorized'], 401);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $db = Database::conn();
        
        // Check if settings exist
        $checkStmt = $db->prepare("SELECT id FROM proposal_settings WHERE user_id = ?");
        $checkStmt->execute([$user['id']]);
        $exists = $checkStmt->fetch();
        
        if ($exists) {
            // Update existing settings
            $stmt = $db->prepare("
                UPDATE proposal_settings SET
                    company_name = ?,
                    company_logo = ?,
                    company_address = ?,
                    company_phone = ?,
                    company_email = ?,
                    company_website = ?,
                    default_currency = ?,
                    default_validity_days = ?,
                    default_payment_terms = ?,
                    default_terms_conditions = ?,
                    email_notifications = ?,
                    require_signature = ?,
                    allow_comments = ?,
                    show_pricing = ?,
                    branding = ?,
                    updated_at = NOW()
                WHERE user_id = ?
            ");
        } else {
            // Insert new settings
            $stmt = $db->prepare("
                INSERT INTO proposal_settings (
                    company_name, company_logo, company_address, company_phone,
                    company_email, company_website, default_currency, default_validity_days,
                    default_payment_terms, default_terms_conditions, email_notifications,
                    require_signature, allow_comments, show_pricing, branding, user_id,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
        }
        
        $stmt->execute([
            $data['company_name'] ?? '',
            $data['company_logo'] ?? '',
            $data['company_address'] ?? '',
            $data['company_phone'] ?? '',
            $data['company_email'] ?? '',
            $data['company_website'] ?? '',
            $data['default_currency'] ?? 'USD',
            $data['default_validity_days'] ?? 30,
            $data['default_payment_terms'] ?? '',
            $data['default_terms_conditions'] ?? '',
            $data['email_notifications'] ?? true,
            $data['require_signature'] ?? true,
            $data['allow_comments'] ?? true,
            $data['show_pricing'] ?? true,
            json_encode($data['branding'] ?? []),
            $user['id']
        ]);
        
        Response::json(['message' => 'Settings updated successfully']);
    }
}
