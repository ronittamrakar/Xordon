import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Type,
  Mail,
  FileTextIcon,
  List,
  CheckSquare,
  Circle,
  File,
  Star,
  Lock,
  Palette,
  Calendar,
  Phone,
  Link,
  Hash,
  Clock,
  GripVertical,
  Trash2,
  Copy,
  Settings,
  Eye,
  EyeOff,
  Plus,
  ChevronRight,
  Columns,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
} from 'lucide-react';
import { type FormField, type FormStep } from '@/lib/api';
import { cn } from '@/lib/utils';

// Field type definitions with icons and default config
const FIELD_TYPES = [
  { type: 'text', label: 'Text Input', icon: Type, category: 'basic' },
  { type: 'email', label: 'Email', icon: Mail, category: 'basic' },
  { type: 'textarea', label: 'Text Area', icon: FileTextIcon, category: 'basic' },
  { type: 'number', label: 'Number', icon: Hash, category: 'basic' },
  { type: 'tel', label: 'Phone', icon: Phone, category: 'basic' },
  { type: 'url', label: 'URL', icon: Link, category: 'basic' },
  { type: 'select', label: 'Dropdown', icon: List, category: 'choice' },
  { type: 'radio', label: 'Radio Buttons', icon: Circle, category: 'choice' },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, category: 'choice' },
  { type: 'date', label: 'Date', icon: Calendar, category: 'datetime' },
  { type: 'time', label: 'Time', icon: Clock, category: 'datetime' },
  { type: 'datetime', label: 'Date & Time', icon: Calendar, category: 'datetime' },
  { type: 'file', label: 'File Upload', icon: File, category: 'advanced' },
  { type: 'rating', label: 'Rating', icon: Star, category: 'advanced' },
  { type: 'range', label: 'Range Slider', icon: Settings, category: 'advanced' },
  { type: 'color', label: 'Color Picker', icon: Palette, category: 'advanced' },
  { type: 'password', label: 'Password', icon: Lock, category: 'advanced' },
  { type: 'hidden', label: 'Hidden Field', icon: EyeOff, category: 'advanced' },
] as const;

const FIELD_CATEGORIES = [
  { id: 'basic', label: 'Basic Fields' },
  { id: 'choice', label: 'Choice Fields' },
  { id: 'datetime', label: 'Date & Time' },
  { id: 'advanced', label: 'Advanced' },
];

interface VisualFormBuilderProps {
  fields: FormField[];
  onFieldsChange: (fields: FormField[]) => void;
  isMultiStep?: boolean;
  steps?: FormStep[];
  onStepsChange?: (steps: FormStep[]) => void;
  formTitle?: string;
  formDescription?: string;
  theme?: {
    primary_color: string;
    background_color: string;
    text_color: string;
    button_style: 'rounded' | 'square' | 'pill';
  };
}

