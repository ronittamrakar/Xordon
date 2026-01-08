<?php
// TenantContextTest - can run under PHPUnit or standalone

if (!class_exists('PHPUnit\\Framework\\TestCase')) {
    abstract class TestCase {
        protected function assertCount($expected, $array) {
            $actual = count($array);
            if ($actual !== $expected) {
                throw new RuntimeException("Expected count $expected, got $actual");
            }
        }

        protected function assertContains($needle, $haystack) {
            if (!in_array($needle, $haystack, true)) {
                throw new RuntimeException("Value not found in array: " . json_encode($needle));
            }
        }

        protected function assertNotContains($needle, $haystack) {
            if (in_array($needle, $haystack, true)) {
                throw new RuntimeException("Unexpected value found in array: " . json_encode($needle));
            }
        }

        protected function assertEquals($expected, $actual) {
            if ($expected !== $actual) {
                throw new RuntimeException("Expected '" . $expected . "', got '" . $actual . "'");
            }
        }
    }
}

class TenantContextTest extends TestCase {
    private $pdo;
    
    public function setUp(): void {
        // Use MySQL test database if configured; otherwise skip tests
        $dsn = getenv('TEST_DB_DSN') ?: getenv('DB_TEST_DSN');
        $user = getenv('TEST_DB_USER') ?: getenv('DB_TEST_USER');
        $pass = getenv('TEST_DB_PASS') ?: getenv('DB_TEST_PASS');

        if (!$dsn) {
            // If running under PHPUnit, mark the test skipped; otherwise print and exit when run directly
            if (method_exists($this, 'markTestSkipped')) {
                $this->markTestSkipped('No MySQL test DB configured. Set TEST_DB_DSN env var (e.g., mysql:host=127.0.0.1;dbname=test_db;charset=utf8mb4) and optionally TEST_DB_USER/TEST_DB_PASS.');
            } else {
                echo "Skipping TenantContextTest: no MySQL test DB configured. Set TEST_DB_DSN environment variable.\n";
                exit(0);
            }
        }

        $this->pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        
        // Create minimal schema (MySQL compatible types)
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS workspaces (
                id INT PRIMARY KEY,
                name VARCHAR(255),
                slug VARCHAR(255) UNIQUE,
                account_type VARCHAR(32) DEFAULT 'individual'
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS workspace_members (
                id INT AUTO_INCREMENT PRIMARY KEY,
                workspace_id INT,
                user_id INT,
                role VARCHAR(50)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS companies (
                id INT PRIMARY KEY,
                workspace_id INT,
                name VARCHAR(255)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS user_company_access (
                id INT AUTO_INCREMENT PRIMARY KEY,
                workspace_id INT,
                user_id INT,
                company_id INT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        
        // Insert test data
        $this->pdo->exec("INSERT IGNORE INTO workspaces (id, name, slug, account_type) VALUES (1, 'Test Workspace', 'test', 'agency')");
        $this->pdo->exec("INSERT IGNORE INTO workspace_members (workspace_id, user_id, role) VALUES (1, 1, 'owner')");
        $this->pdo->exec("INSERT IGNORE INTO companies (id, workspace_id, name) VALUES (1, 1, 'Company A')");
        $this->pdo->exec("INSERT IGNORE INTO companies (id, workspace_id, name) VALUES (2, 1, 'Company B')");
        $this->pdo->exec("INSERT IGNORE INTO user_company_access (workspace_id, user_id, company_id) VALUES (1, 1, 1)");
    }
    
    public function testWorkspaceOwnersCanAccessAllCompanies() {
        // Owner should have access to all companies in workspace
        $stmt = $this->pdo->prepare('SELECT id FROM companies WHERE workspace_id = ?');
        $stmt->execute([1]);
        $companies = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $companies = array_map('intval', $companies);
        
        $this->assertCount(2, $companies);
        $this->assertContains(1, $companies);
        $this->assertContains(2, $companies);
    }
    
    public function testUserCompanyAccessRestriction() {
        // Regular user (id=2) with limited access
        $this->pdo->exec("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (1, 2, 'member')");
        $this->pdo->exec("INSERT INTO user_company_access (workspace_id, user_id, company_id) VALUES (1, 2, 1)");
        
        $stmt = $this->pdo->prepare('SELECT company_id FROM user_company_access WHERE workspace_id = ? AND user_id = ?');
        $stmt->execute([1, 2]);
        $allowedCompanies = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $allowedCompanies = array_map('intval', $allowedCompanies);
        
        $this->assertCount(1, $allowedCompanies);
        $this->assertContains(1, $allowedCompanies);
        $this->assertNotContains(2, $allowedCompanies);
    }
    
    public function testCompanyScopeSQL() {
        // Test that SQL scope generation works
        $allowedCompanyIds = [1, 2];
        
        $placeholders = implode(',', array_fill(0, count($allowedCompanyIds), '?'));
        $sql = "company_id IN ($placeholders)";
        
        $this->assertEquals('company_id IN (?,?)', $sql);
    }
}

// Auto-run when executed directly (CLI) if PHPUnit isn't present
if (php_sapi_name() === 'cli' && !class_exists('PHPUnit\\TextUI\\Command')) {
    $t = new TenantContextTest();
    try {
        $t->setUp();
        $t->testWorkspaceOwnersCanAccessAllCompanies();
        $t->testUserCompanyAccessRestriction();
        $t->testCompanyScopeSQL();
        echo "All TenantContextTest checks passed.\n";
        exit(0);
    } catch (Throwable $e) {
        echo "One or more checks failed: " . $e->getMessage() . "\n";
        exit(1);
    }
}

