import { Link } from 'react-router-dom';
import {
  Palette,
  ExternalLink,
  ArrowRight,
  Settings,
  Type,
  Image,
  Paintbrush,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WebFormsBrand() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Brand Kit</h1>
          <p className="text-muted-foreground">
            Customize your forms with your brand identity
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Brand Management
          </CardTitle>
          <CardDescription>
            Your brand kit is managed at the workspace level and applies across all modules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Image className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Logo</p>
                <p className="text-sm text-muted-foreground">
                  Upload your company logo
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Paintbrush className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Colors</p>
                <p className="text-sm text-muted-foreground">
                  Define your brand colors
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Type className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Typography</p>
                <p className="text-sm text-muted-foreground">
                  Choose your brand fonts
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Your global brand kit settings will be applied to all forms, landing pages,
              and other public-facing content. You can also customize individual form styles
              in the Webforms Settings.
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Global Brand Settings
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/settings#forms">
                  <Palette className="h-4 w-4 mr-2" />
                  Form-Specific Styles
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's included */}
      <Card>
        <CardHeader>
          <CardTitle>What's in Your Brand Kit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <Image className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Logo & Favicon</p>
                <p className="text-sm text-muted-foreground">
                  Your logo appears on forms, emails, and the form header. Favicon is shown in browser tabs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <Paintbrush className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Color Palette</p>
                <p className="text-sm text-muted-foreground">
                  Primary, secondary, and accent colors used for buttons, links, and highlights.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <Type className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Typography</p>
                <p className="text-sm text-muted-foreground">
                  Font families for headings and body text, plus size and weight settings.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <Settings className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Layout & Style</p>
                <p className="text-sm text-muted-foreground">
                  Border radius, spacing, button styles, and shadow intensity for a consistent look.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form-specific overrides */}
      <Card className="border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Palette className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-purple-800 dark:text-purple-200">
                Need form-specific customization?
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                You can override global brand settings for individual forms. Go to{' '}
                <Link to="/settings#forms" className="underline">
                  Webforms Settings → Branding
                </Link>{' '}
                to set form-specific colors, custom CSS, and more.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
