<?php
/**
 * SignalWire Call Logs Extractor
 * 
 * This script extracts call logs from SignalWire for specific phone numbers.
 * It connects to your database to get SignalWire credentials and then fetches
 * call logs from the SignalWire API.
 * 
 * Usage: php pull_signalwire_logs.php [number1] [number2] ...
 * Example: php pull_signalwire_logs.php +1234567890 +1234567891
 */

require_once 'backend/src/Database.php';
require_once 'backend/src/services/TelephonyConfig.php';

class SignalWireCallLogExtractor {
    private $db;
    private $projectId;
    private $spaceUrl;
    private $apiToken;
    
    public function __construct() {
        $this->db = Database::conn();
        $this->loadSignalWireConfig();
    }
    
    /**
     * Load SignalWire configuration from database
     */
    private function loadSignalWireConfig() {
        try {
            // Try to get active SignalWire connection
            $stmt = $this->db->prepare("
                SELECT * FROM connections 
                WHERE provider = 'signalwire' AND status = 'active' 
                ORDER BY updated_at DESC LIMIT 1
            ");
            $stmt->execute();
            $connection = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$connection) {
                throw new Exception('No active SignalWire connection found in database. Please configure SignalWire in Settings > Connections.');
            }
            
            $config = json_decode($connection['config'] ?? '{}', true) ?: [];
            
            if (empty($config['projectId']) || empty($config['spaceUrl']) || empty($config['apiToken'])) {
                throw new Exception('SignalWire credentials incomplete. Please check your SignalWire connection configuration.');
            }
            
            $this->projectId = $config['projectId'];
            $this->spaceUrl = $config['spaceUrl'];
            $this->apiToken = $config['apiToken'];
            
            echo "✓ Connected to SignalWire account: {$this->projectId}\n";
            echo "✓ Space URL: {$this->spaceUrl}\n\n";
            
        } catch (Exception $e) {
            echo "❌ Error loading SignalWire config: " . $e->getMessage() . "\n";
            exit(1);
        }
    }
    
    /**
     * Extract call logs for specific numbers
     */
    public function extractCallLogs(array $phoneNumbers, $startDate = null, $endDate = null) {
        if (empty($phoneNumbers)) {
            echo "❌ No phone numbers provided.\n";
            echo "Usage: php pull_signalwire_logs.php [number1] [number2] ...\n";
            echo "Example: php pull_signalwire_logs.php +1234567890 +1234567891\n";
            exit(1);
        }
        
        // Set default date range to last 30 days if not provided
        if (!$startDate) {
            $startDate = date('Y-m-d', strtotime('-30 days'));
        }
        if (!$endDate) {
            $endDate = date('Y-m-d', strtotime('+1 day'));
        }
        
        echo "📅 Date range: {$startDate} to {$endDate}\n";
        echo "📞 Numbers to check: " . implode(', ', $phoneNumbers) . "\n\n";
        
        $allLogs = [];
        
        foreach ($phoneNumbers as $phoneNumber) {
            echo "🔍 Fetching call logs for: {$phoneNumber}\n";
            
            try {
                $logs = $this->fetchCallLogsForNumber($phoneNumber, $startDate, $endDate);
                $allLogs[$phoneNumber] = $logs;
                
                echo "   ✓ Found " . count($logs) . " call(s)\n";
                
            } catch (Exception $e) {
                echo "   ❌ Error fetching logs for {$phoneNumber}: " . $e->getMessage() . "\n";
            }
        }
        
        return $allLogs;
    }
    
