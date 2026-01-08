import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Operations Sub-pages
const OperationsDashboard = lazy(() => import('@/pages/operations/OperationsDashboard'));
const FieldService = lazy(() => import('@/pages/operations/FieldService'));
const FieldServiceAnalytics = lazy(() => import('@/pages/operations/FieldServiceAnalytics'));

const GPSTracking = lazy(() => import('@/pages/operations/GPSTracking'));

// Root pages mapped to Operations
const IndustrySettings = lazy(() => import('@/pages/IndustrySettings'));
const Services = lazy(() => import('@/pages/Services'));
const Jobs = lazy(() => import('@/pages/Jobs'));
const Requests = lazy(() => import('@/pages/Requests'));
const RequestDetail = lazy(() => import('@/pages/RequestDetail'));
const Referrals = lazy(() => import('@/pages/Referrals'));
const Recalls = lazy(() => import('@/pages/Recalls'));
const StaffMembers = lazy(() => import('@/pages/StaffMembers'));
const Payments = lazy(() => import('@/pages/Payments'));
const Appointments = lazy(() => import('@/pages/Appointments'));

const OperationsRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<OperationsDashboard />} />
            <Route path="/insights" element={<Navigate to="/operations" replace />} />
            <Route path="/dashboard" element={<OperationsDashboard />} />
            <Route path="/industry-settings" element={<IndustrySettings />} />
            <Route path="/services" element={<Services />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/requests/new" element={<RequestDetail />} />
            <Route path="/requests/:id" element={<RequestDetail />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/recalls" element={<Recalls />} />
            <Route path="/staff" element={<StaffMembers />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/appointments" element={<Navigate to="/scheduling/appointments" replace />} />
            {/* PhoneNumbers moved to Outreach/Calls */}
            <Route path="/field-service" element={<FieldService />} />
            <Route path="/field-service/analytics" element={<FieldServiceAnalytics />} />

            <Route path="/gps-tracking" element={<GPSTracking />} />
            {/* Ecommerce moved to its own top-level category */}
            <Route path="/ecommerce" element={<Navigate to="/ecommerce" replace />} />
            <Route path="/ecommerce/*" element={<Navigate to="/ecommerce" replace />} />
            <Route path="/client-portal" element={<Navigate to="/portal/client" replace />} />
        </Routes>
    );
};

export default OperationsRoutes;
