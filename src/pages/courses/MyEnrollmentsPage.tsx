import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookOpen, Award, Clock, TrendingUp } from 'lucide-react';
import { enrollmentsApi, Enrollment } from '@/services/enrollmentsApi';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function MyEnrollmentsPage() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        loadEnrollments();
    }, [filter]);

    const loadEnrollments = async () => {
        try {
            setLoading(true);
            const filterValue = filter === 'all' ? undefined : filter;
            const data = await enrollmentsApi.getUserEnrollments(filterValue);
            setEnrollments(data);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to load enrollments',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            active: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            expired: 'bg-gray-100 text-gray-800',
        };
        return colors[status as keyof typeof colors] || colors.active;
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
                    <h1 className="text-2xl font-bold">My Courses</h1>
                    <p className="text-muted-foreground mt-1">
                        Track your learning progress
                    </p>
                </div>
                <Button onClick={() => navigate('/courses')}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Browse Courses
                </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                >
                    All Courses
                </Button>
                <Button
                    variant={filter === 'active' ? 'default' : 'outline'}
                    onClick={() => setFilter('active')}
                >
                    In Progress
                </Button>
                <Button
                    variant={filter === 'completed' ? 'default' : 'outline'}
                    onClick={() => setFilter('completed')}
                >
                    Completed
                </Button>
            </div>

            {/* Enrollments List */}
            {enrollments.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No courses found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {filter === 'all'
                                ? 'Enroll in a course to start learning'
                                : `No ${filter} courses`
                            }
                        </p>
                        <Button onClick={() => navigate('/courses')} className="mt-4">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Browse Courses
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {enrollments.map((enrollment) => (
                        <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="flex flex-col md:flex-row">
                                {enrollment.thumbnail_url && (
                                    <div className="md:w-64 aspect-video md:aspect-auto bg-muted">
                                        <img
                                            src={enrollment.thumbnail_url}
                                            alt={enrollment.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <CardTitle className="text-xl">{enrollment.title}</CardTitle>
                                                <CardDescription className="mt-1">
                                                    {enrollment.category && (
                                                        <Badge variant="outline" className="mr-2">{enrollment.category}</Badge>
                                                    )}
                                                    {enrollment.level && (
                                                        <Badge variant="outline">{enrollment.level}</Badge>
                                                    )}
                                                </CardDescription>
                                            </div>
                                            <Badge className={getStatusColor(enrollment.status)}>
                                                {enrollment.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        {/* Progress */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Progress</span>
                                                <span className="font-medium">{enrollment.progress_percentage.toFixed(0)}%</span>
                                            </div>
                                            <Progress value={enrollment.progress_percentage} className="h-2" />
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>{enrollment.completed_lessons} of {enrollment.total_lessons} lessons completed</span>
                                                {enrollment.status === 'completed' && enrollment.certificate_issued && (
                                                    <div className="flex items-center gap-1 text-green-600">
                                                        <Award className="h-3 w-3" />
                                                        <span>Certificate Issued</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Started</p>
                                                    <p className="font-medium">{format(new Date(enrollment.started_at), 'MMM d, yyyy')}</p>
                                                </div>
                                            </div>

                                            {enrollment.last_accessed_at && (
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Last Accessed</p>
                                                        <p className="font-medium">{format(new Date(enrollment.last_accessed_at), 'MMM d, yyyy')}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {enrollment.completed_at && (
                                                <div className="flex items-center gap-2">
                                                    <Award className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Completed</p>
                                                        <p className="font-medium">{format(new Date(enrollment.completed_at), 'MMM d, yyyy')}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {enrollment.expires_at && new Date(enrollment.expires_at) > new Date() && (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-orange-500" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Expires</p>
                                                        <p className="font-medium text-orange-500">{format(new Date(enrollment.expires_at), 'MMM d, yyyy')}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => navigate(`/courses/${enrollment.course_id}/learn`)}
                                                disabled={enrollment.status === 'cancelled' || enrollment.status === 'expired'}
                                            >
                                                {enrollment.status === 'completed' ? 'Review Course' : 'Continue Learning'}
                                            </Button>

                                            {enrollment.status === 'completed' && enrollment.certificate_issued && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => navigate(`/certificates?enrollment=${enrollment.id}`)}
                                                >
                                                    <Award className="mr-2 h-4 w-4" />
                                                    View Certificate
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
