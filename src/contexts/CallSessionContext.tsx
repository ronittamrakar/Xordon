import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

// Defensive check - ensure React is properly loaded
if (typeof React === 'undefined' || React === null) {
  throw new Error('React is not properly loaded in CallSessionContext');
}

if (import.meta.env.DEV) {
  console.log('[CallSessionContext] React import check:', {
    React: typeof React,
    useState: typeof useState,
    useCallback: typeof useCallback,
    useContext: typeof useContext,
    useMemo: typeof useMemo,
    createContext: typeof createContext,
  });
}

export type CallSessionStatus =
  | 'idle'
  | 'dialing'
  | 'ringing'
  | 'connected'
  | 'onhold'
  | 'ended'
  | 'failed';

export type CallSessionSource = 'softphone' | 'dialer' | 'api';

export interface SharedCallSession {
  id: string;
  number: string;
  status: CallSessionStatus;
  source: CallSessionSource;
  startedAt?: string;
  endedAt?: string;
  recipientName?: string;
  campaignId?: string;
  metadata?: Record<string, unknown>;
}

export interface SoftphoneIntent {
  id: string;
  number: string;
  recipientName?: string;
  campaignId?: string;
  callerId?: string;
  note?: string;
  source: CallSessionSource;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

interface CallSessionContextValue {
  session: SharedCallSession | null;
  startSession: (session: SharedCallSession) => void;
  updateSession: (updates: Partial<SharedCallSession>) => void;
  endSession: (status?: CallSessionStatus) => void;
  intent: SoftphoneIntent | null;
  requestSoftphoneCall: (intent: Omit<SoftphoneIntent, 'id' | 'createdAt'>) => void;
  consumeIntent: () => void;
}

const CallSessionContext = createContext<CallSessionContextValue | undefined>(undefined);

const createId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `call-${Date.now()}`);

export function CallSessionProvider({ children }: { children: ReactNode }) {
  if (import.meta.env.DEV) {
    // @ts-ignore
    console.log('[DEBUG] CallSessionProvider rendering. Same React?', window.React1 === React);
    console.log('[DEBUG] useState type:', typeof useState);
  }

  // Use named imports directly instead of React.useState
  const [session, setSession] = useState<SharedCallSession | null>(null);
  const [intent, setIntent] = useState<SoftphoneIntent | null>(null);

  const startSession = useCallback((incoming: SharedCallSession) => {
    setSession({ ...incoming, startedAt: incoming.startedAt ?? new Date().toISOString() });
  }, []);

  const updateSession = useCallback((updates: Partial<SharedCallSession>) => {
    setSession(prev => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const endSession = useCallback((status: CallSessionStatus = 'ended') => {
    setSession(prev =>
      prev
        ? {
          ...prev,
          status,
          endedAt: new Date().toISOString(),
        }
        : prev
    );
  }, []);

  const requestSoftphoneCall = useCallback(
    (payload: Omit<SoftphoneIntent, 'id' | 'createdAt'>) => {
      setIntent({ ...payload, id: createId(), createdAt: Date.now() });
    },
    []
  );

  const consumeIntent = useCallback(() => setIntent(null), []);

  const value = useMemo<CallSessionContextValue>(
    () => ({ session, startSession, updateSession, endSession, intent, requestSoftphoneCall, consumeIntent }),
    [session, startSession, updateSession, endSession, intent, requestSoftphoneCall, consumeIntent]
  );

  return (
    <CallSessionContext.Provider value={value}>
      {children}
    </CallSessionContext.Provider>
  );
}

export const useCallSession = () => {
  const ctx = useContext(CallSessionContext);
  if (!ctx) {
    throw new Error('useCallSession must be used within a CallSessionProvider');
  }
  return ctx;
};
