import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import {
  Type, Mail, Hash, Calendar, Clock, ToggleLeft, CheckSquare, FileTextIcon, Star,
  File, Globe, List, CheckCircle, Edit3, User, Phone, MapPin, Briefcase,
  DollarSign, CalendarDays, Users, Building, Target, MessageSquare, MessageCircle,
  Heart, ThumbsUp, Award, TrendingUp, BarChart3, Zap, Grid, MoreVertical, Code,
  Layout, Image, Video, SlidersHorizontal, Heading, AlignLeft, Minus, Square,
  Columns, Repeat, Calculator, CalendarCheck, Bot, Webhook, Shield, FileCheck,
  ShieldCheck, Navigation, Store, Map, MapPinned, Building2, Locate, UserCircle,
  BadgeCheck, Network, Layers3, Package, Tag, Share2, Music, CreditCard,
  Fingerprint, Key, SortAsc, ImageIcon, Lock, PenTool, Timer, ShoppingCart,
  BookOpen, Sparkles, Flag, Users2, Info, Eye, EyeOff
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FieldTypeDefinition } from './types';

interface FieldPaletteProps {
  onFieldAdd: (fieldType: string) => void;
  onHide?: () => void;
}

// Categorized Fields
const basicFields: FieldTypeDefinition[] = [
  { type: 'text', label: 'Text Input', icon: Type, description: 'Single line text' },
  { type: 'textarea', label: 'Text Area', icon: FileTextIcon, description: 'Multi-line text' },
  { type: 'rich_text', label: 'Rich Text Block', icon: FileTextIcon, description: 'Rich text editor' },
  { type: 'masked_text', label: 'Masked Text', icon: EyeOff, description: 'Password/masked input' },
  { type: 'email', label: 'Email', icon: Mail, description: 'Email address' },
  { type: 'number', label: 'Number', icon: Hash, description: 'Numeric input' },
  { type: 'phone', label: 'Phone', icon: Phone, description: 'Phone number' },
];

const dateTimeFields: FieldTypeDefinition[] = [
  { type: 'date', label: 'Date', icon: Calendar, description: 'Date input' },
  { type: 'time', label: 'Time', icon: Clock, description: 'Time input' },
  { type: 'datetime', label: 'Date & Time', icon: CalendarDays, description: 'Date and time picker' },
  { type: 'scheduler', label: 'Scheduler', icon: CalendarCheck, description: 'Meeting scheduler' },
  { type: 'timer', label: 'Timer', icon: Timer, description: 'Countdown timer' },
];

const choiceFields: FieldTypeDefinition[] = [
  { type: 'select', label: 'Dropdown', icon: List, description: 'Select from list' },
  { type: 'number_dropdown', label: 'Number Dropdown', icon: Hash, description: 'Numeric dropdown' },
  { type: 'multiselect', label: 'Multi Select', icon: CheckSquare, description: 'Multiple selection' },
  { type: 'radio', label: 'Single Choice', icon: CheckCircle, description: 'Single choice' },
  { type: 'checkbox', label: 'Multiple Choice', icon: CheckSquare, description: 'Multiple choice' },
  { type: 'picture_choice', label: 'Picture Choice', icon: ImageIcon, description: 'Choose from images' },
];

const ratingFields: FieldTypeDefinition[] = [
  { type: 'star_rating', label: 'Star Rating', icon: Star, description: 'Star rating system' },
  { type: 'slider', label: 'Slider', icon: SlidersHorizontal, description: 'Slider input' },
  { type: 'scale', label: 'Scale', icon: BarChart3, description: 'Rating scale' },
  { type: 'likert', label: 'Likert Scale', icon: BarChart3, description: 'Agreement scale' },
  { type: 'ranking', label: 'Ranking', icon: SortAsc, description: 'Rank items in order' },
  { type: 'nps', label: 'NPS', icon: Award, description: 'Net Promoter Score' },
  { type: 'like_dislike', label: 'Like / Dislike', icon: ThumbsUp, description: 'Thumbs up/down' },
];

