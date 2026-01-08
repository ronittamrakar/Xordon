import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const UnifiedSettings = lazy(() => import('@/pages/UnifiedSettings'));
const WebhookManagement = lazy(() => import('@/pages/WebhookManagement'));

const SettingsRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<UnifiedSettings />} />
            <Route path="/webhooks" element={<WebhookManagement />} />
            <Route path="/*" element={<UnifiedSettings />} />
        </Routes>
    );
};

export default SettingsRoutes;
