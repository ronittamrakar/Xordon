import React, { useState } from 'react';
import { X, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailBlock, FONT_FAMILIES, FONT_SIZES, SOCIAL_PLATFORMS, SocialLink } from './types';
import { ImageUploader } from './ImageUploader';

interface BlockSettingsProps {
  block: EmailBlock;
  onUpdate: (block: EmailBlock) => void;
  onClose: () => void;
}

export const BlockSettings: React.FC<BlockSettingsProps> = ({ block, onUpdate, onClose }) => {
  const [localBlock, setLocalBlock] = useState<EmailBlock>(block);

  const updateBlock = (updates: Partial<EmailBlock>) => {
    const updated = { ...localBlock, ...updates };
    setLocalBlock(updated);
    onUpdate(updated);
  };

  const updateStyle = (key: string, value: string) => {
    updateBlock({
      style: { ...localBlock.style, [key]: value }
    });
  };

  const updateSettings = (key: string, value: unknown) => {
    updateBlock({
      settings: { ...localBlock.settings, [key]: value }
    });
  };

  const renderContentSettings = () => {
    switch (block.type) {
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label>Content</Label>
              <Textarea
                value={localBlock.content}
                onChange={(e) => updateBlock({ content: e.target.value })}
                rows={6}
                placeholder="Enter your text content..."
              />
            </div>
          </div>
        );

      case 'heading':
        return (
          <div className="space-y-4">
            <div>
              <Label>Heading Text</Label>
              <Input
                value={localBlock.content}
                onChange={(e) => updateBlock({ content: e.target.value })}
                placeholder="Enter heading..."
              />
            </div>
            <div>
              <Label>Heading Level</Label>
              <Select
                value={localBlock.style.fontSize || '24px'}
                onValueChange={(value) => updateStyle('fontSize', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="36px">H1 - Large</SelectItem>
                  <SelectItem value="28px">H2 - Medium</SelectItem>
                  <SelectItem value="24px">H3 - Small</SelectItem>
                  <SelectItem value="20px">H4 - Extra Small</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <Label>Image</Label>
              {localBlock.settings?.image?.src && (
                <div className="mt-2 mb-3 border rounded-lg p-2 bg-muted/50">
                  <img 
                    src={localBlock.settings.image.src} 
                    alt={localBlock.settings.image.alt || 'Preview'} 
                    className="max-h-32 max-w-full mx-auto rounded"
                  />
                </div>
              )}
              <ImageUploader
                value={localBlock.settings?.image?.src || ''}
                onChange={(url) => updateSettings('image', { ...localBlock.settings?.image, src: url })}
                trigger={
                  <Button variant="outline" className="w-full gap-2">
                    <ImageIcon className="h-4 w-4" />
                    {localBlock.settings?.image?.src ? 'Change Image' : 'Upload or Select Image'}
                  </Button>
                }
              />
            </div>
            <div>
              <Label>Alt Text</Label>
              <Input
                value={localBlock.settings?.image?.alt || ''}
                onChange={(e) => updateSettings('image', { ...localBlock.settings?.image, alt: e.target.value })}
                placeholder="Image description..."
              />
            </div>
            <div>
              <Label>Link URL (optional)</Label>
              <Input
                value={localBlock.settings?.image?.link || ''}
                onChange={(e) => updateSettings('image', { ...localBlock.settings?.image, link: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Width</Label>
                <Input
                  value={localBlock.settings?.image?.width || '100%'}
                  onChange={(e) => updateSettings('image', { ...localBlock.settings?.image, width: e.target.value })}
                  placeholder="100% or 300px"
                />
              </div>
              <div>
                <Label>Alignment</Label>
                <Select
                  value={localBlock.settings?.image?.alignment || 'center'}
                  onValueChange={(value) => updateSettings('image', { ...localBlock.settings?.image, alignment: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'button':
        return (
          <div className="space-y-4">
            <div>
              <Label>Button Text</Label>
              <Input
                value={localBlock.settings?.button?.text || ''}
                onChange={(e) => updateSettings('button', { ...localBlock.settings?.button, text: e.target.value })}
                placeholder="Click Here"
              />
            </div>
            <div>
              <Label>Button URL</Label>
              <Input
                value={localBlock.settings?.button?.url || ''}
                onChange={(e) => updateSettings('button', { ...localBlock.settings?.button, url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Button Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={localBlock.settings?.button?.buttonColor || '#0066cc'}
                    onChange={(e) => updateSettings('button', { ...localBlock.settings?.button, buttonColor: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={localBlock.settings?.button?.buttonColor || '#0066cc'}
                    onChange={(e) => updateSettings('button', { ...localBlock.settings?.button, buttonColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={localBlock.settings?.button?.buttonTextColor || '#ffffff'}
                    onChange={(e) => updateSettings('button', { ...localBlock.settings?.button, buttonTextColor: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={localBlock.settings?.button?.buttonTextColor || '#ffffff'}
                    onChange={(e) => updateSettings('button', { ...localBlock.settings?.button, buttonTextColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Border Radius</Label>
                <Input
                  value={localBlock.settings?.button?.buttonBorderRadius || '4px'}
                  onChange={(e) => updateSettings('button', { ...localBlock.settings?.button, buttonBorderRadius: e.target.value })}
                  placeholder="4px"
                />
              </div>
              <div>
                <Label>Padding</Label>
                <Input
                  value={localBlock.settings?.button?.buttonPadding || '12px 24px'}
                  onChange={(e) => updateSettings('button', { ...localBlock.settings?.button, buttonPadding: e.target.value })}
                  placeholder="12px 24px"
                />
              </div>
            </div>
          </div>
        );

      case 'divider':
        return (
          <div className="space-y-4">
            <div>
              <Label>Style</Label>
              <Select
                value={localBlock.settings?.dividerStyle || 'solid'}
                onValueChange={(value) => updateSettings('dividerStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={localBlock.settings?.dividerColor || '#e0e0e0'}
                    onChange={(e) => updateSettings('dividerColor', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={localBlock.settings?.dividerColor || '#e0e0e0'}
                    onChange={(e) => updateSettings('dividerColor', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Width</Label>
                <Input
                  value={localBlock.settings?.dividerWidth || '1px'}
                  onChange={(e) => updateSettings('dividerWidth', e.target.value)}
                  placeholder="1px"
                />
              </div>
            </div>
          </div>
        );

      case 'spacer':
        return (
          <div className="space-y-4">
            <div>
              <Label>Height: {localBlock.settings?.spacerHeight || '32px'}</Label>
              <Slider
                value={[parseInt(localBlock.settings?.spacerHeight || '32')]}
                onValueChange={([value]) => updateSettings('spacerHeight', `${value}px`)}
                min={8}
                max={120}
                step={4}
                className="mt-2"
              />
            </div>
          </div>
        );

      case 'social':
        const socialLinks = localBlock.settings?.social || [];
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Social Links</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newLinks: SocialLink[] = [...socialLinks, { platform: 'website', url: '' }];
                  updateSettings('social', newLinks);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {socialLinks.map((link: SocialLink, index: number) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Platform</Label>
                  <Select
                    value={link.platform}
                    onValueChange={(value) => {
                      const newLinks = [...socialLinks];
                      newLinks[index] = { ...link, platform: value as SocialLink['platform'] };
                      updateSettings('social', newLinks);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOCIAL_PLATFORMS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.icon} {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-[2]">
                  <Label className="text-xs">URL</Label>
                  <Input
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...socialLinks];
                      newLinks[index] = { ...link, url: e.target.value };
                      updateSettings('social', newLinks);
                    }}
                    placeholder="https://..."
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    const newLinks = socialLinks.filter((_: SocialLink, i: number) => i !== index);
                    updateSettings('social', newLinks);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        );

      case 'quote':
        return (
          <div className="space-y-4">
            <div>
              <Label>Quote Text</Label>
              <Textarea
                value={localBlock.content}
                onChange={(e) => updateBlock({ content: e.target.value })}
                rows={4}
                placeholder="Enter quote..."
              />
            </div>
          </div>
        );

      case 'list':
        const listItems = localBlock.settings?.list?.items || ['Item 1', 'Item 2', 'Item 3'];
        return (
          <div className="space-y-4">
            <div>
              <Label>List Type</Label>
              <Select
                value={localBlock.settings?.list?.listType || 'bullet'}
                onValueChange={(value) => updateSettings('list', { ...localBlock.settings?.list, listType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bullet">Bullet List</SelectItem>
                  <SelectItem value="numbered">Numbered List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>List Items</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    updateSettings('list', { 
                      ...localBlock.settings?.list, 
                      items: [...listItems, `Item ${listItems.length + 1}`] 
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {listItems.map((item: string, index: number) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={item}
                    onChange={(e) => {
                      const newItems = [...listItems];
                      newItems[index] = e.target.value;
                      updateSettings('list', { ...localBlock.settings?.list, items: newItems });
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      const newItems = listItems.filter((_: string, i: number) => i !== index);
                      updateSettings('list', { ...localBlock.settings?.list, items: newItems });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <Label>Video URL</Label>
              <Input
                value={localBlock.settings?.video?.url || ''}
                onChange={(e) => updateSettings('video', { ...localBlock.settings?.video, url: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div>
              <Label>Thumbnail URL</Label>
              <Input
                value={localBlock.settings?.video?.thumbnail || ''}
                onChange={(e) => updateSettings('video', { ...localBlock.settings?.video, thumbnail: e.target.value })}
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>
          </div>
        );

      case 'html':
        return (
          <div className="space-y-4">
            <div>
              <Label>Custom HTML</Label>
              <Textarea
                value={localBlock.content}
                onChange={(e) => updateBlock({ content: e.target.value })}
                rows={10}
                className="font-mono text-sm"
                placeholder="<div>Your custom HTML...</div>"
              />
            </div>
          </div>
        );

      case 'countdown':
        return (
          <div className="space-y-4">
            <div>
              <Label>Target Date & Time</Label>
              <Input
                type="datetime-local"
                value={localBlock.settings?.countdown?.targetDate || ''}
                onChange={(e) => updateSettings('countdown', { ...localBlock.settings?.countdown, targetDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Expired Message</Label>
              <Input
                value={localBlock.settings?.countdown?.expiredMessage || 'Offer expired'}
                onChange={(e) => updateSettings('countdown', { ...localBlock.settings?.countdown, expiredMessage: e.target.value })}
              />
            </div>
          </div>
        );

      case 'menu':
        const menuItems = localBlock.settings?.menu?.items || [];
        return (
          <div className="space-y-4">
            <div>
              <Label>Orientation</Label>
              <Select
                value={localBlock.settings?.menu?.orientation || 'horizontal'}
                onValueChange={(value) => updateSettings('menu', { ...localBlock.settings?.menu, orientation: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="vertical">Vertical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Menu Items</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    updateSettings('menu', { 
                      ...localBlock.settings?.menu, 
                      items: [...menuItems, { label: 'New Link', url: '#' }] 
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {menuItems.map((item: { label: string; url: string }, index: number) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={item.label}
                    onChange={(e) => {
                      const newItems = [...menuItems];
                      newItems[index] = { ...item, label: e.target.value };
                      updateSettings('menu', { ...localBlock.settings?.menu, items: newItems });
                    }}
                    placeholder="Label"
                    className="flex-1"
                  />
                  <Input
                    value={item.url}
                    onChange={(e) => {
                      const newItems = [...menuItems];
                      newItems[index] = { ...item, url: e.target.value };
                      updateSettings('menu', { ...localBlock.settings?.menu, items: newItems });
                    }}
                    placeholder="URL"
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      const newItems = menuItems.filter((_: { label: string; url: string }, i: number) => i !== index);
                      updateSettings('menu', { ...localBlock.settings?.menu, items: newItems });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'footer':
        return (
          <div className="space-y-4">
            <div>
              <Label>Footer Content</Label>
              <Textarea
                value={localBlock.content}
                onChange={(e) => updateBlock({ content: e.target.value })}
                rows={4}
                placeholder="© 2024 Your Company. All rights reserved."
              />
            </div>
          </div>
        );

      case 'columns':
        const columns = localBlock.settings?.columns || [{ width: '50%', content: [] }, { width: '50%', content: [] }];
        return (
          <div className="space-y-4">
            <div>
              <Label>Number of Columns</Label>
              <Select
                value={String(columns.length)}
                onValueChange={(value) => {
                  const numCols = parseInt(value);
                  const newColumns: { width: string; content: EmailBlock[] }[] = [];
                  const widths = numCols === 2 ? ['50%', '50%'] : numCols === 3 ? ['33.33%', '33.33%', '33.33%'] : ['25%', '25%', '25%', '25%'];
                  for (let i = 0; i < numCols; i++) {
                    newColumns.push({
                      width: widths[i],
                      content: (columns[i]?.content as EmailBlock[]) || []
                    });
                  }
                  updateSettings('columns', newColumns);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Column Widths</Label>
              {columns.map((col, index: number) => (
                <div key={index} className="flex gap-2 mt-2">
                  <span className="text-sm text-muted-foreground w-20">Col {index + 1}:</span>
                  <Input
                    value={col.width}
                    onChange={(e) => {
                      const newColumns = columns.map((c, i) => 
                        i === index ? { ...c, width: e.target.value } : c
                      );
                      updateSettings('columns', newColumns);
                    }}
                    placeholder="50%"
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Drag blocks from the left panel into columns to add content.
            </p>
          </div>
        );

      case 'table':
        const tableRows = localBlock.settings?.table?.rows || [
          { cells: [{ content: 'Header 1' }, { content: 'Header 2' }, { content: 'Header 3' }] },
          { cells: [{ content: 'Cell 1' }, { content: 'Cell 2' }, { content: 'Cell 3' }] },
        ];
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Header Row</Label>
              <Switch
                checked={localBlock.settings?.table?.headerRow || false}
                onCheckedChange={(checked) => updateSettings('table', { ...localBlock.settings?.table, headerRow: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Table Rows</Label>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const numCells = tableRows[0]?.cells?.length || 3;
                    const newRow = { cells: Array(numCells).fill(null).map(() => ({ content: 'New cell' })) };
                    updateSettings('table', { ...localBlock.settings?.table, rows: [...tableRows, newRow] });
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" /> Row
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newRows = tableRows.map((row: { cells: { content: string }[] }) => ({
                      cells: [...row.cells, { content: 'New' }]
                    }));
                    updateSettings('table', { ...localBlock.settings?.table, rows: newRows });
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" /> Col
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-auto">
              {tableRows.map((row: { cells: { content: string }[] }, rowIndex: number) => (
                <div key={rowIndex} className="flex gap-1 items-center">
                  <span className="text-xs text-muted-foreground w-6">{rowIndex + 1}</span>
                  {row.cells.map((cell: { content: string }, cellIndex: number) => (
                    <Input
                      key={cellIndex}
                      value={cell.content}
                      onChange={(e) => {
                        const newRows = [...tableRows];
                        newRows[rowIndex].cells[cellIndex] = { content: e.target.value };
                        updateSettings('table', { ...localBlock.settings?.table, rows: newRows });
                      }}
                      className="flex-1 h-8 text-xs"
                    />
                  ))}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive"
                    onClick={() => {
                      if (tableRows.length > 1) {
                        const newRows = tableRows.filter((_: { cells: { content: string }[] }, i: number) => i !== rowIndex);
                        updateSettings('table', { ...localBlock.settings?.table, rows: newRows });
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'url':
        return (
          <div className="space-y-4">
            <div>
              <Label>URL</Label>
              <Input
                value={localBlock.settings?.url?.url || ''}
                onChange={(e) => updateSettings('url', { ...localBlock.settings?.url, url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label>Display Text</Label>
              <Input
                value={localBlock.settings?.url?.displayText || ''}
                onChange={(e) => updateSettings('url', { ...localBlock.settings?.url, displayText: e.target.value })}
                placeholder="Click here"
              />
            </div>
            <div>
              <Label>Style</Label>
              <Select
                value={localBlock.settings?.url?.style || 'link'}
                onValueChange={(value) => updateSettings('url', { ...localBlock.settings?.url, style: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Simple Link</SelectItem>
                  <SelectItem value="button">Button Style</SelectItem>
                  <SelectItem value="card">Card Style</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description (for card style)</Label>
              <Input
                value={localBlock.settings?.url?.description || ''}
                onChange={(e) => updateSettings('url', { ...localBlock.settings?.url, description: e.target.value })}
                placeholder="Brief description..."
              />
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-4">
            <div>
              <Label>Event Title</Label>
              <Input
                value={localBlock.settings?.calendar?.eventTitle || ''}
                onChange={(e) => updateSettings('calendar', { ...localBlock.settings?.calendar, eventTitle: e.target.value })}
                placeholder="Event name"
              />
            </div>
            <div>
              <Label>Event Date</Label>
              <Input
                type="date"
                value={localBlock.settings?.calendar?.eventDate || ''}
                onChange={(e) => updateSettings('calendar', { ...localBlock.settings?.calendar, eventDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Event Time</Label>
              <Input
                value={localBlock.settings?.calendar?.eventTime || ''}
                onChange={(e) => updateSettings('calendar', { ...localBlock.settings?.calendar, eventTime: e.target.value })}
                placeholder="2:00 PM - 4:00 PM"
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={localBlock.settings?.calendar?.eventLocation || ''}
                onChange={(e) => updateSettings('calendar', { ...localBlock.settings?.calendar, eventLocation: e.target.value })}
                placeholder="123 Main St, City"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={localBlock.settings?.calendar?.eventDescription || ''}
                onChange={(e) => updateSettings('calendar', { ...localBlock.settings?.calendar, eventDescription: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Add to Calendar URL</Label>
              <Input
                value={localBlock.settings?.calendar?.addToCalendarUrl || ''}
                onChange={(e) => updateSettings('calendar', { ...localBlock.settings?.calendar, addToCalendarUrl: e.target.value })}
                placeholder="https://calendar.google.com/..."
              />
            </div>
          </div>
        );

      case 'map':
        return (
          <div className="space-y-4">
            <div>
              <Label>Address</Label>
              <Textarea
                value={localBlock.settings?.map?.address || ''}
                onChange={(e) => updateSettings('map', { ...localBlock.settings?.map, address: e.target.value })}
                rows={2}
                placeholder="123 Main Street, City, State ZIP"
              />
            </div>
            <div>
              <Label>Map Image URL</Label>
              <Input
                value={localBlock.settings?.map?.mapImageUrl || ''}
                onChange={(e) => updateSettings('map', { ...localBlock.settings?.map, mapImageUrl: e.target.value })}
                placeholder="https://maps.googleapis.com/..."
              />
            </div>
            <div>
              <Label>Directions URL</Label>
              <Input
                value={localBlock.settings?.map?.directionsUrl || ''}
                onChange={(e) => updateSettings('map', { ...localBlock.settings?.map, directionsUrl: e.target.value })}
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>
        );

      case 'coupon':
        return (
          <div className="space-y-4">
            <div>
              <Label>Coupon Code</Label>
              <Input
                value={localBlock.settings?.coupon?.code || ''}
                onChange={(e) => updateSettings('coupon', { ...localBlock.settings?.coupon, code: e.target.value })}
                placeholder="SAVE20"
              />
            </div>
            <div>
              <Label>Discount</Label>
              <Input
                value={localBlock.settings?.coupon?.discount || ''}
                onChange={(e) => updateSettings('coupon', { ...localBlock.settings?.coupon, discount: e.target.value })}
                placeholder="20% OFF"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={localBlock.settings?.coupon?.description || ''}
                onChange={(e) => updateSettings('coupon', { ...localBlock.settings?.coupon, description: e.target.value })}
                placeholder="On your first order"
              />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input
                value={localBlock.settings?.coupon?.expiryDate || ''}
                onChange={(e) => updateSettings('coupon', { ...localBlock.settings?.coupon, expiryDate: e.target.value })}
                placeholder="December 31, 2024"
              />
            </div>
            <div>
              <Label>Terms</Label>
              <Input
                value={localBlock.settings?.coupon?.terms || ''}
                onChange={(e) => updateSettings('coupon', { ...localBlock.settings?.coupon, terms: e.target.value })}
                placeholder="*Minimum order $50"
              />
            </div>
            <div>
              <Label>Border Style</Label>
              <Select
                value={localBlock.settings?.coupon?.borderStyle || 'dashed'}
                onValueChange={(value) => updateSettings('coupon', { ...localBlock.settings?.coupon, borderStyle: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'rating':
        return (
          <div className="space-y-4">
            <div>
              <Label>Rating: {localBlock.settings?.rating?.rating || 5}</Label>
              <Slider
                value={[localBlock.settings?.rating?.rating || 5]}
                onValueChange={([value]) => updateSettings('rating', { ...localBlock.settings?.rating, rating: value })}
                min={0}
                max={localBlock.settings?.rating?.maxRating || 5}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Max Rating</Label>
              <Select
                value={String(localBlock.settings?.rating?.maxRating || 5)}
                onValueChange={(value) => updateSettings('rating', { ...localBlock.settings?.rating, maxRating: parseInt(value) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Style</Label>
              <Select
                value={localBlock.settings?.rating?.style || 'stars'}
                onValueChange={(value) => updateSettings('rating', { ...localBlock.settings?.rating, style: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="stars">Stars ⭐</SelectItem>
                  <SelectItem value="hearts">Hearts ❤️</SelectItem>
                  <SelectItem value="circles">Circles ●</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Number</Label>
              <Switch
                checked={localBlock.settings?.rating?.showNumber || false}
                onCheckedChange={(checked) => updateSettings('rating', { ...localBlock.settings?.rating, showNumber: checked })}
              />
            </div>
          </div>
        );

      case 'progress':
        return (
          <div className="space-y-4">
            <div>
              <Label>Label</Label>
              <Input
                value={localBlock.settings?.progress?.label || ''}
                onChange={(e) => updateSettings('progress', { ...localBlock.settings?.progress, label: e.target.value })}
                placeholder="Progress"
              />
            </div>
            <div>
              <Label>Value: {localBlock.settings?.progress?.value || 75}</Label>
              <Slider
                value={[localBlock.settings?.progress?.value || 75]}
                onValueChange={([value]) => updateSettings('progress', { ...localBlock.settings?.progress, value })}
                min={0}
                max={localBlock.settings?.progress?.max || 100}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Max Value</Label>
              <Input
                type="number"
                value={localBlock.settings?.progress?.max || 100}
                onChange={(e) => updateSettings('progress', { ...localBlock.settings?.progress, max: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={localBlock.settings?.progress?.color || '#0066cc'}
                  onChange={(e) => updateSettings('progress', { ...localBlock.settings?.progress, color: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={localBlock.settings?.progress?.color || '#0066cc'}
                  onChange={(e) => updateSettings('progress', { ...localBlock.settings?.progress, color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Percentage</Label>
              <Switch
                checked={localBlock.settings?.progress?.showPercentage !== false}
                onCheckedChange={(checked) => updateSettings('progress', { ...localBlock.settings?.progress, showPercentage: checked })}
              />
            </div>
          </div>
        );

      case 'accordion':
        const accordionItems = localBlock.settings?.accordion?.items || [];
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Accordion Items</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  updateSettings('accordion', {
                    ...localBlock.settings?.accordion,
                    items: [...accordionItems, { title: 'New Section', content: 'Content here...' }]
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {accordionItems.map((item: { title: string; content: string }, index: number) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Item {index + 1}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive"
                    onClick={() => {
                      const newItems = accordionItems.filter((_: { title: string; content: string }, i: number) => i !== index);
                      updateSettings('accordion', { ...localBlock.settings?.accordion, items: newItems });
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  value={item.title}
                  onChange={(e) => {
                    const newItems = [...accordionItems];
                    newItems[index] = { ...item, title: e.target.value };
                    updateSettings('accordion', { ...localBlock.settings?.accordion, items: newItems });
                  }}
                  placeholder="Title"
                />
                <Textarea
                  value={item.content}
                  onChange={(e) => {
                    const newItems = [...accordionItems];
                    newItems[index] = { ...item, content: e.target.value };
                    updateSettings('accordion', { ...localBlock.settings?.accordion, items: newItems });
                  }}
                  rows={2}
                  placeholder="Content"
                />
              </div>
            ))}
          </div>
        );

      case 'iconList':
        const iconListItems = localBlock.settings?.iconList?.items || [];
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Icon List Items</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  updateSettings('iconList', {
                    ...localBlock.settings?.iconList,
                    items: [...iconListItems, { icon: '✓', text: 'New item' }]
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div>
              <Label>Icon Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={localBlock.settings?.iconList?.iconColor || '#0066cc'}
                  onChange={(e) => updateSettings('iconList', { ...localBlock.settings?.iconList, iconColor: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={localBlock.settings?.iconList?.iconColor || '#0066cc'}
                  onChange={(e) => updateSettings('iconList', { ...localBlock.settings?.iconList, iconColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            {iconListItems.map((item: { icon: string; text: string; subtext?: string }, index: number) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Item {index + 1}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive"
                    onClick={() => {
                      const newItems = iconListItems.filter((_: { icon: string; text: string }, i: number) => i !== index);
                      updateSettings('iconList', { ...localBlock.settings?.iconList, items: newItems });
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    value={item.icon}
                    onChange={(e) => {
                      const newItems = [...iconListItems];
                      newItems[index] = { ...item, icon: e.target.value };
                      updateSettings('iconList', { ...localBlock.settings?.iconList, items: newItems });
                    }}
                    placeholder="✓"
                    className="col-span-1"
                  />
                  <Input
                    value={item.text}
                    onChange={(e) => {
                      const newItems = [...iconListItems];
                      newItems[index] = { ...item, text: e.target.value };
                      updateSettings('iconList', { ...localBlock.settings?.iconList, items: newItems });
                    }}
                    placeholder="Text"
                    className="col-span-3"
                  />
                </div>
                <Input
                  value={item.subtext || ''}
                  onChange={(e) => {
                    const newItems = [...iconListItems];
                    newItems[index] = { ...item, subtext: e.target.value };
                    updateSettings('iconList', { ...localBlock.settings?.iconList, items: newItems });
                  }}
                  placeholder="Subtext (optional)"
                />
              </div>
            ))}
          </div>
        );

      case 'beforeAfter':
        return (
          <div className="space-y-4">
            <div>
              <Label>Before Image URL</Label>
              <Input
                value={localBlock.settings?.beforeAfter?.beforeImage || ''}
                onChange={(e) => updateSettings('beforeAfter', { ...localBlock.settings?.beforeAfter, beforeImage: e.target.value })}
                placeholder="https://example.com/before.jpg"
              />
            </div>
            <div>
              <Label>Before Label</Label>
              <Input
                value={localBlock.settings?.beforeAfter?.beforeLabel || ''}
                onChange={(e) => updateSettings('beforeAfter', { ...localBlock.settings?.beforeAfter, beforeLabel: e.target.value })}
                placeholder="Before"
              />
            </div>
            <div>
              <Label>After Image URL</Label>
              <Input
                value={localBlock.settings?.beforeAfter?.afterImage || ''}
                onChange={(e) => updateSettings('beforeAfter', { ...localBlock.settings?.beforeAfter, afterImage: e.target.value })}
                placeholder="https://example.com/after.jpg"
              />
            </div>
            <div>
              <Label>After Label</Label>
              <Input
                value={localBlock.settings?.beforeAfter?.afterLabel || ''}
                onChange={(e) => updateSettings('beforeAfter', { ...localBlock.settings?.beforeAfter, afterLabel: e.target.value })}
                placeholder="After"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderStyleSettings = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Background Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={localBlock.style.backgroundColor || '#ffffff'}
              onChange={(e) => updateStyle('backgroundColor', e.target.value)}
              className="w-12 h-10 p-1"
            />
            <Input
              value={localBlock.style.backgroundColor || 'transparent'}
              onChange={(e) => updateStyle('backgroundColor', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <Label>Text Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={localBlock.style.textColor || '#333333'}
              onChange={(e) => updateStyle('textColor', e.target.value)}
              className="w-12 h-10 p-1"
            />
            <Input
              value={localBlock.style.textColor || '#333333'}
              onChange={(e) => updateStyle('textColor', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Font Family</Label>
          <Select
            value={localBlock.style.fontFamily || 'inherit'}
            onValueChange={(value) => updateStyle('fontFamily', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">Inherit</SelectItem>
              {FONT_FAMILIES.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Font Size</Label>
          <Select
            value={localBlock.style.fontSize || '16px'}
            onValueChange={(value) => updateStyle('fontSize', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Text Alignment</Label>
        <Select
          value={localBlock.style.textAlign || 'left'}
          onValueChange={(value) => updateStyle('textAlign', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
            <SelectItem value="justify">Justify</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Padding</Label>
        <Input
          value={localBlock.style.padding || '16px'}
          onChange={(e) => updateStyle('padding', e.target.value)}
          placeholder="16px or 16px 24px"
        />
      </div>

      <div>
        <Label>Border Radius</Label>
        <Input
          value={localBlock.style.borderRadius || '0'}
          onChange={(e) => updateStyle('borderRadius', e.target.value)}
          placeholder="0 or 8px"
        />
      </div>

      <div>
        <Label>Line Height</Label>
        <Input
          value={localBlock.style.lineHeight || '1.5'}
          onChange={(e) => updateStyle('lineHeight', e.target.value)}
          placeholder="1.5"
        />
      </div>
    </div>
  );

  return (
    <Card className="h-full border-0 rounded-none">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium capitalize">{block.type} Settings</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="px-4 pb-4">
            <Tabs defaultValue="content">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>
              <TabsContent value="content" className="mt-4">
                {renderContentSettings()}
              </TabsContent>
              <TabsContent value="style" className="mt-4">
                {renderStyleSettings()}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default BlockSettings;
