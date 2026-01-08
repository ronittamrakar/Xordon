import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

import { Breadcrumb } from '@/components/Breadcrumb';
import { api, type Campaign, type SendingAccount, type Sequence } from '@/lib/api';
import { SafeHTML } from '@/components/SafeHTML';
import {
  ArrowLeft,
  Edit,
  Play,
  Pause,
  Mail,
  Users,
  Calendar,
  Settings,
  TrendingUp,
  MousePointer,
  AlertTriangle,
  UserMinus,
  Clock,
  Send,
  Eye,
  BarChart3,
  Workflow
} from 'lucide-react';

const CampaignDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [sendingAccount, setSendingAccount] = useState<SendingAccount | null>(null);
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [loading, setLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(true);

  // Enhanced validation for the ID parameter
  const isValidId = React.useMemo(() => {
    // More robust validation to catch invalid IDs early
    if (!id) return false;

    // Check for common invalid patterns
    if (id === ':id' || id.trim() === '' || id.startsWith(':')) {
      return false;
    }

    // Check for valid ID format (alphanumeric with hyphens and underscores)
    const validIdPattern = /^[a-zA-Z0-9\-_]+$/;
    return validIdPattern.test(id);
  }, [id]);

  // Early redirect if ID is clearly invalid
  React.useEffect(() => {
    if (id && !isValidId) {
      console.error('Invalid campaign ID detected:', id);
      // Redirect immediately without showing error toast for cleaner UX
      navigate('/reach/outbound/email/campaigns', { replace: true });
      return;
    }
    setIsValidating(false);
  }, [id, isValidId, navigate]);

  const loadCampaignDetails = React.useCallback(async () => {
    if (!isValidId) {
      console.error('Invalid campaign ID:', id);
      toast({
        title: 'Error',
        description: 'Invalid campaign ID. Please navigate from the campaigns list.',
        variant: 'destructive',
      });
      navigate('/reach/outbound/email/campaigns');
      return;
    }

    try {
      setLoading(true);
      console.log('Loading campaign details for ID:', id);

      // Load campaign
      const campaignData = await api.getCampaign(id!);
      setCampaign(campaignData);

      // Load sending account
      if (campaignData.sendingAccountId) {
        try {
          const accountData = await api.getSendingAccount(campaignData.sendingAccountId);
          setSendingAccount(accountData);
        } catch (err) {
          console.error('Failed to load sending account:', err);
        }
      }

      // Load sequence
      if (campaignData.sequenceId) {
        try {
          const sequenceData = await api.getSequence(campaignData.sequenceId);
          setSequence(sequenceData);
        } catch (err) {
          console.error('Failed to load sequence:', err);
        }
      }
    } catch (err) {
      console.error('Failed to load campaign details:', err);
      toast({
        title: 'Error',
        description: 'Failed to load campaign details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast, isValidId, navigate]);

  useEffect(() => {
    // Only load if we have a valid ID and validation is complete
    if (!isValidating && isValidId) {
      loadCampaignDetails();
    }
  }, [isValidating, isValidId, loadCampaignDetails]);

  const handleStatusChange = async (newStatus: Campaign['status']) => {
    if (!campaign) return;

    try {
      await api.updateCampaign(campaign.id, { status: newStatus });
      setCampaign({ ...campaign, status: newStatus });
      toast({
        title: 'Campaign updated',
        description: `Campaign status changed to ${newStatus}.`,
      });
    } catch (err) {
      console.error('Failed to update campaign status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update campaign status.',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sending': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = () => {
    if (!campaign || campaign.totalRecipients === 0) return 0;
    return Math.round((campaign.sent / campaign.totalRecipients) * 100);
  };

  const getOpenRate = () => {
    if (!campaign || campaign.sent === 0) return 0;
    return Math.round((campaign.opens / campaign.sent) * 100);
  };

  const getClickRate = () => {
    if (!campaign || campaign.sent === 0) return 0;
    return Math.round((campaign.clicks / campaign.sent) * 100);
  };

  const getBounceRate = () => {
    if (!campaign || campaign.sent === 0) return 0;
    return Math.round((campaign.bounces / campaign.sent) * 100);
  };

  const getUnsubscribeRate = () => {
    if (!campaign || campaign.sent === 0) return 0;
    return Math.round((campaign.unsubscribes / campaign.sent) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Show loading state while validating ID
  if (isValidating || loading) {
    return (
      <>
        <div className="space-y-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading campaign details...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show error state if campaign couldn't be loaded
  if (!campaign) {
    return (
      <>
        <div className="space-y-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Campaign Not Found</h2>
              <p className="text-muted-foreground mb-4">The campaign you're looking for doesn't exist or you don't have permission to view it.</p>
              <Button onClick={() => navigate('/reach/outbound/email/campaigns')} className="mt-4">
                Back to Campaigns
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Breadcrumb
          items={[
            { label: 'Email Outreach', href: '/reach/outbound/email', icon: <Mail className="h-4 w-4" /> },
            { label: 'Campaigns', href: '/reach/outbound/email/campaigns' },
            { label: campaign.name }
          ]}
        />

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/reach/outbound/email/campaigns')} className="hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{campaign.name}</h1>
              <Badge className={getStatusColor(campaign.status)}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">Campaign details and analytics</p>
          </div>

          <div className="flex items-center gap-3">
            {(campaign.status === 'draft' || campaign.status === 'paused') && (
              <Button onClick={() => handleStatusChange('sending')} className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                Start Campaign
              </Button>
            )}

            {campaign.status === 'sending' && (
              <Button onClick={() => handleStatusChange('paused')} variant="outline">
                <Pause className="h-4 w-4 mr-2" />
                Pause Campaign
              </Button>
            )}

            <Button onClick={() => navigate(`/reach/outbound/email/campaigns/edit/${campaign.id}`)} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button onClick={() => navigate(`/automations/builder/builder?campaign=${campaign.id}&type=email`)} variant="outline">
              <Workflow className="h-4 w-4 mr-2" />
              Flow Builder
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Campaign Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Subject Line</label>
                    <p className="text-sm">{campaign.subject}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="text-sm">{formatDate(campaign.createdAt)}</p>
                  </div>
                  {campaign.scheduledAt && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Scheduled</label>
                      <p className="text-sm">{formatDate(campaign.scheduledAt)}</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email Content</label>
                  <div className="mt-2 p-4 bg-muted rounded-md">
                    {campaign.htmlContent ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Full Email Content</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newWindow = window.open('', '_blank');
                              if (newWindow) {
                                newWindow.document.write(`
                                  <html>
                                    <head><title>Email Preview - ${campaign.subject}</title></head>
                                    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                      <h2>Subject: ${campaign.subject}</h2>
                                      <hr>
                                      ${campaign.htmlContent}
                                    </body>
                                  </html>
                                `);
                                newWindow.document.close();
                              }
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview in New Window
                          </Button>
                        </div>
                        <SafeHTML
                          html={campaign.htmlContent}
                          className="text-sm prose prose-sm max-w-none max-h-48 overflow-y-auto border rounded p-3 bg-card text-card-foreground [&_*]:text-card-foreground [&_p]:text-card-foreground [&_div]:text-card-foreground [&_span]:text-card-foreground [&_h1]:text-card-foreground [&_h2]:text-card-foreground [&_h3]:text-card-foreground [&_h4]:text-card-foreground [&_h5]:text-card-foreground [&_h6]:text-card-foreground [&_a]:text-primary [&_a]:underline"
                        />
                      </div>
                    ) : sequence && sequence.steps && sequence.steps.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Sequence Email Content</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const firstStep = sequence.steps![0];
                              const newWindow = window.open('', '_blank');
                              if (newWindow) {
                                newWindow.document.write(`
                                  <html>
                                    <head><title>Email Preview - ${firstStep.subject}</title></head>
                                    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                      <h2>Subject: ${firstStep.subject}</h2>
                                      <hr>
                                      ${firstStep.content}
                                    </body>
                                  </html>
                                `);
                                newWindow.document.close();
                              }
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview in New Window
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {sequence.steps.slice(0, 3).map((step, index) => (
                            <div key={index} className="border rounded p-3 bg-card">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                  Step {step.order || index + 1}
                                  {step.delay_days > 0 && ` (${step.delay_days} days delay)`}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {index === 0 ? 'Initial' : 'Follow-up'}
                                </Badge>
                              </div>
                              <div className="text-sm font-medium mb-1">{step.subject}</div>
                              <SafeHTML
                                html={step.content}
                                className="text-sm prose prose-sm max-w-none max-h-32 overflow-y-auto text-card-foreground [&_*]:text-card-foreground [&_p]:text-card-foreground [&_div]:text-card-foreground [&_span]:text-card-foreground [&_h1]:text-card-foreground [&_h2]:text-card-foreground [&_h3]:text-card-foreground [&_h4]:text-card-foreground [&_h5]:text-card-foreground [&_h6]:text-card-foreground [&_a]:text-primary [&_a]:underline"
                              />
                            </div>
                          ))}
                          {sequence.steps.length > 3 && (
                            <div className="text-center py-2">
                              <span className="text-xs text-muted-foreground">
                                +{sequence.steps.length - 3} more steps in this sequence
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No email content available</p>
                        <p className="text-xs">This campaign has no direct content or sequence configured</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sequence Details */}
            {campaign.sequenceId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Sequence Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Sequence ID</p>
                        <p className="text-sm text-muted-foreground">{campaign.sequenceId}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Sequence Mode</p>
                        <Badge variant="outline">{campaign.sequenceMode || 'existing'}</Badge>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        This campaign is using an automated email sequence
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/sequences/edit/${campaign.sequenceId}`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        View Sequence
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recipients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recipients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold text-blue-600">{campaign.totalRecipients}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold text-green-600">{campaign.sent}</div>
                      <div className="text-xs text-muted-foreground">Sent</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-lg font-semibold text-muted-foreground">{campaign.totalRecipients - campaign.sent}</div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Manage recipients for this campaign
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/recipients?campaign=${campaign.id}`)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      View Recipients
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Campaign Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Progress</span>
                      <span>{campaign.sent}/{campaign.totalRecipients} sent ({getProgressPercentage()}%)</span>
                    </div>
                    <Progress value={getProgressPercentage()} className="h-2" />
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-center text-green-600 mb-1">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span className="text-lg font-semibold">{getOpenRate()}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Open Rate</p>
                      <p className="text-xs text-green-600">{campaign.opens} opens</p>
                    </div>

                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-center text-blue-600 mb-1">
                        <MousePointer className="h-4 w-4 mr-1" />
                        <span className="text-lg font-semibold">{getClickRate()}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Click Rate</p>
                      <p className="text-xs text-blue-600">{campaign.clicks} clicks</p>
                    </div>

                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-center text-red-600 mb-1">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span className="text-lg font-semibold">{getBounceRate()}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Bounce Rate</p>
                      <p className="text-xs text-red-600">{campaign.bounces} bounces</p>
                    </div>

                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center justify-center text-orange-600 mb-1">
                        <UserMinus className="h-4 w-4 mr-1" />
                        <span className="text-lg font-semibold">{getUnsubscribeRate()}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Unsubscribe Rate</p>
                      <p className="text-xs text-orange-600">{campaign.unsubscribes} unsubscribes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sending Account */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Sending Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sendingAccount ? (
                  <div className="space-y-2">
                    <p className="font-medium">{sendingAccount.name}</p>
                    <p className="text-sm text-muted-foreground">{sendingAccount.email}</p>
                    <Badge variant="outline">{sendingAccount.type}</Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No sending account configured</p>
                )}
              </CardContent>
            </Card>

            {/* Sequence */}
            {sequence && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Sequence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="font-medium">{sequence.name}</p>
                    <p className="text-sm text-muted-foreground">{sequence.steps?.length || 0} email steps</p>
                    <div className="space-y-2">
                      {sequence.steps?.slice(0, 3).map((step, index) => (
                        <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                          <p className="font-medium">Step {step.order}: {step.subject}</p>
                          {step.delay_days > 0 && (
                            <p className="text-muted-foreground">Delay: {step.delay_days} days</p>
                          )}
                        </div>
                      ))}
                      {(sequence.steps?.length || 0) > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{(sequence.steps?.length || 0) - 3} more steps
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recipients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recipients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-medium">{campaign.totalRecipients}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Sent</span>
                    <span className="font-medium">{campaign.sent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Remaining</span>
                    <span className="font-medium">{campaign.totalRecipients - campaign.sent}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sending Account */}
            {sendingAccount && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Sending Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{sendingAccount.name}</p>
                      <p className="text-sm text-muted-foreground">{sendingAccount.email}</p>
                    </div>
                    <Badge variant={sendingAccount.status === 'active' ? 'default' : 'secondary'}>
                      {sendingAccount.status}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Provider</p>
                    <p className="capitalize">{sendingAccount.provider}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Daily Usage</p>
                    <p>{sendingAccount.sentToday || 0} / {sendingAccount.dailyLimit || 'Unlimited'}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Settings */}
            {campaign.settings && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Campaign Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="text-muted-foreground">Sending Window</p>
                    <p>{campaign.settings.sendingWindowStart} - {campaign.settings.sendingWindowEnd}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Timezone</p>
                    <p>{campaign.settings.timezone}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Email Delay</p>
                    <p>{campaign.settings.emailDelay} seconds</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Batch Size</p>
                    <p>{campaign.settings.batchSize} emails</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Priority</p>
                    <Badge variant="outline">{campaign.settings.priority}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CampaignDetails;
