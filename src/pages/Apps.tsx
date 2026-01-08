import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appsApi, type AppModule } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Package, Mail, Phone, ClipboardList, Globe, FileTextIcon, Zap, TrendingUp, Wrench, DollarSign, Kanban, Megaphone, Settings, Lock } from 'lucide-react';

// Map module icons to Lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  Mail,
  Phone,
  ClipboardList,
  Globe,
  FileTextIcon,
  Zap,
  TrendingUp,
  Wrench,
  DollarSign,
  Kanban,
  Megaphone,
  Settings,
};

export default function Apps() {
  const navigate = useNavigate();
  const [modules, setModules] = useState<AppModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setLoading(true);
      const response = await appsApi.getWorkspaceModules();
      setModules(response.modules || []);
    } catch (error) {
      console.error('Failed to load modules:', error);
      toast.error('Failed to load apps');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModule = async (module: AppModule) => {
    if (module.is_core) {
      toast.error('Core modules cannot be disabled');
      return;
    }

    setActionLoading(module.module_key);
    try {
      if (module.status === 'installed') {
        await appsApi.disable(module.module_key);
        toast.success(`${module.name} disabled`);
      } else {
        await appsApi.install(module.module_key);
        toast.success(`${module.name} installed`);
      }
      await loadModules();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Operation failed';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Package;
    return IconComponent;
  };

  const getStatusBadge = (module: AppModule) => {
    if (module.is_core) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700"><Lock className="h-3 w-3 mr-1" /> Core</Badge>;
    }
    if (module.status === 'installed') {
      return <Badge variant="default" className="bg-green-100 text-green-700">Installed</Badge>;
    }
    if (module.status === 'disabled') {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Disabled</Badge>;
    }
    return <Badge variant="outline" className="text-gray-500">Not Installed</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group modules by category
  const coreModules = modules.filter(m => m.is_core);
  const installedModules = modules.filter(m => !m.is_core && m.status === 'installed');
  const availableModules = modules.filter(m => !m.is_core && m.status !== 'installed');

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Apps</h1>
        <p className="text-muted-foreground mt-2">
          Manage which modules are enabled for your workspace. Install apps to unlock new features.
        </p>
      </div>

      {/* Core Modules */}
      {coreModules.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Core Platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreModules.map((module) => {
              const Icon = getIcon(module.icon);
              return (
                <Card key={module.module_key} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{module.name}</CardTitle>
                          <div className="mt-1">{getStatusBadge(module)}</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {module.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Installed Modules */}
      {installedModules.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Installed Apps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {installedModules.map((module) => {
              const Icon = getIcon(module.icon);
              const isLoading = actionLoading === module.module_key;
              return (
                <Card key={module.module_key} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                          <Icon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{module.name}</CardTitle>
                          <div className="mt-1">{getStatusBadge(module)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Switch
                            checked={module.status === 'installed'}
                            onCheckedChange={() => handleToggleModule(module)}
                          />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {module.description}
                    </CardDescription>
                    {module.dependencies && module.dependencies.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Requires: {module.dependencies.join(', ')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Modules */}
      {availableModules.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Available Apps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableModules.map((module) => {
              const Icon = getIcon(module.icon);
              const isLoading = actionLoading === module.module_key;
              return (
                <Card key={module.module_key} className="relative opacity-80 hover:opacity-100 transition-opacity">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                          <Icon className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{module.name}</CardTitle>
                          <div className="mt-1">{getStatusBadge(module)}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleModule(module)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Install'
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {module.description}
                    </CardDescription>
                    {module.dependencies && module.dependencies.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Requires: {module.dependencies.join(', ')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {modules.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No apps available</h3>
          <p className="text-muted-foreground">Apps will appear here once configured.</p>
        </div>
      )}
    </div>
  );
}

