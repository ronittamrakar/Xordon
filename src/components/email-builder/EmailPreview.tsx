import React, { useState } from 'react';
import { Monitor, Smartphone, Tablet, Code, Eye, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmailBlock, GlobalStyles } from './types';
import { generateEmailHtml } from './htmlGenerator';
import { useToast } from '@/hooks/use-toast';

interface EmailPreviewProps {
  blocks: EmailBlock[];
  globalStyles: GlobalStyles;
  subject: string;
  preheader?: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTHS: Record<DeviceType, string> = {
  desktop: '800px',
  tablet: '768px',
  mobile: '375px',
};

export const EmailPreview: React.FC<EmailPreviewProps> = ({
  blocks,
  globalStyles,
  subject,
  preheader,
}) => {
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const htmlContent = generateEmailHtml(blocks, globalStyles, subject, preheader);

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'HTML code copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy HTML',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-full w-full flex flex-col flex-1">
      {/* Preview Controls */}
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant={device === 'desktop' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setDevice('desktop')}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={device === 'tablet' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setDevice('tablet')}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant={device === 'mobile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setDevice('mobile')}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'preview' | 'html')}>
          <TabsList>
            <TabsTrigger value="preview" className="gap-1">
              <Eye className="h-3 w-3" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="html" className="gap-1">
              <Code className="h-3 w-3" />
              HTML
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto w-full">
        {viewMode === 'preview' ? (
          <div 
            className="p-4 min-h-full w-full"
            style={{ backgroundColor: globalStyles.backgroundColor }}
          >
            <div
              className={device === 'desktop' ? 'w-full' : 'mx-auto'}
              style={{
                width: device === 'desktop' ? '100%' : DEVICE_WIDTHS[device],
                maxWidth: device === 'desktop' ? 'none' : DEVICE_WIDTHS[device],
                transition: 'width 0.3s ease, max-width 0.3s ease',
              }}
            >
              {/* Email Client Header Simulation */}
              <div className="bg-white rounded-t-lg border border-b-0 p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-muted-foreground w-16">From:</span>
                    <span>Your Company &lt;noreply@example.com&gt;</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-muted-foreground w-16">To:</span>
                    <span>recipient@example.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-muted-foreground w-16">Subject:</span>
                    <span className="font-medium">{subject || 'No subject'}</span>
                  </div>
                </div>
              </div>

              {/* Email Content */}
              <div 
                className="border rounded-b-lg overflow-hidden"
                style={{ backgroundColor: globalStyles.backgroundColor }}
              >
                <iframe
                  srcDoc={htmlContent}
                  title="Email Preview"
                  className="w-full border-0"
                  style={{ 
                    minHeight: '600px',
                    backgroundColor: globalStyles.backgroundColor,
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-end p-2 border-b">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyHtml}
                className="gap-1"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy HTML
                  </>
                )}
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-all">
                {htmlContent}
              </pre>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailPreview;
