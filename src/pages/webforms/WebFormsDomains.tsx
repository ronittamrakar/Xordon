import { Link } from 'react-router-dom';
import {
  Globe,
  ExternalLink,
  ArrowRight,
  Shield,
  Zap,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WebFormsDomains() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Custom Domains</h1>
          <p className="text-muted-foreground">
            Connect custom domains to host your forms under your brand
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Domain Management
          </CardTitle>
          <CardDescription>
            Custom domains are managed at the workspace level and can be used across all modules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Custom URLs</p>
                <p className="text-sm text-muted-foreground">
                  Host forms at forms.yourdomain.com
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Free SSL</p>
                <p className="text-sm text-muted-foreground">
                  Automatic HTTPS for all domains
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Fast Setup</p>
                <p className="text-sm text-muted-foreground">
                  Simple DNS configuration
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Domains configured in your workspace settings will be available for use with Webforms,
              Landing Pages, Booking Pages, and other public-facing features.
            </p>
            <Button asChild>
              <Link to="/settings?tab=domains">
                <Settings className="h-4 w-4 mr-2" />
                Manage Custom Domains
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>How Custom Domains Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Add your domain</p>
                <p className="text-sm text-muted-foreground">
                  Go to Settings → Domains and add your custom domain (e.g., forms.yourcompany.com)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Configure DNS</p>
                <p className="text-sm text-muted-foreground">
                  Add a CNAME record pointing to our servers. We'll provide the exact values.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Verify and use</p>
                <p className="text-sm text-muted-foreground">
                  Once verified, your forms will be accessible at your custom domain with automatic SSL.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">
                Need help setting up your domain?
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Check our documentation for step-by-step guides on configuring DNS records
                for popular domain providers like GoDaddy, Cloudflare, and Namecheap.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
