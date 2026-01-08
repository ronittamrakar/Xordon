<?php
/**
 * Phone Provisioning Service
 * Handles Twilio/SignalWire phone number provisioning and IVR management
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Logger.php';

class PhoneProvisioningService {
    
    /**
     * Get available phone numbers for purchase
     */
    /**
     * Get available phone numbers for purchase
     */
    public static function searchAvailableNumbers(string $areaCode, string $country = 'US', int $limit = 10, string $type = 'local', ?string $pattern = null): array {
        $config = self::getProviderConfig();
        
        if (!$config) {
            return ['success' => false, 'error' => 'No provider configured. Please connect SignalWire or Twilio in Settings > Connections'];
        }
        
        if ($config['provider'] === 'signalwire') {
            return self::searchSignalWireNumbers($areaCode, $country, $limit, $config, $type, $pattern);
        }
        
        return self::searchTwilioNumbers($areaCode, $country, $limit, $config, $type, $pattern);
    }
    
    /**
     * Search SignalWire available numbers
     */
    private static function searchSignalWireNumbers(string $areaCode, string $country, int $limit, array $config, string $type = 'local', ?string $pattern = null): array {
        $projectId = $config['projectId'];
        $spaceUrl = $config['spaceUrl'];
        $token = $config['apiToken'];
        
        if (!$projectId || !$spaceUrl || !$token) {
            return ['success' => false, 'error' => 'SignalWire not properly configured'];
        }
        
        // Map types to SignalWire endpoint names
        $typeMap = [
            'local' => 'Local',
            'tollfree' => 'TollFree',
            'mobile' => 'Mobile'
        ];
        $swType = $typeMap[strtolower($type)] ?? 'Local';
        
        $url = "https://{$spaceUrl}/api/laml/2010-04-01/Accounts/{$projectId}/AvailablePhoneNumbers/{$country}/{$swType}.json";
        $params = ['Limit' => $limit];
        if ($areaCode) {
            $params['AreaCode'] = $areaCode;
        }
        if ($pattern) {
            // SignalWire uses 'Contains' for number patterns
            $params['Contains'] = $pattern;
        }

        $url .= '?' . http_build_query($params);
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERPWD, "{$projectId}:{$token}");
        
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        // Debug logging
        error_log("SignalWire API Response - HTTP $httpCode: " . substr($response, 0, 500));
        
        if ($httpCode !== 200) {
            error_log("SignalWire search failed with HTTP $httpCode: $response");
            return ['success' => false, 'error' => 'Failed to search numbers (HTTP ' . $httpCode . ')'];
        }
        
        $data = json_decode($response, true);
        
        // Debug the response structure
        error_log("SignalWire response keys: " . implode(', ', array_keys($data ?? [])));
        error_log("Available numbers count: " . count($data['available_phone_numbers'] ?? []));
        
        return [
            'success' => true,
            'provider' => 'signalwire',
            'numbers' => array_map(function($num) {
                return [
                    'phone_number' => $num['phone_number'],
                    'friendly_name' => $num['friendly_name'],
                    'capabilities' => $num['capabilities']
                ];
            }, $data['available_phone_numbers'] ?? [])
        ];
    }
    
    /**
     * Search Twilio available numbers
     */
    private static function searchTwilioNumbers(string $areaCode, string $country, int $limit, array $config, string $type = 'local', ?string $pattern = null): array {
        $accountSid = $config['accountSid'];
        $authToken = $config['authToken'];
        
        if (!$accountSid || !$authToken) {
            return ['success' => false, 'error' => 'Twilio not properly configured'];
        }
        
        // Map types to Twilio endpoint names
        $typeMap = [
            'local' => 'Local',
            'tollfree' => 'TollFree',
            'mobile' => 'Mobile'
        ];
        $twType = $typeMap[strtolower($type)] ?? 'Local';
        
        $url = "https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/AvailablePhoneNumbers/{$country}/{$twType}.json";
        $params = ['PageSize' => $limit];
        if ($areaCode) {
            $params['AreaCode'] = $areaCode;
        }
        if ($pattern) {
            $params['Contains'] = $pattern;
        }

        $url .= '?' . http_build_query($params);
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERPWD, "{$accountSid}:{$authToken}");
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            return ['success' => false, 'error' => 'Failed to search numbers'];
        }
        
        $data = json_decode($response, true);
        
        return [
            'success' => true,
            'provider' => 'twilio',
            'numbers' => array_map(function($num) {
                return [
                    'phone_number' => $num['phone_number'],
                    'friendly_name' => $num['friendly_name'],
                    'capabilities' => $num['capabilities']
                ];
            }, $data['available_phone_numbers'] ?? [])
        ];
    }
    
    /**
     * Purchase a phone number
     */
    public static function purchaseNumber(int $workspaceId, int $userId, string $phoneNumber, ?string $friendlyName = null): array {
        $config = self::getProviderConfig();
        
        if (!$config) {
            return ['success' => false, 'error' => 'No provider configured. Please connect SignalWire or Twilio in Settings > Connections'];
        }
        
        if ($config['provider'] === 'signalwire') {
            $result = self::purchaseSignalWireNumber($phoneNumber, $config);
        } else {
            $result = self::purchaseTwilioNumber($phoneNumber, $config);
        }
        
        if (!$result['success']) {
            return $result;
        }
        
        // Store in database
        $db = Database::conn();
        $stmt = $db->prepare("
            INSERT INTO phone_numbers 
            (workspace_id, user_id, phone_number, friendly_name, provider, provider_sid, capabilities, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        ");
        
        $stmt->execute([
            $workspaceId,
            $userId,
            $phoneNumber,
            $friendlyName ?? $phoneNumber,
            $config['provider'],
            $result['sid'],
            json_encode($result['capabilities'] ?? [])
        ]);
        
        $numberId = $db->lastInsertId();
        
        // Configure webhooks
        self::configureWebhooks($numberId, $phoneNumber, $config['provider'], $config);
        
        return [
            'success' => true,
            'number_id' => $numberId,
            'phone_number' => $phoneNumber,
            'provider' => $config['provider']
        ];
    }
    
    /**
     * Purchase SignalWire number
     */
    private static function purchaseSignalWireNumber(string $phoneNumber, array $config): array {
        $projectId = $config['projectId'];
        $spaceUrl = $config['spaceUrl'];
        $token = $config['apiToken'];
        
        $url = "https://{$spaceUrl}/api/laml/2010-04-01/Accounts/{$projectId}/IncomingPhoneNumbers.json";
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'PhoneNumber' => $phoneNumber
        ]));
        curl_setopt($ch, CURLOPT_USERPWD, "{$projectId}:{$token}");
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 201) {
            return ['success' => false, 'error' => 'Failed to purchase number'];
        }
        
        $data = json_decode($response, true);
        
        return [
            'success' => true,
            'sid' => $data['sid'],
            'capabilities' => $data['capabilities']
        ];
    }
    
    /**
     * Purchase Twilio number
     */
    private static function purchaseTwilioNumber(string $phoneNumber, array $config): array {
        $accountSid = $config['accountSid'];
        $authToken = $config['authToken'];
        
        $url = "https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/IncomingPhoneNumbers.json";
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'PhoneNumber' => $phoneNumber
        ]));
        curl_setopt($ch, CURLOPT_USERPWD, "{$accountSid}:{$authToken}");
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 201) {
            return ['success' => false, 'error' => 'Failed to purchase number'];
        }
        
        $data = json_decode($response, true);
        
        return [
            'success' => true,
            'sid' => $data['sid'],
            'capabilities' => $data['capabilities']
        ];
    }
    
    /**
     * Release a phone number
     */
    public static function releaseNumber(int $numberId): array {
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM phone_numbers WHERE id = ?");
        $stmt->execute([$numberId]);
        $number = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$number) {
            return ['success' => false, 'error' => 'Number not found'];
        }
        
        $config = self::getProviderConfig();
        if (!$config) {
            return ['success' => false, 'error' => 'Provider not configured'];
        }
        
        if ($number['provider'] === 'signalwire') {
            $result = self::releaseSignalWireNumber($number['provider_sid'], $config);
        } else {
            $result = self::releaseTwilioNumber($number['provider_sid'], $config);
        }
        
        if ($result['success']) {
            $stmt = $db->prepare("UPDATE phone_numbers SET status = 'released', released_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([$numberId]);
        }
        
        return $result;
    }
    
    /**
     * Release SignalWire number
     */
    private static function releaseSignalWireNumber(string $sid, array $config): array {
        $projectId = $config['projectId'];
        $spaceUrl = $config['spaceUrl'];
        $token = $config['apiToken'];
        
        $url = "https://{$spaceUrl}/api/laml/2010-04-01/Accounts/{$projectId}/IncomingPhoneNumbers/{$sid}.json";
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        curl_setopt($ch, CURLOPT_USERPWD, "{$projectId}:{$token}");
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return ['success' => $httpCode === 204];
    }
    
    /**
     * Release Twilio number
     */
    private static function releaseTwilioNumber(string $sid, array $config): array {
        $accountSid = $config['accountSid'];
        $authToken = $config['authToken'];
        
        $url = "https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/IncomingPhoneNumbers/{$sid}.json";
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        curl_setopt($ch, CURLOPT_USERPWD, "{$accountSid}:{$authToken}");
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return ['success' => $httpCode === 204];
    }
    
    /**
     * Update phone number configuration on the provider (SignalWire/Twilio)
     * This syncs local settings to the actual phone provider
     */
    public static function updatePhoneNumberConfig(int $numberId, array $settings): array {
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM phone_numbers WHERE id = ?");
        $stmt->execute([$numberId]);
        $number = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$number) {
            return ['success' => false, 'error' => 'Number not found'];
        }
        
        $config = self::getProviderConfig();
        if (!$config) {
            // Just update locally if no provider configured
            return ['success' => true, 'provider_updated' => false, 'message' => 'Updated locally only - no provider configured'];
        }
        
        $providerSid = $number['provider_sid'];
        if (!$providerSid) {
            return ['success' => true, 'provider_updated' => false, 'message' => 'No provider SID - updated locally only'];
        }
        
        if ($number['provider'] === 'signalwire') {
            $result = self::updateSignalWireNumber($providerSid, $number, $settings, $config);
        } else {
            $result = self::updateTwilioNumber($providerSid, $number, $settings, $config);
        }
        
        if (!$result['success']) {
            Logger::error("Failed to update phone number on provider", [
                'number_id' => $numberId,
                'provider' => $number['provider'],
                'error' => $result['error'] ?? 'Unknown error'
            ]);
        }
        
        return $result;
    }
    
    /**
     * Update SignalWire phone number configuration
     */
    private static function updateSignalWireNumber(string $sid, array $number, array $settings, array $config): array {
        $projectId = $config['projectId'];
        $spaceUrl = $config['spaceUrl'];
        $token = $config['apiToken'];
        
        $url = "https://{$spaceUrl}/api/laml/2010-04-01/Accounts/{$projectId}/IncomingPhoneNumbers/{$sid}.json";
        
        $appUrl = $config['appUrl'] ?? getenv('APP_URL') ?? '';
        $numberId = $number['id'];
        
        // Build update params
        $updateParams = [];
        
        // Update friendly name
        if (isset($settings['friendly_name'])) {
            $updateParams['FriendlyName'] = $settings['friendly_name'];
        }
        
        // Configure voice handling based on destination_type
        $destinationType = $settings['destination_type'] ?? $number['destination_type'] ?? 'forward';
        $forwardingNumber = $settings['forwarding_number'] ?? $number['forwarding_number'] ?? '';
        $callRecording = $settings['call_recording'] ?? $number['call_recording'] ?? false;
        $whisperMessage = $settings['whisper_message'] ?? $number['whisper_message'] ?? '';
        $voicemailGreeting = $settings['voicemail_greeting'] ?? $number['voicemail_greeting'] ?? '';
        $passCallId = $settings['pass_call_id'] ?? $number['pass_call_id'] ?? false;
        
        if ($appUrl) {
            // Build query params for the webhook
            $voiceParams = http_build_query([
                'destination' => $destinationType,
                'forward_to' => $forwardingNumber,
                'recording' => $callRecording ? '1' : '0',
                'whisper' => $whisperMessage,
                'voicemail' => $voicemailGreeting,
                'pass_caller_id' => $passCallId ? '1' : '0'
            ]);
            
            $updateParams['VoiceUrl'] = "{$appUrl}/api/phone/voice/{$numberId}?{$voiceParams}";
            $updateParams['VoiceMethod'] = 'POST';
            $updateParams['SmsUrl'] = "{$appUrl}/api/phone/sms/{$numberId}";
            $updateParams['SmsMethod'] = 'POST';
            $updateParams['StatusCallback'] = "{$appUrl}/api/phone/status/{$numberId}";
            $updateParams['StatusCallbackMethod'] = 'POST';
        }
        
        if (empty($updateParams)) {
            return ['success' => true, 'message' => 'No updates to send to provider'];
        }
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($updateParams));
        curl_setopt($ch, CURLOPT_USERPWD, "{$projectId}:{$token}");
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            Logger::info("SignalWire phone number updated successfully", [
                'number_id' => $numberId,
                'sid' => $sid,
                'updates' => array_keys($updateParams)
            ]);
            return ['success' => true, 'provider_updated' => true];
        }
        
        $errorData = json_decode($response, true);
        return [
            'success' => false, 
            'error' => $errorData['message'] ?? "HTTP {$httpCode}",
            'http_code' => $httpCode
        ];
    }
    
    /**
     * Update Twilio phone number configuration
     */
    private static function updateTwilioNumber(string $sid, array $number, array $settings, array $config): array {
        $accountSid = $config['accountSid'];
        $authToken = $config['authToken'];
        
        $url = "https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/IncomingPhoneNumbers/{$sid}.json";
        
        $appUrl = $config['appUrl'] ?? getenv('APP_URL') ?? '';
        $numberId = $number['id'];
        
        // Build update params
        $updateParams = [];
        
        // Update friendly name
        if (isset($settings['friendly_name'])) {
            $updateParams['FriendlyName'] = $settings['friendly_name'];
        }
        
        // Configure voice handling
        $destinationType = $settings['destination_type'] ?? $number['destination_type'] ?? 'forward';
        $forwardingNumber = $settings['forwarding_number'] ?? $number['forwarding_number'] ?? '';
        $callRecording = $settings['call_recording'] ?? $number['call_recording'] ?? false;
        $whisperMessage = $settings['whisper_message'] ?? $number['whisper_message'] ?? '';
        $voicemailGreeting = $settings['voicemail_greeting'] ?? $number['voicemail_greeting'] ?? '';
        $passCallId = $settings['pass_call_id'] ?? $number['pass_call_id'] ?? false;
        
        if ($appUrl) {
            $voiceParams = http_build_query([
                'destination' => $destinationType,
                'forward_to' => $forwardingNumber,
                'recording' => $callRecording ? '1' : '0',
                'whisper' => $whisperMessage,
                'voicemail' => $voicemailGreeting,
                'pass_caller_id' => $passCallId ? '1' : '0'
            ]);
            
            $updateParams['VoiceUrl'] = "{$appUrl}/api/phone/voice/{$numberId}?{$voiceParams}";
            $updateParams['VoiceMethod'] = 'POST';
            $updateParams['SmsUrl'] = "{$appUrl}/api/phone/sms/{$numberId}";
            $updateParams['SmsMethod'] = 'POST';
            $updateParams['StatusCallback'] = "{$appUrl}/api/phone/status/{$numberId}";
            $updateParams['StatusCallbackMethod'] = 'POST';
        }
        
        if (empty($updateParams)) {
            return ['success' => true, 'message' => 'No updates to send to provider'];
        }
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($updateParams));
        curl_setopt($ch, CURLOPT_USERPWD, "{$accountSid}:{$authToken}");
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            Logger::info("Twilio phone number updated successfully", [
                'number_id' => $numberId,
                'sid' => $sid,
                'updates' => array_keys($updateParams)
            ]);
            return ['success' => true, 'provider_updated' => true];
        }
        
        $errorData = json_decode($response, true);
        return [
            'success' => false, 
            'error' => $errorData['message'] ?? "HTTP {$httpCode}",
            'http_code' => $httpCode
        ];
    }
    
    /**
     * Get phone number details from SignalWire/Twilio
     */
    public static function getProviderNumberDetails(int $numberId): array {
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM phone_numbers WHERE id = ?");
        $stmt->execute([$numberId]);
        $number = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$number) {
            return ['success' => false, 'error' => 'Number not found'];
        }
        
        $config = self::getProviderConfig();
        if (!$config) {
            return ['success' => false, 'error' => 'No provider configured'];
        }
        
        $providerSid = $number['provider_sid'];
        if (!$providerSid) {
            return ['success' => false, 'error' => 'No provider SID'];
        }
        
        if ($number['provider'] === 'signalwire') {
            return self::getSignalWireNumberDetails($providerSid, $config);
        } else {
            return self::getTwilioNumberDetails($providerSid, $config);
        }
    }
    
    /**
     * Get SignalWire number details
     */
    private static function getSignalWireNumberDetails(string $sid, array $config): array {
        $projectId = $config['projectId'];
        $spaceUrl = $config['spaceUrl'];
        $token = $config['apiToken'];
        
        $url = "https://{$spaceUrl}/api/laml/2010-04-01/Accounts/{$projectId}/IncomingPhoneNumbers/{$sid}.json";
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERPWD, "{$projectId}:{$token}");
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $data = json_decode($response, true);
            return ['success' => true, 'data' => $data];
        }
        
        return ['success' => false, 'error' => "HTTP {$httpCode}"];
    }
    
    /**
     * Get Twilio number details
     */
    private static function getTwilioNumberDetails(string $sid, array $config): array {
        $accountSid = $config['accountSid'];
        $authToken = $config['authToken'];
        
        $url = "https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/IncomingPhoneNumbers/{$sid}.json";
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERPWD, "{$accountSid}:{$authToken}");
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $data = json_decode($response, true);
            return ['success' => true, 'data' => $data];
        }
        
        return ['success' => false, 'error' => "HTTP {$httpCode}"];
    }
    
    /**
     * Configure webhooks for phone number
     */
    private static function configureWebhooks(int $numberId, string $phoneNumber, string $provider, array $config): void {
        $appUrl = $config['appUrl'] ?? getenv('APP_URL');
        if (!$appUrl) {
            return;
        }
        
        $voiceUrl = "{$appUrl}/api/phone/voice/{$numberId}";
        $smsUrl = "{$appUrl}/api/phone/sms/{$numberId}";
        $statusUrl = "{$appUrl}/api/phone/status/{$numberId}";
        
        $db = Database::conn();
        $stmt = $db->prepare("SELECT provider_sid FROM phone_numbers WHERE id = ?");
        $stmt->execute([$numberId]);
        $number = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$number) {
            return;
        }
        
        if ($provider === 'signalwire') {
            self::configureSignalWireWebhooks($number['provider_sid'], $voiceUrl, $smsUrl, $statusUrl, $config);
        } else {
            self::configureTwilioWebhooks($number['provider_sid'], $voiceUrl, $smsUrl, $statusUrl, $config);
        }
    }
    
    /**
     * Configure SignalWire webhooks
     */
    private static function configureSignalWireWebhooks(string $sid, string $voiceUrl, string $smsUrl, string $statusUrl, array $config): void {
        $projectId = $config['projectId'];
        $spaceUrl = $config['spaceUrl'];
        $token = $config['apiToken'];
        
        $url = "https://{$spaceUrl}/api/laml/2010-04-01/Accounts/{$projectId}/IncomingPhoneNumbers/{$sid}.json";
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'VoiceUrl' => $voiceUrl,
            'VoiceMethod' => 'POST',
            'SmsUrl' => $smsUrl,
            'SmsMethod' => 'POST',
            'StatusCallback' => $statusUrl
        ]));
        curl_setopt($ch, CURLOPT_USERPWD, "{$projectId}:{$token}");
        
        curl_exec($ch);
        curl_close($ch);
    }
    
    /**
     * Configure Twilio webhooks
     */
    private static function configureTwilioWebhooks(string $sid, string $voiceUrl, string $smsUrl, string $statusUrl, array $config): void {
        $accountSid = $config['accountSid'];
        $authToken = $config['authToken'];
        
        $url = "https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/IncomingPhoneNumbers/{$sid}.json";
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'VoiceUrl' => $voiceUrl,
            'VoiceMethod' => 'POST',
            'SmsUrl' => $smsUrl,
            'SmsMethod' => 'POST',
            'StatusCallback' => $statusUrl
        ]));
        curl_setopt($ch, CURLOPT_USERPWD, "{$accountSid}:{$authToken}");
        
        curl_exec($ch);
        curl_close($ch);
    }
    
    /**
     * Generate IVR menu response (TwiML/BXML)
     */
    public static function generateIvrResponse(int $menuId): string {
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM ivr_menus WHERE id = ?");
        $stmt->execute([$menuId]);
        $menu = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$menu) {
            return self::generateErrorResponse();
        }
        
        $config = json_decode($menu['menu_config'], true);
        $provider = $menu['provider'] ?? 'twilio';
        
        if ($provider === 'signalwire') {
            return self::generateBxml($config);
        }
        
        return self::generateTwiml($config);
    }
    
    /**
     * Generate TwiML response
     */
    private static function generateTwiml(array $config): string {
        $xml = '<?xml version="1.0" encoding="UTF-8"?><Response>';
        
        if (!empty($config['greeting'])) {
            $xml .= '<Say>' . htmlspecialchars($config['greeting']) . '</Say>';
        }
        
        if (!empty($config['options'])) {
            $xml .= '<Gather numDigits="1" action="' . htmlspecialchars($config['action_url'] ?? '') . '">';
            $xml .= '<Say>' . htmlspecialchars($config['prompt'] ?? 'Please select an option') . '</Say>';
            $xml .= '</Gather>';
        }
        
        $xml .= '</Response>';
        
        return $xml;
    }
    
    /**
     * Generate BXML response
     */
    private static function generateBxml(array $config): string {
        $xml = '<?xml version="1.0" encoding="UTF-8"?><Response>';
        
        if (!empty($config['greeting'])) {
            $xml .= '<SpeakSentence>' . htmlspecialchars($config['greeting']) . '</SpeakSentence>';
        }
        
        if (!empty($config['options'])) {
            $xml .= '<Gather gatherUrl="' . htmlspecialchars($config['action_url'] ?? '') . '" maxDigits="1">';
            $xml .= '<SpeakSentence>' . htmlspecialchars($config['prompt'] ?? 'Please select an option') . '</SpeakSentence>';
            $xml .= '</Gather>';
        }
        
        $xml .= '</Response>';
        
        return $xml;
    }
    
    /**
     * Generate error response
     */
    private static function generateErrorResponse(): string {
        return '<?xml version="1.0" encoding="UTF-8"?><Response><Say>We\'re sorry, an error occurred. Please try again later.</Say></Response>';
    }
    
    /**
     * Get provider configuration from database connections or environment variables
     */
    private static function getProviderConfig(): ?array {
        $db = Database::conn();
        
        // Get current workspace ID
        require_once __DIR__ . '/../Auth.php';
        $userId = Auth::userId();
        $workspaceId = null;
        
        if ($userId) {
            $workspaceId = Auth::workspaceId($userId);
        }
        
        // Try to get active SignalWire connection first
        if ($workspaceId) {
            $stmt = $db->prepare("SELECT * FROM connections WHERE provider = 'signalwire' AND status = 'active' AND (workspace_id = ? OR workspace_id IS NULL) ORDER BY workspace_id DESC, updated_at DESC LIMIT 1");
            $stmt->execute([$workspaceId]);
        } else {
            $stmt = $db->prepare("SELECT * FROM connections WHERE provider = 'signalwire' AND status = 'active' AND workspace_id IS NULL ORDER BY updated_at DESC LIMIT 1");
            $stmt->execute();
        }
        $connection = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($connection) {
            $config = json_decode($connection['config'], true);
            
            // Debug logging
            error_log("SignalWire connection found: " . json_encode([
                'id' => $connection['id'],
                'workspace_id' => $connection['workspace_id'] ?? 'NULL',
                'status' => $connection['status'],
                'has_projectId' => !empty($config['projectId']),
                'has_spaceUrl' => !empty($config['spaceUrl']),
                'has_apiToken' => !empty($config['apiToken'])
            ]));
            
            if (!empty($config['projectId']) && !empty($config['spaceUrl']) && !empty($config['apiToken'])) {
                return [
                    'provider' => 'signalwire',
                    'projectId' => $config['projectId'],
                    'spaceUrl' => $config['spaceUrl'],
                    'apiToken' => $config['apiToken'],
                    'appUrl' => $config['appUrl'] ?? getenv('APP_URL')
                ];
            } else {
                error_log("SignalWire connection incomplete - missing required fields");
            }
        } else {
            error_log("No active SignalWire connection found in database for workspace: " . ($workspaceId ?? 'NULL'));
        }
        
        // Try to get active Twilio connection
        if ($workspaceId) {
            $stmt = $db->prepare("SELECT * FROM connections WHERE provider = 'twilio' AND status = 'active' AND (workspace_id = ? OR workspace_id IS NULL) ORDER BY workspace_id DESC, updated_at DESC LIMIT 1");
            $stmt->execute([$workspaceId]);
        } else {
            $stmt = $db->prepare("SELECT * FROM connections WHERE provider = 'twilio' AND status = 'active' AND workspace_id IS NULL ORDER BY updated_at DESC LIMIT 1");
            $stmt->execute();
        }
        $connection = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($connection) {
            $config = json_decode($connection['config'], true);
            if (!empty($config['accountSid']) && !empty($config['authToken'])) {
                return [
                    'provider' => 'twilio',
                    'accountSid' => $config['accountSid'],
                    'authToken' => $config['authToken'],
                    'appUrl' => $config['appUrl'] ?? getenv('APP_URL')
                ];
            }
        }
        
        // Fall back to environment variables for backward compatibility
        $signalwireProjectId = getenv('SIGNALWIRE_PROJECT_ID');
        $signalwireSpaceUrl = getenv('SIGNALWIRE_SPACE_URL');
        $signalwireApiToken = getenv('SIGNALWIRE_API_TOKEN');
        
        if ($signalwireProjectId && $signalwireSpaceUrl && $signalwireApiToken) {
            return [
                'provider' => 'signalwire',
                'projectId' => $signalwireProjectId,
                'spaceUrl' => $signalwireSpaceUrl,
                'apiToken' => $signalwireApiToken,
                'appUrl' => getenv('APP_URL')
            ];
        }
        
        $twilioAccountSid = getenv('TWILIO_ACCOUNT_SID');
        $twilioAuthToken = getenv('TWILIO_AUTH_TOKEN');
        
        if ($twilioAccountSid && $twilioAuthToken) {
            return [
                'provider' => 'twilio',
                'accountSid' => $twilioAccountSid,
                'authToken' => $twilioAuthToken,
                'appUrl' => getenv('APP_URL')
            ];
        }
        
        return null;
    }
}
