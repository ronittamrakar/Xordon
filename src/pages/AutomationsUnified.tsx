// Force rebuild
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { api, FollowUpAutomation } from '@/lib/api';
import AutomationSpreadsheetView from '@/components/automations/AutomationSpreadsheetView';
import { useAuth } from '@/contexts/AuthContext';
import {
    Zap, Plus, Search, Edit, Trash2, Play, MoreHorizontal, Mail, MessageSquare, Phone, FileTextIcon,
    ArrowRight, Clock, Tag, Users, Bell, Webhook, Workflow, Settings, BookOpen, Star, Calendar, Eye,
    Sparkles, Download, ChevronRight, LayoutGrid, List, SlidersHorizontal, ArrowUpDown, ExternalLink,
    Pause, Filter, X, Gift, RefreshCw, ShoppingCart, BarChart3, Copy, FileSpreadsheet, Table2, Folder, ArrowLeft, FolderInput, Check
} from 'lucide-react';
import { PLAYBOOK_TEMPLATES, PLAYBOOK_CATEGORIES, PLAYBOOK_TYPES, PLAYBOOK_INDUSTRIES } from '@/data/playbooks';
import { IndustrySlug, INDUSTRY_COLORS } from '@/types/industry';

// Types
type AutomationOptionsExtended = {
    trigger_types: Record<string, Record<string, string>>;
    action_types: Record<string, string>;
    condition_types?: Record<string, string>;
    delay_units: Record<string, string>;
    sentiments?: Record<string, string>;
    disposition_categories?: Record<string, string>;
    dispositions?: Array<{ id: string; name: string; category: string; color: string }>;
};

interface Recipe {
    id: number;
    name: string;
    description?: string;
    category: string;
    industry?: string;
    target_audience: string;
    channels: string[];
    trigger_type?: string;
    steps?: Array<{ type: string; delay: number; subject?: string; message?: string }>;
    actions?: Array<{ action_type: string; delay_seconds?: number; action_config?: any }>;
    estimated_duration?: string;
    // difficulty removed
    tags?: string[];
    usage_count: number;
    rating: number;
    is_system: boolean;
    type?: 'trigger' | 'rule' | 'workflow';
    // Installation tracking
    installed_count?: number;
    installed_flow_id?: number;
    is_installed?: boolean;
}

interface Flow {
    id: number;
    recipe_id?: number;
    name: string;
    description: string;
    status: 'draft' | 'active' | 'paused';
    nodes_count: number;
    created_at: string;
    updated_at: string;
    stats: {
        total_contacts: number;
        emails_sent: number;
        sms_sent: number;
        conversions: number;
        conversion_rate: number;
    };
}

type ViewMode = 'grid' | 'table';
type SortOption = 'popular' | 'rating' | 'newest' | 'name';

const categoryIcons: Record<string, React.ReactNode> = {
    welcome: <Gift className="h-5 w-5" />,
    nurture: <Users className="h-5 w-5" />,
    reengagement: <RefreshCw className="h-5 w-5" />,
    abandoned_cart: <ShoppingCart className="h-5 w-5" />,
    post_purchase: <Mail className="h-5 w-5" />,
    birthday: <Gift className="h-5 w-5" />,
    review_request: <Star className="h-5 w-5" />,
    appointment: <Calendar className="h-5 w-5" />,
    custom: <Sparkles className="h-5 w-5" />,
    email: <Mail className="h-5 w-5 text-blue-500" />,
    sms: <MessageSquare className="h-5 w-5 text-green-500" />,
    call: <Phone className="h-5 w-5 text-purple-500" />,
    form: <FileTextIcon className="h-5 w-5 text-orange-500" />,
    'my-automations': <Zap className="h-5 w-5 text-amber-500" />
};

const categoryLabels: Record<string, string> = {
    welcome: 'Welcome Series',
    nurture: 'Lead Nurture',
    reengagement: 'Re-engagement',
    abandoned_cart: 'Abandoned Cart',
    post_purchase: 'Post-Purchase',
    birthday: 'Birthday/Anniversary',
    review_request: 'Review Request',
    appointment: 'Appointment',
    custom: 'Custom Templates',
    email: 'Email Campaigns',
    sms: 'SMS Marketing',
    call: 'Voice/Calling',
    form: 'Form Submissions',
    'my-automations': 'My Automations'
};

