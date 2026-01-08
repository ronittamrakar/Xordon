import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const FinanceOverview = lazy(() => import('@/pages/finance/FinanceOverview'));
const Estimates = lazy(() => import('@/pages/finance/Estimates'));
const Invoices = lazy(() => import('@/pages/finance/Invoices'));
const Products = lazy(() => import('@/pages/finance/Products'));
const Transactions = lazy(() => import('@/pages/finance/Transactions'));
const Subscriptions = lazy(() => import('@/pages/finance/Subscriptions'));
const Expenses = lazy(() => import('@/pages/finance/Expenses'));
const Payroll = lazy(() => import('@/pages/finance/Payroll'));
const Commissions = lazy(() => import('@/pages/finance/Commissions'));
const DunningSchedules = lazy(() => import('@/pages/finance/DunningSchedules'));
const FinanceIntegrations = lazy(() => import('@/pages/finance/FinanceIntegrations'));
const FinanceSettings = lazy(() => import('@/pages/finance/FinanceSettings'));
const ESignatures = lazy(() => import('@/pages/finance/ESignatures'));
const ConsumerFinancing = lazy(() => import('@/pages/finance/ConsumerFinancing'));
const FinanceAnalytics = lazy(() => import('@/pages/finance/FinanceAnalytics'));
const EstimatesAnalytics = lazy(() => import('@/pages/finance/EstimatesAnalytics'));


const FinanceRoutes = () => {
    return (
        <Routes>
            <Route index element={<FinanceOverview />} />
            <Route path="overview" element={<FinanceOverview />} />
            <Route path="analytics" element={<FinanceAnalytics />} />
            <Route path="estimates" element={<Estimates />} />
            <Route path="estimates/analytics" element={<EstimatesAnalytics />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="products" element={<Navigate to="/ecommerce/products" replace />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="consumer-financing" element={<ConsumerFinancing />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="commissions" element={<Commissions />} />
            <Route path="payment-reminders" element={<DunningSchedules />} />
            <Route path="integrations" element={<FinanceIntegrations />} />
            <Route path="e-signatures" element={<ESignatures />} />
            <Route path="settings" element={<Navigate to="/settings?tab=finance" replace />} />
            <Route path="*" element={<Navigate to="/finance" replace />} />
        </Routes>
    );
};

export default FinanceRoutes;
