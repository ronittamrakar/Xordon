// Webforms Builder Types - Full legacy parity from XordonForms

export type FormStatus = 'draft' | 'published' | 'archived' | 'trashed';
export type FormType = 'single_step' | 'multi_step' | 'popup';

export type FieldType =
  | 'text' | 'textarea' | 'email' | 'number' | 'phone' | 'url' | 'password'
  | 'date' | 'time' | 'datetime'
  | 'select' | 'multiselect' | 'dropdown' | 'number_dropdown' | 'radio' | 'checkbox' | 'yes_no' | 'like_dislike'
  | 'file' | 'image' | 'video' | 'audio'
  | 'rating' | 'slider' | 'scale' | 'likert' | 'nps' | 'emoji' | 'thumbs'
  | 'heading' | 'paragraph' | 'divider' | 'spacer' | 'section' | 'page_break' | 'html'
  | 'layout_2col' | 'layout_3col' | 'layout_4col' | 'repeater_group'
  | 'matrix' | 'signature' | 'location' | 'calculated' | 'calendly' | 'openai' | 'api_action'
  | 'hidden' | 'screenshot' | 'image_block' | 'video_block'
  | 'legal_consent' | 'gdpr_agreement' | 'tcpa_consent'
  | 'fullname' | 'address' | 'company' | 'jobtitle' | 'first_name' | 'last_name' | 'full_name'
  | 'rich_text' | 'credit_card' | 'appointment' | 'multiple_choice' | 'true_false'
  | string;

export interface FieldValidation {
  pattern?: string;
  custom_message?: string;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  step?: number;
  min_date?: string;
  max_date?: string;
  disable_weekends?: boolean;
  disabled_days?: number[];
  validate_format?: boolean;
  block_disposable?: boolean;
  allowed_domains?: string[];
  require_uppercase?: boolean;
  require_lowercase?: boolean;
  require_number?: boolean;
  require_special?: boolean;
  allowed_types?: string;
  max_file_size?: number;
  max_files?: number;
  min_selections?: number;
  max_selections?: number;
  error_message?: string;
}

export interface FormField {
  id: string | number;
  form_id?: string | number;
  field_type: FieldType | string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  position?: number;
  properties?: Record<string, any>;
  validation?: FieldValidation;
  options?: string[] | FieldOption[];
  columns?: FormField[][];
  created_at?: string;
  updated_at?: string;
  
  // Basic field properties
  input_type?: string;
  max_length?: number;
  min_length?: number;
  default_value?: any;
  input_mask?: string;
  text_transform?: 'uppercase' | 'lowercase' | 'titlecase' | 'none';
  help_text?: string;
  
  // Textarea specific
  rows?: number;
  cols?: number;
  resizable?: boolean;
  show_char_count?: boolean;
  
  // Choice field specific
  layout?: 'vertical' | 'horizontal' | 'grid' | 'grid-3' | 'inline';
  allow_search?: boolean;
  multi_select?: boolean;
  allow_other?: boolean;
  other_placeholder?: string;
  randomize_options?: boolean;
  
  // Number specific
  number_format?: 'decimal' | 'integer' | 'currency' | 'percentage' | 'scientific';
  show_spinners?: boolean;
  prefix?: string;
  suffix?: string;
  min_number?: number;
  max_number?: number;
  number_step?: number;
  
  // Date specific
  date_format?: string;
  show_calendar?: boolean;
  
  // Time specific
  time_format?: '12h' | '24h';
  time_interval?: number;
  
  // Phone specific
  phone_format?: 'national' | 'international' | 'e164';
  default_country?: string;
  
  // File specific
  show_preview?: boolean;
  max_file_size?: number;
  allowed_formats?: string[];
  
  // Rating specific
  max_stars?: number;
  star_style?: 'star' | 'heart' | 'thumb' | 'number' | 'emoji' | 'bar';
  allow_half_ratings?: boolean;
  rating_labels?: { low?: string; high?: string };
  rating_colors?: { active?: string; inactive?: string };
  
