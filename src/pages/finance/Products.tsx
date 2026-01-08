import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Package,
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    Search,
    DollarSign,
    Tag,
    BarChart3,
    Clock,
    Users,
    Briefcase,
    Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import invoicesApi, { Product } from '@/services/invoicesApi';
import { servicesApi, Service } from '@/services/bookingApi';
import SEO from '@/components/SEO';

const Products: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('products');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // Product State
    const [isProductCreateOpen, setIsProductCreateOpen] = useState(false);
    const [isProductEditOpen, setIsProductEditOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productFormData, setProductFormData] = useState<{
        name: string;
        price: string;
        description: string;
        sku: string;
        category: string;
        unit: string;
        tax_rate: string;
        is_active: boolean;
        is_recurring: boolean;
        recurring_interval: Product['recurring_interval'];
    }>({
        name: '',
        price: '',
        description: '',
        sku: '',
        category: '',
        unit: 'unit',
        tax_rate: '0',
        is_active: true,
        is_recurring: false,
        recurring_interval: 'monthly',
    });

    // Service State
    const [isServiceCreateOpen, setIsServiceCreateOpen] = useState(false);
    const [isServiceEditOpen, setIsServiceEditOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [serviceFormData, setServiceFormData] = useState<{
        name: string;
        price: string;
        description: string;
        duration_minutes: string;
        price_type: Service['price_type'];
        is_active: boolean;
        buffer_before_minutes: string;
        buffer_after_minutes: string;
        requires_confirmation: boolean;
        allow_online_booking: boolean;
    }>({
        name: '',
        price: '',
        description: '',
        duration_minutes: '60',
        price_type: 'fixed',
        is_active: true,
        buffer_before_minutes: '0',
        buffer_after_minutes: '0',
        requires_confirmation: false,
        allow_online_booking: true,
    });

    // ==================== QUERIES ====================

    const { data: products = [], isLoading: isProductsLoading } = useQuery({
        queryKey: ['products'],
        queryFn: () => invoicesApi.listProducts(),
    });

    const { data: services = [], isLoading: isServicesLoading } = useQuery({
        queryKey: ['services'],
        queryFn: () => servicesApi.list(),
    });

    // ==================== PRODUCT MUTATIONS ====================

    const createProductMutation = useMutation({
        mutationFn: (data: Partial<Product>) =>
            invoicesApi.createProduct(data as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setIsProductCreateOpen(false);
            resetProductForm();
            toast.success('Product created successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to create product');
        },
    });

    const updateProductMutation = useMutation({
        mutationFn: async (data: { id: number } & Partial<Product>) =>
            invoicesApi.updateProduct(data.id, data as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setIsProductEditOpen(false);
            setSelectedProduct(null);
            resetProductForm();
            toast.success('Product updated successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to update product');
        },
    });

    const deleteProductMutation = useMutation({
        mutationFn: (id: number) => invoicesApi.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Product deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to delete product');
        },
    });

    // ==================== SERVICE MUTATIONS ====================

    const createServiceMutation = useMutation({
        mutationFn: (data: Partial<Service>) => servicesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            setIsServiceCreateOpen(false);
            resetServiceForm();
            toast.success('Service created successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to create service');
        },
    });

    const updateServiceMutation = useMutation({
        mutationFn: (data: { id: number } & Partial<Service>) => servicesApi.update(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            setIsServiceEditOpen(false);
            setSelectedService(null);
            resetServiceForm();
            toast.success('Service updated successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to update service');
        },
    });

    const deleteServiceMutation = useMutation({
        mutationFn: (id: number) => servicesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            toast.success('Service deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to delete service');
        },
    });

    // ==================== HELPERS ====================

    const formatCurrency = (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const resetProductForm = () => {
        setProductFormData({
            name: '',
            price: '',
            description: '',
            sku: '',
            category: '',
            unit: 'unit',
            tax_rate: '0',
            is_active: true,
            is_recurring: false,
            recurring_interval: 'monthly',
        });
    };

    const resetServiceForm = () => {
        setServiceFormData({
            name: '',
            price: '',
            description: '',
            duration_minutes: '60',
            price_type: 'fixed',
            is_active: true,
            buffer_before_minutes: '0',
            buffer_after_minutes: '0',
            requires_confirmation: false,
            allow_online_booking: true,
        });
    };

    // ==================== HANDLERS ====================

    const handleCreateProduct = () => {
        createProductMutation.mutate({
            name: productFormData.name,
            price: parseFloat(productFormData.price) || 0,
            description: productFormData.description || undefined,
            sku: productFormData.sku || undefined,
            unit: productFormData.unit,
            tax_rate: parseFloat(productFormData.tax_rate) || 0,
            is_active: productFormData.is_active,
            is_recurring: productFormData.is_recurring,
            recurring_interval: productFormData.is_recurring ? productFormData.recurring_interval : null,
        });
    };

    const handleUpdateProduct = () => {
        if (!selectedProduct) return;
        updateProductMutation.mutate({
            id: selectedProduct.id,
            name: productFormData.name,
            price: parseFloat(productFormData.price) || 0,
            description: productFormData.description || undefined,
            sku: productFormData.sku || undefined,
            unit: productFormData.unit,
            tax_rate: parseFloat(productFormData.tax_rate) || 0,
            is_active: productFormData.is_active,
            is_recurring: productFormData.is_recurring,
            recurring_interval: productFormData.is_recurring ? productFormData.recurring_interval : null,
        });
    };

    const handleDeleteProduct = (id: number) => {
        if (confirm('Are you sure you want to delete this product?')) {
            deleteProductMutation.mutate(id);
        }
    };

    const handleCreateService = () => {
        createServiceMutation.mutate({
            name: serviceFormData.name,
            price: parseFloat(serviceFormData.price) || 0,
            description: serviceFormData.description || undefined,
            duration_minutes: parseInt(serviceFormData.duration_minutes) || 60,
            price_type: serviceFormData.price_type as any,
            is_active: serviceFormData.is_active,
            buffer_before_minutes: parseInt(serviceFormData.buffer_before_minutes) || 0,
            buffer_after_minutes: parseInt(serviceFormData.buffer_after_minutes) || 0,
            requires_confirmation: serviceFormData.requires_confirmation,
            allow_online_booking: serviceFormData.allow_online_booking,
        });
    };

    const handleUpdateService = () => {
        if (!selectedService) return;
        updateServiceMutation.mutate({
            id: selectedService.id,
            name: serviceFormData.name,
            price: parseFloat(serviceFormData.price) || 0,
            description: serviceFormData.description || undefined,
            duration_minutes: parseInt(serviceFormData.duration_minutes) || 60,
            price_type: serviceFormData.price_type as any,
            is_active: serviceFormData.is_active,
            buffer_before_minutes: parseInt(serviceFormData.buffer_before_minutes) || 0,
            buffer_after_minutes: parseInt(serviceFormData.buffer_after_minutes) || 0,
            requires_confirmation: serviceFormData.requires_confirmation,
            allow_online_booking: serviceFormData.allow_online_booking,
        });
    };

    const handleDeleteService = (id: number) => {
        if (confirm('Are you sure you want to delete this service?')) {
            deleteServiceMutation.mutate(id);
        }
    };

    const openEditProduct = (product: Product) => {
        setSelectedProduct(product);
        setProductFormData({
            name: product.name,
            price: String(product.price),
            description: product.description || '',
            sku: product.sku || '',
            category: '',
            unit: product.unit || 'unit',
            tax_rate: String(product.tax_rate || 0),
            is_active: product.is_active,
            is_recurring: product.is_recurring,
            recurring_interval: (product.recurring_interval as any) || 'monthly',
        });
        setIsProductEditOpen(true);
    };

    const openEditService = (service: Service) => {
        setSelectedService(service);
        setServiceFormData({
            name: service.name,
            price: service.price ? String(service.price) : '',
            description: service.description || '',
            duration_minutes: String(service.duration_minutes),
            price_type: service.price_type,
            is_active: service.is_active,
            buffer_before_minutes: String(service.buffer_before_minutes || 0),
            buffer_after_minutes: String(service.buffer_after_minutes || 0),
            requires_confirmation: service.requires_confirmation,
            allow_online_booking: service.allow_online_booking,
        });
        setIsServiceEditOpen(true);
    };

    // Filtered Lists
    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredServices = services.filter((service) =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Stats
    const productStats = {
        total: products.length,
        active: products.filter((p) => p.is_active).length,
        totalValue: products.reduce((sum, p) => sum + p.price, 0),
    };

    const serviceStats = {
        total: services.length,
        active: services.filter((s) => s.is_active).length,
    };

    return (
        <div className="space-y-6">
            <SEO
                title="Products & Services"
                description="Manage your products and services catalog for invoices and estimates."
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Products & Services</h1>
                    <p className="text-muted-foreground">
                        Manage your product catalog and bookable services
                    </p>
                </div>
                <Button onClick={() => activeTab === 'products' ? setIsProductCreateOpen(true) : setIsServiceCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add {activeTab === 'products' ? 'Product' : 'Service'}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{activeTab === 'products' ? productStats.total : serviceStats.total}</div>
                        <div className="text-sm text-muted-foreground">Total {activeTab === 'products' ? 'Products' : 'Services'}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-green-600">
                            {activeTab === 'products' ? productStats.active : serviceStats.active}
                        </div>
                        <div className="text-sm text-muted-foreground">Active {activeTab === 'products' ? 'Items' : 'Services'}</div>
                    </CardContent>
                </Card>
                {activeTab === 'products' && (
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(productStats.totalValue)}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Catalog Value</div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Search and View Toggle */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={`Search ${activeTab}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                    >
                        Grid
                    </Button>
                    <Button
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                    >
                        Table
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="products">Products</TabsTrigger>
                    <TabsTrigger value="services">Services</TabsTrigger>
                </TabsList>

                {/* PRODUCTS TAB */}
                <TabsContent value="products" className="mt-6">
                    {isProductsLoading ? (
                        <div className="text-center py-12 text-muted-foreground">Loading products...</div>
                    ) : filteredProducts.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-lg font-medium mb-2">No products found</h3>
                                <p className="text-muted-foreground mb-4">
                                    Create products to add them to invoices and estimates
                                </p>
                                <Button onClick={() => setIsProductCreateOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Product
                                </Button>
                            </CardContent>
                        </Card>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProducts.map((product) => (
                                <Card key={product.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-base">{product.name}</CardTitle>
                                                {product.sku && (
                                                    <CardDescription className="text-xs flex items-center gap-1 mt-1">
                                                        <Tag className="h-3 w-3" /> SKU: {product.sku}
                                                    </CardDescription>
                                                )}
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditProduct(product)}>
                                                        <Pencil className="h-4 w-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProduct(product.id)}>
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        {product.description && (
                                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-semibold text-blue-600">
                                                {formatCurrency(product.price, product.currency)}
                                            </span>
                                            <Badge variant={product.is_active ? 'default' : 'secondary'}>
                                                {product.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>{product.sku || '-'}</TableCell>
                                            <TableCell className="max-w-xs truncate">{product.description || '-'}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(product.price, product.currency)}</TableCell>
                                            <TableCell>
                                                <Badge variant={product.is_active ? 'default' : 'secondary'}>
                                                    {product.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditProduct(product)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProduct(product.id)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    )}
                </TabsContent>

                {/* SERVICES TAB */}
                <TabsContent value="services" className="mt-6">
                    {isServicesLoading ? (
                        <div className="text-center py-12 text-muted-foreground">Loading services...</div>
                    ) : filteredServices.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-lg font-medium mb-2">No services found</h3>
                                <p className="text-muted-foreground mb-4">
                                    Add services to manage bookings and invoices
                                </p>
                                <Button onClick={() => setIsServiceCreateOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Service
                                </Button>
                            </CardContent>
                        </Card>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredServices.map((service) => (
                                <Card key={service.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-base">{service.name}</CardTitle>
                                                <CardDescription className="text-xs flex items-center gap-1 mt-1">
                                                    <Clock className="h-3 w-3" /> {service.duration_minutes} min
                                                </CardDescription>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditService(service)}>
                                                        <Pencil className="h-4 w-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteService(service.id)}>
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        {service.description && (
                                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-semibold text-blue-600">
                                                {service.price ? formatCurrency(service.price, service.currency) : 'Free'}
                                            </span>
                                            <Badge variant={service.is_active ? 'default' : 'secondary'}>
                                                {service.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredServices.map((service) => (
                                        <TableRow key={service.id}>
                                            <TableCell className="font-medium">{service.name}</TableCell>
                                            <TableCell>{service.duration_minutes} min</TableCell>
                                            <TableCell className="max-w-xs truncate">{service.description || '-'}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {service.price ? formatCurrency(service.price, service.currency) : 'Free'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={service.is_active ? 'default' : 'secondary'}>
                                                    {service.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditService(service)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteService(service.id)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* PRODUCT DIALOGS */}
            <Dialog open={isProductCreateOpen} onOpenChange={setIsProductCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Product</DialogTitle>
                        <DialogDescription>Create a new product for invoices.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input
                                placeholder="e.g., Widget A"
                                value={productFormData.name}
                                onChange={(e) => setProductFormData((prev) => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Price *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={productFormData.price}
                                    onChange={(e) => setProductFormData((prev) => ({ ...prev, price: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>SKU</Label>
                                <Input
                                    placeholder="Optional SKU"
                                    value={productFormData.sku}
                                    onChange={(e) => setProductFormData((prev) => ({ ...prev, sku: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Unit</Label>
                                <Input
                                    placeholder="e.g., unit, hour, kit"
                                    value={productFormData.unit}
                                    onChange={(e) => setProductFormData((prev) => ({ ...prev, unit: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tax Rate (%)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="0.0"
                                    value={productFormData.tax_rate}
                                    onChange={(e) => setProductFormData((prev) => ({ ...prev, tax_rate: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 border rounded-md">
                            <div className="space-y-0.5">
                                <Label>Recurring Product</Label>
                                <p className="text-xs text-muted-foreground">Is this a subscription?</p>
                            </div>
                            <Switch
                                checked={productFormData.is_recurring}
                                onCheckedChange={(checked) => setProductFormData((prev) => ({ ...prev, is_recurring: checked }))}
                            />
                        </div>

                        {productFormData.is_recurring && (
                            <div className="space-y-2">
                                <Label>Recurring Interval</Label>
                                <Select
                                    value={productFormData.recurring_interval}
                                    onValueChange={(value: any) => setProductFormData((prev) => ({ ...prev, recurring_interval: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="flex items-center justify-between p-2 border rounded-md">
                            <div className="space-y-0.5">
                                <Label>Active</Label>
                                <p className="text-xs text-muted-foreground">Visible in catalog and invoices</p>
                            </div>
                            <Switch
                                checked={productFormData.is_active}
                                onCheckedChange={(checked) => setProductFormData((prev) => ({ ...prev, is_active: checked }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                placeholder="Product description..."
                                value={productFormData.description}
                                onChange={(e) => setProductFormData((prev) => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsProductCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateProduct} disabled={!productFormData.name || !productFormData.price}>Create Product</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isProductEditOpen} onOpenChange={setIsProductEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                        <DialogDescription>Update product details.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input
                                value={productFormData.name}
                                onChange={(e) => setProductFormData((prev) => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Price *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={productFormData.price}
                                    onChange={(e) => setProductFormData((prev) => ({ ...prev, price: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>SKU</Label>
                                <Input
                                    value={productFormData.sku}
                                    onChange={(e) => setProductFormData((prev) => ({ ...prev, sku: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Unit</Label>
                                <Input
                                    value={productFormData.unit}
                                    onChange={(e) => setProductFormData((prev) => ({ ...prev, unit: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tax Rate (%)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={productFormData.tax_rate}
                                    onChange={(e) => setProductFormData((prev) => ({ ...prev, tax_rate: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 border rounded-md">
                            <div className="space-y-0.5">
                                <Label>Recurring Product</Label>
                                <p className="text-xs text-muted-foreground">Is this a subscription?</p>
                            </div>
                            <Switch
                                checked={productFormData.is_recurring}
                                onCheckedChange={(checked) => setProductFormData((prev) => ({ ...prev, is_recurring: checked }))}
                            />
                        </div>

                        {productFormData.is_recurring && (
                            <div className="space-y-2">
                                <Label>Recurring Interval</Label>
                                <Select
                                    value={productFormData.recurring_interval}
                                    onValueChange={(value: any) => setProductFormData((prev) => ({ ...prev, recurring_interval: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="flex items-center justify-between p-2 border rounded-md">
                            <div className="space-y-0.5">
                                <Label>Active</Label>
                                <p className="text-xs text-muted-foreground">Visible in catalog and invoices</p>
                            </div>
                            <Switch
                                checked={productFormData.is_active}
                                onCheckedChange={(checked) => setProductFormData((prev) => ({ ...prev, is_active: checked }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={productFormData.description}
                                onChange={(e) => setProductFormData((prev) => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsProductEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateProduct} disabled={!productFormData.name || !productFormData.price}>Update Product</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* SERVICE DIALOGS */}
            <Dialog open={isServiceCreateOpen} onOpenChange={setIsServiceCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Service</DialogTitle>
                        <DialogDescription>Create a new service.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input
                                placeholder="e.g., Consulting Session"
                                value={serviceFormData.name}
                                onChange={(e) => setServiceFormData((prev) => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Price Type</Label>
                                <Select
                                    value={serviceFormData.price_type}
                                    onValueChange={(value: any) => setServiceFormData((prev) => ({ ...prev, price_type: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fixed">Fixed Price</SelectItem>
                                        <SelectItem value="hourly">Hourly</SelectItem>
                                        <SelectItem value="starting_at">Starting At</SelectItem>
                                        <SelectItem value="free">Free</SelectItem>
                                        <SelectItem value="custom">Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Price</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={serviceFormData.price}
                                    disabled={serviceFormData.price_type === 'free' || serviceFormData.price_type === 'custom'}
                                    onChange={(e) => setServiceFormData((prev) => ({ ...prev, price: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Duration (min)</Label>
                                <Input
                                    type="number"
                                    value={serviceFormData.duration_minutes}
                                    onChange={(e) => setServiceFormData((prev) => ({ ...prev, duration_minutes: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Buffer (Before)</Label>
                                <Input
                                    type="number"
                                    value={serviceFormData.buffer_before_minutes}
                                    onChange={(e) => setServiceFormData((prev) => ({ ...prev, buffer_before_minutes: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Buffer (After)</Label>
                                <Input
                                    type="number"
                                    value={serviceFormData.buffer_after_minutes}
                                    onChange={(e) => setServiceFormData((prev) => ({ ...prev, buffer_after_minutes: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 border rounded-md">
                            <div className="space-y-0.5">
                                <Label>Requires Confirmation</Label>
                                <p className="text-xs text-muted-foreground">Admin must approve booking</p>
                            </div>
                            <Switch
                                checked={serviceFormData.requires_confirmation}
                                onCheckedChange={(checked) => setServiceFormData((prev) => ({ ...prev, requires_confirmation: checked }))}
                            />
                        </div>

                        <div className="flex items-center justify-between p-2 border rounded-md">
                            <div className="space-y-0.5">
                                <Label>Allow Online Booking</Label>
                                <p className="text-xs text-muted-foreground">Show on public booking page</p>
                            </div>
                            <Switch
                                checked={serviceFormData.allow_online_booking}
                                onCheckedChange={(checked) => setServiceFormData((prev) => ({ ...prev, allow_online_booking: checked }))}
                            />
                        </div>

                        <div className="flex items-center justify-between p-2 border rounded-md">
                            <div className="space-y-0.5">
                                <Label>Active Status</Label>
                                <p className="text-xs text-muted-foreground">Enable or disable this service</p>
                            </div>
                            <Switch
                                checked={serviceFormData.is_active}
                                onCheckedChange={(checked) => setServiceFormData((prev) => ({ ...prev, is_active: checked }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                placeholder="Service description..."
                                value={serviceFormData.description}
                                onChange={(e) => setServiceFormData((prev) => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsServiceCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateService} disabled={!serviceFormData.name}>Create Service</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isServiceEditOpen} onOpenChange={setIsServiceEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Service</DialogTitle>
                        <DialogDescription>Update service details.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input
                                placeholder="e.g., Consulting Session"
                                value={serviceFormData.name}
                                onChange={(e) => setServiceFormData((prev) => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Price Type</Label>
                                <Select
                                    value={serviceFormData.price_type}
                                    onValueChange={(value: any) => setServiceFormData((prev) => ({ ...prev, price_type: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fixed">Fixed Price</SelectItem>
                                        <SelectItem value="hourly">Hourly</SelectItem>
                                        <SelectItem value="starting_at">Starting At</SelectItem>
                                        <SelectItem value="free">Free</SelectItem>
                                        <SelectItem value="custom">Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Price</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={serviceFormData.price}
                                    disabled={serviceFormData.price_type === 'free' || serviceFormData.price_type === 'custom'}
                                    onChange={(e) => setServiceFormData((prev) => ({ ...prev, price: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Duration (min)</Label>
                                <Input
                                    type="number"
                                    value={serviceFormData.duration_minutes}
                                    onChange={(e) => setServiceFormData((prev) => ({ ...prev, duration_minutes: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Buffer (Before)</Label>
                                <Input
                                    type="number"
                                    value={serviceFormData.buffer_before_minutes}
                                    onChange={(e) => setServiceFormData((prev) => ({ ...prev, buffer_before_minutes: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Buffer (After)</Label>
                                <Input
                                    type="number"
                                    value={serviceFormData.buffer_after_minutes}
                                    onChange={(e) => setServiceFormData((prev) => ({ ...prev, buffer_after_minutes: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 border rounded-md">
                            <div className="space-y-0.5">
                                <Label>Requires Confirmation</Label>
                                <p className="text-xs text-muted-foreground">Admin must approve booking</p>
                            </div>
                            <Switch
                                checked={serviceFormData.requires_confirmation}
                                onCheckedChange={(checked) => setServiceFormData((prev) => ({ ...prev, requires_confirmation: checked }))}
                            />
                        </div>

                        <div className="flex items-center justify-between p-2 border rounded-md">
                            <div className="space-y-0.5">
                                <Label>Allow Online Booking</Label>
                                <p className="text-xs text-muted-foreground">Show on public booking page</p>
                            </div>
                            <Switch
                                checked={serviceFormData.allow_online_booking}
                                onCheckedChange={(checked) => setServiceFormData((prev) => ({ ...prev, allow_online_booking: checked }))}
                            />
                        </div>

                        <div className="flex items-center justify-between p-2 border rounded-md">
                            <div className="space-y-0.5">
                                <Label>Active Status</Label>
                                <p className="text-xs text-muted-foreground">Enable or disable this service</p>
                            </div>
                            <Switch
                                checked={serviceFormData.is_active}
                                onCheckedChange={(checked) => setServiceFormData((prev) => ({ ...prev, is_active: checked }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                placeholder="Service description..."
                                value={serviceFormData.description}
                                onChange={(e) => setServiceFormData((prev) => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsServiceEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateService} disabled={!serviceFormData.name}>Update Service</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Products;
