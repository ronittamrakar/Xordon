import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

// Lazy load course pages
const CoursesPage = lazy(() => import('@/pages/courses/CoursesPage'));
const CourseBuilderPage = lazy(() => import('@/pages/courses/CourseBuilderPage'));
const MyEnrollmentsPage = lazy(() => import('@/pages/courses/MyEnrollmentsPage'));
const CertificatesPage = lazy(() => import('@/pages/courses/CertificatesPage'));
const QuizBuilderPage = lazy(() => import('@/pages/courses/QuizBuilderPage'));
const QuizTakePage = lazy(() => import('@/pages/courses/QuizTakePage'));
const CoursePlayerPage = lazy(() => import('@/pages/courses/CoursePlayerPage'));
const CoursesAnalytics = lazy(() => import('@/pages/courses/CoursesAnalytics'));

export default function CoursesRoutes() {
    return (
        <Routes>
            <Route index element={<CoursesPage />} />
            <Route path="analytics" element={<CoursesAnalytics />} />
            <Route path="new" element={<CourseBuilderPage />} />
            <Route path="my-enrollments" element={<MyEnrollmentsPage />} />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path=":courseId/quizzes/new" element={<QuizBuilderPage />} />
            <Route path=":courseId/quizzes/:quizId/edit" element={<QuizBuilderPage />} />
            <Route path="quizzes/:quizId/take" element={<QuizTakePage />} />
            <Route path=":courseId/learn" element={<CoursePlayerPage />} />
            <Route path=":id" element={<CourseBuilderPage />} />
        </Routes>
    );
}
