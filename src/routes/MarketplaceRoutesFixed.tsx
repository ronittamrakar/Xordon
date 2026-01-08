import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const LeadInbox = lazy(() => import("@/pages/marketplace/LeadInbox"));
const LeadDetail = lazy(() => import("@/pages/marketplace/LeadDetail"));
const LeadRequestDetail = lazy(() => import("@/pages/marketplace/LeadRequestDetail"));
const MarketplaceWallet = lazy(() => import("@/pages/marketplace/MarketplaceWallet"));
const MarketplacePreferences = lazy(() => import("@/pages/marketplace/MarketplacePreferences"));
const PricingRules = lazy(() => import("@/pages/marketplace/PricingRules"));
const ServiceCatalog = lazy(() => import("@/pages/marketplace/ServiceCatalog"));
const ProviderRegistration = lazy(() => import("@/pages/marketplace/ProviderRegistration"));
const LeadManagement = lazy(() => import("@/pages/marketplace/LeadManagement"));
const MarketplaceReviews = lazy(() => import("@/pages/marketplace/MarketplaceReviews"));
const ProviderDocuments = lazy(() => import("@/pages/marketplace/ProviderDocuments"));
const MarketplaceMessaging = lazy(() => import("@/pages/marketplace/MarketplaceMessaging"));
const MarketplaceBooking = lazy(() => import("@/pages/marketplace/MarketplaceBooking"));
const PublicLeadForm = lazy(() => import("@/pages/marketplace/PublicLeadForm"));
const EnhancedMarketplace = lazy(() => import("@/pages/marketplace/EnhancedMarketplace"));

const MarketplaceRoutes = () => {
    return (
        <Routes>
            <Route index element={<Navigate to="/lead-marketplace/leads" replace />} />
            <Route path="inbox" element={<LeadInbox />} />
            <Route path="leads" element={<LeadManagement />} />
            <Route path="leads/:id" element={<LeadDetail />} />
            <Route path="requests/:id" element={<LeadRequestDetail />} />
            <Route path="wallet" element={<MarketplaceWallet />} />
            <Route path="preferences" element={<MarketplacePreferences />} />
            <Route path="pricing-rules" element={<PricingRules />} />
            <Route path="services" element={<ServiceCatalog />} />
            <Route path="register" element={<ProviderRegistration />} />
            <Route path="quotes" element={<PublicLeadForm />} />
            <Route path="reviews" element={<MarketplaceReviews />} />
            <Route path="documents" element={<ProviderDocuments />} />
            <Route path="messaging" element={<MarketplaceMessaging />} />
            <Route path="booking" element={<MarketplaceBooking />} />
            <Route path="templates" element={<EnhancedMarketplace />} />
        </Routes>
    );
};

export default MarketplaceRoutes;
