import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Lazy load scheduling pages
const SchedulingUnified = lazy(() => import('@/pages/SchedulingUnified'));
const BookingPageBuilder = lazy(() => import('@/pages/BookingPageBuilder'));
const SchedulingAnalytics = lazy(() => import('@/pages/scheduling/SchedulingAnalytics'));

export default function SchedulingRoutes() {
    return (
        <Routes>
            {/* Unified Dashboard Routes */}
            <Route index element={<SchedulingUnified />} />
            <Route path="appointments" element={<SchedulingUnified />} />
            <Route path="appointments/new" element={<SchedulingUnified />} />
            <Route path="calendars" element={<SchedulingUnified />} />
            <Route path="payments" element={<SchedulingUnified />} />
            <Route path="calendar-sync" element={<SchedulingUnified />} />
            <Route path="analytics" element={<SchedulingAnalytics />} />

            {/* Booking Pages - List view is in Unified Dashboard */}
            <Route path="booking-pages" element={<SchedulingUnified />} />

            {/* Booking Page Builder - Standalone Editor */}
            <Route path="booking-pages/new" element={<BookingPageBuilder />} />
            <Route path="booking-pages/:id" element={<BookingPageBuilder />} />

            {/* Legacy/Redirects if needed */}
            <Route path="calendar" element={<Navigate to="calendars" replace />} />
        </Routes>
    );
}
