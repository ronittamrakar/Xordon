import api from '@/lib/api';

export interface PayPalStatus {
  status: 'disconnected' | 'pending' | 'connected' | 'error' | 'disabled';
  mode?: 'sandbox' | 'live';
  connected_at?: string;
  error_message?: string;
}

export interface PayPalOrder {
  order_id: string;
  approval_url: string;
}

export interface PayPalCapture {
  capture_id: string;
  status: string;
}

// PayPal Payments API
export const paypalApi = {
  // Get connection status
  getStatus: () =>
    api.get<{ data: PayPalStatus }>('/paypal/status').then(r => r.data.data),

  // Connect PayPal account
  connect: (data: { client_id: string; client_secret: string; mode?: 'sandbox' | 'live' }) =>
    api.post<{ success: boolean; message: string }>('/paypal/connect', data).then(r => r.data),

  // Disconnect PayPal account
  disconnect: () =>
    api.post<{ success: boolean }>('/paypal/disconnect').then(r => r.data),

  // Create PayPal order for invoice payment
  createOrder: (invoiceId: number, workspaceId?: number) =>
    api.post<{ success: boolean; data: PayPalOrder }>('/paypal/order', { 
      invoice_id: invoiceId,
      workspace_id: workspaceId 
    }).then(r => r.data),

  // Capture PayPal order after customer approval
  captureOrder: (orderId: string) =>
    api.post<{ success: boolean; data: PayPalCapture }>('/paypal/capture', { order_id: orderId }).then(r => r.data),
};

export default paypalApi;
