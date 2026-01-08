import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

// Lazy load contact pages
const Contacts = lazy(() => import('@/pages/Contacts'));
const ListsPage = lazy(() => import('@/pages/contacts/ListsPage'));
const Segments = lazy(() => import('@/pages/Segments'));
const Companies = lazy(() => import('@/pages/Companies'));
const ContactProfile = lazy(() => import('@/pages/ContactProfile'));

export default function ContactsRoutes() {
    console.log('ContactsRoutes rendering');
    return (
        <Routes>
            <Route index element={<Contacts />} />
            <Route path="lists" element={<ListsPage />} />
            <Route path="segments" element={<Segments />} />
            <Route path="companies" element={<Contacts />} />
            <Route path=":id" element={<ContactProfile />} />
        </Routes>
    );
}
