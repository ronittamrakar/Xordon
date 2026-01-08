<?php
/**
 * SignalWire Connection Test Script
 * 
 * This script tests the SignalWire connection and verifies that the API credentials work.
 */

require_once 'backend/src/Database.php';

class SignalWireConnectionTester {
    private $db;
    private $projectId;
    private $spaceUrl;
    private $apiToken;
    
    public function __construct() {
        $this->db = Database::conn();
    }
    
    /**
     * Test SignalWire connection
     */
    public function testConnection() {
        echo "🧪 Testing SignalWire Connection\n";
        echo "================================\n\n";
        
        try {
            $this->loadSignalWireConfig();
            $this->testAccountInfo();
            $this->testAvailableNumbers();
            $this->testCallLogsAccess();
            
            echo "✅ All SignalWire connection tests passed!\n";
            return true;
            
        } catch (Exception $e) {
            echo "❌ Connection test failed: " . $e->getMessage() . "\n";
            return false;
        }
    }
    
    /**
     * Load SignalWire configuration from database
     */
    private function loadSignalWireConfig() {
        $stmt = $this->db->prepare("
            SELECT * FROM connections 
            WHERE provider = 'signalwire' AND status = 'active' 
            ORDER BY updated_at DESC LIMIT 1
        ");
        $stmt->execute();
        $connection = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$connection) {
            throw new Exception('No active SignalWire connection found in database.');
        }
        
        $config = json_decode($connection['config'] ?? '{}', true) ?: [];
        
        if (empty($config['projectId']) || empty($config['spaceUrl']) || empty($config['apiToken'])) {
            throw new Exception('SignalWire credentials incomplete.');
        }
        
        $this->projectId = $config['projectId'];
        $this->spaceUrl = $config['spaceUrl'];
        $this->apiToken = $config['apiToken'];
        
        echo "✓ SignalWire configuration loaded\n";
        echo "  Account ID: {$this->projectId}\n";
        echo "  Space URL: {$this->spaceUrl}\n\n";
    }
    
    /**
     * Test account information endpoint
     */
    private function testAccountInfo() {
        echo "🔍 Testing account information...\n";
        
        $url = "https://{$this->spaceUrl}/api/laml/2010-04-01/Accounts/{$this->projectId}.json";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Basic ' . base64_encode("{$this->projectId}:{$this->apiToken}"),
            'Content-Type: application/x-www-form-urlencoded'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);
        
        if ($error) {
            throw new Exception("cURL error: {$error}");
        }
        
        if ($httpCode !== 200) {
            throw new Exception("HTTP {$httpCode}: Failed to fetch account info");
        }
        
        $data = json_decode($response, true);
        
        if (empty($data)) {
            throw new Exception("Empty response from SignalWire API");
        }
        
        // SignalWire API returns different structure than Twilio
        // Check for account_sid in the response
        if (!isset($data['account_sid']) && !isset($data['sid'])) {
            // Log the actual response structure for debugging
            error_log("SignalWire account info response: " . print_r($data, true));
            throw new Exception("Invalid response structure from SignalWire API");
        }
        
        echo "✓ Account info retrieved successfully\n";
        echo "  Account SID: {$data['account_sid']}\n";
        echo "  Status: {$data['status']}\n\n";
    }
    
    /**
     * Test available numbers endpoint
     */
    private function testAvailableNumbers() {
        echo "📞 Testing available numbers...\n";
        
        $url = "https://{$this->spaceUrl}/api/laml/2010-04-01/Accounts/{$this->projectId}/AvailablePhoneNumbers/US/Local.json?PageSize=1";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Basic ' . base64_encode("{$this->projectId}:{$this->apiToken}"),
            'Content-Type: application/x-www-form-urlencoded'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);
        
        if ($error) {
            throw new Exception("cURL error: {$error}");
        }
        
        if ($httpCode !== 200) {
            throw new Exception("HTTP {$httpCode}: Failed to fetch available numbers");
        }
        
        $data = json_decode($response, true);
        
        if (empty($data) || !isset($data['available_phone_numbers'])) {
            throw new Exception("Invalid response from SignalWire API");
        }
        
        echo "✓ Available numbers endpoint working\n";
        echo "  Found " . count($data['available_phone_numbers']) . " available numbers\n\n";
    }
    
    /**
     * Test call logs access
     */
    private function testCallLogsAccess() {
        echo "📋 Testing call logs access...\n";
        
        $url = "https://{$this->spaceUrl}/api/laml/2010-04-01/Accounts/{$this->projectId}/Calls.json?PageSize=1";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Basic ' . base64_encode("{$this->projectId}:{$this->apiToken}"),
            'Content-Type: application/x-www-form-urlencoded'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);
        
        if ($error) {
            throw new Exception("cURL error: {$error}");
        }
        
        if ($httpCode !== 200) {
            throw new Exception("HTTP {$httpCode}: Failed to fetch call logs");
        }
        
        $data = json_decode($response, true);
        
        if (empty($data) || !isset($data['calls'])) {
            throw new Exception("Invalid response from SignalWire API");
        }
        
        echo "✓ Call logs endpoint working\n";
        echo "  Found " . count($data['calls']) . " recent calls\n\n";
    }
}

// Run the test
$tester = new SignalWireConnectionTester();
$tester->testConnection();