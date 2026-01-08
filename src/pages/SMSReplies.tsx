import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Reply,
  Star,
  Archive,
  Trash2,
  Search,
  Filter,
  Download,
  Send,
  Phone,
  Clock,
  CheckCircle,
  Circle,
  MailOpen,
  Mail,
  MoreHorizontal,
  Eye,
  Calendar
} from 'lucide-react';
import { smsAPI } from '@/lib/sms-api';

interface SMSReply {
  id: string;
  campaign_id: string;
  campaign_name: string;
  phone_number: string;
  message: string;
  created_at: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  sender_id?: string;
  external_id?: string;
  user_id?: string;
  recipient_id?: string;
}

interface SMSRepliesProps {
  embedded?: boolean;
}

export default function SMSReplies({ embedded = false }: SMSRepliesProps) {
  const [replies, setReplies] = useState<SMSReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'archived'>('all');
  const [selectedReplies, setSelectedReplies] = useState<Set<string>>(new Set());
  const [selectedReply, setSelectedReply] = useState<SMSReply | null>(null);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadReplies();
  }, []);

  const loadReplies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await smsAPI.getSMSReplies();

      const transformedReplies: SMSReply[] = (Array.isArray(data) ? data : []).map((reply: any) => ({
        id: String(reply.id ?? ''),
        campaign_id: String(reply.campaign_id ?? '0'),
        campaign_name: String(reply.campaign_name ?? 'Direct'),
        phone_number: String(reply.phone_number ?? ''),
        message: String(reply.message ?? ''),
        created_at: String(reply.created_at ?? reply.received_at ?? ''),
        is_read: Boolean(reply.is_read ?? reply.status === 'read'),
        is_starred: Boolean(reply.is_starred),
        is_archived: Boolean(reply.is_archived ?? reply.status === 'archived'),
        sender_id: reply.sender_id ? String(reply.sender_id) : undefined,
        external_id: reply.external_id ? String(reply.external_id) : undefined,
        user_id: reply.user_id ? String(reply.user_id) : undefined,
        recipient_id: reply.recipient_id ? String(reply.recipient_id) : undefined,
      }));

      setReplies(transformedReplies);
    } catch (err) {
      console.error('Failed to fetch SMS replies:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch SMS replies';
      setError(errorMessage);
      setReplies([]);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (replyId: string) => {
    try {
      await smsAPI.bulkAction('mark_read', [replyId]);
      setReplies(prev => prev.map(reply =>
        reply.id === replyId ? { ...reply, is_read: true } : reply
      ));
      toast({
        title: 'Success',
        description: 'SMS marked as read',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark SMS as read',
        variant: 'destructive',
      });
    }
  };

  const markAsUnread = async (replyId: string) => {
    try {
      // For now, just update locally since we don't have an unread endpoint
      setReplies(prev => prev.map(reply =>
        reply.id === replyId ? { ...reply, is_read: false } : reply
      ));
      toast({
        title: 'Success',
        description: 'SMS marked as unread',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark SMS as unread',
        variant: 'destructive',
      });
    }
  };

  const toggleStar = async (replyId: string) => {
    try {
      await smsAPI.bulkAction('mark_starred', [replyId]);
      setReplies(prev => prev.map(reply =>
        reply.id === replyId ? { ...reply, is_starred: !reply.is_starred } : reply
      ));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle star',
        variant: 'destructive',
      });
    }
  };

  const toggleArchive = async (replyId: string) => {
    try {
      await smsAPI.bulkAction('mark_archived', [replyId]);
      setReplies(prev => prev.map(reply =>
        reply.id === replyId ? { ...reply, is_archived: !reply.is_archived } : reply
      ));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle archive',
        variant: 'destructive',
      });
    }
  };

  const deleteReply = async (replyId: string) => {
    if (!confirm('Are you sure you want to delete this SMS reply?')) {
      return;
    }

    try {
      await smsAPI.bulkAction('delete', [replyId]);
      setReplies(prev => prev.filter(reply => reply.id !== replyId));
      toast({
        title: 'Success',
        description: 'SMS reply deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete SMS reply',
        variant: 'destructive',
      });
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !replyTo) {
      toast({
        title: 'Error',
        description: 'Please enter a message and recipient',
        variant: 'destructive',
      });
      return;
    }

    setSendingReply(true);
    try {
      // Get default sender number from SMS settings or use first available
      const settings = await smsAPI.getSMSSettings();
      const senderNumber = settings?.defaultSenderNumber || '';

      if (!senderNumber) {
        toast({
          title: 'Error',
          description: 'No sender number configured. Please configure SMS settings first.',
          variant: 'destructive',
        });
        return;
      }

      await smsAPI.sendIndividualSMS(replyTo, replyMessage, senderNumber);

      toast({
        title: 'Success',
        description: 'SMS reply sent successfully',
      });

      setIsReplyDialogOpen(false);
      setReplyMessage('');
      setReplyTo('');

      // Reload replies to show the sent message
      await loadReplies();
    } catch (err) {
      console.error('Failed to send SMS reply:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send SMS reply';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSendingReply(false);
    }
  };

  const openReplyDialog = (reply: SMSReply) => {
    setSelectedReply(reply);
    setReplyTo(reply.phone_number);
    setReplyMessage('');
    setIsReplyDialogOpen(true);
  };

  const viewReply = (reply: SMSReply) => {
    setSelectedReply(reply);
    if (!reply.is_read) {
      markAsRead(reply.id);
    }
  };

  const handleSelectReply = (replyId: string) => {
    setSelectedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(replyId)) {
        newSet.delete(replyId);
      } else {
        newSet.add(replyId);
      }
      return newSet;
    });
  };

  const selectAllReplies = () => {
    setSelectedReplies(new Set());
    setSelectedReplies(new Set(filteredReplies.map(reply => reply.id)));
  };

  const bulkMarkAsRead = async () => {
    if (selectedReplies.size === 0) return;

    try {
      for (const replyId of selectedReplies) {
        await markAsRead(replyId);
      }
      setSelectedReplies(new Set());

      toast({
        title: 'Success',
        description: `Marked ${selectedReplies.size} SMS messages as read`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark SMS messages as read',
        variant: 'destructive',
      });
    }
  };

  const bulkMarkAsUnread = async () => {
    if (selectedReplies.size === 0) return;

    try {
      for (const replyId of selectedReplies) {
        await markAsUnread(replyId);
      }
      setSelectedReplies(new Set());

      toast({
        title: 'Success',
        description: `Marked ${selectedReplies.size} SMS messages as unread`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark SMS messages as unread',
        variant: 'destructive',
      });
    }
  };

  const bulkStar = async () => {
    if (selectedReplies.size === 0) return;

    try {
      for (const replyId of selectedReplies) {
        await toggleStar(replyId);
      }
      setSelectedReplies(new Set());

      toast({
        title: 'Success',
        description: `Starred ${selectedReplies.size} SMS messages`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to star SMS messages',
        variant: 'destructive',
      });
    }
  };

  const bulkArchive = async () => {
    if (selectedReplies.size === 0) return;

    try {
      for (const replyId of selectedReplies) {
        await toggleArchive(replyId);
      }
      setSelectedReplies(new Set());

      toast({
        title: 'Success',
        description: `Archived ${selectedReplies.size} SMS messages`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to archive SMS messages',
        variant: 'destructive',
      });
    }
  };

  const bulkDelete = async () => {
    if (selectedReplies.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedReplies.size} SMS messages?`)) {
      return;
    }

    try {
      for (const replyId of selectedReplies) {
        await deleteReply(replyId);
      }
      setSelectedReplies(new Set());

      toast({
        title: 'Success',
        description: `Deleted ${selectedReplies.size} SMS messages`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete SMS messages',
        variant: 'destructive',
      });
    }
  };

  const exportReplies = () => {
    const repliesToExport = selectedReplies.size > 0
      ? replies.filter(reply => selectedReplies.has(reply.id))
      : filteredReplies;

    const csvContent = [
      ['Campaign', 'Phone Number', 'Message', 'Created At', 'Status'].join(','),
      ...repliesToExport.map(reply => [
        reply.campaign_name,
        reply.phone_number,
        `"${reply.message.replace(/"/g, '""')}"`,
        reply.created_at,
        reply.is_read ? 'Read' : 'Unread'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sms-replies-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: `Exported ${repliesToExport.length} SMS replies`,
    });
  };

  const filteredReplies = replies.filter(reply => {
    const matchesSearch =
      reply.phone_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.campaign_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'unread' && !reply.is_read) ||
      (filter === 'starred' && reply.is_starred) ||
      (filter === 'archived' && reply.is_archived);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    const loadingContent = (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading SMS replies...</p>
        </div>
      </div>
    );
    if (embedded) return loadingContent;
    return loadingContent;
  }

  if (error) {
    const errorContent = (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-medium mb-2">Failed to load SMS replies</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadReplies} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
    if (embedded) return errorContent;
    return errorContent;
  }

  const content = (
    <>
      <div className={`space-y-6 w-full max-w-none ${embedded ? '' : 'px-6'}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight text-foreground">SMS Replies</h1>
            <p className="text-muted-foreground">
              Manage and respond to SMS replies from your campaigns
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={exportReplies} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="border-analytics">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search SMS replies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="w-full sm:w-32">
                <Label htmlFor="filter">Status</Label>
                <Select value={filter} onValueChange={(value: 'all' | 'unread' | 'starred' | 'archived') => setFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="starred">Starred</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedReplies.size > 0 && (
          <Card className="border-analytics">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {selectedReplies.size} SMS repl{selectedReplies.size !== 1 ? 'ies' : 'y'} selected
                </span>
                <div className="flex gap-2">
                  <Button onClick={bulkMarkAsRead} variant="outline" size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Read
                  </Button>
                  <Button onClick={exportReplies} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SMS Replies List */}
        <Card className="border-analytics">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <span>SMS Replies ({filteredReplies.length})</span>
              </CardTitle>
              {filteredReplies.length > 0 && (
                <Button variant="outline" size="sm" onClick={selectAllReplies}>
                  Select All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredReplies.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No SMS replies found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filter !== 'all'
                    ? "No SMS replies match your current filters."
                    : "You haven't received any SMS replies yet."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedReplies.size === filteredReplies.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedReplies(new Set(filteredReplies.map(reply => reply.id)));
                          } else {
                            setSelectedReplies(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReplies.map((reply) => (
                    <TableRow
                      key={reply.id}
                      className={`cursor-pointer hover:bg-muted/50 ${!reply.is_read ? 'font-semibold' : ''}`}
                      onClick={() => viewReply(reply)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedReplies.has(reply.id)}
                          onCheckedChange={() => handleSelectReply(reply.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{reply.phone_number}</div>
                            <div className="text-sm text-muted-foreground">
                              {reply.external_id || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {reply.is_starred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                          <span className={`line-clamp-2 ${!reply.is_read ? 'font-semibold' : ''}`}>
                            {reply.message}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {reply.campaign_name || 'Direct'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={reply.is_read ? "secondary" : "default"}>
                          {reply.is_read ? 'Read' : 'Unread'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{new Date(reply.created_at).toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewReply(reply)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openReplyDialog(reply)}>
                              <Reply className="h-4 w-4 mr-2" />
                              Reply
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleStar(reply.id)}>
                              <Star className="h-4 w-4 mr-2" />
                              {reply.is_starred ? 'Unstar' : 'Star'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleArchive(reply.id)}>
                              <Archive className="h-4 w-4 mr-2" />
                              {reply.is_archived ? 'Unarchive' : 'Archive'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteReply(reply.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Reply Dialog */}
        <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reply to SMS</DialogTitle>
              <DialogDescription>
                Send a reply to {selectedReply?.phone_number}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label htmlFor="replyTo" className="text-sm font-medium">
                  To
                </label>
                <Input
                  id="replyTo"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  placeholder="Recipient phone number"
                />
              </div>
              <div>
                <label htmlFor="replyMessage" className="text-sm font-medium">
                  Message
                </label>
                <Textarea
                  id="replyMessage"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {replyMessage.length}/160 characters
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)} disabled={sendingReply}>
                  Cancel
                </Button>
                <Button onClick={sendReply} disabled={sendingReply || !replyMessage.trim()}>
                  {sendingReply ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View SMS Dialog */}
        {selectedReply && (
          <Dialog open={!!selectedReply} onOpenChange={() => setSelectedReply(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>SMS Reply Details</DialogTitle>
                <DialogDescription>
                  From: {selectedReply.phone_number} • Campaign: {selectedReply.campaign_name} • {new Date(selectedReply.created_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedReply.message}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedReply(null)}>
                    Close
                  </Button>
                  <Button onClick={() => openReplyDialog(selectedReply)}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );

  if (embedded) {
    return content;
  }

  return content;
}
