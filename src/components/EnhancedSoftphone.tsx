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
import { useTheme } from '@/contexts/ThemeContext';
import { formatPhoneNumber } from '@/lib/utils';
import { api } from '@/lib/api';
import { getSignalWireWebRTCService } from '@/services/signalwire-webrtc';
import { sipService, SIPCall } from '@/services/SIPService';
import { useCallSession, SoftphoneIntent, CallSessionSource, CallSessionStatus } from '@/contexts/CallSessionContext';
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

// Use relative paths for API calls to go through Vite proxy
const API_URL = import.meta.env.VITE_API_URL || '/api';
const API_BASE = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || '/api';

// Use the Campaign type from API instead of defining a local interface
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

interface EnhancedSoftphoneProps {
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

interface CallSession {
  id: string;
  number: string;
  status: 'idle' | 'dialing' | 'connected' | 'ended' | 'failed' | 'ringing' | 'onhold';
  startTime?: Date;
  endTime?: Date;
  duration: number;
  isMuted: boolean;
  isOnHold: boolean;
  isRecording: boolean;
  callSid?: string;
  sessionId?: string;
  phoneNumber?: string;
  agent?: string;
  campaignId?: string;
  recipientName?: string;
  recordingUrl?: string;
  metadata?: Record<string, any>;
  direction: 'outbound' | 'inbound';
  createdAt?: string;
}

interface PhoneNumberEntry {
  id: string;
  number: string;
  name: string;
  isActive: boolean;
  isPrimary?: boolean;
  meta?: {
    source: 'connection' | 'campaign' | 'settings' | 'purchased';
    connectionName?: string;
    connectionId?: string;
  };
}


interface AutoDialTarget {
  id: string;
  name: string;
  number: string;
  phone: string; // Add phone property for compatibility
}

interface CountryOption {
  code: CountryCode;
  name: string;
  dialCode: string;
}

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'AU', name: 'Australia', dialCode: '+61' }
];

const DEFAULT_COUNTRY: CountryCode = 'US';

const getFlagEmoji = (countryCode: string) =>
  countryCode
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));

const getDialCodeForCountry = (countryCode: CountryCode) =>
  COUNTRY_OPTIONS.find(option => option.code === countryCode)?.dialCode || '+1';

const detectPreferredCountry = (): CountryCode => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const parts = locale.split('-');
    const region = parts.length > 1 ? parts[1].toUpperCase() : '';
    if (region) {
      const match = COUNTRY_OPTIONS.find(option => option.code === region);
      if (match) return match.code;
    }
  } catch (error) {
    // Avoid noisy console output in normal usage
  }
  return DEFAULT_COUNTRY;
};

