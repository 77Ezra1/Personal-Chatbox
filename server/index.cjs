/**
 * AI-Life-System 后端服务器
 */

// 加载环境变量（必须在最前面）
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const config = require('./config.cjs');
const logger = require('./utils/logger.cjs');
const { errorHandler } = require('./utils/errors.cjs');
const { router: mcpRouter, initializeRouter } = require('./routes/mcp.cjs');
const { router: chatRouter, initializeRouter: initializeChatRouter } = require('./routes/chat.cjs');
const proxyRouter = require('./routes/proxy.cjs');
const authRouter = require('./routes/auth.cjs');

// 导入 MCP Manager
const MCPManager = require('./services/mcp-manager.cjs');

// 导入配置存储
const configStorage = require('./services/config-storage.cjs');

// 导入代理辅助工具
const { setupGlobalProxy } = require('./lib/proxy-helper.cjs');

// 导入环境验证器
const { validateEnvOnStartup, printEnvSummary } = require('./lib/env-validator.cjs');

// 导入服务
const WeatherService = require('./services/weather.cjs');
const TimeService = require('./services/time.cjs');
const SearchService = require('./services/search.cjs');
const GoogleSearchService = require('./services/google-search.cjs');
const YouTubeService = require('./services/youtube.cjs');
const CoincapService = require('./services/coincap.cjs');
const DexscreenerService = require('./services/dexscreener.cjs');
const FetchService = require('./services/fetch.cjs');
const PlaywrightBrowserService = require('./services/playwright-browser.cjs');
const CodeEditorService = require('./services/code-editor.cjs');
const CommandRunnerService = require('./services/command-runner.cjs');
const LinterFormatterService = require('./services/linter-formatter.cjs');
const TestRunnerService = require('./services/test-runner.cjs');

// 创建Express应用
const app = express();

// 导入安全中间件
const {
  securityHeaders,
  authRateLimiter,
  apiRateLimiter,
  xssProtection,
  securityLogger
} = require('./middleware/security.cjs');

// 中间件
// 0. 安全头 - 最先应用
app.use(securityHeaders);

// 0.1 安全日志
app.use(securityLogger);

// 1. Gzip压缩 - 放在最前面以压缩所有响应
app.use(compression({
  // 只压缩大于1KB的响应
  threshold: 1024,
  // 压缩级别 (0-9, 6是平衡性能和压缩率的推荐值)
  level: 6,
  // 过滤函数 - 允许客户端禁用压缩
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    // 使用compression的默认过滤器
    return compression.filter(req, res);
  }
}));

// 2. 请求体解析
app.use(express.json({ limit: '50mb' })); // 增加请求体大小限制，支持大量对话数据
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2.1 XSS防护 - 在body解析后立即应用
app.use(xssProtection);

// 3. Cookie解析
app.use(cookieParser());
app.use(cors({
  ...config.server.cors,
  credentials: true // 允许携带Cookie
}));

// 日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// 服务实例
const services = {};

// MCP Manager 实例
const mcpManager = new MCPManager();

/**
 * 初始化所有服务
 */
