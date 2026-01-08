import { describe, it, expect } from 'vitest';
import {
  getEnabledFeaturesForAccount,
  FULL_ACCOUNT_CONFIG,
  getHiddenFeatures,
} from '@/config/features';

describe('Feature registry', () => {
  it('includes crm_tasks for full product config', () => {
    const features = getEnabledFeaturesForAccount(FULL_ACCOUNT_CONFIG);
    // crm_tasks is marked as 'hidden' because it redirects to global /tasks
    expect(features.some(f => f.id === 'crm_tasks')).toBe(false);
  });

  it('does list crm_tasks as hidden', () => {
    const hidden = getHiddenFeatures();
    expect(hidden.some(f => f.id === 'crm_tasks')).toBe(true);
  });
});
