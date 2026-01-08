import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle, Loader2, MapPin, Calendar, DollarSign, User, Phone, Mail, FileTextIcon } from 'lucide-react';
import { getServices, createLeadRequest, ServiceCategory } from '@/services/leadMarketplaceApi';

const timingOptions = [
  { value: 'asap', label: 'As soon as possible' },
  { value: 'within_24h', label: 'Within 24 hours' },
  { value: 'within_week', label: 'Within a week' },
  { value: 'flexible', label: 'Flexible / No rush' },
];

const propertyTypes = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'other', label: 'Other' },
];

export default function PublicLeadForm() {
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === '1' || searchParams.get('embed') === 'true';
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [leadId, setLeadId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    consumer_name: '',
    consumer_email: '',
    consumer_phone: '',
    city: '',
    region: '',
    postal_code: '',
    timing: 'flexible',
    budget_min: '',
    budget_max: '',
    property_type: '',
    title: '',
    description: '',
    selected_services: [] as number[],
    consent_contact: true,
  });

  const prefilled = useRef(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await getServices({ parent_id: null });
        if (res.data.success) {
          setServices(res.data.data);
        }
      } catch (error) {
        console.error('Failed to load services');
        toast.error('Failed to load services. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (prefilled.current) return;

    // Pre-fill from URL params (shareable links)
    const serviceId = searchParams.get('service');
    const title = searchParams.get('title');
    const city = searchParams.get('city');
    const region = searchParams.get('region');
    const postal = searchParams.get('postal_code');
    
    if (serviceId || title || city || region || postal) {
      setFormData(prev => ({
        ...prev,
        selected_services: serviceId ? [parseInt(serviceId)] : prev.selected_services,
        title: title ?? prev.title,
        city: city ?? prev.city,
        region: region ?? prev.region,
        postal_code: postal ?? prev.postal_code,
      }));
      prefilled.current = true;
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.selected_services.length === 0) {
      toast.error('Please select at least one service');
      return;
    }
    if (!formData.consumer_name && !formData.consumer_email && !formData.consumer_phone) {
      toast.error('Please provide at least one contact method');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createLeadRequest({
        consumer_name: formData.consumer_name || undefined,
        consumer_email: formData.consumer_email || undefined,
        consumer_phone: formData.consumer_phone || undefined,
        city: formData.city || undefined,
        region: formData.region || undefined,
        postal_code: formData.postal_code || undefined,
        timing: formData.timing,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
        property_type: formData.property_type || undefined,
        title: formData.title || undefined,
        description: formData.description || undefined,
        services: formData.selected_services.map(id => ({ service_id: id })),
        consent_contact: formData.consent_contact,
      });

      if (res.data.success) {
        setLeadId(res.data.data.id);
        setSubmitted(true);
        toast.success('Request submitted successfully!');
      }
    } catch (error: any) {
      console.error('Lead submission error:', error);
      const status = error.response?.status;
      const errorMsg = error.response?.data?.error;
      
      if (status === 400) {
        toast.error(errorMsg || 'Please check your input and try again.');
      } else if (status === 409) {
        toast.error('You recently submitted a similar request. Please wait 24 hours before submitting again.');
      } else if (status === 422) {
        toast.error(errorMsg || 'Invalid information provided. Please check your email and phone number.');
      } else if (status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.');
      } else if (status === 500) {
        toast.error('Server error. Please try again in a few moments or contact support.');
      } else {
        toast.error(errorMsg || 'Failed to submit request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleService = (id: number) => {
    setFormData(prev => ({
      ...prev,
      selected_services: prev.selected_services.includes(id)
        ? prev.selected_services.filter(s => s !== id)
        : [...prev.selected_services, id]
    }));
  };

  if (submitted) {
    return (
      <div className={isEmbed ? "p-4" : "min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4"}>
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
            <p className="text-muted-foreground mb-4">
              Your request has been sent to qualified professionals in your area. You should receive quotes soon.
            </p>
            <p className="text-sm text-muted-foreground">
              Reference #: {leadId}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={isEmbed ? "p-4" : "min-h-screen bg-gradient-to-b from-orange-50 to-white py-8 px-4"}>
      <div className={isEmbed ? "max-w-2xl mx-auto" : "max-w-2xl mx-auto"}>
        {!isEmbed && (
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Get Free Quotes</h1>
            <p className="text-muted-foreground">Tell us what you need and we'll connect you with top professionals</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="h-5 w-5" />
                What do you need?
              </CardTitle>
              <CardDescription>Select the services you're looking for</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {services.map(service => (
                    <div
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        formData.selected_services.includes(service.id)
                          ? 'border-primary bg-primary/5 ring-2 ring-primary'
                          : 'hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox checked={formData.selected_services.includes(service.id)} />
                        <span className="text-sm font-medium">{service.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {services.length === 0 && !loading && (
                <p className="text-center text-muted-foreground py-4">No services available</p>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="region">State/Region</Label>
                  <Input
                    id="region"
                    placeholder="Enter state"
                    value={formData.region}
                    onChange={e => setFormData({ ...formData, region: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="postal_code">ZIP/Postal Code</Label>
                <Input
                  id="postal_code"
                  placeholder="Enter ZIP code"
                  value={formData.postal_code}
                  onChange={e => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>When do you need this done?</Label>
                <Select value={formData.timing} onValueChange={v => setFormData({ ...formData, timing: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timingOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Property Type (optional)</Label>
                <Select value={formData.property_type} onValueChange={v => setFormData({ ...formData, property_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Budget Min ($)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.budget_min}
                    onChange={e => setFormData({ ...formData, budget_min: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Budget Max ($)</Label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={formData.budget_max}
                    onChange={e => setFormData({ ...formData, budget_max: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Project Title (optional)</Label>
                <Input
                  placeholder="Brief title for your project"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you need in detail..."
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Contact Information
              </CardTitle>
              <CardDescription>Professionals will use this to send you quotes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="consumer_name">Full Name</Label>
                <Input
                  id="consumer_name"
                  placeholder="Your name"
                  value={formData.consumer_name}
                  onChange={e => setFormData({ ...formData, consumer_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="consumer_email">Email Address</Label>
                <Input
                  id="consumer_email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.consumer_email}
                  onChange={e => setFormData({ ...formData, consumer_email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="consumer_phone">Phone Number</Label>
                <Input
                  id="consumer_phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.consumer_phone}
                  onChange={e => setFormData({ ...formData, consumer_phone: e.target.value })}
                />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="consent"
                  checked={formData.consent_contact}
                  onCheckedChange={v => setFormData({ ...formData, consent_contact: v as boolean })}
                />
                <label htmlFor="consent" className="text-sm text-muted-foreground">
                  I agree to be contacted by professionals regarding my request. I understand my information will be shared with matched service providers.
                </label>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Get Free Quotes'
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            By submitting, you agree to our Terms of Service and Privacy Policy.
            Your request will be sent to up to 3 qualified professionals.
          </p>
        </form>
      </div>
    </div>
  );
}

