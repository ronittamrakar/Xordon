<?php
/**
 * AI Module Routes
 * Handles all AI workforce, agents, and automation endpoints
 * 
 * Required variables: $path, $method
 * Must return true if route matched, false otherwise
 */

// Load AI Controllers (they are autoloaded, but ensure availability)
// Controllers: AiAgentsController, AIFeaturesController, AIKnowledgeBaseController, AISettingsController, AiController

/**
 * Match AI routes
 * @return bool True if route matched
 */
function matchAIRoutes(string $path, string $method): bool {
    
    // AI Agents
    if ($path === '/ai/agents' && $method === 'GET') {
        return AiAgentsController::listAgents();
    }
    if ($path === '/ai/agents' && $method === 'POST') {
        return AiAgentsController::createAgent();
    }
    if (preg_match('#^/ai/agents/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return AiAgentsController::getAgent($id);
        if ($method === 'PUT' || $method === 'PATCH') return AiAgentsController::updateAgent($id);
        if ($method === 'DELETE') return AiAgentsController::deleteAgent($id);
    }
    
    // AI Chat/Conversations
    if ($path === '/ai/chat' && $method === 'POST') {
        return AiController::chat();
    }
    if ($path === '/ai/chat/stream' && $method === 'POST') {
        return AiController::streamChat();
    }
    
    // AI Generation Features
    if ($path === '/ai/generate/email' && $method === 'POST') {
        return AIFeaturesController::generateEmail();
    }
    if ($path === '/ai/generate/sms' && $method === 'POST') {
        return AIFeaturesController::generateSMS();
    }
    if ($path === '/ai/generate/script' && $method === 'POST') {
        return AIFeaturesController::generateScript();
    }
    if ($path === '/ai/generate/response' && $method === 'POST') {
        return AIFeaturesController::generateResponse();
    }
    if ($path === '/ai/generate/summary' && $method === 'POST') {
        return AIFeaturesController::summarize();
    }
    if ($path === '/ai/generate/landing-page' && $method === 'POST') {
        return AIFeaturesController::generateLandingPage();
    }
    
    // AI Analysis Features
    if ($path === '/ai/analyze/sentiment' && $method === 'POST') {
        return AIFeaturesController::analyzeSentiment();
    }
    if ($path === '/ai/analyze/lead' && $method === 'POST') {
        return AIFeaturesController::analyzeLeadQuality();
    }
    if ($path === '/ai/analyze/campaign' && $method === 'POST') {
        return AIFeaturesController::analyzeCampaignPerformance();
    }
    
    // AI Knowledge Base
    if ($path === '/ai/knowledge' && $method === 'GET') {
        return AIKnowledgeBaseController::listDocuments();
    }
    if ($path === '/ai/knowledge' && $method === 'POST') {
        return AIKnowledgeBaseController::uploadDocument();
    }
    if ($path === '/ai/knowledge/search' && $method === 'POST') {
        return AIKnowledgeBaseController::search();
    }
    if (preg_match('#^/ai/knowledge/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return AIKnowledgeBaseController::getDocument($id);
        if ($method === 'DELETE') return AIKnowledgeBaseController::deleteDocument($id);
    }
    
    // AI Settings
    if ($path === '/ai/settings' && $method === 'GET') {
        return AISettingsController::getSettings();
    }
    if ($path === '/ai/settings' && $method === 'PUT') {
        return AISettingsController::updateSettings();
    }
    if ($path === '/ai/providers' && $method === 'GET') {
        return AISettingsController::listProviders();
    }
    if ($path === '/ai/usage' && $method === 'GET') {
        return AISettingsController::getUsageStats();
    }
    
    // AI Workflows (for AI Workforce feature)
    if ($path === '/ai/workflows' && $method === 'GET') {
        return AIWorkforceController::listWorkflows();
    }
    if ($path === '/ai/workflows' && $method === 'POST') {
        return AIWorkforceController::createWorkflow();
    }
    if (preg_match('#^/ai/workflows/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return AIWorkforceController::getWorkflow($id);
        if ($method === 'PUT' || $method === 'PATCH') return AIWorkforceController::updateWorkflow($id);
        if ($method === 'DELETE') return AIWorkforceController::deleteWorkflow($id);
    }
    if (preg_match('#^/ai/workflows/(\d+)/execute$#', $path, $m) && $method === 'POST') {
        return AIWorkforceController::executeWorkflow((int)$m[1]);
    }
    
    // AI Employees (AI Workforce)
    if ($path === '/ai/employees' && $method === 'GET') {
        return AIWorkforceController::listEmployees();
    }
    if ($path === '/ai/employees' && $method === 'POST') {
        return AIWorkforceController::createEmployee();
    }
    if (preg_match('#^/ai/employees/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return AIWorkforceController::getEmployee($id);
        if ($method === 'PUT' || $method === 'PATCH') return AIWorkforceController::updateEmployee($id);
        if ($method === 'DELETE') return AIWorkforceController::deleteEmployee($id);
    }
    
    // AI Capabilities
    if ($path === '/ai/capabilities' && $method === 'GET') {
        return AIWorkforceController::listCapabilities();
    }
    
    // AI Task Queue
    if ($path === '/ai/tasks' && $method === 'GET') {
        return AIWorkforceController::listTasks();
    }
    if ($path === '/ai/tasks' && $method === 'POST') {
        return AIWorkforceController::createTask();
    }
    if (preg_match('#^/ai/tasks/(\d+)/status$#', $path, $m) && $method === 'GET') {
        return AIWorkforceController::getTaskStatus((int)$m[1]);
    }
    
    return false; // No route matched
}

// Auto-execute if path starts with /ai
if (isset($path) && isset($method) && strpos($path, '/ai') === 0) {
    if (matchAIRoutes($path, $method)) {
        return; // Route handled
    }
}
