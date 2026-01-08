import { Link, useLocation } from 'react-router-dom';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';
import React from 'react';

const segmentLabelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    email: 'Email',
    sms: 'SMS',
    calls: 'Calls',
    campaigns: 'Campaigns',
    sequences: 'Sequences',
    templates: 'Templates',
    replies: 'Replies',
    unsubscribers: 'Unsubscribers',
    settings: 'Settings',
    contacts: 'Contacts',
    reports: 'Reports',
    forms: 'Forms',
    'client-portal': 'Dashboard',
    proposals: 'Proposals',
    helpdesk: 'Helpdesk',
    ai: 'AI Tools',
    agency: 'Agency',
};

const formatSegmentLabel = (segment: string) => {
    const normalized = segment.toLowerCase();
    if (segmentLabelMap[normalized]) {
        return segmentLabelMap[normalized];
    }

    // Handle IDs (UUIDs or numeric)
    if (/^[0-9a-f-]{8,}$/i.test(segment) || /^\d+$/.test(segment)) {
        return 'Details';
    }

    return segment
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

export function BreadcrumbNavigation() {
    const location = useLocation();
    const pathSegments = location.pathname.split('/').filter(Boolean);

    if (pathSegments.length === 0) {
        return null;
    }

    return (
        <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link to="/" className="flex items-center gap-1">
                            <Home className="h-3.5 w-3.5" />
                            <span className="sr-only">Home</span>
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {pathSegments.map((segment, index) => {
                    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathSegments.length - 1;
                    const label = formatSegmentLabel(segment);

                    return (
                        <React.Fragment key={path}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link to={path}>{label}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
