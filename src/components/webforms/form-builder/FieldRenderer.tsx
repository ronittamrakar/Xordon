/**
 * Comprehensive Field Renderer
 * Handles ALL 111 form field types for preview and public submission
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
    Star, ThumbsUp, ThumbsDown, Upload, X, Image, Video, Music, Camera, Package,
    Calendar, Edit3, Repeat, Plus, Clock, FileTextIcon, Code, Users2, Flag, Sparkles,
    Calculator, Bot, Webhook, Locate, Shield, UserCircle, Key, Minus, Heart,
    CheckCircle, Mail, Phone, Globe, DollarSign, MapPin
} from 'lucide-react';
import { FormField } from './types';

interface FieldRendererProps {
    field: FormField;
    value: any;
    onChange: (value: any) => void;
    designSettings?: any;
    showLabel?: boolean;
    showDescription?: boolean;
    fieldNumber?: number;
    allValues?: Record<string, any>;
    onFieldChange?: (fieldId: string | number, value: any) => void;
}

export function FieldRenderer({
    field,
    value,
    onChange,
    designSettings = {},
    showLabel = true,
    showDescription = true,
    fieldNumber,
    allValues = {},
    onFieldChange = () => { },
}: FieldRendererProps) {
    const fieldType = field.field_type || (field as any).type;
    const [files, setFiles] = useState<File[]>([]);

    // Styling from design settings
    const primaryColor = designSettings.primaryColor || '#6366F1';
    const textColor = designSettings.textColor || '#374151';
    const borderRadius = designSettings.borderRadius || '0.375rem';

    const labelStyle = {
        color: designSettings.questionColor || textColor,
        fontSize: `${designSettings.questionFontSize || 16}px`,
    };

    const inputStyle = {
        borderRadius,
        borderColor: designSettings.borderColor || '#d1d5db',
    };

    // Render label
    const renderLabel = () => {
        if (!showLabel) return null;

        // Skip label for layout and formatting fields
        if (['layout_2col', 'layout_3col', 'layout_4col', 'section', 'page_break', 'divider', 'spacer', 'html', 'custom_embed', 'image', 'video', 'audio', 'cover', 'welcome_page', 'ending', 'field_group', 'repeater_group', 'container', 'heading', 'paragraph', 'explanation', 'image_block', 'video_block'].includes(fieldType)) {
            return null;
        }

        return (
            <Label style={labelStyle} className="block mb-2 font-medium">
                {fieldNumber ? <span className="mr-2">{fieldNumber}.</span> : null}
                {field.label}
                {field.required ? <span className="text-red-500 ml-1">*</span> : null}
            </Label>
        );
    };

    // Render description
    const renderDescription = () => {
        if (!showDescription || !field.description) return null;

        // Skip description for layout and formatting fields
        if (['layout_2col', 'layout_3col', 'layout_4col', 'section', 'page_break', 'divider', 'spacer', 'html', 'custom_embed', 'image', 'video', 'audio', 'cover', 'welcome_page', 'ending', 'field_group', 'repeater_group', 'container', 'heading', 'paragraph', 'explanation'].includes(fieldType)) {
            return null;
        }

        return (
            <p
                className="text-sm mb-2 text-muted-foreground"
                style={{
                    fontSize: `${designSettings.descriptionFontSize || 14}px`,
                }}
            >
                {field.description}
            </p>
        );
    };

    // Hidden fields
    if (fieldType === 'hidden') return null;

    // Formatting fields (non-input)
    if (['heading', 'paragraph', 'explanation', 'divider', 'spacer', 'section', 'page_break', 'cover', 'welcome_page', 'ending'].includes(fieldType)) {
        switch (fieldType) {
            case 'cover':
            case 'welcome_page':
            case 'ending':
                return (
                    <div className="text-center py-16 px-6 border-2 border-primary/20 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10" style={{ marginBottom: `${designSettings.fieldsSpacing || 24}px` }}>
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            {fieldType === 'ending' ? <Flag className="h-8 w-8 text-primary" style={{ color: primaryColor }} /> : <Sparkles className="h-8 w-8 text-primary" style={{ color: primaryColor }} />}
                        </div>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: textColor }}>
                            {field.heading_text || field.label}
                        </h2>
                        {field.paragraph_text && (
                            <p className="text-lg mb-8 text-muted-foreground whitespace-pre-wrap max-w-2xl mx-auto">
                                {field.paragraph_text}
                            </p>
                        )}
                        {field.button_text && (
                            <Button size="lg" style={{ backgroundColor: primaryColor }} className="px-8 shadow-lg">
                                {field.button_text}
                            </Button>
                        )}
                    </div>
                );

            case 'heading':
                const HeadingTag = `h${field.heading_level || 2}` as keyof JSX.IntrinsicElements;
                return (
                    <HeadingTag
                        style={{
                            ...labelStyle,
                            fontSize: `${(designSettings.questionFontSize || 16) + (6 - (field.heading_level || 2)) * 4}px`,
                            fontWeight: 'bold',
                            marginBottom: `${designSettings.fieldsSpacing || 16}px`,
                        }}
                    >
                        {field.heading_text || field.label}
                    </HeadingTag>
                );

            case 'paragraph':
            case 'explanation':
                return (
                    <p
                        style={{
                            color: textColor,
                            fontSize: `${designSettings.descriptionFontSize || 14}px`,
                            lineHeight: 1.7,
                            marginBottom: `${designSettings.fieldsSpacing || 16}px`,
                        }}
                        className="whitespace-pre-wrap"
                    >
                        {field.paragraph_text || field.label}
                    </p>
                );

            case 'divider':
                return (
                    <hr
                        style={{
                            borderStyle: field.divider_style || 'solid',
                            borderColor: designSettings.borderColor || '#e5e7eb',
                            borderWidth: `${field.thickness || 1}px 0 0 0`,
                            margin: `${designSettings.fieldsSpacing || 24}px 0`,
                        }}
                    />
                );

            case 'spacer':
                return <div style={{ height: `${field.spacer_height || 24}px` }} />;

            case 'section':
                return (
                    <div style={{ marginBottom: `${designSettings.fieldsSpacing || 24}px` }} className="pt-6 border-t-2">
                        <h3 style={{ ...labelStyle, fontSize: `${(designSettings.questionFontSize || 16) + 4}px`, fontWeight: '600', marginBottom: '12px' }}>
                            {field.section_title || field.label}
                        </h3>
                        {field.section_description && (
                            <p style={{ color: designSettings.descriptionColor || '#6b7280', fontSize: '14px' }}>{field.section_description}</p>
                        )}
                    </div>
                );

            case 'page_break':
                return (
                    <div className="flex items-center gap-4 my-8">
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1 bg-muted rounded-full">Page Break</span>
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-border via-border to-transparent" />
                    </div>
                );

            default:
                return null;
        }
    }

    // Input fields wrapper
    return (
        <div style={{ marginBottom: `${designSettings.fieldsSpacing || 20}px` }}>
            {renderLabel()}
            {renderDescription()}
            {renderFieldInput()}
        </div>
    );

    function renderFieldInput() {
        switch (fieldType) {
            // Basic Text Fields
            case 'text':
            case 'firstname':
            case 'first_name':
            case 'lastname':
            case 'last_name':
            case 'fullname':
            case 'full_name':
            case 'company':
            case 'jobtitle':
                return (
                    <Input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder || ''}
                        required={field.required}
                        maxLength={field.max_length}
                        minLength={field.min_length}
                        style={inputStyle}
                        className="w-full"
                    />
                );

            case 'masked_text':
            case 'password':
            case 'credit_card':
                return (
                    <Input
                        type="password"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder || '••••••••'}
                        required={field.required}
                        maxLength={field.max_length}
                        minLength={field.min_length}
                        style={inputStyle}
                        className="w-full"
                    />
                );

            case 'email':
                return (
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="email"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={field.placeholder || 'your.email@example.com'}
                            required={field.required}
                            style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                            className="w-full"
                        />
                    </div>
                );

            case 'phone':
                return (
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="tel"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={field.placeholder || '(555) 123-4567'}
                            required={field.required}
                            style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                            className="w-full"
                        />
                    </div>
                );

            case 'url':
                return (
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="url"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={field.placeholder || 'https://example.com'}
                            required={field.required}
                            style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                            className="w-full"
                        />
                    </div>
                );

            case 'number':
            case 'price':
                return (
                    <div className="relative">
                        {field.prefix ? (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                {field.prefix}
                            </span>
                        ) : null}
                        <Input
                            type="number"
                            value={value || ''}
                            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                            placeholder={field.placeholder || '0'}
                            required={field.required}
                            min={field.validation?.min_value}
                            max={field.validation?.max_value}
                            step={field.validation?.step || (fieldType === 'price' ? 0.01 : 1)}
                            style={{ ...inputStyle, paddingLeft: field.prefix ? '2.5rem' : undefined, paddingRight: field.suffix ? '2.5rem' : undefined }}
                            className="w-full"
                        />
                        {field.suffix ? (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                {field.suffix}
                            </span>
                        ) : null}
                    </div>
                );

            case 'textarea':
            case 'rich_text':
                return (
                    <Textarea
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder || ''}
                        required={field.required}
                        rows={field.rows || 4}
                        maxLength={field.max_length}
                        style={inputStyle}
                        className={cn("w-full resize-y", fieldType === 'rich_text' && "min-h-[150px] font-serif")}
                    />
                );

            // Date & Time Fields
            case 'date':
                return (
                    <Input
                        type="date"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        required={field.required}
                        style={inputStyle}
                        className="w-full"
                    />
                );

            case 'time':
                return (
                    <Input
                        type="time"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        required={field.required}
                        style={inputStyle}
                        className="w-full"
                    />
                );

            case 'datetime':
                return (
                    <Input
                        type="datetime-local"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        required={field.required}
                        style={inputStyle}
                        className="w-full"
                    />
                );

            case 'scheduler':
            case 'appointment':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/10">
                            <Calendar className="h-5 w-5 text-primary" style={{ color: primaryColor }} />
                            <span className="text-sm font-medium">Select Date & Time</span>
                        </div>
                        <Input
                            type="datetime-local"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            style={inputStyle}
                            className="w-full"
                        />
                    </div>
                );

            case 'timer':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/10">
                            <Clock className="h-5 w-5 text-primary" style={{ color: primaryColor }} />
                            <div className="flex-1">
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all" style={{ width: `${((value || 0) / (field.slider_max || 60)) * 100}%`, backgroundColor: primaryColor }} />
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>{value || 0}{field.suffix || ' min'}</span>
                                    <span>{field.slider_max || 60}{field.suffix || ' min'}</span>
                                </div>
                            </div>
                        </div>
                        <Slider
                            value={[value || field.slider_min || 0]}
                            onValueChange={(vals) => onChange(vals[0])}
                            min={field.slider_min || 0}
                            max={field.slider_max || 60}
                            step={field.slider_step || 5}
                            className="w-full"
                        />
                    </div>
                );

            // Choice Fields
            case 'select':
            case 'dropdown':
            case 'number_dropdown':
                return (
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        required={field.required}
                        style={inputStyle}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                        <option value="">{field.placeholder || 'Select an option...'}</option>
                        {(field.options || []).map((opt: any, i: number) => (
                            <option key={i} value={typeof opt === 'string' ? opt : opt.value || opt.label}>
                                {typeof opt === 'string' ? opt : opt.label || opt.value}
                            </option>
                        ))}
                    </select>
                );

            case 'radio':
                return (
                    <div className="space-y-2">
                        {(field.options || []).map((opt: any, i: number) => {
                            const optValue = typeof opt === 'string' ? opt : opt.value || opt.label;
                            const optLabel = typeof opt === 'string' ? opt : opt.label || opt.value;
                            return (
                                <label key={i} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                    <input
                                        type="radio"
                                        name={`field_${field.id}`}
                                        value={optValue}
                                        checked={value === optValue}
                                        onChange={(e) => onChange(e.target.value)}
                                        required={field.required}
                                        style={{ accentColor: primaryColor }}
                                        className="w-4 h-4"
                                    />
                                    <span style={{ color: textColor }}>{optLabel}</span>
                                </label>
                            );
                        })}
                    </div>
                );

            case 'checkbox':
            case 'multiselect':
            case 'multiple_choice':
                return (
                    <div className="space-y-2">
                        {(field.options || []).map((opt: any, i: number) => {
                            const optValue = typeof opt === 'string' ? opt : opt.value || opt.label;
                            const optLabel = typeof opt === 'string' ? opt : opt.label || opt.value;
                            const checked = Array.isArray(value) ? value.includes(optValue) : false;

                            return (
                                <label key={i} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                                    <Checkbox
                                        checked={checked}
                                        onCheckedChange={(isChecked) => {
                                            const current = Array.isArray(value) ? value : [];
                                            if (isChecked) {
                                                onChange([...current, optValue]);
                                            } else {
                                                onChange(current.filter((v: string) => v !== optValue));
                                            }
                                        }}
                                        style={{ accentColor: primaryColor }}
                                    />
                                    <span className="text-sm group-hover:text-primary transition-colors" style={{ color: textColor }}>{optLabel}</span>
                                </label>
                            );
                        })}
                    </div>
                );

            case 'picture_choice':
                return (
                    <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${field.picture_columns || 3}, 1fr)` }}>
                        {(field.picture_options || []).map((opt: any, i: number) => (
                            <div
                                key={i}
                                onClick={() => onChange(opt.value)}
                                className={`cursor-pointer border-2 rounded-xl p-3 transition-all hover:shadow-lg ${value === opt.value ? 'ring-2 shadow-md' : ''
                                    }`}
                                style={{
                                    borderColor: value === opt.value ? primaryColor : '#d1d5db',
                                    ringColor: primaryColor,
                                }}
                            >
                                {opt.image_url && (
                                    <img
                                        src={opt.image_url}
                                        alt={opt.label}
                                        className="w-full h-32 object-cover rounded-lg mb-2"
                                        style={{ objectFit: field.image_fit || 'cover' }}
                                    />
                                )}
                                <p className="text-sm text-center font-medium" style={{ color: textColor }}>{opt.label}</p>
                            </div>
                        ))}
                    </div>
                );

            // Yes/No & Toggle
            case 'thumbs':
            case 'like_dislike':
                return (
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => onChange('like')}
                            className={cn(
                                "flex-1 p-6 rounded-xl border-2 transition-all hover:shadow-lg",
                                value === 'like' ? "border-primary bg-primary/10 shadow-md" : "hover:border-primary/50"
                            )}
                            style={{ borderColor: value === 'like' ? primaryColor : undefined }}
                        >
                            <ThumbsUp className={cn("h-10 w-10 mx-auto mb-2", value === 'like' ? "text-primary" : "text-muted-foreground")} style={{ color: value === 'like' ? primaryColor : undefined }} />
                            <span className="text-sm font-medium block" style={{ color: textColor }}>{field.yes_label || 'Like'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onChange('dislike')}
                            className={cn(
                                "flex-1 p-6 rounded-xl border-2 transition-all hover:shadow-lg",
                                value === 'dislike' ? "border-primary bg-primary/10 shadow-md" : "hover:border-primary/50"
                            )}
                            style={{ borderColor: value === 'dislike' ? primaryColor : undefined }}
                        >
                            <ThumbsDown className={cn("h-10 w-10 mx-auto mb-2", value === 'dislike' ? "text-primary" : "text-muted-foreground")} style={{ color: value === 'dislike' ? primaryColor : undefined }} />
                            <span className="text-sm font-medium block" style={{ color: textColor }}>{field.no_label || 'Dislike'}</span>
                        </button>
                    </div>
                );

            case 'emoji':
                const emojis = ['😡', '🙁', '😐', '🙂', '😍'];
                return (
                    <div className="flex gap-3 justify-center">
                        {emojis.map((emoji, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => onChange(i + 1)}
                                className={cn(
                                    "text-2xl p-3 rounded-xl transition-all transform hover:scale-110",
                                    value === (i + 1) ? "bg-primary/10 scale-125 shadow-lg" : "hover:bg-muted/50"
                                )}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                );

            // Rating Fields
            case 'star_rating':
            case 'rating':
            case 'satisfaction':
                const starStyle = field.star_style || 'star';
                return (
                    <div className="flex gap-2 flex-wrap justify-center">
                        {Array.from({ length: field.max_stars || 5 }).map((_, i) => {
                            const active = i < (value || 0);
                            const ratingColor = active ? (field.rating_colors?.active || primaryColor) : '#d1d5db';

                            if (starStyle === 'number') {
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => onChange(i + 1)}
                                        className={cn(
                                            "w-12 h-12 rounded-full border-2 font-bold text-lg transition-all hover:scale-110",
                                            active ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-border hover:border-primary/50"
                                        )}
                                        style={{
                                            backgroundColor: active ? primaryColor : undefined,
                                            borderColor: active ? primaryColor : undefined
                                        }}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            }

                            if (starStyle === 'thumb') {
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => onChange(i + 1)}
                                        className="p-2 transition-transform hover:scale-110"
                                    >
                                        <ThumbsUp
                                            className="h-8 w-8"
                                            fill={active ? ratingColor : 'none'}
                                            style={{ color: ratingColor }}
                                        />
                                    </button>
                                );
                            }

                            if (starStyle === 'heart') {
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => onChange(i + 1)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Heart
                                            className="h-8 w-8"
                                            fill={active ? ratingColor : 'none'}
                                            style={{ color: ratingColor }}
                                        />
                                    </button>
                                );
                            }

                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => onChange(i + 1)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        className="h-8 w-8"
                                        fill={active ? ratingColor : 'none'}
                                        style={{ color: ratingColor }}
                                    />
                                </button>
                            );
                        })}
                    </div>
                );

            case 'slider':
            case 'scale':
            case 'nps':
            case 'leadscore':
                return (
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm font-medium" style={{ color: textColor }}>
                            <span>{field.scale_low_label || field.slider_min || 0}</span>
                            <span className="text-lg font-bold" style={{ color: primaryColor }}>{value || field.slider_min || 0}</span>
                            <span>{field.scale_high_label || field.slider_max || 100}</span>
                        </div>
                        <Slider
                            value={[value || field.slider_min || 0]}
                            onValueChange={(vals) => onChange(vals[0])}
                            min={field.slider_min || 0}
                            max={field.slider_max || 100}
                            step={field.slider_step || 1}
                            className="w-full"
                        />
                    </div>
                );

            case 'likert':
                return (
                    <div className="space-y-6">
                        {(field.likert_statements || []).map((statement: string, i: number) => (
                            <div key={i} className="space-y-3">
                                <p className="text-sm font-medium" style={{ color: textColor }}>{statement}</p>
                                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${(field.likert_labels || []).length}, 1fr)` }}>
                                    {(field.likert_labels || []).map((label: string, j: number) => (
                                        <label key={j} className="text-center">
                                            <input
                                                type="radio"
                                                name={`likert_${field.id}_${i}`}
                                                value={j}
                                                checked={value?.[i] === j}
                                                onChange={() => {
                                                    const newValue = { ...(value || {}), [i]: j };
                                                    onChange(newValue);
                                                }}
                                                className="sr-only"
                                            />
                                            <div
                                                className="p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md"
                                                style={{
                                                    backgroundColor: value?.[i] === j ? primaryColor : 'transparent',
                                                    borderColor: value?.[i] === j ? primaryColor : '#d1d5db',
                                                    color: value?.[i] === j ? '#ffffff' : textColor,
                                                }}
                                            >
                                                <span className="text-xs font-medium">{label}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'ranking':
                return (
                    <div className="space-y-2">
                        {(field.ranking_items || []).map((item: string, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg bg-card" style={inputStyle}>
                                <span className="font-bold text-muted-foreground text-lg">{i + 1}</span>
                                <span style={{ color: textColor }}>{item}</span>
                            </div>
                        ))}
                    </div>
                );

            // File Upload Fields
            case 'file':
            case 'image_upload':
                return (
                    <div className="space-y-3">
                        <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                            <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                            <Input
                                type="file"
                                onChange={(e) => {
                                    const fileList = e.target.files;
                                    if (fileList) {
                                        const filesArray = Array.from(fileList);
                                        setFiles(filesArray);
                                        onChange(filesArray);
                                    }
                                }}
                                accept={field.allowed_formats?.join(',') || (fieldType === 'image_upload' ? 'image/*' : '*')}
                                multiple={field.validation?.max_files && field.validation.max_files > 1}
                                className="hidden"
                                id={`file-${field.id}`}
                            />
                            <label htmlFor={`file-${field.id}`} className="cursor-pointer">
                                <p className="font-medium mb-1" style={{ color: textColor }}>Click to upload or drag and drop</p>
                                <p className="text-xs text-muted-foreground">
                                    {fieldType === 'image_upload' ? 'Images only' : 'Any file type'} • Max {field.max_file_size || 10}MB
                                </p>
                            </label>
                        </div>
                        {files.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {files.map((file, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm">
                                        <span className="truncate max-w-[200px]">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newFiles = files.filter((_, idx) => idx !== i);
                                                setFiles(newFiles);
                                                onChange(newFiles);
                                            }}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'yes_no':
            case 'true_false':
            case 'toggle':
                return (
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
                        <Switch
                            checked={value === true || value === 'yes' || value === 'true'}
                            onCheckedChange={(checked) => onChange(checked ? 'yes' : 'no')}
                        />
                        <span style={{ color: textColor }} className="font-medium text-lg">
                            {value === true || value === 'yes' || value === 'true'
                                ? (field.yes_label || 'Yes')
                                : (field.no_label || 'No')}
                        </span>
                    </div>
                );

            case 'signature':
            case 'drawing':
                return (
                    <div
                        className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                        style={{ ...inputStyle, minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Edit3 className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <p className="font-medium text-lg mb-2" style={{ color: textColor }}>Click to {fieldType === 'signature' ? 'sign' : 'draw'}</p>
                        <p className="text-sm text-muted-foreground">A canvas will open for your {fieldType}</p>
                        <div className="mt-6 w-full max-w-md h-[2px] bg-muted-foreground/30" />
                        <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">{fieldType} line</p>
                    </div>
                );

            // Location Fields
            case 'location':
            case 'address':
            case 'google_maps':
            case 'store_finder':
            case 'service_area':
                return (
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={field.placeholder || 'Enter location...'}
                            required={field.required}
                            style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                            className="w-full"
                        />
                    </div>
                );

            // Compliance Fields
            case 'legal_consent':
            case 'terms_of_service':
            case 'gdpr_agreement':
            case 'tcpa_consent':
                return (
                    <label className="flex items-start gap-3 cursor-pointer p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => onChange(e.target.checked)}
                            required={field.required}
                            style={{ accentColor: primaryColor }}
                            className="mt-1 w-4 h-4"
                        />
                        <span className="text-sm flex-1" style={{ color: textColor }}>
                            {field.consent_text || field.gdpr_text || field.tcpa_text || field.label}
                            {field.terms_link && (
                                <a href={field.terms_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1" style={{ color: primaryColor }}>
                                    View Terms
                                </a>
                            )}
                        </span>
                    </label>
                );

            // Media Fields
            case 'image':
            case 'image_block':
                return (
                    <div className="space-y-2">
                        {field.media_url ? (
                            <img
                                src={field.media_url}
                                alt={field.alt_text || ''}
                                className="rounded-xl max-w-full h-auto mx-auto shadow-lg"
                                style={{ maxHeight: '500px' }}
                            />
                        ) : (
                            <div className="aspect-video bg-muted rounded-xl flex flex-col items-center justify-center border-2 border-dashed">
                                <Image className="h-16 w-16 text-muted-foreground mb-3" />
                                <p className="text-sm text-muted-foreground font-medium">Image Placeholder</p>
                            </div>
                        )}
                        {field.paragraph_text && <p className="text-sm text-center text-muted-foreground mt-3">{field.paragraph_text}</p>}
                    </div>
                );

            case 'video':
            case 'video_block':
                return (
                    <div className="space-y-2">
                        {field.media_url ? (
                            <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
                                <video
                                    src={field.media_url}
                                    controls={field.show_controls !== false}
                                    autoPlay={field.autoplay}
                                    muted={field.muted}
                                    loop={field.loop}
                                    className="w-full h-full"
                                />
                            </div>
                        ) : (
                            <div className="aspect-video bg-muted rounded-xl flex flex-col items-center justify-center border-2 border-dashed">
                                <Video className="h-16 w-16 text-muted-foreground mb-3" />
                                <p className="text-sm text-muted-foreground font-medium">Video Placeholder</p>
                            </div>
                        )}
                    </div>
                );

            case 'audio':
                return (
                    <div className="space-y-2">
                        {field.media_url ? (
                            <audio
                                src={field.media_url}
                                controls={field.show_controls !== false}
                                autoPlay={field.autoplay}
                                loop={field.loop}
                                className="w-full"
                            />
                        ) : (
                            <div className="p-6 bg-muted rounded-xl flex items-center gap-4 border-2 border-dashed">
                                <Music className="h-10 w-10 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground font-medium">Audio Placeholder</p>
                            </div>
                        )}
                    </div>
                );

            case 'screenshot':
                return (
                    <div className="aspect-video bg-muted rounded-xl flex flex-col items-center justify-center border-2 border-dashed p-8">
                        <Camera className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground font-medium">Screenshot will be captured on submission</p>
                    </div>
                );

            case 'html':
            case 'custom_embed':
                return (
                    <div
                        dangerouslySetInnerHTML={{ __html: field.html_content || '' }}
                        className="prose max-w-none"
                    />
                );

            // Advanced Fields
            case 'matrix':
                return (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="border p-3 bg-muted/50"></th>
                                    {(field.matrix_cols || []).map((col: string, i: number) => (
                                        <th key={i} className="border p-3 text-sm font-medium bg-muted/50" style={{ color: textColor }}>
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(field.matrix_rows || []).map((row: string, i: number) => (
                                    <tr key={i}>
                                        <td className="border p-3 text-sm font-medium bg-muted/20" style={{ color: textColor }}>
                                            {row}
                                        </td>
                                        {(field.matrix_cols || []).map((col: string, j: number) => (
                                            <td key={j} className="border p-3 text-center">
                                                <input
                                                    type={field.matrix_input_type || 'radio'}
                                                    name={`matrix_${field.id}_${i}`}
                                                    value={`${i}_${j}`}
                                                    checked={value?.[i] === j}
                                                    onChange={() => {
                                                        const newValue = { ...(value || {}), [i]: j };
                                                        onChange(newValue);
                                                    }}
                                                    style={{ accentColor: primaryColor }}
                                                    className="w-4 h-4"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'formula':
            case 'calculated':
            case 'auto_unique_id':
                return (
                    <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center gap-3">
                        {fieldType === 'auto_unique_id' ? <Key className="h-5 w-5 text-blue-600" /> : <Calculator className="h-5 w-5 text-blue-600" />}
                        <div className="flex-1">
                            <div className="text-xs text-blue-600 font-bold uppercase mb-1">
                                {fieldType === 'auto_unique_id' ? 'Auto-Generated ID' : 'Calculated Value'}
                            </div>
                            <Input
                                type="text"
                                value={value || (fieldType === 'auto_unique_id' ? '#AUTO-ID' : field.formula || 'Calculating...')}
                                readOnly
                                disabled
                                className="bg-white/50 border-blue-200"
                            />
                        </div>
                    </div>
                );

            case 'discount_code':
                return (
                    <Input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value.toUpperCase())}
                        placeholder={field.placeholder || 'Enter discount code'}
                        required={field.required}
                        style={inputStyle}
                        className="w-full uppercase font-mono tracking-wider"
                    />
                );

            // Payment Fields
            case 'product_basket':
                return (
                    <div className="space-y-3">
                        {(field.options || []).map((opt: string, i: number) => {
                            const [name, price, img] = opt.split('|');
                            const isSelected = Array.isArray(value) && value.some(v => v.split('|')[0] === name);

                            return (
                                <label key={i} className={cn(
                                    "flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg",
                                    isSelected ? "border-primary bg-primary/5 shadow-md" : "hover:border-primary/30"
                                )}
                                    style={{ borderColor: isSelected ? primaryColor : undefined }}
                                >
                                    <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {img ? <img src={img} alt={name} className="w-full h-full object-cover" /> : <Package className="h-10 w-10 text-muted-foreground" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-lg" style={{ color: textColor }}>{name}</div>
                                        <div className="text-sm text-muted-foreground">Premium item</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="font-black text-2xl" style={{ color: primaryColor }}>{price}</span>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => {
                                                const current = Array.isArray(value) ? value : [];
                                                if (e.target.checked) {
                                                    onChange([...current, opt]);
                                                } else {
                                                    onChange(current.filter((v: string) => v.split('|')[0] !== name));
                                                }
                                            }}
                                            className="h-5 w-5"
                                            style={{ accentColor: primaryColor }}
                                        />
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                );

            case 'stripe':
            case 'paypal':
                return (
                    <div className="border-2 rounded-xl p-8 text-center bg-gradient-to-br from-muted/30 to-muted/10" style={inputStyle}>
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <DollarSign className="h-8 w-8 text-primary" style={{ color: primaryColor }} />
                        </div>
                        <p className="text-sm font-medium mb-1" style={{ color: textColor }}>{fieldType === 'stripe' ? 'Stripe' : 'PayPal'} payment integration</p>
                        <p className="text-xs text-muted-foreground">Payment processing will be enabled in production</p>
                    </div>
                );

            // Spam Protection
            case 'recaptcha':
            case 'turnstile':
                return (
                    <div className="border-2 rounded-xl p-6 text-center bg-muted/20" style={inputStyle}>
                        <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm font-medium mb-1" style={{ color: textColor }}>{fieldType === 'recaptcha' ? 'reCAPTCHA' : 'Turnstile'} verification</p>
                        <p className="text-xs text-muted-foreground">Verification will be enabled in production</p>
                    </div>
                );

            // Layout Fields
            case 'layout_2col':
            case 'layout_3col':
            case 'layout_4col':
                const colCount = fieldType === 'layout_2col' ? 2 : fieldType === 'layout_3col' ? 3 : 4;
                const columns = field.columns || Array(colCount).fill([]);

                return (
                    <div className="w-full">
                        {field.label && !field.label.includes('Layout') && !field.label.includes('Columns') ? (
                            <h3 className="font-semibold text-lg mb-4" style={{ color: textColor }}>{field.label}</h3>
                        ) : null}
                        <div
                            className={cn(
                                "grid gap-6",
                                colCount === 2 ? "grid-cols-1 md:grid-cols-2" :
                                    colCount === 3 ? "grid-cols-1 md:grid-cols-3" :
                                        "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                            )}
                        >
                            {Array.from({ length: colCount }).map((_, i) => (
                                <div key={i} className="flex flex-col gap-4 min-w-0">
                                    {(columns[i] || []).length > 0 ? (
                                        (columns[i] || []).map((childField: FormField) => (
                                            <FieldRenderer
                                                key={childField.id}
                                                field={childField}
                                                value={allValues[childField.id]}
                                                onChange={(val) => onFieldChange(childField.id, val)}
                                                allValues={allValues}
                                                onFieldChange={onFieldChange}
                                                designSettings={designSettings}
                                                showLabel={true}
                                                showDescription={true}
                                            />
                                        ))
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'repeater_group':
            case 'field_group':
            case 'container':
                return (
                    <div className="border-2 rounded-xl p-6 space-y-4 bg-card" style={{ borderColor: designSettings.borderColor || '#e5e7eb' }}>
                        {(field.section_title || (field.label && !field.label.includes('Group') && !field.label.includes('Container'))) ? (
                            <h4 className="font-semibold text-xl" style={{ color: textColor }}>
                                {field.section_title || field.label}
                            </h4>
                        ) : null}

                        {field.fields && field.fields.length > 0 ? (
                            <div className="space-y-4">
                                {field.fields.map((childField: FormField) => (
                                    <FieldRenderer
                                        key={childField.id}
                                        field={childField}
                                        value={allValues[childField.id]}
                                        onChange={(val) => onFieldChange(childField.id, val)}
                                        allValues={allValues}
                                        onFieldChange={onFieldChange}
                                        designSettings={designSettings}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                                {fieldType === 'repeater_group' ? <Repeat className="h-12 w-12 mb-3 opacity-50" /> : <Package className="h-12 w-12 mb-3 opacity-50" />}
                                <span className="text-sm font-medium">{field.label || 'Group Container'}</span>
                                {fieldType === 'repeater_group' && <span className="text-xs mt-2">Repeater functionality will appear here</span>}
                            </div>
                        )}

                        {fieldType === 'repeater_group' && (
                            <Button variant="outline" size="sm" className="mt-4" style={{ color: primaryColor, borderColor: primaryColor }}>
                                <Plus className="w-4 h-4 mr-2" /> Add New
                            </Button>
                        )}
                    </div>
                );

            // Franchise & Multi-Location Fields
            case 'location_selector':
            case 'franchise_location':
            case 'appointment_location':
            case 'service_category':
            case 'territory':
            case 'budget':
            case 'timeline':
            case 'teamsize':
            case 'industry':
            case 'referral':
            case 'priority':
            case 'service':
            case 'product':
            case 'contactmethod':
                return (
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        required={field.required}
                        style={inputStyle}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                        <option value="">{field.placeholder || 'Select...'}</option>
                        {(field.options || []).map((opt: any, i: number) => (
                            <option key={i} value={typeof opt === 'string' ? opt : opt.value}>
                                {typeof opt === 'string' ? opt : opt.label}
                            </option>
                        ))}
                    </select>
                );

            case 'operating_hours':
            case 'regional_contact':
            case 'franchise_id':
                return (
                    <Input
                        type="text"
                        value={value || field.paragraph_text || ''}
                        readOnly
                        disabled
                        style={inputStyle}
                        className="w-full bg-muted/30"
                    />
                );

            // Calendly & OpenAI
            case 'calendly':
                return (
                    <div className="border-2 rounded-xl p-8 text-center bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background" style={inputStyle}>
                        <Calendar className="h-16 w-16 mx-auto mb-4 text-purple-600" />
                        <p className="text-sm font-medium mb-3" style={{ color: textColor }}>Calendly scheduling widget</p>
                        {field.calendly_url && (
                            <a href={field.calendly_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-medium" style={{ color: primaryColor }}>
                                Open Calendly
                            </a>
                        )}
                    </div>
                );

            case 'openai':
            case 'api_action':
                return (
                    <div className={cn("border-2 rounded-xl p-6 flex items-center gap-4", fieldType === 'openai' ? 'bg-purple-50/50 border-purple-200 dark:bg-purple-950/20' : 'bg-orange-50/50 border-orange-200 dark:bg-orange-950/20')}>
                        {fieldType === 'openai' ? <Bot className="h-8 w-8 text-purple-600" /> : <Webhook className="h-8 w-8 text-orange-600" />}
                        <div className="flex-1">
                            <p className="text-xs font-bold uppercase mb-1" style={{ color: fieldType === 'openai' ? '#9333ea' : '#ea580c' }}>
                                {fieldType === 'openai' ? 'AI-powered field' : 'API action'}
                            </p>
                            <p className="text-xs text-muted-foreground">Integration will be enabled in production</p>
                        </div>
                    </div>
                );

            case 'social_share':
                return (
                    <div className="flex gap-3 justify-center flex-wrap">
                        {(field.options || ['Facebook', 'Twitter', 'LinkedIn']).map((platform: string, i: number) => (
                            <Button key={i} variant="outline" size="sm" className="min-w-[100px]">
                                {platform}
                            </Button>
                        ))}
                    </div>
                );

            case 'embed_pdf':
                return field.media_url ? (
                    <iframe
                        src={field.media_url}
                        className="w-full h-96 border-2 rounded-xl"
                        title="PDF Embed"
                    />
                ) : (
                    <div className="border-2 border-dashed rounded-xl p-8 text-center">
                        <FileTextIcon className="h-16 w-16 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground font-medium">No PDF set</p>
                    </div>
                );

            // Default fallback
            default:
                return (
                    <Input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder || ''}
                        required={field.required}
                        style={inputStyle}
                        className="w-full"
                    />
                );
        }
    }
}

