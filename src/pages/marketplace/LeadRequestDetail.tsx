import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, DollarSign, MapPin } from 'lucide-react';
import { getLeadRequest, LeadRequest } from '@/services/leadMarketplaceApi';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  routing: 'bg-yellow-100 text-yellow-800',
  routed: 'bg-green-100 text-green-800',
  partial: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-800',
  expired: 'bg-red-100 text-red-800',
  spam: 'bg-red-100 text-red-800',
  duplicate: 'bg-gray-100 text-gray-800',
};

const matchStatusColors: Record<string, string> = {
  offered: 'bg-blue-100 text-blue-800',
  viewed: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-gray-100 text-gray-800',
  expired: 'bg-red-100 text-red-800',
  won: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-orange-100 text-orange-800',
  refunded: 'bg-purple-100 text-purple-800',
};

export default function LeadRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<LeadRequest | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await getLeadRequest(parseInt(id, 10));
        if (res.data.success) setLead(res.data.data);
      } catch {
        toast.error('Failed to load lead');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <MarketplaceNav />
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <MarketplaceNav />
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-xl font-semibold">Lead not found</h2>
            <Button className="mt-4" onClick={() => navigate('/lead-marketplace/leads')}>Back to Lead Management</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <MarketplaceNav />
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/lead-marketplace/leads')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{lead.title || lead.service_names || 'Lead Request'}</h1>
          <p className="text-muted-foreground">Lead #{lead.id}</p>
        </div>
        <Badge className={`${statusColors[lead.status] || 'bg-gray-100 text-gray-800'} text-sm px-3 py-1`}>{lead.status.toUpperCase()}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(lead.city || lead.region || lead.postal_code) && (
                <div>
                  <div className="text-muted-foreground text-sm">Location</div>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{lead.city}{lead.region ? `, ${lead.region}` : ''} {lead.postal_code}</span>
                  </div>
                </div>
              )}

              {lead.timing && (
                <div>
                  <div className="text-muted-foreground text-sm">Timing</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4" />
                    <span>{lead.timing}</span>
                  </div>
                </div>
              )}

              {(lead.budget_min || lead.budget_max) && (
                <div>
                  <div className="text-muted-foreground text-sm">Budget</div>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="h-4 w-4" />
                    <span>${lead.budget_min || 0} - ${lead.budget_max || '∞'}</span>
                  </div>
                </div>
              )}

              {lead.description && (
                <div>
                  <div className="text-muted-foreground text-sm">Description</div>
                  <div className="mt-1 whitespace-pre-wrap">{lead.description}</div>
                </div>
              )}

              <Separator />

              <div>
                <div className="text-muted-foreground text-sm">Services</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(lead.services || []).map((s) => (
                    <Badge key={`${lead.id}-${s.service_id}`} variant="secondary">
                      {s.service_name || `Service #${s.service_id}`}
                    </Badge>
                  ))}
                  {(!lead.services || lead.services.length === 0) && (
                    <span className="text-muted-foreground text-sm">No services recorded</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Matches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(lead.matches || []).length === 0 ? (
                <div className="text-muted-foreground">No matches yet.</div>
              ) : (
                <div className="space-y-2">
                  {lead.matches!.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between border rounded-md p-3">
                      <div className="space-y-1">
                        <div className="font-medium">{m.business_name || `Company #${m.company_id}`}</div>
                        <div className="text-sm text-muted-foreground">Match #{m.id}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={matchStatusColors[m.status] || 'bg-gray-100 text-gray-800'}>{String(m.status).toUpperCase()}</Badge>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/lead-marketplace/matches/${m.id}`)}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Consumer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Name:</span> {lead.consumer_name || '-'}</div>
              <div><span className="text-muted-foreground">Email:</span> {lead.consumer_email || '-'}</div>
              <div><span className="text-muted-foreground">Phone:</span> {lead.consumer_phone || '-'}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
