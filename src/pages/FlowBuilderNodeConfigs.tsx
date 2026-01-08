import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2, Code, Variable, Globe, Trash2, Play, AlertTriangle, Send, Plus, X } from 'lucide-react';

// Type definitions
interface FlowNode {
    id: string;
    type: 'trigger' | 'action' | 'condition' | 'delay' | 'split';
    subType: string;
    position: { x: number; y: number };
    data: Record<string, any>;
    connections: string[];
}

interface NodeConfigProps {
    node: FlowNode;
    updateData: (key: string, value: any) => void;
    templates?: { id: number; name: string; type: string; subject?: string }[];
    forms?: { id: number; name: string }[];
    campaigns?: { id: number; name: string; type: string; status?: string }[];
    tags?: string[];
    sendingAccounts?: { id: number; name: string; email: string }[];
    lists?: { id: number; name: string; count?: number }[];
    sequences?: { id: number; name: string; type: string }[];
    users?: { id: number; name: string; email: string }[];
    callScripts?: { id: number; name: string }[];
    landingPages?: { id: number; name: string; url?: string }[];
    flowNodes?: FlowNode[];
    onAIClick?: (target: string) => void;
}

// ==================== TRIGGER CONFIGS ====================

export const ContactAddedConfig: React.FC<NodeConfigProps> = ({ node, updateData, tags, lists }) => (
    <div className="space-y-4">
        <div>
            <Label>Trigger When</Label>
            <Select value={node.data.source || 'any'} onValueChange={(v) => updateData('source', v)}>
                <SelectTrigger><SelectValue placeholder="Select source..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="any">Any Contact Added</SelectItem>
                    <SelectItem value="import">Imported Contacts</SelectItem>
                    <SelectItem value="form">Form Submission</SelectItem>
                    <SelectItem value="api">API/Integration</SelectItem>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Filter by List (Optional)</Label>
            <Select value={node.data.listId?.toString() || '__none'} onValueChange={(v) => updateData('listId', v === '__none' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Any list..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__none">Any List</SelectItem>
                    {(lists || []).map(list => (
                        <SelectItem key={list.id} value={list.id.toString()}>{list.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Filter by Tag (Optional)</Label>
            <Select value={node.data.filterTag || '__none'} onValueChange={(v) => updateData('filterTag', v === '__none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="No filter..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__none">No filter</SelectItem>
                    {(tags || []).map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When a new contact is added" />
        </div>
    </div>
);

export const ContactDeletedConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Triggered when a contact is permanently deleted from the system.</p>
        </div>
        <div className="flex items-center justify-between">
            <div>
                <Label>Include Archived</Label>
                <p className="text-xs text-muted-foreground">Also trigger for archived contacts</p>
            </div>
            <Switch checked={node.data.includeArchived || false} onCheckedChange={(v) => updateData('includeArchived', v)} />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When a contact is deleted" />
        </div>
    </div>
);

export const TagAddedConfig: React.FC<NodeConfigProps> = ({ node, updateData, tags }) => (
    <div className="space-y-4">
        <div>
            <Label>Select Tag</Label>
            <Select value={node.data.tagName || '__any'} onValueChange={(v) => updateData('tagName', v === '__any' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select tag..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__any">Any Tag</SelectItem>
                    {(tags || []).map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Or enter a new tag name:</p>
            <Input value={node.data.tagName || ''} onChange={(e) => updateData('tagName', e.target.value)} placeholder="Enter tag name..." className="mt-1" />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When a tag is added to contact" />
        </div>
    </div>
);

export const TagRemovedConfig: React.FC<NodeConfigProps> = ({ node, updateData, tags }) => (
    <div className="space-y-4">
        <div>
            <Label>Select Tag</Label>
            <Select value={node.data.tagName || '__any'} onValueChange={(v) => updateData('tagName', v === '__any' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select tag..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__any">Any Tag</SelectItem>
                    {(tags || []).map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input value={node.data.tagName || ''} onChange={(e) => updateData('tagName', e.target.value)} placeholder="Or enter tag name..." className="mt-2" />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When a tag is removed from contact" />
        </div>
    </div>
);

export const EmailOpenedConfig: React.FC<NodeConfigProps> = ({ node, updateData, campaigns }) => (
    <div className="space-y-4">
        <div>
            <Label>From Campaign (Optional)</Label>
            <Select value={node.data.campaignId?.toString() || '__any'} onValueChange={(v) => updateData('campaignId', v === '__any' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Any campaign..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__any">Any Email Campaign</SelectItem>
                    {(campaigns || []).filter(c => c.type === 'email').map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Minimum Opens</Label>
            <Input type="number" value={node.data.minOpens || 1} onChange={(e) => updateData('minOpens', parseInt(e.target.value))} min={1} />
            <p className="text-xs text-muted-foreground mt-1">Trigger after this many opens</p>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When an email is opened" />
        </div>
    </div>
);

export const EmailClickedConfig: React.FC<NodeConfigProps> = ({ node, updateData, campaigns }) => (
    <div className="space-y-4">
        <div>
            <Label>Link URL (Optional)</Label>
            <Input value={node.data.linkUrl || ''} onChange={(e) => updateData('linkUrl', e.target.value)} placeholder="https://... (leave empty for any link)" />
            <p className="text-xs text-muted-foreground mt-1">Leave empty to trigger on any link click</p>
        </div>
        <div>
            <Label>From Campaign (Optional)</Label>
            <Select value={node.data.campaignId?.toString() || '__any'} onValueChange={(v) => updateData('campaignId', v === '__any' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Any campaign..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__any">Any Campaign</SelectItem>
                    {(campaigns || []).filter(c => c.type === 'email').map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When a link is clicked" />
        </div>
    </div>
);

export const EmailRepliedConfig: React.FC<NodeConfigProps> = ({ node, updateData, campaigns }) => (
    <div className="space-y-4">
        <div>
            <Label>From Campaign (Optional)</Label>
            <Select value={node.data.campaignId?.toString() || '__any'} onValueChange={(v) => updateData('campaignId', v === '__any' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Any campaign..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__any">Any Email Campaign</SelectItem>
                    {(campaigns || []).filter(c => c.type === 'email').map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Reply Contains (Optional)</Label>
            <Input value={node.data.replyContains || ''} onChange={(e) => updateData('replyContains', e.target.value)} placeholder="Keywords to match..." />
            <p className="text-xs text-muted-foreground mt-1">Leave empty to trigger on any reply</p>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When contact replies to email" />
        </div>
    </div>
);

export const EmailUnsubscribedConfig: React.FC<NodeConfigProps> = ({ node, updateData, campaigns }) => (
    <div className="space-y-4">
        <div>
            <Label>From Campaign (Optional)</Label>
            <Select value={node.data.campaignId?.toString() || '__any'} onValueChange={(v) => updateData('campaignId', v === '__any' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Any campaign..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__any">Any Email Campaign</SelectItem>
                    {(campaigns || []).filter(c => c.type === 'email').map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">This trigger fires when a contact clicks the unsubscribe link in an email.</p>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When contact unsubscribes" />
        </div>
    </div>
);

export const EmailComplainedConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">⚠️ This trigger fires when a contact marks your email as spam. Take immediate action to prevent further issues.</p>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When email marked as spam" />
        </div>
    </div>
);

export const SMSRepliedConfig: React.FC<NodeConfigProps> = ({ node, updateData, campaigns }) => (
    <div className="space-y-4">
        <div>
            <Label>From Campaign (Optional)</Label>
            <Select value={node.data.campaignId?.toString() || '__any'} onValueChange={(v) => updateData('campaignId', v === '__any' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Any campaign..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__any">Any SMS Campaign</SelectItem>
                    {(campaigns || []).filter(c => c.type === 'sms').map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Reply Contains (Optional)</Label>
            <Input value={node.data.replyContains || ''} onChange={(e) => updateData('replyContains', e.target.value)} placeholder="Keywords like YES, STOP..." />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When contact replies to SMS" />
        </div>
    </div>
);

export const SMSDeliveredConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Triggered when an SMS is successfully delivered to the contact's phone.</p>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When SMS is delivered" />
        </div>
    </div>
);

export const SMSFailedConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Failure Reason (Optional)</Label>
            <Select value={node.data.failureReason || 'any'} onValueChange={(v) => updateData('failureReason', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="any">Any Failure</SelectItem>
                    <SelectItem value="invalid_number">Invalid Number</SelectItem>
                    <SelectItem value="carrier_blocked">Carrier Blocked</SelectItem>
                    <SelectItem value="undeliverable">Undeliverable</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When SMS fails to deliver" />
        </div>
    </div>
);

export const CallCompletedConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Call Duration (Minimum Seconds)</Label>
            <Input type="number" value={node.data.minDuration || 0} onChange={(e) => updateData('minDuration', parseInt(e.target.value))} placeholder="0" />
            <p className="text-xs text-muted-foreground mt-1">Set to 0 for any duration</p>
        </div>
        <div>
            <Label>Disposition (Optional)</Label>
            <Select value={node.data.disposition || '__any'} onValueChange={(v) => updateData('disposition', v === '__any' ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Any disposition..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__any">Any Disposition</SelectItem>
                    <SelectItem value="connected">Connected</SelectItem>
                    <SelectItem value="voicemail">Left Voicemail</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="no_answer">No Answer</SelectItem>
                    <SelectItem value="callback">Callback Requested</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When a call is completed" />
        </div>
    </div>
);

export const CallMissedConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Triggered when an inbound call is missed or not answered in time.</p>
        </div>
        <div className="flex items-center justify-between">
            <div>
                <Label>Include Voicemail</Label>
                <p className="text-xs text-muted-foreground">Also trigger when voicemail is left</p>
            </div>
            <Switch checked={node.data.includeVoicemail || false} onCheckedChange={(v) => updateData('includeVoicemail', v)} />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When a call is missed" />
        </div>
    </div>
);

export const VoicemailLeftConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Minimum Duration (Seconds)</Label>
            <Input type="number" value={node.data.minDuration || 5} onChange={(e) => updateData('minDuration', parseInt(e.target.value))} />
            <p className="text-xs text-muted-foreground mt-1">Ignore very short voicemails</p>
        </div>
        <div className="flex items-center justify-between">
            <div>
                <Label>Transcription Available</Label>
                <p className="text-xs text-muted-foreground">Only trigger when transcription is ready</p>
            </div>
            <Switch checked={node.data.requireTranscription || false} onCheckedChange={(v) => updateData('requireTranscription', v)} />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When voicemail is left" />
        </div>
    </div>
);

export const FormSubmittedConfig: React.FC<NodeConfigProps> = ({ node, updateData, forms }) => (
    <div className="space-y-4">
        <div>
            <Label>Select Form</Label>
            <Select value={node.data.formId?.toString() || '__any'} onValueChange={(v) => updateData('formId', v === '__any' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select form..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__any">Any Form</SelectItem>
                    {(forms || []).map(form => (
                        <SelectItem key={form.id} value={form.id.toString()}>{form.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-center justify-between">
            <div>
                <Label>Only New Contacts</Label>
                <p className="text-xs text-muted-foreground">Trigger only for new contacts</p>
            </div>
            <Switch checked={node.data.onlyNewContacts || false} onCheckedChange={(v) => updateData('onlyNewContacts', v)} />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When a form is submitted" />
        </div>
    </div>
);

export const LandingPageConversionConfig: React.FC<NodeConfigProps> = ({ node, updateData, landingPages }) => (
    <div className="space-y-4">
        <div>
            <Label>Landing Page</Label>
            <Select value={node.data.pageId?.toString() || '__any'} onValueChange={(v) => updateData('pageId', v === '__any' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select page..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__any">Any Landing Page</SelectItem>
                    {(landingPages || []).map(page => (
                        <SelectItem key={page.id} value={page.id.toString()}>{page.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Conversion Goal</Label>
            <Select value={node.data.conversionGoal || 'form_submit'} onValueChange={(v) => updateData('conversionGoal', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="form_submit">Form Submission</SelectItem>
                    <SelectItem value="button_click">Button Click</SelectItem>
                    <SelectItem value="video_watch">Video Watch</SelectItem>
                    <SelectItem value="scroll_depth">Scroll Depth</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When landing page converts" />
        </div>
    </div>
);

export const ProductViewedConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Product SKU (Optional)</Label>
            <Input value={node.data.productSku || ''} onChange={(e) => updateData('productSku', e.target.value)} placeholder="Leave empty for any product" />
        </div>
        <div>
            <Label>Product Category (Optional)</Label>
            <Input value={node.data.productCategory || ''} onChange={(e) => updateData('productCategory', e.target.value)} placeholder="Electronics, Clothing, etc." />
        </div>
        <div>
            <Label>Minimum View Time (Seconds)</Label>
            <Input type="number" value={node.data.minViewTime || 10} onChange={(e) => updateData('minViewTime', parseInt(e.target.value))} />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When product is viewed" />
        </div>
    </div>
);

export const RefundRequestedConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Refund Type</Label>
            <Select value={node.data.refundType || 'any'} onValueChange={(v) => updateData('refundType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="any">Any Refund</SelectItem>
                    <SelectItem value="full">Full Refund</SelectItem>
                    <SelectItem value="partial">Partial Refund</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Minimum Amount (Optional)</Label>
            <Input type="number" value={node.data.minAmount || ''} onChange={(e) => updateData('minAmount', parseFloat(e.target.value))} placeholder="0.00" />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When refund is requested" />
        </div>
    </div>
);

export const DateTriggerConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Trigger Type</Label>
            <Select value={node.data.dateType || 'specific'} onValueChange={(v) => updateData('dateType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="specific">Specific Date & Time</SelectItem>
                    <SelectItem value="recurring">Recurring Schedule</SelectItem>
                    <SelectItem value="relative">Relative to Contact Field</SelectItem>
                </SelectContent>
            </Select>
        </div>
        {node.data.dateType === 'specific' && (
            <div>
                <Label>Date & Time</Label>
                <Input type="datetime-local" value={node.data.specificDate || ''} onChange={(e) => updateData('specificDate', e.target.value)} />
            </div>
        )}
        {node.data.dateType === 'recurring' && (
            <>
                <div>
                    <Label>Frequency</Label>
                    <Select value={node.data.frequency || 'daily'} onValueChange={(v) => updateData('frequency', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Time</Label>
                    <Input type="time" value={node.data.time || '09:00'} onChange={(e) => updateData('time', e.target.value)} />
                </div>
            </>
        )}
        {node.data.dateType === 'relative' && (
            <>
                <div>
                    <Label>Contact Field</Label>
                    <Select value={node.data.dateField || 'created_at'} onValueChange={(v) => updateData('dateField', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="created_at">Created Date</SelectItem>
                            <SelectItem value="birthday">Birthday</SelectItem>
                            <SelectItem value="anniversary">Anniversary</SelectItem>
                            <SelectItem value="custom">Custom Date Field</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Offset</Label>
                        <Input type="number" value={node.data.offset || 0} onChange={(e) => updateData('offset', parseInt(e.target.value))} />
                    </div>
                    <div>
                        <Label>Unit</Label>
                        <Select value={node.data.offsetUnit || 'days'} onValueChange={(v) => updateData('offsetUnit', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="days">Days Before/After</SelectItem>
                                <SelectItem value="weeks">Weeks Before/After</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </>
        )}
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="On a specific date or recurring" />
        </div>
    </div>
);

export const BirthdayTriggerConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Days Before Birthday</Label>
            <Input type="number" value={node.data.daysBefore || 0} onChange={(e) => updateData('daysBefore', parseInt(e.target.value))} />
            <p className="text-xs text-muted-foreground mt-1">0 = on birthday, 7 = one week before</p>
        </div>
        <div>
            <Label>Trigger Time</Label>
            <Input type="time" value={node.data.triggerTime || '09:00'} onChange={(e) => updateData('triggerTime', e.target.value)} />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="On contact birthday" />
        </div>
    </div>
);

export const AnniversaryTriggerConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Anniversary Type</Label>
            <Select value={node.data.anniversaryType || 'customer'} onValueChange={(v) => updateData('anniversaryType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="customer">Customer Anniversary</SelectItem>
                    <SelectItem value="signup">Signup Anniversary</SelectItem>
                    <SelectItem value="first_purchase">First Purchase Anniversary</SelectItem>
                    <SelectItem value="custom">Custom Date Field</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Days Before</Label>
            <Input type="number" value={node.data.daysBefore || 0} onChange={(e) => updateData('daysBefore', parseInt(e.target.value))} />
        </div>
        <div>
            <Label>Trigger Time</Label>
            <Input type="time" value={node.data.triggerTime || '09:00'} onChange={(e) => updateData('triggerTime', e.target.value)} />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="On anniversary date" />
        </div>
    </div>
);

export const InactivityTriggerConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Inactivity Period</Label>
            <div className="grid grid-cols-2 gap-2">
                <Input type="number" value={node.data.inactivityDays || 30} onChange={(e) => updateData('inactivityDays', parseInt(e.target.value))} />
                <Select value={node.data.inactivityUnit || 'days'} onValueChange={(v) => updateData('inactivityUnit', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div>
            <Label>Activity Type</Label>
            <Select value={node.data.activityType || 'any'} onValueChange={(v) => updateData('activityType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="any">Any Activity</SelectItem>
                    <SelectItem value="email_engagement">Email Engagement</SelectItem>
                    <SelectItem value="website_visit">Website Visit</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="After period of inactivity" />
        </div>
    </div>
);

export const APIEventConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Event Name</Label>
            <Input value={node.data.eventName || ''} onChange={(e) => updateData('eventName', e.target.value)} placeholder="user.upgraded, order.placed" />
        </div>
        <div>
            <Label>Event Properties (JSON - Optional)</Label>
            <Textarea value={node.data.eventProperties || ''} onChange={(e) => updateData('eventProperties', e.target.value)} rows={4} placeholder='{"plan": "premium"}' className="font-mono text-xs" />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When API event occurs" />
        </div>
    </div>
);

export const ZapierTriggerConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Zap Name</Label>
            <Input value={node.data.zapName || ''} onChange={(e) => updateData('zapName', e.target.value)} placeholder="My Zap" />
        </div>
        <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">This trigger will fire when the corresponding Zapier zap sends data to your account.</p>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Triggered by Zapier" />
        </div>
    </div>
);

export const ManualTriggerConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">This flow will only start when you manually add contacts to it or trigger it via API.</p>
        </div>
        <div className="flex items-center justify-between">
            <div>
                <Label>Allow Bulk Trigger</Label>
                <p className="text-xs text-muted-foreground">Allow triggering for multiple contacts at once</p>
            </div>
            <Switch checked={node.data.allowBulk !== false} onCheckedChange={(v) => updateData('allowBulk', v)} />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Manually triggered" />
        </div>
    </div>
);

export const SegmentEntryConfig: React.FC<NodeConfigProps> = ({ node, updateData, lists }) => (
    <div className="space-y-4">
        <div>
            <Label>Segment/List</Label>
            <Select value={node.data.segmentId?.toString() || '__none'} onValueChange={(v) => updateData('segmentId', v === '__none' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select segment..." /></SelectTrigger>
                <SelectContent>
                    {(lists || []).map(list => (
                        <SelectItem key={list.id} value={list.id.toString()}>{list.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-center justify-between">
            <div>
                <Label>Trigger on Entry Only</Label>
                <p className="text-xs text-muted-foreground">Don't trigger for existing members</p>
            </div>
            <Switch checked={node.data.entryOnly !== false} onCheckedChange={(v) => updateData('entryOnly', v)} />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When entering a segment" />
        </div>
    </div>
);

export const ContactUpdatedConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Field Changed</Label>
            <Select value={node.data.fieldName || '__any'} onValueChange={(v) => updateData('fieldName', v === '__any' ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Any field" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__any">Any Field</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="lead_score">Lead Score</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When contact is updated" />
        </div>
    </div>
);

export const LeadScoreChangedConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Condition</Label>
            <Select value={node.data.condition || 'increased'} onValueChange={(v) => updateData('condition', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="increased">Score Increased</SelectItem>
                    <SelectItem value="decreased">Score Decreased</SelectItem>
                    <SelectItem value="threshold">Reached Threshold</SelectItem>
                </SelectContent>
            </Select>
        </div>
        {node.data.condition === 'threshold' && (
            <div>
                <Label>Threshold Score</Label>
                <Input type="number" value={node.data.threshold || 50} onChange={(e) => updateData('threshold', parseInt(e.target.value))} />
            </div>
        )}
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When lead score changes" />
        </div>
    </div>
);

export const EmailBouncedConfig: React.FC<NodeConfigProps> = ({ node, updateData, campaigns }) => (
    <div className="space-y-4">
        <div>
            <Label>Bounce Type</Label>
            <Select value={node.data.bounceType || 'any'} onValueChange={(v) => updateData('bounceType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="any">Any Bounce</SelectItem>
                    <SelectItem value="hard">Hard Bounce</SelectItem>
                    <SelectItem value="soft">Soft Bounce</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>From Campaign (Optional)</Label>
            <Select value={node.data.campaignId?.toString() || '__any'} onValueChange={(v) => updateData('campaignId', v === '__any' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Any campaign" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__any">Any Campaign</SelectItem>
                    {(campaigns || []).filter(c => c.type === 'email').map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When email bounces" />
        </div>
    </div>
);

export const SMSOptedOutConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Triggered when a contact opts out of SMS communications.</p>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When contact opts out of SMS" />
        </div>
    </div>
);

export const PageVisitedConfig: React.FC<NodeConfigProps> = ({ node, updateData, landingPages }) => (
    <div className="space-y-4">
        <div>
            <Label>Page/URL</Label>
            <Select value={node.data.pageId?.toString() || '__custom'} onValueChange={(v) => updateData('pageId', v === '__custom' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select page" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__custom">Custom URL</SelectItem>
                    {(landingPages || []).map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        {!node.data.pageId && (
            <div>
                <Label>Custom URL</Label>
                <Input value={node.data.url || ''} onChange={(e) => updateData('url', e.target.value)} placeholder="https://example.com/page" />
            </div>
        )}
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When page is visited" />
        </div>
    </div>
);

export const PurchaseMadeConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Product (Optional)</Label>
            <Input value={node.data.productName || ''} onChange={(e) => updateData('productName', e.target.value)} placeholder="Specific product name" />
        </div>
        <div>
            <Label>Minimum Amount (Optional)</Label>
            <Input type="number" value={node.data.minAmount || ''} onChange={(e) => updateData('minAmount', parseFloat(e.target.value))} placeholder="0.00" />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When purchase is made" />
        </div>
    </div>
);

export const CartAbandonedConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Abandoned For (minutes)</Label>
            <Input type="number" value={node.data.abandonedMinutes || 30} onChange={(e) => updateData('abandonedMinutes', parseInt(e.target.value))} />
        </div>
        <div>
            <Label>Minimum Cart Value (Optional)</Label>
            <Input type="number" value={node.data.minCartValue || ''} onChange={(e) => updateData('minCartValue', parseFloat(e.target.value))} placeholder="0.00" />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When cart is abandoned" />
        </div>
    </div>
);

export const WebhookReceivedConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Webhook Name</Label>
            <Input value={node.data.webhookName || ''} onChange={(e) => updateData('webhookName', e.target.value)} placeholder="my-webhook" />
        </div>
        <div>
            <Label>Expected Payload (JSON Schema - Optional)</Label>
            <Textarea value={node.data.payloadSchema || ''} onChange={(e) => updateData('payloadSchema', e.target.value)} rows={4} placeholder='{"event": "user.created"}' className="font-mono text-xs" />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="When webhook is received" />
        </div>
    </div>
);

// ==================== ACTION CONFIGS ====================

export const SendEmailSequenceConfig: React.FC<NodeConfigProps> = ({ node, updateData, sequences }) => (
    <div className="space-y-4">
        <div>
            <Label>Email Sequence</Label>
            <Select value={node.data.sequenceId?.toString() || '__none'} onValueChange={(v) => updateData('sequenceId', v === '__none' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select sequence" /></SelectTrigger>
                <SelectContent>
                    {(sequences || []).filter(s => s.type === 'email').map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Start email sequence" />
        </div>
    </div>
);

export const UpdateFieldConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Field Name</Label>
            <Select value={node.data.fieldName || '__custom'} onValueChange={(v) => updateData('fieldName', v)}>
                <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="lead_score">Lead Score</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="job_title">Job Title</SelectItem>
                    <SelectItem value="__custom">Custom Field</SelectItem>
                </SelectContent>
            </Select>
        </div>
        {node.data.fieldName === '__custom' && (
            <div>
                <Label>Custom Field Name</Label>
                <Input value={node.data.customFieldName || ''} onChange={(e) => updateData('customFieldName', e.target.value)} placeholder="field_name" />
            </div>
        )}
        <div>
            <Label>New Value</Label>
            <Input value={node.data.fieldValue || ''} onChange={(e) => updateData('fieldValue', e.target.value)} placeholder="New value" />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Update contact field" />
        </div>
    </div>
);

export const UpdateLeadScoreConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Action</Label>
            <Select value={node.data.scoreAction || 'add'} onValueChange={(v) => updateData('scoreAction', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="add">Add Points</SelectItem>
                    <SelectItem value="subtract">Subtract Points</SelectItem>
                    <SelectItem value="set">Set To Value</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Points</Label>
            <Input type="number" value={node.data.scoreValue || 10} onChange={(e) => updateData('scoreValue', parseInt(e.target.value))} />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Update lead score" />
        </div>
    </div>
);

export const ChangeStatusConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>New Status</Label>
            <Select value={node.data.status || 'active'} onValueChange={(v) => updateData('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="unqualified">Unqualified</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Change contact status" />
        </div>
    </div>
);

export const AssignOwnerConfig: React.FC<NodeConfigProps> = ({ node, updateData, users }) => (
    <div className="space-y-4">
        <div>
            <Label>Assign To</Label>
            <Select value={node.data.userId?.toString() || '__none'} onValueChange={(v) => updateData('userId', v === '__none' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                    {(users || []).map(u => (
                        <SelectItem key={u.id} value={u.id.toString()}>{u.name} ({u.email})</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Assign contact owner" />
        </div>
    </div>
);

export const CopyToListConfig: React.FC<NodeConfigProps> = ({ node, updateData, lists }) => (
    <div className="space-y-4">
        <div>
            <Label>Target List</Label>
            <Select value={node.data.listId?.toString() || '__none'} onValueChange={(v) => updateData('listId', v === '__none' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select list" /></SelectTrigger>
                <SelectContent>
                    {(lists || []).map(l => (
                        <SelectItem key={l.id} value={l.id.toString()}>{l.name} ({l.count || 0} contacts)</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Copy to list" />
        </div>
    </div>
);

export const AddToCampaignConfig: React.FC<NodeConfigProps> = ({ node, updateData, campaigns }) => (
    <div className="space-y-4">
        <div>
            <Label>Campaign</Label>
            <Select value={node.data.campaignId?.toString() || '__none'} onValueChange={(v) => updateData('campaignId', v === '__none' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select campaign" /></SelectTrigger>
                <SelectContent>
                    {(campaigns || []).map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name} ({c.type})</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Add to campaign" />
        </div>
    </div>
);

export const CreateTaskConfig: React.FC<NodeConfigProps> = ({ node, updateData, users }) => (
    <div className="space-y-4">
        <div>
            <Label>Task Title</Label>
            <Input value={node.data.taskTitle || ''} onChange={(e) => updateData('taskTitle', e.target.value)} placeholder="Follow up with contact" />
        </div>
        <div>
            <Label>Task Description</Label>
            <Textarea value={node.data.taskDescription || ''} onChange={(e) => updateData('taskDescription', e.target.value)} rows={3} placeholder="Task details..." />
        </div>
        <div>
            <Label>Assign To</Label>
            <Select value={node.data.assignedTo?.toString() || '__none'} onValueChange={(v) => updateData('assignedTo', v === '__none' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                    {(users || []).map(u => (
                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Due Date (Days from now)</Label>
            <Input type="number" value={node.data.dueDays || 1} onChange={(e) => updateData('dueDays', parseInt(e.target.value))} />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Create task" />
        </div>
    </div>
);

export const CreateDealConfig: React.FC<NodeConfigProps> = ({ node, updateData, users }) => (
    <div className="space-y-4">
        <div>
            <Label>Deal Name</Label>
            <Input value={node.data.dealName || ''} onChange={(e) => updateData('dealName', e.target.value)} placeholder="New Opportunity" />
        </div>
        <div>
            <Label>Deal Value</Label>
            <Input type="number" value={node.data.dealValue || ''} onChange={(e) => updateData('dealValue', parseFloat(e.target.value))} placeholder="0.00" />
        </div>
        <div>
            <Label>Pipeline Stage</Label>
            <Select value={node.data.stage || 'lead'} onValueChange={(v) => updateData('stage', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="closed_won">Closed Won</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Assign To</Label>
            <Select value={node.data.assignedTo?.toString() || '__none'} onValueChange={(v) => updateData('assignedTo', v === '__none' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                    {(users || []).map(u => (
                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Create deal" />
        </div>
    </div>
);

export const NotifyTeamConfig: React.FC<NodeConfigProps> = ({ node, updateData, users }) => (
    <div className="space-y-4">
        <div>
            <Label>Notify User</Label>
            <Select value={node.data.userId?.toString() || '__all'} onValueChange={(v) => updateData('userId', v === '__all' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="All users" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__all">All Team Members</SelectItem>
                    {(users || []).map(u => (
                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Notification Message</Label>
            <Textarea value={node.data.message || ''} onChange={(e) => updateData('message', e.target.value)} rows={3} placeholder="Contact {{first_name}} {{last_name}} has..." />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Notify team" />
        </div>
    </div>
);

export const WebhookActionConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Webhook URL</Label>
            <Input value={node.data.webhookUrl || ''} onChange={(e) => updateData('webhookUrl', e.target.value)} placeholder="https://api.example.com/webhook" />
        </div>
        <div>
            <Label>HTTP Method</Label>
            <Select value={node.data.method || 'POST'} onValueChange={(v) => updateData('method', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Textarea value={node.data.headers || '{"Content-Type": "application/json"}'} onChange={(e) => updateData('headers', e.target.value)} rows={3} className="font-mono text-xs" />
        </div>
        <div>
            <Label>Payload (JSON)</Label>
            <Textarea value={node.data.payload || '{"contact_id": "{{contact_id}}"}'} onChange={(e) => updateData('payload', e.target.value)} rows={4} className="font-mono text-xs" />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Call webhook" />
        </div>
    </div>
);

export const TrackConversionConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Conversion Name</Label>
            <Input value={node.data.conversionName || ''} onChange={(e) => updateData('conversionName', e.target.value)} placeholder="Demo Booked" />
        </div>
        <div>
            <Label>Conversion Value (Optional)</Label>
            <Input type="number" value={node.data.conversionValue || ''} onChange={(e) => updateData('conversionValue', parseFloat(e.target.value))} placeholder="0.00" />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Track conversion" />
        </div>
    </div>
);

// ==================== CALL ACTION CONFIGS ====================

export const MakeCallConfig: React.FC<NodeConfigProps> = ({ node, updateData, callScripts, users }) => (
    <div className="space-y-4">
        <div>
            <Label>Phone Number Source</Label>
            <Select value={node.data.phoneSource || 'contact'} onValueChange={(v) => updateData('phoneSource', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="contact">Contact's Primary Phone</SelectItem>
                    <SelectItem value="mobile">Contact's Mobile</SelectItem>
                    <SelectItem value="work">Contact's Work Number</SelectItem>
                    <SelectItem value="custom">Custom Number</SelectItem>
                </SelectContent>
            </Select>
        </div>
        {node.data.phoneSource === 'custom' && (
            <div>
                <Label>Custom Phone Number</Label>
                <Input value={node.data.customPhone || ''} onChange={(e) => updateData('customPhone', e.target.value)} placeholder="+1 555 123 4567" />
            </div>
        )}
        <div>
            <Label>Call Script (Optional)</Label>
            <Select value={node.data.callScriptId?.toString() || '__none'} onValueChange={(v) => updateData('callScriptId', v === '__none' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select a script..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__none">No script</SelectItem>
                    {(callScripts || []).map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Assign Call To</Label>
            <Select value={node.data.assignedTo?.toString() || '__auto'} onValueChange={(v) => updateData('assignedTo', v === '__auto' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Auto-assign" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__auto">Auto-assign based on rules</SelectItem>
                    <SelectItem value="__owner">Contact Owner</SelectItem>
                    {(users || []).map(u => (
                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-center justify-between">
            <div>
                <Label>Record Call</Label>
                <p className="text-xs text-muted-foreground">Record for quality/training</p>
            </div>
            <Switch checked={node.data.recordCall || false} onCheckedChange={(v) => updateData('recordCall', v)} />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Make outbound call" />
        </div>
    </div>
);

export const ScheduleCallConfig: React.FC<NodeConfigProps> = ({ node, updateData, callScripts, users }) => (
    <div className="space-y-4">
        <div>
            <Label>Schedule For</Label>
            <Select value={node.data.scheduleType || 'relative'} onValueChange={(v) => updateData('scheduleType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="relative">Relative Time (e.g., in 1 hour)</SelectItem>
                    <SelectItem value="specific">Specific Date/Time</SelectItem>
                    <SelectItem value="business_hours">Next Available Business Hours</SelectItem>
                </SelectContent>
            </Select>
        </div>
        {node.data.scheduleType === 'relative' && (
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label>Amount</Label>
                    <Input type="number" min="1" value={node.data.scheduleAmount || 1} onChange={(e) => updateData('scheduleAmount', parseInt(e.target.value))} />
                </div>
                <div>
                    <Label>Unit</Label>
                    <Select value={node.data.scheduleUnit || 'hours'} onValueChange={(v) => updateData('scheduleUnit', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="minutes">Minutes</SelectItem>
                            <SelectItem value="hours">Hours</SelectItem>
                            <SelectItem value="days">Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        )}
        <div>
            <Label>Phone Number Source</Label>
            <Select value={node.data.phoneSource || 'contact'} onValueChange={(v) => updateData('phoneSource', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="contact">Contact's Primary Phone</SelectItem>
                    <SelectItem value="mobile">Contact's Mobile</SelectItem>
                    <SelectItem value="custom">Custom Number</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Call Script (Optional)</Label>
            <Select value={node.data.callScriptId?.toString() || '__none'} onValueChange={(v) => updateData('callScriptId', v === '__none' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select a script..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__none">No script</SelectItem>
                    {(callScripts || []).map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Assign To</Label>
            <Select value={node.data.assignedTo?.toString() || '__auto'} onValueChange={(v) => updateData('assignedTo', v === '__auto' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Auto-assign" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__auto">Auto-assign</SelectItem>
                    <SelectItem value="__owner">Contact Owner</SelectItem>
                    {(users || []).map(u => (
                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Schedule call task" />
        </div>
    </div>
);

export const SendVoicemailConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Voicemail Type</Label>
            <Select value={node.data.voicemailType || 'tts'} onValueChange={(v) => updateData('voicemailType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="tts">Text-to-Speech</SelectItem>
                    <SelectItem value="audio">Pre-recorded Audio</SelectItem>
                </SelectContent>
            </Select>
        </div>
        {node.data.voicemailType === 'tts' && (
            <div>
                <Label>Message Text</Label>
                <Textarea
                    value={node.data.messageText || ''}
                    onChange={(e) => updateData('messageText', e.target.value)}
                    placeholder="Hi {{first_name}}, this is a message from..."
                    rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">Use {"{{first_name}}"}, {"{{company}}"} for personalization</p>
            </div>
        )}
        {node.data.voicemailType === 'audio' && (
            <div>
                <Label>Audio File URL</Label>
                <Input value={node.data.audioUrl || ''} onChange={(e) => updateData('audioUrl', e.target.value)} placeholder="https://..." />
            </div>
        )}
        <div>
            <Label>Voice</Label>
            <Select value={node.data.voice || 'alloy'} onValueChange={(v) => updateData('voice', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                    <SelectItem value="echo">Echo (Male)</SelectItem>
                    <SelectItem value="fable">Fable (British)</SelectItem>
                    <SelectItem value="onyx">Onyx (Deep Male)</SelectItem>
                    <SelectItem value="nova">Nova (Female)</SelectItem>
                    <SelectItem value="shimmer">Shimmer (Expressive Female)</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Phone Number Source</Label>
            <Select value={node.data.phoneSource || 'contact'} onValueChange={(v) => updateData('phoneSource', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="contact">Contact's Primary Phone</SelectItem>
                    <SelectItem value="mobile">Contact's Mobile</SelectItem>
                    <SelectItem value="custom">Custom Number</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Send ringless voicemail" />
        </div>
    </div>
);

// ==================== CONDITION CONFIGS ====================

export const IfElseConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Condition Type</Label>
            <Select value={node.data.conditionType || 'field_value'} onValueChange={(v) => updateData('conditionType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="field_value">Field Value</SelectItem>
                    <SelectItem value="tag">Has Tag</SelectItem>
                    <SelectItem value="lead_score">Lead Score</SelectItem>
                    <SelectItem value="email_opened">Email Opened</SelectItem>
                    <SelectItem value="link_clicked">Link Clicked</SelectItem>
                </SelectContent>
            </Select>
        </div>

        {node.data.conditionType === 'field_value' && (
            <>
                <div>
                    <Label>Field Name</Label>
                    <Input value={node.data.fieldName || ''} onChange={(e) => updateData('fieldName', e.target.value)} placeholder="status" />
                </div>
                <div>
                    <Label>Operator</Label>
                    <Select value={node.data.operator || 'equals'} onValueChange={(v) => updateData('operator', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Not Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="not_contains">Does Not Contain</SelectItem>
                            <SelectItem value="is_empty">Is Empty</SelectItem>
                            <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Value</Label>
                    <Input value={node.data.value || ''} onChange={(e) => updateData('value', e.target.value)} placeholder="Expected value" />
                </div>
            </>
        )}

        {node.data.conditionType === 'tag' && (
            <div>
                <Label>Tag Name</Label>
                <Input value={node.data.tagName || ''} onChange={(e) => updateData('tagName', e.target.value)} placeholder="VIP" />
            </div>
        )}

        {node.data.conditionType === 'lead_score' && (
            <>
                <div>
                    <Label>Operator</Label>
                    <Select value={node.data.operator || 'greater_than'} onValueChange={(v) => updateData('operator', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                            <SelectItem value="equals">Equals</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Score Value</Label>
                    <Input type="number" value={node.data.scoreValue || 50} onChange={(e) => updateData('scoreValue', parseInt(e.target.value))} />
                </div>
            </>
        )}

        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="If/Else condition" />
        </div>
    </div>
);

export const FieldValueConditionConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Field Name</Label>
            <Input value={node.data.fieldName || ''} onChange={(e) => updateData('fieldName', e.target.value)} placeholder="company" />
        </div>
        <div>
            <Label>Operator</Label>
            <Select value={node.data.operator || 'equals'} onValueChange={(v) => updateData('operator', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Not Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="starts_with">Starts With</SelectItem>
                    <SelectItem value="ends_with">Ends With</SelectItem>
                    <SelectItem value="is_empty">Is Empty</SelectItem>
                    <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Value</Label>
            <Input value={node.data.value || ''} onChange={(e) => updateData('value', e.target.value)} placeholder="Expected value" />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Check field value" />
        </div>
    </div>
);

export const ListMembershipConfig: React.FC<NodeConfigProps> = ({ node, updateData, lists }) => (
    <div className="space-y-4">
        <div>
            <Label>List</Label>
            <Select value={node.data.listId?.toString() || '__none'} onValueChange={(v) => updateData('listId', v === '__none' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select list" /></SelectTrigger>
                <SelectContent>
                    {(lists || []).map(l => (
                        <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Condition</Label>
            <Select value={node.data.condition || 'is_member'} onValueChange={(v) => updateData('condition', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="is_member">Is Member</SelectItem>
                    <SelectItem value="is_not_member">Is Not Member</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Check list membership" />
        </div>
    </div>
);

export const RandomSplitConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Split Percentage (Path A)</Label>
            <Input type="number" min="0" max="100" value={node.data.splitPercentage || 50} onChange={(e) => updateData('splitPercentage', parseInt(e.target.value))} />
            <p className="text-xs text-muted-foreground mt-1">Path B will receive {100 - (node.data.splitPercentage || 50)}%</p>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Random split test" />
        </div>
    </div>
);

export const TimeOfDayConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label>Start Time</Label>
                <Input type="time" value={node.data.startTime || '09:00'} onChange={(e) => updateData('startTime', e.target.value)} />
            </div>
            <div>
                <Label>End Time</Label>
                <Input type="time" value={node.data.endTime || '17:00'} onChange={(e) => updateData('endTime', e.target.value)} />
            </div>
        </div>
        <div>
            <Label>Timezone</Label>
            <Select value={node.data.timezone || 'contact'} onValueChange={(v) => updateData('timezone', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="contact">Contact's Timezone</SelectItem>
                    <SelectItem value="account">Account Timezone</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Check time of day" />
        </div>
    </div>
);

export const DayOfWeekConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const selectedDays = node.data.days || [];

    const toggleDay = (day: string) => {
        const newDays = selectedDays.includes(day)
            ? selectedDays.filter((d: string) => d !== day)
            : [...selectedDays, day];
        updateData('days', newDays);
    };

    return (
        <div className="space-y-4">
            <div>
                <Label>Select Days</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    {days.map(day => (
                        <div key={day} className="flex items-center space-x-2">
                            <Switch checked={selectedDays.includes(day)} onCheckedChange={() => toggleDay(day)} />
                            <Label className="cursor-pointer">{day}</Label>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <Label>Description</Label>
                <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Check day of week" />
            </div>
        </div>
    );
};

// ==================== TIMING/DELAY CONFIGS ====================

export const WaitUntilConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Wait Until Type</Label>
            <Select value={node.data.waitType || 'time'} onValueChange={(v) => updateData('waitType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="time">Specific Time</SelectItem>
                    <SelectItem value="date">Specific Date</SelectItem>
                    <SelectItem value="day_of_week">Day of Week</SelectItem>
                </SelectContent>
            </Select>
        </div>

        {node.data.waitType === 'time' && (
            <div>
                <Label>Time</Label>
                <Input type="time" value={node.data.time || '09:00'} onChange={(e) => updateData('time', e.target.value)} />
            </div>
        )}

        {node.data.waitType === 'date' && (
            <div>
                <Label>Date</Label>
                <Input type="date" value={node.data.date || ''} onChange={(e) => updateData('date', e.target.value)} />
            </div>
        )}

        {node.data.waitType === 'day_of_week' && (
            <div>
                <Label>Day</Label>
                <Select value={node.data.dayOfWeek || 'monday'} onValueChange={(v) => updateData('dayOfWeek', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="tuesday">Tuesday</SelectItem>
                        <SelectItem value="wednesday">Wednesday</SelectItem>
                        <SelectItem value="thursday">Thursday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                        <SelectItem value="saturday">Saturday</SelectItem>
                        <SelectItem value="sunday">Sunday</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        )}

        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Wait until..." />
        </div>
    </div>
);

export const BusinessHoursConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label>Start Time</Label>
                <Input type="time" value={node.data.startTime || '09:00'} onChange={(e) => updateData('startTime', e.target.value)} />
            </div>
            <div>
                <Label>End Time</Label>
                <Input type="time" value={node.data.endTime || '17:00'} onChange={(e) => updateData('endTime', e.target.value)} />
            </div>
        </div>
        <div>
            <Label>Working Days</Label>
            <p className="text-xs text-muted-foreground">Monday - Friday (default)</p>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Wait for business hours" />
        </div>
    </div>
);

export const SplitTestConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Test Name</Label>
            <Input value={node.data.testName || ''} onChange={(e) => updateData('testName', e.target.value)} placeholder="Subject Line Test" />
        </div>
        <div>
            <Label>Variant A Weight (%)</Label>
            <Input type="number" min="0" max="100" value={node.data.variantAWeight || 50} onChange={(e) => updateData('variantAWeight', parseInt(e.target.value))} />
        </div>
        <div>
            <Label>Variant B Weight (%)</Label>
            <Input type="number" min="0" max="100" value={node.data.variantBWeight || 50} onChange={(e) => updateData('variantBWeight', parseInt(e.target.value))} />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="A/B split test" />
        </div>
    </div>
);

export const TriggerCallFlowConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Call Flow</Label>
            <Select value={node.data.callFlowId?.toString() || '__none'} onValueChange={(v) => updateData('callFlowId', v === '__none' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select a call flow..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__none">Select a call flow</SelectItem>
                    <SelectItem value="1">Main Business Line Routing</SelectItem>
                    <SelectItem value="2">Sales Team Queue</SelectItem>
                    <SelectItem value="3">Support IVR Menu</SelectItem>
                    <SelectItem value="4">After Hours Voicemail</SelectItem>
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">The contact will be routed through this call flow when called</p>
        </div>
        <div>
            <Label>Phone Number to Dial</Label>
            <Select value={node.data.phoneSource || 'contact'} onValueChange={(v) => updateData('phoneSource', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="contact">Contact's Phone Number</SelectItem>
                    <SelectItem value="mobile">Contact's Mobile</SelectItem>
                    <SelectItem value="work">Contact's Work Number</SelectItem>
                    <SelectItem value="custom">Custom Number</SelectItem>
                </SelectContent>
            </Select>
        </div>
        {node.data.phoneSource === 'custom' && (
            <div>
                <Label>Custom Phone Number</Label>
                <Input value={node.data.customPhone || ''} onChange={(e) => updateData('customPhone', e.target.value)} placeholder="+1 555 123 4567" />
            </div>
        )}
        <div>
            <Label>Outbound Caller ID</Label>
            <Select value={node.data.callerId || 'default'} onValueChange={(v) => updateData('callerId', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="default">Default Business Number</SelectItem>
                    <SelectItem value="local">Local Presence Number</SelectItem>
                    <SelectItem value="custom">Custom Number</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-center justify-between">
            <div>
                <Label>Record Call</Label>
                <p className="text-xs text-muted-foreground">Record the call for quality and training</p>
            </div>
            <Switch checked={node.data.recordCall || false} onCheckedChange={(v) => updateData('recordCall', v)} />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Route contact through call flow" />
        </div>
    </div>
);

// ==================== ADDITIONAL ACTION CONFIGS ====================

export const SendEmailConfig: React.FC<NodeConfigProps> = ({ node, updateData, templates, sendingAccounts, onAIClick }) => (
    <div className="space-y-4">
        <div>
            <Label>Email Template</Label>
            <Select value={node.data.templateId?.toString() || '__none'} onValueChange={(v) => updateData('templateId', v === '__none' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__none">No Template</SelectItem>
                    {(templates || []).filter(t => t.type === 'email').map(t => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Subject Line</Label>
            <div className="flex items-center gap-2">
                <Input value={node.data.subject || ''} onChange={(e) => updateData('subject', e.target.value)} placeholder="Enter email subject..." />
                {onAIClick && (
                    <Button type="button" variant="outline" size="sm" onClick={() => onAIClick('subject')}>
                        <Sparkles className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Use {"{{first_name}}"} for personalization</p>
        </div>
        <div>
            <Label>Preview Text</Label>
            <div className="flex items-center gap-2">
                <Input value={node.data.previewText || ''} onChange={(e) => updateData('previewText', e.target.value)} placeholder="Preview text shown in inbox..." />
                {onAIClick && (
                    <Button type="button" variant="outline" size="sm" onClick={() => onAIClick('preview')}>
                        <Sparkles className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
        <div>
            <Label>Sending Account</Label>
            <Select value={node.data.sendingAccountId?.toString() || '__none'} onValueChange={(v) => updateData('sendingAccountId', v === '__none' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select sending account..." /></SelectTrigger>
                <SelectContent>
                    {(sendingAccounts || []).map(acc => (
                        <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name} ({acc.email})</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>From Name</Label>
            <Input value={node.data.fromName || ''} onChange={(e) => updateData('fromName', e.target.value)} placeholder="Sender name..." />
        </div>
        <div>
            <Label>Reply-To Email (Optional)</Label>
            <Input value={node.data.replyToEmail || ''} onChange={(e) => updateData('replyToEmail', e.target.value)} placeholder="reply-to@example.com" />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Send email" />
        </div>
    </div>
);

export const SendSMSConfig: React.FC<NodeConfigProps> = ({ node, updateData, templates, onAIClick }) => (
    <div className="space-y-4">
        <div>
            <Label>SMS Template</Label>
            <Select value={node.data.templateId?.toString() || '__none'} onValueChange={(v) => updateData('templateId', v === '__none' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__none">No Template</SelectItem>
                    {(templates || []).filter(t => t.type === 'sms').map(t => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Message</Label>
            <div className="flex items-start gap-2">
                <div className="flex-1">
                    <Textarea value={node.data.message || ''} onChange={(e) => updateData('message', e.target.value)} placeholder="Enter SMS message..." rows={4} />
                </div>
                {onAIClick && (
                    <Button type="button" variant="outline" size="sm" onClick={() => onAIClick('message')}>
                        <Sparkles className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Use {"{{first_name}}"} for personalization. {(node.data.message || '').length}/160 characters</p>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Send SMS" />
        </div>
    </div>
);

export const AddTagConfig: React.FC<NodeConfigProps> = ({ node, updateData, tags }) => (
    <div className="space-y-4">
        <div>
            <Label>Tag</Label>
            <Select value={node.data.tagName || '__none'} onValueChange={(v) => updateData('tagName', v === '__none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select tag..." /></SelectTrigger>
                <SelectContent>
                    {(tags || []).map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input className="mt-2" value={node.data.tagName || ''} onChange={(e) => updateData('tagName', e.target.value)} placeholder="Or type new tag name..." />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Add tag to contact" />
        </div>
    </div>
);

export const RemoveTagConfig: React.FC<NodeConfigProps> = ({ node, updateData, tags }) => (
    <div className="space-y-4">
        <div>
            <Label>Tag to Remove</Label>
            <Select value={node.data.tagName || '__none'} onValueChange={(v) => updateData('tagName', v === '__none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select tag..." /></SelectTrigger>
                <SelectContent>
                    {(tags || []).map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input className="mt-2" value={node.data.tagName || ''} onChange={(e) => updateData('tagName', e.target.value)} placeholder="Or type tag name..." />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Remove tag from contact" />
        </div>
    </div>
);

export const WaitConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label>Duration</Label>
                <Input type="number" min="1" value={node.data.delay || 1} onChange={(e) => updateData('delay', parseInt(e.target.value))} />
            </div>
            <div>
                <Label>Unit</Label>
                <Select value={node.data.delayUnit || 'hours'} onValueChange={(v) => updateData('delayUnit', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder={`Wait ${node.data.delay || 1} ${node.data.delayUnit || 'hours'}`} />
        </div>
    </div>
);

export const WaitForEventConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Event Type</Label>
            <Select value={node.data.eventType || 'email_open'} onValueChange={(v) => updateData('eventType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="email_open">Email Opened</SelectItem>
                    <SelectItem value="email_click">Email Link Clicked</SelectItem>
                    <SelectItem value="email_reply">Email Reply</SelectItem>
                    <SelectItem value="sms_reply">SMS Reply</SelectItem>
                    <SelectItem value="form_submit">Form Submission</SelectItem>
                    <SelectItem value="page_visit">Page Visit</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label>Timeout</Label>
                <Input type="number" min="1" value={node.data.timeout || 24} onChange={(e) => updateData('timeout', parseInt(e.target.value))} />
            </div>
            <div>
                <Label>Unit</Label>
                <Select value={node.data.timeoutUnit || 'hours'} onValueChange={(v) => updateData('timeoutUnit', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <p className="text-xs text-muted-foreground">Continue after this time if event doesn't occur</p>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Wait for event" />
        </div>
    </div>
);

export const SmartDelayConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI will optimize the send time based on contact engagement patterns
            </p>
        </div>
        <div>
            <Label>Optimization Goal</Label>
            <Select value={node.data.optimizeFor || 'open_rate'} onValueChange={(v) => updateData('optimizeFor', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="open_rate">Maximize Open Rate</SelectItem>
                    <SelectItem value="click_rate">Maximize Click Rate</SelectItem>
                    <SelectItem value="reply_rate">Maximize Reply Rate</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label>Maximum Wait</Label>
                <Input type="number" min="1" value={node.data.maxWait || 24} onChange={(e) => updateData('maxWait', parseInt(e.target.value))} />
            </div>
            <div>
                <Label>Unit</Label>
                <Select value={node.data.maxWaitUnit || 'hours'} onValueChange={(v) => updateData('maxWaitUnit', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Smart delay - AI optimized" />
        </div>
    </div>
);

export const HasTagConfig: React.FC<NodeConfigProps> = ({ node, updateData, tags }) => (
    <div className="space-y-4">
        <div>
            <Label>Check for Tag</Label>
            <Select value={node.data.tagName || '__none'} onValueChange={(v) => updateData('tagName', v === '__none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select tag..." /></SelectTrigger>
                <SelectContent>
                    {(tags || []).map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input className="mt-2" value={node.data.tagName || ''} onChange={(e) => updateData('tagName', e.target.value)} placeholder="Or type tag name..." />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Check if contact has tag" />
        </div>
    </div>
);

export const LeadScoreConditionConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Operator</Label>
            <Select value={node.data.operator || 'greater_than'} onValueChange={(v) => updateData('operator', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="greater_than">Greater Than</SelectItem>
                    <SelectItem value="less_than">Less Than</SelectItem>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="between">Between</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Score Value</Label>
            <Input type="number" value={node.data.scoreValue || 50} onChange={(e) => updateData('scoreValue', parseInt(e.target.value))} />
        </div>
        {node.data.operator === 'between' && (
            <div>
                <Label>Max Score Value</Label>
                <Input type="number" value={node.data.scoreValueMax || 100} onChange={(e) => updateData('scoreValueMax', parseInt(e.target.value))} />
            </div>
        )}
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Check lead score" />
        </div>
    </div>
);

export const ContactAgeConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Operator</Label>
            <Select value={node.data.operator || 'greater_than'} onValueChange={(v) => updateData('operator', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="greater_than">Greater Than</SelectItem>
                    <SelectItem value="less_than">Less Than</SelectItem>
                    <SelectItem value="equals">Equals</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label>Days</Label>
                <Input type="number" value={node.data.days || 30} onChange={(e) => updateData('days', parseInt(e.target.value))} />
            </div>
            <div>
                <Label>Since</Label>
                <Select value={node.data.since || 'created'} onValueChange={(v) => updateData('since', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="created">Contact Created</SelectItem>
                        <SelectItem value="updated">Last Updated</SelectItem>
                        <SelectItem value="activity">Last Activity</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Check contact age" />
        </div>
    </div>
);

export const ContactOwnerConfig: React.FC<NodeConfigProps> = ({ node, updateData, users }) => (
    <div className="space-y-4">
        <div>
            <Label>Owner</Label>
            <Select value={node.data.userId?.toString() || '__any'} onValueChange={(v) => updateData('userId', v === '__any' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select owner..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__any">Any Owner</SelectItem>
                    <SelectItem value="__none">No Owner (Unassigned)</SelectItem>
                    {(users || []).map(u => (
                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Check contact owner" />
        </div>
    </div>
);

export const EmailActivityConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Activity Type</Label>
            <Select value={node.data.activityType || 'opened'} onValueChange={(v) => updateData('activityType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="opened">Has Opened</SelectItem>
                    <SelectItem value="clicked">Has Clicked</SelectItem>
                    <SelectItem value="not_opened">Has Not Opened</SelectItem>
                    <SelectItem value="not_clicked">Has Not Clicked</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>In Last (Days)</Label>
            <Input type="number" value={node.data.days || 30} onChange={(e) => updateData('days', parseInt(e.target.value))} />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Check email activity" />
        </div>
    </div>
);

export const InCampaignConfig: React.FC<NodeConfigProps> = ({ node, updateData, campaigns }) => (
    <div className="space-y-4">
        <div>
            <Label>Campaign</Label>
            <Select value={node.data.campaignId?.toString() || '__any'} onValueChange={(v) => updateData('campaignId', v === '__any' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select campaign..." /></SelectTrigger>
                <SelectContent>
                    {(campaigns || []).map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Status</Label>
            <Select value={node.data.status || 'active'} onValueChange={(v) => updateData('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="active">Active in Campaign</SelectItem>
                    <SelectItem value="completed">Completed Campaign</SelectItem>
                    <SelectItem value="paused">Paused in Campaign</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Check campaign membership" />
        </div>
    </div>
);

export const PurchaseHistoryConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Condition</Label>
            <Select value={node.data.condition || 'has_purchased'} onValueChange={(v) => updateData('condition', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="has_purchased">Has Made Purchase</SelectItem>
                    <SelectItem value="no_purchase">No Purchase Yet</SelectItem>
                    <SelectItem value="purchase_count">Purchase Count</SelectItem>
                    <SelectItem value="total_spent">Total Spent</SelectItem>
                </SelectContent>
            </Select>
        </div>
        {node.data.condition === 'purchase_count' && (
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Operator</Label>
                    <Select value={node.data.operator || 'greater_than'} onValueChange={(v) => updateData('operator', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                            <SelectItem value="equals">Equals</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Count</Label>
                    <Input type="number" value={node.data.count || 1} onChange={(e) => updateData('count', parseInt(e.target.value))} />
                </div>
            </div>
        )}
        {node.data.condition === 'total_spent' && (
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Operator</Label>
                    <Select value={node.data.operator || 'greater_than'} onValueChange={(v) => updateData('operator', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Amount ($)</Label>
                    <Input type="number" value={node.data.amount || 100} onChange={(e) => updateData('amount', parseFloat(e.target.value))} />
                </div>
            </div>
        )}
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Check purchase history" />
        </div>
    </div>
);

export const GoToStepConfig: React.FC<NodeConfigProps> = ({ node, updateData, flowNodes }) => (
    <div className="space-y-4">
        <div>
            <Label>Go To Step</Label>
            <Select value={node.data.targetNodeId || '__none'} onValueChange={(v) => updateData('targetNodeId', v === '__none' ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Select step..." /></SelectTrigger>
                <SelectContent>
                    {(flowNodes || []).filter(n => n.id !== node.id).map(n => (
                        <SelectItem key={n.id} value={n.id}>{n.data.label || n.subType}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">This will jump the contact to the selected step in the flow.</p>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Go to step" />
        </div>
    </div>
);

export const EndFlowConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">This will end the flow for the contact. They will not receive any further actions from this flow.</p>
        </div>
        <div>
            <Label>End Reason (Optional)</Label>
            <Select value={node.data.reason || 'completed'} onValueChange={(v) => updateData('reason', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="goal_met">Goal Met</SelectItem>
                    <SelectItem value="unqualified">Unqualified</SelectItem>
                    <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="End flow" />
        </div>
    </div>
);

export const StartSubflowConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Subflow</Label>
            <Select value={node.data.subflowId?.toString() || '__none'} onValueChange={(v) => updateData('subflowId', v === '__none' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select subflow..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="__none">Select a flow</SelectItem>
                    <SelectItem value="1">Welcome Series</SelectItem>
                    <SelectItem value="2">Re-engagement Flow</SelectItem>
                    <SelectItem value="3">Post-Purchase Follow-up</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-center justify-between">
            <div>
                <Label>Wait for Completion</Label>
                <p className="text-xs text-muted-foreground">Wait for subflow to complete before continuing</p>
            </div>
            <Switch checked={node.data.waitForCompletion || false} onCheckedChange={(v) => updateData('waitForCompletion', v)} />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Start subflow" />
        </div>
    </div>
);

export const ArchiveContactConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">⚠️ This will archive the contact. They will be hidden from regular views but can be restored.</p>
        </div>
        <div>
            <Label>Archive Reason</Label>
            <Select value={node.data.reason || 'inactive'} onValueChange={(v) => updateData('reason', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                    <SelectItem value="bounced">Email Bounced</SelectItem>
                    <SelectItem value="duplicate">Duplicate</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Archive contact" />
        </div>
    </div>
);

export const DeleteContactConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">⚠️ DANGER: This will permanently delete the contact and all their data. This action cannot be undone!</p>
        </div>
        <div className="flex items-center justify-between">
            <div>
                <Label>Confirm Deletion</Label>
                <p className="text-xs text-muted-foreground">I understand this is permanent</p>
            </div>
            <Switch checked={node.data.confirmed || false} onCheckedChange={(v) => updateData('confirmed', v)} />
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Delete contact" />
        </div>
    </div>
);

export const EvenSplitConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Number of Paths</Label>
            <Select value={(node.data.pathCount || 2).toString()} onValueChange={(v) => updateData('pathCount', parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="2">2 Paths (50/50)</SelectItem>
                    <SelectItem value="3">3 Paths (33/33/33)</SelectItem>
                    <SelectItem value="4">4 Paths (25/25/25/25)</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Contacts will be evenly distributed across all paths.</p>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Even split" />
        </div>
    </div>
);

export const MultivariateTestConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div>
            <Label>Test Name</Label>
            <Input value={node.data.testName || ''} onChange={(e) => updateData('testName', e.target.value)} placeholder="My Multivariate Test" />
        </div>
        <div>
            <Label>Number of Variants</Label>
            <Select value={(node.data.variantCount || 3).toString()} onValueChange={(v) => updateData('variantCount', parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="3">3 Variants</SelectItem>
                    <SelectItem value="4">4 Variants</SelectItem>
                    <SelectItem value="5">5 Variants</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Winning Metric</Label>
            <Select value={node.data.winningMetric || 'open_rate'} onValueChange={(v) => updateData('winningMetric', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="open_rate">Open Rate</SelectItem>
                    <SelectItem value="click_rate">Click Rate</SelectItem>
                    <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Multivariate test" />
        </div>
    </div>
);

// ==================== ADVANCED AUTOMATION CONFIGS (Zapier/n8n Style) ====================

export const HTTPRequestConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => {
    const headers = node.data.headers || [{ key: '', value: '' }];

    const addHeader = () => {
        updateData('headers', [...headers, { key: '', value: '' }]);
    };

    const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
        const newHeaders = [...headers];
        newHeaders[index] = { ...newHeaders[index], [field]: value };
        updateData('headers', newHeaders);
    };

    const removeHeader = (index: number) => {
        const newHeaders = headers.filter((_: any, i: number) => i !== index);
        updateData('headers', newHeaders.length ? newHeaders : [{ key: '', value: '' }]);
    };

    return (
        <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Make HTTP requests to any REST API - similar to Zapier/n8n webhooks
                </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                    <Label>Method</Label>
                    <Select value={node.data.method || 'GET'} onValueChange={(v) => updateData('method', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="PATCH">PATCH</SelectItem>
                            <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-2">
                    <Label>URL</Label>
                    <Input
                        value={node.data.url || ''}
                        onChange={(e) => updateData('url', e.target.value)}
                        placeholder="https://api.example.com/endpoint"
                    />
                </div>
            </div>

            <div>
                <Label>Authentication</Label>
                <Select value={node.data.authType || 'none'} onValueChange={(v) => updateData('authType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">No Authentication</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                        <SelectItem value="api_key">API Key</SelectItem>
                        <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {node.data.authType === 'bearer' && (
                <div>
                    <Label>Bearer Token</Label>
                    <Input
                        type="password"
                        value={node.data.bearerToken || ''}
                        onChange={(e) => updateData('bearerToken', e.target.value)}
                        placeholder="Enter your bearer token..."
                    />
                </div>
            )}

            {node.data.authType === 'basic' && (
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label>Username</Label>
                        <Input
                            value={node.data.basicUsername || ''}
                            onChange={(e) => updateData('basicUsername', e.target.value)}
                            placeholder="Username"
                        />
                    </div>
                    <div>
                        <Label>Password</Label>
                        <Input
                            type="password"
                            value={node.data.basicPassword || ''}
                            onChange={(e) => updateData('basicPassword', e.target.value)}
                            placeholder="Password"
                        />
                    </div>
                </div>
            )}

            {node.data.authType === 'api_key' && (
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label>Header Name</Label>
                        <Input
                            value={node.data.apiKeyHeader || 'X-API-Key'}
                            onChange={(e) => updateData('apiKeyHeader', e.target.value)}
                            placeholder="X-API-Key"
                        />
                    </div>
                    <div>
                        <Label>API Key</Label>
                        <Input
                            type="password"
                            value={node.data.apiKeyValue || ''}
                            onChange={(e) => updateData('apiKeyValue', e.target.value)}
                            placeholder="Your API key"
                        />
                    </div>
                </div>
            )}

            <div>
                <div className="flex items-center justify-between mb-2">
                    <Label>Headers</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addHeader}>
                        <Plus className="h-3 w-3 mr-1" /> Add Header
                    </Button>
                </div>
                <div className="space-y-2">
                    {headers.map((header: { key: string; value: string }, index: number) => (
                        <div key={index} className="flex gap-2">
                            <Input
                                placeholder="Header name"
                                value={header.key}
                                onChange={(e) => updateHeader(index, 'key', e.target.value)}
                                className="flex-1"
                            />
                            <Input
                                placeholder="Value (use {{step.field}} for variables)"
                                value={header.value}
                                onChange={(e) => updateHeader(index, 'value', e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeHeader(index)}
                                className="shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {['POST', 'PUT', 'PATCH'].includes(node.data.method || 'GET') && (
                <div>
                    <Label>Request Body</Label>
                    <Select value={node.data.bodyType || 'json'} onValueChange={(v) => updateData('bodyType', v)}>
                        <SelectTrigger className="mb-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="json">JSON</SelectItem>
                            <SelectItem value="form">Form Data</SelectItem>
                            <SelectItem value="raw">Raw</SelectItem>
                        </SelectContent>
                    </Select>
                    <Textarea
                        value={node.data.body || ''}
                        onChange={(e) => updateData('body', e.target.value)}
                        placeholder={node.data.bodyType === 'json' ? '{\n  "key": "{{contact.email}}",\n  "data": "{{step_1.result}}"\n}' : 'key=value&other={{variable}}'}
                        rows={6}
                        className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Use {"{{contact.field}}"} for contact data or {"{{step_N.field}}"} for data from previous steps
                    </p>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <Label>Continue on Error</Label>
                    <p className="text-xs text-muted-foreground">Continue workflow even if request fails</p>
                </div>
                <Switch
                    checked={node.data.continueOnError || false}
                    onCheckedChange={(v) => updateData('continueOnError', v)}
                />
            </div>

            <div className="border-t pt-4">
                <Button type="button" variant="outline" className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Test Request
                </Button>
            </div>

            <div>
                <Label>Description</Label>
                <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="HTTP Request to external API" />
            </div>
        </div>
    );
};

export const RunCodeConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Code className="h-4 w-4" />
                Execute custom code to transform data or implement complex logic (like n8n Code node)
            </p>
        </div>

        <div>
            <Label>Language</Label>
            <Select value={node.data.language || 'javascript'} onValueChange={(v) => updateData('language', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="javascript">JavaScript (Node.js)</SelectItem>
                    <SelectItem value="python">Python 3</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div>
            <Label>Code</Label>
            <Textarea
                value={node.data.code || (node.data.language === 'python'
                    ? '# Access previous step data with: input_data\n# Return data with: return {"result": "value"}\n\nresult = input_data.get("email", "").lower()\nreturn {"processed_email": result}'
                    : '// Access previous step data with: input\n// Return data with: return { result: value }\n\nconst email = input.email || "";\nreturn { processedEmail: email.toLowerCase() };'
                )}
                onChange={(e) => updateData('code', e.target.value)}
                rows={12}
                className="font-mono text-sm bg-slate-950 text-green-400 dark:bg-slate-900"
            />
            <p className="text-xs text-muted-foreground mt-1">
                Access data from previous steps via the <code className="bg-muted px-1 rounded">input</code> object
            </p>
        </div>

        <div>
            <Label>Available Variables</Label>
            <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">input.contact</Badge>
                <Badge variant="secondary" className="text-xs">input.step_1</Badge>
                <Badge variant="secondary" className="text-xs">input.step_2</Badge>
                <Badge variant="secondary" className="text-xs">input.workflow</Badge>
            </div>
        </div>

        <div className="flex items-center justify-between">
            <div>
                <Label>Timeout (seconds)</Label>
            </div>
            <Input
                type="number"
                min="1"
                max="60"
                value={node.data.timeout || 10}
                onChange={(e) => updateData('timeout', parseInt(e.target.value))}
                className="w-24"
            />
        </div>

        <div className="flex items-center justify-between">
            <div>
                <Label>Continue on Error</Label>
                <p className="text-xs text-muted-foreground">Continue workflow if code throws error</p>
            </div>
            <Switch
                checked={node.data.continueOnError || false}
                onCheckedChange={(v) => updateData('continueOnError', v)}
            />
        </div>

        <div className="border-t pt-4">
            <Button type="button" variant="outline" className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Test Code
            </Button>
        </div>

        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Run custom code" />
        </div>
    </div>
);

export const AIAssistantConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Use AI to analyze, transform, or generate content based on workflow data
            </p>
        </div>

        <div>
            <Label>AI Model</Label>
            <Select value={node.data.model || 'gpt-4'} onValueChange={(v) => updateData('model', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="gpt-4">GPT-4 (Most Capable)</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</SelectItem>
                    <SelectItem value="claude-3">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div>
            <Label>Task Type</Label>
            <Select value={node.data.taskType || 'custom'} onValueChange={(v) => updateData('taskType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="custom">Custom Prompt</SelectItem>
                    <SelectItem value="summarize">Summarize Text</SelectItem>
                    <SelectItem value="classify">Classify/Categorize</SelectItem>
                    <SelectItem value="extract">Extract Information</SelectItem>
                    <SelectItem value="generate">Generate Content</SelectItem>
                    <SelectItem value="translate">Translate</SelectItem>
                    <SelectItem value="sentiment">Analyze Sentiment</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div>
            <Label>Prompt / Instructions</Label>
            <Textarea
                value={node.data.prompt || ''}
                onChange={(e) => updateData('prompt', e.target.value)}
                placeholder="Analyze the following customer inquiry and categorize it as: billing, technical, sales, or other.\n\nInquiry: {{step_1.message}}"
                rows={6}
            />
            <p className="text-xs text-muted-foreground mt-1">
                Use {"{{step_N.field}}"} to include data from previous steps
            </p>
        </div>

        <div>
            <Label>Output Format</Label>
            <Select value={node.data.outputFormat || 'text'} onValueChange={(v) => updateData('outputFormat', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="text">Plain Text</SelectItem>
                    <SelectItem value="json">JSON Object</SelectItem>
                    <SelectItem value="array">Array/List</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label>Temperature</Label>
                <Input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={node.data.temperature || 0.7}
                    onChange={(e) => updateData('temperature', parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">0 = precise, 1 = creative</p>
            </div>
            <div>
                <Label>Max Tokens</Label>
                <Input
                    type="number"
                    min="50"
                    max="4000"
                    value={node.data.maxTokens || 500}
                    onChange={(e) => updateData('maxTokens', parseInt(e.target.value))}
                />
            </div>
        </div>

        <div>
            <Label>Description</Label>
            <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="AI Assistant" />
        </div>
    </div>
);

export const DataTransformerConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => {
    const mappings = node.data.mappings || [{ source: '', target: '', transform: 'copy' }];

    const addMapping = () => {
        updateData('mappings', [...mappings, { source: '', target: '', transform: 'copy' }]);
    };

    const updateMapping = (index: number, field: string, value: string) => {
        const newMappings = [...mappings];
        newMappings[index] = { ...newMappings[index], [field]: value };
        updateData('mappings', newMappings);
    };

    const removeMapping = (index: number) => {
        const newMappings = mappings.filter((_: any, i: number) => i !== index);
        updateData('mappings', newMappings.length ? newMappings : [{ source: '', target: '', transform: 'copy' }]);
    };

    return (
        <div className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                    Map and transform data between steps - similar to Zapier's Formatter
                </p>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <Label>Field Mappings</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addMapping}>
                        <Plus className="h-3 w-3 mr-1" /> Add Mapping
                    </Button>
                </div>

                <div className="space-y-3">
                    {mappings.map((mapping: { source: string; target: string; transform: string }, index: number) => (
                        <div key={index} className="p-3 border rounded-lg space-y-2">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Label className="text-xs">Source</Label>
                                    <Input
                                        placeholder="{{step_1.email}}"
                                        value={mapping.source}
                                        onChange={(e) => updateMapping(index, 'source', e.target.value)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label className="text-xs">Target Field</Label>
                                    <Input
                                        placeholder="processed_email"
                                        value={mapping.target}
                                        onChange={(e) => updateMapping(index, 'target', e.target.value)}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeMapping(index)}
                                    className="shrink-0 mt-5"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div>
                                <Label className="text-xs">Transform</Label>
                                <Select value={mapping.transform} onValueChange={(v) => updateMapping(index, 'transform', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="copy">Copy (No Change)</SelectItem>
                                        <SelectItem value="lowercase">Lowercase</SelectItem>
                                        <SelectItem value="uppercase">Uppercase</SelectItem>
                                        <SelectItem value="trim">Trim Whitespace</SelectItem>
                                        <SelectItem value="split">Split by Delimiter</SelectItem>
                                        <SelectItem value="join">Join Array</SelectItem>
                                        <SelectItem value="parse_json">Parse JSON</SelectItem>
                                        <SelectItem value="stringify">Stringify JSON</SelectItem>
                                        <SelectItem value="date_format">Format Date</SelectItem>
                                        <SelectItem value="number">Convert to Number</SelectItem>
                                        <SelectItem value="boolean">Convert to Boolean</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <Label>Description</Label>
                <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Transform data" />
            </div>
        </div>
    );
};

export const SetVariableConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => {
    const variables = node.data.variables || [{ name: '', value: '', scope: 'workflow' }];

    const addVariable = () => {
        updateData('variables', [...variables, { name: '', value: '', scope: 'workflow' }]);
    };

    const updateVariable = (index: number, field: string, value: string) => {
        const newVariables = [...variables];
        newVariables[index] = { ...newVariables[index], [field]: value };
        updateData('variables', newVariables);
    };

    const removeVariable = (index: number) => {
        const newVariables = variables.filter((_: any, i: number) => i !== index);
        updateData('variables', newVariables.length ? newVariables : [{ name: '', value: '', scope: 'workflow' }]);
    };

    return (
        <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                    <Variable className="h-4 w-4" />
                    Set workflow variables that can be used in later steps
                </p>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <Label>Variables</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addVariable}>
                        <Plus className="h-3 w-3 mr-1" /> Add Variable
                    </Button>
                </div>

                <div className="space-y-2">
                    {variables.map((variable: { name: string; value: string; scope: string }, index: number) => (
                        <div key={index} className="flex gap-2">
                            <Input
                                placeholder="variable_name"
                                value={variable.name}
                                onChange={(e) => updateVariable(index, 'name', e.target.value)}
                                className="flex-1"
                            />
                            <Input
                                placeholder="Value or {{step.field}}"
                                value={variable.value}
                                onChange={(e) => updateVariable(index, 'value', e.target.value)}
                                className="flex-1"
                            />
                            <Select value={variable.scope} onValueChange={(v) => updateVariable(index, 'scope', v)}>
                                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="workflow">Workflow</SelectItem>
                                    <SelectItem value="contact">Contact</SelectItem>
                                    <SelectItem value="global">Global</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeVariable(index)}
                                className="shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Reference variables in later steps with {"{{var.variable_name}}"}
                </p>
            </div>

            <div>
                <Label>Description</Label>
                <Input value={node.data.label || ''} onChange={(e) => updateData('label', e.target.value)} placeholder="Set variables" />
            </div>
        </div>
    );
};

export const GenericNodeConfig: React.FC<NodeConfigProps> = ({ node, updateData }) => (
    <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
            Configure the settings for this <strong>{(node.subType || 'unknown').replace(/_/g, ' ')}</strong> step.
        </div>

        <div>
            <Label>Label / Description</Label>
            <Input
                value={node.data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
                placeholder="Step description"
            />
        </div>

        <div className="space-y-2">
            <Label>Additional Data (JSON)</Label>
            <Textarea
                value={JSON.stringify(
                    Object.fromEntries(Object.entries(node.data).filter(([k]) => !['label', 'subject', 'message', 'previewText'].includes(k))),
                    null, 2
                )}
                onChange={(e) => {
                    try {
                        const parsed = JSON.parse(e.target.value);
                        updateData('json_data', parsed); // Special handling in updateData for this
                    } catch (err) {
                        // ignore invalid JSON while typing
                    }
                }}
                rows={5}
                className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">Advanced configuration</p>
        </div>
    </div>
);

// Export all configs
export const NODE_CONFIGS: Record<string, React.FC<NodeConfigProps>> = {
    // Triggers - Contact
    contact_added: ContactAddedConfig,
    contact_updated: ContactUpdatedConfig,
    contact_deleted: ContactDeletedConfig,
    tag_added: TagAddedConfig,
    tag_removed: TagRemovedConfig,
    lead_score_changed: LeadScoreChangedConfig,

    // Triggers - Email
    email_opened: EmailOpenedConfig,
    email_clicked: EmailClickedConfig,
    email_replied: EmailRepliedConfig,
    email_bounced: EmailBouncedConfig,
    email_unsubscribed: EmailUnsubscribedConfig,
    email_complained: EmailComplainedConfig,

    // Triggers - SMS
    sms_replied: SMSRepliedConfig,
    sms_delivered: SMSDeliveredConfig,
    sms_failed: SMSFailedConfig,
    sms_opted_out: SMSOptedOutConfig,

    // Triggers - Call
    call_completed: CallCompletedConfig,
    call_missed: CallMissedConfig,
    voicemail_left: VoicemailLeftConfig,

    // Triggers - Form & Page
    form_submitted: FormSubmittedConfig,
    page_visited: PageVisitedConfig,
    landing_page_conversion: LandingPageConversionConfig,

    // Triggers - E-commerce
    purchase_made: PurchaseMadeConfig,
    cart_abandoned: CartAbandonedConfig,
    product_viewed: ProductViewedConfig,
    refund_requested: RefundRequestedConfig,

    // Triggers - Date & Time
    date_trigger: DateTriggerConfig,
    birthday_trigger: BirthdayTriggerConfig,
    anniversary_trigger: AnniversaryTriggerConfig,
    inactivity_trigger: InactivityTriggerConfig,

    // Triggers - Integration
    webhook_received: WebhookReceivedConfig,
    api_event: APIEventConfig,
    zapier_trigger: ZapierTriggerConfig,

    // Triggers - Manual
    manual: ManualTriggerConfig,
    segment_entry: SegmentEntryConfig,

    // Actions - Email
    send_email: SendEmailConfig,
    send_email_sequence: SendEmailSequenceConfig,

    // Actions - SMS
    send_sms: SendSMSConfig,

    // Actions - Tags
    add_tag: AddTagConfig,
    remove_tag: RemoveTagConfig,

    // Actions - Contact Management
    update_field: UpdateFieldConfig,
    update_lead_score: UpdateLeadScoreConfig,
    change_status: ChangeStatusConfig,
    assign_owner: AssignOwnerConfig,
    copy_to_list: CopyToListConfig,
    move_to_list: CopyToListConfig,
    remove_from_list: CopyToListConfig,
    archive_contact: ArchiveContactConfig,
    delete_contact: DeleteContactConfig,

    // Actions - Campaign
    add_to_campaign: AddToCampaignConfig,
    remove_from_campaign: AddToCampaignConfig,

    // Actions - CRM
    create_task: CreateTaskConfig,
    create_deal: CreateDealConfig,

    // Actions - Notification
    notify_team: NotifyTeamConfig,

    // Actions - Integration (Advanced Automation - Zapier/n8n Style)
    webhook: WebhookActionConfig,
    http_request: HTTPRequestConfig,
    run_code: RunCodeConfig,
    ai_assistant: AIAssistantConfig,
    data_transformer: DataTransformerConfig,
    set_variable: SetVariableConfig,
    track_conversion: TrackConversionConfig,

    // Actions - Call
    make_call: MakeCallConfig,
    schedule_call: ScheduleCallConfig,
    send_voicemail: SendVoicemailConfig,
    trigger_call_flow: TriggerCallFlowConfig,

    // Actions - Flow Control
    go_to_step: GoToStepConfig,
    end_flow: EndFlowConfig,
    start_subflow: StartSubflowConfig,

    // Conditions
    if_else: IfElseConfig,
    has_tag: HasTagConfig,
    field_value: FieldValueConditionConfig,
    lead_score: LeadScoreConditionConfig,
    contact_age: ContactAgeConfig,
    list_membership: ListMembershipConfig,
    contact_owner: ContactOwnerConfig,
    email_activity: EmailActivityConfig,
    in_campaign: InCampaignConfig,
    purchase_history: PurchaseHistoryConfig,
    random_split: RandomSplitConfig,
    even_split: EvenSplitConfig,
    time_of_day: TimeOfDayConfig,
    day_of_week: DayOfWeekConfig,

    // Timing/Delay
    wait: WaitConfig,
    wait_until: WaitUntilConfig,
    wait_for_event: WaitForEventConfig,
    smart_delay: SmartDelayConfig,
    business_hours: BusinessHoursConfig,
    split_test: SplitTestConfig,
    multivariate_test: MultivariateTestConfig,
};
