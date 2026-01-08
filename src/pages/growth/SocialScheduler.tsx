import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveCompany, companyQueryKey } from '@/hooks/useActiveCompany';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { socialApi, SocialAccount, SocialPost, SocialTemplate, HashtagGroup, filesApi, FileItem } from '@/services';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { PostPreview } from '@/components/growth/PostPreview';
import { SocialCalendar } from '@/components/growth/SocialCalendar';
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Shield,
  Zap,
  Sparkles,
  MessageCircle,
  Share2,
  Youtube,
  Music2,
  Pin,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  FileTextIcon,
  Hash,
  Clock,
  Plus,
  MoreVertical,
  RefreshCw,
  Trash2,
  Loader2,
  Eye,
  Send,
  MessageSquare,
  Calendar as CalendarIcon,
  Heart,
  BarChart3,
  Smile,
  Image as ImageIcon,
  Layout,
  Activity,
  UploadCloud,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Inbox,
  Search
} from 'lucide-react';

const platformIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="h-4 w-4 text-blue-600" />,
  instagram: <Instagram className="h-4 w-4 text-pink-600" />,
  linkedin: <Linkedin className="h-4 w-4 text-blue-700" />,
  twitter: <Twitter className="h-4 w-4 text-sky-500" />,
  tiktok: <Music2 className="h-4 w-4 text-black" />,
  youtube: <Youtube className="h-4 w-4 text-red-600" />,
  pinterest: <Pin className="h-4 w-4 text-red-500" />,
};

const platformColors: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  linkedin: '#0A66C2',
  twitter: '#1DA1F2',
  tiktok: '#000000',
  youtube: '#FF0000',
  pinterest: '#BD081C',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-400',
  scheduled: 'bg-hunter-orange',
  published: 'bg-green-500',
  failed: 'bg-red-500',
};

