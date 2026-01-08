import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { api } from '@/lib/api';

import { Plus, Calendar, Clock, Bell, CheckCircle, AlertTriangle, Edit, Trash2, RefreshCw, Send, Filter } from 'lucide-react';

export default function Recalls() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [recalls, setRecalls] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recalls');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isRecallDialogOpen, setIsRecallDialogOpen] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({ name: '', description: '', interval_months: 6, is_active: true });
  const [recallForm, setRecallForm] = useState({ contact_id: '', recall_schedule_id: '', next_recall_date: '', notes: '' });

  useEffect(() => { loadData(); }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;

      const [schedulesRes, recallsRes, contactsRes] = await Promise.all([
        api.get('/operations/recall-schedules'),
        api.get('/operations/contact-recalls', { params }),
        api.get('/contacts'),
      ]);
      setSchedules((schedulesRes.data as any)?.items || []);
      setRecalls((recallsRes.data as any)?.items || []);
      setContacts((contactsRes.data as any)?.items || (contactsRes.data as any)?.contacts || []);
    } catch (error) {
      toast.error('Failed to load recalls');
    } finally {
      setLoading(false);
    }
  };

  const saveSchedule = async () => {
    try {
      await api.post('/operations/recall-schedules', scheduleForm);
      toast.success('Schedule created');
      setIsScheduleDialogOpen(false);
      setScheduleForm({ name: '', description: '', interval_months: 6, is_active: true });
      loadData();
    } catch { toast.error('Failed to save'); }
  };

  const createRecall = async () => {
    try {
      await api.post('/operations/contact-recalls', recallForm);
      toast.success('Recall created');
      setIsRecallDialogOpen(false);
      setRecallForm({ contact_id: '', recall_schedule_id: '', next_recall_date: '', notes: '' });
      loadData();
    } catch { toast.error('Failed to create'); }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/operations/contact-recalls/${id}`, { status, completed_at: status === 'completed' ? new Date().toISOString() : null });
      toast.success(`Marked as ${status}`);
      loadData();
    } catch { toast.error('Failed to update'); }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800', due: 'bg-orange-100 text-orange-800',
      overdue: 'bg-red-100 text-red-800', completed: 'bg-green-100 text-green-800',
    };
    return <Badge className={colors[status] || 'bg-gray-100'}>{status}</Badge>;
  };

  const stats = {
    total: recalls.length,
    due: recalls.filter(r => r.status === 'due').length,
    overdue: recalls.filter(r => r.status === 'overdue').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recalls & Follow-ups</h1>
          <p className="text-muted-foreground">Schedule customer follow-up reminders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button variant="outline" onClick={() => setIsScheduleDialogOpen(true)}><Calendar className="h-4 w-4 mr-2" />New Schedule</Button>
          <Button onClick={() => setIsRecallDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Recall</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><Bell className="h-5 w-5 text-blue-600" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="pt-4"><AlertTriangle className="h-5 w-5 text-orange-600" /><p className="text-2xl font-bold">{stats.due}</p><p className="text-sm text-muted-foreground">Due</p></CardContent></Card>
        <Card className={stats.overdue > 0 ? 'border-red-200' : ''}><CardContent className="pt-4"><AlertTriangle className="h-5 w-5 text-red-600" /><p className="text-2xl font-bold text-red-600">{stats.overdue}</p><p className="text-sm text-muted-foreground">Overdue</p></CardContent></Card>
        <Card><CardContent className="pt-4"><CheckCircle className="h-5 w-5 text-green-600" /><p className="text-2xl font-bold">{schedules.length}</p><p className="text-sm text-muted-foreground">Schedules</p></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList><TabsTrigger value="recalls">Recalls</TabsTrigger><TabsTrigger value="schedules">Schedules</TabsTrigger></TabsList>

        <TabsContent value="recalls" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] mb-4"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="due">Due</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Table>
                <TableHeader><TableRow><TableHead>Contact</TableHead><TableHead>Next Recall</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {recalls.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{r.contact_first_name} {r.contact_last_name}<br /><span className="text-sm text-muted-foreground">{r.contact_email}</span></TableCell>
                      <TableCell>{new Date(r.next_recall_date).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                      <TableCell>
                        {r.status !== 'completed' && (
                          <Button variant="ghost" size="sm" onClick={() => updateStatus(r.id, 'completed')}><CheckCircle className="h-4 w-4 text-green-600" /></Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schedules.map(s => (
              <Card key={s.id}>
                <CardHeader><CardTitle>{s.name}</CardTitle><CardDescription>{s.description}</CardDescription></CardHeader>
                <CardContent><p>Every {s.interval_months} months</p></CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Schedule</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveSchedule(); }}>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={scheduleForm.name} onChange={e => setScheduleForm({ ...scheduleForm, name: e.target.value })} autoFocus /></div>
              <div><Label>Interval (months)</Label><Input type="number" value={scheduleForm.interval_months} onChange={e => setScheduleForm({ ...scheduleForm, interval_months: parseInt(e.target.value) })} /></div>
            </div>
            <DialogFooter><Button type="submit">Create</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRecallDialogOpen} onOpenChange={setIsRecallDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Recall</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createRecall(); }}>
            <div className="space-y-4">
              <div><Label>Contact</Label>
                <Select value={recallForm.contact_id} onValueChange={v => setRecallForm({ ...recallForm, contact_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{contacts.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.firstName || c.first_name} {c.lastName || c.last_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Next Recall Date</Label><Input type="date" value={recallForm.next_recall_date} onChange={e => setRecallForm({ ...recallForm, next_recall_date: e.target.value })} /></div>
            </div>
            <DialogFooter><Button type="submit">Create</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>

  );
}
