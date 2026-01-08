import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { VisualLandingBuilder } from '@/components/landing/VisualLandingBuilder';
import { landingPagesApi, LandingPage, LandingPageSection, PageSettings } from '@/lib/landingPagesApi';

const LandingPageBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { pageId } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [sections, setSections] = useState<LandingPageSection[]>([]);
  const [settings, setSettings] = useState<PageSettings>({
    seoTitle: 'Modern Landing Page',
    seoDescription: 'High-converting landing page',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter, sans-serif',
    accentColor: '#3b82f6',
  });

  useEffect(() => {
    if (pageId && pageId !== 'new') {
      loadLandingPage(pageId);
    } else {
      setLoading(false);
      // Set default sections for new pages
      setSections([]);
    }
  }, [pageId]);

  const loadLandingPage = async (id: string) => {
    try {
      const page = await landingPagesApi.getLandingPage(id);
      setLandingPage(page);
      setSections(page.content?.sections || []);
      setSettings(page.content?.settings || settings);
    } catch (error) {
      console.error('Failed to load landing page:', error);
      // Don't show error for 404, just start with empty page
      if (error instanceof Error && error.message.includes('Not Found')) {
        setSections([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async (data?: { sections: LandingPageSection[]; settings: PageSettings }) => {
    const pageData = {
      name: settings.seoTitle || 'Untitled Landing Page',
      title: settings.seoTitle || 'Untitled Landing Page',
      description: settings.seoDescription,
      status: 'draft' as const,
      content: {
        sections: data?.sections || sections,
        settings: data?.settings || settings,
      },
      seo_title: settings.seoTitle,
      seo_description: settings.seoDescription,
    };

    try {
      if (pageId && pageId !== 'new') {
        await landingPagesApi.updateLandingPage(pageId, pageData);
      } else {
        const newPage = await landingPagesApi.createLandingPage(pageData);
        navigate(`/websites/landing-pages/builder/${newPage.id}`);
      }
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [sections, settings, pageId, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading landing page...</p>
        </div>
      </div>
    );
  }

  return (
    <VisualLandingBuilder
      initialSections={sections}
      initialSettings={settings}
      pageId={pageId}
      initialPresetId={!pageId || pageId === 'new' ? (searchParams.get('preset') as any) : undefined}
      onSave={handleSave}
    />
  );
};

export default LandingPageBuilder;
