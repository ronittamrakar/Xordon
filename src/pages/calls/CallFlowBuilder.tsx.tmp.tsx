import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    MarkerType,
    Node,
    Edge,
    Connection,
    Handle,
    Position,
    ReactFlowProvider,
    useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
    Phone, PhoneCall, PhoneForwarded, PhoneOff, MessageSquare, Clock, Bot, Globe, Zap,
    Split, Tags, UserCheck, HelpCircle, Save, Trash2, Plus, XCircle, ArrowLeft,
    Monitor, ShieldCheck, Music, Ticket, Database, PhoneMissed, Calendar, Search,
    AlertCircle, CheckCircle2, Info, Copy, ChevronRight, Layout, Webhook, Mail,
    History, Users, MapPin, Languages, Star, BarChart3, Terminal, Briefcase,
    Volume2, Keyboard, FileText, Repeat, Merge, Timer, Bell, Shield, Hash,
    Filter, BarChart, Send, Upload, Link2, PhoneIncoming, PhoneOutgoing,
    UserPlus, Building2, TrendingUp, Target, Award, DollarSign, CreditCard,
    Receipt, ShoppingCart, Package, Truck, Home, School, Hospital, Factory,
    Store, Coffee, Utensils, Car, Plane, Train, Bus, Bike, Wallet, PiggyBank,
    Mic, GitBranch, Play
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// COMPREHENSIVE NODE TYPE DEFINITIONS
// ============================================
const CALL_FLOW_NODES = {
    triggers: [
        { id: 'incoming_call', name: 'Incoming Call', icon: PhoneIncoming, description: 'When a call comes in', color: 'green' },
        { id: 'missed_call', name: 'Missed Call', icon: PhoneMissed, description: 'When a call is missed', color: 'orange' },
        { id: 'scheduled_callback', name: 'Scheduled Callback', icon: Calendar, description: 'Scheduled callback trigger', color: 'purple' },
    ],
    actions: [
        { id: 'play_audio', name: 'Play Audio/TTS', icon: Volume2, description: 'Play message or audio file', color: 'blue' },
        { id: 'gather_input', name: 'Gather Input', icon: Keyboard, description: 'Collect DTMF keypress', color: 'blue' },
        { id: 'record_voicemail', name: 'Record Voicemail', icon: Mic, description: 'Record caller message', color: 'blue' },
        { id: 'forward_call', name: 'Forward Call', icon: PhoneForwarded, description: 'Forward to phone number', color: 'blue' },
        { id: 'transfer_call', name: 'Transfer to Agent', icon: UserPlus, description: 'Transfer to specific agent', color: 'blue' },
        { id: 'conference_call', name: 'Start Conference', icon: Users, description: 'Add caller to conference', color: 'blue' },
        { id: 'send_sms', name: 'Send SMS', icon: MessageSquare, description: 'Send automated text', color: 'blue' },
        { id: 'send_email', name: 'Send Email', icon: Mail, description: 'Send automated email', color: 'blue' },
        { id: 'webhook', name: 'Trigger Webhook', icon: Zap, description: 'Send data to external URL', color: 'blue' },
        { id: 'create_ticket', name: 'Create Ticket', icon: Ticket, description: 'Create support ticket', color: 'indigo' },
        { id: 'update_crm', name: 'Update CRM', icon: Database, description: 'Update customer record', color: 'indigo' },
        { id: 'tag_call', name: 'Tag Call', icon: Tags, description: 'Add metadata tags', color: 'indigo' },
        { id: 'set_priority', name: 'Set Priority', icon: TrendingUp, description: 'Adjust call priority', color: 'indigo' },
        { id: 'ai_agent', name: 'AI Voice Agent', icon: Bot, description: 'Conversational AI response', color: 'purple' },
        { id: 'play_music', name: 'Play Music', icon: Music, description: 'Play hold music', color: 'blue' },
        { id: 'hangup', name: 'Hang Up', icon: PhoneOff, description: 'End the phone call', color: 'red' },
        { id: 'queue_call', name: 'Add to Queue', icon: History, description: 'Place caller in wait queue', color: 'blue' },
        { id: 'screen_call', name: 'Screen Call', icon: ShieldCheck, description: 'Ask caller for name/purpose', color: 'blue' },
        { id: 'callback_request', name: 'Callback Request', icon: PhoneCall, description: 'Let caller request callback', color: 'blue' },
        { id: 'survey', name: 'Post-Call Survey', icon: BarChart3, description: 'Customer feedback survey', color: 'blue' },
    ],
    conditions: [
        { id: 'time_check', name: 'Business Hours', icon: Clock, description: 'Route by open/closed status', color: 'amber' },
        { id: 'caller_id_check', name: 'Caller ID Check', icon: Search, description: 'Route by caller number', color: 'amber' },
        { id: 'geo_check', name: 'Geo Location', icon: Globe, description: 'Route by caller region', color: 'amber' },
        { id: 'menu_option', name: 'IVR Menu (DTMF)', icon: Split, description: 'Route by keypad selection', color: 'amber' },
        { id: 'language_check', name: 'Language Check', icon: Languages, description: 'Detect or ask for language', color: 'amber' },
        { id: 'vip_check', name: 'VIP Status', icon: Star, description: 'Route high-value customers', color: 'amber' },
        { id: 'queue_status', name: 'Queue Status', icon: BarChart, description: 'Route by wait time/size', color: 'amber' },
        { id: 'agent_availability', name: 'Agent Status', icon: UserCheck, description: 'Check if agents are online', color: 'amber' },
        { id: 'call_count', name: 'Call Count', icon: Hash, description: 'Route by number of attempts', color: 'amber' },
        { id: 'custom_field', name: 'Custom Data', icon: Terminal, description: 'Check specific CRM data', color: 'amber' },
        { id: 'time_of_day', name: 'Time of Day', icon: Timer, description: 'Specific time-based routing', color: 'amber' },
        { id: 'day_of_week', name: 'Day of Week', icon: Calendar, description: 'Monday-Sunday routing', color: 'amber' },
        { id: 'holiday_check', name: 'Holiday Check', icon: Bell, description: 'Route on public holidays', color: 'amber' },
        { id: 'department_check', name: 'Department Filter', icon: Briefcase, description: 'Filter by department tags', color: 'amber' },
    ],
    integrations: [
        { id: 'salesforce', name: 'Salesforce', icon: Cloud, description: 'Sync with Salesforce CRM', color: 'sky' },
        { id: 'hubspot', name: 'HubSpot', icon: Layout, description: 'Sync with HubSpot CRM', color: 'orange' },
        { id: 'zendesk', name: 'Zendesk', icon: HelpCircle, description: 'Sync with Zendesk Support', color: 'green' },
    ]
};
