const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const { getProxyManager } = require('../lib/ProxyManager.cjs');
const mcpService = require('./mcp-service.cjs');
const logger = require('../utils/logger.cjs');
const config = require('../config.cjs');

/**
 * MCP Manager - 管理所有 MCP 服务实例
 * 负责启动、停止、调用 MCP 服务
 *
 * 重构说明：
 * - 支持多用户隔离（使用 userId:serviceId 作为key）
 * - 从数据库加载用户MCP配置
 * - 支持热重载（用户启用/禁用服务时动态调整）
 */
class MCPManager extends EventEmitter {
  constructor() {
    super();
    this.services = new Map(); // 服务配置和工具列表 (key: "userId:serviceId")
    this.processes = new Map(); // 服务进程 (key: "userId:serviceId")
    this.pendingRequests = new Map(); // 待处理的请求
    this.requestId = 1;
    this.proxyManager = getProxyManager(); // 代理管理器
    this.userServicesLoaded = new Set(); // 已加载服务的用户ID集合
    this.userServicesLoading = new Map(); // 正在加载的用户ID -> Promise映射（防止并发加载）
  }

  /**
   * 生成服务键（用户隔离）
   * @param {number} userId - 用户ID
   * @param {string} serviceId - 服务ID
   * @returns {string} 复合键
   */
  _getServiceKey(userId, serviceId) {
    return `${userId}:${serviceId}`;
  }

  /**
   * 解析服务键
   * @param {string} key - 复合键
   * @returns {Object} { userId, serviceId }
   */
  _parseServiceKey(key) {
    const [userId, serviceId] = key.split(':');
    return { userId: parseInt(userId), serviceId };
  }

  /**
   * 从数据库加载并启动用户的所有已启用MCP服务（带并发加载保护）
   * @param {number} userId - 用户ID
   * @returns {Promise<void>}
   */
  async loadUserServices(userId) {
    // 如果已经加载完成，直接返回
    if (this.userServicesLoaded.has(userId)) {
      logger.info(`[MCP Manager] 用户 ${userId} 的服务已加载，跳过`);
      return;
    }

    // 如果正在加载，等待现有的加载完成
    if (this.userServicesLoading.has(userId)) {
      logger.info(`[MCP Manager] 用户 ${userId} 的服务正在加载中，等待完成...`);
      return await this.userServicesLoading.get(userId);
    }

    // 创建加载Promise
    const loadingPromise = (async () => {
      try {
        logger.info(`[MCP Manager] 开始加载用户 ${userId} 的MCP服务`);

        // 从数据库获取已启用的服务
        const enabledServices = await mcpService.getEnabledServices(userId);

        logger.info(`[MCP Manager] 用户 ${userId} 有 ${enabledServices.length} 个已启用的服务`);

        // 启动每个服务
        const startResults = [];
        for (const service of enabledServices) {
          try {
            const serviceConfig = {
              id: service.mcp_id,
              name: service.name,
              description: service.description || '',
              command: service.command,
              args: service.args || [],
              env: service.env_vars || {},
              enabled: true,
              autoLoad: true,
              category: service.category,
              icon: service.icon,
              official: service.official,
              popularity: service.popularity,
              userId: userId // 添加用户ID
            };

            await this.startService(serviceConfig);
            logger.info(`[MCP Manager] ✅ 用户 ${userId} 的服务 ${service.name} 启动成功`);
            startResults.push({ service: service.name, success: true });
          } catch (error) {
            logger.error(`[MCP Manager] ❌ 用户 ${userId} 的服务 ${service.name} 启动失败:`, error);
            startResults.push({ service: service.name, success: false, error: error.message });
            // 继续启动其他服务
          }
        }

        // 标记为已加载（即使部分服务启动失败）
        this.userServicesLoaded.add(userId);

        const successCount = startResults.filter(r => r.success).length;
        const totalCount = startResults.length;
        logger.info(`[MCP Manager] 用户 ${userId} 的MCP服务加载完成: ${successCount}/${totalCount} 成功`);

        return { success: true, results: startResults };
      } catch (error) {
        logger.error(`[MCP Manager] 加载用户 ${userId} 的MCP服务失败:`, error);
        throw error;
      } finally {
        // 清理加载状态
        this.userServicesLoading.delete(userId);
      }
    })();

    // 保存加载Promise
    this.userServicesLoading.set(userId, loadingPromise);

    return await loadingPromise;
  }

