import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layers, BarChart3, Trash2, Edit, MoreVertical, Eye, Globe, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import funnelsApi, { Funnel } from '@/services/funnelsApi';

const FunnelForm = ({
  onSubmit,
  submitLabel,
  formData,
  setFormData
}: {
  onSubmit: () => void;
  submitLabel: string;
  formData: { name: string; description: string; domain: string };
  setFormData: (data: { name: string; description: string; domain: string }) => void;
}) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="name">Funnel Name</Label>
      <Input
        id="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Product Launch Funnel"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Describe your funnel..."
        rows={3}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="domain">Custom Domain (optional)</Label>
      <Input
        id="domain"
        value={formData.domain}
        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
        placeholder="funnel.yourdomain.com"
      />
    </div>

    <DialogFooter>
      <Button onClick={onSubmit}>{submitLabel}</Button>
    </DialogFooter>
  </div>
);

export default function Funnels() {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain: '',
  });

  useEffect(() => {
    loadFunnels();
  }, []);

  const loadFunnels = async () => {
    try {
      setLoading(true);
      const response = await funnelsApi.list() as any;
      setFunnels(response.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load funnels', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }
    try {
      await funnelsApi.create(formData);
      toast({ title: 'Success', description: 'Funnel created successfully' });
      setIsCreateOpen(false);
      resetForm();
      loadFunnels();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create funnel', variant: 'destructive' });
    }
  };

  const handleUpdate = async () => {
    if (!selectedFunnel) return;
    try {
      await funnelsApi.update(selectedFunnel.id, formData);
      toast({ title: 'Success', description: 'Funnel updated successfully' });
      setIsEditOpen(false);
      setSelectedFunnel(null);
      resetForm();
      loadFunnels();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update funnel', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this funnel?')) return;
    try {
      await funnelsApi.delete(id);
      toast({ title: 'Success', description: 'Funnel deleted successfully' });
      loadFunnels();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete funnel', variant: 'destructive' });
    }
  };

  const handlePublish = async (funnel: Funnel) => {
    try {
      await funnelsApi.publish(funnel.id);
      toast({ title: 'Success', description: 'Funnel published successfully' });
      loadFunnels();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to publish funnel', variant: 'destructive' });
    }
  };

  const openEdit = async (funnel: Funnel) => {
    try {
      const response = await funnelsApi.get(funnel.id) as any;
      const f = response.data;
      setSelectedFunnel(f);
      setFormData({
        name: f.name,
        description: f.description || '',
        domain: f.domain || '',
      });
      setIsEditOpen(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load funnel details', variant: 'destructive' });
    }
  };

  const openAnalytics = async (funnel: Funnel) => {
    try {
      const response = await funnelsApi.getAnalytics(funnel.id) as any;
      setAnalyticsData(response.data);
      setSelectedFunnel(funnel);
      setIsAnalyticsOpen(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load analytics', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      domain: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Funnels</h1>
          <p className="text-muted-foreground">Build multi-step marketing funnels</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Funnel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Funnel</DialogTitle>
              <DialogDescription>Set up a new marketing funnel</DialogDescription>
            </DialogHeader>
            <FunnelForm onSubmit={handleCreate} submitLabel="Create Funnel" formData={formData} setFormData={setFormData} />
          </DialogContent>
        </Dialog>
      </div>

      {funnels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No funnels yet</h3>
            <p className="text-muted-foreground mb-4">Create your first funnel to start converting visitors</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Funnel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {funnels.map((funnel) => (
            <Card key={funnel.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(funnel.status)}`} />
                    <CardTitle className="text-lg">{funnel.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/funnels/${funnel.id}`)}>
                        <Layers className="w-4 h-4 mr-2" />
                        Steps
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openAnalytics(funnel)}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(funnel)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {funnel.status === 'draft' && (
                        <DropdownMenuItem onClick={() => handlePublish(funnel)}>
                          <Globe className="w-4 h-4 mr-2" />
                          Publish
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDelete(funnel.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>{funnel.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={funnel.status === 'published' ? 'default' : 'secondary'}>
                      {funnel.status}
                    </Badge>
                    <Badge variant="outline">
                      {funnel.step_count || 0} steps
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Conversion Rate</span>
                      <span className="font-medium">{funnel.conversion_rate || 0}%</span>
                    </div>
                    <Progress value={funnel.conversion_rate || 0} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-muted rounded p-2">
                      <div className="font-semibold">{funnel.total_views || 0}</div>
                      <div className="text-muted-foreground">Views</div>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <div className="font-semibold text-green-600">{funnel.total_conversions || 0}</div>
                      <div className="text-muted-foreground">Conversions</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Funnel</DialogTitle>
            <DialogDescription>Update funnel settings</DialogDescription>
          </DialogHeader>
          <FunnelForm onSubmit={handleUpdate} submitLabel="Save Changes" formData={formData} setFormData={setFormData} />
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Funnel Analytics</DialogTitle>
            <DialogDescription>{selectedFunnel?.name}</DialogDescription>
          </DialogHeader>
          {analyticsData && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold">{analyticsData.funnel?.total_views || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Views</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{analyticsData.funnel?.total_conversions || 0}</div>
                    <div className="text-sm text-muted-foreground">Conversions</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{analyticsData.funnel?.conversion_rate || 0}%</div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                  </CardContent>
                </Card>
              </div>

              {analyticsData.steps && analyticsData.steps.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Step Performance</h4>
                  <div className="space-y-3">
                    {analyticsData.steps.map((step: any, index: number) => (
                      <div key={step.id} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{step.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {step.views} views → {step.conversions} conversions ({step.conversion_rate}%)
                            </span>
                          </div>
                          <Progress value={step.conversion_rate || 0} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
