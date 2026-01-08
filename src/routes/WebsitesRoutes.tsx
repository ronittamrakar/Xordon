import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';

const Websites = lazy(() => import('@/pages/Websites'));
const WebsiteAnalytics = lazy(() => import('@/pages/websites/WebsiteAnalytics'));
const LandingPages = lazy(() => import('@/pages/LandingPages'));
const LandingPageTemplates = lazy(() => import('@/pages/LandingPageTemplates'));
const WebsiteTemplates = lazy(() => import('@/pages/WebsiteTemplates'));
const LandingPagePreview = lazy(() => import('@/pages/LandingPagePreview'));
const WebsiteBuilder = lazy(() => import('@/pages/WebsiteBuilder'));
const WebsitePreview = lazy(() => import('@/pages/WebsitePreview'));

const RedirectToNewBuilder = () => {
    const { id } = useParams();
    return <Navigate to={`/websites/builder/${id}?type=landing-page`} replace />;
};

const WebsitesRoutes = () => {
    return (
        <Routes>
            {/* Main Websites Dashboard */}
            <Route path="/" element={
                <Suspense fallback={<div>Loading...</div>}>
                    <Websites />
                </Suspense>
            } />

            {/* Website Templates */}
            <Route path="/templates" element={
                <Suspense fallback={<div>Loading...</div>}>
                    <WebsiteTemplates />
                </Suspense>
            } />

            {/* Website Preview */}
            <Route path="/preview/:id" element={
                <Suspense fallback={<div>Loading...</div>}>
                    <WebsitePreview />
                </Suspense>
            } />

            {/* Main Website Builder - handles all types of websites */}
            <Route path="/builder" element={
                <Suspense fallback={<div>Loading...</div>}>
                    <WebsiteBuilder />
                </Suspense>
            } />
            <Route path="/builder/:websiteId" element={
                <Suspense fallback={<div>Loading...</div>}>
                    <WebsiteBuilder />
                </Suspense>
            } />

            {/* Landing Pages - subset of websites */}
            <Route path="/landing-pages" element={
                <Suspense fallback={<div>Loading...</div>}>
                    <LandingPages />
                </Suspense>
            } />
            <Route path="/landing-pages/templates" element={
                <Suspense fallback={<div>Loading...</div>}>
                    <LandingPageTemplates />
                </Suspense>
            } />

            {/* Redirect old landing page builder to new unified builder */}
            <Route path="/landing-pages/builder" element={<Navigate to="/websites/builder?type=landing-page" replace />} />
            <Route path="/landing-pages/builder/:id" element={<RedirectToNewBuilder />} />

            <Route path="/landing-pages/preview/:id" element={
                <Suspense fallback={<div>Loading...</div>}>
                    <LandingPagePreview />
                </Suspense>
            } />
        </Routes>
    );
};

export default WebsitesRoutes;
