import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  Phone,
  Users,
  Play,
  Pause,
  Settings,
  FileTextIcon,
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Save,
  Edit3,
  Trash2,
  Tag,
  XCircle,
  Clock3,
  User,
  Building,
  Mail,
  MessageSquare,
  Plus,
  CheckCircle,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Search,
  Eye,
  ArrowUpRight,
  CalendarCheck,
  AlertCircle,
  Workflow,
  Copy,
  Sparkles,
  Loader2
} from 'lucide-react';
import { api, CallScript, FollowUpAutomation } from '@/lib/api';
import { CallCampaign, CallRecipient } from '@/lib/api';
import { useCallSession } from '@/contexts/CallSessionContext';

interface CallDisposition {
  id: string;
  name: string;
  color: string;
  description?: string;
}

// Add Contacts Dialog Component
interface AddContactsDialogProps {
  campaignId: string;
  onClose: () => void;
}

// Consolidated helper to replace all possible variables in script
const getPersonalizedScript = (scriptText: string, campaign: CallCampaign | null | undefined, recipient?: CallRecipient | null) => {
  if (!scriptText) return '';
  let personalizedScript = scriptText;

  // 1. Recipient Variables (from VARIABLE_CATEGORIES - Contact & Location)
  if (recipient) {
    const vars: Record<string, string> = {
      firstName: recipient.firstName || '',
      lastName: recipient.lastName || '',
      fullName: recipient.name || `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || '',
      email: recipient.email || '',
      phone: recipient.phone || '',
      company: recipient.company || '',
      title: recipient.title || '',
      city: recipient.city || campaign?.city || '',
      state: recipient.state || recipient.province || campaign?.province || '',
      province: recipient.province || campaign?.province || '',
      address: recipient.address || '',
      zipCode: recipient.zipCode || recipient.postalCode || '',
      industry: recipient.industry || '',
      serviceArea1: recipient.serviceArea1 || campaign?.serviceArea1 || '',
      serviceArea2: recipient.serviceArea2 || campaign?.serviceArea2 || '',
      serviceArea3: recipient.serviceArea3 || campaign?.serviceArea3 || '',
      custom1: recipient.custom1 || '',
      custom2: recipient.custom2 || '',
      custom3: recipient.custom3 || '',
      notes: recipient.notes || '',
    };

    Object.entries(vars).forEach(([key, val]) => {
      const placeholder = val || `[${key}]`;
      // Replace {{key}}
      const re1 = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
      personalizedScript = personalizedScript.replace(re1, placeholder);
      // Replace [key]
      const re2 = new RegExp(`\\[\\s*${key}\\s*\\]`, 'gi');
      personalizedScript = personalizedScript.replace(re2, placeholder);
    });
  }

  // 2. Campaign & Agent Variables
  if (campaign) {
    const vars: Record<string, string> = {
      campaignName: campaign.name || '',
      agentName: campaign.agent_name || campaign.agent_id || '',
      callerID: campaign.caller_id || '',
      callbackNumber: campaign.callback_number || campaign.caller_id || '',
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      currentDay: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    };

    Object.entries(vars).forEach(([key, val]) => {
      const placeholder = val || `[${key}]`;
      const re1 = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
      personalizedScript = personalizedScript.replace(re1, placeholder);
      const re2 = new RegExp(`\\[\\s*${key}\\s*\\]`, 'gi');
      personalizedScript = personalizedScript.replace(re2, placeholder);
    });
  }

  return personalizedScript;
};

// Check if script contains HTML
const isHtmlContent = (text: string) => {
  return /<[a-z][\s\S]*>/i.test(text);
};

// Format script content with premium styles (supports both HTML and plain text)
const formatScriptWithStyles = (content: string) => {
  // If it's HTML, we'll use dangerouslySetInnerHTML with some class injections
  if (isHtmlContent(content)) {
    return (
      <div
        className="prose prose-slate dark:prose-invert max-w-none 
          prose-headings:text-primary prose-headings:font-bold 
          prose-p:leading-relaxed prose-strong:text-primary 
          prose-blockquote:border-l-4 prose-blockquote:border-primary/50 
          prose-blockquote:bg-primary/5 prose-blockquote:px-4 prose-blockquote:py-1 
          prose-blockquote:rounded-r-lg"
        dangerouslySetInnerHTML={{
          __html: content
            .replace(/<strong>/gi, '<strong class="text-primary font-bold">')
            .replace(/<blockquote>/gi, '<blockquote class="border-l-4 border-primary/50 bg-primary/5 px-4 py-2 my-4 italic rounded-r-lg text-sm text-muted-foreground whitespace-pre-wrap">')
        }}
      />
    );
  }

  // Otherwise, handle plain text formatting
  const lines = content.split('\n');
  return lines.map((line, index) => {
    const trimmedLine = line.trim();

    // Check if line is a header (like INTRODUCTION:, STEP 1:, etc.)
    const isHeader = /^(#{1,3}\s|introduction|opening|greeting|pitch|offer|closing|rebuttal|objection|value prop|cta|call to action|next steps|instructions|notes)[:.]?\s*$/i.test(trimmedLine) ||
      /^[A-Z][A-Z\s]+:/.test(trimmedLine) ||
      (trimmedLine.endsWith(':') && trimmedLine.length < 40);

    // Check if it's a quote/rebuttal
    const isBlockquote = /^(say|rebuttal|respond with|if they say|response|answer)[:.]?\s*/i.test(trimmedLine);

    if (isHeader) {
      return (
        <h3 key={index} className="text-sm font-bold text-primary mt-6 mb-2 uppercase tracking-wide flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          {line}
        </h3>
      );
    } else if (isBlockquote) {
      return (
        <div key={index} className="border-l-4 border-primary/40 bg-primary/5 px-4 py-3 my-3 italic rounded-r-lg text-muted-foreground shadow-sm">
          {line}
        </div>
      );
    } else if (trimmedLine === '') {
      return <div key={index} className="h-2" />;
    } else {
      return <p key={index} className="my-1.5 leading-relaxed text-sm">{line}</p>;
    }
  });
};

const AddContactsToCapaignDialog: React.FC<AddContactsDialogProps> = ({ campaignId, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', 'call'],
    queryFn: async () => {
      const result = await api.getContacts('call');
      return result;
    }
  });

  const filteredContacts = contacts.filter((contact: CallRecipient) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    return (
      fullName.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.phone?.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query)
    );
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredContacts.map((c: CallRecipient) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectContact = (contactId: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(contactId);
    } else {
      newSelectedIds.delete(contactId);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleAddContacts = async () => {
    if (selectedIds.size === 0) return;

    setIsAdding(true);
    try {
      const selectedContacts = contacts.filter((c: CallRecipient) => selectedIds.has(c.id));

      // Add each contact as a recipient
      await Promise.all(
        selectedContacts.map(async (contact: CallRecipient) => {
          const nameParts = (contact.name || '').split(' ');
          await api.createCallRecipient({
            campaign_id: campaignId,
            phone: contact.phone || '',
            firstName: contact.firstName || nameParts[0] || '',
            lastName: contact.lastName || nameParts.slice(1).join(' ') || '',
            email: contact.email || '',
            company: contact.company || '',
            title: contact.title || '',
            status: 'pending'
          } as any);
        })
      );

      toast({
        title: 'Contacts Added',
        description: `${selectedIds.size} contacts have been added to the campaign`,
      });
      onClose();
    } catch (error) {
      console.error('Failed to add contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to add some contacts to the campaign',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading contacts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          {selectedIds.size} of {contacts.length} selected
        </div>
      </div>

      <div className="border rounded-lg max-h-96 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="text-left p-3 font-medium w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredContacts.length && filteredContacts.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Phone</th>
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-left p-3 font-medium">Company</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                  No contacts found
                </td>
              </tr>
            ) : (
              filteredContacts.map((contact: CallRecipient) => (
                <tr key={contact.id} className="border-t hover:bg-muted/50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(contact.id)}
                      onChange={(e) => handleSelectContact(contact.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="p-3 font-medium">{contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || '-'}</td>
                  <td className="p-3">{contact.phone || '-'}</td>
                  <td className="p-3">{contact.email || '-'}</td>
                  <td className="p-3">{contact.company || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleAddContacts}
          disabled={selectedIds.size === 0 || isAdding}
        >
          {isAdding ? 'Adding...' : `Add ${selectedIds.size} Contact${selectedIds.size !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
};

// Call Script Section Component
interface CallScriptSectionProps {
  campaign: CallCampaign;
  activeCallRecipient: CallRecipient | null;
  showScriptDialog: boolean;
  setShowScriptDialog: (show: boolean) => void;
  onScriptUpdate: (newScript: string) => void;
}

const CallScriptSection: React.FC<CallScriptSectionProps> = ({
  campaign,
  activeCallRecipient,
  showScriptDialog,
  setShowScriptDialog,
  onScriptUpdate
}) => {
  const [scriptSearchTerm, setScriptSearchTerm] = useState('');
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [editedScript, setEditedScript] = useState(campaign?.call_script || '');
  const [isEditing, setIsEditing] = useState(false);
  const [showFullScriptModal, setShowFullScriptModal] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const { toast } = useToast();

  // Fetch available call scripts
  const { data: callScripts = [], isLoading: scriptsLoading } = useQuery({
    queryKey: ['call-scripts'],
    queryFn: async () => {
      try {
        const scripts = await api.getCallScripts();
        return scripts || [];
      } catch (error) {
        console.error('Failed to fetch call scripts:', error);
        return [];
      }
    }
  });

  // Filter scripts based on search
  const filteredScripts = callScripts.filter((script: CallScript) => {
    if (!scriptSearchTerm) return true;
    const query = scriptSearchTerm.toLowerCase();
    return (
      script.name?.toLowerCase().includes(query) ||
      script.description?.toLowerCase().includes(query) ||
      script.category?.toLowerCase().includes(query)
    );
  });

  // Find the currently selected script (from campaign)
  const currentScript = callScripts.find((s: CallScript) =>
    s.script === campaign?.call_script || s.id === selectedScriptId
  );

  // Update edited script when campaign changes
  useEffect(() => {
    if (campaign?.call_script) {
      setEditedScript(campaign.call_script);
    }
  }, [campaign?.call_script]);

  const handleSelectScript = (script: CallScript) => {
    setSelectedScriptId(script.id);
    setEditedScript(script.script);
    onScriptUpdate(script.script);
    setShowScriptDialog(false);
  };

  const handleAIGeneration = async () => {
    if (!aiPrompt) {
      toast({
        title: "Prompt required",
        description: "Please enter what you want the AI to generate",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await api.generateAiContent({
        channel: 'call',
        prompt: `Generate a high-converting call script for a campaign named "${campaign.name}". ${aiPrompt}`,
        action: 'draft',
        context: {
          campaignName: campaign.name,
          description: campaign.description,
          existingContent: editedScript
        }
      });

      if (response && response.content) {
        setEditedScript(response.content);
        toast({
          title: "AI Draft Generated",
          description: "Your script has been updated with AI content.",
        });
      }
    } catch (error) {
      toast({
        title: "AI Generation Failed",
        description: "Could not generate script content",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSaveScript = () => {
    onScriptUpdate(editedScript);
    setIsEditing(false);
  };

  const handleCopyScript = () => {
    copyScriptToClipboard(editedScript || campaign?.call_script || '');
  };

  const copyScriptToClipboard = async (text: string) => {
    try {
      const plainText = isHtmlContent(text)
        ? text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        : text;

      await navigator.clipboard.writeText(plainText);
      toast({
        title: "Copied",
        description: "Script copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy script",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="mb-6 overflow-hidden border-primary/10 shadow-sm transition-all hover:shadow-md">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5 text-primary" />
            Call Script
          </span>
          <div className="flex items-center space-x-2">
            {(editedScript || campaign?.call_script) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullScriptModal(true)}
                className="bg-blue-50/50 hover:bg-blue-100 text-blue-700 border-blue-200 h-8"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}

            {(editedScript || campaign?.call_script) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyScript}
                title="Copy to clipboard"
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}

            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="h-8">
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 h-8">
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Refine
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">AI Assistant</Label>
                        <Textarea
                          placeholder="e.g., Rewrite to be more punchy, add a professional closing, or focus on benefits..."
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          className="min-h-[100px] text-xs resize-none focus-visible:ring-purple-500"
                        />
                      </div>
                      <Button
                        size="sm"
                        className="w-full bg-purple-600 hover:bg-purple-700 h-9"
                        onClick={handleAIGeneration}
                        disabled={isGeneratingAI}
                      >
                        {isGeneratingAI ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Drafting...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate with AI
                          </>
                        )}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button size="sm" onClick={handleSaveScript} className="h-8 bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  setEditedScript(campaign?.call_script || '');
                  setIsEditing(false);
                }} className="h-8">
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardTitle>
        <div className="flex items-center gap-2 mt-1">
          {currentScript && (
            <CardDescription className="flex items-center gap-1.5">
              Using: <span className="font-semibold text-foreground">{currentScript.name}</span>
              {currentScript.category && <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 ml-1">{currentScript.category}</Badge>}
            </CardDescription>
          )}
          {editedScript && (
            <Badge variant="outline" className={`text-[10px] h-4 ml-auto border-dashed ${editedScript.length > 500 ? 'text-green-600 border-green-200' : 'text-amber-600 border-amber-200'
              }`}>
              {editedScript.length > 500 ? 'Comprehensive' : 'Standard'}
            </Badge>
          )}
        </div>

        {/* Full Script Preview Modal */}
        <Dialog open={showFullScriptModal} onOpenChange={setShowFullScriptModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] overflow-hidden flex flex-col p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="flex items-center text-xl gap-2">
                <FileTextIcon className="h-6 w-6 text-primary" />
                Script Preview
                {currentScript?.category && (
                  <Badge variant="secondary" className="ml-1 uppercase text-[10px]">{currentScript.category}</Badge>
                )}
              </DialogTitle>
              <DialogDescription className="mt-2">
                {activeCallRecipient ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">Showing personalized version for:</span>
                    <Badge className="bg-green-50 text-green-700 border-green-100 hover:bg-green-50 shadow-none font-medium">
                      <User className="h-3 w-3 mr-1" />
                      {activeCallRecipient.name || `${activeCallRecipient.firstName} ${activeCallRecipient.lastName}`}
                    </Badge>
                    {activeCallRecipient.company && (
                      <Badge variant="outline" className="text-muted-foreground border-slate-200">
                        <Building className="h-3 w-3 mr-1" />
                        {activeCallRecipient.company}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span>General campaign script preview</span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 py-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-6 md:p-10 border shadow-inner transition-all">
                <div className="max-w-3xl mx-auto backdrop-blur-sm bg-background/80 rounded-xl p-8 border border-white/20 shadow-xl">
                  {formatScriptWithStyles(getPersonalizedScript(editedScript || campaign?.call_script || '', campaign, activeCallRecipient))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-between bg-muted/20">
              <p className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Contact variables have been automatically replaced
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyScript}>
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  Copy Text
                </Button>
                <Button size="sm" onClick={() => setShowFullScriptModal(false)}>
                  Close Preview
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pt-4">
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={editedScript}
              onChange={(e) => setEditedScript(e.target.value)}
              placeholder="Paste or write your call script here..."
              className="min-h-[300px] font-sans text-sm leading-relaxed focus-visible:ring-primary/20 transition-all border-primary/20"
            />
            <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground bg-muted/50 p-3 rounded-lg border border-dashed">
              <span className="font-semibold uppercase text-[9px] text-primary/70">Available Variables:</span>
              <code>{`{{firstName}}`}</code>, <code>{`{{lastName}}`}</code>, <code>{`{{company}}`}</code>, <code>{`{{city}}`}</code>, <code>{`{{currentDay}}`}</code>, <code>{`{{campaignName}}`}</code>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-background rounded-xl p-6 border shadow-sm max-h-[400px] overflow-y-auto custom-scrollbar relative">
              <div className="absolute top-3 right-3 opacity-10 pointer-events-none">
                <FileTextIcon className="h-24 w-24" />
              </div>
              {editedScript || campaign?.call_script ? (
                formatScriptWithStyles(getPersonalizedScript(editedScript || campaign.call_script || '', campaign, activeCallRecipient))
              ) : (
                <div className="text-center py-10 text-muted-foreground italic">
                  <p>No script has been added to this campaign yet.</p>
                  <Button variant="link" onClick={() => setIsEditing(true)} className="mt-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Click to add script
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Dialog open={showScriptDialog} onOpenChange={setShowScriptDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border-dashed">
                    <Search className="h-4 w-4 mr-2" />
                    Load Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Select a Script Template</DialogTitle>
                    <DialogDescription>
                      Choose from your saved call scripts to apply to this campaign.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input
                      placeholder="Search scripts..."
                      value={scriptSearchTerm}
                      onChange={(e) => setScriptSearchTerm(e.target.value)}
                    />
                    <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                      {filteredScripts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground italic">
                          No matching scripts found.
                        </div>
                      ) : (
                        filteredScripts.map((script: CallScript) => (
                          <div
                            key={script.id}
                            className="p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group flex flex-col gap-1"
                            onClick={() => handleSelectScript(script)}
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{script.name}</h4>
                              <Badge variant="outline" className="text-[10px]">{script.category || 'General'}</Badge>
                            </div>
                            {script.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{script.description}</p>
                            )}
                            <div className="flex gap-1 mt-1">
                              {script.tags?.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-muted-foreground">#{tag}</span>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {activeCallRecipient && (
                <div className="text-[11px] text-muted-foreground bg-green-50/50 dark:bg-green-950/10 px-3 py-1.5 rounded-full border border-green-100 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live personalized preview for: <strong>{activeCallRecipient.name || `${activeCallRecipient.firstName} ${activeCallRecipient.lastName}`}</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Editable Row Component for spreadsheet-like editing
// Updated to include agent column visibility - TypeScript cache refresh
interface ColumnVisibilityType {
  name: boolean;
  email: boolean;
  phone: boolean;
  company: boolean;
  agent: boolean;
  status: boolean;
  disposition: boolean;
  notes: boolean;
  tags: boolean;
  lastCall: boolean;
  followup: boolean;
  actions: boolean;
};

interface EditableRecipientRowProps {
  recipient: CallRecipient;
  campaign: CallCampaign;
  isSelected: boolean;
  onSelect: () => void;
  onStartCall: () => void;
  onUpdate: (updates: Partial<CallRecipient>) => Promise<void>;
  onPreviewScript: (recipient: CallRecipient) => void;
  dispositionOptions: CallDisposition[];
  isCalling: boolean;
  visibleColumns: ColumnVisibilityType;
  getDispositionColor: (dispositionId: string) => string;
  generateFollowUpRecommendation: (recipient: CallRecipient) => string[];
}

const EditableRecipientRow: React.FC<EditableRecipientRowProps> = ({
  recipient,
  campaign,
  isSelected,
  onSelect,
  onStartCall,
  onUpdate,
  onPreviewScript,
  dispositionOptions,
  isCalling,
  visibleColumns,
  getDispositionColor,
  generateFollowUpRecommendation
}) => {
  const { toast } = useToast();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    notes: recipient.notes || '',
    tags: recipient.tags?.join(', ') || '',
    disposition_id: recipient.disposition_id || ''
  });

  // Sync editValues when recipient prop changes (after successful update)
  useEffect(() => {
    setEditValues({
      notes: recipient.notes || '',
      tags: recipient.tags?.join(', ') || '',
      disposition_id: recipient.disposition_id || ''
    });
  }, [recipient.notes, recipient.tags, recipient.disposition_id]);

  const handleSaveField = async (field: string, value: string) => {
    console.log('handleSaveField called:', { field, value });
    const updates: Partial<CallRecipient> = {};

    if (field === 'notes') {
      updates.notes = value;
    } else if (field === 'tags') {
      updates.tags = value.split(',').map(t => t.trim()).filter(t => t);
    } else if (field === 'disposition_id') {
      updates.disposition_id = value;
    }

    console.log('Sending updates:', updates);

    try {
      // Call the parent's onUpdate function which handles the API call
      await onUpdate(updates);

      // Trigger follow-up check if disposition or notes changed
      if (field === 'disposition_id' || field === 'notes') {
        console.log('Triggering follow-up check for field:', field);
        // This will trigger the useEffect that checks for matching automations
        setTimeout(() => {
          // Force re-evaluation of follow-ups
          const recipientWithUpdates = { ...recipient, ...updates };
          console.log('Checking follow-ups for updated recipient:', recipientWithUpdates);
        }, 100);
      }

      toast({
        title: 'Updated',
        description: `${field} updated successfully`,
      });
    } catch (error) {
      console.error('Failed to update recipient:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update recipient',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'called':
        return <Badge className="bg-green-100 text-green-800 text-xs">Called</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Active</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 text-xs">Failed</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  const getDispositionBadge = (dispositionId?: string) => {
    if (!dispositionId) return <span className="text-muted-foreground text-xs">-</span>;
    const disp = dispositionOptions.find(d => d.id === dispositionId);
    if (!disp) return <span className="text-muted-foreground text-xs">{dispositionId}</span>;
    return <Badge className={`${disp.color} text-xs border-0`}>{disp.name}</Badge>;
  };

  return (
    <tr className="border-b hover:bg-muted/30 group">
      {/* Checkbox */}
      <td className="p-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded border-gray-300"
        />
      </td>

      {/* Name */}
      {visibleColumns.name && (
        <td className="p-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
              {recipient.firstName?.[0]}{recipient.lastName?.[0]}
            </div>
            <div>
              <div className="font-medium">
                {recipient.firstName} {recipient.lastName}
              </div>
              {recipient.title && (
                <div className="text-xs text-muted-foreground">{recipient.title}</div>
              )}
            </div>
          </div>
        </td>
      )}

      {/* Email */}
      {visibleColumns.email && (
        <td className="p-2">
          <span className="text-sm">{recipient.email || '-'}</span>
        </td>
      )}

      {/* Phone - Click to call */}
      {visibleColumns.phone && (
        <td className="p-2">
          <div
            className="font-mono text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
            onClick={() => {
              if (campaign.caller_id) {
                onStartCall();
              } else {
                toast({
                  title: 'No Caller ID',
                  description: 'Configure a caller ID in campaign settings first.',
                  variant: 'destructive',
                });
              }
            }}
            title="Click to call"
          >
            {recipient.phone || '-'}
          </div>
        </td>
      )}

      {/* Company */}
      {visibleColumns.company && (
        <td className="p-2">
          <span className="text-sm">{recipient.company || '-'}</span>
        </td>
      )}

      {/* Agent */}
      {visibleColumns.agent && (
        <td className="p-2">
          {(() => {
            console.log('Agent display - campaign:', campaign);
            console.log('Agent display - campaign.agent_name:', campaign?.agent_name);
            console.log('Agent display - campaign.agent_id:', campaign?.agent_id);
            const agentName = campaign?.agent_name || '-';
            return <span className="text-sm">{agentName}</span>;
          })()}
        </td>
      )}

      {/* Status */}
      {visibleColumns.status && (
        <td className="p-2">
          {getStatusBadge(recipient.status)}
        </td>
      )}

      {/* Disposition - Editable dropdown */}
      {visibleColumns.disposition && (
        <td className="p-2">
          {editingField === 'disposition_id' ? (
            <Select
              value={editValues.disposition_id || 'none'}
              onValueChange={async (value) => {
                const actualValue = value === 'none' ? '' : value;
                setEditValues(prev => ({ ...prev, disposition_id: actualValue }));
                await handleSaveField('disposition_id', actualValue);
              }}
            >
              <SelectTrigger className="h-7 text-xs w-full">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {dispositionOptions.filter(option => option && option.id && option.name).map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div
              className="cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 min-h-[24px] flex items-center"
              onClick={() => setEditingField('disposition_id')}
              title="Click to edit"
            >
              {editValues.disposition_id ? (
                <Badge
                  variant="outline"
                  className={`text-xs ${getDispositionColor(editValues.disposition_id)}`}
                >
                  {dispositionOptions.find(d => d.id === editValues.disposition_id)?.name || editValues.disposition_id}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">-</span>
              )}
            </div>
          )}
        </td>
      )}

      {/* Notes - Editable textarea */}
      {visibleColumns.notes && (
        <td className="p-2">
          {editingField === 'notes' ? (
            <Textarea
              value={editValues.notes}
              onChange={(e) => {
                setEditValues(prev => ({ ...prev, notes: e.target.value }));
              }}
              className="text-xs min-h-[60px] w-full"
              placeholder="Enter notes..."
              autoFocus
              onBlur={async () => {
                await handleSaveField('notes', editValues.notes);
                setEditingField(null);
              }}
            />
          ) : (
            <div
              className="cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 min-h-[24px] flex items-center"
              onClick={() => setEditingField('notes')}
              title="Click to edit"
            >
              <span className="text-xs truncate max-w-[200px]">
                {editValues.notes || <span className="text-muted-foreground">Click to add notes...</span>}
              </span>
            </div>
          )}
        </td>
      )}

      {/* Tags - Editable */}
      {visibleColumns.tags && (
        <td className="p-2">
          {editingField === 'tags' ? (
            <Input
              value={editValues.tags}
              onChange={(e) => {
                setEditValues(prev => ({ ...prev, tags: e.target.value }));
              }}
              className="text-xs h-7 w-full"
              placeholder="tag1, tag2, tag3"
              autoFocus
              onBlur={async () => {
                await handleSaveField('tags', editValues.tags);
                setEditingField(null);
              }}
            />
          ) : (
            <div
              className="cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 min-h-[24px] flex items-center"
              onClick={() => setEditingField('tags')}
              title="Click to edit"
            >
              {editValues.tags ? (
                <div className="flex flex-wrap gap-1">
                  {editValues.tags.split(',').slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag.trim()}
                    </Badge>
                  ))}
                  {editValues.tags.split(',').length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{editValues.tags.split(',').length - 2}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Click to add tags...</span>
              )}
            </div>
          )}
        </td>
      )}

      {/* Last Call */}
      {visibleColumns.lastCall && (
        <td className="p-2">
          <span className="text-xs text-muted-foreground">
            {recipient.lastCallAt
              ? new Date(recipient.lastCallAt).toLocaleDateString()
              : '-'
            }
          </span>
        </td>
      )}

      {/* Follow-up */}
      {visibleColumns.followup && (
        <td className="p-2">
          <div className="space-y-1">
            {(() => {
              const recommendations = generateFollowUpRecommendation(recipient);
              console.log('Follow-up recommendations for recipient', recipient.id, ':', recommendations);
              return recommendations.slice(0, 2).map((rec, index) => {
                const isUrgent = rec.toLowerCase().includes('urgent');
                const isHighPriority = rec.toLowerCase().includes('high priority');
                const isAuto = rec.toLowerCase().includes('auto-');

                return (
                  <div
                    key={index}
                    className={`text-xs p-1 rounded flex items-center gap-1 ${isUrgent ? 'bg-red-100 text-red-800 border border-red-200' :
                      isHighPriority ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                        isAuto ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                  >
                    {isUrgent && <AlertCircle className="h-3 w-3" />}
                    {isHighPriority && <ArrowUpRight className="h-3 w-3" />}
                    {isAuto && <CalendarCheck className="h-3 w-3" />}
                    <span className="truncate max-w-[160px]" title={rec}>
                      {rec}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </td>
      )}

      {/* Actions */}
      {visibleColumns.actions && (
        <td className="p-2">
          <div className="flex items-center space-x-1">
            {campaign.call_script && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPreviewScript(recipient)}
                className="h-7 text-xs"
                title="Preview script for this contact"
              >
                <FileTextIcon className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={onStartCall}
              disabled={isCalling || !campaign.caller_id}
              className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
            >
              <Phone className="h-3 w-3 mr-1" />
              Call
            </Button>
          </div>
        </td>
      )}
    </tr>
  );
};

const CallCampaignDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Guard against invalid IDs (like "edit", "new", etc.)
  // These should be handled by their own routes
  const isValidId = id && /^\d+$/.test(id);

  const [selectedRecipient, setSelectedRecipient] = useState<CallRecipient | null>(null);
  const [callNotes, setCallNotes] = useState('');
  const [callDisposition, setCallDisposition] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dispositionFilter, setDispositionFilter] = useState('all');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [callTimer, setCallTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [activeCallRecipient, setActiveCallRecipient] = useState<CallRecipient | null>(null);
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [showAddContactsDialog, setShowAddContactsDialog] = useState(false);
  const [scriptPreviewRecipient, setScriptPreviewRecipient] = useState<CallRecipient | null>(null);

  // Column visibility state - load from localStorage for persistence
  const loadVisibleColumns = (): ColumnVisibilityType => {
    const defaultColumns: ColumnVisibilityType = {
      name: true,
      email: true,
      phone: true,
      company: true,
      agent: true,
      status: true,
      disposition: true,
      notes: true,
      tags: true,
      lastCall: true,
      followup: true,
      actions: true
    };

    const savedColumns: ColumnVisibilityType = { ...defaultColumns };
    Object.keys(defaultColumns).forEach(key => {
      const saved = localStorage.getItem(`call-campaign-columns-${key}`);
      if (saved !== null) {
        (savedColumns as any)[key] = saved === 'true';
      }
    });

    return savedColumns;
  };

  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibilityType>(loadVisibleColumns);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  // Follow-up automations state
  const [automations, setAutomations] = useState<FollowUpAutomation[]>([]);

  // Softphone integration
  const { requestSoftphoneCall, session: softphoneSession } = useCallSession();

  // Disposition options for call outcomes
  const dispositionOptions: CallDisposition[] = [
    { id: 'interested', name: 'Interested', color: 'bg-green-100 text-green-800', description: 'Prospect showed interest' },
    { id: 'callback', name: 'Callback Requested', color: 'bg-blue-100 text-blue-800', description: 'Prospect requested callback' },
    { id: 'not-interested', name: 'Not Interested', color: 'bg-red-100 text-red-800', description: 'Prospect not interested' },
    { id: 'voicemail', name: 'Voicemail', color: 'bg-yellow-100 text-yellow-800', description: 'Left voicemail' },
    { id: 'no-answer', name: 'No Answer', color: 'bg-gray-100 text-gray-800', description: 'No answer after multiple attempts' },
    { id: 'busy', name: 'Busy', color: 'bg-orange-100 text-orange-800', description: 'Line was busy' },
    { id: 'disconnected', name: 'Disconnected', color: 'bg-purple-100 text-purple-800', description: 'Number disconnected' }
  ];

  // Get disposition color by ID
  const getDispositionColor = (dispositionId: string) => {
    const disposition = dispositionOptions.find(d => d.id === dispositionId);
    return disposition?.color || 'bg-gray-100 text-gray-800';
  };

  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ['call-campaign', id],
    queryFn: async () => {
      try {
        const result = await api.getCallCampaign(id!);
        console.log('Campaign data loaded:', result);
        console.log('Campaign name:', result?.name);
        console.log('Campaign agent_id:', result?.agent_id);
        console.log('Campaign agent_name:', result?.agent_name);
        console.log('Campaign caller_id:', result?.caller_id);
        console.log('Campaign call_script:', result?.call_script?.substring(0, 100));
        return result;
      } catch (error) {
        console.error('Failed to fetch campaign:', error);
        toast({
          title: 'Error',
          description: 'Failed to load campaign details',
          variant: 'destructive',
        });
        throw error;
      }
    },
    enabled: !!id,
  });

  const { data: callSettings } = useQuery({
    queryKey: ['call-settings'],
    queryFn: () => api.getCallSettings(),
    staleTime: 60000,
  });

  const { data: connections = [] } = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.getConnections()
  });

  const updateCampaignMutation = useMutation({
    mutationFn: (data: Partial<CallCampaign>) => api.updateCallCampaign(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-campaign', id] });
      toast({
        title: 'Campaign Updated',
        description: 'The caller ID has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update campaign: ' + (error instanceof Error ? error.message : 'Unknown error'),
        variant: 'destructive',
      });
    }
  });

  const { data: recipients = [], isLoading: recipientsLoading } = useQuery({
    queryKey: ['call-campaign-recipients', id],
    queryFn: async () => {
      try {
        if (!campaign) return [];

        // Fetch real campaign recipients from API
        const recipients = await api.getCallRecipients(id);
        console.log('Fetched campaign recipients:', recipients);

        // Map the data to match our expected format
        return recipients.map((recipient: CallRecipient) => ({
          id: recipient.id,
          firstName: recipient.firstName || recipient.first_name || '',
          lastName: recipient.lastName || recipient.last_name || '',
          email: recipient.email || '',
          phone: recipient.phone || recipient.phone_number || '',
          company: recipient.company || '',
          title: recipient.title || '',
          status: (recipient.status === 'pending' ? 'pending' :
            recipient.status === 'completed' ? 'called' :
              recipient.status === 'in_progress' ? 'called' :
                recipient.status || 'pending') as CallRecipient['status'],
          callCount: recipient.callCount || recipient.call_count || 0,
          lastCallAt: recipient.lastCallDate || recipient.last_call_at || undefined,
          notes: recipient.notes || '',
          disposition_id: recipient.disposition_id || recipient.disposition || undefined,
          tags: recipient.tags || [],
          createdAt: recipient.createdAt || recipient.created_at || new Date().toISOString(),
          updatedAt: recipient.updatedAt || recipient.updated_at || new Date().toISOString()
        } as CallRecipient)) || [];
      } catch (error) {
        console.error('Failed to fetch campaign recipients:', error);
        toast({
          title: 'Error',
          description: 'Failed to load campaign recipients',
          variant: 'destructive',
        });
        return [];
      }
    },
    enabled: !!id && !!campaign,
  });

  // Load follow-up automations
  useEffect(() => {
    if (id) {
      loadAutomations();
    }
  }, [id]);

  const loadAutomations = async () => {
    try {
      const response = await api.getAutomations('call', true);
      setAutomations(response.automations || []);
    } catch (error) {
      console.error('Error loading automations:', error);
    }
  };

  // Generate follow-up recommendation based on disposition, notes, and automations
  const generateFollowUpRecommendation = React.useCallback((recipient: CallRecipient) => {
    console.log('generateFollowUpRecommendation called for recipient:', recipient);
    console.log('Available automations:', automations);
    const recommendations: string[] = [];

    // 1. Check disposition-based follow-ups
    if (recipient.disposition_id) {
      const disposition = dispositionOptions.find(d => d.id === recipient.disposition_id);

      if (disposition) {
        switch (disposition.id) {
          case 'interested':
            recommendations.push('Send follow-up email with product info');
            recommendations.push('Schedule demo call');
            break;
          case 'callback':
            recommendations.push('Schedule callback as requested');
            break;
          case 'not-interested':
            recommendations.push('Add to do-not-call list');
            recommendations.push('Send polite closure email');
            break;
          case 'voicemail':
            recommendations.push('Try calling again tomorrow');
            recommendations.push('Send follow-up SMS');
            break;
          case 'no-answer':
            recommendations.push('Attempt call again in 2 days');
            recommendations.push('Send email follow-up');
            break;
        }
      }
    }

    // 2. Analyze notes for sentiment and intent
    if (recipient.notes) {
      const notes = recipient.notes.toLowerCase();

      // Positive indicators
      const positiveKeywords = ['interested', 'good', 'yes', 'definitely', 'excited', 'ready', 'want', 'need', 'looking', 'perfect'];
      const negativeKeywords = ['not interested', 'busy', 'no', 'wrong time', 'call back', 'later', 'not now', 'expensive', 'competitor'];
      const urgencyKeywords = ['urgent', 'asap', 'soon', 'immediately', 'right away', 'quickly'];
      const decisionKeywords = ['decision', 'approve', 'budget', 'discuss', 'team', 'manager', 'boss'];

      // Check for positive sentiment
      if (positiveKeywords.some(keyword => notes.includes(keyword))) {
        recommendations.push('High priority - send proposal');
        recommendations.push('Schedule decision-maker call');
      }

      // Check for negative sentiment
      if (negativeKeywords.some(keyword => notes.includes(keyword))) {
        recommendations.push('Low priority - nurture sequence');
        recommendations.push('Send educational content');
      }

      // Check for urgency
      if (urgencyKeywords.some(keyword => notes.includes(keyword))) {
        recommendations.push('URGENT - follow up today');
        recommendations.push('Priority escalation');
      }

      // Check for decision-making process
      if (decisionKeywords.some(keyword => notes.includes(keyword))) {
        recommendations.push('Involve decision-maker');
        recommendations.push('Send business case');
      }
    }

    // 3. Check tags for follow-up actions
    if (recipient.tags && recipient.tags.length > 0) {
      const tags = recipient.tags.map(tag => tag.toLowerCase());

      // Check for high-value tags
      if (tags.some(tag => ['enterprise', 'vip', 'high-value', 'priority'].includes(tag))) {
        recommendations.push('High-value account - immediate follow-up');
      }

      // Check for industry-specific tags
      if (tags.some(tag => ['healthcare', 'finance', 'tech', 'saas'].includes(tag))) {
        recommendations.push('Send industry-specific case study');
      }

      // Check for stage tags
      if (tags.some(tag => ['lead', 'prospect', 'qualified'].includes(tag))) {
        recommendations.push('Move to next stage in pipeline');
      }
    }

    // 4. Check against automation rules (exhaustive matching)
    const matchingAutomations = automations.filter(automation => {
      const conditions = automation.trigger_conditions;
      if (!conditions || typeof conditions !== 'object') return false;

      // Helper: normalize tags to array of strings
      const normalizeTags = (tags: unknown): string[] => {
        if (Array.isArray(tags)) return tags.map(String);
        if (typeof tags === 'string') {
          try {
            const parsed = JSON.parse(tags);
            return Array.isArray(parsed) ? parsed.map(String) : [];
          } catch {
            return tags.split(',').map(t => t.trim()).filter(Boolean);
          }
        }
        return [];
      };
      const recipientTags = normalizeTags(recipient.tags);

      // 1) Exact disposition ID match
      if (conditions.disposition_id && conditions.disposition_id === recipient.disposition_id) {
        return true;
      }

      // 2) Disposition category match
      if (conditions.disposition_category) {
        const disposition = dispositionOptions.find(d => d.id === recipient.disposition_id);
        const category = getDispositionCategory(recipient.disposition_id);
        if (category === conditions.disposition_category) return true;
      }

      // 3) Notes keyword (case‑insensitive substring)
      if (conditions.notes_keyword && recipient.notes) {
        const keyword = String(conditions.notes_keyword).toLowerCase();
        if (recipient.notes.toLowerCase().includes(keyword)) return true;
      }

      // 4) Tags overlap (any tag matches)
      if (conditions.tags) {
        const conditionTags = normalizeTags(conditions.tags);
        if (conditionTags.some(ct => recipientTags.includes(ct))) return true;
      }

      // 5) Sentiment match (if you later store sentiment on recipient)
      if (conditions.sentiment && typeof recipient.sentiment === 'string') {
        if (recipient.sentiment === conditions.sentiment) return true;
      }

      // 6) Call duration (if you store call_duration on recipient)
      if (typeof conditions.call_duration_min === 'number' && typeof recipient.callDuration === 'number') {
        if (recipient.callDuration >= conditions.call_duration_min) return true;
      }
      if (typeof conditions.call_duration_max === 'number' && typeof recipient.callDuration === 'number') {
        if (recipient.callDuration <= conditions.call_duration_max) return true;
      }

      // 7) Reply keyword (for email/SMS channels – not used in call table)
      if (conditions.reply_keyword && typeof recipient.lastReply === 'string') {
        const kw = String(conditions.reply_keyword).toLowerCase();
        if (recipient.lastReply.toLowerCase().includes(kw)) return true;
      }

      return false;
    });

    // Add automation-based recommendations with clear naming
    matchingAutomations.forEach(automation => {
      const delayText = automation.delay_amount > 0
        ? ` in ${automation.delay_amount} ${automation.delay_unit}`
        : '';

      // Use automation name for clarity; fallback to generic
      const actionLabel = automation.name
        ? `${automation.name}${delayText}`
        : `${automation.action_type}${delayText}`;

      recommendations.push(actionLabel);
    });

    // 5. Status-based follow-ups
    if (recipient.status === 'pending' && !recipient.lastCallAt) {
      recommendations.push('Initial contact needed');
    } else if (recipient.status === 'pending' && recipient.lastCallAt) {
      recommendations.push('Follow-up required');
    }

    // Remove duplicates and limit to top 3
    const uniqueRecommendations = [...new Set(recommendations)].slice(0, 3);

    return uniqueRecommendations.length > 0 ? uniqueRecommendations : ['No follow-up needed'];
  }, [dispositionOptions, automations]);

  // Helper function to get disposition category
  const getDispositionCategory = (dispositionId: string): string => {
    const disposition = dispositionOptions.find(d => d.id === dispositionId);
    if (!disposition) return 'neutral';

    switch (disposition.id) {
      case 'interested':
        return 'positive';
      case 'callback':
        return 'callback';
      case 'not-interested':
        return 'negative';
      default:
        return 'neutral';
    }
  };

  const updateRecipientMutation = useMutation({
    mutationFn: async (data: { recipientId: string; updates: Partial<CallRecipient> }) => {
      console.log('updateRecipientMutation called:', data);
      const result = await api.updateCallRecipient(data.recipientId, data.updates);
      console.log('API update result:', result);
      return result;
    },
    onSuccess: (result, variables) => {
      console.log('Mutation onSuccess:', { result, variables });
      // Use the API response to update the cache (not the optimistic updates)
      queryClient.setQueryData(
        ['call-campaign-recipients', id],
        (oldData: CallRecipient[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(r =>
            r.id === variables.recipientId ? result : r
          );
        }
      );
      // Invalidate to refetch and ensure consistency
      queryClient.invalidateQueries({ queryKey: ['call-campaign-recipients', id] });
    },
    onError: (error) => {
      console.error('Recipient update error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update recipient',
        variant: 'destructive',
      });
    }
  });

  const handleStartCall = async (recipient: CallRecipient) => {
    const effectiveCallerId = campaign?.caller_id || callSettings?.defaultCallerId;

    if (!effectiveCallerId) {
      toast({
        title: 'Error',
        description: 'No caller ID configured for this campaign or in global settings',
        variant: 'destructive',
      });
      return;
    }

    setIsCalling(true);
    setActiveCallRecipient(recipient);
    setCallTimer(0);

    try {
      // Use softphone integration to make the call
      requestSoftphoneCall({
        number: recipient.phone,
        recipientName: `${recipient.firstName} ${recipient.lastName}`.trim() || recipient.phone,
        campaignId: campaign.id,
        callerId: effectiveCallerId,  // Pass the effective caller ID to the softphone
        source: 'softphone',
        note: callNotes,
        metadata: {
          recipientId: recipient.id,
          campaignId: campaign.id,
          recipientData: recipient,
          callerId: effectiveCallerId  // Also include in metadata for reference
        }
      });

      toast({
        title: 'Call Initiated',
        description: `Calling ${recipient.firstName} ${recipient.lastName} at ${recipient.phone}`,
      });

      // Update recipient status to active (call in progress)
      updateRecipientMutation.mutate({
        recipientId: recipient.id,
        updates: {
          status: 'active',
          callCount: (recipient.callCount || 0) + 1,
          lastCallAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Call failed:', error);
      toast({
        title: 'Call Failed',
        description: error instanceof Error ? error.message : 'Failed to start call. Please try again.',
        variant: 'destructive',
      });
      setIsCalling(false);
      setActiveCallRecipient(null);
    }
  };

  const handleEndCall = () => {
    if (!activeCallRecipient) return;

    setIsCalling(false);
    setSelectedRecipient(activeCallRecipient);

    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    // Update recipient status to called
    updateRecipientMutation.mutate({
      recipientId: activeCallRecipient.id,
      updates: {
        status: 'called'
      }
    });

    setActiveCallRecipient(null);
    setCallTimer(0);
  };

  // Call timer effect
  useEffect(() => {
    if (softphoneSession?.status === 'connected' && activeCallRecipient) {
      const interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [softphoneSession?.status, activeCallRecipient]);

  const handleSaveCallNotes = async () => {
    if (!selectedRecipient || !callDisposition) return;

    const disposition = dispositionOptions.find(d => d.id === callDisposition);

    try {
      // Save call log to backend (if API method exists)
      // Note: Using updateRecipient to save notes and disposition
      // await api.createCallLog(...) - implement if needed

      updateRecipientMutation.mutate({
        recipientId: selectedRecipient.id,
        updates: {
          notes: callNotes,
          disposition_id: callDisposition,
          status: 'called',
          lastCallAt: new Date().toISOString()
        }
      });

      toast({
        title: 'Call Notes Saved',
        description: 'Call notes and disposition have been recorded.',
      });

      // Reset form
      setCallNotes('');
      setCallDisposition('');
      setSelectedRecipient(null);
    } catch (error) {
      console.error('Error saving call notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save call notes. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'called':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Called</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
      case 'active':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Active</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Failed</Badge>;
      case 'opted_out':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Opted Out</Badge>;
      case 'invalid':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Invalid</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getDispositionBadge = (disposition?: string) => {
    if (!disposition) return null;
    const disp = dispositionOptions.find(d => d.id === disposition);
    if (!disp) return null;
    return (
      <Badge className={`${disp.color} border-0 dark:border dark:border-gray-600`}>
        {disp.name}
      </Badge>
    );
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter recipients based on search and filters
  const filteredRecipients = recipients.filter(recipient => {
    const matchesSearch = searchTerm === '' ||
      `${recipient.firstName} ${recipient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.phone.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'pending' && recipient.status === 'pending') ||
      recipient.status === statusFilter;
    const matchesDisposition = dispositionFilter === 'all' || recipient.disposition_id === dispositionFilter;

    return matchesSearch && matchesStatus && matchesDisposition;
  });

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedRecipients.length === filteredRecipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(filteredRecipients.map(r => r.id));
    }
  };

  const handleSelectRecipient = (recipientId: string) => {
    setSelectedRecipients(prev =>
      prev.includes(recipientId)
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const handleBulkCall = async () => {
    if (selectedRecipients.length === 0) return;

    toast({
      title: 'Bulk Calling',
      description: `Starting calls for ${selectedRecipients.length} selected contacts...`,
    });

    // Start calling the first selected recipient
    const firstRecipient = filteredRecipients.find(r => r.id === selectedRecipients[0]);
    if (firstRecipient) {
      await handleStartCall(firstRecipient);
      // Remove from selection after starting call
      setSelectedRecipients(prev => prev.filter(id => id !== firstRecipient.id));
    }
  };

  if (campaignLoading || recipientsLoading) {
    return (
      <>
        <div className="space-y-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </>
    );
  }

  if (!campaign) {
    return (
      <>
        <div className="space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Campaign Not Found</h1>
            <p className="text-gray-600 mt-2">The campaign you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/reach/outbound/calls/campaigns')} className="mt-4">
              Back to Campaigns
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Breadcrumb */}
        <div>
          <Breadcrumb items={[
            { label: 'Calls', href: '/reach/outbound/calls' },
            { label: 'Campaigns', href: '/reach/outbound/calls/campaigns' },
            { label: campaign.name || `Campaign #${id}` }
          ]} />
        </div>

        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{campaign.name || `Campaign #${id}`}</h1>
              <p className="text-muted-foreground mt-1">
                {campaign.description || 'Manual calling campaign with click-to-call functionality'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => navigate('/reach/outbound/calls/campaigns')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/reach/outbound/calls/campaigns/edit/${campaign.id}`)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/automations/builder/builder?campaign=${campaign.id}&type=call`)}
              >
                <Workflow className="h-4 w-4 mr-2" />
                Flow Builder
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/reach/calls/logs?campaignId=${campaign.id}`)}
              >
                <FileTextIcon className="h-4 w-4 mr-2" />
                View Logs
              </Button>
              <Button onClick={() => {
                // Find first not-called recipient and start calling
                const firstNotCalled = filteredRecipients.find(r => r.status === 'pending');
                if (firstNotCalled) {
                  handleStartCall(firstNotCalled);
                } else {
                  toast({
                    title: 'No contacts to call',
                    description: 'All contacts have been called or no contacts available.',
                    variant: 'default',
                  });
                }
              }}>
                <Phone className="h-4 w-4 mr-2" />
                Start Calling Session
              </Button>
            </div>
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-analytics">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recipients.length}</div>
              <p className="text-xs text-muted-foreground">In this campaign</p>
            </CardContent>
          </Card>

          <Card className="border-analytics">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Called</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recipients.filter(r => r.status === 'called').length}</div>
              <p className="text-xs text-muted-foreground">Completed calls</p>
            </CardContent>
          </Card>

          <Card className="border-analytics">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <Clock3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recipients.filter(r => r.status === 'pending').length}</div>
              <p className="text-xs text-muted-foreground">Yet to call</p>
            </CardContent>
          </Card>

          <Card className="border-analytics">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {campaign?.call_provider ? (campaign.call_provider.charAt(0).toUpperCase() + campaign.call_provider.slice(1)) : 'SignalWire'} Number
              </CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {campaign?.caller_id || callSettings?.defaultCallerId ? (
                <>
                  <div className="text-sm font-medium text-green-600">
                    {campaign?.caller_id || callSettings?.defaultCallerId}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Caller ID
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-orange-500">
                    Not configured
                  </div>
                  {connections.length > 0 ? (
                    <Select
                      onValueChange={(value) => updateCampaignMutation.mutate({ caller_id: value })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select number..." />
                      </SelectTrigger>
                      <SelectContent>
                        {connections.flatMap(c => (c.phoneNumbers || []).map(p => (
                          <SelectItem key={p.phone_number} value={p.phone_number}>
                            {p.phone_number} ({p.friendly_name})
                          </SelectItem>
                        )))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Edit campaign to set caller ID
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Call Panel */}
        {activeCallRecipient && softphoneSession && (
          <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <PhoneCall className="h-5 w-5 mr-2 text-green-600 animate-pulse" />
                  Active Call
                </span>
                <Badge className="bg-green-600 text-white">
                  {Math.floor(callTimer / 60)}:{(callTimer % 60).toString().padStart(2, '0')}
                </Badge>
              </CardTitle>
              <CardDescription>
                Calling {activeCallRecipient.firstName} {activeCallRecipient.lastName} at {activeCallRecipient.phone}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-lg font-medium">
                    {activeCallRecipient.firstName?.[0]}{activeCallRecipient.lastName?.[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">
                      {activeCallRecipient.firstName} {activeCallRecipient.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {activeCallRecipient.company} • {activeCallRecipient.title}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={
                    softphoneSession.status === 'connected' ? 'bg-green-100 text-green-800' :
                      softphoneSession.status === 'ringing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                  }>
                    {softphoneSession.status === 'connected' ? 'Connected' :
                      softphoneSession.status === 'ringing' ? 'Ringing...' :
                        'Connecting...'}
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleEndCall}
                  >
                    <PhoneOff className="h-4 w-4 mr-2" />
                    End Call
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Campaign Script */}
        <CallScriptSection
          campaign={campaign}
          activeCallRecipient={activeCallRecipient}
          showScriptDialog={showScriptDialog}
          setShowScriptDialog={setShowScriptDialog}
          onScriptUpdate={(newScript) => {
            // Update campaign script
            api.updateCallCampaign(campaign.id, { call_script: newScript })
              .then(() => {
                queryClient.invalidateQueries({ queryKey: ['call-campaign', id] });
                toast({
                  title: 'Script Updated',
                  description: 'Call script has been updated successfully',
                });
              })
              .catch((error) => {
                toast({
                  title: 'Error',
                  description: 'Failed to update call script',
                  variant: 'destructive',
                });
              });
          }}
        />

        {/* Contacts Table */}
        <Card className="border-analytics">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Contacts ({filteredRecipients.length} of {recipients.length})
              </span>
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <Dialog open={showAddContactsDialog} onOpenChange={setShowAddContactsDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contacts
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Add Contacts to Campaign</DialogTitle>
                      <DialogDescription>
                        Select contacts from your contact list to add to this campaign.
                      </DialogDescription>
                    </DialogHeader>
                    <AddContactsToCapaignDialog
                      campaignId={id!}
                      onClose={() => {
                        setShowAddContactsDialog(false);
                        queryClient.invalidateQueries({ queryKey: ['call-campaign-recipients', id] });
                      }}
                    />
                  </DialogContent>
                </Dialog>
                <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
                  <Input
                    placeholder="Search contacts..."
                    className="w-48 min-w-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Not Called</SelectItem>
                      <SelectItem value="called">Called</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dispositionFilter} onValueChange={setDispositionFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Disposition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dispositions</SelectItem>
                      {dispositionOptions.filter(option => option && option.id && option.name).map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedRecipients.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleBulkCall}
                    className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Selected ({selectedRecipients.length})
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDispositionFilter('all');
                    setSelectedRecipients([]);
                  }}
                  className="flex-shrink-0"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                {/* Column Settings */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" title="Column Settings" className="flex-shrink-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
                    <DropdownMenuLabel>Show/Hide Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {[
                      { key: 'name', label: 'Name' },
                      { key: 'email', label: 'Email' },
                      { key: 'phone', label: 'Phone' },
                      { key: 'company', label: 'Company' },
                      { key: 'agent', label: 'Agent' },
                      { key: 'status', label: 'Status' },
                      { key: 'disposition', label: 'Disposition' },
                      { key: 'notes', label: 'Notes' },
                      { key: 'tags', label: 'Tags' },
                      { key: 'lastCall', label: 'Last Call' },
                      { key: 'followup', label: 'Follow-up' },
                      { key: 'actions', label: 'Actions' }
                    ].map(({ key, label }) => (
                      <DropdownMenuItem key={key} onClick={(e) => {
                        e.preventDefault();
                        const newValue = !visibleColumns[key as keyof typeof visibleColumns];
                        setVisibleColumns(prev => ({
                          ...prev,
                          [key]: newValue
                        }));
                        // Save to localStorage for persistence
                        localStorage.setItem(`call-campaign-columns-${key}`, newValue.toString());
                      }}>
                        <div className="flex items-center justify-between w-full">
                          <span className="cursor-pointer flex-1">{label}</span>
                          <input
                            type="checkbox"
                            checked={visibleColumns[key as keyof typeof visibleColumns]}
                            onChange={() => { }}
                            className="rounded border-gray-300 h-4 w-4 pointer-events-none"
                          />
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      const allVisible = {
                        name: true, email: true, phone: true, company: true, agent: true,
                        status: true, disposition: true, notes: true, tags: true,
                        lastCall: true, followup: true, actions: true
                      };
                      setVisibleColumns(allVisible);
                      // Save all columns to localStorage
                      Object.keys(allVisible).forEach(key => {
                        localStorage.setItem(`call-campaign-columns-${key}`, 'true');
                      });
                    }}>
                      <span className="text-blue-600">Show All Columns</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardTitle>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="text-blue-600 dark:text-blue-400 font-medium">Not Called</div>
                <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  {filteredRecipients.filter(r => r.status === 'pending').length}
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <div className="text-yellow-600 dark:text-yellow-400 font-medium">In Progress</div>
                <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                  {filteredRecipients.filter(r => r.status === 'active').length}
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="text-green-600 dark:text-green-400 font-medium">Called</div>
                <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {filteredRecipients.filter(r => r.status === 'called').length}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <div className="text-purple-600 dark:text-purple-400 font-medium">Selected</div>
                <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                  {selectedRecipients.length}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {recipients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No contacts added yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add contacts to this campaign to start making calls
                </p>
                <Button onClick={() => setShowAddContactsDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contacts
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-medium w-10">
                        <input
                          type="checkbox"
                          checked={selectedRecipients.length === filteredRecipients.length && filteredRecipients.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      {visibleColumns.name && <th className="text-left p-2 font-medium min-w-[150px]">Name</th>}
                      {visibleColumns.email && <th className="text-left p-2 font-medium min-w-[180px]">Email</th>}
                      {visibleColumns.phone && <th className="text-left p-2 font-medium min-w-[120px]">Phone</th>}
                      {visibleColumns.company && <th className="text-left p-2 font-medium min-w-[120px]">Company</th>}
                      {visibleColumns.agent && <th className="text-left p-2 font-medium min-w-[120px]">Agent</th>}
                      {visibleColumns.status && <th className="text-left p-2 font-medium w-24">Status</th>}
                      {visibleColumns.disposition && <th className="text-left p-2 font-medium min-w-[140px]">Disposition</th>}
                      {visibleColumns.notes && <th className="text-left p-2 font-medium min-w-[200px]">Notes</th>}
                      {visibleColumns.tags && <th className="text-left p-2 font-medium min-w-[150px]">Tags</th>}
                      {visibleColumns.lastCall && <th className="text-left p-2 font-medium w-24">Last Call</th>}
                      {visibleColumns.followup && <th className="text-left p-2 font-medium min-w-[200px]">Follow-up</th>}
                      {visibleColumns.actions && <th className="text-left p-2 font-medium w-28">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecipients.map((recipient) => (
                      <EditableRecipientRow
                        key={recipient.id}
                        recipient={recipient}
                        campaign={campaign}
                        isSelected={selectedRecipients.includes(recipient.id)}
                        onSelect={() => handleSelectRecipient(recipient.id)}
                        onStartCall={() => handleStartCall(recipient)}
                        onUpdate={async (updates) => {
                          await updateRecipientMutation.mutateAsync({
                            recipientId: recipient.id,
                            updates
                          });
                        }}
                        onPreviewScript={(r) => setScriptPreviewRecipient(r)}
                        dispositionOptions={dispositionOptions}
                        isCalling={isCalling}
                        visibleColumns={visibleColumns}
                        getDispositionColor={getDispositionColor}
                        generateFollowUpRecommendation={generateFollowUpRecommendation}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call Notes Modal */}
        {selectedRecipient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-2">
                Call Notes for {selectedRecipient.firstName} {selectedRecipient.lastName}
              </h3>
              {callTimer > 0 && (
                <p className="text-sm text-muted-foreground mb-4">
                  Call Duration: {formatCallDuration(callTimer)}
                </p>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="disposition">Call Disposition *</Label>
                  <Select value={callDisposition} onValueChange={setCallDisposition}>
                    <SelectTrigger id="disposition">
                      <SelectValue placeholder="Select call outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      {dispositionOptions.filter(option => option && option.id && option.name).map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <div className="flex flex-col">
                            <span>{option.name}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Call Notes</Label>
                  <Textarea
                    id="notes"
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Enter notes from the call..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRecipient(null);
                    setCallNotes('');
                    setCallDisposition('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCallNotes}
                  disabled={!callDisposition}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Notes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Script Preview Modal for specific contact */}
        <Dialog open={!!scriptPreviewRecipient} onOpenChange={(open) => !open && setScriptPreviewRecipient(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] w-[90vw]">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                <FileTextIcon className="h-6 w-6 mr-2 text-primary" />
                Call Script Preview
              </DialogTitle>
              <DialogDescription asChild>
                <div>
                  {scriptPreviewRecipient && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge className="bg-green-100 text-green-800">
                        <User className="h-3 w-3 mr-1" />
                        {scriptPreviewRecipient.firstName} {scriptPreviewRecipient.lastName}
                      </Badge>
                      {scriptPreviewRecipient.company && (
                        <Badge variant="outline">
                          <Building className="h-3 w-3 mr-1" />
                          {scriptPreviewRecipient.company}
                        </Badge>
                      )}
                      {scriptPreviewRecipient.title && (
                        <Badge variant="outline">
                          {scriptPreviewRecipient.title}
                        </Badge>
                      )}
                      {scriptPreviewRecipient.phone && (
                        <Badge variant="outline">
                          <Phone className="h-3 w-3 mr-1" />
                          {scriptPreviewRecipient.phone}
                        </Badge>
                      )}
                      {scriptPreviewRecipient.email && (
                        <Badge variant="outline">
                          <Mail className="h-3 w-3 mr-1" />
                          {scriptPreviewRecipient.email}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[70vh] pr-4">
              {(() => {
                // Get the correct script for this contact
                let scriptToUse = campaign?.call_script || '';

                // Check if there's a specific script for this recipient (from script selection)
                const recipientScript = scriptPreviewRecipient?.disposition_id ?
                  dispositionOptions.find(d => d.id === scriptPreviewRecipient.disposition_id)?.description :
                  null;

                if (recipientScript) {
                  scriptToUse = recipientScript;
                }

                if (!scriptToUse) {
                  return (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileTextIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No script configured for this campaign.</p>
                      <p className="text-sm mt-2">Edit the campaign to add a call script.</p>
                    </div>
                  );
                }

                const PersonalizedContent = () => {
                  const scriptContent = getPersonalizedScript(scriptToUse, campaign, scriptPreviewRecipient);

                  if (isHtmlContent(scriptContent)) {
                    return (
                      <div className="bg-muted/30 rounded-2xl p-8 border shadow-inner">
                        <div className="max-w-3xl mx-auto backdrop-blur-sm bg-background/50 rounded-xl p-6 border border-white/20">
                          {formatScriptWithStyles(scriptContent)}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="bg-muted/30 rounded-2xl p-8 border shadow-inner">
                      <div className="max-w-3xl mx-auto backdrop-blur-sm bg-background/50 rounded-xl p-6 border border-white/20 text-base leading-relaxed space-y-4">
                        {formatScriptWithStyles(scriptContent)}
                      </div>
                    </div>
                  );
                };

                return <PersonalizedContent />;
              })()}
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Variables have been replaced with contact details
              </div>
              <Button onClick={() => setScriptPreviewRecipient(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default CallCampaignDetails;

