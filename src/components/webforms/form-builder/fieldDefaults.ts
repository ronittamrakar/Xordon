// Field Defaults Generator - Provides sensible randomized defaults for all field types

import { FormField, FieldType } from './types';

// Helper to get random item from array
const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper to get random number in range
const randomInRange = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Color palette for randomization
const colorPalette = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

/**
 * Generate field-specific defaults based on field type
 */
export function getFieldDefaults(fieldType: FieldType | string): Partial<FormField> {
  const baseDefaults: Partial<FormField> = {
    required: false,
    hidden: false,
    disabled: false,
    readonly: false,
    appearance: {
      size: 'medium',
      label_position: 'top',
      text_align: 'left',
    },
  };

  // Type-specific defaults
  switch (fieldType) {
    // Basic Text Fields
    case 'text':
      return {
        ...baseDefaults,
        placeholder: 'Enter text...',
        input_type: 'text',
        min_length: undefined,
        max_length: 255,
        text_transform: 'none',
        default_value: '',
      };

    case 'textarea':
      return {
        ...baseDefaults,
        placeholder: 'Enter your message...',
        rows: 4,
        resizable: true,
        show_char_count: false,
        max_length: 1000,
      };

    case 'rich_text':
      return {
        ...baseDefaults,
        placeholder: 'Start typing...',
        rows: 6,
        max_length: 5000,
        show_char_count: true,
      };

    case 'masked_text':
    case 'password':
      return {
        ...baseDefaults,
        placeholder: '••••••••',
        input_type: 'password',
        min_length: 8,
        max_length: 128,
        validation: {
          require_uppercase: true,
          require_lowercase: true,
          require_number: true,
          require_special: false,
        },
      };

    case 'email':
      return {
        ...baseDefaults,
        placeholder: 'your.email@example.com',
        validation: {
          validate_format: true,
          block_disposable: false,
        },
      };

    case 'phone':
      return {
        ...baseDefaults,
        placeholder: '(555) 123-4567',
        phone_format: 'national',
        default_country: 'US',
        validation: {
          validate_format: true,
        },
      };

    case 'url':
      return {
        ...baseDefaults,
        placeholder: 'https://example.com',
        validation: {
          validate_format: true,
        },
      };

    case 'number':
      return {
        ...baseDefaults,
        placeholder: '0',
        number_format: 'decimal',
        show_spinners: true,
        validation: {
          min_value: undefined,
          max_value: undefined,
          step: 1,
        },
      };

    case 'price':
      return {
        ...baseDefaults,
        placeholder: '0.00',
        number_format: 'currency',
        prefix: '$',
        show_spinners: false,
        validation: {
          min_value: 0,
          step: 0.01,
        },
      };

    // Date & Time Fields
    case 'date':
      return {
        ...baseDefaults,
        date_format: 'MM/DD/YYYY',
        show_calendar: true,
        validation: {
          disable_weekends: false,
        },
      };

    case 'time':
      return {
        ...baseDefaults,
        time_format: '12h',
        time_interval: 30,
      };

    case 'datetime':
      return {
        ...baseDefaults,
        date_format: 'MM/DD/YYYY',
        time_format: '12h',
        show_calendar: true,
        time_interval: 30,
      };

    case 'scheduler':
      return {
        ...baseDefaults,
        time_format: '12h',
        time_interval: 30,
        validation: {
          disable_weekends: false,
        },
      };

    case 'timer':
      return {
        ...baseDefaults,
        slider_min: 0,
        slider_max: 60,
        slider_step: 5,
        suffix: ' minutes',
      };

    // Choice Fields
    case 'select':
    case 'dropdown':
      return {
        ...baseDefaults,
        placeholder: 'Select an option...',
        options: ['Option 1', 'Option 2', 'Option 3'],
        layout: 'vertical',
        allow_search: false,
        allow_other: false,
      };

    case 'number_dropdown':
      return {
        ...baseDefaults,
        placeholder: 'Select a number...',
        options: ['1', '2', '3', '4', '5'],
        layout: 'vertical',
      };

    case 'multiselect':
      return {
        ...baseDefaults,
        placeholder: 'Select multiple options...',
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        layout: 'vertical',
        allow_search: true,
        validation: {
          min_selections: 1,
          max_selections: undefined,
        },
      };

    case 'radio':
      return {
        ...baseDefaults,
        options: ['Option 1', 'Option 2', 'Option 3'],
        layout: 'vertical',
        allow_other: false,
      };

    case 'checkbox':
    case 'multiple_choice':
      return {
        ...baseDefaults,
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        layout: 'vertical',
        allow_other: false,
        validation: {
          min_selections: 1,
          max_selections: undefined,
        },
      };

    case 'picture_choice':
      return {
        ...baseDefaults,
        picture_options: [
          { label: 'Option 1', value: 'option1', image_url: '' },
          { label: 'Option 2', value: 'option2', image_url: '' },
          { label: 'Option 3', value: 'option3', image_url: '' },
        ],
        picture_columns: 3,
        image_fit: 'cover',
        layout: 'grid',
      };

    case 'yes_no':
      return {
        ...baseDefaults,
        yes_label: 'Yes',
        no_label: 'No',
        display_style: 'buttons',
      };

    case 'like_dislike':
      return {
        ...baseDefaults,
        yes_label: 'Like',
        no_label: 'Dislike',
        display_style: 'buttons',
      };

    // Rating Fields
    case 'star_rating':
    case 'rating':
      return {
        ...baseDefaults,
        max_stars: 5,
        star_style: 'star',
        allow_half_ratings: false,
        rating_labels: { low: 'Poor', high: 'Excellent' },
        rating_colors: {
          active: randomItem(colorPalette),
          inactive: '#e5e7eb'
        },
      };

    case 'slider':
      return {
        ...baseDefaults,
        slider_min: 0,
        slider_max: 100,
        slider_step: 1,
        slider_labels: true,
        scale_low_label: 'Low',
        scale_high_label: 'High',
      };

    case 'scale':
      return {
        ...baseDefaults,
        slider_min: 1,
        slider_max: 10,
        slider_step: 1,
        slider_labels: true,
        scale_low_label: 'Not at all',
        scale_high_label: 'Extremely',
      };

    case 'likert':
      return {
        ...baseDefaults,
        likert_scale: '5-point',
        likert_labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
        likert_statements: ['Statement 1', 'Statement 2', 'Statement 3'],
      };

    case 'ranking':
      return {
        ...baseDefaults,
        ranking_items: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
        max_rank: 4,
        allow_ties: false,
      };

    case 'nps':
      return {
        ...baseDefaults,
        slider_min: 0,
        slider_max: 10,
        slider_step: 1,
        scale_low_label: 'Not likely',
        scale_high_label: 'Very likely',
      };

    // File Upload Fields
    case 'file':
      return {
        ...baseDefaults,
        max_file_size: 10,
        allowed_formats: ['.pdf', '.doc', '.docx', '.txt'],
        show_preview: true,
        validation: {
          max_files: 1,
        },
      };

    case 'image_upload':
      return {
        ...baseDefaults,
        max_file_size: 5,
        allowed_formats: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        show_preview: true,
        validation: {
          max_files: 5,
        },
      };

    case 'drawing':
      return {
        ...baseDefaults,
        pen_color: '#000000',
        pen_width: 2,
        show_clear: true,
      };

    // Signature
    case 'signature':
      return {
        ...baseDefaults,
        pen_color: '#000000',
        pen_width: 2,
        show_clear: true,
      };

    // Location Fields
    case 'location':
      return {
        ...baseDefaults,
        location_type: 'address',
        address_format: 'full',
        default_country: 'US',
      };

    case 'google_maps':
      return {
        ...baseDefaults,
        location_type: 'map',
        default_country: 'US',
      };

    case 'address':
      return {
        ...baseDefaults,
        address_format: 'full',
        default_country: 'US',
      };

    // Compliance Fields
    case 'legal_consent':
      return {
        ...baseDefaults,
        consent_text: 'I agree to the terms and conditions',
        terms_link: '',
        consent_style: 'checkbox',
        prechecked: false,
        required: true,
      };

    case 'terms_of_service':
      return {
        ...baseDefaults,
        consent_text: 'I have read and agree to the Terms of Service',
        terms_link: '/terms',
        consent_style: 'checkbox',
        prechecked: false,
        required: true,
      };

    case 'gdpr_agreement':
      return {
        ...baseDefaults,
        gdpr_text: 'I consent to the processing of my personal data in accordance with GDPR',
        privacy_policy_link: '/privacy',
        consent_style: 'checkbox',
        prechecked: false,
        required: true,
      };

    case 'tcpa_consent':
      return {
        ...baseDefaults,
        tcpa_text: 'I consent to receive communications via SMS/phone in accordance with TCPA',
        consent_style: 'checkbox',
        prechecked: false,
        required: true,
      };

    // Layout Fields
    case 'heading':
      return {
        ...baseDefaults,
        heading_text: 'Section Heading',
        heading_level: 2,
        required: false,
      };

    case 'paragraph':
      return {
        ...baseDefaults,
        paragraph_text: 'Add your paragraph text here...',
        required: false,
      };

    case 'explanation':
      return {
        ...baseDefaults,
        paragraph_text: 'Additional instructions or help text...',
        required: false,
      };

    case 'divider':
      return {
        ...baseDefaults,
        divider_style: 'solid',
        thickness: 1,
        required: false,
      };

    case 'spacer':
      return {
        ...baseDefaults,
        spacer_height: 20,
        required: false,
      };

    case 'section':
      return {
        ...baseDefaults,
        section_title: 'Section Title',
        section_description: '',
        collapsible: false,
        required: false,
      };

    case 'page_break':
      return {
        ...baseDefaults,
        label: 'Page Break',
        required: false,
      };

    case 'field_group':
      return {
        ...baseDefaults,
        section_title: 'Field Group',
        collapsible: false,
      };

    case 'layout_2col':
      return {
        ...baseDefaults,
        column_spacing: 'medium',
        column_alignment: 'top',
        columns: [[], []],
      };

    case 'layout_3col':
      return {
        ...baseDefaults,
        column_spacing: 'medium',
        column_alignment: 'top',
        columns: [[], [], []],
      };

    case 'layout_4col':
      return {
        ...baseDefaults,
        column_spacing: 'medium',
        column_alignment: 'top',
        columns: [[], [], [], []],
      };

    case 'repeater_group':
      return {
        ...baseDefaults,
        section_title: 'Repeater Group',
        validation: {
          min_value: 1,
          max_value: 10,
        },
      };

    // Media Fields
    case 'image':
      return {
        ...baseDefaults,
        media_url: '',
        alt_text: '',
        media_align: 'center',
        media_width: 100,
        required: false,
      };

    case 'video':
      return {
        ...baseDefaults,
        media_url: '',
        autoplay: false,
        muted: false,
        loop: false,
        show_controls: true,
        required: false,
      };

    case 'audio':
      return {
        ...baseDefaults,
        media_url: '',
        autoplay: false,
        loop: false,
        show_controls: true,
        required: false,
      };

    case 'embed_pdf':
      return {
        ...baseDefaults,
        media_url: '',
        media_width: 100,
        required: false,
      };

    case 'custom_embed':
      return {
        ...baseDefaults,
        html_content: '',
        required: false,
      };

    case 'social_share':
      return {
        ...baseDefaults,
        paragraph_text: 'Share this form',
        options: ['Facebook', 'Twitter', 'LinkedIn', 'WhatsApp'],
        required: false,
      };

    // Payment Fields
    case 'product_basket':
      return {
        ...baseDefaults,
        options: ['Basic Plan|$10.00', 'Pro Plan|$25.00', 'Enterprise|$99.00'],
        required: true,
      };

    case 'stripe':
      return {
        ...baseDefaults,
        placeholder: 'Enter payment details',
        required: true,
      };

    case 'paypal':
      return {
        ...baseDefaults,
        placeholder: 'Pay with PayPal',
        required: true,
      };

    // Spam Protection
    case 'recaptcha':
      return {
        ...baseDefaults,
        label: 'reCAPTCHA Verification',
        required: true,
      };

    case 'turnstile':
      return {
        ...baseDefaults,
        label: 'Cloudflare Turnstile Verification',
        required: true,
      };

    // Page Fields
    case 'cover':
      return {
        ...baseDefaults,
        heading_text: 'Welcome',
        paragraph_text: 'Please fill out this form',
        button_text: 'Start',
        required: false,
      };

    case 'welcome_page':
      return {
        ...baseDefaults,
        heading_text: 'Welcome!',
        paragraph_text: 'Thank you for taking the time to complete this form.',
        button_text: 'Get Started',
        required: false,
      };

    case 'ending':
      return {
        ...baseDefaults,
        heading_text: 'Thank You!',
        paragraph_text: 'Your response has been recorded.',
        button_text: 'Close',
        required: false,
      };

    // Advanced Fields
    case 'html':
      return {
        ...baseDefaults,
        html_content: '<div>Custom HTML content</div>',
        required: false,
      };

    case 'calendly':
      return {
        ...baseDefaults,
        calendly_url: '',
        button_text: 'Schedule Meeting',
        display_mode: 'inline',
      };

    case 'openai':
      return {
        ...baseDefaults,
        placeholder: 'AI will generate content here...',
      };

    case 'api_action':
      return {
        ...baseDefaults,
        placeholder: 'API response will appear here...',
      };

    case 'formula':
    case 'calculated':
      return {
        ...baseDefaults,
        formula: '',
        calculation_type: 'sum',
        calculation_fields: [],
        readonly: true,
      };

    case 'discount_code':
      return {
        ...baseDefaults,
        placeholder: 'Enter discount code',
        text_transform: 'uppercase',
      };

    case 'auto_unique_id':
      return {
        ...baseDefaults,
        readonly: true,
        hidden: true,
      };

    case 'matrix':
      return {
        ...baseDefaults,
        matrix_rows: ['Row 1', 'Row 2', 'Row 3'],
        matrix_cols: ['Column 1', 'Column 2', 'Column 3'],
        matrix_input_type: 'radio',
        matrix_layout: 'vertical',
      };

    // Lead Capture Fields
    case 'fullname':
    case 'full_name':
      return {
        ...baseDefaults,
        placeholder: 'John Doe',
        name_format: 'first_last',
        include_title: false,
        include_middle: false,
      };

    case 'firstname':
    case 'first_name':
      return {
        ...baseDefaults,
        placeholder: 'John',
      };

    case 'lastname':
    case 'last_name':
      return {
        ...baseDefaults,
        placeholder: 'Doe',
      };

    case 'company':
      return {
        ...baseDefaults,
        placeholder: 'Company Name Inc.',
      };

    case 'jobtitle':
      return {
        ...baseDefaults,
        placeholder: 'Job Title',
      };

    case 'budget':
      return {
        ...baseDefaults,
        options: ['< $1,000', '$1,000 - $5,000', '$5,000 - $10,000', '$10,000+'],
        layout: 'vertical',
      };

    case 'timeline':
      return {
        ...baseDefaults,
        options: ['Immediately', 'Within 1 month', '1-3 months', '3-6 months', '6+ months'],
        layout: 'vertical',
      };

    case 'teamsize':
      return {
        ...baseDefaults,
        options: ['1-10', '11-50', '51-200', '201-500', '500+'],
        layout: 'vertical',
      };

    case 'industry':
      return {
        ...baseDefaults,
        options: ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Other'],
        layout: 'vertical',
        allow_other: true,
      };

    case 'referral':
      return {
        ...baseDefaults,
        options: ['Search Engine', 'Social Media', 'Friend/Colleague', 'Advertisement', 'Other'],
        layout: 'vertical',
        allow_other: true,
      };

    case 'satisfaction':
      return {
        ...baseDefaults,
        max_stars: 5,
        star_style: 'star',
        rating_labels: { low: 'Very Unsatisfied', high: 'Very Satisfied' },
      };

    case 'priority':
      return {
        ...baseDefaults,
        options: ['Low', 'Medium', 'High', 'Urgent'],
        layout: 'vertical',
      };

    case 'leadscore':
      return {
        ...baseDefaults,
        slider_min: 0,
        slider_max: 100,
        slider_step: 10,
        readonly: true,
      };

    case 'service':
      return {
        ...baseDefaults,
        options: ['Service 1', 'Service 2', 'Service 3'],
        layout: 'vertical',
        allow_other: true,
      };

    case 'product':
      return {
        ...baseDefaults,
        options: ['Product 1', 'Product 2', 'Product 3'],
        layout: 'vertical',
        allow_other: true,
      };

    case 'contactmethod':
      return {
        ...baseDefaults,
        options: ['Email', 'Phone', 'SMS', 'Video Call'],
        layout: 'vertical',
      };

    // Franchise & Multi-Location Fields
    case 'location_selector':
      return {
        ...baseDefaults,
        options: ['Location 1', 'Location 2', 'Location 3'],
        layout: 'vertical',
        allow_search: true,
      };

    case 'service_area':
      return {
        ...baseDefaults,
        placeholder: 'Enter ZIP code',
      };

    case 'franchise_location':
      return {
        ...baseDefaults,
        options: ['Franchise 1', 'Franchise 2', 'Franchise 3'],
        layout: 'vertical',
        allow_search: true,
      };

    case 'appointment_location':
      return {
        ...baseDefaults,
        options: ['Office', 'Home', 'Virtual'],
        layout: 'vertical',
      };

    case 'service_category':
      return {
        ...baseDefaults,
        options: ['Category 1', 'Category 2', 'Category 3'],
        layout: 'vertical',
      };

    case 'territory':
      return {
        ...baseDefaults,
        options: ['North', 'South', 'East', 'West'],
        layout: 'vertical',
      };

    case 'store_finder':
      return {
        ...baseDefaults,
        placeholder: 'Enter your location',
        location_type: 'address',
      };

    case 'operating_hours':
      return {
        ...baseDefaults,
        readonly: true,
        paragraph_text: 'Mon-Fri: 9AM-5PM',
      };

    case 'regional_contact':
      return {
        ...baseDefaults,
        readonly: true,
      };

    case 'franchise_id':
      return {
        ...baseDefaults,
        readonly: true,
        hidden: true,
      };

    // Default fallback
    default:
      return baseDefaults;
  }
}
