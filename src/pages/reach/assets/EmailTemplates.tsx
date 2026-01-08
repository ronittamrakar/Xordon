import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileTextIcon, Edit, Copy, Trash2, MoreHorizontal, Mail, Zap, Calendar, Eye, LayoutGrid, List, Library, Layers, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

import { api, Template } from '@/lib/api';
import { EMAIL_PRESETS, PresetTemplate } from '@/data/emailTemplates';
import { SafeHTML } from '@/components/SafeHTML';

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | PresetTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('my-templates');
  const { toast } = useToast();

  const openPreview = (template: Template | PresetTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setSelectedTemplate(null);
  };

  const selectedTemplateTextPreview = useMemo(() => {
    if (!selectedTemplate?.htmlContent) return '';
    const text = selectedTemplate.htmlContent
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text;
  }, [selectedTemplate]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.getTemplates();
      setTemplates(response);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToTrash = async (id: string) => {
    try {
      await api.updateTemplate(id, { status: 'trashed' });
      setTemplates(templates.filter(template => template.id !== id));
      toast({
        title: 'Moved to Trash',
        description: 'Template has been moved to trash.',
      });
    } catch (error) {
      console.error('Error moving template to trash:', error);
    }
  };

  const handleArchiveTemplate = async (id: string) => {
    try {
      await api.updateTemplate(id, { status: 'archived' });
      setTemplates(templates.filter(template => template.id !== id));
      toast({
        title: 'Archived',
        description: 'Template has been archived.',
      });
    } catch (error) {
      console.error('Error archiving template:', error);
    }
  };

  const handleCopyTemplate = async (template: Template) => {
    try {
      const newTemplate = {
        name: `${template.name} (Copy)`,
        subject: template.subject,
        htmlContent: template.htmlContent,
        blocks: Array.isArray(template.blocks) ? JSON.stringify(template.blocks) : template.blocks,
        globalStyles: typeof template.globalStyles === 'string'
          ? template.globalStyles
          : JSON.stringify(template.globalStyles || {}),
        isSequence: template.isSequence,
        sequenceId: template.sequenceId,
      };
      const response = await api.createTemplate(newTemplate);
      setTemplates([...templates, response]);
    } catch (error) {
      console.error('Error copying template:', error);
    }
  };

  const handleUsePreset = async (preset: PresetTemplate, immediatelyUse: boolean = false) => {
    try {
      setLoading(true);
      const newTemplate = {
        name: preset.name,
        subject: preset.subject,
        htmlContent: preset.htmlContent,
        blocks: JSON.stringify([]), // Presets are simple HTML for now
        isSequence: false,
      };
      const response = await api.createTemplate(newTemplate);

      // Update local state
      setTemplates([...templates, response]);

      if (immediatelyUse) {
        navigate(`/reach/outbound/email/campaigns/new?templateId=${encodeURIComponent(response.id)}`);
      } else {
        // Switch to my templates to show the new one
        setActiveTab('my-templates');
        setLoading(false); // Only turn off loading if we stay on page
      }
    } catch (error) {
      console.error('Error using preset:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const applyTemplate = (template: Template | PresetTemplate) => {
    if ('category' in template) {
      // It's a preset
      handleUsePreset(template as PresetTemplate, true);
    } else {
      // It's a real template
      navigate(`/reach/outbound/email/campaigns/new?templateId=${encodeURIComponent(template.id)}`);
    }
  };

  const handleEditTemplate = (template: Template) => {
    // If it has blocks, use builder, else simple editor
    let hasBlocks = false;
    if (template.blocks) {
      if (typeof template.blocks === 'string') {
        try {
          const parsed = JSON.parse(template.blocks);
          hasBlocks = Array.isArray(parsed) && parsed.length > 0;
        } catch (e) { console.error('Error parsing blocks:', e); }
      } else if (Array.isArray(template.blocks) && template.blocks.length > 0) {
        hasBlocks = true;
      }
    }

    if (hasBlocks) {
      navigate(`/reach/email-templates/builder/${template.id}`);
    } else {
      navigate(`/reach/email-templates/${template.id}`);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' ||
      (typeFilter === 'email' && !template.isSequence) ||
      (typeFilter === 'sequence' && template.isSequence);
    const isVisible = template.status !== 'archived' && template.status !== 'trashed';
    return matchesSearch && matchesType && isVisible;
  });

  const filteredPresets = EMAIL_PRESETS.filter(preset => {
    return preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading && templates.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading templates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[18px] font-bold text-gray-900 dark:text-white">Email Templates</h1>
            <p className="text-gray-600 dark:text-gray-400">Create and manage email templates, or choose from our presets.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => navigate('/reach/email-templates/new')} className="flex-1 sm:flex-none">
              <FileTextIcon className="h-4 w-4 mr-2" />
              Simple Editor
            </Button>
            <Button onClick={() => navigate('/reach/email-templates/builder/new')} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <TabsList>
              <TabsTrigger value="my-templates" className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                My Templates
              </TabsTrigger>
              <TabsTrigger value="presets" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                System Presets
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Only show view mode toggle for my templates for now */}
              {activeTab === 'my-templates' && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className={viewMode === 'grid' ? 'bg-muted' : ''}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('table')}
                    className={viewMode === 'table' ? 'bg-muted' : ''}
                  >
                    <List className="h-4 w-4" />
                  </Button>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sequence">Sequence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="relative w-full lg:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full lg:w-[250px]"
                />
              </div>
            </div>
          </div>

          <TabsContent value="my-templates" className="mt-0">
            {templates.length === 0 ? (
              <Card className="border-analytics">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileTextIcon className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
                  <p className="text-muted-foreground mb-4 text-center">
                    Create templates to speed up your email creation
                  </p>
                  <Button onClick={() => navigate('/reach/email-templates/builder/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredTemplates.length === 0 ? (
                <Card className="border-analytics">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Search className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-foreground">No templates found</h3>
                    <p className="text-muted-foreground mb-4 text-center">
                      Try adjusting your search terms or filters
                    </p>
                  </CardContent>
                </Card>
              ) : (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                      <Card key={template.id} className="border-analytics overflow-hidden group">
                        <CardContent className="p-4 space-y-3">
                          <button
                            type="button"
                            onClick={() => openPreview(template)}
                            className="w-full relative overflow-hidden rounded-md border bg-background text-left hover:bg-muted/30 transition-colors"
                          >
                            <div className="p-3">
                              <div className="h-[150px] w-full overflow-hidden rounded-sm bg-white pointer-events-none select-none">
                                <div className="origin-top-left scale-[0.32] w-[900px]">
                                  <SafeHTML html={template.htmlContent || '<span style="color:#6b7280">No content</span>'} className="prose prose-sm max-w-none text-black" />
                                </div>
                              </div>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent" />
                          </button>

                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <h4 className="font-semibold truncate" title={template.name}>{template.name}</h4>
                                <p className="text-xs text-muted-foreground truncate" title={template.subject}>{template.subject}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => applyTemplate(template)}>
                                    <Zap className="mr-2 h-4 w-4" />
                                    Use
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openPreview(template)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCopyTemplate(template)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleArchiveTemplate(template.id)}>
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archive
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleMoveToTrash(template.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Move to Trash
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                              <Button variant="outline" size="sm" className="w-full" onClick={() => openPreview(template)}>
                                Preview
                              </Button>
                              <Button size="sm" className="w-full" onClick={() => applyTemplate(template)}>
                                Use
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-analytics">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent border-b">
                            <TableHead className="font-semibold min-w-[150px]">Name</TableHead>
                            <TableHead className="font-semibold min-w-[100px]">Type</TableHead>
                            <TableHead className="font-semibold min-w-[200px]">Subject</TableHead>
                            <TableHead className="font-semibold w-[200px] hidden md:table-cell">Preview</TableHead>
                            <TableHead className="font-semibold min-w-[120px] hidden lg:table-cell">Created</TableHead>
                            <TableHead className="font-semibold w-[80px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTemplates.map((template) => (
                            <TableRow key={template.id} className="hover:bg-muted/50">
                              <TableCell className="font-medium">
                                {template.name}
                              </TableCell>
                              <TableCell>
                                {template.isSequence ? (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Sequence</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Email</Badge>
                                )}
                              </TableCell>
                              <TableCell className="truncate max-w-[200px]" title={template.subject}>
                                {template.subject}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openPreview(template)}>
                                  <Eye className="mr-2 h-3 w-3" /> Quick View
                                </Button>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                                {template.created_at ? formatDate(template.created_at) : 'N/A'}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditTemplate(template)}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => applyTemplate(template)}>Use in Campaign</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCopyTemplate(template)}>Duplicate</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleArchiveTemplate(template.id)}>Archive</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleMoveToTrash(template.id)} className="text-red-600">Move to Trash</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                )
              )
            )}
          </TabsContent>

          <TabsContent value="presets" className="mt-0">
            {filteredPresets.length === 0 ? (
              <Card className="border-analytics">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Search className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No presets found</h3>
                  <p className="text-muted-foreground">Try adjusting your search</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredPresets.map((preset) => (
                  <Card key={preset.id} className="border-analytics overflow-hidden flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="mb-2">{preset.category}</Badge>
                      </div>
                      <CardTitle className="text-base">{preset.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{preset.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-3">
                      <div className="p-3 bg-muted/30 rounded-md border text-xs text-muted-foreground h-[100px] overflow-hidden relative">
                        <div className="font-semibold text-foreground mb-1 truncate">Subject: {preset.subject}</div>
                        <SafeHTML html={preset.htmlContent} className="opacity-70" />
                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-muted/30 to-transparent" />
                      </div>
                    </CardContent>
                    <CardFooter className="gap-2 pt-0">
                      <Button variant="outline" className="flex-1" onClick={() => openPreview(preset)}>
                        Preview
                      </Button>
                      <Button className="flex-1" onClick={() => handleUsePreset(preset, false)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Clone
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Reuse the existing dialog, adapting for presets if needed */}
      <Dialog open={previewOpen} onOpenChange={(open) => (open ? setPreviewOpen(true) : closePreview())}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">{selectedTemplate?.name || 'Template Preview'}</DialogTitle>
            <DialogDescription>
              <div className="mt-1 text-sm text-muted-foreground">
                Subject: <span className="text-foreground">{selectedTemplate?.subject || '—'}</span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="rounded-md border bg-background">
              <div className="max-h-[60vh] overflow-y-auto p-4">
                <SafeHTML
                  html={selectedTemplate?.htmlContent || 'No content'}
                  className="prose prose-sm max-w-none text-card-foreground [&_*]:text-card-foreground [&_p]:text-card-foreground [&_div]:text-card-foreground [&_span]:text-card-foreground [&_h1]:text-card-foreground [&_h2]:text-card-foreground [&_h3]:text-card-foreground [&_h4]:text-card-foreground [&_h5]:text-card-foreground [&_h6]:text-card-foreground [&_a]:text-primary [&_a]:underline"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            {/* If it's a preset, offer Clone/Use buttons differently or just reuse */}
            {'category' in (selectedTemplate || {}) ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleUsePreset(selectedTemplate as PresetTemplate, false)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Add to My Templates
                </Button>
                <Button
                  type="button"
                  onClick={() => handleUsePreset(selectedTemplate as PresetTemplate, true)}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Use Now
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(selectedTemplateTextPreview || selectedTemplate?.htmlContent || '');
                    } catch (e) {
                      // Copy failed silently
                    }
                  }}
                  disabled={!selectedTemplate}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Content
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!selectedTemplate?.id) return;
                    closePreview();
                    applyTemplate(selectedTemplate as Template);
                  }}
                  disabled={!selectedTemplate?.id}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
              </>
            )}

          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Templates;

