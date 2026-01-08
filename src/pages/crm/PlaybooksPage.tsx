import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    BookOpen,
    Search,
    Plus,
    ChevronRight,
    FileTextIcon,
    MessageCircle,
    PhoneCall,
    Mail,
    Lightbulb,
    Clock,
    ExternalLink,
    Target
} from 'lucide-react';

const PlaybooksPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [playbooks, setPlaybooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPlaybooks = async () => {
            try {
                setLoading(true);
                const response = await api.crm.getPlaybooks();
                if (response && response.playbooks) {
                    setPlaybooks(response.playbooks);
                }
            } catch (error) {
                console.error('Failed to load playbooks:', error);
            } finally {
                setLoading(false);
            }
        };
        loadPlaybooks();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    const filteredPlaybooks = playbooks.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Sales Playbooks</h1>
                    <p className="text-muted-foreground text-lg">Central repository of winning strategies, scripts, and battlecards.</p>
                </div>
                <Button className="shadow-lg shadow-primary/20 gap-2">
                    <Plus className="h-4 w-4" />
                    New Playbook
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search strategies, scripts..."
                        className="pl-9 bg-white dark:bg-slate-950 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="hidden sm:flex">Qualification</Button>
                    <Button variant="outline" size="sm" className="hidden sm:flex">Negotiation</Button>
                    <Button variant="outline" size="sm" className="hidden sm:flex">Follow-up</Button>
                </div>
            </div>

            {/* Grid of Playbooks */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {playbooks.map((playbook) => (
                    <Card key={playbook.id} className="group hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors`}>
                                    <playbook.icon className="h-6 w-6" />
                                </div>
                                <Badge variant="secondary" className="font-normal text-[12px] tracking-wide uppercase">
                                    {playbook.type}
                                </Badge>
                            </div>
                            <div className="mt-4">
                                <CardTitle className="text-xl group-hover:text-primary transition-colors">{playbook.title}</CardTitle>
                                <CardDescription className="line-clamp-2 mt-2 leading-relaxed">
                                    {playbook.description}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4">
                            <div className="flex flex-wrap gap-1">
                                {playbook.stages.map(stage => (
                                    <Badge key={stage} variant="outline" className="text-[12px] px-1.5 py-0 border-slate-300 dark:border-slate-700">
                                        {stage}
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground font-medium uppercase tracking-tight">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-3 w-3" />
                                    Updated {playbook.lastUpdated}
                                </div>
                                <div className="flex items-center gap-1 text-primary hover:underline">
                                    Open
                                    <ChevronRight className="h-3 w-3" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Resources Footer */}
            <Card className="border-0 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                    <BookOpen className="h-48 w-48" />
                </div>
                <CardContent className="p-8">
                    <div className="max-w-2xl space-y-4">
                        <h2 className="text-2xl font-bold">Standardize Your Success</h2>
                        <p className="text-slate-300">
                            Playbooks ensure that every member of the team is using the latest approved messaging and strategies.
                            Regularly review these battlecards to keep your edge.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10 gap-2">
                                <ExternalLink className="h-4 w-4" />
                                View Global Standards
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PlaybooksPage;

