import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import omniChannelApi from '@/services/omniChannelApi';

const OmniChannelIntegrations: React.FC = () => {
  const queryClient = useQueryClient();
  const [isConnectFacebookOpen, setIsConnectFacebookOpen] = useState(false);
  const [isConnectInstagramOpen, setIsConnectInstagramOpen] = useState(false);
  const [isConnectGMBOpen, setIsConnectGMBOpen] = useState(false);

  const [facebookData, setFacebookData] = useState({
    page_id: '',
    page_name: '',
    page_access_token: '',
  });

  const [instagramData, setInstagramData] = useState({
    instagram_id: '',
    username: '',
    access_token: '',
  });

  const [gmbData, setGMBData] = useState({
    location_id: '',
    location_name: '',
    access_token: '',
    refresh_token: '',
  });

  const { data: facebookPages = [] } = useQuery({
    queryKey: ['facebook-pages'],
    queryFn: omniChannelApi.listFacebookPages,
  });

  const { data: instagramAccounts = [] } = useQuery({
    queryKey: ['instagram-accounts'],
    queryFn: omniChannelApi.listInstagramAccounts,
  });

  const { data: gmbLocations = [] } = useQuery({
    queryKey: ['gmb-locations'],
    queryFn: omniChannelApi.listGMBLocations,
  });

  const connectFacebookMutation = useMutation({
    mutationFn: omniChannelApi.connectFacebookPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook-pages'] });
      setIsConnectFacebookOpen(false);
      setFacebookData({ page_id: '', page_name: '', page_access_token: '' });
      toast.success('Facebook page connected');
    },
  });

  const disconnectFacebookMutation = useMutation({
    mutationFn: omniChannelApi.disconnectFacebookPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook-pages'] });
      toast.success('Facebook page disconnected');
    },
  });

  const connectInstagramMutation = useMutation({
    mutationFn: omniChannelApi.connectInstagram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram-accounts'] });
      setIsConnectInstagramOpen(false);
      setInstagramData({ instagram_id: '', username: '', access_token: '' });
      toast.success('Instagram account connected');
    },
  });

  const connectGMBMutation = useMutation({
    mutationFn: omniChannelApi.connectGMB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmb-locations'] });
      setIsConnectGMBOpen(false);
      setGMBData({ location_id: '', location_name: '', access_token: '', refresh_token: '' });
      toast.success('GMB location connected');
    },
  });

  const handleConnectFacebook = () => {
    if (!facebookData.page_id || !facebookData.page_name || !facebookData.page_access_token) {
      toast.error('Please fill all required fields');
      return;
    }
    connectFacebookMutation.mutate(facebookData);
  };

  const handleConnectInstagram = () => {
    if (!instagramData.instagram_id || !instagramData.username || !instagramData.access_token) {
      toast.error('Please fill all required fields');
      return;
    }
    connectInstagramMutation.mutate(instagramData);
  };

  const handleConnectGMB = () => {
    if (!gmbData.location_id || !gmbData.location_name || !gmbData.access_token || !gmbData.refresh_token) {
      toast.error('Please fill all required fields');
      return;
    }
    connectGMBMutation.mutate(gmbData);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight">Omni-Channel Integrations</h1>
          <p className="text-muted-foreground">Connect messaging channels for unified inbox</p>
        </div>
      </div>

      <Tabs defaultValue="facebook">
        <TabsList>
          <TabsTrigger value="facebook">Facebook Messenger</TabsTrigger>
          <TabsTrigger value="instagram">Instagram DM</TabsTrigger>
          <TabsTrigger value="gmb">Google My Business</TabsTrigger>
        </TabsList>

        <TabsContent value="facebook" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Facebook Messenger</CardTitle>
                  <CardDescription>Connect Facebook pages to receive messages</CardDescription>
                </div>
                <Button onClick={() => setIsConnectFacebookOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Page
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {facebookPages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No Facebook pages connected
                </div>
              ) : (
                <div className="space-y-3">
                  {facebookPages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{page.page_name}</p>
                        <p className="text-sm text-muted-foreground">Page ID: {page.page_id}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={page.is_active ? 'default' : 'secondary'}>
                          {page.is_active ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                          {page.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => disconnectFacebookMutation.mutate(page.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instagram" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Instagram Direct Messages</CardTitle>
                  <CardDescription>Connect Instagram business accounts</CardDescription>
                </div>
                <Button onClick={() => setIsConnectInstagramOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Account
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {instagramAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No Instagram accounts connected
                </div>
              ) : (
                <div className="space-y-3">
                  {instagramAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">@{account.username}</p>
                        <p className="text-sm text-muted-foreground">ID: {account.instagram_id}</p>
                      </div>
                      <Badge variant={account.is_active ? 'default' : 'secondary'}>
                        {account.is_active ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {account.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gmb" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Google My Business</CardTitle>
                  <CardDescription>Connect GMB locations for messaging</CardDescription>
                </div>
                <Button onClick={() => setIsConnectGMBOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Location
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {gmbLocations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No GMB locations connected
                </div>
              ) : (
                <div className="space-y-3">
                  {gmbLocations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{location.location_name}</p>
                        <p className="text-sm text-muted-foreground">ID: {location.location_id}</p>
                      </div>
                      <Badge variant={location.is_active ? 'default' : 'secondary'}>
                        {location.is_active ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {location.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connect Facebook Dialog */}
      <Dialog open={isConnectFacebookOpen} onOpenChange={setIsConnectFacebookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Facebook Page</DialogTitle>
            <DialogDescription>Enter your Facebook page details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Page ID *</Label>
              <Input
                value={facebookData.page_id}
                onChange={(e) => setFacebookData({ ...facebookData, page_id: e.target.value })}
                placeholder="123456789"
              />
            </div>
            <div className="space-y-2">
              <Label>Page Name *</Label>
              <Input
                value={facebookData.page_name}
                onChange={(e) => setFacebookData({ ...facebookData, page_name: e.target.value })}
                placeholder="My Business Page"
              />
            </div>
            <div className="space-y-2">
              <Label>Page Access Token *</Label>
              <Input
                value={facebookData.page_access_token}
                onChange={(e) => setFacebookData({ ...facebookData, page_access_token: e.target.value })}
                placeholder="EAAxxxxxxxxxx"
                type="password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConnectFacebookOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnectFacebook} disabled={connectFacebookMutation.isPending}>
              Connect Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connect Instagram Dialog */}
      <Dialog open={isConnectInstagramOpen} onOpenChange={setIsConnectInstagramOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Instagram Account</DialogTitle>
            <DialogDescription>Enter your Instagram business account details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Instagram ID *</Label>
              <Input
                value={instagramData.instagram_id}
                onChange={(e) => setInstagramData({ ...instagramData, instagram_id: e.target.value })}
                placeholder="123456789"
              />
            </div>
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                value={instagramData.username}
                onChange={(e) => setInstagramData({ ...instagramData, username: e.target.value })}
                placeholder="mybusiness"
              />
            </div>
            <div className="space-y-2">
              <Label>Access Token *</Label>
              <Input
                value={instagramData.access_token}
                onChange={(e) => setInstagramData({ ...instagramData, access_token: e.target.value })}
                placeholder="IGxxxxxxxxxx"
                type="password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConnectInstagramOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnectInstagram} disabled={connectInstagramMutation.isPending}>
              Connect Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connect GMB Dialog */}
      <Dialog open={isConnectGMBOpen} onOpenChange={setIsConnectGMBOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect GMB Location</DialogTitle>
            <DialogDescription>Enter your Google My Business location details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Location ID *</Label>
              <Input
                value={gmbData.location_id}
                onChange={(e) => setGMBData({ ...gmbData, location_id: e.target.value })}
                placeholder="accounts/123/locations/456"
              />
            </div>
            <div className="space-y-2">
              <Label>Location Name *</Label>
              <Input
                value={gmbData.location_name}
                onChange={(e) => setGMBData({ ...gmbData, location_name: e.target.value })}
                placeholder="My Business Location"
              />
            </div>
            <div className="space-y-2">
              <Label>Access Token *</Label>
              <Input
                value={gmbData.access_token}
                onChange={(e) => setGMBData({ ...gmbData, access_token: e.target.value })}
                placeholder="ya29.xxxxxxxxxx"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label>Refresh Token *</Label>
              <Input
                value={gmbData.refresh_token}
                onChange={(e) => setGMBData({ ...gmbData, refresh_token: e.target.value })}
                placeholder="1//xxxxxxxxxx"
                type="password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConnectGMBOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnectGMB} disabled={connectGMBMutation.isPending}>
              Connect Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OmniChannelIntegrations;
