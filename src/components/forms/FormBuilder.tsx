import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Plus, 
  GripVertical, 
  Type, 
  Mail, 
  FileTextIcon, 
  List, 
  CheckSquare, 
  Circle,
  Eye,
  EyeOff,
  File,
  Paperclip,
  StepForward,
  Layers,
  Settings,
  Star,
  Lock,
  Palette,
  Calendar,
  HelpCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { FormStep, type FormField } from '@/lib/api';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface FormBuilderProps {
  fields: FormField[];
  onFieldsChange: (fields: FormField[]) => void;
  showPreview?: boolean;
  isMultiStep?: boolean;
  steps?: FormStep[];
  onStepsChange?: (steps: FormStep[]) => void;
  hideFieldTypes?: boolean; // Hide the field types section when parent provides it
  hideHeader?: boolean; // Hide the header with preview toggle
}

const fieldTypeIcons = {
  text: Type,
  email: Mail,
  textarea: FileTextIcon,
  select: List,
  checkbox: CheckSquare,
  radio: Circle,
  file: File,
  range: Settings,
  rating: Star,
  signature: FileTextIcon,
  hidden: EyeOff,
  password: Lock,
  color: Palette,
  datetime: Calendar,
};

const fieldTypeLabels = {
  text: 'Text Input',
  email: 'Email Input',
  textarea: 'Text Area',
  select: 'Dropdown',
  checkbox: 'Checkbox',
  radio: 'Radio Button',
  file: 'File Upload',
  range: 'Range Slider',
  rating: 'Rating Field',
  signature: 'Signature Pad',
  hidden: 'Hidden Field',
  password: 'Password Input',
  color: 'Color Picker',
  datetime: 'Date & Time',
};

interface SortableFieldProps {
  field: FormField;
  onUpdate: (id: string, updates: Partial<FormField>) => void;
  onRemove: (id: string) => void;
}

