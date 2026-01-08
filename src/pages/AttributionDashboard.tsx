import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GitBranch,
  Target,
  TrendingUp,
  Calendar,
  Filter,
  RefreshCw,
  ArrowRight,
  Mail,
  MessageSquare,
  Phone,
  Globe,
  Users
} from 'lucide-react';
import { api } from '@/lib/api';

interface AttributionData {
  source: string;
  channel: string;
  leads: number;
  conversions: number;
  revenue: number;
  attribution_value: number;
}

interface TouchpointData {
  id: number;
  channel: string;
  source: string;
  campaign: string;
  timestamp: string;
  attribution_credit: number;
}

interface JourneyData {
  contact_id: number;
  contact_name: string;
  touchpoints: TouchpointData[];
  converted: boolean;
  conversion_value: number;
}

const CHANNEL_ICONS: Record<string, any> = {
  email: Mail,
  sms: MessageSquare,
  call: Phone,
  web: Globe,
  referral: Users
};

const ATTRIBUTION_MODELS = [
  { id: 'first_touch', name: 'First Touch' },
  { id: 'last_touch', name: 'Last Touch' },
  { id: 'linear', name: 'Linear' },
  { id: 'time_decay', name: 'Time Decay' },
  { id: 'position_based', name: 'Position Based' }
];


export default function AttributionDashboard() {
  const [attributionData, setAttributionData] = useState<AttributionData[]>([]);
  const [journeys, setJourneys] = useState<JourneyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState('first_touch');
  const [groupBy, setGroupBy] = useState('source');
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    loadAttributionData();
  }, [selectedModel, groupBy, dateRange]);

  const loadAttributionData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/attribution/report', {
        params: { model: selectedModel, group_by: groupBy, days: dateRange }
      });
      setAttributionData(response.data.report?.data || []);
      setJourneys(response.data.report?.sample_journeys || []);
    } catch (error) {
      console.error('Failed to load attribution data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  const totalLeads = attributionData.reduce((sum, d) => sum + d.leads, 0);
  const totalConversions = attributionData.reduce((sum, d) => sum + d.conversions, 0);
  const totalRevenue = attributionData.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Attribution Dashboard
          </h1>
          <p className="text-muted-foreground">Understand which channels drive conversions</p>
        </div>
        <Button onClick={loadAttributionData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Model:</span>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTRIBUTION_MODELS.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Group by:</span>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="source">Source</SelectItem>
                  <SelectItem value="channel">Channel</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">Total Leads</span>
            </div>
            <p className="text-2xl font-bold mt-2">{totalLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Conversions</span>
            </div>
            <p className="text-2xl font-bold mt-2">{totalConversions}</p>
            <p className="text-xs text-muted-foreground">
              {totalLeads > 0 ? formatPercent(totalConversions / totalLeads) : '0%'} rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-muted-foreground">Revenue</span>
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-orange-600" />
              <span className="text-sm text-muted-foreground">Avg Touchpoints</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {journeys.length > 0
                ? (journeys.reduce((sum, j) => sum + j.touchpoints.length, 0) / journeys.length).toFixed(1)
                : '0'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList>
          <TabsTrigger value="breakdown">Attribution Breakdown</TabsTrigger>
          <TabsTrigger value="journeys">Lead Journeys</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Attribution by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</CardTitle>
              <CardDescription>Using {ATTRIBUTION_MODELS.find(m => m.id === selectedModel)?.name} model</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : attributionData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No attribution data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attributionData.map((item, idx) => {
                    const Icon = CHANNEL_ICONS[item.channel] || Globe;
                    const percentage = totalRevenue > 0 ? (item.attribution_value / totalRevenue) : 0;
                    return (
                      <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="flex items-center gap-2 w-48">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{item.source || item.channel}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${percentage * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-16 text-right">
                              {formatPercent(percentage)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right w-32">
                          <p className="font-semibold">{formatCurrency(item.attribution_value)}</p>
                          <p className="text-xs text-muted-foreground">{item.conversions} conversions</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="journeys">
          <Card>
            <CardHeader>
              <CardTitle>Lead Journey Visualization</CardTitle>
              <CardDescription>Sample customer journeys showing touchpoint paths</CardDescription>
            </CardHeader>
            <CardContent>
              {journeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No journey data available</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {journeys.slice(0, 5).map((journey, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="font-medium">{journey.contact_name}</span>
                          <Badge variant={journey.converted ? 'default' : 'secondary'} className="ml-2">
                            {journey.converted ? 'Converted' : 'In Progress'}
                          </Badge>
                        </div>
                        {journey.converted && (
                          <span className="font-semibold text-green-600">
                            {formatCurrency(journey.conversion_value)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {journey.touchpoints.map((tp, tpIdx) => {
                          const Icon = CHANNEL_ICONS[tp.channel] || Globe;
                          return (
                            <React.Fragment key={tp.id}>
                              <div className="flex flex-col items-center min-w-[100px] p-2 bg-muted rounded">
                                <Icon className="h-5 w-5 mb-1" />
                                <span className="text-xs font-medium">{tp.source}</span>
                                <span className="text-xs text-muted-foreground">{tp.campaign || 'Direct'}</span>
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {formatPercent(tp.attribution_credit)}
                                </Badge>
                              </div>
                              {tpIdx < journey.touchpoints.length - 1 && (
                                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
