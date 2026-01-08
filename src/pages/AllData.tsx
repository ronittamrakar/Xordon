import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Database, 
  Mail, 
  MessageSquare, 
  Phone, 
  FileTextIcon, 
  Users, 
  Send, 
  BarChart3,
  Download,
  RefreshCw,
  Search
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Breadcrumb } from '@/components/Breadcrumb';

interface AllDataResponse {
  campaigns: any[];
  sms_campaigns: any[];
  call_campaigns: any[];
  forms: any[];
  contacts: any[];
  templates: any[];
  sms_templates: any[];
  sequences: any[];
  sms_sequences: any[];
  recipients: any[];
  sms_messages: any[];
  sms_replies: any[];
  form_responses: any[];
  call_logs: any[];
  call_recipients: any[];
  analytics: any[];
  sending_accounts: any[];
  connections: any[];
  call_scripts: any[];
  call_dispositions: any[];
  groups: any[];
  tags: any[];
  custom_variables: any[];
  unsubscribes: any[];
  sms_unsubscribes: any[];
  follow_up_emails: any[];
  email_replies: any[];
  summary: {
    total_campaigns: number;
    total_sms_campaigns: number;
    total_call_campaigns: number;
    total_forms: number;
    total_contacts: number;
    total_templates: number;
    total_sms_templates: number;
    total_sequences: number;
    total_sms_sequences: number;
    total_recipients: number;
    total_sms_messages: number;
    total_form_responses: number;
    total_call_logs: number;
    total_analytics_records: number;
    total_email_replies: number;
    total_sms_replies: number;
  };
}

