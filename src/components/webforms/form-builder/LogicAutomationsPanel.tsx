import { useState } from 'react';
import { Form, FormField } from './types';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Zap,
  Mail,
  Webhook,
  Tag,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Copy,
  Power,
  PowerOff,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Settings2,
  Lock,
  MessageSquare,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LogicBuilderModal from './LogicBuilderModal';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Switch } from '@/components/ui/switch';

interface LogicRule {
  id: string;
  name: string;
  enabled: boolean;
  conditionLogic: 'all' | 'any';
  conditions: { fieldId: string; operator: string; value: string; caseInsensitive?: boolean; compareWithField?: boolean }[];
  actions: { type: string; target: string; value?: string; targets?: string[] }[];
  elseActions?: { type: string; target: string; value?: string; targets?: string[] }[];
  elseEnabled?: boolean;
}

interface Automation {
  id: string;
  name: string;
  enabled?: boolean;
  trigger: 'on_submit' | 'on_partial' | 'on_abandon' | 'on_field_change';
  action: 'send_email' | 'send_sms' | 'webhook' | 'tag_contact' | 'update_crm';
  destination: string;
  config?: Record<string, any>;
}

interface LogicAutomationsPanelProps {
  form: Partial<Form>;
  fields?: FormField[];
  activeSection?: 'logic' | 'automations';
  onUpdate?: (updates: Partial<Form>) => void;
}

