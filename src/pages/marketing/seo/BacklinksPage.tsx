import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveCompany, companyQueryKey } from '@/hooks/useActiveCompany';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { listingsApi } from '@/services';
import { Link2, Loader2, ExternalLink, Globe } from 'lucide-react';
import { BacklinkGapAnalyzer } from '@/components/seo/BacklinkGapAnalyzer';
import { BacklinkAnalytics } from '@/components/seo/BacklinkAnalytics';

export default function BacklinksPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { activeCompanyId, hasCompany } = useActiveCompany();
    const [isAddBacklinkOpen, setIsAddBacklinkOpen] = useState(false);
    const [newBacklink, setNewBacklink] = useState({
        source_url: '',
        target_url: '',
        anchor_text: '',
        link_type: 'dofollow',
    });

    const { data: backlinksData, isLoading: backlinksLoading } = useQuery({
        queryKey: companyQueryKey('seo-backlinks', activeCompanyId),
        queryFn: () => listingsApi.getBacklinks(),
        enabled: hasCompany,
    });

    const { data: backlinksByDomain = [], isLoading: domainLinksLoading } = useQuery({
        queryKey: companyQueryKey('backlinks-by-domain', activeCompanyId),
        queryFn: () => listingsApi.getBacklinksByDomain(),
        enabled: hasCompany,
    });

    const addBacklinkMutation = useMutation({
        mutationFn: (data: typeof newBacklink) => listingsApi.addBacklink(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyQueryKey('seo-backlinks', activeCompanyId) });
            setIsAddBacklinkOpen(false);
            setNewBacklink({ source_url: '', target_url: '', anchor_text: '', link_type: 'dofollow' });
            toast({ title: 'Backlink added successfully' });
        },
    });

    const backlinks = backlinksData?.backlinks || [];
    const backlinksStats = backlinksData?.stats || { total: 0, dofollow: 0, nofollow: 0, avg_da: 0, avg_pa: 0 };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Backlinks</h1>
                    <p className="text-muted-foreground">Monitor and analyze your backlink profile</p>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2">Overview</TabsTrigger>
                    <TabsTrigger value="gap" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2">Gap Analysis</TabsTrigger>
                    <TabsTrigger value="analytics" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2">Analytics & Toxicity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                    <div className="grid gap-4 md:grid-cols-5">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Backlinks</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{backlinksStats.total}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Dofollow</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold text-green-600">{backlinksStats.dofollow}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Nofollow</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold text-gray-600">{backlinksStats.nofollow}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Avg. DA</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{backlinksStats.avg_da || 0}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Avg. PA</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{backlinksStats.avg_pa || 0}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end">
                        <Dialog open={isAddBacklinkOpen} onOpenChange={setIsAddBacklinkOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Link2 className="h-4 w-4 mr-2" />
                                    Add Backlink
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Backlink</DialogTitle>
                                    <DialogDescription>Track a backlink manually</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Source URL</Label>
                                        <Input
                                            value={newBacklink.source_url}
                                            onChange={(e) => setNewBacklink({ ...newBacklink, source_url: e.target.value })}
                                            placeholder="https://example.com/page"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Target URL</Label>
                                        <Input
                                            value={newBacklink.target_url}
                                            onChange={(e) => setNewBacklink({ ...newBacklink, target_url: e.target.value })}
                                            placeholder="https://yoursite.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Anchor Text</Label>
                                        <Input
                                            value={newBacklink.anchor_text}
                                            onChange={(e) => setNewBacklink({ ...newBacklink, anchor_text: e.target.value })}
                                            placeholder="Click here"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Link Type</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant={newBacklink.link_type === 'dofollow' ? 'default' : 'outline'}
                                                onClick={() => setNewBacklink({ ...newBacklink, link_type: 'dofollow' })}
                                            >
                                                Dofollow
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={newBacklink.link_type === 'nofollow' ? 'default' : 'outline'}
                                                onClick={() => setNewBacklink({ ...newBacklink, link_type: 'nofollow' })}
                                            >
                                                Nofollow
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddBacklinkOpen(false)}>Cancel</Button>
                                    <Button
                                        onClick={() => addBacklinkMutation.mutate(newBacklink)}
                                        disabled={!newBacklink.source_url || !newBacklink.target_url}
                                    >
                                        Add Backlink
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Backlinks by Domain</CardTitle>
                            <CardDescription>Top referring domains</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {domainLinksLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : backlinksByDomain.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No backlinks tracked yet</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Domain</TableHead>
                                            <TableHead>Backlinks</TableHead>
                                            <TableHead>DA</TableHead>
                                            <TableHead>Dofollow</TableHead>
                                            <TableHead>First Seen</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {backlinksByDomain.map((domain: any, idx: number) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                                    {domain.domain}
                                                </TableCell>
                                                <TableCell>{domain.count}</TableCell>
                                                <TableCell>
                                                    <Badge variant={domain.avg_da >= 50 ? 'default' : 'outline'}>
                                                        {domain.avg_da}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{domain.dofollow_count}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(domain.first_seen).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>All Backlinks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {backlinksLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : backlinks.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No backlinks tracked yet</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Source</TableHead>
                                            <TableHead>Anchor Text</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>DA</TableHead>
                                            <TableHead>PA</TableHead>
                                            <TableHead>Discovered</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {backlinks.map((link: any) => (
                                            <TableRow key={link.id}>
                                                <TableCell>
                                                    <a href={link.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                                        {new URL(link.source_url).hostname}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </TableCell>
                                                <TableCell className="font-medium">{link.anchor_text || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={link.link_type === 'dofollow' ? 'default' : 'outline'}>
                                                        {link.link_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{link.domain_authority || 'N/A'}</TableCell>
                                                <TableCell>{link.page_authority || 'N/A'}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(link.discovered_at || link.created_at).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="gap" className="mt-6">
                    <BacklinkGapAnalyzer />
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                    <BacklinkAnalytics />
                </TabsContent>
            </Tabs>
        </div>
    );
}
