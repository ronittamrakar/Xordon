import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface SoftphoneProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  defaultNumber?: string;
  onCallStart?: (number: string) => void;
  onCallEnd?: (duration: number) => void;
}

interface CallSession {
  id: string;
  number: string;
  status: 'idle' | 'dialing' | 'connected' | 'ended' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration: number;
  isMuted: boolean;
  isOnHold: boolean;
  callSid?: string;
}

interface Connection {
  id: string;
  name: string;
  provider: string;
  status: string;
}

interface PhoneNumber {
  phone_number: string;
  friendly_name: string;
  capabilities?: string[];
}

export const Softphone: React.FC<SoftphoneProps> = ({
  isOpen,
  onClose,
  onMinimize,
  defaultNumber,
  onCallStart,
  onCallEnd
}) => {
  const debug = import.meta.env.DEV && localStorage.getItem('debug_softphone') === '1';
  const log = (...args: any[]) => { if (debug) console.log(...args); };
  const warn = (...args: any[]) => { if (debug) console.warn(...args); };
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState(defaultNumber || '');
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [callHistory, setCallHistory] = useState<CallSession[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const timerRef = useRef<number | null>(null);

  // SignalWire integration
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>('');
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isLoadingPhoneNumbers, setIsLoadingPhoneNumbers] = useState(false);
  const [connectionError, setConnectionError] = useState<string>('');

  // Load connections on mount
  useEffect(() => {
    if (isOpen) {
      loadConnections();
    }
  }, [isOpen]);

  // Load phone numbers when connection is selected
  useEffect(() => {
    if (selectedConnection) {
      loadPhoneNumbers(selectedConnection);
    }
  }, [selectedConnection]);

  const loadConnections = async () => {
    log('[Softphone] 🔄 Loading connections...');
    setIsLoadingConnections(true);
    setConnectionError('');
    try {
      log('[Softphone] 📡 Calling api.getConnections()...');
      const result = await api.getConnections();
      log('[Softphone] ✅ Connections result:', result);

      const activeConnections = result.filter((c: Connection) => 
        c.provider === 'signalwire' && c.status === 'active'
      );
      log('[Softphone] ✅ Active connections:', activeConnections);

      setConnections(activeConnections);

      if (activeConnections.length > 0) {
        log('[Softphone] ✅ Setting selected connection:', activeConnections[0].id);
        setSelectedConnection(activeConnections[0].id);
      } else {
        // Check if there are any SignalWire connections at all
        const signalwireConnections = result.filter((c: Connection) => c.provider === 'signalwire');
        
        if (signalwireConnections.length === 0) {
          warn('[Softphone] ⚠️ No SignalWire connections found');
          setConnectionError('No SignalWire connections found. Please add a connection in Settings.');
        } else {
          warn('[Softphone] ⚠️ SignalWire connections found but none are active');
          setConnectionError('SignalWire connection needs to be tested. Please test your connection in Settings > Connections.');
        }
      }
    } catch (error) {
      setConnectionError('Failed to load SignalWire connections. Please check your settings.');
      toast({
        title: 'Connection Error',
        description: 'Failed to load SignalWire connections',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingConnections(false);
      log('[Softphone] ✅ Loading connections complete');
    }
  };

  const loadPhoneNumbers = async (connectionId: string) => {
    log('[Softphone] 🔄 Loading phone numbers for connection:', connectionId);
    setIsLoadingPhoneNumbers(true);
    try {
      log('[Softphone] 📡 Calling api.getConnectionPhoneNumbers()...');
      const result = await api.getConnectionPhoneNumbers(connectionId);
      log('[Softphone] ✅ Phone numbers result:', result);

      setPhoneNumbers(result.phoneNumbers || []);

      if (result.phoneNumbers && result.phoneNumbers.length > 0) {
        log('[Softphone] ✅ Setting selected phone number:', result.phoneNumbers[0].phone_number);
        setSelectedPhoneNumber(result.phoneNumbers[0].phone_number);
      } else {
        warn('[Softphone] ⚠️ No phone numbers found');
        toast({
          title: 'No Phone Numbers',
          description: 'No phone numbers found in your SignalWire account. Please add a phone number.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load phone numbers from SignalWire',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingPhoneNumbers(false);
      log('[Softphone] ✅ Loading phone numbers complete');
    }
  };

  useEffect(() => {
    if (currentCall?.status === 'connected' && !timerRef.current) {
      timerRef.current = window.setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentCall?.status]);

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return number;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNumberInput = async (digit: string) => {
    if (currentCall?.status === 'connected') {
      // Send DTMF tone during active call
      try {
        if (currentCall.callSid) {
          await api.sendDTMF({
            sessionId: currentCall.callSid,
            digit
          });
          toast({
            title: 'DTMF Sent',
            description: `Sent tone: ${digit}`,
          });
        }
      } catch (error) {
        console.error('Failed to send DTMF:', error);
        toast({
          title: 'Error',
          description: 'Failed to send DTMF tone',
          variant: 'destructive'
        });
      }
      return;
    }
    setPhoneNumber(prev => prev + digit);
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPhoneNumber('');
  };

  const handleCall = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: 'Invalid Number',
        description: 'Please enter a phone number',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedPhoneNumber) {
      toast({
        title: 'No Caller ID',
        description: 'Please select a caller ID number',
        variant: 'destructive'
      });
      return;
    }

    const callId = `call_${Date.now()}`;
    const newCall: CallSession = {
      id: callId,
      number: phoneNumber,
      status: 'dialing',
      duration: 0,
      isMuted: false,
      isOnHold: false
    };

    setCurrentCall(newCall);
    setCallTimer(0);
    onCallStart?.(phoneNumber);

    try {
      // Make actual call via SignalWire API
      const result = await api.makeCall({
        to: phoneNumber,
        from: selectedPhoneNumber,
        record: true
      });

      if (result.success) {
        setCurrentCall(prev => prev ? {
          ...prev,
          status: 'connected',
          startTime: new Date(),
          callSid: result.call_sid
        } : null);

        toast({
          title: 'Call Connected',
          description: `Calling ${formatPhoneNumber(phoneNumber)}`,
        });
      } else {
        throw new Error(result.message || 'Call failed');
      }
    } catch (error) {
      console.error('Call failed:', error);
      setCurrentCall(prev => prev ? { ...prev, status: 'failed' } : null);
      toast({
        title: 'Call Failed',
        description: error instanceof Error ? error.message : 'Failed to initiate call',
        variant: 'destructive'
      });
    }
  };

  const handleEndCall = async () => {
    if (!currentCall) return;

    const endedCall = {
      ...currentCall,
      status: 'ended' as const,
      endTime: new Date(),
      duration: callTimer
    };

    // Log the call
    if (currentCall.callSid) {
      try {
        await api.logCall({
          sessionId: currentCall.callSid,
          duration: callTimer,
          outcome: 'completed',
          phoneNumber: currentCall.number
        });
      } catch (error) {
        console.error('Failed to log call:', error);
      }
    }

    setCallHistory(prev => [endedCall, ...prev].slice(0, 10)); // Keep last 10 calls
    setCurrentCall(null);
    setCallTimer(0);
    onCallEnd?.(endedCall.duration);

    toast({
      title: 'Call Ended',
      description: `Duration: ${formatDuration(endedCall.duration)}`,
    });
  };

  const handleMute = () => {
    setIsMuted(prev => {
      const newMuted = !prev;
      setCurrentCall(call => call ? { ...call, isMuted: newMuted } : null);
      toast({
        title: newMuted ? 'Microphone Muted' : 'Microphone Unmuted',
        description: newMuted ? 'Your microphone is now muted' : 'Your microphone is now active'
      });
      return newMuted;
    });
  };

  const handleHold = () => {
    setIsOnHold(prev => {
      const newHold = !prev;
      setCurrentCall(call => call ? { ...call, isOnHold: newHold } : null);
      toast({
        title: newHold ? 'Call On Hold' : 'Call Resumed',
        description: newHold ? 'The call is now on hold' : 'The call has been resumed'
      });
      return newHold;
    });
  };

  const handleKeypad = (digit: string) => {
    handleNumberInput(digit);
  };

  const dialPad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  const getCallStatusColor = () => {
    switch (currentCall?.status) {
      case 'dialing': return 'text-yellow-600';
      case 'connected': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getCallStatusText = () => {
    switch (currentCall?.status) {
      case 'dialing': return 'Dialing...';
      case 'connected': return 'Connected';
      case 'ended': return 'Call Ended';
      case 'failed': return 'Call Failed';
      default: return 'Ready';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-bold">Softphone</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMinimize}
              className="h-8 w-8 p-0"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Settings Panel */}
          {showSettings && (
            <div className="space-y-3 p-3 bg-muted rounded-lg">
              <div className="space-y-2">
                <label className="text-sm font-medium">SignalWire Connection</label>
                {isLoadingConnections ? (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading connections...</span>
                  </div>
                ) : connections.length > 0 ? (
                  <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select connection" />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((conn) => (
                        <SelectItem key={conn.id} value={conn.id}>
                          {conn.name} ({conn.provider})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center space-x-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>No connections available</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Caller ID (Your Number)</label>
                {isLoadingPhoneNumbers ? (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading phone numbers...</span>
                  </div>
                ) : phoneNumbers.length > 0 ? (
                  <Select value={selectedPhoneNumber} onValueChange={setSelectedPhoneNumber}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select caller ID" />
                    </SelectTrigger>
                    <SelectContent>
                      {phoneNumbers.map((num) => (
                        <SelectItem key={num.phone_number} value={num.phone_number}>
                          {num.friendly_name || num.phone_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center space-x-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>No phone numbers found</span>
                  </div>
                )}
              </div>

              {connectionError && (
                <div className="flex items-start space-x-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{connectionError}</span>
                </div>
              )}
            </div>
          )}

          {/* Call Status */}
          <div className="text-center space-y-2">
            <div className={cn("text-lg font-semibold", getCallStatusColor())}>
              {getCallStatusText()}
            </div>
            {currentCall?.status === 'connected' && (
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(callTimer)}</span>
              </div>
            )}
            {selectedPhoneNumber && !currentCall && (
              <div className="text-xs text-muted-foreground">
                Caller ID: {formatPhoneNumber(selectedPhoneNumber)}
              </div>
            )}
          </div>

          {/* Phone Number Display */}
          <div className="relative">
            <Input
              type="tel"
              value={formatPhoneNumber(phoneNumber)}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter phone number"
              className="text-center text-lg font-mono h-12"
              disabled={currentCall?.status === 'connected'}
            />
            {phoneNumber && currentCall?.status !== 'connected' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Call Controls */}
          <div className="flex justify-center space-x-4">
            {!currentCall || currentCall.status === 'ended' || currentCall.status === 'failed' ? (
              <Button
                onClick={handleCall}
                disabled={!phoneNumber.trim() || !selectedPhoneNumber}
                className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                <Phone className="h-6 w-6" />
              </Button>
            ) : currentCall.status === 'connected' ? (
              <Button
                onClick={handleEndCall}
                className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            ) : (
              <Button
                onClick={handleEndCall}
                className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            )}
          </div>

          {/* In-call Controls */}
          {currentCall?.status === 'connected' && (
            <div className="flex justify-center space-x-2">
              <Button
                variant={isMuted ? 'destructive' : 'outline'}
                size="sm"
                onClick={handleMute}
                className="h-10 w-10 p-0"
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                variant={isOnHold ? 'destructive' : 'outline'}
                size="sm"
                onClick={handleHold}
                className="h-10 w-10 p-0"
              >
                {isOnHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {/* Dial Pad */}
          {!currentCall || currentCall.status === 'ended' || currentCall.status === 'failed' ? (
            <div className="grid grid-cols-3 gap-2">
              {dialPad.flat().map((digit) => (
                <Button
                  key={digit}
                  variant="outline"
                  onClick={() => handleKeypad(digit)}
                  className="h-12 text-lg font-mono"
                >
                  {digit === '*' ? <Asterisk className="h-4 w-4" /> :
                    digit === '#' ? <Hash className="h-4 w-4" /> : digit}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={handleBackspace}
                className="h-12"
              >
                ←
              </Button>
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Call in progress</p>
              <p className="text-xs">{formatPhoneNumber(currentCall.number)}</p>
            </div>
          )}

          {/* Call History */}
          {callHistory.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Recent Calls</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {callHistory.slice(0, 5).map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between text-xs p-2 rounded bg-muted hover:bg-muted/80 cursor-pointer"
                    onClick={() => setPhoneNumber(call.number)}
                  >
                    <div className="flex items-center space-x-2">
                      {call.status === 'connected' || call.status === 'ended' ? (
                        <Phone className="h-3 w-3 text-green-600" />
                      ) : (
                        <PhoneOff className="h-3 w-3 text-red-600" />
                      )}
                      <span>{formatPhoneNumber(call.number)}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {formatDuration(call.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Softphone;
