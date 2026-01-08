import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, Filter, UserX, Plus, AlertCircle, Users } from 'lucide-react';
import { api, type Recipient, type Campaign } from '@/lib/api';

import { useToast } from '@/hooks/use-toast';

const Unsubscribers = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');

  // Bulk unsubscribe state
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ success: string[], failed: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [recipientsData, campaignsData] = await Promise.all([
        api.getUnsubscribedRecipients(),
        api.getCampaigns()
      ]);
      setRecipients(recipientsData);
      setCampaigns(campaignsData);
    } catch (err) {
      console.error('Failed to load data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load unsubscribers';
      setError(errorMessage);
      setRecipients([]);
      setCampaigns([]);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter recipients (already unsubscribed from API)
  const filteredRecipients = recipients.filter(recipient =>
    (selectedCampaign === 'all' || recipient.campaignId?.toString() === selectedCampaign) &&
    (searchTerm === '' ||
      recipient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.company?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportUnsubscribes = () => {
    const csvContent = [
      ['Email', 'Name', 'Company', 'Campaign', 'Unsubscribed At'].join(','),
      ...filteredRecipients.map(recipient => [
        recipient.email,
        recipient.name || '',
        recipient.company || '',
        recipient.campaign_name || 'Unknown Campaign',
        recipient.unsubscribed_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unsubscribes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validateEmail = (email: string): boolean => {
    // Allow domain patterns (starting with @)
    if (email.startsWith('@')) {
      return email.length > 1 && email.includes('.');
    }
    // Validate regular email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleBulkUnsubscribe = async () => {
    if (!bulkEmails.trim()) {
      toast({
        title: "No emails provided",
        description: "Please enter email addresses to unsubscribe.",
        variant: "destructive"
      });
      return;
    }

    setBulkProcessing(true);
    setBulkResults(null);

    try {
      // Parse emails from textarea (one per line)
      const emails = bulkEmails
        .split('\n')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      if (emails.length === 0) {
        setBulkProcessing(false);
        toast({
          title: "No valid emails",
          description: "Please enter valid email addresses.",
          variant: "destructive"
        });
        return;
      }

      // Validate email formats
      const invalidEmails = emails.filter(email => !validateEmail(email));
      if (invalidEmails.length > 0) {
        toast({
          title: "Invalid email format",
          description: `Invalid emails: ${invalidEmails.slice(0, 3).join(', ')}${invalidEmails.length > 3 ? '...' : ''}`,
          variant: "destructive"
        });
        setBulkProcessing(false);
        return;
      }

      const result = await api.bulkUnsubscribe(emails);
      setBulkResults(result);

      // Show success/failure toast
      if (result.success.length > 0 && result.failed.length === 0) {
        toast({
          title: "Bulk unsubscribe successful",
          description: `Successfully unsubscribed ${result.success.length} email(s).`
        });
        setBulkEmails(''); // Clear the textarea on complete success
      } else if (result.success.length > 0 && result.failed.length > 0) {
        toast({
          title: "Partial success",
          description: `${result.success.length} succeeded, ${result.failed.length} failed.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Bulk unsubscribe failed",
          description: `Failed to unsubscribe ${result.failed.length} email(s).`,
          variant: "destructive"
        });
      }

      // Refresh the unsubscribed recipients list
      await loadData();
    } catch (error) {
      console.error('Error during bulk unsubscribe:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      toast({
        title: "Bulk unsubscribe failed",
        description: `Error: ${errorMessage}`,
        variant: "destructive"
      });

      setBulkResults({
        success: [],
        failed: bulkEmails.split('\n').map(email => email.trim()).filter(email => email.length > 0)
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading unsubscribe data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">Failed to load unsubscribers</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadData} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>

    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-bold">Unsubscribers</h1>
            <p className="text-muted-foreground">
              Monitor and manage unsubscribed recipients
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/recipients')} variant="outline">
              <Users className="mr-2 h-4 w-4" />
              View All Recipients
            </Button>
            <Button onClick={exportUnsubscribes} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-analytics">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Unsubscribes</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{filteredRecipients.length}</div>
            </CardContent>
          </Card>

          <Card className="border-analytics">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">
                {filteredRecipients.filter(r => {
                  const unsubDate = new Date(r.unsubscribed_at!);
                  const now = new Date();
                  return unsubDate.getMonth() === now.getMonth() &&
                    unsubDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-analytics">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">
                {filteredRecipients.filter(r => {
                  const unsubDate = new Date(r.unsubscribed_at!);
                  const now = new Date();
                  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  return unsubDate >= weekAgo;
                }).length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-analytics">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unsubscribe Rate</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">
                {recipients.length > 0
                  ? ((filteredRecipients.length / recipients.length) * 100).toFixed(1)
                  : '0'
                }%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Unsubscribe Section */}
        <Card className="border-analytics">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Bulk Unsubscribe
            </CardTitle>
            <CardDescription>
              Add email addresses or domains to unsubscribe. Xordon won't send emails to these recipients.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Supported formats:</p>
                  <ul className="text-blue-800 space-y-1">
                    <li>• <strong>Individual emails:</strong> user@example.com</li>
                    <li>• <strong>Domain blocking:</strong> @domain.com (blocks all emails from this domain)</li>
                    <li>• <strong>Mixed list:</strong> Combine both formats, one per line</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="bulk-emails" className="text-sm font-medium">
                Email addresses or domains (one per line)
              </label>
              <Textarea
                id="bulk-emails"
                placeholder="user@example.com&#10;another@company.com&#10;@spammydomain.com&#10;@unwanted.org"
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                className="mt-1 min-h-[120px]"
                disabled={bulkProcessing}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleBulkUnsubscribe}
                disabled={!bulkEmails.trim() || bulkProcessing}
                className="flex items-center gap-2"
              >
                {bulkProcessing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UserX className="h-4 w-4" />
                    Unsubscribe
                  </>
                )}
              </Button>

              {bulkResults && (
                <div className="flex items-center gap-4 text-sm">
                  {bulkResults.success.length > 0 && (
                    <span className="text-green-600">
                      ✓ {bulkResults.success.length} unsubscribed
                    </span>
                  )}
                  {bulkResults.failed.length > 0 && (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {bulkResults.failed.length} failed
                    </span>
                  )}
                </div>
              )}
            </div>

            {bulkResults && bulkResults.failed.length > 0 && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm font-medium text-red-800">Failed to unsubscribe:</p>
                <ul className="text-sm text-red-700 mt-1">
                  {bulkResults.failed.map((email, index) => (
                    <li key={index}>• {email}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-analytics">
          <CardHeader>
            <CardTitle>Unsubscribed Recipients</CardTitle>
            <CardDescription>
              List of all recipients who have unsubscribed from your campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by email, name, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Unsubscribed At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-muted-foreground">
                          <UserX className="mx-auto h-8 w-8 mb-2" />
                          <p>No unsubscribed recipients found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecipients.map((recipient) => (
                      <TableRow key={recipient.id}>
                        <TableCell className="font-medium">{recipient.email}</TableCell>
                        <TableCell>{recipient.name || '-'}</TableCell>
                        <TableCell>{recipient.company || '-'}</TableCell>
                        <TableCell>{recipient.campaign_name || '-'}</TableCell>
                        <TableCell>{formatDate(recipient.unsubscribed_at!)}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">Unsubscribed</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

  );
};

export default Unsubscribers;
