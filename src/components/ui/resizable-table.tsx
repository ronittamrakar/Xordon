import * as React from "react";
import { cn } from "@/lib/utils";

interface ResizableTableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  className?: string;
}

interface ResizableTableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
  className?: string;
}

interface ResizableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  className?: string;
  resizable?: boolean;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

interface ResizableTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  className?: string;
}

interface ResizableTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  className?: string;
  width?: number;
}

interface ResizableTableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
  className?: string;
}

// Context for managing column widths
interface ColumnWidthContextType {
  columnWidths: { [key: string]: number };
  setColumnWidth: (key: string, width: number) => void;
  registerColumn: (key: string, initialWidth: number) => void;
}

const ColumnWidthContext = React.createContext<ColumnWidthContextType | undefined>(undefined);

const useColumnWidth = () => {
  const context = React.useContext(ColumnWidthContext);
  if (!context) {
    throw new Error("useColumnWidth must be used within a ResizableTableProvider");
  }
  return context;
};

const ResizableTableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [columnWidths, setColumnWidths] = React.useState<{ [key: string]: number }>({});

  const setColumnWidth = React.useCallback((key: string, width: number) => {
    setColumnWidths(prev => ({ ...prev, [key]: width }));
  }, []);

  const registerColumn = React.useCallback((key: string, initialWidth: number) => {
    setColumnWidths(prev => {
      if (prev[key] === undefined) {
        return { ...prev, [key]: initialWidth };
      }
      return prev;
    });
  }, []);

  return (
    <ColumnWidthContext.Provider value={{ columnWidths, setColumnWidth, registerColumn }}>
      {children}
    </ColumnWidthContext.Provider>
  );
};

const ResizableTable = React.forwardRef<HTMLTableElement, ResizableTableProps>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <ResizableTableProvider>
        <table
          ref={ref}
          className={cn("w-full caption-bottom text-sm", className)}
          {...props}
        />
      </ResizableTableProvider>
    </div>
  ),
);
ResizableTable.displayName = "ResizableTable";

const ResizableTableHeader = React.forwardRef<HTMLTableSectionElement, ResizableTableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  ),
);
ResizableTableHeader.displayName = "ResizableTableHeader";

const ResizableTableHead = React.forwardRef<HTMLTableCellElement, ResizableTableHeadProps>(
  ({
    className,
    resizable = true,
    initialWidth = 150,
    minWidth = 50,
    maxWidth = 500,
    style,
    children,
    ...props
  }, ref) => {
    const { columnWidths, setColumnWidth, registerColumn } = useColumnWidth();
    const columnKey = React.useMemo(() => `col-${Math.random().toString(36).substr(2, 9)}`, []);
    const [isResizing, setIsResizing] = React.useState(false);
    const [startX, setStartX] = React.useState(0);
    const [startWidth, setStartWidth] = React.useState(0);

    React.useEffect(() => {
      registerColumn(columnKey, initialWidth);
    }, [columnKey, initialWidth, registerColumn]);

    const currentWidth = columnWidths[columnKey] || initialWidth;

    const handleMouseDown = (e: React.MouseEvent) => {
      if (!resizable) return;

      setIsResizing(true);
      setStartX(e.clientX);
      setStartWidth(currentWidth);

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startX;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));

      setColumnWidth(columnKey, newWidth);
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
          "h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 relative group",
          resizable && "cursor-col-resize",
          isResizing && "select-none",
          className,
        )}
        style={{
          ...style,
          width: currentWidth,
          minWidth: minWidth,
          maxWidth: maxWidth,
        }}
        {...props}
      >
        <div className="flex items-center justify-between h-full">
          <span className="flex-1 truncate">{children}</span>
          {resizable && (
            <div
              className={cn(
                "absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-primary/20 transition-colors",
                "opacity-0 group-hover:opacity-100",
                isResizing && "bg-primary/30 opacity-100",
              )}
              onMouseDown={handleMouseDown}
            />
          )}
        </div>
      </th>
    );
  },
);
ResizableTableHead.displayName = "ResizableTableHead";

const ResizableTableBody = React.forwardRef<HTMLTableSectionElement, ResizableTableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
);
ResizableTableBody.displayName = "ResizableTableBody";

const ResizableTableRow = React.forwardRef<HTMLTableRowElement, ResizableTableRowProps>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50", className)}
      {...props}
    />
  ),
);
ResizableTableRow.displayName = "ResizableTableRow";

const ResizableTableCell = React.forwardRef<HTMLTableCellElement, ResizableTableCellProps>(
  ({ className, width, style, children, ...props }, ref) => (
    <td
      ref={ref}
      className={cn("py-2 px-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
      style={{
        ...style,
        width: width,
        maxWidth: width,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      {...props}
    >
      <div className="truncate">
        {children}
      </div>
    </td>
  ),
);
ResizableTableCell.displayName = "ResizableTableCell";

export {
  ResizableTable,
  ResizableTableHeader,
  ResizableTableHead,
  ResizableTableBody,
  ResizableTableRow,
  ResizableTableCell,
};
