import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield, Smartphone, Globe, Palette,
  Moon, Sun, Monitor, Bell, Database, Download, Upload,
  Trash2, Check, X, AlertCircle, RefreshCw,
  Fingerprint, ShieldCheck, Languages,
  Accessibility, Code, FileText, Layout,
  SmartphoneNfc, Terminal, Info, ShieldAlert,
  HardDrive, Share2, History, Scale,
  Loader2
} from 'lucide-react';
import SEO from '@/components/SEO';

// Types
interface StorageUsage {
  total: number;
  used: number;
  available: number;
  breakdown: {
    cache: number;
    downloads: number;
    media: number;
    documents: number;
  };
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  notifications: {
    push: boolean;
    email: boolean;
    inApp: boolean;
    sound: boolean;
    vibration: boolean;
  };
  dataUsage: {
    imageQuality: 'high' | 'medium' | 'low';
    backgroundSync: boolean;
    autoDownload: boolean;
  };
  accessibility: {
    screenReader: boolean;
    highContrast: boolean;
    reduceMotion: boolean;
    fontSize: number;
  };
}

interface SecuritySettings {
  biometricEnabled: boolean;
  requirePin: boolean;
}

interface AdvancedSettings {
  version: string;
  buildNumber: string;
  debugMode: boolean;
  developerOptions: boolean;
  autoUpdate: boolean;
  betaFeatures: boolean;
}

// Mock data
const mockStorageUsage: StorageUsage = {
  total: 1024 * 1024 * 1024 * 64, // 64 GB
  used: 1024 * 1024 * 1024 * 24,  // 24 GB
  available: 1024 * 1024 * 1024 * 40, // 40 GB
  breakdown: {
    cache: 1024 * 1024 * 1024 * 2,   // 2 GB
    downloads: 1024 * 1024 * 1024 * 5, // 5 GB
    media: 1024 * 1024 * 1024 * 12,   // 12 GB
    documents: 1024 * 1024 * 1024 * 5  // 5 GB
  }
};

const mockAppSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  fontSize: 'medium',
  notifications: {
    push: true,
    email: true,
    inApp: true,
    sound: true,
    vibration: true
  },
  dataUsage: {
    imageQuality: 'medium',
    backgroundSync: true,
    autoDownload: false
  },
  accessibility: {
    screenReader: false,
    highContrast: false,
    reduceMotion: false,
    fontSize: 100
  }
};

const mockSecuritySettings: SecuritySettings = {
  biometricEnabled: true,
  requirePin: true
};

const mockAdvancedSettings: AdvancedSettings = {
  version: '2.1.0',
  buildNumber: '20240115.1',
  debugMode: false,
  developerOptions: false,
  autoUpdate: true,
  betaFeatures: false
};

const languages = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' }
];

