import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const Reports = lazy(() => import('@/pages/Reports'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const AdvancedReporting = lazy(() => import('@/pages/AdvancedReporting'));
const AllData = lazy(() => import('@/pages/AllData'));
const RevenueAttribution = lazy(() => import('@/pages/analytics/RevenueAttribution'));

const ReportRoutes = () => {
    return (
        <Routes>
            <Route index element={<Reports />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="advanced" element={<AdvancedReporting />} />
            <Route path="revenue-attribution" element={<RevenueAttribution />} />
            <Route path="all-data" element={<AllData />} />
            <Route path="*" element={<Navigate to="/reports" replace />} />
        </Routes>
    );
};

export default ReportRoutes;
