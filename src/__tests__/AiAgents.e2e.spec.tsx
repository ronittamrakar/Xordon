import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AiAgents from '@/pages/ai/Agents';

const mockAgents = [
  { id: '1', user_id: '10', name: 'ChatBot A', type: 'chat', status: 'active', config: { greeting: 'hi' }, created_at: '2024-01-01' },
];
const mockCreate = { mutate: vi.fn((payload, opts) => opts.onSuccess && opts.onSuccess()) };
const mockUpdate = { mutate: vi.fn((payload, opts) => opts.onSuccess && opts.onSuccess()) };
const mockDelete = { mutate: vi.fn((id, opts) => opts.onSuccess && opts.onSuccess()) };

vi.mock('@/hooks/useAiAgents', () => ({
  useAiAgents: () => ({ data: mockAgents, isLoading: false }),
  useCreateAiAgent: () => mockCreate,
  useUpdateAiAgent: () => mockUpdate,
  useDeleteAiAgent: () => mockDelete,
}));

// Mock all sub-components
vi.mock('@/pages/ai/components/VoiceAi', () => ({ VoiceAi: () => <div>VoiceAi Component</div> }));
vi.mock('@/pages/ai/components/ConversationAi', () => ({ ConversationAi: () => <div>ConversationAi Component</div> }));
vi.mock('@/pages/ai/KnowledgeBase', () => ({ default: () => <div>KnowledgeBase Component</div> }));
vi.mock('@/pages/ai/components/AgentTemplates', () => ({ AgentTemplates: () => <div>AgentTemplates Component</div> }));
vi.mock('@/pages/ai/components/ContentAi', () => ({ ContentAi: () => <div>ContentAi Component</div> }));
vi.mock('@/pages/ai/AISettingsPage', () => ({ default: () => <div>AISettings Component</div> }));
vi.mock('@/pages/ai/AgentStudio', () => ({ default: () => <div>AgentStudio Component</div> }));

vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/ui/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

describe('AiAgents E2E-like flow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('navigates to /ai/agents and shows deployment dialog', async () => {
    render(
      <MemoryRouter initialEntries={["/ai/agents"]}>
        <Routes>
          <Route path="/ai/agents" element={<AiAgents />} />
        </Routes>
      </MemoryRouter>
    );

    // Ensure page loaded
    expect(await screen.findByText('AI Agents')).toBeInTheDocument();

    // Create - opens deployment selection
    fireEvent.click(screen.getByText(/Create Agent/i));
    await waitFor(() => expect(screen.getByText('Deploy New Agent')).toBeInTheDocument());
    expect(screen.getByText('Template Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Custom Agent')).toBeInTheDocument();
  });
});
