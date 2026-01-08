import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Building2, User, Phone, Mail, Globe, MapPin, Briefcase, CheckCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { getMyProProfile, getServices, registerPro, ServiceCategory, ServiceArea } from '@/services/leadMarketplaceApi';
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav';

export default function ProviderRegistration() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const [formData, setFormData] = useState({
    business_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    bio: '',
    website_url: '',
    years_in_business: '',
    license_number: '',
    selected_services: [] as number[],
    service_areas: [
      { city: '', region: '', postal_code: '', radius_km: 25 }
    ] as Partial<ServiceArea>[],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, servicesRes] = await Promise.all([
          getMyProProfile(),
          getServices({ parent_id: null })
        ]);

        if (servicesRes.data.success) {
          setServices(servicesRes.data.data);
        }

        if (profileRes.data.success && profileRes.data.registered) {
          setAlreadyRegistered(true);
        }
      } catch (error) {
        console.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.business_name.trim()) {
      toast.error('Business name is required');
      return;
    }
    if (formData.selected_services.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    setSubmitting(true);
    try {
      const res = await registerPro({
        business_name: formData.business_name,
        contact_name: formData.contact_name || undefined,
        contact_email: formData.contact_email || undefined,
        contact_phone: formData.contact_phone || undefined,
        bio: formData.bio || undefined,
        service_ids: formData.selected_services,
        service_areas: formData.service_areas.filter(a => a.city || a.postal_code),
      });

      if (res.data.success) {
        toast.success('Registration successful! You can now receive leads.');
        navigate('/lead-marketplace/preferences');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
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

  const addServiceArea = () => {
    setFormData(prev => ({
      ...prev,
      service_areas: [...prev.service_areas, { city: '', region: '', postal_code: '', radius_km: 25 }]
    }));
  };

  const removeServiceArea = (index: number) => {
    setFormData(prev => ({
      ...prev,
      service_areas: prev.service_areas.filter((_, i) => i !== index)
    }));
  };

  const updateServiceArea = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const areas = [...prev.service_areas];
      areas[index] = { ...areas[index], [field]: value };
      return { ...prev, service_areas: areas };
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <MarketplaceNav />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (alreadyRegistered) {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Already Registered</h2>
            <p className="text-muted-foreground mb-4">
              You're already registered as a service provider. Manage your settings in the preferences page.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate('/lead-marketplace/inbox')}>
                View Leads
              </Button>
              <Button onClick={() => navigate('/lead-marketplace/preferences')}>
                Manage Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-3xl">
      <MarketplaceNav />
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Become a Service Provider</h1>
        <p className="text-muted-foreground">Register to receive leads and grow your business</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Business Name *</Label>
              <Input
                placeholder="Your company name"
                value={formData.business_name}
                onChange={e => setFormData({ ...formData, business_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Name</Label>
                <Input
                  placeholder="Your name"
                  value={formData.contact_name}
                  onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Years in Business</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.years_in_business}
                  onChange={e => setFormData({ ...formData, years_in_business: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="contact@company.com"
                  value={formData.contact_email}
                  onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.contact_phone}
                  onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Website</Label>
              <Input
                type="url"
                placeholder="https://yourwebsite.com"
                value={formData.website_url}
                onChange={e => setFormData({ ...formData, website_url: e.target.value })}
              />
            </div>
            <div>
              <Label>License Number (if applicable)</Label>
              <Input
                placeholder="Professional license #"
                value={formData.license_number}
                onChange={e => setFormData({ ...formData, license_number: e.target.value })}
              />
            </div>
            <div>
              <Label>About Your Business</Label>
              <Textarea
                placeholder="Tell potential customers about your experience, specialties, and what makes you different..."
                rows={4}
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Services You Offer *
            </CardTitle>
            <CardDescription>Select all services you can provide</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {services.map(service => (
                <div
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${formData.selected_services.includes(service.id)
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
            {services.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No services available</p>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Service Areas
            </CardTitle>
            <CardDescription>Define where you provide services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.service_areas.map((area, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Area {index + 1}</Label>
                  {formData.service_areas.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeServiceArea(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">City</Label>
                    <Input
                      placeholder="City"
                      value={area.city || ''}
                      onChange={e => updateServiceArea(index, 'city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">State</Label>
                    <Input
                      placeholder="State"
                      value={area.region || ''}
                      onChange={e => updateServiceArea(index, 'region', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">ZIP Code</Label>
                    <Input
                      placeholder="ZIP"
                      value={area.postal_code || ''}
                      onChange={e => updateServiceArea(index, 'postal_code', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Service Radius (km)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={area.radius_km || 25}
                    onChange={e => updateServiceArea(index, 'radius_km', parseInt(e.target.value) || 25)}
                  />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addServiceArea}>
              <Plus className="h-4 w-4 mr-2" />
              Add Another Area
            </Button>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Registering...
            </>
          ) : (
            'Complete Registration'
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By registering, you agree to our Terms of Service and Provider Agreement.
          You'll need to add credits to your wallet to start receiving leads.
        </p>
      </form>
    </div>
  );
}
