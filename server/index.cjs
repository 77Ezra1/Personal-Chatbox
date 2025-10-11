/**
 * AI-Life-System 后端服务器
 */

const express = require('express');
const cors = require('cors');
const config = require('./config.cjs');
const logger = require('./utils/logger.cjs');
const { errorHandler } = require('./utils/errors.cjs');
const { router: mcpRouter, initializeRouter } = require('./routes/mcp.cjs');
const proxyRouter = require('./routes/proxy.cjs');

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

// 创建Express应用
const app = express();

// 中间件
app.use(express.json());
app.use(cors(config.server.cors));

// 日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// 服务实例
const services = {};

/**
 * 初始化所有服务
 */
async function initializeServices() {
  logger.info('初始化MCP服务...');
  
  try {
    // 创建服务实例
    services.weather = new WeatherService(config.services.weather);
    services.time = new TimeService(config.services.time);
    services.search = new SearchService(config.services.search); // DuckDuckGo搜索
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
    
    // 初始化自动加载的服务
    for (const [id, service] of Object.entries(services)) {
      // 检查服务是否启用并需要初始化
      if (service.enabled && service.initialize) {
        logger.info(`自动加载服务: ${service.name}`);
        try {
          await service.initialize();
        } catch (error) {
          logger.error(`服务${service.name}初始化失败:`, error);
          // 继续初始化其他服务
        }
      }
    }
    
    logger.info('服务初始化完成');
    
    // 初始化路由
    initializeRouter(services);
    
  } catch (error) {
    logger.error('服务初始化失败:', error);
    throw error;
  }
}

// API路由
app.use('/api/mcp', mcpRouter);
app.use('/api/proxy', proxyRouter);

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

// 错误处理
app.use(errorHandler);

/**
 * 启动服务器
 */
async function start() {
  try {
    // 初始化服务
    await initializeServices();
    
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
  
  // 停止所有服务
  for (const service of Object.values(services)) {
    if (service.enabled) {
      service.disable();
    }
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('收到SIGTERM信号,正在关闭服务器...');
  
  // 停止所有服务
  for (const service of Object.values(services)) {
    if (service.enabled) {
      service.disable();
    }
  }
  
  process.exit(0);
});

// 启动服务器
if (require.main === module) {
  start();
}

module.exports = { app, services };

