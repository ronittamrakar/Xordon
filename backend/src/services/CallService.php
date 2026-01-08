<?php

class CallService {
    private $projectId;
    private $spaceUrl;
    private $apiToken;
    private $defaultCallerId;

    public function __construct(?array $credentials = null, ?string $userId = null) {
        if ($credentials === null && $userId) {
            require_once __DIR__ . '/TelephonyConfig.php';
            $credentials = TelephonyConfig::ensureSignalWireConfig($userId);
        }

        $this->projectId = $credentials['projectId'] ?? ($_ENV['SIGNALWIRE_PROJECT_ID'] ?? '');
        $this->spaceUrl = $credentials['spaceUrl'] ?? ($_ENV['SIGNALWIRE_SPACE_URL'] ?? '');
        $this->apiToken = $credentials['apiToken'] ?? ($_ENV['SIGNALWIRE_API_TOKEN'] ?? '');
        $this->defaultCallerId = $credentials['defaultCallerId'] ?? $credentials['defaultSenderNumber'] ?? ($_ENV['SIGNALWIRE_DEFAULT_SENDER'] ?? '');
    }

    public function withCredentials(array $credentials): self {
        return new self($credentials);
    }

    public function makeCall($to, $from = null, $webhookUrl = null, $timeout = 30, $credentials = null) {
        // Use provided credentials or fall back to instance credentials
        $projectId = $credentials['projectId'] ?? $this->projectId;
        $spaceUrl = $credentials['spaceUrl'] ?? $this->spaceUrl;
        $apiToken = $credentials['apiToken'] ?? $this->apiToken;
        $defaultCallerId = $credentials['defaultCallerId'] ?? $this->defaultCallerId;
        
        if (empty($projectId) || empty($spaceUrl) || empty($apiToken)) {
            throw new Exception('SignalWire credentials not configured. Please check your call settings configuration.');
        }

        $from = $from ?: $defaultCallerId;
        if (empty($from)) {
            throw new Exception('No caller ID configured. Please set a default caller ID in your call settings.');
        }

        // Validate phone number format
        $to = $this->formatPhoneNumber($to);
        $from = $this->formatPhoneNumber($from);

        // SignalWire API endpoint for creating calls
        $url = "https://{$spaceUrl}/api/laml/2010-04-01/Accounts/{$projectId}/Calls.json";

        $data = [
            'From' => $from,
            'To' => $to,
            'Timeout' => $timeout,
            'StatusCallback' => $webhookUrl,
            'StatusCallbackEvent' => ['initiated', 'ringing', 'answered', 'completed'],
            'StatusCallbackMethod' => 'POST'
        ];
        
        // Log the request details for debugging
        error_log("SignalWire Call Request: URL=$url, From=$from, To=$to");

        // If no webhook URL provided, use a simple LaML to say hello and wait
        if (empty($webhookUrl)) {
            // Use a simple webhook endpoint that will be created in the backend
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost:9000';
            $data['Url'] = $protocol . '://' . $host . '/api/calls/webhook';
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
        curl_setopt($ch, CURLOPT_USERPWD, $projectId . ':' . $apiToken);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            error_log("SignalWire Call cURL error: " . $error);
            throw new Exception('Failed to make call: Connection error');
        }

        $responseData = json_decode($response, true);
        
        // Log the full response for debugging
        error_log("SignalWire Call Response (HTTP $httpCode): " . $response);

        if ($httpCode >= 400) {
            $errorMessage = $responseData['message'] ?? $responseData['error'] ?? 'Unknown error';
            error_log("SignalWire Call API error (HTTP $httpCode): " . $errorMessage);
            throw new Exception('Failed to make call: ' . $errorMessage);
        }

        if (empty($responseData) || !isset($responseData['sid'])) {
            error_log("SignalWire Call invalid response: " . $response);
            throw new Exception('Invalid response from SignalWire API');
        }

        return [
            'status' => 'initiated',
            'call_sid' => $responseData['sid'],
            'call_status' => $responseData['status'] ?? 'unknown',
            'duration' => $responseData['duration'] ?? 0,
            'price' => $responseData['price'] ?? 0,
            'response' => $responseData
        ];
    }

