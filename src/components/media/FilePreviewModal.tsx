import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, Trash2, X, Maximize2, ExternalLink, FileText, Image as ImageIcon, Video, Music, File } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface MediaItem {
    id: string;
    name: string;
    type: 'image' | 'video' | 'document' | 'audio' | 'spreadsheet' | 'code' | 'archive' | 'other';
    url: string;
    size: string;
    uploadedAt: string;
    folder?: string;
    originalSize: number;
    starred?: boolean;
    sharedWith?: string[];
    shared?: boolean;
    owner?: string;
}

interface FilePreviewModalProps {
    file: MediaItem | null;
    isOpen: boolean;
    onClose: () => void;
    onDownload: (file: MediaItem) => void;
    onShare: (file: MediaItem) => void;
    onDelete: (file: MediaItem) => void;
    onToggleStar: (file: MediaItem) => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
    file,
    isOpen,
    onClose,
    onDownload,
    onShare,
    onDelete,
    onToggleStar
}) => {
    if (!file) return null;

    const renderPreview = () => {
        switch (file.type) {
            case 'image':
                return (
                    <div className="relative group flex items-center justify-center p-4 bg-slate-900/50 rounded-lg overflow-hidden min-h-[300px] max-h-[60vh]">
                        <img
                            src={file.url}
                            alt={file.name}
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                    </div>
                );
            case 'video':
                return (
                    <div className="relative group bg-slate-900/50 rounded-lg overflow-hidden min-h-[300px] max-h-[60vh]">
                        <video
                            src={file.url}
                            controls
                            className="w-full h-full max-h-[60vh] rounded-sm shadow-2xl"
                        />
                    </div>
                );
            case 'audio':
                return (
                    <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 rounded-lg space-y-6">
                        <div className="p-8 bg-pink-500/10 rounded-full">
                            <Music className="w-16 h-16 text-pink-500 animate-pulse" />
                        </div>
                        <audio src={file.url} controls className="w-full max-w-md" />
                    </div>
                );
            case 'document':
                return (
                    <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 rounded-lg space-y-6">
                        <div className="p-8 bg-orange-500/10 rounded-full">
                            <FileText className="w-16 h-16 text-orange-500" />
                        </div>
                        <div className="text-center">
                            <p className="text-slate-300 mb-4">Preview not available for this document type.</p>
                            <Button variant="outline" onClick={() => window.open(file.url, '_blank')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open in New Tab
                            </Button>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 rounded-lg space-y-6">
                        <div className="p-8 bg-slate-500/10 rounded-full">
                            <File className="w-16 h-16 text-slate-400" />
                        </div>
                        <p className="text-slate-300">No preview available for this file type.</p>
                        <Button variant="outline" onClick={() => onDownload(file)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download instead
                        </Button>
                    </div>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl p-0 bg-[#0f172a] border-slate-800 overflow-hidden text-white shadow-2xl">
                <DialogHeader className="p-6 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-lg bg-slate-800 text-slate-300`}>
                                {file.type === 'image' && <ImageIcon className="w-5 h-5" />}
                                {file.type === 'video' && <Video className="w-5 h-5" />}
                                {file.type === 'document' && <FileText className="w-5 h-5" />}
                                {file.type === 'audio' && <Music className="w-5 h-5" />}
                                {file.type === 'other' && <File className="w-5 h-5" />}
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold truncate max-w-md">
                                    {file.name}
                                </DialogTitle>
                                <div className="flex items-center mt-1 space-x-3 text-sm text-slate-400">
                                    <span>{file.size}</span>
                                    <span>•</span>
                                    <span>{file.uploadedAt}</span>
                                    {file.folder && (
                                        <>
                                            <span>•</span>
                                            <Badge variant="outline" className="text-[12px] uppercase border-slate-700 text-slate-400">
                                                {file.folder}
                                            </Badge>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onToggleStar(file)}
                                className={file.starred ? "text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10" : "text-slate-400"}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`h-5 w-5 ${file.starred ? 'fill-current' : ''}`}
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                            </Button>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={onClose}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-0 border-b border-slate-800 bg-[#0f172a]">
                    {renderPreview()}
                </div>

                <DialogFooter className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between sm:justify-between w-full">
                    <div className="flex items-center space-x-2">
                        {file.shared && (
                            <Badge className="bg-slate-700 text-slate-200 border-none px-3 py-1">
                                <Share2 className="w-3 h-3 mr-1.5" />
                                Shared
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="secondary"
                            className="bg-slate-800 hover:bg-slate-700 text-white"
                            onClick={() => onShare(file)}
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                        </Button>
                        <Button
                            variant="secondary"
                            className="bg-slate-800 hover:bg-slate-700 text-white"
                            onClick={() => onDownload(file)}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </Button>
                        <Button
                            variant="destructive"
                            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20"
                            onClick={() => onDelete(file)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FilePreviewModal;
