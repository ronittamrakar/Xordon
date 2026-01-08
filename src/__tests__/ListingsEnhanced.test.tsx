import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ListingsEnhanced from '@/pages/growth/ListingsEnhanced';
import { listingsApi } from '@/services';

// Mock the services
vi.mock('@/services', () => ({
  listingsApi: {
    getListings: vi.fn(),
    createListing: vi.fn(),
    bulkCreateListings: vi.fn(),
    updateListing: vi.fn(),
    syncListing: vi.fn(),
    bulkSync: vi.fn(),
    claimListing: vi.fn(),
    verifyListing: vi.fn(),
  },
}));

// Mock hooks
vi.mock('@/hooks/useActiveCompany', () => ({
  useActiveCompany: () => ({
    activeCompanyId: 1,
    hasCompany: true,
  }),
  companyQueryKey: (key: string, companyId: number, params?: any) => 
    params ? [key, companyId, params] : [key, companyId],
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockListingsData = {
  data: [
    {
      id: 1,
      workspace_id: 1,
      directory: 'google',
      directory_id: null,
      directory_name: 'Google Business Profile',
      listing_url: 'https://google.com/business/1',
      status: 'verified',
      claim_status: 'verified',
      sync_status: 'synced',
      business_name: 'Test Business 1',
      address: '123 Main St',
      phone: '555-1234',
      website: 'https://testbiz.com',
      categories: ['Restaurant'],
      accuracy_score: 95,
      review_count: 42,
      rating_avg: 4.5,
      last_synced_at: '2024-01-01T00:00:00Z',
      created_at: '2023-01-01T00:00:00Z',
      name_accurate: true,
      address_accurate: true,
      phone_accurate: true,
      website_accurate: true,
      hours_accurate: true,
      last_checked_at: '2024-01-01T00:00:00Z',
      last_updated_at: '2024-01-01T00:00:00Z',
      claim_url: null,
      sync_error: null,
      external_id: null,
      sync_provider: null,
      submission_data: null,
    },
    {
      id: 2,
      workspace_id: 1,
      directory: 'yelp',
      directory_id: null,
      directory_name: 'Yelp',
      listing_url: 'https://yelp.com/biz/test-2',
      status: 'pending',
      claim_status: 'unclaimed',
      sync_status: 'not_synced',
      business_name: 'Test Business 2',
      address: '456 Oak Ave',
      phone: '555-5678',
      website: null,
      categories: null,
      accuracy_score: 70,
      review_count: 0,
      rating_avg: null,
      last_synced_at: null,
      created_at: '2023-02-01T00:00:00Z',
      name_accurate: null,
      address_accurate: null,
      phone_accurate: null,
      website_accurate: null,
      hours_accurate: null,
      last_checked_at: null,
      last_updated_at: null,
      claim_url: null,
      sync_error: null,
      external_id: null,
      sync_provider: null,
      submission_data: null,
    },
  ],
  pagination: {
    total: 2,
    page: 1,
    per_page: 20,
    total_pages: 1,
  },
};

describe('ListingsEnhanced', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Polyfill scrollIntoView used by Radix in JSDOM
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Element.prototype.scrollIntoView = vi.fn();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.mocked(listingsApi.getListings).mockResolvedValue(mockListingsData);
  });

  const renderComponent = () => {
    return render(
      <HelmetProvider>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <ListingsEnhanced />
          </QueryClientProvider>
        </BrowserRouter>
      </HelmetProvider>
    );
  };

  it('renders loading state initially', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: /business listings/i })).toBeInTheDocument();
  });

  it('renders listings after loading', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Business 1')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Test Business 2')).toBeInTheDocument();
    expect(screen.getByText('Google Business Profile')).toBeInTheDocument();
    expect(screen.getByText('Yelp')).toBeInTheDocument();

    // New: table layout
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Business Info')).toBeInTheDocument();
  });

  it('displays stats correctly', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Total Listings')).toBeInTheDocument();
    });
    
    // Check stats cards
    expect(screen.getByText('2')).toBeInTheDocument(); // Total
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Claimed')).toBeInTheDocument();
    expect(screen.getByText('Needs Update')).toBeInTheDocument();
    expect(screen.getByText('Avg. Accuracy')).toBeInTheDocument();
  });

  it('shows empty state when no listings', async () => {
    vi.mocked(listingsApi.getListings).mockResolvedValue({ data: [], pagination: { total: 0, page: 1, per_page: 20, total_pages: 0 } });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/no listings found/i)).toBeInTheDocument();
    });
  });

  it('handles search input', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Business 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search listings/i);
    await user.type(searchInput, 'Business 1');
    
    await waitFor(() => {
      expect(listingsApi.getListings).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'Business 1' })
      );
    });
  });

  it('handles status filter', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Business 1')).toBeInTheDocument();
    });

    // Verify the status filter trigger exists (full select interaction is covered elsewhere / in integration tests)
    const statusTrigger = screen.getByText(/all statuses/i);
    expect(statusTrigger).toBeInTheDocument();
  });

  it('opens add listing dialog', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Business 1')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add listing/i });
    await user.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Add Business Listings')).toBeInTheDocument();
    });
  });

  it.skip('creates new listing and submits to the directory', async () => {
    const user = userEvent.setup();
    vi.mocked(listingsApi.createListing).mockResolvedValue({ id: 3 });
    vi.mocked(listingsApi.syncListing).mockResolvedValue({ success: true });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Business 1')).toBeInTheDocument();
    });

    // Open dialog
    const addButton = screen.getByRole('button', { name: /add listing/i });
    await user.click(addButton);
    
    await waitFor(() => {
      const businessNameInput = screen.getByPlaceholderText(/your business name/i);
      expect(businessNameInput).toBeInTheDocument();
    });

    // Choose custom directory so Add Listing is enabled
    const dialog = screen.getByRole('dialog', { name: /add business listings/i });
    const dirLabel = within(dialog).getByText(/^Directory$/i);
    const dirContainer = dirLabel.closest('div');
    const dirTrigger = within(dirContainer as HTMLElement).getByRole('combobox');
    await user.click(dirTrigger);
    const customOption = await within(dialog).findByText(/custom \/ manual entry/i);
    await user.click(customOption);

    // Fill form
    const businessNameInput = screen.getByPlaceholderText(/your business name/i);
    await user.type(businessNameInput, 'New Business');

    // Submit
    const submitButton = screen.getByRole('button', { name: /add listing/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(listingsApi.createListing).toHaveBeenCalledWith(
        expect.objectContaining({ business_name: 'New Business' })
      );
    });

    // The new listing should be automatically submitted to the directory (sync called)
    await waitFor(() => {
      expect(listingsApi.syncListing).toHaveBeenCalledWith(3);
    });
  });

  it('handles selection and bulk sync', async () => {
    const user = userEvent.setup();
    vi.mocked(listingsApi.bulkSync).mockResolvedValue({ success: true, count: 2 });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Business 1')).toBeInTheDocument();
    });

    // Select all
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
    await user.click(selectAllCheckbox);
    
    await waitFor(() => {
      expect(screen.getByText(/2 listings selected/i)).toBeInTheDocument();
    });

    // Bulk sync
    const syncButtons = screen.getAllByRole('button', { name: /sync selected/i });
    await user.click(syncButtons[0]);
    
    await waitFor(() => {
      expect(listingsApi.bulkSync).toHaveBeenCalledWith([1, 2]);
    });
  });

  it('opens edit drawer when edit button clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Business 1')).toBeInTheDocument();
    });

    // Find and click the edit button for the first listing row
    const firstRow = screen.getByText('Test Business 1').closest('tr');
    const editButton = within(firstRow as HTMLElement).getByRole('button', { name: /edit/i });
    await user.click(editButton);
    
    await waitFor(() => {
      expect(screen.getByText('Edit Listing')).toBeInTheDocument();
    });
  });

  it('handles pagination', async () => {
    const user = userEvent.setup();
    const paginatedData = {
      ...mockListingsData,
      pagination: {
        total: 50,
        page: 1,
        per_page: 20,
        total_pages: 3,
      },
    };
    vi.mocked(listingsApi.getListings).mockResolvedValue(paginatedData);
    
    renderComponent();
    
    await waitFor(() => {
      // Pagination summary should mention total
      expect(screen.getByText(/of 50/i)).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    
    await waitFor(() => {
      expect(listingsApi.getListings).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it('clears filters', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Business 1')).toBeInTheDocument();
    });

    // Add search query
    const searchInput = screen.getByPlaceholderText(/search listings/i);
    await user.type(searchInput, 'test');
    
    await waitFor(() => {
      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      expect(clearButton).toBeInTheDocument();
    });

    // Click clear filters (X button)
    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    await user.click(clearButton);
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });

  it.skip('handles bulk creation of listings', async () => {
    const user = userEvent.setup();
    const bulkCreateSpy = vi.spyOn(listingsApi, 'bulkCreateListings').mockResolvedValue({
      success: true,
      count: 2,
      ids: [101, 102]
    });
    const syncSpy = vi.spyOn(listingsApi, 'syncListing').mockResolvedValue({ success: true });

    renderComponent();

    // Open dialog
    const addButton = screen.getByRole('button', { name: /add listing/i });
    await user.click(addButton);

    // Switch to Multi-row tab
    const multiTab = screen.getByRole('tab', { name: /multi-row add/i });
    await user.click(multiTab);

    // Add a row
    const addRowButton = screen.getByRole('button', { name: /add another row/i });
    await user.click(addRowButton);

    // Fill in the first row
    const inputs = screen.getAllByLabelText(/business name/i);
    await user.type(inputs[0], 'Bulk Biz 1');

    // Submit
    const submitButton = screen.getByRole('button', { name: /add 1 listings/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(bulkCreateSpy).toHaveBeenCalled();
      expect(syncSpy).toHaveBeenCalledTimes(2); // Once for each ID returned
    });
  });
});
