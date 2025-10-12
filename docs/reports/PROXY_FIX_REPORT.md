## Personal Chatbox 代理配置加载失败修复报告

**版本**: 1.1
**日期**: 2025-10-12

### 1. 问题描述

用户报告称,在配置代理并重启服务后,代理设置页面出现 `未知的服务: proxy` 错误,同时浏览器控制台显示 `500 Internal Server Error` 和 `ERR_CONNECTION_REFUSED` 错误,导致需要代理的 MCP 服务(如 Wikipedia)无法正常使用。

### 2. 根本原因分析

经过深入的代码审查和多轮测试,我们定位到问题的根源在于**配置文件的兼容性问题**。

1.  **旧版配置文件缺失 `proxy` 字段**: 当应用从一个没有代理功能的旧版本升级后,本地存储的配置文件 `data/config.json` 中并不包含 `services.proxy` 这个配置项。

2.  **`updateService` 方法的检查过于严格**: 后端的 `config-storage.cjs` 模块中的 `updateService` 方法在更新配置前,会检查 `this.config.services[serviceKey]` 是否存在。如果用户尝试保存一个在旧配置文件中不存在的服务(如此处的 `proxy`),该方法会直接抛出 `未知的服务` 错误,导致后端API返回500错误,前端显示错误信息。

3.  **`load` 方法未能向后兼容**: `config-storage.cjs` 中的 `load` 方法在加载现有配置文件时,没有将旧配置与最新的默认配置结构进行合并。这导致了在旧配置文件存在的情况下,新的配置项(如 `proxy`)无法被自动注入到配置对象中。

### 3. 解决方案与实施

为了彻底解决此问题并增强系统的健壮性,我们实施了以下修复:

**核心修复**: 修改 `server/services/config-storage.cjs` 文件中的 `load` 方法,增加**配置合并与迁移逻辑**。

**旧的 `load` 方法**:
```javascript
async load() {
  try {
    const data = await fs.readFile(this.configFile, 'utf8');
    const encrypted = JSON.parse(data);
    this.config = this.decryptConfig(encrypted);
  } catch (error) {
    // ... 错误处理
  }
}
```

**新的 `load` 方法 (已修复)**:
```javascript
async load() {
  try {
    const data = await fs.readFile(this.configFile, 'utf8');
    let loadedConfig = JSON.parse(data);
    loadedConfig = this.decryptConfig(loadedConfig);

    // 关键修复: 将加载的配置与默认配置深度合并
    const defaultConfig = this.getDefaultConfig();
    const mergedServices = { ...defaultConfig.services, ...(loadedConfig.services || {}) };
    this.config = { ...defaultConfig, ...loadedConfig, services: mergedServices };

    console.log('[ConfigStorage] 配置加载并合并成功');
  } catch (error) {
    // ... 错误处理,在失败时使用默认配置
    this.config = this.getDefaultConfig();
  }
}
```

**修复逻辑解释**:

1.  **读取旧配置**: 正常从 `config.json` 文件加载用户现有的配置。
2.  **获取新模板**: 获取当前最新版本的默认配置 (`getDefaultConfig()`),其中包含了所有服务(包括 `proxy`)的最新结构。
3.  **深度合并**: 将用户加载的配置与默认配置模板进行深度合并。这确保了即使用户的配置文件是旧版本的,所有新的配置项也会被安全地添加进去,并保留用户已有的设置。
4.  **保证兼容性**: 通过此方法,无论用户从哪个版本升级而来,系统在内存中使用的配置对象 `this.config` 始终是完整和最新的,从而避免了因缺少字段而引发的各类错误。

### 4. 验证与测试

我们执行了以下测试以确保修复的有效性:

1.  **单元测试**: 创建了 `test-proxy-flow.cjs` 脚本,模拟了从配置加载到 MCP 服务启动的完整流程,验证了代理环境变量能够被正确传递给子进程。
2.  **集成测试**: 确认了 `GET /api/proxy/config` 和 `POST /api/proxy/config` 两个API接口在修复后均能正常工作,不再抛出 `500` 错误。
3.  **兼容性测试**: 模拟了从一个不包含 `proxy` 配置的旧 `config.json` 文件启动的场景,验证了新逻辑能够成功合并配置,且代理功能可以被正常启用和保存。

所有测试均已通过,证明本次修复是成功和可靠的。

### 5. 结论与建议

本次修复从根本上解决了因配置文件版本不兼容导致的代理加载失败问题。我们建议用户执行以下操作:

1.  **重启后端服务**: 这是应用修复后代码的必要步骤。
2.  **验证代理功能**: 重启后,请进入 **设置 -> Proxy Settings**, 启用代理并点击 **测试连接**。如果您的 Clash 或其他代理工具正在运行,应该会看到连接成功的提示。
3.  **使用外部服务**: 尝试使用需要代理的 MCP 服务(如 Wikipedia),验证其是否可以正常工作。

我们对因此问题给您带来的不便深表歉意,并感谢您的耐心与您的反馈帮助我们提升了产品的稳定性。
