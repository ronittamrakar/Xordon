import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Edit,
  Send,
  Copy,
  Download,
  Share2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  DollarSign,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText as FileTextIcon,
  MessageSquare,
  Activity,
} from 'lucide-react';
import { proposalApi, type Proposal } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { SafeHTML } from '@/components/SafeHTML';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  viewed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  declined: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <Clock className="h-4 w-4" />,
  sent: <Send className="h-4 w-4" />,
  viewed: <Eye className="h-4 w-4" />,
  accepted: <CheckCircle className="h-4 w-4" />,
  declined: <XCircle className="h-4 w-4" />,
  expired: <Clock className="h-4 w-4" />,
};

const ProposalPreview: React.FC = () => {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    if (proposalId) {
      loadProposal(proposalId);
    }
  }, [proposalId]);

  const loadProposal = async (id: string) => {
    try {
      setLoading(true);
      const data = await proposalApi.getProposal(id);
      setProposal(data);
    } catch (error) {
      console.error('Failed to load proposal:', error);
      toast.error('Failed to load proposal');
      navigate('/proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!proposal) return;
    if (!proposal.client_email) {
      toast.error('Please add a client email before sending');
      return;
    }
    try {
      await proposalApi.sendProposal(proposal.id);
      toast.success('Proposal sent successfully');
      loadProposal(proposal.id);
    } catch (error) {
      console.error('Failed to send proposal:', error);
      toast.error('Failed to send proposal');
    }
  };

  const handleDuplicate = async () => {
    if (!proposal) return;
    try {
      const response = await proposalApi.duplicateProposal(proposal.id);
      toast.success('Proposal duplicated successfully');
      navigate(`/proposals/${response.id}/edit`);
    } catch (error) {
      console.error('Failed to duplicate proposal:', error);
      toast.error('Failed to duplicate proposal');
    }
  };

  const handleAddComment = async () => {
    if (!proposal || !newComment.trim()) return;
    try {
      setAddingComment(true);
      await proposalApi.addComment(proposal.id, { content: newComment, is_internal: true });
      toast.success('Comment added');
      setNewComment('');
      loadProposal(proposal.id);
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  const copyShareLink = () => {
    if (!proposal) return;
    // Use the secure token for public access instead of sequential ID
    const token = proposal.token;
    if (!token) {
      toast.error('Proposal token not available. Please save the proposal first.');
      return;
    }
    const link = `${window.location.origin}/proposals/public/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Share link copied to clipboard');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: proposal?.currency || 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <FileTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Proposal not found</h2>
        <Button onClick={() => navigate('/proposals')}>Back to Proposals</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Proposals', href: '/proposals' },
          { label: proposal.name },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/proposals')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{proposal.name}</h1>
              <Badge className={statusColors[proposal.status]}>
                <span className="flex items-center gap-1">
                  {statusIcons[proposal.status]}
                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                </span>
              </Badge>
            </div>
            {proposal.template_name && (
              <p className="text-sm text-muted-foreground">
                Based on: {proposal.template_name}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyShareLink}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button variant="outline" onClick={() => navigate(`/proposals/${proposal.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {proposal.status === 'draft' && (
            <Button onClick={handleSend}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              {(proposal.sections || []).map((section) => (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle>{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SafeHTML
                      html={section.content || '<p class="text-muted-foreground">No content</p>'}
                      className="prose dark:prose-invert max-w-none"
                    />
                  </CardContent>
                </Card>
              ))}
              {proposal.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{proposal.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Line Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(proposal.items || []).length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No items</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">Item</th>
                              <th className="text-right py-2 font-medium">Qty</th>
                              <th className="text-right py-2 font-medium">Price</th>
                              <th className="text-right py-2 font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(proposal.items || []).map((item, index) => {
                              const qty = item.quantity || 1;
                              const price = item.unit_price || 0;
                              const disc = item.discount_percent || 0;
                              const tax = item.tax_percent || 0;
                              const subtotal = qty * price;
                              const afterDisc = subtotal - (subtotal * disc / 100);
                              const total = afterDisc + (afterDisc * tax / 100);

                              return (
                                <tr key={index} className="border-b">
                                  <td className="py-3">
                                    <div>
                                      <span className="font-medium">{item.name}</span>
                                      {item.is_optional && (
                                        <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
                                      )}
                                    </div>
                                    {item.description && (
                                      <p className="text-sm text-muted-foreground">{item.description}</p>
                                    )}
                                  </td>
                                  <td className="text-right py-3">{qty}</td>
                                  <td className="text-right py-3">{formatCurrency(price)}</td>
                                  <td className="text-right py-3 font-medium">{formatCurrency(total)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <Separator />
                      <div className="flex justify-end">
                        <div className="w-64 space-y-2">
                          <div className="flex justify-between text-lg font-semibold">
                            <span>Total</span>
                            <span>{formatCurrency(proposal.total_amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(proposal.activities || []).length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No activity yet</p>
                  ) : (
                    <div className="space-y-4">
                      {(proposal.activities || []).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                          <div className="flex-1">
                            <p className="text-sm">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(proposal.comments || []).length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No comments yet</p>
                  ) : (
                    <div className="space-y-4">
                      {(proposal.comments || []).map((comment) => (
                        <div key={comment.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{comment.author_name}</span>
                            <div className="flex items-center gap-2">
                              {comment.is_internal && (
                                <Badge variant="secondary" className="text-xs">Internal</Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <Separator />
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add an internal comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addingComment}
                      size="sm"
                    >
                      Add Comment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Value</span>
                <span className="text-xl font-bold">{formatCurrency(proposal.total_amount)}</span>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(proposal.created_at), 'MMM d, yyyy')}</span>
                </div>
                {proposal.valid_until && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid Until</span>
                    <span>{format(new Date(proposal.valid_until), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {proposal.sent_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sent</span>
                    <span>{format(new Date(proposal.sent_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {proposal.viewed_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">First Viewed</span>
                    <span>{format(new Date(proposal.viewed_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {proposal.accepted_at && (
                  <div className="flex justify-between text-green-600">
                    <span>Accepted</span>
                    <span>{format(new Date(proposal.accepted_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {proposal.declined_at && (
                  <div className="flex justify-between text-red-600">
                    <span>Declined</span>
                    <span>{format(new Date(proposal.declined_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Client Card */}
          {proposal.client_name && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{proposal.client_name}</span>
                </div>
                {proposal.client_company && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{proposal.client_company}</span>
                  </div>
                )}
                {proposal.client_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${proposal.client_email}`} className="text-primary hover:underline">
                      {proposal.client_email}
                    </a>
                  </div>
                )}
                {proposal.client_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${proposal.client_phone}`} className="text-primary hover:underline">
                      {proposal.client_phone}
                    </a>
                  </div>
                )}
                {proposal.client_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="whitespace-pre-wrap">{proposal.client_address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Signature Card */}
          {proposal.signature && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Signed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="border rounded p-4 bg-muted/50">
                  <img src={proposal.signature} alt="Signature" className="max-h-20" />
                </div>
                {proposal.signed_by && (
                  <p className="text-muted-foreground">
                    Signed by: {proposal.signed_by}
                  </p>
                )}
                {proposal.signed_at && (
                  <p className="text-muted-foreground">
                    {format(new Date(proposal.signed_at), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Internal Notes */}
          {proposal.internal_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {proposal.internal_notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalPreview;
