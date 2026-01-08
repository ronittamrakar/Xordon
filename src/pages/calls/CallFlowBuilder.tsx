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
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    useReactFlow,
    Panel,
    Handle,
    Position,
    MarkerType,
    Node,
    Edge,
    Connection,
    NodeProps,
    ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

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
        { id: 'forward_call', name: 'Forward Call', icon: PhoneForwarded, description: 'Forward to number/agent', color: 'blue' },
        { id: 'transfer_call', name: 'Transfer Call', icon: PhoneForwarded, description: 'Transfer with announcement', color: 'blue' },
        { id: 'conference_call', name: 'Conference Call', icon: Users, description: 'Add to conference', color: 'blue' },
        { id: 'send_sms', name: 'Send SMS', icon: MessageSquare, description: 'Send SMS to caller', color: 'blue' },
        { id: 'send_email', name: 'Send Email', icon: Mail, description: 'Send email notification', color: 'blue' },
        { id: 'webhook', name: 'Webhook', icon: Webhook, description: 'Call external API', color: 'blue' },
        { id: 'create_ticket', name: 'Create Ticket', icon: FileText, description: 'Create support ticket', color: 'blue' },
        { id: 'update_crm', name: 'Update CRM', icon: Database, description: 'Update CRM record', color: 'blue' },
        { id: 'tag_call', name: 'Tag Call', icon: Tags, description: 'Add tag to call', color: 'blue' },
        { id: 'set_priority', name: 'Set Priority', icon: Star, description: 'Set call priority', color: 'blue' },
        { id: 'ai_agent', name: 'AI Agent', icon: Bot, description: 'Route to AI voice agent', color: 'blue' },
        { id: 'play_music', name: 'Play Hold Music', icon: Music, description: 'Play music on hold', color: 'blue' },
        { id: 'hangup', name: 'Hang Up', icon: PhoneOff, description: 'End the call', color: 'red' },
        { id: 'queue_call', name: 'Add to Queue', icon: Users, description: 'Add to call queue', color: 'blue' },
        { id: 'screen_call', name: 'Screen Call', icon: Shield, description: 'Screen caller identity', color: 'blue' },
        { id: 'callback_request', name: 'Request Callback', icon: Phone, description: 'Offer callback option', color: 'blue' },
        { id: 'survey', name: 'Survey/Feedback', icon: BarChart, description: 'Collect feedback', color: 'blue' },
    ],
    conditions: [
        { id: 'time_check', name: 'Business Hours', icon: Clock, description: 'Check business hours', color: 'amber' },
        { id: 'caller_id_check', name: 'Caller ID Check', icon: UserCheck, description: 'Check caller ID', color: 'amber' },
        { id: 'geo_check', name: 'Geo Routing', icon: MapPin, description: 'Route by area code', color: 'amber' },
        { id: 'menu_option', name: 'Menu Option', icon: GitBranch, description: 'Route by keypress', color: 'amber' },
        { id: 'language_check', name: 'Language Check', icon: Globe, description: 'Detect/select language', color: 'amber' },
        { id: 'vip_check', name: 'VIP Check', icon: Star, description: 'Check VIP status', color: 'amber' },
        { id: 'queue_status', name: 'Queue Status', icon: Users, description: 'Check queue length', color: 'amber' },
        { id: 'agent_availability', name: 'Agent Available', icon: UserCheck, description: 'Check agent status', color: 'amber' },
        { id: 'call_count', name: 'Call Count', icon: Hash, description: 'Check call attempts', color: 'amber' },
        { id: 'custom_field', name: 'Custom Field', icon: Filter, description: 'Check custom data', color: 'amber' },
        { id: 'time_of_day', name: 'Time of Day', icon: Clock, description: 'Route by time', color: 'amber' },
        { id: 'day_of_week', name: 'Day of Week', icon: Calendar, description: 'Route by day', color: 'amber' },
        { id: 'holiday_check', name: 'Holiday Check', icon: Calendar, description: 'Check if holiday', color: 'amber' },
        { id: 'department_check', name: 'Department', icon: Building2, description: 'Route by department', color: 'amber' },
    ],
    integrations: [
        { id: 'salesforce', name: 'Salesforce', icon: Database, description: 'Salesforce integration', color: 'indigo' },
        { id: 'hubspot', name: 'HubSpot', icon: Database, description: 'HubSpot integration', color: 'indigo' },
        { id: 'zendesk', name: 'Zendesk', icon: FileText, description: 'Zendesk integration', color: 'indigo' },
        { id: 'slack', name: 'Slack Notify', icon: Bell, description: 'Send Slack message', color: 'indigo' },
        { id: 'zapier', name: 'Zapier', icon: Zap, description: 'Trigger Zapier zap', color: 'indigo' },
    ],
};

// ============================================
// CUSTOM NODE COMPONENTS
// ============================================

interface FlowNodeData {
    label: string;
    type: string;
    icon?: React.ComponentType<{ className?: string }>;
    config?: Record<string, any>;
}

const TriggerNode = ({ data, selected }: NodeProps<FlowNodeData>) => {
    const IconComponent = data.icon || PhoneCall;
    return (
        <div className={`px-4 py-3 rounded-lg border-2 ${selected ? 'border-green-500 ring-2 ring-green-200' : 'border-green-400'} bg-green-50 dark:bg-green-900/20 min-w-[200px] shadow-md`}>
            <Handle type="source" position={Position.Bottom} className="!bg-green-500 !w-3 !h-3" />
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-100 dark:bg-green-800">
                    <IconComponent className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <div>
                    <div className="font-semibold text-sm">{data.label}</div>
                    <div className="text-xs text-muted-foreground">Trigger</div>
                </div>
            </div>
        </div>
    );
};

