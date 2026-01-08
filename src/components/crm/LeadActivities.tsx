import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar,
  FileTextIcon,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { LeadActivity, ActivityType, CreateActivityData } from '@/types/crm';
import { ACTIVITY_TYPES } from '@/types/crm';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface LeadActivitiesProps {
  leadId: string;
  activities: LeadActivity[];
  onActivityAdded: () => void;
}

const LeadActivities: React.FC<LeadActivitiesProps> = ({ leadId, activities, onActivityAdded }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const addActivity = async (data: CreateActivityData) => {
    try {
      setLoading(true);
      await api.post(`/crm/leads/${leadId}/activities`, data);
      toast.success('Activity added successfully');
      setIsAddDialogOpen(false);
      onActivityAdded();
    } catch (error) {
      console.error('Failed to add activity:', error);
      toast.error('Failed to add activity');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    const typeConfig = ACTIVITY_TYPES.find(t => t.value === type);
    const IconComponent = typeConfig?.icon || FileTextIcon;
    return <IconComponent className="h-4 w-4" />;
  };

  const getActivityColor = (type: ActivityType) => {
    const colors: { [key in ActivityType]: string } = {
      'call': 'bg-blue-100 text-blue-800',
      'email': 'bg-green-100 text-green-800',
      'sms': 'bg-purple-100 text-purple-800',
      'meeting': 'bg-orange-100 text-orange-800',
      'note': 'bg-gray-100 text-gray-800',
      'task': 'bg-indigo-100 text-indigo-800',
      'deal_change': 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Activity Timeline</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Activity</DialogTitle>
              <DialogDescription>
                Record an interaction with this lead
              </DialogDescription>
            </DialogHeader>
            <AddActivityForm onSubmit={addActivity} onCancel={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No activities recorded yet</p>
            <p className="text-sm text-gray-400 mt-2">Start tracking your interactions with this lead</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Card key={activity.id} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.activityType)}`}>
                    {getActivityIcon(activity.activityType)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{activity.activityTitle}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {activity.activityType}
                      </Badge>
                    </div>
                    
                    {activity.activityDescription && (
                      <p className="text-gray-600 text-sm mb-2">{activity.activityDescription}</p>
                    )}
                    
                    {activity.outcome && (
                      <div className="bg-gray-50 p-2 rounded text-sm mb-2">
                        <span className="font-medium">Outcome:</span> {activity.outcome}
                      </div>
                    )}
                    
                    {activity.nextAction && (
                      <div className="bg-blue-50 p-2 rounded text-sm mb-2">
                        <span className="font-medium">Next Action:</span> {activity.nextAction}
                        {activity.nextActionDate && (
                          <span className="text-blue-600 ml-2">
                            ({format(new Date(activity.nextActionDate), 'MMM d, yyyy')})
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatActivityDate(activity.activityDate)}</span>
                      <span>•</span>
                      <span>By {activity.userName}</span>
                      {activity.durationMinutes && (
                        <>
                          <span>•</span>
                          <span>{activity.durationMinutes} min</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Add Activity Form Component
const AddActivityForm: React.FC<{
  onSubmit: (data: CreateActivityData) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CreateActivityData>({
    activityType: 'note',
    activityTitle: '',
    activityDescription: '',
    outcome: '',
    nextAction: '',
    nextActionDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="activityType">Activity Type *</Label>
        <Select value={formData.activityType} onValueChange={(value) => setFormData(prev => ({ ...prev, activityType: value as ActivityType }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center space-x-2">
                  {React.createElement(type.icon, { className: "h-4 w-4" })}
                  <span>{type.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="activityTitle">Title *</Label>
        <input
          id="activityTitle"
          type="text"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Activity title..."
          value={formData.activityTitle}
          onChange={(e) => setFormData(prev => ({ ...prev, activityTitle: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="activityDescription">Description</Label>
        <Textarea
          id="activityDescription"
          placeholder="Activity details..."
          value={formData.activityDescription}
          onChange={(e) => setFormData(prev => ({ ...prev, activityDescription: e.target.value }))}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="outcome">Outcome</Label>
        <Textarea
          id="outcome"
          placeholder="What was the outcome of this activity?"
          value={formData.outcome}
          onChange={(e) => setFormData(prev => ({ ...prev, outcome: e.target.value }))}
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="nextAction">Next Action</Label>
        <Textarea
          id="nextAction"
          placeholder="What are the next steps?"
          value={formData.nextAction}
          onChange={(e) => setFormData(prev => ({ ...prev, nextAction: e.target.value }))}
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="nextActionDate">Next Action Date</Label>
        <input
          id="nextActionDate"
          type="datetime-local"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={formData.nextActionDate}
          onChange={(e) => setFormData(prev => ({ ...prev, nextActionDate: e.target.value }))}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Add Activity
        </Button>
      </DialogFooter>
    </form>
  );
};

export default LeadActivities;

