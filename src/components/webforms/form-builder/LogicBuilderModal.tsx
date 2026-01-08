import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Shield, Zap, AlertCircle, CheckCircle2, Info, ArrowRight, Eye, EyeOff, Lock } from 'lucide-react';
import { FormField } from './types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LogicRule {
  id: string;
  name: string;
  enabled: boolean;
  conditionLogic: 'all' | 'any';
  conditions: { fieldId: string; operator: string; value: string; caseInsensitive?: boolean; compareWithField?: boolean }[];
  actions: { type: string; target?: string; value?: string; targets?: string[] }[];
  elseActions?: { type: string; target?: string; value?: string; targets?: string[] }[];
  elseEnabled?: boolean;
}

interface LogicBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: LogicRule | null;
  fields: FormField[];
  onSave: (rule: LogicRule) => void;
}

export default function LogicBuilderModal({ isOpen, onClose, rule, fields, onSave }: LogicBuilderModalProps) {
  const [editingRule, setEditingRule] = useState<LogicRule>({
    id: `rule_${Date.now()}`,
    name: 'New Logic Rule',
    enabled: true,
    conditionLogic: 'all',
    conditions: [{ fieldId: '', operator: 'equals', value: '', caseInsensitive: false }],
    actions: [{ type: 'show_fields', targets: [] }],
    elseActions: [],
    elseEnabled: false,
  });

  // Reset state when modal opens with a new rule or null
  useEffect(() => {
    if (isOpen) {
      if (rule) {
        setEditingRule({ ...rule });
      } else {
        setEditingRule({
          id: `rule_${Date.now()}`,
          name: 'New Logic Rule',
          enabled: true,
          conditionLogic: 'all',
          conditions: [{ fieldId: '', operator: 'equals', value: '', caseInsensitive: false }],
          actions: [{ type: 'show_fields', targets: [] }],
          elseActions: [],
          elseEnabled: false,
        });
      }
    }
  }, [isOpen, rule]);

  const operatorOptions = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does Not Contain' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
  ];

  const actionTypeOptions = [
    { value: 'show_fields', label: 'Show Fields' },
    { value: 'hide_fields', label: 'Hide Fields' },
    { value: 'set_value', label: 'Set Value' },
    { value: 'skip_to_page', label: 'Skip To Page' },
    { value: 'require_fields', label: 'Require Fields' },
    { value: 'unrequire_fields', label: 'Unrequire Fields' },
  ];

  const addCondition = () => {
    setEditingRule({
      ...editingRule,
      conditions: [...editingRule.conditions, { fieldId: '', operator: 'equals', value: '', caseInsensitive: false }],
    });
  };

  const removeCondition = (index: number) => {
    if (editingRule.conditions.length <= 1) return;
    setEditingRule({
      ...editingRule,
      conditions: editingRule.conditions.filter((_, i) => i !== index),
    });
  };

  const updateCondition = (index: number, updates: Partial<typeof editingRule.conditions[0]>) => {
    const newConditions = [...editingRule.conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setEditingRule({ ...editingRule, conditions: newConditions });
  };

  const addAction = () => {
    setEditingRule({
      ...editingRule,
      actions: [...editingRule.actions, { type: 'show_fields', targets: [] }],
    });
  };

  const removeAction = (index: number) => {
    if (editingRule.actions.length <= 1) return;
    setEditingRule({
      ...editingRule,
      actions: editingRule.actions.filter((_, i) => i !== index),
    });
  };

  const updateAction = (index: number, updates: Partial<typeof editingRule.actions[0]>) => {
    const newActions = [...editingRule.actions];
    newActions[index] = { ...newActions[index], ...updates };
    setEditingRule({ ...editingRule, actions: newActions });
  };

  const addElseAction = () => {
    setEditingRule({
      ...editingRule,
      elseActions: [...(editingRule.elseActions || []), { type: 'show_fields', targets: [] }],
    });
  };

  const removeElseAction = (index: number) => {
    const newElse = (editingRule.elseActions || []).filter((_, i) => i !== index);
    setEditingRule({
      ...editingRule,
      elseActions: newElse,
    });
  };

  const updateElseAction = (index: number, updates: Partial<typeof editingRule.actions[0]>) => {
    const newElseActions = [...(editingRule.elseActions || [])];
    newElseActions[index] = { ...newElseActions[index], ...updates };
    setEditingRule({ ...editingRule, elseActions: newElseActions });
  };

  const handleSave = () => {
    if (!editingRule.name.trim()) return;
    onSave(editingRule);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden bg-background rounded-2xl border-none shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b bg-card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black text-white rounded-xl shadow-lg">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight">Advanced Logic Builder</DialogTitle>
              <DialogDescription className="text-sm mt-1 text-muted-foreground">
                Control field behavior and branching logic with granular conditions.
              </DialogDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-8">
          <div className="space-y-12 max-w-5xl mx-auto pb-8">
            {/* Logic Name & Status */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-muted/30 border border-border rounded-2xl">
              <div className="flex-1 w-full space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Rule Identification</label>
                <input
                  type="text"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  className="w-full bg-background border border-border focus:ring-2 focus:ring-primary/20 rounded-xl px-5 py-3 font-semibold text-lg transition-all"
                  placeholder="E.g., Conditional Discount Rule"
                />
              </div>
              <div className="flex items-center gap-6 px-4 py-2 bg-background border border-border rounded-xl shadow-sm self-end md:self-center">
                <div className="flex flex-col text-right">
                  <span className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Active Status</span>
                  <span className="text-sm font-bold">{editingRule.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <Switch
                  checked={editingRule.enabled}
                  onCheckedChange={(checked) => setEditingRule({ ...editingRule, enabled: checked })}
                />
              </div>
            </div>

            {/* Conditions Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-xs ring-4 ring-orange-500/5">1</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">If</span>
                    <select
                      value={editingRule.conditionLogic}
                      onChange={(e) => setEditingRule({ ...editingRule, conditionLogic: e.target.value as 'all' | 'any' })}
                      className="bg-muted border-none rounded-lg px-3 py-1 text-sm font-black uppercase text-primary focus:ring-0 cursor-pointer"
                    >
                      <option value="all">ALL</option>
                      <option value="any">ANY</option>
                    </select>
                    <span className="text-sm font-medium text-muted-foreground italic">of these rules are met:</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={addCondition} className="h-9 gap-1.5 font-bold text-[12px] uppercase tracking-wider rounded-xl border-dashed">
                  <Plus className="w-3.5 h-3.5" /> Add Condition
                </Button>
              </div>

              <div className="space-y-4">
                {editingRule.conditions.map((condition, index) => (
                  <div key={index} className="group relative bg-muted/20 hover:bg-muted/30 border border-border rounded-2xl p-6 transition-all shadow-sm">
                    <div className="grid grid-cols-12 gap-4 items-start">
                      <div className="col-span-12 lg:col-span-4 space-y-1.5">
                        <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Source Field</label>
                        <select
                          value={condition.fieldId}
                          onChange={(e) => updateCondition(index, { fieldId: e.target.value })}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="">Select field...</option>
                          {fields.filter(f => f.id).map((field) => (
                            <option key={field.id} value={field.id}>{field.label || 'Unnamed Field'}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-12 md:col-span-5 lg:col-span-3 space-y-1.5">
                        <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Operation</label>
                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(index, { operator: e.target.value })}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                        >
                          {operatorOptions.map((op) => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-12 md:col-span-7 lg:col-span-4 space-y-1.5 flex gap-2 items-end">
                        {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                          <div className="flex-1 space-y-1.5">
                            <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider ml-1">
                              {condition.compareWithField ? 'Comparison Field' : 'Static Value'}
                            </label>
                            {condition.compareWithField ? (
                              <select
                                value={condition.value}
                                onChange={(e) => updateCondition(index, { value: e.target.value })}
                                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                              >
                                <option value="">Select comparison field...</option>
                                {fields.map((field) => (
                                  <option key={field.id} value={field.id}>{field.label}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={condition.value}
                                onChange={(e) => updateCondition(index, { value: e.target.value })}
                                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                                placeholder="Value target..."
                              />
                            )}
                          </div>
                        )}

                        {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                          <button
                            onClick={() => updateCondition(index, { compareWithField: !condition.compareWithField, value: '' })}
                            className={cn(
                              "h-10 px-3 rounded-xl border transition-all shadow-sm",
                              condition.compareWithField ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:border-primary/30"
                            )}
                            title={condition.compareWithField ? "Switch to Static Value" : "Switch to Field Comparison"}
                          >
                            {condition.compareWithField ? <Shield className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                        )}
                      </div>

                      <div className="col-span-12 lg:col-span-1 flex items-end justify-end pt-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCondition(index)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                      <div className="mt-4 flex items-center gap-2 px-1">
                        <Switch
                          id={`case-${index}`}
                          checked={condition.caseInsensitive || false}
                          onCheckedChange={(checked) => updateCondition(index, { caseInsensitive: checked })}
                          className="scale-75"
                        />
                        <label htmlFor={`case-${index}`} className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer select-none">
                          Case Insensitive Match
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center font-bold text-xs ring-4 ring-green-500/5">2</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">Then</span>
                    <span className="text-sm font-medium text-muted-foreground italic">perform the following updates:</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={addAction} className="h-9 gap-1.5 font-bold text-[12px] uppercase tracking-wider rounded-xl border-dashed">
                  <Plus className="w-3.5 h-3.5" /> Add Action
                </Button>
              </div>

              <div className="space-y-4">
                {editingRule.actions.map((action, index) => (
                  <div key={index} className="group bg-card border border-border/50 rounded-2xl p-6 transition-all shadow-sm">
                    <div className="grid grid-cols-12 gap-6 items-start">
                      <div className="col-span-12 lg:col-span-3 space-y-1.5">
                        <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Execution Action</label>
                        <select
                          value={action.type}
                          onChange={(e) => updateAction(index, { type: e.target.value })}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        >
                          {actionTypeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-12 lg:col-span-8 space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Select Target Fields ({(action.targets || []).length})</label>
                          {(action.targets || []).length > 0 && (
                            <button onClick={() => updateAction(index, { targets: [] })} className="text-[12px] font-black text-primary hover:underline transition-all">CLEAR ALL</button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-[140px] overflow-y-auto p-3 bg-muted/20 border border-border/40 rounded-xl scrollbar-hidden">
                          {fields.map((field) => (
                            <label
                              key={field.id}
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-lg border text-[12px] cursor-pointer transition-all",
                                (action.targets || []).includes(String(field.id))
                                  ? "bg-primary text-white border-primary font-bold shadow-md shadow-primary/20"
                                  : "bg-background border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={(action.targets || []).includes(String(field.id))}
                                onChange={(e) => {
                                  const current = action.targets || [];
                                  const next = e.target.checked
                                    ? [...current, String(field.id)]
                                    : current.filter(id => id !== String(field.id));
                                  updateAction(index, { targets: next });
                                }}
                              />
                              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", (action.targets || []).includes(String(field.id)) ? "bg-white" : "bg-muted-foreground/30")} />
                              <span className="truncate">{field.label || 'Unnamed'}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="col-span-12 lg:col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAction(index)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Else Actions Section */}
            <div className="pt-8 border-t border-dashed">
              <div className="flex items-center justify-between mb-8 bg-indigo-500/[0.03] p-6 rounded-2xl border border-indigo-500/10">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm",
                    editingRule.elseEnabled ? "bg-indigo-600 text-white shadow-indigo-500/20" : "bg-muted text-muted-foreground"
                  )}>
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-base leading-tight">Fallthrough Behavior <span className="text-[12px] font-black uppercase text-indigo-600 ml-2 py-0.5 px-2 bg-indigo-100 rounded-lg">Optional</span></h5>
                    <p className="text-xs text-muted-foreground mt-0.5">Define what happens when the conditions above are NOT met.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Enable Fallthrough</span>
                  <Switch
                    checked={editingRule.elseEnabled || false}
                    onCheckedChange={(checked) => setEditingRule({ ...editingRule, elseEnabled: checked })}
                  />
                </div>
              </div>

              {editingRule.elseEnabled && (
                <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Otherwise:</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={addElseAction} className="h-9 gap-1.5 font-bold text-[12px] uppercase tracking-wider rounded-xl border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                      <Plus className="w-3.5 h-3.5" /> Add Else Action
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(editingRule.elseActions || []).map((action, index) => (
                      <div key={index} className="group bg-indigo-500/[0.02] border border-indigo-500/10 rounded-2xl p-6 transition-all shadow-sm">
                        <div className="grid grid-cols-12 gap-6 items-start">
                          <div className="col-span-12 lg:col-span-3 space-y-1.5">
                            <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Action Type</label>
                            <select
                              value={action.type}
                              onChange={(e) => updateElseAction(index, { type: e.target.value })}
                              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
                            >
                              {actionTypeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-12 lg:col-span-8 space-y-3">
                            <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Targets</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-[140px] overflow-y-auto p-3 bg-white/50 border border-border/40 rounded-xl scrollbar-hidden">
                              {fields.map((field) => (
                                <label
                                  key={field.id}
                                  className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-lg border text-[12px] cursor-pointer transition-all",
                                    (action.targets || []).includes(String(field.id))
                                      ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-md shadow-indigo-500/20"
                                      : "bg-background border-border hover:border-indigo-500/40 text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={(action.targets || []).includes(String(field.id))}
                                    onChange={(e) => {
                                      const current = action.targets || [];
                                      const next = e.target.checked
                                        ? [...current, String(field.id)]
                                        : current.filter(id => id !== String(field.id));
                                      updateElseAction(index, { targets: next });
                                    }}
                                  />
                                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", (action.targets || []).includes(String(field.id)) ? "bg-white" : "bg-muted-foreground/30")} />
                                  <span className="truncate">{field.label || 'Unnamed'}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="col-span-12 lg:col-span-1 flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeElseAction(index)}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-8 border-t bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background border border-border rounded-lg text-muted-foreground">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="max-w-md text-xs text-muted-foreground leading-snug">
              Ensure your conditions reference fields that appear <strong>visually above</strong> the targeted action fields to avoid logical conflicts.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onClose} className="rounded-xl px-8 h-12 font-bold uppercase tracking-widest text-[12px]">
              Dismiss
            </Button>
            <Button onClick={handleSave} className="bg-black hover:bg-black/90 text-white rounded-xl px-12 h-12 font-bold shadow-xl shadow-black/20 transition-all active:scale-95 text-sm">
              Save Logic Architecture
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
