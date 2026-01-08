import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Mail, MessageSquare, Send, Users, CheckCircle2, X } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { webinarApi } from '@/services/webinarApi';
import { toast } from 'sonner';
import { Contact } from '@/types/contact';

interface WebinarInviteModalProps {
    webinarId: string;
    webinarTitle: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function WebinarInviteModal({ webinarId, webinarTitle, open, onOpenChange }: WebinarInviteModalProps) {
    const [search, setSearch] = useState('');
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
    const [channels, setChannels] = useState<{ email: boolean; sms: boolean }>({ email: true, sms: false });

    // Fetch contacts
    const { data: contacts = [], isLoading } = useQuery({
        queryKey: ['contacts'],
        queryFn: () => api.getContacts(),
        enabled: open,
    });

    const inviteMutation = useMutation({
        mutationFn: (data: { contact_ids: string[]; channels: ('email' | 'sms')[] }) =>
            webinarApi.sendInvite(webinarId, data),
        onSuccess: (data) => {
            toast.success(`Invites sent to ${data.sent_count} contacts`);
            onOpenChange(false);
            setSelectedContacts(new Set());
        },
        onError: () => {
            toast.error('Failed to send invites');
        }
    });

    const filteredContacts = useMemo(() => {
        return contacts.filter((contact: Contact) => {
            const searchLower = search.toLowerCase();
            return (
                contact.firstName?.toLowerCase().includes(searchLower) ||
                contact.lastName?.toLowerCase().includes(searchLower) ||
                contact.email?.toLowerCase().includes(searchLower) ||
                contact.phone?.includes(searchLower) ||
                contact.company?.toLowerCase().includes(searchLower)
            );
        });
    }, [contacts, search]);

    const handleSelectAll = () => {
        if (selectedContacts.size === filteredContacts.length) {
            setSelectedContacts(new Set());
        } else {
            const newSelected = new Set(filteredContacts.map(c => c.id));
            setSelectedContacts(newSelected);
        }
    };

    const toggleContact = (id: string) => {
        const newSelected = new Set(selectedContacts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedContacts(newSelected);
    };

    const handleInvite = () => {
        const selectedChannels: ('email' | 'sms')[] = [];
        if (channels.email) selectedChannels.push('email');
        if (channels.sms) selectedChannels.push('sms');

        if (selectedChannels.length === 0) {
            toast.error('Please select at least one channel (Email or SMS)');
            return;
        }

        if (selectedContacts.size === 0) {
            toast.error('Please select at least one contact');
            return;
        }

        inviteMutation.mutate({
            contact_ids: Array.from(selectedContacts),
            channels: selectedChannels
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-[32px]">
                <DialogHeader className="p-6 pb-4 bg-slate-50/50 border-b">
                    <DialogTitle className="text-xl font-black flex items-center gap-2">
                        <Send className="h-5 w-5 text-primary" /> Invite to "{webinarTitle}"
                    </DialogTitle>
                    <DialogDescription>
                        Select contacts to send invitations to via Email or SMS.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-4 space-y-4 bg-white">
                    <div className="flex gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search contacts..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-10 rounded-xl"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                            <Button
                                variant={channels.email ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setChannels(prev => ({ ...prev, email: !prev.email }))}
                                className={`text-xs gap-2 ${channels.email ? 'bg-white shadow-sm text-primary font-bold' : 'text-slate-500'}`}
                            >
                                <Mail className="h-3.5 w-3.5" /> Email
                            </Button>
                            <Button
                                variant={channels.sms ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setChannels(prev => ({ ...prev, sms: !prev.sms }))}
                                className={`text-xs gap-2 ${channels.sms ? 'bg-white shadow-sm text-primary font-bold' : 'text-slate-500'}`}
                            >
                                <MessageSquare className="h-3.5 w-3.5" /> SMS
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={filteredContacts.length > 0 && selectedContacts.size === filteredContacts.length}
                                onCheckedChange={handleSelectAll}
                            />
                            <span>Select All ({filteredContacts.length})</span>
                        </div>
                        <span>{selectedContacts.size} selected</span>
                    </div>
                </div>

                <ScrollArea className="flex-1 p-4 pt-0">
                    <div className="space-y-1">
                        {isLoading ? (
                            <div className="py-8 text-center text-muted-foreground">Loading contacts...</div>
                        ) : filteredContacts.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">No contacts found</div>
                        ) : (
                            filteredContacts.map(contact => (
                                <div
                                    key={contact.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedContacts.has(contact.id) ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-slate-50'
                                        }`}
                                    onClick={() => toggleContact(contact.id)}
                                >
                                    <Checkbox
                                        checked={selectedContacts.has(contact.id)}
                                        onCheckedChange={() => toggleContact(contact.id)}
                                    />
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                                        {contact.firstName?.[0] || <Users className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm truncate">
                                            {contact.firstName} {contact.lastName}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                                            {contact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {contact.email}</span>}
                                            {contact.phone && <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {contact.phone}</span>}
                                        </div>
                                    </div>
                                    {contact.company && (
                                        <Badge variant="outline" className="hidden sm:inline-flex bg-white/50">
                                            {contact.company}
                                        </Badge>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="p-4 border-t bg-slate-50/50">
                    <div className="flex justify-between items-center w-full">
                        <div className="text-xs text-muted-foreground">
                            {selectedContacts.size} contacts will receive invite via {Object.entries(channels).filter(([_, v]) => v).map(([k]) => k.toUpperCase()).join(' & ')}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button onClick={handleInvite} disabled={inviteMutation.isPending || selectedContacts.size === 0}>
                                {inviteMutation.isPending ? 'Sending...' : 'Send Invites'}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
