import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { WebsiteSection, SectionStyles, WebsiteSettings, WebsiteType } from '@/lib/websitesApi';
import { WebsiteSectionRenderer } from './WebsiteSectionRenderer';
import {
    GripVertical, Plus, Eye, Save, Settings, Layout, Type, Image, Star, DollarSign, ArrowLeft,
    HelpCircle, MessageSquare, Phone, Archive, Users, Briefcase, ListOrdered, Grid3X3,
    PlayCircle, Mail, BarChart3, Quote, Layers, Menu, Home, Award, Clock, Code, Zap,
    MapPin, Calendar, FileTextIcon, Globe, Shield, CheckCircle2, Target, ChevronLeft,
    ChevronRight, PanelLeft, PanelRight, Trash2, Copy, MoveUp, MoveDown, Lock, Unlock,
    AlignLeft, AlignCenter, AlignRight, Bold, Link, Heading1, List, Table, Columns,
    Sparkles, MousePointer, Hand, Maximize, Monitor, Tablet, Smartphone as SmartphoneIcon,
    Settings2, ShoppingCart, CreditCard, Package, Truck, Tag, Search, Filter, BookOpen,
    Video, Music, Mic, Camera, Upload, Download, Share2, Heart, ThumbsUp, MessageCircle,
    Bell, User, UserPlus, ExternalLink, TrendingUp, Activity, PieChart, BarChart,
    LineChart, Map, Feather, Cloud, Coffee, Building, Gift, Ticket, Plane, Car,
    Wifi, Power, Terminal, Folder, File, FileImage, Headphones, Play, Film,
    Clipboard, ClipboardList, Edit, Pen, Crop, Move, Fullscreen, Sidebar,
    PanelLeftClose, PanelRightClose, SplitSquareHorizontal, LayoutGrid, LayoutList,
    LayoutDashboard, Box, Hash, Minus, X, Check, ChevronDown, ChevronUp, ChevronsRight,
    MoveVertical, Pin, Mountain, TreePine, Waves, Flame, Leaf, Flower, Bird, Fish,
    Cherry, Grape, Apple, Banana, Carrot, Sandwich, Milk, Baby, Ribbon, Medal, Trophy,
    Guitar, Piano, Drum, EyeOff, ToggleLeft, Brackets, LifeBuoy, CheckSquare, Utensils,
    Info, Rss, ShoppingBag
} from 'lucide-react';

interface VisualWebsiteBuilderProps {
    initialSections?: WebsiteSection[];
    initialSettings?: WebsiteSettings;
    websiteId?: string;
    websiteType?: WebsiteType;
    onSave?: (data: { sections: WebsiteSection[]; settings: WebsiteSettings }) => void;
    initialPresetId?: string;
}

