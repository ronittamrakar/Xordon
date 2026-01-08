import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const Overview = lazy(() => import('@/pages/reputation/Overview'));
const Requests = lazy(() => import('@/pages/reputation/Requests'));
const Reviews = lazy(() => import('@/pages/reputation/Reviews'));
const Widgets = lazy(() => import('@/pages/reputation/Widgets'));

const Settings = lazy(() => import('@/pages/reputation/Settings'));
const ReputationAnalytics = lazy(() => import('@/pages/reputation/ReputationAnalytics'));

const ReputationRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/reviews" element={<Reviews />} />
            {/* Redirect /responses to /reviews for backward compatibility */}
            <Route path="/responses" element={<Navigate to="/reputation/reviews" replace />} />
            <Route path="/widgets" element={<Widgets />} />
            <Route path="/listings" element={<Navigate to="/marketing/listings" replace />} />
            <Route path="/analytics" element={<ReputationAnalytics />} />
            <Route path="/settings" element={<Settings />} />
        </Routes>
    );
};

export default ReputationRoutes;
