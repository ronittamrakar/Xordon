import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
    Calendar,
    Trash2,
    Clock,
    User,
    MessageSquare,
    Paperclip,
    CheckSquare,
    Tag,
    AlertCircle,
    Plus,
    X,
    Send,
    MoreHorizontal,
    Edit2,
    Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    due_date: string;
    project_id: number;
    assigned_to_name?: string;
    tags?: string[];
}

interface TaskDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: Task | null;
    onUpdate: () => void;
}

interface Comment {
    id: number;
    user_name: string;
    content: string;
    created_at: string;
}

interface Subtask {
    id: number;
    title: string;
    completed: boolean;
}

export const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({
    open,
    onOpenChange,
    task,
    onUpdate,
}) => {
    const [loading, setLoading] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
    });

    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [newSubtask, setNewSubtask] = useState('');
    const [timeTracked, setTimeTracked] = useState('0h 0m');
    const [timeEstimate, setTimeEstimate] = useState('0h');

    const [activity, setActivity] = useState<any[]>([]);

    const loadComments = async () => {
        if (!task) return;
        try {
            const response = await (api as any).tasks.getComments(task.id);
            setComments(response.items || []);
        } catch (error) {
            console.error('Failed to load comments:', error);
        }
    };

    const loadActivity = async () => {
        if (!task) return;
        try {
            const response = await (api as any).tasks.getActivity(task.id);
            setActivity(response.data || []);
        } catch (error) {
            console.error('Failed to load activity:', error);
        }
    };

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                description: task.description || '',
                status: task.status,
                priority: task.priority,
                due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
            });
            // Task type casting for subtasks
            const loadedSubtasks = (task as any).subtasks || [];
            setSubtasks(loadedSubtasks);

            setIsEditingTitle(false);
            setIsEditingDescription(false);
            loadComments();
            loadActivity();
        }
    }, [task]);

    const handleUpdate = async (field: string, value: any) => {
        if (!task) return;

        try {
            setLoading(true);
            await (api as any).tasks.update(Number(task.id), { [field]: value });
            toast.success('Task updated');
            onUpdate();
        } catch (error: any) {
            console.error('Failed to update task:', error);
            toast.error('Failed to update task');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTitle = async () => {
        if (!formData.title.trim()) {
            toast.error('Task title is required');
            return;
        }
        await handleUpdate('title', formData.title);
        setIsEditingTitle(false);
    };

    const handleSaveDescription = async () => {
        await handleUpdate('description', formData.description);
        setIsEditingDescription(false);
    };

    const handleDelete = async () => {
        if (!task) return;
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            setLoading(true);
            await (api as any).tasks.delete(Number(task.id));
            toast.success('Task deleted successfully');
            onUpdate();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Failed to delete task:', error);
            toast.error('Failed to delete task');
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !task) return;

        try {
            await (api as any).tasks.createComment(task.id, newComment);
            setNewComment('');
            toast.success('Comment added');
            loadComments();
        } catch (error) {
            console.error('Failed to add comment:', error);
            toast.error('Failed to add comment');
        }
    };

    const handleSubtasksUpdate = async (updatedSubtasks: Subtask[]) => {
        setSubtasks(updatedSubtasks);
        await handleUpdate('subtasks', updatedSubtasks);
    };

    const handleAddSubtask = async () => {
        if (!newSubtask.trim()) return;

        const subtask: Subtask = {
            id: Date.now(),
            title: newSubtask,
            completed: false,
        };

        const updated = [...subtasks, subtask];
        await handleSubtasksUpdate(updated);
        setNewSubtask('');
    };

    const toggleSubtask = async (id: number) => {
        const updated = subtasks.map(st =>
            st.id === id ? { ...st, completed: !st.completed } : st
        );
        await handleSubtasksUpdate(updated);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700 border-red-300';
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'low': return 'bg-blue-100 text-blue-700 border-blue-300';
            default: return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-300';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'pending': return 'bg-gray-100 text-gray-700 border-gray-300';
            default: return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    if (!task) return null;

    const completedSubtasks = subtasks.filter(st => st.completed).length;
    const progressPercentage = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogDescription className="sr-only">
                        View and manage task details, comments, and subtasks for {task.title}
                    </DialogDescription>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                            {isEditingTitle ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="text-2xl font-bold h-auto py-2"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveTitle();
                                            if (e.key === 'Escape') setIsEditingTitle(false);
                                        }}
                                    />
                                    <Button size="sm" onClick={handleSaveTitle}>
                                        <Save className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <DialogTitle
                                    className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                                    onClick={() => setIsEditingTitle(true)}
                                >
                                    {task.title}
                                    <Edit2 className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                                </DialogTitle>
                            )}

                            <div className="flex flex-wrap items-center gap-2">
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => {
                                        setFormData({ ...formData, status: value });
                                        handleUpdate('status', value);
                                    }}
                                >
                                    <SelectTrigger className={cn("w-auto h-7 text-xs border", getStatusColor(formData.status))}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="on_hold">On Hold</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => {
                                        setFormData({ ...formData, priority: value });
                                        handleUpdate('priority', value);
                                    }}
                                >
                                    <SelectTrigger className={cn("w-auto h-7 text-xs border", getPriorityColor(formData.priority))}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>

                                {task.due_date && (
                                    <Badge variant="outline" className="flex items-center gap-1 h-7">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(task.due_date).toLocaleDateString()}
                                    </Badge>
                                )}

                                {task.assigned_to_name && (
                                    <Badge variant="outline" className="flex items-center gap-1 h-7">
                                        <User className="h-3 w-3" />
                                        {task.assigned_to_name}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="px-6 pt-4 border-b">
                            <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                                <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger value="subtasks" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                                    Subtasks ({completedSubtasks}/{subtasks.length})
                                </TabsTrigger>
                                <TabsTrigger value="comments" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                                    Comments ({comments.length})
                                </TabsTrigger>
                                <TabsTrigger value="activity" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                                    Activity
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-6">
                            <TabsContent value="overview" className="mt-0 space-y-6">
                                {/* Description */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Description</Label>
                                    {isEditingDescription ? (
                                        <div className="space-y-2">
                                            <Textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Add a description..."
                                                rows={6}
                                                className="resize-none"
                                            />
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={handleSaveDescription}>
                                                    Save
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => setIsEditingDescription(false)}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="p-4 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors min-h-[100px]"
                                            onClick={() => setIsEditingDescription(true)}
                                        >
                                            {formData.description || (
                                                <span className="text-muted-foreground italic">Click to add a description...</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Task Properties */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Due Date
                                        </Label>
                                        <Input
                                            type="date"
                                            value={formData.due_date}
                                            onChange={(e) => {
                                                setFormData({ ...formData, due_date: e.target.value });
                                                handleUpdate('due_date', e.target.value);
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Time Tracking
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <Input value={timeTracked} readOnly className="flex-1" />
                                            <span className="text-sm text-muted-foreground">/</span>
                                            <Input value={timeEstimate} readOnly className="flex-1" />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Tags */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        Tags
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {task.tags?.map((tag, i) => (
                                            <Badge key={i} variant="secondary" className="gap-1">
                                                {tag}
                                                <X className="h-3 w-3 cursor-pointer hover:text-red-500" />
                                            </Badge>
                                        ))}
                                        <Button variant="outline" size="sm" className="h-6">
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add Tag
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="subtasks" className="mt-0 space-y-4">
                                {/* Progress Bar */}
                                {subtasks.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">Progress</span>
                                            <span className="text-muted-foreground">{Math.round(progressPercentage)}%</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-300"
                                                style={{ width: `${progressPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Subtasks List */}
                                <div className="space-y-2">
                                    {subtasks.map((subtask) => (
                                        <div key={subtask.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                            <Checkbox
                                                checked={subtask.completed}
                                                onCheckedChange={() => toggleSubtask(subtask.id)}
                                            />
                                            <span className={cn(
                                                "flex-1",
                                                subtask.completed && "line-through text-muted-foreground"
                                            )}>
                                                {subtask.title}
                                            </span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Subtask */}
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add a subtask..."
                                        value={newSubtask}
                                        onChange={(e) => setNewSubtask(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                                    />
                                    <Button onClick={handleAddSubtask}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="comments" className="mt-0 space-y-4">
                                {/* Comments List */}
                                <div className="space-y-4">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3 group">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="text-xs">
                                                    {comment.user_name.split(' ').map((n: string) => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2 justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm">{comment.user_name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(comment.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500" onClick={async () => {
                                                        if (!confirm('Delete comment?')) return;
                                                        try {
                                                            await (api as any).tasks.deleteComment(task.id, comment.id);
                                                            loadComments();
                                                        } catch (e) {
                                                            console.error(e);
                                                            toast.error('Failed to delete comment');
                                                        }
                                                    }}>
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <p className="text-sm bg-muted/50 p-3 rounded-lg">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Comment */}
                                <div className="flex gap-2 pt-4 border-t">
                                    <Textarea
                                        placeholder="Write a comment..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        rows={3}
                                        className="resize-none"
                                    />
                                    <Button onClick={handleAddComment} className="self-end">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="activity" className="mt-0">
                                <div className="space-y-4">
                                    {activity.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
                                    ) : (
                                        activity.map((item) => (
                                            <div key={item.id} className="flex gap-3 text-sm">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full mt-1.5",
                                                    item.activity_type === 'created' ? "bg-green-500" : "bg-blue-500"
                                                )} />
                                                <div className="flex-1">
                                                    <p>
                                                        <span className="font-semibold">{item.user_name || 'System'}</span> {item.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(item.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
};
