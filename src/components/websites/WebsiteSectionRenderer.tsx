import React from 'react';
import { WebsiteSection } from '@/lib/websitesApi';
import {
    Layout, Type, Image, Star, DollarSign,
    Quote, Phone,
    List, Table, Grid3X3,
    PlayCircle, Mail, BarChart3,
    Clock, Menu,
    MapPin, CheckCircle2,
    Share2, Lock, EyeOff, Search,
    Hammer, Wrench, Sprout, Droplets, Sun, Wind, Home, Layers, Palette, Shield, Zap, Link, BarChart, Users, Cpu, Server, PenTool, Activity, Smile, Heart, Thermometer,
    Leaf, Wine, ChefHat, Utensils, Building2, Brain, CloudOff, Smartphone, Target, CreditCard, Truck, RefreshCcw, BadgeCheck, Paintbrush, MessageSquare, Globe, Rewind, Terminal, Shirt
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
    'Layout': Layout, 'Type': Type, 'Image': Image, 'Star': Star, 'DollarSign': DollarSign,
    'Quote': Quote, 'Phone': Phone, 'List': List, 'Table': Table, 'Grid3X3': Grid3X3,
    'PlayCircle': PlayCircle, 'Mail': Mail, 'BarChart3': BarChart3, 'BarChart': BarChart,
    'Clock': Clock, 'Menu': Menu, 'MapPin': MapPin, 'CheckCircle2': CheckCircle2,
    'Share2': Share2, 'Lock': Lock, 'EyeOff': EyeOff, 'Search': Search,
    'Hammer': Hammer, 'Wrench': Wrench, 'Sprout': Sprout, 'Droplets': Droplets,
    'Sun': Sun, 'Wind': Wind, 'Home': Home, 'Layers': Layers, 'Palette': Palette,
    'Shield': Shield, 'Zap': Zap, 'Link': Link, 'Users': Users, 'Cpu': Cpu,
    'Server': Server, 'PenTool': PenTool, 'Activity': Activity, 'Smile': Smile,
    'Heart': Heart, 'Thermometer': Thermometer, 'Leaf': Leaf, 'Wine': Wine, 'ChefHat': ChefHat,
    'Utensils': Utensils, 'Building2': Building2, 'Brain': Brain, 'CloudOff': CloudOff,
    'Smartphone': Smartphone, 'Target': Target, 'CreditCard': CreditCard, 'Truck': Truck,
    'RefreshCcw': RefreshCcw, 'BadgeCheck': BadgeCheck, 'Paintbrush': Paintbrush,
    'MessageSquare': MessageSquare, 'Globe': Globe, 'Rewind': Rewind, 'Terminal': Terminal, 'Shirt': Shirt
};

interface WebsiteSectionRendererProps {
    section: WebsiteSection;
}

