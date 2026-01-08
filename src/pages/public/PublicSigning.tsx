import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ShieldCheck,
    FileText,
    CheckCircle,
    PenTool,
    Type,
    Eraser,
    Loader2,
    Lock
} from 'lucide-react';
import { api } from '@/lib/api';

interface SignerContext {
    signer: {
        id: string;
        name: string;
        email: string;
        status: string;
    };
    request: {
        id: string;
        title: string;
        message: string;
        status: string;
    };
    document?: any;
}

const SignatureCanvas = ({ onSave }: { onSave: (data: string) => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            onSave(canvas.toDataURL());
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

        if (!isDrawing) {
            ctx.beginPath();
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            onSave('');
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 overflow-hidden h-40">
                <canvas
                    ref={canvasRef}
                    width={500}
                    height={160}
                    className="w-full h-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                />
                {!isDrawing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                        <PenTool className="h-5 w-5 mr-2" />
                        <span className="text-sm font-medium">Draw your signature here</span>
                    </div>
                )}
            </div>
            <Button variant="ghost" size="sm" onClick={clear} className="text-gray-500 hover:text-red-500">
                <Eraser className="h-4 w-4 mr-2" /> Clear Signature
            </Button>
        </div>
    );
};

export default function PublicSigning() {
    const { token } = useParams<{ token: string }>();
    const [context, setContext] = useState<SignerContext | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [signatureType, setSignatureType] = useState('draw');
    const [typedSignature, setTypedSignature] = useState('');
    const [drawSignature, setDrawSignature] = useState('');
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        fetchContext();
    }, [token]);

    const fetchContext = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/e-signature/public/signer/${token}`);
            setContext(res.data);
            if (res.data.signer.status === 'signed') {
                setCompleted(true);
            }
        } catch (err) {
            toast.error('Invalid or expired signing link');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        const finalSignature = signatureType === 'draw' ? drawSignature : typedSignature;
        if (!finalSignature) {
            toast.error('Please provide a signature');
            return;
        }

        try {
            setSubmitting(true);
            await api.post(`/e-signature/public/signer/${token}/sign`, {
                signature_image: finalSignature
            });
            setCompleted(true);
            toast.success('Document signed successfully');
        } catch (err) {
            toast.error('Failed to save signature');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!context) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
                <Card className="max-w-md w-full p-8 space-y-4">
                    <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                        <Lock className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p className="text-gray-500">This signing link is invalid, expired, or has already been used.</p>
                </Card>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full p-8 space-y-6 text-center shadow-xl border-none">
                    <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="h-12 w-12" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">Thank You!</h1>
                        <p className="text-gray-500">You have successfully signed<br /><strong>{context.request.title}</strong></p>
                    </div>
                    <p className="text-sm text-gray-400">A copy of the signed document will be sent to your email.</p>
                    <div className="pt-4 border-t border-gray-100 italic text-xs text-slate-400">
                        Securely processed by Xordon E-Signature
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans selection:bg-primary/10">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <span className="font-bold tracking-wider text-lg">XORDON SIGN</span>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 hidden sm:block">
                        Secure Electronic Signature
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Document Viewer (Simplified) */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="border-none shadow-sm h-full min-h-[600px] overflow-hidden">
                        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <span className="font-bold truncate max-w-[200px] md:max-w-md">{context.request.title}</span>
                            </div>
                            <span className="text-xs font-mono opacity-50">PAGE 1 OF 1</span>
                        </div>
                        <CardContent className="p-8 md:p-12 prose prose-slate max-w-none prose-headings:font-black">
                            <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-xl">
                                <h3 className="text-blue-900 mt-0">Signature Requested</h3>
                                <p className="text-blue-800 mb-0 italic">"{context.request.message || 'Please review and sign this document.'}"</p>
                            </div>

                            {context.document ? (
                                <div className="space-y-8">
                                    <div className="flex justify-between items-start border-b border-gray-100 pb-8">
                                        <div>
                                            <h1 className="text-2xl font-bold mb-1">{context.request.title}</h1>
                                            <p className="text-gray-400 font-medium">#{context.request.id.split('-')[0].toUpperCase()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs uppercase font-bold tracking-widest text-gray-400 mb-1">Prepared For</p>
                                            <p className="font-bold">{context.signer.name}</p>
                                        </div>
                                    </div>

                                    {/* Line Items for Estimates */}
                                    {context.document.line_items && (
                                        <div className="mt-8 border rounded-xl overflow-hidden">
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50 border-b">
                                                    <tr>
                                                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest">Description</th>
                                                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {context.document.line_items.map((item: any, i: number) => (
                                                        <tr key={i}>
                                                            <td className="px-6 py-4">
                                                                <div className="font-bold">{item.description}</div>
                                                                <div className="text-xs text-gray-500">Qty: {item.quantity} × {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.unit_price)}</div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-medium">
                                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.total)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-gray-50 font-bold text-lg">
                                                    <tr>
                                                        <td className="px-6 py-4 text-right">Total</td>
                                                        <td className="px-6 py-4 text-right">
                                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.document.total)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}

                                    <div className="pt-8 text-gray-500 text-sm leading-relaxed">
                                        <p>By signing this document, you agree to the terms and conditions outlined above. This electronic signature is legally binding and equivalent to a handwritten signature.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-20 text-center space-y-4">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-200" />
                                    <p className="text-gray-400">Loading document content...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Signing Sidebar */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="sticky top-24 space-y-6">
                        <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden">
                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold">Sign Document</h2>
                                    <p className="text-slate-400 text-sm">Review as <span className="text-white font-medium">{context.signer.name}</span></p>
                                </div>

                                <Tabs value={signatureType} onValueChange={setSignatureType} className="space-y-6">
                                    <TabsList className="bg-slate-800 border-slate-700 w-full p-1 h-12">
                                        <TabsTrigger value="draw" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-slate-950 font-bold uppercase tracking-widest text-[10px]">
                                            <PenTool className="h-3 w-3 mr-2" /> Draw
                                        </TabsTrigger>
                                        <TabsTrigger value="type" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-slate-950 font-bold uppercase tracking-widest text-[10px]">
                                            <Type className="h-3 w-3 mr-2" /> Type
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="draw" className="mt-0">
                                        <SignatureCanvas onSave={setDrawSignature} />
                                    </TabsContent>

                                    <TabsContent value="type" className="mt-0 space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Your Full Name</Label>
                                            <Input
                                                value={typedSignature}
                                                onChange={(e) => setTypedSignature(e.target.value)}
                                                placeholder="Type your name..."
                                                className="bg-slate-800 border-slate-700 h-14 text-xl font-serif italic text-white focus:ring-primary"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-500 italic">This signature is computer-generated and legally binding.</p>
                                    </TabsContent>
                                </Tabs>

                                <div className="space-y-4 pt-4 border-t border-slate-800">
                                    <Button
                                        onClick={handleSubmit}
                                        className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-base rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
                                        disabled={submitting || (signatureType === 'draw' ? !drawSignature : !typedSignature)}
                                    >
                                        {submitting ? (
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        ) : (
                                            <ShieldCheck className="h-5 w-5 mr-2" />
                                        )}
                                        {submitting ? 'Signing...' : 'Complete Signing'}
                                    </Button>
                                    <p className="text-[10px] text-center text-slate-500 uppercase font-bold tracking-widest">
                                        SECURE 256-BIT ENCRYPTION
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex items-center justify-center gap-2 p-4 bg-white rounded-xl border border-gray-100 shadow-sm opacity-60">
                            <Lock className="h-3 w-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Identity Verified: <strong>{context.signer.email}</strong></span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-gray-100 bg-white">
                <div className="max-w-5xl mx-auto px-6 text-center space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                        Xordon E-Signature Protocol v1.0
                    </p>
                    <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                        By using Xordon Sign, you agree to our Electronic Signature Disclosure and Consent and our Privacy Policy.
                    </p>
                </div>
            </footer>
        </div>
    );
}
