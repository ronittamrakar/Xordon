import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// WebForms Components (Lazy Loaded)
const FormsPage = lazy(() => import('../pages/FormsPage'));
const WebFormBuilder = lazy(() => import('../pages/webforms/WebFormBuilder'));
const WebFormPreview = lazy(() => import('../pages/webforms/WebFormPreview'));
const WebFormsAnalytics = lazy(() => import('../pages/webforms/WebFormsAnalytics'));
const WebFormsArchive = lazy(() => import('../pages/webforms/WebFormsArchive'));
const WebFormsTrash = lazy(() => import('../pages/webforms/WebFormsTrash'));
const WebFormsBrand = lazy(() => import('../pages/webforms/WebFormsBrand'));
const WebFormsDomains = lazy(() => import('../pages/webforms/WebFormsDomains'));
const WebFormsUsers = lazy(() => import('../pages/webforms/WebFormsUsers'));
const WebFormsWebhooks = lazy(() => import('../pages/webforms/WebFormsWebhooks'));

const WebFormsRoutes = () => {
    return (
        <Routes>
            {/* Root /forms and all tab routes render the FormsPage with tabs */}
            <Route index element={<FormsPage />} />
            <Route path="/templates" element={<FormsPage />} />
            <Route path="/submissions" element={<FormsPage />} />
            <Route path="/submissions/:formId" element={<FormsPage />} />

            {/* Builder routes moved to App.tsx for fullscreen layout */}
            <Route path="/preview/:id" element={<WebFormPreview />} />
            <Route path="/analytics" element={<WebFormsAnalytics />} />
            <Route path="/analytics/:formId" element={<WebFormsAnalytics />} />
            <Route path="/archive" element={<WebFormsArchive />} />
            <Route path="/trash" element={<WebFormsTrash />} />
            <Route path="/brand" element={<WebFormsBrand />} />
            <Route path="/domains" element={<WebFormsDomains />} />
            <Route path="/users" element={<WebFormsUsers />} />
            <Route path="/webhooks" element={<WebFormsWebhooks />} />
        </Routes>
    );
};

export default WebFormsRoutes;
