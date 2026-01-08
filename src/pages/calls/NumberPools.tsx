import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Copy,
    Edit,
    Trash2,
    Phone,
    Globe,
    Code,
    BarChart3,
    Users,
    TrendingUp,
    Target,
    Link,
    ExternalLink,
    Check,
} from 'lucide-react';
import { api } from '@/lib/api';

interface NumberPool {
    id: number;
    name: string;
    description: string;
    source_type: string;
    custom_source?: string;
    target_number: string;
    session_timeout_minutes: number;
    is_active: boolean;
    number_count?: number;
    active_sessions?: number;
    created_at: string;
}

interface PhoneNumber {
    id: number;
    phone_number: string;
    friendly_name: string;
    status: string;
}

export default function NumberPools() {
    const navigate = useNavigate();
    const [pools, setPools] = useState<NumberPool[]>([]);
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isSnippetDialogOpen, setIsSnippetDialogOpen] = useState(false);
    const [selectedPool, setSelectedPool] = useState<NumberPool | null>(null);
    const [trackingSnippet, setTrackingSnippet] = useState('');
    const [snippetCopied, setSnippetCopied] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        source_type: 'custom',
        custom_source: '',
        target_number: '',
        session_timeout_minutes: 30,
        phone_number_ids: [] as number[],
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [poolsRes, numbersRes] = await Promise.all([
                api.get('/number-pools'),
                api.get('/phone-numbers'),
            ]);
            setPools((poolsRes.data as any)?.items || []);
            setPhoneNumbers((numbersRes.data as any)?.items || []);
        } catch (error) {
            console.error('Failed to load data:', error);
            // Mock data for demo
            setPools([
                {
                    id: 1,
                    name: 'Google Ads Pool',
                    description: 'Track calls from Google Ads campaigns',
                    source_type: 'google_ads',
                    target_number: '+1 555 123 4567',
                    session_timeout_minutes: 30,
                    is_active: true,
                    number_count: 5,
                    active_sessions: 23,
                    created_at: '2024-01-15T10:00:00Z',
                },
                {
                    id: 2,
                    name: 'Organic Search',
                    description: 'Track organic search visitors',
                    source_type: 'google_organic',
                    target_number: '+1 555 123 4567',
                    session_timeout_minutes: 60,
                    is_active: true,
                    number_count: 3,
                    active_sessions: 45,
                    created_at: '2024-01-10T08:00:00Z',
                },
                {
                    id: 3,
                    name: 'Facebook Campaigns',
                    description: 'Facebook and Instagram ads',
                    source_type: 'facebook',
                    target_number: '+1 555 987 6543',
                    session_timeout_minutes: 30,
                    is_active: false,
                    number_count: 4,
                    active_sessions: 0,
                    created_at: '2024-01-22T09:15:00Z',
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const createPool = async () => {
        if (!formData.name.trim() || !formData.target_number.trim()) {
            toast.error('Name and target number are required');
            return;
        }

        try {
            await api.post('/number-pools', formData);
            toast.success('Number pool created');
            setIsCreateDialogOpen(false);
            resetForm();
            loadData();
        } catch (error) {
            toast.error('Failed to create number pool');
        }
    };

    const deletePool = async (id: number) => {
        if (!confirm('Are you sure you want to delete this number pool?')) return;
        try {
            await api.delete(`/number-pools/${id}`);
            toast.success('Number pool deleted');
            loadData();
        } catch (error) {
            toast.error('Failed to delete number pool');
        }
    };

    const togglePoolStatus = async (pool: NumberPool) => {
        try {
            await api.put(`/number-pools/${pool.id}`, { is_active: !pool.is_active });
            toast.success(`Pool ${pool.is_active ? 'deactivated' : 'activated'}`);
            loadData();
        } catch (error) {
            toast.error('Failed to update pool status');
        }
    };

    const getTrackingSnippet = async (pool: NumberPool) => {
        setSelectedPool(pool);
        try {
            const response = await api.get(`/dni/snippet?pool_id=${pool.id}`);
            setTrackingSnippet((response.data as any)?.snippet || '');
        } catch (error) {
            // Mock snippet for demo
            setTrackingSnippet(`<!-- Call Tracking Script -->
<script>
(function() {
  var POOL_ID = '${pool.id}';
  var TARGET_NUMBER = '${pool.target_number}';
  var API_URL = 'https://api.example.com/dni';
  // ... tracking script ...
})();
</script>`);
        }
        setIsSnippetDialogOpen(true);
    };

    const copySnippet = () => {
        navigator.clipboard.writeText(trackingSnippet);
        setSnippetCopied(true);
        toast.success('Snippet copied to clipboard');
        setTimeout(() => setSnippetCopied(false), 2000);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            source_type: 'custom',
            custom_source: '',
            target_number: '',
            session_timeout_minutes: 30,
            phone_number_ids: [],
        });
    };

    const filteredPools = pools.filter(
        (pool) =>
            pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pool.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getSourceBadge = (sourceType: string) => {
        const badges: Record<string, { label: string; className: string }> = {
            google_ads: { label: 'Google Ads', className: 'bg-blue-100 text-blue-800' },
            google_organic: { label: 'Google Organic', className: 'bg-green-100 text-green-800' },
            facebook: { label: 'Facebook', className: 'bg-indigo-100 text-indigo-800' },
            bing: { label: 'Bing', className: 'bg-cyan-100 text-cyan-800' },
            direct: { label: 'Direct', className: 'bg-gray-100 text-gray-800' },
            referral: { label: 'Referral', className: 'bg-purple-100 text-purple-800' },
            custom: { label: 'Custom', className: 'bg-orange-100 text-orange-800' },
        };
        const badge = badges[sourceType] || badges.custom;
        return <Badge className={badge.className}>{badge.label}</Badge>;
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Number Pools</h1>
                    <p className="text-muted-foreground">
                        Configure Dynamic Number Insertion for call attribution
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Pool
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create Number Pool</DialogTitle>
                            <DialogDescription>
                                Set up a pool of phone numbers for tracking a specific traffic source
                            </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-4 py-4 px-1">
                                <div>
                                    <Label>Pool Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Google Ads Pool"
                                    />
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe this pool's purpose..."
                                    />
                                </div>
                                <div>
                                    <Label>Traffic Source</Label>
                                    <Select
                                        value={formData.source_type}
                                        onValueChange={(value) => setFormData({ ...formData, source_type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="google_ads">Google Ads</SelectItem>
                                            <SelectItem value="google_organic">Google Organic</SelectItem>
                                            <SelectItem value="facebook">Facebook / Instagram</SelectItem>
                                            <SelectItem value="bing">Microsoft Ads (Bing)</SelectItem>
                                            <SelectItem value="direct">Direct Traffic</SelectItem>
                                            <SelectItem value="referral">Referral Traffic</SelectItem>
                                            <SelectItem value="custom">Custom Source</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.source_type === 'custom' && (
                                    <div>
                                        <Label>Custom Source Name</Label>
                                        <Input
                                            value={formData.custom_source}
                                            onChange={(e) => setFormData({ ...formData, custom_source: e.target.value })}
                                            placeholder="e.g., Email Campaign"
                                        />
                                    </div>
                                )}
                                <div>
                                    <Label>Target Number (to replace)</Label>
                                    <Input
                                        value={formData.target_number}
                                        onChange={(e) => setFormData({ ...formData, target_number: e.target.value })}
                                        placeholder="+1 555 123 4567"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        This is the number displayed on your website that will be swapped
                                    </p>
                                </div>
                                <div>
                                    <Label>Session Timeout (minutes)</Label>
                                    <Input
                                        type="number"
                                        value={formData.session_timeout_minutes}
                                        onChange={(e) =>
                                            setFormData({ ...formData, session_timeout_minutes: parseInt(e.target.value) })
                                        }
                                        min={5}
                                        max={1440}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        How long to keep the same number assigned to a visitor
                                    </p>
                                </div>
                            </div>
                        </ScrollArea>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={createPool}>Create Pool</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Pools</p>
                                <p className="text-2xl font-bold">{pools.filter((p) => p.is_active).length}</p>
                            </div>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Target className="h-5 w-5 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Numbers</p>
                                <p className="text-2xl font-bold">
                                    {pools.reduce((sum, p) => sum + (p.number_count || 0), 0)}
                                </p>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Phone className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Sessions</p>
                                <p className="text-2xl font-bold">
                                    {pools.reduce((sum, p) => sum + (p.active_sessions || 0), 0)}
                                </p>
                            </div>
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Users className="h-5 w-5 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Tracked Sources</p>
                                <p className="text-2xl font-bold">
                                    {new Set(pools.map((p) => p.source_type)).size}
                                </p>
                            </div>
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Globe className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search pools..."
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Pools Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pool Name</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Target Number</TableHead>
                                <TableHead>Numbers</TableHead>
                                <TableHead>Sessions</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredPools.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <div className="flex flex-col items-center gap-2">
                                            <Target className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-muted-foreground">No number pools yet</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsCreateDialogOpen(true)}
                                            >
                                                Create your first pool
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPools.map((pool) => (
                                    <TableRow key={pool.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{pool.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {pool.description || 'No description'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getSourceBadge(pool.source_type)}</TableCell>
                                        <TableCell className="font-mono text-sm">{pool.target_number}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                {pool.number_count || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {pool.active_sessions || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={pool.is_active}
                                                onCheckedChange={() => togglePoolStatus(pool)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => getTrackingSnippet(pool)}
                                                    title="Get Tracking Snippet"
                                                >
                                                    <Code className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deletePool(pool.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Tracking Snippet Dialog */}
            <Dialog open={isSnippetDialogOpen} onOpenChange={setIsSnippetDialogOpen}>
                <DialogContent className="max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>Tracking Snippet</DialogTitle>
                        <DialogDescription>
                            Add this script to your website to enable dynamic number insertion
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="relative">
                            <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto max-h-[400px]">
                                <code>{trackingSnippet}</code>
                            </pre>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="absolute top-2 right-2"
                                onClick={copySnippet}
                            >
                                {snippetCopied ? (
                                    <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-1" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium mb-2">Installation Instructions:</p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Copy the script above</li>
                                <li>Paste it just before the closing <code>&lt;/body&gt;</code> tag on every page</li>
                                <li>The script will automatically replace "{selectedPool?.target_number}" with tracking numbers</li>
                            </ol>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSnippetDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
