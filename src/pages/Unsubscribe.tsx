import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail } from 'lucide-react';

const Unsubscribe = () => {
  const { token } = useParams();
  const [unsubscribed, setUnsubscribed] = useState(false);

  const handleUnsubscribe = () => {
    // In a real app, this would call an API endpoint
    setUnsubscribed(true);
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
          {!unsubscribed ? (
            <Button onClick={handleUnsubscribe} className="w-full">
              Confirm Unsubscribe
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Token: {token}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
