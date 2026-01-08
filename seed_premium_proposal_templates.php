<?php
/**
 * Premium Proposal Templates Seeder & Upgrader
 * Creates high-quality, modern proposal templates and upgrades existing standard ones.
 */

require_once __DIR__ . '/backend/src/Database.php';

try {
    $db = Database::conn();
    $userId = 1; // Default user

    echo "=== Upgrading Proposal Templates Content ===\n\n";

    // defined templates with rich, comprehensive content
    $templates = [
        // --- PREMIUM TEMPLATES ---
        [
            'name' => 'Premium Digital Marketing Strategy',
            'description' => 'Comprehensive digital growth and marketing strategy for scale-ups.',
            'category' => 'marketing',
            'cover_image' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop',
            'styling' => [
                'primary_color' => '#6366f1',
                'secondary_color' => '#4f46e5',
                'font_family' => 'Inter, sans-serif',
                'header_style' => 'minimal'
            ],
            'content' => '
                <div style="font-family: inherit;">
                    <h1 style="font-size: 3.5rem; letter-spacing: -0.05em; margin-bottom: 0.5rem; color: #1f2937;">Digital Growth <span style="color: #6366f1;">Strategy 2024</span></h1>
                    <p style="font-size: 1.5rem; color: #6b7280; margin-bottom: 2rem;">Prepared exclusively for <strong style="color: #111827;">{{client_company}}</strong></p>
                    
                    <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 3rem; border-radius: 1rem; color: white; margin-bottom: 3rem; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);">
                        <h2 style="color: white; margin-top: 0; font-size: 1.8rem; border: none;">Executive Summary</h2>
                        <p style="font-size: 1.1rem; line-height: 1.6; opacity: 0.9;">
                            We are thrilled to present this comprehensive digital growth strategy. Our team has analyzed {{client_company}}\'s current market position and identified key opportunities for rapid expansion. This proposal outlines a 
                            multi-channel approach designed to maximize ROI, elevate brand authority, and drive sustainable customer acquisition.
                        </p>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 3rem;">
                        <div style="background: #f9fafb; padding: 2rem; border-radius: 0.75rem; border: 1px solid #e5e7eb;">
                            <h3 style="margin-top: 0; color: #111827;">Current State</h3>
                            <ul style="list-style-type: none; padding-left: 0; color: #4b5563;">
                                <li style="margin-bottom: 0.5rem; display: flex; align-items: center;"><span style="color: #ef4444; margin-right: 0.5rem;">•</span> Fragmented social presence</li>
                                <li style="margin-bottom: 0.5rem; display: flex; align-items: center;"><span style="color: #ef4444; margin-right: 0.5rem;">•</span> High CPA on paid channels</li>
                                <li style="margin-bottom: 0.5rem; display: flex; align-items: center;"><span style="color: #ef4444; margin-right: 0.5rem;">•</span> Undervalued organic search traffic</li>
                            </ul>
                        </div>
                        <div style="background: #f0fdf4; padding: 2rem; border-radius: 0.75rem; border: 1px solid #bbf7d0;">
                            <h3 style="margin-top: 0; color: #111827;">Target Future State</h3>
                            <ul style="list-style-type: none; padding-left: 0; color: #4b5563;">
                                <li style="margin-bottom: 0.5rem; display: flex; align-items: center;"><span style="color: #22c55e; margin-right: 0.5rem;">✓</span> Cohesive, omni-channel brand voice</li>
                                <li style="margin-bottom: 0.5rem; display: flex; align-items: center;"><span style="color: #22c55e; margin-right: 0.5rem;">✓</span> Optimized conversion funnel (CRO)</li>
                                <li style="margin-bottom: 0.5rem; display: flex; align-items: center;"><span style="color: #22c55e; margin-right: 0.5rem;">✓</span> Market dominance in key keywords</li>
                            </ul>
                        </div>
                    </div>
                </div>
            ',
            'sections' => [
                [
                    'id' => 'goals', 
                    'title' => 'Strategic Goals', 
                    'content' => '
                        <p class="lead">Our primary objective is to position {{client_company}} as the undisputed leader in your sector through aggressive yet sustainable digital tactics.</p>
                        <h3>Key Performance Indicators (KPIs)</h3>
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
                                <thead>
                                    <tr style="background-color: #f3f4f6; text-align: left;">
                                        <th style="padding: 1rem; border-bottom: 2px solid #e5e7eb;">Metric</th>
                                        <th style="padding: 1rem; border-bottom: 2px solid #e5e7eb;">Current</th>
                                        <th style="padding: 1rem; border-bottom: 2px solid #e5e7eb;">Goal (6 Months)</th>
                                        <th style="padding: 1rem; border-bottom: 2px solid #e5e7eb;">Growth</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Monthly Traffic</td>
                                        <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">15,000</td>
                                        <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; color: #6366f1; font-weight: bold;">45,000</td>
                                        <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">+200%</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Conversion Rate</td>
                                        <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">1.2%</td>
                                        <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; color: #6366f1; font-weight: bold;">2.5%</td>
                                        <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">+108%</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Cost Per Lead</td>
                                        <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">$45.00</td>
                                        <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; color: #6366f1; font-weight: bold;">$28.00</td>
                                        <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">-37%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    '
                ],
                [
                    'id' => 'methodology',
                    'title' => 'Our Methodology',
                    'content' => '
                        <p>We utilize a proprietary 4-stage framework to ensure consistent results.</p>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
                            <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #f3f4f6;">
                                <div style="color: #6366f1; font-weight: 900; font-size: 2rem; margin-bottom: 0.5rem;">01</div>
                                <h4 style="margin: 0 0 0.5rem 0;">Audit & Foundation</h4>
                                <p style="font-size: 0.9rem; color: #6b7280; margin: 0;">Technical SEO audit, pixel setup, and CRM integration.</p>
                            </div>
                            <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #f3f4f6;">
                                <div style="color: #6366f1; font-weight: 900; font-size: 2rem; margin-bottom: 0.5rem;">02</div>
                                <h4 style="margin: 0 0 0.5rem 0;">Content Velocity</h4>
                                <p style="font-size: 0.9rem; color: #6b7280; margin: 0;">Ramping up production of high-intent blog, video, and social assets.</p>
                            </div>
                            <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #f3f4f6;">
                                <div style="color: #6366f1; font-weight: 900; font-size: 2rem; margin-bottom: 0.5rem;">03</div>
                                <h4 style="margin: 0 0 0.5rem 0;">Distribution</h4>
                                <p style="font-size: 0.9rem; color: #6b7280; margin: 0;">Paid amplification via Meta, LinkedIn, and Google Ads.</p>
                            </div>
                            <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #f3f4f6;">
                                <div style="color: #6366f1; font-weight: 900; font-size: 2rem; margin-bottom: 0.5rem;">04</div>
                                <h4 style="margin: 0 0 0.5rem 0;">Optimization</h4>
                                <p style="font-size: 0.9rem; color: #6b7280; margin: 0;">Continuous A/B testing of landing pages and ad creatives.</p>
                            </div>
                        </div>
                    '
                ],
                [
                    'id' => 'timeline', 
                    'title' => 'Execution Roadmap', 
                    'content' => '
                        <h3>Phase 1: Launch (Weeks 1-4)</h3>
                        <p>Focus on fixing technical debt and setting up tracking infrastructure. Launch of initial "low hanging fruit" campaigns.</p>
                        <hr style="margin: 2rem 0; border-color: #e5e7eb;">
                        <h3>Phase 2: Scale (Months 2-3)</h3>
                        <p>Aggressive content deployment. Expansion of ad spend based on initial ROAS data.</p>
                        <hr style="margin: 2rem 0; border-color: #e5e7eb;">
                        <h3>Phase 3: Dominate (Months 4+)</h3>
                        <p>Market leader strategy. Introduction of retention and referral loops to maximize LTV.</p>
                    '
                ]
            ]
        ],
        [
            'name' => 'Elite Cloud Infrastructure & Security',
            'description' => 'Modern cloud migration and advanced security architecture proposal.',
            'category' => 'technology',
            'cover_image' => 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2370&auto=format&fit=crop',
            'styling' => [
                'primary_color' => '#0f172a',
                'secondary_color' => '#334155',
                'font_family' => 'JetBrains Mono, monospace',
                'header_style' => 'technical'
            ],
            'content' => '
                <div style="border-left: 8px solid #0f172a; padding-left: 2rem;">
                    <h1 style="font-size: 2.5rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Cloud Infrastructure v2.0</h1>
                    <p style="font-size: 1.2rem; color: #475569; margin-bottom: 2rem;">Security • Scalability • Reliability</p>
                    <p><strong>Prepared for:</strong> {{client_company}}</p>
                    <p><strong>Date:</strong> {{date}}</p>
                </div>
                <div style="margin-top: 3rem; background: #f1f5f9; padding: 2rem; border-radius: 0.5rem; font-family: monospace; color: #334155;">
                    <p>// EXECUTIVE_SUMMARY</p>
                    <p>This proposal outlines the architectural migration of {{client_company}}\'s legacy systems to a fully managed, auto-scaling cloud environment. The primary focus is on Zero-Trust security principles and eliminating single points of failure.</p>
                </div>
            ',
            'sections' => [
                [
                    'id' => 'audit',
                    'title' => 'Current Infrastructure Audit',
                    'content' => '
                        <p>Our initial scan of your environment revealed several critical latency bottlenecks and potential security vulnerabilities.</p>
                        <div style="background: #1e293b; color: #e2e8f0; padding: 1.5rem; border-radius: 0.5rem; margin: 1rem 0; font-family: monospace;">
                            <div>> Detecting latency spikes... <span style="color: #f87171;">DETECTED (Avg: 450ms)</span></div>
                            <div>> Analyzing database redundancy... <span style="color: #f87171;">FAILED (No active failover)</span></div>
                            <div>> Checking strict IAM policies... <span style="color: #fbbf24;">WARNING (Over-permissive roles)</span></div>
                        </div>
                    '
                ],
                [
                    'id' => 'solution',
                    'title' => 'Proposed Architecture',
                    'content' => '
                        <h3>The Modern Stack</h3>
                        <p>We propose a shift to a containerized microservices architecture utilizing Kubernetes for orchestration.</p>
                        <ul>
                            <li><strong>Compute:</strong> AWS EKS / Google GKE for managed Kubernetes.</li>
                            <li><strong>Database:</strong> Managed PostgreSQL with PITR (Point-in-Time Recovery).</li>
                            <li><strong>CDN:</strong> Cloudflare Enterprise for edge caching and DDoS protection.</li>
                        </ul>
                    '
                ],
                [
                    'id' => 'security',
                    'title' => 'Security Protocol (Zero Trust)',
                    'content' => '
                        <p>Security is not an add-on; it is baked into the infrastructure code.</p>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px; font-weight: bold;">Encryption</td>
                                <td style="padding: 10px;">AES-256 at rest, TLS 1.3 in transit.</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px; font-weight: bold;">Identity</td>
                                <td style="padding: 10px;">Multi-Factor Authentication (MFA) enforced on all root & IAM accounts.</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px; font-weight: bold;">Compliance</td>
                                <td style="padding: 10px;">Infrastructure fully compliant with SOC2 Type II standards.</td>
                            </tr>
                        </table>
                    '
                ]
            ]
        ],
        [
            'name' => 'Executive Management Consulting',
            'description' => 'High-level business transformation and organizational efficiency.',
            'category' => 'consulting',
            'cover_image' => 'https://images.unsplash.com/photo-1454165833762-adc5092a57e8?q=80&w=2370&auto=format&fit=crop',
            'styling' => [
                'primary_color' => '#1e293b',
                'secondary_color' => '#64748b',
                'font_family' => 'Merriweather, serif',
                'header_style' => 'classic'
            ],
            'content' => '
                <div style="text-align: center; padding: 4rem 2rem; border-bottom: 1px solid #e2e8f0;">
                    <img src="https://ui-avatars.com/api/?name=X&background=1e293b&color=fff&size=128" alt="Logo" style="width: 64px; height: 64px; border-radius: 50%; margin-bottom: 2rem;" />
                    <h1 style="font-family: Merriweather, serif; font-size: 3rem; color: #1e293b; margin-bottom: 1rem;">Strategic Transformation</h1>
                    <p style="font-size: 1.25rem; font-style: italic; color: #64748b;">A roadmap to organizational excellence for {{client_company}}</p>
                </div>
                <div style="max-width: 800px; margin: 3rem auto; font-size: 1.1rem; line-height: 1.8; color: #334155;">
                    <p>Dear {{client_name}},</p>
                    <p>In today\'s volatile market, adaptability is the ultimate competitive advantage. Based on our preliminary discussions, it is clear that {{client_company}} is poised for significant growth, yet operational friction is hindering true scalability. This proposal focuses on identifying and eliminating those bottlenecks.</p>
                </div>
            ',
            'sections' => [
                [
                    'id' => 'methodology',
                    'title' => 'Our Framework',
                    'content' => '
                        <blockquote style="border-left: 4px solid #1e293b; padding-left: 1.5rem; margin: 2rem 0; font-style: italic; color: #475569; font-size: 1.2rem;">
                            "Strategy is about making choices, trade-offs; it\'s about deliberately choosing to be different." - Michael Porter
                        </blockquote>
                        <p>We employ a 3-pillar approach to transformation:</p>
                        <ol>
                            <li><strong>People:</strong> Aligning talent with value-creation activities.</li>
                            <li><strong>Process:</strong> Streamlining workflows to reduce waste (Lean Methodology).</li>
                            <li><strong>Technology:</strong> Leveraging automation to drive efficiency.</li>
                        </ol>
                    '
                ],
                [
                    'id' => 'scope',
                    'title' => 'Engagement Scope',
                    'content' => '
                        <h3>Phase 1: Discovery (Weeks 1-2)</h3>
                        <p>Stakeholder interviews, data analysis, and process mapping.</p>
                        <h3>Phase 2: Strategy Design (Weeks 3-4)</h3>
                        <p>Development of the Target Operating Model (TOM) and change management plan.</p>
                        <h3>Phase 3: Implementation Support (Month 2 onwards)</h3>
                        <p>Hands-on guidance during the rollout of new initiatives.</p>
                    '
                ]
            ]
        ],
        [
            'name' => 'Professional Interior Design Concept',
            'description' => 'Creative interior design and spatial planning proposal.',
            'category' => 'creative',
            'cover_image' => 'https://images.unsplash.com/photo-1558655146-2b4d248f0e1d?q=80&w=2600&auto=format&fit=crop',
            'styling' => [
                'primary_color' => '#854d0e',
                'secondary_color' => '#a16207',
                'font_family' => 'Playfair Display, serif',
                'header_style' => 'artistic'
            ],
            'content' => '
                <div style="background-color: #fefce8; padding: 60px; text-align: center; border: 1px solid #fde047;">
                    <h1 style="color: #854d0e; font-size: 4rem; margin-bottom: 1rem; font-weight: 400;">Spatial Harmony</h1>
                    <div style="width: 60px; height: 1px; background: #854d0e; margin: 0 auto 2rem auto;"></div>
                    <p style="font-size: 1.1rem; letter-spacing: 0.1em; text-transform: uppercase; color: #a16207;">Luxury Design Proposal for {{client_name}}</p>
                </div>
                <div style="padding: 2rem 0;">
                    <p style="font-size: 1.2rem; text-align: center; max-width: 600px; margin: 0 auto; color: #4b5563;">
                        We believe that a well-designed space is not just seen, but felt. It is an extension of your identity and a sanctuary for your daily life.
                    </p>
                </div>
            ',
            'sections' => [
                [
                    'id' => 'concept',
                    'title' => 'Design Concept: "Organic Modern"',
                    'content' => '
                        <p>For your project, we envision a palette rooted in nature, combining raw materials with refined finishes.</p>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 2rem;">
                            <div style="background: #eab308; height: 120px; border-radius: 8px;"></div>
                            <div style="background: #a16207; height: 120px; border-radius: 8px;"></div>
                            <div style="background: #78350f; height: 120px; border-radius: 8px;"></div>
                        </div>
                        <p style="font-size: 0.9rem; text-align: center; margin-top: 0.5rem; color: #6b7280;">Proposed Color Palette: Sun-bleached Gold, Clay, and Deep Walnut</p>
                    '
                ],
                [
                    'id' => 'deliverables',
                    'title' => 'Project Deliverables',
                    'content' => '
                        <ul>
                            <li><strong>Space Planning:</strong> Detailed 2D floor plans optimizing flow and function.</li>
                            <li><strong>3D Renderings:</strong> Photorealistic visualizations of key areas.</li>
                            <li><strong>FF&E Selection:</strong> Sourcing of furniture, fixtures, and equipment.</li>
                            <li><strong>Installation:</strong> Full white-glove delivery and setup coordination.</li>
                        </ul>
                    '
                ]
            ]
        ],
        [
            'name' => 'Web Design & Development Proposal',
            'description' => 'Complete web design and development project template',
            'category' => 'technology',
            'cover_image' => 'https://images.unsplash.com/photo-1547658719-da2b51169166?q=80&w=2564&auto=format&fit=crop',
            'styling' => [
                'primary_color' => '#2563eb',
                'secondary_color' => '#1e40af',
                'font_family' => 'Inter, sans-serif',
                'header_style' => 'modern'
            ],
            'content' => '
                <h1>Web Experience Design</h1>
                <p>Prepared for: <strong>{{client_name}}</strong></p>
                <div style="margin-top: 2rem; padding: 2rem; background: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe;">
                    <h2 style="color: #1e40af; margin-top: 0;">Project Objective</h2>
                    <p>To design and develop a responsive, high-performance website that accurately reflects the {{client_company}} brand and converts visitors into loyal customers.</p>
                </div>
            ',
            'sections' => [
                [
                    'id' => 'scope',
                    'title' => 'Scope of Work',
                    'content' => '
                        <p>We will deliver a custom-designed WordPress/React website tailored to your needs.</p>
                        <ul>
                            <li><strong>UX/UI Design:</strong> Wireframing and high-fidelity prototyping.</li>
                            <li><strong>Development:</strong> Clean, semantic HTML5/CSS3/JS code.</li>
                            <li><strong>Responsive:</strong> Fully optimized for Mobile, Tablet, and Desktop.</li>
                            <li><strong>CMS Integration:</strong> Easy-to-use admin panel for content updates.</li>
                        </ul>
                    '
                ],
                [
                    'id' => 'process',
                    'title' => 'Our Process',
                    'content' => '
                        <ol>
                            <li><strong>Discovery:</strong> Requirements gathering and persona definitions.</li>
                            <li><strong>Design:</strong> Visual style and layout creation.</li>
                            <li><strong>Development:</strong> Coding and CMS implementation.</li>
                            <li><strong>Testing:</strong> QA for bugs, speed, and device compatibility.</li>
                            <li><strong>Launch:</strong> Go-live and post-launch support.</li>
                        </ol>
                    '
                ]
            ]
        ],
        [
            'name' => 'SEO Services Proposal',
            'description' => 'Search engine optimization services template',
            'category' => 'marketing',
            'cover_image' => 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?q=80&w=2670&auto=format&fit=crop',
            'styling' => [
                'primary_color' => '#059669',
                'secondary_color' => '#047857',
                'font_family' => 'Inter, sans-serif',
                'header_style' => 'bold'
            ],
            'content' => '
                <h1 style="color: #059669;">Dominating Search</h1>
                <p>SEO Strategy for {{client_company}}</p>
                <p>Date: {{date}}</p>
                <hr style="border-top: 4px solid #059669; border-bottom: none; width: 50px; margin: 1.5rem 0;" />
                <p>We help businesses like yours increase visibility, traffic, and revenue through data-driven Search Engine Optimization.</p>
            ',
            'sections' => [
                [
                    'id' => 'strategy',
                    'title' => 'SEO Strategy',
                    'content' => '
                        <p>Our approach is three-fold:</p>
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <div style="flex: 1; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px;">
                                <h4 style="margin-top: 0; color: #059669;">Technical SEO</h4>
                                <p style="font-size: 0.9rem;">Site speed, mobile usability, and crawlability.</p>
                            </div>
                            <div style="flex: 1; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px;">
                                <h4 style="margin-top: 0; color: #059669;">On-Page SEO</h4>
                                <p style="font-size: 0.9rem;">Content optimization, meta tags, and internal linking.</p>
                            </div>
                            <div style="flex: 1; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px;">
                                <h4 style="margin-top: 0; color: #059669;">Off-Page SEO</h4>
                                <p style="font-size: 0.9rem;">High-quality backlink acquisition and authority building.</p>
                            </div>
                        </div>
                    '
                ],
                [
                    'id' => 'deliverables',
                    'title' => 'Monthly Deliverables',
                    'content' => '
                        <ul>
                            <li>Expert keyword research and strategy</li>
                            <li>4x Blog posts (1000+ words) per month</li>
                            <li>Technical health monitoring and fixes</li>
                            <li>Monthly growth reporting dashboard</li>
                        </ul>
                    '
                ]
            ]
        ]
    ];

    foreach ($templates as $t) {
        // Check if exists
        $stmt = $db->prepare('SELECT id FROM proposal_templates WHERE name = ? AND is_default = TRUE');
        $stmt->execute([$t['name']]);
        $existing = $stmt->fetch();

        if ($existing) {
            echo "  - Upgrading: {$t['name']}\n";
            $updateStmt = $db->prepare('UPDATE proposal_templates SET 
                description = ?, 
                category = ?, 
                content = ?, 
                cover_image = ?, 
                styling = ?, 
                sections = ?,
                updated_at = NOW()
                WHERE id = ?');
            $updateStmt->execute([
                $t['description'],
                $t['category'],
                $t['content'],
                $t['cover_image'],
                json_encode($t['styling']),
                json_encode($t['sections']),
                $existing['id']
            ]);
        } else {
            echo "  - Creating: {$t['name']}\n";
            $insertStmt = $db->prepare('INSERT INTO proposal_templates (
                user_id, name, description, category, content, cover_image, 
                styling, sections, is_default, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, "active", NOW(), NOW())');
            $insertStmt->execute([
                $userId,
                $t['name'],
                $t['description'],
                $t['category'],
                $t['content'],
                $t['cover_image'],
                json_encode($t['styling']),
                json_encode($t['sections'])
            ]);
        }
    }

    echo "\n=== Upgrade Complete! ===\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
