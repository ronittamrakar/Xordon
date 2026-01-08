import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Undo2,
  Redo2,
  Sparkles,
  Settings2,
  Layers,
  Palette,
  LayoutTemplate,
  Download,
  MoreHorizontal,
  Loader2,
  Bot
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

import { BlockPalette } from '@/components/email-builder/BlockPalette';
import { BlockRenderer } from '@/components/email-builder/BlockRenderer';
import { BlockSettings } from '@/components/email-builder/BlockSettings';
import { GlobalStylesPanel } from '@/components/email-builder/GlobalStylesPanel';
import { EmailPreview } from '@/components/email-builder/EmailPreview';
import { TemplateLibrary } from '@/components/email-builder/TemplateLibrary';
import { MergeTagsPanel } from '@/components/email-builder/MergeTagsPanel';
import { SendTestEmailDialog } from '@/components/email-builder/SendTestEmailDialog';
import { generateEmailHtml } from '@/components/email-builder/htmlGenerator';
import {
  EmailBlock,
  GlobalStyles,
  BlockType,
  DEFAULT_GLOBAL_STYLES,
  DEFAULT_BLOCK_STYLE
} from '@/components/email-builder/types';

const EmailTemplateBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id && id !== 'new';

  // Template state
  const [templateName, setTemplateName] = useState('');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [globalStyles, setGlobalStyles] = useState<GlobalStyles>(DEFAULT_GLOBAL_STYLES);

  // UI state
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedNestedBlockId, setSelectedNestedBlockId] = useState<string | null>(null);
  const [leftPanel, setLeftPanel] = useState<'blocks' | 'templates' | 'styles' | 'tags'>('blocks');
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // History for undo/redo
  const [history, setHistory] = useState<{ blocks: EmailBlock[]; styles: GlobalStyles }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // AI generation state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Load template if editing
  useEffect(() => {
    if (isEditing) {
      loadTemplate();
    }
  }, [id, isEditing]);

  const loadTemplate = async () => {
    if (!id || id === 'new') return;

    setIsLoading(true);
    try {
      const data = await api.getTemplate(String(id));
      if (data) {
        setTemplateName(data.name || '');
        setSubject(data.subject || '');

        // Try to parse blocks from stored blocks data first
        let parsedBlocks = data.blocks;
        if (typeof data.blocks === 'string') {
          try {
            parsedBlocks = JSON.parse(data.blocks);
          } catch (e) {
            parsedBlocks = null;
          }
        }

        if (parsedBlocks && Array.isArray(parsedBlocks) && parsedBlocks.length > 0) {
          // Regenerate IDs to avoid conflicts
          const loadedBlocks = parsedBlocks.map((block: EmailBlock) => ({
            ...block,
            id: generateId(),
            settings: block.settings ? {
              ...block.settings,
              columns: block.settings.columns?.map((col: { width: string; content: EmailBlock[] }) => ({
                ...col,
                content: col.content?.map((nestedBlock: EmailBlock) => ({
                  ...nestedBlock,
                  id: generateId()
                })) || []
              }))
            } : undefined
          }));
          setBlocks(loadedBlocks);
        } else if (data.htmlContent) {
          // Fallback: Parse HTML content into blocks
          const parsedBlocks = parseHtmlToBlocks(data.htmlContent);
          setBlocks(parsedBlocks);
        }

        // Load global styles if available
        if (data.globalStyles) {
          let parsedStyles = data.globalStyles;
          if (typeof data.globalStyles === 'string') {
            try {
              parsedStyles = JSON.parse(data.globalStyles);
            } catch (e) {
              parsedStyles = null;
            }
          }
          if (parsedStyles && typeof parsedStyles === 'object') {
            setGlobalStyles({ ...DEFAULT_GLOBAL_STYLES, ...(parsedStyles as unknown as Partial<GlobalStyles>) });
          }
        }
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: 'Starting Fresh',
        description: 'Creating a new template',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to parse HTML content into blocks
  const parseHtmlToBlocks = (html: string): EmailBlock[] => {
    const blocks: EmailBlock[] = [];

    // Create a temporary DOM element to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    // Simple parsing - extract main content sections
    const contentDiv = body.querySelector('[style*="max-width"]') || body;

    // Get all direct children that could be blocks
    const children = contentDiv.children;

    for (let i = 0; i < children.length; i++) {
      const element = children[i] as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
        blocks.push({
          id: generateId(),
          type: 'heading',
          content: element.textContent || '',
          style: { ...DEFAULT_BLOCK_STYLE, fontSize: tagName === 'h1' ? '36px' : tagName === 'h2' ? '28px' : '24px' },
        });
      } else if (tagName === 'p' || tagName === 'div') {
        const innerHTML = element.innerHTML;
        if (innerHTML.includes('<a') && innerHTML.includes('display') && innerHTML.includes('inline-block')) {
          // Likely a button
          const link = element.querySelector('a');
          if (link) {
            blocks.push({
              id: generateId(),
              type: 'button',
              content: '',
              style: DEFAULT_BLOCK_STYLE,
              settings: {
                button: {
                  text: link.textContent || 'Click Here',
                  url: link.getAttribute('href') || '#',
                  buttonColor: '#0066cc',
                  buttonTextColor: '#ffffff',
                  buttonBorderRadius: '4px',
                  buttonPadding: '12px 24px',
                }
              }
            });
          }
        } else if (element.textContent?.trim()) {
          blocks.push({
            id: generateId(),
            type: 'text',
            content: `<p>${element.innerHTML}</p>`,
            style: DEFAULT_BLOCK_STYLE,
          });
        }
      } else if (tagName === 'img') {
        blocks.push({
          id: generateId(),
          type: 'image',
          content: '',
          style: DEFAULT_BLOCK_STYLE,
          settings: {
            image: {
              src: element.getAttribute('src') || '',
              alt: element.getAttribute('alt') || '',
              alignment: 'center',
            }
          }
        });
      } else if (tagName === 'hr') {
        blocks.push({
          id: generateId(),
          type: 'divider',
          content: '',
          style: DEFAULT_BLOCK_STYLE,
          settings: {
            dividerStyle: 'solid',
            dividerColor: '#e0e0e0',
            dividerWidth: '1px',
          }
        });
      } else if (tagName === 'ul' || tagName === 'ol') {
        const items = Array.from(element.querySelectorAll('li')).map(li => li.textContent || '');
        blocks.push({
          id: generateId(),
          type: 'list',
          content: '',
          style: DEFAULT_BLOCK_STYLE,
          settings: {
            list: {
              items,
              listType: tagName === 'ol' ? 'numbered' : 'bullet',
            }
          }
        });
      }
    }

    // If no blocks were parsed, create a single HTML block with the content
    if (blocks.length === 0 && html.trim()) {
      blocks.push({
        id: generateId(),
        type: 'html',
        content: html,
        style: DEFAULT_BLOCK_STYLE,
      });
    }

    return blocks;
  };

  const generateId = () => Math.random().toString(36).substring(2, 11);

  // Save to history
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ blocks: [...blocks], styles: { ...globalStyles } });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [blocks, globalStyles, history, historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setBlocks(prevState.blocks);
      setGlobalStyles(prevState.styles);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setBlocks(nextState.blocks);
      setGlobalStyles(nextState.styles);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  // Add block
  const handleAddBlock = useCallback((type: BlockType) => {
    const newBlock: EmailBlock = {
      id: generateId(),
      type,
      content: getDefaultContent(type),
      style: { ...DEFAULT_BLOCK_STYLE },
      settings: getDefaultSettings(type),
    };

    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    saveToHistory();
  }, [saveToHistory]);

  // Update block
  const handleUpdateBlock = useCallback((updatedBlock: EmailBlock) => {
    setBlocks(prev => prev.map(b => b.id === updatedBlock.id ? updatedBlock : b));
  }, []);

  // Delete block
  const handleDeleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
    saveToHistory();
  }, [selectedBlockId, saveToHistory]);

  // Duplicate block
  const handleDuplicateBlock = useCallback((blockId: string) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex !== -1) {
      const block = blocks[blockIndex];
      const newBlock = { ...block, id: generateId() };
      const newBlocks = [...blocks];
      newBlocks.splice(blockIndex + 1, 0, newBlock);
      setBlocks(newBlocks);
      setSelectedBlockId(newBlock.id);
      saveToHistory();
    }
  }, [blocks, saveToHistory]);

  // Move block
  const handleMoveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;

    const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    [newBlocks[blockIndex], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[blockIndex]];
    setBlocks(newBlocks);
    saveToHistory();
  }, [blocks, saveToHistory]);

  // Handle template selection from library
  const handleSelectTemplate = useCallback((templateBlocks: EmailBlock[], templateStyles: GlobalStyles) => {
    setBlocks(templateBlocks.map(b => ({ ...b, id: generateId() })));
    setGlobalStyles(templateStyles);
    saveToHistory();
    toast({
      title: 'Template Applied',
      description: 'Template has been loaded successfully',
    });
  }, [saveToHistory, toast]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData('blockType') as BlockType;
    if (blockType) {
      handleAddBlock(blockType);
    }
  }, [handleAddBlock]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Save template
  const handleSave = async () => {
    if (!templateName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a template name',
        variant: 'destructive',
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a subject line',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const htmlContent = generateEmailHtml(blocks, globalStyles, subject, preheader);

      // Prepare template data with blocks for proper restoration
      const templateData = {
        name: templateName,
        subject,
        htmlContent,
        blocks: JSON.stringify(blocks), // Store blocks as JSON string
        globalStyles: JSON.stringify(globalStyles), // Store styles as JSON string
      };

      if (isEditing) {
        await api.updateTemplate(String(id), templateData);
      } else {
        await api.createTemplate(templateData);
      }

      toast({
        title: 'Success',
        description: 'Template saved successfully',
      });
      navigate('/reach/email-templates');
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Export HTML
  const handleExportHtml = () => {
    const htmlContent = generateEmailHtml(blocks, globalStyles, subject, preheader);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName || 'email-template'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Exported',
      description: 'HTML file downloaded successfully',
    });
  };

  // AI Generation
  const handleAIGeneration = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a description',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await api.generateAiContent({
        channel: 'email',
        prompt: aiPrompt,
        action: 'draft',
        context: {
          templateName,
          existingSubject: subject,
        }
      });

      const generated = response.output;

      // Parse subject and content
      const subjectMatch = generated.match(/subject[:\s]*([^\n]+)/i);
      if (subjectMatch) {
        setSubject(subjectMatch[1].trim());
      }

      // Add generated content as a text block
      const content = generated.replace(/^subject[:\s]*[^\n]*\n*/gi, '').trim();
      if (content) {
        const newBlock: EmailBlock = {
          id: generateId(),
          type: 'text',
          content: `<p>${content.replace(/\n/g, '</p><p>')}</p>`,
          style: DEFAULT_BLOCK_STYLE,
        };
        setBlocks(prev => [...prev, newBlock]);
      }

      setAiDialogOpen(false);
      setAiPrompt('');
      saveToHistory();

      toast({
        title: 'AI Generation Complete',
        description: 'Content has been generated successfully',
      });
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate content',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  // Find nested block if selected
  const findNestedBlock = (): EmailBlock | null => {
    if (!selectedNestedBlockId) return null;
    for (const block of blocks) {
      if (block.type === 'columns' && block.settings?.columns) {
        for (const col of block.settings.columns) {
          const found = col.content?.find((b: EmailBlock) => b.id === selectedNestedBlockId);
          if (found) return found;
        }
      }
    }
    return null;
  };

  const selectedNestedBlock = findNestedBlock();
  const blockToEdit = selectedNestedBlock || selectedBlock;

  // Handle nested block update
  const handleUpdateNestedBlock = useCallback((updatedNestedBlock: EmailBlock) => {
    setBlocks(prev => prev.map(block => {
      if (block.type === 'columns' && block.settings?.columns) {
        const updatedColumns = block.settings.columns.map((col: { width: string; content: EmailBlock[] }) => ({
          ...col,
          content: col.content?.map((b: EmailBlock) =>
            b.id === updatedNestedBlock.id ? updatedNestedBlock : b
          ) || []
        }));
        return { ...block, settings: { ...block.settings, columns: updatedColumns } };
      }
      return block;
    }));
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header - Fixed height */}
        <div className="flex items-center justify-between px-4 h-14 min-h-[56px] border-b bg-background shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/reach/email-templates')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 max-w-xs">
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name..."
                className="text-lg font-semibold h-9 border-muted hover:border-primary/50 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo2 className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Generate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    AI Content Generation
                  </DialogTitle>
                  <DialogDescription>
                    Describe what you want to create and AI will generate email content for you.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Describe your email campaign goal, target audience, key points..."
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAIGeneration} disabled={isGeneratingAI}>
                    {isGeneratingAI ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportHtml}>
                  <Download className="h-4 w-4 mr-2" />
                  Export HTML
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <SendTestEmailDialog
              subject={subject}
              htmlContent={generateEmailHtml(blocks, globalStyles, subject, preheader)}
            />

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden w-full">
          {showPreview ? (
            <div className="flex-1 w-full h-full overflow-hidden">
              <EmailPreview
                blocks={blocks}
                globalStyles={globalStyles}
                subject={subject}
                preheader={preheader}
              />
            </div>
          ) : (
            <>
              {/* Left Panel - 25% width */}
              <div className="w-1/4 min-w-[280px] max-w-[360px] border-r bg-muted/30 flex flex-col">
                <div className="p-2 border-b">
                  <div className="grid grid-cols-4 gap-1">
                    <Button
                      variant={leftPanel === 'blocks' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setLeftPanel('blocks')}
                      title="Blocks"
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={leftPanel === 'templates' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setLeftPanel('templates')}
                      title="Templates"
                    >
                      <LayoutTemplate className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={leftPanel === 'styles' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setLeftPanel('styles')}
                      title="Styles"
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={leftPanel === 'tags' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setLeftPanel('tags')}
                      title="Merge Tags"
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {leftPanel === 'blocks' && <BlockPalette onAddBlock={handleAddBlock} />}
                {leftPanel === 'templates' && <TemplateLibrary onSelectTemplate={handleSelectTemplate} />}
                {leftPanel === 'styles' && <GlobalStylesPanel styles={globalStyles} onUpdate={setGlobalStyles} />}
                {leftPanel === 'tags' && <MergeTagsPanel onInsert={(tag) => {
                  // Insert tag at cursor or append to selected block
                  if (selectedBlock) {
                    const updatedBlock = {
                      ...selectedBlock,
                      content: selectedBlock.content + tag
                    };
                    handleUpdateBlock(updatedBlock);
                  }
                }} />}
              </div>

              {/* Canvas - 50% width (or more when right panel is hidden) */}
              <div className={`overflow-hidden flex flex-col ${blockToEdit ? 'w-1/2' : 'flex-1'}`}>
                {/* Subject & Preheader */}
                <div className="p-4 border-b bg-background space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Subject Line</Label>
                      <Input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Enter email subject..."
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Preheader (Preview Text)</Label>
                      <Input
                        value={preheader}
                        onChange={(e) => setPreheader(e.target.value)}
                        placeholder="Brief preview text..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Canvas */}
                <ScrollArea className="flex-1">
                  <div
                    className="p-6 min-h-full"
                    style={{ backgroundColor: globalStyles.backgroundColor }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <div
                      className="mx-auto"
                      style={{
                        maxWidth: globalStyles.contentWidth,
                        backgroundColor: globalStyles.contentBackgroundColor,
                        borderRadius: globalStyles.borderRadius,
                        fontFamily: globalStyles.fontFamily,
                        fontSize: globalStyles.fontSize,
                        color: globalStyles.textColor,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {blocks.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground border-2 border-dashed border-muted-foreground/30 rounded-lg m-4">
                          <Layers className="h-10 w-10 mx-auto mb-3 opacity-50" />
                          <p className="text-base font-medium mb-1">Start Building Your Email</p>
                          <p className="text-sm">Drag blocks from the left panel or choose a template</p>
                        </div>
                      ) : (
                        <div className="py-4">
                          {blocks.map((block, index) => (
                            <BlockRenderer
                              key={block.id}
                              block={block}
                              globalStyles={globalStyles}
                              isSelected={selectedBlockId === block.id}
                              onSelect={() => {
                                setSelectedBlockId(block.id);
                                setSelectedNestedBlockId(null);
                              }}
                              onDelete={() => handleDeleteBlock(block.id)}
                              onDuplicate={() => handleDuplicateBlock(block.id)}
                              onMoveUp={() => handleMoveBlock(block.id, 'up')}
                              onMoveDown={() => handleMoveBlock(block.id, 'down')}
                              onEdit={() => {
                                setSelectedBlockId(block.id);
                                setSelectedNestedBlockId(null);
                              }}
                              onUpdate={handleUpdateBlock}
                              onAddBlockToColumn={(columnIndex, blockType) => {
                                // Add a new block to a column
                                const newNestedBlock: EmailBlock = {
                                  id: generateId(),
                                  type: blockType,
                                  content: getDefaultContent(blockType),
                                  style: { ...DEFAULT_BLOCK_STYLE },
                                  settings: getDefaultSettings(blockType),
                                };
                                const updatedColumns = [...(block.settings?.columns || [])];
                                if (updatedColumns[columnIndex]) {
                                  updatedColumns[columnIndex] = {
                                    ...updatedColumns[columnIndex],
                                    content: [...(updatedColumns[columnIndex].content || []), newNestedBlock]
                                  };
                                  handleUpdateBlock({
                                    ...block,
                                    settings: { ...block.settings, columns: updatedColumns }
                                  });
                                }
                              }}
                              onSelectNestedBlock={(nestedBlockId) => {
                                setSelectedNestedBlockId(nestedBlockId);
                                setSelectedBlockId(block.id);
                              }}
                              selectedNestedBlockId={selectedNestedBlockId}
                              canMoveUp={index > 0}
                              canMoveDown={index < blocks.length - 1}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </div>

              {/* Right Panel - Block Settings - 25% width */}
              {blockToEdit && (
                <div className="w-1/4 min-w-[280px] max-w-[360px] border-l bg-muted/30">
                  <BlockSettings
                    block={blockToEdit}
                    onUpdate={selectedNestedBlock ? handleUpdateNestedBlock : handleUpdateBlock}
                    onClose={() => {
                      setSelectedBlockId(null);
                      setSelectedNestedBlockId(null);
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

// Helper functions
function getDefaultContent(type: BlockType): string {
  switch (type) {
    case 'text':
      return '<p>Click to edit this text block. You can add your content here.</p>';
    case 'heading':
      return 'Your Heading Here';
    case 'quote':
      return 'Add your quote here...';
    case 'footer':
      return '© 2024 Your Company. All rights reserved.';
    default:
      return '';
  }
}

function getDefaultSettings(type: BlockType): EmailBlock['settings'] {
  switch (type) {
    case 'button':
      return {
        button: {
          text: 'Click Here',
          url: '#',
          buttonColor: '#0066cc',
          buttonTextColor: '#ffffff',
          buttonBorderRadius: '4px',
          buttonPadding: '12px 24px',
        },
      };
    case 'divider':
      return {
        dividerStyle: 'solid',
        dividerColor: '#e0e0e0',
        dividerWidth: '1px',
      };
    case 'spacer':
      return {
        spacerHeight: '32px',
      };
    case 'social':
      return {
        social: [
          { platform: 'facebook', url: '#' },
          { platform: 'twitter', url: '#' },
          { platform: 'linkedin', url: '#' },
        ],
      };
    case 'list':
      return {
        list: {
          items: ['Item 1', 'Item 2', 'Item 3'],
          listType: 'bullet',
        },
      };
    case 'columns':
      return {
        columns: [
          { width: '50%', content: [] },
          { width: '50%', content: [] },
        ],
      };
    case 'menu':
      return {
        menu: {
          items: [
            { label: 'Home', url: '#' },
            { label: 'About', url: '#' },
            { label: 'Contact', url: '#' },
          ],
          orientation: 'horizontal',
        },
      };
    case 'table':
      return {
        table: {
          rows: [
            { cells: [{ content: 'Header 1' }, { content: 'Header 2' }, { content: 'Header 3' }] },
            { cells: [{ content: 'Cell 1' }, { content: 'Cell 2' }, { content: 'Cell 3' }] },
            { cells: [{ content: 'Cell 4' }, { content: 'Cell 5' }, { content: 'Cell 6' }] },
          ],
          headerRow: true,
        },
      };
    case 'countdown':
      return {
        countdown: {
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          expiredMessage: 'Offer has expired',
        },
      };
    case 'video':
      return {
        video: {
          url: '',
          thumbnail: '',
        },
      };
    case 'image':
      return {
        image: {
          src: '',
          alt: '',
          alignment: 'center',
          width: '100%',
        },
      };
    case 'hero':
      return {
        hero: {
          title: 'Your Hero Title',
          subtitle: 'Add a compelling subtitle here',
          buttonText: 'Get Started',
          buttonUrl: '#',
          backgroundColor: '#4F46E5',
        },
      };
    case 'testimonial':
      return {
        testimonial: {
          quote: 'This product changed my life! Highly recommended.',
          author: 'John Doe',
          role: 'CEO',
          company: 'Acme Corp',
          rating: 5,
        },
      };
    case 'pricing':
      return {
        pricing: {
          planName: 'Pro Plan',
          price: '$29',
          period: '/month',
          features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'],
          buttonText: 'Get Started',
          buttonUrl: '#',
          highlighted: false,
        },
      };
    case 'feature':
      return {
        feature: {
          icon: '⚡',
          title: 'Feature Title',
          description: 'Describe your amazing feature here.',
          imagePosition: 'left',
        },
      };
    case 'cta':
      return {
        cta: {
          headline: 'Ready to Get Started?',
          subheadline: 'Join thousands of happy customers today.',
          buttonText: 'Start Free Trial',
          buttonUrl: '#',
        },
      };
    case 'imageText':
      return {
        imageText: {
          imageUrl: 'https://via.placeholder.com/300x200',
          imageAlt: 'Image',
          title: 'Section Title',
          description: 'Add your description here. This layout works great for features, products, or any content that pairs well with an image.',
          buttonText: 'Learn More',
          buttonUrl: '#',
          imagePosition: 'left',
        },
      };
    case 'gallery':
      return {
        gallery: {
          images: [
            { src: 'https://via.placeholder.com/200x200', alt: 'Image 1' },
            { src: 'https://via.placeholder.com/200x200', alt: 'Image 2' },
            { src: 'https://via.placeholder.com/200x200', alt: 'Image 3' },
          ],
          columns: 3,
        },
      };
    case 'stats':
      return {
        stats: {
          stats: [
            { value: '10K+', label: 'Customers' },
            { value: '99%', label: 'Satisfaction' },
            { value: '24/7', label: 'Support' },
          ],
        },
      };
    case 'faq':
      return {
        faq: {
          items: [
            { question: 'What is your return policy?', answer: 'We offer a 30-day money-back guarantee on all purchases.' },
            { question: 'How long does shipping take?', answer: 'Standard shipping takes 3-5 business days.' },
          ],
        },
      };
    case 'signature':
      return {
        signature: {
          name: 'John Doe',
          title: 'CEO & Founder',
          company: 'Your Company',
          email: 'john@company.com',
          phone: '+1 (555) 123-4567',
        },
      };
    case 'url':
      return {
        url: {
          url: 'https://example.com',
          displayText: 'Visit Our Website',
          style: 'link',
        },
      };
    case 'calendar':
      return {
        calendar: {
          eventTitle: 'Upcoming Event',
          eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          eventTime: '2:00 PM - 4:00 PM',
          eventLocation: '123 Main Street, City',
        },
      };
    case 'map':
      return {
        map: {
          address: '123 Main Street, City, State 12345',
          directionsUrl: 'https://maps.google.com',
        },
      };
    case 'coupon':
      return {
        coupon: {
          code: 'SAVE20',
          discount: '20% OFF',
          description: 'On your first order',
          borderStyle: 'dashed',
        },
      };
    case 'rating':
      return {
        rating: {
          rating: 5,
          maxRating: 5,
          style: 'stars',
          showNumber: false,
        },
      };
    case 'progress':
      return {
        progress: {
          value: 75,
          max: 100,
          label: 'Goal Progress',
          showPercentage: true,
        },
      };
    case 'accordion':
      return {
        accordion: {
          items: [
            { title: 'Section 1', content: 'Content for section 1' },
            { title: 'Section 2', content: 'Content for section 2' },
          ],
        },
      };
    case 'iconList':
      return {
        iconList: {
          items: [
            { icon: '✓', text: 'Feature one', subtext: 'Description' },
            { icon: '✓', text: 'Feature two', subtext: 'Description' },
            { icon: '✓', text: 'Feature three', subtext: 'Description' },
          ],
          iconColor: '#10B981',
        },
      };
    case 'beforeAfter':
      return {
        beforeAfter: {
          beforeLabel: 'Before',
          afterLabel: 'After',
        },
      };
    default:
      return {};
  }
}

export default EmailTemplateBuilder;
