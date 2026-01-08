import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AiAgentTemplate } from '@/lib/api';
import { aiTemplatesApi } from '@/services/aiTemplatesApi';

export const useAiTemplates = () => {
    return useQuery<AiAgentTemplate[]>({
        queryKey: ['ai-templates'],
        queryFn: async () => {
            try {
                const data = await aiTemplatesApi.getAiTemplates();
                // If API returns successfully but with no data (common in fresh installs),
                // fall back to the demo templates so the UI isn't empty.
                if (!data || data.length === 0) {
                    console.info('No templates from API, using fallback data');
                    return getFallbackTemplates();
                }
                return data;
            } catch (error) {
                console.warn('AI templates API not available:', error);
                // Return fallback templates if API fails
                return getFallbackTemplates();
            }
        },
    });
};

export const useAiTemplate = (id: string) => {
    return useQuery({
        queryKey: ['ai-template', id],
        queryFn: async () => await aiTemplatesApi.getAiTemplate(id),
        enabled: !!id,
    });
};

export const useAiTemplateAction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, name }: { id: string; name?: string }) => {
            try {
                return await aiTemplatesApi.useAiTemplate(id, { name });
            } catch (error) {
                console.warn('API unavailable, simulating template usage', error);
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                return { id: `new-agent-${Date.now()}`, message: 'Agent created from template (Simulation)' };
            }
        },
        onSuccess: () => {
            // Invalidate full agent list to show new agent
            queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
        },
    });
};

