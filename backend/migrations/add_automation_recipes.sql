-- Automation Recipes / Playbooks Library

CREATE TABLE IF NOT EXISTS automation_recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('welcome', 'nurture', 'reengagement', 'abandoned_cart', 'post_purchase', 'birthday', 'review_request', 'appointment', 'custom') NOT NULL,
    industry VARCHAR(100),
    target_audience ENUM('local_business', 'agency', 'ecommerce', 'saas', 'general') DEFAULT 'general',
    channels JSON,
    trigger_type VARCHAR(100),
    trigger_config JSON,
    steps JSON NOT NULL,
    estimated_duration VARCHAR(50),
    difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    tags JSON,
    preview_image VARCHAR(500),
    usage_count INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    status ENUM('draft', 'published', 'archived') DEFAULT 'published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_target_audience (target_audience)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_automation_instances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    client_id INT DEFAULT NULL,
    recipe_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    customized_steps JSON,
    status ENUM('draft', 'active', 'paused', 'completed') DEFAULT 'draft',
    trigger_config JSON,
    stats JSON,
    last_triggered_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES automation_recipes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default system recipes
INSERT INTO automation_recipes (is_system, name, description, category, target_audience, channels, trigger_type, steps, difficulty) VALUES
(TRUE, 'Welcome Email Series', 'Onboard new subscribers with a 3-email welcome sequence', 'welcome', 'general', '["email"]', 'contact_created', '[{"type":"email","delay":0,"subject":"Welcome!","template":"welcome_1"},{"type":"email","delay":24,"subject":"Getting Started","template":"welcome_2"},{"type":"email","delay":72,"subject":"Tips & Tricks","template":"welcome_3"}]', 'beginner'),
(TRUE, 'Abandoned Cart Recovery', 'Recover lost sales with timely reminders', 'abandoned_cart', 'ecommerce', '["email","sms"]', 'cart_abandoned', '[{"type":"email","delay":1,"subject":"You left something behind"},{"type":"sms","delay":24,"message":"Your cart is waiting!"},{"type":"email","delay":48,"subject":"Last chance - 10% off"}]', 'beginner'),
(TRUE, 'Review Request Sequence', 'Ask happy customers for reviews', 'review_request', 'local_business', '["email","sms"]', 'order_completed', '[{"type":"email","delay":168,"subject":"How was your experience?"},{"type":"sms","delay":336,"message":"Quick favor - leave us a review?"}]', 'beginner'),
(TRUE, 'Lead Nurture Campaign', 'Convert leads with educational content', 'nurture', 'agency', '["email"]', 'tag_added', '[{"type":"email","delay":0,"subject":"Your free guide"},{"type":"email","delay":72,"subject":"Case study"},{"type":"email","delay":168,"subject":"Ready to talk?"}]', 'intermediate'),
(TRUE, 'Re-engagement Campaign', 'Win back inactive contacts', 'reengagement', 'general', '["email"]', 'inactive_30_days', '[{"type":"email","delay":0,"subject":"We miss you!"},{"type":"email","delay":72,"subject":"Special offer inside"},{"type":"email","delay":168,"subject":"Last chance to stay connected"}]', 'beginner');
