import { Bell, Check } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const mockNotifications = [
    { id: 1, title: 'Campaign Completed', description: 'Your "Welcome" campaign has finished.', time: '2m ago', read: false },
    { id: 2, title: 'New Form Submission', description: 'Someone submitted "Contact Us".', time: '1h ago', read: false },
    { id: 3, title: 'Subscription Renewed', description: 'Your plan has been renewed.', time: '1d ago', read: true },
];

export function NotificationCenter() {
    const unreadCount = mockNotifications.filter(n => !n.read).length;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-primary text-primary-foreground text-[12px] border-2 border-background">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="text-sm font-semibold">Notifications</h4>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">
                        Mark all as read
                    </Button>
                </div>
                <ScrollArea className="h-80">
                    <div className="flex flex-col">
                        {mockNotifications.map((n) => (
                            <div
                                key={n.id}
                                className={`flex flex-col gap-1 p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer ${!n.read ? 'bg-muted/20' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm font-medium ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</span>
                                    <span className="text-xs text-muted-foreground">{n.time}</span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">{n.description}</p>
                                {!n.read && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px] gap-1">
                                            <Check className="h-3 w-3" />
                                            Mark read
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t text-center">
                    <Button variant="link" size="sm" className="text-xs">
                        View all notifications
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
