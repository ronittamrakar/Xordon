// Email Template Builder Types

export type BlockType = 
  | 'text' 
  | 'heading' 
  | 'image' 
  | 'button' 
  | 'divider' 
  | 'spacer' 
  | 'columns' 
  | 'social' 
  | 'video' 
  | 'html' 
  | 'quote'
  | 'list'
  | 'table'
  | 'countdown'
  | 'menu'
  | 'footer'
  | 'hero'
  | 'testimonial'
  | 'pricing'
  | 'feature'
  | 'cta'
  | 'imageText'
  | 'gallery'
  | 'stats'
  | 'faq'
  | 'signature'
  | 'url'
  | 'calendar'
  | 'map'
  | 'coupon'
  | 'rating'
  | 'progress'
  | 'accordion'
  | 'iconList'
  | 'beforeAfter';

export interface BlockStyle {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  padding?: string;
  margin?: string;
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  borderStyle?: string;
  lineHeight?: string;
  letterSpacing?: string;
  width?: string;
  maxWidth?: string;
}

export interface ButtonStyle extends BlockStyle {
  buttonColor?: string;
  buttonTextColor?: string;
  buttonBorderRadius?: string;
  buttonPadding?: string;
  hoverColor?: string;
}

export interface ImageSettings {
  src: string;
  alt: string;
  width?: string;
  height?: string;
  link?: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface SocialLink {
  platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'youtube' | 'tiktok' | 'pinterest' | 'website';
  url: string;
  icon?: string;
}

export interface ColumnConfig {
  width: string;
  content: EmailBlock[];
}

export interface TableCell {
  content: string;
  style?: BlockStyle;
}

export interface TableRow {
  cells: TableCell[];
}

export interface CountdownSettings {
  targetDate: string;
  timezone?: string;
  showDays?: boolean;
  showHours?: boolean;
  showMinutes?: boolean;
  showSeconds?: boolean;
  expiredMessage?: string;
}

export interface MenuItem {
  label: string;
  url: string;
}

export interface HeroSettings {
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  overlay?: boolean;
}

export interface TestimonialSettings {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  avatar?: string;
  rating?: number;
}

export interface PricingSettings {
  planName: string;
  price: string;
  period?: string;
  features: string[];
  buttonText: string;
  buttonUrl: string;
  highlighted?: boolean;
}

export interface FeatureSettings {
  icon?: string;
  title: string;
  description: string;
  imageUrl?: string;
  imagePosition?: 'left' | 'right' | 'top';
}

export interface CtaSettings {
  headline: string;
  subheadline?: string;
  buttonText: string;
  buttonUrl: string;
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
}

export interface ImageTextSettings {
  imageUrl: string;
  imageAlt?: string;
  title: string;
  description: string;
  buttonText?: string;
  buttonUrl?: string;
  imagePosition: 'left' | 'right';
}

export interface GallerySettings {
  images: { src: string; alt?: string; link?: string }[];
  columns: number;
}

export interface StatsSettings {
  stats: { value: string; label: string; prefix?: string; suffix?: string }[];
}

export interface FaqSettings {
  items: { question: string; answer: string }[];
}

export interface SignatureSettings {
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  avatar?: string;
  socialLinks?: SocialLink[];
}

export interface UrlSettings {
  url: string;
  displayText: string;
  style?: 'link' | 'button' | 'card';
  description?: string;
  favicon?: string;
}

export interface CalendarSettings {
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  eventLocation?: string;
  eventDescription?: string;
  addToCalendarUrl?: string;
}

export interface MapSettings {
  address: string;
  mapImageUrl?: string;
  directionsUrl?: string;
  zoom?: number;
}

export interface CouponSettings {
  code: string;
  discount: string;
  description?: string;
  expiryDate?: string;
  terms?: string;
  backgroundColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface RatingSettings {
  rating: number;
  maxRating: number;
  showNumber?: boolean;
  style?: 'stars' | 'hearts' | 'circles';
}

export interface ProgressSettings {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
}

export interface AccordionItem {
  title: string;
  content: string;
  isOpen?: boolean;
}

export interface AccordionSettings {
  items: AccordionItem[];
  allowMultiple?: boolean;
}

export interface IconListItem {
  icon: string;
  text: string;
  subtext?: string;
}

export interface IconListSettings {
  items: IconListItem[];
  iconColor?: string;
}

export interface BeforeAfterSettings {
  beforeImage?: string;
  afterImage?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export interface EmailBlock {
  id: string;
  type: BlockType;
  content: string;
  style: BlockStyle;
  settings?: {
    image?: ImageSettings;
    button?: ButtonStyle & { text: string; url: string };
    social?: SocialLink[];
    columns?: ColumnConfig[];
    video?: { url: string; thumbnail?: string };
    list?: { items: string[]; listType: 'bullet' | 'numbered' };
    table?: { rows: TableRow[]; headerRow?: boolean };
    countdown?: CountdownSettings;
    menu?: { items: MenuItem[]; orientation: 'horizontal' | 'vertical' };
    spacerHeight?: string;
    dividerStyle?: 'solid' | 'dashed' | 'dotted';
    dividerColor?: string;
    dividerWidth?: string;
    hero?: HeroSettings;
    testimonial?: TestimonialSettings;
    pricing?: PricingSettings;
    feature?: FeatureSettings;
    cta?: CtaSettings;
    imageText?: ImageTextSettings;
    gallery?: GallerySettings;
    stats?: StatsSettings;
    faq?: FaqSettings;
    signature?: SignatureSettings;
    url?: UrlSettings;
    calendar?: CalendarSettings;
    map?: MapSettings;
    coupon?: CouponSettings;
    rating?: RatingSettings;
    progress?: ProgressSettings;
    accordion?: AccordionSettings;
    iconList?: IconListSettings;
    beforeAfter?: BeforeAfterSettings;
  };
}

export interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  preheader?: string;
  blocks: EmailBlock[];
  globalStyles: GlobalStyles;
  created_at?: string;
  updated_at?: string;
}

export interface GlobalStyles {
  backgroundColor: string;
  contentBackgroundColor: string;
  contentWidth: string;
  fontFamily: string;
  fontSize: string;
  textColor: string;
  linkColor: string;
  headingColor: string;
  borderRadius: string;
}

export interface DragItem {
  type: string;
  blockType: BlockType;
  index?: number;
}

export const DEFAULT_GLOBAL_STYLES: GlobalStyles = {
  backgroundColor: '#f4f4f4',
  contentBackgroundColor: '#ffffff',
  contentWidth: '600px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '16px',
  textColor: '#333333',
  linkColor: '#0066cc',
  headingColor: '#222222',
  borderRadius: '0px',
};

export const DEFAULT_BLOCK_STYLE: BlockStyle = {
  backgroundColor: 'transparent',
  textColor: '#333333',
  fontSize: '16px',
  fontFamily: 'inherit',
  textAlign: 'left',
  padding: '16px',
  margin: '0',
  borderRadius: '0',
};

export const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
];

export const FONT_SIZES = [
  '10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '64px'
];

export const SOCIAL_PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: '📘' },
  { id: 'twitter', label: 'Twitter/X', icon: '🐦' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'instagram', label: 'Instagram', icon: '📷' },
  { id: 'youtube', label: 'YouTube', icon: '📺' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'pinterest', label: 'Pinterest', icon: '📌' },
  { id: 'website', label: 'Website', icon: '🌐' },
];
