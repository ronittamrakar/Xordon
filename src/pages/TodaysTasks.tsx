import { useMemo, useState, useEffect } from 'react';
// Re-saving to force HMR reload
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  CheckCircle2, Clock, Phone, Mail, MessageSquare, Calendar as CalendarIcon,
  Plus, AlertCircle, Target, TrendingUp, Users, FileTextIcon,
  Play, Pencil, Trash2, MoreHorizontal, ExternalLink, AlertTriangle,
  Zap, Search, Filter, ArrowRight, BrainCircuit,
  Lightbulb
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';

import { useCallSession } from '@/contexts/CallSessionContext';
import { useNavigate } from 'react-router-dom';
import { DashboardKpiCard } from '@/components/dashboard/DashboardKpiCard';
import SEO from '@/components/SEO';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Task {
  id: number;
  title: string;
  description?: string;
  task_type: 'call' | 'email' | 'sms' | 'meeting' | 'follow_up' | 'demo' | 'proposal' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'deferred';
  due_date?: string;
  due_time?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_id?: number;
  outcome?: string;
  outcome_type?: string;
  tags?: string[];
  // Integration fields
  source?: 'planner' | 'crm' | 'project';
  source_id?: string | number;
  source_title?: string;
}

interface TodayData {
  today: Task[];
  overdue: Task[];
  upcoming: Task[];
  stats: {
    total: number;
    completed: number;
    calls: number;
    emails: number;
    meetings: number;
  };
}

// MOCK DATA GENERATOR
const generateMockTasks = (date: Date): TodayData => {
  const dateStr = date.toISOString().split('T')[0];
  const tasks: Task[] = [
    { id: 101, title: 'Morning Standup', task_type: 'meeting', priority: 'high', status: 'pending', due_date: dateStr, due_time: '09:00', description: 'Daily team sync', source: 'planner' },
    { id: 102, title: 'Call Client X', task_type: 'call', priority: 'medium', status: 'pending', due_date: dateStr, due_time: '11:00', contact_name: 'John Doe', contact_phone: '+1234567890', source: 'crm', source_title: 'Deal: Q1 Contract' },
    { id: 103, title: 'Email Proposal to Y', task_type: 'email', priority: 'urgent', status: 'pending', due_date: dateStr, due_time: '14:00', contact_name: 'Jane Smith', contact_email: 'jane@example.com', source: 'crm', source_title: 'Lead: Tech Corp' },
    { id: 104, title: 'Review Q3 Report', task_type: 'other', priority: 'low', status: 'completed', due_date: dateStr, due_time: '16:00', source: 'project', source_title: 'Website Redesign', source_id: 123 },
    { id: 105, title: 'Code Review', task_type: 'other', priority: 'medium', status: 'pending', due_date: dateStr, due_time: '15:30', source: 'project', source_title: 'Mobile App Launch', source_id: 124 },
  ];

  const upcoming: Task[] = [
    { id: 201, title: 'Project Kickoff', task_type: 'meeting', priority: 'high', status: 'pending', due_date: '2026-02-01', due_time: '10:00', source: 'project', source_title: 'New Client Onboarding' },
    { id: 202, title: 'Quarterly Review', task_type: 'meeting', priority: 'medium', status: 'pending', due_date: '2026-02-05', due_time: '14:00', source: 'planner' },
  ];

  const overdue: Task[] = [
    { id: 301, title: 'Submit Expense Report', task_type: 'other', priority: 'medium', status: 'pending', due_date: '2025-12-30', due_time: '17:00', source: 'planner' },
  ];

  return {
    today: tasks,
    upcoming,
    overdue,
    stats: {
      total: tasks.length + upcoming.length + overdue.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      calls: tasks.filter(t => t.task_type === 'call').length,
      emails: tasks.filter(t => t.task_type === 'email').length,
      meetings: tasks.filter(t => t.task_type === 'meeting').length,
    }
  };
};

interface DailyGoals {
  calls_goal: number;
  calls_completed: number;
  emails_goal: number;
  emails_completed: number;
  meetings_goal: number;
  meetings_completed: number;
  tasks_goal: number;
  tasks_completed: number;
}

