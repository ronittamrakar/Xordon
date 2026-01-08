import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Phone, RefreshCw } from 'lucide-react';
import { smsAPI, SMSSendingAccount } from '../lib/sms-api';

interface IndividualSMSSenderProps {
  recipientPhone?: string;
  recipientName?: string;
  onSuccess?: () => void;
}

const IndividualSMSSender: React.FC<IndividualSMSSenderProps> = ({
  recipientPhone = '',
  recipientName = '',
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sendingAccounts, setSendingAccounts] = useState<SMSSendingAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(recipientPhone);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSendingAccounts();
  }, []);

  useEffect(() => {
    setPhoneNumber(recipientPhone);
  }, [recipientPhone]);

  const loadSendingAccounts = async () => {
    try {
      const accounts = await smsAPI.getSendingAccounts();
      setSendingAccounts(accounts);
      if (accounts.length > 0) {
        setSelectedAccount(accounts[0].id);
      }
    } catch (error) {
      console.error('Error loading sending accounts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load sending accounts'
      });
    }
  };

  const handleSendSMS = async () => {
    if (!phoneNumber || !message || !selectedAccount) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all required fields'
      });
      return;
    }

    const account = sendingAccounts.find(acc => acc.id === selectedAccount);
    if (!account) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a valid sending account'
      });
      return;
    }

    setIsLoading(true);
    try {
      await smsAPI.sendIndividualSMS(phoneNumber, message, account.phone_number);
      toast({
        title: 'Success',
        description: 'SMS sent successfully!'
      });
      setMessage('');
      setPhoneNumber('');
      setIsOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send SMS. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const insertVariable = (variable: string) => {
    const newMessage = message + `{{${variable}}}`;
    setMessage(newMessage);
  };

  const getCharacterCount = () => {
    return message.length;
  };

  const getSMSCount = () => {
    return Math.ceil(message.length / 160);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          Send SMS
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Individual SMS</DialogTitle>
          <DialogDescription>
            Send a personalized SMS message to {recipientName || 'this recipient'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sendingAccount">Sending Account</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger id="sendingAccount">
                <SelectValue placeholder="Select sending account" />
              </SelectTrigger>
              <SelectContent>
                {sendingAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{account.name}</span>
                      <Badge variant="outline">{account.phone_number}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
              maxLength={1600}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{getCharacterCount()}/1600 characters</span>
              <span>{getSMSCount()} SMS parts</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Quick Variables</Label>
            <div className="flex flex-wrap gap-2">
              {['firstName', 'lastName', 'company', 'phone'].map((variable) => (
                <Badge
                  key={variable}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => insertVariable(variable)}
                >
                  {'{{' + variable + '}}'}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendSMS} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send SMS
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IndividualSMSSender;
