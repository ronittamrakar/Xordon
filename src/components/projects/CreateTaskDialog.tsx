import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface CreateTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: number;
    onSuccess: () => void;
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
    open,
    onOpenChange,
    projectId,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
        project_id: projectId
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Task title is required');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                due_date: formData.due_date || undefined,
                project_id: projectId
            };

            await (api as any).tasks.create(payload);
            toast.success('Task created successfully');
            onSuccess();
            setFormData({
                title: '',
                description: '',
                status: 'pending',
                priority: 'medium',
                due_date: '',
                project_id: projectId
            });
            onOpenChange(false);
        } catch (error: any) {
            console.error('Failed to create task:', error);
            const errorMessage = error?.message || error?.error || 'Failed to create task';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                        Add a new task to your project
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Task Title *</Label>
                        <Input
                            id="title"
                            placeholder="What needs to be done?"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Add more details..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">To Do</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Done</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value) => setFormData({ ...formData, priority: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="due_date">Due Date</Label>
                        <Input
                            id="due_date"
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
