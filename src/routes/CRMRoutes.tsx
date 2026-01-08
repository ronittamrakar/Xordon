import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const CRMDashboard = lazy(() => import('@/pages/crm/CRMDashboard'));
const DealsPage = lazy(() => import('@/pages/crm/DealsPage'));
const PipelinePage = lazy(() => import('@/pages/crm/PipelinePage'));
// const AnalyticsPage = lazy(() => import('@/pages/crm/AnalyticsPage'));
const ForecastingPage = lazy(() => import('@/pages/crm/ForecastingPage'));
const PlaybooksPage = lazy(() => import('@/pages/crm/PlaybooksPage'));
const GoalsPage = lazy(() => import('@/pages/crm/GoalsPage'));
const TasksPage = lazy(() => import('@/pages/crm/TasksPage'));
const LeadsPage = lazy(() => import('@/pages/crm/LeadsPage'));
const LeadScoring = lazy(() => import('@/pages/crm/LeadScoring'));

const CRMRoutes = () => {
    return (
        <Routes>
            <Route index element={<CRMDashboard />} />
            <Route path="deals" element={<DealsPage />} />
            <Route path="pipeline" element={<Navigate to="/crm/deals" replace />} />
            <Route path="analytics" element={<Navigate to="/sales/analytics" replace />} />
            <Route path="forecast" element={<ForecastingPage />} />
            <Route path="playbooks" element={<PlaybooksPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="leads" element={<Navigate to="/crm/deals?view=list" replace />} />
            <Route path="lead-scoring" element={<LeadScoring />} />
            <Route path="*" element={<Navigate to="/crm" replace />} />
        </Routes>
    );
};

export default CRMRoutes;
