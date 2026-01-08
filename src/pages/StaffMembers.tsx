import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { api } from '@/lib/api';

import { Plus, Search, User, Phone, Mail, Edit, Trash2, RefreshCw, Calendar, Briefcase } from 'lucide-react';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'technician', label: 'Technician' },
  { value: 'staff', label: 'Staff' },
  { value: 'contractor', label: 'Contractor' },
];

export default function StaffMembers() {
  const [staff, setStaff] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    title: '',
    bio: '',
    skills: [] as string[],
    service_ids: [] as string[],
    color: '#3B82F6',
    is_active: true,
  });

  useEffect(() => { loadData(); }, [roleFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (roleFilter !== 'all') params.role = roleFilter;

      const [staffRes, servicesRes] = await Promise.all([
        api.get('/operations/staff', { params }),
        api.get('/operations/services'),
      ]);
      setStaff((staffRes.data as any)?.items || []);
      setServices((servicesRes.data as any)?.items || []);
    } catch (error) {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const saveStaff = async () => {
    try {
      if (editingStaff) {
        await api.put(`/operations/staff/${editingStaff.id}`, formData);
        toast.success('Staff member updated');
      } else {
        await api.post('/operations/staff', formData);
        toast.success('Staff member added');
      }
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Failed to save staff member');
    }
  };

  const deleteStaff = async (id: number) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await api.delete(`/operations/staff/${id}`);
      toast.success('Staff member removed');
      loadData();
    } catch (error) {
      toast.error('Failed to remove staff member');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'staff',
      title: '',
      bio: '',
      skills: [],
      service_ids: [],
      color: '#3B82F6',
      is_active: true,
    });
    setEditingStaff(null);
  };

  const openEdit = (member: any) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'staff',
      title: member.title || '',
      bio: member.bio || '',
      skills: member.skills || [],
      service_ids: member.service_ids || [],
      color: member.color || '#3B82F6',
      is_active: member.is_active !== false,
    });
    setIsDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredStaff = staff.filter(s => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return s.name?.toLowerCase().includes(search) || s.email?.toLowerCase().includes(search);
    }
    return true;
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Staff Members</h1>
            <p className="text-muted-foreground">Manage your team members and technicians</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Staff</Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search staff..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map(member => (
            <Card key={member.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16" style={{ backgroundColor: member.color || '#3B82F6' }}>
                    <AvatarImage src={member.photo_url} />
                    <AvatarFallback className="text-white text-lg">{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{member.name}</h3>
                      <Badge variant={member.is_active ? 'default' : 'secondary'}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.title || ROLES.find(r => r.value === member.role)?.label}</p>
                    {member.email && (
                      <p className="text-sm flex items-center gap-1 mt-1"><Mail className="h-3 w-3" />{member.email}</p>
                    )}
                    {member.phone && (
                      <p className="text-sm flex items-center gap-1"><Phone className="h-3 w-3" />{member.phone}</p>
                    )}
                    {member.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {member.skills.slice(0, 3).map((skill: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                        ))}
                        {member.skills.length > 3 && <Badge variant="outline" className="text-xs">+{member.skills.length - 3}</Badge>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(member)}>
                    <Edit className="h-4 w-4 mr-1" />Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteStaff(member.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredStaff.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No staff members found</p>
                <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Add Your First Staff Member
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Senior Technician" />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Brief description..." rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="h-10" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={formData.is_active} onCheckedChange={v => setFormData({ ...formData, is_active: v })} />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveStaff} disabled={!formData.name}>{editingStaff ? 'Update' : 'Add'} Staff</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
