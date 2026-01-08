import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Shield, Loader2, UserCog, Plus, Edit, Trash2,
  Check, X, ChevronDown, ChevronUp, MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { AdminOnly } from '@/components/PermissionGuard';
import AccessDenied from './AccessDenied';

interface User {
  id: number;
  email: string;
  name: string;
  role_id: number | null;
  role: {
    id: number;
    name: string;
    permissions: string[];
  } | null;
  created_at: string;
  last_login?: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  is_system: boolean;
  permissions: string[];
  user_count?: number;
  created_at: string;
  updated_at: string;
}

interface Permission {
  id: number;
  key: string;
  name: string;
  description: string;
  category: string;
}

interface PermissionCategory {
  name: string;
  permissions: Permission[];
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRoleId, setFilterRoleId] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [roleFormData, setRoleFormData] = useState({ name: '', description: '', permissions: [] as string[] });
  const [userFormData, setUserFormData] = useState({ name: '', email: '', roleId: '' });
  const [userPermissionsData, setUserPermissionsData] = useState<{ [key: number]: string[] }>({});
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load data in parallel for better performance
      const [usersData, rolesData, categoriesData] = await Promise.allSettled([
        api.getUsers().catch(error => {
          console.error('Failed to load users:', error);
          return [];
        }),
        api.getRoles().catch(error => {
          console.error('Failed to load roles:', error);
          return [];
        }),
        api.getPermissionCategories().catch(error => {
          console.error('Failed to load permission categories:', error);
          return [];
        })
      ]);

      // Extract values from Promise.allSettled results
      const users = usersData.status === 'fulfilled' ? usersData.value : [];
      const roles = rolesData.status === 'fulfilled' ? rolesData.value : [];
      const categories = categoriesData.status === 'fulfilled' ? categoriesData.value : [];

      setUsers(users);
      setRoles(roles);
      setPermissionCategories(categories);

      // Check predefined roles in background without blocking UI
      ensurePredefinedRoles().catch(error => {
        console.error('Failed to ensure predefined roles:', error);
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const ensurePredefinedRoles = useCallback(async () => {
    const predefinedRoles = [
      {
        name: 'Admin',
        description: 'Full system access and user management',
        permissions: ['users.create', 'users.edit', 'users.delete', 'roles.create', 'roles.edit', 'roles.delete', 'campaigns.create', 'campaigns.edit', 'campaigns.delete', 'analytics.view', 'settings.manage']
      },
      {
        name: 'Manager',
        description: 'Manage campaigns and team members',
        permissions: ['users.edit', 'campaigns.create', 'campaigns.edit', 'analytics.view', 'reports.view']
      },
      {
        name: 'Outreach Specialist',
        description: 'Handle all outreach campaigns and communications',
        permissions: ['campaigns.create', 'campaigns.edit', 'contacts.create', 'contacts.edit', 'analytics.view']
      },
      {
        name: 'Email Specialist',
        description: 'Manage email campaigns and templates',
        permissions: ['email.create', 'email.edit', 'templates.create', 'templates.edit', 'analytics.view']
      },
      {
        name: 'SMS Specialist',
        description: 'Manage SMS campaigns and messaging',
        permissions: ['sms.create', 'sms.edit', 'sms.templates.create', 'sms.templates.edit', 'sms.analytics.view']
      },
      {
        name: 'Call Specialist',
        description: 'Manage calling campaigns and scripts',
        permissions: ['calls.create', 'calls.edit', 'scripts.create', 'scripts.edit', 'calls.analytics.view']
      }
    ];

    // Get current roles to check what already exists
    const currentRoles = await api.getRoles();
    const existingRoleNames = new Set(currentRoles.map(role => role.name));

    // Only create roles that don't exist
    const rolesToCreate = predefinedRoles.filter(role => !existingRoleNames.has(role.name));

    if (rolesToCreate.length > 0) {
      // Create missing roles in parallel
      await Promise.allSettled(
        rolesToCreate.map(async (predefinedRole) => {
          try {
            await api.createRole(predefinedRole);
          } catch (error) {
            console.error(`Failed to create role ${predefinedRole.name}:`, error);
          }
        })
      );

      // Only reload roles if we created new ones
      try {
        const updatedRoles = await api.getRoles();
        setRoles(updatedRoles);
      } catch (error) {
        console.error('Failed to reload roles after creation:', error);
      }
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const roleId = filterRoleId !== 'all' ? parseInt(filterRoleId) : undefined;
      const usersData = await api.getUsers(roleId, search || undefined);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    }
  }, [filterRoleId, search, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openPermissionsDialog = (user: User) => {
    setEditingPermissionsUser(user);
    setUserPermissionsData({
      ...userPermissionsData,
      [user.id]: user.role?.permissions || []
    });
    setIsPermissionsDialogOpen(true);
  };

  const handleSaveUserPermissions = async () => {
    if (!editingPermissionsUser) return;

    try {
      setSaving(true);
      // Create a custom role for this user or update existing role
      const customRoleName = `Custom - ${editingPermissionsUser.name}`;
      const existingRole = roles.find(r => r.name === customRoleName);

      const permissions = userPermissionsData[editingPermissionsUser.id] || [];

      if (existingRole) {
        await api.updateRole(existingRole.id, { permissions });
      } else {
        const newRole = await api.createRole({
          name: customRoleName,
          description: `Custom permissions for ${editingPermissionsUser.name}`,
          permissions
        });
        await api.assignUserRole(editingPermissionsUser.id, newRole.id);
      }

      toast({ title: 'Success', description: 'User permissions updated successfully' });
      setIsPermissionsDialogOpen(false);
      loadUsers();
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to update permissions', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleUserPermission = (userId: number, permissionKey: string) => {
    setUserPermissionsData(prev => {
      const currentPermissions = prev[userId] || [];
      return {
        ...prev,
        [userId]: currentPermissions.includes(permissionKey)
          ? currentPermissions.filter(p => p !== permissionKey)
          : [...currentPermissions, permissionKey]
      };
    });
  };

  const toggleUserCategory = (userId: number, category: PermissionCategory, checked: boolean) => {
    const categoryKeys = category.permissions.map(p => p.key);
    setUserPermissionsData(prev => {
      const currentPermissions = prev[userId] || [];
      return {
        ...prev,
        [userId]: checked
          ? [...new Set([...currentPermissions, ...categoryKeys])]
          : currentPermissions.filter(p => !categoryKeys.includes(p))
      };
    });
  };

  const isUserCategoryFullySelected = (userId: number, category: PermissionCategory) => {
    const userPerms = userPermissionsData[userId] || [];
    return category.permissions.every(p => userPerms.includes(p.key));
  };

  const isUserCategoryPartiallySelected = (userId: number, category: PermissionCategory) => {
    const userPerms = userPermissionsData[userId] || [];
    const selected = category.permissions.filter(p => userPerms.includes(p.key));
    return selected.length > 0 && selected.length < category.permissions.length;
  };

  const openCreateUserDialog = () => {
    setUserFormData({ name: '', email: '', roleId: '' });
    setIsUserDialogOpen(true);
  };

  const handleCreateUser = async () => {
    if (!userFormData.name.trim() || !userFormData.email.trim()) {
      toast({ title: 'Error', description: 'Name and email are required', variant: 'destructive' });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userFormData.email)) {
      toast({ title: 'Error', description: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);

      // Create user
      const newUser = await api.createUser({
        name: userFormData.name,
        email: userFormData.email,
        role_id: userFormData.roleId && userFormData.roleId !== 'none' ? parseInt(userFormData.roleId) : null
      });

      toast({ title: 'Success', description: 'User created successfully' });
      setIsUserDialogOpen(false);
      loadData();

      // Optionally send invitation email (you'd need to implement this API endpoint)
      if (newUser.id) {
        try {
          await api.sendUserInvitation(newUser.id);
          toast({ title: 'Invitation Sent', description: 'User will receive an email invitation' });
        } catch (error) {
          console.error('Failed to send invitation:', error);
        }
      }
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to create user', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openAssignDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedRoleId(user.role_id?.toString() || '');
    setIsDialogOpen(true);
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId) return;

    try {
      setSaving(true);
      await api.assignUserRole(selectedUser.id, parseInt(selectedRoleId));
      toast({ title: 'Success', description: 'Role assigned successfully' });
      setIsDialogOpen(false);
      loadUsers();
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to assign role', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickRoleAssign = async (userId: number, roleId: string) => {
    try {
      const roleIdNum = roleId && roleId !== 'none' ? parseInt(roleId) : null;
      await api.assignUserRole(userId, roleIdNum);
      toast({
        title: 'Success',
        description: roleIdNum ? 'Role assigned successfully' : 'Role removed successfully'
      });
      loadUsers();
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to assign role', variant: 'destructive' });
    }
  };

  const openEditUserDialog = (user: User) => {
    setUserFormData({
      name: user.name,
      email: user.email,
      roleId: user.role_id?.toString() || ''
    });
    setSelectedUser(user);
    setIsUserDialogOpen(true);
  };

  const openDeleteUserDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteUserDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !userFormData.name.trim() || !userFormData.email.trim()) {
      toast({ title: 'Error', description: 'Name and email are required', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);

      await api.updateUser(String(selectedUser.id), {
        name: userFormData.name,
        email: userFormData.email,
        role_id: userFormData.roleId && userFormData.roleId !== 'none' ? parseInt(userFormData.roleId) : null
      });

      toast({ title: 'Success', description: 'User updated successfully' });
      setIsUserDialogOpen(false);
      loadUsers();
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to update user', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setSaving(true);
      await api.deleteUser(String(userToDelete.id));
      toast({ title: 'Success', description: 'User deleted successfully' });
      setIsDeleteUserDialogOpen(false);
      loadUsers();
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete user', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Role management functions
  const openCreateRoleDialog = () => {
    setEditingRole(null);
    setRoleFormData({ name: '', description: '', permissions: [] });
    setIsRoleDialogOpen(true);
  };

  const openEditRoleDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleFormData({ name: role.name, description: role.description, permissions: [...role.permissions] });
    } else {
      setEditingRole(null);
      setRoleFormData({ name: '', description: '', permissions: [] });
    }
    setIsRoleDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleFormData.name.trim()) {
      toast({ title: 'Error', description: 'Role name is required', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      if (editingRole) {
        await api.updateRole(editingRole.id, roleFormData);
        toast({ title: 'Success', description: 'Role updated successfully' });
      } else {
        await api.createRole(roleFormData);
        toast({ title: 'Success', description: 'Role created successfully' });
      }
      setIsRoleDialogOpen(false);
      loadData();
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to save role', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      await api.deleteRole(roleToDelete.id);
      toast({ title: 'Success', description: 'Role deleted successfully' });
      setIsDeleteDialogOpen(false);
      setRoleToDelete(null);
      loadData();
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete role', variant: 'destructive' });
    }
  };

  const togglePermission = (permissionKey: string) => {
    setRoleFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionKey)
        ? prev.permissions.filter(p => p !== permissionKey)
        : [...prev.permissions, permissionKey],
    }));
  };

  const toggleCategory = (category: PermissionCategory, checked: boolean) => {
    const categoryKeys = category.permissions.map(p => p.key);
    setRoleFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...new Set([...prev.permissions, ...categoryKeys])]
        : prev.permissions.filter(p => !categoryKeys.includes(p)),
    }));
  };

  const isCategoryFullySelected = (category: PermissionCategory) => {
    return category.permissions.every(p => roleFormData.permissions.includes(p.key));
  };

  const isCategoryPartiallySelected = (category: PermissionCategory) => {
    const selected = category.permissions.filter(p => roleFormData.permissions.includes(p.key));
    return selected.length > 0 && selected.length < category.permissions.length;
  };

  const getSelectedRole = () => {
    return roles.find(r => r.id.toString() === selectedRoleId);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading users and roles...</p>
      </div>
    );
  }

  return (
    <AdminOnly fallback={<AccessDenied message="Only administrators can manage users and roles" />}>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage users and their role assignments</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openCreateUserDialog}>
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
            <Button onClick={openCreateRoleDialog} variant="outline">
              <Shield className="mr-2 h-4 w-4" /> Create Role
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={filterRoleId} onValueChange={setFilterRoleId}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">User</TableHead>
                  <TableHead className="w-[180px]">Role</TableHead>
                  <TableHead className="w-[320px]">Permissions</TableHead>
                  <TableHead className="w-[120px]">Created</TableHead>
                  <TableHead className="w-[120px]">Last Login</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role_id?.toString() || 'none'}
                        onValueChange={(value) => handleQuickRoleAssign(user.id, value)}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Select role">
                            {user.role ? (
                              <div className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                <span className="truncate">{user.role.name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No Role</span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Role</SelectItem>
                          {roles.map(role => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              <div className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                <span className="truncate">{role.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {user.role ? (
                            user.role.permissions.slice(0, 3).map(perm => (
                              <Badge key={perm} variant="outline" className="text-xs px-2 py-1">
                                {perm.length > 15 ? perm.substring(0, 15) + '...' : perm}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No permissions</span>
                          )}
                        </div>
                        {user.role && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPermissionsDialog(user)}
                              className="text-xs h-6 px-2"
                            >
                              <Edit className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                            {user.role.permissions.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{user.role.permissions.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.last_login)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditUserDialog(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openAssignDialog(user)}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Manage Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteUserDialog(user)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add User Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
              <DialogDescription>
                {selectedUser ? 'Update user information and role assignment' : 'Create a new user account and assign their role'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Full Name</Label>
                <Input
                  id="userName"
                  value={userFormData.name}
                  onChange={e => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter user's full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email Address</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={userFormData.email}
                  onChange={e => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Assign Role</Label>
                <Select value={userFormData.roleId} onValueChange={(value) => setUserFormData(prev => ({ ...prev, roleId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Role</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-3 w-3" />
                          {role.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select a role to assign specific permissions. You can change this later.
                </p>
              </div>

              {userFormData.roleId && userFormData.roleId !== 'none' && (
                <div className="space-y-2">
                  <Label>Role Permissions Preview</Label>
                  <div className="rounded-md border p-3 bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-2">
                      {roles.find(r => r.id.toString() === userFormData.roleId)?.description || 'No description'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {roles.find(r => r.id.toString() === userFormData.roleId)?.permissions.slice(0, 8).map(perm => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                      {(roles.find(r => r.id.toString() === userFormData.roleId)?.permissions.length || 0) > 8 && (
                        <Badge variant="outline" className="text-xs">
                          +{(roles.find(r => r.id.toString() === userFormData.roleId)?.permissions.length || 0) - 8} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Role Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Role</DialogTitle>
              <DialogDescription>
                Assign a role to {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Role</Label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRoleId && (
                <div className="space-y-2">
                  <Label>Role Permissions Preview</Label>
                  <div className="rounded-md border p-3 bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-2">
                      {getSelectedRole()?.description || 'No description'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {getSelectedRole()?.permissions.slice(0, 10).map(perm => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                      {(getSelectedRole()?.permissions.length || 0) > 10 && (
                        <Badge variant="outline" className="text-xs">
                          +{(getSelectedRole()?.permissions.length || 0) - 10} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignRole} disabled={saving || !selectedRoleId}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create/Edit Role Dialog */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
              <DialogDescription>
                {editingRole ? 'Update role details and permissions' : 'Create a new role with specific permissions'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    value={roleFormData.name}
                    onChange={e => setRoleFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Marketing Manager"
                    disabled={editingRole?.is_system}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={roleFormData.description}
                    onChange={e => setRoleFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this role"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <p className="text-sm text-muted-foreground">
                  Select the permissions this role should have
                </p>
                <Accordion type="multiple" className="w-full">
                  {permissionCategories.map(category => (
                    <AccordionItem key={category.name} value={category.name}>
                      <div className="flex items-center gap-3 p-4">
                        <Checkbox
                          checked={isCategoryFullySelected(category)}
                          ref={el => {
                            if (el) {
                              (el as any).indeterminate = isCategoryPartiallySelected(category);
                            }
                          }}
                          onCheckedChange={() => toggleCategory(category, true)}
                        />
                        <AccordionTrigger className="hover:no-underline flex-1">
                          <span className="font-medium">{category.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {category.permissions.length} permissions
                          </span>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent>
                        <div className="grid gap-2 pl-8 pt-2">
                          {category.permissions.map(permission => (
                            <div key={permission.key} className="flex items-start gap-3">
                              <Checkbox
                                id={permission.key}
                                checked={roleFormData.permissions.includes(permission.key)}
                                onCheckedChange={() => togglePermission(permission.key)}
                              />
                              <div className="grid gap-0.5">
                                <label htmlFor={permission.key} className="text-sm font-medium cursor-pointer">
                                  {permission.name}
                                </label>
                                <p className="text-xs text-muted-foreground">{permission.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveRole} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Role Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Role</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the role "{roleToDelete?.name}"? This action cannot be undone.
                {(roleToDelete?.user_count || 0) > 0 && (
                  <span className="block mt-2 text-destructive">
                    Warning: This role is assigned to {roleToDelete?.user_count} user(s).
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete User Confirmation */}
        <AlertDialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the user "{userToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* User Permissions Dialog */}
        <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User Permissions</DialogTitle>
              <DialogDescription>
                Manage custom permissions for {editingPermissionsUser?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Permissions</Label>
                <p className="text-sm text-muted-foreground">
                  Select the permissions this user should have. This will create a custom role for the user.
                </p>
                <Accordion type="multiple" className="w-full">
                  {permissionCategories.map(category => (
                    <AccordionItem key={category.name} value={category.name}>
                      <div className="flex items-center gap-3 p-4">
                        <Checkbox
                          checked={isUserCategoryFullySelected(editingPermissionsUser?.id || 0, category)}
                          ref={el => {
                            if (el && editingPermissionsUser) {
                              (el as any).indeterminate = isUserCategoryPartiallySelected(editingPermissionsUser.id, category);
                            }
                          }}
                          onCheckedChange={checked => toggleUserCategory(editingPermissionsUser?.id || 0, category, !!checked)}
                        />
                        <AccordionTrigger className="hover:no-underline flex-1">
                          <span>{category.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {category.permissions.filter(p => userPermissionsData[editingPermissionsUser?.id || 0]?.includes(p.key)).length}/
                            {category.permissions.length}
                          </Badge>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent>
                        <div className="grid gap-2 pl-8 pt-2">
                          {category.permissions.map(permission => (
                            <div key={permission.key} className="flex items-start gap-3">
                              <Checkbox
                                id={permission.key}
                                checked={userPermissionsData[editingPermissionsUser?.id || 0]?.includes(permission.key) || false}
                                onCheckedChange={() => toggleUserPermission(editingPermissionsUser?.id || 0, permission.key)}
                              />
                              <div className="grid gap-0.5">
                                <label htmlFor={permission.key} className="text-sm font-medium cursor-pointer">
                                  {permission.name}
                                </label>
                                <p className="text-xs text-muted-foreground">{permission.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveUserPermissions} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Permissions
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminOnly>
  );
}
