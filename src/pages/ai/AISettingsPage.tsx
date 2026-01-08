import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Loader2, Bot, Phone, BarChart3, MessageSquare, Save } from 'lucide-react';
import { aiSettingsApi, AISettings } from '@/services/aiSettingsApi';

export default function AISettingsPage() {
    const [settings, setSettings] = useState<AISettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await aiSettingsApi.getSettings();
            setSettings(data);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to load AI settings',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;

        try {
            setSaving(true);
            await aiSettingsApi.updateSettings(settings);
            toast({
                title: 'Success',
                description: 'AI settings updated successfully',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to update settings',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key: keyof AISettings, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: value });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Failed to load settings</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span className="cursor-pointer hover:text-primary" onClick={() => navigate('/dashboard')}>Dashboard</span>
                <span>/</span>
                <span className="cursor-pointer hover:text-primary" onClick={() => navigate('/ai/agents')}>AI Agents</span>
                <span>/</span>
                <span className="text-foreground font-medium">Settings</span>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">AI Features Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Configure AI-powered features for your workspace
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* AI Chatbot */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-primary" />
                            <CardTitle>AI Chatbot</CardTitle>
                        </div>
                        <CardDescription>
                            Automated customer engagement with AI-powered chatbot
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="chatbot-enabled">Enable AI Chatbot</Label>
                            <Switch
                                id="chatbot-enabled"
                                checked={settings.chatbot_enabled}
                                onCheckedChange={(checked) => updateSetting('chatbot_enabled', checked)}
                            />
                        </div>

                        {settings.chatbot_enabled && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="chatbot-name">Chatbot Name</Label>
                                    <Input
                                        id="chatbot-name"
                                        value={settings.chatbot_name}
                                        onChange={(e) => updateSetting('chatbot_name', e.target.value)}
                                        placeholder="AI Assistant"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="chatbot-greeting">Greeting Message</Label>
                                    <Textarea
                                        id="chatbot-greeting"
                                        value={settings.chatbot_greeting || ''}
                                        onChange={(e) => updateSetting('chatbot_greeting', e.target.value)}
                                        placeholder="Hello! How can I help you today?"
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="chatbot-model">AI Model</Label>
                                    <Select
                                        value={settings.chatbot_model}
                                        onValueChange={(value) => updateSetting('chatbot_model', value)}
                                    >
                                        <SelectTrigger id="chatbot-model">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gpt-4">GPT-4 (Most Capable)</SelectItem>
                                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</SelectItem>
                                            <SelectItem value="claude-3">Claude 3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="auto-response-delay">Auto-Response Delay (seconds)</Label>
                                    <Input
                                        id="auto-response-delay"
                                        type="number"
                                        value={settings.auto_response_delay}
                                        onChange={(e) => updateSetting('auto_response_delay', parseInt(e.target.value))}
                                        min="0"
                                        max="10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="escalation-keywords">Escalation Keywords (comma separated)</Label>
                                    <Input
                                        id="escalation-keywords"
                                        value={Array.isArray(settings.escalation_keywords) ? settings.escalation_keywords.join(', ') : settings.escalation_keywords || ''}
                                        onChange={(e) => updateSetting('escalation_keywords', e.target.value.split(',').map(s => s.trim()))}
                                        placeholder="human, operator, help, support"
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* AI Call Answering */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Phone className="h-5 w-5 text-primary" />
                            <CardTitle>AI Call Answering</CardTitle>
                        </div>
                        <CardDescription>
                            24/7 automated call answering and routing
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="call-answering-enabled">Enable AI Call Answering</Label>
                            <Switch
                                id="call-answering-enabled"
                                checked={settings.call_answering_enabled}
                                onCheckedChange={(checked) => updateSetting('call_answering_enabled', checked)}
                            />
                        </div>

                        {settings.call_answering_enabled && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="call-hours-start">Start Time</Label>
                                        <Input
                                            id="call-hours-start"
                                            type="time"
                                            value={settings.call_hours_start || '09:00'}
                                            onChange={(e) => updateSetting('call_hours_start', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="call-hours-end">End Time</Label>
                                        <Input
                                            id="call-hours-end"
                                            type="time"
                                            value={settings.call_hours_end || '17:00'}
                                            onChange={(e) => updateSetting('call_hours_end', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="call-timezone">Timezone</Label>
                                    <Select
                                        value={settings.call_timezone || 'America/New_York'}
                                        onValueChange={(value) => updateSetting('call_timezone', value)}
                                    >
                                        <SelectTrigger id="call-timezone">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                                            <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                                            <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                                            <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                                            <SelectItem value="UTC">UTC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Outside these hours, calls will go to voicemail or be handled by AI.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* AI Analytics & Insights */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <CardTitle>AI Analytics & Insights</CardTitle>
                        </div>
                        <CardDescription>
                            Predictive insights and business intelligence
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="analytics-enabled">Enable AI Analytics</Label>
                            <Switch
                                id="analytics-enabled"
                                checked={settings.analytics_insights_enabled}
                                onCheckedChange={(checked) => updateSetting('analytics_insights_enabled', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Conversation Booking */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            <CardTitle>AI Conversation Booking</CardTitle>
                        </div>
                        <CardDescription>
                            Automated appointment booking through conversations
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="booking-enabled">Enable Conversation Booking</Label>
                            <Switch
                                id="booking-enabled"
                                checked={settings.conversation_booking_enabled}
                                onCheckedChange={(checked) => updateSetting('conversation_booking_enabled', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Facebook Messenger */}
                <Card>
                    <CardHeader>
                        <CardTitle>Facebook Messenger</CardTitle>
                        <CardDescription>
                            Integrate with Facebook Messenger
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="messenger-enabled">Enable Facebook Messenger</Label>
                            <Switch
                                id="messenger-enabled"
                                checked={settings.facebook_messenger_enabled}
                                onCheckedChange={(checked) => updateSetting('facebook_messenger_enabled', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Business Context */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Business Context</CardTitle>
                        <CardDescription>
                            Provide context about your business to improve AI responses
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={settings.business_context || ''}
                            onChange={(e) => updateSetting('business_context', e.target.value)}
                            placeholder="Describe your business, products, services, and key information that AI should know..."
                            rows={6}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
