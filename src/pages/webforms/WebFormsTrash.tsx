import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { webformsApi, WebForm } from '@/services/webformsApi';
import {
  Trash2,
  Search,
  RotateCcw,
  AlertTriangle,
  FileTextIcon,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function WebFormsTrash() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch trashed forms
  const { data: formsData, isLoading } = useQuery({
    queryKey: ['webforms', 'trashed', searchTerm],
    queryFn: async () => {
      const params: Record<string, string> = { status: 'trashed' };
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

  // Delete form permanently mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => webformsApi.deleteForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms'] });
      toast.success('Form permanently deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete form');
    },
  });

  // Empty trash mutation
  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      const forms = formsData?.data || [];
      await Promise.all(forms.map((form: WebForm) => webformsApi.deleteForm(form.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms'] });
      toast.success('Trash emptied successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to empty trash');
    },
  });

  const forms = formsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Trash</h1>
          <p className="text-muted-foreground">
            Forms in trash will be permanently deleted after 30 days.
          </p>
        </div>
        {forms.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Empty Trash
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Empty Trash?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {forms.length} forms in trash. This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => emptyTrashMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trashed forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Trashed Forms List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trash2 className="h-5 w-5 mr-2" />
            Trashed Forms ({forms.length})
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
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <FileTextIcon className="h-5 w-5 text-destructive" />
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
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm('Permanently delete this form? This cannot be undone.')) {
                              deleteMutation.mutate(form.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Permanently
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trash2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Trash is empty</h3>
              <p className="text-muted-foreground mt-2">
                Forms you delete will appear here.
              </p>
              <Button className="mt-6" variant="outline" asChild>
                <Link to="/webforms/forms">View Active Forms</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      {forms.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Items in trash will be permanently deleted
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Forms in trash are automatically deleted after 30 days. Restore them if you want
                  to keep them.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

