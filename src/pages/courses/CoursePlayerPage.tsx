import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Menu, PlayCircle, CheckCircle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { coursesApi, Course, CourseModule, Lesson } from '@/services/coursesApi';
import { cn } from '@/lib/utils';

// Helper to extract embed URL (basic version)
const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = '';
            if (url.includes('youtu.be')) {
                videoId = url.split('/').pop() || '';
            } else {
                videoId = new URL(url).searchParams.get('v') || '';
            }
            return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
        }
        if (url.includes('vimeo.com')) {
            const videoId = url.split('/').pop() || '';
            return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
        }
    } catch (e) {
        console.error('Error parsing video URL', e);
    }
    return url;
};

export default function CoursePlayerPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<CourseModule[]>([]);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (courseId) {
            loadCourse(Number(courseId));
        }
    }, [courseId]);

    const loadCourse = async (id: number) => {
        try {
            setLoading(true);
            const data = await coursesApi.getCourse(id);
            setCourse(data);
            if (data.modules && data.modules.length > 0) {
                setModules(data.modules);
                // Select first lesson of first module if available
                if (data.modules[0].lessons && data.modules[0].lessons.length > 0) {
                    setActiveLesson(data.modules[0].lessons[0]);
                }
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: 'Failed to load course content',
                variant: 'destructive',
            });
            navigate('/courses');
        } finally {
            setLoading(false);
        }
    };

    const handleLessonSelect = (lesson: Lesson) => {
        setActiveLesson(lesson);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="flex bg-background h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!course) return null;

    const SidebarContent = () => (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b">
                <h2 className="font-semibold text-lg line-clamp-2">{course.title}</h2>
                <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                    <span>{course.total_lessons || 0} Lessons</span>
                    {/* Progress could go here */}
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4">
                    <Accordion type="single" collapsible defaultValue={`module-${modules[0]?.id}`} className="space-y-4">
                        {modules.map((module) => (
                            <AccordionItem key={module.id} value={`module-${module.id}`} className="border-b-0">
                                <AccordionTrigger className="hover:no-underline py-2 text-sm font-medium">
                                    {module.title}
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-1 mt-1">
                                        {module.lessons?.map((lesson) => (
                                            <button
                                                key={lesson.id}
                                                onClick={() => handleLessonSelect(lesson)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-2 rounded-md text-sm transition-colors text-left",
                                                    activeLesson?.id === lesson.id
                                                        ? "bg-primary/10 text-primary font-medium"
                                                        : "hover:bg-muted text-muted-foreground"
                                                )}
                                            >
                                                {lesson.content_type === 'video' ? (
                                                    <PlayCircle className="h-4 w-4 shrink-0" />
                                                ) : (
                                                    <FileText className="h-4 w-4 shrink-0" />
                                                )}
                                                <span className="line-clamp-2">
                                                    {lesson.title}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </ScrollArea>
        </div>
    );

    return (
        <div className="flex h-screen bg-background flex-col md:flex-row overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center p-4 border-b">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="mr-2">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-80">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
                <h1 className="font-semibold truncate">{course.title}</h1>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:block w-80 border-r bg-card/30">
                <SidebarContent />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    {activeLesson ? (
                        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Button variant="ghost" size="sm" onClick={() => navigate('/courses/my-enrollments')}>
                                    <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
                                </Button>
                            </div>

                            {activeLesson.content_type === 'video' && activeLesson.video_url && (
                                <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                                    <iframe
                                        src={getEmbedUrl(activeLesson.video_url)}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title={activeLesson.title}
                                    />
                                </div>
                            )}

                            <div className="space-y-4">
                                <h1 className="text-2xl font-bold">{activeLesson.title}</h1>
                                {activeLesson.content && (
                                    <div className="prose dark:prose-invert max-w-none">
                                        <div className="whitespace-pre-wrap">{activeLesson.content}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                            <PlayCircle className="h-16 w-16 mb-4 opacity-20" />
                            <h2 className="text-xl font-semibold mb-2">Select a lesson to start learning</h2>
                            <p>Choose a lesson from the sidebar to begin.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
