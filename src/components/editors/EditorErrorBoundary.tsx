import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Editor Error Boundary caught an error:', error, errorInfo);
    }
    
    // In production, you might want to log this to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Editor Error</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-3">
              The rich text editor encountered an error and couldn't load properly.
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <span className="block mt-2 text-xs font-mono bg-red-50 p-2 rounded">
                  {this.state.error.message}
                </span>
              )}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={this.handleRetry}
              className="mr-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default EditorErrorBoundary;
