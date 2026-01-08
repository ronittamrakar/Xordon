import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    Phone,
    Clock,
    Zap,
    ShieldCheck,
    AlertCircle,
    Smartphone,
    Volume2,
    Mic2,
    Timer,
    Hash,
    Globe,
    Plus,
    Trash2,
    Save,
    CheckCircle2,
    Loader2,
    Search,
    Building,
    PhoneCall,
    Settings2,
    ArrowRightLeft,
    VolumeX
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';

const SMSAndCallsSettings = () => {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // SMS Settings State
    const [smsSettings, setSmsSettings] = useState({
        signalwireProjectId: '',
        signalwireSpaceUrl: '',
        signalwireApiToken: '',
        defaultSenderNumber: '',
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: 'UTC',
        averageDelay: 30,
        sendingPriority: 'followups_first',
        retryAttempts: 3,
        retryDelay: 5,
        unsubscribeKeywords: ['STOP', 'UNSUBSCRIBE', 'QUIT', 'CANCEL', 'OPT-OUT'] as string[],
        enableQuietHours: true,
        enableRetries: true
    });

    // Call Settings State
    const [callSettings, setCallSettings] = useState({
        provider: 'signalwire' as 'signalwire' | 'twilio' | 'nexmo',
        defaultCallerId: '+1234567890',
        maxRetries: 3,
        retryDelay: 30,
        callTimeout: 30,
        recordingEnabled: true,
        voicemailEnabled: true,
        autoDialingEnabled: false,
        callQueueSize: 10,
        timezone: 'America/New_York',
        workingHoursEnabled: true,
        workingHoursStart: '09:00',
        workingHoursEnd: '17:00',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        callDelay: 60,
        maxCallsPerHour: 60,
        callSpacing: 5,
        dncCheckEnabled: true,
        consentRequired: true,
        autoOptOut: true,
        consentMessage: "By continuing this call, you consent to receiving calls from our company. To opt out, press 9 or say 'stop calling'."
    });

    // Connection Testing State
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [isFetchingNumbers, setIsFetchingNumbers] = useState(false);
    const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
    const [purchasedNumbers, setPurchasedNumbers] = useState<any[]>([]);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [searchParams, setSearchParams] = useState({ areaCode: '', type: 'local' });
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState<any>(null);
    const [isNumberSettingsOpen, setIsNumberSettingsOpen] = useState(false);
    const [numberToEdit, setNumberToEdit] = useState<any>(null);

    // Load settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const smsData = await api.getSMSSettings();
                if (smsData) {
                    const processed = { ...smsData };
                    if (typeof processed.unsubscribeKeywords === 'string') {
                        processed.unsubscribeKeywords = processed.unsubscribeKeywords.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
                    }
                    setSmsSettings(prev => ({ ...prev, ...processed }));
                }

                const callData = await api.getCallSettings();
                if (callData) {
                    setCallSettings(prev => ({
                        ...prev,
                        provider: callData.provider || prev.provider,
                        defaultCallerId: callData.defaultCallerId || prev.defaultCallerId,
                        timezone: callData.timezone || prev.timezone,
                        workingHoursStart: callData.callingHoursStart || prev.workingHoursStart,
                        workingHoursEnd: callData.callingHoursEnd || prev.workingHoursEnd,
                        maxRetries: callData.maxRetries ?? prev.maxRetries,
                        retryDelay: callData.retryDelay ?? prev.retryDelay,
                        callTimeout: callData.callTimeout ?? prev.callTimeout,
                        recordingEnabled: callData.recordingEnabled ?? prev.recordingEnabled,
                        voicemailEnabled: callData.voicemailEnabled ?? prev.voicemailEnabled,
                        autoDialingEnabled: callData.autoDialingEnabled ?? prev.autoDialingEnabled,
                        callQueueSize: callData.callQueueSize ?? prev.callQueueSize,
                        workingHoursEnabled: callData.workingHoursEnabled ?? prev.workingHoursEnabled,
                        workingDays: callData.workingDays ?? prev.workingDays,
                        callDelay: callData.callDelay ?? prev.callDelay,
                        maxCallsPerHour: callData.maxCallsPerHour ?? prev.maxCallsPerHour,
                        callSpacing: callData.callSpacing ?? prev.callSpacing,
                        dncCheckEnabled: callData.dncCheckEnabled ?? prev.dncCheckEnabled,
                        consentRequired: callData.consentRequired ?? prev.consentRequired,
                        autoOptOut: callData.autoOptOut ?? prev.autoOptOut,
                        consentMessage: callData.consentMessage ?? prev.consentMessage,
                    }));
                }

                // Fetch numbers if credentials exist
                if (smsData?.signalwireProjectId && smsData?.signalwireSpaceUrl && smsData?.signalwireApiToken) {
                    fetchNumbers();
                }

                // Load purchased numbers from our DB
                const purchasedNums = await api.getPhoneNumbers();
                if (Array.isArray(purchasedNums)) {
                    setPurchasedNumbers(purchasedNums);
                }
            } catch (error) {
                console.error('Error loading SMS/Call settings:', error);
            }
        };
        loadSettings();
    }, []);

    const updateSmsSetting = (key: string, value: any) => {
        setSmsSettings(prev => ({ ...prev, [key]: value }));
    };

    const updateCallSetting = (key: string, value: any) => {
        setCallSettings(prev => ({ ...prev, [key]: value }));
    };

    const fetchNumbers = async () => {
        if (!smsSettings.signalwireProjectId || !smsSettings.signalwireSpaceUrl || !smsSettings.signalwireApiToken) {
            return;
        }

        setIsFetchingNumbers(true);
        try {
            const result = await api.testSignalwireConnection({
                projectId: smsSettings.signalwireProjectId,
                spaceUrl: smsSettings.signalwireSpaceUrl,
                apiToken: smsSettings.signalwireApiToken
            });
            if (result.success && result.numbers) {
                setAvailableNumbers(result.numbers);
            }
        } catch (error) {
            console.error('Failed to fetch numbers:', error);
        } finally {
            setIsFetchingNumbers(false);
        }
    };

    const handleTestConnection = async () => {
        if (!smsSettings.signalwireProjectId || !smsSettings.signalwireSpaceUrl || !smsSettings.signalwireApiToken) {
            toast({
                title: 'Missing credentials',
                description: 'Please enter all SignalWire credentials.',
                variant: 'destructive',
            });
            return;
        }

        setIsTestingConnection(true);
        try {
            const result = await api.testSignalwireConnection({
                projectId: smsSettings.signalwireProjectId,
                spaceUrl: smsSettings.signalwireSpaceUrl,
                apiToken: smsSettings.signalwireApiToken
            });

            if (result.success) {
                toast({
                    title: 'Connection successful',
                    description: `Successfully connected to SignalWire. Found ${result.numbers?.length || 0} numbers.`,
                });
                if (result.numbers) setAvailableNumbers(result.numbers);
            } else {
                toast({
                    title: 'Connection failed',
                    description: result.message || 'Check your credentials and try again.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Test failed',
                description: 'A network error occurred while testing connection.',
                variant: 'destructive',
            });
        } finally {
            setIsTestingConnection(false);
        }
    };

    const handleSearchNumbers = async () => {
        setIsSearching(true);
        try {
            const result = await api.searchAvailableNumbers(searchParams);
            if (result.success) {
                setSearchResults(result.numbers);
            }
        } catch (error) {
            toast({
                title: 'Search failed',
                description: 'Failed to find available numbers.',
                variant: 'destructive',
            });
        } finally {
            setIsSearching(false);
        }
    };

    const handlePurchaseNumber = async (number: string) => {
        setIsPurchasing(true);
        try {
            const result = await api.purchasePhoneNumber({ phoneNumber: number });
            if (result.success) {
                toast({
                    title: 'Number purchased',
                    description: `Successfully purchased ${number}.`,
                });
                // Refresh lists
                const updated = await api.getPhoneNumbers();
                setPurchasedNumbers(updated);
            }
        } catch (error) {
            toast({
                title: 'Purchase failed',
                description: 'Failed to purchase number. Check your balance.',
                variant: 'destructive',
            });
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleUpdateNumberSettings = async (id: string, settings: any) => {
        try {
            const result = await api.updatePhoneNumber(id, settings);
            if (result.success) {
                toast({
                    title: 'Settings updated',
                    description: 'Number configuration saved successfully.',
                });
                setIsNumberSettingsOpen(false);
                // Refresh list
                const updated = await api.getPhoneNumbers();
                setPurchasedNumbers(updated);
            }
        } catch (error) {
            toast({
                title: 'Update failed',
                description: 'Failed to update number settings.',
                variant: 'destructive',
            });
        }
    };

    const handleSyncFromCarrier = async () => {
        setIsFetchingNumbers(true);
        try {
            const result = await api.syncPhoneNumbersFromConnection();
            if (result.success) {
                toast({
                    title: 'Sync complete',
                    description: `Successfully synced ${result.synced} numbers from SignalWire.`,
                });
                const updated = await api.getPhoneNumbers();
                setPurchasedNumbers(updated);
            }
        } catch (error) {
            toast({
                title: 'Sync failed',
                description: 'Failed to sync numbers from carrier.',
                variant: 'destructive',
            });
        } finally {
            setIsFetchingNumbers(false);
        }
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            await Promise.all([
                api.updateSMSSettings(smsSettings),
                api.updateCallSettings(callSettings)
            ]);
            toast({
                title: 'Settings saved',
                description: 'Communication preferences updated successfully.',
            });
        } catch (err) {
            toast({
                title: 'Save failed',
                description: 'Failed to update settings. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container max-w-7xl py-6 space-y-8 animate-in fade-in duration-500">
            <SEO title="SMS & Calls Settings | Xordon" description="Configure SMS outreach and telephony settings." />

            <div className="flex flex-col gap-1">
                <h1 className="text-[18px] font-bold tracking-tight">Communication Channels</h1>
                <p className="text-sm text-muted-foreground">
                    Control how your system handles automated SMS and voice interactions.
                </p>
            </div>

            {/* Carrier Integration Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 border-b pb-2">
                    <Globe className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-lg font-semibold">Carrier Connection (SignalWire)</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2 shadow-premium border-none">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-slate-500" /> API Credentials
                            </CardTitle>
                            <CardDescription className="text-xs">Connect your SignalWire project to enable SMS and voice.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Project ID</Label>
                                    <Input
                                        placeholder="e.g. 12345678-abcd-1234-efgh-1234567890ab"
                                        value={smsSettings.signalwireProjectId}
                                        onChange={(e) => updateSmsSetting('signalwireProjectId', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Space URL</Label>
                                    <Input
                                        placeholder="e.g. your-space.signalwire.com"
                                        value={smsSettings.signalwireSpaceUrl}
                                        onChange={(e) => updateSmsSetting('signalwireSpaceUrl', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">API Token</Label>
                                <Input
                                    type="password"
                                    placeholder="Enter your SignalWire API token"
                                    value={smsSettings.signalwireApiToken}
                                    onChange={(e) => updateSmsSetting('signalwireApiToken', e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t border-slate-50 pt-4">
                            <p className="text-[10px] text-muted-foreground max-w-[60%]">
                                Your credentials are encrypted and stored securely. We recommend using a dedicated API token for Xordon.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleTestConnection}
                                disabled={isTestingConnection}
                            >
                                {isTestingConnection ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <CheckCircle2 className="h-3 w-3 mr-2" />}
                                Test Connection
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="shadow-premium border-none">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Building className="h-4 w-4 text-slate-500" /> Carrier Inventory
                            </CardTitle>
                            <CardDescription className="text-xs">Numbers synced from SignalWire/Carrier.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {isFetchingNumbers ? (
                                <div className="flex flex-col items-center justify-center py-6 gap-2">
                                    <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                                    <p className="text-xs text-slate-400">Syncing carrier...</p>
                                </div>
                            ) : availableNumbers.length > 0 ? (
                                <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {availableNumbers.map((num, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-all cursor-pointer ${smsSettings.defaultSenderNumber === num.phone_number
                                                    ? 'bg-hunter-orange/5 border-hunter-orange/20'
                                                    : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                                                }`}
                                            onClick={() => {
                                                updateSmsSetting('defaultSenderNumber', num.phone_number);
                                            }}
                                        >
                                            <div className="font-mono font-bold">{num.phone_number}</div>
                                            {smsSettings.defaultSenderNumber === num.phone_number && (
                                                <Badge className="bg-hunter-orange text-white text-[8px] h-4 px-1">Default</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                                    <AlertCircle className="h-6 w-6 text-slate-200" />
                                    <p className="text-xs text-slate-400">No active numbers found or not connected.</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button
                                variant="ghost"
                                className="w-full text-xs text-slate-500 hover:text-primary"
                                onClick={handleSyncFromCarrier}
                                disabled={isFetchingNumbers || !smsSettings.signalwireProjectId}
                            >
                                <Zap className="h-3 w-3 mr-2" /> Sync Carrier Numbers
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </section>

            {/* Managed Phone Inventory Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-hunter-orange" />
                        <h2 className="text-lg font-semibold">Managed Phone Inventory</h2>
                    </div>

                    <div className="flex gap-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8 border-hunter-orange/20 text-hunter-orange hover:bg-hunter-orange/5">
                                    <Plus className="h-4 w-4 mr-1" /> Buy New Number
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Buy Phone Number</DialogTitle>
                                    <DialogDescription>
                                        Search for local or toll-free numbers for your workspace.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    <div className="flex gap-4">
                                        <div className="w-1/3 space-y-2">
                                            <Label className="text-xs">Country</Label>
                                            <Select defaultValue="US">
                                                <SelectTrigger>
                                                    <SelectValue placeholder="US" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="US">United States</SelectItem>
                                                    <SelectItem value="CA">Canada</SelectItem>
                                                    <SelectItem value="GB">United Kingdom</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-1/2 space-y-2">
                                            <Label className="text-xs">Area Code / Pattern</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="e.g. 512"
                                                    value={searchParams.areaCode}
                                                    onChange={(e) => setSearchParams({ ...searchParams, areaCode: e.target.value })}
                                                />
                                                <Button onClick={handleSearchNumbers} disabled={isSearching} size="sm">
                                                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border rounded-lg overflow-hidden bg-slate-50">
                                        <ScrollArea className="h-[300px]">
                                            {searchResults.length > 0 ? (
                                                <div className="divide-y">
                                                    {searchResults.map((num, i) => (
                                                        <div key={i} className="flex items-center justify-between p-4 hover:bg-white transition-colors">
                                                            <div>
                                                                <div className="font-mono font-bold text-lg">{num.friendly_name}</div>
                                                                <div className="flex gap-2 mt-1">
                                                                    {num.capabilities.SMS && <Badge variant="secondary" className="text-[10px] h-4">SMS</Badge>}
                                                                    {num.capabilities.Voice && <Badge variant="secondary" className="text-[10px] h-4">Voice</Badge>}
                                                                    {num.capabilities.MMS && <Badge variant="secondary" className="text-[10px] h-4">MMS</Badge>}
                                                                </div>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handlePurchaseNumber(num.phone_number)}
                                                                disabled={isPurchasing}
                                                                className="bg-hunter-orange hover:bg-hunter-orange/90"
                                                            >
                                                                {isPurchasing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                                                Buy Now
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                                                    <Search className="h-12 w-12 mb-2 opacity-10" />
                                                    <p>Search for numbers using area codes</p>
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="rounded-xl border shadow-premium overflow-hidden bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr className="text-left font-semibold text-slate-500">
                                <th className="px-6 py-4">Phone Number</th>
                                <th className="px-6 py-4">Provider</th>
                                <th className="px-6 py-4">Capabilities</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {purchasedNumbers.length > 0 ? (
                                purchasedNumbers.map((num) => (
                                    <tr key={num.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold">{num.phone_number}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="capitalize">{num.provider}</Badge>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1">
                                                {JSON.parse(num.capabilities || '{}').SMS && <MessageSquare className="h-3 w-3 text-slate-400" />}
                                                {JSON.parse(num.capabilities || '{}').Voice && <Phone className="h-3 w-3 text-slate-400" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={num.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'}>
                                                {num.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-primary"
                                                    onClick={() => {
                                                        setNumberToEdit(num);
                                                        setIsNumberSettingsOpen(true);
                                                    }}
                                                >
                                                    <Settings2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Smartphone className="h-10 w-10 opacity-10" />
                                            <p>No managed numbers found in this workspace.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* SMS Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 border-b pb-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">SMS Outreach Configuration</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="shadow-premium border-none">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-slate-500" /> Quiet Hours & Privacy
                            </CardTitle>
                            <CardDescription className="text-xs">Prevent messages during sensitive times.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-bold">Enable Quiet Hours</Label>
                                    <p className="text-[10px] text-muted-foreground">Silence outbound SMS at night.</p>
                                </div>
                                <Switch checked={smsSettings.enableQuietHours} onCheckedChange={(val) => updateSmsSetting('enableQuietHours', val)} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Start Time</Label>
                                    <Input type="time" value={smsSettings.quietHoursStart} onChange={(e) => updateSmsSetting('quietHoursStart', e.target.value)} disabled={!smsSettings.enableQuietHours} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">End Time</Label>
                                    <Input type="time" value={smsSettings.quietHoursEnd} onChange={(e) => updateSmsSetting('quietHoursEnd', e.target.value)} disabled={!smsSettings.enableQuietHours} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Timezone</Label>
                                <Select value={smsSettings.timezone} onValueChange={(v) => updateSmsSetting('timezone', v)}>
                                    <SelectTrigger className="text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UTC">UTC</SelectItem>
                                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-premium border-none">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-500" /> Velocity & Retries
                            </CardTitle>
                            <CardDescription className="text-xs">Control delivery speed and error handling.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Avg Delay (Seconds)</Label>
                                <Input type="number" value={smsSettings.averageDelay} onChange={(e) => updateSmsSetting('averageDelay', parseInt(e.target.value))} />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Sending Priority</Label>
                                <Select value={smsSettings.sendingPriority} onValueChange={(val) => updateSmsSetting('sendingPriority', val)}>
                                    <SelectTrigger className="text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="followups_first">Follow-ups First</SelectItem>
                                        <SelectItem value="initial_first">New Leads First</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-bold">Auto-Retry on Failure</Label>
                                    <p className="text-[10px] text-muted-foreground">Retry sending if network issues occur.</p>
                                </div>
                                <Switch checked={smsSettings.enableRetries} onCheckedChange={(val) => updateSmsSetting('enableRetries', val)} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-premium border-none">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-blue-500" /> Opt-Out & Compliance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Label className="text-xs font-bold">Unsubscribe Keywords</Label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {smsSettings.unsubscribeKeywords.map((keyword, idx) => (
                                    <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-700 font-bold px-2 py-1">
                                        {keyword}
                                        <button className="ml-2 hover:text-red-500" onClick={() => {
                                            const next = [...smsSettings.unsubscribeKeywords];
                                            next.splice(idx, 1);
                                            updateSmsSetting('unsubscribeKeywords', next);
                                        }}>×</button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    id="new-keyword"
                                    placeholder="Add keyword (e.g. STOP)"
                                    className="h-9 text-xs"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = (e.target as HTMLInputElement).value.trim().toUpperCase();
                                            if (val && !smsSettings.unsubscribeKeywords.includes(val)) {
                                                updateSmsSetting('unsubscribeKeywords', [...smsSettings.unsubscribeKeywords, val]);
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }
                                    }}
                                />
                                <Button variant="outline" size="sm" onClick={() => {
                                    const input = document.getElementById('new-keyword') as HTMLInputElement;
                                    const val = input.value.trim().toUpperCase();
                                    if (val && !smsSettings.unsubscribeKeywords.includes(val)) {
                                        updateSmsSetting('unsubscribeKeywords', [...smsSettings.unsubscribeKeywords, val]);
                                        input.value = '';
                                    }
                                }}>Add</Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">
                                Messages containing these keywords from the customer will automatically stop all future outreach.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Voice Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 border-b pb-2">
                    <Phone className="h-5 w-5 text-green-500" />
                    <h2 className="text-lg font-semibold">Telephony & Voice Systems</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="shadow-premium border-none">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-slate-500" /> Identity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500">Global Caller ID</Label>
                                <Input value={callSettings.defaultCallerId} onChange={(e) => updateCallSetting('defaultCallerId', e.target.value)} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">Record Calls</Label>
                                <Switch checked={callSettings.recordingEnabled} onCheckedChange={(v) => updateCallSetting('recordingEnabled', v)} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">Accept Voicemail</Label>
                                <Switch checked={callSettings.voicemailEnabled} onCheckedChange={(v) => updateCallSetting('voicemailEnabled', v)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-premium border-none">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Timer className="h-4 w-4 text-slate-500" /> Call Windows
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-dashed">
                                <Label className="text-xs font-medium text-slate-500">Business Hours Only</Label>
                                <Switch checked={callSettings.workingHoursEnabled} onCheckedChange={(v) => updateCallSetting('workingHoursEnabled', v)} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Open</Label>
                                    <Input type="time" value={callSettings.workingHoursStart} onChange={(e) => updateCallSetting('workingHoursStart', e.target.value)} disabled={!callSettings.workingHoursEnabled} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Close</Label>
                                    <Input type="time" value={callSettings.workingHoursEnd} onChange={(e) => updateCallSetting('workingHoursEnd', e.target.value)} disabled={!callSettings.workingHoursEnabled} />
                                </div>
                            </div>
                            <div className="space-y-1.5 pt-2">
                                <Label className="text-[10px] uppercase font-bold text-slate-400">Voice Timezone</Label>
                                <Select value={callSettings.timezone} onValueChange={(v) => updateCallSetting('timezone', v)}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-premium border-none">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Volume2 className="h-4 w-4 text-slate-500" /> Limits
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Max Calls / Hour</Label>
                                <Input type="number" value={callSettings.maxCallsPerHour} onChange={(e) => updateCallSetting('maxCallsPerHour', parseInt(e.target.value))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Spacing (Secs)</Label>
                                <Input type="number" value={callSettings.callSpacing} onChange={(e) => updateCallSetting('callSpacing', parseInt(e.target.value))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Retry Count</Label>
                                <Input type="number" value={callSettings.maxRetries} onChange={(e) => updateCallSetting('maxRetries', parseInt(e.target.value))} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-premium border-none bg-blue-50/50 border border-blue-100">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-700">
                            <ShieldCheck className="h-4 w-4" /> Legal & Compliance Controls
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-bold">DNC Check</Label>
                                    <p className="text-[9px] text-muted-foreground">Scrub vs Do Not Call List</p>
                                </div>
                                <Switch checked={callSettings.dncCheckEnabled} onCheckedChange={(v) => updateCallSetting('dncCheckEnabled', v)} />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-bold">Consent Check</Label>
                                    <p className="text-[9px] text-muted-foreground">Require verbal consent</p>
                                </div>
                                <Switch checked={callSettings.consentRequired} onCheckedChange={(v) => updateCallSetting('consentRequired', v)} />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-bold">Auto Opt-Out</Label>
                                    <p className="text-[9px] text-muted-foreground">Stop on 'Stop' keyword</p>
                                </div>
                                <Switch checked={callSettings.autoOptOut} onCheckedChange={(v) => updateCallSetting('autoOptOut', v)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-600">Dynamic Consent Message</Label>
                            <Textarea
                                className="text-xs min-h-[60px] bg-white border-blue-100 rounded-xl"
                                value={callSettings.consentMessage}
                                onChange={(e) => updateCallSetting('consentMessage', e.target.value)}
                            />
                            <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Transcribed and played automatically if Consent Check is enabled.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Number Configuration Dialog */}
            {numberToEdit && (
                <Dialog open={isNumberSettingsOpen} onOpenChange={setIsNumberSettingsOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5" /> Number Settings: {numberToEdit.phone_number}
                            </DialogTitle>
                            <DialogDescription>
                                Configure routing, recording, and voicemail for this dedicated line.
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="voice" className="py-4">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="voice">Voice Routing</TabsTrigger>
                                <TabsTrigger value="recording">Recording</TabsTrigger>
                                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                            </TabsList>

                            <TabsContent value="voice" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Inbound Destination</Label>
                                    <Select defaultValue={numberToEdit.destination_type || 'forward'} onValueChange={(v) => setNumberToEdit({ ...numberToEdit, destination_type: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="forward">Forward to Number</SelectItem>
                                            <SelectItem value="voicemail">Direct to Voicemail</SelectItem>
                                            <SelectItem value="ivr">IVR Menu</SelectItem>
                                            <SelectItem value="agent">Direct to Agent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {numberToEdit.destination_type === 'forward' && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold">Forward To Number</Label>
                                        <Input
                                            placeholder="+15550000000"
                                            value={numberToEdit.forwarding_number || ''}
                                            onChange={(e) => setNumberToEdit({ ...numberToEdit, forwarding_number: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Voicemail Greeting (Text-to-Speech)</Label>
                                    <Textarea
                                        placeholder="Please leave a message after the beep..."
                                        value={numberToEdit.voicemail_greeting || ''}
                                        onChange={(e) => setNumberToEdit({ ...numberToEdit, voicemail_greeting: e.target.value })}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="recording" className="space-y-4 pt-4 text-sm">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label className="font-bold">Call Recording</Label>
                                        <p className="text-xs text-muted-foreground">Record all incoming and outgoing calls on this line.</p>
                                    </div>
                                    <Switch
                                        checked={numberToEdit.call_recording === 1 || numberToEdit.call_recording === true}
                                        onCheckedChange={(checked) => setNumberToEdit({ ...numberToEdit, call_recording: checked ? 1 : 0 })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Whisper Message</Label>
                                    <p className="text-[10px] text-muted-foreground mb-2">Played only to you before the call connects.</p>
                                    <Input
                                        placeholder="Incoming call from Xordon leads..."
                                        value={numberToEdit.whisper_message || ''}
                                        onChange={(e) => setNumberToEdit({ ...numberToEdit, whisper_message: e.target.value })}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="compliance" className="space-y-4 pt-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label className="font-bold">Pass Caller ID</Label>
                                        <p className="text-xs text-muted-foreground">Show customer's ID when forwarding instead of this business line.</p>
                                    </div>
                                    <Switch
                                        checked={numberToEdit.pass_call_id === 1 || numberToEdit.pass_call_id === true}
                                        onCheckedChange={(checked) => setNumberToEdit({ ...numberToEdit, pass_call_id: checked ? 1 : 0 })}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsNumberSettingsOpen(false)}>Cancel</Button>
                            <Button onClick={() => handleUpdateNumberSettings(numberToEdit.id, numberToEdit)}>Save Configuration</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            <div className="flex justify-end gap-3 border-t pt-6 mt-12 bg-slate-50/50 -mx-8 px-8 pb-8">
                <Button variant="outline" className="h-10 px-8">Reset Changes</Button>
                <Button
                    className="h-10 px-8 bg-hunter-orange hover:bg-hunter-orange/90 shadow-md"
                    onClick={handleSaveAll}
                    disabled={isSaving}
                >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save All Settings
                </Button>
            </div>
        </div>
    );
};

export default SMSAndCallsSettings;
