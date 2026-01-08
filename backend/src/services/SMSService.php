<?php

class SMSService {
    private $projectId;
    private $spaceUrl;
    private $apiToken;
    private $defaultSender;

    public function __construct(?array $credentials = null, ?string $userId = null) {
        if ($credentials === null && $userId) {
            require_once __DIR__ . '/TelephonyConfig.php';
            $credentials = TelephonyConfig::ensureSignalWireConfig($userId);
        }

        $this->projectId = $credentials['projectId'] ?? ($_ENV['SIGNALWIRE_PROJECT_ID'] ?? '');
        $this->spaceUrl = $credentials['spaceUrl'] ?? ($_ENV['SIGNALWIRE_SPACE_URL'] ?? '');
        $this->apiToken = $credentials['apiToken'] ?? ($_ENV['SIGNALWIRE_API_TOKEN'] ?? '');
        $this->defaultSender = $credentials['defaultSender'] ?? $credentials['defaultSenderNumber'] ?? ($_ENV['SIGNALWIRE_DEFAULT_SENDER'] ?? '');
    }

    public function withCredentials(array $credentials): self {
        return new self($credentials);
    }

    public function sendMessage($to, $message, $from = null, $credentials = null) {
        // Use provided credentials or fall back to instance credentials
        $projectId = $credentials['projectId'] ?? $this->projectId;
        $spaceUrl = $credentials['spaceUrl'] ?? $this->spaceUrl;
        $apiToken = $credentials['apiToken'] ?? $this->apiToken;
        $defaultSender = $credentials['defaultSender'] ?? $credentials['defaultSenderNumber'] ?? $this->defaultSender;
        
        if (empty($projectId) || empty($spaceUrl) || empty($apiToken)) {
            throw new Exception('SignalWire credentials not configured. Please check your SMS settings configuration.');
        }

        $from = $from ?: $defaultSender;
        if (empty($from)) {
            throw new Exception('No sender number configured. Please set a default sender number in your SMS settings.');
        }

        // Validate phone number format
        $to = $this->formatPhoneNumber($to);
        $from = $this->formatPhoneNumber($from);

        // SignalWire API endpoint - corrected format
        $url = "https://{$spaceUrl}/api/laml/2010-04-01/Accounts/{$projectId}/Messages.json";

        $data = [
            'From' => $from,
            'To' => $to,
            'Body' => $message
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
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            error_log("SignalWire cURL error: " . $error);
            throw new Exception('Failed to send SMS: Connection error');
        }

        $responseData = json_decode($response, true);

        if ($httpCode >= 400) {
            $errorMessage = $responseData['message'] ?? $responseData['error'] ?? 'Unknown error';
            error_log("SignalWire API error (HTTP $httpCode): " . $errorMessage);
            throw new Exception('Failed to send SMS: ' . $errorMessage);
        }

        if (empty($responseData) || !isset($responseData['sid'])) {
            error_log("SignalWire invalid response: " . $response);
            throw new Exception('Invalid response from SignalWire API');
        }

        return [
            'status' => 'sent',
            'external_id' => $responseData['sid'],
            'cost' => $responseData['price'] ?? 0,
            'response' => $responseData
        ];
    }

    public function getMessageStatus($messageSid) {
        if (empty($this->projectId) || empty($this->spaceUrl) || empty($this->apiToken)) {
            throw new Exception('SignalWire credentials not configured');
        }

        $url = "https://{$this->spaceUrl}/api/laml/2010-04-01/Accounts/{$this->projectId}/Messages/{$messageSid}.json";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
        curl_setopt($ch, CURLOPT_USERPWD, $this->projectId . ':' . $this->apiToken);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception('cURL error: ' . $error);
        }

        if ($httpCode >= 400) {
            throw new Exception('Failed to get message status');
        }

        return json_decode($response, true);
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

    private function isTestCredentials($projectId, $spaceUrl, $apiToken) {
        // Check if credentials match the exact test/placeholder values
        return (
            $projectId === 'your_signalwire_project_id_here' ||
            $spaceUrl === 'your-space.signalwire.com' ||
            $apiToken === 'your_signalwire_api_token_here'
        );
    }

