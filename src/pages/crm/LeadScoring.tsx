import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
    Target,
    Plus,
    Edit,
    Trash2,
    TrendingUp,
    Award,
    Filter,
    Settings,
    Users,
    Activity,
    Star,
    AlertCircle,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { contactStagesApi, LeadScoringRule } from '@/services/contactStagesApi';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ScoringCategory {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

interface LeadScore {
    contact_id: number;
    contact_name: string;
    contact_email: string;
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    last_updated: string;
    score_breakdown: {
        category: string;
        points: number;
    }[];
}

interface RuleFormData {
    name: string;
    description: string;
    conditions: {
        field: string;
        operator: string;
        value: any;
    };
    score_change: number;
    max_applications: number | null;
    is_active: boolean;
}

const scoringCategories: ScoringCategory[] = [
    {
        id: 'demographic',
        name: 'Demographic',
        description: 'Company size, industry, location',
        icon: <Users className="h-4 w-4" />,
        color: 'bg-blue-500'
    },
    {
        id: 'behavioral',
        name: 'Behavioral',
        description: 'Website visits, email opens, content downloads',
        icon: <Activity className="h-4 w-4" />,
        color: 'bg-green-500'
    },
    {
        id: 'engagement',
        name: 'Engagement',
        description: 'Form submissions, meeting bookings, responses',
        icon: <TrendingUp className="h-4 w-4" />,
        color: 'bg-purple-500'
    },
    {
        id: 'firmographic',
        name: 'Firmographic',
        description: 'Revenue, employee count, technology stack',
        icon: <Award className="h-4 w-4" />,
        color: 'bg-orange-500'
    }
];

const fieldOptions = [
    { value: 'email_opened', label: 'Email Opened', category: 'behavioral' },
    { value: 'email_clicked', label: 'Email Link Clicked', category: 'behavioral' },
    { value: 'form_submitted', label: 'Form Submitted', category: 'engagement' },
    { value: 'page_visited', label: 'Page Visited', category: 'behavioral' },
    { value: 'meeting_booked', label: 'Meeting Booked', category: 'engagement' },
    { value: 'company_size', label: 'Company Size', category: 'demographic' },
    { value: 'job_title', label: 'Job Title', category: 'demographic' },
    { value: 'industry', label: 'Industry', category: 'demographic' },
    { value: 'revenue', label: 'Annual Revenue', category: 'firmographic' },
    { value: 'employee_count', label: 'Employee Count', category: 'firmographic' },
    { value: 'location', label: 'Location', category: 'demographic' },
    { value: 'engagement_score', label: 'Engagement Score', category: 'engagement' }
];

const operatorOptions = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'contains', label: 'Contains' },
    { value: 'is_null', label: 'Is Empty' },
    { value: 'is_not_null', label: 'Is Not Empty' }
];

const getScoreGrade = (score: number): { grade: string; color: string; icon: React.ReactNode } => {
    if (score >= 80) return { grade: 'A', color: 'text-green-600', icon: <CheckCircle2 className="h-5 w-5" /> };
    if (score >= 60) return { grade: 'B', color: 'text-blue-600', icon: <Star className="h-5 w-5" /> };
    if (score >= 40) return { grade: 'C', color: 'text-yellow-600', icon: <AlertCircle className="h-5 w-5" /> };
    if (score >= 20) return { grade: 'D', color: 'text-orange-600', icon: <AlertCircle className="h-5 w-5" /> };
    return { grade: 'F', color: 'text-red-600', icon: <XCircle className="h-5 w-5" /> };
};