  // Scale/Slider specific
  scale_min?: number;
  scale_max?: number;
  scale_low_label?: string;
  scale_high_label?: string;
  slider_min?: number;
  slider_max?: number;
  slider_step?: number;
  slider_labels?: boolean;
  
  // Matrix specific
  matrix_question?: string;
  matrix_input_type?: 'radio' | 'checkbox' | 'dropdown' | 'text';
  matrix_layout?: 'vertical' | 'horizontal' | 'compact';
  
  // Yes/No specific
  yes_label?: string;
  no_label?: string;
  display_style?: 'toggle' | 'buttons' | 'dropdown';
  
  // Emoji/Thumbs specific
  emoji_set?: 'smileys' | 'hearts' | 'thumbs' | 'custom';
  emoji_size?: 'small' | 'medium' | 'large' | 'extra-large';
  custom_emojis?: string;
  show_labels?: boolean;
  thumb_size?: 'small' | 'medium' | 'large' | 'extra-large';
  
  // Likert specific
  likert_scale?: '3-point' | '5-point' | '7-point' | 'custom';
  likert_labels?: string[];
  likert_statements?: string[];
  
  // Layout specific
  column_spacing?: 'none' | 'small' | 'medium' | 'large';
  column_alignment?: 'top' | 'middle' | 'bottom' | 'stretch';
  section_title?: string;
  section_description?: string;
  collapsible?: boolean;
  divider_style?: string;
  thickness?: number;
  heading_text?: string;
  heading_level?: number;
  paragraph_text?: string;
  spacer_height?: number;
  html_content?: string;
  
  // Signature specific
  pen_color?: string;
  pen_width?: number;
  
  // Location specific
  location_type?: 'address' | 'coordinates' | 'map' | 'dropdown';
  address_format?: 'street' | 'street_city' | 'full';
  
  // Calculated specific
  calculation_type?: 'sum' | 'average' | 'count' | 'min' | 'max' | 'custom';
  formula?: string;
  calculation_fields?: string[];
  
  // Compliance specific
  consent_text?: string;
  terms_link?: string;
  consent_style?: 'checkbox' | 'toggle' | 'button';
  prechecked?: boolean;
  gdpr_text?: string;
  privacy_policy_link?: string;
  tcpa_text?: string;
  
  // Calendly specific
  calendly_url?: string;
  event_type?: string;
  button_text?: string;
  display_mode?: 'inline' | 'popup' | 'button';
  
  // Full Name specific
  name_format?: 'first_last' | 'first_middle_last' | 'title_first_last';
  include_title?: boolean;
  include_middle?: boolean;
  include_country?: boolean;
  
  // Ranking specific
  ranking_items?: string[];
  max_rank?: number;
  allow_ties?: boolean;
  
  // Matrix specific
  matrix_rows?: string[];
  matrix_cols?: string[];
  
  // Media specific
  media_url?: string;
  alt_text?: string;
  media_align?: 'left' | 'center' | 'right';
  media_width?: number;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  show_controls?: boolean;
  
  // Picture choice specific
  picture_options?: Array<{ label: string; value?: string; image_url?: string }>;
  picture_columns?: number;
  image_fit?: 'cover' | 'contain' | 'fill';
  
  // Signature specific
  show_clear?: boolean;
  
  // Appearance
  appearance?: {
    size?: 'small' | 'medium' | 'large' | 'full';
    label_position?: 'top' | 'left' | 'right' | 'hidden';
    text_align?: 'left' | 'center' | 'right';
  };
  css_class?: string;
  
  // State
  hidden?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  
  // Allow any additional properties
  [key: string]: any;
}

export interface FieldOption {
  id?: number;
  label: string;
  value: string;
  position?: number;
  is_default?: boolean;
}

export interface Form {
  id?: string | number;
  title: string;
  description?: string;
  user_id?: number;
  folder_id?: number;
  status: FormStatus;
  type: FormType;
  version?: number;
  language?: string;
  settings?: FormSettings;
  fields: FormField[];
  welcome_screen?: WelcomeScreen;
  thank_you_screen?: ThankYouScreen;
  theme?: Theme;
  created_at?: string;
  updated_at?: string;
  submission_count?: number;
}