const AutomationsUnified: React.FC = () => {
    const auth = useAuth();
    const { isAuthenticated, isLoading: authLoading } = auth;
    const navigate = useNavigate();
    const location = useLocation();
    const { toast: toastHook } = useToast();

    // Tab state controlled by URL or state
    const [activeTab, setActiveTab] = useState('my-automations');

    useEffect(() => {
        if (location.pathname.includes('/library')) {
            setActiveTab('library');
        } else if (location.pathname.includes('/flows') && !location.pathname.includes('/new')) {
            // If they land on /automations/flows, we show the main list but maybe distinct it later.
            // For now, merged view is 'my-automations'
            setActiveTab('my-automations');
        } else if (location.pathname.includes('/playbooks')) {
            setActiveTab('playbooks');
        } else {
            setActiveTab('my-automations');
        }
    }, [location.pathname]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        if (value === 'library') {
            navigate('/automations/library');
        } else {
            navigate('/automations');
        }
    };

    // Icons helper
    const getPlaybookTypeIcon = (type: string) => PLAYBOOK_TYPES.find(t => t.value === type)?.icon || <FileTextIcon className="h-4 w-4" />;
    const getPlaybookCategoryLabel = (cat: string) => PLAYBOOK_CATEGORIES.find(c => c.value === cat)?.label || cat;
    const getPlaybookIndustryLabel = (ind: string) => PLAYBOOK_INDUSTRIES.find(i => i.value === ind)?.label || ind;

    // Data state
    const [automations, setAutomations] = useState<FollowUpAutomation[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [flows, setFlows] = useState<Flow[]>([]);
    const [options, setOptions] = useState<AutomationOptionsExtended | null>(null);
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState(false);

    // Search and filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChannel, setSelectedChannel] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedType, setSelectedType] = useState<string>('all'); // 'all' | 'trigger' | 'workflow'
    const [selectedStatus, setSelectedStatus] = useState<string>('all'); // 'all' | 'active' | 'paused'
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    // Folder path for nested navigation (breadcrumb trail)
    const [folderPath, setFolderPath] = useState<Array<{ id: string, name: string }>>([]);

    // View and sort
    const [viewMode, setViewMode] = useState<ViewMode>('list'); // Default to list view as requested
    const [sortBy, setSortBy] = useState<SortOption>('newest'); // Changed default to newest

    // Dialog state
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isMethodDialogOpen, setIsMethodDialogOpen] = useState(false);
    const [editingAutomation, setEditingAutomation] = useState<FollowUpAutomation | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Form state
    const [newFolderName, setNewFolderName] = useState('');
    const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);

    // Rename Folder State
    const [isRenameFolderDialogOpen, setIsRenameFolderDialogOpen] = useState(false);
    const [editingFolder, setEditingFolder] = useState<{ id: string, name: string } | null>(null);

    const [itemsPerPage] = useState(100);
    const [myAutomationsPage, setMyAutomationsPage] = useState(1);
    const [libraryPage, setLibraryPage] = useState(1);

    // Bulk selection state
    const [selectedAutomations, setSelectedAutomations] = useState<Set<string>>(new Set());

    // Move Logic State
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
    const [moveTargets, setMoveTargets] = useState<string[]>([]); // URLs/IDs of items to move
    const [movingType, setMovingType] = useState<'automation' | 'folder'>('automation');

    const [targetFolderId, setTargetFolderId] = useState<string | null>(null);

    // Simulated Backend for Automation Folder Assignment (Map automation ID -> Folder ID)
    const [automationFolderMap, setAutomationFolderMap] = useState<Record<string, string>>({});

    // Track installed recipes (recipe_id -> flow_id mapping)
    const [installedRecipes, setInstalledRecipes] = useState<Record<number, number>>({});

    // Track which workflow is being edited in spreadsheet view (in Library tab)
    const [editingWorkflowId, setEditingWorkflowId] = useState<number | null>(null);

    // Bulk selection for library
    const [selectedRecipes, setSelectedRecipes] = useState<Set<number | string>>(new Set());

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        channel: 'call' as 'email' | 'sms' | 'call' | 'form',
        trigger_type: '',
        trigger_conditions: {} as Record<string, unknown>,
        action_type: '',
        action_config: {} as Record<string, unknown>,
        delay_amount: 0,
        delay_unit: 'hours' as 'minutes' | 'hours' | 'days',
        is_active: true,
        priority: 0,
        confidence_threshold: 70,
    });

    const [conditionType, setConditionType] = useState('');
    const [conditionValue, setConditionValue] = useState('');

    // Add Recipe Dialog State
    const [isAddRecipeDialogOpen, setIsAddRecipeDialogOpen] = useState(false);
    const [recipeFormData, setRecipeFormData] = useState({
        name: '',
        description: '',
        category: 'workflow',
        industry: '',
        target_audience: '',
        channels: ['email'],
        // difficulty removed
        tags: [] as string[],
        type: 'workflow'
    });

    // Playbooks State
    const [playbooksSearchTerm, setPlaybooksSearchTerm] = useState('');
    const [playbooksIndustryFilter, setPlaybooksIndustryFilter] = useState<string>('all');
    const [playbooksCategoryFilter, setPlaybooksCategoryFilter] = useState<string>('all');
    const [playbooksTypeFilter, setPlaybooksTypeFilter] = useState<string>('all');
    const [playbooksActiveTab, setPlaybooksActiveTab] = useState('all');

    const filteredPlaybooks = useMemo(() => {
        return PLAYBOOK_TEMPLATES.filter(p => {
            if (playbooksSearchTerm && !p.name.toLowerCase().includes(playbooksSearchTerm.toLowerCase())) return false;
            if (playbooksIndustryFilter !== 'all' && p.industry !== playbooksIndustryFilter) return false;
            if (playbooksCategoryFilter !== 'all' && p.category !== playbooksCategoryFilter) return false;
            if (playbooksTypeFilter !== 'all' && p.type !== playbooksTypeFilter) return false;
            if (playbooksActiveTab === 'featured' && !p.featured) return false;
            return true;
        });
    }, [playbooksSearchTerm, playbooksIndustryFilter, playbooksCategoryFilter, playbooksTypeFilter, playbooksActiveTab]);

    const installPlaybook = async (playbook: typeof PLAYBOOK_TEMPLATES[0]) => {
        try {
            toast.info(`Installing "${playbook.name}"...`);
            await api.post('/operations/playbooks', {
                playbook_id: playbook.id,
                name: playbook.name,
                type: playbook.type,
                category: playbook.category,
                industry: playbook.industry,
            });
            toast.success(`"${playbook.name}" installed successfully!`);
            loadAllData(); // Refresh automations list
            setActiveTab('my-automations'); // Switch to My Automations to see installed
        } catch (error) {
            console.error('Failed to install playbook:', error);
            toast.error('Failed to install playbook. Please try again.');
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            setLoading(true);
            const [automationsRes, recipesRes, flowsRes, optionsRes] = await Promise.all([
                api.getAutomations(),
                api.get('/automation-recipes'),
                api.get('/flows'),
                api.getAutomationOptions()
            ]);

            const fetchedAutomations = automationsRes.automations || [];
            const fetchedRecipes = (recipesRes.data as any).items || [];
            const fetchedFlows = (flowsRes.data as any).flows || [];

            setAutomations(fetchedAutomations);
            setRecipes(fetchedRecipes);
            setFlows(fetchedFlows);
            setOptions(optionsRes as AutomationOptionsExtended);

            // Populate installedRecipes map to sync Library "Installed" status
            const installedMap: Record<number, number> = {};

            // Check flows (Workflows)
            fetchedFlows.forEach((flow: any) => {
                if (flow.recipe_id) {
                    installedMap[Number(flow.recipe_id)] = flow.id;
                }
            });

            // Check followup_automations (Triggers/Rules)
            fetchedAutomations.forEach((auto: any) => {
                if (auto.recipe_id) {
                    installedMap[Number(auto.recipe_id)] = auto.id;
                }
            });

            setInstalledRecipes(installedMap);
        } catch (error: any) {
            console.error('Error loading data:', error);
            toast.error('Failed to load automations');
        } finally {
            setLoading(false);
        }
    };

    // Merge automations and instances into a single list
    const allAutomations = useMemo(() => {
        const combined = [
            ...automations.map(a => {
                // Simple event-action pairs are Triggers, Delayed ones are Rules
                const type = (!a.delay_amount || a.delay_amount === 0) ? 'trigger' : 'rule';
                return {
                    id: `auto-${a.id}`,
                    name: a.name,
                    description: a.description,
                    type: type as any,
                    channel: a.channel,
                    status: a.is_active ? 'active' : 'paused',
                    trigger: options?.trigger_types[a.channel]?.[a.trigger_type] || a.trigger_type,
                    action: options?.action_types[a.action_type] || a.action_type,
                    delay: a.delay_amount > 0 ? `${a.delay_amount} ${a.delay_unit}` : 'Immediate',
                    created_at: a.created_at,
                    original: a
                };
            }),
            ...flows.map(f => {
                // Determine type based on complexity - more than 3 nodes becomes a Workflow
                const type = (f.nodes_count || 0) > 3 ? 'workflow' : 'rule';
                return {
                    id: `flow-${f.id}`,
                    name: f.name,
                    description: f.description,
                    type: type as any,
                    channel: f.channel || 'workflow',
                    status: f.status === 'active' ? 'active' : 'paused',
                    trigger: 'Incoming Hook',
                    action: `${f.nodes_count || 0} Nodes`,
                    delay: 'Flow Controlled',
                    created_at: f.created_at,
                    original: f
                };
            })
        ];

        // Attach folder IDs
        return combined.map(item => ({
            ...item,
            folderId: automationFolderMap[item.id] || null // If null, it falls back to implicit channel logic
        }));
    }, [automations, flows, options, automationFolderMap]);

    // Folder type with parentId for nesting
    type FolderType = {
        id: string;
        name: string;
        icon: React.ComponentType<{ className?: string }>;
        color: string;
        bg: string;
        isCustom: boolean;
        parentId: string | null; // null = root level
    };

    const [folders, setFolders] = useState<FolderType[]>([
        // Channel-based folders (main categories)
        { id: 'email', name: 'Email Automations', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', isCustom: false, parentId: null },
        { id: 'sms', name: 'SMS Automations', icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', isCustom: false, parentId: null },
        { id: 'call', name: 'Call Automations', icon: Phone, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', isCustom: false, parentId: null },
        { id: 'form', name: 'Form Automations', icon: FileTextIcon, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20', isCustom: false, parentId: null },
    ]);

    // Get subfolders for current folder
    const currentSubfolders = useMemo(() => {
        return folders.filter(f => f.parentId === selectedFolder);
    }, [folders, selectedFolder]);

    // Get root folders (for main view when no folder selected)
    const rootFolders = useMemo(() => {
        return folders.filter(f => f.parentId === null);
    }, [folders]);

    // Navigate into a folder
    const navigateToFolder = (folder: FolderType) => {
        setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }]);
        setSelectedFolder(folder.id);
        setSearchQuery('');
    };

    // Navigate to a specific point in breadcrumb
    const navigateToBreadcrumb = (index: number) => {
        if (index < 0) {
            // Go to root
            setFolderPath([]);
            setSelectedFolder(null);
        } else {
            const newPath = folderPath.slice(0, index + 1);
            setFolderPath(newPath);
            setSelectedFolder(newPath[newPath.length - 1].id);
        }
        setSearchQuery('');
    };

    // Navigate back one level
    const navigateBack = () => {
        if (folderPath.length <= 1) {
            setFolderPath([]);
            setSelectedFolder(null);
        } else {
            const newPath = folderPath.slice(0, -1);
            setFolderPath(newPath);
            setSelectedFolder(newPath[newPath.length - 1].id);
        }
    };

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        const newFolder: FolderType = {
            id: `custom-${Date.now()}`,
            name: newFolderName,
            icon: Folder,
            color: 'text-yellow-500',
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            isCustom: true,
            parentId: selectedFolder // Create in current folder (or root if null)
        };
        setFolders([...folders, newFolder]);
        setNewFolderName('');
        setIsNewFolderDialogOpen(false);
        toast.success('Folder created successfully');
    };

    const handlePrepareRename = (folder: { id: string, name: string }) => {
        setEditingFolder(folder);
        setIsRenameFolderDialogOpen(true);
    };

    const handleRenameFolder = () => {
        if (!editingFolder || !editingFolder.name.trim()) return;
        setFolders(folders.map(f => f.id === editingFolder.id ? { ...f, name: editingFolder.name } : f));
        setEditingFolder(null);
        setIsRenameFolderDialogOpen(false);
        toast.success('Folder renamed successfully');
    };

    const handleDeleteFolder = (folderId: string) => {
        // Delete folder and all its subfolders recursively
        const getDescendantIds = (parentId: string): string[] => {
            const children = folders.filter(f => f.parentId === parentId);
            return children.flatMap(c => [c.id, ...getDescendantIds(c.id)]);
        };
        const idsToDelete = new Set([folderId, ...getDescendantIds(folderId)]);
        setFolders(folders.filter(f => !idsToDelete.has(f.id)));
        toast.success('Folder deleted');
    };

    // Bulk Actions
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = new Set(filteredAutomations.map(a => a.id));
            setSelectedAutomations(allIds);
        } else {
            setSelectedAutomations(new Set());
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const next = new Set(selectedAutomations);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedAutomations(next);
    };

    const handleBulkDelete = () => {
        if (selectedAutomations.size === 0) return;
        // ... bulk delete logic
        toast.success(`Deleted ${selectedAutomations.size} automations`);
        setSelectedAutomations(new Set());
    };

    // Library Bulk Actions
    const handleSelectAllRecipes = (checked: boolean) => {
        if (checked) {
            const allIds = new Set(filteredRecipes.map(r => r.id));
            setSelectedRecipes(allIds);
        } else {
            setSelectedRecipes(new Set());
        }
    };

    const handleSelectOneRecipe = (id: number | string, checked: boolean) => {
        const next = new Set(selectedRecipes);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedRecipes(next);
    };

    const handleBulkInstall = async () => {
        setInstalling(true);
        let count = 0;
        for (const id of selectedRecipes) {
            const recipe = allAvailableRecipes.find(r => r.id === id);
            if (recipe && !isRecipeInstalled(recipe)) {
                await handleInstallRecipe(recipe, false);
                count++;
            }
        }
        setInstalling(false);
        setSelectedRecipes(new Set());
        if (count > 0) {
            toast.success(`Successfully installed ${count} recipes`);
            loadAllData();
        }
    };

    const handleBulkUninstall = async () => {
        let count = 0;
        for (const id of selectedRecipes) {
            const recipe = allAvailableRecipes.find(r => r.id === id);
            if (recipe && isRecipeInstalled(recipe)) {
                await handleUninstallRecipe(recipe, false);
                count++;
            }
        }
        setSelectedRecipes(new Set());
        if (count > 0) {
            toast.success(`Successfully uninstalled ${count} recipes`);
            loadAllData();
        }
    };


    const handleMove = (targetFolderId: string | null) => {
        const idsToMove = moveTargets.length > 0 ? moveTargets : Array.from(selectedAutomations);

        if (movingType === 'folder') {
            // Moving folders
            setFolders(prev => prev.map(f => {
                if (idsToMove.includes(f.id)) {
                    // Prevent moving into self or children
                    // (Simple check: straight parent update. Recursive safety check should be in dialog UI or here)
                    return { ...f, parentId: targetFolderId };
                }
                return f;
            }));
            toast.success(`Moved ${idsToMove.length} folders`);
        } else {
            // Moving automations
            const newMap = { ...automationFolderMap };

            idsToMove.forEach(id => {
                if (targetFolderId) {
                    newMap[id] = targetFolderId;
                } else {
                    delete newMap[id]; // Move to root/system default
                }
            });

            setAutomationFolderMap(newMap);
            setSelectedAutomations(new Set()); // unique clear
            toast.success(`Moved ${idsToMove.length} items`);
        }

        setMoveTargets([]);
        setIsMoveDialogOpen(false);
        setTargetFolderId(null);
    };

    const openMoveDialog = (ids: string[], type: 'automation' | 'folder' = 'automation') => {
        setMoveTargets(ids);
        setMovingType(type);
        setIsMoveDialogOpen(true);
    };

    const toggleSort = (col: SortOption) => {
        if (sortBy === col) {
            // toggle desc/asc if we had that, for now just switch to newest
            setSortBy('newest');
        } else {
            setSortBy(col);
        }
    };

    const folderStats = useMemo(() => {
        return folders.reduce((acc, folder) => {
            let triggers = 0;
            let rules = 0;
            let workflows = 0;
            let total = 0;
            let active = 0;

            const items = allAutomations.filter(a => {
                if (folder.isCustom) return a.folderId === folder.id;
                if (a.folderId) return a.folderId === folder.id;
                return a.channel === folder.id;
            });

            total = items.length;
            triggers = items.filter(a => a.type === 'trigger').length;
            rules = items.filter(a => a.type === 'rule').length;
            workflows = items.filter(a => a.type === 'workflow').length;
            active = items.filter(a => a.status === 'active').length;

            acc[folder.id!] = { total, triggers, rules, workflows, active };
            return acc;
        }, {} as Record<string, { total: number, triggers: number, rules: number, workflows: number, active: number }>);
    }, [allAutomations, folders]);

    const filteredAutomations = useMemo(() => {
        let result = allAutomations.filter(a => {
            const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.description?.toLowerCase().includes(searchQuery.toLowerCase());

            // Filter by Folder (channel-based)
            let matchesFolder = true;
            if (selectedFolder) {
                const folder = folders.find(f => f.id === selectedFolder);

                if (a.folderId) {
                    // Explicitly assigned to this folder
                    matchesFolder = a.folderId === selectedFolder;
                } else if (folder && !folder.isCustom) {
                    // Channel-based system folder - match by channel (shows both triggers AND workflows)
                    matchesFolder = a.channel === selectedFolder;
                } else {
                    // Custom folder but automation not explicitly assigned
                    matchesFolder = false;
                }
            }

            const matchesChannel = selectedChannel === 'all' || a.channel === selectedChannel;

            // Filter by type
            const matchesType = selectedType === 'all' || a.type === selectedType;

            // Filter by status
            const matchesStatus = selectedStatus === 'all' || a.status === selectedStatus;

            return matchesSearch && matchesChannel && matchesFolder && matchesType && matchesStatus;
        });

        // Sorting
        if (sortBy === 'newest') {
            result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (sortBy === 'name') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'status') {
            result.sort((a, b) => (a.status === 'active' ? -1 : 1));
        }

        return result;
    }, [allAutomations, searchQuery, selectedChannel, selectedFolder, sortBy, folders, selectedType, selectedStatus]);

    const paginatedAutomations = useMemo(() => {
        const start = (myAutomationsPage - 1) * itemsPerPage;
        return filteredAutomations.slice(start, start + itemsPerPage);
    }, [filteredAutomations, myAutomationsPage, itemsPerPage]);

    // Library should only show actual recipe templates, not user-created automations
    const allAvailableRecipes = useMemo(() => {
        // Only return recipes from the database, don't add user automations here
        // User automations appear in "My Automations" tab only
        return [...recipes];
    }, [recipes]);

    const filteredRecipes = useMemo(() => {
        const result = allAvailableRecipes.filter(recipe => {
            const matchesSearch = !searchQuery ||
                recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (recipe as any).tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory = !selectedCategory || recipe.category === selectedCategory || (selectedCategory === 'custom' && (recipe as any).is_user_owned);
            const matchesType = selectedType === 'all' || recipe.type === selectedType || (!recipe.type && selectedType === 'workflow');

            return matchesSearch && matchesCategory && matchesType;
        });

        switch (sortBy) {
            case 'popular':
                result.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
                break;
            case 'rating':
                result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'newest':
                result.sort((a, b) => Number(b.id) - Number(a.id));
                break;
            case 'name':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }

        return result;
    }, [allAvailableRecipes, searchQuery, selectedCategory, sortBy, selectedType]);

    const paginatedRecipes = useMemo(() => {
        const start = (libraryPage - 1) * itemsPerPage;
        return filteredRecipes.slice(start, start + itemsPerPage);
    }, [filteredRecipes, libraryPage, itemsPerPage]);

    // Group recipes by type for accordion display
    const recipesByType = useMemo(() => {
        return {
            triggers: filteredRecipes.filter(r => r.type === 'trigger'),
            rules: filteredRecipes.filter(r => r.type === 'rule'),
            workflows: filteredRecipes.filter(r => r.type === 'workflow' || !r.type)
        };
    }, [filteredRecipes]);

    // Group user automations by type for accordion display
    const automationsByType = useMemo(() => {
        return {
            triggers: filteredAutomations.filter(a => a.type === 'trigger'),
            rules: filteredAutomations.filter(a => a.type === 'rule'),
            workflows: filteredAutomations.filter(a => a.type === 'workflow')
        };
    }, [filteredAutomations]);

    const handleCreateAutomation = async () => {
        if (!formData.name || !formData.trigger_type || !formData.action_type) {
            toast.error('Please fill in all required fields');
            return;
        }
        try {
            const newAutomation = await api.createAutomation(formData);
            setAutomations(prev => [newAutomation, ...prev]);
            setIsCreateDialogOpen(false);
            resetForm();
            toast.success('Automation created successfully');
        } catch (error) {
            console.error('Error creating automation:', error);
            toast.error('Failed to create automation');
        }
    };

    const handleUpdateAutomation = async () => {
        if (!editingAutomation) return;
        try {
            const updated = await api.updateAutomation(editingAutomation.id, formData);
            setAutomations(prev => prev.map(a => a.id === editingAutomation.id ? updated : a));
            setEditingAutomation(null);
            resetForm();
            toast.success('Automation updated successfully');
        } catch (error) {
            console.error('Error updating automation:', error);
            toast.error('Failed to update automation');
        }
    };

    const handleDuplicateAutomation = async (item: any) => {
        try {
            if (item.type === 'trigger' || item.type === 'rule') {
                const source = item.original;
                const duplicated = await api.createAutomation({
                    name: `${source.name} (Copy)`,
                    description: source.description,
                    channel: source.channel,
                    trigger_type: source.trigger_type,
                    trigger_conditions: source.trigger_conditions,
                    action_type: source.action_type,
                    action_config: source.action_config,
                    delay_amount: source.delay_amount,
                    delay_unit: source.delay_unit,
                    is_active: false, // Default to inactive for copy
                });
                setAutomations(prev => [duplicated, ...prev]);
            } else {
                // For flows, we would call a duplicate-flow API
                toast.info('Workflow duplication is coming soon');
                return;
            }
            toast.success('Automation duplicated');
        } catch (error) {
            console.error('Error duplicating automation:', error);
            toast.error('Failed to duplicate automation');
        }
    };

    const handleSaveAsTemplate = async (item: any) => {
        try {
            const source = item.original;
            const recipeData = {
                name: source.name,
                description: source.description || `Template created from ${source.name}`,
                category: 'custom',
                industry: 'General',
                target_audience: 'Everyone',
                channels: (item.type === 'trigger' || item.type === 'rule') ? [source.channel] : ['multi'],
                // difficulty removed
                type: item.type, // trigger, rule, workflow
                is_system: false,
                trigger_type: source.trigger_type || 'contact_added',
                actions: (item.type === 'trigger' || item.type === 'rule') ? [{
                    action_type: source.action_type,
                    delay_seconds: (source.delay_amount || 0) * (source.delay_unit === 'minutes' ? 60 : source.delay_unit === 'hours' ? 3600 : 86400),
                    action_config: source.action_config || {}
                }] : [],
                usage_count: 0,
                rating: 0
            };

            await api.createAutomationRecipe(recipeData);
            toast.success('Saved to Recipes Library');
            loadAllData(); // Refresh library
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('Failed to save template');
        }
    };

    const handleDeleteAutomation = async (item: any) => {
        if (!confirm('Are you sure you want to delete this automation?')) return;
        try {
            if (item.type === 'trigger' || item.type === 'rule') {
                await api.deleteAutomation(item.original.id);
                setAutomations(prev => prev.filter(a => a.id !== item.original.id));
            } else {
                await api.delete(`/flows/${item.original.id}`);
                setFlows(prev => prev.filter(f => f.id !== item.original.id));
            }
            toast.success('Automation deleted successfully');
        } catch (error) {
            console.error('Error deleting automation:', error);
            toast.error('Failed to delete automation');
        }
    };

    const handleToggleAutomation = async (item: any) => {
        try {
            if (item.type === 'trigger' || item.type === 'rule') {
                const result = await api.toggleAutomation(item.original.id);
                setAutomations(prev => prev.map(a => a.id === item.original.id ? { ...a, is_active: result.is_active } : a));
            } else {
                const newStatus = item.status === 'active' ? 'paused' : 'active';
                await api.put(`/flows/${item.original.id}/status`, { status: newStatus });
                setFlows(prev => prev.map(f => f.id === item.original.id ? { ...f, status: newStatus } : f));
            }
            toast.success('Automation updated');
        } catch (error) {
            console.error('Error toggling automation:', error);
            toast.error('Failed to update automation');
        }
    };

    const handleAddRecipe = async () => {
        try {
            setInstalling(true);
            await api.createAutomationRecipe({
                ...recipeFormData,
                // Default structure for now, can be expanded to include actual steps builder
                trigger_type: 'contact_added',
                actions: [],
                rating: 0,
                usage_count: 0
            });
            toast.success('Recipe added to library');
            setIsAddRecipeDialogOpen(false);
            loadAllData();
        } catch (error) {
            console.error('Failed to add recipe:', error);
            toast.error('Failed to add recipe');
        } finally {
            setInstalling(false);
        }
    };


    const handleSelectGroup = (items: Recipe[], checked: boolean) => {
        setSelectedRecipes(prev => {
            const next = new Set(prev);
            items.forEach(item => {
                if (checked) next.add(item.id);
                else next.delete(item.id);
            });
            return next;
        });
    };

    const handleInstallRecipe = async (recipe: Recipe, autoNavigate = true) => {
        try {
            setInstalling(true);
            console.log('Installing recipe:', recipe.id, recipe.name);
            // api methods return the JSON data directly
            const data = await api.post<any>(`/automation-recipes/${recipe.id}/install`, { name: recipe.name });
            console.log('Install response:', data);

            if (autoNavigate) {
                toast.success('Recipe installed successfully!');
                setIsPreviewOpen(false);
            }

            const installedId = data?.flow_id || data?.automation_id || data?.id;

            // Track the installation
            if (installedId) {
                setInstalledRecipes(prev => ({ ...prev, [recipe.id]: installedId }));
                // Reload data to update views
                await loadAllData();

                if (autoNavigate) {
                    if (data?.flow_id) {
                        navigate(`/automations/flows/${data.flow_id}`);
                    } else {
                        toast.info('Opening editor...');
                        navigate(`/automations/flows/new?automation=${installedId}&channel=${recipe.channels[0] || 'email'}`);
                    }
                }
            } else {
                await loadAllData();
            }
        } catch (error) {
            console.error('Failed to install recipe:', error);
            const errorMessage = (error as any)?.message || 'Failed to install recipe';
            toast.error(`Install failed: ${errorMessage}`);
        } finally {
            setInstalling(false);
        }
    };

    const handleUninstallRecipe = async (recipe: Recipe, confirmRequired = true) => {
        const id = getInstalledFlowId(recipe);
        if (!id) {
            if (confirmRequired) toast.error('No installation found for this recipe');
            return;
        }

        if (confirmRequired && !confirm(`Are you sure you want to uninstall "${recipe.name}"? This will delete the associated automation.`)) {
            return;
        }

        try {
            setInstalling(true);

            // If this is a user-owned "virtual" recipe (not yet a real template in DB),
            // we must save it as a real recipe before deleting the automation,
            // otherwise it will disappear from the library completely.
            if ((recipe as any).is_user_owned) {
                console.log('Saving virtual recipe as permanent template before uninstalling...', recipe.name);
                try {
                    // Create the persistent recipe
                    const recipeData = {
                        name: recipe.name,
                        description: recipe.description || `Template saved from ${recipe.name}`,
                        category: 'custom', // Force custom category for converted items
                        industry: recipe.industry || 'General',
                        target_audience: recipe.target_audience || 'Everyone',
                        channels: recipe.channels || ['email'],
                        type: recipe.type || 'workflow',
                        is_system: false,
                        trigger_type: recipe.trigger_type,
                        // For virtual recipes, the 'actions' and 'steps' are already populated in allAvailableRecipes
                        // but we might need to grab them from the live automation logic if needed.
                        // The 'recipe' object from allAvailableRecipes has mapped these from the original automation.
                        trigger_config: (recipe as any).trigger_config,
                        actions: recipe.actions || [],
                        usage_count: 1,
                        rating: 0
                    };

                    await api.createAutomationRecipe(recipeData);
                    toast.success('Saved to Library before uninstalling');
                } catch (saveError) {
                    console.error('Failed to save template during uninstall:', saveError);
                    toast.error('Warning: Could not save template to library. Uninstalling will remove it completely.');
                    // Proceed with delete or abort? 
                    // Let's proceed but user was warned implicitly by the error.
                }
            }

            console.log('Uninstalling recipe:', recipe.id, 'Flow ID:', id);

            // Fetch the automation/flow to confirm type before deleting
            // Or try the type from the recipe
            let success = false;

            if (recipe.type === 'workflow') {
                try {
                    console.log('Attempting to delete as workflow:', id);
                    await api.delete(`/flows/${id}`);
                    success = true;
                } catch (e) {
                    console.log('Workflow delete failed, trying as automation:', e);
                    await api.deleteAutomation(id);
                    success = true;
                }
            } else {
                try {
                    console.log('Attempting to delete as automation:', id);
                    await api.deleteAutomation(id);
                    success = true;
                } catch (e) {
                    console.log('Automation delete failed, trying as workflow:', e);
                    await api.delete(`/flows/${id}`);
                    success = true;
                }
            }

            if (success) {
                if (confirmRequired) toast.success('Automation uninstalled');
                // Remove from tracking map
                setInstalledRecipes(prev => {
                    const next = { ...prev };
                    delete next[recipe.id as any];
                    return next;
                });
                setIsPreviewOpen(false);
                await loadAllData();
            }
        } catch (error: any) {
            console.error('Failed to uninstall recipe:', error);
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to uninstall recipe';
            toast.error(`Uninstall failed: ${errorMessage}`);
        } finally {
            setInstalling(false);
        }
    };

    const handleDeleteRecipe = async (recipe: Recipe) => {
        if (recipe.is_system) {
            toast.error('System recipes cannot be deleted');
            return;
        }

        if (!confirm(`Are you sure you want to delete "${recipe.name}" from the library?`)) {
            return;
        }

        try {
            setLoading(true);
            await api.delete(`/automation-recipes/${recipe.id}`);
            toast.success('Recipe deleted from library');
            loadAllData();
        } catch (error) {
            console.error('Failed to delete recipe:', error);
            toast.error('Failed to delete recipe');
        } finally {
            setLoading(false);
        }
    };

    // Check if a recipe is installed
    const isRecipeInstalled = (recipe: Recipe): boolean => {
        // Source of truth: The installedRecipes mapping
        // If we have an ID mapped here, it is definitely installed
        if (installedRecipes[Number(recipe.id)]) {
            return true;
        }

        // For user-created items (which appear as virtual recipes), they are by definition installed
        if ((recipe as any).is_user_owned) {
            return true;
        }

        // Fallback: Check if the recipe object itself comes with installation info (e.g. from initial load)
        if (recipe.installed_flow_id || recipe.is_installed) {
            return true;
        }

        return false;
    };

    const getInstalledFlowId = (recipe: Recipe): number | undefined => {
        if (installedRecipes[recipe.id]) return installedRecipes[recipe.id];
        if (recipe.installed_flow_id) return recipe.installed_flow_id;
        if ((recipe as any).is_user_owned) return (recipe as any).installed_flow_id;
        return undefined;
    };

    const openInFlowBuilder = (item: any) => {
        if (item.type === 'trigger' || item.type === 'rule') {
            navigate(`/automations/flows/new?automation=${item.original.id}&channel=${item.original.channel}`);
        } else if (item.original.flow_id) {
            navigate(`/automations/flows/${item.original.flow_id}`);
        } else {
            toast.error('No flow associated with this automation');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', description: '', channel: 'call', trigger_type: '',
            trigger_conditions: {}, action_type: '', action_config: {},
            delay_amount: 0, delay_unit: 'hours', is_active: true, priority: 0,
            confidence_threshold: 70,
        });
        setConditionType('');
        setConditionValue('');
    };

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'email': return <Mail className="h-4 w-4" />;
            case 'sms': return <MessageSquare className="h-4 w-4" />;
            case 'call': return <Phone className="h-4 w-4" />;
            case 'form': return <FileTextIcon className="h-4 w-4" />;
            default: return <Zap className="h-4 w-4" />;
        }
    };

    // getDifficultyColor removed

    const Pagination = ({ total, current, onChange }: { total: number, current: number, onChange: (p: number) => void }) => {
        const totalPages = Math.ceil(total / itemsPerPage);
        if (totalPages <= 1) return null;

        return (
            <div className="flex items-center justify-between px-2 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                    Showing {(current - 1) * itemsPerPage + 1} to {Math.min(current * itemsPerPage, total)} of {total} items
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onChange(current - 1)}
                        disabled={current === 1}
                    >
                        Previous
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            // Simple logic for first 5 pages, can be expanded
                            return (
                                <Button
                                    key={i + 1}
                                    variant={current === i + 1 ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => onChange(i + 1)}
                                >
                                    {i + 1}
                                </Button>
                            );
                        })}
                        {totalPages > 5 && <span className="px-2 text-muted-foreground">...</span>}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onChange(current + 1)}
                        disabled={current === totalPages}
                    >
                        Next
                    </Button>
                </div>
            </div>
        );
    };

    if (authLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (<>
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Automations</h1>
                    <p className="text-muted-foreground mt-1">
                        Create automated workflows for email, SMS, and CRM
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setIsMethodDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Automation
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="my-automations" title="Total active automation instances running">
                        <Play className="h-4 w-4 mr-2" />
                        My Automations ({allAutomations.length})
                    </TabsTrigger>
                    <TabsTrigger value="library" title="Total available automation blueprints and templates">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Recipes Library ({allAvailableRecipes.length})
                    </TabsTrigger>
                </TabsList>

                {/* My Automations Tab */}
                <TabsContent value="my-automations" className="space-y-4">

                    {!selectedFolder ? (
                        /* FOLDER VIEW */
                        <div className="space-y-6">
                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total</p>
                                                <p className="text-2xl font-bold">{allAutomations.length}</p>
                                            </div>
                                            <Zap className="h-8 w-8 text-blue-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Triggers</p>
                                                <p className="text-2xl font-bold">{allAutomations.filter(a => a.type === 'trigger').length}</p>
                                            </div>
                                            <Zap className="h-8 w-8 text-orange-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Rules</p>
                                                <p className="text-2xl font-bold">{allAutomations.filter(a => a.type === 'rule').length}</p>
                                            </div>
                                            <SlidersHorizontal className="h-8 w-8 text-blue-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Workflows</p>
                                                <p className="text-2xl font-bold">{allAutomations.filter(a => a.type === 'workflow').length}</p>
                                            </div>
                                            <Workflow className="h-8 w-8 text-purple-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Active</p>
                                                <p className="text-2xl font-bold">{allAutomations.filter(a => a.status === 'active').length}</p>
                                            </div>
                                            <Zap className="h-8 w-8 text-green-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Separator />

                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input placeholder="Search folders..." className="pl-10" />
                                </div>
                                <div className="flex items-center gap-2 border rounded-md p-1 bg-muted/50">
                                    <Button
                                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        className="h-8 px-2"
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        className="h-8 px-2"
                                        onClick={() => setViewMode('list')}
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button onClick={() => setIsNewFolderDialogOpen(true)} variant="outline">
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Folder
                                </Button>
                            </div>

                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {rootFolders.map((folder) => (
                                        <div
                                            key={folder.id}
                                            className="group relative bg-white dark:bg-card border rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                                            onClick={() => navigateToFolder(folder)}
                                        >
                                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                                <div className={`p-2 rounded-lg ${folder.bg}`}>
                                                    <folder.icon className={`h-6 w-6 ${folder.color}`} />
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={e => e.stopPropagation()}>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigateToFolder(folder); }}>
                                                            <ArrowRight className="h-4 w-4 mr-2" /> Open
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsMethodDialogOpen(true); }}>
                                                            <Plus className="h-4 w-4 mr-2" /> Create Automation
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.success(`Exporting ${folder.name}...`); }}>
                                                            <Download className="h-4 w-4 mr-2" /> Export
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePrepareRename(folder); }}>
                                                            <Edit className="h-4 w-4 mr-2" /> Rename
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openMoveDialog([folder.id], 'folder'); }}>
                                                            <FolderInput className="h-4 w-4 mr-2" /> Move
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="text-red-600">
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <div className="mt-4">
                                                <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-4">
                                                    <Folder className="h-5 w-5 text-slate-500" />
                                                </div>
                                                <h3 className="text-lg font-semibold">{folder.name}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {folderStats[folder.id]?.total || 0} automations
                                                </p>
                                            </div>
                                            <div className="mt-4 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Open Folder <ArrowRight className="h-4 w-4 ml-1" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Card>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Folder Name</TableHead>
                                                <TableHead>Triggers</TableHead>
                                                <TableHead>Rules</TableHead>
                                                <TableHead>Workflows</TableHead>
                                                <TableHead>Enabled</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rootFolders.map((folder) => (
                                                <TableRow
                                                    key={folder.id}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => navigateToFolder(folder)}
                                                >
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${folder.bg}`}>
                                                                <folder.icon className={`h-4 w-4 ${folder.color}`} />
                                                            </div>
                                                            {folder.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-100">
                                                                {folderStats[folder.id]?.triggers || 0}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100">
                                                                {folderStats[folder.id]?.rules || 0}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-100">
                                                                {folderStats[folder.id]?.workflows || 0}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">
                                                                {folderStats[folder.id]?.active || 0}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-muted-foreground font-medium">
                                                            {folderStats[folder.id]?.total || 0} items
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigateToFolder(folder); }}>
                                                                    <ArrowRight className="h-4 w-4 mr-2" /> Open
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsMethodDialogOpen(true); }}>
                                                                    <Plus className="h-4 w-4 mr-2" /> Create Automation
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.success(`Exporting ${folder.name}...`); }}>
                                                                    <Download className="h-4 w-4 mr-2" /> Export
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePrepareRename(folder); }}>
                                                                    <Edit className="h-4 w-4 mr-2" /> Rename
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openMoveDialog([folder.id], 'folder'); }}>
                                                                    <FolderInput className="h-4 w-4 mr-2" /> Move
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="text-red-600">
                                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Card>
                            )}
                        </div>
                    ) : (
                        /* FOLDER CONTENT VIEW */
                        <div className="space-y-4">
                            {/* Breadcrumb Navigation */}
                            <div className="flex items-center gap-2 mb-6 flex-wrap">
                                <Button variant="ghost" size="sm" className="pl-0" onClick={() => navigateToBreadcrumb(-1)}>
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    All Folders
                                </Button>
                                {folderPath.map((crumb, idx) => (
                                    <div key={crumb.id} className="flex items-center gap-2">
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        <Button
                                            variant={idx === folderPath.length - 1 ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => navigateToBreadcrumb(idx)}
                                            className={idx === folderPath.length - 1 ? 'font-semibold' : ''}
                                        >
                                            {crumb.name}
                                        </Button>
                                    </div>
                                ))}
                                <div className="ml-auto flex items-center gap-2">
                                    <Button onClick={() => setIsNewFolderDialogOpen(true)} variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Subfolder
                                    </Button>
                                </div>
                            </div>

                            {/* Subfolders Section */}
                            {currentSubfolders.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Subfolders</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {currentSubfolders.map((subfolder) => (
                                            <div
                                                key={subfolder.id}
                                                className="group flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => navigateToFolder(subfolder)}
                                            >
                                                <div className={`p-2 rounded-lg ${subfolder.bg}`}>
                                                    <subfolder.icon className={`h-5 w-5 ${subfolder.color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{subfolder.name}</p>
                                                    <p className="text-xs text-muted-foreground">{folders.filter(f => f.parentId === subfolder.id).length} subfolders</p>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigateToFolder(subfolder); }}>
                                                            <ArrowRight className="h-4 w-4 mr-2" /> Open
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsMethodDialogOpen(true); }}>
                                                            <Plus className="h-4 w-4 mr-2" /> Create Automation
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.success(`Exporting ${subfolder.name}...`); }}>
                                                            <Download className="h-4 w-4 mr-2" /> Export
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePrepareRename(subfolder); }}>
                                                            <Edit className="h-4 w-4 mr-2" /> Rename
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openMoveDialog([subfolder.id], 'folder'); }}>
                                                            <FolderInput className="h-4 w-4 mr-2" /> Move
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteFolder(subfolder.id); }} className="text-red-600">
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                                            </div>
                                        ))}
                                    </div>
                                    <Separator className="my-4" />
                                </div>
                            )}

                            {/* Automations Section Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Automations</h3>
                                <Badge variant="secondary">
                                    {filteredAutomations.length}
                                </Badge>
                            </div>

                            {selectedAutomations.size > 0 && (
                                <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-md flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                    <span className="text-sm font-medium">{selectedAutomations.size} selected</span>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => openMoveDialog(Array.from(selectedAutomations))} className="hover:bg-primary/10">
                                            <FolderInput className="h-4 w-4 mr-2" />
                                            Move
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={handleBulkDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setSelectedAutomations(new Set())}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Filters inside folder */}
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input placeholder="Search in this folder..." value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                                </div>
                                <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger className="w-[140px]">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="trigger">Triggers</SelectItem>
                                        <SelectItem value="rule">Rules</SelectItem>
                                        <SelectItem value="workflow">Workflows</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="paused">Paused</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Channel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Channels</SelectItem>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="sms">SMS</SelectItem>
                                        <SelectItem value="call">Call</SelectItem>
                                        <SelectItem value="form">Form</SelectItem>
                                    </SelectContent>
                                </Select>
                                {(selectedType !== 'all' || selectedStatus !== 'all' || selectedChannel !== 'all') && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedType('all');
                                            setSelectedStatus('all');
                                            setSelectedChannel('all');
                                        }}
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Clear Filters
                                    </Button>
                                )}
                            </div>

                            {/* Table */}
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : filteredAutomations.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-16">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-full mb-4">
                                            <Folder className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">Folder is empty</h3>
                                        <p className="text-muted-foreground mb-4">No automations found in this category.</p>
                                        <Button onClick={() => setIsMethodDialogOpen(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create New
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <>
                                    <Accordion type="multiple" defaultValue={["triggers", "rules", "workflows"]} className="space-y-6">
                                        {/* Triggers Section */}
                                        <AccordionItem value="triggers" className="border rounded-xl bg-white dark:bg-card shadow-sm overflow-hidden">
                                            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                                <div className="flex items-center gap-4 text-left">
                                                    <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                                                        <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Triggers</h3>
                                                        <p className="text-sm text-muted-foreground">Active event-based automations ({automationsByType.triggers.length})</p>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-0 pb-0 border-t">
                                                <div className="border-0">
                                                    <Table>
                                                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/20">
                                                            <TableRow>
                                                                <TableHead className="pl-6">Automation Name</TableHead>
                                                                <TableHead>Channel</TableHead>
                                                                <TableHead>Trigger</TableHead>
                                                                <TableHead>Action</TableHead>
                                                                <TableHead>Delay</TableHead>
                                                                <TableHead>Status</TableHead>
                                                                <TableHead className="pr-6 text-right">Actions</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {automationsByType.triggers.length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                                        No triggers found
                                                                    </TableCell>
                                                                </TableRow>
                                                            ) : (
                                                                automationsByType.triggers.map((item) => (
                                                                    <TableRow key={item.id} className="hover:bg-muted/30 group">
                                                                        <TableCell className="pl-6 py-4">
                                                                            <div className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</div>
                                                                            {item.description && (
                                                                                <div className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                                                                                    {item.description}
                                                                                </div>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge variant="outline" className="flex items-center gap-1.5 w-fit text-[12px] font-medium py-0.5">
                                                                                {getChannelIcon(item.channel)}
                                                                                <span className="capitalize">{item.channel}</span>
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="flex flex-col gap-1">
                                                                                <span className="text-sm font-medium">{item.trigger}</span>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <span className="text-sm text-muted-foreground">{item.action}</span>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <span className="text-sm text-muted-foreground">{item.delay}</span>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="flex items-center gap-2">
                                                                                <div onClick={(e) => e.stopPropagation()}>
                                                                                    <Switch
                                                                                        checked={item.status === 'active'}
                                                                                        onCheckedChange={() => handleToggleAutomation(item)}
                                                                                    />
                                                                                </div>
                                                                                <span className={`text-[12px] uppercase font-bold tracking-tight ${item.status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
                                                                                    {item.status}
                                                                                </span>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="pr-6 text-right">
                                                                            <div className="flex items-center justify-end gap-1">
                                                                                <Button size="sm" variant="ghost" className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10" onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setEditingAutomation(item.original);
                                                                                    setFormData({ ...item.original });
                                                                                    setIsCreateDialogOpen(true);
                                                                                }}>
                                                                                    <Edit className="h-4 w-4 mr-1.5" />
                                                                                    Edit
                                                                                </Button>
                                                                                <DropdownMenu>
                                                                                    <DropdownMenuTrigger asChild>
                                                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </DropdownMenuTrigger>
                                                                                    <DropdownMenuContent align="end">
                                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicateAutomation(item); }}>
                                                                                            <Copy className="h-4 w-4 mr-2" /> Duplicate
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openMoveDialog([item.id]); }}>
                                                                                            <FolderInput className="h-4 w-4 mr-2" /> Move to Folder
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSaveAsTemplate(item); }}>
                                                                                            <BookOpen className="h-4 w-4 mr-2" /> Save as Recipe
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuSeparator />
                                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteAutomation(item); }} className="text-red-600 focus:text-red-600">
                                                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                                                        </DropdownMenuItem>
                                                                                    </DropdownMenuContent>
                                                                                </DropdownMenu>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>

                                        {/* Rules Section */}
                                        <AccordionItem value="rules" className="border rounded-xl bg-white dark:bg-card shadow-sm overflow-hidden">
                                            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                                <div className="flex items-center gap-4 text-left">
                                                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                                        <SlidersHorizontal className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Rules</h3>
                                                        <p className="text-sm text-muted-foreground">Conditional logic and filters ({automationsByType.rules.length})</p>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-0 pb-0 border-t">
                                                <div className="border-0">
                                                    <Table>
                                                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/20">
                                                            <TableRow>
                                                                <TableHead className="pl-6">Automation Name</TableHead>
                                                                <TableHead>Channel</TableHead>
                                                                <TableHead>Trigger</TableHead>
                                                                <TableHead>Action</TableHead>
                                                                <TableHead>Delay</TableHead>
                                                                <TableHead>Status</TableHead>
                                                                <TableHead className="pr-6 text-right">Actions</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {automationsByType.rules.length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                                        No rules found
                                                                    </TableCell>
                                                                </TableRow>
                                                            ) : (
                                                                automationsByType.rules.map((item) => (
                                                                    <TableRow key={item.id} className="hover:bg-muted/30 group">
                                                                        <TableCell className="pl-6 py-4">
                                                                            <div className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</div>
                                                                            {item.description && (
                                                                                <div className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                                                                                    {item.description}
                                                                                </div>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge variant="outline" className="flex items-center gap-1.5 w-fit text-[12px] font-medium py-0.5">
                                                                                {getChannelIcon(item.channel)}
                                                                                <span className="capitalize">{item.channel}</span>
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="flex flex-col gap-1">
                                                                                <span className="text-sm font-medium">{item.trigger}</span>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <span className="text-sm text-muted-foreground">{item.action}</span>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <span className="text-sm text-muted-foreground">{item.delay}</span>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="flex items-center gap-2">
                                                                                <div onClick={(e) => e.stopPropagation()}>
                                                                                    <Switch
                                                                                        checked={item.status === 'active'}
                                                                                        onCheckedChange={() => handleToggleAutomation(item)}
                                                                                    />
                                                                                </div>
                                                                                <span className={`text-[12px] uppercase font-bold tracking-tight ${item.status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
                                                                                    {item.status}
                                                                                </span>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="pr-6 text-right">
                                                                            <div className="flex items-center justify-end gap-1">
                                                                                <Button size="sm" variant="ghost" className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10" onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setEditingAutomation(item.original);
                                                                                    setFormData({ ...item.original });
                                                                                    setIsCreateDialogOpen(true);
                                                                                }}>
                                                                                    <Edit className="h-4 w-4 mr-1.5" />
                                                                                    Edit
                                                                                </Button>
                                                                                <DropdownMenu>
                                                                                    <DropdownMenuTrigger asChild>
                                                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </DropdownMenuTrigger>
                                                                                    <DropdownMenuContent align="end">
                                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicateAutomation(item); }}>
                                                                                            <Copy className="h-4 w-4 mr-2" /> Duplicate
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openMoveDialog([item.id]); }}>
                                                                                            <FolderInput className="h-4 w-4 mr-2" /> Move to Folder
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSaveAsTemplate(item); }}>
                                                                                            <BookOpen className="h-4 w-4 mr-2" /> Save as Recipe
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuSeparator />
                                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteAutomation(item); }} className="text-red-600 focus:text-red-600">
                                                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                                                        </DropdownMenuItem>
                                                                                    </DropdownMenuContent>
                                                                                </DropdownMenu>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>

                                        {/* Workflows Section */}
                                        <AccordionItem value="workflows" className="border rounded-xl bg-white dark:bg-card shadow-sm overflow-hidden">
                                            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                                <div className="flex items-center gap-4 text-left">
                                                    <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                                                        <Workflow className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Workflows</h3>
                                                        <p className="text-sm text-muted-foreground">Multi-step sequences ({automationsByType.workflows.length})</p>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-0 pb-0 border-t">
                                                <div className="border-0">
                                                    <Table>
                                                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/20">
                                                            <TableRow>
                                                                <TableHead className="pl-6">Workflow Name</TableHead>
                                                                <TableHead>Channel</TableHead>
                                                                <TableHead>Nodes</TableHead>
                                                                <TableHead>Trigger</TableHead>
                                                                <TableHead>Status</TableHead>
                                                                <TableHead className="pr-6 text-right">Actions</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {automationsByType.workflows.length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                                        No workflows found
                                                                    </TableCell>
                                                                </TableRow>
                                                            ) : (
                                                                automationsByType.workflows.map((item) => (
                                                                    <TableRow key={item.id} className="hover:bg-muted/30 group">
                                                                        <TableCell className="pl-6 py-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                                                                                    <Workflow className="h-4 w-4" />
                                                                                </div>
                                                                                <div>
                                                                                    <div className="font-semibold text-base">{item.name}</div>
                                                                                    <div className="text-sm text-muted-foreground mt-0.5 max-w-xs truncate">{item.description}</div>
                                                                                </div>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge variant="outline" className="flex items-center gap-1.5 w-fit text-[12px] font-medium py-0.5">
                                                                                {getChannelIcon(item.channel)}
                                                                                <span className="capitalize">{item.channel}</span>
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge variant="secondary" className="px-2 py-0.5 font-medium">
                                                                                {item.action}
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge variant="outline" className="text-[12px] uppercase font-bold tracking-tight px-1.5 py-0">
                                                                                {item.trigger}
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="flex items-center gap-2">
                                                                                <div onClick={(e) => e.stopPropagation()}>
                                                                                    <Switch
                                                                                        checked={item.status === 'active'}
                                                                                        onCheckedChange={() => handleToggleAutomation(item)}
                                                                                    />
                                                                                </div>
                                                                                <span className={`text-[12px] uppercase font-bold tracking-tight ${item.status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
                                                                                    {item.status}
                                                                                </span>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="pr-6 text-right">
                                                                            <div className="flex items-center justify-end gap-1">
                                                                                <Button size="sm" variant="ghost" className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); openInFlowBuilder(item); }}>
                                                                                    <Workflow className="h-4 w-4 mr-1.5" />
                                                                                    Visual Builder
                                                                                </Button>
                                                                                <DropdownMenu>
                                                                                    <DropdownMenuTrigger asChild>
                                                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </DropdownMenuTrigger>
                                                                                    <DropdownMenuContent align="end">
                                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicateAutomation(item); }}>
                                                                                            <Copy className="h-4 w-4 mr-2" /> Duplicate
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openMoveDialog([item.id]); }}>
                                                                                            <FolderInput className="h-4 w-4 mr-2" /> Move to Folder
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSaveAsTemplate(item); }}>
                                                                                            <BookOpen className="h-4 w-4 mr-2" /> Save as Recipe
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuSeparator />
                                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteAutomation(item); }} className="text-red-600 focus:text-red-600">
                                                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                                                        </DropdownMenuItem>
                                                                                    </DropdownMenuContent>
                                                                                </DropdownMenu>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                    <Pagination
                                        total={filteredAutomations.length}
                                        current={myAutomationsPage}
                                        onChange={setMyAutomationsPage}
                                    />
                                </>
                            )}
                        </div>
                    )}
                </TabsContent>

                {/* Library Tab */}
                <TabsContent value="library" className="space-y-4">
                    {/* Search and filters */}
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search recipes..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Button variant="outline" onClick={() => setIsAddRecipeDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" /> Add Recipe
                            </Button>
                            <Select value={selectedCategory || '__all'} onValueChange={(v) => setSelectedCategory(v === '__all' ? null : v)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all">All ({recipes.length + allAutomations.length})</SelectItem>
                                    {Object.entries(categoryLabels)
                                        .filter(([key]) => key !== 'my-automations')
                                        .sort((a, b) => a[1].localeCompare(b[1]))
                                        .map(([key, label]) => {
                                            const channelAutomationsCount = allAutomations.filter(a => a.channel === key).length;
                                            const recipeCategoryCount = recipes.filter(r => r.category === key).length;
                                            const count = key === 'my-automations'
                                                ? allAutomations.length
                                                : recipeCategoryCount + channelAutomationsCount;
                                            if (count === 0 && key !== 'my-automations') return null;
                                            return (
                                                <SelectItem key={key} value={key}>
                                                    {label} ({count})
                                                </SelectItem>
                                            );
                                        })}
                                </SelectContent>
                            </Select>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="w-[140px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="trigger">Triggers</SelectItem>
                                    <SelectItem value="rule">Rules</SelectItem>
                                    <SelectItem value="workflow">Workflows</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                                <SelectTrigger className="w-[140px]">
                                    <ArrowUpDown className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="popular">Most Popular</SelectItem>
                                    <SelectItem value="rating">Highest Rated</SelectItem>
                                    <SelectItem value="newest">Newest</SelectItem>
                                    <SelectItem value="name">Name A-Z</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex border rounded-md">
                                <Button
                                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="rounded-r-none"
                                    onClick={() => setViewMode('grid')}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="rounded-l-none"
                                    onClick={() => setViewMode('table')}
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {selectedRecipes.size > 0 && (
                        <div className="bg-slate-900 text-white px-6 py-3 rounded-xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium">{selectedRecipes.size} recipes selected</span>
                                <div className="h-4 w-[1px] bg-slate-700" />
                                <Button size="sm" variant="ghost" className="text-white hover:bg-slate-800" onClick={() => setSelectedRecipes(new Set())}>
                                    Clear
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100" onClick={handleBulkInstall}>
                                    <Download className="h-4 w-4 mr-2" /> Bulk Install
                                </Button>
                                <Button size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={handleBulkUninstall}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Bulk Uninstall
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Results - Accordion-based Organization */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <Accordion type="multiple" defaultValue={["triggers", "rules", "workflows"]} className="space-y-6">
                            {/* Triggers Section */}
                            <AccordionItem value="triggers" className="border rounded-xl bg-white dark:bg-card shadow-sm overflow-hidden">
                                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                                            <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Triggers</h3>
                                            <p className="text-sm text-muted-foreground">Ready-to-use "If This, Then That" templates ({recipesByType.triggers.length})</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-0 pb-0 border-t">
                                    <Table>
                                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/20">
                                            <TableRow>
                                                <TableHead className="pl-6 w-[50px]">
                                                    <Checkbox
                                                        checked={recipesByType.triggers.length > 0 && recipesByType.triggers.every(r => selectedRecipes.has(r.id))}
                                                        onCheckedChange={(checked) => handleSelectGroup(recipesByType.triggers, checked === true)}
                                                    />
                                                </TableHead>
                                                <TableHead className="font-semibold py-4">Trigger Template</TableHead>
                                                <TableHead className="font-semibold">Trigger</TableHead>
                                                <TableHead className="font-semibold">Action</TableHead>
                                                <TableHead className="font-semibold">Channels</TableHead>
                                                <TableHead className="font-semibold">Steps</TableHead>
                                                <TableHead className="font-semibold text-right pr-6">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recipesByType.triggers.map((recipe) => (
                                                <TableRow key={recipe.id} className="hover:bg-muted/30 transition-colors">
                                                    <TableCell className="pl-6 py-4">
                                                        <Checkbox
                                                            checked={selectedRecipes.has(recipe.id)}
                                                            onCheckedChange={(checked) => handleSelectOneRecipe(recipe.id, checked === true)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-bold text-base">{recipe.name}</div>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground mt-1 max-w-md">{recipe.description}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm font-medium">
                                                            {(recipe as any).trigger_label || options?.trigger_types[recipe.channels[0]]?.[recipe.trigger_type || ''] || recipe.trigger_type}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-muted-foreground">
                                                            {(recipe as any).action_label || options?.action_types[recipe.actions?.[0]?.action_type || ''] || recipe.actions?.[0]?.action_type || 'Custom Action'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1.5">
                                                            {recipe.channels.map((c, i) => (
                                                                <div key={i} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800" title={c}>
                                                                    {getChannelIcon(c)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="px-2 py-0.5 rounded-full text-[12px] font-medium">
                                                            {recipe.actions?.length || recipe.steps?.length || 1} Steps
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setSelectedRecipe(recipe); setIsPreviewOpen(true); }} title="Preview">
                                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                                            </Button>

                                                            {isRecipeInstalled(recipe) ? (
                                                                <Button size="sm" variant="destructive" className="shadow-sm h-8 px-4 bg-red-600 hover:bg-red-700 w-24" onClick={() => handleUninstallRecipe(recipe)} title="Uninstall blueprint">
                                                                    Uninstall
                                                                </Button>
                                                            ) : (
                                                                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm h-8 px-4 w-24" onClick={() => handleInstallRecipe(recipe)} disabled={installing}>
                                                                    Install
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Rules Section */}
                            <AccordionItem value="rules" className="border rounded-xl bg-white dark:bg-card shadow-sm overflow-hidden">
                                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                            <SlidersHorizontal className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Rules</h3>
                                            <p className="text-sm text-muted-foreground">Smart filters and conditional logic templates ({recipesByType.rules.length})</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-0 pb-0 border-t">
                                    <Table>
                                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/20">
                                            <TableRow>
                                                <TableHead className="pl-6 w-[50px]">
                                                    <Checkbox
                                                        checked={recipesByType.rules.length > 0 && recipesByType.rules.every(r => selectedRecipes.has(r.id))}
                                                        onCheckedChange={(checked) => handleSelectGroup(recipesByType.rules, checked === true)}
                                                    />
                                                </TableHead>
                                                <TableHead className="font-semibold py-4">Rule Template</TableHead>
                                                <TableHead className="font-semibold">Trigger</TableHead>
                                                <TableHead className="font-semibold">Action</TableHead>
                                                <TableHead className="font-semibold">Channels</TableHead>
                                                <TableHead className="font-semibold">Steps</TableHead>
                                                <TableHead className="font-semibold text-right pr-6">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recipesByType.rules.map((recipe) => (
                                                <TableRow key={recipe.id} className="hover:bg-muted/30 transition-colors">
                                                    <TableCell className="pl-6 py-4">
                                                        <Checkbox
                                                            checked={selectedRecipes.has(recipe.id)}
                                                            onCheckedChange={(checked) => handleSelectOneRecipe(recipe.id, checked === true)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-bold text-base">{recipe.name}</div>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground mt-1 max-w-md">{recipe.description}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm font-medium">
                                                            {(recipe as any).trigger_label || options?.trigger_types[recipe.channels[0]]?.[recipe.trigger_type || ''] || recipe.trigger_type}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-muted-foreground">
                                                            {(recipe as any).action_label || options?.action_types[recipe.actions?.[0]?.action_type || ''] || recipe.actions?.[0]?.action_type || 'Custom Action'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1.5">
                                                            {recipe.channels.map((c, i) => (
                                                                <div key={i} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800" title={c}>
                                                                    {getChannelIcon(c)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="px-2 py-0.5 rounded-full text-[12px] font-medium">
                                                            {recipe.actions?.length || recipe.steps?.length || 1} Steps
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setSelectedRecipe(recipe); setIsPreviewOpen(true); }} title="Preview">
                                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                                            </Button>

                                                            {isRecipeInstalled(recipe) ? (
                                                                <Button size="sm" variant="destructive" className="shadow-sm h-8 px-4 bg-red-600 hover:bg-red-700 w-24" onClick={() => handleUninstallRecipe(recipe)} title="Uninstall blueprint">
                                                                    Uninstall
                                                                </Button>
                                                            ) : (
                                                                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm h-8 px-4 w-24" onClick={() => handleInstallRecipe(recipe)} disabled={installing}>
                                                                    Install
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Workflows Section - Inline Spreadsheet Editor */}
                            <AccordionItem value="workflows" className="border rounded-xl bg-white dark:bg-card shadow-sm overflow-hidden">
                                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                                            <Workflow className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Workflows</h3>
                                            <p className="text-sm text-muted-foreground">Comprehensive multi-step automation sequences ({recipesByType.workflows.length})</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-0 pb-0 border-t bg-slate-50/30 dark:bg-slate-900/5">
                                    <Table>
                                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/20">
                                            <TableRow>
                                                <TableHead className="pl-6 w-[50px]">
                                                    <Checkbox
                                                        checked={recipesByType.workflows.length > 0 && recipesByType.workflows.every(r => selectedRecipes.has(r.id))}
                                                        onCheckedChange={(checked) => handleSelectGroup(recipesByType.workflows, checked === true)}
                                                    />
                                                </TableHead>
                                                <TableHead className="font-semibold py-4">Workflow Blueprint</TableHead>
                                                <TableHead className="font-semibold">Channels</TableHead>
                                                <TableHead className="font-semibold">Nodes</TableHead>
                                                <TableHead className="font-semibold">Trigger</TableHead>
                                                <TableHead className="font-semibold text-right pr-6">Status & Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recipesByType.workflows.map((recipe) => {
                                                const flowId = installedRecipes[recipe.id as any] || recipe.installed_flow_id;
                                                const isEditing = editingWorkflowId === flowId;

                                                return (
                                                    <React.Fragment key={recipe.id}>
                                                        <TableRow className={`hover:bg-muted/30 transition-colors ${isEditing ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''}`}>
                                                            <TableCell className="pl-6 py-4">
                                                                <Checkbox
                                                                    checked={selectedRecipes.has(recipe.id)}
                                                                    onCheckedChange={(checked) => handleSelectOneRecipe(recipe.id, checked === true)}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                                                                        <Workflow className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="font-bold text-base">{recipe.name}</div>
                                                                        </div>
                                                                        <div className="text-sm text-muted-foreground mt-0.5 line-clamp-1 max-w-xs">{recipe.description}</div>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-1">
                                                                    {recipe.channels.map((c, i) => (
                                                                        <div key={i} className="p-1 rounded bg-slate-100 dark:bg-slate-800" title={c}>
                                                                            {getChannelIcon(c)}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="secondary" className="px-2 py-0.5 font-medium">
                                                                    {recipe.actions?.length || recipe.steps?.length || 5} Nodes
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="text-[12px] uppercase font-bold tracking-tight px-1.5 py-0">
                                                                    {recipe.trigger_type || 'Incoming Hook'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right pr-6">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setSelectedRecipe(recipe); setIsPreviewOpen(true); }} title="Preview">
                                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                                    </Button>

                                                                    {isRecipeInstalled(recipe) ? (
                                                                        <Button size="sm" variant="destructive" className="shadow-sm h-8 px-4 bg-red-600 hover:bg-red-700 w-24" onClick={() => handleUninstallRecipe(recipe)} title="Uninstall">
                                                                            Uninstall
                                                                        </Button>
                                                                    ) : (
                                                                        <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm h-8 px-4 w-24" onClick={() => handleInstallRecipe(recipe)} disabled={installing}>
                                                                            {installing ? '...' : 'Install'}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>

                                                        {isEditing && flowId && (
                                                            <TableRow className="bg-white dark:bg-slate-950">
                                                                <TableCell colSpan={5} className="p-0 border-b-2 border-purple-200 dark:border-purple-800 shadow-inner">
                                                                    <div className="h-[600px] relative">
                                                                        <AutomationSpreadsheetView
                                                                            flowId={flowId}
                                                                            mode="embedded"
                                                                            syncEnabled={true}
                                                                            onSave={() => {
                                                                                loadAllData();
                                                                                toast.success('Blueprint updated successfully');
                                                                            }}
                                                                            onClose={() => setEditingWorkflowId(null)}
                                                                        />
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    )}
                    <Pagination
                        total={filteredRecipes.length}
                        current={libraryPage}
                        onChange={setLibraryPage}
                    />
                </TabsContent>
                <TabsContent value="playbooks" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Playbook Templates</h2>
                            <p className="text-muted-foreground">Pre-built automations and campaigns for your industry</p>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="relative flex-1 max-w-xs">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search playbooks..." value={playbooksSearchTerm} onChange={e => setPlaybooksSearchTerm(e.target.value)} className="pl-9" />
                                </div>
                                <Select value={playbooksIndustryFilter} onValueChange={setPlaybooksIndustryFilter}>
                                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Industry" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Industries</SelectItem>
                                        {PLAYBOOK_INDUSTRIES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={playbooksCategoryFilter} onValueChange={setPlaybooksCategoryFilter}>
                                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {PLAYBOOK_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={playbooksTypeFilter} onValueChange={setPlaybooksTypeFilter}>
                                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {PLAYBOOK_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs value={playbooksActiveTab} onValueChange={setPlaybooksActiveTab}>
                        <TabsList>
                            <TabsTrigger value="all">All Playbooks ({PLAYBOOK_TEMPLATES.length})</TabsTrigger>
                            <TabsTrigger value="featured">Featured ({PLAYBOOK_TEMPLATES.filter(p => p.featured).length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value={playbooksActiveTab} className="mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredPlaybooks.map(playbook => (
                                    <Card key={playbook.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2">
                                                    {getPlaybookTypeIcon(playbook.type)}
                                                    <CardTitle className="text-lg">{playbook.name}</CardTitle>
                                                </div>
                                                {playbook.featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                                            </div>
                                            <CardDescription>{playbook.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                <Badge style={{ backgroundColor: INDUSTRY_COLORS[playbook.industry as IndustrySlug] + '20', color: INDUSTRY_COLORS[playbook.industry as IndustrySlug] }}>
                                                    {getPlaybookIndustryLabel(playbook.industry)}
                                                </Badge>
                                                <Badge variant="outline">{getPlaybookCategoryLabel(playbook.category)}</Badge>
                                                <Badge variant="secondary">{PLAYBOOK_TYPES.find(t => t.value === playbook.type)?.label}</Badge>
                                            </div>
                                            <Button className="w-full" onClick={() => installPlaybook(playbook)}>
                                                <Download className="h-4 w-4 mr-2" />Install Playbook
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                                {filteredPlaybooks.length === 0 && (
                                    <Card className="col-span-full">
                                        <CardContent className="py-8 text-center text-muted-foreground">
                                            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No playbooks match your filters</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </TabsContent>
            </Tabs>

            {/* Creation Method Selection Dialog */}
            <Dialog open={isMethodDialogOpen} onOpenChange={setIsMethodDialogOpen} >
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-center mb-2">How would you like to start?</DialogTitle>
                        <DialogDescription className="text-center mb-6">
                            Choose the best way to build your new automation
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                        <Card
                            className="cursor-pointer hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group border-2"
                            onClick={() => {
                                setIsMethodDialogOpen(false);
                                setIsCreateDialogOpen(true);
                            }}
                        >
                            <CardHeader className="text-center">
                                <div className="mx-auto h-16 w-16 rounded-2xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                                    <Zap className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                                </div>
                                <CardTitle className="text-lg">Triggers</CardTitle>
                                <CardDescription>Set up a simple "If this, then that" trigger automation in seconds. Perfect for instant replies.</CardDescription>
                            </CardHeader>
                        </Card>

                        <Card
                            className="cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group border-2"
                            onClick={() => navigate('/automations/flows/new')}
                        >
                            <CardHeader className="text-center">
                                <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                                    <Workflow className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <CardTitle className="text-lg">Workflows</CardTitle>
                                <CardDescription>Design complex, multi-step flows with our powerful visual editor. Best for campaigns and logic.</CardDescription>
                            </CardHeader>
                        </Card>

                        <Card
                            className="cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group border-2"
                            onClick={() => {
                                handleTabChange('library');
                                setIsMethodDialogOpen(false);
                            }}
                        >
                            <CardHeader className="text-center">
                                <div className="mx-auto h-16 w-16 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                                    <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                </div>
                                <CardTitle className="text-lg">Browse Templates</CardTitle>
                                <CardDescription>Start quickly with pre-built recipes for common scenarios like appointment reminders.</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Automation Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create Automation</DialogTitle>
                        <DialogDescription>Configure a trigger, rule, or workflow automation</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Automation Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Channel</Label>
                                <Select
                                    value={formData.channel}
                                    onValueChange={(v: any) => setFormData({ ...formData, channel: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="sms">SMS</SelectItem>
                                        <SelectItem value="call">Call</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe what this automation does"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Trigger</Label>
                                <Select
                                    value={formData.trigger_type}
                                    onValueChange={(v) => setFormData({ ...formData, trigger_type: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select trigger" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options?.trigger_types[formData.channel] && Object.entries(options.trigger_types[formData.channel]).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Action</Label>
                                <Select
                                    value={formData.action_type}
                                    onValueChange={(v) => setFormData({ ...formData, action_type: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select action" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options?.action_types && Object.entries(options.action_types).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Delay</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        value={formData.delay_amount}
                                        onChange={(e) => setFormData({ ...formData, delay_amount: parseInt(e.target.value) })}
                                    />
                                    <Select
                                        value={formData.delay_unit}
                                        onValueChange={(v: any) => setFormData({ ...formData, delay_unit: v })}
                                    >
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="minutes">Mins</SelectItem>
                                            <SelectItem value="hours">Hours</SelectItem>
                                            <SelectItem value="days">Days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateAutomation}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen} >
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {selectedRecipe && categoryIcons[selectedRecipe.category]}
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {selectedRecipe ? categoryLabels[selectedRecipe.category] : ''}
                                </span>
                            </div>
                        </div>
                        <DialogTitle className="text-xl flex items-center gap-2 flex-wrap">
                            {selectedRecipe?.name}
                            <div className="flex items-center gap-1.5 ml-auto">
                                {selectedRecipe?.type === 'trigger' ? (
                                    <Badge variant="outline" className="text-[12px] bg-orange-50 text-orange-700 border-orange-200">
                                        <Zap className="h-3 w-3 mr-1" /> Trigger
                                    </Badge>
                                ) : selectedRecipe?.type === 'rule' ? (
                                    <Badge variant="outline" className="text-[12px] bg-blue-50 text-blue-700 border-blue-200">
                                        <SlidersHorizontal className="h-3 w-3 mr-1" /> Rule
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[12px] bg-purple-50 text-purple-700 border-purple-200">
                                        <Workflow className="h-3 w-3 mr-1" /> Workflow
                                    </Badge>
                                )}
                                {selectedRecipe?.channels.map(c => (
                                    <Badge key={c} variant="secondary" className="text-[12px] font-medium">
                                        {getChannelIcon(c)} <span className="ml-1">{c}</span>
                                    </Badge>
                                ))}
                            </div>
                        </DialogTitle>
                        <DialogDescription className="text-sm mt-1">{selectedRecipe?.description}</DialogDescription>
                    </DialogHeader>

                    <Separator className="my-2" />



                    {/* Detailed structure preview */}
                    <div className="mt-4 border rounded-lg overflow-hidden bg-card">
                        <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
                            <span className="text-xs font-bold uppercase text-muted-foreground tracking-tight">Automation Path</span>
                            <Badge variant="secondary" className="text-[12px] h-5">
                                {selectedRecipe?.type === 'trigger' ? 'Linear Trigger' : selectedRecipe?.type === 'rule' ? 'Conditional Rule' : 'Multi-step Workflow'}
                            </Badge>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Trigger Section */}
                            <div className="flex items-start gap-4">
                                <div className="mt-1 h-10 w-10 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 shadow-sm border border-orange-200">
                                    <Zap className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-[12px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-0.5">When This Happens</div>
                                    <div className="text-base font-semibold">
                                        {(selectedRecipe as any)?.trigger_label || selectedRecipe?.trigger_type || 'Custom Event'}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">Automation begins when this event is detected</div>
                                </div>
                            </div>

                            {/* Actions Section */}
                            <div className="relative pl-14 space-y-5">
                                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-200 via-blue-200 to-green-200 dark:from-orange-900/50 dark:via-blue-900/50 dark:to-green-900/50"></div>

                                {selectedRecipe?.actions && selectedRecipe.actions.length > 0 ? (
                                    selectedRecipe.actions.map((action: any, idx: number) => (
                                        <div key={idx} className="relative flex items-start gap-4">
                                            <div className="absolute -left-[44px] top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 border-2 border-background shadow-sm">
                                                <span className="text-[12px] font-bold">{idx + 1}</span>
                                            </div>
                                            <div className="flex-1 p-4 bg-secondary/30 dark:bg-secondary/10 rounded-xl border border-border/50 hover:border-blue-500/30 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[12px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Then Do This</span>
                                                    {action.delay_seconds > 0 && (
                                                        <span className="text-[12px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            Wait {action.delay_seconds >= 86400 ? `${Math.round(action.delay_seconds / 86400)}d` : action.delay_seconds >= 3600 ? `${Math.round(action.delay_seconds / 3600)}h` : `${Math.round(action.delay_seconds / 60)}m`}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm font-semibold mb-1">
                                                    {options?.action_types[action.action_type] || action.action_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                                </div>
                                                {action.action_config?.message && (
                                                    <div className="text-xs text-muted-foreground line-clamp-2 italic bg-background/50 p-2 rounded mt-2 border-l-2 border-blue-300">
                                                        "{action.action_config.message}"
                                                    </div>
                                                )}
                                                {action.action_config?.subject && (
                                                    <div className="text-xs text-muted-foreground mt-2">
                                                        <strong>Subject:</strong> {action.action_config.subject}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (selectedRecipe as any)?.action_label ? (
                                    <div className="relative flex items-start gap-4">
                                        <div className="absolute -left-[44px] top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 border-2 border-background shadow-sm">
                                            <span className="text-[12px] font-bold">1</span>
                                        </div>
                                        <div className="flex-1 p-4 bg-secondary/30 dark:bg-secondary/10 rounded-xl border border-border/50">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[12px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Then Do This</span>
                                                {(selectedRecipe as any)?.delay_label && (selectedRecipe as any)?.delay_label !== 'Immediate' && (
                                                    <span className="text-[12px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> Wait {(selectedRecipe as any)?.delay_label}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm font-semibold">
                                                {(selectedRecipe as any)?.action_label}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-muted-foreground italic p-4 text-center bg-muted/30 rounded-lg">
                                        Configure actions after installation in the Flow Builder
                                    </div>
                                )}

                                {/* End indicator */}
                                <div className="relative flex items-center gap-4">
                                    <div className="absolute -left-[44px] h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400 border-2 border-background shadow-sm">
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <div className="text-xs text-muted-foreground italic">Automation complete</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6 gap-2 flex-col sm:flex-row">
                        <Button variant="ghost" onClick={() => setIsPreviewOpen(false)}>Close</Button>
                        {selectedRecipe && isRecipeInstalled(selectedRecipe) ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const flowId = getInstalledFlowId(selectedRecipe);
                                        if (flowId) navigate(`/automations/flows/${flowId}`);
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    Open in Builder
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleUninstallRecipe(selectedRecipe)}
                                    disabled={installing}
                                >
                                    {installing ? 'Uninstalling...' : 'Uninstall'}
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={() => { if (selectedRecipe) handleInstallRecipe(selectedRecipe); }}
                                disabled={installing}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {installing ? 'Installing...' : 'Install'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* New Folder Dialog */}
            <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen} >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedFolder ? 'Create Subfolder' : 'Create New Folder'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedFolder
                                ? `This folder will be created inside "${folderPath[folderPath.length - 1]?.name || 'current folder'}"`
                                : 'Create a new root folder to organize your automations.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="folder-name">Folder Name</Label>
                            <Input
                                id="folder-name"
                                placeholder="e.g., Q1 Campaigns"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateFolder}>Create Folder</Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
        {/* Rename Folder Dialog */}
        <Dialog open={isRenameFolderDialogOpen} onOpenChange={setIsRenameFolderDialogOpen} >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename Folder</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-folder-name">Folder Name</Label>
                        <Input
                            id="edit-folder-name"
                            value={editingFolder?.name || ''}
                            onChange={(e) => setEditingFolder(prev => prev ? { ...prev, name: e.target.value } : null)}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsRenameFolderDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleRenameFolder}>Save Changes</Button>
                </div>
            </DialogContent>
        </Dialog>

        {/* Move Items Dialog */}
        <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen} >
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Move to Folder</DialogTitle>
                    <DialogDescription>
                        Select a destination folder for {moveTargets.length} item{moveTargets.length !== 1 ? 's' : ''}.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[300px] overflow-y-auto py-2 border rounded-md">
                    <Button
                        variant="ghost"
                        className={`w-full justify-start font-normal ${targetFolderId === null ? 'bg-secondary' : ''}`}
                        onClick={() => setTargetFolderId(null)}
                    >
                        <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                        Root (No Folder)
                    </Button>
                    {folders.filter(f => f.isCustom).map(folder => {
                        // If moving a folder, disable invalid targets (self or its children)
                        const isInvalidTarget = movingType === 'folder' && (
                            moveTargets.includes(folder.id) ||
                            // Check if this folder is a child of any moving folder (simple 1-level check for now, ideally recursive)
                            (folder.parentId && moveTargets.includes(folder.parentId))
                        );

                        return (
                            <Button
                                key={folder.id}
                                variant="ghost"
                                disabled={isInvalidTarget}
                                className={`w-full justify-start font-normal ${targetFolderId === folder.id ? 'bg-secondary' : ''} ${isInvalidTarget ? 'opacity-50' : ''}`}
                                onClick={() => !isInvalidTarget && setTargetFolderId(folder.id)}
                                style={{ paddingLeft: folder.parentId ? '2rem' : '1rem' }}
                            >
                                <folder.icon className={`h-4 w-4 mr-2 ${folder.color}`} />
                                {folder.name}
                            </Button>
                        )
                    })}
                    {/* Note: Proper recursive tree rendering would be better for deep nesting, 
                        but flat map with padding works for basic levels if sorted, 
                        currently mapped in arbitrary order. Improve sort if needed. 
                    */}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>Cancel</Button>
                    <Button onClick={() => handleMove(targetFolderId)}>Move Here</Button>
                </div>
            </DialogContent>
        </Dialog>

        {/* Add Recipe Dialog */}
        <Dialog open={isAddRecipeDialogOpen} onOpenChange={setIsAddRecipeDialogOpen} >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Recipe to Library</DialogTitle>
                    <DialogDescription>
                        Create a reusable automation recipe.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                            value={recipeFormData.name}
                            onChange={(e) => setRecipeFormData({ ...recipeFormData, name: e.target.value })}
                            placeholder="Recipe Name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={recipeFormData.description}
                            onChange={(e) => setRecipeFormData({ ...recipeFormData, description: e.target.value })}
                            placeholder="What does this recipe do?"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                            value={recipeFormData.category}
                            onValueChange={(v) => setRecipeFormData({ ...recipeFormData, category: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(categoryLabels).length > 0 ? Object.entries(categoryLabels)
                                    .filter(([key]) => key !== 'my-automations')
                                    .map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    )) : <SelectItem value="workflow">Workflow</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Recipe Type</Label>
                        <Select
                            value={recipeFormData.type}
                            onValueChange={(v: any) => setRecipeFormData({ ...recipeFormData, type: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="trigger">Trigger (Immediate Action)</SelectItem>
                                <SelectItem value="rule">Rule (Conditional Logic)</SelectItem>
                                <SelectItem value="workflow">Workflow (Multi-step Process)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Channels</Label>
                    <div className="flex gap-2">
                        {['email', 'sms', 'call'].map(channel => (
                            <Badge
                                key={channel}
                                variant={recipeFormData.channels.includes(channel) ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => {
                                    const newChannels = recipeFormData.channels.includes(channel)
                                        ? recipeFormData.channels.filter(c => c !== channel)
                                        : [...recipeFormData.channels, channel];
                                    setRecipeFormData({ ...recipeFormData, channels: newChannels });
                                }}
                            >
                                {channel}
                            </Badge>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddRecipeDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddRecipe}>Add to Library</Button>
                </div>
            </DialogContent>
        </Dialog>
    </>);
};

export default AutomationsUnified;

