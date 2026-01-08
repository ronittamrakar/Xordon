import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Inbox, Star, FileTextIcon, MessageSquare, CalendarDays,
  Settings, Wallet, Map, List, Tag, Briefcase, UserPlus, Quote
} from 'lucide-react';

const navItems = [
  { path: '/lead-marketplace/inbox', label: 'Inbox', icon: Inbox },
  { path: '/lead-marketplace/leads', label: 'Leads', icon: List },
  { path: '/lead-marketplace/booking', label: 'Booking', icon: CalendarDays },
  { path: '/lead-marketplace/messaging', label: 'Messages', icon: MessageSquare },
  { path: '/lead-marketplace/reviews', label: 'Reviews', icon: Star },
  { path: '/lead-marketplace/documents', label: 'Documents', icon: FileTextIcon },
  { path: '/lead-marketplace/wallet', label: 'Wallet', icon: Wallet },
  { path: '/lead-marketplace/templates', label: 'Templates', icon: Quote },
  { path: '/lead-marketplace/preferences', label: 'Settings', icon: Settings },
  { path: '/lead-marketplace/pricing-rules', label: 'Pricing Rules', icon: Tag },
  { path: '/lead-marketplace/services', label: 'Services', icon: Briefcase },
  { path: '/lead-marketplace/register', label: 'Register', icon: UserPlus },
  { path: '/lead-marketplace/quotes', label: 'Get Quote', icon: Quote },
];

export function MarketplaceNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 border-b mb-6">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <Button
            key={item.path}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate(item.path)}
            className="whitespace-nowrap"
          >
            <Icon className="h-4 w-4 mr-2" />
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}