const formattingFields: FieldTypeDefinition[] = [
  { type: 'heading', label: 'Heading', icon: Heading, description: 'Section heading' },
  { type: 'paragraph', label: 'Paragraph Text', icon: AlignLeft, description: 'Display text' },
  { type: 'explanation', label: 'Explanation', icon: Info, description: 'Help text/instructions' },
  { type: 'divider', label: 'Divider', icon: Minus, description: 'Horizontal line' },
  { type: 'spacer', label: 'Spacer', icon: Square, description: 'Empty space' },
];

const complianceFields: FieldTypeDefinition[] = [
  { type: 'legal_consent', label: 'Legal Consent', icon: Shield, description: 'Legal agreement' },
  { type: 'terms_of_service', label: 'Terms of Service', icon: FileCheck, description: 'Terms and conditions' },
  { type: 'gdpr_agreement', label: 'GDPR Agreement', icon: ShieldCheck, description: 'GDPR compliance' },
  { type: 'tcpa_consent', label: 'TCPA Consent', icon: FileCheck, description: 'TCPA compliance' },
];

const advancedFields: FieldTypeDefinition[] = [
  { type: 'file', label: 'File Upload', icon: File, description: 'Upload files' },
  { type: 'image_upload', label: 'Image Upload', icon: Image, description: 'Upload images' },
  { type: 'drawing', label: 'Drawing', icon: PenTool, description: 'Drawing canvas' },
  { type: 'matrix', label: 'Matrix', icon: Grid, description: 'Matrix questions' },
  { type: 'signature', label: 'E-Signature', icon: Edit3, description: 'Digital signature' },
  { type: 'location', label: 'Location', icon: Navigation, description: 'Location picker' },
  { type: 'google_maps', label: 'Google Maps', icon: Map, description: 'Location on Google map' },
  { type: 'url', label: 'URL', icon: Globe, description: 'Website URL' },
  { type: 'formula', label: 'Formula', icon: Calculator, description: 'Mathematical formula' },
  { type: 'price', label: 'Price', icon: DollarSign, description: 'Price input' },
  { type: 'discount_code', label: 'Discount Code', icon: Tag, description: 'Promo code input' },
  { type: 'auto_unique_id', label: 'Auto Unique ID', icon: Key, description: 'Generate unique ID' },
  { type: 'calendly', label: 'Calendly', icon: CalendarCheck, description: 'Schedule meeting' },
  { type: 'openai', label: 'Open AI', icon: Bot, description: 'AI-powered field' },
  { type: 'api_action', label: 'API Action', icon: Webhook, description: 'External API call' },
  { type: 'html', label: 'HTML Block', icon: Code, description: 'Custom HTML' },
  { type: 'yes_no', label: 'Yes/No', icon: ToggleLeft, description: 'Yes/No toggle' },
];

const mediaFields: FieldTypeDefinition[] = [
  { type: 'image', label: 'Image', icon: Image, description: 'Display image' },
  { type: 'video', label: 'Video', icon: Video, description: 'Embed video' },
  { type: 'audio', label: 'Audio', icon: Music, description: 'Audio player' },
  { type: 'embed_pdf', label: 'Embed PDF', icon: File, description: 'Embed PDF document' },
  { type: 'custom_embed', label: 'Custom Embed', icon: Code, description: 'Custom embed code' },
  { type: 'social_share', label: 'Social Share', icon: Share2, description: 'Share on social media' },
];

const paymentFields: FieldTypeDefinition[] = [
  { type: 'product_basket', label: 'Product Basket', icon: ShoppingCart, description: 'Shopping cart' },
  { type: 'stripe', label: 'Stripe', icon: CreditCard, description: 'Stripe payment' },
  { type: 'paypal', label: 'PayPal', icon: CreditCard, description: 'PayPal payment' },
];

const spamProtectionFields: FieldTypeDefinition[] = [
  { type: 'recaptcha', label: 'Recaptcha', icon: Shield, description: 'Google reCAPTCHA' },
  { type: 'turnstile', label: 'Turnstile', icon: ShieldCheck, description: 'Cloudflare Turnstile' },
];

