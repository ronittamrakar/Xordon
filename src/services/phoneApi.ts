import api from '@/lib/api';

export interface PhoneNumber {
  id: number;
  workspace_id: number;
  phone_number: string;
  friendly_name: string;
  provider: 'twilio' | 'signalwire';
  provider_sid: string;
  capabilities: {
    voice?: boolean;
    sms?: boolean;
    mms?: boolean;
  };
  status: 'active' | 'released';
  created_at: string;
  released_at?: string;
  // Configuration fields
  forwarding_number?: string;
  pass_call_id?: boolean;
  whisper_message?: string;
  call_recording?: boolean;
  tracking_campaign?: string;
  destination_type?: 'forward' | 'voice_bot' | 'application'; // To support different routings
  voicemail_greeting?: string;
}

export interface AvailableNumber {
  phone_number: string;
  friendly_name: string;
  capabilities: {
    voice?: boolean;
    sms?: boolean;
    mms?: boolean;
  };
}

export interface IVRMenu {
  id: number;
  workspace_id: number;
  phone_number_id: number;
  name: string;
  greeting?: string;
  menu_config: {
    greeting?: string;
    prompt?: string;
    options?: Array<{
      digit: string;
      action: string;
      destination?: string;
    }>;
  };
  is_active: boolean;
}

export const phoneApi = {
  // Phone Numbers
  list: async (): Promise<PhoneNumber[]> => {
    const response = await api.get('/phone-numbers');
    return (response.data as any)?.items ?? [];
  },

  search: async (areaCode: string, country = 'US'): Promise<AvailableNumber[]> => {
    const response = await api.get(`/phone-numbers/search?area_code=${areaCode}&country=${country}`);
    return (response.data as any)?.items ?? [];
  },

  purchase: async (phoneNumber: string, friendlyName?: string) => {
    const response = await api.post('/phone-numbers', {
      phone_number: phoneNumber,
      friendly_name: friendlyName,
    });
    return response.data;
  },

  update: async (id: number, data: Partial<PhoneNumber>) => {
    const response = await api.put(`/phone-numbers/${id}`, data);
    return response.data;
  },

  release: async (id: number) => {
    const response = await api.delete(`/phone-numbers/${id}`);
    return response.data;
  },

  // IVR Menus
  getIVRMenus: async (phoneNumberId: number) => {
    const response = await api.get(`/phone/${phoneNumberId}/ivr-menus`);
    return response.data;
  },

  createIVRMenu: async (phoneNumberId: number, data: Partial<IVRMenu>) => {
    const response = await api.post(`/phone/${phoneNumberId}/ivr-menus`, data);
    return response.data;
  },

  updateIVRMenu: async (menuId: number, data: Partial<IVRMenu>) => {
    const response = await api.put(`/phone/ivr-menus/${menuId}`, data);
    return response.data;
  },

  deleteIVRMenu: async (menuId: number) => {
    const response = await api.delete(`/phone/ivr-menus/${menuId}`);
    return response.data;
  },
};

export default phoneApi;
