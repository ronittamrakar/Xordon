-- ============================================
-- PERFORMANCE: Critical Database Indexes v2
-- High-traffic query optimization
-- ============================================

-- Contacts (high-traffic)
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_email ON contacts(workspace_id, email);
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_created ON contacts(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_updated ON contacts(workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_status ON contacts(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_company ON contacts(workspace_id, company_id);

-- Campaigns (high-traffic)
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_status ON campaigns(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_created ON campaigns(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_type ON campaigns(workspace_id, type);

-- Email Campaigns
CREATE INDEX IF NOT EXISTS idx_email_campaigns_workspace_status ON email_campaigns(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON email_sends(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_email_sends_recipient ON email_sends(recipient_email);

-- Tickets (helpdesk - high-traffic)
CREATE INDEX IF NOT EXISTS idx_tickets_workspace_status ON tickets(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_workspace_assigned ON tickets(workspace_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_workspace_priority ON tickets(workspace_id, priority);
CREATE INDEX IF NOT EXISTS idx_tickets_workspace_created ON tickets(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_contact ON tickets(contact_id);

-- Activities (very high-traffic for timeline)
CREATE INDEX IF NOT EXISTS idx_activities_workspace_created ON activities(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_contact ON activities(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_workspace_type ON activities(workspace_id, type);

-- Automations
CREATE INDEX IF NOT EXISTS idx_automations_workspace_status ON automations(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_automation ON automation_runs(automation_id, status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_contact ON automation_runs(contact_id);

-- Messages (inbox - high-traffic)
CREATE INDEX IF NOT EXISTS idx_messages_workspace_created ON messages(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_workspace_read ON messages(workspace_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_contact ON messages(contact_id);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_due ON tasks(workspace_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_assigned ON tasks(workspace_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_status ON tasks(workspace_id, status);

-- Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_workspace_date ON appointments(workspace_id, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_workspace_status ON appointments(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_contact ON appointments(contact_id);

-- Users & Auth
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id, role);

-- Companies
CREATE INDEX IF NOT EXISTS idx_companies_workspace ON companies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_companies_user ON companies(user_id);

-- Deals (Sales)
CREATE INDEX IF NOT EXISTS idx_deals_workspace_stage ON deals(workspace_id, stage);
CREATE INDEX IF NOT EXISTS idx_deals_workspace_value ON deals(workspace_id, value DESC);
CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals(contact_id);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_workspace_status ON invoices(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_workspace_due ON invoices(workspace_id, due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_contact ON invoices(contact_id);

-- Orders (Ecommerce)
CREATE INDEX IF NOT EXISTS idx_orders_workspace_status ON orders(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_workspace_created ON orders(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_contact ON orders(contact_id);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_workspace_status ON products(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_products_workspace_category ON products(workspace_id, category_id);

-- Analytics (reporting queries)
CREATE INDEX IF NOT EXISTS idx_analytics_events_workspace_date ON analytics_events(workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_workspace_type ON analytics_events(workspace_id, event_type);

-- Social Posts
CREATE INDEX IF NOT EXISTS idx_social_posts_workspace_scheduled ON social_posts(workspace_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_social_posts_workspace_status ON social_posts(workspace_id, status);

-- Forms
CREATE INDEX IF NOT EXISTS idx_forms_workspace ON forms(workspace_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form ON form_submissions(form_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_contact ON form_submissions(contact_id);

-- Lists (Segments)
CREATE INDEX IF NOT EXISTS idx_lists_workspace ON lists(workspace_id);
CREATE INDEX IF NOT EXISTS idx_list_members_list ON list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_list_members_contact ON list_members(contact_id);
