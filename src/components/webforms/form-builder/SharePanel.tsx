import { useState } from 'react';
import { Link } from 'react-router-dom';
import { webformsApi } from '@/services/webformsApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Share2, Copy, Link2, Mail, Globe, Code, QrCode, Download, ExternalLink,
  Settings, CheckCircle, Clock, Users, X, ChevronDown, Lock, UserPlus,
  ShoppingBag, Store, Plus, Trash2, Search, Send, Maximize, Layers,
  SlidersHorizontal, PanelRight, MessageSquare, Loader2
} from 'lucide-react';
import { Form } from './types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface SharePanelProps {
  form: Partial<Form>;
  onUpdate?: (updates: Partial<Form>) => void;
  activeSubItem?: 'share' | 'embed' | 'invite';
  onSubItemChange?: (subItem: 'share' | 'embed' | 'invite') => void;
  hideTabs?: boolean;
}

type EmbedType = 'standard' | 'full-page' | 'chatbox' | 'side-tab' | 'popup' | 'slider';

export default function SharePanel({ form, onUpdate, activeSubItem, onSubItemChange, hideTabs }: SharePanelProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uncontrolledMainTab, setUncontrolledMainTab] = useState<'share' | 'embed' | 'invite'>('share');
  const mainTab = activeSubItem ?? uncontrolledMainTab;
  const setMainTab = (next: 'share' | 'embed' | 'invite') => {
    if (activeSubItem !== undefined) {
      onSubItemChange?.(next);
      return;
    }
    setUncontrolledMainTab(next);
  };
  const [showQRModal, setShowQRModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [selectedEmbedType, setSelectedEmbedType] = useState<EmbedType>('standard');
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');



  const [embedSettings, setEmbedSettings] = useState({
    width: 100,
    widthUnit: '%' as '%' | 'px',
    height: 600,
    heightUnit: 'px' as '%' | 'px',
    transparentBg: false,
    autoOpen: false,
    align: 'right' as 'left' | 'right',
    buttonColor: '#000000',
    buttonText: 'Open Form',
    popupButton: true,
    backgroundOverlay: true,
  });

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.xordon.com';
  const formUrl = form?.id ? `${baseUrl}/f/${form.id}` : `${baseUrl}/f/new`;
  const embedUrl = form?.id ? `${baseUrl}/f/${form.id}?embed=true` : `${baseUrl}/f/new?embed=true`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) => webformsApi.inviteUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms', 'users'] });
      toast.success('Invitation sent successfully');
      setInviteEmail('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send invitation');
    },
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    if (!inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    inviteMutation.mutate({ email: inviteEmail, role: 'editor' });
  };

  const getEmbedCode = (type: EmbedType) => {
    const id = form?.id || 'FORM_ID';
    const w = `${embedSettings.width}${embedSettings.widthUnit}`;
    const h = `${embedSettings.height}${embedSettings.heightUnit}`;

    const iframeHtml = `<iframe src="${embedUrl}" width="${w}" height="${h}" frameborder="0" style="border:none;"></iframe>`;
    const fullPageIframeHtml = `<iframe src="${embedUrl}" width="100%" height="100vh" frameborder="0" style="position:fixed;top:0;left:0;right:0;bottom:0;border:none;"></iframe>`;

    switch (type) {
      case 'standard':
        return iframeHtml;
      case 'full-page':
        return fullPageIframeHtml;
      case 'chatbox':
        return `<!-- Chatbox-style launcher (iframe) -->\n<div id="xordonforms-chatbox-${id}"></div>\n<script>(function(){\n  var btn=document.createElement('button');\n  btn.textContent='${embedSettings.buttonText}';\n  btn.style.cssText='position:fixed;${embedSettings.align}:24px;bottom:24px;z-index:99999;background:${embedSettings.buttonColor};color:#fff;border:none;border-radius:9999px;padding:12px 16px;cursor:pointer;';\n  var wrap=document.createElement('div');\n  wrap.style.cssText='position:fixed;${embedSettings.align}:24px;bottom:80px;z-index:99999;width:360px;max-width:calc(100vw - 48px);height:520px;max-height:calc(100vh - 120px);display:none;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.2);background:#fff;';\n  var iframe=document.createElement('iframe');\n  iframe.src='${embedUrl}';\n  iframe.style.cssText='width:100%;height:100%;border:0;';\n  wrap.appendChild(iframe);\n  btn.onclick=function(){ wrap.style.display = (wrap.style.display==='none'?'block':'none'); };\n  document.body.appendChild(btn);\n  document.body.appendChild(wrap);\n})();</script>`;
      case 'side-tab':
        return `<!-- Side-tab launcher (iframe) -->\n<script>(function(){\n  var tab=document.createElement('button');\n  tab.textContent='${embedSettings.buttonText}';\n  tab.style.cssText='position:fixed;top:40%;${embedSettings.align}:-48px;z-index:99999;transform:rotate(${embedSettings.align === 'right' ? '-90deg' : '90deg'});transform-origin:center;background:${embedSettings.buttonColor};color:#fff;border:none;border-radius:12px;padding:10px 14px;cursor:pointer;';\n  var panel=document.createElement('div');\n  panel.style.cssText='position:fixed;top:0;bottom:0;${embedSettings.align}:0;z-index:99998;width:420px;max-width:calc(100vw - 40px);background:#fff;transform:translateX(${embedSettings.align === 'right' ? '100%' : '-100%'});transition:transform .25s ease;box-shadow:0 12px 40px rgba(0,0,0,.2);';\n  var iframe=document.createElement('iframe');\n  iframe.src='${embedUrl}';\n  iframe.style.cssText='width:100%;height:100%;border:0;';\n  panel.appendChild(iframe);\n  var open=false;\n  tab.onclick=function(){ open=!open; panel.style.transform=open?'translateX(0)':'translateX(${embedSettings.align === 'right' ? '100%' : '-100%'} )'; };\n  document.body.appendChild(panel);\n  document.body.appendChild(tab);\n})();</script>`;
      case 'popup':
        return `<!-- Popup embed (iframe) -->\n<button id="xordonforms-open-${id}" style="background:${embedSettings.buttonColor};color:#fff;border:none;border-radius:12px;padding:10px 14px;cursor:pointer;">${embedSettings.buttonText}</button>\n<div id="xordonforms-overlay-${id}" style="display:none;position:fixed;inset:0;z-index:99998;${embedSettings.backgroundOverlay ? 'background:rgba(0,0,0,.5);' : 'background:transparent;'}"></div>\n<div id="xordonforms-modal-${id}" style="display:none;position:fixed;inset:0;z-index:99999;align-items:center;justify-content:center;padding:24px;">\n  <div style="width:min(920px, 100%);height:min(90vh, 720px);background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.25);">\n    <iframe src="${embedUrl}" style="width:100%;height:100%;border:0;"></iframe>\n  </div>\n</div>\n<script>(function(){\n  var openBtn=document.getElementById('xordonforms-open-${id}');\n  var overlay=document.getElementById('xordonforms-overlay-${id}');\n  var modal=document.getElementById('xordonforms-modal-${id}');\n  function open(){ overlay.style.display='block'; modal.style.display='flex'; }\n  function close(){ overlay.style.display='none'; modal.style.display='none'; }\n  openBtn && openBtn.addEventListener('click', open);\n  overlay && overlay.addEventListener('click', close);\n})();</script>`;
      case 'slider':
        return `<!-- Bottom slider (iframe) -->\n<script>(function(){\n  var btn=document.createElement('button');\n  btn.textContent='${embedSettings.buttonText}';\n  btn.style.cssText='position:fixed;right:24px;bottom:24px;z-index:99999;background:${embedSettings.buttonColor};color:#fff;border:none;border-radius:12px;padding:10px 14px;cursor:pointer;';\n  var panel=document.createElement('div');\n  panel.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:99998;height:70vh;max-height:720px;background:#fff;transform:translateY(100%);transition:transform .25s ease;box-shadow:0 -12px 40px rgba(0,0,0,.2);';\n  var iframe=document.createElement('iframe');\n  iframe.src='${embedUrl}';\n  iframe.style.cssText='width:100%;height:100%;border:0;';\n  panel.appendChild(iframe);\n  var open=false;\n  btn.onclick=function(){ open=!open; panel.style.transform=open?'translateY(0)':'translateY(100%)'; };\n  document.body.appendChild(panel);\n  document.body.appendChild(btn);\n})();</script>`;
      default:
        return '';
    }
  };

  const shareViaSocial = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'linkedin' | 'email') => {
    const text = encodeURIComponent(`Check out: ${form?.title || 'Form'}`);
    const url = encodeURIComponent(formUrl);
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      email: `mailto:?subject=${encodeURIComponent(form?.title || 'Form')}&body=${url}`,
    };
    if (platform === 'email') {
      window.location.href = urls[platform];
    } else {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  const downloadQRCode = async () => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(formUrl)}`;
      window.open(qrUrl, '_blank');
      toast.success('QR code opened in new tab');
    } catch {
      toast.error('Failed to generate QR code');
    }
  };

  const renderEmbedPreview = () => {
    const embedTypeLabels: Record<EmbedType, string> = {
      standard: 'Standard iframe embed',
      'full-page': 'Full-page overlay',
      chatbox: 'Chatbox launcher',
      'side-tab': 'Side tab launcher',
      popup: 'Popup modal',
      slider: 'Bottom slider',
    };
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        <Code className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        <p>{embedTypeLabels[selectedEmbedType]}</p>
        <p className="text-xs mt-1">Preview will appear on your website</p>
      </div>
    );
  };

  const EmbedTypeCard = ({ type, title, icon: Icon, description }: { type: EmbedType; title: string; icon: React.ElementType; description: string }) => (
    <button
      onClick={() => { setSelectedEmbedType(type); setShowEmbedModal(true); }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left w-full',
        selectedEmbedType === type ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      )}
    >
      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <div>
        <span className="text-sm font-medium block">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </button>
  );

  const renderShareTab = () => (
    <div className="space-y-6 p-4">
      {/* Share Link */}
      <div className="rounded-xl border p-5">
        <h3 className="text-sm font-medium mb-4">Share Link</h3>
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex items-center bg-muted rounded-lg px-4 py-2.5">
            <Lock className="h-4 w-4 text-muted-foreground mr-3 flex-shrink-0" />
            <input
              type="text"
              readOnly
              value={formUrl}
              className="flex-1 text-sm bg-transparent outline-none min-w-0"
            />
            <button
              onClick={() => window.open(formUrl, '_blank')}
              className="p-1.5 hover:bg-background rounded-lg ml-2"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <Button onClick={() => copyToClipboard(formUrl, 'Link')}>
            <Copy className="h-4 w-4 mr-2" /> Copy
          </Button>
        </div>
      </div>

      {/* Share On Social */}
      <div className="rounded-xl border p-5">
        <h3 className="text-sm font-medium mb-4">Share On</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => shareViaSocial('whatsapp')}
            className="w-10 h-10 bg-muted border rounded-lg hover:bg-muted/80 flex items-center justify-center"
            title="WhatsApp"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <button
            onClick={() => shareViaSocial('facebook')}
            className="w-10 h-10 bg-muted border rounded-lg hover:bg-muted/80 flex items-center justify-center"
            title="Facebook"
          >
            <Globe className="h-5 w-5" />
          </button>
          <button
            onClick={() => shareViaSocial('twitter')}
            className="w-10 h-10 bg-muted border rounded-lg hover:bg-muted/80 flex items-center justify-center"
            title="X/Twitter"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => shareViaSocial('linkedin')}
            className="w-10 h-10 bg-muted border rounded-lg hover:bg-muted/80 flex items-center justify-center"
            title="LinkedIn"
          >
            <Users className="h-5 w-5" />
          </button>
          <button
            onClick={() => shareViaSocial('email')}
            className="w-10 h-10 bg-muted border rounded-lg hover:bg-muted/80 flex items-center justify-center"
            title="Email"
          >
            <Mail className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowQRModal(true)}
            className="w-10 h-10 bg-muted border rounded-lg hover:bg-muted/80 flex items-center justify-center"
            title="QR Code"
          >
            <QrCode className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Form Status */}
      <div className={cn(
        'rounded-xl border p-5',
        form?.status === 'published' ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {form?.status === 'published' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">Form is Live</p>
                  <p className="text-xs text-green-600 dark:text-green-500">Accepting responses</p>
                </div>
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Draft Mode</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500">Publish to accept responses</p>
                </div>
              </>
            )}
          </div>
          {form?.status !== 'published' && onUpdate && (
            <Button
              onClick={() => onUpdate({ status: 'published' })}
              size="sm"
            >
              Publish Form
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const getPlatformContent = (platform: string) => {
    switch (platform) {
      case 'wordpress':
        return {
          title: 'WordPress',
          instructions: 'Copy the standard embed code below and paste it into a "Custom HTML" block in your WordPress editor.',
        };
      case 'shopify':
        return {
          title: 'Shopify',
          instructions: 'Copy the standard embed code and paste it into a "Custom Liquid" section or directly into the HTML of your page content.',
        };
      case 'wix':
        return {
          title: 'Wix',
          instructions: 'Add an "Embed HTML" element to your site and paste the code below.',
        };
      case 'squarespace':
        return {
          title: 'Squarespace',
          instructions: 'Add a "Code" block to your page and paste the embed code below. Make sure "Display Source" is unchecked.',
        };
      default:
        return {
          title: platform,
          instructions: 'Copy the code below and paste it into your website HTML.',
        };
    }
  };

  const renderEmbedTab = () => (
    <div className="space-y-6 p-4">
      <div className="rounded-xl border p-5">
        <h3 className="text-sm font-medium mb-4">Embed Type</h3>
        <div className="grid grid-cols-1 gap-3">
          <EmbedTypeCard type="standard" title="Standard Embed" icon={Code} description="Embed form in your page" />
          <EmbedTypeCard type="full-page" title="Full Page" icon={Maximize} description="Full screen form" />
          <EmbedTypeCard type="popup" title="Popup" icon={Layers} description="Open in modal popup" />
          <EmbedTypeCard type="side-tab" title="Side Tab" icon={PanelRight} description="Slide-in from side" />
          <EmbedTypeCard type="slider" title="Slider" icon={SlidersHorizontal} description="Slide-in panel" />
        </div>
      </div>

      {/* Platform Integration */}
      <div className="rounded-xl border p-5">
        <h3 className="text-sm font-medium mb-4">Platform Integration</h3>
        <div className="space-y-2">
          {['wordpress', 'shopify', 'wix', 'squarespace'].map((platform) => {
            const { title, instructions } = getPlatformContent(platform);
            return (
              <div key={platform} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedPlatform(expandedPlatform === platform ? null : platform)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <Store className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium capitalize">{title}</span>
                  </div>
                  <ChevronDown className={cn('h-4 w-4 transition-transform', expandedPlatform === platform && 'rotate-180')} />
                </button>
                {expandedPlatform === platform && (
                  <div className="p-4 border-t bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-3">{instructions}</p>
                    <textarea
                      readOnly
                      value={getEmbedCode('standard')}
                      className="w-full h-20 px-3 py-2 bg-background border rounded-lg text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => copyToClipboard(getEmbedCode('standard'), 'Embed code')}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy Code
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as any)} className="flex-1 flex flex-col">
        {!hideTabs && (
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
            <TabsTrigger
              value="share"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <Share2 className="h-4 w-4 mr-2" /> Share
            </TabsTrigger>
            <TabsTrigger
              value="embed"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <Code className="h-4 w-4 mr-2" /> Embed
            </TabsTrigger>
            <TabsTrigger
              value="invite"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <UserPlus className="h-4 w-4 mr-2" /> Invite
            </TabsTrigger>
          </TabsList>
        )}

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="share" className="mt-0 h-full">
            {renderShareTab()}
          </TabsContent>
          <TabsContent value="embed" className="mt-0 h-full">
            {renderEmbedTab()}
          </TabsContent>
          <TabsContent value="invite" className="mt-0 h-full p-4">
            <div className="space-y-4">
              <div className="rounded-xl border p-5">
                <h3 className="text-sm font-medium mb-4">Invite Collaborators</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter email address"
                    className="flex-1"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Button onClick={handleInvite} disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Invite
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Invite team members to collaborate on this form in your workspace.
                </p>
              </div>

              <div className="rounded-xl border p-5 bg-muted/30">
                <h3 className="text-sm font-medium mb-2">Team Management</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Manage all team members and their permissions in the Users settings.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate('/forms/users')}>
                  <Users className="h-4 w-4 mr-2" /> Manage Team
                </Button>
              </div>

              <div className="rounded-xl border p-5">
                <h3 className="text-sm font-medium mb-3">Quick Share Links</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Public Form URL</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{formUrl}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(formUrl, 'Form URL')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Embed URL</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{embedUrl}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(embedUrl, 'Embed URL')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to open the form on any device
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(formUrl)}`}
              alt="QR Code"
              className="w-48 h-48 border rounded-lg"
            />
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Scan this QR code to open the form
            </p>
            <Button onClick={downloadQRCode} className="mt-4">
              <Download className="h-4 w-4 mr-2" /> Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Embed Settings Modal */}
      <Dialog open={showEmbedModal} onOpenChange={setShowEmbedModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Embed Settings - {selectedEmbedType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</DialogTitle>
            <DialogDescription>
              Customize and copy the embed code for your website
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedEmbedType === 'standard' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Width</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={embedSettings.width}
                      onChange={(e) => setEmbedSettings({ ...embedSettings, width: parseInt(e.target.value) || 100 })}
                    />
                    <select
                      value={embedSettings.widthUnit}
                      onChange={(e) => setEmbedSettings({ ...embedSettings, widthUnit: e.target.value as any })}
                      className="w-20 border rounded-md px-2"
                    >
                      <option value="%">%</option>
                      <option value="px">px</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Height</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={embedSettings.height}
                      onChange={(e) => setEmbedSettings({ ...embedSettings, height: parseInt(e.target.value) || 600 })}
                    />
                    <select
                      value={embedSettings.heightUnit}
                      onChange={(e) => setEmbedSettings({ ...embedSettings, heightUnit: e.target.value as any })}
                      className="w-20 border rounded-md px-2"
                    >
                      <option value="px">px</option>
                      <option value="%">%</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Embed Code</Label>
              <textarea
                readOnly
                value={getEmbedCode(selectedEmbedType)}
                className="w-full h-32 px-3 py-2 bg-muted border rounded-lg text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="rounded-xl border bg-muted/40 p-3">{renderEmbedPreview()}</div>
            </div>

            <Button onClick={() => copyToClipboard(getEmbedCode(selectedEmbedType), 'Embed code')} className="w-full">
              <Copy className="h-4 w-4 mr-2" /> Copy Embed Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
