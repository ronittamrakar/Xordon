import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star, MessageSquare, ExternalLink, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Review {
    id: string;
    author: string;
    rating: number;
    text: string;
    platform: string;
    date: string;
}

interface RecentReviewsWidgetProps {
    reviews: Review[];
    className?: string;
}

export const RecentReviewsWidget: React.FC<RecentReviewsWidgetProps> = ({ reviews, className }) => {
    return (
        <Card className={cn("bg-background/50 backdrop-blur-md border-none shadow-xl", className)}>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        Recent Reviews
                    </CardTitle>
                    <CardDescription>Latest customer feedback</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                    Monitor <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {reviews.length > 0 ? reviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-xl bg-muted/20 border border-border/30 relative group hover:border-primary/30 transition-all">
                        <Quote className="absolute right-4 top-4 h-8 w-8 text-primary/5 group-hover:text-primary/10 transition-colors" />
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            "h-3 w-3",
                                            i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"
                                        )}
                                    />
                                ))}
                            </div>
                            <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">• {review.platform}</span>
                        </div>
                        <p className="text-sm font-semibold mb-1 line-clamp-1">{review.author}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed">
                            "{review.text}"
                        </p>
                        <div className="mt-3 flex justify-between items-center">
                            <span className="text-[12px] text-muted-foreground/60">{review.date}</span>
                            <Button variant="link" size="sm" className="h-auto p-0 text-[12px] font-bold uppercase tracking-tighter hover:text-primary">
                                View Reply
                            </Button>
                        </div>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No reviews found yet.</p>
                        <p className="text-xs opacity-60">Connect GMB or FB to start monitoring.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
