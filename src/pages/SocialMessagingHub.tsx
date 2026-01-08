import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
    MessageSquare, Instagram, Facebook, Send, RefreshCw,
    Plus, Settings, Check, X, Loader2
} from 'lucide-react';
import instagramApi, { InstagramAccount } from '@/services/instagramApi';
import api from '@/lib/api';

interface FacebookPage {
    id: number;
    page_id: string;
    page_name: string;
    page_access_token: string;
    is_active: boolean;
}

export default function SocialMessagingHub() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('instagram');
    const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
    const [showConnectDialog, setShowConnectDialog] = useState(false);
    const [messageText, setMessageText] = useState('');

    // Instagram Queries
    const { data: instagramAccounts = [], isLoading: instagramLoading } = useQuery({
        queryKey: ['instagram-accounts'],
        queryFn: instagramApi.listAccounts,
    });

    const { data: instagramConversations = [], isLoading: conversationsLoading } = useQuery({
        queryKey: ['instagram-conversations', selectedAccount],
        queryFn: () => selectedAccount ? instagramApi.getConversations(selectedAccount) : Promise.resolve([]),
        enabled: !!selectedAccount,
    });

    // Facebook Queries
    const { data: facebookPages = [], isLoading: facebookLoading } = useQuery({
        queryKey: ['facebook-pages'],
        queryFn: async () => {
            const res = await api.get<FacebookPage[]>('/omnichannel/facebook/pages');
            return res.data;
        },
    });

    // Mutations
    const disconnectInstagramMutation = useMutation({
        mutationFn: instagramApi.disconnectAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['instagram-accounts'] });
            toast({ title: 'Success', description: 'Instagram account disconnected' });
            setSelectedAccount(null);
        },
    });

    const sendInstagramMessageMutation = useMutation({
        mutationFn: instagramApi.sendMessage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['instagram-conversations'] });
            setMessageText('');
            toast({ title: 'Success', description: 'Message sent successfully' });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to send message',
                variant: 'destructive'
            });
        },
    });

    const disconnectFacebookMutation = useMutation({
        mutationFn: async (pageId: number) => {
            await api.delete(`/omnichannel/facebook/pages/${pageId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facebook-pages'] });
            toast({ title: 'Success', description: 'Facebook page disconnected' });
        },
    });

    const handleConnectInstagram = () => {
        // In production, this would open Instagram OAuth flow
        toast({
            title: 'Instagram OAuth',
            description: 'Please configure Instagram OAuth credentials in settings',
        });
        setShowConnectDialog(false);
    };

    const handleConnectFacebook = () => {
        // In production, this would open Facebook OAuth flow
        toast({
            title: 'Facebook OAuth',
            description: 'Please configure Facebook OAuth credentials in settings',
        });
        setShowConnectDialog(false);
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Social Messaging Hub</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage Instagram DMs and Facebook Messenger conversations
                    </p>
                </div>
                <Button onClick={() => setShowConnectDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Account
                </Button>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="instagram">
                        <Instagram className="h-4 w-4 mr-2" />
                        Instagram DM
                    </TabsTrigger>
                    <TabsTrigger value="facebook">
                        <Facebook className="h-4 w-4 mr-2" />
                        Facebook Messenger
                    </TabsTrigger>
                </TabsList>

                {/* Instagram Tab */}
                <TabsContent value="instagram" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Accounts List */}
                        <Card className="md:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-lg">Connected Accounts</CardTitle>
                                <CardDescription>
                                    {instagramAccounts.length} account(s) connected
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {instagramLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : instagramAccounts.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Instagram className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No accounts connected</p>
                                    </div>
                                ) : (
                                    instagramAccounts.map((account) => (
                                        <Card
                                            key={account.id}
                                            className={`cursor-pointer transition-colors ${selectedAccount === account.id ? 'border-primary' : ''
                                                }`}
                                            onClick={() => setSelectedAccount(account.id)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {account.profile_picture_url ? (
                                                        <img
                                                            src={account.profile_picture_url}
                                                            alt={account.username}
                                                            className="h-10 w-10 rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                                            {account.username.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold truncate">@{account.username}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {account.followers_count.toLocaleString()} followers
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            disconnectInstagramMutation.mutate(account.id);
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Conversations */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Conversations</CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => queryClient.invalidateQueries({ queryKey: ['instagram-conversations'] })}
                                        disabled={!selectedAccount}
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {!selectedAccount ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>Select an account to view conversations</p>
                                    </div>
                                ) : conversationsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : instagramConversations.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>No conversations yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {instagramConversations.map((conversation) => (
                                            <Card key={conversation.id}>
                                                <CardContent className="p-4">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-semibold">
                                                                {conversation.participants
                                                                    .map(p => p.username || p.name || p.id)
                                                                    .join(', ')}
                                                            </p>
                                                            <Badge variant="outline">
                                                                {conversation.messages?.length || 0} messages
                                                            </Badge>
                                                        </div>
                                                        {conversation.messages && conversation.messages.length > 0 && (
                                                            <div className="bg-muted p-3 rounded-lg">
                                                                <p className="text-sm">
                                                                    {conversation.messages[conversation.messages.length - 1].message}
                                                                </p>
                                                            </div>
                                                        )}
                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder="Type a message..."
                                                                value={messageText}
                                                                onChange={(e) => setMessageText(e.target.value)}
                                                                onKeyPress={(e) => {
                                                                    if (e.key === 'Enter' && messageText.trim()) {
                                                                        sendInstagramMessageMutation.mutate({
                                                                            account_id: selectedAccount!,
                                                                            recipient_id: conversation.participants[0].id,
                                                                            message: messageText,
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                            <Button
                                                                onClick={() => {
                                                                    if (messageText.trim()) {
                                                                        sendInstagramMessageMutation.mutate({
                                                                            account_id: selectedAccount!,
                                                                            recipient_id: conversation.participants[0].id,
                                                                            message: messageText,
                                                                        });
                                                                    }
                                                                }}
                                                                disabled={!messageText.trim() || sendInstagramMessageMutation.isPending}
                                                            >
                                                                <Send className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Facebook Tab */}
                <TabsContent value="facebook" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Connected Facebook Pages</CardTitle>
                            <CardDescription>
                                {facebookPages.length} page(s) connected
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {facebookLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : facebookPages.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Facebook className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No Facebook pages connected</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {facebookPages.map((page) => (
                                        <Card key={page.id}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                                            <Facebook className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold">{page.page_name}</p>
                                                            <Badge variant={page.is_active ? 'default' : 'secondary'} className="mt-1">
                                                                {page.is_active ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => disconnectFacebookMutation.mutate(page.id)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Connect Account Dialog */}
            <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Connect Social Account</DialogTitle>
                        <DialogDescription>
                            Choose a platform to connect for messaging
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Button
                            variant="outline"
                            className="justify-start h-auto p-4"
                            onClick={handleConnectInstagram}
                        >
                            <Instagram className="h-8 w-8 mr-4 text-pink-500" />
                            <div className="text-left">
                                <p className="font-semibold">Instagram Business</p>
                                <p className="text-sm text-muted-foreground">Connect your Instagram business account</p>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start h-auto p-4"
                            onClick={handleConnectFacebook}
                        >
                            <Facebook className="h-8 w-8 mr-4 text-blue-500" />
                            <div className="text-left">
                                <p className="font-semibold">Facebook Page</p>
                                <p className="text-sm text-muted-foreground">Connect your Facebook business page</p>
                            </div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
