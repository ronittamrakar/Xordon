import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar as CalendarIcon,
  User,
  CheckCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CRMTask {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'pending' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  contact_name?: string;
  contact_id?: string;
}

const CRMTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await api.crm.getTasks();
      if (response && response.tasks) {
        const mappedTasks = response.tasks.map((task: any) => ({
          id: String(task.id),
          title: task.title,
          description: task.description || '',
          due_date: task.due_date || new Date().toISOString(),
          status: (task.status as any) || 'pending',
          priority: (task.priority as any) || 'medium',
          contact_name: task.contact_name,
          contact_id: String(task.contact_id)
        }));
        setTasks(mappedTasks);
      }
    } catch (error) {
      console.error('Failed to load CRM tasks:', error);
      // Fallback/Mock data if API fails or is empty
      setTasks([
        { id: '1', title: 'Follow up with John Doe', description: 'Review proposal details', due_date: new Date().toISOString(), status: 'pending', priority: 'high', contact_name: 'John Doe' },
        { id: '2', title: 'Send contract to Acme Corp', description: 'Draft final agreement', due_date: new Date(Date.now() + 86400000).toISOString(), status: 'pending', priority: 'medium', contact_name: 'Acme Corp' },
        { id: '3', title: 'Update lead status for Sarah', description: 'Move to qualified', due_date: new Date(Date.now() - 86400000).toISOString(), status: 'overdue', priority: 'high', contact_name: 'Sarah Smith' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'medium': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sales Tasks</h1>
          <p className="text-muted-foreground text-lg">Track and manage your daily sales activities and follow-ups.</p>
        </div>
        <Button size="lg" className="shadow-lg shadow-blue-500/20">
          <Plus className="h-5 w-5 mr-2" />
          Create Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-50/50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter(t => t.status !== 'completed').length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50/50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Due Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'pending').length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50/50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{tasks.filter(t => t.status === 'overdue').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Task List</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white dark:bg-slate-950"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableHead className="w-[400px]">Task Details</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No tasks found. Create one to get started!
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{task.title}</span>
                        <span className="text-sm text-muted-foreground line-clamp-1">{task.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{task.contact_name || 'No Contact'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`capitalize font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 capitalize text-sm font-medium">
                        {getStatusIcon(task.status)}
                        {task.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CRMTasksPage;
