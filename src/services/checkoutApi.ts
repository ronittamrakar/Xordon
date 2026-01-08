import { api } from '@/lib/api';

export interface CheckoutForm {
  id: number;
  workspace_id: number;
  company_id?: number;
  name: string;
  form_type: 'one-step' | 'two-step' | 'multi-step';
  products: any[];
  upsells?: any[];
  downsells?: any[];
  thank_you_page_url?: string;
  redirect_url?: string;
  custom_fields?: any;
  payment_methods?: string[];
  shipping_enabled: boolean;
  tax_enabled: boolean;
  tax_rate: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  order_count?: number;
  total_revenue?: number;
}

export interface Order {
  id: number;
  workspace_id: number;
  company_id?: number;
  checkout_form_id?: number;
  contact_id?: number;
  order_number: string;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  payment_intent_id?: string;
  shipping_address?: any;
  billing_address?: any;
  shipping_status: 'pending' | 'processing' | 'shipped' | 'delivered';
  tracking_number?: string;
  metadata?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id?: number;
  product_name: string;
  product_type?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  metadata?: any;
  created_at: string;
}

const checkoutApi = {
  // Checkout Forms
  listCheckoutForms: async (): Promise<CheckoutForm[]> => {
    const response = await api.get('/checkout/forms');
    return response.data;
  },

  createCheckoutForm: async (data: Partial<CheckoutForm>): Promise<{ checkout_form_id: number }> => {
    const response = await api.post('/checkout/forms', data);
    return response.data;
  },

  // Orders
  listOrders: async (params?: { status?: string; limit?: number; offset?: number }): Promise<Order[]> => {
    const response = await api.get('/checkout/orders', { params });
    return response.data;
  },

  getOrder: async (id: number): Promise<Order> => {
    const response = await api.get(`/checkout/orders/${id}`);
    return response.data;
  },

  createOrder: async (data: any): Promise<{ order_id: number; order_number: string }> => {
    const response = await api.post('/checkout/orders', data);
    return response.data;
  },

  updateOrderStatus: async (id: number, data: Partial<Order>): Promise<Order> => {
    const response = await api.put(`/checkout/orders/${id}`, data);
    return response.data;
  },
};

export default checkoutApi;
