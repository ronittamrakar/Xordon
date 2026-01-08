<?php
use PHPUnit\Framework\TestCase;

class JobQueueServiceTest extends TestCase {
    private $pdo;
    
    protected function setUp(): void {
        // Use MySQL test database if configured; otherwise skip tests
        $dsn = getenv('TEST_DB_DSN') ?: getenv('DB_TEST_DSN');
        $user = getenv('TEST_DB_USER') ?: getenv('DB_TEST_USER');
        $pass = getenv('TEST_DB_PASS') ?: getenv('DB_TEST_PASS');

        if (!$dsn) {
            $this->markTestSkipped('No MySQL test DB configured. Set TEST_DB_DSN env var (e.g., mysql:host=127.0.0.1;dbname=test_db;charset=utf8mb4) and optionally TEST_DB_USER/TEST_DB_PASS.');
        }

        $this->pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

        // Create jobs_queue table (MySQL compatible types)
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS jobs_queue (
                id INT AUTO_INCREMENT PRIMARY KEY,
                workspace_id INT,
                job_type VARCHAR(255) NOT NULL,
                job_key VARCHAR(255),
                payload TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                priority INT DEFAULT 0,
                max_attempts INT DEFAULT 3,
                attempts INT DEFAULT 0,
                scheduled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                locked_by VARCHAR(255),
                locked_at DATETIME,
                started_at DATETIME,
                completed_at DATETIME,
                error_message TEXT,
                next_retry_at DATETIME,
                result TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        // Create jobs_history table
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS jobs_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                job_id INT,
                workspace_id INT,
                job_type VARCHAR(255),
                payload TEXT,
                status VARCHAR(50),
                result TEXT,
                error_message TEXT,
                duration_ms INT,
                attempts INT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
    }
    
    public function testScheduleJob() {
        // Insert a job
        $stmt = $this->pdo->prepare("
            INSERT INTO jobs_queue (workspace_id, job_type, payload)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([1, 'test_job', json_encode(['data' => 'test'])]);
        
        $jobId = $this->pdo->lastInsertId();
        $this->assertGreaterThan(0, $jobId);
        
        // Verify job was created
        $stmt = $this->pdo->prepare("SELECT * FROM jobs_queue WHERE id = ?");
        $stmt->execute([$jobId]);
        $job = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $this->assertEquals('test_job', $job['job_type']);
        $this->assertEquals('pending', $job['status']);
        $this->assertEquals(1, $job['workspace_id']);
    }
    
    public function testFetchNextJob() {
        // Insert multiple jobs with different priorities
        $this->pdo->exec("INSERT INTO jobs_queue (job_type, payload, priority) VALUES ('low', '{}', 0)");
        $this->pdo->exec("INSERT INTO jobs_queue (job_type, payload, priority) VALUES ('high', '{}', 10)");
        
        // Fetch next should get highest priority
        $stmt = $this->pdo->query("
            SELECT * FROM jobs_queue 
            WHERE status = 'pending' 
            ORDER BY priority DESC, scheduled_at ASC 
            LIMIT 1
        ");
        $job = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $this->assertEquals('high', $job['job_type']);
        $this->assertEquals(10, $job['priority']);
    }
    
    public function testJobCompletion() {
        // Create a job
        $this->pdo->exec("INSERT INTO jobs_queue (id, job_type, payload, status) VALUES (1, 'test', '{}', 'processing')");
        
        // Mark as completed
        $stmt = $this->pdo->prepare("
            UPDATE jobs_queue 
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP, result = ?
            WHERE id = ?
        ");
        $stmt->execute([json_encode(['success' => true]), 1]);
        
        // Verify
        $stmt = $this->pdo->query("SELECT * FROM jobs_queue WHERE id = 1");
        $job = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $this->assertEquals('completed', $job['status']);
        $this->assertNotNull($job['completed_at']);
    }
    
    public function testPendingCount() {
        // Insert test jobs
        $this->pdo->exec("INSERT INTO jobs_queue (job_type, payload, status) VALUES ('test1', '{}', 'pending')");
        $this->pdo->exec("INSERT INTO jobs_queue (job_type, payload, status) VALUES ('test2', '{}', 'pending')");
        $this->pdo->exec("INSERT INTO jobs_queue (job_type, payload, status) VALUES ('test3', '{}', 'completed')");
        
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM jobs_queue WHERE status = 'pending'");
        $count = $stmt->fetchColumn();
        
        $this->assertEquals(2, $count);
    }
}
