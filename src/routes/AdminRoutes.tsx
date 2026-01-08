import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const SystemHealth = lazy(() => import('@/pages/admin/SystemHealth'));
const AuditLog = lazy(() => import('@/pages/AuditLog'));

const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="/health" element={<SystemHealth />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/" element={<SystemHealth />} />
        </Routes>
    );
};

export default AdminRoutes;
