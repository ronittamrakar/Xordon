import React, { useState, useCallback, useEffect } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter, useDraggable, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSensor, PointerSensor, useSensors } from '@dnd-kit/core';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SectionRenderer } from './SectionRenderer';
import { StyleInspector } from './StyleInspector';
import { LandingPageSection, SectionStyles, PageSettings } from '@/lib/landingPagesApi';
import { landingPagesApi } from '@/lib/landingPagesApi';
import { GripVertical, Plus, Eye, Save, Settings, Layout, Type, Image, Star, DollarSign, HelpCircle, MessageSquare, Phone, Archive, Users, Briefcase, ListOrdered, Grid3X3, PlayCircle, Mail, BarChart3, Quote, Layers, Menu, Home, Award, Clock, Code, Zap, MapPin, Calendar, FileTextIcon, Globe, Shield, CheckCircle2, Target, ChevronLeft, ChevronRight, PanelLeft, PanelRight } from 'lucide-react';

interface VisualLandingBuilderProps {
  initialSections?: LandingPageSection[];
  initialSettings?: PageSettings;
  pageId?: string;
  onSave?: (data: { sections: LandingPageSection[]; settings: PageSettings }) => void;
  initialPresetId?: HomeServicesPresetId;
}

const sectionTemplates = [
  { type: 'hero', icon: Layout, label: 'Hero', title: 'Welcome to Our Landing Page', subtitle: 'Transform your ideas into reality', color: 'bg-blue-500' },
  { type: 'features', icon: Star, label: 'Features', title: 'Why Choose Us', subtitle: 'Discover our amazing features', color: 'bg-yellow-500' },
  { type: 'testimonials', icon: Quote, label: 'Testimonials', title: 'What Our Customers Say', subtitle: 'Real stories from real customers', color: 'bg-purple-500' },
  { type: 'pricing', icon: DollarSign, label: 'Pricing', title: 'Simple Pricing', subtitle: 'Choose the perfect plan for you', color: 'bg-green-500' },
  { type: 'faq', icon: HelpCircle, label: 'FAQ', title: 'Frequently Asked Questions', subtitle: 'Get answers to common questions', color: 'bg-orange-500' },
  { type: 'form', icon: Type, label: 'Contact Form', title: 'Get in Touch', subtitle: 'Send us a message', color: 'bg-indigo-500' },
  { type: 'cta', icon: Phone, label: 'Call to Action', title: 'Ready to Get Started?', subtitle: 'Join thousands of satisfied customers', color: 'bg-red-500' },
  { type: 'gallery', icon: Image, label: 'Gallery', title: 'Our Work', subtitle: 'See what we can do', color: 'bg-pink-500' },
  { type: 'stats', icon: BarChart3, label: 'Statistics', title: 'Our Numbers', subtitle: 'Impressive results speak for themselves', color: 'bg-cyan-500' },
  { type: 'team', icon: Users, label: 'Team', title: 'Meet Our Team', subtitle: 'The people behind your success', color: 'bg-teal-500' },
  { type: 'services', icon: Briefcase, label: 'Services', title: 'Our Services', subtitle: 'Comprehensive solutions for your needs', color: 'bg-amber-500' },
  { type: 'process', icon: ListOrdered, label: 'Process', title: 'How It Works', subtitle: 'Simple steps to get started', color: 'bg-lime-500' },
  { type: 'testimonials-grid', icon: Grid3X3, label: 'Reviews Grid', title: 'Customer Success Stories', subtitle: 'Hear from our happy clients', color: 'bg-violet-500' },
  { type: 'video', icon: PlayCircle, label: 'Video', title: 'Watch Our Story', subtitle: 'See us in action', color: 'bg-rose-500' },
  { type: 'newsletter', icon: Mail, label: 'Newsletter', title: 'Stay Updated', subtitle: 'Get the latest news and updates', color: 'bg-emerald-500' },
  { type: 'header', icon: Menu, label: 'Header', title: 'Navigation', subtitle: 'Site navigation and branding', color: 'bg-slate-500' },
  { type: 'footer', icon: Home, label: 'Footer', title: 'Footer', subtitle: 'Links and contact information', color: 'bg-gray-500' },
  { type: 'social-proof', icon: Shield, label: 'Social Proof', title: 'Trusted By', subtitle: 'Companies that trust us', color: 'bg-stone-500' },
  { type: 'timeline', icon: Clock, label: 'Timeline', title: 'Our Journey', subtitle: 'Key milestones and achievements', color: 'bg-zinc-500' },
  { type: 'comparison', icon: CheckCircle2, label: 'Comparison', title: 'Feature Comparison', subtitle: 'Compare our plans side by side', color: 'bg-neutral-500' },
  { type: 'tabs', icon: Layers, label: 'Tabs', title: 'Product Details', subtitle: 'Organized content in tabs', color: 'bg-sky-500' },
  { type: 'accordion', icon: Archive, label: 'Accordion', title: 'More Information', subtitle: 'Expandable content sections', color: 'bg-fuchsia-500' },
  { type: 'map', icon: MapPin, label: 'Map', title: 'Find Us', subtitle: 'Our location and contact details', color: 'bg-slate-600' },
  { type: 'countdown', icon: Calendar, label: 'Countdown', title: 'Coming Soon', subtitle: 'Launch countdown timer', color: 'bg-orange-600' },
  { type: 'code', icon: Code, label: 'Code Snippet', title: 'Example Code', subtitle: 'Code examples and snippets', color: 'bg-gray-600' },
  { type: 'quote', icon: Quote, label: 'Big Quote', title: 'Inspiring Words', subtitle: 'Highlight important messages', color: 'bg-indigo-600' },
  { type: 'badge', icon: Award, label: 'Badge', title: 'Achievements', subtitle: 'Showcase awards and certifications', color: 'bg-yellow-600' },
  { type: 'contact-info', icon: Phone, label: 'Contact Info', title: 'Contact Details', subtitle: 'How to reach us', color: 'bg-green-600' },
  { type: 'blog-preview', icon: FileTextIcon, label: 'Blog Preview', title: 'Latest Articles', subtitle: 'Recent blog posts and updates', color: 'bg-purple-600' },
  { type: 'portfolio', icon: Globe, label: 'Portfolio', title: 'Our Portfolio', subtitle: 'Showcase our best work', color: 'bg-pink-600' },
  { type: 'benefits', icon: Target, label: 'Benefits', title: 'Key Benefits', subtitle: 'What you get with our solution', color: 'bg-cyan-600' },
];

