import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    Timer,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Send
} from 'lucide-react';
import {
    quizzesApi,
    QuizQuestion,
    QuizStartResult,
    QuizSubmitResult
} from '@/services/lmsEnhancementsApi';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface QuizTakeViewProps {
    quizId: number;
    onComplete?: (result: QuizSubmitResult) => void;
    onCancel?: () => void;
}

export const QuizTakeView: React.FC<QuizTakeViewProps> = ({ quizId, onComplete, onCancel }) => {
    const { toast } = useToast();
    const navigate = useNavigate();

    // State
    const [started, setStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [attemptId, setAttemptId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [quizResult, setQuizResult] = useState<QuizSubmitResult | null>(null);

    // Fetch quiz data
    const { data: quizData, isLoading, error } = useQuery({
        queryKey: ['quiz-start', quizId],
        queryFn: () => quizzesApi.startQuiz(quizId),
        enabled: started,
        retry: false
    });

    // Mutations
    const submitMutation = useMutation({
        mutationFn: (data: { attemptId: number; answers: any[] }) =>
            quizzesApi.submitAttempt(data.attemptId, data.answers),
        onSuccess: (data) => {
            setQuizResult(data);
            toast({
                title: "Quiz Submitted",
                description: `You scored ${data.percentage}%`,
            });
            onComplete?.(data);
        },
        onError: (err: any) => {
            toast({
                title: "Submission Failed",
                description: err.message || "There was an error submitting your quiz.",
                variant: "destructive"
            });
        }
    });

    // Start timer and set attempt ID when data is loaded
    useEffect(() => {
        if (quizData) {
            if (quizData.quiz?.time_limit_minutes) {
                setTimeLeft(quizData.quiz.time_limit_minutes * 60);
            }
            if (quizData.attempt_id) {
                setAttemptId(quizData.attempt_id);
            }
        }
    }, [quizData]);

    // Timer countdown
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || !started || quizResult) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // Auto-submit when time is up
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, started, quizResult]);

    const handleSubmit = async () => {
        if (!quizData || !attemptId || isSubmitting) return;
        setIsSubmitting(true);

        const formattedAnswers = Object.entries(answers).map(([qId, answer]) => {
            const question = quizData.questions.find(q => q.id === Number(qId));
            if (question?.question_type === 'multiple_choice' || question?.question_type === 'true_false') {
                return {
                    question_id: Number(qId),
                    selected_option_id: Number(answer)
                };
            }
            if (question?.question_type === 'matching') {
                return {
                    question_id: Number(qId),
                    matching_answers: answer // This would be a map of option_id -> match_text
                };
            }
            return {
                question_id: Number(qId),
                text_answer: String(answer)
            };
        });

        submitMutation.mutate({ attemptId, answers: formattedAnswers });
    };

    const handleAnswerChange = (questionId: number, value: any) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const nextQuestion = () => {
        if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    if (!started) {
        return (
            <Card className="max-w-2xl mx-auto border-none shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                        <Timer className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                            Ready to take the quiz?
                        </CardTitle>
                        <CardDescription className="text-slate-400 mt-2">
                            Please review the instructions before starting.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 py-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <Label className="text-slate-400 text-xs uppercase tracking-wider">Time Limit</Label>
                            <p className="text-xl font-semibold mt-1">Timed</p>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <Label className="text-slate-400 text-xs uppercase tracking-wider">Passing Score</Label>
                            <p className="text-xl font-semibold mt-1">80%</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                        <p className="text-sm text-blue-200">
                            Once you start the timer, you cannot pause it. Ensure you have a stable internet connection.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-4">
                    <Button variant="ghost" className="flex-1 text-slate-400 hover:text-white hover:bg-slate-800" onClick={onCancel}>
                        Go Back
                    </Button>
                    <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={() => setStarted(true)}>
                        Start Quiz
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 animate-pulse">Preparing your questions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="max-w-md mx-auto border-destructive/20 bg-destructive/10">
                <CardContent className="flex flex-col items-center py-10 space-y-4">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                    <CardTitle className="text-destructive">Failed to Load Quiz</CardTitle>
                    <p className="text-center text-slate-400">
                        {(error as any).message || "There was an error starting your quiz attempt. Please try again."}
                    </p>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                </CardContent>
            </Card>
        );
    }

    if (quizResult) {
        return (
            <Card className="max-w-2xl mx-auto overflow-hidden border-none shadow-2xl bg-slate-900 text-white">
                <div className={cn(
                    "h-2",
                    quizResult.passed ? "bg-green-500" : "bg-red-500"
                )} />
                <CardHeader className="text-center pt-10">
                    <div className={cn(
                        "mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4",
                        quizResult.passed ? "bg-green-500/20" : "bg-red-500/20"
                    )}>
                        {quizResult.passed ? (
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        ) : (
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {quizResult.passed ? "Congratulations!" : "Keep Practicing"}
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-lg">
                        {quizResult.passed
                            ? "You've successfully passed this assessment."
                            : "You didn't reach the passing score this time."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 px-10 pb-10">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Score</p>
                            <p className="text-2xl font-bold text-primary">{quizResult.percentage}%</p>
                        </div>
                        <div className="text-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Points</p>
                            <p className="text-2xl font-bold text-white">{quizResult.score}/{quizResult.max_score}</p>
                        </div>
                        <div className="text-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Status</p>
                            <p className={cn(
                                "text-2xl font-bold",
                                quizResult.passed ? "text-green-400" : "text-red-400"
                            )}>{quizResult.passed ? "PASSED" : "FAILED"}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Performance</span>
                            <span className="text-primary font-medium">{quizResult.percentage}%</span>
                        </div>
                        <Progress value={quizResult.percentage} className="h-2" />
                    </div>
                </CardContent>
                <CardFooter className="bg-slate-800/50 p-6 flex gap-4">
                    <Button variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-700" onClick={onCancel}>
                        Review Course
                    </Button>
                    {!quizResult.passed && (
                        <Button className="flex-1" onClick={() => window.location.reload()}>
                            Try Again
                        </Button>
                    )}
                </CardFooter>
            </Card>
        );
    }

    if (!quizData) return null;

    const currentQuestion = quizData.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header Sticky info */}
            <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-6 shadow-xl">
                <div className="flex items-center gap-4 flex-1">
                    <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                        Question {currentQuestionIndex + 1} of {quizData.questions.length}
                    </span>
                </div>

                {timeLeft !== null && (
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl border bg-slate-800/50 font-mono text-lg font-bold",
                        timeLeft < 60 ? "text-red-400 border-red-500/50 animate-pulse" : "text-primary border-primary/20"
                    )}>
                        <Timer className="w-5 h-5" />
                        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                    </div>
                )}
            </div>

            {/* Question Card */}
            <Card className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden">
                <CardHeader className="space-y-6 pb-2">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-2">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                                {currentQuestion.question_type.replace('_', ' ')}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                {currentQuestion.points} Points
                            </span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl leading-relaxed">
                        {currentQuestion.question_text}
                    </CardTitle>
                </CardHeader>

                <CardContent className="pt-6">
                    {currentQuestion.question_type === 'multiple_choice' && (
                        <RadioGroup
                            value={String(answers[currentQuestion.id] || '')}
                            onValueChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                            className="space-y-3"
                        >
                            {currentQuestion.options.map((option) => (
                                <div
                                    key={option.id}
                                    className={cn(
                                        "relative flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer hover:bg-slate-800/80",
                                        answers[currentQuestion.id] === String(option.id)
                                            ? "border-primary bg-primary/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                            : "border-slate-800 bg-slate-800/30"
                                    )}
                                    onClick={() => handleAnswerChange(currentQuestion.id, String(option.id))}
                                >
                                    <RadioGroupItem value={String(option.id)} id={`opt-${option.id}`} className="sr-only" />
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                        answers[currentQuestion.id] === String(option.id)
                                            ? "border-primary bg-primary"
                                            : "border-slate-600"
                                    )}>
                                        {answers[currentQuestion.id] === String(option.id) && (
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                    <Label htmlFor={`opt-${option.id}`} className="flex-1 cursor-pointer text-lg">
                                        {option.option_text}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    )}

                    {currentQuestion.question_type === 'true_false' && (
                        <RadioGroup
                            value={String(answers[currentQuestion.id] || '')}
                            onValueChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                            className="grid grid-cols-2 gap-4"
                        >
                            {[
                                { label: 'True', value: 'true' },
                                { label: 'False', value: 'false' }
                            ].map((opt) => (
                                <div
                                    key={opt.value}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all cursor-pointer gap-4",
                                        answers[currentQuestion.id] === opt.value
                                            ? "border-primary bg-primary/5 font-bold"
                                            : "border-slate-800 bg-slate-800/30 text-slate-400"
                                    )}
                                    onClick={() => handleAnswerChange(currentQuestion.id, opt.value)}
                                >
                                    <span className="text-xl uppercase tracking-widest">{opt.label}</span>
                                </div>
                            ))}
                        </RadioGroup>
                    )}

                    {currentQuestion.question_type === 'matching' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Items</p>
                                    {currentQuestion.options.map((option) => (
                                        <div key={option.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 min-h-[60px] flex items-center">
                                            {option.option_text}
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Matches</p>
                                    {currentQuestion.options.map((option) => (
                                        <Select
                                            key={`match-${option.id}`}
                                            value={answers[currentQuestion.id]?.[option.id] || ''}
                                            onValueChange={(val) => {
                                                const currentMatching = answers[currentQuestion.id] || {};
                                                handleAnswerChange(currentQuestion.id, {
                                                    ...currentMatching,
                                                    [option.id]: val
                                                });
                                            }}
                                        >
                                            <SelectTrigger className="bg-slate-800/50 border-slate-700 min-h-[60px]">
                                                <SelectValue placeholder="Select match..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {currentQuestion.options
                                                    .map(opt => opt.match_text)
                                                    .filter((text, index, self) => text && self.indexOf(text) === index)
                                                    .map((matchText, idx) => (
                                                        <SelectItem key={idx} value={matchText!}>
                                                            {matchText}
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </Select>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {(currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'essay') && (
                        <div className="space-y-4">
                            <Textarea
                                placeholder="Type your answer here..."
                                className="min-h-[200px] text-lg bg-slate-800/50 border-slate-700 focus:border-primary placeholder:text-slate-600"
                                value={answers[currentQuestion.id] || ''}
                                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                            />
                            <p className="text-sm text-slate-500">
                                {currentQuestion.question_type === 'essay' ? 'Minimum 100 words recommended' : 'Be concise and accurate'}
                            </p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between p-8 border-t border-slate-800 mt-6">
                    <Button
                        variant="ghost"
                        onClick={prevQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="text-slate-400 hover:text-white"
                    >
                        <ChevronLeft className="w-5 h-5 mr-2" />
                        Previous
                    </Button>

                    {currentQuestionIndex === quizData.questions.length - 1 ? (
                        <Button
                            className="bg-green-600 hover:bg-green-500 text-white px-10 shadow-lg shadow-green-500/20"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Submitting..." : "Submit Quiz"}
                            {!isSubmitting && <Send className="w-5 h-5 ml-2" />}
                        </Button>
                    ) : (
                        <Button
                            className="bg-primary hover:bg-primary/90 text-white px-10"
                            onClick={nextQuestion}
                            disabled={!answers[currentQuestion.id]}
                        >
                            Next Question
                            <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    )
                    }
                </CardFooter>
            </Card>

            {/* Question Navigator */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Question Navigator</p>
                <div className="flex flex-wrap gap-2">
                    {quizData.questions.map((q, idx) => (
                        <button
                            key={q.id}
                            onClick={() => setCurrentQuestionIndex(idx)}
                            className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all",
                                currentQuestionIndex === idx
                                    ? "bg-primary text-white scale-110 shadow-lg shadow-primary/25"
                                    : answers[q.id]
                                        ? "bg-slate-700 text-slate-200"
                                        : "bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-500"
                            )}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
