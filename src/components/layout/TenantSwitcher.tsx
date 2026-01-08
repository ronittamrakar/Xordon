/**
 * TenantSwitcher - Sidebar component for switching between agencies and sub-accounts
 */

import { Check, Building2, ChevronDown, User, ArrowRight, Plus, Settings, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useTenantOptional } from '@/contexts/TenantContext';

interface TenantSwitcherProps {
    collapsed?: boolean;
}

export function TenantSwitcher({ collapsed = false }: TenantSwitcherProps) {
    const tenant = useTenantOptional();
    const navigate = useNavigate();

    if (!tenant) {
        return null;
    }

    const {
        currentAgency,
        currentSubaccount,
        agencies,
        subaccounts,
        switchToAgency,
        switchToSubaccount,
        clearSubaccount,
        isAgencyAdmin,
        subaccountLabel,
        subaccountLabelPlural,
    } = tenant;

    const displayName = currentSubaccount?.name || currentAgency?.name || 'Select Account';
    const displayType = currentSubaccount ? subaccountLabel : 'Agency';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {collapsed ? (
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg">
                        <Building2 className="h-5 w-5" />
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-12 w-full justify-between gap-2 px-3 bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group"
                    >
                        <div className="flex items-center gap-3 min-w-0 text-left">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                {currentSubaccount ? (
                                    <User className="h-4 w-4" />
                                ) : (
                                    <Building2 className="h-4 w-4" />
                                )}
                            </div>
                            <div className="flex flex-col min-w-0 leading-none gap-1">
                                <span className="truncate text-sm font-semibold text-foreground">{displayName}</span>
                                <span className="truncate text-xs text-muted-foreground font-normal">{displayType}</span>
                            </div>
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                    </Button>
                )}
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-[280px] p-2" sideOffset={8}>
                {/* Current Agency Section */}
                <div className="px-2 py-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Agency</span>
                    <Badge variant="secondary" className="text-[12px] h-5 px-1.5 font-medium bg-muted text-muted-foreground hover:bg-muted">
                        {currentAgency?.role || 'admin'}
                    </Badge>
                </div>

                {agencies.map((agency) => (
                    <DropdownMenuItem
                        key={agency.id}
                        onClick={() => switchToAgency(agency.id)}
                        className="flex items-center justify-between py-2.5 cursor-pointer"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex flex-col min-w-0 gap-0.5">
                                <span className="truncate font-medium text-sm">{agency.name}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {agency.subaccount_count > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[12px] font-medium text-muted-foreground">
                                    {agency.subaccount_count}
                                </span>
                            )}
                            {currentAgency?.id === agency.id && !currentSubaccount && (
                                <Check className="h-4 w-4 text-primary ml-auto" />
                            )}
                        </div>
                    </DropdownMenuItem>
                ))}

                {/* Clients Section */}
                {currentAgency && subaccounts.length > 0 && (
                    <>
                        <DropdownMenuSeparator className="my-2" />
                        <div className="px-2 py-1.5 flex items-center justify-between group">
                            <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">{subaccountLabelPlural}</span>
                            {currentSubaccount && (
                                <span
                                    className="text-[12px] font-medium text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        clearSubaccount();
                                    }}
                                >
                                    Back to Agency
                                </span>
                            )}
                        </div>

                        <div className="space-y-0.5">
                            {subaccounts.slice(0, 5).map((sub) => (
                                <DropdownMenuItem
                                    key={sub.id}
                                    onClick={() => switchToSubaccount(sub.id)}
                                    className="flex items-center justify-between py-2.5 cursor-pointer group/item"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background group-hover/item:border-primary/50 group-hover/item:bg-primary/5 transition-colors">
                                            <User className="h-4 w-4 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                        </div>
                                        <div className="flex flex-col min-w-0 gap-0.5">
                                            <span className="truncate font-medium text-sm">{sub.name}</span>
                                            <span className="truncate text-xs text-muted-foreground">{sub.industry || 'General'}</span>
                                        </div>
                                    </div>
                                    {currentSubaccount?.id === sub.id && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </div>

                        {subaccounts.length > 5 && (
                            <DropdownMenuItem
                                onClick={() => navigate('/agency/sub-accounts')}
                                className="mt-1 py-2 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <ArrowRight className="h-3.5 w-3.5 mr-2" />
                                <span className="text-xs font-medium">View all {subaccounts.length} {subaccountLabelPlural.toLowerCase()}</span>
                            </DropdownMenuItem>
                        )}
                    </>
                )}

                {/* Footer Actions */}
                <DropdownMenuSeparator className="my-2" />

                {isAgencyAdmin && (
                    <DropdownMenuItem
                        onClick={() => navigate('/agency/sub-accounts')}
                        className="py-2.5 cursor-pointer"
                    >
                        <Plus className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">Create {subaccountLabel}</span>
                    </DropdownMenuItem>
                )}

                <DropdownMenuItem
                    onClick={() => navigate('/agency/settings')}
                    className="py-2.5 cursor-pointer"
                >
                    <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Agency Settings</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default TenantSwitcher;
