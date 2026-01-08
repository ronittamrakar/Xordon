import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { expensesApi, ExpenseCategory, moduleSettingsApi, timeTrackingApi, staffApi, StaffMember, payrollApi } from '@/services';
import { Plus, Settings, Trash2, Pencil, Loader2, DollarSign, Clock, Calendar, RefreshCw, Users, X, Building2, Briefcase } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function HRSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isAccrualOpen, setIsAccrualOpen] = useState(false);
  const [isTaxBracketDialogOpen, setIsTaxBracketDialogOpen] = useState(false);
  const [editingTaxBracket, setEditingTaxBracket] = useState<any | null>(null);
  const [newTaxBracket, setNewTaxBracket] = useState({
    tax_type: 'federal',
    min_income: '',
    max_income: '',
    rate: '',
  });
  const [selectedStaffForAccrual, setSelectedStaffForAccrual] = useState<number[]>([]);
  const [isDryRun, setIsDryRun] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    requires_receipt: true,
    max_amount: '',
    color: '#3b82f6',
  });

  const [departments, setDepartments] = useState<string[]>([]);
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [activeLeaveTypes, setActiveLeaveTypes] = useState<string[]>([]);

  // HR Settings state
  const [hrSettings, setHRSettings] = useState({
    // Time Tracking Settings
    enableGeolocation: true,
    requirePhotoClockIn: false,
    autoBreakReminder: true,
    breakReminderMinutes: 240, // 4 hours
    overtimeThreshold: 40, // hours per week
    overtimeMultiplier: 1.5,

    // Leave Settings
    vacationAccrualRate: 0.0385, // ~10 days per year
    sickAccrualRate: 0.0385,
    personalDays: 3,
    maxCarryover: 40, // hours
    leaveApprovalRequired: true,

    // Payroll Settings
    defaultPayPeriod: 'bi-weekly' as const,
    payrollProcessingDay: 1, // days before pay date
    autoProcessPayroll: false,
    requireTimesheetApproval: true,
    federalTaxRate: 0.12,
    stateTaxRate: 0.05,
    socialSecurityRate: 0.062,
    medicareRate: 0.0145,
    employerSocialSecurityRate: 0.062,
    employerMedicareRate: 0.0145,
    employerUnemploymentRate: 0.006,
  });

  // ==================== QUERIES ====================
  const { data: expenseCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expensesApi.getExpenseCategories(),
  });

  const { data: allSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['module-settings'],
    queryFn: () => moduleSettingsApi.getAllSettings(),
  });

  const { data: taxBrackets, isLoading: taxBracketsLoading } = useQuery({
    queryKey: ['tax-brackets'],
    queryFn: () => payrollApi.getTaxBrackets(),
  });

  // Update local state when settings are loaded
  React.useEffect(() => {
    if (allSettings) {
      const time = allSettings['hr.time'] || {};
      const leave = allSettings['hr.leave'] || {};
      const payroll = allSettings['hr.payroll'] || {};
      const organization = allSettings['hr.organization'] || {};

      setDepartments((organization as any).departments || ['Engineering', 'Sales', 'Marketing', 'HR', 'Operations']);
      setJobTitles((organization as any).job_titles || ['Manager', 'Developer', 'Designer', 'Sales Representative']);
      setActiveLeaveTypes((leave as any).active_types || ['vacation', 'sick', 'personal', 'bereavement', 'unpaid']);

      setHRSettings({
        // Time Tracking Settings
        enableGeolocation: (time as any).enable_geolocation ?? true,
        requirePhotoClockIn: (time as any).require_photo_clock_in ?? false,
        autoBreakReminder: (time as any).auto_break_reminder ?? true,
        breakReminderMinutes: (time as any).break_reminder_minutes ?? 240,
        overtimeThreshold: (time as any).overtime_threshold_hours ?? 40,
        overtimeMultiplier: (time as any).overtime_multiplier ?? 1.5,

        // Leave Settings
        vacationAccrualRate: (leave as any).vacation_accrual_rate ?? 0.0385,
        sickAccrualRate: (leave as any).sick_accrual_rate ?? 0.0385,
        personalDays: (leave as any).personal_days ?? 3,
        maxCarryover: (leave as any).max_carryover ?? 40,
        leaveApprovalRequired: (leave as any).require_approval ?? true,

        // Payroll Settings
        defaultPayPeriod: (payroll as any).default_pay_period ?? 'bi-weekly',
        payrollProcessingDay: (payroll as any).processing_lead_time ?? 1,
        autoProcessPayroll: (payroll as any).auto_process ?? false,
        requireTimesheetApproval: (payroll as any).require_timesheet_approval ?? true,
        federalTaxRate: (payroll as any).federal_tax_rate ?? 0.12,
        stateTaxRate: (payroll as any).state_tax_rate ?? 0.05,
        socialSecurityRate: (payroll as any).social_security_rate ?? 0.062,
        medicareRate: (payroll as any).medicare_rate ?? 0.0145,
        employerSocialSecurityRate: (payroll as any).employer_social_security_rate ?? 0.062,
        employerMedicareRate: (payroll as any).employer_medicare_rate ?? 0.0145,
        employerUnemploymentRate: (payroll as any).employer_unemployment_rate ?? 0.006,
      });
    }
  }, [allSettings]);

  const { data: staffMembers } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.list(),
  });

  // ==================== MUTATIONS ====================
  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => expensesApi.createExpenseCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      toast({
        title: 'Category created',
        description: 'Expense category has been created successfully.',
      });
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create category',
        variant: 'destructive',
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      expensesApi.updateExpenseCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      toast({
        title: 'Category updated',
        description: 'Expense category has been updated successfully.',
      });
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update category',
        variant: 'destructive',
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => expensesApi.deleteExpenseCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      toast({
        title: 'Category deleted',
        description: 'Expense category has been deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive',
      });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: typeof hrSettings) => {
      await Promise.all([
        moduleSettingsApi.updateModuleSettings('hr.time', {
          enable_geolocation: settings.enableGeolocation,
          require_photo_clock_in: settings.requirePhotoClockIn,
          auto_break_reminder: settings.autoBreakReminder,
          break_reminder_minutes: settings.breakReminderMinutes,
          overtime_threshold_hours: settings.overtimeThreshold,
          overtime_multiplier: settings.overtimeMultiplier,
        }),
        moduleSettingsApi.updateModuleSettings('hr.leave', {
          vacation_accrual_rate: settings.vacationAccrualRate,
          sick_accrual_rate: settings.sickAccrualRate,
          personal_days: settings.personalDays,
          max_carryover: settings.maxCarryover,
          require_approval: settings.leaveApprovalRequired,
          active_types: activeLeaveTypes,
        }),
        moduleSettingsApi.updateModuleSettings('hr.organization', {
          departments: departments,
          job_titles: jobTitles,
        }),
        moduleSettingsApi.updateModuleSettings('hr.payroll', {
          default_pay_period: settings.defaultPayPeriod,
          processing_lead_time: settings.payrollProcessingDay,
          auto_process: settings.autoProcessPayroll,
          require_timesheet_approval: settings.requireTimesheetApproval,
          federal_tax_rate: settings.federalTaxRate,
          state_tax_rate: settings.stateTaxRate,
          social_security_rate: settings.socialSecurityRate,
          medicare_rate: settings.medicareRate,
          employer_social_security_rate: settings.employerSocialSecurityRate,
          employer_medicare_rate: settings.employerMedicareRate,
          employer_unemployment_rate: settings.employerUnemploymentRate,
        }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-settings'] });
      toast({
        title: 'Settings saved',
        description: 'HR settings have been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    },
  });

  const processAccrualsMutation = useMutation({
    mutationFn: (params: { user_ids?: number[]; dry_run?: boolean } = {}) =>
      timeTrackingApi.processAccruals(params),
    onSuccess: (data) => {
      toast({
        title: isDryRun ? 'Dry Run Complete' : 'Accruals processed',
        description: data.message
      });
      setIsAccrualOpen(false);
      setSelectedStaffForAccrual([]);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to process accruals',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const createTaxBracketMutation = useMutation({
    mutationFn: (data: any) => payrollApi.createTaxBracket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-brackets'] });
      toast({ title: 'Tax bracket created' });
      setIsTaxBracketDialogOpen(false);
      resetTaxBracketForm();
    },
  });

  const updateTaxBracketMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => payrollApi.updateTaxBracket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-brackets'] });
      toast({ title: 'Tax bracket updated' });
      setIsTaxBracketDialogOpen(false);
      resetTaxBracketForm();
    },
  });

  const deleteTaxBracketMutation = useMutation({
    mutationFn: (id: number) => payrollApi.deleteTaxBracket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-brackets'] });
      toast({ title: 'Tax bracket deleted' });
    },
  });

  // ==================== HANDLERS ====================
  const resetTaxBracketForm = () => {
    setNewTaxBracket({
      tax_type: 'federal',
      min_income: '',
      max_income: '',
      rate: '',
    });
    setEditingTaxBracket(null);
  };

  const handleEditTaxBracket = (bracket: any) => {
    setEditingTaxBracket(bracket);
    setNewTaxBracket({
      tax_type: bracket.tax_type,
      min_income: bracket.min_income.toString(),
      max_income: bracket.max_income?.toString() || '',
      rate: (bracket.rate * 100).toString(),
    });
    setIsTaxBracketDialogOpen(true);
  };

  const handleSaveTaxBracket = () => {
    const data = {
      ...newTaxBracket,
      min_income: parseFloat(newTaxBracket.min_income),
      max_income: newTaxBracket.max_income ? parseFloat(newTaxBracket.max_income) : null,
      rate: parseFloat(newTaxBracket.rate) / 100,
    };

    if (editingTaxBracket) {
      updateTaxBracketMutation.mutate({ id: editingTaxBracket.id, data });
    } else {
      createTaxBracketMutation.mutate(data);
    }
  };

  const handleProcessAccruals = () => {
    processAccrualsMutation.mutate({
      user_ids: selectedStaffForAccrual.length > 0 ? selectedStaffForAccrual : undefined,
      dry_run: isDryRun
    });
  };

  const toggleStaffSelection = (id: number) => {
    setSelectedStaffForAccrual(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const resetCategoryForm = () => {
    setNewCategory({
      name: '',
      description: '',
      requires_receipt: true,
      max_amount: '',
      color: '#3b82f6',
    });
    setEditingCategory(null);
  };

  const handleEditCategory = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description || '',
      requires_receipt: category.requires_receipt,
      max_amount: category.max_amount?.toString() || '',
      color: category.color || '#3b82f6',
    });
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = () => {
    const data = {
      ...newCategory,
      max_amount: newCategory.max_amount ? parseFloat(newCategory.max_amount) : null,
    };

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleSaveHRSettings = () => {
    saveSettingsMutation.mutate(hrSettings);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight">HR Settings</h1>
          <p className="text-sm text-muted-foreground">Configure HR module settings and categories</p>
        </div>
      </div>

      {/* Main Content - Vertical Sections */}
      <div className="space-y-8">
        {/* Organization Section */}
        <section id="organization" className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            <h3 className="text-base font-semibold">Organization Structure</h3>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Departments & Job Titles</CardTitle>
              <CardDescription>Manage organizational structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Departments</Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Add Department (Press Enter)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val && !departments.includes(val)) {
                          setDepartments([...departments, val]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {departments.map(dept => (
                    <Badge key={dept} variant="secondary" className="pl-2 pr-1 py-1">
                      {dept}
                      <button
                        className="ml-2 hover:text-red-500 rounded-full p-0.5"
                        onClick={() => setDepartments(departments.filter(d => d !== dept))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Job Titles</Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Add Job Title (Press Enter)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val && !jobTitles.includes(val)) {
                          setJobTitles([...jobTitles, val]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {jobTitles.map(title => (
                    <Badge key={title} variant="secondary" className="pl-2 pr-1 py-1">
                      {title}
                      <button
                        className="ml-2 hover:text-red-500 rounded-full p-0.5"
                        onClick={() => setJobTitles(jobTitles.filter(t => t !== title))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveHRSettings} disabled={saveSettingsMutation.isPending}>
                  {saveSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Settings className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Expense Categories Section */}
        <section id="expense-categories" className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <h3 className="text-base font-semibold">Expense Categories</h3>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base">Expense Categories</CardTitle>
                  <CardDescription>Manage expense categories and rules</CardDescription>
                </div>
                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetCategoryForm}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? 'Edit Category' : 'Create Category'}
                      </DialogTitle>
                      <DialogDescription>
                        Configure expense category settings
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Category Name</Label>
                        <Input
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                          placeholder="e.g., Travel, Meals, Office Supplies"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={newCategory.description}
                          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                          placeholder="Optional description..."
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Max Amount (Optional)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newCategory.max_amount}
                          onChange={(e) => setNewCategory({ ...newCategory, max_amount: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Color</Label>
                        <Input
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="requires-receipt"
                          checked={newCategory.requires_receipt}
                          onChange={(e) => setNewCategory({ ...newCategory, requires_receipt: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="requires-receipt">Requires Receipt</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveCategory}
                        disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                      >
                        {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !expenseCategories?.data || expenseCategories.data.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No expense categories found</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Max Amount</TableHead>
                        <TableHead>Receipt Required</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseCategories.data.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {category.description || '-'}
                          </TableCell>
                          <TableCell>
                            {category.max_amount
                              ? new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(category.max_amount)
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {category.requires_receipt ? (
                              <Badge variant="outline">Required</Badge>
                            ) : (
                              <Badge variant="secondary">Optional</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id)}
                                disabled={deleteCategoryMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Time Tracking Section */}
        <section id="time-tracking" className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Clock className="w-4 h-4 text-purple-500" />
            <h3 className="text-base font-semibold">Time Tracking</h3>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Time Tracking Settings</CardTitle>
              <CardDescription>Configure time tracking behavior and rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Geolocation</Label>
                    <p className="text-sm text-muted-foreground">Track employee location on clock in/out</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hrSettings.enableGeolocation}
                    onChange={(e) => setHRSettings({ ...hrSettings, enableGeolocation: e.target.checked })}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Photo on Clock In</Label>
                    <p className="text-sm text-muted-foreground">Employees must take a photo when clocking in</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hrSettings.requirePhotoClockIn}
                    onChange={(e) => setHRSettings({ ...hrSettings, requirePhotoClockIn: e.target.checked })}
                    className="rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Overtime Threshold (hours/week)</Label>
                  <Input
                    type="number"
                    value={hrSettings.overtimeThreshold}
                    onChange={(e) => setHRSettings({ ...hrSettings, overtimeThreshold: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Overtime Multiplier</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={hrSettings.overtimeMultiplier}
                    onChange={(e) => setHRSettings({ ...hrSettings, overtimeMultiplier: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Break Reminders</Label>
                    <p className="text-sm text-muted-foreground">Remind employees to take breaks</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hrSettings.autoBreakReminder}
                    onChange={(e) => setHRSettings({ ...hrSettings, autoBreakReminder: e.target.checked })}
                    className="rounded"
                  />
                </div>
                {hrSettings.autoBreakReminder && (
                  <div>
                    <Label>Break Reminder (minutes)</Label>
                    <Input
                      type="number"
                      value={hrSettings.breakReminderMinutes}
                      onChange={(e) => setHRSettings({ ...hrSettings, breakReminderMinutes: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveHRSettings} disabled={saveSettingsMutation.isPending}>
                  {saveSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Settings className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Leave Settings Section */}
        <section id="leave-settings" className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            <h3 className="text-base font-semibold">Leave Settings</h3>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leave Settings</CardTitle>
              <CardDescription>Configure leave accrual and approval policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Vacation Accrual Rate (per hour)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={hrSettings.vacationAccrualRate}
                    onChange={(e) => setHRSettings({ ...hrSettings, vacationAccrualRate: parseFloat(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">~10 days/year = 0.0385</p>
                </div>
                <div>
                  <Label>Sick Leave Accrual Rate (per hour)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={hrSettings.sickAccrualRate}
                    onChange={(e) => setHRSettings({ ...hrSettings, sickAccrualRate: parseFloat(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">~10 days/year = 0.0385</p>
                </div>
                <div>
                  <Label>Personal Days (annual)</Label>
                  <Input
                    type="number"
                    value={hrSettings.personalDays}
                    onChange={(e) => setHRSettings({ ...hrSettings, personalDays: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Carryover (hours)</Label>
                  <Input
                    type="number"
                    value={hrSettings.maxCarryover}
                    onChange={(e) => setHRSettings({ ...hrSettings, maxCarryover: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Maximum hours that can roll over to next year</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Manager Approval</Label>
                    <p className="text-sm text-muted-foreground">Leave requests need approval</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hrSettings.leaveApprovalRequired}
                    onChange={(e) => setHRSettings({ ...hrSettings, leaveApprovalRequired: e.target.checked })}
                    className="rounded"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Active Leave Types</Label>
                <div className="flex flex-col gap-1 mb-3">
                  <Input
                    placeholder="Add Leave Type key (e.g. parental_leave)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim().toLowerCase();
                        if (val && !activeLeaveTypes.includes(val)) {
                          setActiveLeaveTypes([...activeLeaveTypes, val]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Press Enter to add. Use lowercase keys.</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {activeLeaveTypes.map(type => (
                    <Badge key={type} variant="outline" className="pl-2 pr-1 py-1">
                      {type}
                      <button className="ml-2 hover:text-red-500 rounded-full p-0.5" onClick={() => setActiveLeaveTypes(activeLeaveTypes.filter(t => t !== type))}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Dialog open={isAccrualOpen} onOpenChange={setIsAccrualOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Process Accruals Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Process Leave Accruals</DialogTitle>
                      <DialogDescription>
                        Calculate and add leave balances for employees based on their accrual rates.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="dry-run-settings"
                          checked={isDryRun}
                          onCheckedChange={(checked) => setIsDryRun(!!checked)}
                        />
                        <Label htmlFor="dry-run-settings" className="cursor-pointer">
                          Dry Run (Preview changes without saving)
                        </Label>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Select Employees (Optional)
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Leave empty to process accruals for all active employees.
                        </p>
                        <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 space-y-1">
                          {staffMembers?.map((staff: StaffMember) => (
                            <div key={staff.id} className="flex items-center space-x-2 p-1 hover:bg-accent rounded-sm">
                              <Checkbox
                                id={`staff-settings-${staff.id}`}
                                checked={selectedStaffForAccrual.includes(staff.id)}
                                onCheckedChange={() => toggleStaffSelection(staff.id)}
                              />
                              <Label htmlFor={`staff-settings-${staff.id}`} className="flex-1 cursor-pointer text-sm">
                                {staff.first_name} {staff.last_name}
                                <span className="ml-2 text-xs text-muted-foreground">({(staff as any).role || (staff as any).job_title})</span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsAccrualOpen(false)}>Cancel</Button>
                      <Button
                        onClick={handleProcessAccruals}
                        disabled={processAccrualsMutation.isPending}
                      >
                        {processAccrualsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isDryRun ? 'Run Preview' : 'Process Now'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button onClick={handleSaveHRSettings} disabled={saveSettingsMutation.isPending}>
                  {saveSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Settings className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Payroll Settings Section */}
        <section id="payroll-settings" className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Briefcase className="w-4 h-4 text-indigo-500" />
            <h3 className="text-base font-semibold">Payroll Settings</h3>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payroll Settings</CardTitle>
              <CardDescription>Configure payroll processing and approval workflows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Default Pay Period</Label>
                  <Select
                    value={hrSettings.defaultPayPeriod}
                    onValueChange={(value: any) => setHRSettings({ ...hrSettings, defaultPayPeriod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="semi-monthly">Semi-Monthly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Processing Lead Time (days)</Label>
                  <Input
                    type="number"
                    value={hrSettings.payrollProcessingDay}
                    onChange={(e) => setHRSettings({ ...hrSettings, payrollProcessingDay: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Days before pay date to process payroll</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Process Payroll</Label>
                    <p className="text-sm text-muted-foreground">Automatically process payroll on schedule</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hrSettings.autoProcessPayroll}
                    onChange={(e) => setHRSettings({ ...hrSettings, autoProcessPayroll: e.target.checked })}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Timesheet Approval</Label>
                    <p className="text-sm text-muted-foreground">Timesheets must be approved before payroll</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hrSettings.requireTimesheetApproval}
                    onChange={(e) => setHRSettings({ ...hrSettings, requireTimesheetApproval: e.target.checked })}
                    className="rounded"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium border-b pb-2">Tax Rates (Employee)</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Federal Tax (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={hrSettings.federalTaxRate * 100}
                      onChange={(e) => setHRSettings({ ...hrSettings, federalTaxRate: parseFloat(e.target.value) / 100 })}
                    />
                  </div>
                  <div>
                    <Label>State Tax (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={hrSettings.stateTaxRate * 100}
                      onChange={(e) => setHRSettings({ ...hrSettings, stateTaxRate: parseFloat(e.target.value) / 100 })}
                    />
                  </div>
                  <div>
                    <Label>Social Security (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={hrSettings.socialSecurityRate * 100}
                      onChange={(e) => setHRSettings({ ...hrSettings, socialSecurityRate: parseFloat(e.target.value) / 100 })}
                    />
                  </div>
                  <div>
                    <Label>Medicare (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={hrSettings.medicareRate * 100}
                      onChange={(e) => setHRSettings({ ...hrSettings, medicareRate: parseFloat(e.target.value) / 100 })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium border-b pb-2">Tax Rates (Employer)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Social Security (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={hrSettings.employerSocialSecurityRate * 100}
                      onChange={(e) => setHRSettings({ ...hrSettings, employerSocialSecurityRate: parseFloat(e.target.value) / 100 })}
                    />
                  </div>
                  <div>
                    <Label>Medicare (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={hrSettings.employerMedicareRate * 100}
                      onChange={(e) => setHRSettings({ ...hrSettings, employerMedicareRate: parseFloat(e.target.value) / 100 })}
                    />
                  </div>
                  <div>
                    <Label>Unemployment (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={hrSettings.employerUnemploymentRate * 100}
                      onChange={(e) => setHRSettings({ ...hrSettings, employerUnemploymentRate: parseFloat(e.target.value) / 100 })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveHRSettings} disabled={saveSettingsMutation.isPending}>
                  {saveSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Settings className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tax Brackets Section */}
        <section id="tax-brackets" className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <h3 className="text-base font-semibold">Tax Brackets</h3>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base">Tax Brackets</CardTitle>
                  <CardDescription>Manage progressive tax brackets for payroll</CardDescription>
                </div>
                <Dialog open={isTaxBracketDialogOpen} onOpenChange={setIsTaxBracketDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetTaxBracketForm}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Bracket
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingTaxBracket ? 'Edit Tax Bracket' : 'Create Tax Bracket'}
                      </DialogTitle>
                      <DialogDescription>
                        Configure income range and tax rate
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Tax Type</Label>
                        <Select
                          value={newTaxBracket.tax_type}
                          onValueChange={(value: any) => setNewTaxBracket({ ...newTaxBracket, tax_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="federal">Federal</SelectItem>
                            <SelectItem value="state">State</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Min Income ($)</Label>
                          <Input
                            type="number"
                            value={newTaxBracket.min_income}
                            onChange={(e) => setNewTaxBracket({ ...newTaxBracket, min_income: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Max Income ($) (Optional)</Label>
                          <Input
                            type="number"
                            value={newTaxBracket.max_income}
                            onChange={(e) => setNewTaxBracket({ ...newTaxBracket, max_income: e.target.value })}
                            placeholder="No limit"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Tax Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newTaxBracket.rate}
                          onChange={(e) => setNewTaxBracket({ ...newTaxBracket, rate: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsTaxBracketDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveTaxBracket}>Save Bracket</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {taxBracketsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Income Range</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxBrackets?.map((bracket: any) => (
                        <TableRow key={bracket.id}>
                          <TableCell className="capitalize">{bracket.tax_type}</TableCell>
                          <TableCell>
                            ${bracket.min_income.toLocaleString()} - {bracket.max_income ? `$${bracket.max_income.toLocaleString()}` : '∞'}
                          </TableCell>
                          <TableCell>{(bracket.rate * 100).toFixed(2)}%</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditTaxBracket(bracket)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Delete this bracket?')) {
                                    deleteTaxBracketMutation.mutate(bracket.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {taxBrackets?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No tax brackets configured. Flat rates from Payroll Settings will be used.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
