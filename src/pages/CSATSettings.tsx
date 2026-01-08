import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Star, Plus, Edit, Trash2, MoreHorizontal, Send, TrendingUp } from 'lucide-react';

interface CSATSurvey {
  id: number;
  workspace_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_event: 'ticket_closed' | 'ticket_resolved' | 'manual';
  delay_minutes: number;
  email_subject: string;
  email_body: string;
  survey_question: string;
  rating_scale: '1-5' | '1-10' | 'thumbs' | 'emoji';
  ask_comment: boolean;
  comment_required: boolean;
  created_at: string;
  updated_at: string;
}

const CSATSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<CSATSurvey | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    trigger_event: 'ticket_resolved' as 'ticket_resolved' | 'ticket_closed' | 'manual',
    delay_minutes: 60,
    email_subject: 'How was your support experience?',
    email_body: 'Hi {{firstName}},\n\nYour ticket {{ticketNumber}} was recently resolved. We would love to hear about your experience.',
    survey_question: 'How satisfied were you with the support you received?',
    rating_scale: '1-5' as '1-5' | '1-10' | 'thumbs' | 'emoji',
    ask_comment: true,
    comment_required: false,
  });

  const { data: surveys, isLoading } = useQuery<CSATSurvey[]>({
    queryKey: ['csat-surveys'],
    queryFn: async () => {
      const response = await api.get('/api/helpdesk/csat-surveys');
      return response.data as CSATSurvey[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/api/helpdesk/csat-surveys', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csat-surveys'] });
      toast({ title: 'CSAT survey created' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create survey', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await api.put(`/api/helpdesk/csat-surveys/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csat-surveys'] });
      toast({ title: 'CSAT survey updated' });
      setIsDialogOpen(false);
      setEditingSurvey(null);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update survey', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/helpdesk/csat-surveys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csat-surveys'] });
      toast({ title: 'CSAT survey deleted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete survey', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true,
      trigger_event: 'ticket_resolved',
      delay_minutes: 60,
      email_subject: 'How was your support experience?',
      email_body: 'Hi {{firstName}},\n\nYour ticket {{ticketNumber}} was recently resolved. We would love to hear about your experience.',
      survey_question: 'How satisfied were you with the support you received?',
      rating_scale: '1-5',
      ask_comment: true,
      comment_required: false,
    });
  };

  const handleEdit = (survey: CSATSurvey) => {
    setEditingSurvey(survey);
    setFormData({
      name: survey.name,
      description: survey.description || '',
      is_active: survey.is_active,
      trigger_event: survey.trigger_event,
      delay_minutes: survey.delay_minutes,
      email_subject: survey.email_subject,
      email_body: survey.email_body,
      survey_question: survey.survey_question,
      rating_scale: survey.rating_scale,
      ask_comment: survey.ask_comment,
      comment_required: survey.comment_required,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }

    if (editingSurvey) {
      updateMutation.mutate({ id: editingSurvey.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this survey?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Helpdesk', href: '/helpdesk' },
          { label: 'CSAT Automation' },
        ]}
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">CSAT Automation</h1>
            <p className="text-muted-foreground mt-1">
              Automatically send customer satisfaction surveys after ticket resolution
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingSurvey(null); }} className="gap-2">
                <Plus className="w-4 h-4" />
                New Survey
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSurvey ? 'Edit' : 'Create'} CSAT Survey</DialogTitle>
                <DialogDescription>
                  Configure automated customer satisfaction surveys
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Survey Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Post-Resolution Survey"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="trigger">Trigger Event</Label>
                    <Select
                      value={formData.trigger_event}
                      onValueChange={(v: any) => setFormData({ ...formData, trigger_event: v })}
                    >
                      <SelectTrigger id="trigger">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ticket_resolved">Ticket Resolved</SelectItem>
                        <SelectItem value="ticket_closed">Ticket Closed</SelectItem>
                        <SelectItem value="manual">Manual Send</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="delay">Delay (minutes)</Label>
                    <Input
                      id="delay"
                      type="number"
                      value={formData.delay_minutes}
                      onChange={(e) => setFormData({ ...formData, delay_minutes: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">Wait time before sending survey</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="scale">Rating Scale</Label>
                    <Select
                      value={formData.rating_scale}
                      onValueChange={(v: any) => setFormData({ ...formData, rating_scale: v })}
                    >
                      <SelectTrigger id="scale">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-5">1 to 5 Stars</SelectItem>
                        <SelectItem value="1-10">1 to 10 Scale</SelectItem>
                        <SelectItem value="thumbs">Thumbs Up/Down</SelectItem>
                        <SelectItem value="emoji">Emoji Reactions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.email_subject}
                    onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="body">Email Body *</Label>
                  <Textarea
                    id="body"
                    value={formData.email_body}
                    onChange={(e) => setFormData({ ...formData, email_body: e.target.value })}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use variables: {'{{firstName}}, {{ticketNumber}}, {{company}}'}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="question">Survey Question *</Label>
                  <Input
                    id="question"
                    value={formData.survey_question}
                    onChange={(e) => setFormData({ ...formData, survey_question: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ask_comment"
                      checked={formData.ask_comment}
                      onCheckedChange={(checked) => setFormData({ ...formData, ask_comment: checked })}
                    />
                    <Label htmlFor="ask_comment">Ask for comment</Label>
                  </div>

                  {formData.ask_comment && (
                    <div className="flex items-center space-x-2 ml-6">
                      <Switch
                        id="comment_required"
                        checked={formData.comment_required}
                        onCheckedChange={(checked) => setFormData({ ...formData, comment_required: checked })}
                      />
                      <Label htmlFor="comment_required">Comment required</Label>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading surveys...</div>
            ) : surveys && surveys.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No CSAT surveys configured</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Survey
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Delay</TableHead>
                    <TableHead>Rating Scale</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveys?.map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{survey.name}</div>
                          {survey.description && (
                            <div className="text-xs text-muted-foreground">{survey.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {survey.is_active ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <Send className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">
                        {survey.trigger_event.replace('_', ' ')}
                      </TableCell>
                      <TableCell>{survey.delay_minutes} min</TableCell>
                      <TableCell className="uppercase">{survey.rating_scale}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(survey)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(survey.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CSATSettings;
