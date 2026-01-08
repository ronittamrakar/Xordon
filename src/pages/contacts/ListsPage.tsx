import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ContactList, LIST_COLORS, LIST_ICONS, FolderTree } from '@/types/list';
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
    DropdownMenuSeparator,
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
    UserCheck,
    Heart,
    Bookmark,
    Folder,
    FolderPlus,
    FolderOpen,
    Inbox,
    Mail,
    Phone,
    Briefcase,
    Target,
    Flag,
    ChevronRight,
    ChevronDown,
    Upload,
    Download,
    ArrowRight,
    Move,
    Grid3x3,
    ListTree,
    GripVertical
} from 'lucide-react';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    useDraggable,
    useDroppable
} from '@dnd-kit/core';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
    isFolder: false,
    parentId: null,
    campaignType: null,
};

export default function ListsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // List management state
    const [viewMode, setViewMode] = useState<'grid' | 'tree' | 'table'>('grid');
    const [search, setSearch] = useState('');
    const [campaignTypeFilter, setCampaignTypeFilter] = useState<'all' | 'email' | 'sms' | 'call'>('all');
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
    const [viewingListId, setViewingListId] = useState<string | null>(null);

    // Dialogs state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
    const [isMoveItemFolderDialogOpen, setIsMoveItemFolderDialogOpen] = useState(false);
    const [isAddContactsDialogOpen, setIsAddContactsDialogOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

    // Selected item for move/edit
    const [movingItemId, setMovingItemId] = useState<string | null>(null);
    const [moveTargetFolderId, setMoveTargetFolderId] = useState<string | null>(null);
    const [editingList, setEditingList] = useState<ContactList | null>(null);
    const [listForm, setListForm] = useState<Partial<ContactList>>(defaultListForm);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadTargetListId, setUploadTargetListId] = useState<string | null>(null);
    const [createNewListOnUpload, setCreateNewListOnUpload] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [moveTargetListId, setMoveTargetListId] = useState<string | null>(null);
    const [addContactsListId, setAddContactsListId] = useState<string | null>(null);
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
    const [isBulkMove, setIsBulkMove] = useState(false);
    const [addContactSearch, setAddContactSearch] = useState('');
    const [viewListSearch, setViewListSearch] = useState('');
    const [viewListName, setViewListName] = useState('');
    const [viewListDescription, setViewListDescription] = useState('');

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

    // Fetch all contacts for adding to lists
    const { data: allContactsData, isLoading: isLoadingAllContacts } = useQuery({
        queryKey: ['contacts'],
        queryFn: () => api.getContacts(),
        enabled: isAddContactsDialogOpen,
    });

    const allContacts = allContactsData || [];

    // Sync view list details
    useEffect(() => {
        if (viewingListId) {
            const list = lists.find(l => l.id === viewingListId);
            if (list) {
                setViewListName(list.name);
                setViewListDescription(list.description || '');
            }
        }
    }, [viewingListId, lists]);

    const handleSaveListDetails = () => {
        if (viewingListId && viewListName.trim()) {
            updateMutation.mutate({
                id: viewingListId,
                data: {
                    name: viewListName,
                    description: viewListDescription
                }
            });
        }
    };

    // Create list mutation
    const createMutation = useMutation({
        mutationFn: (data: Partial<ContactList>) => api.createList(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['lists'] });
            toast({ title: 'List created successfully' });
            closeDialog();
            return response;
        },
        onError: (error: any) => {
            console.error('Create list error:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to create list';
            toast({ title: errorMessage, variant: 'destructive' });
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

    // Bulk delete mutation
    const bulkDeleteMutation = useMutation({
        mutationFn: async (listIds: string[]) => {
            await Promise.all(listIds.map(id => api.deleteList(id)));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lists'] });
            toast({ title: `${selectedLists.size} items deleted successfully` });
            setSelectedLists(new Set());
            setIsBulkDeleteDialogOpen(false);
        },
        onError: () => {
            toast({ title: 'Failed to delete items', variant: 'destructive' });
        },
    });

    // Bulk move mutation
    const bulkMoveMutation = useMutation({
        mutationFn: async ({ listIds, parentId }: { listIds: string[], parentId: string | null }) => {
            await Promise.all(listIds.map(id => api.updateList(id, { parentId })));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lists'] });
            toast({ title: `${selectedLists.size} items moved successfully` });
            setSelectedLists(new Set());
            setIsMoveItemFolderDialogOpen(false);
            setIsBulkMove(false);
        },
        onError: () => {
            toast({ title: 'Failed to move items', variant: 'destructive' });
        },
    });

    // Bulk update campaign type mutation
    const bulkUpdateCampaignTypeMutation = useMutation({
        mutationFn: async ({ listIds, campaignType }: { listIds: string[], campaignType: 'email' | 'sms' | 'call' | null }) => {
            await Promise.all(listIds.map(id => api.updateList(id, { campaignType })));
        },
        onSuccess: (_, { campaignType }) => {
            queryClient.invalidateQueries({ queryKey: ['lists'] });
            toast({ title: `${selectedLists.size} items categorized as ${campaignType || 'none'}` });
            setSelectedLists(new Set());
        },
        onError: () => {
            toast({ title: 'Failed to update items', variant: 'destructive' });
        },
    });

    // Upload contacts mutation
    const uploadContactsMutation = useMutation({
        mutationFn: async ({ file, listId }: { file: File; listId: string }) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('listId', listId);
            return api.importContacts(formData);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['lists'] });
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            toast({
                title: 'Contacts uploaded successfully',
                description: `${data.imported_count} contacts imported`
            });
            setIsUploadDialogOpen(false);
            setUploadFile(null);
            setUploadTargetListId(null);
            setCreateNewListOnUpload(false);
            setNewListName('');
        },
        onError: () => {
            toast({ title: 'Failed to upload contacts', variant: 'destructive' });
        },
    });

    // Move contacts mutation
    const moveContactsMutation = useMutation({
        mutationFn: async ({ contactIds, targetListId }: { contactIds: string[]; targetListId: string }) => {
            return api.addContactsToList(targetListId, contactIds);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lists'] });
            queryClient.invalidateQueries({ queryKey: ['list-contacts'] });
            toast({ title: 'Contacts moved successfully' });
            setIsMoveDialogOpen(false);
            setSelectedContacts(new Set());
            setMoveTargetListId(null);
        },
        onError: () => {
            toast({ title: 'Failed to move contacts', variant: 'destructive' });
        },
    });

    // Remove contacts mutation
    const removeContactsMutation = useMutation({
        mutationFn: async ({ listId, contactIds }: { listId: string; contactIds: string[] }) => {
            return api.removeContactsFromList(listId, contactIds);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lists'] });
            queryClient.invalidateQueries({ queryKey: ['list-contacts'] });
            toast({ title: 'Contacts removed successfully' });
            setSelectedContacts(new Set());
        },
        onError: () => {
            toast({ title: 'Failed to remove contacts', variant: 'destructive' });
        },
    });

    // Add existing contacts mutation
    const addExistingContactsMutation = useMutation({
        mutationFn: async ({ listId, contactIds }: { listId: string; contactIds: string[] }) => {
            return api.addContactsToList(listId, contactIds);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lists'] });
            queryClient.invalidateQueries({ queryKey: ['list-contacts'] });
            toast({ title: 'Contacts added successfully' });
            setIsAddContactsDialogOpen(false);
            setSelectedContacts(new Set());
            setAddContactsListId(null);
        },
        onError: () => {
            toast({ title: 'Failed to add contacts', variant: 'destructive' });
        },
    });

    // Build folder tree structure
    const folderTree = useMemo(() => {
        const buildTree = (parentId: string | null = null): FolderTree[] => {
            return lists
                .filter(list => (list.parentId || null) == (parentId || null))
                .map(list => ({
                    id: list.id,
                    name: list.name,
                    isFolder: list.isFolder || false,
                    list,
                    children: buildTree(list.id),
                }))
                .sort((a, b) => {
                    // Folders first
                    if (a.isFolder && !b.isFolder) return -1;
                    if (!a.isFolder && b.isFolder) return 1;
                    // Then alphabetical
                    return a.name.localeCompare(b.name);
                });
        };
        return buildTree(null);
    }, [lists]);

    // Filter lists by campaign type
    const filteredLists = useMemo(() => {
        if (campaignTypeFilter === 'all') return lists;
        return lists.filter(list => list.isFolder || list.campaignType === campaignTypeFilter);
    }, [lists, campaignTypeFilter]);

    // Get current folder breadcrumb
    const breadcrumb = useMemo(() => {
        if (!currentFolderId) return [];
        const path: ContactList[] = [];
        let currentId: string | null = currentFolderId;

        while (currentId) {
            const folder = lists.find(l => l.id === currentId);
            if (folder) {
                path.unshift(folder);
                currentId = folder.parentId || null;
            } else {
                break;
            }
        }

        return path;
    }, [currentFolderId, lists]);

    const openCreateDialog = (isFolder: boolean = false, parentId: string | null = null) => {
        setEditingList(null);
        setListForm({
            ...defaultListForm,
            isFolder,
            parentId: parentId || currentFolderId,
        });
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
            isFolder: list.isFolder,
            parentId: list.parentId,
            campaignType: list.campaignType,
        });
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingList(null);
        setListForm(defaultListForm);
    };

    const handleSubmit = async () => {
        if (!listForm.name?.trim()) {
            toast({ title: 'Name is required', variant: 'destructive' });
            return;
        }

        if (editingList) {
            updateMutation.mutate({ id: editingList.id, data: listForm });
        } else {
            createMutation.mutate(listForm);
        }
    };

    const handleUploadContacts = async () => {
        if (!uploadFile) {
            toast({ title: 'Please select a file', variant: 'destructive' });
            return;
        }

        if (createNewListOnUpload) {
            if (!newListName.trim()) {
                toast({ title: 'Please enter a list name', variant: 'destructive' });
                return;
            }

            try {
                const response = await createMutation.mutateAsync({
                    name: newListName,
                    color: '#3b82f6',
                    icon: 'users',
                    isFolder: false,
                    campaignType: campaignTypeFilter !== 'all' ? campaignTypeFilter : null,
                });

                const newListId = response.id;
                uploadContactsMutation.mutate({ file: uploadFile, listId: newListId });
            } catch (error) {
                console.error('Failed to create list:', error);
            }
        } else {
            if (!uploadTargetListId) {
                toast({ title: 'Please select a target list', variant: 'destructive' });
                return;
            }
            uploadContactsMutation.mutate({ file: uploadFile, listId: uploadTargetListId });
        }
    };

    const handleMoveContacts = () => {
        if (selectedContacts.size === 0 || !moveTargetListId) {
            toast({ title: 'Please select contacts and target list', variant: 'destructive' });
            return;
        }
        moveContactsMutation.mutate({
            contactIds: Array.from(selectedContacts),
            targetListId: moveTargetListId
        });
    };

    const handleRemoveContacts = () => {
        if (selectedContacts.size === 0 || !viewingListId) {
            toast({ title: 'Please select contacts to remove', variant: 'destructive' });
            return;
        }
        removeContactsMutation.mutate({
            listId: viewingListId,
            contactIds: Array.from(selectedContacts)
        });
    };

    const handleMoveItemToFolder = () => {
        const targetId = moveTargetFolderId === 'root' ? null : moveTargetFolderId;

        if (isBulkMove) {
            bulkMoveMutation.mutate({
                listIds: Array.from(selectedLists),
                parentId: targetId
            });
        } else {
            if (!movingItemId) return;
            updateMutation.mutate({
                id: movingItemId,
                data: { parentId: targetId }
            });
            setIsMoveItemFolderDialogOpen(false);
            setMovingItemId(null);
        }
    };

    const openBulkMoveDialog = () => {
        setIsBulkMove(true);
        setMovingItemId(null);
        setMoveTargetFolderId(currentFolderId || 'root');
        setIsMoveItemFolderDialogOpen(true);
    };

    const openMoveToFolderDialog = (itemId: string) => {
        setMovingItemId(itemId);
        const item = lists.find(l => l.id === itemId);
        setMoveTargetFolderId(item?.parentId || 'root');
        setIsMoveItemFolderDialogOpen(true);
    };

    const handleBulkDelete = () => {
        if (selectedLists.size === 0) {
            toast({ title: 'Please select lists to delete', variant: 'destructive' });
            return;
        }
        setIsBulkDeleteDialogOpen(true);
    };

    const confirmBulkDelete = () => {
        bulkDeleteMutation.mutate(Array.from(selectedLists));
    };

    const openAddContactsDialog = (listId: string) => {
        setAddContactsListId(listId);
        setIsAddContactsDialogOpen(true);
    };

    const handleAddExistingContacts = () => {
        if (!addContactsListId || selectedContacts.size === 0) {
            toast({ title: 'Please select contacts to add', variant: 'destructive' });
            return;
        }
        addExistingContactsMutation.mutate({
            listId: addContactsListId,
            contactIds: Array.from(selectedContacts)
        });
    };

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    const toggleSelectList = (listId: string) => {
        setSelectedLists(prev => {
            const next = new Set(prev);
            if (next.has(listId)) {
                next.delete(listId);
            } else {
                next.add(listId);
            }
            return next;
        });
    };

    const toggleSelectAllLists = () => {
        const currentLists = filteredLists.filter(list => list.parentId === currentFolderId);
        if (selectedLists.size === currentLists.length) {
            setSelectedLists(new Set());
        } else {
            setSelectedLists(new Set(currentLists.map(l => l.id)));
        }
    };

    const getIconComponent = (iconName: string) => {
        return ICON_MAP[iconName] || Users;
    };

    const DraggableTreeNode = ({
        node,
        depth,
        children,
        isExpanded,
        onToggle,
        onSelect,
        onEdit,
        onDelete,
        onMove,
        onAddList,
        onAddFolder
    }: {
        node: FolderTree;
        depth: number;
        children?: React.ReactNode;
        isExpanded: boolean;
        onToggle: (id: string) => void;
        onSelect: (node: FolderTree) => void;
        onEdit: (list: ContactList) => void;
        onDelete: (id: string) => void;
        onMove: (id: string) => void;
        onAddList: (parentId: string) => void;
        onAddFolder: (parentId: string) => void;
    }) => {
        const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
            id: node.id,
            data: { type: 'item', node }
        });

        const { setNodeRef: setDroppableRef, isOver } = useDroppable({
            id: node.id,
            data: { type: 'folder', node },
            disabled: !node.isFolder
        });

        const IconComponent = node.list ? getIconComponent(node.list.icon) : (isExpanded ? FolderOpen : Folder);
        const hasChildren = node.children.length > 0;

        return (
            <div ref={setDroppableRef} className={cn("select-none", isOver && "bg-primary/10 rounded-lg")}>
                <div
                    ref={setDraggableRef}
                    className={cn(
                        "flex items-center gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer group transition-colors",
                        isDragging && "opacity-50 grayscale",
                    )}
                    style={{ paddingLeft: `${depth * 20 + 8}px` }}
                >
                    <div {...attributes} {...listeners} className="p-1 hover:bg-accent rounded cursor-grab active:cursor-grabbing text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-4 w-4" />
                    </div>

                    {node.isFolder && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggle(node.id);
                            }}
                            className="p-1 hover:bg-accent-foreground/10 rounded"
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </button>
                    )}
                    {!node.isFolder && <div className="w-6" />}

                    <div
                        className="flex-1 flex items-center gap-2"
                        onClick={() => onSelect(node)}
                    >
                        <div
                            className="p-1.5 rounded"
                            style={{ backgroundColor: node.list ? `${node.list.color}20` : '#f3f4f620' }}
                        >
                            <IconComponent
                                className="h-4 w-4"
                                style={{ color: node.list?.color || '#6b7280' }}
                            />
                        </div>
                        <span className="font-medium">{node.name}</span>
                        {node.list && !node.isFolder && (
                            <Badge variant="secondary" className="ml-auto">
                                {node.list.contactCount}
                            </Badge>
                        )}
                        {node.list?.campaignType && (
                            <Badge variant="outline" className="text-xs">
                                {node.list.campaignType}
                            </Badge>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {node.isFolder && (
                                <>
                                    <DropdownMenuItem onClick={() => onAddList(node.id)}>
                                        <List className="h-4 w-4 mr-2" />
                                        New List
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onAddFolder(node.id)}>
                                        <FolderPlus className="h-4 w-4 mr-2" />
                                        New Subfolder
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuItem onClick={() => node.list && onEdit(node.list)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onMove(node.id)}>
                                <Move className="h-4 w-4 mr-2" />
                                Move to Folder
                            </DropdownMenuItem>
                            {!node.list?.isDefault && (
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => onDelete(node.id)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {isExpanded && children}
            </div>
        );
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);

        if (over && active.id !== over.id) {
            const activeNode = lists.find(l => l.id === active.id);
            const overNode = lists.find(l => l.id === over.id);

            // Only allow dropping into folders
            if (overNode?.isFolder) {
                // Prevent cyclic nesting
                let current: ContactList | undefined = overNode;
                let isCyclic = false;
                while (current && current.parentId) {
                    if (current.parentId === active.id) {
                        isCyclic = true;
                        break;
                    }
                    current = lists.find(l => l.id === current?.parentId);
                }

                if (!isCyclic) {
                    updateMutation.mutate({
                        id: active.id as string,
                        data: { parentId: over.id as string }
                    });
                } else {
                    toast({ title: "Cannot move a folder into its own subfolder", variant: "destructive" });
                }
            }
        }
    };

    const renderTreeNode = (node: FolderTree, depth: number = 0) => {
        const isExpanded = expandedFolders.has(node.id);

        return (
            <DraggableTreeNode
                key={node.id}
                node={node}
                depth={depth}
                isExpanded={isExpanded}
                onToggle={toggleFolder}
                onSelect={(n) => {
                    if (n.isFolder) {
                        setCurrentFolderId(n.id);
                    } else {
                        setViewingListId(n.id);
                    }
                }}
                onEdit={openEditDialog}
                onDelete={setDeleteConfirmId}
                onMove={openMoveToFolderDialog}
                onAddList={(pid) => openCreateDialog(false, pid)}
                onAddFolder={(pid) => openCreateDialog(true, pid)}
            >
                {node.children.map(child => renderTreeNode(child, depth + 1))}
            </DraggableTreeNode>
        );
    };

    const renderGridView = () => {
        const currentItems = filteredLists.filter(list => (list.parentId || null) == (currentFolderId || null));
        const folders = currentItems.filter(item => item.isFolder);
        const listsOnly = currentItems.filter(item => !item.isFolder);

        if (currentItems.length === 0) {
            return (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No items found</h3>
                        <p className="text-muted-foreground mb-4">
                            {search ? 'Try a different search term' : 'Create your first folder or list to organize contacts'}
                        </p>
                        {!search && (
                            <div className="flex gap-2">
                                <Button onClick={() => openCreateDialog(false)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create List
                                </Button>
                                <Button variant="outline" onClick={() => openCreateDialog(true)}>
                                    <FolderPlus className="h-4 w-4 mr-2" />
                                    Create Folder
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            );
        }

        const renderItem = (list: ContactList) => {
            const IconComponent = getIconComponent(list.icon);
            const isSelected = selectedLists.has(list.id);

            return (
                <Card
                    key={list.id}
                    className={cn(
                        "cursor-pointer hover:shadow-md transition-all",
                        isSelected && "ring-2 ring-primary"
                    )}
                    onClick={() => {
                        if (list.isFolder) {
                            setCurrentFolderId(list.id);
                        } else {
                            setViewingListId(list.id);
                        }
                    }}
                >
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                        toggleSelectList(list.id);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-1"
                                />
                                <div
                                    className="p-2 rounded-lg"
                                    style={{ backgroundColor: `${list.color}20` }}
                                >
                                    {list.isFolder ? (
                                        <FolderOpen className="h-5 w-5" style={{ color: list.color }} />
                                    ) : (
                                        <IconComponent className="h-5 w-5" style={{ color: list.color }} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-base flex items-center gap-2 truncate">
                                        {list.name}
                                        {list.isDefault && (
                                            <Badge variant="secondary" className="text-xs">
                                                Default
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    {list.description && (
                                        <CardDescription className="text-sm mt-1 line-clamp-1">
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
                                    {list.isFolder && (
                                        <>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openCreateDialog(false, list.id); }}>
                                                <List className="h-4 w-4 mr-2" />
                                                New List
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openCreateDialog(true, list.id); }}>
                                                <FolderPlus className="h-4 w-4 mr-2" />
                                                New Subfolder
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </>
                                    )}
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(list); }}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openMoveToFolderDialog(list.id); }}>
                                        <Move className="h-4 w-4 mr-2" />
                                        Move to Folder
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
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {list.isFolder ? (
                                <>
                                    <div className="flex items-center gap-1">
                                        <Folder className="h-4 w-4" />
                                        <span>{list.childCount || 0} items</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        <span>{list.contactCount} contacts</span>
                                    </div>
                                    {list.campaignType && (
                                        <Badge variant="outline" className="text-xs">
                                            {list.campaignType}
                                        </Badge>
                                    )}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            );
        };

        return (
            <div className="space-y-4">
                {folders.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Folder className="h-5 w-5 text-muted-foreground" />
                            <h2 className="text-lg font-semibold">Folders ({folders.length})</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {folders.map(renderItem)}
                        </div>
                    </div>
                )}

                {listsOnly.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <List className="h-5 w-5 text-muted-foreground" />
                            <h2 className="text-lg font-semibold">Lists ({listsOnly.length})</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {listsOnly.map(renderItem)}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderTableView = () => {
        const currentItems = filteredLists.filter(list => (list.parentId || null) == (currentFolderId || null));
        const folders = currentItems.filter(item => item.isFolder);
        const listsOnly = currentItems.filter(item => !item.isFolder);

        if (currentItems.length === 0) {
            return (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No items found</h3>
                        <p className="text-muted-foreground mb-4">
                            {search ? 'Try a different search term' : 'Create your first folder or list to organize contacts'}
                        </p>
                        {!search && (
                            <div className="flex gap-2">
                                <Button onClick={() => openCreateDialog(false)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create List
                                </Button>
                                <Button variant="outline" onClick={() => openCreateDialog(true)}>
                                    <FolderPlus className="h-4 w-4 mr-2" />
                                    Create Folder
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            );
        }

        const renderTableRows = (items: ContactList[]) => (
            <tbody className="[&_tr:last-child]:border-0">
                {items.map((list) => {
                    const IconComponent = getIconComponent(list.icon);
                    const isSelected = selectedLists.has(list.id);

                    return (
                        <tr
                            key={list.id}
                            className={cn(
                                "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer",
                                isSelected && "bg-muted"
                            )}
                            onClick={() => {
                                if (list.isFolder) {
                                    setCurrentFolderId(list.id);
                                } else {
                                    setViewingListId(list.id);
                                }
                            }}
                        >
                            <td className="p-4 align-middle" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleSelectList(list.id)}
                                />
                            </td>
                            <td className="p-4 align-middle">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="p-2 rounded-lg"
                                        style={{ backgroundColor: `${list.color}20` }}
                                    >
                                        {list.isFolder ? (
                                            <FolderOpen className="h-4 w-4" style={{ color: list.color }} />
                                        ) : (
                                            <IconComponent className="h-4 w-4" style={{ color: list.color }} />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium flex items-center gap-2">
                                            {list.name}
                                            {list.isDefault && (
                                                <Badge variant="secondary" className="text-[12px] h-4">
                                                    Default
                                                </Badge>
                                            )}
                                        </span>
                                        {list.description && (
                                            <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                                                {list.description}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 align-middle">
                                {list.isFolder ? (
                                    <Badge variant="outline">Folder</Badge>
                                ) : list.campaignType ? (
                                    <Badge variant="outline" className="capitalize">
                                        {list.campaignType}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground text-xs">—</span>
                                )}
                            </td>
                            <td className="p-4 align-middle">
                                {list.isFolder ? (
                                    <span className="text-muted-foreground text-xs">{list.childCount || 0} items</span>
                                ) : (
                                    <span className="text-sm">{list.contactCount} contacts</span>
                                )}
                            </td>
                            <td className="p-4 align-middle">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {list.isFolder && (
                                            <>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openCreateDialog(false, list.id); }}>
                                                    <List className="h-4 w-4 mr-2" />
                                                    New List
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openCreateDialog(true, list.id); }}>
                                                    <FolderPlus className="h-4 w-4 mr-2" />
                                                    New Subfolder
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                            </>
                                        )}
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(list); }}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openMoveToFolderDialog(list.id); }}>
                                            <Move className="h-4 w-4 mr-2" />
                                            Move to Folder
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
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        );

        return (
            <div className="space-y-4">
                {folders.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Folder className="h-5 w-5 text-muted-foreground" />
                            <h2 className="text-lg font-semibold">Folders ({folders.length})</h2>
                        </div>
                        <Card>
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[50px]">
                                                <Checkbox
                                                    checked={selectedLists.size === folders.length && folders.length > 0}
                                                    onCheckedChange={() => {
                                                        if (selectedLists.size === folders.length) {
                                                            setSelectedLists(new Set());
                                                        } else {
                                                            setSelectedLists(new Set(folders.map(f => f.id)));
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Items</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">Actions</th>
                                        </tr>
                                    </thead>
                                    {renderTableRows(folders)}
                                </table>
                            </div>
                        </Card>
                    </div>
                )}

                {listsOnly.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <List className="h-5 w-5 text-muted-foreground" />
                            <h2 className="text-lg font-semibold">Lists ({listsOnly.length})</h2>
                        </div>
                        <Card>
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[50px]">
                                                <Checkbox
                                                    checked={selectedLists.size === listsOnly.length && listsOnly.length > 0}
                                                    onCheckedChange={() => {
                                                        if (selectedLists.size === listsOnly.length) {
                                                            setSelectedLists(new Set());
                                                        } else {
                                                            setSelectedLists(new Set(listsOnly.map(l => l.id)));
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Campaign Type</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contacts</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">Actions</th>
                                        </tr>
                                    </thead>
                                    {renderTableRows(listsOnly)}
                                </table>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        );
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
                        <h1 className="text-2xl font-bold">Contact Lists</h1>
                        <p className="text-muted-foreground mt-1">
                            Organize contacts into lists for email, SMS, and call campaigns
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Contacts
                        </Button>
                        <Button variant="outline" onClick={() => openCreateDialog(true)}>
                            <FolderPlus className="h-4 w-4 mr-2" />
                            New Folder
                        </Button>
                        <Button onClick={() => openCreateDialog(false)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New List
                        </Button>
                    </div>
                </div>

                {/* Breadcrumb */}
                {breadcrumb.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentFolderId(null)}
                            className="h-8"
                        >
                            <Folder className="h-4 w-4 mr-1" />
                            Root
                        </Button>
                        {breadcrumb.map((folder) => (
                            <React.Fragment key={folder.id}>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentFolderId(folder.id)}
                                    className="h-8"
                                >
                                    {folder.name}
                                </Button>
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* Filters and Search */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="relative flex-1 min-w-[200px] max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search lists..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            <div className="ml-auto flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                                <Button
                                    variant={campaignTypeFilter === 'all' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setCampaignTypeFilter('all')}
                                    className="h-8"
                                >
                                    All
                                </Button>
                                <Button
                                    variant={campaignTypeFilter === 'email' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setCampaignTypeFilter('email')}
                                    className="h-8"
                                >
                                    <Mail className="h-4 w-4 mr-1" />
                                    Email
                                </Button>
                                <Button
                                    variant={campaignTypeFilter === 'sms' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setCampaignTypeFilter('sms')}
                                    className="h-8"
                                >
                                    <Phone className="h-4 w-4 mr-1" />
                                    SMS
                                </Button>
                                <Button
                                    variant={campaignTypeFilter === 'call' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setCampaignTypeFilter('call')}
                                    className="h-8"
                                >
                                    <Phone className="h-4 w-4 mr-1" />
                                    Call
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bulk Actions */}
                {selectedLists.size > 0 && (
                    <Card className="border-primary">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selectedLists.size > 0}
                                        onCheckedChange={toggleSelectAllLists}
                                    />
                                    <span className="text-sm font-medium">
                                        {selectedLists.size} list(s) selected
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={openBulkMoveDialog}
                                    >
                                        <Move className="h-4 w-4 mr-1" />
                                        Move Selected
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                Mark as... <ChevronDown className="ml-1 h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => bulkUpdateCampaignTypeMutation.mutate({ listIds: Array.from(selectedLists), campaignType: 'email' })}>
                                                <Mail className="h-4 w-4 mr-2 text-blue-500" />
                                                Email Campaign
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => bulkUpdateCampaignTypeMutation.mutate({ listIds: Array.from(selectedLists), campaignType: 'sms' })}>
                                                <Phone className="h-4 w-4 mr-2 text-green-500" />
                                                SMS Campaign
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => bulkUpdateCampaignTypeMutation.mutate({ listIds: Array.from(selectedLists), campaignType: 'call' })}>
                                                <Phone className="h-4 w-4 mr-2 text-orange-500" />
                                                Call Campaign
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => bulkUpdateCampaignTypeMutation.mutate({ listIds: Array.from(selectedLists), campaignType: null })}>
                                                Remove Category
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedLists(new Set())}
                                    >
                                        Clear Selection
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleBulkDelete}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete Selected
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Lists Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    renderTableView()
                )}

                {/* Create/Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {listForm.isFolder ? <FolderPlus className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                                {editingList
                                    ? `Edit ${listForm.isFolder ? 'Folder' : 'List'}`
                                    : `Create ${listForm.isFolder ? 'Folder' : 'List'}`}
                            </DialogTitle>
                            <DialogDescription>
                                {editingList
                                    ? `Update your ${listForm.isFolder ? 'folder' : 'list'} information`
                                    : `Add a new ${listForm.isFolder ? 'folder' : 'list'} to organize your workspace`}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{listForm.isFolder ? 'Folder' : 'List'} Name *</Label>
                                <Input
                                    id="name"
                                    value={listForm.name || ''}
                                    onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
                                    placeholder={listForm.isFolder ? 'e.g., Email Campaigns' : 'e.g., VIP Customers'}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={listForm.description || ''}
                                    onChange={(e) => setListForm({ ...listForm, description: e.target.value })}
                                    placeholder="Brief description..."
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Parent Folder</Label>
                                <Select
                                    value={listForm.parentId || 'root'}
                                    onValueChange={(value) => setListForm({
                                        ...listForm,
                                        parentId: value === 'root' ? null : value
                                    })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select parent folder" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="root">Root (No Folder)</SelectItem>
                                        {lists
                                            .filter(l => l.isFolder && l.id !== editingList?.id) // Prevent self-nesting
                                            .map(folder => (
                                                <SelectItem key={folder.id} value={folder.id}>
                                                    {folder.name}
                                                </SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </div>

                            {!listForm.isFolder && (
                                <div className="space-y-2">
                                    <Label>Campaign Type</Label>
                                    <Select
                                        value={listForm.campaignType || 'none'}
                                        onValueChange={(value) => setListForm({
                                            ...listForm,
                                            campaignType: value === 'none' ? null : value as 'email' | 'sms' | 'call'
                                        })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="sms">SMS</SelectItem>
                                            <SelectItem value="call">Call</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

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
                    <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
                        <DialogHeader>
                            <div className="flex items-center justify-between pr-8 border-b pb-4 mb-4">
                                <div className="space-y-1 flex-1 max-w-xl">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={viewListName}
                                            onChange={(e) => setViewListName(e.target.value)}
                                            className="text-xl font-semibold h-9 px-2 -ml-2 border-transparent hover:border-input focus:border-input transition-colors bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:border shadow-none w-full"
                                            placeholder="List Name"
                                        />
                                        <Badge variant="outline" className="shrink-0 h-6">
                                            {lists.find(l => l.id === viewingListId)?.contactCount || 0} Contacts
                                        </Badge>
                                    </div>
                                    <Input
                                        value={viewListDescription}
                                        onChange={(e) => setViewListDescription(e.target.value)}
                                        className="text-sm text-muted-foreground h-7 px-2 -ml-2 border-transparent hover:border-input focus:border-input transition-colors bg-transparent border-0 ring-0 focus-visible:ring-1 focus-visible:border shadow-none placeholder:text-muted-foreground/50"
                                        placeholder="Add a description..."
                                    />
                                </div>
                                <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => viewingListId && openAddContactsDialog(viewingListId)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Contacts
                                    </Button>
                                    <div className="w-px h-4 bg-border" />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => queryClient.invalidateQueries({ queryKey: ['list-contacts', viewingListId] })}
                                    >
                                        <Loader2 className={cn("h-4 w-4", isLoadingContacts && "animate-spin")} />
                                    </Button>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search in this list..."
                                        className="pl-9"
                                        value={viewListSearch}
                                        onChange={(e) => setViewListSearch(e.target.value)}
                                    />
                                </div>

                                {selectedContacts.size > 0 && (
                                    <div className="flex items-center gap-2 ml-auto bg-accent/50 p-2 rounded-lg border">
                                        <span className="text-sm font-medium px-2">
                                            {selectedContacts.size} selected
                                        </span>
                                        <div className="h-4 w-px bg-border mx-1" />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setIsMoveDialogOpen(true)}
                                        >
                                            <Move className="h-4 w-4 mr-2" />
                                            Move
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive"
                                            onClick={handleRemoveContacts}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Remove
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto border rounded-md">
                                {isLoadingContacts ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : !listContactsData?.contacts?.length ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                        <Users className="h-12 w-12 mb-4 opacity-20" />
                                        <p className="font-medium">No contacts in this list yet</p>
                                        <p className="text-sm mt-1">Add contacts to get started</p>
                                        <Button
                                            variant="outline"
                                            className="mt-4"
                                            onClick={() => viewingListId && openAddContactsDialog(viewingListId)}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Contacts
                                        </Button>
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-background sticky top-0 z-10 shadow-sm">
                                            <tr className="border-b">
                                                <th className="p-4 w-[50px]">
                                                    <Checkbox
                                                        checked={selectedContacts.size === listContactsData.contacts.length && listContactsData.contacts.length > 0}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedContacts(new Set(listContactsData.contacts.map((c: any) => c.id)));
                                                            } else {
                                                                setSelectedContacts(new Set());
                                                            }
                                                        }}
                                                    />
                                                </th>
                                                <th className="p-4 text-left font-medium text-muted-foreground">Name</th>
                                                <th className="p-4 text-left font-medium text-muted-foreground">Email</th>
                                                <th className="p-4 text-left font-medium text-muted-foreground">Company</th>
                                                <th className="p-4 text-left font-medium text-muted-foreground">Phone</th>
                                                <th className="p-4 text-left font-medium text-muted-foreground">Added</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {listContactsData.contacts
                                                .filter((contact: any) => {
                                                    if (!viewListSearch.trim()) return true;
                                                    const searchLower = viewListSearch.toLowerCase();
                                                    return (
                                                        (contact.firstName?.toLowerCase() || '').includes(searchLower) ||
                                                        (contact.lastName?.toLowerCase() || '').includes(searchLower) ||
                                                        (contact.email?.toLowerCase() || '').includes(searchLower)
                                                    );
                                                })
                                                .map((contact: any) => (
                                                    <tr
                                                        key={contact.id}
                                                        className={cn(
                                                            "hover:bg-muted/50 transition-colors",
                                                            selectedContacts.has(contact.id) && "bg-muted"
                                                        )}
                                                    >
                                                        <td className="p-4">
                                                            <Checkbox
                                                                checked={selectedContacts.has(contact.id)}
                                                                onCheckedChange={(checked) => {
                                                                    setSelectedContacts(prev => {
                                                                        const next = new Set(prev);
                                                                        if (checked) {
                                                                            next.add(contact.id);
                                                                        } else {
                                                                            next.delete(contact.id);
                                                                        }
                                                                        return next;
                                                                    });
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="font-medium">
                                                                {contact.firstName} {contact.lastName}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-muted-foreground">{contact.email}</td>
                                                        <td className="p-4 text-muted-foreground">
                                                            {contact.company && (
                                                                <Badge variant="secondary" className="font-normal">
                                                                    {contact.company}
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-muted-foreground">{contact.phone || '—'}</td>
                                                        <td className="p-4 text-muted-foreground">
                                                            {new Date(contact.createdAt || Date.now()).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="mt-4 border-t pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setViewingListId(null);
                                    setSelectedContacts(new Set());
                                }}
                            >
                                Close
                            </Button>
                            <Button
                                onClick={handleSaveListDetails}
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add Contacts Dialog */}
                <Dialog open={isAddContactsDialogOpen} onOpenChange={setIsAddContactsDialogOpen}>
                    <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Add Contacts to List</DialogTitle>
                            <DialogDescription>
                                Select contacts to add to {lists.find(l => l.id === addContactsListId)?.name}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 py-4">
                            <Input
                                placeholder="Search contacts to add..."
                                value={addContactSearch}
                                onChange={(e) => setAddContactSearch(e.target.value)}
                            />

                            <div className="flex-1 overflow-y-auto border rounded-md">
                                {isLoadingAllContacts ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {allContacts
                                            .filter((contact: any) => {
                                                // Filter out existing contacts if we have that data
                                                if (addContactsListId === viewingListId && listContactsData?.contacts) {
                                                    const isExisting = listContactsData.contacts.some((c: any) => c.id === contact.id);
                                                    if (isExisting) return false;
                                                }

                                                // Filter by search term
                                                if (!addContactSearch.trim()) return true;
                                                const searchLower = addContactSearch.toLowerCase();
                                                return (
                                                    (contact.firstName?.toLowerCase() || '').includes(searchLower) ||
                                                    (contact.lastName?.toLowerCase() || '').includes(searchLower) ||
                                                    (contact.email?.toLowerCase() || '').includes(searchLower)
                                                );
                                            })
                                            .map((contact: any) => (
                                                <div
                                                    key={contact.id}
                                                    className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                                                >
                                                    <Checkbox
                                                        checked={selectedContacts.has(contact.id)}
                                                        onCheckedChange={(checked) => {
                                                            setSelectedContacts(prev => {
                                                                const next = new Set(prev);
                                                                if (checked) {
                                                                    next.add(contact.id);
                                                                } else {
                                                                    next.delete(contact.id);
                                                                }
                                                                return next;
                                                            });
                                                        }}
                                                    />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">
                                                            {contact.firstName} {contact.lastName}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">{contact.email}</p>
                                                    </div>
                                                    {contact.company && (
                                                        <Badge variant="outline" className="text-xs font-normal">
                                                            {contact.company}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        {allContacts.length === 0 && (
                                            <div className="p-8 text-center text-muted-foreground">
                                                No contacts found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setIsAddContactsDialogOpen(false);
                                setSelectedContacts(new Set());
                            }}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddExistingContacts}
                                disabled={selectedContacts.size === 0 || addExistingContactsMutation.isPending}
                            >
                                {addExistingContactsMutation.isPending && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Add {selectedContacts.size} Contact{selectedContacts.size !== 1 && 's'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Upload Contacts Dialog */}
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload Contacts</DialogTitle>
                            <DialogDescription>
                                Upload a CSV file to add contacts to a list
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>CSV File</Label>
                                <Input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={createNewListOnUpload}
                                        onCheckedChange={(checked) => setCreateNewListOnUpload(checked as boolean)}
                                    />
                                    <Label className="cursor-pointer">Create a new list</Label>
                                </div>
                            </div>

                            {createNewListOnUpload ? (
                                <div className="space-y-2">
                                    <Label>New List Name</Label>
                                    <Input
                                        placeholder="e.g., Imported Contacts"
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Select Existing List</Label>
                                    <Select
                                        value={uploadTargetListId || ''}
                                        onValueChange={setUploadTargetListId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a list..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {lists.filter(l => !l.isFolder).map(list => (
                                                <SelectItem key={list.id} value={list.id}>
                                                    {list.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUploadContacts}
                                disabled={uploadContactsMutation.isPending}
                            >
                                {uploadContactsMutation.isPending && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Upload
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Move Contacts Dialog */}
                <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Move Contacts</DialogTitle>
                            <DialogDescription>
                                Select a list to move {selectedContacts.size} contact(s) to
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Target List</Label>
                                <Select
                                    value={moveTargetListId || ''}
                                    onValueChange={setMoveTargetListId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a list..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lists.filter(l => !l.isFolder && l.id !== viewingListId).map(list => (
                                            <SelectItem key={list.id} value={list.id}>
                                                {list.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleMoveContacts}
                                disabled={moveContactsMutation.isPending}
                            >
                                {moveContactsMutation.isPending && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Move
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Move Item to Folder Dialog */}
                <Dialog open={isMoveItemFolderDialogOpen} onOpenChange={setIsMoveItemFolderDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Move to Folder</DialogTitle>
                            <DialogDescription>
                                {isBulkMove
                                    ? `Select a destination folder for the ${selectedLists.size} selected items.`
                                    : `Select a destination folder for "${lists.find(l => l.id === movingItemId)?.name}"`
                                }
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Destination Folder</Label>
                                <Select
                                    value={moveTargetFolderId || 'root'}
                                    onValueChange={setMoveTargetFolderId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a folder..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="root">Root (No Folder)</SelectItem>
                                        {lists
                                            .filter(l => l.isFolder && (isBulkMove ? !selectedLists.has(l.id) : l.id !== movingItemId)) // Prevent moving into itself
                                            .map(list => (
                                                <SelectItem key={list.id} value={list.id}>
                                                    {list.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setIsMoveItemFolderDialogOpen(false);
                                setIsBulkMove(false);
                            }}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleMoveItemToFolder}
                                disabled={updateMutation.isPending || bulkMoveMutation.isPending}
                            >
                                {(updateMutation.isPending || bulkMoveMutation.isPending) && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Move
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete {lists.find(l => l.id === deleteConfirmId)?.isFolder ? 'Folder' : 'List'}</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this {lists.find(l => l.id === deleteConfirmId)?.isFolder ? 'folder' : 'list'}?
                                {lists.find(l => l.id === deleteConfirmId)?.isFolder
                                    ? ' All nested lists and folders will also be deleted.'
                                    : ' Contacts will not be deleted, only removed from the list.'}
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

                {/* Bulk Delete Confirmation Dialog */}
                <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Multiple Lists</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete {selectedLists.size} list(s)? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmBulkDelete}
                                disabled={bulkDeleteMutation.isPending}
                            >
                                {bulkDeleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Delete {selectedLists.size} List(s)
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
