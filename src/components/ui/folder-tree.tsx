import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface GroupTreeItem {
  id: string;
  name: string;
  parent_id?: string;
  children?: GroupTreeItem[];
  itemCount?: number;
}

interface GroupTreeProps {
  groups: GroupTreeItem[];
  selectedGroupId?: string;
  onGroupSelect: (groupId: string | null) => void;
  onCreateGroup: (name: string, parentId?: string) => Promise<void>;
  onUpdateGroup?: (id: string, name: string) => Promise<void>;
  onDeleteGroup?: (id: string) => Promise<void>;
}

interface GroupNodeProps {
  group: GroupTreeItem;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpanded: (groupId: string) => void;
  onSelect: (groupId: string) => void;
  onCreateSubgroup: (parentId: string) => void;
  onEdit?: (id: string, name: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const GroupNode: React.FC<GroupNodeProps> = ({
  group,
  isSelected,
  isExpanded,
  onToggleExpanded,
  onSelect,
  onCreateSubgroup,
  onEdit,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const hasChildren = group.children && group.children.length > 0;

  const handleEditSubmit = () => {
    if (editName.trim() && editName !== group.name && onEdit) {
      onEdit(group.id, editName.trim());
    }
    setIsEditing(false);
    setEditName(group.name);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditName(group.name);
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-1 py-1 px-2 rounded-md hover:bg-gray-100 cursor-pointer group",
          isSelected && "bg-blue-50 border border-blue-200"
        )}
      >
        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-gray-200"
          onClick={() => onToggleExpanded(group.id)}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : (
            <div className="h-3 w-3" />
          )}
        </Button>

        {/* Group Icon */}
        <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => onSelect(group.id)}>
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-600 flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
          )}

          {/* Group Name */}
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEditSubmit();
                } else if (e.key === 'Escape') {
                  handleEditCancel();
                }
              }}
              className="h-6 text-sm"
              autoFocus
            />
          ) : (
            <span className="text-sm font-medium text-gray-700 truncate">
              {group.name}
            </span>
          )}

          {group.itemCount !== undefined && (
            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {group.itemCount}
            </span>
          )}
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onCreateSubgroup(group.id)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Subgroup
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(group.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="ml-6 mt-1">
          {group.children!.map((child) => (
            <GroupNodeContainer
              key={child.id}
              group={child}
              isSelected={isSelected}
              onToggleExpanded={onToggleExpanded}
              onSelect={onSelect}
              onCreateSubgroup={onCreateSubgroup}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const GroupNodeContainer: React.FC<Omit<GroupNodeProps, 'isExpanded' | 'onToggleExpanded'> & {
  onToggleExpanded: (groupId: string) => void;
}> = ({ group, onToggleExpanded, ...props }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleToggleExpanded = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  return (
    <GroupNode
      {...props}
      group={group}
      isExpanded={expandedGroups.has(group.id)}
      onToggleExpanded={handleToggleExpanded}
    />
  );
};

export const GroupTree: React.FC<GroupTreeProps> = ({
  groups,
  selectedGroupId,
  onGroupSelect,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [newGroupName, setNewGroupName] = useState('');
  const [parentGroupId, setParentGroupId] = useState<string | undefined>();

  // Build group tree structure
  const buildGroupTree = (groups: GroupTreeItem[]): GroupTreeItem[] => {
    const groupMap = new Map<string, GroupTreeItem>();
    const rootGroups: GroupTreeItem[] = [];

    // Create map of all groups
    groups.forEach(group => {
      groupMap.set(group.id, { ...group, children: [] });
    });

    // Build tree structure
    groups.forEach(group => {
      const groupNode = groupMap.get(group.id)!;
      if (group.parent_id) {
        const parent = groupMap.get(group.parent_id);
        if (parent) {
          parent.children!.push(groupNode);
        } else {
          rootGroups.push(groupNode);
        }
      } else {
        rootGroups.push(groupNode);
      }
    });

    return rootGroups;
  };

  const groupTree = buildGroupTree(groups);

  const handleToggleExpanded = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleCreateSubgroup = (parentId: string) => {
    setParentGroupId(parentId);
    setIsCreateDialogOpen(true);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      await onCreateGroup(newGroupName.trim(), parentGroupId);
      setNewGroupName('');
      setParentGroupId(undefined);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  return (
    <div className="space-y-1">
      {/* All Items */}
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-100 cursor-pointer",
          !selectedGroupId && "bg-blue-50 border border-blue-200"
        )}
        onClick={() => onGroupSelect(null)}
      >
        <Folder className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium">All Items</span>
      </div>

      {/* Group Tree */}
      {groupTree.map((group) => (
        <GroupNode
          key={group.id}
          group={group}
          isSelected={selectedGroupId === group.id}
          isExpanded={expandedGroups.has(group.id)}
          onToggleExpanded={handleToggleExpanded}
          onSelect={onGroupSelect}
          onCreateSubgroup={handleCreateSubgroup}
          onEdit={onUpdateGroup}
          onDelete={onDeleteGroup}
        />
      ))}

      {/* Create Group Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {parentGroupId ? 'Create Subgroup' : 'Create Group'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateGroup();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setNewGroupName('');
                  setParentGroupId(undefined);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateGroup}>
                Create Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
