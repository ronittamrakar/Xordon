import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { VisualWebsiteBuilder } from '@/components/websites/VisualWebsiteBuilder';
import { websitesApi, Website, WebsiteSection, WebsiteSettings } from '@/lib/websitesApi';
import { WEBSITE_TEMPLATES } from '@/data/websiteTemplates';

const WebsiteBuilder: React.FC = () => {
    const navigate = useNavigate();
    const { websiteId } = useParams();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [website, setWebsite] = useState<Website | null>(null);
    const [sections, setSections] = useState<WebsiteSection[]>([]);
    const [settings, setSettings] = useState<WebsiteSettings>({
        seoTitle: 'Modern Website',
        seoDescription: 'Professional website built with our builder',
        backgroundColor: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        accentColor: '#3b82f6',
        websiteType: 'landing-page', // landing-page, business, ecommerce, portfolio, blog
    });

    useEffect(() => {
        if (websiteId && websiteId !== 'new') {
            loadWebsite(websiteId);
        } else {
            setLoading(false);

            // Handle Template selection
            const templateId = searchParams.get('template');
            if (templateId && WEBSITE_TEMPLATES[templateId]) {
                const template = WEBSITE_TEMPLATES[templateId];
                // Clone sections to ensure new IDs if we want to be safe, but they are already generated with uuid() in the data file
                // However, the data file is static, so if we use it multiple times we might get same IDs?
                // The data file generates UUIDs at module load time. So if I use the template twice without refreshing page, 
                // I might get same IDs. It is safer to re-generate IDs here.
                const newSections = template.sections.map(s => ({ ...s, id: Math.random().toString(36).substring(2, 9) }));

                setSections(newSections);
                setSettings(prev => ({
                    ...prev,
                    ...template.settings,
                    websiteType: (template.category as any) || prev.websiteType
                }));
            } else {
                // Set default sections for new websites based on type
                const websiteType = searchParams.get('type') || 'landing-page';
                setSettings(prev => ({ ...prev, websiteType: websiteType as any }));
                setSections([]);
            }
        }
    }, [websiteId]);

    const loadWebsite = async (id: string) => {
        try {
            const site = await websitesApi.getWebsite(id);
            setWebsite(site);
            setSections(site.content?.sections || []);
            setSettings(site.content?.settings || settings);
        } catch (error) {
            console.error('Failed to load website:', error);
            // Don't show error for 404, just start with empty website
            if (error instanceof Error && error.message.includes('Not Found')) {
                setSections([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = useCallback(async (data?: { sections: WebsiteSection[]; settings: WebsiteSettings }) => {
        const websiteData = {
            name: settings.seoTitle || 'Untitled Website',
            title: settings.seoTitle || 'Untitled Website',
            description: settings.seoDescription,
            status: 'draft' as const,
            type: settings.websiteType || 'landing-page',
            content: {
                sections: data?.sections || sections,
                settings: data?.settings || settings,
            },
            seo_title: settings.seoTitle,
            seo_description: settings.seoDescription,
        };

        try {
            if (websiteId && websiteId !== 'new') {
                await websitesApi.updateWebsite(websiteId, websiteData);
            } else {
                const newWebsite = await websitesApi.createWebsite(websiteData);
                navigate(`/websites/builder/${newWebsite.id}`);
            }
        } catch (error) {
            console.error('Save failed:', error);
        }
    }, [sections, settings, websiteId, navigate]);

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading website...</p>
                </div>
            </div>
        );
    }

    return (
        <VisualWebsiteBuilder
            key={websiteId || searchParams.get('template') || 'new'}
            initialSections={sections}
            initialSettings={settings}
            websiteId={websiteId}
            initialPresetId={searchParams.get('preset') as any}
            websiteType={searchParams.get('type') as any}
            onSave={handleSave}
        />
    );
};

export default WebsiteBuilder;
