import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { listingsApi, ListingSettings } from '@/services/listingsApi';
import {
  Loader2, Save, Globe, MapPin, Phone, Facebook, Instagram,
  Twitter, Linkedin, Clock, Youtube, Music, Pin, Map,
  Languages, CreditCard, Tag, Briefcase, Award, Calendar,
  Image as ImageIcon, Search, Info, Bell, Shield, Settings2, Sparkles, RefreshCw, FileTextIcon
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUploader } from '@/components/FileUploader';
import { FileItem } from '@/services/filesApi';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ListingSettingsProps {
  activeCompanyId: number | null;
  defaultTab?: 'profile' | 'settings';
  hideTabs?: boolean;
}

// Separate component for integration tool to avoid hooks in map
interface IntegrationToolProps {
  tool: {
    name: string;
    desc: string;
    color: string;
    initial: string;
    requiresApiKey: boolean;
    apiKeyLabel: string;
    docsUrl: string;
  };
  formData: Partial<ListingSettings>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<ListingSettings>>>;
  onSync?: () => void;
}

function IntegrationTool({ tool, formData, setFormData, onSync }: IntegrationToolProps) {
  const { toast } = useToast();
  const integration = formData.integrations?.[tool.name];
  const isConnected = !!(integration && integration.api_key);
  const [showConfig, setShowConfig] = useState(false);
  const [apiKey, setApiKey] = useState(integration?.api_key || '');
  const [isTesting, setIsTesting] = useState(false);

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'API Key Required',
        description: `Please enter your ${tool.name} API key to connect.`,
        variant: 'destructive'
      });
      return;
    }

    setIsTesting(true);

    // Simulate API validation (replace with actual API call)
    setTimeout(() => {
      const newIntegrations = {
        ...(formData.integrations || {}),
        [tool.name]: {
          api_key: apiKey,
          connected_at: new Date().toISOString(),
          status: 'active'
        }
      };

      setFormData({ ...formData, integrations: newIntegrations });
      setShowConfig(false);
      setIsTesting(false);

      toast({
        title: `${tool.name} Connected`,
        description: `Successfully connected to ${tool.name}. You can now sync listings.`
      });
    }, 1500);
  };

  const handleDisconnect = () => {
    const newIntegrations = { ...(formData.integrations || {}) };
    delete newIntegrations[tool.name];

    setFormData({ ...formData, integrations: newIntegrations });
    setApiKey('');

    toast({
      title: `${tool.name} Disconnected`,
      description: `Successfully disconnected from ${tool.name}.`
    });
  };

  return (
    <div>
      <div className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${isConnected ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'}`}>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded bg-background flex items-center justify-center border font-bold ${tool.color}`}>
            {tool.initial}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{tool.name}</p>
              {isConnected ? (
                <Badge variant="default" className="bg-green-500 text-[12px] h-4 px-1">Connected</Badge>
              ) : (
                <Badge variant="secondary" className="text-[12px] h-4 px-1">Not Connected</Badge>
              )}
            </div>
            <p className="text-[12px] text-muted-foreground">{tool.desc}</p>
          </div>
        </div>
        <Button
          variant={isConnected ? "outline" : "default"}
          size="sm"
          className={`h-8 text-xs ${isConnected ? 'text-destructive hover:text-destructive' : ''}`}
          onClick={() => isConnected ? handleDisconnect() : setShowConfig(true)}
          type="button"
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </Button>
        {isConnected && onSync && (
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs ml-2"
            onClick={onSync}
            type="button"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Import / Sync
          </Button>
        )}
      </div>

      {showConfig && !isConnected && (
        <div className="mt-2 p-4 border rounded-lg bg-muted/30 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-3">
            <div>
              <Label htmlFor={`${tool.name}-api-key`} className="text-xs font-semibold">
                {tool.apiKeyLabel}
              </Label>
              <Input
                id={`${tool.name}-api-key`}
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1.5"
              />
              <p className="text-[12px] text-muted-foreground mt-1">
                Get your API key from{' '}
                <a href={tool.docsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {tool.name} Developer Portal
                </a>
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isTesting || !apiKey.trim()}
                className="flex-1"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowConfig(false);
                  setApiKey('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CommaInputProps {
  id: string;
  value: string[] | undefined;
  onChange: (val: string[]) => void;
  placeholder?: string;
  icon: React.ReactNode;
}

function CommaInput({ id, value, onChange, placeholder, icon }: CommaInputProps) {
  const [displayValue, setDisplayValue] = useState(value?.join(', ') || '');

  // Update display value when external value changes (e.g. on initial load)
  useEffect(() => {
    const valueStr = value?.join(', ') || '';
    // Only update if the parsed arrays are different to avoid jumping while typing
    const currentArray = displayValue.split(',').map(s => s.trim()).filter(Boolean);
    const propArray = value || [];
    if (JSON.stringify(currentArray) !== JSON.stringify(propArray)) {
      setDisplayValue(valueStr);
    }
  }, [value]);

  return (
    <div className="relative">
      <div className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground flex items-center justify-center">
        {icon}
      </div>
      <Input
        id={id}
        className="pl-9"
        value={displayValue}
        onChange={(e) => {
          const newValue = e.target.value;
          setDisplayValue(newValue);
          // Only update parent state on actual content changes
          onChange(newValue.split(',').map(s => s.trim()).filter(Boolean));
        }}
        placeholder={placeholder}
      />
    </div>
  );
}

export function ListingSettingsView({ activeCompanyId, defaultTab = 'profile', hideTabs = false }: ListingSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<ListingSettings>>({});
  const [activeInternalTab, setActiveInternalTab] = useState(defaultTab);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['listing-settings', activeCompanyId],
    queryFn: () => listingsApi.getListingSettings(),
    enabled: !!activeCompanyId,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  useEffect(() => {
    setActiveInternalTab(defaultTab);
  }, [defaultTab]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ListingSettings>) => listingsApi.updateListingSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-settings', activeCompanyId] });
      toast({ title: 'Settings saved successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeInternalTab} onValueChange={(v) => setActiveInternalTab(v as any)} className="w-full">
        {!hideTabs && (
          <TabsList className="mb-4 bg-muted/60 p-1">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Business Profile
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Platform Settings
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="profile" className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Default information used for all directory listings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name || ''}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year_established">Year Established</Label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="year_established"
                        type="number"
                        className="pl-9"
                        value={formData.year_established || ''}
                        onChange={(e) => setFormData({ ...formData, year_established: parseInt(e.target.value) || undefined })}
                        placeholder="2020"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">Short Description (Tagline)</Label>
                  <Textarea
                    id="short_description"
                    className="min-h-[60px]"
                    value={formData.short_description || ''}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="A brief tagline for your business..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Full Business Description</Label>
                  <Textarea
                    id="description"
                    className="min-h-[100px]"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell customers about your business in detail..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Full Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      className="pl-9 min-h-[80px]"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main St, City, State, Zip"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <div className="relative">
                    <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="country"
                      className="pl-9"
                      value={formData.country || ''}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="United States"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        className="pl-9"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website URL</Label>
                    <div className="relative">
                      <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website"
                        className="pl-9"
                        value={formData.website || ''}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <FileUploader
                      accept="image/*"
                      maxFiles={1}
                      folder="listings/logos"
                      existingFiles={formData.logo_url ? [{
                        id: 1,
                        workspace_id: 1,
                        company_id: null,
                        user_id: null,
                        filename: 'logo.png',
                        original_filename: 'Logo',
                        mime_type: 'image/png',
                        file_size: 0,
                        storage_path: formData.logo_url,
                        storage_provider: 'local' as const,
                        public_url: formData.logo_url,
                        folder: 'listings/logos',
                        category: 'image' as const,
                        entity_type: null,
                        entity_id: null,
                        metadata: null,
                        alt_text: null,
                        description: null,
                        is_public: true,
                        is_archived: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        url: formData.logo_url,
                      }] : []}
                      onUploadComplete={(files) => {
                        if (files.length > 0) {
                          setFormData({ ...formData, logo_url: files[0].url || files[0].public_url || '' });
                        }
                      }}
                      onFileRemove={() => {
                        setFormData({ ...formData, logo_url: '' });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cover Photo</Label>
                    <FileUploader
                      accept="image/*"
                      maxFiles={1}
                      folder="listings/covers"
                      existingFiles={formData.cover_photo_url ? [{
                        id: 2,
                        workspace_id: 1,
                        company_id: null,
                        user_id: null,
                        filename: 'cover.jpg',
                        original_filename: 'Cover Photo',
                        mime_type: 'image/jpeg',
                        file_size: 0,
                        storage_path: formData.cover_photo_url,
                        storage_provider: 'local' as const,
                        public_url: formData.cover_photo_url,
                        folder: 'listings/covers',
                        category: 'image' as const,
                        entity_type: null,
                        entity_id: null,
                        metadata: null,
                        alt_text: null,
                        description: null,
                        is_public: true,
                        is_archived: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        url: formData.cover_photo_url,
                      }] : []}
                      onUploadComplete={(files) => {
                        if (files.length > 0) {
                          setFormData({ ...formData, cover_photo_url: files[0].url || files[0].public_url || '' });
                        }
                      }}
                      onFileRemove={() => {
                        setFormData({ ...formData, cover_photo_url: '' });
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Gallery Images</Label>
                  <FileUploader
                    accept="image/*"
                    maxFiles={10}
                    folder="listings/gallery"
                    existingFiles={formData.gallery_images?.map((url, idx) => ({
                      id: 100 + idx,
                      workspace_id: 1,
                      company_id: null,
                      user_id: null,
                      filename: `gallery_${idx + 1}.jpg`,
                      original_filename: `Image ${idx + 1}`,
                      mime_type: 'image/jpeg',
                      file_size: 0,
                      storage_path: url,
                      storage_provider: 'local' as const,
                      public_url: url,
                      folder: 'listings/gallery',
                      category: 'image' as const,
                      entity_type: null,
                      entity_id: null,
                      metadata: null,
                      alt_text: null,
                      description: null,
                      is_public: true,
                      is_archived: false,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      url: url,
                    })) || []}
                    onUploadComplete={(files) => {
                      const newUrls = files.map(f => f.url || f.public_url || '').filter(Boolean);
                      setFormData({
                        ...formData,
                        gallery_images: [...(formData.gallery_images || []), ...newUrls]
                      });
                    }}
                    onFileRemove={(file) => {
                      // FileUploader passes the file item back. We need to find which URL it corresponds to.
                      // If it's an existing file (mocked), 'url' is the key.
                      // If it's a newly uploaded file (FileItem), 'url' or 'public_url' is the key.
                      const urlToRemove = file.url || file.public_url;
                      if (urlToRemove) {
                        setFormData({
                          ...formData,
                          gallery_images: (formData.gallery_images || []).filter(u => u !== urlToRemove)
                        });
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Media & Links</CardTitle>
                <CardDescription>Connect your social profiles to your listings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook URL</Label>
                    <div className="relative">
                      <Facebook className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="facebook"
                        className="pl-9"
                        value={formData.facebook_url || ''}
                        onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram URL</Label>
                    <div className="relative">
                      <Instagram className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="instagram"
                        className="pl-9"
                        value={formData.instagram_url || ''}
                        onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                        placeholder="https://instagram.com/yourprofile"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter URL</Label>
                    <div className="relative">
                      <Twitter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="twitter"
                        className="pl-9"
                        value={formData.twitter_url || ''}
                        onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                        placeholder="https://twitter.com/yourhandle"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn URL</Label>
                    <div className="relative">
                      <Linkedin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="linkedin"
                        className="pl-9"
                        value={formData.linkedin_url || ''}
                        onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                        placeholder="https://linkedin.com/company/yourcompany"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube URL</Label>
                    <div className="relative">
                      <Youtube className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="youtube"
                        className="pl-9"
                        value={formData.youtube_url || ''}
                        onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                        placeholder="https://youtube.com/c/yourchannel"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok URL</Label>
                    <div className="relative">
                      <Music className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="tiktok"
                        className="pl-9"
                        value={formData.tiktok_url || ''}
                        onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                        placeholder="https://tiktok.com/@yourhandle"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pinterest">Pinterest URL</Label>
                    <div className="relative">
                      <Pin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="pinterest"
                        className="pl-9"
                        value={formData.pinterest_url || ''}
                        onChange={(e) => setFormData({ ...formData, pinterest_url: e.target.value })}
                        placeholder="https://pinterest.com/yourprofile"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yelp">Yelp URL</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="yelp"
                        className="pl-9"
                        value={formData.yelp_url || ''}
                        onChange={(e) => setFormData({ ...formData, yelp_url: e.target.value })}
                        placeholder="https://yelp.com/biz/your-business"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google_maps">Google Maps URL</Label>
                  <div className="relative">
                    <Map className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="google_maps"
                      className="pl-9"
                      value={formData.google_maps_url || ''}
                      onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                      placeholder="https://goo.gl/maps/..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>Configure your operating hours for directory sync.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <div key={day} className="flex items-center justify-between text-sm">
                      <span className="font-medium w-24">{day}</span>
                      <div className="flex items-center gap-2">
                        <Input className="h-8 w-24 text-center" placeholder="9:00 AM" />
                        <span>to</span>
                        <Input className="h-8 w-24 text-center" placeholder="5:00 PM" />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[12px] text-muted-foreground mt-4 italic">Note: Hours are currently being synced with your main business profile.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
                <CardDescription>Specific details to help customers find and choose your business.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categories">Categories (comma-separated)</Label>
                  <CommaInput
                    id="categories"
                    value={formData.categories}
                    onChange={(val) => setFormData({ ...formData, categories: val })}
                    placeholder="Restaurant, Pizza, Delivery"
                    icon={<Tag className="h-4 w-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <CommaInput
                    id="keywords"
                    value={formData.keywords}
                    onChange={(val) => setFormData({ ...formData, keywords: val })}
                    placeholder="SEO, Marketing, Consulting"
                    icon={<Tag className="h-4 w-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="services">Services (comma-separated)</Label>
                  <CommaInput
                    id="services"
                    value={formData.services}
                    onChange={(val) => setFormData({ ...formData, services: val })}
                    placeholder="Web Design, SEO Audit, Content Strategy"
                    icon={<Briefcase className="h-4 w-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_methods">Payment Methods (comma-separated)</Label>
                  <CommaInput
                    id="payment_methods"
                    value={formData.payment_methods}
                    onChange={(val) => setFormData({ ...formData, payment_methods: val })}
                    placeholder="Visa, Mastercard, PayPal, Cash"
                    icon={<CreditCard className="h-4 w-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="languages">Languages Spoken (comma-separated)</Label>
                  <CommaInput
                    id="languages"
                    value={formData.languages}
                    onChange={(val) => setFormData({ ...formData, languages: val })}
                    placeholder="English, Spanish, French"
                    icon={<Languages className="h-4 w-4" />}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="brands">Brands Carried (comma-separated)</Label>
                  <CommaInput
                    id="brands"
                    value={formData.brands}
                    onChange={(val) => setFormData({ ...formData, brands: val })}
                    placeholder="Apple, Samsung, Sony"
                    icon={<Award className="h-4 w-4" />}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        <TabsContent value="settings" className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-primary/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Settings2 className="h-12 w-12 text-primary" />
              </div>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                  <CardTitle>Automation & Reputation Settings</CardTitle>
                </div>
                <CardDescription>Configure how the listing tool behaves for your business.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-semibold">Auto-Sync Frequency</Label>
                      </div>
                      <p className="text-[12px] text-muted-foreground">How often to refresh and sync your listings across all directories.</p>
                    </div>
                    <Select
                      value={formData.integrations?.auto_sync_frequency || 'weekly'}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        integrations: { ...(formData.integrations || {}), auto_sync_frequency: v }
                      })}
                    >
                      <SelectTrigger className="w-32 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-semibold">Review Notifications</Label>
                      </div>
                      <p className="text-[12px] text-muted-foreground">Get instant alerts when new reviews are detected on any directory.</p>
                    </div>
                    <Switch
                      checked={formData.integrations?.review_notifications !== false}
                      onCheckedChange={(v) => setFormData({
                        ...formData,
                        integrations: { ...(formData.integrations || {}), review_notifications: v }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-semibold">Auto-Suppress Duplicates</Label>
                      </div>
                      <p className="text-[12px] text-muted-foreground">Automatically attempt to suppress duplicate listings when identified.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200 text-[12px] h-5">Beta</Badge>
                      <Switch
                        checked={!!formData.integrations?.auto_suppress_duplicates}
                        onCheckedChange={(v) => setFormData({
                          ...formData,
                          integrations: { ...(formData.integrations || {}), auto_suppress_duplicates: v }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>External Integrations</CardTitle>
                <CardDescription>Connect to third-party citation management tools.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <IntegrationTool
                    tool={{
                      name: 'Yext',
                      desc: 'Sync listings via Yext Knowledge Graph',
                      color: 'text-blue-600',
                      initial: 'Y',
                      requiresApiKey: true,
                      apiKeyLabel: 'Yext API Key',
                      docsUrl: 'https://developer.yext.com/docs/api-reference/'
                    }}
                    formData={formData}
                    setFormData={setFormData}
                  />
                  <IntegrationTool
                    tool={{
                      name: 'Whitespark',
                      desc: 'Import citations from Whitespark',
                      color: 'text-orange-600',
                      initial: 'W',
                      requiresApiKey: true,
                      apiKeyLabel: 'Whitespark API Key',
                      docsUrl: 'https://whitespark.ca/api/'
                    }}
                    formData={formData}
                    setFormData={setFormData}
                  />
                  <IntegrationTool
                    tool={{
                      name: 'BrightLocal',
                      desc: 'Sync with BrightLocal reports',
                      color: 'text-green-600',
                      initial: 'B',
                      requiresApiKey: true,
                      apiKeyLabel: 'BrightLocal API Key',
                      docsUrl: 'https://www.brightlocal.com/support/api/'
                    }}
                    formData={formData}
                    setFormData={setFormData}
                  />
                  <IntegrationTool
                    tool={{
                      name: 'Google Sheets',
                      desc: 'Import citations from Google Sheets',
                      color: 'text-green-700',
                      initial: 'G',
                      requiresApiKey: true,
                      apiKeyLabel: 'Spreadsheet ID',
                      docsUrl: 'https://docs.google.com/spreadsheets'
                    }}
                    formData={formData}
                    setFormData={setFormData}
                    onSync={async () => {
                      const spreadsheetId = formData.integrations?.['Google Sheets']?.api_key;
                      if (!spreadsheetId) return;

                      toast({
                        title: 'Importing from Google Sheets...',
                        description: 'This may take a moment.',
                      });

                      try {
                        await listingsApi.importFromGoogleSheets(spreadsheetId);
                        toast({
                          title: 'Import Successful',
                          description: 'Citations have been imported from your Google Sheet.',
                        });
                        queryClient.invalidateQueries({ queryKey: ['listings'] });
                      } catch (error) {
                        toast({
                          title: 'Import Failed',
                          description: 'Could not import from Google Sheets. Check the ID and permissions.',
                          variant: 'destructive',
                        });
                      }
                    }}
                  />
                  <IntegrationTool
                    tool={{
                      name: 'Citation Builder',
                      desc: 'Auto-submit to 50+ directories via Apify',
                      color: 'text-pink-600',
                      initial: 'A',
                      requiresApiKey: true,
                      apiKeyLabel: 'Apify API Token',
                      docsUrl: 'https://apify.com/alizarin_refrigerator-owner/citation-builder'
                    }}
                    formData={formData}
                    setFormData={setFormData}
                    onSync={async () => {
                      const apiKey = formData.integrations?.['Citation Builder']?.api_key;
                      if (!apiKey) {
                        toast({ title: 'API Key Missing', description: 'Please connect first.', variant: 'destructive' });
                        return;
                      }

                      toast({
                        title: 'Starting Citation Builder...',
                        description: 'Initiating Apify actor run...',
                      });

                      try {
                        await listingsApi.syncApifyCitations(apiKey);
                        toast({
                          title: 'Run Started Successfully',
                          description: 'Citation Builder has been triggered on Apify. Check back later for results.',
                        });
                      } catch (error) {
                        toast({
                          title: 'Run Failed',
                          description: 'Could not trigger Apify run. Check your API token.',
                          variant: 'destructive',
                        });
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end bg-background sticky bottom-0 p-4 border-t z-10">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>
    </form>
  );
}

