import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FieldPalette from '@/components/webforms/form-builder/FieldPalette';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Upload, Trash2, Palette, Type, Layout, Settings2, Globe, Image } from 'lucide-react';
import { SectionStyles, PageSettings } from '@/lib/landingPagesApi';

interface StyleInspectorProps {
  sectionStyles?: SectionStyles;
  pageSettings?: PageSettings;
  sectionContent?: any;
  sectionType?: string;
  onUpdateSectionStyles: (styles: Partial<SectionStyles>) => void;
  onUpdateSectionContent: (content: any) => void;
  onUpdatePageSettings: (settings: Partial<PageSettings>) => void;
  onImageUpload: (file: File) => Promise<{ url: string; filename: string; size: number; type: string }>;
}

export const StyleInspector: React.FC<StyleInspectorProps> = ({
  sectionStyles,
  pageSettings,
  sectionContent,
  sectionType,
  onUpdateSectionStyles,
  onUpdateSectionContent,
  onUpdatePageSettings,
  onImageUpload,
}) => {
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const result = await onImageUpload(file);
        onUpdateSectionStyles({
          backgroundImage: result.url,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        });
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  };

  const removeBackgroundImage = () => {
    onUpdateSectionStyles({
      backgroundImage: undefined,
    });
  };

  return (
    <div className="w-80 h-full bg-background border-l overflow-y-auto">
      <div className="p-4 space-y-6">
        {sectionStyles && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Section Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="styles">Styles</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                  {/* Text Content Controls */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Text Content</Label>

                    <div className="space-y-2">
                      <Label htmlFor="section-title" className="text-xs">Title</Label>
                      <Input
                        id="section-title"
                        value={sectionContent?.title || ''}
                        onChange={(e) => onUpdateSectionContent({
                          ...sectionContent,
                          title: e.target.value
                        })}
                        placeholder="Section title..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="section-subtitle" className="text-xs">Subtitle</Label>
                      <textarea
                        id="section-subtitle"
                        className="w-full min-h-[60px] px-3 py-2 text-sm border rounded-md resize-none"
                        value={sectionContent?.subtitle || ''}
                        onChange={(e) => onUpdateSectionContent({
                          ...sectionContent,
                          subtitle: e.target.value
                        })}
                        placeholder="Section subtitle..."
                      />
                    </div>

                    {/* CTA Button Controls */}
                    {(sectionType === 'hero' || sectionType === 'cta') && (
                      <div className="space-y-2">
                        <Label htmlFor="cta-text" className="text-xs">Button Text</Label>
                        <Input
                          id="cta-text"
                          value={sectionContent?.ctaText || ''}
                          onChange={(e) => onUpdateSectionContent({
                            ...sectionContent,
                            ctaText: e.target.value
                          })}
                          placeholder="Button text..."
                        />

                        <Label htmlFor="secondary-button" className="text-xs">Secondary Button (Optional)</Label>
                        <Input
                          id="secondary-button"
                          value={sectionContent?.secondaryButton || ''}
                          onChange={(e) => onUpdateSectionContent({
                            ...sectionContent,
                            secondaryButton: e.target.value
                          })}
                          placeholder="Secondary button text..."
                        />
                      </div>
                    )}

                    {/* Description Controls */}
                    {sectionType !== 'hero' && sectionType !== 'cta' && (
                      <div className="space-y-2">
                        <Label htmlFor="section-description" className="text-xs">Description</Label>
                        <textarea
                          id="section-description"
                          className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md resize-none"
                          value={sectionContent?.description || ''}
                          onChange={(e) => onUpdateSectionContent({
                            ...sectionContent,
                            description: e.target.value
                          })}
                          placeholder="Section description..."
                        />
                      </div>
                    )}

                    {/* Features Controls */}
                    {sectionType === 'features' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Features</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newItem = {
                                id: Date.now().toString(),
                                title: 'New Feature',
                                desc: 'Feature description',
                                icon: 'Star'
                              };
                              onUpdateSectionContent({
                                ...sectionContent,
                                items: [...(sectionContent?.items || []), newItem]
                              });
                            }}
                          >
                            Add Feature
                          </Button>
                        </div>

                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {sectionContent?.items?.map((item: any, index: number) => (
                            <div key={item.id || index} className="p-2 border rounded space-y-1 bg-muted/20">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">Feature {index + 1}</Label>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    const items = sectionContent?.items?.filter((_: any, i: number) => i !== index);
                                    onUpdateSectionContent({ ...sectionContent, items });
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <Input
                                value={item.title || ''}
                                onChange={(e) => {
                                  const items = [...(sectionContent?.items || [])];
                                  items[index] = { ...items[index], title: e.target.value };
                                  onUpdateSectionContent({ ...sectionContent, items });
                                }}
                                placeholder="Title"
                                className="text-xs"
                              />
                              <Input
                                value={item.desc || ''}
                                onChange={(e) => {
                                  const items = [...(sectionContent?.items || [])];
                                  items[index] = { ...items[index], desc: e.target.value };
                                  onUpdateSectionContent({ ...sectionContent, items });
                                }}
                                placeholder="Description"
                                className="text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Testimonials Controls */}
                    {(sectionType === 'testimonials' || sectionType === 'testimonials-grid') && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Testimonials</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newItem = {
                                text: 'Great service!',
                                name: 'New Client',
                                role: 'Customer',
                                rating: 5
                              };
                              const key = sectionType === 'testimonials' ? 'quotes' : 'testimonials';
                              onUpdateSectionContent({
                                ...sectionContent,
                                [key]: [...(sectionContent?.[key] || []), newItem]
                              });
                            }}
                          >
                            Add Testimonial
                          </Button>
                        </div>

                        <div className="space-y-4 max-h-60 overflow-y-auto">
                          {(sectionContent?.quotes || sectionContent?.testimonials)?.map((item: any, index: number) => (
                            <div key={index} className="p-3 border rounded space-y-2 bg-muted/20">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">Testimonial {index + 1}</Label>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    const key = sectionType === 'testimonials' ? 'quotes' : 'testimonials';
                                    const list = sectionContent?.[key]?.filter((_: any, i: number) => i !== index);
                                    onUpdateSectionContent({ ...sectionContent, [key]: list });
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <textarea
                                className="w-full min-h-[60px] px-2 py-1 text-xs border rounded resize-none"
                                value={item.text || ''}
                                onChange={(e) => {
                                  const key = sectionType === 'testimonials' ? 'quotes' : 'testimonials';
                                  const list = [...(sectionContent?.[key] || [])];
                                  list[index] = { ...list[index], text: e.target.value };
                                  onUpdateSectionContent({ ...sectionContent, [key]: list });
                                }}
                                placeholder="Testimonial text"
                              />
                              <div className="flex gap-2">
                                <Input
                                  value={item.name || ''}
                                  onChange={(e) => {
                                    const key = sectionType === 'testimonials' ? 'quotes' : 'testimonials';
                                    const list = [...(sectionContent?.[key] || [])];
                                    list[index] = { ...list[index], name: e.target.value };
                                    onUpdateSectionContent({ ...sectionContent, [key]: list });
                                  }}
                                  placeholder="Name"
                                  className="text-xs flex-1"
                                />
                                <Input
                                  value={item.role || ''}
                                  onChange={(e) => {
                                    const key = sectionType === 'testimonials' ? 'quotes' : 'testimonials';
                                    const list = [...(sectionContent?.[key] || [])];
                                    list[index] = { ...list[index], role: e.target.value };
                                    onUpdateSectionContent({ ...sectionContent, [key]: list });
                                  }}
                                  placeholder="Role"
                                  className="text-xs flex-1"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Team Controls */}
                    {sectionType === 'team' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Team Members</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newItem = {
                                name: 'New Member',
                                role: 'Role',
                                bio: 'Bio'
                              };
                              onUpdateSectionContent({
                                ...sectionContent,
                                members: [...(sectionContent?.members || []), newItem]
                              });
                            }}
                          >
                            Add Member
                          </Button>
                        </div>

                        <div className="space-y-4 max-h-60 overflow-y-auto">
                          {sectionContent?.members?.map((item: any, index: number) => (
                            <div key={index} className="p-3 border rounded space-y-2 bg-muted/20">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">Member {index + 1}</Label>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    const members = sectionContent?.members?.filter((_: any, i: number) => i !== index);
                                    onUpdateSectionContent({ ...sectionContent, members });
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <Input
                                value={item.name || ''}
                                onChange={(e) => {
                                  const members = [...(sectionContent?.members || [])];
                                  members[index] = { ...members[index], name: e.target.value };
                                  onUpdateSectionContent({ ...sectionContent, members });
                                }}
                                placeholder="Name"
                                className="text-xs"
                              />
                              <Input
                                value={item.role || ''}
                                onChange={(e) => {
                                  const members = [...(sectionContent?.members || [])];
                                  members[index] = { ...members[index], role: e.target.value };
                                  onUpdateSectionContent({ ...sectionContent, members });
                                }}
                                placeholder="Role"
                                className="text-xs"
                              />
                              <textarea
                                className="w-full min-h-[40px] px-2 py-1 text-xs border rounded resize-none"
                                value={item.bio || ''}
                                onChange={(e) => {
                                  const members = [...(sectionContent?.members || [])];
                                  members[index] = { ...members[index], bio: e.target.value };
                                  onUpdateSectionContent({ ...sectionContent, members });
                                }}
                                placeholder="Bio"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Services Controls */}
                    {sectionType === 'services' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Services</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newItem = {
                                title: 'New Service',
                                desc: 'Description',
                                price: 'Contact for price'
                              };
                              onUpdateSectionContent({
                                ...sectionContent,
                                services: [...(sectionContent?.services || []), newItem]
                              });
                            }}
                          >
                            Add Service
                          </Button>
                        </div>

                        <div className="space-y-4 max-h-60 overflow-y-auto">
                          {sectionContent?.services?.map((item: any, index: number) => (
                            <div key={index} className="p-3 border rounded space-y-2 bg-muted/20">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">Service {index + 1}</Label>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    const services = sectionContent?.services?.filter((_: any, i: number) => i !== index);
                                    onUpdateSectionContent({ ...sectionContent, services });
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <Input
                                value={item.title || ''}
                                onChange={(e) => {
                                  const services = [...(sectionContent?.services || [])];
                                  services[index] = { ...services[index], title: e.target.value };
                                  onUpdateSectionContent({ ...sectionContent, services });
                                }}
                                placeholder="Service Title"
                                className="text-xs"
                              />
                              <textarea
                                className="w-full min-h-[40px] px-2 py-1 text-xs border rounded resize-none"
                                value={item.desc || ''}
                                onChange={(e) => {
                                  const services = [...(sectionContent?.services || [])];
                                  services[index] = { ...services[index], desc: e.target.value };
                                  onUpdateSectionContent({ ...sectionContent, services });
                                }}
                                placeholder="Description"
                              />
                              <Input
                                value={item.price || ''}
                                onChange={(e) => {
                                  const services = [...(sectionContent?.services || [])];
                                  services[index] = { ...services[index], price: e.target.value };
                                  onUpdateSectionContent({ ...sectionContent, services });
                                }}
                                placeholder="Price"
                                className="text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pricing Plans Controls */}
                    {sectionType === 'pricing' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Pricing Plans</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newPlan = {
                                name: 'New Plan',
                                price: '$0',
                                period: '/month',
                                features: ['Feature 1', 'Feature 2'],
                                highlighted: false,
                                ctaText: 'Get Started'
                              };
                              onUpdateSectionContent({
                                ...sectionContent,
                                plans: [...(sectionContent?.plans || []), newPlan]
                              });
                            }}
                          >
                            Add Plan
                          </Button>
                        </div>

                        <div className="space-y-4 max-h-60 overflow-y-auto">
                          {sectionContent?.plans?.map((plan: any, index: number) => (
                            <div key={index} className="p-3 border rounded space-y-2 bg-muted/20">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">Plan {index + 1}</Label>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    const plans = sectionContent?.plans?.filter((_: any, i: number) => i !== index);
                                    onUpdateSectionContent({ ...sectionContent, plans });
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <Input
                                value={plan.name || ''}
                                onChange={(e) => {
                                  const plans = [...(sectionContent?.plans || [])];
                                  plans[index] = { ...plans[index], name: e.target.value };
                                  onUpdateSectionContent({ ...sectionContent, plans });
                                }}
                                placeholder="Plan Name"
                                className="text-xs"
                              />
                              <div className="flex gap-2">
                                <Input
                                  value={plan.price || ''}
                                  onChange={(e) => {
                                    const plans = [...(sectionContent?.plans || [])];
                                    plans[index] = { ...plans[index], price: e.target.value };
                                    onUpdateSectionContent({ ...sectionContent, plans });
                                  }}
                                  placeholder="Price"
                                  className="text-xs flex-1"
                                />
                                <Input
                                  value={plan.period || ''}
                                  onChange={(e) => {
                                    const plans = [...(sectionContent?.plans || [])];
                                    plans[index] = { ...plans[index], period: e.target.value };
                                    onUpdateSectionContent({ ...sectionContent, plans });
                                  }}
                                  placeholder="/period"
                                  className="text-xs w-20"
                                />
                              </div>
                              <textarea
                                className="w-full min-h-[60px] px-2 py-1 text-xs border rounded resize-none"
                                value={plan.features?.join('\n') || ''}
                                onChange={(e) => {
                                  const features = e.target.value.split('\n').filter(f => f.trim());
                                  const plans = [...(sectionContent?.plans || [])];
                                  plans[index] = { ...plans[index], features };
                                  onUpdateSectionContent({ ...sectionContent, plans });
                                }}
                                placeholder="Features (one per line)"
                              />
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={plan.highlighted || false}
                                  onCheckedChange={(checked) => {
                                    const plans = [...(sectionContent?.plans || [])];
                                    plans[index] = { ...plans[index], highlighted: checked };
                                    onUpdateSectionContent({ ...sectionContent, plans });
                                  }}
                                />
                                <span className="text-xs">Highlight Plan</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* FAQ Controls */}
                    {sectionType === 'faq' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Questions</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newFaq = { q: 'New Question', a: 'Answer here' };
                              onUpdateSectionContent({
                                ...sectionContent,
                                faqs: [...(sectionContent?.faqs || []), newFaq]
                              });
                            }}
                          >
                            Add FAQ
                          </Button>
                        </div>

                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {sectionContent?.faqs?.map((faq: any, index: number) => (
                            <div key={index} className="p-3 border rounded space-y-2 bg-muted/20">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">Q{index + 1}</Label>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    const faqs = sectionContent?.faqs?.filter((_: any, i: number) => i !== index);
                                    onUpdateSectionContent({ ...sectionContent, faqs });
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <Input
                                value={faq.q || ''}
                                onChange={(e) => {
                                  const faqs = [...(sectionContent?.faqs || [])];
                                  faqs[index] = { ...faqs[index], q: e.target.value };
                                  onUpdateSectionContent({ ...sectionContent, faqs });
                                }}
                                placeholder="Question"
                                className="text-xs font-medium"
                              />
                              <textarea
                                className="w-full min-h-[60px] px-2 py-1 text-xs border rounded resize-none"
                                value={faq.a || ''}
                                onChange={(e) => {
                                  const faqs = [...(sectionContent?.faqs || [])];
                                  faqs[index] = { ...faqs[index], a: e.target.value };
                                  onUpdateSectionContent({ ...sectionContent, faqs });
                                }}
                                placeholder="Answer"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stats Controls */}
                    {sectionType === 'stats' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Statistics</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newStat = { number: '100+', label: 'Label' };
                              onUpdateSectionContent({
                                ...sectionContent,
                                stats: [...(sectionContent?.stats || []), newStat]
                              });
                            }}
                          >
                            Add Stat
                          </Button>
                        </div>

                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {sectionContent?.stats?.map((stat: any, index: number) => (
                            <div key={index} className="p-2 border rounded space-y-2 bg-muted/20">
                              <div className="flex items-center justify-between gap-2">
                                <Input
                                  value={stat.number || ''}
                                  onChange={(e) => {
                                    const stats = [...(sectionContent?.stats || [])];
                                    stats[index] = { ...stats[index], number: e.target.value };
                                    onUpdateSectionContent({ ...sectionContent, stats });
                                  }}
                                  placeholder="Value (e.g. 500+)"
                                  className="text-xs flex-1"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    const stats = sectionContent?.stats?.filter((_: any, i: number) => i !== index);
                                    onUpdateSectionContent({ ...sectionContent, stats });
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <Input
                                value={stat.label || ''}
                                onChange={(e) => {
                                  const stats = [...(sectionContent?.stats || [])];
                                  stats[index] = { ...stats[index], label: e.target.value };
                                  onUpdateSectionContent({ ...sectionContent, stats });
                                }}
                                placeholder="Label"
                                className="text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Gallery Controls */}
                    {sectionType === 'gallery' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Images</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => document.getElementById('gallery-upload')?.click()}
                          >
                            Add Image
                          </Button>
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={async (e) => {
                              if (e.target.files) {
                                const newImages = [];
                                for (let i = 0; i < e.target.files.length; i++) {
                                  try {
                                    const result = await onImageUpload(e.target.files[i]);
                                    newImages.push({
                                      url: result.url,
                                      caption: 'New Image',
                                      category: 'All'
                                    });
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }
                                onUpdateSectionContent({
                                  ...sectionContent,
                                  images: [...(sectionContent?.images || []), ...newImages]
                                });
                              }
                            }}
                            className="hidden"
                            id="gallery-upload"
                          />
                        </div>

                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {sectionContent?.images?.map((img: any, index: number) => (
                            <div key={index} className="p-2 border rounded space-y-2 relative group bg-muted/20">
                              <div className="flex gap-2">
                                <div className="h-16 w-16 bg-muted rounded overflow-hidden flex-shrink-0">
                                  {img.url ? (
                                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                      <Image className="h-4 w-4" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <Input
                                    value={img.caption || ''}
                                    onChange={(e) => {
                                      const images = [...(sectionContent?.images || [])];
                                      images[index] = { ...images[index], caption: e.target.value };
                                      onUpdateSectionContent({ ...sectionContent, images });
                                    }}
                                    placeholder="Caption"
                                    className="text-xs h-7"
                                  />
                                  <Input
                                    value={img.category || ''}
                                    onChange={(e) => {
                                      const images = [...(sectionContent?.images || [])];
                                      images[index] = { ...images[index], category: e.target.value };
                                      onUpdateSectionContent({ ...sectionContent, images });
                                    }}
                                    placeholder="Category"
                                    className="text-xs h-7"
                                  />
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  const images = sectionContent?.images?.filter((_: any, i: number) => i !== index);
                                  onUpdateSectionContent({ ...sectionContent, images });
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Process Steps Controls */}
                    {sectionType === 'process' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Process Steps</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newStep = {
                                number: (sectionContent?.steps?.length + 1).toString(),
                                title: 'New Step',
                                desc: 'Step description',
                                icon: 'CheckCircle'
                              };
                              onUpdateSectionContent({
                                ...sectionContent,
                                steps: [...(sectionContent?.steps || []), newStep]
                              });
                            }}
                          >
                            Add Step
                          </Button>
                        </div>

                        <div className="space-y-4 max-h-60 overflow-y-auto">
                          {sectionContent?.steps?.map((step: any, index: number) => (
                            <div key={index} className="p-3 border rounded space-y-2 bg-muted/20">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">Step {index + 1}</Label>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    const steps = sectionContent?.steps?.filter((_: any, i: number) => i !== index);
                                    onUpdateSectionContent({ ...sectionContent, steps });
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  value={step.number || ''}
                                  onChange={(e) => {
                                    const steps = [...(sectionContent?.steps || [])];
                                    steps[index] = { ...steps[index], number: e.target.value };
                                    onUpdateSectionContent({ ...sectionContent, steps });
                                  }}
                                  placeholder="#"
                                  className="text-xs w-12"
                                />
                                <Input
                                  value={step.title || ''}
                                  onChange={(e) => {
                                    const steps = [...(sectionContent?.steps || [])];
                                    steps[index] = { ...steps[index], title: e.target.value };
                                    onUpdateSectionContent({ ...sectionContent, steps });
                                  }}
                                  placeholder="Step Title"
                                  className="text-xs flex-1"
                                />
                              </div>
                              <textarea
                                className="w-full min-h-[60px] px-2 py-1 text-xs border rounded resize-none"
                                value={step.desc || ''}
                                onChange={(e) => {
                                  const steps = [...(sectionContent?.steps || [])];
                                  steps[index] = { ...steps[index], desc: e.target.value };
                                  onUpdateSectionContent({ ...sectionContent, steps });
                                }}
                                placeholder="Step Description"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Video Controls */}
                    {sectionType === 'video' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Video URL</Label>
                          <Input
                            value={sectionContent?.videoUrl || ''}
                            onChange={(e) => onUpdateSectionContent({ ...sectionContent, videoUrl: e.target.value })}
                            placeholder="https://..."
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Caption</Label>
                          <Input
                            value={sectionContent?.caption || ''}
                            onChange={(e) => onUpdateSectionContent({ ...sectionContent, caption: e.target.value })}
                            placeholder="Video caption"
                            className="text-xs"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Autoplay</Label>
                          <Switch
                            checked={sectionContent?.autoplay || false}
                            onCheckedChange={(checked) => onUpdateSectionContent({ ...sectionContent, autoplay: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Show Controls</Label>
                          <Switch
                            checked={sectionContent?.controls !== false}
                            onCheckedChange={(checked) => onUpdateSectionContent({ ...sectionContent, controls: checked })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Map Controls */}
                    {sectionType === 'map' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Address</Label>
                          <Input
                            value={sectionContent?.address || ''}
                            onChange={(e) => onUpdateSectionContent({ ...sectionContent, address: e.target.value })}
                            placeholder="Full Address"
                            className="text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Latitude</Label>
                            <Input
                              type="number"
                              value={sectionContent?.coordinates?.lat || ''}
                              onChange={(e) => onUpdateSectionContent({
                                ...sectionContent,
                                coordinates: { ...sectionContent?.coordinates, lat: parseFloat(e.target.value) }
                              })}
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Longitude</Label>
                            <Input
                              type="number"
                              value={sectionContent?.coordinates?.lng || ''}
                              onChange={(e) => onUpdateSectionContent({
                                ...sectionContent,
                                coordinates: { ...sectionContent?.coordinates, lng: parseFloat(e.target.value) }
                              })}
                              className="text-xs"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Phone</Label>
                          <Input
                            value={sectionContent?.phone || ''}
                            onChange={(e) => onUpdateSectionContent({ ...sectionContent, phone: e.target.value })}
                            placeholder="Phone Number"
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Email</Label>
                          <Input
                            value={sectionContent?.email || ''}
                            onChange={(e) => onUpdateSectionContent({ ...sectionContent, email: e.target.value })}
                            placeholder="Email Address"
                            className="text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Newsletter Controls */}
                    {sectionType === 'newsletter' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Button Text</Label>
                          <Input
                            value={sectionContent?.button || ''}
                            onChange={(e) => onUpdateSectionContent({ ...sectionContent, button: e.target.value })}
                            placeholder="Subscribe"
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Placeholder</Label>
                          <Input
                            value={sectionContent?.placeholder || ''}
                            onChange={(e) => onUpdateSectionContent({ ...sectionContent, placeholder: e.target.value })}
                            placeholder="Email placeholder"
                            className="text-xs"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Show Privacy Note</Label>
                          <Switch
                            checked={sectionContent?.showPrivacyNote !== false}
                            onCheckedChange={(checked) => onUpdateSectionContent({ ...sectionContent, showPrivacyNote: checked })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Countdown Controls */}
                    {sectionType === 'countdown' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Target Date & Time</Label>
                          <Input
                            type="datetime-local"
                            value={sectionContent?.targetDate || ''}
                            onChange={(e) => onUpdateSectionContent({ ...sectionContent, targetDate: e.target.value })}
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Completion Message</Label>
                          <Input
                            value={sectionContent?.message || ''}
                            onChange={(e) => onUpdateSectionContent({ ...sectionContent, message: e.target.value })}
                            placeholder="We have launched!"
                            className="text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Quote Controls */}
                    {sectionType === 'quote' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Quote Text</Label>
                          <textarea
                            className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md resize-none"
                            value={sectionContent?.quote || ''}
                            onChange={(e) => onUpdateSectionContent({ ...sectionContent, quote: e.target.value })}
                            placeholder="Enter quote..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Author Name</Label>
                          <Input
                            value={sectionContent?.author || ''}
                            onChange={(e) => onUpdateSectionContent({ ...sectionContent, author: e.target.value })}
                            placeholder="John Doe"
                            className="text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Role</Label>
                            <Input
                              value={sectionContent?.role || ''}
                              onChange={(e) => onUpdateSectionContent({ ...sectionContent, role: e.target.value })}
                              placeholder="CEO"
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Company</Label>
                            <Input
                              value={sectionContent?.company || ''}
                              onChange={(e) => onUpdateSectionContent({ ...sectionContent, company: e.target.value })}
                              placeholder="Acme Inc"
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Form Field Controls */}
                    {sectionType === 'form' && (
                      <div className="space-y-3">
                        {/* Clickable Field Palette (matches Webforms look) */}
                        <div className="p-2 border rounded-md bg-muted/50">
                          <FieldPalette onFieldAdd={(type) => {
                            // map palette type into a simple landing-page-friendly field
                            const id = Date.now().toString();
                            const pretty = type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                            let mappedType = 'text';
                            if (['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'radio', 'number', 'phone'].includes(type)) mappedType = type;
                            else if (type.includes('dropdown') || type.includes('select') || type.includes('multiselect')) mappedType = 'select';
                            else if (type.includes('phone')) mappedType = 'tel';
                            else if (type.includes('email')) mappedType = 'email';
                            else if (type.includes('number')) mappedType = 'number';

                            const newField = {
                              id,
                              name: `${type}_${id.slice(-4)}`,
                              label: pretty,
                              type: mappedType,
                              required: false,
                              placeholder: ''
                            };

                            onUpdateSectionContent({
                              ...sectionContent,
                              fields: [...(sectionContent?.fields || []), newField]
                            });

                          }} onHide={undefined} />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Form Fields</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newField = {
                                id: Date.now().toString(),
                                name: 'new_field',
                                label: 'New Field',
                                type: 'text',
                                required: false,
                                placeholder: 'Enter text...'
                              };
                              onUpdateSectionContent({
                                ...sectionContent,
                                fields: [...(sectionContent?.fields || []), newField]
                              });
                            }}
                          >
                            Add Field
                          </Button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {sectionContent?.fields?.map((field: any, index: number) => (
                            <div key={field.id || index} className="p-3 border rounded space-y-2">
                              <div className="flex items-center justify-between">
                                <Input
                                  value={field.label || ''}
                                  onChange={(e) => {
                                    const fields = [...(sectionContent?.fields || [])];
                                    fields[index] = { ...fields[index], label: e.target.value };
                                    onUpdateSectionContent({ ...sectionContent, fields });
                                  }}
                                  placeholder="Field label..."
                                  className="text-xs font-medium"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const fields = sectionContent?.fields?.filter((_: any, i: number) => i !== index);
                                    onUpdateSectionContent({ ...sectionContent, fields });
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>

                              <Input
                                value={field.name || ''}
                                onChange={(e) => {
                                  const fields = [...(sectionContent?.fields || [])];
                                  fields[index] = { ...fields[index], name: e.target.value };
                                  onUpdateSectionContent({ ...sectionContent, fields });
                                }}
                                placeholder="Field name (for form submission)..."
                                className="text-xs"
                              />

                              <div className="flex gap-2">
                                <Select
                                  value={field.type || 'text'}
                                  onValueChange={(value) => {
                                    const fields = [...(sectionContent?.fields || [])];
                                    fields[index] = { ...fields[index], type: value };
                                    onUpdateSectionContent({ ...sectionContent, fields });
                                  }}
                                >
                                  <SelectTrigger className="text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="tel">Phone</SelectItem>
                                    <SelectItem value="textarea">Textarea</SelectItem>
                                    <SelectItem value="select">Dropdown</SelectItem>
                                    <SelectItem value="multiselect">Multi Select</SelectItem>
                                    <SelectItem value="radio">Single Choice</SelectItem>
                                    <SelectItem value="checkbox">Multiple Choice</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="time">Time</SelectItem>
                                    <SelectItem value="datetime">Date & Time</SelectItem>
                                    <SelectItem value="masked_text">Masked Text</SelectItem>
                                    <SelectItem value="file">File Upload</SelectItem>
                                    <SelectItem value="url">URL</SelectItem>
                                    <SelectItem value="color">Color Picker</SelectItem>
                                    <SelectItem value="range">Range Slider</SelectItem>
                                    <SelectItem value="rating">Rating</SelectItem>
                                    <SelectItem value="picture_choice">Picture Choice</SelectItem>
                                    <SelectItem value="rich_text">Rich Text Block</SelectItem>
                                  </SelectContent>
                                </Select>

                                <div className="flex items-center gap-1">
                                  <Switch
                                    checked={field.required || false}
                                    onCheckedChange={(checked) => {
                                      const fields = [...(sectionContent?.fields || [])];
                                      fields[index] = { ...fields[index], required: checked };
                                      onUpdateSectionContent({ ...sectionContent, fields });
                                    }}
                                  />
                                  <span className="text-xs">Required</span>
                                </div>
                              </div>

                              <Input
                                value={field.placeholder || ''}
                                onChange={(e) => {
                                  const fields = [...(sectionContent?.fields || [])];
                                  fields[index] = { ...fields[index], placeholder: e.target.value };
                                  onUpdateSectionContent({ ...sectionContent, fields });
                                }}
                                placeholder="Placeholder text..."
                                className="text-xs"
                              />

                              {(field.type === 'select' || field.type === 'multiselect' || field.type === 'radio' || field.type === 'picture_choice') && (
                                <div className="space-y-1">
                                  <Label className="text-xs">Options (one per line)</Label>
                                  <textarea
                                    className="w-full min-h-[60px] px-2 py-1 text-xs border rounded resize-none"
                                    value={field.options?.join('\n') || ''}
                                    onChange={(e) => {
                                      const options = e.target.value.split('\n').filter(opt => opt.trim());
                                      const fields = [...(sectionContent?.fields || [])];
                                      fields[index] = { ...fields[index], options };
                                      onUpdateSectionContent({ ...sectionContent, fields });
                                    }}
                                    placeholder={field.type === 'picture_choice' ? 'Label|https://image.url\nLabel 2|https://image2.url' : 'Option 1\nOption 2\nOption 3'}
                                  />
                                  {field.type === 'picture_choice' && <p className="text-xs text-muted-foreground">Use format: label|image-url per line. Image optional.</p>}
                                </div>
                              )}

                              {field.type === 'file' && (
                                <div className="space-y-1">
                                  <Label className="text-xs">Accepted File Types</Label>
                                  <Input
                                    value={field.accept || ''}
                                    onChange={(e) => {
                                      const fields = [...(sectionContent?.fields || [])];
                                      fields[index] = { ...fields[index], accept: e.target.value };
                                      onUpdateSectionContent({ ...sectionContent, fields });
                                    }}
                                    placeholder="image/*,.pdf,.doc"
                                    className="text-xs"
                                  />
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={field.multiple || false}
                                      onCheckedChange={(checked) => {
                                        const fields = [...(sectionContent?.fields || [])];
                                        fields[index] = { ...fields[index], multiple: checked };
                                        onUpdateSectionContent({ ...sectionContent, fields });
                                      }}
                                    />
                                    <span className="text-xs">Allow multiple files</span>
                                  </div>
                                </div>
                              )}

                              {(field.type === 'number' || field.type === 'range') && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Min</Label>
                                    <Input
                                      type="number"
                                      value={field.min?.toString() || ''}
                                      onChange={(e) => {
                                        const fields = [...(sectionContent?.fields || [])];
                                        fields[index] = { ...fields[index], min: e.target.value ? parseFloat(e.target.value) : undefined };
                                        onUpdateSectionContent({ ...sectionContent, fields });
                                      }}
                                      placeholder="0"
                                      className="text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Max</Label>
                                    <Input
                                      type="number"
                                      value={field.max?.toString() || ''}
                                      onChange={(e) => {
                                        const fields = [...(sectionContent?.fields || [])];
                                        fields[index] = { ...fields[index], max: e.target.value ? parseFloat(e.target.value) : undefined };
                                        onUpdateSectionContent({ ...sectionContent, fields });
                                      }}
                                      placeholder="100"
                                      className="text-xs"
                                    />
                                  </div>
                                </div>
                              )}

                              {field.type === 'masked_text' && (
                                <div>
                                  <Label className="text-xs">Mask Pattern</Label>
                                  <Input
                                    value={field.mask || ''}
                                    onChange={(e) => {
                                      const fields = [...(sectionContent?.fields || [])];
                                      fields[index] = { ...fields[index], mask: e.target.value };
                                      onUpdateSectionContent({ ...sectionContent, fields });
                                    }}
                                    placeholder="(###) ###-####"
                                    className="text-xs"
                                  />
                                </div>
                              )}

                              {field.type === 'rating' && (
                                <div>
                                  <Label className="text-xs">Max Stars</Label>
                                  <Input
                                    type="number"
                                    value={(field.max || 5).toString()}
                                    onChange={(e) => {
                                      const fields = [...(sectionContent?.fields || [])];
                                      fields[index] = { ...fields[index], max: parseInt(e.target.value) || 5 };
                                      onUpdateSectionContent({ ...sectionContent, fields });
                                    }}
                                    className="text-xs"
                                  />
                                </div>
                              )}

                              {field.type === 'color' && (
                                <div>
                                  <Label className="text-xs">Default Color</Label>
                                  <Input
                                    type="color"
                                    value={field.default || '#000000'}
                                    onChange={(e) => {
                                      const fields = [...(sectionContent?.fields || [])];
                                      fields[index] = { ...fields[index], default: e.target.value };
                                      onUpdateSectionContent({ ...sectionContent, fields });
                                    }}
                                    className="h-8 w-12 p-0"
                                  />
                                </div>
                              )}

                              {field.type === 'rich_text' && (
                                <div>
                                  <Label className="text-xs">Content</Label>
                                  <textarea
                                    className="w-full min-h-[80px] px-2 py-1 text-xs border rounded resize-none"
                                    value={field.content || ''}
                                    onChange={(e) => {
                                      const fields = [...(sectionContent?.fields || [])];
                                      fields[index] = { ...fields[index], content: e.target.value };
                                      onUpdateSectionContent({ ...sectionContent, fields });
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="submit-text" className="text-xs">Submit Button Text</Label>
                          <Input
                            id="submit-text"
                            value={sectionContent?.submitText || 'Submit'}
                            onChange={(e) => onUpdateSectionContent({
                              ...sectionContent,
                              submitText: e.target.value
                            })}
                            placeholder="Submit button text..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Image Controls */}
                    {(sectionType === 'hero' || sectionType === 'gallery' || sectionType === 'team') && (
                      <div className="space-y-2">
                        <Label className="text-xs">Image</Label>
                        {sectionContent?.image ? (
                          <div className="space-y-2">
                            <img
                              src={sectionContent.image}
                              alt="Section image"
                              className="w-full h-24 object-cover rounded"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUpdateSectionContent({
                                ...sectionContent,
                                image: undefined
                              })}
                            >
                              Remove Image
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const result = await onImageUpload(file);
                                    onUpdateSectionContent({
                                      ...sectionContent,
                                      image: result.url
                                    });
                                  } catch (error) {
                                    console.error('Upload failed:', error);
                                  }
                                }
                              }}
                              className="hidden"
                              id="content-image-upload"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => document.getElementById('content-image-upload')?.click()}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Upload Image
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="styles" className="space-y-4">
                  {/* Existing Style Controls */}
                  <div className="space-y-2">
                    <Label htmlFor="bg-color">Background Color</Label>
                    <Input
                      id="bg-color"
                      type="color"
                      value={sectionStyles.backgroundColor || '#ffffff'}
                      onChange={(e) => onUpdateSectionStyles({ backgroundColor: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Background Image</Label>
                    {sectionStyles.backgroundImage ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <img
                            src={sectionStyles.backgroundImage}
                            alt="Background"
                            className="w-full h-32 object-cover rounded"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={removeBackgroundImage}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bg-size">Background Size</Label>
                          <Select
                            value={sectionStyles.backgroundSize || 'cover'}
                            onValueChange={(value: 'cover' | 'contain' | 'auto') =>
                              onUpdateSectionStyles({ backgroundSize: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cover">Cover</SelectItem>
                              <SelectItem value="contain">Contain</SelectItem>
                              <SelectItem value="auto">Auto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bg-position">Background Position</Label>
                          <Select
                            value={sectionStyles.backgroundPosition || 'center'}
                            onValueChange={(value) => onUpdateSectionStyles({ backgroundPosition: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="top">Top</SelectItem>
                              <SelectItem value="bottom">Bottom</SelectItem>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="bg-image-upload"
                        />
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => document.getElementById('bg-image-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Background Image
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="padding">Padding</Label>
                    <Select
                      value={sectionStyles.padding || '4rem 2rem'}
                      onValueChange={(value) => onUpdateSectionStyles({ padding: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1rem 1rem">Small</SelectItem>
                        <SelectItem value="2rem 1rem">Medium</SelectItem>
                        <SelectItem value="4rem 2rem">Large</SelectItem>
                        <SelectItem value="6rem 2rem">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="margin">Margin</Label>
                    <Select
                      value={sectionStyles.margin || '0'}
                      onValueChange={(value) => onUpdateSectionStyles({ margin: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        <SelectItem value="2rem 0">Small</SelectItem>
                        <SelectItem value="4rem 0">Medium</SelectItem>
                        <SelectItem value="6rem 0">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text-align">Text Alignment</Label>
                    <Select
                      value={sectionStyles.textAlign || 'center'}
                      onValueChange={(value: 'left' | 'center' | 'right') =>
                        onUpdateSectionStyles({ textAlign: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="columns">Columns</Label>
                    <Select
                      value={sectionStyles.columns?.toString() || '1'}
                      onValueChange={(value) => onUpdateSectionStyles({ columns: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Column</SelectItem>
                        <SelectItem value="2">2 Columns</SelectItem>
                        <SelectItem value="3">3 Columns</SelectItem>
                        <SelectItem value="4">4 Columns</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="border-radius">Border Radius</Label>
                    <Select
                      value={sectionStyles.borderRadius || '0'}
                      onValueChange={(value) => onUpdateSectionStyles({ borderRadius: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        <SelectItem value="0.5rem">Small</SelectItem>
                        <SelectItem value="1rem">Medium</SelectItem>
                        <SelectItem value="1.5rem">Large</SelectItem>
                        <SelectItem value="2rem">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {pageSettings && (
          <>
            <Separator />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Page Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="seo" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                    <TabsTrigger value="theme">Theme</TabsTrigger>
                  </TabsList>
                  <TabsContent value="seo" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="seo-title">SEO Title</Label>
                      <Input
                        id="seo-title"
                        value={pageSettings.seoTitle}
                        onChange={(e) => onUpdatePageSettings({ seoTitle: e.target.value })}
                        placeholder="Page title for search engines"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seo-description">SEO Description</Label>
                      <Input
                        id="seo-description"
                        value={pageSettings.seoDescription}
                        onChange={(e) => onUpdatePageSettings({ seoDescription: e.target.value })}
                        placeholder="Page description for search engines"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="theme" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="page-bg">Page Background</Label>
                      <Input
                        id="page-bg"
                        type="color"
                        value={pageSettings.backgroundColor}
                        onChange={(e) => onUpdatePageSettings({ backgroundColor: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="font-family">Font Family</Label>
                      <Select
                        value={pageSettings.fontFamily}
                        onValueChange={(value) => onUpdatePageSettings({ fontFamily: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                          <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                          <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                          <SelectItem value="Georgia, serif">Georgia</SelectItem>
                          <SelectItem value="monospace">Monospace</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accent-color">Accent Color</Label>
                      <Input
                        id="accent-color"
                        type="color"
                        value={pageSettings.accentColor}
                        onChange={(e) => onUpdatePageSettings({ accentColor: e.target.value })}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
