import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AccessDeniedProps {
  permission?: string;
  message?: string;
}

export default function AccessDenied({ permission, message }: AccessDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription className="text-base">
            {message || "You don't have permission to access this page."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {permission && (
            <p className="text-sm text-muted-foreground">
              Required permission: <code className="bg-muted px-2 py-1 rounded">{permission}</code>
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact your administrator.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button onClick={() => navigate('/')}>
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
