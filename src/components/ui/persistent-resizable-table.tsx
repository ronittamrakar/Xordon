import * as React from "react";
import { cn } from "@/lib/utils";
import { useResizableColumns } from "@/hooks/useResizableColumns";

interface PersistentResizableTableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  className?: string;
  tableKey: string;
  defaultColumnWidths?: { [key: string]: number };
  minWidth?: number;
  maxWidth?: number;
}

interface PersistentResizableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  className?: string;
  columnKey: string;
  resizable?: boolean;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

interface PersistentResizableTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  className?: string;
  columnKey: string;
}

// Context for table-level configuration
interface TableContextType {
  tableKey: string;
  defaultColumnWidths: { [key: string]: number };
  minWidth: number;
  maxWidth: number;
}

const TableContext = React.createContext<TableContextType | undefined>(undefined);

const useTableContext = () => {
  const context = React.useContext(TableContext);
  if (!context) {
    throw new Error("useTableContext must be used within a PersistentResizableTable");
  }
  return context;
};

// Main table component
const PersistentResizableTable = React.forwardRef<HTMLTableElement, PersistentResizableTableProps>(
  ({
    className,
    children,
    tableKey,
    defaultColumnWidths = {},
    minWidth = 50,
    maxWidth = 500,
    ...props
  }, ref) => (
    <TableContext.Provider value={{ tableKey, defaultColumnWidths, minWidth, maxWidth }}>
      <div className="relative w-full overflow-auto border border-border rounded-lg">
        <table
          ref={ref}
          className={cn("w-full caption-bottom text-sm", className)}
          {...props}
        >
          {children}
        </table>
      </div>
    </TableContext.Provider>
  ),
);
PersistentResizableTable.displayName = "PersistentResizableTable";

// Header components
const PersistentResizableTableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b bg-muted/30", className)} {...props} />
  ),
);
PersistentResizableTableHeader.displayName = "PersistentResizableTableHeader";

// Resizable table head with persistence
const PersistentResizableTableHead = React.forwardRef<HTMLTableCellElement, PersistentResizableTableHeadProps>(
  ({
    className,
    resizable = true,
    initialWidth = 150,
    minWidth: propMinWidth,
    maxWidth: propMaxWidth,
    columnKey,
    children,
    ...props
  }, ref) => {
    const { tableKey, defaultColumnWidths, minWidth: contextMinWidth, maxWidth: contextMaxWidth } = useTableContext();
    const { columnWidths, updateColumnWidth } = useResizableColumns({
      tableKey,
      defaultWidths: defaultColumnWidths,
      minWidth: propMinWidth || contextMinWidth,
      maxWidth: propMaxWidth || contextMaxWidth,
    });

    const [isResizing, setIsResizing] = React.useState(false);
    const [startX, setStartX] = React.useState(0);
    const [startWidth, setStartWidth] = React.useState(0);

    const currentWidth = columnWidths[columnKey] || initialWidth;
    const effectiveMinWidth = propMinWidth || contextMinWidth;
    const effectiveMaxWidth = propMaxWidth || contextMaxWidth;

    const handleMouseDown = (e: React.MouseEvent) => {
      if (!resizable) return;

      setIsResizing(true);
      setStartX(e.clientX);
      setStartWidth(currentWidth);

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      e.preventDefault();
      e.stopPropagation();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startX;
      const newWidth = Math.max(effectiveMinWidth, Math.min(effectiveMaxWidth, startWidth + deltaX));

      updateColumnWidth(columnKey, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    React.useEffect(() => {
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isResizing]);

    return (
      <th
        ref={ref}
        className={cn(
          "h-10 px-4 text-left align-middle font-medium text-muted-foreground relative group",
          resizable && "hover:bg-muted/30",
          isResizing && "select-none bg-muted/20",
          className,
        )}
        style={{
          width: currentWidth,
          minWidth: effectiveMinWidth,
          maxWidth: effectiveMaxWidth,
        }}
        {...props}
      >
        <div className="flex items-center justify-between h-full">
          <span className="flex-1 truncate">{children}</span>
          {resizable && (
            <div
              className={cn(
                "absolute right-0 top-0 h-full w-2 cursor-col-resize transition-colors",
                "bg-transparent hover:bg-primary/20",
                "opacity-0 group-hover:opacity-100",
                "border-r border-border/50",
                isResizing && "bg-primary/30 opacity-100",
              )}
              onMouseDown={handleMouseDown}
              title="Drag to resize column"
            />
          )}
        </div>
      </th>
    );
  },
);
PersistentResizableTableHead.displayName = "PersistentResizableTableHead";

// Body components
const PersistentResizableTableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
);
PersistentResizableTableBody.displayName = "PersistentResizableTableBody";

const PersistentResizableTableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50", className)}
      {...props}
    />
  ),
);
PersistentResizableTableRow.displayName = "PersistentResizableTableRow";

// Table cell that respects column width
const PersistentResizableTableCell = React.forwardRef<HTMLTableCellElement, PersistentResizableTableCellProps>(
  ({ className, columnKey, children, ...props }, ref) => {
    const { tableKey, defaultColumnWidths } = useTableContext();
    const { columnWidths } = useResizableColumns({
      tableKey,
      defaultWidths: defaultColumnWidths,
    });

    const width = columnWidths[columnKey];

    return (
      <td
        ref={ref}
        className={cn("py-2 px-4 align-middle", className)}
        style={{
          width: width,
          maxWidth: width,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        {...props}
      >
        <div className="truncate" title={typeof children === 'string' ? children : undefined}>
          {children}
        </div>
      </td>
    );
  },
);
PersistentResizableTableCell.displayName = "PersistentResizableTableCell";

// Utility component for table actions
const TableActions = ({
  onResetWidths,
  className,
}: {
  onResetWidths: () => void;
  className?: string;
}) => (
  <div className={cn("flex items-center justify-between p-3 bg-muted/20", className)}>
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Drag column borders to resize</span>
    </div>
    <button
      onClick={onResetWidths}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/50"
      title="Reset all column widths to default"
    >
      Reset widths
    </button>
  </div>
);

export {
  PersistentResizableTable,
  PersistentResizableTableHeader,
  PersistentResizableTableHead,
  PersistentResizableTableBody,
  PersistentResizableTableRow,
  PersistentResizableTableCell,
  TableActions,
};
