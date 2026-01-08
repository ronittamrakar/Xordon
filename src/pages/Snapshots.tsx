import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Plus,
  Download,
  Upload,
  MoreVertical,
  Trash2,
  Package,
  Zap,
  FileTextIcon,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  History,
  Eye,
  LayoutGrid,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import snapshotsApi, { Snapshot, SnapshotImport } from '@/services/snapshotsApi';
import { format, parseISO } from 'date-fns';

const Snapshots: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'snapshots' | 'history'>('snapshots');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [newSnapshot, setNewSnapshot] = useState({
    name: '',
    description: '',
    category: 'custom' as const,
    include: ['pipelines', 'automations', 'workflows', 'funnels', 'forms', 'templates', 'custom_fields', 'tags', 'segments', 'integrations', 'contacts_schema', 'settings'] as string[],
  });

  // Fetch snapshots
  const { data: snapshots = [], isLoading: isLoadingSnapshots } = useQuery({
    queryKey: ['snapshots', categoryFilter],
    queryFn: () => snapshotsApi.listSnapshots(categoryFilter === 'all' ? undefined : categoryFilter),
  });

  // Fetch import history
  const { data: imports = [], isLoading: isLoadingImports } = useQuery({
    queryKey: ['snapshot-imports'],
    queryFn: () => snapshotsApi.listImports(),
  });

  // Create snapshot mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof newSnapshot) => snapshotsApi.createSnapshot(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
      setIsCreateOpen(false);
      setNewSnapshot({
        name: '',
        description: '',
        category: 'custom',
        include: ['pipelines', 'automations', 'workflows', 'funnels', 'forms', 'templates', 'custom_fields', 'tags', 'segments', 'integrations', 'contacts_schema', 'settings'],
      });
      toast.success(`Snapshot created with ${Object.values(result.metadata.item_counts).reduce((a, b) => a + b, 0)} items`);
    },
    onError: () => {
      toast.error('Failed to create snapshot');
    },
  });

  // Import snapshot mutation
  const importMutation = useMutation({
    mutationFn: (id: number) => snapshotsApi.importSnapshot(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['snapshot-imports'] });
      setIsImportOpen(false);
      setSelectedSnapshot(null);
      const totalItems = Object.values(result.items_imported).reduce((a, b) => a + b, 0);
      toast.success(`Imported ${totalItems} items successfully`);
    },
    onError: () => {
      toast.error('Failed to import snapshot');
    },
  });

  // Delete snapshot mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => snapshotsApi.deleteSnapshot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
      toast.success('Snapshot deleted');
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pipelines': return <Package className="h-4 w-4" />;
      case 'automations': return <Zap className="h-4 w-4" />;
      case 'forms': return <FileTextIcon className="h-4 w-4" />;
      case 'templates': return <Mail className="h-4 w-4" />;
      default: return <Camera className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'full': return 'bg-purple-100 text-purple-800';
      case 'pipelines': return 'bg-blue-100 text-blue-800';
      case 'automations': return 'bg-orange-100 text-orange-800';
      case 'forms': return 'bg-green-100 text-green-800';
      case 'templates': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const toggleInclude = (item: string) => {
    setNewSnapshot(prev => ({
      ...prev,
      include: prev.include.includes(item)
        ? prev.include.filter(i => i !== item)
        : [...prev.include, item]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Snapshots</h1>
          <p className="text-muted-foreground">Export and import your configurations</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Snapshot
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
            <TabsTrigger value="history">Import History</TabsTrigger>
          </TabsList>

          {activeTab === 'snapshots' && (
            <div className="flex items-center gap-3">
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-r-none h-9 px-3"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-l-none h-9 px-3"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="full">Full Backup</SelectItem>
                  <SelectItem value="pipelines">Pipelines</SelectItem>
                  <SelectItem value="automations">Automations</SelectItem>
                  <SelectItem value="forms">Forms</SelectItem>
                  <SelectItem value="templates">Templates</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Snapshots Tab */}
        <TabsContent value="snapshots" className="mt-4">
          {isLoadingSnapshots ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : snapshots.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No snapshots yet</h3>
                <p className="text-muted-foreground mb-4">Create a snapshot to backup your configurations</p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Snapshot
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {viewMode === 'table' ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nam</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Contents</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {snapshots.map((snapshot) => (
                        <TableRow key={snapshot.id}>
                          <TableCell>
                            <div className="flex items-center gap-2 font-medium">
                              {getCategoryIcon(snapshot.category)}
                              {snapshot.name}
                              <span className="text-xs text-muted-foreground ml-1">v{snapshot.version}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(snapshot.category)}>
                              {snapshot.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate text-muted-foreground">
                            {snapshot.description || '-'}
                          </TableCell>
                          <TableCell>
                            {snapshot.metadata?.item_counts && (
                              <div className="flex flex-wrap gap-1">
                                {snapshot.metadata.item_counts.pipelines > 0 && (
                                  <Badge variant="outline" className="text-[12px]">
                                    {snapshot.metadata.item_counts.pipelines} pipelines
                                  </Badge>
                                )}
                                {snapshot.metadata.item_counts.automations > 0 && (
                                  <Badge variant="outline" className="text-[12px]">
                                    {snapshot.metadata.item_counts.automations} automations
                                  </Badge>
                                )}
                                {snapshot.metadata.item_counts.workflows > 0 && (
                                  <Badge variant="outline" className="text-[12px]">
                                    {snapshot.metadata.item_counts.workflows} workflows
                                  </Badge>
                                )}
                                {snapshot.metadata.item_counts.funnels > 0 && (
                                  <Badge variant="outline" className="text-[12px]">
                                    {snapshot.metadata.item_counts.funnels} funnels
                                  </Badge>
                                )}
                                {snapshot.metadata.item_counts.forms > 0 && (
                                  <Badge variant="outline" className="text-[12px]">
                                    {snapshot.metadata.item_counts.forms} forms
                                  </Badge>
                                )}
                                {(snapshot.metadata.item_counts.email_templates > 0 || snapshot.metadata.item_counts.sms_templates > 0) && (
                                  <Badge variant="outline" className="text-[12px]">
                                    {snapshot.metadata.item_counts.email_templates + snapshot.metadata.item_counts.sms_templates} templates
                                  </Badge>
                                )}
                                {snapshot.metadata.item_counts.custom_fields > 0 && (
                                  <Badge variant="outline" className="text-[12px]">
                                    {snapshot.metadata.item_counts.custom_fields} fields
                                  </Badge>
                                )}
                                {snapshot.metadata.item_counts.tags > 0 && (
                                  <Badge variant="outline" className="text-[12px]">
                                    {snapshot.metadata.item_counts.tags} tags
                                  </Badge>
                                )}
                                {snapshot.metadata.item_counts.integrations > 0 && (
                                  <Badge variant="outline" className="text-[12px]">
                                    {snapshot.metadata.item_counts.integrations} integrations
                                  </Badge>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div>{format(parseISO(snapshot.created_at), 'MMM d, yyyy')}</div>
                            <div className="text-xs">{snapshot.created_by_name && `by ${snapshot.created_by_name}`}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => {
                                setSelectedSnapshot(snapshot);
                                setIsImportOpen(true);
                              }}>
                                <Upload className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedSnapshot(snapshot);
                                    setIsImportOpen(true);
                                  }}>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => snapshotsApi.downloadSnapshot(snapshot.id)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => deleteMutation.mutate(snapshot.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {snapshots.map((snapshot) => (
                    <Card key={snapshot.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(snapshot.category)}
                            <CardTitle className="text-base">{snapshot.name}</CardTitle>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedSnapshot(snapshot);
                                setIsImportOpen(true);
                              }}>
                                <Upload className="h-4 w-4 mr-2" />
                                Import
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => snapshotsApi.downloadSnapshot(snapshot.id)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteMutation.mutate(snapshot.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getCategoryColor(snapshot.category)}>
                            {snapshot.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">v{snapshot.version}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {snapshot.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{snapshot.description}</p>
                        )}

                        {snapshot.metadata?.item_counts && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {snapshot.metadata.item_counts.pipelines > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {snapshot.metadata.item_counts.pipelines} pipelines
                              </Badge>
                            )}
                            {snapshot.metadata.item_counts.automations > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {snapshot.metadata.item_counts.automations} automations
                              </Badge>
                            )}
                            {snapshot.metadata.item_counts.forms > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {snapshot.metadata.item_counts.forms} forms
                              </Badge>
                            )}
                            {(snapshot.metadata.item_counts.email_templates > 0 || snapshot.metadata.item_counts.sms_templates > 0) && (
                              <Badge variant="outline" className="text-xs">
                                {snapshot.metadata.item_counts.email_templates + snapshot.metadata.item_counts.sms_templates} templates
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Created {format(parseISO(snapshot.created_at), 'MMM d, yyyy')}
                          {snapshot.created_by_name && ` by ${snapshot.created_by_name}`}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Import History Tab */}
        <TabsContent value="history" className="mt-4">
          {isLoadingImports ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : imports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No import history</h3>
                <p className="text-muted-foreground">Import a snapshot to see it here</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="divide-y">
                {imports.map((imp) => (
                  <div key={imp.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(imp.status)}
                      <div>
                        <div className="font-medium">{imp.snapshot_name || imp.source_name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">
                          {imp.completed_at
                            ? format(parseISO(imp.completed_at), 'MMM d, yyyy h:mm a')
                            : 'In progress...'}
                          {imp.imported_by_name && ` • ${imp.imported_by_name}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {imp.items_imported && (
                        <div className="text-sm text-muted-foreground">
                          {Object.entries(imp.items_imported).map(([key, count]) => (
                            count > 0 && <span key={key} className="mr-2">{count} {key}</span>
                          ))}
                        </div>
                      )}
                      <Badge variant={imp.status === 'completed' ? 'default' : imp.status === 'failed' ? 'destructive' : 'secondary'}>
                        {imp.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Snapshot Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Snapshot</DialogTitle>
            <DialogDescription>Export your configurations to a snapshot</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="e.g., Full Backup - January 2025"
                value={newSnapshot.name}
                onChange={(e) => setNewSnapshot(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What's included in this snapshot..."
                value={newSnapshot.description}
                onChange={(e) => setNewSnapshot(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newSnapshot.category}
                onValueChange={(v) => setNewSnapshot(prev => ({ ...prev, category: v as typeof prev.category }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Backup</SelectItem>
                  <SelectItem value="pipelines">Pipelines Only</SelectItem>
                  <SelectItem value="automations">Automations Only</SelectItem>
                  <SelectItem value="forms">Forms Only</SelectItem>
                  <SelectItem value="templates">Templates Only</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newSnapshot.category === 'custom' && (
              <div className="space-y-2">
                <Label>Include</Label>
                <div className="space-y-2">
                  {[
                    { id: 'pipelines', label: 'Pipelines' },
                    { id: 'automations', label: 'Automations' },
                    { id: 'workflows', label: 'Workflows' },
                    { id: 'funnels', label: 'Funnels' },
                    { id: 'forms', label: 'Forms' },
                    { id: 'templates', label: 'Email/SMS Templates' },
                    { id: 'custom_fields', label: 'Custom Fields' },
                    { id: 'tags', label: 'Tags' },
                    { id: 'segments', label: 'Segments' },
                    { id: 'integrations', label: 'Integrations' },
                    { id: 'contacts_schema', label: 'Contact Schema' },
                    { id: 'settings', label: 'Workspace Settings' },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Checkbox
                        id={item.id}
                        checked={newSnapshot.include.includes(item.id)}
                        onCheckedChange={() => toggleInclude(item.id)}
                      />
                      <label htmlFor={item.id} className="text-sm cursor-pointer">
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(newSnapshot)}
              disabled={!newSnapshot.name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Snapshot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Snapshot Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Snapshot</DialogTitle>
            <DialogDescription>
              Import configurations from "{selectedSnapshot?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-muted rounded-lg mb-4">
              <h4 className="font-medium mb-2">This snapshot contains:</h4>
              {selectedSnapshot?.metadata?.item_counts && (
                <ul className="text-sm text-muted-foreground space-y-1">
                  {selectedSnapshot.metadata.item_counts.pipelines > 0 && (
                    <li>• {selectedSnapshot.metadata.item_counts.pipelines} pipeline(s)</li>
                  )}
                  {selectedSnapshot.metadata.item_counts.automations > 0 && (
                    <li>• {selectedSnapshot.metadata.item_counts.automations} automation(s)</li>
                  )}
                  {selectedSnapshot.metadata.item_counts.forms > 0 && (
                    <li>• {selectedSnapshot.metadata.item_counts.forms} form(s)</li>
                  )}
                  {selectedSnapshot.metadata.item_counts.email_templates > 0 && (
                    <li>• {selectedSnapshot.metadata.item_counts.email_templates} email template(s)</li>
                  )}
                  {selectedSnapshot.metadata.item_counts.sms_templates > 0 && (
                    <li>• {selectedSnapshot.metadata.item_counts.sms_templates} SMS template(s)</li>
                  )}
                </ul>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Imported items will be created as new entries with "(Imported)" suffix.
              Existing configurations will not be modified.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>Cancel</Button>
            <Button
              onClick={() => selectedSnapshot && importMutation.mutate(selectedSnapshot.id)}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Snapshots;

