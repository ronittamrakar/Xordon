import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, DollarSign, Phone, Mail, User, CheckCircle, XCircle, MessageSquare, Trophy, ThumbsDown, Send } from 'lucide-react';
import { getLeadMatch, acceptLeadMatch, declineLeadMatch, sendQuote, markOutcome, getWallet, LeadMatch, Wallet } from '@/services/leadMarketplaceApi';

const statusColors: Record<string, string> = {
  offered: 'bg-blue-100 text-blue-800',
  viewed: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-gray-100 text-gray-800',
  expired: 'bg-red-100 text-red-800',
  won: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-orange-100 text-orange-800',
  refunded: 'bg-purple-100 text-purple-800',
};

const timingLabels: Record<string, string> = {
  asap: 'ASAP',
  within_24h: 'Within 24 hours',
  within_week: 'Within a week',
  flexible: 'Flexible',
  scheduled: 'Scheduled',
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<LeadMatch | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quotePriceMin, setQuotePriceMin] = useState('');
  const [quotePriceMax, setQuotePriceMax] = useState('');
  const [outcomeType, setOutcomeType] = useState<'won' | 'lost'>('won');
  const [outcomeValue, setOutcomeValue] = useState('');
  const [outcomeReason, setOutcomeReason] = useState('');

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [matchRes, walletRes] = await Promise.all([
        getLeadMatch(parseInt(id)),
        getWallet()
      ]);
      if (matchRes.data.success) setMatch(matchRes.data.data);
      if (walletRes.data.success) setWallet(walletRes.data.data);
    } catch (error) {
      toast.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAccept = async () => {
    if (!match) return;
    if ((wallet?.balance || 0) < match.lead_price) {
      toast.error('Insufficient credits. Please add more credits to accept this lead.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await acceptLeadMatch(match.id);
      if (res.data.success) {
        toast.success('Lead accepted! Contact info is now available.');
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to accept lead');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!match) return;
    setActionLoading(true);
    try {
      const res = await declineLeadMatch(match.id, declineReason);
      if (res.data.success) {
        toast.success('Lead declined');
        setShowDeclineDialog(false);
        navigate('/lead-marketplace/inbox');
      }
    } catch {
      toast.error('Failed to decline lead');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendQuote = async () => {
    if (!match) return;
    setActionLoading(true);
    try {
      const res = await sendQuote(match.id, {
        quote_type: 'quote',
        message: quoteMessage,
        price_min: quotePriceMin ? parseFloat(quotePriceMin) : undefined,
        price_max: quotePriceMax ? parseFloat(quotePriceMax) : undefined,
      });
      if (res.data.success) {
        toast.success('Quote sent successfully');
        setShowQuoteDialog(false);
        setQuoteMessage('');
        setQuotePriceMin('');
        setQuotePriceMax('');
        fetchData();
      }
    } catch {
      toast.error('Failed to send quote');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkOutcome = async () => {
    if (!match) return;
    setActionLoading(true);
    try {
      const res = await markOutcome(match.id, {
        outcome: outcomeType,
        value: outcomeType === 'won' && outcomeValue ? parseFloat(outcomeValue) : undefined,
        reason: outcomeType === 'lost' ? outcomeReason : undefined,
      });
      if (res.data.success) {
        toast.success(`Lead marked as ${outcomeType}`);
        setShowOutcomeDialog(false);
        fetchData();
      }
    } catch {
      toast.error('Failed to update outcome');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto py-6">
        <Card><CardContent className="p-12 text-center">
          <h2 className="text-xl font-semibold">Lead not found</h2>
          <Button className="mt-4" onClick={() => navigate('/lead-marketplace/inbox')}>Back to Inbox</Button>
        </CardContent></Card>
      </div>
    );
  }

  const canAccept = ['offered', 'viewed'].includes(match.status);
  const canSendQuote = match.status === 'accepted';
  const canMarkOutcome = match.status === 'accepted';
  const showContactInfo = ['accepted', 'won', 'lost'].includes(match.status);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <MarketplaceNav />
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/lead-marketplace/inbox')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{match.title || match.service_names || 'Service Request'}</h1>
          <p className="text-muted-foreground">Lead #{match.id}</p>
        </div>
        <Badge className={`${statusColors[match.status]} text-sm px-3 py-1`}>{match.status.toUpperCase()}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {typeof match.quality_score === 'number' && (
                <div>
                  <Label className="text-muted-foreground">Quality</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{Math.round(match.quality_score)}/100</Badge>
                  </div>
                </div>
              )}
              {match.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1">{match.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {match.service_names && (
                  <div>
                    <Label className="text-muted-foreground">Services Needed</Label>
                    <p className="mt-1 font-medium">{match.service_names}</p>
                  </div>
                )}
                {match.timing && (
                  <div>
                    <Label className="text-muted-foreground">Timeline</Label>
                    <p className="mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {timingLabels[match.timing] || match.timing}
                    </p>
                  </div>
                )}
                {(match.budget_min || match.budget_max) && (
                  <div>
                    <Label className="text-muted-foreground">Budget Range</Label>
                    <p className="mt-1 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      ${match.budget_min || 0} - ${match.budget_max || '∞'}
                    </p>
                  </div>
                )}
                {(match.city || match.region) && (
                  <div>
                    <Label className="text-muted-foreground">Location</Label>
                    <p className="mt-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {match.city}{match.region ? `, ${match.region}` : ''} {match.postal_code}
                    </p>
                  </div>
                )}
                {match.distance_km && (
                  <div>
                    <Label className="text-muted-foreground">Distance</Label>
                    <p className="mt-1">{match.distance_km.toFixed(1)} km from your service area</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {showContactInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {match.consumer_name && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{match.consumer_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${(match as any).consumer_phone}`} className="text-primary hover:underline">
                    {(match as any).consumer_phone || 'Not provided'}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${(match as any).consumer_email}`} className="text-primary hover:underline">
                    {(match as any).consumer_email || 'Not provided'}
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {match.quotes && match.quotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Messages & Quotes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {match.quotes.map(quote => (
                  <div key={quote.id} className={`p-4 rounded-lg ${quote.is_from_consumer ? 'bg-muted' : 'bg-primary/10'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{quote.is_from_consumer ? 'Customer' : 'You'}</span>
                      <span className="text-xs text-muted-foreground">{new Date(quote.created_at).toLocaleString()}</span>
                    </div>
                    {quote.message && <p>{quote.message}</p>}
                    {(quote.price_min || quote.price_max) && (
                      <p className="mt-2 font-medium">Quote: ${quote.price_min} - ${quote.price_max}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">${match.lead_price.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">Credits will be charged on accept</p>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between text-sm">
                <span>Your Balance</span>
                <span className="font-medium">${wallet?.balance?.toFixed(2) || '0.00'}</span>
              </div>
              {canAccept && (wallet?.balance || 0) < match.lead_price && (
                <p className="text-sm text-red-500 mt-2">Insufficient credits</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canAccept && (
                <>
                  <Button className="w-full" onClick={handleAccept} disabled={actionLoading || (wallet?.balance || 0) < match.lead_price}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Lead (${match.lead_price})
                  </Button>
                  <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Decline Lead</DialogTitle>
                        <DialogDescription>Are you sure you want to decline this lead? This action cannot be undone.</DialogDescription>
                      </DialogHeader>
                      <Textarea placeholder="Reason for declining (optional)" value={declineReason} onChange={e => setDeclineReason(e.target.value)} />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDecline} disabled={actionLoading}>Decline Lead</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {canSendQuote && (
                <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Quote
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Quote</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Message</Label>
                        <Textarea placeholder="Introduce yourself and your services..." value={quoteMessage} onChange={e => setQuoteMessage(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Min Price ($)</Label>
                          <Input type="number" placeholder="0" value={quotePriceMin} onChange={e => setQuotePriceMin(e.target.value)} />
                        </div>
                        <div>
                          <Label>Max Price ($)</Label>
                          <Input type="number" placeholder="0" value={quotePriceMax} onChange={e => setQuotePriceMax(e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowQuoteDialog(false)}>Cancel</Button>
                      <Button onClick={handleSendQuote} disabled={actionLoading || !quoteMessage}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Quote
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {canMarkOutcome && (
                <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Trophy className="h-4 w-4 mr-2" />
                      Mark Outcome
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Mark Lead Outcome</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <Button variant={outcomeType === 'won' ? 'default' : 'outline'} className="flex-1" onClick={() => setOutcomeType('won')}>
                          <Trophy className="h-4 w-4 mr-2" />
                          Won
                        </Button>
                        <Button variant={outcomeType === 'lost' ? 'default' : 'outline'} className="flex-1" onClick={() => setOutcomeType('lost')}>
                          <ThumbsDown className="h-4 w-4 mr-2" />
                          Lost
                        </Button>
                      </div>
                      {outcomeType === 'won' && (
                        <div>
                          <Label>Deal Value ($)</Label>
                          <Input type="number" placeholder="0" value={outcomeValue} onChange={e => setOutcomeValue(e.target.value)} />
                        </div>
                      )}
                      {outcomeType === 'lost' && (
                        <div>
                          <Label>Reason</Label>
                          <Textarea placeholder="Why was this lead lost?" value={outcomeReason} onChange={e => setOutcomeReason(e.target.value)} />
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowOutcomeDialog(false)}>Cancel</Button>
                      <Button onClick={handleMarkOutcome} disabled={actionLoading}>Save Outcome</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {match.status === 'won' && (
                <div className="p-4 bg-emerald-50 rounded-lg text-center">
                  <Trophy className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-medium text-emerald-800">Lead Won!</p>
                  {match.won_value && <p className="text-sm text-emerald-600">Value: ${match.won_value}</p>}
                </div>
              )}

              {match.status === 'lost' && (
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <ThumbsDown className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="font-medium text-orange-800">Lead Lost</p>
                  {match.lost_reason && <p className="text-sm text-orange-600">{match.lost_reason}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Received</span>
                <span>{new Date(match.created_at).toLocaleString()}</span>
              </div>
              {match.viewed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Viewed</span>
                  <span>{new Date(match.viewed_at).toLocaleString()}</span>
                </div>
              )}
              {match.accepted_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accepted</span>
                  <span>{new Date(match.accepted_at).toLocaleString()}</span>
                </div>
              )}
              {match.response_time_minutes && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Time</span>
                  <span>{match.response_time_minutes} minutes</span>
                </div>
              )}
              {match.expires_at && ['offered', 'viewed'].includes(match.status) && (
                <div className="flex justify-between text-orange-600">
                  <span>Expires</span>
                  <span>{new Date(match.expires_at).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
