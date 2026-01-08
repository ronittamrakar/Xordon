import { SortableContext } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, Settings, Trash2, Edit2, Check, X } from 'lucide-react';
import { FormField, Form } from './types';
import FormFieldComponent from './FormFieldComponent';
import ColumnLayout from './ColumnLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Page Header Component with editing, collapse, delete, and settings
const PageHeader = ({
  pageField,
  pageNumber,
  isExpanded,
  onToggle,
  onDelete,
  onUpdate,
  onSelect,
  isSelected,
  fieldCount,
  onSettings,
}: {
  pageField?: FormField;
  pageNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  onUpdate?: (updates: Partial<FormField>) => void;
  onSelect?: () => void;
  isSelected?: boolean;
  fieldCount: number;
  onSettings?: () => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(pageField?.label || `Page ${pageNumber}`);

  useEffect(() => {
    setEditLabel(pageField?.label || `Page ${pageNumber}`);
  }, [pageField?.label, pageNumber]);

  const handleSaveLabel = () => {
    if (onUpdate && pageField) {
      onUpdate({ label: editLabel });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditLabel(pageField?.label || `Page ${pageNumber}`);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 cursor-pointer transition-colors rounded-t-lg',
        isSelected
          ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/30'
          : 'bg-muted/50 hover:bg-muted border-border'
      )}
      onClick={() => {
        if (!isEditing) {
          onToggle();
        }
      }}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {isEditing ? (
          <div className="flex items-center space-x-2 flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="flex-1 px-2 py-1 text-sm font-medium border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveLabel();
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
            <button
              onClick={handleSaveLabel}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-1 text-muted-foreground hover:bg-muted rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <h3 className="font-medium truncate">
              {pageField?.label || `Page ${pageNumber}`}
            </h3>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              ({fieldCount} field{fieldCount !== 1 ? 's' : ''})
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {pageField && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="p-1.5 h-7 w-7"
            title="Edit page title"
          >
            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}

        {(pageField || pageNumber === 1) && onSettings && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettings}
            className="p-1.5 h-7 w-7"
            title="Page settings"
          >
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}

        {pageField && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="p-1.5 h-7 w-7 hover:bg-destructive/10 text-destructive"
            title="Delete page"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Page Droppable Component
const PageDroppable = ({
  pageId,
  children,
  pageNumber,
}: {
  pageId: string;
  children: React.ReactNode;
  pageNumber: number;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `page-${pageId}`,
    data: {
      accepts: ['field-type', 'field'],
      pageId,
      pageNumber
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={cn('relative', isOver && 'bg-primary/5 border-primary')}
    >
      {children}
      {isOver && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-primary border-dashed rounded-lg pointer-events-none flex items-center justify-center">
          <div className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-sm font-medium">
            Drop field here
          </div>
        </div>
      )}
    </div>
  );
};

// Droppable Section Component
const DroppableSection = ({
  sectionId,
  sectionFields,
  isExpanded,
  onToggle,
  sectionField,
  isSection,
  children
}: {
  sectionId: string;
  sectionFields: FormField[];
  isExpanded: boolean;
  onToggle: () => void;
  sectionField?: FormField;
  isSection: boolean;
  children: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `section-${sectionId}`,
    data: {
      accepts: ['field-type', 'field'],
      sectionId
    }
  });

  return (
    <div
      ref={setNodeRef}
      key={sectionId}
      className={cn(
        'mb-6 border rounded-lg overflow-hidden transition-all',
        isOver ? 'border-primary bg-primary/5' : 'border-border bg-background'
      )}
    >
      {isSection && sectionField && (
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
          onClick={onToggle}
        >
          <div className="flex items-center space-x-2">
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', !isExpanded && '-rotate-90')}
            />
            <h3 className="font-medium">
              {sectionField.label || 'New Section'}
            </h3>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="p-1 h-6 w-6"
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="p-1 h-6 w-6 text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
      {isExpanded && (
        <SortableContext items={sectionFields.map(f => f.id.toString())}>
          <div className="space-y-3 p-4">
            {sectionFields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <p className="text-sm">Drop fields here or click to add</p>
              </div>
            ) : (
              children
            )}
          </div>
        </SortableContext>
      )}
    </div>
  );
};

interface FormCanvasProps {
  fields: FormField[];
  selectedFieldId: number | string | null;
  onFieldSelect: (fieldId: number | string) => void;
  onFieldDelete: (fieldId: number | string) => void;
  onFieldAdd: (fieldType: string) => void;
  onFieldUpdate: (fieldId: number | string, updates: Partial<FormField>) => void;
  onColumnFieldDelete?: (layoutFieldId: number | string, columnIndex: number, fieldId: number | string) => void;
  currentForm?: Partial<Form>;
  viewMode?: 'single' | 'pagination' | 'accordion' | 'one-step-at-a-time';
  onAddPage?: () => void;
  onPageSettings?: (pageFieldId: number | string) => void;
  designSettings?: any;
  exclusiveAccordion?: boolean;
}

export default function FormCanvas({
  fields,
  selectedFieldId,
  onFieldSelect,
  onFieldDelete,
  onFieldAdd,
  onFieldUpdate,
  onColumnFieldDelete,
  currentForm,
  viewMode = 'single',
  onAddPage,
  onPageSettings,
  designSettings = {},
  exclusiveAccordion = true,
}: FormCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'form-canvas',
    data: {
      accepts: ['field-type', 'field']
    }
  });

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']));
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set(['main']));
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Initialize all pages as expanded when fields change
  // Initialize only the first page as expanded by default (for accordion view)
  useEffect(() => {
    const pages = getPages();
    if (pages.length > 0 && expandedPages.size <= 1) { // Only set if not already manually interacted with
      setExpandedPages(new Set([pages[0].id]));
    }
  }, [fields.length === 0]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      if (exclusiveAccordion) {
        newExpanded.clear();
      }
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const togglePage = (pageId: string) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      if (exclusiveAccordion) {
        newExpanded.clear();
      }
      newExpanded.add(pageId);
    }
    setExpandedPages(newExpanded);
  };

  const handleFieldUpdate = (fieldId: number | string) => (updates: Partial<FormField>) => {
    onFieldUpdate(fieldId, updates);
  };

  const isColumnLayout = (fieldType: string) => {
    return ['layout_2col', 'layout_3col', 'layout_4col'].includes(fieldType);
  };

  const renderField = (field: FormField) => {
    if (isColumnLayout(field.field_type)) {
      return (
        <ColumnLayout
          key={field.id}
          field={field}
          isSelected={selectedFieldId === field.id}
          onSelect={() => onFieldSelect(field.id)}
          onUpdate={(updates) => onFieldUpdate(field.id, updates)}
          onDelete={() => onFieldDelete(field.id)}
          onColumnFieldDelete={onColumnFieldDelete}
          onColumnFieldSelect={onFieldSelect}
          selectedFieldId={selectedFieldId}
        />
      );
    }

    return (
      <FormFieldComponent
        key={field.id}
        field={field}
        isSelected={selectedFieldId === field.id}
        onSelect={() => onFieldSelect(field.id)}
        onDelete={() => onFieldDelete(field.id)}
        onUpdate={handleFieldUpdate(field.id)}
        designSettings={designSettings}
      />
    );
  };

  const dropZoneStyle = isOver ? {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '2px dashed rgba(59, 130, 246, 0.5)',
    borderRadius: '8px'
  } : {};

  const groupFieldsBySections = () => {
    const sections: { [key: string]: FormField[] } = {};
    let currentSection = 'main';

    fields.forEach(field => {
      if (field.field_type === 'section') {
        currentSection = `section_${field.id}`;
        sections[currentSection] = [];
      } else if (field.field_type === 'page_break') {
        currentSection = `page_${field.id}`;
        sections[currentSection] = [];
      } else {
        // Check if field has a step property (from templates)
        if (field.step) {
          const stepSection = `step_${field.step}`;
          if (!sections[stepSection]) {
            sections[stepSection] = [];
          }
          sections[stepSection].push(field);
        } else {
          if (!sections[currentSection]) {
            sections[currentSection] = [];
          }
          sections[currentSection].push(field);
        }
      }
    });

    return sections;
  };

  const getPages = () => {
    const sections = groupFieldsBySections();
    const pages: Array<{ id: string; fields: FormField[]; pageField?: FormField; label: string }> = [];

    const hasStepSections = Object.keys(sections).some(id => id.startsWith('step_'));
    const mainHasFields = (sections['main'] || []).length > 0;

    // Add main page if it has fields OR if there are no step sections (new form)
    if (mainHasFields || !hasStepSections) {
      pages.push({
        id: 'main',
        fields: sections['main'] || [],
        pageField: undefined,
        label: 'Page 1'
      });
    }

    // Add pages from page_break fields
    Object.entries(sections)
      .filter(([sectionId]) => sectionId.startsWith('page_'))
      .forEach(([sectionId, sectionFields]) => {
        const pageField = fields.find(f => String(f.id) === sectionId.replace('page_', ''));
        const pageNumber = pages.length + 1;
        pages.push({
          id: sectionId,
          fields: sectionFields,
          pageField,
          label: pageField?.label || `Page ${pageNumber}`
        });
      });

    // Add pages from step property (from templates)
    Object.entries(sections)
      .filter(([sectionId]) => sectionId.startsWith('step_'))
      .sort(([a], [b]) => {
        const stepA = parseInt(a.replace('step_', ''));
        const stepB = parseInt(b.replace('step_', ''));
        return stepA - stepB;
      })
      .forEach(([sectionId, sectionFields]) => {
        const stepNumber = parseInt(sectionId.replace('step_', ''));
        pages.push({
          id: sectionId,
          fields: sectionFields,
          pageField: undefined,
          label: `Page ${stepNumber}`
        });
      });

    return pages;
  };

  const renderFieldGroups = () => {
    const sections = groupFieldsBySections();

    if (currentForm?.type === 'multi_step' && viewMode === 'pagination') {
      const pages = getPages();
      const currentPage = pages[currentPageIndex];

      if (!currentPage) {
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No pages available</p>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <PageDroppable pageId={currentPage.id} pageNumber={currentPageIndex + 1}>
            <div className="border-2 border-border rounded-lg bg-background overflow-hidden">
              <PageHeader
                pageField={currentPage.pageField}
                pageNumber={currentPageIndex + 1}
                isExpanded={true}
                onToggle={() => { }}
                onDelete={currentPage.pageField ? () => onFieldDelete(currentPage.pageField!.id) : undefined}
                onUpdate={currentPage.pageField ? (updates) => onFieldUpdate(currentPage.pageField!.id, updates) : undefined}
                onSelect={currentPage.pageField ? () => onFieldSelect(currentPage.pageField!.id) : undefined}
                isSelected={selectedFieldId === currentPage.pageField?.id}
                fieldCount={currentPage.fields.length}
                onSettings={currentPage.pageField ? () => onPageSettings?.(currentPage.pageField!.id) : undefined}
              />

              <SortableContext items={currentPage.fields.map(f => f.id.toString())}>
                <div className="space-y-3 p-4">
                  {currentPage.fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p className="text-sm">Drag fields here to add them to this page</p>
                    </div>
                  ) : (
                    currentPage.fields.map((field) => renderField(field))
                  )}
                </div>
              </SortableContext>
            </div>
          </PageDroppable>
        </div>
      );
    }

    if (currentForm?.type === 'multi_step' && viewMode === 'one-step-at-a-time') {
      const pages = getPages();
      const currentPage = pages[currentPageIndex];

      if (!currentPage) {
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No steps available</p>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <PageDroppable pageId={currentPage.id} pageNumber={currentPageIndex + 1}>
            <div className="border-2 border-border rounded-lg bg-background overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {pages.map((_, index) => (
                        <div
                          key={index}
                          className={cn(
                            'w-2 h-2 rounded-full',
                            index === currentPageIndex
                              ? 'bg-primary'
                              : index < currentPageIndex
                                ? 'bg-green-500'
                                : 'bg-muted-foreground/30'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">
                      Step {currentPageIndex + 1} of {pages.length}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentPage.fields.length} field{currentPage.fields.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <PageHeader
                pageField={currentPage.pageField}
                pageNumber={currentPageIndex + 1}
                isExpanded={true}
                onToggle={() => { }}
                onDelete={currentPage.pageField ? () => onFieldDelete(currentPage.pageField!.id) : undefined}
                onUpdate={currentPage.pageField ? (updates) => onFieldUpdate(currentPage.pageField!.id, updates) : undefined}
                onSelect={currentPage.pageField ? () => onFieldSelect(currentPage.pageField!.id) : undefined}
                isSelected={selectedFieldId === currentPage.pageField?.id}
                fieldCount={currentPage.fields.length}
                onSettings={currentPage.pageField ? () => onPageSettings?.(currentPage.pageField!.id) : undefined}
              />

              <SortableContext items={currentPage.fields.map(f => f.id.toString())}>
                <div className="space-y-3 p-4">
                  {currentPage.fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p className="text-sm">Drag fields here to add them to this step</p>
                    </div>
                  ) : (
                    currentPage.fields.map((field) => renderField(field))
                  )}
                </div>
              </SortableContext>
            </div>
          </PageDroppable>
        </div>
      );
    }

    return Object.entries(sections).map(([sectionId, sectionFields]) => {
      const isSection = sectionId.startsWith('section_');
      const isPage = sectionId.startsWith('page_');
      const sectionField = isSection ? fields.find(f => String(f.id) === sectionId.replace('section_', '')) : null;
      const pageField = isPage ? fields.find(f => String(f.id) === sectionId.replace('page_', '')) : null;

      if (isSection && sectionField) {
        return (
          <DroppableSection
            key={sectionId}
            sectionId={sectionId}
            sectionFields={sectionFields}
            isExpanded={expandedSections.has(sectionId)}
            onToggle={() => toggleSection(sectionId)}
            sectionField={sectionField}
            isSection={true}
          >
            {sectionFields.map((field) => renderField(field))}
          </DroppableSection>
        );
      } else if (isPage && pageField) {
        const pageIndex = Object.keys(sections)
          .filter(id => id === 'main' || id.startsWith('page_'))
          .indexOf(sectionId);
        const pageNumber = pageIndex + 1;
        const isPageExpanded = expandedPages.has(sectionId);

        return (
          <div
            key={sectionId}
            data-page-id={sectionId}
            className="mb-4 border-2 border-border rounded-lg bg-background overflow-hidden"
          >
            <PageHeader
              pageField={pageField}
              pageNumber={pageNumber}
              isExpanded={isPageExpanded}
              onToggle={() => togglePage(sectionId)}
              onDelete={() => onFieldDelete(pageField.id)}
              onUpdate={(updates) => onFieldUpdate(pageField.id, updates)}
              onSelect={() => onFieldSelect(pageField.id)}
              isSelected={selectedFieldId === pageField.id}
              fieldCount={sectionFields.length}
              onSettings={() => onPageSettings?.(pageField.id)}
            />
            {isPageExpanded && (
              <SortableContext items={sectionFields.map(f => f.id.toString())}>
                <div className="space-y-3 p-4">
                  {sectionFields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p className="text-sm">Drag fields here to add them to this page</p>
                    </div>
                  ) : (
                    sectionFields.map((field) => renderField(field))
                  )}
                </div>
              </SortableContext>
            )}
          </div>
        );
      } else {
        const isMultiStep = currentForm?.type === 'multi_step';
        const isPageExpanded = expandedPages.has(sectionId);

        // Calculate the correct page number for step-based sections
        let pageNumber = 1;
        if (sectionId.startsWith('step_')) {
          pageNumber = parseInt(sectionId.replace('step_', ''));
        } else if (sectionId === 'main') {
          pageNumber = 1;
        }

        return (
          <div key={sectionId} data-page-id={sectionId} className={isMultiStep ? 'mb-4 border-2 border-border rounded-lg bg-background overflow-hidden' : ''}>
            {isMultiStep && (
              <PageHeader
                pageField={undefined}
                pageNumber={pageNumber}
                isExpanded={isPageExpanded}
                onToggle={() => togglePage(sectionId)}
                fieldCount={sectionFields.length}
                onSettings={() => {
                  onPageSettings?.(sectionId === 'main' ? 'main-page' : sectionId);
                }}
              />
            )}
            {(!isMultiStep || isPageExpanded) && (
              <SortableContext items={sectionFields.map(f => f.id.toString())}>
                <div className={cn('space-y-3', isMultiStep && 'p-4')}>
                  {sectionFields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p className="text-sm">Drag fields here to add them to this page</p>
                    </div>
                  ) : (
                    sectionFields.map((field) => renderField(field))
                  )}
                </div>
              </SortableContext>
            )}
          </div>
        );
      }
    });
  };

  const canvasStyle: React.CSSProperties = designSettings ? {
    backgroundColor: designSettings.backgroundType === 'solid' ? (designSettings.backgroundColor || '#ffffff') : 'transparent',
    backgroundImage: designSettings.backgroundType === 'image' && designSettings.backgroundImage ? `url(${designSettings.backgroundImage})` : 'none',
    backgroundSize: designSettings.backgroundSize || 'cover',
    backgroundPosition: designSettings.backgroundPosition || 'center',
    backgroundRepeat: designSettings.backgroundRepeat || 'no-repeat',
    backgroundAttachment: designSettings.backgroundAttachment || 'scroll',
    fontFamily: designSettings.fontFamily || 'Inter',
    color: designSettings.textColor || '#1f2937',
    ...dropZoneStyle,
  } : dropZoneStyle;

  return (
    <div className="relative h-full flex flex-col">
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-6 w-full"
        style={canvasStyle}
      >
        <div className="max-w-4xl mx-auto pb-20">
          {fields.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-muted-foreground">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold">No fields yet</h3>
              <p className="text-muted-foreground mt-2">Drag fields from the left panel to add them to your form.</p>
              {currentForm?.type === 'multi_step' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => onFieldAdd('page_break')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Page Break
                </Button>
              )}
            </div>
          ) : (
            renderFieldGroups()
          )}

          {fields.length > 0 && (
            <>
              {/* Submit Button */}
              <div className="mt-8 flex" style={{ justifyContent: designSettings.buttonPosition === 'center' ? 'center' : designSettings.buttonPosition === 'right' ? 'flex-end' : 'flex-start' }}>
                <button
                  type="button"
                  className="inline-flex items-center px-6 py-3 text-base font-semibold rounded-lg shadow-sm transition-all hover:opacity-90"
                  style={{
                    backgroundColor: designSettings.primaryColor || '#2563eb',
                    color: designSettings.buttonTextColor || '#ffffff',
                    borderRadius: designSettings.borderRadius === 'none' ? '0px' : designSettings.borderRadius === 'small' ? '4px' : designSettings.borderRadius === 'large' ? '16px' : designSettings.borderRadius === 'full' ? '9999px' : '8px',
                    width: designSettings.buttonPosition === 'full' ? '100%' : 'auto',
                    textAlign: designSettings.buttonTextAlign || 'center',
                  }}
                >
                  {designSettings.buttonText || 'Submit'}
                </button>
              </div>
              <div className="mt-6 text-center">
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-muted-foreground">
                  <p className="text-sm">Drag fields here to add them to your form</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {currentForm?.type === 'multi_step' && (
        <div className="absolute bottom-0 left-0 right-0 bg-background border-t px-6 py-3 z-20">
          <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
            <button
              onClick={onAddPage}
              className="inline-flex items-center space-x-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Page/Step</span>
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {viewMode === 'pagination' ? 'Navigate:' : viewMode === 'one-step-at-a-time' ? 'Steps:' : 'Pages:'}
              </span>
              <div className="flex items-center space-x-1">
                {(() => {
                  const pages = getPages();
                  if (pages.length === 0) {
                    return (
                      <span className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded-md">
                        No pages yet
                      </span>
                    );
                  }

                  if (viewMode === 'pagination' || viewMode === 'one-step-at-a-time') {
                    return (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                          disabled={currentPageIndex === 0}
                          className="px-2 py-1 text-sm bg-muted rounded-md hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          ←
                        </button>
                        <span className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md font-medium">
                          {currentPageIndex + 1}/{pages.length}
                        </span>
                        <button
                          onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
                          disabled={currentPageIndex === pages.length - 1}
                          className="px-2 py-1 text-sm bg-muted rounded-md hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          →
                        </button>
                      </div>
                    );
                  } else {
                    const allPages = getPages();
                    return allPages.map((page) => (
                      <button
                        key={page.id}
                        onClick={() => {
                          const pageElement = document.querySelector(`[data-page-id="${page.id}"]`);
                          if (pageElement) {
                            pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className="px-3 py-1 text-sm bg-muted rounded-md hover:bg-muted/80 cursor-pointer transition-colors"
                      >
                        {page.label}
                      </button>
                    ));
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