export const WebsiteSectionRenderer: React.FC<WebsiteSectionRendererProps> = ({ section }) => {
    const type = section.type;
    const content = section.content || {};

    // Default title/subtitle rendering
    const defaultContent = (
        <div style={section.styles}>
            <h3 className="text-xl font-semibold">{section.title}</h3>
            {section.subtitle && <p className="text-gray-600 mt-2">{section.subtitle}</p>}
        </div>
    );

    // --- Layout Elements ---
    if (type === 'container' || type === 'section') {
        return (
            <div className="border-2 border-dashed border-gray-300 p-8 rounded min-h-[100px] flex items-center justify-center bg-gray-50" style={section.styles}>
                <div className="text-center text-gray-400">
                    <Layout className="h-8 w-8 mx-auto mb-2" />
                    <span className="text-sm font-medium">{type === 'container' ? 'Container Area' : 'Section Area'}</span>
                </div>
            </div>
        );
    }

    if (type === 'columns' || type === 'grid') {
        const count = content.columnCount || (type === 'grid' ? 3 : 2);
        return (
            <div style={section.styles}>
                <div className="text-center mb-4">
                    {section.title && <h3 className="text-xl font-semibold">{section.title}</h3>}
                    {section.subtitle && <p className="text-gray-600 mt-2">{section.subtitle}</p>}
                </div>
                <div
                    className="grid mt-4 gap-4"
                    style={{
                        gridTemplateColumns: `repeat(${count}, 1fr)`,
                        gap: content.gap || '1rem'
                    }}
                >
                    {Array.from({ length: count }).map((_, i) => (
                        <div key={i} className="bg-gray-100 p-4 rounded border-2 border-dashed border-gray-300 min-h-[80px] flex items-center justify-center">
                            <span className="text-xs text-gray-500">Col {i + 1}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- Navigation ---
    if (type === 'header' || type === 'navbar') {
        const links = content.links || ['Home', 'About', 'Services', 'Contact'];

        return (
            <div
                className="w-full border-b bg-white py-4 px-6 flex justify-between items-center sticky top-0 z-50 backdrop-blur-sm bg-white/90"
                style={section.styles}
            >
                <div className="flex items-center gap-2">
                    <div className="font-bold text-xl tracking-tight text-primary">
                        {content.logoText || 'Logo'}
                    </div>
                </div>

                <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
                    {links.map((link: any, i: number) => {
                        const label = typeof link === 'object' ? link.label : link;
                        return (
                            <span key={i} className="hover:text-primary cursor-pointer transition-colors">{label}</span>
                        );
                    })}
                </div>

                <div className="flex items-center gap-4">
                    {content.search && <Search className="h-5 w-5 text-gray-400 cursor-pointer" />}
                    {content.ctaText && (
                        <button className="px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                            {content.ctaText}
                        </button>
                    )}
                    <div className="md:hidden">
                        <Menu className="h-6 w-6 cursor-pointer" />
                    </div>
                </div>
            </div>
        );
    }

    // Hero Section
    if (type === 'hero') {
        const style = {
            ...section.styles,
            backgroundImage: content.image ? `url(${content.image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        };

        return (
            <div className={`relative overflow-hidden ${content.image ? 'text-white' : ''}`} style={style}>
                {content.image && (
                    <div className="absolute inset-0 bg-black/50 z-0"></div>
                )}
                <div className="relative z-10 container mx-auto px-4 py-16 text-center">
                    <h1 className="text-2xl md:text-6xl font-bold mb-6 tracking-tight leading-tight">
                        {content.heading || section.title || 'Hero Section'}
                    </h1>
                    <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto opacity-90 leading-relaxed">
                        {content.subheading || section.subtitle || 'Compelling subtitle goes here'}
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <button className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            {content.ctaText || 'Get Started'}
                        </button>
                        {content.secondaryCtaText && (
                            <button className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg text-lg font-semibold hover:bg-white/20 transition-all">
                                {content.secondaryCtaText}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Features
    if (type === 'features') {
        const features = content.features || [1, 2, 3];
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-2xl font-bold mb-4">{content.heading || section.title || 'Features'}</h2>
                        {section.subtitle && <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{section.subtitle}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature: any, i: number) => {
                            // Fallback icon logic could be improved
                            return (
                                <div key={i} className="text-center p-6 rounded-2xl bg-card border border-border/50 hover:shadow-lg transition-all duration-300 group">
                                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                        {(() => {
                                            const IconComponent = (typeof feature === 'object' && feature.icon && ICON_MAP[feature.icon])
                                                ? ICON_MAP[feature.icon]
                                                : Star;
                                            return <IconComponent className="h-8 w-8 text-primary" />;
                                        })()}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{typeof feature === 'object' ? feature.title : `Feature ${feature}`}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {typeof feature === 'object' ? feature.description : 'Description goes here'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Pricing
    if (type === 'pricing') {
        const plans = content.plans || ['Basic', 'Pro', 'Enterprise'];
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-2xl font-bold mb-4">{content.heading || section.title || 'Pricing Plans'}</h2>
                        <p className="text-xl text-muted-foreground">Choose the perfect plan for your needs</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {plans.map((plan: any, i: number) => {
                            const isObj = typeof plan === 'object';
                            const name = isObj ? plan.name : plan;
                            const price = isObj ? plan.price : '$99';
                            const isPopular = isObj ? plan.popular : i === 1;

                            return (
                                <div key={i} className={`relative rounded-2xl p-8 border ${isPopular ? 'border-primary shadow-xl scale-105 z-10 bg-card' : 'border-border bg-card/50'}`}>
                                    {isPopular && (
                                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                                            Most Popular
                                        </div>
                                    )}
                                    <h3 className="font-bold text-2xl mb-2">{name}</h3>
                                    <div className="flex items-baseline mb-6">
                                        <span className="text-2xl font-bold">{price}</span>
                                        {isObj && plan.period && <span className="text-muted-foreground ml-2">{plan.period}</span>}
                                    </div>
                                    <ul className="space-y-4 mb-8">
                                        {(isObj && plan.features ? plan.features : ['Feature 1', 'Feature 2', 'Feature 3']).map((feat: string, idx: number) => (
                                            <li key={idx} className="flex items-center gap-3">
                                                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                <span className="text-sm">{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <button className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${isPopular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                                        Choose {name}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Testimonials
    if (type === 'testimonials') {
        const items = content.quotes || content.testimonials || [1, 2];
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold text-center mb-12">{content.heading || section.title || 'What Our Customers Say'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {items.map((item: any, i: number) => {
                            const isObj = typeof item === 'object';
                            return (
                                <div key={i} className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                                    <Quote className="h-10 w-10 text-primary/40 mb-6" />
                                    <p className="text-lg text-muted-foreground mb-6 italic leading-relaxed">
                                        "{isObj ? item.text : 'Great product! Highly recommended.'}"
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                                            {isObj ? item.author?.charAt(0) || 'U' : 'U'}
                                        </div>
                                        <div>
                                            <div className="font-bold">{isObj ? item.author : 'Customer Name'}</div>
                                            <div className="text-sm text-primary">{isObj ? item.role || 'Verified User' : 'Verified User'}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Media: Gallery / Lookbook
    if (type === 'gallery' || type === 'lookbook') {
        const images = content.images || [1, 2, 3, 4, 5, 6];
        return (
            <div style={section.styles}>
                <div className="text-center mb-8">
                    {section.title && <h3 className="text-2xl font-bold">{section.title}</h3>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {images.map((img: any, i: number) => (
                        <div key={i} className="aspect-square bg-muted rounded-xl bg-center bg-cover overflow-hidden hover:opacity-90 transition-opacity cursor-pointer shadow-sm hover:shadow-md"
                            style={typeof img === 'string' ? { backgroundImage: `url(${img})` } : undefined}
                        >
                            {typeof img !== 'string' && <div className="h-full flex items-center justify-center"><Image className="h-8 w-8 text-muted-foreground" /></div>}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Media: Video
    if (type === 'video') {
        return (
            <div className="flex flex-col items-center gap-2" style={section.styles}>
                <div className="text-center mb-4">
                    {section.title && <h3 className="text-2xl font-bold">{section.title}</h3>}
                </div>
                <div className="w-full aspect-video bg-gray-900 rounded flex items-center justify-center">
                    <PlayCircle className="h-16 w-16 text-white opacity-80" />
                </div>
            </div>
        );
    }

    // Text Section
    if (type === 'text' || type === 'paragraph') {
        return (
            <div style={section.styles}>
                {section.title && <h3 className="text-2xl font-semibold mb-4">{section.title}</h3>}
                {content.html ? (
                    <div dangerouslySetInnerHTML={{ __html: content.html }} />
                ) : (
                    <p className="text-lg leading-relaxed text-gray-700">
                        {content.text || section.subtitle || 'Enter your text content here...'}
                    </p>
                )}
            </div>
        );
    }

    // Footer
    if (type === 'footer') {
        const links = content.links || [];
        const copyright = content.copyright || '© 2024 Company Name';
        return (
            <div className="w-full bg-slate-900 text-slate-300 py-12 px-6" style={section.styles}>
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <h4 className="text-white font-bold mb-4 px-1">{section.title || 'Company'}</h4>
                            <p className="text-sm text-slate-400 mb-4 px-1">
                                {content.description || 'Making the world a better place through innovation.'}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Links</h4>
                            <div className="space-y-2 text-sm">
                                {links.length > 0 ? links.map((link: any, i: number) => (
                                    <div key={i}><a href={link.href} className="hover:text-white transition-colors">{link.label}</a></div>
                                )) : (
                                    <>
                                        <div><a href="#" className="hover:text-white">Home</a></div>
                                        <div><a href="#" className="hover:text-white">About</a></div>
                                        <div><a href="#" className="hover:text-white">Services</a></div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Legal</h4>
                            <div className="space-y-2 text-sm">
                                <div><a href="#" className="hover:text-white">Privacy Policy</a></div>
                                <div><a href="#" className="hover:text-white">Terms of Service</a></div>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Connect</h4>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                                    <Share2 className="h-4 w-4 text-white" />
                                </div>
                                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                                    <Mail className="h-4 w-4 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-center text-xs text-slate-500 pt-8 border-t border-slate-800">
                        {copyright}
                    </div>
                </div>
            </div>
        );
    }

    // --- Stats ---
    if (type === 'stats') {
        const stats = content.stats || [{ value: '1M+', label: 'Users' }];
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {stats.map((stat: any, i: number) => (
                            <div key={i} className="text-center">
                                <div className="text-2xl font-bold mb-2">{stat.value}</div>
                                <div className="text-sm opacity-80">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- Product Grid ---
    if (type === 'product-grid') {
        const products = content.products || [1, 2, 3];
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto">
                    {content.heading && <h2 className="text-2xl font-bold text-center mb-8">{content.heading}</h2>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                        {products.map((prod: any, i: number) => (
                            <div key={i} className="group cursor-pointer">
                                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-4 relative">
                                    {prod.image ? (
                                        <img src={prod.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300"><Image className="w-12 h-12" /></div>
                                    )}
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <h3 className="font-semibold text-lg">{prod.name || 'Product Name'}</h3>
                                <p className="text-primary font-medium">{prod.price || '$99.00'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- Newsletter ---
    if (type === 'newsletter') {
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-2xl font-bold mb-4">{content.heading || 'Subscribe to our newsletter'}</h2>
                    <p className="text-lg opacity-80 mb-8">{content.subheading || 'Get the latest updates directly to your inbox.'}</p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-4 py-3 rounded-lg border border-border bg-background"
                            disabled
                        />
                        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium">
                            Subscribe
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- CTA (Call to Action) ---
    if (type === 'cta') {
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold mb-4">{content.heading || section.title || 'Ready to get started?'}</h2>
                    <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">{content.subheading || section.subtitle || 'Join us today.'}</p>
                    <button className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:opacity-90 shadow-lg transition-all">
                        {content.buttonText || content.ctaText || 'Get Started'}
                    </button>
                </div>
            </div>
        );
    }

    // --- Location ---
    if (type === 'location') {
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-2xl font-bold mb-6">{content.heading || section.title || 'Visit Us'}</h2>
                            <div className="space-y-4 text-lg">
                                {content.address && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-6 w-6 mt-1 opacity-70" />
                                        <div>
                                            <div className="font-semibold">Address</div>
                                            <div>{content.address}</div>
                                        </div>
                                    </div>
                                )}
                                {content.hours && (
                                    <div className="flex items-start gap-3">
                                        <Clock className="h-6 w-6 mt-1 opacity-70" />
                                        <div>
                                            <div className="font-semibold">Hours</div>
                                            <div>{content.hours}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="h-80 bg-gray-200 rounded-2xl overflow-hidden relative">
                            {/* Placeholder for Map */}
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
                                <div className="text-center">
                                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>Map View</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Menu (Restaurant/Cafe) ---
    if (type === 'menu') {
        const items = content.features || content.items || [1, 2, 3];
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl font-bold mb-4">{content.heading || section.title || 'Our Menu'}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 max-w-5xl mx-auto">
                        {items.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-baseline border-b border-border/50 pb-4">
                                <div>
                                    <h4 className="text-xl font-bold">{item.title || `Menu Item ${i + 1}`}</h4>
                                    <p className="text-muted-foreground text-sm mt-1">{item.description}</p>
                                </div>
                                <div className="text-xl font-semibold ml-4">{item.price || ''}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- Blog List / Preview ---
    if (type === 'blog-list' || type === 'blog-preview') {
        const posts = content.posts || [1, 2, 3];
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold mb-12 text-center">{content.heading || section.title || 'Latest Updates'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {posts.map((post: any, i: number) => (
                            <div key={i} className="bg-card rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow">
                                <div className="h-48 bg-muted flex items-center justify-center">
                                    <Image className="h-10 w-10 text-muted-foreground/50" />
                                </div>
                                <div className="p-6">
                                    <div className="text-sm text-primary mb-2">{post.date || 'Today'}</div>
                                    <h3 className="text-xl font-bold mb-2">{post.title || 'Blog Post Title'}</h3>
                                    <p className="text-muted-foreground">Short excerpt describing the blog post content...</p>
                                    <button className="mt-4 text-primary font-medium hover:underline">Read More</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- Project Grid ---
    if (type === 'project-grid') {
        const projects = content.projects || [1, 2];
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold mb-12 text-center">{content.heading || section.title || 'Our Projects'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {projects.map((proj: any, i: number) => (
                            <div key={i} className="group relative rounded-xl overflow-hidden aspect-video bg-gray-900">
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                                <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                                    <h3 className="text-2xl font-bold mb-1 translate-y-2 group-hover:translate-y-0 transition-transform">{proj.title || 'Project Name'}</h3>
                                    <p className="opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">{proj.description || 'Project Description'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- Contact Form ---
    if (type === 'contact-form') {
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto px-4 max-w-2xl">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold mb-4">{content.heading || section.title || 'Contact Us'}</h2>
                        <p className="opacity-80">Send us a message and we'll get back to you shortly.</p>
                    </div>
                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <input className="w-full px-4 py-2 rounded-lg border bg-background" placeholder="Your name" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <input className="w-full px-4 py-2 rounded-lg border bg-background" placeholder="Your email" type="email" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Message</label>
                            <textarea className="w-full px-4 py-2 rounded-lg border bg-background min-h-[120px]" placeholder="How can we help?" />
                        </div>
                        <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-opacity">
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // --- Team Section ---
    if (type === 'team') {
        const team = content.team || [1, 2, 3];
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold text-center mb-12">{content.heading || section.title || 'Our Team'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {team.map((member: any, i: number) => (
                            <div key={i} className="text-center group">
                                <div className="w-48 h-48 mx-auto rounded-full overflow-hidden mb-6 border-4 border-white shadow-lg relative">
                                    {member.image ? (
                                        <img src={member.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-400">
                                            {member.name?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold">{member.name || 'Team Member'}</h3>
                                <p className="text-primary font-medium mb-2">{member.role || 'Role'}</p>
                                {member.bio && <p className="text-sm text-muted-foreground">{member.bio}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- Integrations ---
    if (type === 'integrations') {
        const logos = content.logos || [1, 2, 3, 4];
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto px-4 text-center">
                    {content.heading && <h2 className="text-2xl font-bold mb-8 opacity-80">{content.heading}</h2>}
                    <div className="flex flex-wrap justify-center gap-12 items-center grayscale hover:grayscale-0 transition-all duration-500">
                        {logos.map((logo: any, i: number) => (
                            <div key={i} className="h-12 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
                                {typeof logo === 'string' ? <img src={logo} className="h-full object-contain" /> : <div className="w-32 h-8 bg-gray-300 rounded" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- Process ---
    if (type === 'process') {
        const steps = content.steps || [1, 2, 3];
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold text-center mb-16">{content.heading || section.title || 'Our Process'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {steps.map((step: any, i: number) => (
                            <div key={i} className="relative text-center">
                                {i !== steps.length - 1 && (
                                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-border -z-10" />
                                )}
                                <div className="w-16 h-16 bg-background border-2 border-primary rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold text-primary shadow-sm z-10 relative">
                                    {i + 1}
                                </div>
                                <h3 className="text-lg font-bold mb-2">{step.title || `Step ${i + 1}`}</h3>
                                <p className="text-sm text-muted-foreground">{step.description || 'Description of this step.'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- FAQ ---
    if (type === 'faq') {
        const faqs = content.faqs || [1, 2, 3];
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-2xl font-bold text-center mb-12">{content.heading || section.title || 'Frequently Asked Questions'}</h2>
                    <div className="space-y-4">
                        {faqs.map((faq: any, i: number) => (
                            <div key={i} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                                <h3 className="font-semibold text-lg mb-2 flex items-center justify-between">
                                    {faq.question || 'Question goes here?'}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {faq.answer || 'Detailed answer to the question provides valuable information to the user.'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- Image + Text (Story/About) ---
    if (type === 'image-text') {
        const reverse = content.imagePosition === 'right';
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto px-4">
                    <div className={`flex flex-col md:flex-row items-center gap-12 ${reverse ? 'md:flex-row-reverse' : ''}`}>
                        <div className="flex-1">
                            <div className="aspect-video md:aspect-square bg-gray-100 rounded-2xl overflow-hidden relative shadow-lg">
                                {content.image ? (
                                    <img src={content.image} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><Image className="w-12 h-12 text-gray-300" /></div>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold mb-6">{content.heading || section.title || 'Our Story'}</h2>
                            {content.subheading && <h3 className="text-xl font-medium text-primary mb-4">{content.subheading}</h3>}
                            <div className="prose prose-lg text-muted-foreground leading-relaxed">
                                {content.html ? (
                                    <div dangerouslySetInnerHTML={{ __html: content.html }} />
                                ) : (
                                    <p>{content.text || 'Content goes here...'}</p>
                                )}
                            </div>
                            {content.buttonText && (
                                <button className="mt-8 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-opacity">
                                    {content.buttonText}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Shipping Info ---
    if (type === 'shipping-info') {
        const infos = content.info || [1, 2, 3];
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold text-center mb-12">{content.heading || section.title || 'Shipping Information'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {infos.map((info: any, i: number) => (
                            <div key={i} className="text-center p-6 border border-border rounded-xl bg-card">
                                <h3 className="font-bold text-lg mb-2">{info.title}</h3>
                                <p className="text-sm text-muted-foreground">{info.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- Author ---
    if (type === 'author') {
        const author = content.author || {};
        return (
            <div style={section.styles} className="w-full py-12">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="flex flex-col md:flex-row items-center gap-8 bg-card border border-border p-8 rounded-2xl shadow-sm">
                        <div className="w-32 h-32 flex-shrink-0 rounded-full overflow-hidden border-4 border-background shadow-md">
                            {author.avatar ? (
                                <img src={author.avatar} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center"><Users className="w-8 h-8 text-gray-400" /></div>
                            )}
                        </div>
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-bold mb-1">{author.name || 'Author Name'}</h2>
                            <p className="text-primary font-medium mb-4">{author.role || 'Writer'}</p>
                            <p className="text-muted-foreground leading-relaxed">{author.bio || 'Author biography goes here...'}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return defaultContent;
};
