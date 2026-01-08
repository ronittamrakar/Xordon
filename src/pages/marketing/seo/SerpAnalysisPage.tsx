import React from 'react';
import { SerpAnalyzer } from '@/components/seo/SerpAnalyzer';

export default function SerpAnalysisPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">SERP Analysis</h1>
                    <p className="text-muted-foreground">Analyze search engine result pages deeply</p>
                </div>
            </div>
            <SerpAnalyzer />
        </div>
    );
}
