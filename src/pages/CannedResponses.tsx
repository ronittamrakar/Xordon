import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useToast } from '@/hooks/use-toast';
import ticketsApi, { CannedResponse } from '@/services/ticketsApi';
import {
  MessageCircle,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Tag,
  Users,
  Globe,
  Copy,
  Save,
  X
} from 'lucide-react';

const CannedResponses: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    shortcut: '',
    subject: '',
    body: '',
    category: '',
    is_shared: false
  });

  // Fetch canned responses
  const { data: responses, isLoading } = useQuery({
    queryKey: ['canned-responses'],
    queryFn: () => ticketsApi.listCannedResponses(),
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (editingResponse) {
        return ticketsApi.updateCannedResponse(editingResponse.id, data);
      } else {
        return ticketsApi.createCannedResponse(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canned-responses'] });
      toast({
        title: editingResponse ? 'Response updated' : 'Response created',
        description: `Canned response ${editingResponse ? 'updated' : 'created'} successfully`
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: `Failed to ${editingResponse ? 'update' : 'create'} canned response`,
        variant: 'destructive'
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => ticketsApi.deleteCannedResponse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canned-responses'] });
      toast({ title: 'Response deleted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete response', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      shortcut: '',
      subject: '',
      body: '',
      category: '',
      is_shared: false
    });
    setEditingResponse(null);
  };

  const handleEdit = (response: CannedResponse) => {
    setEditingResponse(response);
    setFormData({
      name: response.name,
      shortcut: response.shortcut || '',
      subject: response.subject || '',
      body: response.body,
      category: response.category || '',
      is_shared: response.is_shared
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.body.trim()) {
      toast({ title: 'Error', description: 'Name and body are required', variant: 'destructive' });
      return;
    }
    mutation.mutate(formData);
  };

  const filteredResponses = responses?.filter(response => {
    const matchesSearch = response.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || response.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  const categories = Array.from(new Set(responses?.map(r => r.category).filter(Boolean) || []));

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Helpdesk', href: '/helpdesk' },
          { label: 'Canned Responses' },
        ]}
      />

      <div className="mx-auto max-w-7xl py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Canned Responses</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage quick response templates for faster customer support
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Response
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search responses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Responses Grid */}
        {isLoading ? (
          <div className="text-center py-12">Loading responses...</div>
        ) : filteredResponses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No canned responses found. Create your first response to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResponses.map((response) => (
              <Card key={response.id} className="hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{response.name}</CardTitle>
                      {response.shortcut && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          <Globe className="w-3 h-3 mr-1" />
                          {response.shortcut}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(response)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(response.id)}
                        className="h-8 w-8 p-0 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {response.category && (
                    <Badge variant="secondary" className="mt-2">
                      <Tag className="w-3 h-3 mr-1" />
                      {response.category}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  {response.subject && (
                    <div className="mb-3">
                      <Label className="text-xs text-muted-foreground">Subject</Label>
                      <p className="text-sm mt-1">{response.subject}</p>
                    </div>
                  )}
                  <div className="mb-3">
                    <Label className="text-xs text-muted-foreground">Response</Label>
                    <p className="text-sm mt-1 line-clamp-4">{response.body}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{response.is_shared ? 'Shared' : 'Private'}</span>
                    <span>Created by {response.creator_name || 'System'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Best Practices</CardTitle>
            <CardDescription>
              Tips for creating effective canned responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Keep it Personal</h4>
                <p className="text-sm text-muted-foreground">
                  Use placeholders and personalize responses to make customers feel heard
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Categorize Wisely</h4>
                <p className="text-sm text-muted-foreground">
                  Group responses by common issues like billing, technical, or general inquiries
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Update Regularly</h4>
                <p className="text-sm text-muted-foreground">
                  Review and update responses to ensure accuracy and relevance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingResponse ? 'Edit Response' : 'Create New Response'}</DialogTitle>
            <DialogDescription>
              {editingResponse ? 'Update your canned response template' : 'Create a new response template for quick replies'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Response Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Thank you for your inquiry"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortcut">Shortcut</Label>
                <Input
                  id="shortcut"
                  value={formData.shortcut}
                  onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                  placeholder="e.g., /thankyou"
                />
                <p className="text-xs text-muted-foreground">
                  Type this in any ticket to insert this response
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Optional email subject line"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Response Body *</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Your response text here..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Use {`{customer_name}`}, {`{ticket_number}`}, etc. for personalization
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Billing, Technical"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_shared"
                  checked={formData.is_shared}
                  onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_shared">Share with team</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={mutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? 'Saving...' : 'Save Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CannedResponses;