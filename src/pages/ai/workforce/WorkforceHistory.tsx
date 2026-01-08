import React, { useState } from 'react';
import {
    History, Search, Filter, Download,
    Bot, User, Calendar, ExternalLink,
    ChevronLeft, ChevronRight, Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAiWorkHistory } from '@/hooks/useAiWorkforce';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

import { Breadcrumb } from '@/components/Breadcrumb';

const WorkforceHistory: React.FC = () => {
    const [page, setPage] = useState(0);
    const limit = 20;

    const { data: history = [], isLoading } = useAiWorkHistory({
        limit,
        offset: page * limit
    });

    const getOutcomeBadge = (outcome: string) => {
        switch (outcome) {
            case 'success': return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Success</Badge>;
            case 'pending_approval': return <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending</Badge>;
            case 'failed': return <Badge variant="destructive">Failed</Badge>;
            default: return <Badge variant="outline">{outcome}</Badge>;
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-700">
            <Breadcrumb items={[{ label: 'AI', href: '/ai/console' }, { label: 'Workforce', href: '/ai/workforce' }, { label: 'History' }]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Work History</h1>
                    <p className="text-muted-foreground">Comprehensive audit log of all digital employee operations</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Log
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search logs..." className="pl-9" />
                </div>
                <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date Range
                </Button>
                <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    All Modules
                </Button>
            </div>

            {/* History Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Timestamp</TableHead>
                                <TableHead>Employee</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Entity</TableHead>
                                <TableHead>Outcome</TableHead>
                                <TableHead className="text-right">Usage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6} className="h-12 animate-pulse bg-muted/20" />
                                    </TableRow>
                                ))
                            ) : history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                        <p className="text-muted-foreground">No work history records found.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                history.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(row.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                                                    <Bot className="h-3 w-3 text-primary" />
                                                </div>
                                                <span className="font-medium text-sm">{row.agent_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="capitalize text-sm">{row.action_type.replace(/_/g, ' ')}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <span className="capitalize">{row.module}:</span>
                                                <span className="font-mono">{row.entity_type} #{row.entity_id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getOutcomeBadge(row.outcome)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="text-[10px] text-muted-foreground">
                                                {row.token_usage ? `${row.token_usage} tokens` : '-'}
                                                <br />
                                                {row.execution_time_ms ? `${row.execution_time_ms}ms` : '-'}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    Showing {page * limit + 1} to {Math.min((page + 1) * limit, 1000)} of 1000+ entries
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default WorkforceHistory;
