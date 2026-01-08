import { useState } from 'react';
// Force Vite re-scan: 2026-01-03T10:10:00
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { webformsApi, WebForm, WebFolder } from '@/services/webformsApi';
import { useDebounce } from '@/hooks/useDebounce';
import {
  FileTextIcon,
  Search,
  Trash2,
  Edit3,
  Copy,
  Share2,
  BarChart3,
  Plus,
  Eye,
  MoreVertical,
  Folder,
  Archive,
  FolderPlus,
  RefreshCw,
  Filter,
  CheckSquare,
  Square,
  List,
  LayoutGrid,
  ArrowRightLeft,
  FolderInput,
  ArrowLeft,
  LayoutTemplate,
  ChevronDown,
  ChevronRight,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';

export default function WebFormsList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // URL State
  const currentFolderId = searchParams.get('folder');

  // Local State
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAllForms, setShowAllForms] = useState(false);
  const [selectedForms, setSelectedForms] = useState<number[]>([]);

  // Modals State
  const [showNewFormModal, setShowNewFormModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  // Default to black as requested, though UI overrides visually to black anyway.
  const [newFolderColor, setNewFolderColor] = useState('#000000');
  const [creationStep, setCreationStep] = useState<'initial' | 'scratch'>('initial');

  // View & Move State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [moveModal, setMoveModal] = useState<{
    isOpen: boolean;
    type: 'form' | 'folder' | 'bulk-forms';
    item: WebForm | WebFolder | null;
  } | null>(null);
  const [moveTargetId, setMoveTargetId] = useState<string>('root');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    name: true,
    folder: true,
    status: true,
    submissions: true,
    views: true,
    conversion: true,
    updated: true,
    created: true,
    id: true,
  });

  // Fetch forms (unchanged)
  const { data: formsData, isLoading, refetch } = useQuery({
    queryKey: ['webforms', debouncedSearchTerm, statusFilter, currentFolderId, showAllForms],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;

      if (!showAllForms) {
        if (currentFolderId) {
          params.folder_id = currentFolderId;
        } else {
          params.folder_id = 'null';
        }
      }
      return webformsApi.getForms(params);
    },
    placeholderData: keepPreviousData,
  });

  // ... (rest of queries/mutations unchanged)

  const { data: foldersData, refetch: refetchFolders } = useQuery({
    queryKey: ['webforms-folders'],
    queryFn: () => webformsApi.getFolders(),
  });

  const createFolderMutation = useMutation({
    mutationFn: (data: { name: string; color: string; parent_id?: number | null }) =>
      webformsApi.createFolder(data),
    onSuccess: () => {
      refetchFolders();
      toast.success('Folder created successfully');
      setShowNewFolderModal(false);
      setNewFolderName('');
      setNewFolderColor('#000000');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create folder');
    },
  });

  const createFormMutation = useMutation({
    mutationFn: (data: { title: string; description?: string; folder_id?: number | null }) =>
      webformsApi.createForm(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['webforms'] });
      refetchFolders();
      toast.success('Form created successfully');
      setShowNewFormModal(false);
      setNewFormTitle('');
      setNewFormDescription('');
      const newFormId = response?.data?.id;
      if (newFormId) {
        navigate(`/forms/builder/${newFormId}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create form');
    },
  });

  const duplicateFormMutation = useMutation({
    mutationFn: (id: number) => webformsApi.duplicateForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms'] });
      toast.success('Form duplicated successfully');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to duplicate form'),
  });

  const archiveFormMutation = useMutation({
    mutationFn: (id: number) => webformsApi.updateForm(id, { status: 'archived' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms'] });
      toast.success('Form archived successfully');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to archive form'),
  });

  const deleteFormMutation = useMutation({
    mutationFn: (id: number) => webformsApi.updateForm(id, { status: 'trashed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms'] });
      refetchFolders();
      toast.success('Form moved to trash');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to move form to trash'),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: number) => webformsApi.deleteFolder(id),
    onSuccess: () => {
      refetchFolders();
      toast.success('Folder deleted successfully');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete folder'),
  });

  const moveItemMutation = useMutation({
    mutationFn: async ({ type, id, targetId }: { type: 'form' | 'folder'; id: number; targetId: number | null }) => {
      if (type === 'form') {
        return webformsApi.updateForm(id, { folder_id: targetId });
      } else {
        return webformsApi.updateFolder(id, { parent_id: targetId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms'] });
      refetchFolders();
      toast.success('Item moved successfully');
      setMoveModal(null);
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to move item'),
  });

  const handleCreateForm = () => {
    if (!newFormTitle.trim()) {
      toast.error('Please enter a form title');
      return;
    }
    createFormMutation.mutate({
      title: newFormTitle,
      description: newFormDescription || undefined,
      folder_id: currentFolderId ? parseInt(currentFolderId) : null,
    });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }
    createFolderMutation.mutate({
      name: newFolderName,
      color: newFolderColor,
      parent_id: currentFolderId ? parseInt(currentFolderId) : null,
    });
  };

  const toggleFormSelection = (formId: number) => {
    setSelectedForms(prev =>
      prev.includes(formId)
        ? prev.filter(id => id !== formId)
        : [...prev, formId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedForms.length === forms.length) {
      setSelectedForms([]);
    } else {
      setSelectedForms(forms.map((f: WebForm) => f.id));
    }
  };

  const handleBulkArchive = () => {
    if (selectedForms.length === 0) return;
    if (!confirm(`Are you sure you want to archive ${selectedForms.length} forms?`)) return;
    Promise.all(selectedForms.map(id => webformsApi.updateForm(id, { status: 'archived' })))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['webforms'] });
        toast.success(`${selectedForms.length} forms archived`);
        setSelectedForms([]);
      })
      .catch(() => toast.error('Failed to archive forms'));
  };

  const handleBulkDelete = () => {
    if (selectedForms.length === 0) return;
    if (!confirm(`Are you sure you want to move ${selectedForms.length} forms to trash?`)) return;
    Promise.all(selectedForms.map(id => webformsApi.updateForm(id, { status: 'trashed' })))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['webforms'] });
        refetchFolders();
        toast.success(`${selectedForms.length} forms moved to trash`);
        setSelectedForms([]);
      })
      .catch(() => toast.error('Failed to delete forms'));
  };

  const handleBulkDuplicate = () => {
    if (selectedForms.length === 0) return;
    toast.promise(
      Promise.all(selectedForms.map(id => webformsApi.duplicateForm(id))),
      {
        loading: 'Duplicating forms...',
        success: () => {
          queryClient.invalidateQueries({ queryKey: ['webforms'] });
          setSelectedForms([]);
          return `${selectedForms.length} forms duplicated`;
        },
        error: 'Failed to duplicate forms'
      }
    );
  };

  const handleBulkStatusChange = (status: 'published' | 'draft' | 'archived') => {
    if (selectedForms.length === 0) return;
    toast.promise(
      Promise.all(selectedForms.map(id => webformsApi.updateForm(id, { status }))),
      {
        loading: `Updating status to ${status}...`,
        success: () => {
          queryClient.invalidateQueries({ queryKey: ['webforms'] });
          setSelectedForms([]);
          return `Status updated for ${selectedForms.length} forms`;
        },
        error: 'Failed to update status'
      }
    );
  };

  const openMoveModal = (type: 'form' | 'folder' | 'bulk-forms', item: WebForm | WebFolder | null) => {
    setMoveModal({ isOpen: true, type, item });
    if (type === 'bulk-forms') {
      setMoveTargetId('root');
    } else if (item) {
      const currentPid = type === 'form'
        ? (item as WebForm).folder_id
        : (item as WebFolder).parent_id;
      setMoveTargetId(currentPid ? currentPid.toString() : 'root');
    }
  };

  const handleMoveSubmit = () => {
    if (!moveModal) return;
    const targetId = moveTargetId === 'root' ? null : parseInt(moveTargetId);

    if (moveModal.type === 'bulk-forms') {
      if (selectedForms.length === 0) {
        setMoveModal(null);
        return;
      }
      toast.promise(
        Promise.all(selectedForms.map(id => webformsApi.updateForm(id, { folder_id: targetId }))),
        {
          loading: 'Moving forms...',
          success: () => {
            queryClient.invalidateQueries({ queryKey: ['webforms'] });
            refetchFolders();
            setMoveModal(null);
            setSelectedForms([]);
            return `${selectedForms.length} forms moved`;
          },
          error: 'Failed to move forms'
        }
      );
      return;
    }

    // Single item move
    if (moveModal.item) {
      // Basic validation
      if (moveModal.type === 'folder' && targetId === moveModal.item.id) {
        toast.error("Cannot move folder into itself");
        return;
      }

      moveItemMutation.mutate({
        type: moveModal.type as 'form' | 'folder',
        id: moveModal.item.id,
        targetId,
      });
    }
  };

  // Data processing
  const forms = formsData?.data || [];
  const folders = foldersData?.data || formsData?.folders || [];

  const currentFolder = currentFolderId ? folders.find(f => f.id === parseInt(currentFolderId)) : null;
  // Breadcrumb logic could be recursive, but 1 level up is fine for now
  const parentFolder = currentFolder?.parent_id ? folders.find(f => f.id === currentFolder.parent_id) : null;

  const filteredFolders = folders.filter(f => {
    if (showAllForms) return false;
    if (currentFolderId) {
      return f.parent_id === parseInt(currentFolderId);
    }
    return !f.parent_id;
  });

  // Calculate recursive form count for a folder (including all subfolders)
  const getRecursiveFormCount = (folderId: number): number => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return 0;

    // Start with direct forms in this folder
    let totalCount = folder.form_count || 0;

    // Add forms from all child folders recursively
    const childFolders = folders.filter(f => f.parent_id === folderId);
    childFolders.forEach(child => {
      totalCount += getRecursiveFormCount(child.id);
    });

    return totalCount;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto p-4 sm:p-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {!showAllForms && (
            <Button variant="outline" size="sm" onClick={() => setShowNewFolderModal(true)} className="bg-background">
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className={`${showAllForms ? "bg-secondary" : "bg-background"}`}
            onClick={() => {
              setShowAllForms(!showAllForms);
            }}
          >
            {showAllForms ? "Show Folders" : "View All Forms"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/50 p-1 rounded-md border mr-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="bg-background h-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => {
            setCreationStep('initial');
            setShowNewFormModal(true);
          }} className="h-9">
            <Plus className="h-4 w-4 mr-2" />
            Create Form
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm bg-muted/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-background">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-background">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {Object.keys(visibleColumns).map(key => (
                  <DropdownMenuItem key={key} onSelect={(e: any) => e.preventDefault()}>
                    <div className="flex items-center space-x-2">
                      <CheckSquare
                        className={`h-4 w-4 ${visibleColumns[key as keyof typeof visibleColumns] ? 'text-primary' : 'text-muted-foreground'}`}
                        onClick={() => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key as keyof typeof visibleColumns] }))}
                      />
                      <span className="capitalize">{key === 'id' ? 'Form ID' : key}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}

      {/* 1. Folders Section */}
      {!showAllForms && filteredFolders.length > 0 && (
        // ... (existing folder mappings) ...
        <div className="space-y-4">
          {/* ... keeping folder section rendering as is or implying it ... */}
          <h2 className="text-lg font-semibold flex items-center">
            <Folder className="h-5 w-5 mr-2" />
            Folders
          </h2>
          {/* ... existing folder grid/list code ... */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredFolders.map((folder: WebFolder) => (
                <div
                  key={folder.id}
                  className="relative flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all text-left group"
                >
                  <div
                    className="absolute inset-0 z-0 cursor-pointer"
                    onClick={() => setSearchParams({ folder: folder.id.toString() })}
                  ></div>

                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 z-10"
                    style={{ backgroundColor: '#000000' }}
                  >
                    <Folder className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 z-10 pointer-events-none">
                    <p className="font-medium text-black truncate group-hover:text-primary transition-colors">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(() => {
                        const directCount = folder.form_count || 0;
                        const totalCount = getRecursiveFormCount(folder.id);
                        return totalCount > directCount
                          ? `${directCount} forms (${totalCount} total)`
                          : `${directCount} forms`;
                      })()}
                    </p>
                  </div>

                  <div className="z-10 bg-background/50 rounded-full">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-black opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openMoveModal('folder', folder)}>
                          <ArrowRightLeft className="h-4 w-4 mr-2" />
                          Move
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm("Are you sure?")) deleteFolderMutation.mutate(folder.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Move to Trash
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFolders.map((folder: WebFolder) => (
                    <TableRow key={`folder-${folder.id}`} className="group cursor-pointer hover:bg-muted/50" onClick={() => setSearchParams({ folder: folder.id.toString() })}>
                      <TableCell>
                        <Folder className="h-5 w-5 text-black fill-black" />
                      </TableCell>
                      <TableCell className="font-medium text-black">{folder.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">Folder</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {getRecursiveFormCount(folder.id)} forms
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-black">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openMoveModal('folder', folder)}>
                                <ArrowRightLeft className="h-4 w-4 mr-2" />
                                Move
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm("Are you sure? All forms inside will be unlinked.")) deleteFolderMutation.mutate(folder.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Move to Trash
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
          )}
          <div className="my-8 border-t" />
        </div>
      )}

      {/* Bulk Action Bar (Positioned above Forms) */}
      {selectedForms.length > 0 && (
        <div className="sticky top-0 z-10 flex items-center gap-2 p-2 bg-background border rounded-lg mb-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 px-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{selectedForms.length} Selected</span>
          </div>

          <div className="h-4 w-px bg-border mx-2" />

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <Button variant="outline" size="sm" onClick={handleBulkDuplicate}>
              <Copy className="h-3.5 w-3.5 mr-2" />
              Duplicate
            </Button>

            <Button variant="outline" size="sm" onClick={() => openMoveModal('bulk-forms', null)}>
              <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
              Move to Folder
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  Set Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('published')}>
                  Published
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('draft')}>
                  Draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('archived')}>
                  Archived
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-4 w-px bg-border mx-2" />

            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Move to Trash
            </Button>
          </div>

          <div className="flex-1" />

          <Button variant="ghost" size="sm" onClick={() => setSelectedForms([])}>
            Clear Selection
          </Button>
        </div>
      )}

      {/* Forms Table (Grid view bottom) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center">
            <FileTextIcon className="h-5 w-5 mr-2" />
            {showAllForms ? "All Forms" : (currentFolder ? `Forms in ${currentFolder.name}` : "Uncategorized Forms")}
          </h2>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <div className="flex items-center justify-center">
                    <button onClick={toggleSelectAll}>
                      {forms.length > 0 && selectedForms.length === forms.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </TableHead>
                {visibleColumns.name && <TableHead>Name</TableHead>}
                {visibleColumns.id && <TableHead>ID</TableHead>}
                {visibleColumns.folder && <TableHead>Folder</TableHead>}
                {visibleColumns.status && <TableHead>Status</TableHead>}
                {visibleColumns.submissions && <TableHead>Submissions</TableHead>}
                {visibleColumns.views && <TableHead>Views</TableHead>}
                {visibleColumns.conversion && <TableHead>Conv. Rate</TableHead>}
                {visibleColumns.created && <TableHead>Created</TableHead>}
                {visibleColumns.updated && <TableHead>Last Updated</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    {showAllForms ? "No forms found." : (
                      currentFolder ? "No forms in this folder." : "No forms in Home."
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                forms.map((form) => {
                  const conversionRate = form.view_count && form.submission_count
                    ? Math.round((form.submission_count / form.view_count) * 100)
                    : 0;

                  return (
                    <TableRow key={form.id} className={selectedForms.includes(form.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <button onClick={() => toggleFormSelection(form.id)}>
                            {selectedForms.includes(form.id) ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                      {visibleColumns.name && (
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10 text-primary">
                              <FileTextIcon className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <Link
                                to={`/forms/builder/${form.id}`}
                                className="font-medium text-black hover:text-primary hover:underline cursor-pointer"
                              >
                                {form.title}
                              </Link>
                              {form.description && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{form.description}</span>}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.id && (
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {form.id}
                        </TableCell>
                      )}
                      {visibleColumns.folder && (
                        <TableCell>
                          {(() => {
                            const folderId = form.folder_id;
                            const folderName = form.folder_name || (folderId ? folders.find(f => f.id === folderId)?.name : null);

                            return folderName ? (
                              <div
                                className="flex items-center gap-2 text-muted-foreground hover:text-primary cursor-pointer"
                                onClick={() => {
                                  if (folderId) {
                                    setSearchParams({ folder: folderId.toString() });
                                    setShowAllForms(false);
                                  }
                                }}
                              >
                                <Folder className="h-4 w-4" />
                                <span className="text-sm font-medium">{folderName}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-muted-foreground opacity-50">
                                <FolderInput className="h-4 w-4" />
                                <span className="text-sm">Home</span>
                              </div>
                            );
                          })()}
                        </TableCell>
                      )}
                      {visibleColumns.status && <TableCell>{getStatusBadge(form.status)}</TableCell>}
                      {visibleColumns.submissions && (
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <BarChart3 className="h-3 w-3" />
                              <span>{form.submission_count || 0}</span>
                            </div>
                            <Button
                              variant="link"
                              className="h-auto p-0 text-xs text-primary hover:underline"
                              asChild
                            >
                              <Link to={`/forms/submissions/${form.id}`}>View</Link>
                            </Button>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.views && (
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            <span>{form.view_count || 0}</span>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.conversion && (
                        <TableCell>
                          <span className="text-muted-foreground">{conversionRate}%</span>
                        </TableCell>
                      )}
                      {visibleColumns.created && (
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(form.created_at || Date.now()).toLocaleDateString()}
                        </TableCell>
                      )}
                      {visibleColumns.updated && (
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(form.updated_at || form.created_at || Date.now()).toLocaleDateString()}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-black">
                            <Link to={`/forms/builder/${form.id}`}>
                              <Edit3 className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-black">
                            <Link to={`/forms/preview/${form.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-black">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/forms/builder/${form.id}`}>
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/forms/preview/${form.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Preview
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => duplicateFormMutation.mutate(form.id)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openMoveModal('form', form)}>
                                <ArrowRightLeft className="h-4 w-4 mr-2" />
                                Move
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => archiveFormMutation.mutate(form.id)}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm('Are you sure you want to move this form to trash?')) {
                                    deleteFormMutation.mutate(form.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Move to Trash
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>


      {/* Create Form Modal */}
      <Dialog open={showNewFormModal} onOpenChange={setShowNewFormModal}>
        <DialogContent className={creationStep === 'initial' ? "sm:max-w-[600px]" : "sm:max-w-[425px]"}>
          <DialogHeader>
            <DialogTitle>{creationStep === 'initial' ? 'Create New Form' : 'Start from Scratch'}</DialogTitle>
            <DialogDescription>
              {creationStep === 'initial'
                ? 'Choose how you want to start building your form'
                : 'Enter a title and optional description for your new form.'
              }
              {creationStep === 'scratch' && currentFolder && <span className="block mt-1 font-medium text-black">Creating in: {currentFolder.name}</span>}
            </DialogDescription>
          </DialogHeader>

          {creationStep === 'initial' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <div
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group text-center space-y-3"
                onClick={() => setCreationStep('scratch')}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileTextIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Start from Scratch</h3>
                  <p className="text-sm text-muted-foreground mt-1">Build a custom form with a blank canvas</p>
                </div>
              </div>

              <div
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group text-center space-y-3"
                onClick={() => {
                  setShowNewFormModal(false);
                  navigate(`/forms/templates${currentFolderId ? `?folder=${currentFolderId}` : ''}`);
                }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LayoutTemplate className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Choose Template</h3>
                  <p className="text-sm text-muted-foreground mt-1">Select from our pre-built professional templates</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Form Title</Label>
                <Input
                  id="title"
                  placeholder="Enter form title..."
                  value={newFormTitle}
                  onChange={(e) => setNewFormTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter form description..."
                  value={newFormDescription}
                  onChange={(e) => setNewFormDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
            {creationStep === 'scratch' ? (
              <Button variant="ghost" onClick={() => setCreationStep('initial')} className="mr-auto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            ) : (
              <div /> // Spacer
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNewFormModal(false)}>
                Cancel
              </Button>
              {creationStep === 'scratch' && (
                <Button onClick={handleCreateForm} disabled={createFormMutation.isPending}>
                  {createFormMutation.isPending ? 'Creating...' : 'Create Form'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Create Folder Modal */}
      <Dialog open={showNewFolderModal} onOpenChange={setShowNewFolderModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              {currentFolder ? `Create a sub-folder inside "${currentFolder.name}"` : 'Create a new top-level folder'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                placeholder="Enter folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            {/* Removed color picker as per request for black folders only */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={createFolderMutation.isPending}>
              {createFolderMutation.isPending ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Item Modal */}
      <Dialog open={!!moveModal} onOpenChange={(open) => !open && setMoveModal(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Move {moveModal?.type === 'folder' ? 'Folder' : 'Form'}
            </DialogTitle>
            <DialogDescription>
              {moveModal?.item && (
                <>Select destination folder for "{moveModal.type === 'folder' ? (moveModal.item as WebFolder).name : (moveModal.item as WebForm).title}"</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Destination Folder</Label>

              <div className="relative">
                <FolderPicker
                  folders={folders}
                  currentFolderId={moveTargetId}
                  onSelect={(id) => setMoveTargetId(id)}
                  excludeId={
                    moveModal?.type === 'folder' && moveModal.item
                      ? moveModal.item.id
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleMoveSubmit} disabled={moveItemMutation.isPending}>
              {moveItemMutation.isPending ? 'Moving...' : 'Move Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper Interfaces
interface FolderPickerProps {
  folders: WebFolder[];
  currentFolderId: string;
  onSelect: (id: string) => void;
  excludeId?: number;
}

// Recursive Folder Tree Item Component
function FolderTreeItem({
  folder,
  depth = 0,
  folders,
  currentFolderId,
  onSelect,
  expandedIds,
  toggleExpand,
  excludeId
}: {
  folder: WebFolder;
  depth: number;
  folders: WebFolder[];
  currentFolderId: string;
  onSelect: (id: string) => void;
  expandedIds: Set<number>;
  toggleExpand: (id: number) => void;
  excludeId?: number;
}) {
  const children = folders.filter(f => f.parent_id === folder.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(folder.id);
  const isSelected = currentFolderId === folder.id.toString();
  const isDisabled = excludeId === folder.id;

  if (isDisabled) return null;

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
          isSelected && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft: `${(depth * 16) + 8}px` }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(folder.id.toString());
        }}
      >
        <div
          className={cn(
            "p-0.5 rounded-sm hover:bg-muted-foreground/20 mr-1 transition-colors flex items-center justify-center w-5 h-5",
            !hasChildren && "opacity-0 pointer-events-none"
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) toggleExpand(folder.id);
          }}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <Folder className={cn("h-4 w-4 mr-2 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
        <span className="flex-1 truncate text-sm">{folder.name}</span>
        {isSelected && <Check className="ml-auto h-4 w-4 text-primary" />}
      </div>

      {isExpanded && hasChildren && (
        <div className="animate-in slide-in-from-top-1 fade-in duration-200">
          {children.map(child => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              folders={folders}
              currentFolderId={currentFolderId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              excludeId={excludeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Flat Folder Item for Search Results
function FolderSearchItem({
  folder,
  folders,
  currentFolderId,
  onSelect,
}: {
  folder: WebFolder;
  folders: WebFolder[];
  currentFolderId: string;
  onSelect: (id: string) => void;
}) {
  // Build breadcrumb path
  const path: string[] = [];
  let current = folder;
  while (current.parent_id) {
    const parent = folders.find(f => f.id === current.parent_id);
    if (parent) {
      path.unshift(parent.name);
      current = parent;
    } else {
      break;
    }
  }

  const isSelected = currentFolderId === folder.id.toString();

  return (
    <div
      className={cn(
        "flex items-center px-2 py-2 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
        isSelected && "bg-accent text-accent-foreground"
      )}
      onClick={() => onSelect(folder.id.toString())}
    >
      <Folder className={cn("h-4 w-4 mr-2 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium truncate">{folder.name}</span>
        {path.length > 0 && (
          <span className="text-xs text-muted-foreground truncate">
            {path.join(' > ')}
          </span>
        )}
      </div>
      {isSelected && <Check className="ml-auto h-4 w-4 text-primary" />}
    </div>
  );
}

// Main Folder Picker Component
function FolderPicker({ folders, currentFolderId, onSelect, excludeId }: FolderPickerProps) {
  const [open, setOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedFolder = currentFolderId === 'root'
    ? { name: 'Home (Root)' }
    : folders.find(f => f.id.toString() === currentFolderId);

  const rootFolders = folders.filter(f => !f.parent_id);

  // Search logic
  const filteredFolders = search.trim()
    ? folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) && f.id !== excludeId)
    : [];

  return (
    <Popover open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) setSearch(''); // Reset search on close
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center truncate">
            {currentFolderId === 'root' ? (
              <FolderInput className="mr-2 h-4 w-4 opacity-50" />
            ) : (
              <Folder className="mr-2 h-4 w-4 opacity-50" />
            )}
            {selectedFolder ? selectedFolder.name : "Select folder..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex flex-col w-full bg-popover text-popover-foreground">
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search folders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {/* Search Mode */}
            {search.trim().length > 0 ? (
              <>
                {filteredFolders.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No folder found.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredFolders.map(folder => (
                      <FolderSearchItem
                        key={folder.id}
                        folder={folder}
                        folders={folders}
                        currentFolderId={currentFolderId}
                        onSelect={(id) => {
                          onSelect(id);
                          setOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Tree Mode */}
                <div
                  className={cn(
                    "flex items-center px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors mb-1",
                    currentFolderId === 'root' && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    onSelect('root');
                    setOpen(false);
                  }}
                >
                  <div className="w-5 mr-1" /> {/* Spacer for alignment with chevron */}
                  <FolderInput className={cn("h-4 w-4 mr-2", currentFolderId === 'root' ? "text-primary" : "text-muted-foreground")} />
                  <span className="flex-1 text-sm font-medium">Home (Root)</span>
                  {currentFolderId === 'root' && <Check className="ml-auto h-4 w-4 text-primary" />}
                </div>

                <div className="h-px bg-border my-1" />

                {/* Folder Tree */}
                {rootFolders.map(folder => (
                  <FolderTreeItem
                    key={folder.id}
                    folder={folder}
                    depth={0}
                    folders={folders}
                    currentFolderId={currentFolderId}
                    onSelect={(id) => {
                      onSelect(id);
                      setOpen(false);
                    }}
                    expandedIds={expandedIds}
                    toggleExpand={toggleExpand}
                    excludeId={excludeId}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

