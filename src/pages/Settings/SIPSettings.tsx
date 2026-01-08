import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  Globe, 
  Shield,
  Server,
  Network,
  Zap,
  Save,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface SIPSettingsData {
  sipEnabled: boolean;
  sipServer: string;
  sipPort: number;
  sipUsername: string;
  sipPassword: string;
  sipDomain: string;
  sipTransport: 'udp' | 'tcp' | 'tls';
  stunServer: string;
  turnServer: string;
  turnUsername: string;
  turnPassword: string;
  webrtcEnabled: boolean;
  autoAnswer: boolean;
  dtmfType: 'rfc2833' | 'inband' | 'info';
}

const defaultSettings: SIPSettingsData = {
  sipEnabled: false,
  sipServer: '',
  sipPort: 5060,
  sipUsername: '',
  sipPassword: '',
  sipDomain: '',
  sipTransport: 'udp',
  stunServer: 'stun.l.google.com:19302',
  turnServer: '',
  turnUsername: '',
  turnPassword: '',
  webrtcEnabled: true,
  autoAnswer: false,
  dtmfType: 'rfc2833'
};

const sipProviders = [
  { name: 'SignalWire', server: 'sip.signalwire.com', port: 5060, transport: 'udp' },
  { name: 'Twilio', server: 'sip.twilio.com', port: 5060, transport: 'udp' },
  { name: 'Vonage', server: 'sip.nexmo.com', port: 5060, transport: 'udp' },
  { name: 'Plivo', server: 'sip.plivo.com', port: 5060, transport: 'udp' },
  { name: 'Bandwidth', server: 'sip.bandwidth.com', port: 5060, transport: 'udp' },
  { name: 'Custom', server: '', port: 5060, transport: 'udp' }
];

