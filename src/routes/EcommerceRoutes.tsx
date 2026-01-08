import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Ecommerce pages
const Ecommerce = lazy(() => import('@/pages/Ecommerce'));
const Products = lazy(() => import('@/pages/finance/Products'));
const InventoryPage = lazy(() => import('@/pages/ecommerce/InventoryPage'));
const CouponsPage = lazy(() => import('@/pages/ecommerce/CouponsPage'));
const ShippingPage = lazy(() => import('@/pages/ecommerce/ShippingPage'));
const CollectionsPage = lazy(() => import('@/pages/ecommerce/CollectionsPage'));
const EcommerceSettings = lazy(() => import('@/pages/ecommerce/EcommerceSettings'));
const EcommerceAnalytics = lazy(() => import('@/pages/ecommerce/EcommerceAnalytics'));

// Orders page (from root)
const Orders = lazy(() => import('@/pages/Orders'));

const EcommerceRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Ecommerce />} />
            <Route path="/products" element={<Products />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/coupons" element={<CouponsPage />} />
            <Route path="/shipping" element={<ShippingPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/settings" element={<EcommerceSettings />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/analytics" element={<EcommerceAnalytics />} />
        </Routes>
    );
};

export default EcommerceRoutes;
