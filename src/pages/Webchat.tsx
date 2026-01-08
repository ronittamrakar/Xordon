import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Plus, Settings, Code, Eye, EyeOff, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import webchatApi, { WebchatWidget } from '@/services/webchatApi';

const Webchat: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<WebchatWidget | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    theme_color: '#3b82f6',
    position: 'bottom-right' as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left',
    greeting_message: 'Hi! How can we help you today?',
    offline_message: "We're currently offline. Leave a message!",
    auto_open: false,
    auto_open_delay: 5,
  });

  const { data: widgets = [], isLoading } = useQuery({
    queryKey: ['webchat-widgets'],
    queryFn: webchatApi.listWidgets,
  });

  const createMutation = useMutation({
    mutationFn: webchatApi.createWidget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webchat-widgets'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Widget created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WebchatWidget> }) =>
      webchatApi.updateWidget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webchat-widgets'] });
      setIsEditOpen(false);
      setSelectedWidget(null);
      toast.success('Widget updated');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      theme_color: '#3b82f6',
      position: 'bottom-right',
      greeting_message: 'Hi! How can we help you today?',
      offline_message: "We're currently offline. Leave a message!",
      auto_open: false,
      auto_open_delay: 5,
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (widget: WebchatWidget) => {
    setSelectedWidget(widget);
    setFormData({
      name: widget.name,
      theme_color: widget.theme_color,
      position: widget.position,
      greeting_message: widget.greeting_message || '',
      offline_message: widget.offline_message || '',
      auto_open: widget.auto_open,
      auto_open_delay: widget.auto_open_delay,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedWidget) return;
    updateMutation.mutate({ id: selectedWidget.id, data: formData });
  };

  const toggleActive = (widget: WebchatWidget) => {
    updateMutation.mutate({
      id: widget.id,
      data: { is_active: !widget.is_active },
    });
  };

  const copyEmbedCode = (widgetKey: string) => {
    const code = webchatApi.getEmbedCode(widgetKey);
    navigator.clipboard.writeText(code);
    toast.success('Embed code copied to clipboard');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight">Webchat Widgets</h1>
          <p className="text-muted-foreground">Manage live chat widgets for your website</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Widget
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : widgets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No widgets yet</h3>
            <p className="text-muted-foreground mb-4">Create your first webchat widget</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Widget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((widget) => (
            <Card key={widget.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{widget.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {widget.position.replace('-', ' ')}
                    </CardDescription>
                  </div>
                  <Badge variant={widget.is_active ? 'default' : 'secondary'}>
                    {widget.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: widget.theme_color }}
                  />
                  <span className="text-sm text-muted-foreground">{widget.theme_color}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(widget)}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Settings
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => copyEmbedCode(widget.widget_key)}
                  >
                    <Code className="h-3 w-3 mr-1" />
                    Embed
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => toggleActive(widget)}
                >
                  {widget.is_active ? (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Activate
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Webchat Widget</DialogTitle>
            <DialogDescription>Configure your live chat widget</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Widget Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Website Chat"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Theme Color</Label>
                <Input
                  type="color"
                  value={formData.theme_color}
                  onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Select
                  value={formData.position}
                  onValueChange={(v: any) => setFormData({ ...formData, position: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Greeting Message</Label>
              <Textarea
                value={formData.greeting_message}
                onChange={(e) => setFormData({ ...formData, greeting_message: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Offline Message</Label>
              <Textarea
                value={formData.offline_message}
                onChange={(e) => setFormData({ ...formData, offline_message: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Auto-open widget</Label>
              <Switch
                checked={formData.auto_open}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_open: checked })}
              />
            </div>
            {formData.auto_open && (
              <div className="space-y-2">
                <Label>Auto-open delay (seconds)</Label>
                <Input
                  type="number"
                  value={formData.auto_open_delay}
                  onChange={(e) =>
                    setFormData({ ...formData, auto_open_delay: parseInt(e.target.value) || 5 })
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name || createMutation.isPending}>
              Create Widget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Widget</DialogTitle>
            <DialogDescription>Update widget settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Widget Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Theme Color</Label>
                <Input
                  type="color"
                  value={formData.theme_color}
                  onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Select
                  value={formData.position}
                  onValueChange={(v: any) => setFormData({ ...formData, position: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Greeting Message</Label>
              <Textarea
                value={formData.greeting_message}
                onChange={(e) => setFormData({ ...formData, greeting_message: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Offline Message</Label>
              <Textarea
                value={formData.offline_message}
                onChange={(e) => setFormData({ ...formData, offline_message: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Auto-open widget</Label>
              <Switch
                checked={formData.auto_open}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_open: checked })}
              />
            </div>
            {formData.auto_open && (
              <div className="space-y-2">
                <Label>Auto-open delay (seconds)</Label>
                <Input
                  type="number"
                  value={formData.auto_open_delay}
                  onChange={(e) =>
                    setFormData({ ...formData, auto_open_delay: parseInt(e.target.value) || 5 })
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.name || updateMutation.isPending}>
              Update Widget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Webchat;