    public function getCallStatus($callSid, $credentials = null) {
        // Use provided credentials or fall back to instance credentials
        $projectId = $credentials['projectId'] ?? $this->projectId;
        $spaceUrl = $credentials['spaceUrl'] ?? $this->spaceUrl;
        $apiToken = $credentials['apiToken'] ?? $this->apiToken;
        
        if (empty($projectId) || empty($spaceUrl) || empty($apiToken)) {
            throw new Exception('SignalWire credentials not configured');
        }

        $url = "https://{$spaceUrl}/api/laml/2010-04-01/Accounts/{$projectId}/Calls/{$callSid}.json";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
        curl_setopt($ch, CURLOPT_USERPWD, $projectId . ':' . $apiToken);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception('cURL error: ' . $error);
        }

        if ($httpCode >= 400) {
            throw new Exception('Failed to get call status');
        }

        return json_decode($response, true);
    }

    public function endCall($callSid, $credentials = null) {
        // Use provided credentials or fall back to instance credentials
        $projectId = $credentials['projectId'] ?? $this->projectId;
        $spaceUrl = $credentials['spaceUrl'] ?? $this->spaceUrl;
        $apiToken = $credentials['apiToken'] ?? $this->apiToken;
        
        if (empty($projectId) || empty($spaceUrl) || empty($apiToken)) {
            throw new Exception('SignalWire credentials not configured');
        }

        $url = "https://{$spaceUrl}/api/laml/2010-04-01/Accounts/{$projectId}/Calls/{$callSid}.json";

        $data = [
            'Status' => 'completed'
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
        curl_setopt($ch, CURLOPT_USERPWD, $projectId . ':' . $apiToken);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception('cURL error: ' . $error);
        }

        if ($httpCode >= 400) {
            throw new Exception('Failed to end call');
        }

        return json_decode($response, true);
    }

    public function getCallRecording($callSid, $credentials = null) {
        // Use provided credentials or fall back to instance credentials
        $projectId = $credentials['projectId'] ?? $this->projectId;
        $spaceUrl = $credentials['spaceUrl'] ?? $this->spaceUrl;
        $apiToken = $credentials['apiToken'] ?? $this->apiToken;
        
        if (empty($projectId) || empty($spaceUrl) || empty($apiToken)) {
            throw new Exception('SignalWire credentials not configured');
        }

        $url = "https://{$spaceUrl}/api/laml/2010-04-01/Accounts/{$projectId}/Calls/{$callSid}/Recordings.json";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
        curl_setopt($ch, CURLOPT_USERPWD, $projectId . ':' . $apiToken);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception('cURL error: ' . $error);
        }

        if ($httpCode >= 400) {
            throw new Exception('Failed to get call recordings');
        }

        $data = json_decode($response, true);
        return $data['recordings'] ?? [];
    }

    public function handleCallWebhook($data) {
        // Handle incoming call webhook from SignalWire
        try {
            $callSid = $data['CallSid'] ?? '';
            $callStatus = $data['CallStatus'] ?? '';
            $from = $data['From'] ?? '';
            $to = $data['To'] ?? '';
            $duration = $data['CallDuration'] ?? 0;
            $recordingUrl = $data['RecordingUrl'] ?? '';
            $recordingSid = $data['RecordingSid'] ?? '';

            // Log the call event
            $db = Database::conn();
            
            // Find the call log by external_id (call_sid)
            $stmt = $db->prepare("SELECT * FROM call_logs WHERE external_id = :call_sid");
            $stmt->execute(['call_sid' => $callSid]);
            $callLog = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($callLog) {
                // Update the call log with the webhook data
                $updateStmt = $db->prepare("
                    UPDATE call_logs SET 
                        status = :status,
                        call_duration = :duration,
                        duration = :duration,
                        recording_url = :recording_url,
                        ended_at = CASE WHEN :status = 'completed' THEN NOW() ELSE ended_at END,
                        updated_at = NOW()
                    WHERE external_id = :call_sid
                ");
                $updateStmt->execute([
                    'status' => $callStatus,
                    'duration' => $duration,
                    'recording_url' => $recordingUrl,
                    'call_sid' => $callSid
                ]);

                // If call is completed, update campaign statistics AND process for performance billing
                if ($callStatus === 'completed') {
                    $this->updateCampaignStats($callLog['campaign_id']);
                    
                    // Trigger performance billing qualification and billing
                    try {
                        require_once __DIR__ . '/PerformanceBillingService.php';
                        $billingResult = PerformanceBillingService::processCallForBilling((int)$callLog['id']);
                        error_log('Performance Billing for call ' . $callLog['id'] . ': ' . json_encode($billingResult));
                    } catch (Exception $billingError) {
                        // Don't fail the webhook if billing fails - just log it
                        error_log('Performance Billing error for call ' . $callLog['id'] . ': ' . $billingError->getMessage());
                    }
                }
            }

            return ['status' => 'success'];
        } catch (Exception $e) {
            error_log('Call Webhook error: ' . $e->getMessage());
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    private function updateCampaignStats($campaignId) {
        if (empty($campaignId)) {
            return;
        }

        try {
            $db = Database::conn();
            
            // Get call statistics for the campaign
            $stmt = $db->prepare("
                SELECT 
                    COUNT(*) as total_calls,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_calls,
                    SUM(CASE WHEN status = 'busy' THEN 1 ELSE 0 END) as busy_calls,
                    SUM(CASE WHEN status = 'no-answer' THEN 1 ELSE 0 END) as no_answer_calls,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_calls
                FROM call_logs 
                WHERE campaign_id = :campaign_id
            ");
            $stmt->execute(['campaign_id' => $campaignId]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($stats) {
                // Update campaign with statistics
                $updateStmt = $db->prepare("
                    UPDATE call_campaigns SET 
                        completed_calls = :completed_calls,
                        busy_calls = :busy_calls,
                        no_answer_calls = :no_answer_calls,
                        failed_calls = :failed_calls,
                        updated_at = NOW()
                    WHERE id = :campaign_id
                ");
                $updateStmt->execute([
                    'completed_calls' => $stats['completed_calls'] ?? 0,
                    'busy_calls' => $stats['busy_calls'] ?? 0,
                    'no_answer_calls' => $stats['no_answer_calls'] ?? 0,
                    'failed_calls' => $stats['failed_calls'] ?? 0,
                    'campaign_id' => $campaignId
                ]);
            }
        } catch (Exception $e) {
            error_log('Failed to update campaign stats: ' . $e->getMessage());
        }
    }

    public function validatePhoneNumber($phoneNumber) {
        // Remove all non-digit characters
        $cleaned = preg_replace('/[^0-9]/', '', $phoneNumber);
        
        // Check if it's a valid length (10-15 digits)
        if (strlen($cleaned) < 10 || strlen($cleaned) > 15) {
            return false;
        }

        return true;
    }

    private function formatPhoneNumber($phoneNumber) {
        // Remove all non-digit characters
        $cleaned = preg_replace('/[^0-9]/', '', $phoneNumber);
        
        // Add country code if not present (assuming US/Canada)
        if (strlen($cleaned) === 10) {
            $cleaned = '1' . $cleaned;
        }
        
        // Add + prefix
        return '+' . $cleaned;
    }

    private function getDefaultTwiMLUrl() {
        // Return a simple LaML URL for basic call handling using SignalWire
        // This generates a simple XML response for call handling
        return 'https://swxml.signalwire.com/laml/basic/voice.xml';
    }

    public function isTestCredentials($projectId, $spaceUrl, $apiToken) {
        // Check if credentials match the test/placeholder values
        return (
            $projectId === 'your_signalwire_project_id_here' ||
            $spaceUrl === 'your-space.signalwire.com' ||
            $apiToken === 'your_signalwire_api_token_here' ||
            strpos($projectId, 'test-') === 0 ||
            strpos($spaceUrl, 'test-') === 0 ||
            strpos($apiToken, 'test-') === 0
        );
    }

    public function getAccountBalance($credentials = null) {
        // Use provided credentials or fall back to instance credentials
        $projectId = $credentials['projectId'] ?? $this->projectId;
        $spaceUrl = $credentials['spaceUrl'] ?? $this->spaceUrl;
        $apiToken = $credentials['apiToken'] ?? $this->apiToken;
        
        if (empty($projectId) || empty($spaceUrl) || empty($apiToken)) {
            throw new Exception('SignalWire credentials not configured');
        }

        // Check if using test credentials (from environment variables)
        if ($this->isTestCredentials($projectId, $spaceUrl, $apiToken)) {
            // Return mock data for testing
            return [
                'balance' => '100.00',
                'currency' => 'USD'
            ];
        }

        $url = "https://{$spaceUrl}/api/laml/2010-04-01/Accounts/{$projectId}.json";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
        curl_setopt($ch, CURLOPT_USERPWD, $projectId . ':' . $apiToken);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception('cURL error: ' . $error);
        }

        if ($httpCode >= 400) {
            throw new Exception('Failed to get account balance');
        }

        $data = json_decode($response, true);
        return [
            'balance' => $data['balance'] ?? '0.00',
            'currency' => 'USD'
        ];
    }
}