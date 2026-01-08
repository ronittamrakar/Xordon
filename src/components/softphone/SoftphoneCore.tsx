import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Hash,
  Asterisk,
  Clock,
  User,
  Settings,
  Minimize2,
  X,
  Move,
  Circle,
  Square,
  RotateCcw,
  PhoneIncoming,
  PhoneOutgoing,
  Copy,
  CheckCircle,
  ArrowRight,
  Users,
  Voicemail,
  MessageSquare,
  Send,
  Plus,
  ArrowLeft,
  Forward,
  MoreHorizontal,
  Search,
  UserPlus,
  Edit2,
  SkipForward,
  RefreshCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { formatPhoneNumber } from '@/lib/utils';
import { api } from '@/lib/api';
import { getSignalWireWebRTCService } from '@/services/signalwire-webrtc';
import { sipService, SIPCall } from '@/services/SIPService';
import { useCallSession, SoftphoneIntent, CallSessionSource, CallSessionStatus } from '@/contexts/CallSessionContext';
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

const API_BASE = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || '/api';

type Campaign = {
  id: string;
  name: string;
  status: string;
};

interface CallSettings {
  provider?: string;
  defaultCallerId?: string;
  sipEnabled?: boolean;
  sipServer?: string;
  sipPort?: number;
  sipUsername?: string;
  sipPassword?: string;
  sipDomain?: string;
  sipTransport?: 'udp' | 'tcp' | 'tls';
  stunServer?: string;
  turnServer?: string;
  turnUsername?: string;
  turnPassword?: string;
  webrtcEnabled?: boolean;
  autoAnswer?: boolean;
  dtmfType?: string;
}

interface CallSession {
  id: string;
  phoneNumber: string;
  status: 'ringing' | 'connected' | 'ended' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  isIncoming: boolean;
  campaignId?: string;
  recipientId?: string;
  muted?: boolean;
  held?: boolean;
  recording?: boolean;
  direction?: 'inbound' | 'outbound';
}

interface SoftphoneCoreProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  defaultNumber?: string;
  onCallStart?: (number: string, campaignId?: string) => void;
  onCallEnd?: (duration: number, callData: { campaignId?: string; recipientId?: string; outcome?: string; notes?: string }) => void;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  pendingIntent?: SoftphoneIntent | null;
  onIntentConsumed?: () => void;
}