    /**
     * Fetch call logs for a specific number from SignalWire API
     */
    private function fetchCallLogsForNumber($phoneNumber, $startDate, $endDate) {
        $logs = [];
        $page = 0;
        $pageSize = 100;
        
        do {
            $url = "https://{$this->spaceUrl}/api/laml/2010-04-01/Accounts/{$this->projectId}/Calls.json";
            $url .= "?PageSize={$pageSize}&Page={$page}";
            $url .= "&StartTime>=" . urlencode($startDate);
            $url .= "&StartTime<=" . urlencode($endDate);
            
            // SignalWire API uses From or To parameters for filtering by number
            $url .= "&From=" . urlencode($phoneNumber);
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Basic ' . base64_encode("{$this->projectId}:{$this->apiToken}"),
                'Content-Type: application/x-www-form-urlencoded'
            ]);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
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
            
            if (empty($data)) {
                throw new Exception("Empty response from SignalWire API");
            }
            
            // SignalWire API returns different structure than Twilio
            // Check for calls array in the response
            if (!isset($data['calls']) && !isset($data['data'])) {
                // Log the actual response structure for debugging
                error_log("SignalWire calls response: " . print_r($data, true));
                throw new Exception("Invalid response structure from SignalWire API - no calls found");
            }
            
            // SignalWire might return calls in 'data' field instead of 'calls'
            $callsData = isset($data['calls']) ? $data['calls'] : (isset($data['data']) ? $data['data'] : []);
            
            // Filter logs for the specific number (both incoming and outgoing)
            foreach ($callsData as $call) {
                if ($call['from'] === $phoneNumber || $call['to'] === $phoneNumber) {
                    $logs[] = $this->formatCallLog($call);
                }
            }
            
            $page++;
            
        } while (count($data['calls']) === $pageSize && $page < 100); // Limit to 100 pages
        
        return $logs;
    }
    
    /**
     * Format SignalWire call data into a readable format
     */
    private function formatCallLog($call) {
        return [
            'call_sid' => $call['sid'] ?? '',
            'date_created' => $call['date_created'] ?? '',
            'date_updated' => $call['date_updated'] ?? '',
            'start_time' => $call['start_time'] ?? '',
            'end_time' => $call['end_time'] ?? '',
            'duration' => $call['duration'] ?? 0,
            'from_number' => $call['from'] ?? '',
            'to_number' => $call['to'] ?? '',
            'direction' => $call['direction'] ?? '',
            'status' => $call['status'] ?? '',
            'price' => $call['price'] ?? '',
            'price_unit' => $call['price_unit'] ?? '',
            'api_version' => $call['api_version'] ?? '',
            'forwarded_from' => $call['forwarded_from'] ?? '',
            'caller_name' => $call['caller_name'] ?? '',
            'parent_call_sid' => $call['parent_call_sid'] ?? '',
            'phone_number_sid' => $call['phone_number_sid'] ?? '',
            'trunk_sid' => $call['trunk_sid'] ?? '',
            'sip_response_code' => $call['sip_response_code'] ?? '',
            'account_sid' => $call['account_sid'] ?? '',
            'uri' => $call['uri'] ?? ''
        ];
    }
    
    /**
     * Display call logs in a formatted way
     */
    public function displayCallLogs(array $allLogs) {
        echo "\n" . str_repeat("=", 80) . "\n";
        echo "SIGNALWIRE CALL LOGS SUMMARY\n";
        echo str_repeat("=", 80) . "\n\n";
        
        $totalCalls = 0;
        
        foreach ($allLogs as $phoneNumber => $logs) {
            if (empty($logs)) {
                echo "📞 {$phoneNumber}: No calls found\n\n";
                continue;
            }
            
            $direction = isset($logs[0]['direction']) ? $logs[0]['direction'] : 'unknown';
            echo "📞 {$phoneNumber} ({$direction} calls)\n";
            echo str_repeat("-", 60) . "\n";
            
            foreach ($logs as $log) {
                $totalCalls++;
                $duration = $log['duration'] > 0 ? $log['duration'] . " seconds" : "N/A";
                $price = $log['price'] ? "$" . $log['price'] . " " . $log['price_unit'] : "Free";
                
                echo "  📋 Call SID: {$log['call_sid']}\n";
                echo "     📅 Date: {$log['date_created']}\n";
                echo "     🕐 Duration: {$duration}\n";
                echo "     📞 From: {$log['from_number']}\n";
                echo "     📞 To: {$log['to_number']}\n";
                echo "     🏷️  Status: {$log['status']}\n";
                echo "     💰 Cost: {$price}\n";
                echo "     🔄 Direction: {$log['direction']}\n";
                echo "\n";
            }
            
            echo "   Total calls for {$phoneNumber}: " . count($logs) . "\n\n";
        }
        
        echo "📊 SUMMARY\n";
        echo str_repeat("-", 30) . "\n";
        echo "Total phone numbers checked: " . count($allLogs) . "\n";
        echo "Total calls found: {$totalCalls}\n\n";
    }
    
    /**
     * Export call logs to CSV file
     */
    public function exportToCSV(array $allLogs, $filename = null) {
        if (!$filename) {
            $filename = 'signalwire_call_logs_' . date('Y-m-d_H-i-s') . '.csv';
        }
        
        $file = fopen($filename, 'w');
        
        // Write CSV headers
        $headers = [
            'Call SID', 'Date Created', 'Date Updated', 'Start Time', 'End Time',
            'Duration', 'From Number', 'To Number', 'Direction', 'Status',
            'Price', 'Price Unit', 'API Version', 'Forwarded From', 'Caller Name',
            'Parent Call SID', 'Phone Number SID', 'Trunk SID', 'SIP Response Code',
            'Account SID', 'URI'
        ];
        
        fputcsv($file, $headers);
        
        // Write data
        foreach ($allLogs as $phoneNumber => $logs) {
            foreach ($logs as $log) {
                fputcsv($file, [
                    $log['call_sid'],
                    $log['date_created'],
                    $log['date_updated'],
                    $log['start_time'],
                    $log['end_time'],
                    $log['duration'],
                    $log['from_number'],
                    $log['to_number'],
                    $log['direction'],
                    $log['status'],
                    $log['price'],
                    $log['price_unit'],
                    $log['api_version'],
                    $log['forwarded_from'],
                    $log['caller_name'],
                    $log['parent_call_sid'],
                    $log['phone_number_sid'],
                    $log['trunk_sid'],
                    $log['sip_response_code'],
                    $log['account_sid'],
                    $log['uri']
                ]);
            }
        }
        
        fclose($file);
        
        echo "📁 Exported call logs to: {$filename}\n";
        return $filename;
    }
}

