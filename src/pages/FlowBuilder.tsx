import React, { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Play,
  Pause,
  Plus,
  Trash2,
  Save,
  Settings,
  Mail,
  MessageSquare,
  Clock,
  GitBranch,
  Users,
  Filter,
  Zap,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Copy,
  MoreHorizontal,
  Eye,
  Sparkles,
  Target,
  MousePointer,
  UserPlus,
  Calendar,
  Tag,
  CheckCircle2,
  XCircle,
  Timer,
  Split,
  Workflow,
  LayoutGrid,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo,
  Redo,
  Download,
  Upload,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  Info,
  Phone,
  PhoneCall,
  PhoneOff,
  Globe,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Bell,
  BellRing,
  Send,
  Reply,
  Forward,
  Archive,
  Bookmark,
  Flag,
  AlertTriangle,
  Ban,
  UserMinus,
  UserCheck,
  UserX,
  RefreshCw,
  RotateCcw,
  Repeat,
  Shuffle,
  ListChecks,
  FileTextIcon,
  FileCheck,
  Pencil,
  Link,
  ExternalLink,
  Database,
  Server,
  Cloud,
  Webhook,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart2,
  PieChart,
  Award,
  Gift,
  Percent,
  Hash,
  AtSign,
  MapPin,
  Building,
  Briefcase,
  GraduationCap,
  Cake,
  PartyPopper,
  Code,
  Variable
} from 'lucide-react';
import { api, type Campaign } from '@/lib/api';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { NODE_CONFIGS } from './FlowBuilderNodeConfigs';
import AutomationSpreadsheetView from '@/components/automations/AutomationSpreadsheetView';
import { FileSpreadsheet, RefreshCw as SyncIcon } from 'lucide-react';

// Types
interface FlowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'split';
  subType: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  connections: string[]; // IDs of connected nodes
}

interface Flow {
  id?: number;
  recipe_id?: number;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused';
  nodes: FlowNode[];
  campaign_id?: number; // Associated campaign
  campaign_type?: 'email' | 'sms' | 'call' | 'multi-channel';
  trigger_type?: string;
  created_at?: string;
  updated_at?: string;
  stats?: {
    total_contacts: number;
    emails_sent: number;
    sms_sent: number;
    calls_made: number;
    conversions: number;
  };
}

// Node type definitions
const NODE_TYPES = {
  triggers: [
    // Contact Triggers
    { id: 'contact_added', name: 'Contact Added', icon: UserPlus, description: 'When a new contact is added', category: 'contact' },
    { id: 'contact_updated', name: 'Contact Updated', icon: Pencil, description: 'When contact info is updated', category: 'contact' },
    { id: 'contact_deleted', name: 'Contact Deleted', icon: UserX, description: 'When a contact is deleted', category: 'contact' },
    { id: 'tag_added', name: 'Tag Added', icon: Tag, description: 'When a tag is added to contact', category: 'contact' },
    { id: 'tag_removed', name: 'Tag Removed', icon: Tag, description: 'When a tag is removed from contact', category: 'contact' },
    { id: 'lead_score_changed', name: 'Lead Score Changed', icon: TrendingUp, description: 'When lead score changes', category: 'contact' },

    // Email Triggers
    { id: 'email_opened', name: 'Email Opened', icon: Mail, description: 'When an email is opened', category: 'email' },
    { id: 'email_clicked', name: 'Link Clicked', icon: MousePointer, description: 'When a link is clicked', category: 'email' },
    { id: 'email_replied', name: 'Email Replied', icon: Reply, description: 'When contact replies to email', category: 'email' },
    { id: 'email_bounced', name: 'Email Bounced', icon: AlertTriangle, description: 'When email bounces', category: 'email' },
    { id: 'email_unsubscribed', name: 'Unsubscribed', icon: UserMinus, description: 'When contact unsubscribes', category: 'email' },
    { id: 'email_complained', name: 'Spam Complaint', icon: Flag, description: 'When marked as spam', category: 'email' },

    // SMS Triggers
    { id: 'sms_replied', name: 'SMS Replied', icon: MessageSquare, description: 'When contact replies to SMS', category: 'sms' },
    { id: 'sms_opted_out', name: 'SMS Opted Out', icon: PhoneOff, description: 'When contact opts out of SMS', category: 'sms' },
    { id: 'sms_delivered', name: 'SMS Delivered', icon: CheckCircle2, description: 'When SMS is delivered', category: 'sms' },
    { id: 'sms_failed', name: 'SMS Failed', icon: XCircle, description: 'When SMS fails to deliver', category: 'sms' },

    // Call Triggers
    { id: 'call_completed', name: 'Call Completed', icon: PhoneCall, description: 'When a call is completed', category: 'call' },
    { id: 'call_missed', name: 'Call Missed', icon: PhoneOff, description: 'When a call is missed', category: 'call' },
    { id: 'voicemail_left', name: 'Voicemail Left', icon: Phone, description: 'When voicemail is left', category: 'call' },

    // Form & Page Triggers
    { id: 'form_submitted', name: 'Form Submitted', icon: FileCheck, description: 'When a form is submitted', category: 'form' },
    { id: 'page_visited', name: 'Page Visited', icon: Globe, description: 'When a page is visited', category: 'form' },
    { id: 'landing_page_conversion', name: 'Landing Page Conversion', icon: Target, description: 'When landing page converts', category: 'form' },

    // E-commerce Triggers
    { id: 'purchase_made', name: 'Purchase Made', icon: ShoppingCart, description: 'When a purchase is made', category: 'ecommerce' },
    { id: 'cart_abandoned', name: 'Cart Abandoned', icon: ShoppingCart, description: 'When cart is abandoned', category: 'ecommerce' },
    { id: 'product_viewed', name: 'Product Viewed', icon: Eye, description: 'When product is viewed', category: 'ecommerce' },
    { id: 'refund_requested', name: 'Refund Requested', icon: RotateCcw, description: 'When refund is requested', category: 'ecommerce' },

    // Date & Time Triggers
    { id: 'date_trigger', name: 'Date/Time', icon: Calendar, description: 'On a specific date or recurring', category: 'time' },
    { id: 'birthday_trigger', name: 'Birthday', icon: Cake, description: 'On contact birthday', category: 'time' },
    { id: 'anniversary_trigger', name: 'Anniversary', icon: PartyPopper, description: 'On custom anniversary date', category: 'time' },
    { id: 'inactivity_trigger', name: 'Inactivity', icon: Clock, description: 'After period of inactivity', category: 'time' },

    // Integration Triggers
    { id: 'webhook_received', name: 'Webhook Received', icon: Webhook, description: 'When webhook is received', category: 'integration' },
    { id: 'api_event', name: 'API Event', icon: Server, description: 'When API event occurs', category: 'integration' },
    { id: 'zapier_trigger', name: 'Zapier Trigger', icon: Zap, description: 'Triggered by Zapier', category: 'integration' },

    // Manual Triggers
    { id: 'manual', name: 'Manual Start', icon: PlayCircle, description: 'Manually triggered', category: 'manual' },
    { id: 'segment_entry', name: 'Segment Entry', icon: Users, description: 'When entering a segment', category: 'manual' },
  ],
  actions: [
    // Email Actions
    { id: 'send_email', name: 'Send Email', icon: Mail, description: 'Send an email to contact', category: 'email' },
    { id: 'send_email_sequence', name: 'Start Email Sequence', icon: ListChecks, description: 'Start an email sequence', category: 'email' },
    { id: 'stop_email_sequence', name: 'Stop Email Sequence', icon: Ban, description: 'Stop email sequence', category: 'email' },
    { id: 'send_transactional_email', name: 'Transactional Email', icon: Send, description: 'Send transactional email', category: 'email' },

    // SMS Actions
    { id: 'send_sms', name: 'Send SMS', icon: MessageSquare, description: 'Send an SMS message', category: 'sms' },
    { id: 'send_sms_sequence', name: 'Start SMS Sequence', icon: ListChecks, description: 'Start an SMS sequence', category: 'sms' },
    { id: 'stop_sms_sequence', name: 'Stop SMS Sequence', icon: Ban, description: 'Stop SMS sequence', category: 'sms' },
    { id: 'send_mms', name: 'Send MMS', icon: MessageSquare, description: 'Send MMS with media', category: 'sms' },

    // Call Actions
    { id: 'make_call', name: 'Make Call', icon: PhoneCall, description: 'Initiate a phone call', category: 'call' },
    { id: 'schedule_call', name: 'Schedule Call', icon: Phone, description: 'Schedule a call task', category: 'call' },
    { id: 'send_voicemail', name: 'Send Voicemail', icon: Phone, description: 'Send ringless voicemail', category: 'call' },
    { id: 'trigger_call_flow', name: 'Trigger Call Flow', icon: Workflow, description: 'Trigger a call flow routing', category: 'call' },

    // Contact Management Actions
    { id: 'add_tag', name: 'Add Tag', icon: Tag, description: 'Add a tag to contact', category: 'contact' },
    { id: 'remove_tag', name: 'Remove Tag', icon: Tag, description: 'Remove a tag from contact', category: 'contact' },
    { id: 'update_field', name: 'Update Field', icon: Pencil, description: 'Update a contact field', category: 'contact' },
    { id: 'update_lead_score', name: 'Update Lead Score', icon: TrendingUp, description: 'Adjust lead score', category: 'contact' },
    { id: 'change_status', name: 'Change Status', icon: RefreshCw, description: 'Change contact status', category: 'contact' },
    { id: 'assign_owner', name: 'Assign Owner', icon: UserCheck, description: 'Assign contact to user', category: 'contact' },
    { id: 'copy_to_list', name: 'Copy to List', icon: Copy, description: 'Copy contact to list', category: 'contact' },
    { id: 'move_to_list', name: 'Move to List', icon: Forward, description: 'Move contact to list', category: 'contact' },
    { id: 'remove_from_list', name: 'Remove from List', icon: UserMinus, description: 'Remove from list', category: 'contact' },
    { id: 'archive_contact', name: 'Archive Contact', icon: Archive, description: 'Archive the contact', category: 'contact' },
    { id: 'delete_contact', name: 'Delete Contact', icon: Trash2, description: 'Delete the contact', category: 'contact' },

    // Campaign Actions
    { id: 'add_to_campaign', name: 'Add to Campaign', icon: Target, description: 'Add to another campaign', category: 'campaign' },
    { id: 'remove_from_campaign', name: 'Remove from Campaign', icon: XCircle, description: 'Remove from campaign', category: 'campaign' },
    { id: 'pause_campaign', name: 'Pause in Campaign', icon: Pause, description: 'Pause contact in campaign', category: 'campaign' },
    { id: 'resume_campaign', name: 'Resume in Campaign', icon: Play, description: 'Resume contact in campaign', category: 'campaign' },

    // Task & CRM Actions
    { id: 'create_task', name: 'Create Task', icon: ListChecks, description: 'Create a task', category: 'crm' },
    { id: 'create_deal', name: 'Create Deal', icon: DollarSign, description: 'Create a deal/opportunity', category: 'crm' },
    { id: 'update_deal', name: 'Update Deal', icon: Pencil, description: 'Update deal stage/value', category: 'crm' },
    { id: 'create_note', name: 'Add Note', icon: FileTextIcon, description: 'Add note to contact', category: 'crm' },
    { id: 'schedule_meeting', name: 'Schedule Meeting', icon: Calendar, description: 'Schedule a meeting', category: 'crm' },

    // Notification Actions
    { id: 'notify_team', name: 'Notify Team', icon: Bell, description: 'Send notification to team', category: 'notification' },
    { id: 'send_slack', name: 'Send to Slack', icon: MessageSquare, description: 'Send Slack message', category: 'notification' },
    { id: 'send_push', name: 'Send Push Notification', icon: BellRing, description: 'Send push notification', category: 'notification' },
    { id: 'send_internal_email', name: 'Internal Email', icon: Mail, description: 'Email to team member', category: 'notification' },

    // Integration Actions
    { id: 'webhook', name: 'Webhook', icon: Webhook, description: 'Call external webhook', category: 'integration' },
    { id: 'http_request', name: 'HTTP Request', icon: Globe, description: 'Make HTTP request to any API', category: 'integration' },
    { id: 'run_code', name: 'Run Code', icon: Code, description: 'Execute JavaScript/Python code', category: 'integration' },
    { id: 'ai_assistant', name: 'AI Assistant', icon: Sparkles, description: 'Use AI to process data', category: 'integration' },
    { id: 'data_transformer', name: 'Transform Data', icon: Shuffle, description: 'Transform/map data between steps', category: 'integration' },
    { id: 'set_variable', name: 'Set Variable', icon: Variable, description: 'Set workflow variable', category: 'integration' },
    { id: 'zapier_action', name: 'Zapier Action', icon: Zap, description: 'Trigger Zapier action', category: 'integration' },
    { id: 'google_sheets', name: 'Google Sheets', icon: FileTextIcon, description: 'Add row to Google Sheets', category: 'integration' },
    { id: 'crm_sync', name: 'CRM Sync', icon: RefreshCw, description: 'Sync to external CRM', category: 'integration' },

    // Conversion Actions
    { id: 'track_conversion', name: 'Track Conversion', icon: Target, description: 'Track a conversion', category: 'conversion' },
    { id: 'track_revenue', name: 'Track Revenue', icon: DollarSign, description: 'Track revenue event', category: 'conversion' },
    { id: 'add_to_audience', name: 'Add to Audience', icon: Users, description: 'Add to ad audience', category: 'conversion' },

    // Flow Control Actions
    { id: 'go_to_step', name: 'Go to Step', icon: ArrowRight, description: 'Jump to another step', category: 'flow' },
    { id: 'end_flow', name: 'End Flow', icon: XCircle, description: 'End the flow', category: 'flow' },
    { id: 'start_subflow', name: 'Start Subflow', icon: Workflow, description: 'Start another flow', category: 'flow' },
  ],
  conditions: [
    // Contact Conditions
    { id: 'if_else', name: 'If/Else', icon: GitBranch, description: 'Branch based on condition', category: 'logic' },
    { id: 'has_tag', name: 'Has Tag', icon: Tag, description: 'Check if contact has tag', category: 'contact' },
    { id: 'field_value', name: 'Field Value', icon: Filter, description: 'Check field value', category: 'contact' },
    { id: 'lead_score', name: 'Lead Score', icon: TrendingUp, description: 'Check lead score', category: 'contact' },
    { id: 'contact_age', name: 'Contact Age', icon: Clock, description: 'Days since contact created', category: 'contact' },
    { id: 'list_membership', name: 'List Membership', icon: Users, description: 'Is in specific list', category: 'contact' },
    { id: 'contact_owner', name: 'Contact Owner', icon: UserCheck, description: 'Assigned to specific user', category: 'contact' },

    // Email Conditions
    { id: 'email_activity', name: 'Email Activity', icon: Mail, description: 'Based on email opens/clicks', category: 'email' },
    { id: 'email_engagement', name: 'Email Engagement', icon: Activity, description: 'Overall email engagement', category: 'email' },
    { id: 'email_sent_count', name: 'Emails Sent', icon: Send, description: 'Number of emails sent', category: 'email' },
    { id: 'last_email_opened', name: 'Last Email Opened', icon: Eye, description: 'Days since last open', category: 'email' },

    // SMS Conditions
    { id: 'sms_activity', name: 'SMS Activity', icon: MessageSquare, description: 'Based on SMS replies', category: 'sms' },
    { id: 'sms_opt_status', name: 'SMS Opt Status', icon: Phone, description: 'SMS opt-in status', category: 'sms' },

    // Campaign Conditions
    { id: 'in_campaign', name: 'In Campaign', icon: Target, description: 'Is in specific campaign', category: 'campaign' },
    { id: 'campaign_completed', name: 'Campaign Completed', icon: CheckCircle2, description: 'Completed campaign', category: 'campaign' },
    { id: 'campaign_engagement', name: 'Campaign Engagement', icon: Activity, description: 'Campaign engagement level', category: 'campaign' },

    // E-commerce Conditions
    { id: 'purchase_history', name: 'Purchase History', icon: ShoppingCart, description: 'Has made purchase', category: 'ecommerce' },
    { id: 'total_spent', name: 'Total Spent', icon: DollarSign, description: 'Total amount spent', category: 'ecommerce' },
    { id: 'product_purchased', name: 'Product Purchased', icon: ShoppingCart, description: 'Bought specific product', category: 'ecommerce' },

    // Time Conditions
    { id: 'time_of_day', name: 'Time of Day', icon: Clock, description: 'Current time check', category: 'time' },
    { id: 'day_of_week', name: 'Day of Week', icon: Calendar, description: 'Current day check', category: 'time' },
    { id: 'date_range', name: 'Date Range', icon: Calendar, description: 'Within date range', category: 'time' },

    // Random & Split Conditions
    { id: 'random_split', name: 'Random Split', icon: Shuffle, description: 'Random percentage split', category: 'split' },
    { id: 'even_split', name: 'Even Split', icon: Split, description: 'Even distribution', category: 'split' },
  ],
  timing: [
    { id: 'wait', name: 'Wait', icon: Clock, description: 'Wait for a duration', category: 'delay' },
    { id: 'wait_until', name: 'Wait Until', icon: Timer, description: 'Wait until specific time', category: 'delay' },
    { id: 'wait_for_event', name: 'Wait for Event', icon: Clock, description: 'Wait for event to occur', category: 'delay' },
    { id: 'smart_delay', name: 'Smart Delay', icon: Sparkles, description: 'AI-optimized send time', category: 'delay' },
    { id: 'business_hours', name: 'Business Hours', icon: Building, description: 'Wait for business hours', category: 'delay' },
    { id: 'split_test', name: 'A/B Split', icon: Split, description: 'Split traffic for testing', category: 'split' },
    { id: 'multivariate_test', name: 'Multivariate Test', icon: BarChart2, description: 'Test multiple variants', category: 'split' },
  ],
};

