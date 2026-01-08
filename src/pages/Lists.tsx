import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ContactList, LIST_COLORS, LIST_ICONS } from '@/types/list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  List,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  Star,
  Loader2,
  CheckCircle,
  UserCheck,
  Heart,
  Bookmark,
  Folder,
  Inbox,
  Mail,
  Phone,
  Briefcase,
  Target,
  Flag,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users,
  'user-check': UserCheck,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  folder: Folder,
  inbox: Inbox,
  mail: Mail,
  phone: Phone,
  briefcase: Briefcase,
  target: Target,
  flag: Flag,
};

const defaultListForm: Partial<ContactList> = {
  name: '',
  description: '',
  color: '#3b82f6',
  icon: 'users',
  isDefault: false,
};

export default function Lists() {
  console.log('Lists page rendering');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<ContactList | null>(null);
  const [listForm, setListForm] = useState<Partial<ContactList>>(defaultListForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewingListId, setViewingListId] = useState<string | null>(null);

  // Fetch lists
  const { data, isLoading, error } = useQuery({
    queryKey: ['lists', search],
    queryFn: () => api.getLists(search || undefined),
  });

  const lists = data?.lists || [];

  // Fetch contacts for a specific list
  const { data: listContactsData, isLoading: isLoadingContacts } = useQuery({
    queryKey: ['list-contacts', viewingListId],
    queryFn: () => viewingListId ? api.getListContacts(viewingListId) : null,
    enabled: !!viewingListId,
  });

  // Create list mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<ContactList>) => api.createList(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast({ title: 'List created successfully' });
      closeDialog();
    },
    onError: () => {
      toast({ title: 'Failed to create list', variant: 'destructive' });
    },
  });

  // Update list mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContactList> }) => api.updateList(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast({ title: 'List updated successfully' });
      closeDialog();
    },
    onError: () => {
      toast({ title: 'Failed to update list', variant: 'destructive' });
    },
  });

  // Delete list mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast({ title: 'List deleted successfully' });
      setDeleteConfirmId(null);
    },
    onError: (error: Error) => {
      toast({ title: error.message || 'Failed to delete list', variant: 'destructive' });
    },
  });

  const openCreateDialog = () => {
    setEditingList(null);
    setListForm(defaultListForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (list: ContactList) => {
    setEditingList(list);
    setListForm({
      name: list.name,
      description: list.description || '',
      color: list.color,
      icon: list.icon,
      isDefault: list.isDefault,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingList(null);
    setListForm(defaultListForm);
  };

  const handleSubmit = () => {
    if (!listForm.name?.trim()) {
      toast({ title: 'List name is required', variant: 'destructive' });
      return;
    }

    if (editingList) {
      updateMutation.mutate({ id: editingList.id, data: listForm });
    } else {
      createMutation.mutate(listForm);
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName] || Users;
    return IconComponent;
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load lists. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lists</h1>
            <p className="text-muted-foreground">
              Organize your contacts into static groups
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create List
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search lists..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lists Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : lists.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <List className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No lists found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? 'Try a different search term' : 'Create your first list to organize contacts'}
              </p>
              {!search && (
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create List
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => {
              const IconComponent = getIconComponent(list.icon);
              return (
                <Card
                  key={list.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setViewingListId(list.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${list.color}20` }}
                        >
                          <IconComponent
                            className="h-5 w-5"
                            style={{ color: list.color }}
                          />
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {list.name}
                            {list.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </CardTitle>
                          {list.description && (
                            <CardDescription className="text-sm mt-1">
                              {list.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(list); }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {!list.isDefault && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(list.id); }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{list.contactCount} contacts</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingList ? 'Edit List' : 'Create List'}
              </DialogTitle>
              <DialogDescription>
                {editingList
                  ? 'Update list details'
                  : 'Create a new list to organize your contacts'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">List Name *</Label>
                <Input
                  id="name"
                  value={listForm.name || ''}
                  onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
                  placeholder="e.g., VIP Customers"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={listForm.description || ''}
                  onChange={(e) => setListForm({ ...listForm, description: e.target.value })}
                  placeholder="Brief description of this list..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {LIST_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${listForm.color === color ? 'border-foreground scale-110' : 'border-transparent'
                          }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setListForm({ ...listForm, color })}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex flex-wrap gap-2">
                    {LIST_ICONS.map((iconName) => {
                      const IconComp = getIconComponent(iconName);
                      return (
                        <button
                          key={iconName}
                          type="button"
                          className={`p-2 rounded border transition-all ${listForm.icon === iconName
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                            }`}
                          onClick={() => setListForm({ ...listForm, icon: iconName })}
                        >
                          <IconComp className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingList ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View List Contacts Dialog */}
        <Dialog open={!!viewingListId} onOpenChange={() => setViewingListId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {lists.find(l => l.id === viewingListId)?.name || 'List'} Contacts
              </DialogTitle>
              <DialogDescription>
                Contacts in this list
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[400px] overflow-y-auto">
              {isLoadingContacts ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !listContactsData?.contacts?.length ? (
                <div className="text-center p-8 text-muted-foreground">
                  No contacts in this list yet
                </div>
              ) : (
                <div className="space-y-2">
                  {listContactsData.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </div>
                      {contact.company && (
                        <Badge variant="outline">{contact.company}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingListId(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete List</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this list? Contacts in this list will not be deleted,
                only removed from the list.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
