/**
 * Module Settings API Service
 * Settings for Growth and HR modules
 */

import { api } from '@/lib/api';

interface ApiResponse<T> {
  data?: T;
}

export interface ModuleSettings {
  [key: string]: unknown;
}

export interface GrowthSocialSettings {
  default_approval_required: boolean;
  auto_schedule_enabled: boolean;
  posting_timezone: string;
  best_times_enabled: boolean;
}

export interface GrowthListingsSettings {
  auto_sync_enabled: boolean;
  sync_frequency: 'hourly' | 'daily' | 'weekly';
  alert_on_changes: boolean;
  monitored_directories: string[];
}

export interface GrowthAdsSettings {
  budget_alerts_enabled: boolean;
  alert_threshold_percent: number;
  auto_pause_on_budget: boolean;
  conversion_tracking_enabled: boolean;
}

export interface HRTimeSettings {
  require_clock_in: boolean;
  allow_manual_entries: boolean;
  overtime_threshold_hours: number;
  overtime_multiplier: number;
  require_approval: boolean;
  auto_approve_under_hours: number;
  billable_default: boolean;
  default_hourly_rate: number | null;
}

export interface HRExpensesSettings {
  require_receipt_over_amount: number;
  auto_approve_under_amount: number;
  mileage_rate: number;
  require_approval: boolean;
  max_expense_amount: number | null;
}

export interface HRCommissionsSettings {
  default_commission_rate: number | null;
  calculation_period: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  payout_schedule: 'weekly' | 'biweekly' | 'monthly';
  require_approval: boolean;
  auto_calculate_enabled: boolean;
}

export interface HRLeaveSettings {
  vacation_accrual_rate: number;
  sick_accrual_rate: number;
  personal_days: number;
  max_carryover: number;
  require_approval: boolean;
}

export interface HRPayrollSettings {
  default_pay_period: 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';
  processing_lead_time: number;
  auto_process: boolean;
  require_timesheet_approval: boolean;
  federal_tax_rate: number;
  state_tax_rate: number;
  social_security_rate: number;
  medicare_rate: number;
  employer_social_security_rate: number;
  employer_medicare_rate: number;
  employer_unemployment_rate: number;
}

export interface AllModuleSettings {
  'growth.social': GrowthSocialSettings;
  'growth.listings': GrowthListingsSettings;
  'growth.ads': GrowthAdsSettings;
  'hr.time': HRTimeSettings;
  'hr.expenses': HRExpensesSettings;
  'hr.commissions': HRCommissionsSettings;
  'hr.leave': HRLeaveSettings;
  'hr.payroll': HRPayrollSettings;
}

export const moduleSettingsApi = {
  /**
   * Get all module settings
   */
  async getAllSettings(): Promise<AllModuleSettings> {
    const response = await api.get('/settings/modules');
    return response.data?.data || {};
  },

  /**
   * Get settings for a specific module
   */
  async getModuleSettings<T extends ModuleSettings>(module: string): Promise<T> {
    const response = await api.get(`/settings/module/${module}`);
    return response.data?.data?.settings || {};
  },

  /**
   * Update settings for a specific module
   */
  async updateModuleSettings(module: string, settings: Partial<ModuleSettings>): Promise<void> {
    await api.put(`/settings/module/${module}`, settings);
  },

  /**
   * Get a single setting value
   */
  async getSetting<T>(module: string, key: string): Promise<T> {
    const response = await api.get(`/settings/module/${module}/${key}`);
    return response.data?.data?.value;
  },

  /**
   * Reset module settings to defaults
   */
  async resetModuleSettings(module: string): Promise<void> {
    await api.delete(`/settings/module/${module}`);
  },

  // Convenience methods for specific modules
  async getGrowthSocialSettings(): Promise<GrowthSocialSettings> {
    return this.getModuleSettings<GrowthSocialSettings>('growth.social');
  },

  async updateGrowthSocialSettings(settings: Partial<GrowthSocialSettings>): Promise<void> {
    return this.updateModuleSettings('growth.social', settings);
  },

  async getGrowthListingsSettings(): Promise<GrowthListingsSettings> {
    return this.getModuleSettings<GrowthListingsSettings>('growth.listings');
  },

  async updateGrowthListingsSettings(settings: Partial<GrowthListingsSettings>): Promise<void> {
    return this.updateModuleSettings('growth.listings', settings);
  },

  async getGrowthAdsSettings(): Promise<GrowthAdsSettings> {
    return this.getModuleSettings<GrowthAdsSettings>('growth.ads');
  },

  async updateGrowthAdsSettings(settings: Partial<GrowthAdsSettings>): Promise<void> {
    return this.updateModuleSettings('growth.ads', settings);
  },

  async getHRTimeSettings(): Promise<HRTimeSettings> {
    return this.getModuleSettings<HRTimeSettings>('hr.time');
  },

  async updateHRTimeSettings(settings: Partial<HRTimeSettings>): Promise<void> {
    return this.updateModuleSettings('hr.time', settings);
  },

  async getHRExpensesSettings(): Promise<HRExpensesSettings> {
    return this.getModuleSettings<HRExpensesSettings>('hr.expenses');
  },

  async updateHRExpensesSettings(settings: Partial<HRExpensesSettings>): Promise<void> {
    return this.updateModuleSettings('hr.expenses', settings);
  },

  async getHRCommissionsSettings(): Promise<HRCommissionsSettings> {
    return this.getModuleSettings<HRCommissionsSettings>('hr.commissions');
  },

  async updateHRCommissionsSettings(settings: Partial<HRCommissionsSettings>): Promise<void> {
    return this.updateModuleSettings('hr.commissions', settings);
  },

  async getHRLeaveSettings(): Promise<HRLeaveSettings> {
    return this.getModuleSettings<HRLeaveSettings>('hr.leave');
  },

  async updateHRLeaveSettings(settings: Partial<HRLeaveSettings>): Promise<void> {
    return this.updateModuleSettings('hr.leave', settings);
  },

  async getHRPayrollSettings(): Promise<HRPayrollSettings> {
    return this.getModuleSettings<HRPayrollSettings>('hr.payroll');
  },

  async updateHRPayrollSettings(settings: Partial<HRPayrollSettings>): Promise<void> {
    return this.updateModuleSettings('hr.payroll', settings);
  },
};

export default moduleSettingsApi;
