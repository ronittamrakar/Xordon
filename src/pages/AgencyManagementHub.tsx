import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAgencyData, useAgencyPermissions } from '@/hooks/useAgencyData';
import { TabbedLayout, TabContent, PageHeader, EmptyState, LoadingState, ErrorState } from '@/components/common/TabbedLayout';
import { ContextAwareComponent, PermissionGuard, ContextSwitcher } from '@/components/common/ContextComponents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Building2, Users, Layers, TrendingUp, Activity, ArrowUpRight,
  Plus, Settings, RefreshCw, Mail, MessageSquare, Phone,
  Clock, CheckCircle, AlertCircle, ChevronRight, Crown, Shield,
  CreditCard, Check, Zap, Globe, Trash2, Edit, Calendar, MapPin
} from 'lucide-react';

interface AgencyManagementHubProps {
  activeTab?: string;
}

/**
 * Consolidated Agency Management Hub
 * Combines AgencyDashboard.tsx, AgencySettings.tsx, and AgencyBilling.tsx
 */
export default function AgencyManagementHub({ activeTab: propActiveTab }: AgencyManagementHubProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Determine active tab
  const urlTab = searchParams.get('tab');
  const activeTab = propActiveTab || urlTab || 'dashboard';

  // Data hooks
  const {
    agency,
    userRole,
    subaccounts,
    teamMembers,
    usage,
    limits,
    recentActivity,
    isLoading,
    error,
    refetch,
    invalidate,
    // Mutations
    updateAgency,
    updateBranding,
    addDomain,
    verifyDomain,
    deleteDomain,
    inviteTeamMember,
    removeTeamMember,
    switchToSubaccount
  } = useAgencyData();

  const {
    isAgencyOwner,
    isAgencyAdmin,
    canManageSettings,
    canManageBilling,
    canManageTeam,
    canManageDomains,
    canCreateSubaccounts
  } = useAgencyPermissions();

  // Local state
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user' | 'readonly'>('user');

  useEffect(() => {
    if (propActiveTab) {
      setSearchParams({ tab: propActiveTab });
    }
  }, [propActiveTab, setSearchParams]);

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  // Tab configurations
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Activity className="w-4 h-4" />,
      badge: subaccounts.length
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      disabled: !canManageSettings
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: <CreditCard className="w-4 h-4" />,
      disabled: !canManageBilling
    },
    {
      id: 'team',
      label: 'Team',
      icon: <Users className="w-4 h-4" />,
      disabled: !canManageTeam
    }
  ];

  // Dashboard Tab Content
  const DashboardTab = () => (
    <TabContent>
      {isLoading ? (
        <LoadingState message="Loading agency dashboard..." />
      ) : error ? (
        <ErrorState message="Failed to load agency data" onRetry={refetch} />
      ) : !agency ? (
        <EmptyState
          title="No Agency Found"
          description="You are not part of any agency yet."
          illustration={<Building2 className="w-16 h-16 mx-auto text-muted-foreground" />}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {agency.name}
                  <Badge variant={agency.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                    {agency.status}
                  </Badge>
                </h1>
                <p className="text-muted-foreground">Agency Dashboard</p>
              </div>
            </div>
            <div className="flex gap-2">
              {canCreateSubaccounts && (
                <Button onClick={() => navigate('/agency/sub-accounts')}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Client
                </Button>
              )}
              <Button variant="outline" onClick={refetch}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clients</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subaccounts.length}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">{subaccounts.filter(s => s.status === 'active').length}</span> active
                </p>
                <Button variant="link" size="sm" className="p-0" onClick={() => handleTabChange('team')}>
                  Manage <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamMembers.length}</div>
                <p className="text-xs text-muted-foreground">
                  {teamMembers.filter(m => m.status === 'pending').length} pending
                </p>
                <Button variant="link" size="sm" className="p-0" onClick={() => handleTabChange('team')}>
                  Manage <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usage?.contacts.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">Across all clients</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Activity</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((usage?.emails_sent || 0) + (usage?.sms_sent || 0)).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Messages sent</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Usage Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Channel Usage</CardTitle>
                <CardDescription>Monthly activity by channel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Email</span>
                    </div>
                    <span className="text-sm font-medium">{usage?.emails_sent.toLocaleString() || '0'}</span>
                  </div>
                  <Progress value={limits?.emails?.percent || 0} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      <span className="text-sm">SMS</span>
                    </div>
                    <span className="text-sm font-medium">{usage?.sms_sent.toLocaleString() || '0'}</span>
                  </div>
                  <Progress value={limits?.sms?.percent || 0} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Calls</span>
                    </div>
                    <span className="text-sm font-medium">{usage?.calls_made.toLocaleString() || '0'}</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions in your agency</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {activity.action.includes('invite') && <Users className="h-4 w-4" />}
                          {activity.action.includes('create') && <Plus className="h-4 w-4" />}
                          {!activity.action.includes('invite') && !activity.action.includes('create') && (
                            <Activity className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.actor_name}</p>
                          <p className="text-xs text-muted-foreground">{activity.action.replace(/_/g, ' ')}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {canManageTeam && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => handleTabChange('team')}
                  >
                    View full audit log <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Clients Quick View */}
          {subaccounts.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Clients</CardTitle>
                  <CardDescription>Quick access to client businesses</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/agency/sub-accounts')}>
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {subaccounts.slice(0, 6).map((sub) => (
                    <Card
                      key={sub.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => switchToSubaccount(sub.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                              <span className="text-lg font-semibold text-primary">
                                {sub.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{sub.name}</p>
                              <p className="text-xs text-muted-foreground">{sub.industry || 'No industry'}</p>
                            </div>
                          </div>
                          <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                            {sub.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </TabContent>
  );

  // Settings Tab Content
  const SettingsTab = () => (
    <TabContent>
      <PermissionGuard permission="admin">
        {isLoading ? (
          <LoadingState message="Loading settings..." />
        ) : error ? (
          <ErrorState message="Failed to load settings" onRetry={refetch} />
        ) : !agency ? (
          <EmptyState
            title="No Agency Found"
            description="Cannot load settings without an agency."
            illustration={<Settings className="w-16 h-16 mx-auto text-muted-foreground" />}
          />
        ) : (
          <div className="space-y-6">
            {/* Organization Type */}
            <Card>
              <CardHeader>
                <CardTitle>Organization Type</CardTitle>
                <CardDescription>Set the default terminology for your sub-accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { value: 'marketing_agency', label: 'Marketing Agency', description: 'Clients', icon: '🏢' },
                    { value: 'franchise', label: 'Multi-Location', description: 'Locations', icon: '📍' },
                    { value: 'retail', label: 'Retail / Commerce', description: 'Stores', icon: '🛍️' },
                    { value: 'healthcare', label: 'Healthcare', description: 'Practices', icon: '🏥' },
                    { value: 'single_business', label: 'Project-Based', description: 'Workspaces', icon: '🏠' },
                    { value: 'other', label: 'Custom Brand', description: 'Default Label', icon: '⚙️' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={async () => {
                        try {
                          await updateAgency({ organization_type: option.value });
                          toast({ title: 'Organization type updated', description: `Sub-accounts will now be called "${option.description}"` });
                        } catch (err) {
                          toast({ title: 'Error', description: 'Failed to update organization type', variant: 'destructive' });
                        }
                      }}
                      className={`group relative flex flex-col p-5 rounded-2xl border text-left transition-all duration-300 hover:shadow-lg ${agency?.organization_type === option.value
                        ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary'
                        : 'border-border/60 hover:border-primary/40 hover:bg-primary/10'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xl transition-colors ${agency?.organization_type === option.value
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                          }`}>
                          <span className="text-xl leading-none">{option.icon}</span>
                        </div>
                        {agency?.organization_type === option.value && (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{option.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">Sub-accounts labeled as: <b>{option.description}</b></div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Agency Profile */}
            <Card>
              <CardHeader>
                <CardTitle>Agency Profile</CardTitle>
                <CardDescription>Update your agency's basic information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="agency_name">Agency Name</Label>
                    <Input
                      id="agency_name"
                      value={agency.name || ''}
                      onChange={(e) => updateAgency({ name: e.target.value })}
                      className="rounded-xl h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agency_slug">Agency Slug</Label>
                    <div className="flex gap-1 items-center">
                      <span className="text-muted-foreground text-xs font-mono">app.xordon.com/</span>
                      <Input
                        id="agency_slug"
                        value={agency.slug || ''}
                        onChange={(e) => updateAgency({ slug: e.target.value })}
                        className="rounded-xl h-10 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Branding */}
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Customize your agency's visual identity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Visual Identity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Visual Identity</CardTitle>
                      <CardDescription>Logo, colors, and visual elements</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Logo URL</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://example.com/logo.png"
                            value={agency.branding?.logo_url || ''}
                            onChange={(e) => updateBranding({ logo_url: e.target.value })}
                          />
                          <Button variant="outline" size="icon">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        {agency.branding?.logo_url && (
                          <img src={agency.branding.logo_url} alt="Logo preview" className="h-12 object-contain mt-2 bg-muted rounded p-2" />
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Primary Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={agency.branding?.primary_color || '#3B82F6'}
                              onChange={(e) => updateBranding({ primary_color: e.target.value })}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              value={agency.branding?.primary_color || '#3B82F6'}
                              onChange={(e) => updateBranding({ primary_color: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Secondary Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={agency.branding?.secondary_color || '#1E40AF'}
                              onChange={(e) => updateBranding({ secondary_color: e.target.value })}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              value={agency.branding?.secondary_color || '#1E40AF'}
                              onChange={(e) => updateBranding({ secondary_color: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Accent Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={agency.branding?.accent_color || '#10B981'}
                              onChange={(e) => updateBranding({ accent_color: e.target.value })}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              value={agency.branding?.accent_color || '#10B981'}
                              onChange={(e) => updateBranding({ accent_color: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Branding Preview */}
                  <Card className="overflow-hidden border-none shadow-premium bg-gradient-to-br from-background to-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary" />
                        Branding Preview
                      </CardTitle>
                      <CardDescription>See how your agency will look to clients</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Mock Dashboard Sidebar */}
                      <div className="border rounded-xl overflow-hidden shadow-lg bg-background">
                        <div className="flex h-40">
                          {/* Sidebar Mock */}
                          <div
                            className="w-16 h-full flex flex-col items-center py-4 gap-4"
                            style={{ backgroundColor: agency.branding?.primary_color || '#3B82F6' }}
                          >
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                              {agency.branding?.logo_url ? (
                                <img src={agency.branding.logo_url} alt="Logo" className="w-5 h-5 object-contain" />
                              ) : (
                                <div className="w-4 h-4 bg-white rounded-sm" />
                              )}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/10" />
                            <div className="w-8 h-8 rounded-full bg-white/10" />
                            <div className="w-8 h-8 rounded-full bg-white/10" />
                          </div>
                          {/* Content Mock */}
                          <div className="flex-1 p-4 space-y-3 bg-muted/20">
                            <div className="flex justify-between items-center mb-2">
                              <div className="h-4 w-24 bg-muted rounded-full animate-pulse" />
                              <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
                            </div>
                            <div className="h-16 w-full bg-white rounded-xl shadow-sm border p-3 flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: (agency.branding?.accent_color || '#10B981') + '20' }}
                              >
                                <div
                                  className="w-5 h-5 rounded-sm"
                                  style={{ backgroundColor: agency.branding?.accent_color || '#10B981' }}
                                />
                              </div>
                              <div className="space-y-2 flex-1">
                                <div className="h-3 w-3/4 bg-muted rounded-full" />
                                <div className="h-2 w-1/2 bg-muted/60 rounded-full" />
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="w-full h-8 rounded-lg text-[12px]"
                              style={{
                                backgroundColor: agency.branding?.primary_color || '#3B82F6',
                                color: '#ffffff'
                              }}
                            >
                              Primary Action
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Domains */}
            {canManageDomains && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Domains</CardTitle>
                  <CardDescription>Add custom domains for white-labeling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Domain */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="app.youragency.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addDomain({ domain: newDomain, domain_type: 'alias' })}
                    />
                    <Button onClick={() => addDomain({ domain: newDomain, domain_type: 'alias' })} disabled={!newDomain.trim()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Domain
                    </Button>
                  </div>

                  {/* Domain List */}
                  <div className="space-y-3">
                    {agency.domains?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No custom domains configured yet.</p>
                        <p className="text-sm">Add a domain above to get started.</p>
                      </div>
                    ) : (
                      agency.domains?.map((domain: any) => (
                        <div key={domain.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{domain.domain}</span>
                                {domain.domain_type === 'primary' && (
                                  <Badge variant="secondary" className="text-xs">Primary</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {domain.dns_verified ? (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    <Check className="w-3 h-3 mr-1" /> DNS Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                    Pending Verification
                                  </Badge>
                                )}
                                {domain.ssl_status === 'active' && (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    <Shield className="w-3 h-3 mr-1" /> SSL Active
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!domain.dns_verified && (
                              <Button variant="outline" size="sm" onClick={() => verifyDomain(domain.id)}>
                                <RefreshCw className="w-4 h-4 mr-1" /> Verify
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => deleteDomain(domain.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </PermissionGuard>
    </TabContent>
  );

  // Team Tab Content
  const TeamTab = () => (
    <TabContent>
      <PermissionGuard permission="admin">
        {isLoading ? (
          <LoadingState message="Loading team data..." />
        ) : error ? (
          <ErrorState message="Failed to load team data" onRetry={refetch} />
        ) : (
          <div className="space-y-6">
            {/* Team Members */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage team access and permissions</CardDescription>
                  </div>
                  <Button onClick={() => setShowInviteDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Invite Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {teamMembers.length === 0 ? (
                  <EmptyState
                    title="No Team Members"
                    description="Invite your first team member to get started."
                    illustration={<Users className="w-16 h-16 mx-auto text-muted-foreground" />}
                    action={{
                      label: "Invite Member",
                      onClick: () => setShowInviteDialog(true),
                      icon: <Plus className="w-4 h-4" />
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {member.name?.charAt(0).toUpperCase() || member.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{member.name || 'Invited User'}</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                          <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                            {member.status}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {member.role.replace('subaccount_', '')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.status === 'pending' && (
                            <Button variant="outline" size="sm">
                              Resend Invite
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTeamMember(member.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Context Switcher */}
            <ContextSwitcher />
          </div>
        )}
      </PermissionGuard>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your agency
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite_email">Email Address</Label>
              <Input
                id="invite_email"
                placeholder="team@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite_role">Role</Label>
              <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="readonly">Readonly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  await inviteTeamMember({ email: inviteEmail, role: inviteRole });
                  setShowInviteDialog(false);
                  setInviteEmail('');
                } catch (err: any) {
                  toast({ title: 'Error', description: err.message, variant: 'destructive' });
                }
              }}
              disabled={!inviteEmail}
            >
              <Plus className="w-4 h-4 mr-2" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabContent>
  );

  // Billing Tab Content
  const BillingTab = () => (
    <TabContent>
      <PermissionGuard permission="owner">
        {isLoading ? (
          <LoadingState message="Loading billing data..." />
        ) : error ? (
          <ErrorState message="Failed to load billing data" onRetry={refetch} />
        ) : !agency ? (
          <EmptyState
            title="No Agency Found"
            description="Cannot load billing without an agency."
            illustration={<CreditCard className="w-16 h-16 mx-auto text-muted-foreground" />}
          />
        ) : (
          <div className="space-y-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {agency.plan_name || 'Free'} Plan
                      <Badge variant={agency.status === 'active' ? 'default' : 'destructive'}>
                        {agency.status || 'inactive'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {agency.billing_cycle === 'yearly' ? 'Annual billing' : 'Monthly billing'}
                      {agency.current_period_end && (
                        <> · Renews {new Date(agency.current_period_end).toLocaleDateString()}</>
                      )}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {agency.base_price_cents ? `$${(agency.base_price_cents / 100).toFixed(0)}` : '$0'}
                      <span className="text-lg text-muted-foreground font-normal">/mo</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {agency.trial_ends_at && (
                  <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">
                      Trial ends {new Date(agency.trial_ends_at).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Plan Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Layers className="w-4 h-4" />
                      Sub-Accounts
                    </div>
                    <div className="font-semibold">
                      {agency.max_subaccounts === -1 ? 'Unlimited' : agency.max_subaccounts}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Users className="w-4 h-4" />
                      Team Members
                    </div>
                    <div className="font-semibold">
                      {agency.max_team_members === -1 ? 'Unlimited' : agency.max_team_members}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Mail className="w-4 h-4" />
                      Emails/Month
                    </div>
                    <div className="font-semibold">
                      {agency.max_emails_per_month === -1 ? 'Unlimited' : agency.max_emails_per_month.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MessageSquare className="w-4 h-4" />
                      SMS/Month
                    </div>
                    <div className="font-semibold">
                      {agency.max_sms_per_month === -1 ? 'Unlimited' : agency.max_sms_per_month.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage */}
            <div className="grid gap-4 md:grid-cols-3">
              {limits?.subaccounts && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Sub-Accounts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">{limits.subaccounts.used}</span>
                      <span className="text-muted-foreground">/ {limits.subaccounts.limit}</span>
                    </div>
                    <Progress value={limits.subaccounts.percent} className="h-2" />
                  </CardContent>
                </Card>
              )}
              {limits?.emails && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Emails This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">{limits.emails.used.toLocaleString()}</span>
                      <span className="text-muted-foreground">/ {limits.emails.limit.toLocaleString()}</span>
                    </div>
                    <Progress value={limits.emails.percent} className="h-2" />
                  </CardContent>
                </Card>
              )}
              {limits?.sms && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      SMS This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">{limits.sms.used.toLocaleString()}</span>
                      <span className="text-muted-foreground">/ {limits.sms.limit.toLocaleString()}</span>
                    </div>
                    <Progress value={limits.sms.percent} className="h-2" />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </PermissionGuard>
    </TabContent>
  );

  return (
    <div className="p-6 space-y-6">
      <TabbedLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        title="Agency Management"
        description="Manage your agency settings, team, and billing"
      >
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'team' && <TeamTab />}
        {activeTab === 'billing' && <BillingTab />}
      </TabbedLayout>
    </div>
  );
}