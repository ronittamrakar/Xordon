import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Globe, Shield, Bell, Calendar, FileTextIcon, CheckCircle, Lock, Mail,
  Settings, ShieldCheck, Filter, Plus, Trash2, ChevronDown,
  Zap, BarChart3, Monitor, Ban, MapPin, Bot, Eye, Users, Palette, Code,
  RefreshCw, Share2
} from 'lucide-react'
import { Form } from './types'
import { getServices, ServiceCategory } from '@/services/leadMarketplaceApi'
import { webformsApi } from '@/services/webformsApi'
import { cn } from '@/lib/utils'

interface FormSettingsPanelProps {
  form: Form | null
  onUpdate: (updates: Partial<Form>) => void
  onClose?: () => void
  activeSubItem?: 'general' | 'confirmation' | 'notifications' | 'access-security' | 'display' | 'advanced' | 'marketplace'
  onSubItemChange?: (subItem: 'general' | 'confirmation' | 'notifications' | 'access-security' | 'display' | 'advanced' | 'marketplace') => void
}

interface EmailTemplate {
  id: string
  name: string
  trigger: string
  subject: string
  body: string
  from_name: string
  from_email: string
  reply_to: string
  enabled: boolean
}

interface ConditionalRule {
  id: string
  field: string
  operator: string
  value: string
  message: string
  redirect_url?: string
}

