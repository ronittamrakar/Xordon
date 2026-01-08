import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
    Image as ImageIcon,
    Video,
    FileText as FileTextIcon,
    Upload,
    Search,
    Grid,
    List,
    Folder,
    FolderPlus,
    Plus,
    MoreVertical,
    Trash2,
    Download,
    Copy,
    Eye,
    Music,
    Paperclip,
    Share2,
    UserPlus,
    Link2,
    Star,
    StarOff,
    Move,
    Edit2,
    ChevronRight,
    Home,
    Clock,
    Users,
    X,
    FileSpreadsheet,
    FileCode,
    FileArchive,
    Filter,
    ArrowUpDown,
    ImageOff,
    FileCode as CodeDisplayIcon,
    Cloud,
    HardDrive,
    RefreshCcw,
    Settings,
    Database
} from 'lucide-react';

import { format } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import FilePreviewModal from '@/components/media/FilePreviewModal';
import FileActivityTimeline from '@/components/media/FileActivityTimeline';
import { Progress } from '@/components/ui/progress';
import { useHotkeys } from 'react-hotkeys-hook';
import { Separator } from '@/components/ui/separator';

interface MediaItem {
    id: string;
    name: string;
    type: 'image' | 'video' | 'document' | 'audio' | 'spreadsheet' | 'code' | 'archive' | 'other';
    url: string;
    size: string;
    uploadedAt: string;
    folder?: string;
    originalSize: number;
    starred?: boolean;
    sharedWith?: string[];
    owner?: string;
    source?: 'local' | 'google_drive' | 'dropbox';
}

interface FolderItem {
    id: string;
    name: string;
    path: string;
    parentId?: string;
    itemCount?: number;
    size?: number;
    createdAt?: string;
    sharedWith?: string[];
    source?: 'local' | 'google_drive' | 'dropbox';
}

