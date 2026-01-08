import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Users, Save, Shield, MessageSquare, Plus, Trash2, Folder, Settings, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

export default function CommunitiesSettings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newCommunity, setNewCommunity] = useState({ name: '', description: '', is_private: false });

    // For handling group creation
    const [createGroupDialogState, setCreateGroupDialogState] = useState<{ open: boolean; communityId: string | null }>({ open: false, communityId: null });
    const [newGroup, setNewGroup] = useState({ name: '', description: '', is_private: false });

    // Mock global settings
    // Module Settings
    const { data: settingsData, isLoading: isLoadingSettings } = useQuery<any>({
        queryKey: ['module-settings', 'communities'],
        queryFn: () => api.modules.getSettings('communities')
    });

    const [localSettings, setLocalSettings] = useState({
        defaultPrivacy: 'private',
        allowMemberInvites: false,
        requirePostApproval: false,
        enableDirectMessaging: true,
        showMemberDirectory: true
    });

    useEffect(() => {
        if (settingsData) {
            setLocalSettings(prev => ({ ...prev, ...settingsData }));
        }
    }, [settingsData]);

    // --- Queries ---
    const { data: communities, isLoading: isLoadingCommunities } = useQuery<any[]>({
        queryKey: ['communities'],
        queryFn: api.communities.getAll
    });

    // --- Mutations ---
    const createCommunityMutation = useMutation<any, Error, any>({
        mutationFn: (data: any) => api.communities.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            setIsCreateDialogOpen(false);
            setNewCommunity({ name: '', description: '', is_private: false });
            toast({ title: 'Community Created', description: 'New community has been added.' });
        },
        onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' })
    });

    const createGroupMutation = useMutation<any, Error, any>({
        mutationFn: (data: any) => api.communities.createGroup(createGroupDialogState.communityId!, data),
        onSuccess: () => {
            // We need to invalidate groups for the specific community. 
            // Since we fetch groups inside the CommunityItem component, we can invalidate 'community-groups' query key.
            queryClient.invalidateQueries({ queryKey: ['community-groups', createGroupDialogState.communityId] });
            // Also refresh communities list to update group counts if applicable (though currently we fetch groups separately)
            queryClient.invalidateQueries({ queryKey: ['communities'] });

            setCreateGroupDialogState({ open: false, communityId: null });
            setNewGroup({ name: '', description: '', is_private: false });
            toast({ title: 'Group Created', description: 'New group has been added to the community.' });
        },
        onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' })
    });

    const deleteCommunityMutation = useMutation<any, Error, any>({
        mutationFn: api.communities.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            toast({ title: 'Community Deleted', description: 'Community has been removed.' });
        }
    });

    const saveSettingsMutation = useMutation<any, Error, any>({
        mutationFn: (data: any) => api.modules.updateSettings('communities', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['module-settings', 'communities'] });
            toast({ title: 'Settings Saved', description: 'Global community settings updated.' });
        },
        onError: () => toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' })
    });

    const handleSaveSettings = () => {
        saveSettingsMutation.mutate(localSettings);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Communities</h2>
                    <p className="text-sm text-muted-foreground">Manage communities, groups, and global preferences</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Community
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Community</DialogTitle>
                                <DialogDescription>Create a space for your members to connect.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Community Name</Label>
                                    <Input
                                        value={newCommunity.name}
                                        onChange={e => setNewCommunity(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Premium Members"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input
                                        value={newCommunity.description}
                                        onChange={e => setNewCommunity(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Brief description of this community"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Private Community</Label>
                                    <Switch
                                        checked={newCommunity.is_private}
                                        onCheckedChange={v => setNewCommunity(prev => ({ ...prev, is_private: v }))}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                <Button onClick={() => createCommunityMutation.mutate(newCommunity)} disabled={createCommunityMutation.isPending}>
                                    {createCommunityMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline" onClick={handleSaveSettings}>
                        <Save className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Communities List */}
            <div className="space-y-4">
                {isLoadingCommunities ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : communities?.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                            <Users className="h-10 w-10 mb-4 opacity-20" />
                            <p>No communities found</p>
                            <p className="text-sm">Create your first community to get started</p>
                        </CardContent>
                    </Card>
                ) : (
                    communities?.map((community: any) => (
                        <CommunityItem
                            key={community.id}
                            community={community}
                            onDelete={() => deleteCommunityMutation.mutate(community.id)}
                            onAddGroup={() => setCreateGroupDialogState({ open: true, communityId: community.id })}
                        />
                    ))
                )}
            </div>

            {/* Group Creation Dialog (Global handler for the mapped items) */}
            <Dialog open={createGroupDialogState.open} onOpenChange={open => !open && setCreateGroupDialogState(prev => ({ ...prev, open: false }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Group</DialogTitle>
                        <DialogDescription>Add a new discussion group to the community.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Group Name</Label>
                            <Input
                                value={newGroup.name}
                                onChange={e => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. General Discussion"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={newGroup.description}
                                onChange={e => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Topic of this group"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Private Group</Label>
                            <Switch
                                checked={newGroup.is_private}
                                onCheckedChange={v => setNewGroup(prev => ({ ...prev, is_private: v }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateGroupDialogState(prev => ({ ...prev, open: false }))}>Cancel</Button>
                        <Button onClick={() => createGroupMutation.mutate(newGroup)} disabled={createGroupMutation.isPending}>
                            {createGroupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Group
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Separator className="my-8" />

            {/* Global Settings */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-500" />
                            Global Privacy
                        </CardTitle>
                        <CardDescription>Default settings for new communities</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Default Visibility</Label>
                            <Select
                                value={localSettings.defaultPrivacy}
                                onValueChange={v => setLocalSettings(prev => ({ ...prev, defaultPrivacy: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">Public</SelectItem>
                                    <SelectItem value="private">Private</SelectItem>
                                    <SelectItem value="hidden">Hidden</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Member Directory</Label>
                                <p className="text-xs text-muted-foreground">Show members list by default</p>
                            </div>
                            <Switch
                                checked={localSettings.showMemberDirectory}
                                onCheckedChange={v => setLocalSettings(prev => ({ ...prev, showMemberDirectory: v }))}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-green-500" />
                            Engagement
                        </CardTitle>
                        <CardDescription>Interaction defaults</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Post Approval</Label>
                                <p className="text-xs text-muted-foreground">Require approval by default</p>
                            </div>
                            <Switch
                                checked={localSettings.requirePostApproval}
                                onCheckedChange={v => setLocalSettings(prev => ({ ...prev, requirePostApproval: v }))}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Direct Messaging</Label>
                                <p className="text-xs text-muted-foreground">Enable DM between members</p>
                            </div>
                            <Switch
                                checked={localSettings.enableDirectMessaging}
                                onCheckedChange={v => setLocalSettings(prev => ({ ...prev, enableDirectMessaging: v }))}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function CommunityItem({ community, onDelete, onAddGroup }: { community: any, onDelete: () => void, onAddGroup: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: groups, isLoading } = useQuery<any[]>({
        queryKey: ['community-groups', community.id],
        queryFn: () => api.communities.getGroups(community.id),
        enabled: isOpen // Only fetch when expanded
    });

    const deleteGroupMutation = useMutation<any, Error, any>({
        mutationFn: api.communities.deleteGroup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-groups', community.id] });
            queryClient.invalidateQueries({ queryKey: ['communities'] });
        }
    });

    return (
        <Card>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                        </CollapsibleTrigger>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{community.name}</h3>
                                {community.is_private === 1 && <Badge variant="secondary" className="text-[10px]">Private</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{community.description || 'No description'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-muted-foreground">
                            {community.group_count || 0} Groups
                        </Badge>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={onDelete}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <CollapsibleContent>
                    <div className="px-6 pb-6 pt-0 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-muted-foreground">Groups</h4>
                            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onAddGroup}>
                                <Plus className="h-3 w-3 mr-1" /> Add Group
                            </Button>
                        </div>

                        <div className="space-y-2 pl-4 border-l-2 border-muted ml-2">
                            {isLoading ? (
                                <div className="text-sm text-muted-foreground py-2">Loading groups...</div>
                            ) : groups && groups.length > 0 ? (
                                groups.map((group: any) => (
                                    <div key={group.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <Folder className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm font-medium">{group.name}</span>
                                            {group.is_private === 1 && <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">Private</Badge>}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                            onClick={() => deleteGroupMutation.mutate(group.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-muted-foreground py-2 italic">No groups yet.</div>
                            )}
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
