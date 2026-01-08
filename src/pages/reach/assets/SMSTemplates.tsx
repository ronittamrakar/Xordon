import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { api, SMSTemplate } from '@/lib/api';
import {
  MessageSquare,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  FileTextIcon,
  Tag,
  Clock,
  CheckCircle,
  FolderPlus,
  Folder,
  Archive
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const SMSTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewGroupDialogOpen, setIsNewGroupDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [newGroupName, setNewGroupName] = useState('');

  const { toast } = useToast();

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    message: '',
    category: '',
    group: null as string | null,
  });

  const categories = [
    'Welcome',
    'Promotional',
    'Reminder',
    'Follow-up',
    'Notification',
    'Survey',
    'Other'
  ];

  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string } | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string>('');
  const [editCategoryName, setEditCategoryName] = useState('');



  useEffect(() => {
    loadTemplates();
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templatesData = await api.getSMSTemplates();
      // Ensure templatesData is always an array
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } catch (error) {
      console.error('Error loading templates:', error);
      // Set empty array on error to prevent filter issues
      setTemplates([]);
      toast({
        title: 'Error',
        description: 'Failed to load SMS templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const groupData = await api.getGroups();
      setGroups(groupData);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load groups',
        variant: 'destructive',
      });
    }
  };

  const extractVariables = (message: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    while ((match = regex.exec(message)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  const createTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    try {
      const variables = extractVariables(templateForm.message);

      const templateData = {
        name: templateForm.name,
        message: templateForm.message,
        category: templateForm.category,
        variables,
        ...(templateForm.group && { group: templateForm.group }),
      };

      const newTemplate = await api.createSMSTemplate(templateData);
      setTemplates(prev => [newTemplate, ...prev]);

      setIsCreateDialogOpen(false);
      setTemplateForm({ name: '', message: '', category: '', group: null });

      toast({
        title: 'Success',
        description: 'SMS template created successfully',
      });
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create SMS template',
        variant: 'destructive',
      });
    }
  };

  const updateTemplate = async () => {
    if (!editingTemplate || !templateForm.name.trim() || !templateForm.message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    try {
      const variables = extractVariables(templateForm.message);

      const templateData = {
        name: templateForm.name,
        message: templateForm.message,
        category: templateForm.category,
        variables,
        ...(templateForm.group && { group: templateForm.group }),
      };

      const updatedTemplate = await api.updateSMSTemplate(editingTemplate.id, templateData);
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t));

      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      setTemplateForm({ name: '', message: '', category: '', group: null });

      toast({
        title: 'Success',
        description: 'SMS template updated successfully',
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update SMS template',
        variant: 'destructive',
      });
    }
  };

  const handleMoveToTrash = async (templateId: string) => {
    try {
      await api.updateSMSTemplate(templateId, { status: 'trashed' });
      setTemplates(prev => prev.filter(t => t.id !== templateId));

      toast({
        title: 'Template moved to Trash',
        description: 'SMS template has been moved to trash',
      });
    } catch (error) {
      console.error('Error moving template to trash:', error);
      toast({
        title: 'Error',
        description: 'Failed to move SMS template to trash',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveTemplate = async (templateId: string) => {
    try {
      await api.updateSMSTemplate(templateId, { status: 'archived' });
      setTemplates(prev => prev.filter(t => t.id !== templateId));

      toast({
        title: 'Template Archived',
        description: 'SMS template has been archived',
      });
    } catch (error) {
      console.error('Error archiving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive SMS template',
        variant: 'destructive',
      });
    }
  };

  const duplicateTemplate = async (template: SMSTemplate) => {
    try {
      const duplicatedTemplate = await api.duplicateSMSTemplate(template.id);
      setTemplates(prev => [duplicatedTemplate, ...prev]);

      toast({
        title: 'Template Duplicated',
        description: 'SMS template has been duplicated',
      });
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate SMS template',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (template: SMSTemplate) => {
    navigate(`/reach/sms-templates/${template.id}`);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Welcome': 'bg-blue-100 text-blue-800',
      'Promotional': 'bg-green-100 text-green-800',
      'Reminder': 'bg-yellow-100 text-yellow-800',
      'Follow-up': 'bg-purple-100 text-purple-800',
      'Notification': 'bg-orange-100 text-orange-800',
      'Survey': 'bg-pink-100 text-pink-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors['Other'];
  };

  const createNewGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a group name.',
      });
      return;
    }

    try {
      const newGroup = await api.createGroup({ name: newGroupName.trim() });
      setGroups(prev => [...prev, newGroup]);

      toast({
        title: 'Success',
        description: 'Group created successfully',
      });

      setNewGroupName('');
      setIsNewGroupDialogOpen(false);

      // Reload groups to get the updated list
      await loadGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Error',
        description: 'Failed to create group',
        variant: 'destructive',
      });
    }
  };

  const openEditGroupDialog = (group: { id: string; name: string }) => {
    setEditingGroup(group);
    setEditGroupName(group.name);
    setIsEditGroupDialogOpen(true);
  };

  const updateGroup = async () => {
    if (!editingGroup || !editGroupName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a group name.',
      });
      return;
    }

    try {
      const updatedGroup = await api.updateGroup(editingGroup.id, { name: editGroupName.trim() });
      setGroups(prev => prev.map(g => g.id === editingGroup.id ? updatedGroup : g));

      toast({
        title: 'Success',
        description: 'Group updated successfully',
      });

      setEditingGroup(null);
      setEditGroupName('');
      setIsEditGroupDialogOpen(false);
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: 'Error',
        description: 'Failed to update group',
        variant: 'destructive',
      });
    }
  };

  const deleteGroup = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    const confirmed = window.confirm(`Are you sure you want to delete the group "${group?.name || 'this group'}"? This action cannot be undone.`);

    if (!confirmed) return;

    try {
      await api.deleteGroup(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));

      toast({
        title: 'Group Deleted',
        description: 'Group has been deleted',
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete group',
        variant: 'destructive',
      });
    }
  };

  const createNewCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a category name.',
      });
      return;
    }

    // Check if category already exists
    if (categories.includes(newCategoryName.trim())) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Category already exists.',
      });
      return;
    }

    // Add new category to the list
    categories.push(newCategoryName.trim());

    toast({
      title: 'Success',
      description: 'Category created successfully',
    });

    setNewCategoryName('');
    setIsNewCategoryDialogOpen(false);
  };

  const openEditCategoryDialog = (category: string) => {
    setEditingCategory(category);
    setEditCategoryName(category);
    setIsEditCategoryDialogOpen(true);
  };

  const updateCategory = () => {
    if (!editingCategory || !editCategoryName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a category name.',
      });
      return;
    }

    // Check if new name already exists
    if (categories.includes(editCategoryName.trim())) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Category already exists.',
      });
      return;
    }

    // Update category in the list
    const index = categories.indexOf(editingCategory);
    if (index !== -1) {
      categories[index] = editCategoryName.trim();
    }

    toast({
      title: 'Success',
      description: 'Category updated successfully',
    });

    setEditingCategory('');
    setEditCategoryName('');
    setIsEditCategoryDialogOpen(false);
  };

  const deleteCategory = (category: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete the category "${category}"? This action cannot be undone.`);

    if (!confirmed) return;

    // Remove category from the list
    const index = categories.indexOf(category);
    if (index !== -1) {
      categories.splice(index, 1);
    }

    toast({
      title: 'Category Deleted',
      description: 'Category has been deleted',
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTemplates(filteredTemplates.map(t => t.id));
    } else {
      setSelectedTemplates([]);
    }
  };

  const handleSelectTemplate = (templateId: string, checked: boolean) => {
    if (checked) {
      setSelectedTemplates(prev => [...prev, templateId]);
    } else {
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
    }
  };

  const bulkMoveToTrash = async () => {
    const confirmed = window.confirm(`Are you sure you want to move ${selectedTemplates.length} template(s) to trash?`);

    if (!confirmed) return;

    try {
      await Promise.all(selectedTemplates.map(id => api.updateSMSTemplate(id, { status: 'trashed' })));
      setTemplates(prev => prev.filter(t => !selectedTemplates.includes(t.id)));
      setSelectedTemplates([]);
      toast({
        title: 'Templates moved to Trash',
        description: `${selectedTemplates.length} templates have been moved to trash`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move templates to trash',
        variant: 'destructive'
      });
    }
  };

  const filteredTemplates = Array.isArray(templates) ? templates.filter(template => {
    const matchesSearch = template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.message?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesGroup = selectedGroup === 'all' ||
      (selectedGroup === 'none' && !template.group) ||
      (selectedGroup !== 'all' && selectedGroup !== 'none' && template.group === selectedGroup);
    const isVisible = template.status !== 'archived' && template.status !== 'trashed';
    return matchesSearch && matchesCategory && matchesGroup && isVisible;
  }) : [];

  return (
    <>
      <div className="space-y-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[18px] font-bold text-gray-900 dark:text-white">SMS Templates</h1>
            <p className="text-gray-600 dark:text-gray-400">Create and manage reusable SMS message templates</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isNewCategoryDialogOpen} onOpenChange={setIsNewCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Tag className="h-4 w-4 mr-2" />
                  New Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                  <DialogDescription>
                    Create a new category to organize your SMS templates
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsNewCategoryDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createNewCategory}>
                    Create Category
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isNewGroupDialogOpen} onOpenChange={setIsNewGroupDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                  <DialogDescription>
                    Create a new group to organize your SMS templates
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="group-name">Group Name</Label>
                    <Input
                      id="group-name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Enter group name"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsNewGroupDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createNewGroup}>
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={() => navigate('/reach/sms-templates/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                <SelectItem value="none">No Group</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <Folder className="h-4 w-4 mr-2" />
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsNewGroupDialogOpen(true)}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Group
                </DropdownMenuItem>
                {groups.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      Manage Groups:
                    </DropdownMenuItem>
                    {groups.map((group) => (
                      <div key={group.id} className="flex items-center justify-between px-2 py-1">
                        <span className="text-sm flex-1">{group.name}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => openEditGroupDialog(group)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            onClick={() => deleteGroup(group.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsNewCategoryDialogOpen(true)}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Category
                </DropdownMenuItem>
                {categories.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      Manage Categories:
                    </DropdownMenuItem>
                    {categories.map((category) => (
                      <div key={category} className="flex items-center justify-between px-2 py-1">
                        <span className="text-sm flex-1">{category}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => openEditCategoryDialog(category)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            onClick={() => deleteCategory(category)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedTemplates.length > 0 && (
          <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-700">
              {selectedTemplates.length} template(s) selected
            </span>
            <Button
              size="sm"
              variant="destructive"
              onClick={bulkMoveToTrash}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Move to Trash
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <Card className="border-analytics">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading SMS templates...</p>
            </CardContent>
          </Card>
        ) : filteredTemplates.length > 0 ? (
          <Card className="border-analytics">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTemplates.length === filteredTemplates.length}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all templates"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">Template</TableHead>
                  <TableHead className="font-semibold text-foreground">Category</TableHead>
                  <TableHead className="font-semibold text-foreground">Group</TableHead>
                  <TableHead className="font-semibold text-foreground">Variables</TableHead>
                  <TableHead className="font-semibold text-foreground">Updated</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell>
                      <Checkbox
                        checked={selectedTemplates.includes(template.id)}
                        onCheckedChange={(checked) => handleSelectTemplate(template.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{template.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                          {template.message}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(template.category)}>
                        <Tag className="h-3 w-3 mr-1" />
                        {template.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {template.group ? (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Folder className="h-4 w-4 mr-1" />
                          {groups.find(g => g.id === template.group)?.name || 'Unknown'}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {template.variables?.slice(0, 3).map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                        {template.variables && template.variables.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.variables.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(template.updated_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateTemplate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteTemplate(template.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="border-analytics">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || selectedCategory !== 'all' || selectedGroup !== 'all'
                  ? 'No SMS templates found'
                  : 'No SMS templates yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== 'all' || selectedGroup !== 'all'
                  ? 'Try adjusting your filters or create a new template.'
                  : 'Create your first SMS template to get started.'}
              </p>
              {searchQuery || selectedCategory !== 'all' || selectedGroup !== 'all' ? (
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedGroup('all');
                }}>
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => navigate('/reach/sms-templates/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Template
                </Button>
              )}
            </CardContent>
          </Card>
        )}



        {/* Edit Group Dialog */}
        <Dialog open={isEditGroupDialogOpen} onOpenChange={setIsEditGroupDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
              <DialogDescription>
                Update the group name
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-group-name">Group Name</Label>
                <Input
                  id="edit-group-name"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditGroupDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateGroup}>
                Update Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category name
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category-name">Category Name</Label>
                <Input
                  id="edit-category-name"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  placeholder="Enter category name"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateCategory}>
                Update Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default SMSTemplates;

