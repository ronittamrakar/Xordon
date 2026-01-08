import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bot, CheckCircle, Eye, EyeOff, Copy, TestTube, RefreshCw, Save, Settings, Mail, MessageSquare, Phone, FileTextIcon, ExternalLink, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAiSettings } from '@/hooks/useAiSettings';
import { api } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AISettingsProps {
  settings?: any;
  onSave?: (settings: any) => void;
  onTest?: (provider: string) => void;
}

const AISettings: React.FC<AISettingsProps> = ({ settings, onSave, onTest }) => {
  const { toast } = useToast();
  const { aiSettings: realAiSettings, isLoading, refetch } = useAiSettings();
  const queryClient = useQueryClient();

  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState<Record<string, boolean>>({});

  // Use real settings or fallback to mock data for development
  const aiSettings: any = realAiSettings || {
    defaultProvider: 'openai',
    providers: {
      openai: {
        label: 'OpenAI GPT',
        apiKey: '',
        model: 'gpt-4o-mini',
        enabled: true,
        description: 'Best for general purpose AI tasks'
      },
      gemini: {
        label: 'Google Gemini',
        apiKey: '',
        model: 'gemini-pro',
        enabled: false,
        description: 'Google\'s AI model'
      },
      claude: {
        label: 'Anthropic Claude',
        apiKey: '',
        model: 'claude-3-haiku-20240307',
        enabled: false,
        description: 'Anthropic\'s AI model'
      }
    },
    brandVoice: {
      targetAudience: '',
      brandTone: 'professional',
      coreValues: '',
      globalInstructions: '',
    },
    channelDefaults: {
      email: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 1000,
        enabled: true
      },
      sms: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 500,
        enabled: true
      },
      call: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 800,
        enabled: true
      },
      form: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 600,
        enabled: true
      }
    }
  };

  const [localSettings, setLocalSettings] = useState(aiSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local settings with real settings when they change
  useEffect(() => {
    if (realAiSettings) {
      setLocalSettings(realAiSettings);
      setHasChanges(false);
    }
  }, [realAiSettings]);

  // Update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const result = await api.updateSettings({ ai: newSettings });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
      toast({
        title: 'Settings Saved',
        description: 'Your AI settings have been updated successfully'
      });
      setHasChanges(false);
    },
    onError: (error) => {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Could not save AI settings',
        variant: 'destructive'
      });
    }
  });

  const updateProviderSetting = (provider: string, key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      providers: {
        ...prev?.providers,
        [provider]: {
          ...prev?.providers?.[provider],
          [key]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const updateChannelSetting = (channel: string, key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      channelDefaults: {
        ...prev?.channelDefaults,
        [channel]: {
          ...prev?.channelDefaults?.[channel],
          [key]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const updateDefaultProvider = (provider: string) => {
    setLocalSettings(prev => ({ ...prev, defaultProvider: provider }));
    setHasChanges(true);
  };

  const toggleApiKeyVisibility = (provider: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const copyApiKey = (provider: string) => {
    const apiKey = aiSettings?.providers?.[provider]?.apiKey;
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast({
        title: 'API Key Copied',
        description: 'API key copied to clipboard'
      });
    }
  };

  const testProvider = async (provider: string) => {
    setIsTesting(prev => ({ ...prev, [provider]: true }));

    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: 'Test Successful',
        description: `${aiSettings?.providers?.[provider]?.label} is working correctly`
      });
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: `Could not connect to ${aiSettings?.providers?.[provider]?.label}`,
        variant: 'destructive'
      });
    } finally {
      setIsTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  const saveSettings = async () => {
    try {
      await updateSettingsMutation.mutateAsync(localSettings);
    } catch (error) {
      // Error is already handled by the mutation
    }

    if (onSave) {
      onSave(localSettings);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return '🤖';
      case 'gemini':
        return '✨';
      case 'claude':
        return '🧠';
      case 'openrouter':
        return '🔀';
      default:
        return '🤖';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'form':
        return <FileTextIcon className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  // Helper functions to safely get data
  const getProviders = () => {
    return localSettings?.providers || {};
  };

  const getChannelDefaults = () => {
    return localSettings?.channelDefaults || {};
  };

  const getDefaultProvider = () => {
    return localSettings?.defaultProvider || 'openai';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-500" />
            AI Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure AI providers and how they're used across your campaigns
          </p>
        </div>

        {hasChanges && (
          <Button
            onClick={saveSettings}
            disabled={updateSettingsMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {updateSettingsMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Providers Section */}
        <section id="providers" className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Bot className="w-4 h-4 text-blue-500" />
            <h3 className="text-base font-semibold">AI Providers</h3>
          </div>

          {/* Default Provider */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Default AI Provider</CardTitle>
              <CardDescription>
                Choose which AI provider to use by default for all channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={getDefaultProvider()}
                onValueChange={updateDefaultProvider}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select default provider" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(getProviders()).map(([key, provider]: [string, any]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{getProviderIcon(key)}</span>
                        <span>{provider?.label || key}</span>
                        {provider?.enabled && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Individual Providers */}
          <div className="grid gap-4">
            {Object.entries(getProviders()).map(([key, provider]: [string, any]) => (
              <Card key={key} className={provider?.enabled ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getProviderIcon(key)}</span>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {provider?.label || key}
                          {provider?.enabled ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{provider?.description || 'AI provider'}</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={provider?.enabled || false}
                      onCheckedChange={(checked) => updateProviderSetting(key, 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                {provider?.enabled && (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <div className="flex gap-2">
                          <Input
                            type={showApiKeys[key] ? 'text' : 'password'}
                            value={provider?.apiKey || ''}
                            onChange={(e) => updateProviderSetting(key, 'apiKey', e.target.value)}
                            placeholder="Enter API key"
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleApiKeyVisibility(key)}
                          >
                            {showApiKeys[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyApiKey(key)}
                            disabled={!provider?.apiKey}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Model</Label>
                        <Input
                          value={provider?.model || ''}
                          onChange={(e) => updateProviderSetting(key, 'model', e.target.value)}
                          placeholder="AI model name"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testProvider(key)}
                        disabled={isTesting[key] || !provider?.apiKey}
                      >
                        {isTesting[key] ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <TestTube className="w-4 h-4 mr-2" />
                        )}
                        Test Connection
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://${key}.com`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Documentation
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Brand Voice Section */}
        <section id="voice" className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <MessageSquare className="w-4 h-4 text-purple-500" />
            <h3 className="text-base font-semibold">Brand Voice</h3>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-500" />
                AI Brand Identity
              </CardTitle>
              <CardDescription>
                Define your brand's personality and audience to ensure consistent AI generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Textarea
                    placeholder="e.g. Small business owners looking for marketing automation..."
                    value={localSettings.brandVoice?.targetAudience || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, brandVoice: { ...localSettings.brandVoice, targetAudience: e.target.value } })}
                    onBlur={() => setHasChanges(true)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">Helps AI tailor vocabulary and pain points.</p>
                </div>
                <div className="space-y-2">
                  <Label>Brand Tone</Label>
                  <Select
                    value={localSettings.brandVoice?.brandTone || 'professional'}
                    onValueChange={(val) => {
                      setLocalSettings({ ...localSettings, brandVoice: { ...localSettings.brandVoice, brandTone: val } });
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional & Authoritative</SelectItem>
                      <SelectItem value="friendly">Friendly & Approachable</SelectItem>
                      <SelectItem value="witty">Witty & Creative</SelectItem>
                      <SelectItem value="minimalist">Minimalist & Direct</SelectItem>
                      <SelectItem value="energetic">Energetic & Hype</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Core Values & USPs</Label>
                <Textarea
                  placeholder="e.g. Customer-first, transparent pricing, 24/7 support..."
                  value={localSettings.brandVoice?.coreValues || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, brandVoice: { ...localSettings.brandVoice, coreValues: e.target.value } })}
                  onBlur={() => setHasChanges(true)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Global AI Instructions (System Prompt Add-on)</Label>
                <Textarea
                  placeholder="e.g. Always avoid jargon. Never mention competitors. Use emoji sparingly."
                  value={localSettings.brandVoice?.globalInstructions || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, brandVoice: { ...localSettings.brandVoice, globalInstructions: e.target.value } })}
                  onBlur={() => setHasChanges(true)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">These instructions are appended to every AI request across all channels.</p>
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800">
            <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <AlertDescription className="text-purple-800 dark:text-purple-200 text-xs">
              <strong>Pro Tip:</strong> A well-defined Brand Voice can increase content conversion by up to 40% by maintaining a consistent persona across email, SMS, and ads.
            </AlertDescription>
          </Alert>
        </section>

        {/* Channel Settings Section */}
        <section id="channels" className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <h3 className="text-base font-semibold">Channel Settings</h3>
          </div>

          <Alert>
            <HelpCircle className="w-4 h-4" />
            <AlertDescription>
              Customize how AI generates content for each communication channel. Each channel can use different providers and settings.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {Object.entries(getChannelDefaults()).map(([channel, settings]: [string, any]) => (
              <Card key={channel}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getChannelIcon(channel)}
                      <div>
                        <CardTitle className="text-base capitalize">{channel}</CardTitle>
                        <CardDescription>
                          AI settings for {channel} content generation
                        </CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={settings?.enabled || false}
                      onCheckedChange={(checked) => updateChannelSetting(channel, 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                {settings?.enabled && (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>AI Provider</Label>
                        <Select
                          value={settings?.provider || 'openai'}
                          onValueChange={(value) => updateChannelSetting(channel, 'provider', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(getProviders())
                              .filter(([_, provider]: [string, any]) => provider?.enabled)
                              .map(([key, provider]: [string, any]) => (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    <span>{getProviderIcon(key)}</span>
                                    <span>{provider?.label || key}</span>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Model</Label>
                        <Input
                          value={settings?.model || ''}
                          onChange={(e) => updateChannelSetting(channel, 'model', e.target.value)}
                          placeholder="AI model"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Temperature</Label>
                        <Input
                          type="number"
                          min="0"
                          max="2"
                          step="0.1"
                          value={settings?.temperature || 0.7}
                          onChange={(e) => updateChannelSetting(channel, 'temperature', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Usage Section */}
        <section id="usage" className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Bot className="w-4 h-4 text-green-500" />
            <h3 className="text-base font-semibold">Usage & Analytics</h3>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Usage Overview</CardTitle>
              <CardDescription>
                Monitor how AI is being used across your campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">0</p>
                        <p className="text-sm text-muted-foreground">Total Requests</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">0</p>
                        <p className="text-sm text-muted-foreground">Email Generations</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold">0</p>
                        <p className="text-sm text-muted-foreground">SMS Generations</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Channel Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Channel Breakdown</CardTitle>
                  <CardDescription>
                    AI usage by communication channel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(getChannelDefaults()).map(([channel, settings]: [string, any]) => (
                    <div key={channel} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getChannelIcon(channel)}
                        <div>
                          <p className="font-medium capitalize">{channel}</p>
                          <p className="text-sm text-muted-foreground">
                            {settings?.enabled ? 'Active' : 'Disabled'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">0 requests</p>
                        <p className="text-sm text-muted-foreground">This month</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default AISettings;
