# Form Fields Quick Reference Guide

## 📊 Overview

**Total Fields:** 111  
**Categories:** 14  
**Status:** ✅ All Complete

---

## 🗂️ Field Categories

### 1️⃣ Basic Fields (7)
| Field | Type | Description | Key Settings |
|-------|------|-------------|--------------|
| Text Input | `text` | Single line text | placeholder, max_length, text_transform |
| Text Area | `textarea` | Multi-line text | rows, resizable, show_char_count |
| Rich Text Block | `rich_text` | Rich text editor | rows, max_length, show_char_count |
| Masked Text | `masked_text` | Password/masked input | min_length, validation rules |
| Email | `email` | Email address | validate_format, block_disposable |
| Number | `number` | Numeric input | min_value, max_value, step, show_spinners |
| Phone | `phone` | Phone number | phone_format, default_country |

### 2️⃣ Date and Time (5)
| Field | Type | Description | Key Settings |
|-------|------|-------------|--------------|
| Date | `date` | Date input | date_format, show_calendar, disable_weekends |
| Time | `time` | Time input | time_format, time_interval |
| Date & Time | `datetime` | Date and time picker | date_format, time_format, time_interval |
| Scheduler | `scheduler` | Meeting scheduler | time_format, time_interval, disable_weekends |
| Timer | `timer` | Countdown timer | slider_min, slider_max, slider_step, suffix |

### 3️⃣ Choice Fields (6)
| Field | Type | Description | Key Settings |
|-------|------|-------------|--------------|
| Dropdown | `select` | Select from list | options, allow_search, allow_other |
| Number Dropdown | `number_dropdown` | Numeric dropdown | options, layout |
| Multi Select | `multiselect` | Multiple selection | options, min_selections, max_selections |
| Single Choice | `radio` | Radio buttons | options, layout, allow_other |
| Multiple Choice | `checkbox` | Checkboxes | options, layout, min_selections |
| Picture Choice | `picture_choice` | Choose from images | picture_options, picture_columns, image_fit |

### 4️⃣ Rating Fields (7)
| Field | Type | Description | Key Settings |
|-------|------|-------------|--------------|
| Star Rating | `star_rating` | Star rating system | max_stars, star_style, allow_half_ratings |
| Slider | `slider` | Slider input | slider_min, slider_max, slider_step |
| Scale | `scale` | Rating scale | slider_min, slider_max, scale_labels |
| Likert Scale | `likert` | Agreement scale | likert_scale, likert_labels, likert_statements |
| Ranking | `ranking` | Rank items in order | ranking_items, max_rank, allow_ties |
| NPS | `nps` | Net Promoter Score | slider_min (0), slider_max (10), scale_labels |
| Like / Dislike | `like_dislike` | Thumbs up/down | yes_label, no_label, display_style |

### 5️⃣ Formatting (5)
| Field | Type | Description | Key Settings |
|-------|------|-------------|--------------|
| Heading | `heading` | Section heading | heading_text, heading_level |
| Paragraph Text | `paragraph` | Display text | paragraph_text |
| Explanation | `explanation` | Help text/instructions | paragraph_text |
| Divider | `divider` | Horizontal line | divider_style, thickness |
| Spacer | `spacer` | Empty space | spacer_height |

### 6️⃣ Compliance (4)
| Field | Type | Description | Key Settings |
|-------|------|-------------|--------------|
| Legal Consent | `legal_consent` | Legal agreement | consent_text, terms_link, consent_style |
| Terms of Service | `terms_of_service` | Terms and conditions | consent_text, terms_link, prechecked |
| GDPR Agreement | `gdpr_agreement` | GDPR compliance | gdpr_text, privacy_policy_link |
| TCPA Consent | `tcpa_consent` | TCPA compliance | tcpa_text, consent_style, prechecked |

