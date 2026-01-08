import React from 'react';
import { useModuleEnabled } from '@/contexts/ModuleContext';
import { useAccountSettings } from '@/hooks/useAccountSettings';
import { Package, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ModuleGuardProps {
  moduleKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function ModuleNotEnabled({ moduleKey }: { moduleKey: string }) {
  const navigate = useNavigate();

  const moduleNames: Record<string, string> = {
    operations: 'Operations',
    outreach: 'Outreach',
    forms: 'Forms',
    crm: 'CRM',
  };

  const moduleName = moduleNames[moduleKey] || moduleKey;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="bg-muted/50 rounded-full p-6 mb-6">
        <Package className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Module Not Enabled</h1>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        The <strong>{moduleName}</strong> module is not enabled for your workspace.
        Contact your workspace administrator to enable this module.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
        <Button onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

export function ModuleGuard({ moduleKey, children, fallback }: ModuleGuardProps) {
  // DEVELOPMENT MODE: All modules always enabled
  return <>{children}</>;

  /* Original code - disabled for development
  const { config, isDeveloperMode } = useAccountSettings();
  const isEnabled = useModuleEnabled(moduleKey);
  const isFullSuite = config.productMode === 'full';

  // Developer mode: bypass ALL restrictions
  if (isDeveloperMode) {
    return <>{children}</>;
  }

  if (!isEnabled && !isFullSuite) {
    return fallback ? <>{fallback}</> : <ModuleNotEnabled moduleKey={moduleKey} />;
  }

  return <>{children}</>;
  */
}



export default ModuleGuard;
