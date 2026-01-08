import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  History,
  ArrowRight,
  Filter,
  Settings,
  ChevronDown
} from 'lucide-react';
import { api } from '@/lib/api';

interface Trigger {
  id: string;
  name: string;
  category: string;
}

interface Action {
  id: string;
  name: string;
  category: string;
}

interface Condition {
  field: string;
  operator: string;
  value: string;
  logic?: 'AND' | 'OR';
}

interface Automation {
  id: number;
  name: string;
  description: string;
  trigger: { type: string; config: Record<string, any> };
  conditions: Condition[];
  actions: { type: string; config: Record<string, any> }[];
  enabled: boolean;
  created_at: string;
  last_run?: string;
  run_count: number;
}

interface ExecutionLog {
  id: number;
  automation_id: number;
  status: 'success' | 'failed' | 'skipped';
  trigger_data: Record<string, any>;
  executed_at: string;
  error?: string;
}

interface AutomationFormData {
  name: string;
  description: string;
  trigger: { type: string; config: Record<string, any> };
  conditions: Condition[];
  actions: { type: string; config: Record<string, any> }[];
  enabled: boolean;
}

interface AutomationFormProps {
  onSubmit: () => void;
  submitLabel: string;
  formData: AutomationFormData;
  setFormData: (data: AutomationFormData) => void;
  triggers: Trigger[];
  actions: Action[];
  addCondition: () => void;
  updateCondition: (index: number, updates: Partial<Condition>) => void;
  removeCondition: (index: number) => void;
  addAction: () => void;
  updateAction: (index: number, updates: Partial<{ type: string; config: Record<string, any> }>) => void;
  removeAction: (index: number) => void;
  onCancel: () => void;
}

