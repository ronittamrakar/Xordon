import { CallSettings } from '@/lib/api';

import { createLogger } from '@/utils/logger';

const logger = createLogger('sip');

export interface SIPCall {
  id: string;
  sessionId: string;
  from: string;
  to: string;
  status: 'connecting' | 'ringing' | 'answered' | 'hold' | 'ended' | 'failed' | 'transferring' | 'conferencing';
  direction: 'inbound' | 'outbound';
  startTime: Date;
  duration: number;
  recordingUrl?: string;
  muted: boolean;
  onHold: boolean;
  recording: boolean;
}

export interface SIPMessage {
  type: 'invite' | 'ack' | 'bye' | 'cancel' | 'register' | 'options' | 'info';
  from: string;
  to: string;
  callId: string;
  body?: string;
}

export interface SIPConfig {
  server: string;
  port: number;
  username: string;
  password: string;
  domain: string;
  transport: 'udp' | 'tcp' | 'tls';
  stunServer: string;
  turnServer?: string;
  turnUsername?: string;
  turnPassword?: string;
  webrtcEnabled: boolean;
  autoAnswer: boolean;
  dtmfType: 'rfc2833' | 'inband' | 'info';
}

export class SIPService {
  private config: SIPConfig | null = null;
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentCall: SIPCall | null = null;
  private onCallStateChange: ((call: SIPCall | null) => void) | null = null;
  private onCallEvent: ((event: string, data: unknown) => void) | null = null;
  private messageHandlers: Map<string, (message: unknown) => void> = new Map();

  constructor() {
    this.setupMessageHandlers();
  }

  private setupMessageHandlers() {
    this.messageHandlers.set('invite', this.handleInvite.bind(this));
    this.messageHandlers.set('ack', this.handleAck.bind(this));
    this.messageHandlers.set('bye', this.handleBye.bind(this));
    this.messageHandlers.set('cancel', this.handleCancel.bind(this));
    this.messageHandlers.set('register', this.handleRegister.bind(this));
    this.messageHandlers.set('options', this.handleOptions.bind(this));
    this.messageHandlers.set('info', this.handleInfo.bind(this));
  }

  async initialize(settings: CallSettings, existingStream?: MediaStream): Promise<boolean> {
    try {
      if (!settings.sipEnabled || !settings.sipServer) {
        logger.log('SIP not enabled or configured');
        return false;
      }

      this.config = {
        server: settings.sipServer,
        port: settings.sipPort || 5060,
        username: settings.sipUsername || '',
        password: settings.sipPassword || '',
        domain: settings.sipDomain || settings.sipServer,
        transport: settings.sipTransport || 'udp',
        stunServer: settings.stunServer || 'stun.l.google.com:19302',
        turnServer: settings.turnServer,
        turnUsername: settings.turnUsername,
        turnPassword: settings.turnPassword,
        webrtcEnabled: settings.webrtcEnabled ?? true,
        autoAnswer: settings.autoAnswer ?? false,
        dtmfType: settings.dtmfType || 'rfc2833'
      };

      if (this.config.webrtcEnabled) {
        await this.initializeWebRTC(existingStream);
      }

      logger.log('SIP Service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize SIP service:', error);
      return false;
    }
  }

  private async initializeWebRTC(existingStream?: MediaStream) {
    try {
      // Use existing stream or get new user media
      if (existingStream) {
        this.localStream = existingStream;
        logger.log('Using existing local stream for SIP');
      } else {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });
        logger.log('Requested new local stream for SIP');
      }

      // Create RTCPeerConnection
      const iceServers: RTCIceServer[] = [{
        urls: `stun:${this.config!.stunServer}`
      }];

      if (this.config!.turnServer) {
        iceServers.push({
          urls: this.config!.turnServer,
          username: this.config!.turnUsername,
          credential: this.config!.turnPassword
        });
      }

