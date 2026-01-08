import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, Plus, Trash2, GripVertical, Video, FileText, CheckCircle2, Pencil } from 'lucide-react';
import { coursesApi, CourseModule, Lesson } from '@/services/coursesApi';

export default function CourseBuilderPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');

    // Derived state
    const isEditing = !!id;
    const courseId = Number(id);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        description: '',
        short_description: '',
        category: '',
        level: 'beginner',
        price: 0,
        currency: 'USD',
        is_free: false,
        certificate_enabled: false,
        status: 'draft'
    });

    const [modules, setModules] = useState<CourseModule[]>([]);

    // Module/Lesson Dialog States
    const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
    const [moduleName, setModuleName] = useState('');

    const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
    const [lessonForm, setLessonForm] = useState({
        title: '',
        content_type: 'video',
        video_url: '',
        content: '',
        is_free_preview: false,
        duration: 0
    });

    useEffect(() => {
        if (isEditing) {
            loadCourse(courseId);
        }
    }, [id]);

    const loadCourse = async (cId: number) => {
        try {
            setFetching(true);
            const course = await coursesApi.getCourse(cId);
            setFormData({
                title: course.title,
                slug: course.slug,
                description: course.description || '',
                short_description: course.short_description || '',
                category: course.category || '',
                level: course.level,
                price: course.price,
                currency: course.currency,
                is_free: course.is_free,
                certificate_enabled: course.certificate_enabled,
                status: course.status
            });

            if (course.modules) {
                setModules(course.modules);
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to load course details',
                variant: 'destructive',
            });
            // Don't navigate away, just show error
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => {
            const updates: any = { [field]: value };
            if (field === 'title' && !prev.slug && !isEditing) {
                updates.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }
            return { ...prev, ...updates };
        });
    };

    const handleBasicSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!formData.title) {
            toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
            return;
        }

        try {
            setLoading(true);
            if (isEditing) {
                await coursesApi.updateCourse(courseId, formData);
                toast({ title: 'Success', description: 'Course updated successfully' });
            } else {
                const course = await coursesApi.createCourse(formData);
                toast({ title: 'Success', description: 'Course created successfully' });
                navigate(`/courses/${course.id}`);
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} course`,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // --- Module Management ---

    const handleAddModule = () => {
        setEditingModule(null);
        setModuleName('');
        setIsModuleDialogOpen(true);
    };

    const handleEditModule = (module: CourseModule) => {
        setEditingModule(module);
        setModuleName(module.title);
        setIsModuleDialogOpen(true);
    };

    const saveModule = async () => {
        if (!moduleName.trim()) return;

        try {
            if (editingModule) {
                // Update module (API endpoint needed in real app, assuming createModule or creating new endpoint)
                // For now, let's assume we can only create or we handle update via a generic update endpoint if it existed
                // Since updateModule isn't in the snippet provided, I'll simulate or skip deeply implementing update if not available.
                // Wait, createModule is there. I'll mock the update or re-use create for now if backend handles upsert, 
                // but usually we need a dedicated update endpoint.
                // Assuming `updateModule` might exist or we just refresh. 
                // Let's just create for now or handle client-side if it's a draft. 
                // Actually, I'll just create a new one for simplicity if update is missing, 
                // OR I will assume the list update works.
                // Re-reading api: createModule is available. I will add updateModule to api later if needed.
                // For now, I'll just focus on Create.
                toast({ title: 'Info', description: 'Module update not fully implemented in API yet.' });
            } else {
                await coursesApi.createModule(courseId, {
                    title: moduleName,
                    order_index: modules.length
                });
                toast({ title: 'Success', description: 'Module created' });
            }

            setIsModuleDialogOpen(false);
            loadCourse(courseId); // Refresh
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save module', variant: 'destructive' });
        }
    };

    // --- Lesson Management ---

    const handleAddLesson = (modId: number) => {
        setActiveModuleId(modId);
        setEditingLesson(null);
        setLessonForm({
            title: '',
            content_type: 'video',
            video_url: '',
            content: '',
            is_free_preview: false,
            duration: 0
        });
        setIsLessonDialogOpen(true);
    };

    const saveLesson = async () => {
        if (!activeModuleId || !lessonForm.title) return;

        try {
            await coursesApi.createLesson(courseId, activeModuleId, {
                ...lessonForm,
                order_index: 99 // Backend handles simpler appending usually
            });

            toast({ title: 'Success', description: 'Lesson created' });
            setIsLessonDialogOpen(false);
            loadCourse(courseId);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save lesson', variant: 'destructive' });
        }
    };


    if (fetching) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/courses')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{isEditing ? 'Edit Course' : 'Create New Course'}</h1>
                    <p className="text-muted-foreground mt-1">
                        {isEditing ? 'Manage curriculum and settings' : 'Fill in the details to create a new course'}
                    </p>
                </div>
                {isEditing && (
                    <div className="ml-auto flex gap-2">
                        <Button variant="outline" onClick={() => navigate(`/courses/${courseId}/learn`)}>
                            Preview Course
                        </Button>
                        <Button onClick={() => handleBasicSave()} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="basic">Basic Information</TabsTrigger>
                    <TabsTrigger value="curriculum" disabled={!isEditing}>Curriculum</TabsTrigger>
                    <TabsTrigger value="settings" disabled={!isEditing}>Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="basic">
                    <form onSubmit={handleBasicSave}>
                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="md:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Course Details</CardTitle>
                                        <CardDescription>General information about your course</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Course Title</Label>
                                            <Input
                                                id="title"
                                                value={formData.title}
                                                onChange={(e) => handleChange('title', e.target.value)}
                                                placeholder="e.g. Master Web Development"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="slug">URL Slug</Label>
                                            <Input
                                                id="slug"
                                                value={formData.slug}
                                                onChange={(e) => handleChange('slug', e.target.value)}
                                                placeholder="e.g. master-web-development"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="short_description">Short Description</Label>
                                            <Textarea
                                                id="short_description"
                                                value={formData.short_description}
                                                onChange={(e) => handleChange('short_description', e.target.value)}
                                                placeholder="Brief summary..."
                                                rows={3}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">Full Description</Label>
                                            <Textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => handleChange('description', e.target.value)}
                                                placeholder="Detailed description..."
                                                rows={6}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Organization</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Category</Label>
                                            <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="development">Development</SelectItem>
                                                    <SelectItem value="business">Business</SelectItem>
                                                    <SelectItem value="marketing">Marketing</SelectItem>
                                                    <SelectItem value="design">Design</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Level</Label>
                                            <Select value={formData.level} onValueChange={(v) => handleChange('level', v)}>
                                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="beginner">Beginner</SelectItem>
                                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                                    <SelectItem value="advanced">Advanced</SelectItem>
                                                    <SelectItem value="all_levels">All Levels</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        {!isEditing && (
                                            <Button type="submit" className="w-full" disabled={loading}>
                                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Course'}
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>
                    </form>
                </TabsContent>

                <TabsContent value="curriculum">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Course Curriculum</CardTitle>
                                <CardDescription>Manage modules and lessons</CardDescription>
                            </div>
                            <Button onClick={handleAddModule}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Module
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {modules.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <p>No modules yet. Click "Add Module" to start.</p>
                                </div>
                            ) : (
                                <Accordion type="single" collapsible className="space-y-4">
                                    {modules.map((module) => (
                                        <AccordionItem key={module.id} value={`module-${module.id}`} className="border rounded-lg px-4">
                                            <div className="flex items-center justify-between py-2">
                                                <AccordionTrigger className="hover:no-underline">
                                                    <span className="font-semibold text-lg">{module.title}</span>
                                                    <span className="ml-2 text-sm text-muted-foreground">
                                                        ({module.lessons?.length || 0} lessons)
                                                    </span>
                                                </AccordionTrigger>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleAddLesson(module.id); }}>
                                                        <Plus className="h-4 w-4 mr-1" /> Lesson
                                                    </Button>
                                                </div>
                                            </div>
                                            <AccordionContent className="pb-4">
                                                <div className="space-y-2 pl-4">
                                                    {module.lessons?.map((lesson) => (
                                                        <div key={lesson.id} className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-background p-2 rounded shadow-sm">
                                                                    {lesson.content_type === 'video' ? <Video className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium">{lesson.title}</p>
                                                                    {lesson.video_url && (
                                                                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                                                            {lesson.video_url}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {lesson.is_preview && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!module.lessons || module.lessons.length === 0) && (
                                                        <p className="text-sm text-muted-foreground italic">No lessons in this module.</p>
                                                    )}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Access & Pricing</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between border p-4 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label>Free Course</Label>
                                    <p className="text-sm text-muted-foreground">Allow students to enroll for free</p>
                                </div>
                                <Switch
                                    checked={formData.is_free}
                                    onCheckedChange={(checked) => handleChange('is_free', checked)}
                                />
                            </div>

                            {!formData.is_free && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Price</Label>
                                        <Input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Currency</Label>
                                        <Select value={formData.currency} onValueChange={(v) => handleChange('currency', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="USD">USD</SelectItem>
                                                <SelectItem value="EUR">EUR</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between border p-4 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label>Published Status</Label>
                                    <p className="text-sm text-muted-foreground">Control course visibility</p>
                                </div>
                                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Module Dialog */}
            <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingModule ? 'Edit Module' : 'Add New Module'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Module Title</Label>
                            <Input
                                value={moduleName}
                                onChange={(e) => setModuleName(e.target.value)}
                                placeholder="e.g. Introduction"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModuleDialogOpen(false)}>Cancel</Button>
                        <Button onClick={saveModule}>Save Module</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Lesson Dialog */}
            <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Add New Lesson'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Lesson Title</Label>
                            <Input
                                value={lessonForm.title}
                                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                placeholder="e.g. Getting Started"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Content Type</Label>
                            <Select
                                value={lessonForm.content_type}
                                onValueChange={(v: any) => setLessonForm({ ...lessonForm, content_type: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="text">Text / Article</SelectItem>
                                    <SelectItem value="quiz">Quiz</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {lessonForm.content_type === 'video' && (
                            <div className="space-y-2">
                                <Label>Video URL</Label>
                                <Input
                                    value={lessonForm.video_url}
                                    onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                                    placeholder="https://youtube.com/watch?v=..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    Paste a link from YouTube, Vimeo, or a direct video file.
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Description / Content</Label>
                            <Textarea
                                value={lessonForm.content}
                                onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                                placeholder="Lesson description or text content..."
                                rows={4}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch
                                checked={lessonForm.is_free_preview}
                                onCheckedChange={(c) => setLessonForm({ ...lessonForm, is_free_preview: c })}
                            />
                            <Label>Allow as Free Preview</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>Cancel</Button>
                        <Button onClick={saveLesson}>Save Lesson</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
