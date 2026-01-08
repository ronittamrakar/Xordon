import { api } from '@/lib/api';

export interface WorkflowNode {
  id: string;
  type: string;
  config: any;
  position: { x: number; y: number };
  db_id?: number;
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  condition_type?: string;
  condition_config?: any;
}

export interface Workflow {
  id?: number;
  workspace_id?: number;
  company_id?: number;
  name: string;
  description?: string;
  canvas_data?: any;
  node_positions?: any;
  zoom_level?: number;
  status?: string;
  nodes?: WorkflowNode[];
  connections?: WorkflowConnection[];
  is_template?: boolean;
  category?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export const workflowBuilderApi = {
  saveWorkflow: async (data: {
    workflow_id?: number;
    name: string;
    description?: string;
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
    canvas_data?: any;
    node_positions?: any;
    zoom_level?: number;
  }) => {
    const response = await api.post('/workflow-builder/save', data);
    return response.data;
  },

  getWorkflow: async (id: number): Promise<Workflow> => {
    const response = await api.get(`/workflow-builder/workflows/${id}`);
    return response.data;
  },

  listTemplates: async (): Promise<Workflow[]> => {
    const response = await api.get('/workflow-builder/templates');
    return response.data;
  },
};
