// Automation Synchronization Service
// Provides real-time synchronization between Flow Builder visual interface and Spreadsheet/Table view

import { api } from '@/lib/api';

export interface FlowNode {
    id: string;
    type: 'trigger' | 'action' | 'condition' | 'delay' | 'split';
    subType: string;
    position: { x: number; y: number };
    data: Record<string, any>;
    connections: string[];
}

export interface Flow {
    id?: number;
    name: string;
    description: string;
    status: 'draft' | 'active' | 'paused';
    nodes: FlowNode[];
    campaign_id?: number;
    campaign_type?: 'email' | 'sms' | 'call' | 'multi-channel';
    trigger_type?: string;
    created_at?: string;
    updated_at?: string;
}

export interface SpreadsheetRow {
    id: string;
    flowId: number | null;
    stepOrder: number;
    nodeId: string;
    nodeType: 'trigger' | 'action' | 'condition' | 'delay' | 'split';
    subType: string;
    name: string;
    description: string;
    delayValue: number | null;
    delayUnit: 'minutes' | 'hours' | 'days' | null;
    templateId: number | null;
    templateName: string | null;
    tagName: string | null;
    condition: string | null;
    connectedTo: string[];
    status: 'enabled' | 'disabled';
    data: Record<string, any>;
}

export type SyncEventType =
    | 'node_added'
    | 'node_updated'
    | 'node_deleted'
    | 'node_moved'
    | 'connection_added'
    | 'connection_removed'
    | 'flow_saved'
    | 'flow_loaded'
    | 'bulk_update';

export interface SyncEvent {
    type: SyncEventType;
    source: 'visual' | 'spreadsheet';
    timestamp: number;
    data: {
        nodeId?: string;
        nodeIds?: string[];
        changes?: Partial<FlowNode | SpreadsheetRow>;
        flow?: Flow;
    };
}

type SyncListener = (event: SyncEvent) => void;

class AutomationSyncService {
    private listeners: Map<string, SyncListener[]> = new Map();
    private flowCache: Map<number, Flow> = new Map();
    private syncEnabled: boolean = true;
    private lastSyncTimestamp: number = 0;
    private pendingChanges: SyncEvent[] = [];
    private syncDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
    private readonly SYNC_DEBOUNCE_MS = 100;

    // ==================== SUBSCRIPTION MANAGEMENT ====================

    /**
     * Subscribe to sync events for a specific flow
     */
    subscribe(flowId: number, listener: SyncListener): () => void {
        const key = String(flowId);
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key)!.push(listener);

        // Return unsubscribe function
        return () => {
            const listeners = this.listeners.get(key);
            if (listeners) {
                const index = listeners.indexOf(listener);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
        };
    }

