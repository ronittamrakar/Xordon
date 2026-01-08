import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Award, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { certificatesApi } from '@/services/certificatesApi';
import { format } from 'date-fns';

export default function CertificateVerification() {
    const { code } = useParams<{ code: string }>();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        if (code) {
            verify(code);
        }
    }, [code]);

    const verify = async (verificationCode: string) => {
        try {
            setLoading(true);
            const data = await certificatesApi.verifyCertificate(verificationCode);
            setResult(data);
        } catch (error) {
            setResult({ valid: false });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground animate-pulse">Verifying certificate...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-xl border-t-4 border-t-primary">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Award className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Certificate Verification</CardTitle>
                    <CardDescription>
                        Official verification for Xordon Learning Management System
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {result?.valid ? (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-2">
                                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                                <h3 className="text-xl font-bold text-green-900">Valid Certificate</h3>
                                <p className="text-green-700"> This certificate is authentic and was issued by Xordon.</p>
                            </div>

                            <div className="grid gap-4 bg-white border rounded-xl p-6">
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Student Name</span>
                                    <span className="font-bold text-lg">{result.certificate.user_name}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Course Title</span>
                                    <span className="font-bold">{result.certificate.course_title}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Issue Date</span>
                                    <span>{format(new Date(result.certificate.issued_at), 'MMMM d, yyyy')}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Certificate Number</span>
                                    <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                        {result.certificate.certificate_number}
                                    </code>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-muted-foreground">Verification Code</span>
                                    <code className="font-mono text-sm">{result.certificate.verification_code}</code>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-4">
                            <XCircle className="h-16 w-16 text-red-600 mx-auto" />
                            <h3 className="text-2xl font-bold text-red-900">Invalid Certificate</h3>
                            <p className="text-red-700 max-w-md mx-auto">
                                The verification code provided does not match any certificate in our records.
                                Please check the code and try again.
                            </p>
                            <div className="pt-4">
                                <code className="bg-white px-4 py-2 rounded-lg border border-red-200 font-mono text-lg font-bold text-red-900">
                                    {code}
                                </code>
                            </div>
                        </div>
                    )}

                    <div className="pt-6 flex flex-col sm:flex-row gap-3">
                        <Button variant="outline" className="flex-1" asChild>
                            <Link to="/">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Home
                            </Link>
                        </Button>
                        {result?.valid && (
                            <Button className="flex-1" variant="default" onClick={() => window.print()}>
                                Print Verification
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
