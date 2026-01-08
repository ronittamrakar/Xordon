import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webformsApi, WebForm } from '@/services/webformsApi';
import { useAuth } from '@/contexts/AuthContext';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Save,
  Eye,
  Settings,
  ArrowLeft,
  Undo2,
  Redo2,
  Play,
  Share2,
  BarChart3,
  Palette,
  Zap,
  PanelLeftClose,
  PanelRightClose,
  MoreVertical,
  Bell,
  Shield,
  Monitor,
  Code,
  UserPlus,
  Users,
  TrendingUp,
  File,
  FileTextIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Import form builder components
import {
  FieldPalette,
  getAllFieldTypes,
  FormCanvas,
  FieldSettings,
  DesignPanelSidebar,
  ThankYouPreview,
  LogicAutomationsPanel,
  FormSettingsPanel,
  ThankYouSettingsPanel,
  SharePanel,
  ResultsPanel,
} from '@/components/webforms/form-builder';
import { Form, FormField, generateUniqueId } from '@/components/webforms/form-builder/types';
import { getFieldDefaults } from '@/components/webforms/form-builder/fieldDefaults';
import { Heart, Columns } from 'lucide-react';
import { PublishSuccessModal } from '@/components/webforms/form-builder/PublishSuccessModal';

type BuilderTab = 'build' | 'setup' | 'publish' | 'results';
type BuildSubItem = 'fields' | 'design' | 'thankyou' | 'logic';

