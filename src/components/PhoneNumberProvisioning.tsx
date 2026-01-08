import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Phone, Search, Plus, Trash2, CheckCircle } from 'lucide-react';
import { phoneApi } from '@/services/phoneApi';
import { useToast } from '@/components/ui/use-toast';

interface PhoneNumber {
  id: number;
  phone_number: string;
  friendly_name: string;
  provider: string;
  status: string;
  capabilities: {
    voice?: boolean;
    sms?: boolean;
    mms?: boolean;
  };
}

interface AvailableNumber {
  phone_number: string;
  friendly_name: string;
  capabilities: {
    voice?: boolean;
    sms?: boolean;
    mms?: boolean;
  };
}

export const PhoneNumberProvisioning: React.FC = () => {
  const { toast } = useToast();
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [areaCode, setAreaCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadNumbers();
  }, []);

  const loadNumbers = async () => {
    try {
      setLoading(true);
      const data = await phoneApi.list();
      setNumbers(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load phone numbers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!areaCode || areaCode.length !== 3) {
      toast({
        title: 'Invalid Area Code',
        description: 'Please enter a 3-digit area code',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSearching(true);
      const result = await phoneApi.search(areaCode);
      if (result.success) {
        setAvailableNumbers(result.numbers || []);
        if (result.numbers.length === 0) {
          toast({
            title: 'No Numbers Found',
            description: 'No available numbers found for this area code',
          });
        }
      } else {
        toast({
          title: 'Search Failed',
          description: result.error || 'Failed to search for numbers',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Search Failed',
        description: error.message || 'Failed to search for numbers',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handlePurchase = async (phoneNumber: string, friendlyName: string) => {
    try {
      setPurchasing(true);
      const result = await phoneApi.purchase(phoneNumber, friendlyName);
      toast({
        title: 'Number Purchased',
        description: `Successfully purchased ${phoneNumber}`,
      });
      setSearchDialogOpen(false);
      setAvailableNumbers([]);
      setAreaCode('');
      loadNumbers();
    } catch (error: any) {
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Failed to purchase number',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handleRelease = async (id: number, phoneNumber: string) => {
    if (!confirm(`Release ${phoneNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      await phoneApi.release(id);
      toast({
        title: 'Number Released',
        description: `${phoneNumber} has been released`,
      });
      loadNumbers();
    } catch (error: any) {
      toast({
        title: 'Release Failed',
        description: error.message || 'Failed to release number',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Phone Numbers
              </CardTitle>
              <CardDescription>
                Manage your Twilio/SignalWire phone numbers
              </CardDescription>
            </div>
            <Button onClick={() => setSearchDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Number
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : numbers.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No phone numbers yet</p>
              <Button onClick={() => setSearchDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Purchase Your First Number
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {numbers.map((number) => (
                <div
                  key={number.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{number.phone_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {number.friendly_name}
                      </div>
                      <div className="flex gap-2 mt-1">
                        {number.capabilities.voice && (
                          <Badge variant="secondary" className="text-xs">Voice</Badge>
                        )}
                        {number.capabilities.sms && (
                          <Badge variant="secondary" className="text-xs">SMS</Badge>
                        )}
                        {number.capabilities.mms && (
                          <Badge variant="secondary" className="text-xs">MMS</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={number.status === 'active' ? 'default' : 'secondary'}>
                      {number.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRelease(number.id, number.phone_number)}
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

      {/* Search Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase Phone Number</DialogTitle>
            <DialogDescription>
              Search for available phone numbers by area code
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="areaCode">Area Code</Label>
                <Input
                  id="areaCode"
                  placeholder="e.g., 415"
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  maxLength={3}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} disabled={searching}>
                  <Search className="h-4 w-4 mr-2" />
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>

            {availableNumbers.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableNumbers.map((number) => (
                  <div
                    key={number.phone_number}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{number.phone_number}</div>
                      <div className="flex gap-2 mt-1">
                        {number.capabilities.voice && (
                          <Badge variant="secondary" className="text-xs">Voice</Badge>
                        )}
                        {number.capabilities.sms && (
                          <Badge variant="secondary" className="text-xs">SMS</Badge>
                        )}
                        {number.capabilities.mms && (
                          <Badge variant="secondary" className="text-xs">MMS</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handlePurchase(number.phone_number, number.friendly_name)}
                      disabled={purchasing}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Purchase
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSearchDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhoneNumberProvisioning;
