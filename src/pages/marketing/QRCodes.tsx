import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    QrCode,
    Plus,
    Download,
    Copy,
    Eye,
    Trash2,
    RefreshCw,
    Search,
    Filter,
    BarChart3,
    Calendar,
    Link2,
    Phone,
    Mail,
    Wifi,
    CreditCard,
    Globe,
    FileText,
    Star,
    MoreVertical,
    Palette,
    Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import * as qrCodeApi from '@/services/qrCodeApi';
import bookingPagesApi from '@/services/bookingPagesApi';
import webformsApi from '@/services/webformsApi';
import paymentsApi from '@/services/paymentsApi';
import { websitesApi } from '@/lib/websitesApi';
import reputationApi from '@/services/reputationApi';

const TYPE_ICONS: Record<qrCodeApi.QRCodeType, React.ReactNode> = {
    booking_page: <Calendar className="w-4 h-4" />,
    review_request: <Star className="w-4 h-4" />,
    payment_link: <CreditCard className="w-4 h-4" />,
    contact_card: <FileText className="w-4 h-4" />,
    website: <Globe className="w-4 h-4" />,
    form: <FileText className="w-4 h-4" />,
    custom_url: <Link2 className="w-4 h-4" />,
    phone: <Phone className="w-4 h-4" />,
    sms: <Phone className="w-4 h-4" />,
    email: <Mail className="w-4 h-4" />,
    wifi: <Wifi className="w-4 h-4" />,
};

const TYPE_LABELS: Record<qrCodeApi.QRCodeType, string> = {
    booking_page: 'Booking Page',
    review_request: 'Review Request',
    payment_link: 'Payment Link',
    contact_card: 'Contact Card',
    website: 'Website',
    form: 'Form',
    custom_url: 'Custom URL',
    phone: 'Phone Number',
    sms: 'SMS',
    email: 'Email',
    wifi: 'WiFi Network',
};

