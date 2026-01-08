import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Archive,
    RefreshCw,
    Trash2,
    RotateCcw,
    Globe,
    ClipboardList,
    FileText,
    Search,
    Loader2,
    MoreVertical,
    AlertCircle,
    Layout,
    Mail,
    Smartphone,
    Phone,
    Briefcase
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { websitesApi, Website } from '@/lib/websitesApi';
import { webformsApi, WebForm } from '@/services/webformsApi';
import { proposalApi, Proposal, api } from '@/lib/api';
import { landingPagesApi } from '@/lib/landingPagesApi';
import { formatDistanceToNow } from 'date-fns';
import { coursesApi } from '@/services/coursesApi';
import { socialMediaApi } from '@/services/socialMediaApi';

interface ArchivedItem {
    id: string | number;
    name: string;
    type: 'Website' | 'Form' | 'Proposal' | 'Landing Page' | 'Email Campaign' | 'SMS Campaign' | 'Call Campaign' | 'Course' | 'Social Post' | 'Call Script' | 'Call Sequence' | 'Project';
    originalType: string;
    archivedAt: string;
    source: any;
}

const GlobalArchive: React.FC = () => {
    const [items, setItems] = useState<ArchivedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | number | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadArchivedItems();
    }, []);

    const loadArchivedItems = async () => {
        setLoading(true);
        try {
            const archivedItems: ArchivedItem[] = [];

            // Fetch from Websites
            try {
                const websites = await websitesApi.getWebsites();
                const archivedWebsites = websites.filter(w => w.status === 'archived');
                archivedWebsites.forEach(w => {
                    const isLandingPage = w.type === 'landing-page';
                    archivedItems.push({
                        id: w.id,
                        name: w.name,
                        type: isLandingPage ? 'Landing Page' : 'Website',
                        originalType: w.type,
                        archivedAt: w.updated_at,
                        source: w
                    });
                });
            } catch (err) {
                console.error('Failed to fetch archived websites', err);
            }

            // Fetch from Forms
            try {
                const formsResponse = await webformsApi.getForms({ status: 'archived' });
                formsResponse.data.forEach(f => {
                    archivedItems.push({
                        id: f.id,
                        name: f.title,
                        type: 'Form',
                        originalType: f.form_type || 'single_step',
                        archivedAt: f.updated_at || '',
                        source: f
                    });
                });
            } catch (err) {
                console.error('Failed to fetch archived forms', err);
            }

            // Fetch from Proposals
            try {
                const proposalsResponse = await proposalApi.getProposals({ status: 'archived' });
                proposalsResponse.items.forEach(p => {
                    archivedItems.push({
                        id: p.id,
                        name: p.name,
                        type: 'Proposal',
                        originalType: 'proposal',
                        archivedAt: p.updated_at,
                        source: p
                    });
                });
            } catch (err) {
                console.error('Failed to fetch archived proposals', err);
            }

            // Fetch from Email Campaigns
            try {
                const campaigns = await api.getCampaigns();
                const archivedCampaigns = campaigns.filter(c => c.status === 'archived');
                archivedCampaigns.forEach(c => {
                    archivedItems.push({
                        id: c.id,
                        name: c.name,
                        type: 'Email Campaign',
                        originalType: 'email_campaign',
                        archivedAt: c.createdAt,
                        source: c
                    });
                });
            } catch (err) {
                console.error('Failed to fetch archived email campaigns', err);
            }

            // Fetch from SMS Campaigns
            try {
                const smsCampaigns = await api.getSMSCampaigns();
                const archivedSMS = smsCampaigns.filter(c => c.status === 'archived');
                archivedSMS.forEach(c => {
                    archivedItems.push({
                        id: c.id,
                        name: c.name,
                        type: 'SMS Campaign',
                        originalType: 'sms_campaign',
                        archivedAt: c.created_at,
                        source: c
                    });
                });
            } catch (err) {
                console.error('Failed to fetch archived sms campaigns', err);
            }

            // Fetch from Call Campaigns
            try {
                const callCampaigns = await api.getCallCampaigns();
                const archivedCalls = callCampaigns.filter(c => c.status === 'archived');
                archivedCalls.forEach(c => {
                    archivedItems.push({
                        id: c.id,
                        name: c.name,
                        type: 'Call Campaign',
                        originalType: 'call_campaign',
                        archivedAt: c.created_at,
                        source: c
                    });
                });
            } catch (err) {
                console.error('Failed to fetch archived call campaigns', err);
            }

            // Fetch from Courses
            try {
                const courses = await coursesApi.getCourses({ status: 'archived' });
                courses.forEach(c => {
                    archivedItems.push({
                        id: c.id,
                        name: c.title,
                        type: 'Course',
                        originalType: 'course',
                        archivedAt: c.updated_at,
                        source: c
                    });
                });
            } catch (err) {
                console.error('Failed to fetch archived courses', err);
            }

            // Fetch from Social Posts
            try {
                const posts = await socialMediaApi.getPosts();
                posts.filter(p => p.status === 'archived').forEach(p => {
                    archivedItems.push({
                        id: p.id,
                        name: p.content.substring(0, 50) + '...',
                        type: 'Social Post',
                        originalType: 'social_post',
                        archivedAt: p.created_at,
                        source: p
                    });
                });
            } catch (err) {
                console.error('Failed to fetch archived social posts', err);
            }

            // Fetch Call Scripts
            try {
                const scripts = await api.getCallScripts();
                scripts.filter(s => s.status === 'archived').forEach(s => {
                    archivedItems.push({
                        id: s.id,
                        name: s.name,
                        type: 'Call Script',
                        originalType: 'call_script',
                        archivedAt: s.updated_at || '',
                        source: s
                    });
                });
            } catch (err) {
                console.error('Failed to fetch archived call scripts', err);
            }

            // Fetch Call Sequences
            try {
                const sequences = await api.getCallSequences();
                sequences.filter(s => s.status === 'archived').forEach(s => {
                    archivedItems.push({
                        id: s.id,
                        name: s.name,
                        type: 'Call Sequence',
                        originalType: 'call_sequence',
                        archivedAt: s.updated_at || '',
                        source: s
                    });
                });
            } catch (err) {
                console.error('Failed to fetch archived call sequences', err);
            }

            // Fetch from Projects
            try {
                const projectsResponse = await (api as any).get('/api/projects?status=archived');
                const projects = projectsResponse.items || projectsResponse || [];
                (projects as any[]).forEach(p => {
                    archivedItems.push({
                        id: p.id,
                        name: p.title,
                        type: 'Project',
                        originalType: 'project',
                        archivedAt: p.updated_at || '',
                        source: p
                    });
                });
            } catch (err) {
                console.error('Failed to fetch archived projects', err);
            }

            // Sort by date
            archivedItems.sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime());
            setItems(archivedItems);
        } catch (error) {
            toast({
                title: 'Error loading archive',
                description: 'Could not load archived items.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (item: ArchivedItem) => {
        setActionLoading(item.id);
        try {
            if (item.type === 'Website' || item.type === 'Landing Page') {
                await websitesApi.updateWebsite(item.id.toString(), { status: 'draft' });
            } else if (item.type === 'Form') {
                await webformsApi.updateForm(item.id, { status: 'draft' });
            } else if (item.type === 'Proposal') {
                await proposalApi.updateProposal(item.id.toString(), { status: 'draft' });
            } else if (item.type === 'Email Campaign') {
                await api.updateCampaign(item.id.toString(), { status: 'draft' });
            } else if (item.type === 'SMS Campaign') {
                await api.updateSMSCampaign(item.id.toString(), { status: 'draft' });
            } else if (item.type === 'Call Campaign') {
                await api.updateCallCampaign(item.id.toString(), { status: 'draft' });
            } else if (item.type === 'Course') {
                await coursesApi.updateCourse(Number(item.id), { status: 'draft' });
            } else if (item.type === 'Social Post') {
                await socialMediaApi.updatePost(item.id, { status: 'draft' });
            } else if (item.type === 'Call Script') {
                await api.updateCallScript(item.id.toString(), { status: 'active' });
            } else if (item.type === 'Call Sequence') {
                await api.updateCallSequence(item.id.toString(), { status: 'active' });
            } else if (item.type === 'Project') {
                await (api as any).patch(`/api/projects/${item.id}`, { status: 'active' });
            }

            toast({
                title: 'Item restored',
                description: `"${item.name}" has been moved back to drafts.`,
            });
            setItems(items.filter(i => i.id !== item.id));
        } catch (err) {
            toast({
                title: 'Restore failed',
                description: 'Failed to restore the item. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleMoveToTrash = async (item: ArchivedItem) => {
        setActionLoading(item.id);
        try {
            if (item.type === 'Website' || item.type === 'Landing Page') {
                await websitesApi.updateWebsite(item.id.toString(), { status: 'trashed' });
                toast({
                    title: 'Moved to Trash',
                    description: `"${item.name}" has been moved to trash.`,
                });
                setItems(items.filter(i => i.id !== item.id));
            } else if (item.type === 'Form') {
                await webformsApi.updateForm(item.id, { status: 'trashed' });
                toast({
                    title: 'Moved to Trash',
                    description: `"${item.name}" has been moved to trash.`,
                });
                setItems(items.filter(i => i.id !== item.id));
            } else if (item.type === 'Proposal') {
                await proposalApi.updateProposal(item.id.toString(), { status: 'trashed' });
                toast({
                    title: 'Moved to Trash',
                    description: `"${item.name}" has been moved to trash.`,
                });
                setItems(items.filter(i => i.id !== item.id));
            } else if (item.type === 'Course') {
                await coursesApi.updateCourse(Number(item.id), { status: 'trashed' });
                toast({ title: 'Moved to Trash', description: `"${item.name}" has been moved to trash.` });
                setItems(items.filter(i => i.id !== item.id));
            } else if (item.type === 'Social Post') {
                await socialMediaApi.updatePost(item.id, { status: 'trashed' });
                toast({ title: 'Moved to Trash', description: `"${item.name}" has been moved to trash.` });
                setItems(items.filter(i => i.id !== item.id));
            } else if (item.type === 'Call Script') {
                await api.updateCallScript(item.id.toString(), { status: 'trashed' });
                toast({ title: 'Moved to Trash', description: `"${item.name}" has been moved to trash.` });
                setItems(items.filter(i => i.id !== item.id));
            } else if (item.type === 'Call Sequence') {
                await api.updateCallSequence(item.id.toString(), { status: 'trashed' });
                toast({ title: 'Moved to Trash', description: `"${item.name}" has been moved to trash.` });
                setItems(items.filter(i => i.id !== item.id));
            } else if (item.type === 'SMS Campaign') {
                await api.updateSMSCampaign(item.id.toString(), { status: 'trashed' });
                toast({
                    title: 'Moved to Trash',
                    description: `"${item.name}" has been moved to trash.`,
                });
                setItems(items.filter(i => i.id !== item.id));
            } else if (item.type === 'Email Campaign') {
                await api.updateCampaign(item.id.toString(), { status: 'trashed' });
                toast({
                    title: 'Moved to Trash',
                    description: `"${item.name}" has been moved to trash.`,
                });
                setItems(items.filter(i => i.id !== item.id));
            } else if (item.type === 'Call Campaign') {
                await api.updateCallCampaign(item.id.toString(), { status: 'trashed' });
                toast({
                    title: 'Moved to Trash',
                    description: `"${item.name}" has been moved to trash.`,
                });
                setItems(items.filter(i => i.id !== item.id));
            } else if (item.type === 'Project') {
                await (api as any).patch(`/api/projects/${item.id}`, { status: 'trashed' });
                toast({
                    title: 'Moved to Trash',
                    description: `"${item.name}" has been moved to trash.`,
                });
                setItems(items.filter(i => i.id !== item.id));
            }
        } catch (err) {
            toast({
                title: 'Action failed',
                description: 'Failed to move item to trash.',
                variant: 'destructive'
            });
        } finally {
            setActionLoading(null);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Website': return <Globe className="h-4 w-4" />;
            case 'Form': return <ClipboardList className="h-4 w-4" />;
            case 'Proposal': return <FileText className="h-4 w-4" />;
            case 'Landing Page': return <Layout className="h-4 w-4" />;
            case 'Email Campaign': return <Mail className="h-4 w-4" />;
            case 'SMS Campaign': return <Smartphone className="h-4 w-4" />;
            case 'Call Campaign': return <Phone className="h-4 w-4" />;
            case 'Project': return <Briefcase className="h-4 w-4" />;
            default: return <Archive className="h-4 w-4" />;
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">
                        Archive
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage all your archived websites, forms, and assets in one place.
                    </p>
                </div>
                <Button variant="outline" onClick={loadArchivedItems} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Loading archived items...</p>
                </div>
            ) : items.length === 0 ? (
                <Card className="border-dashed border-2 bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center py-20">
                        <div className="p-4 rounded-full bg-primary/10 mb-6">
                            <Archive className="h-12 w-12 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No archived items</h3>
                        <p className="text-muted-foreground text-center max-w-sm">
                            When you archive items like websites or forms, they will appear here for management.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="rounded-md border bg-card overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Archived Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id} className="group hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                {getTypeIcon(item.type)}
                                            </div>
                                            <span>{item.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-medium">
                                            {item.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {item.archivedAt ? formatDistanceToNow(new Date(item.archivedAt), { addSuffix: true }) : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRestore(item)}
                                                disabled={actionLoading === item.id}
                                            >
                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                Restore
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleMoveToTrash(item)}
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
        </div>
    );
};

export default GlobalArchive;