const ActionNode = ({ data, selected }: NodeProps<FlowNodeData>) => {
    const IconComponent = data.icon || Play;
    return (
        <div className={`px-4 py-3 rounded-lg border-2 ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-blue-400'} bg-blue-50 dark:bg-blue-900/20 min-w-[200px] shadow-md`}>
            <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3" />
            <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-800">
                    <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div className="flex-1">
                    <div className="font-semibold text-sm">{data.label}</div>
                    <div className="text-xs text-muted-foreground">Action</div>
                    {data.config?.summary && (
                        <div className="text-xs text-blue-600 mt-1 truncate max-w-[150px]">{data.config.summary}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ConditionNode = ({ data, selected }: NodeProps<FlowNodeData>) => {
    const IconComponent = data.icon || GitBranch;
    return (
        <div className={`px-4 py-3 rounded-lg border-2 ${selected ? 'border-amber-500 ring-2 ring-amber-200' : 'border-amber-400'} bg-amber-50 dark:bg-amber-900/20 min-w-[200px] shadow-md`}>
            <Handle type="target" position={Position.Top} className="!bg-amber-500 !w-3 !h-3" />
            <Handle type="source" position={Position.Bottom} id="yes" style={{ left: '30%' }} className="!bg-green-500 !w-3 !h-3" />
            <Handle type="source" position={Position.Bottom} id="no" style={{ left: '70%' }} className="!bg-red-500 !w-3 !h-3" />
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-800">
                    <IconComponent className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                </div>
                <div className="flex-1">
                    <div className="font-semibold text-sm">{data.label}</div>
                    <div className="text-xs text-muted-foreground">Condition</div>
                </div>
            </div>
            <div className="flex justify-between text-xs mt-2 px-1 font-medium">
                <span className="text-green-600">✓ Yes</span>
                <span className="text-red-600">✗ No</span>
            </div>
        </div>
    );
};

const IntegrationNode = ({ data, selected }: NodeProps<FlowNodeData>) => {
    const IconComponent = data.icon || Database;
    return (
        <div className={`px-4 py-3 rounded-lg border-2 ${selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-indigo-400'} bg-indigo-50 dark:bg-indigo-900/20 min-w-[200px] shadow-md`}>
            <Handle type="target" position={Position.Top} className="!bg-indigo-500 !w-3 !h-3" />
            <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-3 !h-3" />
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-indigo-100 dark:bg-indigo-800">
                    <IconComponent className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                </div>
                <div>
                    <div className="font-semibold text-sm">{data.label}</div>
                    <div className="text-xs text-muted-foreground">Integration</div>
                </div>
            </div>
        </div>
    );
};

const nodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
    condition: ConditionNode,
    integration: IntegrationNode,
};

// ============================================
// NODE CONFIGURATION PANELS
// ============================================

const PlayAudioConfig = ({ node, updateConfig, mediaLibrary }: any) => (
    <div className="space-y-4">
        <div>
            <Label>Audio Source</Label>
            <Select value={node.data.config?.audioSource || 'tts'} onValueChange={(v) => updateConfig('audioSource', v)}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="tts">Text-to-Speech</SelectItem>
                    <SelectItem value="upload">Upload Audio File</SelectItem>
                    <SelectItem value="url">Audio URL</SelectItem>
                    <SelectItem value="library">Media Library</SelectItem>
                </SelectContent>
            </Select>
        </div>

        {node.data.config?.audioSource === 'tts' && (
            <>
                <div>
                    <Label>Message Text</Label>
                    <Textarea
                        placeholder="Enter the message to speak..."
                        value={node.data.config?.message || ''}
                        onChange={(e) => updateConfig('message', e.target.value)}
                        rows={4}
                    />
                </div>
                <div>
                    <Label>Voice</Label>
                    <Select value={node.data.config?.voice || 'alice'} onValueChange={(v) => updateConfig('voice', v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="alice">Alice (Female, US)</SelectItem>
                            <SelectItem value="polly.joanna">Joanna (Female, US)</SelectItem>
                            <SelectItem value="polly.matthew">Matthew (Male, US)</SelectItem>
                            <SelectItem value="polly.amy">Amy (Female, UK)</SelectItem>
                            <SelectItem value="polly.brian">Brian (Male, UK)</SelectItem>
                            <SelectItem value="google.en-US-Wavenet-A">Google Wavenet A</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Language</Label>
                    <Select value={node.data.config?.language || 'en-US'} onValueChange={(v) => updateConfig('language', v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en-US">English (US)</SelectItem>
                            <SelectItem value="en-GB">English (UK)</SelectItem>
                            <SelectItem value="es-ES">Spanish (Spain)</SelectItem>
                            <SelectItem value="es-MX">Spanish (Mexico)</SelectItem>
                            <SelectItem value="fr-FR">French</SelectItem>
                            <SelectItem value="de-DE">German</SelectItem>
                            <SelectItem value="it-IT">Italian</SelectItem>
                            <SelectItem value="pt-BR">Portuguese (Brazil)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center justify-between">
                    <Label>Loop Audio</Label>
                    <Switch checked={node.data.config?.loop || false} onCheckedChange={(v) => updateConfig('loop', v)} />
                </div>
            </>
        )}

        {node.data.config?.audioSource === 'url' && (
            <div>
                <Label>Audio URL</Label>
                <Input
                    placeholder="https://example.com/audio.mp3"
                    value={node.data.config?.audioUrl || ''}
                    onChange={(e) => updateConfig('audioUrl', e.target.value)}
                />
            </div>
        )}

        {node.data.config?.audioSource === 'library' && (
            <div>
                <Label>Select Audio from Library</Label>
                <Select value={node.data.config?.mediaId || ''} onValueChange={(v) => updateConfig('mediaId', v)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select an audio file..." />
                    </SelectTrigger>
                    <SelectContent>
                        {mediaLibrary.map((media: any) => (
                            <SelectItem key={media.id} value={media.id}>{media.name}</SelectItem>
                        ))}
                        {mediaLibrary.length === 0 && (
                            <SelectItem value="none" disabled>No media files found</SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>
        )}

        {node.data.config?.audioSource === 'upload' && (
            <div>
                <Label>Upload Audio File</Label>
                {/* Assuming a FileUpload component exists or a simple input for now */}
                <Input type="file" onChange={(e) => console.log('File selected:', e.target.files?.[0])} />
                <p className="text-xs text-muted-foreground mt-1">Max 5MB, MP3 or WAV format.</p>
            </div>
        )}
    </div>
);

const GatherInputConfig = ({ node, updateConfig }: any) => (
    <div className="space-y-4">
        <div>
            <Label>Number of Digits</Label>
            <Input
                type="number"
                min={1}
                max={20}
                value={node.data.config?.numDigits || 1}
                onChange={(e) => updateConfig('numDigits', parseInt(e.target.value))}
            />
        </div>
        <div>
            <Label>Timeout (seconds)</Label>
            <Input
                type="number"
                min={1}
                max={60}
                value={node.data.config?.timeout || 5}
                onChange={(e) => updateConfig('timeout', parseInt(e.target.value))}
            />
        </div>
        <div>
            <Label>Finish on Key</Label>
            <Select value={node.data.config?.finishOnKey || '#'} onValueChange={(v) => updateConfig('finishOnKey', v)}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="#"># (Hash)</SelectItem>
                    <SelectItem value="*">* (Star)</SelectItem>
                    <SelectItem value="">None</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Prompt Message</Label>
            <Textarea
                placeholder="Please enter your selection..."
                value={node.data.config?.prompt || ''}
                onChange={(e) => updateConfig('prompt', e.target.value)}
                rows={3}
            />
        </div>
        <div className="flex items-center justify-between">
            <Label>Allow Speech Input</Label>
            <Switch checked={node.data.config?.allowSpeech || false} onCheckedChange={(v) => updateConfig('allowSpeech', v)} />
        </div>
    </div>
);

const ForwardCallConfig = ({ node, updateConfig, agents, phoneNumbers }: any) => (
    <div className="space-y-4">
        <div>
            <Label>Forward To</Label>
            <Select value={node.data.config?.forwardType || 'number'} onValueChange={(v) => updateConfig('forwardType', v)}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="number">Phone Number</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="queue">Call Queue</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Destination</Label>
            {node.data.config?.forwardType === 'agent' ? (
                <Select value={node.data.config?.destination || ''} onValueChange={(v) => updateConfig('destination', v)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select agent..." />
                    </SelectTrigger>
                    <SelectContent>
                        {agents.map((agent: any) => (
                            <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : node.data.config?.forwardType === 'number' ? (
                <Input
                    placeholder="+1 555 123 4567"
                    value={node.data.config?.destination || ''}
                    onChange={(e) => updateConfig('destination', e.target.value)}
                />
            ) : (
                <Input
                    placeholder="Queue/Dept Name"
                    value={node.data.config?.destination || ''}
                    onChange={(e) => updateConfig('destination', e.target.value)}
                />
            )}
        </div>
        <div>
            <Label>Timeout (seconds)</Label>
            <Input
                type="number"
                min={5}
                max={120}
                value={node.data.config?.timeout || 30}
                onChange={(e) => updateConfig('timeout', parseInt(e.target.value))}
            />
        </div>
        <div className="flex items-center justify-between">
            <Label>Record Call</Label>
            <Switch checked={node.data.config?.record || false} onCheckedChange={(v) => updateConfig('record', v)} />
        </div>
        <div className="flex items-center justify-between">
            <Label>Whisper Message</Label>
            <Switch checked={node.data.config?.whisper || false} onCheckedChange={(v) => updateConfig('whisper', v)} />
        </div>
        {node.data.config?.whisper && (
            <div>
                <Label>Whisper Text</Label>
                <Input
                    placeholder="Call from customer..."
                    value={node.data.config?.whisperText || ''}
                    onChange={(e) => updateConfig('whisperText', e.target.value)}
                />
            </div>
        )}
        <div className="flex items-center justify-between">
            <Label>Caller ID Passthrough</Label>
            <Switch checked={node.data.config?.callerIdPassthrough || true} onCheckedChange={(v) => updateConfig('callerIdPassthrough', v)} />
        </div>
    </div>
);

const TimeCheckConfig = ({ node, updateConfig }: any) => (
    <div className="space-y-4">
        <div>
            <Label>Timezone</Label>
            <Select value={node.data.config?.timezone || 'America/New_York'} onValueChange={(v) => updateConfig('timezone', v)}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="America/Phoenix">Arizona Time (MST)</SelectItem>
                    <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                    <SelectItem value="Pacific/Honolulu">Hawaii Time (HST)</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div>
                <Label>Start Time</Label>
                <Input
                    type="time"
                    value={node.data.config?.startTime || '09:00'}
                    onChange={(e) => updateConfig('startTime', e.target.value)}
                />
            </div>
            <div>
                <Label>End Time</Label>
                <Input
                    type="time"
                    value={node.data.config?.endTime || '17:00'}
                    onChange={(e) => updateConfig('endTime', e.target.value)}
                />
            </div>
        </div>
        <div>
            <Label>Active Days</Label>
            <div className="flex gap-1 mt-2">
                {[
                    { label: 'M', value: 1 },
                    { label: 'T', value: 2 },
                    { label: 'W', value: 3 },
                    { label: 'T', value: 4 },
                    { label: 'F', value: 5 },
                    { label: 'S', value: 6 },
                    { label: 'S', value: 0 },
                ].map((day, i) => {
                    const activeDays = node.data.config?.activeDays || [1, 2, 3, 4, 5];
                    const isActive = activeDays.includes(day.value);
                    return (
                        <Button
                            key={i}
                            size="sm"
                            variant={isActive ? 'default' : 'outline'}
                            className="w-10 h-10 p-0"
                            onClick={() => {
                                const newDays = isActive
                                    ? activeDays.filter((d: number) => d !== day.value)
                                    : [...activeDays, day.value];
                                updateConfig('activeDays', newDays);
                            }}
                        >
                            {day.label}
                        </Button>
                    );
                })}
            </div>
        </div>
        <div className="flex items-center justify-between">
            <Label>Include Holidays</Label>
            <Switch checked={node.data.config?.includeHolidays || false} onCheckedChange={(v) => updateConfig('includeHolidays', v)} />
        </div>
    </div>
);

const SendSMSConfig = ({ node, updateConfig, phoneNumbers }: any) => (
    <div className="space-y-4">
        <div>
            <Label>Recipient</Label>
            <Select value={node.data.config?.recipient || 'caller'} onValueChange={(v) => updateConfig('recipient', v)}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="caller">Caller's Number</SelectItem>
                    <SelectItem value="custom">Custom Number</SelectItem>
                    <SelectItem value="field">From CRM Field</SelectItem>
                </SelectContent>
            </Select>
        </div>
        {node.data.config?.recipient === 'custom' && (
            <div>
                <Label>Phone Number</Label>
                <Input
                    placeholder="+1 555 123 4567"
                    value={node.data.config?.customNumber || ''}
                    onChange={(e) => updateConfig('customNumber', e.target.value)}
                />
            </div>
        )}
        <div>
            <Label>Message</Label>
            <Textarea
                placeholder="Your message here..."
                value={node.data.config?.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
                Use variables: {'{caller_name}'}, {'{caller_number}'}, {'{date}'}, {'{time}'}
            </p>
        </div>
        <div>
            <Label>From Number</Label>
            <Select value={node.data.config?.fromNumber || 'auto'} onValueChange={(v) => updateConfig('fromNumber', v)}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="auto">Auto-select</SelectItem>
                    {phoneNumbers.map((n: any) => (
                        <SelectItem key={n.id} value={n.phone_number}>{n.phone_number}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    </div>
);

const AIAgentConfig = ({ node, updateConfig, aiAgents }: any) => (
    <div className="space-y-4">
        <div>
            <Label>AI Agent</Label>
            <Select value={node.data.config?.agentId || ''} onValueChange={(v) => updateConfig('agentId', v)}>
                <SelectTrigger>
                    <SelectValue placeholder="Select AI agent..." />
                </SelectTrigger>
                <SelectContent>
                    {aiAgents.map((agent: any) => (
                        <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                    ))}
                    {aiAgents.length === 0 && (
                        <SelectItem value="none" disabled>No AI agents found</SelectItem>
                    )}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Initial Greeting</Label>
            <Textarea
                placeholder="Hello! How can I help you today?"
                value={node.data.config?.greeting || ''}
                onChange={(e) => updateConfig('greeting', e.target.value)}
                rows={3}
            />
        </div>
        <div>
            <Label>Max Duration (minutes)</Label>
            <Input
                type="number"
                min={1}
                max={30}
                value={node.data.config?.maxDuration || 10}
                onChange={(e) => updateConfig('maxDuration', parseInt(e.target.value))}
            />
        </div>
        <div className="flex items-center justify-between">
            <Label>Transfer to Human</Label>
            <Switch checked={node.data.config?.allowTransfer || true} onCheckedChange={(v) => updateConfig('allowTransfer', v)} />
        </div>
        <div className="flex items-center justify-between">
            <Label>Record Conversation</Label>
            <Switch checked={node.data.config?.record || true} onCheckedChange={(v) => updateConfig('record', v)} />
        </div>
    </div>
);

const WebhookConfig = ({ node, updateConfig }: any) => (
    <div className="space-y-4">
        <div>
            <Label>Webhook URL</Label>
            <Input
                placeholder="https://api.example.com/webhook"
                value={node.data.config?.url || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
            />
        </div>
        <div>
            <Label>Method</Label>
            <Select value={node.data.config?.method || 'POST'} onValueChange={(v) => updateConfig('method', v)}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Headers (JSON)</Label>
            <Textarea
                placeholder='{"Authorization": "Bearer token"}'
                value={node.data.config?.headers || ''}
                onChange={(e) => updateConfig('headers', e.target.value)}
                rows={3}
            />
        </div>
        <div>
            <Label>Payload (JSON)</Label>
            <Textarea
                placeholder='{"caller": "{caller_number}"}'
                value={node.data.config?.payload || ''}
                onChange={(e) => updateConfig('payload', e.target.value)}
                rows={4}
            />
        </div>
        <div>
            <Label>Timeout (seconds)</Label>
            <Input
                type="number"
                min={1}
                max={30}
                value={node.data.config?.timeout || 10}
                onChange={(e) => updateConfig('timeout', parseInt(e.target.value))}
            />
        </div>
    </div>
);

const VoicemailConfig = ({ node, updateConfig }: any) => (
    <div className="space-y-4">
        <div>
            <Label>Greeting Message</Label>
            <Textarea
                placeholder="Please leave a message after the beep..."
                value={node.data.config?.greeting || ''}
                onChange={(e) => updateConfig('greeting', e.target.value)}
                rows={3}
            />
        </div>
        <div>
            <Label>Max Recording Length (seconds)</Label>
            <Input
                type="number"
                min={10}
                max={300}
                value={node.data.config?.maxDuration || 60}
                onChange={(e) => updateConfig('maxDuration', parseInt(e.target.value))}
            />
        </div>
        <div className="flex items-center justify-between">
            <Label>Transcribe Voicemail</Label>
            <Switch checked={node.data.config?.transcribe || false} onCheckedChange={(v) => updateConfig('transcribe', v)} />
        </div>
        <div className="flex items-center justify-between">
            <Label>Send Slack Notification</Label>
            <Switch checked={node.data.config?.notifySlack || false} onCheckedChange={(v) => updateConfig('notifySlack', v)} />
        </div>
    </div>
);

const QueueCallConfig = ({ node, updateConfig }: any) => (
    <div className="space-y-4">
        <div>
            <Label>Queue Name</Label>
            <Input
                placeholder="Support Queue"
                value={node.data.config?.queueName || ''}
                onChange={(e) => updateConfig('queueName', e.target.value)}
            />
        </div>
        <div>
            <Label>Wait Music</Label>
            <Select value={node.data.config?.waitMusic || 'default'} onValueChange={(v) => updateConfig('waitMusic', v)}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="default">Default Hold Music</SelectItem>
                    <SelectItem value="classical">Classical</SelectItem>
                    <SelectItem value="jazz">Smooth Jazz</SelectItem>
                    <SelectItem value="nature">Nature Sounds</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Max Queue Size</Label>
            <Input
                type="number"
                value={node.data.config?.maxSize || 0}
                onChange={(e) => updateConfig('maxSize', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground mt-1">0 = Unlimited</p>
        </div>
    </div>
);

// Conference Call Config
const ConferenceCallConfig = ({ node, updateConfig }: any) => (
    <div className="space-y-4">
        <div>
            <Label>Conference Name</Label>
            <Input
                placeholder="Daily Standup"
                value={node.data.config?.roomName || ''}
                onChange={(e) => updateConfig('roomName', e.target.value)}
            />
        </div>
        <div className="flex items-center justify-between">
            <Label>Mute on Entry</Label>
            <Switch checked={node.data.config?.muteOnEntry || false} onCheckedChange={(v) => updateConfig('muteOnEntry', v)} />
        </div>
        <div className="flex items-center justify-between">
            <Label>Record Conference</Label>
            <Switch checked={node.data.config?.record || false} onCheckedChange={(v) => updateConfig('record', v)} />
        </div>
        <div className="flex items-center justify-between">
            <Label>Beep on Enter/Exit</Label>
            <Switch checked={node.data.config?.beep || true} onCheckedChange={(v) => updateConfig('beep', v)} />
        </div>
    </div>
);

// Menu Option Config
const MenuOptionConfig = ({ node, updateConfig }: any) => (
    <div className="space-y-4">
        <div>
            <Label>Menu Prompt</Label>
            <Textarea
                placeholder="For sales, press 1. For support, press 2."
                value={node.data.config?.prompt || ''}
                onChange={(e) => updateConfig('prompt', e.target.value)}
                rows={3}
            />
        </div>
        <div>
            <Label>Options</Label>
            <div className="space-y-2 mt-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, '*', '#'].map((digit) => {
                    const options = node.data.config?.options || [];
                    const isActive = options.includes(digit.toString());
                    return (
                        <div key={digit} className="flex items-center justify-between p-2 border rounded-md">
                            <span className="font-bold">Digit {digit}</span>
                            <Switch
                                checked={isActive}
                                onCheckedChange={(v) => {
                                    const nextOptions = v
                                        ? [...options, digit.toString()]
                                        : options.filter((o: string) => o !== digit.toString());
                                    updateConfig('options', nextOptions);
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
);

// Caller ID Check Config
const CallerIdCheckConfig = ({ node, updateConfig }: any) => (
    <div className="space-y-4">
        <div>
            <Label>Check Type</Label>
            <Select value={node.data.config?.checkType || 'whitelist'} onValueChange={(v) => updateConfig('checkType', v)}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="whitelist">Whitelist Check</SelectItem>
                    <SelectItem value="blacklist">Blacklist Check</SelectItem>
                    <SelectItem value="vip">VIP Status Check</SelectItem>
                    <SelectItem value="crm">CRM Match Check</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Phone Numbers (comma separated)</Label>
            <Textarea
                placeholder="+15551234567, +15559876543"
                value={node.data.config?.numbers || ''}
                onChange={(e) => updateConfig('numbers', e.target.value)}
                rows={3}
            />
        </div>
    </div>
);

const TagCallConfig = ({ node, updateConfig, tags }: any) => (
    <div className="space-y-4">
        <div>
            <Label>Select Tag</Label>
            <Select value={node.data.config?.tagId || ''} onValueChange={(v) => updateConfig('tagId', v)}>
                <SelectTrigger>
                    <SelectValue placeholder="Choose a tag..." />
                </SelectTrigger>
                <SelectContent>
                    {tags.map((t: any) => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Or Custom Metadata</Label>
            <Input
                placeholder="Key:Value"
                value={node.data.config?.metadata || ''}
                onChange={(e) => updateConfig('metadata', e.target.value)}
            />
        </div>
    </div>
);

const UpdateCRMConfig = ({ node, updateConfig, pipelines }: any) => (
    <div className="space-y-4">
        <div>
            <Label>Update Field</Label>
            <Select value={node.data.config?.field || 'status'} onValueChange={(v) => updateConfig('field', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="status">Contact Status</SelectItem>
                    <SelectItem value="stage">Pipeline Stage</SelectItem>
                    <SelectItem value="note">Add Note</SelectItem>
                </SelectContent>
            </Select>
        </div>
        {node.data.config?.field === 'stage' && (
            <div>
                <Label>New Stage</Label>
                <Select value={node.data.config?.value || ''} onValueChange={(v) => updateConfig('value', v)}>
                    <SelectTrigger><SelectValue placeholder="Select stage..." /></SelectTrigger>
                    <SelectContent>
                        {pipelines.flatMap((p: any) => p.stages || []).map((s: any) => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}
    </div>
);

// Send Email Config
const SendEmailConfig = ({ node, updateConfig }: any) => (
    <div className="space-y-4">
        <div>
            <Label>To Email</Label>
            <Input
                placeholder="agent@example.com"
                value={node.data.config?.to || ''}
                onChange={(e) => updateConfig('to', e.target.value)}
            />
        </div>
        <div>
            <Label>Subject</Label>
            <Input
                placeholder="New Call Notification"
                value={node.data.config?.subject || ''}
                onChange={(e) => updateConfig('subject', e.target.value)}
            />
        </div>
        <div>
            <Label>Message Body</Label>
            <Textarea
                placeholder="You have a new call from {caller_number}..."
                value={node.data.config?.body || ''}
                onChange={(e) => updateConfig('body', e.target.value)}
                rows={4}
            />
        </div>
    </div>
);

// Integration Config (Salesforce, HubSpot, etc.)
const IntegrationConfig = ({ node, updateConfig }: any) => (
    <div className="space-y-4">
        <div className="p-3 bg-muted rounded-md flex items-center gap-3">
            <Info className="h-5 w-5 text-primary" />
            <div className="text-xs">
                Ensure your {node.data.label} account is connected in Settings {'>'} Connections.
            </div>
        </div>
        <div>
            <Label>Action</Label>
            <Select value={node.data.config?.action || 'sync'} onValueChange={(v) => updateConfig('action', v)}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="sync">Sync Contact</SelectItem>
                    <SelectItem value="ticket">Create Ticket/Case</SelectItem>
                    <SelectItem value="lead">Create Lead</SelectItem>
                    <SelectItem value="activity">Log Activity</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Mapping Rules (Advanced)</Label>
            <Textarea
                placeholder='{"crm_field": "ivr_field"}'
                value={node.data.config?.mapping || ''}
                onChange={(e) => updateConfig('mapping', e.target.value)}
                rows={3}
            />
        </div>
    </div>
);

// ============================================
// SIGNALWIRE SWML CODE GENERATOR
// ============================================

const generateSignalWireCode = (nodes: Node[], edges: Edge[]): string => {
    const swml: any = {
        version: '1.0.0',
        sections: {
            main: []
        }
    };

    // Build node map for quick lookup
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Find start node (trigger)
    const triggerNode = nodes.find(n => n.type === 'trigger');
    if (!triggerNode) {
        return JSON.stringify(swml, null, 2);
    }

    // Process nodes in order
    const processNode = (node: Node): any[] => {
        const verbs: any[] = [];
        const config = node.data.config || {};

        switch (node.data.type) {
            case 'play_audio':
                if (config.audioType === 'tts') {
                    verbs.push({
                        say: {
                            text: config.message || '',
                            voice: config.voice || 'en-US-Neural2-F',
                            language: config.language || 'en-US'
                        }
                    });
                } else {
                    verbs.push({
                        play: {
                            url: config.audioUrl || ''
                        }
                    });
                }
                break;

            case 'gather_input':
                verbs.push({
                    gather: {
                        input: config.allowSpeech ? ['digits', 'speech'] : ['digits'],
                        num_digits: parseInt(config.numDigits) || 1,
                        timeout: parseInt(config.timeout) || 5,
                        finish_on_key: config.finishOnKey || '#',
                        say: {
                            text: config.prompt || 'Please enter your selection'
                        }
                    }
                });
                break;

            case 'forward_call':
            case 'transfer_call':
                const dialConfig: any = {
                    to: config.destination || '',
                    timeout: parseInt(config.timeout) || 30
                };
                if (config.record) dialConfig.record = true;
                if (config.whisper && config.whisperText) {
                    dialConfig.whisper = { text: config.whisperText };
                }
                if (config.callerIdType === 'custom' && config.customCallerId) {
                    dialConfig.caller_id = config.customCallerId;
                }
                verbs.push({ dial: dialConfig });
                break;

            case 'record_voicemail':
                verbs.push({
                    say: {
                        text: config.greeting || 'Please leave a message after the beep.'
                    }
                });
                verbs.push({
                    record: {
                        max_length: parseInt(config.maxLength) || 120,
                        beep: true,
                        transcribe: config.transcribe || true
                    }
                });
                break;

            case 'queue_call':
                verbs.push({
                    queue: {
                        name: config.queueName || 'default',
                        music_on_hold: config.waitMusic || 'default',
                        max_size: parseInt(config.maxSize) || 100
                    }
                });
                break;

            case 'send_sms':
                verbs.push({
                    send_sms: {
                        to: config.recipient === 'caller' ? '${call.from}' : config.customNumber,
                        from: config.fromNumber === 'auto' ? '${call.to}' : config.fromNumber,
                        body: config.message || ''
                    }
                });
                break;

            case 'hangup':
                verbs.push({ hangup: {} });
                break;

            case 'time_check':
                verbs.push({
                    _comment: `Business hours check: ${config.startTime || '09:00'} - ${config.endTime || '17:00'}, timezone: ${config.timezone || 'America/New_York'}`
                });
                break;

            case 'ai_agent':
                verbs.push({
                    ai: {
                        agent_id: config.agentId || '',
                        greeting: config.greeting || 'Hello, how can I help you?',
                        max_duration: (parseInt(config.maxDuration) || 10) * 60
                    }
                });
                break;

            case 'tag_call':
                verbs.push({
                    _comment: `Action: Tag Call with tag ID ${config.tagId || 'none'}`,
                    // In a real implementation, this might trigger a webhook or server-side logic
                });
                break;

            case 'update_crm':
                verbs.push({
                    _comment: `Action: Update CRM ${config.field} to ${config.value}`,
                });
                break;

            case 'webhook':
                verbs.push({
                    request: {
                        url: config.url || '',
                        method: config.method || 'POST',
                        headers: config.headers ? JSON.parse(config.headers) : {},
                        body: config.payload || '{}'
                    }
                });
                break;

            case 'conference_call':
                verbs.push({
                    conference: {
                        name: config.roomName || 'conference',
                        muted: config.muteOnEntry || false,
                        record: config.record || false,
                        beep: config.beep || 'true'
                    }
                });
                break;

            case 'play_music':
                verbs.push({
                    play: {
                        url: 'https://cdn.signalwire.com/default/music/hold.mp3'
                    }
                });
                break;

            default:
                verbs.push({ _comment: `Node type: ${node.data.type}` });
        }

        return verbs;
    };

    // Traverse nodes from trigger
    const visited = new Set<string>();
    const queue = [triggerNode.id];

    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);

        const node = nodeMap.get(nodeId);
        if (!node) continue;

        // Add verbs for this node
        const verbs = processNode(node);
        swml.sections.main.push(...verbs);

        // Find connected nodes
        const outgoingEdges = edges.filter(e => e.source === nodeId);
        outgoingEdges.forEach(edge => {
            queue.push(edge.target);
        });
    }

    return JSON.stringify(swml, null, 2);
};

// ============================================
// MAIN COMPONENT
// ============================================

interface CallFlow {
    id?: number;
    name: string;
    description: string;
    phone_number_id?: number;
    nodes: Node[];
    edges: Edge[];
    status: 'draft' | 'active' | 'paused';
}

const initialNodes: Node[] = [
    {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 400, y: 50 },
        data: { label: 'Incoming Call', type: 'incoming_call', icon: PhoneCall, config: {} },
    },
];

const initialEdges: Edge[] = [];

function CallFlowBuilderInner() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [flowName, setFlowName] = useState('Untitled Call Routing');
    const [flowDescription, setFlowDescription] = useState('');
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [isNodePanelOpen, setIsNodePanelOpen] = useState(true);
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Dynamic Data State
    const [aiAgents, setAiAgents] = useState<any[]>([]);
    const [callAgents, setCallAgents] = useState<any[]>([]);
    const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
    const [scripts, setScripts] = useState<any[]>([]);
    const [contactLists, setContactLists] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [pipelines, setPipelines] = useState<any[]>([]);
    const [mediaLibrary, setMediaLibrary] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Load common data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                const [
                    agentsRes,
                    callAgentsRes,
                    numbersRes,
                    scriptsRes,
                    listsRes,
                    tagsRes,
                    pipelinesRes
                ] = await Promise.all([
                    api.get('/ai/agents').catch(() => ({ items: [] })),
                    api.get('/calls/agents').catch(() => ({ items: [] })),
                    api.get('/phone-numbers').catch(() => ({ items: [] })),
                    api.get('/calls/scripts').catch(() => ({ data: [] })),
                    api.get('/lists').catch(() => ({ lists: [] })),
                    api.get('/tags').catch(() => []),
                    api.get('/pipelines').catch(() => ({ items: [] }))
                ]);

                setAiAgents(agentsRes?.items || []);
                setCallAgents(callAgentsRes?.items || []);
                setPhoneNumbers(numbersRes?.items || []);
                setScripts(Array.isArray(scriptsRes) ? scriptsRes : (scriptsRes?.data || []));
                setContactLists(listsRes?.lists || []);
                setTags(Array.isArray(tagsRes) ? tagsRes : []);
                setPipelines(pipelinesRes?.items || pipelinesRes || []);
            } catch (error) {
                console.error('Failed to fetch dynamic data:', error);
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchData();
    }, []);

    // Load existing flow
    useEffect(() => {
        if (id && id !== 'new') {
            loadFlow(id);
        }
    }, [id]);

    const loadFlow = async (flowId: string) => {
        try {
            const response = await api.get(`/call-flows/${flowId}`);
            const flow = response.data as CallFlow;
            setFlowName(flow.name);
            setFlowDescription(flow.description || '');
            if (flow.nodes?.length) setNodes(flow.nodes);
            if (flow.edges?.length) setEdges(flow.edges);
        } catch (error) {
            console.error('Failed to load call flow:', error);
            toast.error('Failed to load call routing');
        }
    };

    const onConnect = useCallback(
        (params: Connection) => {
            setEdges((eds) =>
                addEdge(
                    {
                        ...params,
                        type: 'smoothstep',
                        animated: true,
                        markerEnd: { type: MarkerType.ArrowClosed },
                    },
                    eds
                )
            );
        },
        [setEdges]
    );

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
        setIsConfigPanelOpen(true);
    }, []);

    // Get ReactFlow instance for coordinate conversion
    const reactFlowInstance = useReactFlow();

    // Drag and drop handlers
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const nodeType = event.dataTransfer.getData('application/reactflow-nodetype');
            const category = event.dataTransfer.getData('application/reactflow-category') as 'triggers' | 'actions' | 'conditions' | 'integrations';

            if (!nodeType || !category) return;

            const nodeConfig = CALL_FLOW_NODES[category].find((n) => n.id === nodeType);
            if (!nodeConfig) return;

            const typeMap: Record<string, string> = {
                triggers: 'trigger',
                conditions: 'condition',
                integrations: 'integration',
                actions: 'action',
            };

            // Get the position where the node was dropped
            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: `${category.slice(0, -1)}-${Date.now()}`,
                type: typeMap[category],
                position,
                data: {
                    label: nodeConfig.name,
                    type: nodeType,
                    icon: nodeConfig.icon,
                    config: {},
                },
            };

            setNodes((nds) => [...nds, newNode]);
            toast.success(`Added ${nodeConfig.name}`);
        },
        [reactFlowInstance, setNodes]
    );

    const onDragStart = (event: React.DragEvent, nodeType: string, category: 'triggers' | 'actions' | 'conditions' | 'integrations') => {
        event.dataTransfer.setData('application/reactflow-nodetype', nodeType);
        event.dataTransfer.setData('application/reactflow-category', category);
        event.dataTransfer.effectAllowed = 'move';
    };


    const addNode = useCallback(
        (nodeType: string, category: 'triggers' | 'actions' | 'conditions' | 'integrations') => {
            const nodeConfig = CALL_FLOW_NODES[category].find((n) => n.id === nodeType);
            if (!nodeConfig) return;

            const typeMap: Record<string, string> = {
                triggers: 'trigger',
                conditions: 'condition',
                integrations: 'integration',
                actions: 'action',
            };

            const newNode: Node = {
                id: `${category.slice(0, -1)}-${Date.now()}`,
                type: typeMap[category],
                position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 200 },
                data: {
                    label: nodeConfig.name,
                    type: nodeType,
                    icon: nodeConfig.icon,
                    config: {},
                },
            };

            setNodes((nds) => [...nds, newNode]);
            toast.success(`Added ${nodeConfig.name}`);
        },
        [setNodes]
    );

    const deleteSelectedNode = useCallback(() => {
        if (!selectedNode) return;
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
        setSelectedNode(null);
        setIsConfigPanelOpen(false);
        toast.success('Node deleted');
    }, [selectedNode, setNodes, setEdges]);

    const updateNodeConfig = useCallback((key: string, value: any) => {
        if (!selectedNode) return;
        setNodes((nds) =>
            nds.map((n) =>
                n.id === selectedNode.id
                    ? {
                        ...n,
                        data: {
                            ...n.data,
                            config: { ...n.data.config, [key]: value },
                        },
                    }
                    : n
            )
        );
        setSelectedNode((prev) =>
            prev
                ? {
                    ...prev,
                    data: {
                        ...prev.data,
                        config: { ...prev.data.config, [key]: value },
                    },
                }
                : null
        );
    }, [selectedNode, setNodes]);

    const saveFlow = async () => {
        setIsSaving(true);
        try {
            const flowData: CallFlow = {
                name: flowName,
                description: flowDescription,
                nodes,
                edges,
                status: 'draft',
            };

            if (id && id !== 'new') {
                await api.put(`/call-flows/${id}`, flowData);
                toast.success('Call routing updated successfully');
            } else {
                const response = await api.post('/call-flows', flowData);
                toast.success('Call routing created successfully');
                navigate(`/reach/inbound/calls/flows/${(response.data as any).id}`);
            }
        } catch (error) {
            console.error('Failed to save call flow:', error);
            toast.error('Failed to save call routing');
        } finally {
            setIsSaving(false);
        }
    };

    const renderNodeConfig = () => {
        if (!selectedNode) return null;

        const configProps = {
            node: selectedNode,
            updateConfig: updateNodeConfig,
        };

        switch (selectedNode.data.type) {
            case 'play_audio':
                return <PlayAudioConfig {...configProps} mediaLibrary={mediaLibrary} />;
            case 'gather_input':
                return <GatherInputConfig {...configProps} />;
            case 'forward_call':
            case 'transfer_call':
                return <ForwardCallConfig {...configProps} agents={callAgents} phoneNumbers={phoneNumbers} />;
            case 'time_check':
            case 'time_of_day':
            case 'day_of_week':
            case 'holiday_check':
                return <TimeCheckConfig {...configProps} />;
            case 'send_sms':
                return <SendSMSConfig {...configProps} phoneNumbers={phoneNumbers} />;
            case 'ai_agent':
                return <AIAgentConfig {...configProps} aiAgents={aiAgents} />;
            case 'webhook':
                return <WebhookConfig {...configProps} />;
            case 'record_voicemail':
                return <VoicemailConfig {...configProps} />;
            case 'queue_call':
                return <QueueCallConfig {...configProps} />;
            case 'conference_call':
                return <ConferenceCallConfig {...configProps} />;
            case 'menu_option':
                return <MenuOptionConfig {...configProps} />;
            case 'caller_id_check':
            case 'vip_check':
                return <CallerIdCheckConfig {...configProps} />;
            case 'tag_call':
                return <TagCallConfig {...configProps} tags={tags} />;
            case 'update_crm':
                return <UpdateCRMConfig {...configProps} pipelines={pipelines} />;
            case 'send_email':
                return <SendEmailConfig {...configProps} />;
            case 'salesforce':
            case 'hubspot':
            case 'zendesk':
                return <IntegrationConfig {...configProps} />;
            default:
                return (
                    <div className="text-sm text-muted-foreground">
                        <Info className="h-4 w-4 inline mr-2" />
                        No additional configuration needed for this node.
                    </div>
                );
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <Input
                            value={flowName}
                            onChange={(e) => setFlowName(e.target.value)}
                            className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0 w-[300px]"
                            placeholder="Flow Name"
                        />
                        <Input
                            value={flowDescription}
                            onChange={(e) => setFlowDescription(e.target.value)}
                            className="text-sm text-muted-foreground border-none p-0 h-auto focus-visible:ring-0 w-[300px]"
                            placeholder="Add description..."
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                        {nodes.length} nodes
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        {edges.length} connections
                    </Badge>
                    <Badge variant="secondary">Draft</Badge>
                    <Button variant="outline" size="sm" onClick={() => setIsNodePanelOpen(!isNodePanelOpen)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Node
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const swmlCode = generateSignalWireCode(nodes, edges);
                            navigator.clipboard.writeText(swmlCode);
                            toast.success('SignalWire SWML code copied to clipboard!');
                            console.log('Generated SWML:', swmlCode);
                        }}
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        Export SWML
                    </Button>
                    <Button onClick={saveFlow} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Flow'}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Node Palette */}
                {isNodePanelOpen && (
                    <div className="w-72 border-r bg-muted/30 overflow-auto">
                        <ScrollArea className="h-full">
                            <div className="p-4">
                                <Tabs defaultValue="actions" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="actions">Actions</TabsTrigger>
                                        <TabsTrigger value="conditions">Logic</TabsTrigger>
                                        <TabsTrigger value="integrations">Apps</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="actions" className="space-y-3 mt-4">
                                        <div className="space-y-1">
                                            {CALL_FLOW_NODES.actions.map((node) => (
                                                <div
                                                    key={node.id}
                                                    onClick={() => addNode(node.id, 'actions')}
                                                    draggable
                                                    onDragStart={(e) => onDragStart(e, node.id, 'actions')}
                                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors border border-transparent hover:border-blue-200 cursor-grab active:cursor-grabbing"
                                                >
                                                    <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900">
                                                        <node.icon className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm">{node.name}</div>
                                                        <div className="text-xs text-muted-foreground">{node.description}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="conditions" className="space-y-3 mt-4">
                                        <div className="space-y-1">
                                            {CALL_FLOW_NODES.conditions.map((node) => (
                                                <div
                                                    key={node.id}
                                                    onClick={() => addNode(node.id, 'conditions')}
                                                    draggable
                                                    onDragStart={(e) => onDragStart(e, node.id, 'conditions')}
                                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors border border-transparent hover:border-amber-200 cursor-grab active:cursor-grabbing"
                                                >
                                                    <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900">
                                                        <node.icon className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm">{node.name}</div>
                                                        <div className="text-xs text-muted-foreground">{node.description}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="integrations" className="space-y-3 mt-4">
                                        <div className="space-y-1">
                                            {CALL_FLOW_NODES.integrations.map((node) => (
                                                <div
                                                    key={node.id}
                                                    onClick={() => addNode(node.id, 'integrations')}
                                                    draggable
                                                    onDragStart={(e) => onDragStart(e, node.id, 'integrations')}
                                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors border border-transparent hover:border-indigo-200 cursor-grab active:cursor-grabbing"
                                                >
                                                    <div className="p-2 rounded-md bg-indigo-100 dark:bg-indigo-900">
                                                        <node.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm">{node.name}</div>
                                                        <div className="text-xs text-muted-foreground">{node.description}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </ScrollArea>
                    </div>
                )}

                {/* Flow Canvas */}
                <div ref={reactFlowWrapper} className="flex-1 bg-muted/10">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        fitView
                        snapToGrid
                        snapGrid={[15, 15]}
                        defaultEdgeOptions={{
                            type: 'smoothstep',
                            animated: true,
                            markerEnd: { type: MarkerType.ArrowClosed },
                        }}
                    >
                        <Background gap={20} size={1} />
                        <Controls />
                        <MiniMap
                            nodeStrokeColor={(n) => {
                                if (n.type === 'trigger') return '#22c55e';
                                if (n.type === 'condition') return '#f59e0b';
                                if (n.type === 'integration') return '#6366f1';
                                return '#3b82f6';
                            }}
                            nodeColor={(n) => {
                                if (n.type === 'trigger') return '#dcfce7';
                                if (n.type === 'condition') return '#fef3c7';
                                if (n.type === 'integration') return '#e0e7ff';
                                return '#dbeafe';
                            }}
                            className="!bg-background"
                        />
                    </ReactFlow>
                </div>

                {/* Config Panel */}
                {isConfigPanelOpen && selectedNode && (
                    <div className="w-96 border-l bg-background overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                            <div className="flex items-center gap-2">
                                {selectedNode.data.icon && (
                                    <div className="p-2 rounded-md bg-primary/10">
                                        <selectedNode.data.icon className="h-4 w-4 text-primary" />
                                    </div>
                                )}
                                <h3 className="font-semibold">Configure Node</h3>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsConfigPanelOpen(false)}>
                                <XCircle className="h-4 w-4" />
                            </Button>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-4">
                                <div>
                                    <Label>Node Label</Label>
                                    <Input
                                        value={selectedNode.data.label}
                                        onChange={(e) => {
                                            setNodes((nds) =>
                                                nds.map((n) =>
                                                    n.id === selectedNode.id
                                                        ? { ...n, data: { ...n.data, label: e.target.value } }
                                                        : n
                                                )
                                            );
                                            setSelectedNode((prev) =>
                                                prev ? { ...prev, data: { ...prev.data, label: e.target.value } } : null
                                            );
                                        }}
                                    />
                                </div>

                                <Separator />

                                {renderNodeConfig()}

                                <Separator className="my-6" />

                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={deleteSelectedNode}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Node
                                </Button>
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CallFlowBuilder() {
    return (
        <ReactFlowProvider>
            <CallFlowBuilderInner />
        </ReactFlowProvider>
    );
}