type ItemForAction =
    | (MediaItem & { itemType: 'file' })
    | (FolderItem & { itemType: 'folder' });

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const MediaLibrary: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedFolder = searchParams.get('folder');

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isMoveOpen, setIsMoveOpen] = useState(false);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [newFolderName, setNewFolderName] = useState('');
    const [shareEmail, setShareEmail] = useState('');
    const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view');
    const [selectedItemForAction, setSelectedItemForAction] = useState<ItemForAction | null>(null);
    const [filterView, setFilterView] = useState<'all' | 'recent' | 'starred' | 'shared'>('all');
    const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
    const [showActivity, setShowActivity] = useState(false);
    const [activityFileId, setActivityFileId] = useState<string | null>(null);
    const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [renameName, setRenameName] = useState('');
    const [sortField, setSortField] = useState<'name' | 'size' | 'date'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const [activeSource, setActiveSource] = useState<'local' | 'google_drive' | 'dropbox'>('local');
    const [connectedIntegrations, setConnectedIntegrations] = useState<{ google_drive: boolean, dropbox: boolean }>({
        google_drive: false,
        dropbox: false
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Mock initial connection check
    useEffect(() => {
        // Here we would check with backend if integrations are connected
        // For now, assume false or check local storage
        const gd = localStorage.getItem('gd_connected') === 'true';
        const db = localStorage.getItem('db_connected') === 'true';
        setConnectedIntegrations({ google_drive: gd, dropbox: db });
    }, []);

    const connectMutation = useMutation({
        mutationFn: async (type: 'google_drive' | 'dropbox') => {
            if (type === 'google_drive') return api.connectGoogleDrive();
            if (type === 'dropbox') return api.connectDropbox();
            return Promise.reject('Invalid type');
        },
        onSuccess: (data, variables) => {
            toast({ title: 'Connected', description: data.message });
            setConnectedIntegrations(prev => ({ ...prev, [variables]: true }));
            localStorage.setItem(variables === 'google_drive' ? 'gd_connected' : 'db_connected', 'true');
        }
    });

    // Fetch folders
    const { data: foldersResponse, isError: isFoldersError } = useQuery({
        queryKey: ['media-folders', activeSource],
        queryFn: async () => {
            if (activeSource === 'local') return api.getMediaFolders();
            return { data: [] }; // Mock folders for integrations for now
        },
        retry: 1,
        meta: { suppressErrorToast: true }
    });

    // Handle case where API returns unexpected format or fails
    const folders: FolderItem[] = (() => {
        if (!foldersResponse?.data) return [];
        if (!Array.isArray(foldersResponse.data)) return [];

        return foldersResponse.data.map((f: any) => ({
            id: String(f.id),
            name: f.name,
            path: f.name,
            parentId: f.parent_id ? String(f.parent_id) : undefined,
            itemCount: f.file_count || 0,
            size: f.total_size || 0,
            createdAt: f.created_at,
            sharedWith: f.shared_with || [],
            source: 'local'
        }));
    })();

    // Dynamic Breadcrumbs
    const breadcrumbs = useMemo(() => {
        const path: { id: string | null, name: string }[] = [];
        let curId = selectedFolder;

        if (activeSource !== 'local') {
            path.unshift({ id: null, name: activeSource === 'google_drive' ? 'Google Drive' : 'Dropbox' });
            return path;
        }

        while (curId) {
            const folder = folders.find(f => f.id === curId);
            if (folder) {
                path.unshift({ id: folder.id, name: folder.name });
                curId = folder.parentId || null;
            } else {
                curId = null;
            }
        }
        path.unshift({ id: null, name: 'Local Storage' });
        return path;
    }, [selectedFolder, folders, activeSource]);

    const handleFolderClick = (folderId: string | null) => {
        if (folderId) {
            setSearchParams({ folder: folderId });
        } else {
            setSearchParams({});
        }
    };

    // Fetch files
    const { data: filesResponse, isLoading } = useQuery({
        queryKey: ['media-files', selectedFolder, searchQuery, filterView, activeSource],
        queryFn: async () => {
            if (activeSource === 'local') {
                return api.getMediaFiles({
                    folder_id: selectedFolder,
                    q: searchQuery
                });
            } else {
                return api.getIntegrationFiles(activeSource, selectedFolder || undefined);
            }
        },
        retry: 1,
        meta: { suppressErrorToast: true }
    });

    const mediaFiles: MediaItem[] = (() => {
        if (!filesResponse?.data) return [];
        if (!Array.isArray(filesResponse.data)) return [];

        return filesResponse.data.map((file: any) => ({
            id: String(file.id),
            name: file.original_filename || file.filename,
            type: mapCategoryToType(file.category || file.extension || (file.type === 'folder' ? 'other' : 'other')),
            url: file.url || '#',
            size: formatBytes(Number(file.file_size || 0)),
            originalSize: Number(file.file_size || 0),
            uploadedAt: file.created_at ? format(new Date(file.created_at), 'MMM dd, yyyy') : 'Unknown',
            folder: file.folder_id,
            starred: file.starred || false,
            sharedWith: file.shared_with || [],
            owner: file.owner || 'You',
            source: activeSource
        }));
    })();

    // Fetch Storage Quota (only for local)
    const { data: quotaResponse, isError: isQuotaError } = useQuery({
        queryKey: ['storage-quota'],
        queryFn: api.getStorageQuota,
        enabled: activeSource === 'local',
        retry: 1,
        // Handle 404 gracefully for missing quota endpoint
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Don't show errors for quota endpoint - it's optional
        meta: {
            suppressErrorToast: true
        }
    });
    const quota = quotaResponse?.data;

    // Filter files based on view
    const filteredFiles = mediaFiles.filter(file => {
        if (filterView === 'starred') return file.starred;
        if (filterView === 'shared') return file.sharedWith && file.sharedWith.length > 0;
        if (filterView === 'recent') {
            try {
                const fileDate = new Date(file.uploadedAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return fileDate >= weekAgo;
            } catch {
                return false;
            }
        }
        return true;
    }).sort((a, b) => {
        let comparison = 0;
        try {
            if (sortField === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortField === 'size') {
                comparison = a.originalSize - b.originalSize;
            } else if (sortField === 'date') {
                comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
            }
        } catch {
            comparison = 0;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    function mapCategoryToType(categoryOrExt: string): MediaItem['type'] {
        if (!categoryOrExt) return 'other';
        const cat = categoryOrExt.toLowerCase();
        if (['image', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(cat)) return 'image';
        if (['video', 'mp4', 'mov', 'avi', 'webm'].includes(cat)) return 'video';
        if (['audio', 'mp3', 'wav', 'ogg'].includes(cat)) return 'audio';
        if (['document', 'pdf', 'doc', 'docx', 'txt'].includes(cat)) return 'document';
        if (['spreadsheet', 'xls', 'xlsx', 'csv'].includes(cat)) return 'spreadsheet';
        if (['code', 'html', 'css', 'js', 'json', 'ts', 'tsx'].includes(cat)) return 'code';
        if (['archive', 'zip', 'rar', '7z', 'tar'].includes(cat)) return 'archive';
        return 'other';
    }

    const uploadMutation = useMutation({
        mutationFn: async (files: FileList) => {
            const promises = Array.from(files).map(file =>
                api.uploadMediaFile(file, undefined, selectedFolder || undefined)
            );
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media-files'] });
            queryClient.invalidateQueries({ queryKey: ['media-folders'] });
            setIsUploadOpen(false);
            toast({ title: 'Success', description: 'Files uploaded successfully' });
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to upload files', variant: 'destructive' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.deleteMediaFile(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media-files'] });
            queryClient.invalidateQueries({ queryKey: ['media-folders'] });
            queryClient.invalidateQueries({ queryKey: ['storage-quota'] });
            toast({ title: 'Success', description: 'File deleted successfully' });
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to delete file', variant: 'destructive' });
        }
    });

    const toggleStarMutation = useMutation({
        mutationFn: (id: string) => api.toggleMediaFileStar(id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['media-files'] });
            toast({
                title: data.starred ? 'Starred' : 'Unstarred',
                description: data.starred ? 'File added to favorites' : 'File removed from favorites'
            });
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => api.bulkDeleteMediaFiles(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media-files'] });
            queryClient.invalidateQueries({ queryKey: ['media-folders'] });
            queryClient.invalidateQueries({ queryKey: ['storage-quota'] });
            setSelectedItems([]);
            toast({ title: 'Success', description: 'Selected files deleted' });
        }
    });

    const moveMutation = useMutation({
        mutationFn: ({ ids, folder, type }: { ids: string[], folder: string | null, type?: 'file' | 'folder' }) => api.moveMediaFiles(ids, folder, type),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['media-files'] });
            queryClient.invalidateQueries({ queryKey: ['media-folders'] });
            setSelectedItems([]);
            setIsMoveOpen(false);
            toast({ title: 'Success', description: data.message });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message || 'Failed to move items', variant: 'destructive' });
        }
    });

    const createFolderMutation = useMutation({
        mutationFn: (name: string) => api.createMediaFolder(name, selectedFolder || undefined),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media-folders'] });
            setIsNewFolderOpen(false);
            setNewFolderName('');
            toast({ title: 'Success', description: 'Folder created successfully' });
        }
    });

    const shareMutation = useMutation({
        mutationFn: ({ id, email, permission }: { id: string, email: string, permission: 'view' | 'edit' }) =>
            api.shareMediaFile(id, email, permission),
        onSuccess: (data) => {
            setIsShareOpen(false);
            setShareEmail('');
            toast({ title: 'Success', description: data.message });
        }
    });

    const renameMutation = useMutation({
        mutationFn: ({ id, name, type }: { id: string, name: string, type: 'file' | 'folder' }) =>
            type === 'file' ? api.renameMediaFile(id, name) : api.renameMediaFolder(id, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media-files'] });
            queryClient.invalidateQueries({ queryKey: ['media-folders'] });
            setIsRenameOpen(false);
            setRenameName('');
            toast({ title: 'Success', description: 'Item renamed successfully' });
        }
    });

    const deleteFolderMutation = useMutation({
        mutationFn: (id: string) => api.deleteMediaFolder(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media-folders'] });
            toast({ title: 'Success', description: 'Folder deleted successfully' });
        }
    });

    // Keyboard Shortcuts
    useHotkeys('delete', () => {
        if (selectedItems.length > 0) {
            if (confirm(`Delete ${selectedItems.length} items?`)) {
                bulkDeleteMutation.mutate(selectedItems);
            }
        } else if (selectedItemForAction) {
            if (confirm('Delete this file?')) {
                deleteMutation.mutate(selectedItemForAction.id);
            }
        }
    });

    useHotkeys('ctrl+a', (e) => {
        e.preventDefault();
        setSelectedItems(filteredFiles.map(f => f.id));
    });

    useHotkeys('esc', () => {
        setSelectedItems([]);
        setPreviewItem(null);
        setShowActivity(false);
    });

    const handleDragStart = (e: React.DragEvent, id: string, type: 'file' | 'folder' = 'file') => {
        e.dataTransfer.setData('dragId', id);
        e.dataTransfer.setData('dragType', type);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent, folderId: string) => {
        e.preventDefault();
        setDragOverFolder(null);
        const dragId = e.dataTransfer.getData('dragId');
        const dragType = e.dataTransfer.getData('dragType');

        if (dragId && folderId !== selectedFolder && dragId !== folderId) {
            moveMutation.mutate({
                ids: [dragId],
                folder: folderId,
                type: dragType as 'file' | 'folder'
            });
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            uploadMutation.mutate(e.target.files);
        }
    };

    const handleCreateFolder = () => {
        if (newFolderName && newFolderName.trim()) {
            createFolderMutation.mutate(newFolderName.trim());
        }
    };

    const handleShare = () => {
        if (shareEmail && shareEmail.trim() && selectedItemForAction && selectedItemForAction.id) {
            shareMutation.mutate({
                id: selectedItemForAction.id,
                email: shareEmail.trim(),
                permission: sharePermission
            });
        }
    };

    const handleCopyLink = (item: MediaItem) => {
        if (item.url) {
            navigator.clipboard.writeText(item.url);
            toast({ title: 'Success', description: 'Link copied to clipboard' });
        }
    };

    const handleDownload = (item: MediaItem) => {
        if (item.url) {
            window.open(item.url, '_blank');
            toast({ title: 'Success', description: 'Download started' });
        }
    };

    const handleToggleStar = (item: MediaItem) => {
        if (item.id) {
            toggleStarMutation.mutate(item.id);
        }
    };

    const handleBulkDelete = () => {
        if (selectedItems.length > 0) {
            if (confirm(`Delete ${selectedItems.length} item(s)?`)) {
                bulkDeleteMutation.mutate(selectedItems);
            }
        }
    };

    const toggleItemSelection = (id: string) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const getIcon = (type: MediaItem['type']) => {
        switch (type) {
            case 'image': return <ImageIcon className="h-8 w-8 text-slate-500" />;
            case 'video': return <Video className="h-8 w-8 text-slate-500" />;
            case 'document': return <FileTextIcon className="h-8 w-8 text-slate-500" />;
            case 'audio': return <Music className="h-8 w-8 text-slate-500" />;
            case 'spreadsheet': return <FileSpreadsheet className="h-8 w-8 text-slate-500" />;
            case 'code': return <FileCode className="h-8 w-8 text-slate-500" />;
            case 'archive': return <FileArchive className="h-8 w-8 text-slate-500" />;
            default: return <Paperclip className="h-8 w-8 text-slate-500" />;
        }
    };

    const getTypeBadge = (type: MediaItem['type']) => {
        const colors: Record<string, string> = {
            image: 'bg-slate-100 text-slate-700',
            video: 'bg-slate-100 text-slate-700',
            document: 'bg-slate-100 text-slate-700',
            audio: 'bg-slate-100 text-slate-700',
            spreadsheet: 'bg-slate-100 text-slate-700',
            code: 'bg-slate-100 text-slate-700',
            archive: 'bg-slate-100 text-slate-700',
            other: 'bg-slate-100 text-slate-700'
        };
        return <Badge className={`${colors[type] || colors.other} border-slate-200`}>{type.toUpperCase()}</Badge>;
    };

    return (

        <div className="h-full flex flex-col space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Media Library
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Manage, share, and organize all your files in one place
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <FolderPlus className="h-4 w-4" />
                                New Folder
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Folder</DialogTitle>
                                <DialogDescription>
                                    Enter a name for your new folder inside {selectedFolder ? 'current folder' : 'root'}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="folder-name">Folder Name</Label>
                                    <Input
                                        id="folder-name"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        placeholder="e.g., Project Assets"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsNewFolderOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateFolder}>Create Folder</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Rename Item</DialogTitle>
                                <DialogDescription>
                                    Enter a new name for your {selectedItemForAction?.itemType === 'folder' ? 'folder' : 'file'}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="rename-input">Name</Label>
                                    <Input
                                        id="rename-input"
                                        value={renameName}
                                        onChange={(e) => setRenameName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
                                <Button onClick={() => {
                                    if (selectedItemForAction && renameName.trim()) {
                                        renameMutation.mutate({
                                            id: selectedItemForAction.id,
                                            name: renameName,
                                            type: selectedItemForAction.itemType === 'folder' ? 'folder' : 'file'
                                        });
                                    }
                                }}>Rename</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                                <Upload className="h-4 w-4" />
                                Upload Files
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Upload Files</DialogTitle>
                                <DialogDescription>
                                    Select files to upload to {selectedFolder ? `current folder` : 'the library'}.
                                </DialogDescription>
                            </DialogHeader>
                            <div
                                className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center cursor-pointer hover:bg-slate-50 transition-all hover:border-slate-500 dark:border-slate-700 dark:hover:bg-slate-800"
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                                    const files = e.dataTransfer.files;
                                    if (files && files.length > 0) {
                                        uploadMutation.mutate(files);
                                    }
                                }}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    multiple
                                    onChange={handleFileSelect}
                                />
                                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground font-medium">Click to browse files</p>
                                <p className="text-xs text-muted-foreground mt-2">or drag and drop files here</p>
                                {uploadMutation.isPending && (
                                    <div className="mt-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white mx-auto"></div>
                                        <p className="text-slate-500 mt-2">Uploading...</p>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Home className="h-4 w-4" />
                {breadcrumbs.map((path, index) => (
                    <React.Fragment key={index}>
                        {index > 0 && <ChevronRight className="h-4 w-4" />}
                        <button
                            onClick={() => handleFolderClick(path.id)}
                            className="hover:text-foreground transition-colors"
                        >
                            {path.name}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search files and folders..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={filterView === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterView('all')}
                    >
                        All Files
                    </Button>
                    <Button
                        variant={filterView === 'recent' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterView('recent')}
                        className="gap-1"
                    >
                        <Clock className="h-3 w-3" />
                        Recent
                    </Button>
                    <Button
                        variant={filterView === 'starred' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterView('starred')}
                        className="gap-1"
                    >
                        <Star className="h-3 w-3" />
                        Starred
                    </Button>
                    <Button
                        variant={filterView === 'shared' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterView('shared')}
                        className="gap-1"
                    >
                        <Users className="h-3 w-3" />
                        Shared
                    </Button>
                </div>

                <div className="flex items-center gap-1 border rounded-md">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode('grid')}
                    >
                        <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>

                {selectedItems.length > 0 && (
                    <div className="flex items-center gap-2 ml-auto">
                        <Badge variant="secondary">{selectedItems.length} selected</Badge>
                        <Button variant="outline" size="sm" onClick={() => setIsMoveOpen(true)}>
                            <Move className="h-3 w-3 mr-1" />
                            Move
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex gap-6 flex-1 overflow-hidden">
                {/* Sidebar - Navigation & Storage */}
                <Card className="w-60 h-fit hidden md:flex flex-col border-none shadow-none bg-transparent">
                    <div className="space-y-6">
                        {/* Main Navigation */}
                        <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                                My Files
                            </h4>
                            <div className="space-y-1">
                                <Button
                                    variant={activeSource === 'local' ? 'secondary' : 'ghost'}
                                    className="w-full justify-start"
                                    onClick={() => { setActiveSource('local'); handleFolderClick(null); }}
                                >
                                    <HardDrive className="h-4 w-4 mr-2" />
                                    Local Storage
                                </Button>
                            </div>
                        </div>

                        {/* Integrations */}
                        <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3 flex items-center justify-between">
                                Integrations
                                <Plus className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => {
                                    // Quick add or manage integrations
                                }} />
                            </h4>
                            <div className="space-y-1">
                                <Button
                                    variant={activeSource === 'google_drive' ? 'secondary' : 'ghost'}
                                    className="w-full justify-start"
                                    disabled={connectMutation.isPending}
                                    onClick={() => {
                                        if (connectedIntegrations.google_drive) {
                                            setActiveSource('google_drive');
                                            handleFolderClick(null);
                                        } else {
                                            if (confirm("Connect Google Drive?")) connectMutation.mutate('google_drive');
                                        }
                                    }}
                                >
                                    <div className="flex items-center flex-1">
                                        <Cloud className="h-4 w-4 mr-2 text-blue-500" />
                                        Google Drive
                                    </div>
                                    {!connectedIntegrations.google_drive && <Badge variant="outline" className="text-[10px] h-5">Connect</Badge>}
                                    {connectMutation.isPending && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-900 dark:border-white ml-2"></div>}
                                </Button>
                                <Button
                                    variant={activeSource === 'dropbox' ? 'secondary' : 'ghost'}
                                    className="w-full justify-start"
                                    disabled={connectMutation.isPending}
                                    onClick={() => {
                                        if (connectedIntegrations.dropbox) {
                                            setActiveSource('dropbox');
                                            handleFolderClick(null);
                                        } else {
                                            if (confirm("Connect Dropbox?")) connectMutation.mutate('dropbox');
                                        }
                                    }}
                                >
                                    <div className="flex items-center flex-1">
                                        <Database className="h-4 w-4 mr-2 text-indigo-500" />
                                        Dropbox
                                    </div>
                                    {!connectedIntegrations.dropbox && <Badge variant="outline" className="text-[10px] h-5">Connect</Badge>}
                                    {connectMutation.isPending && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-900 dark:border-white ml-2"></div>}
                                </Button>
                            </div>
                        </div>

                        {/* Storage Quota */}
                        {quota && quota.used_bytes !== undefined && quota.total_bytes !== undefined && activeSource === 'local' && (
                            <div className="pt-6 border-t">
                                <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-3 px-3">Storage</h4>
                                <div className="space-y-2 px-3">
                                    <Progress value={quota.percentage} className="h-1.5 bg-slate-100 dark:bg-slate-800" />
                                    <div className="flex justify-between text-[12px] font-medium">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            {formatBytes(quota.used_bytes)} used
                                        </span>
                                        <span className="text-slate-400">
                                            {formatBytes(quota.total_bytes)}
                                        </span>
                                    </div>
                                    {quota.percentage > 80 && (
                                        <p className="text-[12px] text-red-500 font-semibold animate-pulse">
                                            Running low on space
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Main Content */}
                <Card className="flex-1 overflow-hidden h-fit min-h-[500px] flex flex-col shadow-sm border-slate-200 dark:border-slate-800">
                    <CardContent className="p-0 flex flex-col h-full">
                        {/* File List Header (List View) */}
                        {viewMode === 'list' && (
                            <div className="flex items-center px-4 py-3 border-b text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                                <div className="w-10"></div>
                                <div className="flex-1 cursor-pointer hover:text-slate-800" onClick={() => {
                                    if (sortField === 'name') {
                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                    } else {
                                        setSortField('name');
                                        setSortOrder('asc');
                                    }
                                }}>
                                    Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </div>
                                <div className="w-32 cursor-pointer hover:text-slate-800" onClick={() => {
                                    if (sortField === 'size') {
                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                    } else {
                                        setSortField('size');
                                        setSortOrder('asc');
                                    }
                                }}>
                                    Size {sortField === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </div>
                                <div className="w-40 cursor-pointer hover:text-slate-800" onClick={() => {
                                    if (sortField === 'date') {
                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                    } else {
                                        setSortField('date');
                                        setSortOrder('desc');
                                    }
                                }}>
                                    Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </div>
                                <div className="w-16"></div>
                            </div>
                        )}

                        {/* Files Grid/List */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
                                </div>
                            ) : (
                                <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-1'}>

                                    {/* Back Button if in subfolder */}
                                    {selectedFolder && (
                                        <div
                                            className={`
                                                group relative border rounded-lg hover:border-slate-400 dark:hover:border-slate-500 cursor-pointer transition-all border-dashed
                                                ${viewMode === 'grid' ? 'aspect-square flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900' : 'flex items-center px-4 py-3 bg-transparent'}
                                            `}
                                            onClick={() => {
                                                if (breadcrumbs.length > 1) {
                                                    const parent = breadcrumbs[breadcrumbs.length - 2];
                                                    handleFolderClick(parent.id);
                                                } else {
                                                    handleFolderClick(null);
                                                }
                                            }}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const parent = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;
                                                const target = parent?.id || null;
                                                handleDrop(e, target || '');
                                            }}
                                        >
                                            <div className={viewMode === 'grid' ? 'mb-3' : 'mr-4'}>
                                                <Folder className="h-8 w-8 text-slate-400" />
                                            </div>
                                            <div className="font-medium text-slate-500">
                                                .. (Up Level)
                                            </div>
                                        </div>
                                    )}

                                    {/* Folders in current view */}
                                    {folders.filter(f => !selectedFolder ? !f.parentId : f.parentId == selectedFolder).map(folder => (
                                        <div
                                            key={folder.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, folder.id, 'folder')}
                                            onDragOver={(e) => { e.preventDefault(); setDragOverFolder(folder.id); }}
                                            onDragLeave={() => setDragOverFolder(null)}
                                            onDrop={(e) => handleDrop(e, folder.id)}
                                            onClick={() => handleFolderClick(folder.id)}
                                            className={`
                                                group relative border rounded-lg hover:border-slate-400 dark:hover:border-slate-500 cursor-pointer transition-all
                                                ${viewMode === 'grid' ? 'aspect-square flex flex-col items-center justify-center p-6 bg-yellow-50/50 dark:bg-yellow-900/10' : 'flex items-center px-4 py-3 bg-transparent'}
                                                ${dragOverFolder === folder.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-slate-200 dark:border-slate-800'}
                                            `}
                                        >
                                            <div className={viewMode === 'grid' ? 'mb-3' : 'mr-4'}>
                                                <Folder className={`text-yellow-500 fill-yellow-500/20 ${viewMode === 'grid' ? 'h-12 w-12' : 'h-8 w-8'}`} />
                                            </div>

                                            <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'text-center w-full' : 'grid grid-cols-[1fr_8rem_10rem] gap-4 items-center'}`}>
                                                <div className="truncate font-medium text-slate-700 dark:text-slate-300">
                                                    {folder.name}
                                                </div>
                                                {viewMode === 'list' && (
                                                    <>
                                                        <div className="text-xs text-slate-500">{formatBytes(folder.size || 0)}</div>
                                                        <div className="text-xs text-slate-500 flex items-center gap-2">
                                                            {format(new Date(folder.createdAt || new Date()), 'MMM dd, yyyy')}
                                                        </div>
                                                    </>
                                                )}
                                                {viewMode === 'grid' && (
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {folder.itemCount || 0} items
                                                    </div>
                                                )}
                                            </div>

                                            <div className={`${viewMode === 'grid' ? 'absolute top-2 right-2' : 'ml-4'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRenameName(folder.name);
                                                            setSelectedItemForAction({ ...folder, itemType: 'folder' });
                                                            setIsRenameOpen(true);
                                                        }}>
                                                            <Edit2 className="h-4 w-4 mr-2" /> Rename
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedItemForAction({ ...folder, itemType: 'folder' });
                                                            setIsMoveOpen(true);
                                                        }}>
                                                            <Move className="h-4 w-4 mr-2" /> Move
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm('Delete folder and all contents?')) deleteFolderMutation.mutate(folder.id);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Files */}
                                    {filteredFiles.map((file) => (
                                        <div
                                            key={file.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, file.id, 'file')}
                                            className={`
                                                group relative border rounded-lg hover:border-slate-400 dark:hover:border-slate-500 transition-all
                                                ${viewMode === 'grid' ? 'aspect-square flex flex-col p-4 bg-white dark:bg-slate-950' : 'flex items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50'}
                                                ${selectedItems.includes(file.id) ? 'ring-2 ring-primary border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800'}
                                            `}
                                            onClick={(e) => {
                                                if (e.ctrlKey || e.metaKey) {
                                                    toggleItemSelection(file.id);
                                                } else {
                                                    setPreviewItem(file);
                                                }
                                            }}
                                        >
                                            {/* Selection Checkbox */}
                                            <div className={`absolute top-2 left-2 z-10 ${selectedItems.includes(file.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                                <Checkbox
                                                    checked={selectedItems.includes(file.id)}
                                                    onCheckedChange={() => toggleItemSelection(file.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>

                                            {/* Preview/Icon */}
                                            <div className={viewMode === 'grid' ? 'flex-1 flex items-center justify-center mb-4 overflow-hidden' : 'mr-4'}>
                                                {file.type === 'image' ? (
                                                    <img
                                                        src={file.url}
                                                        alt={file.name}
                                                        className={viewMode === 'grid' ? 'max-h-full max-w-full object-contain rounded' : 'h-10 w-10 object-cover rounded'}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded-lg">
                                                        {getIcon(file.type)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'text-center w-full' : 'grid grid-cols-[1fr_8rem_10rem] gap-4 items-center'}`}>
                                                <div className="truncate font-medium text-sm text-slate-700 dark:text-slate-300" title={file.name}>
                                                    {file.name}
                                                </div>
                                                {viewMode === 'list' && (
                                                    <>
                                                        <div className="text-xs text-slate-500">{file.size}</div>
                                                        <div className="text-xs text-slate-500 flex items-center gap-2">
                                                            {file.uploadedAt}
                                                            {file.starred && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                                                        </div>
                                                    </>
                                                )}
                                                {viewMode === 'grid' && (
                                                    <div className="mt-1 flex items-center justify-center gap-2">
                                                        {getTypeBadge(file.type)}
                                                        <span className="text-xs text-slate-400">{file.size}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className={`${viewMode === 'grid' ? 'absolute top-2 right-2' : 'ml-4'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur-sm dark:bg-black/50">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPreviewItem(file);
                                                        }}>
                                                            <Eye className="h-4 w-4 mr-2" /> Preview
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownload(file);
                                                        }}>
                                                            <Download className="h-4 w-4 mr-2" /> Download
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCopyLink(file);
                                                        }}>
                                                            <Copy className="h-4 w-4 mr-2" /> Copy Link
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Embed logic - just copy HTML snippet
                                                            const code = file.type === 'image'
                                                                ? `<img src="${window.location.origin}${file.url}" alt="${file.name}" />`
                                                                : `<a href="${window.location.origin}${file.url}" target="_blank">${file.name}</a>`;
                                                            navigator.clipboard.writeText(code);
                                                            toast({ title: "Copied Embed Code", description: "HTML code copied to clipboard" });
                                                        }}>
                                                            <CodeDisplayIcon className="h-4 w-4 mr-2" /> Embed
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedItemForAction(file);
                                                            setShareEmail('');
                                                            setIsShareOpen(true);
                                                        }}>
                                                            <Share2 className="h-4 w-4 mr-2" /> Share
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleStar(file);
                                                        }}>
                                                            {file.starred ? (
                                                                <><StarOff className="h-4 w-4 mr-2" /> Unstar</>
                                                            ) : (
                                                                <><Star className="h-4 w-4 mr-2" /> Star</>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedItemForAction({ ...file, itemType: 'file' });
                                                            setIsMoveOpen(true);
                                                        }}>
                                                            <Move className="h-4 w-4 mr-2" /> Move
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRenameName(file.name);
                                                            setSelectedItemForAction({ ...file, itemType: 'file' });
                                                            setIsRenameOpen(true);
                                                        }}>
                                                            <Edit2 className="h-4 w-4 mr-2" /> Rename
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedItemForAction(file);
                                                            setShowActivity(true);
                                                            setActivityFileId(file.id);
                                                        }}>
                                                            <Clock className="h-4 w-4 mr-2" /> Activity
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm('Delete file?')) deleteMutation.mutate(file.id);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Empty State */}
                                    {filteredFiles.length === 0 && folders.filter(f => !selectedFolder ? !f.parentId : f.parentId == selectedFolder).length === 0 && (
                                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-slate-500">
                                            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                                                <ImageOff className="h-8 w-8 text-slate-400" />
                                            </div>
                                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                                                No files found
                                            </h3>
                                            <p className="max-w-xs mx-auto mb-6">
                                                {searchQuery
                                                    ? `No results for "${searchQuery}"`
                                                    : 'Upload files or create folders to get started'}
                                            </p>
                                            {!searchQuery && (
                                                <Button onClick={() => setIsUploadOpen(true)}>
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    Upload Files
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dialogs */}
            <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Share "{selectedItemForAction?.name}"</DialogTitle>
                        <DialogDescription>
                            Invite others to access this file.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter email address"
                                value={shareEmail}
                                onChange={(e) => setShareEmail(e.target.value)}
                            />
                            <Select value={sharePermission} onValueChange={(v: any) => setSharePermission(v)}>
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="view">Can View</SelectItem>
                                    <SelectItem value="edit">Can Edit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-sm text-slate-500">
                            {selectedItemForAction?.sharedWith?.length ? (
                                <div>
                                    <p className="font-medium mb-2">Shared with:</p>
                                    <div className="space-y-2">
                                        {selectedItemForAction.sharedWith.map((email: string) => (
                                            <div key={email} className="flex items-center justify-between">
                                                <span>{email}</span>
                                                <Badge variant="outline">View</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p>Not shared with anyone yet.</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsShareOpen(false)}>Cancel</Button>
                        <Button onClick={handleShare}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Send Invite
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Move Items</DialogTitle>
                        <DialogDescription>
                            Select destination folder for {selectedItems.length || 1} item(s).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto border rounded-md p-1 space-y-1">
                        <div
                            className={`flex items-center p-2 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ${!selectedFolder ? 'bg-slate-100 dark:bg-slate-800 font-medium' : ''}`}
                            onClick={() => {
                                const targetType = selectedItems.length > 0 ? 'file' : (selectedItemForAction?.itemType === 'folder' ? 'folder' : 'file');
                                const ids = selectedItems.length > 0 ? selectedItems : [selectedItemForAction?.id];
                                if (ids[0]) moveMutation.mutate({ ids: ids.filter(Boolean), folder: null, type: targetType });
                            }}
                        >
                            <Home className="h-4 w-4 mr-2 text-slate-500" />
                            All Files (Root)
                        </div>

                        {folders.map(folder => {
                            const movingFolderId = selectedItems.length === 0 && selectedItemForAction?.itemType === 'folder' ? selectedItemForAction.id : null;
                            if (movingFolderId === folder.id) return null;

                            return (
                                <div
                                    key={folder.id}
                                    className="flex items-center p-2 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 group"
                                    onClick={() => {
                                        const targetType = selectedItems.length > 0 ? 'file' : (selectedItemForAction?.itemType === 'folder' ? 'folder' : 'file');
                                        const ids = selectedItems.length > 0 ? selectedItems : [selectedItemForAction?.id];
                                        if (ids[0]) moveMutation.mutate({ ids: ids.filter(Boolean), folder: folder.id, type: targetType });
                                    }}
                                >
                                    <Folder className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-500/10" />
                                    <span className="flex-1 truncate">{folder.name}</span>
                                    {folder.parentId && (
                                        <Badge variant="outline" className="text-[12px] scale-75 opacity-50">Sub</Badge>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            {previewItem && (
                <FilePreviewModal
                    isOpen={!!previewItem}
                    onClose={() => setPreviewItem(null)}
                    file={previewItem}
                    onDownload={(file) => window.open(file.url, '_blank')}
                    onShare={(file) => {
                        setSelectedItemForAction(file);
                        setIsShareOpen(true);
                    }}
                    onDelete={(file) => {
                        setSelectedItemForAction(file);
                        deleteMutation.mutate(file.id);
                    }}
                    onToggleStar={(file) => toggleStarMutation.mutate(file.id)}
                />
            )}

            {showActivity && activityFileId && (
                <Dialog open={showActivity} onOpenChange={setShowActivity}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>File Activity</DialogTitle>
                            <DialogDescription>
                                Historical activity for this file.
                            </DialogDescription>
                        </DialogHeader>
                        <FileActivityTimeline fileId={activityFileId} />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default MediaLibrary;
