import React, { useState, useRef } from 'react';
import { Upload, Link2, Image as ImageIcon, X, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  trigger?: React.ReactNode;
}

// Stock image placeholders for demo
const STOCK_IMAGES = [
  { url: 'https://via.placeholder.com/600x300/0066cc/ffffff?text=Hero+Banner', label: 'Hero Banner' },
  { url: 'https://via.placeholder.com/600x400/4caf50/ffffff?text=Product+Image', label: 'Product' },
  { url: 'https://via.placeholder.com/300x300/ff6b6b/ffffff?text=Square', label: 'Square' },
  { url: 'https://via.placeholder.com/600x200/9c27b0/ffffff?text=Wide+Banner', label: 'Wide Banner' },
  { url: 'https://via.placeholder.com/200x60/333333/ffffff?text=Logo', label: 'Logo' },
  { url: 'https://via.placeholder.com/400x400/ff9800/ffffff?text=Feature', label: 'Feature' },
  { url: 'https://via.placeholder.com/600x350/2196f3/ffffff?text=Blog+Header', label: 'Blog Header' },
  { url: 'https://via.placeholder.com/300x200/e91e63/ffffff?text=Thumbnail', label: 'Thumbnail' },
];

export const ImageUploader: React.FC<ImageUploaderProps> = ({ value, onChange, trigger }) => {
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an image URL',
        variant: 'destructive',
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
    } catch {
      toast({
        title: 'Error',
        description: 'Please enter a valid URL',
        variant: 'destructive',
      });
      return;
    }

    onChange(urlInput);
    setOpen(false);
    toast({
      title: 'Success',
      description: 'Image URL set successfully',
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Convert to base64 for preview (in production, you'd upload to a server)
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setPreviewUrl(dataUrl);
        
        // In a real app, you'd upload to a server and get back a URL
        // For now, we'll use the data URL (not recommended for production)
        toast({
          title: 'Note',
          description: 'For production, upload images to a CDN. Using preview URL for demo.',
        });
        
        onChange(dataUrl);
        setIsLoading(false);
        setOpen(false);
      };
      reader.onerror = () => {
        toast({
          title: 'Error',
          description: 'Failed to read image file',
          variant: 'destructive',
        });
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process image',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleStockSelect = (url: string) => {
    onChange(url);
    setOpen(false);
    toast({
      title: 'Success',
      description: 'Stock image selected',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full gap-2">
            <ImageIcon className="h-4 w-4" />
            {value ? 'Change Image' : 'Add Image'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Image</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="url" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="url" className="gap-1">
              <Link2 className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-1">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="stock" className="gap-1">
              <ImageIcon className="h-4 w-4" />
              Stock
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="space-y-4 mt-4">
            <div>
              <Label>Image URL</Label>
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="mt-1"
              />
            </div>
            
            {urlInput && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <Label className="text-xs text-muted-foreground">Preview</Label>
                <div className="mt-2 flex justify-center">
                  <img 
                    src={urlInput} 
                    alt="Preview" 
                    className="max-h-48 max-w-full rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            
            <Button onClick={handleUrlSubmit} className="w-full">
              <Check className="h-4 w-4 mr-2" />
              Use This URL
            </Button>
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-4 mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div 
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Processing image...</p>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </>
              )}
            </div>
            
            {previewUrl && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">Uploaded Preview</Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setPreviewUrl(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-center">
                  <img 
                    src={previewUrl} 
                    alt="Uploaded preview" 
                    className="max-h-48 max-w-full rounded"
                  />
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="stock" className="mt-4">
            <div className="grid grid-cols-4 gap-2">
              {STOCK_IMAGES.map((img, index) => (
                <button
                  key={index}
                  onClick={() => handleStockSelect(img.url)}
                  className="relative aspect-video rounded-lg overflow-hidden border hover:border-primary transition-colors group"
                >
                  <img 
                    src={img.url} 
                    alt={img.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-medium">{img.label}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              These are placeholder images. Replace with your own images for production.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploader;
