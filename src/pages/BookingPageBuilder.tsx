import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Eye, Link as LinkIcon, Plus, Trash2, Settings, GripVertical } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import bookingPagesApi, { BookingPage } from '../services/bookingPagesApi';
import { servicesApi } from '../services/bookingApi';

export default function BookingPageBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<any[]>([]);

  const [formData, setFormData] = useState<Partial<BookingPage>>({
    title: '',
    slug: '',
    description: '',
    source: 'native',
    is_active: true,
    native_config: {
      service_ids: [],
      staff_mode: 'round_robin',
      min_notice_hours: 1,
      max_advance_days: 60,
    },
    source_config: {
      embed_url: '',
    },
    form_schema: {
      fields: [
        { name: 'guest_name', label: 'Name', type: 'text', required: true },
        { name: 'guest_email', label: 'Email', type: 'email', required: true },
        { name: 'guest_phone', label: 'Phone', type: 'tel', required: false },
        { name: 'notes', label: 'Notes', type: 'textarea', required: false },
      ],
    },
    branding: {
      primary_color: '#6366f1',
      hero_text: 'Schedule a time with us',
      success_message: 'Your appointment has been booked!',
      logo_url: '',
      redirect_url: '',
    },
    payment_config: {
      requires_payment: false,
      provider: 'stripe',
      amount_type: 'service_price',
    },
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const servicesData = await servicesApi.list().catch(() => []);
      setServices(Array.isArray(servicesData) ? servicesData : []);

      if (isEdit && id) {
        const page = await bookingPagesApi.get(parseInt(id));
        setFormData(page);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };


  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const addField = () => {
    const newField = {
      name: `custom_${Date.now()}`,
      label: 'New Field',
      type: 'text' as const,
      required: false,
    };
    setFormData(prev => ({
      ...prev,
      form_schema: {
        ...prev.form_schema,
        fields: [...(prev.form_schema?.fields || []), newField]
      }
    }));
  };

  const removeField = (index: number) => {
    if (confirm('Are you sure you want to remove this field?')) {
      setFormData(prev => ({
        ...prev,
        form_schema: {
          ...prev.form_schema,
          fields: (prev.form_schema?.fields || []).filter((_, i) => i !== index)
        }
      }));
    }
  };

  const updateField = (index: number, updates: any) => {
    setFormData(prev => {
      const fields = [...(prev.form_schema?.fields || [])];
      fields[index] = { ...fields[index], ...updates };
      return {
        ...prev,
        form_schema: { ...prev.form_schema, fields }
      };
    });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug) {
      toast.error('Title and slug are required');
      return;
    }

    try {
      setSaving(true);
      if (isEdit && id) {
        await bookingPagesApi.update(parseInt(id), formData);
        toast.success('Booking page updated');
      } else {
        const created = await bookingPagesApi.create(formData);
        toast.success('Booking page created');
        navigate(`/scheduling/booking-pages/${created.id}`);
      }
    } catch (error: any) {
      toast.error('Failed to save booking page');
    } finally {
      setSaving(false);
    }
  };
  const previewUrl = formData.slug ? bookingPagesApi.getPublicUrl(formData.slug) : '';
  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/scheduling/booking-pages')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEdit ? 'Edit Booking Page' : 'New Booking Page'}
            </h1>
            {previewUrl && (
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <LinkIcon className="h-3 w-3" />
                <code className="bg-gray-100 px-2 py-0.5 rounded">{previewUrl}</code>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {previewUrl && (
            <Button variant="outline" onClick={() => window.open(previewUrl, '_blank')}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="source">Source</TabsTrigger>
          <TabsTrigger value="form">Form Fields</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g., Book a Consultation"
                />
              </div>
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., consultation"
                />
                <p className="text-xs text-gray-500">
                  Your page will be available at: {window.location.origin}/book/{formData.slug || 'your-slug'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this booking page is for..."
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-gray-500">Make this page publicly accessible</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="source" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Source Type</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value: any) => setFormData({ ...formData, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="native">Native (Built-in Scheduler)</SelectItem>
                    <SelectItem value="calendly">Calendly</SelectItem>
                    <SelectItem value="acuity">Acuity Scheduling</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.source === 'native' && (
                <>
                  <div className="space-y-2">
                    <Label>Services</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {(services || []).map((service) => (
                        <div key={service.id} className="flex items-center space-x-2 border p-2 rounded hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            const currentIds = formData.native_config?.service_ids || [];
                            const newIds = currentIds.includes(service.id)
                              ? currentIds.filter(id => id !== service.id)
                              : [...currentIds, service.id];
                            setFormData({
                              ...formData,
                              native_config: {
                                ...formData.native_config,
                                service_ids: newIds
                              }
                            });
                          }}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                            checked={formData.native_config?.service_ids?.includes(service.id) || false}
                            onChange={() => { }} // Handled by div onClick
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{service.name}</div>
                            {service.duration_minutes && (
                              <div className="text-xs text-gray-500">{service.duration_minutes} min • ${service.price}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {(!services || services.length === 0) && (
                      <p className="text-sm text-amber-600">No services found. Please create services in the Services section first.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Staff Assignment</Label>
                    <Select
                      value={formData.native_config?.staff_mode || 'round_robin'}
                      onValueChange={(value: any) =>
                        setFormData({
                          ...formData,
                          native_config: { ...formData.native_config, staff_mode: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round_robin">Round Robin (Auto-assign)</SelectItem>
                        <SelectItem value="per_staff">Let customer choose staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min. Notice (Hours)</Label>
                      <Input
                        type="number"
                        value={formData.native_config?.min_notice_hours || 1}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            native_config: { ...formData.native_config, min_notice_hours: parseInt(e.target.value) },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max. Advance (Days)</Label>
                      <Input
                        type="number"
                        value={formData.native_config?.max_advance_days || 60}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            native_config: { ...formData.native_config, max_advance_days: parseInt(e.target.value) },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Buffer Before (Mins)</Label>
                      <Input
                        type="number"
                        value={formData.native_config?.buffer_before || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            native_config: { ...formData.native_config, buffer_before: parseInt(e.target.value) },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Buffer After (Mins)</Label>
                      <Input
                        type="number"
                        value={formData.native_config?.buffer_after || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            native_config: { ...formData.native_config, buffer_after: parseInt(e.target.value) },
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {(formData.source === 'calendly' || formData.source === 'acuity') && (
                <div className="space-y-2">
                  <Label>Embed URL</Label>
                  <Input
                    value={formData.source_config?.embed_url || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        source_config: { ...formData.source_config, embed_url: e.target.value },
                      })
                    }
                    placeholder={
                      formData.source === 'calendly'
                        ? 'https://calendly.com/your-link'
                        : 'https://acuityscheduling.com/schedule.php?owner=...'
                    }
                  />
                  <p className="text-xs text-gray-500">
                    {formData.source === 'calendly'
                      ? 'Get your Calendly scheduling link from your account'
                      : 'Get your Acuity scheduling page URL from your account'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Form Fields</CardTitle>
              <Button size="sm" onClick={addField}>
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Define the information you want to collect from customers during booking.
              </p>
              <div className="space-y-3">
                {(formData.form_schema?.fields || []).map((field, index) => (
                  <div key={index} className="flex flex-col gap-3 p-4 border rounded-lg bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                        <span className="font-medium">Field {index + 1}: {field.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => updateField(index, { type: value })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="tel">Phone</SelectItem>
                            <SelectItem value="textarea">Multi-line Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end h-full pb-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`required-${index}`}
                            checked={field.required}
                            onCheckedChange={(checked) => updateField(index, { required: checked })}
                          />
                          <Label htmlFor={`required-${index}`} className="text-xs">Required</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branding & Customization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.branding?.primary_color || '#6366f1'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branding: { ...formData.branding, primary_color: e.target.value },
                      })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.branding?.primary_color || '#6366f1'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branding: { ...formData.branding, primary_color: e.target.value },
                      })
                    }
                    placeholder="#6366f1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Hero Text</Label>
                <Input
                  value={formData.branding?.hero_text || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branding: { ...formData.branding, hero_text: e.target.value },
                    })
                  }
                  placeholder="Schedule a time with us"
                />
              </div>
              <div className="space-y-2">
                <Label>Success Message</Label>
                <Textarea
                  value={formData.branding?.success_message || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branding: { ...formData.branding, success_message: e.target.value },
                    })
                  }
                  placeholder="Your appointment has been booked!"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  value={formData.branding?.logo_url || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branding: { ...formData.branding, logo_url: e.target.value },
                    })
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Success Redirect URL</Label>
                <Input
                  value={formData.branding?.redirect_url || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branding: { ...formData.branding, redirect_url: e.target.value },
                    })
                  }
                  placeholder="https://your-website.com/thanks"
                />
                <p className="text-xs text-gray-500">Redirect customers after successful booking (optional)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Payment</Label>
                  <p className="text-xs text-gray-500">Collect payment when booking</p>
                </div>
                <Switch
                  checked={formData.payment_config?.requires_payment || false}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      payment_config: { ...formData.payment_config, requires_payment: checked },
                    })
                  }
                />
              </div>
              {formData.payment_config?.requires_payment && (
                <>
                  <div className="space-y-2">
                    <Label>Payment Provider</Label>
                    <Select
                      value={formData.payment_config?.provider || 'stripe'}
                      onValueChange={(value: any) =>
                        setFormData({
                          ...formData,
                          payment_config: { ...formData.payment_config, provider: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount Type</Label>
                    <Select
                      value={formData.payment_config?.amount_type || 'service_price'}
                      onValueChange={(value: any) =>
                        setFormData({
                          ...formData,
                          payment_config: { ...formData.payment_config, amount_type: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="service_price">Use Service Price</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.payment_config?.amount_type === 'fixed' && (
                    <div className="space-y-2">
                      <Label>Fixed Amount ($)</Label>
                      <Input
                        type="number"
                        value={formData.payment_config?.fixed_amount || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            payment_config: {
                              ...formData.payment_config,
                              fixed_amount: parseFloat(e.target.value),
                            },
                          })
                        }
                        placeholder="50.00"
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
