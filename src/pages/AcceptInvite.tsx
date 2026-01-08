import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface InviteDetails {
    valid: boolean;
    email?: string;
    agency_name?: string;
    role?: string;
    requires_signup?: boolean;
    message?: string;
}

export default function AcceptInvite() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (token) {
            verifyToken();
        } else {
            setLoading(false);
            setInviteDetails({ valid: false, message: 'No invitation token provided.' });
        }
    }, [token]);

    async function verifyToken() {
        try {
            const response = await axios.get(`/api/auth/verify-invite?token=${token}`);
            setInviteDetails(response.data);
        } catch (err: any) {
            setInviteDetails({
                valid: false,
                message: err.response?.data?.error || 'Invalid or expired invitation.'
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleAccept() {
        if (inviteDetails?.requires_signup) {
            if (!name.trim()) {
                toast({ title: 'Error', description: 'Please enter your name.', variant: 'destructive' });
                return;
            }
            if (password.length < 8) {
                toast({ title: 'Error', description: 'Password must be at least 8 characters.', variant: 'destructive' });
                return;
            }
            if (password !== confirmPassword) {
                toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
                return;
            }
        }

        try {
            setAccepting(true);
            const payload: any = { token };
            if (inviteDetails?.requires_signup) {
                payload.name = name;
                payload.password = password;
            }

            const response = await axios.post('/api/auth/accept-invite', payload);

            // Store token if returned
            if (response.data.token) {
                localStorage.setItem('auth_token', response.data.token);
            }

            toast({ title: 'Success!', description: 'You have joined the agency.' });

            // Redirect to dashboard
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.response?.data?.error || 'Failed to accept invitation.',
                variant: 'destructive'
            });
        } finally {
            setAccepting(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-primary" />
                    </div>
                    {inviteDetails?.valid ? (
                        <>
                            <CardTitle className="text-2xl">You're Invited!</CardTitle>
                            <CardDescription>
                                You've been invited to join <strong>{inviteDetails.agency_name}</strong> as a <strong className="capitalize">{inviteDetails.role}</strong>.
                            </CardDescription>
                        </>
                    ) : (
                        <>
                            <CardTitle className="text-2xl text-destructive">Invalid Invitation</CardTitle>
                            <CardDescription>{inviteDetails?.message}</CardDescription>
                        </>
                    )}
                </CardHeader>

                <CardContent>
                    {inviteDetails?.valid ? (
                        <div className="space-y-6">
                            {/* Show signup form if needed */}
                            {inviteDetails.requires_signup && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            value={inviteDetails.email}
                                            disabled
                                            className="bg-muted"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Your Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Create Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <Button
                                onClick={handleAccept}
                                className="w-full gap-2"
                                disabled={accepting}
                            >
                                {accepting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="w-4 h-4" />
                                )}
                                {inviteDetails.requires_signup ? 'Create Account & Join' : 'Accept Invitation'}
                            </Button>

                            <p className="text-xs text-center text-muted-foreground">
                                By accepting, you agree to our Terms of Service and Privacy Policy.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 text-center">
                            <XCircle className="w-12 h-12 text-destructive mx-auto opacity-50" />
                            <p className="text-muted-foreground">
                                The invitation link may have expired or already been used.
                            </p>
                            <Button variant="outline" asChild className="gap-2">
                                <Link to="/login">
                                    Go to Login <ArrowRight className="w-4 h-4" />
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
