
import re
import os

FEATURE_FILE = r'd:\Backup\App Backups\Xordon\src\config\features.ts'

# Mapping of ID -> (Group, SubGroup)
# Using strict IDs from the file analysis
MAPPING = {
    # 1. FOUNDATION
    'dashboard': ('foundation', 'dashboard_communications'),
    'inbox': ('foundation', 'dashboard_communications'),
    'conversations': ('foundation', 'dashboard_communications'),
    'daily_planner': ('foundation', 'dashboard_communications'),
    'global_archive': ('foundation', 'global_tools'),
    'global_trash': ('foundation', 'global_tools'),
    'system_health': ('foundation', 'global_tools'),
    'snapshots': ('foundation', 'global_tools'),

    # 2. CLIENTS
    'contacts_all': ('clients', 'contacts'),
    'companies': ('clients', 'contacts'),
    'lists': ('clients', 'contacts'),
    'segments': ('clients', 'contacts'),
    'client_portal': ('clients', 'portal'),

    # 3. REACH
    'email_campaigns': ('reach', 'email'),
    'email_sequences': ('reach', 'email'),
    'email_templates': ('reach', 'email'),
    'email_replies': ('reach', 'email'),
    'email_warmup': ('reach', 'email'),
    'email_unsubscribers': ('reach', 'email'),
    
    'sms_campaigns': ('reach', 'sms'),
    'sms_sequences': ('reach', 'sms'),
    'sms_templates': ('reach', 'sms'),
    'sms_replies': ('reach', 'sms'),
    'sms_unsubscribers': ('reach', 'sms'),
    'sms_logs': ('reach', 'sms'),

    'calls_campaigns': ('reach', 'calls'),
    'calls_logs': ('reach', 'calls'),
    'calls_scripts': ('reach', 'calls'),
    'calls_agents': ('reach', 'calls'),
    'calls_numbers': ('reach', 'calls'),
    'calls_flows': ('reach', 'calls'),
    'calls_ivr_builder': ('reach', 'calls'), # Added
    'call_flows': ('reach', 'calls'), # Duplicate?
    'calls_pools': ('reach', 'calls'),
    'number_pools': ('reach', 'calls'), # Duplicate?
    'calls_voicemails': ('reach', 'calls'),
    'calls_recordings': ('reach', 'calls'),
    'calls_overview': ('reach', 'calls'),
    'calls_analytics': ('reach', 'calls'),
    'calls_analytics_advanced': ('reach', 'calls'),
    'phone_numbers': ('reach', 'calls'),

    'channels': ('reach', 'channels'),
    'whatsapp': ('reach', 'channels'),
    'messenger': ('reach', 'channels'),
    'linkedin': ('reach', 'channels'),

    # 4. CONVERSION
    'crm_dashboard': ('conversion', 'crm'),
    'crm_overview': ('conversion', 'crm'), # Alias if exists
    'crm_deals': ('conversion', 'crm'),
    'crm_contacts': ('conversion', 'crm'), # Maybe? No, contacts is in clients
    'crm_pipeline': ('conversion', 'crm'),
    'crm_leads': ('conversion', 'crm'),
    'lead_scoring': ('conversion', 'crm'),
    'crm_tasks': ('conversion', 'crm'),
    'crm_analytics': ('conversion', 'crm'),
    'crm_forecast': ('conversion', 'crm'),
    'crm_playbooks': ('conversion', 'crm'),
    'crm_goals': ('conversion', 'crm'),
    'crm_settings': ('conversion', 'crm'),
    
    'proposals': ('conversion', 'proposals'),
    'proposals_templates': ('conversion', 'proposals'),
    'proposals_analytics': ('conversion', 'proposals'),
    'proposals_workflow': ('conversion', 'proposals'),
    'proposals_integrations': ('conversion', 'proposals'), 
    'proposals_settings': ('conversion', 'proposals'),
    
    'estimates': ('conversion', 'quotes'),
    'e_signatures': ('conversion', 'quotes'),

    # 5. DELIVERY
    'projects': ('delivery', 'projects'),
    'projects_my_tasks': ('delivery', 'projects'),
    'projects_templates': ('delivery', 'projects'),
    'projects_analytics': ('delivery', 'projects'),
    'projects_archive': ('delivery', 'projects'),
    
    'services': ('delivery', 'operations'),
    'jobs': ('delivery', 'operations'),
    'requests': ('delivery', 'operations'),
    'referrals': ('delivery', 'operations'),
    'recalls': ('delivery', 'operations'),
    'intake_forms': ('delivery', 'operations'),
    'playbooks': ('delivery', 'operations'),
    'local_payments': ('delivery', 'operations'),
    
    'field_service': ('delivery', 'field_service'),
    'gps_tracking': ('delivery', 'field_service'),
    
    'appointments': ('delivery', 'scheduling'),
    'calendars': ('delivery', 'scheduling'),
    'booking_pages': ('delivery', 'scheduling'),
    'calendar_sync': ('delivery', 'scheduling'),
    'scheduling_payments': ('delivery', 'scheduling'),
    
    'ecommerce_dashboard': ('delivery', 'ecommerce'),
    'ecommerce_products': ('delivery', 'ecommerce'),
    'ecommerce_inventory': ('delivery', 'ecommerce'),
    'ecommerce_orders': ('delivery', 'ecommerce'), # id='ecommerce_orders' but path='/orders' check features
    'ecommerce_coupons': ('delivery', 'ecommerce'),
    'ecommerce_shipping': ('delivery', 'ecommerce'),
    'ecommerce_collections': ('delivery', 'ecommerce'),
    
    # 6. RETENTION
    'helpdesk': ('retention', 'helpdesk'),
    'helpdesk_tickets': ('retention', 'helpdesk'),
    'helpdesk_kb': ('retention', 'helpdesk'),
    'helpdesk_settings': ('retention', 'helpdesk'),
    'helpdesk_reports': ('retention', 'helpdesk'),
    
    'reputation_overview': ('retention', 'reputation'),
    'reputation_requests': ('retention', 'reputation'),
    'reputation_reviews': ('retention', 'reputation'),
    'review_response': ('retention', 'reputation'),
    'reputation_listings': ('retention', 'reputation'),
    'reputation_widgets': ('retention', 'reputation'),
    'reputation_settings': ('retention', 'reputation'),

    # 7. GROWTH
    'seo_dashboard': ('growth', 'seo'),
    'seo_audit': ('growth', 'seo'),
    'seo_keywords': ('growth', 'seo'),
    'seo_keyword_gap': ('growth', 'seo'),
    'seo_clustering': ('growth', 'seo'),
    'seo_serp': ('growth', 'seo'),
    'seo_content': ('growth', 'seo'),
    'seo_reports': ('growth', 'seo'),
    'seo_backlinks': ('growth', 'seo'),
    'seo_competitors': ('growth', 'seo'),
    
    'ads_manager': ('growth', 'marketing'),
    'funnels': ('growth', 'marketing'),
    'qr_codes': ('growth', 'marketing'),
    'social_scheduler': ('growth', 'marketing'),
    'content_management': ('growth', 'marketing'),
    'blogging_platform': ('growth', 'marketing'),
    
    'affiliates': ('growth', 'acquisition'),
    'customer_acquisition': ('growth', 'acquisition'),
    'marketplace_all': ('growth', 'acquisition'),
    'marketplace_inbox': ('growth', 'acquisition'), # Assuming marketplace leads stuff
    'marketplace_leads': ('growth', 'acquisition'),
    'marketplace_wallet': ('growth', 'acquisition'),
    'marketplace_templates': ('growth', 'acquisition'),
    'marketplace_preferences': ('growth', 'acquisition'),
    'marketplace_pricing': ('growth', 'acquisition'),
    'marketplace_services': ('growth', 'acquisition'),
    'marketplace_register': ('growth', 'acquisition'),
    
    'courses': ('growth', 'lms'),
    'memberships': ('growth', 'lms'),
    'certificates': ('growth', 'lms'),
    
    'loyalty_program': ('growth', 'engagement'),
    'webinar_hosting': ('growth', 'engagement'),
    
    # 8. OPTIMIZATION
    'ai_console': ('optimization', 'ai_agents'),
    'ai_agents': ('optimization', 'ai_agents'),
    'ai_agent_studio': ('optimization', 'ai_agents'),
    'ai_voice_ai': ('optimization', 'ai_agents'),
    'ai_conversation_ai': ('optimization', 'ai_agents'),
    'ai_knowledge_hub': ('optimization', 'ai_agents'),
    'ai_agent_templates': ('optimization', 'ai_agents'),
    'ai_content_ai': ('optimization', 'ai_agents'),
    'ai_chatbot': ('optimization', 'ai_agents'),
    'ai_settings': ('optimization', 'ai_agents'),
    
    'automations': ('optimization', 'automation'),
    'automation_recipes': ('optimization', 'automation'),
    'flow_builder': ('optimization', 'automation'),
    'ab_testing': ('optimization', 'automation'),
    'sentiment_config': ('optimization', 'automation'),
    'advanced_automation_builder': ('optimization', 'automation'),
    
    'insights': ('optimization', 'analytics'),
    # crm_analytics - duplicate, mapped to conversion?
    # User listed 'Analutics: CRM Analytics' under Optimization->Analytics.
    # But I mapped it to Conversion->CRM before.
    # User Request: "Analytics: Analytics Center, CRM Analytics...".
    # So I should move crm_analytics to optimization->analytics
    # Wait, "CRM: CRM Overview... Analytics" is also listed in Conversion->CRM.
    # Duplicate listing? 
    # User lists:
    # 4. CONVERSION -> CRM -> Analytics
    # 8. OPTIMIZATION -> Analytics -> CRM Analytics
    # If the feature ID is the same, I can only map it to one group/subgroup.
    # I'll stick to CONVERSION->CRM for `crm_analytics` if it's context-specific.
    # But wait, `crm_analytics` in `features.ts` (line 980) has group `reporting`?
    # I'll map it to 'optimization', 'analytics' to follow the Optimization request which seems to aggregate analytics.
    # Or keep it in CRM. Let's look at the sidebar preference. Usually analytics is centralized or per-module. The user lists it in BOTH places?
    # "4. CONVERSION -> CRM -> ..., Analytics, ..."
    # "8. OPTIMIZATION -> Analytics -> ..., CRM Analytics, ..."
    # The user might want it visible in both?
    # I can't easily duplicate the item in the features.ts list without adding a new item.
    # I'll enable it for 'optimization' (Analytics Center) primarily if that's the "Center".
    # BUT, specific CRM users want it in CRM.
    # For now, I will map `crm_analytics` to `optimization / analytics` to populate that section, and maybe I can alias it in AppSidebar for CRM section if needed.
    # Actually, looking at `features.ts`, there is `crm_analytics` (id).
    
    # Let's map strict to the 8. OPTIMIZATION group for "Analytics Center".
    'analytics_center': ('optimization', 'analytics'), # Not found? Using 'advanced_reporting' maybe?
    'advanced_reporting': ('optimization', 'analytics'),
    'revenue_attribution': ('optimization', 'analytics'),
    'enablement_analytics': ('optimization', 'analytics'), 
    # 'reports' -> Global Reports?
    'reports': ('optimization', 'analytics'),
    
    'finance_overview': ('optimization', 'finance'),
    'invoices': ('optimization', 'finance'),
    # estimates mapped to conversion -> quotes.
    'products': ('optimization', 'finance'),
    'transactions': ('optimization', 'finance'),
    'subscriptions': ('optimization', 'finance'),
    'payment_processing': ('optimization', 'finance'),
    'text_to_pay': ('optimization', 'finance'),
    'consumer_financing': ('optimization', 'finance'),
    'expenses': ('optimization', 'finance'),
    'payroll': ('optimization', 'finance'),
    'commissions': ('optimization', 'finance'),
    'dunning': ('optimization', 'finance'),
    'finance_integrations': ('optimization', 'finance'),
    'finance_settings': ('optimization', 'finance'),
    
    'hr_recruitment': ('optimization', 'hr'),
    'hr_scheduling': ('optimization', 'hr'),
    'hr_profile': ('optimization', 'hr'),
    'time_tracking': ('optimization', 'hr'),
    'hr_leave': ('optimization', 'hr'),
    'hr_employees': ('optimization', 'hr'),
    'hr_settings': ('optimization', 'hr'),
    
    'settings': ('optimization', 'admin'),
    'integrations': ('optimization', 'admin'),
    'webhooks': ('optimization', 'admin'),
    'agency_users': ('optimization', 'admin'),
    'audit_log': ('optimization', 'admin'),
    'apps': ('optimization', 'admin'),
    'mobile_settings': ('optimization', 'admin'), # If exists
    'push_notifications': ('optimization', 'admin'), # If exists
    'agency_settings': ('optimization', 'admin'),
    'agency_subaccounts': ('optimization', 'admin'),
    'agency_billing': ('optimization', 'admin'),
}

