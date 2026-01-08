import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Plus,
    Mail,
    Smartphone,
    Users,
    FileTextIcon,
    MessageSquare,
    CreditCard,
    Phone,
    Layout,
    Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface QuickAction {
    id: string;
    label: string;
    icon: any;
    link: string;
    color: string;
}

const actions: QuickAction[] = [
    { id: '1', label: 'Email Campaign', icon: Mail, link: '/reach/outbound/email/campaigns/new', color: 'text-blue-500 bg-blue-500/10' },
    { id: '2', label: 'SMS Campaign', icon: Smartphone, link: '/reach/outbound/sms/campaigns/new', color: 'text-purple-500 bg-purple-500/10' },
    { id: '3', label: 'New Contact', icon: Users, link: '/contacts', color: 'text-emerald-500 bg-emerald-500/10' },
    { id: '4', label: 'Create Form', icon: FileTextIcon, link: '/forms/new', color: 'text-amber-500 bg-amber-500/10' },
    { id: '5', label: 'Register Provider', icon: Star, link: '/marketplace/provider-registration', color: 'text-rose-500 bg-rose-500/10' },
    { id: '6', label: 'New Invoice', icon: CreditCard, link: '/finance/invoices/new', color: 'text-cyan-500 bg-cyan-500/10' },
];

export const QuickActionLaunchpad: React.FC<{ className?: string }> = ({ className }) => {
    const navigate = useNavigate();

    return (
        <Card className={cn("bg-background/50 backdrop-blur-md border-none shadow-xl", className)}>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    Quick Actions
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {actions.map((action) => (
                        <Button
                            key={action.id}
                            variant="ghost"
                            onClick={() => navigate(action.link)}
                            className="h-auto flex-col items-center justify-center py-4 px-2 gap-3 bg-muted/5 hover:bg-muted/10 border border-transparent hover:border-primary/20 rounded-xl transition-all"
                        >
                            <div className={cn("p-2.5 rounded-lg", action.color)}>
                                <action.icon className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-semibold">{action.label}</span>
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

