/**
 * Notification Bell Component
 * Shows notification count and dropdown with recent notifications
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, CheckCheck, Trash2, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { notificationsApi, Notification } from '@/services/notificationsApi';
import { useNavigate } from 'react-router-dom';

interface NotificationBellProps {
  className?: string;
}

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  onClick,
}: {
  notification: Notification;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  onClick: (notification: Notification) => void;
}) {
  return (
    <div
      className={cn(
        'p-3 hover:bg-gray-50 cursor-pointer transition-colors',
        !notification.is_read && 'bg-blue-50/50'
      )}
      onClick={() => onClick(notification)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn('text-sm truncate', !notification.is_read && 'font-medium')}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>
          {notification.body && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.body}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
              title="Mark as read"
            >
              <Check className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch unread count (polls every 30 seconds)
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000,
  });

  // Fetch notifications when popover opens
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn: () => notificationsApi.list({ limit: 10 }),
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }

    // Navigate if action URL exists
    if (notification.action_url) {
      setOpen(false);
      navigate(notification.action_url);
    }
  };

  const notifications = notificationsData?.data || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('relative', className)}>
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-medium">Notifications</h4>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => {
                setOpen(false);
                navigate('/settings#notifications');
              }}
              title="Notification settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Notifications list */}
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-3 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setOpen(false);
                  navigate('/notifications');
                }}
              >
                View all notifications
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;
