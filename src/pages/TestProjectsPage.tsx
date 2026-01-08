import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';

/**
 * Diagnostic page for testing project creation
 * Access at /test-projects
 */
const TestProjectsPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<any>(null);

    const testGetProjects = async () => {
        setLoading(true);
        setResult(null);
        setError(null);
        try {
            const response = await api.projects.getAll();
            setResult(response);
            toast.success('Successfully fetched projects');
        } catch (err: any) {
            setError(err);
            toast.error('Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    const testCreateProject = async () => {
        setLoading(true);
        setResult(null);
        setError(null);
        try {
            const projectData = {
                title: `Test Project ${new Date().toISOString()}`,
                description: 'This is a test project created from the diagnostic page',
                status: 'planning',
                priority: 'medium',
                color: '#3B82F6',
                start_date: new Date().toISOString().split('T')[0],
            };
            console.log('Creating project with data:', projectData);
            const response = await api.projects.create(projectData);
            setResult(response);
            toast.success('Successfully created project');
        } catch (err: any) {
            console.error('Error creating project:', err);
            setError(err);
            toast.error('Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    const testAuth = async () => {
        setLoading(true);
        setResult(null);
        setError(null);
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
            });
            const data = await response.json();
            setResult(data);
            if (response.ok) {
                toast.success('Authentication successful');
            } else {
                toast.error('Authentication failed');
            }
        } catch (err: any) {
            setError(err);
            toast.error('Failed to check authentication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Projects Diagnostic Page</h1>
                <p className="text-muted-foreground">Test project creation and API endpoints</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={testAuth} disabled={loading}>
                    Test Authentication
                </Button>
                <Button onClick={testGetProjects} disabled={loading}>
                    Test Get Projects
                </Button>
                <Button onClick={testCreateProject} disabled={loading}>
                    Test Create Project
                </Button>
            </div>

            {loading && (
                <Card>
                    <CardContent className="pt-6">
                        <p>Loading...</p>
                    </CardContent>
                </Card>
            )}

            {result && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-green-600">✅ Success</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded overflow-auto max-h-96">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}

            {error && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-600">❌ Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-red-50 dark:bg-red-900/20 p-4 rounded overflow-auto max-h-96">
                            {JSON.stringify(
                                {
                                    message: error?.message,
                                    error: error?.error,
                                    status: error?.status,
                                    response: error?.response,
                                    stack: error?.stack,
                                },
                                null,
                                2
                            )}
                        </pre>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Debug Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div>
                        <strong>Auth Token:</strong>{' '}
                        {localStorage.getItem('auth_token') ? '✅ Present' : '❌ Missing'}
                    </div>
                    <div>
                        <strong>Workspace ID:</strong>{' '}
                        {localStorage.getItem('tenant_id') || localStorage.getItem('workspace_id') || 'Not set'}
                    </div>
                    <div>
                        <strong>API URL:</strong> /api
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TestProjectsPage;
