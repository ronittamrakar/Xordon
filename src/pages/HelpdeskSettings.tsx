import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  Settings,
  MessageCircle,
  ExternalLink,
  Code,
  AlertCircle,
  CheckCircle2,
  Save,
  Info,
} from 'lucide-react';

interface HelpdeskSettings {
  vendor_widget_enabled?: boolean;
  vendor_widget_provider?: 'intercom' | 'zendesk' | 'none';
  vendor_widget_app_id?: string;
  vendor_widget_settings?: Record<string, any>;
}

const HelpdeskSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['helpdesk-settings'],
    queryFn: async () => {
      try {
        const response = await api.get<any>('/helpdesk/settings');
        return (response.data || response) as HelpdeskSettings;
      } catch (error) {
        return {};
      }
    },
  });

  const [formData, setFormData] = useState<HelpdeskSettings>({
    vendor_widget_enabled: settings?.vendor_widget_enabled || false,
    vendor_widget_provider: settings?.vendor_widget_provider || 'none',
    vendor_widget_app_id: settings?.vendor_widget_app_id || '',
    vendor_widget_settings: settings?.vendor_widget_settings || {},
  });

  // Update form when settings load
  React.useEffect(() => {
    if (settings) {
      setFormData({
        vendor_widget_enabled: settings.vendor_widget_enabled || false,
        vendor_widget_provider: settings.vendor_widget_provider || 'none',
        vendor_widget_app_id: settings.vendor_widget_app_id || '',
        vendor_widget_settings: settings.vendor_widget_settings || {},
      });
    }
  }, [settings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: HelpdeskSettings) => {
      return await api.post('/helpdesk/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-settings'] });
      toast({ title: 'Settings saved', description: 'Helpdesk settings have been updated.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const getEmbedCode = () => {
    const provider = formData.vendor_widget_provider;
    const appId = formData.vendor_widget_app_id;

    if (!appId) return '';

    if (provider === 'intercom') {
      return `<!-- Intercom Widget -->
<script>
  window.intercomSettings = {
    api_base: "https://api-iam.intercom.io",
    app_id: "${appId}"
  };
</script>
<script>
(function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/${appId}';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
</script>`;
    }

    if (provider === 'zendesk') {
      return `<!-- Zendesk Widget -->
<script id="ze-snippet" src="https://static.zdassets.com/ekr/snippet.js?key=${appId}"></script>`;
    }

    return '';
  };

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Helpdesk' }, { label: 'Settings' }]} />

      <div className="mx-auto max-w-5xl py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Helpdesk Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure helpdesk features, third-party integrations, and customer support tools.
          </p>
        </div>

        <Tabs defaultValue="vendor-widget" className="space-y-6">
          <TabsList>
            <TabsTrigger value="vendor-widget">Vendor Widget</TabsTrigger>
            <TabsTrigger value="native-helpdesk">Native Helpdesk</TabsTrigger>
          </TabsList>

          {/* Vendor Widget Tab */}
          <TabsContent value="vendor-widget" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Third-Party Chat Widget</CardTitle>
                <CardDescription>
                  Embed Intercom, Zendesk, or other helpdesk widgets on your public pages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable Vendor Widget</Label>
                    <p className="text-sm text-muted-foreground">
                      Show a third-party chat widget on your website
                    </p>
                  </div>
                  <Switch
                    checked={formData.vendor_widget_enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, vendor_widget_enabled: checked })
                    }
                  />
                </div>

                {formData.vendor_widget_enabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="provider">Provider</Label>
                      <Select
                        value={formData.vendor_widget_provider}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, vendor_widget_provider: value })
                        }
                      >
                        <SelectTrigger id="provider">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="intercom">Intercom</SelectItem>
                          <SelectItem value="zendesk">Zendesk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.vendor_widget_provider !== 'none' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="app_id">
                            {formData.vendor_widget_provider === 'intercom' ? 'App ID' : 'Widget Key'}
                          </Label>
                          <Input
                            id="app_id"
                            value={formData.vendor_widget_app_id}
                            onChange={(e) =>
                              setFormData({ ...formData, vendor_widget_app_id: e.target.value })
                            }
                            placeholder={
                              formData.vendor_widget_provider === 'intercom'
                                ? 'e.g., abc123def'
                                : 'e.g., your-zendesk-key'
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            {formData.vendor_widget_provider === 'intercom' && (
                              <>
                                Find this in your Intercom settings under &quot;Installation&quot;{' '}
                                <a
                                  href="https://www.intercom.com/help"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  Learn more <ExternalLink className="w-3 h-3" />
                                </a>
                              </>
                            )}
                            {formData.vendor_widget_provider === 'zendesk' && (
                              <>
                                Find this in your Zendesk settings under &quot;Web Widget&quot;{' '}
                                <a
                                  href="https://support.zendesk.com"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  Learn more <ExternalLink className="w-3 h-3" />
                                </a>
                              </>
                            )}
                          </p>
                        </div>

                        {formData.vendor_widget_app_id && (
                          <Alert>
                            <Code className="w-4 h-4" />
                            <AlertDescription>
                              <p className="font-semibold mb-2">Installation Code</p>
                              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                                {getEmbedCode()}
                              </pre>
                              <p className="text-xs text-muted-foreground mt-2">
                                This code will be automatically injected into your public pages when the widget is enabled.
                              </p>
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
                  </>
                )}

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={saveMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {formData.vendor_widget_enabled && formData.vendor_widget_provider !== 'none' && (
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  <p className="font-semibold mb-1">Widget Behavior</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>The vendor widget will appear on all public-facing pages</li>
                    <li>The built-in Xordon webchat will be hidden when a vendor widget is active</li>
                    <li>Conversations will be managed in {formData.vendor_widget_provider === 'intercom' ? 'Intercom' : 'Zendesk'}</li>
                    <li>You can disable this anytime to revert to the native helpdesk</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Native Helpdesk Tab */}
          <TabsContent value="native-helpdesk" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Chat Widget Configuration</CardTitle>
                    <CardDescription>
                      Customize the appearance and behavior of the native chat widget.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="widget_title">Widget Title</Label>
                      <Input
                        id="widget_title"
                        value={formData.vendor_widget_settings?.title || 'Support'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vendor_widget_settings: {
                              ...formData.vendor_widget_settings,
                              title: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g., Chat with us"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="welcome_message">Welcome Message</Label>
                      <Textarea
                        id="welcome_message"
                        value={formData.vendor_widget_settings?.welcome_message || 'Hello! How can we help you today?'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vendor_widget_settings: {
                              ...formData.vendor_widget_settings,
                              welcome_message: e.target.value,
                            },
                          })
                        }
                        placeholder="Initial message displayed to users"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary_color">Primary Color</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="primary_color"
                            type="color"
                            value={formData.vendor_widget_settings?.primary_color || '#000000'}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                vendor_widget_settings: {
                                  ...formData.vendor_widget_settings,
                                  primary_color: e.target.value,
                                },
                              })
                            }
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={formData.vendor_widget_settings?.primary_color || '#000000'}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                vendor_widget_settings: {
                                  ...formData.vendor_widget_settings,
                                  primary_color: e.target.value,
                                },
                              })
                            }
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Select
                          value={formData.vendor_widget_settings?.position || 'bottom-right'}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              vendor_widget_settings: {
                                ...formData.vendor_widget_settings,
                                position: value,
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-t mt-4">
                      <Label htmlFor="require_email" className="flex flex-col">
                        <span>Require Email</span>
                        <span className="font-normal text-xs text-muted-foreground">Ask users for email before starting chat</span>
                      </Label>
                      <Switch
                        id="require_email"
                        checked={formData.vendor_widget_settings?.require_email !== false}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            vendor_widget_settings: {
                              ...formData.vendor_widget_settings,
                              require_email: checked,
                            },
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Installation</CardTitle>
                    <CardDescription>
                      Copy and paste this code before the closing &lt;/body&gt; tag of your website.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                        {`<script>
  window.xordonSettings = {
    workspace_id: "${localStorage.getItem('workspace_id') || 'current_workspace_id'}",
    title: "${formData.vendor_widget_settings?.title || 'Support'}",
    color: "${formData.vendor_widget_settings?.primary_color || '#000000'}",
    position: "${formData.vendor_widget_settings?.position || 'bottom-right'}"
  };
</script>
<script src="https://cdn.xordon.app/widget/v1/bundle.js" async></script>`}
                      </pre>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2 h-8"
                        onClick={() => {
                          const workspaceId = localStorage.getItem('workspace_id') || 'current_workspace_id';
                          const title = formData.vendor_widget_settings?.title || 'Support';
                          const color = formData.vendor_widget_settings?.primary_color || '#000000';
                          const position = formData.vendor_widget_settings?.position || 'bottom-right';

                          navigator.clipboard.writeText(`<script>
  window.xordonSettings = {
    workspace_id: "${workspaceId}",
    title: "${title}",
    color: "${color}",
    position: "${position}"
  };
</script>
<script src="https://cdn.xordon.app/widget/v1/bundle.js" async></script>`);
                          toast({ title: "Copied to clipboard" });
                        }}
                      >
                        <code className="text-xs">Copy</code>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-start">
                  <Button
                    onClick={() => {
                      if (formData.vendor_widget_settings?.primary_color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(formData.vendor_widget_settings.primary_color)) {
                        toast({ title: "Invalid color", description: "Please enter a valid hex color code.", variant: "destructive" });
                        return;
                      }
                      handleSave();
                    }}
                    disabled={saveMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>

              </div>

              {/* Preview */}
              <div className="space-y-6">
                <Card className="h-full min-h-[500px] flex flex-col relative overflow-hidden bg-gray-50 border-2 border-dashed">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                    <span className="text-6xl font-bold uppercase rotate-45">Website Preview</span>
                  </div>

                  {/* Mock Website Content */}
                  <div className="p-8 space-y-4 opacity-40 blur-[1px]">
                    <div className="h-8 w-1/3 bg-gray-300 rounded mb-8"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                    <div className="grid grid-cols-3 gap-4 mt-8">
                      <div className="h-32 bg-gray-200 rounded"></div>
                      <div className="h-32 bg-gray-200 rounded"></div>
                      <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                  </div>

                  {/* Widget Preview */}
                  <div
                    className={`absolute p-4 flex flex-col items-end gap-4 transition-all duration-300 ${formData.vendor_widget_settings?.position === 'bottom-left' ? 'bottom-4 left-4 items-start' : 'bottom-4 right-4 items-end'
                      }`}
                  >
                    {/* Chat Window (Open State Simulation) */}
                    <div className="bg-white rounded-lg shadow-xl w-80 overflow-hidden border animate-in slide-in-from-bottom-10 fade-in duration-300 mb-2">
                      <div
                        className="p-4 text-primary-foreground flex justify-between items-center"
                        style={{ backgroundColor: formData.vendor_widget_settings?.primary_color || '#000000' }}
                      >
                        <span className="font-semibold">{formData.vendor_widget_settings?.title || 'Support'}</span>
                        <div className="flex gap-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        </div>
                      </div>
                      <div className="p-4 h-64 bg-gray-50 flex flex-col gap-3 overflow-y-auto">
                        <div className="self-start bg-gray-200 rounded-lg rounded-tl-none p-3 text-sm max-w-[85%]">
                          {formData.vendor_widget_settings?.welcome_message || 'Hello! How can we help you today?'}
                        </div>
                      </div>
                      <div className="p-3 border-t bg-white">
                        <div className="h-10 border rounded-md bg-gray-50 flex items-center px-3 text-muted-foreground text-sm">
                          Write a message...
                        </div>
                      </div>
                    </div>

                    {/* Widget Button */}
                    <div
                      className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-transform"
                      style={{ backgroundColor: formData.vendor_widget_settings?.primary_color || '#000000' }}
                    >
                      <MessageCircle className="w-6 h-6" />
                    </div>
                  </div>

                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default HelpdeskSettings;
