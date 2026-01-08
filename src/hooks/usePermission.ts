import { usePermissionContext } from '@/contexts/PermissionContext';

/**
 * Hook to check if the current user has a specific permission
 */
export function usePermission(permission: string): boolean {
  const { hasPermission } = usePermissionContext();
  return hasPermission(permission);
}

/**
 * Hook to check if the current user has any of the specified permissions
 */
export function useAnyPermission(permissions: string[]): boolean {
  const { hasAnyPermission } = usePermissionContext();
  return hasAnyPermission(permissions);
}

/**
 * Hook to check if the current user has all of the specified permissions
 */
export function useAllPermissions(permissions: string[]): boolean {
  const { hasAllPermissions } = usePermissionContext();
  return hasAllPermissions(permissions);
}

/**
 * Hook to check if the current user is an admin
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = usePermissionContext();
  return isAdmin;
}

/**
 * Hook to get the current user's role
 */
export function useRole() {
  const { role } = usePermissionContext();
  return role;
}

/**
 * Hook to get all permission-related data
 */
export function usePermissions() {
  const { 
    role, 
    permissions, 
    isAdmin, 
    isLoading, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    refreshPermissions 
  } = usePermissionContext();
  
  return {
    role,
    permissions,
    isAdmin,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions,
  };
}
