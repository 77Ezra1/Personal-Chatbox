const { v4: uuidv4 } = require('uuid');
const AgentEngine = require('./agentEngine.cjs');

/**
 * Agent 模板服务
 * 负责模板的创建、版本管理和应用
 */
class AgentTemplateService {
  constructor() {
    const { db } = require('../db/init.cjs');
    this.db = db;
    this.agentEngine = new AgentEngine();
    this.systemTemplatesSeeded = false;
    this.systemTemplateSeedPromise = null;

    this.SYSTEM_TEMPLATES = [
      {
        id: 'tpl-system-research',
        name: '研究分析助手',
        description: '适用于调研、资料汇总、报告初稿的助手模板',
        category: 'research',
        tags: ['research', 'analysis', 'report'],
        capabilities: ['research', 'analysis', 'writing'],
        tools: ['web_search', 'ai_analysis'],
        config: {
          systemPrompt: '你是一名专业的研究助手，擅长信息检索、资料整合与报告撰写。',
          maxConcurrentTasks: 2,
          retryAttempts: 2,
          stopOnError: false,
          temperature: 0.4,
          model: 'gpt-4o-mini'
        }
      },
      {
        id: 'tpl-system-writer',
        name: '写作创作助手',
        description: '覆盖文章创作、内容润色、SEO 优化等场景',
        category: 'writing',
        tags: ['writing', 'seo', 'content'],
        capabilities: ['writing', 'editing', 'seo'],
        tools: ['ai_analysis', 'web_search'],
        config: {
          systemPrompt: '你是一名资深内容创作者，善于撰写结构清晰、可读性强的文章。',
          maxConcurrentTasks: 3,
          retryAttempts: 1,
          stopOnError: false,
          temperature: 0.7,
          model: 'gpt-4o-mini'
        }
      },
      {
        id: 'tpl-system-automation',
        name: '流程执行助手',
        description: '适用于重复性任务、高频流程的自动化执行',
        category: 'automation',
        tags: ['automation', 'workflow'],
        capabilities: ['execution', 'checklist'],
        tools: ['ai_analysis', 'command_runner'],
        config: {
          systemPrompt: '你是一名流程执行助手，能够根据步骤逐项完成任务并记录结果。',
          maxConcurrentTasks: 4,
          retryAttempts: 3,
          stopOnError: true,
          temperature: 0.2,
          model: 'gpt-4o-mini'
        }
      },
      {
        id: 'tpl-system-summary',
        name: '会议纪要助手',
        description: '聚焦会议/长文内容整理，输出结构化纪要',
        category: 'summary',
        tags: ['summary', 'analysis'],
        capabilities: ['summary', 'structuring'],
        tools: ['ai_analysis'],
        config: {
          systemPrompt: '你是一名会议纪要专家，请将信息提炼为要点，突出行动项和时间节点。',
          maxConcurrentTasks: 1,
          retryAttempts: 1,
          stopOnError: false,
          temperature: 0.3,
          model: 'gpt-4o-mini'
        }
      },
      {
        id: 'tpl-system-support',
        name: '客服响应助手',
        description: '适合标准化问答、用户反馈整理与建议输出',
        category: 'support',
        tags: ['support', 'qa'],
        capabilities: ['qa', 'tone-control'],
        tools: ['ai_analysis', 'knowledge_base'],
        config: {
          systemPrompt: '你是一名客服助手，请以礼貌、专业的语气回答用户问题，并在需要时引用知识库内容。',
          maxConcurrentTasks: 2,
          retryAttempts: 2,
          stopOnError: false,
          temperature: 0.5,
          model: 'gpt-4o-mini'
        }
      }
    ];
  }

  async ensureSystemTemplates() {
    if (this.systemTemplatesSeeded) {
      return;
    }
    if (!this.systemTemplateSeedPromise) {
      this.systemTemplateSeedPromise = this.#seedSystemTemplates();
    }
    await this.systemTemplateSeedPromise;
    this.systemTemplatesSeeded = true;
  }

