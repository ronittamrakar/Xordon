import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { affiliatesApi } from '@/services/affiliatesApi';
import { Loader2 } from 'lucide-react';

const AffiliateReferral: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const handleReferral = async () => {
            if (!code) {
                navigate('/');
                return;
            }

            try {
                // Record the click in backend
                const response = await affiliatesApi.recordClick({
                    code,
                    landing_page: window.location.href,
                    utm_source: searchParams.get('utm_source') || undefined,
                    utm_medium: searchParams.get('utm_medium') || undefined,
                    utm_campaign: searchParams.get('utm_campaign') || undefined,
                });

                if (response.success) {
                    // Store referral info in localStorage for later (signup/conversion)
                    localStorage.setItem('affiliate_code', code);
                    localStorage.setItem('affiliate_id', response.data.affiliate_id.toString());
                    localStorage.setItem('affiliate_expires_at', response.data.expires_at);
                }
            } catch (error) {
                console.error('Failed to record affiliate click:', error);
            } finally {
                // Redirect to the target page (default to home)
                const redirectTo = searchParams.get('to') || '/';
                navigate(redirectTo);
            }
        };

        handleReferral();
    }, [code, navigate, searchParams]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h1 className="text-xl font-medium text-foreground">Redirecting...</h1>
            <p className="text-muted-foreground mt-2">Connecting you to our platform via our partner link.</p>
        </div>
    );
};

export default AffiliateReferral;
