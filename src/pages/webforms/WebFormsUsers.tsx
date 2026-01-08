import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { webformsApi, WebFormsUser } from '@/services/webformsApi';
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Mail,
  Shield,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

export default function WebFormsUsers() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');

  // Fetch users
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['webforms', 'users'],
    queryFn: () => webformsApi.getUsers(),
  });

  // Invite user mutation
  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) => webformsApi.inviteUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms', 'users'] });
      toast.success('Invitation sent successfully');
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('editor');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send invitation');
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      webformsApi.updateUser(id, { role: role as WebFormsUser['role'] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms', 'users'] });
      toast.success('User role updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user role');
    },
  });

  // Remove user mutation
  const removeMutation = useMutation({
    mutationFn: (id: number) => webformsApi.removeUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms', 'users'] });
      toast.success('User removed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove user');
    },
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const users = usersData?.data || [];
  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: WebFormsUser['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
    }
  };

  const getRoleBadge = (role: WebFormsUser['role']) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-700">Admin</Badge>;
      case 'editor':
        return <Badge className="bg-blue-100 text-blue-700">Editor</Badge>;
      case 'viewer':
        return <Badge className="bg-gray-100 text-gray-700">Viewer</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Team Members</h1>
          <p className="text-muted-foreground">
            Manage who has access to your Webforms workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/settings/team">
              <ExternalLink className="h-4 w-4 mr-2" />
              Global Team Settings
            </Link>
          </Button>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to collaborate on your Webforms workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(v: 'editor' | 'viewer') => setInviteRole(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">
                        <div className="flex flex-col">
                          <span>Editor</span>
                          <span className="text-xs text-muted-foreground">Can create and edit forms</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="viewer">
                        <div className="flex flex-col">
                          <span>Viewer</span>
                          <span className="text-xs text-muted-foreground">Can only view forms and submissions</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Team Members ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            People who have access to this Webforms workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {user.first_name?.[0] || user.email[0].toUpperCase()}
                            {user.last_name?.[0] || ''}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : user.email}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => updateRoleMutation.mutate({ id: user.id, role: 'admin' })}
                            disabled={user.role === 'admin'}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateRoleMutation.mutate({ id: user.id, role: 'editor' })}
                            disabled={user.role === 'editor'}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Make Editor
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateRoleMutation.mutate({ id: user.id, role: 'viewer' })}
                            disabled={user.role === 'viewer'}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Make Viewer
                          </DropdownMenuItem>
                          {user.status === 'pending' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Resend Invitation
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm(`Remove ${user.email} from this workspace?`)) {
                                removeMutation.mutate(user.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No team members found</h3>
              <p className="text-muted-foreground mt-2">
                {searchTerm
                  ? 'Try a different search term'
                  : 'Invite team members to collaborate on forms'}
              </p>
              {!searchTerm && (
                <Button className="mt-6" onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">
                Team members are shared across your workspace
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Users added here will have access to Webforms based on their role.
                For global team management across all modules, visit{' '}
                <Link to="/settings/team" className="underline">
                  Global Team Settings
                </Link>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