function SortableField({ field, onUpdate, onRemove }: SortableFieldProps) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = fieldTypeIcons[field.type] || Type;

  return (
    <Card ref={setNodeRef} style={style} className={`mb-4 ${isDragging ? 'shadow-lg' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <Icon className="h-4 w-4 text-gray-600" />
            <Badge variant="outline">{fieldTypeLabels[field.type] || (field.type.charAt(0).toUpperCase() + field.type.slice(1) + ' Input')}</Badge>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(field.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Field Type</Label>
            <Select
              value={field.type}
              onValueChange={(value) => onUpdate(field.id, { type: value as FormField['type'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Input</SelectItem>
                <SelectItem value="email">Email Input</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
                <SelectItem value="select">Dropdown</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="radio">Radio Button</SelectItem>
                <SelectItem value="number">Number Input</SelectItem>
                <SelectItem value="date">Date Input</SelectItem>
                <SelectItem value="time">Time Input</SelectItem>
                <SelectItem value="datetime">Date & Time</SelectItem>
                <SelectItem value="url">URL Input</SelectItem>
                <SelectItem value="tel">Phone Input</SelectItem>
                <SelectItem value="password">Password Input</SelectItem>
                <SelectItem value="color">Color Picker</SelectItem>
                <SelectItem value="file">File Upload</SelectItem>
                <SelectItem value="range">Range Slider</SelectItem>
                <SelectItem value="rating">Rating Field</SelectItem>
                <SelectItem value="signature">Signature Pad</SelectItem>
                <SelectItem value="hidden">Hidden Field</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Field Label</Label>
            <Input
              value={field.label}
              onChange={(e) => onUpdate(field.id, { label: e.target.value })}
              placeholder="Enter field label"
            />
          </div>
          <div>
            <Label>Field Name</Label>
            <Input
              value={field.name}
              onChange={(e) => onUpdate(field.id, { name: e.target.value })}
              placeholder="Enter field name (used in form data)"
            />
          </div>
        </div>

        <div>
          <Label>Placeholder Text</Label>
          <Input
            value={field.placeholder || ''}
            onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
            placeholder="Enter placeholder text"
          />
        </div>

        {(field.type === 'select' || field.type === 'radio') && (
          <div>
            <Label>Options (one per line)</Label>
            <Textarea
              value={field.options?.join('\n') || ''}
              onChange={(e) => onUpdate(field.id, { 
                options: e.target.value.split('\n').filter(opt => opt.trim()) 
              })}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              rows={4}
            />
          </div>
        )}

        {field.type === 'file' && (
          <>
            <div>
              <Label>Accepted File Types</Label>
              <Input
                value={field.accept || ''}
                onChange={(e) => onUpdate(field.id, { accept: e.target.value })}
                placeholder="image/*,.pdf,.doc"
              />
              <p className="text-sm text-gray-500 mt-1">
                Comma-separated list of accepted file types (e.g., image/*,.pdf)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`multiple-${field.id}`}
                checked={field.multiple || false}
                onChange={(e) => onUpdate(field.id, { multiple: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor={`multiple-${field.id}`}>Allow multiple files</Label>
            </div>
          </>
        )}

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`required-${field.id}`}
            checked={field.required}
            onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
            className="rounded border-gray-300"
          />
          <Label htmlFor={`required-${field.id}`}>Required field</Label>
        </div>

        {/* Advanced Options */}
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Advanced Options</Label>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                // Toggle advanced options visibility
                const element = document.getElementById(`advanced-${field.id}`);
                if (element) {
                  element.classList.toggle('hidden');
                }
              }}
            >
              <Settings className="h-3 w-3 mr-1" />
              Configure
            </Button>
          </div>
          
          <div id={`advanced-${field.id}`} className="space-y-3 hidden">
            {/* Help Text */}
            <div>
              <Label>Help Text</Label>
              <Input
                value={field.help_text || ''}
                onChange={(e) => onUpdate(field.id, { help_text: e.target.value })}
                placeholder="Additional help text for this field"
              />
            </div>

            {/* Default Value */}
            <div>
              <Label>Default Value</Label>
              <Input
                value={field.default_value?.toString() || ''}
                onChange={(e) => onUpdate(field.id, { default_value: e.target.value })}
                placeholder="Default value for this field"
              />
            </div>

            {/* Field Width */}
            <div>
              <Label>Field Width</Label>
              <Select
                value={field.width || 'full'}
                onValueChange={(value) => onUpdate(field.id, { width: value as FormField['width'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Width</SelectItem>
                  <SelectItem value="half">Half Width</SelectItem>
                  <SelectItem value="third">Third Width</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Validation Options */}
            {(field.type === 'text' || field.type === 'textarea' || field.type === 'email' || field.type === 'url' || field.type === 'tel') && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Validation</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Min Length</Label>
                    <Input
                      type="number"
                      value={field.validation?.min_length || ''}
                      onChange={(e) => onUpdate(field.id, { 
                        validation: { 
                          ...field.validation, 
                          min_length: parseInt(e.target.value) || undefined 
                        }
                      })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max Length</Label>
                    <Input
                      type="number"
                      value={field.validation?.max_length || ''}
                      onChange={(e) => onUpdate(field.id, { 
                        validation: { 
                          ...field.validation, 
                          max_length: parseInt(e.target.value) || undefined 
                        }
                      })}
                      placeholder="255"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Custom Validation Message</Label>
                  <Input
                    value={field.validation?.custom_message || ''}
                    onChange={(e) => onUpdate(field.id, { 
                      validation: { 
                        ...field.validation, 
                        custom_message: e.target.value 
                      }
                    })}
                    placeholder="Custom error message"
                  />
                </div>
              </div>
            )}

            {/* Number Validation */}
            {field.type === 'number' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Number Validation</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Min Value</Label>
                    <Input
                      type="number"
                      value={field.validation?.min_value || ''}
                      onChange={(e) => onUpdate(field.id, { 
                        validation: { 
                          ...field.validation, 
                          min_value: parseFloat(e.target.value) || undefined 
                        }
                      })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max Value</Label>
                    <Input
                      type="number"
                      value={field.validation?.max_value || ''}
                      onChange={(e) => onUpdate(field.id, { 
                        validation: { 
                          ...field.validation, 
                          max_value: parseFloat(e.target.value) || undefined 
                        }
                      })}
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Range and Rating Specific */}
            {field.type === 'range' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Range Settings</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Min</Label>
                    <Input
                      type="number"
                      value={field.min || 0}
                      onChange={(e) => onUpdate(field.id, { min: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max</Label>
                    <Input
                      type="number"
                      value={field.max || 100}
                      onChange={(e) => onUpdate(field.id, { max: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Step</Label>
                    <Input
                      type="number"
                      value={field.step_size || 1}
                      onChange={(e) => onUpdate(field.id, { step_size: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            )}

            {field.type === 'rating' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Rating Settings</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Max Rating</Label>
                    <Input
                      type="number"
                      value={field.rating_max || 5}
                      onChange={(e) => onUpdate(field.id, { rating_max: parseInt(e.target.value) })}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Style</Label>
                    <Select
                      value={field.rating_style || 'stars'}
                      onValueChange={(value) => onUpdate(field.id, { rating_style: value as FormField['rating_style'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stars">Stars</SelectItem>
                        <SelectItem value="hearts">Hearts</SelectItem>
                        <SelectItem value="numbers">Numbers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FieldTypeButtonProps {
  type: FormField['type'];
  onClick: () => void;
}

function FieldTypeButton({ type, onClick }: FieldTypeButtonProps) {
  const Icon = fieldTypeIcons[type] || Type;
  const label = fieldTypeLabels[type] || (type.charAt(0).toUpperCase() + type.slice(1) + ' Input');

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('fieldType', type);
        e.dataTransfer.effectAllowed = 'copy';
        // Set a global flag to indicate dragging
        (window as any).isDraggingField = true;
      }}
      onDragEnd={() => {
        // Clear the global flag after a small delay to prevent click events
        setTimeout(() => {
          (window as any).isDraggingField = false;
        }, 100);
      }}
      className="cursor-move"
    >
      <Button
        type="button"
        variant="outline"
        className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-blue-50 hover:border-blue-300 w-full"
        onClick={() => {
          // Only add field if not currently dragging
          if (!(window as any).isDraggingField) {
            onClick();
          }
        }}
      >
        <Icon className="h-6 w-6 text-blue-600" />
        <span className="text-sm font-medium">{label}</span>
      </Button>
    </div>
  );
}

function FormPreview({ fields }: { fields: FormField[] }) {
  const [formData, setFormData] = useState<Record<string, string | number | boolean | FileList>>({});

  const handleInputChange = (fieldId: string, value: string | number | boolean | FileList) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Form Preview</h3>
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label className="flex items-center">
            {field.label}
            {field.required ? <span className="text-red-500 ml-1">*</span> : null}
          </Label>
          
          {field.help_text && (
            <div className="flex items-start gap-1 text-sm text-gray-500">
              <HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{field.help_text}</span>
            </div>
          )}
          
          {field.type === 'text' && (
            <Input
              placeholder={field.placeholder}
              value={String(formData[field.id] || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          )}
          
          {field.type === 'email' && (
            <Input
              type="email"
              placeholder={field.placeholder || 'Enter your email'}
              value={String(formData[field.id] || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          )}

          {field.type === 'number' && (
            <Input
              type="number"
              placeholder={field.placeholder}
              value={String(formData[field.id] || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          )}

          {field.type === 'date' && (
            <Input
              type="date"
              placeholder={field.placeholder}
              value={String(formData[field.id] || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          )}

          {field.type === 'time' && (
            <Input
              type="time"
              placeholder={field.placeholder}
              value={String(formData[field.id] || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          )}

          {field.type === 'url' && (
            <Input
              type="url"
              placeholder={field.placeholder || 'https://example.com'}
              value={String(formData[field.id] || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          )}

          {field.type === 'tel' && (
            <Input
              type="tel"
              placeholder={field.placeholder || '+1 555-555-5555'}
              value={String(formData[field.id] || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          )}

          {field.type === 'file' && (
            <div className="space-y-2">
              <Input
                type="file"
                accept={field.accept}
                multiple={field.multiple}
                onChange={(e) => handleInputChange(field.id, e.target.files)}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {field.accept && (
                <p className="text-sm text-gray-500">
                  Accepted file types: {field.accept}
                </p>
              )}
              {field.multiple && (
                <p className="text-sm text-gray-500">
                  Multiple files allowed
                </p>
              )}
              {formData[field.id] && (
                <p className="text-sm text-gray-600">
                  {field.multiple 
                    ? `${(formData[field.id] as FileList).length} file(s) selected`
                    : `File selected: ${(formData[field.id] as FileList)[0]?.name || 'Unknown'}`
                  }
                </p>
              )}
            </div>
          )}

          {field.type === 'password' && (
            <Input
              type="password"
              placeholder={field.placeholder || 'Enter password'}
              value={String(formData[field.id] || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          )}

          {field.type === 'color' && (
            <div className="flex items-center space-x-2">
              <Input
                type="color"
                value={String(formData[field.id] || '#000000')}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className="w-20 h-10"
              />
              <span className="text-sm text-gray-500">
                {String(formData[field.id] || '#000000')}
              </span>
            </div>
          )}

          {field.type === 'datetime' && (
            <Input
              type="datetime-local"
              placeholder={field.placeholder}
              value={String(formData[field.id] || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          )}

          {field.type === 'range' && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Min: {field.min || 0}</span>
                <Slider
                  value={[Number(formData[field.id] || field.min || 0)]}
                  onValueChange={(value) => handleInputChange(field.id, value[0])}
                  max={field.max || 100}
                  min={field.min || 0}
                  step={field.step_size || 1}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">Max: {field.max || 100}</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-semibold">{formData[field.id] || field.min || 0}</span>
              </div>
            </div>
          )}

          {field.type === 'rating' && (
            <div className="space-y-2">
              <div className="flex items-center space-x-1">
                {Array.from({ length: field.rating_max || 5 }, (_, index) => {
                  const rating = index + 1;
                  const isSelected = Number(formData[field.id] || 0) >= rating;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleInputChange(field.id, rating)}
                      className={`text-2xl transition-colors ${
                        isSelected 
                          ? 'text-yellow-400' 
                          : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    >
                      {field.rating_style === 'hearts' ? '♥' : '★'}
                    </button>
                  );
                })}
              </div>
              {field.rating_style === 'numbers' && (
                <div className="flex items-center space-x-2">
                  {Array.from({ length: field.rating_max || 5 }, (_, index) => {
                    const rating = index + 1;
                    const isSelected = Number(formData[field.id] || 0) === rating;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleInputChange(field.id, rating)}
                        className={`w-8 h-8 rounded-full border-2 transition-colors ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-500 text-white' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {rating}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {field.type === 'signature' && (
            <div className="space-y-2">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <FileTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Signature pad would appear here</p>
                <p className="text-xs text-gray-400">Click to sign</p>
              </div>
            </div>
          )}

          {field.type === 'hidden' && (
            <Input
              type="hidden"
              value={String(formData[field.id] || field.default_value || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          )}
          
          {field.type === 'textarea' && (
            <Textarea
              placeholder={field.placeholder}
              value={String(formData[field.id] || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              rows={3}
            />
          )}
          
          {field.type === 'select' && (
            <Select
              value={String(formData[field.id] || '')}
              onValueChange={(value) => handleInputChange(field.id, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {field.type === 'checkbox' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`preview-${field.id}`}
                checked={Boolean(formData[field.id])}
                onChange={(e) => handleInputChange(field.id, e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor={`preview-${field.id}`}>{field.placeholder || 'Check this box'}</Label>
            </div>
          )}
          
          {field.type === 'radio' && (
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`preview-${field.id}-${index}`}
                    name={`preview-${field.id}`}
                    value={option}
                    checked={String(formData[field.id]) === option}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="border-gray-300"
                  />
                  <Label htmlFor={`preview-${field.id}-${index}`}>{option}</Label>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      
      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FileTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>Add fields to see the form preview</p>
        </div>
      )}
    </div>
  );
}

interface StepManagerProps {
  steps: FormStep[];
  onStepsChange: (steps: FormStep[]) => void;
  fields: FormField[];
  currentStep: number;
  onStepChange: (step: number) => void;
}

function StepManager({ steps, onStepsChange, fields, currentStep, onStepChange }: StepManagerProps) {
  const [newStepTitle, setNewStepTitle] = useState('');
  const [showAddStep, setShowAddStep] = useState(false);

  const addStep = () => {
    if (!newStepTitle.trim()) return;
    
    const newStep: FormStep = {
      id: `step-${Date.now()}`,
      title: newStepTitle,
      order: steps.length,
      fields: []
    };
    
    onStepsChange([...steps, newStep]);
    setNewStepTitle('');
    setShowAddStep(false);
  };

  const removeStep = (stepId: string) => {
    if (steps.length <= 1) return;
    
    const updatedSteps = steps.filter(step => step.id !== stepId);
    // Reorder remaining steps
    const reorderedSteps = updatedSteps.map((step, index) => ({ ...step, order: index }));
    onStepsChange(reorderedSteps);
    
    // Adjust current step if necessary
    if (currentStep >= reorderedSteps.length) {
      onStepChange(Math.max(0, reorderedSteps.length - 1));
    }
  };

  const updateStep = (stepId: string, updates: Partial<FormStep>) => {
    onStepsChange(steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const moveFieldToStep = (fieldId: string, stepId: string) => {
    // Remove field from all steps
    const updatedSteps = steps.map(step => ({
      ...step,
      fields: step.fields.filter(id => id !== fieldId)
    }));
    
    // Add field to target step
    const targetStepIndex = updatedSteps.findIndex(step => step.id === stepId);
    if (targetStepIndex !== -1) {
      updatedSteps[targetStepIndex].fields.push(fieldId);
    }
    
    onStepsChange(updatedSteps);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Form Steps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 mb-4">
          {steps.map((step, index) => (
            <Button
              key={step.id}
              variant={currentStep === index ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStepChange(index)}
              className="flex items-center gap-2"
            >
              <StepForward className="h-4 w-4" />
              Step {index + 1}: {step.title}
            </Button>
          ))}
          
          {showAddStep ? (
            <div className="flex gap-2">
              <Input
                value={newStepTitle}
                onChange={(e) => setNewStepTitle(e.target.value)}
                placeholder="Step title"
                className="w-32"
                onKeyPress={(e) => e.key === 'Enter' && addStep()}
              />
              <Button size="sm" onClick={addStep}>Add</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddStep(false)}>Cancel</Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddStep(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Step
            </Button>
          )}
        </div>

        {steps.length > 0 && (
          <div className="space-y-4">
            <div>
              <Label>Step {currentStep + 1} Title</Label>
              <Input
                value={steps[currentStep]?.title || ''}
                onChange={(e) => updateStep(steps[currentStep].id, { title: e.target.value })}
                placeholder="Enter step title"
              />
            </div>
            
            <div>
              <Label>Step {currentStep + 1} Description</Label>
              <Textarea
                value={steps[currentStep]?.description || ''}
                onChange={(e) => updateStep(steps[currentStep].id, { description: e.target.value })}
                placeholder="Enter step description (optional)"
                rows={2}
              />
            </div>

            {steps.length > 1 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeStep(steps[currentStep].id)}
              >
                Remove This Step
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FormBuilder({ 
  fields, 
  onFieldsChange, 
  showPreview = false, 
  isMultiStep = false, 
  steps = [], 
  onStepsChange,
  hideFieldTypes = false,
  hideHeader = false
}: FormBuilderProps) {
  const [previewMode, setPreviewMode] = useState(showPreview);
  const [currentStep, setCurrentStep] = useState(0);
  const [showStepManager, setShowStepManager] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over?.id);

      onFieldsChange(arrayMove(fields, oldIndex, newIndex));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const fieldType = e.dataTransfer.getData('fieldType');
    if (fieldType) {
      // Clear the global drag flag immediately to prevent click events
      (window as any).isDraggingField = false;
      addField(fieldType as FormField['type']);
    }
  };

  const addField = (type: FormField['type']) => {
    // Generate a more reliable unique ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const uniqueId = `field-${timestamp}-${random}`;
    
    const newField: FormField = {
      id: uniqueId,
      name: `field_${timestamp}`,
      type,
      label: `${fieldTypeLabels[type]} Field`,
      required: false,
      placeholder: '',
      step: isMultiStep ? currentStep : undefined,
    };

    if (type === 'select' || type === 'radio') {
      newField.options = ['Option 1', 'Option 2', 'Option 3'];
    }

    onFieldsChange([...fields, newField]);
    
    // If multi-step, add field to current step
    if (isMultiStep && steps.length > currentStep && onStepsChange) {
      const currentStepData = steps[currentStep];
      if (currentStepData) {
        onStepsChange(steps.map(step => 
          step.id === currentStepData.id 
            ? { ...step, fields: [...step.fields, newField.id] }
            : step
        ));
      }
    }
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    onFieldsChange(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removeField = (id: string) => {
    onFieldsChange(fields.filter(field => field.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header - can be hidden when parent provides its own */}
      {!hideHeader && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Form Builder</h3>
          <div className="flex gap-2">
            {isMultiStep && onStepsChange && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowStepManager(!showStepManager)}
              >
                <Layers className="mr-2 h-4 w-4" />
                {showStepManager ? 'Hide Steps' : 'Manage Steps'}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {previewMode ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>
        </div>
      )}

      {/* Step Manager */}
      {isMultiStep && showStepManager && onStepsChange && (
        <StepManager
          steps={steps}
          onStepsChange={onStepsChange}
          fields={fields}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
        />
      )}

      <div className={`grid gap-6 ${previewMode && !hideFieldTypes ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        <div className="space-y-6">
          {/* Field Types - can be hidden when parent provides its own */}
          {!hideFieldTypes && (
            <div>
              <h4 className="text-md font-medium mb-4">
                Add Field Types
                {isMultiStep && steps.length > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (Step {currentStep + 1}: {steps[currentStep]?.title})
                  </span>
                )}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(Object.keys(fieldTypeIcons) as FormField['type'][]).map((type) => (
                  <FieldTypeButton
                    key={type}
                    type={type}
                    onClick={() => addField(type)}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            {!hideFieldTypes && (
              <h4 className="text-md font-medium mb-4">
                Form Fields
                {isMultiStep && steps.length > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (Step {currentStep + 1})
                  </span>
                )}
              </h4>
            )}
            <div
              className={`relative transition-all duration-200 ${dragOver ? 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-50/30 rounded-lg' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {fields.length === 0 ? (
                <Card className={`${dragOver ? 'border-blue-400 bg-blue-50/50' : ''}`}>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileTextIcon className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No fields added yet</h3>
                    <p className="text-muted-foreground text-center">
                      {hideFieldTypes 
                        ? 'Drag and drop field types from the left panel or click to add them to your form'
                        : 'Drag and drop field types from above or click to add them to your form'
                      }
                    </p>
                    {dragOver && (
                      <p className="text-sm text-blue-600 mt-2 font-medium">
                        Drop to add field
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    {fields
                      .filter(field => !isMultiStep || steps.length === 0 || field.step === currentStep)
                      .map((field) => (
                        <SortableField
                          key={field.id}
                          field={field}
                          onUpdate={updateField}
                          onRemove={removeField}
                        />
                      ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>

        {previewMode && !hideFieldTypes && (
          <div className="lg:sticky lg:top-6">
            <Card>
              <CardContent className="p-6">
                <FormPreview fields={fields} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

