import React, { useState } from 'react'
import { X, Plus, Search, ExternalLink, Info, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

/**
 * 添加 MCP 服务对话框
 * 支持从模板添加或手动配置
 */
export function AddMcpServiceDialog({ isOpen, onClose, templates, categories, onAdd }) {
  const [activeTab, setActiveTab] = useState('templates') // templates or custom
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [envVars, setEnvVars] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 手动配置表单
  const [customConfig, setCustomConfig] = useState({
    mcp_id: '',
    name: '',
    description: '',
    category: 'other',
    icon: '🔧',
    command: 'npx',
    args: '',
    env_vars: '',
    features: ''
  })

  if (!isOpen) return null

  // 过滤模板
  const filteredTemplates = templates.filter(t => {
    const matchCategory = selectedCategory === 'all' || t.category === selectedCategory
    const matchSearch = !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  // 处理从模板添加
  const handleAddFromTemplate = async (template) => {
    try {
      setLoading(true)
      setError(null)

      // 检查是否需要环境变量
      const requiredEnvVars = template.env ? Object.keys(template.env) : []

      if (requiredEnvVars.length > 0) {
        // 显示环境变量配置界面
        setSelectedTemplate(template)
        setEnvVars(template.env || {})
        setLoading(false)
        return
      }

      // 直接添加
      await onAdd(template.id, {})
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 确认添加（配置环境变量后）
  const handleConfirmAdd = async () => {
    try {
      setLoading(true)
      setError(null)

      await onAdd(selectedTemplate.id, envVars)
      setSelectedTemplate(null)
      setEnvVars({})
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 取消环境变量配置
  const handleCancelEnvConfig = () => {
    setSelectedTemplate(null)
    setEnvVars({})
    setError(null)
  }

  // 处理手动配置提交
  const handleCustomSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      // 验证必填字段
      if (!customConfig.mcp_id || !customConfig.name || !customConfig.command) {
        throw new Error('请填写所有必填字段')
      }

      // 解析参数和环境变量
      let args = []
      let env_vars = {}
      let features = []

      try {
        if (customConfig.args) {
          args = JSON.parse(customConfig.args)
          if (!Array.isArray(args)) {
            throw new Error('参数必须是数组格式')
          }
        }
      } catch (e) {
        throw new Error('参数格式错误：' + e.message)
      }

      try {
        if (customConfig.env_vars) {
          env_vars = JSON.parse(customConfig.env_vars)
          if (typeof env_vars !== 'object' || Array.isArray(env_vars)) {
            throw new Error('环境变量必须是对象格式')
          }
        }
      } catch (e) {
        throw new Error('环境变量格式错误：' + e.message)
      }

      try {
        if (customConfig.features) {
          features = JSON.parse(customConfig.features)
          if (!Array.isArray(features)) {
            throw new Error('功能列表必须是数组格式')
          }
        }
      } catch (e) {
        throw new Error('功能列表格式错误：' + e.message)
      }

      // 构建配置对象
      const configData = {
        mcp_id: customConfig.mcp_id,
        name: customConfig.name,
        description: customConfig.description,
        category: customConfig.category,
        icon: customConfig.icon,
        command: customConfig.command,
        args: args,
        env_vars: env_vars,
        features: features,
        official: false,
        popularity: 'medium'
      }

      // 调用API创建配置
      const response = await fetch('/api/mcp/user-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configData)
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || '创建失败')
      }

      // 重置表单
      setCustomConfig({
        mcp_id: '',
        name: '',
        description: '',
        category: 'other',
        icon: '🔧',
        command: 'npx',
        args: '',
        env_vars: '',
        features: ''
      })

      // 关闭对话框
      onClose()

      // 提示成功
      alert('自定义 MCP 服务创建成功！')

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 重置自定义配置
  const handleResetCustomConfig = () => {
    setCustomConfig({
      mcp_id: '',
      name: '',
      description: '',
      category: 'other',
      icon: '🔧',
      command: 'npx',
      args: '',
      env_vars: '',
      features: ''
    })
    setError(null)
  }

  // 渲染环境变量配置
  if (selectedTemplate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedTemplate.icon}</span>
              <div>
                <h2 className="text-xl font-semibold">配置 {selectedTemplate.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  填写必要的配置信息以启用此服务
                </p>
              </div>
            </div>
            <button
              onClick={handleCancelEnvConfig}
              className="p-1 rounded-md hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 服务描述 */}
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm">{selectedTemplate.description}</p>
            </div>

            {/* 环境变量配置 */}
            <div className="space-y-4">
              <h3 className="font-medium">环境变量配置</h3>

              {Object.keys(selectedTemplate.env || {}).map(key => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    {key}
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type={key.toLowerCase().includes('token') || key.toLowerCase().includes('key') || key.toLowerCase().includes('password') ? 'password' : 'text'}
                    placeholder={`请输入 ${key}`}
                    value={envVars[key] || ''}
                    onChange={(e) => setEnvVars({ ...envVars, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            {/* 设置说明 */}
            {selectedTemplate.setupInstructions && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">设置说明</h4>
                    <pre className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap font-sans">
                      {selectedTemplate.setupInstructions.zh || selectedTemplate.setupInstructions.en}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* 文档链接 */}
            {selectedTemplate.documentation && (
              <a
                href={selectedTemplate.documentation}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                查看官方文档
              </a>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
            <button
              onClick={handleCancelEnvConfig}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              onClick={handleConfirmAdd}
              disabled={loading || Object.values(envVars).some(v => !v)}
              className="px-4 py-2 text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '添加中...' : '确认添加'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 主对话框
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">添加 MCP 服务</h2>
            <p className="text-sm text-muted-foreground mt-1">
            从模板库选择服务或手动配置自定义服务
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-accent transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'templates'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              从模板添加
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'custom'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              手动配置
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'templates' ? (
            <div className="p-6 space-y-6">
              {/* 工具栏 */}
              <div className="flex gap-3">
                {/* 分类筛选 */}
                <div className="inline-flex rounded-lg border p-1 bg-muted/30 overflow-x-auto">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-background shadow-sm font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    全部
                  </button>
                  {Object.entries(categories || {}).map(([id, cat]) => (
                    <button
                      key={id}
                      onClick={() => setSelectedCategory(id)}
                      className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
                        selectedCategory === id
                          ? 'bg-background shadow-sm font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>

                {/* 搜索 */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索服务..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              {/* 模板列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onAdd={() => handleAddFromTemplate(template)}
                    loading={loading}
                  />
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>没有找到匹配的服务模板</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">基本信息</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        服务 ID <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="例如: my-custom-service"
                        value={customConfig.mcp_id}
                        onChange={(e) => setCustomConfig({ ...customConfig, mcp_id: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">唯一标识，只能包含字母、数字、下划线和连字符</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        服务名称 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="例如: 我的自定义服务"
                        value={customConfig.name}
                        onChange={(e) => setCustomConfig({ ...customConfig, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">服务描述</label>
                    <textarea
                      placeholder="描述这个服务的功能和用途..."
                      value={customConfig.description}
                      onChange={(e) => setCustomConfig({ ...customConfig, description: e.target.value })}
                      className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">分类</label>
                      <select
                        value={customConfig.category}
                        onChange={(e) => setCustomConfig({ ...customConfig, category: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {Object.entries(categories || {}).map(([id, cat]) => (
                          <option key={id} value={id}>{cat.icon} {cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">图标</label>
                      <Input
                        placeholder="🔧"
                        value={customConfig.icon}
                        onChange={(e) => setCustomConfig({ ...customConfig, icon: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">使用一个表情符号作为图标</p>
                    </div>
                  </div>
                </div>

                {/* 命令配置 */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">命令配置</h3>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      执行命令 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="例如: npx, node, python"
                      value={customConfig.command}
                      onChange={(e) => setCustomConfig({ ...customConfig, command: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">用于启动服务的命令</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">命令参数（JSON 数组）</label>
                    <textarea
                      placeholder='例如: ["-y", "@modelcontextprotocol/server-github"]'
                      value={customConfig.args}
                      onChange={(e) => setCustomConfig({ ...customConfig, args: e.target.value })}
                      className="w-full min-h-[60px] px-3 py-2 text-sm font-mono rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground">必须是有效的 JSON 数组格式，留空表示无参数</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">环境变量（JSON 对象）</label>
                    <textarea
                      placeholder='例如: {"API_KEY": "your-key", "TIMEOUT": "30000"}'
                      value={customConfig.env_vars}
                      onChange={(e) => setCustomConfig({ ...customConfig, env_vars: e.target.value })}
                      className="w-full min-h-[80px] px-3 py-2 text-sm font-mono rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground">必须是有效的 JSON 对象格式，留空表示无环境变量</p>
                  </div>
                </div>

                {/* 功能列表 */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">功能列表（可选）</h3>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">功能描述（JSON 数组）</label>
                    <textarea
                      placeholder='例如: ["文件读写", "目录管理", "文件搜索"]'
                      value={customConfig.features}
                      onChange={(e) => setCustomConfig({ ...customConfig, features: e.target.value })}
                      className="w-full min-h-[60px] px-3 py-2 text-sm font-mono rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground">必须是有效的 JSON 数组格式</p>
                  </div>
                </div>

                {/* 错误提示 */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={handleResetCustomConfig}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    重置
                  </button>
                  <button
                    onClick={handleCustomSubmit}
                    disabled={loading || !customConfig.mcp_id || !customConfig.name || !customConfig.command}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '创建中...' : '创建服务'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 模板卡片组件
 */
function TemplateCard({ template, onAdd, loading }) {
  const popularityColors = {
    high: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    medium: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    low: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30'
  }

  const popularityLabels = {
    high: '热门',
    medium: '推荐',
    low: '冷门'
  }

  return (
    <div className="border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-3xl flex-shrink-0">{template.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{template.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {template.official && (
                <Badge variant="secondary" className="text-xs">官方</Badge>
              )}
              <Badge
                variant="outline"
                className={`text-xs ${popularityColors[template.popularity] || popularityColors.medium}`}
              >
                {popularityLabels[template.popularity] || '推荐'}
              </Badge>
            </div>
          </div>
        </div>
        <button
          onClick={onAdd}
          disabled={loading}
          className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          添加
        </button>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
        {template.description}
      </p>

      {template.features && template.features.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {template.features.slice(0, 4).map((feature, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
          {template.features.length > 4 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              +{template.features.length - 4}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

