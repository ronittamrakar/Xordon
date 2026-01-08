import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowLeft, Plus, Trash2, GripVertical, Save, Eye,
    CheckCircle2, Circle, HelpCircle, FileText, Clock
} from 'lucide-react';
import { quizzesApi, Quiz, QuizQuestion, QuizQuestionOption } from '@/services/lmsEnhancementsApi';

export default function QuizBuilderPage() {
    const { courseId, quizId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const isEditing = !!quizId;
    const [showQuestionDialog, setShowQuestionDialog] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);

    // Quiz Data
    const [quizData, setQuizData] = useState<Partial<Quiz>>({
        title: '',
        description: '',
        time_limit_minutes: 0,
        passing_score: 70,
        max_attempts: 0,
        shuffle_questions: false,
        show_correct_answers: true,
        is_required: false,
        status: 'draft',
    });

    // Load existing quiz
    const { data: quiz, isLoading } = useQuery({
        queryKey: ['quiz', quizId],
        queryFn: () => quizzesApi.getQuiz(Number(quizId)),
        enabled: isEditing,
        onSuccess: (data) => {
            setQuizData(data);
        },
    });

    // Mutations
    const createQuizMutation = useMutation({
        mutationFn: (data: Partial<Quiz>) => quizzesApi.createQuiz(Number(courseId), data),
        onSuccess: (data) => {
            toast({ title: 'Success', description: 'Quiz created successfully' });
            navigate(`/courses/${courseId}/quizzes/${data.id}/edit`);
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to create quiz', variant: 'destructive' });
        },
    });

    const updateQuizMutation = useMutation({
        mutationFn: (data: Partial<Quiz>) => quizzesApi.updateQuiz(Number(quizId), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
            toast({ title: 'Success', description: 'Quiz updated successfully' });
        },
    });

    const createQuestionMutation = useMutation({
        mutationFn: (data: Partial<QuizQuestion> & { options?: Partial<QuizQuestionOption>[] }) =>
            quizzesApi.createQuestion(Number(quizId), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
            setShowQuestionDialog(false);
            toast({ title: 'Success', description: 'Question added' });
        },
    });

    const updateQuestionMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<QuizQuestion> & { options?: Partial<QuizQuestionOption>[] } }) =>
            quizzesApi.updateQuestion(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
            setShowQuestionDialog(false);
            setEditingQuestion(null);
            toast({ title: 'Success', description: 'Question updated' });
        },
    });

    const deleteQuestionMutation = useMutation({
        mutationFn: quizzesApi.deleteQuestion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
            toast({ title: 'Success', description: 'Question deleted' });
        },
    });

    const handleSaveQuiz = () => {
        if (isEditing) {
            updateQuizMutation.mutate(quizData);
        } else {
            createQuizMutation.mutate(quizData);
        }
    };

    const handleQuestionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const questionType = formData.get('question_type') as string;
        const questionText = formData.get('question_text') as string;
        const points = parseInt(formData.get('points') as string) || 1;
        const explanation = formData.get('explanation') as string;

        // Parse options from form
        const options: Partial<QuizQuestionOption>[] = [];
        let optionIndex = 0;
        while (formData.has(`option_${optionIndex}`)) {
            options.push({
                option_text: formData.get(`option_${optionIndex}`) as string,
                is_correct: formData.get(`correct_${optionIndex}`) === 'on',
            });
            optionIndex++;
        }

        const data = {
            question_type: questionType,
            question_text: questionText,
            points,
            explanation,
            options,
        };

        if (editingQuestion) {
            updateQuestionMutation.mutate({ id: editingQuestion.id, data });
        } else {
            createQuestionMutation.mutate(data);
        }
    };

    if (isLoading && isEditing) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/courses/${courseId}`)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">
                        {isEditing ? 'Edit Quiz' : 'Create Quiz'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isEditing ? 'Modify quiz settings and questions' : 'Set up a new quiz for your course'}
                    </p>
                </div>
                <Button onClick={handleSaveQuiz} disabled={createQuizMutation.isPending || updateQuizMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Save Changes' : 'Create Quiz'}
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Quiz Settings */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quiz Settings</CardTitle>
                            <CardDescription>Configure quiz behavior</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={quizData.title}
                                    onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Quiz title"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={quizData.description}
                                    onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Instructions for the quiz..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="time_limit">Time Limit (min)</Label>
                                    <Input
                                        id="time_limit"
                                        type="number"
                                        min="0"
                                        value={quizData.time_limit_minutes}
                                        onChange={(e) => setQuizData(prev => ({ ...prev, time_limit_minutes: parseInt(e.target.value) || 0 }))}
                                    />
                                    <p className="text-xs text-muted-foreground">0 = unlimited</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="passing_score">Passing Score (%)</Label>
                                    <Input
                                        id="passing_score"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={quizData.passing_score}
                                        onChange={(e) => setQuizData(prev => ({ ...prev, passing_score: parseInt(e.target.value) || 70 }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="max_attempts">Max Attempts</Label>
                                <Input
                                    id="max_attempts"
                                    type="number"
                                    min="0"
                                    value={quizData.max_attempts}
                                    onChange={(e) => setQuizData(prev => ({ ...prev, max_attempts: parseInt(e.target.value) || 0 }))}
                                />
                                <p className="text-xs text-muted-foreground">0 = unlimited</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={quizData.status}
                                    onValueChange={(value) => setQuizData(prev => ({ ...prev, status: value as Quiz['status'] }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Shuffle Questions</Label>
                                        <p className="text-xs text-muted-foreground">Randomize question order</p>
                                    </div>
                                    <Switch
                                        checked={quizData.shuffle_questions}
                                        onCheckedChange={(checked) => setQuizData(prev => ({ ...prev, shuffle_questions: checked }))}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Show Correct Answers</Label>
                                        <p className="text-xs text-muted-foreground">After submission</p>
                                    </div>
                                    <Switch
                                        checked={quizData.show_correct_answers}
                                        onCheckedChange={(checked) => setQuizData(prev => ({ ...prev, show_correct_answers: checked }))}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Required</Label>
                                        <p className="text-xs text-muted-foreground">Must pass to continue</p>
                                    </div>
                                    <Switch
                                        checked={quizData.is_required}
                                        onCheckedChange={(checked) => setQuizData(prev => ({ ...prev, is_required: checked }))}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Questions */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Questions</h2>
                        {isEditing && (
                            <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => setEditingQuestion(null)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Question
                                    </Button>
                                </DialogTrigger>
                                <QuestionDialog
                                    question={editingQuestion}
                                    onSubmit={handleQuestionSubmit}
                                    onClose={() => {
                                        setShowQuestionDialog(false);
                                        setEditingQuestion(null);
                                    }}
                                    isPending={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                                />
                            </Dialog>
                        )}
                    </div>

                    {!isEditing ? (
                        <Card className="p-8 text-center text-muted-foreground">
                            <HelpCircle className="h-12 w-12 mx-auto mb-4" />
                            <p>Save the quiz first to add questions</p>
                        </Card>
                    ) : quiz?.questions?.length === 0 ? (
                        <Card className="p-8 text-center text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4" />
                            <p>No questions yet. Add your first question!</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {quiz?.questions?.map((question, index) => (
                                <Card key={question.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <GripVertical className="h-4 w-4" />
                                                <span className="font-medium">{index + 1}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="outline">{question.question_type}</Badge>
                                                    <Badge variant="secondary">{question.points} pts</Badge>
                                                </div>
                                                <p className="font-medium">{question.question_text}</p>
                                                {question.options && question.options.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {question.options.map((option) => (
                                                            <div key={option.id} className="flex items-center gap-2 text-sm">
                                                                {option.is_correct ? (
                                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                                ) : (
                                                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                                                )}
                                                                <span className={option.is_correct ? 'font-medium' : ''}>
                                                                    {option.option_text}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingQuestion(question);
                                                        setShowQuestionDialog(true);
                                                    }}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive"
                                                    onClick={() => deleteQuestionMutation.mutate(question.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Question Dialog Component
function QuestionDialog({
    question,
    onSubmit,
    onClose,
    isPending
}: {
    question: QuizQuestion | null;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
    isPending: boolean;
}) {
    const [questionType, setQuestionType] = useState(question?.question_type || 'multiple_choice');
    const [options, setOptions] = useState<{ text: string; correct: boolean }[]>(
        question?.options?.map(o => ({ text: o.option_text, correct: o.is_correct })) ||
        [{ text: '', correct: false }, { text: '', correct: false }]
    );

    const addOption = () => {
        setOptions([...options, { text: '', correct: false }]);
    };

    const removeOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    const updateOption = (index: number, field: 'text' | 'correct', value: string | boolean) => {
        const newOptions = [...options];
        if (field === 'text') {
            newOptions[index].text = value as string;
        } else {
            // For single-answer questions, uncheck others
            if (questionType === 'multiple_choice' && value === true) {
                newOptions.forEach((o, i) => {
                    o.correct = i === index;
                });
            } else {
                newOptions[index].correct = value as boolean;
            }
        }
        setOptions(newOptions);
    };

    return (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={onSubmit}>
                <DialogHeader>
                    <DialogTitle>{question ? 'Edit Question' : 'Add Question'}</DialogTitle>
                    <DialogDescription>
                        Create a question for this quiz
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="question_type">Question Type</Label>
                            <Select
                                name="question_type"
                                value={questionType}
                                onValueChange={setQuestionType}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                    <SelectItem value="true_false">True / False</SelectItem>
                                    <SelectItem value="short_answer">Short Answer</SelectItem>
                                    <SelectItem value="essay">Essay</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="points">Points</Label>
                            <Input
                                id="points"
                                name="points"
                                type="number"
                                min="1"
                                defaultValue={question?.points || 1}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="question_text">Question</Label>
                        <Textarea
                            id="question_text"
                            name="question_text"
                            defaultValue={question?.question_text}
                            placeholder="Enter your question..."
                            required
                        />
                    </div>

                    {(questionType === 'multiple_choice' || questionType === 'true_false') && (
                        <div className="space-y-2">
                            <Label>Answer Options</Label>
                            <div className="space-y-2">
                                {questionType === 'true_false' ? (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <input type="hidden" name="option_0" value="True" />
                                            <input
                                                type="checkbox"
                                                name="correct_0"
                                                defaultChecked={question?.options?.[0]?.is_correct}
                                            />
                                            <span>True</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="hidden" name="option_1" value="False" />
                                            <input
                                                type="checkbox"
                                                name="correct_1"
                                                defaultChecked={question?.options?.[1]?.is_correct}
                                            />
                                            <span>False</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {options.map((option, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    name={`correct_${index}`}
                                                    checked={option.correct}
                                                    onChange={(e) => updateOption(index, 'correct', e.target.checked)}
                                                />
                                                <Input
                                                    name={`option_${index}`}
                                                    value={option.text}
                                                    onChange={(e) => updateOption(index, 'text', e.target.value)}
                                                    placeholder={`Option ${index + 1}`}
                                                />
                                                {options.length > 2 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeOption(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={addOption}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Option
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="explanation">Explanation (optional)</Label>
                        <Textarea
                            id="explanation"
                            name="explanation"
                            defaultValue={question?.explanation || ''}
                            placeholder="Explain why this answer is correct..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {question ? 'Update Question' : 'Add Question'}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
