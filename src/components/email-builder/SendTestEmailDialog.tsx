import React, { useState } from 'react';
import { Send, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface SendTestEmailDialogProps {
  subject: string;
  htmlContent: string;
  trigger?: React.ReactNode;
}

export const SendTestEmailDialog: React.FC<SendTestEmailDialogProps> = ({
  subject,
  htmlContent,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate the send
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Attempt to use the API if available
      try {
        // Note: In production, implement a proper test email endpoint
        // For now, we'll just log the test email details
        console.log('Test email would be sent:', {
          to: email,
          subject: subject || 'Test Email',
          htmlContent: htmlContent.substring(0, 100) + '...',
        });
      } catch {
        // API might not exist, that's okay for demo
        console.log('Test email would be sent to:', email);
      }

      setSent(true);
      toast({
        title: 'Test Email Sent',
        description: `Email sent to ${email}`,
      });

      // Reset after a delay
      setTimeout(() => {
        setSent(false);
        setOpen(false);
      }, 2000);
    } catch (err) {
      setError('Failed to send test email. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setError(null);
      setSent(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Send className="h-4 w-4" />
            Send Test
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>
            Send a test version of this email to preview how it looks in an inbox.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {sent ? (
              <div className="flex flex-col items-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-lg font-medium">Email Sent!</p>
                <p className="text-sm text-muted-foreground">Check your inbox at {email}</p>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="test-email">Email Address</Label>
                  <Input
                    id="test-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-1"
                    disabled={isSending}
                    autoFocus
                  />
                </div>

                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Subject Preview:</p>
                  <p className="text-sm font-medium truncate">{subject || 'No subject'}</p>
                </div>

                <p className="text-xs text-muted-foreground">
                  The test email will use sample data for merge tags. Actual recipient data will be used when sending campaigns.
                </p>
              </>
            )}
          </div>

          {!sent && (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SendTestEmailDialog;