  async #seedSystemTemplates() {
    for (const tpl of this.SYSTEM_TEMPLATES) {
      const existing = await new Promise((resolve, reject) => {
        this.db.get(
          'SELECT id, latest_version_id FROM agent_templates WHERE id = ?',
          [tpl.id],
          (err, row) => err ? reject(err) : resolve(row)
        );
      });

      if (existing) {
        continue;
      }

      const templateId = tpl.id;
      const versionId = uuidv4();
      const versionNumber = 1;

      const configSnapshot = JSON.stringify({
        name: tpl.name,
        description: tpl.description,
        capabilities: tpl.capabilities,
        tools: tpl.tools,
        config: tpl.config
      });

      await new Promise((resolve, reject) => {
        this.db.run(
          `INSERT INTO agent_templates (
            id, user_id, name, description, template_type, category, tags,
            config_snapshot, latest_version_id, is_active, usage_count, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            templateId,
            0,
            tpl.name,
            tpl.description,
            'system',
            tpl.category || null,
            JSON.stringify(tpl.tags || []),
            configSnapshot,
            versionId,
            this.#boolToDb(true),
            0
          ],
          err => err ? reject(err) : resolve(true)
        );
      });

      await new Promise((resolve, reject) => {
        this.db.run(
          `INSERT INTO agent_template_versions (
            id, template_id, version, config_snapshot, change_summary, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            versionId,
            templateId,
            versionNumber,
            configSnapshot,
            '系统预置模板初始版本',
            null
          ],
          err => err ? reject(err) : resolve(true)
        );
      });
    }
  }

  async listTemplates(userId, options = {}) {
    await this.ensureSystemTemplates();
    const {
      includeSystem = true,
      includeCustom = true,
      search = '',
      limit = 50,
      offset = 0
    } = options;

    const conditions = [];
    const params = [];

    const filters = [];

    if (includeSystem && includeCustom) {
      filters.push('(t.template_type = ? OR t.user_id = ?)');
      params.push('system', userId);
    } else if (includeSystem) {
      filters.push('t.template_type = ?');
      params.push('system');
    } else if (includeCustom) {
      filters.push('t.user_id = ?');
      params.push(userId);
    } else {
      // 默认返回空
      return [];
    }

    if (search) {
      filters.push('(t.name LIKE ? OR t.description LIKE ?)');
      const keyword = `%${search}%`;
      params.push(keyword, keyword);
    }

    conditions.push(filters.join(' AND '));

    const sql = `
      SELECT
        t.*,
        v.version AS latest_version_number,
        v.config_snapshot AS latest_config_snapshot
      FROM agent_templates t
      LEFT JOIN agent_template_versions v ON v.id = t.latest_version_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY t.template_type ASC, t.updated_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const rows = await new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, results) => err ? reject(err) : resolve(results || []));
    });
    return rows.map(row => this.#formatTemplateRow(row));
  }

  async getTemplate(templateId, userId) {
    await this.ensureSystemTemplates();
    const row = await new Promise((resolve, reject) => {
      this.db.get(
        `SELECT
           t.*,
           v.version AS latest_version_number,
           v.config_snapshot AS latest_config_snapshot
         FROM agent_templates t
         LEFT JOIN agent_template_versions v ON v.id = t.latest_version_id
         WHERE t.id = ?
           AND (t.template_type = 'system' OR t.user_id = ?)`,
        [templateId, userId],
        (err, result) => err ? reject(err) : resolve(result)
      );
    });

    if (!row) {
      return null;
    }

    const template = this.#formatTemplateRow(row);
    template.versions = await this.listTemplateVersions(templateId, userId);
    return template;
  }

  async listTemplateVersions(templateId, userId) {
    const rows = await new Promise((resolve, reject) => {
      this.db.all(
        `SELECT id, version, config_snapshot, change_summary, created_by, created_at
         FROM agent_template_versions
         WHERE template_id = ?
         ORDER BY version DESC`,
        [templateId],
        (err, results) => err ? reject(err) : resolve(results || [])
      );
    });

    return rows.map(row => ({
      id: row.id,
      version: Number(row.version),
      changeSummary: row.change_summary || '',
      createdBy: row.created_by || null,
      createdAt: row.created_at,
      config: this.#parseJson(row.config_snapshot)
    }));
  }

  async createTemplate(userId, templateData) {
    if (!templateData?.name) {
      throw new Error('模板名称不能为空');
    }
    if (!templateData?.config) {
      throw new Error('模板配置不能为空');
    }

    const templateId = uuidv4();
    const versionId = uuidv4();
    const versionNumber = 1;

    const configSnapshot = JSON.stringify(templateData.config);
    const tags = Array.isArray(templateData.tags) ? templateData.tags : [];

    await new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO agent_templates (
          id, user_id, name, description, template_type, category, tags,
          config_snapshot, latest_version_id, is_active, usage_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          templateId,
          userId,
          templateData.name,
          templateData.description || '',
          'custom',
          templateData.category || null,
          JSON.stringify(tags),
          configSnapshot,
          versionId,
          this.#boolToDb(true),
          0
        ],
        err => err ? reject(err) : resolve(true)
      );
    });

    await new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO agent_template_versions (
          id, template_id, version, config_snapshot, change_summary, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          versionId,
          templateId,
          versionNumber,
          configSnapshot,
          templateData.changeSummary || '初始版本',
          userId
        ],
        err => err ? reject(err) : resolve(true)
      );
    });

    return this.getTemplate(templateId, userId);
  }

  async saveTemplateFromAgent(agentId, userId, options = {}) {
    const agent = await this.agentEngine.getAgent(agentId, userId);
    if (!agent) {
      throw new Error('Agent 不存在或无权访问');
    }

    const templateName = options.name || `${agent.name} 模板`;
    const templateDescription = options.description || agent.description || '';
    const templateTags = options.tags || [];
    const category = options.category || null;

    const templateConfig = {
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      capabilities: agent.capabilities || [],
      tools: agent.tools || [],
      config: agent.config || {},
      avatarUrl: agent.avatarUrl || null
    };

    return await this.createTemplate(userId, {
      name: templateName,
      description: templateDescription,
      tags: templateTags,
      category,
      config: templateConfig,
      changeSummary: options.changeSummary || '从 Agent 保存模板'
    });
  }

  async applyTemplate(templateId, userId, options = {}) {
    const template = await this.getTemplate(templateId, userId);
    if (!template) {
      throw new Error('模板不存在或无权访问');
    }

    await new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE agent_templates SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [templateId],
        err => err ? reject(err) : resolve(true)
      );
    });

    const config = { ...template.latestConfig };

    if (options.overrideName) {
      config.name = options.overrideName;
    }

    return {
      templateId,
      templateName: template.name,
      version: template.latestVersion?.version || 1,
      config
    };
  }

  async createAgentFromTemplate(templateId, userId, overrides = {}) {
    const applied = await this.applyTemplate(templateId, userId, overrides);
    const config = applied.config || {};

    const agentPayload = {
      name: overrides.agentName || config.name || `${applied.templateName} 实例`,
      description: overrides.description || config.description || '',
      systemPrompt: overrides.systemPrompt || config.systemPrompt,
      capabilities: overrides.capabilities || config.capabilities || [],
      tools: overrides.tools || config.tools || [],
      config: {
        ...config.config,
        ...overrides.config
      },
      avatarUrl: overrides.avatarUrl || config.avatarUrl || null
    };

    const agent = await this.agentEngine.createAgent(userId, agentPayload);
    return {
      agent,
      template: applied
    };
  }

  async deleteTemplate(templateId, userId) {
    const template = await new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id FROM agent_templates WHERE id = ? AND user_id = ?',
        [templateId, userId],
        (err, row) => err ? reject(err) : resolve(row)
      );
    });
    if (!template) {
      throw new Error('模板不存在或无权访问');
    }

    await new Promise((resolve, reject) => {
      this.db.run('DELETE FROM agent_templates WHERE id = ?', [templateId], err => err ? reject(err) : resolve(true));
    });
    await new Promise((resolve, reject) => {
      this.db.run('DELETE FROM agent_template_versions WHERE template_id = ?', [templateId], err => err ? reject(err) : resolve(true));
    });
    return true;
  }

  async createNewVersion(templateId, userId, config, changeSummary = '更新版本') {
    const template = await new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM agent_templates WHERE id = ? AND (template_type = \'system\' OR user_id = ?)',
        [templateId, userId],
        (err, row) => err ? reject(err) : resolve(row)
      );
    });
    if (!template) {
      throw new Error('模板不存在或无权访问');
    }

    const versionCountRow = await new Promise((resolve, reject) => {
      this.db.get(
        'SELECT COUNT(*) as count FROM agent_template_versions WHERE template_id = ?',
        [templateId],
        (err, row) => err ? reject(err) : resolve(row)
      );
    });
    const versionNumber = Number(versionCountRow?.count || 0) + 1;
    const versionId = uuidv4();
    const configSnapshot = JSON.stringify(config);

    await new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO agent_template_versions (
          id, template_id, version, config_snapshot, change_summary, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [versionId, templateId, versionNumber, configSnapshot, changeSummary, userId],
        err => err ? reject(err) : resolve(true)
      );
    });

    await new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE agent_templates
         SET latest_version_id = ?, config_snapshot = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [versionId, configSnapshot, templateId],
        err => err ? reject(err) : resolve(true)
      );
    });

    // 保留最近 5 个版本
    await this.#trimTemplateVersions(templateId, 5);

    return this.getTemplate(templateId, userId);
  }

  async #trimTemplateVersions(templateId, keep = 5) {
    const rows = await new Promise((resolve, reject) => {
      this.db.all(
        `SELECT id
         FROM agent_template_versions
         WHERE template_id = ?
         ORDER BY version DESC
         LIMIT -1 OFFSET ?`,
        [templateId, keep],
        (err, results) => err ? reject(err) : resolve(results || [])
      );
    });

    if (rows && rows.length > 0) {
      const ids = rows.map(row => row.id);
      const placeholders = ids.map(() => '?').join(', ');
      await new Promise((resolve, reject) => {
        this.db.run(
          `DELETE FROM agent_template_versions WHERE id IN (${placeholders})`,
          ids,
          err => err ? reject(err) : resolve(true)
        );
      });
    }
  }

  #formatTemplateRow(row) {
    const latestConfig = this.#parseJson(row.latest_config_snapshot || row.config_snapshot);
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description || '',
      templateType: row.template_type || 'custom',
      category: row.category || null,
      tags: this.#parseJson(row.tags) || [],
      isActive: this.#dbToBool(row.is_active),
      usageCount: Number(row.usage_count || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      latestVersion: {
        id: row.latest_version_id,
        version: Number(row.latest_version_number || 1)
      },
      latestConfig
    };
  }

  #parseJson(value) {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch (err) {
      return null;
    }
  }

  #boolToDb(value) {
    if (this.db && this.db._driver === 'postgresql') {
      return Boolean(value);
    }
    return value ? 1 : 0;
  }

  #dbToBool(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
    return Boolean(value);
  }
}

module.exports = AgentTemplateService;