### 7️⃣ Advanced (18)
| Field | Type | Description | Key Settings |
|-------|------|-------------|--------------|
| File Upload | `file` | Upload files | max_file_size, allowed_formats, max_files |
| Image Upload | `image_upload` | Upload images | max_file_size, allowed_formats, show_preview |
| Drawing | `drawing` | Drawing canvas | pen_color, pen_width, show_clear |
| Matrix | `matrix` | Matrix questions | matrix_rows, matrix_cols, matrix_input_type |
| E-Signature | `signature` | Digital signature | pen_color, pen_width, show_clear |
| Location | `location` | Location picker | location_type, address_format, default_country |
| Google Maps | `google_maps` | Location on map | location_type, default_country |
| URL | `url` | Website URL | placeholder, validate_format |
| Formula | `formula` | Mathematical formula | formula, calculation_type, calculation_fields |
| Price | `price` | Price input | number_format, prefix, min_value |
| Discount Code | `discount_code` | Promo code input | placeholder, text_transform |
| Auto Unique ID | `auto_unique_id` | Generate unique ID | readonly, hidden |
| Calendly | `calendly` | Schedule meeting | calendly_url, button_text, display_mode |
| Open AI | `openai` | AI-powered field | placeholder |
| API Action | `api_action` | External API call | placeholder |
| HTML Block | `html` | Custom HTML | html_content |
| Yes/No | `yes_no` | Yes/No toggle | yes_label, no_label, display_style |
| Address | `address` | Full address input | address_format, default_country |

### 8️⃣ Media (6)
| Field | Type | Description | Key Settings |
|-------|------|-------------|--------------|
| Image | `image` | Display image | media_url, alt_text, media_align, media_width |
| Video | `video` | Embed video | media_url, autoplay, muted, loop, show_controls |
| Audio | `audio` | Audio player | media_url, autoplay, loop, show_controls |
| Embed PDF | `embed_pdf` | Embed PDF document | media_url, media_width |
| Custom Embed | `custom_embed` | Custom embed code | html_content |
| Social Share | `social_share` | Share on social media | paragraph_text, options |

### 9️⃣ Payment (3)
| Field | Type | Description | Key Settings |
|-------|------|-------------|--------------|
| Product Basket | `product_basket` | Shopping cart | options (Name\|$Price format) |
| Stripe | `stripe` | Stripe payment | placeholder, required |
| PayPal | `paypal` | PayPal payment | placeholder, required |

### 🔟 Spam Protection (2)
| Field | Type | Description | Key Settings |
|-------|------|-------------|--------------|
| Recaptcha | `recaptcha` | Google reCAPTCHA | label, required |
| Turnstile | `turnstile` | Cloudflare Turnstile | label, required |

### 1️⃣1️⃣ Page Fields (3)
| Field | Type | Description | Key Settings |
|-------|------|-------------|--------------|
| Cover | `cover` | Form cover page | heading_text, paragraph_text, button_text |
| Welcome Page | `welcome_page` | Welcome screen | heading_text, paragraph_text, button_text |
| Ending | `ending` | Thank you/ending page | heading_text, paragraph_text, button_text |

### 1️⃣2️⃣ Layout (7)
| Field | Type | Description | Key Settings |
|-------|------|-------------|--------------|
| Section | `section` | Section divider | section_title, section_description, collapsible |
| Page Break | `page_break` | Multi-step form | label |
| Field Group | `field_group` | Group related fields | section_title, collapsible |
| 2 Columns | `layout_2col` | Two column layout | column_spacing, column_alignment, columns |
| 3 Columns | `layout_3col` | Three column layout | column_spacing, column_alignment, columns |
| 4 Columns | `layout_4col` | Four column layout | column_spacing, column_alignment, columns |
| Repeater Group | `repeater_group` | Repeatable fields | section_title, min_value, max_value |

### 1️⃣3️⃣ Lead Capture (17)
| Field | Type | Description | Key Settings |
|-------|------|-------------|--------------|
| Full Name | `fullname` | Complete name field | placeholder, name_format, include_title, include_middle |
| First Name | `firstname` | First name only | placeholder |
| Last Name | `lastname` | Last name only | placeholder |
| Company | `company` | Business name | placeholder |
| Job Title | `jobtitle` | Professional title | placeholder |
| Budget Range | `budget` | Price/budget selector | options, layout |
| Timeline | `timeline` | Project timeline | options, layout |
| Team Size | `teamsize` | Number of team members | options, layout |
| Industry | `industry` | Business industry | options, layout, allow_other |
| Referral Source | `referral` | How they found you | options, layout, allow_other |
| Satisfaction | `satisfaction` | Customer satisfaction | max_stars, star_style, rating_labels |
| Priority Level | `priority` | Urgency/Priority | options, layout |
| Lead Score | `leadscore` | Lead qualification score | slider_min, slider_max, readonly |
| Service Interest | `service` | Services of interest | options, layout, allow_other |
| Product Interest | `product` | Products of interest | options, layout, allow_other |
| Contact Method | `contactmethod` | Preferred contact | options, layout |