const MobileSettings = () => {
  const { toast } = useToast();

  // State
  const [storageUsage, setStorageUsage] = useState<StorageUsage>(mockStorageUsage);
  const [appSettings, setAppSettings] = useState<AppSettings>(mockAppSettings);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(mockSecuritySettings);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>(mockAdvancedSettings);

  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('mobile-app-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setAppSettings(prev => ({ ...prev, ...parsed.appSettings }));
        setSecuritySettings(prev => ({ ...prev, ...parsed.securitySettings }));
        setAdvancedSettings(prev => ({ ...prev, ...parsed.advancedSettings }));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('mobile-app-settings', JSON.stringify({
      appSettings,
      securitySettings,
      advancedSettings
    }));
  }, [appSettings, securitySettings, advancedSettings]);

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStorageUsage(prev => ({
        ...prev,
        breakdown: { ...prev.breakdown, cache: 0 },
        used: prev.used - prev.breakdown.cache
      }));
      toast({ title: "Cache Cleared", description: "Application cache has been cleared successfully." });
    } catch (error) {
      toast({ title: "Clear Failed", description: "Failed to clear cache.", variant: "destructive" });
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleExportData = async () => {
    setIsExportingData(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const exportData = {
        appSettings,
        securitySettings,
        exportDate: new Date().toISOString(),
        version: advancedSettings.version
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `xordon-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Data Exported", description: "Your data has been exported successfully." });
    } catch (error) {
      toast({ title: "Export Failed", description: "Failed to export data.", variant: "destructive" });
    } finally {
      setIsExportingData(false);
    }
  };

  const handleToggleBiometric = async (enabled: boolean) => {
    setSecuritySettings(prev => ({ ...prev, biometricEnabled: enabled }));
    toast({
      title: enabled ? "Biometric Enabled" : "Biometric Disabled",
      description: enabled ? "Biometric authentication has been enabled." : "Biometric authentication has been disabled."
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStoragePercentage = () => (storageUsage.used / storageUsage.total) * 100;

  return (
    <>
      <SEO title="Mobile App Settings" description="Customize your mobile app experience with these settings." />
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[18px] font-bold tracking-tight">Mobile App Settings</h1>
          <p className="text-sm text-muted-foreground">Customize your mobile app experience and manage your app data.</p>
        </div>

        {/* Main Content - Vertical Sections */}
        <div className="space-y-8">
          {/* Security Section */}
          <section id="security" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <h3 className="text-base font-semibold">Security & Privacy</h3>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Authentication</CardTitle>
                <CardDescription>Secure your mobile application with biometric login.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Biometric Authentication</Label>
                    <p className="text-sm text-muted-foreground">Use fingerprint or face recognition to unlock the app.</p>
                  </div>
                  <Switch checked={securitySettings.biometricEnabled} onCheckedChange={handleToggleBiometric} />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Preferences Section */}
          <section id="preferences" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Smartphone className="w-4 h-4 text-blue-500" />
              <h3 className="text-base font-semibold">App Preferences</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="h-4 w-4" /> Visual Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Theme Selection</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
                        { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
                        { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> }
                      ].map((theme) => (
                        <Button
                          key={theme.value}
                          variant={appSettings.theme === theme.value ? "default" : "outline"}
                          size="sm"
                          className="flex flex-col gap-1 h-auto py-2"
                          onClick={() => setAppSettings(prev => ({ ...prev, theme: theme.value as any }))}
                        >
                          {theme.icon}
                          <span className="text-[10px] uppercase font-bold">{theme.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Language</Label>
                    <Select
                      value={appSettings.language}
                      onValueChange={(value) => setAppSettings(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <div className="flex items-center gap-2">
                              <span>{lang.name}</span>
                              <span className="text-xs text-muted-foreground">({lang.native})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Text Scaling</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'small', label: 'Small', size: 'text-xs' },
                        { value: 'medium', label: 'Medium', size: 'text-sm' },
                        { value: 'large', label: 'Large', size: 'text-base' }
                      ].map((size) => (
                        <Button
                          key={size.value}
                          variant={appSettings.fontSize === size.value ? "default" : "outline"}
                          size="sm"
                          className={size.size}
                          onClick={() => setAppSettings(prev => ({ ...prev, fontSize: size.value as any }))}
                        >
                          {size.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4" /> Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'push', label: 'Push Notifications', desc: 'Alerts on lock screen' },
                    { key: 'email', label: 'Email Alerts', desc: 'Summaries and important updates' },
                    { key: 'inApp', label: 'In-App Badges', desc: 'Visual indicators inside app' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{item.label}</Label>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={(appSettings.notifications as any)[item.key]}
                        onCheckedChange={(checked) => setAppSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, [item.key]: checked }
                        }))}
                      />
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sound & Vibration</Label>
                      <p className="text-xs text-muted-foreground">Feedback for interactions</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Sound</span>
                        <Switch
                          checked={appSettings.notifications.sound}
                          onCheckedChange={(checked) => setAppSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, sound: checked }
                          }))}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Vibe</span>
                        <Switch
                          checked={appSettings.notifications.vibration}
                          onCheckedChange={(checked) => setAppSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, vibration: checked }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4" /> Data Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Image Download Quality</Label>
                    <Select
                      value={appSettings.dataUsage.imageQuality}
                      onValueChange={(value) => setAppSettings(prev => ({
                        ...prev,
                        dataUsage: { ...prev.dataUsage, imageQuality: value as any }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High Definition</SelectItem>
                        <SelectItem value="medium">Balanced</SelectItem>
                        <SelectItem value="low">Data Saver</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Background Sync</Label>
                      <p className="text-xs text-muted-foreground">Keep data updated when app is closed</p>
                    </div>
                    <Switch
                      checked={appSettings.dataUsage.backgroundSync}
                      onCheckedChange={(checked) => setAppSettings(prev => ({
                        ...prev,
                        dataUsage: { ...prev.dataUsage, backgroundSync: checked }
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Accessibility className="h-4 w-4" /> Accessibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'highContrast', label: 'High Contrast Mode', desc: 'Enhanced visibility' },
                    { key: 'reduceMotion', label: 'Reduce Motion', desc: 'Slower, simpler transitions' },
                    { key: 'screenReader', label: 'Screen Reader support', desc: 'Optimized for TalkBack/VoiceOver' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{item.label}</Label>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={(appSettings.accessibility as any)[item.key]}
                        onCheckedChange={(checked) => setAppSettings(prev => ({
                          ...prev,
                          accessibility: { ...prev.accessibility, [item.key]: checked }
                        }))}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Data Management Section */}
          <section id="data" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <HardDrive className="w-4 h-4 text-orange-500" />
              <h3 className="text-base font-semibold">Data & Storage</h3>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Storage Overview</CardTitle>
                <CardDescription>Manage your device storage and cached data.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Usage Status</span>
                    <span>{getStoragePercentage().toFixed(1)}% Full</span>
                  </div>
                  <Progress value={getStoragePercentage()} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Used: {formatBytes(storageUsage.used)}</span>
                    <span>Total: {formatBytes(storageUsage.total)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Cache', value: storageUsage.breakdown.cache, icon: <RefreshCw className="h-3 w-3" /> },
                    { label: 'Media', value: storageUsage.breakdown.media, icon: <Layout className="h-3 w-3" /> },
                    { label: 'Documents', value: storageUsage.breakdown.documents, icon: <FileText className="h-3 w-3" /> },
                    { label: 'Downloads', value: storageUsage.breakdown.downloads, icon: <Download className="h-3 w-3" /> }
                  ].map((item) => (
                    <div key={item.label} className="p-3 border rounded-xl bg-muted/20">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">
                        {item.icon} {item.label}
                      </div>
                      <div className="text-lg font-bold">{formatBytes(item.value)}</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="destructive" size="sm" onClick={handleClearCache} disabled={isClearingCache}>
                    {isClearingCache ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Clear Cache
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Share2 className="h-4 w-4" /> Data Portability
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">Download a complete archive of your local app settings and cached preferences.</p>
                  <Button
                    onClick={handleExportData}
                    disabled={isExportingData}
                    variant="outline"
                    className="w-full"
                  >
                    {isExportingData ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    Export App Data (JSON)
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4" /> Backup & Sync
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Auto Sync to Cloud</Label>
                    <Switch defaultChecked />
                  </div>
                  <Button variant="secondary" size="sm" className="w-full">
                    <Upload className="h-4 w-4 mr-2" /> Sync Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Advanced Section */}
          <section id="advanced" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Terminal className="w-4 h-4 text-purple-500" />
              <h3 className="text-base font-semibold">Advanced & System</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4" /> System Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-muted-foreground">Version</div>
                    <div className="font-mono font-bold">{advancedSettings.version}</div>
                    <div className="text-muted-foreground">Build</div>
                    <div className="font-mono">{advancedSettings.buildNumber}</div>
                    <div className="text-muted-foreground">Platform</div>
                    <div>Hybrid (Native Bridge)</div>
                    <div className="text-muted-foreground">API Level</div>
                    <div>v2.1 Stable</div>
                  </div>
                  <Separator className="my-2" />
                  <Button variant="ghost" size="sm" className="w-full text-primary hover:bg-primary/5">
                    <RefreshCw className="h-3 w-3 mr-2" /> Check for Software Updates
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Terminal className="h-4 w-4" /> Developer Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Debug Mode</Label>
                      <p className="text-[10px] text-muted-foreground">Verbose logging and inspection</p>
                    </div>
                    <Switch
                      checked={advancedSettings.debugMode}
                      onCheckedChange={(checked) => setAdvancedSettings(prev => ({ ...prev, debugMode: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Beta Features</Label>
                      <p className="text-[10px] text-muted-foreground">Access experimental tools</p>
                    </div>
                    <Switch
                      checked={advancedSettings.betaFeatures}
                      onCheckedChange={(checked) => setAdvancedSettings(prev => ({ ...prev, betaFeatures: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <ShieldAlert className="h-4 w-4" /> Danger Zone
                </CardTitle>
                <CardDescription className="text-destructive/80 font-medium">Actions here are permanent and cannot be undone.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="flex-1 border-destructive/30 hover:bg-destructive hover:text-white transition-colors">
                    <RefreshCw className="h-4 w-4 mr-2" /> Factory Reset App Settings
                  </Button>
                  <Button variant="destructive" className="flex-1 shadow-lg shadow-destructive/20">
                    <Trash2 className="h-4 w-4 mr-2" /> Erase All Local Content
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Scale className="h-4 w-4 mr-2" /> Terms of Service
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 mr-2" /> Privacy Policy
                  </Button>
                </div>
                <div className="text-center mt-4 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  &copy; 2024 Xordon Systems - All Rights Reserved
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
};

export default MobileSettings;