import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, RefreshCw, Link2, Unlink, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { reviewIntegrationsApi } from '@/services/reviewIntegrationsApi';
import { useToast } from '@/components/ui/use-toast';

interface ReviewPlatformConnectionProps {
  onRefresh?: () => void;
}

interface Platform {
  id: number;
  platform: 'google' | 'facebook' | 'yelp' | 'trustpilot';
  platform_name: string;
  is_active: boolean;
  last_sync_at?: string;
  config?: any;
}

export const ReviewPlatformConnection: React.FC<ReviewPlatformConnectionProps> = ({ onRefresh }) => {
  const { toast } = useToast();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      setLoading(true);
      const data = await reviewIntegrationsApi.listPlatforms();
      setPlatforms(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load review platforms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: 'google' | 'facebook', platformId: number) => {
    try {
      setConnecting(platform);
      let result;
      if (platform === 'google') {
        result = await reviewIntegrationsApi.connectGoogle(platformId);
      } else {
        result = await reviewIntegrationsApi.connectFacebook(platformId);
      }
      window.location.href = result.auth_url;
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message || `Failed to connect to ${platform}`,
        variant: 'destructive',
      });
      setConnecting(null);
    }
  };

  const handleSync = async (platformId: number, platform: 'google' | 'facebook') => {
    try {
      setSyncing(platformId);
      const result = await reviewIntegrationsApi.syncPlatform(platformId, platform);
      toast({
        title: 'Sync Complete',
        description: `Imported ${result.imported || 0} reviews`,
      });
      loadPlatforms();
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync reviews',
        variant: 'destructive',
      });
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = async (platformId: number, platformName: string) => {
    if (!confirm(`Disconnect ${platformName}? You can reconnect anytime.`)) {
      return;
    }

    try {
      await reviewIntegrationsApi.disconnect(platformId);
      toast({
        title: 'Disconnected',
        description: `${platformName} has been disconnected`,
      });
      loadPlatforms();
    } catch (error: any) {
      toast({
        title: 'Disconnect Failed',
        description: error.message || 'Failed to disconnect platform',
        variant: 'destructive',
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'google':
        return '🔵';
      case 'facebook':
        return '📘';
      case 'yelp':
        return '🔴';
      case 'trustpilot':
        return '🟢';
      default:
        return '⭐';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'google':
        return 'bg-blue-100 dark:bg-blue-900';
      case 'facebook':
        return 'bg-blue-100 dark:bg-blue-900';
      case 'yelp':
        return 'bg-red-100 dark:bg-red-900';
      case 'trustpilot':
        return 'bg-green-100 dark:bg-green-900';
      default:
        return 'bg-gray-100 dark:bg-gray-900';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading platforms...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Review Platform Connections
        </CardTitle>
        <CardDescription>
          Connect to review platforms to automatically import and manage reviews
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Business Profile */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${getPlatformColor('google')} rounded-lg flex items-center justify-center text-xl`}>
              {getPlatformIcon('google')}
            </div>
            <div>
              <div className="font-medium">Google Business Profile</div>
              <div className="text-sm text-muted-foreground">
                {platforms.find(p => p.platform === 'google')?.is_active ? (
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
            {platforms.find(p => p.platform === 'google')?.is_active ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const platform = platforms.find(p => p.platform === 'google');
                    if (platform) handleSync(platform.id, 'google');
                  }}
                  disabled={syncing !== null}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const platform = platforms.find(p => p.platform === 'google');
                    if (platform) handleDisconnect(platform.id, 'Google Business Profile');
                  }}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  const platform = platforms.find(p => p.platform === 'google');
                  if (platform) handleConnect('google', platform.id);
                }}
                disabled={connecting === 'google'}
                size="sm"
              >
                <Link2 className="h-4 w-4 mr-2" />
                {connecting === 'google' ? 'Connecting...' : 'Connect'}
              </Button>
            )}
          </div>
        </div>

        {/* Facebook */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${getPlatformColor('facebook')} rounded-lg flex items-center justify-center text-xl`}>
              {getPlatformIcon('facebook')}
            </div>
            <div>
              <div className="font-medium">Facebook Page</div>
              <div className="text-sm text-muted-foreground">
                {platforms.find(p => p.platform === 'facebook')?.is_active ? (
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
            {platforms.find(p => p.platform === 'facebook')?.is_active ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const platform = platforms.find(p => p.platform === 'facebook');
                    if (platform) handleSync(platform.id, 'facebook');
                  }}
                  disabled={syncing !== null}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const platform = platforms.find(p => p.platform === 'facebook');
                    if (platform) handleDisconnect(platform.id, 'Facebook Page');
                  }}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  const platform = platforms.find(p => p.platform === 'facebook');
                  if (platform) handleConnect('facebook', platform.id);
                }}
                disabled={connecting === 'facebook'}
                size="sm"
              >
                <Link2 className="h-4 w-4 mr-2" />
                {connecting === 'facebook' ? 'Connecting...' : 'Connect'}
              </Button>
            )}
          </div>
        </div>

        {/* Last Sync Info */}
        {platforms.some(p => p.is_active && p.last_sync_at) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
            <Clock className="h-4 w-4" />
            Last synced: {new Date(platforms.find(p => p.is_active && p.last_sync_at)?.last_sync_at || '').toLocaleString()}
          </div>
        )}

        {/* Info Box */}
        {platforms.some(p => p.is_active) && (
          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Automatic Review Import:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Reviews sync automatically every 6 hours</li>
              <li>Low ratings (≤3 stars) trigger workflow automations</li>
              <li>Manual sync available anytime</li>
              <li>Reply to reviews directly from the dashboard</li>
            </ul>
          </div>
        )}

        {/* No Connections */}
        {!platforms.some(p => p.is_active) && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                  No platforms connected
                </p>
                <p className="text-amber-700 dark:text-amber-300">
                  Connect to review platforms to start importing and managing your online reviews automatically.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewPlatformConnection;
