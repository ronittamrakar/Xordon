import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from "@/components/AuthGuard";

const Landing = lazy(() => import("@/pages/Landing"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Auth = lazy(() => import("@/pages/Auth"));
const Unsubscribe = lazy(() => import("@/pages/Unsubscribe"));
const FormSubmit = lazy(() => import("@/pages/FormSubmit"));
const FormEmbed = lazy(() => import("@/pages/FormEmbed"));
const PublicBookingPage = lazy(() => import("@/pages/PublicBookingPage"));
const PublicBooking = lazy(() => import("@/pages/PublicBooking"));
const PublicWebFormSubmit = lazy(() => import("@/pages/webforms/PublicWebFormSubmit"));
const CustomerPortal = lazy(() => import("@/pages/CustomerPortal"));
const AffiliateReferral = lazy(() => import("@/pages/Affiliates"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const PublicLeadForm = lazy(() => import("@/pages/marketplace/PublicLeadForm"));
const CheckoutPage = lazy(() => import("@/pages/public/CheckoutPage"));
const CertificateVerification = lazy(() => import("@/pages/public/CertificateVerification"));
const PublicSigning = lazy(() => import("@/pages/public/PublicSigning"));

const PublicRoutes = () => {
    return (
        <Routes>
            <Route path="/sign/:token" element={<PublicSigning />} />

            <Route path="/" element={
                <AuthGuard requireAuth={false} redirectTo="/dashboard">
                    <Landing />
                </AuthGuard>
            } />
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={
                <AuthGuard requireAuth={false} redirectTo="/dashboard">
                    <Login />
                </AuthGuard>
            } />
            <Route path="/register" element={
                <AuthGuard requireAuth={false} redirectTo="/dashboard">
                    <Register />
                </AuthGuard>
            } />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/forms/:formId/submit" element={<FormSubmit />} />
            <Route path="/forms/:formId/embed" element={<FormEmbed />} />
            <Route path="/book/:slug" element={<PublicBookingPage />} />
            <Route path="/book/:userSlug/:typeSlug" element={<PublicBooking />} />
            <Route path="/f/:id" element={<PublicWebFormSubmit />} />
            <Route path="/portal/tickets" element={<CustomerPortal />} />
            <Route path="/portal/tickets/:ticketNumber" element={<CustomerPortal />} />
            <Route path="/ref/:code" element={<AffiliateReferral />} />
            <Route path="/get-quotes" element={<PublicLeadForm />} />
            <Route path="/request-service" element={<PublicLeadForm />} />
            <Route path="/checkout/:slug" element={<CheckoutPage />} />
            <Route path="/certificates/verify/:code" element={<CertificateVerification />} />
        </Routes>
    );
};

export default PublicRoutes;