// Main execution
try {
    $extractor = new SignalWireCallLogExtractor();
    
    // Get phone numbers from command line arguments
    $phoneNumbers = array_slice($argv, 1);
    
    // Optional: Add date range parameters
    $startDate = null;
    $endDate = null;
    
    // Check for date parameters
    $args = $argv;
    array_shift($args); // Remove script name
    
    foreach ($args as $arg) {
        if (preg_match('/^start=(\d{4}-\d{2}-\d{2})$/', $arg, $matches)) {
            $startDate = $matches[1];
        } elseif (preg_match('/^end=(\d{4}-\d{2}-\d{2})$/', $arg, $matches)) {
            $endDate = $matches[1];
        }
    }
    
    // Remove date parameters from phone numbers
    $phoneNumbers = array_filter($args, function($arg) {
        return !preg_match('/^(start|end)=\d{4}-\d{2}-\d{2}$/', $arg);
    });
    
    echo "🚀 SignalWire Call Logs Extractor\n";
    echo "================================\n\n";
    
    // Extract call logs
    $allLogs = $extractor->extractCallLogs($phoneNumbers, $startDate, $endDate);
    
    // Display results
    $extractor->displayCallLogs($allLogs);
    
    // Export to CSV
    $csvFile = $extractor->exportToCSV($allLogs);
    
    echo "✅ Process completed successfully!\n";
    echo "📄 CSV file: {$csvFile}\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}