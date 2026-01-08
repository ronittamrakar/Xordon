<?php
require_once 'backend/src/Database.php';

$pdo = Database::conn();
$report = [];

// 1. Count tables
$stmt = $pdo->query("SELECT COUNT(*) as cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()");
$report['total_tables'] = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];

// 2. Count tables with tenant isolation columns
$stmt = $pdo->query("
    SELECT 
        SUM(CASE WHEN COLUMN_NAME = 'workspace_id' THEN 1 ELSE 0 END) as workspace_id_count,
        SUM(CASE WHEN COLUMN_NAME = 'tenant_id' THEN 1 ELSE 0 END) as tenant_id_count,
        SUM(CASE WHEN COLUMN_NAME = 'company_id' THEN 1 ELSE 0 END) as company_id_count
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
");
$report['tenant_columns'] = $stmt->fetch(PDO::FETCH_ASSOC);

// 3. Tables WITHOUT workspace_id
$stmt = $pdo->query("
    SELECT DISTINCT TABLE_NAME 
    FROM information_schema.TABLES t
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME NOT IN (
        SELECT DISTINCT TABLE_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND COLUMN_NAME = 'workspace_id'
    )
    AND TABLE_NAME NOT LIKE '%_log%'
    AND TABLE_NAME NOT IN ('migrations', 'roles', 'permissions', 'settings', 'system_settings')
    ORDER BY TABLE_NAME
    LIMIT 50
");
$report['tables_without_workspace_id'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

// 4. Sample controllers count
$controllers = glob('backend/src/controllers/*Controller.php');
$report['total_controllers'] = count($controllers);

// 5. Sample pages count  
$pages = glob('src/pages/*.tsx');
$report['total_pages'] = count($pages);

// 6. Route files count
$routes = glob('src/routes/*Routes.tsx');
$report['total_route_files'] = count($routes);

echo json_encode($report, JSON_PRETTY_PRINT);