export default function FormSettingsPanel({ form, onUpdate, activeSubItem = 'general', onSubItemChange }: FormSettingsPanelProps) {
  const [selectedEmailIndex, setSelectedEmailIndex] = useState(0)
  const [services, setServices] = useState<ServiceCategory[]>([])
  const [previewJson, setPreviewJson] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewResult, setPreviewResult] = useState<any>(null)


  const handleUpdate = (key: string, value: any) => {
    onUpdate({ [key]: value })
  }

  const handleSettingsUpdate = (key: string, value: any) => {
    // Update settings without firing a toast on every keystroke to avoid focus loss
    onUpdate({ settings: { ...form.settings, [key]: value } })
  }

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const res = await getServices({ parent_id: null })
          if (mounted && res.data?.success) {
            setServices(res.data.data)
          }
        } catch (e) {
          console.error('Failed to load services', e)
        }
      })()
    return () => { mounted = false }
  }, [])

  const marketplaceSettings = ((form.settings as any)?.marketplace || {}) as Record<string, any>
  const fieldMap = (marketplaceSettings.field_map && typeof marketplaceSettings.field_map === 'object') ? marketplaceSettings.field_map : {}

  const serviceOptions = useMemo(() => {
    const flat: Array<{ id: number; name: string }> = []
    const walk = (items: ServiceCategory[], prefix = '') => {
      for (const s of items) {
        flat.push({ id: s.id, name: prefix ? `${prefix} / ${s.name}` : s.name })
        if ((s as any).subcategories?.length) {
          walk((s as any).subcategories, prefix ? `${prefix} / ${s.name}` : s.name)
        }
      }
    }
    walk(services)
    return flat
  }, [services])

  const fieldOptions = useMemo(() => {
    const opts = (form.fields || [])
      .filter((f: any) => (f.field_type || f.type) !== 'page_break')
      .map((f: any) => ({ value: String(f.id), label: f.label || String(f.id) }))
    return [{ value: '', label: 'Not mapped' }, ...opts]
  }, [form.fields])

  const updateMarketplace = (patch: Record<string, any>) => {
    handleSettingsUpdate('marketplace', { ...marketplaceSettings, ...patch })
  }

  const setMapKey = (targetKey: string, fieldId: string) => {
    const next = { ...fieldMap }
    if (!fieldId) {
      delete next[targetKey]
    } else {
      next[targetKey] = fieldId
    }
    updateMarketplace({ field_map: next })
  }

  const runPreview = async () => {
    if (!form.id) {
      toast.error('Save the form first before using preview')
      return
    }
    let payload: any
    try {
      payload = previewJson.trim() ? JSON.parse(previewJson) : {}
    } catch {
      toast.error('Preview JSON is invalid')
      return
    }

    setPreviewLoading(true)
    setPreviewResult(null)
    try {
      const res = await webformsApi.previewMarketplaceLead(form.id, payload)
      setPreviewResult(res)
    } catch (e: any) {
      toast.error(e?.message || 'Preview failed')
    } finally {
      setPreviewLoading(false)
    }
  }

  const getEmailTemplates = (): EmailTemplate[] => {
    return Array.isArray((form.settings as any)?.email_template)
      ? (form.settings as any).email_template
      : [{
        id: '1',
        name: 'You received a submission for [form_name]',
        trigger: 'on_submission',
        subject: 'You received a submission for [form_name]',
        body: 'Load template',
        from_name: 'Xordon Forms',
        from_email: 'noreply@xordon.com',
        reply_to: 'noreply@xordon.com',
        enabled: true
      }]
  }

  const handleEmailTemplateUpdate = (index: number, field: keyof EmailTemplate, value: any) => {
    const templates = getEmailTemplates()
    const updated = templates.map((t, i) => i === index ? { ...t, [field]: value } : t)
    handleSettingsUpdate('email_template', updated)
  }

  const addEmailTemplate = () => {
    const templates = getEmailTemplates()
    const newTemplate: EmailTemplate = {
      id: `${Date.now()}`,
      name: `Email ${templates.length + 1}`,
      trigger: 'on_submission',
      subject: 'You received a submission for [form_name]',
      body: '',
      from_name: 'Xordon Forms',
      from_email: 'noreply@xordon.com',
      reply_to: 'noreply@xordon.com',
      enabled: true
    }
    handleSettingsUpdate('email_template', [...templates, newTemplate])
    setSelectedEmailIndex(templates.length)
    toast.success('Email template added')
  }

  const getConditionalRules = (): ConditionalRule[] => {
    return Array.isArray((form.settings as any)?.confirmation_rules)
      ? (form.settings as any).confirmation_rules
      : []
  }

  const addConditionalRule = () => {
    const rules = getConditionalRules()
    const newRule: ConditionalRule = {
      id: `${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
      message: 'Thank you for your submission!'
    }
    handleSettingsUpdate('confirmation_rules', [...rules, newRule])
    toast.success('Conditional rule added')
  }

  const removeConditionalRule = (id: string) => {
    const rules = getConditionalRules().filter(r => r.id !== id)
    handleSettingsUpdate('confirmation_rules', rules)
    toast.success('Rule removed')
  }

  const updateConditionalRule = (id: string, field: keyof ConditionalRule, value: string) => {
    const rules = getConditionalRules().map(r => r.id === id ? { ...r, [field]: value } : r)
    handleSettingsUpdate('confirmation_rules', rules)
  }

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary transition-all duration-200"></div>
    </label>
  )

  const SettingRow = ({ title, description, checked, onChange, icon: Icon }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void; icon?: any }) => (
    <div className="flex items-center justify-between py-4 group hover:bg-muted/50 px-4 -mx-4 rounded-xl transition-all duration-200">
      <div className="flex items-start gap-4">
        {Icon && <div className="p-2 bg-muted rounded-lg text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors"><Icon className="h-4 w-4" /></div>}
        <div className="pr-4">
          <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h4>
          <p className="text-[12px] text-muted-foreground mt-0.5 font-medium leading-relaxed">{description}</p>
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  )

  const SectionCard = ({ title, description, icon: Icon, children, collapsible = false }: { title: string; description?: string; icon?: any; children: React.ReactNode; collapsible?: boolean }) => {
    const [isOpen, setIsOpen] = useState(true)
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm mb-6 overflow-hidden transition-all duration-200 hover:border-primary/20 hover:shadow-md">
        <div
          className={cn(
            "p-5 border-b border-border/50",
            collapsible && "cursor-pointer hover:bg-muted/50 active:bg-muted select-none"
          )}
          onClick={() => collapsible && setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-foreground flex items-center tracking-tight">
              {Icon && <div className="p-2 bg-primary/10 rounded-xl mr-3 shadow-sm border border-primary/20"><Icon className="h-4 w-4 text-primary" /></div>}
              {title}
            </h3>
            {collapsible && <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />}
          </div>
          {description && <p className="text-[12px] text-muted-foreground mt-2 font-medium ml-11">{description}</p>}
        </div>
        {isOpen && <div className="p-8">{children}</div>}
      </div>
    )
  }

  const InputField = ({ label, value, onChange, type = 'text', placeholder = '', helpText = '' }: any) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground/80">{label}</label>
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground" placeholder={placeholder} />
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  )

  const SelectField = ({ label, value, onChange, options, helpText = '' }: any) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground/80">{label}</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground">
        {options.map((opt: any) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
      </select>
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  )

  const VariableHelper = ({ onSelect }: { onSelect: (v: string) => void }) => (
    <div className="mt-2">
      <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-tight mb-1.5 flex items-center">
        <Zap className="h-2.5 w-2.5 mr-1 text-primary" />
        Insert Variable
      </p>
      <div className="flex flex-wrap gap-1">
        {['form_title', 'submission_id', 'submission_date'].map(v => (
          <button
            key={v}
            type="button"
            onClick={() => onSelect(`{{${v}}}`)}
            className="px-1.5 py-0.5 text-[12px] font-mono bg-amber-50 text-amber-600 border border-amber-100 rounded hover:bg-amber-100 transition-colors"
          >
            {`{{${v}}}`}
          </button>
        ))}
        {(form.fields || []).filter((f: any) => f.label && f.label !== "0" && (f.field_type || f.type) !== 'page_break').map((f: any) => {
          const varName = f.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelect(`{{${varName}}}`)}
              className="px-1.5 py-0.5 text-[12px] font-mono bg-blue-50 text-blue-600 border border-blue-100 rounded hover:bg-blue-100 transition-colors"
            >
              {`{{${varName}}}`}
            </button>
          )
        })}
      </div>
    </div>
  )

  const TextAreaField = ({ label, value, onChange, rows = 3, placeholder = '', helpText = '', mono = false }: any) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground/80">{label}</label>
      <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={rows} className={`w-full px-3 py-2 text-sm border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none bg-background text-foreground ${mono ? 'font-mono' : ''}`} placeholder={placeholder} />
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  )

  if (!form) return null

  const emailTemplates = getEmailTemplates()
  const currentEmail = emailTemplates[selectedEmailIndex] || emailTemplates[0]
  const conditionalRules = getConditionalRules()

  return (
    <div className="w-full h-full bg-muted/30 flex flex-col">
      <div className="bg-card border-b border-border flex-shrink-0">
        <div className="px-4 py-3">
          <h1 className="text-base font-bold text-foreground">Form Settings</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">

          {activeSubItem === 'general' && (
            <>
              <SectionCard title="Form Information" icon={FileTextIcon}>
                <div className="space-y-6">
                  <InputField label="Form Title" value={form.title} onChange={(v: string) => handleUpdate('title', v)} placeholder="Enter form title" />
                  <TextAreaField label="Description" value={form.description} onChange={(v: string) => handleUpdate('description', v)} placeholder="Describe your form" />
                  <div className="grid grid-cols-2 gap-6">
                    <SelectField label="Status" value={form.status} onChange={(v: string) => handleUpdate('status', v)} options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }]} />
                    <SelectField label="Type" value={form.type} onChange={(v: string) => handleUpdate('type', v)} options={[{ value: 'single_step', label: 'Single Step' }, { value: 'multi_step', label: 'Multi Step' }, { value: 'popup', label: 'Popup' }]} />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <SelectField label="Language" value={form.language} onChange={(v: string) => handleUpdate('language', v)} options={[{ value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' }, { value: 'fr', label: 'French' }, { value: 'de', label: 'German' }]} />
                    <div />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Submission Options" icon={Settings}>
                <div className="space-y-1">
                  <SettingRow title="Allow multiple submissions" description="Let users submit the form more than once" checked={(form.settings as any)?.allow_multiple_submissions || false} onChange={(v) => handleSettingsUpdate('allow_multiple_submissions', v)} icon={RefreshCw} />
                  <SettingRow title="Save drafts" description="Allow respondents to save progress and resume later" checked={(form.settings as any)?.resume_submissions || false} onChange={(v) => handleSettingsUpdate('resume_submissions', v)} icon={FileTextIcon} />
                  <SettingRow title="Auto save" description="Automatically save form progress periodically" checked={(form.settings as any)?.auto_save || false} onChange={(v) => handleSettingsUpdate('auto_save', v)} icon={Zap} />
                  <SettingRow title="Require login" description="Only authenticated users can submit" checked={(form.settings as any)?.require_login || false} onChange={(v) => handleSettingsUpdate('require_login', v)} icon={Lock} />
                  <SettingRow title="Collect email" description="Collect respondent email address" checked={(form.settings as any)?.collect_email || false} onChange={(v) => handleSettingsUpdate('collect_email', v)} icon={Mail} />
                </div>
              </SectionCard>
            </>
          )}

          {activeSubItem === 'confirmation' && (
            <div className="space-y-2">
              <SectionCard title="Thank You Page Design" icon={CheckCircle} description="Customize what users see after submitting">
                <div className="space-y-6">
                  <SelectField
                    label="Thank You Style"
                    value={(form.settings as any)?.design?.thankYouStyle || 'default'}
                    onChange={(v: string) => handleSettingsUpdate('design', { ...(form.settings as any)?.design, thankYouStyle: v })}
                    options={[
                      { value: 'default', label: 'Default - Full Page with Icon' },
                      { value: 'minimal', label: 'Minimal - Simple Message' },
                      { value: 'celebration', label: 'Celebration - With Confetti' },
                      { value: 'professional', label: 'Professional - Clean & Modern' },
                      { value: 'custom', label: 'Custom - Fully Editable' }
                    ]}
                  />
                  <TextAreaField label="Success Message" value={(form.settings as any)?.design?.successMessage || 'Thank you for your submission!'} onChange={(v: string) => handleSettingsUpdate('design', { ...(form.settings as any)?.design, successMessage: v })} rows={4} placeholder="Thank you for your submission!" />
                  <TextAreaField label="Additional Text" value={(form.settings as any)?.additional_text || ''} onChange={(v: string) => handleSettingsUpdate('additional_text', v)} rows={2} placeholder="Optional additional information..." helpText="Displayed below the main message" />
                </div>
              </SectionCard>

              <SectionCard title="Thank You Actions" icon={Settings} description="What users can do after submitting">
                <div className="space-y-1">
                  <SettingRow title="Show confetti animation" description="Celebrate with confetti effect" checked={(form.settings as any)?.design?.showConfetti || false} onChange={(v) => handleSettingsUpdate('design', { ...(form.settings as any)?.design, showConfetti: v })} icon={Zap} />
                  <SettingRow title="Download PDF" description="Allow users to download submission as PDF" checked={(form.settings as any)?.download_pdf || false} onChange={(v) => handleSettingsUpdate('download_pdf', v)} icon={FileTextIcon} />
                  <SettingRow title="Fill Again" description="Show button to submit another response" checked={(form.settings as any)?.fill_again || false} onChange={(v) => handleSettingsUpdate('fill_again', v)} icon={RefreshCw} />
                  <SettingRow title="View Submission Summary" description="Let users review their submission" checked={(form.settings as any)?.submission_summary || false} onChange={(v) => handleSettingsUpdate('submission_summary', v)} icon={Eye} />
                  <SettingRow title="Social Sharing" description="Allow sharing on social media" checked={(form.settings as any)?.social_sharing || false} onChange={(v) => handleSettingsUpdate('social_sharing', v)} icon={Share2} />
                  <SettingRow title="Send confirmation email" description="Send email confirmation to respondent" checked={(form.settings as any)?.confirmation_email || false} onChange={(v) => handleSettingsUpdate('confirmation_email', v)} icon={Mail} />
                </div>
              </SectionCard>

              <SectionCard title="Redirect Options" icon={Globe} description="Redirect users after submission">
                <SettingRow title="Redirect after submit" description="Send users to another page" checked={(form.settings as any)?.design?.redirectAfterSubmit || false} onChange={(v) => handleSettingsUpdate('design', { ...(form.settings as any)?.design, redirectAfterSubmit: v })} icon={Globe} />
                {(form.settings as any)?.design?.redirectAfterSubmit && (
                  <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <InputField label="Redirect URL" value={(form.settings as any)?.design?.redirectUrl || ''} onChange={(v: string) => handleSettingsUpdate('design', { ...(form.settings as any)?.design, redirectUrl: v })} placeholder="https://example.com/thank-you" />
                    <InputField label="Delay (seconds)" value={(form.settings as any)?.design?.redirectDelay || 3} onChange={(v: string) => handleSettingsUpdate('design', { ...(form.settings as any)?.design, redirectDelay: parseInt(v) || 3 })} type="number" />
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Custom Labels" icon={Eye} description="Advanced customization options" collapsible>
                <div className="space-y-4">
                  <InputField label="Custom Title" value={(form.settings as any)?.thankYouTitle || ''} onChange={(v: string) => handleSettingsUpdate('thankYouTitle', v)} placeholder="Success!" helpText="Override the default 'Success!' title" />
                  <InputField label="Button Text" value={(form.settings as any)?.thankYouButtonText || ''} onChange={(v: string) => handleSettingsUpdate('thankYouButtonText', v)} placeholder="Close" helpText="Custom text for action buttons" />
                  <InputField label="Button Link" value={(form.settings as any)?.thankYouButtonLink || ''} onChange={(v: string) => handleSettingsUpdate('thankYouButtonLink', v)} placeholder="https://example.com" helpText="Where the button should link to" />
                </div>
              </SectionCard>

              <SectionCard title="Conditional Confirmations" icon={Filter} description="Show different messages based on responses" collapsible>
                <p className="text-xs text-muted-foreground mb-4 font-medium italic">Create rules to show different confirmation messages based on form responses.</p>
                <div className="space-y-4">
                  {conditionalRules.map((rule) => (
                    <div key={rule.id} className="p-4 bg-muted/50 rounded-xl border border-border">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rule</span>
                        <button onClick={() => removeConditionalRule(rule.id)} className="text-destructive/70 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <SelectField label="Field" value={rule.field} onChange={(v: string) => updateConditionalRule(rule.id, 'field', v)} options={fieldOptions} />
                        <SelectField label="Operator" value={rule.operator} onChange={(v: string) => updateConditionalRule(rule.id, 'operator', v)} options={[{ value: 'equals', label: 'Equals' }, { value: 'not_equals', label: 'Not Equals' }, { value: 'contains', label: 'Contains' }]} />
                        <InputField label="Value" value={rule.value} onChange={(v: string) => updateConditionalRule(rule.id, 'value', v)} placeholder="value" />
                      </div>
                      <TextAreaField label="Message" value={rule.message} onChange={(v: string) => updateConditionalRule(rule.id, 'message', v)} rows={2} placeholder="Custom confirmation message" />
                      <div className="mt-2">
                        <InputField label="Redirect URL (Optional)" value={rule.redirect_url} onChange={(v: string) => updateConditionalRule(rule.id, 'redirect_url', v)} placeholder="https://example.com/special-thanks" helpText="Redirect to this URL if the condition matches" />
                      </div>
                    </div>
                  ))}
                  <button onClick={addConditionalRule} className="flex items-center px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-shadow hover:shadow-md">
                    <Plus className="h-4 w-4 mr-1.5" />Add Logic Rule
                  </button>
                </div>
              </SectionCard>
            </div>
          )}

          {activeSubItem === 'notifications' && (
            <div className="space-y-2">
              <SectionCard title="Emails" icon={Mail} description="Configure email templates for various triggers">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left Column: Templates List */}
                  <div className="w-full md:w-1/3 space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Templates</span>
                      <button
                        onClick={addEmailTemplate}
                        className="text-[12px] font-bold flex items-center bg-primary text-primary-foreground px-2.5 py-1.5 rounded-lg hover:bg-primary/90 transition-all hover:shadow-md active:scale-95"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                      {emailTemplates.map((template, index) => (
                        <button
                          key={template.id}
                          onClick={() => setSelectedEmailIndex(index)}
                          className={cn(
                            "w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all border flex items-center justify-between group",
                            selectedEmailIndex === index
                              ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                              : "hover:bg-muted/50 border-transparent text-muted-foreground hover:border-border"
                          )}
                        >
                          <div className="flex items-center min-w-0">
                            <div className={cn(
                              "p-2 rounded-lg mr-3 transition-colors",
                              selectedEmailIndex === index ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                            )}>
                              <Mail className="h-4 w-4" />
                            </div>
                            <span className="truncate font-semibold text-[13px]">{template.name}</span>
                          </div>
                          {emailTemplates.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const templates = getEmailTemplates().filter((_, i) => i !== index);
                                handleSettingsUpdate('email_template', templates);
                                if (selectedEmailIndex >= templates.length) setSelectedEmailIndex(Math.max(0, templates.length - 1));
                                toast.success('Template removed');
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 text-destructive/70 hover:text-destructive rounded-lg transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Template Editor */}
                  <div className="w-full md:w-2/3 space-y-5 bg-muted/30 p-5 rounded-2xl border border-border/50">
                    <div className="space-y-4">
                      <InputField label="Name" value={currentEmail?.name} onChange={(v: string) => handleEmailTemplateUpdate(selectedEmailIndex, 'name', v)} placeholder="Template Name" />
                      <SelectField
                        label="Trigger"
                        value={currentEmail?.trigger}
                        onChange={(v: string) => handleEmailTemplateUpdate(selectedEmailIndex, 'trigger', v)}
                        options={[
                          { value: 'on_submission', label: 'Form is submitted' },
                          { value: 'on_approval', label: 'Submission is approved' },
                          { value: 'on_rejection', label: 'Submission is rejected' }
                        ]}
                      />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <div>
                        <InputField label="Subject" value={currentEmail?.subject} onChange={(v: string) => handleEmailTemplateUpdate(selectedEmailIndex, 'subject', v)} placeholder="You received a submission for {{form_title}}" />
                        <VariableHelper onSelect={(v) => handleEmailTemplateUpdate(selectedEmailIndex, 'subject', (currentEmail?.subject || '') + v)} />
                      </div>

                      <div>
                        <TextAreaField
                          label="Body"
                          value={currentEmail?.body || ''}
                          onChange={(v: string) => handleEmailTemplateUpdate(selectedEmailIndex, 'body', v)}
                          rows={10}
                          placeholder="Email body content..."
                          mono
                          helpText="Use [field_name] or {{field_name}} to insert submission data"
                        />
                        <VariableHelper onSelect={(v) => handleEmailTemplateUpdate(selectedEmailIndex, 'body', (currentEmail?.body || '') + v)} />
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Admin Notifications" icon={Bell} description="Alert team members of new submissions">
                <SettingRow title="Enable admin notifications" description="Send an email to select recipients for every submission" checked={(form.settings as any)?.admin_notifications || false} onChange={(v) => handleSettingsUpdate('admin_notifications', v)} icon={Bell} />
                {(form.settings as any)?.admin_notifications && (
                  <div className="mt-6 p-6 bg-primary/10 rounded-2xl border border-primary/20 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-card rounded-xl shadow-sm border border-primary/20"><Mail className="h-5 w-5 text-primary" /></div>
                      <div className="flex-1">
                        <InputField
                          label="Notification Recipients"
                          value={(form.settings as any)?.notification_email}
                          onChange={(v: string) => handleSettingsUpdate('notification_email', v)}
                          type="text"
                          placeholder="admin@email.com, team@email.com"
                          helpText="Separate multiple emails with commas"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Email Branding" icon={Palette} description="Customize how your emails look" collapsible>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-6 rounded-2xl border border-border/50">
                  <div className="space-y-4">
                    <InputField label="From Name" value={currentEmail?.from_name} onChange={(v: string) => handleEmailTemplateUpdate(selectedEmailIndex, 'from_name', v)} placeholder="Xordon Forms" />
                    <InputField label="From Email" value={currentEmail?.from_email} onChange={(v: string) => handleEmailTemplateUpdate(selectedEmailIndex, 'from_email', v)} placeholder="noreply@xordon.com" />
                  </div>
                  <div className="space-y-4">
                    <InputField label="Reply To" value={currentEmail?.reply_to} onChange={(v: string) => handleEmailTemplateUpdate(selectedEmailIndex, 'reply_to', v)} placeholder="support@xordon.com" />
                    <div className="p-4 bg-accent/20 rounded-xl border border-accent/30 text-[12px] text-accent-foreground leading-relaxed">
                      <strong>Note:</strong> Custom From emails require domain verification in your workspace settings to ensure high deliverability.
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {activeSubItem === 'access-security' && (
            <div className="space-y-2">
              <SectionCard title="Scheduling" icon={Calendar} description="Control when the form is available">
                <div className="space-y-1">
                  <SettingRow
                    title="Set opening date"
                    description="Form opens at a specific date/time"
                    checked={!!(form.settings as any)?.start_date}
                    onChange={(v) => handleSettingsUpdate('start_date', v ? new Date().toISOString().split('T')[0] : '')}
                    icon={Calendar}
                  />
                  {(form.settings as any)?.start_date && (
                    <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                      <InputField label="Opening Date" value={(form.settings as any)?.start_date} onChange={(v: string) => handleSettingsUpdate('start_date', v)} type="date" />
                    </div>
                  )}

                  <SettingRow
                    title="Enable expiry"
                    description="Form closes at a specific date"
                    checked={(form.settings as any)?.enable_expiry || false}
                    onChange={(v) => handleSettingsUpdate('enable_expiry', v)}
                    icon={Ban}
                  />
                  {(form.settings as any)?.enable_expiry && (
                    <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                      <InputField label="Expiry Date" value={(form.settings as any)?.expiry_date} onChange={(v: string) => handleSettingsUpdate('expiry_date', v)} type="date" />
                    </div>
                  )}

                  <SettingRow
                    title="Limit responses"
                    description="Set maximum number of submissions"
                    checked={(form.settings as any)?.limit_responses || false}
                    onChange={(v) => handleSettingsUpdate('limit_responses', v)}
                    icon={BarChart3}
                  />
                  {(form.settings as any)?.limit_responses && (
                    <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                      <InputField
                        label="Maximum Responses"
                        value={(form.settings as any)?.max_responses || 100}
                        onChange={(v: string) => handleSettingsUpdate('max_responses', parseInt(v) || 0)}
                        type="number"
                        helpText="The form will stop accepting submissions after this many responses"
                      />
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Password Protection" icon={Lock}>
                <SettingRow title="Enable password" description="Require password to access form" checked={(form.settings as any)?.enable_password || false} onChange={(v) => handleSettingsUpdate('enable_password', v)} icon={Lock} />
                {(form.settings as any)?.enable_password && (
                  <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                    <InputField label="Password" value={(form.settings as any)?.password} onChange={(v: string) => handleSettingsUpdate('password', v)} type="password" placeholder="Enter password" />
                  </div>
                )}
              </SectionCard>

              <SectionCard title="CAPTCHA & Bot Protection" icon={Bot}>
                <div className="space-y-1">
                  <SettingRow title="Enable CAPTCHA" description="Protect against spam submissions" checked={(form.settings as any)?.enable_captcha || false} onChange={(v) => handleSettingsUpdate('enable_captcha', v)} icon={Shield} />
                  <SettingRow title="Enable honeypot" description="Hidden field to catch bots" checked={(form.settings as any)?.enable_honeypot || false} onChange={(v) => handleSettingsUpdate('enable_honeypot', v)} icon={Bot} />
                </div>
              </SectionCard>

              <SectionCard title="Compliance & Privacy" icon={ShieldCheck}>
                <div className="space-y-1">
                  <SettingRow title="GDPR compliance" description="Enable GDPR-compliant data handling" checked={(form.settings as any)?.gdpr_compliant || false} onChange={(v) => handleSettingsUpdate('gdpr_compliant', v)} icon={ShieldCheck} />
                  <SettingRow title="Track IP address" description="Collect respondent IP addresses" checked={(form.settings as any)?.track_ip_address || false} onChange={(v) => handleSettingsUpdate('track_ip_address', v)} icon={Globe} />
                </div>
              </SectionCard>

              <SectionCard title="Geographic Restrictions" icon={Globe} description="Control access based on respondent location">
                <div className="space-y-1">
                  <SettingRow
                    title="Enable geographic restrictions"
                    description="Limit form access to specific countries"
                    checked={(form.settings as any)?.enable_geo_restrictions || false}
                    onChange={(v) => handleSettingsUpdate('enable_geo_restrictions', v)}
                    icon={Globe}
                  />
                  {(form.settings as any)?.enable_geo_restrictions && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-4 animate-in fade-in slide-in-from-top-2">
                      <SelectField
                        label="Restriction Mode"
                        value={(form.settings as any)?.geo_restriction_mode || 'allow'}
                        onChange={(v: string) => handleSettingsUpdate('geo_restriction_mode', v)}
                        options={[
                          { value: 'allow', label: 'Allow only selected countries' },
                          { value: 'block', label: 'Block selected countries' }
                        ]}
                      />
                      <TextAreaField
                        label="Countries"
                        value={(form.settings as any)?.geo_countries}
                        onChange={(v: string) => handleSettingsUpdate('geo_countries', v)}
                        placeholder="US, GB, CA, AU"
                        helpText="Enter comma-separated ISO country codes"
                      />
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="IP & Rate Limiting" icon={Shield} description="Prevent abuse and multiple submissions">
                <div className="space-y-1">
                  <SettingRow
                    title="IP Blocking"
                    description="Block specific IP addresses from submitting"
                    checked={!!(form.settings as any)?.blocked_ips}
                    onChange={(v) => handleSettingsUpdate('blocked_ips', v ? ' ' : '')}
                    icon={Shield}
                  />
                  {(form.settings as any)?.blocked_ips && (
                    <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                      <TextAreaField
                        label="Blocked IP Addresses"
                        value={(form.settings as any)?.blocked_ips}
                        onChange={(v: string) => handleSettingsUpdate('blocked_ips', v)}
                        placeholder="192.168.1.1, 10.0.0.0/24"
                        helpText="Enter comma-separated IPs or CIDR blocks"
                        mono
                      />
                    </div>
                  )}

                  <SettingRow
                    title="Rate Limiting"
                    description="Limit number of submissions per user/IP"
                    checked={(form.settings as any)?.enable_rate_limit || false}
                    onChange={(v) => handleSettingsUpdate('enable_rate_limit', v)}
                    icon={Zap}
                  />
                  {(form.settings as any)?.enable_rate_limit && (
                    <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                      <InputField
                        label="Max Submissions"
                        type="number"
                        value={(form.settings as any)?.rate_limit_count || 5}
                        onChange={(v: string) => handleSettingsUpdate('rate_limit_count', parseInt(v) || 5)}
                      />
                      <SelectField
                        label="Time Window"
                        value={(form.settings as any)?.rate_limit_window || '1h'}
                        onChange={(v: string) => handleSettingsUpdate('rate_limit_window', v)}
                        options={[
                          { value: '1m', label: 'Per Minute' },
                          { value: '1h', label: 'Per Hour' },
                          { value: '1d', label: 'Per Day' }
                        ]}
                      />
                    </div>
                  )}

                  <SettingRow
                    title="Block VPN/Proxies"
                    description="Prevent submissions from known VPN and proxy services"
                    checked={(form.settings as any)?.block_vpn || false}
                    onChange={(v) => handleSettingsUpdate('block_vpn', v)}
                    icon={Globe}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Spam Prevention" icon={Bot} description="Additional layers of protection against unwanted content">
                <div className="space-y-4">
                  <SettingRow
                    title="Block Disposable Emails"
                    description="Prevent submissions from temporary/disposable email providers"
                    checked={(form.settings as any)?.block_disposable_emails || false}
                    onChange={(v) => handleSettingsUpdate('block_disposable_emails', v)}
                    icon={Mail}
                  />

                  <div>
                    <TextAreaField
                      label="Blocked Email Domains"
                      value={(form.settings as any)?.blocked_email_domains}
                      onChange={(v: string) => handleSettingsUpdate('blocked_email_domains', v)}
                      placeholder="competitor.com, spam.org"
                      helpText="Enter comma-separated domains to block"
                    />
                  </div>

                  <div>
                    <TextAreaField
                      label="Spam Keywords"
                      value={(form.settings as any)?.spam_keywords}
                      onChange={(v: string) => handleSettingsUpdate('spam_keywords', v)}
                      placeholder="buy now, viagra, casino"
                      helpText="Block submissions containing these keywords (comma-separated)"
                    />
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {activeSubItem === 'display' && (
            <div className="space-y-2">
              <SectionCard title="Display & Validation" icon={Monitor} description="Control form appearance and validation">
                <div className="space-y-1">
                  {form.type === 'multi_step' && (
                    <div className="mb-6 p-5 bg-primary/10 rounded-xl border border-primary/20">
                      <SelectField
                        label="Multi-step Style"
                        value={(form.settings as any)?.multiStepStyle || 'accordion'}
                        onChange={(v: string) => handleSettingsUpdate('multiStepStyle', v)}
                        options={[
                          { value: 'accordion', label: 'Accordion - All steps visible but collapsible' },
                          { value: 'pagination', label: 'Pagination - One page at a time with buttons' },
                          { value: 'one-step-at-a-time', label: 'Wizard - Focused one step at a time' }
                        ]}
                        helpText="Choose how multi-step forms are presented to the user"
                      />
                      <div className="mt-6 pt-4 border-t border-primary/20">
                        <SettingRow
                          title="Allow multiple active steps"
                          description="Keep all steps open at once in accordion view"
                          checked={(form.settings as any)?.allowMultipleExpand || false}
                          onChange={(v) => handleSettingsUpdate('allowMultipleExpand', v)}
                        />
                      </div>
                    </div>
                  )}
                  <SettingRow title="Show progress bar" description="Display completion progress for multi-step forms" checked={(form.settings as any)?.show_progress_bar || false} onChange={(v) => handleSettingsUpdate('show_progress_bar', v)} />
                  <SettingRow title="Show field numbers" description="Display numbers next to form fields" checked={(form.settings as any)?.show_field_numbers || false} onChange={(v) => handleSettingsUpdate('show_field_numbers', v)} />
                  <SettingRow title="Prevent duplicates" description="Prevent duplicate submissions from same user" checked={(form.settings as any)?.prevent_duplicates || false} onChange={(v) => handleSettingsUpdate('prevent_duplicates', v)} />
                  <SettingRow title="Mobile optimized" description="Optimize form layout for mobile devices" checked={(form.settings as any)?.mobile_optimized !== false} onChange={(v) => handleSettingsUpdate('mobile_optimized', v)} />
                </div>
              </SectionCard>
            </div>
          )}

          {activeSubItem === 'advanced' && (
            <div className="space-y-2">
              <SectionCard title="Analytics & Tracking" icon={BarChart3}>
                <div className="space-y-1">
                  <SettingRow title="Enable analytics" description="Track form performance" checked={(form.settings as any)?.analytics_enabled !== false} onChange={(v) => handleSettingsUpdate('analytics_enabled', v)} />
                  <SettingRow title="Google Analytics" description="Send events to Google Analytics" checked={(form.settings as any)?.google_analytics || false} onChange={(v) => handleSettingsUpdate('google_analytics', v)} />
                  {(form.settings as any)?.google_analytics && (
                    <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                      <InputField label="GA Tracking ID" value={(form.settings as any)?.ga_tracking_id} onChange={(v: string) => handleSettingsUpdate('ga_tracking_id', v)} placeholder="UA-XXXXXXXXX-X or G-XXXXXXXXXX" />
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Webhooks" icon={Zap}>
                <div className="space-y-4">
                  <InputField label="Webhook URL" value={(form.settings as any)?.webhook_url} onChange={(v: string) => handleSettingsUpdate('webhook_url', v)} type="url" placeholder="https://your-server.com/webhook" helpText="Send form submissions to this URL" />
                  <SelectField label="HTTP Method" value={(form.settings as any)?.webhook_method || 'POST'} onChange={(v: string) => handleSettingsUpdate('webhook_method', v)} options={[{ value: 'POST', label: 'POST' }, { value: 'PUT', label: 'PUT' }, { value: 'PATCH', label: 'PATCH' }]} />
                </div>
              </SectionCard>

              <SectionCard title="Custom Code" icon={Code}>
                <div className="space-y-6">
                  <TextAreaField label="Custom CSS" value={(form.settings as any)?.custom_css} onChange={(v: string) => handleSettingsUpdate('custom_css', v)} rows={6} mono placeholder="/* Custom styles */" />
                  <TextAreaField label="Custom JavaScript" value={(form.settings as any)?.custom_scripts} onChange={(v: string) => handleSettingsUpdate('custom_scripts', v)} rows={6} mono placeholder="// Custom scripts" />
                  <SettingRow title="Debug mode" description="Enable debug logging in console" checked={(form.settings as any)?.debug_mode || false} onChange={(v) => handleSettingsUpdate('debug_mode', v)} />
                </div>
              </SectionCard>
            </div>
          )}

          {activeSubItem === 'marketplace' && (
            <>
              <SectionCard title="Lead Marketplace" icon={Users} description="Send webform submissions into the Lead Marketplace as Leads">
                <SettingRow
                  title="Enable Lead Marketplace"
                  description="Create a lead request when this form is submitted"
                  checked={!!marketplaceSettings.enabled}
                  onChange={(v) => updateMarketplace({ enabled: v })}
                />

                {marketplaceSettings.enabled && (
                  <div className="mt-4 space-y-4">
                    <SelectField
                      label="Default Service"
                      value={String(marketplaceSettings.default_service_id || '')}
                      onChange={(v: string) => updateMarketplace({ default_service_id: v ? parseInt(v) : null })}
                      options={[{ value: '', label: 'Select service' }, ...serviceOptions.map(s => ({ value: String(s.id), label: s.name }))]}
                      helpText="Used when service_id is not mapped from the submission"
                    />

                    <SettingRow
                      title="Auto route"
                      description="Immediately route new leads to matching providers"
                      checked={marketplaceSettings.auto_route !== false}
                      onChange={(v) => updateMarketplace({ auto_route: v })}
                    />

                    <SettingRow
                      title="Exclusive lead"
                      description="Only one provider can buy this lead"
                      checked={!!marketplaceSettings.is_exclusive}
                      onChange={(v) => updateMarketplace({ is_exclusive: v, max_sold_count: v ? 1 : (marketplaceSettings.max_sold_count || 3) })}
                    />

                    {!marketplaceSettings.is_exclusive && (
                      <InputField
                        label="Max Sold Count"
                        type="number"
                        value={marketplaceSettings.max_sold_count ?? 3}
                        onChange={(v: string) => updateMarketplace({ max_sold_count: parseInt(v) || 3 })}
                        helpText="How many different providers can buy the same lead"
                      />
                    )}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Field Mapping" icon={MapPin} description="Map form fields to lead fields (optional)">
                <div className="space-y-4">
                  <SelectField
                    label="consumer_name"
                    value={String(fieldMap.consumer_name || '')}
                    onChange={(v: string) => setMapKey('consumer_name', v)}
                    options={fieldOptions}
                  />
                  <SelectField
                    label="consumer_phone"
                    value={String(fieldMap.consumer_phone || '')}
                    onChange={(v: string) => setMapKey('consumer_phone', v)}
                    options={fieldOptions}
                  />
                  <SelectField
                    label="consumer_email"
                    value={String(fieldMap.consumer_email || '')}
                    onChange={(v: string) => setMapKey('consumer_email', v)}
                    options={fieldOptions}
                  />
                  <SelectField
                    label="postal_code"
                    value={String(fieldMap.postal_code || '')}
                    onChange={(v: string) => setMapKey('postal_code', v)}
                    options={fieldOptions}
                  />
                  <SelectField
                    label="city"
                    value={String(fieldMap.city || '')}
                    onChange={(v: string) => setMapKey('city', v)}
                    options={fieldOptions}
                  />
                  <SelectField
                    label="region"
                    value={String(fieldMap.region || '')}
                    onChange={(v: string) => setMapKey('region', v)}
                    options={fieldOptions}
                  />
                  <SelectField
                    label="timing"
                    value={String(fieldMap.timing || '')}
                    onChange={(v: string) => setMapKey('timing', v)}
                    options={fieldOptions}
                  />
                  <SelectField
                    label="budget_min"
                    value={String(fieldMap.budget_min || '')}
                    onChange={(v: string) => setMapKey('budget_min', v)}
                    options={fieldOptions}
                  />
                  <SelectField
                    label="budget_max"
                    value={String(fieldMap.budget_max || '')}
                    onChange={(v: string) => setMapKey('budget_max', v)}
                    options={fieldOptions}
                  />
                  <SelectField
                    label="description"
                    value={String(fieldMap.description || '')}
                    onChange={(v: string) => setMapKey('description', v)}
                    options={fieldOptions}
                  />
                  <SelectField
                    label="service_id"
                    value={String(fieldMap.service_id || '')}
                    onChange={(v: string) => setMapKey('service_id', v)}
                    options={fieldOptions}
                  />
                  <SelectField
                    label="title"
                    value={String(fieldMap.title || '')}
                    onChange={(v: string) => setMapKey('title', v)}
                    options={fieldOptions}
                  />
                  <SelectField
                    label="property_type"
                    value={String(fieldMap.property_type || '')}
                    onChange={(v: string) => setMapKey('property_type', v)}
                    options={fieldOptions}
                  />
                  <SelectField
                    label="consent_contact"
                    value={String(fieldMap.consent_contact || '')}
                    onChange={(v: string) => setMapKey('consent_contact', v)}
                    options={fieldOptions}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Test Submission Preview" icon={Eye} description="Preview how a submission will map into a lead (no database writes)">
                <div className="space-y-3">
                  <TextAreaField
                    label="Submission JSON"
                    value={previewJson}
                    onChange={(v: string) => setPreviewJson(v)}
                    rows={6}
                    mono
                    placeholder='{"field_123":"John","field_456":"555-111-2222"}'
                    helpText="Use field IDs as keys (same as actual submission payload)"
                  />

                  <button
                    onClick={runPreview}
                    disabled={previewLoading}
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                  >
                    {previewLoading ? 'Previewing...' : 'Run Preview'}
                  </button>

                  {previewResult && (
                    <TextAreaField
                      label="Preview Result"
                      value={JSON.stringify(previewResult, null, 2)}
                      onChange={() => { }}
                      rows={10}
                      mono
                    />
                  )}
                </div>
              </SectionCard>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