    /**
     * Notify all listeners for a flow about a sync event
     */
    private notify(flowId: number, event: SyncEvent): void {
        if (!this.syncEnabled) return;

        const listeners = this.listeners.get(String(flowId)) || [];
        listeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                console.error('Sync listener error:', error);
            }
        });
    }

    // ==================== SYNC CONTROL ====================

    /**
     * Enable or disable real-time sync
     */
    setSyncEnabled(enabled: boolean): void {
        this.syncEnabled = enabled;
        if (enabled && this.pendingChanges.length > 0) {
            this.flushPendingChanges();
        }
    }

    isSyncEnabled(): boolean {
        return this.syncEnabled;
    }

    // ==================== DATA CONVERSION ====================

    /**
     * Convert FlowNodes to SpreadsheetRows
     */
    nodesToRows(nodes: FlowNode[], flowId: number | null): SpreadsheetRow[] {
        return nodes.map((node, index) => ({
            id: `row_${node.id}`,
            flowId,
            stepOrder: index + 1,
            nodeId: node.id,
            nodeType: node.type,
            subType: node.subType,
            name: node.data.label || this.getNodeTypeName(node.subType),
            description: node.data.description || '',
            delayValue: node.data.delay || node.data.delayValue || null,
            delayUnit: node.data.delayUnit || null,
            templateId: node.data.templateId || null,
            templateName: node.data.templateName || null,
            tagName: node.data.tagName || (node.data.tags?.join(', ')) || null,
            condition: node.data.condition || node.data.conditionExpression || null,
            connectedTo: node.connections || [],
            status: node.data.disabled ? 'disabled' : 'enabled',
            data: { ...node.data },
        }));
    }

    /**
     * Convert SpreadsheetRows to FlowNodes
     */
    rowsToNodes(rows: SpreadsheetRow[]): FlowNode[] {
        const VERTICAL_SPACING = 120;
        const START_Y = 100;

        return rows.map((row, index) => ({
            id: row.nodeId,
            type: row.nodeType,
            subType: row.subType,
            position: { x: 250, y: START_Y + (index * VERTICAL_SPACING) },
            data: {
                ...row.data,
                label: row.name,
                description: row.description,
                delay: row.delayValue,
                delayValue: row.delayValue,
                delayUnit: row.delayUnit,
                templateId: row.templateId,
                templateName: row.templateName,
                tagName: row.tagName,
                tags: row.tagName ? row.tagName.split(',').map(t => t.trim()) : [],
                condition: row.condition,
                conditionExpression: row.condition,
                disabled: row.status === 'disabled',
            },
            connections: row.connectedTo,
        }));
    }

    // ==================== SYNC EVENTS ====================

    /**
     * Emit a sync event from the visual builder
     */
    emitFromVisual(flowId: number, type: SyncEventType, data: SyncEvent['data']): void {
        const event: SyncEvent = {
            type,
            source: 'visual',
            timestamp: Date.now(),
            data,
        };

        this.queueSyncEvent(flowId, event);
    }

    /**
     * Emit a sync event from the spreadsheet view
     */
    emitFromSpreadsheet(flowId: number, type: SyncEventType, data: SyncEvent['data']): void {
        const event: SyncEvent = {
            type,
            source: 'spreadsheet',
            timestamp: Date.now(),
            data,
        };

        this.queueSyncEvent(flowId, event);
    }

    /**
     * Queue a sync event with debouncing
     */
    private queueSyncEvent(flowId: number, event: SyncEvent): void {
        this.pendingChanges.push(event);

        if (this.syncDebounceTimeout) {
            clearTimeout(this.syncDebounceTimeout);
        }

        this.syncDebounceTimeout = setTimeout(() => {
            this.flushPendingChanges();
        }, this.SYNC_DEBOUNCE_MS);

        // Immediately notify for instant feedback
        this.notify(flowId, event);
    }

    /**
     * Process and clear pending changes
     */
    private flushPendingChanges(): void {
        if (this.pendingChanges.length === 0) return;

        // Group changes by flow
        const changesByFlow = new Map<number, SyncEvent[]>();
        this.pendingChanges.forEach(event => {
            const flowId = (event.data.flow?.id) || 0;
            if (!changesByFlow.has(flowId)) {
                changesByFlow.set(flowId, []);
            }
            changesByFlow.get(flowId)!.push(event);
        });

        this.pendingChanges = [];
        this.lastSyncTimestamp = Date.now();
    }

    // ==================== CACHE MANAGEMENT ====================

    /**
     * Update the cached flow data
     */
    updateCache(flow: Flow): void {
        if (flow.id) {
            this.flowCache.set(flow.id, { ...flow });
        }
    }

    /**
     * Get cached flow data
     */
    getFromCache(flowId: number): Flow | undefined {
        return this.flowCache.get(flowId);
    }

    /**
     * Clear cache for a specific flow
     */
    clearCache(flowId?: number): void {
        if (flowId) {
            this.flowCache.delete(flowId);
        } else {
            this.flowCache.clear();
        }
    }

    // ==================== API OPERATIONS ====================

    /**
     * Load flow from API and update cache
     */
    async loadFlow(flowId: number): Promise<Flow> {
        try {
            const response = await api.get(`/flows/${flowId}`);
            const flow = (response.data as any).flow || response.data as Flow;

            // Parse nodes if they're a JSON string
            if (typeof flow.nodes === 'string') {
                flow.nodes = JSON.parse(flow.nodes);
            }

            this.updateCache(flow);
            this.notify(flowId, {
                type: 'flow_loaded',
                source: 'visual',
                timestamp: Date.now(),
                data: { flow },
            });

            return flow;
        } catch (error) {
            console.error('Error loading flow:', error);
            throw error;
        }
    }

    /**
     * Save flow to API and update cache
     */
    async saveFlow(flow: Flow): Promise<Flow> {
        try {
            let savedFlow: Flow;

            if (flow.id) {
                await api.put(`/flows/${flow.id}`, flow);
                savedFlow = flow;
            } else {
                const response = await api.post('/flows', flow);
                savedFlow = (response.data as any).flow || response.data as Flow;
            }

            this.updateCache(savedFlow);

            if (savedFlow.id) {
                this.notify(savedFlow.id, {
                    type: 'flow_saved',
                    source: 'visual',
                    timestamp: Date.now(),
                    data: { flow: savedFlow },
                });
            }

            return savedFlow;
        } catch (error) {
            console.error('Error saving flow:', error);
            throw error;
        }
    }

    // ==================== HELPERS ====================

    /**
     * Get human-readable name for a node type
     */
    private getNodeTypeName(subType: string): string {
        const nodeNames: Record<string, string> = {
            // Triggers
            contact_added: 'Contact Added',
            contact_updated: 'Contact Updated',
            tag_added: 'Tag Added',
            email_opened: 'Email Opened',
            email_clicked: 'Link Clicked',
            sms_replied: 'SMS Replied',
            form_submitted: 'Form Submitted',
            manual: 'Manual Start',

            // Actions
            send_email: 'Send Email',
            send_sms: 'Send SMS',
            make_call: 'Make Call',
            add_tag: 'Add Tag',
            remove_tag: 'Remove Tag',
            update_field: 'Update Field',
            notify_team: 'Notify Team',
            webhook: 'Webhook',
            end_flow: 'End Flow',

            // Conditions
            if_else: 'If/Else',
            has_tag: 'Has Tag',
            field_value: 'Field Value',
            random_split: 'Random Split',

            // Timing
            wait: 'Wait',
            wait_until: 'Wait Until',
            smart_delay: 'Smart Delay',
            split_test: 'A/B Split',
        };

        return nodeNames[subType] || subType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Validate node connections
     */
    validateConnections(nodes: FlowNode[]): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        const nodeIds = new Set(nodes.map(n => n.id));

        // Check for orphaned connections
        nodes.forEach(node => {
            node.connections.forEach(connId => {
                if (!nodeIds.has(connId)) {
                    errors.push(`Node "${node.id}" has connection to non-existent node "${connId}"`);
                }
            });
        });

        // Check for triggers (should be at the start)
        const triggers = nodes.filter(n => n.type === 'trigger');
        if (triggers.length === 0) {
            errors.push('Flow should have at least one trigger node');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Auto-connect nodes based on step order
     */
    autoConnectNodes(nodes: FlowNode[]): FlowNode[] {
        return nodes.map((node, index) => {
            if (index < nodes.length - 1) {
                const nextNode = nodes[index + 1];
                if (!node.connections.includes(nextNode.id)) {
                    return {
                        ...node,
                        connections: [...node.connections, nextNode.id],
                    };
                }
            }
            return node;
        });
    }
}

// Singleton instance
export const automationSyncService = new AutomationSyncService();

export default automationSyncService;
