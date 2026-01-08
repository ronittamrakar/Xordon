import React from 'react';
import { CheckCircle, Globe, Eye, Settings as SettingsIcon } from 'lucide-react';
import { Form } from './types';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type DesignSettings = Record<string, any>;

interface ThankYouSettingsPanelProps {
  form: Form | null;
  onUpdate: (updates: Partial<Form>) => void;
}

const ThankYouSettingsPanel: React.FC<ThankYouSettingsPanelProps> = ({ form, onUpdate }) => {
  if (!form) return null;

  const settings = (form.settings as any) || {};
  const design: DesignSettings = settings.design || {};

  const handleDesignUpdate = (partial: DesignSettings) => {
    onUpdate({ settings: { ...settings, design: { ...design, ...partial } } });
  };

  const handleSettingUpdate = (key: string, value: any) => {
    onUpdate({ settings: { ...settings, [key]: value } });
  };

  return (
    <div className="w-full h-full bg-background flex flex-col">
      <div className="bg-card border-b border-border flex-shrink-0">
        <div className="px-4 py-3">
          <h1 className="text-base font-bold text-foreground">
            Thank You Experience
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Design the post-submit screen shown to respondents.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Accordion type="single" collapsible defaultValue="layout" className="space-y-4">
          <AccordionItem value="layout" className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-4">
            <AccordionTrigger className="hover:no-underline px-4 py-4">
              <div className="flex items-center gap-3 text-left">
                <CheckCircle className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Layout & Style</h3>
                  <p className="text-xs text-muted-foreground">Pick the overall thank you layout and copy.</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0">
              <div className="space-y-4 pt-4 border-t border-border">
                <SelectField
                  label="Thank You Style"
                  value={design.thankYouStyle || 'default'}
                  onChange={(v: string) => handleDesignUpdate({ thankYouStyle: v })}
                  options={[
                    { value: 'default', label: 'Default - Full Page' },
                    { value: 'minimal', label: 'Minimal - Simple Message' },
                    { value: 'celebration', label: 'Celebration - Confetti' },
                    { value: 'professional', label: 'Professional - Card' },
                    { value: 'custom', label: 'Custom - Use design tokens' },
                  ]}
                />
                <TextAreaField
                  label="Success Message"
                  value={design.successMessage || settings.confirmation_message || 'Thank you for your submission!'}
                  onChange={(v: string) => handleDesignUpdate({ successMessage: v })}
                  rows={3}
                  placeholder="Thank you for your submission!"
                />
                <TextAreaField
                  label="Additional Text"
                  value={settings.additional_text || ''}
                  onChange={(v: string) => handleSettingUpdate('additional_text', v)}
                  rows={2}
                  placeholder="Optional note below the main message"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="actions" className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-4">
            <AccordionTrigger className="hover:no-underline px-4 py-4">
              <div className="flex items-center gap-3 text-left">
                <SettingsIcon className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Actions & Behavior</h3>
                  <p className="text-xs text-muted-foreground">Control what happens after submit.</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0">
              <div className="space-y-4 pt-4 border-t border-border">
                <ToggleRow
                  title="Show confetti"
                  description="Display celebration animation"
                  checked={design.showConfetti || false}
                  onChange={(v) => handleDesignUpdate({ showConfetti: v })}
                />
                <ToggleRow
                  title="Enable redirect"
                  description="Send users to another page after submit"
                  checked={design.redirectAfterSubmit || false}
                  onChange={(v) => handleDesignUpdate({ redirectAfterSubmit: v })}
                />
                {design.redirectAfterSubmit && (
                  <div className="mt-3 space-y-3 pl-4 border-l-2 border-primary/20">
                    <InputField
                      label="Redirect URL"
                      value={design.redirectUrl || ''}
                      onChange={(v: string) => handleDesignUpdate({ redirectUrl: v })}
                      placeholder="https://example.com/thank-you"
                    />
                    <InputField
                      label="Delay (seconds)"
                      type="number"
                      value={design.redirectDelay || 3}
                      onChange={(v: string) => handleDesignUpdate({ redirectDelay: parseInt(v) || 3 })}
                    />
                  </div>
                )}
                <ToggleRow
                  title="Download PDF button"
                  description="Allow users to download a PDF of their submission"
                  checked={settings.download_pdf || false}
                  onChange={(v) => handleSettingUpdate('download_pdf', v)}
                />
                <ToggleRow
                  title="Fill again button"
                  description="Show a call-to-action to submit another response"
                  checked={settings.fill_again || false}
                  onChange={(v) => handleSettingUpdate('fill_again', v)}
                />
                <ToggleRow
                  title="Submission summary"
                  description="Let users view their submission summary"
                  checked={settings.submission_summary || false}
                  onChange={(v) => handleSettingUpdate('submission_summary', v)}
                />
                <ToggleRow
                  title="Social sharing"
                  description="Show social share buttons"
                  checked={settings.social_sharing || false}
                  onChange={(v) => handleSettingUpdate('social_sharing', v)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="labels" className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-4">
            <AccordionTrigger className="hover:no-underline px-4 py-4">
              <div className="flex items-center gap-3 text-left">
                <Eye className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Custom Labels</h3>
                  <p className="text-xs text-muted-foreground">Override default copy shown on screen.</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0">
              <div className="space-y-4 pt-4 border-t border-border">
                <InputField
                  label="Custom Title"
                  value={settings.thankYouTitle || ''}
                  onChange={(v: string) => handleSettingUpdate('thankYouTitle', v)}
                  placeholder="Success!"
                />
                <InputField
                  label="Button Text"
                  value={settings.thankYouButtonText || ''}
                  onChange={(v: string) => handleSettingUpdate('thankYouButtonText', v)}
                  placeholder="Close"
                  helpText="Text for action buttons (if present)"
                />
                <InputField
                  label="Button Link"
                  value={settings.thankYouButtonLink || ''}
                  onChange={(v: string) => handleSettingUpdate('thankYouButtonLink', v)}
                  placeholder="https://example.com"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="bg-image" className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-4">
            <AccordionTrigger className="hover:no-underline px-4 py-4">
              <div className="flex items-center gap-3 text-left">
                <Globe className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Background Image</h3>
                  <p className="text-xs text-muted-foreground">Set a custom background image or gradient.</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0">
              <div className="space-y-4 pt-4 border-t border-border">
                <SelectField
                  label="Background Type"
                  value={design.backgroundType || 'solid'}
                  onChange={(v: string) => handleDesignUpdate({ backgroundType: v })}
                  options={[
                    { value: 'solid', label: 'Solid Color' },
                    { value: 'image', label: 'Image' },
                    { value: 'gradient', label: 'Gradient' },
                  ]}
                />
                {design.backgroundType === 'image' && (
                  <div className="space-y-3">
                    <InputField
                      label="Background Image URL"
                      value={design.backgroundImage || ''}
                      onChange={(v: string) => handleDesignUpdate({ backgroundImage: v })}
                      placeholder="https://example.com/image.jpg"
                      helpText="Enter a direct URL to an image, or upload one below"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          // TODO: Implement image upload
                          alert('Image upload coming soon! For now, use a direct URL.');
                        }}
                      >
                        Upload Image
                      </Button>
                    </div>
                  </div>
                )}
                {design.backgroundType === 'gradient' && (
                  <div className="space-y-3">
                    <InputField
                      label="Gradient Start Color"
                      value={design.gradientStart || '#2563eb'}
                      onChange={(v: string) => handleDesignUpdate({ gradientStart: v })}
                      type="color"
                    />
                    <InputField
                      label="Gradient End Color"
                      value={design.gradientEnd || '#7c3aed'}
                      onChange={(v: string) => handleDesignUpdate({ gradientEnd: v })}
                      type="color"
                    />
                    <SelectField
                      label="Gradient Direction"
                      value={design.gradientDirection || 'to-br'}
                      onChange={(v: string) => handleDesignUpdate({ gradientDirection: v })}
                      options={[
                        { value: 'to-t', label: 'Top' },
                        { value: 'to-tr', label: 'Top Right' },
                        { value: 'to-r', label: 'Right' },
                        { value: 'to-br', label: 'Bottom Right' },
                        { value: 'to-b', label: 'Bottom' },
                        { value: 'to-bl', label: 'Bottom Left' },
                        { value: 'to-l', label: 'Left' },
                        { value: 'to-tl', label: 'Top Left' },
                      ]}
                    />
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="colors" className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-4">
            <AccordionTrigger className="hover:no-underline px-4 py-4">
              <div className="flex items-center gap-3 text-left">
                <Globe className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Background & Colors</h3>
                  <p className="text-xs text-muted-foreground">Set colors, primary color, and typography.</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0">
              <div className="space-y-4 pt-4 border-t border-border">
                <InputField
                  label="Primary Color"
                  value={design.primaryColor || '#2563eb'}
                  onChange={(v: string) => handleDesignUpdate({ primaryColor: v })}
                  type="color"
                />
                <InputField
                  label="Background Color"
                  value={design.backgroundColor || '#ffffff'}
                  onChange={(v: string) => handleDesignUpdate({ backgroundColor: v })}
                  type="color"
                />
                <InputField
                  label="Text Color"
                  value={design.textColor || '#1f2937'}
                  onChange={(v: string) => handleDesignUpdate({ textColor: v })}
                  type="color"
                />
                <SelectField
                  label="Border Radius"
                  value={design.borderRadius || 'medium'}
                  onChange={(v: string) => handleDesignUpdate({ borderRadius: v })}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                    { value: 'full', label: 'Full' },
                  ]}
                />
                <SelectField
                  label="Shadow"
                  value={design.shadow || 'none'}
                  onChange={(v: string) => handleDesignUpdate({ shadow: v })}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ]}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default ThankYouSettingsPanel;

// Lightweight shared UI pieces (keep here to avoid extra imports)
const ToggleRow = ({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-2 border-b last:border-0 border-border">
    <div className="pr-3">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
    </label>
  </div>
);

// Simple inputs
const InputField = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  helpText,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  helpText?: string;
}) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-foreground">{label}</label>
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
    />
    {helpText && <p className="text-[12px] text-muted-foreground">{helpText}</p>}
  </div>
);

const TextAreaField = ({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-foreground">{label}</label>
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
    />
  </div>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-foreground">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);
