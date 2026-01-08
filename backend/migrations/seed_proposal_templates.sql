-- Seed additional proposal templates for better coverage
-- Run after add_proposals_tables.sql

-- Check if templates already exist to avoid duplicates
INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status) 
SELECT 1, 'Consulting Engagement Proposal', 'Professional consulting services engagement template', 'consulting',
'<h1>Consulting Engagement Proposal</h1><p>Prepared for: {{client_name}}</p><p>{{client_company}}</p><p>Date: {{date}}</p><hr/><p>Thank you for considering our consulting services. This proposal outlines our approach to helping you achieve your business objectives.</p>',
'[{"id":"executive","title":"Executive Summary","content":"<p>Brief overview of the engagement and expected outcomes.</p>"},{"id":"background","title":"Background & Objectives","content":"<p>Understanding of your current situation and goals.</p>"},{"id":"approach","title":"Our Approach","content":"<p>Methodology and framework we will use.</p>"},{"id":"deliverables","title":"Deliverables","content":"<p>Specific outputs and milestones.</p>"},{"id":"team","title":"Project Team","content":"<p>Key personnel assigned to this engagement.</p>"},{"id":"timeline","title":"Timeline","content":"<p>Project phases and schedule.</p>"},{"id":"investment","title":"Investment","content":"<p>Fees and payment terms.</p>"},{"id":"terms","title":"Terms & Conditions","content":"<p>Engagement terms and conditions.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'Consulting Engagement Proposal' AND is_default = TRUE);

INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status)
SELECT 1, 'Web Design & Development Proposal', 'Complete web design and development project template', 'technology',
'<h1>Web Design & Development Proposal</h1><p>Prepared for: {{client_name}}</p><p>{{client_company}}</p><p>Date: {{date}}</p><hr/><p>We are excited to present our proposal for your new website project.</p>',
'[{"id":"intro","title":"Introduction","content":"<p>Overview of the project and our understanding of your needs.</p>"},{"id":"goals","title":"Project Goals","content":"<p>What we aim to achieve with this website.</p>"},{"id":"scope","title":"Scope of Work","content":"<p>Detailed breakdown of design and development work.</p>"},{"id":"features","title":"Features & Functionality","content":"<p>Key features to be implemented.</p>"},{"id":"design","title":"Design Process","content":"<p>Our design approach and revision process.</p>"},{"id":"technology","title":"Technology Stack","content":"<p>Technologies and platforms we will use.</p>"},{"id":"timeline","title":"Project Timeline","content":"<p>Milestones and delivery schedule.</p>"},{"id":"pricing","title":"Investment","content":"<p>Project cost breakdown.</p>"},{"id":"maintenance","title":"Ongoing Support","content":"<p>Post-launch maintenance options.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'Web Design & Development Proposal' AND is_default = TRUE);

INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status)
SELECT 1, 'Social Media Management Proposal', 'Social media marketing and management services', 'marketing',
'<h1>Social Media Management Proposal</h1><p>Prepared for: {{client_name}}</p><p>{{client_company}}</p><p>Date: {{date}}</p><hr/><p>Elevate your brand presence with our comprehensive social media management services.</p>',
'[{"id":"overview","title":"Overview","content":"<p>Introduction to our social media services.</p>"},{"id":"audit","title":"Current State Analysis","content":"<p>Assessment of your current social media presence.</p>"},{"id":"strategy","title":"Proposed Strategy","content":"<p>Our recommended approach and content strategy.</p>"},{"id":"platforms","title":"Platform Management","content":"<p>Platforms we will manage and optimize.</p>"},{"id":"content","title":"Content Creation","content":"<p>Types of content we will create.</p>"},{"id":"engagement","title":"Community Management","content":"<p>How we will engage with your audience.</p>"},{"id":"reporting","title":"Analytics & Reporting","content":"<p>Metrics we will track and report on.</p>"},{"id":"pricing","title":"Investment","content":"<p>Monthly management fees.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'Social Media Management Proposal' AND is_default = TRUE);

INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status)
SELECT 1, 'SEO Services Proposal', 'Search engine optimization services template', 'marketing',
'<h1>SEO Services Proposal</h1><p>Prepared for: {{client_name}}</p><p>{{client_company}}</p><p>Date: {{date}}</p><hr/><p>Improve your search visibility and drive organic traffic with our proven SEO strategies.</p>',
'[{"id":"intro","title":"Introduction","content":"<p>Overview of SEO and its importance for your business.</p>"},{"id":"audit","title":"Website Audit Summary","content":"<p>Key findings from our initial analysis.</p>"},{"id":"strategy","title":"SEO Strategy","content":"<p>Our recommended optimization approach.</p>"},{"id":"onpage","title":"On-Page Optimization","content":"<p>Technical and content improvements.</p>"},{"id":"offpage","title":"Off-Page SEO","content":"<p>Link building and authority development.</p>"},{"id":"local","title":"Local SEO","content":"<p>Local search optimization tactics.</p>"},{"id":"reporting","title":"Reporting & KPIs","content":"<p>How we measure and report success.</p>"},{"id":"timeline","title":"Timeline","content":"<p>Expected timeline for results.</p>"},{"id":"pricing","title":"Investment","content":"<p>Service packages and pricing.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'SEO Services Proposal' AND is_default = TRUE);

INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status)
SELECT 1, 'Branding & Identity Proposal', 'Brand identity design and development', 'services',
'<h1>Branding & Identity Proposal</h1><p>Prepared for: {{client_name}}</p><p>{{client_company}}</p><p>Date: {{date}}</p><hr/><p>Create a memorable brand identity that resonates with your target audience.</p>',
'[{"id":"intro","title":"Introduction","content":"<p>The importance of strong brand identity.</p>"},{"id":"discovery","title":"Discovery Phase","content":"<p>Understanding your brand values and audience.</p>"},{"id":"research","title":"Market Research","content":"<p>Competitive analysis and market positioning.</p>"},{"id":"strategy","title":"Brand Strategy","content":"<p>Positioning, messaging, and voice.</p>"},{"id":"identity","title":"Visual Identity","content":"<p>Logo, colors, typography, and imagery.</p>"},{"id":"applications","title":"Brand Applications","content":"<p>Collateral and touchpoint design.</p>"},{"id":"guidelines","title":"Brand Guidelines","content":"<p>Documentation for consistent brand usage.</p>"},{"id":"timeline","title":"Timeline","content":"<p>Project phases and milestones.</p>"},{"id":"pricing","title":"Investment","content":"<p>Project cost and payment schedule.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'Branding & Identity Proposal' AND is_default = TRUE);

INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status)
SELECT 1, 'Video Production Proposal', 'Video content creation and production services', 'services',
'<h1>Video Production Proposal</h1><p>Prepared for: {{client_name}}</p><p>{{client_company}}</p><p>Date: {{date}}</p><hr/><p>Bring your story to life with professional video production.</p>',
'[{"id":"overview","title":"Project Overview","content":"<p>Understanding of your video needs and goals.</p>"},{"id":"concept","title":"Creative Concept","content":"<p>Our creative vision for your video.</p>"},{"id":"preproduction","title":"Pre-Production","content":"<p>Scripting, storyboarding, and planning.</p>"},{"id":"production","title":"Production","content":"<p>Filming, equipment, and crew.</p>"},{"id":"postproduction","title":"Post-Production","content":"<p>Editing, graphics, and sound design.</p>"},{"id":"deliverables","title":"Deliverables","content":"<p>Final video formats and assets.</p>"},{"id":"timeline","title":"Timeline","content":"<p>Production schedule.</p>"},{"id":"pricing","title":"Investment","content":"<p>Production costs breakdown.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'Video Production Proposal' AND is_default = TRUE);

INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status)
SELECT 1, 'Event Planning Proposal', 'Corporate event planning and management', 'services',
'<h1>Event Planning Proposal</h1><p>Prepared for: {{client_name}}</p><p>{{client_company}}</p><p>Event Date: {{event_date}}</p><hr/><p>Create an unforgettable event experience with our expert planning services.</p>',
'[{"id":"overview","title":"Event Overview","content":"<p>Event concept and objectives.</p>"},{"id":"venue","title":"Venue & Logistics","content":"<p>Venue selection and setup requirements.</p>"},{"id":"program","title":"Event Program","content":"<p>Schedule and activities.</p>"},{"id":"catering","title":"Catering & Hospitality","content":"<p>Food, beverage, and guest services.</p>"},{"id":"entertainment","title":"Entertainment","content":"<p>Speakers, performers, and activities.</p>"},{"id":"marketing","title":"Event Marketing","content":"<p>Promotion and registration.</p>"},{"id":"management","title":"On-Site Management","content":"<p>Day-of coordination and support.</p>"},{"id":"budget","title":"Budget","content":"<p>Detailed cost breakdown.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'Event Planning Proposal' AND is_default = TRUE);

INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status)
SELECT 1, 'IT Services Proposal', 'IT support and managed services', 'technology',
'<h1>IT Services Proposal</h1><p>Prepared for: {{client_name}}</p><p>{{client_company}}</p><p>Date: {{date}}</p><hr/><p>Reliable IT support to keep your business running smoothly.</p>',
'[{"id":"intro","title":"Introduction","content":"<p>Overview of our IT services.</p>"},{"id":"assessment","title":"Current IT Assessment","content":"<p>Analysis of your current infrastructure.</p>"},{"id":"services","title":"Proposed Services","content":"<p>IT support and management services.</p>"},{"id":"security","title":"Security & Compliance","content":"<p>Cybersecurity measures and compliance.</p>"},{"id":"support","title":"Support Model","content":"<p>Help desk and response times.</p>"},{"id":"monitoring","title":"Monitoring & Maintenance","content":"<p>Proactive system monitoring.</p>"},{"id":"sla","title":"Service Level Agreement","content":"<p>SLA terms and guarantees.</p>"},{"id":"pricing","title":"Investment","content":"<p>Monthly service fees.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'IT Services Proposal' AND is_default = TRUE);

INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status)
SELECT 1, 'Photography Services Proposal', 'Professional photography services', 'services',
'<h1>Photography Services Proposal</h1><p>Prepared for: {{client_name}}</p><p>{{client_company}}</p><p>Date: {{date}}</p><hr/><p>Capture your moments with professional photography.</p>',
'[{"id":"overview","title":"Project Overview","content":"<p>Understanding of your photography needs.</p>"},{"id":"style","title":"Photography Style","content":"<p>Our creative approach and style.</p>"},{"id":"coverage","title":"Coverage Details","content":"<p>What is included in the shoot.</p>"},{"id":"equipment","title":"Equipment & Team","content":"<p>Professional equipment and crew.</p>"},{"id":"deliverables","title":"Deliverables","content":"<p>Number of images and formats.</p>"},{"id":"timeline","title":"Timeline","content":"<p>Shoot schedule and delivery timeline.</p>"},{"id":"pricing","title":"Investment","content":"<p>Photography packages and pricing.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'Photography Services Proposal' AND is_default = TRUE);

INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status)
SELECT 1, 'Content Writing Proposal', 'Content creation and copywriting services', 'marketing',
'<h1>Content Writing Proposal</h1><p>Prepared for: {{client_name}}</p><p>{{client_company}}</p><p>Date: {{date}}</p><hr/><p>Engage your audience with compelling content.</p>',
'[{"id":"intro","title":"Introduction","content":"<p>The power of quality content.</p>"},{"id":"audit","title":"Content Audit","content":"<p>Review of existing content.</p>"},{"id":"strategy","title":"Content Strategy","content":"<p>Recommended content approach.</p>"},{"id":"types","title":"Content Types","content":"<p>Blog posts, articles, web copy, etc.</p>"},{"id":"process","title":"Writing Process","content":"<p>Research, writing, and revision workflow.</p>"},{"id":"deliverables","title":"Deliverables","content":"<p>Content pieces and schedule.</p>"},{"id":"pricing","title":"Investment","content":"<p>Per-piece or retainer pricing.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'Content Writing Proposal' AND is_default = TRUE);

INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status)
SELECT 1, 'Mobile App Development Proposal', 'iOS and Android app development', 'technology',
'<h1>Mobile App Development Proposal</h1><p>Prepared for: {{client_name}}</p><p>{{client_company}}</p><p>Date: {{date}}</p><hr/><p>Build a powerful mobile app that users love.</p>',
'[{"id":"overview","title":"Project Overview","content":"<p>App concept and business objectives.</p>"},{"id":"features","title":"Features & Functionality","content":"<p>Core features and user flows.</p>"},{"id":"design","title":"UI/UX Design","content":"<p>Design approach and user experience.</p>"},{"id":"platforms","title":"Platforms","content":"<p>iOS, Android, or cross-platform.</p>"},{"id":"technology","title":"Technology Stack","content":"<p>Development frameworks and tools.</p>"},{"id":"backend","title":"Backend & API","content":"<p>Server infrastructure and integrations.</p>"},{"id":"testing","title":"Testing & QA","content":"<p>Quality assurance process.</p>"},{"id":"timeline","title":"Development Timeline","content":"<p>Sprints and milestones.</p>"},{"id":"pricing","title":"Investment","content":"<p>Development costs.</p>"},{"id":"maintenance","title":"Post-Launch Support","content":"<p>Maintenance and updates.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'Mobile App Development Proposal' AND is_default = TRUE);

INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status)
SELECT 1, 'E-commerce Development Proposal', 'Online store development and setup', 'technology',
'<h1>E-commerce Development Proposal</h1><p>Prepared for: {{client_name}}</p><p>{{client_company}}</p><p>Date: {{date}}</p><hr/><p>Launch your online store and start selling.</p>',
'[{"id":"overview","title":"Project Overview","content":"<p>E-commerce goals and requirements.</p>"},{"id":"platform","title":"Platform Selection","content":"<p>Recommended e-commerce platform.</p>"},{"id":"design","title":"Store Design","content":"<p>Theme customization and branding.</p>"},{"id":"products","title":"Product Setup","content":"<p>Catalog structure and product pages.</p>"},{"id":"payments","title":"Payments & Shipping","content":"<p>Payment gateways and shipping setup.</p>"},{"id":"integrations","title":"Integrations","content":"<p>Third-party tools and services.</p>"},{"id":"seo","title":"SEO & Marketing","content":"<p>Search optimization and marketing tools.</p>"},{"id":"training","title":"Training","content":"<p>Store management training.</p>"},{"id":"timeline","title":"Timeline","content":"<p>Development and launch schedule.</p>"},{"id":"pricing","title":"Investment","content":"<p>Development costs.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'E-commerce Development Proposal' AND is_default = TRUE);

-- ============================================
-- HOME SERVICES & LOCAL BUSINESS TEMPLATES
-- ============================================

INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status)
SELECT 1, 'Home Services Estimate', 'Residential service estimate for plumbing, HVAC, electrical, etc.', 'home_services',
'<h1>Service Estimate</h1><p>Prepared for: {{client_name}}</p><p>{{property_address}}</p><p>Date: {{date}}</p><hr/><p>Thank you for choosing our services. This estimate outlines the work to be performed and associated costs.</p>',
'[{"id":"property","title":"Property Information","content":"<p>Address, access notes, and property details.</p>"},{"id":"assessment","title":"Service Assessment","content":"<p>Description of the issue or service request.</p>"},{"id":"scope","title":"Scope of Work","content":"<p>Detailed breakdown of work to be performed.</p>"},{"id":"materials","title":"Materials & Parts","content":"<p>Required materials, parts, and equipment.</p>"},{"id":"labor","title":"Labor","content":"<p>Estimated time and labor costs.</p>"},{"id":"timeline","title":"Timeline","content":"<p>Expected start and completion dates.</p>"},{"id":"pricing","title":"Total Investment","content":"<p>Line item breakdown and total cost.</p>"},{"id":"warranty","title":"Warranty & Guarantee","content":"<p>Service warranty and satisfaction guarantee.</p>"},{"id":"terms","title":"Terms & Conditions","content":"<p>Payment terms, cancellation policy, and conditions.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'Home Services Estimate' AND is_default = TRUE);

INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status)
SELECT 1, 'Maintenance Agreement Proposal', 'Recurring maintenance service agreement for HVAC, landscaping, cleaning, etc.', 'home_services',
'<h1>Maintenance Agreement Proposal</h1><p>Prepared for: {{client_name}}</p><p>{{property_address}}</p><p>Date: {{date}}</p><hr/><p>Keep your property in top condition with our comprehensive maintenance program.</p>',
'[{"id":"overview","title":"Program Overview","content":"<p>Benefits of regular preventive maintenance.</p>"},{"id":"services","title":"Included Services","content":"<p>List of maintenance tasks and frequency.</p>"},{"id":"schedule","title":"Service Schedule","content":"<p>Visit frequency and scheduling process.</p>"},{"id":"response","title":"Priority Response","content":"<p>Emergency service and response times for members.</p>"},{"id":"discounts","title":"Member Benefits","content":"<p>Discounts on repairs and priority scheduling.</p>"},{"id":"pricing","title":"Membership Investment","content":"<p>Monthly or annual pricing options.</p>"},{"id":"contract","title":"Agreement Terms","content":"<p>Contract duration, renewal, and cancellation terms.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'Maintenance Agreement Proposal' AND is_default = TRUE);

INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status)
SELECT 1, 'Local Business Service Proposal', 'General service proposal for local contractors and service providers', 'local_business',
'<h1>Service Proposal</h1><p>Prepared for: {{client_name}}</p><p>{{client_company}}</p><p>Location: {{service_location}}</p><p>Date: {{date}}</p><hr/><p>We appreciate the opportunity to provide you with this proposal for our professional services.</p>',
'[{"id":"intro","title":"Introduction","content":"<p>About our company and why we are the right choice.</p>"},{"id":"understanding","title":"Understanding Your Needs","content":"<p>Summary of your requirements and our assessment.</p>"},{"id":"solution","title":"Proposed Solution","content":"<p>Our recommended approach to address your needs.</p>"},{"id":"scope","title":"Scope of Work","content":"<p>Detailed description of services to be provided.</p>"},{"id":"deliverables","title":"Deliverables","content":"<p>What you will receive upon completion.</p>"},{"id":"timeline","title":"Project Timeline","content":"<p>Estimated schedule from start to finish.</p>"},{"id":"investment","title":"Investment","content":"<p>Pricing breakdown and payment schedule.</p>"},{"id":"guarantee","title":"Our Guarantee","content":"<p>Quality assurance and satisfaction guarantee.</p>"},{"id":"next_steps","title":"Next Steps","content":"<p>How to proceed and what happens next.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'Local Business Service Proposal' AND is_default = TRUE);

INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status)
SELECT 1, 'Lawn Care & Landscaping Proposal', 'Lawn maintenance and landscaping services proposal', 'home_services',
'<h1>Lawn Care & Landscaping Proposal</h1><p>Prepared for: {{client_name}}</p><p>Property Address: {{property_address}}</p><p>Date: {{date}}</p><hr/><p>Transform and maintain your outdoor space with our professional lawn care services.</p>',
'[{"id":"property","title":"Property Assessment","content":"<p>Property size, current condition, and features.</p>"},{"id":"services","title":"Recommended Services","content":"<p>Mowing, edging, fertilization, weed control, etc.</p>"},{"id":"schedule","title":"Service Schedule","content":"<p>Frequency of visits and seasonal services.</p>"},{"id":"enhancements","title":"Optional Enhancements","content":"<p>Mulching, pruning, seasonal planting, etc.</p>"},{"id":"equipment","title":"Equipment & Materials","content":"<p>Professional equipment and quality products used.</p>"},{"id":"pricing","title":"Service Packages","content":"<p>Package options and pricing.</p>"},{"id":"guarantee","title":"Satisfaction Guarantee","content":"<p>Our commitment to quality and customer satisfaction.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'Lawn Care & Landscaping Proposal' AND is_default = TRUE);

INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status)
SELECT 1, 'Cleaning Services Proposal', 'Residential or commercial cleaning services proposal', 'home_services',
'<h1>Cleaning Services Proposal</h1><p>Prepared for: {{client_name}}</p><p>Location: {{service_location}}</p><p>Date: {{date}}</p><hr/><p>Enjoy a spotless environment with our professional cleaning services.</p>',
'[{"id":"overview","title":"Service Overview","content":"<p>Introduction to our cleaning services and standards.</p>"},{"id":"assessment","title":"Space Assessment","content":"<p>Property type, size, and specific needs.</p>"},{"id":"services","title":"Cleaning Services","content":"<p>Detailed list of cleaning tasks included.</p>"},{"id":"frequency","title":"Service Frequency","content":"<p>One-time, weekly, bi-weekly, or monthly options.</p>"},{"id":"products","title":"Products & Equipment","content":"<p>Eco-friendly products and professional equipment.</p>"},{"id":"team","title":"Our Team","content":"<p>Background-checked, trained professionals.</p>"},{"id":"pricing","title":"Service Pricing","content":"<p>Pricing based on service type and frequency.</p>"},{"id":"guarantee","title":"Satisfaction Guarantee","content":"<p>100% satisfaction guarantee and quality commitment.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'Cleaning Services Proposal' AND is_default = TRUE);

INSERT INTO proposal_templates (user_id, name, description, category, content, sections, is_default, status)
SELECT 1, 'Pest Control Service Proposal', 'Pest control and extermination services proposal', 'home_services',
'<h1>Pest Control Service Proposal</h1><p>Prepared for: {{client_name}}</p><p>Property Address: {{property_address}}</p><p>Date: {{date}}</p><hr/><p>Protect your property with our comprehensive pest control solutions.</p>',
'[{"id":"inspection","title":"Inspection Findings","content":"<p>Results of property inspection and pest identification.</p>"},{"id":"treatment","title":"Treatment Plan","content":"<p>Recommended pest control methods and products.</p>"},{"id":"application","title":"Application Process","content":"<p>Treatment application and safety procedures.</p>"},{"id":"prevention","title":"Prevention Measures","content":"<p>Steps to prevent future infestations.</p>"},{"id":"followup","title":"Follow-up Service","content":"<p>Scheduled follow-up visits and monitoring.</p>"},{"id":"pricing","title":"Service Investment","content":"<p>One-time treatment or ongoing protection plans.</p>"},{"id":"safety","title":"Safety & Environment","content":"<p>Pet-safe, eco-friendly treatment options.</p>"},{"id":"guarantee","title":"Service Guarantee","content":"<p>Warranty and re-treatment guarantee.</p>"}]',
TRUE, 'active'
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE name = 'Pest Control Service Proposal' AND is_default = TRUE);
