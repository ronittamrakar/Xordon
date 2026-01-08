import React from 'react';
import { EnhancedFloatingSoftphone } from '@/components/EnhancedFloatingSoftphone';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  // In development mode, the AuthContext might not be available due to bypass
  // The EnhancedFloatingSoftphone handles this gracefully
  return (
    <>
      {children}
      <EnhancedFloatingSoftphone key="softphone" />
    </>
  );
};

export default AuthenticatedLayout;
