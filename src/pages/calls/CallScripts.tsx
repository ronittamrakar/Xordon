import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  FileTextIcon,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Tag,
  Settings,
  Save,
  X,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  RotateCcw,
  Phone,
  PhoneOff,
  Building2,
  User,
  MapPin,
  Calendar,
  Briefcase,
  Hash,
  ChevronDown,
  Check,
  FolderOpen,
  Bot,
  Loader2,
  Sparkles,
  Archive
} from 'lucide-react';
import { api, CallDisposition, CallScript } from '@/lib/api';

// Extended variable categories with more variables
const VARIABLE_CATEGORIES = {
  contact: {
    label: 'Contact Info',
    icon: User,
    color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    variables: [
      { name: 'firstName', description: 'Contact first name' },
      { name: 'lastName', description: 'Contact last name' },
      { name: 'fullName', description: 'Contact full name' },
      { name: 'email', description: 'Contact email address' },
      { name: 'phone', description: 'Contact phone number' },
      { name: 'mobile', description: 'Contact mobile number' },
      { name: 'title', description: 'Job title' },
      { name: 'department', description: 'Department name' },
    ]
  },
  company: {
    label: 'Company Info',
    icon: Building2,
    color: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    variables: [
      { name: 'company', description: 'Company name' },
      { name: 'companySize', description: 'Company size/employees' },
      { name: 'industry', description: 'Industry type' },
      { name: 'website', description: 'Company website' },
      { name: 'revenue', description: 'Annual revenue' },
    ]
  },
  location: {
    label: 'Location',
    icon: MapPin,
    color: 'bg-green-100 text-green-700 hover:bg-green-200',
    variables: [
      { name: 'address', description: 'Street address' },
      { name: 'city', description: 'City name' },
      { name: 'state', description: 'State/Province' },
      { name: 'province', description: 'Province' },
      { name: 'country', description: 'Country' },
      { name: 'zipCode', description: 'ZIP/Postal code' },
      { name: 'timezone', description: 'Contact timezone' },
      { name: 'serviceArea1', description: 'Service area 1' },
      { name: 'serviceArea2', description: 'Service area 2' },
      { name: 'serviceArea3', description: 'Service area 3' },
    ]
  },
  call: {
    label: 'Call Info',
    icon: Phone,
    color: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
    variables: [
      { name: 'callDuration', description: 'Call length (e.g., "3:45")' },
      { name: 'callOutcome', description: 'Result (Answered, Voicemail, etc.)' },
      { name: 'callTime', description: 'Time of call' },
      { name: 'callDate', description: 'Date of call' },
      { name: 'callbackNumber', description: 'Number to call back' },
      { name: 'voicemailDuration', description: 'Voicemail length' },
      { name: 'previousCallDate', description: 'Last call date' },
      { name: 'totalCalls', description: 'Total calls made' },
    ]
  },
  agent: {
    label: 'Agent Info',
    icon: Briefcase,
    color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
    variables: [
      { name: 'agentName', description: 'Agent full name' },
      { name: 'agentFirstName', description: 'Agent first name' },
      { name: 'agentEmail', description: 'Agent email' },
      { name: 'agentPhone', description: 'Agent direct line' },
      { name: 'agentExtension', description: 'Agent extension' },
      { name: 'agentTitle', description: 'Agent job title' },
    ]
  },
  campaign: {
    label: 'Campaign',
    icon: Hash,
    color: 'bg-pink-100 text-pink-700 hover:bg-pink-200',
    variables: [
      { name: 'campaignName', description: 'Campaign name' },
      { name: 'sequenceStep', description: 'Current step number' },
      { name: 'totalSteps', description: 'Total steps in sequence' },
      { name: 'campaignStartDate', description: 'Campaign start date' },
      { name: 'unsubscribeUrl', description: 'Unsubscribe link' },
    ]
  },
  datetime: {
    label: 'Date & Time',
    icon: Calendar,
    color: 'bg-teal-100 text-teal-700 hover:bg-teal-200',
    variables: [
      { name: 'currentDate', description: 'Today\'s date' },
      { name: 'currentTime', description: 'Current time' },
      { name: 'currentDay', description: 'Day of week' },
      { name: 'currentMonth', description: 'Current month' },
      { name: 'currentYear', description: 'Current year' },
    ]
  },
  custom: {
    label: 'Custom Fields',
    icon: Settings,
    color: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    variables: [
      { name: 'custom1', description: 'Custom field 1' },
      { name: 'custom2', description: 'Custom field 2' },
      { name: 'custom3', description: 'Custom field 3' },
      { name: 'notes', description: 'Contact notes' },
      { name: 'leadSource', description: 'Lead source' },
      { name: 'leadScore', description: 'Lead score' },
    ]
  }
};

// Default categories for scripts
const DEFAULT_CATEGORIES = [
  'General',
  'Sales',
  'Support',
  'Follow-up',
  'Cold Call',
  'Warm Lead',
  'Appointment Setting',
  'Product Demo',
  'Objection Handling',
  'Closing',
  'Web Development',
  'E-commerce',
  'Mobile Optimization',
  'Website Redesign',
  'SEO & Content',
  'Lead Generation'
];

// Default tags
const DEFAULT_TAGS = [
  'B2B',
  'B2C',
  'Enterprise',
  'SMB',
  'Inbound',
  'Outbound',
  'High Priority',
  'New Lead',
  'Existing Customer',
  'Upsell',
  'Web Development',
  'E-commerce',
  'Mobile',
  'SEO',
  'Lead Generation',
  'Conversion Optimization',
  'Website Audit',
  'Redesign'
];

interface ObjectionRebuttal {
  objection: string;
  rebuttal: string;
}

interface ScriptFormData {
  name: string;
  description: string;
  content: string;
  rebuttals: string;
  objections: ObjectionRebuttal[];
  category: string;
  tags: string[];
  variables: string[];
}

interface DispositionFormData {
  name: string;
  description: string;
  category: 'positive' | 'negative' | 'neutral' | 'follow_up';
  color: string;
  isActive: boolean;
}

