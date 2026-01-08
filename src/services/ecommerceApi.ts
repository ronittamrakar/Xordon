import { api } from '@/lib/api';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface EcommerceStore {
    id: number;
    platform: 'shopify' | 'woocommerce' | 'magento' | 'bigcommerce' | 'custom';
    store_name: string;
    store_url: string;
    sync_status: 'pending' | 'syncing' | 'synced' | 'error';
    last_sync_at?: string;
    status: 'active' | 'paused' | 'disconnected';
    product_count?: number;
    order_count?: number;
    total_revenue?: number;
    created_at?: string;
    updated_at?: string;
}

export interface AbandonedCart {
    id: number;
    store_id?: number;
    contact_id?: number;
    email: string;
    contact_name?: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    recovery_status: 'pending' | 'email_sent' | 'sms_sent' | 'recovered' | 'expired';
    abandoned_at: string;
    recovered_at?: string;
    store_name?: string;
}

export interface Warehouse {
    id: number;
    name: string;
    location?: string;
    address?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Inventory {
    id: number;
    product_id: number;
    product_name?: string;
    product_sku?: string;
    warehouse_id: number;
    warehouse_name?: string;
    quantity_on_hand: number;
    quantity_available: number;
    quantity_reserved: number;
    reorder_point: number;
    reorder_quantity: number;
    created_at?: string;
    updated_at?: string;
}

export interface Coupon {
    id: number;
    code: string;
    name: string;
    type: 'percentage' | 'fixed' | 'free_shipping';
    value: number;
    min_purchase: number;
    max_discount?: number;
    usage_limit?: number;
    used_count: number;
    valid_from?: string;
    valid_until?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ShippingMethod {
    id: number;
    name: string;
    carrier?: string;
    rate_type: 'flat' | 'per_item' | 'per_weight' | 'calculated';
    base_rate: number;
    per_item_rate: number;
    per_weight_rate: number;
    min_delivery_days: number;
    max_delivery_days: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Collection {
    id: number;
    name: string;
    description?: string;
    image_url?: string;
    sort_order: number;
    is_active: boolean;
    product_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface CollectionProduct {
    id: number;
    collection_id: number;
    product_id: number;
    sort_order: number;
    product_name?: string;
    product_price?: number;
}

// ============================================
// ECOMMERCE API SERVICE
// ============================================

const ecommerceApi = {
    // ==================== STORES ====================

    async getStores() {
        const response = await api.get('/ecommerce/stores');
        return response.data;
    },

    async getStore(id: number) {
        const response = await api.get(`/ecommerce/stores/${id}`);
        return response.data;
    },

    async createStore(data: Partial<EcommerceStore>) {
        const response = await api.post('/ecommerce/stores', data);
        return response.data;
    },

    async updateStore(id: number, data: Partial<EcommerceStore>) {
        const response = await api.put(`/ecommerce/stores/${id}`, data);
        return response.data;
    },

    async deleteStore(id: number) {
        const response = await api.delete(`/ecommerce/stores/${id}`);
        return response.data;
    },

    async syncStore(id: number) {
        const response = await api.post(`/ecommerce/stores/${id}/sync`);
        return response.data;
    },

    async getDashboard() {
        const response = await api.get('/ecommerce/dashboard');
        return response.data;
    },

    // ==================== ABANDONED CARTS ====================

    async getAbandonedCarts() {
        const response = await api.get('/ecommerce/abandoned-carts');
        return response.data;
    },

    async recoverCart(id: number, channel: 'email' | 'sms') {
        const response = await api.post(`/ecommerce/abandoned-carts/${id}/recover`, { channel });
        return response.data;
    },

    // ==================== WAREHOUSES ====================

    async getWarehouses() {
        const response = await api.get('/ecommerce/warehouses');
        return response.data;
    },

    async createWarehouse(data: Partial<Warehouse>) {
        const response = await api.post('/ecommerce/warehouses', data);
        return response.data;
    },

    async updateWarehouse(id: number, data: Partial<Warehouse>) {
        const response = await api.put(`/ecommerce/warehouses/${id}`, data);
        return response.data;
    },

    async deleteWarehouse(id: number) {
        const response = await api.delete(`/ecommerce/warehouses/${id}`);
        return response.data;
    },

    // ==================== INVENTORY ====================

    async getInventory() {
        const response = await api.get('/ecommerce/inventory');
        return response.data;
    },

    async getInventoryStats() {
        const response = await api.get('/ecommerce/inventory/stats');
        return response.data;
    },

    async createInventory(data: Partial<Inventory>) {
        const response = await api.post('/ecommerce/inventory', data);
        return response.data;
    },

    async updateInventory(id: number, data: Partial<Inventory>) {
        const response = await api.put(`/ecommerce/inventory/${id}`, data);
        return response.data;
    },

    async deleteInventory(id: number) {
        const response = await api.delete(`/ecommerce/inventory/${id}`);
        return response.data;
    },

    // ==================== COUPONS ====================

    async getCoupons() {
        const response = await api.get('/ecommerce/coupons');
        return response.data;
    },

    async getCouponStats() {
        const response = await api.get('/ecommerce/coupons/stats');
        return response.data;
    },

    async createCoupon(data: Partial<Coupon>) {
        const response = await api.post('/ecommerce/coupons', data);
        return response.data;
    },

    async updateCoupon(id: number, data: Partial<Coupon>) {
        const response = await api.put(`/ecommerce/coupons/${id}`, data);
        return response.data;
    },

    async deleteCoupon(id: number) {
        const response = await api.delete(`/ecommerce/coupons/${id}`);
        return response.data;
    },

    async validateCoupon(code: string) {
        const response = await api.post('/ecommerce/coupons/validate', { code });
        return response.data;
    },

    // ==================== SHIPPING ====================

    async getShippingMethods() {
        const response = await api.get('/ecommerce/shipping-methods');
        return response.data;
    },

    async createShippingMethod(data: Partial<ShippingMethod>) {
        const response = await api.post('/ecommerce/shipping-methods', data);
        return response.data;
    },

    async updateShippingMethod(id: number, data: Partial<ShippingMethod>) {
        const response = await api.put(`/ecommerce/shipping-methods/${id}`, data);
        return response.data;
    },

    async deleteShippingMethod(id: number) {
        const response = await api.delete(`/ecommerce/shipping-methods/${id}`);
        return response.data;
    },

    // ==================== COLLECTIONS ====================

    async getCollections() {
        const response = await api.get('/ecommerce/collections');
        return response.data;
    },

    async getCollection(id: number) {
        const response = await api.get(`/ecommerce/collections/${id}`);
        return response.data;
    },

    async createCollection(data: Partial<Collection>) {
        const response = await api.post('/ecommerce/collections', data);
        return response.data;
    },

    async updateCollection(id: number, data: Partial<Collection>) {
        const response = await api.put(`/ecommerce/collections/${id}`, data);
        return response.data;
    },

    async deleteCollection(id: number) {
        const response = await api.delete(`/ecommerce/collections/${id}`);
        return response.data;
    },

    async getCollectionProducts(id: number) {
        const response = await api.get(`/ecommerce/collections/${id}/products`);
        return response.data;
    },

    async addProductToCollection(collectionId: number, productId: number, sortOrder?: number) {
        const response = await api.post(`/ecommerce/collections/${collectionId}/products`, {
            product_id: productId,
            sort_order: sortOrder,
        });
        return response.data;
    },

    async removeProductFromCollection(collectionId: number, productId: number) {
        const response = await api.delete(`/ecommerce/collections/${collectionId}/products/${productId}`);
        return response.data;
    },

    async reorderCollectionProducts(collectionId: number, productIds: number[]) {
        const response = await api.put(`/ecommerce/collections/${collectionId}/products/reorder`, {
            product_ids: productIds,
        });
        return response.data;
    },
};

export default ecommerceApi;