async function initializeServices() {
  // 初始化配置存储
  logger.info('初始化配置存储...');
  await configStorage.initialize();

  // 加载并应用代理配置
  logger.info('加载代理配置...');
  try {
    const proxyConfig = await configStorage.getServiceConfig('proxy');
    if (proxyConfig && proxyConfig.enabled) {
      const proxyUrl = `${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`;
      process.env.HTTP_PROXY = proxyUrl;
      process.env.HTTPS_PROXY = proxyUrl;
      process.env.http_proxy = proxyUrl;
      process.env.https_proxy = proxyUrl;
      logger.info(`✅ 已应用用户配置的代理: ${proxyUrl}`);

      // 设置全局代理（为MCP服务提供代理支持）
      await setupGlobalProxy();
      logger.info('✅ 全局代理已设置');
    } else {
      logger.info('ℹ️  未配置代理或代理已禁用');
    }
  } catch (error) {
    logger.warn('加载代理配置失败:', error.message);
  }

  logger.info('初始化MCP服务...');

  try {
    // ========== 初始化原有服务 ==========
    services.weather = new WeatherService(config.services.weather);
    services.time = new TimeService(config.services.time);
    // services.search = new SearchService(config.services.search); // DuckDuckGo搜索 - 已由Phase 1.1搜索功能替代
    services.youtube = new YouTubeService(config.services.youtube);
    services.dexscreener = new DexscreenerService({
      id: 'dexscreener',
      name: 'Dexscreener加密货币',
      description: '获取实时加密货币价格和市场数据',
      enabled: true,
      autoLoad: true
    });
    services.fetch = new FetchService(config.services.fetch);
    services.playwright = new PlaywrightBrowserService(config.services.playwright);
    services.code_editor = new CodeEditorService({});
    services.command_runner = new CommandRunnerService({});
    services.linter_formatter = new LinterFormatterService({});
    services.test_runner = new TestRunnerService({});

    // 初始化自动加载的原有服务
    for (const [id, service] of Object.entries(services)) {
      if (service.enabled && service.initialize) {
        logger.info(`自动加载服务: ${service.name}`);
        try {
          await service.initialize();
        } catch (error) {
          logger.error(`服务${service.name}初始化失败:`, error);
        }
      }
    }

    // ========== 初始化新的 MCP 服务 ==========
    logger.info('启动 MCP Manager...');

    // 启动第一批 MCP 服务 (不需要 API Key) - 并行启动以提高速度
    const mcpServices = [
      'memory',
      'filesystem',
      'git',
      'sequential_thinking',
      'sqlite',
      'wikipedia'
    ];

    // 启动第二批 MCP 服务 (需要 API Key,从配置系统读取)
    const mcpServicesWithConfig = [
      'brave_search',
      'github'
    ];

    // 并行启动第一批服务
    const startPromises = mcpServices.map(async (serviceId) => {
      const serviceConfig = config.services[serviceId];
      if (serviceConfig && serviceConfig.enabled && serviceConfig.autoLoad) {
        try {
          logger.info(`启动 MCP 服务: ${serviceConfig.name}`);
          await mcpManager.startService(serviceConfig);
          return { serviceId, success: true };
        } catch (error) {
          logger.error(`MCP 服务 ${serviceConfig.name} 启动失败:`, error);
          return { serviceId, success: false, error };
        }
      }
      return { serviceId, success: false, skipped: true };
    });

    // 等待所有服务启动完成
    const results = await Promise.all(startPromises);
    const successCount = results.filter(r => r.success).length;
    logger.info(`MCP第一批服务启动完成: ${successCount}/${mcpServices.length} 个成功`);

    // 启动需要 API Key 的服务
    for (const serviceId of mcpServicesWithConfig) {
      const serviceConfig = config.services[serviceId];
      if (serviceConfig && serviceConfig.enabled && serviceConfig.autoLoad) {
        try {
          // 将服务ID映射到配置存储的格式 (brave_search -> braveSearch)
          const configServiceId = serviceId === 'brave_search' ? 'braveSearch' : serviceId;

          // 从配置存储中读取 API Key
          const storedConfig = await configStorage.getServiceConfig(configServiceId);

          if (storedConfig && (storedConfig.apiKey || storedConfig.token)) {
            // 将 API Key 注入到环境变量中
            const configWithKey = { ...serviceConfig };

            // 根据服务类型设置不同的环境变量
            if (serviceId === 'brave_search') {
              configWithKey.env = {
                ...configWithKey.env,
                BRAVE_API_KEY: storedConfig.apiKey
              };
            } else if (serviceId === 'github') {
              configWithKey.env = {
                ...configWithKey.env,
                GITHUB_PERSONAL_ACCESS_TOKEN: storedConfig.token
              };
            }

            logger.info(`启动 MCP 服务: ${serviceConfig.name} (使用配置的 API Key)`);
            await mcpManager.startService(configWithKey);
          } else {
            logger.warn(`MCP 服务 ${serviceConfig.name} 需要配置 API Key,跳过启动`);
          }
        } catch (error) {
          logger.error(`MCP 服务 ${serviceConfig.name} 启动失败:`, error);
          // 继续启动其他服务
        }
      }
    }

    // 将 MCP Manager 添加到 services 中
    services.mcpManager = mcpManager;

    logger.info('服务初始化完成');
    logger.info(`MCP 服务状态:`, mcpManager.getStatus());

    // 初始化路由
    initializeRouter(services);
    initializeChatRouter(services);

  } catch (error) {
    logger.error('服务初始化失败:', error);
    throw error;
  }
}

/**
 * 注册API路由
 */