const pageFields: FieldTypeDefinition[] = [
  { type: 'cover', label: 'Cover', icon: BookOpen, description: 'Form cover page' },
  { type: 'welcome_page', label: 'Welcome Page', icon: Sparkles, description: 'Welcome screen' },
  { type: 'ending', label: 'Ending', icon: Flag, description: 'Thank you/ending page' },
];

const layoutFields: FieldTypeDefinition[] = [
  { type: 'section', label: 'Section', icon: FileTextIcon, description: 'Section divider' },
  { type: 'page_break', label: 'Page Break', icon: MoreVertical, description: 'Multi-step form' },
  { type: 'field_group', label: 'Field Group', icon: Users2, description: 'Group related fields' },
  { type: 'layout_2col', label: '2 Columns', icon: Columns, description: 'Two column layout' },
  { type: 'layout_3col', label: '3 Columns', icon: Columns, description: 'Three column layout' },
  { type: 'layout_4col', label: '4 Columns', icon: Columns, description: 'Four column layout' },
  { type: 'repeater_group', label: 'Repeater Group', icon: Repeat, description: 'Repeatable fields' },
];

const leadGenFieldTypes: FieldTypeDefinition[] = [
  { type: 'fullname', label: 'Full Name', icon: User, description: 'Complete name field' },
  { type: 'firstname', label: 'First Name', icon: User, description: 'First name only' },
  { type: 'lastname', label: 'Last Name', icon: User, description: 'Last name only' },
  { type: 'address', label: 'Address', icon: MapPin, description: 'Full address input' },
  { type: 'company', label: 'Company', icon: Building, description: 'Business name' },
  { type: 'jobtitle', label: 'Job Title', icon: Briefcase, description: 'Professional title' },
  { type: 'budget', label: 'Budget Range', icon: DollarSign, description: 'Price/budget selector' },
  { type: 'timeline', label: 'Timeline', icon: CalendarDays, description: 'Project timeline' },
  { type: 'teamsize', label: 'Team Size', icon: Users, description: 'Number of team members' },
  { type: 'industry', label: 'Industry', icon: Target, description: 'Business industry' },
  { type: 'referral', label: 'Referral Source', icon: Heart, description: 'How they found you' },
  { type: 'satisfaction', label: 'Satisfaction', icon: ThumbsUp, description: 'Customer satisfaction' },
  { type: 'priority', label: 'Priority Level', icon: TrendingUp, description: 'Urgency/Priority' },
  { type: 'leadscore', label: 'Lead Score', icon: BarChart3, description: 'Lead qualification score' },
  { type: 'service', label: 'Service Interest', icon: Zap, description: 'Services of interest' },
  { type: 'product', label: 'Product Interest', icon: Package, description: 'Products of interest' },
  { type: 'contactmethod', label: 'Contact Method', icon: MessageSquare, description: 'Preferred contact' },
];

const franchiseFields: FieldTypeDefinition[] = [
  { type: 'location_selector', label: 'Location Selector', icon: Store, description: 'Select business location' },
  { type: 'service_area', label: 'Service Area', icon: Map, description: 'ZIP/area coverage' },
  { type: 'franchise_location', label: 'Franchise Location', icon: Building2, description: 'Franchise branch' },
  { type: 'appointment_location', label: 'Appointment Location', icon: MapPinned, description: 'Service location' },
  { type: 'service_category', label: 'Service Category', icon: Layers3, description: 'Services by location' },
  { type: 'territory', label: 'Territory', icon: Network, description: 'Sales/service territory' },
  { type: 'store_finder', label: 'Store Finder', icon: Locate, description: 'Find nearest location' },
  { type: 'operating_hours', label: 'Operating Hours', icon: Clock, description: 'Hours by location' },
  { type: 'regional_contact', label: 'Regional Contact', icon: UserCircle, description: 'Regional manager' },
  { type: 'franchise_id', label: 'Franchise ID', icon: BadgeCheck, description: 'Franchise identifier' },
];

