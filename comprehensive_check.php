<?php
/**
 * Comprehensive System Check
 * Tests all major features and database tables
 */

require_once __DIR__ . '/backend/src/Config.php';
require_once __DIR__ . '/backend/src/Database.php';

class SystemCheck {
    private $db;
    private $results = [];
    private $errors = [];
    
    public function __construct() {
        try {
            $this->db = Database::conn();
            $this->results['database'] = ['status' => 'connected', 'message' => 'Database connected successfully'];
        } catch (Exception $e) {
            $this->errors[] = "Database connection failed: " . $e->getMessage();
            $this->results['database'] = ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
    
    public function checkTables() {
        echo "\n=== CHECKING DATABASE TABLES ===\n";
        
        $criticalTables = [
            'users', 'workspaces', 'workspace_members', 'roles', 'permissions',
            'contacts', 'leads', 'deals', 'campaigns', 'automations',
            'workflows', 'webforms', 'websites', 'proposals', 'invoices',
            'tickets', 'kb_categories', 'kb_articles', 'projects', 'tasks',
            'files', 'folders', 'appointments', 'calendars', 'phone_numbers',
            'call_logs', 'sms_messages', 'email_campaigns', 'sequences',
            'integrations', 'webhooks', 'api_keys', 'agencies', 'sub_accounts'
        ];
        
        foreach ($criticalTables as $table) {
            try {
                $stmt = $this->db->query("SELECT COUNT(*) as count FROM `$table`");
                $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
                $this->results['tables'][$table] = [
                    'status' => 'ok',
                    'count' => $count
                ];
                echo "✓ $table: $count records\n";
            } catch (Exception $e) {
                $this->results['tables'][$table] = [
                    'status' => 'error',
                    'message' => $e->getMessage()
                ];
                echo "✗ $table: ERROR - " . $e->getMessage() . "\n";
                $this->errors[] = "Table $table: " . $e->getMessage();
            }
        }
    }
    
    public function checkAPIEndpoints() {
        echo "\n=== CHECKING API ENDPOINTS ===\n";
        
        $endpoints = [
            '/api/health' => 'GET',
            '/api/auth/me' => 'GET',
            '/api/workspaces' => 'GET',
            '/api/contacts' => 'GET',
            '/api/campaigns' => 'GET',
            '/api/automations' => 'GET',
            '/api/webforms' => 'GET',
            '/api/websites' => 'GET',
            '/api/proposals' => 'GET',
            '/api/tickets' => 'GET',
            '/api/projects' => 'GET',
            '/api/files' => 'GET',
        ];
        
        foreach ($endpoints as $endpoint => $method) {
            $url = "http://localhost:8001$endpoint";
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            $status = ($httpCode >= 200 && $httpCode < 500) ? 'ok' : 'error';
            $this->results['endpoints'][$endpoint] = [
                'status' => $status,
                'http_code' => $httpCode
            ];
            
            $icon = $status === 'ok' ? '✓' : '✗';
            echo "$icon $method $endpoint: HTTP $httpCode\n";
            
            if ($status === 'error') {
                $this->errors[] = "Endpoint $endpoint returned HTTP $httpCode";
            }
        }
    }
    
    public function checkFileStructure() {
        echo "\n=== CHECKING FILE STRUCTURE ===\n";
        
        $criticalPaths = [
            'backend/src/Config.php',
            'backend/src/Database.php',
            'backend/src/controllers',
            'backend/public/index.php',
            'src/App.tsx',
            'src/main.tsx',
            'src/lib/api.ts',
            'src/contexts/UnifiedAppContext.tsx',
            'src/routes',
            'src/pages',
            'src/components',
            'package.json',
            'vite.config.ts',
        ];
        
        foreach ($criticalPaths as $path) {
            $fullPath = __DIR__ . '/' . $path;
            $exists = file_exists($fullPath);
            
            $this->results['files'][$path] = [
                'status' => $exists ? 'ok' : 'missing'
            ];
            
            $icon = $exists ? '✓' : '✗';
            echo "$icon $path\n";
            
            if (!$exists) {
                $this->errors[] = "Missing critical file/directory: $path";
            }
        }
    }
    
    public function checkDatabaseSchema() {
        echo "\n=== CHECKING DATABASE SCHEMA ===\n";
        
        $schemaChecks = [
            'users' => ['id', 'email', 'password', 'name', 'role_id'],
            'workspaces' => ['id', 'name', 'owner_id', 'created_at'],
            'contacts' => ['id', 'workspace_id', 'email', 'first_name', 'last_name'],
            'campaigns' => ['id', 'workspace_id', 'name', 'type', 'status'],
            'webforms' => ['id', 'workspace_id', 'name', 'fields'],
            'websites' => ['id', 'workspace_id', 'name', 'sections'],
            'tickets' => ['id', 'workspace_id', 'subject', 'status', 'priority'],
            'files' => ['id', 'workspace_id', 'filename', 'filepath', 'folder_id'],
        ];
        
        foreach ($schemaChecks as $table => $columns) {
            try {
                $stmt = $this->db->query("SHOW COLUMNS FROM `$table`");
                $existingColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);
                
                $missingColumns = array_diff($columns, $existingColumns);
                
                if (empty($missingColumns)) {
                    echo "✓ $table: All required columns present\n";
                    $this->results['schema'][$table] = ['status' => 'ok'];
                } else {
                    echo "⚠ $table: Missing columns - " . implode(', ', $missingColumns) . "\n";
                    $this->results['schema'][$table] = [
                        'status' => 'warning',
                        'missing_columns' => $missingColumns
                    ];
                    $this->errors[] = "Table $table missing columns: " . implode(', ', $missingColumns);
                }
            } catch (Exception $e) {
                echo "✗ $table: ERROR - " . $e->getMessage() . "\n";
                $this->results['schema'][$table] = [
                    'status' => 'error',
                    'message' => $e->getMessage()
                ];
            }
        }
    }
    
    public function checkIntegrations() {
        echo "\n=== CHECKING INTEGRATIONS ===\n";
        
        try {
            $stmt = $this->db->query("SELECT name, status FROM integrations LIMIT 20");
            $integrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($integrations)) {
                echo "ℹ No integrations configured\n";
                $this->results['integrations'] = ['status' => 'empty', 'count' => 0];
            } else {
                foreach ($integrations as $integration) {
                    $icon = $integration['status'] === 'active' ? '✓' : '○';
                    echo "$icon {$integration['name']}: {$integration['status']}\n";
                }
                $this->results['integrations'] = ['status' => 'ok', 'count' => count($integrations)];
            }
        } catch (Exception $e) {
            echo "✗ Error checking integrations: " . $e->getMessage() . "\n";
            $this->results['integrations'] = ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
    
    public function checkWorkspaces() {
        echo "\n=== CHECKING WORKSPACES ===\n";
        
        try {
            $stmt = $this->db->query("
                SELECT w.id, w.name, w.owner_id, COUNT(wm.id) as member_count
                FROM workspaces w
                LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
                GROUP BY w.id
                LIMIT 10
            ");
            $workspaces = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($workspaces)) {
                echo "⚠ No workspaces found\n";
                $this->results['workspaces'] = ['status' => 'warning', 'count' => 0];
                $this->errors[] = "No workspaces found in database";
            } else {
                foreach ($workspaces as $ws) {
                    echo "✓ Workspace #{$ws['id']}: {$ws['name']} ({$ws['member_count']} members)\n";
                }
                $this->results['workspaces'] = ['status' => 'ok', 'count' => count($workspaces)];
            }
        } catch (Exception $e) {
            echo "✗ Error checking workspaces: " . $e->getMessage() . "\n";
            $this->results['workspaces'] = ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
    
    public function generateReport() {
        echo "\n\n";
        echo "========================================\n";
        echo "     COMPREHENSIVE SYSTEM REPORT\n";
        echo "========================================\n\n";
        
        $totalChecks = 0;
        $passedChecks = 0;
        $failedChecks = 0;
        $warnings = 0;
        
        foreach ($this->results as $category => $data) {
            if (is_array($data) && isset($data['status'])) {
                $totalChecks++;
                if ($data['status'] === 'ok' || $data['status'] === 'connected') {
                    $passedChecks++;
                } elseif ($data['status'] === 'warning' || $data['status'] === 'empty') {
                    $warnings++;
                } else {
                    $failedChecks++;
                }
            } elseif (is_array($data)) {
                foreach ($data as $item => $itemData) {
                    $totalChecks++;
                    if (isset($itemData['status'])) {
                        if ($itemData['status'] === 'ok') {
                            $passedChecks++;
                        } elseif ($itemData['status'] === 'warning') {
                            $warnings++;
                        } else {
                            $failedChecks++;
                        }
                    }
                }
            }
        }
        
        echo "Total Checks: $totalChecks\n";
        echo "✓ Passed: $passedChecks\n";
        echo "⚠ Warnings: $warnings\n";
        echo "✗ Failed: $failedChecks\n\n";
        
        if (!empty($this->errors)) {
            echo "ERRORS FOUND:\n";
            echo "-------------\n";
            foreach ($this->errors as $i => $error) {
                echo ($i + 1) . ". $error\n";
            }
            echo "\n";
        }
        
        $healthScore = $totalChecks > 0 ? round(($passedChecks / $totalChecks) * 100, 2) : 0;
        echo "Overall Health Score: $healthScore%\n";
        
        if ($healthScore >= 90) {
            echo "Status: ✓ EXCELLENT - System is working well\n";
        } elseif ($healthScore >= 70) {
            echo "Status: ⚠ GOOD - Minor issues detected\n";
        } elseif ($healthScore >= 50) {
            echo "Status: ⚠ FAIR - Several issues need attention\n";
        } else {
            echo "Status: ✗ POOR - Critical issues detected\n";
        }
        
        echo "\n========================================\n\n";
        
        // Save detailed report to file
        file_put_contents(
            __DIR__ . '/system_check_report.json',
            json_encode($this->results, JSON_PRETTY_PRINT)
        );
        echo "Detailed report saved to: system_check_report.json\n";
    }
    
    public function runAll() {
        $this->checkFileStructure();
        $this->checkTables();
        $this->checkDatabaseSchema();
        $this->checkWorkspaces();
        $this->checkIntegrations();
        $this->checkAPIEndpoints();
        $this->generateReport();
    }
}

// Run the comprehensive check
$checker = new SystemCheck();
$checker->runAll();
