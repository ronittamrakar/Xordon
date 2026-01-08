import { useState, useEffect, useRef } from 'react';
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Upload, FileTextIcon, Shield, Award, Camera, Trash2, Eye, Check, X,
  AlertCircle, Clock, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import {
  getMyDocuments,
  uploadDocument,
  deleteDocument,
  getVerificationStatus,
  adminGetDocuments,
  adminUpdateDocument,
  adminGetPendingProviders,
  adminApproveProvider,
  ProviderDocument,
  VerificationStatus
} from '@/services/leadMarketplaceApi';

const documentTypeLabels: Record<string, { label: string; icon: any; description: string }> = {
  license: { label: 'Business License', icon: FileTextIcon, description: 'Your business or professional license' },
  insurance: { label: 'Insurance Certificate', icon: Shield, description: 'Proof of liability insurance' },
  certification: { label: 'Certification', icon: Award, description: 'Professional certifications or credentials' },
  portfolio: { label: 'Portfolio', icon: Camera, description: 'Photos of your work' },
  background_check: { label: 'Background Check', icon: Shield, description: 'Background check results' },
  identity: { label: 'ID Verification', icon: FileTextIcon, description: 'Government-issued ID' },
  other: { label: 'Other Document', icon: FileTextIcon, description: 'Other supporting documents' },
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'pending': return <Clock className="w-4 h-4" />;
    case 'approved': return <CheckCircle className="w-4 h-4" />;
    case 'rejected': return <XCircle className="w-4 h-4" />;
    case 'expired': return <AlertCircle className="w-4 h-4" />;
    default: return null;
  }
};

// Document Card Component
const DocumentCard = ({ doc, onDelete, isAdmin = false, onModerate }: {
  doc: ProviderDocument;
  onDelete?: (id: number) => void;
  isAdmin?: boolean;
  onModerate?: (id: number, status: string, notes?: string) => void;
}) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const typeInfo = documentTypeLabels[doc.document_type] || documentTypeLabels.other;
  const TypeIcon = typeInfo.icon;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <TypeIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium truncate">{doc.name}</h4>
              <Badge className={statusColors[doc.status]}>
                <StatusIcon status={doc.status} />
                <span className="ml-1 capitalize">{doc.status}</span>
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{typeInfo.label}</p>
            {doc.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{doc.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
              {doc.file_size && <span>{(doc.file_size / 1024).toFixed(1)} KB</span>}
              {doc.expires_at && <span>Expires: {new Date(doc.expires_at).toLocaleDateString()}</span>}
            </div>
            {doc.review_notes && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <strong>Review notes:</strong> {doc.review_notes}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                <Eye className="w-4 h-4" />
              </a>
            </Button>
            {!isAdmin && doc.status !== 'approved' && onDelete && (
              <Button size="sm" variant="outline" onClick={() => onDelete(doc.id)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>

        {isAdmin && doc.status === 'pending' && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <Textarea
              placeholder="Add review notes (optional)"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="h-20"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onModerate?.(doc.id, 'approved', reviewNotes)}>
                <Check className="w-4 h-4 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onModerate?.(doc.id, 'rejected', reviewNotes)}>
                <X className="w-4 h-4 mr-1" /> Reject
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Upload Dialog Component
const UploadDialog = ({ open, onOpenChange, onUploaded }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: () => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('license');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!name) setName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('document_type', documentType);
      formData.append('name', name || selectedFile.name);
      if (description) formData.append('description', description);
      if (expiresAt) formData.append('expires_at', expiresAt);

      const res = await uploadDocument(formData);
      if (res.data.success) {
        toast.success(res.data.message || 'Document uploaded');
        onUploaded();
        onOpenChange(false);
        resetForm();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setDocumentType('license');
    setName('');
    setDescription('');
    setExpiresAt('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload verification documents to build trust with customers
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(documentTypeLabels).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {documentTypeLabels[documentType]?.description}
            </p>
          </div>

          <div>
            <Label>File</Label>
            <div
              className="mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                onChange={handleFileSelect}
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileTextIcon className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, or images up to 10MB
                  </p>
                </>
              )}
            </div>
          </div>

          <div>
            <Label>Document Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Business License 2024"
            />
          </div>

          <div>
            <Label>Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details about this document"
              className="h-20"
            />
          </div>

          <div>
            <Label>Expiration Date (Optional)</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Upload Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Provider Documents Page
export function ProviderDocuments() {
  const [documents, setDocuments] = useState<ProviderDocument[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docsRes, statusRes] = await Promise.all([
        getMyDocuments(),
        getVerificationStatus()
      ]);
      if (docsRes.data.success) setDocuments(docsRes.data.data);
      if (statusRes.data.success) setVerificationStatus(statusRes.data.data);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteDocument(id);
      toast.success('Document deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MarketplaceNav />
      {/* Verification Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Verification Status
          </CardTitle>
          <CardDescription>
            Complete your verification to build trust with customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Verification Progress</span>
                <span className="text-sm text-muted-foreground">
                  {verificationStatus?.verification_progress || 0}%
                </span>
              </div>
              <Progress value={verificationStatus?.verification_progress || 0} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                {verificationStatus?.has_license ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                <span className="text-sm">License</span>
              </div>
              <div className="flex items-center gap-2">
                {verificationStatus?.insurance_verified ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                <span className="text-sm">Insurance</span>
              </div>
              <div className="flex items-center gap-2">
                {verificationStatus?.background_checked ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-400" />
                )}
                <span className="text-sm">Background</span>
              </div>
              <div className="flex items-center gap-2">
                {verificationStatus?.provider_status === 'active' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500" />
                )}
                <span className="text-sm capitalize">{verificationStatus?.provider_status}</span>
              </div>
            </div>

            {verificationStatus?.missing_documents && verificationStatus.missing_documents.length > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Missing documents:
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {verificationStatus.missing_documents.map((doc) => (
                    <li key={doc}>• {documentTypeLabels[doc]?.label || doc}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">My Documents</h2>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="w-4 h-4 mr-2" /> Upload Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileTextIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No documents uploaded yet</p>
            <p className="text-sm">Upload your business documents to get verified</p>
            <Button className="mt-4" onClick={() => setUploadOpen(true)}>
              <Upload className="w-4 h-4 mr-2" /> Upload Your First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={fetchData}
      />
    </div>
  );
}

// Admin Documents Moderation Page
export function AdminDocumentsModeration() {
  const [documents, setDocuments] = useState<ProviderDocument[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchDocuments();
  }, [activeTab]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await adminGetDocuments({ status: activeTab !== 'all' ? activeTab : undefined });
      if (res.data.success) {
        setDocuments(res.data.data);
        setCounts(res.data.counts);
      }
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (id: number, status: string, notes?: string) => {
    try {
      await adminUpdateDocument(id, { status, review_notes: notes });
      toast.success(`Document ${status}`);
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to update document');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Verification</CardTitle>
          <CardDescription>Review and approve provider documents</CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending {counts.pending ? `(${counts.pending})` : ''}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {loading ? (
            <>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileTextIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No {activeTab} documents</p>
              </CardContent>
            </Card>
          ) : (
            documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                isAdmin={true}
                onModerate={handleModerate}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProviderDocuments;

