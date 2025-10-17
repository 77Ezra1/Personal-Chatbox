-- 用户自定义MCP配置表
-- 允许用户自定义添加和配置MCP服务

CREATE TABLE IF NOT EXISTS user_mcp_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,

  -- MCP服务基本信息
  mcp_id TEXT NOT NULL,                    -- MCP服务ID(如github, slack等)
  enabled BOOLEAN DEFAULT 0,                -- 是否启用
  name TEXT NOT NULL,                       -- 服务显示名称
  description TEXT,                         -- 服务描述
  category TEXT,                            -- 分类(development, database, cloud等)
  icon TEXT,                                -- 图标emoji

  -- 配置信息
  command TEXT NOT NULL,                    -- 执行命令(如npx, node等)
  args TEXT,                                -- 命令参数(JSON数组格式)
  env_vars TEXT,                            -- 环境变量(JSON对象格式)
  config_data TEXT,                         -- 其他配置数据(JSON格式)

  -- 元数据
  official BOOLEAN DEFAULT 0,               -- 是否官方服务
  popularity TEXT DEFAULT 'medium',         -- 热门程度(high, medium, low)
  features TEXT,                            -- 功能列表(JSON数组)
  setup_instructions TEXT,                  -- 安装说明(JSON对象,支持中英文)
  documentation TEXT,                       -- 文档链接

  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 约束
  UNIQUE(user_id, mcp_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_mcp_user_id ON user_mcp_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mcp_enabled ON user_mcp_configs(enabled);
CREATE INDEX IF NOT EXISTS idx_user_mcp_category ON user_mcp_configs(category);

-- 为已存在的用户插入默认的MCP模板(从mcp-templates.json导入)
-- 注意:这些是模板,用户可以根据需要启用和配置

-- 更新触发器
CREATE TRIGGER IF NOT EXISTS update_user_mcp_timestamp
AFTER UPDATE ON user_mcp_configs
BEGIN
  UPDATE user_mcp_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