const DEFAULT_SCRIPTS_DATA = [
  {
    name: "Cold Call - General Introduction",
    description: "Standard opening script for new prospects",
    category: "Cold Call",
    tags: ["Outbound", "New Lead"],
    content: `<p>Hi <strong>{{firstName}}</strong>, this is <strong>{{agentName}}</strong> calling from <strong>{{company}}</strong>. How are you doing today?</p><p><br></p><p>I'm calling because we help companies like <strong>{{company}}</strong> in the <strong>{{industry}}</strong> industry to streamline their operations.</p><p><br></p><p>I noticed you are the <strong>{{title}}</strong> and thought this might be relevant to your work.</p><p><br></p><p>Do you have 30 seconds to hear how we could help you save time?</p>`,
    rebuttals: `Objection: I'm busy
 Rebuttal: I completely understand. I can be very brief. What's the best time to call you back?

 Objection: Send me an email
 Rebuttal: I'd be happy to. To make sure I send you the most relevant information, could you tell me what your biggest challenge is right now?`
  },
  {
    name: "SaaS - Demo Request Follow-up",
    description: "Follow up with someone who requested a demo",
    category: "Sales",
    tags: ["Inbound", "SaaS"],
    content: `<p>Hi <strong>{{firstName}}</strong>, this is <strong>{{agentName}}</strong> from <strong>{{company}}</strong>.</p><p><br></p><p>I saw that you recently requested a demo of our platform. I wanted to reach out and see if you had any specific goals in mind for <strong>{{company}}</strong> that you'd like me to focus on during our session?</p><p><br></p><p>Also, I noticed you're in the <strong>{{industry}}</strong> space—we've actually helped several companies like yours reduce their <strong>{{custom1}}</strong> by up to 30%.</p><p><br></p><p>Does <strong>{{currentDay}}</strong> at <strong>{{currentTime}}</strong> work for a quick 15-minute walkthrough?</p>`,
    rebuttals: `Objection: Just looking for pricing
 Rebuttal: I can certainly give you a range, but since our solution is tailored to your specific needs like {{companySize}}, a quick chat helps me give you an accurate quote.

 Objection: We already use a competitor
 Rebuttal: That's great—it means you already value this type of solution. Many of our clients switched from competitors because they needed better {{custom2}} and more reliable {{custom3}}.`
  },
  {
    name: "Real Estate - New Lead Outreach",
    description: "Initial call to a new real estate lead",
    category: "Sales",
    tags: ["Real Estate", "Outbound"],
    content: `<p>Hi <strong>{{firstName}}</strong>, this is <strong>{{agentName}}</strong> with <strong>{{company}}</strong>.</p><p><br></p><p>I'm calling because I saw you were looking at some properties in <strong>{{city}}</strong> on our website recently.</p><p><br></p><p>Are you looking for a new home for yourself, or are you more interested in investment opportunities in the <strong>{{state}}</strong> area?</p><p><br></p><p>I have a few off-market listings in <strong>{{serviceArea1}}</strong> that haven't hit the MLS yet. Would you be interested in seeing those?</p>`,
    rebuttals: `Objection: I'm just browsing
 Rebuttal: No problem at all! Most people start that way. If I set you up with a custom alert for {{city}}, would that be helpful for your research?

 Objection: I already have an agent
 Rebuttal: That's good to hear. Are you committed to a long-term agreement with them, or are you open to seeing exclusive listings that other agents might not have access to?`
  },
  {
    name: "Recruitment - Candidate Screening",
    description: "Initial screening call for a potential candidate",
    category: "Support",
    tags: ["Recruitment", "HR"],
    content: `<p>Hello <strong>{{firstName}}</strong>, this is <strong>{{agentName}}</strong> from the talent acquisition team at <strong>{{company}}</strong>.</p><p><br></p><p>I came across your profile and was really impressed with your background as a <strong>{{title}}</strong>.</p><p><br></p><p>We're currently looking for someone to join our <strong>{{department}}</strong> team, and I wanted to see if you're open to hearing about new opportunities right now?</p><p><br></p><p>Do you have a few minutes to discuss your experience with <strong>{{custom1}}</strong>?</p>`,
    rebuttals: `Objection: I'm happy where I am
 Rebuttal: I'm glad to hear that! It's always best to look when you're not desperate. Even if now isn't the right time, I'd love to stay connected for future roles in {{industry}}.

 Objection: What is the salary range?
 Rebuttal: We're very competitive for the {{title}} role. The range depends on experience, but I can tell you our benefits include {{custom2}} and {{custom3}}.`
  },
  {
    name: "Customer Support - Proactive Check-in",
    description: "Checking in with existing customers to ensure satisfaction",
    category: "Support",
    tags: ["Existing Customer", "Retention"],
    content: `<p>Hi <strong>{{firstName}}</strong>, this is <strong>{{agentName}}</strong> from <strong>{{company}}</strong>.</p><p><br></p><p>I'm your dedicated account manager, and I wanted to reach out personally to see how everything is going with your account.</p><p><br></p><p>I noticed you've been using our <strong>{{custom1}}</strong> feature quite a bit lately. Is there anything we can do to make that experience even better for you at <strong>{{company}}</strong>?</p><p><br></p><p>Also, we just released a new update for <strong>{{industry}}</strong> clients—would you like me to send over some info on that?</p>`,
    rebuttals: `Objection: I'm having a technical issue
 Rebuttal: I'm sorry to hear that. I can actually look into your {{custom2}} right now, or I can escalate this to our senior support team immediately.

 Objection: It's too expensive
 Rebuttal: I understand budget is always a concern. Have you had a chance to see the ROI from {{custom3}}? I'd be happy to review your usage and see if we can optimize your plan.`
  },
  {
    name: "Appointment Setting - B2B",
    description: "Setting up a meeting for a sales representative",
    category: "Appointment Setting",
    tags: ["B2B", "Outbound"],
    content: `<p>Hi <strong>{{firstName}}</strong>, <strong>{{agentName}}</strong> here from <strong>{{company}}</strong>.</p><p><br></p><p>We've been working with several companies in <strong>{{city}}</strong> to help them automate their <strong>{{department}}</strong> workflows.</p><p><br></p><p>I'm not the one who handles the technical side, but I'd love to put you in touch with our specialist who can show you how we saved <strong>{{custom1}}</strong> over 20 hours a week.</p><p><br></p><p>Would <strong>{{currentDay}}</strong> morning or afternoon work better for a 10-minute intro call?</p>`,
    rebuttals: `Objection: We don't have the budget
 Rebuttal: I completely understand. This call isn't about a purchase today—it's just to show you what's possible so you have the info when you are ready to scale.

 Objection: I'm not the decision maker
 Rebuttal: Thanks for letting me know. Who would be the best person to speak with regarding {{department}} efficiency? I'd love to include them in the conversation.`
  },
  {
    name: "Web Development - Website Audit",
    description: "Calling to offer a free website audit and consultation",
    category: "Sales",
    tags: ["Web Development", "Outbound"],
    content: `<p>Hi <strong>{{firstName}}</strong>, this is <strong>{{agentName}}</strong> from <strong>{{company}}</strong>. I was reviewing websites in the <strong>{{city}}</strong> area and came across <strong>{{company}}</strong>'s site.</p><p><br></p><p>I noticed a few opportunities to improve your site's performance and user experience. We specialize in helping businesses like yours get more leads and conversions from their websites.</p><p><br></p><p>Would you be interested in a free website audit? I can identify 3-5 specific improvements that could increase your conversions by 20-40%.</p>`,
    rebuttals: `Objection: We're happy with our current website
 Rebuttal: That's great to hear! Most of our clients said the same thing initially. The audit is completely free and takes just 10 minutes. Even if you're happy with your site, you might discover some easy wins you hadn't considered.

 Objection: We don't have budget for a website right now
 Rebuttal: I understand budget is always a consideration. The audit is free, and I can show you both quick fixes you can implement yourself and longer-term improvements. Many of our clients start with the low-cost changes and see immediate results.

 Objection: We already have a web developer
 Rebuttal: That's excellent! Having a developer means you value your online presence. Our audit might reveal opportunities your current developer hasn't had time to address, or we could provide a second opinion on your current strategy.`
  },
  {
    name: "Web Development - E-commerce Optimization",
    description: "Calling e-commerce businesses about conversion optimization",
    category: "Sales",
    tags: ["E-commerce", "Web Development"],
    content: `<p>Hi <strong>{{firstName}}</strong>, this is <strong>{{agentName}}</strong> from <strong>{{company}}</strong>. I was looking at online stores in the <strong>{{industry}}</strong> space and noticed <strong>{{company}}</strong> has a great product line.</p><p><br></p><p>We specialize in e-commerce conversion optimization, and I'd estimate your site could be converting 30-50% better with some strategic improvements.</p><p><br></p><p>Are you currently tracking your conversion rates and shopping cart abandonment? I'd love to show you how we've helped similar businesses in <strong>{{city}}</strong> increase their online sales significantly.</p>`,
    rebuttals: `Objection: Our sales are fine as they are
 Rebuttal: I'm glad to hear sales are going well! Even successful e-commerce sites typically leave 20-40% of potential revenue on the table. A quick analysis could reveal easy wins that boost your profits without increasing your marketing spend.

 Objection: We don't know how to track conversions
 Rebuttal: That's actually very common, and it's one of the first things we help with. Understanding your current performance is crucial before making improvements. I can walk you through some simple tracking methods during our consultation.

 Objection: We tried web optimization before and it didn't work
 Rebuttal: I understand your concern. Many businesses have had poor experiences with generic solutions. Our approach is highly customized based on your specific audience, products, and current setup. We start with a detailed analysis before making any recommendations.`
  },
  {
    name: "Web Development - Mobile Optimization",
    description: "Calling about mobile responsiveness and speed issues",
    category: "Sales",
    tags: ["Mobile", "Web Development"],
    content: `<p>Hi <strong>{{firstName}}</strong>, this is <strong>{{agentName}}</strong> from <strong>{{company}}</strong>. I was checking mobile performance for businesses in <strong>{{city}}</strong> and noticed <strong>{{company}}</strong>'s website has some mobile optimization opportunities.</p><p><br></p><p>With over 60% of web traffic coming from mobile devices now, and Google prioritizing mobile-friendly sites, this could be affecting your search rankings and user experience.</p><p><br></p><p>We specialize in mobile optimization and speed improvements. Would you be interested in a quick analysis of your site's mobile performance? I can show you specific issues that might be costing you visitors and conversions.</p>`,
    rebuttals: `Objection: Our site works fine on mobile
 Rebuttal: Many sites appear to work but have hidden performance issues. Google's mobile-first indexing means even small speed or usability problems can hurt your search rankings. A professional analysis can reveal issues you might not notice as a site owner.

 Objection: Mobile traffic isn't important for our business
 Rebuttal: Even if your primary customers aren't browsing on phones, they likely research on mobile before making desktop purchases. Plus, Google's mobile-first indexing affects all your search visibility, not just mobile traffic.

 Objection: We don't have time for website changes right now
 Rebuttal: I understand you're busy. The analysis itself is quick, and we can prioritize improvements based on your timeline. Some mobile fixes can be implemented in a single afternoon with immediate benefits.`
  },
  {
    name: "Web Development - Website Redesign",
    description: "Calling about outdated website design and technology",
    category: "Sales",
    tags: ["Web Design", "Redesign"],
    content: `<p>Hi <strong>{{firstName}}</strong>, this is <strong>{{agentName}}</strong> from <strong>{{company}}</strong>. I was reviewing websites for businesses in the <strong>{{industry}}</strong> industry and noticed <strong>{{company}}</strong> could benefit from a modern website update.</p><p><br></p><p>Your current site appears to be using older technology that may not be optimized for today's web standards. This could be affecting your search rankings, user experience, and ultimately, your conversions.</p><p><br></p><p>We specialize in modern website redesigns that not only look great but also drive measurable business results. Would you be interested in discussing how a new website could help grow your business?</p>`,
    rebuttals: `Objection: Our website is working fine
 Rebuttal: If it's working, that's great! However, websites from even 3-4 years ago are often using outdated technology that can't compete with modern sites. A redesign isn't just about looks—it's about performance, security, and staying competitive in search results.

 Objection: A website redesign is too expensive
 Rebuttal: I understand cost is a concern. Many businesses are surprised to learn that modern development methods have actually made quality websites more affordable than ever. Plus, a well-designed site typically pays for itself through increased conversions and reduced maintenance costs.

 Objection: We don't want to disrupt our current site
 Rebuttal: That's a valid concern. We always build the new site alongside your existing one, so there's no downtime or disruption to your current business. We only go live when everything is perfect and you're completely ready.`
  },
  {
    name: "Web Development - SEO & Content Strategy",
    description: "Calling about search engine optimization and content marketing",
    category: "Sales",
    tags: ["SEO", "Content Marketing"],
    content: `<p>Hi <strong>{{firstName}}</strong>, this is <strong>{{agentName}}</strong> from <strong>{{company}}</strong>. I was analyzing online visibility for businesses in <strong>{{city}}</strong> and noticed <strong>{{company}}</strong> has opportunities to improve your search engine rankings.</p><p><br></p><p>We specialize in SEO and content strategy for businesses like yours. With the right approach, you could be found by hundreds more potential customers searching for your products or services every month.</p><p><br></p><p>Are you currently tracking your website's performance in search engines? I'd love to show you how we've helped similar businesses in your area significantly increase their organic traffic and qualified leads.</p>`,
    rebuttals: `Objection: We tried SEO before and it didn't work
 Rebuttal: I understand your frustration. Many businesses have had poor experiences with outdated or spammy SEO tactics. Modern SEO is about creating valuable content and technical optimization. We focus on sustainable, white-hat strategies that build long-term results.

 Objection: SEO takes too long to see results
 Rebuttal: While SEO is a long-term strategy, we typically see initial improvements in 60-90 days, with significant growth over 6-12 months. Plus, unlike paid advertising, SEO results compound over time and don't stop when you stop paying.

 Objection: We don't have content to write about
 Rebuttal: Every business has valuable expertise to share. We help identify topics your ideal customers are searching for and create content that positions you as an expert in your field. It's not about writing for writing's sake—it's about attracting your ideal clients.`
  },
  {
    name: "Web Development - Lead Generation",
    description: "Calling about improving website lead generation capabilities",
    category: "Sales",
    tags: ["Lead Generation", "Conversion"],
    content: `<p>Hi <strong>{{firstName}}</strong>, this is <strong>{{agentName}}</strong> from <strong>{{company}}</strong>. I was analyzing lead generation for businesses in the <strong>{{industry}}</strong> space and noticed <strong>{{company}}</strong> could be generating significantly more leads from your website.</p><p><br></p><p>We specialize in lead generation optimization. Most websites we analyze are only converting 1-3% of their visitors, when with the right strategy, they could be converting 5-10% or more.</p><p><br></p><p>Are you currently tracking how many leads your website generates? I'd love to show you how we've helped businesses similar to yours double or even triple their online lead generation.</p>`,
    rebuttals: `Objection: We get enough leads already
 Rebuttal: That's excellent! If you're getting enough leads, that suggests your business is doing well. The question is: could you be growing faster? Most businesses find that increasing lead quality and quantity allows them to be more selective and focus on their most profitable clients.

 Objection: We don't know how to handle more leads
 Rebuttal: That's actually a great problem to have! We can help you implement systems to efficiently manage increased lead volume, from automated follow-up sequences to CRM integration. Growing your lead flow is a sign of business growth.

 Objection: Our sales process is too complex for online leads
 Rebuttal: Complex sales processes often benefit most from online lead generation. We can create content and forms that pre-qualify leads, so you only spend time on prospects who are genuinely interested and a good fit for your services.`
  }
];