export default function TodaysTasks() {
  const navigate = useNavigate();
  const { requestSoftphoneCall } = useCallSession();
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [dailyGoals, setDailyGoals] = useState<DailyGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Quick Notes State
  const [notes, setNotes] = useState(() => localStorage.getItem('planner_notes') || '');

  // Focus Mode State
  const [focusTask, setFocusTask] = useState(() => localStorage.getItem('planner_focus') || '');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'call',
    priority: 'medium',
    due_date: new Date().toISOString().split('T')[0],
    due_time: '09:00',
    contact_id: '',
    source: 'planner',
    source_id: ''
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [date]); // Reload when date changes

  // Persist notes and focus
  useEffect(() => {
    localStorage.setItem('planner_notes', notes);
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('planner_focus', focusTask);
  }, [focusTask]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Simulate API call with potential failure
      const [todayDataRes, dailyGoalsData, contactsData, projectsData] = await Promise.all([
        api.get('/tasks/today', { date: date?.toISOString() }).catch(() => null),
        api.get('/tasks/daily-goals').catch(() => null),
        api.get('/contacts').catch(() => null),
        (api as any).projects ? (api as any).projects.getAll().catch(() => []) : Promise.resolve([])
      ]);

      if (todayDataRes) {
        setTodayData(todayDataRes);
      } else {
        // Fallback to mock data if API fails or returns null
        console.log('Using Mock Data for Tasks');
        setTodayData(generateMockTasks(date || new Date()));
      }

      if (dailyGoalsData) {
        setDailyGoals(dailyGoalsData);
      } else {
        setDailyGoals({ calls_goal: 20, calls_completed: 5, emails_goal: 30, emails_completed: 12, meetings_goal: 3, meetings_completed: 1, tasks_goal: 10, tasks_completed: 4 });
      }

      setContacts(contactsData?.items || contactsData?.contacts || []);
      setProjects(Array.isArray(projectsData) ? projectsData : projectsData?.items || []);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
      // Fallback on catastrophic failure
      setTodayData(generateMockTasks(date || new Date()));
      setDailyGoals({ calls_goal: 20, calls_completed: 0, emails_goal: 30, emails_completed: 0, meetings_goal: 3, meetings_completed: 0, tasks_goal: 10, tasks_completed: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (quickAddTitle?: string) => {
    const payload = quickAddTitle
      ? {
        title: quickAddTitle,
        task_type: 'other',
        priority: 'medium',
        due_date: date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        due_time: '09:00',
        status: 'pending'
      }
      : formData;

    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, formData);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', payload);
        toast.success('Task created');
      }
      setIsCreateOpen(false);
      setEditingTask(null);
      resetForm();
      loadData();
    } catch (error) {
      // Optimistic update for demo/offline
      if (editingTask) {
        setTodayData(prev => {
          if (!prev) return null;
          const updateList = (list: Task[]) => list.map(t => t.id === editingTask.id ? { ...t, ...formData } as Task : t);
          return { ...prev, today: updateList(prev.today), upcoming: updateList(prev.upcoming), overdue: updateList(prev.overdue) };
        });
        toast.success('Task updated (Simulated)');
      } else {
        const newTask: Task = { id: Date.now(), ...payload as any, status: 'pending' };
        setTodayData(prev => prev ? { ...prev, today: [newTask, ...prev.today] } : null);
        toast.success('Task created (Simulated)');
      }
      setIsCreateOpen(false);
      setEditingTask(null);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      task_type: 'call',
      priority: 'medium',
      due_date: new Date().toISOString().split('T')[0],
      due_time: '09:00',
      contact_id: '',
      source: 'planner',
      source_id: ''
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      task_type: task.task_type,
      priority: task.priority,
      due_date: task.due_date || new Date().toISOString().split('T')[0],
      due_time: task.due_time || '09:00',
      contact_id: task.contact_id ? String(task.contact_id) : '',
      source: (task.source as any) || 'planner',
      source_id: task.source_id ? String(task.source_id) : ''
    });
    setIsCreateOpen(true);
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      loadData();
    } catch (error) {
      // Optimistic delete
      setTodayData(prev => {
        if (!prev) return null;
        const filterList = (list: Task[]) => list.filter(t => t.id !== taskId);
        return { ...prev, today: filterList(prev.today), upcoming: filterList(prev.upcoming), overdue: filterList(prev.overdue) };
      });
      toast.success('Task deleted (Simulated)');
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      await api.post(`/tasks/${taskId}/complete`, {});
      toast.success('Task completed!');
      loadData();
    } catch (error) {
      // Optimistic complete
      setTodayData(prev => {
        if (!prev) return null;
        const updateList = (list: Task[]) => list.map(t => t.id === taskId ? { ...t, status: 'completed' } as Task : t);
        return { ...prev, today: updateList(prev.today), upcoming: updateList(prev.upcoming), overdue: updateList(prev.overdue) };
      });
      toast.success('Task completed (Simulated)');
    }
  };

  const handleCallTask = (task: Task) => {
    if (task.contact_phone) {
      requestSoftphoneCall({
        number: task.contact_phone,
        recipientName: task.contact_name || 'Unknown',
        source: 'softphone',
        note: task.title
      });
      toast.success(`Initiating call to ${task.contact_name || task.contact_phone}`);
    } else {
      toast.error('No phone number available for this contact');
    }
  };

  const handleOpenContact = (task: Task) => {
    if (task.contact_id) {
      navigate(`/contacts/${task.contact_id}`);
    } else {
      toast.info('No linked contact for this task');
    }
  };

  const handleOpenSource = (task: Task) => {
    if (task.source === 'project' && task.source_id) {
      navigate(`/projects/${task.source_id}`);
    } else if (task.source === 'crm') {
      // Navigate to contacts mostly for CRM tasks unless we have deal ID
      if (task.contact_id) navigate(`/contacts/${task.contact_id}`);
      else navigate('/crm/sales');
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'meeting': return <CalendarIcon className="h-4 w-4" />;
      case 'demo': return <Users className="h-4 w-4" />;
      case 'proposal': return <FileTextIcon className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const completionPercentage = useMemo(() => {
    if (!todayData?.stats?.total) return 0;
    return Math.min(100, Math.round((todayData.stats.completed / todayData.stats.total) * 100));
  }, [todayData]);

  const normalizedSearch = search.trim().toLowerCase();

  const filterList = (list: Task[]) => {
    return list.filter((t) => {
      if (filterType !== 'all' && t.task_type !== filterType) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (!normalizedSearch) return true;
      const haystack = `${t.title} ${t.description || ''} ${t.contact_name || ''} ${t.contact_email || ''} ${t.contact_phone || ''}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  };

  const filteredToday = useMemo(() => filterList(todayData?.today || []), [todayData?.today, filterPriority, filterStatus, filterType, normalizedSearch]);
  const filteredUpcoming = useMemo(() => filterList(todayData?.upcoming || []), [todayData?.upcoming, filterPriority, filterStatus, filterType, normalizedSearch]);
  const filteredOverdue = useMemo(() => filterList(todayData?.overdue || []), [todayData?.overdue, filterPriority, filterStatus, filterType, normalizedSearch]);

  const bulkList = activeTab === 'today' ? filteredToday : activeTab === 'upcoming' ? filteredUpcoming : filteredOverdue; // Assume 'overdue' logic handled if added later, but sticking to 2 main tabs plus overdue alerts for now

  const selectedCountInTab = bulkList.filter(t => selectedIds.has(t.id)).length;

  const toggleSelectOne = (taskId: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  };

  const handleBulkComplete = async () => {
    const ids = bulkList.filter(t => selectedIds.has(t.id)).map(t => t.id);
    if (ids.length === 0) return;
    try {
      await api.post('/tasks/bulk', { ids, action: 'complete' });
      toast.success(`Completed ${ids.length} tasks`);
      setSelectedIds(new Set());
      loadData();
    } catch (error) {
      toast.error('Failed to complete selected tasks');
    }
  };

  const handleBulkDelete = async () => {
    const ids = bulkList.filter(t => selectedIds.has(t.id)).map(t => t.id);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} tasks?`)) return;
    try {
      await api.post('/tasks/bulk', { ids, action: 'delete' });
      toast.success(`Deleted ${ids.length} tasks`);
      setSelectedIds(new Set());
      loadData();
    } catch (error) {
      toast.error('Failed to delete selected tasks');
    }
  };

  const [quickAddTask, setQuickAddTask] = useState('');
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddTask.trim()) return;
    handleCreateTask(quickAddTask);
    setQuickAddTask('');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20 px-4 py-8 md:px-8 space-y-8">
      <SEO title="My Planner" description="Manage your daily tasks and goals." />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Planner
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your daily tasks and goals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => { setEditingTask(null); resetForm(); setIsCreateOpen(true); }}
            className="rounded-lg shadow-sm bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Sidebar / Filters Area matching Contacts style widgets if needed, or simple filters */}
        <div className="space-y-6 lg:col-span-1">
          {/* Calendar Widget */}
          <Card className="border-none shadow-sm bg-background">
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border-0 w-full flex justify-center"
              />
            </CardContent>
          </Card>

          {/* Goals Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Daily Targets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><Phone className="h-3 w-3" /> Calls</span>
                  <span className="font-medium text-xs">{dailyGoals?.calls_completed || 0} / {dailyGoals?.calls_goal || 20}</span>
                </div>
                <Progress value={Math.min(100, ((dailyGoals?.calls_completed || 0) / (dailyGoals?.calls_goal || 1)) * 100)} className="h-1.5" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><Mail className="h-3 w-3" /> Emails</span>
                  <span className="font-medium text-xs">{dailyGoals?.emails_completed || 0} / {dailyGoals?.emails_goal || 30}</span>
                </div>
                <Progress value={Math.min(100, ((dailyGoals?.emails_completed || 0) / (dailyGoals?.emails_goal || 1)) * 100)} className="h-1.5" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Tasks</span>
                  <span className="font-medium text-xs">{dailyGoals?.tasks_completed || 0} / {dailyGoals?.tasks_goal || 10}</span>
                </div>
                <Progress value={Math.min(100, ((dailyGoals?.tasks_completed || 0) / (dailyGoals?.tasks_goal || 1)) * 100)} className="h-1.5" />
              </div>
            </CardContent>
          </Card>

          {/* Focus Mode Widget */}
          <Card className="border shadow-sm bg-gradient-to-br from-primary/5 via-background to-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Focus of the Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={focusTask}
                onChange={(e) => setFocusTask(e.target.value)}
                placeholder="What is your main goal today?"
                className="border-primary/20 bg-background/50 focus:bg-background"
              />
            </CardContent>
          </Card>

          {/* Quick Notes Widget */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Quick Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Jot down quick ideas..."
                className="min-h-[150px] resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Task List Area */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border shadow-sm bg-background">
            <CardHeader className="border-b px-6 py-4">
              <div className="mb-6">
                <form onSubmit={handleQuickAdd} className="flex gap-2">
                  <Input
                    value={quickAddTask}
                    onChange={(e) => setQuickAddTask(e.target.value)}
                    placeholder="Quick add a new task (Enter to save)..."
                    className="flex-1 shadow-inner bg-muted/40"
                  />
                  <Button type="submit" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full md:w-auto">
                  <TabsList className="grid w-full grid-cols-2 md:w-auto">
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex flex-1 md:justify-end gap-2">
                  <div className="relative w-full md:w-[250px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>

                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[130px] h-9">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="call">Calls</SelectItem>
                      <SelectItem value="email">Emails</SelectItem>
                      <SelectItem value="meeting">Meetings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Bulk Actions */}
              {selectedCountInTab > 0 && (
                <div className="flex items-center gap-2 mt-4 p-2 bg-muted/50 rounded-md animate-in fade-in">
                  <span className="text-sm text-muted-foreground pl-2">{selectedCountInTab} selected</span>
                  <div className="flex-1" />
                  <Button size="sm" variant="secondary" onClick={handleBulkComplete}>
                    Mark Done
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                    Delete
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {loading ? (
                  <div className="p-12 flex justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : bulkList.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="bg-muted/30 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground">No tasks found.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {bulkList.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "group flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors",
                          task.status === 'completed' && "opacity-60 bg-muted/10"
                        )}
                      >
                        <Checkbox
                          checked={selectedIds.has(task.id)}
                          onCheckedChange={(v) => toggleSelectOne(task.id, Boolean(v))}
                        />

                        <div className={cn(
                          "h-9 w-9 rounded-full flex items-center justify-center border shrink-0",
                          task.task_type === 'call' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                            task.task_type === 'email' ? 'bg-green-50 border-green-100 text-green-600' :
                              task.task_type === 'meeting' ? 'bg-purple-50 border-purple-100 text-purple-600' :
                                'bg-gray-50 border-gray-100 text-gray-600'
                        )}>
                          {getTaskTypeIcon(task.task_type)}
                        </div>

                        <div className="flex-1 min-w-0 grid gap-1">
                          <div className="flex items-center gap-2">
                            <span className={cn("font-medium text-sm", task.status === 'completed' && "line-through")}>
                              {task.title}
                            </span>
                            {task.priority === 'urgent' && <Badge variant="destructive" className="h-5 px-1.5 text-[12px]">Urgent</Badge>}
                            {task.priority === 'high' && <Badge variant="secondary" className="h-5 px-1.5 text-[12px] bg-amber-100 text-amber-700">High</Badge>}

                            {/* Source Badge */}
                            {task.source === 'project' && (
                              <Badge variant="outline" className="h-5 px-1.5 text-[10px] gap-1 cursor-pointer hover:bg-muted" onClick={() => handleOpenSource(task)}>
                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                {task.source_title || 'Project'}
                              </Badge>
                            )}
                            {task.source === 'crm' && (
                              <Badge variant="outline" className="h-5 px-1.5 text-[10px] gap-1 cursor-pointer hover:bg-muted" onClick={() => handleOpenSource(task)}>
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                {task.source_title || 'CRM'}
                              </Badge>
                            )}

                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {task.contact_name && (
                              <div className="flex items-center gap-1 hover:text-primary cursor-pointer" onClick={() => handleOpenContact(task)}>
                                <Users className="h-3 w-3" />
                                {task.contact_name}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {task.due_time || 'All Day'}
                            </div>
                            {task.source === 'project' && (
                              <div className="flex items-center gap-1 text-indigo-600/80">
                                <ExternalLink className="h-3 w-3" />
                                Linked to Project
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          {task.status !== 'completed' && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 rounded-full hover:bg-emerald-50" onClick={() => handleCompleteTask(task.id)}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditTask(task)}>
                                <Pencil className="h-4 w-4 mr-2" />Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteTask(task.id)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
            <DialogDescription>{editingTask ? 'Update task details below.' : 'Add a new action item to your planner.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Follow up with Client X"
                className="font-medium h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.task_type} onValueChange={(v) => setFormData({ ...formData, task_type: v as any })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v as any })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>Due Time</Label>
                <Input
                  type="time"
                  value={formData.due_time}
                  onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add details..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Link Contact (CRM)</Label>
                <Select value={formData.contact_id} onValueChange={(v) => setFormData({ ...formData, contact_id: v, source: v !== 'none' ? 'crm' : 'planner' })}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Search contacts..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No contact</SelectItem>
                    {contacts.map((c: any) => {
                      const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.name || c.email || `Contact #${c.id}`;
                      return (
                        <SelectItem key={c.id} value={String(c.id)}>{name}</SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Link Project</Label>
                <Select value={formData.source === 'project' ? String(formData.source_id) : 'none'} onValueChange={(v) => {
                  if (v === 'none') {
                    setFormData({ ...formData, source: 'planner', source_id: '', source_title: '' });
                  } else {
                    const proj = projects.find((p: any) => String(p.id) === v);
                    const title = proj ? (proj.title || proj.name) : (v === '101' ? 'Website Redesign (Demo)' : 'Mobile App (Demo)');
                    setFormData({ ...formData, source: 'project', source_id: v, source_title: title });
                  }
                }}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select project..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.title || p.name || `Project #${p.id}`}</SelectItem>
                    ))}
                    {/* Mock Projects if empty for demo */}
                    {projects.length === 0 && (
                      <>
                        <SelectItem value="101">Website Redesign (Demo)</SelectItem>
                        <SelectItem value="102">Mobile App (Demo)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setEditingTask(null); }}>Cancel</Button>
            <Button onClick={() => handleCreateTask()} className="bg-primary hover:bg-primary/90">{editingTask ? 'Save Changes' : 'Add to Planner'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

