import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { expensesApi, Expense, ExpenseCategory } from '@/services';
import {
  Loader2,
  Plus,
  FileTextIcon,
  Calendar as CalendarIcon,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Download,
  CheckCircle,
  TrendingUp,
  CreditCard,
  Receipt,
  ArrowUpRight,
  XCircle,
  Check,
  Tag
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ExpensesPage() {
  const [dateRange, setDateRange] = useState('30');
  const [activeTab, setActiveTab] = useState<'list' | 'growth' | 'cumulative'>('list');
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week'>('day');
  const [entriesPerPage, setEntriesPerPage] = useState('50');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isViewExpenseOpen, setIsViewExpenseOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  const queryClient = useQueryClient();

  const dateFilter = useMemo(() => {
    const days = parseInt(dateRange);
    const to = endOfDay(new Date());
    const from = startOfDay(subDays(to, days));
    return {
      from: format(from, 'yyyy-MM-dd'),
      to: format(to, 'yyyy-MM-dd'),
    };
  }, [dateRange]);

  const { data: expensesData, isLoading: expensesLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses', dateFilter, statusFilter],
    queryFn: () => expensesApi.getExpenses({
      from: dateFilter.from,
      to: dateFilter.to,
      status: statusFilter === 'all' ? undefined : statusFilter,
      limit: 1000
    }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expensesApi.getCategories(),
  });

  const { data: itemsAnalytics } = useQuery({
    queryKey: ['expenses-analytics', dateFilter],
    queryFn: () => expensesApi.getAnalytics({
      from: dateFilter.from,
      to: dateFilter.to
    })
  });

  const { data: chartData = [], isLoading: chartLoading } = useQuery({
    queryKey: ['expense-chart', dateFilter, chartPeriod],
    queryFn: () => expensesApi.getChartData({
      from: dateFilter.from,
      to: dateFilter.to,
      groupBy: chartPeriod,
    }),
    enabled: activeTab === 'growth' || activeTab === 'cumulative',
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: number) => expensesApi.approveExpense(id, { action: 'approve' }),
    onSuccess: () => {
      toast.success('Expense approved');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-analytics'] });
    },
    onError: () => toast.error('Failed to approve expense')
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => expensesApi.approveExpense(id, { action: 'reject' }),
    onSuccess: () => {
      toast.success('Expense rejected');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: () => toast.error('Failed to reject expense')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.deleteExpense(id),
    onSuccess: () => {
      toast.success('Expense deleted');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-analytics'] });
    },
    onError: () => toast.error('Failed to delete expense')
  });

  const expenses = expensesData?.data || [];

  // Client-side search filtering
  const filteredExpenses = useMemo(() => {
    if (!searchQuery) return expenses;
    const lowerQuery = searchQuery.toLowerCase();
    return expenses.filter(exp =>
      exp.description.toLowerCase().includes(lowerQuery) ||
      exp.merchant?.toLowerCase().includes(lowerQuery) ||
      exp.category_name?.toLowerCase().includes(lowerQuery) ||
      exp.amount.toString().includes(lowerQuery)
    );
  }, [expenses, searchQuery]);

  const cumulativeData = useMemo(() => {
    if (activeTab !== 'cumulative') return [];
    let cumulative = 0;
    return chartData.map(item => {
      cumulative += item.amount;
      return {
        ...item,
        amount: cumulative,
      };
    });
  }, [chartData, activeTab]);

  const displayChartData = activeTab === 'cumulative' ? cumulativeData : chartData;

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsAddExpenseOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteMutation.mutate(id);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200',
    approved: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200',
    rejected: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
    reimbursed: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200',
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <SEO
        title="Expenses"
        description="Track and manage company expenses, reimbursements, and spending."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Manage and track your business expenses.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCategoriesOpen(true)}>
            <Tag className="h-4 w-4 mr-2" />
            Categories
          </Button>
          <Button variant="outline" onClick={() => {
            refetchExpenses();
            queryClient.invalidateQueries({ queryKey: ['expenses-analytics'] });
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => {
            setEditingExpense(null);
            setIsAddExpenseOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {itemsAnalytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{itemsAnalytics.expenses.total_expenses}</div>
              <p className="text-xs text-muted-foreground">
                {itemsAnalytics.period.from === itemsAnalytics.period.to ? 'Today' : 'Processing period'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{formatCurrency(itemsAnalytics.expenses.total_amount)}</div>
              <p className="text-xs text-muted-foreground">Detailed breakdown below</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(itemsAnalytics.expenses.approved_amount)}</div>
              <p className="text-xs text-muted-foreground">Ready for reimbursement</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">Reimbursed</p>
                <CreditCard className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(itemsAnalytics.expenses.reimbursed_amount)}</div>
              <p className="text-xs text-muted-foreground">Already paid out</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="list">All Expenses</TabsTrigger>
            <TabsTrigger value="growth">Growth Chart</TabsTrigger>
            <TabsTrigger value="cumulative">Cumulative Chart</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Range Selector */}
            <div className="w-[180px]">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg font-medium">Expenses List</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search expenses..."
                      className="pl-8 w-full sm:w-[250px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="reimbursed">Reimbursed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expensesLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : filteredExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No expenses found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExpenses.slice(0, parseInt(entriesPerPage)).map((expense: Expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium text-sm">
                            {format(new Date(expense.expense_date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{expense.description}</span>
                              {expense.is_billable && (
                                <span className="text-xs text-blue-600 flex items-center mt-0.5">
                                  <CheckCircle className="h-3 w-3 mr-1" /> Billable
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-2 rounded-full bg-primary/20" />
                              <span className="text-sm">{expense.category_name || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {expense.merchant || '-'}
                          </TableCell>
                          <TableCell>
                            <span className="font-bold">{formatCurrency(expense.amount)}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={cn(statusColors[expense.status] || 'bg-gray-100')}>
                              {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedExpense(expense);
                                  setIsViewExpenseOpen(true);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(expense)}>
                                  <Pencil className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {expense.status === 'pending' && (
                                  <>
                                    <DropdownMenuItem onClick={() => approveMutation.mutate(expense.id)}>
                                      <Check className="h-4 w-4 mr-2 text-green-600" /> Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => rejectMutation.mutate(expense.id)}>
                                      <XCircle className="h-4 w-4 mr-2 text-red-600" /> Reject
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(expense.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-end space-x-2 py-4">
                <span className="text-sm text-muted-foreground mr-2">Rows per page</span>
                <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Expense Growth</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={chartPeriod === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartPeriod('day')}
                  >
                    Days
                  </Button>
                  <Button
                    variant={chartPeriod === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartPeriod('week')}
                  >
                    Weeks
                  </Button>
                </div>
              </div>
              <CardDescription>Visualizing expense trends over time.</CardDescription>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => format(new Date(value), 'MMM d')}
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Expenses']}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cumulative" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Cumulative Expenses</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={chartPeriod === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartPeriod('day')}
                  >
                    Days
                  </Button>
                  <Button
                    variant={chartPeriod === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartPeriod('week')}
                  >
                    Weeks
                  </Button>
                </div>
              </div>
              <CardDescription>Accumulated total over the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => format(new Date(value), 'MMM d')}
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Total']}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddExpenseDialog
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
        categories={categories}
        expenseToEdit={editingExpense}
      />

      {selectedExpense && (
        <ViewExpenseDialog
          open={isViewExpenseOpen}
          onOpenChange={setIsViewExpenseOpen}
          expense={selectedExpense}
        />
      )}
      <ManageCategoriesDialog
        open={isCategoriesOpen}
        onOpenChange={setIsCategoriesOpen}
      />
    </div>
  );
}

function ManageCategoriesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [newCategory, setNewCategory] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories', 'manage'],
    queryFn: () => expensesApi.getCategories(),
    enabled: open
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => expensesApi.createExpenseCategory({ name, is_active: true, sort_order: 0, requires_approval: false }),
    onSuccess: () => {
      toast.success('Category added');
      setNewCategory('');
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
    onError: () => toast.error('Failed to add category')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.deleteExpenseCategory(id),
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
    onError: () => toast.error('Failed to delete category')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setIsCreating(true);
    createMutation.mutate(newCategory, {
      onSettled: () => setIsCreating(false)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>Add or remove expense categories.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-md border p-1 max-h-[300px] overflow-y-auto">
            {categories.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No categories found.</div>
            ) : (
              <Table>
                <TableBody>
                  {categories.map((cat: ExpenseCategory) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteMutation.mutate(cat.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="New category name..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              disabled={isCreating}
            />
            <Button type="submit" disabled={isCreating || !newCategory.trim()}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddExpenseDialog({
  open,
  onOpenChange,
  categories,
  expenseToEdit
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categories: ExpenseCategory[];
  expenseToEdit: Expense | null;
}) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const defaultFormState = {
    description: '',
    amount: '',
    category_id: '',
    merchant: '',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    is_billable: false,
    notes: ''
  };

  const [formData, setFormData] = useState(defaultFormState);

  // Initialize form when opening for edit
  React.useEffect(() => {
    if (open && expenseToEdit) {
      setFormData({
        description: expenseToEdit.description,
        amount: String(expenseToEdit.amount),
        category_id: expenseToEdit.category_id ? String(expenseToEdit.category_id) : '',
        merchant: expenseToEdit.merchant || '',
        expense_date: format(new Date(expenseToEdit.expense_date), 'yyyy-MM-dd'),
        is_billable: expenseToEdit.is_billable,
        notes: expenseToEdit.notes || ''
      });
    } else if (open && !expenseToEdit) {
      setFormData(defaultFormState);
    }
  }, [open, expenseToEdit]);

  const createMutation = useMutation({
    mutationFn: expensesApi.createExpense,
    onSuccess: () => {
      toast.success('Expense added successfully');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-analytics'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to add expense');
      console.error(error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => expensesApi.updateExpense(expenseToEdit!.id, data),
    onSuccess: () => {
      toast.success('Expense updated successfully');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-analytics'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to update expense');
      console.error(error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
      merchant: formData.merchant,
      expense_date: formData.expense_date,
      is_billable: formData.is_billable,
      notes: formData.notes
    };

    if (expenseToEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{expenseToEdit ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
          <DialogDescription>
            {expenseToEdit ? 'Update details of the expense record.' : 'Create a new expense record.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  className="pl-9"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  className="pl-9"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g. Client Lunch"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(v) => setFormData({ ...formData, category_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                  {categories.length === 0 && (
                    <SelectItem value="uncategorized" disabled>No categories found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant</Label>
              <Input
                id="merchant"
                placeholder="e.g. Restaurant"
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="billable"
              checked={formData.is_billable}
              onCheckedChange={(c) => setFormData({ ...formData, is_billable: !!c })}
            />
            <Label htmlFor="billable" className="font-normal cursor-pointer">
              This expense is billable to a customer
            </Label>
          </div>

          {/* Integration placeholder for Customer if billable - could be added later */}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="resize-none h-20"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {expenseToEdit ? 'Update Expense' : 'Create Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ViewExpenseDialog({ open, onOpenChange, expense }: { open: boolean; onOpenChange: (o: boolean) => void; expense: Expense }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex justify-between items-start mr-4">
            <DialogTitle>Expense Details</DialogTitle>
          </div>
          <div className="pt-2 flex items-center gap-2">
            <Badge variant="outline">{expense.category_name || 'Uncategorized'}</Badge>
            <Badge variant="secondary">{expense.status.toUpperCase()}</Badge>
          </div>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Date</Label>
              <div className="font-medium mt-1">{format(new Date(expense.expense_date), 'MMM d, yyyy')}</div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Amount</Label>
              <div className="font-medium mt-1 text-lg">${expense.amount.toFixed(2)}</div>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Description</Label>
            <div className="font-medium mt-1">{expense.description}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Merchant</Label>
              <div className="font-medium mt-1">{expense.merchant || '-'}</div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">User</Label>
              <div className="font-medium mt-1">{expense.user_name || 'Unknown'}</div>
            </div>
          </div>

          {expense.notes && (
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Notes</Label>
              <div className="text-sm mt-1 bg-muted p-3 rounded-md">{expense.notes}</div>
            </div>
          )}

          <div className="flex border-t pt-4 mt-2 justify-between items-center text-sm text-muted-foreground">
            <div>ID: #{expense.id}</div>
            {expense.is_billable && <div className="flex items-center text-blue-600"><CheckCircle className="h-4 w-4 mr-1" /> Billable</div>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
