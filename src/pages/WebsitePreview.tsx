import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft, Edit, Share2, Monitor, Tablet, Smartphone, Globe,
    ExternalLink, Loader2, AlertCircle, Copy, Check
} from 'lucide-react';
import { websitesApi, Website, WebsiteSection } from '@/lib/websitesApi';
import { useToast } from '@/hooks/use-toast';
import { WebsiteSectionRenderer } from '@/components/websites/WebsiteSectionRenderer';

type ViewMode = 'desktop' | 'tablet' | 'mobile';

const WebsitePreview: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [website, setWebsite] = useState<Website | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('desktop');
    const [publishing, setPublishing] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    useEffect(() => {
        if (id) {
            loadWebsite(id);
        }
    }, [id]);

    const loadWebsite = async (websiteId: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await websitesApi.getWebsite(websiteId);
            setWebsite(data);
        } catch (err) {
            console.error('Failed to load website:', err);
            setError('Failed to load website. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!website) return;

        try {
            setPublishing(true);
            if (website.status === 'published') {
                await websitesApi.unpublishWebsite(website.id);
                toast({
                    title: 'Website unpublished',
                    description: 'The website is now in draft mode.',
                });
            } else {
                await websitesApi.publishWebsite(website.id);
                toast({
                    title: 'Website published!',
                    description: 'Your website is now live.',
                });
            }
            loadWebsite(website.id);
        } catch (err) {
            toast({
                title: 'Action failed',
                description: 'Failed to update website status.',
                variant: 'destructive',
            });
        } finally {
            setPublishing(false);
        }
    };

    const handleCopyLink = () => {
        const link = website?.published_url || `${window.location.origin}/sites/${website?.slug}`;
        navigator.clipboard.writeText(link);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
        toast({
            title: 'Link copied',
            description: 'The website link has been copied to your clipboard.',
        });
    };

    const getPreviewWidth = () => {
        switch (viewMode) {
            case 'mobile':
                return 'max-w-[375px]';
            case 'tablet':
                return 'max-w-[768px]';
            default:
                return 'max-w-full';
        }
    };

    const renderSection = (section: WebsiteSection, index: number) => {
        return (
            <div key={section.id} className="relative">
                <WebsiteSectionRenderer section={section} />
            </div>
        );
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-500">Loading preview...</p>
                </div>
            </div>
        );
    }

    if (error || !website) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Failed to load website</h2>
                    <p className="text-gray-500 mb-4">{error || 'Website not found'}</p>
                    <Button onClick={() => navigate('/websites')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Websites
                    </Button>
                </div>
            </div>
        );
    }

    const sections = website.content?.sections || [];

    return (
        <div className="h-screen flex flex-col bg-gray-100">
            {/* Header Toolbar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/websites')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <div>
                        <h1 className="font-semibold">{website.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Badge variant={website.status === 'published' ? 'default' : 'secondary'}>
                                {website.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Device Toggle */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <Button
                            variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('desktop')}
                        >
                            <Monitor className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'tablet' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('tablet')}
                        >
                            <Tablet className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('mobile')}
                        >
                            <Smartphone className="h-4 w-4" />
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    <Button variant="outline" size="sm" onClick={handleCopyLink}>
                        {linkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        {linkCopied ? 'Copied!' : 'Copy Link'}
                    </Button>

                    {website.status === 'published' && website.published_url && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(website.published_url, '_blank')}
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Live
                        </Button>
                    )}

                    <Button variant="outline" size="sm" onClick={() => navigate(`/websites/builder/${website.id}`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>

                    <Button
                        size="sm"
                        onClick={handlePublish}
                        disabled={publishing}
                        variant={website.status === 'published' ? 'secondary' : 'default'}
                    >
                        {publishing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Globe className="h-4 w-4 mr-2" />
                        )}
                        {website.status === 'published' ? 'Unpublish' : 'Publish'}
                    </Button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto p-8">
                <div
                    className={`mx-auto bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300 ${getPreviewWidth()}`}
                    style={{ minHeight: '600px' }}
                >
                    {sections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Globe className="h-16 w-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">No content yet</p>
                            <p className="text-sm">Add sections in the builder to see them here</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => navigate(`/websites/builder/${website.id}`)}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Open Builder
                            </Button>
                        </div>
                    ) : (
                        <div>
                            {sections.map((section, index) => renderSection(section, index))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WebsitePreview;
