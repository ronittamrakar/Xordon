/**
 * Listings & SEO API Service
 * Business listings, local SEO, and citation management
 */

import { api } from '@/lib/api';

export interface BusinessListing {
  id: number;
  workspace_id: number;
  directory: string;
  directory_id: number | null;
  directory_name: string;
  listing_url: string | null;
  status: 'not_listed' | 'pending' | 'claimed' | 'verified' | 'needs_update' | 'error';
  claim_url: string | null;
  business_name: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  categories: string[] | null;
  name_accurate: boolean | null;
  address_accurate: boolean | null;
  phone_accurate: boolean | null;
  website_accurate: boolean | null;
  hours_accurate: boolean | null;
  accuracy_score: number | null;
  nap_consistency_score: number | null;
  last_checked_at: string | null;
  last_updated_at: string | null;
  last_synced_at: string | null;
  sync_status: 'not_synced' | 'syncing' | 'synced' | 'claimed' | 'verified' | 'error' | null;
  claim_status: 'unclaimed' | 'pending' | 'claimed' | 'verified' | null;
  review_count: number | null;
  rating_avg: number | null;
  sync_error: string | null;
  external_id: string | null;
  sync_provider: string | null;
  submission_type: 'manual' | 'automated' | 'not_sure' | null;
  submission_data: any | null;
  created_at: string;
}

export interface Directory {
  id: number;
  name: string;
  code: string;
  url: string;
  category: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  form_schema: any | null;
  automation_config: any | null;
  country: string;
  type: 'general' | 'niche' | 'location' | 'social' | 'aggregator';
  submission_url: string | null;
}

