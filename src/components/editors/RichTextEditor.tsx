import React, { useRef, useMemo, useCallback, forwardRef, useState, useEffect } from 'react';
import ReactQuill, { type ReactQuillProps } from 'react-quill-new';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Code, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EditorErrorBoundary } from './EditorErrorBoundary';
import { api, CustomVariable } from '@/lib/api';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showVariables?: boolean;
  required?: boolean;
}

interface RichTextEditorRef {
  getEditor: () => ReactQuillProps['editor'] | null;
  getQuill: () => ReactQuill | null;
  focus: () => void;
  blur: () => void;
}

const getBaseMergeVariables = () => [
  // Recipient variables
  { key: '{{recipient_name}}', description: 'Recipient\'s full name' },
  { key: '{{recipient_email}}', description: 'Recipient\'s email address' },
  { key: '{{recipient_company}}', description: 'Recipient\'s company' },
  
  // Legacy recipient variables (for backward compatibility)
  { key: '{{firstName}}', description: 'Recipient\'s first name (legacy)' },
  { key: '{{lastName}}', description: 'Recipient\'s last name (legacy)' },
  { key: '{{name}}', description: 'Recipient\'s full name (legacy)' },
  { key: '{{email}}', description: 'Recipient\'s email address (legacy)' },
  { key: '{{company}}', description: 'Recipient\'s company (legacy)' },
  
  // Company/Sender variables
  { key: '{{company_name}}', description: 'Your company name' },
  { key: '{{company_email}}', description: 'Your company email' },
  { key: '{{sender_name}}', description: 'Sending account name' },
  { key: '{{sender_email}}', description: 'Sending account email' },
  
  // Campaign variables
  { key: '{{campaign_name}}', description: 'Campaign name' },
  { key: '{{campaign_subject}}', description: 'Campaign subject line' },
  { key: '{{campaign_id}}', description: 'Campaign ID' },
  
  // Date/Time variables
  { key: '{{current_date}}', description: 'Current date (e.g., January 15, 2024)' },
  { key: '{{current_year}}', description: 'Current year (e.g., 2024)' },
  { key: '{{current_month}}', description: 'Current month (e.g., January)' },
  { key: '{{current_day}}', description: 'Current day (e.g., 15)' },
  
  // Tracking variables
  { key: '{{unsubscribe_url}}', description: 'Unsubscribe link (required)' },
  { key: '{{recipient_id}}', description: 'Recipient ID for tracking' },
  
  // Legacy tracking variables
  { key: '{{unsubscribeUrl}}', description: 'Unsubscribe link (legacy)' }
];

const getCustomVariables = async (): Promise<{ key: string; description: string }[]> => {
  try {
    const customVars = await api.getCustomVariables();
    // Ensure customVars is an array before mapping
    if (!Array.isArray(customVars)) {
      // Silently handle non-array responses, don't log to console
      return [];
    }
    return customVars.map((variable: CustomVariable) => ({
      key: `{{custom_${variable.name}}}`,
      description: variable.description || `Custom variable: ${variable.name}`
    }));
  } catch (error) {
    // Silently handle errors, don't log to console
    return [];
  }
};

// Create a wrapper component that properly handles refs without findDOMNode warnings
const QuillWrapper = forwardRef<RichTextEditorRef, {
  theme: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  modules: Record<string, unknown>;
  formats: string[];
  style: React.CSSProperties;
}>((props, ref) => {
  const quillRef = useRef<ReactQuill>(null);
  
  // Expose the quill editor instance through the ref
  React.useImperativeHandle(ref, () => ({
    getEditor: () => quillRef.current?.getEditor(),
    getQuill: () => quillRef.current,
    focus: () => quillRef.current?.focus(),
    blur: () => quillRef.current?.blur(),
  }));

  // Wrap ReactQuill in a div to avoid direct DOM manipulation warnings
  return (
    <div className="quill-wrapper">
      <ReactQuill
        ref={quillRef}
        {...props}
      />
    </div>
  );
});