function registerRoutes() {
  // 静态文件服务 - 头像
  const path = require('path');
  app.use('/avatars', express.static(path.join(__dirname, '../data/avatars')));

  // API路由 - 认证路由需要rate limiting保护
  app.use('/api/auth/login', authRateLimiter.middleware());
  app.use('/api/auth/register', authRateLimiter.middleware());
  app.use('/api/auth', authRouter); // 认证路由

  // 通用API rate limiting
  app.use('/api', apiRateLimiter.middleware());
  app.use('/api/user-data', require('./routes/user-data.cjs')); // 用户数据路由
  app.use('/api/profile', require('./routes/profile.cjs')); // 用户资料路由
  app.use('/api/analytics', require('./routes/analytics.cjs')); // 数据分析路由
  // app.use('/api/images', require('./routes/images.cjs')); // 图片上传和分析路由 - 已删除（功能已集成到chat附件系统）
  // app.use('/api/voice', require('./routes/voice.cjs')); // 语音输入输出路由 - 已删除
  app.use('/api/files', require('./routes/files.cjs')); // 文件上传和解析路由
  app.use('/api/knowledge', require('./routes/knowledge.cjs')); // 知识库（RAG）路由
  app.use('/api/personas', require('./routes/personas.cjs')); // AI 角色预设路由
  app.use('/api/workflows', require('./routes/workflows.cjs')); // AI 工作流编排路由
  app.use('/api/agents', require('./routes/agents.cjs')); // 智能 Agent 路由
  // app.use('/api/context', require('./routes/context.cjs')); // 对话上下文优化路由 - 已删除
  // app.use('/api/summary', require('./routes/summary.cjs')); // 智能对话总结路由 - 已删除
  app.use('/api/templates', require('./routes/templateMarketplace.cjs')); // 模板市场路由
  app.use('/api', require('./routes/importExport.cjs')); // 导入导出增强路由
  app.use('/api/notes', require('./routes/notes.cjs')); // 笔记管理路由
  app.use('/api/documents', require('./routes/documents.cjs')); // 文档管理路由
  app.use('/api/password-vault', require('./routes/password-vault.cjs')); // 密码保险库路由
  app.use('/api/mcp', mcpRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/proxy', proxyRouter);
  app.use('/api/test-connection', require('./routes/test-connection.cjs')); // API连接测试路由
  app.use('/api/config', require('./routes/config.cjs'));
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: 'AI-Life-System Backend',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      mcp: '/api/mcp'
    }
  });
});

/**
 * 启动服务器
 */
async function start() {
  try {
    // 1. 验证环境变量配置
    logger.info('验证环境配置...');
    validateEnvOnStartup();
    printEnvSummary();

    // 2. 初始化数据库
    logger.info('初始化数据库...');
    const { initDatabase } = require('./db/init.cjs');
    await initDatabase();
    logger.info('✅ 数据库初始化完成');

    // 初始化服务
    await initializeServices();

    // 注册路由
    registerRoutes();

    // 404 处理 - 必须在所有路由之后注册
    app.use((req, res) => {
      res.status(404).json({
        error: '接口不存在',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });

    // 错误处理 - 必须在最后
    app.use(errorHandler);

    // 启动HTTP服务器
    const port = config.server.port;
    const host = config.server.host;

    app.listen(port, host, () => {
      logger.info(`✅ 服务器已启动: http://${host}:${port}`);
      logger.info(`✅ 已加载 ${Object.keys(services).length} 个MCP服务`);

      // 打印启用的服务
      const enabledServices = Object.values(services)
        .filter(s => s.enabled)
        .map(s => s.name);
      logger.info(`✅ 已启用服务: ${enabledServices.join(', ')}`);
    });

  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  logger.info('收到SIGINT信号,正在关闭服务器...');

  // 停止所有原有服务
  for (const service of Object.values(services)) {
    if (service !== mcpManager && service.enabled && service.disable) {
      service.disable();
    }
  }

  // 停止所有 MCP 服务
  if (mcpManager) {
    await mcpManager.stopAll();
  }

  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('收到SIGTERM信号,正在关闭服务器...');

  // 停止所有原有服务
  for (const service of Object.values(services)) {
    if (service !== mcpManager && service.enabled && service.disable) {
      service.disable();
    }
  }

  // 停止所有 MCP 服务
  if (mcpManager) {
    await mcpManager.stopAll();
  }

  process.exit(0);
});

// 启动服务器
if (require.main === module) {
  start();
}

module.exports = { app, services };

