import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const HelpdeskDashboard = lazy(() => import('@/pages/HelpdeskDashboard'));
const Tickets = lazy(() => import('@/pages/Tickets'));
const TicketDetail = lazy(() => import('@/pages/TicketDetail'));
const KnowledgeBasePortal = lazy(() => import('@/pages/KnowledgeBasePortal'));

const HelpdeskAnalytics = lazy(() => import('@/pages/HelpdeskAnalytics'));
const CannedResponses = lazy(() => import('@/pages/CannedResponses'));
const TicketTeams = lazy(() => import('@/pages/TicketTeams'));
const SLAPolicies = lazy(() => import('@/pages/SLAPolicies'));
const LiveChat = lazy(() => import('@/pages/LiveChat'));

const HelpdeskRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<HelpdeskDashboard />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/tickets/new" element={<Tickets />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/help-center" element={<KnowledgeBasePortal />} />
            <Route path="/help-center/:slug" element={<KnowledgeBasePortal />} />
            <Route path="/help-center/manage/*" element={<KnowledgeBasePortal />} />

            <Route path="/analytics" element={<HelpdeskAnalytics />} />
            <Route path="/canned-responses" element={<CannedResponses />} />
            <Route path="/teams" element={<TicketTeams />} />
            <Route path="/sla-policies" element={<SLAPolicies />} />
            <Route path="/live-chat" element={<LiveChat />} />
        </Routes>
    );
};

export default HelpdeskRoutes;