  /**
   * 重新加载用户的MCP服务（热重载）
   * @param {number} userId - 用户ID
   */
  async reloadUserServices(userId) {
    logger.info(`[MCP Manager] 重新加载用户 ${userId} 的MCP服务`);

    // 停止该用户的所有服务
    await this.stopUserServices(userId);

    // 从已加载集合中移除
    this.userServicesLoaded.delete(userId);

    // 重新加载
    await this.loadUserServices(userId);
  }

  /**
   * 停止用户的所有服务
   * @param {number} userId - 用户ID
   */
  async stopUserServices(userId) {
    const userPrefix = `${userId}:`;

    for (const [key] of this.processes) {
      if (key.startsWith(userPrefix)) {
        const { serviceId } = this._parseServiceKey(key);
        await this.stopService(serviceId, userId);
      }
    }

    logger.info(`[MCP Manager] 用户 ${userId} 的所有服务已停止`);
  }

  /**
   * 启动 MCP 服务
   * @param {Object} serviceConfig - 服务配置
   * @param {number} serviceConfig.userId - 用户ID（可选，用于多用户隔离）
   */
  async startService(serviceConfig) {
    const { id, command, args = [], env = {}, enabled = true, autoLoad = true, userId = null } = serviceConfig;

    if (!enabled || !autoLoad) {
      console.log(`[MCP Manager] 跳过服务: ${id} (enabled=${enabled}, autoLoad=${autoLoad})`);
      return;
    }

    // 生成服务键（支持用户隔离）
    const serviceKey = userId ? this._getServiceKey(userId, id) : id;

    try {
      console.log(`[MCP Manager] 启动服务: ${serviceKey}`);

      // 获取用户配置的路径（如果有）
      let finalArgs = [...args];
      const configStorage = require('./config-storage.cjs');
      const userConfig = configStorage.getServiceConfig(id);

      // 为SQLite和Filesystem服务应用用户配置
      if (id === 'sqlite' && userConfig && userConfig.databasePath) {
        console.log(`[MCP Manager] 使用自定义数据库路径: ${userConfig.databasePath}`);
        finalArgs = ['-y', 'mcp-sqlite', userConfig.databasePath];
      } else if (id === 'filesystem' && userConfig && userConfig.allowedDirectories && userConfig.allowedDirectories.length > 0) {
        console.log(`[MCP Manager] 使用自定义允许目录: ${userConfig.allowedDirectories.join(', ')}`);
        finalArgs = ['-y', '@modelcontextprotocol/server-filesystem', ...userConfig.allowedDirectories];
      }

      console.log(`[MCP Manager] 命令: ${command} ${finalArgs.join(' ')}`);

      // 获取代理配置
      await this.proxyManager.initialize();
      const proxyInfo = await this.proxyManager.getProxyInfo();

      // 合并环境变量,包括代理配置
      const processEnv = {
        ...process.env,
        ...env
      };

      // 如果有代理,添加代理环境变量
      if (proxyInfo.system && proxyInfo.system.enabled) {
        const proxyUrl = proxyInfo.system.url;
        processEnv.HTTP_PROXY = proxyUrl;
        processEnv.HTTPS_PROXY = proxyUrl;
        processEnv.http_proxy = proxyUrl;
        processEnv.https_proxy = proxyUrl;

        // 添加Node.js特定的代理配置
        processEnv.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // 允许自签名证书（开发环境）

        // 为某些MCP服务添加额外的代理配置
        if (id === 'wikipedia' || id === 'brave_search' || id === 'github') {
          // 这些服务需要额外的代理配置
          processEnv.GLOBAL_AGENT_HTTP_PROXY = proxyUrl;
          processEnv.GLOBAL_AGENT_HTTPS_PROXY = proxyUrl;
          processEnv.GLOBAL_AGENT_NO_PROXY = 'localhost,127.0.0.1';
        }

        console.log(`[MCP Manager] ${serviceKey} 使用代理: ${proxyUrl}`);
      } else {
        console.log(`[MCP Manager] ${serviceKey} 未使用代理`);
      }

      // 启动子进程
      // Windows 系统需要使用 shell: true 或者 .cmd 后缀
      const isWindows = process.platform === 'win32';
      const actualCommand = isWindows && command === 'npx' ? 'npx.cmd' : command;

      const childProcess = spawn(actualCommand, finalArgs, {
        env: processEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: isWindows // Windows 需要 shell
      });

      // 存储进程（使用复合键）
      this.processes.set(serviceKey, childProcess);

      // 设置输出处理
      let stdoutBuffer = '';
      childProcess.stdout.on('data', (data) => {
        stdoutBuffer += data.toString();

        // 处理完整的 JSON 行
        const lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop() || ''; // 保留不完整的行

        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line);
              this.handleResponse(serviceKey, response);
            } catch (err) {
              console.error(`[MCP Manager] ${serviceKey} 解析响应失败:`, line);
            }
          }
        }
      });

      childProcess.stderr.on('data', (data) => {
        console.error(`[MCP Manager] ${serviceKey} stderr:`, data.toString());
      });

      childProcess.on('error', (error) => {
        console.error(`[MCP Manager] ${serviceKey} 进程错误:`, error);
        this.emit('service-error', { serviceKey, id, userId, error });
      });

      childProcess.on('exit', (code, signal) => {
        console.log(`[MCP Manager] ${serviceKey} 进程退出: code=${code}, signal=${signal}`);
        this.processes.delete(serviceKey);
        this.services.delete(serviceKey);
        this.emit('service-exit', { serviceKey, id, userId, code, signal });
      });

      // 等待进程启动
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 初始化 MCP 连接
      await this.initialize(serviceKey);

      // 获取工具列表
      const tools = await this.listTools(serviceKey);

      // 存储服务信息
      this.services.set(serviceKey, {
        config: serviceConfig,
        tools: tools || [],
        status: 'running',
        userId: userId
      });

      console.log(`[MCP Manager] ${serviceKey} 启动成功, 工具数量: ${tools?.length || 0}`);
      this.emit('service-started', { serviceKey, id, userId, tools });

    } catch (error) {
      console.error(`[MCP Manager] 启动服务 ${serviceKey} 失败:`, error);
      throw error;
    }
  }

  /**
   * 停止 MCP 服务
   * @param {string} serviceId - 服务ID
   * @param {number} userId - 用户ID（可选）
   */
  async stopService(serviceId, userId = null) {
    const serviceKey = userId ? this._getServiceKey(userId, serviceId) : serviceId;
    const process = this.processes.get(serviceKey);

    if (process) {
      process.kill();
      this.processes.delete(serviceKey);
      this.services.delete(serviceKey);
      console.log(`[MCP Manager] 服务已停止: ${serviceKey}`);
    } else {
      console.warn(`[MCP Manager] 服务未找到: ${serviceKey}`);
    }
  }

  /**
   * 停止所有服务
   */
  async stopAll() {
    for (const [serviceId] of this.processes) {
      await this.stopService(serviceId);
    }
  }

  /**
   * 初始化 MCP 服务连接
   * @param {string} serviceId - 服务ID
   */
  async initialize(serviceId) {
    try {
      const response = await this.sendRequest(serviceId, {
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            roots: {
              listChanged: true
            },
            sampling: {}
          },
          clientInfo: {
            name: 'ai-life-system',
            version: '1.0.0'
          }
        }
      });

      console.log(`[MCP Manager] ${serviceId} 初始化成功`);

      // 发送 initialized 通知
      const process = this.processes.get(serviceId);
      if (process) {
        const notification = JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized'
        }) + '\n';
        process.stdin.write(notification);
      }

      return response.result;
    } catch (error) {
      console.error(`[MCP Manager] 初始化 ${serviceId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 获取服务的工具列表
   * @param {string} serviceId - 服务ID
   * @returns {Promise<Array>} 工具列表
   */
  async listTools(serviceId) {
    try {
      const response = await this.sendRequest(serviceId, {
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {}
      });

      return response.result?.tools || [];
    } catch (error) {
      console.error(`[MCP Manager] 获取 ${serviceId} 工具列表失败:`, error);
      return [];
    }
  }

  /**
   * 调用 MCP 工具
   * @param {string} serviceId - 服务ID
   * @param {string} toolName - 工具名称
   * @param {Object} params - 工具参数
   * @param {number} userId - 用户ID（可选，用于多用户隔离）
   * @returns {Promise<any>} 工具执行结果
   */
  async callTool(serviceId, toolName, params, userId = null) {
    try {
      // 查找正确的服务键
      let serviceKey = null;

      if (userId) {
        // 如果提供了userId，直接构造服务键
        serviceKey = this._getServiceKey(userId, serviceId);
      } else {
        // 否则搜索所有服务找到匹配的
        for (const [key, service] of this.services) {
          const actualServiceId = key.includes(':')
            ? this._parseServiceKey(key).serviceId
            : key;

          if (actualServiceId === serviceId) {
            serviceKey = key;
            break;
          }
        }
      }

      if (!serviceKey) {
        throw new Error(`服务未找到: ${serviceId}`);
      }

      console.log(`[MCP Manager] 调用工具: ${serviceKey}.${toolName}`);
      console.log(`[MCP Manager] 参数:`, JSON.stringify(params, null, 2));

      // ⚠️ 保护关键文件不被覆盖 & 规范化HTML文件路径
      if (serviceId === 'filesystem' && toolName === 'write_file' && params.path) {
        const fileName = params.path.split(/[/\\]/).pop(); // 跨平台获取文件名

        // 1. 保护关键文件
        const protectedFiles = ['index.html', 'package.json', 'package-lock.json', 'pnpm-lock.yaml'];
        if (protectedFiles.includes(fileName)) {
          params.path = `generated-${fileName}`;
          console.warn(`[MCP Manager] ⚠️ 文件 "${fileName}" 受保护，已重命名为 "generated-${fileName}"`);
        }
        // 2. 规范化HTML文件路径为相对路径（只保留文件名）
        else if (fileName.endsWith('.html')) {
          params.path = fileName;
          console.log(`[MCP Manager] 📝 HTML文件路径已规范化: "${fileName}"`);
        }
      }

      const response = await this.sendRequest(serviceKey, {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: params
        }
      });

      if (response.error) {
        throw new Error(`工具调用失败: ${response.error.message}`);
      }

      console.log(`[MCP Manager] 工具返回:`, JSON.stringify(response.result, null, 2));
      return response.result;

    } catch (error) {
      console.error(`[MCP Manager] 调用工具失败: ${serviceId}.${toolName}`, error);
      throw error;
    }
  }

  /**
   * 发送请求到 MCP 服务
   * @param {string} serviceId - 服务ID
   * @param {Object} request - MCP 请求
   * @returns {Promise<Object>} MCP 响应
   */
  async sendRequest(serviceId, request) {
    const process = this.processes.get(serviceId);
    if (!process) {
      throw new Error(`服务未运行: ${serviceId}`);
    }

    // 生成请求ID
    const id = this.requestId++;
    request.id = id;

    // 创建 Promise 等待响应
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`请求超时: ${serviceId}`));
      }, 60000); // 60秒超时（某些服务如 puppeteer 需要下载大文件）

      this.pendingRequests.set(id, { resolve, reject, timeout });

      // 发送请求
      const requestStr = JSON.stringify(request) + '\n';
      process.stdin.write(requestStr);
    });
  }

  /**
   * 处理 MCP 服务的响应
   * @param {string} serviceId - 服务ID
   * @param {Object} response - MCP 响应
   */
  handleResponse(serviceId, response) {
    const { id } = response;
    const pending = this.pendingRequests.get(id);

    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(id);
      pending.resolve(response);
    }
  }

  /**
   * 获取所有可用的工具(用于 Function Calling)
   * @param {number} userId - 用户ID（可选，如果提供则只返回该用户的工具）
   * @returns {Array} 所有工具列表
   */
  getAllTools(userId = null) {
    const allTools = [];

    for (const [serviceKey, service] of this.services) {
      if (service.status !== 'running') continue;

      // 如果指定了userId，只返回该用户的服务
      if (userId && service.userId !== userId) continue;

      // 解析服务键以获取实际的serviceId
      const actualServiceId = serviceKey.includes(':')
        ? this._parseServiceKey(serviceKey).serviceId
        : serviceKey;

      for (const tool of service.tools) {
        allTools.push({
          type: 'function',
          function: {
            name: `${actualServiceId}_${tool.name}`, // 添加服务前缀
            description: tool.description || '',
            parameters: tool.inputSchema || {
              type: 'object',
              properties: {},
              required: []
            }
          },
          // 保存原始信息用于调用
          _serviceId: actualServiceId,
          _toolName: tool.name,
          _serviceKey: serviceKey, // 保存完整的服务键用于调用
          _userId: service.userId
        });
      }
    }

    return allTools;
  }

  /**
   * 解析工具全名,提取服务ID和工具名
   * @param {string} fullToolName - 完整工具名 (格式: serviceId_toolName)
   * @returns {Object} { serviceId, toolName }
   */
  parseToolName(fullToolName) {
    // 首先尝试从工具列表中查找,使用存储的元数据
    const allTools = this.getAllTools();
    const tool = allTools.find(t => t.function.name === fullToolName);

    if (tool && tool._serviceId && tool._toolName) {
      return {
        serviceId: tool._serviceId,
        toolName: tool._toolName
      };
    }

    // 如果找不到,回退到字符串分割(向后兼容)
    const parts = fullToolName.split('_');
    const serviceId = parts[0];
    const toolName = parts.slice(1).join('_');
    return { serviceId, toolName };
  }

  /**
   * 获取服务状态
   * @returns {Array} 服务状态列表
   */
  getStatus() {
    const status = [];

    for (const [serviceId, service] of this.services) {
      status.push({
        id: serviceId,
        name: service.config.name,
        status: service.status,
        toolCount: service.tools.length,
        tools: service.tools.map(t => t.name)
      });
    }

    return status;
  }

  /**
   * 检查服务是否已正确配置（有必需的 API Keys）
   * @param {string} serviceId - 服务ID
   * @param {Object} userEnvVars - 用户配置的环境变量
   * @returns {boolean} 是否已配置
   */
  _isServiceConfigured(serviceId, userEnvVars) {
    // 获取服务的配置模板
    const serviceTemplate = config.services[serviceId];

    // 如果服务不存在于 config.cjs 中，认为是用户自定义服务，默认已配置
    if (!serviceTemplate) {
      return true;
    }

    // 如果服务不需要配置，直接返回 true
    if (!serviceTemplate.requiresConfig) {
      return true;
    }

    // 检查必需的环境变量是否已配置
    const requiredEnvKeys = Object.keys(serviceTemplate.env || {});

    // 如果没有必需的环境变量，返回 true
    if (requiredEnvKeys.length === 0) {
      return true;
    }

    // 解析用户配置的环境变量
    let parsedEnvVars = {};
    try {
      parsedEnvVars = typeof userEnvVars === 'string' ? JSON.parse(userEnvVars) : (userEnvVars || {});
    } catch (e) {
      return false;
    }

    // 检查所有必需的环境变量是否都有值
    for (const key of requiredEnvKeys) {
      const value = parsedEnvVars[key];
      // 如果值为空字符串或 undefined/null，认为未配置
      if (!value || value.trim() === '') {
        return false;
      }
    }

    return true;
  }

  /**
   * 获取MCP服务信息（用于前端显示）
   * 返回所有配置的服务，不仅仅是正在运行的
   * @param {number} userId - 用户ID（必需，用于读取用户的MCP配置）
   * @returns {Promise<Object>} 服务信息
   */
  async getInfo(userId) {
    const allConfiguredServices = [];

    try {
      // 从数据库获取用户的所有MCP配置
      const userServices = await mcpService.getUserServices(userId);

      for (const serviceConfig of userServices) {
        const serviceId = serviceConfig.mcp_id;
        const serviceKey = this._getServiceKey(userId, serviceId);

        // 检查服务是否正在运行
        const runningService = this.services.get(serviceKey);
        const status = runningService ? runningService.status : 'stopped';
        const tools = runningService ? runningService.tools : [];

        // ✅ 检查服务是否已正确配置（有必需的 API Keys）
        const isConfigured = this._isServiceConfigured(serviceId, serviceConfig.env_vars);

        allConfiguredServices.push({
          id: serviceId,
          dbId: serviceConfig.id, // 数据库ID用于更新/删除
          name: serviceConfig.name,
          description: serviceConfig.description || '',
          enabled: serviceConfig.enabled,
          status: status, // 'running' or 'stopped'
          loaded: status === 'running',
          isConfigured: isConfigured, // ✅ 新增：是否已配置必需的环境变量
          official: serviceConfig.official,
          category: serviceConfig.category || 'other',
          icon: serviceConfig.icon || '🔧',
          popularity: serviceConfig.popularity || 'medium',
          toolCount: tools.length,
          tools: tools.map(t => ({
            name: t.name,
            description: t.description || ''
          })),
          features: serviceConfig.features || [],
          setupInstructions: serviceConfig.setup_instructions || {},
          documentation: serviceConfig.documentation || '',
          createdAt: serviceConfig.created_at,
          updatedAt: serviceConfig.updated_at
        });
      }

      return {
        id: 'mcp',
        name: 'MCP服务管理器',
        description: '管理所有MCP服务',
        enabled: true,
        loaded: true,
        userId: userId,
        services: allConfiguredServices
      };
    } catch (error) {
      logger.error(`[MCP Manager] 获取用户 ${userId} 的服务信息失败:`, error);
      return {
        id: 'mcp',
        name: 'MCP服务管理器',
        description: '管理所有MCP服务',
        enabled: true,
        loaded: false,
        userId: userId,
        services: [],
        error: error.message
      };
    }
  }
}

module.exports = MCPManager;

