import React from 'react';
import { KeywordGapAnalyzer } from '@/components/seo/KeywordGapAnalyzer';

export default function KeywordGapPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Keyword Gap</h1>
                    <p className="text-muted-foreground">Compare your keyword profile with competitors</p>
                </div>
            </div>
            <KeywordGapAnalyzer />
        </div>
    );
}
