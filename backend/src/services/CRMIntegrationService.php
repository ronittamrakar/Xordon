<?php
/**
 * CRM Integration Service
 * Integrates CRM with existing email, SMS, and call campaigns
 */

class CRMIntegrationService {
    
    /**
     * Create or update lead from campaign interaction
     */
    public static function processCampaignInteraction(int $contactId, int $campaignId, string $campaignType, string $interactionType, array $data = []): int {
        $db = Database::getInstance();
        
        try {
            // Check if lead already exists for this contact
            $stmt = $db->prepare("SELECT id FROM leads WHERE contact_id = ? AND user_id = ?");
            $stmt->execute([$contactId, Auth::getUserId()]);
            $lead = $stmt->fetch();
            
            if (!$lead) {
                // Create new lead
                $leadScore = self::calculateInitialLeadScore($campaignType, $interactionType, $data);
                
                $stmt = $db->prepare("
                    INSERT INTO leads (contact_id, user_id, lead_score, lead_stage, source, campaign_id)
                    VALUES (?, ?, ?, 'new', ?, ?)
                ");
                $stmt->execute([
                    $contactId,
                    Auth::getUserId(),
                    $leadScore,
                    $campaignType,
                    $campaignId
                ]);
                
                $leadId = $db->lastInsertId();
            } else {
                $leadId = $lead['id'];
                // Update existing lead score and last activity
                self::updateLeadFromInteraction($leadId, $interactionType, $data);
            }
            
            // Add activity record
            self::addLeadActivity($leadId, $contactId, $campaignType, $interactionType, $data);
            
            return $leadId;
            
        } catch (Exception $e) {
            error_log("CRM Integration Error: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Calculate initial lead score based on interaction
     */
    private static function calculateInitialLeadScore(string $campaignType, string $interactionType, array $data): int {
        $baseScore = 10;
        
        // Campaign type scoring
        switch ($campaignType) {
            case 'email':
                $baseScore += 10;
                break;
            case 'sms':
                $baseScore += 8;
                break;
            case 'call':
                $baseScore += 15;
                break;
        }
        
        // Interaction type scoring
        switch ($interactionType) {
            case 'opened':
                $baseScore += 5;
                break;
            case 'clicked':
                $baseScore += 15;
                break;
            case 'replied':
                $baseScore += 20;
                break;
            case 'answered':
                $baseScore += 25;
                break;
            case 'form_submitted':
                $baseScore += 30;
                break;
        }
        
        return min($baseScore, 100);
    }
    
    /**
     * Update lead from campaign interaction
     */
    private static function updateLeadFromInteraction(int $leadId, string $interactionType, array $data): void {
        $db = Database::getInstance();
        
        $scoreIncrease = 0;
        $stageUpdate = '';
        
        switch ($interactionType) {
            case 'opened':
                $scoreIncrease = 5;
                break;
            case 'clicked':
                $scoreIncrease = 10;
                $stageUpdate = ", lead_stage = 'contacted'";
                break;
            case 'replied':
                $scoreIncrease = 15;
                $stageUpdate = ", lead_stage = 'contacted'";
                break;
            case 'answered':
                $scoreIncrease = 20;
                $stageUpdate = ", lead_stage = 'qualified'";
                break;
            case 'form_submitted':
                $scoreIncrease = 25;
                $stageUpdate = ", lead_stage = 'qualified'";
                break;
        }
        
        $stmt = $db->prepare("
            UPDATE leads 
            SET lead_score = LEAST(lead_score + ?, 100),
                last_activity_at = NOW(),
                updated_at = NOW()
                $stageUpdate
            WHERE id = ?
        ");
        $stmt->execute([$scoreIncrease, $leadId]);
    }
    
    /**
     * Add activity record for lead
     */
    private static function addLeadActivity(int $leadId, int $contactId, string $campaignType, string $interactionType, array $data): void {
        $db = Database::getInstance();
        
        $activityTitle = self::getActivityTitle($campaignType, $interactionType, $data);
        $activityDescription = self::getActivityDescription($campaignType, $interactionType, $data);
        
        $stmt = $db->prepare("
            INSERT INTO lead_activities (lead_id, contact_id, user_id, activity_type, activity_title, activity_description, activity_date)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $leadId,
            $contactId,
            Auth::getUserId(),
            $campaignType,
            $activityTitle,
            $activityDescription
        ]);
    }
    
    /**
     * Get activity title for interaction
     */
    private static function getActivityTitle(string $campaignType, string $interactionType, array $data): string {
        $titles = [
            'email_opened' => 'Email Opened',
            'email_clicked' => 'Email Link Clicked',
            'email_replied' => 'Email Reply Received',
            'sms_sent' => 'SMS Sent',
            'sms_replied' => 'SMS Reply Received',
            'call_answered' => 'Call Completed',
            'call_missed' => 'Call Missed',
            'form_submitted' => 'Form Submitted'
        ];
        
        $key = $campaignType . '_' . $interactionType;
        return $titles[$key] ?? ucfirst($campaignType) . ' ' . ucfirst($interactionType);
    }
    
    /**
     * Get activity description for interaction
     */
    private static function getActivityDescription(string $campaignType, string $interactionType, array $data): string {
        $description = '';
        
        switch ($campaignType) {
            case 'email':
                if ($interactionType === 'clicked' && !empty($data['link'])) {
                    $description = "Clicked link: " . $data['link'];
                } elseif ($interactionType === 'replied' && !empty($data['subject'])) {
                    $description = "Reply subject: " . $data['subject'];
                }
                break;
            case 'sms':
                if ($interactionType === 'replied' && !empty($data['message'])) {
                    $description = "Reply: " . substr($data['message'], 0, 100);
                }
                break;
            case 'call':
                if ($interactionType === 'answered' && !empty($data['duration'])) {
                    $description = "Call duration: " . $data['duration'] . " seconds";
                } elseif (!empty($data['disposition'])) {
                    $description = "Disposition: " . $data['disposition'];
                }
                break;
            case 'form':
                if ($interactionType === 'submitted' && !empty($data['form_name'])) {
                    $description = "Form: " . $data['form_name'];
                }
                break;
        }
        
        return $description;
    }
    
    /**
     * Sync campaign contacts as leads
     */
    public static function syncCampaignContacts(int $campaignId, string $campaignType): int {
        $db = Database::getInstance();
        $leadsCreated = 0;
        
        try {
            // Get all contacts for this campaign
            $stmt = $db->prepare("SELECT id FROM recipients WHERE campaign_id = ?");
            $stmt->execute([$campaignId]);
            $contacts = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
            
            foreach ($contacts as $contactId) {
                $leadId = self::processCampaignInteraction($contactId, $campaignId, $campaignType, 'added_to_campaign');
                if ($leadId > 0) {
                    $leadsCreated++;
                }
            }
            
            return $leadsCreated;
            
        } catch (Exception $e) {
            error_log("CRM Sync Error: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Create task for follow-up based on interaction
     */
    public static function createFollowUpTask(int $leadId, int $contactId, string $interactionType, array $data = []): int {
        $db = Database::getInstance();
        
        try {
            $taskData = self::getTaskData($interactionType, $data);
            
            $stmt = $db->prepare("
                INSERT INTO crm_tasks (lead_id, contact_id, assigned_to, created_by, title, description, task_type, priority, due_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $dueDate = $taskData['due_date'] ?? date('Y-m-d H:i:s', strtotime('+1 day'));
            
            $stmt->execute([
                $leadId,
                $contactId,
                Auth::getUserId(),
                Auth::getUserId(),
                $taskData['title'],
                $taskData['description'],
                $taskData['task_type'],
                $taskData['priority'],
                $dueDate
            ]);
            
            return $db->lastInsertId();
            
        } catch (Exception $e) {
            error_log("CRM Task Creation Error: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Get task data based on interaction type
     */
    private static function getTaskData(string $interactionType, array $data): array {
        $taskData = [
            'task_type' => 'follow_up',
            'priority' => 'medium',
            'due_date' => null
        ];
        
        switch ($interactionType) {
            case 'opened':
                $taskData['title'] = 'Follow up on email open';
                $taskData['description'] = 'Contact opened email, follow up within 24 hours';
                $taskData['task_type'] = 'email';
                $taskData['priority'] = 'low';
                $taskData['due_date'] = date('Y-m-d H:i:s', strtotime('+24 hours'));
                break;
                
            case 'clicked':
                $taskData['title'] = 'Follow up on link click';
                $taskData['description'] = 'Contact clicked link, they are interested';
                $taskData['task_type'] = 'call';
                $taskData['priority'] = 'high';
                $taskData['due_date'] = date('Y-m-d H:i:s', strtotime('+4 hours'));
                break;
                
            case 'replied':
                $taskData['title'] = 'Respond to email reply';
                $taskData['description'] = 'Contact replied to email, respond promptly';
                $taskData['task_type'] = 'email';
                $taskData['priority'] = 'urgent';
                $taskData['due_date'] = date('Y-m-d H:i:s', strtotime('+2 hours'));
                break;
                
            case 'answered':
                $taskData['title'] = 'Call follow-up';
                $taskData['description'] = 'Call completed, log notes and next steps';
                $taskData['task_type'] = 'call';
                $taskData['priority'] = 'medium';
                $taskData['due_date'] = date('Y-m-d H:i:s', strtotime('+1 hour'));
                break;
                
            case 'form_submitted':
                $taskData['title'] = 'New form submission';
                $taskData['description'] = 'Contact submitted form, reach out immediately';
                $taskData['task_type'] = 'call';
                $taskData['priority'] = 'urgent';
                $taskData['due_date'] = date('Y-m-d H:i:s', strtotime('+30 minutes'));
                break;
        }
        
        return $taskData;
    }
}
