import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PhoneIncoming, PhoneOutgoing, Clock, AlertCircle } from 'lucide-react';

interface CallLogsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agent: any;
}

export const CallLogs: React.FC<CallLogsProps> = ({ open, onOpenChange, agent }) => {
    // Mock logs
    const logs = [
        { id: '1', type: 'inbound', caller: '+1 (555) 123-4567', duration: '2m 15s', status: 'completed', date: '2 mins ago' },
        { id: '2', type: 'outbound', caller: '+1 (555) 987-6543', duration: '45s', status: 'missed', date: '1 hour ago' },
        { id: '3', type: 'inbound', caller: '+1 (555) 555-0199', duration: '5m 30s', status: 'completed', date: 'Yesterday' },
        { id: '4', type: 'inbound', caller: '+1 (555) 777-8888', duration: '0s', status: 'failed', date: '2 days ago' },
    ];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader className="mb-6">
                    <SheetTitle>Audit History</SheetTitle>
                    <SheetDescription>
                        Recent interactions for agent <span className="font-semibold text-foreground">{agent?.name}</span>
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex gap-2">
                            <Badge variant="outline">24h</Badge>
                            <Badge variant="secondary">7d</Badge>
                            <Badge variant="outline">30d</Badge>
                        </div>
                        <span className="text-muted-foreground">Total: {logs.length} calls</span>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Caller</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {log.type === 'inbound' ? (
                                                    <PhoneIncoming className="h-4 w-4 text-blue-500" />
                                                ) : (
                                                    <PhoneOutgoing className="h-4 w-4 text-green-500" />
                                                )}
                                                <span className="text-xs text-muted-foreground capitalize">{log.date}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{log.caller}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-xs">
                                                <Clock className="h-3 w-3" />
                                                {log.duration}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={
                                                log.status === 'completed' ? 'default' :
                                                    log.status === 'missed' ? 'secondary' : 'destructive'
                                            } className="text-[12px] capitalize">
                                                {log.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
