import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  Clock,
  Download,
  Printer,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  User,
  DollarSign,
  FileText as FileTextIcon,
  Layout,
  Terminal,
  Quote
} from 'lucide-react';
import { proposalApi, type Proposal } from '@/lib/api';
import { format } from 'date-fns';
import { SafeHTML } from '@/components/SafeHTML';

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const PricingTable = ({ proposal }: { proposal: Proposal }) => (
  <div className="overflow-hidden rounded-xl border border-border shadow-sm">
    <table className="w-full text-left">
      <thead className="bg-muted/50">
        <tr>
          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-70">Item</th>
          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right opacity-70">Price</th>
          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right opacity-70">Qty</th>
          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right opacity-70">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {proposal.items?.map((item, idx) => (
          <tr key={idx} className="bg-card">
            <td className="px-6 py-4">
              <div className="font-semibold">{item.name}</div>
              {item.description && <div className="text-sm opacity-60 mt-1">{item.description}</div>}
            </td>
            <td className="px-6 py-4 text-right font-medium">{formatCurrency(item.unit_price, proposal.currency)}</td>
            <td className="px-6 py-4 text-right opacity-70">{item.quantity}</td>
            <td className="px-6 py-4 text-right font-bold">{formatCurrency(item.unit_price * item.quantity, proposal.currency)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot className="bg-muted font-bold">
        <tr>
          <td colSpan={3} className="px-6 py-4 text-right">Total Investment</td>
          <td className="px-6 py-4 text-right text-lg">{formatCurrency(proposal.total_amount, proposal.currency)}</td>
        </tr>
      </tfoot>
    </table>
  </div>
);

interface AcceptanceFormProps {
  condensed?: boolean;
  paymentMethod: 'card' | 'paypal';
  setPaymentMethod: (method: 'card' | 'paypal') => void;
  primaryColor: string;
  signedBy: string;
  setSignedBy: (value: string) => void;
  signature: string;
  setSignature: (value: string) => void;
  accepting: boolean;
  declining: boolean;
  handleAccept: () => void;
  showDeclineForm: boolean;
  setShowDeclineForm: (show: boolean) => void;
  declineReason: string;
  setDeclineReason: (value: string) => void;
  handleDecline: () => void;
}

const AcceptanceForm = ({
  condensed = false,
  paymentMethod,
  setPaymentMethod,
  primaryColor,
  signedBy,
  setSignedBy,
  signature,
  setSignature,
  accepting,
  declining,
  handleAccept,
  showDeclineForm,
  setShowDeclineForm,
  declineReason,
  setDeclineReason,
  handleDecline
}: AcceptanceFormProps) => (
  <div className={`space-y-6 ${condensed ? 'p-0' : ''}`}>
    {!condensed && (
      <div className="relative mb-8">
        <h3 className="text-xl font-bold tracking-tight mb-2">Accept Proposal</h3>
        <p className="opacity-70 font-medium text-sm leading-relaxed italic">"Excellence is never an accident. It is always the result of high intention."</p>
      </div>
    )}

    {/* Payment Selection */}
    <div className="space-y-3">
      <Label className="text-[12px] font-bold uppercase tracking-[0.2em] opacity-50 ml-1">Payment Method</Label>
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => setPaymentMethod('card')}
          className={`
            cursor-pointer rounded-xl border p-3 flex items-center justify-center gap-2 transition-all
            ${paymentMethod === 'card'
              ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2'
              : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'}
          `}
          style={paymentMethod === 'card' ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
        >
          <span className="text-xs font-bold uppercase tracking-wider">Credit Card</span>
        </div>
        <div
          onClick={() => setPaymentMethod('paypal')}
          className={`
            cursor-pointer rounded-xl border p-3 flex items-center justify-center gap-2 transition-all
            ${paymentMethod === 'paypal'
              ? 'bg-[#003087] border-[#003087] text-white shadow-md ring-2 ring-[#003087] ring-offset-2'
              : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'}
          `}
        >
          <span className="text-xs font-bold uppercase tracking-wider">PayPal</span>
        </div>
      </div>
    </div>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-[12px] font-bold uppercase tracking-[0.2em] opacity-50 ml-1">Full Name</Label>
        <Input
          value={signedBy}
          onChange={(e) => setSignedBy(e.target.value)}
          placeholder="Johnathan Doe"
          className="h-12 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 rounded-xl"
          disabled={accepting || declining}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-[12px] font-bold uppercase tracking-[0.2em] opacity-50 ml-1">Signature</Label>
        <Input
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="J. Doe"
          className="h-12 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 rounded-xl font-serif italic"
          disabled={accepting || declining}
        />
      </div>
    </div>

    <div className="flex flex-col gap-3 pt-4">
      <Button
        onClick={handleAccept}
        className="w-full h-14 text-base font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02]"
        style={{ backgroundColor: primaryColor }}
        disabled={accepting || !signedBy}
      >
        {accepting ? 'Processing...' : 'Confirm & Sign Proposal'}
        {!accepting && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>

      <Button
        onClick={() => setShowDeclineForm(!showDeclineForm)}
        variant="ghost"
        className="w-full h-10 text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100 hover:bg-red-50 hover:text-red-600"
      >
        Request Revision
      </Button>

      {showDeclineForm && (
        <div className="pt-4 space-y-4 animate-in slide-in-from-top-2">
          <Textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Reason for declining..."
            className="bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 min-h-[100px] rounded-xl"
          />
          <Button onClick={handleDecline} variant="destructive" className="w-full rounded-xl" disabled={!declineReason}>
            Submit Decline
          </Button>
        </div>
      )}
    </div>

    <div className="pt-6 flex items-center justify-center gap-2 opacity-40">
      <ShieldCheck className="h-4 w-4" />
      <span className="text-[12px] uppercase font-bold tracking-widest">Secure 256-bit SSL</span>
    </div>
  </div>
);

const PublicProposalView: React.FC = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [signature, setSignature] = useState('');
  const [signedBy, setSignedBy] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');

  useEffect(() => {
    if (!token) {
      toast.error('Invalid proposal link');
      navigate('/');
      return;
    }
    loadProposal();
  }, [token, navigate]);

  const loadProposal = async () => {
    try {
      setLoading(true);
      const response = await proposalApi.getPublicProposal(token!);
      setProposal(response);
    } catch (error) {
      console.error('Failed to load proposal:', error);
      toast.error('Proposal not found or expired');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!signedBy.trim()) {
      toast.error('Please enter your name');
      return;
    }
    try {
      setAccepting(true);
      await proposalApi.acceptProposal(token!, {
        signature: signature || undefined,
        signed_by: signedBy,
      });
      toast.success('Proposal accepted successfully!');
      loadProposal();
    } catch (error) {
      console.error('Failed to accept proposal:', error);
      toast.error('Failed to accept proposal');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      toast.error('Please provide a reason for declining');
      return;
    }
    try {
      setDeclining(true);
      await proposalApi.declineProposal(token!, { reason: declineReason });
      toast.success('Proposal declined');
      loadProposal();
    } catch (error) {
      console.error('Failed to decline proposal:', error);
      toast.error('Failed to decline proposal');
    } finally {
      setDeclining(false);
    }
  };

  const primaryColor = useMemo(() => proposal?.styling?.primary_color || '#4f46e5', [proposal]);
  const fontFamily = useMemo(() => proposal?.styling?.font_family || 'Inter, sans-serif', [proposal]);

  // Dynamically load Google Font
  useEffect(() => {
    const fontName = proposal?.styling?.font_family;
    if (fontName && fontName !== 'Inter' && !fontName.includes('sans-serif')) {
      const fontId = `proposal-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [proposal?.styling?.font_family]);


  // Determine Layout Mode
  const layoutMode = useMemo(() => {
    const style = proposal?.styling?.header_style || 'modern';
    if (['minimal', 'classic', 'formal'].includes(style)) return 'document';
    if (['artistic', 'bold'].includes(style)) return 'split';
    if (['technical'].includes(style)) return 'technical';
    return 'standard';
  }, [proposal]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-slate-500 font-medium animate-pulse">Preparing your premium proposal experience...</p>
      </div>
    );
  }

  if (!proposal) return null;

  const isAccepted = proposal.status === 'accepted';
  const isActionable = proposal.status === 'sent' || proposal.status === 'viewed';

  // --- LAYOUTS ---

  // 1. SPLIT LAYOUT (Artistic / Bold)
  if (layoutMode === 'split') {
    return (
      <div className="flex h-screen w-full bg-white dark:bg-slate-950 font-sans overflow-hidden" style={{ fontFamily }}>
        {/* Left Panel - Fixed */}
        <div className="hidden lg:flex w-[45%] relative flex-col justify-between p-12 text-white">
          <div className="absolute inset-0 z-0">
            {proposal.cover_image ? (
              <img src={proposal.cover_image} className="w-full h-full object-cover" alt="Cover" />
            ) : (
              <div className="w-full h-full" style={{ background: primaryColor }} />
            )}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-widest mb-8">
              <Layout className="h-3 w-3" />
              {proposal.category}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-6">{proposal.name}</h1>
            <div className="flex items-center gap-4 text-white/80">
              <User className="h-5 w-5" />
              <span className="text-lg">Prepared for <strong className="text-white">{proposal.client_name}</strong></span>
            </div>
          </div>

          <div className="relative z-10 space-y-8">
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/20">
              <div>
                <div className="text-xs uppercase tracking-widest text-white/60 mb-1">Total Value</div>
                <div className="text-2xl font-bold">{formatCurrency(proposal.total_amount, proposal.currency)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-white/60 mb-1">Valid Until</div>
                <div className="text-xl font-bold">{proposal.valid_until ? format(new Date(proposal.valid_until), 'MMM d, yyyy') : 'No Expiry'}</div>
              </div>
            </div>
            <div className="text-xs text-white/40 font-mono">
              PROPOSAL ID: {proposal.id.toString().padStart(6, '0')}
            </div>
          </div>
        </div>

        {/* Right Panel - Scrollable */}
        <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-slate-950">
          <div className="max-w-3xl mx-auto px-8 py-20 space-y-20">
            {/* Mobile Header */}
            <div className="lg:hidden mb-12">
              <Badge className="mb-4">{proposal.status}</Badge>
              <h1 className="text-2xl font-bold mb-4">{proposal.name}</h1>
            </div>

            {isAccepted && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 p-6 rounded-2xl flex items-center gap-4 border border-emerald-100 dark:border-emerald-800">
                <CheckCircle className="h-8 w-8" />
                <div>
                  <div className="font-bold text-lg">Proposal Accepted</div>
                  <div className="text-sm opacity-80">Confirmed by {proposal.signed_by} on {proposal.accepted_at ? format(new Date(proposal.accepted_at), 'PPP') : ''}</div>
                </div>
              </div>
            )}

            <SafeHTML html={proposal.content} className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-p:text-slate-600 dark:prose-p:text-slate-400" />

            <div className="space-y-12">
              {proposal.sections.map((section, i) => (
                <div key={i}>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-xl font-bold text-slate-100 dark:text-slate-800">0{i + 1}</span>
                    <h2 className="text-2xl font-bold">{section.title}</h2>
                  </div>
                  <SafeHTML html={section.content} className="prose prose-slate dark:prose-invert max-w-none" />
                </div>
              ))}
            </div>

            <div className="pt-8 border-t">
              <h2 className="text-2xl font-bold mb-8">Investment Breakdown</h2>
              <PricingTable proposal={proposal} />
            </div>

            {isActionable && !isAccepted ? (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-10 mt-12">
                <AcceptanceForm
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  primaryColor={primaryColor}
                  signedBy={signedBy}
                  setSignedBy={setSignedBy}
                  signature={signature}
                  setSignature={setSignature}
                  accepting={accepting}
                  declining={declining}
                  handleAccept={handleAccept}
                  showDeclineForm={showDeclineForm}
                  setShowDeclineForm={setShowDeclineForm}
                  declineReason={declineReason}
                  setDeclineReason={setDeclineReason}
                  handleDecline={handleDecline}
                />
              </div>
            ) : null}

            <div className="flex gap-4 pt-12 border-t">
              <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" /> Print Proposal
              </Button>
              <Button variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. DOCUMENT LAYOUT (Minimal / Classic / Formal)
  if (layoutMode === 'document') {
    return (
      <div className="min-h-screen bg-[#F0F0F0] dark:bg-slate-950 py-12 md:py-20 font-serif" style={{ fontFamily }}>
        <div className="max-w-[900px] mx-auto bg-white dark:bg-slate-900 shadow-2xl min-h-[1000px] relative">
          {/* Top Color Bar */}
          <div className="h-3 w-full" style={{ background: primaryColor }} />

          <div className="p-12 md:p-20 space-y-12">
            {/* Header */}
            <header className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-12">
              <div className="space-y-6">
                {proposal.company_name && (
                  <div className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">{proposal.company_name}</div>
                )}
                <h1 className="text-2xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{proposal.name}</h1>
                <div className="space-y-1 text-sm text-gray-500">
                  <div>Prepared for: <span className="text-gray-900 dark:text-gray-300 font-semibold">{proposal.client_name}</span></div>
                  <div>Date: {format(new Date(proposal.created_at), 'MMMM do, yyyy')}</div>
                </div>
              </div>
            </header>

            {isAccepted && (
              <div className="bg-green-50 text-green-800 p-4 border border-green-200 text-center font-medium">
                This document was officially accepted on {proposal.accepted_at ? format(new Date(proposal.accepted_at), 'PPP') : ''}.
              </div>
            )}

            {/* Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-serif prose-p:leading-loose">
              <SafeHTML html={proposal.content} />
            </div>

            {/* Sections */}
            <div className="space-y-12">
              {proposal.sections.map((section, i) => (
                <section key={i}>
                  <h3 className="text-2xl font-bold mb-6 pb-2 border-b border-gray-100 dark:border-gray-800">{section.title}</h3>
                  <SafeHTML html={section.content} className="prose prose-slate dark:prose-invert max-w-none" />
                </section>
              ))}
            </div>

            {/* Pricing */}
            <div className="pt-8">
              <h3 className="text-2xl font-bold mb-6 pb-2 border-b border-gray-100 dark:border-gray-800">Financial Summary</h3>
              <PricingTable proposal={proposal} />
            </div>

            {/* Terms & Acceptance */}
            <div className="mt-20 border-t-2 border-dashed border-gray-200 dark:border-gray-800 pt-12 break-inside-avoid">
              {isActionable && !isAccepted ? (
                <div className="max-w-md ml-auto">
                  <h4 className="font-bold text-lg mb-6">Authorization</h4>
                  <AcceptanceForm
                    condensed
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    primaryColor={primaryColor}
                    signedBy={signedBy}
                    setSignedBy={setSignedBy}
                    signature={signature}
                    setSignature={setSignature}
                    accepting={accepting}
                    declining={declining}
                    handleAccept={handleAccept}
                    showDeclineForm={showDeclineForm}
                    setShowDeclineForm={setShowDeclineForm}
                    declineReason={declineReason}
                    setDeclineReason={setDeclineReason}
                    handleDecline={handleDecline}
                  />
                </div>
              ) : (
                <div className="flex justify-between items-end opacity-50">
                  <div>
                    <div className="border-t border-black w-64 pt-2">Authorized Signature</div>
                  </div>
                  <div className="text-right">
                    {isAccepted && <div className="font-script text-2xl mb-2">{proposal.signature || proposal.signed_by}</div>}
                    <div className="border-t border-black w-40 pt-2">Date</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 3. TECHNICAL / STANDARD LAYOUT 
  // (Uses the robust modern layout for everything else, tailored with specific styles)
  const isTechnical = layoutMode === 'technical';

  return (
    <div className={`min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans selection:bg-indigo-100 selection:text-indigo-900 ${isTechnical ? 'dark' : ''}`} style={{ fontFamily }}>
      {/* Dynamic Hero Section */}
      <div className={`relative h-[45vh] min-h-[450px] w-full overflow-hidden ${isTechnical ? 'border-b border-green-900' : ''}`}>
        {proposal.cover_image && !isTechnical ? (
          <div className="absolute inset-0">
            <img
              src={proposal.cover_image}
              className="w-full h-full object-cover scale-105"
              alt="Background"
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
          </div>
        ) : (
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background: isTechnical
                ? '#0c0c0c'
                : `linear-gradient(135deg, ${primaryColor} 0%, #1e1b4b 100%)`,
              backgroundImage: isTechnical
                ? 'radial-gradient(#15803d 1px, transparent 1px)'
                : undefined,
              backgroundSize: isTechnical ? '20px 20px' : undefined
            }}
          />
        )}

        <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center items-start">
          <Badge className={`mb-6 bg-white/20 backdrop-blur-md text-white border-white/30 px-5 py-1.5 text-xs font-bold uppercase tracking-[0.2em] ${isTechnical ? 'font-mono text-green-400 border-green-800 bg-black/50' : ''}`}>
            {proposal.status}
          </Badge>
          <h1 className={`text-2xl md:text-4xl font-bold text-white max-w-4xl leading-[1.1] mb-6 drop-shadow-2xl ${isTechnical ? 'font-mono tracking-tighter' : ''}`}>
            {isTechnical && <span className="text-green-500 mr-4">{`>`}</span>}
            {proposal.name}
            {isTechnical && <span className="animate-pulse">_</span>}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-indigo-50/90 text-lg md:text-xl">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center ring-1 ring-white/20">
                <User className="h-5 w-5" />
              </div>
              <span>For <span className="text-white font-bold">{proposal.client_name}</span></span>
            </div>
          </div>
        </div>

        {/* Global Stats Overlay - Standard only */}
        {!isTechnical && (
          <div className="absolute bottom-0 left-0 right-0 py-8 px-6 bg-gradient-to-t from-black/60 to-transparent">
            <div className="max-w-7xl mx-auto flex flex-wrap gap-8">
              <div className="flex items-center gap-3 text-white">
                <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <div className="text-[12px] uppercase tracking-widest opacity-60">Total Value</div>
                  <div className="text-lg font-bold">{formatCurrency(proposal.total_amount, proposal.currency)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white">
                <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-indigo-300" />
                </div>
                <div>
                  <div className="text-[12px] uppercase tracking-widest opacity-60">Created Date</div>
                  <div className="text-lg font-bold">{format(new Date(proposal.created_at), 'MMM dd, yyyy')}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-12">

            {/* Status Banners */}
            {isAccepted && (
              <div className="bg-emerald-500 text-white rounded-[2rem] p-10 flex items-center gap-8 shadow-2xl shadow-emerald-500/30 animate-in fade-in zoom-in-95 duration-500">
                <div className="h-20 w-20 bg-white/20 rounded-3xl flex items-center justify-center shrink-0">
                  <CheckCircle className="h-12 w-12" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1 tracking-tight">Project Confirmed!</h2>
                  <p className="text-lg opacity-90 font-medium">This proposal was accepted by {proposal.signed_by} on {proposal.accepted_at ? format(new Date(proposal.accepted_at), 'MMMM dd, yyyy') : 'a very lucky day'}.</p>
                </div>
              </div>
            )}

            {/* Proposal Body */}
            <Card className={`rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden ${isTechnical ? 'font-mono border border-green-900 ring-1 ring-green-900/50 rounded-none' : ''}`}>
              <CardContent className="p-8 md:p-20 space-y-20">

                {/* Intro Content */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: primaryColor }} />
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Introduction</span>
                  </div>
                  <SafeHTML
                    html={proposal.content}
                    className="prose prose-2xl dark:prose-invert max-w-none prose-p:text-slate-600 prose-p:leading-relaxed prose-headings:font-bold prose-headings:tracking-tight"
                  />
                </section>

                {/* Sections */}
                {proposal.sections?.map((section, idx) => (
                  <section key={idx} className="space-y-8">
                    <div className="flex items-center gap-6">
                      <span className="text-xl font-bold text-slate-100 dark:text-slate-800 italic select-none">0{idx + 1}</span>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{section.title}</h2>
                    </div>
                    <SafeHTML
                      html={section.content}
                      className="prose prose-xl prose-slate dark:prose-invert max-w-none prose-p:text-slate-600 prose-p:leading-loose"
                    />
                  </section>
                ))}

                {/* Investment Table */}
                <section className="space-y-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: primaryColor }} />
                      <span className="text-xs font-bold uppercase tracking-[0.4em] text-slate-400">Investment</span>
                    </div>
                  </div>
                  <PricingTable proposal={proposal} />
                </section>
              </CardContent>
            </Card>
          </div>

          {/* Action Sidebar (Right) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-12 space-y-8">

              {/* Proposal Meta Card */}
              <Card className={`rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 p-10 overflow-hidden relative ${isTechnical ? 'rounded-none border-l-4 border-green-500' : ''}`}>
                <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
                <div className="relative space-y-8">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 scale-110">
                      {proposal.logo ? (
                        <img src={proposal.logo} className="w-10 h-10 object-contain" alt="Logo" />
                      ) : (
                        <FileTextIcon className="h-8 w-8" />
                      )}
                    </div>
                    <div>
                      <div className="text-[12px] font-bold uppercase tracking-widest text-slate-400 mb-1">Presented By</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-xl leading-tight">{proposal.company_name || 'Xordon Team'}</div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-slate-800">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Status</span>
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-bold px-4">{proposal.status}</Badge>
                    </div>
                    <div className="flex justify-between items-center px-2">
                      <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Proposal ID</span>
                      <span className="text-slate-900 dark:text-slate-100 font-bold">#{proposal.id.toString().padStart(4, '0')}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Acceptance Flow */}
              {isActionable ? (
                <Card className={`rounded-[2.5rem] border-none shadow-2xl bg-slate-950 text-white p-10 space-y-4 relative overflow-hidden group ${isTechnical ? 'rounded-none' : ''}`}>
                  {/* Decorative mesh gradient */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#4f46e5,transparent)]" />
                  </div>
                  <AcceptanceForm
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    primaryColor={primaryColor}
                    signedBy={signedBy}
                    setSignedBy={setSignedBy}
                    signature={signature}
                    setSignature={setSignature}
                    accepting={accepting}
                    declining={declining}
                    handleAccept={handleAccept}
                    showDeclineForm={showDeclineForm}
                    setShowDeclineForm={setShowDeclineForm}
                    declineReason={declineReason}
                    setDeclineReason={setDeclineReason}
                    handleDecline={handleDecline}
                  />
                </Card>
              ) : (
                <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 p-12 text-center flex flex-col items-center">
                  <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 ring-8 ring-slate-100/50 dark:ring-slate-800/50">
                    <Clock className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">Viewing Mode</h3>
                  <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-none px-6 py-1.5 uppercase font-bold tracking-widest mb-6">
                    {proposal.status}
                  </Badge>
                  <p className="text-sm text-slate-500 leading-[1.6] font-medium">
                    This document is marked as {proposal.status}. If you believe this is an error, please contact the sender directly.
                  </p>
                </Card>
              )}

              {/* Utility Panel */}
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 rounded-2xl h-14 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold uppercase tracking-widest text-xs hover:bg-slate-50 shadow-sm transition-all active:scale-95 text-slate-900 dark:text-slate-100">
                  <Download className="h-4 w-4 mr-3 text-indigo-500" />
                  PDF Download
                </Button>
                <Button variant="outline" className="rounded-2xl h-14 px-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 shadow-sm transition-all active:scale-95" onClick={() => window.print()}>
                  <Printer className="h-5 w-5 text-slate-400" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-900 py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
          <div className="flex items-center justify-center gap-4 opacity-30 select-none">
            <Layout className="h-8 w-8 text-indigo-600" />
            <span className="font-bold tracking-[0.6em] text-sm text-slate-900 dark:text-slate-100">XORDON PROPOSAL ENGINE</span>
          </div>
          <p className="text-xs text-slate-400 font-bold max-w-lg mx-auto leading-loose tracking-widest uppercase">
            Transforming business relationships through design-driven communication. Securely delivered by Xordon on behalf of {proposal.company_name || 'the sender'}.
          </p>
          <div className="pt-8 text-[12px] text-slate-300 font-medium">
            © 2026 {proposal.company_name || 'Xordon LLC'} • Privacy Protocol • Terms of Engagement
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicProposalView;