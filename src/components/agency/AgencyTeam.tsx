import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
    Users, UserPlus, MoreVertical, Mail, Shield, Crown,
    RefreshCw, Trash2, Clock, CheckCircle, Send
} from 'lucide-react';

interface TeamMember {
    id: number;
    user_id: number;
    role: 'owner' | 'admin' | 'member';
    status: 'active' | 'invited' | 'suspended';
    name: string;
    email: string;
    last_login?: string;
    invited_at?: string;
    joined_at?: string;
    invited_by_name?: string;
}

interface AgencyTeamProps {
    agencyId: number;
    userRole?: string;
}

const roleLabels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member'
};

const roleColors: Record<string, string> = {
    owner: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    admin: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    member: 'bg-gray-500/10 text-gray-600 border-gray-500/20'
};

const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-600',
    invited: 'bg-yellow-500/10 text-yellow-600',
    suspended: 'bg-red-500/10 text-red-600'
};

export default function AgencyTeam({ agencyId, userRole }: AgencyTeamProps) {
    const { toast } = useToast();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');

    const isOwner = userRole === 'owner';
    const isAdmin = userRole === 'owner' || userRole === 'admin';

    useEffect(() => {
        loadTeam();
    }, [agencyId]);

    async function loadTeam() {
        try {
            setLoading(true);
            const res = await fetch(`/api/mt/agencies/${agencyId}/team`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            const data = await res.json();
            setMembers(data.items || []);
        } catch (err) {
            console.error('Failed to load team:', err);
        } finally {
            setLoading(false);
        }
    }

    async function inviteMember() {
        if (!inviteEmail.trim()) return;
        try {
            setInviting(true);
            const res = await fetch(`/api/mt/agencies/${agencyId}/team/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            });
            const data = await res.json();
            if (res.ok) {
                toast({ title: 'Invitation sent', description: `Invited ${inviteEmail}` });
                setInviteDialogOpen(false);
                setInviteEmail('');
                loadTeam();
            } else {
                toast({ title: 'Error', description: data.error, variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to send invitation', variant: 'destructive' });
        } finally {
            setInviting(false);
        }
    }

    async function changeRole(memberId: number, newRole: string) {
        try {
            const res = await fetch(`/api/mt/agencies/${agencyId}/team/${memberId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                toast({ title: 'Role updated' });
                loadTeam();
            } else {
                const data = await res.json();
                toast({ title: 'Error', description: data.error, variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
        }
    }

    async function removeMember(memberId: number, email: string) {
        if (!confirm(`Remove ${email} from the agency?`)) return;
        try {
            const res = await fetch(`/api/mt/agencies/${agencyId}/team/${memberId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            if (res.ok) {
                toast({ title: 'Member removed' });
                loadTeam();
            } else {
                const data = await res.json();
                toast({ title: 'Error', description: data.error, variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to remove member', variant: 'destructive' });
        }
    }

    async function resendInvite(memberId: number) {
        try {
            const res = await fetch(`/api/mt/agencies/${agencyId}/team/${memberId}/resend`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            if (res.ok) {
                toast({ title: 'Invitation resent' });
            } else {
                toast({ title: 'Error', description: 'Failed to resend', variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: 'Error', variant: 'destructive' });
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const activeMembers = members.filter(m => m.status === 'active');
    const pendingInvites = members.filter(m => m.status === 'invited');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Team Members</h3>
                    <p className="text-sm text-muted-foreground">
                        {activeMembers.length} active member{activeMembers.length !== 1 ? 's' : ''}
                        {pendingInvites.length > 0 && `, ${pendingInvites.length} pending`}
                    </p>
                </div>
                {isAdmin && (
                    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <UserPlus className="w-4 h-4" />
                                Invite Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Invite Team Member</DialogTitle>
                                <DialogDescription>
                                    Invite someone to join your agency team
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="colleague@company.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={inviteRole} onValueChange={(v: 'admin' | 'member') => setInviteRole(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="w-4 h-4" />
                                                    Admin - Can manage team and settings
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="member">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4" />
                                                    Member - Can view and access sub-accounts
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
                                <Button onClick={inviteMember} disabled={inviting || !inviteEmail.trim()}>
                                    {inviting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                    Send Invitation
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Member List */}
            <div className="space-y-2">
                {members.map((member) => (
                    <Card key={member.id} className="hover:bg-muted/30 transition-colors">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        {member.role === 'owner' ? (
                                            <Crown className="w-5 h-5 text-amber-500" />
                                        ) : (
                                            <span className="text-sm font-semibold text-primary">
                                                {(member.name || member.email).charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{member.name || 'Invited User'}</span>
                                            <Badge variant="outline" className={roleColors[member.role]}>
                                                {roleLabels[member.role]}
                                            </Badge>
                                            {member.status !== 'active' && (
                                                <Badge className={statusColors[member.status]}>
                                                    {member.status === 'invited' ? 'Pending' : member.status}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {member.email}
                                            </span>
                                            {member.status === 'active' && member.last_login && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Last login: {new Date(member.last_login).toLocaleDateString()}
                                                </span>
                                            )}
                                            {member.status === 'invited' && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Invited {member.invited_at ? new Date(member.invited_at).toLocaleDateString() : 'recently'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                {member.role !== 'owner' && isAdmin && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {member.status === 'invited' && (
                                                <>
                                                    <DropdownMenuItem onClick={() => resendInvite(member.id)}>
                                                        <Send className="w-4 h-4 mr-2" />
                                                        Resend Invitation
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                </>
                                            )}
                                            {isOwner && member.role !== 'admin' && (
                                                <DropdownMenuItem onClick={() => changeRole(member.id, 'admin')}>
                                                    <Shield className="w-4 h-4 mr-2" />
                                                    Make Admin
                                                </DropdownMenuItem>
                                            )}
                                            {isOwner && member.role === 'admin' && (
                                                <DropdownMenuItem onClick={() => changeRole(member.id, 'member')}>
                                                    <Users className="w-4 h-4 mr-2" />
                                                    Demote to Member
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => removeMember(member.id, member.email)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Remove
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {members.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="font-semibold mb-2">No team members yet</h3>
                            <p className="text-muted-foreground mb-4">Invite colleagues to collaborate on your agency</p>
                            {isAdmin && (
                                <Button onClick={() => setInviteDialogOpen(true)}>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Invite First Member
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Permission Legend */}
            <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Role Permissions</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                    <div className="flex items-start gap-2">
                        <Badge variant="outline" className={roleColors.owner}>Owner</Badge>
                        <span className="text-muted-foreground">Full control over agency, billing, and all members</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <Badge variant="outline" className={roleColors.admin}>Admin</Badge>
                        <span className="text-muted-foreground">Manage team members, settings, and all sub-accounts</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <Badge variant="outline" className={roleColors.member}>Member</Badge>
                        <span className="text-muted-foreground">View access to sub-accounts, can perform assigned tasks</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