      this.pc = new RTCPeerConnection({
        iceServers,
        iceCandidatePoolSize: 10
      });

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.pc!.addTrack(track, this.localStream!);
      });

      // Handle remote stream
      this.pc.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        this.onCallEvent?.('remoteStream', this.remoteStream);
      };

      // Handle ICE candidates
      this.pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSIPMessage({
            type: 'info',
            candidate: event.candidate
          });
        }
      };

      // Handle connection state changes
      this.pc.onconnectionstatechange = () => {
        logger.log('WebRTC connection state:', this.pc!.connectionState);
        if (this.currentCall) {
          this.updateCallState();
        }
      };

      logger.log('WebRTC initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize WebRTC:', error);
      throw error;
    }
  }

  async makeCall(to: string, from?: string, options: Record<string, unknown> = {}): Promise<SIPCall | null> {
    if (!this.config || !this.pc) {
      throw new Error('SIP service not initialized');
    }

    try {
      const callId = this.generateCallId();
      const sessionId = this.generateSessionId();

      this.currentCall = {
        id: callId,
        sessionId,
        from: from || this.config.username,
        to,
        status: 'connecting',
        direction: 'outbound',
        startTime: new Date(),
        duration: 0,
        muted: false,
        onHold: false,
        recording: false
      };

      // Create SDP offer
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });

      await this.pc.setLocalDescription(offer);

      // Send INVITE message
      const inviteMessage = {
        type: 'invite',
        callId,
        sessionId,
        from: this.currentCall.from,
        to: this.currentCall.to,
        sdp: offer.sdp,
        options
      };

      this.sendSIPMessage(inviteMessage);

      this.onCallStateChange?.(this.currentCall);
      return this.currentCall;
    } catch (error) {
      logger.error('Failed to make call:', error);
      this.currentCall = null;
      throw error;
    }
  }

  async endCall(): Promise<void> {
    if (!this.currentCall) {
      return;
    }

    try {
      // Send BYE message
      const byeMessage = {
        type: 'bye',
        callId: this.currentCall.id,
        sessionId: this.currentCall.sessionId,
        from: this.currentCall.from,
        to: this.currentCall.to
      };

      this.sendSIPMessage(byeMessage);

      // Close peer connection
      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }

      // Update call state
      this.currentCall.status = 'ended';
      this.onCallStateChange?.(this.currentCall);

      // Clean up
      this.currentCall = null;
      this.remoteStream = null;
    } catch (error) {
      logger.error('Failed to end call:', error);
      throw error;
    }
  }

  async toggleHold(): Promise<boolean> {
    if (!this.currentCall || !this.pc) {
      throw new Error('No active call');
    }

    try {
      const newHoldState = !this.currentCall.onHold;

      // Send hold/unhold message
      const holdMessage = {
        type: 'info',
        callId: this.currentCall.id,
        sessionId: this.currentCall.sessionId,
        hold: newHoldState,
        sdp: this.pc.localDescription?.sdp
      };

      this.sendSIPMessage(holdMessage);

      // Update local state
      this.currentCall.onHold = newHoldState;
      this.currentCall.status = newHoldState ? 'hold' : 'answered';

      this.onCallStateChange?.(this.currentCall);
      return newHoldState;
    } catch (error) {
      logger.error('Failed to toggle hold:', error);
      throw error;
    }
  }

  async toggleMute(): Promise<boolean> {
    if (!this.currentCall || !this.localStream) {
      throw new Error('No active call or local stream');
    }

    try {
      const newMuteState = !this.currentCall.muted;

      // Mute/unmute local stream
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !newMuteState;
      });

      this.currentCall.muted = newMuteState;
      this.onCallStateChange?.(this.currentCall);
      return newMuteState;
    } catch (error) {
      logger.error('Failed to toggle mute:', error);
      throw error;
    }
  }

  async toggleRecording(): Promise<boolean> {
    if (!this.currentCall) {
      throw new Error('No active call');
    }

    try {
      const newRecordingState = !this.currentCall.recording;

      // Send recording message
      const recordingMessage = {
        type: 'info',
        callId: this.currentCall.id,
        sessionId: this.currentCall.sessionId,
        recording: newRecordingState
      };

      this.sendSIPMessage(recordingMessage);

      this.currentCall.recording = newRecordingState;
      this.onCallStateChange?.(this.currentCall);
      return newRecordingState;
    } catch (error) {
      logger.error('Failed to toggle recording:', error);
      throw error;
    }
  }

  async transferCall(callId: string, transferNumber: string): Promise<void> {
    if (!this.currentCall || this.currentCall.id !== callId) {
      throw new Error('No active call to transfer');
    }

    // Send REFER message for call transfer
    const referMessage = {
      type: 'refer',
      callId: callId,
      from: this.config!.username,
      to: transferNumber,
      referTo: `sip:${transferNumber}@${this.config!.domain || this.config!.server}`,
      referredBy: this.config!.username
    };

    this.sendSIPMessage(referMessage);

    // Update call state
    this.currentCall.status = 'transferring';
    this.onCallStateChange?.(this.currentCall);
  }

  async addToConference(callId: string, conferenceNumber: string): Promise<void> {
    if (!this.currentCall || this.currentCall.id !== callId) {
      throw new Error('No active call to add to conference');
    }

    // Send INVITE to conference number
    const conferenceMessage = {
      type: 'invite',
      callId: `conference_${Date.now()}`,
      from: this.config!.username,
      to: conferenceNumber,
      subject: 'Conference Call',
      headers: {
        'X-Conference': 'true',
        'X-Original-Call': callId
      }
    };

    this.sendSIPMessage(conferenceMessage);

    // Update call state
    this.currentCall.status = 'conferencing';
    this.onCallStateChange?.(this.currentCall);
  }

  async sendDTMF(digit: string): Promise<void> {
    if (!this.currentCall) {
      throw new Error('No active call');
    }

    try {
      // Send DTMF message
      const dtmfMessage = {
        type: 'info',
        callId: this.currentCall.id,
        sessionId: this.currentCall.sessionId,
        dtmf: {
          digit,
          method: this.config!.dtmfType
        }
      };

      this.sendSIPMessage(dtmfMessage);
    } catch (error) {
      logger.error('Failed to send DTMF:', error);
      throw error;
    }
  }

  private sendSIPMessage(message: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      logger.warn('WebSocket not connected, message not sent:', message);
    }
  }

  private handleInvite(message: { callId: string; sessionId: string; from: string; sdp: string }) {
    // Handle incoming call
    if (this.config!.autoAnswer) {
      this.acceptCall(message.callId, message.sessionId, message.from, message.sdp);
    } else {
      // Notify about incoming call
      this.onCallEvent?.('incomingCall', {
        callId: message.callId,
        from: message.from,
        sdp: message.sdp
      });
    }
  }

  private async acceptCall(callId: string, sessionId: string, from: string, sdp: string) {
    try {
      if (!this.pc) {
        throw new Error('WebRTC not initialized');
      }

      // Set remote description
      await this.pc.setRemoteDescription(new RTCSessionDescription({
        type: 'offer',
        sdp
      }));

      // Create answer
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      // Send ACK message
      const ackMessage = {
        type: 'ack',
        callId,
        sessionId,
        from: this.config!.username,
        to: from,
        sdp: answer.sdp
      };

      this.sendSIPMessage(ackMessage);

      // Create call object
      this.currentCall = {
        id: callId,
        sessionId,
        from,
        to: this.config!.username,
        status: 'answered',
        direction: 'inbound',
        startTime: new Date(),
        duration: 0,
        muted: false,
        onHold: false,
        recording: false
      };

      this.onCallStateChange?.(this.currentCall);
    } catch (error) {
      logger.error('Failed to accept call:', error);
      throw error;
    }
  }

  private handleAck(message: { callId: string }) {
    if (this.currentCall && this.currentCall.id === message.callId) {
      this.currentCall.status = 'answered';
      this.onCallStateChange?.(this.currentCall);
    }
  }

  private handleBye(message: { callId: string }) {
    if (this.currentCall && this.currentCall.id === message.callId) {
      this.currentCall.status = 'ended';
      this.onCallStateChange?.(this.currentCall);
      this.currentCall = null;
    }
  }

  private handleCancel(message: { callId: string }) {
    if (this.currentCall && this.currentCall.id === message.callId) {
      this.currentCall.status = 'failed';
      this.onCallStateChange?.(this.currentCall);
      this.currentCall = null;
    }
  }

  private handleRegister(message: { status?: string; message?: string }) {
    logger.log('Registration response:', message);
  }

  private handleOptions(message: Record<string, unknown>) {
    // Send OK response to OPTIONS
    const okMessage = {
      type: 'ok',
      callId: message.callId,
      from: this.config!.username,
      to: message.from
    };
    this.sendSIPMessage(okMessage);
  }

  private handleInfo(message: { hold?: boolean; callId?: string; recording?: boolean; candidate?: RTCIceCandidateInit }) {
    if (message.hold !== undefined) {
      if (this.currentCall) {
        this.currentCall.onHold = message.hold;
        this.currentCall.status = message.hold ? 'hold' : 'answered';
        this.onCallStateChange?.(this.currentCall);
      }
    }

    if (message.recording !== undefined) {
      if (this.currentCall) {
        this.currentCall.recording = message.recording;
        this.onCallStateChange?.(this.currentCall);
      }
    }

    if (message.candidate) {
      this.pc?.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  }

  private updateCallState() {
    if (this.currentCall && this.pc) {
      const connectionState = this.pc.connectionState;

      switch (connectionState) {
        case 'connected':
          if (this.currentCall.status === 'connecting') {
            this.currentCall.status = 'answered';
          }
          break;
        case 'disconnected':
          this.currentCall.status = 'failed';
          break;
        case 'failed':
          this.currentCall.status = 'failed';
          break;
        case 'closed':
          this.currentCall.status = 'ended';
          break;
      }

      this.onCallStateChange?.(this.currentCall);
    }
  }

  private generateCallId(): string {
    return `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getCurrentCall(): SIPCall | null {
    return this.currentCall;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  setCallStateChangeHandler(handler: (call: SIPCall | null) => void) {
    this.onCallStateChange = handler;
  }

  setCallEventHandler(handler: (event: string, data: unknown) => void) {
    this.onCallEvent = handler;
  }

  destroy() {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.remoteStream = null;
    this.currentCall = null;
    this.onCallStateChange = null;
    this.onCallEvent = null;
  }
}

export const sipService = new SIPService();
