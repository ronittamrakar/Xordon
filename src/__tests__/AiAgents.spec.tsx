import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AiAgents from '@/pages/ai/Agents';

// Mock hooks module
const mockAgents = [
  { id: '1', user_id: '10', name: 'ChatBot A', type: 'chat', status: 'active', config: { greeting: 'hi' }, created_at: '2024-01-01' },
  { id: '2', user_id: '10', name: 'VoiceBot B', type: 'voice', status: 'inactive', config: {}, created_at: '2024-01-01' },
];

const mockCreate = { mutate: vi.fn() };
const mockUpdate = { mutate: vi.fn() };
const mockDelete = { mutate: vi.fn() };

vi.mock('@/hooks/useAiAgents', () => ({
  useAiAgents: () => ({ data: mockAgents, isLoading: false }),
  useCreateAiAgent: () => mockCreate,
  useUpdateAiAgent: () => mockUpdate,
  useDeleteAiAgent: () => mockDelete,
}));

// Mock all sub-components to simplify testing
vi.mock('@/pages/ai/components/VoiceAi', () => ({ VoiceAi: () => <div>VoiceAi Component</div> }));
vi.mock('@/pages/ai/components/ConversationAi', () => ({ ConversationAi: () => <div>ConversationAi Component</div> }));
vi.mock('@/pages/ai/KnowledgeBase', () => ({ default: () => <div>KnowledgeBase Component</div> }));
vi.mock('@/pages/ai/components/AgentTemplates', () => ({ AgentTemplates: () => <div>AgentTemplates Component</div> }));
vi.mock('@/pages/ai/components/ContentAi', () => ({ ContentAi: () => <div>ContentAi Component</div> }));
vi.mock('@/pages/ai/AISettingsPage', () => ({ default: () => <div>AISettings Component</div> }));
vi.mock('@/pages/ai/AgentStudio', () => ({ default: () => <div>AgentStudio Component</div> }));

// Mock AppLayout so tests don't need router/providers
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: any) => <div>{children}</div> }));

// Mock toast to avoid needing sonner
vi.mock('@/components/ui/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

describe('AiAgents page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders agents page with tabs', async () => {
    render(<AiAgents />);
    expect(await screen.findByText('AI Agents')).toBeInTheDocument();
    expect(screen.getByText('Manage your AI assistants and automation configurations')).toBeInTheDocument();
    expect(screen.getByText(/Create Agent/i)).toBeInTheDocument();
  });

  it('can open deployment selection dialog', async () => {
    render(<AiAgents />);
    fireEvent.click(screen.getByText(/Create Agent/i));

    await waitFor(() => {
      expect(screen.getByText('Deploy New Agent')).toBeInTheDocument();
      expect(screen.getByText('Template Marketplace')).toBeInTheDocument();
      expect(screen.getByText('Custom Agent')).toBeInTheDocument();
    });
  });

  it('shows different tab content when tabs are clicked', async () => {
    render(<AiAgents />);
    
    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('AI Agents')).toBeInTheDocument();
    });
    
    // Click Voice Agents tab
    const voiceTab = screen.getByText('Voice Agents');
    fireEvent.click(voiceTab);
    await waitFor(() => {
      expect(screen.getByText('VoiceAi Component')).toBeInTheDocument();
    });
  });

  it.skip('navigates between tabs correctly', async () => {
    render(<AiAgents />);
    
    await waitFor(() => {
      expect(screen.getByText('AI Agents')).toBeInTheDocument();
    });
    
    // Click Knowledge Base tab
    const kbTab = screen.getByRole('tab', { name: /Knowledge Base/i });
    fireEvent.click(kbTab);
    
    await waitFor(() => {
      expect(screen.getByText('KnowledgeBase Component')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