### 1️⃣4️⃣ Franchise & Multi-Location (10)
| Field | Type | Description | Key Settings |
|-------|------|-------------|--------------|
| Location Selector | `location_selector` | Select business location | options, layout, allow_search |
| Service Area | `service_area` | ZIP/area coverage | placeholder |
| Franchise Location | `franchise_location` | Franchise branch | options, layout, allow_search |
| Appointment Location | `appointment_location` | Service location | options, layout |
| Service Category | `service_category` | Services by location | options, layout |
| Territory | `territory` | Sales/service territory | options, layout |
| Store Finder | `store_finder` | Find nearest location | placeholder, location_type |
| Operating Hours | `operating_hours` | Hours by location | readonly, paragraph_text |
| Regional Contact | `regional_contact` | Regional manager | readonly |
| Franchise ID | `franchise_id` | Franchise identifier | readonly, hidden |

---

## 🎨 Base Settings (All Fields)

Every field includes these base settings:

```typescript
{
  required: boolean,        // Is field required?
  hidden: boolean,          // Hide field from form?
  disabled: boolean,        // Disable user input?
  readonly: boolean,        // Read-only mode?
  appearance: {
    size: 'small' | 'medium' | 'large',
    label_position: 'top' | 'left' | 'right' | 'hidden',
    text_align: 'left' | 'center' | 'right'
  }
}
```

---

## 🔍 Finding Fields

### By Category
Navigate to: `http://localhost:5173/forms/new?tab=build&section=fields`

Fields are organized in collapsible accordions:
- Basic Fields
- Choice Fields
- Date and Time
- Rating
- Formatting
- Lead Capture
- Advanced
- Layout
- Media
- Payment
- Compliance
- Spam Protection
- Franchise & Multi-Location
- Page Fields

### By Search
Use the search box at the top of the fields panel to filter by:
- Field name
- Field description
- Field type

---

## 🛠️ Common Use Cases

### Contact Form
- `firstname` + `lastname` (or `fullname`)
- `email`
- `phone`
- `company`
- `textarea` (message)

### Lead Generation
- `fullname`
- `email`
- `phone`
- `company`
- `jobtitle`
- `budget`
- `timeline`
- `service` or `product`

### Survey/Feedback
- `star_rating` or `nps`
- `likert` (for multiple questions)
- `textarea` (comments)
- `satisfaction`

### Registration Form
- `fullname`
- `email`
- `phone`
- `address`
- `legal_consent`
- `gdpr_agreement`

### Appointment Booking
- `fullname`
- `email`
- `phone`
- `scheduler` or `calendly`
- `appointment_location`
- `textarea` (notes)

### E-commerce
- `product_basket`
- `email`
- `address`
- `discount_code`
- `stripe` or `paypal`

---

## 📝 Testing Checklist

### For Each Field:
- [ ] Can add field from palette
- [ ] Field appears in canvas
- [ ] Can select field
- [ ] Settings panel opens
- [ ] Can modify all settings
- [ ] Settings persist
- [ ] Field renders in preview
- [ ] Field validates correctly
- [ ] Field submits data

### For All Fields:
- [ ] Search/filter works
- [ ] Drag-and-drop works
- [ ] Reordering works
- [ ] Duplicate works
- [ ] Delete works
- [ ] Multi-step forms work
- [ ] Conditional logic works (if implemented)

---

## 🚀 Quick Start

1. **Navigate to Form Builder:**
   ```
   http://localhost:5173/forms/new?tab=build&section=fields
   ```

2. **Add a Field:**
   - Click on any field in the left panel
   - OR drag and drop to canvas

3. **Configure Field:**
   - Click on field in canvas
   - Edit settings in right panel
   - Tabs: General, Options, Validation, Appearance, Advanced

4. **Preview Form:**
   - Click "Preview" button in header
   - Test field functionality

5. **Save Form:**
   - Click "Save Draft" or "Publish"
   - Form is saved to database

---

## 📚 Resources

- **Comprehensive List:** `.analysis/form-fields-comprehensive-list.md`
- **Status Report:** `.analysis/form-fields-status-report.md`
- **Testing Script:** `.analysis/form-fields-tester.js`

---

**Last Updated:** 2025-12-31  
**Version:** 1.0  
**Status:** ✅ Complete
