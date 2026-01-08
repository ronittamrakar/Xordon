import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QuizTakeView } from '@/components/courses/QuizTakeView';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function QuizTakePage() {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();

    if (!quizId) return <div>Invalid Quiz ID</div>;

    const handleComplete = () => {
        // Option to stay on page to review results, or redirect
        // The View component handles result display
    };

    const handleCancel = () => {
        navigate(-1);
    };

    return (
        <div className="container mx-auto py-10 px-4 min-h-screen bg-slate-950">
            <div className="mb-8 flex items-center justify-between">
                <Button
                    variant="ghost"
                    className="text-slate-400 hover:text-white"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Course
                </Button>
                <div className="text-right">
                    <h1 className="text-sm font-medium text-slate-500 uppercase tracking-widest leading-none mb-1">Assessment</h1>
                    <p className="text-xs text-slate-400">Knowledge Check</p>
                </div>
            </div>

            <QuizTakeView
                quizId={Number(quizId)}
                onComplete={handleComplete}
                onCancel={handleCancel}
            />
        </div>
    );
}
