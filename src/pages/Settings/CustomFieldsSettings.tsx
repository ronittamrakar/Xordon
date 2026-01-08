/**
 * Custom Fields Settings Page
 * Manage custom field definitions for different entity types
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Settings,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  Link,
  Mail,
  Phone,
  DollarSign,
  FileTextIcon,
  User,
  Building,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { customFieldsApi, CustomFieldDefinition } from '@/services/customFieldsApi';
import { useToast } from '@/hooks/use-toast';

const fieldTypeIcons: Record<string, React.ElementType> = {
  text: Type,
  textarea: FileTextIcon,
  number: Hash,
  decimal: Hash,
  date: Calendar,
  datetime: Calendar,
  boolean: ToggleLeft,
  select: List,
  multiselect: List,
  url: Link,
  email: Mail,
  phone: Phone,
  currency: DollarSign,
  file: FileTextIcon,
  user: User,
  contact: User,
  company: Building,
};

const fieldTypeLabels: Record<string, string> = {
  text: 'Text',
  textarea: 'Long Text',
  number: 'Number',
  decimal: 'Decimal',
  date: 'Date',
  datetime: 'Date & Time',
  boolean: 'Yes/No',
  select: 'Dropdown',
  multiselect: 'Multi-Select',
  url: 'URL',
  email: 'Email',
  phone: 'Phone',
  currency: 'Currency',
  file: 'File',
  user: 'User',
  contact: 'Contact',
  company: 'Company',
};

const entityTypeLabels: Record<string, string> = {
  contact: 'Contacts',
  company: 'Companies',
  opportunity: 'Opportunities',
  job: 'Jobs',
  invoice: 'Invoices',
  appointment: 'Appointments',
  task: 'Tasks',
};

interface FieldFormData {
  entity_type: string;
  field_key: string;
  field_label: string;
  field_type: CustomFieldDefinition['field_type'];
  options?: string[];
  is_required: boolean;
  default_value?: string;
  placeholder?: string;
  help_text?: string;
  show_in_list: boolean;
  show_in_filters: boolean;
  field_group?: string;
}

const defaultFormData: FieldFormData = {
  entity_type: 'contact',
  field_key: '',
  field_label: '',
  field_type: 'text',
  is_required: false,
  show_in_list: false,
  show_in_filters: false,
};

function FieldCard({
  field,
  onEdit,
  onDelete,
}: {
  field: CustomFieldDefinition;
  onEdit: (field: CustomFieldDefinition) => void;
  onDelete: (field: CustomFieldDefinition) => void;
}) {
  const Icon = fieldTypeIcons[field.field_type] || Type;

  return (
    <div className="flex items-center gap-3 p-3 bg-white border rounded-lg group">
      <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{field.field_label}</span>
          <code className="text-xs text-gray-400 bg-gray-100 px-1 rounded">
            {field.field_key}
          </code>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="secondary" className="text-xs">
            {fieldTypeLabels[field.field_type]}
          </Badge>
          {field.is_required && (
            <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
              Required
            </Badge>
          )}
          {field.show_in_list && (
            <Badge variant="outline" className="text-xs">
              In List
            </Badge>
          )}
          {field.is_system && (
            <Badge variant="outline" className="text-xs text-purple-600 border-purple-200">
              System
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={() => onEdit(field)} disabled={field.is_system}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-600"
          onClick={() => onDelete(field)}
          disabled={field.is_system}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function CustomFieldsSettings() {
  const [selectedEntityType, setSelectedEntityType] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [deletingField, setDeletingField] = useState<CustomFieldDefinition | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<FieldFormData>(defaultFormData);
  const [optionsText, setOptionsText] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: fields, isLoading } = useQuery({
    queryKey: ['custom-fields'],
    queryFn: () => customFieldsApi.getDefinitions(),
  });

  const createMutation = useMutation({
    mutationFn: (data: FieldFormData) => {
      const options = optionsText
        .split('\n')
        .map((o) => o.trim())
        .filter(Boolean);
      return customFieldsApi.createDefinition({
        ...data,
        options: options.length > 0 ? options : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      setIsCreating(false);
      setFormData(defaultFormData);
      setOptionsText('');
      toast({ title: 'Field created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create field', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FieldFormData> }) => {
      const options = optionsText
        .split('\n')
        .map((o) => o.trim())
        .filter(Boolean);
      return customFieldsApi.updateDefinition(id, {
        ...data,
        options: options.length > 0 ? options : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      setEditingField(null);
      setFormData(defaultFormData);
      setOptionsText('');
      toast({ title: 'Field updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update field', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customFieldsApi.deleteDefinition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      setDeletingField(null);
      toast({ title: 'Field deleted' });
    },
  });

  const handleEdit = (field: CustomFieldDefinition) => {
    setEditingField(field);
    setFormData({
      entity_type: field.entity_type,
      field_key: field.field_key,
      field_label: field.field_label,
      field_type: field.field_type,
      is_required: field.is_required,
      default_value: field.default_value || undefined,
      placeholder: field.placeholder || undefined,
      help_text: field.help_text || undefined,
      show_in_list: field.show_in_list,
      show_in_filters: field.show_in_filters,
      field_group: field.field_group || undefined,
    });
    setOptionsText(
      Array.isArray(field.options)
        ? field.options.map((o) => (typeof o === 'string' ? o : o.label)).join('\n')
        : ''
    );
  };

  const handleCreate = (entityType: string) => {
    setIsCreating(true);
    setFormData({ ...defaultFormData, entity_type: entityType });
    setOptionsText('');
  };

  const handleLabelChange = (label: string) => {
    const key = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    setFormData((prev) => ({
      ...prev,
      field_label: label,
      field_key: isCreating ? key : prev.field_key,
    }));
  };

  const handleSubmit = () => {
    if (editingField) {
      updateMutation.mutate({ id: editingField.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Group fields by entity type
  const fieldsByEntity = React.useMemo(() => {
    if (!fields) return {};
    return fields.reduce((acc, field) => {
      if (!acc[field.entity_type]) {
        acc[field.entity_type] = [];
      }
      acc[field.entity_type].push(field);
      return acc;
    }, {} as Record<string, CustomFieldDefinition[]>);
  }, [fields]);

  const showOptionsField = ['select', 'multiselect'].includes(formData.field_type);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Custom Fields</h2>
        <p className="text-sm text-gray-500">
          Add custom fields to capture additional information for contacts, opportunities, and more
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(entityTypeLabels).map(([entityType, label]) => {
            const entityFields = fieldsByEntity[entityType] || [];
            const isOpen = selectedEntityType === entityType;

            return (
              <Collapsible
                key={entityType}
                open={isOpen}
                onOpenChange={(open) => setSelectedEntityType(open ? entityType : null)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <CardTitle className="text-base">{label}</CardTitle>
                          <Badge variant="secondary">{entityFields.length} fields</Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreate(entityType);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Field
                        </Button>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {entityFields.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No custom fields yet. Click "Add Field" to create one.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {entityFields.map((field) => (
                            <FieldCard
                              key={field.id}
                              field={field}
                              onEdit={handleEdit}
                              onDelete={setDeletingField}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreating || !!editingField}
        onOpenChange={() => {
          setIsCreating(false);
          setEditingField(null);
          setFormData(defaultFormData);
          setOptionsText('');
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingField ? 'Edit Field' : 'Create Field'}</DialogTitle>
            <DialogDescription>
              {editingField
                ? 'Update the field settings'
                : `Add a new custom field to ${entityTypeLabels[formData.entity_type]}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Field Label *</Label>
              <Input
                value={formData.field_label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="e.g., Company Size"
              />
            </div>

            <div className="space-y-2">
              <Label>Field Key</Label>
              <Input
                value={formData.field_key}
                onChange={(e) => setFormData((prev) => ({ ...prev, field_key: e.target.value }))}
                placeholder="company_size"
                disabled={!!editingField}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">Used in API and automations</p>
            </div>

            <div className="space-y-2">
              <Label>Field Type *</Label>
              <Select
                value={formData.field_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, field_type: value as FieldFormData['field_type'] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(fieldTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        {React.createElement(fieldTypeIcons[value] || Type, { className: 'w-4 h-4' })}
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showOptionsField && (
              <div className="space-y-2">
                <Label>Options (one per line) *</Label>
                <Textarea
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                  rows={4}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Placeholder</Label>
              <Input
                value={formData.placeholder || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, placeholder: e.target.value }))}
                placeholder="Enter placeholder text..."
              />
            </div>

            <div className="space-y-2">
              <Label>Help Text</Label>
              <Input
                value={formData.help_text || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, help_text: e.target.value }))}
                placeholder="Additional guidance for users..."
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Required</Label>
                <Switch
                  checked={formData.is_required}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_required: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Show in List View</Label>
                <Switch
                  checked={formData.show_in_list}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, show_in_list: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Show in Filters</Label>
                <Switch
                  checked={formData.show_in_filters}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, show_in_filters: checked }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setEditingField(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.field_label ||
                !formData.field_key ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingField ? (
                'Update Field'
              ) : (
                'Create Field'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingField} onOpenChange={() => setDeletingField(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Field</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingField?.field_label}"? This will also delete
              all stored values for this field. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingField && deleteMutation.mutate(deletingField.id)}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Field'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default CustomFieldsSettings;

