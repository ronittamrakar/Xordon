import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pipeline, PipelineStage } from '@/services/opportunitiesApi';
import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';

interface PipelineWidgetProps {
    pipelines: Pipeline[];
    className?: string;
}

export const PipelineWidget: React.FC<PipelineWidgetProps> = ({ pipelines, className }) => {
    if (!pipelines || pipelines.length === 0) return null;

    const mainPipeline = pipelines.find(p => p.is_default) || pipelines[0];
    const stages = mainPipeline.stages || [];
    const maxCount = Math.max(...stages.map(s => s.opportunity_count || 0), 1);

    return (
        <Card className={cn("bg-background/50 backdrop-blur-md border-none shadow-xl", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Lead Pipeline: {mainPipeline.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {stages.map((stage) => {
                    const count = stage.opportunity_count || 0;
                    const percentage = (count / maxCount) * 100;
                    return (
                        <div key={stage.id} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                                    {stage.name}
                                </span>
                                <span>{count} Leads</span>
                            </div>
                            <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: stage.color,
                                        opacity: 0.8
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
                {stages.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground italic text-sm">
                        No active stages in this pipeline.
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
