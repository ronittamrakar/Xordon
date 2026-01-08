import React, { useState } from 'react'
import { Form } from './types'
import { 
  Palette, Type, Layout, Sparkles, Image as ImageIcon, 
  ChevronDown, ChevronUp, Upload, Settings, Move3D,
  Award, FileTextIcon, MessageSquare, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

const animatedGradientStyle = `
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`

interface DesignPanelSidebarProps {
  form: Form
  onUpdate: (updates: Partial<Form>) => void
}

const DesignPanelSidebar: React.FC<DesignPanelSidebarProps> = ({ form, onUpdate }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['themes']))

  React.useEffect(() => {
    const styleId = 'animated-gradient-styles'
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style')
      styleEl.id = styleId
      styleEl.textContent = animatedGradientStyle
      document.head.appendChild(styleEl)
    }
  }, [])

  const designSettings = (form.settings as any)?.design || {
    theme: 'light',
    themePreset: 'custom',
    primaryColor: '#2563eb',
    secondaryColor: '#dbeafe',
    accentColor: '#3b82f6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    questionColor: '#101828',
    answerColor: '#101828',
    descriptionColor: '#475467',
    optionTextColor: '#475467',
    selectedOptionColor: '#2563eb',
    placeholderColor: '#ffffff',
    placeholderTextColor: '#D0D5DD',
    buttonTextColor: '#ffffff',
    borderColor: '#D0D5DD',
    progressColor: '#60606060',
    linksColor: '#0D6EFD',
    fontFamily: 'Inter',
    fontSize: 'medium',
    questionFontSize: 16,
    descriptionFontSize: 12,
    sublabelFontSize: 12,
    optionFontSize: 14,
    answerFontSize: 16,
    questionSpacing: 12,
    headingWeight: 700,
    bodyWeight: 400,
    lineHeight: 1.5,
    borderRadius: 'medium',
    formWidth: 750,
    fieldTopMargin: 0,
    fieldBottomMargin: 12,
    questionBottomMargin: 4,
    descriptionBottomMargin: 8,
    fieldVerticalPadding: 8,
    fieldHorizontalPadding: 8,
    fieldsSpacing: 16,
    defaultLabelWidth: 5,
    backgroundType: 'solid',
    backgroundImage: '',
    backgroundBrightness: 100,
    customCSS: '',
    removeBranding: false,
    showLogo: false,
    logoUrl: '',
    logoPosition: 'left',
    logoSize: 'medium',
    showProgressBar: true,
    progressBarStyle: 'line',
    progressBarPosition: 'top',
    progressBarColor: '#2563eb',
    showQuestionNumbers: true,
    questionNumberStyle: 'decimal',
    labelPosition: 'top',
    requiredIndicator: 'asterisk',
    errorStyle: 'inline',
    successMessage: 'Thank you for your submission!',
    showConfetti: false,
    redirectAfterSubmit: false,
    redirectUrl: '',
    redirectDelay: 3,
    buttonText: 'Submit',
    buttonPosition: 'left',
    buttonTextAlign: 'center',
    buttonWidth: 'auto',
    showBackButton: true,
    backButtonText: 'Back',
    focusHighlight: true,
    focusColor: '#2563eb',
    formVerticalSpacing: 24,
    formHorizontalSpacing: 16,
    fieldTopSpacing: 16,
    fieldBottomSpacing: 16,
    questionBottomSpacing: 8,
    descriptionBottomSpacing: 12,
    questionFontWeight: 600,
    descriptionFontWeight: 400,
    sublabelFontWeight: 400,
    optionFontWeight: 400,
    borderStyle: 'rounded',
    backgroundImageBrightness: 100,
    cssSelectorMode: false,
    formWidthPixels: 600,
    faviconUrl: '',
    shadow: 'none',
    alignment: 'left',
    borderThickness: 0,
    pageBackgroundType: 'solid',
    pageBackgroundImage: '',
    formDirection: 'ltr',
    headerPadding: 20,
    footerPadding: 20,
    leftPadding: 20,
    rightPadding: 20,
    pageTopPadding: 40,
    pageBottomPadding: 40,
    labelFontWeight: 400,
    labelFontStyle: 'normal',
    labelLineHeight: 1.5,
    labelTopMargin: 10,
    labelBottomMargin: 8,
    requiredStarColor: '#ef4444',
    instructionsPlacement: 'below',
    instructionsFontWeight: 400,
    instructionsFontStyle: 'normal',
    instructionsFontSize: 14,
    instructionsLineHeight: 1.4,
    instructionsColor: '#6b7280',
    instructionsTopMargin: 4,
    instructionsBottomMargin: 0,
    inputBackground: '#ffffff',
    inputBorderWidth: 1,
    inputFontWeight: 400,
    inputFontStyle: 'normal',
    inputFontSize: 16,
    inputLineHeight: 1.4,
    inputTextColor: '#1f2937',
    inputHorizontalPadding: 12,
    inputVerticalPadding: 8,
    inputBorderStyle: 'solid',
    inputFontFamily: 'Inter',
    fieldHoverInputBackground: '#f9fafb',
    fieldHoverInputBorder: '#d1d5db',
    fieldHoverInputText: '#1f2937',
    fieldHoverLabelColor: '#374151',
    fieldHoverInstructionsColor: '#6b7280',
    fieldFocusInputBackground: '#ffffff',
    fieldFocusInputBorder: '#2563eb',
    fieldFocusInputText: '#1f2937',
    fieldFocusLabelColor: '#2563eb',
    fieldFocusInstructionsColor: '#6b7280',
    errorFontWeight: 400,
    errorFontStyle: 'normal',
    errorFontSize: 14,
    errorLineHeight: 1.4,
    errorColor: '#ef4444',
    errorTopMargin: 4,
    errorBottomMargin: 0,
    errorBackground: '#fef2f2',
    errorBorder: '#fecaca',
    errorText: '#991b1b',
    errorLabelColor: '#991b1b',
    errorInstructionsColor: '#991b1b',
    radioRightMargin: 8,
    checkboxRightMargin: 8,
    buttonBorderWidth: 1,
    buttonBorderStyle: 'solid',
    buttonFontWeight: 700,
    buttonFontStyle: 'normal',
    buttonFontSize: 16,
    buttonLineHeight: 1.4,
    buttonHorizontalPadding: 16,
    buttonVerticalPadding: 8,
    primaryButtonBackground: '#2563eb',
    primaryButtonBorder: '#2563eb',
    primaryButtonText: '#ffffff',
    primaryButtonHoverBackground: '#1d4ed8',
    primaryButtonHoverBorder: '#1d4ed8',
    primaryButtonHoverText: '#ffffff',
    secondaryButtonBackground: '#ffffff',
    secondaryButtonBorder: '#d1d5db',
    secondaryButtonText: '#374151',
    secondaryButtonHoverBackground: '#f9fafb',
    secondaryButtonHoverBorder: '#9ca3af',
    secondaryButtonHoverText: '#374151',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'scroll',
    hideAdvancedSettings: false,
    hidePoweredBy: false,
    animation: 'none',
    transitionSpeed: 'normal',
  }

  const updateDesign = (updates: any) => {
    onUpdate({
      settings: {
        ...form.settings,
        design: {
          ...designSettings,
          ...updates
        }
      } as any
    })
  }

  const themePresets = [
    { id: 'custom', name: 'Custom Theme', primary: designSettings.primaryColor || '#2563eb', theme: {} },
    { id: 'ocean-blue', name: 'Ocean Blue', primary: '#2563eb', theme: { primaryColor: '#2563eb', secondaryColor: '#dbeafe', accentColor: '#3b82f6', backgroundColor: '#ffffff', textColor: '#1f2937', questionColor: '#101828', answerColor: '#101828', descriptionColor: '#475467', optionTextColor: '#475467', selectedOptionColor: '#2563eb', placeholderColor: '#ffffff', placeholderTextColor: '#D0D5DD', buttonTextColor: '#ffffff', borderColor: '#D0D5DD', fontFamily: 'Inter', fontSize: 'medium', borderRadius: 'medium', shadow: 'small', alignment: 'left' } },
    { id: 'forest-green', name: 'Forest Green', primary: '#059669', theme: { primaryColor: '#059669', secondaryColor: '#d1fae5', accentColor: '#10b981', backgroundColor: '#ffffff', textColor: '#1f2937', questionColor: '#064e3b', answerColor: '#064e3b', descriptionColor: '#4b5563', optionTextColor: '#4b5563', selectedOptionColor: '#059669', placeholderColor: '#ffffff', placeholderTextColor: '#D0D5DD', buttonTextColor: '#ffffff', borderColor: '#D0D5DD', fontFamily: 'Inter', fontSize: 'medium', borderRadius: 'medium', shadow: 'small', alignment: 'left' } },
    { id: 'sunset-orange', name: 'Sunset Orange', primary: '#ea580c', theme: { primaryColor: '#ea580c', secondaryColor: '#fed7aa', accentColor: '#f97316', backgroundColor: '#ffffff', textColor: '#1f2937', questionColor: '#7c2d12', answerColor: '#7c2d12', descriptionColor: '#4b5563', optionTextColor: '#4b5563', selectedOptionColor: '#ea580c', placeholderColor: '#ffffff', placeholderTextColor: '#D0D5DD', buttonTextColor: '#ffffff', borderColor: '#D0D5DD', fontFamily: 'Inter', fontSize: 'medium', borderRadius: 'medium', shadow: 'small', alignment: 'left' } },
    { id: 'royal-purple', name: 'Royal Purple', primary: '#7c3aed', theme: { primaryColor: '#7c3aed', secondaryColor: '#e9d5ff', accentColor: '#8b5cf6', backgroundColor: '#ffffff', textColor: '#1f2937', questionColor: '#4c1d95', answerColor: '#4c1d95', descriptionColor: '#4b5563', optionTextColor: '#4b5563', selectedOptionColor: '#7c3aed', placeholderColor: '#ffffff', placeholderTextColor: '#D0D5DD', buttonTextColor: '#ffffff', borderColor: '#D0D5DD', fontFamily: 'Inter', fontSize: 'medium', borderRadius: 'medium', shadow: 'small', alignment: 'left' } },
    { id: 'ruby-red', name: 'Ruby Red', primary: '#dc2626', theme: { primaryColor: '#dc2626', secondaryColor: '#fecaca', accentColor: '#ef4444', backgroundColor: '#ffffff', textColor: '#1f2937', questionColor: '#7f1d1d', answerColor: '#7f1d1d', descriptionColor: '#4b5563', optionTextColor: '#4b5563', selectedOptionColor: '#dc2626', placeholderColor: '#ffffff', placeholderTextColor: '#D0D5DD', buttonTextColor: '#ffffff', borderColor: '#D0D5DD', fontFamily: 'Inter', fontSize: 'medium', borderRadius: 'medium', shadow: 'small', alignment: 'left' } },
    { id: 'monochrome', name: 'Monochrome', primary: '#374151', theme: { primaryColor: '#374151', secondaryColor: '#e5e7eb', accentColor: '#4b5563', backgroundColor: '#ffffff', textColor: '#1f2937', questionColor: '#111827', answerColor: '#111827', descriptionColor: '#6b7280', optionTextColor: '#6b7280', selectedOptionColor: '#374151', placeholderColor: '#ffffff', placeholderTextColor: '#D0D5DD', buttonTextColor: '#ffffff', borderColor: '#D0D5DD', fontFamily: 'Inter', fontSize: 'medium', borderRadius: 'medium', shadow: 'none', alignment: 'left' } },
    { id: 'midnight-dark', name: 'Midnight Dark', primary: '#1f2937', theme: { primaryColor: '#1f2937', secondaryColor: '#111827', accentColor: '#374151', backgroundColor: '#000000', textColor: '#f9fafb', questionColor: '#f9fafb', answerColor: '#f9fafb', descriptionColor: '#d1d5db', optionTextColor: '#d1d5db', selectedOptionColor: '#1f2937', placeholderColor: '#374151', placeholderTextColor: '#9ca3af', buttonTextColor: '#ffffff', borderColor: '#374151', fontFamily: 'Inter', fontSize: 'medium', borderRadius: 'medium', shadow: 'large', alignment: 'left' } },
    { id: 'teal-oasis', name: 'Teal Oasis', primary: '#14b8a6', theme: { primaryColor: '#14b8a6', secondaryColor: '#ccfbf1', accentColor: '#0d9488', backgroundColor: '#f0fdfa', textColor: '#134e4a', questionColor: '#134e4a', answerColor: '#134e4a', descriptionColor: '#115e59', optionTextColor: '#115e59', selectedOptionColor: '#14b8a6', placeholderColor: '#ffffff', placeholderTextColor: '#D0D5DD', buttonTextColor: '#ffffff', borderColor: '#14b8a6', fontFamily: 'Inter', fontSize: 'medium', borderRadius: 'medium', shadow: 'small', alignment: 'left' } },
    { id: 'coral-pink', name: 'Coral Pink', primary: '#f43f5e', theme: { primaryColor: '#f43f5e', secondaryColor: '#fecdd3', accentColor: '#fb7185', backgroundColor: '#ffffff', textColor: '#1f2937', questionColor: '#881337', answerColor: '#881337', descriptionColor: '#4b5563', optionTextColor: '#4b5563', selectedOptionColor: '#f43f5e', placeholderColor: '#ffffff', placeholderTextColor: '#D0D5DD', buttonTextColor: '#ffffff', borderColor: '#D0D5DD', fontFamily: 'Inter', fontSize: 'medium', borderRadius: 'medium', shadow: 'small', alignment: 'left' } },
    { id: 'amber-gold', name: 'Amber Gold', primary: '#f59e0b', theme: { primaryColor: '#f59e0b', secondaryColor: '#fef3c7', accentColor: '#fbbf24', backgroundColor: '#ffffff', textColor: '#1f2937', questionColor: '#78350f', answerColor: '#78350f', descriptionColor: '#4b5563', optionTextColor: '#4b5563', selectedOptionColor: '#f59e0b', placeholderColor: '#ffffff', placeholderTextColor: '#D0D5DD', buttonTextColor: '#ffffff', borderColor: '#D0D5DD', fontFamily: 'Inter', fontSize: 'medium', borderRadius: 'medium', shadow: 'small', alignment: 'left' } },
    { id: 'indigo-night', name: 'Indigo Night', primary: '#4f46e5', theme: { primaryColor: '#4f46e5', secondaryColor: '#e0e7ff', accentColor: '#6366f1', backgroundColor: '#ffffff', textColor: '#1f2937', questionColor: '#312e81', answerColor: '#312e81', descriptionColor: '#4b5563', optionTextColor: '#4b5563', selectedOptionColor: '#4f46e5', placeholderColor: '#ffffff', placeholderTextColor: '#D0D5DD', buttonTextColor: '#ffffff', borderColor: '#D0D5DD', fontFamily: 'Inter', fontSize: 'medium', borderRadius: 'medium', shadow: 'small', alignment: 'left' } },
    { id: 'lime-fresh', name: 'Lime Fresh', primary: '#84cc16', theme: { primaryColor: '#84cc16', secondaryColor: '#ecfccb', accentColor: '#a3e635', backgroundColor: '#ffffff', textColor: '#1f2937', questionColor: '#365314', answerColor: '#365314', descriptionColor: '#4b5563', optionTextColor: '#4b5563', selectedOptionColor: '#84cc16', placeholderColor: '#ffffff', placeholderTextColor: '#D0D5DD', buttonTextColor: '#ffffff', borderColor: '#D0D5DD', fontFamily: 'Inter', fontSize: 'medium', borderRadius: 'medium', shadow: 'small', alignment: 'left' } },
    { id: 'cyan-sky', name: 'Cyan Sky', primary: '#06b6d4', theme: { primaryColor: '#06b6d4', secondaryColor: '#cffafe', accentColor: '#22d3ee', backgroundColor: '#ffffff', textColor: '#1f2937', questionColor: '#164e63', answerColor: '#164e63', descriptionColor: '#4b5563', optionTextColor: '#4b5563', selectedOptionColor: '#06b6d4', placeholderColor: '#ffffff', placeholderTextColor: '#D0D5DD', buttonTextColor: '#ffffff', borderColor: '#D0D5DD', fontFamily: 'Inter', fontSize: 'medium', borderRadius: 'medium', shadow: 'small', alignment: 'left' } },
  ]

  const fontFamilies = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway', 'Source Sans Pro', 'Ubuntu', 'Nunito', 'Work Sans']

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      if (prev.has(sectionId)) return new Set()
      return new Set([sectionId])
    })
  }

  const applyThemePreset = (preset: typeof themePresets[0]) => {
    if (preset.id === 'custom') {
      updateDesign({ themePreset: 'custom' })
    } else {
      updateDesign({ themePreset: preset.id, ...preset.theme })
    }
  }

  const ColorPicker = ({ label, value, onChange, helperText }: { label: string; value: string; onChange: (value: string) => void; helperText?: string }) => (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {helperText && <span className="text-xs text-gray-500 ml-1">({helperText})</span>}
      </label>
      <div className="flex items-center gap-2">
        <label className="relative inline-block">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div
            className="w-10 h-10 rounded border border-gray-300 shadow-inner"
            style={{ backgroundColor: value }}
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 h-10 px-2 text-xs border border-gray-300 rounded"
        />
      </div>
    </div>
  )

  const NumberInput = ({ label, value, onChange, min, max }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) => (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value) || 0)} min={min} max={max} className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
    </div>
  )

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-4 py-3">
          <h1 className="text-base font-bold text-gray-900">Design Settings</h1>
          <p className="text-xs text-gray-500 mt-1">Customize the look and feel of your form</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Theme Management Section - Collapsible */}
          <div className="mb-4">
        <button onClick={() => toggleSection('themes')} className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded transition-colors">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gray-700" />
            <span className="text-xs font-semibold text-gray-900">Choose Theme</span>
          </div>
          {expandedSections.has('themes') ? <ChevronUp className="h-3 w-3 text-gray-500" /> : <ChevronDown className="h-3 w-3 text-gray-500" />}
        </button>
        
        {expandedSections.has('themes') && (
          <div className="mt-2">
          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
            {themePresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyThemePreset(preset)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all ${designSettings.themePreset === preset.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-300'}`}
                style={{ backgroundColor: preset.theme.backgroundColor || '#fff' }}
              >
                <div className="p-3 relative z-10">
                  <div className="text-xs font-semibold mb-2 text-left" style={{ color: preset.theme.questionColor || '#101828' }}>{preset.name}</div>
                  <div className="rounded px-2 py-1 text-xs mb-2 text-left" style={{ backgroundColor: preset.theme.placeholderColor || '#fff', borderColor: preset.theme.borderColor || '#D0D5DD', borderWidth: '1px', borderStyle: 'solid', color: preset.theme.placeholderTextColor || '#D0D5DD' }}>theme</div>
                  <div className="rounded px-3 py-1 text-xs inline-block" style={{ backgroundColor: preset.theme.primaryColor || preset.primary, color: preset.theme.buttonTextColor || '#fff' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
                </div>
                {designSettings.themePreset === preset.id && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center z-20">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          </div>
        )}
      </div>

      {/* Colors Section */}
      <div className="mb-4">
        <button onClick={() => toggleSection('colors')} className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded transition-colors">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-gray-700" />
            <span className="text-xs font-semibold text-gray-900">Colors</span>
          </div>
          {expandedSections.has('colors') ? <ChevronUp className="h-3 w-3 text-gray-500" /> : <ChevronDown className="h-3 w-3 text-gray-500" />}
        </button>
        
        {expandedSections.has('colors') && (
          <div className="mt-2 space-y-2">
            <ColorPicker label="Primary Color" value={designSettings.primaryColor} onChange={(value) => { updateDesign({ primaryColor: value }); updateDesign({ selectedOptionColor: value }) }} />
            <ColorPicker label="Secondary Color" value={designSettings.secondaryColor} onChange={(value) => updateDesign({ secondaryColor: value })} />
            <ColorPicker label="Background Color" value={designSettings.backgroundColor} onChange={(value) => updateDesign({ backgroundColor: value })} />
            <ColorPicker label="Text Color" value={designSettings.textColor} onChange={(value) => updateDesign({ textColor: value })} />
            <ColorPicker label="Question Color" value={designSettings.questionColor} onChange={(value) => updateDesign({ questionColor: value })} />
            <ColorPicker label="Border Color" value={designSettings.borderColor} onChange={(value) => updateDesign({ borderColor: value })} />
            <ColorPicker label="Button Text Color" value={designSettings.buttonTextColor} onChange={(value) => updateDesign({ buttonTextColor: value })} />
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Border Radius</label>
              <select value={designSettings.borderRadius || 'medium'} onChange={(e) => updateDesign({ borderRadius: e.target.value })} className="w-full px-2 py-1 text-xs border border-gray-300 rounded">
                <option value="none">None</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="full">Full</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Shadow</label>
              <select value={designSettings.shadow || 'none'} onChange={(e) => updateDesign({ shadow: e.target.value })} className="w-full px-2 py-1 text-xs border border-gray-300 rounded">
                <option value="none">None</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div className="mb-3 border border-dashed border-gray-200 rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-gray-700" />
                  <span className="text-xs font-semibold text-gray-900">Background Cover</span>
                </div>
                <div className="flex items-center gap-2 text-[12px]">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="background-type"
                      value="solid"
                      checked={designSettings.backgroundType === 'solid'}
                      onChange={() => updateDesign({ backgroundType: 'solid' })}
                      className="h-3 w-3"
                    />
                    Solid
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="background-type"
                      value="image"
                      checked={designSettings.backgroundType === 'image'}
                      onChange={() => updateDesign({ backgroundType: 'image' })}
                      className="h-3 w-3"
                    />
                    Image
                  </label>
                </div>
              </div>

              {designSettings.backgroundType === 'solid' ? (
                <ColorPicker
                  label="Page Background Color"
                  value={designSettings.backgroundColor}
                  onChange={(value) => updateDesign({ backgroundColor: value })}
                  helperText="Canvas background"
                />
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={designSettings.backgroundImage || ''}
                      onChange={(e) => updateDesign({ backgroundImage: e.target.value })}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="https://images.example.com/cover.jpg"
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                    <label className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                      <Upload className="h-4 w-4 text-gray-600" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onload = () => {
                            updateDesign({ backgroundImage: reader.result as string })
                            toast.success('Background image added')
                          }
                          reader.onerror = () => toast.error('Failed to read image')
                          reader.readAsDataURL(file)
                        }}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[12px] text-gray-700 mb-1">Size</label>
                      <select
                        value={designSettings.backgroundSize || 'cover'}
                        onChange={(e) => updateDesign({ backgroundSize: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="cover">Cover</option>
                        <option value="contain">Contain</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] text-gray-700 mb-1">Position</label>
                      <select
                        value={designSettings.backgroundPosition || 'center'}
                        onChange={(e) => updateDesign({ backgroundPosition: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="center">Center</option>
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                        <option value="top left">Top Left</option>
                        <option value="top right">Top Right</option>
                        <option value="bottom left">Bottom Left</option>
                        <option value="bottom right">Bottom Right</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] text-gray-700 mb-1">Repeat</label>
                      <select
                        value={designSettings.backgroundRepeat || 'no-repeat'}
                        onChange={(e) => updateDesign({ backgroundRepeat: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="no-repeat">No Repeat</option>
                        <option value="repeat">Repeat</option>
                        <option value="repeat-x">Repeat X</option>
                        <option value="repeat-y">Repeat Y</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] text-gray-700 mb-1">Attachment</label>
                      <select
                        value={designSettings.backgroundAttachment || 'scroll'}
                        onChange={(e) => updateDesign({ backgroundAttachment: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="scroll">Scroll</option>
                        <option value="fixed">Fixed (parallax)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Typography Section */}
      <div className="mb-4">
        <button onClick={() => toggleSection('typography')} className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded transition-colors">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-gray-700" />
            <span className="text-xs font-semibold text-gray-900">Typography</span>
          </div>
          {expandedSections.has('typography') ? <ChevronUp className="h-3 w-3 text-gray-500" /> : <ChevronDown className="h-3 w-3 text-gray-500" />}
        </button>
        
        {expandedSections.has('typography') && (
          <div className="mt-2 space-y-2">
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Font</label>
              <select value={designSettings.fontFamily} onChange={(e) => updateDesign({ fontFamily: e.target.value })} className="w-full px-2 py-1 text-xs border border-gray-300 rounded">
                {fontFamilies.map((font) => (<option key={font} value={font}>{font}</option>))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumberInput label="Question Size" value={designSettings.questionFontSize} onChange={(value) => updateDesign({ questionFontSize: value })} min={8} max={48} />
              <NumberInput label="Description Size" value={designSettings.descriptionFontSize} onChange={(value) => updateDesign({ descriptionFontSize: value })} min={8} max={32} />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Question Font Weight</label>
              <select value={designSettings.questionFontWeight || 600} onChange={(e) => updateDesign({ questionFontWeight: parseInt(e.target.value) })} className="w-full px-2 py-1 text-xs border border-gray-300 rounded">
                <option value="300">Light</option>
                <option value="400">Normal</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
                <option value="700">Bold</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Layout Section */}
      <div className="mb-4">
        <button onClick={() => toggleSection('layout')} className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded transition-colors">
          <div className="flex items-center gap-2">
            <Layout className="h-4 w-4 text-gray-700" />
            <span className="text-xs font-semibold text-gray-900">Layout</span>
          </div>
          {expandedSections.has('layout') ? <ChevronUp className="h-3 w-3 text-gray-500" /> : <ChevronDown className="h-3 w-3 text-gray-500" />}
        </button>
        
        {expandedSections.has('layout') && (
          <div className="mt-2 space-y-2">
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Form Width (px)</label>
              <input type="number" value={designSettings.formWidth || 750} onChange={(e) => updateDesign({ formWidth: parseInt(e.target.value) })} className="w-full px-2 py-1 text-xs border border-gray-300 rounded" min="300" max="1200" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumberInput label="Field Top Margin" value={designSettings.fieldTopMargin} onChange={(value) => updateDesign({ fieldTopMargin: value })} min={0} max={50} />
              <NumberInput label="Field Bottom Margin" value={designSettings.fieldBottomMargin} onChange={(value) => updateDesign({ fieldBottomMargin: value })} min={0} max={50} />
            </div>
            <NumberInput label="Fields Spacing" value={designSettings.fieldsSpacing} onChange={(value) => updateDesign({ fieldsSpacing: value })} min={0} max={100} />
          </div>
        )}
      </div>

      {/* Components Section */}
      <div className="mb-4">
        <button onClick={() => toggleSection('components')} className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded transition-colors">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gray-700" />
            <span className="text-xs font-semibold text-gray-900">Components</span>
          </div>
          {expandedSections.has('components') ? <ChevronUp className="h-3 w-3 text-gray-500" /> : <ChevronDown className="h-3 w-3 text-gray-500" />}
        </button>
        
        {expandedSections.has('components') && (
          <div className="mt-2 space-y-2">
            <div className="mb-3">
              <label className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">Show Progress Bar</span>
                <button onClick={() => updateDesign({ showProgressBar: !designSettings.showProgressBar })} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${designSettings.showProgressBar ? 'bg-gray-900' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${designSettings.showProgressBar ? 'translate-x-3' : 'translate-x-1'}`} />
                </button>
              </label>
            </div>
            <div className="mb-3">
              <label className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">Show Question Numbers</span>
                <button onClick={() => updateDesign({ showQuestionNumbers: !designSettings.showQuestionNumbers })} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${designSettings.showQuestionNumbers ? 'bg-gray-900' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${designSettings.showQuestionNumbers ? 'translate-x-3' : 'translate-x-1'}`} />
                </button>
              </label>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Label Position</label>
              <select value={designSettings.labelPosition || 'top'} onChange={(e) => updateDesign({ labelPosition: e.target.value })} className="w-full px-2 py-1 text-xs border border-gray-300 rounded">
                <option value="top">Top</option>
                <option value="left">Left (Inline)</option>
                <option value="floating">Floating</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Required Indicator</label>
              <select value={designSettings.requiredIndicator || 'asterisk'} onChange={(e) => updateDesign({ requiredIndicator: e.target.value })} className="w-full px-2 py-1 text-xs border border-gray-300 rounded">
                <option value="asterisk">Asterisk (*)</option>
                <option value="text">(Required)</option>
                <option value="badge">Badge</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Buttons Section */}
      <div className="mb-4">
        <button onClick={() => toggleSection('buttons')} className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded transition-colors">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-gray-700" />
            <span className="text-xs font-semibold text-gray-900">Buttons</span>
          </div>
          {expandedSections.has('buttons') ? <ChevronUp className="h-3 w-3 text-gray-500" /> : <ChevronDown className="h-3 w-3 text-gray-500" />}
        </button>
        
        {expandedSections.has('buttons') && (
          <div className="mt-2 space-y-2">
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Submit Button Text</label>
              <input type="text" value={designSettings.buttonText || 'Submit'} onChange={(e) => updateDesign({ buttonText: e.target.value })} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Button Position</label>
              <select value={designSettings.buttonPosition || 'left'} onChange={(e) => updateDesign({ buttonPosition: e.target.value })} className="w-full px-2 py-1 text-xs border border-gray-300 rounded">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="full">Full Width</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Button Text Alignment</label>
              <select value={designSettings.buttonTextAlign || 'center'} onChange={(e) => updateDesign({ buttonTextAlign: e.target.value })} className="w-full px-2 py-1 text-xs border border-gray-300 rounded">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ColorPicker
                label="Button Color"
                value={designSettings.primaryColor}
                onChange={(value) => updateDesign({ primaryColor: value, primaryButtonBackground: value })}
              />
              <ColorPicker
                label="Button Text Color"
                value={designSettings.buttonTextColor}
                onChange={(value) => updateDesign({ buttonTextColor: value, primaryButtonText: value })}
              />
            </div>
            <div className="mb-3">
              <label className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">Show Back Button</span>
                <button onClick={() => updateDesign({ showBackButton: !designSettings.showBackButton })} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${designSettings.showBackButton ? 'bg-gray-900' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${designSettings.showBackButton ? 'translate-x-3' : 'translate-x-1'}`} />
                </button>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Section */}
      <div className="mb-4">
        <button onClick={() => toggleSection('advanced')} className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded transition-colors">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-700" />
            <span className="text-xs font-semibold text-gray-900">Advanced</span>
          </div>
          {expandedSections.has('advanced') ? <ChevronUp className="h-3 w-3 text-gray-500" /> : <ChevronDown className="h-3 w-3 text-gray-500" />}
        </button>
        
        {expandedSections.has('advanced') && (
          <div className="mt-2 space-y-2">
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Custom CSS</label>
              <textarea value={designSettings.customCSS || ''} onChange={(e) => updateDesign({ customCSS: e.target.value })} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} className="w-full px-2 py-1 text-xs border border-gray-300 rounded font-mono" rows={4} placeholder="/* Add your custom CSS here */" />
            </div>
            <div className="mb-3">
              <label className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">Remove Branding</span>
                <button onClick={() => updateDesign({ removeBranding: !designSettings.removeBranding })} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${designSettings.removeBranding ? 'bg-gray-900' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${designSettings.removeBranding ? 'translate-x-3' : 'translate-x-1'}`} />
                </button>
              </label>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Animation</label>
              <select value={designSettings.animation || 'none'} onChange={(e) => updateDesign({ animation: e.target.value })} className="w-full px-2 py-1 text-xs border border-gray-300 rounded">
                <option value="none">None</option>
                <option value="fade">Fade In</option>
                <option value="slide">Slide Up</option>
                <option value="zoom">Zoom In</option>
                <option value="bounce">Bounce</option>
              </select>
            </div>
          </div>
        )}
      </div>
        </div>
      </div>
    </div>
  )
}

export default DesignPanelSidebar

