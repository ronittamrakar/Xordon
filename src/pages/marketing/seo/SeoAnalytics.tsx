
import React from 'react';
import { SeoReports } from '@/components/seo/SeoReports';

const SeoAnalytics = () => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">SEO Reports</h1>
                    <p className="text-muted-foreground">Generate and view SEO performance reports</p>
                </div>
            </div>
            <SeoReports />
        </div>
    );
}
