import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileTextIcon,
  Search,
  Plus,
  Eye,
  Star,
  Grid,
  List,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { FORM_TEMPLATES, TEMPLATE_CATEGORIES, TEMPLATE_TYPES, TEMPLATE_INDUSTRIES, FormTemplate } from '@/data/formTemplates';
import TemplatePreviewModal from '@/components/webforms/TemplatePreviewModal';
import { webformsApi } from '@/services/webformsApi';

function Combobox({
  options,
  value,
  onValueChange,
  placeholder,
  className = "w-[200px]"
}: {
  options: { id: string, name: string }[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between font-normal", className)}
        >
          {value
            ? options.find((opt) => opt.id === value)?.name
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0", className)} align="start">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No {placeholder.toLowerCase()} found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={opt.name}
                  onSelect={() => {
                    onValueChange(opt.id === value ? "" : opt.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === opt.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {opt.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
export default function WebFormsTemplates() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const folderId = searchParams.get('folder');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const filteredTemplates = FORM_TEMPLATES.filter((template) => {
    const matchesSearch =
      searchTerm === '' ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory;
    const matchesType =
      selectedType === 'all' || template.type === selectedType;
    const matchesIndustry =
      selectedIndustry === 'all' || template.industry === selectedIndustry;
    return matchesSearch && matchesCategory && matchesType && matchesIndustry;
  });

  const applyTemplate = async (template: FormTemplate) => {
    try {
      setIsCreating(true);

      const formData = {
        title: template.formData.title,
        description: template.formData.description,
        type: template.formData.type,
        status: 'draft' as const,
        folder_id: folderId ? parseInt(folderId) : null,
        fields: template.formData.fields.map((field, index) => ({
          ...field, // Preserve ALL field properties including step
          id: `field_${Date.now()}_${index}`,
          sort_order: index,
        })),
        settings: template.formData.settings || {},
      };

      const response = await webformsApi.createForm(formData);

      toast.success('Form created from template!');
      setPreviewTemplate(null);
      navigate(`/forms/builder/${response.data.id}`);
    } catch (error) {
      console.error('Error creating form from template:', error);
      toast.error('Failed to create form from template');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-end">
        <Button onClick={() => navigate('/forms/new')} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create from Scratch
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Combobox
              options={TEMPLATE_CATEGORIES}
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              placeholder="Category"
              className="w-[220px]"
            />
            <Combobox
              options={TEMPLATE_TYPES}
              value={selectedType}
              onValueChange={setSelectedType}
              placeholder="Form Type"
              className="w-[180px]"
            />
            <Combobox
              options={TEMPLATE_INDUSTRIES}
              value={selectedIndustry}
              onValueChange={setSelectedIndustry}
              placeholder="Industry"
              className="w-[180px]"
            />
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:border-primary transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {template.type === 'multi_step' ? (
                      <Layers className="h-5 w-5 text-primary" />
                    ) : (
                      <FileTextIcon className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg mt-3">{template.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{template.description}</p>

                <div className="flex flex-wrap gap-1 mb-3">
                  <Badge variant="outline" className="text-xs">
                    {template.fields} fields
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {template.type.replace('_', ' ')}
                  </Badge>
                  {template.industry && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {template.industry.replace('-', ' ')}
                    </Badge>
                  )}
                </div>


                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => applyTemplate(template)}
                    disabled={isCreating}
                  >
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {template.type === 'multi_step' ? (
                        <Layers className="h-5 w-5 text-primary" />
                      ) : (
                        <FileTextIcon className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{template.name}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {template.fields} fields
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {template.type.replace('_', ' ')}
                        </Badge>
                        {template.industry && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {template.industry.replace('-', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setPreviewTemplate(template)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button onClick={() => applyTemplate(template)} disabled={isCreating}>
                        Use Template
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileTextIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No templates found</h3>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search or filter criteria.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUseTemplate={applyTemplate}
      />
    </div>
  );
}

