import api from '@/lib/api';

export interface OverviewMetrics {
  revenue: {
    value: string;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  allContacts: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  newContacts: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  totalCalls: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  averageCallDuration: {
    value: string;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  jobs: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface LeadSourceData {
  name: string;
  value: number;
}

export interface CallFlowData {
  incomingCalls: number;
  outgoingCalls: number;
  missedCalls: number;
}

export interface LeadConversionData {
  leadConversionRate: number;
  averageLeadAge: string;
  qualityConversionRate: number;
  overallConversionRate: number;
}

export interface ConversionBySourceData {
  source: string;
  conversions: number;
}

export interface JobsData {
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  revenue: number;
}

export interface InsightsDashboardData {
  overview: OverviewMetrics;
  revenue: RevenueDataPoint[];
  leadSources: LeadSourceData[];
  callFlow: CallFlowData;
  leadConversion: LeadConversionData;
  conversionBySource: ConversionBySourceData[];
  jobs: JobsData;
}

const insightsApi = {
  getDashboard: async (dateRange: string): Promise<InsightsDashboardData> => {
    const response = await api.get(`/insights/dashboard?range=${dateRange}`);
    return response.data;
  },

  getOverviewMetrics: async (dateRange: string): Promise<OverviewMetrics> => {
    const response = await api.get(`/insights/overview?range=${dateRange}`);
    return response.data;
  },

  getRevenueData: async (dateRange: string): Promise<RevenueDataPoint[]> => {
    const response = await api.get(`/insights/revenue?range=${dateRange}`);
    return response.data;
  },

  getCallFlowData: async (dateRange: string): Promise<CallFlowData> => {
    const response = await api.get(`/insights/call-flow?range=${dateRange}`);
    return response.data;
  },

  getLeadConversionData: async (dateRange: string): Promise<LeadConversionData> => {
    const response = await api.get(`/insights/lead-conversion?range=${dateRange}`);
    return response.data;
  },

  getJobsData: async (dateRange: string): Promise<JobsData> => {
    const response = await api.get(`/insights/jobs?range=${dateRange}`);
    return response.data;
  },

  exportReport: async (dateRange: string, format: 'pdf' | 'csv' | 'xlsx'): Promise<Blob> => {
    const response = await api.get(`/insights/export?range=${dateRange}&format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default insightsApi;
