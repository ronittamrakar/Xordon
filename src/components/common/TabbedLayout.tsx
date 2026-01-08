import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Plus } from 'lucide-react';

interface TabbedLayoutProps {
  children: React.ReactNode;
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    badge?: string | number;
    disabled?: boolean;
  }>;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'card';
}

/**
 * Reusable tabbed layout component for consolidated pages
 * Used in Agency Management Hub and Client Management Hub
 */
export function TabbedLayout({ 
  children, 
  tabs, 
  activeTab, 
  onTabChange, 
  title, 
  description, 
  actions, 
  className = '',
  variant = 'default'
}: TabbedLayoutProps) {
  const [internalActiveTab, setInternalActiveTab] = React.useState(activeTab || tabs[0]?.id);

  const currentTab = activeTab || internalActiveTab;

  const handleTabChange = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };

  const renderTabList = () => (
    <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
      {tabs.map((tab) => (
        <TabsTrigger 
          key={tab.id} 
          value={tab.id} 
          disabled={tab.disabled}
          className="flex items-center gap-2"
        >
          {tab.icon && <span className="text-sm">{tab.icon}</span>}
          <span>{tab.label}</span>
          {tab.badge && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
              {tab.badge}
            </span>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  );

  if (variant === 'card') {
    return (
      <Card className={className}>
        {(title || description || actions) && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                {title && <CardTitle>{title}</CardTitle>}
                {description && <CardDescription>{description}</CardDescription>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          </CardHeader>
        )}
        <CardContent className="p-0">
          {renderTabList()}
          <div className="p-6">
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id}>
                {children}
              </TabsContent>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {(title || description || actions) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h1 className="text-2xl font-bold">{title}</h1>}
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        {renderTabList()}
        
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            {children}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface TabContentProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standardized tab content wrapper
 */
export function TabContent({ children, title, description, actions, className = '' }: TabContentProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {(title || description || actions) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h2 className="text-xl font-semibold">{title}</h2>}
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

/**
 * Standardized page header component
 */
export function PageHeader({ title, description, actions, breadcrumbs, className = '' }: PageHeaderProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {breadcrumbs && (
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-foreground">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && <span>›</span>}
            </React.Fragment>
          ))}
        </nav>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  illustration?: React.ReactNode;
  className?: string;
}

/**
 * Standardized empty state component
 */
export function EmptyState({ title, description, action, illustration, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {illustration && (
        <div className="mb-6 flex justify-center">
          {illustration}
        </div>
      )}
      
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-muted-foreground mb-6">{description}</p>}
      
      {action && (
        <Button onClick={action.onClick} className="gap-2">
          {action.icon}
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Standardized loading state component
 */
export function LoadingState({ message = 'Loading...', size = 'md', className = '' }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-muted border-t-primary ${sizeClasses[size]}`}></div>
      {message && <span className="ml-3 text-muted-foreground">{message}</span>}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Standardized error state component
 */
export function ErrorState({ message, onRetry, className = '' }: ErrorStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mb-4 text-destructive">
        <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold mb-2 text-destructive">Error</h3>
      <p className="text-muted-foreground mb-6">{message}</p>
      
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
}