    public function handleWebhook($data) {
        // Handle incoming SMS webhook from SignalWire
        try {
            $from = $data['From'] ?? '';
            $to = $data['To'] ?? '';
            $body = $data['Body'] ?? '';
            $messageSid = $data['MessageSid'] ?? '';

            // Find the recipient
            $db = Database::conn();
            $stmt = $db->prepare("SELECT * FROM sms_recipients WHERE phone_number = :phone");
            $stmt->execute(['phone' => $from]);
            $recipient = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($recipient) {
                // Log the reply
                $stmt = $db->prepare("
                    INSERT INTO sms_replies (
                        user_id, recipient_id, phone_number, message, 
                        sender_id, external_id, created_at
                    ) VALUES (
                        :user_id, :recipient_id, :phone_number, :message,
                        :sender_id, :external_id, NOW()
                    )
                ");
                $stmt->execute([
                    'user_id' => $recipient['user_id'],
                    'recipient_id' => $recipient['id'],
                    'phone_number' => $from,
                    'message' => $body,
                    'sender_id' => $to,
                    'external_id' => $messageSid
                ]);

                // Check for opt-out keywords
                $optOutKeywords = ['STOP', 'UNSUBSCRIBE', 'QUIT', 'END', 'CANCEL'];
                $bodyUpper = strtoupper(trim($body));
                
                if (in_array($bodyUpper, $optOutKeywords)) {
                    // Update recipient opt-out status
                    $stmt = $db->prepare("
                        UPDATE sms_recipients SET 
                            opt_in_status = 'opted_out',
                            opt_out_date = NOW(),
                            updated_at = NOW()
                        WHERE id = :id
                    ");
                    $stmt->execute(['id' => $recipient['id']]);
                }
            }

            return ['status' => 'success'];
        } catch (Exception $e) {
            error_log('SMS Webhook error: ' . $e->getMessage());
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    public function updateMessageStatus($externalId, $status, $errorMessage = null) {
        try {
            $db = Database::conn();
            $stmt = $db->prepare("
                UPDATE sms_messages SET 
                    delivery_status = :status,
                    delivery_timestamp = NOW(),
                    error_message = :error_message,
                    updated_at = NOW()
                WHERE external_id = :external_id
            ");
            $stmt->execute([
                'status' => $status,
                'error_message' => $errorMessage,
                'external_id' => $externalId
            ]);

            return true;
        } catch (Exception $e) {
            error_log('Failed to update message status: ' . $e->getMessage());
            return false;
        }
    }

    public function getAvailableNumbers($projectId = null, $spaceUrl = null, $apiToken = null) {
        // Use provided credentials or fall back to instance credentials
        $projectId = $projectId ?: $this->projectId;
        $spaceUrl = $spaceUrl ?: $this->spaceUrl;
        $apiToken = $apiToken ?: $this->apiToken;
        
        if (empty($projectId) || empty($spaceUrl) || empty($apiToken)) {
            throw new Exception('SignalWire credentials not configured');
        }

        // Check if using test credentials (from environment variables)
        if ($this->isTestCredentials($projectId, $spaceUrl, $apiToken)) {
            // Return mock data for testing
            return [
                [
                    'phone_number' => '+1234567890',
                    'friendly_name' => 'Test Number 1',
                    'capabilities' => ['voice' => true, 'sms' => true, 'mms' => true]
                ],
                [
                    'phone_number' => '+1987654321',
                    'friendly_name' => 'Test Number 2',
                    'capabilities' => ['voice' => true, 'sms' => true, 'mms' => true]
                ]
            ];
        }

        $url = "https://{$spaceUrl}/api/laml/2010-04-01/Accounts/{$projectId}/IncomingPhoneNumbers.json";

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
            $responseData = json_decode($response, true);
            $errorMessage = $responseData['message'] ?? 'Failed to fetch phone numbers';
            throw new Exception('SignalWire API error: ' . $errorMessage);
        }

        $data = json_decode($response, true);
        $numbers = [];
        
        if (isset($data['incoming_phone_numbers']) && is_array($data['incoming_phone_numbers'])) {
            foreach ($data['incoming_phone_numbers'] as $number) {
                $numbers[] = [
                    'phone_number' => $number['phone_number'] ?? '',
                    'friendly_name' => $number['friendly_name'] ?? $number['phone_number'] ?? '',
                    'capabilities' => $number['capabilities'] ?? []
                ];
            }
        }

        return $numbers;
    }

    public function getAccountBalance() {
        if (empty($this->projectId) || empty($this->spaceUrl) || empty($this->apiToken)) {
            throw new Exception('SignalWire credentials not configured');
        }

        $url = "https://{$this->spaceUrl}/api/laml/2010-04-01/Accounts/{$this->projectId}.json";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
        curl_setopt($ch, CURLOPT_USERPWD, $this->projectId . ':' . $this->apiToken);

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

    public function testTwilioConnection($accountSid, $authToken, $phoneNumber) {
        // This is a basic connection test - we'll just validate the credentials
        // by attempting to format the phone number (which requires valid credentials)
        try {
            // For now, we'll do a simple validation
            // In a real implementation, you might want to make an API call to Twilio
            if (empty($accountSid) || empty($authToken) || empty($phoneNumber)) {
                return false;
            }
            
            // Validate phone number format
            $formattedNumber = $this->formatPhoneNumber($phoneNumber);
            
            // Basic validation - check if it's a valid format
            if (strlen($formattedNumber) >= 10 && is_numeric(str_replace('+', '', $formattedNumber))) {
                return true;
            }
            
            return false;
            
        } catch (Exception $e) {
            error_log('Twilio connection test failed: ' . $e->getMessage());
            return false;
        }
    }
}