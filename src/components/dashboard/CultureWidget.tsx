import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Star, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CultureWidget({ className }: { className?: string }) {
    const navigate = useNavigate();

    return (
        <Card className={`h-full border-none shadow-xl bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 ${className}`}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2 text-rose-700 dark:text-rose-400">
                        <Trophy className="h-5 w-5" /> Culture & Wins
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate('/culture/dashboard')}>
                        <TrendingUp className="h-4 w-4" />
                    </Button>
                </div>
                <CardDescription>Weekly recognition stats</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-black/20 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">142 Kudos</p>
                                <p className="text-xs text-muted-foreground">Given this week</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">+12%</span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                            <span>Values Alignment</span>
                            <span>8.4/10</span>
                        </div>
                        <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 w-[84%] rounded-full" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-2 border-t border-rose-200/50">
                        <Users className="h-4 w-4 text-rose-600" />
                        <span className="text-xs text-rose-800 dark:text-rose-300">
                            <strong>Sarah Wilson</strong> leads the leaderboard
                        </span>
                    </div>

                    <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200 dark:shadow-none border-none" size="sm" onClick={() => navigate('/culture/dashboard')}>
                        Visit Culture Hub
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
