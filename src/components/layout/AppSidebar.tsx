import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { NavLink, useLocation } from 'react-router-dom';
import { api } from '@/lib/api';
import { BrandWordmark } from '@/components/BrandWordmark';
import { cn } from '@/lib/utils';

import { useTenantOptional } from '@/contexts/TenantContext';
import {
  LayoutDashboard,
  Mail,
  Zap,
  FileTextIcon,
  ClipboardList,
  Inbox,
  Send,
  UserX,
  MessageSquare,
  Smartphone,
  Globe,
  Search,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Phone,
  TrendingUp,
  UserCog,
  Check,
  CheckCircle,
  Activity,
  BarChart3,
  Layout,
  Workflow,
  Building2,
  List,
  Filter,
  FlaskConical,
  BookOpen,
  CheckSquare,
  Users,
  Settings,
  CalendarDays,
  Beaker,
  Star,
  ShoppingCart,
  Wrench,
  RefreshCw,
  UserCheck,
  Package,
  Play,
  Plus,
  DollarSign,
  Archive,
  Trash2,
  Webhook,
  Palette,
  Camera,
  Store,
  Wallet,
  Sliders,
  Brain,
  Headphones,
  PieChart,
  Gauge,
  Image,
  Gift,
  Bot,
  GraduationCap,
  Award,
  Layers,
  Calendar,
  Clock,
  CreditCard,
  BellRing,
  Link2,
  UserPlus,
  User,
  Truck,
  Crosshair,
  Eye,
  Monitor,
  CheckCircle2,
  Kanban,
  LineChart,
  Target,
  Sparkles,
  Mic,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionGuard, AdminOnly } from '@/components/PermissionGuard';
import { PERMISSION_KEYS } from '@/types/rbac';
import {
  FEATURES,
  getCoreFeatures,
  getAdvancedFeatures,
  type FeatureItem,
  type FeatureGroup
} from '@/config/features';
import { useAccountSettings, useCompany } from '@/contexts/UnifiedAppContext';
import type { Workspace } from '@/lib/api';

// Navigation Structure Configuration
// Maps Super Categories (FeatureGroup) to Subcategories and Labels
const NAVIGATION_CONFIG = [
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    subTitle: 'Building your audience',
    subgroups: [
      { id: 'contacts', label: 'Contacts' },
      { id: 'portal', label: 'Portal' },
    ]
  },
  {
    id: 'reach',
    label: 'Reach',
    icon: Send,
    subTitle: 'Outreach & engagement',
    subgroups: [
      { id: 'email', label: 'Email' },
      { id: 'sms', label: 'SMS' },
      { id: 'calls', label: 'Calls' },
      { id: 'channels', label: 'Channels' },
    ]
  },
  {
    id: 'conversion',
    label: 'Conversion',
    icon: Target,
    subTitle: 'Turning prospects into customers',
    subgroups: [
      { id: 'crm', label: 'CRM' },
      { id: 'proposals', label: 'Proposals' },
      { id: 'quotes', label: 'Quotes' },
      { id: 'sales_enablement', label: 'Sales Enablement' },
    ]
  },
  {
    id: 'delivery',
    label: 'Delivery',
    icon: Truck,
    subTitle: 'Delivering value & managing projects',
    subgroups: [
      { id: 'projects', label: 'Projects' },
      { id: 'operations', label: 'Operations' },
      { id: 'field_service', label: 'Field Service' },
      { id: 'scheduling', label: 'Scheduling' },
    ]
  },
  {
    id: 'ecommerce',
    label: 'Ecommerce',
    icon: ShoppingCart,
    subTitle: 'Online store & product management',
    subgroups: [
      { id: 'ecommerce', label: 'Store' },
    ]
  },
  {
    id: 'retention',
    label: 'Retention',
    icon: Headphones,
    subTitle: 'Keeping customers happy',
    subgroups: [
      { id: 'helpdesk', label: 'Helpdesk' },
      { id: 'reputation', label: 'Reputation' },
    ]
  },
  {
    id: 'growth',
    label: 'Growth',
    icon: Sparkles,
    subTitle: 'Scaling your business',
    subgroups: [
      { id: 'websites', label: 'Websites' },
      { id: 'seo', label: 'SEO' },
      { id: 'marketing', label: 'Marketing' },

      { id: 'acquisition', label: 'Acquisition' },
      { id: 'lead_marketplace', label: 'Lead Marketplace' },
      { id: 'lms', label: 'LMS' },
      { id: 'engagement', label: 'Engagement' },
    ]
  },
  {
    id: 'optimization',
    label: 'Optimization',
    icon: Brain,
    subTitle: 'AI, automation & analytics',
    subgroups: [
      { id: 'ai_agents', label: 'AI Agents' },
      { id: 'automation', label: 'Automation' },
      { id: 'analytics', label: 'Analytics' },
      { id: 'finance', label: 'Finance' },
      { id: 'hr', label: 'HR' },
      { id: 'culture', label: 'Culture' },
    ]
  }
];