with open(FEATURE_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to process the file item by item.
# The structure is `id: 'foo', ... group: 'bar', ...`
# Regex to match each object might be complex because of nesting. 
# But the objects are simple Key-Value.

# Strategy: iterate over known IDs and regex update their group/subGroup.

for fid, (group, subgroup) in MAPPING.items():
    # Regex to find the object block for this ID
    # Pattern: { ... id: 'fid' ... group: 'old' ... }
    # We look for "id: 'fid'" then look forward for "group: '...'" and "subGroup: '...'" inside the same object (curly braces).
    # Since we can't easily parse JS with regex, we'll try a line-based approach assuming standard formatting.
    # Find line with `id: 'fid'`
    # Then forward until `},` to find `group:` and `subGroup:`.
    
    # 1. Find start index of `id: 'fid'`
    # We use regex to be safe with whitespace
    pattern_id = re.compile(rf"id:\s*'{fid}'")
    match = pattern_id.search(content)
    
    if match:
        start_idx = match.start()
        # Find the end of this object (next `},` or `}`)
        # This is a heuristic, but usually robust for formatted code
        end_idx = content.find('},', start_idx)
        if end_idx == -1: end_idx = content.find('}', start_idx) # Last item
        
        block = content[start_idx:end_idx]
        
        # Replace group
        if "group:" in block:
            block = re.sub(r"group:\s*'[^']+'", f"group: '{group}'", block)
        else:
            # Add group if missing (unlikely based on file)
            block += f",\n    group: '{group}'"
            
        # Replace subGroup
        if subgroup:
            if "subGroup:" in block:
                block = re.sub(r"subGroup:\s*'[^']+'", f"subGroup: '{subgroup}'", block)
            else:
                # Add subGroup. tricky to insert at right place, but JS works with trailing commas.
                # Insert before the last newline or comma?
                # Safer: Insert after group line
                block = block.replace(f"group: '{group}'", f"group: '{group}',\n    subGroup: '{subgroup}'")
        else:
            # Remove subGroup if it exists and we want none? Or just leave it?
            # MAPPING has subGroup for all.
            pass
            
        # Apply change
        content = content[:start_idx] + block + content[end_idx:]

with open(FEATURE_FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print("Features updated successfully.")
