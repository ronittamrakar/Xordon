import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { BrandWordmark } from '@/components/BrandWordmark';
import {
  Mail,
  Smartphone,
  BarChart3,
  Users,
  Zap,
  Shield,
  Check,
  Star,
  ArrowRight,
  Play,
  Menu,
  X,
  Target,
  Rocket,
  TrendingUp,
  FileTextIcon,
  Phone,
  Sparkles,
  Workflow
} from 'lucide-react';
import { Footer } from '../components/layout/Footer';
import SEO from '@/components/SEO';

const Landing: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const navigate = useNavigate();

  const containerClass = 'max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6';
  const highlightClass = 'bg-transparent p-0 text-foreground font-[inherit] text-[inherit] leading-[inherit]';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    const sectionIds = ['features', 'how-it-works', 'pricing', 'testimonials', 'faq'];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));

        if (visible[0]?.target?.id) setActiveSection(visible[0].target.id);
      },
      {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: [0.1, 0.25, 0.5],
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const scrollReveal = !prefersReducedMotion
    ? {
      style: { animationDelay: '120ms' } as React.CSSProperties,
      className: 'animate-in fade-in slide-in-from-bottom-2 duration-700',
    }
    : { style: undefined, className: '' };

  const navLinkClass = (id: string) =>
    `text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded-md ${activeSection === id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
    }`;

  const mobileNavLinkClass = (id: string) =>
    `block px-4 py-3 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${activeSection === id ? 'text-foreground bg-muted/40' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
    }`;

  const logoCloud = ['Growth Labs', 'Northwind', 'Acme Co.', 'Initech', 'Globex', 'Umbrella'];

  const deepDives = [
    {
      icon: Rocket,
      title: 'Multi-channel outreach that feels personal at scale',
      description:
        'Coordinate email, SMS, and calls from one place—so every follow-up is timely, consistent, and easy to manage.',
      bullets: [
        'Email sequences with personalization and A/B testing',
        'SMS follow-ups that respect business hours and opt-outs',
        'Call scripts and dispositions to standardize your process',
        'Unified contact timeline across every channel',
      ],
    },
    {
      icon: Workflow,
      title: 'Visual automation for revenue workflows',
      description:
        'Stop duct-taping tools together. Build flows that match your process and keep improving as you learn what converts.',
      bullets: [
        'Trigger-based automations and smart delays',
        'Branching logic and A/B split testing',
        'Reusable recipes for common follow-up paths',
        'Webhook-driven integrations (where available)',
      ],
    },
    {
      icon: BarChart3,
      title: "Know what's working—at a glance",
      description:
        'From deliverability to conversions, keep your team focused on the metrics that move pipeline and prove ROI.',
      bullets: [
        'Open, click, reply, and delivery analytics',
        'Conversion tracking and performance dashboards',
        'Team activity and workload insights',
        'Export-ready reporting for stakeholders',
      ],
    },
  ];

  const steps = [
    {
      icon: Users,
      title: 'Import leads + organize your CRM',
      description: 'Bring contacts in, segment them, and keep a clean timeline across every touchpoint.',
    },
    {
      icon: Sparkles,
      title: 'Create content faster with AI',
      description: 'Generate email, SMS, and call scripts—then fine-tune quickly for your offer.',
    },
    {
      icon: Workflow,
      title: 'Automate the follow-up',
      description: 'Use smart delays, triggers, and branching so no lead falls through the cracks.',
    },
    {
      icon: BarChart3,
      title: 'Track results and optimize',
      description: 'Measure engagement and conversions, iterate with tests, and prove ROI confidently.',
    },
  ];

  const faqs = [
    {
      question: 'Is there a free trial?',
      answer: 'Yes. Every plan starts with a 14-day free trial and you can cancel anytime.',
    },
    {
      question: 'Is Xordon built for agencies?',
      answer: 'Yes. Multi-workspace support makes it easy to manage multiple clients and keep data isolated.',
    },
    {
      question: 'Does it support email + SMS + calls?',
      answer: 'You can run outreach across email and SMS, and connect calling workflows in a single platform.',
    },
    {
      question: 'Can I build automations visually?',
      answer: 'Yes. Use the visual builder to create trigger-based flows, delays, branches, and A/B splits.',
    },
    {
      question: 'Do you have templates and landing pages?',
      answer: 'Yes. Use templates for faster launches, and publish landing pages and forms to capture leads.',
    },
    {
      question: 'What about security and compliance?',
      answer: 'Xordon is designed with tenant isolation, role-aware access, and GDPR-ready data practices in mind.',
    },
  ];

  const features = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email Outreach',
      description: 'Launch sequences with personalization, A/B testing, and deliverability-first sending.',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'SMS Follow-ups',
      description: 'Reach prospects instantly with compliant SMS campaigns and automated reminders.',
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Call Workflows',
      description: 'Connect faster with scripts, dispositions, and call analytics built into outreach.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'CRM + Segmentation',
      description: 'Organize contacts with lists, tags, and smart segments that update automatically.',
    },
    {
      icon: <Workflow className="w-6 h-6" />,
      title: 'Visual Automations',
      description: 'Build trigger-based flows, delays, and A/B splits with a visual builder.',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'AI Content Assistant',
      description: 'Generate email, SMS, and call scripts in seconds with on-brand suggestions.',
    },
    {
      icon: <FileTextIcon className="w-6 h-6" />,
      title: 'Landing Pages & Forms',
      description: 'Convert clicks to meetings with landing pages, forms, and proposal templates.',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics & Reporting',
      description: 'See opens, clicks, replies, conversions, and pipeline impact in real time.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Multi-tenant Security',
      description: 'Run multiple workspaces with role-aware controls and tenant isolation.',
    },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "For solo operators and early-stage teams",
      features: [
        "Up to 5,000 contacts",
        "Email campaigns + templates",
        "Basic automation",
        "A/B testing",
        "AI content suggestions",
        "Standard support"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$79",
      period: "/month",
      description: "Best for growing revenue teams",
      features: [
        "Up to 25,000 contacts",
        "Email + SMS campaigns",
        "Advanced automation",
        "Advanced analytics",
        "Priority support",
        "Multi-user access"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "/month",
      description: "For large organizations",
      features: [
        "Unlimited contacts",
        "All channels",
        "Custom automation",
        "White-label options",
        "Dedicated support",
        "Custom integrations"
      ],
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Director",
      company: "TechCorp",
      content: "Xordon increased our email open rates by 340% and saved us 20 hours per week on manual campaigns."
    },
    {
      name: "Michael Chen",
      role: "Agency Owner",
      company: "Growth Labs",
      content: "The multi-tenant feature is a game-changer. We manage 15 client accounts seamlessly from one dashboard."
    },
    {
      name: "Emily Rodriguez",
      role: "E-commerce Manager",
      company: "Fashion Forward",
      content: "SMS automation helped us recover 25% of abandoned carts. ROI has been incredible."
    }
  ];

  return (
    <div className="min-h-screen bg-background [font-size:110%]">
      <SEO
        title="Welcome"
        description="Holistic outreach and operations automation platform. Reach your audience through email, SMS, and calls."
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-background focus:text-foreground focus:shadow-lg"
      >
        Skip to content
      </a>
      {/* Navigation */}
      <nav
        aria-label="Primary"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/95 backdrop-blur-sm shadow-sm border-b border-border' : 'bg-background'
          }`}>
        <div className={containerClass}>
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <a href="#" className="flex-shrink-0 flex items-center" aria-label="Xordon home">
                <BrandWordmark className="ml-1" textClassName="text-9xl text-foreground font-bold" casing="lower" />
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={navLinkClass('features')}>
                Features
              </a>
              <a href="#how-it-works" className={navLinkClass('how-it-works')}>
                How it works
              </a>
              <a href="#pricing" className={navLinkClass('pricing')}>
                Pricing
              </a>
              <a href="#testimonials" className={navLinkClass('testimonials')}>
                Testimonials
              </a>
              <a href="#faq" className={navLinkClass('faq')}>
                FAQ
              </a>
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="rounded-xl"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate('/register')}
                className="rounded-xl"
              >
                Start Free Trial
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                type="button"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" aria-hidden="true" focusable="false" />
                ) : (
                  <Menu className="w-6 h-6" aria-hidden="true" focusable="false" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div id="mobile-menu" className="md:hidden bg-background border-t border-border">
            <div className="px-4 py-3 space-y-2">
              <a
                href="#features"
                onClick={() => setIsMenuOpen(false)}
                className={mobileNavLinkClass('features')}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setIsMenuOpen(false)}
                className={mobileNavLinkClass('how-it-works')}
              >
                How it works
              </a>
              <a
                href="#pricing"
                onClick={() => setIsMenuOpen(false)}
                className={mobileNavLinkClass('pricing')}
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                onClick={() => setIsMenuOpen(false)}
                className={mobileNavLinkClass('testimonials')}
              >
                Testimonials
              </a>
              <a
                href="#faq"
                onClick={() => setIsMenuOpen(false)}
                className={mobileNavLinkClass('faq')}
              >
                FAQ
              </a>
              <Button
                variant="outline"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full text-left justify-start rounded-xl"
              >
                Sign In
              </Button>
              <Button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/register');
                }}
                className="w-full rounded-xl"
              >
                Start Free Trial
              </Button>
            </div>
          </div>
        )}
      </nav>

      <main id="main" tabIndex={-1}>

        {/* Hero Section */}
        <section aria-label="Hero" className="pt-24 pb-16 md:pt-32 md:pb-24 bg-background">
          <div className={containerClass}>
            <div
              className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center ${scrollReveal.className}`}
              style={scrollReveal.style}
            >
              <div className="lg:col-span-6 text-center lg:text-left">
                <Badge variant="outline" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-border bg-muted/30 text-foreground">
                  <Sparkles className="h-4 w-4" aria-hidden="true" focusable="false" />
                  Outreach + CRM + automations
                </Badge>
                <h1 className="mt-6 text-[2.75rem] sm:text-[3.4rem] lg:text-[4.15rem] font-bold tracking-tight text-foreground">
                  Automate your{' '}
                  <mark className={highlightClass}>multi-channel</mark>{' '}
                  campaigns
                </h1>
                <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Reach your audience through email, SMS, and calls with powerful automation, AI-assisted content, and ROI-focused analytics.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    onClick={() => navigate('/register')}
                    className="px-8 py-6 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" focusable="false" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="px-8 py-6 border-border hover:bg-muted/50 rounded-2xl"
                  >
                    <a href="#how-it-works">
                      <Play className="mr-2 w-5 h-5" aria-hidden="true" focusable="false" />
                      See How It Works
                    </a>
                  </Button>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  No credit card required • 14-day free trial • Cancel anytime
                </p>
              </div>

              <div className="lg:col-span-6">
                {/* Hero Image */}
                <div className="relative">
                  <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-muted/50 via-transparent to-muted/30 blur-2xl" />
                  <div className="relative rounded-3xl border bg-card/60 p-6 md:p-8 shadow-sm backdrop-blur transition-transform duration-300 hover:-translate-y-0.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-border bg-muted/30 text-foreground">
                          Live dashboard
                        </Badge>
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          Realtime
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4 text-foreground" aria-hidden="true" focusable="false" />
                        +18% replies
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="rounded-2xl border bg-background p-4">
                        <div className="w-10 h-10 bg-muted/30 rounded-xl flex items-center justify-center mb-3">
                          <Mail className="w-5 h-5 text-foreground" aria-hidden="true" focusable="false" />
                        </div>
                        <p className="font-semibold text-foreground">Email</p>
                        <p className="text-sm text-muted-foreground">Sequences + A/B</p>
                      </div>
                      <div className="rounded-2xl border bg-background p-4">
                        <div className="w-10 h-10 bg-muted/30 rounded-xl flex items-center justify-center mb-3">
                          <Smartphone className="w-5 h-5 text-foreground" aria-hidden="true" focusable="false" />
                        </div>
                        <p className="font-semibold text-foreground">SMS</p>
                        <p className="text-sm text-muted-foreground">Follow-ups</p>
                      </div>
                      <div className="rounded-2xl border bg-background p-4">
                        <div className="w-10 h-10 bg-muted/30 rounded-xl flex items-center justify-center mb-3">
                          <Workflow className="w-5 h-5 text-foreground" aria-hidden="true" focusable="false" />
                        </div>
                        <p className="font-semibold text-foreground">Automations</p>
                        <p className="text-sm text-muted-foreground">Visual builder</p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border bg-background p-4">
                        <p className="text-xs text-muted-foreground">Open rate</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">42%</p>
                      </div>
                      <div className="rounded-2xl border bg-background p-4">
                        <p className="text-xs text-muted-foreground">Reply rate</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">8.1%</p>
                      </div>
                      <div className="rounded-2xl border bg-background p-4">
                        <p className="text-xs text-muted-foreground">Meetings</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">31</p>
                      </div>
                    </div>

                    <div className="mt-6 h-2 w-full rounded-full bg-muted">
                      <div className="h-2 w-2/3 rounded-full bg-foreground" />
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
                  <div className="text-center">
                    <div className="text-[1.65rem] font-bold text-foreground mb-1">340%</div>
                    <div className="text-base font-semibold text-foreground">Higher open rates</div>
                    <div className="text-base text-muted-foreground mt-1">Industry-leading performance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[1.65rem] font-bold text-foreground mb-1">25%</div>
                    <div className="text-base font-semibold text-foreground">Cart recovery</div>
                    <div className="text-base text-muted-foreground mt-1">Automated follow-ups</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[1.65rem] font-bold text-foreground mb-1">20hrs</div>
                    <div className="text-base font-semibold text-foreground">Saved weekly</div>
                    <div className="text-base text-muted-foreground mt-1">More time to sell</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Social proof" className="py-10 border-y bg-background">
          <div className={containerClass}>
            <p className="text-center text-sm text-muted-foreground">Trusted by teams at</p>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {logoCloud.map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-center rounded-xl border bg-card/50 px-4 py-3 text-sm font-semibold text-muted-foreground"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" aria-label="Features" className="py-20 md:py-28 bg-background">
          <div className={containerClass}>
            <div className={`text-center mb-16 ${scrollReveal.className}`} style={scrollReveal.style}>
              <Badge variant="outline" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-border bg-muted/30 text-foreground">
                <Zap className="w-4 h-4" />
                Core capabilities
              </Badge>
              <h2 className="mt-6 text-[2.1rem] sm:text-[2.6rem] font-bold tracking-tight text-foreground">
                Everything you need to <mark className={highlightClass}>grow</mark>
              </h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Create campaigns, automate follow-ups, and track ROI—without stitching together a dozen tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="border border-border hover:shadow-md hover:-translate-y-1 transition-all duration-300 group bg-card/60 rounded-2xl hover:border-foreground/10">
                  <CardHeader>
                    <div className="w-14 h-14 bg-muted/30 rounded-2xl flex items-center justify-center text-foreground mb-4 group-hover:scale-110 transition-transform duration-200">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg font-semibold text-foreground transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-muted-foreground leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="Feature deep dives" className="py-20 md:py-28 bg-muted/30">
          <div className={containerClass}>
            <div className="text-center mb-16">
              <Badge variant="outline" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-border bg-muted/30 text-foreground">
                <Rocket className="w-4 h-4" />
                Feature deep-dives
              </Badge>
              <h2 className="mt-6 text-[2.1rem] sm:text-[2.6rem] font-bold tracking-tight text-foreground">
                Built for repeatable <mark className={highlightClass}>revenue</mark>
              </h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Everything is designed to help you move leads to meetings faster—while keeping your data, messaging, and workflows in one place.
              </p>
            </div>

            <div className="space-y-16">
              {deepDives.map((item, index) => {
                const Icon = item.icon;
                const reverse = index % 2 === 1;

                return (
                  <div key={item.title} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    <div className={reverse ? 'lg:col-span-6 lg:order-2' : 'lg:col-span-6'}>
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 text-foreground">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-foreground tracking-tight">{item.title}</h3>
                          <p className="mt-3 text-lg text-muted-foreground leading-relaxed">{item.description}</p>
                          <ul className="mt-6 space-y-3">
                            {item.bullets.map((bullet) => (
                              <li key={bullet} className="flex items-start gap-3">
                                <Check className="mt-1 h-5 w-5 text-foreground" />
                                <span className="text-muted-foreground">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className={reverse ? 'lg:col-span-6 lg:order-1' : 'lg:col-span-6'}>
                      <div className="relative">
                        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-muted/50 via-transparent to-muted/30 blur-2xl" />
                        {index === 0 && (
                          <div className="relative rounded-3xl border bg-card/60 p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-muted/30 text-foreground hover:bg-muted/40">Sequence</Badge>
                                <Badge variant="outline" className="border-border text-muted-foreground">
                                  Multi-channel
                                </Badge>
                              </div>
                              <Badge variant="outline" className="border-border text-muted-foreground">
                                Live
                              </Badge>
                            </div>
                            <div className="mt-6 space-y-3">
                              <div className="flex items-center gap-3 rounded-2xl border bg-background p-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/30 text-foreground">
                                  <Mail className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-foreground">Day 1</p>
                                  <p className="text-sm text-muted-foreground">Personalized email</p>
                                </div>
                                <Badge variant="outline" className="border-border text-muted-foreground">
                                  Sent
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 rounded-2xl border bg-background p-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/30 text-foreground">
                                  <Smartphone className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-foreground">Day 3</p>
                                  <p className="text-sm text-muted-foreground">SMS follow-up</p>
                                </div>
                                <Badge variant="outline" className="border-border text-muted-foreground">
                                  Queued
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 rounded-2xl border bg-background p-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/30 text-foreground">
                                  <Phone className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-foreground">Day 5</p>
                                  <p className="text-sm text-muted-foreground">Call high-intent leads</p>
                                </div>
                                <Badge variant="outline" className="border-border text-muted-foreground">
                                  Next
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}

                        {index === 1 && (
                          <div className="relative rounded-3xl border bg-card/60 p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-muted/30 text-foreground hover:bg-muted/40">Flow Builder</Badge>
                                <Badge variant="outline" className="border-border text-muted-foreground">
                                  Automation
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Workflow className="h-4 w-4 text-foreground" />
                                4 steps
                              </div>
                            </div>
                            <div className="mt-6 grid gap-3">
                              <div className="rounded-2xl border bg-background p-4">
                                <p className="text-sm font-semibold text-foreground">Trigger</p>
                                <p className="text-sm text-muted-foreground">Form submitted / Link clicked</p>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-2xl border bg-background p-4">
                                  <p className="text-sm font-semibold text-foreground">Delay</p>
                                  <p className="text-sm text-muted-foreground">Smart time</p>
                                </div>
                                <div className="rounded-2xl border bg-background p-4">
                                  <p className="text-sm font-semibold text-foreground">Action</p>
                                  <p className="text-sm text-muted-foreground">Send SMS</p>
                                </div>
                                <div className="rounded-2xl border bg-background p-4">
                                  <p className="text-sm font-semibold text-foreground">Split</p>
                                  <p className="text-sm text-muted-foreground">A/B test</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {index === 2 && (
                          <div className="relative rounded-3xl border bg-card/60 p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-muted/30 text-foreground hover:bg-muted/40">Analytics</Badge>
                                <Badge variant="outline" className="border-border text-muted-foreground">
                                  Realtime
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <TrendingUp className="h-4 w-4 text-foreground" />
                                +18% replies
                              </div>
                            </div>
                            <div className="mt-6 grid grid-cols-3 gap-3">
                              <div className="rounded-2xl border bg-background p-4">
                                <p className="text-xs text-muted-foreground">Open rate</p>
                                <p className="mt-1 text-2xl font-bold text-foreground">42%</p>
                              </div>
                              <div className="rounded-2xl border bg-background p-4">
                                <p className="text-xs text-muted-foreground">Reply rate</p>
                                <p className="mt-1 text-2xl font-bold text-foreground">8.1%</p>
                              </div>
                              <div className="rounded-2xl border bg-background p-4">
                                <p className="text-xs text-muted-foreground">Meetings</p>
                                <p className="mt-1 text-2xl font-bold text-foreground">31</p>
                              </div>
                            </div>
                            <div className="mt-6 h-2 w-full rounded-full bg-muted">
                              <div className="h-2 w-2/3 rounded-full bg-foreground" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how-it-works" aria-label="How it works" className="py-20 md:py-28 bg-background">
          <div className={containerClass}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-5">
                <Badge variant="outline" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-border bg-muted/30 text-foreground">
                  <Sparkles className="w-4 h-4" />
                  How it works
                </Badge>
                <h2 className="mt-6 text-[2.1rem] sm:text-[2.6rem] font-bold tracking-tight text-foreground">
                  Go from lead to meeting in <mark className={highlightClass}>minutes</mark>
                </h2>
                <p className="mt-4 text-xl text-muted-foreground leading-relaxed">
                  Import contacts, generate content, automate follow-ups, and track results in one unified workflow.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Button asChild className="rounded-2xl">
                    <a href="#pricing">
                      View Pricing
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl border-border hover:bg-muted/50"
                    onClick={() => navigate('/register')}
                  >
                    Start Free Trial
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-7 grid gap-4">
                {steps.map((step, idx) => {
                  const Icon = step.icon;

                  return (
                    <Card key={step.title} className="border border-border bg-card/60 rounded-2xl">
                      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 text-foreground">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold text-foreground">{step.title}</CardTitle>
                          <CardDescription className="mt-1 text-sm text-muted-foreground">{step.description}</CardDescription>
                        </div>
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          Step {idx + 1}
                        </Badge>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" aria-label="Pricing" className="py-20 md:py-28 bg-muted/30">
          <div className={containerClass}>
            <div className="text-center mb-16">
              <Badge variant="outline" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-border bg-muted/30 text-foreground">
                <Star className="w-4 h-4" />
                Pricing
              </Badge>
              <h2 className="mt-6 text-[2.1rem] sm:text-[2.6rem] font-bold tracking-tight text-foreground">
                Simple pricing that <mark className={highlightClass}>scales</mark>
              </h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Transparent pricing with no hidden fees. Every plan includes a 14-day free trial.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {pricingPlans.map((plan, index) => (
                <Card
                  key={index}
                  className={`relative border rounded-2xl bg-card/60 transition-all duration-300 ${plan.popular
                    ? 'border-foreground/20 shadow-md lg:scale-105'
                    : 'border-border hover:shadow-sm'
                    }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-foreground text-background border-0 px-4 py-2 rounded-full text-sm font-bold shadow-sm">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl font-bold text-foreground">{plan.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">{plan.description}</CardDescription>
                    <div className="mt-6">
                      <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="w-5 h-5 text-foreground mr-3 flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className={`w-full rounded-2xl ${plan.popular
                        ? 'bg-foreground text-background hover:bg-foreground/90 shadow-sm hover:shadow-md'
                        : 'bg-foreground text-background hover:bg-foreground/90'
                        }`}
                      onClick={() => navigate('/register')}
                      size="lg"
                    >
                      Start Free Trial
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <p className="mt-10 text-center text-sm text-muted-foreground">
              Need enterprise onboarding, security reviews, or custom integrations?{' '}
              <button onClick={() => navigate('/register')} className="font-semibold text-foreground hover:underline">
                Contact sales
              </button>
              .
            </p>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" aria-label="Testimonials" className="py-20 md:py-28 bg-background">
          <div className={containerClass}>
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-border bg-muted/30 text-foreground"
              >
                <Star className="w-4 h-4" />
                Customer stories
              </Badge>
              <h2 className="mt-6 text-[2.1rem] sm:text-[2.6rem] font-bold tracking-tight text-foreground">
                Loved by teams that <mark className={highlightClass}>move fast</mark>
              </h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                See how teams run outreach and follow-up workflows with Xordon and drive measurable results.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border border-border bg-card/60 rounded-2xl">
                  <CardContent className="pt-8 pb-6 px-6">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-foreground" fill="currentColor" />
                      ))}
                    </div>
                    <p className="mt-4 text-muted-foreground leading-relaxed">"{testimonial.content}"</p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/30">
                        <span className="text-foreground font-semibold">{testimonial.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {testimonial.role} • {testimonial.company}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" aria-label="Frequently asked questions" className="py-20 md:py-28 bg-muted/30">
          <div className={containerClass}>
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-border bg-muted/30 text-foreground"
              >
                <Shield className="w-4 h-4" />
                FAQ
              </Badge>
              <h2 className="mt-6 text-[2.1rem] sm:text-[2.6rem] font-bold tracking-tight text-foreground">
                Frequently asked <mark className={highlightClass}>questions</mark>
              </h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Quick answers to common questions about trials, workflows, and getting started.
              </p>
            </div>

            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((item, idx) => (
                  <AccordionItem key={item.question} value={`item-${idx}`} className="border-border">
                    <AccordionTrigger className="text-left text-foreground hover:text-foreground/80">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border bg-card/60 p-6">
                <div>
                  <p className="font-semibold text-foreground">Still have questions?</p>
                  <p className="text-sm text-muted-foreground">Email us at support@xordon.com and we'll help you out.</p>
                </div>
                <Button
                  variant="outline"
                  asChild
                  className="rounded-2xl border-border hover:bg-muted/50"
                >
                  <a href="mailto:support@xordon.com">Contact support</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section aria-label="Final call to action" className="py-20 md:py-28 bg-foreground">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge
              variant="outline"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-white/30 bg-white/10 text-white"
            >
              <Rocket className="w-4 h-4" />
              Start building today
            </Badge>
            <h2 className="mt-6 text-[2.1rem] sm:text-[2.6rem] font-bold tracking-tight text-white">
              Ready to build a predictable outreach engine?
            </h2>
            <p className="mt-4 text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Launch sequences, automate follow-ups, and track what converts—all in one platform.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-background text-foreground hover:bg-background/90 font-semibold px-8 py-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
                className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white font-semibold px-8 py-6 rounded-2xl"
              >
                Sign In
              </Button>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center text-sm text-white/80">
              <div className="flex items-center justify-center gap-2">
                <Check className="h-4 w-4" />
                No credit card required
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="h-4 w-4" />
                14-day free trial
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="h-4 w-4" />
                Cancel anytime
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
};

export default Landing;

