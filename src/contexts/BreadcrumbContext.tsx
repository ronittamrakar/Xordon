import { createContext, useContext, useState, useCallback, PropsWithChildren } from 'react';

interface BreadcrumbPresenceContextValue {
  hasBreadcrumb: boolean;
  registerBreadcrumb: (present: boolean) => void;
}

const BreadcrumbPresenceContext = createContext<BreadcrumbPresenceContextValue | null>(null);
const fallbackContext: BreadcrumbPresenceContextValue = {
  hasBreadcrumb: false,
  registerBreadcrumb: () => {},
};

export const useBreadcrumbPresence = () => {
  const context = useContext(BreadcrumbPresenceContext);
  if (!context) {
    if (import.meta.env.DEV) {
      console.warn('BreadcrumbContext: Provider missing, falling back to no-op context.');
    }
    return fallbackContext;
  }
  return context;
};

export const BreadcrumbProvider = ({ children }: PropsWithChildren) => {
  const [hasBreadcrumb, setHasBreadcrumb] = useState(false);

  const registerBreadcrumb = useCallback((present: boolean) => {
    setHasBreadcrumb(present);
  }, []);

  return (
    <BreadcrumbPresenceContext.Provider value={{ hasBreadcrumb, registerBreadcrumb }}>
      {children}
    </BreadcrumbPresenceContext.Provider>
  );
};

export default BreadcrumbProvider;
