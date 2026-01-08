<?php
/**
 * EmailSyncService - Syncs email replies from IMAP and handles automation triggers.
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/SequenceService.php';

class EmailSyncService {
    private $db;
    private $sequenceService;

    public function __construct() {
        $this->db = Database::conn();
        $this->sequenceService = new SequenceService();
    }

    /**
     * Sync all active sending accounts for a user
     */
    public function syncAllAccounts(int $userId): array {
        $stmt = $this->db->prepare("SELECT * FROM sending_accounts WHERE user_id = ? AND status = 'active'");
        $stmt->execute([$userId]);
        $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $results = [
            'accounts_processed' => 0,
            'replies_found' => 0,
            'errors' => []
        ];

        foreach ($accounts as $account) {
            try {
                $count = $this->syncAccount($account);
                $results['accounts_processed']++;
                $results['replies_found'] += $count;
            } catch (Exception $e) {
                $results['errors'][] = "Error syncing {$account['email']}: " . $e->getMessage();
            }
        }

        return $results;
    }

    /**
     * Sync a single account via IMAP
     */
    public function syncAccount(array $account): int {
        if (!function_exists('imap_open')) {
            throw new Exception("IMAP extension is not enabled. Please enable 'extension=imap' in php.ini");
        }

        // Determine IMAP settings (simplified for now)
        // In a real app, these would be in sending_accounts or derived from SMTP settings
        $host = $account['imap_host'] ?? str_replace('smtp.', 'imap.', $account['smtp_host']);
        $port = $account['imap_port'] ?? 993;
        $encryption = $account['imap_encryption'] ?? '/imap/ssl/novalidate-cert';
        
        $connectionString = "{" . $host . ":" . $port . $encryption . "}INBOX";
        $username = $account['smtp_username'] ?? $account['email'];
        $password = $account['smtp_password'];

        $mbox = @imap_open($connectionString, $username, $password);
        if (!$mbox) {
            throw new Exception("Failed to connect to IMAP: " . imap_last_error());
        }

        // Look for recent emails (e.g., since last 1 hour or since last sync)
        // For simplicity, search for UNSEEN or just recent SINCE date
        $since = date("j-M-Y", strtotime("-1 day"));
        $emails = imap_search($mbox, 'SINCE "' . $since . '"');

        $repliesFound = 0;
        if ($emails) {
            rsort($emails);
            foreach ($emails as $emailNumber) {
                $header = imap_headerinfo($mbox, $emailNumber);
                $fromInfo = $header->from[0];
                $senderEmail = $fromInfo->mailbox . "@" . $fromInfo->host;
                
                // Skip if from self
                if (strtolower($senderEmail) === strtolower($account['email'])) {
                    continue;
                }

                $subject = $header->subject;
                $messageId = $header->message_id ?? null;
                $inReplyTo = $header->references ?? $header->in_reply_to ?? null;

                // Try to find matching recipient and campaign
                $data = $this->matchReply($senderEmail, $subject, $inReplyTo, $account['user_id']);
                if ($data) {
                    $body = $this->getIMAPBody($mbox, $emailNumber);
                    $this->processReply($data['recipient_id'], $data['campaign_id'], $senderEmail, $account['email'], $subject, $body, $messageId, $inReplyTo);
                    $repliesFound++;
                    
                    // Mark as seen so we don't process again (or use a local sync log)
                    // imap_setflag_full($mbox, $emailNumber, "\\Seen");
                }
            }
        }

        imap_close($mbox);
        return $repliesFound;
    }

    /**
     * Match an incoming email to a recipient and campaign
     */
    private function matchReply(string $fromEmail, string $subject, ?string $references, int $userId): ?array {
        // 1. Precise match via References/In-Reply-To if we stored message_ids
        if ($references) {
            $refIds = preg_split('/\s+/', $references);
            foreach ($refIds as $refId) {
                $stmt = $this->db->prepare("
                    SELECT recipient_id, campaign_id 
                    FROM email_replies 
                    WHERE message_id = ? AND user_id = ?
                    LIMIT 1
                ");
                $stmt->execute([$refId, $userId]);
                $match = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($match && $match['recipient_id']) {
                    return $match;
                }
            }
        }

        // 2. Fuzzy match via email and subject (fallback)
        $cleanSubject = preg_replace('/^(Re:|RE:|Fwd:|FWD:)\s*/i', '', $subject);
        $stmt = $this->db->prepare("
            SELECT r.id as recipient_id, r.campaign_id 
            FROM recipients r
            JOIN campaigns c ON r.campaign_id = c.id
            WHERE r.email = ? AND c.user_id = ?
            ORDER BY r.created_at DESC
            LIMIT 1
        ");
        $stmt->execute([$fromEmail, $userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    /**
     * Process a detected reply: update DB and handle automation
     */
    public function processReply(int $recipientId, int $campaignId, string $from, string $to, string $subject, string $body, ?string $messageId, ?string $inReplyTo) {
        // Check if already recorded to avoid duplicates
        if ($messageId) {
            $stmt = $this->db->prepare("SELECT id FROM email_replies WHERE message_id = ?");
            $stmt->execute([$messageId]);
            if ($stmt->fetch()) return;
        }

        // 1. Update recipient's replied_at
        $stmt = $this->db->prepare("UPDATE recipients SET replied_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$recipientId]);

        // 2. Store in email_replies
        $normalizedSubject = preg_replace('/^(Re:|Fwd?:|RE:|FWD?:)\s*/i', '', $subject);
        $threadId = md5($normalizedSubject . $from . $to);

        $stmt = $this->db->prepare("
            INSERT INTO email_replies (user_id, campaign_id, recipient_id, from_email, to_email, subject, body, is_read, thread_id, message_id, created_at)
            SELECT user_id, ?, ?, ?, ?, ?, ?, 0, ?, ?, CURRENT_TIMESTAMP
            FROM campaigns WHERE id = ?
        ");
        $stmt->execute([$campaignId, $recipientId, $from, $to, $subject, $body, $threadId, $messageId, $campaignId]);

        // 3. Automation: Stop on reply
        $stmt = $this->db->prepare("SELECT sequence_id, stop_on_reply FROM campaigns WHERE id = ?");
        $stmt->execute([$campaignId]);
        $campaign = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($campaign && $campaign['stop_on_reply'] && $campaign['sequence_id']) {
            $this->sequenceService->pauseExecution($campaign['sequence_id'], $recipientId);
        }
    }

    private function getIMAPBody($mbox, $emailNumber) {
        $structure = imap_fetchstructure($mbox, $emailNumber);
        if (isset($structure->parts) && count($structure->parts)) {
            $part = $structure->parts[0];
            $body = imap_fetchbody($mbox, $emailNumber, 1);
            if ($part->encoding == 3) $body = base64_decode($body);
            elseif ($part->encoding == 4) $body = imap_qprint($body);
        } else {
            $body = imap_body($mbox, $emailNumber);
        }
        return $body;
    }
}
