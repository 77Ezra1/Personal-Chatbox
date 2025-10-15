const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const { getProxyManager } = require('../lib/ProxyManager.cjs');

/**
 * MCP Manager - 管理所有 MCP 服务实例
 * 负责启动、停止、调用 MCP 服务
 */
class MCPManager extends EventEmitter {
  constructor() {
    super();
    this.services = new Map(); // 服务配置和工具列表
    this.processes = new Map(); // 服务进程
    this.pendingRequests = new Map(); // 待处理的请求
    this.requestId = 1;
    this.proxyManager = getProxyManager(); // 代理管理器
  }

  /**
   * 启动 MCP 服务
   * @param {Object} serviceConfig - 服务配置
   */
  async startService(serviceConfig) {
    const { id, command, args = [], env = {}, enabled = true, autoLoad = true } = serviceConfig;

    if (!enabled || !autoLoad) {
      console.log(`[MCP Manager] 跳过服务: ${id} (enabled=${enabled}, autoLoad=${autoLoad})`);
      return;
    }

    try {
      console.log(`[MCP Manager] 启动服务: ${id}`);

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

        console.log(`[MCP Manager] ${id} 使用代理: ${proxyUrl}`);
      } else {
        console.log(`[MCP Manager] ${id} 未使用代理`);
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

      // 存储进程
      this.processes.set(id, childProcess);

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
              this.handleResponse(id, response);
            } catch (err) {
              console.error(`[MCP Manager] ${id} 解析响应失败:`, line);
            }
          }
        }
      });

      childProcess.stderr.on('data', (data) => {
        console.error(`[MCP Manager] ${id} stderr:`, data.toString());
      });

      childProcess.on('error', (error) => {
        console.error(`[MCP Manager] ${id} 进程错误:`, error);
        this.emit('service-error', { id, error });
      });

      childProcess.on('exit', (code, signal) => {
        console.log(`[MCP Manager] ${id} 进程退出: code=${code}, signal=${signal}`);
        this.processes.delete(id);
        this.services.delete(id);
        this.emit('service-exit', { id, code, signal });
      });

      // 等待进程启动
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 初始化 MCP 连接
      await this.initialize(id);

      // 获取工具列表
      const tools = await this.listTools(id);

      // 存储服务信息
      this.services.set(id, {
        config: serviceConfig,
        tools: tools || [],
        status: 'running'
      });

      console.log(`[MCP Manager] ${id} 启动成功, 工具数量: ${tools?.length || 0}`);
      this.emit('service-started', { id, tools });

    } catch (error) {
      console.error(`[MCP Manager] 启动服务 ${id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 停止 MCP 服务
   * @param {string} serviceId - 服务ID
   */
  async stopService(serviceId) {
    const process = this.processes.get(serviceId);
    if (process) {
      process.kill();
      this.processes.delete(serviceId);
      this.services.delete(serviceId);
      console.log(`[MCP Manager] 服务已停止: ${serviceId}`);
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
   * @returns {Promise<any>} 工具执行结果
   */
  async callTool(serviceId, toolName, params) {
    try {
      console.log(`[MCP Manager] 调用工具: ${serviceId}.${toolName}`);
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

      const response = await this.sendRequest(serviceId, {
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
      }, 30000); // 30秒超时

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
   * @returns {Array} 所有工具列表
   */
  getAllTools() {
    const allTools = [];

    for (const [serviceId, service] of this.services) {
      if (service.status !== 'running') continue;

      for (const tool of service.tools) {
        allTools.push({
          type: 'function',
          function: {
            name: `${serviceId}_${tool.name}`, // 添加服务前缀
            description: tool.description || '',
            parameters: tool.inputSchema || {
              type: 'object',
              properties: {},
              required: []
            }
          },
          // 保存原始信息用于调用
          _serviceId: serviceId,
          _toolName: tool.name
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
   * 获取MCP服务信息（用于前端显示）
   * @returns {Object} 服务信息
   */
  getInfo() {
    return {
      id: 'mcp',
      name: 'MCP服务管理器',
      description: '管理所有MCP服务',
      enabled: true,
      loaded: true,
      services: Array.from(this.services.entries()).map(([serviceId, service]) => ({
        id: serviceId,
        name: service.config.name || serviceId,
        description: service.config.description || '',
        enabled: service.config.enabled !== false,
        loaded: service.status === 'ready',
        requiresConfig: service.config.requiresConfig || false,
        signupUrl: service.config.signupUrl || null,
        apiKeyPlaceholder: service.config.apiKeyPlaceholder || '输入 API Key',
        toolCount: service.tools.length,
        tools: service.tools.map(t => ({
          name: t.name,
          description: t.description || ''
        }))
      }))
    };
  }
}

module.exports = MCPManager;