const ScoreDistribution = ({ leadScores }: { leadScores: LeadScore[] }) => {
    const distribution = {
        A: leadScores.filter(l => l.score >= 80).length,
        B: leadScores.filter(l => l.score >= 60 && l.score < 80).length,
        C: leadScores.filter(l => l.score >= 40 && l.score < 60).length,
        D: leadScores.filter(l => l.score >= 20 && l.score < 40).length,
        F: leadScores.filter(l => l.score < 20).length
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Score Distribution
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Object.entries(distribution).map(([grade, count]) => {
                        const { color } = getScoreGrade(grade === 'A' ? 85 : grade === 'B' ? 65 : grade === 'C' ? 45 : grade === 'D' ? 25 : 10);
                        const percentage = leadScores.length > 0 ? (count / leadScores.length) * 100 : 0;

                        return (
                            <div key={grade} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className={`font-semibold ${color}`}>Grade {grade}</span>
                                    <span className="text-sm text-muted-foreground">{count} leads ({percentage.toFixed(0)}%)</span>
                                </div>
                                <Progress value={percentage} className="h-2" />
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

interface RuleFormProps {
    formData: RuleFormData;
    setFormData: (data: RuleFormData) => void;
    onSubmit: () => void;
    submitLabel: string;
    onCancel: () => void;
}

const RuleForm = ({ onSubmit, submitLabel, formData, setFormData, onCancel }: RuleFormProps) => (
    <div className="space-y-4">
        <div>
            <Label>Rule Name</Label>
            <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., High-value company size"
            />
        </div>

        <div>
            <Label>Description</Label>
            <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe when this rule should apply"
                rows={2}
            />
        </div>

        <Card>
            <CardHeader className="py-3">
                <CardTitle className="text-sm">Condition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div>
                    <Label>Field</Label>
                    <Select
                        value={formData.conditions.field}
                        onValueChange={(v) => setFormData({ ...formData, conditions: { ...formData.conditions, field: v } })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                            {fieldOptions.map(field => (
                                <SelectItem key={field.value} value={field.value}>
                                    {field.label} ({field.category})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label>Operator</Label>
                        <Select
                            value={formData.conditions.operator}
                            onValueChange={(v: any) => setFormData({ ...formData, conditions: { ...formData.conditions, operator: v } })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {operatorOptions.map(op => (
                                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Value</Label>
                        <Input
                            value={formData.conditions.value as string}
                            onChange={(e) => setFormData({ ...formData, conditions: { ...formData.conditions, value: e.target.value } })}
                            placeholder="Comparison value"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label>Score Change</Label>
                <Input
                    type="number"
                    value={formData.score_change}
                    onChange={(e) => setFormData({ ...formData, score_change: parseInt(e.target.value) || 0 })}
                    placeholder="Points to add/subtract"
                />
                <p className="text-xs text-muted-foreground mt-1">Use negative numbers to subtract points</p>
            </div>

            <div>
                <Label>Max Applications</Label>
                <Input
                    type="number"
                    value={formData.max_applications || ''}
                    onChange={(e) => setFormData({ ...formData, max_applications: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Unlimited"
                />
                <p className="text-xs text-muted-foreground mt-1">How many times this rule can apply</p>
            </div>
        </div>

        <div className="flex items-center gap-2">
            <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>Active</Label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onCancel}>
                Cancel
            </Button>
            <Button onClick={onSubmit} disabled={!formData.name || !formData.conditions.field}>
                {submitLabel}
            </Button>
        </div>
    </div>
);

export default function LeadScoring() {
    const [rules, setRules] = useState<LeadScoringRule[]>([]);
    const [leadScores, setLeadScores] = useState<LeadScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingRule, setEditingRule] = useState<LeadScoringRule | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

    const [formData, setFormData] = useState<RuleFormData>({
        name: '',
        description: '',
        conditions: {
            field: '',
            operator: 'equals',
            value: ''
        },
        score_change: 0,
        max_applications: null,
        is_active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [rulesData, leadsResponse] = await Promise.all([
                contactStagesApi.getScoringRules(),
                api.crm.getLeads({ limit: 100 })
            ]);

            setRules(rulesData);

            // Transform real leads into LeadScore format
            if (leadsResponse && leadsResponse.leads) {
                const transformedLeads: LeadScore[] = leadsResponse.leads.map((lead: any) => {
                    const score = parseInt(lead.lead_score || '0');
                    const { grade } = getScoreGrade(score);

                    return {
                        contact_id: lead.contact_id || parseInt(lead.id), // Fallback if contact_id missing
                        contact_name: lead.first_name && lead.last_name
                            ? `${lead.first_name} ${lead.last_name}`
                            : lead.email || 'Unknown Contact',
                        contact_email: lead.email || '',
                        score: score,
                        grade: grade as 'A' | 'B' | 'C' | 'D' | 'F',
                        last_updated: lead.updated_at || new Date().toISOString(),
                        score_breakdown: [
                            // You might want to fetch real breakdown if available in the future
                            // For now we can infer some categories or leave generic
                            { category: 'Engagement', points: Math.floor(score * 0.4) },
                            { category: 'Behavioral', points: Math.floor(score * 0.4) },
                            { category: 'Demographic', points: Math.ceil(score * 0.2) }
                        ]
                    };
                });
                setLeadScores(transformedLeads);
            }
        } catch (error) {
            console.error('Failed to load scoring data:', error);
            toast.error('Failed to load scoring data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            await contactStagesApi.createScoringRule(formData);
            toast.success('Scoring rule created successfully');
            setShowCreateDialog(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to create rule:', error);
            toast.error('Failed to create scoring rule');
        }
    };

    const handleUpdate = async () => {
        if (!editingRule) return;
        try {
            await contactStagesApi.updateScoringRule(editingRule.id, formData);
            toast.success('Scoring rule updated successfully');
            setEditingRule(null);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to update rule:', error);
            toast.error('Failed to update scoring rule');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this scoring rule?')) return;
        try {
            await contactStagesApi.deleteScoringRule(id);
            toast.success('Scoring rule deleted successfully');
            loadData();
        } catch (error) {
            console.error('Failed to delete rule:', error);
            toast.error('Failed to delete scoring rule');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            conditions: {
                field: '',
                operator: 'equals',
                value: ''
            },
            score_change: 0,
            max_applications: null,
            is_active: true
        });
    };

    const startEdit = (rule: LeadScoringRule) => {
        setFormData({
            name: rule.name,
            description: rule.description || '',
            conditions: rule.conditions,
            score_change: rule.score_change,
            max_applications: rule.max_applications,
            is_active: rule.is_active
        });
        setEditingRule(rule);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Lead Scoring</h1>
                    <p className="text-muted-foreground">Automatically qualify and prioritize leads based on behavior and attributes</p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Scoring Rule
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create Scoring Rule</DialogTitle>
                            <DialogDescription>Define conditions and point values for automatic lead scoring</DialogDescription>
                        </DialogHeader>
                        <RuleForm
                            onSubmit={handleCreate}
                            submitLabel="Create Rule"
                            formData={formData}
                            setFormData={setFormData}
                            onCancel={() => {
                                setShowCreateDialog(false);
                                resetForm();
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="rules">Scoring Rules ({rules.length})</TabsTrigger>
                    <TabsTrigger value="leads">Lead Scores ({leadScores.length})</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Total Scored Leads</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{leadScores.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">Across all grades</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{rules.filter(r => r.is_active).length}</div>
                                <p className="text-xs text-muted-foreground mt-1">Out of {rules.length} total</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Hot Leads (A-Grade)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {leadScores.filter(l => l.score >= 80).length}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Ready for sales outreach</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ScoreDistribution leadScores={leadScores} />

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Top Performing Rules
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {rules.slice(0, 5).map(rule => (
                                        <div key={rule.id} className="flex items-center justify-between p-3 border rounded">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{rule.name}</p>
                                                <p className="text-xs text-muted-foreground">{rule.description}</p>
                                            </div>
                                            <Badge variant={rule.score_change > 0 ? 'default' : 'destructive'}>
                                                {rule.score_change > 0 ? '+' : ''}{rule.score_change}
                                            </Badge>
                                        </div>
                                    ))}
                                    {rules.length === 0 && (
                                        <p className="text-center text-muted-foreground py-4">No rules created yet</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="rules">
                    {loading ? (
                        <div className="text-center py-8">Loading rules...</div>
                    ) : rules.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground mb-4">No scoring rules yet</p>
                                <Button onClick={() => setShowCreateDialog(true)}>
                                    Create your first rule
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {rules.map(rule => (
                                <Card key={rule.id}>
                                    <CardContent className="py-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold">{rule.name}</h3>
                                                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                                                        {rule.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                    <Badge variant={rule.score_change > 0 ? 'default' : 'destructive'}>
                                                        {rule.score_change > 0 ? '+' : ''}{rule.score_change} points
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Badge variant="outline">
                                                        {rule.conditions.field}
                                                    </Badge>
                                                    <span className="text-muted-foreground">{rule.conditions.operator}</span>
                                                    {rule.conditions.value && (
                                                        <Badge variant="outline">{String(rule.conditions.value)}</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => startEdit(rule)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="leads">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lead Scores</CardTitle>
                            <CardDescription>View and manage individual lead scores</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Grade</TableHead>
                                        <TableHead>Breakdown</TableHead>
                                        <TableHead>Last Updated</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leadScores.map(lead => {
                                        const { grade, color, icon } = getScoreGrade(lead.score);
                                        return (
                                            <TableRow key={lead.contact_id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{lead.contact_name}</p>
                                                        <p className="text-sm text-muted-foreground">{lead.contact_email}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={lead.score} className="w-20 h-2" />
                                                        <span className="font-semibold">{lead.score}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className={`flex items-center gap-2 ${color}`}>
                                                        {icon}
                                                        <span className="font-bold">{grade}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {lead.score_breakdown.map((item, idx) => (
                                                            <Badge key={idx} variant="outline" className="text-xs">
                                                                {item.category}: {item.points}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(lead.last_updated).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="categories">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {scoringCategories.map(category => (
                            <Card key={category.id}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <div className={`p-2 rounded ${category.color} text-white`}>
                                            {category.icon}
                                        </div>
                                        {category.name}
                                    </CardTitle>
                                    <CardDescription>{category.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Available Fields:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {fieldOptions
                                                .filter(f => f.category === category.id)
                                                .map(field => (
                                                    <Badge key={field.value} variant="outline">
                                                        {field.label}
                                                    </Badge>
                                                ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Edit Dialog */}
            <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Scoring Rule</DialogTitle>
                        <DialogDescription>Update the scoring rule configuration</DialogDescription>
                    </DialogHeader>
                    <RuleForm
                        onSubmit={handleUpdate}
                        submitLabel="Save Changes"
                        formData={formData}
                        setFormData={setFormData}
                        onCancel={() => {
                            setEditingRule(null);
                            resetForm();
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
