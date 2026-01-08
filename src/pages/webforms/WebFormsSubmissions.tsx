import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { webformsApi } from '@/services/webformsApi';
import {
  FileTextIcon,
  Search,
  Filter,
  Download,
  ArrowLeft,
  Calendar,
  User,
  Mail,
  Clock,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function WebFormsSubmissions() {
  const { formId } = useParams();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['webforms-submissions', formId],
    queryFn: () => formId ? webformsApi.getSubmissions(formId) : webformsApi.getAllSubmissions(),
  });

  const { data: form } = useQuery({
    queryKey: ['webform', formId],
    queryFn: () => formId ? webformsApi.getForm(formId) : null,
    enabled: !!formId,
  });

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search submissions..." className="pl-8" />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Form</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading submissions...
                  </TableCell>
                </TableRow>
              ) : submissions?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No submissions found
                  </TableCell>
                </TableRow>
              ) : (
                submissions?.data?.map((submission: any) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{submission.contact_name || 'Anonymous'}</span>
                        <span className="text-xs text-muted-foreground">{submission.contact_email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{submission.form_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        {format(new Date(submission.created_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">New</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
