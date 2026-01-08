import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InlineTextEditor } from './InlineTextEditor';
import { LandingPageSection, SectionStyles } from '@/lib/landingPagesApi';
import { Copy, Trash2, ChevronUp, ChevronDown, Star, Shield, Zap, TrendingUp, Code, Smartphone, Palette, Search, FileTextIcon, Headphones, Rocket, CheckCircle, Clipboard, Play } from 'lucide-react';

interface SectionRendererProps {
  section: LandingPageSection;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<LandingPageSection>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  isDragging?: boolean;
  dragHandle?: React.ReactNode;
}

const defaultStyles: SectionStyles = {
  backgroundColor: '#ffffff',
  padding: '4rem 2rem',
  textAlign: 'center',
};

const getIcon = (iconName: string) => {
  const icons: Record<string, React.ComponentType<any>> = { Star, Shield, Zap, TrendingUp, Code, Smartphone, Palette, Search, FileTextIcon, Headphones, Rocket, CheckCircle, Clipboard, Play };
  return icons[iconName] || Star;
};

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  section, isSelected, onSelect, onUpdate, onDuplicate, onDelete, onMoveUp, onMoveDown, isFirst, isLast, isDragging = false, dragHandle,
}) => {
  const styles = { ...defaultStyles, ...section.styles };

  const renderHero = () => (
    <div className="text-center max-w-4xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-6xl font-bold mb-6" placeholder="Your headline..." />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} multiline className="text-xl md:text-2xl text-muted-foreground mb-8" placeholder="Your subtitle..." />
      <div className="flex gap-4 justify-center">
        <Button size="lg" className="text-lg px-8 py-4">{section.content?.ctaText || 'Get Started'}</Button>
        {section.content?.secondaryButton && <Button size="lg" variant="outline" className="text-lg px-8 py-4">{section.content.secondaryButton}</Button>}
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className="max-w-6xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-12" placeholder="Features Title" />
      <div className={`grid gap-8 ${section.content?.columns === 4 ? 'md:grid-cols-4' : section.content?.columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {(section.content?.items || []).map((item: any, i: number) => {
          const Icon = getIcon(item.icon);
          return (
            <Card key={i} className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="mb-4 flex justify-center"><Icon className="h-12 w-12 text-primary" /></div>
                <InlineTextEditor value={item.title} onChange={(v) => { const items = [...(section.content?.items || [])]; items[i] = { ...items[i], title: v }; onUpdate({ content: { ...section.content, items } }); }} className="text-xl font-semibold mb-4" placeholder="Feature title" />
                <InlineTextEditor value={item.desc} onChange={(v) => { const items = [...(section.content?.items || [])]; items[i] = { ...items[i], desc: v }; onUpdate({ content: { ...section.content, items } }); }} multiline className="text-muted-foreground" placeholder="Feature description" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderTestimonials = () => (
    <div className="max-w-5xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-12" placeholder="Testimonials Title" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(section.content?.quotes || []).map((quote: any, i: number) => (
          <Card key={i} className="p-6">
            <CardContent>
              {section.content?.showRatings && <div className="flex mb-4">{[...Array(5)].map((_, j) => <Star key={j} className={`h-4 w-4 ${j < (quote.rating || 5) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}</div>}
              <InlineTextEditor value={quote.text} onChange={(v) => { const quotes = [...(section.content?.quotes || [])]; quotes[i] = { ...quotes[i], text: v }; onUpdate({ content: { ...section.content, quotes } }); }} multiline className="text-lg mb-4 italic" placeholder="Testimonial..." />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center"><span className="text-sm font-medium">{quote.name?.charAt(0) || 'A'}</span></div>
                <div>
                  <InlineTextEditor value={quote.name} onChange={(v) => { const quotes = [...(section.content?.quotes || [])]; quotes[i] = { ...quotes[i], name: v }; onUpdate({ content: { ...section.content, quotes } }); }} className="font-semibold" placeholder="Name" />
                  {quote.role && <InlineTextEditor value={quote.role} onChange={(v) => { const quotes = [...(section.content?.quotes || [])]; quotes[i] = { ...quotes[i], role: v }; onUpdate({ content: { ...section.content, quotes } }); }} className="text-sm text-muted-foreground" placeholder="Role" />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="max-w-6xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-12" placeholder="Pricing Title" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(section.content?.plans || []).map((plan: any, i: number) => (
          <Card key={i} className={`text-center p-8 ${plan.highlighted ? 'ring-2 ring-primary shadow-lg scale-105' : ''}`}>
            <CardContent>
              {plan.highlighted && <Badge className="mb-4">Most Popular</Badge>}
              <InlineTextEditor value={plan.name} onChange={(v) => { const plans = [...(section.content?.plans || [])]; plans[i] = { ...plans[i], name: v }; onUpdate({ content: { ...section.content, plans } }); }} className="text-2xl font-bold mb-4" placeholder="Plan name" />
              <div className="mb-6">
                <InlineTextEditor value={plan.price} onChange={(v) => { const plans = [...(section.content?.plans || [])]; plans[i] = { ...plans[i], price: v }; onUpdate({ content: { ...section.content, plans } }); }} className="text-2xl font-bold" placeholder="$99" />
                <span className="text-muted-foreground">{plan.period || '/month'}</span>
              </div>
              <ul className="text-left mb-6 space-y-3">{(plan.features || []).map((f: string, j: number) => <li key={j} className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>{f}</span></li>)}</ul>
              <Button className="w-full">{plan.ctaText || 'Get Started'}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderFAQ = () => (
    <div className="max-w-3xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-12" placeholder="FAQ Title" />
      <div className="space-y-4">
        {(section.content?.faqs || []).map((faq: any, i: number) => (
          <Card key={i}><CardContent className="p-6">
            <InlineTextEditor value={faq.q} onChange={(v) => { const faqs = [...(section.content?.faqs || [])]; faqs[i] = { ...faqs[i], q: v }; onUpdate({ content: { ...section.content, faqs } }); }} className="font-semibold text-lg mb-3" placeholder="Question..." />
            <InlineTextEditor value={faq.a} onChange={(v) => { const faqs = [...(section.content?.faqs || [])]; faqs[i] = { ...faqs[i], a: v }; onUpdate({ content: { ...section.content, faqs } }); }} multiline className="text-muted-foreground" placeholder="Answer..." />
          </CardContent></Card>
        ))}
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="max-w-lg mx-auto">
      <InlineTextEditor value={section.content?.title || section.title} onChange={(v) => onUpdate({ content: { ...section.content, title: v } })} className="text-2xl font-bold text-center mb-4" placeholder="Form Title" />
      <InlineTextEditor value={section.content?.subtitle || section.subtitle || ''} onChange={(v) => onUpdate({ content: { ...section.content, subtitle: v } })} className="text-center text-muted-foreground mb-8" placeholder="Form description" />
      <Card><CardContent className="p-6 space-y-4">
        {(section.content?.fields || []).map((field: any, i: number) => (
          <div key={i} className="space-y-2">
            <Label className="text-sm font-medium">{field.label || field}</Label>

            {field.type === 'textarea' && (
              <Textarea placeholder={field.placeholder || field.label || field} rows={4} disabled />
            )}

            {field.type === 'select' && (
              <select className="w-full px-3 py-2 border rounded-md" disabled>
                {(field.options || []).map((opt: string, j: number) => <option key={j}>{opt}</option>)}
              </select>
            )}

            {field.type === 'multiselect' && (
              <select className="w-full px-3 py-2 border rounded-md" multiple disabled>
                {(field.options || []).map((opt: string, j: number) => <option key={j}>{opt}</option>)}
              </select>
            )}

            {field.type === 'radio' && (
              <div className="space-y-2">
                {(field.options || []).map((opt: string, j: number) => (
                  <label key={j} className="flex items-center gap-2">
                    <input type="radio" disabled />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {field.type === 'checkbox' && (
              <div className="flex items-center gap-2">
                <input type="checkbox" disabled className="rounded border-gray-300" />
                <span className="text-sm">{field.placeholder || ''}</span>
              </div>
            )}

            {field.type === 'number' && (
              <Input type="number" placeholder={field.placeholder || ''} disabled />
            )}

            {field.type === 'date' && (
              <Input type="date" placeholder={field.placeholder || ''} disabled />
            )}

            {field.type === 'time' && (
              <Input type="time" placeholder={field.placeholder || ''} disabled />
            )}

            {field.type === 'datetime' && (
              <Input type="datetime-local" placeholder={field.placeholder || ''} disabled />
            )}

            {field.type === 'file' && (
              <input type="file" disabled className="w-full" />
            )}

            {field.type === 'color' && (
              <Input type="color" value={field.default || '#000000'} disabled className="h-8 w-12 p-0" />
            )}

            {field.type === 'range' && (
              <input type="range" min={field.min} max={field.max} disabled className="w-full" />
            )}

            {field.type === 'rating' && (
              <div className="flex gap-1">
                {[...Array(field.max || 5)].map((_, k) => <Star key={k} className="h-4 w-4 text-yellow-400" />)}
              </div>
            )}

            {field.type === 'picture_choice' && (
              <div className="grid grid-cols-3 gap-2">
                {(field.options || []).map((opt: string, j: number) => {
                  const [label] = opt.split('|');
                  return (
                    <div key={j} className="p-2 border rounded text-center">
                      <div className="aspect-square bg-muted flex items-center justify-center mb-2"><span className="text-sm text-muted-foreground">Image</span></div>
                      <div className="text-sm">{label}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {['text','email','url','tel','password','masked_text'].includes(field.type) && (
              <Input type={field.type === 'masked_text' ? 'password' : (field.type === 'url' ? 'url' : field.type)} placeholder={field.placeholder || ''} disabled />
            )}

          </div>
        ))}
        <Button className="w-full mt-4">{section.content?.button || 'Submit'}</Button>
      </CardContent></Card>
    </div>
  );

  const renderCTA = () => (
    <div className="text-center max-w-4xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold mb-6" placeholder="CTA Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground mb-8" placeholder="CTA Subtitle" />
      <div className="flex gap-4 justify-center">
        <Button size="lg" className="text-lg px-8 py-4">{section.content?.button || 'Get Started'}</Button>
        {section.content?.secondaryButton && <Button size="lg" variant="outline" className="text-lg px-8 py-4">{section.content.secondaryButton}</Button>}
      </div>
      {section.content?.showTrustBadges && <div className="mt-8 flex justify-center gap-4 flex-wrap"><Badge variant="secondary" className="px-4 py-2">SSL Secured</Badge><Badge variant="secondary" className="px-4 py-2">GDPR Compliant</Badge><Badge variant="secondary" className="px-4 py-2">24/7 Support</Badge></div>}
    </div>
  );

  const renderGallery = () => (
    <div className="max-w-6xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-12" placeholder="Gallery Title" />
      <div className={`grid gap-6 ${section.content?.columns === 4 ? 'md:grid-cols-4' : section.content?.columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {(section.content?.images || []).map((image: any, i: number) => (
          <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
            <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center"><span className="text-muted-foreground">Image {i + 1}</span></div>
            <CardContent className="p-4">
              <InlineTextEditor value={image.caption} onChange={(v) => { const images = [...(section.content?.images || [])]; images[i] = { ...images[i], caption: v }; onUpdate({ content: { ...section.content, images } }); }} className="text-center font-medium" placeholder="Caption" />
              {image.category && <p className="text-center text-sm text-muted-foreground mt-1">{image.category}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="max-w-6xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-4" placeholder="Stats Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground text-center mb-12" placeholder="Stats Subtitle" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {(section.content?.stats || []).map((stat: any, i: number) => (
          <div key={i} className="text-center p-6">
            <div className="text-2xl md:text-2xl font-bold text-primary mb-2">{stat.prefix}{stat.number}{stat.suffix}</div>
            <InlineTextEditor value={stat.label} onChange={(v) => { const stats = [...(section.content?.stats || [])]; stats[i] = { ...stats[i], label: v }; onUpdate({ content: { ...section.content, stats } }); }} className="text-muted-foreground font-medium" placeholder="Label" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="max-w-6xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-4" placeholder="Team Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground text-center mb-12" placeholder="Team Subtitle" />
      <div className={`grid gap-8 ${section.content?.columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
        {(section.content?.members || []).map((member: any, i: number) => (
          <Card key={i} className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent>
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center"><span className="text-2xl font-bold text-primary">{member.name?.charAt(0) || 'T'}</span></div>
              <InlineTextEditor value={member.name} onChange={(v) => { const members = [...(section.content?.members || [])]; members[i] = { ...members[i], name: v }; onUpdate({ content: { ...section.content, members } }); }} className="text-xl font-semibold mb-2" placeholder="Name" />
              <InlineTextEditor value={member.role} onChange={(v) => { const members = [...(section.content?.members || [])]; members[i] = { ...members[i], role: v }; onUpdate({ content: { ...section.content, members } }); }} className="text-muted-foreground mb-3" placeholder="Role" />
              <InlineTextEditor value={member.bio} onChange={(v) => { const members = [...(section.content?.members || [])]; members[i] = { ...members[i], bio: v }; onUpdate({ content: { ...section.content, members } }); }} multiline className="text-sm text-muted-foreground" placeholder="Bio" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="max-w-6xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-4" placeholder="Services Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground text-center mb-12" placeholder="Services Subtitle" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(section.content?.services || []).map((service: any, i: number) => {
          const Icon = getIcon(service.icon);
          return (
            <Card key={i} className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent>
                <div className="mb-4 flex justify-center"><Icon className="h-12 w-12 text-primary" /></div>
                <InlineTextEditor value={service.title} onChange={(v) => { const services = [...(section.content?.services || [])]; services[i] = { ...services[i], title: v }; onUpdate({ content: { ...section.content, services } }); }} className="text-xl font-semibold mb-3" placeholder="Service title" />
                <InlineTextEditor value={service.desc} onChange={(v) => { const services = [...(section.content?.services || [])]; services[i] = { ...services[i], desc: v }; onUpdate({ content: { ...section.content, services } }); }} multiline className="text-muted-foreground mb-4" placeholder="Description" />
                {section.content?.showPricing && <div className="text-lg font-semibold text-primary">{service.price}</div>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderProcess = () => (
    <div className="max-w-6xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-4" placeholder="Process Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground text-center mb-12" placeholder="Process Subtitle" />
      <div className={`${section.content?.layout === 'horizontal' ? 'flex flex-col md:flex-row justify-between items-start gap-8' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'}`}>
        {(section.content?.steps || []).map((step: any, i: number) => {
          const Icon = getIcon(step.icon);
          return (
            <div key={i} className={`text-center ${section.content?.layout === 'horizontal' ? 'flex-1' : ''}`}>
              {section.content?.showNumbers && <div className="text-2xl font-bold text-primary mb-4">{step.number}</div>}
              {section.content?.showIcons && <div className="mb-4 flex justify-center"><Icon className="h-12 w-12 text-primary" /></div>}
              <InlineTextEditor value={step.title} onChange={(v) => { const steps = [...(section.content?.steps || [])]; steps[i] = { ...steps[i], title: v }; onUpdate({ content: { ...section.content, steps } }); }} className="text-xl font-semibold mb-3" placeholder="Step title" />
              <InlineTextEditor value={step.desc} onChange={(v) => { const steps = [...(section.content?.steps || [])]; steps[i] = { ...steps[i], desc: v }; onUpdate({ content: { ...section.content, steps } }); }} multiline className="text-muted-foreground" placeholder="Step description" />
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderVideo = () => (
    <div className="max-w-4xl mx-auto text-center">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold mb-4" placeholder="Video Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground mb-8" placeholder="Video Subtitle" />
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4 cursor-pointer hover:bg-muted/80 transition-colors">
        <Play className="h-16 w-16 text-muted-foreground" />
      </div>
      {section.content?.caption && <InlineTextEditor value={section.content.caption} onChange={(v) => onUpdate({ content: { ...section.content, caption: v } })} className="text-muted-foreground" placeholder="Video caption" />}
    </div>
  );

  const renderNewsletter = () => (
    <div className="max-w-md mx-auto text-center">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl font-bold mb-4" placeholder="Newsletter Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-muted-foreground mb-6" placeholder="Newsletter Subtitle" />
      <div className="flex gap-2 mb-4">
        <input type="email" placeholder={section.content?.placeholder || 'Enter your email'} className="flex-1 px-4 py-2 border rounded-md" disabled />
        <Button>{section.content?.button || 'Subscribe'}</Button>
      </div>
      {section.content?.description && <InlineTextEditor value={section.content.description} onChange={(v) => onUpdate({ content: { ...section.content, description: v } })} className="text-sm text-muted-foreground" placeholder="Description" />}
      {section.content?.showPrivacyNote && <p className="text-xs text-muted-foreground mt-2">We respect your privacy. Unsubscribe at any time.</p>}
    </div>
  );

  const renderHeader = () => (
    <div className="flex items-center justify-between py-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <InlineTextEditor value={section.content?.logo || 'Company Logo'} onChange={(v) => onUpdate({ content: { ...section.content, logo: v } })} className="text-xl font-bold" placeholder="Logo" />
      </div>
      <nav className="hidden md:flex items-center gap-6">
        {(section.content?.navigation || []).map((item: any, i: number) => (
          <InlineTextEditor key={i} value={item.label} onChange={(v) => { const nav = [...(section.content?.navigation || [])]; nav[i] = { ...nav[i], label: v }; onUpdate({ content: { ...section.content, navigation: nav } }); }} className="hover:text-primary transition-colors" placeholder="Menu item" />
        ))}
      </nav>
      <Button>{section.content?.ctaButton || 'Get Started'}</Button>
    </div>
  );

  const renderFooter = () => (
    <div className="border-t pt-12 pb-8 max-w-7xl mx-auto">
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
        <div className="lg:col-span-2">
          <InlineTextEditor value={section.content?.logo || 'Company Logo'} onChange={(v) => onUpdate({ content: { ...section.content, logo: v } })} className="text-xl font-bold mb-4" placeholder="Logo" />
          <InlineTextEditor value={section.content?.description || ''} onChange={(v) => onUpdate({ content: { ...section.content, description: v } })} multiline className="text-muted-foreground mb-4" placeholder="Description" />
        </div>
        {(section.content?.links || []).map((linkGroup: any, i: number) => (
          <div key={i}>
            <InlineTextEditor value={linkGroup.title} onChange={(v) => { const links = [...(section.content?.links || [])]; links[i] = { ...links[i], title: v }; onUpdate({ content: { ...section.content, links } }); }} className="font-semibold mb-4" placeholder="Link group" />
            <ul className="space-y-2">
              {linkGroup.items.map((item: string, j: number) => (
                <li key={j}>
                  <InlineTextEditor value={item} onChange={(v) => { const links = [...(section.content?.links || [])]; links[i].items[j] = v; onUpdate({ content: { ...section.content, links } }); }} className="text-muted-foreground hover:text-foreground transition-colors" placeholder="Link" />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <InlineTextEditor value={section.content?.copyright || ''} onChange={(v) => onUpdate({ content: { ...section.content, copyright: v } })} className="text-sm text-muted-foreground" placeholder="Copyright text" />
        <div className="flex gap-4">
          {(section.content?.social || {}).twitter && <span className="text-muted-foreground">Twitter</span>}
          {(section.content?.social || {}).linkedin && <span className="text-muted-foreground">LinkedIn</span>}
          {(section.content?.social || {}).facebook && <span className="text-muted-foreground">Facebook</span>}
          {(section.content?.social || {}).instagram && <span className="text-muted-foreground">Instagram</span>}
        </div>
      </div>
    </div>
  );

  const renderSocialProof = () => (
    <div className="max-w-6xl mx-auto text-center">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold mb-4" placeholder="Social Proof Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground mb-12" placeholder="Social Proof Subtitle" />
      <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center">
        {(section.content?.logos || []).map((logo: any, i: number) => (
          <div key={i} className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
            <InlineTextEditor value={logo.name} onChange={(v) => { const logos = [...(section.content?.logos || [])]; logos[i] = { ...logos[i], name: v }; onUpdate({ content: { ...section.content, logos } }); }} className="text-sm font-medium text-center" placeholder="Company name" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div className="max-w-4xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-4" placeholder="Timeline Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground text-center mb-12" placeholder="Timeline Subtitle" />
      <div className="space-y-8">
        {(section.content?.events || []).map((event: any, i: number) => {
          const Icon = getIcon(event.icon);
          return (
            <div key={i} className="flex gap-6">
              <div className="flex-shrink-0 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Icon className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <InlineTextEditor value={event.date} onChange={(v) => { const events = [...(section.content?.events || [])]; events[i] = { ...events[i], date: v }; onUpdate({ content: { ...section.content, events } }); }} className="text-lg font-semibold text-primary" placeholder="Date" />
                  <InlineTextEditor value={event.title} onChange={(v) => { const events = [...(section.content?.events || [])]; events[i] = { ...events[i], title: v }; onUpdate({ content: { ...section.content, events } }); }} className="text-xl font-bold" placeholder="Event title" />
                </div>
                <InlineTextEditor value={event.desc} onChange={(v) => { const events = [...(section.content?.events || [])]; events[i] = { ...events[i], desc: v }; onUpdate({ content: { ...section.content, events } }); }} multiline className="text-muted-foreground" placeholder="Event description" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderComparison = () => (
    <div className="max-w-6xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-4" placeholder="Comparison Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground text-center mb-12" placeholder="Comparison Subtitle" />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-semibold">Features</th>
              {(section.content?.plans || []).map((plan: string, i: number) => (
                <th key={i} className="text-center p-4 font-semibold">{plan}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(section.content?.features || []).map((feature: any, i: number) => (
              <tr key={i} className="border-b">
                <td className="p-4 font-medium">
                  <InlineTextEditor value={feature.name} onChange={(v) => { const features = [...(section.content?.features || [])]; features[i] = { ...features[i], name: v }; onUpdate({ content: { ...section.content, features } }); }} placeholder="Feature name" />
                </td>
                <td className="text-center p-4">{feature.starter ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" /> : '—'}</td>
                <td className="text-center p-4">{feature.pro ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" /> : '—'}</td>
                <td className="text-center p-4">{feature.enterprise ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" /> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="max-w-4xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-4" placeholder="Tabs Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground text-center mb-12" placeholder="Tabs Subtitle" />
      <div className="border rounded-lg overflow-hidden">
        <div className="flex border-b">
          {(section.content?.tabs || []).map((tab: any, i: number) => {
            const Icon = getIcon(tab.icon);
            return (
              <button key={i} className={`flex-1 flex items-center justify-center gap-2 p-4 text-sm font-medium ${i === 0 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                <Icon className="h-4 w-4" />
                <InlineTextEditor value={tab.title} onChange={(v) => { const tabs = [...(section.content?.tabs || [])]; tabs[i] = { ...tabs[i], title: v }; onUpdate({ content: { ...section.content, tabs } }); }} placeholder="Tab title" />
              </button>
            );
          })}
        </div>
        <div className="p-6">
          <InlineTextEditor value={(section.content?.tabs || [])[0]?.content || ''} onChange={(v) => { const tabs = [...(section.content?.tabs || [])]; tabs[0] = { ...tabs[0], content: v }; onUpdate({ content: { ...section.content, tabs } }); }} multiline className="text-muted-foreground" placeholder="Tab content" />
        </div>
      </div>
    </div>
  );

  const renderAccordion = () => (
    <div className="max-w-3xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-4" placeholder="Accordion Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground text-center mb-12" placeholder="Accordion Subtitle" />
      <div className="space-y-4">
        {(section.content?.items || []).map((item: any, i: number) => (
          <Card key={i}>
            <CardContent className="p-6">
              <InlineTextEditor value={item.title} onChange={(v) => { const items = [...(section.content?.items || [])]; items[i] = { ...items[i], title: v }; onUpdate({ content: { ...section.content, items } }); }} className="font-semibold text-lg mb-3" placeholder="Accordion title" />
              <InlineTextEditor value={item.content} onChange={(v) => { const items = [...(section.content?.items || [])]; items[i] = { ...items[i], content: v }; onUpdate({ content: { ...section.content, items } }); }} multiline className="text-muted-foreground" placeholder="Accordion content" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderMap = () => (
    <div className="max-w-4xl mx-auto text-center">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold mb-4" placeholder="Map Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground mb-8" placeholder="Map Subtitle" />
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
        <span className="text-muted-foreground">Interactive Map</span>
      </div>
      <div className="grid md:grid-cols-3 gap-4 text-left">
        <div>
          <InlineTextEditor value={section.content?.address || ''} onChange={(v) => onUpdate({ content: { ...section.content, address: v } })} multiline className="font-medium" placeholder="Address" />
        </div>
        <div>
          <InlineTextEditor value={section.content?.phone || ''} onChange={(v) => onUpdate({ content: { ...section.content, phone: v } })} className="font-medium" placeholder="Phone" />
        </div>
        <div>
          <InlineTextEditor value={section.content?.email || ''} onChange={(v) => onUpdate({ content: { ...section.content, email: v } })} className="font-medium" placeholder="Email" />
        </div>
      </div>
    </div>
  );

  const renderCountdown = () => (
    <div className="max-w-4xl mx-auto text-center">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold mb-4" placeholder="Countdown Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground mb-12" placeholder="Countdown Subtitle" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <div className="text-center">
          <div className="text-2xl md:text-6xl font-bold text-primary mb-2">00</div>
          <div className="text-muted-foreground">Days</div>
        </div>
        <div className="text-center">
          <div className="text-2xl md:text-6xl font-bold text-primary mb-2">00</div>
          <div className="text-muted-foreground">Hours</div>
        </div>
        <div className="text-center">
          <div className="text-2xl md:text-6xl font-bold text-primary mb-2">00</div>
          <div className="text-muted-foreground">Minutes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl md:text-6xl font-bold text-primary mb-2">00</div>
          <div className="text-muted-foreground">Seconds</div>
        </div>
      </div>
      <InlineTextEditor value={section.content?.message || ''} onChange={(v) => onUpdate({ content: { ...section.content, message: v } })} className="text-lg" placeholder="Countdown message" />
    </div>
  );

  const renderCode = () => (
    <div className="max-w-4xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-4" placeholder="Code Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground text-center mb-8" placeholder="Code Subtitle" />
      <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
        <pre className="text-green-400 text-sm">
          <code>
            <InlineTextEditor value={section.content?.code || ''} onChange={(v) => onUpdate({ content: { ...section.content, code: v } })} multiline className="bg-transparent border-none text-green-400 font-mono text-sm" placeholder="Code snippet..." />
          </code>
        </pre>
      </div>
    </div>
  );

  const renderQuote = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="text-6xl text-muted-foreground mb-8">"</div>
      <InlineTextEditor value={section.content?.quote || ''} onChange={(v) => onUpdate({ content: { ...section.content, quote: v } })} multiline className="text-2xl md:text-2xl font-light italic mb-8 leading-relaxed" placeholder="Inspiring quote..." />
      <div className="flex flex-col items-center gap-2">
        <InlineTextEditor value={section.content?.author || ''} onChange={(v) => onUpdate({ content: { ...section.content, author: v } })} className="text-xl font-semibold" placeholder="Author name" />
        <InlineTextEditor value={section.content?.role || ''} onChange={(v) => onUpdate({ content: { ...section.content, role: v } })} className="text-muted-foreground" placeholder="Author role" />
        <InlineTextEditor value={section.content?.company || ''} onChange={(v) => onUpdate({ content: { ...section.content, company: v } })} className="text-sm text-muted-foreground" placeholder="Company" />
      </div>
    </div>
  );

  const renderBadge = () => (
    <div className="max-w-6xl mx-auto text-center">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold mb-4" placeholder="Badge Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground mb-12" placeholder="Badge Subtitle" />
      <div className={`grid gap-6 ${section.content?.columns === 4 ? 'md:grid-cols-4' : section.content?.columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {(section.content?.badges || []).map((badge: any, i: number) => (
          <Card key={i} className="text-center p-6">
            <CardContent>
              <Award className="h-12 w-12 text-primary mx-auto mb-4" />
              <InlineTextEditor value={badge.title} onChange={(v) => { const badges = [...(section.content?.badges || [])]; badges[i] = { ...badges[i], title: v }; onUpdate({ content: { ...section.content, badges } }); }} className="text-lg font-semibold mb-2" placeholder="Badge title" />
              <InlineTextEditor value={badge.issuer} onChange={(v) => { const badges = [...(section.content?.badges || [])]; badges[i] = { ...badges[i], issuer: v }; onUpdate({ content: { ...section.content, badges } }); }} className="text-muted-foreground text-sm mb-1" placeholder="Issuer" />
              <InlineTextEditor value={badge.year} onChange={(v) => { const badges = [...(section.content?.badges || [])]; badges[i] = { ...badges[i], year: v }; onUpdate({ content: { ...section.content, badges } }); }} className="text-xs text-muted-foreground" placeholder="Year" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderContactInfo = () => (
    <div className="max-w-6xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-4" placeholder="Contact Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground text-center mb-12" placeholder="Contact Subtitle" />
      <div className={`grid gap-8 ${section.content?.columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
        {(section.content?.info || []).map((info: any, i: number) => {
          const Icon = getIcon(info.icon);
          return (
            <Card key={i} className="p-6">
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <InlineTextEditor value={info.title} onChange={(v) => { const infos = [...(section.content?.info || [])]; infos[i] = { ...infos[i], title: v }; onUpdate({ content: { ...section.content, info: infos } }); }} className="text-lg font-semibold mb-2" placeholder="Info title" />
                    <InlineTextEditor value={info.content} onChange={(v) => { const infos = [...(section.content?.info || [])]; infos[i] = { ...infos[i], content: v }; onUpdate({ content: { ...section.content, info: infos } }); }} multiline className="text-muted-foreground" placeholder="Info content" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderBlogPreview = () => (
    <div className="max-w-6xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-4" placeholder="Blog Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground text-center mb-12" placeholder="Blog Subtitle" />
      <div className={`grid gap-8 ${section.content?.columns === 3 ? 'md:grid-cols-3' : section.content?.columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
        {(section.content?.posts || []).map((post: any, i: number) => (
          <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">Blog Image</span>
            </div>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                {section.content?.showReadTime && <span className="text-xs text-muted-foreground">{post.readTime}</span>}
              </div>
              <InlineTextEditor value={post.title} onChange={(v) => { const posts = [...(section.content?.posts || [])]; posts[i] = { ...posts[i], title: v }; onUpdate({ content: { ...section.content, posts } }); }} className="text-xl font-semibold mb-3 leading-tight" placeholder="Post title" />
              <InlineTextEditor value={post.excerpt} onChange={(v) => { const posts = [...(section.content?.posts || [])]; posts[i] = { ...posts[i], excerpt: v }; onUpdate({ content: { ...section.content, posts } }); }} multiline className="text-muted-foreground text-sm mb-4" placeholder="Post excerpt" />
              <div className="flex items-center justify-between">
                <InlineTextEditor value={post.date} onChange={(v) => { const posts = [...(section.content?.posts || [])]; posts[i] = { ...posts[i], date: v }; onUpdate({ content: { ...section.content, posts } }); }} className="text-xs text-muted-foreground" placeholder="Date" />
                <Button variant="outline" size="sm">Read More</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPortfolio = () => (
    <div className="max-w-6xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-4" placeholder="Portfolio Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground text-center mb-12" placeholder="Portfolio Subtitle" />
      {section.content?.showFilters && (
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {(section.content?.categories || []).map((category: string, i: number) => (
            <Button key={i} variant="outline" size="sm" className={i === 0 ? 'bg-primary text-primary-foreground' : ''}>
              {category}
            </Button>
          ))}
        </div>
      )}
      <div className={`grid gap-8 ${section.content?.columns === 3 ? 'md:grid-cols-3' : section.content?.columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
        {(section.content?.projects || []).map((project: any, i: number) => (
          <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <span className="text-muted-foreground">Project Image</span>
            </div>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs">{project.category}</Badge>
              </div>
              <InlineTextEditor value={project.title} onChange={(v) => { const projects = [...(section.content?.projects || [])]; projects[i] = { ...projects[i], title: v }; onUpdate({ content: { ...section.content, projects } }); }} className="text-xl font-semibold mb-3" placeholder="Project title" />
              <InlineTextEditor value={project.description} onChange={(v) => { const projects = [...(section.content?.projects || [])]; projects[i] = { ...projects[i], description: v }; onUpdate({ content: { ...section.content, projects } }); }} multiline className="text-muted-foreground text-sm mb-4" placeholder="Project description" />
              <div className="flex flex-wrap gap-1">
                {(project.technologies || []).slice(0, 3).map((tech: string, j: number) => (
                  <Badge key={j} variant="outline" className="text-xs">{tech}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderBenefits = () => (
    <div className="max-w-6xl mx-auto">
      <InlineTextEditor value={section.title} onChange={(v) => onUpdate({ title: v })} className="text-2xl md:text-2xl font-bold text-center mb-4" placeholder="Benefits Title" />
      <InlineTextEditor value={section.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} className="text-xl text-muted-foreground text-center mb-12" placeholder="Benefits Subtitle" />
      <div className={`grid gap-8 ${section.content?.columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
        {(section.content?.benefits || []).map((benefit: any, i: number) => {
          const Icon = getIcon(benefit.icon);
          return (
            <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
              <CardContent>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <InlineTextEditor value={benefit.title} onChange={(v) => { const benefits = [...(section.content?.benefits || [])]; benefits[i] = { ...benefits[i], title: v }; onUpdate({ content: { ...section.content, benefits } }); }} className="text-xl font-semibold mb-3" placeholder="Benefit title" />
                    <InlineTextEditor value={benefit.description} onChange={(v) => { const benefits = [...(section.content?.benefits || [])]; benefits[i] = { ...benefits[i], description: v }; onUpdate({ content: { ...section.content, benefits } }); }} multiline className="text-muted-foreground mb-4" placeholder="Benefit description" />
                    {section.content?.showStats && (
                      <div className="text-lg font-semibold text-primary">{benefit.stats}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderSection = () => {
    switch (section.type) {
      case 'hero': return renderHero();
      case 'features': return renderFeatures();
      case 'testimonials': return renderTestimonials();
      case 'pricing': return renderPricing();
      case 'faq': return renderFAQ();
      case 'form': return renderForm();
      case 'cta': return renderCTA();
      case 'gallery': return renderGallery();
      case 'stats': return renderStats();
      case 'team': return renderTeam();
      case 'services': return renderServices();
      case 'process': return renderProcess();
      case 'testimonials-grid': return renderTestimonials();
      case 'video': return renderVideo();
      case 'newsletter': return renderNewsletter();
      case 'header': return renderHeader();
      case 'footer': return renderFooter();
      case 'social-proof': return renderSocialProof();
      case 'timeline': return renderTimeline();
      case 'comparison': return renderComparison();
      case 'tabs': return renderTabs();
      case 'accordion': return renderAccordion();
      case 'map': return renderMap();
      case 'countdown': return renderCountdown();
      case 'code': return renderCode();
      case 'quote': return renderQuote();
      case 'badge': return renderBadge();
      case 'contact-info': return renderContactInfo();
      case 'blog-preview': return renderBlogPreview();
      case 'portfolio': return renderPortfolio();
      case 'benefits': return renderBenefits();
      default: return <div className="text-center p-8">Unknown section type: {section.type}</div>;
    }
  };

return (
  <div
    className={`relative group ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''} ${isDragging ? 'opacity-50' : ''}`}
    style={{ backgroundColor: styles.backgroundColor, backgroundImage: styles.backgroundImage ? `url(${styles.backgroundImage})` : undefined, backgroundSize: styles.backgroundSize, backgroundPosition: styles.backgroundPosition, padding: styles.padding, margin: styles.margin, borderRadius: styles.borderRadius }}
    onClick={onSelect}
  >
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
      {dragHandle}
      <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={isFirst}><ChevronUp className="h-4 w-4" /></Button>
      <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={isLast}><ChevronDown className="h-4 w-4" /></Button>
      <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}><Copy className="h-4 w-4" /></Button>
      <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 className="h-4 w-4" /></Button>
    </div>
    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"><Badge variant="secondary">{section.type}</Badge></div>
    {renderSection()}
  </div>
);
};