export default function LogicAutomationsPanel({ form, fields, activeSection, onUpdate }: LogicAutomationsPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LogicRule | null>(null);
  const [activeTab, setActiveTab] = useState<'logic' | 'automations'>(activeSection || 'logic');

  // Get logic rules and automations from form settings
  const logicRules = (form.settings?.logic_rules as LogicRule[]) || [];
  const automations = (form.settings?.automations as Automation[]) || [];
  const fieldOptions = fields || [];

  const updateLogicRules = (rules: LogicRule[]) => {
    onUpdate?.({
      settings: {
        ...form.settings,
        logic_rules: rules,
      },
    });
  };

  const updateAutomations = (autos: Automation[]) => {
    onUpdate?.({
      settings: {
        ...form.settings,
        automations: autos,
      },
    });
  };

  // Logic Rule Operations
  const handleCreateRule = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleEditRule = (rule: LogicRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleSaveRule = (rule: LogicRule) => {
    const existingIndex = logicRules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      const updated = [...logicRules];
      updated[existingIndex] = rule;
      updateLogicRules(updated);
    } else {
      updateLogicRules([...logicRules, rule]);
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this logic rule?')) {
      updateLogicRules(logicRules.filter(r => r.id !== ruleId));
    }
  };

  const handleToggleRule = (ruleId: string) => {
    const updated = logicRules.map(r =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    updateLogicRules(updated);
  };

  const handleDuplicateRule = (rule: LogicRule) => {
    const duplicated: LogicRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      name: `${rule.name} (Copy)`,
    };
    updateLogicRules([...logicRules, duplicated]);
  };

  // Automation Operations
  const handleCreateAutomation = () => {
    const newAutomation: Automation = {
      id: `auto_${Date.now()}`,
      name: 'New Automation',
      enabled: true,
      trigger: 'on_submit',
      action: 'send_email',
      destination: '',
    };
    updateAutomations([...automations, newAutomation]);
  };

  const handleUpdateAutomation = (id: string, updates: Partial<Automation>) => {
    const updated = automations.map(a =>
      a.id === id ? { ...a, ...updates } : a
    );
    updateAutomations(updated);
  };

  const handleDeleteAutomation = (id: string) => {
    if (confirm('Are you sure you want to delete this automation?')) {
      updateAutomations(automations.filter(a => a.id !== id));
    }
  };

  const handleToggleAutomation = (id: string) => {
    const updated = automations.map(a =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );
    updateAutomations(updated);
  };

  // Helper functions
  const getFieldLabel = (fieldId: string) => {
    const field = fieldOptions.find(f => f.id === fieldId);
    return field?.label || fieldId;
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'show_fields': return <Eye className="w-3.5 h-3.5" />;
      case 'hide_fields': return <EyeOff className="w-3.5 h-3.5" />;
      case 'send_email': return <Mail className="w-3.5 h-3.5" />;
      case 'webhook': return <Webhook className="w-3.5 h-3.5" />;
      case 'tag_contact': return <Tag className="w-3.5 h-3.5" />;
      case 'require_fields': return <Lock className="w-3.5 h-3.5" />;
      case 'unrequire_fields': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'set_value': return <Zap className="w-3.5 h-3.5" />;
      case 'skip_to_page': return <ArrowRight className="w-3.5 h-3.5" />;
      default: return <Zap className="w-3.5 h-3.5" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      show_fields: 'Show Fields',
      hide_fields: 'Hide Fields',
      set_value: 'Set Value',
      skip_to_page: 'Skip To Page',
      require_fields: 'Require Fields',
      unrequire_fields: 'Unrequire Fields',
      send_email: 'Send Email',
      send_sms: 'Send SMS',
      webhook: 'Webhook',
      tag_contact: 'Tag Contact',
    };
    return labels[actionType] || actionType;
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Form Logic & Automations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create conditional branching and automated workflows for your form.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCreateRule}
            className="h-10 px-6 rounded-lg bg-black hover:bg-black/90 text-white font-medium gap-2"
          >
            <Plus className="w-4 h-4" /> Create Rule
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl mb-6">
          <TabsTrigger
            value="logic"
            className="rounded-lg px-6 py-2 h-auto text-xs font-bold uppercase tracking-widest transition-all"
          >
            Logic Rules
          </TabsTrigger>
          <TabsTrigger
            value="automations"
            className="rounded-lg px-6 py-2 h-auto text-xs font-bold uppercase tracking-widest transition-all"
          >
            Automations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logic" className="mt-0 space-y-6">
          {logicRules.length === 0 ? (
            <div className="border-2 border-dashed border-muted rounded-3xl p-16 text-center bg-card/30">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <div className="max-w-xs mx-auto">
                  <h4 className="text-lg font-bold">No logic rules yet</h4>
                  <p className="text-muted-foreground text-sm mt-2">
                    Conditional logic allows you to hide or show fields based on user input.
                  </p>
                </div>
                <Button onClick={handleCreateRule} size="lg" className="mt-2 rounded-xl h-12 px-8 bg-black hover:bg-black/90 text-white font-bold gap-2">
                  Create Your First Rule
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[300px] font-bold text-[12px] uppercase tracking-widest">Name</TableHead>
                    <TableHead className="font-bold text-[12px] uppercase tracking-widest">Conditions</TableHead>
                    <TableHead className="font-bold text-[12px] uppercase tracking-widest">Actions</TableHead>
                    <TableHead className="w-[100px] font-bold text-[12px] uppercase tracking-widest text-center">Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logicRules.map((rule) => (
                    <TableRow key={rule.id} className="group hover:bg-muted/20 transition-colors">
                      <TableCell className="py-4">
                        <div className="font-semibold text-sm">{rule.name}</div>
                        <div className="text-[12px] text-muted-foreground mt-0.5 uppercase tracking-tighter">ID: {rule.id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 min-w-[200px]">
                          {rule.conditions.slice(0, 2).map((c, i) => (
                            <Badge key={i} variant="secondary" className="text-[12px] h-5 bg-orange-500/10 text-orange-700 border-none">
                              {getFieldLabel(c.fieldId)} {c.operator.replace('_', ' ')}
                            </Badge>
                          ))}
                          {rule.conditions.length > 2 && (
                            <Badge variant="secondary" className="text-[12px] h-5">+ {rule.conditions.length - 2} more</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 min-w-[200px]">
                          {rule.actions.slice(0, 2).map((a, i) => (
                            <Badge key={i} variant="secondary" className="text-[12px] h-5 bg-green-500/10 text-green-700 border-none uppercase tracking-tighter">
                              {getActionLabel(a.type)}
                            </Badge>
                          ))}
                          {rule.actions.length > 2 && (
                            <Badge variant="secondary" className="text-[12px] h-5">+ {rule.actions.length - 2} more</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => handleToggleRule(rule.id)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end pr-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl">
                              <DropdownMenuItem onClick={() => handleEditRule(rule)} className="rounded-lg gap-2 text-sm">
                                <Pencil className="w-4 h-4 opacity-50" /> Edit Rule
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateRule(rule)} className="rounded-lg gap-2 text-sm">
                                <Copy className="w-4 h-4 opacity-50" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteRule(rule.id)} className="rounded-lg gap-2 text-sm text-destructive focus:bg-destructive focus:text-destructive-foreground">
                                <Trash2 className="w-4 h-4 opacity-50" /> Delete Rule
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="automations" className="mt-0 space-y-6">
          {automations.length === 0 ? (
            <div className="border-2 border-dashed border-muted rounded-3xl p-16 text-center bg-card/30">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                  <Webhook className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="max-w-xs mx-auto">
                  <h4 className="text-lg font-bold">No automations yet</h4>
                  <p className="text-muted-foreground text-sm mt-2">
                    Set up automatic emails, webhooks, or CRM tags when someone fills your form.
                  </p>
                </div>
                <Button onClick={handleCreateAutomation} size="lg" className="mt-2 rounded-xl h-12 px-8 bg-black hover:bg-black/90 text-white font-bold gap-2">
                  <Plus className="w-4 h-4" /> Add Automation
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[300px] font-bold text-[12px] uppercase tracking-widest">Name</TableHead>
                    <TableHead className="font-bold text-[12px] uppercase tracking-widest">Trigger</TableHead>
                    <TableHead className="font-bold text-[12px] uppercase tracking-widest">Action</TableHead>
                    <TableHead className="font-bold text-[12px] uppercase tracking-widest">Destination</TableHead>
                    <TableHead className="w-[100px] font-bold text-[12px] uppercase tracking-widest text-center">Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {automations.map((auto) => (
                    <TableRow key={auto.id} className="group hover:bg-muted/20 transition-colors">
                      <TableCell className="py-4">
                        <div className="font-semibold text-sm">{auto.name}</div>
                        <div className="text-[12px] text-muted-foreground mt-0.5 uppercase tracking-tighter">ID: {auto.id}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-background border border-border text-[12px] font-medium h-5 tracking-tight px-2">
                          {auto.trigger.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-muted rounded-lg border border-border">
                            {getActionIcon(auto.action)}
                          </div>
                          <span className="text-xs font-semibold">{auto.action.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <span className="text-xs truncate text-muted-foreground" title={auto.destination || 'Not configured'}>{auto.destination || 'Not configured'}</span>
                          {auto.destination && <ExternalLink className="w-3 h-3 text-muted-foreground/50 shrink-0" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={auto.enabled !== false}
                            onCheckedChange={() => handleToggleAutomation(auto.id)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end pr-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl">
                              <DropdownMenuItem className="rounded-lg gap-2 text-sm">
                                <Pencil className="w-4 h-4 opacity-50" /> Edit Settings
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteAutomation(auto.id)} className="rounded-lg gap-2 text-sm text-destructive focus:bg-destructive focus:text-destructive-foreground">
                                <Trash2 className="w-4 h-4 opacity-50" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Info Banner */}
      <div className="bg-muted/30 border border-border rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="p-2.5 bg-background border border-border rounded-xl text-primary">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h5 className="text-sm font-bold">Things to remember</h5>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Logic rules are evaluated <strong>sequentiality</strong>. If a field is affected by multiple rules, the last rule executed will prevail.
            Field dependency is restricted to fields that appear above the target field in the form builder.
          </p>
        </div>
      </div>

      {/* Logic Builder Modal */}
      <LogicBuilderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRule(null);
        }}
        rule={editingRule}
        fields={fieldOptions}
        onSave={handleSaveRule}
      />
    </div>
  );
}
