import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { UnifiedAppProvider } from '@/contexts/UnifiedAppContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { CallSessionProvider } from '@/contexts/CallSessionContext';
import { Suspense, lazy } from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { AppLayout } from '@/components/layout/AppLayout';
import AutomationRoutes from '@/routes/AutomationRoutes';
// Force Vite Update - Triggering re-bundle for MarketplaceRoutes fix


// Lazy load pages
const Login = lazy(() => import('@/pages/Login'));
// ... imports



const AcceptInvite = lazy(() => import('@/pages/AcceptInvite'));
const PublicRoutes = lazy(() => import('@/routes/PublicRoutes'));
const MarketplaceRoutes = lazy(() => import('@/routes/MarketplaceRoutesFixed'));
const ReportRoutes = lazy(() => import('@/routes/ReportRoutes'));
const WebFormsRoutes = lazy(() => import('@/routes/WebFormsRoutes'));
const WebFormBuilder = lazy(() => import('@/pages/webforms/WebFormBuilder'));
const AdminRoutes = lazy(() => import('@/routes/AdminRoutes'));
const CRMRoutes = lazy(() => import('@/routes/CRMRoutes'));
const ReputationRoutes = lazy(() => import('@/routes/ReputationRoutes'));
const FinanceRoutes = lazy(() => import('@/routes/FinanceRoutes'));
const OperationsRoutes = lazy(() => import('@/routes/OperationsRoutes'));
const HRRoutes = lazy(() => import('@/routes/HRRoutes'));
const CultureRoutes = lazy(() => import('@/routes/CultureRoutes'));
const AIRoutes = lazy(() => import('@/routes/AIRoutes'));
const MarketingRoutes = lazy(() => import('@/routes/MarketingRoutes'));
const ReachRoutes = lazy(() => import('@/routes/ReachRoutes'));
const HelpdeskRoutes = lazy(() => import('@/routes/HelpdeskRoutes'));
const SettingsRoutes = lazy(() => import('@/routes/SettingsRoutes'));
// const AutomationRoutes = lazy(() => import('@/routes/AutomationRoutes'));
const CoursesRoutes = lazy(() => import('@/routes/CoursesRoutes'));
const SchedulingRoutes = lazy(() => import('@/routes/SchedulingRoutes'));
const AgencyRoutes = lazy(() => import('@/routes/AgencyRoutes'));
const EcommerceRoutes = lazy(() => import('@/routes/EcommerceRoutes'));
const SalesRoutes = lazy(() => import('@/routes/SalesRoutes'));

