import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { api } from '@/lib/api';

import {
  Plus, Search, Users, Gift, DollarSign, TrendingUp,
  CheckCircle, Clock, XCircle, Edit, Trash2, RefreshCw, Share2
} from 'lucide-react';
import { ReferralProgram, Referral, ReferralStatus } from '@/types/industry';

const STATUS_OPTIONS: { value: ReferralStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-800' },
  { value: 'converted', label: 'Converted', color: 'bg-green-100 text-green-800' },
  { value: 'rewarded', label: 'Rewarded', color: 'bg-purple-100 text-purple-800' },
  { value: 'expired', label: 'Expired', color: 'bg-orange-100 text-orange-800' },
  { value: 'invalid', label: 'Invalid', color: 'bg-red-100 text-red-800' },
];

const REWARD_TYPES = [
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'credit', label: 'Account Credit' },
  { value: 'gift', label: 'Gift/Prize' },
];

export default function Referrals() {
  const [programs, setPrograms] = useState<ReferralProgram[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('referrals');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ReferralProgram | null>(null);

  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    referrer_reward_type: 'fixed' as const,
    referrer_reward_amount: 25,
    referee_reward_type: 'fixed' as const,
    referee_reward_amount: 25,
    terms: '',
    is_active: true,
  });

  const [referralForm, setReferralForm] = useState({
    program_id: '',
    referrer_contact_id: '',
    referee_name: '',
    referee_email: '',
    referee_phone: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [statusFilter, programFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      const referralParams: any = {};
      if (statusFilter !== 'all') referralParams.status = statusFilter;
      if (programFilter !== 'all') referralParams.program_id = programFilter;

      const [programsRes, referralsRes, contactsRes] = await Promise.all([
        api.get('/operations/referral-programs'),
        api.get('/operations/referrals', { params: referralParams }),
        api.get('/contacts'),
      ]);

      setPrograms((programsRes.data as any)?.items || []);
      setReferrals((referralsRes.data as any)?.items || []);
      setContacts((contactsRes.data as any)?.items || (contactsRes.data as any)?.contacts || []);
    } catch (error) {
      console.error('Failed to load referrals:', error);
      toast.error('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const saveProgram = async () => {
    try {
      if (editingProgram) {
        await api.put(`/operations/referral-programs/${editingProgram.id}`, programForm);
        toast.success('Program updated successfully');
      } else {
        await api.post('/operations/referral-programs', programForm);
        toast.success('Program created successfully');
      }
      setIsProgramDialogOpen(false);
      resetProgramForm();
      loadData();
    } catch (error) {
      console.error('Failed to save program:', error);
      toast.error('Failed to save program');
    }
  };

  const deleteProgram = async (id: number) => {
    if (!confirm('Are you sure you want to delete this program?')) return;

    try {
      await api.delete(`/operations/referral-programs/${id}`);
      toast.success('Program deleted');
      loadData();
    } catch (error) {
      console.error('Failed to delete program:', error);
      toast.error('Failed to delete program');
    }
  };

  const createReferral = async () => {
    try {
      await api.post('/operations/referrals', referralForm);
      toast.success('Referral created successfully');
      setIsReferralDialogOpen(false);
      resetReferralForm();
      loadData();
    } catch (error) {
      console.error('Failed to create referral:', error);
      toast.error('Failed to create referral');
    }
  };

  const updateReferralStatus = async (id: number, status: ReferralStatus) => {
    try {
      const updates: any = { status };
      if (status === 'converted') updates.conversion_date = new Date().toISOString();

      await api.put(`/operations/referrals/${id}`, updates);
      toast.success(`Referral marked as ${status}`);
      loadData();
    } catch (error) {
      console.error('Failed to update referral:', error);
      toast.error('Failed to update referral');
    }
  };

  const resetProgramForm = () => {
    setProgramForm({
      name: '',
      description: '',
      referrer_reward_type: 'fixed',
      referrer_reward_amount: 25,
      referee_reward_type: 'fixed',
      referee_reward_amount: 25,
      terms: '',
      is_active: true,
    });
    setEditingProgram(null);
  };

  const resetReferralForm = () => {
    setReferralForm({
      program_id: '',
      referrer_contact_id: '',
      referee_name: '',
      referee_email: '',
      referee_phone: '',
      notes: '',
    });
  };

  const openEditProgram = (program: ReferralProgram) => {
    setEditingProgram(program);
    setProgramForm({
      name: program.name,
      description: program.description || '',
      referrer_reward_type: program.referrerRewardType,
      referrer_reward_amount: program.referrerRewardAmount,
      referee_reward_type: program.refereeRewardType,
      referee_reward_amount: program.refereeRewardAmount,
      terms: program.terms || '',
      is_active: program.isActive,
    });
    setIsProgramDialogOpen(true);
  };

  const getStatusBadge = (status: ReferralStatus) => {
    const config = STATUS_OPTIONS.find(s => s.value === status);
    return <Badge className={config?.color}>{config?.label}</Badge>;
  };

  const formatReward = (type: string, amount: number) => {
    switch (type) {
      case 'fixed':
        return `$${amount}`;
      case 'percentage':
        return `${amount}%`;
      case 'credit':
        return `$${amount} credit`;
      case 'gift':
        return 'Gift';
      default:
        return `$${amount}`;
    }
  };

  const stats = {
    totalReferrals: referrals.length,
    pending: referrals.filter(r => r.status === 'pending').length,
    converted: referrals.filter(r => r.status === 'converted').length,
    totalValue: referrals.filter(r => r.status === 'converted').reduce((sum, r) => sum + (r.conversionValue || 0), 0),
    conversionRate: referrals.length > 0
      ? Math.round((referrals.filter(r => r.status === 'converted').length / referrals.length) * 100)
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Referral Program</h1>
          <p className="text-muted-foreground">Manage referral programs and track referrals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => {
            resetProgramForm();
            setIsProgramDialogOpen(true);
          }}>
            <Gift className="h-4 w-4 mr-2" />
            New Program
          </Button>
          <Button onClick={() => setIsReferralDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Referral
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">Total Referrals</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalReferrals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Converted</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.converted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.conversionRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Revenue from Referrals</span>
            </div>
            <p className="text-2xl font-bold mt-1">${stats.totalValue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
        </TabsList>

        <TabsContent value="referrals" className="mt-4 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {STATUS_OPTIONS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={programFilter} onValueChange={setProgramFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Referrals Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Referee</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map(referral => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {referral.referrerContact?.firstName} {referral.referrerContact?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{referral.referrerContact?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{referral.refereeName || '-'}</p>
                          <p className="text-sm text-muted-foreground">{referral.refereeEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{referral.program?.name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(referral.status)}</TableCell>
                      <TableCell>
                        {referral.conversionValue ? `$${referral.conversionValue.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {referral.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateReferralStatus(referral.id, 'contacted')}
                              title="Mark Contacted"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          )}
                          {referral.status === 'contacted' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateReferralStatus(referral.id, 'converted')}
                              title="Mark Converted"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {referral.status === 'converted' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateReferralStatus(referral.id, 'rewarded')}
                              title="Mark Rewarded"
                            >
                              <Gift className="h-4 w-4 text-purple-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {referrals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No referrals found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programs" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map(program => (
              <Card key={program.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      <CardDescription>{program.description}</CardDescription>
                    </div>
                    <Badge variant={program.isActive ? 'default' : 'secondary'}>
                      {program.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Referrer Gets:</span>
                      <span className="font-medium">
                        {formatReward(program.referrerRewardType, program.referrerRewardAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Referee Gets:</span>
                      <span className="font-medium">
                        {formatReward(program.refereeRewardType, program.refereeRewardAmount)}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => openEditProgram(program)}>
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteProgram(program.id)}>
                        <Trash2 className="h-4 w-4 mr-1 text-red-500" /> Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {programs.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No referral programs yet</p>
                  <Button className="mt-4" onClick={() => setIsProgramDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Create Your First Program
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Program Dialog */}
      <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProgram ? 'Edit Program' : 'Create Referral Program'}</DialogTitle>
            <DialogDescription>
              Set up rewards for both the referrer and the new customer
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Program Name *</Label>
              <Input
                value={programForm.name}
                onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                placeholder="e.g., Refer a Friend"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={programForm.description}
                onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                placeholder="Describe the referral program..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Referrer Reward Type</Label>
                <Select
                  value={programForm.referrer_reward_type}
                  onValueChange={(v: any) => setProgramForm({ ...programForm, referrer_reward_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REWARD_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Referrer Amount</Label>
                <Input
                  type="number"
                  value={programForm.referrer_reward_amount}
                  onChange={(e) => setProgramForm({ ...programForm, referrer_reward_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Referee Reward Type</Label>
                <Select
                  value={programForm.referee_reward_type}
                  onValueChange={(v: any) => setProgramForm({ ...programForm, referee_reward_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REWARD_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Referee Amount</Label>
                <Input
                  type="number"
                  value={programForm.referee_reward_amount}
                  onChange={(e) => setProgramForm({ ...programForm, referee_reward_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea
                value={programForm.terms}
                onChange={(e) => setProgramForm({ ...programForm, terms: e.target.value })}
                placeholder="Program terms and conditions..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={programForm.is_active}
                onCheckedChange={(checked) => setProgramForm({ ...programForm, is_active: checked })}
              />
              <Label>Program is active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProgramDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveProgram} disabled={!programForm.name}>
              {editingProgram ? 'Update Program' : 'Create Program'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Referral Dialog */}
      <Dialog open={isReferralDialogOpen} onOpenChange={setIsReferralDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Referral</DialogTitle>
            <DialogDescription>
              Record a new referral from an existing customer
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Referral Program</Label>
              <Select
                value={referralForm.program_id}
                onValueChange={(v) => setReferralForm({ ...referralForm, program_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.filter(p => p.isActive).map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Referrer (Existing Customer) *</Label>
              <Select
                value={referralForm.referrer_contact_id}
                onValueChange={(v) => setReferralForm({ ...referralForm, referrer_contact_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.firstName || c.first_name} {c.lastName || c.last_name} - {c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Referee Name</Label>
              <Input
                value={referralForm.referee_name}
                onChange={(e) => setReferralForm({ ...referralForm, referee_name: e.target.value })}
                placeholder="Name of the person being referred"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Referee Email</Label>
                <Input
                  type="email"
                  value={referralForm.referee_email}
                  onChange={(e) => setReferralForm({ ...referralForm, referee_email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Referee Phone</Label>
                <Input
                  value={referralForm.referee_phone}
                  onChange={(e) => setReferralForm({ ...referralForm, referee_phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={referralForm.notes}
                onChange={(e) => setReferralForm({ ...referralForm, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReferralDialogOpen(false)}>Cancel</Button>
            <Button onClick={createReferral} disabled={!referralForm.referrer_contact_id}>
              Add Referral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
