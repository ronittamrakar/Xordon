import React, { useState, useEffect } from 'react';
import { Copy, Check, Search, Tag, User, Building, Calendar, Link2, Settings2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { api, CustomVariable } from '@/lib/api';

interface MergeTag {
  key: string;
  label: string;
  description: string;
  category: 'recipient' | 'sender' | 'campaign' | 'date' | 'tracking' | 'custom';
  example?: string;
}

const BASE_MERGE_TAGS: MergeTag[] = [
  // Recipient tags
  { key: '{{recipient_name}}', label: 'Full Name', description: 'Recipient\'s full name', category: 'recipient', example: 'John Doe' },
  { key: '{{recipient_email}}', label: 'Email', description: 'Recipient\'s email', category: 'recipient', example: 'john@example.com' },
  { key: '{{recipient_company}}', label: 'Company', description: 'Recipient\'s company', category: 'recipient', example: 'Acme Corp' },
  { key: '{{firstName}}', label: 'First Name', description: 'First name', category: 'recipient', example: 'John' },
  { key: '{{lastName}}', label: 'Last Name', description: 'Last name', category: 'recipient', example: 'Doe' },
  { key: '{{phone}}', label: 'Phone', description: 'Phone number', category: 'recipient', example: '+1234567890' },
  { key: '{{address}}', label: 'Address', description: 'Street address', category: 'recipient', example: '123 Main St' },
  { key: '{{city}}', label: 'City', description: 'City', category: 'recipient', example: 'New York' },
  { key: '{{state}}', label: 'State', description: 'State/Province', category: 'recipient', example: 'NY' },
  { key: '{{country}}', label: 'Country', description: 'Country', category: 'recipient', example: 'USA' },
  { key: '{{zip}}', label: 'ZIP Code', description: 'Postal code', category: 'recipient', example: '10001' },

  // Sender tags
  { key: '{{company_name}}', label: 'Company Name', description: 'Your company', category: 'sender', example: 'Your Company' },
  { key: '{{company_email}}', label: 'Company Email', description: 'Company email', category: 'sender', example: 'contact@company.com' },
  { key: '{{sender_name}}', label: 'Sender Name', description: 'Sender name', category: 'sender', example: 'Sales Team' },
  { key: '{{sender_email}}', label: 'Sender Email', description: 'Sender email', category: 'sender', example: 'sales@company.com' },
  { key: '{{company_phone}}', label: 'Company Phone', description: 'Company phone', category: 'sender', example: '+1234567890' },
  { key: '{{company_address}}', label: 'Company Address', description: 'Company address', category: 'sender', example: '456 Business Ave' },
  { key: '{{company_website}}', label: 'Website', description: 'Company website', category: 'sender', example: 'www.company.com' },

  // Campaign tags
  { key: '{{campaign_name}}', label: 'Campaign Name', description: 'Campaign name', category: 'campaign', example: 'Summer Sale' },
  { key: '{{campaign_subject}}', label: 'Subject Line', description: 'Subject line', category: 'campaign', example: 'Don\'t miss out!' },
  { key: '{{campaign_id}}', label: 'Campaign ID', description: 'Campaign ID', category: 'campaign', example: '12345' },

  // Date tags
  { key: '{{current_date}}', label: 'Current Date', description: 'Today\'s date', category: 'date', example: 'December 1, 2024' },
  { key: '{{current_year}}', label: 'Current Year', description: 'Current year', category: 'date', example: '2024' },
  { key: '{{current_month}}', label: 'Current Month', description: 'Current month', category: 'date', example: 'December' },
  { key: '{{current_day}}', label: 'Current Day', description: 'Day of month', category: 'date', example: '1' },
  { key: '{{current_time}}', label: 'Current Time', description: 'Current time', category: 'date', example: '10:30 AM' },

  // Tracking tags
  { key: '{{unsubscribe_url}}', label: 'Unsubscribe', description: 'Unsubscribe link (required)', category: 'tracking' },
  { key: '{{view_in_browser}}', label: 'View in Browser', description: 'Browser view link', category: 'tracking' },
  { key: '{{recipient_id}}', label: 'Recipient ID', description: 'Recipient ID', category: 'tracking', example: '67890' },
];

const CATEGORY_COLORS: Record<string, string> = {
  recipient: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sender: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  campaign: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  date: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  tracking: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  custom: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

interface MergeTagsPanelProps {
  onInsert: (tag: string) => void;
}

export const MergeTagsPanel: React.FC<MergeTagsPanelProps> = ({ onInsert }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [customVariables, setCustomVariables] = useState<MergeTag[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadCustomVariables();
  }, []);

  const loadCustomVariables = async () => {
    try {
      const vars = await api.getCustomVariables();
      if (Array.isArray(vars)) {
        setCustomVariables(vars.map((v: CustomVariable) => ({
          key: `{{custom_${v.name}}}`,
          label: v.name,
          description: v.description || `Custom: ${v.name}`,
          category: 'custom' as const,
          example: (v as { default_value?: string }).default_value || '',
        })));
      }
    } catch (error) {
      // Silently handle error
    }
  };

  const allTags = [...BASE_MERGE_TAGS, ...customVariables];

  const filteredTags = allTags.filter(tag =>
    tag.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag);
      setCopiedTag(tag);
      toast({ title: 'Copied!', description: 'Tag copied to clipboard' });
      setTimeout(() => setCopiedTag(null), 2000);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleInsert = (tag: string) => {
    onInsert(tag);
    toast({ title: 'Inserted', description: 'Tag added to content' });
  };

  const handleDragStart = (e: React.DragEvent, tag: string) => {
    e.dataTransfer.setData('text/plain', tag);
    e.dataTransfer.setData('mergeTag', tag);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderTagItem = (tag: MergeTag) => (
    <div
      key={tag.key}
      draggable
      onDragStart={(e) => handleDragStart(e, tag.key)}
      className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors cursor-grab active:cursor-grabbing group"
    >
      <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <code className="text-[12px] font-mono bg-muted px-1 py-0.5 rounded truncate max-w-[120px]">
            {tag.key}
          </code>
          <Badge variant="secondary" className={`text-[12px] px-1 py-0 ${CATEGORY_COLORS[tag.category]}`}>
            {tag.category.charAt(0).toUpperCase() + tag.category.slice(1)}
          </Badge>
        </div>
        <p className="text-xs font-medium truncate">{tag.label}</p>
        {tag.example && (
          <p className="text-[12px] text-muted-foreground truncate">e.g. {tag.example}</p>
        )}
      </div>
      <div className="flex gap-0.5 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => { e.stopPropagation(); handleCopy(tag.key); }}
            >
              {copiedTag === tag.key ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Copy</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[12px]"
              onClick={(e) => { e.stopPropagation(); handleInsert(tag.key); }}
            >
              Insert
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Insert into content</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );

  const renderTagList = (tags: MergeTag[]) => (
    <div className="space-y-1.5">
      {tags.map(renderTagItem)}
      {tags.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Tag className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No tags found</p>
        </div>
      )}
    </div>
  );

  return (
    <Card className="h-full border-0 rounded-none">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Merge Tags
        </CardTitle>
        <p className="text-[12px] text-muted-foreground">Drag or click Insert to add</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tags..."
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="px-4 pb-4">
            {searchQuery ? (
              renderTagList(filteredTags)
            ) : (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-8">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="common" className="text-xs">Common</TabsTrigger>
                  <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-3">
                  {renderTagList(allTags)}
                </TabsContent>
                <TabsContent value="common" className="mt-3">
                  {renderTagList(BASE_MERGE_TAGS.filter(t =>
                    ['recipient', 'sender', 'date'].includes(t.category)
                  ))}
                </TabsContent>
                <TabsContent value="custom" className="mt-3">
                  {customVariables.length > 0 ? (
                    renderTagList(customVariables)
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Settings2 className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No custom variables</p>
                      <p className="text-[12px]">Create them in Settings</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MergeTagsPanel;
