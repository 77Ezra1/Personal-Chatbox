# AI-Agent 配置指南

## 无需修改配置文件！

AI-Agent 功能完全支持在前端界面配置，**无需修改任何配置文件或环境变量**。所有配置都通过用户友好的界面完成。

## 配置步骤

### 1. 访问设置页面

1. 打开应用（http://localhost:5177）
2. 点击右上角的设置图标 ⚙️
3. 或使用快捷键打开设置

### 2. 配置 API 密钥

#### 方式一：通过 API Keys 标签页

1. 在设置页面，点击 **"API Keys"** 标签
2. 找到需要的服务（OpenAI、DeepSeek等）
3. 点击"配置"或"修改配置"按钮
4. 填写 API 密钥信息：
   - **API Key**: 从服务商获取的密钥
   - **Base URL**: （可选）自定义API端点
   - **其他参数**: 根据服务要求填写

5. 点击"测试连接"验证配置
6. 点击"保存"保存配置

#### 方式二：通过模型配置

1. 在设置页面，点击 **"Model Configuration"** 标签
2. 选择提供商（OpenAI、DeepSeek等）
3. 填写 API 密钥
4. 保存配置

### 3. 启用加密保护（可选但推荐）

为了保护您的 API 密钥安全，建议启用加密：

1. 在 **API Keys** 标签页
2. 找到"加密保护"面板
3. 开启加密开关
4. 设置一个强密码（用于加密您的API密钥）
5. 确认密码

**加密特性**：
- ✅ AES-256-GCM 加密算法
- ✅ 本地加密存储
- ✅ 会话超时自动锁定（15分钟）
- ✅ 支持密码修改
- ✅ 可以随时禁用加密

### 4. 配置Agent使用这些密钥

**Agent会自动使用您配置的API密钥！**无需额外设置。

当您创建或执行Agent任务时：
1. 系统自动读取您配置的API密钥
2. 优先使用用户配置的密钥
3. 如果用户未配置，则回退到环境变量（如果有）
4. 如果都没有，会返回模拟响应并提示配置API密钥

## 支持的服务

### OpenAI
- **名称**: OpenAI
- **需要**: API Key
- **获取**: https://platform.openai.com/api-keys
- **用途**: GPT-3.5, GPT-4, GPT-4o等模型

### DeepSeek
- **名称**: DeepSeek
- **需要**: API Key
- **获取**: https://platform.deepseek.com
- **用途**: DeepSeek Chat 模型

### 其他服务
系统支持扩展更多AI服务，配置方式相同。

## 配置存储位置

您的配置安全地存储在：
- **位置**: `data/user-config.json`
- **加密数据**: 存储在浏览器 localStorage（如果启用加密）
- **权限**: 仅当前用户可访问

## 使用Agent

### 创建Agent

1. 访问 `/agents` 页面
2. 点击"Create Agent"
3. 填写Agent信息：
   - 名称、描述
   - 选择能力（research, analysis, writing等）
   - 选择工具（web_search, ai_analysis等）
   - 配置高级选项（模型、温度等）
4. 保存

### 执行任务

1. 在Agent列表中找到您的Agent
2. 点击"Execute Task"按钮
3. 输入任务描述
4. 点击"Execute Task"开始执行

**Agent会自动使用您在设置中配置的API密钥！**

## 配置验证

### 检查配置是否生效

1. 打开设置页面
2. 查看API Keys标签页
3. 已配置的服务会显示"已配置"标记
4. 可以点击"测试连接"验证

### 查看Agent使用的配置

执行Agent任务时，系统日志会显示：
```
[AI Service] OpenAI initialized with user config
```
或
```
[AI Service] OpenAI API key not configured
```

## 常见问题

### Q: 我必须在.env文件中配置API密钥吗？

**A: 不需要！** 您可以完全通过前端界面配置。但如果您在.env中有配置，它会作为后备选项。

### Q: 加密安全吗？

**A: 是的。** 我们使用 AES-256-GCM 加密算法，这是军事级别的加密标准。您的密码不会被存储，只有您知道。

### Q: 忘记加密密码怎么办？

**A:** 您需要重新配置API密钥。建议：
1. 禁用加密（需要知道密码）
2. 或删除加密数据，重新配置

### Q: 多个用户如何管理配置？

**A:** 目前配置是全局的。多用户支持正在开发中。

### Q: 可以为不同的Agent使用不同的API密钥吗？

**A:** 目前Agent使用全局配置的API密钥。未来版本将支持Agent级别的API密钥配置。

### Q: 配置会丢失吗？

**A:** 不会。配置保存在本地文件系统，除非手动删除。

### Q: 如何备份我的配置？

**A:** 复制 `data/user-config.json` 文件即可。

## 最佳实践

### 1. 使用加密
始终启用API密钥加密，保护您的账户安全。

### 2. 定期测试连接
在配置页面测试API连接，确保密钥有效。

### 3. 最小权限原则
使用具有最小必要权限的API密钥。

### 4. 定期轮换密钥
定期更换API密钥以提高安全性。

### 5. 监控使用情况
在服务商dashboard中监控API使用情况和费用。

## 配置API示例

### 通过API配置密钥（高级用户）

```bash
# 配置 OpenAI API Key
curl -X POST http://localhost:3001/api/config/api-key \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "provider": "openai",
    "apiKey": "sk-your-openai-key"
  }'

# 测试 API 密钥
curl -X POST http://localhost:3001/api/config/test-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "provider": "openai",
    "apiKey": "sk-your-openai-key"
  }'
```

### 获取当前配置

```bash
curl http://localhost:3001/api/config/current \
  -H "Authorization: Bearer YOUR_TOKEN"
```

响应示例：
```json
{
  "openai": {
    "enabled": true,
    "model": "gpt-3.5-turbo",
    "hasApiKey": true
  },
  "deepseek": {
    "enabled": false,
    "model": "deepseek-chat",
    "hasApiKey": false
  }
}
```

## 技术细节

### 配置加载顺序

Agent执行任务时，API密钥加载优先级：
1. **用户配置** - 从 `data/user-config.json` 读取
2. **环境变量** - 从 `.env` 文件读取
3. **默认值** - 返回模拟响应

### 代码示例

```javascript
// AIService 自动处理配置加载
class AIService {
  constructor(userId = null) {
    this.userId = userId;
  }

  async initializeServices() {
    // 优先加载用户配置
    const config = await configManager.loadUserConfig(this.userId);
    const apiKey = config?.openai?.apiKey || process.env.OPENAI_API_KEY;

    // 使用配置初始化
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }
}
```

## 总结

✅ **无需修改配置文件** - 完全通过界面配置
✅ **安全加密存储** - AES-256加密保护
✅ **自动使用** - Agent自动读取您的配置
✅ **灵活回退** - 支持环境变量作为备选
✅ **简单直观** - 友好的用户界面

开始使用Agent前，只需在设置页面配置您的API密钥即可！
