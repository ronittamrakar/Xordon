import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const MobileRoutes = () => {
    return (
        <Routes>
            <Route path="/settings" element={<Navigate to="/settings?tab=mobile" replace />} />
            <Route path="/push-notifications" element={<Navigate to="/settings?tab=push-notifications" replace />} />
            <Route path="/" element={<Navigate to="/settings?tab=mobile" replace />} />
        </Routes>
    );
};

export default MobileRoutes;
