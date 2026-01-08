import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Award, Download, Share2, CheckCircle2, XCircle } from 'lucide-react';
import { certificatesApi, Certificate } from '@/services/certificatesApi';
import { format } from 'date-fns';

export default function CertificatesPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadCertificates();
    }, []);

    const loadCertificates = async () => {
        try {
            setLoading(true);
            const data = await certificatesApi.getUserCertificates();
            setCertificates(data);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to load certificates',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!verificationCode.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a verification code',
                variant: 'destructive',
            });
            return;
        }

        try {
            setVerifying(true);
            const result = await certificatesApi.verifyCertificate(verificationCode);
            setVerificationResult(result);

            if (result.valid) {
                toast({
                    title: 'Success',
                    description: 'Certificate is valid!',
                });
            } else {
                toast({
                    title: 'Invalid',
                    description: 'Certificate not found or invalid',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to verify certificate',
                variant: 'destructive',
            });
            setVerificationResult({ valid: false });
        } finally {
            setVerifying(false);
        }
    };

    const handleDownload = async (certificateId: number) => {
        try {
            const pdfUrl = await certificatesApi.downloadCertificate(certificateId);
            if (pdfUrl) {
                window.open(pdfUrl, '_blank');
            } else {
                toast({
                    title: 'Info',
                    description: 'PDF generation is not yet implemented',
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to download certificate',
                variant: 'destructive',
            });
        }
    };

    const handleShare = (certificate: Certificate) => {
        const shareUrl = `${window.location.origin}/certificates/verify/${certificate.verification_code}`;

        if (navigator.share) {
            navigator.share({
                title: `Certificate - ${certificate.course_title}`,
                text: `I've completed ${certificate.course_title}!`,
                url: shareUrl,
            });
        } else {
            navigator.clipboard.writeText(shareUrl);
            toast({
                title: 'Success',
                description: 'Verification link copied to clipboard',
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">My Certificates</h1>
                <p className="text-muted-foreground mt-1">
                    View and manage your course completion certificates
                </p>
            </div>

            {/* Certificate Verification */}
            <Card>
                <CardHeader>
                    <CardTitle>Verify a Certificate</CardTitle>
                    <CardDescription>
                        Enter a verification code to check if a certificate is valid
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter verification code..."
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                        />
                        <Button onClick={handleVerify} disabled={verifying}>
                            {verifying ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify'
                            )}
                        </Button>
                    </div>

                    {verificationResult && (
                        <div className={`p-4 rounded-lg border ${verificationResult.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center gap-2">
                                {verificationResult.valid ? (
                                    <>
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        <div>
                                            <p className="font-medium text-green-900">Valid Certificate</p>
                                            {verificationResult.certificate && (
                                                <p className="text-sm text-green-700 mt-1">
                                                    {verificationResult.certificate.user_name} - {verificationResult.certificate.course_title}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-5 w-5 text-red-600" />
                                        <div>
                                            <p className="font-medium text-red-900">Invalid Certificate</p>
                                            <p className="text-sm text-red-700 mt-1">
                                                This certificate could not be verified
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Certificates List */}
            {certificates.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Award className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No certificates yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Complete a course to earn your first certificate
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {certificates.map((certificate) => (
                        <Card key={certificate.id} className="overflow-hidden">
                            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 border-b">
                                <div className="flex items-start justify-between">
                                    <Award className="h-12 w-12 text-primary" />
                                    <Badge variant="outline" className="bg-white">
                                        {format(new Date(certificate.issued_at), 'MMM d, yyyy')}
                                    </Badge>
                                </div>
                                <h3 className="text-xl font-bold mt-4">{certificate.course_title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Certificate #{certificate.certificate_number}
                                </p>
                            </div>

                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Issued To</span>
                                        <span className="font-medium">{certificate.user_name}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Verification Code</span>
                                        <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                            {certificate.verification_code}
                                        </code>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleDownload(certificate.id)}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleShare(certificate)}
                                    >
                                        <Share2 className="mr-2 h-4 w-4" />
                                        Share
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
