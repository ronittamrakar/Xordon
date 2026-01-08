import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Check, X, Upload, Download, Trash2, Edit, Plus } from 'lucide-react';
import { ExtendedSMSRecipient } from './types';

interface AudienceStepProps {
    recipients: ExtendedSMSRecipient[];
    selectedRecipients: string[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    tagFilter: string;
    setTagFilter: (tag: string) => void;
    filteredRecipients: ExtendedSMSRecipient[];
    toggleRecipient: (id: string) => void;
    selectAllRecipients: () => void;
    clearAllRecipients: () => void;
    updateCampaignData: (data: any) => void; // Used for what? Check original. used in export?
}

export const AudienceStep = ({
    recipients,
    selectedRecipients,
    searchQuery,
    setSearchQuery,
    tagFilter,
    setTagFilter,
    filteredRecipients,
    toggleRecipient,
    selectAllRecipients,
    clearAllRecipients
}: AudienceStepProps) => {
    const availableTags = Array.from(new Set(recipients.flatMap((r: ExtendedSMSRecipient) => r.tags || [])));
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [showGroupDialog, setShowGroupDialog] = useState(false);
    const [showRecipientDialog, setShowRecipientDialog] = useState(false);

    const exportSelectedRecipients = () => {
        const selectedRecipientData = recipients.filter((r: ExtendedSMSRecipient) => selectedRecipients.includes(r.id));
        const csvContent = [
            ['Name', 'Phone', 'Company', 'Tags'].join(','),
            ...selectedRecipientData.map(r => [
                `${r.first_name} ${r.last_name}`,
                r.phone_number,
                r.company || '',
                (r.tags || []).join(';')
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'selected-recipients.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const deleteSelectedRecipients = () => {
        if (selectedRecipients.length === 0) return;

        if (confirm(`Are you sure you want to delete ${selectedRecipients.length} selected recipients?`)) {
            // This would typically make an API call to delete recipients
            // For now, we'll just clear the selection
            clearAllRecipients();
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Select Recipients
                </CardTitle>
                <CardDescription>
                    Choose who will receive your SMS campaign. All recipients are synced with <a href="/contacts" className="text-primary hover:underline">Contacts</a>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search recipients by name, phone, or company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Select value={tagFilter} onValueChange={setTagFilter}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter by tag" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Tags</SelectItem>
                            {availableTags.map(tag => (
                                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => setShowRecipientDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Recipient
                    </Button>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={selectAllRecipients}>
                        <Check className="h-4 w-4 mr-1" />
                        Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearAllRecipients}>
                        <X className="h-4 w-4 mr-1" />
                        Clear All
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
                        <Upload className="h-4 w-4 mr-1" />
                        Import
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportSelectedRecipients}
                        disabled={selectedRecipients.length === 0}
                    >
                        <Download className="h-4 w-4 mr-1" />
                        Export Selected
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={deleteSelectedRecipients}
                        disabled={selectedRecipients.length === 0}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Selected
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowGroupDialog(true)}>
                        <Users className="h-4 w-4 mr-1" />
                        Select by Group
                    </Button>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {selectedRecipients.length} recipients selected
                    </Badge>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg border">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">
                            Campaign Cost Estimate
                        </span>
                        <span className="text-sm text-muted-foreground">
                            {selectedRecipients.length} recipients × 1 message = ~${(selectedRecipients.length * 0.05).toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={selectedRecipients.length === filteredRecipients.length && filteredRecipients.length > 0}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                selectAllRecipients();
                                            } else {
                                                clearAllRecipients();
                                            }
                                        }}
                                    />
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Tags</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRecipients.map((recipient: ExtendedSMSRecipient) => (
                                <TableRow key={recipient.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedRecipients.includes(recipient.id)}
                                            onCheckedChange={() => toggleRecipient(recipient.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {recipient.first_name} {recipient.last_name}
                                    </TableCell>
                                    <TableCell>{recipient.phone_number}</TableCell>
                                    <TableCell>{recipient.company || '-'}</TableCell>
                                    <TableCell>
                                        {recipient.tags?.map(tag => (
                                            <Badge key={tag} variant="outline" className="mr-1">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={recipient.status === 'active' ? 'default' : 'secondary'}>
                                            {recipient.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {filteredRecipients.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No recipients found matching your criteria
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
