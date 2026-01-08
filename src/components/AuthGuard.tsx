import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/UnifiedAppContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/login'
}) => {
  const { user, isLoading: loading } = useAuth();
  const navigate = useNavigate();

  // Development mode bypass - always allow access in dev mode
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

  const authUser = user;
  const authLoading = loading;

  // Debug logging - must be called before any conditional returns
  useEffect(() => {
    console.log('AuthGuard Debug:', {
      user: user,
      loading: loading,
      requireAuth: requireAuth,
      redirectTo: redirectTo,
      isDevMode: isDevMode,
      timestamp: new Date().toISOString()
    });
  }, [user, loading, requireAuth, redirectTo, isDevMode]);

  useEffect(() => {
    if (!authLoading && !isDevMode) {
      if (requireAuth && !authUser) {
        console.log('AuthGuard: Redirecting to login - user not authenticated');
        navigate(redirectTo);
      } else if (!requireAuth && authUser && redirectTo !== '/login') {
        // Only redirect to dashboard if we're on a public route (like login/register)
        // and the user is already authenticated
        console.log('AuthGuard: Redirecting to dashboard - user already authenticated on public route');
        navigate('/dashboard');
      } else {
        console.log('AuthGuard: Access granted');
      }
    }
  }, [authUser, authLoading, requireAuth, redirectTo, navigate, isDevMode]);

  // Development mode bypass - always render children without any checks
  if (isDevMode) {
    console.log('AuthGuard: Development mode enabled - bypassing authentication completely');
    return <>{children}</>;
  }

  if (authLoading && !isDevMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !authUser && !isDevMode) {
    console.log('AuthGuard: Rendering null - user not authenticated');
    return null;
  }

  if (!requireAuth && authUser && !isDevMode) {
    console.log('AuthGuard: User authenticated but requireAuth is false, should redirect');
    return null; // This will be handled by the navigate effect
  }

  console.log('AuthGuard: Rendering children');
  return <>{children}</>;
};

export default AuthGuard;
