/**
 * White-Label Login Page
 * Displays a customized login page based on agency branding
 * This is shown when accessing via a custom domain
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import useAgencyTheme from '@/hooks/useAgencyTheme';

export default function WhiteLabelLogin() {
    const navigate = useNavigate();
    const auth = useAuth();
    const { loading: themeLoading, branding, agencyName } = useAgencyTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (auth?.user) {
            navigate('/dashboard');
        }
    }, [auth?.user, navigate]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter your email and password.');
            return;
        }

        try {
            setLoading(true);
            await auth?.login(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    }

    if (themeLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const companyName = branding?.company_name || agencyName || 'Welcome';
    const loginTitle = branding?.login_page_title || `Sign in to ${companyName}`;
    const loginDescription = branding?.login_page_description || 'Enter your credentials to access your account.';
    const primaryColor = branding?.primary_color || '#3B82F6';

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{
                background: branding?.login_background_url
                    ? `url(${branding.login_background_url}) center/cover no-repeat`
                    : branding?.primary_color
                        ? `linear-gradient(135deg, ${branding.primary_color}22 0%, ${branding.secondary_color || branding.primary_color}22 100%)`
                        : 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)'
            }}
        >
            {/* Inject custom CSS if provided */}
            {branding?.custom_css && (
                <style dangerouslySetInnerHTML={{ __html: branding.custom_css }} />
            )}

            <div className="w-full max-w-md">
                <Card className="shadow-2xl border-0 backdrop-blur-sm bg-background/95">
                    <CardHeader className="text-center pb-6">
                        {/* Logo */}
                        {branding?.logo_url && (
                            <div className="flex justify-center mb-4">
                                <img
                                    src={branding.logo_url}
                                    alt={companyName}
                                    className="h-12 object-contain"
                                />
                            </div>
                        )}

                        <CardTitle className="text-2xl font-bold">
                            {loginTitle}
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                            {loginDescription}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        autoComplete="email"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10"
                                        autoComplete="current-password"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 text-base"
                                disabled={loading}
                                style={{ backgroundColor: primaryColor }}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 text-center">
                        <button
                            type="button"
                            onClick={() => navigate('/forgot-password')}
                            className="text-sm hover:underline"
                            style={{ color: primaryColor }}
                        >
                            Forgot your password?
                        </button>

                        {/* Support info */}
                        {(branding?.support_email || branding?.support_phone) && (
                            <div className="text-xs text-muted-foreground border-t pt-4 w-full">
                                <p>Need help? Contact support:</p>
                                {branding.support_email && (
                                    <a
                                        href={`mailto:${branding.support_email}`}
                                        className="hover:underline"
                                        style={{ color: primaryColor }}
                                    >
                                        {branding.support_email}
                                    </a>
                                )}
                                {branding.support_email && branding.support_phone && <span className="mx-2">|</span>}
                                {branding.support_phone && (
                                    <a
                                        href={`tel:${branding.support_phone}`}
                                        className="hover:underline"
                                        style={{ color: primaryColor }}
                                    >
                                        {branding.support_phone}
                                    </a>
                                )}
                            </div>
                        )}
                    </CardFooter>
                </Card>

                {/* Powered by notice (can be removed for fully white-labeled) */}
                <p className="text-center text-xs text-muted-foreground/60 mt-6">
                    Powered by Xordon
                </p>
            </div>
        </div>
    );
}
