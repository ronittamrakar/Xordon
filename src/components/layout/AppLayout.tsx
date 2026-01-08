import { ReactNode, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Footer } from './Footer';
import { useAuth } from '@/contexts/UnifiedAppContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings, BarChart3, Plus, Building2, Check, ArrowRight, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { BreadcrumbProvider } from '@/contexts/BreadcrumbContext';
import { useTenantOptional } from '@/contexts/TenantContext';
import { api, type Workspace } from '@/lib/api';
import { EnhancedFloatingSoftphone } from '@/components/EnhancedFloatingSoftphone';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BreadcrumbNavigation } from './topbar/BreadcrumbNavigation';
import { GlobalSearch } from './topbar/GlobalSearch';
import { QuickActions } from './topbar/QuickActions';
import { NotificationCenter } from './topbar/NotificationCenter';
import { WorkspaceSwitcher } from './topbar/WorkspaceSwitcher';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import SEO from '@/components/SEO';

interface AppLayoutProps {
  children: ReactNode;
  disableMainPadding?: boolean;
  hideHeader?: boolean;
}

const DEBUG_STARTUP = import.meta.env.VITE_DEBUG_STARTUP === 'true';

export function AppLayout(props: AppLayoutProps) {
  const { children, disableMainPadding, hideHeader } = props;
  return (
    <BreadcrumbProvider>
      <AppLayoutShell disableMainPadding={disableMainPadding} hideHeader={hideHeader}>{children}</AppLayoutShell>
    </BreadcrumbProvider>
  );
}

const segmentLabelMap: Record<string, string> = {
  dashboard: 'Dashboard',
  email: 'Email',
  sms: 'SMS',
  calls: 'Calls',
  campaigns: 'Campaigns',
  sequences: 'Sequences',
  templates: 'Templates',
  replies: 'Replies',
  unsubscribers: 'Unsubscribers',
  settings: 'Settings',
  contacts: 'Contacts',
  reports: 'Reports',
  forms: 'Forms',
  scheduling: 'Scheduling',
  'client-portal': 'Dashboard',
};

