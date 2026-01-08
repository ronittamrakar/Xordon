-- Create call_agents table for managing callers/agents
CREATE TABLE IF NOT EXISTS call_agents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  extension VARCHAR(20),
  status ENUM('active', 'inactive', 'busy', 'away') DEFAULT 'active',
  max_concurrent_calls INT DEFAULT 1,
  skills TEXT, -- JSON array of skills/specializations
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add agent_id column to call_campaigns table
ALTER TABLE call_campaigns 
ADD COLUMN IF NOT EXISTS agent_id INT NULL AFTER user_id,
ADD FOREIGN KEY (agent_id) REFERENCES call_agents(id) ON DELETE SET NULL;

-- Add agent_id column to call_logs table
ALTER TABLE call_logs 
ADD COLUMN IF NOT EXISTS agent_id INT NULL,
ADD FOREIGN KEY (agent_id) REFERENCES call_agents(id) ON DELETE SET NULL;
