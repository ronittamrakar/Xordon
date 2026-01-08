/**
 * File Uploader Component
 * Drag-and-drop file upload with preview and progress
 */

import React, { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  X,
  File,
  Image,
  FileTextIcon,
  Film,
  Music,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { filesApi, FileItem } from '@/services/filesApi';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  entityType?: string;
  entityId?: number;
  folder?: string;
  companyId?: number;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in bytes
  onUploadComplete?: (files: FileItem[]) => void;
  onFileRemove?: (file: FileItem) => void;
  className?: string;
  compact?: boolean;
  existingFiles?: FileItem[];
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  result?: FileItem;
}

const fileTypeIcons: Record<string, React.ElementType> = {
  image: Image,
  video: Film,
  audio: Music,
  document: FileTextIcon,
  default: File,
};

function getFileTypeIcon(mimeType: string): React.ElementType {
  if (mimeType.startsWith('image/')) return fileTypeIcons.image;
  if (mimeType.startsWith('video/')) return fileTypeIcons.video;
  if (mimeType.startsWith('audio/')) return fileTypeIcons.audio;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
    return fileTypeIcons.document;
  }
  return fileTypeIcons.default;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function FileUploader({
  entityType,
  entityId,
  folder,
  companyId,
  accept,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  onUploadComplete,
  onFileRemove,
  className,
  compact = false,
  existingFiles = [],
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const result = await filesApi.upload(file, {
        entity_type: entityType,
        entity_id: entityId,
        folder,
        company_id: companyId,
      });
      return result.data[0];
    },
    onSuccess: (result, file) => {
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === file ? { ...f, status: 'complete', progress: 100, result } : f
        )
      );

      // Invalidate files query if entity is specified
      if (entityType && entityId) {
        queryClient.invalidateQueries({ queryKey: ['files', entityType, entityId] });
      }
    },
    onError: (error: Error, file) => {
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === file ? { ...f, status: 'error', error: error.message } : f
        )
      );
    },
  });

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Validate file count
      const totalFiles = existingFiles.length + uploadingFiles.length + fileArray.length;
      if (totalFiles > maxFiles) {
        toast({
          title: 'Too many files',
          description: `Maximum ${maxFiles} files allowed`,
          variant: 'destructive',
        });
        return;
      }

      // Validate and prepare files
      const validFiles: UploadingFile[] = [];
      for (const file of fileArray) {
        // Check size
        if (file.size > maxSize) {
          toast({
            title: 'File too large',
            description: `${file.name} exceeds ${formatFileSize(maxSize)} limit`,
            variant: 'destructive',
          });
          continue;
        }

        validFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          progress: 0,
          status: 'pending',
        });
      }

      if (validFiles.length === 0) return;

      setUploadingFiles((prev) => [...prev, ...validFiles]);

      // Upload files
      const results: FileItem[] = [];
      for (const uploadFile of validFiles) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 50 } : f
          )
        );

        try {
          const result = await uploadMutation.mutateAsync(uploadFile.file);
          results.push(result);
        } catch (error) {
          // Error handled in mutation
        }
      }

      if (results.length > 0 && onUploadComplete) {
        onUploadComplete(results);
      }
    },
    [existingFiles.length, uploadingFiles.length, maxFiles, maxSize, uploadMutation, onUploadComplete, toast]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
        e.target.value = ''; // Reset input
      }
    },
    [handleFiles]
  );

  const removeUploadingFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleRemoveExisting = async (file: FileItem) => {
    try {
      await filesApi.delete(file.id);
      if (onFileRemove) {
        onFileRemove(file);
      }
      if (entityType && entityId) {
        queryClient.invalidateQueries({ queryKey: ['files', entityType, entityId] });
      }
      toast({ title: 'File removed' });
    } catch (error) {
      toast({ title: 'Failed to remove file', variant: 'destructive' });
    }
  };

  const completedFiles = uploadingFiles.filter((f) => f.status === 'complete');
  const allFiles = [...existingFiles, ...completedFiles.map((f) => f.result!).filter(Boolean)];

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg transition-colors cursor-pointer',
          isDragging ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300',
          compact ? 'p-4' : 'p-6'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
        <div className={cn('flex flex-col items-center gap-2', compact && 'flex-row')}>
          <Upload className={cn('text-gray-400', compact ? 'w-5 h-5' : 'w-8 h-8')} />
          <div className={cn('text-center', compact && 'text-left')}>
            <p className={cn('text-gray-600', compact ? 'text-sm' : 'text-base')}>
              {compact ? 'Drop files or click to upload' : 'Drag and drop files here, or click to browse'}
            </p>
            {!compact && (
              <p className="text-xs text-gray-400 mt-1">
                Max {formatFileSize(maxSize)} per file • Up to {maxFiles} files
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Uploading files */}
      {uploadingFiles.filter((f) => f.status !== 'complete').length > 0 && (
        <div className="space-y-2">
          {uploadingFiles
            .filter((f) => f.status !== 'complete')
            .map((uploadFile) => {
              const Icon = getFileTypeIcon(uploadFile.file.type);
              return (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                >
                  <Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{uploadFile.file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {uploadFile.status === 'uploading' && (
                        <>
                          <Progress value={uploadFile.progress} className="h-1 flex-1" />
                          <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        </>
                      )}
                      {uploadFile.status === 'error' && (
                        <span className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {uploadFile.error || 'Upload failed'}
                        </span>
                      )}
                      {uploadFile.status === 'pending' && (
                        <span className="text-xs text-gray-400">Waiting...</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeUploadingFile(uploadFile.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
        </div>
      )}

      {/* Uploaded files */}
      {allFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase">Uploaded Files</p>
          <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'grid-cols-2')}>
            {allFiles.map((file, index) => {
              const Icon = getFileTypeIcon(file.mime_type);
              const isImage = file.mime_type.startsWith('image/');
              // Use a combination of id and index to ensure uniqueness
              const uniqueKey = `file-${file.id}-${index}`;

              return (
                <div
                  key={uniqueKey}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg group"
                >
                  {(isImage && (file.url || file.public_url)) ? (
                    <img
                      src={file.url || file.public_url || ''}
                      alt={file.original_filename}
                      className="w-10 h-10 object-cover rounded"
                      onError={(e) => {
                        // If image fails to load, replace with Icon
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          const placeholder = document.createElement('div');
                          placeholder.className = "w-10 h-10 bg-gray-200 rounded flex items-center justify-center";
                          placeholder.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image text-gray-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;
                          parent.prepend(placeholder);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{file.original_filename}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(file.file_size)}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      onClick={() => handleRemoveExisting(file)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUploader;
