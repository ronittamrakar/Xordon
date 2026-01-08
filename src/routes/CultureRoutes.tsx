import React, { lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

const CultureDashboardPage = lazy(() => import('@/pages/culture/CultureDashboardPage'));
const CultureSurveysPage = lazy(() => import('@/pages/culture/CultureSurveysPage'));
const CultureEventsPage = lazy(() => import('@/pages/culture/CultureEventsPage'));
const CultureAnalytics = lazy(() => import('@/pages/culture/CultureAnalytics'));

const CultureRoutes = () => {
    return (
        <Routes>
            <Route index element={<Navigate to="/culture/dashboard" replace />} />
            <Route path="dashboard" element={<CultureDashboardPage />} />
            <Route path="surveys" element={<CultureSurveysPage />} />
            <Route path="events" element={<CultureEventsPage />} />
            <Route path="analytics" element={<CultureAnalytics />} />
            <Route path="*" element={<Navigate to="/culture/dashboard" replace />} />
        </Routes>
    );
};

export default CultureRoutes;