export interface WelcomeScreen {
  title: string;
  description?: string;
  button_text?: string;
  background_image?: string;
  show_progress?: boolean;
}

export interface ThankYouScreen {
  title: string;
  description?: string;
  button_text?: string;
  redirect_url?: string;
  show_social_share?: boolean;
}

export interface Theme {
  primary_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  font_size: 'small' | 'medium' | 'large';
  border_radius: 'none' | 'small' | 'medium' | 'large';
  spacing: 'compact' | 'normal' | 'relaxed';
  custom_css?: string;
}

export interface FormSettings {
  // Basic Settings
  theme?: string;
  layout?: string;
  showProgress?: boolean;
  allowSave?: boolean;
  allowPreview?: boolean;
  allow_multiple_submissions?: boolean;
  show_progress_bar?: boolean;
  auto_save?: boolean;
  require_login?: boolean;
  collect_email?: boolean;
  redirect_after_submit?: string;
  notification_email?: string;
  confirmation_email?: boolean;
  analytics_enabled?: boolean;
  multi_step_type?: 'pagination' | 'accordion' | 'one_step_at_a_time';
  
  // Logic & Automations
  logic_rules?: any[];
  automations?: any[];
  calculations?: any[];
  
  // Design settings
  design?: Record<string, any>;
  
  // Share Settings
  limit_responses?: boolean;
  max_responses?: number;
  enable_expiry?: boolean;
  expiry_date?: string;
  enable_password?: boolean;
  password?: string;
  prevent_duplicates?: boolean;
  
  // Partial Submissions
  track_partial_submissions?: boolean;
  partial_save_interval?: number;
  partial_submission_expiry?: number;
  notify_on_abandonment?: boolean;
  resume_submissions?: boolean;
  
  // CAPTCHA & Bot Protection
  enable_captcha?: boolean;
  captcha_type?: 'recaptcha_v2' | 'recaptcha_v3' | 'hcaptcha' | 'turnstile';
  enable_honeypot?: boolean;
  time_based_protection?: boolean;
  min_submission_time?: number;
  
  // IP & Rate Limiting
  enable_rate_limit?: boolean;
  rate_limit_count?: number;
  rate_limit_window?: string;
  blocked_ips?: string;
  block_vpn?: boolean;
  
  // Geographic Restrictions
  enable_geo_restrictions?: boolean;
  geo_restriction_mode?: 'block' | 'allow';
  geo_countries?: string;
  
  // Spam Detection
  ai_spam_detection?: boolean;
  block_disposable_emails?: boolean;
  blocked_email_domains?: string;
  spam_keywords?: string;
  
  // Privacy
  track_ip_address?: boolean;
  gdpr_compliant?: boolean;
  
  // Display Options
  show_field_numbers?: boolean;
  mobile_optimized?: boolean;
  tablet_optimized?: boolean;
  desktop_optimized?: boolean;
  
  // Notifications
  email_subject?: string;
  email_template?: any;
  admin_notifications?: boolean;
  slack_notifications?: boolean;
  slack_webhook_url?: string;
  
  // Integrations
  webhook_url?: string;
  webhook_method?: string;
  google_analytics?: boolean;
  ga_tracking_id?: string;
  facebook_pixel?: boolean;
  fb_pixel_id?: string;
  google_tag_manager?: boolean;
  gtm_container_id?: string;
  custom_scripts?: string;
  custom_css?: string;
  
  // Advanced
  start_date?: string;
  debug_mode?: boolean;
  
  // Allow any additional properties
  [key: string]: any;
}

export interface Submission {
  id: number;
  form_id: number;
  data: Record<string, any>;
  submission_data?: Record<string, any>;
  status: 'pending' | 'completed' | 'spam' | 'partial' | 'new' | 'read' | 'starred' | 'archived';
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  submitted_at: string;
  updated_at?: string;
  completion_percentage?: number;
  created_at?: string;
  completion_time?: number;
  spam_score?: number;
  is_spam?: boolean;
}

// Field type definitions for the palette
export interface FieldTypeDefinition {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

// Generate unique ID helper
export const generateUniqueId = (): string => {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
