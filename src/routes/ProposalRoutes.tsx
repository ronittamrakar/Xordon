import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const Proposals = lazy(() => import('@/pages/Proposals'));
const ProposalTemplates = lazy(() => import('@/pages/ProposalTemplates'));
const ProposalBuilder = lazy(() => import('@/pages/ProposalBuilder'));
const ProposalPreview = lazy(() => import('@/pages/ProposalPreview'));
const PublicProposalView = lazy(() => import('@/pages/PublicProposalView'));
const ProposalAnalytics = lazy(() => import('@/pages/ProposalAnalytics'));

const ProposalWorkflow = lazy(() => import('@/pages/ProposalWorkflow'));
const ProposalArchive = lazy(() => import('@/pages/ProposalArchive'));
const ProposalIntegrations = lazy(() => import('@/pages/ProposalIntegrations'));

const ProposalRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Proposals />} />
            <Route path="/settings" element={<Navigate to="/settings#proposals" replace />} />
            <Route path="/templates" element={
                <React.Suspense fallback={<div>Loading...</div>}>
                    <ProposalTemplates />
                </React.Suspense>
            } />
            <Route path="/new" element={
                <React.Suspense fallback={<div>Loading...</div>}>
                    <ProposalBuilder />
                </React.Suspense>
            } />
            <Route path="/:id" element={
                <React.Suspense fallback={<div>Loading...</div>}>
                    <ProposalPreview />
                </React.Suspense>
            } />
            <Route path="/:id/edit" element={
                <React.Suspense fallback={<div>Loading...</div>}>
                    <ProposalBuilder />
                </React.Suspense>
            } />

            {/* New Routes */}
            <Route path="/public/:token" element={
                <React.Suspense fallback={<div>Loading...</div>}>
                    <PublicProposalView />
                </React.Suspense>
            } />
            <Route path="/analytics" element={
                <React.Suspense fallback={<div>Loading...</div>}>
                    <ProposalAnalytics />
                </React.Suspense>
            } />
            <Route path="/clients" element={<Navigate to="/contacts?view=proposals" replace />} />
            <Route path="/workflow" element={
                <React.Suspense fallback={<div>Loading...</div>}>
                    <ProposalWorkflow />
                </React.Suspense>
            } />
            <Route path="/archive" element={
                <React.Suspense fallback={<div>Loading...</div>}>
                    <ProposalArchive />
                </React.Suspense>
            } />
            <Route path="/integrations" element={
                <React.Suspense fallback={<div>Loading...</div>}>
                    <ProposalIntegrations />
                </React.Suspense>
            } />
        </Routes>
    );
};

export default ProposalRoutes;