// Generate unique ID
const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Memoized Node Component for better performance
const FlowNodeComponent = memo<{
  node: FlowNode;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onConnect: (fromNodeId: string, toNodeId: string) => void;
  zoom: number;
  layoutDirection: 'vertical' | 'horizontal';
}>(({ node, selected, onSelect, onDelete, onDuplicate, onEdit, onPointerDown, onConnect, zoom, layoutDirection }) => {
  const getNodeConfig = () => {
    const allTypes = [...NODE_TYPES.triggers, ...NODE_TYPES.actions, ...NODE_TYPES.conditions, ...NODE_TYPES.timing];
    return allTypes.find(t => t.id === node.subType);
  };

  const config = getNodeConfig();
  const Icon = config?.icon || Zap;

  const getNodeColor = () => {
    switch (node.type) {
      case 'trigger': return 'bg-green-500/10 border-green-500/50 hover:border-green-500';
      case 'action': return node.subType === 'send_email'
        ? 'bg-blue-500/10 border-blue-500/50 hover:border-blue-500'
        : node.subType === 'send_sms'
          ? 'bg-purple-500/10 border-purple-500/50 hover:border-purple-500'
          : 'bg-orange-500/10 border-orange-500/50 hover:border-orange-500';
      case 'condition': return 'bg-yellow-500/10 border-yellow-500/50 hover:border-yellow-500';
      case 'delay': return 'bg-gray-500/10 border-gray-500/50 hover:border-gray-500';
      case 'split': return 'bg-pink-500/10 border-pink-500/50 hover:border-pink-500';
      default: return 'bg-gray-500/10 border-gray-500/50';
    }
  };

  const getIconColor = () => {
    switch (node.type) {
      case 'trigger': return 'text-green-500';
      case 'action': return node.subType === 'send_email'
        ? 'text-blue-500'
        : node.subType === 'send_sms'
          ? 'text-purple-500'
          : 'text-orange-500';
      case 'condition': return 'text-yellow-500';
      case 'delay': return 'text-gray-500';
      case 'split': return 'text-pink-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div
      className={`absolute cursor-move transition-all duration-150 ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
      style={{
        left: node.position.x * zoom,
        top: node.position.y * zoom,
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(e);
      }}
      onDragOver={(e) => {
        // Allow dropping connection handles on nodes
        if (e.dataTransfer.types.includes('connectionFromNodeId')) {
          e.preventDefault();
        }
      }}
      onDrop={(e) => {
        const fromId = e.dataTransfer.getData('connectionFromNodeId');
        if (fromId && fromId !== node.id) {
          e.preventDefault();
          e.stopPropagation();
          onConnect(fromId, node.id);
        }
      }}
    >
      <Card className={`w-64 ${getNodeColor()} border-2 shadow-lg`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-background ${getIconColor()}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm truncate">{config?.name || node.subType}</h4>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {node.data.label || config?.description || 'Configure this node'}
              </p>
              {node.data.subject && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Subject: {node.data.subject}
                </p>
              )}
              {node.data.delay && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {node.data.delay} {node.data.delayUnit || 'hours'}
                </Badge>
              )}
            </div>
          </div>

          {/* Connection points */}
          {node.type !== 'trigger' && (
            <div
              className={
                layoutDirection === 'horizontal'
                  ? 'absolute left-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 bg-background border-2 border-muted-foreground rounded-full'
                  : 'absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-background border-2 border-muted-foreground rounded-full'
              }
            />
          )}
          {node.type !== 'condition' ? (
            <div
              className={
                layoutDirection === 'horizontal'
                  ? 'absolute right-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 bg-background border-2 border-muted-foreground rounded-full cursor-crosshair'
                  : 'absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-background border-2 border-muted-foreground rounded-full cursor-crosshair'
              }
              draggable
              onDragStart={(e) => {
                // Start a connection drag from this node
                e.stopPropagation();
                e.dataTransfer.setData('connectionFromNodeId', node.id);
                // Avoid showing the default drag preview image
                const img = new Image();
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E';
                e.dataTransfer.setDragImage(img, 0, 0);
              }}
            />
          ) : (
            <>
              <div
                className={
                  layoutDirection === 'horizontal'
                    ? 'absolute right-[-8px] top-1/3 -translate-y-1/2 w-4 h-4 bg-green-500 border-2 border-green-600 rounded-full flex items-center justify-center'
                    : 'absolute -bottom-2 left-1/4 -translate-x-1/2 w-4 h-4 bg-green-500 border-2 border-green-600 rounded-full flex items-center justify-center'
                }
              >
                <CheckCircle2 className="h-2 w-2 text-white" />
              </div>
              <div
                className={
                  layoutDirection === 'horizontal'
                    ? 'absolute right-[-8px] top-2/3 -translate-y-1/2 w-4 h-4 bg-red-500 border-2 border-red-600 rounded-full flex items-center justify-center'
                    : 'absolute -bottom-2 right-1/4 translate-x-1/2 w-4 h-4 bg-red-500 border-2 border-red-600 rounded-full flex items-center justify-center'
                }
              >
                <XCircle className="h-2 w-2 text-white" />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

FlowNodeComponent.displayName = 'FlowNodeComponent';

// Node Editor Dialog with comprehensive settings for all node types
const NodeEditorDialog: React.FC<{
  node: FlowNode | null;
  open: boolean;
  onClose: () => void;
  onSave: (node: FlowNode) => void;
  templates: { id: number; name: string; type: string; subject?: string }[];
  forms: { id: number; name: string }[];
  campaigns: { id: number; name: string; type: string; status?: string }[];
  tags: string[];
  sendingAccounts: { id: number; name: string; email: string }[];
  lists: { id: number; name: string; count?: number }[];
  sequences: { id: number; name: string; type: string }[];
  users: { id: number; name: string; email: string }[];
  callScripts: { id: number; name: string }[];
  landingPages: { id: number; name: string; url?: string }[];
  flowNodes?: FlowNode[]; // For "Go to Step" action
}> = ({ node, open, onClose, onSave, templates, forms, campaigns, tags, sendingAccounts, lists, sequences, users, callScripts, landingPages, flowNodes }) => {
  const { toast } = useToast();
  const [editedNode, setEditedNode] = useState<FlowNode | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTarget, setAiTarget] = useState<'subject' | 'preview'>('subject');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    if (node) {
      setEditedNode({ ...node, data: { ...node.data } });
    }
  }, [node]);

  if (!editedNode) return null;

  const handleSave = () => {
    if (editedNode) {
      onSave(editedNode);
      onClose();
    }
  };

  const updateData = (key: string, value: any) => {
    if (key === 'json_data') {
      setEditedNode({
        ...editedNode,
        data: { ...editedNode.data, ...value }
      });
      return;
    }
    setEditedNode({
      ...editedNode,
      data: { ...editedNode.data, [key]: value }
    });
  };

  const handleAIGeneration = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a description of what you want to generate.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await api.generateAiContent({
        channel: 'email',
        prompt: aiPrompt,
        action: aiTarget === 'subject' ? 'subject' : 'draft',
        context: {
          nodeType: editedNode.subType,
          target: aiTarget,
          currentSubject: editedNode.data.subject,
          currentPreviewText: editedNode.data.previewText,
        },
      });

      const generated = (response.output || '').trim();
      if (!generated) {
        toast({
          title: 'No output',
          description: 'AI returned an empty result.',
          variant: 'destructive',
        });
        return;
      }

      if (aiTarget === 'subject') {
        updateData('subject', generated);
      } else {
        updateData('previewText', generated);
      }

      setAiDialogOpen(false);
      setAiPrompt('');
      toast({
        title: 'AI Generation Complete',
        description: 'Generated content inserted into this step.',
      });
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: 'AI Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate content. Please check your AI settings.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const getNodeConfig = () => {
    const allTypes = [...NODE_TYPES.triggers, ...NODE_TYPES.actions, ...NODE_TYPES.conditions, ...NODE_TYPES.timing];
    return allTypes.find(t => t.id === editedNode.subType);
  };

  const config = getNodeConfig();
  const Icon = config?.icon || Zap;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-primary/10 text-primary`}>
              <Icon className="h-5 w-5" />
            </div>
            {config?.name || editedNode.subType}
          </DialogTitle>
          <DialogDescription>
            {config?.description || 'Configure the settings for this step.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Assist
                </DialogTitle>
                <DialogDescription>
                  Generate text for this {editedNode.subType.replace(/_/g, ' ')} step.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Generate</Label>
                  <Select value={aiTarget} onValueChange={(v) => setAiTarget(v as 'subject' | 'preview')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subject">Subject Line</SelectItem>
                      <SelectItem value="preview">Preview Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Prompt</Label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={5}
                    placeholder="Describe what you want (tone, offer, audience, length)..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setAiDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleAIGeneration} disabled={isGeneratingAI || !aiPrompt.trim()}>
                  {isGeneratingAI ? 'Generating...' : 'Generate'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Render Config based on Type */}
          {(() => {
            const ConfigComponent = NODE_CONFIGS[editedNode.subType as keyof typeof NODE_CONFIGS] || GenericNodeConfig;
            return (
              <ConfigComponent
                node={editedNode}
                updateData={updateData}
                templates={templates}
                forms={forms}
                campaigns={campaigns}
                tags={tags}
                sendingAccounts={sendingAccounts}
                lists={lists}
                sequences={sequences}
                users={users}
                callScripts={callScripts}
                landingPages={landingPages}
                flowNodes={flowNodes}
                onAIClick={(target) => {
                  setAiTarget(target as any);
                  setAiDialogOpen(true);
                }}
              />
            );
          })()}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InlineNodeSettings: React.FC<{
  node: FlowNode | null;
  onUpdate: (node: FlowNode) => void;
  onDelete: () => void;
  templates: { id: number; name: string; type: string; subject?: string }[];
  forms: { id: number; name: string }[];
  campaigns: { id: number; name: string; type: string; status?: string }[];
  tags: string[];
  sendingAccounts: { id: number; name: string; email: string }[];
  lists: { id: number; name: string; count?: number }[];
  sequences: { id: number; name: string; type: string }[];
  users: { id: number; name: string; email: string }[];
  callScripts: { id: number; name: string }[];
  landingPages: { id: number; name: string; url?: string }[];
  flowNodes?: FlowNode[];
}> = ({ node, onUpdate, onDelete, templates, forms, campaigns, tags, sendingAccounts, lists, sequences, users, callScripts, landingPages, flowNodes }) => {
  const { toast } = useToast();
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTarget, setAiTarget] = useState<'subject' | 'preview' | 'message' | 'script'>('subject');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  if (!node) return null;

  const updateData = (key: string, value: any) => {
    onUpdate({
      ...node,
      data: { ...node.data, [key]: value },
    });
  };

  const aiTargets = (() => {
    if (node.subType === 'send_sms') return [{ value: 'message' as const, label: 'SMS Message' }];
    if (node.subType === 'make_call' || node.subType === 'schedule_call') return [{ value: 'script' as const, label: 'Call Script' }];
    return [
      { value: 'subject' as const, label: 'Subject Line' },
      { value: 'preview' as const, label: 'Preview Text' },
    ];
  })();

  const handleAIGeneration = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a description of what you want to generate.',
        variant: 'destructive',
      });
      return;
    }

    const channel = node.subType === 'send_sms' ? 'sms' : node.subType === 'make_call' || node.subType === 'schedule_call' ? 'call' : 'email';

    setIsGeneratingAI(true);
    try {
      const response = await api.generateAiContent({
        channel,
        prompt: aiPrompt,
        action: aiTarget === 'subject' ? 'subject' : 'draft',
        context: {
          nodeType: node.subType,
          target: aiTarget,
          current: {
            subject: node.data.subject,
            previewText: node.data.previewText,
            message: node.data.message,
            scriptText: node.data.scriptText,
          },
        },
      });

      const generated = (response.output || '').trim();
      if (!generated) {
        toast({
          title: 'No output',
          description: 'AI returned an empty result.',
          variant: 'destructive',
        });
        return;
      }

      if (aiTarget === 'subject') updateData('subject', generated);
      if (aiTarget === 'preview') updateData('previewText', generated);
      if (aiTarget === 'message') updateData('message', generated);
      if (aiTarget === 'script') updateData('scriptText', generated);

      setAiDialogOpen(false);
      setAiPrompt('');
      toast({
        title: 'AI Generation Complete',
        description: 'Generated content inserted into this node.',
      });
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: 'AI Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate content. Please check your AI settings.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{node.data.label || node.subType}</h3>
          <p className="text-xs text-muted-foreground">Configure this node</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Assist
            </DialogTitle>
            <DialogDescription>Generate content for this node.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Generate</Label>
              <Select value={aiTarget} onValueChange={(v) => setAiTarget(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aiTargets.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prompt</Label>
              <Textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={5} placeholder="Describe what you want (tone, offer, audience, length)..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setAiDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAIGeneration} disabled={isGeneratingAI || !aiPrompt.trim()}>
              {isGeneratingAI ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Use NODE_CONFIGS for any node type that has a config component defined */}
      {(() => {
        const ConfigComponent = NODE_CONFIGS[node.subType as keyof typeof NODE_CONFIGS];
        if (ConfigComponent) {
          return (
            <ConfigComponent
              node={node}
              updateData={updateData}
              templates={templates}
              forms={forms}
              campaigns={campaigns}
              tags={tags}
              sendingAccounts={sendingAccounts}
              lists={lists}
              sequences={sequences}
              users={users}
              callScripts={callScripts}
              landingPages={landingPages}
              flowNodes={flowNodes}
              onAIClick={(target) => {
                setAiTarget(target as any);
                setAiDialogOpen(true);
              }}
            />
          );
        }

        // Fallback for types that might not be in NODE_CONFIGS yet
        return (
          <div className="pt-2 border-t mt-4">
            <Label>Description</Label>
            <Input
              value={node.data.label || ''}
              onChange={(e) => updateData('label', e.target.value)}
              placeholder="Describe this step..."
              className="mt-1"
            />
          </div>
        );
      })()}
    </div>
  );
};

// Helper function to convert automation to flow nodes
const convertAutomationToFlowNodes = (automation: any): FlowNode[] => {
  const nodes: FlowNode[] = [];

  // Create trigger node based on automation trigger_type
  const triggerNode: FlowNode = {
    id: generateId(),
    type: 'trigger',
    subType: mapAutomationTriggerToFlowTrigger(automation.trigger_type, automation.channel),
    position: { x: 400, y: 100 },
    data: {
      label: `When ${automation.trigger_type.replace(/_/g, ' ')}`,
      channel: automation.channel,
      ...automation.trigger_conditions,
    },
    connections: [],
  };
  nodes.push(triggerNode);

  // Add delay node if there's a delay
  let lastNodeId = triggerNode.id;
  if (automation.delay_amount > 0) {
    const delayNode: FlowNode = {
      id: generateId(),
      type: 'delay',
      subType: 'wait',
      position: { x: 400, y: 250 },
      data: {
        label: `Wait ${automation.delay_amount} ${automation.delay_unit}`,
        delay: automation.delay_amount,
        delayUnit: automation.delay_unit,
      },
      connections: [],
    };
    triggerNode.connections.push(delayNode.id);
    nodes.push(delayNode);
    lastNodeId = delayNode.id;
  }

  // Create action node based on automation action_type
  const actionNode: FlowNode = {
    id: generateId(),
    type: 'action',
    subType: mapAutomationActionToFlowAction(automation.action_type),
    position: { x: 400, y: automation.delay_amount > 0 ? 400 : 250 },
    data: {
      label: automation.action_type.replace(/_/g, ' '),
      ...automation.action_config,
    },
    connections: [],
  };

  // Connect last node to action
  const lastNode = nodes.find(n => n.id === lastNodeId);
  if (lastNode) {
    lastNode.connections.push(actionNode.id);
  }
  nodes.push(actionNode);

  return nodes;
};

// Map automation trigger types to flow trigger types
const mapAutomationTriggerToFlowTrigger = (triggerType: string, channel: string): string => {
  const triggerMap: Record<string, string> = {
    // Call triggers
    'call_completed': 'call_completed',
    'call_missed': 'call_missed',
    'disposition_set': 'call_completed',
    'outcome_set': 'call_completed',
    'notes_contain': 'call_completed',
    'voicemail_left': 'voicemail_left',
    // Email triggers
    'email_opened': 'email_opened',
    'email_clicked': 'email_clicked',
    'email_replied': 'email_replied',
    'email_bounced': 'email_bounced',
    'link_clicked': 'email_clicked',
    // SMS triggers
    'sms_replied': 'sms_replied',
    'sms_delivered': 'sms_delivered',
    'sms_failed': 'sms_failed',
    // Form triggers
    'form_submitted': 'form_submitted',
    // Contact triggers
    'contact_added': 'contact_added',
    'tag_added': 'tag_added',
  };
  return triggerMap[triggerType] || 'manual';
};

// Map automation action types to flow action types
const mapAutomationActionToFlowAction = (actionType: string): string => {
  const actionMap: Record<string, string> = {
    'send_email': 'send_email',
    'send_sms': 'send_sms',
    'schedule_call': 'schedule_call',
    'make_call': 'make_call',
    'add_tag': 'add_tag',
    'remove_tag': 'remove_tag',
    'move_to_campaign': 'add_to_campaign',
    'notify_user': 'notify_team',
    'webhook': 'webhook',
    'create_task': 'create_task',
    'update_field': 'update_field',
  };
  return actionMap[actionType] || 'notify_team';
};

// Main Flow Builder Component
export default function FlowBuilder() {
  const { flowId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const hasImportedCampaignRef = useRef(false);
  const hasImportedAutomationRef = useRef(false);

  // Get campaign ID from URL params (when coming from campaign details)
  const campaignIdFromUrl = searchParams.get('campaign');
  const campaignTypeFromUrl = searchParams.get('type') as 'email' | 'sms' | 'call' | null;

  // Get automation ID from URL params (when coming from automations page)
  const automationIdFromUrl = searchParams.get('automation');
  const automationChannelFromUrl = searchParams.get('channel') as 'email' | 'sms' | 'call' | 'multi-channel' | null;
  const isNewAutomation = searchParams.get('new_automation') === 'true';

  const [flow, setFlow] = useState<Flow>({
    name: isNewAutomation ? 'New Automation Flow' : 'New Campaign Flow',
    description: '',
    status: 'draft',
    nodes: [],
    campaign_id: campaignIdFromUrl ? parseInt(campaignIdFromUrl) : undefined,
    campaign_type: (campaignTypeFromUrl || automationChannelFromUrl || undefined) as 'email' | 'sms' | 'call' | 'multi-channel' | undefined,
  });

  // Track automation ID for saving back
  const [automationId, setAutomationId] = useState<string | null>(automationIdFromUrl);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<FlowNode | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'nodes' | 'settings' | 'node'>('nodes');
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [layoutDirection, setLayoutDirection] = useState<'vertical' | 'horizontal'>(() => {
    const saved = localStorage.getItem('flow_builder_layout_direction');
    return saved === 'horizontal' ? 'horizontal' : 'vertical';
  });
  const [edgeInsert, setEdgeInsert] = useState<{ fromNodeId: string; toNodeId: string } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [templates, setTemplates] = useState<{ id: number; name: string; type: string; subject?: string }[]>([]);
  const [forms, setForms] = useState<{ id: number; name: string }[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: number; name: string; type: string; status?: string }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [sendingAccounts, setSendingAccounts] = useState<{ id: number; name: string; email: string }[]>([]);
  const [lists, setLists] = useState<{ id: number; name: string; count?: number }[]>([]);
  const [sequences, setSequences] = useState<{ id: number; name: string; type: string }[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string; email: string }[]>([]);
  const [callScripts, setCallScripts] = useState<{ id: number; name: string }[]>([]);
  const [landingPages, setLandingPages] = useState<{ id: number; name: string; url?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // View mode toggle - Visual or Spreadsheet
  const [viewMode, setViewMode] = useState<'visual' | 'spreadsheet'>(() => {
    const urlView = searchParams.get('view');
    if (urlView === 'spreadsheet') return 'spreadsheet';
    const saved = localStorage.getItem('flow_builder_view_mode');
    return saved === 'spreadsheet' ? 'spreadsheet' : 'visual';
  });
  const [isRealTimeSync, setIsRealTimeSync] = useState(true);

  const apiGet = useCallback(<T,>(path: string) => api.get<T>(path), []);
  const apiPost = useCallback(<T,>(path: string, body?: unknown) => api.post<T>(path, body), []);
  const apiPut = useCallback(<T,>(path: string, body?: unknown) => api.put<T>(path, body), []);

  const apiGetData = useCallback(async <T,>(path: string): Promise<T> => {
    const res = await apiGet<T>(path);
    return res.data as T;
  }, [apiGet]);

  const apiPostData = useCallback(async <T,>(path: string, body?: unknown): Promise<T> => {
    const res = await apiPost<T>(path, body);
    return res.data as T;
  }, [apiPost]);

  useEffect(() => {
    localStorage.setItem('flow_builder_layout_direction', layoutDirection);
  }, [layoutDirection]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
      toast({
        title: 'Fullscreen Error',
        description: 'Could not toggle fullscreen mode',
        variant: 'destructive',
      });
    }
  };

  // Load flow data and related resources
  useEffect(() => {
    loadAllResources();
    if (flowId) {
      loadFlow(flowId);
    }
  }, [flowId]);

  useEffect(() => {
    if (
      !flowId &&
      !hasImportedCampaignRef.current &&
      campaignIdFromUrl &&
      flow.nodes.length === 0
    ) {
      const numericCampaignId = parseInt(campaignIdFromUrl, 10);
      if (!Number.isNaN(numericCampaignId)) {
        importFromCampaign(numericCampaignId);
        hasImportedCampaignRef.current = true;
      }
    }
  }, [campaignIdFromUrl, flow.nodes.length, flowId]);

  // Load automation data when coming from automations page
  useEffect(() => {
    if (
      !flowId &&
      !hasImportedAutomationRef.current &&
      automationIdFromUrl &&
      flow.nodes.length === 0
    ) {
      loadAutomation(automationIdFromUrl);
      hasImportedAutomationRef.current = true;
    }
  }, [automationIdFromUrl, flow.nodes.length, flowId]);

  // Load automation and convert to flow
  const loadAutomation = async (id: string) => {
    setLoading(true);
    try {
      // First check if there's already a flow for this automation
      const existingFlowData = await apiGet<{ flow?: Flow | null }>(`/flows/by-automation/${id}`).catch(() => ({ flow: null }));

      if (existingFlowData.flow) {
        // Load existing flow
        setFlow({
          ...existingFlowData.flow,
          nodes: existingFlowData.flow.nodes || []
        });
        setAutomationId(id);
        toast({
          title: 'Flow Loaded',
          description: 'Loaded existing flow for this automation',
        });
      } else {
        // Fetch automation and convert to flow
        const automationRes = await api.getAutomation(id);
        if (automationRes) {
          const nodes = convertAutomationToFlowNodes(automationRes);
          setFlow({
            name: automationRes.name || 'Automation Flow',
            description: automationRes.description || '',
            status: automationRes.is_active ? 'active' : 'draft',
            nodes,
            campaign_type: automationRes.channel as any,
          });
          setAutomationId(id);
          toast({
            title: 'Automation Imported',
            description: 'Automation converted to visual flow. You can now add more steps!',
          });
        }
      }
    } catch (error) {
      console.error('Failed to load automation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load automation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllResources = async () => {
    try {
      const [
        emailRes, smsRes, formsRes, campaignsRes, tagsRes, accountsRes,
        listsRes, usersRes, scriptsRes, pagesRes, smsCampaignsRes, callCampaignsRes
      ] = await Promise.all([
        apiGetData<{ templates?: { id: number; name: string; subject?: string }[] }>('/templates').catch(() => ({ templates: [] } as { templates?: { id: number; name: string; subject?: string }[] })),
        apiGetData<{ templates?: { id: number; name: string }[] }>('/sms-templates').catch(() => ({ templates: [] } as { templates?: { id: number; name: string }[] })),
        apiGetData<{ forms?: { id: number; name: string }[] }>('/forms').catch(() => ({ forms: [] } as { forms?: { id: number; name: string }[] })),
        apiGetData<{ campaigns?: { id: number; name: string; type?: string; status?: string }[] }>('/campaigns').catch(() => ({ campaigns: [] } as { campaigns?: { id: number; name: string; type?: string; status?: string }[] })),
        apiGetData<{ tags?: string[] }>('/contacts/tags').catch(() => ({ tags: [] } as { tags?: string[] })),
        apiGetData<{ accounts?: { id: number; name: string; email: string }[] }>('/sending-accounts').catch(() => ({ accounts: [] } as { accounts?: { id: number; name: string; email: string }[] })),
        apiGetData<{ lists?: { id: number; name: string; count?: number }[] }>('/lists').catch(() => ({ lists: [] } as { lists?: { id: number; name: string; count?: number }[] })),
        apiGetData<{ users?: { id: number; name: string; email: string }[] }>('/users').catch(() => ({ users: [] } as { users?: { id: number; name: string; email: string }[] })),
        apiGetData<{ scripts?: { id: number; name: string }[] }>('/call-scripts').catch(() => ({ scripts: [] } as { scripts?: { id: number; name: string }[] })),
        apiGetData<{ pages?: { id: number; name: string; url?: string }[] }>('/landing-pages').catch(() => ({ pages: [] } as { pages?: { id: number; name: string; url?: string }[] })),
        apiGetData<{ campaigns?: { id: number; name: string; status?: string }[] }>('/sms-campaigns').catch(() => ({ campaigns: [] } as { campaigns?: { id: number; name: string; status?: string }[] })),
        apiGetData<{ campaigns?: { id: number; name: string; status?: string }[] }>('/call-campaigns').catch(() => ({ campaigns: [] } as { campaigns?: { id: number; name: string; status?: string }[] })),
      ]);

      // Templates (Email + SMS)
      const emailData = emailRes;
      const smsData = smsRes;
      const emailTemplates = (emailData.templates || []).map((t) => ({ ...t, type: 'email' }));
      const smsTemplates = (smsData.templates || []).map((t) => ({ ...t, type: 'sms' }));
      setTemplates([...emailTemplates, ...smsTemplates]);

      // Forms
      setForms(formsRes.forms || []);

      // All Campaigns (email, SMS, call)
      const emailCampaignsData = campaignsRes;
      const smsCampaignsData = smsCampaignsRes;
      const callCampaignsData = callCampaignsRes;

      const emailCampaigns = (emailCampaignsData.campaigns || []).map(c => ({ ...c, type: c.type || 'email' }));
      const smsCampaigns = (smsCampaignsData.campaigns || []).map(c => ({ ...c, type: 'sms' }));
      const callCampaigns = (callCampaignsData.campaigns || []).map(c => ({ ...c, type: 'call' }));
      setCampaigns([...emailCampaigns, ...smsCampaigns, ...callCampaigns]);

      // Tags
      setTags(tagsRes.tags || ['Lead', 'Customer', 'VIP', 'Prospect', 'Hot Lead', 'Cold Lead']);

      // Sending Accounts
      setSendingAccounts(accountsRes.accounts || []);

      // Lists
      setLists(listsRes.lists || []);

      // Users (for assignment)
      setUsers(usersRes.users || []);

      // Call Scripts
      setCallScripts(scriptsRes.scripts || []);

      // Landing Pages
      setLandingPages(pagesRes.pages || []);

      // Create sequences from campaigns (for sequence actions)
      const allSequences = [
        ...emailCampaigns.filter(c => c.status === 'active').map(c => ({ id: c.id, name: c.name, type: 'email' })),
        ...smsCampaigns.filter(c => c.status === 'active').map(c => ({ id: c.id, name: c.name, type: 'sms' })),
      ];
      setSequences(allSequences);
      setResourcesLoaded(true);

    } catch (error) {
      console.error('Failed to load resources:', error);
      setResourcesLoaded(true); // Still mark as loaded to prevent infinite loading state
    }
  };

  // Auto-switch to node settings tab when a node is selected
  useEffect(() => {
    if (selectedNode) {
      setSidebarTab('node');
    }
  }, [selectedNode]);

  const loadFlow = async (id: string) => {
    setLoading(true);
    try {
      const responseData = await apiGetData<{ flow?: Flow }>(`/flows/${id}`);
      if (responseData.flow) {
        setFlow({
          ...responseData.flow,
          nodes: responseData.flow.nodes || []
        });
      }
    } catch (error) {
      console.error('Failed to load flow:', error);
      toast({
        title: 'Error',
        description: 'Failed to load flow',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveFlow = async () => {
    setSaving(true);
    try {
      // Include automation_id if this flow is linked to an automation
      const flowData = {
        ...flow,
        automation_id: automationId,
        flow_type: automationId ? 'automation' : 'campaign',
      };

      if (flow.id) {
        await apiPut(`/flows/${flow.id}`, flowData);
      } else {
        const responseData = await apiPostData<{ flow?: { id?: number } }>('/flows', flowData);
        if (responseData.flow?.id) {
          setFlow({ ...flow, id: responseData.flow.id });
          navigate(`/automations/builder/builder/${responseData.flow.id}`, { replace: true });
        }
      }

      // If this is an automation flow, also update the automation
      if (automationId) {
        try {
          await syncFlowToAutomation();
        } catch (syncError) {
          console.warn('Could not sync flow to automation:', syncError);
        }
      }

      toast({
        title: 'Success',
        description: automationId ? 'Flow and automation saved successfully' : 'Flow saved successfully',
      });
    } catch (error) {
      console.error('Failed to save flow:', error);
      toast({
        title: 'Error',
        description: 'Failed to save flow',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Sync flow changes back to the original automation
  const syncFlowToAutomation = async () => {
    if (!automationId || flow.nodes.length === 0) return;

    // Extract trigger, delay, and action from flow nodes
    const triggerNode = flow.nodes.find(n => n.type === 'trigger');
    const delayNode = flow.nodes.find(n => n.type === 'delay');
    const actionNodes = flow.nodes.filter(n => n.type === 'action');

    if (!triggerNode || actionNodes.length === 0) return;

    // Map flow trigger back to automation trigger
    const triggerType = mapFlowTriggerToAutomation(triggerNode.subType);
    const actionType = mapFlowActionToAutomation(actionNodes[0].subType);

    // Build automation update data
    const automationData = {
      name: flow.name,
      description: flow.description,
      trigger_type: triggerType,
      trigger_conditions: triggerNode.data || {},
      action_type: actionType,
      action_config: actionNodes[0].data || {},
      delay_amount: delayNode?.data?.delay || 0,
      delay_unit: delayNode?.data?.delayUnit || 'hours',
      is_active: flow.status === 'active',
    };

    await api.updateAutomation(automationId, automationData);
  };

  // Map flow trigger types back to automation trigger types
  const mapFlowTriggerToAutomation = (flowTrigger: string): string => {
    const triggerMap: Record<string, string> = {
      'call_completed': 'call_completed',
      'call_missed': 'call_missed',
      'voicemail_left': 'voicemail_left',
      'email_opened': 'email_opened',
      'email_clicked': 'link_clicked',
      'email_replied': 'email_replied',
      'email_bounced': 'email_bounced',
      'sms_replied': 'sms_replied',
      'sms_delivered': 'sms_delivered',
      'sms_failed': 'sms_failed',
      'form_submitted': 'form_submitted',
      'contact_added': 'contact_added',
      'tag_added': 'tag_added',
      'manual': 'manual',
    };
    return triggerMap[flowTrigger] || flowTrigger;
  };

  // Map flow action types back to automation action types
  const mapFlowActionToAutomation = (flowAction: string): string => {
    const actionMap: Record<string, string> = {
      'send_email': 'send_email',
      'send_sms': 'send_sms',
      'schedule_call': 'schedule_call',
      'make_call': 'make_call',
      'add_tag': 'add_tag',
      'remove_tag': 'remove_tag',
      'add_to_campaign': 'move_to_campaign',
      'notify_team': 'notify_user',
      'webhook': 'webhook',
      'create_task': 'create_task',
      'update_field': 'update_field',
    };
    return actionMap[flowAction] || flowAction;
  };

  const addNode = (type: 'trigger' | 'action' | 'condition' | 'delay' | 'split', subType: string) => {
    const newNode: FlowNode = {
      id: generateId(),
      type,
      subType,
      position: {
        x: 300 + Math.random() * 100,
        y: 100 + flow.nodes.length * 150,
      },
      data: {},
      connections: [],
    };

    setFlow({ ...flow, nodes: [...flow.nodes, newNode] });
    setSelectedNode(newNode.id);
  };

  const updateNode = (updatedNode: FlowNode) => {
    setFlow({
      ...flow,
      nodes: flow.nodes.map(n => n.id === updatedNode.id ? updatedNode : n),
    });
  };

  const deleteNode = (nodeId: string) => {
    setFlow({
      ...flow,
      nodes: flow.nodes.filter(n => n.id !== nodeId).map(n => ({
        ...n,
        connections: n.connections.filter(c => c !== nodeId),
      })),
    });
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  };

  const duplicateNode = (nodeId: string) => {
    const node = flow.nodes.find(n => n.id === nodeId);
    if (node) {
      const newNode: FlowNode = {
        ...node,
        id: generateId(),
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        connections: [],
      };
      setFlow({ ...flow, nodes: [...flow.nodes, newNode] });
    }
  };

  const handleNodePointerDown = (nodeId: string, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const pointerX = (e.clientX - rect.left - panOffset.x) / zoom;
    const pointerY = (e.clientY - rect.top - panOffset.y) / zoom;
    const node = flow.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    dragOffsetRef.current = { x: pointerX - node.position.x, y: pointerY - node.position.y };
    setDraggingNodeId(nodeId);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  useEffect(() => {
    if (!draggingNodeId) return;

    const onPointerMove = (ev: PointerEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (ev.clientX - rect.left - panOffset.x) / zoom - dragOffsetRef.current.x;
      const y = (ev.clientY - rect.top - panOffset.y) / zoom - dragOffsetRef.current.y;

      setFlow((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === draggingNodeId ? { ...n, position: { x, y } } : n)),
      }));
    };

    const onPointerUp = () => {
      setDraggingNodeId(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [draggingNodeId, panOffset.x, panOffset.y, zoom]);

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const newNodeType = e.dataTransfer.getData('newNodeType');
    const newNodeSubType = e.dataTransfer.getData('newNodeSubType');

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - panOffset.x) / zoom;
      const y = (e.clientY - rect.top - panOffset.y) / zoom;

      if (newNodeType && newNodeSubType) {
        // Adding new node from sidebar
        const newNode: FlowNode = {
          id: generateId(),
          type: newNodeType as FlowNode['type'],
          subType: newNodeSubType,
          position: { x, y },
          data: {},
          connections: [],
        };
        setFlow({ ...flow, nodes: [...flow.nodes, newNode] });
        setSelectedNode(newNode.id);
      }
    }
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const toggleFlowStatus = async () => {
    const newStatus = flow.status === 'active' ? 'paused' : 'active';
    setFlow({ ...flow, status: newStatus });

    if (flow.id) {
      try {
        await apiPut(`/flows/${flow.id}/status`, { status: newStatus });
        toast({
          title: newStatus === 'active' ? 'Flow Activated' : 'Flow Paused',
          description: newStatus === 'active'
            ? 'Your flow is now running'
            : 'Your flow has been paused',
        });
      } catch (error) {
        console.error('Failed to update flow status:', error);
      }
    }
  };

  // Import campaign as flow nodes
  const importFromCampaign = async (campaignId: number) => {
    try {
      let importedCampaign: { id: string | number; name: string; type: 'email' | 'sms' | 'call' } | null = null;
      let emailCampaignDetails: Campaign | null = null;

      // Prefer direct fetch for email campaigns so we always have the latest data
      if (campaignTypeFromUrl === 'email') {
        const campaign = await api.getCampaign(String(campaignId));
        emailCampaignDetails = campaign;
        importedCampaign = {
          id: campaign.id,
          name: campaign.name,
          type: 'email',
        };
      } else {
        const existing = campaigns.find(c => String(c.id) === String(campaignId));
        if (existing) {
          importedCampaign = {
            id: existing.id,
            name: existing.name,
            type: existing.type as 'email' | 'sms' | 'call',
          };
        }
      }

      if (!importedCampaign) {
        return;
      }

      const campaignName = importedCampaign.name;
      const campaignType = importedCampaign.type;

      // Create nodes based on campaign type
      const newNodes: FlowNode[] = [];
      let yPosition = 100;

      // Add trigger node
      newNodes.push({
        id: generateId(),
        type: 'trigger',
        subType: 'contact_added',
        position: { x: 300, y: yPosition },
        data: { label: `Imported from: ${campaignName}` },
        connections: [],
      });
      yPosition += 150;

      // Add action node based on campaign type
      if (campaignType === 'email') {
        const subject = emailCampaignDetails?.subject || `Email from ${campaignName}`;
        const htmlContent = emailCampaignDetails?.htmlContent || '';

        newNodes.push({
          id: generateId(),
          type: 'action',
          subType: 'send_email',
          position: { x: 300, y: yPosition },
          data: {
            label: campaignName,
            subject,
            htmlContent,
          },
          connections: [],
        });
      } else if (campaignType === 'sms') {
        newNodes.push({
          id: generateId(),
          type: 'action',
          subType: 'send_sms',
          position: { x: 300, y: yPosition },
          data: {
            label: campaignName,
            message: `SMS from ${campaignName}`,
          },
          connections: [],
        });
      }

      setFlow({
        ...flow,
        name: `Flow: ${campaignName}`,
        description: `Imported from ${campaignType} campaign: ${campaignName}`,
        nodes: newNodes,
      });

      toast({
        title: 'Campaign Imported',
        description: `Created flow from "${campaignName}"`,
      });
    } catch (error) {
      console.error('Failed to import campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to import campaign',
        variant: 'destructive',
      });
    }
  };

  // Export flow as a new campaign
  const exportToCampaign = async () => {
    try {
      // Find the first email or SMS action in the flow
      const emailAction = flow.nodes.find(n => n.subType === 'send_email');
      const smsAction = flow.nodes.find(n => n.subType === 'send_sms');

      const campaignType = emailAction ? 'email' : smsAction ? 'sms' : 'email';
      const actionNode = emailAction || smsAction;

      const campaignData = {
        name: `Campaign: ${flow.name}`,
        type: campaignType,
        subject: actionNode?.data?.subject || flow.name,
        content: actionNode?.data?.message || '',
        template_id: actionNode?.data?.templateId,
        status: 'draft',
        source_flow_id: flow.id,
      };

      const endpoint = campaignType === 'email' ? '/campaigns' : '/sms-campaigns';
      await apiPost(endpoint, campaignData);

      toast({
        title: 'Campaign Created',
        description: `New ${campaignType} campaign created and linked to flow`,
      });
    } catch (error) {
      console.error('Failed to export to campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive',
      });
    }
  };

  // Add a connection between two nodes
  const handleConnectNodes = (fromNodeId: string, toNodeId: string) => {
    setFlow((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => {
        if (n.id !== fromNodeId) return n;
        // Avoid duplicate connections
        if (n.connections.includes(toNodeId)) return n;
        return { ...n, connections: [...n.connections, toNodeId] };
      }),
    }));
  };

  const insertNodeBetween = (fromNodeId: string, toNodeId: string, type: FlowNode['type'], subType: string) => {
    const fromNode = flow.nodes.find((n) => n.id === fromNodeId);
    const toNode = flow.nodes.find((n) => n.id === toNodeId);
    if (!fromNode || !toNode) return;

    const newId = generateId();
    const midX = (fromNode.position.x + toNode.position.x) / 2;
    const midY = (fromNode.position.y + toNode.position.y) / 2;

    const newNode: FlowNode = {
      id: newId,
      type,
      subType,
      position: { x: midX, y: midY },
      data: {},
      connections: [toNodeId],
    };

    setFlow((prev) => ({
      ...prev,
      nodes: [
        ...prev.nodes.map((n) => {
          if (n.id !== fromNodeId) return n;
          return { ...n, connections: n.connections.map((c) => (c === toNodeId ? newId : c)) };
        }),
        newNode,
      ],
    }));
    setSelectedNode(newId);
  };

  const autoArrange = () => {
    const nodeMap = new Map(flow.nodes.map((n) => [n.id, n] as const));
    const incomingCount = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    flow.nodes.forEach((n) => {
      incomingCount.set(n.id, 0);
      adjacency.set(n.id, [...(n.connections || [])]);
    });
    flow.nodes.forEach((n) => {
      (n.connections || []).forEach((to) => {
        if (!incomingCount.has(to)) return;
        incomingCount.set(to, (incomingCount.get(to) || 0) + 1);
      });
    });

    const baseX = 200;
    const baseY = 120;
    const laneGap = 180;
    const stepGap = 240;
    const componentGap = 280;

    const assigned = new Set<string>();
    const nextPositions = new Map<string, { x: number; y: number }>();

    const getRoots = () => {
      const roots: string[] = [];
      flow.nodes.forEach((n) => {
        const incoming = incomingCount.get(n.id) || 0;
        if (n.type === 'trigger' || incoming === 0) roots.push(n.id);
      });
      roots.sort((a, b) => {
        const na = nodeMap.get(a);
        const nb = nodeMap.get(b);
        return (na?.position.y ?? 0) - (nb?.position.y ?? 0);
      });
      return roots;
    };

    let componentIndex = 0;
    const placeComponent = (startIds: string[]) => {
      const levels = new Map<string, number>();
      const q: string[] = [];

      startIds.forEach((id) => {
        if (assigned.has(id)) return;
        levels.set(id, 0);
        q.push(id);
        assigned.add(id);
      });

      while (q.length) {
        const id = q.shift()!;
        const level = levels.get(id) || 0;
        const outs = adjacency.get(id) || [];
        outs.forEach((to) => {
          if (!nodeMap.has(to)) return;
          const nextLevel = level + 1;
          const existing = levels.get(to);
          if (existing === undefined || nextLevel > existing) {
            levels.set(to, nextLevel);
          }
          if (!assigned.has(to)) {
            assigned.add(to);
            q.push(to);
          }
        });
      }

      const byLevel = new Map<number, string[]>();
      [...levels.entries()].forEach(([id, level]) => {
        if (!byLevel.has(level)) byLevel.set(level, []);
        byLevel.get(level)!.push(id);
      });

      [...byLevel.entries()].forEach(([level, ids]) => {
        ids.sort((a, b) => {
          const na = nodeMap.get(a);
          const nb = nodeMap.get(b);
          return (na?.position.y ?? 0) - (nb?.position.y ?? 0);
        });

        ids.forEach((id, idx) => {
          const offset = componentIndex * componentGap;
          const x = layoutDirection === 'horizontal' ? baseX + level * stepGap : baseX + idx * stepGap;
          const y = layoutDirection === 'horizontal' ? baseY + idx * laneGap + offset : baseY + level * laneGap + offset;
          nextPositions.set(id, { x, y });
        });
      });

      componentIndex += 1;
    };

    const roots = getRoots();
    if (roots.length) placeComponent(roots);

    flow.nodes.forEach((n) => {
      if (assigned.has(n.id)) return;
      placeComponent([n.id]);
    });

    setFlow((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => {
        const p = nextPositions.get(n.id);
        return p ? { ...n, position: p } : n;
      }),
    }));
  };

  // Memoized connections rendering for better performance
  const renderedConnections = useMemo(() => {
    const connections: JSX.Element[] = [];

    flow.nodes.forEach((node) => {
      node.connections.forEach((targetId) => {
        const target = flow.nodes.find((n) => n.id === targetId);
        if (!target) return;

        const startX =
          layoutDirection === 'horizontal'
            ? (node.position.x + 256) * zoom + panOffset.x
            : (node.position.x + 128) * zoom + panOffset.x;
        const startY = (node.position.y + 80) * zoom + panOffset.y;
        const endX =
          layoutDirection === 'horizontal'
            ? target.position.x * zoom + panOffset.x
            : (target.position.x + 128) * zoom + panOffset.x;
        const endY =
          layoutDirection === 'horizontal'
            ? (target.position.y + 80) * zoom + panOffset.y
            : target.position.y * zoom + panOffset.y;

        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        const d =
          layoutDirection === 'horizontal'
            ? `M ${startX} ${startY} C ${startX + 80} ${startY}, ${endX - 80} ${endY}, ${endX} ${endY}`
            : `M ${startX} ${startY} C ${startX} ${startY + 50}, ${endX} ${endY - 50}, ${endX} ${endY}`;

        connections.push(
          <React.Fragment key={`${node.id}-${target.id}`}>
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <marker
                  id={`arrowhead-${node.id}-${targetId}`}
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="currentColor"
                    className="text-muted-foreground"
                  />
                </marker>
              </defs>
              <path
                d={d}
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-muted-foreground"
                markerEnd={`url(#arrowhead-${node.id}-${targetId})`}
              />
            </svg>
            <div
              className="absolute z-[1]"
              style={{ left: midX - 10, top: midY - 10 }}
            >
              <Button
                variant="secondary"
                size="icon"
                className="h-5 w-5 rounded-full shadow hover:scale-110 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  setEdgeInsert({ fromNodeId: node.id, toNodeId: target.id });
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </React.Fragment>
        );
      });
    });

    return connections;
  }, [flow.nodes, zoom, panOffset.x, panOffset.y, layoutDirection]);

  // Group nodes by category
  const groupByCategory = (nodes: typeof NODE_TYPES.triggers) => {
    const groups: Record<string, typeof NODE_TYPES.triggers> = {};
    nodes.forEach(node => {
      const cat = (node as any).category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(node);
    });
    return groups;
  };

  const categoryLabels: Record<string, string> = {
    contact: '👤 Contact',
    email: '📧 Email',
    sms: '💬 SMS',
    call: '📞 Call',
    form: '📝 Form & Pages',
    ecommerce: '🛒 E-commerce',
    time: '⏰ Date & Time',
    integration: '🔗 Integration',
    manual: '▶️ Manual',
    campaign: '🎯 Campaign',
    crm: '📊 CRM & Tasks',
    notification: '🔔 Notifications',
    conversion: '📈 Conversion',
    flow: '🔄 Flow Control',
    logic: '🔀 Logic',
    split: '⚡ Split Testing',
    delay: '⏱️ Delays',
    other: '📦 Other',
  };

  const NodePalette: React.FC<{
    title: string;
    nodes: typeof NODE_TYPES.triggers;
    type: FlowNode['type'];
    defaultExpanded?: boolean;
  }> = ({ title, nodes, type, defaultExpanded = true }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const grouped = groupByCategory(nodes);

    const toggleCategory = (cat: string) => {
      setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    return (
      <div className="space-y-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            {title}
            <Badge variant="secondary" className="text-[12px] px-1.5 py-0">{nodes.length}</Badge>
          </h4>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>

        {expanded && (
          <div className="space-y-2">
            {Object.entries(grouped).map(([category, categoryNodes]) => (
              <div key={category} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center justify-between w-full p-2 bg-muted/50 hover:bg-muted text-left text-xs font-medium"
                >
                  <span>{categoryLabels[category] || category}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[12px] px-1 py-0">{categoryNodes.length}</Badge>
                    <ChevronRight className={`h-3 w-3 transition-transform ${expandedCategories[category] !== false ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {expandedCategories[category] !== false && (
                  <div className="p-1 space-y-0.5">
                    {categoryNodes.map(node => (
                      <div
                        key={node.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-grab transition-colors"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('newNodeType', type);
                          e.dataTransfer.setData('newNodeSubType', node.id);
                        }}
                        onClick={() => addNode(type, node.id)}
                        title={node.description}
                      >
                        <node.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{node.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Show loading skeleton while resources are loading
  if (loading || !resourcesLoaded) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              <div className="w-48 h-5 bg-muted rounded animate-pulse" />
              <div className="w-32 h-4 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-8 bg-muted rounded animate-pulse" />
            <div className="w-20 h-8 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1 flex">
          <div className="w-72 border-r p-4 space-y-4">
            <div className="w-full h-10 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-full h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-4" />
              <p className="text-muted-foreground">Loading Flows...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(automationId ? '/automations' : '/automations/builder')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <input
              type="text"
              value={flow.name}
              onChange={(e) => setFlow({ ...flow, name: e.target.value })}
              className="text-lg font-semibold bg-transparent border-none p-0 h-auto focus:outline-none focus:ring-0 placeholder:text-muted-foreground hover:text-foreground/80 transition-colors w-[400px]"
              placeholder="Name your flow..."
            />
            <input
              type="text"
              value={flow.description || ''}
              onChange={(e) => setFlow({ ...flow, description: e.target.value })}
              className="text-sm text-muted-foreground bg-transparent border-none p-0 h-auto focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50 w-[400px]"
              placeholder="Add a description..."
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {automationId && (
            <>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                <Zap className="h-3 w-3 mr-1" />
                Automation Flow
              </Badge>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'visual' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => {
                setViewMode('visual');
                localStorage.setItem('flow_builder_view_mode', 'visual');
                const url = new URL(window.location.href);
                url.searchParams.delete('view');
                window.history.replaceState({}, '', url.toString());
              }}
            >
              <Workflow className="h-4 w-4 mr-1" />
              Visual
            </Button>
            <Button
              variant={viewMode === 'spreadsheet' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => {
                setViewMode('spreadsheet');
                localStorage.setItem('flow_builder_view_mode', 'spreadsheet');
                const url = new URL(window.location.href);
                url.searchParams.set('view', 'spreadsheet');
                window.history.replaceState({}, '', url.toString());
              }}
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Table
            </Button>
          </div>

          {/* Real-time Sync Indicator */}
          {viewMode === 'visual' && (
            <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-xs">
              <SyncIcon className={`h-3 w-3 ${isRealTimeSync ? 'text-green-500' : 'text-muted-foreground'}`} />
              <span className="text-muted-foreground">Sync</span>
            </div>
          )}

          <Separator orientation="vertical" className="h-6" />
          <Badge variant={flow.status === 'active' ? 'default' : flow.status === 'paused' ? 'secondary' : 'outline'}>
            {flow.status === 'active' && <Play className="h-3 w-3 mr-1" />}
            {flow.status === 'paused' && <Pause className="h-3 w-3 mr-1" />}
            {flow.status}
          </Badge>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="outline" size="sm" onClick={toggleFlowStatus} disabled={flow.nodes.length === 0}>
            {flow.status === 'active' ? (
              <>
                <PauseCircle className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Button size="sm" onClick={saveFlow} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* View Mode Conditional Rendering */}
      {viewMode === 'spreadsheet' ? (
        <AutomationSpreadsheetView
          flowId={flowId ? parseInt(flowId) : undefined}
          initialFlow={flow}
          mode="embedded"
          syncEnabled={isRealTimeSync}
          onSyncChange={setIsRealTimeSync}
          onSave={(updatedFlow) => {
            // Sync back to visual builder state
            setFlow(prev => ({
              ...prev,
              ...updatedFlow,
              nodes: updatedFlow.nodes || prev.nodes,
            }));
          }}
          onClose={() => setViewMode('visual')}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Node Palette */}
          <div className="w-72 border-r bg-muted/30 flex flex-col overflow-hidden">
            <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as 'nodes' | 'settings' | 'node')} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="mx-4 mt-4 flex-shrink-0 grid grid-cols-3">
                <TabsTrigger value="nodes" className="text-xs px-2">
                  <LayoutGrid className="h-3 w-3 mr-1" />
                  Nodes
                </TabsTrigger>
                <TabsTrigger value="node" className="text-xs px-2 relative">
                  <Pencil className="h-3 w-3 mr-1" />
                  Node
                  {selectedNode && <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />}
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs px-2">
                  <Settings className="h-3 w-3 mr-1" />
                  Flow
                </TabsTrigger>
              </TabsList>

              <TabsContent value="nodes" className="flex-1 overflow-auto m-0 mt-2">
                <div className="p-4 space-y-4 pb-20">
                  <NodePalette title="Triggers" nodes={NODE_TYPES.triggers} type="trigger" />
                  <Separator />
                  <NodePalette title="Actions" nodes={NODE_TYPES.actions} type="action" />
                  <Separator />
                  <NodePalette title="Conditions" nodes={NODE_TYPES.conditions} type="condition" />
                  <Separator />
                  <NodePalette title="Timing" nodes={NODE_TYPES.timing} type="delay" />
                </div>
              </TabsContent>

              <TabsContent value="node" className="flex-1 overflow-auto m-0 mt-2">
                <div className="p-4 space-y-4 pb-20">
                  {selectedNode ? (
                    <InlineNodeSettings
                      node={flow.nodes.find(n => n.id === selectedNode) || null}
                      onUpdate={(updatedNode) => {
                        setFlow({
                          ...flow,
                          nodes: flow.nodes.map(n => n.id === updatedNode.id ? updatedNode : n),
                        });
                      }}
                      onDelete={() => {
                        setFlow({
                          ...flow,
                          nodes: flow.nodes.filter(n => n.id !== selectedNode).map(n => ({
                            ...n,
                            connections: n.connections.filter(c => c !== selectedNode),
                          })),
                        });
                        setSelectedNode(null);
                      }}
                      templates={templates}
                      forms={forms}
                      campaigns={campaigns}
                      tags={tags}
                      sendingAccounts={sendingAccounts}
                      lists={lists}
                      sequences={sequences}
                      users={users}
                      callScripts={callScripts}
                      landingPages={landingPages}
                      flowNodes={flow.nodes}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <Pencil className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                      <h3 className="font-medium text-muted-foreground">No Node Selected</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Click on a node in the canvas to edit its settings
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="flex-1 overflow-auto m-0 mt-2">
                <div className="p-4 space-y-4 pb-20">
                  <div>
                    <Label>Flow Name</Label>
                    <Input
                      value={flow.name}
                      onChange={(e) => setFlow({ ...flow, name: e.target.value })}
                      placeholder="Enter flow name..."
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={flow.description}
                      onChange={(e) => setFlow({ ...flow, description: e.target.value })}
                      placeholder="Describe what this flow does..."
                      rows={3}
                    />
                  </div>

                  <Separator />

                  {/* Connect to Campaign */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">🔗 Connect to Campaign</h4>
                    <p className="text-xs text-muted-foreground">Link this flow to an existing campaign</p>
                    <Select
                      value={flow.campaign_id?.toString() || '__none'}
                      onValueChange={(v) => setFlow({
                        ...flow,
                        campaign_id: v === '__none' ? undefined : parseInt(v),
                        campaign_type: v === '__none' ? undefined : campaigns.find(c => c.id === parseInt(v))?.type as any
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a campaign..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">No campaign (standalone flow)</SelectItem>
                        {(campaigns || []).filter(c => c.type === 'email').length > 0 && (
                          <>
                            <SelectItem value="__email_header" disabled>— Email Campaigns —</SelectItem>
                            {(campaigns || []).filter(c => c.type === 'email').map(c => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                <span className="flex items-center gap-2">
                                  <Mail className="h-3 w-3" />
                                  {c.name}
                                  {c.status && <Badge variant="outline" className="text-[12px] ml-1">{c.status}</Badge>}
                                </span>
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {(campaigns || []).filter(c => c.type === 'sms').length > 0 && (
                          <>
                            <SelectItem value="__sms_header" disabled>— SMS Campaigns —</SelectItem>
                            {(campaigns || []).filter(c => c.type === 'sms').map(c => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                <span className="flex items-center gap-2">
                                  <MessageSquare className="h-3 w-3" />
                                  {c.name}
                                  {c.status && <Badge variant="outline" className="text-[12px] ml-1">{c.status}</Badge>}
                                </span>
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {(campaigns || []).filter(c => c.type === 'call').length > 0 && (
                          <>
                            <SelectItem value="__call_header" disabled>— Call Campaigns —</SelectItem>
                            {(campaigns || []).filter(c => c.type === 'call').map(c => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                <span className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  {c.name}
                                  {c.status && <Badge variant="outline" className="text-[12px] ml-1">{c.status}</Badge>}
                                </span>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    {flow.campaign_id && (
                      <div className="p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Flow connected to campaign
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Import from Campaign */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">📥 Import from Campaign</h4>
                    <p className="text-xs text-muted-foreground">Convert an existing campaign into this flow</p>
                    <Select onValueChange={(v) => importFromCampaign(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a campaign to import..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(campaigns || []).map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            <span className="flex items-center gap-2">
                              {c.type === 'email' ? <Mail className="h-3 w-3" /> : c.type === 'sms' ? <MessageSquare className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                              {c.name} ({c.type})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Export to Campaign */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Export to Campaign</h4>
                    <p className="text-xs text-muted-foreground">Create a new campaign from this flow</p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={exportToCampaign}
                      disabled={flow.nodes.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export as Campaign
                    </Button>
                  </div>

                  <Separator />

                  {/* Flow Statistics */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Flow Statistics</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Card className="p-3">
                        <p className="text-2xl font-bold">{flow.stats?.total_contacts || 0}</p>
                        <p className="text-xs text-muted-foreground">Contacts</p>
                      </Card>
                      <Card className="p-3">
                        <p className="text-2xl font-bold">{flow.stats?.emails_sent || 0}</p>
                        <p className="text-xs text-muted-foreground">Emails Sent</p>
                      </Card>
                      <Card className="p-3">
                        <p className="text-2xl font-bold">{flow.stats?.sms_sent || 0}</p>
                        <p className="text-xs text-muted-foreground">SMS Sent</p>
                      </Card>
                      <Card className="p-3">
                        <p className="text-2xl font-bold">{flow.stats?.conversions || 0}</p>
                        <p className="text-xs text-muted-foreground">Conversions</p>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Advanced Settings */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Advanced Settings</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Allow Re-entry</Label>
                        <p className="text-xs text-muted-foreground">Contacts can enter flow multiple times</p>
                      </div>
                      <Switch
                        checked={flow.nodes[0]?.data?.allowReentry || false}
                        onCheckedChange={(v) => {
                          if (flow.nodes.length > 0) {
                            const updatedNodes = [...flow.nodes];
                            updatedNodes[0] = { ...updatedNodes[0], data: { ...updatedNodes[0].data, allowReentry: v } };
                            setFlow({ ...flow, nodes: updatedNodes });
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Exit on Goal</Label>
                        <p className="text-xs text-muted-foreground">Remove contacts when goal is reached</p>
                      </div>
                      <Switch
                        checked={flow.nodes[0]?.data?.exitOnGoal || false}
                        onCheckedChange={(v) => {
                          if (flow.nodes.length > 0) {
                            const updatedNodes = [...flow.nodes];
                            updatedNodes[0] = { ...updatedNodes[0], data: { ...updatedNodes[0].data, exitOnGoal: v } };
                            setFlow({ ...flow, nodes: updatedNodes });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:20px_20px]">
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-background/80 backdrop-blur rounded-lg border p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLayoutDirection((d) => (d === 'vertical' ? 'horizontal' : 'vertical'))}
                title={layoutDirection === 'vertical' ? 'Switch to horizontal layout' : 'Switch to vertical layout'}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={autoArrange}
                title="Auto arrange"
                disabled={flow.nodes.length === 0}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="icon" onClick={() => setZoom(1)} title="Reset zoom">
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Canvas Area */}
            <div
              ref={canvasRef}
              className="absolute inset-0 overflow-auto"
              onDrop={handleCanvasDrop}
              onDragOver={handleDragOver}
              onClick={() => setSelectedNode(null)}
            >
              <div
                className="relative min-w-[2000px] min-h-[2000px]"
                style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}
              >
                {/* Render connections */}
                {renderedConnections}

                {/* Render nodes */}
                {flow.nodes.map(node => (
                  <FlowNodeComponent
                    key={node.id}
                    node={node}
                    selected={selectedNode === node.id}
                    onSelect={() => setSelectedNode(node.id)}
                    onDelete={() => deleteNode(node.id)}
                    onDuplicate={() => duplicateNode(node.id)}
                    onEdit={() => setEditingNode(node)}
                    onPointerDown={(e) => handleNodePointerDown(node.id, e)}
                    onConnect={handleConnectNodes}
                    zoom={zoom}
                    layoutDirection={layoutDirection}
                  />
                ))}

                {/* Empty state */}
                {flow.nodes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Card className="max-w-md text-center p-8">
                      <Workflow className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Start Building Your Flow</h3>
                      <p className="text-muted-foreground mb-4">
                        Drag and drop nodes from the left sidebar to create your campaign flow.
                        Start with a trigger to define when the flow begins.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Info className="h-4 w-4" />
                        <span>Tip: Start with a trigger node</span>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Node Editor Dialog */}
      <NodeEditorDialog
        node={editingNode}
        open={!!editingNode}
        onClose={() => setEditingNode(null)}
        onSave={updateNode}
        templates={templates}
        forms={forms}
        campaigns={campaigns}
        tags={tags}
        sendingAccounts={sendingAccounts}
        lists={lists}
        sequences={sequences}
        users={users}
        callScripts={callScripts}
        landingPages={landingPages}
        flowNodes={flow.nodes}
      />

      <Dialog open={!!edgeInsert} onOpenChange={(open) => !open && setEdgeInsert(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Insert node</DialogTitle>
            <DialogDescription>Select a node to insert between these steps</DialogDescription>
            {/* Debug: show how many nodes are available */}
            <div className="text-sm text-muted-foreground mt-2">Showing <strong className="text-default">{[...NODE_TYPES.actions, ...NODE_TYPES.conditions, ...NODE_TYPES.timing].length}</strong> nodes</div>
          </DialogHeader>
          <ScrollArea className="h-[50vh] min-h-0 pr-4">
            <div className="grid grid-cols-2 gap-2 pb-4">
              {[...NODE_TYPES.actions, ...NODE_TYPES.conditions, ...NODE_TYPES.timing].map((t) => (
                <Button
                  key={t.id}
                  variant="outline"
                  className="justify-start h-auto py-2"
                  onClick={() => {
                    if (!edgeInsert) return;
                    const type: FlowNode['type'] =
                      NODE_TYPES.actions.some((a) => a.id === t.id)
                        ? 'action'
                        : NODE_TYPES.conditions.some((c) => c.id === t.id)
                          ? 'condition'
                          : 'delay';

                    insertNodeBetween(edgeInsert.fromNodeId, edgeInsert.toNodeId, type, t.id);
                    setEdgeInsert(null);
                  }}
                >
                  <t.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{t.name}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEdgeInsert(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

