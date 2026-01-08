-- ============================================
-- DATA INTEGRITY: Foreign Key Constraints
-- Ensures referential integrity across tables
-- ============================================

-- Note: Run with SET FOREIGN_KEY_CHECKS = 0 if needed for existing data

-- Contacts relationships
ALTER TABLE contacts 
ADD CONSTRAINT fk_contacts_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE contacts 
ADD CONSTRAINT fk_contacts_company 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- Deals relationships
ALTER TABLE deals 
ADD CONSTRAINT fk_deals_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE deals 
ADD CONSTRAINT fk_deals_contact 
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE deals 
ADD CONSTRAINT fk_deals_pipeline 
FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE SET NULL;

-- Tasks relationships
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_contact 
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_assigned 
FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

-- Tickets relationships
ALTER TABLE tickets 
ADD CONSTRAINT fk_tickets_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE tickets 
ADD CONSTRAINT fk_tickets_contact 
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE tickets 
ADD CONSTRAINT fk_tickets_assigned 
FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

-- Campaigns relationships
ALTER TABLE campaigns 
ADD CONSTRAINT fk_campaigns_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE campaigns 
ADD CONSTRAINT fk_campaigns_sending_account 
FOREIGN KEY (sending_account_id) REFERENCES sending_accounts(id) ON DELETE SET NULL;

-- Invoices relationships
ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_contact 
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

-- Orders relationships
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE orders 
ADD CONSTRAINT fk_orders_contact 
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

-- Activities relationships
ALTER TABLE activities 
ADD CONSTRAINT fk_activities_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE activities 
ADD CONSTRAINT fk_activities_contact 
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

ALTER TABLE activities 
ADD CONSTRAINT fk_activities_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Appointments relationships
ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_contact 
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

-- Messages relationships
ALTER TABLE messages 
ADD CONSTRAINT fk_messages_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD CONSTRAINT fk_messages_contact 
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

-- Automations relationships
ALTER TABLE automations 
ADD CONSTRAINT fk_automations_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Automation runs relationships
ALTER TABLE automation_runs 
ADD CONSTRAINT fk_automation_runs_automation 
FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE;

ALTER TABLE automation_runs 
ADD CONSTRAINT fk_automation_runs_contact 
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

-- Forms relationships
ALTER TABLE forms 
ADD CONSTRAINT fk_forms_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Form submissions relationships
ALTER TABLE form_submissions 
ADD CONSTRAINT fk_form_submissions_form 
FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE;

ALTER TABLE form_submissions 
ADD CONSTRAINT fk_form_submissions_contact 
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

-- Workspace members relationships
ALTER TABLE workspace_members 
ADD CONSTRAINT fk_workspace_members_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE workspace_members 
ADD CONSTRAINT fk_workspace_members_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Social posts relationships
ALTER TABLE social_posts 
ADD CONSTRAINT fk_social_posts_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Products relationships
ALTER TABLE products 
ADD CONSTRAINT fk_products_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Order items relationships
ALTER TABLE order_items 
ADD CONSTRAINT fk_order_items_order 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE order_items 
ADD CONSTRAINT fk_order_items_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- Proposals relationships
ALTER TABLE proposals 
ADD CONSTRAINT fk_proposals_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE proposals 
ADD CONSTRAINT fk_proposals_contact 
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

-- Templates relationships
ALTER TABLE templates 
ADD CONSTRAINT fk_templates_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Notes relationships
ALTER TABLE notes 
ADD CONSTRAINT fk_notes_workspace 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE notes 
ADD CONSTRAINT fk_notes_contact 
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