// Comprehensive element categories for the builder
const elementCategories = {
    layout: {
        label: 'Layout',
        icon: LayoutGrid,
        elements: [
            { type: 'container', icon: Box, label: 'Container' },
            { type: 'section', icon: Layout, label: 'Section' },
            { type: 'columns', icon: Columns, label: 'Columns' },
            { type: 'grid', icon: Grid3X3, label: 'Grid' },
            { type: 'divider', icon: Minus, label: 'Divider' },
            { type: 'spacer', icon: MoveVertical, label: 'Spacer' },
            { type: 'accordion', icon: Archive, label: 'Accordion' },
            { type: 'tabs', icon: Layers, label: 'Tabs' },
        ]
    },
    content: {
        label: 'Content',
        icon: Type,
        elements: [
            { type: 'heading', icon: Heading1, label: 'Heading' },
            { type: 'text', icon: Type, label: 'Text' },
            { type: 'paragraph', icon: AlignLeft, label: 'Paragraph' },
            { type: 'list', icon: List, label: 'List' },
            { type: 'quote', icon: Quote, label: 'Quote' },
            { type: 'code', icon: Code, label: 'Code Block' },
            { type: 'table', icon: Table, label: 'Table' },
        ]
    },
    media: {
        label: 'Media',
        icon: Image,
        elements: [
            { type: 'image', icon: Image, label: 'Image' },
            { type: 'gallery', icon: Grid3X3, label: 'Gallery' },
            { type: 'video', icon: PlayCircle, label: 'Video' },
            { type: 'audio', icon: Music, label: 'Audio' },
            { type: 'icon', icon: Star, label: 'Icon' },
            { type: 'icon-box', icon: Package, label: 'Icon Box' },
            { type: 'slider', icon: Image, label: 'Image Slider' },
            { type: 'carousel', icon: Image, label: 'Carousel' },
        ]
    },
    interactive: {
        label: 'Interactive',
        icon: MousePointer,
        elements: [
            { type: 'button', icon: Hand, label: 'Button' },
            { type: 'form', icon: ClipboardList, label: 'Form' },
            { type: 'input', icon: Type, label: 'Input Field' },
            { type: 'textarea', icon: FileTextIcon, label: 'Text Area' },
            { type: 'select', icon: ChevronDown, label: 'Dropdown' },
            { type: 'checkbox', icon: CheckSquare, label: 'Checkbox' },
            { type: 'radio', icon: Zap, label: 'Radio Button' }, // Replaced Circle with Zap to avoid conflict if necessary, though Circle is removed from import above.
            { type: 'search', icon: Search, label: 'Search' },
            { type: 'rating', icon: Star, label: 'Rating' },
            { type: 'toggle', icon: ToggleLeft, label: 'Toggle' },
        ]
    },
    navigation: {
        label: 'Navigation',
        icon: Menu,
        elements: [
            { type: 'header', icon: Menu, label: 'Header' },
            { type: 'navbar', icon: Menu, label: 'Navbar' },
            { type: 'menu', icon: List, label: 'Menu' },
            { type: 'breadcrumb', icon: ChevronRight, label: 'Breadcrumb' },
            { type: 'pagination', icon: ChevronsRight, label: 'Pagination' },
            { type: 'footer', icon: Home, label: 'Footer' },
            { type: 'sidebar', icon: Sidebar, label: 'Sidebar' },
            { type: 'mobile-menu', icon: Menu, label: 'Mobile Menu' },
        ]
    },
    marketing: {
        label: 'Marketing',
        icon: TrendingUp,
        elements: [
            { type: 'hero', icon: Layout, label: 'Hero Section' },
            { type: 'cta', icon: Phone, label: 'Call to Action' },
            { type: 'features', icon: Star, label: 'Features' },
            { type: 'benefits', icon: Target, label: 'Benefits' },
            { type: 'pricing', icon: DollarSign, label: 'Pricing Table' },
            { type: 'testimonials', icon: Quote, label: 'Testimonials' },
            { type: 'reviews', icon: Star, label: 'Reviews' },
            { type: 'social-proof', icon: Shield, label: 'Social Proof' },
            { type: 'stats', icon: BarChart3, label: 'Statistics' },
            { type: 'countdown', icon: Clock, label: 'Countdown' },
            { type: 'newsletter', icon: Mail, label: 'Newsletter' },
            { type: 'lead-form', icon: UserPlus, label: 'Lead Form' },
        ]
    },
    ecommerce: {
        label: 'E-Commerce',
        icon: ShoppingCart,
        elements: [
            { type: 'product-grid', icon: Grid3X3, label: 'Product Grid' },
            { type: 'product-card', icon: Package, label: 'Product Card' },
            { type: 'product-details', icon: FileTextIcon, label: 'Product Details' },
            { type: 'add-to-cart', icon: ShoppingCart, label: 'Add to Cart' },
            { type: 'cart', icon: ShoppingBag, label: 'Shopping Cart' },
            { type: 'checkout', icon: CreditCard, label: 'Checkout' },
            { type: 'product-categories', icon: Tag, label: 'Categories' },
            { type: 'product-filter', icon: Filter, label: 'Product Filter' },
            { type: 'price-range', icon: DollarSign, label: 'Price Range' },
            { type: 'wishlist', icon: Heart, label: 'Wishlist' },
            { type: 'compare', icon: BarChart, label: 'Compare Products' },
            { type: 'shipping', icon: Truck, label: 'Shipping Info' },
        ]
    },
    business: {
        label: 'Business',
        icon: Briefcase,
        elements: [
            { type: 'team', icon: Users, label: 'Team Members' },
            { type: 'services', icon: Briefcase, label: 'Services' },
            { type: 'portfolio', icon: Globe, label: 'Portfolio' },
            { type: 'case-studies', icon: FileTextIcon, label: 'Case Studies' },
            { type: 'clients', icon: Building, label: 'Client Logos' },
            { type: 'timeline', icon: Clock, label: 'Timeline' },
            { type: 'process', icon: ListOrdered, label: 'Process Steps' },
            { type: 'about', icon: Info, label: 'About Section' },
            { type: 'contact-info', icon: Phone, label: 'Contact Info' },
            { type: 'location', icon: MapPin, label: 'Location' },
            { type: 'map', icon: Map, label: 'Map' },
            { type: 'hours', icon: Clock, label: 'Business Hours' },
        ]
    },
    blog: {
        label: 'Blog',
        icon: BookOpen,
        elements: [
            { type: 'blog-grid', icon: Grid3X3, label: 'Blog Grid' },
            { type: 'blog-list', icon: List, label: 'Blog List' },
            { type: 'blog-post', icon: FileTextIcon, label: 'Blog Post' },
            { type: 'blog-sidebar', icon: Sidebar, label: 'Blog Sidebar' },
            { type: 'blog-categories', icon: Tag, label: 'Categories' },
            { type: 'blog-tags', icon: Hash, label: 'Tags' },
            { type: 'blog-author', icon: User, label: 'Author Box' },
            { type: 'blog-comments', icon: MessageCircle, label: 'Comments' },
            { type: 'blog-related', icon: Link, label: 'Related Posts' },
            { type: 'blog-archive', icon: Archive, label: 'Archive' },
        ]
    },
    social: {
        label: 'Social',
        icon: Share2,
        elements: [
            { type: 'social-icons', icon: Share2, label: 'Social Icons' },
            { type: 'social-feed', icon: Rss, label: 'Social Feed' },
            { type: 'share-buttons', icon: Share2, label: 'Share Buttons' },
            { type: 'follow-buttons', icon: UserPlus, label: 'Follow Buttons' },
            { type: 'instagram-feed', icon: Camera, label: 'Instagram Feed' },
            { type: 'twitter-feed', icon: Bird, label: 'Twitter Feed' },
            { type: 'facebook-feed', icon: ThumbsUp, label: 'Facebook Feed' },
        ]
    },
    advanced: {
        label: 'Advanced',
        icon: Settings2,
        elements: [
            { type: 'html', icon: Code, label: 'HTML' },
            { type: 'custom-code', icon: Terminal, label: 'Custom Code' },
            { type: 'embed', icon: Code, label: 'Embed' },
            { type: 'iframe', icon: Monitor, label: 'iFrame' },
            { type: 'shortcode', icon: Brackets, label: 'Shortcode' },
            { type: 'widget', icon: Package, label: 'Widget' },
            { type: 'animation', icon: Sparkles, label: 'Animation' },
            { type: 'parallax', icon: Layers, label: 'Parallax' },
            { type: 'modal', icon: Maximize, label: 'Modal/Popup' },
            { type: 'tooltip', icon: Info, label: 'Tooltip' },
            { type: 'progress-bar', icon: Activity, label: 'Progress Bar' },
            { type: 'counter', icon: Hash, label: 'Counter' },
        ]
    },
    faq: {
        label: 'FAQ & Help',
        icon: HelpCircle,
        elements: [
            { type: 'faq', icon: HelpCircle, label: 'FAQ' },
            { type: 'faq-accordion', icon: Archive, label: 'FAQ Accordion' },
            { type: 'help-center', icon: LifeBuoy, label: 'Help Center' },
            { type: 'help-docs', icon: BookOpen, label: 'Documentation' },
            { type: 'support-ticket', icon: Ticket, label: 'Support Ticket' },
        ]
    },
    comparison: {
        label: 'Comparison',
        icon: BarChart,
        elements: [
            { type: 'comparison-table', icon: Table, label: 'Comparison Table' },
            { type: 'before-after', icon: SplitSquareHorizontal, label: 'Before/After' },
            { type: 'vs-section', icon: BarChart, label: 'VS Section' },
        ]
    },
};