export const EnhancedSoftphone: React.FC<EnhancedSoftphoneProps> = ({
  isOpen,
  onClose,
  onMinimize,
  defaultNumber = '',
  onCallStart,
  onCallEnd,
  position,
  onPositionChange,
  pendingIntent = null,
  onIntentConsumed
}) => {
  const debug = import.meta.env.DEV && localStorage.getItem('debug_softphone') === '1';
  // Memoize loggers to keep them stable
  const { log, warn, logError } = useMemo(() => ({
    log: (...args: any[]) => { if (debug) console.log(...args); },
    warn: (...args: any[]) => { if (debug) console.warn(...args); },
    logError: (...args: any[]) => { if (debug) console.error(...args); }
  }), [debug]);

  const { token: contextToken } = useAuth();
  const { theme } = useTheme();
  const { startSession, updateSession, endSession } = useCallSession();
  // Fallback to localStorage if context token is not available
  const token = contextToken || localStorage.getItem('auth_token') || '';

  // Inverted theme logic:
  // If app is Light (theme != 'dark'), Softphone should be Dark.
  // If app is Dark (theme == 'dark'), Softphone should be Light.
  const softphoneThemeClasses = useMemo(() => {
    // Note: Assuming 'dark' class on parent/html activates dark mode variables.
    // If we want Light softphone when App is Dark, we need to force light variables or background.
    // Shadcn cards usually use bg-card.
    if (theme === 'dark') {
      // FORCE LIGHT: We use specific light-mode colors to override inherited dark vars if 'light' class doesn't reset them.
      // Usually just adding 'light' class isn't enough unless configured. 
      // We will manually set white bg and black text.
      return "bg-white text-zinc-950 border-zinc-200 shadow-xl shadow-black/10 ring-0";
    } else {
      // FORCE DARK: Add 'dark' class. This usually works well with Tailwind darkMode: 'class'.
      // We also add specific dark styling just in case.
      return "dark bg-zinc-950 text-zinc-50 border-zinc-800 ring-1 ring-white/10 shadow-2xl shadow-indigo-500/10";
    }
  }, [theme]);

  // Use useMemo for stable object reference, or prefer direct usage of toast
  // We'll keep the object for compatibility but make it stable
  const showToast = useMemo(() => ({
    success: (message: string) => toast.success(message, { duration: 2000, position: 'top-center' }),
    error: (message: string) => toast.error(message, { duration: 3000, position: 'top-center' }),
    warning: (message: string) => toast.warning(message, { duration: 3000, position: 'top-center' }),
    info: (message: string) => toast.info(message, { duration: 2000, position: 'top-center' })
  }), []);
  const [phoneNumber, setPhoneNumber] = useState<string>(defaultNumber ?? '');
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [callHistory, setCallHistory] = useState<CallSession[]>([]);
  const [callLogFilter, setCallLogFilter] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [incomingCall, setIncomingCall] = useState<any | null>(null);

  // Resize state
  const [size, setSize] = useState({ width: 384, height: 820 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');

  useEffect(() => {
    // We don't need getIncomingCall anymore as it's handled via handlers
    // But we'll keep the effect for event listener setup
    const handleIncoming = (e: any) => {
      if (!currentCallRef.current) {
        setIncomingCall(e.detail.call);
      }
    };
    window.addEventListener('incoming_call', handleIncoming);
    return () => window.removeEventListener('incoming_call', handleIncoming);
  }, [currentCall, incomingCall]);

  const handleAnswer = async () => {
    if (!incomingCall) return;
    try {
      await incomingCall.answer();
      setCurrentCall({
        id: incomingCall.id,
        number: incomingCall.from,
        status: 'connected',
        direction: 'inbound',
        startTime: new Date(),
        duration: 0,
        isMuted: false,
        isOnHold: false,
        isRecording: false,
        sessionId: incomingCall.id,
        recipientName: incomingCall.from
      });
      setIncomingCall(null);
      (window as any).currentWebRTCSession = incomingCall;
    } catch (e) {
      logError('Failed to answer:', e);
      showToast.error('Failed to answer call');
      setIncomingCall(null);
    }
  };

  const handleReject = async () => {
    if (incomingCall) {
      try { await incomingCall.hangup(); } catch (e) { console.error('Error hanging up:', e); }
      setIncomingCall(null);
    }
  };

  // Initialize position from localStorage or calculate default
  const getInitialPosition = () => {
    // Try to get saved position from localStorage
    const savedPosition = localStorage.getItem('softphone_position');
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        // Validate the position is still on screen
        if (parsed.x >= 0 && parsed.x < window.innerWidth - 100 &&
          parsed.y >= 0 && parsed.y < window.innerHeight - 100) {
          return parsed;
        }
      } catch (e) {
        warn('[Softphone] Failed to parse saved position:', e);
      }
    }

    // If no saved position or invalid, use prop or calculate default
    if (position) {
      return position;
    }

    // Calculate default bottom-right position
    const softphoneWidth = 384;
    // Dynamic height: use viewport height minus margins (40px total)
    const softphoneHeight = Math.min(650, window.innerHeight - 40);
    return {
      x: Math.max(20, window.innerWidth - softphoneWidth - 20),
      y: Math.max(20, window.innerHeight - softphoneHeight - 20)
    };
  };

  const [currentPosition, setCurrentPosition] = useState(getInitialPosition);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberEntry[]>([]);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>('none');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [callSettings, setCallSettings] = useState<CallSettings | null>(null);
  const [useSIP, setUseSIP] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showConference, setShowConference] = useState(false);
  const [transferNumber, setTransferNumber] = useState('');
  const [conferenceNumber, setConferenceNumber] = useState('');
  const [autoDialQueue, setAutoDialQueue] = useState<AutoDialTarget[]>([]);
  const [autoDialActive, setAutoDialActive] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(() => detectPreferredCountry());
  const [volume, setVolume] = useState(100);
  const [lastDialedNumber, setLastDialedNumber] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'call' | 'sms' | 'contacts'>('call');
  const [contacts, setContacts] = useState<Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
    email?: string;
    company?: string;
  }>>([]);
  const [contactsSearch, setContactsSearch] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [showCallLogsWing, setShowCallLogsWing] = useState(false);
  const [showSmsLogsWing, setShowSmsLogsWing] = useState(false);
  const wingRef = useRef<HTMLDivElement>(null);
  const [contactsCache, setContactsCache] = useState<Array<any> | null>(null);
  const [smsConversations, setSmsConversations] = useState<Array<{
    id: string;
    phoneNumber: string;
    name?: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
  }>>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [smsMessages, setSmsMessages] = useState<Array<{
    id: string;
    content: string;
    direction: 'inbound' | 'outbound';
    timestamp: string;
    status?: 'sent' | 'delivered' | 'failed';
  }>>([]);
  const [newSmsMessage, setNewSmsMessage] = useState('');
  const [smsRecipient, setSmsRecipient] = useState('');
  const [isLoadingSms, setIsLoadingSms] = useState(false);
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);

  // Enhanced SMS features
  const [smsSenderNumber, setSmsSenderNumber] = useState<string>('none');
  const [smsSelectedCampaign, setSmsSelectedCampaign] = useState<string>('none');
  const [showBulkSms, setShowBulkSms] = useState(false);
  const [bulkSmsRecipients, setBulkSmsRecipients] = useState<string[]>(['']);
  const [showSmsSettings, setShowSmsSettings] = useState(false);
  const [smsSearchQuery, setSmsSearchQuery] = useState('');
  const [selectedSmsMessages, setSelectedSmsMessages] = useState<string[]>([]);

  // Fix for NodeJS namespace error
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const pendingIntentRef = useRef<SoftphoneIntent | null>(null);
  const volumeRef = useRef<HTMLAudioElement | null>(null);
  // Fix for NodeJS namespace error
  const statusPollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingPhoneNumbersRef = useRef<boolean>(false);
  const isFetchingCampaignsRef = useRef<boolean>(false);
  // Fix for NodeJS namespace error
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialLoadedRef = useRef<boolean>(false);
  const currentCallRef = useRef<CallSession | null>(null);

  // Sync ref with state
  useEffect(() => {
    currentCallRef.current = currentCall;
  }, [currentCall]);

  // Handle device changes
  const handleDeviceChange = useCallback(() => {
    console.log('Audio devices changed');
    // Could potentially re-initialize audio if needed
  }, []);

  // Cleanup audio resources
  const cleanupAudio = useCallback(() => {
    console.log('[Audio] Cleaning up audio resources...');

    // Clear audio monitor interval
    if ((window as any).audioMonitorInterval) {
      clearInterval((window as any).audioMonitorInterval);
      (window as any).audioMonitorInterval = null;
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[Audio] Stopped local audio track:', track.label);
      });
      localStreamRef.current = null;
    }

    // Clear remote stream
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[Audio] Stopped remote audio track:', track.label);
      });
      remoteStreamRef.current = null;
    }

    // Clear audio element (but don't remove it from DOM - it's part of JSX)
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current.pause();
      console.log('[Audio] Audio element cleared (kept in DOM)');
      // Note: We don't set audioRef.current = null because the element persists in JSX
    }

    // Remove device change listener
    navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);

    console.log('[Audio] Cleanup complete');
  }, [handleDeviceChange]);

  // Initialize audio elements and request permissions
  const initializeAudio = useCallback(async () => {
    try {
      console.log('[Audio] ðŸŽ¤ Initializing audio...');

      // Check for browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support audio capture');
      }

      // Request microphone access with optimal constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        },
        video: false
      });

      console.log('[Audio] âœ… Microphone access granted, tracks:', stream.getAudioTracks().length);

      // Log track details
      stream.getAudioTracks().forEach(track => {
        console.log('[Audio] Track:', track.label, 'enabled:', track.enabled, 'muted:', track.muted);
      });

      // Store local stream for microphone
      localStreamRef.current = stream;

      // Configure the audio element for remote audio (already created in JSX)
      if (audioRef.current) {
        audioRef.current.volume = volume / 100;
        audioRef.current.muted = false;
        console.log('[Audio] Audio element configured, volume:', audioRef.current.volume);
      } else {
        console.warn('[Audio] Audio element not found - it should be created via JSX');
      }

      // Create AudioContext for better control (helps with autoplay policies)
      try {
        const audioContext = new AudioContext();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
          console.log('[Audio] AudioContext resumed');
        }
        console.log('[Audio] AudioContext state:', audioContext.state);
      } catch (e) {
        warn('[Audio] AudioContext setup failed:', e);
      }

      // Test audio playback capability
      if (audioRef.current) {
        try {
          await audioRef.current.play();
          audioRef.current.pause();
          console.log('[Audio] âœ… Audio playback test passed');
        } catch (e) {
          warn('[Audio] Audio playback test failed (may need user interaction):', e);
        }
      }

      // Listen for device changes
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

      console.log('[Audio] âœ… Audio initialized successfully');
      showToast.success('Microphone ready!');
      return true;
    } catch (error) {
      logError('[Audio] Failed to initialize audio:', error);

      // Provide specific error messages
      let errorMessage = 'Microphone access denied. Please allow microphone access.';

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access was denied. Click the lock icon in your browser address bar to allow microphone access.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone device found. Please connect a microphone and try again.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Your browser does not support audio features. Please use Chrome, Edge, or Firefox.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone is already in use. Please close other applications using the microphone.';
        }
      }

      toast.error(errorMessage);
      return false;
    }
  }, [volume, handleDeviceChange, showToast]);


  const startSharedSession = useCallback((call: CallSession, source: CallSessionSource = 'softphone') => {
    sessionIdRef.current = call.id;
    startSession({
      id: call.id,
      number: call.number,
      status: call.status as CallSessionStatus,
      source,
      campaignId: call.campaignId,
      recipientName: call.recipientName,
      metadata: {
        callerId: selectedPhoneNumber,
        direction: call.direction,
        callSid: call.callSid
      }
    });
  }, [selectedPhoneNumber, startSession]);

  const updateSharedSession = useCallback((call: CallSession) => {
    if (!sessionIdRef.current) return;
    updateSession({
      number: call.number,
      status: call.status as CallSessionStatus,
      campaignId: call.campaignId,
      recipientName: call.recipientName,
      metadata: {
        callerId: selectedPhoneNumber,
        isMuted: call.isMuted,
        isOnHold: call.isOnHold,
        isRecording: call.isRecording,
        callSid: call.callSid
      }
    });
  }, [selectedPhoneNumber, updateSession]);

  const endSharedSession = useCallback((status: CallSessionStatus = 'ended') => {
    if (sessionIdRef.current) {
      endSession(status);
      sessionIdRef.current = null;
    }
  }, [endSession]);

  // Save position to localStorage and notify parent
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('softphone_position', JSON.stringify(currentPosition));

    // Notify parent component
    if (onPositionChange) {
      onPositionChange(currentPosition);
    }
  }, [currentPosition, onPositionChange]);

  // Ensure softphone is visible when window is resized
  useEffect(() => {
    const handleResize = () => {
      const softphoneWidth = 384;
      // Dynamic height: use viewport height minus margins (40px total)
      const softphoneHeight = Math.min(650, window.innerHeight - 40);

      // Check if current position is off-screen
      if (currentPosition.x > window.innerWidth - 100 ||
        currentPosition.y > window.innerHeight - 100) {
        // Reposition to bottom-right
        const x = Math.max(20, window.innerWidth - softphoneWidth - 20);
        const y = Math.max(20, window.innerHeight - softphoneHeight - 20);
        setCurrentPosition({ x, y });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentPosition]);

  const selectedCountryOption = useMemo(() => (
    COUNTRY_OPTIONS.find(option => option.code === selectedCountry) || COUNTRY_OPTIONS[0]
  ), [selectedCountry]);

  useEffect(() => {
    if (currentCall?.status === 'connected' && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentCall]);

  const fetchNumbersFromSignalWireDirectly = async () => {
    try {
      console.log('Fetching numbers directly from SignalWire API...');

      // Try to get SignalWire credentials from backend
      const settingsUrl = `${API_URL}/sms-settings`;
      const settingsResponse = await fetch(settingsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        console.log('SMS Settings:', settings);

        // Check if we have SignalWire credentials
        if (settings.signalwireProjectId && settings.signalwireSpaceUrl && settings.signalwireApiToken) {
          console.log('Found SignalWire credentials, fetching numbers directly...');

          // Create a simple backend endpoint to fetch numbers directly from SignalWire
          const directUrl = `${API_URL}/sms/fetch-signalwire-numbers`;
          const directResponse = await fetch(directUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              projectId: settings.signalwireProjectId,
              spaceUrl: settings.signalwireSpaceUrl,
              apiToken: settings.signalwireApiToken
            })
          });

          if (directResponse.ok) {
            const data = await directResponse.json();
            console.log('Direct SignalWire numbers:', data);
            return data.numbers || [];
          }
        }
      }
    } catch (err) {
      console.error('Error fetching numbers directly from SignalWire:', err);
    }

    return [];
  };

  // Clean up on unmount
  useEffect(() => {
    // Suppress harmless FN_NOT_FOUND errors from browser extensions
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const isFnNotFound =
        (reason instanceof Error && reason.message?.includes('FN_NOT_FOUND')) ||
        (typeof reason === 'string' && reason.includes('FN_NOT_FOUND')) ||
        (reason?.toString?.().includes('FN_NOT_FOUND'));

      if (isFnNotFound) {
        event.preventDefault(); // Suppress browser extension cleanup errors
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      cleanupAudio();
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      // Clean up all intervals
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
        statusPollingRef.current = null;
      }
      // Clean up legacy window-based cleanup
      if ((window as any).callStatusCleanup) {
        (window as any).callStatusCleanup();
        (window as any).callStatusCleanup = null;
      }
    };
  }, []);

  const fetchPhoneNumbers = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isFetchingPhoneNumbersRef.current) {
      log('[Softphone] â ¸ï¸  Already fetching phone numbers, skipping...');
      return;
    }

    try {
      isFetchingPhoneNumbersRef.current = true;
      log('[Softphone] Fetching phone numbers...');

      // Check cache first (5 minute cache)
      const cacheKey = 'softphone_phone_numbers';
      const cacheTimeKey = 'softphone_phone_numbers_time';
      const cachedData = localStorage.getItem(cacheKey);
      const cachedTime = localStorage.getItem(cacheTimeKey);

      if (cachedData && cachedTime) {
        const age = Date.now() - parseInt(cachedTime);
        if (age < 5 * 60 * 1000) { // 5 minutes
          const cached = JSON.parse(cachedData);
          // Only use cache if it has numbers
          if (Array.isArray(cached) && cached.length > 0) {
            log('[Softphone] Using cached phone numbers');
            setPhoneNumbers(cached);
            if (!selectedPhoneNumber || selectedPhoneNumber === 'none') {
              setSelectedPhoneNumber(cached[0].id);
            }
            return;
          }
          log('[Softphone] Cached numbers empty, fetching fresh data...');
        }
      }

      setIsLoadingNumbers(true);
      const collected: PhoneNumberEntry[] = [];

      // 1. Fetch Active Purchased Numbers (Primary Source)
      try {
        log('[Softphone] Fetching active purchased numbers...');
        const response: any = await api.get('/phone-numbers/active');
        if (response && response.items && Array.isArray(response.items)) {
          log(`[Softphone] Found ${response.items.length} purchased numbers`);
          const purchasedEntries = response.items.map((n: any) => ({
            id: `purchased-${n.id}`,
            number: n.phone_number,
            name: n.friendly_name || n.phone_number, // User defined friendly name
            isActive: true,
            isPrimary: !!n.is_primary, // Prefer primary number if available
            meta: {
              source: 'purchased',
              provider: n.provider
            }
          }));
          collected.push(...purchasedEntries);

          // If we found purchased numbers, we might still want to fetch connection numbers 
          // as they might include verified caller IDs not purchased through us.
        }
      } catch (err) {
        warn('[Softphone] Failed to fetch purchased numbers:', err);
      }

      // 2. Fetch from Connections (Secondary Source)
      // Use API client for consistent caching behavior
      const [connectionsData, campaignsData, settingsData] = await Promise.allSettled([
        api.getConnections(),
        api.getCampaigns(),
        api.getCallSettings()
      ]);

      log('[Softphone] API Results:', {
        connections: connectionsData.status,
        campaigns: campaignsData.status,
        settings: settingsData.status
      });

      // Process connections
      if (connectionsData.status === 'fulfilled') {
        const connections = Array.isArray(connectionsData.value) ? connectionsData.value : [];
        const signalwireConnections = connections.filter((c: any) =>
          c.provider === 'signalwire' && c.status === 'active'
        );

        // Get phone numbers from connections
        const numberPromises = signalwireConnections.map(async (connection: any) => {
          try {
            // Check cache
            const cachedNumbers = connection.phone_numbers || connection.phoneNumbers || [];
            if (Array.isArray(cachedNumbers) && cachedNumbers.length > 0) {
              return cachedNumbers.map((num: any) => ({
                id: `${connection.id}-${num.phone_number || num.phoneNumber || num.number}`,
                number: num.phone_number || num.phoneNumber || num.number,
                name: `${connection.name} - ${num.friendly_name || num.friendlyName || num.phone_number || num.phoneNumber || num.number}`,
                isActive: true,
                meta: {
                  source: 'connection',
                  connectionName: connection.name,
                  connectionId: connection.id
                }
              }));
            }

            // Fallback to API call
            const data = await api.getConnectionPhoneNumbers(connection.id);
            const numbers = data.phoneNumbers || [];
            return numbers.map((num: any) => ({
              id: `${connection.id}-${num.phone_number || num.number}`,
              number: num.phone_number || num.number,
              name: `${connection.name} - ${num.friendly_name || num.phone_number || num.number}`,
              isActive: true,
              meta: {
                source: 'connection',
                connectionName: connection.name,
                connectionId: connection.id
              }
            }));
          } catch (error) {
            warn(`[Softphone] Failed to fetch numbers for ${connection.id}:`, error);
            if (connection.config?.defaultSenderNumber) {
              return [{
                id: `${connection.id}-${connection.config.defaultSenderNumber}`,
                number: connection.config.defaultSenderNumber,
                name: `${connection.name} - Default`,
                isActive: true,
                meta: {
                  source: 'connection',
                  connectionName: connection.name,
                  connectionId: connection.id
                }
              }];
            }
            return [];
          }
        });

        const numbersArrays = await Promise.all(numberPromises);
        numbersArrays.forEach(nums => collected.push(...(nums as PhoneNumberEntry[])));
      }

      // Process campaigns (fallback)
      if (campaignsData.status === 'fulfilled' && collected.length === 0) {
        const campaigns = Array.isArray(campaignsData.value) ? campaignsData.value : [];
        campaigns.forEach((campaign: any) => {
          if (campaign.caller_id && !collected.find(n => n.number === campaign.caller_id)) {
            collected.push({
              id: `campaign-${campaign.id}`,
              number: campaign.caller_id,
              name: `Campaign: ${campaign.name}`,
              isActive: true,
              meta: { source: 'campaign' }
            });
          }
        });
      }

      // Process settings (final fallback)
      if (settingsData.status === 'fulfilled' && collected.length === 0) {
        const settings = settingsData.value as any;
        if (settings?.defaultCallerId) {
          collected.push({
            id: 'settings-default',
            number: settings.defaultCallerId,
            name: `Default Caller ID`,
            isActive: true,
            meta: { source: 'settings' }
          });
        }
      }

      // Remove duplicates (prioritizing purchased numbers as they were added first)
      const uniqueNumbers = collected.filter((v, i, self) =>
        i === self.findIndex(n => n.number === v.number)
      );

      log(`[Softphone] Loaded ${uniqueNumbers.length} total phone number(s)`);

      // Cache the results
      localStorage.setItem(cacheKey, JSON.stringify(uniqueNumbers));
      localStorage.setItem(cacheTimeKey, Date.now().toString());

      setPhoneNumbers(uniqueNumbers);

      if (uniqueNumbers.length > 0) {
        // If we don't have a selection, or current selection is 'none', pick the best one
        if (!selectedPhoneNumber || selectedPhoneNumber === 'none') {
          // Prefer primary number
          const primary = uniqueNumbers.find(n => n.isPrimary);
          if (primary) {
            setSelectedPhoneNumber(primary.id);
          } else {
            setSelectedPhoneNumber(uniqueNumbers[0].id);
          }
        }
        // If we successfully loaded numbers, show success
        if (!cachedData) { // Only toast if not from cache to avoid spam
          showToast.success(`Loaded ${uniqueNumbers.length} phone number(s)`);
        }
      } else {
        // Warning logic...
        const allConnections = connectionsData.status === 'fulfilled' && Array.isArray(connectionsData.value)
          ? connectionsData.value
          : [];
        const hasSignalwireConnections = allConnections.some((c: any) => c.provider === 'signalwire');

        if (hasSignalwireConnections) {
          showToast.warning('No phone numbers found. Please test your connection.');
        } else {
          showToast.warning('No connection found.');
        }
        setSelectedPhoneNumber('none');
      }
    } catch (error) {
      logError('[Softphone] Failed to fetch phone numbers:', error);
      toast.error('Failed to load phone numbers');
      setSelectedPhoneNumber('none');
    } finally {
      setIsLoadingNumbers(false);
      isFetchingPhoneNumbersRef.current = false;
    }
  }, [token, selectedPhoneNumber]);

  const fetchContacts = useCallback(async () => {
    // Use cache if available
    if (contactsCache) {
      log('[Softphone] Using cached contacts');
      setContacts(contactsCache);
      return;
    }

    // If not authenticated yet, don't attempt the call (prevents noisy errors)
    if (!token) {
      return;
    }

    try {
      setIsLoadingContacts(true);
      const contactsUrl = `${API_URL}/contacts`;

      const response = await fetch(contactsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const contactsList = Array.isArray(data) ? data : data.contacts || [];
        setContacts(contactsList);
        setContactsCache(contactsList); // Cache the results
        log(`[Softphone] Loaded ${contactsList.length} contacts`);
      }
    } catch (err) {
      console.error('[Softphone] Failed to fetch contacts:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [token]); // Keep token dependency but remove contactsCache to prevent loops

  const fetchCampaigns = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isFetchingCampaignsRef.current) {
      console.log('[Softphone] â¸ï¸ Already fetching campaigns, skipping...');
      return;
    }

    try {
      isFetchingCampaignsRef.current = true;
      // Check cache first (5 minute cache)
      const cacheKey = 'softphone_campaigns';
      const cacheTimeKey = 'softphone_campaigns_time';
      const cachedData = localStorage.getItem(cacheKey);
      const cachedTime = localStorage.getItem(cacheTimeKey);

      if (cachedData && cachedTime) {
        const age = Date.now() - parseInt(cachedTime);
        if (age < 5 * 60 * 1000) { // 5 minutes
          console.log('[Softphone] âœ… Using cached campaigns');
          setCampaigns(JSON.parse(cachedData));
          return;
        }
      }

      const campaignsUrl = `${API_URL}/calls/campaigns`;

      if (!API_URL || API_URL === '') {
        const mockCampaigns = [
          { id: 'mock-campaign-1', name: 'Marketing Campaign', status: 'active' },
          { id: 'mock-campaign-2', name: 'Sales Follow-up', status: 'active' }
        ];
        setCampaigns(mockCampaigns);
        return;
      }

      const campaigns = await api.getCallCampaigns();
      setCampaigns(campaigns);

      // Cache the results
      localStorage.setItem(cacheKey, JSON.stringify(campaigns));
      localStorage.setItem(cacheTimeKey, Date.now().toString());
    } catch (error) {
      warn('[Softphone] Failed to fetch campaigns:', error);
    } finally {
      isFetchingCampaignsRef.current = false;
    }
  }, []); // Remove token dependency - API client handles auth internally

  const loadCallSettings = useCallback(async () => {
    try {
      const settings = await api.getCallSettings();
      setCallSettings(settings);
      setUseSIP(Boolean(settings.sipEnabled && settings.sipServer));
    } catch (err) {
      console.error('Failed to load call settings:', err);
    }
  }, []);

  const loadCallHistory = useCallback(async () => {
    try {
      const logsUrl = `${API_URL}/calls/logs`;
      const response = await fetch(logsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const logs = (data.logs || []).map((log: any) => ({
          ...log,
          id: `log-${log.id}`,
          direction: log.direction || 'outbound',
          createdAt: log.created_at || log.createdAt
        }));
        setCallHistory(logs);
      }
    } catch (error) {
      logError('Failed to load call history:', error);
    }
  }, [token]);

  // Clear cache function
  const clearCache = useCallback(() => {
    localStorage.removeItem('softphone_phone_numbers');
    localStorage.removeItem('softphone_phone_numbers_time');
    localStorage.removeItem('softphone_campaigns');
    localStorage.removeItem('softphone_campaigns_time');
    console.log('[Softphone] Cache cleared');
  }, []);

  // Test SignalWire connection
  const testSignalWireConnection = async () => {
    try {
      const connections = await api.getConnections();
      const signalwireConnection = connections.find((c: any) => c.provider === 'signalwire');

      if (!signalwireConnection) {
        toast.error('No connection found');
        return;
      }

      showToast.info('Testing connection...');
      const result = await api.testConnection(signalwireConnection.id);

      if (result.success) {
        showToast.success('Connection tested successfully!');
        // Refresh phone numbers after successful test
        fetchPhoneNumbers();
      } else {
        showToast.error('Connection test failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      logError('Error testing connection:', error);
      showToast.error('Failed to test connection');
    }
  };

  // Refresh phone numbers when connection is tested
  const refreshPhoneNumbers = useCallback(() => {
    console.log('[Softphone] Refreshing phone numbers...');
    clearCache();
    fetchPhoneNumbers();
  }, [clearCache]); // Remove fetchPhoneNumbers dependency to prevent cycle

  // Load data when softphone opens (optimized with parallel loading and debounce)
  useEffect(() => {
    if (isOpen && !hasInitialLoadedRef.current) {
      hasInitialLoadedRef.current = true;

      // Clear any existing timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      // Debounce the data loading to prevent rapid successive calls
      fetchTimeoutRef.current = setTimeout(async () => {
        console.log('[Softphone] ðŸš€ Loading initial data...');

        // Load critical data in parallel for faster startup
        await Promise.all([
          fetchPhoneNumbers(),
          fetchCampaigns()
        ]);

        console.log('[Softphone] âœ… Critical data loaded');

        // Load non-critical data after
        const timeoutId = setTimeout(() => {
          loadCallSettings();
          loadCallHistory();
        }, 100);

        // Cleanup timeout if component unmounts or closes
        return () => {
          clearTimeout(timeoutId);
        };
      }, 200); // 200ms debounce

      // Cleanup timeout if component unmounts or closes
      return () => {
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
      };
    } else if (!isOpen) {
      // Reset the flag when softphone closes so it can load again when reopened
      hasInitialLoadedRef.current = false;
    }
  }, [isOpen, fetchPhoneNumbers, fetchCampaigns]);

  // Listen for connection test events to refresh phone numbers
  useEffect(() => {
    const handleConnectionTested = (event: CustomEvent) => {
      console.log('[Softphone] Connection tested, refreshing phone numbers...');
      refreshPhoneNumbers();
    };

    // Add event listener
    window.addEventListener('connectionTested', handleConnectionTested as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('connectionTested', handleConnectionTested as EventListener);
    };
  }, [refreshPhoneNumbers]);

  // Cleanup on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      console.log('[Softphone] Component unmounting, cleaning up resources...');

      // Cleanup audio resources
      cleanupAudio();

      // Clear status polling interval
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
        statusPollingRef.current = null;
      }

      // Clear audio monitor interval
      if ((window as any).audioMonitorInterval) {
        clearInterval((window as any).audioMonitorInterval);
        (window as any).audioMonitorInterval = null;
      }

      // Clear call status cleanup
      if ((window as any).callStatusCleanup) {
        (window as any).callStatusCleanup();
        (window as any).callStatusCleanup = null;
      }

      // End any active call session
      if (sessionIdRef.current) {
        endSession('ended');
        sessionIdRef.current = null;
      }

      console.log('[Softphone] Cleanup complete');
    };
  }, [cleanupAudio, endSession]); // Dependencies for cleanup functions

  const formatPhoneNumber = (number: string) => {
    if (!number) return '';
    try {
      const parsed = parsePhoneNumberFromString(number);
      if (parsed) {
        return parsed.formatInternational();
      }
    } catch (error) {
      // fall back to original number
    }
    return number;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dragRef.current) return;

    setIsDragging(true);
    const rect = dragRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    setCurrentPosition({
      x: Math.max(0, Math.min(newX, window.innerWidth - 400)),
      y: Math.max(0, Math.min(newY, window.innerHeight - 600))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleResizeMove = (e: MouseEvent) => {
      if (!dragRef.current) return;

      const rect = dragRef.current.getBoundingClientRect();
      let newWidth = size.width;
      let newHeight = size.height;
      let newX = currentPosition.x;
      let newY = currentPosition.y;

      const aspectRatio = 384 / 820;

      // Minimum and maximum widths (heights will follow aspect ratio)
      const minWidth = 300;
      const maxWidth = 1200; // Increased limit as requested

      // Calculate deltas
      let deltaW = 0;

      if (resizeDirection.includes('e')) {
        deltaW = e.clientX - rect.left - size.width;
      } else if (resizeDirection.includes('w')) {
        deltaW = rect.left - e.clientX; // approximate, better to use drag start
      } else if (resizeDirection.includes('s')) {
        // If dragging south (bottom) edge only, convert vertical delta to width delta
        const deltaH = e.clientY - rect.top - size.height;
        deltaW = deltaH * aspectRatio;
      } else if (resizeDirection.includes('n')) {
        const deltaH = rect.top - e.clientY;
        deltaW = deltaH * aspectRatio;
      }

      // If dragging we need to be more precise about start positions but for now this reactive logic
      // is slightly buggy if we mix mouse position.
      // Better approach: Calculate desired dimensions based on mouse, then lock AR.

      if (resizeDirection.includes('e')) {
        newWidth = e.clientX - rect.left;
      }
      else if (resizeDirection.includes('w')) {
        const deltaX = rect.left - e.clientX;
        newWidth = size.width + deltaX;
        // Adjustment for position X happens later
      }

      // If purely vertical, derive from height
      if (resizeDirection === 's' || resizeDirection === 'n') {
        let tentativeHeight = size.height;
        if (resizeDirection === 's') tentativeHeight = e.clientY - rect.top;
        if (resizeDirection === 'n') tentativeHeight = size.height + (rect.top - e.clientY);

        newWidth = tentativeHeight * aspectRatio;
      }

      // Constrain width
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

      // Check height constraint (viewport)
      newHeight = newWidth / aspectRatio;
      if (newHeight > window.innerHeight - 20) {
        newHeight = window.innerHeight - 20;
        newWidth = newHeight * aspectRatio;
      }

      // Apply X/Y position updates for left/top resizing
      // Note: This logic for 'w' and 'n' needs to use the actual committed newWidth/newHeight difference
      if (resizeDirection.includes('w')) {
        newX = currentPosition.x - (newWidth - size.width);
      }
      if (resizeDirection.includes('n')) {
        newY = currentPosition.y - (newHeight - size.height);
      }

      setSize({ width: newWidth, height: newHeight });
      if (newX !== currentPosition.x || newY !== currentPosition.y) {
        setCurrentPosition({ x: newX, y: newY });
      }
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      setResizeDirection('');
      // Save size to localStorage
      localStorage.setItem('softphone_size', JSON.stringify(size));
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, resizeDirection, size, currentPosition]);

  // Load saved size from localStorage
  useEffect(() => {
    const savedSize = localStorage.getItem('softphone_size');
    if (savedSize) {
      try {
        const parsed = JSON.parse(savedSize);
        if (parsed.width && parsed.height) {
          setSize(parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved size:', e);
      }
    }
  }, []);


  // Sync audio element volume when volume state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      console.log('[Audio] Volume synced:', audioRef.current.volume);
    }
  }, [volume]);

  // Update call timer every second for connected calls
  useEffect(() => {
    if (currentCall?.status === 'connected') {
      const interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentCall?.status]);

  const handleNumberInput = (digit: string) => {
    if (currentCall?.status === 'connected') {
      // Send DTMF tone during active call
      handleDTMF(digit);
      return;
    }
    setPhoneNumber(prev => prev + digit);
  };


  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
    if (volumeRef.current) {
      volumeRef.current.volume = newVolume / 100;
    }
  }, []);

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPhoneNumber('');
  };

  const testCall = () => {
    // Test number provided by user: ++5878008973
    const testNumber = '+15878008973';
    setPhoneNumber(testNumber);

    if (selectedPhoneNumber) {
      toast.success(`Test number ${testNumber} loaded. Ready to call.`);
    } else {
      toast.error('Please select a caller ID first');
    }
  };

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(formatPhoneNumber(phoneNumber));
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    } catch (err) {
      console.error('Failed to copy number:', err);
    }
  };

  const normalizePhoneNumber = useCallback((input: string) => {
    if (!input) return '';
    const parsed = parsePhoneNumberFromString(input, selectedCountry);
    if (parsed && parsed.isPossible()) {
      return parsed.number;
    }
    const cleaned = input.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    const dialCode = getDialCodeForCountry(selectedCountry);
    return `${dialCode}${cleaned.replace(/^0+/, '')}`;
  }, [selectedCountry]);

  // Fallback REST API call method
  const makeSignalWireRestCall = useCallback(async (callSession: CallSession, toNumber: string, fromNumber: string) => {
    const makeCallUrl = `${API_URL}/calls/make`;
    const response = await fetch(makeCallUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: toNumber,
        from: fromNumber,
        campaign_id: selectedCampaign && selectedCampaign !== 'none' ? selectedCampaign : undefined
      })
    });

    const result = await response.json();
    console.log('SignalWire REST call response:', result);

    if (response.ok && result.success) {
      setCurrentCall((prev) => {
        const updated = prev ? {
          ...prev,
          callSid: result.callSid,
          status: 'ringing' as const,
          startTime: new Date()
        } : null;
        if (updated) {
          updateSharedSession(updated);
        }
        return updated;
      });

      onCallStart?.(toNumber, selectedCampaign && selectedCampaign !== 'none' ? selectedCampaign : undefined);
      toast.success(`Call initiated successfully from ${formatPhoneNumber(fromNumber)} (REST API)`);

      // Poll call status periodically
      statusPollingRef.current = setInterval(async () => {
        const sid = currentCallRef.current?.callSid;
        if (!sid) return;

        try {
          const statusUrl = `${API_URL}/calls/status`;
          const statusResponse = await fetch(`${statusUrl}?callSid=${sid}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('[Softphone] Status poll:', statusData.status);

            // If call is ended remotely, update local state
            if (statusData.status === 'ended' || statusData.status === 'failed' || statusData.status === 'completed' || statusData.status === 'no-answer' || statusData.status === 'busy') {
              console.log('[Softphone] Call ended remotely:', statusData.status);
              handleCallEnd();
              if (statusPollingRef.current) {
                clearInterval(statusPollingRef.current);
                statusPollingRef.current = null;
              }
            } else if ((statusData.status === 'connected' || statusData.status === 'in-progress' || statusData.status === 'answered') && currentCallRef.current?.status !== 'connected') {
              console.log('[Softphone] Call answered!');
              setCurrentCall((prev) => prev ? {
                ...prev,
                status: 'connected' as const,
                startTime: new Date()
              } : null);
            }
          }
        } catch (error) {
          console.warn('Error checking call status:', error);
        }
      }, 2000); // Check every 2 seconds for better responsiveness
    } else {
      console.error('Backend error response:', result);
      throw new Error(result.message || result.error || 'Call settings not configured. Please configure your call settings first.');
    }
  }, [token, selectedCampaign, updateSharedSession, onCallStart, currentCall?.callSid, currentCall?.status, warn]);

  const makeSignalWireCall = useCallback(async (callSession: CallSession, toNumber: string) => {
    // Extract the actual phone number from the selectedPhoneNumber ID
    const selectedNumberObj = phoneNumbers.find(num => num.id === selectedPhoneNumber);
    const fromNumber = selectedNumberObj ? selectedNumberObj.number : selectedPhoneNumber;

    if (!fromNumber || fromNumber.trim() === '' || fromNumber === 'none') {
      throw new Error('No caller ID selected. Please select a phone number to call from.');
    }

    try {
      console.log(`[Softphone] Initiating SignalWire call to ${toNumber} from ${fromNumber}`);

      // 1. Get Connection ID
      if (!selectedNumberObj?.meta?.connectionId) {
        if (selectedNumberObj?.meta?.source === 'purchased' || selectedNumberObj?.meta?.source === 'campaign' || selectedNumberObj?.meta?.source === 'settings') {
          console.log(`[Softphone] ${selectedNumberObj?.meta?.source} number selected. Using REST API fallback.`);
          await makeSignalWireRestCall(callSession, toNumber, fromNumber);
          return;
        }
        throw new Error('No SignalWire connection ID found for this number');
      }
      const connectionId = selectedNumberObj.meta.connectionId;

      // 2. Fetch JWT Token for WebRTC
      console.log('Fetching SignalWire WebRTC token...');
      const tokenData = await api.getConnectionToken(connectionId);

      if (!tokenData || !tokenData.token) {
        throw new Error('Failed to obtain WebRTC token');
      }

      // 3. Initialize WebRTC Service with Token
      const webRTCService = getSignalWireWebRTCService();

      // Set up handlers before initializing
      webRTCService.setHandlers({
        onStream: (stream) => {
          if (audioRef.current) {
            audioRef.current.srcObject = stream;
            audioRef.current.play().catch(e => console.warn('[Softphone] Auto-play prevented:', e));
          }
        },
        onStateChange: (call) => {
          // Handle state changes within the component
          if (call.state === 'destroyed' || call.state === 'hangup') {
            handleCallEnd();
          }
        },
        onIncomingCall: (call) => {
          // This handles calls received via <User> tag in REST fallback
          console.log('[Softphone] Receiving bridged call...', call.id);
          call.answer();
        }
      });

      await webRTCService.initialize({
        projectId: tokenData.projectId,
        token: tokenData.token,
        identity: tokenData.identity
      });

      // 4. Make Call
      // Audio handling is managed by the @signalwire/js SDK and service wrapper
      const webRTCSession = await webRTCService.makeCall(toNumber, fromNumber);
      console.log('WebRTC call established:', webRTCSession);

      // 5. Update local state
      setCurrentCall((prev) => {
        const updated = prev ? {
          ...prev,
          callSid: webRTCSession.id,
          status: 'connected' as const,
          startTime: new Date()
        } : null;
        if (updated) {
          updateSharedSession(updated);
        }
        return updated;
      });

      // 6. Notify success
      onCallStart?.(toNumber, selectedCampaign && selectedCampaign !== 'none' ? selectedCampaign : undefined);
      toast.success(`WebRTC call connected to ${formatPhoneNumber(toNumber)}`);

      // Store session globally for debugging/cleanup if needed
      (window as any).currentWebRTCSession = webRTCSession;

    } catch (error) {
      console.error('SignalWire WebRTC call failed:', error);

      // Fallback to REST API
      console.log('Falling back to REST API call...');
      await makeSignalWireRestCall(callSession, toNumber, fromNumber);
    }
  }, [phoneNumbers, selectedPhoneNumber, selectedCampaign, updateSharedSession, onCallStart, makeSignalWireRestCall]);

  const makeSIPCall = useCallback(async (callSession: CallSession, toNumber: string) => {
    try {
      // Initialize audio first
      const audioInitialized = await initializeAudio();
      if (!audioInitialized) {
        throw new Error('Failed to initialize audio');
      }

      // Initialize SIP service with settings and the established stream
      const initialized = await sipService.initialize({
        sipEnabled: true,
        sipServer: callSettings?.sipServer,
        sipPort: callSettings?.sipPort || 5060,
        sipUsername: callSettings?.sipUsername,
        sipPassword: callSettings?.sipPassword,
        sipDomain: callSettings?.sipDomain,
        sipTransport: callSettings?.sipTransport || 'udp',
        stunServer: callSettings?.stunServer,
        turnServer: callSettings?.turnServer,
        turnUsername: callSettings?.turnUsername,
        turnPassword: callSettings?.turnPassword,
        webrtcEnabled: callSettings?.webrtcEnabled !== false,
        autoAnswer: callSettings?.autoAnswer || false,
        dtmfType: (callSettings?.dtmfType as 'rfc2833' | 'inband' | 'info') || 'rfc2833'
      }, localStreamRef.current || undefined);

      if (!initialized) {
        throw new Error('Failed to initialize SIP service');
      }
      sipService.setCallStateChangeHandler((call) => {
        if (!call) {
          handleCallEnd();
          return;
        }

        setCurrentCall((prev) => {
          const updated = prev ? {
            ...prev,
            callSid: call.id,
            status: (call.status === 'answered' ? 'connected' :
              call.status === 'connecting' ? 'dialing' :
                call.status === 'ringing' ? 'ringing' :
                  call.status === 'hold' ? 'onhold' :
                    call.status === 'ended' ? 'ended' :
                      call.status === 'failed' ? 'failed' : prev.status) as CallSessionStatus,
            isMuted: call.muted,
            isOnHold: call.onHold,
            isRecording: call.recording
          } : null;
          if (updated) {
            updateSharedSession(updated);
          }
          return updated;
        });

        if (call.status === 'answered') {
          onCallStart?.(toNumber, selectedCampaign && selectedCampaign !== 'none' ? selectedCampaign : undefined);
          toast.success('SIP call connected');
        } else if (call.status === 'failed') {
          toast.error('SIP call failed');
        } else if (call.status === 'ended') {
          handleCallEnd();
        }
      });

      // Set up call event handler for remote stream
      sipService.setCallEventHandler((event, data) => {
        console.log('SIP call event:', event, data);

        if (event === 'remoteStream' && data instanceof MediaStream) {
          console.log('Received remote audio stream, tracks:', data.getAudioTracks().length);
          remoteStreamRef.current = data;

          if (audioRef.current) {
            try {
              audioRef.current.srcObject = data;

              // Ensure audio element plays
              audioRef.current.play().then(() => {
                console.log('Remote audio playing successfully');
              }).catch(e => {
                warn('Failed to play remote audio:', e);
                toast.error('Failed to play remote audio. Please check your audio settings.');
              });
            } catch (error) {
              logError('Error setting remote audio stream:', error);
              toast.error('Failed to setup audio stream');
            }
          }
        } else if (event === 'localStream' && data instanceof MediaStream) {
          console.log('Received local audio stream, tracks:', data.getAudioTracks().length);
          // Local stream is already handled in initializeAudio
        }
      });

      // Make SIP call
      const sipCall = await sipService.makeCall(toNumber);

      // Store SIP call reference
      setCurrentCall((prev) => prev ? {
        ...prev,
        callSid: sipCall?.id || prev.callSid,
        status: 'ringing'
      } : null);

    } catch (error) {
      logError('SIP call setup failed:', error);
      throw error;
    }
  }, [callSettings, initializeAudio, updateSharedSession, onCallStart, warn, logError, selectedCampaign]);

  const makeCall = useCallback(async (overrideNumber?: string) => {
    const targetNumber = (overrideNumber ?? phoneNumber ?? '').trim();
    if (!targetNumber || !selectedPhoneNumber || selectedPhoneNumber === 'none') {
      toast.error('Please enter a phone number and select a caller ID');
      return;
    }

    console.log('[Softphone] ðŸ“ž Making call to:', targetNumber);
    setIsLoading(true);
    setLastDialedNumber(targetNumber);
    const resolvedCampaign = pendingIntentRef.current?.campaignId || (selectedCampaign && selectedCampaign !== 'none' ? selectedCampaign : undefined);
    const resolvedRecipient = pendingIntentRef.current?.recipientName;
    const callId = `call_${Date.now()}`;
    const newCall: CallSession = {
      id: callId,
      number: targetNumber,
      status: 'dialing' as const,
      duration: 0,
      isMuted: false,
      isOnHold: false,
      isRecording: false,
      direction: 'outbound',
      campaignId: resolvedCampaign,
      recipientName: resolvedRecipient
    };

    console.log('[Softphone] Setting call state:', newCall);
    setCurrentCall(newCall);
    setCallTimer(0);
    startSharedSession(newCall);

    try {
      if (useSIP && callSettings) {
        // Use SIP/VOIP calling
        await makeSIPCall(newCall, targetNumber);
      } else {
        // Use SignalWire API
        await makeSignalWireCall(newCall, normalizePhoneNumber(targetNumber));
      }
    } catch (err) {
      console.error('Call error:', err);
      const failedCall: CallSession = {
        ...(currentCall ?? newCall),
        status: 'failed' as const,
        endTime: new Date(),
        duration: callTimer
      };
      setCurrentCall(failedCall);
      updateSharedSession(failedCall);
      endSharedSession('failed');
      toast.error(err instanceof Error ? err.message : 'Failed to make call');
    } finally {
      setIsLoading(false);
    }
  }, [callSettings, callTimer, currentCall, endSharedSession, normalizePhoneNumber, phoneNumber, selectedCampaign, selectedPhoneNumber, startSharedSession, updateSharedSession, useSIP]);

  const handleRedial = useCallback(() => {
    if (!lastDialedNumber) {
      toast.error('No number to redial');
      return;
    }
    console.log('[Softphone] Redialing:', lastDialedNumber);
    setPhoneNumber(lastDialedNumber);
    makeCall(lastDialedNumber);
  }, [lastDialedNumber, makeCall]);

  useEffect(() => {
    if (!pendingIntent || !isOpen) {
      return;
    }

    const alreadyHandling = pendingIntentRef.current && pendingIntentRef.current.id === pendingIntent.id;
    if (alreadyHandling) return;
    pendingIntentRef.current = pendingIntent;

    const intentNumber = pendingIntent.number || '';
    const normalizedNumber = normalizePhoneNumber(intentNumber);
    setPhoneNumber(normalizedNumber);

    // Set campaign if provided
    if (pendingIntent.campaignId) {
      setSelectedCampaign(pendingIntent.campaignId);
    }

    // Set caller ID if provided - find matching phone number entry
    if (pendingIntent.callerId) {
      console.log('[Softphone] Intent includes callerId:', pendingIntent.callerId);
      // Find the phone number entry that matches the caller ID
      const matchingNumber = phoneNumbers.find(pn =>
        pn.number === pendingIntent.callerId ||
        pn.number.replace(/\D/g, '') === pendingIntent.callerId?.replace(/\D/g, '')
      );
      if (matchingNumber) {
        console.log('[Softphone] Setting caller ID to:', matchingNumber.id, matchingNumber.number);
        setSelectedPhoneNumber(matchingNumber.id);
      } else {
        // Fast path: create a lightweight entry for the campaign caller ID so we can start immediately
        warn('[Softphone] Caller ID not found in available numbers, creating fast-path entry:', pendingIntent.callerId);
        const fastPathEntry: PhoneNumberEntry = {
          id: `campaign-${pendingIntent.callerId}`,
          number: pendingIntent.callerId,
          name: 'Campaign Caller ID',
          isActive: true,
          meta: { source: 'campaign' }
        };
        setPhoneNumbers([fastPathEntry]);
        setSelectedPhoneNumber(fastPathEntry.id);

        // Load full list in background (non-blocking)
        fetchPhoneNumbers().catch(err => {
          warn('[Softphone] Background number load failed:', err);
        });
      }
    }

    const initiate = async () => {
      try {
        await makeCall(normalizedNumber);
      } finally {
        onIntentConsumed?.();
        pendingIntentRef.current = null;
      }
    };

    initiate();
  }, [pendingIntent, isOpen, normalizePhoneNumber, onIntentConsumed, phoneNumbers]);

  // Initialize audio elements and request permissions




  const handleCallEnd = async (sipCall?: SIPCall) => {
    // Clean up status polling immediately
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
      statusPollingRef.current = null;
    }

    // Also clean up legacy window-based cleanup
    if ((window as any).callStatusCleanup) {
      (window as any).callStatusCleanup();
      (window as any).callStatusCleanup = null;
    }

    if (!currentCall) {
      endSharedSession('ended');
      toast.success('Call ended');
      return;
    }

    const endedCall: CallSession = {
      ...currentCall,
      status: 'ended' as const,
      endTime: new Date(),
      duration: callTimer
    };

    setCallHistory(prev => [endedCall, ...prev].slice(0, 10));

    // Save call log to database
    try {
      await api.logCall({
        sessionId: endedCall.sessionId,
        duration: endedCall.duration,
        outcome: 'completed',
        recordingUrl: endedCall.recordingUrl,
        campaignId: endedCall.campaignId,
        phoneNumber: endedCall.phoneNumber,
        agent: endedCall.agent
      });
      console.log('âœ“ Call log saved to database');
    } catch (error) {
      warn('Failed to save call log:', error);
      // Don't block the UI if logging fails
    }

    setCurrentCall(null);
    setCallTimer(0);
    setIsMuted(false);
    setIsOnHold(false);
    setShowKeypad(false);
    setShowTransfer(false);
    setShowConference(false);

    // Clean up audio resources using the new cleanup function
    cleanupAudio();

    onCallEnd?.(endedCall.duration, endedCall);
    endSharedSession('ended');
    toast.success('Call ended');
  };

  const handleEndCall = async () => {
    if (!currentCall) return;

    console.log('FORCEFULLY ending call:', currentCall);

    // Always end the call locally first
    handleCallEnd();

    try {
      if (useSIP) {
        // End SIP call
        await sipService.endCall();
      } else {
        // Check if we have an active WebRTC session
        const webRTCSession = (window as any).currentWebRTCSession;
        if (webRTCSession) {
          console.log('Ending WebRTC call');
          const webRTCService = getSignalWireWebRTCService();
          await webRTCService.endCall();
          (window as any).currentWebRTCSession = null;
        } else if (currentCall.callSid) {
          // End SignalWire REST API call
          const endCallUrl = `${API_URL}/calls/end`;
          await fetch(endCallUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              callSid: currentCall.callSid
            })
          });
        }
      }
      toast.success('Call ended successfully');
    } catch (error) {
      warn('Failed to end call via API:', error);
      // Don't show error to user since we already ended the call locally
    }
  };

  const handleDTMF = async (digit: string) => {
    if (!currentCall) return;

    try {
      if (useSIP) {
        // Send DTMF via SIP
        await sipService.sendDTMF(digit);
        toast.success(`Sent DTMF: ${digit}`);
      } else {
        // Check if we have an active WebRTC session
        const webRTCSession = (window as any).currentWebRTCSession;
        if (webRTCSession) {
          console.log('Sending DTMF via WebRTC');
          const webRTCService = getSignalWireWebRTCService();
          await webRTCService.sendDTMF(digit);
          toast.success(`Sent DTMF: ${digit}`);
        } else {
          // Send DTMF via SignalWire REST API
          const dtmfUrl = `${API_URL}/calls/dtmf`;
          const response = await fetch(dtmfUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              callSid: currentCall.callSid,
              digit
            })
          });

          if (response.ok) {
            toast.success(`Sent DTMF: ${digit}`);
          }
        }
      }
    } catch (error) {
      logError('Failed to send DTMF:', error);
      toast.error('Failed to send DTMF tone');
    }
  };

  const handleMute = async () => {
    if (!currentCall) return;

    try {
      if (useSIP) {
        // Mute via SIP/WebRTC
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
          });
        }
        setIsMuted(prev => {
          const newMuted = !prev;
          setCurrentCall(call => {
            if (!call) return call;
            const updated = { ...call, isMuted: newMuted };
            updateSharedSession(updated);
            return updated;
          });
          return newMuted;
        });
        toast.success(isMuted ? 'Microphone unmuted' : 'Microphone muted');
      } else {
        // Check if we have an active WebRTC session
        const webRTCSession = (window as any).currentWebRTCSession;
        if (webRTCSession) {
          console.log('Muting WebRTC call');
          const webRTCService = getSignalWireWebRTCService();
          const targetMuteState = !isMuted;
          await webRTCService.toggleMute(targetMuteState);

          setIsMuted(targetMuteState);
          setCurrentCall(call => {
            if (!call) return call;
            const updated = { ...call, isMuted: targetMuteState };
            updateSharedSession(updated);
            return updated;
          });
          toast.success(targetMuteState ? 'Microphone muted' : 'Microphone unmuted');
        } else {
          // Mute via SignalWire REST API
          const muteUrl = `${API_URL}/calls/mute`;
          const response = await fetch(muteUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              callSid: currentCall.callSid,
              muted: !isMuted
            })
          });

          if (response.ok) {
            setIsMuted(prev => {
              const newMuted = !prev;
              setCurrentCall(call => {
                if (!call) return call;
                const updated = { ...call, isMuted: newMuted };
                updateSharedSession(updated);
                return updated;
              });
              return newMuted;
            });
            toast.success(isMuted ? 'Microphone unmuted' : 'Microphone muted');
          }
        }
      }
    } catch (err) {
      console.error('Failed to toggle mute:', err);
      toast.error('Failed to toggle mute');
    }
  };

  const handleHold = async () => {
    if (!currentCall) return;

    try {
      if (useSIP) {
        // Hold via SIP
        await sipService.toggleHold();
        setIsOnHold(prev => {
          const newHold = !prev;
          setCurrentCall(call => {
            if (!call) return call;
            const updated = {
              ...call,
              isOnHold: newHold,
              status: (newHold ? 'onhold' : 'connected') as CallSessionStatus
            };
            updateSharedSession(updated);
            return updated;
          });
          return newHold;
        });
        toast.success(isOnHold ? 'Call resumed' : 'Call on hold');
      } else {
        // Check if we have an active WebRTC session
        const webRTCSession = (window as any).currentWebRTCSession;
        if (webRTCSession) {
          console.log('Toggling hold via WebRTC');
          // WebRTC hold functionality would need to be implemented in the service
          // For now, just update the UI state
          setIsOnHold(prev => {
            const newHold = !prev;
            setCurrentCall(call => {
              if (!call) return call;
              const updated = {
                ...call,
                isOnHold: newHold,
                status: (newHold ? 'onhold' : 'connected') as CallSessionStatus
              };
              updateSharedSession(updated);
              return updated;
            });
            return newHold;
          });
          toast.success(isOnHold ? 'Call resumed' : 'Call on hold');
        } else {
          // Hold via SignalWire REST API
          const response = await fetch(`${API_URL}/calls/hold`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              callSid: currentCall.callSid,
              hold: !isOnHold
            })
          });

          if (response.ok) {
            setIsOnHold(prev => {
              const newHold = !prev;
              setCurrentCall(call => {
                if (!call) return call;
                const updated = {
                  ...call,
                  isOnHold: newHold,
                  status: (newHold ? 'onhold' : 'connected') as CallSessionStatus
                };
                updateSharedSession(updated);
                return updated;
              });
              return newHold;
            });
            toast.success(isOnHold ? 'Call resumed' : 'Call on hold');
          }
        }
      }
    } catch (err) {
      console.error('Failed to toggle hold:', err);
      toast.error('Failed to toggle hold');
    }
  };

  const handleRecording = async () => {
    if (!currentCall?.callSid) return;

    try {
      if (useSIP) {
        // Recording via SIP (using MediaRecorder API)
        const newRecordingState = await sipService.toggleRecording();
        setCurrentCall(prev => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            isRecording: newRecordingState
          };
          updateSharedSession(updated);
          return updated;
        });
        toast.success(newRecordingState ? 'Recording started' : 'Recording stopped');
      } else {
        // Recording via SignalWire
        const recordingUrl = `${API_URL}/calls/recording`;
        const response = await fetch(recordingUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            callSid: currentCall.callSid,
            record: !currentCall.isRecording
          })
        });

        if (response.ok) {
          const result = await response.json();
          setCurrentCall(prev => {
            if (!prev) return prev;
            const updated = {
              ...prev,
              isRecording: !prev.isRecording,
              recordingUrl: result.recordingUrl || prev.recordingUrl
            };
            updateSharedSession(updated);
            return updated;
          });
          toast.success(currentCall.isRecording ? 'Recording stopped' : 'Recording started');
        }
      }
    } catch (err) {
      console.error('Failed to toggle recording:', err);
      toast.error('Failed to toggle recording');
    }
  };

  const handleKeypad = (digit: string) => {
    if (currentCall) {
      // Send DTMF during active call
      handleDTMF(digit);
    } else {
      // Add to phone number for dialing
      handleNumberInput(digit);
    }
  };

  const openDialerSettings = () => {
    // Navigate to settings with calls tab active
    window.location.href = '/settings?tab=calls';
  };

  const viewCallLogs = () => {
    // Open call logs in a new tab or modal
    window.open('/calls/logs', '_blank');
  };

  const handleAutoDial = async () => {
    if (!selectedCampaign || selectedCampaign === 'none') {
      toast.error('Please select a campaign first');
      return;
    }

    if (autoDialActive) {
      setAutoDialActive(false);
      toast.info('Auto dial stopped');
      return;
    }

    try {
      // Fetch campaign contacts for auto dialing using the correct endpoint
      const recipientsUrl = `${API_URL}/calls/recipients`;
      const response = await fetch(`${recipientsUrl}?campaignId=${selectedCampaign}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const contacts = data.recipients || data || [];

        // Filter contacts for the selected campaign
        const campaignContacts = contacts.filter(contact =>
          contact.campaign_id === selectedCampaign &&
          (contact.phone || contact.phone_number) &&
          (contact.phone || contact.phone_number).trim()
        );

        if (campaignContacts.length === 0) {
          toast.error('No contacts with phone numbers found in this campaign');
          return;
        }

        // Format contacts for auto dial
        const validContacts = campaignContacts.map(contact => ({
          id: contact.id,
          phone: contact.phone || contact.phone_number,
          name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.phone || contact.phone_number
        }));

        setAutoDialQueue(validContacts);
        setAutoDialActive(true);
        toast.info(`Auto dial started with ${validContacts.length} contacts`);

        // Start dialing the first contact
        if (validContacts.length > 0) {
          const firstContact = validContacts[0];
          setPhoneNumber(firstContact.phone);
          // Auto dial after a short delay
          setTimeout(() => {
            makeCall(firstContact.phone);
          }, 1000);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch campaign contacts:', errorData);
        toast.error(errorData.message || 'Failed to fetch campaign contacts');
      }
    } catch (err) {
      console.error('Auto dial error:', err);
      toast.error('Failed to start auto dial');
    }
  };

  const handleNextAutoDial = () => {
    if (!autoDialActive || autoDialQueue.length === 0) return;

    // Remove current contact from queue
    const remainingContacts = autoDialQueue.slice(1);
    setAutoDialQueue(remainingContacts);

    if (remainingContacts.length > 0) {
      // Dial next contact
      const nextContact = remainingContacts[0];
      setPhoneNumber(nextContact.phone);
      setTimeout(() => {
        makeCall(nextContact.phone);
      }, 1000);
    } else {
      // Auto dial complete
      setAutoDialActive(false);
      toast.success('Auto dial completed');
    }
  };


  const handleRedialFromHistory = (call: CallSession) => {
    setPhoneNumber(call.number);
    setSelectedPhoneNumber(call.metadata?.callerId || selectedPhoneNumber);
    setTimeout(() => {
      makeCall(call.number);
    }, 500);
  };

  const handleAddToContacts = (phoneNumber: string, name?: string) => {
    // This would integrate with a contacts system
    toast.info(`Add to contacts: ${phoneNumber} - Feature coming soon`);
  };

  const handleCallNote = (callId: string, note: string) => {
    // Add note to call
    setCallHistory(prev => prev.map(call =>
      call.id === callId ? { ...call, notes: note } : call
    ));
    toast.success('Call note added');
  };

  const handleTransfer = async () => {
    if (!currentCall?.callSid || !transferNumber.trim()) {
      toast.error('Please enter a transfer number');
      return;
    }

    try {
      if (useSIP) {
        // SIP transfer
        await sipService.transferCall(currentCall.callSid, transferNumber);
        toast.success(`Call transferred to ${transferNumber}`);
      } else {
        // SignalWire transfer
        const transferUrl = `${API_URL}/calls/transfer`;
        const response = await fetch(transferUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            callSid: currentCall.callSid,
            to: transferNumber
          })
        });

        if (response.ok) {
          toast.success(`Call transferred to ${transferNumber}`);
        } else {
          throw new Error('Transfer failed');
        }
      }
      setShowTransfer(false);
      setTransferNumber('');
    } catch (err) {
      console.error('Transfer failed:', err);
      toast.error('Failed to transfer call');
    }
  };

  const handleConference = async () => {
    if (!currentCall?.callSid || !conferenceNumber.trim()) {
      toast.error('Please enter a conference number');
      return;
    }

    try {
      if (useSIP) {
        // SIP conference
        await sipService.addToConference(currentCall.callSid, conferenceNumber);
        toast.success(`${conferenceNumber} added to conference`);
      } else {
        // SignalWire conference
        const response = await fetch(`${API_URL}/calls/conference`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            callSid: currentCall.callSid,
            to: conferenceNumber
          })
        });

        if (response.ok) {
          toast.success(`${conferenceNumber} added to conference`);
        } else {
          throw new Error('Conference failed');
        }
      }
      setShowConference(false);
      setConferenceNumber('');
    } catch (err) {
      console.error('Conference failed:', err);
      toast.error('Failed to add to conference');
    }
  };



  const formattedPhoneNumber = useMemo(() => {
    if (!phoneNumber) return '';
    // Remove country code for display
    const dialCode = getDialCodeForCountry(selectedCountry);
    let displayNumber = phoneNumber;
    if (phoneNumber.startsWith(dialCode)) {
      displayNumber = phoneNumber.slice(dialCode.length);
    }
    return displayNumber;
  }, [phoneNumber, selectedCountry]);

  const handleCountryChange = (value: string) => {
    const newCountry = value as CountryCode;
    const prevCountry = selectedCountry;
    const prevDial = getDialCodeForCountry(prevCountry);
    const newDial = getDialCodeForCountry(newCountry);
    setSelectedCountry(newCountry);
    setPhoneNumber(prev => {
      if (!prev) return newDial;
      if (prev === prevDial) return newDial;
      if (prev.startsWith(prevDial)) {
        return `${newDial}${prev.slice(prevDial.length)}`;
      }
      return prev.startsWith('+') ? prev : `${newDial}${prev.replace(/^0+/, '')}`;
    });
  };


  const toggleAutoDial = async () => {
    if (autoDialActive) {
      setAutoDialActive(false);
      setAutoDialQueue([]);
      toast.success('Auto dial stopped');
      return;
    }

    if (!selectedCampaign || selectedCampaign === 'none') {
      toast.error('Select a campaign to auto dial');
      return;
    }

    try {
      setIsLoading(true);
      const recipients = await api.getCallRecipients(selectedCampaign);
      const queue = recipients
        .filter((recipient: any) => recipient.phone || recipient.phone_number)
        .map((recipient: any) => {
          const phoneNumber = recipient.phone || recipient.phone_number;
          return {
            id: recipient.id,
            name: `${recipient.firstName || recipient.first_name || ''} ${recipient.lastName || recipient.last_name || ''}`.trim() || phoneNumber,
            number: phoneNumber,
            phone: phoneNumber // Add phone property to match AutoDialTarget interface
          };
        })
        .filter(target => Boolean(target.number));

      if (queue.length === 0) {
        toast.error('No dialable contacts in this campaign');
        return;
      }

      setAutoDialQueue(queue);
      setAutoDialActive(true);
      setPhoneNumber(queue[0].number);
      toast.success(`Auto dial queued ${queue.length} contact(s)`);
    } catch (error) {
      logError('Failed to start auto dial:', error);
      toast.error('Unable to load campaign contacts for auto dial');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!autoDialActive) return;

    const callInProgress = currentCall && ['dialing', 'ringing', 'connected', 'onhold'].includes(currentCall.status);
    if (callInProgress) return;

    if (autoDialQueue.length === 0) {
      setAutoDialActive(false);
      toast.success('Auto dial queue completed');
      return;
    }

    const [nextContact, ...rest] = autoDialQueue;
    setAutoDialQueue(rest);
    makeCall(nextContact.number);
  }, [autoDialActive, autoDialQueue, currentCall]);

  const dialPad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  // Enhanced SMS Functions
  const sendBulkSMS = async () => {
    const validRecipients = bulkSmsRecipients.filter(r => r.trim());

    if (!newSmsMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (validRecipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    const senderNumber = phoneNumbers.find(num => num.id === smsSenderNumber)?.number;
    if (!senderNumber || smsSenderNumber === 'none') {
      toast.error('Please select a sender phone number');
      return;
    }

    setIsLoadingSms(true);
    try {
      // Check if API is available
      /* Simulation mode removed for production testing */

      // Send to each recipient
      const results = await Promise.allSettled(
        validRecipients.map(recipient =>
          api.sendIndividualSMS({
            to: recipient,
            content: newSmsMessage,
            senderNumber
          })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (failed === 0) {
        toast.success(`Message sent to all ${successful} recipients`);
      } else if (successful > 0) {
        toast.warning(`Message sent to ${successful} recipients, failed to send to ${failed}`);
      } else {
        toast.error('Failed to send message to any recipients');
      }

      setNewSmsMessage('');
      setBulkSmsRecipients(['']);
      setShowBulkSms(false);

    } catch (err) {
      console.error('Failed to send bulk SMS:', err);
      toast.error('Failed to send bulk messages');
    } finally {
      setIsLoadingSms(false);
    }
  };

  const addBulkRecipient = () => {
    setBulkSmsRecipients(prev => [...prev, '']);
  };

  const removeBulkRecipient = (index: number) => {
    setBulkSmsRecipients(prev => prev.filter((_, i) => i !== index));
  };

  const updateBulkRecipient = (index: number, value: string) => {
    setBulkSmsRecipients(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const filteredConversations = smsConversations.filter(conv =>
    conv.phoneNumber.includes(smsSearchQuery) ||
    (conv.name && conv.name.toLowerCase().includes(smsSearchQuery.toLowerCase()))
  );
  const sendSMS = async () => {
    if (!newSmsMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    // Determine recipient based on conversation type
    let recipient = smsRecipient;
    if (selectedConversation && selectedConversation !== 'new') {
      recipient = selectedConversation;
    }

    if (!recipient.trim()) {
      toast.error('Please enter a recipient phone number');
      return;
    }

    const senderNumber = phoneNumbers.find(num => num.id === smsSenderNumber)?.number;
    if (!senderNumber || smsSenderNumber === 'none') {
      toast.error('Please select a sender phone number');
      return;
    }

    setIsLoadingSms(true);
    try {
      // Check if API is available
      if (!API_URL || API_URL.includes('localhost:8080')) {
        // Simulate SMS sending for demo
        console.log('Simulating SMS send to:', recipient, 'Message:', newSmsMessage);
        console.log('From sender:', senderNumber);
        console.log('Campaign:', smsSelectedCampaign);

        // Add message to local state
        const newMessage = {
          id: Date.now().toString(),
          content: newSmsMessage,
          direction: 'outbound' as const,
          timestamp: new Date().toISOString(),
          status: 'sent' as const
        };

        setSmsMessages(prev => [...prev, newMessage]);
        setNewSmsMessage('');

        // If this is a new conversation, update the conversations list
        if (selectedConversation === 'new') {
          const newConv = {
            id: Date.now().toString(),
            phoneNumber: recipient,
            lastMessage: newSmsMessage,
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0
          };
          setSmsConversations(prev => [newConv, ...prev]);
          setSelectedConversation(recipient);
        }

        toast.success('Message sent (Demo Mode)');
        return;
      }

      const response = await api.sendIndividualSMS({
        to: recipient,
        content: newSmsMessage,
        senderNumber
      });

      if (response) {
        // Add message to local state
        const newMessage = {
          id: Date.now().toString(),
          content: newSmsMessage,
          direction: 'outbound' as const,
          timestamp: new Date().toISOString(),
          status: 'sent' as const
        };

        setSmsMessages(prev => [...prev, newMessage]);
        setNewSmsMessage('');

        // If this is a new conversation, update the conversations list
        if (selectedConversation === 'new') {
          const newConv = {
            id: Date.now().toString(),
            phoneNumber: recipient,
            lastMessage: newSmsMessage,
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0
          };
          setSmsConversations(prev => [newConv, ...prev]);
          setSelectedConversation(recipient);
        }

        toast.success('Message sent successfully');
      }
    } catch (err) {
      console.error('Failed to send SMS:', err);
      toast.error('Failed to send message - Backend unavailable');
    } finally {
      setIsLoadingSms(false);
    }
  };

  const loadSMSConversations = async () => {
    try {
      // Check if API is available
      if (!API_URL || API_URL.includes('localhost:8080')) {
        console.log('Using mock SMS conversations for demo...');
        // Add mock conversations for demo
        const mockConversations = [
          {
            id: 'mock-1',
            phoneNumber: '+1234567890',
            name: 'John Doe',
            lastMessage: 'Hey, how are you?',
            lastMessageTime: new Date().toISOString(),
            unreadCount: 1
          },
          {
            id: 'mock-2',
            phoneNumber: '+0987654321',
            name: 'Jane Smith',
            lastMessage: 'See you tomorrow!',
            lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
            unreadCount: 0
          }
        ];
        setSmsConversations(mockConversations);
        return;
      }

      // Get SMS replies which serve as conversations
      const replies = await api.getSMSReplies();

      // Group by phone number to create conversations
      const conversations = replies.reduce((acc: any[], reply) => {
        const existing = acc.find(c => c.phoneNumber === reply.phone_number);

        if (existing) {
          existing.lastMessage = reply.message;
          existing.lastMessageTime = reply.received_at;
          existing.unreadCount += reply.direction === 'inbound' ? 1 : 0;
        } else {
          acc.push({
            id: reply.id,
            phoneNumber: reply.phone_number,
            name: undefined, // SMSReply doesn't have contact_name
            lastMessage: reply.message,
            lastMessageTime: reply.received_at,
            unreadCount: reply.direction === 'inbound' ? 1 : 0
          });
        }

        return acc;
      }, []);

      setSmsConversations(conversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      // Set empty conversations on error
      setSmsConversations([]);
    }
  };

  const loadSMSMessages = async (phoneNumber: string) => {
    try {
      const replies = await api.getSMSReplies();
      const messages = replies
        .filter(reply => reply.phone_number === phoneNumber)
        .map(reply => ({
          id: reply.id,
          content: reply.message,
          direction: reply.direction,
          timestamp: reply.received_at,
          status: undefined
        }))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      setSmsMessages(messages);
    } catch (error) {
      logError('Failed to load messages:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'sms') {
      loadSMSConversations();
    } else if (activeTab === 'contacts') {
      fetchContacts();
    }
  }, [activeTab, fetchContacts]);

  // Sync SMS sender number with selected phone number
  useEffect(() => {
    if (selectedPhoneNumber && selectedPhoneNumber !== 'none' && (!smsSenderNumber || smsSenderNumber === 'none')) {
      setSmsSenderNumber(selectedPhoneNumber);
    }
  }, [selectedPhoneNumber]);

  const quickActions = [
    { label: 'Mute', icon: MicOff, action: handleMute, condition: currentCall?.status === 'connected' },
    { label: 'Hold', icon: Pause, action: handleHold, condition: currentCall?.status === 'connected' },
    { label: 'Record', icon: Circle, action: handleRecording, condition: currentCall?.status === 'connected' },
    { label: 'Keypad', icon: Hash, action: () => setShowKeypad(!showKeypad), condition: currentCall?.status === 'connected' },
    { label: 'Transfer', icon: ArrowRight, action: () => setShowTransfer(true), condition: currentCall?.status === 'connected' },
    { label: 'Conference', icon: Users, action: () => setShowConference(true), condition: currentCall?.status === 'connected' }
  ];

  const getCallStatusColor = () => {
    switch (currentCall?.status) {
      case 'dialing': return 'text-muted-foreground';
      case 'ringing': return 'text-muted-foreground';
      case 'connected': return 'text-foreground';
      case 'onhold': return 'text-muted-foreground';
      case 'ended': return 'text-muted-foreground';
      case 'failed': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getCallStatusText = () => {
    switch (currentCall?.status) {
      case 'dialing': return 'Dialing...';
      case 'ringing': return 'Ringing...';
      case 'connected': return 'Connected';
      case 'onhold': return 'On Hold';
      case 'ended': return 'Call Ended';
      case 'failed': return 'Call Failed';
      default: return 'Ready';
    }
  };

  const canCall = Boolean(phoneNumber && phoneNumber.trim().length > 0) && Boolean(selectedPhoneNumber && selectedPhoneNumber !== 'none') && !isLoading;
  const connectionHealth: 'good' | 'loading' | 'none' = isLoadingNumbers ? 'loading' : phoneNumbers.length > 0 ? 'good' : 'none';
  const selectedCampaignName = selectedCampaign && selectedCampaign !== 'none'
    ? campaigns.find(c => c.id === selectedCampaign)?.name
    : undefined;

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden audio element for remote audio playback */}
      <audio
        ref={(el) => {
          if (el && !audioRef.current) {
            audioRef.current = el;
            el.autoplay = true;
            el.volume = volume / 100;
            console.log('[Audio] Audio element initialized via JSX');
          }
        }}
        autoPlay
        playsInline
        style={{ display: 'none' }}
      />
      <div
        ref={dragRef}
        className="fixed z-[9999] flex"
        style={{
          left: currentPosition.x,
          top: currentPosition.y
        }}
      >
        <Card
          className={cn(
            "select-none overflow-hidden flex flex-col relative rounded-xl transition-colors duration-300",
            softphoneThemeClasses
          )}
          style={{
            width: `${size.width}px`,
            height: `${size.height}px`,
            maxHeight: 'calc(100vh - 40px)'
          }}
        >
          {/* Content wrapper with scale transform */}
          <div
            className="w-full h-full origin-top-left flex flex-col"
            style={{
              transform: `scale(${size.width / 384})`,
              width: '384px',
              height: '820px'
            }}
          >
            {/* Resize Handles */}
            {/* Edges */}
            <div
              className="absolute top-0 left-0 right-0 h-1 cursor-n-resize hover:bg-primary/20 transition-colors"
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize hover:bg-primary/20 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 's')}
            />
            <div
              className="absolute top-0 bottom-0 left-0 w-1 cursor-w-resize hover:bg-primary/20 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'w')}
            />
            <div
              className="absolute top-0 bottom-0 right-0 w-1 cursor-e-resize hover:bg-primary/20 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'e')}
            />
            {/* Corners */}
            <div
              className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize hover:bg-primary/30 transition-colors rounded-tl-xl"
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
            />
            <div
              className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize hover:bg-primary/30 transition-colors rounded-tr-xl"
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
            />
            <div
              className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize hover:bg-primary/30 transition-colors rounded-bl-xl"
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
            />
            <div
              className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize hover:bg-primary/30 transition-colors rounded-br-xl z-10"
              onMouseDown={(e) => handleResizeStart(e, 'se')}
            >
              <Move className="h-2 w-2 text-muted-foreground/50" />
            </div>
            {incomingCall && (
              <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in zoom-in-95 duration-200 text-foreground">
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Phone className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">Incoming Call</h3>
                  <p className="text-xl font-mono text-muted-foreground">{incomingCall.from}</p>
                </div>
                <div className="flex items-center gap-6 w-full justify-center">
                  <Button
                    size="lg"
                    className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg"
                    onClick={handleReject}
                  >
                    <PhoneOff className="h-8 w-8 text-white" />
                  </Button>
                  <Button
                    size="lg"
                    className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg animate-bounce"
                    onClick={handleAnswer}
                  >
                    <Phone className="h-8 w-8 text-white" />
                  </Button>
                </div>
              </div>
            )}
            <CardHeader
              className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4 bg-gradient-to-b from-primary/10 via-muted/50 to-background border-b flex-shrink-0"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-md shadow-primary/25">
                  <Phone className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-lg font-bold">Xoftphone</CardTitle>
                  <div className="flex items-center space-x-2">
                    {useSIP ? (
                      <Badge className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-foreground to-foreground/80 text-background border border-border shadow-sm">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              connectionHealth === 'good' && 'bg-green-500',
                              connectionHealth === 'loading' && 'bg-yellow-400 animate-pulse',
                              connectionHealth === 'none' && 'bg-red-500'
                            )}
                          />
                          SIP
                        </span>
                      </Badge>
                    ) : (
                      <Badge className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-foreground to-foreground/80 text-background border border-border shadow-sm">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              connectionHealth === 'good' && 'bg-green-500',
                              connectionHealth === 'loading' && 'bg-yellow-400 animate-pulse',
                              connectionHealth === 'none' && 'bg-red-500'
                            )}
                          />
                          Voice
                        </span>
                      </Badge>
                    )}
                    {currentCall?.isRecording && (
                      <Badge className="text-xs bg-red-600 text-white border-red-500 px-2 py-0.5 animate-pulse">
                        â— REC
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={testSignalWireConnection}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="h-8 w-8 p-0 rounded-full text-foreground/80 hover:text-foreground bg-transparent hover:bg-muted dark:bg-muted/40 dark:hover:bg-muted/60"
                  title="Test Connection"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('/settings', '_blank')}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="h-8 w-8 p-0 rounded-full text-foreground/80 hover:text-foreground bg-transparent hover:bg-muted dark:bg-muted/40 dark:hover:bg-muted/60"
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('/calls/logs', '_blank')}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="h-8 w-8 p-0 rounded-full text-foreground/80 hover:text-foreground bg-transparent hover:bg-muted dark:bg-muted/40 dark:hover:bg-muted/60"
                  title="Call Logs"
                >
                  <Clock className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMinimize}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="h-8 w-8 p-0 rounded-full text-foreground/80 hover:text-foreground bg-transparent hover:bg-muted dark:bg-muted/40 dark:hover:bg-muted/60"
                  title="Minimize"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="h-8 w-8 p-0 rounded-full text-foreground/80 hover:text-destructive bg-transparent hover:bg-destructive/10 dark:bg-muted/40 dark:hover:bg-destructive/20"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-2 px-4 pb-4 pt-3 overflow-hidden">
              {/* Tabs */}
              <div className="flex space-x-1 rounded-xl p-1 bg-gradient-to-b from-muted/70 to-muted/40 dark:from-muted/50 dark:to-muted/30 border border-border/60 dark:border-white/10 shadow-sm">
                <button
                  onClick={() => setActiveTab('call')}
                  className={cn(
                    "flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all",
                    activeTab === 'call'
                      ? "bg-background text-foreground shadow-sm ring-1 ring-primary/10 dark:bg-muted/60"
                      : "text-foreground/70 hover:text-foreground hover:bg-background/60 dark:hover:bg-muted/60"
                  )}
                >
                  <Phone className="h-4 w-4" />
                  <span>Call</span>
                </button>
                <button
                  onClick={() => setActiveTab('sms')}
                  className={cn(
                    "flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all",
                    activeTab === 'sms'
                      ? "bg-background text-foreground shadow-sm ring-1 ring-primary/10 dark:bg-muted/60"
                      : "text-foreground/70 hover:text-foreground hover:bg-background/60 dark:hover:bg-muted/60"
                  )}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>SMS</span>
                </button>
                <button
                  onClick={() => setActiveTab('contacts')}
                  className={cn(
                    "flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all",
                    activeTab === 'contacts'
                      ? "bg-background text-foreground shadow-sm ring-1 ring-primary/10 dark:bg-muted/60"
                      : "text-foreground/70 hover:text-foreground hover:bg-background/60 dark:hover:bg-muted/60"
                  )}
                >
                  <User className="h-4 w-4" />
                  <span>Contacts</span>
                </button>
              </div>

              {/* Call Tab Content */}
              {activeTab === 'call' && (
                <div className="space-y-2">
                  {/* Call Status - Only show when there's an active call */}
                  <div className="flex flex-col items-center gap-2 py-1">
                    <div
                      className={cn(
                        currentCall?.status === 'failed' && 'border-destructive/40',
                        (!currentCall || currentCall.status === 'ended') && 'border-border/60',
                        (currentCall?.status === 'connected' || currentCall?.status === 'dialing' || currentCall?.status === 'ringing' || currentCall?.status === 'onhold') && 'border-border/60'
                      )}
                    >
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          (!currentCall || currentCall.status === 'ended') && 'bg-muted-foreground/50',
                          (currentCall?.status === 'dialing' || currentCall?.status === 'ringing') && 'bg-yellow-400 animate-pulse',
                          currentCall?.status === 'connected' && 'bg-green-500',
                          currentCall?.status === 'onhold' && 'bg-yellow-400',
                          currentCall?.status === 'failed' && 'bg-red-500'
                        )}
                      />
                      <span className={cn(getCallStatusColor())}>{getCallStatusText()}</span>
                      {currentCall?.status === 'connected' && (
                        <span className="font-mono text-muted-foreground">{formatDuration(callTimer)}</span>
                      )}
                    </div>

                    {(currentCall || (phoneNumber && phoneNumber.trim().length > 0)) && (
                      <div className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">
                            {currentCall?.recipientName
                              ? currentCall.recipientName
                              : formatPhoneNumber(currentCall?.number || phoneNumber)}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {selectedCampaignName ? selectedCampaignName : 'No campaign'}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {currentCall?.isRecording && (
                            <Badge className="text-[12px] bg-red-600 text-white border-red-500 px-2 py-0.5 animate-pulse">
                              â— REC
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Configuration Warning Banner */}
                  {phoneNumbers.length === 0 && !isLoadingNumbers && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center mt-0.5">
                          <span className="text-yellow-600 dark:text-yellow-400 text-xs">!</span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                            Voice Service Not Configured
                          </div>
                          <div className="text-xs text-yellow-800 dark:text-yellow-200">
                            To make calls, you need to configure your voice provider connection with your API credentials.
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 h-7 text-xs bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-900 dark:text-yellow-100"
                            onClick={() => window.open('/settings/connections', '_blank')}
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Configure Voice Service
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phone Number Input */}
                  <div className="space-y-2">
                    {/* Caller ID Selection with Refresh */}
                    <div className="flex items-center gap-2">
                      <Select value={selectedPhoneNumber} onValueChange={setSelectedPhoneNumber} disabled={isLoading}>
                        <SelectTrigger className="bg-muted/50 border-border text-foreground h-12 rounded-xl flex-1">
                          <SelectValue placeholder="Select caller ID">
                            {isLoadingNumbers ? (
                              <span className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground mr-2"></div>
                                Loading numbers...
                              </span>
                            ) : selectedPhoneNumber && selectedPhoneNumber !== 'none' ? (
                              phoneNumbers.find(num => num.id === selectedPhoneNumber) ? (
                                <span className="flex items-center">
                                  <Phone className="h-4 w-4 mr-2 text-green-600" />
                                  {formatPhoneNumber(phoneNumbers.find(num => num.id === selectedPhoneNumber)!.number)}
                                </span>
                              ) : (
                                <span>Select caller ID</span>
                              )
                            ) : (
                              <span>Select caller ID</span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="z-[12000] bg-popover border-border">
                          <SelectItem value="none">
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="text-muted-foreground">Select caller ID</span>
                            </div>
                          </SelectItem>
                          {phoneNumbers.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-muted-foreground">No caller IDs available</div>
                          ) : phoneNumbers.map((number) => (
                            <SelectItem key={number.id} value={number.id}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-2 text-green-600" />
                                  <div>
                                    <div className="font-medium text-foreground">{formatPhoneNumber(number.number)}</div>
                                    <div className="text-xs text-muted-foreground">{number.name}</div>
                                  </div>
                                </div>
                                {number.meta?.source && number.meta.source !== 'purchased' && (
                                  <Badge variant="outline" className="text-[12px] ml-2">
                                    {number.meta.source}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          clearCache();
                          fetchPhoneNumbers();
                          fetchCampaigns();
                        }}
                        disabled={isLoading}
                        className="h-12 w-12 p-0 rounded-xl"
                        title="Refresh numbers"
                      >
                        <RefreshCcw className={cn("h-4 w-4", isLoadingNumbers && "animate-spin")} />
                      </Button>
                    </div>

                    {/* Phone Number Input with Country Code */}
                    <div className="flex items-center bg-muted/50 rounded-xl p-1 space-x-1">
                      <Select value={selectedCountry} onValueChange={handleCountryChange}>
                        <SelectTrigger className="w-24 border-none shadow-none bg-transparent">
                          <div className="flex items-center space-x-1">
                            <span className="text-lg">{getFlagEmoji(selectedCountry)}</span>
                            <span className="text-sm font-semibold text-muted-foreground">{selectedCountryOption.dialCode}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-64 z-[12000] bg-popover border-border">
                          {COUNTRY_OPTIONS.map(country => (
                            <SelectItem key={country.code} value={country.code}>
                              <div className="flex items-center space-x-2">
                                <span>{getFlagEmoji(country.code)}</span>
                                <span className="text-foreground">{country.name}</span>
                                <span className="text-xs text-muted-foreground">{country.dialCode}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="relative flex-1">
                        <Input
                          type="tel"
                          value={phoneNumber}
                          onFocus={() => {
                            if (!phoneNumber) {
                              setPhoneNumber(getDialCodeForCountry(selectedCountry));
                            }
                          }}
                          onChange={(e) => {
                            const input = e.target.value.replace(/[^0-9+]/g, '');
                            const dialCode = getDialCodeForCountry(selectedCountry);
                            const fullNumber = input.startsWith(dialCode) ? input : `${dialCode}${input}`;
                            setPhoneNumber(fullNumber);
                          }}
                          placeholder="Enter phone number"
                          className="bg-transparent border-none text-foreground text-xl text-center font-mono placeholder-muted-foreground h-12"
                          disabled={currentCall?.status === 'connected' || isLoading}
                        />
                        {phoneNumber && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={copyNumber}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          >
                            {copiedNumber ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Campaign Selection (Optional) */}
                  <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                    <SelectTrigger className="bg-muted/50 border-border text-foreground h-10 rounded-xl">
                      <SelectValue placeholder="Select campaign (optional)" />
                    </SelectTrigger>
                    <SelectContent className="z-[12000] bg-popover border-border">
                      <SelectItem value="none">
                        <span className="text-muted-foreground">No Campaign</span>
                      </SelectItem>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          <span className="text-foreground">{campaign.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Auto Dial Button - Show when campaign is selected */}
                  {selectedCampaign && selectedCampaign !== 'none' && (
                    <Button
                      onClick={handleAutoDial}
                      disabled={isLoading || (!selectedPhoneNumber || selectedPhoneNumber === 'none')}
                      variant={autoDialActive ? "destructive" : "default"}
                      className="w-full h-10 rounded-xl font-semibold transition-all"
                    >
                      {autoDialActive ? (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Stop Auto Dial ({autoDialQueue.length} remaining)
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Auto Dial Campaign
                        </>
                      )}
                    </Button>
                  )}

                  {/* Main Call Controls */}
                  <div className="flex justify-center items-center space-x-3 py-2">
                    {!currentCall || currentCall.status === 'ended' || currentCall.status === 'failed' ? (
                      <>
                        <Button
                          onClick={handleRedial}
                          disabled={!lastDialedNumber || isLoading}
                          variant="outline"
                          className="h-12 w-12 rounded-full border-border/80 text-foreground/80 hover:text-foreground hover:bg-muted dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                          title="Redial"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <div className="relative">
                          {canCall && (
                            <div className="absolute inset-0 rounded-full bg-green-500/30 blur-md animate-pulse" />
                          )}
                          <Button
                            onClick={() => makeCall()}
                            disabled={!canCall}
                            className="relative h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl shadow-green-500/25 transform transition-all hover:scale-110 active:scale-105 disabled:opacity-50 disabled:shadow-none"
                            data-call-button="true"
                          >
                            <Phone className="h-6 w-6" />
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowKeypad(!showKeypad);
                            if (currentCall) handleDTMF('#');
                          }}
                          className="h-12 w-12 rounded-full border-border/80 text-foreground/80 hover:text-foreground hover:bg-muted dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                          title={currentCall ? "Send #" : "Show Keypad"}
                        >
                          <Hash className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleEndCall}
                        className="h-14 w-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg transform transition-all hover:scale-105"
                      >
                        <PhoneOff className="h-6 w-6" />
                      </Button>
                    )}
                  </div>

                  {/* In-call Controls */}
                  {currentCall && (currentCall.status === 'connected' || currentCall.status === 'dialing' || currentCall.status === 'ringing') && (
                    <div className="space-y-2">
                      {/* Primary In-call Actions */}
                      <div className="flex justify-center space-x-4">
                        <Button
                          variant={isMuted ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={handleMute}
                          className={cn(
                            "h-10 w-10 rounded-full border-2 transition-all",
                            isMuted
                              ? "bg-destructive border-destructive text-destructive-foreground hover:bg-destructive/90"
                              : "border-border/80 text-foreground/80 hover:text-foreground hover:bg-muted dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                          )}
                          title={isMuted ? 'Unmute' : 'Mute'}
                        >
                          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant={isOnHold ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={handleHold}
                          className={cn(
                            "h-10 w-10 rounded-full border-2 transition-all",
                            isOnHold
                              ? "bg-primary border-border text-primary-foreground hover:bg-primary/90"
                              : "border-border/80 text-foreground/80 hover:text-foreground hover:bg-muted dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                          )}
                          title={isOnHold ? 'Resume' : 'Hold'}
                        >
                          {isOnHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant={currentCall.isRecording ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={handleRecording}
                          className={cn(
                            "h-10 w-10 rounded-full border-2 transition-all",
                            currentCall.isRecording
                              ? "bg-destructive border-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse"
                              : "border-border/80 text-foreground/80 hover:text-foreground hover:bg-muted dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                          )}
                          title={currentCall.isRecording ? 'Stop Recording' : 'Start Recording'}
                        >
                          <Circle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowKeypad(!showKeypad)}
                          className="h-10 w-10 rounded-full border-2 border-border/80 text-foreground/80 hover:text-foreground hover:bg-muted transition-all dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                          title="Toggle Keypad"
                        >
                          <Hash className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Secondary Actions */}
                      <div className="flex justify-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowTransfer(!showTransfer)}
                          className="h-8 px-3 border-border/80 text-foreground/80 hover:text-foreground hover:bg-muted rounded-full transition-all dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                          title="Transfer Call"
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Transfer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowConference(!showConference)}
                          className="h-8 px-3 border-border/80 text-foreground/80 hover:text-foreground hover:bg-muted rounded-full transition-all dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                          title="Conference Call"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          Conference
                        </Button>
                      </div>

                      {/* Volume Control */}
                      <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Volume2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Volume</span>
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{volume}%</span>
                        </div>
                        <Slider
                          value={[volume]}
                          onValueChange={(value) => handleVolumeChange(value[0])}
                          max={100}
                          min={0}
                          step={1}
                          className="h-2"
                        />
                      </div>

                      {/* Audio Setup & Test */}
                      <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Audio Setup</div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={async () => {
                              console.log('[Audio] Requesting permissions...');
                              try {
                                const initialized = await initializeAudio();
                                if (initialized) {
                                  toast.success('Microphone access granted!');
                                }
                              } catch (err) {
                                console.error('[Audio] Permission failed:', err);
                                toast.error('Failed to access microphone');
                              }
                            }}
                            variant="outline"
                            className="w-full h-8 text-xs"
                          >
                            <Mic className="h-3 w-3 mr-1" />
                            Enable Mic
                          </Button>
                          <Button
                            onClick={async () => {
                              console.log('[Audio] Testing audio...');
                              try {
                                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                console.log('[Audio] Microphone access granted');

                                // Play a test tone
                                const audioContext = new AudioContext();
                                const oscillator = audioContext.createOscillator();
                                const gainNode = audioContext.createGain();

                                oscillator.connect(gainNode);
                                gainNode.connect(audioContext.destination);

                                oscillator.frequency.value = 440; // A4 note
                                gainNode.gain.value = 0.1;

                                oscillator.start();
                                setTimeout(() => {
                                  oscillator.stop();
                                  audioContext.close();
                                  stream.getTracks().forEach(track => track.stop());
                                  toast.success('Audio test complete!');
                                }, 1000);
                              } catch (err) {
                                console.error('[Audio] Test failed:', err);
                                toast.error('Audio test failed');
                              }
                            }}
                            variant="outline"
                            className="w-full h-8 text-xs"
                          >
                            <Volume2 className="h-3 w-3 mr-1" />
                            Test Audio
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {localStreamRef.current ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Microphone ready
                            </span>
                          ) : (
                            <span className="text-yellow-600">Click "Enable Mic" before calling</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Dial Pad */}
                  {(!currentCall || currentCall.status === 'ended' || currentCall.status === 'failed' || showKeypad) && (
                    <div className="space-y-1.5">
                      {/* Auto Dial Next Call Button */}
                      {autoDialActive && autoDialQueue.length > 0 && currentCall?.status === 'ended' && (
                        <Button
                          onClick={handleNextAutoDial}
                          className="w-full h-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium"
                        >
                          <SkipForward className="h-4 w-4 mr-2" />
                          Call Next ({autoDialQueue.length} remaining)
                        </Button>
                      )}
                      <div className="grid grid-cols-3 gap-1.5">
                        {dialPad.flat().map((digit) => (
                          <Button
                            key={digit}
                            variant="outline"
                            onClick={() => handleKeypad(digit)}
                            className="h-11 text-lg font-mono bg-background/70 border-border/70 text-foreground hover:bg-background hover:text-foreground rounded-xl transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 active:bg-primary/10 active:ring-2 active:ring-primary/20 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                            disabled={isLoading}
                          >
                            {digit}
                          </Button>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <Button
                          variant="outline"
                          onClick={handleBackspace}
                          className="h-9 text-sm bg-background/70 border-border/70 text-foreground/80 hover:bg-background hover:text-foreground rounded-xl transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                          disabled={isLoading}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleClear}
                          className="h-9 bg-background/70 border-border/70 text-foreground/80 hover:bg-background hover:text-foreground rounded-xl transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                          disabled={isLoading}
                        >
                          Clear
                        </Button>
                        <Button
                          onClick={testCall}
                          className="h-9 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:from-primary hover:to-primary/70 rounded-xl transition-all shadow-md shadow-primary/20 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                          disabled={isLoading}
                        >
                          TEST
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Transfer Modal */}
                  {showTransfer && (
                    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground">Transfer Call</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTransfer(false)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          type="tel"
                          placeholder="Enter number to transfer"
                          value={transferNumber}
                          onChange={(e) => setTransferNumber(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 text-sm"
                        />
                        <Button
                          onClick={handleTransfer}
                          disabled={!transferNumber.trim()}
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Conference Modal */}
                  {showConference && (
                    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground">Add to Conference</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowConference(false)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          type="tel"
                          placeholder="Enter number for conference"
                          value={conferenceNumber}
                          onChange={(e) => setConferenceNumber(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 text-sm"
                        />
                        <Button
                          onClick={handleConference}
                          disabled={!conferenceNumber.trim()}
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Users className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Call History moved to wing panel */}
                </div>
              )}

              {/* SMS Tab Content - Mobile-like Interface */}
              {activeTab === 'sms' && (
                <div className="flex flex-col h-[calc(85vh-180px)] bg-background">
                  {/* SMS Header with Settings */}
                  <div className="flex items-center justify-between p-3 border-b bg-card">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-foreground">Messages</span>
                      <Badge variant="outline" className="text-xs">
                        {smsConversations.length} conversations
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadSMSConversations()}
                        className="h-8 w-8 p-0"
                        title="Refresh conversations"
                      >
                        <RefreshCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowBulkSms(!showBulkSms)}
                        className={cn(
                          "h-8 w-8 p-0",
                          showBulkSms && "bg-primary text-primary-foreground"
                        )}
                        title="Bulk SMS"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open('/settings#sms-and-calls', '_blank')}
                        className="h-8 w-8 p-0"
                        title="SMS Settings"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* SMS Sender Information - Always Visible */}
                  <div className="p-3 border-b bg-muted/30 space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">From Number *</label>
                        <Select value={smsSenderNumber} onValueChange={setSmsSenderNumber}>
                          <SelectTrigger className="bg-muted/50 border-border text-foreground h-12 rounded-xl">
                            <SelectValue placeholder="Select sender number">
                              {isLoading ? (
                                <span className="flex items-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground mr-2"></div>
                                  Loading numbers...
                                </span>
                              ) : smsSenderNumber && smsSenderNumber !== 'none' ? (
                                phoneNumbers.find(num => num.id === smsSenderNumber) ? (
                                  <span className="flex items-center">
                                    <Phone className="h-4 w-4 mr-2 text-green-600" />
                                    {formatPhoneNumber(phoneNumbers.find(num => num.id === smsSenderNumber)!.number)}
                                  </span>
                                ) : (
                                  <span>Select sender number</span>
                                )
                              ) : (
                                <span>Select sender number</span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="z-[12000] bg-popover border-border">
                            <SelectItem value="none">
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-muted-foreground">Select sender number</span>
                              </div>
                            </SelectItem>
                            {phoneNumbers.length === 0 ? (
                              <div className="px-3 py-2 text-xs text-muted-foreground">No sender numbers available</div>
                            ) : phoneNumbers.map((number) => (
                              <SelectItem key={number.id} value={number.id}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <Phone className="h-4 w-4 mr-2 text-green-600" />
                                    <div>
                                      <div className="font-medium text-foreground">{formatPhoneNumber(number.number)}</div>
                                      <div className="text-xs text-muted-foreground">{number.name}</div>
                                    </div>
                                  </div>
                                  {number.meta?.source && number.meta.source !== 'purchased' && (
                                    <Badge variant="outline" className="text-[12px] ml-2">
                                      {number.meta.source}
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Campaign (Optional)</label>
                        <Select value={smsSelectedCampaign} onValueChange={setSmsSelectedCampaign}>
                          <SelectTrigger className="bg-muted/50 border-border text-foreground h-10 rounded-xl">
                            <SelectValue placeholder="Select campaign (optional)">
                              {smsSelectedCampaign && smsSelectedCampaign !== 'none' ? (
                                campaigns.find(c => c.id === smsSelectedCampaign) ? (
                                  <span className="flex items-center">
                                    <Users className="h-4 w-4 mr-2 text-foreground" />
                                    {campaigns.find(c => c.id === smsSelectedCampaign)?.name}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">No campaign</span>
                                )
                              ) : (
                                <span className="text-muted-foreground">No campaign</span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="z-[12000] bg-popover border-border">
                            <SelectItem value="none">
                              <span className="text-muted-foreground">No Campaign</span>
                            </SelectItem>
                            {campaigns.map((campaign) => (
                              <SelectItem key={campaign.id} value={campaign.id}>
                                <span className="text-foreground">{campaign.name}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={smsSearchQuery}
                        onChange={(e) => setSmsSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="pl-10 h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Bulk SMS Panel */}
                  {showBulkSms ? (
                    <div className="flex-1 p-3 space-y-3 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground">Bulk Message</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowBulkSms(false)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Recipients</label>
                        {bulkSmsRecipients.map((recipient, index) => (
                          <div key={index} className="flex space-x-2">
                            <Input
                              value={recipient}
                              onChange={(e) => updateBulkRecipient(index, e.target.value)}
                              placeholder="Enter phone number"
                              className="flex-1 h-9 text-sm"
                            />
                            {bulkSmsRecipients.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeBulkRecipient(index)}
                                className="h-9 w-9 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addBulkRecipient}
                          className="w-full h-8 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Recipient
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Message</label>
                        <textarea
                          value={newSmsMessage}
                          onChange={(e) => setNewSmsMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="w-full min-h-[80px] p-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <Button
                        onClick={sendBulkSMS}
                        disabled={!newSmsMessage.trim() || bulkSmsRecipients.filter(r => r.trim()).length === 0 || isLoadingSms}
                        className="w-full"
                      >
                        {isLoadingSms ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send to {bulkSmsRecipients.filter(r => r.trim()).length} Recipients
                      </Button>
                    </div>
                  ) : (
                    /* Conversations List */
                    !selectedConversation ? (
                      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {filteredConversations.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                            <p className="text-sm">No conversations yet</p>
                          </div>
                        ) : (
                          <div className="divide-y">
                            {filteredConversations.map((conv) => (
                              <div
                                key={conv.id}
                                onClick={() => {
                                  setSelectedConversation(conv.phoneNumber);
                                  loadSMSMessages(conv.phoneNumber);
                                }}
                                className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <div className="font-medium text-foreground truncate">
                                        {conv.name || formatPhoneNumber(conv.phoneNumber)}
                                      </div>
                                      <div className="text-xs text-muted-foreground ml-2">
                                        {new Date(conv.lastMessageTime).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <div className="text-sm text-muted-foreground truncate">
                                        {conv.lastMessage}
                                      </div>
                                      {conv.unreadCount > 0 && (
                                        <div className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2 flex-shrink-0">
                                          {conv.unreadCount}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Message View - Mobile Style */
                      <div className="flex flex-col h-full">
                        {/* Message Header */}
                        <div className="flex items-center justify-between p-3 border-b bg-card">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedConversation(null)}
                              className="h-8 w-8 p-0"
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                              <div className="font-medium text-foreground">
                                {selectedConversation === 'new' ? (
                                  <Input
                                    value={smsRecipient}
                                    onChange={(e) => setSmsRecipient(e.target.value)}
                                    placeholder="Enter phone number"
                                    className="w-48 h-7 text-sm"
                                  />
                                ) : (
                                  smsConversations.find(c => c.phoneNumber === selectedConversation)?.name ||
                                  formatPhoneNumber(selectedConversation)
                                )}
                              </div>
                              {selectedConversation !== 'new' && (
                                <div className="text-xs text-muted-foreground">
                                  {formatPhoneNumber(selectedConversation)}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="More options"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Messages - Mobile Style */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-background to-muted/20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {smsMessages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              <p className="text-sm">No messages yet. Start the conversation!</p>
                            </div>
                          ) : (
                            smsMessages.map((msg, index) => (
                              <div
                                key={msg.id}
                                className={cn(
                                  "flex",
                                  msg.direction === 'outbound' ? "justify-end" : "justify-start"
                                )}
                              >
                                <div
                                  className={cn(
                                    "max-w-[70%] px-3 py-2 rounded-2xl text-sm",
                                    msg.direction === 'outbound'
                                      ? "bg-primary text-primary-foreground rounded-br-sm"
                                      : "bg-muted text-foreground rounded-bl-sm"
                                  )}
                                >
                                  <div className="break-words">{msg.content}</div>
                                  <div className={cn(
                                    "text-xs mt-1 flex items-center space-x-1",
                                    msg.direction === 'outbound' ? "text-primary-foreground/70" : "text-muted-foreground"
                                  )}>
                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {msg.status && (
                                      <span className={cn(
                                        "w-1 h-1 rounded-full",
                                        msg.status === 'sent' ? "bg-foreground" :
                                          msg.status === 'delivered' ? "bg-foreground" : "bg-destructive"
                                      )} />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Message Input - Mobile Style */}
                        <div className="p-3 border-t bg-card">
                          <div className="flex items-end space-x-2">
                            <div className="flex-1">
                              <textarea
                                value={newSmsMessage}
                                onChange={(e) => setNewSmsMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="w-full px-3 py-2 text-sm border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px] max-h-[120px]"
                                rows={1}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendSMS();
                                  }
                                }}
                              />
                            </div>
                            <Button
                              onClick={sendSMS}
                              disabled={!newSmsMessage.trim() || isLoadingSms || (selectedConversation === 'new' && !smsRecipient.trim())}
                              size="sm"
                              className="h-10 w-10 p-0 rounded-full"
                            >
                              {isLoadingSms ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {/* New Message Button (when not in conversation or bulk mode) */}
                  {!selectedConversation && !showBulkSms && (
                    <div className="p-3 border-t">
                      <Button
                        onClick={() => {
                          setSelectedConversation('new');
                          setSmsMessages([]);
                        }}
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg rounded-xl font-semibold"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        New Message
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Contacts Tab Content */}
              {activeTab === 'contacts' && (
                <div className="flex flex-col h-[calc(85vh-180px)] bg-background">
                  {/* Contacts Header */}
                  <div className="flex items-center justify-between p-3 border-b bg-card">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-foreground">Contacts</span>
                      <Badge variant="outline" className="text-xs">
                        {contacts.length}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchContacts}
                      disabled={isLoadingContacts}
                      className="h-8 w-8 p-0"
                      title="Refresh contacts"
                    >
                      <RefreshCcw className={cn("h-4 w-4", isLoadingContacts && "animate-spin")} />
                    </Button>
                  </div>

                  {/* Search Bar */}
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={contactsSearch}
                        onChange={(e) => setContactsSearch(e.target.value)}
                        placeholder="Search contacts..."
                        className="pl-10 h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Contacts List */}
                  <div className="flex-1 overflow-y-auto">
                    {isLoadingContacts ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">Loading contacts...</p>
                        </div>
                      </div>
                    ) : contacts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                        <User className="h-12 w-12 mb-2 opacity-50" />
                        <p className="text-sm">No contacts found</p>
                        <Button
                          onClick={() => window.open('/contacts', '_blank')}
                          variant="outline"
                          size="sm"
                          className="mt-3"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Contacts
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {contacts
                          .filter(contact => {
                            if (!contactsSearch) return true;
                            const search = contactsSearch.toLowerCase();
                            const name = (contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`).toLowerCase();
                            const phone = (contact.phone || '').toLowerCase();
                            const company = (contact.company || '').toLowerCase();
                            return name.includes(search) || phone.includes(search) || company.includes(search);
                          })
                          .map((contact) => (
                            <div
                              key={contact.id}
                              onClick={() => {
                                if (contact.phone) {
                                  setPhoneNumber(contact.phone);
                                  setActiveTab('call');
                                  showToast.success(`Ready to call ${contact.name || contact.firstName || 'contact'}`);
                                } else {
                                  toast.error('No phone number for this contact');
                                }
                              }}
                              className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                                  <User className="h-5 w-5 text-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-foreground truncate">
                                    {contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact'}
                                  </div>
                                  {contact.phone && (
                                    <div className="text-sm text-muted-foreground flex items-center mt-1">
                                      <Phone className="h-3 w-3 mr-1" />
                                      {formatPhoneNumber(contact.phone)}
                                    </div>
                                  )}
                                  {contact.company && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {contact.company}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (contact.phone) {
                                      setPhoneNumber(contact.phone);
                                      setActiveTab('call');
                                      // Auto-initiate call
                                      setTimeout(() => makeCall(contact.phone), 100);
                                    }
                                  }}
                                  className="h-8 w-8 p-0 rounded-full"
                                  title="Call now"
                                >
                                  <Phone className="h-4 w-4 text-green-600" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </div> {/* Close scale wrapper */}
        </Card>



        {/* Hidden audio element for call audio */}
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          style={{ display: 'none' }}
          onLoadedMetadata={() => console.log('[Audio] Metadata loaded')}
          onCanPlay={() => console.log('[Audio] Can play')}
          onPlay={() => console.log('[Audio] Playing')}
          onError={(e) => logError('[Audio] Error:', e)}
        />

        {/* Wing Panel Toggle Button - Context-aware (Call Logs or SMS Logs) */}
        <button
          onClick={() => {
            if (activeTab === 'sms') {
              setShowSmsLogsWing(!showSmsLogsWing);
              setShowCallLogsWing(false);
            } else {
              setShowCallLogsWing(!showCallLogsWing);
              setShowSmsLogsWing(false);
            }
          }}
          className={cn(
            "absolute w-7 h-20 bg-muted hover:bg-muted/80 text-foreground",
            "flex items-center justify-center transition-all duration-200 shadow-xl z-10",
            "rounded-r-lg border border-border"
          )}
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            left: (showCallLogsWing || showSmsLogsWing) ? 'calc(100% + 300px)' : '100%',
            transition: 'left 0.3s ease-in-out'
          }}
          title={
            activeTab === 'sms'
              ? (showSmsLogsWing ? "Hide SMS Logs" : "Show SMS Logs")
              : (showCallLogsWing ? "Hide Call Logs" : "Show Call Logs")
          }
        >
          <ArrowRight className={cn(
            "h-5 w-5 transition-transform duration-200",
            (showCallLogsWing || showSmsLogsWing) && "rotate-180"
          )} />
        </button>

        {/* Call Logs Wing Panel */}
        <div
          ref={wingRef}
          className={cn(
            "absolute top-0 bottom-0 w-[300px] border border-border",
            "shadow-2xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col",
            "rounded-lg ml-2",
            softphoneThemeClasses,
            showCallLogsWing ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          style={{
            left: showCallLogsWing ? 'calc(100% + 8px)' : 'calc(100% + 8px)',
            transform: showCallLogsWing ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out'
          }}
        >
          {/* Wing Panel Header */}
          <div className="flex flex-col p-3 border-b bg-gradient-to-b from-muted/60 to-background flex-shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-foreground" />
                <h3 className="font-semibold text-sm">Call Logs</h3>
                <Badge variant="outline" className="text-xs">
                  {callHistory.length}
                </Badge>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    loadCallHistory();
                    showToast.success('Call logs refreshed');
                  }}
                  className="h-7 w-7 p-0"
                  title="Refresh"
                >
                  <RefreshCcw className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCallLogsWing(false)}
                  className="h-7 w-7 p-0"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center p-1 bg-muted/50 rounded-lg">
              <button
                onClick={() => setCallLogFilter('all')}
                className={cn(
                  "flex-1 text-[12px] py-1 rounded-md transition-all font-medium",
                  callLogFilter === 'all'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                All
              </button>
              <button
                onClick={() => setCallLogFilter('outbound')}
                className={cn(
                  "flex-1 text-[12px] py-1 rounded-md transition-all font-medium flex items-center justify-center",
                  callLogFilter === 'outbound'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <PhoneOutgoing className="h-3 w-3 mr-1" />
                Out
              </button>
              <button
                onClick={() => setCallLogFilter('inbound')}
                className={cn(
                  "flex-1 text-[12px] py-1 rounded-md transition-all font-medium flex items-center justify-center",
                  callLogFilter === 'inbound'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <PhoneIncoming className="h-3 w-3 mr-1" />
                In
              </button>
            </div>
          </div>

          {/* Wing Panel Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {(() => {
              const filteredCallHistory = callHistory.filter(call => callLogFilter === 'all' || call.direction === callLogFilter);

              if (filteredCallHistory.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Clock className="h-12 w-12 mb-2 opacity-50" />
                    <p className="text-sm">No {callLogFilter !== 'all' ? callLogFilter : ''} call history</p>
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  {filteredCallHistory.map((call) => (
                    <div
                      key={call.id}
                      className={cn(
                        'p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md text-xs',
                        call.status === 'failed'
                          ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                          : call.status === 'connected' || call.status === 'ended'
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                            : 'bg-muted border-border'
                      )}
                      onClick={() => {
                        setPhoneNumber(call.number);
                        setActiveTab('call');
                        showToast.success('Number loaded');
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs truncate">
                            {formatPhoneNumber(call.number)}
                          </div>
                          {call.recipientName && (
                            <div className="text-[12px] text-muted-foreground truncate">
                              {call.recipientName}
                            </div>
                          )}
                          {/* Show both caller and receiver */}
                          {call.metadata?.callerId && (
                            <div className="text-[12px] text-muted-foreground mt-0.5">
                              <span className="font-medium">From:</span> {formatPhoneNumber(call.metadata.callerId)}
                            </div>
                          )}
                          <div className="text-[12px] text-muted-foreground mt-0.5">
                            {call.startTime ? new Date(call.startTime).toLocaleString() : ''}
                          </div>
                          {call.duration && call.duration > 0 && (
                            <div className="text-[12px] font-medium mt-0.5">
                              Duration: {formatDuration(call.duration)}
                            </div>
                          )}
                          <div className="flex items-center space-x-1 mt-0.5">
                            {call.direction === 'inbound' ? (
                              <PhoneIncoming className="h-2.5 w-2.5 text-foreground" />
                            ) : (
                              <PhoneOutgoing className="h-2.5 w-2.5 text-foreground" />
                            )}
                            <span className="text-[12px] capitalize">{call.direction}</span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRedialFromHistory(call);
                            }}
                            className="h-6 w-6 p-0"
                            title="Redial"
                          >
                            <Phone className="h-2.5 w-2.5 text-foreground" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* SMS Logs Wing Panel */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-[300px] border border-border",
            "shadow-2xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col",
            "rounded-lg ml-2",
            softphoneThemeClasses,
            showSmsLogsWing ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          style={{
            left: showSmsLogsWing ? 'calc(100% + 8px)' : 'calc(100% + 8px)',
            transform: showSmsLogsWing ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out'
          }}
        >
          {/* SMS Logs Header */}
          <div className="flex items-center justify-between p-3 border-b bg-gradient-to-b from-muted/60 to-background flex-shrink-0">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-foreground" />
              <h3 className="font-semibold text-sm">SMS History</h3>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  loadSMSConversations();
                  showToast.success('SMS history refreshed');
                }}
                className="h-7 w-7 p-0"
                title="Refresh"
              >
                <RefreshCcw className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSmsLogsWing(false)}
                className="h-7 w-7 p-0"
                title="Close"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* SMS Logs Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {smsConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">No SMS history yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {smsConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-2 rounded-lg border border-border cursor-pointer transition-all hover:shadow-md text-xs bg-card"
                    onClick={() => {
                      setSelectedConversation(conv.phoneNumber);
                      loadSMSMessages(conv.phoneNumber);
                      setActiveTab('sms');
                      showToast.success('Conversation loaded');
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs truncate">
                          {conv.name || formatPhoneNumber(conv.phoneNumber)}
                        </div>
                        <div className="text-[12px] text-muted-foreground truncate">
                          {formatPhoneNumber(conv.phoneNumber)}
                        </div>
                        <div className="text-[12px] text-muted-foreground mt-0.5 truncate">
                          {conv.lastMessage}
                        </div>
                        <div className="text-[12px] text-muted-foreground mt-0.5">
                          {new Date(conv.lastMessageTime).toLocaleString()}
                        </div>
                        {conv.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-[12px] mt-1">
                            {conv.unreadCount} new
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col space-y-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedConversation(conv.phoneNumber);
                            loadSMSMessages(conv.phoneNumber);
                            setActiveTab('sms');
                          }}
                          className="h-6 w-6 p-0"
                          title="Open"
                        >
                          <MessageSquare className="h-2.5 w-2.5 text-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div> {/* Close SMS Logs Wing Panel */}
      </div> {/* Close dragRef div */}
    </>
  );
}
