import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, Filter, UserX, Plus, AlertCircle, Users, Smartphone } from 'lucide-react';
import { api, type SMSRecipient, type SMSCampaign } from '@/lib/api';

import { useToast } from '@/hooks/use-toast';

const SMSUnsubscribers = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [recipients, setRecipients] = useState<(SMSRecipient & {
    campaign_name: string;
    unsubscribes: number;
    unsubscribed_at: string;
    campaignId: string;
  })[]>([]);
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');

  // Bulk unsubscribe state
  const [bulkPhones, setBulkPhones] = useState('');
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
        api.getSMSUnsubscribedRecipients(),
        api.getSMSCampaigns()
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
    (recipient.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.company?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedCampaign === 'all' || recipient.campaignId === selectedCampaign)
  );

  const handleBulkUnsubscribe = async () => {
    if (!bulkPhones.trim()) {
      toast({
        title: "Error",
        description: "Please enter phone numbers to unsubscribe",
        variant: "destructive"
      });
      return;
    }

    setBulkProcessing(true);
    try {
      const phoneList = bulkPhones
        .split('\n')
        .map(phone => phone.trim())
        .filter(phone => phone.length > 0);

      const result = await api.bulkSMSUnsubscribe(phoneList);
      setBulkResults(result);

      toast({
        title: "Bulk Unsubscribe Complete",
        description: `Successfully unsubscribed ${result.success.length} numbers. ${result.failed.length} failed.`
      });

      // Reload data to show updated list
      await loadData();
    } catch (error) {
      console.error('Bulk unsubscribe failed:', error);
      toast({
        title: "Error",
        description: "Failed to process bulk unsubscribe",
        variant: "destructive"
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const exportUnsubscribers = () => {
    const csvContent = [
      ['Phone', 'Name', 'Company', 'Campaign', 'Unsubscribed Date'].join(','),
      ...filteredRecipients.map(recipient => [
        recipient.phone_number,
        recipient.name || '',
        recipient.company || '',
        recipient.campaign_name || '',
        new Date(recipient.unsubscribed_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sms-unsubscribers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight">SMS Unsubscribers</h1>
            <p className="text-muted-foreground">
              Manage SMS recipients who have opted out of your campaigns
            </p>
          </div>
          <Button onClick={exportUnsubscribers} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-analytics">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Unsubscribers</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{recipients.length}</div>
              <p className="text-xs text-muted-foreground">
                SMS recipients who opted out
              </p>
            </CardContent>
          </Card>
          <Card className="border-analytics">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">
                {recipients.filter(r => {
                  const unsubDate = new Date(r.unsubscribed_at);
                  const now = new Date();
                  return unsubDate.getMonth() === now.getMonth() && unsubDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                New unsubscribes this month
              </p>
            </CardContent>
          </Card>
          <Card className="border-analytics">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{campaigns.length}</div>
              <p className="text-xs text-muted-foreground">
                SMS campaigns with unsubscribers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Unsubscribe */}
        <Card className="border-analytics">
          <CardHeader>
            <CardTitle>Bulk Unsubscribe</CardTitle>
            <CardDescription>
              Add multiple phone numbers to unsubscribe (one per line)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter phone numbers, one per line&#10;+1234567890&#10;+1987654321"
              value={bulkPhones}
              onChange={(e) => setBulkPhones(e.target.value)}
              rows={4}
            />
            <Button
              onClick={handleBulkUnsubscribe}
              disabled={bulkProcessing}
              className="w-full"
            >
              {bulkProcessing ? 'Processing...' : 'Bulk Unsubscribe'}
            </Button>

            {bulkResults && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Results:</h4>
                <p className="text-sm text-green-600">Successfully unsubscribed: {bulkResults.success.length}</p>
                <p className="text-sm text-red-600">Failed: {bulkResults.failed.length}</p>
                {bulkResults.failed.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer">View failed numbers</summary>
                    <ul className="text-xs mt-1 ml-4">
                      {bulkResults.failed.map((phone, index) => (
                        <li key={index}>{phone}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card className="border-analytics">
          <CardHeader>
            <CardTitle>Filter Unsubscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by phone, name, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Unsubscribers Table */}
        <Card className="border-analytics">
          <CardHeader>
            <CardTitle>Unsubscribed Recipients ({filteredRecipients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive font-medium mb-2">Failed to load unsubscribers</p>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button onClick={loadData} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : filteredRecipients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No unsubscribed recipients found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Unsubscribed Date</TableHead>
                    <TableHead>Total Unsubscribes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipients.map((recipient) => (
                    <TableRow key={recipient.id}>
                      <TableCell className="font-medium">{recipient.phone_number}</TableCell>
                      <TableCell>{recipient.name || '-'}</TableCell>
                      <TableCell>{recipient.company || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {recipient.campaign_name || 'Unknown Campaign'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(recipient.unsubscribed_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {recipient.unsubscribes}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SMSUnsubscribers;
