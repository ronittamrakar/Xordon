/**
 * Sentiment Config Service
 * Manages configuration CRUD, versioning, and effective config resolution
 */

import { v4 as uuidv4 } from 'uuid';
import {
  SentimentConfig,
  SentimentScope,
  CreateSentimentConfigRequest,
  UpdateSentimentConfigRequest,
  SentimentConfigAudit,
} from '../../types/sentiment-config';
import { Database } from '../../Database';

const db = Database.conn();

export class SentimentConfigService {
  /**
   * Get effective configuration for a given scope
   * Resolves inheritance: global > workspace > company > campaign > user
   */
  async getEffectiveConfig(
    scope: SentimentScope,
    scopeId?: string
  ): Promise<SentimentConfig | null> {
    const query = `
      SELECT * FROM sentiment_configs
      WHERE enabled = TRUE AND deleted_at IS NULL
      AND (
        (scope = ? AND scope_id = ?) OR
        (scope = 'workspace' AND scope_id = ?) OR
        (scope = 'company' AND scope_id = ?) OR
        (scope = 'global')
      )
      ORDER BY 
        CASE scope
          WHEN 'user' THEN 1
          WHEN 'campaign' THEN 2
          WHEN 'company' THEN 3
          WHEN 'workspace' THEN 4
          WHEN 'global' THEN 5
        END,
        version DESC
      LIMIT 1
    `;

    const results = await db.query(query, [scope, scopeId, scopeId, scopeId]);
    if (results.length === 0) return null;

    return this.deserializeConfig(results[0]);
  }

  /**
   * List all configurations
   */
  async listConfigs(filters?: {
    scope?: SentimentScope;
    scopeId?: string;
    enabled?: boolean;
  }): Promise<SentimentConfig[]> {
    let query = 'SELECT * FROM sentiment_configs WHERE deleted_at IS NULL';
    const params: any[] = [];

    if (filters?.scope) {
      query += ' AND scope = ?';
      params.push(filters.scope);
    }

    if (filters?.scopeId) {
      query += ' AND scope_id = ?';
      params.push(filters.scopeId);
    }

    if (filters?.enabled !== undefined) {
      query += ' AND enabled = ?';
      params.push(filters.enabled);
    }

    query += ' ORDER BY created_at DESC';

    const results = await db.query(query, params);
    return results.map(row => this.deserializeConfig(row));
  }

  /**
   * Get configuration by ID
   */
  async getConfigById(id: string): Promise<SentimentConfig | null> {
    const query = 'SELECT * FROM sentiment_configs WHERE id = ? AND deleted_at IS NULL';
    const results = await db.query(query, [id]);
    if (results.length === 0) return null;
    return this.deserializeConfig(results[0]);
  }

