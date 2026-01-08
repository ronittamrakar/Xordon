<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Logger.php';
require_once __DIR__ . '/../services/RBACService.php';

class SystemHealthController {
    
    private static function isAdminOrFail(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        if (!$rbac->isAdmin($userId)) {
            \Xordon\Response::json(['error' => 'Unauthorized. Admin access required.'], 403);
            die();
        }
    }

    /**
     * Get comprehensive system health report
     * GET /api/system/health
     */
    public static function getHealth(): void {
        try {
            self::isAdminOrFail();
            
            $health = [
                'status' => 'healthy',
                'timestamp' => date('c'),
                'indicators' => [],
                'modules' => [],
                'recent_errors' => [],
                'recent_activity' => [],
                'active_sessions' => 0,
                'system_info' => [
                    'php_version' => PHP_VERSION,
                    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
                    'os' => PHP_OS,
                ],
                'environment' => self::getEnvironmentInfo(),
                'queue' => self::getQueueStats(),
                'performance' => self::getInternalPerformanceMetrics(),
            ];

            try {
                $pdo = \Xordon\Database::conn();
                
                // 1. Database Health
                $dbStatus = \Xordon\Database::getHealthStatus();
                $health['indicators']['database'] = [
                    'status' => $dbStatus['connected'] ? 'green' : 'red',
                    'message' => $dbStatus['message'],
                    'details' => $dbStatus
                ];
                
                if (!$dbStatus['connected']) {
                    $health['status'] = 'unhealthy';
                }

                // 2. Module Scanning
                $health['modules'] = self::scanModules($pdo);

                // 3. Recent Error Logs
                $health['recent_errors'] = self::getRecentErrors();

                // 4. Activity Feed (Audit Log)
                $health['recent_activity'] = self::getRecentActivity();

                // 5. Active Sessions (File based)
            try {
                $sessionPath = session_save_path();
                if (!$sessionPath) $sessionPath = sys_get_temp_dir();
                if (is_dir($sessionPath)) {
                    $health['active_sessions'] = count(glob($sessionPath . '/sess_*'));
                }
            } catch (Exception $e) {}

            // Overall Status Calculation
                $moduleErrors = count(array_filter($health['modules'], fn($m) => $m['status'] === 'red'));
                if ($moduleErrors > 0) {
                    $health['status'] = 'yellow';
                }
                if ($health['indicators']['database']['status'] === 'red') {
                    $health['status'] = 'red';
                }

                // Phase 4: Auto-save snapshot for trends
                self::saveSnapshot($health);

                \Xordon\Response::json([
                    'success' => true,
                    'data' => $health
                ]);
            } catch (Exception $e) {
                \Logger::error('SystemHealth::getHealth failed', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                
                \Xordon\Response::json([
                    'success' => false,
                    'error' => 'Failed to fetch system health: ' . $e->getMessage(),
                    'data' => $health // Return partial data
                ], 500);
            }
        } catch (Exception $e) {
            \Xordon\Response::json([
                'success' => false,
                'error' => $e->getMessage()
            ], 403);
        }
    }

    /**
     * Save a system health snapshot
     */
    private static function saveSnapshot(array $report): void {
        try {
            $pdo = \Xordon\Database::conn();
            $status = $report['status'];
            
            // Calculate a simple health score (0-100)
            $score = 100;
            if ($status === 'yellow') $score = 75;
            if ($status === 'red') $score = 25;
            if ($status === 'unhealthy') $score = 0;

            // Adjust score based on module status
            $totalModules = count($report['modules']);
            $healthyModules = count(array_filter($report['modules'], fn($m) => $m['status'] === 'green'));
            if ($totalModules > 0) {
                $moduleRatio = $healthyModules / $totalModules;
                $score = (int)($score * 0.7 + (100 * $moduleRatio) * 0.3);
            }

            $metrics = [
                'module_success_rate' => $totalModules > 0 ? round(($healthyModules / $totalModules) * 100, 2) : 100,
                'db_connected' => $report['indicators']['database']['status'] === 'green',
                'error_count' => count($report['recent_errors']),
                'cpu_usage' => $report['performance']['cpu']['current'] ?? 0,
                'cpu_cores' => $report['performance']['cpu']['cores'] ?? 0,
                'mem_usage' => $report['performance']['memory']['percent'] ?? 0,
                'disk_usage' => $report['performance']['disk']['percent'] ?? 0
            ];

            $stmt = $pdo->prepare('INSERT INTO system_health_snapshots (status, score, metrics) VALUES (?, ?, ?)');
            $stmt->execute([$status, $score, json_encode($metrics)]);
            
            // Keep only last 100 snapshots to prevent bloat
            $pdo->exec('DELETE FROM system_health_snapshots WHERE id NOT IN (SELECT id FROM (SELECT id FROM system_health_snapshots ORDER BY created_at DESC LIMIT 100) as t)');
        } catch (Exception $e) {
            // Silently fail to not block the main health check
            error_log("Failed to save health snapshot: " . $e->getMessage());
        }
    }

    /**
     * Get historical health trends
     * GET /api/system/trends
     */
    public static function getTrends(): void {
        try {
            self::isAdminOrFail();
            
            try {
                $pdo = \Xordon\Database::conn();
                $stmt = $pdo->query('SELECT score, status, metrics, created_at as timestamp FROM system_health_snapshots ORDER BY created_at ASC LIMIT 50');
                $trends = $stmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($trends as &$trend) {
                    if ($trend['metrics']) {
                        $trend['metrics'] = json_decode($trend['metrics'], true);
                    }
                }

                \Xordon\Response::json([
                    'success' => true,
                    'data' => $trends
                ]);
            } catch (Exception $e) {
                \Logger::error('SystemHealth::getTrends failed', [
                    'error' => $e->getMessage()
                ]);
                \Xordon\Response::json([
                    'success' => false,
                    'error' => 'Failed to fetch trends: ' . $e->getMessage(),
                    'data' => []
                ], 500);
            }
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    /**
     * Get system connectivity map
     * GET /api/system/connectivity
     */
    public static function getConnectivity(): void {
        try {
            self::isAdminOrFail();
            
            try {
                $pdo = \Xordon\Database::conn();
                $nodes = [
                    ['id' => 'core_db', 'label' => 'Database Engine', 'type' => 'core', 'status' => 'green', 'details' => 'MySQL/MariaDB'],
                    ['id' => 'core_php', 'label' => 'PHP Runtime', 'type' => 'core', 'status' => 'green', 'details' => PHP_VERSION],
                    ['id' => 'core_fs', 'label' => 'File System', 'type' => 'core', 'status' => 'green', 'details' => 'Local Storage'],
                    ['id' => 'core_queue', 'label' => 'Queue Worker', 'type' => 'core', 'status' => 'green', 'details' => 'Supervisor/Cron']
                ];

                // Fetch connections (with table existence check)
                try {
                    $stmt = $pdo->query('SELECT * FROM connections WHERE status = "active" LIMIT 20');
                    $connections = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($connections as $conn) {
                        $nodes[] = [
                            'id' => 'conn_' . $conn['id'],
                            'label' => $conn['name'],
                            'type' => 'connection',
                            'status' => 'green',
                            'details' => $conn['type'] ?? 'connection'
                        ];
                    }
                } catch (Exception $e) {
                    // Table might not exist, skip
                }

                // Fetch integrations (with table existence check)
                try {
                    $stmt = $pdo->query('SELECT * FROM integrations LIMIT 20');
                    $integrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($integrations as $int) {
                        $nodes[] = [
                            'id' => 'int_' . $int['id'],
                            'label' => $int['name'],
                            'type' => $int['type'] ?? 'integration',
                            'status' => $int['status'] === 'active' ? 'green' : ($int['status'] === 'error' ? 'red' : 'yellow'),
                            'last_active' => $int['updated_at'] ?? null
                        ];
                    }
                } catch (Exception $e) {
                    // Table might not exist, skip
                }

                \Xordon\Response::json([
                    'success' => true,
                    'nodes' => $nodes
                ]);
            } catch (Exception $e) {
                \Logger::error('SystemHealth::getConnectivity failed', [
                    'error' => $e->getMessage()
                ]);
                \Xordon\Response::json([
                    'success' => false,
                    'error' => 'Failed to fetch connectivity: ' . $e->getMessage(),
                    'nodes' => []
                ], 500);
            }
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    /**
     * Get security events (audit logs)
     * GET /api/system/security/events
     */
    public static function getSecurityEvents(): void {
        try {
            self::isAdminOrFail();
            
            $rbac = \RBACService::getInstance();
            $logs = $rbac->getAuditLog([], 20, 0); // Get last 20 events
            
            // Map to SecurityEvent interface expected by frontend
            $events = array_map(function($log) {
                return [
                    'id' => (string)$log['id'],
                    'type' => $log['action'], // map action to type
                    'severity' => in_array($log['action'], ['login_failed', 'unauthorized_access']) ? 'high' : 'low',
                    'message' => self::formatSecurityMessage($log),
                    'timestamp' => $log['created_at'],
                    'ip_address' => $log['ip_address'],
                    'location' => 'Unknown', // No geoip yet
                    'status' => 'detected'
                ];
            }, $logs);

            \Xordon\Response::json([
                'success' => true,
                'data' => $events
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    private static function formatSecurityMessage(array $log): string {
        $actor = $log['actor_name'] ?: ($log['actor_email'] ?: 'System');
        $action = str_replace('_', ' ', $log['action']);
        return ucfirst("$actor performed $action");
    }

    /**
     * Get security statistics
     * GET /api/system/security/stats
     */
    public static function getSecurityStats(): void {
        try {
            self::isAdminOrFail();
            $pdo = \Xordon\Database::conn();
            
            // Summary stats from rbac_audit_log
            // Total events
            $stmt = $pdo->query("SELECT COUNT(*) FROM rbac_audit_log");
            $totalEvents = $stmt->fetchColumn();
            
            // Failed logins (assuming action='login_failed' is used, otherwise count specific error actions)
            $stmt = $pdo->query("SELECT COUNT(*) FROM rbac_audit_log WHERE action = 'login_failed'");
            $failedLogins = $stmt->fetchColumn();
            
            // Unique IPs
            $stmt = $pdo->query("SELECT COUNT(DISTINCT ip_address) FROM rbac_audit_log WHERE ip_address IS NOT NULL");
            $uniqueIps = $stmt->fetchColumn();
            
            // Top IPs
            $stmt = $pdo->query("SELECT ip_address, COUNT(*) as count FROM rbac_audit_log WHERE ip_address IS NOT NULL GROUP BY ip_address ORDER BY count DESC LIMIT 5");
            $topIps = $stmt->fetchAll(PDO::FETCH_ASSOC);

            \Xordon\Response::json([
                'success' => true,
                'data' => [
                    'summary' => [
                        'total_events' => (int)$totalEvents,
                        'rate_limit_blocks' => 0, // Not tracked yet
                        'failed_logins' => (int)$failedLogins,
                        'unique_ips' => (int)$uniqueIps
                    ],
                    'top_ips' => $topIps
                ]
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    private static function scanModules($pdo): array {
        $modules = [
            ['id' => 'crm', 'name' => 'CRM & Leads', 'tables' => ['leads', 'lead_activities', 'crm_tasks', 'lead_tags']],
            ['id' => 'pipelines', 'name' => 'Pipelines', 'tables' => ['pipelines', 'pipeline_stages']],
            ['id' => 'automations', 'name' => 'Automations', 'tables' => ['workflows', 'workflow_nodes', 'workflow_connections']],
            ['id' => 'funnels', 'name' => 'Funnels', 'tables' => ['funnels', 'funnel_steps']],
            ['id' => 'outreach', 'name' => 'Email Outreach', 'tables' => ['campaigns', 'recipients', 'sending_accounts', 'sequences']],
            ['id' => 'reputation', 'name' => 'Reputation', 'tables' => ['reviews', 'review_requests']],
            ['id' => 'agency', 'name' => 'Agency & SaaS', 'tables' => ['client_accounts', 'agency_reports', 'billing_plans', 'workspace_subscriptions', 'snapshots']],
            ['id' => 'ai', 'name' => 'AI Analytics', 'tables' => ['ai_analytics_insights', 'ai_chatbot_conversations']],
            ['id' => 'marketplace', 'name' => 'Marketplace', 'tables' => ['service_catalog', 'lead_matches', 'credits_wallets']],
        ];

        $results = [];
        foreach ($modules as $module) {
            $existingTables = 0;
            $missingTables = [];
            foreach ($module['tables'] as $table) {
                if (self::tableExists($pdo, $table)) {
                    $existingTables++;
                } else {
                    $missingTables[] = $table;
                }
            }

            $status = 'green';
            if ($existingTables === 0) {
                $status = 'red';
            } elseif ($existingTables < count($module['tables'])) {
                $status = 'yellow';
            }

            $results[] = [
                'id' => $module['id'],
                'name' => $module['name'],
                'status' => $status,
                'tables_count' => count($module['tables']),
                'tables_found' => $existingTables,
                'missing_tables' => $missingTables,
                'last_activity' => self::getLastTableActivity($pdo, $module['tables'])
            ];
        }

        return $results;
    }

    private static function tableExists($pdo, $table): bool {
        try {
            $results = $pdo->query("SHOW TABLES LIKE '$table'");
            return $results && $results->rowCount() > 0;
        } catch (Exception $e) {
            return false;
        }
    }

    private static function getLastTableActivity($pdo, $tables): ?string {
        if (empty($tables)) return null;
        
        try {
            $stmt = $pdo->prepare("
                SELECT MAX(UPDATE_TIME) as last_update 
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME IN (" . implode(',', array_fill(0, count($tables), '?')) . ")
            ");
            $stmt->execute($tables);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['last_update'] ?? null;
        } catch (Exception $e) {
            return null;
        }
    }

    private static function getRecentErrors(): array {
        try {
            $logDir = __DIR__ . '/../../logs';
            if (!is_dir($logDir)) {
                return [];
            }
            
            $logFiles = glob($logDir . '/*.log');
            if (empty($logFiles)) {
                return [];
            }
            
            // Get the most recent log file
            usort($logFiles, fn($a, $b) => filemtime($b) - filemtime($a));
            $latestLog = $logFiles[0];
            
            if (!file_exists($latestLog)) {
                return [];
            }
            
            // Read last 10KB of the file
            $fileSize = filesize($latestLog);
            $readSize = min($fileSize, 10 * 1024);
            $fp = fopen($latestLog, 'r');
            if ($fileSize > $readSize) {
                fseek($fp, $fileSize - $readSize);
            }
            $content = fread($fp, $readSize);
            fclose($fp);
            
            if (!$content) {
                return [];
            }
            
            $lines = explode("\n", trim($content));
            $errors = [];
            foreach ($lines as $line) {
                if (stripos($line, 'error') !== false || stripos($line, 'critical') !== false) {
                    $errors[] = $line;
                }
            }
            return array_slice($errors, -5);
        } catch (Exception $e) {
            return [];
        }
    }

    private static function getRecentActivity(): array {
        try {
            $rbac = \RBACService::getInstance();
            $logs = $rbac->getAuditLog([], 10, 0);
            
            $formatted = [];
            foreach ($logs as $log) {
                $description = ($log['actor_name'] ?: 'System') . ' performed ' . str_replace('_', ' ', $log['action']);
                if ($log['target_type']) {
                    $description .= ' on ' . $log['target_type'];
                }
                
                $formatted[] = [
                    'description' => $description,
                    'created_at' => $log['created_at']
                ];
            }
            return $formatted;
        } catch (Exception $e) {
            return [];
        }
    }
    
    /**
     * Run high-level system diagnostics
     * POST /api/system/diagnostics
     */
    /**
     * Run high-level system diagnostics
     * POST /api/system/diagnostics
     */
    public static function runDiagnostics(): void {
        try {
            self::isAdminOrFail();
            
            $findings = [];
            $pdo = \Xordon\Database::conn();
            $rootPath = realpath(__DIR__ . '/../../');

            // 1. Check for missing tables (Module Scan)
            try {
                $modules = self::scanModules($pdo);
                foreach ($modules as $module) {
                    if ($module['status'] !== 'green') {
                        foreach ($module['missing_tables'] as $table) {
                            $findings[] = [
                                'id' => 'missing_table_' . $table,
                                'severity' => ($module['status'] === 'red' ? 'high' : 'medium'),
                                'category' => 'database',
                                'message' => "Missing table '$table' in module '{$module['name']}'",
                                'can_fix' => true,
                                'fix_action' => 'run_migration',
                                'fix_params' => ['table' => $table]
                            ];
                        }
                    }
                }
            } catch (Exception $e) {
                \Logger::error('Diagnostics: Module scan failed', ['error' => $e->getMessage()]);
            }

            // 2. Check for oversized logs
            try {
                $logDir = $rootPath . '/logs';
                if (is_dir($logDir)) {
                    $logFiles = glob($logDir . '/*.log');
                    foreach ($logFiles as $filePath) {
                        $file = basename($filePath);
                        if (file_exists($filePath) && filesize($filePath) > 10 * 1024 * 1024) { // >10MB
                            $findings[] = [
                                'id' => 'oversized_log_' . $file,
                                'severity' => 'low',
                                'category' => 'system',
                                'message' => "Log file '$file' is oversized (" . round(filesize($filePath) / 1024 / 1024, 2) . "MB)",
                                'can_fix' => true,
                                'fix_action' => 'rotate_log',
                                'fix_params' => ['file' => $file]
                            ];
                        }
                    }
                }
            } catch (Exception $e) { /* Ignore */ }

            // 3. Database Integrity & Performance
            try {
                // Fragmentation
                $stmt = $pdo->query("
                    SELECT TABLE_NAME, DATA_FREE 
                    FROM information_schema.TABLES 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND DATA_FREE > 10485760
                    LIMIT 1
                ");
                if ($stmt && $stmt->rowCount() > 0) {
                    $findings[] = [
                        'id' => 'db_optimization',
                        'severity' => 'low',
                        'category' => 'database',
                        'message' => "Database tables have fragmentation > 10MB",
                        'can_fix' => true,
                        'fix_action' => 'optimize_tables',
                        'fix_params' => []
                    ];
                }

                // Connection Latency Check
                $start = microtime(true);
                $pdo->query("SELECT 1");
                $latency = (microtime(true) - $start) * 1000; // ms
                if ($latency > 500) { // > 500ms is slow for local query
                    $findings[] = [
                        'id' => 'db_latency_high',
                        'severity' => 'medium',
                        'category' => 'database',
                        'message' => "High Database Latency: " . round($latency, 2) . "ms",
                        'can_fix' => false,
                    ];
                }
            } catch (Exception $e) {
                $findings[] = [
                    'id' => 'db_connection_fail',
                    'severity' => 'high',
                    'category' => 'database',
                    'message' => "Database Connection Failed: " . $e->getMessage(),
                    'can_fix' => false,
                ];
            }

            // 4. Check Disk Space (System & App)
            $diskFree = disk_free_space($rootPath);
            $diskTotal = disk_total_space($rootPath);
            $diskFreeGB = round($diskFree / 1024 / 1024 / 1024, 2);
            $diskPercent = round(($diskFree / $diskTotal) * 100);
            
            // Critical if < 1GB OR < 1% (very full)
            if ($diskFree < 1024 * 1024 * 1024 || $diskPercent < 1) {
                $findings[] = [
                    'id' => 'disk_space_critical',
                    'severity' => 'high',
                    'category' => 'system',
                    'message' => "Critical System Disk Space: {$diskFreeGB}GB free ({$diskPercent}%)",
                    'can_fix' => false,
                ];
            } elseif ($diskFree < 5 * 1024 * 1024 * 1024 && $diskPercent < 10) { // Warning if < 5GB and < 10%
                $findings[] = [
                    'id' => 'disk_space_warning',
                    'severity' => 'medium',
                    'category' => 'system',
                    'message' => "Low System Disk Space: {$diskFreeGB}GB free ({$diskPercent}%)",
                    'can_fix' => false,
                ];
            }

            // App Size Check
            $appSizeVal = self::getDirSize($rootPath); 
            if ($appSizeVal > 5 * 1024 * 1024 * 1024) {
                 $findings[] = [
                    'id' => 'app_size_bloat',
                    'severity' => 'medium',
                    'category' => 'system',
                    'message' => "Application size is large (" . round($appSizeVal / 1024 / 1024 / 1024, 2) . "GB). Consider cleaning old backups or logs.",
                    'can_fix' => false,
                ];
            }

            // 5. Check PHP Extensions
            $requiredExtensions = ['curl', 'mbstring', 'pdo_mysql', 'json', 'openssl', 'xml', 'zip'];
            foreach ($requiredExtensions as $ext) {
                if (!extension_loaded($ext)) {
                    $findings[] = [
                        'id' => 'missing_ext_' . $ext,
                        'severity' => 'high',
                        'category' => 'config',
                        'message' => "Required PHP extension '$ext' is not loaded",
                        'can_fix' => false,
                    ];
                }
            }

            // 6. Check Directory Permissions
            $criticalDirs = [
                $rootPath . '/logs' => 'writable',
                $rootPath . '/cache' => 'writable',
                $rootPath . '/public/uploads' => 'writable',
                $rootPath . '/storage' => 'writable'
            ];
            
            foreach ($criticalDirs as $dir => $check) {
                if (file_exists($dir)) {
                    if ($check === 'writable' && !is_writable($dir)) {
                         $findings[] = [
                            'id' => 'perm_error_' . basename($dir),
                            'severity' => 'high',
                            'category' => 'security',
                            'message' => "Directory '" . basename($dir) . "' is not writable",
                            'can_fix' => false,
                        ];
                    }
                } else {
                    // Try to create if missing (e.g. cache)
                    if (basename($dir) === 'cache' || basename($dir) === 'logs') {
                        @mkdir($dir, 0755, true);
                        if (!is_dir($dir)) {
                             $findings[] = [
                                'id' => 'missing_dir_' . basename($dir),
                                'severity' => 'medium',
                                'category' => 'config',
                                'message' => "Required directory '" . basename($dir) . "' is missing and could not be created",
                                'can_fix' => false,
                            ];
                        }
                    }
                }
            }

            // 7. Check Critical Environment Variables
            // Only check DB vars if DB connection failed earlier, otherwise we know they work.
            // We use the fact that $pdo was initialized at the top
            // Changed APP_KEY to JWT_SECRET and DB vars to match Config.php usage
            $criticalVars = ['JWT_SECRET'];
            if (!$pdo) {
                array_push($criticalVars, 'DB_HOST', 'DB_NAME', 'DB_USER');
            }
            
            $missingVars = [];
            foreach ($criticalVars as $var) {
                // Robust check: getenv, $_ENV, $_SERVER
                $val = getenv($var);
                if ($val === false) $val = $_ENV[$var] ?? null;
                if ($val === null) $val = $_SERVER[$var] ?? null;
                
                if (empty($val)) {
                    $missingVars[] = $var;
                }
            }
            if (!empty($missingVars)) {
                $findings[] = [
                    'id' => 'missing_env_vars',
                    'severity' => 'high',
                    'category' => 'config',
                    'message' => "Critical environment variables missing: " . implode(', ', $missingVars),
                    'can_fix' => false,
                ];
            }

            // 8. Queue Health (Failed Jobs)
            try {
                // Check if jobs_queue table exists first (it should)
                $stmt = $pdo->query("SHOW TABLES LIKE 'jobs_queue'");
                 if ($stmt->rowCount() > 0) {
                     $stmt = $pdo->query("SELECT COUNT(*) FROM jobs_queue WHERE status = 'failed'");
                     $failedCount = (int)$stmt->fetchColumn();
                     if ($failedCount > 0) {
                         $findings[] = [
                            'id' => 'failed_jobs',
                            'severity' => 'medium',
                            'category' => 'queue',
                            'message' => "$failedCount jobs have failed in the queue",
                            'can_fix' => true,
                            'fix_action' => 'flush_failed_jobs',
                            'fix_params' => []
                        ];
                     }
                }
            } catch (Exception $e) {}

            // 9. Timezone Synchronization
            // Compare UNIX timestamps to avoid timezone display differences
            try {
                $dbTimeStmt = $pdo->query("SELECT UNIX_TIMESTAMP()");
                $dbTimestamp = (int)$dbTimeStmt->fetchColumn();
                $appTimestamp = time();
                $diff = abs($dbTimestamp - $appTimestamp);
                
                if ($diff > 600) { // 10 minutes drift is huge
                     $findings[] = [
                        'id' => 'timezone_mismatch',
                        'severity' => 'medium',
                        'category' => 'config',
                        'message' => "System clock drift: DB time differs from App time by " . round($diff/60) . " mins",
                        'can_fix' => false,
                    ];
                }
            } catch (Exception $e) {}
            
            // 10. Security: Debug Mode in Production
            $appEnv = getenv('APP_ENV') ?: ($_ENV['APP_ENV'] ?? 'production');
            $appDebug = getenv('APP_DEBUG') ?: ($_ENV['APP_DEBUG'] ?? 'false');
            $appDebug = filter_var($appDebug, FILTER_VALIDATE_BOOLEAN);
            
            if ($appEnv === 'production' && $appDebug) {
                $findings[] = [
                    'id' => 'debug_in_prod',
                    'severity' => 'high',
                    'category' => 'security',
                    'message' => "Debug mode is enabled in Production environment!",
                    'can_fix' => true,
                    'fix_action' => 'disable_debug_mode',
                    'fix_params' => []
                ];
            }

            \Xordon\Response::json([
                'success' => true,
                'message' => count($findings) > 0 ? 'Diagnostics found ' . count($findings) . ' issues' : 'All systems operational',
                'findings' => $findings
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Perform an automated fix for a detected issue
     * POST /api/system/fix
     */
    public static function fixIssue(): void {
        self::isAdminOrFail();
        $body = get_json_body();
        $action = $body['action'] ?? null;
        $params = $body['params'] ?? [];

        if (!$action) {
            \Xordon\Response::error('Action is required');
            return;
        }

        try {
            $result = ['success' => false, 'message' => 'Action not implemented'];
            
            switch ($action) {
                case 'run_migration':
                    $table = $params['table'] ?? null;
                    if (!$table) {
                        throw new Exception("Table name is required");
                    }
                    
                    $migrationDir = __DIR__ . '/../../migrations';
                    $schemaFound = false;
                    $pdo = \Xordon\Database::conn();

                    // Get all SQL files, prioritizing likely candidates if possible (optional optimization)
                    $files = glob($migrationDir . '/*.sql');
                    // Move add_all_missing_tables.sql to front
                    $priorityFile = $migrationDir . '/add_all_missing_tables.sql';
                    if (($key = array_search($priorityFile, $files)) !== false) {
                        unset($files[$key]);
                        array_unshift($files, $priorityFile);
                    }

                    // Strict Regex: CREATE TABLE [IF NOT EXISTS] table_name ... ;
                    // We use dot matches newline (s modifier)
                    $pattern = '/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?' . preg_quote($table, '/') . '`?\s*\(.*?\)\s*(?:ENGINE=[^;]+)?;/is';

                    foreach ($files as $file) {
                        $sqlContent = file_get_contents($file);
                        
                        if (preg_match($pattern, $sqlContent, $matches)) {
                            $createSql = $matches[0];
                            try {
                                $pdo->exec($createSql);
                                $result = ['success' => true, 'message' => "Table '$table' created successfully (found in " . basename($file) . ")"];
                                $schemaFound = true;
                                break; // Stop after success
                            } catch (PDOException $e) {
                                // Check for foreign key error
                                if ($e->getCode() == 'HY000' && strpos($e->getMessage(), 'errno: 150') !== false) {
                                    throw new Exception("Cannot create '$table' because it depends on other missing tables. Please fix other missing tables first.");
                                }
                                throw $e;
                            }
                        }
                    }

                    if (!$schemaFound) {
                        throw new Exception("Schema definition for '$table' not found in any migration file");
                    }
                    break;
                    
                case 'rotate_log':
                    // Actually rotate the log file
                    $file = $params['file'] ?? null;
                    if ($file) {
                        $logPath = __DIR__ . '/../../logs/' . basename($file);
                        if (file_exists($logPath)) {
                            $archivePath = $logPath . '.' . date('Y-m-d_His') . '.archive';
                            if (rename($logPath, $archivePath)) {
                                // Create new empty log file
                                file_put_contents($logPath, '');
                                $result = ['success' => true, 'message' => "Log file '$file' rotated and archived successfully"];
                            } else {
                                $result = ['success' => false, 'message' => "Failed to rotate log file '$file'"];
                            }
                        } else {
                            $result = ['success' => false, 'message' => "Log file '$file' not found"];
                        }
                    }
                    break;
                    
                case 'optimize_tables':
                    try {
                        $pdo = \Xordon\Database::conn();
                        $stmt = $pdo->query("SHOW TABLES");
                        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                        $optimized = 0;
                        $startTime = microtime(true);
                        
                        foreach ($tables as $table) {
                            try {
                                $pdo->exec("OPTIMIZE TABLE `$table`");
                                $optimized++;
                            } catch (Exception $e) {
                                // Skip tables that can't be optimized
                            }
                        }
                        
                        $duration = round((microtime(true) - $startTime) * 1000);
                        $result = ['success' => true, 'message' => "Optimized $optimized tables in {$duration}ms"];
                    } catch (Exception $e) {
                        $result = ['success' => false, 'message' => "Database optimization failed: " . $e->getMessage()];
                    }
                    break;

                case 'flush_failed_jobs':
                    try {
                        $pdo = \Xordon\Database::conn();
                        if (self::tableExists($pdo, 'jobs_queue')) {
                            $pdo->exec("UPDATE jobs_queue SET status = 'cancelled' WHERE status = 'failed'");
                            $result = ['success' => true, 'message' => "Marked all failed jobs as cancelled"];
                        } elseif (self::tableExists($pdo, 'failed_jobs')) {
                            // Support legacy table if it exists
                            $pdo->exec("TRUNCATE TABLE failed_jobs");
                            $result = ['success' => true, 'message' => "Flushed legacy failed_jobs table"];
                        } else {
                            $result = ['success' => false, 'message' => "No failed jobs table found"];
                        }
                    } catch (Exception $e) {
                         $result = ['success' => false, 'message' => "Failed to flush jobs: " . $e->getMessage()];
                    }
                    break;
                    
                case 'disable_debug_mode':
                    $envPath = __DIR__ . '/../../.env';
                    if (file_exists($envPath)) {
                        $content = file_get_contents($envPath);
                        $pattern = '/^APP_DEBUG=.*$/m';
                        if (preg_match($pattern, $content)) {
                            $newContent = preg_replace($pattern, 'APP_DEBUG=false', $content);
                            if (file_put_contents($envPath, $newContent)) {
                                $result = ['success' => true, 'message' => "Debug mode disabled in .env"];
                                // Note: Changes to .env might not reflect immediately without server restart in some setups
                            } else {
                                $result = ['success' => false, 'message' => "Failed to write to .env file"];
                            }
                        } else {
                            // Append if not found
                            if (file_put_contents($envPath, "\nAPP_DEBUG=false", FILE_APPEND)) {
                                $result = ['success' => true, 'message' => "Debug mode disabled (appended to .env)"];
                            } else {
                                $result = ['success' => false, 'message' => "Failed to write to .env file"];
                            }
                        }
                    } else {
                        $result = ['success' => false, 'message' => ".env file not found"];
                    }
                    break;

                case 'cleanup_temp_files':
                    $tmpDir = sys_get_temp_dir();
                    $deleted = 0;
                    if (is_dir($tmpDir)) {
                        $tmpFiles = glob($tmpDir . '/php*');
                        $now = time();
                        foreach ($tmpFiles as $file) {
                            if (is_file($file) && ($now - filemtime($file) > 86400)) {
                                if (@unlink($file)) {
                                    $deleted++;
                                }
                            }
                        }
                    }
                    $result = ['success' => true, 'message' => "Cleaned up $deleted old temporary files"];
                    break;

                case 'optimize_opcache':
                    if (function_exists('opcache_reset')) {
                        if (opcache_reset()) {
                            $result = ['success' => true, 'message' => "OPcache has been reset successfully"];
                        } else {
                            $result = ['success' => false, 'message' => "Failed to reset OPcache"];
                        }
                    } else {
                        $result = ['success' => false, 'message' => "OPcache is not enabled or available"];
                    }
                    break;
            }
            
            \Xordon\Response::json($result);
        } catch (Exception $e) {
            \Xordon\Response::error($e->getMessage());
        }
    }

    /**
     * Get real-time performance metrics
     * GET /api/system/performance
     */
    public static function getPerformanceMetrics(): void {
        try {
            self::isAdminOrFail();
            \Xordon\Response::json([
                'success' => true,
                'data' => self::getInternalPerformanceMetrics()
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    private static function getInternalPerformanceMetrics(): array {
        $cpu = 0;
        $memTotal = 0;
        $memUsed = 0;
        $uptime = '';
        
        // System-wide usage (Fallback/Background)
        try {
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                // Windows Implementation
                @exec("wmic cpu get loadpercentage /Value", $output);
                if ($output) {
                    foreach ($output as $line) {
                        if (preg_match('/^LoadPercentage=(\d+)/', $line, $matches)) {
                            $cpu = (int)$matches[1];
                            break;
                        }
                    }
                }
                
                @exec("wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /Value", $outputMem);
                if ($outputMem) {
                    $tot = 0; $free = 0;
                    foreach ($outputMem as $line) {
                        if (preg_match('/^TotalVisibleMemorySize=(\d+)/', $line, $matches)) $tot = (int)$matches[1];
                        if (preg_match('/^FreePhysicalMemory=(\d+)/', $line, $matches)) $free = (int)$matches[1];
                    }
                    if ($tot > 0) {
                        $memTotal = $tot * 1024;
                        $memUsed = ($tot - $free) * 1024;
                    }
                }

                $uptime = self::getWindowsUptime();
            } else {
                // Linux/Unix Implementation
                $load = sys_getloadavg();
                if ($load) $cpu = $load[0] * 100;
                
                if (@file_exists('/proc/meminfo')) {
                    $meminfo = file_get_contents('/proc/meminfo');
                    $t = 0; $a = 0;
                    if (preg_match('/MemTotal:\s+(\d+)\s+kB/', $meminfo, $matches)) $t = (int)$matches[1] * 1024;
                    if (preg_match('/MemAvailable:\s+(\d+)\s+kB/', $meminfo, $matches)) $a = (int)$matches[1] * 1024;
                    if ($t > 0) { $memTotal = $t; $memUsed = ($t - $a); }
                }
                
                if (@file_exists('/proc/uptime')) {
                    $uptimeSec = (int)file_get_contents('/proc/uptime');
                    $days = floor($uptimeSec / 86400);
                    $hours = floor(($uptimeSec % 86400) / 3600);
                    $uptime = "$days days, $hours hours";
                }
            }
        } catch (Exception $e) {
            // Ignore background capture errors
        }

        // Software Specific Consumption (Smart Implementation)
        $rootPath = realpath(__DIR__ . '/../../');
        $cacheSizeFile = $rootPath . '/cache/app_size_cache.json';
        $appDiskUsage = 0;
        
        // Cache directory size calculation for 5 minutes
        if (file_exists($cacheSizeFile)) {
            $data = json_decode(file_get_contents($cacheSizeFile), true);
            if ($data && (time() - ($data['time'] ?? 0) < 300)) {
                $appDiskUsage = $data['size'];
            }
        }
        
        if ($appDiskUsage === 0) {
            $appDiskUsage = self::getDirSize($rootPath);
            if (!is_dir(dirname($cacheSizeFile))) @mkdir(dirname($cacheSizeFile), 0755, true);
            file_put_contents($cacheSizeFile, json_encode(['time' => time(), 'size' => $appDiskUsage]));
        }

        $appMemoryUsage = memory_get_usage(true); // Allocated memory for this script
        $appPeakMemory = memory_get_peak_usage(true);

        $cores = 1;
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $cores = self::getWindowsCores();
        } else {
            $cores = (int)@shell_exec('nproc') ?: 1;
        }

        return [
            'cpu' => [
                'current' => round($cpu, 1),
                'cores' => $cores,
            ],
            'memory' => [
                'used' => $memUsed ?: $appMemoryUsage, // System used
                'total' => $memTotal ?: (2 * 1024 * 1024 * 1024),
                'percent' => $memTotal > 0 ? round(($memUsed / $memTotal) * 100, 1) : 0,
                'app_used' => $appMemoryUsage,
                'app_peak' => $appPeakMemory
            ],
            'disk' => [
                'used' => disk_total_space($rootPath) - disk_free_space($rootPath), // System used
                'total' => disk_total_space($rootPath),
                'percent' => round(((disk_total_space($rootPath) - disk_free_space($rootPath)) / disk_total_space($rootPath)) * 100, 1),
                'app_used' => $appDiskUsage // App specific folder size
            ],
            'uptime' => $uptime ?: 'N/A',
            'app' => [
                'memory_usage' => $appMemoryUsage,
                'memory_peak' => $appPeakMemory,
                'storage_used' => $appDiskUsage,
                'db_storage_used' => 0, // Placeholder, can be populated via DB call or passed in
                'logs_size' => self::getDirSize($rootPath . '/logs'),
                'cache_size' => self::getDirSize($rootPath . '/cache'),
            ],
            'timestamp' => microtime(true)
        ];
    }

    private static function getDirSize(string $dir): int {
        if (!file_exists($dir)) return 0;
        if (!is_dir($dir)) return filesize($dir);
        
        $size = 0;
        $flags = \FilesystemIterator::SKIP_DOTS | \FilesystemIterator::FOLLOW_SYMLINKS;
        try {
            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($dir, $flags)
            );
            
            foreach ($iterator as $file) {
                // If performance is an issue, add: if (strpos($file->getPathname(), 'node_modules') !== false) continue;
                $size += $file->getSize();
            }
        } catch (Exception $e) {
            // Permission ignored
        }
        return $size;
    }

    private static function getWindowsUptime(): string {
        try {
            @exec("wmic os get lastbootuptime /Value", $outputUptime);
            if ($outputUptime) {
                foreach ($outputUptime as $line) {
                    if (preg_match('/^LastBootUpTime=(\d+)/', $line, $matches)) {
                        $bootTimeStr = $matches[1];
                        $year = substr($bootTimeStr, 0, 4);
                        $month = substr($bootTimeStr, 4, 2);
                        $day = substr($bootTimeStr, 6, 2);
                        $hour = substr($bootTimeStr, 8, 2);
                        $min = substr($bootTimeStr, 10, 2);
                        $sec = substr($bootTimeStr, 12, 2);
                        $bootTimestamp = strtotime("$year-$month-$day $hour:$min:$sec");
                        $uptimeSeconds = time() - $bootTimestamp;
                        $days = floor($uptimeSeconds / 86400);
                        $hours = floor(($uptimeSeconds % 86400) / 3600);
                        return "$days days, $hours hours";
                    }
                }
            }
        } catch (Exception $e) {}
        return 'N/A';
    }

    private static function getWindowsCores(): int {
        try {
            @exec("wmic cpu get NumberOfCores /Value", $outputCores);
            if ($outputCores) {
                foreach ($outputCores as $line) {
                    if (preg_match('/^NumberOfCores=(\d+)/', $line, $matches)) {
                        return (int)$matches[1];
                    }
                }
            }
        } catch (Exception $e) {}
        return 1;
    }


    /**
     * Get environment configuration info
     */
    private static function getEnvironmentInfo(): array {
        $extensions = get_loaded_extensions();
        $requiredExtensions = ['curl', 'gd', 'mbstring', 'pdo_mysql', 'json', 'openssl', 'fileinfo'];
        $loadedRequired = array_intersect($requiredExtensions, $extensions);
        
        // Attempt to get app version from package.json
        $appVersion = '1.0.0';
        $packageJsonPath = __DIR__ . '/../../../package.json';
        if (file_exists($packageJsonPath)) {
            $packageData = json_decode(file_get_contents($packageJsonPath), true);
            $appVersion = $packageData['version'] ?? '1.0.0';
        }

        return [
            'app_version' => $appVersion,
            'app_env' => getenv('APP_ENV') ?: 'production',
            'app_debug' => getenv('APP_DEBUG') === 'true',
            'git_commit' => self::getGitCommit(),
            'php_version' => PHP_VERSION,
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
            'opcache_enabled' => function_exists('opcache_get_status') && opcache_get_status() !== false,
            'extensions' => [
                'required' => $requiredExtensions,
                'loaded' => array_values($loadedRequired),
                'missing' => array_values(array_diff($requiredExtensions, $loadedRequired)),
            ],
            'timezone' => date_default_timezone_get(),
            'display_errors' => ini_get('display_errors'),
            'error_reporting' => error_reporting(),
        ];
    }

    private static function getGitCommit(): string {
        try {
            $gitDir = __DIR__ . '/../../../.git';
            if (is_dir($gitDir)) {
                $output = [];
                exec('git rev-parse --short HEAD', $output);
                return $output[0] ?? 'unknown';
            }
        } catch (Exception $e) {
            // ignore
        }
        return 'unknown';
    }

    /**
     * Get database insights (table sizes, row counts)
     * GET /api/system/database/insights
     */
    public static function getDatabaseInsights(): void {
        try {
            self::isAdminOrFail();
            $pdo = \Xordon\Database::conn();
            
            // Get database name
            $stmt = $pdo->query('SELECT DATABASE()');
            $dbName = $stmt->fetchColumn();

            // Top 10 Largest Tables
            $stmt = $pdo->prepare("
                SELECT 
                    table_name as name, 
                    ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb,
                    table_rows as row_count
                FROM information_schema.TABLES 
                WHERE table_schema = ? 
                ORDER BY (data_length + index_length) DESC 
                LIMIT 10
            ");
            $stmt->execute([$dbName]);
            $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Total Size
            $stmt = $pdo->prepare("
                SELECT 
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as total_size_mb,
                    ROUND(SUM(index_length) / 1024 / 1024, 2) as index_size_mb,
                    COUNT(*) as table_count
                FROM information_schema.TABLES 
                WHERE table_schema = ?
            ");
            $stmt->execute([$dbName]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            // Active Processes
            $processes = [];
            try {
                $stmt = $pdo->query("SHOW FULL PROCESSLIST");
                $processes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) {}

            \Xordon\Response::json([
                'success' => true,
                'data' => [
                    'tables' => $tables,
                    'stats' => $stats,
                    'processes' => $processes
                ]
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get scheduler/queue status
     * GET /api/system/scheduler/status
     */
    public static function getSchedulerStatus(): void {
        try {
            self::isAdminOrFail();
            $pdo = \Xordon\Database::conn();
            
            $recentFailed = [];
            $throughput = ['processed_24h' => 0, 'failed_24h' => 0];

            // Check if jobs_queue table exists
            if (self::tableExists($pdo, 'jobs_queue')) {
                // Recent Failed Jobs
                $stmt = $pdo->query("SELECT id, payload, attempts as attempt, created_at FROM jobs_queue WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10");
                $recentFailed = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Throughput (assuming created_at exists)
                $stmt = $pdo->query("SELECT 
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as processed,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
                    FROM jobs_queue 
                    WHERE created_at >= NOW() - INTERVAL 24 HOUR");
                $stats = $stmt->fetch(PDO::FETCH_ASSOC);
                $throughput['processed_24h'] = (int)$stats['processed'];
                $throughput['failed_24h'] = (int)$stats['failed'];
            }

             \Xordon\Response::json([
                'success' => true,
                'data' => [
                    'recent_failed' => $recentFailed,
                    'throughput' => $throughput
                ]
            ]);
        } catch (Exception $e) {
             \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get queue/job stats from database
     */
    private static function getQueueStats(): array {
        try {
            $pdo = \Xordon\Database::conn();
            $pending = 0;
            $failed = 0;
            $processed = 0;
            
            // Check if jobs_queue table exists
            try {
                $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM jobs_queue WHERE status = 'pending'");
                $pending = (int)($stmt->fetch(PDO::FETCH_ASSOC)['cnt'] ?? 0);
                
                $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM jobs_queue WHERE status = 'failed'");
                $failed = (int)($stmt->fetch(PDO::FETCH_ASSOC)['cnt'] ?? 0);
                
                $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM jobs_queue WHERE status = 'completed'");
                $processed = (int)($stmt->fetch(PDO::FETCH_ASSOC)['cnt'] ?? 0);
            } catch (Exception $e) {
                // jobs_queue table might not exist
            }
            
            return [
                'pending' => $pending,
                'failed' => $failed,
                'processed_today' => $processed,
            ];
        } catch (Exception $e) {
            return ['pending' => 0, 'failed' => 0, 'processed_today' => 0];
        }
    }

    /**
     * Check connectivity to external services
     * POST /api/system/connectivity/check
     */
    public static function checkExternalConnectivity(): void {
        try {
            self::isAdminOrFail();
            
            $services = [
                ['id' => 'internet', 'label' => 'Internet (Google)', 'url' => 'https://www.google.com', 'type' => 'core'],
                ['id' => 'openai', 'label' => 'OpenAI API', 'url' => 'https://api.openai.com', 'type' => 'ai'],
                ['id' => 'stripe', 'label' => 'Stripe API', 'url' => 'https://api.stripe.com', 'type' => 'payment'],
                ['id' => 'twilio', 'label' => 'Twilio API', 'url' => 'https://api.twilio.com', 'type' => 'sms'],
                ['id' => 'sendgrid', 'label' => 'SendGrid API', 'url' => 'https://api.sendgrid.com', 'type' => 'email'],
                ['id' => 'mailgun', 'label' => 'Mailgun API', 'url' => 'https://api.mailgun.net', 'type' => 'email'],
                ['id' => 'aws_s3', 'label' => 'AWS S3 (US-East)', 'url' => 'https://s3.amazonaws.com', 'type' => 'storage'],
            ];
            
            $results = [];
            foreach ($services as $service) {
                $result = self::pingService($service['url']);
                $results[] = [
                    'id' => $service['id'],
                    'label' => $service['label'],
                    'type' => $service['type'],
                    'status' => $result['success'] ? 'green' : 'red',
                    'latency_ms' => $result['latency_ms'],
                    'error' => $result['error'] ?? null,
                ];
            }
            
            \Xordon\Response::json([
                'success' => true,
                'services' => $results,
                'checked_at' => date('c'),
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 403);
        }
    }

    /**
     * Ping a service URL and measure latency
     */
    private static function pingService(string $url): array {
        $start = microtime(true);
        $success = false;
        $error = null;
        
        try {
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 5,
                CURLOPT_CONNECTTIMEOUT => 3,
                CURLOPT_NOBODY => true, // HEAD request
                CURLOPT_SSL_VERIFYPEER => false,
            ]);
            
            curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);
            
            if ($httpCode >= 200 && $httpCode < 500) {
                $success = true;
            } else {
                $error = $curlError ?: "HTTP $httpCode";
            }
        } catch (Exception $e) {
            $error = $e->getMessage();
        }
        
        $latency = round((microtime(true) - $start) * 1000);
        
        return [
            'success' => $success,
            'latency_ms' => $latency,
            'error' => $error,
        ];
    }

    /**
     * Get structured recent errors from logs
     */
    private static function getStructuredErrors(): array {
        try {
            $logDir = __DIR__ . '/../../logs';
            $files = glob($logDir . '/*.log');
            if (empty($files)) return [];
            
            // Get latest log file
            usort($files, fn($a, $b) => filemtime($b) - filemtime($a));
            $latestFile = $files[0];
            
            // Read last 50KB of the file
            $fileSize = filesize($latestFile);
            $readSize = min($fileSize, 50 * 1024);
            $fp = fopen($latestFile, 'r');
            if ($fileSize > $readSize) {
                fseek($fp, $fileSize - $readSize);
            }
            $content = fread($fp, $readSize);
            fclose($fp);
            
            $lines = explode("\n", $content);
            $errors = [];
            
            // Parse log lines - format: [TIMESTAMP] LEVEL: message
            $pattern = '/^\[([^\]]+)\]\s*(ERROR|CRITICAL|WARNING|INFO|DEBUG):\s*(.*)$/i';
            
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line)) continue;
                
                if (preg_match($pattern, $line, $matches)) {
                    $level = strtoupper($matches[2]);
                    if (in_array($level, ['ERROR', 'CRITICAL', 'WARNING'])) {
                        $errors[] = [
                            'timestamp' => $matches[1],
                            'level' => $level,
                            'message' => substr($matches[3], 0, 200),
                        ];
                    }
                } elseif (stripos($line, 'error') !== false || stripos($line, 'critical') !== false) {
                    // Fallback for non-standard format
                    $errors[] = [
                        'timestamp' => date('Y-m-d H:i:s'),
                        'level' => 'ERROR',
                        'message' => substr($line, 0, 200),
                    ];
                }
            }
            
            // Return last 20 errors, newest first
            return array_slice(array_reverse($errors), 0, 20);
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Clear application cache
     * POST /api/system/cache/clear
     */
    public static function clearCache(): void {
        try {
            self::isAdminOrFail();
            
            $cleared = [];
            
            // Clear OPcache if available
            if (function_exists('opcache_reset')) {
                opcache_reset();
                $cleared[] = 'opcache';
            }
            
            // Clear file-based cache if CacheManager exists
            $cacheDir = __DIR__ . '/../../cache';
            if (is_dir($cacheDir)) {
                $files = glob($cacheDir . '/*');
                foreach ($files as $file) {
                    if (is_file($file)) {
                        unlink($file);
                    }
                }
                $cleared[] = 'file_cache';
            }
            
            // Log the action
            \Logger::info('Cache cleared by admin', [
                'user_id' => \Auth::userId(),
                'cleared' => $cleared,
            ]);
            
            \Xordon\Response::json([
                'success' => true,
                'message' => 'Cache cleared successfully',
                'cleared' => $cleared,
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get client-side errors
     * GET /api/system/tools/client-errors
     */
    public static function getClientErrors(): void {
        try {
            self::isAdminOrFail();
            $pdo = \Xordon\Database::conn();
            $stmt = $pdo->query("SELECT * FROM client_errors ORDER BY created_at DESC LIMIT 100");
            $errors = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            \Xordon\Response::json([
                'success' => true,
                'data' => $errors
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Log client-side error
     * POST /api/system/tools/client-errors
     */
    public static function logClientError(): void {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $pdo = \Xordon\Database::conn();
            
            $stmt = $pdo->prepare("INSERT INTO client_errors (type, message, stack, url, user_id, user_agent) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['type'] ?? 'error',
                $data['message'] ?? 'Unknown error',
                $data['stack'] ?? '',
                $data['url'] ?? '',
                \Xordon\Auth::userId() ?: null,
                $_SERVER['HTTP_USER_AGENT'] ?? ''
            ]);

            \Xordon\Response::json(['success' => true]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Optimize database tables
     * POST /api/system/database/optimize
     */
    public static function optimizeDatabase(): void {
        try {
            self::isAdminOrFail();
            
            $pdo = \Xordon\Database::conn();
            $optimized = [];
            
            // Get all tables
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            foreach ($tables as $table) {
                try {
                    $pdo->exec("OPTIMIZE TABLE `$table`");
                    $optimized[] = $table;
                } catch (Exception $e) {
                    // Skip tables that can't be optimized
                }
            }
            
            \Logger::info('Database optimized by admin', [
                'user_id' => \Auth::userId(),
                'tables_count' => count($optimized),
            ]);
            
            \Xordon\Response::json([
                'success' => true,
                'message' => 'Database optimization complete',
                'tables_optimized' => count($optimized),
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Get application logs with filtering
     * GET /api/system/tools/logs?lines=100&level=ERROR
     */
    public static function getLogs(): void {
        try {
            self::isAdminOrFail();
            
            $lines = isset($_GET['lines']) ? (int)$_GET['lines'] : 100;
            $level = isset($_GET['level']) ? strtoupper($_GET['level']) : null;
            
            $logFile = __DIR__ . '/../../logs/app.log';
            
            if (!file_exists($logFile)) {
                \Xordon\Response::json([
                    'success' => true,
                    'logs' => [],
                    'message' => 'Log file not found'
                ]);
                return;
            }
            
            // Read last N lines efficiently
            $file = new \SplFileObject($logFile, 'r');
            $file->seek(PHP_INT_MAX);
            $totalLines = $file->key() + 1;
            
            $startLine = max(0, $totalLines - $lines);
            $logs = [];
            
            $file->seek($startLine);
            while (!$file->eof()) {
                $line = trim($file->fgets());
                if (empty($line)) continue;
                
                // Parse log line (assuming format: [YYYY-MM-DD HH:MM:SS] LEVEL: message)
                if (preg_match('/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.+)$/', $line, $matches)) {
                    $logLevel = $matches[2];
                    
                    // Filter by level if specified
                    if ($level && $logLevel !== $level) {
                        continue;
                    }
                    
                    $logs[] = [
                        'timestamp' => $matches[1],
                        'level' => $logLevel,
                        'message' => $matches[3]
                    ];
                } else {
                    // If line doesn't match format, include it as-is
                    if (!$level) {
                        $logs[] = [
                            'timestamp' => '',
                            'level' => 'UNKNOWN',
                            'message' => $line
                        ];
                    }
                }
            }
            
            // Reverse logs (newest first)
            $logs = array_reverse($logs);

            \Xordon\Response::json([
                'success' => true,
                'logs' => $logs,
                'total_lines' => $totalLines
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get cache keys (file-based cache)
     * GET /api/system/tools/cache
     */
    public static function getCacheKeys(): void {
        try {
            self::isAdminOrFail();
            
            $cacheDir = __DIR__ . '/../../cache';
            $keys = [];
            
            if (is_dir($cacheDir)) {
                $files = scandir($cacheDir);
                foreach ($files as $file) {
                    if ($file === '.' || $file === '..') continue;
                    
                    $filePath = $cacheDir . '/' . $file;
                    if (is_file($filePath)) {
                        $keys[] = [
                            'key' => $file,
                            'size' => filesize($filePath),
                            'modified' => date('Y-m-d H:i:s', filemtime($filePath))
                        ];
                    }
                }
            }
            
            \Xordon\Response::json([
                'success' => true,
                'keys' => $keys,
                'count' => count($keys)
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a specific cache key
     * DELETE /api/system/tools/cache/:key
     */
    public static function deleteCacheKey(string $key): void {
        try {
            self::isAdminOrFail();
            
            // Sanitize key to prevent directory traversal
            $key = basename($key);
            $cacheFile = __DIR__ . '/../../cache/' . $key;
            
            if (!file_exists($cacheFile)) {
                \Xordon\Response::json(['success' => false, 'error' => 'Cache key not found'], 404);
                return;
            }
            
            if (unlink($cacheFile)) {
                \Xordon\Response::json([
                    'success' => true,
                    'message' => 'Cache key deleted successfully'
                ]);
            } else {
                \Xordon\Response::json(['success' => false, 'error' => 'Failed to delete cache key'], 500);
            }
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get real-time server resource stats (CPU, RAM)
     * GET /api/system/tools/resources
     */
    public static function getServerResources(): void {
        try {
            self::isAdminOrFail();
            \Xordon\Response::json([
                'success' => true,
                'data' => self::getInternalPerformanceMetrics()
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get or set maintenance mode
     * GET /api/system/tools/maintenance
     * POST /api/system/tools/maintenance
     */
    public static function maintenanceMode(): void {
        try {
            self::isAdminOrFail();
            
            $maintenanceFile = __DIR__ . '/../../maintenance.flag';
            
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                \Xordon\Response::json([
                    'success' => true,
                    'enabled' => file_exists($maintenanceFile),
                    'timestamp' => file_exists($maintenanceFile) ? filemtime($maintenanceFile) : null
                ]);
                return;
            }
            
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $enable = $data['enabled'] ?? false;
                
                if ($enable) {
                    file_put_contents($maintenanceFile, json_encode([
                        'time' => time(),
                        'user' => \Auth::userId()
                    ]));
                    \Xordon\Response::json(['success' => true, 'enabled' => true, 'message' => 'Maintenance mode enabled']);
                } else {
                    if (file_exists($maintenanceFile)) {
                        unlink($maintenanceFile);
                    }
                    \Xordon\Response::json(['success' => true, 'enabled' => false, 'message' => 'Maintenance mode disabled']);
                }
            }
            
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Test email configuration by sending a test email
     * POST /api/system/tools/test-email
     */
    public static function testEmail(): void {
        try {
            self::isAdminOrFail();
            
            $data = json_decode(file_get_contents('php://input'), true);
            $email = $data['email'] ?? null;
            
            if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                \Xordon\Response::json(['success' => false, 'error' => 'Valid email address required'], 400);
                return;
            }
            
            require_once __DIR__ . '/../services/NotificationSender.php';
            
            // Assuming workspace_id 1 for system tests or fetch current user's workspace
            $workspaceId = \Auth::user()['workspace_id'] ?? 1;
            
            $result = \NotificationSender::sendEmail(
                $workspaceId,
                $email,
                'System Health Test Email',
                '<h1>It Works!</h1><p>This is a test email from your System Health Dashboard.</p><p>Time: ' . date('c') . '</p>',
                'It Works! This is a test email from your System Health Dashboard.'
            );
            
            if ($result['success']) {
                \Xordon\Response::json(['success' => true, 'message' => 'Test email sent successfully']);
            } else {
                \Xordon\Response::json(['success' => false, 'error' => $result['error']]);
            }
            
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // COMPREHENSIVE SYSTEM HEALTH - PHASE 2 IMPLEMENTATIONS
    // =========================================================================

    /**
     * Ensure required tables exist for comprehensive health monitoring
     * POST /api/system/health/migrate
     */
    public static function runMigration(): void {
        try {
            self::isAdminOrFail();
            $pdo = \Xordon\Database::conn();
            $created = [];

            // 1. HTTP Requests Log
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `http_requests_log` (
                    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    `request_id` VARCHAR(36) NOT NULL,
                    `method` VARCHAR(10) NOT NULL,
                    `path` VARCHAR(500) NOT NULL,
                    `status_code` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
                    `response_time_ms` INT UNSIGNED NOT NULL DEFAULT 0,
                    `user_id` INT UNSIGNED NULL,
                    `ip_address` VARCHAR(45) NULL,
                    `user_agent` VARCHAR(500) NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX `idx_http_log_created` (`created_at`),
                    INDEX `idx_http_log_path` (`path`(100)),
                    INDEX `idx_http_log_status` (`status_code`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
            $created[] = 'http_requests_log';

            // 2. Health Snapshots (enhanced)
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `system_health_snapshots` (
                    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    `status` VARCHAR(20) DEFAULT 'healthy',
                    `score` TINYINT UNSIGNED DEFAULT 100,
                    `cpu_percent` DECIMAL(5,2) DEFAULT 0,
                    `memory_percent` DECIMAL(5,2) DEFAULT 0,
                    `disk_percent` DECIMAL(5,2) DEFAULT 0,
                    `app_disk_bytes` BIGINT UNSIGNED DEFAULT 0,
                    `queue_pending` INT UNSIGNED DEFAULT 0,
                    `queue_failed` INT UNSIGNED DEFAULT 0,
                    `error_count_1h` INT UNSIGNED DEFAULT 0,
                    `request_count_1h` INT UNSIGNED DEFAULT 0,
                    `avg_response_time_ms` INT UNSIGNED DEFAULT 0,
                    `metrics` JSON NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX `idx_snapshots_created` (`created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
            $created[] = 'system_health_snapshots';

            // 3. Health Alerts
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `health_alerts` (
                    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    `alert_type` VARCHAR(50) NOT NULL,
                    `severity` ENUM('info', 'warning', 'critical') DEFAULT 'warning',
                    `message` TEXT NOT NULL,
                    `metric_name` VARCHAR(100) NULL,
                    `metric_value` VARCHAR(100) NULL,
                    `threshold` VARCHAR(100) NULL,
                    `acknowledged` TINYINT(1) DEFAULT 0,
                    `resolved` TINYINT(1) DEFAULT 0,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX `idx_alerts_severity` (`severity`),
                    INDEX `idx_alerts_created` (`created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
            $created[] = 'health_alerts';

            \Xordon\Response::json([
                'success' => true,
                'message' => 'Migration completed',
                'tables_created' => $created
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Log an HTTP request (called from middleware)
     */
    public static function logRequest(string $method, string $path, int $statusCode, int $responseTimeMs, ?int $userId = null): void {
        try {
            $pdo = \Xordon\Database::conn();
            
            // Check if table exists first
            $stmt = $pdo->query("SHOW TABLES LIKE 'http_requests_log'");
            if ($stmt->rowCount() === 0) return;

            $stmt = $pdo->prepare("
                INSERT INTO http_requests_log (request_id, method, path, status_code, response_time_ms, user_id, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                bin2hex(random_bytes(16)),
                $method,
                substr($path, 0, 500),
                $statusCode,
                $responseTimeMs,
                $userId,
                $_SERVER['REMOTE_ADDR'] ?? null,
                substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500)
            ]);
        } catch (Exception $e) {
            // Silently fail - don't block requests
        }
    }

    /**
     * Get traffic analytics (real data from http_requests_log)
     * GET /api/system/traffic
     */
    public static function getTrafficAnalytics(): void {
        try {
            self::isAdminOrFail();
            $pdo = \Xordon\Database::conn();

            // Check table exists
            $stmt = $pdo->query("SHOW TABLES LIKE 'http_requests_log'");
            if ($stmt->rowCount() === 0) {
                \Xordon\Response::json([
                    'success' => true,
                    'message' => 'Traffic logging not enabled. Run migration first.',
                    'data' => ['rpm' => [], 'latency' => [], 'errors' => [], 'top_routes' => [], 'summary' => []]
                ]);
                return;
            }

            // Requests per minute (last hour)
            $stmt = $pdo->query("
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as minute,
                    COUNT(*) as count
                FROM http_requests_log 
                WHERE created_at >= NOW() - INTERVAL 1 HOUR
                GROUP BY minute
                ORDER BY minute ASC
            ");
            $rpm = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Average latency per minute
            $stmt = $pdo->query("
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as minute,
                    AVG(response_time_ms) as avg_ms
                FROM http_requests_log 
                WHERE created_at >= NOW() - INTERVAL 1 HOUR
                GROUP BY minute
                ORDER BY minute ASC
            ");
            $latency = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Error rate by endpoint (last hour)
            $stmt = $pdo->query("
                SELECT 
                    path,
                    COUNT(*) as total,
                    SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors,
                    ROUND(SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as error_rate
                FROM http_requests_log 
                WHERE created_at >= NOW() - INTERVAL 1 HOUR
                GROUP BY path
                HAVING errors > 0
                ORDER BY errors DESC
                LIMIT 10
            ");
            $errorsByRoute = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Top 10 slowest routes
            $stmt = $pdo->query("
                SELECT 
                    path,
                    AVG(response_time_ms) as avg_ms,
                    MAX(response_time_ms) as max_ms,
                    COUNT(*) as hits
                FROM http_requests_log 
                WHERE created_at >= NOW() - INTERVAL 1 HOUR
                GROUP BY path
                ORDER BY avg_ms DESC
                LIMIT 10
            ");
            $slowestRoutes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Summary stats
            $stmt = $pdo->query("
                SELECT 
                    COUNT(*) as total_requests,
                    AVG(response_time_ms) as avg_latency,
                    MAX(response_time_ms) as max_latency,
                    SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) as server_errors,
                    SUM(CASE WHEN status_code >= 400 AND status_code < 500 THEN 1 ELSE 0 END) as client_errors
                FROM http_requests_log 
                WHERE created_at >= NOW() - INTERVAL 1 HOUR
            ");
            $summary = $stmt->fetch(PDO::FETCH_ASSOC);

            \Xordon\Response::json([
                'success' => true,
                'data' => [
                    'rpm' => $rpm,
                    'latency' => $latency,
                    'errors_by_route' => $errorsByRoute,
                    'slowest_routes' => $slowestRoutes,
                    'summary' => [
                        'total_requests_1h' => (int)($summary['total_requests'] ?? 0),
                        'avg_latency_ms' => round($summary['avg_latency'] ?? 0, 2),
                        'max_latency_ms' => (int)($summary['max_latency'] ?? 0),
                        'server_errors_1h' => (int)($summary['server_errors'] ?? 0),
                        'client_errors_1h' => (int)($summary['client_errors'] ?? 0),
                        'error_rate' => ($summary['total_requests'] ?? 0) > 0 
                            ? round((($summary['server_errors'] ?? 0) + ($summary['client_errors'] ?? 0)) / $summary['total_requests'] * 100, 2)
                            : 0
                    ]
                ]
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get business logic health (synthetic checks)
     * GET /api/system/business-health
     */
    public static function getBusinessHealth(): void {
        try {
            self::isAdminOrFail();
            $pdo = \Xordon\Database::conn();
            $checks = [];

            // 1. Database Write Test
            try {
                $testId = 'health_check_' . time();
                $pdo->exec("CREATE TEMPORARY TABLE IF NOT EXISTS health_test (id VARCHAR(50))");
                $pdo->exec("INSERT INTO health_test VALUES ('$testId')");
                $stmt = $pdo->query("SELECT id FROM health_test WHERE id = '$testId'");
                $checks['database_write'] = [
                    'status' => $stmt->fetchColumn() === $testId ? 'green' : 'red',
                    'message' => 'Database read/write operational'
                ];
            } catch (Exception $e) {
                $checks['database_write'] = ['status' => 'red', 'message' => $e->getMessage()];
            }

            // 2. Storage Write Test
            try {
                $testFile = __DIR__ . '/../../cache/health_test_' . time() . '.tmp';
                $writeResult = @file_put_contents($testFile, 'test');
                if ($writeResult !== false) {
                    $readResult = @file_get_contents($testFile);
                    @unlink($testFile);
                    $checks['storage'] = [
                        'status' => $readResult === 'test' ? 'green' : 'yellow',
                        'message' => 'File storage operational'
                    ];
                } else {
                    $checks['storage'] = ['status' => 'red', 'message' => 'Cannot write to storage'];
                }
            } catch (Exception $e) {
                $checks['storage'] = ['status' => 'red', 'message' => $e->getMessage()];
            }

            // 3. Email Configuration Check (check if SMTP settings exist)
            $smtpHost = getenv('SMTP_HOST') ?: ($_ENV['SMTP_HOST'] ?? null);
            $checks['email_config'] = [
                'status' => !empty($smtpHost) ? 'green' : 'yellow',
                'message' => !empty($smtpHost) ? 'SMTP configured' : 'SMTP not configured'
            ];

            // 4. Queue Health
            try {
                $stmt = $pdo->query("SHOW TABLES LIKE 'jobs_queue'");
                if ($stmt->rowCount() > 0) {
                    $stmt = $pdo->query("SELECT COUNT(*) FROM jobs_queue WHERE status = 'failed'");
                    $failedCount = (int)$stmt->fetchColumn();
                    $checks['queue'] = [
                        'status' => $failedCount === 0 ? 'green' : ($failedCount < 10 ? 'yellow' : 'red'),
                        'message' => $failedCount === 0 ? 'Queue healthy' : "$failedCount failed jobs",
                        'failed_jobs' => $failedCount
                    ];
                } else {
                    $checks['queue'] = ['status' => 'yellow', 'message' => 'Queue table not found'];
                }
            } catch (Exception $e) {
                $checks['queue'] = ['status' => 'yellow', 'message' => 'Queue check failed'];
            }

            // 5. Recent Errors (last hour)
            try {
                $logFile = __DIR__ . '/../../logs/app.log';
                $errorCount = 0;
                if (file_exists($logFile)) {
                    $oneHourAgo = strtotime('-1 hour');
                    $file = new \SplFileObject($logFile, 'r');
                    $file->seek(PHP_INT_MAX);
                    $totalLines = $file->key();
                    $startLine = max(0, $totalLines - 1000);
                    $file->seek($startLine);
                    
                    while (!$file->eof()) {
                        $line = $file->fgets();
                        if (stripos($line, 'ERROR') !== false || stripos($line, 'CRITICAL') !== false) {
                            $errorCount++;
                        }
                    }
                }
                $checks['error_rate'] = [
                    'status' => $errorCount < 10 ? 'green' : ($errorCount < 50 ? 'yellow' : 'red'),
                    'message' => "$errorCount errors in logs (last 1000 lines)",
                    'count' => $errorCount
                ];
            } catch (Exception $e) {
                $checks['error_rate'] = ['status' => 'yellow', 'message' => 'Could not check logs'];
            }

            // 6. User Registration Check (verify users table accessible)
            try {
                $stmt = $pdo->query("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL 24 HOUR");
                $newUsers = (int)$stmt->fetchColumn();
                $checks['registration'] = [
                    'status' => 'green',
                    'message' => "$newUsers new users in 24h",
                    'new_users_24h' => $newUsers
                ];
            } catch (Exception $e) {
                $checks['registration'] = ['status' => 'red', 'message' => 'Users table inaccessible'];
            }

            // Calculate overall score
            $scores = ['green' => 100, 'yellow' => 50, 'red' => 0];
            $totalScore = 0;
            foreach ($checks as $check) {
                $totalScore += $scores[$check['status']] ?? 0;
            }
            $overallScore = count($checks) > 0 ? round($totalScore / count($checks)) : 100;

            \Xordon\Response::json([
                'success' => true,
                'data' => [
                    'checks' => $checks,
                    'overall_score' => $overallScore,
                    'overall_status' => $overallScore >= 80 ? 'healthy' : ($overallScore >= 50 ? 'degraded' : 'unhealthy')
                ]
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get deep database internals
     * GET /api/system/database/internals
     */
    public static function getDatabaseInternals(): void {
        try {
            self::isAdminOrFail();
            $pdo = \Xordon\Database::conn();
            $data = [];

            // 1. Connection Status
            $stmt = $pdo->query("SHOW VARIABLES LIKE 'max_connections'");
            $maxConn = $stmt->fetchColumn(1);
            $stmt = $pdo->query("SHOW STATUS LIKE 'Threads_connected'");
            $currentConn = $stmt->fetchColumn(1);
            $data['connections'] = [
                'current' => (int)$currentConn,
                'max' => (int)$maxConn,
                'percent' => $maxConn > 0 ? round(($currentConn / $maxConn) * 100, 2) : 0
            ];

            // 2. Query Cache Status
            try {
                $stmt = $pdo->query("SHOW STATUS LIKE 'Qcache%'");
                $qcache = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
                $data['query_cache'] = $qcache;
            } catch (Exception $e) {
                $data['query_cache'] = ['note' => 'Query cache not available'];
            }

            // 3. InnoDB Buffer Pool
            try {
                $stmt = $pdo->query("SHOW STATUS LIKE 'Innodb_buffer_pool%'");
                $bufferPool = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
                $data['innodb_buffer_pool'] = [
                    'pages_total' => (int)($bufferPool['Innodb_buffer_pool_pages_total'] ?? 0),
                    'pages_free' => (int)($bufferPool['Innodb_buffer_pool_pages_free'] ?? 0),
                    'pages_dirty' => (int)($bufferPool['Innodb_buffer_pool_pages_dirty'] ?? 0),
                    'read_requests' => (int)($bufferPool['Innodb_buffer_pool_read_requests'] ?? 0),
                    'reads' => (int)($bufferPool['Innodb_buffer_pool_reads'] ?? 0)
                ];
                // Calculate hit ratio
                $requests = $data['innodb_buffer_pool']['read_requests'];
                $reads = $data['innodb_buffer_pool']['reads'];
                $data['innodb_buffer_pool']['hit_ratio'] = $requests > 0 
                    ? round((($requests - $reads) / $requests) * 100, 2) 
                    : 100;
            } catch (Exception $e) {
                $data['innodb_buffer_pool'] = ['note' => 'InnoDB stats not available'];
            }

            // 4. Table Locks
            $stmt = $pdo->query("SHOW STATUS LIKE 'Table_locks%'");
            $locks = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            $data['table_locks'] = [
                'immediate' => (int)($locks['Table_locks_immediate'] ?? 0),
                'waited' => (int)($locks['Table_locks_waited'] ?? 0)
            ];

            // 5. Slow Queries
            $stmt = $pdo->query("SHOW GLOBAL STATUS LIKE 'Slow_queries'");
            $slowQueries = $stmt->fetchColumn(1);
            $data['slow_queries'] = (int)$slowQueries;

            // 6. Uptime
            $stmt = $pdo->query("SHOW STATUS LIKE 'Uptime'");
            $uptime = $stmt->fetchColumn(1);
            $data['uptime_seconds'] = (int)$uptime;
            $data['uptime_formatted'] = sprintf('%d days, %d hours', 
                floor($uptime / 86400), 
                floor(($uptime % 86400) / 3600)
            );

            // 7. Database Size
            $stmt = $pdo->query("SELECT SUM(data_length + index_length) as size FROM information_schema.TABLES WHERE table_schema = DATABASE()");
            $dbSize = $stmt->fetchColumn();
            $data['database_size_bytes'] = (int)$dbSize;
            $data['database_size_mb'] = round($dbSize / 1024 / 1024, 2);

            \Xordon\Response::json([
                'success' => true,
                'data' => $data
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get health alerts
     * GET /api/system/alerts
     */
    public static function getAlerts(): void {
        try {
            self::isAdminOrFail();
            $pdo = \Xordon\Database::conn();

            // Check table exists
            $stmt = $pdo->query("SHOW TABLES LIKE 'health_alerts'");
            if ($stmt->rowCount() === 0) {
                \Xordon\Response::json([
                    'success' => true,
                    'data' => [],
                    'message' => 'Alerts table not created. Run migration.'
                ]);
                return;
            }

            $stmt = $pdo->query("
                SELECT * FROM health_alerts 
                WHERE resolved = 0 
                ORDER BY 
                    CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
                    created_at DESC
                LIMIT 50
            ");
            $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            \Xordon\Response::json([
                'success' => true,
                'data' => $alerts
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Acknowledge or resolve an alert
     * POST /api/system/alerts/:id/acknowledge
     * POST /api/system/alerts/:id/resolve
     */
    public static function updateAlert(int $id): void {
        try {
            self::isAdminOrFail();
            $pdo = \Xordon\Database::conn();
            $action = $_GET['action'] ?? 'acknowledge';

            if ($action === 'resolve') {
                $stmt = $pdo->prepare("UPDATE health_alerts SET resolved = 1, resolved_at = NOW() WHERE id = ?");
            } else {
                $stmt = $pdo->prepare("UPDATE health_alerts SET acknowledged = 1, acknowledged_at = NOW(), acknowledged_by = ? WHERE id = ?");
                $stmt->execute([\Auth::userId(), $id]);
                \Xordon\Response::json(['success' => true]);
                return;
            }
            $stmt->execute([$id]);

            \Xordon\Response::json(['success' => true]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Create an alert (internal use)
     */
    public static function createAlert(string $type, string $severity, string $message, ?string $metricName = null, ?string $metricValue = null, ?string $threshold = null): void {
        try {
            $pdo = \Xordon\Database::conn();
            
            // Check table
            $stmt = $pdo->query("SHOW TABLES LIKE 'health_alerts'");
            if ($stmt->rowCount() === 0) return;

            // Check for existing unresolved alert of same type
            $stmt = $pdo->prepare("SELECT id FROM health_alerts WHERE alert_type = ? AND resolved = 0 LIMIT 1");
            $stmt->execute([$type]);
            if ($stmt->fetch()) return; // Don't duplicate

            $stmt = $pdo->prepare("
                INSERT INTO health_alerts (alert_type, severity, message, metric_name, metric_value, threshold)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$type, $severity, $message, $metricName, $metricValue, $threshold]);
        } catch (Exception $e) {
            error_log("Failed to create alert: " . $e->getMessage());
        }
    }

    /**
     * Prune old data (housekeeping)
     * POST /api/system/health/prune
     */
    public static function pruneOldData(): void {
        try {
            self::isAdminOrFail();
            $pdo = \Xordon\Database::conn();
            $pruned = [];

            // Prune http_requests_log older than 7 days
            try {
                $stmt = $pdo->exec("DELETE FROM http_requests_log WHERE created_at < NOW() - INTERVAL 7 DAY");
                $pruned['http_requests_log'] = $stmt;
            } catch (Exception $e) {}

            // Prune snapshots older than 30 days
            try {
                $stmt = $pdo->exec("DELETE FROM system_health_snapshots WHERE created_at < NOW() - INTERVAL 30 DAY");
                $pruned['system_health_snapshots'] = $stmt;
            } catch (Exception $e) {}

            // Prune resolved alerts older than 30 days
            try {
                $stmt = $pdo->exec("DELETE FROM health_alerts WHERE resolved = 1 AND created_at < NOW() - INTERVAL 30 DAY");
                $pruned['health_alerts'] = $stmt;
            } catch (Exception $e) {}

            \Xordon\Response::json([
                'success' => true,
                'message' => 'Pruning completed',
                'rows_deleted' => $pruned
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get enhanced historical trends with detailed metrics
     * GET /api/system/trends/detailed
     */
    public static function getDetailedTrends(): void {
        try {
            self::isAdminOrFail();
            $pdo = \Xordon\Database::conn();
            $period = $_GET['period'] ?? '24h';

            $interval = match($period) {
                '1h' => 'INTERVAL 1 HOUR',
                '24h' => 'INTERVAL 24 HOUR',
                '7d' => 'INTERVAL 7 DAY',
                '30d' => 'INTERVAL 30 DAY',
                default => 'INTERVAL 24 HOUR'
            };

            // Check table
            $stmt = $pdo->query("SHOW TABLES LIKE 'system_health_snapshots'");
            if ($stmt->rowCount() === 0) {
                \Xordon\Response::json([
                    'success' => true,
                    'data' => [],
                    'message' => 'No snapshots yet. Run migration and wait for data collection.'
                ]);
                return;
            }

            $stmt = $pdo->query("
                SELECT 
                    id,
                    status,
                    score,
                    cpu_percent,
                    memory_percent,
                    disk_percent,
                    app_disk_bytes,
                    queue_pending,
                    queue_failed,
                    error_count_1h,
                    request_count_1h,
                    avg_response_time_ms,
                    metrics,
                    created_at
                FROM system_health_snapshots 
                WHERE created_at >= NOW() - $interval
                ORDER BY created_at ASC
            ");
            $trends = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($trends as &$trend) {
                if ($trend['metrics']) {
                    $trend['metrics'] = json_decode($trend['metrics'], true);
                }
            }

            \Xordon\Response::json([
                'success' => true,
                'period' => $period,
                'data' => $trends
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Take a manual comprehensive snapshot
     * POST /api/system/health/snapshot
     */
    public static function takeSnapshot(): void {
        try {
            self::isAdminOrFail();
            $pdo = \Xordon\Database::conn();

            // Check table
            $tableCheck = $pdo->query("SHOW TABLES LIKE 'system_health_snapshots'");
            if ($tableCheck->rowCount() === 0) {
                \Xordon\Response::json(['success' => false, 'error' => 'Run migration first'], 400);
                return;
            }

            $metrics = self::getInternalPerformanceMetrics();
            $queueStats = self::getQueueStats();
            
            // Get error count from logs
            $errorCount = 0;
            try {
                $logFile = __DIR__ . '/../../logs/app.log';
                if (file_exists($logFile)) {
                    $oneHourAgo = time() - 3600;
                    $content = @file_get_contents($logFile);
                    $errorCount = substr_count(strtoupper($content), 'ERROR');
                }
            } catch (Exception $e) {}

            // Get request count from traffic log
            $requestCount = 0;
            $avgResponseTime = 0;
            try {
                $stmt = $pdo->query("SELECT COUNT(*) as cnt, AVG(response_time_ms) as avg_ms FROM http_requests_log WHERE created_at >= NOW() - INTERVAL 1 HOUR");
                $trafficStats = $stmt->fetch(PDO::FETCH_ASSOC);
                $requestCount = (int)($trafficStats['cnt'] ?? 0);
                $avgResponseTime = (int)($trafficStats['avg_ms'] ?? 0);
            } catch (Exception $e) {}

            // Calculate health score
            $score = 100;
            if ($metrics['cpu']['current'] > 80) $score -= 20;
            if ($metrics['memory']['percent'] > 85) $score -= 20;
            if ($metrics['disk']['percent'] > 90) $score -= 30;
            if ($queueStats['failed'] > 0) $score -= 10;
            if ($errorCount > 50) $score -= 20;
            $score = max(0, $score);

            $status = $score >= 80 ? 'healthy' : ($score >= 50 ? 'degraded' : 'critical');

            $stmt = $pdo->prepare("
                INSERT INTO system_health_snapshots 
                (status, score, cpu_percent, memory_percent, disk_percent, app_disk_bytes, queue_pending, queue_failed, error_count_1h, request_count_1h, avg_response_time_ms, metrics)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $status,
                $score,
                $metrics['cpu']['current'],
                $metrics['memory']['percent'],
                $metrics['disk']['percent'],
                $metrics['app']['storage_used'] ?? 0,
                $queueStats['pending'],
                $queueStats['failed'],
                $errorCount,
                $requestCount,
                $avgResponseTime,
                json_encode($metrics)
            ]);

            // Create alerts if thresholds exceeded
            if ($metrics['disk']['percent'] > 90) {
                self::createAlert('disk_critical', 'critical', 'Disk usage above 90%', 'disk_percent', $metrics['disk']['percent'] . '%', '90%');
            }
            if ($metrics['cpu']['current'] > 90) {
                self::createAlert('cpu_critical', 'critical', 'CPU usage above 90%', 'cpu_percent', $metrics['cpu']['current'] . '%', '90%');
            }
            if ($queueStats['failed'] > 100) {
                self::createAlert('queue_failed', 'warning', 'High number of failed jobs', 'failed_jobs', (string)$queueStats['failed'], '100');
            }

            \Xordon\Response::json([
                'success' => true,
                'message' => 'Snapshot taken',
                'snapshot' => [
                    'status' => $status,
                    'score' => $score,
                    'timestamp' => date('c')
                ]
            ]);
        } catch (Exception $e) {
            \Xordon\Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}

