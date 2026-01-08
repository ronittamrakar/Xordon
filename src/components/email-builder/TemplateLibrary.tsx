import React from 'react';
import { FileTextIcon, ShoppingCart, Calendar, Bell, Heart, Rocket, Mail, Gift, Star, Users, TrendingUp, Sparkles, PartyPopper, PaintBucket, Droplets, Home, Wrench, Hammer, Leaf, Truck, Shield, Brush } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { EmailBlock, GlobalStyles, DEFAULT_GLOBAL_STYLES, DEFAULT_BLOCK_STYLE } from './types';

interface TemplateLibraryProps {
  onSelectTemplate: (blocks: EmailBlock[], styles: GlobalStyles) => void;
}

interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  blocks: EmailBlock[];
  styles: GlobalStyles;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to create blocks with unique IDs
const createBlock = (type: EmailBlock['type'], content: string, style: Partial<EmailBlock['style']> = {}, settings?: EmailBlock['settings']): EmailBlock => ({
  id: generateId(),
  type,
  content,
  style: { ...DEFAULT_BLOCK_STYLE, ...style },
  settings,
});


const TEMPLATE_PRESETS: TemplatePreset[] = [
  // 1. Blank Template
  {
    id: 'blank',
    name: 'Blank Template',
    description: 'Start from scratch',
    icon: <FileTextIcon className="h-5 w-5" />,
    category: 'Basic',
    blocks: [],
    styles: DEFAULT_GLOBAL_STYLES,
  },

  // 2. Welcome Email - Modern & Clean
  {
    id: 'welcome-modern',
    name: 'Modern Welcome',
    description: 'Clean onboarding email',
    icon: <Heart className="h-5 w-5" />,
    category: 'Onboarding',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 16px', backgroundColor: '#4F46E5' }, {
        image: { src: 'https://via.placeholder.com/180x50/ffffff/4F46E5?text=LOGO', alt: 'Logo', alignment: 'center' }
      }),
      createBlock('heading', 'Welcome to the Family! 🎉', { textAlign: 'center', fontSize: '32px', padding: '24px', backgroundColor: '#4F46E5', textColor: '#ffffff' }),
      createBlock('text', '<p style="text-align:center;color:#E0E7FF;">You\'re now part of something special</p>', { textAlign: 'center', padding: '0 24px 32px', backgroundColor: '#4F46E5' }),
      createBlock('spacer', '', {}, { spacerHeight: '24px' }),
      createBlock('text', '<p>Hi {{firstName}},</p><p>Welcome aboard! We\'re thrilled to have you join our community of innovators and creators.</p>', { padding: '24px' }),
      createBlock('heading', 'Here\'s what happens next:', { fontSize: '20px', padding: '16px 24px 8px' }),
      createBlock('list', '', { padding: '8px 24px 24px' }, { list: { items: ['Complete your profile setup', 'Explore our features', 'Connect with the community', 'Start creating amazing things'], listType: 'numbered' } }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Get Started Now', url: '#', buttonColor: '#4F46E5', buttonTextColor: '#ffffff', buttonBorderRadius: '8px', buttonPadding: '16px 40px' } }),
      createBlock('divider', '', { padding: '24px' }, { dividerStyle: 'solid', dividerColor: '#E5E7EB', dividerWidth: '1px' }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">Need help? Reply to this email or visit our <a href="#" style="color:#4F46E5;">Help Center</a></p>', { textAlign: 'center', padding: '16px 24px' }),
      createBlock('footer', '© 2024 Your Company. All rights reserved.', { padding: '24px', backgroundColor: '#F9FAFB' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#F3F4F6', contentBackgroundColor: '#ffffff', linkColor: '#4F46E5', headingColor: '#111827' },
  },

  // 3. Newsletter - Magazine Style
  {
    id: 'newsletter-magazine',
    name: 'Magazine Newsletter',
    description: 'Editorial style newsletter',
    icon: <Mail className="h-5 w-5" />,
    category: 'Newsletter',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '24px', backgroundColor: '#0F172A' }, {
        image: { src: 'https://via.placeholder.com/160x40/ffffff/0F172A?text=THE+WEEKLY', alt: 'Newsletter', alignment: 'center' }
      }),
      createBlock('menu', '', { padding: '0 24px 24px', backgroundColor: '#0F172A' }, { menu: { items: [{ label: 'Tech', url: '#' }, { label: 'Business', url: '#' }, { label: 'Design', url: '#' }, { label: 'Culture', url: '#' }], orientation: 'horizontal' } }),
      createBlock('image', '', { padding: '0' }, { image: { src: 'https://via.placeholder.com/600x300/3B82F6/ffffff?text=FEATURED+STORY', alt: 'Featured', alignment: 'center', width: '100%' } }),
      createBlock('heading', 'The Future of AI in Creative Industries', { fontSize: '28px', padding: '24px 24px 8px' }),
      createBlock('text', '<p style="color:#64748B;font-size:14px;">December 1, 2024 • 8 min read</p>', { padding: '0 24px 16px' }),
      createBlock('text', '<p>Artificial intelligence is revolutionizing how we create, design, and innovate. From generating artwork to composing music, AI tools are becoming indispensable partners in the creative process...</p>', { padding: '0 24px 16px' }),
      createBlock('button', '', { textAlign: 'left', padding: '0 24px 32px' }, { button: { text: 'Continue Reading →', url: '#', buttonColor: '#3B82F6', buttonTextColor: '#ffffff', buttonBorderRadius: '6px', buttonPadding: '12px 24px' } }),
      createBlock('divider', '', { padding: '0 24px' }, { dividerStyle: 'solid', dividerColor: '#E2E8F0', dividerWidth: '1px' }),
      createBlock('heading', 'More Stories', { fontSize: '18px', padding: '24px 24px 16px', textColor: '#64748B' }),
      createBlock('text', '<p><strong>🚀 Startup Spotlight:</strong> How a small team built a billion-dollar company</p><p><strong>💡 Design Trends:</strong> What\'s shaping visual design in 2025</p><p><strong>📊 Data Deep Dive:</strong> Understanding user behavior patterns</p>', { padding: '0 24px 24px' }),
      createBlock('social', '', { padding: '24px', backgroundColor: '#F8FAFC' }, { social: [{ platform: 'twitter', url: '#' }, { platform: 'linkedin', url: '#' }, { platform: 'instagram', url: '#' }] }),
      createBlock('footer', '© 2024 The Weekly. Unsubscribe anytime.', { padding: '24px', backgroundColor: '#F8FAFC' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#E2E8F0', contentBackgroundColor: '#ffffff', linkColor: '#3B82F6', headingColor: '#0F172A' },
  },


  // 4. E-commerce Sale - Bold & Vibrant
  {
    id: 'ecommerce-sale',
    name: 'Flash Sale',
    description: 'Bold promotional email',
    icon: <ShoppingCart className="h-5 w-5" />,
    category: 'E-commerce',
    blocks: [
      createBlock('heading', '⚡ FLASH SALE ⚡', { textAlign: 'center', fontSize: '42px', padding: '40px 24px 8px', backgroundColor: '#DC2626', textColor: '#ffffff', fontWeight: 'bold' }),
      createBlock('heading', 'UP TO 70% OFF', { textAlign: 'center', fontSize: '56px', padding: '0 24px 8px', backgroundColor: '#DC2626', textColor: '#FEF08A', fontWeight: 'bold' }),
      createBlock('text', '<p style="text-align:center;font-size:18px;">Limited time only • Ends midnight</p>', { textAlign: 'center', padding: '0 24px 32px', backgroundColor: '#DC2626', textColor: '#FEE2E2' }),
      createBlock('countdown', '', { padding: '24px', backgroundColor: '#DC2626' }, { countdown: { targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), expiredMessage: 'Sale ended!' } }),
      createBlock('spacer', '', {}, { spacerHeight: '24px' }),
      createBlock('image', '', { padding: '24px' }, { image: { src: 'https://via.placeholder.com/560x280/F3F4F6/374151?text=BEST+SELLERS', alt: 'Products', alignment: 'center', width: '100%' } }),
      createBlock('heading', 'Top Picks For You', { fontSize: '24px', textAlign: 'center', padding: '16px 24px' }),
      createBlock('text', '<p style="text-align:center;">Handpicked deals based on your preferences</p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'SHOP NOW', url: '#', buttonColor: '#DC2626', buttonTextColor: '#ffffff', buttonBorderRadius: '50px', buttonPadding: '18px 60px' } }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">Use code <strong style="color:#DC2626;">FLASH70</strong> at checkout</p>', { textAlign: 'center', padding: '0 24px 32px' }),
      createBlock('divider', '', { padding: '0 24px' }, { dividerStyle: 'dashed', dividerColor: '#E5E7EB', dividerWidth: '2px' }),
      createBlock('text', '<p style="text-align:center;font-size:12px;color:#9CA3AF;">Free shipping on orders over $50 • Easy returns</p>', { textAlign: 'center', padding: '24px' }),
      createBlock('footer', '© 2024 Your Store', { padding: '24px', backgroundColor: '#F9FAFB' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#FEE2E2', contentBackgroundColor: '#ffffff', linkColor: '#DC2626' },
  },

  // 5. SaaS Product Update
  {
    id: 'saas-update',
    name: 'Product Update',
    description: 'Feature announcement',
    icon: <Rocket className="h-5 w-5" />,
    category: 'Product',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 24px' }, { image: { src: 'https://via.placeholder.com/140x40/6366F1/ffffff?text=PRODUCT', alt: 'Logo', alignment: 'center' } }),
      createBlock('text', '<p style="text-align:center;color:#6366F1;font-weight:600;text-transform:uppercase;letter-spacing:2px;font-size:12px;">Product Update</p>', { textAlign: 'center', padding: '0 24px 8px' }),
      createBlock('heading', 'Introducing Dark Mode 🌙', { textAlign: 'center', fontSize: '36px', padding: '8px 24px 16px' }),
      createBlock('text', '<p style="text-align:center;font-size:18px;color:#6B7280;">Plus 5 more features you\'ve been asking for</p>', { textAlign: 'center', padding: '0 24px 32px' }),
      createBlock('image', '', { padding: '0 24px 24px' }, { image: { src: 'https://via.placeholder.com/560x300/1F2937/ffffff?text=DARK+MODE+PREVIEW', alt: 'Dark Mode', alignment: 'center', width: '100%' } }),
      createBlock('heading', 'What\'s New', { fontSize: '20px', padding: '24px 24px 16px' }),
      createBlock('list', '', { padding: '0 24px 24px' }, { list: { items: ['🌙 Dark mode - Easy on the eyes', '⚡ 2x faster load times', '📱 Improved mobile experience', '🔔 Smart notifications', '🎨 Custom themes'], listType: 'bullet' } }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Try It Now', url: '#', buttonColor: '#6366F1', buttonTextColor: '#ffffff', buttonBorderRadius: '8px', buttonPadding: '14px 32px' } }),
      createBlock('quote', 'This update is a game-changer! The dark mode is exactly what I needed for late-night work sessions.', { padding: '24px', backgroundColor: '#F5F3FF' }),
      createBlock('text', '<p style="text-align:right;font-size:14px;color:#6B7280;">— Sarah K., Power User</p>', { textAlign: 'right', padding: '0 24px 24px', backgroundColor: '#F5F3FF' }),
      createBlock('footer', '© 2024 Product Inc.', { padding: '24px' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#EEF2FF', contentBackgroundColor: '#ffffff', linkColor: '#6366F1', headingColor: '#1F2937' },
  },


  // 6. Event Invitation - Elegant
  {
    id: 'event-elegant',
    name: 'Elegant Event',
    description: 'Sophisticated invitation',
    icon: <Calendar className="h-5 w-5" />,
    category: 'Events',
    blocks: [
      createBlock('spacer', '', { backgroundColor: '#1F2937' }, { spacerHeight: '40px' }),
      createBlock('text', '<p style="text-align:center;color:#D4AF37;font-size:14px;letter-spacing:3px;text-transform:uppercase;">You\'re Cordially Invited</p>', { textAlign: 'center', padding: '0 24px', backgroundColor: '#1F2937' }),
      createBlock('heading', 'Annual Gala 2024', { textAlign: 'center', fontSize: '42px', padding: '16px 24px', backgroundColor: '#1F2937', textColor: '#ffffff' }),
      createBlock('text', '<p style="text-align:center;color:#9CA3AF;font-size:16px;">An Evening of Excellence</p>', { textAlign: 'center', padding: '0 24px 40px', backgroundColor: '#1F2937' }),
      createBlock('divider', '', { padding: '0 60px', backgroundColor: '#1F2937' }, { dividerStyle: 'solid', dividerColor: '#D4AF37', dividerWidth: '1px' }),
      createBlock('spacer', '', { backgroundColor: '#1F2937' }, { spacerHeight: '32px' }),
      createBlock('text', '<p style="text-align:center;color:#ffffff;font-size:18px;"><strong>Saturday, December 14, 2024</strong></p><p style="text-align:center;color:#9CA3AF;">7:00 PM - 11:00 PM</p>', { textAlign: 'center', padding: '0 24px', backgroundColor: '#1F2937' }),
      createBlock('spacer', '', { backgroundColor: '#1F2937' }, { spacerHeight: '24px' }),
      createBlock('text', '<p style="text-align:center;color:#ffffff;font-size:18px;"><strong>The Grand Ballroom</strong></p><p style="text-align:center;color:#9CA3AF;">123 Elegant Avenue, New York, NY</p>', { textAlign: 'center', padding: '0 24px', backgroundColor: '#1F2937' }),
      createBlock('spacer', '', { backgroundColor: '#1F2937' }, { spacerHeight: '32px' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px', backgroundColor: '#1F2937' }, { button: { text: 'RSVP Now', url: '#', buttonColor: '#D4AF37', buttonTextColor: '#1F2937', buttonBorderRadius: '0px', buttonPadding: '16px 48px' } }),
      createBlock('spacer', '', { backgroundColor: '#1F2937' }, { spacerHeight: '24px' }),
      createBlock('text', '<p style="text-align:center;color:#6B7280;font-size:12px;">Black Tie Optional • Valet Parking Available</p>', { textAlign: 'center', padding: '0 24px 40px', backgroundColor: '#1F2937' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#111827', contentBackgroundColor: '#1F2937', linkColor: '#D4AF37', textColor: '#ffffff' },
  },

  // 7. Abandoned Cart Recovery
  {
    id: 'abandoned-cart',
    name: 'Cart Recovery',
    description: 'Win back customers',
    icon: <ShoppingCart className="h-5 w-5" />,
    category: 'E-commerce',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 24px' }, { image: { src: 'https://via.placeholder.com/140x40/10B981/ffffff?text=STORE', alt: 'Logo', alignment: 'center' } }),
      createBlock('heading', 'Forgot Something? 🛒', { textAlign: 'center', fontSize: '32px', padding: '16px 24px' }),
      createBlock('text', '<p style="text-align:center;font-size:18px;color:#6B7280;">Your cart is feeling lonely</p>', { textAlign: 'center', padding: '0 24px 32px' }),
      createBlock('image', '', { padding: '0 24px 24px' }, { image: { src: 'https://via.placeholder.com/200x200/F3F4F6/374151?text=PRODUCT', alt: 'Product', alignment: 'center' } }),
      createBlock('heading', 'Premium Wireless Headphones', { textAlign: 'center', fontSize: '20px', padding: '0 24px 8px' }),
      createBlock('text', '<p style="text-align:center;font-size:24px;font-weight:bold;color:#10B981;">$149.99</p><p style="text-align:center;color:#9CA3AF;text-decoration:line-through;">$199.99</p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Complete Your Order', url: '#', buttonColor: '#10B981', buttonTextColor: '#ffffff', buttonBorderRadius: '8px', buttonPadding: '16px 40px' } }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">🎁 Use code <strong>COMEBACK15</strong> for 15% off</p>', { textAlign: 'center', padding: '0 24px 32px' }),
      createBlock('divider', '', { padding: '0 24px' }, { dividerStyle: 'solid', dividerColor: '#E5E7EB', dividerWidth: '1px' }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">✓ Free shipping ✓ 30-day returns ✓ Secure checkout</p>', { textAlign: 'center', padding: '24px' }),
      createBlock('footer', '© 2024 Your Store', { padding: '24px', backgroundColor: '#F9FAFB' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#ECFDF5', contentBackgroundColor: '#ffffff', linkColor: '#10B981' },
  },


  // 8. Webinar Invitation
  {
    id: 'webinar',
    name: 'Webinar Invite',
    description: 'Online event registration',
    icon: <Users className="h-5 w-5" />,
    category: 'Events',
    blocks: [
      createBlock('text', '<p style="text-align:center;color:#7C3AED;font-weight:600;text-transform:uppercase;letter-spacing:2px;font-size:12px;">Free Live Webinar</p>', { textAlign: 'center', padding: '32px 24px 8px' }),
      createBlock('heading', 'Master the Art of Digital Marketing', { textAlign: 'center', fontSize: '32px', padding: '8px 24px 16px' }),
      createBlock('text', '<p style="text-align:center;font-size:16px;color:#6B7280;">Learn proven strategies from industry experts</p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('image', '', { padding: '0 24px 24px' }, { image: { src: 'https://via.placeholder.com/560x280/7C3AED/ffffff?text=WEBINAR+PREVIEW', alt: 'Webinar', alignment: 'center', width: '100%' } }),
      createBlock('text', '<p style="text-align:center;font-size:20px;font-weight:bold;">📅 Thursday, December 12, 2024</p><p style="text-align:center;font-size:16px;color:#6B7280;">2:00 PM EST • 60 minutes</p>', { textAlign: 'center', padding: '24px' }),
      createBlock('heading', 'What You\'ll Learn:', { fontSize: '18px', padding: '16px 24px 8px' }),
      createBlock('list', '', { padding: '0 24px 24px' }, { list: { items: ['Build a winning content strategy', 'Optimize your social media presence', 'Convert leads into customers', 'Measure and improve ROI'], listType: 'bullet' } }),
      createBlock('heading', 'Your Host', { fontSize: '18px', padding: '16px 24px 8px' }),
      createBlock('text', '<p><strong>Jane Smith</strong> - CMO at TechCorp</p><p style="color:#6B7280;font-size:14px;">15+ years of marketing experience, helped 500+ businesses grow</p>', { padding: '0 24px 24px' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Reserve My Spot', url: '#', buttonColor: '#7C3AED', buttonTextColor: '#ffffff', buttonBorderRadius: '8px', buttonPadding: '16px 40px' } }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">🎁 All attendees receive a free marketing toolkit</p>', { textAlign: 'center', padding: '0 24px 32px' }),
      createBlock('footer', '© 2024 Marketing Academy', { padding: '24px', backgroundColor: '#F5F3FF' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#F5F3FF', contentBackgroundColor: '#ffffff', linkColor: '#7C3AED' },
  },

  // 9. Thank You / Order Confirmation
  {
    id: 'order-confirmation',
    name: 'Order Confirmation',
    description: 'Purchase thank you',
    icon: <Gift className="h-5 w-5" />,
    category: 'E-commerce',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 24px' }, { image: { src: 'https://via.placeholder.com/140x40/059669/ffffff?text=STORE', alt: 'Logo', alignment: 'center' } }),
      createBlock('heading', 'Thank You! 🎉', { textAlign: 'center', fontSize: '36px', padding: '16px 24px 8px' }),
      createBlock('text', '<p style="text-align:center;font-size:18px;color:#6B7280;">Your order has been confirmed</p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('text', '<p style="text-align:center;background:#ECFDF5;padding:16px;border-radius:8px;font-size:14px;"><strong>Order #12345678</strong><br/>Estimated delivery: Dec 5-7, 2024</p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('divider', '', { padding: '0 24px' }, { dividerStyle: 'solid', dividerColor: '#E5E7EB', dividerWidth: '1px' }),
      createBlock('heading', 'Order Summary', { fontSize: '18px', padding: '24px 24px 16px' }),
      createBlock('table', '', { padding: '0 24px 24px' }, { table: { rows: [{ cells: [{ content: 'Product' }, { content: 'Qty' }, { content: 'Price' }] }, { cells: [{ content: 'Wireless Headphones' }, { content: '1' }, { content: '$149.99' }] }, { cells: [{ content: 'Phone Case' }, { content: '2' }, { content: '$29.98' }] }, { cells: [{ content: 'Subtotal' }, { content: '' }, { content: '$179.97' }] }, { cells: [{ content: 'Shipping' }, { content: '' }, { content: 'FREE' }] }, { cells: [{ content: 'Total' }, { content: '' }, { content: '$179.97' }] }], headerRow: true } }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Track Your Order', url: '#', buttonColor: '#059669', buttonTextColor: '#ffffff', buttonBorderRadius: '8px', buttonPadding: '14px 32px' } }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">Questions? Contact us at support@store.com</p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('footer', '© 2024 Your Store', { padding: '24px', backgroundColor: '#F9FAFB' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#F0FDF4', contentBackgroundColor: '#ffffff', linkColor: '#059669' },
  },


  // 10. Feedback Request
  {
    id: 'feedback',
    name: 'Feedback Request',
    description: 'Customer survey',
    icon: <Star className="h-5 w-5" />,
    category: 'Engagement',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 24px' }, { image: { src: 'https://via.placeholder.com/140x40/F59E0B/ffffff?text=BRAND', alt: 'Logo', alignment: 'center' } }),
      createBlock('heading', 'How Did We Do? ⭐', { textAlign: 'center', fontSize: '32px', padding: '16px 24px' }),
      createBlock('text', '<p style="text-align:center;font-size:16px;color:#6B7280;">Your feedback helps us improve</p>', { textAlign: 'center', padding: '0 24px 32px' }),
      createBlock('text', '<p style="text-align:center;font-size:48px;">⭐⭐⭐⭐⭐</p>', { textAlign: 'center', padding: '0 24px 16px' }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">Click a star to rate your experience</p>', { textAlign: 'center', padding: '0 24px 32px' }),
      createBlock('divider', '', { padding: '0 24px' }, { dividerStyle: 'solid', dividerColor: '#E5E7EB', dividerWidth: '1px' }),
      createBlock('text', '<p>Hi {{firstName}},</p><p>Thank you for your recent purchase! We\'d love to hear about your experience.</p><p>Your feedback takes less than 2 minutes and helps us serve you better.</p>', { padding: '24px' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Share Your Feedback', url: '#', buttonColor: '#F59E0B', buttonTextColor: '#ffffff', buttonBorderRadius: '8px', buttonPadding: '16px 40px' } }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">🎁 Complete the survey for 10% off your next order</p>', { textAlign: 'center', padding: '0 24px 32px' }),
      createBlock('footer', '© 2024 Your Brand', { padding: '24px', backgroundColor: '#FFFBEB' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#FFFBEB', contentBackgroundColor: '#ffffff', linkColor: '#F59E0B' },
  },

  // 11. Re-engagement Campaign
  {
    id: 'reengagement',
    name: 'We Miss You',
    description: 'Win back inactive users',
    icon: <Heart className="h-5 w-5" />,
    category: 'Engagement',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 24px' }, { image: { src: 'https://via.placeholder.com/140x40/EC4899/ffffff?text=BRAND', alt: 'Logo', alignment: 'center' } }),
      createBlock('heading', 'We Miss You! 💕', { textAlign: 'center', fontSize: '36px', padding: '16px 24px' }),
      createBlock('text', '<p style="text-align:center;font-size:18px;color:#6B7280;">It\'s been a while since we\'ve seen you</p>', { textAlign: 'center', padding: '0 24px 32px' }),
      createBlock('image', '', { padding: '0 24px 24px' }, { image: { src: 'https://via.placeholder.com/300x200/FDF2F8/EC4899?text=MISS+YOU', alt: 'Miss You', alignment: 'center' } }),
      createBlock('text', '<p>Hi {{firstName}},</p><p>We noticed you haven\'t visited in a while, and we wanted to check in. A lot has changed since you\'ve been away!</p>', { padding: '24px' }),
      createBlock('heading', 'What\'s New:', { fontSize: '18px', padding: '0 24px 8px' }),
      createBlock('list', '', { padding: '0 24px 24px' }, { list: { items: ['New product collections', 'Improved user experience', 'Exclusive member benefits', 'Better prices than ever'], listType: 'bullet' } }),
      createBlock('text', '<p style="text-align:center;font-size:20px;font-weight:bold;color:#EC4899;">Here\'s 25% off to welcome you back!</p>', { textAlign: 'center', padding: '16px 24px' }),
      createBlock('text', '<p style="text-align:center;font-size:14px;background:#FDF2F8;padding:16px;border-radius:8px;">Use code: <strong>COMEBACK25</strong></p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Come Back & Save', url: '#', buttonColor: '#EC4899', buttonTextColor: '#ffffff', buttonBorderRadius: '50px', buttonPadding: '16px 48px' } }),
      createBlock('footer', '© 2024 Your Brand', { padding: '24px', backgroundColor: '#FDF2F8' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#FDF2F8', contentBackgroundColor: '#ffffff', linkColor: '#EC4899' },
  },

  // 12. Referral Program
  {
    id: 'referral',
    name: 'Referral Program',
    description: 'Invite friends campaign',
    icon: <Users className="h-5 w-5" />,
    category: 'Engagement',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 24px' }, { image: { src: 'https://via.placeholder.com/140x40/8B5CF6/ffffff?text=BRAND', alt: 'Logo', alignment: 'center' } }),
      createBlock('heading', 'Give $20, Get $20 🎁', { textAlign: 'center', fontSize: '36px', padding: '16px 24px' }),
      createBlock('text', '<p style="text-align:center;font-size:18px;color:#6B7280;">Share the love with friends and family</p>', { textAlign: 'center', padding: '0 24px 32px' }),
      createBlock('image', '', { padding: '0 24px 24px' }, { image: { src: 'https://via.placeholder.com/400x200/EDE9FE/8B5CF6?text=REFER+A+FRIEND', alt: 'Referral', alignment: 'center', width: '100%' } }),
      createBlock('heading', 'How It Works:', { fontSize: '20px', textAlign: 'center', padding: '24px 24px 16px' }),
      createBlock('text', '<p style="text-align:center;"><strong>1.</strong> Share your unique link<br/><strong>2.</strong> Friend gets $20 off their first order<br/><strong>3.</strong> You get $20 credit when they purchase</p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('text', '<p style="text-align:center;font-size:14px;background:#EDE9FE;padding:16px;border-radius:8px;">Your referral link:<br/><strong style="color:#8B5CF6;">yourstore.com/ref/{{firstName}}</strong></p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Start Sharing', url: '#', buttonColor: '#8B5CF6', buttonTextColor: '#ffffff', buttonBorderRadius: '8px', buttonPadding: '16px 40px' } }),
      createBlock('social', '', { padding: '24px' }, { social: [{ platform: 'facebook', url: '#' }, { platform: 'twitter', url: '#' }, { platform: 'linkedin', url: '#' }] }),
      createBlock('footer', '© 2024 Your Brand', { padding: '24px', backgroundColor: '#F5F3FF' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#F5F3FF', contentBackgroundColor: '#ffffff', linkColor: '#8B5CF6' },
  },


  // 13. Birthday/Anniversary
  {
    id: 'birthday',
    name: 'Birthday Special',
    description: 'Celebration email',
    icon: <PartyPopper className="h-5 w-5" />,
    category: 'Engagement',
    blocks: [
      createBlock('text', '<p style="text-align:center;font-size:48px;">🎂🎉🎁</p>', { textAlign: 'center', padding: '32px 24px 16px', backgroundColor: '#FEF3C7' }),
      createBlock('heading', 'Happy Birthday, {{firstName}}!', { textAlign: 'center', fontSize: '36px', padding: '0 24px 16px', backgroundColor: '#FEF3C7' }),
      createBlock('text', '<p style="text-align:center;font-size:18px;color:#92400E;">Wishing you an amazing day!</p>', { textAlign: 'center', padding: '0 24px 32px', backgroundColor: '#FEF3C7' }),
      createBlock('spacer', '', {}, { spacerHeight: '24px' }),
      createBlock('text', '<p style="text-align:center;font-size:20px;">To celebrate your special day, here\'s a gift from us:</p>', { textAlign: 'center', padding: '24px' }),
      createBlock('text', '<p style="text-align:center;font-size:64px;font-weight:bold;color:#F59E0B;">30% OFF</p>', { textAlign: 'center', padding: '0 24px' }),
      createBlock('text', '<p style="text-align:center;font-size:16px;color:#6B7280;">Your entire purchase</p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('text', '<p style="text-align:center;font-size:14px;background:#FEF3C7;padding:16px;border-radius:8px;">Use code: <strong style="color:#F59E0B;">BDAY30</strong><br/><span style="font-size:12px;color:#92400E;">Valid for 7 days</span></p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Claim Your Gift', url: '#', buttonColor: '#F59E0B', buttonTextColor: '#ffffff', buttonBorderRadius: '50px', buttonPadding: '16px 48px' } }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">Have a wonderful birthday! 🎈</p>', { textAlign: 'center', padding: '0 24px 32px' }),
      createBlock('footer', '© 2024 Your Brand', { padding: '24px', backgroundColor: '#FFFBEB' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#FFFBEB', contentBackgroundColor: '#ffffff', linkColor: '#F59E0B' },
  },

  // 14. New Arrival / Product Launch
  {
    id: 'new-arrival',
    name: 'New Arrival',
    description: 'Product launch email',
    icon: <Sparkles className="h-5 w-5" />,
    category: 'E-commerce',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 24px', backgroundColor: '#0F172A' }, { image: { src: 'https://via.placeholder.com/140x40/ffffff/0F172A?text=BRAND', alt: 'Logo', alignment: 'center' } }),
      createBlock('text', '<p style="text-align:center;color:#38BDF8;font-weight:600;text-transform:uppercase;letter-spacing:3px;font-size:12px;">Just Dropped</p>', { textAlign: 'center', padding: '0 24px 8px', backgroundColor: '#0F172A' }),
      createBlock('heading', 'Introducing the Future', { textAlign: 'center', fontSize: '42px', padding: '8px 24px', backgroundColor: '#0F172A', textColor: '#ffffff' }),
      createBlock('text', '<p style="text-align:center;color:#94A3B8;font-size:18px;">The wait is finally over</p>', { textAlign: 'center', padding: '0 24px 32px', backgroundColor: '#0F172A' }),
      createBlock('image', '', { padding: '0', backgroundColor: '#0F172A' }, { image: { src: 'https://via.placeholder.com/600x400/1E293B/38BDF8?text=NEW+PRODUCT', alt: 'New Product', alignment: 'center', width: '100%' } }),
      createBlock('spacer', '', {}, { spacerHeight: '24px' }),
      createBlock('heading', 'Revolutionary Features', { fontSize: '24px', textAlign: 'center', padding: '24px 24px 16px' }),
      createBlock('text', '<p style="text-align:center;">✨ <strong>Premium Materials</strong> - Crafted for perfection<br/>⚡ <strong>Lightning Fast</strong> - 2x performance boost<br/>🔒 <strong>Ultra Secure</strong> - Your data, protected<br/>🌍 <strong>Eco-Friendly</strong> - Sustainable design</p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('text', '<p style="text-align:center;font-size:32px;font-weight:bold;">Starting at $299</p>', { textAlign: 'center', padding: '16px 24px' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Shop Now', url: '#', buttonColor: '#38BDF8', buttonTextColor: '#0F172A', buttonBorderRadius: '8px', buttonPadding: '16px 48px' } }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">Free shipping • 30-day returns • 2-year warranty</p>', { textAlign: 'center', padding: '0 24px 32px' }),
      createBlock('footer', '© 2024 Your Brand', { padding: '24px', backgroundColor: '#F8FAFC' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#E2E8F0', contentBackgroundColor: '#ffffff', linkColor: '#38BDF8' },
  },

  // 15. Weekly Digest
  {
    id: 'weekly-digest',
    name: 'Weekly Digest',
    description: 'Content roundup',
    icon: <TrendingUp className="h-5 w-5" />,
    category: 'Newsletter',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '24px', backgroundColor: '#065F46' }, { image: { src: 'https://via.placeholder.com/160x40/ffffff/065F46?text=DIGEST', alt: 'Digest', alignment: 'center' } }),
      createBlock('heading', 'Your Weekly Roundup', { textAlign: 'center', fontSize: '28px', padding: '16px 24px', backgroundColor: '#065F46', textColor: '#ffffff' }),
      createBlock('text', '<p style="text-align:center;color:#A7F3D0;">Week of December 1-7, 2024</p>', { textAlign: 'center', padding: '0 24px 24px', backgroundColor: '#065F46' }),
      createBlock('spacer', '', {}, { spacerHeight: '24px' }),
      createBlock('heading', '📈 Top Stories This Week', { fontSize: '20px', padding: '24px 24px 16px' }),
      createBlock('text', '<p><strong>1. Industry Report Released</strong><br/><span style="color:#6B7280;">New data shows 40% growth in Q4...</span></p><p><strong>2. Expert Interview</strong><br/><span style="color:#6B7280;">CEO shares insights on market trends...</span></p><p><strong>3. How-To Guide</strong><br/><span style="color:#6B7280;">5 steps to optimize your workflow...</span></p>', { padding: '0 24px 24px' }),
      createBlock('button', '', { textAlign: 'left', padding: '0 24px 32px' }, { button: { text: 'Read All Stories →', url: '#', buttonColor: '#065F46', buttonTextColor: '#ffffff', buttonBorderRadius: '6px', buttonPadding: '12px 24px' } }),
      createBlock('divider', '', { padding: '0 24px' }, { dividerStyle: 'solid', dividerColor: '#E5E7EB', dividerWidth: '1px' }),
      createBlock('heading', '🎯 Quick Tips', { fontSize: '18px', padding: '24px 24px 16px' }),
      createBlock('list', '', { padding: '0 24px 24px' }, { list: { items: ['Tip 1: Start your day with priorities', 'Tip 2: Use automation to save time', 'Tip 3: Review metrics weekly'], listType: 'bullet' } }),
      createBlock('text', '<p style="text-align:center;font-size:14px;background:#ECFDF5;padding:16px;border-radius:8px;">📊 <strong>Your Stats:</strong> 12 articles read • 3 hours saved</p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('footer', '© 2024 Weekly Digest', { padding: '24px', backgroundColor: '#F0FDF4' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#ECFDF5', contentBackgroundColor: '#ffffff', linkColor: '#065F46' },
  },

  // 16. Account Security Alert
  {
    id: 'security-alert',
    name: 'Security Alert',
    description: 'Account notification',
    icon: <Bell className="h-5 w-5" />,
    category: 'Transactional',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 24px' }, { image: { src: 'https://via.placeholder.com/140x40/EF4444/ffffff?text=SECURITY', alt: 'Logo', alignment: 'center' } }),
      createBlock('text', '<p style="text-align:center;font-size:48px;">🔒</p>', { textAlign: 'center', padding: '0 24px' }),
      createBlock('heading', 'Security Alert', { textAlign: 'center', fontSize: '32px', padding: '16px 24px' }),
      createBlock('text', '<p style="text-align:center;font-size:16px;color:#6B7280;">We detected a new sign-in to your account</p>', { textAlign: 'center', padding: '0 24px 32px' }),
      createBlock('text', '<p style="background:#FEF2F2;padding:20px;border-radius:8px;border-left:4px solid #EF4444;"><strong>New Sign-in Details:</strong><br/><br/>📍 Location: New York, USA<br/>🖥️ Device: Chrome on Windows<br/>🕐 Time: Dec 1, 2024 at 3:45 PM EST<br/>🌐 IP: 192.168.1.xxx</p>', { padding: '0 24px 24px' }),
      createBlock('text', '<p><strong>Was this you?</strong></p><p style="color:#6B7280;">If you recognize this activity, no action is needed. If you don\'t recognize this sign-in, please secure your account immediately.</p>', { padding: '0 24px 24px' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Secure My Account', url: '#', buttonColor: '#EF4444', buttonTextColor: '#ffffff', buttonBorderRadius: '8px', buttonPadding: '16px 40px' } }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">If you need help, contact support@company.com</p>', { textAlign: 'center', padding: '0 24px 32px' }),
      createBlock('footer', '© 2024 Your Company - Security Team', { padding: '24px', backgroundColor: '#FEF2F2' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#FEF2F2', contentBackgroundColor: '#ffffff', linkColor: '#EF4444' },
  },

  // HOME SERVICES TEMPLATES

  // 17. Painting Services
  {
    id: 'painting-services',
    name: 'Painting Services',
    description: 'Professional painting promo',
    icon: <PaintBucket className="h-5 w-5" />,
    category: 'Home Services',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 24px', backgroundColor: '#1E40AF' }, { image: { src: 'https://via.placeholder.com/160x50/ffffff/1E40AF?text=PRO+PAINTERS', alt: 'Logo', alignment: 'center' } }),
      createBlock('heading', '🎨 Transform Your Home', { textAlign: 'center', fontSize: '36px', padding: '16px 24px', backgroundColor: '#1E40AF', textColor: '#ffffff' }),
      createBlock('text', '<p style="text-align:center;color:#BFDBFE;">Professional Interior & Exterior Painting</p>', { textAlign: 'center', padding: '0 24px 32px', backgroundColor: '#1E40AF' }),
      createBlock('spacer', '', {}, { spacerHeight: '24px' }),
      createBlock('text', '<p>Hi {{firstName}},</p><p>Ready to give your home a fresh new look? Our professional painting team is here to help transform your space with quality craftsmanship and attention to detail.</p>', { padding: '24px' }),
      createBlock('heading', '🏠 Our Services Include:', { fontSize: '20px', padding: '16px 24px 8px' }),
      createBlock('list', '', { padding: '8px 24px 24px' }, { list: { items: ['Interior Wall Painting', 'Exterior House Painting', 'Cabinet Refinishing', 'Deck & Fence Staining', 'Wallpaper Removal', 'Color Consultation'], listType: 'bullet' } }),
      createBlock('text', '<p style="text-align:center;font-size:24px;font-weight:bold;color:#1E40AF;">🎁 SPECIAL OFFER</p><p style="text-align:center;font-size:32px;font-weight:bold;">15% OFF</p><p style="text-align:center;color:#6B7280;">Your First Project</p>', { textAlign: 'center', padding: '24px', backgroundColor: '#EFF6FF' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Get Free Estimate', url: '#', buttonColor: '#1E40AF', buttonTextColor: '#ffffff', buttonBorderRadius: '8px', buttonPadding: '16px 40px' } }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">📞 Call us: (555) 123-4567 | Licensed & Insured</p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('footer', '© 2024 Pro Painters. Serving your community for 15+ years.', { padding: '24px', backgroundColor: '#F8FAFC' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#EFF6FF', contentBackgroundColor: '#ffffff', linkColor: '#1E40AF' },
  },

  // 18. Cleaning Services
  {
    id: 'cleaning-services',
    name: 'Cleaning Services',
    description: 'House cleaning promo',
    icon: <Droplets className="h-5 w-5" />,
    category: 'Home Services',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 24px', backgroundColor: '#059669' }, { image: { src: 'https://via.placeholder.com/160x50/ffffff/059669?text=SPARKLE+CLEAN', alt: 'Logo', alignment: 'center' } }),
      createBlock('heading', '✨ A Cleaner Home Awaits', { textAlign: 'center', fontSize: '36px', padding: '16px 24px', backgroundColor: '#059669', textColor: '#ffffff' }),
      createBlock('text', '<p style="text-align:center;color:#A7F3D0;">Professional Cleaning Services You Can Trust</p>', { textAlign: 'center', padding: '0 24px 32px', backgroundColor: '#059669' }),
      createBlock('spacer', '', {}, { spacerHeight: '24px' }),
      createBlock('text', '<p>Hi {{firstName}},</p><p>Life is busy. Let us handle the cleaning so you can focus on what matters most. Our trained professionals use eco-friendly products and proven techniques.</p>', { padding: '24px' }),
      createBlock('heading', '🧹 Cleaning Packages:', { fontSize: '20px', padding: '16px 24px 8px' }),
      createBlock('columns', '', { padding: '0 24px 24px' }, { columns: [{ width: '50%', content: [] }, { width: '50%', content: [] }] }),
      createBlock('list', '', { padding: '8px 24px 24px' }, { list: { items: ['Standard House Cleaning', 'Deep Cleaning', 'Move-In/Move-Out Cleaning', 'Post-Construction Cleanup', 'Office Cleaning', 'Recurring Weekly/Bi-Weekly Service'], listType: 'bullet' } }),
      createBlock('text', '<p style="text-align:center;font-size:20px;font-weight:bold;color:#059669;">First-Time Customer Special</p><p style="text-align:center;font-size:36px;font-weight:bold;">$50 OFF</p><p style="text-align:center;color:#6B7280;">Your First Deep Clean</p>', { textAlign: 'center', padding: '24px', backgroundColor: '#ECFDF5' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Book Your Cleaning', url: '#', buttonColor: '#059669', buttonTextColor: '#ffffff', buttonBorderRadius: '8px', buttonPadding: '16px 40px' } }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">⭐ 4.9 Rating | 1000+ Happy Customers | 100% Satisfaction Guaranteed</p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('footer', '© 2024 Sparkle Clean Services. Bonded & Insured.', { padding: '24px', backgroundColor: '#F0FDF4' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#ECFDF5', contentBackgroundColor: '#ffffff', linkColor: '#059669' },
  },

  // 19. Roofing Services
  {
    id: 'roofing-services',
    name: 'Roofing Services',
    description: 'Roof repair & installation',
    icon: <Home className="h-5 w-5" />,
    category: 'Home Services',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 24px', backgroundColor: '#7C2D12' }, { image: { src: 'https://via.placeholder.com/160x50/ffffff/7C2D12?text=APEX+ROOFING', alt: 'Logo', alignment: 'center' } }),
      createBlock('heading', '🏠 Protect Your Home', { textAlign: 'center', fontSize: '36px', padding: '16px 24px', backgroundColor: '#7C2D12', textColor: '#ffffff' }),
      createBlock('text', '<p style="text-align:center;color:#FED7AA;">Expert Roofing Solutions Since 1995</p>', { textAlign: 'center', padding: '0 24px 32px', backgroundColor: '#7C2D12' }),
      createBlock('spacer', '', {}, { spacerHeight: '24px' }),
      createBlock('text', '<p>Hi {{firstName}},</p><p>Your roof is your home\'s first line of defense. Whether you need repairs, replacement, or a new installation, our certified team delivers quality workmanship backed by industry-leading warranties.</p>', { padding: '24px' }),
      createBlock('heading', '🔨 Our Roofing Services:', { fontSize: '20px', padding: '16px 24px 8px' }),
      createBlock('list', '', { padding: '8px 24px 24px' }, { list: { items: ['Roof Inspections & Assessments', 'Shingle & Tile Replacement', 'Complete Roof Replacement', 'Storm Damage Repair', 'Gutter Installation', 'Emergency Leak Repair'], listType: 'bullet' } }),
      createBlock('text', '<p style="text-align:center;font-size:18px;font-weight:bold;color:#7C2D12;">⚡ STORM SEASON SPECIAL</p><p style="text-align:center;font-size:16px;">FREE Roof Inspection + $500 OFF Full Replacement</p>', { textAlign: 'center', padding: '24px', backgroundColor: '#FFF7ED' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Schedule Free Inspection', url: '#', buttonColor: '#7C2D12', buttonTextColor: '#ffffff', buttonBorderRadius: '8px', buttonPadding: '16px 40px' } }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">📞 24/7 Emergency Service: (555) 987-6543<br/>Licensed • Bonded • Insured • BBB A+ Rated</p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('footer', '© 2024 Apex Roofing. Financing Available.', { padding: '24px', backgroundColor: '#FFF7ED' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#FFF7ED', contentBackgroundColor: '#ffffff', linkColor: '#7C2D12' },
  },

  // 20. HVAC Services
  {
    id: 'hvac-services',
    name: 'HVAC Services',
    description: 'Heating & cooling promo',
    icon: <Wrench className="h-5 w-5" />,
    category: 'Home Services',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 24px', backgroundColor: '#0369A1' }, { image: { src: 'https://via.placeholder.com/160x50/ffffff/0369A1?text=COMFORT+AIR', alt: 'Logo', alignment: 'center' } }),
      createBlock('heading', '❄️ Stay Comfortable Year-Round', { textAlign: 'center', fontSize: '32px', padding: '16px 24px', backgroundColor: '#0369A1', textColor: '#ffffff' }),
      createBlock('text', '<p style="text-align:center;color:#BAE6FD;">Heating • Cooling • Air Quality</p>', { textAlign: 'center', padding: '0 24px 32px', backgroundColor: '#0369A1' }),
      createBlock('spacer', '', {}, { spacerHeight: '24px' }),
      createBlock('text', '<p>Hi {{firstName}},</p><p>Don\'t let extreme temperatures catch you off guard. Our NATE-certified technicians provide fast, reliable service to keep your home comfortable in any season.</p>', { padding: '24px' }),
      createBlock('heading', '🔧 Services We Offer:', { fontSize: '20px', padding: '16px 24px 8px' }),
      createBlock('list', '', { padding: '8px 24px 24px' }, { list: { items: ['AC Installation & Repair', 'Furnace & Heating Services', 'Heat Pump Systems', 'Duct Cleaning & Sealing', 'Indoor Air Quality Solutions', 'Preventive Maintenance Plans'], listType: 'bullet' } }),
      createBlock('text', '<p style="text-align:center;font-size:18px;font-weight:bold;color:#0369A1;">🌡️ SEASONAL TUNE-UP</p><p style="text-align:center;font-size:32px;font-weight:bold;">$79</p><p style="text-align:center;color:#6B7280;">Regular $149 - Save $70!</p>', { textAlign: 'center', padding: '24px', backgroundColor: '#F0F9FF' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Book Service Now', url: '#', buttonColor: '#0369A1', buttonTextColor: '#ffffff', buttonBorderRadius: '8px', buttonPadding: '16px 40px' } }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">🚨 Same-Day Emergency Service Available<br/>Financing Options • All Major Brands</p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('footer', '© 2024 Comfort Air HVAC. EPA Certified.', { padding: '24px', backgroundColor: '#F0F9FF' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#F0F9FF', contentBackgroundColor: '#ffffff', linkColor: '#0369A1' },
  },

  // 21. Landscaping Services
  {
    id: 'landscaping-services',
    name: 'Landscaping',
    description: 'Lawn & garden services',
    icon: <Leaf className="h-5 w-5" />,
    category: 'Home Services',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 24px', backgroundColor: '#166534' }, { image: { src: 'https://via.placeholder.com/160x50/ffffff/166534?text=GREEN+THUMB', alt: 'Logo', alignment: 'center' } }),
      createBlock('heading', '🌿 Beautiful Outdoor Spaces', { textAlign: 'center', fontSize: '36px', padding: '16px 24px', backgroundColor: '#166534', textColor: '#ffffff' }),
      createBlock('text', '<p style="text-align:center;color:#BBF7D0;">Professional Landscaping & Lawn Care</p>', { textAlign: 'center', padding: '0 24px 32px', backgroundColor: '#166534' }),
      createBlock('spacer', '', {}, { spacerHeight: '24px' }),
      createBlock('text', '<p>Hi {{firstName}},</p><p>Your outdoor space should be an extension of your home. Let our expert landscapers create and maintain the yard of your dreams.</p>', { padding: '24px' }),
      createBlock('heading', '🌱 Our Services:', { fontSize: '20px', padding: '16px 24px 8px' }),
      createBlock('list', '', { padding: '8px 24px 24px' }, { list: { items: ['Weekly Lawn Maintenance', 'Landscape Design & Installation', 'Tree & Shrub Care', 'Irrigation Systems', 'Hardscaping & Patios', 'Seasonal Cleanup'], listType: 'bullet' } }),
      createBlock('text', '<p style="text-align:center;font-size:18px;font-weight:bold;color:#166534;">🌸 SPRING SPECIAL</p><p style="text-align:center;font-size:16px;">Sign up for weekly service & get your first month FREE!</p>', { textAlign: 'center', padding: '24px', backgroundColor: '#F0FDF4' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Get Free Quote', url: '#', buttonColor: '#166534', buttonTextColor: '#ffffff', buttonBorderRadius: '8px', buttonPadding: '16px 40px' } }),
      createBlock('footer', '© 2024 Green Thumb Landscaping.', { padding: '24px', backgroundColor: '#F0FDF4' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#F0FDF4', contentBackgroundColor: '#ffffff', linkColor: '#166534' },
  },

  // 22. Plumbing Services
  {
    id: 'plumbing-services',
    name: 'Plumbing Services',
    description: 'Plumbing repair & install',
    icon: <Wrench className="h-5 w-5" />,
    category: 'Home Services',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 24px', backgroundColor: '#1D4ED8' }, { image: { src: 'https://via.placeholder.com/160x50/ffffff/1D4ED8?text=FAST+PLUMBING', alt: 'Logo', alignment: 'center' } }),
      createBlock('heading', '🔧 Expert Plumbing Solutions', { textAlign: 'center', fontSize: '36px', padding: '16px 24px', backgroundColor: '#1D4ED8', textColor: '#ffffff' }),
      createBlock('text', '<p style="text-align:center;color:#BFDBFE;">Fast • Reliable • Affordable</p>', { textAlign: 'center', padding: '0 24px 32px', backgroundColor: '#1D4ED8' }),
      createBlock('spacer', '', {}, { spacerHeight: '24px' }),
      createBlock('text', '<p>Hi {{firstName}},</p><p>Plumbing problems don\'t wait, and neither do we. Our licensed plumbers are available 24/7 to handle any issue, big or small.</p>', { padding: '24px' }),
      createBlock('heading', '🚿 We Fix It All:', { fontSize: '20px', padding: '16px 24px 8px' }),
      createBlock('list', '', { padding: '8px 24px 24px' }, { list: { items: ['Leak Detection & Repair', 'Drain Cleaning', 'Water Heater Services', 'Toilet & Faucet Repair', 'Pipe Replacement', 'Sewer Line Services'], listType: 'bullet' } }),
      createBlock('text', '<p style="text-align:center;font-size:18px;font-weight:bold;color:#1D4ED8;">💧 NEW CUSTOMER OFFER</p><p style="text-align:center;font-size:32px;font-weight:bold;">$25 OFF</p><p style="text-align:center;color:#6B7280;">Any Service Over $100</p>', { textAlign: 'center', padding: '24px', backgroundColor: '#EFF6FF' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Call Now: (555) 456-7890', url: 'tel:5554567890', buttonColor: '#1D4ED8', buttonTextColor: '#ffffff', buttonBorderRadius: '8px', buttonPadding: '16px 40px' } }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">🚨 24/7 Emergency Service • No Overtime Charges</p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('footer', '© 2024 Fast Plumbing. Licensed & Insured.', { padding: '24px', backgroundColor: '#EFF6FF' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#EFF6FF', contentBackgroundColor: '#ffffff', linkColor: '#1D4ED8' },
  },

  // 23. Moving Services
  {
    id: 'moving-services',
    name: 'Moving Services',
    description: 'Professional movers',
    icon: <Truck className="h-5 w-5" />,
    category: 'Home Services',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 24px', backgroundColor: '#7C3AED' }, { image: { src: 'https://via.placeholder.com/160x50/ffffff/7C3AED?text=EASY+MOVERS', alt: 'Logo', alignment: 'center' } }),
      createBlock('heading', '📦 Stress-Free Moving', { textAlign: 'center', fontSize: '36px', padding: '16px 24px', backgroundColor: '#7C3AED', textColor: '#ffffff' }),
      createBlock('text', '<p style="text-align:center;color:#DDD6FE;">Local & Long Distance Moving Experts</p>', { textAlign: 'center', padding: '0 24px 32px', backgroundColor: '#7C3AED' }),
      createBlock('spacer', '', {}, { spacerHeight: '24px' }),
      createBlock('text', '<p>Hi {{firstName}},</p><p>Moving doesn\'t have to be stressful. Our professional team handles everything with care, so you can focus on your exciting new chapter.</p>', { padding: '24px' }),
      createBlock('heading', '🚚 Moving Services:', { fontSize: '20px', padding: '16px 24px 8px' }),
      createBlock('list', '', { padding: '8px 24px 24px' }, { list: { items: ['Local & Long Distance Moves', 'Packing & Unpacking', 'Furniture Assembly', 'Storage Solutions', 'Commercial Moving', 'Senior Moving Specialists'], listType: 'bullet' } }),
      createBlock('text', '<p style="text-align:center;font-size:18px;font-weight:bold;color:#7C3AED;">🎁 BOOK EARLY & SAVE</p><p style="text-align:center;font-size:16px;">10% OFF when you book 2+ weeks in advance</p>', { textAlign: 'center', padding: '24px', backgroundColor: '#F5F3FF' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Get Free Moving Quote', url: '#', buttonColor: '#7C3AED', buttonTextColor: '#ffffff', buttonBorderRadius: '8px', buttonPadding: '16px 40px' } }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">⭐ 5-Star Rated • Fully Insured • No Hidden Fees</p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('footer', '© 2024 Easy Movers. DOT Licensed.', { padding: '24px', backgroundColor: '#F5F3FF' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#F5F3FF', contentBackgroundColor: '#ffffff', linkColor: '#7C3AED' },
  },

  // 24. Home Security
  {
    id: 'home-security',
    name: 'Home Security',
    description: 'Security system promo',
    icon: <Shield className="h-5 w-5" />,
    category: 'Home Services',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 24px', backgroundColor: '#0F172A' }, { image: { src: 'https://via.placeholder.com/160x50/ffffff/0F172A?text=SAFE+HOME', alt: 'Logo', alignment: 'center' } }),
      createBlock('heading', '🛡️ Protect What Matters', { textAlign: 'center', fontSize: '36px', padding: '16px 24px', backgroundColor: '#0F172A', textColor: '#ffffff' }),
      createBlock('text', '<p style="text-align:center;color:#94A3B8;">Smart Home Security Solutions</p>', { textAlign: 'center', padding: '0 24px 32px', backgroundColor: '#0F172A' }),
      createBlock('spacer', '', {}, { spacerHeight: '24px' }),
      createBlock('text', '<p>Hi {{firstName}},</p><p>Your family\'s safety is priceless. Our state-of-the-art security systems provide 24/7 protection and peace of mind, all controlled from your smartphone.</p>', { padding: '24px' }),
      createBlock('heading', '🔒 Security Features:', { fontSize: '20px', padding: '16px 24px 8px' }),
      createBlock('list', '', { padding: '8px 24px 24px' }, { list: { items: ['24/7 Professional Monitoring', 'HD Video Cameras', 'Smart Door Locks', 'Motion Sensors', 'Smoke & CO Detection', 'Mobile App Control'], listType: 'bullet' } }),
      createBlock('text', '<p style="text-align:center;font-size:18px;font-weight:bold;color:#0F172A;">🏠 LIMITED TIME OFFER</p><p style="text-align:center;font-size:16px;">FREE Installation + FREE Equipment</p><p style="text-align:center;font-size:24px;font-weight:bold;color:#059669;">Starting at $29.99/mo</p>', { textAlign: 'center', padding: '24px', backgroundColor: '#F1F5F9' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Get Protected Today', url: '#', buttonColor: '#0F172A', buttonTextColor: '#ffffff', buttonBorderRadius: '8px', buttonPadding: '16px 40px' } }),
      createBlock('footer', '© 2024 Safe Home Security.', { padding: '24px', backgroundColor: '#F1F5F9' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#F1F5F9', contentBackgroundColor: '#ffffff', linkColor: '#0F172A' },
  },

  // 25. Carpet Cleaning
  {
    id: 'carpet-cleaning',
    name: 'Carpet Cleaning',
    description: 'Professional carpet care',
    icon: <Brush className="h-5 w-5" />,
    category: 'Home Services',
    blocks: [
      createBlock('image', '', { textAlign: 'center', padding: '32px 24px 24px', backgroundColor: '#0891B2' }, { image: { src: 'https://via.placeholder.com/160x50/ffffff/0891B2?text=FRESH+CARPETS', alt: 'Logo', alignment: 'center' } }),
      createBlock('heading', '✨ Revive Your Carpets', { textAlign: 'center', fontSize: '36px', padding: '16px 24px', backgroundColor: '#0891B2', textColor: '#ffffff' }),
      createBlock('text', '<p style="text-align:center;color:#A5F3FC;">Deep Clean • Stain Removal • Fresh Scent</p>', { textAlign: 'center', padding: '0 24px 32px', backgroundColor: '#0891B2' }),
      createBlock('spacer', '', {}, { spacerHeight: '24px' }),
      createBlock('text', '<p>Hi {{firstName}},</p><p>Dirty carpets harbor allergens and bacteria. Our truck-mounted steam cleaning system removes 98% of allergens and leaves your carpets looking and smelling like new.</p>', { padding: '24px' }),
      createBlock('heading', '🧼 Our Services:', { fontSize: '20px', padding: '16px 24px 8px' }),
      createBlock('list', '', { padding: '8px 24px 24px' }, { list: { items: ['Deep Steam Cleaning', 'Pet Stain & Odor Removal', 'Upholstery Cleaning', 'Area Rug Cleaning', 'Tile & Grout Cleaning', 'Scotchgard Protection'], listType: 'bullet' } }),
      createBlock('text', '<p style="text-align:center;font-size:18px;font-weight:bold;color:#0891B2;">🏠 WHOLE HOUSE SPECIAL</p><p style="text-align:center;font-size:32px;font-weight:bold;">3 Rooms for $99</p><p style="text-align:center;color:#6B7280;">Up to 600 sq ft total</p>', { textAlign: 'center', padding: '24px', backgroundColor: '#ECFEFF' }),
      createBlock('button', '', { textAlign: 'center', padding: '24px' }, { button: { text: 'Book Cleaning Now', url: '#', buttonColor: '#0891B2', buttonTextColor: '#ffffff', buttonBorderRadius: '8px', buttonPadding: '16px 40px' } }),
      createBlock('text', '<p style="text-align:center;font-size:14px;color:#6B7280;">✓ Eco-Friendly Products ✓ Fast Drying ✓ Satisfaction Guaranteed</p>', { textAlign: 'center', padding: '0 24px 24px' }),
      createBlock('footer', '© 2024 Fresh Carpets. IICRC Certified.', { padding: '24px', backgroundColor: '#ECFEFF' }),
    ],
    styles: { ...DEFAULT_GLOBAL_STYLES, backgroundColor: '#ECFEFF', contentBackgroundColor: '#ffffff', linkColor: '#0891B2' },
  },
];


const CATEGORIES = ['Basic', 'Onboarding', 'Newsletter', 'E-commerce', 'Product', 'Events', 'Engagement', 'Transactional', 'Home Services'];

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onSelectTemplate }) => {
  return (
    <Card className="h-full border-0 rounded-none">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium">Template Library</CardTitle>
        <p className="text-xs text-muted-foreground">{TEMPLATE_PRESETS.length} templates available</p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="px-4 pb-4 space-y-5">
            {CATEGORIES.map((category) => {
              const templates = TEMPLATE_PRESETS.filter(t => t.category === category);
              if (templates.length === 0) return null;
              
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {category}
                    </h4>
                    <Badge variant="secondary" className="text-[12px] px-1.5 py-0">
                      {templates.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => onSelectTemplate(template.blocks, template.styles)}
                        className="w-full flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all text-left group"
                      >
                        <div 
                          className="flex items-center justify-center w-10 h-10 rounded-md shrink-0 transition-colors"
                          style={{ backgroundColor: template.styles.linkColor + '20', color: template.styles.linkColor }}
                        >
                          {template.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm group-hover:text-primary transition-colors">{template.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {template.description}
                          </div>
                          <div className="text-[12px] text-muted-foreground mt-1">
                            {template.blocks.length} blocks
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TemplateLibrary;

