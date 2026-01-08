import React, { useState, useEffect } from 'react';
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
import { api, Folder } from '@/lib/api';
import { toast } from 'sonner';

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialTitle?: string;
    initialDescription?: string;
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
    open,
    onOpenChange,
    onSuccess,
    initialTitle = '',
    initialDescription = '',
}) => {
    const [loading, setLoading] = useState(false);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [formData, setFormData] = useState({
        title: initialTitle,
        description: initialDescription,
        status: 'planning',
        priority: 'medium',
        start_date: '',
        due_date: '',
        color: '#3B82F6',
        folder_id: 'uncategorized',
    });

    useEffect(() => {
        if (open) {
            loadFolders();
            // Update form data with initial values when dialog opens
            if (initialTitle || initialDescription) {
                setFormData(prev => ({
                    ...prev,
                    title: initialTitle || prev.title,
                    description: initialDescription || prev.description,
                }));
            }
        }
    }, [open, initialTitle, initialDescription]);

    const loadFolders = async () => {
        try {
            const response = await api.folders.getAll();
            setFolders(response || []);
        } catch (error) {
            console.error('Failed to load folders:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Project title is required');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                start_date: formData.start_date || undefined,
                due_date: formData.due_date || undefined,
                settings: formData.folder_id !== 'uncategorized' ? { folder_id: formData.folder_id } : {}
            };

            // Remove folder_id from top level as it goes into settings
            delete (payload as any).folder_id;

            console.log('Creating project with data:', payload);
            const result = await api.projects.create(payload);
            console.log('Project created successfully:', result);
            toast.success('Project created successfully');
            onSuccess();
            setFormData({
                title: '',
                description: '',
                status: 'planning',
                priority: 'medium',
                start_date: '',
                due_date: '',
                color: '#3B82F6',
                folder_id: 'uncategorized',
            });
        } catch (error: any) {
            console.error('Failed to create project:', error);
            const errorMessage = error?.message || error?.error || 'Failed to create project. Please try again.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Add a new project to organize and track your work
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Project Title *</Label>
                        <Input
                            id="title"
                            placeholder="Enter project title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe your project"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="folder">Folder</Label>
                            <Select
                                value={formData.folder_id}
                                onValueChange={(value) => setFormData({ ...formData, folder_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select folder" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="uncategorized">No Folder</SelectItem>
                                    {folders.map((folder) => (
                                        <SelectItem key={folder.id} value={folder.id}>
                                            {folder.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

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
                                    <SelectItem value="planning">Planning</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="on_hold">On Hold</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                        <div className="space-y-2">
                            <Label htmlFor="color">Project Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="color"
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="w-20 h-10"
                                />
                                <Input
                                    type="text"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    placeholder="#3B82F6"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            />
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
                            {loading ? 'Creating...' : 'Create Project'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
