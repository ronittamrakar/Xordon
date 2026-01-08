<?php
/**
 * AI Workforce Infrastructure Migration
 * Creates tables for the AI Employee ecosystem
 */

require_once __DIR__ . '/../src/Database.php';

try {
    $pdo = Database::conn();
    
    echo "Creating AI Workforce tables...\n";
    
    // 1. AI Employees Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ai_employees (
            id SERIAL PRIMARY KEY,
            workspace_id INTEGER NOT NULL,
            agent_id INTEGER REFERENCES ai_agents(id) ON DELETE CASCADE,
            employee_type VARCHAR(50) NOT NULL,
            role VARCHAR(100) NOT NULL,
            department VARCHAR(100),
            supervisor_id INTEGER REFERENCES ai_employees(id) ON DELETE SET NULL,
            autonomy_level VARCHAR(20) DEFAULT 'assisted',
            status VARCHAR(20) DEFAULT 'active',
            capabilities TEXT DEFAULT '[]',
            permissions TEXT DEFAULT '{}',
            context_memory TEXT DEFAULT '{}',
            performance_metrics TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER,
            UNIQUE(workspace_id, agent_id)
        )
    ");
    
    // 2. AI Work History Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ai_work_history (
            id SERIAL PRIMARY KEY,
            workspace_id INTEGER NOT NULL,
            employee_id INTEGER REFERENCES ai_employees(id) ON DELETE CASCADE,
            action_type VARCHAR(100) NOT NULL,
            module VARCHAR(50),
            entity_type VARCHAR(50),
            entity_id INTEGER,
            action_data TEXT DEFAULT '{}',
            outcome VARCHAR(50),
            human_approved BOOLEAN DEFAULT false,
            approved_by INTEGER,
            approved_at TIMESTAMP NULL,
            execution_time_ms INTEGER,
            token_usage INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // 3. AI Workflows Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ai_workflows (
            id SERIAL PRIMARY KEY,
            workspace_id INTEGER NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            workflow_type VARCHAR(50),
            trigger_type VARCHAR(50),
            trigger_config TEXT DEFAULT '{}',
            steps TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'active',
            success_rate DECIMAL(5,2) DEFAULT 0,
            total_executions INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER
        )
    ");
    
    // 4. AI Workflow Executions Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ai_workflow_executions (
            id SERIAL PRIMARY KEY,
            workspace_id INTEGER NOT NULL,
            workflow_id INTEGER REFERENCES ai_workflows(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'running',
            current_step INTEGER DEFAULT 0,
            context TEXT DEFAULT '{}',
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP NULL,
            error_message TEXT
        )
    ");
    
    // 5. AI Approvals Queue Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ai_approval_queue (
            id SERIAL PRIMARY KEY,
            workspace_id INTEGER NOT NULL,
            employee_id INTEGER REFERENCES ai_employees(id) ON DELETE CASCADE,
            action_type VARCHAR(100) NOT NULL,
            action_description TEXT,
            action_data TEXT NOT NULL,
            priority VARCHAR(20) DEFAULT 'medium',
            requires_approval_from INTEGER,
            status VARCHAR(20) DEFAULT 'pending',
            approved_by INTEGER,
            approved_at TIMESTAMP NULL,
            rejection_reason TEXT,
            expires_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // 6. AI Corporate Memory Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ai_corporate_memory (
            id SERIAL PRIMARY KEY,
            workspace_id INTEGER NOT NULL,
            memory_type VARCHAR(50),
            entity_type VARCHAR(50),
            entity_id INTEGER,
            content TEXT NOT NULL,
            embedding TEXT,
            metadata TEXT DEFAULT '{}',
            access_level VARCHAR(20) DEFAULT 'workspace',
            accessible_by TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // 7. AI Performance Metrics Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ai_performance_metrics (
            id SERIAL PRIMARY KEY,
            workspace_id INTEGER NOT NULL,
            employee_id INTEGER REFERENCES ai_employees(id) ON DELETE CASCADE,
            metric_date DATE NOT NULL,
            tasks_completed INTEGER DEFAULT 0,
            tasks_failed INTEGER DEFAULT 0,
            approvals_required INTEGER DEFAULT 0,
            approvals_granted INTEGER DEFAULT 0,
            average_execution_time_ms INTEGER,
            total_token_usage INTEGER DEFAULT 0,
            user_satisfaction_score DECIMAL(3,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(workspace_id, employee_id, metric_date)
        )
    ");
    
    // 8. AI Training Data Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ai_training_data (
            id SERIAL PRIMARY KEY,
            workspace_id INTEGER NOT NULL,
            employee_id INTEGER REFERENCES ai_employees(id) ON DELETE CASCADE,
            training_type VARCHAR(50),
            input_data TEXT NOT NULL,
            expected_output TEXT,
            actual_output TEXT,
            feedback TEXT,
            rating INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER
        )
    ");
    
    // Create indexes
    echo "Creating indexes...\n";
    
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ai_employees_workspace ON ai_employees(workspace_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ai_employees_role ON ai_employees(role)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ai_employees_supervisor ON ai_employees(supervisor_id)");
    
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ai_work_history_workspace ON ai_work_history(workspace_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ai_work_history_employee ON ai_work_history(employee_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ai_work_history_created ON ai_work_history(created_at)");
    
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ai_workflows_workspace ON ai_workflows(workspace_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ai_workflow_executions_workflow ON ai_workflow_executions(workflow_id)");
    
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ai_approval_queue_workspace ON ai_approval_queue(workspace_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ai_approval_queue_status ON ai_approval_queue(status)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ai_approval_queue_user ON ai_approval_queue(requires_approval_from)");
    
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ai_corporate_memory_workspace ON ai_corporate_memory(workspace_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ai_corporate_memory_type ON ai_corporate_memory(memory_type)");
    
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ai_performance_workspace ON ai_performance_metrics(workspace_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ai_performance_employee ON ai_performance_metrics(employee_id)");
    
    echo "✅ AI Workforce tables created successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