const SidebarDraggableItem: React.FC<{
    element: any;
    onClick: () => void;
}> = ({ element, onClick }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `sidebar-${element.type}`,
        data: {
            isSidebar: true,
            item: element,
        },
    });

    return (
        <div
            ref={setNodeRef}
            className={`
                relative flex flex-col items-center justify-center gap-2 p-3 
                border rounded-lg bg-white
                cursor-grab active:cursor-grabbing
                hover:border-blue-500 hover:shadow-sm
                transition-all duration-150 group
                ${isDragging ? 'opacity-50 ring-2 ring-blue-400' : 'border-gray-200'}
            `}
            {...listeners}
            {...attributes}
        >
            <element.icon className="h-6 w-6 text-gray-500 group-hover:text-blue-600 transition-colors" />
            <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700 text-center leading-tight">
                {element.label}
            </span>

            {/* Quick add button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onClick();
                }}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 
                    p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white 
                    transition-all duration-150"
                title={`Add ${element.label}`}
            >
                <Plus className="h-3 w-3" />
            </button>
        </div>
    );
};

export const VisualWebsiteBuilder: React.FC<VisualWebsiteBuilderProps> = ({
    initialSections = [],
    initialSettings = {
        seoTitle: 'Modern Website',
        seoDescription: 'Professional website',
        backgroundColor: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        accentColor: '#3b82f6',
    },
    websiteId,
    websiteType = 'landing-page',
    onSave,
}) => {
    const navigate = useNavigate();
    const [sections, setSections] = useState<WebsiteSection[]>(initialSections);
    const [settings, setSettings] = useState<WebsiteSettings>(initialSettings);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const [activeSidebarItem, setActiveSidebarItem] = useState<any>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const { setNodeRef: setDroppableRef } = useDroppable({ id: 'canvas-droppable' });

    useEffect(() => { if (initialSections?.length) setSections(initialSections); }, [initialSections]);
    useEffect(() => { if (initialSettings) setSettings(initialSettings); }, [initialSettings]);

    const handleDragStart = (e: DragStartEvent) => {
        setActiveId(e.active.id as string);
        if (e.active.data.current?.isSidebar) setActiveSidebarItem(e.active.data.current.item);
    };

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        setActiveSidebarItem(null);
        setActiveId(null);
        if (!over) return;

        if (active.data.current?.isSidebar) {
            const type = active.data.current.item.type;
            const newSection: WebsiteSection = {
                id: nanoid(),
                type,
                title: `${type.charAt(0).toUpperCase() + type.slice(1)} Section`, // Simple title
                content: {},
                styles: { padding: '4rem 2rem', textAlign: 'center' },
                visible: true,
                locked: false,
            };
            if (over.id !== 'canvas-droppable') {
                const overIndex = sections.findIndex(s => s.id === over.id);
                if (overIndex !== -1) {
                    const next = [...sections];
                    next.splice(overIndex + 1, 0, newSection);
                    setSections(next);
                    setSelectedSection(newSection.id);
                    return;
                }
            }
            setSections([...sections, newSection]);
            setSelectedSection(newSection.id);
        } else if (active.id !== over.id) {
            setSections(items => {
                const oldIdx = items.findIndex(i => i.id === active.id);
                const newIdx = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIdx, newIdx);
            });
        }
    };

    const addSection = (type: string) => {
        const newSec: WebsiteSection = {
            id: nanoid(), type, title: `${type.charAt(0).toUpperCase() + type.slice(1)} Section`, content: {},
            styles: { padding: '4rem 2rem', textAlign: 'center' },
            visible: true, locked: false
        };
        setSections([...sections, newSec]);
        setSelectedSection(newSec.id);
    };

    const duplicateSection = (id: string) => {
        const base = sections.find(s => s.id === id);
        if (!base) return;
        const copy = { ...base, id: nanoid(), title: `${base.title} (Copy)` };
        const idx = sections.findIndex(s => s.id === id);
        const next = [...sections];
        next.splice(idx + 1, 0, copy);
        setSections(next);
        setSelectedSection(copy.id);
    };

    const deleteSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id));
        if (selectedSection === id) setSelectedSection(null);
    };

    const updateSectionContent = (id: string, key: string, val: any) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, content: { ...s.content, [key]: val } } : s));
    };

    const updateSectionStyle = (id: string, key: string, val: any) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, styles: { ...s.styles, [key]: val } } : s));
    };

    const handleSave = () => onSave && onSave({ sections, settings });

    function SortableSection({ section, isSelected, onSelect, onDuplicate, onDelete }: any) {
        const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id, disabled: section.locked });
        const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
        return (
            <div
                ref={setNodeRef} style={style}
                className={`relative group border-2 ${isSelected ? 'border-blue-500 z-10' : 'border-transparent hover:border-blue-200'} transition-all bg-white`}
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
                {/* Drag Handle & Toolbar */}
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1 z-50 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    <div {...attributes} {...listeners} className="p-1 bg-blue-500 text-white rounded shadow-sm cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4 w-4" />
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="p-1 bg-white border border-gray-200 text-gray-600 rounded shadow-sm hover:text-blue-600"><Copy className="h-4 w-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 bg-white border border-gray-200 text-gray-600 rounded shadow-sm hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>

                <WebsiteSectionRenderer section={section} />
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
                {/* Toolbar */}
                <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/websites')} className="p-2 hover:bg-gray-100 rounded-md text-gray-600"><ArrowLeft className="h-5 w-5" /></button>
                        <span className="font-semibold text-gray-800">Website Builder</span>
                        <Badge variant="outline" className="text-xs font-normal">v2.0</Badge>
                    </div>
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button onClick={() => setViewMode('desktop')} className={`p-1.5 rounded-md ${viewMode === 'desktop' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><Monitor className="h-4 w-4" /></button>
                        <button onClick={() => setViewMode('mobile')} className={`p-1.5 rounded-md ${viewMode === 'mobile' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><SmartphoneIcon className="h-4 w-4" /></button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                            // Preview functionality - navigate to preview page with current website data
                            const previewData = {
                                sections: sections,
                                settings: settings,
                                websiteType: websiteType || 'landing-page'
                            };
                            // Store preview data in sessionStorage for the preview page to access
                            sessionStorage.setItem('websitePreviewData', JSON.stringify(previewData));
                            // Navigate to preview page with unique ID if available
                            const previewUrl = websiteId
                                ? `/websites/preview?websiteId=${websiteId}&preview=true`
                                : `/websites/preview?preview=true`;
                            window.open(previewUrl, '_blank');
                        }} className="text-gray-600"><Eye className="h-4 w-4 mr-2" /> Preview</Button>
                        <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700"><Save className="h-4 w-4 mr-2" /> Save</Button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar - Library */}
                    <aside className={`w-[300px] bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${!leftPanelOpen && '-ml-[300px]'}`}>
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-sm">Components</h3>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setLeftPanelOpen(false)}><ChevronLeft className="h-4 w-4" /></Button>
                        </div>
                        <div className="p-2">
                            <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><Input placeholder="Search elements..." className="pl-9 h-9 bg-gray-50 text-sm" /></div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {Object.entries(elementCategories).map(([key, cat]) => (
                                <div key={key}>
                                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 flex items-center gap-2">{cat.label}</h4>
                                    <div className="grid grid-cols-2 gap-2">{cat.elements.map(el => (<SidebarDraggableItem key={el.type} element={el} onClick={() => addSection(el.type)} />))}</div>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Canvas Area */}
                    <main className="flex-1 bg-gray-100/50 overflow-auto relative p-8 flex justify-center" ref={setDroppableRef}>
                        <div className={`transition-all duration-300 bg-white shadow-sm border border-gray-200 min-h-[800px] ${viewMode === 'desktop' ? 'w-full max-w-[1280px]' : 'w-[375px]'}`}>
                            {!leftPanelOpen && <button onClick={() => setLeftPanelOpen(true)} className="absolute left-4 top-4 p-2 bg-white rounded-md shadow-md border border-gray-200 text-gray-600 hover:text-blue-600 z-50"><PanelLeft className="h-5 w-5" /></button>}
                            {!rightPanelOpen && <button onClick={() => setRightPanelOpen(true)} className="absolute right-4 top-4 p-2 bg-white rounded-md shadow-md border border-gray-200 text-gray-600 hover:text-blue-600 z-50"><PanelRight className="h-5 w-5" /></button>}

                            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                {sections.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-20">
                                        <Layout className="h-16 w-16 mb-4 opacity-20" />
                                        <p className="text-lg font-medium">Drag and drop components here</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col">{sections.map(s => <SortableSection key={s.id} section={s} isSelected={selectedSection === s.id} onSelect={() => setSelectedSection(s.id)} onDuplicate={() => duplicateSection(s.id)} onDelete={() => deleteSection(s.id)} />)}</div>
                                )}
                            </SortableContext>
                        </div>
                    </main>

                    {/* Drag Overlay - Moved here to be inside the combined DndContext */}
                    <DragOverlay dropAnimation={null}>
                        {activeSidebarItem ? (
                            <div className="w-48 bg-white border border-blue-500 shadow-xl rounded-lg p-4 flex items-center gap-3 z-50">
                                <activeSidebarItem.icon className="text-blue-500 h-5 w-5" />
                                <span className="font-semibold text-sm">{activeSidebarItem.label}</span>
                            </div>
                        ) : activeId ? (
                            <div className="w-full h-20 bg-blue-50 border border-blue-200 text-blue-500 flex items-center justify-center rounded dashed-border z-50">
                                <span className="text-sm font-medium">Moving...</span>
                            </div>
                        ) : null}
                    </DragOverlay>

                    {/* Right Sidebar - Settings */}
                    <aside className={`w-[320px] bg-white border-l border-gray-200 flex flex-col transition-all duration-300 z-20 ${!rightPanelOpen && '-mr-[320px] hidden'}`}>
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Settings2 className="h-4 w-4 text-gray-500" />
                                <h3 className="font-semibold text-sm">Properties</h3>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setRightPanelOpen(false)}><ChevronRight className="h-4 w-4" /></Button>
                        </div>

                        {selectedSection ? (
                            <div className="flex-1 overflow-y-auto p-0">
                                <Tabs defaultValue="content" className="w-full">
                                    <div className="px-4 pt-4">
                                        <TabsList className="w-full grid grid-cols-2">
                                            <TabsTrigger value="content">Content</TabsTrigger>
                                            <TabsTrigger value="style">Style</TabsTrigger>
                                        </TabsList>
                                    </div>
                                    <div className="p-4 pb-20">
                                        <TabsContent value="content" className="space-y-6 data-[state=active]:animate-in data-[state=active]:slide-in-from-right-2 duration-300">
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <Label className="text-[12px] text-gray-500 uppercase font-bold tracking-wider">Internal Name</Label>
                                                    <Input
                                                        value={sections.find(s => s.id === selectedSection)?.title || ''}
                                                        onChange={(e) => setSections(prev => prev.map(s => s.id === selectedSection ? { ...s, title: e.target.value } : s))}
                                                        className="h-8 bg-gray-50 text-sm"
                                                    />
                                                </div>

                                                <Separator />

                                                {(() => {
                                                    const section = sections.find(s => s.id === selectedSection);
                                                    if (!section) return null;

                                                    const commonFields = [
                                                        { key: 'heading', label: 'Main Heading', type: 'text' },
                                                        { key: 'subheading', label: 'Section Subheading', type: 'textarea' },
                                                        { key: 'text', label: 'Body Text', type: 'textarea' },
                                                        { key: 'html', label: 'Custom HTML', type: 'textarea' },
                                                        { key: 'ctaText', label: 'Primary Button Label', type: 'text' },
                                                        { key: 'secondaryCtaText', label: 'Secondary Button Label', type: 'text' },
                                                        { key: 'logoText', label: 'Logo Text', type: 'text' },
                                                        { key: 'image', label: 'Background Image URL', type: 'text' },
                                                        { key: 'videoUrl', label: 'Video URL', type: 'text' },
                                                        { key: 'search', label: 'Show Search icon', type: 'switch' },
                                                        { key: 'columnCount', label: 'Number of Columns', type: 'slider', max: 6, min: 1 },
                                                    ];

                                                    const type = section.type;
                                                    let visibleFields = [];

                                                    if (type === 'hero') visibleFields = ['heading', 'subheading', 'ctaText', 'secondaryCtaText', 'image'];
                                                    else if (type === 'navbar') visibleFields = ['logoText', 'ctaText', 'search'];
                                                    else if (type === 'features' || type === 'benefits') visibleFields = ['heading', 'subheading'];
                                                    else if (type === 'cta') visibleFields = ['heading', 'subheading', 'ctaText'];
                                                    else if (type === 'text' || type === 'paragraph') visibleFields = ['heading', 'text', 'html'];
                                                    else if (type === 'image') visibleFields = ['image', 'caption'];
                                                    else if (type === 'grid' || type === 'columns') visibleFields = ['heading', 'subheading', 'columnCount'];
                                                    else if (type === 'video') visibleFields = ['heading', 'videoUrl'];
                                                    else if (type === 'newsletter') visibleFields = ['heading', 'subheading', 'ctaText'];
                                                    else visibleFields = commonFields.map(f => f.key).filter(k => section.content[k] !== undefined || ['heading', 'text'].includes(k));

                                                    return commonFields.filter(f => visibleFields.includes(f.key)).map(field => (
                                                        <div key={field.key} className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-[12px] text-gray-400 uppercase font-black tracking-widest">{field.label}</Label>
                                                                {field.type === 'switch' && (
                                                                    <Switch
                                                                        checked={!!section.content[field.key]}
                                                                        onCheckedChange={(checked) => updateSectionContent(section.id, field.key, checked)}
                                                                    />
                                                                )}
                                                            </div>
                                                            {field.type === 'textarea' && (
                                                                <Textarea
                                                                    value={section.content[field.key] || ''}
                                                                    onChange={(e) => updateSectionContent(section.id, field.key, e.target.value)}
                                                                    className="bg-white min-h-[80px] text-sm"
                                                                />
                                                            )}
                                                            {field.type === 'text' && (
                                                                <Input
                                                                    value={section.content[field.key] || ''}
                                                                    onChange={(e) => updateSectionContent(section.id, field.key, e.target.value)}
                                                                    className="h-9 bg-white text-sm"
                                                                />
                                                            )}
                                                            {field.type === 'slider' && (
                                                                <div className="flex items-center gap-4">
                                                                    <Slider
                                                                        value={[section.content[field.key] || field.min || 0]}
                                                                        max={field.max}
                                                                        min={field.min}
                                                                        step={1}
                                                                        onValueChange={([val]) => updateSectionContent(section.id, field.key, val)}
                                                                        className="flex-1"
                                                                    />
                                                                    <span className="text-xs font-mono">{section.content[field.key] || field.min}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ));
                                                })()}

                                                {(sections.find(s => s.id === selectedSection)?.type === 'features' || sections.find(s => s.id === selectedSection)?.type === 'pricing') && (
                                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                                                        <Sparkles className="h-3 w-3 mb-1" />
                                                        Nested items (features, plans) are managed via templates. Full item editing coming soon.
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="style" className="space-y-6">
                                            <div className="space-y-6">
                                                {/* Colors Group */}
                                                <div className="space-y-4">
                                                    <h4 className="text-[12px] font-bold text-gray-900 border-b pb-1 uppercase tracking-wider">Colors & Background</h4>
                                                    <div className="space-y-3">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs text-gray-500">Background Color</Label>
                                                            <div className="flex gap-2">
                                                                <div className="relative h-8 w-8 rounded overflow-hidden border">
                                                                    <input
                                                                        type="color"
                                                                        className="absolute inset-0 w-full h-full p-0 border-none cursor-pointer scale-150"
                                                                        value={sections.find(s => s.id === selectedSection)?.styles?.backgroundColor || '#ffffff'}
                                                                        onChange={(e) => updateSectionStyle(selectedSection, 'backgroundColor', e.target.value)}
                                                                    />
                                                                </div>
                                                                <Input
                                                                    className="flex-1 h-8 text-xs font-mono"
                                                                    value={sections.find(s => s.id === selectedSection)?.styles?.backgroundColor || '#ffffff'}
                                                                    onChange={(e) => updateSectionStyle(selectedSection, 'backgroundColor', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs text-gray-500">Text Color</Label>
                                                            <div className="flex gap-2">
                                                                <div className="relative h-8 w-8 rounded overflow-hidden border">
                                                                    <input
                                                                        type="color"
                                                                        className="absolute inset-0 w-full h-full p-0 border-none cursor-pointer scale-150"
                                                                        value={sections.find(s => s.id === selectedSection)?.styles?.color || '#000000'}
                                                                        onChange={(e) => updateSectionStyle(selectedSection, 'color', e.target.value)}
                                                                    />
                                                                </div>
                                                                <Input
                                                                    className="flex-1 h-8 text-xs font-mono"
                                                                    value={sections.find(s => s.id === selectedSection)?.styles?.color || '#000000'}
                                                                    onChange={(e) => updateSectionStyle(selectedSection, 'color', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Typography Group */}
                                                <div className="space-y-4">
                                                    <h4 className="text-[12px] font-bold text-gray-900 border-b pb-1 uppercase tracking-wider">Typography</h4>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs text-gray-500">Align</Label>
                                                            <Select value={sections.find(s => s.id === selectedSection)?.styles?.textAlign || 'left'} onValueChange={(v) => updateSectionStyle(selectedSection, 'textAlign', v)}>
                                                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="left">Left</SelectItem>
                                                                    <SelectItem value="center">Center</SelectItem>
                                                                    <SelectItem value="right">Right</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs text-gray-500">Weight</Label>
                                                            <Select value={sections.find(s => s.id === selectedSection)?.styles?.fontWeight || 'normal'} onValueChange={(v) => updateSectionStyle(selectedSection, 'fontWeight', v)}>
                                                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="normal">Normal</SelectItem>
                                                                    <SelectItem value="500">Medium</SelectItem>
                                                                    <SelectItem value="600">SemiBold</SelectItem>
                                                                    <SelectItem value="700">Bold</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Layout Group */}
                                                <div className="space-y-4">
                                                    <h4 className="text-[12px] font-bold text-gray-900 border-b pb-1 uppercase tracking-wider">Spacing & Borders</h4>
                                                    <div className="space-y-3">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs text-gray-500">Padding</Label>
                                                            <Input
                                                                className="h-8 text-xs"
                                                                value={sections.find(s => s.id === selectedSection)?.styles?.padding || ''}
                                                                onChange={(e) => updateSectionStyle(selectedSection, 'padding', e.target.value)}
                                                                placeholder="e.g. 4rem 2rem"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs text-gray-500">Corner Radius ({sections.find(s => s.id === selectedSection)?.styles?.borderRadius || '0'}px)</Label>
                                                            <Slider
                                                                value={[parseInt(sections.find(s => s.id === selectedSection)?.styles?.borderRadius || '0')]}
                                                                max={100}
                                                                step={1}
                                                                onValueChange={([v]) => updateSectionStyle(selectedSection, 'borderRadius', `${v}px`)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-8 text-center">
                                <MousePointer className="h-10 w-10 mb-2 opacity-20" />
                                <p className="text-sm">Select an element on the canvas to edit its properties.</p>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </DndContext>
    );
};
