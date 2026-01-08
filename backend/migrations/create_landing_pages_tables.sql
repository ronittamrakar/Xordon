-- Create landing_pages table
CREATE TABLE IF NOT EXISTS landing_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    content JSON NOT NULL,
    seo_title VARCHAR(255),
    seo_description TEXT,
    slug VARCHAR(255) UNIQUE,
    custom_domain VARCHAR(255),
    template_id INT NULL,
    views INT DEFAULT 0,
    conversions INT DEFAULT 0,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (template_id) REFERENCES proposal_templates(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_slug (slug),
    INDEX idx_published_at (published_at)
);

-- Create landing_page_templates table
CREATE TABLE IF NOT EXISTS landing_page_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    content JSON NOT NULL,
    preview_image VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_status (status)
);

-- Create landing_page_analytics table
CREATE TABLE IF NOT EXISTS landing_page_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    landing_page_id INT NOT NULL,
    event_type ENUM('view', 'conversion', 'form_submit', 'click') NOT NULL,
    event_data JSON NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(500),
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (landing_page_id) REFERENCES landing_pages(id) ON DELETE CASCADE,
    
    INDEX idx_landing_page_id (landing_page_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
);

-- Create landing_page_submissions table
CREATE TABLE IF NOT EXISTS landing_page_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    landing_page_id INT NOT NULL,
    form_data JSON NOT NULL,
    status ENUM('new', 'contacted', 'converted', 'closed') DEFAULT 'new',
    notes TEXT,
    assigned_to INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (landing_page_id) REFERENCES landing_pages(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_landing_page_id (landing_page_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Insert default landing page templates
INSERT INTO landing_page_templates (user_id, name, description, category, content, is_default) VALUES
(1, 'Modern Business Landing', 'Clean and professional business landing page with hero section', 'business', '{
  "sections": [
    {
      "type": "hero",
      "content": {
        "headline": "Transform Your Business Today",
        "subheadline": "Professional solutions for modern companies",
        "ctaText": "Get Started",
        "backgroundImage": ""
      }
    },
    {
      "type": "features",
      "content": {
        "title": "Why Choose Us",
        "features": [
          {"title": "Expert Team", "description": "Years of experience"},
          {"title": "Quality Service", "description": "Premium solutions"},
          {"title": "24/7 Support", "description": "Always here to help"}
        ]
      }
    },
    {
      "type": "form",
      "content": {
        "title": "Contact Us",
        "description": "Get in touch for a consultation",
        "formFields": ["name", "email", "phone", "message"]
      }
    }
  ]
}', TRUE),
(1, 'Lead Generation Funnel', 'High-converting lead capture page', 'lead-generation', '{
  "sections": [
    {
      "type": "hero",
      "content": {
        "headline": "Get Your Free Quote Today",
        "subheadline": "No obligation, instant response",
        "ctaText": "Request Quote",
        "backgroundImage": ""
      }
    },
    {
      "type": "testimonials",
      "content": {
        "title": "Happy Customers",
        "testimonials": [
          {"name": "John D.", "text": "Excellent service!"}
        ]
      }
    },
    {
      "type": "form",
      "content": {
        "title": "Quick Quote Form",
        "description": "Fill out for instant quote",
        "formFields": ["name", "email", "phone"]
      }
    }
  ]
}', TRUE),
(1, 'Product Showcase', 'Elegant product presentation page', 'product', '{
  "sections": [
    {
      "type": "hero",
      "content": {
        "headline": "Discover Our Amazing Product",
        "subheadline": "Innovative solutions for your needs",
        "ctaText": "Learn More",
        "backgroundImage": ""
      }
    },
    {
      "type": "features",
      "content": {
        "title": "Key Features",
        "features": [
          {"title": "Feature 1", "description": "Amazing capability"},
          {"title": "Feature 2", "description": "Powerful functionality"},
          {"title": "Feature 3", "description": "User-friendly design"}
        ]
      }
    },
    {
      "type": "pricing",
      "content": {
        "title": "Simple Pricing",
        "plans": [
          {"name": "Basic", "price": "$99", "features": ["Feature A", "Feature B"]},
          {"name": "Pro", "price": "$199", "features": ["All features", "Priority support"]}
        ]
      }
    }
  ]
}', TRUE);

-- Create triggers for updating analytics counters
DELIMITER //
CREATE TRIGGER update_landing_page_views AFTER INSERT ON landing_page_analytics
FOR EACH ROW
BEGIN
    IF NEW.event_type = 'view' THEN
        UPDATE landing_pages SET views = views + 1 WHERE id = NEW.landing_page_id;
    ELSEIF NEW.event_type = 'conversion' THEN
        UPDATE landing_pages SET conversions = conversions + 1 WHERE id = NEW.landing_page_id;
    END IF;
END//
DELIMITER ;
