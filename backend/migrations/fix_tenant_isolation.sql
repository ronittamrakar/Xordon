-- ============================================
-- CRITICAL: Add workspace_id to 17 Tables
-- This migration fixes tenant isolation gaps
-- Run with: php backend/run_migration.php backend/migrations/fix_tenant_isolation.sql
-- ============================================

-- 1. ecommerce_abandoned_carts
ALTER TABLE ecommerce_abandoned_carts 
ADD COLUMN IF NOT EXISTS workspace_id INT NOT NULL DEFAULT 1 AFTER id;

CREATE INDEX IF NOT EXISTS idx_ecommerce_abandoned_carts_workspace 
ON ecommerce_abandoned_carts(workspace_id);

-- 2. ecommerce_collections
ALTER TABLE ecommerce_collections 
ADD COLUMN IF NOT EXISTS workspace_id INT NOT NULL DEFAULT 1 AFTER id;

CREATE INDEX IF NOT EXISTS idx_ecommerce_collections_workspace 
ON ecommerce_collections(workspace_id);

-- 3. ecommerce_coupons
ALTER TABLE ecommerce_coupons 
ADD COLUMN IF NOT EXISTS workspace_id INT NOT NULL DEFAULT 1 AFTER id;

CREATE INDEX IF NOT EXISTS idx_ecommerce_coupons_workspace 
ON ecommerce_coupons(workspace_id);

-- 4. ecommerce_inventory
ALTER TABLE ecommerce_inventory 
ADD COLUMN IF NOT EXISTS workspace_id INT NOT NULL DEFAULT 1 AFTER id;

CREATE INDEX IF NOT EXISTS idx_ecommerce_inventory_workspace 
ON ecommerce_inventory(workspace_id);

-- 5. ecommerce_shipping_methods
ALTER TABLE ecommerce_shipping_methods 
ADD COLUMN IF NOT EXISTS workspace_id INT NOT NULL DEFAULT 1 AFTER id;

CREATE INDEX IF NOT EXISTS idx_ecommerce_shipping_methods_workspace 
ON ecommerce_shipping_methods(workspace_id);

-- 6. ecommerce_warehouses
ALTER TABLE ecommerce_warehouses 
ADD COLUMN IF NOT EXISTS workspace_id INT NOT NULL DEFAULT 1 AFTER id;

CREATE INDEX IF NOT EXISTS idx_ecommerce_warehouses_workspace 
ON ecommerce_warehouses(workspace_id);

-- 7. followup_automations
ALTER TABLE followup_automations 
ADD COLUMN IF NOT EXISTS workspace_id INT NOT NULL DEFAULT 1 AFTER id;

CREATE INDEX IF NOT EXISTS idx_followup_automations_workspace 
ON followup_automations(workspace_id);

-- 8. health_alerts
ALTER TABLE health_alerts 
ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER id;

CREATE INDEX IF NOT EXISTS idx_health_alerts_workspace 
ON health_alerts(workspace_id);

-- 9. loyalty_balances
ALTER TABLE loyalty_balances 
ADD COLUMN IF NOT EXISTS workspace_id INT NOT NULL DEFAULT 1 AFTER id;

CREATE INDEX IF NOT EXISTS idx_loyalty_balances_workspace 
ON loyalty_balances(workspace_id);

-- 10. marketplace_disputes
ALTER TABLE marketplace_disputes 
ADD COLUMN IF NOT EXISTS workspace_id INT NOT NULL DEFAULT 1 AFTER id;

CREATE INDEX IF NOT EXISTS idx_marketplace_disputes_workspace 
ON marketplace_disputes(workspace_id);

-- 11. social_post_accounts
ALTER TABLE social_post_accounts 
ADD COLUMN IF NOT EXISTS workspace_id INT NOT NULL DEFAULT 1 AFTER id;

CREATE INDEX IF NOT EXISTS idx_social_post_accounts_workspace 
ON social_post_accounts(workspace_id);

-- 12. webinar_poll_responses
ALTER TABLE webinar_poll_responses 
ADD COLUMN IF NOT EXISTS workspace_id INT NOT NULL DEFAULT 1 AFTER id;

CREATE INDEX IF NOT EXISTS idx_webinar_poll_responses_workspace 
ON webinar_poll_responses(workspace_id);

-- 13. crm_dashboard (might not exist, safe to skip if error)
-- Note: This appears to be a view or temporary table in some setups

-- System tables (workspace_id is optional - these are global)
-- role_permissions - Global permissions, no workspace_id needed
-- user_roles - Global roles, no workspace_id needed
-- _fb_user_map - Migration helper, can be deleted after use
-- _webforms_user_map - Migration helper, can be deleted after use
