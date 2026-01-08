import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const SalesAnalytics = lazy(() => import('@/pages/sales/SalesAnalytics'));

const SalesRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/sales/analytics" replace />} />
            <Route path="/analytics" element={<SalesAnalytics />} />
            <Route path="*" element={<Navigate to="/sales/analytics" replace />} />
        </Routes>
    );
};

export default SalesRoutes;
