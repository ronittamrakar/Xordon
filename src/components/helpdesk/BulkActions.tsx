import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { CheckSquare, X, Users, Tag as TagIcon, AlertCircle, Trash2 } from 'lucide-react';

interface BulkActionsProps {
  selectedTickets: number[];
  onClearSelection: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({ selectedTickets, onClearSelection }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [actionType, setActionType] = useState<string>('');
  const [actionValue, setActionValue] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const bulkMutation = useMutation({
    mutationFn: async (data: { action: string; value?: string }) => {
      const response = await api.post('/helpdesk/bulk-actions', {
        ticket_ids: selectedTickets,
        action_type: data.action,
        action_data: data.value ? { value: data.value } : null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast({ title: `Bulk action applied to ${selectedTickets.length} ticket(s)` });
      onClearSelection();
      setIsDialogOpen(false);
      setActionType('');
      setActionValue('');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to apply bulk action', variant: 'destructive' });
    },
  });

  const handleBulkAction = (action: string) => {
    setActionType(action);
    if (action === 'close' || action === 'delete') {
      setIsDialogOpen(true);
    } else {
      setIsDialogOpen(true);
    }
  };

  const handleConfirm = () => {
    if (actionType === 'assign' || actionType === 'priority' || actionType === 'status' || actionType === 'team') {
      if (!actionValue) {
        toast({ title: 'Error', description: 'Please select a value', variant: 'destructive' });
        return;
      }
      bulkMutation.mutate({ action: actionType, value: actionValue });
    } else {
      bulkMutation.mutate({ action: actionType });
    }
  };

  if (selectedTickets.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-card border shadow-lg rounded-lg p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            <span className="font-semibold">{selectedTickets.length} selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('assign')} className="gap-2">
              <Users className="w-4 h-4" />
              Assign
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('priority')} className="gap-2">
              <AlertCircle className="w-4 h-4" />
              Priority
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('status')} className="gap-2">
              <CheckSquare className="w-4 h-4" />
              Status
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('tag')} className="gap-2">
              <TagIcon className="w-4 h-4" />
              Tag
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('close')} className="gap-2">
              <X className="w-4 h-4" />
              Close
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('delete')} className="gap-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            Clear
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Action: {actionType}</DialogTitle>
            <DialogDescription>
              Apply this action to {selectedTickets.length} ticket(s)
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {actionType === 'assign' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign to</label>
                <Select value={actionValue} onValueChange={setActionValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="me">Me</SelectItem>
                    <SelectItem value="agent1">Agent 1</SelectItem>
                    <SelectItem value="agent2">Agent 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {actionType === 'priority' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Set priority</label>
                <Select value={actionValue} onValueChange={setActionValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {actionType === 'status' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Set status</label>
                <Select value={actionValue} onValueChange={setActionValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {actionType === 'tag' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Add tag</label>
                <input
                  type="text"
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  placeholder="Enter tag name"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            )}

            {actionType === 'close' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to close {selectedTickets.length} ticket(s)?
                </p>
              </div>
            )}

            {actionType === 'delete' && (
              <div className="space-y-2">
                <p className="text-sm text-destructive font-semibold">
                  ⚠️ This action cannot be undone!
                </p>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete {selectedTickets.length} ticket(s)?
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={bulkMutation.isPending}
              variant={actionType === 'delete' ? 'destructive' : 'default'}
            >
              {bulkMutation.isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
