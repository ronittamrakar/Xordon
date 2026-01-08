import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
    CreditCard,
    Plus,
    DollarSign,
    TrendingUp,
    CheckCircle,
    Clock,
    XCircle,
    Settings,
    FileText,
    Users,
    BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

import {
    consumerFinancingApi,
    FinancingProvider,
    FinancingApplication
} from '@/services/consumerFinancingApi';

export default function ConsumerFinancing() {
    const [providers, setProviders] = useState<FinancingProvider[]>([]);
    const [applications, setApplications] = useState<FinancingApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedApplication, setSelectedApplication] = useState<FinancingApplication | null>(null);
    const [selectedProvider, setSelectedProvider] = useState<FinancingProvider | null>(null);
    const [showConfigureProvider, setShowConfigureProvider] = useState(false);
    const [showViewDetails, setShowViewDetails] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [providersData, applicationsData] = await Promise.all([
                consumerFinancingApi.getProviders(),
                consumerFinancingApi.getApplications()
            ]);
            setProviders(providersData);
            setApplications(applicationsData);
        } catch (error) {
            toast.error('Failed to load data');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const [showNewApplication, setShowNewApplication] = useState(false);
    const [newApp, setNewApp] = useState({
        contactName: '',
        provider: '',
        amount: '',
        term: ''
    });

    const stats = {
        totalApplications: applications.length,
        approved: applications.filter(a => a.status === 'approved').length,
        pending: applications.filter(a => a.status === 'pending').length,
        totalFinanced: applications
            .filter(a => a.status === 'approved')
            .reduce((sum, a) => sum + a.amount, 0)
    };

    const handleCreateApplication = async () => {
        try {
            const newApplication = await consumerFinancingApi.createApplication({
                contactId: Date.now().toString(), // Mock contact ID
                contactName: newApp.contactName,
                provider: newApp.provider,
                amount: parseFloat(newApp.amount),
                term: parseInt(newApp.term)
            });

            setApplications([newApplication, ...applications]);
            setShowNewApplication(false);
            setNewApp({ contactName: '', provider: '', amount: '', term: '' });
            toast.success('Financing application created');
        } catch (error) {
            toast.error('Failed to create application');
        }
    };

    const toggleProvider = async (id: string, currentStatus: boolean) => {
        try {
            const updated = await consumerFinancingApi.updateProvider(id, { enabled: !currentStatus });
            setProviders(providers.map(p => p.id === id ? updated : p));
            toast.success(`Provider ${updated.enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            toast.error('Failed to update provider');
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const updated = await consumerFinancingApi.approveApplication(id);
            setApplications(applications.map(a => a.id === id ? updated : a));
            toast.success('Application approved');
            if (selectedApplication?.id === id) {
                setShowViewDetails(false);
            }
        } catch (error) {
            toast.error('Failed to approve application');
        }
    };

    const handleDecline = async (id: string) => {
        try {
            const updated = await consumerFinancingApi.declineApplication(id);
            setApplications(applications.map(a => a.id === id ? updated : a));
            toast.success('Application declined');
            if (selectedApplication?.id === id) {
                setShowViewDetails(false);
            }
        } catch (error) {
            toast.error('Failed to decline application');
        }
    };

    const openConfigure = (provider: FinancingProvider) => {
        setSelectedProvider(provider);
        setShowConfigureProvider(true);
    };

    const handleUpdateProviderConfig = async () => {
        if (!selectedProvider) return;
        try {
            const updated = await consumerFinancingApi.updateProvider(selectedProvider.id, {
                minAmount: selectedProvider.minAmount,
                maxAmount: selectedProvider.maxAmount,
                apr: selectedProvider.apr
            });
            setProviders(providers.map(p => p.id === selectedProvider.id ? updated : p));
            setShowConfigureProvider(false);
            toast.success('Provider configuration updated');
        } catch (error) {
            toast.error('Failed to update configuration');
        }
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            pending: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
            approved: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
            declined: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
            completed: { variant: 'outline' as const, icon: CheckCircle, color: 'text-blue-600' }
        };

        const config = variants[status as keyof typeof variants];
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="gap-1">
                <Icon className="h-3 w-3" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Consumer Financing</h1>
                    <p className="text-muted-foreground">
                        Offer flexible payment options with Affirm, Klarna, and Afterpay
                    </p>
                </div>
                <Dialog open={showNewApplication} onOpenChange={setShowNewApplication}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Application
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Financing Application</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Customer Name</Label>
                                <Input
                                    value={newApp.contactName}
                                    onChange={(e) => setNewApp({ ...newApp, contactName: e.target.value })}
                                    placeholder="Enter customer name"
                                />
                            </div>
                            <div>
                                <Label>Financing Provider</Label>
                                <Select value={newApp.provider} onValueChange={(v) => setNewApp({ ...newApp, provider: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select provider" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {providers.filter(p => p.enabled).map(provider => (
                                            <SelectItem key={provider.id} value={provider.name}>
                                                {provider.logo} {provider.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Loan Amount</Label>
                                <Input
                                    type="number"
                                    value={newApp.amount}
                                    onChange={(e) => setNewApp({ ...newApp, amount: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <Label>Term (months)</Label>
                                <Select value={newApp.term} onValueChange={(v) => setNewApp({ ...newApp, term: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select term" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {providers.find(p => p.name === newApp.provider)?.terms.map(term => (
                                            <SelectItem key={term} value={term}>
                                                {term} months
                                            </SelectItem>
                                        )) || <SelectItem value="12">12 months</SelectItem>}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setShowNewApplication(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateApplication}
                                    disabled={!newApp.contactName || !newApp.provider || !newApp.amount || !newApp.term}
                                >
                                    Create Application
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={showViewDetails} onOpenChange={setShowViewDetails}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Application Details</DialogTitle>
                        </DialogHeader>
                        {selectedApplication && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Customer</Label>
                                        <div className="font-medium">{selectedApplication.contactName}</div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Status</Label>
                                        <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Provider</Label>
                                        <div className="font-medium">{selectedApplication.provider}</div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Amount</Label>
                                        <div className="font-medium">${selectedApplication.amount.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Term</Label>
                                        <div className="font-medium">{selectedApplication.term} months</div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Date Applied</Label>
                                        <div className="font-medium">{new Date(selectedApplication.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>

                                {selectedApplication.status === 'pending' && (
                                    <div className="flex justify-end gap-2 pt-4 border-t">
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleDecline(selectedApplication.id)}
                                        >
                                            Decline
                                        </Button>
                                        <Button
                                            onClick={() => handleApprove(selectedApplication.id)}
                                        >
                                            Approve
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog open={showConfigureProvider} onOpenChange={setShowConfigureProvider}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Configure Provider</DialogTitle>
                        </DialogHeader>
                        {selectedProvider && (
                            <div className="space-y-4">
                                <div>
                                    <Label>Min Loan Amount</Label>
                                    <Input
                                        type="number"
                                        value={selectedProvider.minAmount}
                                        onChange={(e) => setSelectedProvider({ ...selectedProvider, minAmount: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <Label>Max Loan Amount</Label>
                                    <Input
                                        type="number"
                                        value={selectedProvider.maxAmount}
                                        onChange={(e) => setSelectedProvider({ ...selectedProvider, maxAmount: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <Label>APR Range</Label>
                                    <Input
                                        value={selectedProvider.apr}
                                        onChange={(e) => setSelectedProvider({ ...selectedProvider, apr: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setShowConfigureProvider(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleUpdateProviderConfig}>
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalApplications}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Financed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.totalFinanced.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="applications" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="applications">
                        <FileText className="h-4 w-4 mr-2" />
                        Applications
                    </TabsTrigger>
                    <TabsTrigger value="providers">
                        <Settings className="h-4 w-4 mr-2" />
                        Providers
                    </TabsTrigger>
                    <TabsTrigger value="analytics">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="applications" className="space-y-4">
                    {applications.map(app => (
                        <Card key={app.id}>
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold">{app.contactName}</h3>
                                            {getStatusBadge(app.status)}
                                        </div>
                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                            <span>Provider: {app.provider}</span>
                                            <span>Amount: ${app.amount.toLocaleString()}</span>
                                            <span>Term: {app.term} months</span>
                                            <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedApplication(app);
                                                setShowViewDetails(true);
                                            }}
                                        >
                                            View Details
                                        </Button>
                                        {app.status === 'pending' && (
                                            <>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => handleApprove(app.id)}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDecline(app.id)}
                                                >
                                                    Decline
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="providers" className="space-y-4">
                    {providers.map(provider => (
                        <Card key={provider.id}>
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl">{provider.logo}</div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{provider.name}</h3>
                                            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                                <span>Range: ${provider.minAmount} - ${provider.maxAmount.toLocaleString()}</span>
                                                <span>APR: {provider.apr}</span>
                                                <span>Terms: {provider.terms.join(', ')} months</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={provider.enabled}
                                                onCheckedChange={() => toggleProvider(provider.id, provider.enabled)}
                                            />
                                            <Label>{provider.enabled ? 'Enabled' : 'Disabled'}</Label>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openConfigure(provider)}
                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Configure
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="analytics">
                    <Card>
                        <CardHeader>
                            <CardTitle>Financing Analytics</CardTitle>
                            <CardDescription>Performance metrics and trends</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-semibold mb-3">Approval Rate by Provider</h4>
                                    <div className="space-y-2">
                                        {providers.map(provider => {
                                            const providerApps = applications.filter(a => a.provider === provider.name);
                                            const approved = providerApps.filter(a => a.status === 'approved').length;
                                            const rate = providerApps.length > 0 ? (approved / providerApps.length * 100).toFixed(1) : '0';

                                            return (
                                                <div key={provider.id} className="flex items-center gap-4">
                                                    <div className="w-32">{provider.name}</div>
                                                    <div className="flex-1 bg-muted rounded-full h-2">
                                                        <div
                                                            className="bg-green-600 h-2 rounded-full"
                                                            style={{ width: `${rate}%` }}
                                                        />
                                                    </div>
                                                    <div className="w-16 text-right">{rate}%</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-3">Average Loan Amount</h4>
                                    <div className="text-2xl font-bold">
                                        ${applications.length > 0
                                            ? (applications.reduce((sum, a) => sum + a.amount, 0) / applications.length).toFixed(2)
                                            : '0.00'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
