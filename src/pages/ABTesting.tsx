import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  FlaskConical, Plus, Play, Pause, Trophy, BarChart3, Trash2, Eye,
  Mail, MessageSquare, CheckCircle2, Target, Settings2, Copy, X, MoreHorizontal, ChevronDown
} from 'lucide-react';


interface ABTest {
  id: number;
  name: string;
  description?: string;
  test_type: 'email_subject' | 'email_content' | 'sms_content' | 'landing_page' | 'form';
  entity_type: string;
  entity_id: number;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'winner_selected';
  winner_criteria: string;
  auto_select_winner: boolean;
  min_sample_size: number;
  test_duration_hours: number;
  winner_variant_id?: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  variants?: Variant[];
  variant_count?: number;
  total_results?: number;
}

interface Variant {
  id: number;
  variant_name: string;
  variant_label: string;
  content: Record<string, string>;
  traffic_percentage: number;
  is_control: boolean;
  is_winner: boolean;
  sent_count?: number;
  open_count?: number;
  click_count?: number;
  reply_count?: number;
  open_rate?: number;
  click_rate?: number;
  reply_rate?: number;
}

const defaultFormData = {
  name: '',
  description: '',
  test_type: 'email_subject' as const,
  winner_criteria: 'open_rate',
  auto_select_winner: true,
  min_sample_size: 100,
  test_duration_hours: 24,
  variants: [
    { variant_name: 'A', variant_label: 'Control', content: { subject: '', body: '' }, is_control: true, traffic_percentage: 50 },
    { variant_name: 'B', variant_label: 'Variant B', content: { subject: '', body: '' }, is_control: false, traffic_percentage: 50 }
  ]
};

