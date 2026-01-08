import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, Link2, Unlink, CheckCircle, XCircle, Clock } from 'lucide-react';
import { calendarsApi } from '@/services/calendarsApi';
import { useToast } from '@/components/ui/use-toast';

interface CalendarSyncSettingsProps {
  calendarId: number;
  calendarName: string;
  googleCalendarId?: string;
  outlookCalendarId?: string;
  lastSyncedAt?: string;
}

export const CalendarSyncSettings: React.FC<CalendarSyncSettingsProps> = ({
  calendarId,
  calendarName,
  googleCalendarId,
  outlookCalendarId,
  lastSyncedAt,
}) => {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState<'google' | 'outlook' | null>(null);

  const isGoogleConnected = !!googleCalendarId;
  const isOutlookConnected = !!outlookCalendarId;

  const handleConnectGoogle = async () => {
    try {
      setConnecting('google');
      const { auth_url } = await calendarsApi.connectGoogle(calendarId);
      window.location.href = auth_url;
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to Google Calendar',
        variant: 'destructive',
      });
      setConnecting(null);
    }
  };

  const handleConnectOutlook = async () => {
    try {
      setConnecting('outlook');
      const { auth_url } = await calendarsApi.connectOutlook(calendarId);
      window.location.href = auth_url;
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to Outlook Calendar',
        variant: 'destructive',
      });
      setConnecting(null);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const result = await calendarsApi.syncNow(calendarId);
      toast({
        title: 'Sync Complete',
        description: `Imported ${result.imported} events, skipped ${result.skipped}`,
      });
    } catch (error: any) {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync calendar',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (provider: 'google' | 'outlook') => {
    if (!confirm(`Disconnect ${provider === 'google' ? 'Google' : 'Outlook'} Calendar sync?`)) {
      return;
    }

    try {
      await calendarsApi.disconnect(calendarId, provider);
      toast({
        title: 'Disconnected',
        description: `${provider === 'google' ? 'Google' : 'Outlook'} Calendar sync has been disconnected`,
      });
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Disconnect Failed',
        description: error.message || 'Failed to disconnect calendar',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Sync
        </CardTitle>
        <CardDescription>
          Connect {calendarName} to external calendars for two-way synchronization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Calendar */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="font-medium">Google Calendar</div>
              <div className="text-sm text-muted-foreground">
                {isGoogleConnected ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Connected
                  </span>
                ) : (
                  'Not connected'
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isGoogleConnected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  Sync Now
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect('google')}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                onClick={handleConnectGoogle}
                disabled={connecting === 'google'}
                size="sm"
              >
                <Link2 className="h-4 w-4 mr-2" />
                {connecting === 'google' ? 'Connecting...' : 'Connect'}
              </Button>
            )}
          </div>
        </div>

        {/* Outlook Calendar */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="font-medium">Outlook Calendar</div>
              <div className="text-sm text-muted-foreground">
                {isOutlookConnected ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Connected
                  </span>
                ) : (
                  'Not connected'
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOutlookConnected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  Sync Now
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect('outlook')}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                onClick={handleConnectOutlook}
                disabled={connecting === 'outlook'}
                size="sm"
              >
                <Link2 className="h-4 w-4 mr-2" />
                {connecting === 'outlook' ? 'Connecting...' : 'Connect'}
              </Button>
            )}
          </div>
        </div>

        {/* Last Sync Info */}
        {(isGoogleConnected || isOutlookConnected) && lastSyncedAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
            <Clock className="h-4 w-4" />
            Last synced: {new Date(lastSyncedAt).toLocaleString()}
          </div>
        )}

        {/* Sync Info */}
        {(isGoogleConnected || isOutlookConnected) && (
          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">How sync works:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>External events are imported as busy blocks</li>
              <li>Local appointments are pushed to external calendars</li>
              <li>Sync runs automatically every hour</li>
              <li>Manual sync available anytime</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarSyncSettings;