const AllData = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AllDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('AllData: Component mounted');
    if (!api.isAuthenticated()) {
      console.log('AllData: Not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    console.log('AllData: Authenticated, loading data...');
    loadAllData();
  }, [navigate]);

  const loadAllData = async () => {
    try {
      console.log('AllData: Starting to load data...');
      setError(null);
      setLoading(true);
      const response = await api.getAllData();
      console.log('AllData: API response received:', response);
      setData(response as AllDataResponse);
      console.log('AllData: Data set successfully');
    } catch (err) {
      console.error('AllData: Failed to load all data:', err);
      setError('Failed to load data from database');
    } finally {
      setLoading(false);
      console.log('AllData: Loading finished');
    }
  };

  const exportData = () => {
    if (!data) return;
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `all-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading all database data...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadAllData}>Retry</Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground">No data available</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const filteredData = (items: any[]) => {
    if (!searchTerm) return items;
    return items.filter(item => 
      JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumb 
          items={[
            { label: 'Reports', href: '/reports', icon: <BarChart3 className="h-4 w-4" /> },
            { label: 'All Data' }
          ]} 
          className="mb-6" 
        />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight">All Database Data</h1>
            <p className="text-muted-foreground mt-1">Complete view of all data in your database</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadAllData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportData} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search across all data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{data.summary.total_campaigns}</div>
              <p className="text-xs text-muted-foreground">Email campaigns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">SMS Campaigns</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{data.summary.total_sms_campaigns}</div>
              <p className="text-xs text-muted-foreground">SMS campaigns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Call Campaigns</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{data.summary.total_call_campaigns}</div>
              <p className="text-xs text-muted-foreground">Call campaigns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Forms</CardTitle>
              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{data.summary.total_forms}</div>
              <p className="text-xs text-muted-foreground">Form templates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{data.summary.total_contacts}</div>
              <p className="text-xs text-muted-foreground">Total contacts</p>
            </CardContent>
          </Card>
        </div>

        {/* Data Tables */}
        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 lg:grid-cols-8">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Campaigns ({filteredData(data.campaigns).length})</CardTitle>
                <CardDescription>All email campaigns in the database</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredData(data.campaigns).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Subject: {campaign.subject} • Status: {campaign.status}
                          </div>
                        </div>
                        <Badge variant={campaign.status === 'completed' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SMS Campaigns ({filteredData(data.sms_campaigns).length})</CardTitle>
                <CardDescription>All SMS campaigns in the database</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredData(data.sms_campaigns).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Status: {campaign.status} • Recipients: {campaign.recipient_count || 0}
                          </div>
                        </div>
                        <Badge variant={campaign.status === 'completed' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Call Campaigns ({filteredData(data.call_campaigns).length})</CardTitle>
                <CardDescription>All call campaigns in the database</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredData(data.call_campaigns).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Status: {campaign.status} • Calls: {campaign.completed_calls || 0}
                          </div>
                        </div>
                        <Badge variant={campaign.status === 'completed' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Forms ({filteredData(data.forms).length})</CardTitle>
                <CardDescription>All form templates in the database</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredData(data.forms).map((form) => (
                      <div key={form.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <div className="font-medium">{form.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Status: {form.status} • Responses: {form.response_count || 0}
                          </div>
                        </div>
                        <Badge variant={form.status === 'active' ? 'default' : 'secondary'}>
                          {form.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contacts ({filteredData(data.contacts).length})</CardTitle>
                <CardDescription>All contacts in the database</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredData(data.contacts).map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <div className="font-medium">{contact.first_name} {contact.last_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {contact.email} • {contact.company}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {contact.status || 'active'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Templates ({filteredData(data.templates).length + filteredData(data.sms_templates).length})</CardTitle>
                <CardDescription>Email and SMS templates</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Email Templates</h4>
                      <div className="space-y-2">
                        {filteredData(data.templates).map((template) => (
                          <div key={template.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {template.subject}
                              </div>
                            </div>
                            <Badge variant="outline">
                              Email
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">SMS Templates</h4>
                      <div className="space-y-2">
                        {filteredData(data.sms_templates).map((template) => (
                          <div key={template.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {template.message?.substring(0, 50)}...
                              </div>
                            </div>
                            <Badge variant="outline">
                              SMS
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Records ({filteredData(data.analytics).length})</CardTitle>
                <CardDescription>All analytics data points</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredData(data.analytics).map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <div className="font-medium">{record.metric_type}</div>
                          <div className="text-sm text-muted-foreground">
                            {record.date_recorded} • Value: {record.metric_value}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {record.campaign_id ? `Campaign ${record.campaign_id}` : 'General'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="other" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sequences ({filteredData(data.sequences).length + filteredData(data.sms_sequences).length})</CardTitle>
                  <CardDescription>Email and SMS sequences</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {filteredData(data.sequences).map((sequence) => (
                        <div key={sequence.id} className="p-2 border rounded">
                          <div className="font-medium">{sequence.name}</div>
                          <div className="text-sm text-muted-foreground">Email Sequence</div>
                        </div>
                      ))}
                      {filteredData(data.sms_sequences).map((sequence) => (
                        <div key={sequence.id} className="p-2 border rounded">
                          <div className="font-medium">{sequence.name}</div>
                          <div className="text-sm text-muted-foreground">SMS Sequence</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Messages & Responses</CardTitle>
                  <CardDescription>Recipients, messages, and responses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 border-b">
                        <span>Email Recipients:</span>
                        <Badge>{filteredData(data.recipients).length}</Badge>
                      </div>
                      <div className="flex justify-between p-2 border-b">
                        <span>SMS Messages:</span>
                        <Badge>{filteredData(data.sms_messages).length}</Badge>
                      </div>
                      <div className="flex justify-between p-2 border-b">
                        <span>Form Responses:</span>
                        <Badge>{filteredData(data.form_responses).length}</Badge>
                      </div>
                      <div className="flex justify-between p-2 border-b">
                        <span>Call Logs:</span>
                        <Badge>{filteredData(data.call_logs).length}</Badge>
                      </div>
                      <div className="flex justify-between p-2 border-b">
                        <span>Email Replies:</span>
                        <Badge>{filteredData(data.email_replies).length}</Badge>
                      </div>
                      <div className="flex justify-between p-2 border-b">
                        <span>SMS Replies:</span>
                        <Badge>{filteredData(data.sms_replies).length}</Badge>
                      </div>
                      <div className="flex justify-between p-2">
                        <span>Unsubscribes:</span>
                        <Badge>{filteredData(data.unsubscribes).length + filteredData(data.sms_unsubscribes).length}</Badge>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AllData;

