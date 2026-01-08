import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save, TestTube, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface CallSettings {
  provider?: string;
  defaultCallerId?: string;
  sipEnabled?: boolean;
  sipServer?: string;
  sipPort?: number;
  sipUsername?: string;
  sipPassword?: string;
  sipDomain?: string;
  sipTransport?: 'udp' | 'tcp' | 'tls';
  stunServer?: string;
  turnServer?: string;
  turnUsername?: string;
  turnPassword?: string;
  webrtcEnabled?: boolean;
  autoAnswer?: boolean;
  dtmfType?: string;
  defaultCountry?: string;
}

interface SoftphoneSettingsProps {
  settings: CallSettings;
  onSettingsChange: (settings: CallSettings) => void;
  onClose: () => void;
}

export const SoftphoneSettings: React.FC<SoftphoneSettingsProps> = ({
  settings,
  onSettingsChange,
  onClose
}) => {
  const [localSettings, setLocalSettings] = useState<CallSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await api.put('/call-settings', localSettings) as any;
      if (response.data?.success) {
        onSettingsChange(localSettings);
        toast.success('Settings saved successfully');
        onClose();
      } else {
        throw new Error(response.data?.message || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const response = await api.post('/call-settings/test', localSettings) as any;
      if (response.data?.success) {
        toast.success('Connection test successful');
      } else {
        throw new Error(response.data?.message || 'Connection test failed');
      }
    } catch (error: any) {
      console.error('Connection test failed:', error);
      toast.error(error.message || 'Connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const updateSetting = (key: keyof CallSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Call Settings</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Provider Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Provider</h3>
          
          <div className="space-y-2">
            <Label htmlFor="provider">Call Provider</Label>
            <Select
              value={localSettings.provider || 'signalwire'}
              onValueChange={(value) => updateSetting('provider', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="signalwire">SignalWire</SelectItem>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="sip">SIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultCallerId">Default Caller ID</Label>
            <Input
              id="defaultCallerId"
              value={localSettings.defaultCallerId || ''}
              onChange={(e) => updateSetting('defaultCallerId', e.target.value)}
              placeholder="+1234567890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultCountry">Default Country</Label>
            <Select
              value={localSettings.defaultCountry || 'US'}
              onValueChange={(value) => updateSetting('defaultCountry', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States (+1)</SelectItem>
                <SelectItem value="GB">United Kingdom (+44)</SelectItem>
                <SelectItem value="CA">Canada (+1)</SelectItem>
                <SelectItem value="AU">Australia (+61)</SelectItem>
                <SelectItem value="DE">Germany (+49)</SelectItem>
                <SelectItem value="FR">France (+33)</SelectItem>
                <SelectItem value="IN">India (+91)</SelectItem>
                <SelectItem value="JP">Japan (+81)</SelectItem>
                <SelectItem value="CN">China (+86)</SelectItem>
                <SelectItem value="MX">Mexico (+52)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* SIP Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">SIP Configuration</h3>
            <Switch
              checked={localSettings.sipEnabled || false}
              onCheckedChange={(checked) => updateSetting('sipEnabled', checked)}
            />
          </div>

          {localSettings.sipEnabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sipServer">SIP Server</Label>
                  <Input
                    id="sipServer"
                    value={localSettings.sipServer || ''}
                    onChange={(e) => updateSetting('sipServer', e.target.value)}
                    placeholder="sip.example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sipPort">Port</Label>
                  <Input
                    id="sipPort"
                    type="number"
                    value={localSettings.sipPort || 5060}
                    onChange={(e) => updateSetting('sipPort', parseInt(e.target.value))}
                    placeholder="5060"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sipDomain">SIP Domain</Label>
                <Input
                  id="sipDomain"
                  value={localSettings.sipDomain || ''}
                  onChange={(e) => updateSetting('sipDomain', e.target.value)}
                  placeholder="example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sipTransport">Transport</Label>
                <Select
                  value={localSettings.sipTransport || 'udp'}
                  onValueChange={(value: 'udp' | 'tcp' | 'tls') => updateSetting('sipTransport', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="udp">UDP</SelectItem>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="tls">TLS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sipUsername">Username</Label>
                  <Input
                    id="sipUsername"
                    value={localSettings.sipUsername || ''}
                    onChange={(e) => updateSetting('sipUsername', e.target.value)}
                    placeholder="username"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sipPassword">Password</Label>
                  <Input
                    id="sipPassword"
                    type="password"
                    value={localSettings.sipPassword || ''}
                    onChange={(e) => updateSetting('sipPassword', e.target.value)}
                    placeholder="password"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* WebRTC Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">WebRTC</h3>
            <Switch
              checked={localSettings.webrtcEnabled || false}
              onCheckedChange={(checked) => updateSetting('webrtcEnabled', checked)}
            />
          </div>

          {localSettings.webrtcEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="stunServer">STUN Server</Label>
                <Input
                  id="stunServer"
                  value={localSettings.stunServer || 'stun:stun.l.google.com:19302'}
                  onChange={(e) => updateSetting('stunServer', e.target.value)}
                  placeholder="stun:stun.example.com:19302"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="turnServer">TURN Server</Label>
                <Input
                  id="turnServer"
                  value={localSettings.turnServer || ''}
                  onChange={(e) => updateSetting('turnServer', e.target.value)}
                  placeholder="turn:turn.example.com:3478"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="turnUsername">TURN Username</Label>
                  <Input
                    id="turnUsername"
                    value={localSettings.turnUsername || ''}
                    onChange={(e) => updateSetting('turnUsername', e.target.value)}
                    placeholder="username"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="turnPassword">TURN Password</Label>
                  <Input
                    id="turnPassword"
                    type="password"
                    value={localSettings.turnPassword || ''}
                    onChange={(e) => updateSetting('turnPassword', e.target.value)}
                    placeholder="password"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Call Behavior */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Call Behavior</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Answer</Label>
              <p className="text-sm text-muted-foreground">
                Automatically answer incoming calls
              </p>
            </div>
            <Switch
              checked={localSettings.autoAnswer || false}
              onCheckedChange={(checked) => updateSetting('autoAnswer', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dtmfType">DTMF Type</Label>
            <Select
              value={localSettings.dtmfType || 'RFC2833'}
              onValueChange={(value) => updateSetting('dtmfType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select DTMF type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RFC2833">RFC2833</SelectItem>
                <SelectItem value="INFO">SIP INFO</SelectItem>
                <SelectItem value="INBAND">In-band</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={isTesting}
          >
            {isTesting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Test
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