export default function WebFormBuilder() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const isNew = !id || id === 'new';

  // State
  const [formTitle, setFormTitle] = useState('Untitled Form');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<'single_step' | 'multi_step' | 'popup'>('single_step');
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');
  const [fields, setFields] = useState<FormField[]>([]);
  const [formSettings, setFormSettings] = useState<Record<string, any>>({});
  const [selectedFieldId, setSelectedFieldId] = useState<string | number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const lastSavedStateRef = useRef<string>('');

  const activeTab = (searchParams.get('tab') as BuilderTab) || 'build';
  const [activeBuildSubItem, setActiveBuildSubItem] = useState<BuildSubItem>(() => {
    const s = searchParams.get('section');
    return (s && ['fields', 'design', 'thankyou', 'logic'].includes(s)) ? (s as BuildSubItem) : 'fields';
  });
  const [activeSetupSubItem, setActiveSetupSubItem] = useState<'general' | 'confirmation' | 'notifications' | 'access-security' | 'display' | 'advanced' | 'marketplace'>(() => {
    const s = searchParams.get('section');
    return (s && ['general', 'confirmation', 'notifications', 'access-security', 'display', 'advanced', 'marketplace'].includes(s)) ? (s as any) : 'general';
  });
  const [activeResultsSubItem, setActiveResultsSubItem] = useState<'insights' | 'submissions' | 'form-files' | 'reports'>(() => {
    const s = searchParams.get('section');
    return (s && ['insights', 'submissions', 'form-files', 'reports'].includes(s)) ? (s as any) : 'submissions';
  });
  const [activePublishSubItem, setActivePublishSubItem] = useState<'share' | 'embed' | 'invite'>(() => {
    const s = searchParams.get('section');
    return (s && ['share', 'embed', 'invite'].includes(s)) ? (s as any) : 'share';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getSectionForTab = useCallback((tab: BuilderTab) => {
    if (tab === 'build') return activeBuildSubItem;
    if (tab === 'setup') return activeSetupSubItem;
    if (tab === 'publish') return activePublishSubItem;
    return activeResultsSubItem;
  }, [activeBuildSubItem, activePublishSubItem, activeResultsSubItem, activeSetupSubItem]);

  const updateUrl = useCallback((tab: BuilderTab, section?: string) => {
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    if (section) {
      params.set('section', section);
    } else {
      params.delete('section');
    }
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [location.pathname, location.search, navigate]);

  const handleTabChange = useCallback((tab: BuilderTab) => {
    const section = getSectionForTab(tab);
    updateUrl(tab, section);
  }, [getSectionForTab, updateUrl]);

  const handleSectionChange = useCallback((section: string) => {
    if (activeTab === 'build') setActiveBuildSubItem(section as BuildSubItem);
    if (activeTab === 'setup') setActiveSetupSubItem(section as typeof activeSetupSubItem);
    if (activeTab === 'publish') setActivePublishSubItem(section as typeof activePublishSubItem);
    if (activeTab === 'results') setActiveResultsSubItem(section as typeof activeResultsSubItem);
    updateUrl(activeTab, section);
  }, [activeTab, updateUrl, activePublishSubItem, activeResultsSubItem, activeSetupSubItem]);

  // Fetch form if editing
  const { data: formData, isLoading } = useQuery({
    queryKey: ['webform', id],
    queryFn: () => webformsApi.getForm(id!),
    enabled: !isNew && !!id,
  });

  // Sync tab + section from URL
  // Sync section state from URL
  useEffect(() => {
    const tab = searchParams.get('tab') as BuilderTab | null;
    const section = searchParams.get('section');

    if (tab) {
      if (tab === 'build' && section && ['fields', 'design', 'thankyou', 'logic'].includes(section)) {
        setActiveBuildSubItem(section as BuildSubItem);
      }
      if (tab === 'setup' && section && ['general', 'confirmation', 'notifications', 'access-security', 'display', 'advanced', 'marketplace'].includes(section)) {
        setActiveSetupSubItem(section as typeof activeSetupSubItem);
      }
      if (tab === 'publish' && section && ['share', 'embed', 'invite'].includes(section)) {
        setActivePublishSubItem(section as typeof activePublishSubItem);
      }
      if (tab === 'results' && section && ['submissions', 'insights', 'form-files', 'reports'].includes(section)) {
        setActiveResultsSubItem(section as typeof activeResultsSubItem);
      }
    } else {
      updateUrl(activeTab, getSectionForTab(activeTab));
    }
  }, [activeTab, getSectionForTab, searchParams, updateUrl]);

  // Initialize form data
  useEffect(() => {
    if (isLoaded) return; // Only initialize once

    if (formData?.data) {
      const data = formData.data;
      setFormTitle(data.title || 'Untitled Form');
      setFormDescription(data.description || '');
      setFormType(data.type || 'single_step');
      setFormStatus(data.status === 'published' ? 'published' : 'draft');
      // Load settings (includes design, logic, notifications, etc.)
      const settings = data.settings || {};
      setFormSettings(settings);
      // Map API fields to FormField type - preserve ALL field properties
      const mappedFields: FormField[] = (data.fields || []).map((f: any) => {
        const props = f.properties || {};
        return {
          ...f, // Spread properties from API
          ...props, // Spread properties to top level so step/options are available
          id: f.id,
          field_type: f.type || f.field_type,
          label: f.label || 'Untitled',
          // Ensure step/options are set if in props
          step: f.step || props.step,
          options: f.options || props.options,
        };
      });
      setFields(mappedFields);

      // Store initial state for comparison
      lastSavedStateRef.current = JSON.stringify({
        title: data.title || 'Untitled Form',
        description: data.description || '',
        type: data.type || 'single_step',
        status: data.status === 'published' ? 'published' : 'draft',
        fields: mappedFields,
        settings: settings
      });

      setIsLoaded(true);
    } else if (isNew) {
      const initialState = JSON.stringify({
        title: 'Untitled Form',
        description: '',
        type: 'single_step',
        status: 'draft',
        fields: [],
        settings: {}
      });
      lastSavedStateRef.current = initialState;
      setIsLoaded(true);
    }
  }, [formData, isNew, isLoaded]);

  // Save form mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Map FormField back to API format - preserve ALL field properties
      const apiFields = fields.map((f) => {
        const { field_type, ...rest } = f;
        return {
          ...rest, // Spread all properties
          type: field_type, // API expects 'type' not 'field_type'
        };
      });

      const formPayload: Partial<WebForm> = {
        title: formTitle,
        description: formDescription,
        type: formType,
        status: formStatus,
        fields: apiFields as any,
        settings: formSettings,
      };

      if (isNew) {
        return webformsApi.createForm(formPayload);
      } else {
        return webformsApi.updateForm(id!, formPayload);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['webforms'] });

      // Update the reference state after successful save to mark current state as "saved"
      const currentState = JSON.stringify({
        title: formTitle,
        description: formDescription,
        type: formType,
        status: formStatus,
        fields,
        settings: formSettings
      });
      lastSavedStateRef.current = currentState;

      setLastSavedTime(new Date());

      if (isNew && response?.data?.id) {
        navigate(`/forms/builder/${response.data.id}`, { replace: true });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save form');
    },
  });

  const handleSave = useCallback((isAutoSave = false) => {
    if (!formTitle.trim()) {
      if (!isAutoSave) toast.error('Please enter a form title');
      return;
    }
    saveMutation.mutate();
  }, [formTitle, fields, formDescription, formType, formStatus, formSettings, saveMutation]);

  // Auto-save effect
  useEffect(() => {
    if (isNew || !isLoaded || saveMutation.isPending) return;

    // Compare current state with last saved state
    const currentState = JSON.stringify({
      title: formTitle,
      description: formDescription,
      type: formType,
      status: formStatus,
      fields,
      settings: formSettings
    });

    if (currentState === lastSavedStateRef.current) return;

    const handler = setTimeout(() => {
      handleSave(true);
    }, 2000);
    return () => clearTimeout(handler);
  }, [formTitle, formDescription, formType, formStatus, fields, formSettings, isNew, isLoaded, saveMutation.isPending, handleSave]);

  // Field operations
  const addField = useCallback((fieldType: string) => {
    const defaults = getFieldDefaults(fieldType);
    const newField: FormField = {
      id: generateUniqueId(),
      field_type: fieldType,
      label: fieldType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      ...defaults,
    };
    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }, []);

  const updateField = useCallback((fieldId: string | number, updates: Partial<FormField>) => {
    setFields(prev => prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
  }, []);

  const deleteField = useCallback((fieldId: string | number) => {
    setFields(prev => prev.filter((f) => f.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  }, [selectedFieldId]);

  const duplicateField = useCallback((fieldId: string | number) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      const newField: FormField = {
        ...field,
        id: generateUniqueId(),
        label: `${field.label} (Copy)`,
      };
      const index = fields.findIndex(f => f.id === fieldId);
      const newFields = [...fields];
      newFields.splice(index + 1, 0, newField);
      setFields(newFields);
      setSelectedFieldId(newField.id);
    }
  }, [fields]);

  const addPageBreak = useCallback(() => {
    addField('page_break');
  }, [addField]);

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Handle dropping a new field from palette
    if (active.data.current?.type === 'field-type') {
      const fieldType = active.data.current.fieldType;
      addField(fieldType);
      return;
    }

    // Handle reordering existing fields
    if (active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((i) => i.id.toString() === active.id);
        const newIndex = items.findIndex((i) => i.id.toString() === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(items, oldIndex, newIndex);
        }
        return items;
      });
    }
  };

  // Update form
  const updateForm = useCallback((updates: Partial<Form>) => {
    if (updates.title !== undefined) setFormTitle(updates.title);
    if (updates.description !== undefined) setFormDescription(updates.description || '');
    if (updates.type !== undefined) setFormType(updates.type);
    if (updates.status !== undefined) setFormStatus(updates.status === 'published' ? 'published' : 'draft');
    if (updates.settings !== undefined) {
      setFormSettings(prev => ({ ...prev, ...updates.settings }));
    }
  }, []);

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  // Current form object for components - memoize to prevent unnecessary re-renders
  const currentForm = useMemo((): Partial<Form> => ({
    id: isNew ? undefined : id,
    title: formTitle,
    description: formDescription,
    type: formType,
    status: formStatus,
    fields,
    settings: formSettings,
  }), [id, isNew, formTitle, formDescription, formType, formStatus, fields, formSettings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderBuildTab = () => (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col sm:flex-row flex-1 relative h-full">
        {/* Left Sidebar - Collapsible */}
        {(activeBuildSubItem === 'fields' || activeBuildSubItem === 'design' || activeBuildSubItem === 'thankyou') && (
          <>
            {isSidebarCollapsed && (
              <div className="absolute left-4 top-3 z-10">
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded text-xs font-medium hover:bg-muted/80 transition-colors border border-border"
                >
                  <span>←</span>
                  Show {activeBuildSubItem === 'fields' ? 'Fields' : activeBuildSubItem === 'design' ? 'Design' : 'Thank You'}
                </button>
              </div>
            )}

            <aside className={`${isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-full sm:w-1/4 opacity-100'} bg-sidebar border-r border-sidebar-border overflow-hidden flex-shrink-0 relative h-full`}>
              <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {activeBuildSubItem === 'fields' ? (
                  <FieldPalette onFieldAdd={addField} onHide={() => setIsSidebarCollapsed(true)} />
                ) : activeBuildSubItem === 'design' ? (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between px-4 py-2 sticky top-0 bg-sidebar z-10 border-b border-sidebar-border">
                      <h2 className="text-sm font-semibold text-sidebar-foreground">Design</h2>
                      <button onClick={() => setIsSidebarCollapsed(true)} className="p-1 rounded hover:bg-muted/60 transition-colors" title="Hide">
                        <span className="text-muted-foreground">«</span>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <DesignPanelSidebar form={currentForm as Form} onUpdate={updateForm} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between px-4 py-2 sticky top-0 bg-sidebar z-10 border-b border-sidebar-border">
                      <h2 className="text-sm font-semibold text-sidebar-foreground">Thank You</h2>
                      <button onClick={() => setIsSidebarCollapsed(true)} className="p-1 rounded hover:bg-muted/60 transition-colors" title="Hide">
                        <span className="text-muted-foreground">«</span>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      <ThankYouSettingsPanel form={currentForm as Form} onUpdate={updateForm} />
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </>
        )}

        {/* Center - Form Canvas or Preview or Logic */}
        <main className="flex-1 overflow-hidden bg-background flex flex-col">
          <div className="flex-1 overflow-hidden">
            {activeBuildSubItem === 'thankyou' ? (
              <ThankYouPreview form={currentForm} />
            ) : activeBuildSubItem === 'logic' ? (
              <div className="h-full overflow-y-auto p-6 max-w-7xl mx-auto w-full">
                <LogicAutomationsPanel
                  form={currentForm}
                  fields={fields}
                  activeSection="logic"
                  onUpdate={updateForm}
                />
              </div>
            ) : (
              <FormCanvas
                fields={fields}
                selectedFieldId={selectedFieldId}
                onFieldSelect={setSelectedFieldId}
                onFieldDelete={deleteField}
                onFieldAdd={addField}
                onFieldUpdate={updateField}
                currentForm={currentForm}
                viewMode={(formSettings as any)?.multiStepStyle || 'accordion'}
                exclusiveAccordion={!(formSettings as any)?.allowMultipleExpand}
                onAddPage={addPageBreak}
                designSettings={activeBuildSubItem === 'design' ? formSettings?.design : undefined}
              />
            )}
          </div>
        </main>

        {/* Right Sidebar - Field Settings - Collapsible */}
        {activeBuildSubItem === 'fields' && (
          <aside className={`${isRightSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-full sm:w-1/4 opacity-100'} bg-sidebar border-l border-sidebar-border overflow-hidden flex-shrink-0 h-full`}>
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <FieldSettings
                field={selectedField}
                onUpdate={updateField}
                onDelete={deleteField}
                onHide={() => setIsRightSidebarCollapsed(true)}
              />
            </div>
          </aside>
        )}

        {isRightSidebarCollapsed && selectedFieldId && (
          <div className="absolute right-4 top-3 z-10">
            <button
              onClick={() => setIsRightSidebarCollapsed(false)}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded text-xs font-medium hover:bg-muted/80 transition-colors border border-border"
            >
              Show Field Settings →
            </button>
          </div>
        )}
      </div>

      {/* Drag Overlay - shows preview while dragging */}
      <DragOverlay>
        {activeId ? (
          <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
            {activeId}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );

  const renderSetupTab = () => (
    <div className="flex flex-1 h-full">
      <div className="flex-1 overflow-y-auto">
        <FormSettingsPanel
          form={currentForm as Form}
          onUpdate={updateForm}
          activeSubItem={activeSetupSubItem}
          onSubItemChange={setActiveSetupSubItem}
        />
      </div>
    </div>
  );

  const renderPublishTab = () => (
    <div className="flex flex-1 h-full">
      <div className="flex-1 overflow-hidden">
        <SharePanel
          form={currentForm}
          onUpdate={updateForm}
          activeSubItem={activePublishSubItem}
          onSubItemChange={setActivePublishSubItem}
          hideTabs
        />
      </div>
    </div>
  );

  const renderResultsTab = () => (
    <div className="flex flex-1 h-full">
      <div className="flex-1 overflow-hidden">
        <ResultsPanel
          form={currentForm}
          fields={fields}
          activeSubItem={activeResultsSubItem}
          onSubItemChange={setActiveResultsSubItem}
          hideTabs
        />
      </div>
    </div>
  );

  const renderLeftMiniSidebar = () => {
    const buildItems: Array<{ id: BuildSubItem; label: string; icon: any }> = [
      { id: 'fields', label: 'Fields', icon: PanelLeftClose },
      { id: 'design', label: 'Design', icon: Palette },
      { id: 'thankyou', label: 'Thank You', icon: Heart },
      { id: 'logic', label: 'Logic', icon: Zap },
    ];

    const setupItems: Array<{ id: typeof activeSetupSubItem; label: string; icon: any }> = [
      { id: 'general', label: 'General', icon: Settings },
      { id: 'confirmation', label: 'Confirm', icon: Heart },
      { id: 'notifications', label: 'Notify', icon: Bell },
      { id: 'access-security', label: 'Security', icon: Shield },
      { id: 'display', label: 'Display', icon: Monitor },
      { id: 'marketplace', label: 'Leads', icon: Users },
      { id: 'advanced', label: 'Advanced', icon: Zap },
    ];

    const publishItems: Array<{ id: typeof activePublishSubItem; label: string; icon: any }> = [
      { id: 'share', label: 'Share', icon: Share2 },
      { id: 'embed', label: 'Embed', icon: Code },
      { id: 'invite', label: 'Invite', icon: UserPlus },
    ];

    const resultsItems: Array<{ id: typeof activeResultsSubItem; label: string; icon: any }> = [
      { id: 'submissions', label: 'Submits', icon: Users },
      { id: 'insights', label: 'Insights', icon: TrendingUp },
      { id: 'form-files', label: 'Files', icon: File },
      { id: 'reports', label: 'Reports', icon: FileTextIcon },
    ];

    const items =
      activeTab === 'build'
        ? buildItems.map((i) => ({ ...i, active: activeBuildSubItem === i.id, onClick: () => handleSectionChange(i.id) }))
        : activeTab === 'setup'
          ? setupItems.map((i) => ({ ...i, active: activeSetupSubItem === i.id, onClick: () => handleSectionChange(i.id) }))
          : activeTab === 'publish'
            ? publishItems.map((i) => ({ ...i, active: activePublishSubItem === i.id, onClick: () => handleSectionChange(i.id) }))
            : resultsItems.map((i) => ({ ...i, active: activeResultsSubItem === i.id, onClick: () => handleSectionChange(i.id) }));

    return (
      <aside className="w-20 bg-sidebar border-r border-sidebar-border flex-shrink-0 h-full">
        <div className="flex flex-col items-center pt-4 space-y-7 h-full">
          <div className="flex flex-col items-center space-y-5">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className={cn(
                  'flex w-20 flex-col items-center gap-1 px-2 py-2 rounded-md transition-colors',
                  item.active
                    ? 'bg-muted text-sidebar-foreground'
                    : 'text-sidebar-foreground hover:bg-muted/60 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className={cn('text-xs leading-tight font-bold text-center break-words')}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    );
  };

  return (
    <div className="w-full h-screen bg-background flex flex-col">
      {/* Header (legacy-style) */}
      <div className="bg-background border-b border-border flex-shrink-0">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <button
                onClick={() => navigate('/forms/forms')}
                className="text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                ← Back
              </button>
              <div className="h-6 w-px bg-border hidden sm:block"></div>
              <div className="min-w-0" style={{ maxWidth: '200px' }}>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="text-sm sm:text-base font-semibold text-foreground bg-transparent border-none p-0 m-0 focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 -mx-2 -my-1 w-full truncate"
                  placeholder="Untitled Form"
                  title={formTitle}
                />
              </div>
            </div>

            {/* Tab Navigation - Center */}
            <div className="hidden lg:flex items-center overflow-visible">
              <nav className="flex items-center gap-3 min-w-max overflow-visible">
                {[
                  { id: 'build', label: 'Build', icon: Columns },
                  { id: 'setup', label: 'Setup', icon: Settings },
                  { id: 'publish', label: 'Publish', icon: Share2 },
                  { id: 'results', label: 'Results', icon: BarChart3 },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as BuilderTab)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-colors whitespace-nowrap',
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground hover:bg-muted/60'
                    )}
                  >
                    <tab.icon className="w-6 h-6" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Action Buttons - Right */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <div className="hidden lg:flex items-center space-x-2 sm:space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
                  onClick={() => {
                    if (confirm('This will replace all current fields with a template containing ALL 111 field types. Continue?')) {
                      const allTypes = getAllFieldTypes();
                      const templateFields: FormField[] = allTypes.map((typeDef) => {
                        const defaults = getFieldDefaults(typeDef.type);
                        return {
                          id: generateUniqueId(),
                          field_type: typeDef.type,
                          label: typeDef.label,
                          ...defaults,
                        };
                      });
                      setFields(templateFields);
                      toast.success(`Generated template with ${templateFields.length} fields!`);
                    }
                  }}
                >
                  Load All Fields
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isNew) {
                      toast.error('Please save your form before previewing');
                      return;
                    }
                    navigate(`/forms/preview/${id}`);
                  }}
                  disabled={isNew}
                >
                  Preview
                </Button>

                {!isNew && (
                  <span className="text-xs text-muted-foreground hidden sm:inline-block">
                    {saveMutation.isPending ? 'Saving...' : 'All changes saved'}
                  </span>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSave(false)}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    const newStatus = formStatus === 'draft' ? 'published' : 'draft';
                    setFormStatus(newStatus);
                    if (newStatus === 'published') {
                      setShowPublishModal(true);
                    }
                    // Immediately save with new status
                    setTimeout(() => saveMutation.mutate(), 0);
                  }}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Saving...' : formStatus === 'draft' ? 'Publish' : 'Unpublish'}
                </Button>
              </div>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted text-foreground border border-border">
                        {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/settings')}>Profile Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      navigate('/auth');
                    }}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 relative bg-background">
        {renderLeftMiniSidebar()}
        <div className="flex-1 relative">
          <div className={cn("absolute inset-0", activeTab === 'build' ? 'block' : 'hidden')}>
            {renderBuildTab()}
          </div>
          <div className={cn("absolute inset-0", activeTab === 'setup' ? 'block' : 'hidden')}>
            {renderSetupTab()}
          </div>
          <div className={cn("absolute inset-0", activeTab === 'publish' ? 'block' : 'hidden')}>
            {renderPublishTab()}
          </div>
          <div className={cn("absolute inset-0", activeTab === 'results' ? 'block' : 'hidden')}>
            {renderResultsTab()}
          </div>
        </div>
      </div>
      <PublishSuccessModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        formId={id || ''}
        formTitle={formTitle}
        onSetupEmail={() => {
          setShowPublishModal(false);
          updateUrl('setup', 'notifications');
        }}
        onEmbed={() => {
          setShowPublishModal(false);
          updateUrl('publish', 'embed');
        }}
      />
    </div>
  );
}