  /**
   * Create new configuration
   */
  async createConfig(
    request: CreateSentimentConfigRequest,
    userId: string
  ): Promise<SentimentConfig> {
    const id = uuidv4();

    const config: SentimentConfig = {
      id,
      name: request.name,
      description: request.description,
      scope: request.scope,
      scopeId: request.scopeId,
      mode: request.mode,
      version: 1,
      enabled: true,
      model: request.model,
      thresholds: request.thresholds,
      labelMapping: request.labelMapping,
      derivedMetrics: request.derivedMetrics,
      sampling: request.sampling,
      feedback: request.feedback,
      driftDetection: request.driftDetection,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.insertConfig(config);
    await this.logAudit(id, userId, 'create', undefined, 1);

    return config;
  }

  /**
   * Update configuration (creates new version)
   */
  async updateConfig(
    id: string,
    request: UpdateSentimentConfigRequest,
    userId: string
  ): Promise<SentimentConfig> {
    const existingConfig = await this.getConfigById(id);
    if (!existingConfig) {
      throw new Error('Configuration not found');
    }

    const newVersion = existingConfig.version + 1;

    const updatedConfig: SentimentConfig = {
      ...existingConfig,
      ...request,
      version: newVersion,
      updatedAt: new Date(),
    };

    await this.insertConfig(updatedConfig);
    await this.logAudit(id, userId, 'update', existingConfig.version, newVersion, request.reason);

    return updatedConfig;
  }

  /**
   * Enable/disable configuration
   */
  async toggleConfig(id: string, enabled: boolean, userId: string): Promise<void> {
    await db.query('UPDATE sentiment_configs SET enabled = ?, updated_at = NOW() WHERE id = ?', [
      enabled,
      id,
    ]);

    await this.logAudit(id, userId, enabled ? 'enable' : 'disable');
  }

  /**
   * Soft delete configuration
   */
  async deleteConfig(id: string, userId: string): Promise<void> {
    await db.query('UPDATE sentiment_configs SET deleted_at = NOW() WHERE id = ?', [id]);
    await this.logAudit(id, userId, 'delete');
  }

  /**
   * Rollback to previous version
   */
  async rollbackConfig(id: string, toVersion: number, userId: string): Promise<SentimentConfig> {
    const query = 'SELECT * FROM sentiment_configs WHERE id = ? AND version = ? AND deleted_at IS NULL';
    const results = await db.query(query, [id, toVersion]);

    if (results.length === 0) {
      throw new Error(`Version ${toVersion} not found`);
    }

    const oldConfig = this.deserializeConfig(results[0]);
    const newVersion = (await this.getConfigById(id))!.version + 1;

    const restoredConfig: SentimentConfig = {
      ...oldConfig,
      version: newVersion,
      updatedAt: new Date(),
    };

    await this.insertConfig(restoredConfig);
    await this.logAudit(id, userId, 'rollback', undefined, newVersion, `Rolled back to version ${toVersion}`);

    return restoredConfig;
  }

  /**
   * Get audit history
   */
  async getAuditHistory(configId: string): Promise<SentimentConfigAudit[]> {
    const query = `
      SELECT * FROM sentiment_config_audit
      WHERE config_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const results = await db.query(query, [configId]);
    return results.map(row => ({
      id: row.id,
      configId: row.config_id,
      userId: row.user_id,
      action: row.action,
      previousVersion: row.previous_version,
      newVersion: row.new_version,
      diff: row.diff ? JSON.parse(row.diff) : undefined,
      reason: row.reason,
      createdAt: new Date(row.created_at),
    }));
  }

  /**
   * Helper: Insert configuration into DB
   */
  private async insertConfig(config: SentimentConfig): Promise<void> {
    const query = `
      INSERT INTO sentiment_configs (
        id, name, description, scope, scope_id, mode, version, enabled,
        model_config, threshold_config, label_mapping, derived_metrics_config,
        sampling_config, feedback_config, drift_detection_config,
        parent_config_id, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(query, [
      config.id,
      config.name,
      config.description,
      config.scope,
      config.scopeId,
      config.mode,
      config.version,
      config.enabled,
      JSON.stringify(config.model),
      JSON.stringify(config.thresholds),
      config.labelMapping ? JSON.stringify(config.labelMapping) : null,
      config.derivedMetrics ? JSON.stringify(config.derivedMetrics) : null,
      config.sampling ? JSON.stringify(config.sampling) : null,
      config.feedback ? JSON.stringify(config.feedback) : null,
      config.driftDetection ? JSON.stringify(config.driftDetection) : null,
      config.parentConfigId,
      config.createdBy,
      config.createdAt,
      config.updatedAt,
    ]);
  }

  /**
   * Helper: Deserialize DB row to config object
   */
  private deserializeConfig(row: any): SentimentConfig {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      scope: row.scope,
      scopeId: row.scope_id,
      mode: row.mode,
      version: row.version,
      enabled: Boolean(row.enabled),
      model: JSON.parse(row.model_config),
      thresholds: JSON.parse(row.threshold_config),
      labelMapping: row.label_mapping ? JSON.parse(row.label_mapping) : undefined,
      derivedMetrics: row.derived_metrics_config ? JSON.parse(row.derived_metrics_config) : undefined,
      sampling: row.sampling_config ? JSON.parse(row.sampling_config) : undefined,
      feedback: row.feedback_config ? JSON.parse(row.feedback_config) : undefined,
      driftDetection: row.drift_detection_config ? JSON.parse(row.drift_detection_config) : undefined,
      parentConfigId: row.parent_config_id,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
    };
  }

  /**
   * Helper: Log audit entry
   */
  private async logAudit(
    configId: string,
    userId: string,
    action: SentimentConfigAudit['action'],
    previousVersion?: number,
    newVersion?: number,
    reason?: string
  ): Promise<void> {
    const query = `
      INSERT INTO sentiment_config_audit (
        id, config_id, user_id, action, previous_version, new_version, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await db.query(query, [uuidv4(), configId, userId, action, previousVersion, newVersion, reason]);
  }
}
