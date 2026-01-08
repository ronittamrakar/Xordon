import { useDroppable } from '@dnd-kit/core';
import { FormField } from './types';
import { Trash2, GripVertical, Columns } from 'lucide-react';
import { cn } from '@/lib/utils';

// Fields that cannot be placed inside columns
const RESTRICTED_FIELD_TYPES = ['page_break', 'section', 'layout_2col', 'layout_3col', 'layout_4col'];

interface ColumnDropZoneProps {
  fieldId: number | string;
  columnIndex: number;
  fields: FormField[];
  onFieldDelete?: (fieldId: number | string) => void;
  onFieldSelect?: (fieldId: number | string) => void;
  selectedFieldId?: number | string | null;
}

function ColumnDropZone({ 
  fieldId, 
  columnIndex, 
  fields, 
  onFieldDelete,
  onFieldSelect,
  selectedFieldId 
}: ColumnDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${fieldId}-${columnIndex}`,
    data: {
      type: 'column',
      fieldId,
      columnIndex,
      accepts: (dragData: any) => {
        // Reject restricted field types
        if (dragData?.fieldType && RESTRICTED_FIELD_TYPES.includes(dragData.fieldType)) {
          return false;
        }
        return true;
      }
    }
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        'min-h-[80px] border-2 border-dashed rounded-lg p-2 flex flex-col gap-2 transition-all',
        isOver 
          ? 'border-primary bg-primary/10' 
          : 'border-muted-foreground/30 bg-background hover:border-primary/50 hover:bg-primary/5'
      )}
    >
      {fields.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
          <span>Drop fields here</span>
        </div>
      ) : (
        fields.map((field) => (
          <ColumnFieldItem 
            key={field.id} 
            field={field} 
            onDelete={onFieldDelete}
            onSelect={onFieldSelect}
            isSelected={selectedFieldId === field.id}
          />
        ))
      )}
    </div>
  );
}

interface ColumnFieldItemProps {
  field: FormField;
  onDelete?: (fieldId: number | string) => void;
  onSelect?: (fieldId: number | string) => void;
  isSelected?: boolean;
}

function ColumnFieldItem({ field, onDelete, onSelect, isSelected }: ColumnFieldItemProps) {
  return (
    <div 
      className={cn(
        'group relative p-2 border rounded text-xs cursor-pointer transition-all',
        isSelected 
          ? 'bg-primary/10 border-primary' 
          : 'bg-muted/50 border-border hover:border-primary/50'
      )}
      onClick={() => onSelect?.(field.id)}
    >
      <div className="flex items-center gap-1">
        <GripVertical className="h-3 w-3 text-muted-foreground cursor-move" />
        <span className="font-medium flex-1 truncate">{field.label}</span>
        {field.required ? <span className="text-destructive">*</span> : null}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(field.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-opacity"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      <span className="text-muted-foreground text-[12px]">{field.field_type}</span>
    </div>
  );
}

interface ColumnLayoutProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
  onColumnFieldDelete?: (layoutFieldId: number | string, columnIndex: number, fieldId: number | string) => void;
  onColumnFieldSelect?: (fieldId: number | string) => void;
  selectedFieldId?: number | string | null;
}

export default function ColumnLayout({
  field,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onColumnFieldDelete,
  onColumnFieldSelect,
  selectedFieldId
}: ColumnLayoutProps) {
  const colCount = field.field_type === 'layout_2col' ? 2 : field.field_type === 'layout_3col' ? 3 : 4;
  const gridClass = field.field_type === 'layout_2col' ? 'grid-cols-2' : field.field_type === 'layout_3col' ? 'grid-cols-3' : 'grid-cols-4';
  const columns = field.columns || Array(colCount).fill([]);

  const handleColumnFieldDelete = (columnIndex: number, fieldId: number | string) => {
    if (onColumnFieldDelete) {
      onColumnFieldDelete(field.id, columnIndex, fieldId);
    }
  };

  return (
    <div
      className={cn(
        'relative group bg-background border rounded-lg p-4 cursor-pointer transition-all',
        isSelected 
          ? 'border-primary shadow-md' 
          : 'border-border hover:border-muted-foreground'
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
            <Columns className="h-3 w-3 text-primary" />
          </div>
          <span className="text-sm font-medium">
            {colCount} Column Layout
          </span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-muted-foreground hover:text-destructive"
            title="Delete layout"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Columns Grid */}
      <div className={`grid ${gridClass} gap-3`}>
        {Array.from({ length: colCount }).map((_, colIndex) => (
          <ColumnDropZone
            key={colIndex}
            fieldId={field.id}
            columnIndex={colIndex}
            fields={columns[colIndex] || []}
            onFieldDelete={(fieldId) => handleColumnFieldDelete(colIndex, fieldId)}
            onFieldSelect={onColumnFieldSelect}
            selectedFieldId={selectedFieldId}
          />
        ))}
      </div>

      {/* Helper text */}
      <p className="text-[12px] text-muted-foreground mt-2 text-center">
        Drag fields into columns • Page breaks and sections not allowed
      </p>
    </div>
  );
}

export { RESTRICTED_FIELD_TYPES };
