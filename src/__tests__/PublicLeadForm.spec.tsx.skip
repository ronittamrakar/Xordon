import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PublicLeadForm from '../pages/marketplace/PublicLeadForm';
import * as leadMarketplaceApi from '../services/leadMarketplaceApi';

// Mock Radix Select to prevent infinite loop issues in JSDOM
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="mock-select">
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-value={value}>{children}</div>
  ),
}));

// Mock the API module
vi.mock('../services/leadMarketplaceApi');

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockServices = [
  { id: 1, name: 'Plumbing', slug: 'plumbing', icon: null, parent_id: null },
  { id: 2, name: 'Electrical', slug: 'electrical', icon: null, parent_id: null },
  { id: 3, name: 'HVAC', slug: 'hvac', icon: null, parent_id: null },
];

describe('PublicLeadForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (leadMarketplaceApi.getServices as any).mockResolvedValue({
      data: { success: true, data: mockServices },
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <PublicLeadForm />
      </BrowserRouter>
    );
  };

  it('should render the form with service options', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Get Free Quotes' })).toBeInTheDocument();
      expect(screen.getByText('Plumbing')).toBeInTheDocument();
      expect(screen.getByText('Electrical')).toBeInTheDocument();
      expect(screen.getByText('HVAC')).toBeInTheDocument();
    });
  });

  it('should allow service selection', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Plumbing')).toBeInTheDocument();
    });

    const plumbingOption = screen.getByText('Plumbing').closest('div');
    fireEvent.click(plumbingOption!);

    // Check that the service is selected
    const checkbox = plumbingOption!.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeChecked();
  });

  it('should show error when submitting without contact info', async () => {
    const { toast } = await import('sonner');
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Plumbing')).toBeInTheDocument();
    });

    // Select a service
    fireEvent.click(screen.getByText('Plumbing'));

    // Try to submit
    const submitButton = screen.getByRole('button', { name: /Get Free Quotes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please provide at least one contact method');
    });
  });

  it('should show error when submitting without services', async () => {
    const { toast } = await import('sonner');
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Plumbing')).toBeInTheDocument();
    });

    // Fill in contact info
    const nameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    // Try to submit without selecting services
    const submitButton = screen.getByRole('button', { name: /Get Free Quotes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please select at least one service');
    });
  });

  it('should submit form successfully', async () => {
    const { toast } = await import('sonner');
    (leadMarketplaceApi.createLeadRequest as any).mockResolvedValue({
      data: { success: true, data: { id: 123, lead_price: 25, quality_score: 85 } },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Plumbing')).toBeInTheDocument();
    });

    // Select service
    fireEvent.click(screen.getByText('Plumbing'));

    // Fill in form
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '555-0100' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Need help with leaking sink' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: /Get Free Quotes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(leadMarketplaceApi.createLeadRequest).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Request submitted successfully!');
      expect(screen.getByText(/Request Submitted!/i)).toBeInTheDocument();
    });
  });

  it('should handle 409 duplicate error', async () => {
    const { toast } = await import('sonner');
    (leadMarketplaceApi.createLeadRequest as any).mockRejectedValue({
      response: {
        status: 409,
        data: { success: false, error: 'Duplicate request' },
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Plumbing')).toBeInTheDocument();
    });

    // Fill and submit form
    fireEvent.click(screen.getByText('Plumbing'));
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Get Free Quotes/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'You recently submitted a similar request. Please wait 24 hours before submitting again.'
      );
    });
  });

  it('should handle 422 validation error', async () => {
    const { toast } = await import('sonner');
    (leadMarketplaceApi.createLeadRequest as any).mockRejectedValue({
      response: {
        status: 422,
        data: { success: false, error: 'Invalid email format' },
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Plumbing')).toBeInTheDocument();
    });

    // Fill and submit
    fireEvent.click(screen.getByText('Plumbing'));
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByRole('button', { name: /Get Free Quotes/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid')
      );
    });
  });

  it('should handle 500 server error', async () => {
    const { toast } = await import('sonner');
    (leadMarketplaceApi.createLeadRequest as any).mockRejectedValue({
      response: {
        status: 500,
        data: { success: false, error: 'Failed to create lead request' },
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Plumbing')).toBeInTheDocument();
    });

    // Fill and submit
    fireEvent.click(screen.getByText('Plumbing'));
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Server error. Please try again in a few moments or contact support.'
      );
    });
  });
});