interface AppSidebarProps {
  tenantId?: string;
  tenantName?: string;
  workspaces?: Workspace[];
  isWorkspacesLoading?: boolean;
  onSelectWorkspace?: (ws: Workspace) => void;
  onOpenCreateWorkspace?: () => void;
}

export function AppSidebar(props: AppSidebarProps) {
  const {
    tenantId,
    tenantName,
    workspaces = [],
    isWorkspacesLoading = false,
    onSelectWorkspace,
    onOpenCreateWorkspace,
  } = props;
  const { open, isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { enabledFeatures, isFeatureEnabled, isDeveloperMode } = useAccountSettings();

  // Get tenant context for client visibility
  const tenantContext = useTenantOptional();
  const isClientOnly = tenantContext?.isClientOnly ?? false;

  const queryClient = useQueryClient();
  const prefetchData = useCallback((key: string) => {
    if (key === 'dashboard') {
      queryClient.prefetchQuery({ queryKey: ['system-health'], queryFn: () => api.getHealth() });
    } else if (key === 'contacts') {
      queryClient.prefetchQuery({ queryKey: ['contacts'], queryFn: () => api.getContacts() });
      queryClient.prefetchQuery({ queryKey: ['tags'], queryFn: () => api.getTags() });
    } else if (key === 'inbox') {
      queryClient.prefetchQuery({ queryKey: ['inbox-stats'], queryFn: async () => (await api.get('/inbox/stats')).data });
    }
  }, [queryClient]);

  const devMode = isDeveloperMode;

  // Memoize sidebar features filtering
  const sidebarFeatures = useMemo(() => {
    const list = (devMode ? FEATURES : enabledFeatures) || [];
    return list.filter(f => f && f.status !== 'hidden');
  }, [devMode, enabledFeatures]);

  // Administrative features for the bottom menu
  const adminFeatures = useMemo(() =>
    (devMode ? FEATURES : enabledFeatures).filter(f =>
      f.status !== 'hidden' && f.group === 'optimization' && f.subGroup === 'admin'
    ),
    [devMode, enabledFeatures]
  );

  // State for collapsible sections
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    foundation: true, // Foundation is open by default
  });

  useEffect(() => {
    // Auto-expand groups based on active route
    const newExpanded: Record<string, boolean> = {};

    // Find the current feature based on path
    const activeFeature = FEATURES.find(f => {
      if (f.path === '/') return currentPath === '/';
      return currentPath.startsWith(f.path) || (f.path !== '/' && currentPath.includes(f.path));
    });

    if (activeFeature) {
      newExpanded[activeFeature.group] = true;
    }

    setExpandedGroups(prev => ({ ...prev, ...newExpanded }));
  }, [currentPath]);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isPathActive = useCallback((targetPath: string) => {
    // Exact match is always active
    if (currentPath === targetPath) return true;
    if (targetPath === '/' && currentPath !== '/') return false;

    // Check if it's a prefix match
    const normalizedTarget = targetPath.endsWith('/') ? targetPath.slice(0, -1) : targetPath;
    const isPrefixMatch = currentPath.startsWith(`${normalizedTarget}/`);

    if (!isPrefixMatch) return false;

    // Check if there's a more specific (longer) match in sidebar features
    // We only want to highlight this if there isn't another item in the sidebar that is also a match and has a longer path.
    const hasBetterMatch = sidebarFeatures.some(f => {
      if (f.path === targetPath) return false;
      const normalizedOther = f.path.endsWith('/') ? f.path.slice(0, -1) : f.path;
      return (currentPath === f.path || currentPath.startsWith(`${normalizedOther}/`)) &&
        normalizedOther.length > normalizedTarget.length;
    });

    return !hasBetterMatch;
  }, [currentPath, sidebarFeatures]);

  const getNavCls = useCallback((active: boolean, isMainPage: boolean = false) =>
    `${isMainPage ? 'font-bold text-sm' : 'font-normal text-[13px]'} no-underline ${active
      ? 'bg-muted text-foreground opacity-100 hover:bg-muted/80'
      : 'text-sidebar-subcategory-foreground hover:bg-sidebar-subcategory-accent hover:text-foreground'}`, []);

  const getIconCls = useCallback((isMainPage: boolean = false) =>
    isMainPage ? 'h-4 w-4 !stroke-[2.5]' : 'h-4 w-4 stroke-[1.5]', []);

  const handleNavClick = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar dark:bg-sidebar">
      <SidebarContent className="sidebar-scroll flex flex-col">
        <div className="px-4 py-1 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-1">
          <div className={`flex items-center gap-2 ${open ? 'justify-between' : 'justify-center'} h-9 w-full`}>
            {open ? (
              <div className="flex items-center gap-2 min-w-0">
                <div className="min-w-0">
                  <BrandWordmark className="h-7 text-[21px] bg-transparent" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <img src="/logo-icon.png" alt="Logo" className="h-6 w-6 object-contain mix-blend-multiply dark:invert dark:mix-blend-screen bg-transparent" />
              </div>
            )}
            {open && <SidebarTrigger className="shrink-0 h-8 w-8" />}
          </div>
        </div>

        {/* Foundation items - rendered directly without category header */}
        <SidebarGroup className="py-0 mb-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {sidebarFeatures
                .filter(f => f.group === 'foundation')
                .map(item => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={isPathActive(item.path)} tooltip={item.label}>
                      <NavLink
                        to={item.path}
                        className={getNavCls(isPathActive(item.path))}
                        onClick={handleNavClick}
                        onMouseEnter={() => prefetchData(item.id)}
                      >
                        <item.icon className={getIconCls(false)} />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {NAVIGATION_CONFIG.map((group) => {
          // Filter items for this group
          const groupItems = sidebarFeatures.filter(f => f.group === group.id);
          if (groupItems.length === 0) return null;

          return (
            <SidebarGroup key={group.id} className={"py-0 " + (expandedGroups[group.id] ? "mb-4" : "")}>
              <SidebarGroupLabel
                className="text-[13px] font-bold text-foreground uppercase tracking-wide cursor-pointer select-none px-2 mb-1 group-data-[collapsible=icon]:px-0"
                onClick={() => toggleGroup(group.id)}
              >
                <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
                  <span className="flex items-center gap-2 group-data-[collapsible=icon]:gap-0">
                    {group.icon && <group.icon className="h-4 w-4 shrink-0" />}
                    <span className="group-data-[collapsible=icon]:hidden">{group.label}</span>
                  </span>
                  <ChevronDown className={"h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden " + (expandedGroups[group.id] ? "rotate-180" : "")} />
                </div>
              </SidebarGroupLabel>

              {expandedGroups[group.id] && (
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    {group.subgroups.map((subgroup, index) => {
                      const subItems = groupItems.filter(f => f.subGroup === subgroup.id);
                      if (subItems.length === 0) return null;

                      return (
                        <React.Fragment key={subgroup.id}>
                          {/* Subgroup Header - Only if expanded and multiple subgroups exist, or just as a separator */}
                          {/* To minimize noise, we can use a small label or just distinct spacing. 
                                                 The user explicitly asked for "Sub-categories". 
                                             */}
                          {open && subgroup.label && (
                            <div className={cn(
                              "px-4 pt-1 pb-0.5 text-[14px] text-foreground font-semibold",
                              index === 0 ? "mt-1" : "mt-4"
                            )}>
                              {subgroup.label}
                            </div>
                          )}

                          {subItems.map(item => (
                            <SidebarMenuItem key={item.id}>
                              <SidebarMenuButton asChild isActive={isPathActive(item.path)} tooltip={item.label}>
                                <NavLink
                                  to={item.path}
                                  className={getNavCls(isPathActive(item.path))}
                                  onClick={handleNavClick}
                                  onMouseEnter={() => prefetchData(item.id)}
                                >
                                  <item.icon className={getIconCls(false)} />
                                  <span>{item.label}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {adminFeatures.length > 0 && (
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton>
                <div className="flex w-full items-center gap-2">
                  <Settings className={getIconCls(false)} />
                  <span className="font-bold uppercase">ADMIN</span>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-[--radix-dropdown-menu-trigger-width]">
              {adminFeatures.map(feature => (
                <DropdownMenuItem key={feature.id} asChild className="py-2.5 cursor-pointer">
                  <NavLink
                    to={feature.path}
                    className="cursor-pointer flex items-center gap-2"
                    onClick={handleNavClick}
                  >
                    <feature.icon className="h-4 w-4" />
                    <span>{feature.label}</span>
                  </NavLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