// Fallback templates for when API is unavailable
function getFallbackTemplates(): AiAgentTemplate[] {
    const defaultTemplates: AiAgentTemplate[] = [
        // ============================================
        // HOME SERVICES TEMPLATES
        // ============================================
        {
            id: 'hvac-pro-assistant',
            name: 'HVAC Pro Assistant',
            description: 'Specialized AI agent for HVAC companies. Handles emergency service requests, schedules maintenance appointments, provides seasonal tips, and qualifies leads for system replacements. Understands HVAC terminology and urgency levels.',
            category: 'Home Services',
            author: 'ServicePro AI',
            type: 'hybrid',
            business_niches: ['HVAC', 'Heating & Cooling', 'Air Conditioning'],
            use_cases: ['Emergency Dispatch', 'Maintenance Scheduling', 'Lead Qualification', 'Seasonal Campaigns'],
            downloads: 34200,
            rating: 4.9,
            reviews_count: 187,
            price: 'Free',
            image_url: 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png',
            is_official: true,
            is_verified: true,
            prompt_template: `You are an expert HVAC service assistant for {company_name}. Your role is to:

1. EMERGENCY ASSESSMENT: Quickly identify if the customer has a heating/cooling emergency (no heat in winter, no AC in summer, gas smell, etc.)
2. APPOINTMENT SCHEDULING: Book service appointments based on urgency and technician availability
3. LEAD QUALIFICATION: Identify opportunities for system replacements, upgrades, or maintenance plans
4. SEASONAL GUIDANCE: Provide helpful tips for system maintenance and efficiency

CONVERSATION FLOW:
- Greet warmly and ask how you can help
- For emergencies: Prioritize same-day service, collect address and callback number
- For routine service: Gather issue details, suggest appointment times
- For new systems: Qualify budget, home size, current system age
- Always offer maintenance plan enrollment

KNOWLEDGE BASE:
- Service area: {service_area}
- Emergency response time: {emergency_response_time}
- Standard appointment slots: {appointment_slots}
- Maintenance plan pricing: {maintenance_plan_pricing}

Be professional, empathetic during emergencies, and always confirm appointment details.`,
            settings: {
                temperature: 0.7,
                max_tokens: 500,
                response_format: 'conversational',
                collect_email: true,
                collect_phone: true,
                collect_address: true,
                business_hours: '24/7',
                emergency_keywords: ['no heat', 'no cooling', 'gas smell', 'water leak', 'not working'],
                lead_scoring_enabled: true,
            }
        },
        {
            id: 'plumbing-dispatch-pro',
            name: 'Plumbing Dispatch Pro',
            description: 'AI-powered plumbing dispatcher that handles emergency calls, schedules routine repairs, and provides immediate troubleshooting advice. Trained on common plumbing issues and can triage based on severity.',
            category: 'Home Services',
            author: 'ServicePro AI',
            type: 'voice',
            business_niches: ['Plumbing', 'Emergency Plumbing', 'Drain Cleaning'],
            use_cases: ['Emergency Response', '24/7 Dispatch', 'Troubleshooting', 'Appointment Booking'],
            downloads: 29800,
            rating: 4.8,
            reviews_count: 156,
            price: 'Free',
            image_url: 'https://cdn-icons-png.flaticon.com/512/2917/2917242.png',
            is_official: true,
            is_verified: true,
            prompt_template: `You are a professional plumbing dispatcher for {company_name}. Your mission is to help customers quickly and efficiently.

EMERGENCY TRIAGE (Priority 1 - Immediate):
- Burst pipes or major water leaks
- Sewage backup
- No water supply
- Gas line issues
→ Dispatch immediately, get address and callback number

URGENT (Priority 2 - Same Day):
- Clogged drains
- Running toilets
- Water heater issues
- Slow drains
→ Schedule within 4 hours

ROUTINE (Priority 3 - Next Available):
- Faucet repairs
- Installation requests
- Preventive maintenance
→ Schedule next available appointment

TROUBLESHOOTING TIPS:
- For running toilets: Check flapper valve
- For slow drains: Try hot water and dish soap first
- For low water pressure: Check main shutoff valve

Always collect: Name, address, phone number, issue description, and preferred contact method.
Confirm all appointment details and provide estimated arrival window.`,
            settings: {
                temperature: 0.6,
                max_tokens: 400,
                response_format: 'conversational',
                voice_enabled: true,
                voice_type: 'professional_male',
                collect_email: true,
                collect_phone: true,
                collect_address: true,
                business_hours: '24/7',
                emergency_keywords: ['burst pipe', 'flooding', 'sewage', 'no water', 'gas leak'],
                auto_dispatch: true,
            }
        },
        {
            id: 'electrical-service-bot',
            name: 'Electrical Service Bot',
            description: 'Safety-focused AI agent for electrical contractors. Identifies electrical emergencies, schedules installations, and provides safety guidance. Emphasizes licensed electrician requirements and safety protocols.',
            category: 'Home Services',
            author: 'ServicePro AI',
            type: 'hybrid',
            business_niches: ['Electrical', 'Electrician', 'Electrical Repair'],
            use_cases: ['Safety Assessment', 'Emergency Dispatch', 'Installation Quotes', 'Code Compliance'],
            downloads: 22400,
            rating: 4.9,
            reviews_count: 134,
            price: 'Free',
            image_url: 'https://cdn-icons-png.flaticon.com/512/2917/2917888.png',
            is_official: true,
            is_verified: true,
            prompt_template: `You are a licensed electrical service coordinator for {company_name}. Safety is your top priority.

CRITICAL EMERGENCIES (Dispatch Immediately):
- Sparking outlets or panels
- Burning smell from electrical
- Power outages affecting only one property
- Exposed wiring
- Electric shocks
→ Advise to turn off main breaker if safe, dispatch emergency electrician

URGENT SERVICE (Same Day):
- Flickering lights throughout home
- Tripped breakers that won't reset
- Outlets not working
- GFCI issues
→ Schedule priority appointment

PLANNED WORK (Quote & Schedule):
- Panel upgrades
- New installations (outlets, fixtures, ceiling fans)
- EV charger installation
- Generator installation
- Whole-home rewiring
→ Schedule estimate appointment

SAFETY REMINDERS:
- Never touch electrical equipment with wet hands
- Don't overload outlets
- All work performed by licensed electricians
- Permits obtained for all major work

Collect: Property type, issue description, when it started, safety concerns, preferred contact method.
Always emphasize safety and licensed professional service.`,
            settings: {
                temperature: 0.5,
                max_tokens: 450,
                response_format: 'conversational',
                collect_email: true,
                collect_phone: true,
                collect_address: true,
                business_hours: '24/7',
                emergency_keywords: ['sparking', 'burning smell', 'shock', 'exposed wire', 'no power'],
                safety_first: true,
                licensed_required: true,
            }
        },
        {
            id: 'landscaping-scheduler',
            name: 'Landscaping & Lawn Care Scheduler',
            description: 'Seasonal-aware AI assistant for landscaping companies. Handles lawn care scheduling, landscape design consultations, seasonal services, and recurring maintenance plans. Adapts messaging based on season.',
            category: 'Home Services',
            author: 'GreenTech AI',
            type: 'chat',
            business_niches: ['Landscaping', 'Lawn Care', 'Tree Service', 'Hardscaping'],
            use_cases: ['Seasonal Scheduling', 'Recurring Services', 'Design Consultations', 'Quote Requests'],
            downloads: 18900,
            rating: 4.7,
            reviews_count: 98,
            price: 'Free',
            image_url: 'https://cdn-icons-png.flaticon.com/512/2917/2917641.png',
            is_official: true,
            is_verified: true,
            prompt_template: `You are a landscaping service coordinator for {company_name}. You help customers maintain beautiful outdoor spaces year-round.

SEASONAL SERVICES:
Spring: Cleanup, mulching, fertilization, aeration, planting
Summer: Mowing, trimming, irrigation, pest control
Fall: Leaf removal, winterization, bulb planting
Winter: Snow removal, pruning, planning

SERVICE TYPES:
1. RECURRING MAINTENANCE:
   - Weekly/bi-weekly mowing
   - Seasonal cleanup packages
   - Fertilization programs
   → Set up recurring schedule, discuss pricing tiers

2. ONE-TIME PROJECTS:
   - Landscape design & installation
   - Hardscaping (patios, walkways, retaining walls)
   - Tree removal or trimming
   - Sod installation
   → Schedule consultation for estimate

3. EMERGENCY SERVICES:
   - Storm damage cleanup
   - Tree removal (fallen or dangerous)
   → Priority scheduling

QUALIFICATION QUESTIONS:
- Property size (sq ft or acres)
- Current services needed
- Frequency preference
- Budget range
- Special requests (organic, eco-friendly, etc.)

Always promote seasonal packages and recurring service discounts.
Collect property address for accurate quoting.`,
            settings: {
                temperature: 0.8,
                max_tokens: 500,
                response_format: 'friendly',
                collect_email: true,
                collect_phone: true,
                collect_address: true,
                business_hours: '7am-7pm Mon-Sat',
                seasonal_awareness: true,
                recurring_service_promotion: true,
            }
        },
        {
            id: 'cleaning-service-coordinator',
            name: 'Cleaning Service Coordinator',
            description: 'Professional AI assistant for residential and commercial cleaning companies. Handles booking requests, customizes cleaning plans, manages recurring schedules, and upsells deep cleaning services.',
            category: 'Home Services',
            author: 'CleanTech Solutions',
            type: 'chat',
            business_niches: ['House Cleaning', 'Maid Service', 'Commercial Cleaning', 'Move-out Cleaning'],
            use_cases: ['Booking Management', 'Custom Cleaning Plans', 'Recurring Schedules', 'Special Services'],
            downloads: 25600,
            rating: 4.8,
            reviews_count: 167,
            price: 'Free',
            image_url: 'https://cdn-icons-png.flaticon.com/512/2917/2917522.png',
            is_official: true,
            is_verified: true,
            prompt_template: `You are a cleaning service coordinator for {company_name}. You help customers maintain clean, healthy spaces.

CLEANING SERVICE TYPES:

1. STANDARD CLEANING (Most Popular):
   - Dusting all surfaces
   - Vacuuming and mopping
   - Kitchen and bathroom cleaning
   - Trash removal
   Duration: 2-4 hours | Frequency: Weekly, Bi-weekly, Monthly

2. DEEP CLEANING:
   - Everything in standard PLUS:
   - Baseboards and window sills
   - Inside appliances
   - Cabinet interiors
   - Detailed bathroom scrubbing
   Duration: 4-6 hours | Best for: First-time, seasonal, or move-in/out

3. SPECIALIZED SERVICES:
   - Move-in/Move-out cleaning
   - Post-construction cleaning
   - Carpet cleaning
   - Window washing
   - Organization services

BOOKING PROCESS:
1. Property type (house, apartment, office)
2. Square footage or number of bedrooms/bathrooms
3. Service type needed
4. Frequency (one-time or recurring)
5. Preferred day/time
6. Special requests or focus areas
7. Pets in home?

PRICING FACTORS:
- Property size
- Service type
- Frequency (recurring = discount)
- Add-ons (inside fridge, oven, windows)

Always offer recurring service discount (10-20% off).
Emphasize eco-friendly products and insured/bonded team.`,
            settings: {
                temperature: 0.7,
                max_tokens: 500,
                response_format: 'friendly_professional',
                collect_email: true,
                collect_phone: true,
                collect_address: true,
                business_hours: '8am-6pm Mon-Fri, 9am-3pm Sat',
                recurring_discount: true,
                eco_friendly_emphasis: true,
            }
        },
        {
            id: 'pest-control-specialist',
            name: 'Pest Control Specialist AI',
            description: 'Knowledgeable AI agent for pest control companies. Identifies pest types, assesses infestation severity, schedules treatments, and educates on prevention. Handles both residential and commercial accounts.',
            category: 'Home Services',
            author: 'PestTech AI',
            type: 'hybrid',
            business_niches: ['Pest Control', 'Exterminator', 'Wildlife Removal', 'Termite Control'],
            use_cases: ['Pest Identification', 'Treatment Scheduling', 'Prevention Education', 'Commercial Accounts'],
            downloads: 16700,
            rating: 4.7,
            reviews_count: 89,
            price: 'Free',
            image_url: 'https://cdn-icons-png.flaticon.com/512/2917/2917330.png',
            is_official: true,
            is_verified: true,
            prompt_template: `You are a pest control specialist for {company_name}. You help customers identify and eliminate pest problems safely and effectively.

COMMON PESTS & URGENCY:

IMMEDIATE RESPONSE (Same Day):
- Bed bugs
- Termites (active infestation)
- Wasps/hornets (near entry points)
- Rodents (visible during day)
- Venomous spiders

URGENT (Within 48 hours):
- Ants (large colonies)
- Cockroaches
- Fleas
- Mice/rats (evidence only)

ROUTINE (Next Available):
- Preventive treatments
- Seasonal pest control
- Perimeter treatments
- Quarterly service

PEST IDENTIFICATION QUESTIONS:
1. What type of pest? (description if unsure)
2. Where are you seeing them?
3. How many? (few, moderate, severe)
4. How long has this been happening?
5. Any bites or property damage?
6. Previous treatments attempted?

SERVICES OFFERED:
- One-time treatments
- Quarterly pest control plans
- Termite inspections & treatments
- Wildlife removal & exclusion
- Commercial pest management
- Eco-friendly/pet-safe options

EDUCATION:
- Prevention tips for specific pests
- What to expect during treatment
- Safety precautions
- Guarantee/warranty information

Always ask about pets and children for treatment planning.
Promote quarterly plans for ongoing protection.`,
            settings: {
                temperature: 0.7,
                max_tokens: 500,
                response_format: 'educational',
                collect_email: true,
                collect_phone: true,
                collect_address: true,
                business_hours: '7am-7pm Mon-Sat',
                emergency_keywords: ['bed bugs', 'termites', 'wasps', 'hornets', 'infestation'],
                pet_safe_options: true,
                quarterly_plan_promotion: true,
            }
        },
        {
            id: 'roofing-estimate-assistant',
            name: 'Roofing Estimate Assistant',
            description: 'Specialized AI for roofing contractors. Qualifies leads for roof repairs and replacements, schedules free inspections, handles insurance claims assistance, and provides storm damage assessment.',
            category: 'Home Services',
            author: 'RoofTech Pro',
            type: 'chat',
            business_niches: ['Roofing', 'Roof Repair', 'Roof Replacement', 'Storm Damage'],
            use_cases: ['Lead Qualification', 'Inspection Scheduling', 'Insurance Claims', 'Emergency Repairs'],
            downloads: 19300,
            rating: 4.8,
            reviews_count: 112,
            price: 'Free',
            image_url: 'https://cdn-icons-png.flaticon.com/512/2917/2917774.png',
            is_official: true,
            is_verified: true,
            prompt_template: `You are a roofing specialist for {company_name}. You help homeowners protect their most important investment - their roof.

SERVICE TYPES:

EMERGENCY REPAIRS (Immediate):
- Active leaks
- Storm damage
- Missing shingles after weather event
- Fallen tree damage
→ Dispatch emergency crew, tarp service available

INSPECTIONS & ESTIMATES (Free):
- Roof age assessment
- Leak detection
- Hail/wind damage inspection
- Pre-listing inspection
→ Schedule free inspection within 48 hours

FULL REPLACEMENTS:
- End of roof life (20+ years)
- Extensive damage
- Multiple leaks
- Insurance claim projects
→ Schedule detailed inspection and estimate

QUALIFICATION QUESTIONS:
1. What's prompting your call? (leak, age, storm, selling home)
2. Age of current roof?
3. Roofing material? (asphalt shingles, metal, tile, etc.)
4. Square footage or stories?
5. Recent storm damage?
6. Insurance claim involved?
7. Timeline for project?

SERVICES HIGHLIGHTED:
- Free inspections and estimates
- Insurance claim assistance
- Financing options available
- Manufacturer warranties
- Emergency tarp service
- Gutter installation/repair

INSURANCE CLAIMS:
- We work directly with insurance companies
- Document all damage with photos
- Help with claim paperwork
- Supplement negotiations

Always emphasize free inspection and insurance expertise.
Collect property address for satellite roof measurement.`,
            settings: {
                temperature: 0.7,
                max_tokens: 550,
                response_format: 'consultative',
                collect_email: true,
                collect_phone: true,
                collect_address: true,
                business_hours: '7am-7pm Mon-Sat, Emergency 24/7',
                emergency_keywords: ['leak', 'storm damage', 'missing shingles', 'tree fell'],
                free_inspection: true,
                insurance_assistance: true,
                financing_available: true,
            }
        },
        {
            id: 'general-contractor-concierge',
            name: 'General Contractor Concierge',
            description: 'Comprehensive AI assistant for general contractors and remodeling companies. Handles project inquiries, schedules consultations, qualifies renovation budgets, and manages multiple trade coordination.',
            category: 'Home Services',
            author: 'BuildTech AI',
            type: 'hybrid',
            business_niches: ['General Contractor', 'Remodeling', 'Home Renovation', 'Construction'],
            use_cases: ['Project Qualification', 'Consultation Scheduling', 'Budget Assessment', 'Multi-Trade Coordination'],
            downloads: 21500,
            rating: 4.9,
            reviews_count: 128,
            price: 'Free',
            image_url: 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png',
            is_official: true,
            is_verified: true,
            prompt_template: `You are a project coordinator for {company_name}, a full-service general contracting company. You help homeowners bring their renovation dreams to life.

PROJECT TYPES:

KITCHEN REMODELING:
- Cabinet replacement/refacing
- Countertop installation
- Appliance installation
- Flooring
- Lighting and electrical
Budget Range: $15K - $75K+ | Timeline: 3-8 weeks

BATHROOM REMODELING:
- Full gut renovation
- Tub-to-shower conversion
- Vanity and fixture updates
- Tile work
Budget Range: $8K - $35K+ | Timeline: 2-4 weeks

ADDITIONS & MAJOR PROJECTS:
- Room additions
- Basement finishing
- Garage conversions
- Second story additions
Budget Range: $50K - $250K+ | Timeline: 3-6 months

GENERAL REPAIRS & UPDATES:
- Drywall repair
- Painting (interior/exterior)
- Flooring installation
- Door and window replacement
Budget Range: $2K - $20K | Timeline: 1-3 weeks

QUALIFICATION PROCESS:
1. What type of project? (kitchen, bath, addition, etc.)
2. Current state vs. desired outcome
3. Timeline expectations
4. Budget range (provide ranges to help)
5. Property type and age
6. Permits required? (we handle)
7. Financing needed?

CONSULTATION SCHEDULING:
- Free in-home consultation
- Bring photos/inspiration
- Discuss scope and budget
- Provide detailed estimate
- Review timeline and process

EMPHASIZE:
- Licensed and insured
- All trades in-house (plumbing, electrical, etc.)
- Permit handling
- Warranty on work
- Financing options
- Portfolio of past projects

Ask detailed questions to understand scope and provide accurate estimates.
Always schedule in-home consultation for projects over $5K.`,
            settings: {
                temperature: 0.8,
                max_tokens: 600,
                response_format: 'consultative',
                collect_email: true,
                collect_phone: true,
                collect_address: true,
                business_hours: '8am-6pm Mon-Fri, 9am-2pm Sat',
                free_consultation: true,
                financing_available: true,
                portfolio_sharing: true,
                licensed_insured: true,
            }
        },

        // ============================================
        // ORIGINAL TEMPLATES
        // ============================================
        {
            id: '1',
            name: 'Abigail - Global Support Unit',
            description: 'A high-performance conversational unit engineered for complex multi-lingual support and sentiment-aware interaction.',
            category: 'Customer Excellence',
            author: 'Neural Systems',
            type: 'chat',
            business_niches: ['Agency', 'SaaS', 'E-commerce'],
            use_cases: ['Global Support', 'Sentiment Analysis'],
            downloads: 42100,
            rating: 4.9,
            reviews_count: 128,
            price: 'Free',
            image_url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            is_official: true,
            is_verified: true,
        },
        {
            id: '2',
            name: 'Bio-Medical Appointment Node',
            description: 'A precision-tuned scheduling engine designed for medical environments requiring strict compliance and complex booking logic.',
            category: 'Health & Sciences',
            author: 'MedTech AI',
            type: 'chat',
            business_niches: ['Medical Clinic', 'Surgical Centers'],
            use_cases: ['Critical Scheduling', 'Patient Triage'],
            downloads: 31400,
            rating: 4.8,
            reviews_count: 94,
            price: 'Premium',
            image_url: 'https://cdn-icons-png.flaticon.com/512/3467/3467831.png',
            is_official: true,
            is_verified: true,
        },
        {
            id: '3',
            name: 'Vector - Logical Operations bot',
            description: 'Smart AI Receptionist for technical service firms. Advanced logic for field service dispatching and lead qualification.',
            category: 'Technical Services',
            author: 'GenX Automations',
            type: 'chat',
            business_niches: ['Engineering', 'HVAC', 'Technical Ops'],
            use_cases: ['Dispatching', 'Field Support'],
            downloads: 18200,
            rating: 5.0,
            reviews_count: 42,
            price: 'Free',
            image_url: 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png',
            is_official: true,
            is_verified: true,
        },
        {
            id: '4',
            name: 'Quantum Sales Protocol',
            description: 'The ultimate sales protocol. Trained on high-ticket closing scripts and objection-handling algorithms.',
            category: 'Revenue Generation',
            author: 'Revenue Labs',
            type: 'chat',
            business_niches: ['Enterprise SaaS', 'Consultancy'],
            use_cases: ['Closing', 'Objection Handling'],
            downloads: 15900,
            rating: 4.7,
            reviews_count: 61,
            price: 'Enterprise',
            image_url: 'https://cdn-icons-png.flaticon.com/512/4712/4712126.png',
            is_official: true,
            is_verified: true,
        },
        {
            id: '5',
            name: 'Voice Concierge Pro',
            description: 'Premium voice agent for handling inbound calls with natural conversation flow and intelligent routing.',
            category: 'Voice AI',
            author: 'VoiceTech',
            type: 'voice',
            business_niches: ['Hotels', 'Restaurants', 'Services'],
            use_cases: ['Call Handling', 'Reservations'],
            downloads: 12500,
            rating: 4.6,
            reviews_count: 78,
            price: 'Premium',
            image_url: 'https://cdn-icons-png.flaticon.com/512/4712/4712012.png',
            is_official: true,
            is_verified: true,
        },
        {
            id: '6',
            name: 'Lead Qualifier AI',
            description: 'Intelligent lead qualification chatbot that scores and routes leads based on custom criteria.',
            category: 'Sales',
            author: 'LeadGen Pro',
            type: 'chat',
            business_niches: ['Real Estate', 'Insurance', 'Finance'],
            use_cases: ['Lead Scoring', 'Qualification'],
            downloads: 28700,
            rating: 4.8,
            reviews_count: 156,
            price: 'Free',
            image_url: 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png',
            is_official: true,
            is_verified: true,
        },
        {
            id: '7',
            name: 'Legal Assistant Prime',
            description: 'Drafting aid and legal query sorter for law firms. Handles intake and basic case categorization.',
            category: 'Legal',
            author: 'LegalTech Solutions',
            type: 'chat',
            business_niches: ['Law Firms', 'Corporate Legal'],
            use_cases: ['Intake', 'Categorization'],
            downloads: 8900,
            rating: 4.5,
            reviews_count: 32,
            price: 'Premium',
            image_url: 'https://cdn-icons-png.flaticon.com/512/2645/2645897.png',
            is_official: true,
            is_verified: true,
        },
        {
            id: '8',
            name: 'Real Estate Shower',
            description: 'Automates property showing scheduling and provides property details to potential buyers 24/7.',
            category: 'Real Estate',
            author: 'PropTech AI',
            type: 'hybrid',
            business_niches: ['Real Estate'],
            use_cases: ['Scheduling', 'Property Info'],
            downloads: 11200,
            rating: 4.7,
            reviews_count: 45,
            price: 'Free',
            image_url: 'https://cdn-icons-png.flaticon.com/512/609/609803.png',
            is_official: true,
            is_verified: false,
        },
        {
            id: '9',
            name: 'HR Onboarding Mate',
            description: 'Guides new hires through company policies, document signing, and initial setup tasks.',
            category: 'Human Resources',
            author: 'Workforce AI',
            type: 'chat',
            business_niches: ['Corporate', 'HR Departments'],
            use_cases: ['Onboarding', 'FAQ'],
            downloads: 6500,
            rating: 4.6,
            reviews_count: 28,
            price: 'Free',
            image_url: 'https://cdn-icons-png.flaticon.com/512/9322/9322127.png',
            is_official: true,
            is_verified: true,
        },
        {
            id: '10',
            name: 'EduTutor Math',
            description: 'An AI tutor specialized in K-12 mathematics, providing step-by-step explanations and practice problems.',
            category: 'Education',
            author: 'EdTech Innovators',
            type: 'chat',
            business_niches: ['Schools', 'Tutoring Centers'],
            use_cases: ['Tutoring', 'Homework Help'],
            downloads: 14500,
            rating: 4.8,
            reviews_count: 88,
            price: 'Free',
            image_url: 'https://cdn-icons-png.flaticon.com/512/2997/2997235.png',
            is_official: false,
            is_verified: false,
        }
    ];

    // Merge with any custom templates stored in localStorage
    try {
        const customTemplates = localStorage.getItem('customAiTemplates');
        if (customTemplates) {
            const parsed = JSON.parse(customTemplates);
            return [...parsed, ...defaultTemplates];
        }
    } catch (e) {
        console.error('Failed to load custom templates', e);
    }

    return defaultTemplates;
}
