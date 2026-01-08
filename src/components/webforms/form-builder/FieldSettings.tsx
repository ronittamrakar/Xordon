import { useState } from 'react';
import { X, Trash2, ChevronDown, ChevronUp, Plus, GripVertical } from 'lucide-react';
import { FormField, FieldValidation } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface FieldSettingsProps {
  field: FormField | null;
  onUpdate: (fieldId: string | number, updates: Partial<FormField>) => void;
  onDelete?: (fieldId: string | number) => void;
  onHide?: () => void;
}

// Toggle component for consistent styling
const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

// Section header for grouping settings
const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
    {children}
  </div>
);

// Reusable toggle row
const ToggleRow = ({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }) => (
  <div className="flex items-center justify-between py-1">
    <div>
      <span className="text-sm">{label}</span>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);

export default function FieldSettings({ field, onUpdate, onDelete, onHide }: FieldSettingsProps) {
  const [activeTab, setActiveTab] = useState('general');

  if (!field) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Field Settings</h2>
          {onHide && (
            <button onClick={onHide} className="p-1 rounded hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👆</span>
            </div>
            <h3 className="font-medium mb-2">No field selected</h3>
            <p className="text-sm text-muted-foreground">
              Click on a field in the canvas to edit its settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const updateField = (updates: Partial<FormField>) => {
    onUpdate(field.id, updates);
  };

  const updateValidation = (key: string, value: any) => {
    updateField({ validation: { ...field.validation, [key]: value } });
  };

  const updateAppearance = (key: string, value: any) => {
    updateField({ appearance: { ...field.appearance, [key]: value } });
  };

  const renderGeneralSettings = () => (
    <div className="space-y-4">
      {/* Label */}
      <div className="space-y-2">
        <Label>Label</Label>
        <Input
          value={field.label || ''}
          onChange={(e) => updateField({ label: e.target.value })}
          placeholder="Field label"
        />
      </div>

      {/* Placeholder */}
      {!['heading', 'paragraph', 'divider', 'spacer', 'page_break', 'section'].includes(field.field_type) && (
        <div className="space-y-2">
          <Label>Placeholder</Label>
          <Input
            value={field.placeholder || ''}
            onChange={(e) => updateField({ placeholder: e.target.value })}
            placeholder="Placeholder text"
          />
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label>Help Text</Label>
        <Textarea
          value={field.description || ''}
          onChange={(e) => updateField({ description: e.target.value })}
          placeholder="Additional instructions for this field"
          rows={2}
        />
      </div>

      {/* Required Toggle */}
      {!['heading', 'paragraph', 'divider', 'spacer', 'page_break', 'section', 'explanation', 'image', 'video', 'audio', 'embed_pdf', 'custom_embed', 'social_share', 'html', 'auto_unique_id', 'recaptcha', 'turnstile'].includes(field.field_type) && (
        <div className="flex items-center justify-between">
          <Label>Required</Label>
          <Switch
            checked={field.required || false}
            onCheckedChange={(checked) => updateField({ required: checked })}
          />
        </div>
      )}
    </div>
  );

  const renderOptionsSettings = () => {
    const options = (field.options as string[]) || [];

    const addOption = () => {
      updateField({ options: [...options, `Option ${options.length + 1}`] });
    };

    const updateOption = (index: number, value: string) => {
      const newOptions = [...options];
      newOptions[index] = value;
      updateField({ options: newOptions });
    };

    const removeOption = (index: number) => {
      updateField({ options: options.filter((_, i) => i !== index) });
    };

    const moveOption = (index: number, direction: 'up' | 'down') => {
      const newOptions = [...options];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= options.length) return;
      [newOptions[index], newOptions[newIndex]] = [newOptions[newIndex], newOptions[index]];
      updateField({ options: newOptions });
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Options</Label>
          <Button variant="outline" size="sm" onClick={addOption}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveOption(index, 'up')}
                  disabled={index === 0}
                  className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => moveOption(index, 'down')}
                  disabled={index === options.length - 1}
                  className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => removeOption(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        {options.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No options yet. Click "Add" to create options.
          </p>
        )}
      </div>
    );
  };

  const renderTextSettings = () => (
    <div className="space-y-4">
      {field.field_type === 'text' && (
        <div className="space-y-2">
          <Label>Input Type</Label>
          <Select
            value={field.input_type || 'text'}
            onValueChange={(value) => updateField({ input_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="password">Password</SelectItem>
              <SelectItem value="search">Search</SelectItem>
              <SelectItem value="url">URL</SelectItem>
              <SelectItem value="tel">Telephone</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Min Length</Label>
          <Input
            type="number"
            value={field.min_length || ''}
            onChange={(e) => updateField({ min_length: parseInt(e.target.value) || undefined })}
            placeholder="0"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label>Max Length</Label>
          <Input
            type="number"
            value={field.max_length || ''}
            onChange={(e) => updateField({ max_length: parseInt(e.target.value) || undefined })}
            placeholder="No limit"
            min="1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Default Value</Label>
        <Input
          value={field.default_value || ''}
          onChange={(e) => updateField({ default_value: e.target.value })}
          placeholder="Default text"
        />
      </div>

      <div className="space-y-2">
        <Label>Input Mask</Label>
        <Input
          value={field.input_mask || ''}
          onChange={(e) => updateField({ input_mask: e.target.value })}
          placeholder="(999) 999-9999"
        />
        <p className="text-xs text-muted-foreground">9: numeric, a: alphabetical, *: alphanumeric</p>
      </div>

      <div className="space-y-2">
        <Label>Text Transform</Label>
        <Select
          value={field.text_transform || 'none'}
          onValueChange={(value) => updateField({ text_transform: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="uppercase">UPPERCASE</SelectItem>
            <SelectItem value="lowercase">lowercase</SelectItem>
            <SelectItem value="titlecase">Title Case</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderTextareaSettings = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Rows</Label>
          <Input
            type="number"
            value={field.rows || 4}
            onChange={(e) => updateField({ rows: parseInt(e.target.value) || 4 })}
            min="2"
            max="20"
          />
        </div>
        <div className="space-y-2">
          <Label>Max Length</Label>
          <Input
            type="number"
            value={field.max_length || ''}
            onChange={(e) => updateField({ max_length: parseInt(e.target.value) || undefined })}
            placeholder="No limit"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Default Value</Label>
        <Textarea
          value={field.default_value || ''}
          onChange={(e) => updateField({ default_value: e.target.value })}
          placeholder="Enter default value..."
          rows={3}
        />
      </div>
      <ToggleRow
        label="Resizable"
        checked={field.resizable !== false}
        onChange={(v) => updateField({ resizable: v })}
      />
      <ToggleRow
        label="Show Character Count"
        checked={field.show_char_count || false}
        onChange={(v) => updateField({ show_char_count: v })}
      />
      {field.field_type === 'rich_text' && (
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs uppercase text-muted-foreground">Editor Options</Label>
          <ToggleRow
            label="Enable Toolbar"
            checked={field.show_toolbar !== false}
            onChange={(v) => updateField({ show_toolbar: v })}
          />
          <ToggleRow
            label="Enable Media Upload"
            checked={field.allow_media || false}
            onChange={(v) => updateField({ allow_media: v })}
          />
        </div>
      )}
    </div>
  );

  // Email-specific settings
  const renderEmailSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">Validate email format</span>
        <Toggle checked={field.validation?.validate_format !== false} onChange={(v) => updateField({ validation: { ...field.validation, validate_format: v } })} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">Block disposable emails</span>
        <Toggle checked={field.validation?.block_disposable || false} onChange={(v) => updateField({ validation: { ...field.validation, block_disposable: v } })} />
      </div>
      <div className="space-y-2">
        <Label>Allowed Domains</Label>
        <Input
          value={field.validation?.allowed_domains?.join(', ') || ''}
          onChange={(e) => updateField({ validation: { ...field.validation, allowed_domains: e.target.value ? e.target.value.split(',').map(d => d.trim()).filter(d => d) : undefined } })}
          placeholder="gmail.com, outlook.com"
        />
        <p className="text-xs text-gray-500">Separate domains with commas</p>
      </div>
    </div>
  );

  // Number-specific settings
  const renderNumberSettings = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Minimum Value</Label>
          <Input type="number" value={field.validation?.min_value ?? ''} onChange={(e) => updateField({ validation: { ...field.validation, min_value: e.target.value ? parseFloat(e.target.value) : undefined } })} placeholder="No min" />
        </div>
        <div className="space-y-2">
          <Label>Maximum Value</Label>
          <Input type="number" value={field.validation?.max_value ?? ''} onChange={(e) => updateField({ validation: { ...field.validation, max_value: e.target.value ? parseFloat(e.target.value) : undefined } })} placeholder="No max" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Step Increment</Label>
        <Input type="number" step="any" value={field.validation?.step ?? ''} onChange={(e) => updateField({ validation: { ...field.validation, step: e.target.value ? parseFloat(e.target.value) : undefined } })} placeholder="Any" />
      </div>
      <div className="space-y-2">
        <Label>Number Format</Label>
        <Select value={field.number_format || 'decimal'} onValueChange={(v) => updateField({ number_format: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="decimal">Decimal (1,234.56)</SelectItem>
            <SelectItem value="integer">Integer (1,235)</SelectItem>
            <SelectItem value="currency">Currency ($1,234.56)</SelectItem>
            <SelectItem value="percentage">Percentage (123.46%)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">Show spin buttons</span>
        <Toggle checked={field.show_spinners || false} onChange={(v) => updateField({ show_spinners: v })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Prefix</Label>
          <Input value={field.prefix || ''} onChange={(e) => updateField({ prefix: e.target.value })} placeholder="$, €, £" />
        </div>
        <div className="space-y-2">
          <Label>Suffix</Label>
          <Input value={field.suffix || ''} onChange={(e) => updateField({ suffix: e.target.value })} placeholder="%, kg, lbs" />
        </div>
      </div>
    </div>
  );

  // Date-specific settings
  const renderDateSettings = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Earliest Date</Label>
          <Input type="date" value={field.validation?.min_date || ''} onChange={(e) => updateField({ validation: { ...field.validation, min_date: e.target.value } })} />
        </div>
        <div className="space-y-2">
          <Label>Latest Date</Label>
          <Input type="date" value={field.validation?.max_date || ''} onChange={(e) => updateField({ validation: { ...field.validation, max_date: e.target.value } })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Date Format</Label>
        <Select value={field.date_format || 'MM/DD/YYYY'} onValueChange={(v) => updateField({ date_format: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
            <SelectItem value="MMMM D, YYYY">MMMM D, YYYY</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">Show calendar picker</span>
        <Toggle checked={field.show_calendar !== false} onChange={(v) => updateField({ show_calendar: v })} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">Disable weekends</span>
        <Toggle checked={field.validation?.disable_weekends || false} onChange={(v) => updateField({ validation: { ...field.validation, disable_weekends: v } })} />
      </div>
      <div className="space-y-2">
        <Label>Disabled Days of Week</Label>
        <div className="flex flex-wrap gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <Button
              key={i}
              variant={field.validation?.disabled_days?.includes(i) ? 'default' : 'outline'}
              size="sm"
              className="h-8 w-10 p-0"
              onClick={() => {
                const current = field.validation?.disabled_days || [];
                const next = current.includes(i) ? current.filter(d => d !== i) : [...current, i];
                updateField({ validation: { ...field.validation, disabled_days: next } });
              }}
            >
              {day[0]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  // Rating-specific settings
  const renderRatingSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Number of Items</Label>
        <Input type="number" value={field.max_stars || 5} onChange={(e) => updateField({ max_stars: parseInt(e.target.value) || 5 })} min="1" max="11" />
        {field.field_type === 'nps' && <p className="text-[12px] text-muted-foreground">Standard NPS uses 11 items (0-10).</p>}
      </div>
      <div className="space-y-2">
        <Label>Rating Style</Label>
        <Select value={field.star_style || 'star'} onValueChange={(v) => updateField({ star_style: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="star">Stars ⭐</SelectItem>
            <SelectItem value="heart">Hearts ❤️</SelectItem>
            <SelectItem value="thumb">Thumbs 👍</SelectItem>
            <SelectItem value="number">Numbers</SelectItem>
            <SelectItem value="emoji">Emoji Faces</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {field.star_style === 'emoji' && (
        <div className="space-y-2">
          <Label>Emoji Set</Label>
          <Select value={field.emoji_set || 'smileys'} onValueChange={(v) => updateField({ emoji_set: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="smileys">Smileys</SelectItem>
              <SelectItem value="hearts">Hearts</SelectItem>
              <SelectItem value="thumbs">Thumbs</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {(field.star_style === 'emoji' || field.star_style === 'thumb') && (
        <div className="space-y-2">
          <Label>Size</Label>
          <Select value={field.emoji_size || field.thumb_size || 'medium'} onValueChange={(v) => updateField({ [field.star_style === 'emoji' ? 'emoji_size' : 'thumb_size']: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
              <SelectItem value="extra-large">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">Allow half ratings</span>
        <Toggle checked={field.allow_half_ratings || false} onChange={(v) => updateField({ allow_half_ratings: v })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Low Label</Label>
          <Input value={field.rating_labels?.low || ''} onChange={(e) => updateField({ rating_labels: { ...field.rating_labels, low: e.target.value } })} placeholder="Poor" />
        </div>
        <div className="space-y-2">
          <Label>High Label</Label>
          <Input value={field.rating_labels?.high || ''} onChange={(e) => updateField({ rating_labels: { ...field.rating_labels, high: e.target.value } })} placeholder="Excellent" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Active Color</Label>
          <Input type="color" value={field.rating_colors?.active || '#fbbf24'} onChange={(e) => updateField({ rating_colors: { ...field.rating_colors, active: e.target.value } })} className="h-10" />
        </div>
        <div className="space-y-2">
          <Label>Inactive Color</Label>
          <Input type="color" value={field.rating_colors?.inactive || '#e5e7eb'} onChange={(e) => updateField({ rating_colors: { ...field.rating_colors, inactive: e.target.value } })} className="h-10" />
        </div>
      </div>
    </div>
  );

  // Slider/Scale settings
  const renderSliderSettings = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Minimum</Label>
          <Input type="number" value={field.slider_min ?? 0} onChange={(e) => updateField({ slider_min: parseInt(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Maximum</Label>
          <Input type="number" value={field.slider_max ?? 100} onChange={(e) => updateField({ slider_max: parseInt(e.target.value) })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Step</Label>
        <Input type="number" value={field.slider_step ?? 1} onChange={(e) => updateField({ slider_step: parseInt(e.target.value) || 1 })} min="1" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">Show labels</span>
        <Toggle checked={field.slider_labels || false} onChange={(v) => updateField({ slider_labels: v })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Low Label</Label>
          <Input value={field.scale_low_label || ''} onChange={(e) => updateField({ scale_low_label: e.target.value })} placeholder="Low" />
        </div>
        <div className="space-y-2">
          <Label>High Label</Label>
          <Input value={field.scale_high_label || ''} onChange={(e) => updateField({ scale_high_label: e.target.value })} placeholder="High" />
        </div>
      </div>
    </div>
  );

  // Likert settings
  const renderLikertSettings = () => {
    const labels = field.likert_labels || [];
    const statements = field.likert_statements || [];

    const updateLabels = (index: number, value: string) => {
      const newLabels = [...labels];
      newLabels[index] = value;
      updateField({ likert_labels: newLabels });
    };

    const updateStatements = (index: number, value: string) => {
      const newStatements = [...statements];
      newStatements[index] = value;
      updateField({ likert_statements: newStatements });
    };

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Scale Type</Label>
          <Select value={field.likert_scale || '5-point'} onValueChange={(v) => updateField({ likert_scale: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3-point">3-point</SelectItem>
              <SelectItem value="5-point">5-point</SelectItem>
              <SelectItem value="7-point">7-point</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <SettingSection title="Scale Labels">
          <div className="space-y-2">
            {labels.map((label, i) => (
              <Input key={i} value={label} onChange={(e) => updateLabels(i, e.target.value)} placeholder={`Label ${i + 1}`} />
            ))}
            {field.likert_scale === 'custom' && (
              <Button variant="outline" size="sm" onClick={() => updateField({ likert_labels: [...labels, `Label ${labels.length + 1}`] })}>
                <Plus className="h-3 w-3 mr-1" /> Add Label
              </Button>
            )}
          </div>
        </SettingSection>

        <SettingSection title="Statements">
          <div className="space-y-2">
            {statements.map((statement, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={statement} onChange={(e) => updateStatements(i, e.target.value)} placeholder={`Statement ${i + 1}`} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateField({ likert_statements: statements.filter((_, idx) => idx !== i) })}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => updateField({ likert_statements: [...statements, `Statement ${statements.length + 1}`] })}>
              <Plus className="h-3 w-3 mr-1" /> Add Statement
            </Button>
          </div>
        </SettingSection>
      </div>
    );
  };

  // File upload settings
  const renderFileSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Max File Size (MB)</Label>
        <Input type="number" value={field.max_file_size || 10} onChange={(e) => updateField({ max_file_size: parseInt(e.target.value) || 10 })} min="1" />
      </div>
      <div className="space-y-2">
        <Label>Allowed File Types</Label>
        <Input value={field.allowed_formats?.join(', ') || ''} onChange={(e) => updateField({ allowed_formats: e.target.value ? e.target.value.split(',').map(f => f.trim()) : undefined })} placeholder=".pdf, .doc, .jpg" />
        <p className="text-xs text-gray-500">Separate extensions with commas</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">Show preview</span>
        <Toggle checked={field.show_preview !== false} onChange={(v) => updateField({ show_preview: v })} />
      </div>
      <div className="space-y-2">
        <Label>Max Files</Label>
        <Input type="number" value={field.validation?.max_files || 1} onChange={(e) => updateField({ validation: { ...field.validation, max_files: parseInt(e.target.value) || 1 } })} min="1" />
      </div>
    </div>
  );

  // Yes/No settings
  const renderYesNoSettings = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Yes Label</Label>
          <Input value={field.yes_label || 'Yes'} onChange={(e) => updateField({ yes_label: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>No Label</Label>
          <Input value={field.no_label || 'No'} onChange={(e) => updateField({ no_label: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Display Style</Label>
        <Select value={field.display_style || 'buttons'} onValueChange={(v) => updateField({ display_style: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="buttons">Buttons</SelectItem>
            <SelectItem value="toggle">Toggle Switch</SelectItem>
            <SelectItem value="dropdown">Dropdown</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Layout/Heading/Paragraph settings
  const renderLayoutSettings = () => {
    if (field.field_type === 'heading') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Heading Text</Label>
            <Input value={field.heading_text || field.label} onChange={(e) => updateField({ heading_text: e.target.value, label: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Heading Level</Label>
            <Select value={String(field.heading_level || 2)} onValueChange={(v) => updateField({ heading_level: parseInt(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">H1 - Largest</SelectItem>
                <SelectItem value="2">H2 - Large</SelectItem>
                <SelectItem value="3">H3 - Medium</SelectItem>
                <SelectItem value="4">H4 - Small</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }
    if (field.field_type === 'paragraph' || field.field_type === 'explanation') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{field.field_type === 'explanation' ? 'Explanation Text' : 'Paragraph Text'}</Label>
            <Textarea value={field.paragraph_text || field.label} onChange={(e) => updateField({ paragraph_text: e.target.value, label: e.target.value })} rows={4} />
          </div>
          {field.field_type === 'explanation' && (
            <div className="space-y-2">
              <Label>Icon (Optional)</Label>
              <Input value={field.icon || ''} onChange={(e) => updateField({ icon: e.target.value })} placeholder="info, alert, help" />
            </div>
          )}
        </div>
      );
    }
    if (field.field_type === 'divider') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Divider Style</Label>
            <Select value={field.divider_style || 'solid'} onValueChange={(v) => updateField({ divider_style: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Thickness (px)</Label>
            <Input type="number" value={field.thickness || 1} onChange={(e) => updateField({ thickness: parseInt(e.target.value) || 1 })} min="1" max="10" />
          </div>
        </div>
      );
    }
    if (field.field_type === 'spacer') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Height (px)</Label>
            <Input type="number" value={field.spacer_height || 20} onChange={(e) => updateField({ spacer_height: parseInt(e.target.value) || 20 })} min="10" max="200" />
          </div>
        </div>
      );
    }
    if (field.field_type === 'section') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Section Title</Label>
            <Input value={field.section_title || field.label} onChange={(e) => updateField({ section_title: e.target.value, label: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Section Description</Label>
            <Textarea value={field.section_description || ''} onChange={(e) => updateField({ section_description: e.target.value })} rows={2} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Collapsible</span>
            <Toggle checked={field.collapsible || false} onChange={(v) => updateField({ collapsible: v })} />
          </div>
        </div>
      );
    }
    if (field.field_type === 'page_break') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Page Title</Label>
            <Input value={field.label || ''} onChange={(e) => updateField({ label: e.target.value })} placeholder="e.g. Personal Information" />
          </div>
          <div className="space-y-2">
            <Label>Next Button Label</Label>
            <Input value={field.next_label || 'Next Page'} onChange={(e) => updateField({ next_label: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Back Button Label</Label>
            <Input value={field.back_label || 'Previous Page'} onChange={(e) => updateField({ back_label: e.target.value })} />
          </div>
        </div>
      );
    }
    if (field.field_type === 'field_group' || field.field_type === 'repeater_group') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{field.field_type === 'repeater_group' ? 'Group Label' : 'Group Title'}</Label>
            <Input value={field.label || ''} onChange={(e) => updateField({ label: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={field.description || ''} onChange={(e) => updateField({ description: e.target.value })} rows={2} />
          </div>
          {field.field_type === 'repeater_group' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Min Repeats</Label>
                <Input type="number" value={field.validation?.min_repeats || 1} onChange={(e) => updateValidation('min_repeats', parseInt(e.target.value) || 1)} min="1" />
              </div>
              <div className="space-y-2">
                <Label>Max Repeats</Label>
                <Input type="number" value={field.validation?.max_repeats || 10} onChange={(e) => updateValidation('max_repeats', parseInt(e.target.value) || 10)} min="1" />
              </div>
            </div>
          )}
        </div>
      );
    }
    if (['cover', 'welcome_page', 'ending'].includes(field.field_type)) {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input value={field.heading_text || ''} onChange={(e) => updateField({ heading_text: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Content Text</Label>
            <Textarea value={field.paragraph_text || ''} onChange={(e) => updateField({ paragraph_text: e.target.value })} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Button Text</Label>
            <Input value={field.button_text || ''} onChange={(e) => updateField({ button_text: e.target.value })} />
          </div>
          {field.field_type === 'ending' && (
            <div className="space-y-2">
              <Label>Redirect URL (Optional)</Label>
              <Input value={field.redirect_url || ''} onChange={(e) => updateField({ redirect_url: e.target.value })} placeholder="https://..." />
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Phone settings
  const renderPhoneSettings = () => (
    <div className="space-y-4">
      {renderTextSettings()}
      <SettingSection title="Phone Options">
        <div className="space-y-2">
          <Label>Phone Format</Label>
          <Select value={field.phone_format || 'national'} onValueChange={(v) => updateField({ phone_format: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="national">National (123) 456-7890</SelectItem>
              <SelectItem value="international">International +1 123 456 7890</SelectItem>
              <SelectItem value="e164">E.164 +11234567890</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Default Country</Label>
          <Select value={field.default_country || 'US'} onValueChange={(v) => updateField({ default_country: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States (+1)</SelectItem>
              <SelectItem value="GB">United Kingdom (+44)</SelectItem>
              <SelectItem value="CA">Canada (+1)</SelectItem>
              <SelectItem value="AU">Australia (+61)</SelectItem>
              <SelectItem value="IN">India (+91)</SelectItem>
              <SelectItem value="NP">Nepal (+977)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SettingSection>
    </div>
  );

  // Time settings
  const renderTimeSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Time Format</Label>
        <Select value={field.time_format || '12h'} onValueChange={(v) => updateField({ time_format: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="12h">12 Hour (1:30 PM)</SelectItem>
            <SelectItem value="24h">24 Hour (13:30)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Time Interval (minutes)</Label>
        <Select value={String(field.time_interval || 30)} onValueChange={(v) => updateField({ time_interval: parseInt(v) })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 minutes</SelectItem>
            <SelectItem value="15">15 minutes</SelectItem>
            <SelectItem value="30">30 minutes</SelectItem>
            <SelectItem value="60">1 hour</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Choice field additional settings
  const renderChoiceSettings = () => (
    <div className="space-y-4">
      {renderOptionsSettings()}
      <SettingSection title="Display Options">
        <div className="space-y-2">
          <Label>Layout</Label>
          <Select value={field.layout || 'vertical'} onValueChange={(v) => updateField({ layout: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vertical">Vertical</SelectItem>
              <SelectItem value="horizontal">Horizontal</SelectItem>
              <SelectItem value="grid">Grid (2 columns)</SelectItem>
              <SelectItem value="grid-3">Grid (3 columns)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ToggleRow label="Allow Search" checked={field.allow_search || false} onChange={(v) => updateField({ allow_search: v })} />
        <ToggleRow label="Allow 'Other' Option" checked={field.allow_other || false} onChange={(v) => updateField({ allow_other: v })} />
        {field.allow_other && (
          <div className="space-y-2 pl-4">
            <Label>Other Placeholder</Label>
            <Input value={field.other_placeholder || 'Please specify...'} onChange={(e) => updateField({ other_placeholder: e.target.value })} />
          </div>
        )}
        <ToggleRow label="Randomize Options" checked={field.randomize_options || false} onChange={(v) => updateField({ randomize_options: v })} />

        {field.field_type === 'picture_choice' && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Columns</Label>
              <Select value={String(field.picture_columns || 3)} onValueChange={(v) => updateField({ picture_columns: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Column</SelectItem>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                  <SelectItem value="5">5 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Image Fit</Label>
              <Select value={field.image_fit || 'cover'} onValueChange={(v) => updateField({ image_fit: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover (Fill)</SelectItem>
                  <SelectItem value="contain">Contain (Fit)</SelectItem>
                  <SelectItem value="none">Original</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </SettingSection>
      {['multiselect', 'checkbox'].includes(field.field_type) && (
        <SettingSection title="Selection Limits">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Min Selections</Label>
              <Input type="number" value={field.validation?.min_selections || ''} onChange={(e) => updateValidation('min_selections', parseInt(e.target.value) || undefined)} min="0" />
            </div>
            <div className="space-y-2">
              <Label>Max Selections</Label>
              <Input type="number" value={field.validation?.max_selections || ''} onChange={(e) => updateValidation('max_selections', parseInt(e.target.value) || undefined)} min="1" />
            </div>
          </div>
        </SettingSection>
      )}
    </div>
  );

  // Signature settings
  const renderSignatureSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Pen Color</Label>
        <Input type="color" value={field.pen_color || '#000000'} onChange={(e) => updateField({ pen_color: e.target.value })} className="h-10" />
      </div>
      <div className="space-y-2">
        <Label>Pen Width</Label>
        <Select value={String(field.pen_width || 2)} onValueChange={(v) => updateField({ pen_width: parseInt(v) })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Thin</SelectItem>
            <SelectItem value="2">Medium</SelectItem>
            <SelectItem value="3">Thick</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ToggleRow label="Show Clear Button" checked={field.show_clear !== false} onChange={(v) => updateField({ show_clear: v })} />
    </div>
  );

  // Location settings
  const renderLocationSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Location Type</Label>
        <Select value={field.location_type || 'address'} onValueChange={(v) => updateField({ location_type: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="address">Address Input</SelectItem>
            <SelectItem value="coordinates">GPS Coordinates</SelectItem>
            <SelectItem value="map">Map Picker</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {field.location_type === 'address' && (
        <div className="space-y-2">
          <Label>Address Format</Label>
          <Select value={field.address_format || 'full'} onValueChange={(v) => updateField({ address_format: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="street">Street Only</SelectItem>
              <SelectItem value="street_city">Street + City</SelectItem>
              <SelectItem value="full">Full Address</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  // Compliance field settings
  const renderComplianceSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Consent Text</Label>
        <Textarea value={field.consent_text || field.gdpr_text || field.tcpa_text || ''} onChange={(e) => updateField({ consent_text: e.target.value })} rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Link URL</Label>
        <Input value={field.terms_link || field.privacy_policy_link || ''} onChange={(e) => updateField({ terms_link: e.target.value })} placeholder="https://..." />
      </div>
      <div className="space-y-2">
        <Label>Display Style</Label>
        <Select value={field.consent_style || 'checkbox'} onValueChange={(v) => updateField({ consent_style: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="checkbox">Checkbox</SelectItem>
            <SelectItem value="toggle">Toggle Switch</SelectItem>
            <SelectItem value="button">Accept Button</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ToggleRow label="Pre-checked" checked={field.prechecked || false} onChange={(v) => updateField({ prechecked: v })} />
    </div>
  );

  // HTML block settings
  const renderHTMLSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>HTML Content</Label>
        <Textarea value={field.html_content || ''} onChange={(e) => updateField({ html_content: e.target.value })} rows={6} className="font-mono text-xs" />
      </div>
    </div>
  );

  // Calendly settings
  const renderCalendlySettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Calendly URL</Label>
        <Input value={field.calendly_url || ''} onChange={(e) => updateField({ calendly_url: e.target.value })} placeholder="https://calendly.com/your-link" />
      </div>
      <div className="space-y-2">
        <Label>Event Type (Optional)</Label>
        <Input value={field.event_type || ''} onChange={(e) => updateField({ event_type: e.target.value })} placeholder="e.g. 30min" />
      </div>
      <div className="space-y-2">
        <Label>Display Mode</Label>
        <Select value={field.display_mode || 'inline'} onValueChange={(v) => updateField({ display_mode: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="inline">Inline</SelectItem>
            <SelectItem value="popup">Popup</SelectItem>
            <SelectItem value="button">Button</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Button Text</Label>
        <Input value={field.button_text || 'Schedule Meeting'} onChange={(e) => updateField({ button_text: e.target.value })} />
      </div>
    </div>
  );

  // Column layout settings
  const renderColumnLayoutSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Column Spacing</Label>
        <Select value={field.column_spacing || 'medium'} onValueChange={(v) => updateField({ column_spacing: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Vertical Alignment</Label>
        <Select value={field.column_alignment || 'top'} onValueChange={(v) => updateField({ column_alignment: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="middle">Middle</SelectItem>
            <SelectItem value="bottom">Bottom</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Full name settings
  const renderFullNameSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Name Format</Label>
        <Select value={field.name_format || 'first_last'} onValueChange={(v) => updateField({ name_format: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="first_last">First + Last</SelectItem>
            <SelectItem value="first_middle_last">First + Middle + Last</SelectItem>
            <SelectItem value="title_first_last">Title + First + Last</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ToggleRow label="Include Title" checked={field.include_title || false} onChange={(v) => updateField({ include_title: v })} />
      <ToggleRow label="Include Middle Name" checked={field.include_middle || false} onChange={(v) => updateField({ include_middle: v })} />
    </div>
  );

  // Address settings
  const renderAddressSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Address Format</Label>
        <Select value={field.address_format || 'full'} onValueChange={(v) => updateField({ address_format: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="street">Street Only</SelectItem>
            <SelectItem value="street_city">Street + City</SelectItem>
            <SelectItem value="full">Full Address</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ToggleRow label="Include Country" checked={field.include_country !== false} onChange={(v) => updateField({ include_country: v })} />
    </div>
  );

  // Media display settings
  const renderMediaSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Media URL</Label>
        <Input value={field.media_url || ''} onChange={(e) => updateField({ media_url: e.target.value })} placeholder="https://..." />
      </div>
      {field.field_type === 'image' && (
        <>
          <div className="space-y-2">
            <Label>Alt Text</Label>
            <Input value={field.alt_text || ''} onChange={(e) => updateField({ alt_text: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Alignment</Label>
            <Select value={field.media_align || 'center'} onValueChange={(v) => updateField({ media_align: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Width (%)</Label>
            <Input type="number" value={field.media_width || 100} onChange={(e) => updateField({ media_width: parseInt(e.target.value) || 100 })} min="10" max="100" />
          </div>
        </>
      )}
      {['video', 'audio'].includes(field.field_type) && (
        <>
          <ToggleRow label="Autoplay" checked={field.autoplay || false} onChange={(v) => updateField({ autoplay: v })} />
          <ToggleRow label="Loop" checked={field.loop || false} onChange={(v) => updateField({ loop: v })} />
          <ToggleRow label="Muted" checked={field.muted || false} onChange={(v) => updateField({ muted: v })} />
          <ToggleRow label="Show Controls" checked={field.show_controls !== false} onChange={(v) => updateField({ show_controls: v })} />
        </>
      )}
    </div>
  );

  // Payment field settings
  const renderPaymentSettings = () => (
    <div className="space-y-4">
      {field.field_type === 'product_basket' && (
        <>
          <div className="space-y-2">
            <Label>Products</Label>
            <p className="text-xs text-muted-foreground">Configure products in the Options tab</p>
          </div>
        </>
      )}
      {['stripe', 'paypal'].includes(field.field_type) && (
        <>
          <div className="space-y-2">
            <Label>Payment Mode</Label>
            <Select value={field.display_mode || 'inline'} onValueChange={(v) => updateField({ display_mode: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="inline">Inline</SelectItem>
                <SelectItem value="popup">Popup</SelectItem>
                <SelectItem value="button">Button</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Button Text</Label>
            <Input value={field.button_text || 'Pay Now'} onChange={(e) => updateField({ button_text: e.target.value })} />
          </div>
        </>
      )}
    </div>
  );

  // Matrix field settings
  const renderMatrixSettings = () => {
    const rows = (field.matrix_rows as string[]) || [];
    const cols = (field.matrix_cols as string[]) || [];

    const addRow = () => {
      updateField({ matrix_rows: [...rows, `Row ${rows.length + 1}`] });
    };

    const updateRow = (index: number, value: string) => {
      const newRows = [...rows];
      newRows[index] = value;
      updateField({ matrix_rows: newRows });
    };

    const removeRow = (index: number) => {
      updateField({ matrix_rows: rows.filter((_, i) => i !== index) });
    };

    const addCol = () => {
      updateField({ matrix_cols: [...cols, `Column ${cols.length + 1}`] });
    };

    const updateCol = (index: number, value: string) => {
      const newCols = [...cols];
      newCols[index] = value;
      updateField({ matrix_cols: newCols });
    };

    const removeCol = (index: number) => {
      updateField({ matrix_cols: cols.filter((_, i) => i !== index) });
    };

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Input Type</Label>
          <Select value={field.matrix_input_type || 'radio'} onValueChange={(v) => updateField({ matrix_input_type: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="radio">Single Choice</SelectItem>
              <SelectItem value="checkbox">Multiple Choice</SelectItem>
              <SelectItem value="dropdown">Dropdown</SelectItem>
              <SelectItem value="text">Text Input</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Layout</Label>
          <Select value={field.matrix_layout || 'vertical'} onValueChange={(v) => updateField({ matrix_layout: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vertical">Vertical</SelectItem>
              <SelectItem value="horizontal">Horizontal</SelectItem>
              <SelectItem value="compact">Compact</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <SettingSection title="Rows">
          <div className="flex items-center justify-between mb-2">
            <Label>Row Labels</Label>
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {rows.map((row, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={row} onChange={(e) => updateRow(index, e.target.value)} className="flex-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeRow(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </SettingSection>

        <SettingSection title="Columns">
          <div className="flex items-center justify-between mb-2">
            <Label>Column Labels</Label>
            <Button variant="outline" size="sm" onClick={addCol}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {cols.map((col, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={col} onChange={(e) => updateCol(index, e.target.value)} className="flex-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeCol(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </SettingSection>
      </div>
    );
  };

  // Ranking field settings
  const renderRankingSettings = () => {
    const items = (field.ranking_items as string[]) || [];

    const addItem = () => {
      updateField({ ranking_items: [...items, `Item ${items.length + 1}`] });
    };

    const updateItem = (index: number, value: string) => {
      const newItems = [...items];
      newItems[index] = value;
      updateField({ ranking_items: newItems });
    };

    const removeItem = (index: number) => {
      updateField({ ranking_items: items.filter((_, i) => i !== index) });
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Items to Rank</Label>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input value={item} onChange={(e) => updateItem(index, e.target.value)} className="flex-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Label>Maximum Rank</Label>
          <Input type="number" value={field.max_rank || items.length} onChange={(e) => updateField({ max_rank: parseInt(e.target.value) || items.length })} min="1" />
        </div>
        <ToggleRow label="Allow Ties" checked={field.allow_ties || false} onChange={(v) => updateField({ allow_ties: v })} />
      </div>
    );
  };

  // Picture choice settings
  const renderPictureChoiceSettings = () => {
    const pictureOptions = (field.picture_options as Array<{ label: string; value?: string; image_url?: string }>) || [];

    const addOption = () => {
      updateField({
        picture_options: [...pictureOptions, { label: `Option ${pictureOptions.length + 1}`, value: `option${pictureOptions.length + 1}`, image_url: '' }]
      });
    };

    const updateOption = (index: number, updates: Partial<{ label: string; value: string; image_url: string }>) => {
      const newOptions = [...pictureOptions];
      newOptions[index] = { ...newOptions[index], ...updates };
      updateField({ picture_options: newOptions });
    };

    const removeOption = (index: number) => {
      updateField({ picture_options: pictureOptions.filter((_, i) => i !== index) });
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Picture Options</Label>
          <Button variant="outline" size="sm" onClick={addOption}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-3">
          {pictureOptions.map((option, index) => (
            <div key={index} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Option {index + 1}</Label>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeOption(index)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Input value={option.label} onChange={(e) => updateOption(index, { label: e.target.value })} placeholder="Label" />
              <Input value={option.image_url || ''} onChange={(e) => updateOption(index, { image_url: e.target.value })} placeholder="Image URL" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Label>Columns</Label>
          <Select value={String(field.picture_columns || 3)} onValueChange={(v) => updateField({ picture_columns: parseInt(v) })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Columns</SelectItem>
              <SelectItem value="3">3 Columns</SelectItem>
              <SelectItem value="4">4 Columns</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Image Fit</Label>
          <Select value={field.image_fit || 'cover'} onValueChange={(v) => updateField({ image_fit: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">Cover</SelectItem>
              <SelectItem value="contain">Contain</SelectItem>
              <SelectItem value="fill">Fill</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  // Advanced field settings (OpenAI, API Action, Formula)
  const renderAdvancedSettings = () => {
    if (field.field_type === 'openai') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>AI Prompt</Label>
            <Textarea value={field.formula || ''} onChange={(e) => updateField({ formula: e.target.value })} rows={4} placeholder="Enter prompt for AI generation..." />
          </div>
          <ToggleRow label="Auto-generate on load" checked={field.autoplay || false} onChange={(v) => updateField({ autoplay: v })} />
        </div>
      );
    }

    if (field.field_type === 'api_action') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>API Endpoint URL</Label>
            <Input value={field.media_url || ''} onChange={(e) => updateField({ media_url: e.target.value })} placeholder="https://api.example.com/endpoint" />
          </div>
          <div className="space-y-2">
            <Label>HTTP Method</Label>
            <Select value={field.display_mode || 'GET'} onValueChange={(v) => updateField({ display_mode: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Request Headers (JSON)</Label>
            <Textarea value={field.html_content || ''} onChange={(e) => updateField({ html_content: e.target.value })} rows={3} placeholder='{"Authorization": "Bearer token"}' className="font-mono text-xs" />
          </div>
        </div>
      );
    }

    if (field.field_type === 'formula' || field.field_type === 'calculated') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Calculation Type</Label>
            <Select value={field.calculation_type || 'sum'} onValueChange={(v) => updateField({ calculation_type: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sum">Sum</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="count">Count</SelectItem>
                <SelectItem value="min">Minimum</SelectItem>
                <SelectItem value="max">Maximum</SelectItem>
                <SelectItem value="custom">Custom Formula</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {field.calculation_type === 'custom' && (
            <div className="space-y-2">
              <Label>Formula</Label>
              <Textarea value={field.formula || ''} onChange={(e) => updateField({ formula: e.target.value })} rows={3} placeholder="e.g., {field1} * {field2} / 100" className="font-mono text-xs" />
            </div>
          )}
          <div className="space-y-2">
            <Label>Calculation Fields</Label>
            <p className="text-xs text-muted-foreground">Select fields to include in calculation</p>
          </div>
        </div>
      );
    }

    if (field.field_type === 'discount_code') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Code Format</Label>
            <Select value={field.text_transform || 'uppercase'} onValueChange={(v) => updateField({ text_transform: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="uppercase">UPPERCASE</SelectItem>
                <SelectItem value="lowercase">lowercase</SelectItem>
                <SelectItem value="none">As entered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ToggleRow label="Validate code" checked={field.validation?.validate_format || false} onChange={(v) => updateValidation('validate_format', v)} />
        </div>
      );
    }

    if (field.field_type === 'auto_unique_id') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>ID Prefix</Label>
            <Input value={field.prefix || ''} onChange={(e) => updateField({ prefix: e.target.value })} placeholder="e.g. FORM-" />
          </div>
          <div className="space-y-2">
            <Label>Start Counter</Label>
            <Input type="number" value={field.slider_min || 1} onChange={(e) => updateField({ slider_min: parseInt(e.target.value) || 1 })} min="1" />
          </div>
          <div className="space-y-2">
            <Label>ID Suffix</Label>
            <Input value={field.suffix || ''} onChange={(e) => updateField({ suffix: e.target.value })} placeholder="e.g. -2024" />
          </div>
          <ToggleRow label="Show to user" checked={field.hidden === false} onChange={(v) => updateField({ hidden: !v })} />
        </div>
      );
    }

    return null;
  };

  // Spam protection settings
  const renderSpamSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Site Key</Label>
        <Input
          value={field.site_key || ''}
          onChange={(e) => updateField({ site_key: e.target.value })}
          placeholder="Enter your site key"
        />
      </div>
      <div className="space-y-2">
        <Label>Secret Key (Optional)</Label>
        <Input
          value={field.secret_key || ''}
          onChange={(e) => updateField({ secret_key: e.target.value })}
          placeholder="Enter your secret key"
          type="password"
        />
        <p className="text-xs text-muted-foreground">Secret key is usually managed in global settings.</p>
      </div>
      {field.field_type === 'recaptcha' && (
        <div className="space-y-2">
          <Label>Theme</Label>
          <Select value={field.theme || 'light'} onValueChange={(v) => updateField({ theme: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  const renderFieldTypeSettings = () => {
    switch (field.field_type) {
      case 'text':
      case 'url':
      case 'password':
      case 'masked_text':
        return renderTextSettings();
      case 'phone':
        return renderPhoneSettings();
      case 'email':
        return <>{renderTextSettings()}{renderEmailSettings()}</>;
      case 'number':
      case 'price':
        return <>{renderTextSettings()}{renderNumberSettings()}</>;
      case 'textarea':
      case 'rich_text':
        return renderTextareaSettings();
      case 'select':
      case 'multiselect':
      case 'radio':
      case 'checkbox':
      case 'dropdown':
      case 'number_dropdown':
        return renderChoiceSettings();
      case 'picture_choice':
        return renderPictureChoiceSettings();
      case 'date':
      case 'datetime':
        return renderDateSettings();
      case 'time':
        return renderTimeSettings();
      case 'rating':
      case 'star_rating':
      case 'nps':
      case 'like_dislike':
        return renderRatingSettings();
      case 'slider':
      case 'scale':
        return renderSliderSettings();
      case 'likert':
        return renderLikertSettings();
      case 'ranking':
        return renderRankingSettings();
      case 'file':
      case 'image_upload':
      case 'drawing':
        return renderFileSettings();
      case 'yes_no':
        return renderYesNoSettings();
      case 'heading':
      case 'paragraph':
      case 'explanation':
      case 'divider':
      case 'spacer':
      case 'section':
      case 'page_break':
      case 'field_group':
        return renderLayoutSettings();
      case 'signature':
        return renderSignatureSettings();
      case 'location':
      case 'google_maps':
        return renderLocationSettings();
      case 'legal_consent':
      case 'terms_of_service':
      case 'gdpr_agreement':
      case 'tcpa_consent':
        return renderComplianceSettings();
      case 'html':
        return renderHTMLSettings();
      case 'calendly':
        return renderCalendlySettings();
      case 'layout_2col':
      case 'layout_3col':
      case 'layout_4col':
      case 'repeater_group':
        return renderColumnLayoutSettings();
      case 'fullname':
      case 'full_name':
      case 'firstname':
      case 'lastname':
        return renderFullNameSettings();
      case 'address':
        return renderAddressSettings();
      case 'image':
      case 'video':
      case 'audio':
      case 'embed_pdf':
      case 'custom_embed':
        return renderMediaSettings();
      case 'scheduler':
        return renderDateSettings(); // For now, can enhance later
      case 'timer':
        return renderSliderSettings();
      case 'formula':
      case 'calculated':
      case 'discount_code':
      case 'openai':
      case 'api_action':
        return renderAdvancedSettings();
      case 'product_basket':
        return <>{renderChoiceSettings()}{renderPaymentSettings()}</>;
      case 'stripe':
      case 'paypal':
        return renderPaymentSettings();
      case 'recaptcha':
      case 'turnstile':
        return renderSpamSettings();
      case 'cover':
      case 'welcome_page':
      case 'ending':
        return renderLayoutSettings();
      case 'social_share':
        return renderChoiceSettings(); // Uses options for platforms
      case 'auto_unique_id':
        return renderTextSettings(); // Uses text settings for prefix/format
      case 'company':
      case 'jobtitle':
      case 'service_area':
      case 'store_finder':
        return renderTextSettings();
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
        return renderChoiceSettings();
      case 'operating_hours':
      case 'regional_contact':
      case 'franchise_id':
        return renderLayoutSettings(); // Just for labels/descriptions
      case 'satisfaction':
        return renderRatingSettings();
      case 'leadscore':
        return renderSliderSettings();
      default:
        return null;
    }
  };

  // All field types that have specific settings
  const hasTypeSpecificSettings = [
    // Basic
    'text', 'email', 'phone', 'url', 'number', 'password', 'masked_text', 'price',
    'textarea', 'rich_text',
    // Choice
    'select', 'multiselect', 'radio', 'checkbox', 'dropdown', 'number_dropdown', 'picture_choice',
    // Date/Time
    'date', 'datetime', 'time', 'scheduler', 'timer',
    // Rating
    'rating', 'star_rating', 'nps', 'slider', 'scale', 'likert', 'ranking', 'like_dislike',
    // File/Upload
    'file', 'image_upload', 'drawing', 'signature',
    // Yes/No
    'yes_no',
    // Layout
    'heading', 'paragraph', 'explanation', 'divider', 'spacer', 'section', 'page_break', 'field_group',
    'layout_2col', 'layout_3col', 'layout_4col', 'repeater_group',
    // Location
    'location', 'google_maps',
    // Compliance
    'legal_consent', 'terms_of_service', 'gdpr_agreement', 'tcpa_consent',
    // Advanced
    'html', 'calendly', 'matrix', 'formula', 'discount_code', 'auto_unique_id', 'openai', 'api_action',
    // Media
    'image', 'video', 'audio', 'embed_pdf', 'custom_embed', 'social_share',
    // Payment
    'product_basket', 'stripe', 'paypal',
    // Captcha
    'recaptcha', 'turnstile',
    // Page
    'cover', 'welcome_page', 'ending',
    // Lead Capture
    'fullname', 'full_name', 'firstname', 'lastname', 'address', 'company', 'jobtitle',
    'budget', 'timeline', 'teamsize', 'industry', 'referral', 'satisfaction', 'priority',
    'leadscore', 'service', 'product', 'contactmethod',
    // Franchise
    'location_selector', 'service_area', 'franchise_location', 'appointment_location',
    'service_category', 'territory', 'store_finder', 'operating_hours', 'regional_contact', 'franchise_id'
  ].includes(field.field_type);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <h2 className="text-sm font-semibold">Field Settings</h2>
          <p className="text-xs text-muted-foreground capitalize">{field.field_type.replace(/_/g, ' ')}</p>
        </div>
        {onHide && (
          <button onClick={onHide} className="p-1 rounded hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="general"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              General
            </TabsTrigger>
            {hasTypeSpecificSettings && (
              <TabsTrigger
                value="options"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Options
              </TabsTrigger>
            )}
            <TabsTrigger
              value="validation"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Validation
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Style
            </TabsTrigger>
          </TabsList>

          <div className="p-4">
            <TabsContent value="general" className="mt-0">
              {renderGeneralSettings()}
            </TabsContent>

            {hasTypeSpecificSettings && (
              <TabsContent value="options" className="mt-0">
                {renderFieldTypeSettings()}
              </TabsContent>
            )}

            <TabsContent value="validation" className="mt-0">
              <div className="space-y-4">
                <ToggleRow label="Required Field" checked={field.required || false} onChange={(v) => updateField({ required: v })} />
                <ToggleRow label="Hidden Field" checked={field.hidden || false} onChange={(v) => updateField({ hidden: v })} description="Field won't be visible but value is submitted" />
                <ToggleRow label="Disabled" checked={field.disabled || false} onChange={(v) => updateField({ disabled: v })} description="Field is visible but not editable" />
                <ToggleRow label="Read Only" checked={field.readonly || false} onChange={(v) => updateField({ readonly: v })} />

                {/* Length validation for text fields */}
                {['text', 'email', 'phone', 'url', 'textarea', 'password', 'masked_text', 'rich_text'].includes(field.field_type) && (
                  <SettingSection title="Length Requirements">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Min Length</Label>
                        <Input
                          type="number"
                          value={field.validation?.min_length || ''}
                          onChange={(e) => updateValidation('min_length', e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Length</Label>
                        <Input
                          type="number"
                          value={field.validation?.max_length || ''}
                          onChange={(e) => updateValidation('max_length', e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </div>
                    </div>
                  </SettingSection>
                )}

                {/* Value validation for number fields */}
                {['number', 'price', 'slider', 'scale', 'nps', 'leadscore'].includes(field.field_type) && (
                  <SettingSection title="Value Range">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Min Value</Label>
                        <Input
                          type="number"
                          value={field.validation?.min_value || ''}
                          onChange={(e) => updateValidation('min_value', e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Value</Label>
                        <Input
                          type="number"
                          value={field.validation?.max_value || ''}
                          onChange={(e) => updateValidation('max_value', e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </div>
                    </div>
                  </SettingSection>
                )}

                {/* Pattern validation for text fields */}
                {['text', 'email', 'phone', 'url', 'textarea'].includes(field.field_type) && (
                  <SettingSection title="Pattern Validation">
                    <div className="space-y-2">
                      <Label>Regex Pattern</Label>
                      <Input value={field.validation?.pattern || ''} onChange={(e) => updateValidation('pattern', e.target.value)} placeholder="^[A-Za-z]+$" />
                      <p className="text-xs text-muted-foreground">Regular expression to validate input</p>
                    </div>
                  </SettingSection>
                )}

                {/* Password complexity validation */}
                {['password', 'masked_text'].includes(field.field_type) && (
                  <SettingSection title="Complexity Requirements">
                    <ToggleRow label="Require Uppercase" checked={field.validation?.require_uppercase || false} onChange={(v) => updateValidation('require_uppercase', v)} />
                    <ToggleRow label="Require Lowercase" checked={field.validation?.require_lowercase || false} onChange={(v) => updateValidation('require_lowercase', v)} />
                    <ToggleRow label="Require Number" checked={field.validation?.require_number || false} onChange={(v) => updateValidation('require_number', v)} />
                    <ToggleRow label="Require Special Character" checked={field.validation?.require_special || false} onChange={(v) => updateValidation('require_special', v)} />
                  </SettingSection>
                )}

                {/* Custom error message */}
                <SettingSection title="Error Messages">
                  <div className="space-y-2">
                    <Label>Custom Error Message</Label>
                    <Input value={field.validation?.custom_message || ''} onChange={(e) => updateValidation('custom_message', e.target.value)} placeholder="Please enter a valid value" />
                  </div>
                </SettingSection>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="mt-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Field Size</Label>
                  <Select value={field.appearance?.size || 'medium'} onValueChange={(v) => updateAppearance('size', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="full">Full Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Label Position</Label>
                  <Select value={field.appearance?.label_position || 'top'} onValueChange={(v) => updateAppearance('label_position', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Text Alignment</Label>
                  <Select value={field.appearance?.text_align || 'left'} onValueChange={(v) => updateAppearance('text_align', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <SettingSection title="Custom CSS Class">
                  <div className="space-y-2">
                    <Input value={field.css_class || ''} onChange={(e) => updateField({ css_class: e.target.value })} placeholder="my-custom-class" />
                    <p className="text-xs text-muted-foreground">Add custom CSS classes for styling</p>
                  </div>
                </SettingSection>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Delete Button */}
      {onDelete && (
        <div className="p-4 border-t">
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => onDelete(field.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Field
          </Button>
        </div>
      )}
    </div>
  );
}