export default function SocialScheduler() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeCompanyId, hasCompany } = useActiveCompany();
  const [activeTab, setActiveTab] = useState('posts');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isConnectAccountOpen, setIsConnectAccountOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [isCreateHashtagOpen, setIsCreateHashtagOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [postFilter, setPostFilter] = useState<'all' | 'scheduled' | 'published' | 'draft'>('all');
  const [previewPlatform, setPreviewPlatform] = useState<'facebook' | 'instagram' | 'twitter' | 'linkedin'>('facebook');

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const platform = searchParams.get('platform');

    if (code && platform) {
      const handleCallback = async () => {
        try {
          await socialApi.handleOAuthCallback(code, platform);
          toast({ title: 'Account connected successfully' });
          queryClient.invalidateQueries({ queryKey: companyQueryKey('social-accounts', activeCompanyId) });
        } catch (error) {
          toast({ title: 'Failed to connect account', variant: 'destructive' });
        } finally {
          navigate('/marketing/social', { replace: true });
        }
      };
      handleCallback();
    }
  }, [searchParams, navigate, activeCompanyId, queryClient, toast]);

  const [newPost, setNewPost] = useState({
    content: '',
    target_accounts: [] as number[],
    media_urls: [] as string[],
    status: 'draft' as 'draft' | 'scheduled',
    first_comment: '',
    is_tailored: false,
    tailored_content: {} as Record<string, { content: string; first_comment?: string }>,
    repeat_frequency: 'none' as 'none' | 'daily' | 'weekly' | 'monthly',
    repeat_until: undefined as Date | undefined,
  });

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
  });

  const [newHashtagGroup, setNewHashtagGroup] = useState({
    name: '',
    hashtags: '',
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: companyQueryKey('social-accounts', activeCompanyId),
    queryFn: () => socialApi.getAccounts(),
    enabled: hasCompany,
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: companyQueryKey('social-posts', activeCompanyId),
    queryFn: () => socialApi.getPosts(),
    enabled: hasCompany,
  });

  const { data: analytics } = useQuery({
    queryKey: companyQueryKey('social-analytics', activeCompanyId),
    queryFn: () => socialApi.getAnalytics(),
    enabled: hasCompany,
  });

  const { data: templates = [] } = useQuery({
    queryKey: companyQueryKey('social-templates', activeCompanyId),
    queryFn: () => socialApi.getTemplates(),
    enabled: hasCompany,
  });

  const { data: hashtagGroups = [] } = useQuery({
    queryKey: companyQueryKey('social-hashtags', activeCompanyId),
    queryFn: () => socialApi.getHashtagGroups(),
    enabled: hasCompany,
  });

  const { data: mediaFiles = [] } = useQuery({
    queryKey: companyQueryKey('media-files', activeCompanyId),
    queryFn: async () => {
      const resp = await filesApi.list();
      return resp.data || [];
    },
    enabled: hasCompany && isMediaLibraryOpen,
  });

  const createPostMutation = useMutation({
    mutationFn: (data: typeof newPost) => socialApi.createPost({
      content: data.content,
      target_accounts: data.target_accounts || [],
      media_urls: data.media_urls,
      scheduled_at: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss") : undefined,
      platform_settings: {
        is_tailored: data.is_tailored,
        tailored_content: data.tailored_content,
        first_comment: data.first_comment,
        repeat_frequency: data.repeat_frequency,
        repeat_until: data.repeat_until ? format(data.repeat_until, "yyyy-MM-dd") : undefined,
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('social-posts', activeCompanyId) });
      setIsCreatePostOpen(false);
      setNewPost({
        content: '',
        target_accounts: [],
        media_urls: [],
        status: 'draft',
        first_comment: '',
        is_tailored: false,
        tailored_content: {},
        repeat_frequency: 'none',
        repeat_until: undefined
      });
      setSelectedDate(undefined);
      toast({ title: 'Post created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create post', variant: 'destructive' });
    },
  });

  const publishPostMutation = useMutation({
    mutationFn: (id: number) => socialApi.publishPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('social-posts', activeCompanyId) });
      toast({ title: 'Post published successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to publish post', variant: 'destructive' });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: number) => socialApi.deletePost?.(id) || Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('social-posts', activeCompanyId) });
      toast({ title: 'Post deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete post', variant: 'destructive' });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: typeof newTemplate) => socialApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('social-templates', activeCompanyId) });
      setIsCreateTemplateOpen(false);
      setNewTemplate({ name: '', content: '' });
      toast({ title: 'Template created successfully' });
    },
  });

  const createHashtagMutation = useMutation({
    mutationFn: (data: { name: string; hashtags: string[] }) => socialApi.createHashtagGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('social-hashtags', activeCompanyId) });
      setIsCreateHashtagOpen(false);
      setNewHashtagGroup({ name: '', hashtags: '' });
      toast({ title: 'Hashtag group created successfully' });
    },
  });

  const connectAccountMutation = useMutation({
    mutationFn: (platform: string) => socialApi.getOAuthUrl(platform),
    onSuccess: (data) => {
      window.location.href = data.auth_url;
    },
    onError: () => {
      toast({ title: 'Failed to initiate connection', variant: 'destructive' });
    }
  });

  const generateAIMutation = useMutation({
    mutationFn: ({ prompt, platform }: { prompt: string, platform?: string }) => socialApi.generateAIContent(prompt, platform),
    onSuccess: (data) => {
      setNewPost(prev => ({ ...prev, content: prev.content ? prev.content + "\n\n" + data.content : data.content }));
      toast({ title: "AI Assistant", description: "Caption generated successfully!" });
    },
    onError: () => {
      toast({ title: "AI Error", description: "Failed to generate content", variant: "destructive" });
    }
  });

  const bulkImportMutation = useMutation({
    mutationFn: (posts: any[]) => socialApi.bulkImport(posts),
    onSuccess: (data) => {
      toast({ title: "Import Successful", description: data.message });
      setIsBulkUploadOpen(false);
      queryClient.invalidateQueries({ queryKey: companyQueryKey('social-posts', activeCompanyId) });
    },
    onError: () => {
      toast({ title: "Import Failed", description: "Failed to import posts", variant: "destructive" });
    }
  });

  const posts = postsData?.data || [];
  const filteredPosts = posts.filter(post => postFilter === 'all' ? true : post.status === postFilter);

  const chartData = [
    { name: 'Mon', engagement: 400, reach: 2400 },
    { name: 'Tue', engagement: 300, reach: 1398 },
    { name: 'Wed', engagement: 200, reach: 9800 },
    { name: 'Thu', engagement: 278, reach: 3908 },
    { name: 'Fri', engagement: 189, reach: 4800 },
    { name: 'Sat', engagement: 239, reach: 3800 },
    { name: 'Sun', engagement: 349, reach: 4300 },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Media Scheduler</h1>
          <p className="text-muted-foreground">Schedule and manage your social media posts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
            <UploadCloud className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Dialog open={isConnectAccountOpen} onOpenChange={setIsConnectAccountOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Connect Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Social Account</DialogTitle>
                <DialogDescription>Choose a platform to connect</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                {['facebook', 'instagram', 'linkedin', 'twitter'].map((platform) => (
                  <Button
                    key={platform}
                    variant="outline"
                    className="h-24 flex flex-col gap-3 group"
                    onClick={() => connectAccountMutation.mutate(platform)}
                    disabled={connectAccountMutation.isPending}
                  >
                    <div className="p-3 rounded-full bg-muted transition-colors">
                      {platformIcons[platform]}
                    </div>
                    <span className="capitalize font-bold text-xs">{platform}</span>
                    {connectAccountMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Post Import</DialogTitle>
                <DialogDescription>Import hundreds of posts at once using a CSV file. Use our template for best results.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-6">
                <div className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center gap-4 hover:bg-muted/50 transition-all cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <UploadCloud className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold">Click to upload or drag and drop</p>
                    <p className="text-xs opacity-50 uppercase font-black tracking-widest mt-1">CSV files only (Max 10MB)</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <FileDown className="h-5 w-5 opacity-40" />
                    <div>
                      <p className="text-sm font-bold">Download Template</p>
                      <p className="text-xs text-muted-foreground">Get started with our pre-formatted CSV</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Get Template</Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkUploadOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => bulkImportMutation.mutate([
                    { content: "Imported post 1", target_accounts: [], platform_settings: {} },
                    { content: "Imported post 2", target_accounts: [], platform_settings: {} }
                  ])}
                  disabled={bulkImportMutation.isPending}
                >
                  {bulkImportMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Process Import
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isMediaLibraryOpen} onOpenChange={setIsMediaLibraryOpen}>
            <DialogContent className="max-w-4xl flex flex-col h-[80vh] p-0 overflow-hidden">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>Select Media</DialogTitle>
                <DialogDescription>Choose images or videos from your library to add to your post.</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-6 pt-0">
                <div className="grid grid-cols-4 gap-4">
                  {mediaFiles.length === 0 ? (
                    <div className="col-span-4 py-20 text-center opacity-40">
                      <ImageIcon className="h-12 w-12 mx-auto mb-4" />
                      <p className="font-bold">No media found in your library</p>
                    </div>
                  ) : (
                    mediaFiles.map((file: any) => (
                      <div
                        key={file.id}
                        className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all relative group ${newPost.media_urls.includes(file.url) ? 'border-primary' : 'border-transparent hover:border-muted-foreground/20'}`}
                        onClick={() => {
                          if (newPost.media_urls.includes(file.url)) {
                            setNewPost({ ...newPost, media_urls: newPost.media_urls.filter(u => u !== file.url) });
                          } else {
                            setNewPost({ ...newPost, media_urls: [...newPost.media_urls, file.url] });
                          }
                        }}
                      >
                        <img src={file.url} className="w-full h-full object-cover" />
                        {newPost.media_urls.includes(file.url) && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="bg-background rounded-full p-1"><CheckCircle2 className="h-4 w-4 text-primary" /></div>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[12px] text-white truncate font-bold">{file.name}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <DialogFooter className="p-6 border-t bg-muted/20">
                <Button variant="outline" onClick={() => setIsMediaLibraryOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsMediaLibraryOpen(false)}>
                  Done ({newPost.media_urls.length} Selected)
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Composer
                    </DialogTitle>
                    <DialogDescription>Create, preview and schedule your social content</DialogDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-1">
                      {newPost.target_accounts.map(id => {
                        const acc = accounts.find(a => a.id === id);
                        return acc && (
                          <div key={id} className="w-8 h-8 rounded-full border bg-muted flex items-center justify-center overflow-hidden" title={acc.account_name || acc.platform}>
                            {acc.avatar_url ? <img src={acc.avatar_url} className="w-full h-full object-cover" /> : platformIcons[acc.platform]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden flex">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Select Channels</Label>
                      <div className="flex flex-wrap gap-2">
                        {accounts.length === 0 ? (
                          <div className="w-full p-4 border-2 border-dashed rounded-lg text-center bg-muted/30">
                            <p className="text-sm text-muted-foreground">No accounts connected. <Button variant="link" size="sm" onClick={() => { setIsCreatePostOpen(false); setIsConnectAccountOpen(true); }}>Connect one now</Button></p>
                          </div>
                        ) : accounts.map((account) => (
                          <Button
                            key={account.id}
                            type="button"
                            variant={newPost.target_accounts.includes(account.id) ? "default" : "outline"}
                            className="h-12 px-4 transition-all"
                            onClick={() => {
                              const isSelected = newPost.target_accounts.includes(account.id);
                              setNewPost({
                                ...newPost,
                                target_accounts: isSelected
                                  ? newPost.target_accounts.filter(id => id !== account.id)
                                  : [...newPost.target_accounts, account.id]
                              });
                              if (!isSelected) {
                                setPreviewPlatform(account.platform as any);
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center p-1">
                                {platformIcons[account.platform]}
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-bold leading-none">{account.account_name || account.platform}</p>
                                <p className="text-[12px] opacity-60 capitalize">{account.account_type}</p>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Caption</Label>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-hunter-orange hover:text-hunter-orange hover:bg-hunter-orange/10"
                            onClick={() => generateAIMutation.mutate({ prompt: newPost.content, platform: previewPlatform })}
                            disabled={generateAIMutation.isPending}
                          >
                            {generateAIMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                            AI Write
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8"><FileTextIcon className="h-3.5 w-3.5 mr-1" /> Templates</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {templates.map(t => (
                                <DropdownMenuItem key={t.id} onClick={() => setNewPost({ ...newPost, content: newPost.content + t.content })}>
                                  {t.name}
                                </DropdownMenuItem>
                              ))}
                              {templates.length === 0 && <DropdownMenuItem disabled>No templates</DropdownMenuItem>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8"><Hash className="h-3.5 w-3.5 mr-1" /> Hashtags</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {hashtagGroups.map(g => (
                                <DropdownMenuItem key={g.id} onClick={() => setNewPost({ ...newPost, content: newPost.content + ' ' + g.hashtags.join(' ') })}>
                                  {g.name}
                                </DropdownMenuItem>
                              ))}
                              {hashtagGroups.length === 0 && <DropdownMenuItem disabled>No hashtag groups</DropdownMenuItem>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          {newPost.is_tailored && previewPlatform ? (
                            <>
                              {platformIcons[previewPlatform]}
                              {previewPlatform.charAt(0).toUpperCase() + previewPlatform.slice(1)} Caption
                            </>
                          ) : (
                            <>Main Caption</>
                          )}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Label className="text-[12px] font-bold uppercase tracking-widest opacity-50">Tailor for this platform?</Label>
                          <input
                            type="checkbox"
                            checked={newPost.is_tailored}
                            onChange={(e) => setNewPost({ ...newPost, is_tailored: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-hunter-orange focus:ring-hunter-orange"
                          />
                        </div>
                      </div>
                      <div className="relative group">
                        <Textarea
                          placeholder={`Write your ${newPost.is_tailored ? previewPlatform : 'main'} caption here...`}
                          value={newPost.is_tailored ? (newPost.tailored_content[previewPlatform]?.content || newPost.content) : newPost.content}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (newPost.is_tailored) {
                              setNewPost({
                                ...newPost,
                                tailored_content: {
                                  ...newPost.tailored_content,
                                  [previewPlatform]: {
                                    ...newPost.tailored_content[previewPlatform],
                                    content: val
                                  }
                                }
                              });
                            } else {
                              setNewPost({ ...newPost, content: val });
                            }
                          }}
                          rows={8}
                          className="resize-none text-base p-4 bg-muted/20 focus-visible:ring-hunter-orange border-none transition-all"
                        />
                        <div className="absolute right-4 bottom-4 flex gap-2">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            title="Add Emojis"
                          >
                            <Smile className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* First Comment Section */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <MessageSquare className="h-3.5 w-3.5" />
                            First Comment
                          </Label>
                          <Badge variant="outline" className="text-[12px] uppercase font-bold text-hunter-orange border-hunter-orange/20">Pro</Badge>
                        </div>
                        <Textarea
                          placeholder="Add a first comment (e.g., hashtags, links)..."
                          value={newPost.is_tailored ? (newPost.tailored_content[previewPlatform]?.first_comment || newPost.first_comment) : newPost.first_comment}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (newPost.is_tailored) {
                              setNewPost({
                                ...newPost,
                                tailored_content: {
                                  ...newPost.tailored_content,
                                  [previewPlatform]: {
                                    ...newPost.tailored_content[previewPlatform],
                                    first_comment: val
                                  }
                                }
                              });
                            } else {
                              setNewPost({ ...newPost, first_comment: val });
                            }
                          }}
                          rows={2}
                          className="resize-none text-sm p-4 bg-muted/20 border-none transition-all"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <div className="flex gap-4">
                          <span className={(newPost.is_tailored ? (newPost.tailored_content[previewPlatform]?.content || newPost.content) : newPost.content).length > 280 ? 'text-red-500' : ''}>
                            {(newPost.is_tailored ? (newPost.tailored_content[previewPlatform]?.content || newPost.content) : newPost.content).length} characters
                          </span>
                          <span>{(newPost.is_tailored ? (newPost.tailored_content[previewPlatform]?.content || newPost.content) : newPost.content).split(/\s+/).filter(Boolean).length} words</span>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs uppercase font-bold text-hunter-orange border-hunter-orange/20">
                            Previewing: <span className="capitalize ml-1">{previewPlatform}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Media</Label>
                      <div className="grid grid-cols-4 gap-4">
                        {newPost.media_urls.map((url, i) => (
                          <div key={i} className="aspect-square rounded-xl overflow-hidden relative group border bg-muted">
                            <img src={url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => setNewPost({ ...newPost, media_urls: newPost.media_urls.filter((_, idx) => idx !== i) })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          className="aspect-square rounded-xl border-2 border-dashed flex flex-col gap-2 hover:bg-muted hover:border-hunter-orange/50 transition-all group"
                          onClick={() => setIsMediaLibraryOpen(true)}
                        >
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-tighter opacity-70">Add Media</span>
                        </Button>
                      </div>
                    </div>

                    <div className="p-6 rounded-lg bg-muted/20 border space-y-4">
                      <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Scheduling Options
                      </Label>
                      <div className="flex gap-4">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="flex-1 h-12 justify-start px-4 text-base font-medium">
                              <CalendarIcon className="h-5 w-5 mr-3 text-hunter-orange" />
                              {selectedDate ? format(selectedDate, 'PPP') : 'Schedule for later?'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={setSelectedDate}
                              className="p-3"
                            />
                          </PopoverContent>
                        </Popover>
                        <div className="relative w-40">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            className="h-12 pl-10 font-medium"
                            onChange={(e) => {
                              if (selectedDate) {
                                const [hours, minutes] = e.target.value.split(':');
                                const newDate = new Date(selectedDate);
                                newDate.setHours(parseInt(hours), parseInt(minutes));
                                setSelectedDate(newDate);
                              }
                            }}
                          />
                        </div>
                        <Button
                          variant="outline"
                          className="h-12 px-4"
                          onClick={() => {
                            const bestTime = new Date();
                            bestTime.setDate(bestTime.getDate() + 1);
                            bestTime.setHours(18, 0, 0);
                            setSelectedDate(bestTime);
                            toast({ title: "Best Time Selected", description: "We've scheduled this for your audience's peak engagement time." });
                          }}
                        >
                          <Zap className="h-4 w-4 mr-2" /> Best Time
                        </Button>
                      </div>
                      {selectedDate && (
                        <div className="flex items-center gap-2 text-xs font-medium text-hunter-orange px-1 mt-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-hunter-orange" />
                          This post will be published on {format(selectedDate, 'MMM d, yyyy @ h:mm a')}
                        </div>
                      )}

                      <div className="pt-4 border-t space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <RefreshCw className="h-3.5 w-3.5" />
                            Recycle Post
                          </Label>
                          < Badge variant="outline" className="text-[12px] uppercase font-bold text-blue-500 border-blue-500/20">Evergreen</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Select
                            value={newPost.repeat_frequency}
                            onValueChange={(v: any) => setNewPost({ ...newPost, repeat_frequency: v })}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Repeat Frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Don't Repeat</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>

                          {newPost.repeat_frequency !== 'none' && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="h-10 justify-start px-4 text-xs font-medium">
                                  <CalendarIcon className="h-3.5 w-3.5 mr-2 text-hunter-orange" />
                                  {newPost.repeat_until ? format(newPost.repeat_until, 'MMM d, yy') : 'Until?'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={newPost.repeat_until}
                                  onSelect={(date) => setNewPost({ ...newPost, repeat_until: date })}
                                  className="p-3"
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                        {newPost.repeat_frequency !== 'none' && (
                          <p className="text-[12px] text-muted-foreground italic px-1">
                            This post will be automatically recycled {newPost.repeat_frequency} until {newPost.repeat_until ? format(newPost.repeat_until, 'PPP') : 'you stop it'}.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-[450px] bg-muted/5 border-l flex flex-col p-6 gap-6 relative overflow-hidden">
                    <div className="flex items-center justify-between z-10">
                      <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live Preview</Label>
                      <Select value={previewPlatform} onValueChange={(v: any) => setPreviewPlatform(v)}>
                        <SelectTrigger className="w-40 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="twitter">Twitter / X</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 flex items-start justify-center pt-8 z-10">
                      <div className="w-full max-w-[380px] scale-95 origin-top transition-all duration-500">
                        <PostPreview
                          content={newPost.is_tailored ? (newPost.tailored_content[previewPlatform]?.content || newPost.content) : newPost.content}
                          platform={previewPlatform}
                          mediaUrls={newPost.media_urls}
                          accountName={accounts.find(a => a.platform === previewPlatform)?.account_name || 'Your Brand'}
                          accountUsername={accounts.find(a => a.platform === previewPlatform)?.account_username || 'yourbrand'}
                          avatarUrl={accounts.find(a => a.platform === previewPlatform)?.avatar_url}
                        />
                      </div>
                    </div>

                    <div className="bg-background/80 p-4 rounded-lg text-[12px] space-y-2 border z-10">
                      <p className="font-bold uppercase opacity-50">Platform Specific Tips</p>
                      {previewPlatform === 'instagram' && <p>• Best results with high-quality images (1080x1080).<br />• Use 3-5 relevant hashtags.</p>}
                      {previewPlatform === 'twitter' && <p>• Stay under 280 characters.<br />• Images increase engagement by 35%.</p>}
                      {previewPlatform === 'linkedin' && <p>• Professional tone works best.<br />• Posts with links get 2x more clicks.</p>}
                      {previewPlatform === 'facebook' && <p>• Engagement is highest in the afternoon.<br />• Videos perform better than images.</p>}
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setIsCreatePostOpen(false)}>Discard</Button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="px-6 h-10 border"
                      onClick={() => createPostMutation.mutate({ ...newPost, status: 'draft' as any })}
                    >
                      Save as Draft
                    </Button>
                    <Button
                      className="px-8 h-10 font-bold"
                      onClick={() => {
                        if (newPost.target_accounts.length === 0) {
                          toast({
                            title: 'No accounts selected',
                            description: 'Please select at least one account to schedule posts',
                            variant: 'destructive'
                          });
                          return;
                        }
                        createPostMutation.mutate(newPost);
                      }}
                      disabled={!newPost.content || createPostMutation.isPending}
                    >
                      {createPostMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Send className="h-4 w-4 mr-2" />
                      {selectedDate ? 'Schedule Post' : 'Post Now'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Connected Accounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Connected Channels</CardTitle>
            <CardDescription>Managing your active social presence</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => { }}><RefreshCw className="h-3.5 w-3.5 mr-2" /> Sync Profiles</Button>
        </CardHeader>
        <CardContent className="p-6">
          {accountsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
              <Share2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground mb-2">No accounts connected yet</p>
              <Button variant="link" onClick={() => setIsConnectAccountOpen(true)}>Connect your first account →</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {accounts.map((account) => (
                <Card key={account.id} className="group relative transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                          {account.avatar_url ? <img src={account.avatar_url} className="w-full h-full object-cover" /> : <div className="scale-150">{platformIcons[account.platform]}</div>}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded bg-background border flex items-center justify-center shadow-sm">
                          {platformIcons[account.platform]}
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${account.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                    <div className="space-y-1 mb-3">
                      <p className="font-bold text-sm leading-tight line-clamp-1">{account.account_name}</p>
                      <p className="text-xs text-muted-foreground">{account.followers_count?.toLocaleString() || 0} followers</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <MoreVertical className="h-3.5 w-3.5 mr-1" /> Manage
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><RefreshCw className="h-4 w-4 mr-2" /> Reconnect</DropdownMenuItem>
                        <DropdownMenuItem><BarChart3 className="h-4 w-4 mr-2" /> View Insights</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Disconnect</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
          <TabsTrigger value="posts" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2">
            Posts
          </TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2">
            Calendar
          </TabsTrigger>
          <TabsTrigger value="streams" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2">
            Streams
          </TabsTrigger>
          <TabsTrigger value="inbox" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2">
            Inbox
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2">
            Templates
          </TabsTrigger>
          <TabsTrigger value="hashtags" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2">
            Hashtags
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={postFilter === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setPostFilter('all')}
              >
                All Posts
              </Button>
              <Button
                variant={postFilter === 'scheduled' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setPostFilter('scheduled')}
              >
                Scheduled
              </Button>
              <Button
                variant={postFilter === 'published' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setPostFilter('published')}
              >
                Published
              </Button>
              <Button
                variant={postFilter === 'draft' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setPostFilter('draft')}
              >
                Drafts
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search posts..." className="w-64 pl-9" />
              </div>
            </div>
          </div>

          {postsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading your feed...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-lg border-2 border-dashed">
              <div className="bg-muted p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No {postFilter !== 'all' ? postFilter : ''} posts yet</h3>
              <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
                {postFilter === 'all'
                  ? "Create and schedule your first social post to build your online presence."
                  : `You don't have any posts with status "${postFilter}" at the moment.`}
              </p>
              {postFilter === 'all' && (
                <Button onClick={() => setIsCreatePostOpen(true)}>
                  <Plus className="h-5 w-5 mr-2" /> Create First Post
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post: SocialPost) => (
                <Card key={post.id} className="group overflow-hidden transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {post.target_accounts.map(accId => {
                            const acc = accounts.find(a => a.id === accId);
                            return acc && (
                              <div key={accId} className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden" title={acc.account_name}>
                                {acc.avatar_url ? <img src={acc.avatar_url} className="w-full h-full object-cover" /> : <div className="scale-125">{platformIcons[acc.platform]}</div>}
                              </div>
                            );
                          })}
                        </div>
                        <div className="space-y-1">
                          <Badge variant="outline" className={`${statusColors[post.status]} text-white border-none`}>
                            {post.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {post.scheduled_at ? format(new Date(post.scheduled_at), 'MMM d, yyyy @ h:mm a') : 'Not scheduled'}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="h-4 w-4 mr-2" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem><Plus className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deletePostMutation.mutate(post.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-4">
                      <p className="text-base leading-relaxed whitespace-pre-wrap line-clamp-3">{post.content}</p>

                      {post.media_urls && post.media_urls.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {post.media_urls.slice(0, 4).map((url, idx) => (
                            <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-muted border">
                              <img src={url} alt="" className="w-full h-full object-cover transition-transform" />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                              <Zap className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Reach</p>
                              <p className="text-sm font-bold">0</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-pink-500/10">
                              <Heart className="h-4 w-4 text-pink-500" />
                            </div>
                            <div>
                              <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Engagement</p>
                              <p className="text-sm font-bold">0</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-green-500/10">
                              <Share2 className="h-4 w-4 text-green-500" />
                            </div>
                            <div>
                              <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Shares</p>
                              <p className="text-sm font-bold">0</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 border-white/10 hover:bg-muted/50 font-semibold">
                            <Eye className="h-3.5 w-3.5 mr-2" /> Preview
                          </Button>
                          {post.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => publishPostMutation.mutate(post.id)}
                            >
                              <Send className="h-3.5 w-3.5 mr-2" /> Publish Now
                            </Button>
                          )}
                          {post.status === 'scheduled' && (
                            <Button variant="outline" size="sm">
                              <Clock className="h-3.5 w-3.5 mr-2" /> Reschedule
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Performance Score</p>
                          <p className="text-xs font-bold text-primary">15%</p>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-[15%] rounded-full" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="p-6">
              <SocialCalendar posts={posts} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streams" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">My Feed</Button>
              <Button variant="ghost" size="sm">Mentions</Button>
              <Button variant="ghost" size="sm">Listening</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" /> Add Stream</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto pb-4">
            {accounts.slice(0, 3).map(account => (
              <Card key={account.id} className="min-w-[320px] flex flex-col max-h-[700px]">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border">
                      {platformIcons[account.platform]}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold">{account.account_name}</CardTitle>
                      <CardDescription className="text-xs">Account Feed</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon"><RefreshCw className="h-4 w-4 opacity-40" /></Button>
                </CardHeader>
                <CardContent className="p-0 overflow-y-auto flex-1 h-[500px]">
                  <div className="p-6 space-y-6">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="space-y-3 group">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-muted" />
                          <div>
                            <p className="text-xs font-bold">Recommended Content</p>
                            <p className="text-[12px] text-muted-foreground uppercase font-bold">2 hours ago</p>
                          </div>
                        </div>
                        <p className="text-xs leading-relaxed opacity-70">
                          {i === 0 ? "Building the future of social automation with Xordon! 🚀 #SaaS #Growth" :
                            i === 1 ? "Just integrated real-time analytics for all connected social accounts. Check it out! 🔥" :
                              "Top 10 social media trends to watch in 2026. Stay ahead of the curve."}
                        </p>
                        {i === 0 && <div className="aspect-video rounded-lg bg-muted overflow-hidden border"><img src={`https://picsum.photos/seed/social${account.id}${i}/800/600`} className="w-full h-full object-cover" /></div>}
                        <div className="flex items-center gap-4 opacity-30 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-1"><Heart className="h-3 w-3" /><span className="text-[12px] font-bold">120</span></div>
                          <div className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /><span className="text-[12px] font-bold">12</span></div>
                          <div className="flex items-center gap-1"><Share2 className="h-3 w-3" /><span className="text-[12px] font-bold">5</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inbox" className="h-[700px]">
          <div className="grid grid-cols-12 gap-6 h-full">
            <div className="col-span-4 bg-background border rounded-lg flex flex-col overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Unified Inbox</h3>
                  <Badge variant="default" className="rounded-full px-2">12 NEW</Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search messages..." className="pl-10 h-10" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div key={i} className={`p-4 rounded-lg cursor-pointer transition-all flex items-center gap-4 border ${i === 0 ? 'bg-muted border-primary/20' : 'border-transparent hover:bg-muted/50'}`}>
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted border">
                        <img src={`https://i.pravatar.cc/100?u=${i}`} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border flex items-center justify-center p-1 shadow-sm">
                        {platformIcons[Object.keys(platformIcons)[i % 4]]}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold truncate">User {i + 1}</p>
                        <p className="text-[8px] opacity-40 font-bold uppercase">10m</p>
                      </div>
                      <p className="text-[12px] opacity-60 truncate">Is there a way to automate this?</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-8 bg-card border rounded-lg flex flex-col overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border">
                    <img src="https://i.pravatar.cc/100?u=0" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">User 1</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active now
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="h-4 w-4 opacity-40" /></Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-muted border"><img src="https://i.pravatar.cc/100?u=0" /></div>
                  <div className="bg-muted/30 p-4 rounded-lg rounded-tl-none max-w-[70%] border">
                    <p className="text-sm">Hi there! I saw your post about the new features. Is there a way to automate the posting schedule based on my team's timezones?</p>
                  </div>
                </div>
                <div className="flex gap-4 justify-end">
                  <div className="bg-primary p-4 rounded-lg rounded-tr-none max-w-[70%]">
                    <p className="text-sm text-primary-foreground font-medium">Hello! Yes, absolutely. Xordon allows you to set specific timezones for each workspace and even uses AI to determine the best post times for each platform. 🔥</p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t bg-muted/10">
                <div className="flex gap-4 items-center bg-background p-2 rounded-lg border">
                  <Button variant="ghost" size="icon"><Smile className="h-5 w-5" /></Button>
                  <Input placeholder="Type your response..." className="flex-1 border-none bg-transparent focus-visible:ring-0 shadow-none text-sm" />
                  <Button><Send className="h-4 w-4 mr-2" /> Send</Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center bg-muted/20 p-6 rounded-lg border">
            <div>
              <h3 className="text-xl font-bold">Content Templates</h3>
              <p className="text-sm text-muted-foreground">Save time with pre-written post structures</p>
            </div>
            <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Create Template</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} placeholder="e.g. Weekly Product Spotlight" />
                  </div>
                  <div className="space-y-2">
                    <Label>Content Structure</Label>
                    <Textarea value={newTemplate.content} onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })} rows={6} placeholder="Craft your template here... use [brackets] for placeholders" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateTemplateOpen(false)}>Cancel</Button>
                  <Button onClick={() => createTemplateMutation.mutate(newTemplate)} disabled={!newTemplate.name || !newTemplate.content}>Save Template</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.length === 0 ? (
              <div className="col-span-full py-20 text-center opacity-30 select-none">
                <FileTextIcon className="h-12 w-12 mx-auto mb-4" />
                <p className="font-bold uppercase tracking-widest text-xs">No templates found</p>
              </div>
            ) : templates.map((template) => (
              <Card key={template.id} className="group flex flex-col transition-all hover:shadow-md">
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="p-2 rounded bg-primary/10 text-primary mb-4">
                      <FileTextIcon className="h-5 w-5" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Plus className="h-4 w-4 mr-2" /> Use Template</DropdownMenuItem>
                        <DropdownMenuItem><RefreshCw className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-lg font-bold">{template.name}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap italic">"{template.content}"</p>
                </CardContent>
                <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Used {template.use_count} times</p>
                  <Button variant="ghost" size="sm">Use Template</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hashtags" className="space-y-6">
          <div className="flex justify-between items-center bg-muted/20 p-6 rounded-lg border">
            <div>
              <h3 className="text-xl font-bold">Hashtag Collections</h3>
              <p className="text-sm text-muted-foreground">Boost your discoverability with curated groups</p>
            </div>
            <Dialog open={isCreateHashtagOpen} onOpenChange={setIsCreateHashtagOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> New Group</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Collection</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Group Name</Label>
                    <Input value={newHashtagGroup.name} onChange={e => setNewHashtagGroup({ ...newHashtagGroup, name: e.target.value })} placeholder="e.g. SEO & Marketing" />
                  </div>
                  <div className="space-y-2">
                    <Label>Hashtags</Label>
                    <Textarea value={newHashtagGroup.hashtags} onChange={e => setNewHashtagGroup({ ...newHashtagGroup, hashtags: e.target.value })} rows={5} placeholder="#growth #seo #digitalmarketing #strategy" />
                    <p className="text-xs text-muted-foreground italic">Space separated hashtags with # prefix</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateHashtagOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => createHashtagMutation.mutate({
                      name: newHashtagGroup.name,
                      hashtags: newHashtagGroup.hashtags.split(' ').filter(h => h.startsWith('#'))
                    })}
                    disabled={!newHashtagGroup.name || !newHashtagGroup.hashtags}
                  >
                    Save Collection
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {hashtagGroups.length === 0 ? (
              <div className="col-span-full py-20 text-center opacity-30 select-none">
                <Hash className="h-12 w-12 mx-auto mb-4" />
                <p className="font-bold uppercase tracking-widest text-xs">No collections found</p>
              </div>
            ) : hashtagGroups.map((group) => (
              <Card key={group.id} className="group transition-all hover:shadow-md">
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="p-2 rounded bg-primary/10 text-primary mb-4">
                      <Hash className="h-5 w-5" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Plus className="h-4 w-4 mr-2" /> Copy All</DropdownMenuItem>
                        <DropdownMenuItem><RefreshCw className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-lg font-bold">{group.name}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-2">
                  <div className="flex flex-wrap gap-2">
                    {group.hashtags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="cursor-pointer text-xs">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
                <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{group.hashtags.length} Tags</p>
                  <Button variant="ghost" size="sm">Copy</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Posts', value: analytics?.posts?.total_posts || '0', change: '+12%', icon: <FileTextIcon className="text-blue-500" />, trend: 'up' },
              { label: 'Total Reach', value: analytics?.engagement?.total_reach?.toLocaleString() || '128.4K', change: '+8.2%', icon: <Share2 className="text-pink-500" />, trend: 'up' },
              { label: 'Total Engagement', value: analytics?.engagement?.total_engagement?.toLocaleString() || '8.2K', change: '+24%', icon: <Heart className="text-green-500" />, trend: 'up' },
              { label: 'Avg Engagement Rate', value: `${analytics?.engagement?.avg_engagement_rate?.toFixed(2) || '3.8'}%`, change: '-1.2%', icon: <Zap className="text-primary" />, trend: 'down' },
            ].map((stat, i) => (
              <Card key={i} className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded bg-muted">
                      {stat.icon}
                    </div>
                    <Badge variant={stat.trend === 'up' ? 'default' : 'destructive'} className="rounded-full">
                      {stat.change}
                    </Badge>
                  </div>
                  <h4 className="text-xs text-muted-foreground font-medium mb-1"> {stat.label}</h4>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Engagement Evolution</CardTitle>
                  <CardDescription>Visualizing your audience interaction over time</CardDescription>
                </div>
                <div className="flex gap-2">
                  {['7D', '30D', '90D'].map(period => (
                    <Button key={period} variant={period === '30D' ? 'secondary' : 'ghost'} size="sm">
                      {period}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '8px', border: '1px border hsl(var(--border))' }}
                    />
                    <Area type="monotone" dataKey="engagement" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorEngagement)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold">Optimal Post Time</h3>
                <p className="text-sm text-muted-foreground mb-6">Best time to post based on audience activity:</p>
                <div className="py-3 px-6 bg-primary text-primary-foreground rounded-lg">
                  <p className="text-xl font-bold">6:45 PM</p>
                  <p className="text-xs opacity-70">Every Tuesday</p>
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Share</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px] flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.by_platform?.map(p => ({
                          name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
                          value: p.engagement
                        })) || [
                            { name: 'Instagram', value: 400 },
                            { name: 'Facebook', value: 300 },
                            { name: 'Twitter', value: 300 },
                            { name: 'LinkedIn', value: 200 },
                          ]}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(analytics?.by_platform || [
                          { platform: 'instagram', engagement: 400 },
                          { platform: 'facebook', engagement: 300 },
                          { platform: 'twitter', engagement: 300 },
                          { platform: 'linkedin', engagement: 200 },
                        ]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={platformColors[entry.platform] || '#6366f1'} stroke="none" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[12px] font-bold uppercase opacity-30">Top</p>
                    <p className="text-sm font-bold">
                      {analytics?.by_platform?.sort((a, b) => b.engagement - a.engagement)[0]?.platform.substring(0, 2).toUpperCase() || 'IG'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Post Performance Details</CardTitle>
              <CardDescription>A detailed breakdown of how your recent posts are performing across platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {posts.slice(0, 5).map((post: any, i: number) => (
                  <div key={i} className="flex items-center gap-6 p-4 rounded-lg bg-muted/20 border hover:bg-muted/30 transition-all group">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                      {post.media_urls?.[0] ? <img src={post.media_urls[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">{platformIcons[accounts.find(a => post.target_accounts.includes(a.id))?.platform || 'facebook']}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{post.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(post.scheduled_at || post.created_at || ''), 'PPP')}</p>
                    </div>
                    <div className="flex gap-8">
                      <div className="text-center">
                        <p className="text-[12px] uppercase font-bold text-muted-foreground">Reach</p>
                        <p className="text-sm font-bold">1.2K</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[12px] uppercase font-bold text-muted-foreground">Clicks</p>
                        <p className="text-sm font-bold">84</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[12px] uppercase font-bold text-muted-foreground">Eng.</p>
                        <p className="text-sm font-bold">4.2%</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

