import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  Save,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Brain,
  Zap,
  Target,
  Hash,
  X,
  Plus,
  Play,
} from "lucide-react";
import {
  ModelSelector,
  ThresholdConfig,
  PreviewConsole,
  FeedbackConfig,
} from "@/components/sentiment/AdvancedConfigComponents";
import {
  SentimentConfigExtended,
  PreviewResult,
} from "@/types/sentiment-config";

interface SentimentConfig {
  id?: string;
  positive_keywords: string[];
  negative_keywords: string[];
  intent_keywords: Record<string, string[]>;
  default_confidence_threshold: number;
  updated_at?: string;
}

const SentimentConfig: React.FC = () => {
  // Legacy config state
  const [config, setConfig] = useState<SentimentConfig>({
    positive_keywords: [],
    negative_keywords: [],
    intent_keywords: {},
    default_confidence_threshold: 70,
  });

  // Advanced config state
  const [advancedConfigs, setAdvancedConfigs] = useState<
    SentimentConfigExtended[]
  >([]);
  const [selectedConfig, setSelectedConfig] =
    useState<SentimentConfigExtended | null>(null);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Intent Management State
  const [newIntentName, setNewIntentName] = useState("");
  const [newIntentKeyword, setNewIntentKeyword] = useState("");
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);

  // Topic Management State (Mapped to intent_keywords with prefix 'topic:')
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicKeyword, setNewTopicKeyword] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPositiveKeyword, setNewPositiveKeyword] = useState("");
  const [newNegativeKeyword, setNewNegativeKeyword] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
    loadAdvancedConfigs();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get("/sentiment-config");
      if (response.config) {
        setConfig(response.config);
      }
    } catch (error) {
      console.error("Error loading config:", error);
      toast({
        title: "Error",
        description: "Failed to load configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAdvancedConfigs = async () => {
    try {
      const response = await api.get("/sentiment-configs");
      if (response.configs) {
        setAdvancedConfigs(response.configs);
        const enabled = response.configs.find(
          (c: SentimentConfigExtended) => c.enabled,
        );
        if (enabled) {
          setSelectedConfig(enabled);
          setIsAdvancedMode(enabled.mode === "ml");
        }
      }
    } catch (error) {
      console.error("Error loading advanced configs:", error);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      await api.put("/sentiment-config", {
        positive_keywords: config.positive_keywords,
        negative_keywords: config.negative_keywords,
        intent_keywords: config.intent_keywords,
        default_confidence_threshold: config.default_confidence_threshold,
      });
      toast({
        title: "Success",
        description: "Configuration saved successfully",
      });
    } catch (error) {
      console.error("Error saving config:", error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Keyword Helpers
  const addKeyword = (type: "positive" | "negative") => {
    const keyword =
      type === "positive"
        ? newPositiveKeyword.trim()
        : newNegativeKeyword.trim();
    if (!keyword) return;

    const key = type === "positive" ? "positive_keywords" : "negative_keywords";
    if (config[key].includes(keyword.toLowerCase())) {
      toast({
        title: "Warning",
        description: "Keyword already exists",
      });
      return;
    }

    setConfig((prev) => ({
      ...prev,
      [key]: [...prev[key], keyword.toLowerCase()],
    }));

    if (type === "positive") setNewPositiveKeyword("");
    else setNewNegativeKeyword("");
  };

  const removeKeyword = (type: "positive" | "negative", keyword: string) => {
    const key = type === "positive" ? "positive_keywords" : "negative_keywords";
    setConfig((prev) => ({
      ...prev,
      [key]: prev[key].filter((k) => k !== keyword),
    }));
  };

  // Intent Helpers
  const addIntent = () => {
    if (!newIntentName.trim()) return;
    const intentKey = newIntentName.trim().toLowerCase().replace(/\s+/g, '_');

    if (config.intent_keywords[intentKey]) {
      toast({ title: "Error", description: "Intent already exists", variant: "destructive" });
      return;
    }

    setConfig(prev => ({
      ...prev,
      intent_keywords: { ...prev.intent_keywords, [intentKey]: [] }
    }));
    setNewIntentName("");
    setSelectedIntent(intentKey);
    toast({ title: "Success", description: "Intent category created" });
  };

  const deleteIntent = (intent: string) => {
    if (!confirm(`Delete intent '${intent}'?`)) return;
    const newIntents = { ...config.intent_keywords };
    delete newIntents[intent];
    setConfig(prev => ({ ...prev, intent_keywords: newIntents }));
    if (selectedIntent === intent) setSelectedIntent(null);
  };

  const addIntentKeyword = () => {
    if (!selectedIntent || !newIntentKeyword.trim()) return;

    const currentKeywords = config.intent_keywords[selectedIntent] || [];
    if (currentKeywords.includes(newIntentKeyword.trim().toLowerCase())) return;

    setConfig(prev => ({
      ...prev,
      intent_keywords: {
        ...prev.intent_keywords,
        [selectedIntent]: [...currentKeywords, newIntentKeyword.trim().toLowerCase()]
      }
    }));
    setNewIntentKeyword("");
  };

  const removeIntentKeyword = (intent: string, keyword: string) => {
    setConfig(prev => ({
      ...prev,
      intent_keywords: {
        ...prev.intent_keywords,
        [intent]: prev.intent_keywords[intent].filter(k => k !== keyword)
      }
    }));
  };

  // Topic Helpers (using 'topic:' prefix in intents)
  const getTopics = () => {
    return Object.keys(config.intent_keywords)
      .filter(k => k.startsWith('topic:'))
      .map(k => k.replace('topic:', ''));
  };

  const addTopic = () => {
    if (!newTopicName.trim()) return;
    const topicKey = `topic:${newTopicName.trim().toLowerCase().replace(/\s+/g, '_')}`;

    if (config.intent_keywords[topicKey]) {
      toast({ title: "Error", description: "Topic already exists", variant: "destructive" });
      return;
    }

    setConfig(prev => ({
      ...prev,
      intent_keywords: { ...prev.intent_keywords, [topicKey]: [] }
    }));
    setNewTopicName("");
    setSelectedTopic(topicKey);
    toast({ title: "Success", description: "Topic category created" });
  };

  const addTopicKeyword = () => {
    if (!selectedTopic || !newTopicKeyword.trim()) return;

    const currentKeywords = config.intent_keywords[selectedTopic] || [];
    if (currentKeywords.includes(newTopicKeyword.trim().toLowerCase())) return;

    setConfig(prev => ({
      ...prev,
      intent_keywords: {
        ...prev.intent_keywords,
        [selectedTopic]: [...currentKeywords, newTopicKeyword.trim().toLowerCase()]
      }
    }));
    setNewTopicKeyword("");
  };

  // Advanced Config Save
  const saveAdvancedConfig = async () => {
    if (!selectedConfig) return;
    try {
      setSaving(true);
      if (selectedConfig.id && selectedConfig.id.startsWith("new-")) {
        const { id, ...createData } = selectedConfig;
        await api.post("/sentiment-configs", createData);
      } else {
        await api.put(`/sentiment-configs/${selectedConfig.id}`, selectedConfig);
      }
      toast({ title: "Success", description: "Advanced configuration saved" });
      await loadAdvancedConfigs();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save configuration", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async (texts: string[]): Promise<PreviewResult[]> => {
    if (!selectedConfig?.id) return [];
    try {
      const response = await api.post(`/sentiment-configs/${selectedConfig.id}/preview`, { texts });
      return response.predictions || [];
    } catch (error) {
      toast({ title: "Error", description: "Preview failed", variant: "destructive" });
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filter out topics from intents for the Intents tab
  const pureIntents = Object.keys(config.intent_keywords).filter(k => !k.startsWith('topic:'));

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conversation Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Configure AI models to understand sentiment, intent, and topics in customer conversations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border">
            <Label className="text-sm font-medium cursor-pointer" htmlFor="mode-switch">Using {isAdvancedMode ? "AI Model" : "Keywords"}</Label>
            <Switch
              id="mode-switch"
              checked={isAdvancedMode}
              onCheckedChange={setIsAdvancedMode}
            />
          </div>
          <Button
            onClick={() => isAdvancedMode ? saveAdvancedConfig() : saveConfig()}
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {isAdvancedMode ? (
        // Advanced AI Mode
        <div className="animate-in fade-in duration-500">
          <div className="grid gap-6">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Model Configuration</h3>
                    <p className="text-sm text-muted-foreground">Manage your AI providers and active models.</p>
                  </div>
                  <Select
                    value={selectedConfig?.id}
                    onValueChange={(id) => {
                      const cfg = advancedConfigs.find((c) => c.id === id);
                      if (cfg) setSelectedConfig(cfg);
                    }}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select Config" />
                    </SelectTrigger>
                    <SelectContent>
                      {advancedConfigs.map((cfg) => (
                        <SelectItem key={cfg.id} value={cfg.id}>
                          {cfg.name} {cfg.enabled && "(Active)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedConfig && (
                  <Tabs defaultValue="model" className="w-full">
                    <TabsList className="grid w-full grid-cols-5 bg-muted/50">
                      <TabsTrigger value="model">Provider & Model</TabsTrigger>
                      <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
                      <TabsTrigger value="feedback">Training</TabsTrigger>
                      <TabsTrigger value="preview">Simulator</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <div className="mt-6 space-y-6">
                      <TabsContent value="model">
                        <ModelSelector
                          value={selectedConfig.model}
                          onChange={(model) => setSelectedConfig({ ...selectedConfig, model })}
                        />
                      </TabsContent>
                      <TabsContent value="thresholds">
                        <ThresholdConfig
                          value={selectedConfig.thresholds}
                          onChange={(thresholds) => setSelectedConfig({ ...selectedConfig, thresholds })}
                        />
                      </TabsContent>
                      <TabsContent value="feedback">
                        <FeedbackConfig
                          value={selectedConfig.feedback || {}}
                          onChange={(feedback) => setSelectedConfig({ ...selectedConfig, feedback })}
                          mode={selectedConfig.mode}
                        />
                      </TabsContent>
                      <TabsContent value="preview">
                        <PreviewConsole configId={selectedConfig.id} onPreview={handlePreview} />
                      </TabsContent>
                      <TabsContent value="settings">
                        <Card>
                          <CardHeader>
                            <CardTitle>System Settings</CardTitle>
                            <CardDescription>Configure sampling and drift detection</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <p className="font-medium">Drift Detection</p>
                                <p className="text-sm text-muted-foreground">Monitor model performance over time</p>
                              </div>
                              <Switch
                                checked={selectedConfig.driftDetection?.enabled}
                                onCheckedChange={(v) => setSelectedConfig({
                                  ...selectedConfig,
                                  driftDetection: { ...selectedConfig.driftDetection, enabled: v }
                                })}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </div>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        // Keyword Mode (Visual Builder)
        <Tabs defaultValue="sentiment" className="space-y-6 animate-in fade-in duration-500">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px] h-12">
            <TabsTrigger value="sentiment" className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" /> Sentiment
            </TabsTrigger>
            <TabsTrigger value="intents" className="flex items-center gap-2">
              <Target className="h-4 w-4" /> Intents
            </TabsTrigger>
            <TabsTrigger value="topics" className="flex items-center gap-2">
              <Hash className="h-4 w-4" /> Topics
            </TabsTrigger>
            <TabsTrigger value="integration" className="flex items-center gap-2">
              <Zap className="h-4 w-4" /> Guide
            </TabsTrigger>
          </TabsList>

          {/* SENTIMENT TAB */}
          <TabsContent value="sentiment" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-green-100 dark:border-green-900/50">
                <CardHeader>
                  <CardTitle className="text-green-600 flex items-center gap-2">
                    <ThumbsUp className="h-5 w-5" /> Positive Signals
                  </CardTitle>
                  <CardDescription>Keywords that indicate customer satisfaction</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., love, amazing, great"
                      value={newPositiveKeyword}
                      onChange={(e) => setNewPositiveKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addKeyword("positive")}
                    />
                    <Button size="icon" onClick={() => addKeyword("positive")} className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {config.positive_keywords.map((k) => (
                      <Badge key={k} variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 flex gap-1 items-center px-3 py-1">
                        {k}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeKeyword("positive", k)} />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-100 dark:border-red-900/50">
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <ThumbsDown className="h-5 w-5" /> Negative Signals
                  </CardTitle>
                  <CardDescription>Keywords that indicate customer frustration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., hate, terrible, bad"
                      value={newNegativeKeyword}
                      onChange={(e) => setNewNegativeKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addKeyword("negative")}
                    />
                    <Button size="icon" onClick={() => addKeyword("negative")} variant="destructive">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {config.negative_keywords.map((k) => (
                      <Badge key={k} variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100 flex gap-1 items-center px-3 py-1">
                        {k}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeKeyword("negative", k)} />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* INTENTS TAB */}
          <TabsContent value="intents" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Intent List */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Intent Categories</CardTitle>
                  <CardDescription>Define what your customers want</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="New category..."
                      value={newIntentName}
                      onChange={(e) => setNewIntentName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addIntent()}
                    />
                    <Button size="icon" onClick={addIntent}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {pureIntents.map((intent) => (
                      <div
                        key={intent}
                        className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center hover:bg-muted ${selectedIntent === intent ? 'bg-primary/5 border-primary' : 'bg-card'}`}
                        onClick={() => setSelectedIntent(intent)}
                      >
                        <span className="font-medium capitalize truncate">{intent.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{config.intent_keywords[intent].length}</Badge>
                          <X
                            className="h-4 w-4 text-muted-foreground hover:text-red-500"
                            onClick={(e) => { e.stopPropagation(); deleteIntent(intent); }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Keyword Editor */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {selectedIntent ? (
                      <span className="capitalize flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Training Phrases for "{selectedIntent.replace(/_/g, ' ')}"
                      </span>
                    ) : "Select an Intent"}
                  </CardTitle>
                  <CardDescription>
                    Add phrases or keywords that trigger this intent. {selectedIntent && `(${config.intent_keywords[selectedIntent].length} configured)`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedIntent ? (
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <Input
                          placeholder={`E.g., "I want to cancel", "cancel subscription"`}
                          value={newIntentKeyword}
                          onChange={(e) => setNewIntentKeyword(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addIntentKeyword()}
                          className="text-lg"
                        />
                        <Button onClick={addIntentKeyword} disabled={!newIntentKeyword.trim()}>
                          <Plus className="h-4 w-4 mr-2" /> Add Phrase
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {config.intent_keywords[selectedIntent].map((k, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-md border group">
                            <span className="text-sm">{k}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => removeIntentKeyword(selectedIntent, k)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {config.intent_keywords[selectedIntent].length === 0 && (
                          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                            No keywords added yet. Add a phrase above.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-4">
                      <Target className="h-12 w-12 opacity-20" />
                      <p>Select an intent category from the left to configure it.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TOPICS TAB */}
          <TabsContent value="topics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Topic Buckets</CardTitle>
                  <CardDescription>Categorize conversations by subject</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="New topic..."
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                    />
                    <Button size="icon" onClick={addTopic}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="space-y-2">
                    {getTopics().map((topic) => (
                      <div
                        key={topic}
                        className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center hover:bg-muted ${selectedTopic === `topic:${topic}` ? 'bg-primary/5 border-primary' : 'bg-card'}`}
                        onClick={() => setSelectedTopic(`topic:${topic}`)}
                      >
                        <span className="font-medium capitalize truncate">#{topic.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{config.intent_keywords[`topic:${topic}`]?.length || 0}</Badge>
                          <X
                            className="h-4 w-4 text-muted-foreground hover:text-red-500"
                            onClick={(e) => { e.stopPropagation(); deleteIntent(`topic:${topic}`); }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {selectedTopic ? (
                      <span className="capitalize flex items-center gap-2">
                        <Hash className="h-5 w-5 text-primary" />
                        Keywords for "#{selectedTopic.replace('topic:', '').replace(/_/g, ' ')}"
                      </span>
                    ) : "Select a Topic"}
                  </CardTitle>
                  <CardDescription>Topic tags are applied when these words are detected.</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedTopic ? (
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <Input
                          placeholder={`E.g., "pricing", "cost", "how much"`}
                          value={newTopicKeyword}
                          onChange={(e) => setNewTopicKeyword(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addTopicKeyword()}
                        />
                        <Button onClick={addTopicKeyword} disabled={!newTopicKeyword.trim()}>
                          <Plus className="h-4 w-4 mr-2" /> Add Keyword
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {config.intent_keywords[selectedTopic]?.map((k, i) => (
                          <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm flex gap-2">
                            {k}
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-red-500"
                              onClick={() => removeIntentKeyword(selectedTopic, k)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-4">
                      <Hash className="h-12 w-12 opacity-20" />
                      <p>Select a topic to configure keywords.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* INTEGRATION GUIDE */}
          <TabsContent value="integration" className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl">Linking Intelligence to Automations</CardTitle>
                <CardDescription>How to use your configured Sentiments, Intents, and Topics in the Flow Builder.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-lg">1</div>
                    <h3 className="font-semibold">Configure Triggers</h3>
                    <p className="text-sm text-muted-foreground">In Automation Flows, use the <strong className="text-foreground">"Message Received"</strong> trigger.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold text-lg">2</div>
                    <h3 className="font-semibold">Add Conditions</h3>
                    <p className="text-sm text-muted-foreground">Add an "If/Else" step and select <strong className="text-foreground">"Contact Intent"</strong> or <strong className="text-foreground">"Sentiment Score"</strong> as the condition.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-300 font-bold text-lg">3</div>
                    <h3 className="font-semibold">Automate Actions</h3>
                    <p className="text-sm text-muted-foreground">Route to different paths: Send a booking link if <span className="font-mono text-xs p-1 bg-muted rounded">Intent=Booking</span>, or escalate to support if <span className="font-mono text-xs p-1 bg-muted rounded">Sentiment=Negative</span>.</p>
                  </div>
                </div>

                <div className="p-4 bg-card border rounded-lg shadow-sm">
                  <h4 className="font-medium mb-2 flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" /> Example Workflow</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto pb-2">
                    <Badge variant="outline" className="whitespace-nowrap">Trigger: Incoming SMS</Badge>
                    <Play className="h-3 w-3" />
                    <Badge variant="outline" className="whitespace-nowrap">Analyze: Detect Intent</Badge>
                    <Play className="h-3 w-3" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs">If 'Booking':</span>
                        <Badge className="bg-blue-500 hover:bg-blue-600">Send Calendar Link</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs">If 'Support':</span>
                        <Badge className="bg-orange-500 hover:bg-orange-600">Notify Team</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SentimentConfig;
