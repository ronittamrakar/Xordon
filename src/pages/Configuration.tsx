import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { 
  Key, 
  CheckCircle, 
  AlertTriangle, 
  Webhook, 
  Settings as SettingsIcon, 
  Settings2,
  Shield, 
  Database,
  Mail,
  Clock,
  HardDrive,
  Zap,
  Link as LinkIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function Configuration() {
  const { toast } = useToast();

  const [apiKeys, setApiKeys] = useState({
    openai: '',
    sendgrid: '',
    stripe: ''
  });

  const [webhooks, setWebhooks] = useState({
    formSubmission: 'https://api.xordon.com/webhooks/form-submission',
    emailBounce: 'https://api.xordon.com/webhooks/email-bounce',
    unsubscribe: 'https://api.xordon.com/webhooks/unsubscribe'
  });

  const [systemSettings, setSystemSettings] = useState({
    enableRateLimiting: true,
    maxEmailsPerHour: 1000,
    enableLogging: true,
    logRetentionDays: 30,
    enableBackups: true,
    backupFrequency: 'daily'
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const settings = await api.getSettings();
        if (!mounted) return;
        setApiKeys(settings.apiKeys || { openai: "", sendgrid: "", stripe: "" });
        setWebhooks(settings.webhooks || { 
          formSubmission: "https://api.xordon.com/webhooks/form-submission", 
          emailBounce: "https://api.xordon.com/webhooks/email-bounce", 
          unsubscribe: "https://api.xordon.com/webhooks/unsubscribe" 
        });
      } catch (err) {
        toast({ title: "Failed to load settings", description: String(err), variant: "destructive" });
      }
    })();
    return () => { mounted = false; };
  }, []);

  const saveApiKeys = async () => {
    try {
      await api.updateSettings({ apiKeys });
      toast({ title: "Saved", description: "API keys saved" });
    } catch (err) {
      toast({ title: "Save failed", description: String(err), variant: "destructive" });
    }
  };

  const updateWebhooks = async () => {
    try {
      await api.updateSettings({ webhooks });
      toast({ title: "Updated", description: "Webhooks updated" });
    } catch (err) {
      toast({ title: "Update failed", description: String(err), variant: "destructive" });
    }
  };

  const connectZapier = () => {
    window.open("https://zapier.com/apps/xordon/integrations", "_blank");
  };

  const testWebhook = (type: string) => {
    toast({ title: `Webhook test sent`, description: `Triggered sample ${type} event` });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between space-y-2 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configuration & Integrations</h1>
            <p className="text-muted-foreground">Manage system settings, integrations, and external services</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              System Healthy
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Zapier Integration */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" /> Zapier Integration
            </CardTitle>
            <CardDescription>Automate workflows with Xordon triggers and actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Use Zapier to connect Xordon with thousands of apps. Common zaps:
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                <li>New form submission → Create lead in CRM</li>
                <li>Bounce detected → Update recipient status</li>
                <li>Unsubscribe → Tag contact in marketing tool</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button onClick={connectZapier}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Connect Zapier
              </Button>
              <Button variant="outline" onClick={() => window.open("https://zapier.com/apps/xordon", "_blank")}>
                Explore Xordon on Zapier
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* API Keys Section */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys & Integrations
            </CardTitle>
            <CardDescription>
              Manage external service integrations and API credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-..."
                  value={apiKeys.openai}
                  onChange={(e) => setApiKeys({...apiKeys, openai: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
                <Input
                  id="sendgrid-key"
                  type="password"
                  placeholder="SG..."
                  value={apiKeys.sendgrid}
                  onChange={(e) => setApiKeys({...apiKeys, sendgrid: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripe-key">Stripe Secret Key</Label>
                <Input
                  id="stripe-key"
                  type="password"
                  placeholder="sk_..."
                  value={apiKeys.stripe}
                  onChange={(e) => setApiKeys({...apiKeys, stripe: e.target.value})}
                />
              </div>
            </div>
            <Button className="w-full" onClick={saveApiKeys}>Save API Keys</Button>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Email Service</span>
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Background Jobs</span>
              <Badge variant="outline" className="text-yellow-600">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Warning
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Storage</span>
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                85% Free
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks Configuration */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Endpoints
            </CardTitle>
            <CardDescription>
              Configure webhook URLs for external integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="form-webhook">Form Submission Webhook</Label>
                <Input
                  id="form-webhook"
                  placeholder="https://..."
                  value={webhooks.formSubmission}
                  onChange={(e) => setWebhooks({ ...webhooks, formSubmission: e.target.value })}
                />
                <Button variant="outline" onClick={() => testWebhook("form submission")}>Test</Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bounce-webhook">Email Bounce Webhook</Label>
                <Input
                  id="bounce-webhook"
                  placeholder="https://..."
                  value={webhooks.emailBounce}
                  onChange={(e) => setWebhooks({ ...webhooks, emailBounce: e.target.value })}
                />
                <Button variant="outline" onClick={() => testWebhook("email bounce")}>Test</Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unsubscribe-webhook">Unsubscribe Webhook</Label>
                <Input
                  id="unsubscribe-webhook"
                  placeholder="https://..."
                  value={webhooks.unsubscribe}
                  onChange={(e) => setWebhooks({ ...webhooks, unsubscribe: e.target.value })}
                />
                <Button variant="outline" onClick={() => testWebhook("unsubscribe")}>Test</Button>
              </div>
            </div>
            <Button onClick={updateWebhooks}>Update Webhooks</Button>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              System Settings
            </CardTitle>
            <CardDescription>
              Configure system-wide settings and limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rate Limiting</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable API rate limiting
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.enableRateLimiting}
                    onCheckedChange={(checked) => 
                      setSystemSettings({...systemSettings, enableRateLimiting: checked})
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-limit">Max Emails Per Hour</Label>
                  <Input
                    id="email-limit"
                    type="number"
                    value={systemSettings.maxEmailsPerHour}
                    onChange={(e) => 
                      setSystemSettings({...systemSettings, maxEmailsPerHour: parseInt(e.target.value)})
                    }
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable detailed system logs
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.enableLogging}
                    onCheckedChange={(checked) => 
                      setSystemSettings({...systemSettings, enableLogging: checked})
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="log-retention">Log Retention (Days)</Label>
                  <Input
                    id="log-retention"
                    type="number"
                    value={systemSettings.logRetentionDays}
                    onChange={(e) => 
                      setSystemSettings({...systemSettings, logRetentionDays: parseInt(e.target.value)})
                    }
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automatic Backups</Label>
                <p className="text-sm text-muted-foreground">
                  Enable automated database backups
                </p>
              </div>
              <Switch
                checked={systemSettings.enableBackups}
                onCheckedChange={(checked) => 
                  setSystemSettings({...systemSettings, enableBackups: checked})
                }
              />
            </div>
            
            <Button className="w-full">Save System Settings</Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full">
              <Key className="w-4 h-4 mr-2" />
              Rotate API Keys
            </Button>
            <Button variant="outline" className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              Security Audit
            </Button>
            <Button variant="outline" className="w-full">
              <Database className="w-4 h-4 mr-2" />
              Backup Now
            </Button>
            <Button variant="destructive" className="w-full">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Reset System
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
    </AppLayout>
  );
}