QuillWrapper.displayName = 'QuillWrapper';

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter your email content...',
  className = '',
  showVariables = true,
  required = false
}) => {
  const quillWrapperRef = useRef<RichTextEditorRef>(null);
  const [mergeVariables, setMergeVariables] = useState(() => getBaseMergeVariables());
  const [isLoading, setIsLoading] = useState(false);
  const [isVariablesPanelOpen, setIsVariablesPanelOpen] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const originalWarn = console.warn;
    const originalError = console.error;

    const shouldSuppress = (args: unknown[]) => {
      const first = args[0];
      return typeof first === 'string' && first.includes('findDOMNode');
    };

    console.warn = (...args) => {
      if (shouldSuppress(args)) return;
      originalWarn(...args);
    };

    console.error = (...args) => {
      if (shouldSuppress(args)) return;
      originalError(...args);
    };

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  // Load merge variables including custom variables
  useEffect(() => {
    let isMounted = true;
    
    const loadMergeVariables = async () => {
      if (isLoading) return; // Prevent multiple simultaneous calls
      
      setIsLoading(true);
      try {
        const baseVariables = getBaseMergeVariables();
        const customVariables = await getCustomVariables();
        
        if (isMounted) {
          setMergeVariables([...baseVariables, ...customVariables]);
        }
      } catch (error) {
        console.error('Error loading merge variables:', error);
        if (isMounted) {
          setMergeVariables(getBaseMergeVariables());
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMergeVariables();

    // Listen for custom event when variables are updated
    const handleCustomVariablesUpdate = () => {
      if (isMounted && !isLoading) {
        loadMergeVariables();
      }
    };

    window.addEventListener('customVariablesUpdated', handleCustomVariablesUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('customVariablesUpdated', handleCustomVariablesUpdate);
    };
  }, []); // Remove isLoading from dependencies to prevent infinite loops

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ]
    },
    clipboard: {
      matchVisual: false,
    }
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'align',
    'link', 'image'
  ];

  const insertVariable = useCallback((variable: string) => {
    if (quillWrapperRef.current) {
      const editor = quillWrapperRef.current.getEditor();
      if (editor) {
        const range = editor.getSelection();
        if (range) {
          editor.insertText(range.index, variable);
          editor.setSelection(range.index + variable.length);
        } else {
          const length = editor.getLength();
          editor.insertText(length - 1, variable);
        }
      }
    }
  }, []);

  const handleChange = useCallback((content: string) => {
    // Only call onChange if the content actually changed
    if (content !== value) {
      onChange(content);
    }
  }, [onChange, value]);

  return (
    <EditorErrorBoundary>
      <div className={`space-y-4 ${className}`}>
        <Tabs defaultValue="visual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visual">
              <Eye className="h-4 w-4 mr-2" />
              Visual Editor
            </TabsTrigger>
            <TabsTrigger value="html">
              <Code className="h-4 w-4 mr-2" />
              HTML Source
            </TabsTrigger>
          </TabsList>
        
        <TabsContent value="visual" className="mt-4">
          <div className="border rounded-lg overflow-hidden bg-card">
            <QuillWrapper
              ref={quillWrapperRef}
              theme="snow"
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              modules={modules}
              formats={formats}
              style={{ minHeight: '300px' }}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="html" className="mt-4">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="font-mono min-h-[300px]"
            rows={16}
          />
        </TabsContent>
      </Tabs>

      {showVariables && (
        <Collapsible open={isVariablesPanelOpen} onOpenChange={setIsVariablesPanelOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Merge Variables</CardTitle>
                    <CardDescription className="text-xs">
                      Click to insert variables into your content
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {mergeVariables.length} variables
                    </Badge>
                    {isVariablesPanelOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {mergeVariables.map((variable) => (
                    <Button
                      key={variable.key}
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(variable.key)}
                      className="justify-start text-xs h-8"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {variable.key}
                    </Button>
                  ))}
                </div>
                <div className="space-y-1">
                  {mergeVariables.map((variable) => (
                    <div key={variable.key} className="text-xs text-muted-foreground flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-mono">
                        {variable.key}
                      </Badge>
                      <span>{variable.description}</span>
                    </div>
                  ))}
                </div>
                {required && !value.includes('{{unsubscribeUrl}}') && value.trim() && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xs text-red-600">
                      ⚠️ Unsubscribe link {`{{unsubscribeUrl}}`} is required for compliance
                    </p>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
      </div>
    </EditorErrorBoundary>
  );
};

export default RichTextEditor;
