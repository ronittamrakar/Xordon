-- Add sequence_steps table for storing email steps in sequences

CREATE TABLE IF NOT EXISTS sequence_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sequence_id INT NOT NULL,
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  delay_days INT NOT NULL DEFAULT 0,
  step_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE
);

-- Add index for better performance
CREATE INDEX idx_sequence_steps_sequence_id ON sequence_steps(sequence_id);
CREATE INDEX idx_sequence_steps_order ON sequence_steps(sequence_id, step_order);