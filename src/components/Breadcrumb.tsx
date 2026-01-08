import React, { useEffect } from 'react';
import { useBreadcrumbPresence } from '@/contexts/BreadcrumbContext';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  registerPresence?: boolean;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '', registerPresence = true }) => {
  const { registerBreadcrumb } = useBreadcrumbPresence();

  useEffect(() => {
    if (!registerPresence) return;
    registerBreadcrumb(true);
    return () => registerBreadcrumb(false);
  }, [registerBreadcrumb, registerPresence]);

  void items;
  void className;

  return null;
};

export default Breadcrumb;
