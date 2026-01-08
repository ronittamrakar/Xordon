import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ClipboardList, Layout, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WebFormsList from './webforms/WebFormsList';
import WebFormsTemplates from './webforms/WebFormsTemplates';
import WebFormsSubmissions from './webforms/WebFormsSubmissions';

export default function FormsPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine active tab from URL path
    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('/forms/templates')) return 'templates';
        if (path.includes('/forms/submissions')) return 'submissions';
        return 'forms';
    };

    const [activeTab, setActiveTab] = useState(getActiveTab());

    // Sync tab with URL changes (e.g., browser back/forward)
    useEffect(() => {
        setActiveTab(getActiveTab());
    }, [location.pathname]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        // Update URL without full page reload
        switch (value) {
            case 'forms':
                navigate('/forms', { replace: true });
                break;
            case 'templates':
                navigate('/forms/templates', { replace: true });
                break;
            case 'submissions':
                navigate('/forms/submissions', { replace: true });
                break;
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-background/50">
            {/* Header Section */}
            <div className="px-6 py-6 border-b bg-background">
                <div className="max-w-[1600px] mx-auto w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                {activeTab === 'forms' && 'Web Forms'}
                                {activeTab === 'templates' && 'Form Templates'}
                                {activeTab === 'submissions' && 'Form Submissions'}
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {activeTab === 'forms' && 'Create and manage your interactive web forms'}
                                {activeTab === 'templates' && 'Start quickly with battle-tested form templates'}
                                {activeTab === 'submissions' && 'Review and analyze your form responses'}
                            </p>
                        </div>

                        <div className="flex items-center gap-1 bg-muted/50 p-1.5 rounded-xl border shadow-sm w-fit">
                            <Button
                                variant={activeTab === 'forms' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => handleTabChange('forms')}
                                className={`flex items-center gap-2 px-4 rounded-lg transition-all ${activeTab === 'forms' ? 'bg-background shadow-sm' : ''}`}
                            >
                                <ClipboardList className="h-4 w-4" />
                                <span className="font-medium">Forms</span>
                            </Button>
                            <Button
                                variant={activeTab === 'templates' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => handleTabChange('templates')}
                                className={`flex items-center gap-2 px-4 rounded-lg transition-all ${activeTab === 'templates' ? 'bg-background shadow-sm' : ''}`}
                            >
                                <Layout className="h-4 w-4" />
                                <span className="font-medium">Templates</span>
                            </Button>
                            <Button
                                variant={activeTab === 'submissions' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => handleTabChange('submissions')}
                                className={`flex items-center gap-2 px-4 rounded-lg transition-all ${activeTab === 'submissions' ? 'bg-background shadow-sm' : ''}`}
                            >
                                <Inbox className="h-4 w-4" />
                                <span className="font-medium">Submissions</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} className="flex-1">
                <div className="h-full overflow-auto">
                    <div className="max-w-[1600px] mx-auto w-full">
                        <TabsContent value="forms" className="m-0 p-0 border-none outline-none">
                            <WebFormsList />
                        </TabsContent>

                        <TabsContent value="templates" className="m-0 p-6 border-none outline-none">
                            <WebFormsTemplates />
                        </TabsContent>

                        <TabsContent value="submissions" className="m-0 p-6 border-none outline-none">
                            <WebFormsSubmissions />
                        </TabsContent>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}
