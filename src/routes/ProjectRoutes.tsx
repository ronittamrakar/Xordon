import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const ProjectsPage = lazy(() => import('@/pages/projects/ProjectsPage'));
const ProjectDetailsPage = lazy(() => import('@/pages/projects/ProjectDetailsPage'));
const ProjectAnalytics = lazy(() => import('@/pages/projects/ProjectAnalytics'));
const ProjectTemplates = lazy(() => import('@/pages/projects/ProjectTemplates'));

const MyTasksPage = lazy(() => import('@/pages/projects/MyTasksPage'));

const ProjectRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<ProjectsPage />} />
            <Route path="/new" element={<ProjectsPage />} />
            <Route path="/tasks" element={<MyTasksPage />} />
            <Route path="/templates" element={<ProjectTemplates />} />
            <Route path="/analytics" element={<ProjectAnalytics />} />
            {/* Archive is now handled globally at /archive */}
            <Route path="/:id" element={<ProjectDetailsPage />} />
            <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
    );
};

export default ProjectRoutes;
