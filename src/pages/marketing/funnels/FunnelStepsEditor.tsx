import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Settings,
  Eye,
  Edit,
  ExternalLink,
  PlusCircle,
  ArrowRight,
  BarChart3,
  Globe,
  Layout,
  MousePointer2,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import funnelsApi, { Funnel, FunnelStep } from '@/services/funnelsApi';
import { landingPagesApi, LandingPage } from '@/lib/landingPagesApi';

export default function FunnelStepsEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<FunnelStep[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);

  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [isStepSettingsOpen, setIsStepSettingsOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<FunnelStep | null>(null);

  const [newStepData, setNewStepData] = useState({
    name: '',
    step_type: 'landing' as FunnelStep['step_type'],
    landing_page_id: '' as string | number,
  });

  useEffect(() => {
    if (id) {
      loadFunnelData();
      loadLandingPages();
    }
  }, [id]);

  const loadFunnelData = async () => {
    try {
      setLoading(true);
      const response = await funnelsApi.get(Number(id)) as any;
      const data = response.id ? response : response.data;
      setFunnel(data);
      setSteps(data.steps || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load funnel', variant: 'destructive' });
      navigate('/marketing/funnels');
    } finally {
      setLoading(false);
    }
  };

  const loadLandingPages = async () => {
    try {
      const pages = await landingPagesApi.getLandingPages();
      setLandingPages(pages);
    } catch (error) {
      console.error('Failed to load landing pages', error);
    }
  };

  const handleCreateStep = async () => {
    if (!newStepData.name) {
      toast({ title: 'Error', description: 'Step name is required', variant: 'destructive' });
      return;
    }

    const updatedSteps = [...steps, {
      id: Date.now(), // Temporary ID for UI
      funnel_id: Number(id),
      name: newStepData.name,
      step_type: newStepData.step_type,
      sort_order: steps.length,
      views: 0,
      conversions: 0,
      is_active: true,
      conversion_goal: 'pageview',
      landing_page_id: newStepData.landing_page_id && newStepData.landing_page_id !== '0' ? Number(newStepData.landing_page_id) : undefined
    } as FunnelStep];

    try {
      await funnelsApi.update(Number(id), { steps: updatedSteps });
      toast({ title: 'Success', description: 'Step added successfully' });
      setIsAddStepOpen(false);
      setNewStepData({ name: '', step_type: 'landing', landing_page_id: '' });
      loadFunnelData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add step', variant: 'destructive' });
    }
  };

  const handleUpdateStep = async () => {
    if (!selectedStep) return;

    const updatedSteps = steps.map(s => s.id === selectedStep.id ? selectedStep : s);

    try {
      await funnelsApi.update(Number(id), { steps: updatedSteps });
      toast({ title: 'Success', description: 'Step updated successfully' });
      setIsStepSettingsOpen(false);
      loadFunnelData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update step', variant: 'destructive' });
    }
  };

  const handleDeleteStep = async (stepId: number) => {
    if (!confirm('Are you sure you want to delete this step?')) return;

    const updatedSteps = steps.filter(s => s.id !== stepId)
      .map((s, idx) => ({ ...s, sort_order: idx }));

    try {
      await funnelsApi.update(Number(id), { steps: updatedSteps });
      toast({ title: 'Success', description: 'Step deleted successfully' });
      loadFunnelData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete step', variant: 'destructive' });
    }
  };

  const moveStep = async (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= steps.length) return;

    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];

    // Update sort orders
    const updatedSteps = newSteps.map((s, idx) => ({ ...s, sort_order: idx }));

    try {
      await funnelsApi.update(Number(id), { steps: updatedSteps });
      loadFunnelData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reorder steps', variant: 'destructive' });
    }
  };

  const openStepSettings = (step: FunnelStep) => {
    setSelectedStep({ ...step });
    setIsStepSettingsOpen(true);
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'landing': return <Layout className="w-4 h-4 text-blue-500" />;
      case 'optin': return <MousePointer2 className="w-4 h-4 text-purple-500" />;
      case 'checkout': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'thankyou': return <CheckCircle2 className="w-4 h-4 text-orange-500" />;
      default: return <Layout className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!funnel) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/marketing/funnels">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{funnel.name}</h1>
              <Badge variant={funnel.status === 'published' ? 'default' : 'secondary'}>
                {funnel.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Manage your funnel steps and conversion flow</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href={`http://localhost:5173/f/${funnel.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Live
            </a>
          </Button>
          <Button onClick={() => setIsAddStepOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Step
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Steps List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Funnel Steps</CardTitle>
              <CardDescription>Order your customer journey stages</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {steps.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Layout className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No steps in this funnel yet.</p>
                  <Button variant="link" onClick={() => setIsAddStepOpen(true)}>Add your first step</Button>
                </div>
              ) : (
                <div className="divide-y border-t">
                  {steps.map((step, index) => (
                    <div key={step.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={index === 0}
                            onClick={() => moveStep(index, 'up')}
                          >
                            <ChevronDown className="w-4 h-4 rotate-180" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={index === steps.length - 1}
                            onClick={() => moveStep(index, 'down')}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className={`p-2 rounded-lg bg-background border shadow-sm`}>
                          {getStepIcon(step.step_type)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{step.name}</span>
                            <Badge variant="outline" className="capitalize text-[12px]">
                              {step.step_type}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Globe className="w-3 h-3" />
                            /{funnel.slug}/{step.slug || step.id}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium">{step.views.toLocaleString()}</div>
                            <div className="text-[12px] text-muted-foreground">Views</div>
                          </div>
                          <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-green-600">{step.conversions.toLocaleString()}</div>
                            <div className="text-[12px] text-muted-foreground">Conversions</div>
                          </div>

                          <div className="flex items-center gap-1">
                            {step.landing_page_id ? (
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/websites/builder/${step.landing_page_id}?type=landing-page`}>
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit Page
                                </Link>
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => openStepSettings(step)}>
                                Set Page
                              </Button>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openStepSettings(step)}>
                                  <Settings className="w-4 h-4 mr-2" />
                                  Step Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <a href={`http://localhost:5173/f/${funnel.slug}/${step.slug || step.id}`} target="_blank" rel="noopener noreferrer">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteStep(step.id)} className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Step
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full border-dashed py-8" onClick={() => setIsAddStepOpen(true)}>
            <PlusCircle className="w-5 h-5 mr-2" />
            Add New Step to Funnel
          </Button>
        </div>

        {/* Sidebar Analytics/Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{funnel.total_views.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Total Views</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">{funnel.total_conversions.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Total Opt-ins</div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Conversion Rate</span>
                  <span className="text-sm font-bold">{funnel.conversion_rate || 0}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${Math.min(funnel.conversion_rate || 0, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Publishing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Domain</Label>
                <div className="text-sm">{funnel.domain || 'xordon.app (Default)'}</div>
              </div>
              <div className="space-y-2">
                <Label>Path</Label>
                <div className="text-sm font-mono">/{funnel.slug}</div>
              </div>
              <Button className="w-full" variant={funnel.status === 'published' ? 'outline' : 'default'} onClick={() => {
                funnelsApi.publish(funnel.id).then(() => {
                  toast({ title: 'Success', description: 'Funnel published' });
                  loadFunnelData();
                });
              }}>
                {funnel.status === 'published' ? 'Update & Republish' : 'Go Live Now'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Step Dialog */}
      <Dialog open={isAddStepOpen} onOpenChange={setIsAddStepOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funnel Step</DialogTitle>
            <DialogDescription>Add a new stage to your customer journey.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Step Name</Label>
              <Input
                placeholder="e.g., Opt-in Page, Special Offer"
                value={newStepData.name}
                onChange={(e) => setNewStepData({ ...newStepData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Step Type</Label>
              <Select
                value={newStepData.step_type}
                onValueChange={(val: any) => setNewStepData({ ...newStepData, step_type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landing">Landing Page</SelectItem>
                  <SelectItem value="optin">Opt-in / Form</SelectItem>
                  <SelectItem value="sales">Sales Page</SelectItem>
                  <SelectItem value="checkout">Checkout / Order</SelectItem>
                  <SelectItem value="upsell">One-Click Upsell</SelectItem>
                  <SelectItem value="downsell">Downsell</SelectItem>
                  <SelectItem value="thankyou">Thank You Page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Landing Page (Optional)</Label>
              <Select
                value={String(newStepData.landing_page_id || '0')}
                onValueChange={(val) => setNewStepData({ ...newStepData, landing_page_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a landing page template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None (Create blank page)</SelectItem>
                  {landingPages.map(page => (
                    <SelectItem key={page.id} value={String(page.id)}>{page.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStepOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateStep}>Create Step</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step Settings Dialog */}
      <Dialog open={isStepSettingsOpen} onOpenChange={setIsStepSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Step Settings</DialogTitle>
            <DialogDescription>Configure {selectedStep?.name}</DialogDescription>
          </DialogHeader>
          {selectedStep && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Step Name</Label>
                <Input
                  value={selectedStep.name}
                  onChange={(e) => setSelectedStep({ ...selectedStep, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>URL Path</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">/{funnel.slug}/</span>
                  <Input
                    value={selectedStep.slug || ''}
                    onChange={(e) => setSelectedStep({ ...selectedStep, slug: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Step Type</Label>
                <Select
                  value={selectedStep.step_type}
                  onValueChange={(val: any) => setSelectedStep({ ...selectedStep, step_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landing">Landing Page</SelectItem>
                    <SelectItem value="optin">Opt-in / Form</SelectItem>
                    <SelectItem value="sales">Sales Page</SelectItem>
                    <SelectItem value="checkout">Checkout / Order</SelectItem>
                    <SelectItem value="upsell">One-Click Upsell</SelectItem>
                    <SelectItem value="downsell">Downsell</SelectItem>
                    <SelectItem value="thankyou">Thank You Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Landing Page Template</Label>
                <Select
                  value={String(selectedStep.landing_page_id || '0')}
                  onValueChange={(val) => setSelectedStep({ ...selectedStep, landing_page_id: Number(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a landing page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    {landingPages.map(page => (
                      <SelectItem key={page.id} value={String(page.id)}>{page.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdateStep}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
