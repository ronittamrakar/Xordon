import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const Agents = lazy(() => import('@/pages/ai/Agents'));
// const AgentStudio = lazy(() => import('@/pages/ai/AgentStudio'));
const VoiceAIPage = lazy(() => import('@/pages/ai/VoiceAIPage'));
const ConversationAIPage = lazy(() => import('@/pages/ai/ConversationAIPage'));
const KnowledgeBase = lazy(() => import('@/pages/ai/KnowledgeBase'));
const AgentTemplates = lazy(() => import('@/pages/ai/AgentTemplatesPage'));
const ContentAIPage = lazy(() => import('@/pages/ai/ContentAIPage'));
const AISettingsPage = lazy(() => import('@/pages/ai/AISettingsPage'));
const AIConsole = lazy(() => import('@/pages/ai/Console'));
const AdvancedChatbot = lazy(() => import('@/pages/ai/AdvancedChatbot'));
const AIAnalytics = lazy(() => import('@/pages/ai/AIAnalytics'));

// AI Workforce Pages
const AIWorkforceHub = lazy(() => import('@/pages/ai/workforce/AIWorkforceHub'));
const EmployeeManagement = lazy(() => import('@/pages/ai/workforce/EmployeeManagement'));
const ApprovalsQueue = lazy(() => import('@/pages/ai/workforce/ApprovalsQueue'));
const WorkforceHistory = lazy(() => import('@/pages/ai/workforce/WorkforceHistory'));
const WorkforceAnalytics = lazy(() => import('@/pages/ai/workforce/WorkforceAnalytics'));
const WorkforceAutomation = lazy(() => import('@/pages/ai/workforce/WorkflowStudio'));

// AI Console should be the main dashboard, Agent Studio is a specific feature
const AIRoutes = () => {
    return (
        <Routes>
            <Route path="agents" element={<Agents />} />
            <Route path="agent-studio" element={<Navigate to="/ai/agents" replace />} />
            <Route path="voice-ai" element={<VoiceAIPage />} />
            <Route path="conversation-ai" element={<ConversationAIPage />} />
            <Route path="knowledge-hub" element={<KnowledgeBase />} />
            <Route path="agent-templates" element={<AgentTemplates />} />
            <Route path="content-ai" element={<ContentAIPage />} />
            <Route path="settings" element={<AISettingsPage />} />
            <Route path="console" element={<AIConsole />} />
            <Route path="chatbot" element={<AdvancedChatbot />} />
            <Route path="analytics" element={<AIAnalytics />} />

            {/* AI Workforce Routes */}
            <Route path="workforce" element={<AIWorkforceHub />} />
            <Route path="workforce/employees" element={<EmployeeManagement />} />
            <Route path="workforce/approvals" element={<ApprovalsQueue />} />
            <Route path="workforce/history" element={<WorkforceHistory />} />
            <Route path="workforce/analytics" element={<WorkforceAnalytics />} />
            <Route path="workforce/workflows" element={<WorkforceAutomation />} />

            <Route index element={<AIConsole />} />
            <Route path="*" element={<Navigate to="/ai/console" replace />} />
        </Routes>
    );
};

export default AIRoutes;
