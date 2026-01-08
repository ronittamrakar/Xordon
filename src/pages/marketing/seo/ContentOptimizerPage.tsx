import React from 'react';
import { ContentOptimizer } from '@/components/seo/ContentOptimizer';

export default function ContentOptimizerPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Content Optimizer</h1>
                    <p className="text-muted-foreground">Optimize your content for better search rankings</p>
                </div>
            </div>
            <ContentOptimizer />
        </div>
    );
}
