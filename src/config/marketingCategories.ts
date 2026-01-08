/**
 * Marketing Feature Categories Configuration
 * Defines the organizational structure for marketing features
 */

export interface MarketingFeature {
  id: string;
  name: string;
  description: string;
  icon?: string;
  path: string;
  enabled?: boolean;
}

export interface MarketingCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  features: MarketingFeature[];
}

export const marketingCategories: MarketingCategory[] = [
  {
    id: 'digital-presence',
    name: 'Digital Presence & Discovery',
    description: 'SEO optimization and business listings management',
    icon: 'Search',
    order: 1,
    features: [
      {
        id: 'seo',
        name: 'SEO',
        description: 'Technical SEO, Content Optimization, Backlink Analysis',
        path: '/seo',
        icon: 'Search'
      },
      {
        id: 'listings',
        name: 'Business Listings',
        description: 'Local Business Listings, Citation Management, NAP Consistency',
        path: '/listings',
        icon: 'MapPin'
      }
    ]
  },
  {
    id: 'content-learning',
    name: 'Content & Learning Management',
    description: 'Educational content, courses, memberships, and certification',
    icon: 'GraduationCap',
    order: 2,
    features: [
      {
        id: 'courses',
        name: 'Courses',
        description: 'Course Creation, Lesson Management, Student Progress',
        path: '/courses',
        icon: 'BookOpen'
      },
      {
        id: 'memberships',
        name: 'Memberships',
        description: 'Member Access Control, Subscription Management',
        path: '/memberships',
        icon: 'Users'
      },
      {
        id: 'certificates',
        name: 'Certificates',
        description: 'Certificate Generation, Verification, and Management',
        path: '/certificates',
        icon: 'Award'
      }
    ]
  },
  {
    id: 'marketing-acquisition',
    name: 'Marketing & Acquisition',
    description: 'Advertising campaigns, funnels, QR codes, and affiliate programs',
    icon: 'Target',
    order: 3,
    features: [
      {
        id: 'ads-manager',
        name: 'Ads Manager',
        description: 'Google Ads, Facebook Ads, Campaign Optimization',
        path: '/ads',
        icon: 'Megaphone'
      },
      {
        id: 'funnels',
        name: 'Sales Funnels',
        description: 'Sales Funnel Creation, Conversion Tracking, A/B Testing',
        path: '/marketing/funnels',
        icon: 'Filter'
      },
      {
        id: 'qr-codes',
        name: 'QR Codes',
        description: 'QR Code Generation, Analytics, Campaign Tracking',
        path: '/marketing/qr-codes',
        icon: 'QrCode'
      },
      {
        id: 'affiliate-program',
        name: 'Affiliate Program',
        description: 'Partner Management, Commission Tracking, Referral Analytics',
        path: '/affiliates',
        icon: 'Link'
      }
    ]
  },
  {
    id: 'social-media',
    name: 'Social Media Management',
    description: 'Social media scheduling and engagement tools',
    icon: 'Share2',
    order: 4,
    features: [
      {
        id: 'social-scheduler',
        name: 'Social Scheduler',
        description: 'Multi-platform Posting, Content Calendar, Engagement Analytics',
        path: '/social',
        icon: 'Calendar'
      }
    ]
  }
];

// Helper functions
export const getCategoryById = (id: string): MarketingCategory | undefined => {
  return marketingCategories.find(category => category.id === id);
};

export const getFeatureById = (featureId: string): MarketingFeature | undefined => {
  for (const category of marketingCategories) {
    const feature = category.features.find(f => f.id === featureId);
    if (feature) return feature;
  }
  return undefined;
};

export const getFeaturesByCategory = (categoryId: string): MarketingFeature[] => {
  const category = getCategoryById(categoryId);
  return category?.features || [];
};

export const getAllFeatures = (): MarketingFeature[] => {
  return marketingCategories.flatMap(category => category.features);
};

export const isFeatureEnabled = (featureId: string): boolean => {
  const feature = getFeatureById(featureId);
  return feature?.enabled !== false; // Default to enabled if not specified
};

export default marketingCategories;