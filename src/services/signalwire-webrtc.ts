import * as SignalWire from '@signalwire/js';
import { createLogger } from '@/utils/logger';

const logger = createLogger('webrtc', 'debug_softphone');

export interface SignalWireCredentials {
  projectId: string;
  token: string;
  identity?: string;
}

export interface CallSession {
  id: string;
  status: string;
  direction: 'inbound' | 'outbound';
  remoteStream?: MediaStream;
  localStream?: MediaStream;
}

export class SignalWireWebRTCService {
  private client: any = null;
  private currentCall: any = null;
  private onCallStateChange: ((call: any) => void) | null = null;
  private onIncomingCall: ((call: any) => void) | null = null;
  private onStream: ((stream: MediaStream) => void) | null = null;

  async initialize(credentials: SignalWireCredentials): Promise<void> {
    if (this.client) {
      return;
    }

    logger.log('Initializing SignalWire Voice Device...');

    try {
      // @ts-ignore - SignalWire SDK types can be tricky
      const sw = SignalWire as any;
      const Voice = sw.Voice || (sw.default && sw.default.Voice);

      if (!Voice) {
        logger.error('SignalWire Voice SDK not found in the current package version');
        throw new Error('SignalWire Voice SDK not found');
      }

      this.client = new Voice.Device({
        token: credentials.token,
        debug: { log: true }
      });

      this.client.on('ready', (device) => {
        logger.log('SignalWire Device ready');
      });

      this.client.on('error', (error) => {
        logger.error('SignalWire Device error:', error);
      });

      this.client.on('call.received', (call) => {
        logger.log('Incoming call received:', call.id);
        this.currentCall = call;
        this.setupCallHandlers(call);
        if (this.onIncomingCall) {
          this.onIncomingCall(call);
        } else {
          // Auto-answer bridged REST calls if needed, or handle in component
          logger.log('No incoming call handler, use service methods to answer');
        }
      });

      // Connect the device
      // @ts-ignore
      await this.client.connect();
      logger.log('SignalWire Device connected');
    } catch (error) {
      logger.error('Failed to initialize SignalWire SDK:', error);
      throw error;
    }
  }

  async makeCall(to: string, from: string): Promise<any> {
    if (!this.client) {
      throw new Error('SignalWire Service not initialized');
    }

    logger.log(`Calling ${to} from ${from}...`);
    // @ts-ignore
    const call = await this.client.dial({
      to,
      from,
      audio: true
    });

    this.currentCall = call;
    this.setupCallHandlers(call);
    return call;
  }

  private setupCallHandlers(call: any) {
    call.on('stateChange', (state: string) => {
      logger.log('Call state:', state);
      if (this.onCallStateChange) {
        this.onCallStateChange(call);
      }
      if (state === 'destroyed' || state === 'hangup') {
        if (this.currentCall?.id === call.id) {
          this.currentCall = null;
        }
      }
    });

    call.on('stream', (stream: MediaStream) => {
      logger.log('Remote stream received');
      if (this.onStream) {
        this.onStream(stream);
      }
    });
  }

  async answerCall(): Promise<void> {
    if (this.currentCall && this.currentCall.state === 'ringing') {
      await this.currentCall.answer();
    }
  }

  async hangup(): Promise<void> {
    if (this.currentCall) {
      await this.currentCall.hangup();
      this.currentCall = null;
    }
  }

  async setMute(mute: boolean): Promise<void> {
    if (this.currentCall) {
      if (mute) {
        await this.currentCall.muteAudio();
      } else {
        await this.currentCall.unmuteAudio();
      }
    }
  }

  async endCall(): Promise<void> {
    await this.hangup();
  }

  async sendDTMF(digit: string): Promise<void> {
    if (this.currentCall) {
      // @ts-ignore
      await this.currentCall.sendDigits(digit);
    }
  }

  async toggleMute(shouldMute: boolean): Promise<boolean> {
    await this.setMute(shouldMute);
    return shouldMute;
  }

  getIncomingCall(): any {
    return null; // Handled via setHandlers now
  }

  setHandlers(handlers: {
    onStateChange?: (call: any) => void;
    onIncomingCall?: (call: any) => void;
    onStream?: (stream: MediaStream) => void;
  }) {
    if (handlers.onStateChange) this.onCallStateChange = handlers.onStateChange;
    if (handlers.onIncomingCall) this.onIncomingCall = handlers.onIncomingCall;
    if (handlers.onStream) this.onStream = handlers.onStream;
  }

  destroy() {
    if (this.client) {
      // @ts-ignore
      this.client.disconnect();
      this.client = null;
    }
    this.currentCall = null;
  }
}

let instance: SignalWireWebRTCService | null = null;
export const getSignalWireWebRTCService = (): SignalWireWebRTCService => {
  if (!instance) {
    instance = new SignalWireWebRTCService();
  }
  return instance;
};
