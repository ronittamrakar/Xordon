import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const LeadInbox = lazy(() => import('../pages/marketplace/LeadInbox'));
const LeadManagement = lazy(() => import('../pages/marketplace/LeadManagement'));
const MarketplaceBooking = lazy(() => import('../pages/marketplace/MarketplaceBooking'));
const MarketplaceMessaging = lazy(() => import('../pages/marketplace/MarketplaceMessaging'));
const MarketplaceReviews = lazy(() => import('../pages/marketplace/MarketplaceReviews'));
const ProviderDocuments = lazy(() => import('../pages/marketplace/ProviderDocuments'));
const MarketplaceWallet = lazy(() => import('../pages/marketplace/MarketplaceWallet'));
const EnhancedMarketplace = lazy(() => import('../pages/marketplace/EnhancedMarketplace'));
const MarketplacePreferences = lazy(() => import('../pages/marketplace/MarketplacePreferences'));
const PricingRules = lazy(() => import('../pages/marketplace/PricingRules'));
const ServiceCatalog = lazy(() => import('../pages/marketplace/ServiceCatalog'));
const ProviderRegistration = lazy(() => import('../pages/marketplace/ProviderRegistration'));
const LeadDetail = lazy(() => import('../pages/marketplace/LeadDetail'));
const LeadRequestDetail = lazy(() => import('../pages/marketplace/LeadRequestDetail'));
const PublicLeadForm = lazy(() => import('../pages/marketplace/PublicLeadForm'));

export default function MarketplaceRoutes() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
            <Routes>
                <Route path="/" element={<Navigate to="inbox" replace />} />
                <Route path="inbox" element={<LeadInbox />} />
                <Route path="leads" element={<LeadManagement />} />
                <Route path="leads/:id" element={<LeadDetail />} />
                <Route path="requests/:id" element={<LeadRequestDetail />} />
                <Route path="booking" element={<MarketplaceBooking />} />
                <Route path="messaging" element={<MarketplaceMessaging />} />
                <Route path="reviews" element={<MarketplaceReviews />} />
                <Route path="documents" element={<ProviderDocuments />} />
                <Route path="wallet" element={<MarketplaceWallet />} />
                <Route path="templates" element={<EnhancedMarketplace />} />
                <Route path="preferences" element={<MarketplacePreferences />} />
                <Route path="pricing-rules" element={<PricingRules />} />
                <Route path="services" element={<ServiceCatalog />} />
                <Route path="register" element={<ProviderRegistration />} />
                <Route path="form/:id" element={<PublicLeadForm />} />
            </Routes>
        </Suspense>
    );
}
