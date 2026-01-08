// Force rebuild: 2026-01-06T18:18:00
import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const AutomationsUnified = lazy(() => import('@/pages/AutomationsUnified'));
const FlowBuilder = lazy(() => import('@/pages/FlowBuilder'));
const ABTesting = lazy(() => import('@/pages/ABTesting'));
const SentimentConfig = lazy(() => import('@/pages/SentimentConfig'));
const AdvancedAutomationBuilder = lazy(() => import('@/pages/AdvancedAutomationBuilder'));
const AutomationAnalytics = lazy(() => import('@/pages/automations/AutomationAnalytics'));

// Flows page is now part of AutomationsUnified
// const Flows = lazy(() => import('@/pages/Flows'));

export default function AutomationRoutes() {
    return (
        <Routes>
            <Route path="/" element={<AutomationsUnified />} />
            <Route path="/analytics" element={<AutomationAnalytics />} />
            <Route path="/list" element={<Navigate to="/automations" replace />} />
            <Route path="/library" element={<AutomationsUnified />} />
            <Route path="/flows" element={<Navigate to="/automations" replace />} />
            <Route path="/flows/new" element={<FlowBuilder />} />
            <Route path="/flows/:id" element={<FlowBuilder />} />
            <Route path="/builder" element={<Navigate to="/automations/flows/new" replace />} />
            <Route path="/builder/builder" element={<Navigate to="/automations/flows/new" replace />} />
            <Route path="/builder/builder/:id" element={<FlowBuilder />} />
            <Route path="/builder/:id" element={<FlowBuilder />} />
            <Route path="/advanced-builder" element={<Navigate to="/automations" replace />} />
            <Route path="/ab-testing" element={<ABTesting />} />
            <Route path="/sentiment" element={<SentimentConfig />} />
            <Route path="/playbooks" element={<Navigate to="/automations?tab=playbooks" replace />} />
        </Routes>
    );
};


