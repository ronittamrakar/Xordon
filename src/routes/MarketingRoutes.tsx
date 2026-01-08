import React, { lazy } from 'react';
// Force Update

import { Routes, Route, Navigate } from 'react-router-dom';

const SocialPlanner = lazy(() => import('@/pages/marketing/SocialPlanner'));
const MarketingAnalytics = lazy(() => import('@/pages/marketing/MarketingAnalytics'));
const ListingsEnhanced = lazy(() => import('@/pages/growth/ListingsEnhanced'));
const KeywordsUnifiedPage = lazy(() => import('@/pages/marketing/seo/KeywordsUnified'));
const SeoDashboardPage = lazy(() => import('@/pages/marketing/seo/SeoDashboardPage'));
const SerpAnalysisPage = lazy(() => import('@/pages/marketing/seo/SerpAnalysisPage'));
const SiteAuditsPage = lazy(() => import('@/pages/marketing/seo/SiteAuditsPage'));
const ContentOptimizerPage = lazy(() => import('@/pages/marketing/seo/ContentOptimizerPage'));
const SeoAnalytics = lazy(() => import('@/pages/marketing/seo/SeoAnalytics'));
const BacklinksPage = lazy(() => import('@/pages/marketing/seo/BacklinksPage'));

const AdsManager = lazy(() => import('@/pages/growth/AdsManager'));
const QRCodes = lazy(() => import('@/pages/marketing/QRCodes'));
const Funnels = lazy(() => import('@/pages/Funnels'));
const FunnelAnalytics = lazy(() => import('@/pages/marketing/funnels/FunnelAnalytics'));
const FunnelStepsEditor = lazy(() => import('@/pages/marketing/funnels/FunnelStepsEditor'));
const ContentManagement = lazy(() => import('@/pages/marketing/ContentManagement'));
const CustomerAcquisition = lazy(() => import('@/pages/marketing/CustomerAcquisition'));
const MarketingSettings = lazy(() => import('@/pages/marketing/MarketingSettings'));

const BlogList = lazy(() => import('@/pages/marketing/blog/BlogList'));
const BlogEditor = lazy(() => import('@/pages/marketing/blog/BlogEditor'));
const BlogSettingsPage = lazy(() => import('@/pages/marketing/blog/BlogSettings'));
const LoyaltyDashboard = lazy(() => import('@/pages/marketing/loyalty/LoyaltyDashboard'));
const WebinarList = lazy(() => import('@/pages/marketing/webinars/WebinarList'));
const WebinarRoom = lazy(() => import('@/pages/marketing/webinars/WebinarRoom'));
const WebinarForm = lazy(() => import('@/pages/marketing/webinars/WebinarForm'));

const MarketingRoutes = () => {
    return (
        <Routes>
            <Route path="social" element={<SocialPlanner />} />
            <Route path="analytics" element={<MarketingAnalytics />} />

            {/* Webinars */}
            <Route path="webinars" element={<WebinarList />} />
            <Route path="webinars/room/:id" element={<WebinarRoom />} />
            <Route path="webinars/create" element={<WebinarForm />} />
            <Route path="webinars/edit/:id" element={<WebinarForm />} />

            {/* Loyalty & Rewards */}
            <Route path="loyalty" element={<LoyaltyDashboard />} />

            {/* Blogging Platform */}
            <Route path="blog" element={<BlogList />} />
            <Route path="blog/create" element={<BlogEditor />} />
            <Route path="blog/edit/:id" element={<BlogEditor />} />
            <Route path="blog/settings" element={<Navigate to="/settings?tab=marketing" replace />} />

            {/* SEO Pages */}
            <Route path="seo/dashboard" element={<SeoDashboardPage />} />

            <Route path="seo/audit" element={<SiteAuditsPage />} />
            <Route path="seo/keywords" element={<KeywordsUnifiedPage />} />
            <Route path="seo/keyword-gap" element={<Navigate to="/marketing/seo/keywords?tab=gap" replace />} />
            <Route path="seo/clustering" element={<Navigate to="/marketing/seo/keywords?tab=clustering" replace />} />
            <Route path="seo/serp" element={<SerpAnalysisPage />} />
            <Route path="seo/content" element={<ContentOptimizerPage />} />
            <Route path="seo/analytics" element={<SeoAnalytics />} />
            <Route path="seo/backlinks" element={<BacklinksPage />} />
            <Route path="listings" element={<ListingsEnhanced />} />
            <Route path="seo/settings" element={<Navigate to="/settings?tab=marketing" replace />} />
            <Route path="seo" element={<Navigate to="/marketing/seo/dashboard" replace />} />

            <Route path="ads" element={<AdsManager />} />
            <Route path="qr-codes" element={<QRCodes />} />
            <Route path="funnels" element={<Funnels />} />
            <Route path="funnels/analytics" element={<FunnelAnalytics />} />
            <Route path="funnels/:id" element={<FunnelStepsEditor />} />
            <Route path="content" element={<ContentManagement />} />
            <Route path="acquisition" element={<CustomerAcquisition />} />
            <Route path="settings" element={<Navigate to="/settings?tab=marketing" replace />} />
            <Route index element={<Navigate to="/marketing/seo" replace />} />
            <Route path="*" element={<Navigate to="/marketing/seo" replace />} />
        </Routes>
    );
};

export default MarketingRoutes;
