import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAuth } from '@/lib/mockAuth';
import { mockData } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Search, Filter, Users } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const Recipients = () => {
  const navigate = useNavigate();
  const [recipients, setRecipients] = useState(mockData.getRecipients());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!mockAuth.isAuthenticated()) {
      navigate('/auth');
    }
  }, [navigate]);

  const filteredRecipients = recipients.filter(
    (r) =>
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'default';
      case 'opened':
        return 'default';
      case 'clicked':
        return 'default';
      case 'bounced':
        return 'destructive';
      case 'unsubscribed':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recipients</h1>
            <p className="text-muted-foreground mt-1">
              Manage your email recipients and contacts
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button className="shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Recipient
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {filteredRecipients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No recipients found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Add recipients to start sending campaigns'}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Campaign</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecipients.map((recipient) => (
                      <TableRow key={recipient.id}>
                        <TableCell className="font-medium">
                          {recipient.firstName && recipient.lastName
                            ? `${recipient.firstName} ${recipient.lastName}`
                            : '-'}
                        </TableCell>
                        <TableCell>{recipient.email}</TableCell>
                        <TableCell>{recipient.company || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(recipient.status)}>
                            {recipient.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {recipient.campaignId.substring(0, 8)}...
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Recipients;
