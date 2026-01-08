import { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { webformsApi } from '@/services/webformsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { CheckCircle, Loader2, Lock, Calendar, Shield, RefreshCw, Download, FileTextIcon, Share2, Facebook, Twitter, Linkedin, Mail, ChevronDown, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { FieldRenderer } from '@/components/webforms/form-builder/FieldRenderer';

interface DesignSettings {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  questionColor?: string;
  borderColor?: string;
  buttonTextColor?: string;
  fontFamily?: string;
  questionFontSize?: number;
  descriptionFontSize?: number;
  borderRadius?: string;
  shadow?: string;
  formWidth?: number;
  fieldsSpacing?: number;
  show_field_numbers?: boolean;
  buttonText?: string;
  buttonPosition?: string;
  successMessage?: string;
  showConfetti?: boolean;
  redirectAfterSubmit?: boolean;
  redirectUrl?: string;
  redirectDelay?: number;
  customCSS?: string;
  [key: string]: any;
}

interface ConfirmationRule {
  id: string;
  field: string;
  operator: string;
  value: string;
  message: string;
  redirect_url?: string;
}

interface RuntimeLogicRule {
  id: string;
  name?: string;
  enabled: boolean;
  conditionLogic: 'all' | 'any';
  conditions: { fieldId: string; operator: string; value: string; caseInsensitive?: boolean; compareWithField?: boolean }[];
  actions: { type: string; target: string; value?: string; targets?: string[] }[];
  elseActions?: { type: string; target: string; value?: string; targets?: string[] }[];
  elseEnabled?: boolean;
}

const evaluateOperator = (operator: string, left: any, right: string) => {
  const leftStr = left === undefined || left === null ? '' : String(left);
  const rightStr = right ?? '';
  switch (operator) {
    case 'equals':
      return leftStr === rightStr;
    case 'not_equals':
      return leftStr !== rightStr;
    case 'contains':
      return leftStr.toLowerCase().includes(rightStr.toLowerCase());
    default:
      return false;
  }
};

const evaluateCondition = (
  condition: RuntimeLogicRule['conditions'][number],
  submissionData: Record<string, any>
) => {
  if (!condition?.fieldId) return false;

  const left = submissionData[condition.fieldId];
  const right = condition.compareWithField
    ? String(submissionData[condition.value] ?? '')
    : String(condition.value ?? '');

  const leftStr = left === undefined || left === null ? '' : String(left);
  const rightStr = right;

  const leftNormalized = condition.caseInsensitive ? leftStr.toLowerCase() : leftStr;
  const rightNormalized = condition.caseInsensitive ? rightStr.toLowerCase() : rightStr;

  return evaluateOperator(condition.operator, leftNormalized, rightNormalized);
};

const getHiddenFieldIdsFromLogic = (
  rules: RuntimeLogicRule[] | undefined,
  submissionData: Record<string, any>
) => {
  const hidden = new Set<string>();
  if (!Array.isArray(rules) || rules.length === 0) return hidden;

  for (const rule of rules) {
    if (!rule?.enabled) continue;
    const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];
    const matches =
      conditions.length === 0
        ? false
        : rule.conditionLogic === 'any'
          ? conditions.some((c) => evaluateCondition(c, submissionData))
          : conditions.every((c) => evaluateCondition(c, submissionData));

    const actionsToApply =
      matches
        ? (Array.isArray(rule.actions) ? rule.actions : [])
        : (rule.elseEnabled && Array.isArray(rule.elseActions) ? rule.elseActions : []);

    for (const action of actionsToApply) {
      const targetId = action?.target ? String(action.target) : '';
      if (!targetId) continue;

      if (action.type === 'hide_field') {
        hidden.add(targetId);
      }

      if (action.type === 'show_field') {
        hidden.delete(targetId);
      }
    }
  }

  return hidden;
};

const pickConfirmationOverride = (
  rules: ConfirmationRule[] | undefined,
  submissionData: Record<string, any>
) => {
  if (!Array.isArray(rules) || rules.length === 0) return null;
  for (const rule of rules) {
    if (!rule || !rule.field) continue;
    const left = submissionData[rule.field];
    if (evaluateOperator(rule.operator, left, rule.value)) {
      return rule;
    }
  }
  return null;
};

