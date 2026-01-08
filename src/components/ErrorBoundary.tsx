import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full">
                        <Alert variant="destructive" className="mb-4 bg-white border-red-200 shadow-lg">
                            <AlertTitle className="text-lg font-semibold mb-2">Something went wrong</AlertTitle>
                            <AlertDescription className="text-sm text-gray-600 mb-4">
                                {this.state.error?.message || 'An unexpected error occurred.'}
                                {this.state.error?.message?.includes('Failed to fetch dynamically imported module') && (
                                    <div className="mt-2 text-xs bg-red-50 p-2 rounded">
                                        This usually happens when a new version of the app is deployed. reloading the page should fix it.
                                    </div>
                                )}
                            </AlertDescription>
                            <div className="flex justify-end">
                                <Button onClick={this.handleReload} variant="outline" className="gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    Reload Page
                                </Button>
                            </div>
                        </Alert>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
