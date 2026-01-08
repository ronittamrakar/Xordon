import React, { ReactNode } from 'react';
import { usePermissionContext } from '@/contexts/UnifiedAppContext';

interface PermissionGuardProps {
  /** Single permission to check */
  permission?: string;
  /** Multiple permissions to check */
  permissions?: string[];
  /** If true, requires all permissions; if false, requires any permission */
  requireAll?: boolean;
  /** Content to render if permission check fails */
  fallback?: ReactNode;
  /** Children to render if permission check passes */
  children: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 */
export function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, isLoading } = usePermissionContext();

  // While loading, don't render anything (or could show a loading state)
  if (isLoading) {
    return null;
  }

  // Admin always has access
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check single permission
  if (permission) {
    if (hasPermission(permission)) {
      return <>{children}</>;
    }
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (hasAccess) {
      return <>{children}</>;
    }
    return <>{fallback}</>;
  }

  // No permissions specified, render children
  return <>{children}</>;
}

/**
 * Component that only renders for admin users
 */
export function AdminOnly({
  children,
  fallback = null
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isAdmin, isLoading } = usePermissionContext();

  if (isLoading) {
    return null;
  }

  if (isAdmin) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Higher-order component for permission-based rendering
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: string,
  FallbackComponent?: React.ComponentType
) {
  return function WithPermissionComponent(props: P) {
    return (
      <PermissionGuard
        permission={permission}
        fallback={FallbackComponent ? <FallbackComponent /> : null}
      >
        <WrappedComponent {...props} />
      </PermissionGuard>
    );
  };
}

export default PermissionGuard;