const AutomationForm = ({
  onSubmit,
  submitLabel,
  formData,
  setFormData,
  triggers,
  actions,
  addCondition,
  updateCondition,
  removeCondition,
  addAction,
  updateAction,
  removeAction,
  onCancel
}: AutomationFormProps) => (
  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Automation name"
        />
      </div>
      <div className="flex items-center gap-2 pt-6">
        <Switch
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
        <Label>Enabled</Label>
      </div>
    </div>
    <div>
      <Label>Description</Label>
      <Textarea
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="What does this automation do?"
        rows={2}
      />
    </div>

    {/* Trigger */}
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Trigger
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select
          value={formData.trigger.type}
          onValueChange={(v) => setFormData({ ...formData, trigger: { type: v, config: {} } })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select trigger..." />
          </SelectTrigger>
          <SelectContent>
            {triggers.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>

    {/* Conditions */}
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Conditions (AND/OR)
          </CardTitle>
          <Button variant="outline" size="sm" onClick={addCondition}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {formData.conditions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No conditions - automation will run for all triggers</p>
        ) : (
          formData.conditions.map((cond, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {idx > 0 && (
                <Select value={cond.logic} onValueChange={(v: 'AND' | 'OR') => updateCondition(idx, { logic: v })}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Input
                placeholder="Field"
                value={cond.field}
                onChange={(e) => updateCondition(idx, { field: e.target.value })}
                className="w-32"
              />
              <Select value={cond.operator} onValueChange={(v) => updateCondition(idx, { operator: v })}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not_equals">Not Equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="greater_than">Greater Than</SelectItem>
                  <SelectItem value="less_than">Less Than</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Value"
                value={cond.value}
                onChange={(e) => updateCondition(idx, { value: e.target.value })}
                className="flex-1"
              />
              <Button variant="ghost" size="sm" onClick={() => removeCondition(idx)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>

    {/* Actions */}
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Play className="h-4 w-4" />
            Actions (Chained)
          </CardTitle>
          <Button variant="outline" size="sm" onClick={addAction}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {formData.actions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">Add at least one action</p>
        ) : (
          formData.actions.map((action, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                {idx + 1}
              </Badge>
              <Select value={action.type} onValueChange={(v) => updateAction(idx, { type: v })}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select action..." />
                </SelectTrigger>
                <SelectContent>
                  {actions.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => removeAction(idx)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>

    <div className="flex justify-end gap-2 pt-4">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onSubmit} disabled={!formData.name || !formData.trigger.type || formData.actions.length === 0}>
        {submitLabel}
      </Button>
    </div>
  </div>
);

export default function AutomationBuilder() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [viewingLogs, setViewingLogs] = useState<number | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  const [formData, setFormData] = useState<AutomationFormData>({
    name: '',
    description: '',
    trigger: { type: '', config: {} },
    conditions: [],
    actions: [],
    enabled: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [automationsRes, triggersRes, actionsRes] = await Promise.all([
        api.get('/automations'),
        api.get('/automations/triggers'),
        api.get('/automations/actions')
      ]);
      setAutomations(automationsRes.data.automations || []);
      setTriggers(triggersRes.data.triggers || []);
      setActions(actionsRes.data.actions || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (automationId: number) => {
    try {
      const response = await api.get(`/automations/${automationId}/logs`);
      setLogs(response.data.logs || []);
      setViewingLogs(automationId);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/automations', formData);
      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to create automation:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingAutomation) return;
    try {
      await api.put(`/automations/${editingAutomation.id}`, formData);
      setEditingAutomation(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to update automation:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;
    try {
      await api.delete(`/automations/${id}`);
      loadData();
    } catch (error) {
      console.error('Failed to delete automation:', error);
    }
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      await api.post(`/automations/${id}/toggle`, { enabled });
      loadData();
    } catch (error) {
      console.error('Failed to toggle automation:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger: { type: '', config: {} },
      conditions: [],
      actions: [],
      enabled: true
    });
  };

  const startEdit = (automation: Automation) => {
    setFormData({
      name: automation.name,
      description: automation.description,
      trigger: automation.trigger,
      conditions: automation.conditions || [],
      actions: automation.actions || [],
      enabled: automation.enabled
    });
    setEditingAutomation(automation);
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { field: '', operator: 'equals', value: '', logic: 'AND' }]
    });
  };

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setFormData({ ...formData, conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index)
    });
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: '', config: {} }]
    });
  };

  const updateAction = (index: number, updates: Partial<{ type: string; config: Record<string, any> }>) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], ...updates };
    setFormData({ ...formData, actions: newActions });
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Automation Builder
          </h1>
          <p className="text-muted-foreground">Create automated workflows with triggers, conditions, and actions</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Automation</DialogTitle>
            </DialogHeader>
            <AutomationForm
              onSubmit={handleCreate}
              submitLabel="Create Automation"
              formData={formData}
              setFormData={setFormData}
              triggers={triggers}
              actions={actions}
              addCondition={addCondition}
              updateCondition={updateCondition}
              removeCondition={removeCondition}
              addAction={addAction}
              updateAction={updateAction}
              removeAction={removeAction}
              onCancel={() => { setShowCreateDialog(false); resetForm(); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="automations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="logs">Execution Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="automations">
          {loading ? (
            <div className="text-center py-8">Loading automations...</div>
          ) : automations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No automations yet</p>
                <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                  Create your first automation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {automations.map(automation => (
                <Card key={automation.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={automation.enabled}
                          onCheckedChange={(checked) => handleToggle(automation.id, checked)}
                        />
                        <div>
                          <h3 className="font-medium">{automation.name}</h3>
                          <p className="text-sm text-muted-foreground">{automation.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">Runs: {automation.run_count}</p>
                          {automation.last_run && (
                            <p className="text-xs text-muted-foreground">
                              Last: {new Date(automation.last_run).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(automation)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => loadLogs(automation.id)}>
                            <History className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(automation.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-sm">
                      <Badge variant="outline">
                        <Zap className="h-3 w-3 mr-1" />
                        {triggers.find(t => t.id === automation.trigger.type)?.name || automation.trigger.type}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      {automation.conditions.length > 0 && (
                        <>
                          <Badge variant="secondary">
                            <Filter className="h-3 w-3 mr-1" />
                            {automation.conditions.length} condition(s)
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </>
                      )}
                      <Badge variant="default">
                        <Play className="h-3 w-3 mr-1" />
                        {automation.actions.length} action(s)
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Execution Log Viewer</CardTitle>
              <CardDescription>View automation execution history</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Select an automation to view its execution logs
                </p>
              ) : (
                <div className="space-y-2">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Badge variant={log.status === 'success' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                          {log.status}
                        </Badge>
                        <span className="text-sm">{new Date(log.executed_at).toLocaleString()}</span>
                      </div>
                      {log.error && <span className="text-sm text-red-500">{log.error}</span>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingAutomation} onOpenChange={(open) => !open && setEditingAutomation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Automation</DialogTitle>
          </DialogHeader>
          <AutomationForm
            onSubmit={handleUpdate}
            submitLabel="Save Changes"
            formData={formData}
            setFormData={setFormData}
            triggers={triggers}
            actions={actions}
            addCondition={addCondition}
            updateCondition={updateCondition}
            removeCondition={removeCondition}
            addAction={addAction}
            updateAction={updateAction}
            removeAction={removeAction}
            onCancel={() => { setEditingAutomation(null); resetForm(); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
