import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAuth } from '@/lib/mockAuth';
import { mockData, type Campaign } from '@/lib/mockData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Plus, Play, Pause, Trash2, Edit, BarChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/AppLayout';

const Campaigns = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    if (!mockAuth.isAuthenticated()) {
      navigate('/auth');
      return;
    }
    loadCampaigns();
  }, [navigate]);

  const loadCampaigns = () => {
    setCampaigns(mockData.getCampaigns());
  };

  const handleStart = (campaignId: string) => {
    mockData.updateCampaign(campaignId, { status: 'sending' });
    mockData.simulateSend(campaignId);
    toast({
      title: 'Campaign started',
      description: 'Your campaign is now being sent.',
    });
    setTimeout(() => loadCampaigns(), 1000);
  };

  const handlePause = (campaignId: string) => {
    mockData.updateCampaign(campaignId, { status: 'paused' });
    toast({
      title: 'Campaign paused',
      description: 'Your campaign has been paused.',
    });
    loadCampaigns();
  };

  const handleDelete = (campaignId: string) => {
    mockData.deleteCampaign(campaignId);
    toast({
      title: 'Campaign deleted',
      description: 'The campaign has been removed.',
    });
    loadCampaigns();
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'scheduled': return 'default';
      case 'sending': return 'default';
      case 'completed': return 'default';
      case 'paused': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
            <p className="text-muted-foreground mt-1">Create and manage your email campaigns</p>
          </div>
          <Button onClick={() => navigate('/campaigns/new')} className="shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Mail className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">Create your first email campaign to get started</p>
              <Button onClick={() => navigate('/campaigns/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle>{campaign.name}</CardTitle>
                        <Badge variant={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <CardDescription>{campaign.subject}</CardDescription>
                      <p className="text-xs text-muted-foreground mt-2">
                        Created {new Date(campaign.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Recipients</p>
                      <p className="text-xl font-bold">{campaign.totalRecipients}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sent</p>
                      <p className="text-xl font-bold">{campaign.sent}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Opens</p>
                      <p className="text-xl font-bold">
                        {campaign.opens}
                        <span className="text-sm text-muted-foreground ml-1">
                          ({campaign.sent > 0 ? ((campaign.opens / campaign.sent) * 100).toFixed(1) : 0}%)
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Clicks</p>
                      <p className="text-xl font-bold">
                        {campaign.clicks}
                        <span className="text-sm text-muted-foreground ml-1">
                          ({campaign.sent > 0 ? ((campaign.clicks / campaign.sent) * 100).toFixed(1) : 0}%)
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bounces</p>
                      <p className="text-xl font-bold">{campaign.bounces}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {campaign.status === 'draft' || campaign.status === 'paused' ? (
                      <Button size="sm" onClick={() => handleStart(campaign.id)}>
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    ) : null}
                    
                    {campaign.status === 'sending' ? (
                      <Button size="sm" variant="outline" onClick={() => handlePause(campaign.id)}>
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    ) : null}
                    
                    <Button size="sm" variant="outline" onClick={() => navigate(`/campaigns/edit/${campaign.id}`)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    
                    <Button size="sm" variant="outline" onClick={() => navigate(`/analytics?campaign=${campaign.id}`)}>
                      <BarChart className="h-4 w-4 mr-1" />
                      Analytics
                    </Button>
                    
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(campaign.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Campaigns;
