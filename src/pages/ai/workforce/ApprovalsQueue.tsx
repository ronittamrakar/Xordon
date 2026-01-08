import React, { useState } from 'react';
import {
    Shield, CheckCircle, XCircle, Clock,
    ExternalLink, AlertCircle, Info, Filter,
    Search, User, Bot, ArrowRight, Eye
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAiApprovals, useDecideAiApproval } from '@/hooks/useAiWorkforce';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { Breadcrumb } from '@/components/Breadcrumb';

const ApprovalsQueue: React.FC = () => {
    const [statusFilter, setStatusFilter] = useState('pending');
    const { data: approvals = [], isLoading } = useAiApprovals(statusFilter);
    const { mutate: decide } = useDecideAiApproval();

    const [selectedApproval, setSelectedApproval] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

    const handleDecide = (id: string, decision: 'approve' | 'reject', reason?: string) => {
        decide({ id, decision, reason }, {
            onSuccess: () => {
                toast.success(`Action ${decision === 'approve' ? 'approved' : 'rejected'}`);
                setIsRejectDialogOpen(false);
                setRejectionReason('');
                setSelectedApproval(null);
            },
            onError: () => {
                toast.error("Failed to record decision");
            }
        });
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'medium': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-700">
            <Breadcrumb items={[{ label: 'AI', href: '/ai/console' }, { label: 'Workforce', href: '/ai/workforce' }, { label: 'Approvals Queue' }]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Approvals Queue</h1>
                    <p className="text-muted-foreground">Review and authorize high-priority AI actions</p>
                </div>
                <div className="flex bg-muted p-1 rounded-lg">
                    <Button
                        variant={statusFilter === 'pending' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setStatusFilter('pending')}
                    >
                        Pending
                    </Button>
                    <Button
                        variant={statusFilter === 'approved' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setStatusFilter('approved')}
                    >
                        Approved
                    </Button>
                    <Button
                        variant={statusFilter === 'rejected' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setStatusFilter('rejected')}
                    >
                        Rejected
                    </Button>
                </div>
            </div>

            {/* List of Approvals */}
            {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : approvals.length === 0 ? (
                <Card className="py-20 bg-transparent border-dashed border-2">
                    <div className="text-center">
                        <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium">All Caught Up!</h3>
                        <p className="text-muted-foreground">There are no {statusFilter} approvals at this time.</p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {approvals.map((approval) => (
                        <Card key={approval.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: approval.priority === 'urgent' ? '#ef4444' : approval.priority === 'high' ? '#f97316' : '#3b82f6' }}>
                            <div className="p-6">
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Agent Info */}
                                    <div className="w-full lg:w-64 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Bot className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="font-bold text-sm">{approval.agent_name}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline" className={`${getPriorityColor(approval.priority)} border-none text-[10px] uppercase`}>
                                                {approval.priority}
                                            </Badge>
                                            <Badge variant="secondary" className="text-[10px] uppercase">
                                                {approval.action_type.replace(/_/g, ' ')}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            Requested {new Date(approval.created_at).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Action Content */}
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <h4 className="text-lg font-semibold">{approval.action_description || 'AI Action Requiring Approval'}</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                The AI employee has drafted a response and requires confirmation before proceeding.
                                            </p>
                                        </div>

                                        {/* Action Data Preview */}
                                        <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs whitespace-pre-wrap max-h-40 overflow-y-auto border">
                                            {JSON.stringify(approval.action_data, null, 2)}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="w-full lg:w-48 flex flex-row lg:flex-col gap-2 justify-end lg:justify-start">
                                        {statusFilter === 'pending' ? (
                                            <>
                                                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleDecide(approval.id, 'approve')}>
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full text-destructive hover:bg-destructive/10"
                                                    onClick={() => {
                                                        setSelectedApproval(approval);
                                                        setIsRejectDialogOpen(true);
                                                    }}
                                                >
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Reject
                                                </Button>
                                                <Button variant="ghost" className="w-full">
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Preview
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="text-right">
                                                <Badge variant={statusFilter === 'approved' ? 'default' : 'destructive'} className="mb-2">
                                                    {statusFilter.toUpperCase()}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground">
                                                    By {approval.approved_by || 'System'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Rejection Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject AI Action</DialogTitle>
                        <DialogDescription>
                            Provide a reason for rejection. This feedback will be used to train the AI agent.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Why are you rejecting this? (e.g. Tone is too aggressive, incorrect pricing, etc.)"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => handleDecide(selectedApproval?.id, 'reject', rejectionReason)}>
                            Reject Action
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ApprovalsQueue;