const createSectionContent = (type: string) => {
  switch (type) {
    case 'hero':
      return { 
        ctaText: 'Get Started',
        ctaLink: '#contact',
        backgroundImage: '',
        showVideo: false,
        videoUrl: ''
      };
    case 'features':
      return {
        items: [
          { title: 'Feature 1', desc: 'Description of feature 1', icon: 'Star' },
          { title: 'Feature 2', desc: 'Description of feature 2', icon: 'Shield' },
          { title: 'Feature 3', desc: 'Description of feature 3', icon: 'Zap' },
          { title: 'Feature 4', desc: 'Description of feature 4', icon: 'TrendingUp' },
        ],
        layout: 'grid',
        columns: 4
      };
    case 'testimonials':
      return {
        quotes: [
          { text: 'Amazing service! Highly recommended to everyone.', name: 'John Doe', role: 'CEO, Company Inc', rating: 5, avatar: '' },
          { text: 'Professional team and excellent results. Will definitely work with them again.', name: 'Jane Smith', role: 'Marketing Director', rating: 5, avatar: '' },
          { text: 'Outstanding quality and attention to detail. Exceeded our expectations!', name: 'Mike Johnson', role: 'Product Manager', rating: 5, avatar: '' },
        ],
        showRatings: true,
        layout: 'carousel'
      };
    case 'pricing':
      return {
        plans: [
          { 
            name: 'Starter', 
            price: '$9', 
            period: '/month',
            features: ['Feature 1', 'Feature 2', 'Feature 3'],
            highlighted: false,
            ctaText: 'Get Started'
          },
          { 
            name: 'Pro', 
            price: '$29', 
            period: '/month',
            features: ['All Starter features', 'Feature 4', 'Feature 5', 'Priority Support'],
            highlighted: true,
            ctaText: 'Get Started'
          },
          { 
            name: 'Enterprise', 
            price: '$99', 
            period: '/month',
            features: ['All Pro features', 'Custom Integration', 'Dedicated Support', 'SLA Guarantee'],
            highlighted: false,
            ctaText: 'Contact Sales'
          },
        ],
        layout: 'cards'
      };
    case 'faq':
      return {
        faqs: [
          { q: 'What is your service and how does it work?', a: 'Our service provides comprehensive solutions for your business needs. We use cutting-edge technology and proven methodologies to deliver exceptional results.' },
          { q: 'How do I get started with your service?', a: 'Getting started is easy! Simply sign up for a free trial, choose your plan, and follow our step-by-step onboarding process. Our team is here to help you every step of the way.' },
          { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and bank transfers. Enterprise customers can also arrange for invoicing.' },
          { q: 'Can I cancel my subscription anytime?', a: 'Yes, you can cancel your subscription at any time. No questions asked and no hidden fees.' },
        ],
        layout: 'accordion',
        showSearch: false
      };
    case 'form':
      return {
        title: 'Contact Us',
        subtitle: 'We would love to hear from you',
        fields: [
          { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your full name' },
          { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'Enter your email' },
          { name: 'phone', label: 'Phone Number', type: 'tel', required: false, placeholder: 'Enter your phone number' },
          { name: 'company', label: 'Company', type: 'text', required: false, placeholder: 'Enter your company name' },
          { name: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'Tell us about your project' },
        ],
        button: 'Send Message',
        layout: 'vertical',
        showLabels: true
      };
    case 'cta':
      return {
        title: 'Ready to Transform Your Business?',
        subtitle: 'Join thousands of satisfied customers who have already made the switch',
        button: 'Get Started Now',
        buttonLink: '#contact',
        secondaryButton: 'Learn More',
        secondaryButtonLink: '#features',
        backgroundImage: '',
        showTrustBadges: true
      };
    case 'gallery':
      return {
        title: 'Our Recent Work',
        subtitle: 'Explore our portfolio of successful projects',
        images: [
          { url: '', caption: 'Project 1 - E-commerce Platform', category: 'Web Development' },
          { url: '', caption: 'Project 2 - Mobile App', category: 'Mobile Development' },
          { url: '', caption: 'Project 3 - Brand Identity', category: 'Branding' },
          { url: '', caption: 'Project 4 - Marketing Campaign', category: 'Marketing' },
          { url: '', caption: 'Project 5 - UI/UX Design', category: 'Design' },
          { url: '', caption: 'Project 6 - Data Analytics', category: 'Analytics' },
        ],
        layout: 'grid',
        columns: 3,
        showFilters: true,
        enableLightbox: true
      };
    case 'stats':
      return {
        title: 'Our Achievements',
        subtitle: 'Numbers that speak for themselves',
        stats: [
          { number: '500+', label: 'Happy Clients', prefix: '', suffix: '' },
          { number: '1000+', label: 'Projects Completed', prefix: '', suffix: '' },
          { number: '99%', label: 'Client Satisfaction', prefix: '', suffix: '' },
          { number: '24/7', label: 'Support Available', prefix: '', suffix: '' },
        ],
        layout: 'grid',
        showAnimations: true,
        counterAnimation: true
      };
    case 'team':
      return {
        title: 'Meet Our Amazing Team',
        subtitle: 'The talented people behind your success',
        members: [
          { name: 'John Doe', role: 'CEO & Founder', bio: 'Visionary leader with 15+ years of experience', image: '', social: { linkedin: '', twitter: '', email: '' } },
          { name: 'Jane Smith', role: 'CTO', bio: 'Tech expert passionate about innovation', image: '', social: { linkedin: '', twitter: '', email: '' } },
          { name: 'Mike Johnson', role: 'Head of Design', bio: 'Creative mind behind our beautiful designs', image: '', social: { linkedin: '', twitter: '', email: '' } },
          { name: 'Sarah Wilson', role: 'Marketing Director', bio: 'Growth hacker and marketing strategist', image: '', social: { linkedin: '', twitter: '', email: '' } },
        ],
        layout: 'grid',
        columns: 4,
        showSocialLinks: true
      };
    case 'services':
      return {
        title: 'Our Services',
        subtitle: 'Comprehensive solutions tailored to your needs',
        services: [
          { title: 'Web Development', desc: 'Custom websites and web applications built with modern technologies', icon: 'Code', price: 'Starting at $999' },
          { title: 'Mobile Development', desc: 'Native and cross-platform mobile apps for iOS and Android', icon: 'Smartphone', price: 'Starting at $1999' },
          { title: 'UI/UX Design', desc: 'Beautiful and intuitive designs that users love', icon: 'Palette', price: 'Starting at $499' },
          { title: 'Digital Marketing', desc: 'Data-driven marketing strategies to grow your business', icon: 'TrendingUp', price: 'Starting at $799' },
          { title: 'SEO Optimization', desc: 'Improve your search engine rankings and organic traffic', icon: 'Search', price: 'Starting at $599' },
          { title: 'Content Creation', desc: 'Engaging content that resonates with your audience', icon: 'FileTextIcon', price: 'Starting at $399' },
        ],
        layout: 'grid',
        columns: 3,
        showPricing: true
      };
    case 'process':
      return {
        title: 'How It Works',
        subtitle: 'Simple steps to get started with our service',
        steps: [
          { number: '1', title: 'Discovery', desc: 'We understand your requirements and goals', icon: 'Search' },
          { number: '2', title: 'Planning', desc: 'We create a detailed roadmap for your project', icon: 'Clipboard' },
          { number: '3', title: 'Development', desc: 'Our team builds your solution with expertise', icon: 'Code' },
          { number: '4', title: 'Testing', desc: 'We ensure everything works perfectly', icon: 'CheckCircle' },
          { number: '5', title: 'Launch', desc: 'We deploy your solution to the world', icon: 'Rocket' },
          { number: '6', title: 'Support', desc: 'We provide ongoing support and maintenance', icon: 'Headphones' },
        ],
        layout: 'horizontal',
        showNumbers: true,
        showIcons: true
      };
    case 'testimonials-grid':
      return {
        title: 'What Our Clients Say',
        subtitle: 'Real feedback from real customers',
        testimonials: [
          { text: 'Exceptional service and results beyond expectations!', name: 'Alex Chen', company: 'Tech Startup', rating: 5, image: '' },
          { text: 'Professional team that delivers on time and budget.', name: 'Maria Garcia', company: 'E-commerce Store', rating: 5, image: '' },
          { text: 'Innovative solutions that helped us grow 300%!', name: 'Robert Taylor', company: 'SaaS Company', rating: 5, image: '' },
          { text: 'Best investment we made for our business.', name: 'Lisa Anderson', company: 'Retail Business', rating: 5, image: '' },
          { text: 'Outstanding communication and project management.', name: 'David Kim', company: 'Marketing Agency', rating: 5, image: '' },
          { text: 'Highly recommend for any business looking to grow.', name: 'Emma Wilson', company: 'Consulting Firm', rating: 5, image: '' },
        ],
        layout: 'grid',
        columns: 3,
        showCompany: true,
        showImages: true
      };
    case 'video':
      return {
        title: 'Watch Our Story',
        subtitle: 'See how we help businesses like yours succeed',
        videoUrl: '',
        thumbnail: '',
        autoplay: false,
        controls: true,
        caption: 'Learn more about our journey and mission'
      };
    case 'newsletter':
      return {
        title: 'Stay in the Loop',
        subtitle: 'Get exclusive content and special offers delivered to your inbox',
        placeholder: 'Enter your email address',
        button: 'Subscribe Now',
        description: 'Join 10,000+ subscribers. No spam, unsubscribe anytime.',
        showPrivacyNote: true,
        layout: 'centered'
      };
    case 'header':
      return {
        logo: 'Company Logo',
        navigation: [
          { label: 'Home', link: '#home' },
          { label: 'Features', link: '#features' },
          { label: 'Pricing', link: '#pricing' },
          { label: 'Contact', link: '#contact' },
        ],
        ctaButton: 'Get Started',
        ctaLink: '#contact',
        sticky: true,
        transparent: false
      };
    case 'footer':
      return {
        logo: 'Company Logo',
        description: 'Building amazing solutions for modern businesses.',
        links: [
          { title: 'Company', items: ['About', 'Careers', 'Press', 'Blog'] },
          { title: 'Product', items: ['Features', 'Pricing', 'Security', 'Updates'] },
          { title: 'Support', items: ['Help Center', 'Contact Us', 'Status', 'API Docs'] },
          { title: 'Legal', items: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
        ],
        social: {
          twitter: '',
          linkedin: '',
          facebook: '',
          instagram: ''
        },
        newsletter: true,
        copyright: '© 2024 Company Name. All rights reserved.'
      };
    case 'social-proof':
      return {
        title: 'Trusted by Leading Companies',
        subtitle: 'Join thousands of satisfied customers',
        logos: [
          { name: 'Company A', url: '' },
          { name: 'Company B', url: '' },
          { name: 'Company C', url: '' },
          { name: 'Company D', url: '' },
          { name: 'Company E', url: '' },
          { name: 'Company F', url: '' },
        ],
        layout: 'grid',
        showText: true
      };
    case 'timeline':
      return {
        title: 'Our Journey',
        subtitle: 'Key milestones in our growth',
        events: [
          { date: '2020', title: 'Company Founded', desc: 'Started with a vision to revolutionize the industry', icon: 'Star' },
          { date: '2021', title: 'First Major Client', desc: 'Landed our first enterprise customer', icon: 'Users' },
          { date: '2022', title: 'Product Launch', desc: 'Released our flagship product to the market', icon: 'Rocket' },
          { date: '2023', title: 'Global Expansion', desc: 'Opened offices in 5 new countries', icon: 'Globe' },
          { date: '2024', title: 'Series A Funding', desc: 'Raised $10M to accelerate growth', icon: 'DollarSign' },
        ],
        layout: 'vertical',
        showIcons: true
      };
    case 'comparison':
      return {
        title: 'Choose Your Perfect Plan',
        subtitle: 'Compare features side by side',
        features: [
          { name: 'Basic Features', starter: true, pro: true, enterprise: true },
          { name: 'Advanced Analytics', starter: false, pro: true, enterprise: true },
          { name: 'Custom Integrations', starter: false, pro: false, enterprise: true },
          { name: 'Priority Support', starter: false, pro: true, enterprise: true },
          { name: 'White-label Solution', starter: false, pro: false, enterprise: true },
          { name: 'Dedicated Account Manager', starter: false, pro: false, enterprise: true },
        ],
        plans: ['Starter', 'Pro', 'Enterprise']
      };
    case 'tabs':
      return {
        title: 'Everything You Need to Know',
        subtitle: 'Detailed information organized for easy browsing',
        tabs: [
          {
            title: 'Overview',
            content: 'Get a comprehensive overview of our platform and its capabilities.',
            icon: 'Home'
          },
          {
            title: 'Features',
            content: 'Explore all the powerful features that make our platform unique.',
            icon: 'Star'
          },
          {
            title: 'Pricing',
            content: 'Find the perfect plan for your needs and budget.',
            icon: 'DollarSign'
          },
          {
            title: 'Support',
            content: 'Learn about our comprehensive support and resources.',
            icon: 'HelpCircle'
          },
        ],
        layout: 'horizontal',
        showIcons: true
      };
    case 'accordion':
      return {
        title: 'Frequently Asked Questions',
        subtitle: 'Everything you need to know about our service',
        items: [
          {
            title: 'What makes our service different?',
            content: 'Our unique approach combines cutting-edge technology with personalized service to deliver exceptional results.'
          },
          {
            title: 'How long does implementation take?',
            content: 'Most implementations are completed within 2-4 weeks, depending on your specific requirements.'
          },
          {
            title: 'Do you offer training?',
            content: 'Yes, we provide comprehensive training for your team, including onboarding sessions and ongoing support.'
          },
          {
            title: 'What kind of support do you provide?',
            content: 'We offer 24/7 technical support, regular check-ins, and dedicated account management.'
          },
        ],
        allowMultiple: false,
        showIcons: true
      };
    case 'map':
      return {
        title: 'Visit Our Office',
        subtitle: 'Come see us in person',
        address: '123 Business Street, Suite 100, City, State 12345',
        phone: '+1 (555) 123-4567',
        email: 'hello@company.com',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        zoom: 15,
        showMarker: true,
        showDirections: true
      };
    case 'countdown':
      return {
        title: 'Launching Soon',
        subtitle: 'Our new product is almost ready',
        targetDate: '2024-12-31T23:59:59',
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: true,
        message: 'Stay tuned for something amazing!'
      };
    case 'code':
      return {
        title: 'Quick Start Example',
        subtitle: 'Get started in minutes with this simple example',
        language: 'javascript',
        code: `// Get started with our API
const client = new APIClient({
  apiKey: 'your-api-key'
});

// Make your first request
const result = await client.getData({
  endpoint: 'users',
  limit: 10
});

console.log(result);`,
        theme: 'dark',
        showLineNumbers: true,
        copyButton: true
      };
    case 'quote':
      return {
        quote: '"This solution transformed our business operations and increased our productivity by 300%."',
        author: 'Jane Smith',
        role: 'CEO, TechCorp',
        company: 'TechCorp',
        image: '',
        layout: 'centered',
        showQuotationMarks: true
      };
    case 'badge':
      return {
        title: 'Awards & Certifications',
        subtitle: 'Recognition for excellence',
        badges: [
          { title: 'Best Innovation 2024', issuer: 'Tech Awards', image: '', year: '2024' },
          { title: 'ISO 27001 Certified', issuer: 'ISO', image: '', year: '2023' },
          { title: 'Top 10 SaaS Company', issuer: 'Industry Report', image: '', year: '2024' },
          { title: 'Customer Choice Award', issuer: 'Customer Reviews', image: '', year: '2023' },
        ],
        layout: 'grid',
        columns: 4
      };
    case 'contact-info':
      return {
        title: 'Get in Touch',
        subtitle: 'We\'d love to hear from you',
        info: [
          {
            type: 'address',
            title: 'Office Address',
            content: '123 Business Street, Suite 100\nCity, State 12345',
            icon: 'MapPin'
          },
          {
            type: 'phone',
            title: 'Phone',
            content: '+1 (555) 123-4567',
            icon: 'Phone'
          },
          {
            type: 'email',
            title: 'Email',
            content: 'hello@company.com',
            icon: 'Mail'
          },
          {
            type: 'hours',
            title: 'Business Hours',
            content: 'Monday - Friday: 9AM - 6PM\nSaturday: 10AM - 4PM\nSunday: Closed',
            icon: 'Clock'
          },
        ],
        layout: 'grid',
        columns: 2
      };
    case 'blog-preview':
      return {
        title: 'Latest Insights',
        subtitle: 'Stay updated with our latest thoughts and industry news',
        posts: [
          {
            title: 'The Future of SaaS: Trends to Watch in 2024',
            excerpt: 'Explore the emerging trends that will shape the SaaS industry this year.',
            date: '2024-01-15',
            readTime: '5 min read',
            category: 'Industry Trends',
            image: '',
            link: '#'
          },
          {
            title: 'Building Scalable Systems: Lessons Learned',
            excerpt: 'Key insights from scaling our platform to serve millions of users.',
            date: '2024-01-10',
            readTime: '8 min read',
            category: 'Engineering',
            image: '',
            link: '#'
          },
          {
            title: 'Customer Success Stories: How We Helped TechCorp Grow',
            excerpt: 'A detailed case study of how our solution transformed TechCorp\'s operations.',
            date: '2024-01-05',
            readTime: '6 min read',
            category: 'Case Studies',
            image: '',
            link: '#'
          },
        ],
        layout: 'grid',
        columns: 3,
        showCategories: true,
        showReadTime: true
      };
    case 'portfolio':
      return {
        title: 'Our Portfolio',
        subtitle: 'Showcasing our best work',
        projects: [
          {
            title: 'E-commerce Platform',
            description: 'Modern e-commerce solution with advanced analytics',
            category: 'Web Development',
            image: '',
            link: '#',
            technologies: ['React', 'Node.js', 'MongoDB']
          },
          {
            title: 'Mobile Banking App',
            description: 'Secure mobile banking application for iOS and Android',
            category: 'Mobile Development',
            image: '',
            link: '#',
            technologies: ['React Native', 'Firebase', 'Stripe']
          },
          {
            title: 'Brand Identity Design',
            description: 'Complete brand identity for a growing tech startup',
            category: 'Design',
            image: '',
            link: '#',
            technologies: ['Figma', 'Illustrator', 'Photoshop']
          },
        ],
        layout: 'grid',
        columns: 3,
        showFilters: true,
        categories: ['All', 'Web Development', 'Mobile Development', 'Design', 'Marketing']
      };
    case 'benefits':
      return {
        title: 'Why Choose Us',
        subtitle: 'The benefits that set us apart',
        benefits: [
          {
            title: 'Save Time',
            description: 'Automate repetitive tasks and focus on what matters most',
            icon: 'Clock',
            stats: '5 hours saved per week'
          },
          {
            title: 'Increase Revenue',
            description: 'Boost your sales with our proven conversion optimization',
            icon: 'DollarSign',
            stats: '35% revenue increase'
          },
          {
            title: 'Scale Effortlessly',
            description: 'Grow your business without worrying about technical limitations',
            icon: 'TrendingUp',
            stats: '10x growth capacity'
          },
          {
            title: 'Expert Support',
            description: 'Get help from our team of specialists whenever you need it',
            icon: 'Users',
            stats: '24/7 support'
          },
        ],
        layout: 'grid',
        columns: 2,
        showStats: true
      };
    default:
      return {};
  }
};

type HomeServicesPresetId = 'painting' | 'roofing' | 'cleaning' | 'home-services';

const createPresetSection = (
  type: LandingPageSection['type'],
  overrides: Partial<LandingPageSection> = {},
): LandingPageSection => {
  const template = sectionTemplates.find((t) => t.type === type);
  return {
    id: nanoid(),
    type,
    title: overrides.title ?? template?.title ?? '',
    subtitle: overrides.subtitle ?? template?.subtitle,
    content: overrides.content ?? createSectionContent(type),
    styles: {
      backgroundColor: '#ffffff',
      padding: '4rem 2rem',
      textAlign: 'center',
      ...(overrides.styles || {}),
    },
  } as LandingPageSection;
};

export const homeServicesPresets: Record<
  HomeServicesPresetId,
  {
    label: string;
    description: string;
    createSettings: () => PageSettings;
    createSections: () => LandingPageSection[];
  }
> = {
  painting: {
    label: 'Painting Lead Gen',
    description: 'Local painting services with gallery, reviews, and quote form.',
    createSettings: () => ({
      seoTitle: 'Professional Painting Services',
      seoDescription: 'Interior & exterior painting with free on-site estimates.',
      backgroundColor: '#f9fafb',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      accentColor: '#2563eb',
    }),
    createSections: () => [
      createPresetSection('header', {
        title: 'BrightCoat Painters',
        subtitle: 'Local interior & exterior painting experts',
        content: {
          logo: 'BrightCoat Painters',
          navigation: [
            { label: 'Home', link: '#top' },
            { label: 'Services', link: '#services' },
            { label: 'Gallery', link: '#gallery' },
            { label: 'Reviews', link: '#reviews' },
          ],
          ctaButton: 'Get Free Quote',
          ctaLink: '#quote',
          sticky: true,
          transparent: false,
        },
      }),
      createPresetSection('hero', {
        title: 'Transform Your Home With Professional Painting',
        subtitle: 'Fast, clean, and long-lasting results for every room and surface.',
        content: {
          ctaText: 'Get Free Painting Quote',
          ctaLink: '#quote',
          backgroundImage: '',
          showVideo: false,
          videoUrl: '',
        },
        styles: {
          backgroundColor: '#0f172a',
          textAlign: 'left',
        },
      }),
      createPresetSection('social-proof', {
        title: 'Trusted Local Painting Company',
        subtitle: 'Serving homeowners, offices, and retail spaces in your area.',
        content: {
          logos: [
            { name: 'Local HOA', url: '' },
            { name: 'Downtown Offices', url: '' },
            { name: 'Homeowners Assoc.', url: '' },
            { name: 'Property Managers', url: '' },
          ],
          layout: 'grid',
          showText: true,
        },
      }),
      createPresetSection('services', {
        title: 'Interior & Exterior Painting Services',
        subtitle: 'Everything you need for a fresh, durable finish.',
        content: {
          title: 'Painting Services',
          subtitle: 'High-quality prep, paint, and clean-up on every job.',
          services: [
            {
              title: 'Interior Painting',
              desc: 'Walls, ceilings, trim, doors, cabinets, and more.',
              icon: 'Brush',
              price: 'Free in-home estimate',
            },
            {
              title: 'Exterior Painting',
              desc: 'Siding, stucco, brick, and exterior trim protection.',
              icon: 'Home',
              price: 'Weather-resistant coatings',
            },
            {
              title: 'Commercial Painting',
              desc: 'Offices, retail, and multi-unit properties.',
              icon: 'Building',
              price: 'Flexible off-hours scheduling',
            },
            {
              title: 'Color Consultation',
              desc: 'Get expert help choosing colors and finishes.',
              icon: 'Palette',
              price: 'Included with most projects',
            },
          ],
          layout: 'grid',
          columns: 2,
          showPricing: true,
        },
      }),
      createPresetSection('gallery', {
        title: 'Recent Painting Projects',
        subtitle: 'Before & after transformations from homes like yours.',
        content: {
          title: 'Our Painting Work',
          subtitle: 'See the difference a professional paint job makes.',
          images: [
            { url: '', caption: 'Living room repaint', category: 'Interior' },
            { url: '', caption: 'Two-story exterior repaint', category: 'Exterior' },
            { url: '', caption: 'Kitchen cabinet refinishing', category: 'Cabinets' },
            { url: '', caption: 'Office space repaint', category: 'Commercial' },
          ],
          layout: 'grid',
          columns: 3,
          showFilters: true,
          enableLightbox: true,
        },
        styles: {
          backgroundColor: '#ffffff',
        },
      }),
      createPresetSection('testimonials', {
        title: 'Homeowners Love The Results',
        subtitle: 'Real reviews from recent painting projects.',
        content: {
          quotes: [
            {
              text: 'They finished our whole home in just a few days and left everything spotless.',
              name: 'Sarah K.',
              role: 'Homeowner',
              rating: 5,
              avatar: '',
            },
            {
              text: 'Great communication, on-time, and the exterior looks brand new.',
              name: 'David R.',
              role: 'Homeowner',
              rating: 5,
              avatar: '',
            },
            {
              text: 'BrightCoat handled our office repaint over a weekend with zero disruption.',
              name: 'Lena M.',
              role: 'Office Manager',
              rating: 5,
              avatar: '',
            },
          ],
          showRatings: true,
          layout: 'carousel',
        },
      }),
      createPresetSection('faq', {
        title: 'Painting FAQs',
        subtitle: 'Answers to common questions about prep, paint, and clean-up.',
        content: {
          faqs: [
            {
              q: 'How long does a typical interior project take?',
              a: 'Most interior repaints are completed in 1–3 days depending on the number of rooms.',
            },
            {
              q: 'Do you move and cover furniture?',
              a: 'Yes. We carefully move and cover furniture, protect floors, and put everything back when we finish.',
            },
            {
              q: 'What kind of paint do you use?',
              a: 'We use high-quality, low-VOC paints from top brands suitable for your surfaces and conditions.',
            },
            {
              q: 'Do you offer a warranty?',
              a: 'Yes, we back our work with a workmanship guarantee. Ask us about details for your project.',
            },
          ],
          layout: 'accordion',
          showSearch: false,
        },
      }),
      createPresetSection('form', {
        title: 'Request Your Free Painting Quote',
        subtitle: 'Tell us about your project and we will respond within one business day.',
        content: {
          title: 'Get Your Free Quote',
          subtitle: 'Share a few details and we will follow up to schedule a visit.',
          fields: [
            { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Jane Doe' },
            { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'you@example.com' },
            { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: 'Best number to reach you' },
            { name: 'address', label: 'Project Address', type: 'text', required: false, placeholder: 'Street, City' },
            { name: 'projectType', label: 'Project Type', type: 'text', required: false, placeholder: 'Interior, exterior, cabinets, etc.' },
            { name: 'details', label: 'Project Details', type: 'textarea', required: true, placeholder: 'Tell us about the rooms or areas you want painted' },
          ],
          button: 'Request Quote',
          layout: 'vertical',
          showLabels: true,
        },
        styles: {
          backgroundColor: '#eff6ff',
        },
      }),
      createPresetSection('contact-info', {
        title: 'Contact & Service Area',
        subtitle: 'We serve homes and businesses across your city and nearby suburbs.',
        content: {
          title: 'Contact & Hours',
          subtitle: 'Reach out by phone, email, or form.',
          info: [
            {
              type: 'phone',
              title: 'Phone',
              content: '(555) 123-4567',
              icon: 'Phone',
            },
            {
              type: 'email',
              title: 'Email',
              content: 'hello@brightcoatpainters.com',
              icon: 'Mail',
            },
            {
              type: 'address',
              title: 'Service Area',
              content: 'Serving Downtown, Westside, North Hills, and surrounding neighborhoods.',
              icon: 'MapPin',
            },
          ],
          layout: 'grid',
          columns: 2,
        },
      }),
      createPresetSection('footer', {
        content: {
          logo: 'BrightCoat Painters',
          description: 'Professional interior & exterior painting services for busy homeowners and businesses.',
          links: [
            { title: 'Company', items: ['About', 'Our Process', 'Reviews', 'Contact'] },
            { title: 'Services', items: ['Interior Painting', 'Exterior Painting', 'Commercial', 'Color Consultation'] },
            { title: 'Resources', items: ['Care Tips', 'FAQ', 'Blog'] },
          ],
          social: {
            twitter: '',
            linkedin: '',
            facebook: '',
            instagram: '',
          },
          newsletter: false,
          copyright: '© 2024 BrightCoat Painters. All rights reserved.',
        },
        styles: {
          backgroundColor: '#020617',
          textAlign: 'left',
        },
      }),
    ],
  },
  roofing: {
    label: 'Roofing & Restoration',
    description: 'Emergency repairs, roof replacements, and insurance help.',
    createSettings: () => ({
      seoTitle: 'Roof Repair & Replacement',
      seoDescription: 'Emergency roof repair, full replacements, and storm restoration.',
      backgroundColor: '#0b1120',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      accentColor: '#ea580c',
    }),
    createSections: () => [
      createPresetSection('header', {
        title: 'SafeTop Roofing',
        subtitle: '24/7 emergency roofing & storm damage repair',
        content: {
          logo: 'SafeTop Roofing',
          navigation: [
            { label: 'Home', link: '#top' },
            { label: 'Services', link: '#services' },
            { label: 'Process', link: '#process' },
            { label: 'Reviews', link: '#reviews' },
          ],
          ctaButton: 'Schedule Inspection',
          ctaLink: '#inspection',
          sticky: true,
          transparent: false,
        },
      }),
      createPresetSection('hero', {
        title: 'Need Roof Repair Or Full Replacement?',
        subtitle: 'Fast response after leaks or storms, with insurance-friendly documentation.',
        content: {
          ctaText: 'Schedule Roof Inspection',
          ctaLink: '#inspection',
          backgroundImage: '',
          showVideo: false,
          videoUrl: '',
        },
        styles: {
          backgroundColor: '#111827',
          textAlign: 'left',
        },
      }),
      createPresetSection('stats', {
        title: 'Roofing You Can Rely On',
        subtitle: 'Decades of experience and thousands of roofs serviced.',
        content: {
          title: 'By The Numbers',
          subtitle: 'Real results from SafeTop Roofing.',
          stats: [
            { number: '25+', label: 'Years of experience', prefix: '', suffix: '' },
            { number: '3,500+', label: 'Roofs repaired or replaced', prefix: '', suffix: '' },
            { number: '24/7', label: 'Emergency response', prefix: '', suffix: '' },
            { number: '50-year', label: 'Material warranties available', prefix: '', suffix: '' },
          ],
          layout: 'grid',
          showAnimations: true,
          counterAnimation: true,
        },
      }),
      createPresetSection('services', {
        title: 'Roofing & Storm Damage Services',
        subtitle: 'From temporary tarping to full roof replacement.',
        content: {
          title: 'Roofing Services',
          subtitle: 'All the support you need before and after a storm.',
          services: [
            {
              title: 'Roof Inspections',
              desc: 'Detailed leak and storm-damage inspections with photos.',
              icon: 'Search',
              price: 'Free for most homeowners',
            },
            {
              title: 'Roof Repairs',
              desc: 'Leak repair, shingle replacement, flashing and ventilation fixes.',
              icon: 'Wrench',
              price: 'Fast response repairs',
            },
            {
              title: 'Full Roof Replacement',
              desc: 'Complete tear-off and replacement with modern, energy-efficient materials.',
              icon: 'Home',
              price: 'Financing options available',
            },
            {
              title: 'Storm & Hail Claims',
              desc: 'Help working with your insurance adjuster and paperwork.',
              icon: 'Shield',
              price: 'We document everything for you',
            },
          ],
          layout: 'grid',
          columns: 2,
          showPricing: true,
        },
      }),
      createPresetSection('process', {
        title: 'How Our Roofing Process Works',
        subtitle: 'Clear steps from first call to final clean-up.',
        content: {
          title: 'Our Process',
          subtitle: 'So you know exactly what to expect.',
          steps: [
            { number: '1', title: 'Inspection', desc: 'We inspect the roof, attic, and exterior for damage.', icon: 'Search' },
            { number: '2', title: 'Estimate & Options', desc: 'You receive clear pricing and material options.', icon: 'FileTextIcon' },
            { number: '3', title: 'Schedule & Permits', desc: 'We handle permits, materials, and scheduling.', icon: 'Calendar' },
            { number: '4', title: 'Install & Clean-up', desc: 'Our crew completes the work and cleans your property.', icon: 'CheckCircle' },
          ],
          layout: 'horizontal',
          showNumbers: true,
          showIcons: true,
        },
      }),
      createPresetSection('testimonials-grid', {
        title: 'Storm Damage Success Stories',
        subtitle: 'Homeowners we helped after hail, wind, and leaks.',
        content: {
          title: 'What Our Roofing Clients Say',
          subtitle: 'Stories from homeowners who trusted SafeTop.',
          testimonials: [
            {
              text: 'After a hailstorm, they worked directly with our insurance and replaced our roof in two days.',
              name: 'Mark & Dana H.',
              company: 'Homeowner',
              rating: 5,
              image: '',
            },
            {
              text: 'They found the source of a stubborn leak and fixed it the same day.',
              name: 'Olivia P.',
              company: 'Homeowner',
              rating: 5,
              image: '',
            },
            {
              text: 'Crew was professional, on-time, and left our yard cleaner than when they arrived.',
              name: 'Khalid R.',
              company: 'Homeowner',
              rating: 5,
              image: '',
            },
          ],
          layout: 'grid',
          columns: 3,
          showCompany: true,
          showImages: false,
        },
      }),
      createPresetSection('faq', {
        title: 'Roofing & Insurance FAQs',
        subtitle: 'Coverage, warranties, timelines, and more.',
        content: {
          faqs: [
            {
              q: 'How quickly can you come out after a leak?',
              a: 'For emergency leaks we aim to respond the same day or within 24 hours.',
            },
            {
              q: 'Can you help with my insurance claim?',
              a: 'Yes. We provide documentation, photos, and work directly with your adjuster when possible.',
            },
            {
              q: 'What roofing materials do you install?',
              a: 'We install asphalt shingles, metal roofing, flat roofing systems, and more depending on your home.',
            },
            {
              q: 'Do you offer financing?',
              a: 'We partner with financing providers to help spread the cost of major projects.',
            },
          ],
          layout: 'accordion',
          showSearch: false,
        },
      }),
      createPresetSection('form', {
        title: 'Book Your Roof Inspection',
        subtitle: 'Tell us about your roof and we will schedule a visit.',
        content: {
          title: 'Schedule Roof Inspection',
          subtitle: 'Share a few details and we will reach out to confirm a time.',
          fields: [
            { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Jane Doe' },
            { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'you@example.com' },
            { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: 'Best number to reach you' },
            { name: 'address', label: 'Property Address', type: 'text', required: true, placeholder: 'Street, City' },
            { name: 'roofType', label: 'Roof Type (optional)', type: 'text', required: false, placeholder: 'Asphalt, metal, flat, etc.' },
            { name: 'issue', label: 'Issue or goal', type: 'textarea', required: true, placeholder: 'Leaks, storm damage, age of roof, etc.' },
          ],
          button: 'Request Inspection',
          layout: 'vertical',
          showLabels: true,
        },
        styles: {
          backgroundColor: '#f59e0b0d',
        },
      }),
      createPresetSection('contact-info', {
        title: 'Emergency Contact',
        subtitle: 'Call, email, or request emergency service online.',
        content: {
          title: 'Contact SafeTop Roofing',
          subtitle: 'Available 24/7 for emergency leaks and storm damage.',
          info: [
            {
              type: 'phone',
              title: 'Emergency Line',
              content: '(555) 987-6543',
              icon: 'Phone',
            },
            {
              type: 'email',
              title: 'Email',
              content: 'support@safetoproofing.com',
              icon: 'Mail',
            },
            {
              type: 'hours',
              title: 'Hours',
              content: 'Emergency calls: 24/7\nOffice: Mon–Fri, 8am–5pm',
              icon: 'Clock',
            },
          ],
          layout: 'grid',
          columns: 2,
        },
      }),
      createPresetSection('footer', {
        content: {
          logo: 'SafeTop Roofing',
          description: 'Roof repair, replacement, and storm restoration you can trust.',
          links: [
            { title: 'Company', items: ['About', 'Our Process', 'Reviews', 'Careers'] },
            { title: 'Services', items: ['Inspections', 'Repairs', 'Replacements', 'Storm Damage'] },
            { title: 'Resources', items: ['Roofing Guide', 'Financing', 'FAQ'] },
          ],
          social: {
            twitter: '',
            linkedin: '',
            facebook: '',
            instagram: '',
          },
          newsletter: false,
          copyright: '© 2024 SafeTop Roofing. All rights reserved.',
        },
      }),
    ],
  },
  cleaning: {
    label: 'Cleaning Services',
    description: 'Home, office, and Airbnb cleaning with packages and reviews.',
    createSettings: () => ({
      seoTitle: 'Home & Office Cleaning Services',
      seoDescription: 'Recurring and one-time cleaning, move-in/out, and Airbnb turnovers.',
      backgroundColor: '#ecfeff',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      accentColor: '#22c55e',
    }),
    createSections: () => [
      createPresetSection('header', {
        title: 'SparkleClean Pros',
        subtitle: 'Reliable home, office, and Airbnb cleaning',
        content: {
          logo: 'SparkleClean Pros',
          navigation: [
            { label: 'Home', link: '#top' },
            { label: 'Services', link: '#services' },
            { label: 'Pricing', link: '#pricing' },
            { label: 'Reviews', link: '#reviews' },
          ],
          ctaButton: 'Get Cleaning Quote',
          ctaLink: '#booking',
          sticky: true,
          transparent: false,
        },
      }),
      createPresetSection('hero', {
        title: 'Come Home To A Perfectly Clean Space',
        subtitle: 'Background-checked cleaners, eco-friendly supplies, and flexible scheduling.',
        content: {
          ctaText: 'Get Cleaning Quote',
          ctaLink: '#booking',
          backgroundImage: '',
          showVideo: false,
          videoUrl: '',
        },
        styles: {
          backgroundColor: '#ecfdf5',
          textAlign: 'left',
        },
      }),
      createPresetSection('benefits', {
        title: 'Why Busy People Choose Us',
        subtitle: 'Save time, reduce stress, and enjoy a consistently clean space.',
        content: {
          title: 'Benefits of SparkleClean',
          subtitle: 'Cleaning that fits your life, not the other way around.',
          benefits: [
            {
              title: 'Save Hours Every Week',
              description: 'Spend more time with family while we handle the cleaning.',
              icon: 'Clock',
              stats: 'Up to 8 hours saved per month',
            },
            {
              title: 'Trusted, Vetted Cleaners',
              description: 'Background-checked and trained professionals in your home.',
              icon: 'Shield',
              stats: '100% insured team',
            },
            {
              title: 'Eco-Friendly Products',
              description: 'Safe, low-odor cleaning products for kids and pets.',
              icon: 'Leaf',
              stats: 'Green cleaning available',
            },
            {
              title: 'Flexible Scheduling',
              description: 'Weekly, bi-weekly, monthly, and one-time deep cleans.',
              icon: 'Calendar',
              stats: 'Custom visit plans',
            },
          ],
          layout: 'grid',
          columns: 2,
          showStats: true,
        },
      }),
      createPresetSection('services', {
        title: 'Cleaning Services For Every Space',
        subtitle: 'Homes, offices, rentals, and more.',
        content: {
          title: 'Cleaning Services',
          subtitle: 'Pick the service that matches your space.',
          services: [
            {
              title: 'Recurring Home Cleaning',
              desc: 'Weekly or bi-weekly maintenance cleans to keep your home fresh.',
              icon: 'Home',
              price: 'Flat-rate pricing per visit',
            },
            {
              title: 'Deep Cleaning',
              desc: 'Baseboards, inside appliances, and high-touch surfaces.',
              icon: 'Sparkles',
              price: 'Recommended every 3–6 months',
            },
            {
              title: 'Move-In / Move-Out',
              desc: 'Thorough cleaning before you hand over the keys or move in.',
              icon: 'Truck',
              price: 'Perfect for renters and landlords',
            },
            {
              title: 'Office & Commercial',
              desc: 'After-hours cleaning for offices, salons, and clinics.',
              icon: 'Briefcase',
              price: 'Custom quotes for businesses',
            },
            {
              title: 'Airbnb & Rental Turns',
              desc: 'Fast turnovers with linen changes and restocking.',
              icon: 'BedDouble',
              price: 'Per-stay pricing',
            },
          ],
          layout: 'grid',
          columns: 2,
          showPricing: true,
        },
      }),
      createPresetSection('pricing', {
        title: 'Simple Cleaning Packages',
        subtitle: 'Choose the visit frequency and package that fits your life.',
        content: {
          plans: [
            {
              name: 'Fresh Start',
              price: '$99',
              period: 'per visit',
              features: ['Studio or 1BR home', 'Basic clean of kitchen & bath', 'Vacuum & mop floors'],
              highlighted: false,
              ctaText: 'Book Fresh Start',
            },
            {
              name: 'Sparkle Plus',
              price: '$149',
              period: 'per visit',
              features: ['2–3BR home', 'Detail clean of kitchen & baths', 'Dusting of all surfaces'],
              highlighted: true,
              ctaText: 'Book Sparkle Plus',
            },
            {
              name: 'Deep Clean',
              price: '$249',
              period: 'per visit',
              features: ['Deep clean of kitchen & baths', 'Baseboards & doors', 'Inside oven or fridge'],
              highlighted: false,
              ctaText: 'Book Deep Clean',
            },
          ],
          layout: 'cards',
        },
      }),
      createPresetSection('testimonials-grid', {
        title: 'Customers Who Love Their Clean Home',
        subtitle: 'See what our regulars say about working with us.',
        content: {
          title: 'Happy SparkleClean Clients',
          subtitle: 'Reviews from busy families and professionals.',
          testimonials: [
            {
              text: 'Walking into a clean house after work is the best feeling. They are always on time.',
              name: 'Jessica T.',
              company: 'Homeowner',
              rating: 5,
              image: '',
            },
            {
              text: 'Our Airbnb guests constantly mention how clean the space is.',
              name: 'Marcus L.',
              company: 'Host',
              rating: 5,
              image: '',
            },
            {
              text: 'They worked with our office hours and keep our workspace spotless.',
              name: 'Dr. A. Singh',
              company: 'Clinic Owner',
              rating: 5,
              image: '',
            },
          ],
          layout: 'grid',
          columns: 3,
          showCompany: true,
          showImages: false,
        },
      }),
      createPresetSection('faq', {
        title: 'Cleaning FAQs',
        subtitle: 'What we bring, what we clean, and how scheduling works.',
        content: {
          faqs: [
            {
              q: 'Do I need to be home during the cleaning?',
              a: 'No. Many of our clients provide access instructions and return to a clean home.',
            },
            {
              q: 'Do you bring your own supplies and equipment?',
              a: 'Yes. Our team brings all cleaning supplies and equipment. We can use your products if you prefer.',
            },
            {
              q: 'Can I reschedule a visit?',
              a: 'Absolutely. We simply ask for at least 24 hours notice when possible.',
            },
            {
              q: 'What areas do you clean?',
              a: 'Kitchens, bathrooms, bedrooms, living areas, entryways, and more. Deep cleans add extra detail work.',
            },
          ],
          layout: 'accordion',
          showSearch: false,
        },
      }),
      createPresetSection('form', {
        title: 'Request A Cleaning Quote',
        subtitle: 'Tell us about your home or office and when you would like service.',
        content: {
          title: 'Get A Cleaning Quote',
          subtitle: 'Share a few details and we will follow up with pricing and availability.',
          fields: [
            { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Jane Doe' },
            { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'you@example.com' },
            { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: 'Best number to reach you' },
            { name: 'propertyType', label: 'Property Type', type: 'text', required: false, placeholder: 'Home, office, Airbnb, etc.' },
            { name: 'bedrooms', label: 'Bedrooms', type: 'text', required: false, placeholder: 'Number of bedrooms' },
            { name: 'bathrooms', label: 'Bathrooms', type: 'text', required: false, placeholder: 'Number of bathrooms' },
            { name: 'frequency', label: 'How often?', type: 'text', required: false, placeholder: 'One-time, weekly, bi-weekly, monthly' },
            { name: 'details', label: 'Cleaning Details', type: 'textarea', required: true, placeholder: 'What would you like us to focus on?' },
          ],
          button: 'Request Quote',
          layout: 'vertical',
          showLabels: true,
        },
        styles: {
          backgroundColor: '#f0fdf4',
        },
      }),
      createPresetSection('footer', {
        content: {
          logo: 'SparkleClean Pros',
          description: 'Professional home, office, and Airbnb cleaning with flexible scheduling.',
          links: [
            { title: 'Company', items: ['About', 'Our Team', 'Reviews', 'Contact'] },
            { title: 'Services', items: ['Home Cleaning', 'Office Cleaning', 'Airbnb Turns', 'Move-In/Out'] },
            { title: 'Resources', items: ['Cleaning Checklist', 'FAQ', 'Blog'] },
          ],
          social: {
            twitter: '',
            linkedin: '',
            facebook: '',
            instagram: '',
          },
          newsletter: false,
          copyright: '© 2024 SparkleClean Pros. All rights reserved.',
        },
      }),
    ],
  },
  'home-services': {
    label: 'General Home Services',
    description: 'Handyman, repairs, and home maintenance with portfolio.',
    createSettings: () => ({
      seoTitle: 'Local Home Services & Repairs',
      seoDescription: 'Handyman, maintenance, and small projects for busy homeowners.',
      backgroundColor: '#fefce8',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      accentColor: '#eab308',
    }),
    createSections: () => [
      createPresetSection('header', {
        title: 'FixRight Home Services',
        subtitle: 'One call for all your home projects',
        content: {
          logo: 'FixRight Home Services',
          navigation: [
            { label: 'Home', link: '#top' },
            { label: 'Services', link: '#services' },
            { label: 'Projects', link: '#projects' },
            { label: 'Reviews', link: '#reviews' },
          ],
          ctaButton: 'Book A Home Visit',
          ctaLink: '#visit',
          sticky: true,
          transparent: false,
        },
      }),
      createPresetSection('hero', {
        title: 'Your Go-To Partner For Home Repairs & Projects',
        subtitle: 'Licensed, insured, and on time for every job.',
        content: {
          ctaText: 'Book A Home Visit',
          ctaLink: '#visit',
          backgroundImage: '',
          showVideo: false,
          videoUrl: '',
        },
        styles: {
          backgroundColor: '#fef9c3',
          textAlign: 'left',
        },
      }),
      createPresetSection('services', {
        title: 'Home Services & Repairs',
        subtitle: 'From small fixes to weekend-sized projects.',
        content: {
          title: 'Handyman & Home Services',
          subtitle: 'Trusted pros for the projects you keep putting off.',
          services: [
            {
              title: 'Small Repairs',
              desc: 'Fix drywall holes, loose railings, leaky faucets, and more.',
              icon: 'Wrench',
              price: 'Hourly or per-project pricing',
            },
            {
              title: 'Installations',
              desc: 'Hang TVs, install light fixtures, assemble furniture, mount shelves.',
              icon: 'Tool',
              price: 'Flat pricing for common installs',
            },
            {
              title: 'Exterior Projects',
              desc: 'Fence repairs, deck fixes, gutter cleaning, and pressure washing.',
              icon: 'Home',
              price: 'Bundle seasonal maintenance',
            },
            {
              title: 'Maintenance Plans',
              desc: 'Seasonal checklists to keep everything working year-round.',
              icon: 'Calendar',
              price: 'Quarterly or annual visits',
            },
          ],
          layout: 'grid',
          columns: 2,
          showPricing: true,
        },
      }),
      createPresetSection('portfolio', {
        title: 'Recent Home Projects',
        subtitle: 'See repairs and upgrades we have completed lately.',
        content: {
          title: 'Project Gallery',
          subtitle: 'Real before-and-after projects from FixRight clients.',
          projects: [
            {
              title: 'Kitchen Refresh',
              description: 'New backsplash, painted cabinets, and updated lighting.',
              category: 'Kitchen',
              image: '',
              link: '#',
              technologies: ['Tile', 'Lighting', 'Cabinet Painting'],
            },
            {
              title: 'Deck Repair & Stain',
              description: 'Repaired damaged boards and applied protective stain.',
              category: 'Exterior',
              image: '',
              link: '#',
              technologies: ['Carpentry', 'Stain'],
            },
            {
              title: 'Bathroom Updates',
              description: 'New fixtures, caulking, and fresh paint.',
              category: 'Bathroom',
              image: '',
              link: '#',
              technologies: ['Plumbing Fixtures', 'Caulking', 'Paint'],
            },
          ],
          layout: 'grid',
          columns: 3,
          showFilters: true,
          categories: ['All', 'Kitchen', 'Bathroom', 'Exterior', 'Other'],
        },
      }),
      createPresetSection('process', {
        title: 'How Working With Us Works',
        subtitle: 'Simple 3-step process to get projects done.',
        content: {
          title: 'Our Simple Process',
          subtitle: 'From first call to finished project.',
          steps: [
            { number: '1', title: 'Tell Us About The Job', desc: 'Share what you need help with and send photos if you can.', icon: 'MessageCircle' },
            { number: '2', title: 'Fair, Upfront Pricing', desc: 'We give you clear pricing before any work begins.', icon: 'FileTextIcon' },
            { number: '3', title: 'On-Time Service', desc: 'A FixRight pro completes the work and cleans up afterward.', icon: 'CheckCircle' },
          ],
          layout: 'horizontal',
          showNumbers: true,
          showIcons: true,
        },
      }),
      createPresetSection('stats', {
        title: 'Experience You Can Trust',
        subtitle: 'Years in business, projects completed, and happy clients.',
        content: {
          title: 'Why Homeowners Choose FixRight',
          subtitle: 'We focus on reliability, communication, and quality.',
          stats: [
            { number: '10+', label: 'Years serving local homeowners', prefix: '', suffix: '' },
            { number: '1,200+', label: 'Projects completed', prefix: '', suffix: '' },
            { number: '4.9/5', label: 'Average review rating', prefix: '', suffix: '' },
            { number: '48 hrs', label: 'Typical scheduling window', prefix: '', suffix: '' },
          ],
          layout: 'grid',
          showAnimations: true,
          counterAnimation: true,
        },
      }),
      createPresetSection('testimonials', {
        title: 'Homeowners We Have Helped',
        subtitle: 'Stories from real clients in your area.',
        content: {
          quotes: [
            {
              text: 'They handled a long list of little fixes in a single visit. Super convenient.',
              name: 'Amrita K.',
              role: 'Homeowner',
              rating: 5,
              avatar: '',
            },
            {
              text: 'Professional, friendly, and they explained every option clearly.',
              name: 'Michael S.',
              role: 'Homeowner',
              rating: 5,
              avatar: '',
            },
            {
              text: 'We now use FixRight for all of our rental properties.',
              name: 'GreenTree Rentals',
              role: 'Property Manager',
              rating: 5,
              avatar: '',
            },
          ],
          showRatings: true,
          layout: 'carousel',
        },
      }),
      createPresetSection('faq', {
        title: 'Home Services FAQs',
        subtitle: 'Availability, pricing, estimates, and guarantees.',
        content: {
          faqs: [
            {
              q: 'What kinds of projects do you handle?',
              a: 'We handle small repairs, installations, punch lists, and many common home projects. For large remodels, we can refer you.',
            },
            {
              q: 'Do you charge by the hour or by the project?',
              a: 'It depends on the job. Some tasks are hourly; others are a flat project rate. We tell you upfront.',
            },
            {
              q: 'Are you licensed and insured?',
              a: 'Yes. FixRight is fully insured and uses licensed pros where required by law.',
            },
            {
              q: 'Do you guarantee your work?',
              a: 'We guarantee workmanship on all completed projects. If something is not right, we will make it right.',
            },
          ],
          layout: 'accordion',
          showSearch: false,
        },
      }),
      createPresetSection('form', {
        title: 'Tell Us About Your Project',
        subtitle: 'Share a bit about your repair or upgrade and we will follow up.',
        content: {
          title: 'Request A Home Services Visit',
          subtitle: 'Tell us what you need help with and your ideal timing.',
          fields: [
            { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Jane Doe' },
            { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'you@example.com' },
            { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: 'Best number to reach you' },
            { name: 'address', label: 'Property Address', type: 'text', required: false, placeholder: 'Street, City' },
            { name: 'projectList', label: 'What needs to be done?', type: 'textarea', required: true, placeholder: 'List repairs or projects here' },
            { name: 'timing', label: 'Preferred timing', type: 'text', required: false, placeholder: 'This week, this month, etc.' },
          ],
          button: 'Request Visit',
          layout: 'vertical',
          showLabels: true,
        },
      }),
      createPresetSection('footer', {
        content: {
          logo: 'FixRight Home Services',
          description: 'Your reliable partner for everyday home repairs and projects.',
          links: [
            { title: 'Company', items: ['About', 'Our Pros', 'Reviews', 'Contact'] },
            { title: 'Services', items: ['Repairs', 'Installations', 'Exterior', 'Maintenance Plans'] },
            { title: 'Resources', items: ['Checklist', 'FAQ', 'Blog'] },
          ],
          social: {
            twitter: '',
            linkedin: '',
            facebook: '',
            instagram: '',
          },
          newsletter: false,
          copyright: '© 2024 FixRight Home Services. All rights reserved.',
        },
      }),
    ],
  },
};

const SortableSectionWrapper: React.FC<{ section: LandingPageSection; children: React.ReactNode }> = ({ section, children }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
  };

  const dragHandle = (
    <button
      ref={setActivatorNodeRef}
      {...listeners}
      {...attributes}
      className="p-1 rounded hover:bg-muted transition-colors cursor-grab active:cursor-grabbing"
      aria-label="Drag section"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
      {React.cloneElement(children as React.ReactElement, { dragHandle, isDragging })}
    </div>
  );
};

const DraggableSectionButton: React.FC<{
  template: typeof sectionTemplates[0];
}> = ({ template }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `template-${template.type}`,
    data: { type: 'template', templateType: template.type },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const Icon = template.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`aspect-square flex flex-col gap-2 p-3 hover:bg-muted/50 transition-all hover:scale-105 border-2 border-border cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 scale-105' : ''
      }`}
    >
      <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center mb-1.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="text-[12px] font-medium leading-tight text-center w-full truncate px-1">{template.label}</div>
    </div>
  );
};

export const VisualLandingBuilder: React.FC<VisualLandingBuilderProps> = ({
  initialSections = [],
  initialSettings = {
    seoTitle: '',
    seoDescription: '',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter, sans-serif',
    accentColor: '#3b82f6',
  },
  pageId,
  onSave,
  initialPresetId,
}) => {
  const [sections, setSections] = useState<LandingPageSection[]>(initialSections);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [settings, setSettings] = useState<PageSettings>(initialSettings);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [hasAppliedInitialPreset, setHasAppliedInitialPreset] = useState(false);

  useEffect(() => {
    if (!initialPresetId || hasAppliedInitialPreset || sections.length > 0) return;

    const preset = homeServicesPresets[initialPresetId];
    if (!preset) return;

    const newSettings = preset.createSettings();
    const newSections = preset.createSections();
    setSettings(newSettings);
    setSections(newSections);
    setSelectedSectionId(newSections[0]?.id ?? null);
    setHasAppliedInitialPreset(true);
  }, [initialPresetId, hasAppliedInitialPreset, sections.length]);

  const applyPreset = (presetId: HomeServicesPresetId) => {
    const preset = homeServicesPresets[presetId];
    if (!preset) return;

    if (sections.length > 0) {
      const confirmed = window.confirm(
        'Applying a template will replace the current sections on this page. Continue?',
      );
      if (!confirmed) return;
    }

    const newSettings = preset.createSettings();
    const newSections = preset.createSections();
    setSettings(newSettings);
    setSections(newSections);
    setSelectedSectionId(newSections[0]?.id ?? null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Check if we're dragging a template to add a new section
    const activeData = active.data.current;
    if (activeData?.type === 'template') {
      const templateType = activeData.templateType;
      // Always add the section when dragging a template, regardless of drop target
      addSection(templateType);
      setActiveId(null);
      return;
    }

    // Handle reordering existing sections
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setSections(arrayMove(sections, oldIndex, newIndex));
      }
    }

    setActiveId(null);
  };

  const addSection = (type: string) => {
    const template = sectionTemplates.find(t => t.type === type);
    if (!template) return;

    const newSection: LandingPageSection = {
      id: nanoid(),
      type: type as any,
      title: template.title,
      subtitle: template.subtitle,
      content: createSectionContent(type),
      styles: {
        backgroundColor: '#ffffff',
        padding: '4rem 2rem',
        textAlign: 'center',
      },
    };

    setSections([...sections, newSection]);
    setSelectedSectionId(newSection.id);
  };

  const updateSection = (id: string, updates: Partial<LandingPageSection>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const updateSectionContent = (id: string, content: any) => {
    setSections(sections.map(s => s.id === id ? { ...s, content } : s));
  };

  const updateSectionStyles = (id: string, styles: Partial<SectionStyles>) => {
    updateSection(id, { styles: { ...selectedSection?.styles, ...styles } });
  };

  const deleteSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
    if (selectedSectionId === id) {
      setSelectedSectionId(null);
    }
  };

  const duplicateSection = (id: string) => {
    const section = sections.find(s => s.id === id);
    if (section) {
      const newSection = {
        ...section,
        id: nanoid(),
        title: `${section.title} (Copy)`,
      };
      setSections([...sections, newSection]);
      setSelectedSectionId(newSection.id);
    }
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = arrayMove(sections, index, newIndex);
    setSections(newSections);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const pageData = {
        name: settings.seoTitle || 'Untitled Landing Page',
        title: settings.seoTitle || 'Untitled Landing Page',
        description: settings.seoDescription,
        status: 'draft' as const,
        content: {
          sections,
          settings,
        },
        seo_title: settings.seoTitle,
        seo_description: settings.seoDescription,
      };

      if (pageId) {
        await landingPagesApi.updateLandingPage(pageId, pageData);
      } else {
        await landingPagesApi.createLandingPage(pageData);
      }

      onSave?.({ sections, settings });
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    return await landingPagesApi.uploadImage(file);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen bg-background relative">
        {/* Left Panel - Add Section (collapsible like WebForms) */}
        {!isPreviewMode && (
          <>
            {isLeftPanelCollapsed && (
              <div className="absolute left-4 top-4 z-10">
                <button
                  onClick={() => setIsLeftPanelCollapsed(false)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded text-xs font-medium hover:bg-muted/80 transition-colors border border-border"
                >
                  <span>←</span>
                  Show Sections
                </button>
              </div>
            )}

            <aside className={`${isLeftPanelCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-72'} border-r flex flex-col overflow-hidden`}>
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold mb-0">Add Section</h3>
                <button onClick={() => setIsLeftPanelCollapsed(true)} className="p-1 rounded hover:bg-muted/60 transition-colors" title="Hide">
                  <span className="text-muted-foreground">«</span>
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
                  {sectionTemplates.map((template) => (
                    <DraggableSectionButton
                      key={template.type}
                      template={template}
                    />
                  ))}
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Main Canvas - Middle */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isPreviewMode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                    className="h-8 w-8 p-0"
                    title={isLeftPanelCollapsed ? "Show Add Section Panel" : "Hide Add Section Panel"}
                  >
                    {isLeftPanelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
                    className="h-8 w-8 p-0"
                    title={isRightPanelCollapsed ? "Show Settings Panel" : "Hide Settings Panel"}
                  >
                    {isRightPanelCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                </>
              )}
              <Button variant="outline" onClick={() => setIsPreviewMode(!isPreviewMode)}>
                <Eye className="h-4 w-4 mr-2" />
                {isPreviewMode ? 'Edit' : 'Preview'}
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{sections.length} sections</Badge>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto relative">
            {isPreviewMode ? (
              <div style={{ backgroundColor: settings.backgroundColor, fontFamily: settings.fontFamily }}>
                {sections.map((section) => (
                  <div key={section.id}>
                    <SectionRenderer
                      section={section}
                      isSelected={false}
                      onSelect={() => {}}
                      onUpdate={(updates) => updateSection(section.id, updates)}
                      onDuplicate={() => {}}
                      onDelete={() => {}}
                      onMoveUp={() => {}}
                      onMoveDown={() => {}}
                      isFirst={false}
                      isLast={false}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div style={{ backgroundColor: settings.backgroundColor, fontFamily: settings.fontFamily }}>
                  {sections.map((section, index) => (
                    <SortableSectionWrapper key={section.id} section={section}>
                      <SectionRenderer
                        section={section}
                        isSelected={selectedSectionId === section.id}
                        onSelect={() => setSelectedSectionId(section.id)}
                        onUpdate={(updates) => updateSection(section.id, updates)}
                        onDuplicate={() => duplicateSection(section.id)}
                        onDelete={() => deleteSection(section.id)}
                        onMoveUp={() => moveSection(section.id, 'up')}
                        onMoveDown={() => moveSection(section.id, 'down')}
                        isFirst={index === 0}
                        isLast={index === sections.length - 1}
                      />
                    </SortableSectionWrapper>
                  ))}
                </div>
              </SortableContext>
            )}
          </div>
          <DragOverlay>
            {activeId ? (
              activeId.startsWith('template-') ? (
                // Show template preview when dragging from left panel
                (() => {
                  const templateType = activeId.replace('template-', '');
                  const template = sectionTemplates.find(t => t.type === templateType);
                  if (template) {
                    return (
                      <div className="bg-white border-2 border-primary rounded-lg p-4 shadow-lg max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                            <template.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{template.label}</h3>
                            <p className="text-sm text-muted-foreground">Drag to canvas to add</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              ) : (
                // Show section preview when reordering
                <SectionRenderer
                  section={sections.find(s => s.id === activeId)!}
                  isSelected={false}
                  onSelect={() => {}}
                  onUpdate={() => {}}
                  onDuplicate={() => {}}
                  onDelete={() => {}}
                  onMoveUp={() => {}}
                  onMoveDown={() => {}}
                  isFirst={false}
                  isLast={false}
                  isDragging={true}
                />
              )
            ) : null}
          </DragOverlay>
        </div>

        {/* Right Panel - Settings (collapsible like WebForms) */}
        {!isPreviewMode && (
          <>
            {isRightPanelCollapsed && selectedSectionId && (
              <div className="absolute right-4 top-4 z-10">
                <button onClick={() => setIsRightPanelCollapsed(false)} className="flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded text-xs font-medium hover:bg-muted/80 transition-colors border border-border">
                  Show Settings →
                </button>
              </div>
            )}

            <aside className={`${isRightPanelCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-80'} border-l flex flex-col overflow-hidden`}>
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Settings</h3>
                <button onClick={() => setIsRightPanelCollapsed(true)} className="p-1 rounded hover:bg-muted/60 transition-colors" title="Hide">
                  <span className="text-muted-foreground">»</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {/* Style Inspector */}
                <StyleInspector
                  sectionStyles={selectedSection?.styles}
                  sectionContent={selectedSection?.content}
                  sectionType={selectedSection?.type}
                  pageSettings={settings}
                  onUpdateSectionStyles={(styles) => {
                    if (selectedSectionId) {
                      updateSectionStyles(selectedSectionId, styles);
                    }
                  }}
                  onUpdateSectionContent={(content) => {
                    if (selectedSectionId) {
                      updateSectionContent(selectedSectionId, content);
                    }
                  }}
                  onUpdatePageSettings={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
                  onImageUpload={handleImageUpload}
                />
              </div>
            </aside>
          </>
        )}
      </div>
    </DndContext>
  );
};

