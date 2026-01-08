import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/lib/api';
import { createLeadRequest, getServices, getWallet } from '../services/leadMarketplaceApi';

// Mock api
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApi = api as any;

describe('leadMarketplaceApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getServices', () => {
    it('should fetch services successfully', async () => {
      const mockServices = [
        { id: 1, name: 'Plumbing', slug: 'plumbing' },
        { id: 2, name: 'Electrical', slug: 'electrical' },
      ];

      mockedApi.get.mockResolvedValueOnce({
        success: true,
        data: mockServices,
      });

      const result = await getServices({ parent_id: null });

      expect(mockedApi.get).toHaveBeenCalledWith('/lead-marketplace/services', {
        params: { parent_id: null },
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockServices);
    });

    it('should handle service fetch errors', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(getServices({})).rejects.toThrow('Network error');
    });
  });

  describe('createLeadRequest', () => {
    it('should create lead request successfully', async () => {
      const payload = {
        consumer_name: 'John Doe',
        consumer_email: 'john@example.com',
        consumer_phone: '555-0100',
        services: [{ service_id: 1 }],
        title: 'Need plumbing help',
      };

      const mockResponse = {
        success: true,
        data: { id: 123, lead_price: 25, quality_score: 85, status: 'new' },
      };

      mockedApi.post.mockResolvedValueOnce(mockResponse);

      const result = await createLeadRequest(payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/lead-marketplace/leads', payload);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(123);
    });

    it('should handle 409 duplicate error', async () => {
      const payload = {
        consumer_email: 'duplicate@example.com',
        services: [{ service_id: 1 }],
      };

      mockedApi.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: { success: false, error: 'Duplicate request', existing_id: 100 },
        },
      });

      await expect(createLeadRequest(payload)).rejects.toMatchObject({
        response: {
          status: 409,
          data: expect.objectContaining({ error: 'Duplicate request' }),
        },
      });
    });

    it('should handle 422 validation error', async () => {
      const payload = {
        consumer_email: 'invalid-email',
        services: [{ service_id: 1 }],
      };

      mockedApi.post.mockRejectedValueOnce({
        response: {
          status: 422,
          data: { success: false, error: 'Invalid email format' },
        },
      });

      await expect(createLeadRequest(payload)).rejects.toMatchObject({
        response: {
          status: 422,
        },
      });
    });

    it('should handle 400 missing data error', async () => {
      const payload = {
        services: [],
      };

      mockedApi.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { success: false, error: 'At least one service required' },
        },
      });

      await expect(createLeadRequest(payload)).rejects.toMatchObject({
        response: {
          status: 400,
        },
      });
    });

    it('should handle 500 server error', async () => {
      const payload = {
        consumer_email: 'test@example.com',
        services: [{ service_id: 1 }],
      };

      mockedApi.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { success: false, error: 'Failed to create lead request' },
        },
      });

      await expect(createLeadRequest(payload)).rejects.toMatchObject({
        response: {
          status: 500,
        },
      });
    });
  });

  describe('getWallet', () => {
    it('should fetch wallet successfully', async () => {
      const mockWallet = {
        id: 1,
        balance: 150.50,
        currency: 'USD',
      };

      mockedApi.get.mockResolvedValueOnce({
        success: true,
        data: mockWallet,
      });

      const result = await getWallet();

      expect(mockedApi.get).toHaveBeenCalledWith('/lead-marketplace/wallet');
      expect(result.success).toBe(true);
      expect(result.data.balance).toBe(150.50);
    });

    it('should handle wallet fetch errors', async () => {
      mockedApi.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { success: false, error: 'Wallet not found' },
        },
      });

      await expect(getWallet()).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });
  });
});
