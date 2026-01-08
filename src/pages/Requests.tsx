import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

import {
  Plus, Search, Filter, FileTextIcon, Clock, CheckCircle,
  XCircle, AlertTriangle, RefreshCw, Eye, Trash2
} from 'lucide-react';
import { requestsApi, Request } from '@/services/requestsApi';
import { api } from '@/lib/api';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'reviewing', label: 'Reviewing', color: 'bg-purple-100 text-purple-800' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-orange-100 text-orange-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
];

export default function Requests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter, assignedFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (assignedFilter !== 'all') params.assigned_to = assignedFilter;

      const [requestsRes, staffRes] = await Promise.all([
        requestsApi.getRequests(params),
        api.get('/operations/staff'),
      ]);

      setRequests(requestsRes?.items || []);
      setStaff(staffRes.data?.items || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (requestId: number) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      await requestsApi.deleteRequest(requestId);
      toast.success('Request deleted');
      loadData();
    } catch (error) {
      console.error('Failed to delete request:', error);
      toast.error('Failed to delete request');
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_OPTIONS.find(s => s.value === status);
    return <Badge className={config?.color}>{config?.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const config = PRIORITY_OPTIONS.find(p => p.value === priority);
    return <Badge className={config?.color}>{config?.label}</Badge>;
  };

  const filteredRequests = requests.filter(req => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        req.requestNumber?.toLowerCase().includes(search) ||
        req.title?.toLowerCase().includes(search) ||
        req.contact?.firstName?.toLowerCase().includes(search) ||
        req.contact?.lastName?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const stats = {
    total: requests.length,
    new: requests.filter(r => r.status === 'new').length,
    reviewing: requests.filter(r => r.status === 'reviewing').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  return (

    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Requests</h1>
          <p className="text-muted-foreground">Manage customer service requests and inquiries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/operations/requests/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileTextIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">New</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.new}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-muted-foreground">Reviewing</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.reviewing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="text-sm text-muted-foreground">In Progress</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.completed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {PRIORITY_OPTIONS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assignedFilter} onValueChange={setAssignedFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Assigned To" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staff.map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map(request => (
                <TableRow key={request.id}>
                  <TableCell className="font-mono text-sm">{request.requestNumber}</TableCell>
                  <TableCell>
                    {request.contact?.firstName} {request.contact?.lastName}
                  </TableCell>
                  <TableCell className="font-medium">{request.title}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                  <TableCell>{request.assignedStaff?.name || '-'}</TableCell>
                  <TableCell>
                    {request.requestedDate ? (
                      <span className="text-sm">
                        {new Date(request.requestedDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/operations/requests/${request.id}`)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRequest(request.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No requests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>

  );
}

