import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Wallet, CreditCard, History, Gift, Plus, CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { getWallet, getTransactions, getCreditPackages, createCheckout, validatePromoCode, Wallet as WalletType, CreditTransaction, CreditPackage } from '@/services/leadMarketplaceApi';
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav';

const transactionTypeColors: Record<string, string> = {
  purchase: 'text-green-600',
  charge: 'text-red-600',
  refund: 'text-blue-600',
  adjustment: 'text-purple-600',
  bonus: 'text-emerald-600',
  promo: 'text-orange-600',
};

const transactionTypeIcons: Record<string, any> = {
  purchase: ArrowUpRight,
  charge: ArrowDownRight,
  refund: ArrowUpRight,
  adjustment: RefreshCw,
  bonus: Gift,
  promo: Gift,
};

export default function MarketplaceWallet() {
  const [searchParams] = useSearchParams();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [promoDetails, setPromoDetails] = useState<{ discount_type?: string; discount_value?: number } | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const paypal = searchParams.get('paypal');
    const sessionId = searchParams.get('session_id');
    const stripeFlag = searchParams.get('stripe');

    if (success === '1') {
      toast.success('Payment successful! Credits have been added to your wallet.');
      fetchData();
    } else if (canceled === '1') {
      toast.info('Payment was canceled.');
    } else if (paypal === 'success') {
      toast.success('PayPal payment completed! Credits will be added once the webhook is processed.');
      // Webhook may take a moment - refresh transactions
      fetchData();
    } else if (paypal === 'canceled') {
      toast.info('PayPal payment was canceled.');
    }

    // If redirected back from Stripe with session_id and stripe flag set, confirm session server-side
    if (sessionId && stripeFlag) {
      (async () => {
        try {
          const resp = await fetch(`/api/lead-marketplace/wallet/confirm-stripe?session_id=${encodeURIComponent(sessionId)}`);
          const data = await resp.json();
          if (data.success) {
            toast.success('Payment confirmed — credits added to your wallet.');
            fetchData();
          } else {
            toast.error(data.error || 'Failed to confirm payment');
          }
        } catch (e) {
          toast.error('Failed to confirm Stripe session');
        }
      })();
    }
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [walletRes, transactionsRes, packagesRes] = await Promise.all([
        getWallet(),
        getTransactions({ limit: 50 }),
        getCreditPackages()
      ]);
      if (walletRes.data.success) setWallet(walletRes.data.data);
      if (transactionsRes.data.success) setTransactions(transactionsRes.data.data);
      if (packagesRes.data.success) setPackages(packagesRes.data.data);
    } catch (error) {
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const res = await validatePromoCode(promoCode.trim());
      if (res.data.success && res.data.data.valid) {
        setPromoValid(true);
        setPromoDetails({ discount_type: res.data.data.discount_type, discount_value: res.data.data.discount_value });
        toast.success('Promo code applied!');
      } else {
        setPromoValid(false);
        setPromoDetails(null);
        toast.error('Invalid promo code');
      }
    } catch (error) {
      setPromoValid(false);
      toast.error('Failed to validate promo code');
    }
  };

  const handleCheckout = async (packageId?: number, amount?: number, provider: 'stripe' | 'paypal' = 'stripe') => {
    setCheckoutLoading(true);
    try {
      const res = await createCheckout({
        provider,
        package_id: packageId,
        amount,
        promo_code: promoValid ? promoCode : undefined,
      });
      if (res.data.success && res.data.data.checkout_url) {
        window.location.href = res.data.data.checkout_url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <MarketplaceNav />
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <MarketplaceNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground">Manage your lead credits and transactions</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${wallet?.balance?.toFixed(2) || '0.00'}</p>
            <p className="text-sm text-muted-foreground mt-2">Available credits for purchasing leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchased</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">${wallet?.lifetime_purchased?.toFixed(2) || '0.00'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">${wallet?.lifetime_spent?.toFixed(2) || '0.00'}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Buy Credits
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Transaction History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map(pkg => (
              <Card key={pkg.id} className={`relative ${pkg.is_popular ? 'border-primary shadow-lg' : ''}`}>
                {pkg.is_popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                )}
                <CardHeader>
                  <CardTitle>{pkg.name}</CardTitle>
                  {pkg.description && <CardDescription>{pkg.description}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">${pkg.price}</p>
                    <p className="text-lg text-muted-foreground">{pkg.credits_amount} credits</p>
                    {pkg.bonus_credits > 0 && (
                      <Badge variant="secondary" className="mt-2">
                        <Gift className="h-3 w-3 mr-1" />
                        +{pkg.bonus_credits} bonus
                      </Badge>
                    )}
                    {pkg.discount_percent > 0 && (
                      <Badge variant="outline" className="mt-2 ml-2 text-green-600">
                        Save {pkg.discount_percent}%
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button className="w-full" onClick={() => handleCheckout(pkg.id)} disabled={checkoutLoading}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay with Card
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => handleCheckout(pkg.id, undefined, 'paypal')} disabled={checkoutLoading}>
                      Pay with PayPal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Custom Amount</CardTitle>
              <CardDescription>Enter a custom amount to purchase (minimum $10)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Amount ($)</Label>
                  <Input type="number" min="10" placeholder="Enter amount" value={customAmount} onChange={e => setCustomAmount(e.target.value)} />
                </div>
                <Button onClick={() => handleCheckout(undefined, parseFloat(customAmount))} disabled={checkoutLoading || !customAmount || parseFloat(customAmount) < 10}>
                  <Plus className="h-4 w-4 mr-2" />
                  Purchase
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Promo Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Enter Code</Label>
                  <div className="relative">
                    <Input placeholder="PROMO2024" value={promoCode} onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoValid(null); }} />
                    {promoValid === true && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />}
                    {promoValid === false && <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-600" />}
                  </div>
                </div>
                <Button variant="outline" onClick={handleValidatePromo} disabled={!promoCode.trim()}>
                  Apply
                </Button>
              </div>
              {promoValid && promoDetails && (
                <p className="text-sm text-green-600 mt-2">
                  {promoDetails.discount_type === 'percent' && `${promoDetails.discount_value}% off your purchase`}
                  {promoDetails.discount_type === 'fixed' && `$${promoDetails.discount_value} off your purchase`}
                  {promoDetails.discount_type === 'credits' && `${promoDetails.discount_value} bonus credits`}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your recent credit transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map(txn => {
                    const Icon = transactionTypeIcons[txn.type] || RefreshCw;
                    return (
                      <div key={txn.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full bg-muted ${transactionTypeColors[txn.type]}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium capitalize">{txn.type}</p>
                            <p className="text-sm text-muted-foreground">{txn.description || txn.lead_title || '-'}</p>
                            <p className="text-xs text-muted-foreground">{new Date(txn.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${txn.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {txn.amount >= 0 ? '+' : ''}{txn.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">Balance: ${txn.balance_after.toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
