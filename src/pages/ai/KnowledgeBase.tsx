import React, { useState } from 'react';

import { Breadcrumb } from '@/components/Breadcrumb';
import { BookOpen, Plus, Upload, Link2, FileTextIcon, Trash2, Edit, Search, Filter, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useKnowledgeBases, useCreateKnowledgeBase, useDeleteKnowledgeBase, useAddKnowledgeSource } from '@/hooks/useKnowledgeBases';
import { formatDistanceToNow } from 'date-fns';

const KnowledgeBase: React.FC = () => {
    const { toast } = useToast();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [sourceType, setSourceType] = useState<'document' | 'url' | 'text'>('document');
    const [sourceName, setSourceName] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [sourceContent, setSourceContent] = useState('');

    const { data: knowledgeBases = [], isLoading } = useKnowledgeBases();
    const createKnowledgeBase = useCreateKnowledgeBase();
    const deleteKnowledgeBase = useDeleteKnowledgeBase();
    const addSource = useAddKnowledgeSource();
    const [selectedKbId, setSelectedKbId] = useState<string>('new');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleCreateSource = async () => {
        try {
            let kbId = selectedKbId;

            if (selectedKbId === 'new') {
                const kbName = sourceName || `${sourceType} Knowledge Base`;
                const kb: any = await createKnowledgeBase.mutateAsync({
                    name: kbName,
                    description: `Auto-created for ${sourceType} source`,
                    type: sourceType === 'document' ? 'Documents' : sourceType === 'url' ? 'URLs' : 'Text',
                });
                kbId = kb.id;
            }

            // Then add the source to it
            await addSource.mutateAsync({
                knowledgeBaseId: kbId,
                data: {
                    source_type: sourceType,
                    source_name: sourceName,
                    source_url: sourceType === 'url' ? sourceUrl : undefined,
                    content: sourceType === 'text' ? sourceContent : undefined,
                },
            });

            setIsCreateOpen(false);
            setSourceName('');
            setSourceUrl('');
            setSourceContent('');
            toast({ title: 'Success', description: 'Knowledge source added successfully' });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to add knowledge source',
                variant: 'destructive'
            });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteKnowledgeBase.mutateAsync(id);
            toast({ title: 'Success', description: 'Knowledge base deleted successfully' });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete knowledge base',
                variant: 'destructive'
            });
        }
    };

    const totalSources = knowledgeBases.reduce((sum, kb) => sum + (kb.sources || 0), 0);
    const activeBases = knowledgeBases.filter(kb => kb.status === 'active').length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">AI Knowledge Hub</h1>
                    <p className="text-muted-foreground">Train your AI agents with your business knowledge and context</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Knowledge Source
                </Button>
            </div>

            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard label="Total Sources" value={totalSources.toString()} icon={<FileTextIcon className="h-4 w-4" />} />
                    <StatCard label="Active Bases" value={activeBases.toString()} icon={<BookOpen className="h-4 w-4" />} />
                    <StatCard label="Total Items" value={knowledgeBases.length.toString()} icon={<Plus className="h-4 w-4" />} />
                    <StatCard label="Cloud Usage" value="0 / 10 GB" icon={<Download className="h-4 w-4" />} />
                </div>

                {/* Search and Filters */}
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search knowledge items..."
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button>
                        <Button variant="outline" size="icon" className="h-10 w-10">
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Knowledge Bases Table */}
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Knowledge Base</TableHead>
                                <TableHead>Data Type</TableHead>
                                <TableHead>Source Count</TableHead>
                                <TableHead>Sync Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                            <span className="text-sm text-muted-foreground">Loading knowledge bases...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : knowledgeBases.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10">
                                        <div className="flex flex-col items-center gap-2">
                                            <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                                            <p className="text-sm text-muted-foreground">No knowledge bases yet. Create one to get started!</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                knowledgeBases.map((kb) => (
                                    <TableRow key={kb.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                                    <FileTextIcon className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold">{kb.name}</div>
                                                    <div className="text-sm text-muted-foreground">{kb.description}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{kb.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{kb.sources || 0} files linked</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${kb.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                <span className="text-sm text-muted-foreground">
                                                    {kb.status === 'active' ? 'Synced' : 'Inactive'} {kb.updated_at ? formatDistanceToNow(new Date(kb.updated_at), { addSuffix: true }) : ''}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="sm">
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(kb.id)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Create Knowledge Source Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add Knowledge Source</DialogTitle>
                        <DialogDescription>
                            Add fresh context and data to refine your AI's conversational intelligence.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label>Target Knowledge Base</Label>
                            <Select value={selectedKbId} onValueChange={setSelectedKbId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Knowledge Base" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">Create New Knowledge Base</SelectItem>
                                    {knowledgeBases.map((kb) => (
                                        <SelectItem key={kb.id} value={kb.id}>{kb.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="document">
                                    <FileTextIcon className="h-4 w-4 mr-2" />
                                    Document
                                </TabsTrigger>
                                <TabsTrigger value="url">
                                    <Link2 className="h-4 w-4 mr-2" />
                                    URL
                                </TabsTrigger>
                                <TabsTrigger value="text">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Text
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="document" className="space-y-4 pt-4">
                                <div
                                    className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) setSourceName(file.name);
                                        }}
                                    />
                                    <div className="w-12 h-12 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                                        <Upload className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">Drag & drop files here</p>
                                    <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT files supported</p>
                                    {sourceName && <Badge variant="secondary" className="mt-2">{sourceName}</Badge>}
                                </div>
                            </TabsContent>

                            <TabsContent value="url" className="space-y-4 pt-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Documentation URL</Label>
                                        <Input
                                            placeholder="https://docs.yourbusiness.com"
                                            value={sourceUrl}
                                            onChange={(e) => setSourceUrl(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="text" className="space-y-4 pt-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Context Heading</Label>
                                        <Input
                                            placeholder="e.g., Q4 Customer Refund Policy"
                                            value={sourceName}
                                            onChange={(e) => setSourceName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Detailed Content</Label>
                                        <Textarea
                                            placeholder="Paste or type the information that the AI should know..."
                                            value={sourceContent}
                                            onChange={(e) => setSourceContent(e.target.value)}
                                            className="min-h-[120px]"
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateSource}
                            disabled={createKnowledgeBase.isPending || addSource.isPending}
                        >
                            {(createKnowledgeBase.isPending || addSource.isPending) ? 'Indexing...' : 'Add Source'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const StatCard = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => {
    return (
        <Card>
            <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
};

export default KnowledgeBase;

