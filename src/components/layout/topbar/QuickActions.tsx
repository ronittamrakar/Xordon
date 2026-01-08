import {
    Plus,
    Zap,
    FilePlus,
    UserPlus,
    Calendar,
    DollarSign,
    Ticket,
    Briefcase,
    Star,
    TrendingUp,
    FileText,
    CheckSquare,
    Mail,
    MessageSquare,
    ShoppingCart,
    Bot
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';

export function QuickActions() {
    const location = useLocation();
    const navigate = useNavigate();
    const path = location.pathname;

    const getActions = () => {
        // Marketing / Campaigns / Reach
        if (path.includes('/campaigns') || path.includes('/marketing') || path.includes('/reach')) {
            return [
                { label: 'New Email Campaign', icon: Mail, action: () => navigate('/reach/outbound/email/campaigns/new') },
                { label: 'New SMS Campaign', icon: MessageSquare, action: () => navigate('/reach/outbound/sms/campaigns/new') },
                { label: 'Create Form', icon: FilePlus, action: () => navigate('/forms/new') },
            ];
        }

        // CRM / Contacts / Sales
        if (path.includes('/contacts') || path.includes('/crm') || path.includes('/sales')) {
            return [
                { label: 'Add Contact', icon: UserPlus, action: () => navigate('/contacts?action=new') },
                { label: 'New Deal', icon: DollarSign, action: () => navigate('/crm/deals?action=new') },
                { label: 'New Opportunity', icon: TrendingUp, action: () => navigate('/sales/opportunities/new') },
                { label: 'New Task', icon: CheckSquare, action: () => navigate('/crm/tasks?action=new') },
            ];
        }

        // Scheduling / Calendar
        if (path.includes('/scheduling') || path.includes('/appointments') || path.includes('/calendar')) {
            return [
                { label: 'New Appointment', icon: Calendar, action: () => navigate('/scheduling/appointments/new') },
                { label: 'Block Time', icon: Calendar, action: () => navigate('/scheduling/calendar?action=block') },
            ];
        }

        // Finance
        if (path.includes('/finance') || path.includes('/invoices') || path.includes('/payments')) {
            return [
                { label: 'New Invoice', icon: FileText, action: () => navigate('/finance/invoices/new') },
                { label: 'Record Payment', icon: DollarSign, action: () => navigate('/finance/payments/new') },
                { label: 'New Estimate', icon: FilePlus, action: () => navigate('/finance/estimates/new') },
            ];
        }

        // Helpdesk
        if (path.includes('/helpdesk')) {
            return [
                { label: 'New Ticket', icon: Ticket, action: () => navigate('/helpdesk/tickets/new') },
            ];
        }

        // HR / People
        if (path.includes('/hr') || path.includes('/employees')) {
            return [
                { label: 'Add Employee', icon: Briefcase, action: () => navigate('/hr/employees/new') },
                { label: 'Log Time', icon: Calendar, action: () => navigate('/hr/time-tracking?action=log') },
            ];
        }

        // Reputation
        if (path.includes('/reputation')) {
            return [
                { label: 'Request Review', icon: Star, action: () => navigate('/reputation/requests/new') },
            ];
        }

        // Ecommerce
        if (path.includes('/ecommerce')) {
            return [
                { label: 'Add Product', icon: ShoppingCart, action: () => navigate('/ecommerce/products/new') },
            ];
        }

        // AI
        if (path.includes('/ai')) {
            return [
                { label: 'New Agent', icon: Bot, action: () => navigate('/ai/agents/new') },
            ];
        }

        // Default / Dashboard
        return [
            { label: 'New Task', icon: CheckSquare, action: () => navigate('/crm/tasks?action=new') },
            { label: 'Quick Report', icon: Zap, action: () => navigate('/reports') },
            { label: 'New Contact', icon: UserPlus, action: () => navigate('/contacts?action=new') },
        ];
    };

    const actions = getActions();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Quick Action</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {actions.map((action, i) => (
                    <DropdownMenuItem key={i} onClick={action.action} className="gap-2 cursor-pointer">
                        <action.icon className="h-4 w-4 text-muted-foreground" />
                        <span>{action.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default QuickActions;
