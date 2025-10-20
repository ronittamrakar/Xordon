import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAuth } from '@/lib/mockAuth';
import { mockData, type SendingAccount } from '@/lib/mockData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Mail, Plus, Trash2, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SendingAccounts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SendingAccount[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!mockAuth.isAuthenticated()) {
      navigate('/auth');
      return;
    }
    loadAccounts();
  }, [navigate]);

  const loadAccounts = () => {
    setAccounts(mockData.getSendingAccounts());
  };

  const handleAddAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const account = mockData.addSendingAccount({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      provider: formData.get('provider') as 'gmail' | 'smtp',
      status: 'active',
      dailyLimit: parseInt(formData.get('dailyLimit') as string),
    });

    toast({
      title: 'Account added',
      description: `${account.name} has been added successfully.`,
    });

    setDialogOpen(false);
    loadAccounts();
  };

  const handleDelete = (id: string) => {
    mockData.deleteSendingAccount(id);
    toast({
      title: 'Account deleted',
      description: 'The sending account has been removed.',
    });
    loadAccounts();
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    mockData.updateSendingAccount(id, {
      status: currentStatus === 'active' ? 'inactive' : 'active',
    });
    loadAccounts();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Sending Accounts</h1>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Sending Account</DialogTitle>
                <DialogDescription>
                  Configure a new email account for sending campaigns
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Account Name</Label>
                  <Input id="name" name="name" placeholder="My Gmail Account" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" placeholder="sender@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select name="provider" defaultValue="gmail" required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gmail">Gmail (OAuth2)</SelectItem>
                      <SelectItem value="smtp">SMTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dailyLimit">Daily Sending Limit</Label>
                  <Input id="dailyLimit" name="dailyLimit" type="number" defaultValue="500" required />
                </div>
                <Button type="submit" className="w-full">Add Account</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Mail className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sending accounts yet</h3>
              <p className="text-muted-foreground mb-4">Add your first sending account to start campaigns</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      <CardDescription>{account.email}</CardDescription>
                    </div>
                    <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                      {account.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-medium capitalize">{account.provider}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Daily Limit</span>
                    <span className="font-medium">{account.dailyLimit}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sent Today</span>
                    <span className="font-medium">{account.sentToday} / {account.dailyLimit}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(account.sentToday / account.dailyLimit) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleToggleStatus(account.id, account.status)}
                    >
                      {account.status === 'active' ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Disable
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Enable
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SendingAccounts;
