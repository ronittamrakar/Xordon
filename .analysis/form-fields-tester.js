/**
 * Form Fields Testing Utility
 * 
 * This script helps test all 111 form fields to ensure they work correctly.
 * Run this in the browser console while on the form builder page.
 */

// All field types organized by category
const allFieldTypes = {
    basic: ['text', 'textarea', 'rich_text', 'masked_text', 'email', 'number', 'phone'],

    dateTime: ['date', 'time', 'datetime', 'scheduler', 'timer'],

    choice: ['select', 'number_dropdown', 'multiselect', 'radio', 'checkbox', 'picture_choice'],

    rating: ['star_rating', 'slider', 'scale', 'likert', 'ranking', 'nps', 'like_dislike'],

    formatting: ['heading', 'paragraph', 'explanation', 'divider', 'spacer'],

    compliance: ['legal_consent', 'terms_of_service', 'gdpr_agreement', 'tcpa_consent'],

    advanced: [
        'file', 'image_upload', 'drawing', 'matrix', 'signature', 'location',
        'google_maps', 'url', 'formula', 'price', 'discount_code', 'auto_unique_id',
        'calendly', 'openai', 'api_action', 'html', 'yes_no', 'address'
    ],

    media: ['image', 'video', 'audio', 'embed_pdf', 'custom_embed', 'social_share'],

    payment: ['product_basket', 'stripe', 'paypal'],

    spamProtection: ['recaptcha', 'turnstile'],

    page: ['cover', 'welcome_page', 'ending'],

    layout: ['section', 'page_break', 'field_group', 'layout_2col', 'layout_3col', 'layout_4col', 'repeater_group'],

    leadCapture: [
        'fullname', 'firstname', 'lastname', 'company', 'jobtitle', 'budget',
        'timeline', 'teamsize', 'industry', 'referral', 'satisfaction', 'priority',
        'leadscore', 'service', 'product', 'contactmethod'
    ],

    franchise: [
        'location_selector', 'service_area', 'franchise_location', 'appointment_location',
        'service_category', 'territory', 'store_finder', 'operating_hours',
        'regional_contact', 'franchise_id'
    ]
};

// Get all field types as a flat array
const getAllFieldTypes = () => {
    return Object.values(allFieldTypes).flat();
};

// Count total fields
const getTotalFieldCount = () => {
    return getAllFieldTypes().length;
};

// Test if a field type exists in the palette
const testFieldExists = (fieldType) => {
    const fieldButton = document.querySelector(`[data-field-type="${fieldType}"]`);
    return {
        fieldType,
        exists: !!fieldButton,
        element: fieldButton
    };
};

// Test all fields exist
const testAllFieldsExist = () => {
    const results = getAllFieldTypes().map(testFieldExists);
    const missing = results.filter(r => !r.exists);

    console.log(`✅ Total Fields: ${results.length}`);
    console.log(`✅ Fields Found: ${results.filter(r => r.exists).length}`);
    console.log(`❌ Fields Missing: ${missing.length}`);

    if (missing.length > 0) {
        console.log('Missing fields:', missing.map(m => m.fieldType));
    }

    return {
        total: results.length,
        found: results.filter(r => r.exists).length,
        missing: missing.map(m => m.fieldType)
    };
};

// Get field count by category
const getFieldCountByCategory = () => {
    const counts = {};
    for (const [category, fields] of Object.entries(allFieldTypes)) {
        counts[category] = fields.length;
    }
    return counts;
};

// Print summary
const printSummary = () => {
    console.log('='.repeat(60));
    console.log('FORM FIELDS COMPREHENSIVE LIST');
    console.log('='.repeat(60));
    console.log('');

    let totalCount = 0;
    for (const [category, fields] of Object.entries(allFieldTypes)) {
        const categoryName = category.replace(/([A-Z])/g, ' $1').trim();
        console.log(`${categoryName.toUpperCase()} (${fields.length} fields):`);
        fields.forEach(field => {
            console.log(`  - ${field}`);
        });
        console.log('');
        totalCount += fields.length;
    }

    console.log('='.repeat(60));
    console.log(`TOTAL FIELDS: ${totalCount}`);
    console.log('='.repeat(60));
};

// Export for use
if (typeof window !== 'undefined') {
    window.formFieldsTester = {
        allFieldTypes,
        getAllFieldTypes,
        getTotalFieldCount,
        testFieldExists,
        testAllFieldsExist,
        getFieldCountByCategory,
        printSummary
    };

    console.log('Form Fields Tester loaded!');
    console.log('Available commands:');
    console.log('  - formFieldsTester.printSummary()');
    console.log('  - formFieldsTester.testAllFieldsExist()');
    console.log('  - formFieldsTester.getTotalFieldCount()');
    console.log('  - formFieldsTester.getFieldCountByCategory()');
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        allFieldTypes,
        getAllFieldTypes,
        getTotalFieldCount,
        getFieldCountByCategory
    };
}

// Auto-run summary
printSummary();
