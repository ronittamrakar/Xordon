import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, MoreHorizontal, Kanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface Deal {
  id: number;
  name: string; // Changed from title to match backend
  company_name?: string;
  value: number;
  stage_id: number; // Changed from stage (string) to stage_id (number)
  probability?: number;
  expected_close_date?: string;
  owner_name?: string;
  created_at: string;
  contact_id?: number;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_email?: string;
}

interface Stage {
  id: number; // Changed from string to number
  name: string;
  color?: string;
  deals: Deal[];
  is_won?: boolean;
  is_lost?: boolean;
}

interface PipelineData {
  id: number;
  name: string;
  stages: Stage[];
  is_default: boolean;
}

export default function Pipeline() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [pipelines, setPipelines] = useState<PipelineData[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadPipelines();
  }, []);

  useEffect(() => {
    if (selectedPipelineId) {
      loadOpportunities(selectedPipelineId);
    }
  }, [selectedPipelineId]);

  const loadPipelines = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>('/pipelines');
      const pipelineList = Array.isArray(response) ? response : (response.data || []);

      if (pipelineList.length > 0) {
        setPipelines(pipelineList);
        // Default to first pipeline if none selected
        if (!selectedPipelineId) {
          const defaultPipeline = pipelineList.find((p: any) => p.is_default) || pipelineList[0];
          setSelectedPipelineId(defaultPipeline.id);
          // Initial stages from pipeline data
          setStages(defaultPipeline.stages.map((s: any) => ({ ...s, deals: [] })));
        }
      } else {
        // Fallback or empty state
        setStages([]);
      }
    } catch (error) {
      console.error('Failed to load pipelines:', error);
      toast({ title: 'Failed to load pipelines', variant: 'destructive' });
    }
  };

  const loadOpportunities = async (pipelineId: number) => {
    try {
      setLoading(true);
      const response = await api.get<any>(`/opportunities?pipeline_id=${pipelineId}`);
      const deals = Array.isArray(response) ? response : (response.data || []);

      // Refresh stages structure for selected pipeline to ensure we have fresh data
      const currentPipeline = pipelines.find(p => p.id === pipelineId);
      if (currentPipeline) {
        // Sort stages by order if needed, assuming backend sends them sorted or we rely on index
        const initialStages = currentPipeline.stages.map(s => ({ ...s, deals: [] }));

        const dealsByStage = deals.reduce((acc: Record<number, Deal[]>, deal: Deal) => {
          if (!acc[deal.stage_id]) {
            acc[deal.stage_id] = [];
          }
          acc[deal.stage_id].push(deal);
          return acc;
        }, {});

        setStages(initialStages.map(stage => ({
          ...stage,
          deals: dealsByStage[stage.id] || [],
        })));
      }
    } catch (error) {
      console.error('Failed to load opportunities:', error);
      toast({ title: 'Failed to load opportunities', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const moveStage = async (dealId: number, newStageId: number) => {
    try {
      await api.post(`/opportunities/${dealId}/move`, { stage_id: newStageId });

      // Optimistic update
      setStages(prevStages => {
        const newStages = JSON.parse(JSON.stringify(prevStages)); // Deep copy
        let dealToMove: Deal | undefined;

        // Find and remove from old stage
        newStages.forEach((stage: Stage) => {
          const dealIndex = stage.deals.findIndex((d) => d.id === dealId);
          if (dealIndex !== -1) {
            dealToMove = stage.deals[dealIndex];
            stage.deals.splice(dealIndex, 1);
          }
        });

        // Add to new stage
        if (dealToMove) {
          const targetStage = newStages.find((s: Stage) => s.id === newStageId);
          if (targetStage) {
            targetStage.deals.push({ ...dealToMove, stage_id: newStageId });

            // Check if stage is 'won' and trigger contact update if needed
            if (targetStage.is_won && dealToMove.contact_id) {
              updateContactStatus(dealToMove.contact_id, 'customer');
            }
          }
        }
        return newStages;
      });

      toast({ title: 'Deal moved successfully' });
    } catch (error) {
      console.error('Failed to move deal', error);
      toast({ title: 'Failed to move deal', variant: 'destructive' });
      // Reload to rollback
      if (selectedPipelineId) loadOpportunities(selectedPipelineId);
    }
  };

  const updateContactStatus = async (contactId: number, newStage: string) => {
    try {
      await api.updateContact(contactId.toString(), { stage: newStage });
      toast({ title: 'Contact marked as Client' });
    } catch (e) {
      console.error("Failed to update contact status", e);
    }
  };


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getTotalValue = (deals: Deal[]) => {
    return deals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Pipeline</h1>
          <p className="text-muted-foreground">
            Manage your deals and track progress through the sales funnel
          </p>
        </div>
        <Button onClick={() => navigate('/contacts?view=pipeline_add')}>
          <Plus className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {pipelines.length > 1 && (
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={selectedPipelineId || ''}
            onChange={(e) => setSelectedPipelineId(Number(e.target.value))}
          >
            {pipelines.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {loading && stages.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading pipeline...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <div key={stage.id} className="flex flex-col gap-3 min-w-[250px]">
              <Card className={stage.is_won ? "border-green-200 bg-green-50/50" : stage.is_lost ? "border-red-200 bg-red-50/50" : ""}>
                <CardHeader className="pb-3 p-4">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span style={{ color: stage.color }}>{stage.name}</span>
                    <Badge variant="secondary">{stage.deals.length}</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {formatCurrency(getTotalValue(stage.deals))}
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="space-y-2">
                {stage.deals.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <div className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                    No deals
                  </div>
                ) : (
                  stage.deals.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).map((deal) => (
                    <Card key={deal.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm line-clamp-2">{deal.name}</h4>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate(`/contacts/${deal.contact_id}`)}>View Contact</DropdownMenuItem>

                                <DropdownMenuLabel>Move to...</DropdownMenuLabel>
                                {stages.filter(s => s.id !== stage.id).map(s => (
                                  <DropdownMenuItem key={s.id} onClick={() => moveStage(deal.id, s.id)}>
                                    {s.name}
                                  </DropdownMenuItem>
                                ))}

                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate(`/proposals/new?deal_id=${deal.id}&amount=${deal.value}`)}>
                                  Create Proposal
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {deal.company_name && (
                            <p className="text-xs text-muted-foreground">{deal.company_name}</p>
                          )}
                          {deal.contact_first_name && (
                            <p className="text-xs text-muted-foreground">
                              {deal.contact_first_name} {deal.contact_last_name}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-xs pt-2">
                            <span className="font-semibold text-green-600">
                              {formatCurrency(deal.value)}
                            </span>
                            {/* <Badge variant="outline" className="text-xs">
                              {deal.probability}%
                            </Badge> */}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && stages.every(s => s.deals.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Kanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No deals in pipeline</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating your first deal
            </p>
            <Button onClick={() => navigate('/contacts?view=pipeline_add')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Deal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