export default function QRCodes() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showStyleDialog, setShowStyleDialog] = useState(false);
    const [selectedQRCode, setSelectedQRCode] = useState<qrCodeApi.QRCode | null>(null);
    const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);

    // Create form state
    const [createForm, setCreateForm] = useState<{
        type: qrCodeApi.QRCodeType;
        name: string;
        url: string;
        data: {
            phone_number?: string;
            email?: string;
            subject?: string;
            body?: string;
            ssid?: string;
            password?: string;
            encryption?: 'WPA' | 'WEP' | 'nopass';
        };
    }>({
        type: 'custom_url',
        name: '',
        url: '',
        data: {},
        entity_id: undefined as string | undefined,
        entity_type: undefined as string | undefined,
    });

    // Style state
    const [styleForm, setStyleForm] = useState<Partial<qrCodeApi.QRCodeStyle>>({
        size: 300,
        margin: 2,
        foreground_color: '#000000',
        background_color: '#FFFFFF',
        dot_style: 'square',
        corner_style: 'square',
        corner_dot_style: 'square',
    });

    // Queries
    const { data: qrCodes, isLoading } = useQuery({
        queryKey: ['qr-codes', activeTab],
        queryFn: () =>
            qrCodeApi.listQRCodes({
                type: activeTab !== 'all' ? (activeTab as qrCodeApi.QRCodeType) : undefined,
            }),
    });

    const { data: analytics } = useQuery({
        queryKey: ['qr-analytics', selectedQRCode?.id],
        queryFn: () => qrCodeApi.getAnalytics(selectedQRCode!.id),
        enabled: !!selectedQRCode && showAnalyticsDialog,
    });

    const { data: overallAnalytics } = useQuery({
        queryKey: ['qr-overall-analytics'],
        queryFn: () => qrCodeApi.getOverallAnalytics(),
    });

    // Entity Queries
    const { data: bookingPages } = useQuery({
        queryKey: ['booking-pages'],
        queryFn: () => bookingPagesApi.list(),
        enabled: showCreateDialog && createForm.type === 'booking_page',
    });

    const { data: websites } = useQuery({
        queryKey: ['websites'],
        queryFn: () => websitesApi.getWebsites(),
        enabled: showCreateDialog && createForm.type === 'website',
    });

    const { data: forms } = useQuery({
        queryKey: ['forms'],
        queryFn: () => webformsApi.getForms().then(res => res.data),
        enabled: showCreateDialog && createForm.type === 'form',
    });

    const { data: paymentLinks } = useQuery({
        queryKey: ['payment-links'],
        queryFn: () => paymentsApi.listPaymentLinks(),
        enabled: showCreateDialog && createForm.type === 'payment_link',
    });

    const { data: reviewWidgets } = useQuery({
        queryKey: ['review-widgets'],
        queryFn: () => reputationApi.getWidgets(),
        enabled: showCreateDialog && createForm.type === 'review_request',
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: Parameters<typeof qrCodeApi.generateQRCode>[0]) =>
            qrCodeApi.generateQRCode(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
            queryClient.invalidateQueries({ queryKey: ['qr-overall-analytics'] });
            setShowCreateDialog(false);
            resetCreateForm();
            toast.success('QR code created!');
        },
        onError: () => toast.error('Failed to create QR code'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => qrCodeApi.deleteQRCode(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
            toast.success('QR code deleted');
        },
        onError: () => toast.error('Failed to delete QR code'),
    });

    const regenerateMutation = useMutation({
        mutationFn: ({ id, style }: { id: string; style: Partial<qrCodeApi.QRCodeStyle> }) =>
            qrCodeApi.regenerateImage(id, style),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
            setShowStyleDialog(false);
            toast.success('QR code updated!');
        },
        onError: () => toast.error('Failed to update QR code'),
    });

    const resetCreateForm = () => {
        setCreateForm({
            type: 'custom_url',
            name: '',
            url: '',
            data: {},
            entity_id: undefined,
            entity_type: undefined,
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const downloadQRCode = async (id: string, format: 'png' | 'svg') => {
        try {
            const { download_url } = await qrCodeApi.downloadQRCode(id, format);
            window.open(download_url, '_blank');
        } catch {
            toast.error('Failed to download');
        }
    };

    const filteredQRCodes = qrCodes?.data?.filter((qr) =>
        qr.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderCreateFormFields = () => {
        switch (createForm.type) {
            case 'custom_url':
                return (
                    <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                            placeholder="https://example.com"
                            value={createForm.url}
                            onChange={(e) => setCreateForm({ ...createForm, url: e.target.value })}
                        />
                    </div>
                );
            case 'phone':
                return (
                    <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                            placeholder="+1 (555) 123-4567"
                            value={createForm.data.phone_number || ''}
                            onChange={(e) =>
                                setCreateForm({
                                    ...createForm,
                                    data: { ...createForm.data, phone_number: e.target.value },
                                })
                            }
                        />
                    </div>
                );
            case 'sms':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                                placeholder="+1 (555) 123-4567"
                                value={createForm.data.phone_number || ''}
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        data: { ...createForm.data, phone_number: e.target.value },
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Pre-filled Message (Optional)</Label>
                            <Input
                                placeholder="Message..."
                                value={createForm.data.body || ''}
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        data: { ...createForm.data, body: e.target.value },
                                    })
                                }
                            />
                        </div>
                    </div>
                );
            case 'email':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input
                                placeholder="hello@example.com"
                                value={createForm.data.email || ''}
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        data: { ...createForm.data, email: e.target.value },
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Subject (Optional)</Label>
                            <Input
                                placeholder="Subject..."
                                value={createForm.data.subject || ''}
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        data: { ...createForm.data, subject: e.target.value },
                                    })
                                }
                            />
                        </div>
                    </div>
                );
            case 'wifi':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Network Name (SSID)</Label>
                            <Input
                                placeholder="MyWiFi"
                                value={createForm.data.ssid || ''}
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        data: { ...createForm.data, ssid: e.target.value },
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input
                                type="password"
                                placeholder="Password..."
                                value={createForm.data.password || ''}
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        data: { ...createForm.data, password: e.target.value },
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Security Type</Label>
                            <Select
                                value={createForm.data.encryption || 'WPA'}
                                onValueChange={(v: 'WPA' | 'WEP' | 'nopass') =>
                                    setCreateForm({
                                        ...createForm,
                                        data: { ...createForm.data, encryption: v },
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="WPA">WPA/WPA2</SelectItem>
                                    <SelectItem value="WEP">WEP</SelectItem>
                                    <SelectItem value="nopass">No Password</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                );
            case 'booking_page':
                return (
                    <div className="space-y-2">
                        <Label>Select Booking Page</Label>
                        <Select
                            value={createForm.entity_id ? String(createForm.entity_id) : undefined}
                            onValueChange={(v) =>
                                setCreateForm({ ...createForm, entity_id: v, entity_type: 'booking_page' })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a booking page" />
                            </SelectTrigger>
                            <SelectContent>
                                {bookingPages?.map((page) => (
                                    <SelectItem key={page.id} value={String(page.id)}>
                                        {page.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );
            case 'website':
                return (
                    <div className="space-y-2">
                        <Label>Select Website</Label>
                        <Select
                            value={createForm.entity_id ? String(createForm.entity_id) : undefined}
                            onValueChange={(v) =>
                                setCreateForm({ ...createForm, entity_id: v, entity_type: 'website' })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a website" />
                            </SelectTrigger>
                            <SelectContent>
                                {websites?.map((site) => (
                                    <SelectItem key={site.id} value={site.id}>
                                        {site.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );
            case 'form':
                return (
                    <div className="space-y-2">
                        <Label>Select Form</Label>
                        <Select
                            value={createForm.entity_id ? String(createForm.entity_id) : undefined}
                            onValueChange={(v) =>
                                setCreateForm({ ...createForm, entity_id: v, entity_type: 'form' })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a form" />
                            </SelectTrigger>
                            <SelectContent>
                                {forms?.map((form) => (
                                    <SelectItem key={form.id} value={String(form.id)}>
                                        {form.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );
            case 'payment_link':
                return (
                    <div className="space-y-2">
                        <Label>Select Payment Link</Label>
                        <Select
                            value={createForm.entity_id ? String(createForm.entity_id) : undefined}
                            onValueChange={(v) =>
                                setCreateForm({ ...createForm, entity_id: v, entity_type: 'payment_link' })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a payment link" />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentLinks?.map((link) => (
                                    <SelectItem key={link.id} value={String(link.id)}>
                                        {link.name} ({link.currency} {link.amount})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );
            case 'review_request':
                return (
                    <div className="space-y-2">
                        <Label>Select Review Widget</Label>
                        <Select
                            value={createForm.entity_id ? String(createForm.entity_id) : undefined}
                            onValueChange={(v) =>
                                setCreateForm({ ...createForm, entity_id: v, entity_type: 'review_widget' })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a review widget" />
                            </SelectTrigger>
                            <SelectContent>
                                {reviewWidgets?.map((widget) => (
                                    <SelectItem key={widget.id} value={String(widget.id)}>
                                        {widget.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );
            case 'contact_card':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input
                                    placeholder="John"
                                    value={createForm.data.first_name || ''}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            data: { ...createForm.data, first_name: e.target.value },
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input
                                    placeholder="Doe"
                                    value={createForm.data.last_name || ''}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            data: { ...createForm.data, last_name: e.target.value },
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                                placeholder="+1 234 567 8900"
                                value={createForm.data.phone || ''}
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        data: { ...createForm.data, phone: e.target.value },
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                placeholder="john@example.com"
                                type="email"
                                value={createForm.data.email || ''}
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        data: { ...createForm.data, email: e.target.value },
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Organization</Label>
                            <Input
                                placeholder="Company Inc."
                                value={createForm.data.organization || ''}
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        data: { ...createForm.data, organization: e.target.value },
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Website</Label>
                            <Input
                                placeholder="https://example.com"
                                value={createForm.data.url || ''}
                                onChange={(e) =>
                                    setCreateForm({
                                        ...createForm,
                                        data: { ...createForm.data, url: e.target.value },
                                    })
                                }
                            />
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="p-4 rounded-lg bg-muted text-center text-muted-foreground">
                        Entity selection will appear here for {TYPE_LABELS[createForm.type]}
                    </div>
                );
        }
    };

    return (
        <div className="container py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">QR Codes</h1>
                    <p className="text-muted-foreground">
                        Generate QR codes for booking, payments, reviews, and more
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create QR Code
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total QR Codes</CardDescription>
                        <CardTitle className="text-2xl">
                            {overallAnalytics?.total_qr_codes || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Scans</CardDescription>
                        <CardTitle className="text-2xl">
                            {overallAnalytics?.total_scans?.toLocaleString() || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Top Performer</CardDescription>
                        <CardTitle className="text-lg truncate">
                            {overallAnalytics?.top_performing?.[0]?.name || '-'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground">
                            {overallAnalytics?.top_performing?.[0]?.scans || 0} scans
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Scans Today</CardDescription>
                        <CardTitle className="text-2xl text-green-600">
                            {overallAnalytics?.scans_trend?.slice(-1)?.[0]?.count || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex-wrap h-auto">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="booking_page">Booking</TabsTrigger>
                    <TabsTrigger value="review_request">Reviews</TabsTrigger>
                    <TabsTrigger value="payment_link">Payments</TabsTrigger>
                    <TabsTrigger value="custom_url">URLs</TabsTrigger>
                    <TabsTrigger value="wifi">WiFi</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                    {/* Search */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search QR codes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Grid */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredQRCodes?.length === 0 ? (
                        <Card className="border-2 border-dashed">
                            <CardContent className="py-12 text-center">
                                <QrCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-1">No QR codes yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Create your first QR code to get started
                                </p>
                                <Button onClick={() => setShowCreateDialog(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create QR Code
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredQRCodes?.map((qr) => (
                                <Card key={qr.id} className="group relative overflow-hidden">
                                    <CardContent className="p-4">
                                        <div className="aspect-square bg-white rounded-lg flex items-center justify-center mb-4 border">
                                            <img
                                                src={qr.image_url || '/placeholder-qr.png'}
                                                alt={qr.name}
                                                className="w-full h-full object-contain p-2"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjE0Ij5RUiBDb2RlPC90ZXh0Pjwvc3ZnPg==';
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-medium truncate">{qr.name}</h3>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => copyToClipboard(qr.url)}>
                                                            <Copy className="w-4 h-4 mr-2" />
                                                            Copy URL
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => downloadQRCode(qr.id, 'png')}>
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Download PNG
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => downloadQRCode(qr.id, 'svg')}>
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Download SVG
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedQRCode(qr);
                                                                setStyleForm(qr.style);
                                                                setShowStyleDialog(true);
                                                            }}
                                                        >
                                                            <Palette className="w-4 h-4 mr-2" />
                                                            Customize Style
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedQRCode(qr);
                                                                setShowAnalyticsDialog(true);
                                                            }}
                                                        >
                                                            <BarChart3 className="w-4 h-4 mr-2" />
                                                            View Analytics
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => deleteMutation.mutate(qr.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {TYPE_ICONS[qr.type]}
                                                    <span className="ml-1">{TYPE_LABELS[qr.type]}</span>
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <span>{qr.scan_count} scans</span>
                                                <span>{new Date(qr.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create QR Code</DialogTitle>
                        <DialogDescription>Generate a new QR code</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>QR Code Type</Label>
                            <Select
                                value={createForm.type}
                                onValueChange={(v: qrCodeApi.QRCodeType) =>
                                    setCreateForm({ ...createForm, type: v, data: {} })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            <div className="flex items-center gap-2">
                                                {TYPE_ICONS[value as qrCodeApi.QRCodeType]}
                                                {label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                placeholder="My QR Code"
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                            />
                        </div>

                        {renderCreateFormFields()}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() =>
                                createMutation.mutate({
                                    type: createForm.type,
                                    name: createForm.name,
                                    url: createForm.url || undefined,
                                    data: Object.keys(createForm.data).length > 0 ? createForm.data : undefined,
                                    entity_id: createForm.entity_id,
                                    entity_type: createForm.entity_type,
                                    style: styleForm,
                                })
                            }
                            disabled={createMutation.isPending || !createForm.name}
                        >
                            {createMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                            Create QR Code
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Style Dialog */}
            {selectedQRCode && (
                <Dialog open={showStyleDialog} onOpenChange={setShowStyleDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Customize QR Code</DialogTitle>
                            <DialogDescription>Change the appearance of your QR code</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Foreground Color</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={styleForm.foreground_color}
                                            onChange={(e) =>
                                                setStyleForm({ ...styleForm, foreground_color: e.target.value })
                                            }
                                            className="w-10 h-10 rounded cursor-pointer"
                                        />
                                        <Input
                                            value={styleForm.foreground_color}
                                            onChange={(e) =>
                                                setStyleForm({ ...styleForm, foreground_color: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Background Color</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={styleForm.background_color}
                                            onChange={(e) =>
                                                setStyleForm({ ...styleForm, background_color: e.target.value })
                                            }
                                            className="w-10 h-10 rounded cursor-pointer"
                                        />
                                        <Input
                                            value={styleForm.background_color}
                                            onChange={(e) =>
                                                setStyleForm({ ...styleForm, background_color: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Dot Style</Label>
                                <Select
                                    value={styleForm.dot_style}
                                    onValueChange={(v: any) => setStyleForm({ ...styleForm, dot_style: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="square">Square</SelectItem>
                                        <SelectItem value="rounded">Rounded</SelectItem>
                                        <SelectItem value="dots">Dots</SelectItem>
                                        <SelectItem value="classy">Classy</SelectItem>
                                        <SelectItem value="classy-rounded">Classy Rounded</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Size: {styleForm.size}px</Label>
                                <Slider
                                    value={[styleForm.size || 300]}
                                    onValueChange={([v]) => setStyleForm({ ...styleForm, size: v })}
                                    min={100}
                                    max={500}
                                    step={50}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowStyleDialog(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() =>
                                    regenerateMutation.mutate({ id: selectedQRCode.id, style: styleForm })
                                }
                                disabled={regenerateMutation.isPending}
                            >
                                {regenerateMutation.isPending && (
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                Update QR Code
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Analytics Dialog */}
            {selectedQRCode && (
                <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>QR Code Analytics</DialogTitle>
                            <DialogDescription>{selectedQRCode.name}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>Total Scans</CardDescription>
                                        <CardTitle className="text-2xl">{analytics?.total_scans || 0}</CardTitle>
                                    </CardHeader>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>Unique Scans</CardDescription>
                                        <CardTitle className="text-2xl">{analytics?.unique_scans || 0}</CardTitle>
                                    </CardHeader>
                                </Card>
                            </div>

                            {analytics?.scans_by_device && analytics.scans_by_device.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Scans by Device</p>
                                    <div className="space-y-2">
                                        {analytics.scans_by_device.map((item) => (
                                            <div key={item.device} className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">{item.device}</span>
                                                <span className="font-medium">{item.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