export const SIPSettings: React.FC = () => {
  const [settings, setSettings] = useState<SIPSettingsData>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<SIPSettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Check if settings have changed
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const callSettings = await api.getCallSettings();
      const sipSettings: SIPSettingsData = {
        sipEnabled: callSettings.sipEnabled || false,
        sipServer: callSettings.sipServer || '',
        sipPort: callSettings.sipPort || 5060,
        sipUsername: callSettings.sipUsername || '',
        sipPassword: callSettings.sipPassword || '',
        sipDomain: callSettings.sipDomain || '',
        sipTransport: callSettings.sipTransport || 'udp',
        stunServer: callSettings.stunServer || 'stun.l.google.com:19302',
        turnServer: callSettings.turnServer || '',
        turnUsername: callSettings.turnUsername || '',
        turnPassword: callSettings.turnPassword || '',
        webrtcEnabled: callSettings.webrtcEnabled !== false,
        autoAnswer: callSettings.autoAnswer || false,
        dtmfType: callSettings.dtmfType || 'rfc2833'
      };
      setSettings(sipSettings);
      setOriginalSettings(sipSettings);
    } catch (error) {
      console.error('Failed to load SIP settings:', error);
      toast.error('Failed to load SIP settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      await api.updateCallSettings(settings);
      setOriginalSettings(settings);
      toast.success('SIP settings saved successfully');
      setTestResult(null);
    } catch (error) {
      console.error('Failed to save SIP settings:', error);
      toast.error('Failed to save SIP settings');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    if (!settings.sipServer || !settings.sipUsername) {
      toast.error('Please configure SIP server and username first');
      return;
    }

    try {
      setIsTesting(true);
      setTestResult(null);

      // Test SIP connection
      const result = await api.testSIPConnection({
        server: settings.sipServer,
        port: settings.sipPort,
        username: settings.sipUsername,
        password: settings.sipPassword,
        domain: settings.sipDomain,
        transport: settings.sipTransport
      });
      setTestResult({
        success: result.success,
        message: result.message || (result.success ? 'Connection successful' : 'Connection failed')
      });

      if (result.success) {
        toast.success('SIP connection test successful');
      } else {
        toast.error('SIP connection test failed');
      }
    } catch (error) {
      console.error('SIP test failed:', error);
      setTestResult({
        success: false,
        message: 'Connection test failed'
      });
      toast.error('SIP connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const applyProviderPreset = (providerName: string) => {
    const provider = sipProviders.find(p => p.name === providerName);
    if (provider) {
      setSettings(prev => ({
        ...prev,
        sipServer: provider.server,
        sipPort: provider.port,
        sipTransport: provider.transport as 'udp' | 'tcp' | 'tls'
      }));
    }
  };

  const resetSettings = () => {
    setSettings(originalSettings);
    setTestResult(null);
    toast.info('Settings reverted to last saved state');
  };

  const updateSetting = <K extends keyof SIPSettingsData>(key: K, value: SIPSettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Phone className="h-6 w-6" />
          <h2 className="text-[16px] font-bold">SIP/VOIP Settings</h2>
        </div>
        <Badge variant={settings.sipEnabled ? 'success' : 'secondary'}>
          {settings.sipEnabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Configure your SIP/VOIP trunking settings to enable direct calling through your preferred provider. 
          This allows you to make calls without relying on external services.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>SIP Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sip-enabled">Enable SIP/VOIP</Label>
              <p className="text-sm text-muted-foreground">
                Enable direct SIP calling through your VOIP provider
              </p>
            </div>
            <Switch
              id="sip-enabled"
              checked={settings.sipEnabled}
              onCheckedChange={(checked) => updateSetting('sipEnabled', checked)}
            />
          </div>

          {settings.sipEnabled && (
            <>
              <Separator />

              <div className="space-y-4">
                <div>
                  <Label htmlFor="provider">SIP Provider Preset</Label>
                  <Select onValueChange={applyProviderPreset}>
                    <SelectTrigger id="provider">
                      <SelectValue placeholder="Select a provider or use custom" />
                    </SelectTrigger>
                    <SelectContent>
                      {sipProviders.map((provider) => (
                        <SelectItem key={provider.name} value={provider.name}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sip-server">SIP Server</Label>
                    <Input
                      id="sip-server"
                      value={settings.sipServer}
                      onChange={(e) => updateSetting('sipServer', e.target.value)}
                      placeholder="sip.yourprovider.com"
                      disabled={!settings.sipEnabled}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sip-port">Port</Label>
                    <Input
                      id="sip-port"
                      type="number"
                      value={settings.sipPort}
                      onChange={(e) => updateSetting('sipPort', parseInt(e.target.value))}
                      disabled={!settings.sipEnabled}
                      min="1"
                      max="65535"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sip-username">Username</Label>
                    <Input
                      id="sip-username"
                      value={settings.sipUsername}
                      onChange={(e) => updateSetting('sipUsername', e.target.value)}
                      placeholder="Your SIP username"
                      disabled={!settings.sipEnabled}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sip-password">Password</Label>
                    <Input
                      id="sip-password"
                      type="password"
                      value={settings.sipPassword}
                      onChange={(e) => updateSetting('sipPassword', e.target.value)}
                      placeholder="Your SIP password"
                      disabled={!settings.sipEnabled}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="sip-domain">Domain (Optional)</Label>
                  <Input
                    id="sip-domain"
                    value={settings.sipDomain}
                    onChange={(e) => updateSetting('sipDomain', e.target.value)}
                    placeholder="yourdomain.com"
                    disabled={!settings.sipEnabled}
                  />
                </div>

                <div>
                  <Label htmlFor="sip-transport">Transport Protocol</Label>
                  <Select
                    value={settings.sipTransport}
                    onValueChange={(value: 'udp' | 'tcp' | 'tls') => updateSetting('sipTransport', value)}
                    disabled={!settings.sipEnabled}
                  >
                    <SelectTrigger id="sip-transport">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="udp">UDP (Default)</SelectItem>
                      <SelectItem value="tcp">TCP</SelectItem>
                      <SelectItem value="tls">TLS (Secure)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {settings.sipEnabled && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Network Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stun-server">STUN Server</Label>
                <Input
                  id="stun-server"
                  value={settings.stunServer}
                  onChange={(e) => updateSetting('stunServer', e.target.value)}
                  placeholder="stun.l.google.com:19302"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Used for NAT traversal in WebRTC calls
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="turn-server">TURN Server</Label>
                  <Input
                    id="turn-server"
                    value={settings.turnServer}
                    onChange={(e) => updateSetting('turnServer', e.target.value)}
                    placeholder="turn.yourserver.com"
                  />
                </div>

                <div>
                  <Label htmlFor="turn-username">TURN Username</Label>
                  <Input
                    id="turn-username"
                    value={settings.turnUsername}
                    onChange={(e) => updateSetting('turnUsername', e.target.value)}
                    placeholder="TURN username"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="turn-password">TURN Password</Label>
                <Input
                  id="turn-password"
                  type="password"
                  value={settings.turnPassword}
                  onChange={(e) => updateSetting('turnPassword', e.target.value)}
                  placeholder="TURN password"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Advanced Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="webrtc-enabled">Enable WebRTC</Label>
                  <p className="text-sm text-muted-foreground">
                    Use WebRTC for browser-based calling
                  </p>
                </div>
                <Switch
                  id="webrtc-enabled"
                  checked={settings.webrtcEnabled}
                  onCheckedChange={(checked) => updateSetting('webrtcEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-answer">Auto Answer</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically answer incoming calls
                  </p>
                </div>
                <Switch
                  id="auto-answer"
                  checked={settings.autoAnswer}
                  onCheckedChange={(checked) => updateSetting('autoAnswer', checked)}
                />
              </div>

              <div>
                <Label htmlFor="dtmf-type">DTMF Type</Label>
                <Select
                  value={settings.dtmfType}
                  onValueChange={(value: 'rfc2833' | 'inband' | 'info') => updateSetting('dtmfType', value)}
                >
                  <SelectTrigger id="dtmf-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rfc2833">RFC 2833 (Recommended)</SelectItem>
                    <SelectItem value="inband">In-band Audio</SelectItem>
                    <SelectItem value="info">SIP INFO</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Method for sending touch tones during calls
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {testResult && (
        <Alert variant={testResult.success ? 'success' : 'destructive'}>
          {testResult.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {testResult.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <div className="flex space-x-2">
          <Button
            onClick={testConnection}
            disabled={isTesting || !settings.sipEnabled || !settings.sipServer || !settings.sipUsername}
            variant="outline"
          >
            {isTesting ? (
              <>
                <Network className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Network className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>

          <Button
            onClick={resetSettings}
            disabled={!hasChanges}
            variant="outline"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        <Button
          onClick={saveSettings}
          disabled={isLoading || !hasChanges}
        >
          {isLoading ? (
            <>
              <Server className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SIPSettings;
