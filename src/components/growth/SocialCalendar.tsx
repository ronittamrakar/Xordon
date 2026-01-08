import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Facebook, Instagram, Linkedin, Twitter, Music2, Youtube, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SocialPost } from '@/services/socialApi';

interface SocialCalendarProps {
  posts: SocialPost[];
  onSelectPost?: (post: SocialPost) => void;
}

const platformIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="h-3 w-3 text-blue-600" />,
  instagram: <Instagram className="h-3 w-3 text-pink-600" />,
  linkedin: <Linkedin className="h-3 w-3 text-blue-700" />,
  twitter: <Twitter className="h-3 w-3 text-sky-500" />,
  tiktok: <Music2 className="h-3 w-3 text-black" />,
  youtube: <Youtube className="h-3 w-3 text-red-600" />,
  pinterest: <Pin className="h-3 w-3 text-red-500" />,
};

export const SocialCalendar: React.FC<SocialCalendarProps> = ({ posts, onSelectPost }) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getPostsForDay = (day: Date) => {
    return posts.filter(post => post.scheduled_at && isSameDay(new Date(post.scheduled_at), day));
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-400',
    scheduled: 'bg-hunter-orange',
    published: 'bg-green-500',
    failed: 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Badge variant="outline" className="rounded-full px-4 py-1 border-hunter-orange/20 text-hunter-orange bg-hunter-orange/5">
            {posts.filter(p => isSameMonth(new Date(p.scheduled_at || ''), currentMonth)).length} Posts
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date())} className="h-10 w-10 text-xs font-bold uppercase tracking-tighter">Today</Button>
          <div className="flex items-center bg-background rounded-xl p-1 shadow-sm border">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-lg hover:bg-muted">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-lg hover:bg-muted">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
          <div key={day} className="text-center text-[12px] font-bold uppercase tracking-widest text-muted-foreground pb-2">
            {day}
          </div>
        ))}
        {calendarDays.map((day, i) => {
          const dayPosts = getPostsForDay(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, monthStart);

          return (
            <div
              key={i}
              className={`min-h-[140px] rounded-2xl p-3 transition-all duration-300 border-2 ${isToday
                ? 'border-hunter-orange bg-hunter-orange/[0.03] shadow-lg shadow-hunter-orange/10'
                : isCurrentMonth
                  ? 'border-transparent bg-muted/20 hover:bg-muted/40 hover:border-muted'
                  : 'border-transparent opacity-30 grayscale pointer-events-none'
                }`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className={`text-sm font-bold ${isToday ? 'text-hunter-orange' : 'text-foreground/70'}`}>
                  {format(day, 'd')}
                </span>
                {dayPosts.length > 0 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-hunter-orange shadow-sm shadow-hunter-orange/50 animate-pulse" />
                )}
              </div>
              <div className="space-y-2">
                {dayPosts.map(post => {
                  return (
                    <div
                      key={post.id}
                      className="group relative bg-background/80 backdrop-blur-sm p-2 rounded-xl border border-white/10 shadow-sm cursor-pointer hover:border-hunter-orange/50 hover:shadow-md hover:scale-[1.02] transition-all"
                      onClick={() => onSelectPost?.(post)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex -space-x-1">
                          {post.target_accounts?.slice(0, 3).map(accId => (
                            <div key={accId} className="w-4 h-4 rounded-full border border-background bg-muted flex items-center justify-center">
                              {/* Just a tiny dot or icon would be better here */}
                              <div className={`w-1 h-1 rounded-full ${statusColors[post.status]}`} />
                            </div>
                          ))}
                        </div>
                        <span className="text-[12px] font-bold opacity-50">{format(new Date(post.scheduled_at!), 'h:mm a')}</span>
                      </div>
                      <div className="text-[12px] leading-tight line-clamp-2 opacity-80 group-hover:opacity-100">{post.content}</div>

                      {/* Platform icons indicator */}
                      <div className="mt-2 pt-2 border-t border-muted flex gap-1 items-center overflow-hidden">
                        {/* This would ideally use actual account platforms */}
                        <Facebook className="h-2.5 w-2.5 text-blue-600/50" />
                        <Instagram className="h-2.5 w-2.5 text-pink-600/50" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
