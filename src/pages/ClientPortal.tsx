import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, Send, Download, CheckCircle, Clock, MessageSquare, BookOpen, Ticket as TicketIcon, AlertCircle, Plus, LayoutDashboard, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import clientPortalApi from '@/services/clientPortalApi';
import ticketsApi from '@/services/ticketsApi';
import { coursesApi } from '@/services/coursesApi';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ClientPortal: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [messageText, setMessageText] = useState('');

  // Queries
  const { data: documents = [] } = useQuery({
    queryKey: ['portal-documents'],
    queryFn: () => clientPortalApi.listDocuments(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['portal-messages'],
    queryFn: () => clientPortalApi.listMessages(),
  });

  const { data: ticketsData = [] } = useQuery({
    queryKey: ['portal-tickets', user?.email],
    queryFn: () => ticketsApi.list({ requester_email: user?.email || '' }),
    enabled: !!user?.email,
  });

  const tickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData as any)?.data || [];

  const { data: courses = [] } = useQuery({
    queryKey: ['portal-courses'],
    queryFn: () => coursesApi.getCourses({ status: 'published' }),
  });

  // Mutations
  const signMutation = useMutation({
    mutationFn: ({ id, signature }: { id: number; signature: any }) => clientPortalApi.signDocument(id, signature),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-documents'] });
      toast.success('Document signed');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (data: any) => clientPortalApi.uploadDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-documents'] });
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      toast.success('Document uploaded');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: { message: string }) => clientPortalApi.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-messages'] });
      setMessageText('');
      toast.success('Message sent');
    },
  });

  const handleUpload = () => {
    if (!uploadFile || !uploadTitle) {
      toast.error('Please select a file and enter a title');
      return;
    }
    // API seems to expect Partial<PortalDocument>, which might be JSON or FormData depending on backend implementation.
    // Based on previous code, it was sending Partial<PortalDocument> object.
    uploadMutation.mutate({
      title: uploadTitle,
      file_url: 'placeholder', // Real upload logic would handle file storage first
      file_name: uploadFile.name,
      file_type: uploadFile.type,
      file_size: uploadFile.size,
    });
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      toast.error('Please enter a message');
      return;
    }
    sendMessageMutation.mutate({ message: messageText });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Signed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-none shadow-none bg-transparent">
        <CardHeader className="flex flex-row items-center justify-between pb-6 px-0">
          <div>
            <CardTitle className="text-2xl font-bold">Client Hub</CardTitle>
            <CardDescription className="text-lg">Your central dashboard for communication, documents, and learning</CardDescription>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <Button onClick={() => navigate('/portal/tickets/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Get Support
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-8 p-1 bg-muted/40 rounded-xl w-full justify-start md:w-auto h-auto">
          <TabsTrigger value="dashboard" className="gap-2 px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"><LayoutDashboard className="h-4 w-4" />Dashboard</TabsTrigger>
          <TabsTrigger value="documents" className="gap-2 px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"><FileText className="h-4 w-4" />Documents</TabsTrigger>
          <TabsTrigger value="tickets" className="gap-2 px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"><TicketIcon className="h-4 w-4" />Support</TabsTrigger>
          <TabsTrigger value="courses" className="gap-2 px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"><GraduationCap className="h-4 w-4" />Learning</TabsTrigger>
          <TabsTrigger value="messages" className="gap-2 px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"><MessageSquare className="h-4 w-4" />Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100/50 dark:border-blue-900/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between text-blue-700 dark:text-blue-300">
                  Active Tickets
                  <TicketIcon className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tickets.filter((t: any) => t.status !== 'closed').length}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Pending support requests</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-100/50 dark:border-emerald-900/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between text-emerald-700 dark:text-emerald-300">
                  Documents
                  <FileText className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documents.length}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Contracts & Invoices</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50/50 to-fuchsia-50/50 dark:from-purple-950/20 dark:to-fuchsia-950/20 border-purple-100/50 dark:border-purple-900/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between text-purple-700 dark:text-purple-300">
                  Courses
                  <GraduationCap className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courses.length}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Enrolled programs</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/5">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Stay updated on your latest items</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {tickets.slice(0, 3).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-all cursor-pointer group" onClick={() => navigate(`/portal/tickets/${t.ticket_number}`)}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <TicketIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-semibold">{t.subject}</p>
                        <p className="text-sm text-muted-foreground font-medium">Ticket #{t.ticket_number} • {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800">{t.status}</Badge>
                  </div>
                ))}
                {documents.slice(0, 3).map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-semibold">{d.title}</p>
                        <p className="text-sm text-muted-foreground font-medium">{d.file_type?.toUpperCase()} • {format(new Date(d.uploaded_at), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <Download className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-0">
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/5">
              <CardTitle>Documents</CardTitle>
              <CardDescription>Shared documents and e-signatures</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {documents.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="h-10 w-10 opacity-20" />
                  </div>
                  <p className="text-lg font-medium">No documents yet</p>
                  <Button onClick={() => setIsUploadOpen(true)} className="mt-6" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First Document
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-5 border rounded-xl hover:shadow-sm transition-all bg-card">
                      <div className="flex items-start gap-5 flex-1">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center border border-blue-100/50 dark:border-blue-900/30 text-blue-600 dark:text-blue-400">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1.5">
                            <h4 className="font-bold text-lg">{doc.title}</h4>
                            {doc.requires_signature && getStatusBadge(doc.signature_status)}
                          </div>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground font-medium">
                            <span className="bg-muted/50 px-2 py-0.5 rounded uppercase text-[12px] tracking-wider">{doc.file_type || 'PDF'}</span>
                            <span className="flex items-center gap-1.5"><LayoutDashboard className="h-3 w-3" />{formatFileSize(doc.file_size)}</span>
                            <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{format(new Date(doc.uploaded_at), 'MMM d, yyyy')}</span>
                          </div>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-1 italic">"{doc.description}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-all">
                          <Download className="h-5 w-5" />
                        </Button>
                        {doc.requires_signature && doc.signature_status === 'pending' && (
                          <Button
                            size="sm"
                            className="rounded-lg shadow-sm"
                            onClick={() => signMutation.mutate({ id: doc.id, signature: 'signed' })}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Sign Now
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-0">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/5">
              <div>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>Need help? View and manage your support requests.</CardDescription>
              </div>
              <Button onClick={() => navigate('/portal/tickets/new')} className="rounded-lg">
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {tickets.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <TicketIcon className="h-10 w-10 opacity-20" />
                    </div>
                    <p className="text-lg font-medium">You don't have any support tickets yet</p>
                    <Button onClick={() => navigate('/portal/tickets/new')} variant="outline" className="mt-6">Create New Ticket</Button>
                  </div>
                ) : (
                  tickets.map((t: any) => (
                    <div key={t.id} className="p-5 border rounded-xl hover:shadow-md transition-all cursor-pointer group bg-card" onClick={() => navigate(`/portal/tickets/${t.ticket_number}`)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2.5">
                            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">#{t.ticket_number}</span>
                            <Badge variant="outline" className="capitalize text-[12px] tracking-wide font-bold px-2.5 py-0.5 border-primary/20 text-primary">{t.status}</Badge>
                            <Badge variant="secondary" className="capitalize text-[12px] px-2 py-0.5">{t.priority}</Badge>
                          </div>
                          <h4 className="font-bold text-xl group-hover:text-primary transition-colors">{t.subject}</h4>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{t.description}</p>
                          <div className="flex items-center gap-6 text-xs text-muted-foreground mt-5 font-medium">
                            <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />Created {format(new Date(t.created_at), 'MMM d, yyyy')}</span>
                            <span className="flex items-center gap-1.5"><MessageSquare className="h-3 w-3" />{t.message_count || 0} messages</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="mt-0">
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/5">
              <CardTitle>Learning Center</CardTitle>
              <CardDescription>Access your training programs and courses.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.length === 0 ? (
                  <div className="col-span-full text-center py-16 text-muted-foreground">
                    <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <GraduationCap className="h-10 w-10 opacity-20" />
                    </div>
                    <p className="text-lg font-medium">No courses available yet</p>
                  </div>
                ) : (
                  courses.map((course: any) => (
                    <Card key={course.id} className="overflow-hidden border-2 border-transparent hover:border-primary/20 hover:shadow-xl transition-all cursor-pointer group rounded-2xl" onClick={() => navigate(`/courses/${course.id}`)}>
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt={course.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                            <BookOpen className="h-12 w-12 opacity-40" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-black/60 backdrop-blur-md text-white border-none hover:bg-black/70 capitalize px-3 py-1 rounded-lg text-[12px] font-bold tracking-wider">{course.level}</Badge>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                          <div className="flex items-center gap-3 text-white/90 text-[12px] font-bold">
                            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{course.duration || 'Flexible'}</span>
                            <span className="flex items-center gap-1.5 font-bold text-primary-foreground bg-primary/90 px-2 py-0.5 rounded">{course.lessons_count || 0} Lessons</span>
                          </div>
                        </div>
                      </div>
                      <CardHeader className="p-5 pb-2">
                        <CardTitle className="text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">{course.title}</CardTitle>
                        <CardDescription className="line-clamp-2 text-sm mt-1 leading-relaxed h-10">{course.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-5 pt-2">
                        <Button className="w-full mt-2 rounded-xl h-10 font-bold group-hover:shadow-lg transition-all" variant="secondary">Resume Course</Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="mt-0">
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/5">
              <CardTitle>Messages</CardTitle>
              <CardDescription>Communication with your team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Message List */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="h-10 w-10 opacity-20" />
                    </div>
                    <p className="text-lg font-medium">No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${msg.direction === 'outbound'
                        ? 'bg-primary text-primary-foreground ml-auto rounded-tr-none border-none'
                        : 'bg-muted/50 mr-auto rounded-tl-none border border-muted/20'
                        }`}
                    >
                      <div className={`flex items-center gap-3 mb-2 ${msg.direction === 'outbound' ? 'flex-row-reverse' : ''}`}>
                        <span className="font-bold text-[12px] uppercase tracking-wider opacity-60">
                          {msg.direction === 'outbound' ? 'You' : 'Team'}
                        </span>
                        {!msg.read && msg.direction === 'inbound' && (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                        <span className="text-[12px] opacity-60 font-medium">
                          {format(new Date(msg.created_at), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed font-medium">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="border-t pt-6 bg-card rounded-b-xl">
                <div className="flex gap-4 items-end">
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message to the team..."
                    rows={1}
                    className="flex-1 min-h-[50px] max-h-[200px] rounded-2xl border-muted/50 focus-visible:ring-primary/20 resize-none py-3.5 px-5 bg-muted/20 border-none shadow-inner"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendMessageMutation.isPending || !messageText.trim()}
                    className="h-[50px] w-[50px] rounded-2xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Document Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold">Upload Document</DialogTitle>
            <DialogDescription className="text-base">Share a document with your team or sign a contract.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2.5">
              <label className="text-sm font-bold ml-1">Document Title *</label>
              <Input
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g., Service Agreement"
                className="rounded-xl h-12 bg-muted/30 border-none focus-visible:ring-primary/20"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-sm font-bold ml-1">File *</label>
              <div className="border-2 border-dashed border-muted/50 rounded-2xl p-8 text-center hover:bg-muted/10 transition-colors cursor-pointer group relative">
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.txt"
                />
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground group-hover:scale-110 transition-transform" />
                <p className="text-sm font-bold text-foreground">
                  {uploadFile ? uploadFile.name : 'Click to upload or drag to drop'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  PDF, DOC, DOCX up to 10MB
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-8 gap-4">
            <Button variant="ghost" onClick={() => setIsUploadOpen(false)} className="rounded-xl h-12 flex-1 font-bold">
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploadMutation.isPending || !uploadFile} className="rounded-xl h-12 flex-1 font-bold shadow-lg hover:shadow-xl transition-all">
              <Upload className="h-4 w-4 mr-2" />
              Upload Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientPortal;