// Accordion Component
function AccordionItem({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  count
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border last:border-0">
      <button
        className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm font-medium">{title}</span>
          {count !== undefined && (
            <span className="text-xs text-muted-foreground">
              {count}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 px-4">
          <div className="grid grid-cols-3 gap-3">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// Draggable Field Component
function DraggableField({ field, onFieldAdd, isSelected }: { field: FieldTypeDefinition; onFieldAdd?: (type: string) => void; isSelected?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-${field.type}`,
    data: {
      type: 'field-type',
      fieldType: field.type,
      label: field.label
    }
  });

  const Icon = field.icon;
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const handleClick = () => {
    if (onFieldAdd) onFieldAdd(field.type);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onFieldAdd) onFieldAdd(field.type);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="w-full"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="button"
            aria-pressed={isSelected ? 'true' : 'false'}
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={`w-full aspect-square bg-white border rounded-lg p-3 transition-all flex flex-col items-center justify-center text-center gap-2 ${isDragging
              ? 'border-primary shadow-lg opacity-60'
              : isSelected
                ? 'ring-2 ring-primary border-primary shadow-sm'
                : 'border-border hover:border-primary/50 hover:shadow-md cursor-pointer'
              }`}>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-1.5">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm font-semibold leading-tight text-center w-full truncate px-1">{field.label}</div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-medium">{field.label}</p>
          {field.description && <p className="text-xs text-muted-foreground mt-1">{field.description}</p>}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}


export function getAllFieldTypes(): FieldTypeDefinition[] {
  return [
    ...basicFields,
    ...dateTimeFields,
    ...choiceFields,
    ...ratingFields,
    ...formattingFields,
    ...complianceFields,
    ...advancedFields,
    ...mediaFields,
    ...paymentFields,
    ...spamProtectionFields,
    ...pageFields,
    ...layoutFields,
    ...leadGenFieldTypes,
    ...franchiseFields,
  ];
}

export default function FieldPalette({ onFieldAdd, onHide }: FieldPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const handleFieldAdd = (type: string) => {
    setSelectedField(type);
    if (onFieldAdd) onFieldAdd(type);
  };

  const filterFields = (fields: FieldTypeDefinition[]) =>
    fields.filter(field =>
      field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredBasicFields = useMemo(() => filterFields(basicFields), [searchQuery]);
  const filteredChoiceFields = useMemo(() => filterFields(choiceFields), [searchQuery]);
  const filteredDateTimeFields = useMemo(() => filterFields(dateTimeFields), [searchQuery]);
  const filteredRatingFields = useMemo(() => filterFields(ratingFields), [searchQuery]);
  const filteredFormattingFields = useMemo(() => filterFields(formattingFields), [searchQuery]);
  const filteredComplianceFields = useMemo(() => filterFields(complianceFields), [searchQuery]);
  const filteredLeadGenFields = useMemo(() => filterFields(leadGenFieldTypes), [searchQuery]);
  const filteredFranchiseFields = useMemo(() => filterFields(franchiseFields), [searchQuery]);
  const filteredAdvancedFields = useMemo(() => filterFields(advancedFields), [searchQuery]);
  const filteredMediaFields = useMemo(() => filterFields(mediaFields), [searchQuery]);
  const filteredLayoutFields = useMemo(() => filterFields(layoutFields), [searchQuery]);
  const filteredPaymentFields = useMemo(() => filterFields(paymentFields), [searchQuery]);
  const filteredSpamProtectionFields = useMemo(() => filterFields(spamProtectionFields), [searchQuery]);
  const filteredPageFields = useMemo(() => filterFields(pageFields), [searchQuery]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Form Fields</h2>
          {onHide && (
            <button
              onClick={onHide}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            />
          </div>
        </div>

        {/* Field Categories */}
        <div className="flex-1 overflow-y-auto">
          <AccordionItem title="Basic Fields" icon={Type} defaultOpen={true} count={filteredBasicFields.length}>
            {filteredBasicFields.map((field) => (
              <DraggableField key={field.type} field={field} onFieldAdd={handleFieldAdd} isSelected={selectedField === field.type} />
            ))}
          </AccordionItem>

          <AccordionItem title="Choice Fields" icon={List} defaultOpen={true} count={filteredChoiceFields.length}>
            {filteredChoiceFields.map((field) => (
              <DraggableField key={field.type} field={field} onFieldAdd={handleFieldAdd} isSelected={selectedField === field.type} />
            ))}
          </AccordionItem>

          <AccordionItem title="Date and Time" icon={Calendar} count={filteredDateTimeFields.length}>
            {filteredDateTimeFields.map((field) => (
              <DraggableField key={field.type} field={field} onFieldAdd={handleFieldAdd} isSelected={selectedField === field.type} />
            ))}
          </AccordionItem>

          <AccordionItem title="Rating" icon={Star} count={filteredRatingFields.length}>
            {filteredRatingFields.map((field) => (
              <DraggableField key={field.type} field={field} onFieldAdd={handleFieldAdd} isSelected={selectedField === field.type} />
            ))}
          </AccordionItem>

          <AccordionItem title="Formatting" icon={Heading} count={filteredFormattingFields.length}>
            {filteredFormattingFields.map((field) => (
              <DraggableField key={field.type} field={field} onFieldAdd={handleFieldAdd} isSelected={selectedField === field.type} />
            ))}
          </AccordionItem>

          <AccordionItem title="Lead Capture" icon={Target} count={filteredLeadGenFields.length}>
            {filteredLeadGenFields.map((field) => (
              <DraggableField key={field.type} field={field} onFieldAdd={handleFieldAdd} isSelected={selectedField === field.type} />
            ))}
          </AccordionItem>

          <AccordionItem title="Advanced" icon={Zap} count={filteredAdvancedFields.length}>
            {filteredAdvancedFields.map((field) => (
              <DraggableField key={field.type} field={field} onFieldAdd={handleFieldAdd} isSelected={selectedField === field.type} />
            ))}
          </AccordionItem>

          <AccordionItem title="Layout" icon={Layout} count={filteredLayoutFields.length}>
            {filteredLayoutFields.map((field) => (
              <DraggableField key={field.type} field={field} onFieldAdd={handleFieldAdd} isSelected={selectedField === field.type} />
            ))}
          </AccordionItem>

          <AccordionItem title="Media" icon={Video} count={filteredMediaFields.length}>
            {filteredMediaFields.map((field) => (
              <DraggableField key={field.type} field={field} onFieldAdd={handleFieldAdd} isSelected={selectedField === field.type} />
            ))}
          </AccordionItem>

          <AccordionItem title="Payment" icon={CreditCard} count={filteredPaymentFields.length}>
            {filteredPaymentFields.map((field) => (
              <DraggableField key={field.type} field={field} onFieldAdd={handleFieldAdd} isSelected={selectedField === field.type} />
            ))}
          </AccordionItem>

          <AccordionItem title="Compliance" icon={Shield} count={filteredComplianceFields.length}>
            {filteredComplianceFields.map((field) => (
              <DraggableField key={field.type} field={field} onFieldAdd={onFieldAdd} />
            ))}
          </AccordionItem>

          <AccordionItem title="Spam Protection" icon={Shield} count={filteredSpamProtectionFields.length}>
            {filteredSpamProtectionFields.map((field) => (
              <DraggableField key={field.type} field={field} onFieldAdd={handleFieldAdd} isSelected={selectedField === field.type} />
            ))}
          </AccordionItem>

          <AccordionItem title="Franchise & Multi-Location" icon={Store} count={filteredFranchiseFields.length}>
            {filteredFranchiseFields.map((field) => (
              <DraggableField key={field.type} field={field} />
            ))}
          </AccordionItem>

          <AccordionItem title="Page Fields" icon={BookOpen} count={filteredPageFields.length}>
            {filteredPageFields.map((field) => (
              <DraggableField key={field.type} field={field} onFieldAdd={handleFieldAdd} isSelected={selectedField === field.type} />
            ))}
          </AccordionItem>
        </div>
      </div>
    </TooltipProvider>
  );
}