const ContactsRoutes = lazy(() => import('@/routes/ContactsRoutes'));
const MobileRoutes = lazy(() => import('@/routes/MobileRoutes'));
const ProposalRoutes = lazy(() => import('@/routes/ProposalRoutes'));
const WebsitesRoutes = lazy(() => import('@/routes/WebsitesRoutes'));
const Affiliates = lazy(() => import('@/pages/Affiliates'));
const AffiliateAnalytics = lazy(() => import('@/pages/affiliates/AffiliateAnalytics'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const UnifiedInbox = lazy(() => import('@/pages/UnifiedInbox'));
const TodaysTasks = lazy(() => import('@/pages/TodaysTasks'));
const Apps = lazy(() => import('@/pages/Apps'));
const Snapshots = lazy(() => import('@/pages/Snapshots'));
const AccountSettings = lazy(() => import('@/pages/AccountSettings'));
const MediaLibrary = lazy(() => import('@/pages/MediaLibrary'));
const Webhooks = lazy(() => import('@/pages/Webhooks'));
const Memberships = lazy(() => import('@/pages/Memberships'));
const Calendars = lazy(() => import('@/pages/Calendars'));
const Ecommerce = lazy(() => import('@/pages/Ecommerce'));
const Orders = lazy(() => import('@/pages/Orders'));


const ClientPortal = lazy(() => import('@/pages/ClientPortal'));
const CertificatesPage = lazy(() => import('@/pages/courses/CertificatesPage'));
const AnalyticsDashboard = lazy(() => import('@/pages/OptimizedAnalyticsDashboard'));
const OptimizedDashboard = lazy(() => import('@/pages/OptimizedDashboard'));
const Archive = lazy(() => import('@/pages/Archive'));
const Trash = lazy(() => import('@/pages/Trash'));
const ProjectRoutes = lazy(() => import('@/routes/ProjectRoutes'));
const PaymentProcessing = lazy(() => import('@/pages/payments/PaymentProcessing'));
const Payments = lazy(() => import('@/pages/Payments'));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      staleTime: 10 * 60 * 1000, // 10 minutes - increased from 5 to reduce refetches
      gcTime: 30 * 60 * 1000,   // 30 minutes - increased from 15 for better caching
      networkMode: 'offlineFirst', // Use cache first for better UX
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

const MainLayout = () => {
  return (
    <AppLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  );
};

// Main application component
function App() {
  if (import.meta.env.DEV) {
    console.log('[DEBUG] App rendering');
  }
  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <UnifiedAppProvider>
          <CallSessionProvider>
            <ThemeProvider>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    {/* Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/auth" element={<Navigate to="/login" replace />} />
                    <Route path="/invite/accept" element={<AcceptInvite />} />

                    {/* Standalone Form Builder Routes (No Layout) */}
                    <Route path="/forms/builder/:id" element={<WebFormBuilder />} />
                    <Route path="/forms/new" element={<WebFormBuilder />} />
                    <Route path="/forms/forms/:id/build" element={<WebFormBuilder />} />

                    {/* Protected App Routes - Wrapped in MainLayout */}
                    <Route element={<MainLayout />}>
                      <Route path="/lead-marketplace/*" element={<MarketplaceRoutes />} />
                      <Route path="/reports/*" element={<ReportRoutes />} />
                      <Route path="/forms/*" element={<WebFormsRoutes />} />
                      <Route path="/websites/*" element={<WebsitesRoutes />} />
                      <Route path="/proposals/*" element={<ProposalRoutes />} />
                      <Route path="/admin/*" element={<AdminRoutes />} />
                      <Route path="/crm/*" element={<CRMRoutes />} />
                      <Route path="/reputation/*" element={<ReputationRoutes />} />
                      <Route path="/finance/*" element={<FinanceRoutes />} />
                      <Route path="/operations/*" element={<OperationsRoutes />} />
                      <Route path="/hr/*" element={<HRRoutes />} />
                      <Route path="/culture/*" element={<CultureRoutes />} />
                      <Route path="/courses/*" element={<CoursesRoutes />} />
                      <Route path="/projects/*" element={<ProjectRoutes />} />
                      <Route path="/portal/client" element={<ClientPortal />} />
                      <Route path="/ai/*" element={<AIRoutes />} />
                      <Route path="/sales/*" element={<SalesRoutes />} />
                      <Route path="/marketing/*" element={<MarketingRoutes />} />
                      <Route path="/mobile/*" element={<MobileRoutes />} />
                      <Route path="/analytics/dashboard" element={<AnalyticsDashboard />} />
                      <Route path="/affiliates/analytics" element={<AffiliateAnalytics />} />
                      <Route path="/affiliates" element={<Affiliates />} />
                      <Route path="/get-quotes" element={<Navigate to="/lead-marketplace/quotes" replace />} />
                      <Route path="/outreach/*" element={<Navigate to="/reach" replace />} />
                      <Route path="/webforms/*" element={<Navigate to="/forms" replace />} />
                      <Route path="/reach/*" element={<ReachRoutes />} />
                      <Route path="/helpdesk/*" element={<HelpdeskRoutes />} />
                      <Route path="/settings/*" element={<SettingsRoutes />} />
                      <Route path="/workflows" element={<Navigate to="/automations/library" replace />} />
                      <Route path="/automations/*" element={<AutomationRoutes />} />
                      <Route path="/dashboard" element={<OptimizedDashboard />} />
                      <Route path="/inbox" element={<UnifiedInbox />} />
                      <Route path="/planner" element={<TodaysTasks />} />
                      <Route path="/apps" element={<Apps />} />
                      <Route path="/snapshots" element={<Snapshots />} />
                      <Route path="/contacts/*" element={<ContactsRoutes />} />
                      <Route path="/scheduling/*" element={<SchedulingRoutes />} />
                      <Route path="/payments/*" element={<Payments />} />

                      <Route path="/agency/*" element={<AgencyRoutes />} />
                      <Route path="/contacts-management/*" element={<Navigate to="/contacts" replace />} />
                      <Route path="/account-settings" element={<Navigate to="/settings?tab=profile" replace />} />
                      <Route path="/media" element={<MediaLibrary />} />
                      <Route path="/webhooks" element={<Webhooks />} />
                      <Route path="/memberships" element={<Memberships />} />
                      <Route path="/certificates" element={<CertificatesPage />} />
                      <Route path="/calendars" element={<Navigate to="/scheduling/calendars" replace />} />
                      <Route path="/ecommerce/*" element={<EcommerceRoutes />} />
                      <Route path="/orders" element={<Navigate to="/ecommerce/orders" replace />} />
                      <Route path="/archive" element={<Archive />} />
                      <Route path="/trash" element={<Trash />} />

                      <Route path="/referrals" element={<Navigate to="/operations/referrals" replace />} />
                      <Route path="/appointments/booking-pages" element={<Navigate to="/scheduling/booking-pages" replace />} />
                      <Route path="/appointments/calendars" element={<Navigate to="/scheduling/calendars" replace />} />
                      <Route path="/appointments/*" element={<Navigate to="/scheduling/appointments" replace />} />
                      <Route path="/app/*" element={<div>Select a feature from the sidebar</div>} />
                    </Route>

                    {/* Public Routes - Last to catch everything else */}
                    <Route path="/*" element={<PublicRoutes />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
              <Toaster position="top-right" richColors duration={2000} />
            </ThemeProvider>
          </CallSessionProvider>
        </UnifiedAppProvider>
      </TenantProvider>
    </QueryClientProvider >
  );
}

export default App;
