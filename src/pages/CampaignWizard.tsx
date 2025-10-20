import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockAuth } from '@/lib/mockAuth';
import { mockData } from '@/lib/mockData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CampaignWizard = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [sendingAccounts, setSendingAccounts] = useState(mockData.getSendingAccounts());

  useEffect(() => {
    if (!mockAuth.isAuthenticated()) {
      navigate('/auth');
      return;
    }
    if (sendingAccounts.length === 0) {
      toast({
        title: 'No sending accounts',
        description: 'Please add a sending account first.',
        variant: 'destructive',
      });
      navigate('/sending-accounts');
    }
  }, [navigate, sendingAccounts, toast]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const campaign = mockData.addCampaign({
      name: formData.get('name') as string,
      subject: formData.get('subject') as string,
      htmlContent: formData.get('htmlContent') as string,
      status: 'draft',
      sendingAccountId: formData.get('sendingAccountId') as string,
      totalRecipients: 0,
    });

    toast({
      title: 'Campaign created',
      description: `${campaign.name} has been created successfully.`,
    });

    navigate('/campaigns');
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const recipients = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',');
        const recipient: any = { campaignId: id || 'temp' };
        
        headers.forEach((header, index) => {
          const value = values[index]?.trim();
          if (header === 'email') recipient.email = value;
          else if (header === 'firstname') recipient.firstName = value;
          else if (header === 'lastname') recipient.lastName = value;
          else if (header === 'company') recipient.company = value;
        });
        
        return recipient;
      });

      mockData.addRecipients(recipients);
      
      toast({
        title: 'Recipients uploaded',
        description: `${recipients.length} recipients added successfully.`,
      });
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/campaigns')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">{id ? 'Edit Campaign' : 'New Campaign'}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>Configure your email campaign settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="Q1 Product Launch" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sendingAccountId">Sending Account</Label>
                <Select name="sendingAccountId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {sendingAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input 
                  id="subject" 
                  name="subject" 
                  placeholder="Introducing our new product - {{firstName}}" 
                  required 
                />
                <p className="text-xs text-muted-foreground">
                  Use merge variables: {"{{firstName}}, {{lastName}}, {{company}}"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>Design your email template with HTML</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="htmlContent">HTML Template</Label>
                <Textarea 
                  id="htmlContent"
                  name="htmlContent"
                  placeholder="<p>Hi {{firstName}},</p><p>Your email content here...</p>"
                  className="font-mono min-h-[300px]"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use merge variables and include unsubscribe link
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recipients</CardTitle>
              <CardDescription>Upload your recipient list (CSV format)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <Label htmlFor="csv-upload" className="cursor-pointer">
                  <span className="text-primary hover:underline">Click to upload</span>
                  {' '}or drag and drop
                </Label>
                <Input 
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCSVUpload}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  CSV with columns: email, firstName, lastName, company
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Campaign
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/campaigns')}>
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CampaignWizard;
