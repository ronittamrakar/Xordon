import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveCompany, companyQueryKey } from '@/hooks/useActiveCompany';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { listingsApi } from '@/services';
import { Loader2, ExternalLink, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { TechnicalAuditScanner } from '@/components/seo/TechnicalAuditScanner';
import { useToast } from '@/hooks/use-toast';

export default function SiteAuditsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { activeCompanyId, hasCompany } = useActiveCompany();

    const { data: audits = [], isLoading: auditsLoading, refetch } = useQuery({
        queryKey: companyQueryKey('seo-audits', activeCompanyId),
        queryFn: () => listingsApi.getAudits(),
        enabled: hasCompany,
    });

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Site Audits</h1>
                    <p className="text-muted-foreground">Scan your website for technical SEO issues</p>
                </div>
            </div>

            <TechnicalAuditScanner onScanComplete={refetch} />

            <div className="flex items-center justify-between mt-8">
                <h3 className="text-lg font-semibold">Audit History</h3>
            </div>

            {auditsLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : audits.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center space-y-2">
                        <p className="text-muted-foreground">No audits yet. Create your first site audit!</p>
                        <p className="text-sm text-muted-foreground">Get comprehensive technical SEO analysis, performance metrics, and actionable recommendations.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {audits.map((audit: any) => (
                        <Card key={audit.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{audit.url}</CardTitle>
                                        <CardDescription>{new Date(audit.created_at).toLocaleDateString()}</CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-2xl font-bold ${getScoreColor(audit.overall_score || 0)}`}>
                                            {audit.overall_score || 0}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Overall Score</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Technical</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Progress value={audit.technical_score || 0} className="h-2 flex-1" />
                                            <span className={`text-sm font-medium ${getScoreColor(audit.technical_score || 0)}`}>
                                                {audit.technical_score || 0}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Content</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Progress value={audit.content_score || 0} className="h-2 flex-1" />
                                            <span className={`text-sm font-medium ${getScoreColor(audit.content_score || 0)}`}>
                                                {audit.content_score || 0}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Performance</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Progress value={audit.performance_score || 0} className="h-2 flex-1" />
                                            <span className={`text-sm font-medium ${getScoreColor(audit.performance_score || 0)}`}>
                                                {audit.performance_score || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {audit.issues && audit.issues.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Key Issues</p>
                                        {audit.issues.slice(0, 5).map((issue: any, idx: number) => (
                                            <div key={idx} className="flex items-start gap-2 text-sm">
                                                {issue.severity === 'error' ? (
                                                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                                ) : issue.severity === 'warning' ? (
                                                    <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                                                ) : (
                                                    <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                                )}
                                                <span>{issue.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={audit.url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View Site
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
