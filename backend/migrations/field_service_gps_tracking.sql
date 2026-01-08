-- Field Service & GPS Tracking Tables
-- Comprehensive field service management with GPS tracking, dispatch, and technician management

-- GPS Location Logs
CREATE TABLE IF NOT EXISTS gps_location_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NOT NULL,
    
    -- Location data
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy DECIMAL(8,2) NULL COMMENT 'Accuracy in meters',
    altitude DECIMAL(8,2) NULL COMMENT 'Altitude in meters',
    speed DECIMAL(8,2) NULL COMMENT 'Speed in m/s',
    heading DECIMAL(5,2) NULL COMMENT 'Heading in degrees',
    
    -- Metadata
    recorded_at TIMESTAMP NOT NULL,
    source ENUM('mobile', 'web', 'device') DEFAULT 'mobile',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_gps_logs_user (user_id, recorded_at DESC),
    INDEX idx_gps_logs_workspace (workspace_id, recorded_at DESC),
    INDEX idx_gps_logs_date (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Technician Status
CREATE TABLE IF NOT EXISTS technician_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    workspace_id INT NOT NULL,
    
    -- Status
    current_status ENUM('available', 'busy', 'on_break', 'offline', 'en_route') DEFAULT 'offline',
    current_job_id INT NULL,
    
    -- Current location
    current_lat DECIMAL(10,8) NULL,
    current_lng DECIMAL(11,8) NULL,
    last_location_update TIMESTAMP NULL,
    
    -- Availability
    estimated_available_at TIMESTAMP NULL,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_user_workspace (user_id, workspace_id),
    INDEX idx_tech_status_workspace (workspace_id, current_status),
    INDEX idx_tech_status_job (current_job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Field Dispatch Jobs
CREATE TABLE IF NOT EXISTS field_dispatch_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    job_id INT NULL COMMENT 'Link to jobs table if exists',
    appointment_id INT NULL COMMENT 'Link to appointments table if exists',
    
    -- Assignment
    assigned_technician_id INT NULL,
    
    -- Status & Priority
    status ENUM('pending', 'dispatched', 'en_route', 'on_site', 'completed', 'cancelled') DEFAULT 'pending',
    priority ENUM('low', 'normal', 'high', 'emergency') DEFAULT 'normal',
    
    -- Scheduling
    scheduled_start TIMESTAMP NULL,
    scheduled_end TIMESTAMP NULL,
    actual_start TIMESTAMP NULL,
    actual_end TIMESTAMP NULL,
    
    -- Customer info
    customer_name VARCHAR(255) NULL,
    customer_phone VARCHAR(50) NULL,
    
    -- Service location
    service_address TEXT NULL,
    service_lat DECIMAL(10,8) NULL,
    service_lng DECIMAL(11,8) NULL,
    
    -- Notes
    notes TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_dispatch_jobs_workspace (workspace_id, status, scheduled_start),
    INDEX idx_dispatch_jobs_technician (assigned_technician_id, status),
    INDEX idx_dispatch_jobs_date (scheduled_start),
    INDEX idx_dispatch_jobs_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service Zones
CREATE TABLE IF NOT EXISTS service_zones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- Zone details
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    
    -- Zone definition
    zone_type ENUM('polygon', 'radius', 'zip_codes') DEFAULT 'polygon',
    zone_data JSON NULL COMMENT 'Polygon points, radius center/distance, or zip codes',
    
    -- Visual
    color VARCHAR(7) DEFAULT '#3b82f6',
    
    -- Assignment
    assigned_team_id INT NULL,
    
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_service_zones_workspace (workspace_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Geo-fences
CREATE TABLE IF NOT EXISTS geo_fences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    entity_id INT NOT NULL COMMENT 'User or vehicle ID',
    entity_type ENUM('user', 'vehicle', 'equipment') DEFAULT 'user',
    
    -- Fence details
    name VARCHAR(100) NOT NULL,
    fence_type ENUM('circle', 'polygon') DEFAULT 'circle',
    
    -- Circle fence
    center_lat DECIMAL(10,8) NULL,
    center_lng DECIMAL(11,8) NULL,
    radius_meters INT NULL,
    
    -- Polygon fence
    polygon_points JSON NULL,
    
    -- Triggers
    trigger_on ENUM('enter', 'exit', 'both') DEFAULT 'both',
    notification_enabled TINYINT(1) DEFAULT 1,
    
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_geo_fences_workspace (workspace_id, is_active),
    INDEX idx_geo_fences_entity (entity_id, entity_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Geo-fence Alerts
CREATE TABLE IF NOT EXISTS geo_fence_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    fence_id INT NOT NULL,
    entity_id INT NOT NULL,
    
    -- Alert details
    alert_type ENUM('enter', 'exit') NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    
    -- Notification
    notification_sent TINYINT(1) DEFAULT 0,
    notification_sent_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_geo_alerts_workspace (workspace_id, created_at DESC),
    INDEX idx_geo_alerts_fence (fence_id, created_at DESC),
    INDEX idx_geo_alerts_entity (entity_id, created_at DESC),
    
    FOREIGN KEY (fence_id) REFERENCES geo_fences(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customer Tracking Links
CREATE TABLE IF NOT EXISTS customer_tracking_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    job_id INT NOT NULL,
    
    -- Link details
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    
    -- Tracking
    is_active TINYINT(1) DEFAULT 1,
    views INT DEFAULT 0,
    last_viewed_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tracking_links_job (job_id),
    INDEX idx_tracking_links_token (token),
    INDEX idx_tracking_links_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customer Notifications (for GPS tracking)
CREATE TABLE IF NOT EXISTS gps_customer_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    job_id INT NOT NULL,
    contact_id INT NULL,
    
    -- Notification details
    notification_type ENUM('en_route', 'arriving_soon', 'arrived', 'delayed') NOT NULL,
    sent_via ENUM('sms', 'email', 'push', 'both') DEFAULT 'sms',
    
    -- Content
    message TEXT NULL,
    eta_minutes INT NULL,
    tracking_link VARCHAR(500) NULL,
    
    -- Status
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered TINYINT(1) DEFAULT 0,
    delivered_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_gps_notifications_job (job_id, sent_at DESC),
    INDEX idx_gps_notifications_workspace (workspace_id, sent_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Route Optimization History
CREATE TABLE IF NOT EXISTS route_optimization_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    technician_id INT NOT NULL,
    
    -- Route details
    route_date DATE NOT NULL,
    job_count INT DEFAULT 0,
    
    -- Optimization results
    total_distance_km DECIMAL(10,2) NULL,
    total_duration_minutes INT NULL,
    optimized TINYINT(1) DEFAULT 0,
    
    -- Job order
    job_order JSON NULL COMMENT 'Array of job IDs in optimized order',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_route_history_tech (technician_id, route_date),
    INDEX idx_route_history_workspace (workspace_id, route_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
