import { useEffect, useState } from 'react';
import { CheckCircle, ExternalLink, Download, FileTextIcon, RefreshCw, Share2, Facebook, Twitter, Linkedin, Mail } from 'lucide-react';
import { Form } from './types';
import { cn } from '@/lib/utils';

interface ThankYouPreviewProps {
  form: Partial<Form>;
  onReset?: () => void; // Callback to reset form
}

export default function ThankYouPreview({ form, onReset }: ThankYouPreviewProps) {
  const designSettings = (form.settings as any)?.design || {};
  const settings = form.settings as any || {};
  const confirmationMessage = designSettings.successMessage || settings.confirmation_message || 'Thank you for your submission!';
  const additionalText = settings.additional_text || '';
  const showConfetti = designSettings.showConfetti || false;
  const redirectAfterSubmit = designSettings.redirectAfterSubmit || false;
  const redirectUrl = designSettings.redirectUrl || '';
  const redirectDelay = designSettings.redirectDelay || 3;
  const thankYouStyle = designSettings.thankYouStyle || 'default';
  const customTitle = settings.thankYouTitle || 'Success!';
  const downloadPdf = settings.download_pdf || false;
  const fillAgain = settings.fill_again || false;
  const submissionSummary = settings.submission_summary || false;
  const socialSharing = settings.social_sharing || false;

  // Design tokens
  const backgroundColor = designSettings.backgroundColor || '#ffffff';
  const backgroundImage = designSettings.backgroundImage || '';
  const backgroundType = designSettings.backgroundType || 'solid';
  const gradientStart = designSettings.gradientStart || '#2563eb';
  const gradientEnd = designSettings.gradientEnd || '#7c3aed';
  const gradientDirection = designSettings.gradientDirection || 'to-br';
  const primaryColor = designSettings.primaryColor || '#2563eb';
  const textColor = designSettings.textColor || '#1f2937';
  const questionColor = designSettings.questionColor || '#101828';
  const fontFamily = designSettings.fontFamily || 'Inter';
  const borderRadius = designSettings.borderRadius || 'medium';
  const shadow = designSettings.shadow || 'none';

  const borderRadiusMap: Record<string, string> = {
    none: '0px',
    small: '4px',
    medium: '8px',
    large: '16px',
    full: '9999px',
  };

  const shadowMap: Record<string, string> = {
    none: 'none',
    small: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    medium: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    large: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  };

  const gradientDirectionMap: Record<string, string> = {
    'to-t': 'to top',
    'to-tr': 'to top right',
    'to-r': 'to right',
    'to-br': 'to bottom right',
    'to-b': 'to bottom',
    'to-bl': 'to bottom left',
    'to-l': 'to left',
    'to-tl': 'to top left',
  };

  const getBackgroundStyle = (): string => {
    if (backgroundType === 'solid') {
      return backgroundColor;
    } else if (backgroundType === 'image' && backgroundImage) {
      return 'transparent';
    } else if (backgroundType === 'gradient') {
      const direction = gradientDirectionMap[gradientDirection] || 'to bottom right';
      return `linear-gradient(${direction}, ${gradientStart}, ${gradientEnd})`;
    }
    return backgroundColor;
  };

  const backgroundStyle: React.CSSProperties = {
    background: backgroundType === 'image' && backgroundImage ? `url(${backgroundImage})` : getBackgroundStyle(),
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    fontFamily,
    color: textColor,
  };

  const renderMinimalStyle = () => (
    <div className="max-w-lg w-full text-center space-y-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: `${primaryColor}20` }}>
        <CheckCircle className="w-6 h-6" style={{ color: primaryColor }} />
      </div>
      <h2 className="text-xl font-semibold" style={{ color: questionColor }}>{customTitle}</h2>
      <p className="text-base" style={{ color: textColor }}>{confirmationMessage}</p>
      {additionalText && <p className="text-sm opacity-70" style={{ color: textColor }}>{additionalText}</p>}
    </div>
  );

  const renderCelebrationStyle = () => (
    <div className="max-w-2xl w-full text-center space-y-6">
      <div className="flex justify-center">
        <div className="relative">
          <div className="rounded-full p-8 inline-flex animate-pulse" style={{ backgroundColor: `${primaryColor}20`, boxShadow: shadowMap[shadow] }}>
            <CheckCircle className="w-20 h-20" style={{ color: primaryColor }} />
          </div>
          <div className="absolute -top-2 -right-2 text-2xl animate-bounce">🎉</div>
          <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>✨</div>
        </div>
      </div>
      <h1 className="text-2xl font-bold" style={{ color: questionColor }}>{customTitle}</h1>
      <p className="text-xl" style={{ color: textColor }}>{confirmationMessage}</p>
      {additionalText && <p className="text-base opacity-70" style={{ color: textColor }}>{additionalText}</p>}
    </div>
  );

  const renderProfessionalStyle = () => (
    <div className="max-w-2xl w-full">
      <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6" style={{ borderTop: `4px solid ${primaryColor}` }}>
        <div className="flex items-center space-x-4">
          <div className="rounded-full p-4" style={{ backgroundColor: `${primaryColor}20` }}>
            <CheckCircle className="w-8 h-8" style={{ color: primaryColor }} />
          </div>
          <div className="flex-1 text-left">
            <h2 className="text-2xl font-bold" style={{ color: questionColor }}>{customTitle}</h2>
            <p className="text-sm opacity-70" style={{ color: textColor }}>Your submission has been received</p>
          </div>
        </div>
        <div className="border-t pt-4">
          <p className="text-base" style={{ color: textColor }}>{confirmationMessage}</p>
          {additionalText && <p className="text-sm mt-2 opacity-70" style={{ color: textColor }}>{additionalText}</p>}
        </div>
      </div>
    </div>
  );

  const renderDefaultStyle = () => (
    <div className="max-w-2xl w-full text-center space-y-6">
      <div className="flex justify-center">
        <div className="rounded-full p-6 inline-flex" style={{ backgroundColor: `${primaryColor}20`, boxShadow: shadowMap[shadow] }}>
          <CheckCircle className="w-16 h-16" style={{ color: primaryColor }} />
        </div>
      </div>
      <div className="space-y-3">
        <h1 className="text-2xl font-bold" style={{ color: questionColor, fontFamily }}>{customTitle}</h1>
        <p className="text-lg whitespace-pre-wrap" style={{ color: textColor, fontFamily }}>{confirmationMessage}</p>
        {additionalText && <p className="text-base opacity-70" style={{ color: textColor, fontFamily }}>{additionalText}</p>}
      </div>
    </div>
  );

  // Countdown timer for redirect
  const [countdown, setCountdown] = useState(redirectDelay);

  useEffect(() => {
    if (redirectAfterSubmit && redirectUrl) {
      setCountdown(redirectDelay);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // In preview mode, don't actually redirect
            // window.location.href = redirectUrl;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [redirectAfterSubmit, redirectUrl, redirectDelay]);

  // Social sharing functions
  const handleShare = (platform: string) => {
    const formUrl = window.location.href;
    const shareText = `Check out this form: ${form.title || 'Form'}`;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(formUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(formUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(formUrl)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(formUrl)}`;
        break;
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-8 overflow-y-auto" style={backgroundStyle}>
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                width: '8px',
                height: '8px',
                backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 5)],
                borderRadius: '50%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="w-full flex flex-col items-center space-y-6">
        {/* Render based on selected style */}
        {thankYouStyle === 'minimal' && renderMinimalStyle()}
        {thankYouStyle === 'celebration' && renderCelebrationStyle()}
        {thankYouStyle === 'professional' && renderProfessionalStyle()}
        {(thankYouStyle === 'default' || thankYouStyle === 'custom') && renderDefaultStyle()}

        {/* Redirect Notice */}
        {redirectAfterSubmit && redirectUrl && (
          <div
            className="p-4 rounded-lg border inline-block"
            style={{
              backgroundColor: `${primaryColor}10`,
              borderColor: `${primaryColor}40`,
              borderRadius: borderRadiusMap[borderRadius],
            }}
          >
            <div className="flex items-center gap-2 text-sm" style={{ color: textColor }}>
              <ExternalLink className="w-4 h-4" style={{ color: primaryColor }} />
              <span>Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...</span>
            </div>
            <p className="text-xs mt-1 opacity-70" style={{ color: textColor }}>
              {redirectUrl}
            </p>
          </div>
        )}

        {/* Optional Actions */}
        {(downloadPdf || fillAgain || submissionSummary || socialSharing) && (
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            {downloadPdf && (
              <button
                onClick={() => {
                  // TODO: Implement PDF generation
                  alert('PDF download will be available after form submission. This is a preview.');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
                style={{
                  backgroundColor: primaryColor,
                  color: '#ffffff',
                  borderRadius: borderRadiusMap[borderRadius],
                  boxShadow: shadowMap[shadow],
                }}
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            )}

            {fillAgain && (
              <button
                onClick={() => {
                  if (onReset) {
                    onReset();
                  } else {
                    window.location.reload();
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border transition-colors hover:bg-opacity-10"
                style={{
                  borderColor: primaryColor,
                  color: primaryColor,
                  borderRadius: borderRadiusMap[borderRadius],
                  backgroundColor: 'transparent',
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Fill Again
              </button>
            )}

            {submissionSummary && (
              <button
                onClick={() => {
                  // TODO: Implement submission summary view
                  alert('Submission summary will be available after form submission. This is a preview.');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border transition-colors hover:bg-opacity-10"
                style={{
                  borderColor: primaryColor,
                  color: primaryColor,
                  borderRadius: borderRadiusMap[borderRadius],
                  backgroundColor: 'transparent',
                }}
              >
                <FileTextIcon className="w-4 h-4" />
                View Summary
              </button>
            )}
          </div>
        )}

        {/* Social Sharing */}
        {socialSharing && (
          <div className="pt-6 mt-4 border-t" style={{ borderColor: `${primaryColor}20` }}>
            <p className="text-sm font-medium mb-3" style={{ color: textColor }}>Share this form:</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => handleShare('facebook')}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                style={{ color: '#1877f2' }}
                title="Share on Facebook"
              >
                <Facebook className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                style={{ color: '#1da1f2' }}
                title="Share on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                style={{ color: '#0a66c2' }}
                title="Share on LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('email')}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                style={{ color: primaryColor }}
                title="Share via Email"
              >
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


