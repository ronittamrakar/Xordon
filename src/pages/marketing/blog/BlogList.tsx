import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    FileText,
    Settings,
    Globe,
    ExternalLink,
    Clock,
    CheckCircle2,
    AlertCircle,
    Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { blogApi, BlogPost } from '@/services/blogApi';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const BlogList = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');

    const { data: posts, isLoading } = useQuery({
        queryKey: ['blogPosts'],
        queryFn: blogApi.getPosts
    });

    const deleteMutation = useMutation({
        mutationFn: blogApi.deletePost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
            toast.success('Post deleted successfully');
        }
    });

    const filteredPosts = posts?.filter(post =>
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.author_name?.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (status: BlogPost['status']) => {
        switch (status) {
            case 'published':
                return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Published</Badge>;
            case 'draft':
                return <Badge variant="secondary"><FileText className="h-3 w-3 mr-1" /> Draft</Badge>;
            case 'scheduled':
                return <Badge className="bg-blue-500 hover:bg-blue-600"><Clock className="h-3 w-3 mr-1" /> Scheduled</Badge>;
            case 'archived':
                return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" /> Archived</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Blog CMS</h1>
                    <p className="text-muted-foreground">Manage your content, SEO, and multi-channel publication</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => navigate('/marketing/blog/settings')}>
                        <Settings className="h-4 w-4 mr-2" /> Blog Settings
                    </Button>
                    <Button onClick={() => navigate('/marketing/blog/create')}>
                        <Plus className="h-4 w-4 mr-2" /> Create New Post
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-4 border-l-4 border-l-green-500">
                    <div className="p-2 bg-green-100 rounded-lg text-green-700">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">Published</p>
                        <p className="text-2xl font-bold">{posts?.filter(p => p.status === 'published').length || 0}</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 border-l-4 border-l-slate-400">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">Drafts</p>
                        <p className="text-2xl font-bold">{posts?.filter(p => p.status === 'draft').length || 0}</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">Scheduled</p>
                        <p className="text-2xl font-bold">{posts?.filter(p => p.status === 'scheduled').length || 0}</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 border-l-4 border-l-orange-500">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-700">
                        <Eye className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">Total Views</p>
                        <p className="text-2xl font-bold">{posts?.reduce((acc, p) => acc + (p.view_count || 0), 0) || 0}</p>
                    </div>
                </Card>
            </div>

            <div className="flex items-center justify-between gap-4 py-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search posts..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    [1, 2, 3].map(i => <Card key={i} className="h-[400px] animate-pulse bg-slate-50" />)
                ) : filteredPosts?.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-slate-50 border-2 border-dashed rounded-3xl">
                        <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold">No blog posts found</h3>
                        <p className="text-muted-foreground">Start writing your first piece of content to engage your audience.</p>
                        <Button className="mt-6" onClick={() => navigate('/marketing/blog/create')}>
                            <Plus className="h-4 w-4 mr-2" /> Create Your First Post
                        </Button>
                    </div>
                ) : (
                    filteredPosts?.map(post => (
                        <Card key={post.id} className="overflow-hidden group hover:shadow-2xl transition-all duration-300 border-none ring-1 ring-slate-200">
                            <div className="aspect-video relative overflow-hidden bg-slate-100">
                                {post.featured_image ? (
                                    <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <Globe className="h-12 w-12 opacity-20" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    {getStatusBadge(post.status)}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                    <div className="flex gap-2 w-full">
                                        <Button size="sm" variant="secondary" className="flex-1 opacity-90 hover:opacity-100" onClick={() => navigate(`/marketing/blog/edit/${post.id}`)}>
                                            <Edit className="h-3.5 w-3.5 mr-2" /> Edit
                                        </Button>
                                        <Button size="sm" variant="secondary" className="opacity-90 hover:opacity-100 shadow-lg">
                                            <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <CardHeader className="p-5 space-y-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-[12px] font-black uppercase text-primary tracking-widest">{post.category || 'Uncategorized'}</p>
                                    <p className="text-[12px] text-muted-foreground">{format(new Date(post.created_at), 'MMM d, yyyy')}</p>
                                </div>
                                <CardTitle className="text-xl line-clamp-2 leading-tight group-hover:text-primary transition-colors">{post.title}</CardTitle>
                                <CardDescription className="line-clamp-2 text-xs pt-1">{post.summary || 'No summary provided.'}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 pt-0 border-t bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[12px] font-bold text-primary border border-primary/20">
                                        {post.author_name?.charAt(0) || 'A'}
                                    </div>
                                    <span className="text-[12px] font-bold">{post.author_name || 'Admin'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Eye className="h-3.5 w-3.5" />
                                        <span className="text-xs font-medium">{post.view_count || 0}</span>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-2xl border-none ring-1 ring-slate-200">
                                            <DropdownMenuItem onClick={() => navigate(`/marketing/blog/edit/${post.id}`)} className="rounded-lg gap-2 cursor-pointer py-2">
                                                <Edit className="h-4 w-4" /> Edit Post
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer py-2">
                                                <Copy className="h-4 w-4" /> Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer py-2">
                                                <Globe className="h-4 w-4" /> View Live
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="rounded-lg gap-2 cursor-pointer py-2 text-destructive focus:bg-destructive/5 focus:text-destructive"
                                                onClick={() => deleteMutation.mutate(post.id)}
                                            >
                                                <Trash2 className="h-4 w-4" /> Delete Post
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default BlogList;
