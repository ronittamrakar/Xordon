import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { homeServicesPresets } from '@/components/landing/VisualLandingBuilder';
import { ArrowLeft, Edit, Share2, Monitor, Tablet, Smartphone, Download, Eye } from 'lucide-react';

const LandingPagePreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Check if this is a template preview
  const isTemplate = id?.startsWith('template-');
  const presetId = id?.replace('template-', '') as keyof typeof homeServicesPresets;
  const preset = isTemplate && presetId ? homeServicesPresets[presetId] : null;

  const landingPage = preset
    ? {
      id: id || '1',
      name: preset.label,
      title: preset.label,
      description: preset.description,
      content: {
        sections: preset.createSections(),
        settings: preset.createSettings(),
      },
    }
    : {
      id: id || '1',
      name: 'Summer Sale Campaign',
      title: 'Summer Sale - 50% Off All Services',
      description: 'Limited time offer on all painting services',
      content: {
        sections: [
          {
            type: 'hero',
            content: {
              headline: 'Transform Your Home This Summer',
              subheadline: 'Professional Painting Services at 50% Off',
              ctaText: 'Get Your Free Quote',
              ctaLink: '#contact',
            },
          },
          {
            type: 'features',
            content: {
              title: 'Why Choose Us',
              features: [
                { title: 'Professional Team', description: 'Experienced painters' },
                { title: 'Quality Materials', description: 'Premium paints and tools' },
                { title: 'Satisfaction Guaranteed', description: '100% satisfaction guarantee' },
              ],
            },
          },
          {
            type: 'testimonials',
            content: {
              title: 'What Our Customers Say',
              testimonials: [
                { name: 'John D.', text: 'Amazing service and great results!' },
                { name: 'Sarah M.', text: 'Professional and affordable.' },
              ],
            },
          },
          {
            type: 'form',
            content: {
              title: 'Get Your Free Quote',
              description: 'Fill out the form below for a free consultation',
              formId: 'contact-form',
            },
          },
        ],
        settings: {
          seoTitle: 'Summer Sale - 50% Off Painting Services',
          seoDescription: 'Limited time offer on professional painting services',
          backgroundColor: '#ffffff',
          fontFamily: 'Inter, sans-serif',
        },
      },
    };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile':
        // Use full width up to a comfortable max for mobile
        return 'w-full max-w-md mx-auto';
      case 'tablet':
        return 'w-full max-w-2xl mx-auto';
      default:
        // Desktop: still centered, but wider so it feels natural in the dashboard
        return 'w-full max-w-5xl mx-auto';
    }
  };

  const renderSection = (section: any, index: number) => {
    switch (section.type) {
      case 'hero': {
        const heroTitle = section.content?.headline || section.title;
        const heroSubtitle = section.content?.subheadline || section.subtitle;
        const heroCtaText = section.content?.ctaText;
        return (
          <div
            key={index}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-6 text-center"
          >
            <h1 className="text-2xl md:text-6xl font-bold mb-4">{heroTitle}</h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">{heroSubtitle}</p>
            {heroCtaText && (
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                {heroCtaText}
              </button>
            )}
          </div>
        );
      }

      case 'features': {
        const featuresTitle = section.content?.title || section.title;
        const features = section.content?.features || [];
        return (
          <div key={index} className="py-16 px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-12">{featuresTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature: any, idx: number) => (
                  <div key={idx} className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-full" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'testimonials': {
        const testimonialsTitle = section.content?.title || section.title;
        const testimonials = section.content?.testimonials || section.content?.quotes || [];
        return (
          <div key={index} className="bg-gray-50 py-16 px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-12">{testimonialsTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {testimonials.map((testimonial: any, idx: number) => (
                  <div key={idx} className="bg-white p-6 rounded-lg shadow-sm">
                    <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                    <p className="font-semibold">- {testimonial.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'form': {
        const formTitle = section.content?.title;
        const formDescription = section.content?.description;
        return (
          <div key={index} className="py-16 px-6">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-4">{formTitle}</h2>
              <p className="text-center text-gray-600 mb-8">{formDescription}</p>
              <div className="bg-white p-8 rounded-lg shadow-sm border">
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="First Name"
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Tell us about your project"
                    rows={4}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Get Free Quote
                  </button>
                </form>
              </div>
            </div>
          </div>
        );
      }

      case 'benefits': {
        const benefitsTitle = section.content?.title || section.title;
        const benefits = section.content?.benefits || [];
        return (
          <div key={index} className="py-16 px-6 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-12">{benefitsTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {benefits.map((benefit: any, idx: number) => (
                  <div key={idx} className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'services': {
        const servicesTitle = section.content?.title || section.title;
        const services = section.content?.services || [];
        return (
          <div key={index} className="py-16 px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-12">{servicesTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {services.map((service: any, idx: number) => (
                  <div key={idx} className="text-center">
                    <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                    <p className="text-gray-600">{service.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'testimonials-grid': {
        const tgTitle = section.content?.title || section.title;
        const tgTestimonials = section.content?.testimonials || [];
        return (
          <div key={index} className="bg-gray-50 py-16 px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-12">{tgTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {tgTestimonials.map((testimonial: any, idx: number) => (
                  <div key={idx} className="bg-white p-6 rounded-lg shadow-sm">
                    <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                    <p className="font-semibold">- {testimonial.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'faq': {
        const faqTitle = section.content?.title || section.title;
        const faqs = section.content?.faqs || [];
        return (
          <div key={index} className="py-16 px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-12">{faqTitle}</h2>
              <div className="space-y-4">
                {faqs.map((faq: any, idx: number) => (
                  <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold mb-2">{faq.q}</h3>
                    <p className="text-gray-600">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'contact-info': {
        const ciTitle = section.content?.title || section.title;
        const info = section.content?.info || [];
        return (
          <div key={index} className="py-16 px-6 bg-gray-50">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-8">{ciTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {info.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p>{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'footer': {
        return (
          <div key={index} className="bg-gray-900 text-white py-12 px-6">
            <div className="max-w-6xl mx-auto text-center">
              <p>&copy; 2024 {section.content?.logo || 'Company Name'}. All rights reserved.</p>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Preview Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/websites/landing-pages')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pages
              </Button>
              <div>
                <h1 className="text-lg font-semibold">{landingPage.name}</h1>
                <p className="text-sm text-muted-foreground">Preview Mode</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Device Preview Toggle */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('tablet')}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {!isTemplate && (
                <Button onClick={() => navigate(`/landing-pages/builder/${id}`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className={`py-8 ${getPreviewWidth()}`}>
          <div className="bg-white shadow-lg">
            {/* Landing Page Content */}
            {landingPage.content.sections.map((section, index) => renderSection(section, index))}
          </div>
        </div>

        {/* Preview Footer */}
        <div className="bg-white border-t mt-8">
          <div className="container mx-auto px-6 py-8">
            <div className="text-center text-gray-600">
              <p className="mb-2">Preview Mode - This is how your landing page will appear to visitors</p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" size="sm">
                  <Eye className="h-3 w-3 mr-1" />
                  View Live
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-3 w-3 mr-1" />
                  Share Preview
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPagePreview;
