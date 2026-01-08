import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PublicWebFormSubmit from '../pages/webforms/PublicWebFormSubmit';
import { webformsApi } from '../services/webformsApi';

// Mock the API module
vi.mock('../services/webformsApi');

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockForm = {
  id: 'test-form',
  name: 'Test Form',
  title: 'Test Form',
  status: 'published',
  fields: [
    { id: 'f1', type: 'text', label: 'Name', required: true },
    { id: 'f2', type: 'email', label: 'Email', required: true },
  ],
  settings: {
    design: {
      primaryColor: '#000000',
    },
  },
};

describe('PublicWebFormSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (webformsApi.getPublicForm as any).mockResolvedValue({
      success: true,
      data: mockForm,
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/w/test-form']}>
          <Routes>
            <Route path="/w/:id" element={<PublicWebFormSubmit />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('should render the form fields', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Form')).toBeInTheDocument();
      expect(screen.getByText(/Name/)).toBeInTheDocument();
      expect(screen.getByText(/Email/)).toBeInTheDocument();
    });
  });
});
