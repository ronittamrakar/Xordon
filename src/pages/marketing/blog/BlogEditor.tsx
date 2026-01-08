import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Save,
    ArrowLeft,
    Eye,
    Globe,
    Image as ImageIcon,
    Settings,
    Clock,
    CheckCircle2,
    Calendar,
    Search,
    Type,
    Layout,
    Hash,
    Sparkles,
    Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { blogApi, BlogPost } from '@/services/blogApi';
import { format } from 'date-fns';

const BlogEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEditing = !!id && id !== 'create';

    const [post, setPost] = useState<Partial<BlogPost>>({
        title: '',
        content: '',
        summary: '',
        status: 'draft',
        category: 'Uncategorized',
        tags: [],
        author_name: 'Admin',
        slug: ''
    });

    const { data: existingPost, isLoading } = useQuery({
        queryKey: ['blogPost', id],
        queryFn: () => blogApi.getPost(id!),
        enabled: isEditing
    });

    useEffect(() => {
        if (existingPost) {
            setPost(existingPost);
        }
    }, [existingPost]);

    const mutation = useMutation<any, Error, Partial<BlogPost>>({
        mutationFn: (data: Partial<BlogPost>) =>
            isEditing ? blogApi.updatePost(id!, data) : blogApi.createPost(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
            toast.success(isEditing ? 'Post updated' : 'Post created');
            navigate('/marketing/blog');
        }
    });

    const handleSave = () => {
        if (!post.title) return toast.error('Title is required');
        mutation.mutate(post);
    };

    const generateSlug = (title: string) => {
        return title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    };

    if (isLoading) return <div className="p-20 text-center">Loading post editor...</div>;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header Sticky */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b mb-6 px-6 py-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/marketing/blog')} className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-black">{isEditing ? 'Edit Post' : 'Create New Post'}</h1>
                            <p className="text-[12px] text-muted-foreground uppercase font-black tracking-widest">{post.status} • {post.category}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="hidden md:flex">
                            <Eye className="h-4 w-4 mr-2" /> Preview
                        </Button>
                        <Button onClick={handleSave} disabled={mutation.isPending} className="shadow-lg shadow-primary/20 px-8">
                            {mutation.isPending ? 'Saving...' : <><Save className="h-4 w-4 mr-2" /> {isEditing ? 'Save Changes' : 'Publish Post'}</>}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
                        <CardHeader className="bg-white border-b p-8 pb-4">
                            <CardTitle>Content Editor</CardTitle>
                            <CardDescription>Compose your blog post with rich text and media</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-4">
                                <Input
                                    value={post.title}
                                    onChange={(e) => {
                                        const newTitle = e.target.value;
                                        setPost(prev => ({
                                            ...prev,
                                            title: newTitle,
                                            slug: prev.slug ? prev.slug : generateSlug(newTitle)
                                        }));
                                    }}
                                    placeholder="Enter post title..."
                                    className="text-2xl font-black h-auto border-none focus-visible:ring-0 p-0 shadow-none placeholder:text-slate-200"
                                />
                                <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-4">
                                    <Globe className="h-3.5 w-3.5" />
                                    <span>Slug:</span>
                                    <Input
                                        value={post.slug}
                                        onChange={(e) => setPost({ ...post, slug: e.target.value })}
                                        className="h-7 text-xs border-none bg-slate-50 w-auto min-w-[200px] focus-visible:ring-0"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 min-h-[500px]">
                                <Textarea
                                    value={post.content}
                                    onChange={(e) => setPost({ ...post, content: e.target.value })}
                                    placeholder="Start writing your story..."
                                    className="min-h-[500px] text-lg border-none focus-visible:ring-0 p-0 resize-none shadow-none leading-relaxed"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Zap className="h-4 w-4 text-yellow-500" />
                                Content Excerpt & SEO
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Short Summary</Label>
                                <Textarea
                                    value={post.summary || ''}
                                    onChange={(e) => setPost({ ...post, summary: e.target.value })}
                                    placeholder="A brief summary for card views and social sharing..."
                                    className="h-24 resize-none bg-slate-50 border-slate-200"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase">SEO Title</Label>
                                    <Input
                                        value={post.seo_title || ''}
                                        onChange={(e) => setPost({ ...post, seo_title: e.target.value })}
                                        placeholder="Google Search Title"
                                        className="bg-slate-50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase">SEO Description</Label>
                                    <Input
                                        value={post.seo_description || ''}
                                        onChange={(e) => setPost({ ...post, seo_description: e.target.value })}
                                        placeholder="Google Meta Description"
                                        className="bg-slate-50"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="border-none shadow-xl rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-sm">Publication Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Post Status</Label>
                                <Select value={post.status} onValueChange={(val: any) => setPost({ ...post, status: val })}>
                                    <SelectTrigger className="bg-slate-50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={post.category} onValueChange={(val) => setPost({ ...post, category: val })}>
                                    <SelectTrigger className="bg-slate-50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                                        <SelectItem value="Updates">Product Updates</SelectItem>
                                        <SelectItem value="Insights">Market Insights</SelectItem>
                                        <SelectItem value="Guides">How-to Guides</SelectItem>
                                        <SelectItem value="News">Industry News</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Author Name</Label>
                                <Input
                                    value={post.author_name || ''}
                                    onChange={(e) => setPost({ ...post, author_name: e.target.value })}
                                    className="bg-slate-50"
                                />
                            </div>

                            <div className="pt-4 border-t flex items-center justify-between">
                                <span className="text-xs text-muted-foreground font-medium italic">Auto-saving...</span>
                                <Badge variant="outline" className="text-[12px]">v1.0.4</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader className="bg-primary text-white p-6">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Featured Image
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="aspect-video bg-slate-100 flex items-center justify-center relative cursor-pointer hover:bg-slate-200 transition-colors group">
                                {post.featured_image ? (
                                    <>
                                        <img src={post.featured_image} alt="Featured" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                                            Change Image
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-6 pb-12">
                                        <Sparkles className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                                        <p className="text-[12px] text-muted-foreground font-bold uppercase tracking-widest">Upload or Generate with AI</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50 border-t flex gap-2">
                                <Input
                                    placeholder="Image URL..."
                                    value={post.featured_image || ''}
                                    onChange={(e) => setPost({ ...post, featured_image: e.target.value })}
                                    className="bg-white text-xs h-8"
                                />
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg">
                                    <Globe className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-sm">Tags</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {(post.tags || []).map(tag => (
                                    <Badge key={tag} className="gap-1 pl-2 pr-1">
                                        {tag}
                                        <button onClick={() => setPost({ ...post, tags: post.tags?.filter(t => t !== tag) })} className="hover:text-red-400">
                                            <Hash className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Add tag..."
                                    className="pl-9 h-9 bg-slate-50 text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = (e.target as HTMLInputElement).value;
                                            if (val && !post.tags?.includes(val)) {
                                                setPost({ ...post, tags: [...(post.tags || []), val] });
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BlogEditor;
