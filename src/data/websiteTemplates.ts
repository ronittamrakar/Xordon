import { WebsiteSection, WebsiteSettings } from '@/lib/websitesApi';

export interface WebsiteTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    settings: WebsiteSettings;
    sections: WebsiteSection[];
}

const commonSettings: WebsiteSettings = {
    seoTitle: 'My Website',
    seoDescription: 'Welcome to my professional website',
    backgroundColor: '#ffffff',
    fontFamily: 'Instrument Sans, sans-serif',
    accentColor: '#0f172a',
};

// Helper to generate IDs
const uuid = () => Math.random().toString(36).substring(2, 9);

export const WEBSITE_TEMPLATES: Record<string, WebsiteTemplate> = {
    // 1. Nova SaaS
    '1': {
        id: '1',
        name: 'Nova SaaS',
        description: 'Modern SaaS dashboard and marketing site',
        category: 'saas',
        settings: {
            ...commonSettings,
            seoTitle: 'Nova SaaS - Platform',
            accentColor: '#6366f1', // Indigo
            fontFamily: 'Inter, sans-serif',
        },
        sections: [
            {
                id: uuid(),
                type: 'navbar',
                title: 'Navigation',
                content: {
                    logoText: 'Nova',
                    links: [
                        { label: 'Features', href: '#features' },
                        { label: 'Pricing', href: '#pricing' },
                        { label: 'About', href: '#about' },
                        { label: 'Resources', href: '#resources' },
                        { label: 'Enterprise', href: '#enterprise' },
                    ],
                    ctaText: 'Get Started',
                    ctaLink: '/signup'
                },
                styles: { padding: '1rem 2rem', backgroundColor: '#ffffff', customCSS: 'border-bottom: 1px solid #e2e8f0;' }
            },
            {
                id: uuid(),
                type: 'hero',
                title: 'Hero Section',
                content: {
                    heading: 'Ship your SaaS faster than ever.',
                    subheading: 'Nova provides the comprehensive toolkit you need to build, launch, and scale your software business. From idea to IPO, we\'ve got you covered.',
                    ctaText: 'Start Free Trial',
                    secondaryCtaText: 'View Demo',
                    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2000'
                },
                styles: { padding: '6rem 2rem', textAlign: 'center', backgroundColor: '#f8fafc' } // Light gray bg
            },
            {
                id: uuid(),
                type: 'features',
                title: 'Core Features',
                content: {
                    heading: 'Everything you need to succeed',
                    features: [
                        { title: 'Analytics', description: 'Real-time insights into your data with customizable dashboards and advanced reporting.', icon: 'BarChart3' },
                        { title: 'Automation', description: 'Workflows that run on autopilot, saving you hours every week.', icon: 'Zap' },
                        { title: 'Security', description: 'Enterprise-grade protection with SOC 2 compliance and end-to-end encryption.', icon: 'Shield' },
                        { title: 'Integration', description: 'Connects with your favorite tools like Slack, GitHub, and 100+ others.', icon: 'Link' },
                        { title: 'API', description: 'Powerful REST and GraphQL APIs for seamless integration.', icon: 'Code' },
                        { title: 'Support', description: '24/7 priority support with dedicated account managers.', icon: 'Headphones' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'stats',
                title: 'Our Impact',
                content: {
                    heading: 'Trusted by industry leaders',
                    stats: [
                        { value: '10k+', label: 'Active Users' },
                        { value: '$2M+', label: 'Revenue Processed' },
                        { value: '99.9%', label: 'Uptime' },
                        { value: '50+', label: 'Countries' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#1e293b', color: '#ffffff' } // Dark stats section
            },
            {
                id: uuid(),
                type: 'testimonials',
                title: 'Customer Success Stories',
                content: {
                    heading: 'What our customers say',
                    quotes: [
                        { text: 'Nova helped us scale from 100 to 10,000 users in just 6 months. The analytics alone paid for itself.', author: 'Sarah Johnson', role: 'CTO, TechFlow' },
                        { text: 'The automation features saved our team 20 hours per week. We can now focus on what really matters.', author: 'Mike Chen', role: 'Product Manager, GrowthLabs' },
                        { text: 'Best SaaS platform I\'ve used. The support team goes above and beyond.', author: 'Emily Rodriguez', role: 'Founder, StartupXYZ' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'pricing',
                title: 'Pricing',
                content: {
                    heading: 'Simple, transparent pricing',
                    subheading: 'No hidden fees. No surprises. Cancel anytime.',
                    plans: [
                        { name: 'Starter', price: '$29', period: '/mo', features: ['Top features', '1 User', 'Basic Analytics', 'Email Support'], cta: 'Start Free Trial' },
                        { name: 'Pro', price: '$79', period: '/mo', features: ['All features', '5 Users', 'Advanced Analytics', 'Priority Support', 'API Access'], popular: true, cta: 'Get Started' },
                        { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited', '24/7 Support', 'Dedicated Account Manager', 'Custom Integrations', 'SLA Guarantee'], cta: 'Contact Sales' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'integrations',
                title: 'Integrations',
                content: {
                    heading: 'Works with your favorite tools',
                    subheading: 'Seamlessly connect with the tools you already use.',
                    logos: [
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg',
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/stripe/stripe-plain.svg',
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg',
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg',
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mailchimp/mailchimp-original.svg'
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'cta',
                title: 'Call to Action',
                content: {
                    heading: 'Ready to get started?',
                    subheading: 'Join thousands of developers building with Nova. Start your free trial today.',
                    ctaText: 'Create Account',
                    secondaryCtaText: 'Schedule Demo'
                },
                styles: { padding: '5rem 2rem', textAlign: 'center', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'case-studies',
                title: 'Success Stories',
                content: {
                    heading: 'Real-World Transformations',
                    caseStudies: [
                        { title: 'TechFlow', description: 'Scaled from 100 to 10,000 users in 6 months using our platform.', image: 'https://images.unsplash.com/photo-1559526334-3be1e3100001?auto=format&fit=crop&q=80&w=800' },
                        { title: 'GrowthLabs', description: 'Reduced operational costs by 40% with our automation features.', image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800' },
                        { title: 'StartupXYZ', description: 'Achieved 300% revenue growth through our analytics insights.', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'partners',
                title: 'Technology Partners',
                content: {
                    heading: 'Trusted by Industry Leaders',
                    partners: [
                        { name: 'AWS', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg' },
                        { name: 'Google Cloud', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg' },
                        { name: 'Microsoft Azure', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg' },
                        { name: 'Salesforce', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/salesforce/salesforce-original.svg' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'location',
                title: 'Office Location',
                content: {
                    heading: 'Visit Our HQ',
                    address: 'Level 24, Nova Tower, Tech District, SF',
                    hours: 'Mon-Fri: 9am - 6pm',
                    phone: '+1 (555) 010-2233',
                    email: 'hello@novasaas.com'
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'contact-form',
                title: 'Contact Sales',
                content: {
                    heading: 'Connect with an Expert',
                    subheading: 'Have questions about enterprise scaling? Our team is here to help.'
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'blog-preview',
                title: 'Latest from our blog',
                content: {
                    heading: 'Insights & Updates',
                    posts: [
                        { title: 'How to Scale Your SaaS to 1M Users', date: 'Dec 15, 2024', excerpt: 'Learn the strategies that helped our customers achieve massive growth.' },
                        { title: 'The Future of API-First Development', date: 'Dec 10, 2024', excerpt: 'Explore emerging trends in API development and integration.' },
                        { title: 'Security Best Practices for SaaS Companies', date: 'Dec 5, 2024', excerpt: 'Essential security measures every SaaS company should implement.' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'awards',
                title: 'Recognition',
                content: {
                    heading: 'Industry Recognition',
                    awards: [
                        { title: 'Best SaaS Platform 2024', description: 'Tech Innovation Awards' },
                        { title: 'Top 100 Startups', description: 'Forbes 2024' },
                        { title: 'Fastest Growing Company', description: 'Inc. 5000' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'footer',
                title: 'Footer',
                content: {
                    copyright: '© 2024 Nova SaaS Inc. All rights reserved.',
                    description: 'Building the future of software, one feature at a time.',
                    links: [
                        { label: 'Terms', href: '#' },
                        { label: 'Privacy', href: '#' },
                        { label: 'Security', href: '#' },
                        { label: 'Status', href: '#' },
                        { label: 'Twitter', href: '#' },
                        { label: 'LinkedIn', href: '#' },
                        { label: 'GitHub', href: '#' }
                    ]
                },
                styles: { padding: '3rem 2rem', backgroundColor: '#0f172a', color: '#94a3b8' }
            }
        ]
    },

    // 2. Artisan Coffee
    '2': {
        id: '2',
        name: 'Artisan Coffee',
        description: 'Elegant cafe website',
        category: 'business',
        settings: {
            ...commonSettings,
            seoTitle: 'Artisan Coffee Co.',
            accentColor: '#78350f', // Amber/Brown
            fontFamily: 'Playfair Display, serif',
            backgroundColor: '#fffbeb' // Warm background
        },
        sections: [
            {
                id: uuid(),
                type: 'navbar',
                title: 'Navigation',
                content: {
                    logoText: 'Artisan',
                    links: [
                        { label: 'Menu', href: '#menu' },
                        { label: 'About', href: '#about' },
                        { label: 'Visit', href: '#visit' },
                        { label: 'Events', href: '#events' },
                        { label: 'Merchandise', href: '#merch' },
                    ],
                    ctaText: 'Order Online',
                },
                styles: { padding: '1.5rem 2rem', backgroundColor: '#fffbeb', customCSS: 'border-bottom: none;' }
            },
            {
                id: uuid(),
                type: 'hero',
                title: 'Hero',
                content: {
                    heading: 'Crafted with Passion',
                    subheading: 'Experience the finest single-origin coffee in the heart of the city. Every cup tells a story of dedication and care.',
                    ctaText: 'View Menu',
                    secondaryCtaText: 'Book Event Space',
                    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=2000'
                },
                styles: { padding: '6rem 2rem', textAlign: 'center', minHeight: '80vh', backgroundColor: '#fffbeb', color: '#451a03' }
            },
            {
                id: uuid(),
                type: 'text',
                title: 'Our Story',
                content: {
                    html: '<h2 style="font-size:2.5rem; margin-bottom: 1rem;">From Bean to Cup</h2><p>We source our beans directly from sustainable farms across Colombia, Ethiopia, and Brazil. Each batch is carefully roasted in small quantities to bring out the unique flavors and aromas that make our coffee exceptional. Our baristas are trained in the art of espresso making, ensuring every cup is perfect.</p><p>Since opening our doors in 2018, we\'ve been committed to creating a welcoming space where community and quality coffee come together.</p>'
                },
                styles: { padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'features',
                title: 'Our Commitment',
                content: {
                    heading: 'Quality & Sustainability',
                    features: [
                        { title: 'Direct Trade', description: 'We work directly with farmers to ensure fair wages and sustainable practices.', icon: 'Leaf' },
                        { title: 'Small Batch Roasting', description: 'Every batch is roasted to perfection, highlighting the unique characteristics of each origin.', icon: 'Coffee' },
                        { title: 'Local Sourcing', description: 'Our pastries and ingredients come from local bakeries and farms.', icon: 'MapPin' },
                        { title: 'Zero Waste', description: 'We compost coffee grounds and use biodegradable packaging.', icon: 'Recycle' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#fffbeb' }
            },
            {
                id: uuid(),
                type: 'gallery',
                title: 'Our Space',
                content: {
                    title: 'A Place to Unwind',
                    images: [
                        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800', // Espresso
                        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800', // Cafe
                        'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=800',  // Latte art
                        'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800', // Interior
                        'https://images.unsplash.com/photo-1525259537265-52f11b3028d0?auto=format&fit=crop&q=80&w=800', // Outdoor seating
                        'https://images.unsplash.com/photo-1556905055-8f33773c61a4?auto=format&fit=crop&q=80&w=800'   // Events space
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'menu',
                title: 'Menu Highlights',
                content: {
                    heading: 'Our Favorites',
                    features: [
                        { title: 'Signature Latte', description: 'Silky smooth steamed milk with our house espresso blend. Available in vanilla, caramel, or hazelnut.', icon: 'Coffee' },
                        { title: 'Cold Brew', description: 'Steeped for 20 hours for a smooth, naturally sweet flavor. Served over ice with your choice of milk.', icon: 'Thermometer' },
                        { title: 'Pour Over', description: 'Single-origin coffee brewed to order. Today\'s featured origin: Colombian Huila.', icon: 'Coffee' },
                        { title: 'Avocado Toast', description: 'Sourdough with smashed avocado, cherry tomatoes, feta, and a drizzle of olive oil.', icon: 'Utensils' },
                        { title: 'Croissant', description: 'Buttery, flaky French croissant. Available plain or with almond filling.', icon: 'Bread' },
                        { title: 'Seasonal Smoothie', description: 'Fresh fruits blended with yogurt. Today\'s special: Mango-Pineapple.', icon: 'Blend' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#fffbeb' }
            },
            {
                id: uuid(),
                type: 'testimonials',
                title: 'What Our Customers Say',
                content: {
                    heading: 'Community Love',
                    quotes: [
                        { text: 'The best coffee in town! The atmosphere is perfect for working or catching up with friends.', author: 'Jessica M.', role: 'Regular Customer' },
                        { text: 'I love that they support local farmers. You can taste the quality and care in every cup.', author: 'David L.', role: 'Coffee Enthusiast' },
                        { text: 'My go-to spot for weekend brunch. The avocado toast is to die for!', author: 'Sarah K.', role: 'Food Blogger' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'events',
                title: 'Upcoming Events',
                content: {
                    heading: 'Join Our Community',
                    events: [
                        { title: 'Latte Art Workshop', date: 'Every Saturday at 2 PM', description: 'Learn the art of latte pouring with our expert baristas.' },
                        { title: 'Open Mic Night', date: 'First Friday of every month', description: 'Showcase your talents or enjoy performances from local artists.' },
                        { title: 'Coffee Tasting', date: 'Monthly on Sundays', description: 'Sample different origins and brewing methods.' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#fffbeb' }
            },
            {
                id: uuid(),
                type: 'brewing-guide',
                title: 'Brewing Guide',
                content: {
                    heading: 'Perfect Your Brew at Home',
                    guide: [
                        { step: 'Choose Quality Beans', description: 'Start with fresh, high-quality coffee beans for the best flavor.' },
                        { step: 'Grind Fresh', description: 'Grind your beans just before brewing to preserve aroma and flavor.' },
                        { step: 'Water Temperature', description: 'Use water between 195-205°F for optimal extraction.' },
                        { step: 'Brew Time', description: 'Follow recommended brew times for your chosen method.' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'location',
                title: 'Visit Us',
                content: {
                    heading: 'Find Us',
                    address: '123 Coffee Lane, Brew City, CA 90210',
                    hours: 'Mon-Sun: 7am - 7pm',
                    phone: '(555) 123-4567',
                    email: 'hello@artisancoffee.com'
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#78350f', color: '#fffbeb' }
            },
            {
                id: uuid(),
                type: 'stats',
                title: 'By the Numbers',
                content: {
                    stats: [
                        { value: '15k+', label: 'Cups Served' },
                        { value: '8+', label: 'Coffee Origins' },
                        { value: '12', label: 'Awards Won' },
                        { value: '100%', label: 'Sustainable' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#78350f', color: '#fffbeb' }
            },
            {
                id: uuid(),
                type: 'team',
                title: 'Professional Baristas',
                content: {
                    heading: 'The Minds Behind the Brew',
                    team: [
                        { name: 'Marco Rossi', role: 'Head Roaster', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Lena Smith', role: 'Lead Barista', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'newsletter',
                title: 'Stay Connected',
                content: {
                    heading: 'Join Our Newsletter',
                    subheading: 'Get updates on new blends, events, and special offers.',
                    buttonText: 'Subscribe'
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'merchandise',
                title: 'Our Merchandise',
                content: {
                    heading: 'Take the Experience Home',
                    products: [
                        { name: 'Artisan Coffee Beans', description: 'Our signature blend, roasted in-house.', price: '$15' },
                        { name: 'Coffee Mugs', description: 'Handcrafted ceramic mugs from local artisans.', price: '$25' },
                        { name: 'Brewing Kits', description: 'Everything you need for perfect coffee at home.', price: '$45' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#fffbeb' }
            },
            {
                id: uuid(),
                type: 'footer',
                title: 'Footer',
                content: {
                    copyright: '© 2024 Artisan Coffee Co. All rights reserved.',
                    description: 'Brewing community, one cup at a time.',
                    links: [
                        { label: 'Instagram', href: '#' },
                        { label: 'Facebook', href: '#' },
                        { label: 'Twitter', href: '#' },
                        { label: 'Careers', href: '#' }
                    ]
                },
                styles: { padding: '2rem 2rem', backgroundColor: '#451a03', color: '#d6d3d1' }
            }
        ]
    },

    // 3. Vogue Store (Ecommerce)
    '3': {
        id: '3',
        name: 'Vogue Store',
        description: 'Fashion ecommerce template',
        category: 'ecommerce',
        settings: {
            ...commonSettings,
            seoTitle: 'Vogue Fashion',
            accentColor: '#171717',
            fontFamily: 'Inter, sans-serif'
        },
        sections: [
            {
                id: uuid(),
                type: 'navbar',
                title: 'Navbar',
                content: {
                    logoText: 'VOGUE',
                    links: [
                        { label: 'Women', href: '#women' },
                        { label: 'Men', href: '#men' },
                        { label: 'Accessories', href: '#accessories' },
                        { label: 'Sale', href: '#sale' },
                        { label: 'Lookbook', href: '#lookbook' }
                    ],
                    ctaText: 'Cart (0)',
                    search: true
                },
                styles: { padding: '1rem 2rem', customCSS: 'border-bottom: 1px solid #eee;' }
            },
            {
                id: uuid(),
                type: 'hero',
                title: 'Hero',
                content: {
                    heading: 'Summer Collection 2024',
                    subheading: 'Discover the new minimalist trends that will define your wardrobe this season. Sustainable fashion meets timeless style.',
                    ctaText: 'Shop Now',
                    secondaryCtaText: 'View Lookbook',
                    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=2000'
                },
                styles: { padding: '6rem 2rem', textAlign: 'left', backgroundColor: '#f3f4f6' }
            },
            {
                id: uuid(),
                type: 'features',
                title: 'Why Choose Vogue',
                content: {
                    heading: 'Ethical Fashion',
                    features: [
                        { title: 'Sustainable Materials', description: 'Organic cotton, recycled polyester, and eco-friendly fabrics.', icon: 'Leaf' },
                        { title: 'Fair Trade', description: 'Ethically sourced and produced with fair wages for all workers.', icon: 'Shield' },
                        { title: 'Timeless Design', description: 'Classic pieces designed to last beyond seasonal trends.', icon: 'Heart' },
                        { title: 'Carbon Neutral', description: 'We offset our carbon footprint with every purchase.', icon: 'Globe' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'product-grid',
                title: 'Featured Products',
                content: {
                    heading: 'New Arrivals',
                    subheading: 'Handpicked pieces that combine comfort, style, and sustainability.',
                    products: [
                        { name: 'Classic Organic Tee', price: '$35', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800', badge: 'Bestseller' },
                        { name: 'Denim Jacket', price: '$89', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800', badge: 'Eco-Friendly' },
                        { name: 'Leather Bag', price: '$120', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800', badge: 'Vegan' },
                        { name: 'Linen Dress', price: '$75', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800', badge: 'Summer' },
                        { name: 'Recycled Sneakers', price: '$95', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800', badge: 'New' },
                        { name: 'Silk Blouse', price: '$65', image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&q=80&w=800', badge: 'Luxury' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#f9fafb' }
            },
            {
                id: uuid(),
                type: 'testimonials',
                title: 'Customer Love',
                content: {
                    heading: 'What Our Customers Say',
                    quotes: [
                        { text: 'The quality is exceptional and the fit is perfect. I\'ve received so many compliments!', author: 'Emma R.', role: 'Fashion Blogger' },
                        { text: 'Love that I can look good while supporting sustainable fashion. The organic tee is my new favorite.', author: 'James L.', role: 'Customer' },
                        { text: 'Vogue has completely changed how I think about fashion. Beautiful pieces with a purpose.', author: 'Sophia M.', role: 'Loyal Customer' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'gallery',
                title: 'Social',
                content: {
                    title: '#VogueStyle on Instagram',
                    images: [
                        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=400',
                        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400',
                        'https://images.unsplash.com/photo-1529139574466-a302d2d3f524?auto=format&fit=crop&q=80&w=400',
                        'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=400'
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'section',
                title: 'Promo',
                content: {
                    heading: '20% Off Everything',
                    subheading: 'Use code SPRING20 at checkout. Valid until April 30th.',
                    ctaText: 'Get Discount',
                    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=1200'
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#000000', color: '#ffffff', textAlign: 'center' }
            },
            {
                id: uuid(),
                type: 'lookbook',
                title: 'Style Inspiration',
                content: {
                    heading: 'Summer Lookbook',
                    subheading: 'Discover how to style our pieces for every occasion this summer.',
                    images: [
                        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1529375490526-48edf790850d?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1513056121813-c01d3cd61c9c?auto=format&fit=crop&q=80&w=800'
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#f3f4f6' }
            },
            {
                id: uuid(),
                type: 'sustainability',
                title: 'Our Sustainability Journey',
                content: {
                    heading: 'Commitment to the Planet',
                    initiatives: [
                        { title: 'Eco-Friendly Materials', description: 'Using organic cotton, recycled polyester, and sustainable fabrics.' },
                        { title: 'Ethical Production', description: 'Fair wages and safe working conditions for all workers.' },
                        { title: 'Carbon Neutral', description: 'Offsetting our carbon footprint through verified programs.' },
                        { title: 'Circular Fashion', description: 'Take-back program for end-of-life garments.' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'newsletter',
                title: 'Newsletter',
                content: {
                    heading: 'Join our mailing list',
                    subheading: 'Get early access to new collections, exclusive offers, and styling tips.',
                    buttonText: 'Subscribe'
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#f9fafb' }
            },
            {
                id: uuid(),
                type: 'shipping-info',
                title: 'Shipping & Returns',
                content: {
                    heading: 'Free Shipping & Easy Returns',
                    info: [
                        { title: 'Free Shipping', description: 'On orders over $100 within the US.' },
                        { title: '30-Day Returns', description: 'Hassle-free returns on all items.' },
                        { title: 'Size Guide', description: 'Find your perfect fit with our detailed guide.' },
                        { title: 'Customer Care', description: 'We\'re here to help with any questions.' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'fit-guide',
                title: 'Find Your Perfect Fit',
                content: {
                    heading: 'Size & Fit Guide',
                    sizes: [
                        { size: 'XS', bust: '31-33"', waist: '24-26"', hips: '33-35"' },
                        { size: 'S', bust: '33-35"', waist: '26-28"', hips: '35-37"' },
                        { size: 'M', bust: '35-37"', waist: '28-30"', hips: '37-39"' },
                        { size: 'L', bust: '37-39"', waist: '30-32"', hips: '39-41"' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#f9fafb' }
            },
            {
                id: uuid(),
                type: 'footer',
                title: 'Footer',
                content: {
                    copyright: '© 2024 Vogue Fashion. All rights reserved.',
                    description: 'Sustainable fashion for the conscious consumer.',
                    links: [
                        { label: 'Size Guide', href: '#' },
                        { label: 'Shipping', href: '#' },
                        { label: 'Returns', href: '#' },
                        { label: 'Contact', href: '#' },
                        { label: 'Instagram', href: '#' },
                        { label: 'Facebook', href: '#' },
                        { label: 'Pinterest', href: '#' }
                    ]
                },
                styles: { padding: '3rem 2rem', backgroundColor: '#111827', color: '#ffffff' }
            }
        ]
    },

    // 4. Vitality Gym
    '4': {
        id: '4',
        name: 'Vitality Gym',
        description: 'Fitness center website',
        category: 'business',
        settings: {
            ...commonSettings,
            seoTitle: 'Vitality Gym',
            accentColor: '#10b981',
            fontFamily: 'Roboto, sans-serif'
        },
        sections: [
            {
                id: uuid(),
                type: 'navbar',
                title: 'Navigation',
                content: {
                    logoText: 'Vitality',
                    links: [
                        { label: 'Classes', href: '#classes' },
                        { label: 'Trainers', href: '#trainers' },
                        { label: 'Schedule', href: '#schedule' },
                        { label: 'Facilities', href: '#facilities' },
                        { label: 'Pricing', href: '#pricing' }
                    ],
                    ctaText: 'Free Trial'
                },
                styles: { padding: '1rem 2rem', backgroundColor: '#ffffff', customCSS: 'border-bottom: 1px solid #e5e7eb;' }
            },
            {
                id: uuid(),
                type: 'hero',
                title: 'Hero',
                content: {
                    heading: 'Unleash Your Potential',
                    subheading: 'Transform your body and mind at the city\'s premier fitness destination. State-of-the-art facilities, expert trainers, and a supportive community await you.',
                    ctaText: 'Join Now',
                    secondaryCtaText: 'View Schedule',
                    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=2000'
                },
                styles: { padding: '8rem 2rem', backgroundColor: '#111827', color: '#fff' }
            },
            {
                id: uuid(),
                type: 'features',
                title: 'Our Classes',
                content: {
                    heading: 'Find Your Flow',
                    features: [
                        { title: 'Crossfit', description: 'High-intensity functional training to build strength and endurance.', icon: 'Activity' },
                        { title: 'Yoga', description: 'Improve flexibility, balance, and mindfulness with our certified instructors.', icon: 'Smile' },
                        { title: 'Cardio', description: 'Burn calories and boost your heart health with our variety of cardio classes.', icon: 'Heart' },
                        { title: 'Strength Training', description: 'Build muscle and increase metabolism with personalized strength programs.', icon: 'Dumbbell' },
                        { title: 'HIIT', description: 'Maximize results in minimal time with our high-intensity interval training.', icon: 'Zap' },
                        { title: 'Pilates', description: 'Core-focused workouts that improve posture and overall body awareness.', icon: 'Target' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'team',
                title: 'Our Trainers',
                content: {
                    heading: 'Meet the Pros',
                    team: [
                        { name: 'Mike Ross', role: 'Head Coach', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Sarah Lee', role: 'Yoga Instructor', image: 'https://images.unsplash.com/photo-1544367563-121910aa662f?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Chris Evans', role: 'Strength Coach', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f9fafb' }
            },
            {
                id: uuid(),
                type: 'stats',
                title: 'Our Impact',
                content: {
                    stats: [
                        { value: '500+', label: 'Active Members' },
                        { value: '15+', label: 'Classes Daily' },
                        { value: '95%', label: 'Success Rate' },
                        { value: '10+', label: 'Certified Trainers' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#10b981', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'testimonials',
                title: 'Member Success Stories',
                content: {
                    heading: 'Real Results',
                    quotes: [
                        { text: 'I lost 30 pounds and gained so much confidence. The trainers here are amazing!', author: 'Jessica T.', role: 'Member for 1 Year' },
                        { text: 'The community here is incredible. I look forward to coming to the gym every day.', author: 'Mark R.', role: 'Member for 6 Months' },
                        { text: 'I\'ve never felt stronger or healthier. Vitality Gym changed my life.', author: 'Sarah L.', role: 'Member for 2 Years' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f9fafb' }
            },
            {
                id: uuid(),
                type: 'pricing',
                title: 'Membership Plans',
                content: {
                    heading: 'Flexible Options',
                    subheading: 'Choose the plan that fits your fitness goals and lifestyle.',
                    plans: [
                        { name: 'Basic', price: '$49', period: '/mo', features: ['Access to gym', 'Group classes', 'Locker room'], popular: false },
                        { name: 'Premium', price: '$79', period: '/mo', features: ['All Basic features', 'Personal training (1 session)', 'Nutrition consultation'], popular: true },
                        { name: 'Elite', price: '$119', period: '/mo', features: ['All Premium features', 'Unlimited personal training', 'Priority booking', 'Wellness programs'], popular: false }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'schedule',
                title: 'Class Schedule',
                content: {
                    heading: 'Daily Schedule',
                    schedule: [
                        { time: '6:00 AM', class: 'Morning Yoga', instructor: 'Sarah' },
                        { time: '7:00 AM', class: 'Crossfit', instructor: 'Mike' },
                        { time: '9:00 AM', class: 'Pilates', instructor: 'Emily' },
                        { time: '5:00 PM', class: 'HIIT', instructor: 'Chris' },
                        { time: '6:30 PM', class: 'Strength Training', instructor: 'Alex' },
                        { time: '8:00 PM', class: 'Evening Yoga', instructor: 'Sarah' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#f3f4f6' }
            },
            {
                id: uuid(),
                type: 'facilities',
                title: 'Our Facilities',
                content: {
                    heading: 'Premium Amenities',
                    features: [
                        { title: 'Cardio Zone', description: 'Latest equipment including treadmills, ellipticals, and bikes.' },
                        { title: 'Strength Area', description: 'Free weights, machines, and functional training space.' },
                        { title: 'Group Studio', description: 'Dedicated space for yoga, pilates, and group classes.' },
                        { title: 'Locker Rooms', description: 'Spacious facilities with showers and secure lockers.' },
                        { title: 'Nutrition Bar', description: 'Healthy smoothies and snacks to fuel your workouts.' },
                        { title: 'Personal Training', description: 'Private sessions with our certified trainers.' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'nutrition',
                title: 'Nutrition Services',
                content: {
                    heading: 'Fuel Your Body Right',
                    services: [
                        { title: 'Personalized Meal Plans', description: 'Custom nutrition plans tailored to your fitness goals.' },
                        { title: 'Nutrition Coaching', description: 'One-on-one sessions with our certified nutritionists.' },
                        { title: 'Supplement Guidance', description: 'Expert advice on safe and effective supplements.' },
                        { title: 'Cooking Classes', description: 'Learn to prepare healthy, delicious meals.' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#f9fafb' }
            },
            {
                id: uuid(),
                type: 'community',
                title: 'Our Community',
                content: {
                    heading: 'More Than Just a Gym',
                    community: [
                        { title: 'Fitness Challenges', description: 'Monthly challenges to keep you motivated and engaged.' },
                        { title: 'Social Events', description: 'Member mixers, workshops, and special events.' },
                        { title: 'Accountability Partners', description: 'Find workout buddies and support each other\'s goals.' },
                        { title: 'Progress Tracking', description: 'Regular assessments and milestone celebrations.' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'cta',
                title: 'Join Today',
                content: {
                    heading: 'Ready to Transform?',
                    subheading: 'Start your fitness journey with a free 7-day trial pass.',
                    buttonText: 'Get Free Trial'
                },
                styles: { padding: '5rem 2rem', textAlign: 'center', backgroundColor: '#10b981', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'footer',
                title: 'Footer',
                content: {
                    copyright: '© 2024 Vitality Gym. All rights reserved.',
                    description: 'Your journey to a healthier, stronger you starts here.',
                    links: [
                        { label: 'Careers', href: '#' },
                        { label: 'Blog', href: '#' },
                        { label: 'Privacy Policy', href: '#' },
                        { label: 'Instagram', href: '#' },
                        { label: 'Facebook', href: '#' },
                        { label: 'YouTube', href: '#' }
                    ]
                },
                styles: { padding: '3rem 2rem', backgroundColor: '#000000', color: '#ffffff' }
            }
        ]
    },

    // 5. Tech Blog
    '5': {
        id: '5',
        name: 'Tech Blog',
        description: 'Clean tech blog',
        category: 'blog',
        settings: {
            ...commonSettings,
            seoTitle: 'Tech Insights',
            fontFamily: 'Merriweather, serif'
        },
        sections: [
            {
                id: uuid(),
                type: 'navbar',
                title: 'Navigation',
                content: {
                    logoText: 'TechInsights',
                    links: [
                        { label: 'Articles', href: '#articles' },
                        { label: 'Categories', href: '#categories' },
                        { label: 'About', href: '#about' },
                        { label: 'Newsletter', href: '#newsletter' }
                    ],
                    ctaText: 'Subscribe'
                },
                styles: { padding: '1rem 2rem', backgroundColor: '#ffffff', customCSS: 'border-bottom: 1px solid #e5e7eb;' }
            },
            {
                id: uuid(),
                type: 'hero',
                title: 'Hero',
                content: {
                    heading: 'Decoding the Future',
                    subheading: 'Deep dives into AI, Web3, and Software Engineering. Stay ahead of the curve with our expert analysis and tutorials.',
                    ctaText: 'Read Latest',
                    secondaryCtaText: 'Browse Categories',
                    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=2000'
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#eff6ff', textAlign: 'center' }
            },
            {
                id: uuid(),
                type: 'features',
                title: 'What We Cover',
                content: {
                    heading: 'Technology Topics',
                    features: [
                        { title: 'Artificial Intelligence', description: 'Latest developments in machine learning, deep learning, and AI applications.', icon: 'Brain' },
                        { title: 'Web Development', description: 'Modern frameworks, best practices, and cutting-edge techniques.', icon: 'Code' },
                        { title: 'Blockchain & Web3', description: 'Decentralized technologies, cryptocurrencies, and the future of the web.', icon: 'Globe' },
                        { title: 'Cloud Computing', description: 'AWS, Azure, GCP, and cloud-native development strategies.', icon: 'Cloud' },
                        { title: 'Cybersecurity', description: 'Security best practices, threat analysis, and protection strategies.', icon: 'Shield' },
                        { title: 'DevOps', description: 'CI/CD, infrastructure as code, and modern deployment practices.', icon: 'Settings' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'blog-list',
                title: 'Recent Posts',
                content: {
                    heading: 'Latest Articles',
                    posts: [
                        { title: 'The Rise of AI Agents', date: 'Dec 15, 2024', excerpt: 'How autonomous AI agents are transforming industries and what it means for the future of work.', category: 'AI', readTime: '8 min read' },
                        { title: 'React Server Components: The Future is Here', date: 'Dec 10, 2024', excerpt: 'A comprehensive guide to React Server Components and how they\'re changing web development.', category: 'Web Dev', readTime: '12 min read' },
                        { title: 'Understanding Zero-Knowledge Proofs', date: 'Dec 5, 2024', excerpt: 'Deep dive into the cryptography that\'s powering the next generation of privacy.', category: 'Blockchain', readTime: '10 min read' },
                        { title: 'Kubernetes Best Practices 2024', date: 'Nov 28, 2024', excerpt: 'Essential practices for deploying and managing containerized applications at scale.', category: 'DevOps', readTime: '15 min read' },
                        { title: 'The State of Cybersecurity in 2024', date: 'Nov 20, 2024', excerpt: 'Analysis of current threats and how to protect your digital assets.', category: 'Security', readTime: '6 min read' },
                        { title: 'Building Scalable APIs with GraphQL', date: 'Nov 15, 2024', excerpt: 'Learn how to design and implement efficient GraphQL APIs for modern applications.', category: 'Web Dev', readTime: '9 min read' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'categories',
                title: 'Popular Categories',
                content: {
                    heading: 'Explore by Topic',
                    categories: [
                        { name: 'Artificial Intelligence', count: '24 posts', color: '#3b82f6' },
                        { name: 'Web Development', count: '32 posts', color: '#10b981' },
                        { name: 'Blockchain', count: '18 posts', color: '#f59e0b' },
                        { name: 'Cloud Computing', count: '28 posts', color: '#8b5cf6' },
                        { name: 'Cybersecurity', count: '15 posts', color: '#ef4444' },
                        { name: 'DevOps', count: '22 posts', color: '#06b6d4' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'newsletter',
                title: 'Newsletter',
                content: {
                    heading: 'Stay Updated',
                    subheading: 'Get the latest tech insights delivered to your inbox every week. Join thousands of developers and tech enthusiasts.',
                    buttonText: 'Subscribe Now'
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#f1f5f9' }
            },
            {
                id: uuid(),
                type: 'author',
                title: 'About the Author',
                content: {
                    heading: 'Meet Our Team',
                    author: {
                        name: 'Alex Chen',
                        role: 'Senior Software Engineer & Tech Writer',
                        bio: 'With over 10 years of experience in software development and a passion for emerging technologies, Alex brings complex technical concepts to life through clear, engaging writing.',
                        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400'
                    }
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'cta',
                title: 'Join Our Community',
                content: {
                    heading: 'Love Tech? Join Us!',
                    subheading: 'Subscribe to our newsletter and never miss an update. Be part of the conversation shaping tomorrow\'s technology.',
                    buttonText: 'Subscribe Today'
                },
                styles: { padding: '5rem 2rem', textAlign: 'center', backgroundColor: '#1e293b', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'testimonials',
                title: 'Reader Feedback',
                content: {
                    heading: 'What Our Readers Say',
                    quotes: [
                        { text: 'The best resource for staying updated on AI and Web Dev.', author: 'Jordan M.', role: 'Senior Engineer' },
                        { text: 'Clear, concise, and always relevant. My go-to daily read.', author: 'Li W.', role: 'Tech Enthusiast' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'stats',
                title: 'Platform Stats',
                content: {
                    stats: [
                        { value: '50k+', label: 'Monthly Readers' },
                        { value: '200+', label: 'Articles' },
                        { value: '15k+', label: 'Subscribers' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#eff6ff', color: '#1e3a8a' }
            },
            {
                id: uuid(),
                type: 'resources',
                title: 'Developer Resources',
                content: {
                    heading: 'Tools & Resources',
                    resources: [
                        { title: 'Code Examples', description: 'Downloadable code snippets and templates for common implementations.' },
                        { title: 'Cheat Sheets', description: 'Quick reference guides for popular frameworks and technologies.' },
                        { title: 'Tool Recommendations', description: 'Our favorite development tools and software.' },
                        { title: 'Learning Paths', description: 'Curated learning paths for different technology stacks.' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'podcast',
                title: 'Tech Podcast',
                content: {
                    heading: 'Listen to Our Podcast',
                    subheading: 'Join us weekly as we discuss the latest trends, interview industry experts, and dive deep into emerging technologies.',
                    episodes: [
                        { title: 'The Future of AI Development', date: 'Dec 10, 2024', duration: '45 min' },
                        { title: 'Web3: Hype or Reality?', date: 'Dec 3, 2024', duration: '38 min' },
                        { title: 'DevOps Best Practices 2024', date: 'Nov 26, 2024', duration: '52 min' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'footer',
                title: 'Footer',
                content: {
                    copyright: '© 2024 TechInsights. All rights reserved.',
                    description: 'Bringing you the latest in technology and innovation.',
                    links: [
                        { label: 'Privacy Policy', href: '#' },
                        { label: 'Terms of Service', href: '#' },
                        { label: 'Contact', href: '#' },
                        { label: 'RSS Feed', href: '#' },
                        { label: 'Twitter', href: '#' },
                        { label: 'LinkedIn', href: '#' },
                        { label: 'GitHub', href: '#' }
                    ]
                },
                styles: { padding: '3rem 2rem', backgroundColor: '#0f172a', color: '#94a3b8' }
            }
        ]
    },

    // 6. Launchpad (Landing)
    '6': {
        id: '6',
        name: 'Launchpad',
        description: 'Landing page for mobile apps',
        category: 'landing-page',
        settings: {
            ...commonSettings,
            seoTitle: 'App Launch',
            accentColor: '#8b5cf6'
        },
        sections: [
            {
                id: uuid(),
                type: 'navbar',
                content: {
                    logoText: 'Launchpad',
                    links: [
                        { label: 'Features', href: '#features' },
                        { label: 'Testimonials', href: '#testimonials' },
                        { label: 'Pricing', href: '#pricing' },
                        { label: 'FAQ', href: '#faq' }
                    ],
                    ctaText: 'Download'
                },
                styles: { padding: '1rem 2rem', backgroundColor: '#ffffff', customCSS: 'border-bottom: 1px solid #e5e7eb;' }
            },
            {
                id: uuid(),
                type: 'hero',
                content: {
                    heading: 'The App You\'ve Been Waiting For',
                    subheading: 'Revolutionize your daily routine with our cutting-edge mobile application. Designed for productivity, powered by innovation.',
                    ctaText: 'Get on App Store',
                    secondaryCtaText: 'Download on Google Play',
                    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=2000'
                },
                styles: { padding: '8rem 2rem', textAlign: 'center', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'features',
                content: {
                    heading: 'Powerful Features',
                    features: [
                        { title: 'Lightning Fast', description: 'Optimized for speed and performance across all devices.', icon: 'Zap' },
                        { title: 'Bank-Level Security', description: 'Your data is protected with enterprise-grade encryption.', icon: 'Lock' },
                        { title: 'Stunning Design', description: 'Beautiful, intuitive interface that delights users.', icon: 'Eye' },
                        { title: 'Smart AI', description: 'Intelligent features that learn and adapt to your needs.', icon: 'Brain' },
                        { title: 'Offline Capable', description: 'Work seamlessly even without an internet connection.', icon: 'CloudOff' },
                        { title: 'Cross-Platform', description: 'Sync your data across all your devices instantly.', icon: 'Smartphone' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f5f3ff' }
            },
            {
                id: uuid(),
                type: 'stats',
                content: {
                    stats: [
                        { value: '1M+', label: 'Downloads' },
                        { value: '4.8★', label: 'App Store Rating' },
                        { value: '50+', label: 'Countries' },
                        { value: '24/7', label: 'Support' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#8b5cf6', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'testimonials',
                content: {
                    heading: 'What Users Say',
                    quotes: [
                        { text: 'This app completely transformed how I manage my daily tasks. I\'m more productive than ever!', author: 'Sarah J.', role: 'Product Manager' },
                        { text: 'The interface is so intuitive, I felt like I\'d been using it for years on my first day.', author: 'Mike R.', role: 'Designer' },
                        { text: 'I\'ve tried dozens of productivity apps, but this one actually delivers on its promises.', author: 'Emily T.', role: 'Entrepreneur' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'demo',
                content: {
                    heading: 'See It in Action',
                    subheading: 'Watch our quick demo to see how Launchpad can enhance your productivity.',
                    videoUrl: 'https://example.com/demo-video.mp4'
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'pricing',
                content: {
                    heading: 'Simple, Transparent Pricing',
                    plans: [
                        { name: 'Free', price: '$0', period: '/mo', features: ['Basic features', '1 device', 'Email support'], popular: false },
                        { name: 'Pro', price: '$4.99', period: '/mo', features: ['All features', 'Unlimited devices', 'Priority support', 'Advanced analytics'], popular: true },
                        { name: 'Enterprise', price: 'Custom', period: '', features: ['Everything in Pro', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee'], popular: false }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'newsletter',
                title: 'Stay Notified',
                content: {
                    heading: 'Get Early Access',
                    subheading: 'Be the first to know about new features and updates.'
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'team',
                title: 'The Team',
                content: {
                    heading: 'The Visionaries',
                    team: [
                        { name: 'David Park', role: 'Founder & CEO', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Anna Lee', role: 'Head of Product', image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=400' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'faq',
                title: 'FAQ',
                content: {
                    heading: 'Frequently Asked Questions',
                    faqs: [
                        { question: 'Is there a free trial?', answer: 'Yes! We offer a 14-day free trial of our Pro plan with full access to all features.' },
                        { question: 'Can I cancel anytime?', answer: 'Absolutely. You can cancel your subscription at any time with no penalties.' },
                        { question: 'Do you offer refunds?', answer: 'We offer a 30-day money-back guarantee if you\'re not satisfied with our service.' },
                        { question: 'Is my data secure?', answer: 'Yes, we use industry-leading encryption and security practices to protect your data.' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'cta',
                content: {
                    heading: 'Ready to Get Started?',
                    subheading: 'Join thousands of users who have already transformed their productivity.',
                    buttonText: 'Download Now'
                },
                styles: { padding: '6rem 2rem', textAlign: 'center', backgroundColor: '#8b5cf6', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'case-studies',
                title: 'Success Stories',
                content: {
                    heading: 'How Launchpad Changed Lives',
                    caseStudies: [
                        { title: 'Startup Success', description: 'How a small team scaled to 50k users using our platform.', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800' },
                        { title: 'Productivity Boost', description: 'How a busy professional doubled their daily output.', image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=800' },
                        { title: 'Team Collaboration', description: 'How remote teams improved communication and efficiency.', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'press',
                title: 'In The Press',
                content: {
                    heading: 'Featured In',
                    logos: [
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/techcrunch/techcrunch-original.svg',
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/forbes/forbes-original.svg',
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/wired/wired-original.svg',
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/theverge/theverge-original.svg'
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'footer',
                content: {
                    copyright: '© 2024 Launchpad App. All rights reserved.',
                    description: 'Empowering users to achieve more every day.',
                    links: [
                        { label: 'Privacy Policy', href: '#' },
                        { label: 'Terms of Service', href: '#' },
                        { label: 'Contact Us', href: '#' },
                        { label: 'Support', href: '#' },
                        { label: 'Twitter', href: '#' },
                        { label: 'Instagram', href: '#' },
                        { label: 'LinkedIn', href: '#' }
                    ]
                },
                styles: { padding: '3rem 2rem', backgroundColor: '#111827', color: '#94a3b8' }
            }
        ]
    },

    // 7. Bistro Modern
    '7': {
        id: '7',
        name: 'Bistro Modern',
        description: 'Restaurant website',
        category: 'business',
        settings: {
            ...commonSettings,
            seoTitle: 'Bistro Modern'
        },
        sections: [
            {
                id: uuid(),
                type: 'navbar',
                content: {
                    logoText: 'Bistro Modern',
                    links: [
                        { label: 'Menu', href: '#menu' },
                        { label: 'Chef\'s Table', href: '#chefs-table' },
                        { label: 'Events', href: '#events' },
                        { label: 'Reservations', href: '#reservations' }
                    ],
                    ctaText: 'Book Table'
                },
                styles: { padding: '1.5rem 2rem', backgroundColor: '#000000', color: '#ffffff', customCSS: 'border-bottom: 1px solid #333;' }
            },
            {
                id: uuid(),
                type: 'hero',
                content: {
                    heading: 'Taste the Excellence',
                    subheading: 'Experience culinary artistry in an elegant setting. Our chef-driven menu celebrates seasonal ingredients and innovative techniques.',
                    ctaText: 'Book Table',
                    secondaryCtaText: 'View Menu',
                    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=2000'
                },
                styles: { padding: '8rem 2rem', color: '#fff', backgroundColor: '#000000' }
            },
            {
                id: uuid(),
                type: 'about',
                title: 'Our Story',
                content: {
                    heading: 'Where Passion Meets Perfection',
                    description: 'Bistro Modern was born from a simple idea: to create a dining experience that combines the warmth of traditional hospitality with the excitement of modern culinary innovation. Since opening our doors in 2018, we\'ve been dedicated to crafting memorable moments through exceptional food and service.',
                    features: [
                        { title: 'Local Partnerships', description: 'We work directly with local farmers and artisans to source the finest ingredients.' },
                        { title: 'Seasonal Menus', description: 'Our menu evolves with the seasons to showcase peak freshness and flavor.' },
                        { title: 'Sustainable Practices', description: 'From composting to energy efficiency, we\'re committed to environmental responsibility.' },
                        { title: 'Community Focus', description: 'We believe in giving back to the community that supports us.' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'features',
                content: {
                    heading: 'Our Culinary Experience',
                    features: [
                        { title: 'Seasonal Menu', description: 'Dishes that change with the seasons to showcase the freshest ingredients.', icon: 'Leaf' },
                        { title: 'Wine Pairings', description: 'Expertly curated wine list to complement every course.', icon: 'Wine' },
                        { title: 'Chef\'s Tasting', description: 'Multi-course experience showcasing our chef\'s creativity.', icon: 'ChefHat' },
                        { title: 'Private Dining', description: 'Exclusive spaces for intimate gatherings and special occasions.', icon: 'Building2' },
                        { title: 'Cocktail Program', description: 'Craft cocktails made with house-infused spirits and fresh ingredients.', icon: 'Glass' },
                        { title: 'Brunch Service', description: 'Weekend brunch featuring seasonal specialties and bottomless mimosas.', icon: 'Coffee' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'gallery',
                content: {
                    title: 'A Feast for the Senses',
                    images: [
                        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1517268208409-cc3969579a1b?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'menu',
                content: {
                    heading: 'Chef\'s Selections',
                    items: [
                        { name: 'Seared Scallops', description: 'With cauliflower purée, truffle oil, and microgreens.', price: '$28' },
                        { name: 'Wagyu Beef Tenderloin', description: 'Served with roasted root vegetables and red wine reduction.', price: '$65' },
                        { name: 'Lobster Bisque', description: 'Creamy bisque with sherry and chive crème fraîche.', price: '$18' },
                        { name: 'Herb-Crusted Salmon', description: 'Pan-seared with seasonal vegetables and lemon beurre blanc.', price: '$32' },
                        { name: 'Truffle Risotto', description: 'Arborio rice with wild mushrooms and parmesan.', price: '$26' },
                        { name: 'Chocolate Soufflé', description: 'Warm chocolate soufflé with vanilla bean ice cream.', price: '$15' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'testimonials',
                content: {
                    heading: 'Guest Experiences',
                    quotes: [
                        { text: 'An unforgettable dining experience. Every dish was a work of art.', author: 'Michael B.', role: 'Food Critic' },
                        { text: 'The wine pairings were exceptional. Our server had incredible knowledge.', author: 'Sarah L.', role: 'Regular Guest' },
                        { text: 'Perfect for special occasions. The ambiance is romantic and sophisticated.', author: 'David & Emily', role: 'Anniversary Dinner' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'events',
                title: 'Special Events',
                content: {
                    heading: 'Upcoming Events',
                    events: [
                        { title: 'Wine Tasting Night', date: 'Every Thursday at 7 PM', description: 'Explore our curated wine selection with expert guidance.' },
                        { title: 'Chef\'s Table Series', date: 'Monthly on Saturdays', description: 'Exclusive multi-course tasting menus with wine pairings.' },
                        { title: 'Seasonal Menu Launch', date: 'Next Friday at 6 PM', description: 'Experience our new spring menu creations.' },
                        { title: 'Live Jazz Brunch', date: 'Every Sunday at 11 AM', description: 'Enjoy live music with our weekend brunch service.' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'location',
                content: {
                    heading: 'Visit Us',
                    address: '123 Gourmet Avenue, Culinary District',
                    hours: 'Tuesday - Saturday: 5 PM - 10 PM',
                    phone: '(555) 123-4567',
                    reservationInfo: 'Reservations recommended. Walk-ins welcome based on availability.',
                    amenities: [
                        'Valet parking available',
                        'Private dining rooms for up to 20 guests',
                        'Outdoor patio seating (seasonal)',
                        'Full bar with craft cocktails'
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#000000', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'newsletter',
                content: {
                    heading: 'Stay Updated',
                    subheading: 'Subscribe to receive updates on seasonal menus, special events, and exclusive chef\'s table experiences.',
                    buttonText: 'Subscribe'
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'stats',
                title: 'Accolades',
                content: {
                    stats: [
                        { value: '3', label: 'Michelin Stars' },
                        { value: '15', label: 'Years of Excellence' },
                        { value: '500+', label: 'Wine Selections' },
                        { value: '98%', label: 'Customer Satisfaction' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#000000', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'team',
                title: 'Our Team',
                content: {
                    heading: 'The Culinary Team',
                    team: [
                        { name: 'Chef Marco Rossi', role: 'Executive Chef', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Sommelier Elena Garcia', role: 'Wine Director', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Pastry Chef James Wilson', role: 'Dessert Specialist', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'cta',
                title: 'Private Events',
                content: {
                    heading: 'Host Your Event',
                    subheading: 'Exquisite private dining for your most special moments.',
                    buttonText: 'Inquire Now'
                },
                styles: { padding: '5rem 2rem', textAlign: 'center', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'footer',
                content: {
                    copyright: '© 2024 Bistro Modern. All rights reserved.',
                    description: 'Where culinary artistry meets exceptional hospitality.',
                    links: [
                        { label: 'Privacy Policy', href: '#' },
                        { label: 'Terms of Service', href: '#' },
                        { label: 'Careers', href: '#' },
                        { label: 'Instagram', href: '#' },
                        { label: 'OpenTable', href: '#' },
                        { label: 'Yelp', href: '#' },
                        { label: 'Google Reviews', href: '#' }
                    ]
                },
                styles: { padding: '3rem 2rem', backgroundColor: '#1c1917', color: '#d1d5db' }
            }
        ]
    },

    // 8. DevPortfolio
    '8': {
        id: '8',
        name: 'DevPortfolio',
        description: 'Developer portfolio',
        category: 'portfolio',
        settings: {
            ...commonSettings,
            seoTitle: 'John Doe - Full Stack Developer',
            backgroundColor: '#0f172a',
            seoDescription: 'Creative Full Stack Developer Portfolio'
        },
        sections: [
            {
                id: uuid(),
                type: 'navbar',
                content: {
                    logoText: 'JD',
                    links: [
                        { label: 'About', href: '#about' },
                        { label: 'Skills', href: '#skills' },
                        { label: 'Projects', href: '#projects' },
                        { label: 'Experience', href: '#experience' },
                        { label: 'Contact', href: '#contact' }
                    ],
                    ctaText: 'Resume'
                },
                styles: { padding: '1.5rem 2rem', backgroundColor: '#0f172a', color: '#ffffff', customCSS: 'border-bottom: 1px solid #1e293b;' }
            },
            {
                id: uuid(),
                type: 'hero',
                content: {
                    heading: 'Hi, I\'m John Doe.',
                    subheading: 'I build beautiful, functional web applications that solve real-world problems. Passionate about creating seamless user experiences through clean code and thoughtful design.',
                    ctaText: 'View My Work',
                    secondaryCtaText: 'Download Resume',
                    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=2000'
                },
                styles: { padding: '8rem 2rem', color: '#fff', textAlign: 'left', backgroundColor: '#0f172a' }
            },
            {
                id: uuid(),
                type: 'text',
                content: {
                    heading: 'About Me',
                    text: 'I\'m a passionate full-stack developer with 5+ years of experience creating digital solutions that make a difference. My journey in tech started with curiosity and has evolved into a career dedicated to building products that users love. I specialize in modern JavaScript frameworks and cloud technologies, always staying current with the latest industry trends.'
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#1e293b', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'features',
                title: 'Technical Skills',
                content: {
                    heading: 'My Expertise',
                    features: [
                        { title: 'Frontend Development', description: 'React, Vue.js, TypeScript, Tailwind CSS, responsive design.', icon: 'Monitor' },
                        { title: 'Backend Development', description: 'Node.js, Express, Python, RESTful APIs, GraphQL.', icon: 'Server' },
                        { title: 'Database Design', description: 'PostgreSQL, MongoDB, Redis, data modeling, optimization.', icon: 'Database' },
                        { title: 'DevOps & Cloud', description: 'AWS, Docker, CI/CD, Kubernetes, serverless architecture.', icon: 'Cloud' },
                        { title: 'UI/UX Design', description: 'Figma, Adobe Creative Suite, user research, prototyping.', icon: 'PenTool' },
                        { title: 'Project Management', description: 'Agile methodologies, Scrum, team leadership, communication.', icon: 'Users' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#0f172a', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'project-grid',
                title: 'Featured Projects',
                content: {
                    heading: 'My Work',
                    projects: [
                        { title: 'E-commerce Platform', description: 'Full-stack React + Node.js application with Stripe integration and real-time inventory management.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800' },
                        { title: 'Task Management App', description: 'Collaborative project management tool with real-time updates and drag-and-drop functionality.', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800' },
                        { title: 'Health Tracking Dashboard', description: 'Data visualization platform for health metrics with predictive analytics.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800' },
                        { title: 'Social Media Analytics', description: 'Comprehensive analytics tool for social media performance tracking and insights.', image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=800' },
                        { title: 'Mobile Banking App', description: 'Secure mobile application with biometric authentication and real-time notifications.', image: 'https://images.unsplash.com/photo-1560438718-ebfa50dc65e3?auto=format&fit=crop&q=80&w=800' },
                        { title: 'Educational Platform', description: 'Interactive learning management system with video conferencing and progress tracking.', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#1e293b', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'stats',
                content: {
                    stats: [
                        { value: '50+', label: 'Projects Completed' },
                        { value: '5 Years', label: 'Experience' },
                        { value: '98%', label: 'Client Satisfaction' },
                        { value: '15+', label: 'Technologies Mastered' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#0f172a', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'testimonials',
                content: {
                    heading: 'Client Testimonials',
                    quotes: [
                        { text: 'John delivered an exceptional e-commerce platform that exceeded our expectations. His attention to detail and technical expertise is unmatched.', author: 'Sarah Johnson', role: 'CEO, TechStart' },
                        { text: 'Working with John was a pleasure. He understood our requirements perfectly and delivered a solution that has significantly improved our business operations.', author: 'Michael Chen', role: 'CTO, InnovateCorp' },
                        { text: 'The mobile app John developed for us has received outstanding feedback from our users. His ability to combine functionality with beautiful design is remarkable.', author: 'Emily Rodriguez', role: 'Product Manager, MobileFirst' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#0f172a', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'contact-form',
                content: {
                    heading: 'Let\'s Work Together',
                    subheading: 'Have a project in mind? I\'d love to hear about it. Let\'s discuss how we can bring your ideas to life.'
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#1e293b', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'integrations',
                title: 'Tools & Tech',
                content: {
                    heading: 'My Stack',
                    logos: [
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg'
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#0f172a' }
            },
            {
                id: uuid(),
                type: 'blog-preview',
                title: 'Writing',
                content: {
                    heading: 'Dev Thoughts',
                    posts: [
                        { title: 'The Future of AI in Web Dev', date: 'Jan 1, 2025', excerpt: 'How LLMs are changing the way we write code.' },
                        { title: 'Clean Code Patterns', date: 'Dec 20, 2024', excerpt: 'Maintainable architecture in modern React apps.' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#1e293b' }
            },
            {
                id: uuid(),
                type: 'footer',
                content: {
                    copyright: '© 2024 John Doe. All rights reserved.',
                    description: 'Building the future, one line of code at a time.',
                    links: [
                        { label: 'LinkedIn', href: '#' },
                        { label: 'GitHub', href: '#' },
                        { label: 'Twitter', href: '#' },
                        { label: 'Dribbble', href: '#' },
                        { label: 'Behance', href: '#' }
                    ]
                },
                styles: { padding: '3rem 2rem', backgroundColor: '#020617', color: '#94a3b8' }
            }
        ]
    },

    // 9. MarketPro
    '9': {
        id: '9',
        name: 'MarketPro',
        description: 'Multi-vendor marketplace',
        category: 'ecommerce',
        settings: {
            ...commonSettings,
            seoTitle: 'MarketPro',
            accentColor: '#f97316'
        },
        sections: [
            {
                id: uuid(),
                type: 'navbar',
                content: {
                    logoText: 'MarketPro',
                    links: [
                        { label: 'Categories', href: '#categories' },
                        { label: 'Deals', href: '#deals' },
                        { label: 'Sellers', href: '#sellers' },
                        { label: 'Help', href: '#help' }
                    ],
                    ctaText: 'Sell on MarketPro',
                    search: true
                },
                styles: { padding: '1rem 2rem', backgroundColor: '#ffffff', customCSS: 'border-bottom: 1px solid #e5e7eb;' }
            },
            {
                id: uuid(),
                type: 'hero',
                content: {
                    heading: 'Find Anything You Need',
                    subheading: 'Discover millions of products from trusted sellers worldwide. Quality guaranteed, prices unbeatable.',
                    ctaText: 'Browse Categories',
                    secondaryCtaText: 'Shop Deals',
                    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=2000'
                },
                styles: { padding: '8rem 2rem', backgroundColor: '#ffedd5', textAlign: 'center' }
            },
            {
                id: uuid(),
                type: 'features',
                content: {
                    heading: 'Why Shop With Us',
                    features: [
                        { title: 'Buyer Protection', description: 'Your purchase is protected from click to delivery.', icon: 'Shield' },
                        { title: 'Secure Payments', description: 'Multiple payment options with bank-level security.', icon: 'CreditCard' },
                        { title: 'Fast Shipping', description: 'Get your items delivered quickly and safely.', icon: 'Truck' },
                        { title: 'Easy Returns', description: 'Hassle-free returns within 30 days.', icon: 'RefreshCcw' },
                        { title: '24/7 Support', description: 'Our customer service team is always here to help.', icon: 'Headphones' },
                        { title: 'Verified Sellers', description: 'All sellers are verified for your peace of mind.', icon: 'BadgeCheck' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'product-grid',
                content: {
                    heading: 'Trending Items',
                    subheading: 'Discover what everyone is buying right now.',
                    products: [
                        { name: 'Wireless Earbuds', price: '$79.99', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=800', badge: 'Bestseller' },
                        { name: 'Smart Watch', price: '$199.99', image: 'https://images.unsplash.com/photo-1523275335682-92da4c34ce4c?auto=format&fit=crop&q=80&w=800', badge: 'New' },
                        { name: 'Bluetooth Speaker', price: '$59.99', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=800', badge: 'Sale' },
                        { name: 'Gaming Mouse', price: '$49.99', image: 'https://images.unsplash.com/photo-1558190042-072e20025718?auto=format&fit=crop&q=80&w=800', badge: 'Popular' },
                        { name: 'LED Desk Lamp', price: '$39.99', image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=800', badge: 'Eco-Friendly' },
                        { name: 'Portable Charger', price: '$29.99', image: 'https://images.unsplash.com/photo-1615526675741-c4c083a64712?auto=format&fit=crop&q=80&w=800', badge: 'Best Value' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'categories',
                content: {
                    heading: 'Shop by Category',
                    categories: [
                        { name: 'Electronics', count: '10k+ products', color: '#f97316' },
                        { name: 'Fashion', count: '15k+ products', color: '#ef4444' },
                        { name: 'Home & Garden', count: '8k+ products', color: '#10b981' },
                        { name: 'Sports', count: '5k+ products', color: '#3b82f6' },
                        { name: 'Beauty', count: '12k+ products', color: '#a855f7' },
                        { name: 'Toys', count: '6k+ products', color: '#f59e0b' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'section',
                content: {
                    heading: 'Limited Time Offers',
                    subheading: 'Don\'t miss out on these incredible deals. Sale ends soon!',
                    ctaText: 'View All Deals',
                    image: 'https://images.unsplash.com/photo-1523755231516-e43fd2e8c5b8?auto=format&fit=crop&q=80&w=1200'
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#f97316', color: '#ffffff', textAlign: 'center' }
            },
            {
                id: uuid(),
                type: 'testimonials',
                content: {
                    heading: 'What Our Customers Say',
                    quotes: [
                        { text: 'MarketPro has the best prices and fastest shipping I\'ve found online. Will definitely be shopping here again!', author: 'Jessica T.', role: 'Frequent Shopper' },
                        { text: 'I was worried about buying from an online marketplace, but the buyer protection gave me peace of mind. Great experience!', author: 'Mark R.', role: 'First-time Buyer' },
                        { text: 'The variety of products is amazing. I found exactly what I was looking for at a great price.', author: 'Sarah L.', role: 'Happy Customer' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'newsletter',
                content: {
                    heading: 'Stay Updated on Deals',
                    subheading: 'Subscribe to receive exclusive offers, new product alerts, and shopping tips straight to your inbox.',
                    buttonText: 'Subscribe Now'
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'stats',
                title: 'Market Impact',
                content: {
                    stats: [
                        { value: '1M+', label: 'Happy Customers' },
                        { value: '50k+', label: 'Reliable Sellers' },
                        { value: '99.9%', label: 'Protection' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#f97316', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'faq',
                title: 'Market FAQ',
                content: {
                    heading: 'Common Questions',
                    faqs: [
                        { question: 'Is shipping worldwide?', answer: 'Yes, we ship to over 150 countries.' },
                        { question: 'How do returns work?', answer: 'Simple returns within 30 days of delivery.' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'footer',
                content: {
                    copyright: '© 2024 MarketPro. All rights reserved.',
                    description: 'Your trusted marketplace for quality products.',
                    links: [
                        { label: 'About Us', href: '#' },
                        { label: 'Privacy Policy', href: '#' },
                        { label: 'Terms of Service', href: '#' },
                        { label: 'Help Center', href: '#' },
                        { label: 'Sell on MarketPro', href: '#' },
                        { label: 'Contact Us', href: '#' }
                    ]
                },
                styles: { padding: '3rem 2rem', backgroundColor: '#1e293b', color: '#ffffff' }
            }
        ]
    },

    // 10. Luxe Interiors (Painting/Local Business)
    '10': {
        id: '10',
        name: 'Luxe Interiors',
        description: 'Premium painting and interior design services',
        category: 'business',
        settings: {
            ...commonSettings,
            seoTitle: 'Luxe Interiors - Professional Painting',
            accentColor: '#ca8a04', // Gold/Dark Yellow
            fontFamily: 'Playfair Display, serif',
            backgroundColor: '#fafaf9' // Warm stone
        },
        sections: [
            {
                id: uuid(),
                type: 'navbar',
                title: 'Navigation',
                content: {
                    logoText: 'Luxe Interiors',
                    links: [
                        { label: 'Services', href: '#services' },
                        { label: 'Portfolio', href: '#portfolio' },
                        { label: 'Testimonials', href: '#testimonials' },
                        { label: 'About', href: '#about' },
                        { label: 'Contact', href: '#contact' },
                    ],
                    ctaText: 'Get a Quote',
                },
                styles: { padding: '1.5rem 2rem', backgroundColor: '#ffffff', customCSS: 'border-bottom: 1px solid #e7e5e4;' }
            },
            {
                id: uuid(),
                type: 'hero',
                title: 'Hero Section',
                content: {
                    heading: 'Transform Your Space with Color',
                    subheading: 'Award-winning residential and commercial painting services. We bring your vision to life with precision and care.',
                    ctaText: 'Schedule Consultation',
                    secondaryCtaText: 'View Portfolio',
                    image: 'https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?auto=format&fit=crop&q=80&w=2000'
                },
                styles: { padding: '8rem 2rem', textAlign: 'center', backgroundColor: '#1c1917', color: '#ffffff' } // Dark stone bg
            },
            {
                id: uuid(),
                type: 'text',
                title: 'Our Story',
                content: {
                    heading: 'Crafting Beautiful Spaces Since 2004',
                    text: 'For over 20 years, Luxe Interiors has been transforming homes and businesses across the region. Our team of certified professionals combines traditional craftsmanship with modern techniques to deliver exceptional results that exceed expectations. We take pride in our attention to detail, quality materials, and commitment to customer satisfaction.'
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'features',
                title: 'Our Services',
                content: {
                    heading: 'Exceptional Quality',
                    subtitle: 'We bring over 20 years of experience to every project.',
                    features: [
                        { title: 'Interior Painting', description: 'Flawless finishes for every room. We handle everything from prep work to final touches.', icon: 'Paintbrush' },
                        { title: 'Exterior Protection', description: 'Long-lasting weather resistance with premium paints and expert application.', icon: 'Home' },
                        { title: 'Color Consulting', description: 'Expert advice on palettes and trends to help you choose the perfect colors.', icon: 'Palette' },
                        { title: 'Cabinet Refinishing', description: 'Revitalize your kitchen with our professional cabinet painting services.', icon: 'Layers' },
                        { title: 'Commercial Painting', description: 'Professional painting services for offices, retail spaces, and more.', icon: 'Building2' },
                        { title: 'Wallpaper Installation', description: 'Expert wallpaper hanging and removal services.', icon: 'Wallpaper' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'process',
                title: 'Our Process',
                content: {
                    heading: 'The Luxe Approach',
                    steps: [
                        { title: 'Consultation', description: 'We discuss your vision and color choices.', icon: 'MessageSquare' },
                        { title: 'Preparation', description: 'Protecting furniture and preparing surfaces.', icon: 'Shield' },
                        { title: 'Painting', description: 'Meticulous application of premium paint.', icon: 'Paintbrush' },
                        { title: 'Inspection', description: 'Final walk-through to ensure perfection.', icon: 'CheckCircle' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#fafaf9' }
            },
            {
                id: uuid(),
                type: 'gallery',
                title: 'Our Work',
                content: {
                    title: 'Recent Projects',
                    images: [
                        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1578898889136-6b9e68628773?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1572093377239-4f3d718431bf?auto=format&fit=crop&q=80&w=800'
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#fafaf9' }
            },
            {
                id: uuid(),
                type: 'testimonials',
                title: 'Client Reviews',
                content: {
                    heading: 'What Homeowners Say',
                    quotes: [
                        { text: 'Absolutely stunned by the transformation. The team was professional, clean, and on time. Our home looks brand new!', author: 'Emily R.', role: 'Homeowner' },
                        { text: 'Luxe Interiors provided the best painting service we have ever used. The attention to detail is unmatched.', author: 'Michael T.', role: 'Business Owner' },
                        { text: 'From consultation to completion, the experience was seamless. The color consultation alone was worth it!', author: 'Sarah L.', role: 'Homeowner' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'stats',
                title: 'Achievements',
                content: {
                    stats: [
                        { value: '2k+', label: 'Homes Painted' },
                        { value: '500+', label: 'Commercial Jobs' },
                        { value: '4.9/5', label: 'Average Rating' },
                        { value: '20+', label: 'Years Experience' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#ca8a04', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'team',
                title: 'The Artisans',
                content: {
                    heading: 'Meet the Experts',
                    team: [
                        { name: 'Robert Vance', role: 'Master Painter', image: 'https://images.unsplash.com/photo-1540569014015-19a7ee504e3a?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Sarah Miller', role: 'Color Consultant', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400' },
                        { name: 'James Wilson', role: 'Project Manager', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#fafaf9' }
            },
            {
                id: uuid(),
                type: 'cta',
                title: 'Contact CTA',
                content: {
                    heading: 'Ready to refresh your home?',
                    subheading: 'Contact us today for a free estimate. Our team is ready to bring your vision to life.',
                    buttonText: 'Get Free Quote'
                },
                styles: { padding: '5rem 2rem', textAlign: 'center', backgroundColor: '#ca8a04', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'contact-form',
                title: 'Contact Us',
                content: {
                    heading: 'Start Your Project',
                    subheading: 'Fill out the form below and we\'ll get back to you within 24 hours.'
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#fafaf9' }
            },
            {
                id: uuid(),
                type: 'newsletter',
                title: 'Stay Inspired',
                content: {
                    heading: 'Get Design Tips',
                    subheading: 'Subscribe to receive seasonal color trends and home improvement tips.'
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'faq',
                title: 'Painting FAQ',
                content: {
                    heading: 'Common Questions',
                    faqs: [
                        { question: 'How long does a typical paint job last?', answer: 'With proper preparation and quality materials, our paint jobs typically last 7-10 years.' },
                        { question: 'Do you provide paint samples?', answer: 'Yes, we offer color consultation with samples to help you make the perfect choice.' },
                        { question: 'Are you insured?', answer: 'Absolutely. We carry full liability and workers compensation insurance.' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#fafaf9' }
            },
            {
                id: uuid(),
                type: 'footer',
                title: 'Footer',
                content: {
                    copyright: '© 2024 Luxe Interiors. All rights reserved.',
                    description: 'Premium painting services for discerning clients.',
                    links: [
                        { label: 'Privacy Policy', href: '#' },
                        { label: 'Terms of Service', href: '#' },
                        { label: 'Careers', href: '#' },
                        { label: 'Gallery', href: '#' },
                        { label: 'Blog', href: '#' },
                        { label: 'FAQ', href: '#' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#1c1917', color: '#a8a29e' }
            }
        ]
    },

    // 11. Quantum SaaS
    '11': {
        id: '11',
        name: 'Quantum SaaS',
        description: 'High-tech dark mode SaaS template',
        category: 'saas',
        settings: {
            ...commonSettings,
            seoTitle: 'Quantum - Next Gen Cloud',
            accentColor: '#3b82f6', // Blue
            fontFamily: 'Inter, sans-serif',
            backgroundColor: '#0f172a' // Dark Slate
        },
        sections: [
            {
                id: uuid(),
                type: 'navbar',
                title: 'Navigation',
                content: {
                    logoText: 'Quantum',
                    links: [
                        { label: 'Product', href: '#product' },
                        { label: 'Solutions', href: '#solutions' },
                        { label: 'Developers', href: '#developers' },
                        { label: 'Pricing', href: '#pricing' },
                        { label: 'Blog', href: '#blog' }
                    ],
                    ctaText: 'Deploy Now',
                },
                styles: { padding: '1.5rem 2rem', backgroundColor: '#0f172a', color: '#ffffff', customCSS: 'border-bottom: 1px solid #1e293b;' }
            },
            {
                id: uuid(),
                type: 'hero',
                title: 'Hero Section',
                content: {
                    heading: 'Infrastructure for the Future',
                    subheading: 'Deploy your applications to the edge with zero configuration. Global low-latency network included.',
                    ctaText: 'Start Building',
                    secondaryCtaText: 'Read Documentation',
                    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000'
                },
                styles: { padding: '8rem 2rem', textAlign: 'center', backgroundColor: '#0f172a', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'stats',
                title: 'Metrics',
                content: {
                    stats: [
                        { value: '100ms', label: 'Global Latency' },
                        { value: '35+', label: 'Data Centers' },
                        { value: '99.99%', label: 'SLA Guarantee' },
                        { value: '1M+', label: 'Active Deployments' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#1e293b', color: '#60a5fa' }
            },
            {
                id: uuid(),
                type: 'features',
                title: 'Core Features',
                content: {
                    heading: 'Built for Scale',
                    features: [
                        { title: 'Edge Computing', description: 'Run code closer to your users.', icon: 'Globe' },
                        { title: 'Instant Rollbacks', description: 'Recover from errors in seconds.', icon: 'Rewind' },
                        { title: 'DDoS Protection', description: 'Enterprise security standard.', icon: 'Shield' },
                        { title: 'Real-time Logs', description: 'Debug with live streaming logs.', icon: 'Terminal' },
                        { title: 'Team Collaboration', description: 'Built-in PR previews.', icon: 'Users' },
                        { title: 'API First', description: 'Automate everything.', icon: 'Cpu' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#0f172a', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'integrations',
                title: 'Integrations',
                content: {
                    heading: 'Seamless Integrations',
                    logos: [
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gitlab/gitlab-original.svg',
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-plain.svg',
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/aws/aws-original.svg',
                        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg'
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#0f172a' }
            },
            {
                id: uuid(),
                type: 'testimonials',
                title: 'Success Stories',
                content: {
                    heading: 'Developers Love Quantum',
                    quotes: [
                        { text: 'Deployment times dropped by 80% after switching.', author: 'Jane D.', role: 'Senior Dev' },
                        { text: 'The best developer experience I\'ve had in years.', author: 'Alex S.', role: 'CTO' },
                        { text: 'Our global user base has never been happier with our app performance.', author: 'Mark R.', role: 'Engineering Lead' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#1e293b' }
            },
            {
                id: uuid(),
                type: 'case-studies',
                title: 'Case Studies',
                content: {
                    heading: 'Real-World Impact',
                    caseStudies: [
                        { title: 'E-commerce Platform', description: 'Scaled to handle Black Friday traffic with zero downtime.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800' },
                        { title: 'FinTech Application', description: 'Achieved sub-50ms response times globally.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#0f172a' }
            },
            {
                id: uuid(),
                type: 'pricing',
                title: 'Pricing',
                content: {
                    heading: 'Simple Usage-Based Pricing',
                    plans: [
                        { name: 'Developer', price: '$0', period: '/mo', features: ['Personal projects', 'Community support', '100GB Bandwidth'] },
                        { name: 'Team', price: '$20', period: '/mo/seat', features: ['Unlimited projects', 'Priority support', '1TB Bandwidth'], popular: true },
                        { name: 'Business', price: '$100', period: '/mo', features: ['SSO', 'Audit Logs', 'Dedicated Success Manager'] },
                        { name: 'Enterprise', price: 'Custom', period: '', features: ['Custom SLAs', '24/7 Support', 'Advanced Security'] }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#1e293b', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'cta',
                title: 'CTA',
                content: {
                    heading: 'Ready to ship?',
                    subheading: 'Get $200 in credits when you sign up today.',
                    buttonText: 'Claim Credits'
                },
                styles: { padding: '5rem 2rem', textAlign: 'center', backgroundColor: '#3b82f6', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'newsletter',
                title: 'Stay in the Loop',
                content: {
                    heading: 'Engineering Updates',
                    subheading: 'Get the latest release notes and performance tips.'
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#1e293b' }
            },
            {
                id: uuid(),
                type: 'blog-preview',
                title: 'Engineering Blog',
                content: {
                    heading: 'Recent Technical Posts',
                    posts: [
                        { title: 'Edge Functions: Best Practices', date: 'Jan 1, 2025', excerpt: 'How to optimize for minimum latency.' },
                        { title: 'Global State Management', date: 'Dec 15, 2024', excerpt: 'Building resilient cloud infrastructure.' },
                        { title: 'Security at the Edge', date: 'Dec 1, 2024', excerpt: 'Protecting applications in distributed environments.' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#0f172a' }
            },
            {
                id: uuid(),
                type: 'team',
                title: 'Engineering Team',
                content: {
                    heading: 'The Minds Behind Quantum',
                    team: [
                        { name: 'Sarah Chen', role: 'CTO', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' },
                        { name: 'David Kim', role: 'Lead Engineer', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Maria Rodriguez', role: 'Security Lead', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#1e293b' }
            },
            {
                id: uuid(),
                type: 'footer',
                title: 'Footer',
                content: {
                    copyright: '© 2024 Quantum Cloud Inc.',
                    links: [
                        { label: 'Status', href: '#status' },
                        { label: 'GitHub', href: '#github' },
                        { label: 'Discord', href: '#discord' },
                        { label: 'Careers', href: '#careers' },
                        { label: 'Contact', href: '#contact' },
                        { label: 'Privacy', href: '#privacy' }
                    ]
                },
                styles: { padding: '3rem 2rem', backgroundColor: '#020617', color: '#94a3b8' }
            }
        ]
    },

    // 12. Urban Threads (Ecommerce)
    '12': {
        id: '12',
        name: 'Urban Threads',
        description: 'Streetwear fashion store',
        category: 'ecommerce',
        settings: {
            ...commonSettings,
            seoTitle: 'Urban Threads - Streetwear',
            accentColor: '#000000',
            fontFamily: 'Oswald, sans-serif'
        },
        sections: [
            {
                id: uuid(),
                type: 'navbar',
                title: 'Navigation',
                content: {
                    logoText: 'URBAN // THREADS',
                    links: [
                        { label: 'New Drops', href: '#' },
                        { label: 'Collections', href: '#' },
                        { label: 'Accessories', href: '#' },
                    ],
                    ctaText: 'Cart',
                    search: true
                },
                styles: { padding: '1.5rem 2rem', backgroundColor: '#ffffff', customCSS: 'border-bottom: 2px solid #000;' }
            },
            {
                id: uuid(),
                type: 'hero',
                title: 'Hero',
                content: {
                    heading: 'DEFINING STREET CULTURE',
                    subheading: 'The Fall/Winter 2024 Collection is here. Limited pieces available.',
                    ctaText: 'SHOP THE DROP',
                    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=2000'
                },
                styles: { padding: '8rem 2rem', textAlign: 'left', color: '#ffffff', backgroundColor: '#000000' }
            },
            {
                id: uuid(),
                type: 'product-grid',
                title: 'Featured',
                content: {
                    heading: 'Just Dropped',
                    products: [
                        { name: 'Oversized Hoodie', price: '$85.00', image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800' },
                        { name: 'Cargo Pants', price: '$95.00', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800' },
                        { name: 'Graphic Tee', price: '$45.00', image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&q=80&w=800' },
                        { name: 'Sneakers', price: '$120.00', image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'categories',
                title: 'Shop Categories',
                content: {
                    heading: 'Shop by Style',
                    categories: [
                        { name: 'Outerwear', count: 'Jackets & Coats', color: '#000000', image: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&q=80&w=800' },
                        { name: 'Tops', count: 'Tees & Hoodies', color: '#000000', image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&q=80&w=800' },
                        { name: 'Bottoms', count: 'Pants & Shorts', color: '#000000', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'image-text',
                title: 'Our Story',
                content: {
                    heading: 'Built for the Streets',
                    text: 'Urban Threads was born from a desire to create clothing that speaks to the culture of the city. We blend high-end fashion with streetwear aesthetics to create pieces that are unique, comfortable, and bold.',
                    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=1200',
                    imagePosition: 'right'
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f3f4f6' }
            },
            {
                id: uuid(),
                type: 'features',
                title: 'Why Us',
                content: {
                    heading: 'The Urban Standard',
                    features: [
                        { title: 'Premium Cotton', description: 'Heavyweight fabrics that last.', icon: 'Shirt' },
                        { title: 'Limited Runs', description: 'Once it\'s gone, it\'s gone.', icon: 'Clock' },
                        { title: 'Worldwide Shipping', description: 'We ship to 150+ countries.', icon: 'Globe' }
                    ]
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#f3f4f6' }
            },
            {
                id: uuid(),
                type: 'newsletter',
                title: 'Newsletter',
                content: {
                    heading: 'Don\'t Miss a Drop',
                    subheading: 'Sign up for SMS/Email alerts for new releases.'
                },
                styles: { padding: '5rem 2rem', backgroundColor: '#000000', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'testimonials',
                title: 'Street Cred',
                content: {
                    heading: 'What the Culture Says',
                    quotes: [
                        { text: 'The quality of the oversized hoodies is unmatched. Essential pieces.', author: 'Tyler K.' },
                        { text: 'Finally a brand that understands urban aesthetics and sustainable quality.', author: 'Marcus V.' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'gallery',
                title: 'Community Feed',
                content: {
                    title: 'Tagged on Social',
                    images: [
                        'https://images.unsplash.com/photo-1523381294911-8d38b163c37a?auto=format&fit=crop&q=80&w=400',
                        'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=400'
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#f3f4f6' }
            },
            {
                id: uuid(),
                type: 'footer',
                title: 'Footer',
                content: {
                    copyright: '© 2024 Urban Threads Est. 2020',
                },
                styles: { padding: '3rem 2rem', backgroundColor: '#111111', color: '#666666' }
            }
        ]
    },

    // 13. Zen Spa (Business/Service)
    '13': {
        id: '13',
        name: 'Zen Spa',
        description: 'Wellness and spa retreat template',
        category: 'business',
        settings: {
            ...commonSettings,
            seoTitle: 'Zen Spa & Wellness',
            accentColor: '#57534e', // Stone
            fontFamily: 'Cormorant Garamond, serif',
            backgroundColor: '#f5f5f4'
        },
        sections: [
            {
                id: uuid(),
                type: 'navbar',
                title: 'Navigation',
                content: {
                    logoText: 'ZEN SPA',
                    links: [
                        { label: 'Treatments', href: '#' },
                        { label: 'Packages', href: '#' },
                        { label: 'Therapists', href: '#therapists' },
                        { label: 'Retreats', href: '#retreats' },
                        { label: 'About', href: '#about' },
                    ],
                    ctaText: 'Book Appointment'
                },
                styles: { padding: '1.5rem 2rem', backgroundColor: '#f5f5f4', customCSS: 'border-bottom: none;' }
            },
            {
                id: uuid(),
                type: 'hero',
                title: 'Hero',
                content: {
                    heading: 'Find Your Inner Peace',
                    subheading: 'A sanctuary for the senses, dedicated to restoring balance and harmony. Experience true relaxation in our tranquil oasis.',
                    ctaText: 'Explore Treatments',
                    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=2000'
                },
                styles: { padding: '8rem 2rem', textAlign: 'center', backgroundColor: '#e7e5e4', color: '#44403c' }
            },
            {
                id: uuid(),
                type: 'text',
                title: 'Our Sanctuary',
                content: {
                    heading: 'Welcome to Tranquility',
                    text: 'Nestled in the heart of nature, Zen Spa offers a peaceful retreat from the stresses of everyday life. Our facility is designed to promote relaxation and healing through carefully curated spaces and natural elements.'
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'features',
                title: 'Services',
                content: {
                    heading: 'Holistic Therapies',
                    features: [
                        { title: 'Massage Therapy', description: 'Deep tissue, Swedish, and Hot Stone. Our therapists use organic oils and traditional techniques.', icon: 'Heart' },
                        { title: 'Facials', description: 'Organic skincare treatments tailored to your skin\'s unique needs.', icon: 'Sparkles' },
                        { title: 'Hydrotherapy', description: 'Thermal baths and sauna to detoxify and rejuvenate your body.', icon: 'Droplets' },
                        { title: 'Aromatherapy', description: 'Essential oil blends to enhance your treatment experience.', icon: 'Leaf' },
                        { title: 'Reflexology', description: 'Ancient foot therapy to balance your body\'s energy.', icon: 'Footprints' },
                        { title: 'Meditation', description: 'Guided sessions to calm your mind and spirit.', icon: 'Brain' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'team',
                title: 'Our Therapists',
                content: {
                    heading: 'Expert Healing Hands',
                    team: [
                        { name: 'Elena R.', role: 'Senior Massage Therapist', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Sarah K.', role: 'Master Esthetician', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Michael J.', role: 'Reflexology Specialist', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Aisha M.', role: 'Meditation Guide', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f5f5f4' }
            },
            {
                id: uuid(),
                type: 'pricing',
                title: 'Packages',
                content: {
                    heading: 'Wellness Packages',
                    plans: [
                        { name: 'Relaxation', price: '$150', period: '', features: ['60m Massage', 'Custom Facial', 'Aromatherapy'] },
                        { name: 'Rejuvenation', price: '$220', period: '', features: ['90m Massage', 'Body Scrub', 'Hydrotherapy', 'Tea Service'], popular: true },
                        { name: 'Ultimate Bliss', price: '$350', period: '', features: ['2h Treatment', 'Private Suite', 'Lunch Included', 'Take-home Gift'] },
                        { name: 'Detox Retreat', price: '$500', period: '', features: ['Full Day', 'Multiple Therapies', 'Nutrition Consultation', 'Private Pool Access'] }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'retreats',
                title: 'Retreats',
                content: {
                    heading: 'Weekend Getaways',
                    retreats: [
                        { title: 'Mindful Escape', duration: '2 Days', description: 'Complete digital detox with meditation and nature walks.', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800' },
                        { title: 'Couples Retreat', duration: '3 Days', description: 'Romantic getaway with couples massage and private dining.', image: 'https://images.unsplash.com/photo-1516594933903-932585bf5eed?auto=format&fit=crop&q=80&w=800' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f5f5f4' }
            },
            {
                id: uuid(),
                type: 'text',
                title: 'About',
                content: {
                    title: 'Our Philosophy',
                    text: 'We believe in the healing power of nature and touch. Our therapists are trained in ancient techniques combined with modern wellness practices to ensure your complete relaxation. Every treatment is personalized to your needs.'
                },
                styles: { padding: '6rem 2rem', textAlign: 'center', backgroundColor: '#f5f5f4', color: '#57534e' }
            },
            {
                id: uuid(),
                type: 'testimonials',
                title: 'Guest Experiences',
                content: {
                    heading: 'What Our Guests Say',
                    quotes: [
                        { text: 'The most relaxing hour of my life. I left feeling completely renewed.', author: 'Jennifer A.', role: 'Regular Guest' },
                        { text: 'A truly magical place. I felt rejuvenated immediately and will definitely return.', author: 'Marcus B.', role: 'First-time Visitor' },
                        { text: 'The therapists are incredibly skilled. Best spa experience I\'ve ever had.', author: 'Sophia L.', role: 'Wellness Enthusiast' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'cta',
                title: 'Begin Your Journey',
                content: {
                    heading: 'Begin Your Journey',
                    subheading: 'Book your appointment today and experience the difference.',
                    buttonText: 'Reserve Your Visit'
                },
                styles: { padding: '6rem 2rem', textAlign: 'center', backgroundColor: '#78716c', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'location',
                title: 'Spa Location',
                content: {
                    heading: 'Visit Our Sanctuary',
                    address: '789 Serenity Way, Wellness Valley, CA',
                    hours: 'Daily: 9am - 9pm',
                    phone: '+1 (555) 012-3456',
                    amenities: ['Private Parking', 'Changing Rooms', 'Tea Lounge', 'Meditation Garden']
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#f5f5f4' }
            },
            {
                id: uuid(),
                type: 'newsletter',
                title: 'Wellness Tips',
                content: {
                    heading: 'Stay Mindful',
                    subheading: 'Get wellness tips and special retreat offers in your inbox.'
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'stats',
                title: 'Our Impact',
                content: {
                    stats: [
                        { value: '10k+', label: 'Happy Clients' },
                        { value: '15+', label: 'Years of Excellence' },
                        { value: '95%', label: 'Satisfaction Rate' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#f5f5f4', color: '#57534e' }
            },
            {
                id: uuid(),
                type: 'gallery',
                title: 'Our Space',
                content: {
                    title: 'Tranquil Environment',
                    images: [
                        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1516594933903-932585bf5eed?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=800'
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'footer',
                title: 'Footer',
                content: {
                    copyright: '© 2024 Zen Spa & Wellness',
                    links: [
                        { label: 'Privacy Policy', href: '#' },
                        { label: 'Terms of Service', href: '#' },
                        { label: 'Careers', href: '#' },
                        { label: 'Gift Cards', href: '#' }
                    ]
                },
                styles: { padding: '3rem 2rem', backgroundColor: '#292524', color: '#d6d3d1' }
            }
        ]
    },

    // 14. Summit Roofing
    '14': {
        id: '14',
        name: 'Summit Roofing',
        description: 'Professional roofing services',
        category: 'business',
        settings: {
            ...commonSettings,
            seoTitle: 'Summit Roofing - Quality Protection',
            accentColor: '#0f172a', // Slate 900
            fontFamily: 'Roboto, sans-serif',
            backgroundColor: '#f8fafc'
        },
        sections: [
            {
                id: uuid(),
                type: 'navbar',
                title: 'Navigation',
                content: {
                    logoText: 'SUMMIT ROOFING',
                    links: [
                        { label: 'Services', href: '#services' },
                        { label: 'Projects', href: '#projects' },
                        { label: 'Contact', href: '#contact' },
                    ],
                    ctaText: 'Emergency Repair',
                    ctaLink: 'tel:555-0123'
                },
                styles: { padding: '1rem 2rem', backgroundColor: '#0f172a', color: '#ffffff', customCSS: 'border-bottom: 2px solid #334155;' }
            },
            {
                id: uuid(),
                type: 'hero',
                title: 'Hero',
                content: {
                    heading: 'Roofing Done Right.',
                    subheading: 'Residential and Commercial roofing solutions built to last a lifetime.',
                    ctaText: 'Free Inspection',
                    image: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&q=80&w=2000'
                },
                styles: { padding: '8rem 2rem', textAlign: 'left', backgroundColor: '#0f172a', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'features',
                title: 'Services',
                content: {
                    heading: 'Our Expertise',
                    features: [
                        { title: 'Roof Replacement', description: 'Complete tear-off and installation.', icon: 'Home' },
                        { title: 'Leak Repair', description: 'Fast fixes for leaks and storm damage.', icon: 'Hammer' },
                        { title: 'Gutters', description: 'Installation and cleaning services.', icon: 'Droplets' },
                        { title: 'Inspections', description: 'Detailed reports for insurance.', icon: 'Search' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'process',
                title: 'Our Process',
                content: {
                    heading: 'How It Works',
                    steps: [
                        { title: 'Free Inspection', description: 'We assess your roof\'s condition.', icon: 'Search' },
                        { title: 'Detailed Quote', description: 'Transparent pricing with no surprises.', icon: 'FileTextIcon' },
                        { title: 'Installation', description: 'Professional installation by certified crews.', icon: 'Hammer' },
                        { title: 'Final Cleanup', description: 'Magnet sweep and debris removal.', icon: 'Sparkles' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'faq',
                title: 'FAQ',
                content: {
                    heading: 'Common Questions',
                    faqs: [
                        { question: 'How long does a roof replacement take?', answer: 'Most residential roofs are completed in 1-2 days.' },
                        { question: 'Do you offer warranties?', answer: 'Yes, we offer both manufacturer and workmanship warranties.' },
                        { question: 'Are you licensed and insured?', answer: 'Absolutely. We are fully licensed, bonded, and insured.' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'stats',
                content: {
                    stats: [
                        { value: '25+', label: 'Years Experience' },
                        { value: '5k+', label: 'Roofs Installed' },
                        { value: 'A+', label: 'BBB Rating' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#1e293b', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'testimonials',
                content: {
                    heading: 'Trusted by Neighbors',
                    quotes: [
                        { text: 'Summit fixed our leak in the middle of a storm. Heroes!', author: 'David K.' },
                        { text: 'Best looking roof on the block. Professional crew.', author: 'Sarah M.' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f1f5f9' }
            },
            {
                id: uuid(),
                type: 'warranties',
                title: 'Our Warranties',
                content: {
                    heading: 'Peace of Mind Guaranteed',
                    warranties: [
                        { title: 'Manufacturer Warranty', description: 'Up to 50 years on premium shingles and materials.', icon: 'Shield' },
                        { title: 'Workmanship Warranty', description: '10-year guarantee on all installation work.', icon: 'CheckCircle' },
                        { title: 'Weather Protection', description: 'Coverage for wind, hail, and storm damage.', icon: 'CloudRain' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'emergency',
                title: 'Emergency Services',
                content: {
                    heading: '24/7 Emergency Roofing',
                    subheading: 'Storm damage? Leaks? We\'re here when you need us most.',
                    services: [
                        'Emergency tarping and board-up',
                        'Water damage mitigation',
                        'Insurance claim assistance',
                        'Rapid response within 2 hours'
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#1e293b', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'materials',
                title: 'Quality Materials',
                content: {
                    heading: 'Premium Products',
                    materials: [
                        { name: 'GAF Shingles', description: 'Industry-leading durability and warranty.', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Owens Corning', description: 'Superior protection and energy efficiency.', image: 'https://images.unsplash.com/photo-1560184897-6a0c045e0fa5?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Certainteed', description: 'Premium materials with lifetime warranties.', image: 'https://images.unsplash.com/photo-1523996798739-68ba5e42c300?auto=format&fit=crop&q=80&w=400' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'gallery',
                title: 'Project Gallery',
                content: {
                    title: 'Our Recent Roof Replacements',
                    images: [
                        'https://images.unsplash.com/photo-1620067980302-31649646c107?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1583239234260-465780547800?auto=format&fit=crop&q=80&w=800'
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'team',
                title: 'Our Team',
                content: {
                    heading: 'Certified Professionals',
                    team: [
                        { name: 'David Wilson', role: 'Master Roofer', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Lisa Thompson', role: 'Project Manager', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Tom Rodriguez', role: 'Estimator', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f8fafc' }
            },
            {
                id: uuid(),
                type: 'newsletter',
                title: 'Roof Care Tips',
                content: {
                    heading: 'Roof Care Tips',
                    subheading: 'Get seasonal maintenance tips and exclusive offers.'
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'contact-form',
                title: 'Contact',
                content: {
                    heading: 'Get a Free Estimate',
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'footer',
                content: {
                    copyright: '© 2024 Summit Roofing LLC',
                    links: [
                        { label: 'License #12345', href: '#' },
                        { label: 'Privacy', href: '#' },
                        { label: 'Insurance Partners', href: '#' },
                        { label: 'Careers', href: '#' }
                    ]
                },
                styles: { padding: '3rem 2rem', backgroundColor: '#020617', color: '#94a3b8' }
            }
        ]
    },

    // 15. GreenLeaf Landscaping
    '15': {
        id: '15',
        name: 'GreenLeaf Landscaping',
        description: 'Lawn care and landscaping',
        category: 'business',
        settings: {
            ...commonSettings,
            seoTitle: 'GreenLeaf - Your Garden Experts',
            accentColor: '#16a34a', // Green 600
            fontFamily: 'Lato, sans-serif',
            backgroundColor: '#f0fdf4'
        },
        sections: [
            {
                id: uuid(),
                type: 'navbar',
                content: {
                    logoText: 'GreenLeaf',
                    links: [
                        { label: 'Maintenance', href: '#' },
                        { label: 'Design', href: '#' },
                        { label: 'Gallery', href: '#' },
                        { label: 'About', href: '#about' },
                        { label: 'Contact', href: '#contact' }
                    ],
                    ctaText: 'Book Service'
                },
                styles: { padding: '1.5rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'hero',
                content: {
                    heading: 'Your Personal Oasis',
                    subheading: 'Sustainable landscaping and lawn care for a greener tomorrow. We create outdoor spaces that inspire and rejuvenate.',
                    ctaText: 'View Our Work',
                    image: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&q=80&w=2000'
                },
                styles: { padding: '8rem 2rem', textAlign: 'center', backgroundColor: '#14532d', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'text',
                title: 'About Us',
                content: {
                    heading: 'Your Trusted Landscape Partner',
                    text: 'For over 15 years, GreenLeaf has been transforming ordinary yards into extraordinary outdoor spaces. Our team of certified horticulturists and landscape designers are passionate about creating beautiful, sustainable environments that enhance your property value and quality of life.'
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'features',
                content: {
                    heading: 'Complete Care',
                    features: [
                        { title: 'Lawn Mowing', description: 'Regular maintenance schedules using eco-friendly equipment.', icon: 'Sun' },
                        { title: 'Tree Trimming', description: 'Keep your trees healthy and enhance your property\'s beauty.', icon: 'Wind' },
                        { title: 'Hardscaping', description: 'Patios, walkways, and walls built to last for years.', icon: 'Layers' },
                        { title: 'Irrigation', description: 'Smart water solutions that conserve while keeping your landscape thriving.', icon: 'Droplets' },
                        { title: 'Landscape Design', description: 'Custom designs tailored to your property and lifestyle.', icon: 'Pencil' },
                        { title: 'Seasonal Cleanup', description: 'Spring and fall cleanups to prepare your yard for the changing seasons.', icon: 'Rake' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'pricing',
                title: 'Service Plans',
                content: {
                    heading: 'Flexible Service Plans',
                    plans: [
                        { name: 'Basic Care', price: '$75', period: '/month', features: ['Weekly Mowing', 'Edging', 'Seasonal Cleanup'] },
                        { name: 'Premium Care', price: '$150', period: '/month', features: ['Weekly Mowing', 'Fertilization', 'Weed Control', 'Seasonal Cleanup'], popular: true },
                        { name: 'Complete Care', price: '$250', period: '/month', features: ['All Premium Features', 'Irrigation Maintenance', 'Tree Care', '24/7 Support'] }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f0fdf4' }
            },
            {
                id: uuid(),
                type: 'testimonials',
                title: 'Client Love',
                content: {
                    heading: 'Happy Neighbors',
                    quotes: [
                        { text: 'GreenLeaf transformed our backyard into a paradise. We love spending time outside now.', author: 'Karen W.', role: 'Homeowner for 2 years' },
                        { text: 'Reliable, affordable, and excellent work. Our lawn has never looked better.', author: 'Tom H.', role: 'Commercial Client' },
                        { text: 'The design team listened to our vision and exceeded our expectations. Outstanding work!', author: 'Sarah L.', role: 'Residential Client' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'gallery',
                content: {
                    title: 'Our Recent Transformations',
                    images: [
                        'https://images.unsplash.com/photo-1592595896555-28e62963c6a9?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1613539116843-dc95589999a0?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1584463699745-d86f91667d40?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1592595896555-28e62963c6a9?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1613539116843-dc95589999a0?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1584463699745-d86f91667d40?auto=format&fit=crop&q=80&w=800'
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f0fdf4' }
            },
            {
                id: uuid(),
                type: 'team',
                title: 'Our Team',
                content: {
                    heading: 'Certified Landscape Professionals',
                    team: [
                        { name: 'Emily Green', role: 'Lead Designer', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Tom Wilson', role: 'Horticulturist', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Lisa Chen', role: 'Project Manager', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'process',
                title: 'Our Process',
                content: {
                    heading: 'How We Work',
                    steps: [
                        { title: 'Consultation', description: 'We visit your property to understand your needs and vision.', icon: 'MessageSquare' },
                        { title: 'Design', description: 'Our designers create a custom plan for your space.', icon: 'Pencil' },
                        { title: 'Installation', description: 'Our skilled team brings the design to life.', icon: 'Hammer' },
                        { title: 'Maintenance', description: 'Ongoing care to keep your landscape beautiful.', icon: 'Leaf' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f0fdf4' }
            },
            {
                id: uuid(),
                type: 'location',
                content: {
                    heading: 'Service Areas',
                    address: '100 Garden Way, Springville',
                    hours: 'Mon-Sat: 8am - 6pm',
                    serviceAreas: ['Springville', 'Greenwood', 'Maplewood', 'Riverside', 'Hillside']
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#166534', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'stats',
                title: 'Our Track Record',
                content: {
                    stats: [
                        { value: '500+', label: 'Happy Clients' },
                        { value: '15+', label: 'Years Experience' },
                        { value: '100%', label: 'Satisfaction Guarantee' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#14532d', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'newsletter',
                title: 'Seasonal Tips',
                content: {
                    heading: 'Gardening Tips',
                    subheading: 'Get seasonal advice for your lawn and garden.'
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'contact-form',
                title: 'Contact',
                content: {
                    heading: 'Schedule Your Service',
                    subheading: 'Get a free quote for your lawn care needs.'
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#f0fdf4' }
            },
            {
                id: uuid(),
                type: 'footer',
                content: {
                    copyright: '© 2024 GreenLeaf Landscaping',
                    links: [
                        { label: 'Privacy', href: '#' },
                        { label: 'Careers', href: '#' },
                        { label: 'Gallery', href: '#' },
                        { label: 'Maintenance Plans', href: '#' }
                    ]
                },
                styles: { padding: '3rem 2rem', backgroundColor: '#052e16', color: '#a7f3d0' }
            }
        ]
    },

    // 16. Sparkle Cleaners
    '16': {
        id: '16',
        name: 'Sparkle Cleaners',
        description: 'Home and office cleaning',
        category: 'business',
        settings: {
            ...commonSettings,
            seoTitle: 'Sparkle - Spotless Cleaning',
            accentColor: '#06b6d4', // Cyan
            fontFamily: 'Open Sans, sans-serif',
            backgroundColor: '#ecfeff'
        },
        sections: [
            {
                id: uuid(),
                type: 'navbar',
                content: {
                    logoText: 'Sparkle*',
                    links: [
                        { label: 'Homes', href: '#' },
                        { label: 'Offices', href: '#' },
                        { label: 'Deep Clean', href: '#' },
                        { label: 'Move-In/Out', href: '#move' },
                        { label: 'About', href: '#about' }
                    ],
                    ctaText: 'Book Now'
                },
                styles: { padding: '1rem 2rem', backgroundColor: '#fff', customCSS: 'box-shadow: 0 2px 4px rgba(0,0,0,0.05);' }
            },
            {
                id: uuid(),
                type: 'hero',
                content: {
                    heading: 'Come Home to Clean',
                    subheading: 'Eco-friendly cleaning services that make your home shine. We use only the safest, most effective products.',
                    ctaText: 'Schedule Cleaning',
                    image: 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?auto=format&fit=crop&q=80&w=2000'
                },
                styles: { padding: '6rem 2rem', textAlign: 'center', backgroundColor: '#ecfeff', color: '#0e7490' }
            },
            {
                id: uuid(),
                type: 'text',
                title: 'About Us',
                content: {
                    heading: 'Your Trusted Cleaning Partner',
                    text: 'For over 10 years, Sparkle Cleaners has been bringing spotless cleanliness to homes and offices across the city. Our team of professional cleaners are background-checked, trained, and dedicated to providing exceptional service that exceeds your expectations.'
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'features',
                content: {
                    heading: 'Our Services',
                    features: [
                        { title: 'Regular Cleaning', description: 'Weekly and bi-weekly cleaning to maintain your space.', icon: 'Broom' },
                        { title: 'Deep Cleaning', description: 'Thorough cleaning for move-in/out or seasonal refresh.', icon: 'Sparkles' },
                        { title: 'Office Cleaning', description: 'Professional office spaces kept pristine.', icon: 'Building2' },
                        { title: 'Move-In/Out Cleaning', description: 'Complete cleaning before or after your move.', icon: 'Move' },
                        { title: 'Eco-Friendly Options', description: 'Green cleaning products safe for families and pets.', icon: 'Leaf' },
                        { title: 'Specialty Cleaning', description: 'Carpet cleaning, window cleaning, and more.', icon: 'SprayCan' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'pricing',
                title: 'Service Packages',
                content: {
                    heading: 'Flexible Cleaning Plans',
                    plans: [
                        { name: 'Studio', price: '$89', period: '/clean', features: ['1 Bathroom', 'Basic Dusting', 'Vacuuming', 'Kitchen Wipe'] },
                        { name: '1 Bedroom', price: '$129', period: '/clean', features: ['1 Bathroom', 'Full Cleaning', 'Kitchen', 'Floors'], popular: true },
                        { name: '2 Bedroom', price: '$169', period: '/clean', features: ['2 Bathroom', 'Full Cleaning', 'Kitchen', 'Floors'] },
                        { name: '3 Bedroom', price: '$229', period: '/clean', features: ['3 Bathroom', 'Full Cleaning', 'Kitchen', 'Floors'] }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ecfeff' }
            },
            {
                id: uuid(),
                type: 'testimonials',
                title: 'Happy Homes',
                content: {
                    heading: 'What Our Clients Say',
                    quotes: [
                        { text: 'Sparkle makes my home feel brand new every time. The attention to detail is incredible.', author: 'Jessica T.', role: 'Homeowner for 3 years' },
                        { text: 'Professional, reliable, and affordable. I never have to worry about my office being clean.', author: 'Mark R.', role: 'Business Owner' },
                        { text: 'The deep cleaning service was exactly what we needed after moving. Spotless from top to bottom!', author: 'Sarah L.', role: 'New Homeowner' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'team',
                title: 'Our Cleaning Team',
                content: {
                    heading: 'Professional Cleaners',
                    team: [
                        { name: 'Anna Smith', role: 'Lead Cleaner', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Mike Johnson', role: 'Office Specialist', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
                        { name: 'Lisa Brown', role: 'Deep Cleaning Expert', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ecfeff' }
            },
            {
                id: uuid(),
                type: 'process',
                title: 'Our Cleaning Process',
                content: {
                    heading: 'How We Clean',
                    steps: [
                        { title: 'Consultation', description: 'We discuss your specific cleaning needs and preferences.', icon: 'MessageSquare' },
                        { title: 'Custom Plan', description: 'We create a tailored cleaning plan for your space.', icon: 'Pencil' },
                        { title: 'Professional Cleaning', description: 'Our trained team cleans using eco-friendly products.', icon: 'Broom' },
                        { title: 'Quality Check', description: 'We ensure every detail meets our high standards.', icon: 'CheckCircle' }
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'gallery',
                title: 'Before & After',
                content: {
                    title: 'Our Transformations',
                    images: [
                        'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1560184897-db442b558c36?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1581578731548-c64695cc6954?auto=format&fit=crop&q=80&w=800'
                    ]
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ecfeff' }
            },
            {
                id: uuid(),
                type: 'cta',
                title: 'Ready for a Spotless Home?',
                content: {
                    heading: 'Ready for a Spotless Home?',
                    subheading: 'Book your cleaning service today and experience the Sparkle difference.',
                    buttonText: 'Book Your Cleaning'
                },
                styles: { padding: '6rem 2rem', textAlign: 'center', backgroundColor: '#06b6d4', color: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'newsletter',
                title: 'Cleaning Tips',
                content: {
                    heading: 'Home Care Tips',
                    subheading: 'Get cleaning tips and special offers delivered to your inbox.'
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'stats',
                title: 'Our Impact',
                content: {
                    stats: [
                        { value: '10k+', label: 'Cleanings Completed' },
                        { value: '98%', label: 'Customer Satisfaction' },
                        { value: '10+', label: 'Years of Excellence' }
                    ]
                },
                styles: { padding: '4rem 2rem', backgroundColor: '#ecfeff', color: '#0e7490' }
            },
            {
                id: uuid(),
                type: 'contact-form',
                title: 'Contact',
                content: {
                    heading: 'Get a Free Quote',
                    subheading: 'Tell us about your cleaning needs and we\'ll provide a custom quote.'
                },
                styles: { padding: '6rem 2rem', backgroundColor: '#ffffff' }
            },
            {
                id: uuid(),
                type: 'footer',
                content: {
                    copyright: '© 2024 Sparkle Cleaners',
                    links: [
                        { label: 'Privacy Policy', href: '#' },
                        { label: 'Terms of Service', href: '#' },
                        { label: 'Careers', href: '#' },
                        { label: 'Service Areas', href: '#' }
                    ]
                },
                styles: { padding: '3rem 2rem', backgroundColor: '#0e7490', color: '#ffffff' }
            }
        ]
    }
};

