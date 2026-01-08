import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/UnifiedAppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrandWordmark } from '@/components/BrandWordmark';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import SEO from '@/components/SEO';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const { forgotPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await forgotPassword(email);
            setIsSubmitted(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <SEO
                title="Forgot Password"
                description="Reset your Xordon account password."
            />
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <BrandWordmark
                        className="mb-8 justify-center"
                        style={{ fontSize: '6rem', lineHeight: '1' }}
                        textClassName="text-foreground"
                        casing="lower"
                    />
                </div>

                <Card className="shadow-2xl border-white/5 overflow-hidden">
                    <CardContent className="p-10">
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <h1 className="text-xl font-bold tracking-tight">Reset password</h1>
                                <p className="text-sm text-gray-500">
                                    {isSubmitted
                                        ? "Check your email for instructions"
                                        : "Enter your email to get a reset link"}
                                </p>
                            </div>

                            {!isSubmitted ? (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Button
                                            type="submit"
                                            className="w-full text-lg h-12 font-bold bg-white text-black hover:bg-gray-100 dark:bg-white dark:text-black transition-all"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                'Send Reset Link'
                                            )}
                                        </Button>

                                        <Link
                                            to="/login"
                                            className="text-sm text-gray-500 hover:text-foreground flex items-center justify-center transition-colors pt-2"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Back to Login
                                        </Link>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6 text-center">
                                    <div className="flex justify-center">
                                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-gray-600 dark:text-gray-300">
                                            Sent to <span className="font-semibold text-foreground">{email}</span>.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setIsSubmitted(false)}
                                    >
                                        Try another email
                                    </Button>
                                    <Link
                                        to="/login"
                                        className="text-sm text-blue-600 hover:text-blue-500 block font-medium"
                                    >
                                        Return to Sign In
                                    </Link>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPassword;