export default function ABTesting() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'sms'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(defaultFormData);
  const [openResults, setOpenResults] = useState<Record<number, boolean>>({});
  const [didAutoSeed, setDidAutoSeed] = useState(false);

  useEffect(() => { loadTests(); }, []);

  const loadTests = async () => {
    try {
      const res = await api.get<{ items?: ABTest[]; warning?: string }>('/ab-tests');
      const data = res.data;
      const items = data.items || [];

      if (data.warning) {
        toast.message(data.warning);
      }

      // In dev, automatically seed some tests if DB is empty.
      if (import.meta.env.DEV && items.length === 0 && !didAutoSeed) {
        setDidAutoSeed(true);
        await api.post('/ab-tests/dev/seed');
        const seeded = await api.get<{ items?: ABTest[] }>('/ab-tests');
        setTests(seeded.data.items || []);
        return;
      }

      setTests(items);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load tests';
      toast.error(msg);
      setTests([]);
    } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) { toast.error('Test name is required'); return; }
    try {
      await api.post('/ab-tests', formData);
      toast.success('A/B test created');
      setIsCreateOpen(false);
      setFormData(defaultFormData);
      loadTests();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create test';
      toast.error(msg);
    }
  };

  const handleStart = async (id: number) => {
    try {
      await api.post(`/ab-tests/${id}/start`);
      toast.success('Test started');
      loadTests();
    } catch { toast.error('Failed to start test'); }
  };

  const handleStop = async (id: number) => {
    try {
      await api.post(`/ab-tests/${id}/stop`);
      toast.success('Test stopped');
      loadTests();
    } catch { toast.error('Failed to stop test'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this test?')) return;
    try {
      await api.delete(`/ab-tests/${id}`);
      toast.success('Test deleted');
      loadTests();
    } catch { toast.error('Failed to delete test'); }
  };

  const handleSelectWinner = async (testId: number, variantId: number) => {
    try {
      await api.post(`/ab-tests/${testId}/winner`, { variant_id: variantId });
      toast.success('Winner selected');
      loadTests();
    } catch { toast.error('Failed to select winner'); }
  };

  const handleDuplicate = (test: ABTest) => {
    setFormData({
      ...defaultFormData,
      name: `${test.name} (Copy)`,
      description: test.description || '',
      test_type: test.test_type,
      winner_criteria: test.winner_criteria,
      min_sample_size: test.min_sample_size,
      test_duration_hours: test.test_duration_hours,
    });
    setIsCreateOpen(true);
  };

  const addVariant = () => {
    const letter = String.fromCharCode(65 + formData.variants.length);
    const newPct = Math.floor(100 / (formData.variants.length + 1));
    const variants = formData.variants.map(v => ({ ...v, traffic_percentage: newPct }));
    variants.push({ variant_name: letter, variant_label: `Variant ${letter}`, content: { subject: '', body: '' }, is_control: false, traffic_percentage: newPct });
    setFormData({ ...formData, variants });
  };

  const removeVariant = (idx: number) => {
    if (formData.variants.length <= 2) return;
    const variants = formData.variants.filter((_, i) => i !== idx);
    const pct = Math.floor(100 / variants.length);
    setFormData({ ...formData, variants: variants.map(v => ({ ...v, traffic_percentage: pct })) });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      running: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      winner_selected: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    };
    return <Badge className={colors[status] || colors.draft}>{status.replace('_', ' ')}</Badge>;
  };

  const getTypeIcon = (type: string) => type.includes('sms') ? <MessageSquare className="h-4 w-4" /> : <Mail className="h-4 w-4" />;

  const getTypeLabel = (type: ABTest['test_type']) => {
    const labels: Record<ABTest['test_type'], string> = {
      email_subject: 'Email subject',
      email_content: 'Email content',
      sms_content: 'SMS content',
      landing_page: 'Landing page',
      form: 'Form',
    };
    return labels[type] || type.replace(/_/g, ' ');
  };

  const mockVariants = (testId: number): Variant[] => [
    { id: testId * 10 + 1, variant_name: 'A', variant_label: 'Control', content: { subject: "Don't miss out!" }, is_control: true, is_winner: false, traffic_percentage: 50, sent_count: 225, open_count: 68, click_count: 23, open_rate: 30.2, click_rate: 10.2, reply_rate: 2.1 },
    { id: testId * 10 + 2, variant_name: 'B', variant_label: 'Variant B', content: { subject: "You won't believe this..." }, is_control: false, is_winner: testId === 3, traffic_percentage: 50, sent_count: 225, open_count: 81, click_count: 31, open_rate: 36.0, click_rate: 13.8, reply_rate: 3.5 }
  ];

  const filteredTests = tests.filter(t => {
    if (activeTab === 'all') return true;
    if (activeTab === 'running') return t.status === 'running';
    if (activeTab === 'completed') return t.status === 'completed' || t.status === 'winner_selected';
    if (activeTab === 'draft') return t.status === 'draft';
    return true;
  }).filter(t => {
    if (channelFilter === 'all') return true;
    if (channelFilter === 'email') return t.test_type.includes('email');
    if (channelFilter === 'sms') return t.test_type === 'sms_content';
    return true;
  }).filter(t => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const hay = `${t.name ?? ''} ${t.description ?? ''}`.toLowerCase();
    return hay.includes(q);
  });

  return (

    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold tracking-tight">A/B Testing</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Test and optimize your email & SMS campaigns</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          New test
        </Button>
      </div>

      {/* Tabs & Tests */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <TabsList className="inline-flex h-9 w-auto mr-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="running">Running</TabsTrigger>
              <TabsTrigger value="completed">Done</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
            </TabsList>

            <div className="inline-flex rounded-md border bg-background p-0.5 mr-3">
              <Button
                type="button"
                size="sm"
                variant={channelFilter === 'all' ? 'default' : 'ghost'}
                className="h-7 px-2 text-xs"
                onClick={() => setChannelFilter('all')}
              >
                All channels
              </Button>
              <Button
                type="button"
                size="sm"
                variant={channelFilter === 'email' ? 'default' : 'ghost'}
                className="h-7 px-2 text-xs"
                onClick={() => setChannelFilter('email')}
              >
                Email
              </Button>
              <Button
                type="button"
                size="sm"
                variant={channelFilter === 'sms' ? 'default' : 'ghost'}
                className="h-7 px-2 text-xs"
                onClick={() => setChannelFilter('sms')}
              >
                SMS
              </Button>
            </div>

            <div className="w-full sm:w-64">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tests…"
                className="h-9"
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground shrink-0">
            {filteredTests.length} test{filteredTests.length === 1 ? '' : 's'}
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {loading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : filteredTests.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No tests found. Create one to get started.</Card>
          ) : filteredTests.map(test => (
            <Collapsible
              key={test.id}
              open={Boolean(openResults[test.id])}
              onOpenChange={(open) => setOpenResults(prev => ({ ...prev, [test.id]: open }))}
            >
              <Card className="overflow-hidden">
                <div className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      {getTypeIcon(test.test_type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-semibold leading-5 truncate">{test.name}</p>
                        <span className="hidden md:inline text-xs text-muted-foreground">·</span>
                        <span className="hidden md:inline text-xs text-muted-foreground">{getTypeLabel(test.test_type)}</span>
                      </div>
                      {test.description ? (
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">{test.description}</p>
                      ) : null}

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span className="capitalize">{test.winner_criteria.replace(/_/g, ' ')}</span>
                        <span className="text-muted-foreground/60">·</span>
                        <span>{(test.variant_count || 2)} variants</span>
                        <span className="text-muted-foreground/60">·</span>
                        <span>{(test.total_results || 0).toLocaleString()} sent</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(test.status)}

                      {test.status === 'draft' && (
                        <Button size="sm" onClick={() => handleStart(test.id)} className="h-8">
                          <Play className="h-3.5 w-3.5 mr-1" />
                          Start
                        </Button>
                      )}
                      {test.status === 'running' && (
                        <Button size="sm" variant="outline" onClick={() => handleStop(test.id)} className="h-8">
                          <Pause className="h-3.5 w-3.5 mr-1" />
                          Stop
                        </Button>
                      )}

                      {['running', 'completed', 'winner_selected'].includes(test.status) && (
                        <CollapsibleTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
                            {openResults[test.id] ? 'Hide' : 'Results'}
                            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${openResults[test.id] ? 'rotate-180' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="More">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedTest(test); setIsSettingsOpen(true); }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(test)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(test.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {['running', 'completed', 'winner_selected'].includes(test.status) && (
                    <CollapsibleContent>
                      <div className="mt-3 border-t pt-3">
                        <div className="rounded-lg border bg-muted/10 p-3">
                          <div className="space-y-2">
                            {mockVariants(test.id).map(v => (
                              <div key={v.id} className="flex items-center gap-3">
                                <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${v.is_winner ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                                  {v.variant_name}{v.is_winner && <Trophy className="h-3 w-3 ml-0.5" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="font-medium truncate">{v.variant_label}</span>
                                    <span className="text-muted-foreground">{v.open_rate}% open</span>
                                  </div>
                                  <Progress value={v.open_rate} className="mt-1 h-1" />
                                </div>

                                <div className="text-right text-xs w-24">
                                  <p className="font-medium leading-4">{v.click_rate}% CTR</p>
                                  <p className="text-muted-foreground leading-4">{v.sent_count} sent</p>
                                </div>

                                {test.status === 'completed' && !v.is_winner && (
                                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => handleSelectWinner(test.id, v.id)}>
                                    <Trophy className="h-3 w-3 mr-1" />Pick
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  )}
                </div>
              </Card>
            </Collapsible>
          ))}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create A/B Test</DialogTitle>
            <DialogDescription>Configure a test and define variants to compare performance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Test Name</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Subject Line Test" />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="What are you testing?" rows={2} />
              </div>
              <div>
                <Label>Test Type</Label>
                <Select value={formData.test_type} onValueChange={v => setFormData({ ...formData, test_type: v as typeof formData.test_type })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email_subject">Email Subject</SelectItem>
                    <SelectItem value="email_content">Email Content</SelectItem>
                    <SelectItem value="sms_content">SMS Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Winner Criteria</Label>
                <Select value={formData.winner_criteria} onValueChange={v => setFormData({ ...formData, winner_criteria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open_rate">Open Rate</SelectItem>
                    <SelectItem value="click_rate">Click Rate</SelectItem>
                    <SelectItem value="reply_rate">Reply Rate</SelectItem>
                    <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Min Sample Size</Label>
                <Input type="number" value={formData.min_sample_size} onChange={e => setFormData({ ...formData, min_sample_size: +e.target.value })} />
              </div>
              <div>
                <Label>Duration (hours)</Label>
                <Input type="number" value={formData.test_duration_hours} onChange={e => setFormData({ ...formData, test_duration_hours: +e.target.value })} />
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <Label>Auto-select winner when criteria met</Label>
                <Switch checked={formData.auto_select_winner} onCheckedChange={v => setFormData({ ...formData, auto_select_winner: v })} />
              </div>
            </div>

            {/* Variants */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Variants</h4>
                <Button size="sm" variant="outline" onClick={addVariant} disabled={formData.variants.length >= 5}><Plus className="h-3 w-3 mr-1" />Add</Button>
              </div>
              {formData.variants.map((v, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">{v.variant_name}</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input placeholder="Label" value={v.variant_label} onChange={e => {
                        const variants = [...formData.variants];
                        variants[i].variant_label = e.target.value;
                        setFormData({ ...formData, variants });
                      }} className="h-8" />
                      {v.is_control && <Badge variant="outline" className="shrink-0">Control</Badge>}
                    </div>
                    {formData.test_type.includes('subject') ? (
                      <Input placeholder="Subject line..." value={v.content.subject || ''} onChange={e => {
                        const variants = [...formData.variants];
                        variants[i].content = { ...variants[i].content, subject: e.target.value };
                        setFormData({ ...formData, variants });
                      }} className="h-8" />
                    ) : (
                      <Textarea placeholder={formData.test_type === 'sms_content' ? 'SMS message...' : 'Email content...'} value={v.content.body || ''} onChange={e => {
                        const variants = [...formData.variants];
                        variants[i].content = { ...variants[i].content, body: e.target.value };
                        setFormData({ ...formData, variants });
                      }} rows={2} />
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-16">Traffic:</span>
                      <Slider value={[v.traffic_percentage]} onValueChange={([val]) => {
                        const variants = [...formData.variants];
                        variants[i].traffic_percentage = val;
                        setFormData({ ...formData, variants });
                      }} max={100} step={5} className="flex-1" />
                      <span className="text-xs font-medium w-10">{v.traffic_percentage}%</span>
                    </div>
                  </div>
                  {!v.is_control && formData.variants.length > 2 && (
                    <Button size="icon" variant="ghost" onClick={() => removeVariant(i)} className="shrink-0"><X className="h-4 w-4" /></Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings/View Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle><Eye className="h-4 w-4 inline mr-2" />Test Details</DialogTitle>
            <DialogDescription>Review configuration and status for the selected test.</DialogDescription>
          </DialogHeader>
          {selectedTest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Name:</span><p className="font-medium">{selectedTest.name}</p></div>
                <div><span className="text-muted-foreground">Status:</span><p>{getStatusBadge(selectedTest.status)}</p></div>
                <div><span className="text-muted-foreground">Type:</span><p className="font-medium capitalize">{selectedTest.test_type.replace(/_/g, ' ')}</p></div>
                <div><span className="text-muted-foreground">Criteria:</span><p className="font-medium capitalize">{selectedTest.winner_criteria.replace(/_/g, ' ')}</p></div>
                <div><span className="text-muted-foreground">Sample Size:</span><p className="font-medium">{selectedTest.min_sample_size}</p></div>
                <div><span className="text-muted-foreground">Duration:</span><p className="font-medium">{selectedTest.test_duration_hours}h</p></div>
                <div><span className="text-muted-foreground">Auto Winner:</span><p className="font-medium">{selectedTest.auto_select_winner ? 'Yes' : 'No'}</p></div>
                <div><span className="text-muted-foreground">Created:</span><p className="font-medium">{new Date(selectedTest.created_at).toLocaleDateString()}</p></div>
              </div>
              {selectedTest.description && <div><span className="text-muted-foreground text-sm">Description:</span><p className="text-sm">{selectedTest.description}</p></div>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

  );
}
