import React from 'react';

import { Breadcrumb } from '@/components/Breadcrumb';
import { AgentTemplates } from './components/AgentTemplates';
import { Store } from 'lucide-react';

const AgentTemplatesPage: React.FC = () => {
    return (
        <>
            <Breadcrumb items={[{ label: 'AI' }, { label: 'Agent Templates' }]} />

            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Agent Templates</h1>
                    <p className="text-muted-foreground mt-1">Browse and install pre-built AI agents for your business</p>
                </div>
            </div>

            <AgentTemplates />
        </>
    );
};

export default AgentTemplatesPage;
