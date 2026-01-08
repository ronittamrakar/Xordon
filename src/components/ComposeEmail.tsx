import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface SendingAccount {
  id: string;
  name: string;
  email: string;
  provider: 'gmail' | 'smtp';
  status: 'active' | 'inactive';
  dailyLimit: number;
  sentToday: number;
}

interface ComposeEmailProps {
  isOpen: boolean;
  onClose: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
}

export function ComposeEmail({ 
  isOpen, 
  onClose, 
  initialTo = '', 
  initialSubject = '', 
  initialBody = '' 
}: ComposeEmailProps) {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [sendingAccounts, setSendingAccounts] = useState<SendingAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setTo(initialTo);
    setSubject(initialSubject);
    setBody(initialBody);
  }, [initialTo, initialSubject, initialBody]);

  useEffect(() => {
    if (isOpen) {
      loadSendingAccounts();
    }
  }, [isOpen, loadSendingAccounts]);

  const loadSendingAccounts = React.useCallback(async () => {
    try {
      const accounts = await api.getSendingAccounts();
      setSendingAccounts(accounts);
      if (accounts.length > 0 && !selectedAccount) {
        setSelectedAccount(accounts[0].id);
      }
    } catch (error) {
      console.error('Failed to load sending accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sending accounts',
        variant: 'destructive',
      });
    }
  }, [selectedAccount, toast]);

  const handleSend = async () => {
    if (!to || !subject || !body) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedAccount) {
      toast({
        title: 'Error',
        description: 'Please select a sending account',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      await api.sendIndividualEmail({
        to_email: to,
        subject: subject,
        body: body,
        sending_account_id: selectedAccount,
        save_to_sent: true
      });

      toast({
        title: 'Success',
        description: 'Email sent successfully',
      });

      // Reset form
      setTo('');
      setSubject('');
      setBody('');
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Compose Email
          </DialogTitle>
          <DialogDescription>
            Send an individual email to a recipient
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sending Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="sending-account">From Account</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Select sending account" />
              </SelectTrigger>
              <SelectContent>
                {sendingAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex flex-col">
                      <span>{account.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {account.email} ({account.sentToday}/{account.dailyLimit} sent today)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* To Field */}
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="email"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={isSending}
            />
          </div>

          {/* Subject Field */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
            />
          </div>

          {/* Body Field */}
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Write your email message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              disabled={isSending}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