export default function PublicWebFormSubmit() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [successOverride, setSuccessOverride] = useState<{ message?: string; redirectUrl?: string } | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [honeypotValue, setHoneypotValue] = useState('');

  // Fetch form
  const { data: formResponse, isLoading, error } = useQuery({
    queryKey: ['public-webform', id],
    queryFn: () => webformsApi.getPublicForm(id!),
    enabled: !!id,
  });

  const form = formResponse?.data;
  const fields = form?.fields || [];
  const settings = (form?.settings || {}) as Record<string, any>;
  const design: DesignSettings = settings.design || {};
  const isEmbedMode = searchParams.get('embed') === 'true';

  // Load draft from localStorage if autosave is enabled
  useEffect(() => {
    if (settings.auto_save && id) {
      const draftKey = `webform_draft_${id}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData(parsed);
          toast.info('Draft restored');
        } catch (e) {
          console.error('Failed to parse draft', e);
        }
      }
    }
  }, [id, settings.auto_save]);

  // Auto-save draft
  useEffect(() => {
    if (settings.auto_save && id && Object.keys(formData).length > 0) {
      const draftKey = `webform_draft_${id}`;
      const timer = setTimeout(() => {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, id, settings.auto_save]);

  // Check duplicate submission prevention
  const hasSubmittedBefore = useMemo(() => {
    if (!settings.prevent_duplicates || !id) return false;
    const submittedKey = `webform_submitted_${id}`;
    return localStorage.getItem(submittedKey) === 'true';
  }, [id, settings.prevent_duplicates]);

  // Check scheduling
  const isFormScheduled = useMemo(() => {
    if (settings.start_date) {
      const startDate = new Date(settings.start_date);
      if (new Date() < startDate) {
        return { allowed: false, reason: 'not_yet_open', date: startDate };
      }
    }
    if (settings.enable_expiry && settings.expiry_date) {
      const expiryDate = new Date(settings.expiry_date);
      if (new Date() > expiryDate) {
        return { allowed: false, reason: 'expired', date: expiryDate };
      }
    }
    return { allowed: true };
  }, [settings.start_date, settings.enable_expiry, settings.expiry_date]);

  // Check response limits
  const isLimitReached = useMemo(() => {
    if (settings.limit_responses && settings.max_responses !== undefined) {
      const currentCount = form?.submission_count || 0;
      return currentCount >= settings.max_responses;
    }
    return false;
  }, [form?.submission_count, settings.limit_responses, settings.max_responses]);

  // Check if login is required
  const requiresLogin = settings.require_login && !user;

  // Check password protection
  const requiresPassword = settings.enable_password && !passwordVerified;

  // Check CAPTCHA
  const requiresCaptcha = settings.enable_captcha && !captchaVerified;

  const pages = useMemo(() => {
    const result: any[][] = [[]];
    let pageIdx = 0;
    fields.forEach((f: any) => {
      const type = f.type || f.field_type;
      if (type === 'page_break') {
        pageIdx++;
        result[pageIdx] = [];
      } else {
        result[pageIdx].push(f);
      }
    });
    return result;
  }, [fields]);

  const multiStepStyle = settings.multiStepStyle || 'pagination';

  const currentFields = useMemo(() => {
    if (form?.type !== 'multi_step' || multiStepStyle === 'accordion') return fields;
    return pages[currentPage] || [];
  }, [form?.type, fields, pages, currentPage, multiStepStyle]);

  const [expandedSteps, setExpandedSteps] = useState<number[]>([0]);

  const toggleStep = (index: number) => {
    if (settings.allowMultipleExpand) {
      setExpandedSteps(prev =>
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
    } else {
      setExpandedSteps(prev => prev.includes(index) ? [] : [index]);
    }
  };

  const isLastPage = currentPage === pages.length - 1;
  const isFirstPage = currentPage === 0;

  const handleNextPage = () => {
    // Basic validation for current page
    const requiredInCurrentPage = currentFields.filter((f: any) => f.required && !hiddenFieldIds.has(String(f.id)));
    for (const field of requiredInCurrentPage) {
      if (!formData[field.id] && formData[field.id] !== 0) {
        toast.error(`Please fill in "${field.label}"`);
        return;
      }
    }
    setCurrentPage(prev => Math.min(prev + 1, pages.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hiddenFieldIds = useMemo(() => {
    const runtimeRules = settings.logic_rules as RuntimeLogicRule[] | undefined;
    return getHiddenFieldIdsFromLogic(runtimeRules, formData);
  }, [settings, formData]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return webformsApi.submitForm(id!, data);
    },
    onSuccess: () => {
      const confirmationRules = settings.confirmation_rules as ConfirmationRule[] | undefined;
      const override = pickConfirmationOverride(confirmationRules, formData);
      setSuccessOverride({
        message: override?.message,
        redirectUrl: override?.redirect_url,
      });
      setSubmitted(true);
      if (design.showConfetti) {
        // Could add confetti animation here
      }
      const shouldRedirect =
        (design.redirectAfterSubmit && !!design.redirectUrl) ||
        (!!override?.redirect_url);
      const redirectUrl = override?.redirect_url || design.redirectUrl;

      if (shouldRedirect && redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, (design.redirectDelay || 3) * 1000);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit form');
    },
  });

  // Get border radius value
  const getBorderRadius = (radius?: string) => {
    switch (radius) {
      case 'none': return '0px';
      case 'small': return '4px';
      case 'medium': return '8px';
      case 'large': return '12px';
      case 'full': return '9999px';
      default: return '8px';
    }
  };

  // Get shadow value
  const getShadow = (shadow?: string) => {
    switch (shadow) {
      case 'none': return 'none';
      case 'small': return '0 1px 2px 0 rgb(0 0 0 / 0.05)';
      case 'medium': return '0 4px 6px -1px rgb(0 0 0 / 0.1)';
      case 'large': return '0 10px 15px -3px rgb(0 0 0 / 0.1)';
      default: return 'none';
    }
  };

  // Compute styles from design settings
  const containerStyle = useMemo(() => ({
    backgroundColor: design.backgroundColor || '#ffffff',
    fontFamily: design.fontFamily || 'Inter, sans-serif',
    minHeight: '100vh',
  }), [design]);

  const formStyle = useMemo(() => ({
    maxWidth: `${design.formWidth || 600}px`,
    margin: '0 auto',
    padding: isEmbedMode ? '16px 16px' : '40px 24px',
  }), [design]);

  const cardStyle = useMemo(() => ({
    backgroundColor: '#ffffff',
    borderRadius: getBorderRadius(design.borderRadius),
    boxShadow: getShadow(design.shadow),
    border: `1px solid ${design.borderColor || '#e5e7eb'}`,
    padding: '32px',
  }), [design]);

  const labelStyle = useMemo(() => ({
    color: design.questionColor || design.textColor || '#1f2937',
    fontSize: `${design.questionFontSize || 16}px`,
    fontWeight: 500,
  }), [design]);

  const inputStyle = useMemo(() => ({
    borderColor: design.borderColor || '#d1d5db',
    borderRadius: getBorderRadius(design.borderRadius),
    color: design.textColor || '#1f2937',
  }), [design]);

  const buttonStyle = useMemo(() => ({
    backgroundColor: design.primaryColor || '#2563eb',
    color: design.buttonTextColor || '#ffffff',
    borderRadius: getBorderRadius(design.borderRadius),
  }), [design]);

  const [hasStarted, setHasStarted] = useState(false);

  const handleInputChange = (fieldId: string | number, value: any) => {
    if (!hasStarted && id) {
      setHasStarted(true);
      webformsApi.trackFormStart(id).catch(() => { });
    }
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check
    if (settings.enable_honeypot && honeypotValue) {
      toast.error('Spam detected');
      return;
    }

    // CAPTCHA check
    if (requiresCaptcha) {
      toast.error('Please complete the CAPTCHA');
      return;
    }

    // Collect email validation
    if (settings.collect_email) {
      const hasEmailField = fields.some((f: any) => (f.type || f.field_type) === 'email');
      const emailValue = hasEmailField ? Object.values(formData).find((v: any) => typeof v === 'string' && v.includes('@')) : null;
      if (!emailValue) {
        toast.error('Email address is required');
        return;
      }
    }

    // Basic validation
    const requiredFields = fields.filter((f: any) => f.required && !hiddenFieldIds.has(String(f.id)));
    for (const field of requiredFields) {
      if (!formData[field.id] && formData[field.id] !== 0) {
        toast.error(`Please fill in "${field.label}"`);
        return;
      }
    }

    // Mark as submitted for duplicate prevention
    if (settings.prevent_duplicates && id) {
      localStorage.setItem(`webform_submitted_${id}`, 'true');
    }

    // Clear draft after successful submission
    if (settings.auto_save && id) {
      localStorage.removeItem(`webform_draft_${id}`);
    }

    submitMutation.mutate(formData);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Error state
  if (error || !form) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Form not found</h2>
          <p className="text-gray-500">This form may have been deleted or is no longer available.</p>
        </div>
      </div>
    );
  }

  // Check if form is published
  if (form.status !== 'published') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Ban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Form not available</h2>
          <p className="text-gray-500">This form is not currently accepting responses.</p>
        </div>
      </div>
    );
  }

  // Check duplicate submission
  if (hasSubmittedBefore) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Already Submitted</h2>
          <p className="text-gray-500">You have already submitted this form.</p>
        </div>
      </div>
    );
  }

  // Check limits
  if (isLimitReached) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Ban className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Limit Reached</h2>
          <p className="text-gray-500">This form is no longer accepting responses.</p>
        </div>
      </div>
    );
  }

  // Check scheduling
  if (!isFormScheduled.allowed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isFormScheduled.reason === 'not_yet_open' ? 'Form Not Yet Open' : 'Form Closed'}
          </h2>
          <p className="text-gray-500">
            {isFormScheduled.reason === 'not_yet_open'
              ? `This form will open on ${isFormScheduled.date?.toLocaleDateString()}`
              : `This form closed on ${isFormScheduled.date?.toLocaleDateString()}`}
          </p>
        </div>
      </div>
    );
  }

  // Check response limits
  if (isLimitReached) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <Ban className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Limit Reached</h2>
          <p className="text-gray-500">This form has reached its maximum number of submissions and is no longer accepting responses.</p>
        </div>
      </div>
    );
  }

  // Check duplicate submission
  if (hasSubmittedBefore) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Already Submitted</h2>
          <p className="text-gray-500">You have already submitted this form. Multiple submissions are not allowed.</p>
        </div>
      </div>
    );
  }

  // Check login requirement
  if (requiresLogin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <Lock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-500 mb-4">You must be logged in to access this form.</p>
          <Button onClick={() => window.location.href = '/auth'}>Go to Login</Button>
        </div>
      </div>
    );
  }

  // Check password protection
  if (requiresPassword) {
    const handlePasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (passwordInput === settings.password) {
        setPasswordVerified(true);
        toast.success('Access granted');
      } else {
        toast.error('Incorrect password');
      }
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Password Protected</h2>
          <p className="text-gray-500 mb-6 text-center">Enter the password to access this form.</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password"
              className="w-full"
              autoFocus
            />
            <Button type="submit" className="w-full">
              Submit
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    const replaceVariables = (text: string) => {
      let result = text;
      // Replace field variables
      Object.entries(formData).forEach(([fieldId, value]) => {
        const field = fields.find((f: any) => String(f.id) === String(fieldId));
        if (field) {
          const label = field.label.toLowerCase().replace(/\s+/g, '_');
          result = result.replace(new RegExp(`{{${label}}}`, 'g'), String(value));
          result = result.replace(new RegExp(`{{${fieldId}}}`, 'g'), String(value));
        }
      });
      // Replace common variables
      result = result.replace(/{{form_title}}/g, form?.title || '');
      result = result.replace(/{{submission_id}}/g, String((submitMutation.data as any)?.submission_id || ''));
      result = result.replace(/{{submission_date}}/g, new Date().toLocaleDateString());
      return result;
    };

    const rawConfirmationMessage =
      successOverride?.message ||
      design.successMessage ||
      (settings as any).confirmation_message ||
      'Thank you for your submission!';

    const confirmationMessage = replaceVariables(rawConfirmationMessage);

    const additionalText = settings.additional_text || '';
    const redirectUrl = successOverride?.redirectUrl || design.redirectUrl;
    const showRedirectNotice =
      ((design.redirectAfterSubmit && !!design.redirectUrl) || !!successOverride?.redirectUrl) && !!redirectUrl;
    const customTitle = settings.thankYouTitle || 'Success!';
    const downloadPdf = settings.download_pdf || false;
    const fillAgain = settings.fill_again || false;
    const submissionSummary = settings.submission_summary || false;
    const socialSharing = settings.social_sharing || false;

    const handleFillAgain = () => {
      setFormData({});
      setSubmitted(false);
      setCurrentPage(0);
      if (settings.prevent_duplicates && id) {
        localStorage.removeItem(`webform_submitted_${id}`);
      }
      toast.success('Form reset - you can submit again');
    };

    const handleDownloadPdf = () => {
      toast.info('PDF download feature coming soon');
    };

    const handleViewSummary = () => {
      toast.info('Submission summary feature coming soon');
    };

    const handleShare = (platform: string) => {
      const formUrl = window.location.href;
      const text = encodeURIComponent(`Check out this form: ${form?.title}`);
      const url = encodeURIComponent(formUrl);

      const shareUrls: Record<string, string> = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        email: `mailto:?subject=${text}&body=${url}`
      };

      if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      }
    };

    return (
      <div style={containerStyle}>
        <div style={formStyle}>
          <div style={cardStyle} className="text-center">
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${design.primaryColor || '#2563eb'}20` }}
              >
                <CheckCircle
                  className="h-8 w-8"
                  style={{ color: design.primaryColor || '#2563eb' }}
                />
              </div>
            </div>
            <h2
              className="text-2xl font-semibold mb-2"
              style={{ color: design.textColor || '#1f2937' }}
            >
              {customTitle}
            </h2>
            <p
              className="text-lg mb-2"
              style={{ color: design.textColor || '#6b7280' }}
            >
              {confirmationMessage}
            </p>
            {additionalText && (
              <p
                className="text-sm opacity-70"
                style={{ color: design.textColor || '#6b7280' }}
              >
                {additionalText}
              </p>
            )}

            {showRedirectNotice && (
              <div
                className="mt-4 p-3 rounded-lg border inline-block"
                style={{
                  backgroundColor: `${design.primaryColor || '#2563eb'}10`,
                  borderColor: `${design.primaryColor || '#2563eb'}40`
                }}
              >
                <p className="text-sm" style={{ color: design.textColor || '#6b7280' }}>
                  Redirecting in {design.redirectDelay || 3} seconds...
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {(downloadPdf || fillAgain || submissionSummary) && (
              <div className="flex flex-wrap gap-3 justify-center mt-6">
                {downloadPdf && (
                  <Button
                    onClick={handleDownloadPdf}
                    style={{
                      backgroundColor: design.primaryColor || '#2563eb',
                      color: '#ffffff'
                    }}
                    className="inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                )}

                {fillAgain && (
                  <Button
                    onClick={handleFillAgain}
                    variant="outline"
                    style={{
                      borderColor: design.primaryColor || '#2563eb',
                      color: design.primaryColor || '#2563eb'
                    }}
                    className="inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Fill Again
                  </Button>
                )}

                {submissionSummary && (
                  <Button
                    onClick={handleViewSummary}
                    variant="outline"
                    style={{
                      borderColor: design.primaryColor || '#2563eb',
                      color: design.primaryColor || '#2563eb'
                    }}
                    className="inline-flex items-center gap-2"
                  >
                    <FileTextIcon className="w-4 h-4" />
                    View Summary
                  </Button>
                )}
              </div>
            )}

            {/* Social Sharing */}
            {socialSharing && (
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm font-medium mb-3" style={{ color: design.textColor || '#6b7280' }}>
                  Share this form:
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => handleShare('facebook')}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    style={{ color: '#1877f2' }}
                  >
                    <Facebook className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    style={{ color: '#1da1f2' }}
                  >
                    <Twitter className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    style={{ color: '#0a66c2' }}
                  >
                    <Linkedin className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleShare('email')}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    style={{ color: design.primaryColor || '#2563eb' }}
                  >
                    <Mail className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render field based on type
  const renderField = (field: any, index: number) => {
    const fieldId = String(field.id);

    // Skip fields hidden by logic rules
    if (hiddenFieldIds.has(fieldId)) return null;

    return (
      <FieldRenderer
        key={field.id}
        field={field as any}
        value={formData[field.id]}
        onChange={(value) => handleInputChange(field.id, value)}
        allValues={formData}
        onFieldChange={handleInputChange}
        designSettings={design}
        showLabel={true}
        showDescription={true}
        fieldNumber={(design.show_field_numbers || settings.show_field_numbers) ? index + 1 : undefined}
      />
    );
  };

  // Filter out non-input fields for numbering
  const inputFields = fields.filter((f: any) => {
    const ft = f.type || f.field_type;
    return !['page_break', 'section', 'divider', 'spacer'].includes(ft) && !hiddenFieldIds.has(String(f.id));
  });

  // Get button alignment
  const getButtonAlignment = () => {
    switch (design.buttonPosition) {
      case 'center': return 'center';
      case 'right': return 'flex-end';
      case 'full': return 'stretch';
      default: return 'flex-start';
    }
  };

  return (
    <div style={containerStyle}>
      {/* Inject custom CSS if provided */}
      {(design.customCSS || settings.custom_css) && (
        <style dangerouslySetInnerHTML={{ __html: design.customCSS || settings.custom_css }} />
      )}

      {/* Inject custom JavaScript if provided */}
      {settings.custom_scripts && (
        <script dangerouslySetInnerHTML={{ __html: settings.custom_scripts }} />
      )}

      {/* Google Analytics */}
      {settings.google_analytics && settings.ga_tracking_id && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${settings.ga_tracking_id}`} />
          <script dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${settings.ga_tracking_id}');
            `
          }} />
        </>
      )}

      {/* Facebook Pixel */}
      {settings.facebook_pixel && settings.fb_pixel_id && (
        <script dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${settings.fb_pixel_id}');
            fbq('track', 'PageView');
          `
        }} />
      )}

      {/* Google Tag Manager */}
      {settings.google_tag_manager && settings.gtm_container_id && (
        <script dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${settings.gtm_container_id}');
          `
        }} />
      )}

      <div className={cn(
        "transition-all duration-300",
        settings.mobile_optimized !== false && "max-sm:px-4 max-sm:py-4"
      )} style={formStyle}>
        <div style={cardStyle}>
          {/* Wizard Stepper */}
          {form.type === 'multi_step' && multiStepStyle === 'one-step-at-a-time' && (
            <div className="mb-8 overflow-x-auto">
              <div className="flex items-center justify-between min-w-[300px] px-2">
                {pages.map((_, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 relative">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all z-10",
                        currentPage === idx ? "bg-primary text-white scale-110 shadow-lg" :
                          currentPage > idx ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                      )}
                      style={{ backgroundColor: currentPage === idx ? (design.primaryColor || '#2563eb') : (currentPage > idx ? '#10b981' : '#e5e7eb') }}
                    >
                      {currentPage > idx ? "✓" : idx + 1}
                    </div>
                    <span className="text-[12px] mt-2 font-medium text-gray-400">Step {idx + 1}</span>
                    {idx < pages.length - 1 && (
                      <div className="absolute top-4 left-[50%] w-full h-[2px] bg-gray-100 -z-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Header */}
          <div className="mb-6">
            <h1
              className="text-2xl font-semibold mb-2"
              style={{ color: design.questionColor || design.textColor || '#1f2937' }}
            >
              {form.title}
            </h1>
            {form.description && (
              <p
                style={{ color: design.textColor || '#6b7280', fontSize: `${design.descriptionFontSize || 14}px` }}
              >
                {form.description}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {(design.showProgressBar || settings.show_progress_bar) && form.type === 'multi_step' && (
            <div className="mb-6">
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: design.secondaryColor || '#e5e7eb' }}
              >
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${Math.round((currentPage + 1) / Math.max(1, fields.filter((f: any) => (f.type || f.field_type) === 'page_break').length + 1) * 100)}%`,
                    backgroundColor: design.primaryColor || '#2563eb'
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Step {currentPage + 1} of {fields.filter((f: any) => (f.type || f.field_type) === 'page_break').length + 1}
              </p>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit}>
            {form.type === 'multi_step' && multiStepStyle === 'accordion' ? (
              <div className="space-y-4">
                {pages.map((pageFields, pageIdx) => (
                  <div key={pageIdx} className="border rounded-lg overflow-hidden" style={{ borderColor: design.borderColor || '#e5e7eb' }}>
                    <button
                      type="button"
                      onClick={() => toggleStep(pageIdx)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      style={{ backgroundColor: expandedSteps.includes(pageIdx) ? (design.backgroundColor || '#f9fafb') : '#ffffff' }}
                    >
                      <h3 className="font-semibold text-left" style={{ color: design.questionColor || design.textColor || '#1f2937' }}>
                        Step {pageIdx + 1}: {pageFields.find(f => (f.type || f.field_type) === 'heading' || (f.type || f.field_type) === 'section')?.label || `Page ${pageIdx + 1}`}
                      </h3>
                      <div className={cn("transition-transform", expandedSteps.includes(pageIdx) ? "rotate-180" : "")}>
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </div>
                    </button>
                    {expandedSteps.includes(pageIdx) && (
                      <div className="px-6 py-6 border-t" style={{ borderColor: design.borderColor || '#e5e7eb' }}>
                        <div className="space-y-4">
                          {pageFields.map((field, fIdx) => renderField(field, fields.indexOf(field)))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              currentFields.map((field: any, index: number) => renderField(field, fields.indexOf(field)))
            )}

            {/* Honeypot field (hidden) */}
            {settings.enable_honeypot && (
              <input
                type="text"
                name="website"
                value={honeypotValue}
                onChange={(e) => setHoneypotValue(e.target.value)}
                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
                tabIndex={-1}
                autoComplete="off"
              />
            )}

            {/* CAPTCHA placeholder */}
            {settings.enable_captcha && !captchaVerified && (
              <div className="my-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">CAPTCHA Verification</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">Please verify you are human</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCaptchaVerified(true);
                    toast.success('CAPTCHA verified');
                  }}
                >
                  Verify (Demo)
                </Button>
              </div>
            )}

            {/* GDPR Compliance */}
            {settings.gdpr_compliant && (
              <div className="my-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      type="checkbox"
                      required
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer"
                      style={{ accentColor: design.primaryColor || '#2563eb' }}
                    />
                  </div>
                  <div className="text-sm">
                    <p style={{ color: design.textColor || '#374151' }} className="font-medium">
                      I agree to the processing of my personal data
                    </p>
                    <p style={{ color: design.textColor || '#6b7280' }} className="text-xs mt-0.5">
                      By submitting this form, you acknowledge that the information provided will be processed in accordance with our privacy policy and GDPR requirements.
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <div
              className="mt-8 flex gap-3"
              style={{ justifyContent: getButtonAlignment() }}
            >
              {form.type === 'multi_step' && multiStepStyle === 'pagination' && !isFirstPage && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevPage}
                  style={{
                    borderColor: design.primaryColor || '#2563eb',
                    color: design.primaryColor || '#2563eb',
                    borderRadius: getBorderRadius(design.borderRadius),
                  }}
                  className="px-6 py-2"
                >
                  Back
                </Button>
              )}

              {form.type === 'multi_step' && multiStepStyle === 'pagination' && !isLastPage ? (
                <Button
                  type="button"
                  onClick={handleNextPage}
                  style={{
                    ...buttonStyle,
                    width: design.buttonPosition === 'full' ? '100%' : 'auto',
                  }}
                  className="px-6 py-2"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  style={{
                    ...buttonStyle,
                    width: design.buttonPosition === 'full' ? '100%' : 'auto',
                  }}
                  className="px-6 py-2"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    design.buttonText || 'Submit'
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Powered by footer (unless removed) */}
        {!isEmbedMode && !design.removeBranding && (
          <div className="text-center mt-6 text-sm text-gray-400">
            Powered by <a href="https://xordon.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">Xordon</a>
          </div>
        )}
      </div>
    </div>
  );
}
