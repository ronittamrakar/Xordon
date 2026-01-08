import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Save,
    ArrowLeft,
    Globe,
    Shield,
    Image as ImageIcon,
    Settings,
    Layout,
    Type,
    FileCode,
    Share2,
    RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { blogApi, BlogSettings as BlogSettingsType } from '@/services/blogApi';
import { useNavigate } from 'react-router-dom';

const BlogSettingsPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ['blogSettings'],
        queryFn: blogApi.getSettings
    });

    const [formData, setFormData] = useState<Partial<BlogSettingsType>>({
        blog_name: '',
        blog_description: '',
        path_prefix: 'blog',
        is_active: true,
        custom_css: '',
        social_sharing_image: ''
    });

    useEffect(() => {
        if (settings) {
            setFormData(settings);
        }
    }, [settings]);

    const mutation = useMutation({
        mutationFn: blogApi.updateSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogSettings'] });
            toast.success('Blog settings updated');
        }
    });

    const handleSave = () => {
        mutation.mutate(formData);
    };

    if (isLoading) return <div className="p-20 text-center">Loading settings...</div>;

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/marketing/blog')} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black">Blog Settings</h1>
                        <p className="text-muted-foreground">Configure your blog's global identity and technical setup</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={mutation.isPending} className="px-8 shadow-lg shadow-primary/20">
                    {mutation.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Settings
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-none shadow-xl rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Settings className="h-5 w-5 text-primary" />
                                General Identity
                            </CardTitle>
                            <CardDescription>How your blog is identified by users and search engines</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="font-bold">Blog Title</Label>
                                <Input
                                    value={formData.blog_name}
                                    onChange={(e) => setFormData({ ...formData, blog_name: e.target.value })}
                                    placeholder="e.g., Xordon Official Blog"
                                    className="bg-slate-50 border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Blog Description</Label>
                                <Textarea
                                    value={formData.blog_description}
                                    onChange={(e) => setFormData({ ...formData, blog_description: e.target.value })}
                                    placeholder="A catchphrase or description about your content..."
                                    className="h-24 bg-slate-50 border-slate-200"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-dashed">
                                <div className="space-y-0.5">
                                    <Label className="font-bold">Is Blog Active?</Label>
                                    <p className="text-xs text-muted-foreground">Temporarily take the blog offline for maintenance</p>
                                </div>
                                <Switch
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <FileCode className="h-5 w-5 text-primary" />
                                Custom Branding & Style
                            </CardTitle>
                            <CardDescription>Inject custom CSS or assets to match your brand</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="font-bold">Global Custom CSS</Label>
                                <Textarea
                                    value={formData.custom_css}
                                    onChange={(e) => setFormData({ ...formData, custom_css: e.target.value })}
                                    placeholder="/* .blog-title { color: #primary; } */"
                                    className="h-40 font-mono text-xs bg-slate-900 text-slate-100 border-none rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Default Social Image URL</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={formData.social_sharing_image}
                                        onChange={(e) => setFormData({ ...formData, social_sharing_image: e.target.value })}
                                        placeholder="https://example.com/social-card.png"
                                        className="bg-slate-50"
                                    />
                                    <Button variant="outline" size="icon"><ImageIcon className="h-4 w-4" /></Button>
                                </div>
                                <p className="text-[12px] text-muted-foreground italic">Recommended size: 1200x630px for Facebook, Twitter, and LinkedIn</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Globe className="h-4 w-4 text-blue-500" />
                                Hosting & Domain
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase">Blog Path Prefix</Label>
                                <div className="flex items-center gap-1.5 p-2 bg-slate-100 rounded-lg text-xs font-mono text-slate-600 border">
                                    <span>app.xordon.com /</span>
                                    <Input
                                        value={formData.path_prefix}
                                        onChange={(e) => setFormData({ ...formData, path_prefix: e.target.value })}
                                        className="h-6 w-20 p-0 text-xs border-none bg-transparent focus-visible:ring-0 font-mono text-primary font-bold"
                                    />
                                </div>
                            </div>
                            <Button variant="ghost" className="w-full justify-start text-xs font-bold text-primary hover:text-primary/80">
                                <Shield className="h-3 w-3 mr-2" /> Manage SSL & Domains
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white">
                        <CardHeader>
                            <CardTitle className="text-sm font-black flex items-center gap-2">
                                <Share2 className="h-4 w-4" />
                                Social Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs opacity-90 leading-relaxed font-medium">
                                When you publish a new blog post, we can automatically share snippets to your connected Social Media accounts.
                            </p>
                            <Button variant="secondary" size="sm" className="w-full font-bold shadow-lg" onClick={() => navigate('/marketing/social-planner')}>
                                Configure Distribution
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BlogSettingsPage;
