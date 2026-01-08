import { Heart, Github, Twitter, Linkedin } from 'lucide-react';
import { BrandWordmark } from '@/components/BrandWordmark';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-background/90">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <BrandWordmark className="whitespace-nowrap" textClassName="text-2xl text-foreground" casing="lower" />
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              Unified outreach + CRM + automation for modern revenue teams. Launch campaigns, automate follow-ups, and track what converts.
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>for teams that move fast</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a></li>
              <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/login" className="hover:text-foreground transition-colors">Sign In</a></li>
              <li><a href="/register" className="hover:text-foreground transition-colors">Start Free Trial</a></li>
              <li><a href="mailto:support@xordon.com" className="hover:text-foreground transition-colors">Contact Support</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-sm text-muted-foreground">
              © {currentYear} Xordon. All rights reserved.
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/xordon" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com/xordon" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://linkedin.com/company/xordon" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
