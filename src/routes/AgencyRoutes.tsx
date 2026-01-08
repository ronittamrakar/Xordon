import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// New consolidated pages
const AgencyManagementHub = lazy(() => import('@/pages/AgencyManagementHub'));
const ClientManagementHub = lazy(() => import('@/pages/ClientManagementHub'));

// Legacy pages (for backward compatibility)
const AgencySettings = lazy(() => import('@/pages/AgencySettings'));
const SubAccounts = lazy(() => import('@/pages/SubAccounts'));
const AgencyDashboard = lazy(() => import('@/pages/AgencyDashboard'));
const AgencyBilling = lazy(() => import('@/pages/AgencyBilling'));
const ClientDashboard = lazy(() => import('@/pages/ClientDashboard'));
const Users = lazy(() => import('@/pages/admin/Users'));

// Legacy page wrapper for backward compatibility
const LegacyPageWrapper = ({ 
  legacyComponent: LegacyComponent, 
  newComponent: NewComponent, 
  redirectPath 
}: { 
  legacyComponent: React.ComponentType<any>;
  newComponent: React.ComponentType<any>;
  redirectPath?: string;
}) => {
  const navigate = require('react-router-dom').useNavigate();
  
  React.useEffect(() => {
    // Log usage of legacy pages
    console.warn(`Legacy page accessed: ${window.location.pathname}`);
    
    // Optionally redirect after deprecation period
    if (redirectPath) {
      // Commented out for now to maintain backward compatibility
      // navigate(redirectPath, { replace: true });
    }
  }, [redirectPath, navigate]);
  
  // For now, render the new component but could render legacy if needed
  return <NewComponent />;
};

const AgencyRoutes = () => {
    return (
        <Routes>
            {/* New consolidated routes */}
            <Route path="/" element={<AgencyManagementHub />} />
            <Route path="/dashboard" element={<AgencyManagementHub activeTab="dashboard" />} />
            <Route path="/settings" element={<AgencyManagementHub activeTab="settings" />} />
            <Route path="/billing" element={<AgencyManagementHub activeTab="billing" />} />
            <Route path="/team" element={<AgencyManagementHub activeTab="team" />} />
            
            {/* Client management routes */}
            <Route path="/sub-accounts" element={<ClientManagementHub />} />
            <Route path="/clients" element={<ClientManagementHub activeTab="clients" />} />
            <Route path="/subaccounts" element={<ClientManagementHub activeTab="subaccounts" />} />
            <Route path="/proposal-clients" element={<ClientManagementHub activeTab="proposal_clients" />} />
            
            {/* Client portal routes */}
            <Route path="/client-portal" element={<ClientDashboard />} />
            <Route path="/portal/client" element={<ClientDashboard />} />
            
            {/* Legacy routes (backward compatibility) */}
            <Route path="/legacy/settings" element={
                <LegacyPageWrapper 
                    legacyComponent={AgencySettings} 
                    newComponent={AgencyManagementHub} 
                    redirectPath="/agency/settings" 
                />
            } />
            <Route path="/legacy/sub-accounts" element={
                <LegacyPageWrapper 
                    legacyComponent={SubAccounts} 
                    newComponent={ClientManagementHub} 
                    redirectPath="/agency/sub-accounts" 
                />
            } />
            <Route path="/legacy/dashboard" element={
                <LegacyPageWrapper 
                    legacyComponent={AgencyDashboard} 
                    newComponent={AgencyManagementHub} 
                    redirectPath="/agency/dashboard" 
                />
            } />
            <Route path="/legacy/billing" element={
                <LegacyPageWrapper 
                    legacyComponent={AgencyBilling} 
                    newComponent={AgencyManagementHub} 
                    redirectPath="/agency/billing" 
                />
            } />
            
            {/* Admin routes */}
            <Route path="/users" element={<Users />} />
        </Routes>
    );
};

export default AgencyRoutes;