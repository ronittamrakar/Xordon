import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { Loader2, Plus, Search, BookOpen, Users, Star, Clock, DollarSign, MoreHorizontal, Archive, Trash2, Eye } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { coursesApi, Course, CourseFilters } from '@/services/coursesApi';
import { useNavigate } from 'react-router-dom';

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<CourseFilters>({});
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        loadCourses();
    }, [filters]);

    const loadCourses = async () => {
        try {
            setLoading(true);
            const data = await coursesApi.getCourses(filters);
            setCourses(data);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to load courses',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // Debounce search query for better performance
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            const matchesSearch = course.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                course.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

            // Exclude archived and trashed if no status filter is selected (showing 'all' active)
            // If specific status is selected, the API handles it, but here we handle the 'all' case from UI perspective
            // effectively 'All' means 'All Active' (not archived/trashed) unless specifically asked
            const isVisible = filters.status ? true : (course.status !== 'archived' && course.status !== 'trashed');

            return matchesSearch && isVisible;
        });
    }, [courses, debouncedSearchQuery, filters.status]);

    const handleArchiveCourse = async (id: number) => {
        try {
            await coursesApi.updateCourse(id, { status: 'archived' });
            toast({ title: 'Success', description: 'Course archived' });
            loadCourses();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to archive course', variant: 'destructive' });
        }
    };

    const handleMoveToTrash = async (id: number) => {
        try {
            await coursesApi.updateCourse(id, { status: 'trashed' });
            toast({ title: 'Success', description: 'Course moved to trash' });
            loadCourses();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to move course to trash', variant: 'destructive' });
        }
    };

    const getLevelColor = (level: string) => {
        const colors = {
            beginner: 'bg-green-100 text-green-800',
            intermediate: 'bg-blue-100 text-blue-800',
            advanced: 'bg-purple-100 text-purple-800',
            all_levels: 'bg-gray-100 text-gray-800',
        };
        return colors[level as keyof typeof colors] || colors.all_levels;
    };

    const getStatusColor = (status: string) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800',
            published: 'bg-green-100 text-green-800',
            archived: 'bg-red-100 text-red-800',
        };
        return colors[status as keyof typeof colors] || colors.draft;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Courses</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and view all courses
                    </p>
                </div>
                <Button onClick={() => navigate('/courses/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Course
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value as any })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.level || 'all'}
                            onValueChange={(value) => setFilters({ ...filters, level: value === 'all' ? undefined : value as any })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                                <SelectItem value="all_levels">All Levels</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.is_free === undefined ? 'all' : filters.is_free ? 'free' : 'paid'}
                            onValueChange={(value) => setFilters({ ...filters, is_free: value === 'all' ? undefined : value === 'free' })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Price" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Courses</SelectItem>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Course Grid */}
            {filteredCourses.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No courses found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {searchQuery ? 'Try adjusting your search or filters' : 'Create your first course to get started'}
                        </p>
                        {!searchQuery && (
                            <Button onClick={() => navigate('/courses/new')} className="mt-4">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Course
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCourses.map((course) => (
                        <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/courses/${course.id}`)}>
                            {course.thumbnail_url && (
                                <div className="aspect-video bg-muted">
                                    <img
                                        src={course.thumbnail_url}
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                                    <Badge className={getStatusColor(course.status)}>
                                        {course.status}
                                    </Badge>
                                </div>
                                <CardDescription className="line-clamp-2">
                                    {course.short_description || course.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={getLevelColor(course.level)}>
                                        {course.level.replace('_', ' ')}
                                    </Badge>
                                    {course.category && (
                                        <Badge variant="outline">{course.category}</Badge>
                                    )}
                                    {course.certificate_enabled && (
                                        <Badge variant="outline">Certificate</Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        <span>{course.total_students} students</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <BookOpen className="h-4 w-4" />
                                        <span>{course.total_lessons} lessons</span>
                                    </div>
                                    {course.duration_hours && (
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>{course.duration_hours}h</span>
                                        </div>
                                    )}
                                    {course.rating_count > 0 && (
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            <span>{course.rating_average.toFixed(1)} ({course.rating_count})</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex items-center justify-between">
                                {course.is_free ? (
                                    <span className="text-lg font-bold text-green-600">Free</span>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-lg font-bold">{course.price}</span>
                                        <span className="text-sm text-muted-foreground">{course.currency}</span>
                                    </div>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/courses/${course.id}`);
                                        }}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleArchiveCourse(course.id);
                                        }}>
                                            <Archive className="h-4 w-4 mr-2" />
                                            Archive
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Are you sure you want to move this course to trash?')) {
                                                    handleMoveToTrash(course.id);
                                                }
                                            }}
                                            className="text-red-600 focus:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Move to Trash
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