const formatSegmentLabel = (segment: string) => {
  const normalized = segment.toLowerCase();
  if (segmentLabelMap[normalized]) {
    return segmentLabelMap[normalized];
  }

  if (/^[0-9a-f-]{8,}$/i.test(segment) || /^\d+$/.test(segment)) {
    return 'Details';
  }

  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const AppLayoutShell = ({ children, disableMainPadding, hideHeader }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, tenant, logout, refreshAuth, isLoading: authLoading } = useAuth();
  const { open } = useSidebar();
  const tenantContext = useTenantOptional();

  // Dev mode bypass
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

  // 1. Fetch Workspaces
  const {
    data: workspaces = [],
    isLoading: isWorkspacesLoading,
  } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.getWorkspaces().catch(() => []),
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes - workspaces rarely change
    gcTime: 30 * 60 * 1000,    // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const queryClient = useQueryClient();
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceSlug, setNewWorkspaceSlug] = useState('');
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [loadingTooLong, setLoadingTooLong] = useState(false);

  // Track if loading takes too long (5 seconds)
  useEffect(() => {
    if (authLoading) {
      const timer = setTimeout(() => setLoadingTooLong(true), 5000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTooLong(false);
    }
  }, [authLoading]);

  if (DEBUG_STARTUP) {
    console.log('AppLayout: Rendering with user:', user, 'authLoading:', authLoading, 'isDevMode:', isDevMode);
  }

  const isLandingPage = ['/', '/login', '/register'].includes(location.pathname);

  useEffect(() => {
    if (authLoading && !isDevMode) return;
    if (!user && location.pathname !== '/auth' && !isDevMode) {
      if (DEBUG_STARTUP) console.log('AppLayout: User not authenticated, redirecting to /auth');
      navigate('/auth', { replace: true, state: { from: location } });
    }
  }, [user, authLoading, navigate, location, isDevMode]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const selectWorkspace = async (ws: Workspace) => {
    localStorage.setItem('tenant_id', ws.id);
    localStorage.setItem('tenant_subdomain', ws.slug);
    localStorage.setItem('tenant_name', ws.name);
    try {
      await refreshAuth();
    } finally {
      navigate(location.pathname + location.search + location.hash, { replace: true });
    }
  };

  const createWorkspace = async () => {
    setWorkspaceError(null);
    const name = newWorkspaceName.trim();
    const slug = newWorkspaceSlug.trim();

    if (!name) {
      setWorkspaceError('Workspace name is required');
      return;
    }

    setIsCreatingWorkspace(true);
    try {
      const ws = await api.createWorkspace({ name, ...(slug ? { slug } : {}) });
      localStorage.setItem('tenant_id', ws.id);
      localStorage.setItem('tenant_subdomain', ws.slug);
      localStorage.setItem('tenant_name', ws.name);
      await refreshAuth();
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setIsCreateWorkspaceOpen(false);
      setNewWorkspaceName('');
      setNewWorkspaceSlug('');
      navigate(location.pathname + location.search + location.hash, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create workspace';
      setWorkspaceError(message);
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  // Show loading state (but not in dev mode - dev mode should auto-initialize)
  if (authLoading && !isDevMode) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <div className="text-sm text-muted-foreground">Loading...</div>
        {loadingTooLong && (
          <div className="text-xs text-muted-foreground max-w-xs text-center">
            Taking longer than expected. Check your backend connection.
            <button
              onClick={() => window.location.reload()}
              className="ml-2 underline hover:text-foreground"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!user && !isDevMode) {
    if (DEBUG_STARTUP) console.log('AppLayout: No user found, returning null');
    return null;
  }

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : 'dashboard';
  const pageTitle = formatSegmentLabel(lastSegment);

  const getSettingsPath = () => {
    const path = location.pathname.toLowerCase();

    // Specific/New Modules first
    if (path.includes('/culture')) return '/settings?tab=culture';
    if (path.includes('/affiliates')) return '/settings?tab=affiliates';
    if (path.includes('/loyalty')) return '/settings?tab=loyalty';
    if (path.includes('/webinars')) return '/settings?tab=webinars';
    if (path.includes('/field-service')) return '/settings?tab=field-service';
    if (path.includes('/payments')) return '/settings?tab=payments';
    if (path.includes('/scheduling')) return '/settings?tab=scheduling';

    // Existing/General Categories
    if (path.includes('/profile') || path.includes('/account')) return '/settings?tab=profile';
    if (path.includes('/integrations')) return '/settings?tab=integrations';
    if (path.includes('/channels') || path.includes('/whatsapp')) return '/settings?tab=channels';
    if (path.includes('/forms') || path.includes('/webforms')) return '/settings?tab=forms';
    if (path.includes('/proposals')) return '/settings?tab=proposals';
    if (path.includes('/websites')) return '/settings?tab=websites';
    if (path.includes('/seo')) return '/settings?tab=seo';
    if (path.includes('/blog')) return '/settings?tab=blog';
    if (path.includes('/marketing')) return '/settings?tab=marketing';
    if (path.includes('/courses') || path.includes('/memberships') || path.includes('/lms')) return '/settings?tab=lms';
    if (path.includes('/email')) return '/settings?tab=email';
    if (path.includes('/sms') || path.includes('/calls') || path.includes('/reach/calls')) return '/settings?tab=sms-and-calls';
    if (path.includes('/crm') || path.includes('/contacts')) return '/settings?tab=crm';
    if (path.includes('/projects') || path.includes('/tasks')) return '/settings?tab=projects';
    if (path.includes('/ecommerce') || path.includes('/products')) return '/settings?tab=ecommerce';
    if (path.includes('/operations')) return '/settings?tab=industry';
    if (path.includes('/finance')) return '/settings?tab=finance';
    if (path.includes('/hr')) return '/settings?tab=hr';
    if (path.includes('/reputation')) return '/settings?tab=reputation';
    if (path.includes('/helpdesk')) return '/settings?tab=helpdesk';
    if (path.includes('/ai')) return '/settings?tab=ai';
    if (path.includes('/agency') || path.includes('/clients')) return '/settings?tab=agency';
    if (path.includes('/automations')) return '/settings?tab=automation';
    if (path.includes('/api') || path.includes('/webhooks')) return '/settings?tab=api';
    return '/settings';
  };

  const getReportingPath = () => {
    const path = location.pathname.toLowerCase();

    // Specific Module Analytics
    if (path.includes('/culture')) return '/culture/analytics';
    if (path.includes('/affiliates')) return '/affiliates/analytics';
    if (path.includes('/automations')) return '/automations/analytics';
    if (path.includes('/sales')) return '/sales/analytics';
    if (path.includes('/marketing/funnels') || path.includes('/funnels')) return '/marketing/funnels/analytics';
    if (path.includes('/marketing/seo') || path.includes('/seo')) return '/marketing/seo/analytics';
    if (path.includes('/field-service')) return '/operations/field-service/analytics';

    // General Module Analytics
    if (path.includes('/forms')) return '/forms/analytics';
    if (path.includes('/proposals')) return '/proposals/analytics';
    if (path.includes('/reach/calls') || path.includes('/calls')) return '/reach/calls/analytics';
    if (path.includes('/reach/outbound/email') || path.includes('/email')) return '/reach/email/analytics';
    if (path.includes('/reach/outbound/sms') || path.includes('/sms')) return '/reach/sms/analytics';
    if (path.includes('/helpdesk')) return '/helpdesk/reports';
    if (path.includes('/crm')) return '/reports';
    if (path.includes('/finance')) return '/finance/overview';
    if (path.includes('/hr')) return '/analytics/dashboard';
    if (path.includes('/websites')) return '/websites/analytics';
    if (path.includes('/operations')) return '/operations/dashboard';
    if (path.includes('/loyalty')) return '/marketing/loyalty';
    if (path.includes('/webinars')) return '/marketing/webinars';

    return '/analytics/dashboard';
  };

  return (
    <SidebarProvider>
      <SEO
        title={pageTitle}
        description="Holistic outreach and operations automation platform"
      />
      <div className="flex min-h-screen w-full">
        <AppSidebar
          tenantId={tenant?.id}
          tenantName={tenant?.name}
          workspaces={workspaces}
          isWorkspacesLoading={isWorkspacesLoading}
          onSelectWorkspace={selectWorkspace}
          onOpenCreateWorkspace={() => setIsCreateWorkspaceOpen(true)}
        />
        {/* Ensure the main content is pushed by the sidebar using peer data-attributes.
            - When sidebar is expanded: push by --sidebar-width
            - When sidebar is collapsed: push by --sidebar-width-icon + spacing
            - When offcanvas: no margin
        */}
        <div className="flex-1 flex flex-col bg-background min-w-0 transition-all duration-200">
          {!hideHeader && (
            <header className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-8 items-center gap-3 px-4 sm:px-6">
                <div className="flex items-center gap-4">
                  {!open && <SidebarTrigger className="h-7 w-7" />}

                  {tenantContext && (
                    <div className="hidden md:flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 border border-border/40">
                          {tenantContext.currentSubaccount ? (
                            <User className="h-4 w-4 text-foreground/80" />
                          ) : (
                            <Building2 className="h-4 w-4 text-foreground/80" />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] font-semibold leading-none text-foreground tracking-tight">
                            {tenantContext.currentSubaccount?.name || tenantContext.currentAgency?.name || 'Select Account'}
                          </span>
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
                            {tenantContext.currentSubaccount ? tenantContext.subaccountLabel : 'Agency'}
                          </span>
                        </div>
                      </div>


                    </div>
                  )}

                  {/* Mobile fallback for breadcrumbs if needed, though hidden md:flex handles it */}
                </div>

                <div className="flex flex-1 items-center justify-center px-4">
                  <GlobalSearch />
                </div>

                <div className="flex items-center gap-1.5 sm:gap-3">
                  <QuickActions />

                  <div className="hidden h-5 w-px bg-border sm:block" />

                  <NotificationCenter />
                  <ThemeToggle />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(getReportingPath())}
                    title="Reporting & Analytics"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(getSettingsPath())}
                    title="Page Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full h-7 w-7">
                        <Avatar className="h-6 w-6 border">
                          <AvatarFallback className="bg-muted text-[10px]">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[300px] p-2" sideOffset={6}>
                      {/* Current User Header */}
                      <div className="px-2 py-2 mb-1 flex items-center gap-2.5">
                        <Avatar className="h-9 w-9 border shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <p className="text-[12px] font-semibold truncate leading-tight">{user?.name || 'Guest User'}</p>
                          <p className="text-[12px] text-muted-foreground truncate leading-tight mt-0.5">{user?.email || 'guest@example.com'}</p>
                        </div>
                      </div>

                      <DropdownMenuSeparator className="mx-1 my-2" />

                      {tenantContext && (
                        <>
                          {/* Agency Section */}
                          <div className="px-2 py-1.5 flex items-center justify-between">
                            <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Agency</span>
                            {tenantContext.currentAgency && (
                              <Badge variant="secondary" className="text-[12px] h-5 px-1.5 font-medium bg-muted text-muted-foreground hover:bg-muted">
                                {tenantContext.currentAgency.role || 'admin'}
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            {tenantContext.agencies.map((agency) => (
                              <DropdownMenuItem
                                key={agency.id}
                                onClick={() => tenantContext.switchToAgency(agency.id)}
                                className="flex items-center justify-between py-2.5 cursor-pointer rounded-md focus:bg-accent"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="truncate font-medium text-[12px]">{agency.name}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {agency.subaccount_count > 0 && (
                                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[12px] font-medium text-muted-foreground">
                                      {agency.subaccount_count}
                                    </span>
                                  )}
                                  {tenantContext.currentAgency?.id === agency.id && !tenantContext.currentSubaccount && (
                                    <Check className="h-4 w-4 text-primary ml-auto" />
                                  )}
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </div>

                          {/* Clients Section */}
                          {tenantContext.currentAgency && tenantContext.subaccounts.length > 0 && (
                            <>
                              <DropdownMenuSeparator className="mx-1 my-2" />
                              <div className="px-2 py-1.5 flex items-center justify-between">
                                <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                                  {tenantContext.subaccountLabelPlural}
                                </span>
                                {tenantContext.currentSubaccount && (
                                  <span
                                    className="text-[12px] font-medium text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      tenantContext.clearSubaccount();
                                    }}
                                  >
                                    Back to Agency
                                  </span>
                                )}
                              </div>

                              <div className="space-y-0.5 max-h-[300px] overflow-y-auto sidebar-scroll">
                                {tenantContext.subaccounts.map((sub) => (
                                  <DropdownMenuItem
                                    key={sub.id}
                                    onClick={() => tenantContext.switchToSubaccount(sub.id)}
                                    className="flex items-center justify-between py-2.5 cursor-pointer group/item rounded-md focus:bg-accent"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background group-hover/item:border-primary/50 group-hover/item:bg-primary/5 transition-colors">
                                        <User className="h-4 w-4 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="truncate font-medium text-[12px]">{sub.name}</span>
                                        <span className="truncate text-[12px] text-muted-foreground">{sub.industry || 'General'}</span>
                                      </div>
                                    </div>
                                    {tenantContext.currentSubaccount?.id === sub.id && (
                                      <Check className="h-4 w-4 text-primary" />
                                    )}
                                  </DropdownMenuItem>
                                ))}
                              </div>

                              {tenantContext.subaccounts.length > 5 && (
                                <DropdownMenuItem
                                  onClick={() => navigate('/agency/sub-accounts')}
                                  className="mt-1 py-1.5 text-muted-foreground hover:text-foreground cursor-pointer rounded-md"
                                >
                                  <ArrowRight className="h-3.5 w-3.5 mr-2" />
                                  <span className="text-[12px] font-medium">View all {tenantContext.subaccounts.length} {tenantContext.subaccountLabelPlural.toLowerCase()}</span>
                                </DropdownMenuItem>
                              )}
                            </>
                          )}

                          <DropdownMenuSeparator className="mx-1 my-2" />
                        </>
                      )}

                      {/* General Actions */}
                      <DropdownMenuItem onClick={() => navigate('/settings')} className="py-2.5 cursor-pointer rounded-md">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Profile Settings</span>
                      </DropdownMenuItem>

                      {tenantContext?.isAgencyAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => navigate('/agency/sub-accounts')} className="py-2.5 cursor-pointer rounded-md">
                            <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Create {tenantContext.subaccountLabel}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate('/agency/settings')} className="py-2.5 cursor-pointer rounded-md">
                            <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Agency Settings</span>
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuSeparator className="mx-1 my-2" />
                      <DropdownMenuItem onClick={handleLogout} className="py-2.5 cursor-pointer rounded-md text-destructive focus:text-destructive focus:bg-destructive/5">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span className="font-medium">Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>
          )}

          <Dialog open={isCreateWorkspaceOpen} onOpenChange={setIsCreateWorkspaceOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create workspace</DialogTitle>
                <DialogDescription>Create a new workspace and switch to it.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workspace-name">Name</Label>
                  <Input
                    id="workspace-name"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Acme Inc"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workspace-slug">Slug (optional)</Label>
                  <Input
                    id="workspace-slug"
                    value={newWorkspaceSlug}
                    onChange={(e) => setNewWorkspaceSlug(e.target.value)}
                    placeholder="acme"
                  />
                </div>
                {workspaceError && <p className="text-sm text-destructive">{workspaceError}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateWorkspaceOpen(false)} disabled={isCreatingWorkspace}>
                  Cancel
                </Button>
                <Button onClick={createWorkspace} disabled={isCreatingWorkspace}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Main Content */}
          <main
            className={
              disableMainPadding
                ? 'flex-1 overflow-visible bg-background p-0'
                : 'flex-1 overflow-visible bg-background px-4 pt-2 pb-4 sm:px-6 lg:px-8'
            }
          >
            {children}
          </main>

          {/* Footer - Only show on landing pages */}
          {isLandingPage && <Footer />}
        </div>

        {/* Floating Softphone - Available on all authenticated pages */}
        <EnhancedFloatingSoftphone />
      </div>
    </SidebarProvider >
  );
};
