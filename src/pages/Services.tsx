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
import { toast } from 'sonner';
import { api } from '@/lib/api';

import { Plus, Search, Package, Edit, Trash2, RefreshCw, DollarSign, Clock, Tag } from 'lucide-react';

export default function Services() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  const [serviceForm, setServiceForm] = useState({
    name: '', description: '', category_id: '', price: '', duration_minutes: 60, is_active: true
  });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  useEffect(() => { loadData(); }, [categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (categoryFilter !== 'all') params.category_id = categoryFilter;

      const [servicesRes, categoriesRes] = await Promise.all([
        api.get('/operations/services', { params }),
        api.get('/operations/service-categories'),
      ]);
      setServices((servicesRes.data as any)?.items || []);
      setCategories((categoriesRes.data as any)?.items || []);
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  };

  const saveService = async () => {
    try {
      const payload = { ...serviceForm, price: parseFloat(serviceForm.price) || 0, category_id: serviceForm.category_id || null };
      if (editingService) {
        await api.put(`/operations/services/${editingService.id}`, payload);
        toast.success('Service updated');
      } else {
        await api.post('/operations/services', payload);
        toast.success('Service created');
      }
      setIsServiceDialogOpen(false);
      resetServiceForm();
      loadData();
    } catch { toast.error('Failed to save'); }
  };

  const deleteService = async (id: number) => {
    if (!confirm('Delete this service?')) return;
    try { await api.delete(`/operations/services/${id}`); toast.success('Deleted'); loadData(); } catch { toast.error('Failed'); }
  };

  const saveCategory = async () => {
    try {
      await api.post('/operations/service-categories', categoryForm);
      toast.success('Category created');
      setIsCategoryDialogOpen(false);
      setCategoryForm({ name: '', description: '' });
      loadData();
    } catch { toast.error('Failed to save'); }
  };

  const resetServiceForm = () => {
    setServiceForm({ name: '', description: '', category_id: '', price: '', duration_minutes: 60, is_active: true });
    setEditingService(null);
  };

  const openEditService = (service: any) => {
    setEditingService(service);
    setServiceForm({
      name: service.name, description: service.description || '', category_id: service.category_id ? String(service.category_id) : '',
      price: service.price ? String(service.price) : '', duration_minutes: service.duration_minutes || 60, is_active: service.is_active !== false
    });
    setIsServiceDialogOpen(true);
  };

  const filteredServices = services.filter(s => !searchTerm || s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
  };

  return (

    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Services</h1><p className="text-muted-foreground">Manage your service offerings</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}><Tag className="h-4 w-4 mr-2" />Add Category</Button>
          <Button onClick={() => { resetServiceForm(); setIsServiceDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Service</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search services..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(service => (
          <Card key={service.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div><CardTitle className="text-lg">{service.name}</CardTitle>
                  {service.category_name && <Badge variant="outline" className="mt-1">{service.category_name}</Badge>}
                </div>
                <Badge variant={service.is_active ? 'default' : 'secondary'}>{service.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.description || 'No description'}</p>
              <div className="flex items-center gap-4 text-sm mb-3">
                <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />${parseFloat(service.price || 0).toFixed(2)}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatDuration(service.duration_minutes || 60)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditService(service)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                <Button variant="outline" size="sm" onClick={() => deleteService(service.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredServices.length === 0 && (
          <Card className="col-span-full"><CardContent className="py-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No services found</p>
            <Button className="mt-4" onClick={() => setIsServiceDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Service</Button>
          </CardContent></Card>
        )}
      </div>

      {/* Service Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveService(); }}>
            <div className="space-y-4">
              <div><Label>Name *</Label><Input value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} autoFocus /></div>
              <div><Label>Category</Label>
                <Select value={serviceForm.category_id} onValueChange={v => setServiceForm({ ...serviceForm, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Textarea value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Price ($)</Label><Input type="number" step="0.01" value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })} /></div>
                <div><Label>Duration (minutes)</Label><Input type="number" value={serviceForm.duration_minutes} onChange={e => setServiceForm({ ...serviceForm, duration_minutes: parseInt(e.target.value) || 60 })} /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={serviceForm.is_active} onCheckedChange={v => setServiceForm({ ...serviceForm, is_active: v })} /><Label>Active</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsServiceDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={!serviceForm.name}>{editingService ? 'Update' : 'Create'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveCategory(); }}>
            <div className="space-y-4">
              <div><Label>Name *</Label><Input value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} autoFocus /></div>
              <div><Label>Description</Label><Textarea value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} rows={2} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={!categoryForm.name}>Create</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>

  );
}