// Draggable field type from palette
function DraggableFieldType({ type, label, icon: Icon }: { type: string; label: string; icon: React.ElementType }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('fieldType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-2 p-2 rounded-lg border border-transparent hover:border-primary/30 hover:bg-primary/5 cursor-grab active:cursor-grabbing transition-all group"
    >
      <div className="p-1.5 rounded bg-muted group-hover:bg-primary/10 transition-colors">
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

// Sortable field in canvas
function SortableCanvasField({
  field,
  isSelected,
  onSelect,
  onRemove,
  onDuplicate,
  theme,
}: {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  theme?: VisualFormBuilderProps['theme'];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fieldType = FIELD_TYPES.find(f => f.type === field.type);
  const Icon = fieldType?.icon || Type;

  const getWidthClass = () => {
    switch (field.width) {
      case 'half': return 'w-1/2';
      case 'third': return 'w-1/3';
      default: return 'w-full';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        getWidthClass(),
        'p-1',
        isDragging && 'opacity-50'
      )}
    >
      <div
        onClick={onSelect}
        className={cn(
          'relative group rounded-lg border-2 p-4 transition-all cursor-pointer',
          isSelected
            ? 'border-primary bg-primary/5 shadow-md'
            : 'border-transparent hover:border-muted-foreground/20 bg-background'
        )}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-all"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Field actions */}
        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Field preview */}
        <div className="pl-6">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">
              {field.label}
              {field.required ? <span className="text-destructive ml-1">*</span> : null}
            </Label>
          </div>
          
          {/* Render field preview based on type */}
          {renderFieldPreview(field, theme)}
        </div>
      </div>
    </div>
  );
}

// Render field preview in canvas
function renderFieldPreview(field: FormField, theme?: VisualFormBuilderProps['theme']) {
  const inputStyle = {
    borderColor: theme?.primary_color ? `${theme.primary_color}40` : undefined,
  };

  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
    case 'url':
    case 'number':
    case 'password':
      return (
        <Input
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          disabled
          className="bg-muted/50"
          style={inputStyle}
        />
      );
    case 'textarea':
      return (
        <Textarea
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          disabled
          rows={3}
          className="bg-muted/50 resize-none"
          style={inputStyle}
        />
      );
    case 'select':
      return (
        <Select disabled>
          <SelectTrigger className="bg-muted/50" style={inputStyle}>
            <SelectValue placeholder={field.placeholder || 'Select an option'} />
          </SelectTrigger>
        </Select>
      );
    case 'checkbox':
      return (
        <div className="space-y-2">
          {(field.options || ['Option 1', 'Option 2']).slice(0, 3).map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border border-muted-foreground/30" />
              <span className="text-sm text-muted-foreground">{opt}</span>
            </div>
          ))}
        </div>
      );
    case 'radio':
      return (
        <div className="space-y-2">
          {(field.options || ['Option 1', 'Option 2']).slice(0, 3).map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
              <span className="text-sm text-muted-foreground">{opt}</span>
            </div>
          ))}
        </div>
      );
    case 'date':
    case 'time':
    case 'datetime':
      return (
        <Input
          type={field.type === 'datetime' ? 'datetime-local' : field.type}
          disabled
          className="bg-muted/50"
          style={inputStyle}
        />
      );
    case 'file':
      return (
        <div className="border-2 border-dashed rounded-lg p-4 text-center bg-muted/30">
          <File className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
          <p className="text-xs text-muted-foreground">
            {field.accept || 'Click or drag to upload'}
          </p>
        </div>
      );
    case 'rating':
      return (
        <div className="flex gap-1">
          {Array.from({ length: field.rating_max || 5 }).map((_, i) => (
            <Star key={i} className="h-5 w-5 text-muted-foreground/30" />
          ))}
        </div>
      );
    case 'range':
      return (
        <div className="space-y-1">
          <input
            type="range"
            min={field.min || 0}
            max={field.max || 100}
            disabled
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{field.min || 0}</span>
            <span>{field.max || 100}</span>
          </div>
        </div>
      );
    case 'color':
      return (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded border bg-primary/20" />
          <span className="text-sm text-muted-foreground">Choose color</span>
        </div>
      );
    case 'hidden':
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <EyeOff className="h-4 w-4" />
          <span className="text-sm italic">Hidden field (not visible to users)</span>
        </div>
      );
    default:
      return <Input disabled className="bg-muted/50" />;
  }
}

