import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface RoleInfo {
  role: string;
  level: number;
  is_owner: boolean;
  is_admin: boolean;
  is_manager: boolean;
}

interface WorkspacePermissions {
  // HR Time Tracking
  'hr.time.view_own': boolean;
  'hr.time.create_own': boolean;
  'hr.time.view_all': boolean;
  'hr.time.approve': boolean;
  'hr.time.manage_settings': boolean;

  // HR Leave
  'hr.leave.view_own': boolean;
  'hr.leave.create_own': boolean;
  'hr.leave.view_all': boolean;
  'hr.leave.approve': boolean;
  'hr.leave.manage_settings': boolean;

  // HR Expenses
  'hr.expenses.view_own': boolean;
  'hr.expenses.create_own': boolean;
  'hr.expenses.view_all': boolean;
  'hr.expenses.approve': boolean;
  'hr.expenses.manage_categories': boolean;
  'hr.expenses.manage_settings': boolean;

  // HR Commissions
  'hr.commissions.view_own': boolean;
  'hr.commissions.view_all': boolean;
  'hr.commissions.approve': boolean;
  'hr.commissions.manage_plans': boolean;
  'hr.commissions.manage_settings': boolean;

  // Growth Social
  'growth.social.view': boolean;
  'growth.social.create': boolean;
  'growth.social.publish': boolean;
  'growth.social.manage_accounts': boolean;
  'growth.social.manage_settings': boolean;

  // Growth Listings/SEO
  'growth.listings.view': boolean;
  'growth.listings.manage': boolean;
  'growth.listings.manage_settings': boolean;

  // Growth Ads
  'growth.ads.view': boolean;
  'growth.ads.manage_budgets': boolean;
  'growth.ads.manage_accounts': boolean;
  'growth.ads.manage_settings': boolean;

  // Settings
  'settings.view': boolean;
  'settings.manage': boolean;
  'settings.billing': boolean;

  [key: string]: boolean;
}

interface WorkspacePermissionsResponse {
  success: boolean;
  data: {
    role: RoleInfo;
    permissions: WorkspacePermissions;
  };
}

export function useWorkspacePermissions() {
  const { data, isLoading, error } = useQuery<WorkspacePermissionsResponse>({
    queryKey: ['workspace-permissions'],
    queryFn: async () => {
      // TODO: Implement proper API endpoint when backend is ready
      // Return default permissions for now
      return {
        success: true,
        data: {
          role: { role: 'member', level: 20, is_owner: false, is_admin: false, is_manager: false },
          permissions: {} as WorkspacePermissions
        }
      };
    },
    staleTime: 15 * 1000, // 15 seconds - aggressive memory optimization
    gcTime: 30 * 1000, // 30 seconds - fast garbage collection
    retry: 1,
  });

  const roleInfo = data?.data?.role ?? {
    role: 'member',
    level: 20,
    is_owner: false,
    is_admin: false,
    is_manager: false,
  };

  const permissions = data?.data?.permissions ?? {} as WorkspacePermissions;

  // Helper functions
  const can = (permission: keyof WorkspacePermissions | string): boolean => {
    return permissions[permission] ?? false;
  };

  const isOwner = (): boolean => roleInfo.is_owner;
  const isAdmin = (): boolean => roleInfo.is_admin;
  const isManager = (): boolean => roleInfo.is_manager;
  const getRole = (): string => roleInfo.role;

  // HR-specific helpers
  const canApproveTimeEntries = (): boolean => can('hr.time.approve');
  const canApproveLeave = (): boolean => can('hr.leave.approve');
  const canApproveExpenses = (): boolean => can('hr.expenses.approve');
  const canApproveCommissions = (): boolean => can('hr.commissions.approve');
  const canViewAllHRData = (): boolean => isManager();

  // Growth-specific helpers
  const canPublishSocial = (): boolean => can('growth.social.publish');
  const canManageAdBudgets = (): boolean => can('growth.ads.manage_budgets');

  return {
    // Raw data
    roleInfo,
    permissions,
    isLoading,
    error,

    // Generic permission check
    can,

    // Role checks
    isOwner,
    isAdmin,
    isManager,
    getRole,

    // HR helpers
    canApproveTimeEntries,
    canApproveLeave,
    canApproveExpenses,
    canApproveCommissions,
    canViewAllHRData,

    // Growth helpers
    canPublishSocial,
    canManageAdBudgets,
  };
}

export type { RoleInfo, WorkspacePermissions };
