import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Trash2, Copy, Settings, Clock, FileTextIcon, Code,
  Repeat, Users2, Flag, Sparkles, Calculator, Bot, Webhook,
  Locate, Shield, UserCircle, Key, Star
} from 'lucide-react';
import { FormField } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

interface FormFieldComponentProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  onDuplicate?: () => void;
  designSettings?: any;
}

export default function FormFieldComponent({
  field,
  isSelected,
  onSelect,
  onDelete,
  onUpdate,
  onDuplicate,
  designSettings = {},
}: FormFieldComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderFieldPreview = () => {
    switch (field.field_type) {
      case 'timer':
        return (
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
            <Clock className="h-5 w-5 text-primary" />
            <div className="flex-1 space-y-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-1/3" />
              </div>
              <div className="flex justify-between text-[12px] text-muted-foreground uppercase font-bold">
                <span>00:00</span>
                <span>{field.slider_max || 60}:00</span>
              </div>
            </div>
          </div>
        );

      case 'masked_text':
      case 'password':
        return (
          <Input type="password" placeholder="••••••••" disabled className="bg-muted/30" />
        );

      case 'embed_pdf':
        return (
          <div className="border rounded-lg p-4 bg-muted/20 text-center space-y-2">
            <FileTextIcon className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-xs font-medium">PDF Document Preview</p>
            <p className="text-[12px] text-muted-foreground truncate">{field.media_url || 'No PDF URL provided'}</p>
          </div>
        );

      case 'custom_embed':
        return (
          <div className="border rounded-lg p-4 bg-muted/30 text-center">
            <Code className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-xs font-medium">Custom Embed Block</p>
            <div className="mt-2 p-2 bg-black/5 rounded text-[12px] font-mono truncate">
              {field.html_content || '<!-- Embed code goes here -->'}
            </div>
          </div>
        );

      case 'social_share':
        return (
          <div className="flex gap-2">
            {['fb', 'tw', 'ln', 'wa'].map(s => (
              <div key={s} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[12px] font-bold uppercase">
                {s}
              </div>
            ))}
          </div>
        );

      case 'product_basket':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 border rounded bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-muted rounded" />
                <span className="text-sm">Example Product</span>
              </div>
              <span className="text-sm font-bold">$10.00</span>
            </div>
            <div className="flex justify-between p-2 font-bold border-t pt-2 mt-2">
              <span>Total</span>
              <span>$10.00</span>
            </div>
          </div>
        );

      case 'field_group':
      case 'repeater_group':
        return (
          <div className="border-2 border-dashed border-muted rounded-lg p-4 bg-muted/5">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              {field.field_type === 'repeater_group' ? <Repeat className="h-4 w-4" /> : <Users2 className="h-4 w-4" />}
              <span className="text-xs font-bold uppercase">{field.field_type.replace('_', ' ')}</span>
            </div>
            <div className="h-10 flex items-center justify-center text-xs text-muted-foreground bg-white/50 rounded">
              Drag fields here to group them
            </div>
          </div>
        );

      case 'layout_2col':
      case 'layout_3col':
      case 'layout_4col':
        const gridCols = field.field_type === 'layout_2col' ? 'grid-cols-2' : field.field_type === 'layout_3col' ? 'grid-cols-3' : 'grid-cols-4';
        const cols = field.field_type === 'layout_2col' ? 2 : field.field_type === 'layout_3col' ? 3 : 4;
        return (
          <div className={`grid ${gridCols} gap-4`}>
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="border border-dashed rounded-md p-4 bg-muted/5 min-h-[60px] flex items-center justify-center">
                <span className="text-[12px] text-muted-foreground">Col {i + 1}</span>
              </div>
            ))}
          </div>
        );

      case 'cover':
      case 'welcome_page':
      case 'ending':
        return (
          <div className="border border-primary/20 rounded-lg p-8 bg-primary/5 text-center space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              {field.field_type === 'ending' ? <Flag className="h-6 w-6 text-primary" /> : <Sparkles className="h-6 w-6 text-primary" />}
            </div>
            <div className="space-y-1">
              <h4 className="font-bold">{field.heading_text || (field.field_type === 'ending' ? 'Thank You!' : 'Welcome')}</h4>
              <p className="text-xs text-muted-foreground">{field.paragraph_text || 'Enter your custom message here...'}</p>
            </div>
            <Button size="sm" className="pointer-events-none">{field.button_text || 'Next'}</Button>
          </div>
        );

      case 'budget':
      case 'timeline':
      case 'teamsize':
      case 'industry':
      case 'referral':
      case 'priority':
      case 'service':
      case 'product':
      case 'contactmethod':
      case 'location_selector':
      case 'franchise_location':
      case 'appointment_location':
      case 'service_category':
      case 'territory':
        return (
          <select className="w-full border rounded-md p-2 bg-muted/30" disabled>
            <option>{field.placeholder || `Select ${field.label.toLowerCase()}...`}</option>
            {(field.options as string[])?.map((opt, i) => (
              <option key={i}>{opt}</option>
            ))}
          </select>
        );

      case 'satisfaction':
        return (
          <div className="flex gap-1 justify-between">
            {['😞', '🙁', '😐', '🙂', '😊'].map((emoji, i) => (
              <div key={i} className="text-2xl opacity-50">{emoji}</div>
            ))}
          </div>
        );

      case 'leadscore':
        return (
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 w-3/4" />
            </div>
            <span className="text-sm font-bold">75</span>
          </div>
        );

      case 'rating':
      case 'star_rating':
        return (
          <div className="flex gap-1 text-2xl text-yellow-400 opacity-50">
            {Array.from({ length: field.max_stars || 5 }).map((_, i) => (
              <Star key={i} className="h-6 w-6" fill="currentColor" />
            ))}
          </div>
        );

      case 'likert':
        return (
          <div className="space-y-3 opacity-60">
            {[1, 2].map(i => (
              <div key={i} className="space-y-1">
                <div className="text-[12px] font-medium">Statement {i}</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(j => (
                    <div key={j} className="flex-1 h-6 border rounded bg-muted/20" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'matrix':
        return (
          <div className="border rounded-md overflow-hidden opacity-60">
            <table className="w-full text-[12px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-1 border-b"></th>
                  <th className="p-1 border-b border-l">Col 1</th>
                  <th className="p-1 border-b border-l">Col 2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-1 border-b">Row 1</td>
                  <td className="p-1 border-b border-l text-center">○</td>
                  <td className="p-1 border-b border-l text-center">○</td>
                </tr>
                <tr>
                  <td className="p-1">Row 2</td>
                  <td className="p-1 border-l text-center">○</td>
                  <td className="p-1 border-l text-center">○</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'yes_no':
      case 'true_false':
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 pointer-events-none">Yes</Button>
            <Button size="sm" variant="outline" className="h-8 pointer-events-none">No</Button>
          </div>
        );

      case 'formula':
      case 'calculated':
        return (
          <div className="p-3 border rounded-lg bg-blue-50/50 flex items-center gap-3">
            <Calculator className="h-4 w-4 text-blue-600" />
            <div className="flex-1">
              <div className="text-[12px] text-blue-600 font-bold uppercase">Calculated Value</div>
              <div className="text-sm font-mono">{field.formula || 'No formula defined'}</div>
            </div>
          </div>
        );

      case 'auto_unique_id':
        return (
          <div className="p-3 border rounded-lg bg-gray-50 flex items-center gap-3">
            <Key className="h-4 w-4 text-gray-500" />
            <div className="flex-1">
              <div className="text-[12px] text-gray-500 font-bold uppercase">Unique ID</div>
              <div className="text-sm font-mono">#FORM-{randomItem(['A1', 'B2', 'C3'])}-0001</div>
            </div>
          </div>
        );

      case 'openai':
        return (
          <div className="p-3 border border-purple-200 rounded-lg bg-purple-50/30 flex items-center gap-3">
            <Bot className="h-4 w-4 text-purple-600" />
            <div className="flex-1">
              <div className="text-[12px] text-purple-600 font-bold uppercase">AI Generated Field</div>
              <div className="text-xs italic text-muted-foreground line-clamp-2">"Prompt: {field.formula || 'Write a welcome message...'}"</div>
            </div>
          </div>
        );

      case 'api_action':
        return (
          <div className="p-3 border border-orange-200 rounded-lg bg-orange-50/30 flex items-center gap-3">
            <Webhook className="h-4 w-4 text-orange-600" />
            <div className="flex-1">
              <div className="text-[12px] text-orange-600 font-bold uppercase">External API Data</div>
              <div className="text-xs text-muted-foreground truncate">{field.media_url || 'https://api.example.com'}</div>
            </div>
          </div>
        );

      case 'operating_hours':
        return (
          <div className="p-3 border rounded-lg space-y-2 text-xs">
            {['Mon - Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="flex justify-between">
                <span className="font-medium">{day}:</span>
                <span className="text-muted-foreground">{day.includes('Sun') ? 'Closed' : '9:00 AM - 6:00 PM'}</span>
              </div>
            ))}
          </div>
        );

      case 'regional_contact':
        return (
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/5">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <UserCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold">Regional Manager</p>
              <p className="text-xs text-muted-foreground">contact@region.com</p>
            </div>
          </div>
        );

      case 'service_area':
        return (
          <div className="space-y-2">
            <Input placeholder="Enter ZIP code..." disabled className="bg-muted/30" />
            <div className="text-[12px] text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Verified service area lookup enabled
            </div>
          </div>
        );

      case 'store_finder':
        return (
          <div className="space-y-2">
            <div className="relative">
              <Locate className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 bg-muted/30" placeholder="Find nearest location..." disabled />
            </div>
          </div>
        );

      default:
        return (
          <Input
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            disabled
            className="bg-muted/30"
          />
        );
    }
  };

  // Don't show label for certain field types
  const hideLabel = ['heading', 'paragraph', 'explanation', 'divider', 'spacer', 'page_break', 'section'].includes(field.field_type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative p-4 border rounded-lg bg-background transition-all',
        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground/50',
        isDragging && 'opacity-50 shadow-lg'
      )}
      onClick={onSelect}
    >
      {/* Drag Handle & Actions */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div
          {...attributes}
          {...listeners}
          className="p-1.5 bg-background border rounded-md shadow-sm cursor-grab active:cursor-grabbing hover:bg-muted"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        {onDuplicate && (
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 bg-background shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 bg-background shadow-sm text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Field Content */}
      <div className="space-y-2">
        {!hideLabel && (
          <label className="text-sm font-medium">
            {field.label}
            {field.required ? <span className="text-destructive ml-1">*</span> : null}
          </label>
        )}
        {field.description && !hideLabel && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
        {renderFieldPreview()}
      </div>

      {/* Field Type Badge */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[12px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {field.field_type}
        </span>
      </div>
    </div>
  );
}