const CallScripts: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast: notify } = useToast();
  const queryClient = useQueryClient();
  const quillRef = useRef<ReactQuill>(null);
  const rebuttalsQuillRef = useRef<ReactQuill>(null);
  const [activeEditorTab, setActiveEditorTab] = useState<'main' | 'rebuttals'>('main');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState<CallScript | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'scripts' | 'dispositions'>('scripts');
  const [isDispositionModalOpen, setIsDispositionModalOpen] = useState(false);
  const [selectedDisposition, setSelectedDisposition] = useState<CallDisposition | null>(null);

  // Category and tag management
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);

  // Variable panel state
  const [activeVariableCategory, setActiveVariableCategory] = useState<string>('contact');

  // AI generation state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTarget, setAiTarget] = useState<'main' | 'rebuttals' | 'both'>('both');

  const [focusedField, setFocusedField] = useState<{ type: 'main' | 'objection' | 'rebuttal', index?: number } | null>(null);

  const [dispositionFormData, setDispositionFormData] = useState<DispositionFormData>({
    name: '',
    description: '',
    category: 'neutral',
    color: '#6B7280',
    isActive: true
  });

  const [previewData, setPreviewData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    company: 'Acme Corp',
    title: 'Sales Manager',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    mobile: '+1 (555) 987-6543',
    department: 'Sales',
    companySize: '50-100',
    industry: 'Technology',
    website: 'www.acmecorp.com',
    revenue: '$5M-$10M',
    address: '123 Main St',
    city: 'Toronto',
    state: 'Ontario',
    province: 'Ontario',
    country: 'Canada',
    zipCode: 'M5V 1A1',
    timezone: 'EST',
    serviceArea1: 'Downtown Toronto',
    serviceArea2: 'North York',
    serviceArea3: 'Scarborough',
    callDuration: '3:45',
    callOutcome: 'Answered',
    callTime: '2:30 PM',
    callDate: 'January 15, 2024',
    callbackNumber: '+1 (555) 123-4567',
    voicemailDuration: '45 seconds',
    previousCallDate: 'January 10, 2024',
    totalCalls: '3',
    agentName: 'Sarah Johnson',
    agentFirstName: 'Sarah',
    agentEmail: 'sarah@company.com',
    agentPhone: '+1 (555) 000-0001',
    agentExtension: '101',
    agentTitle: 'Senior Sales Rep',
    campaignName: 'Product Demo Campaign',
    sequenceStep: '1',
    totalSteps: '5',
    campaignStartDate: 'January 1, 2024',
    unsubscribeUrl: 'https://example.com/unsubscribe',
    currentDate: new Date().toLocaleDateString(),
    currentTime: new Date().toLocaleTimeString(),
    currentDay: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    currentMonth: new Date().toLocaleDateString('en-US', { month: 'long' }),
    currentYear: new Date().getFullYear().toString(),
    custom1: 'Custom Value 1',
    custom2: 'Custom Value 2',
    custom3: 'Custom Value 3',
    notes: 'Previous interest in enterprise plan',
    leadSource: 'Website',
    leadScore: '85'
  });

  const [formData, setFormData] = useState<ScriptFormData>({
    name: '',
    description: '',
    content: '',
    rebuttals: '',
    objections: [],
    category: '',
    tags: [],
    variables: []
  });

  // Quill editor modules configuration
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote'],
      ['clean']
    ],
  }), []);

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'indent',
    'align',
    'blockquote'
  ];

  const { data: scriptsData = [], isLoading } = useQuery({
    queryKey: ['call-scripts'],
    queryFn: async () => {
      const allScripts = await api.getCallScripts();
      return allScripts.filter(s => s.status !== 'archived' && s.status !== 'trashed');
    }
  });

  const scripts = Array.isArray(scriptsData) ? scriptsData : [];

  const { data: dispositionsData = [] } = useQuery({
    queryKey: ['call-dispositions'],
    queryFn: api.getCallDispositions
  });

  useEffect(() => {
    console.log('Dispositions Data from API:', dispositionsData);
  }, [dispositionsData]);

  const dispositions = Array.isArray(dispositionsData) ? dispositionsData : [];

  // Get all categories (default + custom + from existing scripts)
  const allCategories = useMemo(() => {
    const scriptCategories = scripts.map(s => s.category).filter(Boolean);
    const combined = [...new Set([...DEFAULT_CATEGORIES, ...customCategories, ...scriptCategories])];
    return combined.sort();
  }, [scripts, customCategories]);

  // Get all tags (default + custom + from existing scripts)
  const allTags = useMemo(() => {
    const scriptTags = scripts.flatMap(s => s.tags || []);
    const combined = [...new Set([...DEFAULT_TAGS, ...customTags, ...scriptTags])];
    return combined.sort();
  }, [scripts, customTags]);

  // Filter categories for dropdown
  const categories = ['all', ...allCategories];

  const createScriptMutation = useMutation({
    mutationFn: api.createCallScript,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['call-scripts'] });
      notify({
        title: 'Success',
        description: 'Call script created successfully',
      });
      setIsCreateModalOpen(false);
      resetForm();

      const workflowState = location.state as { nextStep?: string; workflow?: string };
      if (workflowState?.workflow === 'call-campaign-creation' && workflowState?.nextStep === 'recipients') {
        navigate('/contacts', {
          state: {
            nextStep: 'campaign',
            workflow: 'call-campaign-creation',
            scriptId: data.id
          }
        });
      }
    },
    onError: () => {
      notify({
        title: 'Error',
        description: 'Failed to create call script',
        variant: 'destructive',
      });
    }
  });

  const createDispositionMutation = useMutation({
    mutationFn: api.createCallDisposition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-dispositions'] });
      notify({ title: 'Success', description: 'Disposition type created successfully' });
      setIsDispositionModalOpen(false);
      resetDispositionForm();
    },
    onError: () => {
      notify({ title: 'Error', description: 'Failed to create disposition type', variant: 'destructive' });
    }
  });

  const updateDispositionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; description: string; category: CallDisposition['category']; color: string; is_active: boolean }> }) =>
      api.updateCallDisposition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-dispositions'] });
      notify({ title: 'Success', description: 'Disposition type updated successfully' });
      setIsDispositionModalOpen(false);
      resetDispositionForm();
    },
    onError: () => {
      notify({ title: 'Error', description: 'Failed to update disposition type', variant: 'destructive' });
    }
  });

  const deleteDispositionMutation = useMutation({
    mutationFn: api.deleteCallDisposition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-dispositions'] });
      notify({ title: 'Success', description: 'Disposition type deleted successfully' });
    },
    onError: () => {
      notify({ title: 'Error', description: 'Failed to delete disposition type', variant: 'destructive' });
    }
  });

  const updateScriptMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ScriptFormData }) => api.updateCallScript(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-scripts'] });
      notify({ title: 'Success', description: 'Call script updated successfully' });
      setIsEditModalOpen(false);
      setSelectedScript(null);
    },
    onError: () => {
      notify({ title: 'Error', description: 'Failed to update call script', variant: 'destructive' });
    }
  });

  const deleteScriptMutation = useMutation({
    mutationFn: (id: string) => api.updateCallScript(id, { status: 'trashed' } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-scripts'] });
      notify({ title: 'Success', description: 'Call script moved to trash' });
    },
    onError: () => {
      notify({ title: 'Error', description: 'Failed to move call script to trash', variant: 'destructive' });
    }
  });

  const archiveScriptMutation = useMutation({
    mutationFn: (id: string) => api.updateCallScript(id, { status: 'archived' } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-scripts'] });
      notify({ title: 'Success', description: 'Call script archived successfully' });
    },
    onError: () => {
      notify({ title: 'Error', description: 'Failed to archive call script', variant: 'destructive' });
    }
  });

  const parseRebuttals = (rebuttalsStr: string): ObjectionRebuttal[] => {
    const pairs: ObjectionRebuttal[] = [];

    // 1. Try to parse structured format: Objection: ... Rebuttal: ...
    const structuredRegex = /Objection:\s*(.*?)\s*Rebuttal:\s*(.*?)(?=\s*Objection:|$)/gs;
    let match;
    while ((match = structuredRegex.exec(rebuttalsStr)) !== null) {
      pairs.push({
        objection: match[1].trim(),
        rebuttal: match[2].trim()
      });
    }

    // 2. If no structured pairs, try to parse HTML format: <p><strong>Objection</strong></p><p>Rebuttal</p>
    if (pairs.length === 0) {
      const htmlRegex = /<p><strong>(.*?)<\/strong><\/p>\s*<p>(.*?)<\/p>/gs;
      while ((match = htmlRegex.exec(rebuttalsStr)) !== null) {
        pairs.push({
          objection: match[1].trim(),
          rebuttal: match[2].trim()
        });
      }
    }

    // 3. If still no pairs found but there is content, treat it as one big rebuttal
    if (pairs.length === 0 && rebuttalsStr.trim()) {
      // Check if it's HTML (from Quill) or plain text
      const plainText = rebuttalsStr.replace(/<[^>]*>/g, '').trim();
      if (plainText) {
        pairs.push({
          objection: 'General',
          rebuttal: rebuttalsStr.trim()
        });
      }
    }
    return pairs;
  };

  const stringifyRebuttals = (pairs: ObjectionRebuttal[]): string => {
    return pairs
      .filter(p => p.objection.trim() || p.rebuttal.trim())
      .map(p => `Objection: ${p.objection}\nRebuttal: ${p.rebuttal}`)
      .join('\n\n');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      content: '',
      rebuttals: '',
      objections: [],
      category: '',
      tags: [],
      variables: []
    });
    setActiveEditorTab('main');
  };

  const resetDispositionForm = () => {
    setDispositionFormData({
      name: '',
      description: '',
      category: 'neutral',
      color: '#6B7280',
      isActive: true
    });
    setSelectedDisposition(null);
  };

  // Insert variable at cursor position in the active field
  const insertVariable = (variableName: string) => {
    const variableText = `{{${variableName}}}`;

    if (!focusedField || focusedField.type === 'main') {
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection(true);
        quill.insertText(range.index, variableText);
        quill.setSelection(range.index + variableText.length, 0);
      }
    } else if (focusedField.type === 'objection' && typeof focusedField.index === 'number') {
      const newObjections = [...formData.objections];
      newObjections[focusedField.index].objection += variableText;
      setFormData(prev => ({ ...prev, objections: newObjections }));
    } else if (focusedField.type === 'rebuttal' && typeof focusedField.index === 'number') {
      const newObjections = [...formData.objections];
      newObjections[focusedField.index].rebuttal += variableText;
      setFormData(prev => ({ ...prev, objections: newObjections }));
    }
  };

  const handleCreateDisposition = () => {
    if (!dispositionFormData.name.trim()) {
      notify({ title: 'Error', description: 'Disposition name is required', variant: 'destructive' });
      return;
    }
    createDispositionMutation.mutate({
      name: dispositionFormData.name,
      description: dispositionFormData.description,
      category: dispositionFormData.category,
      color: dispositionFormData.color
    });
  };

  const handleEditDisposition = (disposition: CallDisposition) => {
    setSelectedDisposition(disposition);
    setDispositionFormData({
      name: disposition.name,
      description: disposition.description || '',
      category: disposition.category as 'positive' | 'negative' | 'neutral' | 'follow_up',
      color: disposition.color,
      isActive: disposition.is_active
    });
    setIsDispositionModalOpen(true);
  };

  const handleUpdateDisposition = () => {
    if (!selectedDisposition || !dispositionFormData.name.trim()) return;
    updateDispositionMutation.mutate({
      id: selectedDisposition.id,
      data: {
        name: dispositionFormData.name,
        description: dispositionFormData.description,
        category: dispositionFormData.category,
        color: dispositionFormData.color,
        is_active: dispositionFormData.isActive
      }
    });
  };

  const handleDeleteDisposition = (id: string) => {
    if ((dispositions || []).find(d => d.id === id)?.isDefault) {
      notify({ title: 'Error', description: 'Cannot delete default disposition types', variant: 'destructive' });
      return;
    }
    if (confirm('Are you sure you want to delete this disposition type?')) {
      deleteDispositionMutation.mutate(id);
    }
  };

  const toggleDispositionStatus = (id: string) => {
    const disposition = (dispositions || []).find(d => d.id === id);
    if (disposition) {
      updateDispositionMutation.mutate({ id, data: { is_active: !disposition.is_active } });
    }
  };

  const handleCreateScript = () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      notify({ title: 'Error', description: 'Script name and content are required', variant: 'destructive' });
      return;
    }
    // Combine main content and rebuttals, then pass as 'content' (API will convert to 'script')
    const scriptContent = getCombinedContent();
    createScriptMutation.mutate({
      name: formData.name,
      description: formData.description,
      content: scriptContent,
      category: formData.category,
      tags: formData.tags,
      variables: formData.variables
    });
  };

  const handleAIGeneration = async () => {
    if (!aiPrompt.trim()) {
      notify({
        title: 'Prompt Required',
        description: 'Please enter a description of what you want to generate.',
        variant: 'destructive'
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const systemInstruction = `
        You are an expert sales copywriter. Generate a high-converting call script.
        Use {{variableName}} for personalization.
        If generating both script and objections, separate them with "---" or use the format:
        [MAIN_SCRIPT]
        (content)
        [OBJECTIONS]
        Objection: (text)
        Rebuttal: (text)
      `;

      const response = await api.generateAiContent({
        channel: 'call',
        prompt: `${systemInstruction}\n\nClient Request: ${aiPrompt}`,
        action: 'draft',
        context: {
          scriptName: formData.name,
          category: formData.category,
          description: formData.description,
          existingContent: formData.content,
          existingRebuttals: formData.rebuttals
        }
      });

      const generated = response.output.trim();

      // Try to parse main content and rebuttals from generated text
      let newContent = formData.content;
      let newRebuttals = formData.rebuttals;

      if (aiTarget === 'main' || aiTarget === 'both') {
        // Look for main script content
        let mainContent = generated;

        // Try to separate rebuttals if generating both
        if (aiTarget === 'both') {
          const rebuttalsMatch = generated.match(/(?:objections?|rebuttals?|responses?):\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
          if (rebuttalsMatch) {
            newRebuttals = rebuttalsMatch[1].trim();
            mainContent = generated.substring(0, rebuttalsMatch.index).trim();
          } else {
            // Try to split by common separators
            const parts = generated.split(/\n\n---\n\n|\n\nObjections:\n\n|\n\nRebuttals:\n\n/i);
            if (parts.length > 1) {
              mainContent = parts[0].trim();
              newRebuttals = parts.slice(1).join('\n\n').trim();
            }
          }
        }

        newContent = mainContent;
      } else if (aiTarget === 'rebuttals') {
        newRebuttals = generated;
      }

      setFormData(prev => ({
        ...prev,
        content: newContent,
        rebuttals: newRebuttals,
        objections: parseRebuttals(newRebuttals)
      }));

      setAiDialogOpen(false);
      setAiPrompt('');

      notify({
        title: 'AI Generation Complete',
        description: 'Your call script content has been generated successfully.'
      });
    } catch (error) {
      console.error('AI generation error:', error);
      notify({
        title: 'AI Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate content. Please check your AI settings.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleEditScript = (script: CallScript) => {
    setSelectedScript(script);
    // Parse script content - split by [REBUTTALS] or --- to separate main content from rebuttals
    let mainContent = script.script;
    let rebuttalsContent = '';

    if (mainContent.includes('[REBUTTALS]')) {
      const parts = mainContent.split('[REBUTTALS]');
      mainContent = parts[0];
      rebuttalsContent = parts.slice(1).join('[REBUTTALS]');
    } else if (mainContent.includes('---')) {
      const parts = mainContent.split('---');
      mainContent = parts[0];
      rebuttalsContent = parts.slice(1).join('---');
    }

    setFormData({
      name: script.name,
      description: script.description || '',
      content: mainContent.trim(),
      rebuttals: rebuttalsContent.trim(),
      objections: parseRebuttals(rebuttalsContent.trim()),
      category: script.category || '',
      tags: script.tags || [],
      variables: script.variables || []
    });
    setActiveEditorTab('main');
    setIsEditModalOpen(true);
  };

  // Combine main content and rebuttals into single script
  const getCombinedContent = () => {
    const rebuttalsStr = formData.objections.length > 0
      ? stringifyRebuttals(formData.objections)
      : formData.rebuttals;

    if (rebuttalsStr.trim()) {
      return `${formData.content}\n\n[REBUTTALS]\n${rebuttalsStr}`;
    }
    return formData.content;
  };

  const handleUpdateScript = () => {
    if (!selectedScript || !formData.name.trim() || !formData.content.trim()) return;
    // Combine main content and rebuttals, then pass as 'content' (API will convert to 'script')
    const scriptContent = getCombinedContent();
    updateScriptMutation.mutate({
      id: selectedScript.id,
      data: {
        name: formData.name,
        description: formData.description,
        content: scriptContent,
        rebuttals: formData.rebuttals,
        objections: formData.objections,
        category: formData.category,
        tags: formData.tags,
        variables: formData.variables
      }
    });
  };

  const handleDeleteScript = (id: string) => {
    if (confirm('Are you sure you want to delete this call script?')) {
      deleteScriptMutation.mutate(id);
    }
  };

  const handleDuplicateScript = (script: CallScript) => {
    // Duplicate the entire script content as-is (already combined)
    createScriptMutation.mutate({
      name: `${script.name} (Copy)`,
      description: script.description,
      content: script.script,
      category: script.category || '',
      tags: script.tags || [],
      variables: script.variables || []
    });
  };

  const handleLoadDefaults = async () => {
    try {
      notify({ title: 'Loading...', description: 'Creating default scripts...' });

      // Create scripts sequentially to avoid overwhelming the server
      for (const script of DEFAULT_SCRIPTS_DATA) {
        // combine content and rebuttals
        let fullContent = script.content;
        if (script.rebuttals) {
          fullContent += `\n\n---\n\n${script.rebuttals}`;
        }

        // Extract variables
        const variables = extractVariables(script.content, script.rebuttals);

        await api.createCallScript({
          name: script.name,
          description: script.description,
          content: fullContent,  // Use 'content' instead of 'script'
          category: script.category,
          tags: script.tags,
          variables: variables
        });
      }

      queryClient.invalidateQueries({ queryKey: ['call-scripts'] });
      notify({ title: 'Success', description: `${DEFAULT_SCRIPTS_DATA.length} default scripts loaded successfully` });
    } catch (error) {
      console.error('Failed to load defaults', error);
      notify({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load default scripts',
        variant: 'destructive'
      });
    }
  };

  const handlePreviewScript = (script: CallScript) => {
    setSelectedScript(script);
    setIsPreviewModalOpen(true);
  };

  const getPreviewContent = (content: string) => {
    let result = content;
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  };

  const extractVariables = (content: string, rebuttals: string = '', objections: ObjectionRebuttal[] = []): string[] => {
    const objectionsText = objections.map(o => `${o.objection} ${o.rebuttal}`).join(' ');
    const combined = `${content} ${rebuttals} ${objectionsText}`;
    // Support both {{var}} and [var] formats
    const matches = combined.match(/\{\{\s*([^}]+)\s*\}\}|\[\s*([^\]]+)\s*\]/g);
    if (!matches) return [];

    return [...new Set(matches.map(match => {
      if (match.startsWith('{{')) return match.slice(2, -2).trim();
      return match.slice(1, -1).trim();
    }))];
  };

  const updateContent = (content: string) => {
    const variables = extractVariables(content, formData.rebuttals, formData.objections);
    setFormData(prev => ({ ...prev, content, variables }));
  };

  const updateRebuttals = (rebuttals: string) => {
    const variables = extractVariables(formData.content, rebuttals, formData.objections);
    setFormData(prev => ({ ...prev, rebuttals, variables }));
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag.trim()] }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const addNewCategory = () => {
    if (newCategory.trim() && !allCategories.includes(newCategory.trim())) {
      setCustomCategories(prev => [...prev, newCategory.trim()]);
      setFormData(prev => ({ ...prev, category: newCategory.trim() }));
      setNewCategory('');
      setCategoryOpen(false);
    }
  };

  const addNewTag = () => {
    if (newTag.trim() && !allTags.includes(newTag.trim())) {
      setCustomTags(prev => [...prev, newTag.trim()]);
      addTag(newTag.trim());
      setNewTag('');
    }
  };

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = searchTerm === '' ||
      script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      script.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      script.script.toLowerCase().includes(searchTerm.toLowerCase()) ||
      script.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || script.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDispositionIcon = (category: string) => {
    switch (category) {
      case 'positive': return <CheckCircle className="h-4 w-4" />;
      case 'negative': return <XCircle className="h-4 w-4" />;
      case 'follow_up': return <RotateCcw className="h-4 w-4" />;
      default: return <PhoneOff className="h-4 w-4" />;
    }
  };

  const getDispositionBadge = (disposition: CallDisposition) => (
    <Badge style={{ backgroundColor: `${disposition.color}20`, color: disposition.color }} className="border-0">
      {getDispositionIcon(disposition.category)}
      <span className="ml-1">{disposition.name}</span>
    </Badge>
  );

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }


  return (
    <>
      <div className="flex h-full">
        <div className="flex-1 overflow-hidden">
          <div className="space-y-4">
            <Breadcrumb
              items={[
                { label: 'Call Outreach', href: '/reach/outbound/calls', icon: <Phone className="h-4 w-4" /> },
                { label: 'Scripts' }
              ]}
            />

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[18px] font-bold tracking-tight text-foreground">Call Scripts & Dispositions</h1>
                <p className="text-muted-foreground mt-1">Manage call scripts and disposition types for better call tracking</p>
              </div>
              <div className="flex gap-2">
                {activeTab === 'scripts' && (
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Script
                  </Button>
                )}
                {activeTab === 'dispositions' && (
                  <Button onClick={() => setIsDispositionModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Disposition
                  </Button>
                )}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'scripts' | 'dispositions')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scripts" className="flex items-center space-x-2">
                  <FileTextIcon className="h-4 w-4" />
                  <span>Call Scripts</span>
                </TabsTrigger>
                <TabsTrigger value="dispositions" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Disposition Types</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scripts" className="space-y-6">
                {/* Filters */}
                <Card className="border-analytics">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search scripts..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="border border-input rounded-md px-3 py-2"
                        >
                          {categories.map(category => (
                            <option key={category} value={category}>
                              {category === 'all' ? 'All Categories' : category}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-analytics">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Scripts</p>
                          <p className="text-[18px] font-bold text-foreground">{scripts.length}</p>
                        </div>
                        <FileTextIcon className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">With Tags</p>
                          <p className="text-2xl font-bold text-foreground">
                            {scripts.filter(s => s.tags && s.tags.length > 0).length}
                          </p>
                        </div>
                        <Tag className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">With Variables</p>
                          <p className="text-2xl font-bold text-foreground">
                            {scripts.filter(s => s.variables && s.variables.length > 0).length}
                          </p>
                        </div>
                        <Settings className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Scripts Table */}
                {filteredScripts.length === 0 ? (
                  <Card className="border-analytics">
                    <CardContent className="p-12 text-center">
                      <FileTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No call scripts found</h3>
                      <p className="text-muted-foreground mb-4">
                        {scripts.length === 0 ? "Create your first call script or load our comprehensive templates to get started" : "Try adjusting your search or filters"}
                      </p>
                      <div className="flex justify-center gap-3">
                        {scripts.length === 0 && (
                          <Button variant="outline" onClick={handleLoadDefaults}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Load Default Scripts
                          </Button>
                        )}
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Script
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-analytics">
                    <CardContent className="p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Name</th>
                              <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Category</th>
                              <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Tags</th>
                              <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Variables</th>
                              <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Description</th>
                              <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredScripts.map((script) => (
                              <tr key={script.id} className="border-b last:border-0 hover:bg-muted/50">
                                <td className="py-3 px-4">
                                  <div className="font-medium text-sm">{script.name}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className="capitalize">
                                    <FolderOpen className="h-3 w-3 mr-1" />
                                    {script.category || 'General'}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  {script.tags && script.tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {script.tags.slice(0, 2).map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                      ))}
                                      {script.tags.length > 2 && (
                                        <Badge variant="secondary" className="text-xs">+{script.tags.length - 2}</Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">No tags</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-xs text-muted-foreground">
                                    {script.variables && script.variables.length > 0
                                      ? `${script.variables.length} variable${script.variables.length > 1 ? 's' : ''}`
                                      : 'None'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                                    {script.description || 'No description'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handlePreviewScript(script)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Preview
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEditScript(script)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDuplicateScript(script)}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Duplicate
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        if (confirm('Are you sure you want to archive this script?')) {
                                          archiveScriptMutation.mutate(script.id);
                                        }
                                      }}>
                                        <Archive className="h-4 w-4 mr-2" />
                                        Archive
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          if (confirm('Are you sure you want to move this script to trash?')) {
                                            deleteScriptMutation.mutate(script.id);
                                          }
                                        }}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Move to Trash
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="dispositions" className="space-y-6">
                {/* Disposition Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-analytics">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Dispositions</p>
                          <p className="text-2xl font-bold text-foreground">{(dispositions || []).length}</p>
                        </div>
                        <Settings className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Active</p>
                          <p className="text-2xl font-bold text-foreground">{(dispositions || []).filter(d => d.is_active).length}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Positive</p>
                          <p className="text-2xl font-bold text-foreground">{(dispositions || []).filter(d => d.category === 'positive').length}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Custom</p>
                          <p className="text-2xl font-bold text-foreground">{(dispositions || []).filter(d => !d.isDefault).length}</p>
                        </div>
                        <Building2 className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Disposition Types Table */}
                {dispositions.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No disposition types found</h3>
                      <p className="text-muted-foreground mb-4">Create disposition types to categorize call outcomes</p>
                      <Button onClick={() => setIsDispositionModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Disposition
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-analytics">
                    <CardContent className="p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Name</th>
                              <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Category</th>
                              <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Description</th>
                              <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Status</th>
                              <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dispositions.map((disposition) => (
                              <tr key={disposition.id} className="border-b last:border-0 hover:bg-muted/50">
                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-2">
                                    {getDispositionBadge(disposition)}
                                    {disposition.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="capitalize text-sm">{disposition.category.replace('_', ' ')}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm text-muted-foreground">{disposition.description || 'No description'}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant={disposition.is_active ? "default" : "secondary"} className="text-xs">
                                    {disposition.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleEditDisposition(disposition)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => toggleDispositionStatus(disposition.id)}>
                                      {disposition.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                    </Button>
                                    {!disposition.isDefault && (
                                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDisposition(disposition.id)} className="text-red-600 hover:text-red-700">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>


            {/* Create/Edit Script Modal */}
            <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
              if (!open) {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedScript(null);
                resetForm();
              }
            }}>
              <DialogContent className="max-w-[90vw] w-[1400px] max-h-[95vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>{isEditModalOpen ? 'Edit Call Script' : 'Create Call Script'}</DialogTitle>
                  <DialogDescription>
                    {isEditModalOpen ? 'Update your call script content and settings' : 'Create a new call script with variables and personalization'}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-2">
                  <div className="grid grid-cols-4 gap-8 py-4">
                    {/* Left Column - Form Fields */}
                    <div className="col-span-3 space-y-5">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="scriptName" className="mb-1.5 block">Script Name *</Label>
                          <Input
                            id="scriptName"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Discovery Call Script"
                            className="h-10"
                          />
                        </div>

                        {/* Category Selector with Create Option */}
                        <div>
                          <Label className="mb-1.5 block">Category</Label>
                          <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" role="combobox" aria-expanded={categoryOpen} className="w-full justify-between h-10">
                                {formData.category || "Select category..."}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[280px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search or create category..." value={newCategory} onValueChange={setNewCategory} />
                                <CommandList>
                                  <CommandEmpty>
                                    <div className="p-2">
                                      <Button size="sm" variant="ghost" className="w-full justify-start" onClick={addNewCategory}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create "{newCategory}"
                                      </Button>
                                    </div>
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {allCategories.filter(cat =>
                                      cat.toLowerCase().includes(newCategory.toLowerCase())
                                    ).map((category) => (
                                      <CommandItem
                                        key={category}
                                        value={category}
                                        onSelect={() => {
                                          setFormData(prev => ({ ...prev, category }));
                                          setCategoryOpen(false);
                                          setNewCategory('');
                                        }}
                                      >
                                        <Check className={`mr-2 h-4 w-4 ${formData.category === category ? "opacity-100" : "opacity-0"}`} />
                                        <FolderOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                                        {category}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                  {newCategory && !allCategories.some(cat => cat.toLowerCase() === newCategory.toLowerCase()) && (
                                    <CommandGroup>
                                      <CommandItem onSelect={addNewCategory}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create "{newCategory}"
                                      </CommandItem>
                                    </CommandGroup>
                                  )}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="scriptDescription" className="mb-1.5 block">Description</Label>
                        <Textarea
                          id="scriptDescription"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe the purpose and context of this script"
                          rows={3}
                        />
                      </div>

                      {/* Tags with Create Option */}
                      <div>
                        <Label className="mb-1.5 block">Tags (Multiple allowed)</Label>
                        <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                          {formData.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                              <Tag className="h-3 w-3" />
                              {tag}
                              <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-600">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <Popover open={tagOpen} onOpenChange={setTagOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="justify-start h-9">
                              <Plus className="h-4 w-4 mr-2" />
                              Add tags...
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[280px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search or create tag..." value={newTag} onValueChange={setNewTag} />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="p-2">
                                    <Button size="sm" variant="ghost" className="w-full justify-start" onClick={addNewTag}>
                                      <Plus className="h-4 w-4 mr-2" />
                                      Create "{newTag}"
                                    </Button>
                                  </div>
                                </CommandEmpty>
                                <CommandGroup>
                                  {allTags.filter(tag =>
                                    tag.toLowerCase().includes(newTag.toLowerCase()) && !formData.tags.includes(tag)
                                  ).map((tag) => (
                                    <CommandItem
                                      key={tag}
                                      value={tag}
                                      onSelect={() => {
                                        addTag(tag);
                                        setNewTag('');
                                      }}
                                    >
                                      <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                                      {tag}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                                {newTag && !allTags.some(tag => tag.toLowerCase() === newTag.toLowerCase()) && (
                                  <CommandGroup>
                                    <CommandItem onSelect={addNewTag}>
                                      <Plus className="h-4 w-4 mr-2" />
                                      Create "{newTag}"
                                    </CommandItem>
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Script Health Meter */}
                      <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold">Script Quality Score</span>
                          </div>
                          <Badge variant="secondary" className="text-xs font-bold">
                            {(() => {
                              let score = 0;
                              if (formData.name.length > 5) score += 20;
                              if (formData.content.length > 100) score += 30;
                              if (formData.variables.length >= 3) score += 20;
                              if (formData.objections.length >= 2) score += 20;
                              if (formData.category) score += 10;
                              return score;
                            })()}%
                          </Badge>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-all duration-500"
                            style={{
                              width: `${(() => {
                                let score = 0;
                                if (formData.name.length > 5) score += 20;
                                if (formData.content.length > 100) score += 30;
                                if (formData.variables.length >= 3) score += 20;
                                if (formData.objections.length >= 2) score += 20;
                                if (formData.category) score += 10;
                                return score;
                              })()}%`
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-5 gap-2 mt-3">
                          <div className={`text-[10px] flex items-center gap-1 ${formData.name.length > 5 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <Check className="h-3 w-3" /> Name
                          </div>
                          <div className={`text-[10px] flex items-center gap-1 ${formData.content.length > 100 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <Check className="h-3 w-3" /> Content
                          </div>
                          <div className={`text-[10px] flex items-center gap-1 ${formData.variables.length >= 3 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <Check className="h-3 w-3" /> Variables
                          </div>
                          <div className={`text-[10px] flex items-center gap-1 ${formData.objections.length >= 2 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <Check className="h-3 w-3" /> Objections
                          </div>
                          <div className={`text-[10px] flex items-center gap-1 ${formData.category ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <Check className="h-3 w-3" /> Category
                          </div>
                        </div>
                      </div>

                      {/* WYSIWYG Editor with Tabs */}
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-3">
                          <Label className="text-base font-semibold">Script Editor</Label>
                          <div className="flex items-center gap-2">
                            <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700">
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Generate with AI
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Bot className="h-5 w-5" />
                                    AI Script Generation
                                  </DialogTitle>
                                  <DialogDescription>
                                    Describe your call script goal and AI will create professional sales scripts and objection handlers.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="ai-target">Generate</Label>
                                    <select
                                      id="ai-target"
                                      value={aiTarget}
                                      onChange={(e) => setAiTarget(e.target.value as 'main' | 'rebuttals' | 'both')}
                                      className="w-full border border-input rounded-md px-3 py-2"
                                    >
                                      <option value="both">Main Script & Objections</option>
                                      <option value="main">Main Script Only</option>
                                      <option value="rebuttals">Objections & Rebuttals Only</option>
                                    </select>
                                  </div>
                                  <div>
                                    <Label htmlFor="ai-prompt">Script Description</Label>
                                    <Textarea
                                      id="ai-prompt"
                                      placeholder="Describe your call objective, target audience, key selling points, and common objections..."
                                      value={aiPrompt}
                                      onChange={(e) => setAiPrompt(e.target.value)}
                                      rows={4}
                                      className="resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Example: "Create a sales script for B2B SaaS product targeting IT managers. Focus on efficiency gains and security benefits. Include responses to budget objections and timing concerns."
                                    </p>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleAIGeneration}
                                    disabled={isGeneratingAI || !aiPrompt.trim()}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                                  >
                                    {isGeneratingAI ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating...
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Generate
                                      </>
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                              {formData.variables.length > 0
                                ? `${formData.variables.length} variable${formData.variables.length > 1 ? 's' : ''} detected`
                                : 'No variables detected'}
                            </div>
                          </div>
                        </div>

                        <Tabs value={activeEditorTab} onValueChange={(v) => setActiveEditorTab(v as 'main' | 'rebuttals')} className="w-full">
                          <TabsList className="grid w-full grid-cols-2 mb-3">
                            <TabsTrigger value="main" className="flex items-center gap-2">
                              <FileTextIcon className="h-4 w-4" />
                              Main Script *
                            </TabsTrigger>
                            <TabsTrigger value="rebuttals" className="flex items-center gap-2">
                              <RotateCcw className="h-4 w-4" />
                              Objections & Rebuttals
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="main" className="mt-0">
                            <div className="border rounded-lg overflow-hidden">
                              <ReactQuill
                                ref={quillRef}
                                theme="snow"
                                value={formData.content}
                                onChange={updateContent}
                                onFocus={() => setFocusedField({ type: 'main' })}
                                modules={quillModules}
                                formats={quillFormats}
                                placeholder="Enter your main script content here. This is what agents will read during the call."
                                className="min-h-[320px]"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              💡 Main script content - the primary talking points for your call
                            </p>
                          </TabsContent>

                          <TabsContent value="rebuttals" className="mt-0">
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                              {formData.objections.length === 0 ? (
                                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                  <RotateCcw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                  <h3 className="text-lg font-medium text-foreground mb-2">No structured objections yet</h3>
                                  <p className="text-muted-foreground mb-4">
                                    Add common objections and their rebuttals to help agents handle difficult calls.
                                  </p>
                                  <Button variant="outline" onClick={() => setFormData(prev => ({ ...prev, objections: [{ objection: '', rebuttal: '' }] }))}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add First Objection
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  {formData.objections.map((obj, idx) => (
                                    <Card key={idx} className="border-analytics relative group">
                                      <CardContent className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <Label className="text-sm font-bold flex items-center gap-2">
                                            <XCircle className="h-4 w-4 text-red-500" />
                                            Objection #{idx + 1}
                                          </Label>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              const newObjs = [...formData.objections];
                                              newObjs.splice(idx, 1);
                                              setFormData(prev => ({ ...prev, objections: newObjs }));
                                            }}
                                            className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        <div className="space-y-2">
                                          <Input
                                            placeholder="What is the objection? (e.g., 'Too expensive')"
                                            value={obj.objection}
                                            onFocus={() => setFocusedField({ type: 'objection', index: idx })}
                                            onChange={(e) => {
                                              const newObjs = [...formData.objections];
                                              newObjs[idx].objection = e.target.value;
                                              const variables = extractVariables(formData.content, formData.rebuttals, newObjs);
                                              setFormData(prev => ({ ...prev, objections: newObjs, variables }));
                                            }}
                                            className="font-semibold"
                                          />
                                          <Textarea
                                            placeholder="How should the agent respond?"
                                            value={obj.rebuttal}
                                            onFocus={() => setFocusedField({ type: 'rebuttal', index: idx })}
                                            onChange={(e) => {
                                              const newObjs = [...formData.objections];
                                              newObjs[idx].rebuttal = e.target.value;
                                              const variables = extractVariables(formData.content, formData.rebuttals, newObjs);
                                              setFormData(prev => ({ ...prev, objections: newObjs, variables }));
                                            }}
                                            rows={3}
                                          />
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                  <Button
                                    variant="outline"
                                    className="w-full border-dashed"
                                    onClick={() => setFormData(prev => ({ ...prev, objections: [...formData.objections, { objection: '', rebuttal: '' }] }))}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Another Objection
                                  </Button>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-4">
                              💡 Add responses to common objections like "I'm too busy", "It's too expensive", "I need to think about it"
                            </p>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div>

                    {/* Right Column - Variables Panel & Preview */}
                    <div className="col-span-1 flex flex-col gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="sticky top-0 bg-background pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-base font-semibold">Insert Variables</Label>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-4">
                            {Object.entries(VARIABLE_CATEGORIES).map(([key, cat]) => (
                              <Badge
                                key={key}
                                variant={activeVariableCategory === key ? "default" : "outline"}
                                className="cursor-pointer text-[10px] px-2 py-0"
                                onClick={() => setActiveVariableCategory(key)}
                              >
                                {cat.label}
                              </Badge>
                            ))}
                          </div>

                          {/* Variables List */}
                          <div className="border rounded-lg p-3 bg-muted/10 max-h-[300px] overflow-y-auto custom-scrollbar">
                            <div className="space-y-1">
                              {VARIABLE_CATEGORIES[activeVariableCategory as keyof typeof VARIABLE_CATEGORIES]?.variables.map((variable) => {
                                const isUsed = formData.variables.includes(variable.name);
                                return (
                                  <button
                                    key={variable.name}
                                    onClick={() => insertVariable(variable.name)}
                                    className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-all border flex flex-col gap-0.5
                                      ${isUsed
                                        ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                                        : 'bg-background hover:border-primary border-transparent'}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono font-semibold text-primary">{`{{${variable.name}}}`}</span>
                                      {isUsed && <CheckCircle className="h-3 w-3 text-green-600" />}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground line-clamp-1">{variable.description}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Used Variables Summary */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            Variables in Script ({formData.variables.length})
                          </Label>
                          <div className="flex flex-wrap gap-1.5">
                            {formData.variables.length > 0 ? (
                              formData.variables.map(v => (
                                <Badge key={v} variant="secondary" className="text-[10px] font-mono bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
                                  {v}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">No variables used yet</span>
                            )}
                          </div>
                        </div>

                        {/* Live Preview (Simple Version) */}
                        <div className="border rounded-xl overflow-hidden shadow-sm bg-background flex flex-col h-[300px]">
                          <div className="bg-muted/50 px-3 py-2 border-b flex items-center justify-between">
                            <span className="text-xs font-semibold flex items-center gap-1.5">
                              <Eye className="h-3.5 w-3.5" />
                              Agent View Preview
                            </span>
                            <Badge variant="outline" className="text-[9px] h-4">Live</Badge>
                          </div>
                          <div className="p-3 overflow-y-auto flex-1 text-xs prose prose-slate dark:prose-invert max-w-none scrollbar-hide">
                            {activeEditorTab === 'main' ? (
                              <div dangerouslySetInnerHTML={{ __html: getPreviewContent(formData.content) }} />
                            ) : (
                              <div className="space-y-3">
                                {formData.objections.map((obj, i) => (
                                  <div key={i} className="p-2 bg-red-50/50 dark:bg-red-950/20 rounded border-l-2 border-red-500">
                                    <div className="font-bold text-red-700 dark:text-red-400 mb-1">
                                      If: {getPreviewContent(obj.objection || '...')}
                                    </div>
                                    <div className="text-muted-foreground italic text-[11px]">
                                      Say: {getPreviewContent(obj.rebuttal || '...')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="border-t pt-4">
                  <Button variant="outline" onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedScript(null);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={isEditModalOpen ? handleUpdateScript : handleCreateScript}
                    disabled={
                      (isEditModalOpen ? updateScriptMutation.isPending : createScriptMutation.isPending) ||
                      !formData.name.trim() ||
                      !formData.content.trim()
                    }
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isEditModalOpen ? 'Update Script' : 'Create Script'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>


            {/* Preview Modal */}
            <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
              <DialogContent className="max-w-[90vw] w-[1400px] max-h-[95vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="text-xl">Script Preview: {selectedScript?.name}</DialogTitle>
                  <DialogDescription>Preview how your script looks with sample data. Edit the values below to test different scenarios.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 py-4 px-2">
                  {/* Sample Data Inputs - Collapsible */}
                  <div className="bg-muted/50 rounded-lg p-4 border">
                    <Label className="text-sm font-medium mb-3 block">Test Data (edit to preview with different values)</Label>
                    <div className="grid grid-cols-6 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">First Name</Label>
                        <Input
                          value={previewData.firstName}
                          onChange={(e) => setPreviewData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Last Name</Label>
                        <Input
                          value={previewData.lastName}
                          onChange={(e) => setPreviewData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Company</Label>
                        <Input
                          value={previewData.company}
                          onChange={(e) => setPreviewData(prev => ({ ...prev, company: e.target.value }))}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">City</Label>
                        <Input
                          value={previewData.city}
                          onChange={(e) => setPreviewData(prev => ({ ...prev, city: e.target.value }))}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Agent Name</Label>
                        <Input
                          value={previewData.agentName}
                          onChange={(e) => setPreviewData(prev => ({ ...prev, agentName: e.target.value }))}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Campaign</Label>
                        <Input
                          value={previewData.campaignName}
                          onChange={(e) => setPreviewData(prev => ({ ...prev, campaignName: e.target.value }))}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>

                  <Tabs defaultValue="main" className="w-full flex-1">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="main" className="text-sm">Main Script</TabsTrigger>
                      <TabsTrigger value="rebuttals" className="text-sm">Rebuttals & Objections</TabsTrigger>
                    </TabsList>

                    <TabsContent value="main" className="mt-0">
                      <div
                        className="bg-white dark:bg-gray-900 p-8 rounded-lg border shadow-sm min-h-[500px] max-h-[600px] overflow-y-auto prose prose-base max-w-none dark:prose-invert
                          prose-headings:text-foreground prose-headings:font-semibold prose-headings:mb-4
                          prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4
                          prose-strong:text-primary prose-strong:font-semibold
                          prose-ul:my-4 prose-li:my-1
                          [&_p]:whitespace-pre-wrap [&_p]:break-words
                          text-[15px] leading-7"
                        dangerouslySetInnerHTML={{
                          __html: selectedScript ? getPreviewContent(selectedScript.script.split('---')[0] || selectedScript.script) : ''
                        }}
                      />
                    </TabsContent>

                    <TabsContent value="rebuttals" className="mt-0">
                      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg border shadow-sm min-h-[500px] max-h-[600px] overflow-y-auto prose prose-base max-w-none dark:prose-invert
                          prose-headings:text-foreground prose-headings:font-semibold prose-headings:mb-4
                          prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4
                          prose-strong:text-primary prose-strong:font-semibold
                          prose-ul:my-4 prose-li:my-1
                          [&_p]:whitespace-pre-wrap [&_p]:break-words
                          text-[15px] leading-7">
                        {selectedScript && (() => {
                          const parts = selectedScript.script.split('---');
                          const rebuttalsContent = parts.length > 1 ? parts.slice(1).join('---').trim() : '';

                          if (rebuttalsContent) {
                            const objections = parseRebuttals(rebuttalsContent);
                            if (objections.length > 0) {
                              return (
                                <div className="space-y-6">
                                  {objections.map((obj, idx) => (
                                    <div key={idx} className="border-l-4 border-red-500 pl-4 py-2 bg-muted/30 rounded-r-lg">
                                      <h4 className="text-red-600 font-bold mb-2 flex items-center gap-2">
                                        <XCircle className="h-4 w-4" />
                                        Objection: {getPreviewContent(obj.objection)}
                                      </h4>
                                      <div className="text-foreground whitespace-pre-wrap">
                                        <strong>Rebuttal:</strong> {getPreviewContent(obj.rebuttal)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return <div dangerouslySetInnerHTML={{ __html: getPreviewContent(rebuttalsContent) }} />;
                          }
                          return (
                            <div className="flex flex-col items-center justify-center h-[400px] text-center">
                              <FileTextIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
                              <p className="text-muted-foreground text-lg">No rebuttals section found</p>
                              <p className="text-muted-foreground/70 text-sm mt-2">Add objections and rebuttals to help your agents handle difficult calls.</p>
                            </div>
                          );
                        })()}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <DialogFooter className="border-t pt-4">
                  <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Disposition Modal */}
            <Dialog open={isDispositionModalOpen} onOpenChange={(open) => {
              if (!open) {
                setIsDispositionModalOpen(false);
                resetDispositionForm();
              }
            }}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedDisposition ? 'Edit Disposition Type' : 'Create Disposition Type'}</DialogTitle>
                  <DialogDescription>
                    {selectedDisposition ? 'Update disposition type settings' : 'Create a new disposition type for call outcomes'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dispositionName">Name *</Label>
                      <Input
                        id="dispositionName"
                        value={dispositionFormData.name}
                        onChange={(e) => setDispositionFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Interested, Not Interested"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dispositionCategory">Category</Label>
                      <select
                        id="dispositionCategory"
                        value={dispositionFormData.category}
                        onChange={(e) => setDispositionFormData(prev => ({ ...prev, category: e.target.value as 'positive' | 'negative' | 'neutral' | 'follow_up' }))}
                        className="w-full border border-input rounded-md px-3 py-2"
                      >
                        <option value="positive">Positive</option>
                        <option value="negative">Negative</option>
                        <option value="neutral">Neutral</option>
                        <option value="follow_up">Follow Up</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="dispositionDescription">Description</Label>
                    <Textarea
                      id="dispositionDescription"
                      value={dispositionFormData.description}
                      onChange={(e) => setDispositionFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe when to use this disposition type"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dispositionColor">Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="dispositionColor"
                          type="color"
                          value={dispositionFormData.color}
                          onChange={(e) => setDispositionFormData(prev => ({ ...prev, color: e.target.value }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={dispositionFormData.color}
                          onChange={(e) => setDispositionFormData(prev => ({ ...prev, color: e.target.value }))}
                          placeholder="#6B7280"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id="dispositionStatus"
                        checked={dispositionFormData.isActive}
                        onChange={(e) => setDispositionFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="dispositionStatus" className="mb-0">
                        {dispositionFormData.isActive ? 'Active' : 'Inactive'}
                      </Label>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsDispositionModalOpen(false);
                    resetDispositionForm();
                  }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={selectedDisposition ? handleUpdateDisposition : handleCreateDisposition}
                    disabled={!dispositionFormData.name.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {selectedDisposition ? 'Update Disposition' : 'Create Disposition'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </>
  );
};

export default CallScripts;

