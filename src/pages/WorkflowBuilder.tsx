import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { GitBranch, Save, Play, Plus, Trash2, Settings, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { workflowBuilderApi, WorkflowNode, WorkflowConnection } from '@/services/workflowBuilderApi';

const WorkflowBuilder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowBuilderApi.getWorkflow(Number(id)),
    enabled: !!id,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['workflow-templates'],
    queryFn: workflowBuilderApi.listTemplates,
  });

  const saveMutation = useMutation({
    mutationFn: workflowBuilderApi.saveWorkflow,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
      toast.success('Workflow saved');
      if (!id && data.workflow_id) {
        navigate(`/workflows/builder/${data.workflow_id}`);
      }
    },
  });

  React.useEffect(() => {
    if (workflow) {
      setWorkflowName(workflow.name);
      setNodes(workflow.nodes || []);
      setConnections(workflow.connections || []);
      setZoomLevel(workflow.zoom_level || 1);
    }
  }, [workflow]);

  const handleSave = () => {
    saveMutation.mutate({
      workflow_id: id ? Number(id) : undefined,
      name: workflowName,
      nodes,
      connections,
      zoom_level: zoomLevel,
    });
  };

  const addNode = (type: string) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      config: {},
      position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 },
    };
    setNodes([...nodes, newNode]);
    setIsAddNodeOpen(false);
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.source !== nodeId && c.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const updateNodePosition = (nodeId: string, x: number, y: number) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, position: { x, y } } : n));
  };

  const handleNodeDragStart = (nodeId: string) => {
    setDraggedNode(nodeId);
  };

  const handleNodeDrag = (e: React.DragEvent, nodeId: string) => {
    const canvas = document.getElementById('workflow-canvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;
    
    updateNodePosition(nodeId, x, y);
  };

  const connectNodes = (sourceId: string, targetId: string) => {
    const newConnection: WorkflowConnection = {
      id: `conn-${Date.now()}`,
      source: sourceId,
      target: targetId,
    };
    setConnections([...connections, newConnection]);
  };

  const nodeTypes = [
    { value: 'trigger', label: 'Trigger', description: 'Start the workflow' },
    { value: 'action', label: 'Action', description: 'Perform an action' },
    { value: 'condition', label: 'Condition', description: 'If/then logic' },
    { value: 'delay', label: 'Delay', description: 'Wait period' },
    { value: 'split', label: 'Split', description: 'A/B testing' },
  ];

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'trigger': return 'bg-green-100 border-green-300';
      case 'action': return 'bg-blue-100 border-blue-300';
      case 'condition': return 'bg-yellow-100 border-yellow-300';
      case 'delay': return 'bg-purple-100 border-purple-300';
      case 'split': return 'bg-orange-100 border-orange-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading workflow...</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <GitBranch className="h-6 w-6" />
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-xl font-bold border-none focus-visible:ring-0 w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Play className="h-4 w-4 mr-2" />
            Test
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r bg-white p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Workflow Elements</h3>
          <div className="space-y-2">
            {nodeTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => addNode(type.value)}
                className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs text-muted-foreground">{type.description}</div>
              </button>
            ))}
          </div>

          {templates.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-4">Templates</h3>
              <div className="space-y-2">
                {templates.slice(0, 5).map((template) => (
                  <button
                    key={template.id}
                    className="w-full p-2 text-left text-sm border rounded hover:bg-gray-50"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-gray-50 overflow-hidden">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
            >
              +
            </Button>
            <span className="px-3 py-1 bg-white border rounded text-sm">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
            >
              -
            </Button>
          </div>

          <div
            id="workflow-canvas"
            className="w-full h-full p-8"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
          >
            {/* Render connections */}
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
              {connections.map((conn) => {
                const sourceNode = nodes.find(n => n.id === conn.source);
                const targetNode = nodes.find(n => n.id === conn.target);
                if (!sourceNode || !targetNode) return null;

                const x1 = sourceNode.position.x + 100;
                const y1 = sourceNode.position.y + 40;
                const x2 = targetNode.position.x;
                const y2 = targetNode.position.y + 40;

                return (
                  <line
                    key={conn.id}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#94a3b8"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
                </marker>
              </defs>
            </svg>

            {/* Render nodes */}
            {nodes.map((node) => (
              <div
                key={node.id}
                draggable
                onDragStart={() => handleNodeDragStart(node.id)}
                onDrag={(e) => handleNodeDrag(e, node.id)}
                onClick={() => setSelectedNode(node)}
                className={`absolute cursor-move border-2 rounded-lg p-4 w-48 ${getNodeColor(node.type)} ${
                  selectedNode?.id === node.id ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-sm capitalize">{node.type}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNode(node.id);
                    }}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {node.type === 'trigger' && 'When this happens...'}
                  {node.type === 'action' && 'Do this action...'}
                  {node.type === 'condition' && 'If condition is met...'}
                  {node.type === 'delay' && 'Wait for...'}
                  {node.type === 'split' && 'Split traffic...'}
                </div>
              </div>
            ))}

            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No workflow elements yet</p>
                  <p className="text-sm">Click elements from the sidebar to add them</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="w-80 border-l bg-white p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Node Properties</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNode(null)}
              >
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <p className="text-sm text-muted-foreground capitalize">{selectedNode.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Configuration</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure {selectedNode.type} settings here
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowBuilder;
