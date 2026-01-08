import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TimeTracking from '@/pages/hr/TimeTracking';
import { timeTrackingApi, payrollApi } from '@/services';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithClient = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

// Mock APIs
vi.mock('@/services', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    timeTrackingApi: {
      getTimeEntries: vi.fn().mockResolvedValue({ data: [] }),
      getClockStatus: vi.fn().mockResolvedValue({ status: 'out' }),
      getTimesheets: vi.fn().mockResolvedValue([]),
      getLeaveRequests: vi.fn().mockResolvedValue([]),
      getLeaveBalances: vi.fn().mockResolvedValue({
        vacation_balance: 0,
        sick_balance: 0,
        personal_balance: 0
      }),
      getAnalytics: vi.fn().mockResolvedValue({
        time: { total_minutes: 0, billable_minutes: 0, total_amount: 0 }
      }),
      clockIn: vi.fn().mockResolvedValue({}),
      clockOut: vi.fn().mockResolvedValue({}),
      createTimeEntry: vi.fn().mockResolvedValue({}),
      requestLeave: vi.fn().mockResolvedValue({}),
    },
    payrollApi: {
      getPayPeriods: vi.fn().mockResolvedValue([]),
      getPayrollRecords: vi.fn().mockResolvedValue([]),
      getEmployeeCompensations: vi.fn().mockResolvedValue([]),
      getPayrollAnalytics: vi.fn().mockResolvedValue({
        ytd: { total_gross_pay: 0, total_net_pay: 0, total_taxes: 0, total_deductions: 0 },
        total_gross_pay: 0,
        total_net_pay: 0,
        total_taxes: 0,
        total_deductions: 0
      }),
    },
  };
});

// Mock AppLayout
vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: any) => <div>{children}</div>,
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('TimeTracking Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('renders the time tracking page', async () => {
    renderWithClient(<TimeTracking />);
    expect(await screen.findByText('Time Tracking')).toBeInTheDocument();
  });

  it('shows clock in button when clocked out', async () => {
    (timeTrackingApi.getClockStatus as any).mockResolvedValue({ status: 'out' });
    renderWithClient(<TimeTracking />);
    expect(await screen.findByText('Clock In')).toBeInTheDocument();
  });

  it('can open manual entry dialog', async () => {
    renderWithClient(<TimeTracking />);
    const addEntryButton = await screen.findByText('Manual Entry');
    fireEvent.click(addEntryButton);
    expect(screen.getByText('Add Manual Time Entry')).toBeInTheDocument();
  });

  it('can switch to Leave tab', async () => {
    const user = userEvent.setup();
    renderWithClient(<TimeTracking />);
    const leaveTab = screen.getByRole('tab', { name: /leave/i });
    await user.click(leaveTab);
    expect(await screen.findByText('Vacation')).toBeInTheDocument();
  });
});
