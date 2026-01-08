import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissionContext } from '@/contexts/PermissionContext';
import { Loader2 } from 'lucide-react';
import AccessDenied from '@/pages/AccessDenied';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Single permission required */
  permission?: string;
  /** Multiple permissions - user needs at least one (or all if requireAll is true) */
  permissions?: string[];
  /** If true, requires all permissions; if false, requires any permission */
  requireAll?: boolean;
  /** If true, only admins can access */
  adminOnly?: boolean;
  /** Custom fallback component instead of AccessDenied */
  fallback?: ReactNode;
  /** Redirect path instead of showing AccessDenied */
  redirectTo?: string;
}

/**
 * Route wrapper that checks permissions before rendering
 */
export function ProtectedRoute({
  children,
  permission,
  permissions,
  requireAll = false,
  adminOnly = false,
  fallback,
  redirectTo,
}: ProtectedRouteProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, isLoading } = usePermissionContext();
  const location = useLocation();

  // Show loading state while permissions are being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Check admin-only access
  if (adminOnly && !isAdmin) {
    if (redirectTo) {
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }
    return fallback ? <>{fallback}</> : <AccessDenied message="Administrator access required" />;
  }

  // Admin always has access (unless adminOnly check already passed)
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check single permission
  if (permission) {
    if (!hasPermission(permission)) {
      if (redirectTo) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
      }
      return fallback ? <>{fallback}</> : <AccessDenied permission={permission} />;
    }
    return <>{children}</>;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions) 
      : hasAnyPermission(permissions);
    
    if (!hasAccess) {
      if (redirectTo) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
      }
      const requiredPermission = requireAll 
        ? permissions.join(' AND ') 
        : permissions.join(' OR ');
      return fallback ? <>{fallback}</> : <AccessDenied permission={requiredPermission} />;
    }
    return <>{children}</>;
  }

  // No permissions specified, allow access
  return <>{children}</>;
}

/**
 * Route wrapper that requires admin access
 */
export function AdminRoute({ children, fallback, redirectTo }: {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}) {
  return (
    <ProtectedRoute adminOnly fallback={fallback} redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
}

export default ProtectedRoute;
