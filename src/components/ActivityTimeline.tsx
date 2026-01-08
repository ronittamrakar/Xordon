/**
 * Activity Timeline Component
 * Reusable timeline for displaying activities on any entity
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  Mail,
  Phone,
  FileText as FileTextIcon,
  Calendar,
  DollarSign,
  User,
  Settings,
  Pin,
  PinOff,
  ChevronDown,
  ChevronUp,
  Send,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { activitiesApi, Activity, ActivityComment } from '@/services/activitiesApi';
import { useToast } from '@/hooks/use-toast';

interface ActivityTimelineProps {
  entityType: string;
  entityId: number;
  className?: string;
  showAddNote?: boolean;
  maxHeight?: string;
}

const activityTypeIcons: Record<string, React.ElementType> = {
  created: Plus,
  updated: Edit,
  status_changed: Settings,
  note_added: MessageSquare,
  email_sent: Mail,
  email_received: Mail,
  call_made: Phone,
  call_received: Phone,
  sms_sent: MessageSquare,
  sms_received: MessageSquare,
  appointment_scheduled: Calendar,
  appointment_completed: CheckCircle,
  appointment_cancelled: XCircle,
  invoice_created: FileTextIcon,
  invoice_sent: FileTextIcon,
  invoice_paid: DollarSign,
  payment_received: DollarSign,
  assigned: User,
  stage_changed: Settings,
  won: CheckCircle,
  lost: XCircle,
  default: Clock,
};

const activityTypeColors: Record<string, string> = {
  created: 'bg-green-100 text-green-700',
  updated: 'bg-blue-100 text-blue-700',
  status_changed: 'bg-purple-100 text-purple-700',
  note_added: 'bg-gray-100 text-gray-700',
  email_sent: 'bg-indigo-100 text-indigo-700',
  email_received: 'bg-indigo-100 text-indigo-700',
  call_made: 'bg-orange-100 text-orange-700',
  call_received: 'bg-orange-100 text-orange-700',
  sms_sent: 'bg-cyan-100 text-cyan-700',
  sms_received: 'bg-cyan-100 text-cyan-700',
  appointment_scheduled: 'bg-yellow-100 text-yellow-700',
  appointment_completed: 'bg-green-100 text-green-700',
  appointment_cancelled: 'bg-red-100 text-red-700',
  invoice_created: 'bg-slate-100 text-slate-700',
  invoice_sent: 'bg-slate-100 text-slate-700',
  invoice_paid: 'bg-emerald-100 text-emerald-700',
  payment_received: 'bg-emerald-100 text-emerald-700',
  assigned: 'bg-violet-100 text-violet-700',
  stage_changed: 'bg-amber-100 text-amber-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  default: 'bg-gray-100 text-gray-700',
};

function ActivityItem({ activity, onPin }: { activity: Activity; onPin: (id: number) => void }) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const Icon = activityTypeIcons[activity.activity_type] || activityTypeIcons.default;
  const colorClass = activityTypeColors[activity.activity_type] || activityTypeColors.default;

  const { data: comments, isLoading: loadingComments } = useQuery({
    queryKey: ['activity-comments', activity.id],
    queryFn: () => activitiesApi.getComments(activity.id),
    enabled: showComments,
  });

  const addCommentMutation = useMutation({
    mutationFn: (body: string) => activitiesApi.addComment(activity.id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-comments', activity.id] });
      setNewComment('');
      toast({ title: 'Comment added' });
    },
  });

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  return (
    <div className={cn('relative pl-8 pb-6', activity.is_pinned && 'bg-yellow-50/50 -mx-4 px-4 rounded-lg')}>
      {/* Timeline line */}
      <div className="absolute left-3 top-6 bottom-0 w-px bg-gray-200" />

      {/* Icon */}
      <div className={cn('absolute left-0 w-6 h-6 rounded-full flex items-center justify-center', colorClass)}>
        <Icon className="w-3 h-3" />
      </div>

      {/* Content */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
            {activity.description && (
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{activity.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {activity.is_pinned && (
              <Badge variant="outline" className="text-xs bg-yellow-100 border-yellow-300">
                <Pin className="w-3 h-3 mr-1" />
                Pinned
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPin(activity.id)}>
                  {activity.is_pinned ? (
                    <>
                      <PinOff className="w-4 h-4 mr-2" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="w-4 h-4 mr-2" />
                      Pin to top
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Changes display */}
        {activity.changes && Object.keys(activity.changes).length > 0 && (
          <div className="mt-2 text-xs bg-gray-50 rounded p-2 space-y-1">
            {Object.entries(activity.changes).map(([field, change]) => (
              <div key={field} className="flex items-center gap-2">
                <span className="font-medium text-gray-600">{field}:</span>
                <span className="text-gray-400 line-through">{String(change.old || '(empty)')}</span>
                <span className="text-gray-400">→</span>
                <span className="text-gray-900">{String(change.new || '(empty)')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
          {activity.user_name && (
            <span className="flex items-center gap-1">
              <Avatar className="w-4 h-4">
                <AvatarFallback className="text-[8px]">
                  {activity.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {activity.user_name}
            </span>
          )}
          {activity.is_system && (
            <Badge variant="outline" className="text-[12px] py-0">System</Badge>
          )}
          <span title={format(new Date(activity.created_at), 'PPpp')}>
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Comments section */}
        {(activity.comment_count ?? 0) > 0 && (
          <Collapsible open={showComments} onOpenChange={setShowComments}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs h-6 px-2 mt-1">
                <MessageSquare className="w-3 h-3 mr-1" />
                {activity.comment_count} {activity.comment_count === 1 ? 'comment' : 'comments'}
                {showComments ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {loadingComments ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                comments?.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded p-2 text-sm">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <span className="font-medium">{comment.user_name || 'Unknown'}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="text-gray-700">{comment.body}</p>
                  </div>
                ))
              )}

              {/* Add comment input */}
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="text-sm min-h-[60px]"
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

export function ActivityTimeline({
  entityType,
  entityId,
  className,
  showAddNote = true,
  maxHeight = '600px',
}: ActivityTimelineProps) {
  const [newNote, setNewNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['activities', entityType, entityId],
    queryFn: () => activitiesApi.forEntity(entityType, entityId),
  });

  const addNoteMutation = useMutation({
    mutationFn: (note: string) =>
      activitiesApi.create({
        entity_type: entityType,
        entity_id: entityId,
        title: 'Note added',
        description: note,
        activity_type: 'note_added',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', entityType, entityId] });
      setNewNote('');
      setShowNoteInput(false);
      toast({ title: 'Note added' });
    },
  });

  const pinMutation = useMutation({
    mutationFn: (id: number) => activitiesApi.togglePin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', entityType, entityId] });
    },
  });

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNoteMutation.mutate(newNote.trim());
    }
  };

  // Sort activities: pinned first, then by date
  const sortedActivities = React.useMemo(() => {
    if (!data?.data) return [];
    return [...data.data].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [data?.data]);

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-red-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          Failed to load activity timeline
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Activity Timeline</CardTitle>
          {showAddNote && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNoteInput(!showNoteInput)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Note
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Add note input */}
        {showNoteInput && (
          <div className="mb-4 space-y-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="min-h-[80px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowNoteInput(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!newNote.trim() || addNoteMutation.isPending}
              >
                {addNoteMutation.isPending ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="overflow-y-auto" style={{ maxHeight }}>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedActivities.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No activity yet
            </div>
          ) : (
            <div className="relative">
              {sortedActivities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  onPin={(id) => pinMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Load more */}
        {data?.meta && data.meta.total > sortedActivities.length && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              Load more ({data.meta.total - sortedActivities.length} remaining)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ActivityTimeline;