export const SoftphoneCore: React.FC<SoftphoneCoreProps> = ({
  isOpen,
  onClose,
  onMinimize,
  defaultNumber = '',
  onCallStart,
  onCallEnd,
  position,
  onPositionChange,
  pendingIntent,
  onIntentConsumed
}) => {
  const { user } = useAuth();
  const { 
    createSession, 
    endSession, 
    updateSession, 
    activeSession 
  } = useCallSession();

  // Core states
  const [phoneNumber, setPhoneNumber] = useState(defaultNumber);
  const [isInCall, setIsInCall] = useState(false);
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connected' | 'ended'>('idle');

  // Campaign and contacts
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [showContacts, setShowContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  // Settings
  const [settings, setSettings] = useState<CallSettings>({});
  const [showSettings, setShowSettings] = useState(false);

  // Refs
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get('/call-settings');
        if (response.data) {
          setSettings(response.data);
        }
      } catch (error) {
        console.error('Failed to load call settings:', error);
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  // Load campaigns
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const response = await api.get('/campaigns?type=call&status=active');
        if (response.data?.campaigns) {
          setCampaigns(response.data.campaigns);
        }
      } catch (error) {
        console.error('Failed to load campaigns:', error);
      }
    };

    if (isOpen) {
      loadCampaigns();
    }
  }, [isOpen]);

  // Handle pending intent
  useEffect(() => {
    if (pendingIntent && pendingIntent.phoneNumber && !isInCall) {
      setPhoneNumber(pendingIntent.phoneNumber);
      if (pendingIntent.campaignId) {
        setSelectedCampaign(pendingIntent.campaignId);
      }
      // Auto-start call after a short delay
      const timer = setTimeout(() => {
        handleMakeCall();
        onIntentConsumed?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pendingIntent, isInCall]);

  // Call duration timer
  useEffect(() => {
    if (isInCall && callSession) {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isInCall, callSession]);

  // Format duration
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Detect preferred country
  const detectPreferredCountry = useCallback((): CountryCode => {
    if (settings.defaultCountry) {
      return settings.defaultCountry as CountryCode;
    }
    
    // Try to detect from user's data
    if (user?.country) {
      return user.country as CountryCode;
    }
    
    // Fallback to US
    return 'US';
  }, [settings, user]);

  // Format phone number with country code
  const formatPhoneNumberWithCountry = useCallback((number: string): string => {
    if (!number) return '';
    
    const preferredCountry = detectPreferredCountry();
    const parsed = parsePhoneNumberFromString(number, preferredCountry);
    
    if (parsed && parsed.isValid()) {
      return parsed.formatInternational();
    }
    
    return number;
  }, [detectPreferredCountry]);

  // Make call
  const handleMakeCall = useCallback(async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    const formattedNumber = formatPhoneNumberWithCountry(phoneNumber);
    
    try {
      setIsRinging(true);
      setCallStatus('ringing');

      // Create call session
      const sessionId = createSession?.({
        phoneNumber: formattedNumber,
        campaignId: selectedCampaign || undefined,
        source: CallSessionSource.SOFTPHONE,
        direction: 'outbound'
      });

      // Start the call via API
      const response = await api.post('/calls/make', {
        phoneNumber: formattedNumber,
        campaignId: selectedCampaign || undefined,
        sessionId
      });

      if (response.data?.success) {
        const newSession: CallSession = {
          id: sessionId || response.data.callId,
          phoneNumber: formattedNumber,
          status: 'ringing',
          startTime: new Date(),
          isIncoming: false,
          campaignId: selectedCampaign,
          direction: 'outbound'
        };

        setCallSession(newSession);
        setIsInCall(true);
        setCallDuration(0);
        setIsRinging(false);
        setCallStatus('connected');

        onCallStart?.(formattedNumber, selectedCampaign);
        updateSession?.(sessionId, { status: CallSessionStatus.CONNECTED });

        toast.success('Call initiated');
      } else {
        throw new Error(response.data?.message || 'Failed to initiate call');
      }
    } catch (error: any) {
      console.error('Call failed:', error);
      setIsRinging(false);
      setCallStatus('idle');
      toast.error(error.message || 'Failed to make call');
      endSession?.();
    }
  }, [phoneNumber, selectedCampaign, createSession, onCallStart, updateSession, endSession, formatPhoneNumberWithCountry]);

  // End call
  const handleEndCall = useCallback(() => {
    if (callSession) {
      const duration = callDuration;
      
      // End call via API
      api.post('/calls/end', {
        callId: callSession.id,
        duration,
        status: 'completed'
      }).catch(error => {
        console.error('Failed to end call via API:', error);
      });

      // Update session
      endSession?.();
      
      // Notify parent
      onCallEnd?.(duration, {
        campaignId: callSession.campaignId,
        outcome: 'completed'
      });

      // Reset state
      setCallSession(null);
      setIsInCall(false);
      setCallDuration(0);
      setIsMuted(false);
      setIsOnHold(false);
      setCallStatus('idle');
      setIsRinging(false);
    }
  }, [callSession, callDuration, endSession, onCallEnd]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (callSession) {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      
      // Send mute command to call service
      if (sipService.hasActiveCall()) {
        if (newMutedState) {
          sipService.mute();
        } else {
          sipService.unmute();
        }
      }
      
      toast.success(newMutedState ? 'Microphone muted' : 'Microphone unmuted');
    }
  }, [callSession, isMuted]);

  // Toggle hold
  const toggleHold = useCallback(() => {
    if (callSession) {
      const newHoldState = !isOnHold;
      setIsOnHold(newHoldState);
      
      // Send hold command to call service
      if (sipService.hasActiveCall()) {
        if (newHoldState) {
          sipService.hold();
        } else {
          sipService.unhold();
        }
      }
      
      toast.success(newHoldState ? 'Call placed on hold' : 'Call resumed');
    }
  }, [callSession, isOnHold]);

  // Send DTMF
  const sendDTMF = useCallback((digit: string) => {
    if (callSession && sipService.hasActiveCall()) {
      sipService.sendDTMF(digit);
      toast.success(`Sent ${digit}`);
    }
  }, [callSession]);

  // Load contacts
  const loadContacts = useCallback(async () => {
    try {
      const response = await api.get('/contacts', {
        params: { type: 'call', limit: 50 }
      });
      if (response.data?.contacts) {
        setContacts(response.data.contacts);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  }, []);

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!contactSearch) return contacts;
    
    const search = contactSearch.toLowerCase();
    return contacts.filter(contact => 
      contact.name?.toLowerCase().includes(search) ||
      contact.email?.toLowerCase().includes(search) ||
      contact.phone?.toLowerCase().includes(search) ||
      contact.company?.toLowerCase().includes(search)
    );
  }, [contacts, contactSearch]);

  // Handle contact selection
  const handleContactSelect = useCallback((contact: any) => {
    if (contact.phone) {
      setPhoneNumber(contact.phone);
      setShowContacts(false);
      setContactSearch('');
    }
  }, []);

  return (
    <div className="softphone-core">
      {/* Main softphone interface */}
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Softphone</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onMinimize}>
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Call Status */}
          {isInCall && (
            <div className="text-center space-y-2">
              <Badge variant={callStatus === 'connected' ? 'default' : 'secondary'}>
                {callStatus === 'ringing' && 'Ringing...'}
                {callStatus === 'connected' && 'Connected'}
                {callStatus === 'ended' && 'Ended'}
              </Badge>
              <div className="text-2xl font-mono">
                {formatDuration(callDuration)}
              </div>
              <div className="text-sm text-muted-foreground">
                {callSession?.phoneNumber}
              </div>
            </div>
          )}

          {/* Phone Number Input */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isInCall}
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowContacts(!showContacts)}
                  disabled={isInCall}
                >
                  <Users className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(phoneNumber)}
                  disabled={!phoneNumber}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Contacts Dropdown */}
            {showContacts && (
              <div className="border rounded-md p-2 max-h-48 overflow-y-auto">
                <Input
                  placeholder="Search contacts..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="mb-2"
                />
                <div className="space-y-1">
                  {filteredContacts.slice(0, 10).map((contact) => (
                    <div
                      key={contact.id}
                      className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                      onClick={() => handleContactSelect(contact)}
                    >
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.phone}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Campaign Selection */}
          <div>
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign} disabled={isInCall}>
              <SelectTrigger>
                <SelectValue placeholder="Select campaign (optional)" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Call Controls */}
          <div className="flex justify-center space-x-2">
            {!isInCall ? (
              <Button
                onClick={handleMakeCall}
                disabled={!phoneNumber.trim() || isRinging}
                className="bg-green-500 hover:bg-green-600"
              >
                {isRinging ? (
                  <>
                    <Phone className="h-4 w-4 mr-2 animate-pulse" />
                    Calling...
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={toggleMute}
                  disabled={callStatus !== 'connected'}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={toggleHold}
                  disabled={callStatus !== 'connected'}
                >
                  {isOnHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                
                <Button
                  onClick={handleEndCall}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Volume Control */}
          {isInCall && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4" />
                <Slider
                  value={[volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-8">
                  {volume}%
                </span>
              </div>
            </div>
          )}

          {/* DTMF Pad */}
          {isInCall && callStatus === 'connected' && (
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                <Button
                  key={digit}
                  variant="outline"
                  onClick={() => sendDTMF(digit)}
                  className="h-12"
                >
                  {digit}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
