import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { webformsApi, WebForm } from '@/services/webformsApi';
import {
  Archive,
  Search,
  RotateCcw,
  Trash2,
  Eye,
  MoreVertical,
  FileTextIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function WebFormsArchive() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch archived forms
  const { data: formsData, isLoading } = useQuery({
    queryKey: ['webforms', 'archived', searchTerm],
    queryFn: async () => {
      const params: Record<string, string> = { status: 'archived' };
      if (searchTerm) params.search = searchTerm;
      return webformsApi.getForms(params);
    },
  });

  // Restore form mutation
  const restoreMutation = useMutation({
    mutationFn: (id: number) => webformsApi.updateForm(id, { status: 'draft' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms'] });
      toast.success('Form restored successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to restore form');
    },
  });

  // Delete form mutation
  // Move to Trash mutation
  const moveToTrashMutation = useMutation({
    mutationFn: (id: number) => webformsApi.updateForm(id, { status: 'trashed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms'] });
      toast.success('Form moved to trash');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to move form to trash');
    },
  });

  const forms = formsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Archived Forms</h1>
          <p className="text-muted-foreground">
            Forms that have been archived. Restore them to make them active again.
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search archived forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Archived Forms List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Archive className="h-5 w-5 mr-2" />
            Archived Forms ({forms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : forms.length > 0 ? (
            <div className="space-y-2">
              {forms.map((form: WebForm) => (
                <div
                  key={form.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <FileTextIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{form.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {form.description || 'No description'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restoreMutation.mutate(form.id)}
                      disabled={restoreMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/forms/preview/${form.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm('Move this form to trash? Items in trash are deleted after 30 days.')) {
                              moveToTrashMutation.mutate(form.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Move to Trash
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Archive className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No archived forms</h3>
              <p className="text-muted-foreground mt-2">
                Forms you archive will appear here.
              </p>
              <Button className="mt-6" variant="outline" asChild>
                <Link to="/forms/forms">View Active Forms</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

