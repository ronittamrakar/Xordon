import React from 'react';

import { Breadcrumb } from '@/components/Breadcrumb';
import { ContentAi } from './components/ContentAi';
import { Sparkles } from 'lucide-react';

const ContentAIPage: React.FC = () => {
    return (
        <>
            <Breadcrumb items={[{ label: 'AI' }, { label: 'Content AI' }]} />

            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Content AI</h1>
                    <p className="text-muted-foreground mt-1">Generate and manage AI-powered content for your campaigns</p>
                </div>
            </div>

            <ContentAi />
        </>
    );
};

export default ContentAIPage;
