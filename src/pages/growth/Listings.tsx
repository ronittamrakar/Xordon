import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveCompany, companyQueryKey } from '@/hooks/useActiveCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { listingsApi, BusinessListing } from '@/services';
import { Plus, Globe, MapPin, Loader2, ExternalLink, RefreshCw } from 'lucide-react';

export default function Listings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeCompanyId, hasCompany } = useActiveCompany();
  const [isAddListingOpen, setIsAddListingOpen] = useState(false);
  const [newListing, setNewListing] = useState({
    platform: 'google_business',
    listing_url: '',
    business_name: '',
    address: '',
    phone: '',
  });

  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: companyQueryKey('business-listings', activeCompanyId),
    queryFn: () => listingsApi.getListings(),
    enabled: hasCompany,
  });

  const createListingMutation = useMutation({
    mutationFn: (data: typeof newListing) => listingsApi.createListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('business-listings', activeCompanyId) });
      setIsAddListingOpen(false);
      setNewListing({ platform: 'google_business', listing_url: '', business_name: '', address: '', phone: '' });
      toast({ title: 'Listing added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add listing', variant: 'destructive' });
    },
  });

  const syncListingMutation = useMutation({
    mutationFn: (id: number) => listingsApi.syncListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('business-listings', activeCompanyId) });
      toast({ title: 'Listing synced successfully' });
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Listings</h1>
          <p className="text-muted-foreground">Manage your citation listings across directories</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={isAddListingOpen} onOpenChange={setIsAddListingOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Listing
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Business Listing</DialogTitle>
              <DialogDescription>Track a new business directory listing</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={newListing.platform} onValueChange={(v) => setNewListing({ ...newListing, platform: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google_business">Google Business Profile</SelectItem>
                    <SelectItem value="yelp">Yelp</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="bing_places">Bing Places</SelectItem>
                    <SelectItem value="apple_maps">Apple Maps</SelectItem>
                    <SelectItem value="tripadvisor">TripAdvisor</SelectItem>
                    <SelectItem value="yellowpages">Yellow Pages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  value={newListing.business_name}
                  onChange={(e) => setNewListing({ ...newListing, business_name: e.target.value })}
                  placeholder="Your Business Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Listing URL</Label>
                <Input
                  value={newListing.listing_url}
                  onChange={(e) => setNewListing({ ...newListing, listing_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={newListing.address}
                  onChange={(e) => setNewListing({ ...newListing, address: e.target.value })}
                  placeholder="123 Main St, City, State"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newListing.phone}
                  onChange={(e) => setNewListing({ ...newListing, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddListingOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createListingMutation.mutate(newListing)}
                disabled={!newListing.business_name || createListingMutation.isPending}
              >
                {createListingMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Listing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {listingsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : listings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center space-y-2">
            <p className="text-muted-foreground">No listings yet. Add your first business listing!</p>
            <p className="text-sm text-muted-foreground">Track your business presence across directories like Google Business Profile, Yelp, and more.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {listings.map((listing: BusinessListing) => (
            <Card key={listing.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Globe className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{listing.business_name || listing.directory_name}</h4>
                      <p className="text-sm text-muted-foreground capitalize">{listing.directory_name}</p>
                      {listing.address && (
                        <p className="text-sm text-muted-foreground">{listing.address}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {listing.accuracy_score !== null && (
                      <div className="text-right">
                        <p className="text-sm font-medium">Accuracy</p>
                        <Progress value={listing.accuracy_score} className="w-20 h-2" />
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncListingMutation.mutate(listing.id)}
                      disabled={syncListingMutation.isPending}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    {listing.listing_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={listing.listing_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
