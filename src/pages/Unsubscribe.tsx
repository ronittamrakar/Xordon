import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Unsubscribe = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnsubscribe = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const rid = searchParams.get('rid');
      const cid = searchParams.get('cid');
      
      // Build the unsubscribe URL
      const params = new URLSearchParams();
      if (token) params.append('token', token);
      if (rid) params.append('rid', rid);
      if (cid) params.append('cid', cid);
      
      const unsubscribeUrl = `${API_URL}/track/unsubscribe?${params.toString()}`;
      const response = await fetch(unsubscribeUrl, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to unsubscribe');
      }
      
      const result = await response.json();
      if (result.success) {
        setUnsubscribed(true);
      } else {
        throw new Error(result.message || 'Failed to unsubscribe');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {unsubscribed ? (
              <CheckCircle2 className="h-6 w-6 text-primary" />
            ) : (
              <Mail className="h-6 w-6 text-primary" />
            )}
          </div>
          <CardTitle>
            {unsubscribed ? 'Successfully Unsubscribed' : 'Unsubscribe from Emails'}
          </CardTitle>
          <CardDescription>
            {unsubscribed 
              ? "You've been removed from our mailing list. You will no longer receive emails from this campaign."
              : "We're sorry to see you go. Click the button below to stop receiving emails from us."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {!unsubscribed ? (
            <Button 
              onClick={handleUnsubscribe} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Unsubscribe'
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                You have been successfully unsubscribed from our mailing list.
              </p>
              {token && (
                <p className="text-xs text-muted-foreground">
                  Reference: {token}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
