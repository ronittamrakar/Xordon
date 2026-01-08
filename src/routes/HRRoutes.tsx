import React, { lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

const RecruitmentPage = lazy(() => import('@/pages/hr/RecruitmentPage'));
const SchedulingPage = lazy(() => import('@/pages/hr/SchedulingPage'));
const EmployeeProfilePage = lazy(() => import('@/pages/hr/EmployeeProfilePage'));
const LeaveManagement = lazy(() => import('@/pages/hr/LeaveManagement'));
const TimeTracking = lazy(() => import('@/pages/hr/TimeTracking'));
const ShiftScheduling = lazy(() => import('@/pages/hr/ShiftScheduling'));
const HRSettings = lazy(() => import('@/pages/hr/HRSettings'));
const EmployeesPage = lazy(() => import('@/pages/hr/Employees'));
const HRAnalytics = lazy(() => import('@/pages/hr/HRAnalytics'));

const HrRoutes = () => {
    return (
        <Routes>
            <Route index element={<Navigate to="recruitment" replace />} />
            <Route path="recruitment" element={<RecruitmentPage />} />
            <Route path="scheduling" element={<SchedulingPage />} />
            <Route path="leave" element={<LeaveManagement />} />
            <Route path="time-tracking" element={<TimeTracking />} />
            <Route path="shifts" element={<ShiftScheduling />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="employees/:id" element={<EmployeeProfilePage />} />
            <Route path="me" element={<EmployeeProfilePage />} />
            <Route path="analytics" element={<HRAnalytics />} />
            <Route path="settings" element={<HRSettings />} />
            <Route path="*" element={<Navigate to="recruitment" replace />} />
        </Routes>
    );
};

export default HrRoutes;
