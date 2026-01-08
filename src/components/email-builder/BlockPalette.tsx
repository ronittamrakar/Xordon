import React from 'react';
import { 
  Type, 
  Heading1, 
  Image, 
  MousePointer2, 
  Minus, 
  Space, 
  Columns, 
  Share2, 
  Video, 
  Code, 
  Quote, 
  List, 
  Table, 
  Timer, 
  Menu, 
  FileTextIcon,
  GripVertical,
  Link,
  Calendar,
  MapPin,
  Ticket,
  Star,
  BarChart3,
  ChevronDown,
  ListChecks,
  SplitSquareHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlockType } from './types';

interface BlockPaletteProps {
  onAddBlock: (type: BlockType) => void;
}

interface BlockItem {
  type: BlockType;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: 'content' | 'layout' | 'media' | 'interactive';
}

const BLOCK_ITEMS: BlockItem[] = [
  // Content blocks
  { type: 'text', label: 'Text', icon: <Type className="h-5 w-5" />, description: 'Rich text paragraph', category: 'content' },
  { type: 'heading', label: 'Heading', icon: <Heading1 className="h-5 w-5" />, description: 'Section heading', category: 'content' },
  { type: 'quote', label: 'Quote', icon: <Quote className="h-5 w-5" />, description: 'Blockquote', category: 'content' },
  { type: 'list', label: 'List', icon: <List className="h-5 w-5" />, description: 'Bullet or numbered list', category: 'content' },
  { type: 'table', label: 'Table', icon: <Table className="h-5 w-5" />, description: 'Data table', category: 'content' },
  { type: 'faq', label: 'FAQ', icon: <FileTextIcon className="h-5 w-5" />, description: 'Q&A section', category: 'content' },
  
  // Layout blocks
  { type: 'columns', label: 'Columns', icon: <Columns className="h-5 w-5" />, description: '2-4 column layout', category: 'layout' },
  { type: 'divider', label: 'Divider', icon: <Minus className="h-5 w-5" />, description: 'Horizontal line', category: 'layout' },
  { type: 'spacer', label: 'Spacer', icon: <Space className="h-5 w-5" />, description: 'Vertical spacing', category: 'layout' },
  { type: 'hero', label: 'Hero', icon: <Image className="h-5 w-5" />, description: 'Hero banner section', category: 'layout' },
  
  // Media blocks
  { type: 'image', label: 'Image', icon: <Image className="h-5 w-5" />, description: 'Image with link', category: 'media' },
  { type: 'video', label: 'Video', icon: <Video className="h-5 w-5" />, description: 'Video thumbnail', category: 'media' },
  { type: 'gallery', label: 'Gallery', icon: <Image className="h-5 w-5" />, description: 'Image gallery grid', category: 'media' },
  { type: 'html', label: 'HTML', icon: <Code className="h-5 w-5" />, description: 'Custom HTML code', category: 'media' },
  
  // Interactive blocks
  { type: 'button', label: 'Button', icon: <MousePointer2 className="h-5 w-5" />, description: 'Call-to-action button', category: 'interactive' },
  { type: 'cta', label: 'CTA Box', icon: <MousePointer2 className="h-5 w-5" />, description: 'Call-to-action section', category: 'interactive' },
  { type: 'social', label: 'Social', icon: <Share2 className="h-5 w-5" />, description: 'Social media links', category: 'interactive' },
  { type: 'countdown', label: 'Countdown', icon: <Timer className="h-5 w-5" />, description: 'Countdown timer', category: 'interactive' },
  { type: 'menu', label: 'Menu', icon: <Menu className="h-5 w-5" />, description: 'Navigation menu', category: 'interactive' },
  
  // Marketing blocks
  { type: 'testimonial', label: 'Testimonial', icon: <Quote className="h-5 w-5" />, description: 'Customer review', category: 'marketing' },
  { type: 'pricing', label: 'Pricing', icon: <FileTextIcon className="h-5 w-5" />, description: 'Pricing card', category: 'marketing' },
  { type: 'feature', label: 'Feature', icon: <FileTextIcon className="h-5 w-5" />, description: 'Feature highlight', category: 'marketing' },
  { type: 'imageText', label: 'Image+Text', icon: <Columns className="h-5 w-5" />, description: 'Side-by-side layout', category: 'marketing' },
  { type: 'stats', label: 'Stats', icon: <FileTextIcon className="h-5 w-5" />, description: 'Statistics display', category: 'marketing' },
  
  // Footer blocks
  { type: 'footer', label: 'Footer', icon: <FileTextIcon className="h-5 w-5" />, description: 'Email footer', category: 'footer' },
  { type: 'signature', label: 'Signature', icon: <FileTextIcon className="h-5 w-5" />, description: 'Email signature', category: 'footer' },
  
  // Advanced blocks
  { type: 'url', label: 'URL/Link', icon: <Link className="h-5 w-5" />, description: 'Styled link or URL card', category: 'advanced' },
  { type: 'calendar', label: 'Calendar', icon: <Calendar className="h-5 w-5" />, description: 'Event with add to calendar', category: 'advanced' },
  { type: 'map', label: 'Map/Location', icon: <MapPin className="h-5 w-5" />, description: 'Location with directions', category: 'advanced' },
  { type: 'coupon', label: 'Coupon', icon: <Ticket className="h-5 w-5" />, description: 'Discount coupon code', category: 'advanced' },
  { type: 'rating', label: 'Rating', icon: <Star className="h-5 w-5" />, description: 'Star rating display', category: 'advanced' },
  { type: 'progress', label: 'Progress', icon: <BarChart3 className="h-5 w-5" />, description: 'Progress bar', category: 'advanced' },
  { type: 'accordion', label: 'Accordion', icon: <ChevronDown className="h-5 w-5" />, description: 'Expandable sections', category: 'advanced' },
  { type: 'iconList', label: 'Icon List', icon: <ListChecks className="h-5 w-5" />, description: 'List with icons', category: 'advanced' },
  { type: 'beforeAfter', label: 'Before/After', icon: <SplitSquareHorizontal className="h-5 w-5" />, description: 'Comparison images', category: 'advanced' },
];

const CATEGORIES = [
  { id: 'content', label: 'Content' },
  { id: 'layout', label: 'Layout' },
  { id: 'media', label: 'Media' },
  { id: 'interactive', label: 'Interactive' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'footer', label: 'Footer' },
];

export const BlockPalette: React.FC<BlockPaletteProps> = ({ onAddBlock }) => {
  return (
    <Card className="h-full border-0 rounded-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Add Blocks</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="px-4 pb-4 space-y-4">
            {CATEGORIES.map((category) => (
              <div key={category.id}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {category.label}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {BLOCK_ITEMS.filter(item => item.category === category.id).map((item) => (
                    <button
                      key={item.type}
                      onClick={() => onAddBlock(item.type)}
                      className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing group"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('blockType', item.type);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted group-hover:bg-primary/10 mb-1">
                        {item.icon}
                      </div>
                      <span className="text-xs font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default BlockPalette;

