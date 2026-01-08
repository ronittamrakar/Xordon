import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Send, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface SMSConversation {
    id: number;
    phone_number_id: number;
    contact_number: string;
    last_message_at: string;
    last_message_preview: string;
    unread_count: number;
    status: string;
}

export default function PhoneSms() {
    const [conversations, setConversations] = useState<SMSConversation[]>([]);
    const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false);
    const [isConversationDialogOpen, setIsConversationDialogOpen] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<SMSConversation | null>(null);

    const [smsForm, setSmsForm] = useState({
        to_number: '',
        message: '',
        phone_number_id: '',
    });

    useEffect(() => {
        loadData();
        loadNumbers();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/phone/sms-conversations');
            setConversations((response.data as any)?.items || []);
        } catch (error) {
            console.error('Failed to load SMS conversations:', error);
            toast.error('Failed to load SMS');
        } finally {
            setLoading(false);
        }
    };

    const loadNumbers = async () => {
        try {
            const response = await api.get('/phone-numbers');
            const numbers = (response.data as any)?.items || [];
            setPhoneNumbers(numbers.filter((p: any) => p.capabilities?.sms));
        } catch (error) { console.error('Error fetching phone numbers:', error); }
    };

    const sendSms = async () => {
        try {
            await api.post('/phone/sms/send', smsForm);
            toast.success('Message sent');
            setIsSmsDialogOpen(false);
            setSmsForm({ to_number: '', message: '', phone_number_id: '' });
            loadData();
        } catch (error) { toast.error('Failed to send message'); }
    };

    const openConversation = (conv: SMSConversation) => {
        setSelectedConversation(conv);
        setIsConversationDialogOpen(true);
    };

    const reply = (conv: SMSConversation) => {
        setSmsForm({
            to_number: conv.contact_number,
            message: '',
            phone_number_id: String(conv.phone_number_id),
        });
        setIsConversationDialogOpen(false);
        setIsSmsDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight text-foreground">SMS Messaging</h1>
                    <p className="text-muted-foreground mt-1">Manage text conversations with your contacts</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
                    <Button onClick={() => setIsSmsDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />New Message</Button>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search conversations..." className="pl-8 w-64" />
                </div>
            </div>

            <div className="space-y-4">
                {conversations.length === 0 ? (
                    <Card className="border-analytics"><CardContent className="p-8 text-center text-muted-foreground">No conversations found</CardContent></Card>
                ) : (
                    conversations.map((conv) => (
                        <Card key={conv.id} className="cursor-pointer hover:bg-muted/50 border-analytics" onClick={() => openConversation(conv)}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className="font-medium">{conv.contact_number}</span>
                                            {conv.unread_count > 0 && <Badge variant="secondary">{conv.unread_count} unread</Badge>}
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{conv.last_message_preview}</p>
                                        <span className="text-xs text-muted-foreground">{new Date(conv.last_message_at).toLocaleString()}</span>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openConversation(conv); }}>View</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* New SMS Dialog */}
            <Dialog open={isSmsDialogOpen} onOpenChange={setIsSmsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>New Message</DialogTitle><DialogDescription>Send an SMS message</DialogDescription></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>From Number</Label>
                            <Select value={smsForm.phone_number_id} onValueChange={v => setSmsForm({ ...smsForm, phone_number_id: v })}>
                                <SelectTrigger><SelectValue placeholder="Select number" /></SelectTrigger>
                                <SelectContent>
                                    {phoneNumbers.map(p => (
                                        <SelectItem key={p.id} value={String(p.id)}>{p.friendly_name} ({p.phone_number})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>To Number *</Label>
                            <Input value={smsForm.to_number} onChange={e => setSmsForm({ ...smsForm, to_number: e.target.value })} placeholder="+1 (555) 123-4567" />
                        </div>
                        <div className="space-y-2">
                            <Label>Message *</Label>
                            <Textarea value={smsForm.message} onChange={e => setSmsForm({ ...smsForm, message: e.target.value })} rows={4} placeholder="Type your message..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSmsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={sendSms} disabled={!smsForm.to_number || !smsForm.message}><Send className="h-4 w-4 mr-2" />Send</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Conversation Dialog */}
            <Dialog open={isConversationDialogOpen} onOpenChange={setIsConversationDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Conversation</DialogTitle><DialogDescription>{selectedConversation?.contact_number}</DialogDescription></DialogHeader>
                    {selectedConversation && (
                        <div className="space-y-3 py-4">
                            <p className="text-sm italic">"{selectedConversation.last_message_preview}"</p>
                            <div className="text-xs text-muted-foreground">Last message: {new Date(selectedConversation.last_message_at).toLocaleString()}</div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConversationDialogOpen(false)}>Close</Button>
                        {selectedConversation && <Button onClick={() => reply(selectedConversation)}>Reply</Button>}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