export interface ListingsResponse {
  data: BusinessListing[];
  pagination?: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export interface ListingsParams {
  [key: string]: any;
  page?: number;
  per_page?: number;
  query?: string;
  status?: string;
  directory?: string;
  sync_status?: string;
  claim_status?: string;
}

export interface SeoKeyword {
  id: number;
  workspace_id: number;
  keyword: string;
  search_volume: number | null;
  difficulty: number | null;
  current_position: number | null;
  previous_position: number | null;
  best_position: number | null;
  target_url: string | null;
  is_tracked: boolean;
  location: string | null;
  last_checked_at: string | null;
  created_at: string;
}

export interface SeoKeywordHistory {
  id: number;
  keyword_id: number;
  position: number | null;
  url: string | null;
  checked_at: string;
}

export interface SeoPage {
  id: number;
  workspace_id: number;
  url: string;
  title: string | null;
  meta_description: string | null;
  seo_score: number | null;
  page_speed_score: number | null;
  mobile_score: number | null;
  issues: Array<{ type: string; message: string }>;
  word_count: number | null;
  h1_count: number | null;
  image_count: number | null;
  images_without_alt: number | null;
  internal_links: number | null;
  external_links: number | null;
  last_crawled_at: string | null;
  created_at: string;
}

export interface ListingAudit {
  id: number;
  workspace_id: number;
  company_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  score: number | null;
  total_directories_checked: number;
  listings_found: number;
  accurate_listings: number;
  inaccurate_listings: number;
  missing_listings: number;
  duplicates_found: number;
  report_data: any | null;
  created_at: string;
  completed_at: string | null;
}

export interface ListingDuplicate {
  id: number;
  workspace_id: number;
  company_id: number;
  listing_id: number | null;
  source: string;
  duplicate_url: string;
  confidence_score: number;
  status: 'detected' | 'suppressed' | 'resolved';
  created_at: string;
}

export interface ListingReview {
  id: number;
  workspace_id: number;
  company_id: number;
  listing_id: number;
  source: string;
  external_review_id: string | null;
  reviewer_name: string | null;
  reviewer_avatar: string | null;
  rating: number;
  review_text: string | null;
  review_date: string | null;
  reply_text: string | null;
  replied_at: string | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  created_at: string;
  updated_at: string;
}

export interface ListingRankTracking {
  id: number;
  workspace_id: number;
  company_id: number;
  keyword: string;
  location: string | null;
  engine: 'google_search' | 'google_maps' | 'bing_search';
  rank: number | null;
  previous_rank: number | null;
  best_rank: number | null;
  search_volume: number;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingRankHistory {
  id: number;
  rank_tracking_id: number;
  rank: number | null;
  checked_at: string;
}

export interface ListingSettings {
  business_name: string;
  address: string;
  phone: string;
  website: string;
  description: string;
  short_description?: string;
  country?: string;
  categories: string[];
  keywords?: string[];
  year_established?: number;
  payment_methods?: string[];
  languages?: string[];
  services?: string[];
  brands?: string[];
  logo_url?: string;
  cover_photo_url?: string;
  gallery_images?: string[];
  hours: any;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  linkedin_url: string;
  youtube_url?: string;
  tiktok_url?: string;
  pinterest_url?: string;
  yelp_url?: string;
  google_maps_url?: string;
  integrations?: Record<string, any>;
}

export interface SeoCompetitor {
  id: number;
  workspace_id: number;
  name: string;
  domain: string;
  domain_authority: number | null;
  organic_traffic: number | null;
  keywords_count: number | null;
  backlinks_count: number | null;
  is_active: boolean;
  last_checked_at: string | null;
  created_at: string;
}

export interface ListingsAnalytics {
  listings: {
    total: number;
    verified: number;
    claimed: number;
    needs_update: number;
    avg_accuracy: number;
  };
  keywords: {
    total: number;
    top_3: number;
    top_10: number;
    improved: number;
    declined: number;
  };
  pages: {
    total: number;
    avg_score: number;
    good: number;
    needs_work: number;
  };
}

export interface ListingAudit {
  id: number;
  workspace_id: number;
  company_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  score: number | null;
  total_directories_checked: number;
  listings_found: number;
  accurate_listings: number;
  inaccurate_listings: number;
  missing_listings: number;
  duplicates_found: number;
  report_data: any | null;
  created_at: string;
  completed_at: string | null;
}

export interface ListingDuplicate {
  id: number;
  listing_id: number;
  duplicate_url: string;
  source: string;
  confidence_score: number;
  status: 'detected' | 'suppressed' | 'resolved';
  created_at: string;
}

export interface ListingReview {
  id: number;
  workspace_id: number;
  company_id: number;
  listing_id: number;
  source: string;
  external_review_id: string | null;
  reviewer_name: string | null;
  reviewer_avatar: string | null;
  rating: number;
  review_text: string | null;
  review_date: string | null;
  reply_text: string | null;
  replied_at: string | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  created_at: string;
  updated_at: string;
}

export const listingsApi = {
  // ==================== BUSINESS LISTINGS ====================

  async getListings(params?: ListingsParams): Promise<ListingsResponse> {
    const response = await api.get('/listings', { params }) as ListingsResponse;
    return response;
  },

  async getDirectories(params?: { country?: string; type?: string; category?: string }): Promise<Directory[]> {
    const response = await api.get('/listings/directories', { params }) as { data: Directory[] };
    return response.data;
  },

  async getBrightLocalDirectories(): Promise<any[]> {
    const response = await api.get('/listings/directories/brightlocal') as { data: any[] };
    return response.data;
  },

  async getBrightLocalCategories(country: string = 'US'): Promise<any[]> {
    const response = await api.get('/listings/categories/brightlocal', { params: { country } }) as { data: any[] };
    return response.data;
  },

  async updateListing(id: number, data: Partial<Pick<BusinessListing,
    'status' | 'listing_url' | 'business_name' | 'address' | 'phone' | 'website' |
    'categories' | 'name_accurate' | 'address_accurate' | 'phone_accurate' |
    'website_accurate' | 'hours_accurate' | 'accuracy_score' | 'submission_data'
  >>): Promise<void> {
    await api.put(`/listings/${id}`, data);
  },

  async deleteListing(id: number): Promise<void> {
    await api.delete(`/listings/${id}`);
  },



  async scanListings(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/listings/scan', {}) as { data?: { success: boolean; message: string } };
    return response.data || { success: true, message: 'Scan initiated' };
  },

  async createListing(data: {
    platform: string;
    directory_id?: number | null;
    directory_name?: string;
    listing_url?: string;
    business_name?: string;
    address?: string;
    phone?: string;
    submission_type?: 'manual' | 'automated' | 'not_sure';
    submission_data?: any;
  }): Promise<{ id: number }> {
    const response = await api.post('/listings', data) as { data: { id: number } };
    return response.data;
  },

  async bulkCreateListings(listings: Array<{
    platform: string;
    listing_url?: string;
    business_name?: string;
    address?: string;
    phone?: string;
  }>): Promise<{ success: boolean; count: number; ids: number[] }> {
    const response = await api.post('/listings/bulk', { listings }) as { data: { success: boolean; count: number; ids: number[] } };
    return response.data;
  },

  async syncListing(id: number): Promise<{ success: boolean }> {
    const response = await api.post(`/listings/${id}/sync`, {}) as { data?: { success: boolean } };
    return response.data || { success: true };
  },

  async bulkSync(ids: number[]): Promise<{ success: boolean; count: number }> {
    const response = await api.post('/listings/bulk-sync', { listing_ids: ids }) as { data: { success: boolean; count: number } };
    return response.data;
  },

  async bulkUpdateMethod(ids: number[], method: string): Promise<{ success: boolean; count: number }> {
    const response = await api.post('/listings/bulk-update-method', { listing_ids: ids, submission_type: method }) as { data: { success: boolean; count: number } };
    return response.data;
  },

  async claimListing(id: number): Promise<{ success: boolean }> {
    const response = await api.post(`/listings/${id}/claim`, {}) as { data: { success: boolean } };
    return response.data;
  },

  async verifyListing(id: number): Promise<{ success: boolean }> {
    const response = await api.post(`/listings/${id}/verify`, {}) as { data: { success: boolean } };
    return response.data;
  },

  async getListingReviews(params?: any): Promise<ListingReview[]> {
    const response = await api.get('/listings/reviews', { params }) as { data: ListingReview[] };
    return response.data;
  },

  async syncListingReviews(): Promise<{ success: boolean; count: number }> {
    const response = await api.post('/listings/reviews/sync', {}) as { data: { success: boolean; count: number } };
    return response.data;
  },

  async replyToListingReview(id: number, reply_text: string): Promise<{ success: boolean }> {
    const response = await api.post(`/listings/reviews/${id}/reply`, { reply_text }) as { data: { success: boolean } };
    return response.data;
  },

  async getSyncHistory(id: number): Promise<any[]> {
    const response = await api.get(`/listings/${id}/sync-history`) as { data: any[] };
    return response.data;
  },

  async getListingSettings(): Promise<ListingSettings> {
    const response = await api.get('/listings/settings') as { data: ListingSettings };
    return response.data;
  },

  async updateListingSettings(data: Partial<ListingSettings>): Promise<{ success: boolean }> {
    const response = await api.post('/listings/settings', data) as { data: { success: boolean } };
    return response.data;
  },

  async getListingAudits(): Promise<ListingAudit[]> {
    const response = await api.get('/listings/audits') as { data: ListingAudit[] };
    return response.data;
  },

  async startListingAudit(): Promise<{ id: number }> {
    const response = await api.post('/listings/audits', {}) as { data: { id: number } };
    return response.data;
  },

  async getListingDuplicates(): Promise<ListingDuplicate[]> {
    const response = await api.get('/listings/duplicates') as { data: ListingDuplicate[] };
    return response.data;
  },

  async suppressDuplicate(id: number): Promise<{ success: boolean }> {
    const response = await api.post(`/listings/duplicates/${id}/suppress`, {}) as { data: { success: boolean } };
    return response.data;
  },

  // ==================== SEO KEYWORDS ====================

  async getKeywords(): Promise<SeoKeyword[]> {
    const response = await api.get('/seo/keywords') as { data: SeoKeyword[] };
    return response.data;
  },

  async addKeyword(data: {
    keyword: string;
    target_url?: string;
    location?: string;
  }): Promise<{ id: number }> {
    const response = await api.post('/seo/keywords', data) as { data: { id: number } };
    return response.data;
  },

  async createKeyword(data: {
    keyword: string;
    search_engine?: string;
    location?: string;
  }): Promise<{ id: number }> {
    return this.addKeyword(data);
  },

  async deleteKeyword(id: number): Promise<void> {
    await api.delete(`/seo/keywords/${id}`);
  },

  async getKeywordHistory(id: number): Promise<SeoKeywordHistory[]> {
    const response = await api.get(`/seo/keywords/${id}/history`) as { data: SeoKeywordHistory[] };
    return response.data;
  },

  // ==================== SEO PAGES ====================

  async getPages(): Promise<SeoPage[]> {
    const response = await api.get('/seo/pages') as { data: SeoPage[] };
    return response.data;
  },

  async addPage(url: string): Promise<{ id: number }> {
    const response = await api.post('/seo/pages', { url }) as { data: { id: number } };
    return response.data;
  },

  async auditPage(id: number): Promise<{ score: number; issues: Array<{ type: string; message: string }> }> {
    const response = await api.post(`/seo/pages/${id}/audit`, {}) as { data: { score: number; issues: Array<{ type: string; message: string }> } };
    return response.data;
  },

  async scanPage(id: number): Promise<{ score: number; issues: Array<{ type: string; message: string }> }> {
    return this.auditPage(id);
  },

  // ==================== COMPETITORS ====================

  async getCompetitors(): Promise<SeoCompetitor[]> {
    const response = await api.get('/seo/competitors') as { data: SeoCompetitor[] };
    return response.data;
  },

  async addCompetitor(data: { name: string; domain: string }): Promise<{ id: number }> {
    const response = await api.post('/seo/competitors', data) as { data: { id: number } };
    return response.data;
  },

  async deleteCompetitor(id: number): Promise<void> {
    await api.delete(`/seo/competitors/${id}`);
  },

  async checkCompetitorCitations(data: { name: string; url?: string }): Promise<any[]> {
    const response = await api.post('/seo/competitors/citations/check', data) as { data: any[] };
    return response.data;
  },

  async searchCompetitorsByKeyword(data: { keyword: string; location?: string }): Promise<any[]> {
    const response = await api.post('/seo/competitors/search', data) as { data: any[] };
    return response.data;
  },

  // ==================== ANALYTICS ====================

  async getAnalytics(): Promise<ListingsAnalytics> {
    const response = await api.get('/seo/analytics') as { data: ListingsAnalytics };
    return response.data;
  },

  // ==================== SEO - KEYWORD EXPLORER ====================

  async exploreKeywords(params: {
    keyword: string;
    location?: string;
    limit?: number;
  }): Promise<any[]> {
    const response = await api.post('/seo/keywords/explore', params) as { data: any[] };
    return response.data;
  },

  // ==================== SEO - BACKLINKS ====================

  async getBacklinks(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ backlinks: any[]; stats: any }> {
    const response = await api.get('/seo/backlinks', { params }) as { data: { backlinks: any[]; stats: any } };
    return response.data;
  },

  async addBacklink(data: {
    source_url: string;
    target_url: string;
    anchor_text?: string;
    link_type?: string;
  }): Promise<{ id: number }> {
    const response = await api.post('/seo/backlinks', data) as { data: { id: number } };
    return response.data;
  },

  async getBacklinksByDomain(): Promise<any[]> {
    const response = await api.get('/seo/backlinks/by-domain') as { data: any[] };
    return response.data;
  },

  async getCompetitorBacklinks(domain: string): Promise<any[]> {
    const response = await api.get(`/seo/backlinks/competitor/${encodeURIComponent(domain)}`) as { data: any[] };
    return response.data;
  },

  // ==================== SEO - SITE AUDITS ====================

  async getAudits(): Promise<any[]> {
    const response = await api.get('/seo/audits') as { data: any[] };
    return response.data;
  },

  async createAudit(data: {
    url: string;
    audit_type?: string;
  }): Promise<{ id: number }> {
    const response = await api.post('/seo/audits', data) as { data: { id: number } };
    return response.data;
  },

  async getAudit(id: number): Promise<any> {
    const response = await api.get(`/seo/audits/${id}`) as { data: any };
    return response.data;
  },

  // ==================== LOCAL SEO RANK TRACKING ====================

  async getRankTrackings(): Promise<ListingRankTracking[]> {
    const response = await api.get('/listings/ranks') as { data: ListingRankTracking[] };
    return response.data;
  },

  async addRankTracking(data: { keyword: string; location?: string; engine?: string }): Promise<{ id: number }> {
    const response = await api.post('/listings/ranks', data) as { data: { id: number } };
    return response.data;
  },

  async deleteRankTracking(id: number): Promise<void> {
    await api.delete(`/listings/ranks/${id}`);
  },

  async refreshRankTracking(id: number): Promise<void> {
    await api.post(`/listings/ranks/${id}/refresh`, {});
  },

  async getRankHistory(id: number): Promise<ListingRankHistory[]> {
    const response = await api.get(`/listings/ranks/${id}/history`) as { data: ListingRankHistory[] };
    return response.data;
  },

  // ==================== REVIEWS ====================

  async importFromGoogleSheets(spreadsheetId: string, sheetName?: string): Promise<{ success: boolean; count: number }> {
    const response = await api.post('/listings/import/google-sheets', { spreadsheetId, sheetName }) as { data: { success: boolean; count: number } };
    return response.data;
  },

  async syncApifyCitations(apiKey: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/listings/import/apify-citations', { apiKey }) as { data: { success: boolean; message: string } };
    return response.data;
  },

};

export default listingsApi;