// Field settings panel
function FieldSettingsPanel({
  field,
  onUpdate,
}: {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
}) {
  const fieldType = FIELD_TYPES.find(f => f.type === field.type);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        {fieldType && <fieldType.icon className="h-4 w-4 text-primary" />}
        <span className="font-medium">{fieldType?.label || 'Field'} Settings</span>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Field label"
            />
          </div>

          <div className="space-y-2">
            <Label>Field Name (ID)</Label>
            <Input
              value={field.name}
              onChange={(e) => onUpdate({ name: e.target.value.replace(/\s/g, '_').toLowerCase() })}
              placeholder="field_name"
            />
            <p className="text-xs text-muted-foreground">Used in form data submission</p>
          </div>

          <div className="space-y-2">
            <Label>Placeholder</Label>
            <Input
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Placeholder text"
            />
          </div>

          <div className="space-y-2">
            <Label>Help Text</Label>
            <Input
              value={field.help_text || ''}
              onChange={(e) => onUpdate({ help_text: e.target.value })}
              placeholder="Additional help text"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Required</Label>
            <Switch
              checked={field.required}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
            />
          </div>

          {/* Type-specific options */}
          {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
            <div className="space-y-2">
              <Label>Options (one per line)</Label>
              <Textarea
                value={field.options?.join('\n') || ''}
                onChange={(e) => onUpdate({ options: e.target.value.split('\n').filter(o => o.trim()) })}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                rows={4}
              />
            </div>
          )}

          {field.type === 'file' && (
            <>
              <div className="space-y-2">
                <Label>Accepted File Types</Label>
                <Input
                  value={field.accept || ''}
                  onChange={(e) => onUpdate({ accept: e.target.value })}
                  placeholder="image/*,.pdf,.doc"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Allow Multiple Files</Label>
                <Switch
                  checked={field.multiple || false}
                  onCheckedChange={(checked) => onUpdate({ multiple: checked })}
                />
              </div>
            </>
          )}

          {field.type === 'rating' && (
            <div className="space-y-2">
              <Label>Max Rating</Label>
              <Select
                value={String(field.rating_max || 5)}
                onValueChange={(v) => onUpdate({ rating_max: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} stars</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {field.type === 'range' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Min Value</Label>
                  <Input
                    type="number"
                    value={field.min || 0}
                    onChange={(e) => onUpdate({ min: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Value</Label>
                  <Input
                    type="number"
                    value={field.max || 100}
                    onChange={(e) => onUpdate({ max: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Step</Label>
                <Input
                  type="number"
                  value={field.step_size || 1}
                  onChange={(e) => onUpdate({ step_size: parseInt(e.target.value) })}
                />
              </div>
            </>
          )}

          {field.type === 'hidden' && (
            <div className="space-y-2">
              <Label>Default Value</Label>
              <Input
                value={String(field.default_value || '')}
                onChange={(e) => onUpdate({ default_value: e.target.value })}
                placeholder="Hidden field value"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="validation" className="space-y-4 mt-4">
          {(field.type === 'text' || field.type === 'textarea' || field.type === 'password') && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Min Length</Label>
                  <Input
                    type="number"
                    value={field.validation?.min_length || ''}
                    onChange={(e) => onUpdate({
                      validation: { ...field.validation, min_length: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Length</Label>
                  <Input
                    type="number"
                    value={field.validation?.max_length || ''}
                    onChange={(e) => onUpdate({
                      validation: { ...field.validation, max_length: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="255"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pattern (Regex)</Label>
                <Input
                  value={field.validation?.pattern || ''}
                  onChange={(e) => onUpdate({
                    validation: { ...field.validation, pattern: e.target.value }
                  })}
                  placeholder="^[a-zA-Z]+$"
                />
              </div>
            </>
          )}

          {(field.type === 'number' || field.type === 'range') && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Min Value</Label>
                <Input
                  type="number"
                  value={field.validation?.min_value || ''}
                  onChange={(e) => onUpdate({
                    validation: { ...field.validation, min_value: parseInt(e.target.value) || undefined }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Value</Label>
                <Input
                  type="number"
                  value={field.validation?.max_value || ''}
                  onChange={(e) => onUpdate({
                    validation: { ...field.validation, max_value: parseInt(e.target.value) || undefined }
                  })}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Custom Error Message</Label>
            <Input
              value={field.validation?.custom_message || ''}
              onChange={(e) => onUpdate({
                validation: { ...field.validation, custom_message: e.target.value }
              })}
              placeholder="Please enter a valid value"
            />
          </div>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Field Width</Label>
            <div className="flex gap-2">
              {[
                { value: 'full', label: 'Full', icon: AlignLeft },
                { value: 'half', label: 'Half', icon: Columns },
                { value: 'third', label: 'Third', icon: AlignCenter },
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={field.width === value || (!field.width && value === 'full') ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => onUpdate({ width: value as FormField['width'] })}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function VisualFormBuilder({
  fields,
  onFieldsChange,
  isMultiStep = false,
  steps = [],
  onStepsChange,
  formTitle,
  formDescription,
  theme,
}: VisualFormBuilderProps) {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedField = fields.find(f => f.id === selectedFieldId);

  const generateFieldId = () => `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addField = useCallback((type: string) => {
    const fieldType = FIELD_TYPES.find(f => f.type === type);
    const newField: FormField = {
      id: generateFieldId(),
      name: `field_${fields.length + 1}`,
      type: type as FormField['type'],
      label: fieldType?.label || 'New Field',
      required: false,
      width: 'full',
    };

    if (type === 'select' || type === 'radio' || type === 'checkbox') {
      newField.options = ['Option 1', 'Option 2', 'Option 3'];
    }
    if (type === 'rating') {
      newField.rating_max = 5;
    }
    if (type === 'range') {
      newField.min = 0;
      newField.max = 100;
      newField.step_size = 1;
    }

    onFieldsChange([...fields, newField]);
    setSelectedFieldId(newField.id);
  }, [fields, onFieldsChange]);

  const updateField = useCallback((id: string, updates: Partial<FormField>) => {
    onFieldsChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  }, [fields, onFieldsChange]);

  const removeField = useCallback((id: string) => {
    onFieldsChange(fields.filter(f => f.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(null);
    }
  }, [fields, onFieldsChange, selectedFieldId]);

  const duplicateField = useCallback((id: string) => {
    const field = fields.find(f => f.id === id);
    if (!field) return;

    const newField: FormField = {
      ...field,
      id: generateFieldId(),
      name: `${field.name}_copy`,
      label: `${field.label} (Copy)`,
    };

    const index = fields.findIndex(f => f.id === id);
    const newFields = [...fields];
    newFields.splice(index + 1, 0, newField);
    onFieldsChange(newFields);
    setSelectedFieldId(newField.id);
  }, [fields, onFieldsChange]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);
      onFieldsChange(arrayMove(fields, oldIndex, newIndex));
    }
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const handleCanvasDragLeave = () => {
    setDragOver(false);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const fieldType = e.dataTransfer.getData('fieldType');
    if (fieldType) {
      addField(fieldType);
    }
  };

  return (
    <div className="flex h-full bg-muted/30">
      {/* Left Panel - Field Palette */}
      <div className="w-64 border-r bg-background flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Fields
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Drag fields to the canvas or click to add
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {FIELD_CATEGORIES.map(category => (
              <div key={category.id}>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {category.label}
                </h4>
                <div className="space-y-1">
                  {FIELD_TYPES.filter(f => f.category === category.id).map(fieldType => (
                    <DraggableFieldType
                      key={fieldType.type}
                      type={fieldType.type}
                      label={fieldType.label}
                      icon={fieldType.icon}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Center - Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-background flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{formTitle || 'Form Preview'}</h2>
            {formDescription && (
              <p className="text-sm text-muted-foreground">{formDescription}</p>
            )}
          </div>
          <Badge variant="outline" className="gap-1">
            <Eye className="h-3 w-3" />
            Preview Mode
          </Badge>
        </div>

        <ScrollArea className="flex-1">
          <div
            className={cn(
              'min-h-full p-8 transition-colors',
              dragOver && 'bg-primary/5'
            )}
            onDragOver={handleCanvasDragOver}
            onDragLeave={handleCanvasDragLeave}
            onDrop={handleCanvasDrop}
          >
            <div
              className="max-w-2xl mx-auto rounded-xl border bg-background shadow-sm p-6"
              style={{
                backgroundColor: theme?.background_color,
                color: theme?.text_color,
              }}
            >
              {fields.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Start Building Your Form</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag fields from the left panel or click them to add
                  </p>
                  <Button variant="outline" onClick={() => addField('text')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Field
                  </Button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-wrap -m-1">
                      {fields.map(field => (
                        <SortableCanvasField
                          key={field.id}
                          field={field}
                          isSelected={selectedFieldId === field.id}
                          onSelect={() => setSelectedFieldId(field.id)}
                          onRemove={() => removeField(field.id)}
                          onDuplicate={() => duplicateField(field.id)}
                          theme={theme}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Submit button preview */}
              {fields.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <Button
                    className={cn(
                      'w-full',
                      theme?.button_style === 'pill' && 'rounded-full',
                      theme?.button_style === 'square' && 'rounded-none'
                    )}
                    style={{ backgroundColor: theme?.primary_color }}
                    disabled
                  >
                    Submit
                  </Button>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Field Settings */}
      <div className="w-80 border-l bg-background flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Field Settings
          </h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            {selectedField ? (
              <FieldSettingsPanel
                field={selectedField}
                onUpdate={(updates) => updateField(selectedField.id, updates)}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a field to edit its settings</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

